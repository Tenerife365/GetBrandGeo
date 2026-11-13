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
 * between _plans.js mcpAllowedFor() and planConfig.ts hasFeature(). Section 16
 * covers MCP stage 2 (docs/arch/mcp-stage2-fixes.md 9.4): list_fixes parity
 * with the dashboard's own builders, the key scope gate, the write plan gate,
 * refused ids, idempotency, the write counter, the audit row and the log rule.
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
const oauthLib = require(path.join(FN, '_oauth.js'))
// Stage 3 section 3.1: the 401 header for both credential types, and the
// variant a dead OAuth access token gets.
const WWW_401 = 'Bearer resource_metadata="https://app.getbrandgeo.com/.well-known/oauth-protected-resource/mcp", scope="mcp:read mcp:write"'
const WWW_401_INVALID = `${WWW_401}, error="invalid_token"`

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

// Locations (2026-11-13): prompt 1 is asked from 11 (US / NYC), prompt 2 from
// 12 (WW / ALL), prompt 3 from 13 (US / AUS, a research region id not in
// markets.ts), prompt 4 carries 21, a location of client 2, which the
// client_id filter never returns, so its location reads null.
db.seed('prompts', [
  { id: 1, client_id: 1, text: 'best alpha tool', category: 'general', is_active: true, position: 1, location_id: 11 },
  { id: 2, client_id: 1, text: 'alpha vs beta', category: 'general', is_active: true, position: 2, location_id: 12 },
  { id: 3, client_id: 1, text: 'alpha pricing', category: 'general', is_active: true, position: 3, location_id: 13 },
  { id: 4, client_id: 1, text: 'retired prompt', category: 'general', is_active: false, position: 4, location_id: 21 },
  { id: 5, client_id: 2, text: 'bravo secret prompt', category: 'general', is_active: true, position: 1, location_id: 21 },
  { id: 6, client_id: 2, text: 'bravo other', category: 'general', is_active: true, position: 2, location_id: 21 },
])
db.seed('client_locations', [
  { id: 11, client_id: 1, market_id: 'US', region_id: 'NYC', is_primary: false, position: 1, archived_at: null },
  { id: 12, client_id: 1, market_id: 'WW', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
  { id: 13, client_id: 1, market_id: 'US', region_id: 'AUS', is_primary: false, position: 2, archived_at: null },
  { id: 21, client_id: 2, market_id: 'DE', region_id: 'BE', is_primary: true, position: 0, archived_at: null },
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

  // I1 (packet 028): the scheme itself is matched case-insensitively (RFC
  // 7235), and whitespace around the key is still trimmed. Collected rather
  // than asserted per-case (and run before the 401 loop below, which
  // includes a case expected to still fail pre-fix), so a single run
  // reports exactly how many of these fail against the unmodified bearer()
  // (packet 028 acceptance criterion). Every case sets `authorization`
  // directly and passes `key: null` to ev(), since ev()'s key shortcut (the
  // `if (key) h.authorization = \`Bearer ${key}\`` line) would overwrite a
  // lowercase/uppercase scheme with the canonical `Bearer <key>` and defeat
  // the test (pre-read F2, amendment A2).
  const i1Cases = [
    ['lowercase scheme', `bearer ${KA.secret}`, 200],
    ['uppercase scheme', `BEARER ${KA.secret}`, 200],
    ['two spaces after the scheme', `Bearer  ${KA.secret}`, 200],
    ['trailing spaces after the key', `Bearer ${KA.secret}   `, 200],
  ]
  const i1Failures = []
  for (const [label, authHeader, want] of i1Cases) {
    res = await send(ev({ jsonrpc: '2.0', id: 7, method: 'initialize', params: {} }, { key: null, headers: { authorization: authHeader } }))
    if (res.status !== want) i1Failures.push(`${label}: expected ${want}, got ${res.status}`)
  }
  if (i1Failures.length) console.log(`  I1 casing failures observed (${i1Failures.length}/${i1Cases.length}): ${i1Failures.join(' | ')}`)
  assert.strictEqual(i1Failures.length, 0, `I1 casing cases failed: ${i1Failures.join(' | ')}`)
  ok('I1: bearer scheme accepted case-insensitively (bearer/BEARER); two spaces after the scheme and trailing spaces after the key still succeed')

  // I1: bearer() must also reject every scheme-smuggling and whitespace-abuse
  // shape with the identical 401, never a 500 (F4). Added into the existing
  // 401 loop so the identity assertion and the exact-body assertion below
  // cover the new cases too (pre-read amendment A3).
  for (const [label, key, authHeader] of [
    ['missing', null],
    ['malformed', 'bgmcp_1_nothex'],
    ['unknown', keys.makeClientApiKey(1)],
    ['revoked', KREVOKED.secret],
    ['client id mismatch', KMISMATCH.secret],
    ['wrong scheme', null, `Basic ${KA.secret}`],
    ['bare Bearer, nothing after', null, 'Bearer'],
    ['tab-only separator', null, `Bearer\t${KA.secret}`],
    ['no separator', null, `Bearer${KA.secret}`],
    ['Bearerx run-on scheme', null, `Bearerx ${KA.secret}`],
    ['spaces only after the scheme', null, 'Bearer   '],
    ['unknown scheme Token', null, `Token ${KA.secret}`],
    ['duplicate Bearer values joined by a proxy', null, `Bearer ${KA.secret}, Bearer ${KA.secret}`],
    ['trailing garbage after the key', null, `Bearer ${KA.secret} extra`],
    ['array-valued header', null, [`Bearer ${KA.secret}`]],
  ]) {
    const headers = authHeader !== undefined ? { authorization: authHeader } : {}
    res = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key, headers }))
    assert.strictEqual(res.status, 401, label)
    assert.strictEqual(res.headers['WWW-Authenticate'], WWW_401)
    bodies.push(res.rawBody)
  }
  assert.ok(bodies.every((b) => b === bodies[0]), 'every 401 body must be identical')
  assert.deepStrictEqual(JSON.parse(bodies[0]), { jsonrpc: '2.0', id: 42, error: { code: -32001, message: 'Invalid or missing BrandGEO credentials.' } })
  ok('missing, malformed, unknown, revoked, mismatched, non-Bearer, whitespace/separator-smuggling and array-valued keys: identical 401 bodies with WWW-Authenticate')
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
  // Stage 2 added list_fixes for every gated key (mcp-stage2-fixes.md 9.4).
  assert.strictEqual(res.body.result.tools.length, 8)
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
  assert.ok(!res.body.result.tools.some((t) => t.name === 'mark_fix_done'), 'a read key is never offered the write tool')
  ok('eight tools (the seven stage 1 tools plus list_fixes) with read-only annotations, no mark_fix_done for a read key; outputSchema on 2025-06-18+, omitted on 2025-03-26 and when no version header is sent')
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

  // One location per prompt (docs/arch/multi-location-collection.md 5.5).
  const usLabel = require(path.join(__dirname, '..', 'src', 'lib', 'markets.ts')).MARKETS.find((m) => m.id === 'US').label
  lp = await toolOk('list_prompts', { active_only: false }, KA.secret)
  assert.deepStrictEqual(lp.prompts.map((p) => [p.id, p.location]), [
    [1, { id: 11, market_id: 'US', region_id: 'NYC', label: `${usLabel} · New York` }],
    [2, { id: 12, market_id: 'WW', region_id: 'ALL', label: 'Worldwide' }],
    [3, { id: 13, market_id: 'US', region_id: 'AUS', label: `${usLabel} (AUS)` }],
    [4, null],
  ])
  const prLoc = await toolOk('get_prompt_results', { prompt_id: 1 })
  assert.deepStrictEqual(prLoc.prompt.location, { id: 11, market_id: 'US', region_id: 'NYC', label: `${usLabel} · New York` })
  assert.strictEqual((await toolOk('get_prompt_results', { prompt_id: 4 })).prompt.location, null)
  const lpB = await toolOk('list_prompts', {}, KB.secret)
  assert.ok(lpB.prompts.every((p) => p.location && p.location.id === 21 && p.location.label === 'Germany · Berlin'), JSON.stringify(lpB.prompts))
  ok('list_prompts and get_prompt_results carry location { id, market_id, region_id, label } per prompt; an unknown research region reads "Market (ID)"; another client\'s location id reads null; no new input')

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
  ok('structuredContent deep-equals JSON.parse(content[0].text), with client_id and generated_at, for all eight read tools (list_fixes included)')

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
  assert.strictEqual(res.headers['WWW-Authenticate'], WWW_401)
  assert.strictEqual(res.rawBody, bodies[0], 'a missing clients row must answer the same body as an unknown key')
  ok('F4: a clients read error answers 500 -32603; a missing clients row answers the identical 401 as an unknown key')
  res = await rpc(KA.secret, {}, KA.secret)
  assert.strictEqual(res.body.error.code, -32601)
  res = await rpc('tools/call', { name: KA.secret, arguments: { window_days: 3, junk: KA.secret } }, KA.secret)
  assert.strictEqual(res.body.error.code, -32602)
  const lines = captured.filter((l) => l.startsWith('[mcp-server/'))
  assert.ok(lines.length > 100, 'expected one log line per request')
  assert.ok(lines.some((l) => / method=other /.test(l)) && lines.some((l) => / tool=unknown /.test(l)))
  assert.ok(lines.every((l) => /^\[mcp-server\/\S{1,8}\] (client=\S+ cred=(key|oauth|-) method=\S+ tool=\S+ ms=\d+ outcome=\S+|.+)$/.test(l)))
  assert.ok(lines.some((l) => / cred=key method=/.test(l)) && lines.some((l) => / cred=- method=/.test(l)), 'request lines carry cred=key, or cred=- before a credential shape is seen')
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

  section('15. legacy signal pin (protocol version 2026-07-28, packet 028)')
  // Release one stays legacy-only (spec section 14). A modern-era probe must
  // fall back to the legacy handshake: 400 -32600, never one of the SDK's
  // modern-era codes, and it must not touch the per-key rate counter (the
  // version check, step 7, runs before rateCheck -- spec 14.3/14.5, F6).
  const modernProbeBody = {
    jsonrpc: '2.0',
    id: 43,
    method: 'server/discover',
    params: { _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {} } },
  }
  const modernHeaders = { 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'server/discover' }
  const rateCallsBefore = db.calls.filter((c) => c.rpc === 'affiliate_rate_check').length
  res = await send(ev(modernProbeBody, { key: KA.secret, headers: modernHeaders }))
  assert.strictEqual(res.status, 400)
  assert.strictEqual(res.body.error.code, -32600)
  assert.strictEqual('result' in res.body, false)
  assert.ok(![-32022, -32020, -32021].includes(res.body.error.code))
  const rateCallsAfter = db.calls.filter((c) => c.rpc === 'affiliate_rate_check').length
  assert.strictEqual(rateCallsAfter, rateCallsBefore, 'the modern probe must not spend the per-key rate counter')
  ok('a modern-era probe (2026-07-28, server/discover, the _meta body) with a valid key: 400 -32600, no result, code is not a modern-era code (-32022/-32020/-32021), and the rate counter is untouched')

  res = await send(ev(modernProbeBody, { key: KA.secret, headers: { 'Mcp-Method': 'server/discover' } }))
  assert.strictEqual(res.status, 200)
  assert.strictEqual(res.body.error.code, -32601)
  assert.strictEqual('result' in res.body, false)
  ok('the same probe with no MCP-Protocol-Version header: 200 -32601 (falls through to the ordinary unknown-method answer)')

  const callsBeforeUnauth = db.calls.length
  const unauthProbeBody = { ...modernProbeBody, id: 42 }
  res = await send(ev(unauthProbeBody, { headers: modernHeaders }))
  assert.strictEqual(res.status, 401)
  assert.strictEqual(res.headers['WWW-Authenticate'], WWW_401)
  assert.strictEqual(res.rawBody, bodies[0], 'an unauthenticated modern probe must answer the identical 401 body as section 2')
  assert.strictEqual(db.calls.length, callsBeforeUnauth, 'a missing key never reaches the database, even for the modern probe')
  ok('the unauthenticated modern probe: 401, identical body to section 2, auth still runs before the version check, no database call at all')

  assert.deepStrictEqual(mcp.SUPPORTED_PROTOCOL_VERSIONS, ['2025-11-25', '2025-06-18', '2025-03-26'])
  assert.ok(!mcp.SUPPORTED_PROTOCOL_VERSIONS.includes('2026-07-28'))
  ok('SUPPORTED_PROTOCOL_VERSIONS is pinned to the three legacy revisions and does not include 2026-07-28')

  section('16. stage 2: list_fixes and mark_fix_done (mcp-stage2-fixes.md 9.4)')
  // A separate in-memory database so the fixture is exactly what the oracle
  // reads. Fictional brands only. Client 61 is the subject, 62 a second
  // tenant with the same fix ids open, 63 a free client with a read and write key.
  const fixItemsLib = require(path.join(__dirname, '..', 'src', 'lib', 'fixItems.ts'))
  const fixStatesLib = require(path.join(__dirname, '..', 'src', 'lib', 'fixStates.ts'))
  const fixPromptLib = require(path.join(__dirname, '..', 'src', 'lib', 'fixPrompt.ts'))
  const marketsLib = require(path.join(__dirname, '..', 'src', 'lib', 'markets.ts'))
  const planLib = require(path.join(__dirname, '..', 'src', 'lib', 'planConfig.ts'))

  const S0 = new Date('2026-11-20T09:00:00Z')
  clock = new Date(S0)
  const sAgo = (d) => new Date(S0.getTime() - d * 86400_000).toISOString()
  const fdb = createFakeSupabase({ now: () => clock })
  // fix_states_guard() stand-in for the service role (auth.uid() null): stamps
  // marked_at on the move into done or dismissed, keeps marked_by_key and
  // (stage 3) marked_by_grant there, pins them and the baseline on every
  // other update.
  fdb.triggers.fix_states = (op, old, row, nowIso) => {
    if (op === 'INSERT') {
      row.created_at = nowIso; row.updated_at = nowIso
      row.checked_at = null; row.check_value = null; row.check_n = null
      if (row.status === 'done' || row.status === 'dismissed') { row.marked_at = nowIso; row.marked_by = null } else { row.marked_at = null; row.marked_by = null; row.marked_by_key = null; row.marked_by_grant = null }
      if (row.status !== 'done') { row.baseline_value = null; row.baseline_n = null }
      return row
    }
    for (const k of ['id', 'client_id', 'fix_id', 'created_at']) row[k] = old[k]
    row.updated_at = nowIso
    if (row.status !== old.status && (row.status === 'done' || row.status === 'dismissed')) {
      row.marked_at = nowIso; row.marked_by = null
      row.checked_at = null; row.check_value = null; row.check_n = null
      if (row.status !== 'done') { row.baseline_value = null; row.baseline_n = null }
      return row
    }
    for (const k of ['marked_at', 'marked_by', 'marked_by_key', 'marked_by_grant', 'baseline_value', 'baseline_n', 'checked_at', 'check_value', 'check_n']) row[k] = old[k]
    return row
  }

  const OWNER = 'aaaaaaaa-0000-4000-8000-000000000061'
  fdb.seed('user_profiles', [{ id: OWNER, role: 'viewer', client_id: 61 }])
  fdb.seed('clients', [
    { id: 61, name: 'Lumora Studio', brand_aliases: ['Lumora'], brand_website: 'lumora.example', default_market_id: 'RO', plan: 'growth', category: 'active', engines_enabled: null, known_competitors: [] },
    { id: 62, name: 'Quillfeather Labs', brand_aliases: [], brand_website: null, default_market_id: null, plan: 'growth', category: 'active', engines_enabled: null, known_competitors: [] },
    { id: 63, name: 'Tinybrook', brand_aliases: [], brand_website: null, default_market_id: null, plan: 'free', category: 'active', engines_enabled: null, known_competitors: [] },
  ])
  const SECRETS2 = []
  function issueKey2(clientId, scope) {
    const secret = keys.makeClientApiKey(clientId)
    SECRETS2.push(secret); ALL_SECRETS.push(secret)
    const row = { id: require('crypto').randomUUID(), client_id: clientId, key_hash: keys.hashClientApiKey(secret), key_prefix: keys.clientApiKeyPrefix(secret), label: `k${clientId}`, created_by: OWNER, last_used_at: null, revoked_at: null }
    if (scope !== undefined) row.scope = scope
    fdb.seed('client_api_keys', [row])
    return { secret, row }
  }
  const KS_READ = issueKey2(61, 'read')
  const KS_RW = issueKey2(61, 'read_write')
  const KS_LEGACY = issueKey2(61, undefined)
  fdb.rows('client_api_keys').find((k) => k.id === KS_LEGACY.row.id).scope = undefined
  const KT_RW = issueKey2(62, 'read_write')
  const KFREE_RW = issueKey2(63, 'read_write')

  fdb.seed('prompts', [
    { id: 201, client_id: 61, text: 'best photo studio in Bucharest', category: 'general', is_active: true, position: 1 },
    { id: 202, client_id: 61, text: 'studio for product photography', category: 'general', is_active: true, position: 2 },
    { id: 203, client_id: 61, text: 'affordable portrait studio', category: 'general', is_active: true, position: 3 },
    { id: 204, client_id: 61, text: 'studio rental with lighting', category: 'general', is_active: true, position: 4 },
    { id: 205, client_id: 61, text: 'wedding photo studio near me', category: 'general', is_active: true, position: 5 },
    { id: 206, client_id: 61, text: 'headshot studio for teams', category: 'general', is_active: true, position: 6, location_id: 611 },
    { id: 207, client_id: 61, text: 'retired studio question', category: 'general', is_active: false, position: 7 },
    { id: 301, client_id: 62, text: 'quill pens online', category: 'general', is_active: true, position: 1 },
    { id: 302, client_id: 62, text: 'best quill brand', category: 'general', is_active: true, position: 2 },
  ])
  // 2026-11-13: prompt 206 is asked from Berlin (611); the others carry no
  // location here, so their fixes keep the client's default market (RO).
  fdb.seed('client_locations', [
    { id: 610, client_id: 61, market_id: 'RO', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
    { id: 611, client_id: 61, market_id: 'DE', region_id: 'BE', is_primary: false, position: 1, archived_at: null },
  ])
  const NW = (pos) => ({ name: 'Northwind Atelier', pos })
  const HP = (pos) => ({ name: 'Harbor Pine Imaging', pos })
  let rid = 5000
  const rr = (o) => Object.assign({ id: ++rid, status: 'ok', error_code: null, brand_position: null, sentiment: 'neutral', response_snippet: 'an answer', competitors_mentioned: '[]' }, o)
  const sRows = []
  for (const pid of [201, 202, 203, 204, 205, 206]) {
    sRows.push(rr({ client_id: 61, prompt_id: pid, llm: 'chatgpt', brand_mentioned: false, competitors_mentioned: JSON.stringify(pid <= 204 ? [NW(1), HP(2)] : [HP(1)]), checked_at: sAgo(1) }))
  }
  // An older chatgpt row that DID mention the brand: superseded, must not count.
  sRows.push(rr({ client_id: 61, prompt_id: 201, llm: 'chatgpt', brand_mentioned: true, brand_position: 1, sentiment: 'positive', checked_at: sAgo(20) }))
  for (const pid of [201, 202, 203, 204, 205, 206]) {
    const m = pid <= 202
    sRows.push(rr({ client_id: 61, prompt_id: pid, llm: 'gemini', brand_mentioned: m, brand_position: m ? 3 : null, sentiment: m ? 'positive' : 'neutral', competitors_mentioned: JSON.stringify(pid <= 204 ? [NW(1)] : []), checked_at: sAgo(pid === 203 ? 3 : 1) }))
  }
  // A newer no-answer row on gemini x 203: skipped, the older ok row stands.
  sRows.push(rr({ client_id: 61, prompt_id: 203, llm: 'gemini', brand_mentioned: false, response_snippet: '[no_ai_overview] nothing', checked_at: sAgo(1) }))
  for (const pid of [201, 202, 203, 204, 205, 206]) {
    const m = pid <= 204
    sRows.push(rr({ client_id: 61, prompt_id: pid, llm: 'claude', brand_mentioned: m, brand_position: m ? 2 : null, sentiment: m ? 'positive' : 'neutral', competitors_mentioned: JSON.stringify(m ? ['Northwind Atelier'] : [HP(1)]), checked_at: sAgo(1) }))
  }
  // google_ai: error rows only (unavailable). grok: not a growth engine.
  sRows.push(rr({ client_id: 61, prompt_id: 201, llm: 'google_ai', status: 'error', error_code: 'quota_exceeded', brand_mentioned: false, checked_at: sAgo(1) }))
  sRows.push(rr({ client_id: 61, prompt_id: 202, llm: 'google_ai', status: 'error', error_code: 'quota_exceeded', brand_mentioned: false, checked_at: sAgo(1) }))
  sRows.push(rr({ client_id: 61, prompt_id: 205, llm: 'grok', brand_mentioned: true, brand_position: 1, competitors_mentioned: JSON.stringify(['Grokonly Partners']), checked_at: sAgo(1) }))
  // Inactive prompt: stays in the map, as on the page.
  sRows.push(rr({ client_id: 61, prompt_id: 207, llm: 'chatgpt', brand_mentioned: false, competitors_mentioned: JSON.stringify([NW(1)]), checked_at: sAgo(2) }))
  // Client 62: the same chatgpt gap, so engine_missing:chatgpt is open there too.
  for (const pid of [301, 302]) {
    sRows.push(rr({ client_id: 62, prompt_id: pid, llm: 'chatgpt', brand_mentioned: false, competitors_mentioned: JSON.stringify([{ name: 'Inkwell Rivals', pos: 1 }]), checked_at: sAgo(1) }))
    sRows.push(rr({ client_id: 62, prompt_id: pid, llm: 'claude', brand_mentioned: true, brand_position: 1, checked_at: sAgo(1) }))
  }
  fdb.seed('ai_results', sRows)
  fdb.seed('fix_states', [
    { client_id: 61, fix_id: 'prompt_gap:206', status: 'reopened', title: 'Not named for: headshot studio for teams', metric_key: 'rate:prompt:206', baseline_value: 0, baseline_n: 3, marked_at: sAgo(20), checked_at: sAgo(10), check_value: 0, check_n: 3 },
    { client_id: 61, fix_id: 'visibility:all', status: 'done', title: 'Old overall fix', metric_key: 'rate:all', baseline_value: 10, baseline_n: 12, marked_at: sAgo(9) },
    { client_id: 61, fix_id: 'engine_missing:perplexity', status: 'done', title: 'Perplexity fix', metric_key: 'rate:engine:perplexity', baseline_value: 0, baseline_n: 4, marked_at: sAgo(3) },
    { client_id: 61, fix_id: 'engine_missing:claude', status: 'verified', title: 'Claude fix', metric_key: 'rate:engine:claude', baseline_value: 0, baseline_n: 6, marked_at: sAgo(30), checked_at: sAgo(15), check_value: 66.7, check_n: 6 },
    { client_id: 61, fix_id: 'prompt_gap:205', status: 'dismissed', title: 'Not named for: wedding photo studio near me', marked_at: sAgo(4) },
  ].map((r) => Object.assign({ marked_by: null, marked_by_key: null, checked_at: null, check_value: null, check_n: null, created_at: sAgo(30), updated_at: sAgo(1) }, r)))

  const CFG2 = { perKeyPerMinute: 100000, perClientPerDay: 100000, perClientWritesPerHour: 100000 }
  const call2 = (method, params, key, opts = {}) => send(ev({ jsonrpc: '2.0', id: opts.id ?? 9, method, ...(params === undefined ? {} : { params }) }, { key, headers: opts.headers || V }), { supabase: fdb, config: opts.config || CFG2 })
  async function tool2(name, args, key, opts) {
    const res = await call2('tools/call', { name, arguments: args }, key, opts)
    assert.strictEqual(res.status, 200, JSON.stringify(res.body))
    assert.ok(res.body.result, `expected a result for ${name}: ${JSON.stringify(res.body)}`)
    if (!res.body.result.isError) assert.deepStrictEqual(res.body.result.structuredContent, JSON.parse(res.body.result.content[0].text))
    return res.body.result
  }

  // The page's own path, called directly on the same rows: the oracle.
  function oracle(clientId) {
    const client = fdb.rows('clients').find((c) => c.id === clientId)
    const engineIds = planLib.getActiveEngines(client.plan, client.engines_enabled).map(String)
    const engines = engineIds.map((id) => ({ id, label: planLib.ENGINE_META[id].label }))
    const prompts = fdb.rows('prompts').filter((p) => p.client_id === clientId && p.is_active)
      .sort((a, b) => a.position - b.position).map((p) => ({ id: p.id, text: p.text, position: p.position }))
    // As the page reads them: select('*'), newest first by checked_at.
    const rows = fdb.rows('ai_results').filter((x) => x.client_id === clientId).slice().sort((a, b) => (a.checked_at < b.checked_at ? 1 : -1))
    const built = fixItemsLib.buildFixResultMap(rows, engineIds)
    const states = new Map(fdb.rows('fix_states').filter((x) => x.client_id === clientId).map((x) => [x.fix_id, x]))
    const items = fixItemsLib.buildFixItems({ brandName: client.name, engines, prompts, results: built.results, errorEngines: built.errorEngines, stateOf: (id) => states.get(id)?.status })
    const market = marketsLib.MARKETS.find((m) => m.id === client.default_market_id)?.label ?? null
    // 2026-11-13: a prompt_gap fix names its prompt's location (market label,
    // then the region label unless ALL); every other fix the default market.
    const locLabel = (pid) => {
      const p = fdb.rows('prompts').find((x) => x.id === pid && x.client_id === clientId)
      const l = p && fdb.rows('client_locations').find((x) => x.id === p.location_id && x.client_id === clientId)
      if (!l) return null
      const mk = marketsLib.MARKETS.find((m) => m.id === l.market_id)
      if (l.region_id === 'ALL') return mk.label
      return `${mk.label} · ${mk.regions.find((r) => r.id === l.region_id).label}`
    }
    const marketFor = (item) => {
      const m = /^prompt_gap:(\d+)$/.exec(item.id)
      return (m && locLabel(Number(m[1]))) || market
    }
    const promptFor = (item) => fixPromptLib.buildFixPrompt(
      { id: item.id, title: item.title, competitor: item.competitor ?? null, competitorAvgRank: item.competitorAvgRank },
      { brandName: client.name, website: client.brand_website ?? null, market: marketFor(item), engines, prompts: prompts.map((p) => ({ id: p.id, text: p.text })), results: built.results },
    ) ?? item.fix
    const open = items.filter((i) => fixStatesLib.isOpenState(states.get(i.id)?.status))
    return { items, open, promptFor, results: built.results, promptIds: prompts.map((p) => p.id), engineIds, states }
  }

  // ── list_fixes: parity with the page's builders ──
  let o = oracle(61)
  assert.ok(o.open.length >= 4, `fixture should open several fixes, got ${o.open.map((i) => i.id)}`)
  for (const want of ['engine_missing:chatgpt', 'engine_low:gemini', 'prompt_gap:206']) assert.ok(o.open.some((i) => i.id === want), `fixture lacks ${want}`)
  assert.ok(o.open.some((i) => i.id.startsWith('outranked:')), 'fixture lacks an outranked fix')
  assert.ok(!o.open.some((i) => i.id === 'prompt_gap:205'), 'a dismissed gap is not open')
  let lf = await tool2('list_fixes', {}, KS_READ.secret)
  assert.ok(!lf.isError, JSON.stringify(lf))
  let L = lf.structuredContent
  assert.strictEqual(L.client_id, 61); assert.strictEqual(L.generated_at, S0.toISOString())
  assert.strictEqual(L.truncated, false); assert.strictEqual(L.closed, undefined)
  assert.deepStrictEqual(L.open.map((x) => x.fix_id), o.open.map((i) => i.id), 'ids and order')
  for (let i = 0; i < o.open.length; i++) {
    const it = o.open[i]; const got = L.open[i]
    assert.strictEqual(got.prompt, o.promptFor(it), `prompt text of ${it.id}`)
    assert.deepStrictEqual([got.priority, got.title, got.summary, got.fix], [it.priority, it.title, it.description, it.fix], `copy of ${it.id}`)
    assert.deepStrictEqual(Object.keys(got).sort(), ['fix', 'fix_id', 'priority', 'prompt', 'reopened', 'status', 'summary', 'title'])
    // Ids like "consistency" are ordinary words; the compound ids must not leak.
    if (got.fix_id.includes(':')) assert.ok(!got.prompt.includes(got.fix_id), `the fix id ${got.fix_id} appears inside the prompt text`)
  }
  assert.ok(L.open.find((x) => x.fix_id === 'engine_missing:chatgpt').prompt.includes('Romania'), 'market label from markets.ts by default_market_id')
  const gap206 = L.open.find((x) => x.fix_id === 'prompt_gap:206').prompt
  assert.ok(gap206.includes('- Market: Germany · Berlin'), 'a prompt_gap fix names its prompt\'s location: ' + gap206)
  assert.ok(!gap206.includes('- Market: Romania'), 'not the default market')
  ok('fix prompt text: a prompt_gap fix passes its prompt\'s location label to buildFixPrompt; other fixes keep the default market')
  ok(`list_fixes: ${L.open.length} open fixes with the same ids, order, priority, title, summary, fix and byte-identical prompt text as buildFixResultMap + buildFixItems + buildFixPrompt on the same rows`)
  const reo = L.open.find((x) => x.fix_id === 'prompt_gap:206')
  assert.strictEqual(reo.status, 'reopened')
  assert.deepStrictEqual(reo.reopened, { marked_at: sAgo(20), checked_at: sAgo(10), before: 0, after: 0, metric: 'Mention rate for "headshot studio for teams"' })
  assert.ok(L.open.filter((x) => x.fix_id !== 'prompt_gap:206').every((x) => x.status === 'open' && x.reopened === null))
  ok('a reopened fix is open with status reopened and { marked_at, checked_at, before, after, metric }; the rest are open with reopened null')
  const allL = JSON.stringify(L)
  for (const bad of ['Grokonly', 'Inkwell', 'Quillfeather', 'quill pens']) assert.ok(!allL.includes(bad), `${bad} leaked into list_fixes`)
  ok('list_fixes: no unentitled-engine or other-client content')

  lf = await tool2('list_fixes', { include_closed: true }, KS_READ.secret)
  L = lf.structuredContent
  assert.deepStrictEqual(L.closed.map((x) => x.fix_id), ['engine_missing:perplexity', 'prompt_gap:205', 'visibility:all', 'engine_missing:claude'], 'the Done list order: checked_at or marked_at, newest first')
  const byId = new Map(L.closed.map((x) => [x.fix_id, x]))
  const evAll = fixStatesLib.evaluateFix(o.states.get('visibility:all'), o.results, o.promptIds, o.engineIds, S0.getTime())
  assert.strictEqual(evAll.state, 'verdict')
  assert.deepStrictEqual(byId.get('visibility:all').recheck, { state: 'verdict_due', status: evAll.status, value: evAll.value })
  assert.deepStrictEqual(byId.get('engine_missing:perplexity').recheck, { state: 'untracked' })
  assert.deepStrictEqual(byId.get('engine_missing:claude').recheck, { state: 'verified', checked_at: sAgo(15), before: 0, after: 66.7, metric: 'Claude mention rate' })
  assert.strictEqual(byId.get('prompt_gap:205').recheck, null)
  assert.strictEqual(fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === 'visibility:all').status, 'done', 'list_fixes records no verdict')
  assert.ok(!fdb.calls.some((c) => c.table === 'fix_states' && c.op !== 'select'), 'list_fixes wrote nothing to fix_states')
  ok('include_closed: done, verified and dismissed rows in the Done list order; a due verdict is reported as verdict_due (evaluateFix), never written')
  lf = await tool2('list_fixes', { limit: 2, include_closed: true }, KS_READ.secret)
  assert.strictEqual(lf.structuredContent.open.length, 2); assert.strictEqual(lf.structuredContent.closed.length, 2)
  lf = await tool2('list_fixes', { limit: 999 }, KS_READ.secret)
  assert.strictEqual(lf.structuredContent.open.length, o.open.length)
  lf = await tool2('list_fixes', { limit: 'ten' }, KS_READ.secret)
  assert.strictEqual(lf.isError, true)
  lf = await tool2('list_fixes', { include_closed: 'yes' }, KS_READ.secret)
  assert.strictEqual(lf.isError, true)
  ok('limit clamps to 1..50 per list; wrong-typed limit or include_closed is an isError result')
  lf = await tool2('list_fixes', {}, KS_READ.secret, { config: { ...CFG2, scanPage: 5, scanCeiling: 5 } })
  assert.strictEqual(lf.structuredContent.truncated, true)
  ok('with the scan ceiling injected small, list_fixes says truncated: true')

  // ── tools/list and the scope gate ──
  let tl = await call2('tools/list', {}, KS_READ.secret)
  assert.deepStrictEqual(tl.body.result.tools.map((t) => t.name), mcp.TOOL_NAMES)
  assert.ok(mcp.TOOL_NAMES.includes('list_fixes') && !mcp.TOOL_NAMES.includes('mark_fix_done'))
  assert.deepStrictEqual(tl.body.result.tools.find((t) => t.name === 'list_fixes').annotations, { readOnlyHint: true, idempotentHint: true, openWorldHint: false })
  tl = await call2('tools/list', {}, KS_LEGACY.secret)
  assert.ok(!tl.body.result.tools.some((t) => t.name === 'mark_fix_done'), 'a key row without scope reads as read only')
  tl = await call2('tools/list', {}, KS_RW.secret)
  assert.deepStrictEqual(tl.body.result.tools.map((t) => t.name), [...mcp.TOOL_NAMES, 'mark_fix_done'])
  const mfd = tl.body.result.tools.find((t) => t.name === 'mark_fix_done')
  assert.deepStrictEqual(mfd.annotations, { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false })
  assert.deepStrictEqual(mfd.inputSchema.required, ['fix_id'])
  assert.ok(mfd.outputSchema)
  tl = await call2('tools/list', {}, KS_RW.secret, { headers: {} })
  assert.ok(tl.body.result.tools.every((t) => t.outputSchema === undefined))
  ok('tools/list: list_fixes for every gated key; mark_fix_done only for a read_write key, with readOnly false, destructive false, idempotent true, openWorld false')
  let init = await call2('initialize', { protocolVersion: '2025-06-18' }, KS_READ.secret)
  assert.ok(init.body.result.instructions.startsWith('Read-only access'))
  init = await call2('initialize', { protocolVersion: '2025-06-18' }, KS_RW.secret)
  assert.ok(!init.body.result.instructions.startsWith('Read-only') && init.body.result.instructions.includes('mark_fix_done') && init.body.result.instructions.includes('never start a collection'))
  ok('initialize: a read key keeps the stage 1 instructions; a read and write key is not told it is read only')

  const writesKey = (cid) => `mcp:client:${cid}:writes:hour`
  const writeCount = (cid) => fdb.rows('affiliate_rate_limits').filter((x) => x.key === writesKey(cid)).reduce((a, x) => a + x.count, 0)
  const fixWrites = () => fdb.calls.filter((c) => c.table === 'fix_states' && c.op !== 'select').length
  const audits = (cid) => fdb.rows('client_events').filter((x) => x.client_id === cid && x.type === 'mcp_fix_marked')
  for (const k of [KS_READ, KS_LEGACY]) {
    const res = await tool2('mark_fix_done', { fix_id: 'engine_missing:chatgpt' }, k.secret)
    assert.strictEqual(res.isError, true)
    assert.strictEqual(res.content[0].text, 'This key is read only. Create a read and write key on the BrandGEO Account page to let an agent mark fixes done.')
  }
  assert.strictEqual(fixWrites(), 0); assert.strictEqual(audits(61).length, 0); assert.strictEqual(writeCount(61), 0)
  ok('mark_fix_done with a read key (or a key row without scope): isError with the read-only sentence; no write, no audit, write counter untouched')
  // Before the scope migration the key select names a missing column (42703):
  // stage 1 keeps answering and every key is read only.
  const premig = {
    from(t) {
      const q = fdb.from(t)
      if (t === 'client_api_keys') {
        const run = q._run.bind(q)
        q._run = async () => (q.op === 'select' && /\bscope\b/.test(String(q.cols))
          ? { data: null, error: { code: '42703', message: 'column client_api_keys.scope does not exist' } }
          : run())
      }
      return q
    },
    rpc(...a) { return fdb.rpc(...a) },
  }
  const callPre = (method, params) => send(ev({ jsonrpc: '2.0', id: 3, method, params }, { key: KS_RW.secret, headers: V }), { supabase: premig, config: CFG2 })
  let pre = await callPre('tools/list', {})
  assert.deepStrictEqual(pre.body.result.tools.map((t) => t.name), mcp.TOOL_NAMES)
  pre = await callPre('tools/call', { name: 'get_brand_overview', arguments: {} })
  assert.ok(pre.body.result && !pre.body.result.isError && pre.body.result.structuredContent.client_id === 61)
  pre = await callPre('tools/call', { name: 'mark_fix_done', arguments: { fix_id: 'engine_missing:chatgpt' } })
  assert.strictEqual(pre.body.result.isError, true)
  assert.ok(pre.body.result.content[0].text.startsWith('This key is read only.'))
  assert.strictEqual(fixWrites(), 0)
  ok('before the scope migration (42703 on the key select): stage 1 tools still answer, tools/list has no mark_fix_done, a write is refused as read only')

  // ── plan gate ──
  let res2 = await call2('tools/list', {}, KFREE_RW.secret)
  assert.strictEqual(res2.body.error.code, -32002)
  res2 = await call2('tools/call', { name: 'mark_fix_done', arguments: { fix_id: 'engine_missing:chatgpt' } }, KFREE_RW.secret)
  assert.strictEqual(res2.body.error.code, -32002)
  assert.strictEqual(fixWrites(), 0); assert.strictEqual(writeCount(63), 0)
  fdb.rows('clients').find((c) => c.id === 61).plan = 'free'
  res2 = await call2('tools/call', { name: 'mark_fix_done', arguments: { fix_id: 'engine_missing:chatgpt' } }, KS_RW.secret)
  assert.strictEqual(res2.body.error.code, -32002)
  fdb.rows('clients').find((c) => c.id === 61).plan = 'growth'
  assert.strictEqual(fixWrites(), 0); assert.strictEqual(writeCount(61), 0)
  ok('write plan gate = MCP plan gate: a free client with a read and write key gets -32002, as does a client downgraded on the live row; no write, write counter untouched')

  // ── refused ids ──
  for (const [fid, msg] of [
    ['prompt_gap:999999', 'That fix is not open for this brand. Call list_fixes for the current ids.'],
    ['prompt_gap:205', 'That fix is not open for this brand. Call list_fixes for the current ids.'],
    ['engine_missing:claude', 'That fix is not open for this brand. Call list_fixes for the current ids.'],
    ['outranked:somebody we made up', 'That fix is not open for this brand. Call list_fixes for the current ids.'],
    ['Robert\'); drop table fix_states;--', 'fix_id is required and must be an id returned by list_fixes.'],
    ['', 'fix_id is required and must be an id returned by list_fixes.'],
    [42, 'fix_id is required and must be an id returned by list_fixes.'],
  ]) {
    const res = await tool2('mark_fix_done', { fix_id: fid }, KS_RW.secret)
    assert.strictEqual(res.isError, true, String(fid)); assert.strictEqual(res.content[0].text, msg, String(fid))
  }
  let rq = await tool2('mark_fix_done', {}, KS_RW.secret)
  assert.strictEqual(rq.isError, true)
  rq = await tool2('mark_fix_done', { fix_id: 'engine_missing:chatgpt', note: 7 }, KS_RW.secret)
  assert.strictEqual(rq.isError, true); assert.strictEqual(rq.content[0].text, 'note must be text.')
  rq = await tool2('mark_fix_done', { fix_id: 'engine_missing:chatgpt', note: 'n'.repeat(501) }, KS_RW.secret)
  assert.strictEqual(rq.isError, true); assert.strictEqual(rq.content[0].text, 'note must be 500 characters or fewer.')
  assert.strictEqual(fixWrites(), 0); assert.strictEqual(audits(61).length, 0)
  ok('unknown, dismissed, verified and invented ids get "That fix is not open..."; malformed ids, a missing id and a bad note are input errors; nothing written, no audit')

  // ── a real mark ──
  clock = new Date('2026-11-20T09:01:12Z')
  o = oracle(61)
  const target = o.open.find((i) => i.id === 'engine_missing:chatgpt')
  const base = fixStatesLib.measureFix(fixStatesLib.parseMetricKey(target.metricKey), o.results, o.promptIds, o.engineIds)
  const SECRET_NOTE = `Rewrote the overview page NOTE-ONLY-IN-AUDIT ${KS_RW.secret}`
  const wBefore = writeCount(61)
  let mk = await tool2('mark_fix_done', { fix_id: 'engine_missing:chatgpt', note: SECRET_NOTE }, KS_RW.secret)
  assert.ok(!mk.isError, JSON.stringify(mk))
  const M = mk.structuredContent
  assert.deepStrictEqual(M, {
    client_id: 61,
    fix_id: 'engine_missing:chatgpt',
    status: 'done',
    marked_at: '2026-11-20T09:01:12.000Z',
    recheck_after: '2026-11-27T09:01:12.000Z',
    baseline: { metric: 'ChatGPT mention rate', value: base.value, answers: base.n },
    message: 'Marked done. BrandGEO checks this again on the first collection after 27 November 2026.',
  })
  assert.strictEqual(base.value, 0); assert.strictEqual(base.n, 6)
  const stored = fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === 'engine_missing:chatgpt')
  assert.deepStrictEqual(
    [stored.status, stored.title, stored.metric_key, stored.baseline_value, stored.baseline_n, stored.marked_by_key, stored.marked_by],
    ['done', target.title, target.metricKey, base.value, base.n, KS_RW.row.id, null])
  assert.strictEqual(writeCount(61) - wBefore, 1)
  const au = audits(61)
  assert.strictEqual(au.length, 1)
  assert.deepStrictEqual({ client_id: au[0].client_id, actor: au[0].actor, type: au[0].type, meta: au[0].meta },
    { client_id: 61, actor: OWNER, type: 'mcp_fix_marked', meta: { key_id: KS_RW.row.id, fix_id: 'engine_missing:chatgpt', note: SECRET_NOTE } })
  ok('mark_fix_done: baseline equals measureFix on the same result map; upsert writes status done, title, metric_key, baseline and marked_by_key; recheck_after = marked_at + 7 days; one client_events row (actor = key creator, meta key_id, fix_id, note); write counter +1')
  assert.ok(!fdb.rows('fix_states').some((x) => x.client_id === 62 && x.fix_id === 'engine_missing:chatgpt'), "client 62's same id is untouched")
  lf = await tool2('list_fixes', { include_closed: true }, KS_READ.secret)
  assert.ok(!lf.structuredContent.open.some((x) => x.fix_id === 'engine_missing:chatgpt'))
  const cl = lf.structuredContent.closed.find((x) => x.fix_id === 'engine_missing:chatgpt')
  assert.deepStrictEqual(cl.recheck, { state: 'waiting', ready_after: '2026-11-27T09:01:12.000Z' })
  ok('after the mark: gone from open, in closed with recheck waiting until recheck_after; the other tenant\'s identical id is untouched')

  // ── idempotency ──
  clock = new Date('2026-11-20T10:00:00Z')
  const callsBefore2 = fixWrites()
  const wBefore2 = writeCount(61)
  const callIdx = fdb.calls.length
  mk = await tool2('mark_fix_done', { fix_id: 'engine_missing:chatgpt' }, KS_RW.secret)
  assert.deepStrictEqual(mk.structuredContent, { ...M, already_done: true })
  assert.strictEqual(fixWrites(), callsBefore2, 'already done: no fix_states write')
  assert.strictEqual(audits(61).length, 1, 'already done: no audit row')
  assert.ok(!fdb.calls.slice(callIdx).some((c) => c.table === 'ai_results'), 'already done answers from the stored row, no scan')
  assert.strictEqual(writeCount(61) - wBefore2, 1, 'the call still counts as a write call')
  mk = await tool2('mark_fix_done', { fix_id: 'engine_missing:perplexity' }, KS_RW.secret)
  assert.strictEqual(mk.structuredContent.already_done, true)
  assert.strictEqual(mk.structuredContent.marked_at, sAgo(3))
  assert.strictEqual(mk.structuredContent.recheck_after, new Date(Date.parse(sAgo(3)) + 7 * 86400_000).toISOString())
  assert.strictEqual(audits(61).length, 1)
  ok('marking a done fix again returns the stored row with already_done: true, writes nothing, adds no audit row, and needs no scan')

  // ── a reopened fix can be marked done again ──
  o = oracle(61)
  const gap = o.open.find((i) => i.id === 'prompt_gap:206')
  const gapBase = fixStatesLib.measureFix(fixStatesLib.parseMetricKey(gap.metricKey), o.results, o.promptIds, o.engineIds)
  mk = await tool2('mark_fix_done', { fix_id: 'prompt_gap:206' }, KS_RW.secret)
  assert.ok(!mk.isError)
  assert.deepStrictEqual(mk.structuredContent.baseline, { metric: 'Mention rate for "headshot studio for teams"', value: gapBase.value, answers: gapBase.n })
  const g = fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === 'prompt_gap:206')
  assert.deepStrictEqual([g.status, g.marked_at, g.marked_by_key, g.checked_at], ['done', clock.toISOString(), KS_RW.row.id, null])
  assert.strictEqual(audits(61).length, 2)
  ok('a reopened fix is marked done again: new marked_at and baseline, marked_by_key set, verdict cleared, one more audit row')

  // ── the write counter ──
  clock = new Date('2026-11-20T11:00:00Z')
  const wcfg = { ...CFG2, perClientWritesPerHour: 2 }
  rq = await tool2('mark_fix_done', { fix_id: 'engine_missing:perplexity' }, KS_RW.secret, { config: wcfg })
  assert.ok(!rq.isError)
  rq = await tool2('list_fixes', {}, KS_RW.secret, { config: wcfg })
  assert.ok(!rq.isError)
  rq = await tool2('mark_fix_done', { fix_id: 'prompt_gap:999999' }, KS_RW.secret, { config: wcfg })
  assert.strictEqual(rq.isError, true)
  res2 = await call2('tools/call', { name: 'mark_fix_done', arguments: { fix_id: 'engine_low:gemini' } }, KS_RW.secret, { config: wcfg })
  assert.strictEqual(res2.status, 200)
  assert.strictEqual(res2.body.error.code, -32029)
  assert.deepStrictEqual(res2.body.error.data, { retry_after: 3600, scope: 'client_write_hour', limit: 2 })
  assert.strictEqual(res2.headers['Retry-After'], '3600')
  assert.strictEqual(res2.body.error.message, 'Write limit reached: 2 fix updates an hour for this account. Retry in 3600 seconds.')
  assert.ok(fdb.rows('affiliate_rate_limits').some((x) => x.key === 'mcp:client:61:writes:hour'))
  assert.ok(!fdb.rows('fix_states').some((x) => x.client_id === 61 && x.fix_id === 'engine_low:gemini'), 'the limited call wrote nothing')
  // The counter is per client: another key on the same client shares it.
  const KS_RW2 = issueKey2(61, 'read_write')
  res2 = await call2('tools/call', { name: 'mark_fix_done', arguments: { fix_id: 'engine_low:gemini' } }, KS_RW2.secret, { config: wcfg })
  assert.strictEqual(res2.body.error.code, -32029)
  ok('write counter mcp:client:<id>:writes:hour (3600 s): every mark_fix_done call after the gates counts, list_fixes does not; over the limit is -32029 scope client_write_hour with Retry-After, shared by every key of the client')
  assert.strictEqual(mcp.MCP_WRITES_PER_CLIENT_PER_HOUR, 60)
  clock = new Date('2026-11-20T12:00:05Z')
  rq = await tool2('mark_fix_done', { fix_id: 'engine_low:gemini' }, KS_RW2.secret, { config: wcfg })
  assert.ok(!rq.isError, JSON.stringify(rq))
  ok('the default write limit is 60 an hour; the next hour window opens again')

  // ── audit failure does not undo the mark ──
  const auditFail = {
    from(t) { const q = fdb.from(t); if (t === 'client_events') q._run = async () => ({ data: null, error: { code: '23514', message: 'new row violates check constraint "client_events_type_check"' } }); return q },
    rpc(...a) { return fdb.rpc(...a) },
  }
  o = oracle(61)
  const nextOpen = o.open.find((i) => i.id.startsWith('outranked:'))
  const errBefore = captured.length
  let resA = await send(ev({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'mark_fix_done', arguments: { fix_id: nextOpen.id, note: SECRET_NOTE } } }, { key: KS_RW.secret, headers: V }), { supabase: auditFail, config: CFG2 })
  assert.ok(resA.body.result && !resA.body.result.isError, JSON.stringify(resA.body))
  assert.strictEqual(fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === nextOpen.id).status, 'done')
  assert.ok(captured.slice(errBefore).some((l) => l.includes('audit insert failed for client 61')))
  ok('a failed audit insert is logged and the mark stands')

  // ── isolation: client 62's key marks only client 62 ──
  mk = await tool2('mark_fix_done', { fix_id: 'engine_missing:chatgpt' }, KT_RW.secret)
  assert.ok(!mk.isError, JSON.stringify(mk))
  assert.strictEqual(mk.structuredContent.client_id, 62)
  const t62 = fdb.rows('fix_states').filter((x) => x.fix_id === 'engine_missing:chatgpt')
  assert.deepStrictEqual(t62.map((x) => [x.client_id, x.marked_by_key]).sort(), [[61, KS_RW.row.id], [62, KT_RW.row.id]])
  ok("client 62's key marks client 62's row only; client 61's row keeps its own marked_by_key")

  // ── logging ──
  const mLines = captured.filter((l) => l.startsWith('[mcp-server/') && / tool=mark_fix_done /.test(l))
  assert.ok(mLines.some((l) => / fix_id=engine_missing%3Achatgpt ms=\d+ outcome=ok$/.test(l)), 'a mark line carries the encoded fix_id and outcome ok')
  assert.ok(mLines.some((l) => / outcome=already_done$/.test(l)))
  assert.ok(mLines.some((l) => / outcome=fix_not_open$/.test(l)))
  assert.ok(mLines.some((l) => / outcome=read_only_key$/.test(l)))
  assert.ok(mLines.some((l) => / fix_id=invalid /.test(l)), 'a malformed id is logged as invalid')
  assert.ok(mLines.every((l) => /^\[mcp-server\/\S{1,8}\] client=\S+ cred=(key|oauth) method=tools\/call tool=mark_fix_done fix_id=\S+ ms=\d+ outcome=\S+$/.test(l)), 'one token per field')
  const hashes2 = SECRETS2.map(keys.hashClientApiKey)
  const prefixes2 = SECRETS2.map(keys.clientApiKeyPrefix)
  // Everything the server printed (the test's own "ok -" lines are not server output).
  for (const l of captured.filter((x) => !x.startsWith('  ok - '))) {
    assert.ok(!l.includes('bgmcp_'), `a log line contains bgmcp_: ${l.slice(0, 80)}`)
    assert.ok(!l.includes('NOTE-ONLY-IN-AUDIT') && !l.includes('Rewrote the overview page'), 'a log line contains the note')
    for (const h of hashes2) assert.ok(!l.includes(h), 'a log line contains a key hash')
    for (const p of prefixes2) assert.ok(!l.includes(p), 'a log line contains a key prefix')
  }
  // A caller cannot smuggle a key into the log through fix_id either.
  const smuggle = `prompt_gap:${KS_RW.secret}`
  rq = await tool2('mark_fix_done', { fix_id: smuggle }, KS_RW.secret)
  assert.strictEqual(rq.isError, true)
  const last = captured.filter((l) => l.startsWith('[mcp-server/')).slice(-1)[0]
  assert.ok(!last.includes('bgmcp_') && last.includes('fix_id=prompt_gap%3Aother'), last)
  // Nor in upper case, nor as the bare 48-hex secret part (review L1).
  const hexPart = KS_RW.secret.slice(KS_RW.secret.lastIndexOf('_') + 1)
  for (const sneaky of [`prompt_gap:${KS_RW.secret.toUpperCase()}`, `outranked:${hexPart}`, `engine_low:${hexPart.toUpperCase()}`]) {
    rq = await tool2('mark_fix_done', { fix_id: sneaky }, KS_RW.secret)
    assert.strictEqual(rq.isError, true)
    const ln = captured.filter((l) => l.startsWith('[mcp-server/')).slice(-1)[0]
    assert.ok(!ln.toLowerCase().includes(hexPart.toLowerCase()) && !/bgmcp/i.test(ln) && /fix_id=\w+%3Aother /.test(ln), ln)
  }
  ok('log lines: mark_fix_done lines add one fix_id token and an outcome code (ok, already_done, fix_not_open, read_only_key); never a key, prefix, hash or the note, even when a key is sent as the fix_id or the note')

  section('17. stage 3: the OAuth branch (mcp-stage3-oauth.md section 5)')
  // Same in-memory database as section 16. Grants and access tokens are
  // seeded directly here; the authorize and token endpoints that mint them are
  // covered end to end in tests/oauth_flow.test.js.
  clock = new Date('2026-11-21T09:00:00Z')
  const CONF = 'bgoc_' + 'e'.repeat(24)
  fdb.seed('oauth_clients', [{ id: CONF, kind: 'confidential', name: 'Claude', redirect_uris: [oauthLib.ANTHROPIC_REDIRECT_URI], secret_hash: 'f'.repeat(64) }])
  const OAUTH_SECRETS = []
  // Each grant gets its own viewer of the client unless a user is given, as
  // the one-live-grant index (user, OAuth client, BrandGEO client) requires.
  let viewerN = 0
  function issueGrant(clientId, { scope = 'mcp:read offline_access', tokenScope = scope, userId = null, grantExpires = 90, tokenExpiresS = 3600 } = {}) {
    if (userId === null) {
      userId = `dddddddd-0000-4000-8000-${String(++viewerN).padStart(12, '0')}`
      fdb.seed('user_profiles', [{ id: userId, role: 'viewer', client_id: clientId }])
    }
    const [grant] = fdb.seed('oauth_grants', [{
      id: require('crypto').randomUUID(), client_id: clientId, user_id: userId, oauth_client_id: CONF, client_name: 'Claude', redirect_host: 'claude.ai',
      scope, last_used_at: null, revoked_at: null, expires_at: new Date(clock.getTime() + grantExpires * 86400_000).toISOString(),
    }]).slice(-1)
    const at = oauthLib.makeAccessToken()
    OAUTH_SECRETS.push(at)
    const [tok] = fdb.seed('oauth_tokens', [{ id: require('crypto').randomUUID(), grant_id: grant.id, kind: 'access', token_hash: oauthLib.sha256Hex(at), scope: tokenScope, expires_at: new Date(clock.getTime() + tokenExpiresS * 1000).toISOString() }]).slice(-1)
    return { at, grant, tok }
  }
  const G_READ = issueGrant(61)
  const G_RW = issueGrant(61, { scope: 'mcp:read mcp:write offline_access', userId: OWNER })

  // ── the shape router and the 401s ──
  const callsBefore17 = fdb.calls.length
  let r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: 'bgmrt_' + 'a'.repeat(64) }), { supabase: fdb })
  assert.strictEqual(r17.status, 401); assert.strictEqual(r17.headers['WWW-Authenticate'], WWW_401); assert.strictEqual(r17.rawBody, bodies[0])
  r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: 'bgmat_' + 'a'.repeat(47) }), { supabase: fdb })
  assert.strictEqual(r17.status, 401); assert.strictEqual(r17.headers['WWW-Authenticate'], WWW_401)
  assert.strictEqual(fdb.calls.length, callsBefore17, 'a refresh token or a malformed access token never reaches the database')
  ok('a bgmrt_ refresh token or a malformed bgmat_ sent as a bearer: the plain 401 (no invalid_token), identical body, no database call')
  const hexOf = (s) => s.slice(s.lastIndexOf('_') + 1)
  r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: `bgmcp_61_${hexOf(G_RW.at)}` }), { supabase: fdb })
  assert.strictEqual(r17.status, 401); assert.strictEqual(r17.headers['WWW-Authenticate'], WWW_401)
  r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: `bgmat_${hexOf(KS_RW.secret)}` }), { supabase: fdb })
  assert.strictEqual(r17.status, 401); assert.strictEqual(r17.headers['WWW-Authenticate'], WWW_401_INVALID); assert.strictEqual(r17.rawBody, bodies[0])
  ok('a bgmat_ token rewritten as a bgmcp_ key is an unknown key (plain 401); a key rewritten as bgmat_ is an unknown token (401 invalid_token); the body is the same as every other 401')
  const dead = []
  { const g = issueGrant(61); fdb.rows('oauth_tokens').find((x) => x.id === g.tok.id).revoked_at = clock.toISOString(); dead.push(['revoked token', g.at]) }
  { const g = issueGrant(61, { tokenExpiresS: -1 }); dead.push(['expired token', g.at]) }
  { const g = issueGrant(61); fdb.rows('oauth_grants').find((x) => x.id === g.grant.id).revoked_at = clock.toISOString(); dead.push(['revoked grant', g.at]) }
  { const g = issueGrant(61, { grantExpires: -1 }); dead.push(['idle-expired grant', g.at]) }
  { const g = issueGrant(61, { userId: 'cccccccc-0000-4000-8000-000000000099' }); dead.push(['user without a profile', g.at]) }
  { const MOVED = 'cccccccc-0000-4000-8000-000000000062'; fdb.seed('user_profiles', [{ id: MOVED, role: 'viewer', client_id: 62 }]); const g = issueGrant(61, { userId: MOVED }); dead.push(['user now on another client', g.at]) }
  { const g = issueGrant(77); dead.push(['client row missing', g.at]) }
  { const g = issueGrant(61); fdb.rows('oauth_tokens').find((x) => x.id === g.tok.id).kind = 'refresh'; dead.push(['a refresh row with an access-shaped token', g.at]) }
  for (const [label, at] of dead) {
    r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: at }), { supabase: fdb })
    assert.strictEqual(r17.status, 401, label); assert.strictEqual(r17.headers['WWW-Authenticate'], WWW_401_INVALID, label); assert.strictEqual(r17.rawBody, bodies[0], label)
  }
  ok(`${dead.length} dead links (revoked or expired token, revoked or idle-expired grant, user without a profile or moved to another client, missing client, wrong kind): 401 with error="invalid_token", identical body`)
  const noTables = {
    from(t) { const q = fdb.from(t); if (t.startsWith('oauth_')) q._run = async () => ({ data: null, error: { code: '42P01', message: 'relation "public.oauth_tokens" does not exist' } }); return q },
    rpc(...a) { return fdb.rpc(...a) },
  }
  r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: G_READ.at }), { supabase: noTables })
  assert.strictEqual(r17.status, 401); assert.strictEqual(r17.headers['WWW-Authenticate'], WWW_401_INVALID)
  r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: KS_RW.secret }), { supabase: noTables })
  assert.strictEqual(r17.status, 200, 'keys keep working without the OAuth tables')
  ok('before the OAuth migration: a bgmat_ token is 401 invalid_token (none can exist), keys answer as before')

  // ── scope ──
  let tl17 = await call2('tools/list', {}, G_READ.at)
  assert.deepStrictEqual(tl17.body.result.tools.map((x) => x.name), mcp.TOOL_NAMES)
  tl17 = await call2('initialize', { protocolVersion: '2025-06-18' }, G_READ.at)
  assert.ok(tl17.body.result.instructions.startsWith('Read-only access'))
  let rq17 = await tool2('mark_fix_done', { fix_id: 'engine_low:gemini' }, G_READ.at)
  assert.strictEqual(rq17.isError, true)
  assert.strictEqual(rq17.content[0].text, "This connection has read access only. Disconnect and connect again, ticking 'Also let it mark Fix This items done'.")
  const narrowTok = issueGrant(61, { scope: 'mcp:read offline_access', tokenScope: 'mcp:read mcp:write offline_access' })
  tl17 = await call2('tools/list', {}, narrowTok.at)
  assert.ok(!tl17.body.result.tools.some((x) => x.name === 'mark_fix_done'), 'a write token under a read grant reads only')
  const narrowGrant = issueGrant(61, { scope: 'mcp:read mcp:write offline_access', tokenScope: 'mcp:read offline_access' })
  tl17 = await call2('tools/list', {}, narrowGrant.at)
  assert.ok(!tl17.body.result.tools.some((x) => x.name === 'mark_fix_done'), 'a read token under a write grant reads only')
  tl17 = await call2('tools/list', {}, G_RW.at)
  assert.deepStrictEqual(tl17.body.result.tools.map((x) => x.name), [...mcp.TOOL_NAMES, ...mcp.WRITE_TOOL_NAMES])
  tl17 = await call2('initialize', { protocolVersion: '2025-06-18' }, G_RW.at)
  assert.ok(tl17.body.result.instructions.includes('This connection can also mark a fix done'))
  ok('scope: read sees the eight tools and gets the OAuth wording of the read-only refusal; mcp:write in BOTH token and grant lists mark_fix_done (with the OAuth instructions); a mismatch either way reads only')

  // ── the write through OAuth ──
  let o17 = oracle(61)
  const oauthTarget = o17.open.find((i) => !fdb.rows('fix_states').some((x) => x.client_id === 61 && x.fix_id === i.id))
  assert.ok(oauthTarget, 'an open fix with no row yet')
  const auditBefore17 = fdb.rows('client_events').length
  const writesBefore17 = (fdb.rows('affiliate_rate_limits').find((x) => x.key === 'mcp:client:61:writes:hour' && x.window_start === new Date(Math.floor(clock.getTime() / 3600000) * 3600000).toISOString()) || { count: 0 }).count
  const NOTE17 = 'Added a comparison page'
  rq17 = await tool2('mark_fix_done', { fix_id: oauthTarget.id, note: NOTE17 }, G_RW.at)
  assert.ok(!rq17.isError, JSON.stringify(rq17))
  assert.strictEqual(rq17.structuredContent.client_id, 61)
  const st17 = fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === oauthTarget.id)
  assert.deepStrictEqual([st17.status, st17.marked_by_grant, st17.marked_by_key, st17.marked_by], ['done', G_RW.grant.id, null, null])
  const ev17 = fdb.rows('client_events').slice(auditBefore17)
  assert.strictEqual(ev17.length, 1)
  assert.deepStrictEqual([ev17[0].client_id, ev17[0].actor, ev17[0].type, ev17[0].meta], [61, OWNER, 'mcp_fix_marked', { grant_id: G_RW.grant.id, fix_id: oauthTarget.id, note: NOTE17 }])
  const writesAfter17 = fdb.rows('affiliate_rate_limits').find((x) => x.key === 'mcp:client:61:writes:hour' && x.window_start === new Date(Math.floor(clock.getTime() / 3600000) * 3600000).toISOString()).count
  assert.strictEqual(writesAfter17, writesBefore17 + 1)
  ok('mark_fix_done through OAuth: marked_by_grant = the grant, marked_by_key null; one mcp_fix_marked event with grant_id in meta (no key_id) and the grant user as actor; the shared write counter +1')
  rq17 = await tool2('mark_fix_done', { fix_id: oauthTarget.id }, G_RW.at)
  assert.strictEqual(rq17.structuredContent.already_done, true)
  assert.strictEqual(fdb.rows('client_events').length, auditBefore17 + 1)
  ok('marking it again through OAuth is already_done: no write, no audit')

  // ── a key mark clears a stale grant marker; pre-migration fallback ──
  // Both reuse the fix just marked through OAuth: its row is set back to
  // reopened (an open state, so the id is on the open list again).
  const reopenTarget = () => {
    const row = fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === oauthTarget.id)
    Object.assign(row, { status: 'reopened', marked_by_grant: G_RW.grant.id, marked_by_key: null, marked_at: new Date(clock.getTime() - 9 * 86400_000).toISOString() })
    assert.ok(oracle(61).open.some((i) => i.id === oauthTarget.id), 'the reopened fix is open again')
  }
  reopenTarget()
  rq17 = await tool2('mark_fix_done', { fix_id: oauthTarget.id }, KS_RW.secret)
  assert.ok(!rq17.isError, JSON.stringify(rq17))
  const kst = fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === oauthTarget.id)
  assert.deepStrictEqual([kst.status, kst.marked_by_key, kst.marked_by_grant], ['done', KS_RW.row.id, null])
  ok('a key mark on a row last marked by a grant writes marked_by_grant null, as an OAuth mark writes marked_by_key null: never two markers at once')
  const preMig = {
    from(t) {
      const q = fdb.from(t)
      if (t === 'fix_states') {
        const run = q._run.bind(q)
        q._run = async () => (q.op === 'upsert' && q.payload.some((x) => 'marked_by_grant' in x)
          ? { data: null, error: { code: 'PGRST204', message: "Could not find the 'marked_by_grant' column of 'fix_states' in the schema cache" } }
          : run())
      }
      return q
    },
    rpc(...a) { return fdb.rpc(...a) },
  }
  reopenTarget()
  const preTarget = oauthTarget
  const pre17 = await send(ev({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'mark_fix_done', arguments: { fix_id: preTarget.id } } }, { key: KS_RW.secret, headers: V }), { supabase: preMig, config: CFG2 })
  assert.ok(pre17.body.result && !pre17.body.result.isError, JSON.stringify(pre17.body))
  const pst = fdb.rows('fix_states').find((x) => x.client_id === 61 && x.fix_id === preTarget.id)
  assert.deepStrictEqual([pst.status, pst.marked_by_key], ['done', KS_RW.row.id])
  ok('before the OAuth migration (no marked_by_grant column): a key mark retries without it and stands')

  // ── gates and counters ──
  fdb.rows('clients').find((c) => c.id === 61).plan = 'free'
  r17 = await call2('tools/list', {}, G_RW.at)
  assert.strictEqual(r17.body.error.code, -32002)
  fdb.rows('clients').find((c) => c.id === 61).plan = 'growth'
  fdb.rows('clients').find((c) => c.id === 61).category = 'research'
  r17 = await call2('tools/list', {}, G_RW.at)
  assert.strictEqual(r17.body.error.code, -32003)
  fdb.rows('clients').find((c) => c.id === 61).category = 'active'
  r17 = await call2('tools/list', {}, G_RW.at)
  assert.ok(r17.body.result)
  ok('a downgrade to Free closes the OAuth connection on the next call (-32002), a research client refuses it (-32003); restoring reopens it')
  const dayKey = `mcp:client:61:day`
  const dayCount = () => fdb.rows('affiliate_rate_limits').filter((x) => x.key === dayKey).reduce((a, x) => a + x.count, 0)
  const d0 = dayCount()
  await tool2('get_brand_overview', {}, G_READ.at)
  await tool2('get_brand_overview', {}, KS_READ.secret)
  assert.strictEqual(dayCount(), d0 + 2, 'one daily counter for keys and OAuth together')
  assert.ok(fdb.rows('affiliate_rate_limits').some((x) => x.key === `mcp:grant:${G_READ.grant.id}`))
  assert.ok(!fdb.rows('affiliate_rate_limits').some((x) => x.key === `mcp:key:${G_READ.grant.id}`))
  const lim = await call2('tools/list', {}, issueGrant(61).at, { config: { ...CFG2, perKeyPerMinute: 0 } })
  assert.strictEqual(lim.body.error.code, -32029); assert.strictEqual(lim.body.error.data.scope, 'grant_minute')
  assert.match(lim.body.error.message, /calls a minute per connection/)
  ok('the per-connection minute counter is mcp:grant:<id> (scope grant_minute, "per connection"); the daily counter is shared with keys')
  const stampGrant = issueGrant(61)
  await call2('ping', undefined, stampGrant.at)
  let sg = fdb.rows('oauth_grants').find((g) => g.id === stampGrant.grant.id)
  assert.strictEqual(sg.last_used_at, clock.toISOString())
  assert.strictEqual(sg.expires_at, new Date(clock.getTime() + 90 * 86400_000).toISOString())
  const firstStamp = sg.last_used_at
  clock = new Date(clock.getTime() + 30_000)
  await call2('ping', undefined, stampGrant.at)
  assert.strictEqual(fdb.rows('oauth_grants').find((g) => g.id === stampGrant.grant.id).last_used_at, firstStamp)
  clock = new Date(clock.getTime() + 31_000)
  await call2('ping', undefined, stampGrant.at)
  sg = fdb.rows('oauth_grants').find((g) => g.id === stampGrant.grant.id)
  assert.strictEqual(sg.last_used_at, clock.toISOString())
  ok('grant last_used_at is stamped at most once a minute, and each stamp moves the 90-day idle expiry')

  // ── logging ──
  const boom17 = {
    from(t) { const q = fdb.from(t); if (t === 'oauth_grants') q._run = async () => ({ data: null, error: { code: '08006', message: `reset near ${G_RW.at} and ${G_RW.at.toUpperCase()} hash ${oauthLib.sha256Hex(G_RW.at)} and bgmrt_${'d'.repeat(64)}` } }); return q },
    rpc(...a) { return fdb.rpc(...a) },
  }
  r17 = await send(ev({ jsonrpc: '2.0', id: 42, method: 'initialize', params: {} }, { key: G_RW.at }), { supabase: boom17 })
  assert.strictEqual(r17.status, 500)
  const oLines = captured.filter((l) => l.startsWith('[mcp-server/') && / cred=oauth /.test(l))
  assert.ok(oLines.length > 10)
  assert.ok(oLines.some((l) => / cred=oauth method=tools\/call tool=mark_fix_done fix_id=\S+ ms=\d+ outcome=read_only_grant$/.test(l)))
  const oHashes = OAUTH_SECRETS.map(oauthLib.sha256Hex)
  for (const l of captured.filter((x) => !x.startsWith('  ok - '))) {
    assert.ok(!/bgmat_|bgmrt_/i.test(l), `a log line contains an OAuth token prefix: ${l.slice(0, 80)}`)
    for (const s of OAUTH_SECRETS) assert.ok(!l.toLowerCase().includes(hexOf(s)), 'a log line contains a token secret part')
    for (const h of oHashes) assert.ok(!l.includes(h), 'a log line contains a token hash')
    assert.ok(!l.includes(NOTE17), 'a log line contains the note')
  }
  ok('OAuth lines carry cred=oauth (read_only_grant as the refusal outcome); no line holds a bgmat_ or bgmrt_ token in any case, its secret part, its hash or the note, even when an error message carries them')

  console.log(`\n${passed} passed`)
}

main().catch((err) => { console.error('FAILED:', err && err.message); console.error(err && err.stack && err.stack.split('\n').slice(1, 4).join('\n')); process.exit(1) })
