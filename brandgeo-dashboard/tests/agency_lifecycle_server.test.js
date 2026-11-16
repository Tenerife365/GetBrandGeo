/**
 * agency_lifecycle_server.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/agency_lifecycle_server.test.js
 *
 * Release P1 of docs/arch/agency-multi-brand.md, the lifecycle half. Covers:
 *   1. delete-client.js (ledger row 29, section 9.5): 409 naming the logins,
 *      BEFORE any destructive call, for an agency home brand, a login that is
 *      a member of an agency account, a login in a direct account holding
 *      other brands, and a login with a user_clients row on another brand; a
 *      read error is 500 with nothing deleted; an ordinary direct customer and
 *      an agency client brand with only guests delete as before.
 *   2. mcp-server.js resolveKey (ledger row 30, section 9.3): a key lives only
 *      while its creator exists, is not banned, and is an admin or reaches the
 *      key's client (default brand or a user_clients row); every read error is
 *      a dead key (401), never 500 and never live; created_by null keeps the
 *      earlier behaviour.
 *   3. provision-account.js (ledger row 31): a banned login is 401 before any
 *      read or write; a lapsed ban passes.
 *   4. set-client-plan.js (section 9.6): a direct brand keeps the banner and
 *      emails its logins; an agency brand writes no banner and emails only the
 *      account owners; an unreadable kind writes no banner and sends no email.
 *   5. expire-plan-grants.js (section 9.6): the customer banner is written for
 *      a direct brand only; an agency brand and an unreadable kind skip it;
 *      the admin bell row and the admin summary are written for all three.
 *
 * Nothing touches the network: @supabase/supabase-js and _email.js are
 * replaced in require.cache BEFORE any function module is loaded. Fixtures
 * name no real person (example.com only).
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
// mcp-server.js requires dashboard .ts files (bundled by esbuild in production).
require('./helpers/ts_require')

const FN =path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
process.env.CRON_SECRET = 'test-cron-secret-placeholder-0000'
delete process.env.SENTRY_DSN
delete process.env.RESEND_API_KEY

let failures = 0
let passes = 0
async function check(name, fn) {
  try {
    await fn()
    passes++
    console.log(`  ok   ${name}`)
  } catch (e) {
    failures++
    console.log(`  FAIL ${name}`)
    console.log(`       ${e && e.message ? e.message : e}`)
  }
}

function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}

let db = createFakeSupabase()
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => db })
const emails = []
installModule(require.resolve(path.join(FN, '_email.js')), {
  async sendBrandedEmail(msg) { emails.push(msg); return { ok: true } },
  renderShell: () => '', esc: (s) => String(s), FROM: 'BrandGEO <noreply@example.com>', APP_URL: 'https://app.getbrandgeo.com',
})
global.fetch = async () => { throw new Error('network disabled in tests') }

const deleteClient = require(path.join(FN, 'delete-client.js'))
const mcp = require(path.join(FN, 'mcp-server.js'))
const keys = require(path.join(FN, '_client_api_key.js'))
const provision = require(path.join(FN, 'provision-account.js'))
const setPlan = require(path.join(FN, 'set-client-plan.js'))
const expire = require(path.join(FN, 'expire-plan-grants.js'))

const realLog = console.log
const realWarn = console.warn
const realError = console.error
const quiet = () => { console.warn = () => {}; console.error = () => {}; console.log = () => {} }
const loud = () => { console.warn = realWarn; console.error = realError; console.log = realLog }
async function muted(fn) { quiet(); try { return await fn() } finally { loud() } }

const ORIGIN = 'https://app.getbrandgeo.com'
const ev = (token, body, method = 'POST', extra = {}) => ({
  httpMethod: method,
  headers: Object.assign({ authorization: token ? 'Bearer ' + token : '', origin: ORIGIN }, extra),
  body: typeof body === 'string' ? body : JSON.stringify(body),
})
const parse = (res) => ({ status: res.statusCode, body: (() => { try { return JSON.parse(res.body) } catch { return res.body } })() })

// ── fixtures ─────────────────────────────────────────────────────────────────
const ADMIN = 'eeeeeeee-0000-4000-8000-000000000001'
const D_OWNER = 'eeeeeeee-0000-4000-8000-000000000002'   // direct customer on 30
const OWNER = 'eeeeeeee-0000-4000-8000-000000000003'     // agency owner, home 10
const GUEST = 'eeeeeeee-0000-4000-8000-000000000004'     // guest on 20
const L40 = 'eeeeeeee-0000-4000-8000-000000000040'       // default 40, member of the agency
const L50 = 'eeeeeeee-0000-4000-8000-000000000050'       // default 50, direct account with 50 and 51
const L60 = 'eeeeeeee-0000-4000-8000-000000000060'       // default 60, row on 30 too
const MANAGER = 'eeeeeeee-0000-4000-8000-000000000007'   // agency manager, home 10

function freshDb() {
  db = createFakeSupabase()
  emails.length = 0
  db.addUser('tok-admin', { id: ADMIN, email: 'admin@example.com' })
  const users = [[D_OWNER, 'direct@example.com'], [OWNER, 'owner@example.com'], [GUEST, 'guest@example.com'], [L40, 'l40@example.com'], [L50, 'l50@example.com'], [L60, 'l60@example.com'], [MANAGER, 'manager@example.com']]
  for (const [id, email] of users) db.usersById.set(id, { id, email })
  db.seed('user_profiles', [
    { id: ADMIN, role: 'admin', client_id: null },
    { id: D_OWNER, role: 'viewer', client_id: 30 },
    { id: OWNER, role: 'viewer', client_id: 10 },
    { id: MANAGER, role: 'viewer', client_id: 10 },
    { id: GUEST, role: 'viewer', client_id: 20 },
    { id: L40, role: 'viewer', client_id: 40 },
    { id: L50, role: 'viewer', client_id: 50 },
    { id: L60, role: 'viewer', client_id: 60 },
  ])
  db.seed('accounts', [
    { id: 1, name: 'Agency Account', kind: 'agency', home_client_id: 10 },
    { id: 3, name: 'Direct 30', kind: 'direct', home_client_id: 30 },
    { id: 4, name: 'Direct 40', kind: 'direct', home_client_id: 40 },
    { id: 5, name: 'Direct 50', kind: 'direct', home_client_id: 50 },
    { id: 6, name: 'Direct 60', kind: 'direct', home_client_id: 60 },
  ])
  const c = (id, account_id, extra = {}) => Object.assign({ id, name: `Brand ${id}`, slug: `brand-${id}`, plan: 'growth', category: 'active', account_id }, extra)
  db.seed('clients', [c(10, 1), c(20, 1), c(30, 3), c(40, 4), c(50, 5), c(51, 5), c(60, 6), c(61, 6, { plan: 'growth' })])
  db.seed('account_members', [
    { account_id: 1, user_id: OWNER, role: 'owner' },
    { account_id: 1, user_id: MANAGER, role: 'manager' },
    { account_id: 1, user_id: L40, role: 'manager' },
    { account_id: 3, user_id: D_OWNER, role: 'owner' },
    { account_id: 5, user_id: L50, role: 'owner' },
    { account_id: 6, user_id: L60, role: 'owner' },
  ])
  db.seed('user_clients', [
    { user_id: OWNER, client_id: 10, role: 'member', grant_source: 'primary' },
    { user_id: OWNER, client_id: 20, role: 'owner', grant_source: 'account' },
    { user_id: GUEST, client_id: 20, role: 'member', grant_source: 'primary' },
    { user_id: D_OWNER, client_id: 30, role: 'owner', grant_source: 'backfill' },
    { user_id: L60, client_id: 60, role: 'owner', grant_source: 'backfill' },
    { user_id: L60, client_id: 30, role: 'member', grant_source: 'direct' },
  ])
  return db
}

const destructive = () => db.calls.filter((x) => x.op === 'delete').length

;(async () => {
  // ════════════════════════════════════════════════════════════════════════
  console.log('1. delete-client.js, the 9.5 refusals')
  const del = (cid) => muted(async () => parse(await deleteClient.handler(ev('tok-admin', { client_id: cid, confirm: `brand-${cid}` }))))
  await check('agency home brand: 409 naming the logins, nothing deleted', async () => {
    freshDb()
    const r = await del(10)
    assert.strictEqual(r.status, 409, JSON.stringify(r.body))
    assert.match(r.body.error, /home brand of an agency account/)
    assert.match(r.body.error, /owner@example\.com/)
    assert.match(r.body.error, /manager@example\.com/)
    assert.deepStrictEqual(Object.keys(r.body), ['error'])
    assert.strictEqual(destructive(), 0)
    assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('a login that is a member of an agency account: 409 naming it, nothing deleted', async () => {
    freshDb()
    const r = await del(40)
    assert.strictEqual(r.status, 409)
    assert.match(r.body.error, /l40@example\.com/)
    assert.strictEqual(destructive(), 0)
    assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('a login in a direct account that holds other brands: 409, nothing deleted', async () => {
    freshDb()
    const r = await del(50)
    assert.strictEqual(r.status, 409)
    assert.match(r.body.error, /l50@example\.com/)
    assert.strictEqual(destructive(), 0)
  })
  await check('a login with a user_clients row on another brand: 409, nothing deleted', async () => {
    freshDb()
    // 60's account also holds 61, so drop 61 from it to isolate condition 3.
    db.rows('clients').find((x) => x.id === 61).account_id = 99
    const r = await del(60)
    assert.strictEqual(r.status, 409, JSON.stringify(r.body))
    assert.match(r.body.error, /reach other brands/)
    assert.match(r.body.error, /l60@example\.com/)
    assert.strictEqual(destructive(), 0)
  })
  await check('a read error on the checks: 500, nothing deleted', async () => {
    for (const table of ['accounts', 'account_members', 'user_clients']) {
      freshDb()
      db.faults.push({ table, error: { message: 'boom' } })
      const r = await del(30)
      assert.strictEqual(r.status, 500, `${table}: ${JSON.stringify(r.body)}`)
      assert.match(r.body.error, /Nothing was deleted/)
      assert.strictEqual(destructive(), 0, table)
      assert.strictEqual(db.deletedUsers.length, 0, table)
    }
  })
  await check('an ordinary direct customer: deleted as before (login, children, client row)', async () => {
    freshDb()
    const r = await del(30)
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.deepStrictEqual(db.deletedUsers, [D_OWNER])
    assert.ok(!db.rows('clients').some((x) => x.id === 30))
  })
  await check('an agency client brand with only guests: deleted with its guests', async () => {
    freshDb()
    const r = await del(20)
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.deepStrictEqual(db.deletedUsers, [GUEST])
  })
  await check('the admin-login refusal still comes first', async () => {
    freshDb()
    db.rows('user_profiles').find((p) => p.id === D_OWNER).role = 'admin'
    const r = await del(30)
    assert.strictEqual(r.status, 409)
    assert.match(r.body.error, /admin user attached/)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('2. mcp-server.js resolveKey, the 9.3 creator re-check')
  let reqN = 0
  function keyFor(clientId, createdBy) {
    const secret = keys.makeClientApiKey(clientId)
    db.seed('client_api_keys', [{
      id: require('crypto').randomUUID(), client_id: clientId, key_hash: keys.hashClientApiKey(secret),
      key_prefix: keys.clientApiKeyPrefix(secret), label: 't', created_by: createdBy, last_used_at: null, revoked_at: null,
    }])
    return secret
  }
  async function ping(secret, sb = db) {
    const event = { httpMethod: 'POST', path: '/mcp', headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }), isBase64Encoded: false }
    return muted(async () => (await mcp.handle(event, { awsRequestId: `life${++reqN}` }, { supabase: sb })).statusCode)
  }
  await check('creator on their default brand: live', async () => {
    freshDb()
    assert.strictEqual(await ping(keyFor(30, D_OWNER)), 200)
  })
  await check('creator with a user_clients row: live; the row deleted by any route: dead', async () => {
    freshDb()
    const k = keyFor(20, OWNER)
    assert.strictEqual(await ping(k), 200)
    db.tables.user_clients = db.rows('user_clients').filter((r) => !(r.user_id === OWNER && r.client_id === 20))
    assert.strictEqual(await ping(k), 401)
  })
  await check('a banned creator: dead, even on their default brand', async () => {
    freshDb()
    const k = keyFor(30, D_OWNER)
    db.usersById.get(D_OWNER).banned_until = '2126-01-01T00:00:00Z'
    assert.strictEqual(await ping(k), 401)
  })
  await check('an admin creator: live on any brand', async () => {
    freshDb()
    db.usersById.set(ADMIN, { id: ADMIN, email: 'admin@example.com' })
    assert.strictEqual(await ping(keyFor(61, ADMIN)), 200)
  })
  await check('a creator deleted from auth: dead', async () => {
    freshDb()
    const k = keyFor(30, D_OWNER)
    db.usersById.delete(D_OWNER)
    assert.strictEqual(await ping(k), 401)
  })
  await check('a creator without access (no profile match, no row): dead', async () => {
    freshDb()
    assert.strictEqual(await ping(keyFor(61, D_OWNER)), 401)
  })
  await check('created_by null: live, as before the change', async () => {
    freshDb()
    assert.strictEqual(await ping(keyFor(30, null)), 200)
  })
  await check('read errors in the re-check are a dead key (401), never 500 and never live', async () => {
    for (const table of ['user_profiles', 'user_clients']) {
      freshDb()
      const k = keyFor(20, OWNER)
      db.faults.push({ table, error: { message: 'boom' } })
      assert.strictEqual(await ping(k), 401, table)
    }
    freshDb()
    const k = keyFor(30, D_OWNER)
    db.auth.admin.getUserById = async () => { throw new Error('gotrue down') }
    assert.strictEqual(await ping(k), 401, 'getUserById throws')
    freshDb()
    const k2 = keyFor(30, D_OWNER)
    db.auth.admin.getUserById = async () => ({ data: null, error: { status: 500, message: 'x' } })
    assert.strictEqual(await ping(k2), 401, 'getUserById error')
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('3. provision-account.js, ledger row 31')
  await check('a banned login: 401 before any read or write', async () => {
    freshDb()
    db.addUser('tok-banned', { id: D_OWNER, email: 'direct@example.com', banned_until: '2126-01-01T00:00:00Z' })
    const before = JSON.stringify(db.rows('clients'))
    const r = await muted(async () => parse(await provision.handler(ev('tok-banned', { account_type: 'company', brand_website: 'example.com' }))))
    assert.strictEqual(r.status, 401)
    assert.match(r.body.error, /login disabled/)
    assert.strictEqual(db.calls.length, 0)
    assert.strictEqual(JSON.stringify(db.rows('clients')), before)
  })
  await check('an unparseable banned_until: 401 (fails closed)', async () => {
    freshDb()
    db.addUser('tok-odd', { id: D_OWNER, email: 'direct@example.com', banned_until: 'someday' })
    const r = await muted(async () => parse(await provision.handler(ev('tok-odd', { account_type: 'company', brand_website: 'example.com' }))))
    assert.strictEqual(r.status, 401)
  })
  await check('a lapsed ban passes the check (the request is read)', async () => {
    freshDb()
    db.addUser('tok-lapsed', { id: D_OWNER, email: 'direct@example.com', banned_until: '2020-01-01T00:00:00Z' })
    const r = await muted(async () => parse(await provision.handler(ev('tok-lapsed', { account_type: 'company', brand_website: 'example.com' }))))
    assert.notStrictEqual(r.status, 401, JSON.stringify(r.body))
    assert.ok(db.calls.some((x) => x.table === 'user_profiles'))
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('4. set-client-plan.js, notice routing')
  const plan = (cid) => muted(async () => parse(await setPlan.handler(ev('tok-admin', { client_id: cid, plan: 'growth_pro', grant_type: 'manual' }))))
  await check('direct brand: banner written, its logins emailed (unchanged)', async () => {
    freshDb()
    const r = await plan(30)
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.strictEqual(db.rows('client_notifications').length, 1)
    assert.strictEqual(emails.length, 1)
    assert.deepStrictEqual(emails[0].to, ['direct@example.com'])
  })
  await check('agency brand: no banner, the email goes to the account owners only', async () => {
    freshDb()
    const r = await plan(20)
    assert.strictEqual(r.status, 200)
    assert.strictEqual(db.rows('client_notifications').length, 0)
    assert.strictEqual(emails.length, 1)
    assert.deepStrictEqual(emails[0].to, ['owner@example.com'])
    assert.ok(!JSON.stringify(emails).includes('guest@example.com'))
    assert.ok(!JSON.stringify(emails).includes('manager@example.com'))
  })
  await check('kind unreadable (account read error, or no account): no banner, no email, plan still set', async () => {
    for (const setup of [() => db.faults.push({ table: 'accounts', error: { message: 'boom' } }), () => { db.rows('clients').find((x) => x.id === 30).account_id = 999 }]) {
      freshDb()
      setup()
      const r = await plan(30)
      assert.strictEqual(r.status, 200)
      assert.strictEqual(db.rows('client_notifications').length, 0)
      assert.strictEqual(emails.length, 0)
      assert.strictEqual(r.body.email.skipped, true)
      assert.strictEqual(db.rows('clients').find((x) => x.id === 30).plan, 'growth_pro')
    }
  })
  await check('notify false: nothing read for routing, nothing sent', async () => {
    freshDb()
    await muted(async () => setPlan.handler(ev('tok-admin', { client_id: 20, plan: 'growth', notify: false })))
    assert.strictEqual(db.rows('client_notifications').length, 0)
    assert.strictEqual(emails.length, 0)
    assert.ok(!db.calls.some((x) => x.table === 'accounts'))
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('5. expire-plan-grants.js, notice routing')
  function withNot() {
    // The fake has no .not(); model the one use here: not(col, 'is', null).
    const realFrom = db.from.bind(db)
    db.from = (t) => {
      const q = realFrom(t)
      q.not = (c, op, v) => { q.filters.push((r) => !(op === 'is' && (r[c] === v || (v === null && r[c] === undefined)))); return q }
      return q
    }
  }
  function lapse(ids) {
    for (const id of ids) Object.assign(db.rows('clients').find((x) => x.id === id), { plan_source: 'package', plan_grant_until: '2026-01-01', stripe_subscription_id: null, plan: 'growth' })
  }
  const runExpire = () => muted(async () => expire.handler({ httpMethod: 'POST', headers: { 'x-cron-key': process.env.CRON_SECRET }, body: '{}' }))
  await check('direct brand: banner; agency brand and unreadable kind: no banner; admin bell for all three; one admin summary', async () => {
    freshDb()
    withNot()
    db.rows('clients').find((x) => x.id === 40).account_id = 999   // kind unreadable
    lapse([20, 30, 40])
    const res = await runExpire()
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.deepStrictEqual(db.rows('client_notifications').map((n) => n.client_id), [30])
    const bell = db.rows('admin_notifications').filter((n) => n.type === 'trial_expired')
    assert.deepStrictEqual(bell.map((n) => n.client_id).sort(), [20, 30, 40])
    assert.deepStrictEqual(Object.fromEntries(bell.map((n) => [n.client_id, n.meta.customer_notified])), { 20: false, 30: true, 40: false })
    assert.strictEqual(emails.length, 1)
    assert.match(emails[0].subject, /3 BrandGEO plan grants expired/)
    for (const id of [20, 30, 40]) assert.strictEqual(db.rows('clients').find((x) => x.id === id).plan, 'free')
  })
  await check('an accounts read error skips the customer notice, keeps the bell', async () => {
    freshDb()
    withNot()
    lapse([30])
    db.faults.push({ table: 'accounts', error: { message: 'boom' } })
    const res = await runExpire()
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(db.rows('client_notifications').length, 0)
    assert.strictEqual(db.rows('admin_notifications').filter((n) => n.type === 'trial_expired').length, 1)
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  loud()
  console.error(e)
  process.exit(1)
})
