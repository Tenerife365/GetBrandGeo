/**
 * client_locations_endpoint.test.js - netlify/functions/client-locations.js
 * (docs/arch/multi-location-collection.md section 5.3).
 *
 * Run: `node tests/client_locations_endpoint.test.js` from brandgeo-dashboard/.
 *
 * Fakes: @supabase/supabase-js (tests/helpers/fake_supabase_mem.js with the
 * opt-in client_locations SQL functions) and _auth.js (a requireAuth that
 * honours clientId the way the real one does: a viewer of another client is
 * 403 "Forbidden: client mismatch"). No network. Fixtures name no real client.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'

const FN = path.join(__dirname, '..', 'netlify', 'functions')

let passes = 0
let failures = 0
async function check(name, fn) {
  try { await fn(); passes++; console.log(`  ok   ${name}`) } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e && e.message}`) }
}

function installModule(resolved, exportsObj) {
  const m = new Module(resolved, null)
  m.filename = resolved
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolved] = m
}

let db = null
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => db })

const PROFILES = {
  'tok-admin':   { id: '00000000-0000-4000-8000-0000000000a1', role: 'admin',  client_id: null },
  'tok-viewerA': { id: '00000000-0000-4000-8000-0000000000b1', role: 'viewer', client_id: 1 },
}
const authCalls = []
installModule(path.join(FN, '_auth.js'), {
  async requireAuth(event, { adminOnly = false, clientId = null } = {}) {
    authCalls.push({ clientId })
    if (event.httpMethod === 'OPTIONS') return { response: { statusCode: 204, headers: {}, body: '' } }
    const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : ''
    const p = PROFILES[token]
    if (!p) return { response: { statusCode: 401, headers: {}, body: JSON.stringify({ error: 'Unauthorized: missing token' }) } }
    if (adminOnly && p.role !== 'admin') return { response: { statusCode: 403, headers: {}, body: JSON.stringify({ error: 'Forbidden: admin access required' }) } }
    if (clientId !== null && p.role !== 'admin' && String(p.client_id) !== String(clientId)) {
      return { response: { statusCode: 403, headers: {}, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) } }
    }
    return { user: { id: p.id }, profile: { role: p.role, client_id: p.client_id }, supabase: {}, headers: { 'Content-Type': 'application/json' } }
  },
})

const fnMod = require(path.join(FN, 'client-locations.js'))

function fresh() {
  db = createFakeSupabase({ clientLocations: true })
  db.seed('clients', [
    { id: 1, name: 'Client A Example', plan: 'radar', default_market_id: 'RO', default_region_id: 'ALL' },
    { id: 2, name: 'Client B Example', plan: 'growth', default_market_id: 'US', default_region_id: null },
    { id: 3, name: 'Client C Example', plan: 'platinum', default_market_id: 'WW', default_region_id: null },
  ])
  db.seed('client_locations', [
    { id: 10, client_id: 1, market_id: 'RO', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
    { id: 11, client_id: 1, market_id: 'ES', region_id: 'TF', is_primary: false, position: 1, archived_at: null },
    { id: 12, client_id: 1, market_id: 'DE', region_id: 'ALL', is_primary: false, position: 2, archived_at: '2026-11-01T00:00:00.000Z' },
    { id: 20, client_id: 2, market_id: 'US', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
    { id: 21, client_id: 2, market_id: 'US', region_id: 'NYC', is_primary: false, position: 1, archived_at: null },
  ])
  db.seed('prompts', [
    { id: 100, client_id: 1, text: 'p one', is_active: true, location_id: 10 },
    { id: 101, client_id: 1, text: 'p two', is_active: true, location_id: 11 },
    { id: 102, client_id: 1, text: 'p three', is_active: false, location_id: 11 },
    { id: 200, client_id: 2, text: 'p four', is_active: true, location_id: 21 },
  ])
  db.seed('client_events', [])
}

async function call(token, body, method = 'POST') {
  const res = await fnMod.handler({ httpMethod: method, headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' }, body: typeof body === 'string' ? body : JSON.stringify(body) })
  let parsed = null
  try { parsed = JSON.parse(res.body) } catch { parsed = res.body }
  return { status: res.statusCode, body: parsed }
}
const snapshot = () => JSON.stringify({ l: db.rows('client_locations'), c: db.rows('clients'), e: db.rows('client_events') })

;(async () => {
  const log = console.log; const warn = console.warn; const err = console.error
  console.warn = () => {}; console.error = () => {}
  console.log = (...a) => { if (String(a[0] || '').startsWith('[ClientLocations')) return; log(...a) }

  console.log('auth gate')
  await check('no token: 401 from requireAuth, nothing read', async () => {
    fresh(); db.calls.length = 0
    const r = await call('nope', { action: 'list', client_id: 1 })
    assert.strictEqual(r.status, 401); assert.ok(!('code' in r.body)); assert.strictEqual(db.calls.length, 0)
  })
  await check('client_id is parsed before requireAuth and passed to it', async () => {
    fresh(); authCalls.length = 0
    await call('tok-viewerA', { action: 'list', client_id: '1' })
    assert.strictEqual(authCalls[authCalls.length - 1].clientId, 1)
  })
  await check('a viewer of client 1 asking for client 2: 403 client mismatch, nothing read', async () => {
    fresh(); db.calls.length = 0
    const r = await call('tok-viewerA', { action: 'list', client_id: 2 })
    assert.strictEqual(r.status, 403); assert.strictEqual(r.body.error, 'Forbidden: client mismatch'); assert.strictEqual(db.calls.length, 0)
  })
  await check('bad JSON, a non-object body, a bad client_id: 400 invalid_request', async () => {
    fresh()
    for (const b of ['{', 'null', '[1]', '7', JSON.stringify({ action: 'list' }), JSON.stringify({ action: 'list', client_id: 0 }), JSON.stringify({ action: 'list', client_id: '1e0' }), JSON.stringify({ action: 'list', client_id: 2147483648 })]) {
      const r = await call('tok-admin', b)
      assert.strictEqual(r.status, 400, b); assert.strictEqual(r.body.code, 'invalid_request', b)
    }
  })
  await check('an unknown action: 400 invalid_request', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'drop', client_id: 1 })
    assert.strictEqual(r.status, 400); assert.strictEqual(r.body.code, 'invalid_request')
  })
  await check('GET is 405; OPTIONS goes to requireAuth', async () => {
    fresh()
    assert.strictEqual((await call('tok-admin', {}, 'GET')).status, 405)
    assert.strictEqual((await call('tok-admin', '', 'OPTIONS')).status, 204)
  })

  console.log('list')
  await check('live rows only, primary first, with active prompt counts, limit from the stored plan, used', async () => {
    fresh()
    const r = await call('tok-viewerA', { action: 'list', client_id: 1, plan: 'enterprise' })
    assert.strictEqual(r.status, 200)
    assert.deepStrictEqual(r.body.locations.map(l => l.id), [10, 11])
    assert.deepStrictEqual(r.body.locations.map(l => l.active_prompts), [1, 1])
    assert.strictEqual(r.body.locations.filter(l => l.is_primary).length, 1)
    assert.strictEqual(r.body.limit, 3, 'radar from the clients row, the body plan is ignored')
    assert.strictEqual(r.body.used, 2)
    assert.deepStrictEqual(Object.keys(r.body.locations[0]).sort(), ['active_prompts', 'archived_at', 'id', 'is_primary', 'market_id', 'position', 'region_id'])
  })
  await check('a client with no location row gets its primary created from the clients defaults (WW, null region)', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'list', client_id: 3 })
    assert.strictEqual(r.status, 200)
    assert.strictEqual(r.body.locations.length, 1)
    assert.deepStrictEqual([r.body.locations[0].market_id, r.body.locations[0].region_id, r.body.locations[0].is_primary], ['WW', 'ALL', true])
    assert.strictEqual(r.body.limit, 1, 'an unknown plan is 1')
  })
  await check('an admin listing a client id that does not exist: 404 not_found', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'list', client_id: 77 })
    assert.strictEqual(r.status, 404); assert.strictEqual(r.body.code, 'not_found')
  })

  console.log('add')
  await check('viewer add within the limit: 200, rows created, used and limit', async () => {
    fresh()
    const r = await call('tok-viewerA', { action: 'add', client_id: 1, market_id: 'US', region_ids: ['ALL'] })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.strictEqual(r.body.added.length, 1); assert.strictEqual(r.body.added[0].market_id, 'US')
    assert.strictEqual(r.body.added[0].active_prompts, 0)
    assert.strictEqual(r.body.used, 3); assert.strictEqual(r.body.limit, 3)
    const last = db.rpcArgs[db.rpcArgs.length - 1]
    assert.strictEqual(last.name, 'add_client_locations'); assert.strictEqual(last.args.p_limit, 3); assert.strictEqual(last.args.p_client_id, 1)
    assert.strictEqual(db.rows('client_events').length, 0, 'no event for a viewer add')
  })
  await check('viewer add past the limit: 403 location_limit_reached, nothing added', async () => {
    fresh()
    const before = db.rows('client_locations').length
    const r = await call('tok-viewerA', { action: 'add', client_id: 1, market_id: 'US', region_ids: ['NYC', 'LA'] })
    assert.strictEqual(r.status, 403); assert.strictEqual(r.body.code, 'location_limit_reached')
    assert.strictEqual(db.rows('client_locations').length, before)
  })
  await check('admin add passes p_limit null, may exceed, and writes one location_change event', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: 'US', region_ids: ['NYC', 'LA', 'CHI'] })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.strictEqual(r.body.used, 5); assert.strictEqual(r.body.limit, 3)
    const last = db.rpcArgs[db.rpcArgs.length - 1]
    assert.strictEqual(last.args.p_limit, null)
    const ev = db.rows('client_events')
    assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].type, 'location_change'); assert.strictEqual(ev[0].client_id, 1)
    assert.strictEqual(ev[0].meta.limit_override, true); assert.strictEqual(ev[0].meta.over_limit, true)
    assert.strictEqual(ev[0].actor, PROFILES['tok-admin'].id)
  })
  await check('admin add within the limit: the event records limit_override false and over_limit false', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: 'FR', region_ids: ['ALL'] })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.strictEqual(r.body.used, 3); assert.strictEqual(r.body.limit, 3)
    const ev = db.rows('client_events')
    assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].type, 'location_change')
    assert.strictEqual(ev[0].meta.limit_override, false); assert.strictEqual(ev[0].meta.over_limit, false)
  })
  await check('a refused audit insert does not fail the admin add (non-fatal)', async () => {
    fresh()
    db.failInsert = new Set(['client_events'])
    const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: 'FR', region_ids: ['ALL'] })
    assert.strictEqual(r.status, 200)
  })
  await check('a pair already live: 409 location_exists (23505)', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: 'ES', region_ids: ['TF'] })
    assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'location_exists')
  })
  await check('an archived pair may be added again', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: 'DE', region_ids: ['ALL'] })
    assert.strictEqual(r.status, 200)
  })
  await check('invalid_location: unknown market, region of another market, research region, ALL mixed with regions', async () => {
    fresh()
    for (const [m, rs] of [['XX', ['ALL']], ['RO', ['NYC']], ['US', ['AUS']], ['US', ['ALL', 'NYC']], [5, ['ALL']]]) {
      const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: m, region_ids: rs })
      assert.strictEqual(r.status, 400, `${m} ${rs}`); assert.strictEqual(r.body.code, 'invalid_location', `${m} ${rs}`)
    }
  })
  await check('invalid_request: region_ids missing, empty, over 25, non-strings, duplicates', async () => {
    fresh()
    const many = Array.from({ length: 26 }, (_, i) => 'R' + i)
    for (const rs of [undefined, [], many, [1], ['NYC', 'NYC'], 'NYC']) {
      const r = await call('tok-admin', { action: 'add', client_id: 1, market_id: 'US', region_ids: rs })
      assert.strictEqual(r.status, 400, JSON.stringify(rs)); assert.strictEqual(r.body.code, 'invalid_request', JSON.stringify(rs))
    }
    assert.ok(!db.rpcArgs.some(a => a.name === 'add_client_locations'), 'no rpc on a refused body')
  })

  console.log('archive')
  await check('IDOR: a viewer of client 1 passing a location id of client 2 gets 404 and zero rows change', async () => {
    fresh()
    const before = snapshot()
    const r = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 21 })
    assert.strictEqual(r.status, 404); assert.strictEqual(r.body.code, 'not_found')
    assert.strictEqual(snapshot(), before)
    const last = db.rpcArgs[db.rpcArgs.length - 1]
    assert.deepStrictEqual(last.args, { p_client_id: 1, p_location_id: 21 }, 'the location id is used only with the authorised client id')
  })
  await check('archive of a row with an active prompt: 409 location_in_use', async () => {
    fresh()
    const r = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 11 })
    assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'location_in_use')
  })
  await check('archive of the primary: 409 location_is_primary', async () => {
    fresh()
    const r = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 10 })
    assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'location_is_primary')
  })
  await check('archive of a free row: 200 archived true; again: still 200', async () => {
    fresh()
    db.rows('prompts').find(p => p.id === 101).is_active = false
    const r = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 11 })
    assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body, { archived: true, location_id: 11 })
    assert.ok(db.rows('client_locations').find(l => l.id === 11).archived_at)
    const again = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 11 })
    assert.strictEqual(again.status, 200)
  })
  await check('archive with a bad location id: 400 invalid_request', async () => {
    fresh()
    const r = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 'x' })
    assert.strictEqual(r.status, 400); assert.strictEqual(r.body.code, 'invalid_request')
  })
  await check('an RPC error that is not an outcome: 500 server_error with the fixed message', async () => {
    fresh()
    db.rpc = async () => ({ data: null, error: { message: 'connection reset' } })
    const r = await call('tok-viewerA', { action: 'archive', client_id: 1, location_id: 11 })
    assert.strictEqual(r.status, 500); assert.strictEqual(r.body.code, 'server_error')
    assert.ok(!/connection reset/.test(r.body.error), 'the real error is logged, not returned')
  })

  console.log('set_primary')
  await check('a viewer: 403 forbidden, nothing changes', async () => {
    fresh()
    const before = snapshot()
    const r = await call('tok-viewerA', { action: 'set_primary', client_id: 1, location_id: 11 })
    assert.strictEqual(r.status, 403); assert.strictEqual(r.body.code, 'forbidden')
    assert.strictEqual(snapshot(), before)
  })
  await check('admin: 200 primary_id, flag moved, clients mirror updated, no prompt location changed, one event with old and new pair', async () => {
    fresh()
    const promptsBefore = JSON.stringify(db.rows('prompts').map(p => [p.id, p.location_id]))
    const r = await call('tok-admin', { action: 'set_primary', client_id: 1, location_id: 11 })
    assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body, { primary_id: 11 })
    assert.deepStrictEqual(db.rows('client_locations').filter(l => l.client_id === 1 && l.is_primary).map(l => l.id), [11])
    const c = db.rows('clients').find(x => x.id === 1)
    assert.deepStrictEqual([c.default_market_id, c.default_region_id], ['ES', 'TF'])
    assert.strictEqual(JSON.stringify(db.rows('prompts').map(p => [p.id, p.location_id])), promptsBefore)
    const ev = db.rows('client_events')
    assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].meta.action, 'set_primary')
    assert.deepStrictEqual(ev[0].meta.from, { id: 10, market_id: 'RO', region_id: 'ALL' })
    assert.deepStrictEqual(ev[0].meta.to, { id: 11, market_id: 'ES', region_id: 'TF' })
  })
  await check('admin, already primary: 200 primary_id, no event', async () => {
    fresh()
    const r = await call('tok-admin', { action: 'set_primary', client_id: 1, location_id: 10 })
    assert.strictEqual(r.status, 200); assert.deepStrictEqual(r.body, { primary_id: 10 })
    assert.strictEqual(db.rows('client_events').length, 0)
  })
  await check('admin, a location of another client or an archived one: 404 not_found', async () => {
    fresh()
    for (const id of [21, 12]) {
      const r = await call('tok-admin', { action: 'set_primary', client_id: 1, location_id: id })
      assert.strictEqual(r.status, 404, String(id)); assert.strictEqual(r.body.code, 'not_found')
    }
  })

  console.log('constants')
  await check('VIEWER_MAY_EDIT_LOCATIONS defaults to true (owner question 3) and the event type is location_change', async () => {
    assert.strictEqual(fnMod.VIEWER_MAY_EDIT_LOCATIONS, true)
    assert.strictEqual(fnMod.EVENT_TYPE, 'location_change')
  })

  console.log = log; console.warn = warn; console.error = err
  console.log(`\nclient_locations_endpoint: ${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => { console.error('suite crashed:', e); process.exit(1) })
