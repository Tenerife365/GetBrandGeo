/**
 * agency_billing_gate.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/agency_billing_gate.test.js
 *
 * create-portal-session.js, review F1 of docs/qa/agency-p1-build-review-2026-11-16.md
 * (spec docs/arch/agency-multi-brand.md 8): a NON-admin caller gets the
 * Stripe billing portal only when the target brand's account kind reads
 * exactly 'direct'. An agency brand, a brand with no account, an account row
 * that is missing and a read error all answer 409 { error, code:
 * 'agency_billing' } and never reach Stripe. An admin is unchanged. The
 * access check (requireAuth with clientId) still runs first.
 *
 * Nothing touches the network: @supabase/supabase-js and stripe are replaced
 * in require.cache before the function is loaded. Fixtures name no real
 * person (example.com only); the Stripe ids are placeholders.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder'
delete process.env.SENTRY_DSN

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

const portalCalls = []
let db = createFakeSupabase()
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => db })
installModule(require.resolve('stripe', { paths: [FN] }), () => ({
  billingPortal: { sessions: { async create(args) { portalCalls.push(args); return { url: 'https://billing.example.com/session' } } } },
}))
global.fetch = async () => { throw new Error('network disabled in tests') }

const portal = require(path.join(FN, 'create-portal-session.js'))

const realWarn = console.warn
const realError = console.error
const quiet = () => { console.warn = () => {}; console.error = () => {} }
const loud = () => { console.warn = realWarn; console.error = realError }

const ADMIN = 'ffffffff-0000-4000-8000-000000000001'
const D_OWNER = 'ffffffff-0000-4000-8000-000000000002'  // direct customer, brand 30
const GUEST = 'ffffffff-0000-4000-8000-000000000003'    // guest, default brand 20 (agency client brand)
const STAFF = 'ffffffff-0000-4000-8000-000000000004'    // agency staff, default 10, account row on 20
const ORPHAN = 'ffffffff-0000-4000-8000-000000000005'   // default brand 40, which has no account_id

function freshDb() {
  db = createFakeSupabase()
  portalCalls.length = 0
  db.addUser('tok-admin', { id: ADMIN, email: 'admin@example.com' })
  db.addUser('tok-direct', { id: D_OWNER, email: 'direct@example.com' })
  db.addUser('tok-guest', { id: GUEST, email: 'guest@example.com' })
  db.addUser('tok-staff', { id: STAFF, email: 'staff@example.com' })
  db.addUser('tok-orphan', { id: ORPHAN, email: 'orphan@example.com' })
  db.seed('user_profiles', [
    { id: ADMIN, role: 'admin', client_id: null },
    { id: D_OWNER, role: 'viewer', client_id: 30 },
    { id: GUEST, role: 'viewer', client_id: 20 },
    { id: STAFF, role: 'viewer', client_id: 10 },
    { id: ORPHAN, role: 'viewer', client_id: 40 },
  ])
  db.seed('accounts', [
    { id: 1, name: 'Agency Account', kind: 'agency', home_client_id: 10 },
    { id: 2, name: 'Direct Account', kind: 'direct', home_client_id: 30 },
  ])
  // Every brand carries a Stripe customer, so only the gate stands between a
  // caller and the portal.
  db.seed('clients', [
    { id: 10, name: 'Agency Home', plan: 'growth', account_id: 1, stripe_customer_id: 'cus_placeholder_10' },
    { id: 20, name: 'Client Brand', plan: 'essentials', account_id: 1, stripe_customer_id: 'cus_placeholder_20' },
    { id: 30, name: 'Direct Brand', plan: 'radar', account_id: 2, stripe_customer_id: 'cus_placeholder_30' },
    { id: 40, name: 'No Account Brand', plan: 'radar', account_id: null, stripe_customer_id: 'cus_placeholder_40' },
  ])
  db.seed('user_clients', [
    { user_id: D_OWNER, client_id: 30, role: 'owner', grant_source: 'backfill' },
    { user_id: GUEST, client_id: 20, role: 'member', grant_source: 'primary' },
    { user_id: STAFF, client_id: 10, role: 'member', grant_source: 'primary' },
    { user_id: STAFF, client_id: 20, role: 'member', grant_source: 'account' },
  ])
}

async function call(token, body) {
  quiet()
  try {
    const res = await portal.handler({
      httpMethod: 'POST',
      headers: { authorization: 'Bearer ' + token, origin: 'https://app.getbrandgeo.com' },
      body: JSON.stringify(body),
    })
    let parsed = null
    try { parsed = JSON.parse(res.body) } catch { parsed = res.body }
    return { status: res.statusCode, body: parsed }
  } finally { loud() }
}

;(async () => {
  console.log('create-portal-session, the agency billing gate (F1)')
  await check('a direct customer on its own brand opens the portal (unchanged)', async () => {
    freshDb()
    const r = await call('tok-direct', { client_id: 30 })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.deepStrictEqual(portalCalls.map((c) => c.customer), ['cus_placeholder_30'])
  })
  await check('a direct customer with no client_id falls back to its default brand and passes the gate', async () => {
    freshDb()
    const r = await call('tok-direct', {})
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.strictEqual(portalCalls.length, 1)
  })
  await check('staff on an agency client brand: 409 agency_billing, Stripe never called', async () => {
    freshDb()
    const r = await call('tok-staff', { client_id: 20 })
    assert.strictEqual(r.status, 409, JSON.stringify(r.body))
    assert.strictEqual(r.body.code, 'agency_billing')
    assert.strictEqual(typeof r.body.error, 'string')
    assert.ok(!JSON.stringify(r.body).includes('cus_'), 'a Stripe id leaked')
    assert.strictEqual(portalCalls.length, 0)
  })
  await check('staff on the agency home brand and a guest on its default brand: 409, no Stripe call', async () => {
    for (const [tok, body] of [['tok-staff', { client_id: 10 }], ['tok-staff', {}], ['tok-guest', { client_id: 20 }], ['tok-guest', {}]]) {
      freshDb()
      const r = await call(tok, body)
      assert.strictEqual(r.status, 409, tok + ' ' + JSON.stringify(body) + ' ' + JSON.stringify(r.body))
      assert.strictEqual(r.body.code, 'agency_billing')
      assert.strictEqual(portalCalls.length, 0)
    }
  })
  await check('a brand with no account_id, a missing account row, or a read error: 409, no Stripe call', async () => {
    freshDb()
    let r = await call('tok-orphan', { client_id: 40 })
    assert.strictEqual(r.status, 409, 'no account_id ' + JSON.stringify(r.body))
    assert.strictEqual(portalCalls.length, 0)

    freshDb()
    db.tables.accounts = db.rows('accounts').filter((a) => a.id !== 2)
    r = await call('tok-direct', { client_id: 30 })
    assert.strictEqual(r.status, 409, 'missing account ' + JSON.stringify(r.body))
    assert.strictEqual(portalCalls.length, 0)

    for (const table of ['accounts', 'clients']) {
      freshDb()
      db.faults.push({ table, error: { message: 'boom' } })
      r = await call('tok-direct', { client_id: 30 })
      assert.strictEqual(r.status, 409, table + ' read error ' + JSON.stringify(r.body))
      assert.strictEqual(r.body.code, 'agency_billing')
      assert.strictEqual(portalCalls.length, 0)
    }
  })
  await check('the access check still runs first: a viewer on a brand it cannot reach is 403', async () => {
    freshDb()
    const r = await call('tok-direct', { client_id: 20 })
    assert.strictEqual(r.status, 403, JSON.stringify(r.body))
    assert.strictEqual(portalCalls.length, 0)
  })
  await check('an admin is unchanged: the portal of an agency brand still opens, no kind read', async () => {
    freshDb()
    const r = await call('tok-admin', { client_id: 20 })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.deepStrictEqual(portalCalls.map((c) => c.customer), ['cus_placeholder_20'])
    assert.ok(!db.calls.some((c) => c.table === 'accounts'), 'an admin call read accounts')
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  loud()
  console.error(e)
  process.exit(1)
})
