/**
 * mcp_admin.test.js: the admin MCP server at /mcp/admin
 * (netlify/functions/mcp-admin.js, docs/arch/mcp-admin-tools.md).
 *
 * Runs the real handler against the in-memory Supabase fake. The three admin
 * SQL functions of db/supabase-mcp-admin-2026-11-24.sql (admin_add_prompts,
 * admin_archive_prompts, admin_prompt_counts) are modelled in JS below, so
 * this proves the handler's control flow and data flow, not the Postgres
 * bodies; those are read back after the migration is applied.
 *
 * Run: node tests/mcp_admin.test.js (from brandgeo-dashboard/)
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const mod = require('../netlify/functions/mcp-admin')
const keyLib = require('../netlify/functions/_admin_api_key')

// Capture every console line, so the log checks can read them and the run
// output stays readable.
const logLines = []
for (const fn of ['log', 'warn', 'error', 'info']) {
  const orig = console[fn].bind(console)
  console[fn] = (...a) => { logLines.push(a.map(String).join(' ')); if (process.env.MCP_ADMIN_TEST_VERBOSE) orig(...a) }
}
const out = (s) => process.stdout.write(s + '\n')

let passed = 0
function ok(name) { passed += 1; out(`  ok ${passed} ${name}`) }
function section(name) { out(`\n# ${name}`) }

const T0 = new Date('2026-11-24T10:00:00Z')
const ADMIN = { id: '00000000-0000-4000-8000-00000000000a', email: 'admin@example.com' }
const VIEWER = { id: '00000000-0000-4000-8000-00000000000b', email: 'viewer@example.com' }
const BANNED = { id: '00000000-0000-4000-8000-00000000000c', email: 'banned@example.com', banned_until: '2999-01-01T00:00:00Z' }
const GONE = '00000000-0000-4000-8000-00000000000d'

const hex = (n) => n.toString(16).padStart(2, '0').repeat(24)
const KEY = {
  write: 'bgadm_' + hex(1),
  read: 'bgadm_' + hex(2),
  revoked: 'bgadm_' + hex(3),
  expired: 'bgadm_' + hex(4),
  viewer: 'bgadm_' + hex(5),
  nanExpiry: 'bgadm_' + hex(6),
  nullCreator: 'bgadm_' + hex(7),
  banned: 'bgadm_' + hex(8),
  deleted: 'bgadm_' + hex(9),
  unknown: 'bgadm_' + hex(10),
}

const CATS = ['general', 'mid', 'large', 'very_large', 'tool_discovery', 'geo_category', 'problem_based', 'direct_brand']
const BIG = { perKeyPerMinute: 100000, perKeyPerDay: 100000, writesPerKeyPerHour: 100000 }

// ── JS model of the three admin SQL functions ────────────────────────────────
function installAdminRpcs(db) {
  const orig = db.rpc.bind(db)
  db.adminFaults = {}
  const fail = (message) => ({ data: null, error: { message } })
  const counts = (cid) => {
    const ps = db.rows('prompts').filter((p) => Number(p.client_id) === Number(cid))
    return { active: ps.filter((p) => p.is_active === true).length, archived: ps.filter((p) => p.is_active !== true).length }
  }
  const capFor = (plan) => {
    const caps = db.rows('plan_prompt_caps')
    const row = caps.find((r) => r.plan === plan) || caps.find((r) => r.plan === 'free')
    return row ? Number(row.prompt_cap) : 5
  }
  const event = (cid, meta) => db.tables.client_events.push({ id: (db.serial.client_events = (db.serial.client_events || 0) + 1), client_id: cid, type: 'admin_prompt_change', meta, created_at: db.now().toISOString() })
  db.tables.client_events = db.tables.client_events || []
  db.rpc = async (name, args) => {
    if (!['admin_add_prompts', 'admin_archive_prompts', 'admin_prompt_counts'].includes(name)) return orig(name, args)
    db.calls.push({ rpc: name })
    db.rpcArgs = db.rpcArgs || []
    db.rpcArgs.push({ name, args: JSON.parse(JSON.stringify(args)) })
    if (db.adminFaults[name]) return { data: null, error: db.adminFaults[name] }

    if (name === 'admin_prompt_counts') {
      return { data: (args.p_client_ids || []).map((cid) => ({ client_id: cid, ...counts(cid) })), error: null }
    }

    if (args.p_actor == null || args.p_key_id == null) return fail('invalid_actor: missing actor')
    const cid = Number(args.p_client_id)
    const client = db.rows('clients').find((c) => Number(c.id) === cid)

    if (name === 'admin_archive_prompts') {
      if (!client) return fail(`client_not_found: ${cid}`)
      const archived = []
      const already = []
      const notFound = []
      for (const id of args.p_prompt_ids) {
        const p = db.rows('prompts').find((r) => Number(r.id) === Number(id) && Number(r.client_id) === cid)
        if (!p) notFound.push(Number(id))
        else if (p.is_active) { p.is_active = false; archived.push(Number(id)) } else already.push(Number(id))
      }
      if (archived.length) event(cid, { via: 'mcp_admin', key_id: args.p_key_id, action: 'archive', prompt_ids: archived, count: archived.length })
      return { data: { archived, already_archived: already, not_found: notFound, active_prompts: counts(cid).active }, error: null }
    }

    // admin_add_prompts
    if (!CATS.includes(args.p_category)) return fail(`invalid_category: ${args.p_category}`)
    if (!client) return fail(`client_not_found: ${cid}`)
    let locIds
    if (args.p_location_ids == null) {
      const r = await orig('ensure_primary_client_location', { p_client_id: cid })
      if (r.error) return r
      locIds = [Number(r.data)]
    } else {
      if (args.p_location_ids.length > 10) return fail('location_invalid: too many')
      locIds = [...new Set(args.p_location_ids.map(Number))]
      for (const lid of locIds) {
        const loc = db.rows('client_locations').find((l) => Number(l.id) === lid && Number(l.client_id) === cid)
        if (!loc) return fail(`location_invalid: ${lid}`)
        if (loc.archived_at) return fail(`location_archived: ${lid}`)
      }
    }
    if (args.p_texts.length * locIds.length > 100) return fail('too_many_rows: 100')
    const active = db.rows('prompts').filter((p) => Number(p.client_id) === cid && p.is_active)
    const seen = new Set(active.map((p) => `${String(p.text).toLowerCase()}|${p.location_id}`))
    const fresh = []
    const skipped = []
    for (const lid of locIds) {
      for (const t of args.p_texts) {
        const k = `${t.toLowerCase()}|${lid}`
        if (seen.has(k)) { skipped.push({ text: t, location_id: lid }); continue }
        seen.add(k)
        fresh.push({ text: t, location_id: lid })
      }
    }
    const cap = capFor(client.plan)
    if (fresh.length === 0) return { data: { created: [], skipped_duplicates: skipped, active_prompts: active.length, prompt_cap: cap, over_cap: active.length > cap }, error: null }
    if (active.length + fresh.length > cap && !args.p_allow_over_cap) return fail(`prompt_cap_reached: ${active.length} + ${fresh.length} > ${cap}`)
    const all = db.rows('prompts')
    let nextId = all.reduce((m, p) => Math.max(m, Number(p.id)), 0)
    let pos = all.filter((p) => Number(p.client_id) === cid).reduce((m, p) => Math.max(m, Number(p.position) || 0), 0)
    const created = []
    for (const f of fresh) {
      const row = { id: ++nextId, client_id: cid, text: f.text, category: args.p_category, is_active: true, position: ++pos, location_id: f.location_id, created_at: db.now().toISOString() }
      all.push(row)
      created.push({ prompt_id: row.id, text: row.text, location_id: row.location_id })
    }
    event(cid, { via: 'mcp_admin', key_id: args.p_key_id, action: 'add', prompt_ids: created.map((c) => c.prompt_id), count: created.length })
    const nowActive = active.length + created.length
    return { data: { created, skipped_duplicates: skipped, active_prompts: nowActive, prompt_cap: cap, over_cap: nowActive > cap }, error: null }
  }
  return db
}

// ── Fixtures ────────────────────────────────────────────────────────────────
function makeDb() {
  const db = createFakeSupabase({ now: () => T0, clientLocations: true })
  db.tables.prompts = []
  db.addUser('tok-admin', ADMIN)
  db.addUser('tok-viewer', VIEWER)
  db.addUser('tok-banned', BANNED)
  db.seed('user_profiles', [
    { id: ADMIN.id, role: 'admin' },
    { id: VIEWER.id, role: 'viewer' },
    { id: BANNED.id, role: 'admin' },
    { id: GONE, role: 'admin' },
  ])
  db.seed('clients', [
    { id: 1, name: 'Test Brand 1', slug: 'test-brand-1', plan: 'growth', category: 'customer', type: 'brand', brand_website: 'testbrand1.example', default_market_id: 'RO', brand_aliases: ['TB1'], known_competitors: ['Rival One'] },
    { id: 2, name: 'Test Brand 2', slug: 'test-brand-2', plan: 'free', category: 'customer', type: 'brand', brand_website: 'testbrand2.example', default_market_id: 'RO' },
    { id: 3, name: 'Test Research 3', slug: 'test-research-3', plan: 'free', category: 'research', type: 'brand', brand_website: 'research3.example', default_market_id: 'RO' },
    { id: 4, name: 'Test Brand 4', slug: 'test-brand-4', plan: 'free', category: 'customer', type: 'brand', brand_website: 'testbrand4.example', default_market_id: 'RO' },
  ])
  db.serial.clients = 4
  db.tables.client_locations = [
    { id: 101, client_id: 1, market_id: 'RO', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
    { id: 102, client_id: 1, market_id: 'RO', region_id: 'B', is_primary: false, position: 1, archived_at: null },
    { id: 103, client_id: 1, market_id: 'RO', region_id: 'CJ', is_primary: false, position: 2, archived_at: '2026-11-01T00:00:00Z' },
    { id: 201, client_id: 2, market_id: 'RO', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
  ]
  db.serial.client_locations = 201
  const P = (id, cid, text, loc, active = true) => ({ id, client_id: cid, text, category: 'general', is_active: active, position: id, location_id: loc, created_at: T0.toISOString() })
  db.tables.prompts.push(
    P(1, 1, 'Best catering companies in town', 101),
    P(2, 1, 'Corporate event food delivery options', 102),
    P(3, 1, 'Old archived question about lunch', 101, false),
    P(11, 2, 'Free prompt one about software', 201),
    P(12, 2, 'Free prompt two about software', 201),
    P(13, 2, 'Free prompt three about software', 201),
    P(14, 2, 'Free prompt four about software', 201),
    P(15, 2, 'Free prompt five about software', 201),
  )
  db.seed('plan_prompt_caps', [{ id: 1, plan: 'free', prompt_cap: 5 }, { id: 2, plan: 'growth', prompt_cap: 35 }])
  const k = (id, key, extra) => Object.assign({ id, key_hash: keyLib.hashAdminApiKey(key), key_prefix: keyLib.adminApiKeyPrefix(key), created_by: ADMIN.id, scope: 'prompts_write', expires_at: '2027-11-24T00:00:00Z', revoked_at: null, last_used_at: null }, extra)
  db.seed('admin_api_keys', [
    k(1, KEY.write),
    k(2, KEY.read, { scope: 'read' }),
    k(3, KEY.revoked, { revoked_at: '2026-11-20T00:00:00Z' }),
    k(4, KEY.expired, { expires_at: '2026-11-23T00:00:00Z' }),
    k(5, KEY.viewer, { created_by: VIEWER.id }),
    k(6, KEY.nanExpiry, { expires_at: 'not a date' }),
    k(7, KEY.nullCreator, { created_by: null }),
    k(8, KEY.banned, { created_by: BANNED.id }),
    k(9, KEY.deleted, { created_by: GONE }),
  ])
  return installAdminRpcs(db)
}

let reqN = 0
async function send(db, key, msg, { headers = {}, config = BIG, method = 'POST', raw = null, now = T0 } = {}) {
  const h = Object.assign({ 'content-type': 'application/json' }, headers)
  if (key !== null) h.authorization = 'Bearer ' + key
  const event = { httpMethod: method, path: '/mcp/admin', headers: h, body: raw !== null ? raw : JSON.stringify(msg), isBase64Encoded: false }
  const res = await mod.handle(event, { awsRequestId: `req${++reqN}-xxxxxxxx` }, { supabase: db, now: () => now, config })
  let body = null
  if (res.body) { try { body = JSON.parse(res.body) } catch { body = res.body } }
  return { status: res.statusCode, headers: res.headers || {}, body }
}
const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, params })
const tool = (name, args) => rpc('tools/call', { name, arguments: args })
async function callTool(db, key, name, args, opts) {
  const r = await send(db, key, tool(name, args), opts)
  const result = r.body && r.body.result
  if (result && result.isError) return { ...r, toolError: JSON.parse(result.content[0].text).error }
  return { ...r, data: result ? result.structuredContent : undefined }
}
const dbCallCount = (db) => db.calls.length

async function main() {
  // ── Pure helpers ──────────────────────────────────────────────────────────
  section('pure helpers')
  assert.deepStrictEqual(mod.TOOL_NAMES, ['list_clients', 'get_client', 'list_prompts', 'add_prompts', 'archive_prompts'])
  assert.deepStrictEqual(mod.WRITE_TOOL_NAMES, ['add_prompts', 'archive_prompts'])
  ok('tool names pinned')
  assert.deepStrictEqual(mod.SUPPORTED_PROTOCOL_VERSIONS, ['2025-11-25', '2025-06-18', '2025-03-26'])
  ok('protocol versions pinned')
  assert.strictEqual(mod.normalizePromptText('  Best   tools\tfor  teams  '), 'Best tools for teams')
  for (const bad of ['abc', 'x'.repeat(501), 'Bell \x07 here', 42, null]) {
    assert.throws(() => mod.normalizePromptText(bad), (e) => e.code === 'invalid_text')
  }
  ok('normalizePromptText trims, collapses and refuses short, long, control and non strings')
  const scrubbed = mod.scrub(`failed with ${KEY.write} and bgmcp_1_${'a'.repeat(48)} and ${'f'.repeat(64)}`)
  assert.ok(!scrubbed.includes(KEY.write) && !scrubbed.includes('a'.repeat(48)) && !scrubbed.includes('f'.repeat(64)))
  assert.ok(scrubbed.includes('[redacted]'))
  ok('scrub removes keys and long hex')
  assert.ok(keyLib.ADMIN_API_KEY_RE.test(keyLib.makeAdminApiKey()))
  assert.strictEqual(keyLib.adminApiKeyPrefix(KEY.write), 'bgadm_' + KEY.write.slice(6, 12))
  assert.strictEqual(keyLib.hashAdminApiKey(KEY.write).length, 64)
  ok('key helpers: shape, prefix, sha256 hex')

  // ── Transport ─────────────────────────────────────────────────────────────
  section('transport')
  let db = makeDb()
  let r = await send(db, KEY.write, rpc('ping'), { method: 'GET' })
  assert.strictEqual(r.status, 405)
  assert.strictEqual(r.headers.Allow || r.headers.allow, 'POST')
  ok('GET is 405 with Allow: POST')
  r = await send(db, KEY.write, null, { raw: 'x'.repeat(65537) })
  assert.strictEqual(r.status, 413)
  ok('body over 64 KiB is 413')
  r = await send(db, KEY.write, rpc('ping'), { headers: { origin: 'https://evil.example' } })
  assert.strictEqual(r.status, 403)
  assert.strictEqual(r.body.error.code, -32600)
  ok('foreign Origin is 403')
  r = await send(db, KEY.write, rpc('ping'), { headers: { origin: 'https://app.getbrandgeo.com' } })
  assert.strictEqual(r.status, 200)
  ok('allowed Origin passes')
  r = await send(db, KEY.write, null, { raw: '{not json' })
  assert.strictEqual(r.status, 400); assert.strictEqual(r.body.error.code, -32700)
  ok('parse error is -32700')
  r = await send(db, KEY.write, [rpc('ping')])
  assert.strictEqual(r.status, 400); assert.strictEqual(r.body.error.code, -32600)
  ok('a batch is refused')
  r = await send(db, KEY.write, { jsonrpc: '2.0', method: 'notifications/initialized' })
  assert.strictEqual(r.status, 202)
  ok('notification is 202 with no body')
  r = await send(db, KEY.write, { jsonrpc: '2.0', id: { x: 1 }, method: 'ping' })
  assert.strictEqual(r.status, 400)
  ok('object id is refused')

  // ── Authentication ────────────────────────────────────────────────────────
  section('authentication')
  for (const [label, key] of [['missing', null], ['malformed', 'bgadm_123'], ['customer key', 'bgmcp_1_' + 'a'.repeat(48)], ['upper hex', 'bgadm_' + 'A'.repeat(48)]]) {
    db = makeDb()
    r = await send(db, key, rpc('ping'))
    assert.strictEqual(r.status, 401, label)
    assert.strictEqual(r.body.error.code, -32001)
    assert.ok(/Bearer realm="brandgeo-admin"/.test(r.headers['WWW-Authenticate'] || r.headers['www-authenticate']))
    assert.strictEqual(dbCallCount(db), 0, `${label}: no database read`)
    ok(`${label} key: 401 with WWW-Authenticate and no database read`)
  }
  for (const [label, key] of [['unknown', KEY.unknown], ['revoked', KEY.revoked], ['expired', KEY.expired], ['NaN expiry', KEY.nanExpiry]]) {
    db = makeDb()
    r = await send(db, key, rpc('ping'))
    assert.strictEqual(r.status, 401, label)
    ok(`${label} key: 401`)
  }
  for (const [label, key] of [['viewer creator', KEY.viewer], ['null creator', KEY.nullCreator], ['banned creator', KEY.banned], ['deleted creator', KEY.deleted]]) {
    db = makeDb()
    r = await send(db, key, rpc('ping'))
    assert.strictEqual(r.status, 403, label)
    assert.strictEqual(r.body.error.code, -32003)
    assert.strictEqual(r.body.error.message, 'admin_required')
    ok(`${label}: 403 admin_required`)
  }
  db = makeDb()
  db.faults.push({ table: 'user_profiles', op: 'select', error: { message: 'boom' } })
  r = await send(db, KEY.write, rpc('ping'))
  assert.strictEqual(r.status, 403)
  ok('profile read fault: 403, never trusted')
  db = makeDb()
  db.faults.push({ table: 'admin_api_keys', op: 'select', error: { message: 'boom' } })
  r = await send(db, KEY.write, rpc('ping'))
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body.error.code, -32603)
  ok('key read fault: 500')
  db = makeDb()
  db.tables.user_profiles.find((p) => p.id === ADMIN.id).role = 'viewer'
  r = await send(db, KEY.write, rpc('ping'))
  assert.strictEqual(r.status, 403)
  ok('creator demoted after minting: the key stops working')
  db = makeDb()
  r = await send(db, KEY.write, rpc('ping'))
  assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body.result, {})
  ok('valid admin key: ping answers {}')

  // customer MCP refuses an admin key
  require('./helpers/ts_require')
  const customer = require('../netlify/functions/mcp-server')
  db = makeDb()
  const cr = await customer.handle({ httpMethod: 'POST', path: '/mcp', headers: { authorization: 'Bearer ' + KEY.write, 'content-type': 'application/json' }, body: JSON.stringify(rpc('ping')), isBase64Encoded: false }, { awsRequestId: 'cust0001' }, { supabase: db, now: () => T0 })
  assert.strictEqual(cr.statusCode, 401)
  ok('the customer MCP answers 401 to an admin key')

  // ── last_used_at throttle ───────────────────────────────────────────────────
  section('last_used_at')
  db = makeDb()
  await send(db, KEY.write, rpc('ping'))
  assert.strictEqual(db.rows('admin_api_keys').find((k) => k.id === 1).last_used_at, T0.toISOString())
  const updatesAfterFirst = db.calls.filter((c) => c.table === 'admin_api_keys' && c.op === 'update').length
  await send(db, KEY.write, rpc('ping'), { now: new Date(T0.getTime() + 30000) })
  assert.strictEqual(db.calls.filter((c) => c.table === 'admin_api_keys' && c.op === 'update').length, updatesAfterFirst)
  await send(db, KEY.write, rpc('ping'), { now: new Date(T0.getTime() + 61000) })
  assert.strictEqual(db.calls.filter((c) => c.table === 'admin_api_keys' && c.op === 'update').length, updatesAfterFirst + 1)
  ok('last_used_at is written at most once a minute')

  // ── Protocol ────────────────────────────────────────────────────────────────
  section('protocol')
  db = makeDb()
  r = await send(db, KEY.write, rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } }))
  assert.strictEqual(r.body.result.protocolVersion, '2025-06-18')
  assert.strictEqual(r.body.result.serverInfo.name, 'brandgeo-admin')
  r = await send(db, KEY.write, rpc('initialize', { protocolVersion: '1999-01-01' }))
  assert.strictEqual(r.body.result.protocolVersion, '2025-11-25')
  ok('initialize negotiates, falls back to the latest')
  r = await send(db, KEY.write, rpc('ping'), { headers: { 'mcp-protocol-version': '2020-01-01' } })
  assert.strictEqual(r.status, 400)
  ok('unsupported MCP-Protocol-Version header is 400')
  r = await send(db, KEY.write, rpc('tools/list'), { headers: { 'mcp-protocol-version': '2025-03-26' } })
  assert.strictEqual(r.body.result.tools.length, 5)
  assert.ok(r.body.result.tools.every((t) => t.outputSchema === undefined))
  r = await send(db, KEY.write, rpc('tools/list'), { headers: { 'mcp-protocol-version': '2025-11-25' } })
  assert.ok(r.body.result.tools.every((t) => t.outputSchema))
  ok('outputSchema only from 2025-06-18')
  r = await send(db, KEY.read, rpc('tools/list'))
  assert.deepStrictEqual(r.body.result.tools.map((t) => t.name), ['list_clients', 'get_client', 'list_prompts'])
  ok('a read key lists the 3 read tools only')
  r = await send(db, KEY.write, rpc('resources/list'))
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.error.code, -32601)
  ok('unknown method is -32601')
  r = await send(db, KEY.write, tool('drop_everything', {}))
  assert.strictEqual(r.body.error.code, -32602)
  ok('unknown tool is -32602')
  let t = await callTool(db, KEY.write, 'list_clients', { bogus: 1 })
  assert.strictEqual(t.toolError.code, 'unknown_argument')
  ok('unknown argument is refused')
  t = await callTool(db, KEY.write, 'list_clients', [])
  assert.ok(t.toolError)
  ok('array arguments are refused')

  // ── Scope ───────────────────────────────────────────────────────────────────
  section('scope')
  db = makeDb()
  t = await callTool(db, KEY.read, 'add_prompts', { client_id: 4, texts: ['Best accounting tools for freelancers'] })
  assert.strictEqual(t.toolError.code, 'scope_read_only')
  assert.ok(!db.calls.some((c) => c.rpc === 'admin_add_prompts'))
  t = await callTool(db, KEY.read, 'archive_prompts', { client_id: 1, prompt_ids: [1] })
  assert.strictEqual(t.toolError.code, 'scope_read_only')
  ok('a read key cannot write, and no write rpc runs')

  // ── list_clients ────────────────────────────────────────────────────────────
  section('list_clients')
  db = makeDb()
  t = await callTool(db, KEY.read, 'list_clients', {})
  assert.deepStrictEqual(t.data.clients.map((c) => c.client_id), [1, 2, 4])
  const c1 = t.data.clients[0]
  assert.strictEqual(c1.active_prompts, 2); assert.strictEqual(c1.archived_prompts, 1); assert.strictEqual(c1.prompt_cap, 35)
  assert.deepStrictEqual(c1.locations.map((l) => l.label), ['Romania', 'Romania · Bucharest'])
  assert.strictEqual(t.data.next_cursor, null)
  ok('research hidden by default; counts, cap, live locations')
  t = await callTool(db, KEY.read, 'list_clients', { include_research: true })
  assert.deepStrictEqual(t.data.clients.map((c) => c.client_id), [1, 2, 3, 4])
  ok('include_research shows research accounts')
  t = await callTool(db, KEY.read, 'list_clients', { zero_prompts_only: true })
  assert.deepStrictEqual(t.data.clients.map((c) => c.client_id), [4])
  ok('zero_prompts_only lists accounts with no active prompt')
  t = await callTool(db, KEY.read, 'list_clients', { search: 'BRAND 2' })
  assert.deepStrictEqual(t.data.clients.map((c) => c.client_id), [2])
  t = await callTool(db, KEY.read, 'list_clients', { plan: 'growth' })
  assert.deepStrictEqual(t.data.clients.map((c) => c.client_id), [1])
  ok('search and plan filters')
  t = await callTool(db, KEY.read, 'list_clients', { limit: 2 }, { config: { ...BIG, scanBatch: 2 } })
  assert.deepStrictEqual(t.data.clients.map((c) => c.client_id), [1, 2])
  assert.ok(t.data.next_cursor)
  const t2 = await callTool(db, KEY.read, 'list_clients', { limit: 2, cursor: t.data.next_cursor }, { config: { ...BIG, scanBatch: 2 } })
  assert.deepStrictEqual(t2.data.clients.map((c) => c.client_id), [4])
  assert.strictEqual(t2.data.next_cursor, null)
  ok('paging with a small scan batch skips nothing')
  t = await callTool(db, KEY.read, 'list_clients', { cursor: '!!!' })
  assert.strictEqual(t.toolError.code, 'invalid_cursor')
  ok('bad cursor is invalid_cursor')
  const bigCursor = Buffer.from(JSON.stringify({ id: 2147483648 })).toString('base64url')
  t = await callTool(db, KEY.read, 'list_clients', { cursor: bigCursor })
  assert.strictEqual(t.toolError.code, 'invalid_cursor')
  t = await callTool(db, KEY.read, 'list_prompts', { client_id: 1, cursor: bigCursor })
  assert.strictEqual(t.toolError.code, 'invalid_cursor')
  ok('cursor id above INT4_MAX is invalid_cursor, not a 500')

  // ── get_client ──────────────────────────────────────────────────────────────
  section('get_client')
  t = await callTool(db, KEY.read, 'get_client', { client_id: 1 })
  assert.strictEqual(t.data.remaining, 33)
  assert.deepStrictEqual(t.data.active_prompt_texts.map((p) => p.prompt_id), [1, 2])
  assert.strictEqual(t.data.active_prompt_texts_truncated, false)
  assert.deepStrictEqual(t.data.brand_aliases, ['TB1'])
  ok('remaining, active texts, aliases')
  t = await callTool(db, KEY.read, 'get_client', { client_id: 2 })
  assert.strictEqual(t.data.remaining, 0)
  ok('remaining never goes below 0')
  t = await callTool(db, KEY.read, 'get_client', { client_id: 999 })
  assert.strictEqual(t.toolError.code, 'client_not_found')
  ok('unknown client is client_not_found')

  // ── list_prompts ────────────────────────────────────────────────────────────
  section('list_prompts')
  t = await callTool(db, KEY.read, 'list_prompts', { client_id: 1 })
  assert.deepStrictEqual(t.data.prompts.map((p) => p.prompt_id), [1, 2])
  assert.strictEqual(t.data.prompts[1].location_label, 'Romania · Bucharest')
  t = await callTool(db, KEY.read, 'list_prompts', { client_id: 1, include_archived: true })
  assert.deepStrictEqual(t.data.prompts.map((p) => p.prompt_id), [1, 2, 3])
  t = await callTool(db, KEY.read, 'list_prompts', { client_id: 1, location_id: 102 })
  assert.deepStrictEqual(t.data.prompts.map((p) => p.prompt_id), [2])
  t = await callTool(db, KEY.read, 'list_prompts', { client_id: 1, limit: 1 })
  assert.ok(t.data.next_cursor)
  const lp2 = await callTool(db, KEY.read, 'list_prompts', { client_id: 1, limit: 1, cursor: t.data.next_cursor })
  assert.deepStrictEqual(lp2.data.prompts.map((p) => p.prompt_id), [2])
  t = await callTool(db, KEY.read, 'list_prompts', { client_id: 999 })
  assert.strictEqual(t.toolError.code, 'client_not_found')
  ok('active only, archived, location filter, paging, labels, unknown client')

  // ── add_prompts ─────────────────────────────────────────────────────────────
  section('add_prompts')
  db = makeDb()
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 4, texts: ['Best accounting tools for freelancers', 'Invoice software  for small   teams'] })
  assert.strictEqual(t.data.created.length, 2)
  assert.strictEqual(t.data.created[1].text, 'Invoice software for small teams')
  const newLoc = db.rows('client_locations').find((l) => l.client_id === 4)
  assert.ok(newLoc && newLoc.is_primary)
  assert.ok(t.data.created.every((c) => c.location_id === Number(newLoc.id) && c.location_label === 'Romania'))
  const args0 = db.rpcArgs.find((a) => a.name === 'admin_add_prompts').args
  assert.strictEqual(args0.p_actor, ADMIN.id); assert.strictEqual(args0.p_key_id, 1); assert.strictEqual(args0.p_location_ids, null); assert.strictEqual(args0.p_category, 'general')
  let ev = db.rows('client_events').filter((e) => e.type === 'admin_prompt_change')
  assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].meta.via, 'mcp_admin')
  ok('zero prompt account: primary location created, prompts added, one event, actor passed')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 4, texts: ['best accounting tools for FREELANCERS'] })
  assert.strictEqual(t.data.created.length, 0)
  assert.strictEqual(t.data.skipped_duplicates.length, 1)
  assert.strictEqual(db.rows('client_events').filter((e) => e.type === 'admin_prompt_change').length, 1)
  ok('all duplicates: a noop with no event')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 4, texts: ['A brand new question here'] })
  assert.strictEqual(t.data.created.length, 1)
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 4, texts: ['Question six', 'Question seven', 'Question eight'] })
  assert.strictEqual(t.toolError.code, 'prompt_cap_reached')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 4, texts: ['Question six', 'Question seven', 'Question eight'], allow_over_cap: true })
  assert.strictEqual(t.data.over_cap, true); assert.strictEqual(t.data.active_prompts, 6)
  ok('cap enforced; allow_over_cap goes over and says so')
  db = makeDb()
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: ['Wedding catering prices'], location_ids: [101, 102, 102] })
  assert.strictEqual(t.data.created.length, 2)
  assert.deepStrictEqual(t.data.created.map((c) => c.location_label), ['Romania', 'Romania · Bucharest'])
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: ['Wedding catering prices'], location_ids: [103] })
  assert.strictEqual(t.toolError.code, 'location_archived')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: ['Wedding catering prices'], location_ids: [201] })
  assert.strictEqual(t.toolError.code, 'location_invalid')
  ok('one row per location; archived and foreign locations refused')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: ['Some valid text'], category: 'nonsense' })
  assert.strictEqual(t.toolError.code, 'invalid_category')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: Array.from({ length: 11 }, (_, i) => `Question number ${i}`), location_ids: [101, 102, 104, 105, 106, 107, 108, 109, 110, 111] })
  assert.strictEqual(t.toolError.code, 'too_many_rows')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: ['Bell \x07 in text'] })
  assert.strictEqual(t.toolError.code, 'invalid_text')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 1, texts: [] })
  assert.strictEqual(t.toolError.code, 'invalid_text')
  t = await callTool(db, KEY.write, 'add_prompts', { client_id: 999, texts: ['Some valid text'] })
  assert.strictEqual(t.toolError.code, 'client_not_found')
  ok('invalid_category, too_many_rows, invalid_text, client_not_found')
  db = makeDb()
  db.adminFaults.admin_add_prompts = { message: 'connection reset by peer' }
  r = await send(db, KEY.write, tool('add_prompts', { client_id: 1, texts: ['Some valid text'] }))
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body.error.code, -32603)
  ok('an unexpected database error is a 500, not a tool error')

  // ── archive_prompts ─────────────────────────────────────────────────────────
  section('archive_prompts')
  db = makeDb()
  t = await callTool(db, KEY.write, 'archive_prompts', { client_id: 1, prompt_ids: [1, 3, 11, 999] })
  assert.deepStrictEqual(t.data.archived, [1])
  assert.deepStrictEqual(t.data.already_archived, [3])
  assert.deepStrictEqual(t.data.not_found, [11, 999])
  assert.strictEqual(t.data.active_prompts, 1)
  assert.strictEqual(db.rows('prompts').find((p) => p.id === 11).is_active, true)
  assert.strictEqual(db.rows('prompts').length, 8)
  assert.strictEqual(db.rows('client_events').filter((e) => e.type === 'admin_prompt_change').length, 1)
  ok("archives, reports already archived, another client's ids are not_found, nothing deleted")
  t = await callTool(db, KEY.write, 'archive_prompts', { client_id: 1, prompt_ids: [1] })
  assert.deepStrictEqual(t.data.archived, [])
  assert.strictEqual(db.rows('client_events').filter((e) => e.type === 'admin_prompt_change').length, 1)
  ok('a repeat archive is a noop with no event')
  assert.ok(!db.calls.some((c) => c.op === 'delete'))
  const src = fs.readFileSync(path.join(__dirname, '../netlify/functions/mcp-admin.js'), 'utf8')
  assert.ok(!/\.delete\(/.test(src))
  ok('no delete call is made, and the source has none')

  // ── Rate limits ─────────────────────────────────────────────────────────────
  section('rate limits')
  db = makeDb()
  await send(db, KEY.write, rpc('ping'), { config: { ...BIG, perKeyPerMinute: 1 } })
  r = await send(db, KEY.write, rpc('ping'), { config: { ...BIG, perKeyPerMinute: 1 } })
  assert.strictEqual(r.body.error.code, -32029)
  assert.strictEqual(r.body.error.data.scope, 'key_minute')
  assert.strictEqual(r.headers['Retry-After'], '60')
  ok('minute limit: -32029, Retry-After 60')
  db = makeDb()
  const dayCfg = { ...BIG, perKeyPerDay: 1 }
  await callTool(db, KEY.read, 'list_clients', {}, { config: dayCfg })
  r = await send(db, KEY.read, tool('list_clients', {}), { config: dayCfg })
  assert.strictEqual(r.body.error.data.scope, 'key_day')
  assert.strictEqual(r.headers['Retry-After'], '50400')
  r = await send(db, KEY.read, rpc('tools/list'), { config: dayCfg })
  assert.ok(r.body.result)
  ok('day limit counts tool calls only, Retry-After to 00:00 UTC')
  db = makeDb()
  const wCfg = { ...BIG, writesPerKeyPerHour: 1 }
  await callTool(db, KEY.write, 'archive_prompts', { client_id: 1, prompt_ids: [1] }, { config: wCfg })
  r = await send(db, KEY.write, tool('archive_prompts', { client_id: 1, prompt_ids: [2] }), { config: wCfg })
  assert.strictEqual(r.body.error.data.scope, 'key_write_hour')
  assert.ok(/1 write calls an hour per key/.test(r.body.error.message))
  assert.strictEqual(r.headers['Retry-After'], '3600')
  assert.strictEqual(db.rows('prompts').find((p) => p.id === 2).is_active, true)
  t = await callTool(db, KEY.write, 'list_clients', {}, { config: wCfg })
  assert.ok(t.data)
  ok('write limit: second write refused before it runs, reads still pass')
  db = makeDb()
  db.rpcFaults = { affiliate_rate_check: { message: 'rate table gone' } }
  r = await send(db, KEY.write, rpc('ping'))
  assert.strictEqual(r.status, 500)
  ok('a rate check fault is a 500, never open')

  // ── Logs ────────────────────────────────────────────────────────────────────
  section('logs')
  const secrets = [...Object.values(KEY), ...Object.values(KEY).map(keyLib.hashAdminApiKey), ...Object.values(KEY).map(keyLib.adminApiKeyPrefix), 'Best accounting tools', 'Wedding catering', 'BRAND 2', 'Bell']
  for (const line of logLines) for (const s of secrets) assert.ok(!line.includes(s), `log leaks ${s.slice(0, 12)}: ${line}`)
  ok('no log line carries a key, prefix, hash, prompt text or search string')
  const LINE = /^\[mcp-admin\/[^\]]{1,8}\] (-|initialize|ping|tools\/list|tools\/call|other)( [a-z_]+)?( client=\d+)? key=(-|[0-9a-zA-Z-]+) status=\d{3}( code=[-a-z_0-9]+)? ms=\d+$/
  const reqLines = logLines.filter((l) => l.startsWith('[mcp-admin/') && / status=\d{3}/.test(l))
  assert.ok(reqLines.length > 50)
  for (const l of reqLines) assert.ok(LINE.test(l), `bad log line: ${l}`)
  ok(`every request log line has the fixed shape (${reqLines.length} lines)`)

  // ── Static checks ───────────────────────────────────────────────────────────
  section('static checks')
  const sql = fs.readFileSync(path.join(__dirname, '../../db/supabase-mcp-admin-2026-11-24.sql'), 'utf8')
  const code = sql.split('\n').map((l) => l.replace(/--.*$/, '')).join('\n')
  assert.ok(!/\bdelete\s+from\b/i.test(code) && !/\btruncate\b/i.test(code))
  for (const fn of ['admin_add_prompts', 'admin_archive_prompts']) {
    const start = code.indexOf(`function public.${fn}`)
    assert.ok(start >= 0, fn)
    const body = code.slice(start, code.indexOf('$$;', code.indexOf('$$', start) + 2))
    assert.ok(/security definer/i.test(body) && /set search_path = ''/i.test(body), `${fn} definer and search_path`)
    const lock = body.indexOf("pg_advisory_xact_lock(hashtextextended('prompts_cap:'")
    const count = body.indexOf('select count(*)')
    assert.ok(lock >= 0 && (count < 0 || lock < count), `${fn} takes the cap lock before counting`)
  }
  assert.ok(/revoke all on table public\.admin_api_keys from public, anon, authenticated, service_role;/.test(code))
  assert.ok(/grant select, insert, update on table public\.admin_api_keys to service_role;/.test(code))
  ok('migration: no delete or truncate, definer with empty search_path, lock before count, grants')
  const toml = fs.readFileSync(path.join(__dirname, '../netlify.toml'), 'utf8')
  const iAdmin = toml.indexOf('from = "/mcp/admin"')
  const iMcp = toml.search(/from = "\/mcp"\s*\n/)
  assert.ok(iAdmin >= 0 && iMcp >= 0 && iAdmin < iMcp, '/mcp/admin rewrite comes before /mcp')
  assert.ok(/\[functions\."mcp-admin"\]\s*\n\s*timeout = 26/.test(toml))
  ok('netlify.toml: /mcp/admin before /mcp, timeout 26')

  out(`\nall ${passed} checks passed`)
}

main().catch((err) => { process.stderr.write('FAILED: ' + (err && err.stack || err) + '\n'); process.exit(1) })
