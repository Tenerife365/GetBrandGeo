/**
 * mcp_server.test.js: the remote MCP server (netlify/functions/mcp-server.js)
 * end to end against the in-memory Supabase fake. Contract:
 * docs/arch/mcp-access.md section 10.
 *
 * Covers: JSON-RPC envelope and HTTP methods, key authentication, the Radar
 * plan gate, the research gate, cross-client isolation, error rows, no-answer
 * rows, engine entitlement, caps and cursors, the scan ceiling, both rate
 * limits, the last_used_at throttle, structuredContent parity, and that no key
 * or key hash ever reaches a log line. Ends with the plan-agreement check
 * between _plans.js mcpAllowedFor() and planConfig.ts hasFeature().
 *
 * Run: `node tests/mcp_server.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')

// ── capture every log line for the no-secret assertion at the end ───────────
const captured = []
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
  const orig = console[level].bind(console)
  console[level] = (...a) => { captured.push(a.map((x) => (typeof x === 'string' ? x : (x && x.stack) || JSON.stringify(x))).join(' ')); orig(...a) }
}

const { requireTsFresh } = require('./helpers/ts_require')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const FN = path.join(__dirname, '..', 'netlify', 'functions')
const mcp = require(path.join(FN, 'mcp-server.js'))
const keys = require(path.join(FN, '_client_api_key.js'))
const plans = require(path.join(FN, '_plans.js'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

const T0 = new Date('2026-09-22T10:00:00Z')
let clock = new Date(T0)
const db = createFakeSupabase({ now: () => clock })
const daysAgo = (d) => new Date(T0.getTime() - d * 86400_000).toISOString()

// ── fixtures ─────────────────────────────────────────────────────────────────
const ADMIN = 'aaaaaaaa-0000-4000-8000-000000000001'
const VIEWER = 'aaaaaaaa-0000-4000-8000-000000000002'
db.seed('user_profiles', [{ id: ADMIN, role: 'admin', client_id: null }, { id: VIEWER, role: 'viewer', client_id: 4 }])
db.seed('clients', [
  { id: 1, name: 'Alpha', brand_aliases: ['Alpha', 'AlphaCo'], brand_website: 'alpha.example', plan: 'growth', category: 'active', engines_enabled: null, known_competitors: [] },
  { id: 2, name: 'Bravo', brand_aliases: ['Bravo'], brand_website: 'bravo.example', plan: 'radar', category: 'active', engines_enabled: null, known_competitors: [] },
  { id: 3, name: 'Freebie', brand_aliases: [], brand_website: null, plan: 'free', category: 'active', engines_enabled: null, known_competitors: [] },
  { id: 4, name: 'Study', brand_aliases: [], brand_website: null, plan: 'pro', category: 'research', engines_enabled: null, known_competitors: [] },
  { id: 5, name: 'Charlie', brand_aliases: [], brand_website: null, plan: 'growth', category: 'active', engines_enabled: null, known_competitors: [] },
])

const ALL_SECRETS = []
function issueKey(clientId, { createdBy = VIEWER, revoked = false, rowClientId = clientId } = {}) {
  const secret = keys.makeClientApiKey(clientId)
  ALL_SECRETS.push(secret)
  const [row] = db.seed('client_api_keys', [{
    id: require('crypto').randomUUID(), client_id: rowClientId, key_hash: keys.hashClientApiKey(secret),
    key_prefix: keys.clientApiKeyPrefix(secret), label: 'test', created_by: createdBy,
    last_used_at: null, revoked_at: revoked ? daysAgo(1) : null,
  }]).slice(-1)
  return { secret, row }
}

db.seed('prompts', [
  { id: 1, client_id: 1, text: 'best alpha tool', category: 'general', is_active: true, position: 1 },
  { id: 2, client_id: 1, text: 'alpha vs beta', category: 'general', is_active: true, position: 2 },
  { id: 3, client_id: 1, text: 'alpha pricing', category: 'general', is_active: true, position: 3 },
  { id: 4, client_id: 1, text: 'retired prompt', category: 'general', is_active: false, position: 4 },
  { id: 5, client_id: 2, text: 'bravo secret prompt', category: 'general', is_active: true, position: 1 },
  { id: 6, client_id: 2, text: 'bravo other', category: 'general', is_active: true, position: 2 },
])
const r = (o) => Object.assign({ status: 'ok', brand_position: null, sentiment: 'neutral', response_snippet: 'answer', competitors_mentioned: '[]' }, o)
db.seed('ai_results', [
  r({ id: 1, client_id: 1, prompt_id: 1, llm: 'gemini', brand_mentioned: true, brand_position: 2, sentiment: 'positive', competitors_mentioned: JSON.stringify([{ name: 'Beta Corp', pos: 1 }, { name: 'Gamma Ltd', pos: 99 }]), checked_at: daysAgo(1) }),
  r({ id: 2, client_id: 1, prompt_id: 1, llm: 'claude', brand_mentioned: false, sentiment: 'none', competitors_mentioned: JSON.stringify(['Beta Corp']), checked_at: daysAgo(1) }),
  r({ id: 3, client_id: 1, prompt_id: 2, llm: 'gemini', brand_mentioned: true, brand_position: 1, sentiment: 'negative', checked_at: daysAgo(2) }),
  r({ id: 4, client_id: 1, prompt_id: 2, llm: 'gemini', brand_mentioned: false, response_snippet: '[no_ai_overview] nothing rendered', checked_at: daysAgo(2) }),
  r({ id: 5, client_id: 1, prompt_id: 1, llm: 'gemini', status: 'error', brand_mentioned: true, brand_position: 1, sentiment: 'positive', competitors_mentioned: JSON.stringify(['ErrorCo Inc']), response_snippet: 'ERRORROW', checked_at: daysAgo(1) }),
  r({ id: 6, client_id: 1, prompt_id: 1, llm: 'grok', brand_mentioned: true, brand_position: 1, sentiment: 'positive', competitors_mentioned: JSON.stringify(['GrokOnly Ltd']), response_snippet: 'GROKROW', checked_at: daysAgo(1) }),
  r({ id: 7, client_id: 1, prompt_id: 4, llm: 'gemini', brand_mentioned: true, brand_position: 3, sentiment: 'positive', competitors_mentioned: JSON.stringify(['Retired Co']), checked_at: daysAgo(3) }),
  r({ id: 8, client_id: 1, prompt_id: 1, llm: 'gemini', brand_mentioned: true, brand_position: 5, checked_at: daysAgo(40) }),
  r({ id: 9, client_id: 2, prompt_id: 5, llm: 'gemini', brand_mentioned: true, brand_position: 1, competitors_mentioned: JSON.stringify(['BravoOnly Inc']), response_snippet: 'BRAVOROW', checked_at: daysAgo(1) }),
  r({ id: 10, client_id: 2, prompt_id: 1, llm: 'claude', brand_mentioned: true, brand_position: 1, competitors_mentioned: JSON.stringify(['BravoOnly Inc']), response_snippet: 'BRAVOROW', checked_at: daysAgo(1) }),
])
db.seed('collection_runs', [
  { id: 1, client_id: 1, trigger: 'scheduled', created_at: daysAgo(1) },
  { id: 2, client_id: 2, trigger: 'manual', created_at: daysAgo(0.5) },
])
db.seed('recommendation_runs', [
  { id: 1, client_id: 1, generated_at: daysAgo(10), model: 'm', rec_count: 1 },
  { id: 2, client_id: 1, generated_at: daysAgo(2), model: 'internal-model', rec_count: 2 },
  { id: 3, client_id: 2, generated_at: daysAgo(1), model: 'm', rec_count: 1 },
])
db.seed('recommendations', [
  { id: 1, run_id: 1, client_id: 1, position: 0, title: 'Old A rec', engines: [], priority: 'medium', status: 'new', notes: 'PRIVATE NOTE' },
  { id: 2, run_id: 2, client_id: 1, position: 1, title: 'A rec two', engines: ['gemini'], priority: 'high', status: 'new', notes: 'PRIVATE NOTE' },
  { id: 3, run_id: 2, client_id: 1, position: 0, title: 'A rec one', engines: ['claude'], priority: 'critical', status: 'actioned', actioned_at: daysAgo(1), notes: 'PRIVATE NOTE' },
  { id: 4, run_id: 3, client_id: 2, position: 0, title: 'B secret rec', engines: [], priority: 'high', status: 'new' },
  { id: 5, run_id: 2, client_id: 2, position: 2, title: 'B row on A run', engines: [], priority: 'high', status: 'new' },
])
// Client 5: 250 active prompts for the cap and cursor checks.
db.seed('prompts', Array.from({ length: 250 }, (_, i) => ({ id: 1001 + i, client_id: 5, text: `c prompt ${i}`, category: 'general', is_active: true, position: i })))

const KA = issueKey(1)
const KB = issueKey(2)
const KF = issueKey(3)
const KR_VIEWER = issueKey(4, { createdBy: VIEWER })
const KR_ADMIN = issueKey(4, { createdBy: ADMIN })
const KC = issueKey(5)
const KREVOKED = issueKey(1, { revoked: true })
const KMISMATCH = issueKey(2, { rowClientId: 1 })

// ── call helpers ─────────────────────────────────────────────────────────────
const HIGH = { perKeyPerMinute: 100000, perClientPerDay: 100000 }
let reqN = 0
function ev(body, { key = null, method = 'POST', headers = {}, raw = false, base64 = false } = {}) {
  const h = { 'content-type': 'application/json', ...headers }
  if (key) h.authorization = `Bearer ${key}`
  let b = raw ? body : JSON.stringify(body)
  if (base64) b = Buffer.from(b).toString('base64')
  return { httpMethod: method, path: '/mcp', headers: h, body: b, isBase64Encoded: base64 }
}
async function send(event, { config = HIGH, supabase = db } = {}) {
  const res = await mcp.handle(event, { awsRequestId: `req${++reqN}-xxxxxxxx` }, { supabase, now: () => clock, config })
  let body = null
  if (res.body) body = JSON.parse(res.body)
  return { status: res.statusCode, headers: res.headers || {}, body, rawBody: res.body }
}
const rpc = (method, params, key, opts = {}) => send(ev({ jsonrpc: '2.0', id: opts.id ?? 7, method, ...(params === undefined ? {} : { params }) }, { key, headers: opts.headers || {} }), opts)
const V = { 'MCP-Protocol-Version': '2025-06-18' }
async function tool(name, args, key = KA.secret, opts = {}) {
  const res = await rpc('tools/call', { name, arguments: args }, key, { headers: V, ...opts })
  assert.strictEqual(res.status, 200, JSON.stringify(res.body))
  assert.ok(res.body.result, `expected a result for ${name}: ${JSON.stringify(res.body)}`)
  return res.body.result
}
async function toolOk(name, args, key, opts) {
  const res = await tool(name, args, key, opts)
  assert.ok(!res.isError, `${name} returned isError: ${JSON.stringify(res)}`)
  assert.deepStrictEqual(res.structuredContent, JSON.parse(res.content[0].text))
  return res.structuredContent
}

async function main() {
  section('1. envelope and HTTP methods')
  let res = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } }, KA.secret)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.result.protocolVersion, '2025-06-18')
  assert.deepStrictEqual(res.body.result.capabilities, { tools: { listChanged: false } })
  assert.deepStrictEqual(res.body.result.serverInfo, { name: 'brandgeo', title: 'BrandGEO', version: '1.0.0' })
  assert.ok(res.body.result.instructions.includes('never start a collection'))
  res = await rpc('initialize', { protocolVersion: '2025-03-26' }, KA.secret)
  assert.strictEqual(res.body.result.protocolVersion, '2025-03-26')
  ok('initialize echoes a requested supported version (2025-06-18, 2025-03-26)')
  res = await rpc('initialize', { protocolVersion: '2024-11-05' }, KA.secret)
  assert.strictEqual(res.body.result.protocolVersion, mcp.LATEST_PROTOCOL_VERSION)
  assert.strictEqual(mcp.LATEST_PROTOCOL_VERSION, '2025-11-25')
  ok('an unsupported requested version is answered with LATEST_PROTOCOL_VERSION (2025-11-25)')
  res = await rpc('ping', undefined, KA.secret)
  assert.deepStrictEqual(res.body, { jsonrpc: '2.0', id: 7, result: {} })
  ok('ping answers {}')
  res = await rpc('resources/list', {}, KA.secret)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.error.code, -32601)
  ok('unknown method -32601 (HTTP 200)')
  res = await send(ev([{ jsonrpc: '2.0', id: 1, method: 'ping' }], { key: KA.secret }))
  assert.strictEqual(res.status, 400); assert.strictEqual(res.body.error.code, -32600); assert.strictEqual(res.body.id, null)
  res = await send(ev({ id: 1, method: 'ping' }, { key: KA.secret }))
  assert.strictEqual(res.status, 400); assert.strictEqual(res.body.error.code, -32600)
  ok('batch array and missing jsonrpc: 400 -32600')
  res = await send(ev('{"jsonrpc":"2.0",', { key: KA.secret, raw: true }))
  assert.strictEqual(res.status, 400); assert.strictEqual(res.body.error.code, -32700); assert.strictEqual(res.body.id, null)
  ok('bad JSON: 400 -32700, id null')
  res = await send(ev({ jsonrpc: '2.0', id: 1, method: 'ping', pad: 'x'.repeat(66000) }, { key: KA.secret }))
  assert.strictEqual(res.status, 413); assert.strictEqual(res.body.error.code, -32600); assert.strictEqual(res.body.error.message, 'Request too large')
  ok('body over 64 KB: 413 -32600 "Request too large"')
  for (const m of ['GET', 'DELETE', 'OPTIONS', 'PUT']) {
    res = await send(ev('', { method: m, raw: true, key: KA.secret }))
    assert.strictEqual(res.status, 405, m); assert.strictEqual(res.headers.Allow, 'POST'); assert.strictEqual(res.rawBody, '')
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], undefined)
  }
  ok('GET, DELETE, OPTIONS, PUT: 405, Allow: POST, empty body, no CORS headers')
  const callsBefore = db.calls.length
  res = await send(ev({ jsonrpc: '2.0', method: 'notifications/initialized' }))
  assert.strictEqual(res.status, 202); assert.strictEqual(res.rawBody, '')
  res = await send(ev({ jsonrpc: '2.0', id: 3, result: {} }))
  assert.strictEqual(res.status, 202)
  assert.strictEqual(db.calls.length, callsBefore)
  ok('notification and client response: 202, empty body, no DB call, no key needed')
  res = await send(ev({ jsonrpc: '2.0', id: 9, method: 'ping' }, { key: KA.secret, base64: true }))
  assert.deepStrictEqual(res.body.result, {})
  ok('a base64-encoded body is decoded')
  res = await send(ev({ jsonrpc: '2.0', id: 9, method: 'ping' }, { key: KA.secret, headers: { Origin: 'https://evil.example' } }))
  assert.strictEqual(res.status, 403); assert.strictEqual(res.body.error.code, -32600)
  res = await send(ev({ jsonrpc: '2.0', id: 9, method: 'ping' }, { key: KA.secret, headers: { Origin: 'https://app.getbrandgeo.com' } }))
  assert.strictEqual(res.status, 200)
  ok('a foreign Origin is refused 403 -32600; the app origin and no origin pass')
  res = await rpc('ping', undefined, KA.secret, { headers: { 'MCP-Protocol-Version': '1999-01-01' } })
  assert.strictEqual(res.status, 400); assert.strictEqual(res.body.error.code, -32600)
  res = await rpc('ping', undefined, KA.secret, { headers: { 'mcp-protocol-version': '2025-11-25' } })
  assert.strictEqual(res.status, 200)
  ok('an unsupported MCP-Protocol-Version header is 400 -32600; a supported one passes')

  section('2. authentication')
  const bodies = []
  for (const [label, key] of [['missing', null], ['malformed', 'bgmcp_1_nothex'], ['unknown', keys.makeClientApiKey(1)], ['revoked', KREVOKED.secret], ['client id mismatch', KMISMATCH.secret], ['wrong scheme', null]]) {
    const headers = label === 'wrong scheme' ? { authorization: `Basic ${KA.secret}` } : {}
    res = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key, headers }))
    assert.strictEqual(res.status, 401, label)
    assert.strictEqual(res.headers['WWW-Authenticate'], 'Bearer realm="brandgeo-mcp"')
    bodies.push(res.rawBody)
  }
  assert.ok(bodies.every((b) => b === bodies[0]), 'every 401 body must be identical')
  assert.deepStrictEqual(JSON.parse(bodies[0]), { jsonrpc: '2.0', id: 42, error: { code: -32001, message: 'Invalid or missing BrandGEO API key.' } })
  ok('missing, malformed, unknown, revoked, mismatched and non-Bearer keys: identical 401 bodies with WWW-Authenticate')
  res = await send(ev({ jsonrpc: '2.0', id: 42, method: 'ping' }, { headers: { 'x-api-key': KA.secret } }))
  assert.strictEqual(res.status, 401)
  ok('the x-api-key header is not accepted')

  section('3. plan gate')
  res = await rpc('initialize', { protocolVersion: '2025-06-18' }, KF.secret)
  assert.strictEqual(res.status, 200); assert.ok(res.body.result)
  res = await rpc('tools/list', {}, KF.secret)
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.error.code, -32002)
  assert.strictEqual(res.body.error.message, 'MCP access needs the Radar plan or higher. Upgrade to Radar in your BrandGEO account.')
  assert.deepStrictEqual(res.body.error.data, { required_plan: 'radar', current_plan: 'free', upgrade_url: 'https://app.getbrandgeo.com/account' })
  res = await rpc('tools/call', { name: 'get_brand_overview', arguments: {} }, KF.secret)
  assert.strictEqual(res.body.error.code, -32002)
  assert.ok(!db.rows('affiliate_rate_limits').some((x) => x.key === 'mcp:client:3:day'), 'a gated call must not spend the daily counter')
  ok('free: initialize succeeds, tools/list and tools/call get -32002 with required_plan radar; daily counter untouched')
  res = await rpc('tools/list', {}, KB.secret, { headers: V })
  assert.strictEqual(res.body.result.tools.length, 7)
  ok('radar passes the gate')
  await toolOk('get_brand_overview', {}, KA.secret)
  db.rows('clients').find((c) => c.id === 1).plan = 'free'
  res = await rpc('tools/call', { name: 'get_brand_overview', arguments: {} }, KA.secret)
  assert.strictEqual(res.body.error.code, -32002)
  assert.strictEqual(res.body.error.data.current_plan, 'free')
  db.rows('clients').find((c) => c.id === 1).plan = 'growth'
  await toolOk('get_brand_overview', {}, KA.secret)
  ok('a plan flipped to free on the live row between two calls closes the second call; flipping back reopens it')

  section('4. research clients')
  res = await rpc('tools/list', {}, KR_VIEWER.secret)
  assert.strictEqual(res.body.error.code, -32003)
  assert.strictEqual(res.body.error.message, 'This account is not available over MCP.')
  res = await rpc('tools/call', { name: 'get_brand_overview', arguments: {} }, KR_VIEWER.secret)
  assert.strictEqual(res.body.error.code, -32003)
  const ov = await toolOk('get_brand_overview', {}, KR_ADMIN.secret)
  assert.strictEqual(ov.client_id, 4)
  ok('viewer-issued key on a research client -32003; admin-issued key passes')

  section('5. tools/list shape')
  res = await rpc('tools/list', {}, KA.secret, { headers: V })
  assert.deepStrictEqual(res.body.result.tools.map((t) => t.name), mcp.TOOL_NAMES)
  for (const t of res.body.result.tools) {
    assert.deepStrictEqual(t.annotations, { readOnlyHint: true, idempotentHint: true, openWorldHint: false })
    assert.ok(t.inputSchema && t.inputSchema.type === 'object')
    assert.ok(t.outputSchema && t.outputSchema.type === 'object', `${t.name} outputSchema on 2025-06-18`)
  }
  res = await rpc('tools/list', {}, KA.secret, { headers: { 'MCP-Protocol-Version': '2025-03-26' } })
  assert.ok(res.body.result.tools.every((t) => t.outputSchema === undefined))
  res = await rpc('tools/list', {}, KA.secret)
  assert.ok(res.body.result.tools.every((t) => t.outputSchema === undefined))
  ok('seven tools with read-only annotations; outputSchema on 2025-06-18+, omitted on 2025-03-26 and when no version header is sent')
  res = await rpc('tools/call', { name: 'delete_everything', arguments: {} }, KA.secret)
  assert.strictEqual(res.body.error.code, -32602); assert.deepStrictEqual(res.body.error.data, { tool: 'delete_everything' })
  ok('unknown tool name -32602 with data.tool')

  section('6. numbers: error rows, no-answer rows, engines, window')
  const vis = await toolOk('get_visibility_summary', {})
  assert.deepStrictEqual(vis.overall, { checks: 4, no_answer: 1, answered: 3, mentioned: 2, mention_rate: 0.6667, avg_position: 1.5 })
  const gem = vis.by_engine.find((e) => e.engine === 'gemini')
  assert.deepStrictEqual({ ...gem }, { engine: 'gemini', label: 'Gemini', checks: 3, no_answer: 1, answered: 2, mentioned: 2, mention_rate: 1, avg_position: 1.5 })
  const cla = vis.by_engine.find((e) => e.engine === 'claude')
  assert.strictEqual(cla.mention_rate, 0); assert.strictEqual(cla.avg_position, null)
  assert.strictEqual(vis.by_engine.find((e) => e.engine === 'chatgpt').mention_rate, null)
  assert.deepStrictEqual(vis.by_engine.map((e) => e.engine), ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'])
  assert.deepStrictEqual(vis.latest_snapshot, { pairs: 3, mentioned: 2, mention_rate: 0.6667 })
  assert.strictEqual(vis.window.days, 30); assert.strictEqual(vis.truncated, false)
  ok('visibility: error row (status=error), grok row (not a growth engine), inactive prompt and 40-day-old row all excluded; no-answer row counted in checks and no_answer only')
  const comp = await toolOk('get_competitors', {})
  assert.strictEqual(comp.answered, 3)
  assert.deepStrictEqual(comp.brand, { mentioned: 2, share: 0.6667 })
  assert.deepStrictEqual(comp.competitors.map((c) => [c.name, c.total_mentions, c.ranked_mentions, c.prose_only, c.share]), [['Beta Corp', 2, 1, false, 0.6667], ['Gamma Ltd', 1, 0, true, 0.3333]])
  ok('competitors: aggregateCompetitors ordering, prose_only flag, share over answered; no error-row, grok-row or other-client names')
  const sent = await toolOk('get_sentiment_summary', {})
  assert.deepStrictEqual(sent.overall, { total: 2, positive: 1, neutral: 0, negative: 1, unclassified: 0 })
  ok('sentiment: only mentioned, answered, non-error, entitled rows')
  const pr = await toolOk('get_prompt_results', { prompt_id: 2 })
  assert.deepStrictEqual(pr.results.map((x) => [x.engine, x.no_answer, x.mentioned]), [['gemini', true, false], ['gemini', false, true]])
  const pr1 = await toolOk('get_prompt_results', { prompt_id: 1 })
  assert.deepStrictEqual(pr1.results.map((x) => x.engine).sort(), ['claude', 'gemini'])
  assert.deepStrictEqual(pr1.results.find((x) => x.engine === 'gemini').competitors, ['Beta Corp', 'Gamma Ltd'])
  ok('prompt results: no_answer flagged, error and grok rows absent, competitors parsed')
  const allOut = JSON.stringify([vis, comp, sent, pr, pr1, await toolOk('get_brand_overview', {})])
  for (const bad of ['ERRORROW', 'ErrorCo', 'GROKROW', 'GrokOnly', 'Retired Co']) assert.ok(!allOut.includes(bad), `${bad} leaked into tool output`)
  ok('no error-row or unentitled-engine content in any output')

  section('7. isolation between clients')
  const outs = []
  for (const name of mcp.TOOL_NAMES) outs.push(JSON.stringify(await toolOk(name, name === 'get_prompt_results' ? { prompt_id: 1 } : {})))
  for (const o of outs) {
    for (const bad of ['Bravo', 'BRAVOROW', 'BravoOnly', 'B secret rec', 'B row on A run', 'bravo secret prompt']) assert.ok(!o.includes(bad), `client B data "${bad}" in client A output: ${o}`)
    assert.ok(o.includes('"client_id":1'))
  }
  let e = await tool('get_prompt_results', { prompt_id: 5 })
  assert.strictEqual(e.isError, true); assert.strictEqual(e.content[0].text, 'No prompt with that id on this account.')
  e = await tool('get_prompt_results', { prompt_id: 999999 })
  assert.strictEqual(e.content[0].text, 'No prompt with that id on this account.')
  e = await tool('get_prompt_results', { prompt_id: 1 }, KB.secret)
  assert.strictEqual(e.isError, true)
  const bVis = await toolOk('get_visibility_summary', {}, KB.secret)
  assert.strictEqual(bVis.client_id, 2); assert.strictEqual(bVis.overall.checks, 1)
  ok('every tool with A\'s key returns only A\'s rows; B\'s prompt_id and a non-existent one give the same not-on-this-account error; B sees only B')
  const rec = await toolOk('get_recommendations', {})
  assert.deepStrictEqual(rec.run, { id: 2, generated_at: daysAgo(2), rec_count: 2 })
  assert.deepStrictEqual(rec.items.map((i) => i.title), ['A rec one', 'A rec two'])
  assert.ok(!JSON.stringify(rec).includes('PRIVATE NOTE') && !JSON.stringify(rec).includes('internal-model'))
  const recF = await toolOk('get_recommendations', {}, KC.secret)
  assert.deepStrictEqual([recF.run, recF.items], [null, []])
  ok('recommendations: latest run, ordered by position, notes and model not exposed; none yet is run null, not an error')
  const bo = await toolOk('get_brand_overview', {})
  assert.deepStrictEqual(bo.brand, { name: 'Alpha', aliases: ['Alpha', 'AlphaCo'], website: 'alpha.example' })
  assert.deepStrictEqual(bo.plan, { id: 'growth', label: 'Growth' })
  assert.deepStrictEqual(bo.prompts, { active: 3, total: 4 })
  assert.strictEqual(bo.last_result_at, daysAgo(1))
  assert.deepStrictEqual(bo.last_run, { started_at: daysAgo(1), trigger: 'scheduled' })
  assert.deepStrictEqual(bo.limits, { calls_per_minute_per_key: 100000, calls_per_day: 100000 })
  ok('brand overview: identity, plan label, prompt counts (count/head), freshness from non-error rows')

  section('8. caps, cursors, clamps')
  let lp = await toolOk('list_prompts', {}, KC.secret)
  assert.strictEqual(lp.prompts.length, 200); assert.ok(lp.next_cursor)
  const lp2 = await toolOk('list_prompts', { cursor: lp.next_cursor }, KC.secret)
  assert.strictEqual(lp2.prompts.length, 50); assert.strictEqual(lp2.next_cursor, null)
  assert.strictEqual(new Set([...lp.prompts, ...lp2.prompts].map((p) => p.id)).size, 250)
  ok('250 prompts: 200 plus a next_cursor, the cursor returns the remaining 50, next_cursor null')
  lp = await toolOk('list_prompts', { limit: 999 }, KC.secret)
  assert.strictEqual(lp.prompts.length, 200)
  lp = await toolOk('list_prompts', { active_only: false }, KA.secret)
  assert.deepStrictEqual(lp.prompts.map((p) => p.id), [1, 2, 3, 4])
  ok('limit above max clamps to 200; active_only false includes inactive prompts')
  let w = await toolOk('get_visibility_summary', { window_days: 0 })
  assert.strictEqual(w.window.days, 1)
  w = await toolOk('get_visibility_summary', { window_days: 999 })
  assert.strictEqual(w.window.days, 365)
  assert.strictEqual(w.overall.checks, 5, 'the 40-day-old row is inside a 365-day window')
  ok('window_days 0 and 999 clamp to 1 and 365 and are echoed')
  e = await tool('list_prompts', { cursor: 'not-a-cursor' }, KC.secret)
  assert.strictEqual(e.isError, true); assert.strictEqual(e.content[0].text, 'Invalid cursor')
  e = await tool('get_visibility_summary', { window_days: 'thirty' })
  assert.strictEqual(e.isError, true)
  e = await tool('get_prompt_results', {})
  assert.strictEqual(e.isError, true)
  ok('invalid cursor, wrong-typed window_days and a missing prompt_id are isError results, not protocol errors')
  const pp = await toolOk('get_prompt_results', { prompt_id: 1, limit: 1 })
  assert.strictEqual(pp.results.length, 1); assert.ok(pp.next_cursor)
  const pp2 = await toolOk('get_prompt_results', { prompt_id: 1, limit: 1, cursor: pp.next_cursor })
  assert.strictEqual(pp2.results.length, 1); assert.strictEqual(pp2.next_cursor, null)
  assert.notStrictEqual(pp.results[0].engine, pp2.results[0].engine)
  ok('get_prompt_results keyset cursor pages without overlap')

  section('9. scan ceiling')
  const small = { ...HIGH, scanPage: 2, scanCeiling: 2 }
  const tr = await toolOk('get_visibility_summary', {}, KA.secret, { config: small })
  assert.strictEqual(tr.truncated, true)
  assert.strictEqual(tr.rows_scanned, 2)
  assert.strictEqual(tr.window.effective_from, daysAgo(3))
  assert.notStrictEqual(tr.window.effective_from, tr.window.from)
  ok('with the ceiling injected small: truncated true, rows_scanned 2, effective_from = oldest checked_at scanned')

  section('10. rate limits')
  clock = new Date('2026-09-22T11:00:00Z')
  const KRL = issueKey(2)
  for (let i = 1; i <= 60; i++) {
    res = await rpc('ping', undefined, KRL.secret, { config: {} })
    assert.strictEqual(res.status, 200); assert.ok(res.body.result, `ping ${i}`)
  }
  res = await rpc('ping', undefined, KRL.secret, { config: {} })
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.error.code, -32029)
  assert.deepStrictEqual(res.body.error.data, { retry_after: 60, scope: 'key_minute', limit: 60 })
  assert.strictEqual(res.headers['Retry-After'], '60')
  ok('the 61st request in a minute gets -32029, scope key_minute, retry_after 60 and a Retry-After header (default limit 60)')
  clock = new Date('2026-09-22T11:01:30Z')
  res = await rpc('ping', undefined, KRL.secret, { config: {} })
  assert.deepStrictEqual(res.body.result, {})
  ok('the next minute window opens again')
  // Next UTC day, so client 5's daily counter starts fresh (earlier sections spent it on 09-22).
  clock = new Date('2026-09-23T11:01:30Z')
  const KDAY = issueKey(5)
  const dayCfg = { perKeyPerMinute: 1000, perClientPerDay: 2 }
  await toolOk('list_prompts', { limit: 1 }, KDAY.secret, { config: dayCfg })
  await toolOk('list_prompts', { limit: 1 }, KDAY.secret, { config: dayCfg })
  res = await rpc('ping', undefined, KDAY.secret, { config: dayCfg })
  assert.ok(res.body.result, 'ping does not spend the daily counter')
  res = await rpc('tools/call', { name: 'list_prompts', arguments: {} }, KDAY.secret, { config: dayCfg })
  assert.strictEqual(res.body.error.code, -32029)
  assert.strictEqual(res.body.error.data.scope, 'client_day')
  assert.strictEqual(res.body.error.data.limit, 2)
  assert.strictEqual(res.body.error.data.retry_after, 13 * 3600 - 90)
  assert.strictEqual(res.body.error.message, 'Daily MCP limit reached. It resets at 00:00 UTC.')
  ok('daily counter with a small injected limit: third tools/call gets -32029 scope client_day, retry_after to 00:00 UTC')
  res = await rpc('tools/call', { name: 'list_prompts', arguments: {} }, KF.secret, { config: dayCfg })
  assert.strictEqual(res.body.error.code, -32002)
  assert.ok(!db.rows('affiliate_rate_limits').some((x) => x.key === 'mcp:client:3:day'))
  assert.ok(db.rows('affiliate_rate_limits').some((x) => x.key === `mcp:key:${KF.row.id}`))
  ok('a plan-gated call spends the per-key minute counter but not the daily counter')

  section('11. last_used_at throttle')
  clock = new Date('2026-09-22T12:00:00Z')
  const KLU = issueKey(1)
  const stamps = () => db.calls.filter((c) => c.table === 'client_api_keys' && c.op === 'update').length
  const s0 = stamps()
  await rpc('ping', undefined, KLU.secret)
  assert.strictEqual(stamps() - s0, 1)
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === KLU.row.id).last_used_at, '2026-09-22T12:00:00.000Z')
  clock = new Date('2026-09-22T12:00:10Z')
  await rpc('ping', undefined, KLU.secret)
  assert.strictEqual(stamps() - s0, 1)
  clock = new Date('2026-09-22T12:01:01Z')
  await rpc('ping', undefined, KLU.secret)
  assert.strictEqual(stamps() - s0, 2)
  assert.strictEqual(db.rows('client_api_keys').find((k) => k.id === KLU.row.id).last_used_at, '2026-09-22T12:01:01.000Z')
  ok('two calls 10 s apart write once; a call 61 s after the stamp writes again')

  section('12. structuredContent parity for every tool')
  const argsFor = { get_prompt_results: { prompt_id: 1 } }
  for (const name of mcp.TOOL_NAMES) {
    const out = await tool(name, argsFor[name] || {})
    assert.deepStrictEqual(out.structuredContent, JSON.parse(out.content[0].text), name)
    assert.strictEqual(out.content.length, 1); assert.strictEqual(out.content[0].type, 'text')
    assert.ok(out.structuredContent.client_id === 1 && typeof out.structuredContent.generated_at === 'string', name)
  }
  ok('structuredContent deep-equals JSON.parse(content[0].text), with client_id and generated_at, for all seven tools')

  section('13. failures and logging')
  const boom = { from() { throw new Error(`db exploded near ${KA.secret} hash ${keys.hashClientApiKey(KA.secret)}`) }, rpc() { throw new Error('x') } }
  res = await rpc('ping', undefined, KA.secret, { supabase: boom })
  assert.strictEqual(res.status, 500); assert.strictEqual(res.body.error.code, -32603)
  const missing = createFakeSupabase({ now: () => clock })
  const origFrom = missing.from.bind(missing)
  missing.from = (t) => { const q = origFrom(t); if (t === 'client_api_keys') { q._run = async () => ({ data: null, error: { code: '42P01', message: 'relation "public.client_api_keys" does not exist' } }) } return q }
  res = await rpc('ping', undefined, KA.secret, { supabase: missing })
  assert.strictEqual(res.status, 500); assert.strictEqual(res.body.error.code, -32603)
  ok('an unexpected failure and a missing table answer 500 -32603')
  // F4 regression: the key row is valid but the clients read fails. That is a
  // server fault (500 -32603), never "invalid key" (401).
  const flaky = {
    from(t) {
      const q = db.from(t)
      if (t === 'clients') q._run = async () => ({ data: null, error: { code: '08006', message: 'connection reset by peer' } })
      return q
    },
    rpc(...a) { return db.rpc(...a) },
  }
  res = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: KA.secret }), { supabase: flaky })
  assert.strictEqual(res.status, 500, `clients read error must be 500, got ${res.status} ${res.rawBody}`)
  assert.strictEqual(res.body.error.code, -32603)
  assert.strictEqual(res.headers['WWW-Authenticate'], undefined)
  // A key whose clients row does not exist is still the identical 401 as an unknown key.
  const orphanDb = createFakeSupabase({ now: () => clock })
  const orphanSecret = keys.makeClientApiKey(77)
  ALL_SECRETS.push(orphanSecret)
  orphanDb.seed('client_api_keys', [{
    id: require('crypto').randomUUID(), client_id: 77, key_hash: keys.hashClientApiKey(orphanSecret),
    key_prefix: keys.clientApiKeyPrefix(orphanSecret), label: 'test', created_by: VIEWER, last_used_at: null, revoked_at: null,
  }])
  res = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: orphanSecret }), { supabase: orphanDb })
  assert.strictEqual(res.status, 401)
  assert.strictEqual(res.headers['WWW-Authenticate'], 'Bearer realm="brandgeo-mcp"')
  assert.strictEqual(res.rawBody, bodies[0], 'a missing clients row must answer the same body as an unknown key')
  ok('F4: a clients read error answers 500 -32603; a missing clients row answers the identical 401 as an unknown key')
  res = await rpc(KA.secret, {}, KA.secret)
  assert.strictEqual(res.body.error.code, -32601)
  res = await rpc('tools/call', { name: KA.secret, arguments: { window_days: 3, junk: KA.secret } }, KA.secret)
  assert.strictEqual(res.body.error.code, -32602)
  const lines = captured.filter((l) => l.startsWith('[mcp-server/'))
  assert.ok(lines.length > 100, 'expected one log line per request')
  assert.ok(lines.some((l) => / method=other /.test(l)) && lines.some((l) => / tool=unknown /.test(l)))
  assert.ok(lines.every((l) => /^\[mcp-server\/\S{1,8}\] (client=\S+ method=\S+ tool=\S+ ms=\d+ outcome=\S+|.+)$/.test(l)))
  const hashes = ALL_SECRETS.map(keys.hashClientApiKey)
  const prefixes = ALL_SECRETS.map(keys.clientApiKeyPrefix)
  for (const l of captured) {
    assert.ok(!l.includes('bgmcp_'), `a log line contains bgmcp_: ${l.slice(0, 60)}...`)
    for (const h of hashes) assert.ok(!l.includes(h), 'a log line contains a key hash')
    for (const p of prefixes) assert.ok(!l.includes(p), 'a log line contains a key prefix')
  }
  ok(`${captured.length} captured log lines (including 401s, 500s, a key sent as the method and tool name, and an error message carrying a key): no bgmcp_, no key hash, no prefix`)

  section('14. plan agreement: _plans.js mcpAllowedFor vs planConfig.ts hasFeature')
  const pc = requireTsFresh(path.join(__dirname, '..', 'src', 'lib', 'planConfig.ts'))
  assert.deepStrictEqual(plans.PLAN_ORDER, pc.PLAN_ORDER, 'the two PLAN_ORDER arrays differ')
  assert.ok(pc.FEATURE_MIN_PLAN && pc.FEATURE_MIN_PLAN.mcp_access !== undefined,
    'PENDING DEPENDENCY (bg-app): planConfig.ts has no FEATURE_MIN_PLAN.mcp_access yet')
  for (const p of [...pc.PLAN_ORDER, 'bogus_plan']) {
    assert.strictEqual(plans.mcpAllowedFor(p), pc.hasFeature(p, 'mcp_access'), `disagree on ${p}`)
  }
  assert.strictEqual(pc.featureUnlockPlan('mcp_access'), plans.MCP_MIN_PLAN)
  assert.deepStrictEqual(pc.PLAN_ORDER.filter((p) => plans.mcpAllowedFor(p)), ['radar', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise'])
  ok('mcpAllowedFor(p) === hasFeature(p, "mcp_access") for all eight plans and an unknown string; PLAN_ORDER arrays equal; unlock plan radar')

  console.log(`\n${passed} passed`)
}

main().catch((err) => { console.error('FAILED:', err && err.message); console.error(err && err.stack && err.stack.split('\n').slice(1, 4).join('\n')); process.exit(1) })
