/**
 * agency_admin.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/agency_admin.test.js
 *
 * netlify/functions/agency-admin.js, release P1 of
 * docs/arch/agency-multi-brand.md (sections 4.6, 9.1, 9.3). Covers:
 *   1. the admin gate (no token 401, viewer 403), POST only, a non-object
 *      body and an unknown action 400, strict id parsing (positive int4,
 *      uuid), a confirm that is not a boolean, confirm_user_ids that are not
 *      uuids;
 *   2. every write action makes exactly ONE rpc with the contract name and
 *      argument names, p_actor the calling admin;
 *   3. the convert and attach_brand previews: service-key reads only, the
 *      brand and every login on it with email, no rpc;
 *   4. the error mapping: P0001 last_owner 422, *_not_found 404, any other
 *      token 409 { error, code: token }, a P0001 that is not a token and any
 *      other error 500 with a fixed message (no database text leaks);
 *   5. the ban: fixed 876000h whatever the body says, only after the rpc
 *      committed, never after a refusal; a failed ban is 500 with
 *      access_removed, ban_failed and the ban_removed retry; an admin target
 *      is refused first;
 *   5b. ban_removed (review F2): bans a login removed from the account only
 *      (no member row, no row on a brand of it, default brand in it), never
 *      the caller or an admin; every read error is 500 and bans nothing;
 *   6. create_guest_login refusals (brand missing, brand in a direct
 *      account, the agency home brand) create no auth user; the success path
 *      is ONE rpc account_create_guest_profile (review F4), then the invite;
 *      an SQL failure removes the created login only while it has no profile;
 *   the attach preview reports stripe_linked and blocked_by brand_has_stripe
 *   (review F1) without the Stripe ids;
 *   7. create_staff_login: an address with a login is refused before any
 *      invite; a SQL failure deletes the created user only when it passes
 *      the ownership test and has no profile, and sends no email; a user that
 *      is not ours is never bound or deleted; success sends the invite only
 *      after the rpc;
 *   8. list: one account (members with email, brands with active prompt
 *      count, rows by grant_source, the three 4.4 checks) and all agency
 *      accounts; the checks count missing, stale and stray rows; the
 *      user_clients read pages past 1,000 rows; a read error is 500.
 *
 * The in-memory fake (tests/helpers/fake_supabase_mem.js) has no SQL: the
 * seven account functions are scripted in rpc() here, which proves the
 * function's control flow and its contract calls, never the SQL bodies.
 * Fixtures name no real person (example.com only).
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN
delete process.env.RESEND_API_KEY      // deliverInvite falls back to inviteUserByEmail, observable in db.invites
delete process.env.INVITE_LINK_CHANNEL

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

// ── fixtures ─────────────────────────────────────────────────────────────────
const ADMIN = 'cccccccc-0000-4000-8000-000000000001'
const D_OWNER = 'cccccccc-0000-4000-8000-000000000002'   // direct customer, brand 30
const OWNER = 'cccccccc-0000-4000-8000-000000000003'     // agency owner, home brand 10
const GUEST = 'cccccccc-0000-4000-8000-000000000004'     // guest on brand 20
const ADMIN2 = 'cccccccc-0000-4000-8000-000000000005'    // a second admin login
const NEWBIE = 'cccccccc-0000-4000-8000-000000000006'

const AGENCY_FNS = new Set([
  'convert_to_agency', 'account_attach_brand', 'account_detach_brand', 'account_create_staff_profile',
  'account_add_staff', 'account_remove_member', 'account_remove_guest', 'account_create_guest_profile',
])
const CONTRACT_ARGS = {
  convert_to_agency: ['p_account_id', 'p_confirm_user_ids', 'p_actor'],
  account_attach_brand: ['p_account_id', 'p_client_id', 'p_confirm_user_ids', 'p_actor'],
  account_detach_brand: ['p_account_id', 'p_client_id', 'p_actor'],
  account_create_staff_profile: ['p_account_id', 'p_user_id', 'p_role', 'p_actor'],
  account_add_staff: ['p_account_id', 'p_user_id', 'p_role', 'p_actor'],
  account_remove_member: ['p_account_id', 'p_user_id', 'p_actor'],
  account_remove_guest: ['p_client_id', 'p_user_id', 'p_actor'],
  account_create_guest_profile: ['p_client_id', 'p_user_id', 'p_actor'],
}

let db = null
let seq = 0
let rpcLog = []
let banCalls = []
let banResult = { data: { user: {} }, error: null }
let rpcScript = {}
let order = []

function defaultRpc(name, a) {
  if (name === 'convert_to_agency') return { data: { account_id: a.p_account_id, home_client_id: 10 }, error: null }
  if (name === 'account_attach_brand') return { data: { account_id: a.p_account_id, client_id: a.p_client_id, brand_name: 'Client Brand' }, error: null }
  if (name === 'account_detach_brand') return { data: { account_id: a.p_account_id, client_id: a.p_client_id }, error: null }
  if (name === 'account_create_staff_profile') {
    db.seed('user_profiles', [{ id: a.p_user_id, role: 'viewer', client_id: 10 }])
    return { data: { account_id: a.p_account_id, user_id: a.p_user_id, client_id: 10 }, error: null }
  }
  if (name === 'account_add_staff') return { data: { account_id: a.p_account_id, user_id: a.p_user_id }, error: null }
  if (name === 'account_create_guest_profile') {
    db.seed('user_profiles', [{ id: a.p_user_id, role: 'viewer', client_id: a.p_client_id }])
    return { data: { account_id: 1, user_id: a.p_user_id, client_id: a.p_client_id }, error: null }
  }
  return { data: { ban_login: true, account_id: a.p_account_id ?? 1, user_id: a.p_user_id, rows_deleted: 2, keys_revoked: 0, grants_revoked: 0, codes_used: 0, invites_revoked: 0 }, error: null }
}

function freshDb() {
  db = createFakeSupabase({ stampCreatedAt: true, pagedListUsers: true, listUsersNextPage: true, inviteResendsPending: true })
  rpcLog = []; banCalls = []; rpcScript = {}; order = []; seq = 0
  banResult = { data: { user: {} }, error: null }
  db.addUser('tok-admin', { id: ADMIN, email: 'admin@example.com', created_at: '2026-01-01T00:00:00Z' })
  db.addUser('tok-viewer', { id: D_OWNER, email: 'direct@example.com', created_at: '2026-01-01T00:00:00Z' })
  db.usersById.set(OWNER, { id: OWNER, email: 'owner@example.com', created_at: '2026-01-01T00:00:00Z' })
  db.usersById.set(GUEST, { id: GUEST, email: 'guest@example.com', created_at: '2026-01-01T00:00:00Z' })
  db.usersById.set(ADMIN2, { id: ADMIN2, email: 'admin2@example.com', created_at: '2026-01-01T00:00:00Z' })
  db.seed('user_profiles', [
    { id: ADMIN, role: 'admin', client_id: null },
    { id: ADMIN2, role: 'admin', client_id: null },
    { id: D_OWNER, role: 'viewer', client_id: 30 },
    { id: OWNER, role: 'viewer', client_id: 10 },
    { id: GUEST, role: 'viewer', client_id: 20 },
  ])
  db.seed('accounts', [
    { id: 1, name: 'Agency Account', kind: 'agency', home_client_id: 10 },
    { id: 2, name: 'Direct Account', kind: 'direct', home_client_id: 30 },
  ])
  db.seed('clients', [
    { id: 10, name: 'Agency Home', plan: 'growth', category: 'active', account_id: 1 },
    { id: 20, name: 'Client Brand', plan: 'essentials', category: 'active', account_id: 1 },
    { id: 30, name: 'Direct Brand', plan: 'radar', category: 'active', account_id: 2 },
  ])
  db.seed('account_members', [
    { account_id: 1, user_id: OWNER, role: 'owner' },
    { account_id: 2, user_id: D_OWNER, role: 'owner' },
  ])
  db.seed('user_clients', [
    { user_id: OWNER, client_id: 10, role: 'member', grant_source: 'primary' },
    { user_id: OWNER, client_id: 20, role: 'owner', grant_source: 'account' },
    { user_id: GUEST, client_id: 20, role: 'member', grant_source: 'primary' },
    { user_id: D_OWNER, client_id: 30, role: 'owner', grant_source: 'backfill' },
  ])
  db.seed('prompts', [
    { id: 1, client_id: 10, text: 'a', is_active: true },
    { id: 2, client_id: 20, text: 'b', is_active: true },
    { id: 3, client_id: 20, text: 'c', is_active: true },
    { id: 4, client_id: 20, text: 'd', is_active: false },
  ])
  const baseRpc = db.rpc.bind(db)
  db.rpc = async (name, args = {}) => {
    if (!AGENCY_FNS.has(name)) return baseRpc(name, args)
    rpcLog.push({ name, args: JSON.parse(JSON.stringify(args)) })
    order.push(`rpc:${name}`)
    const s = rpcScript[name]
    if (typeof s === 'function') return s(args)
    if (s) return s
    return defaultRpc(name, args)
  }
  db.auth.admin.updateUserById = async (id, attrs) => {
    banCalls.push({ id, attrs: JSON.parse(JSON.stringify(attrs)) })
    order.push('ban')
    return typeof banResult === 'function' ? banResult() : banResult
  }
  const baseInvite = db.auth.admin.inviteUserByEmail.bind(db.auth.admin)
  db.auth.admin.inviteUserByEmail = async (email, opts) => { order.push('invite_email'); return baseInvite(email, opts) }
  const baseGen = db.auth.admin.generateLink.bind(db.auth.admin)
  db.auth.admin.generateLink = async (args) => { order.push('generate_link'); return baseGen(args) }
  return db
}
freshDb()

installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => db })
global.fetch = async () => { throw new Error('network disabled in tests') }

const agency = require(path.join(FN, 'agency-admin.js'))

const realLog = console.log
const realWarn = console.warn
const realError = console.error
const quiet = () => { console.warn = () => {}; console.error = () => {}; console.log = () => {} }
const loud = () => { console.warn = realWarn; console.error = realError; console.log = realLog }

const ev = (token, body, method = 'POST') => ({
  httpMethod: method,
  headers: { authorization: token ? 'Bearer ' + token : '', origin: 'https://app.getbrandgeo.com' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})
async function post(body, token = 'tok-admin', method = 'POST') {
  quiet()
  try {
    const res = await agency.handler(ev(token, body, method))
    let parsed = null
    try { parsed = JSON.parse(res.body) } catch { parsed = res.body }
    return { status: res.statusCode, body: parsed }
  } finally { loud() }
}

function assertOneRpc(name, expected) {
  assert.strictEqual(rpcLog.length, 1, 'rpc calls: ' + JSON.stringify(rpcLog))
  assert.strictEqual(rpcLog[0].name, name)
  assert.deepStrictEqual(Object.keys(rpcLog[0].args).sort(), CONTRACT_ARGS[name].slice().sort())
  for (const [k, v] of Object.entries(expected)) assert.deepStrictEqual(rpcLog[0].args[k], v, k)
  assert.strictEqual(rpcLog[0].args.p_actor, ADMIN)
}

;(async () => {
  // ════════════════════════════════════════════════════════════════════════
  console.log('1. gate and parsing')
  await check('no token 401, viewer 403, nothing read past the gate', async () => {
    freshDb()
    let r = await post({ action: 'list' }, '')
    assert.strictEqual(r.status, 401)
    r = await post({ action: 'list' }, 'tok-viewer')
    assert.strictEqual(r.status, 403)
    assert.match(r.body.error, /admin access required/)
    assert.strictEqual(rpcLog.length, 0)
    assert.ok(!db.calls.some((c) => c.table && !['user_profiles'].includes(c.table)), JSON.stringify(db.calls))
  })
  await check('GET 405; a non-object body, bad JSON and an unknown action are 400 invalid_request', async () => {
    freshDb()
    assert.strictEqual((await post({ action: 'list' }, 'tok-admin', 'GET')).status, 405)
    for (const b of ['null', '[]', '7', '"list"', '{bad', JSON.stringify({ action: 'drop_everything' }), JSON.stringify({})]) {
      const r = await post(b)
      assert.strictEqual(r.status, 400, b)
      assert.strictEqual(r.body.code, 'invalid_request')
    }
    assert.strictEqual(rpcLog.length, 0)
  })
  await check('strict ids: account_id, client_id, user_id, role, confirm, confirm_user_ids', async () => {
    freshDb()
    const bad = [
      { action: 'detach_brand', account_id: '1e0', client_id: 20 },
      { action: 'detach_brand', account_id: 1, client_id: -20 },
      { action: 'detach_brand', account_id: [1], client_id: 20 },
      { action: 'detach_brand', account_id: 1, client_id: 2147483648 },
      { action: 'add_staff', account_id: 1, user_id: 'not-a-uuid', role: 'owner' },
      { action: 'add_staff', account_id: 1, user_id: NEWBIE, role: 'admin' },
      { action: 'remove_member', account_id: 1, user_id: NEWBIE + 'x' },
      { action: 'remove_guest', client_id: '20.0', user_id: GUEST },
      { action: 'convert', account_id: 1, confirm: 'true', confirm_user_ids: [] },
      { action: 'convert', account_id: 1, confirm: true },
      { action: 'convert', account_id: 1, confirm: true, confirm_user_ids: ['x'] },
      { action: 'attach_brand', account_id: 1, client_id: 30, confirm: true, confirm_user_ids: 'all' },
      { action: 'create_staff_login', account_id: 1, email: 'not an email', role: 'owner' },
      { action: 'create_guest_login', client_id: 20, email: 42 },
      { action: 'list', account_id: 'one' },
      { action: 'ban_removed', account_id: 1 },
      { action: 'ban_removed', account_id: '01', user_id: GUEST },
      { action: 'ban_removed', account_id: 1, user_id: 'all' },
    ]
    for (const b of bad) {
      const r = await post(b)
      assert.strictEqual(r.status, 400, JSON.stringify(b) + ' -> ' + JSON.stringify(r.body))
    }
    assert.strictEqual(rpcLog.length, 0)
    assert.strictEqual(banCalls.length, 0)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('2. one rpc per write, contract names and arguments')
  await check('convert confirm: convert_to_agency(p_account_id, p_confirm_user_ids, p_actor)', async () => {
    freshDb()
    const r = await post({ action: 'convert', account_id: 2, confirm: true, confirm_user_ids: [D_OWNER, D_OWNER.toUpperCase()] })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assertOneRpc('convert_to_agency', { p_account_id: 2, p_confirm_user_ids: [D_OWNER] })
    assert.deepStrictEqual(r.body.result, { account_id: 2, home_client_id: 10 })
  })
  await check('attach_brand confirm: account_attach_brand with the confirmed ids', async () => {
    freshDb()
    const r = await post({ action: 'attach_brand', account_id: '1', client_id: '30', confirm: true, confirm_user_ids: [D_OWNER] })
    assert.strictEqual(r.status, 200)
    assertOneRpc('account_attach_brand', { p_account_id: 1, p_client_id: 30, p_confirm_user_ids: [D_OWNER] })
    assert.strictEqual(r.body.result.brand_name, 'Client Brand')
  })
  await check('detach_brand: account_detach_brand', async () => {
    freshDb()
    const r = await post({ action: 'detach_brand', account_id: 1, client_id: 20 })
    assert.strictEqual(r.status, 200)
    assertOneRpc('account_detach_brand', { p_account_id: 1, p_client_id: 20 })
  })
  await check('add_staff: account_add_staff with the role', async () => {
    freshDb()
    const r = await post({ action: 'add_staff', account_id: 1, user_id: NEWBIE, role: 'manager' })
    assert.strictEqual(r.status, 200)
    assertOneRpc('account_add_staff', { p_account_id: 1, p_user_id: NEWBIE, p_role: 'manager' })
  })
  await check('remove_member: account_remove_member, then the ban', async () => {
    freshDb()
    const r = await post({ action: 'remove_member', account_id: 1, user_id: OWNER })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assertOneRpc('account_remove_member', { p_account_id: 1, p_user_id: OWNER })
    assert.deepStrictEqual(order, ['rpc:account_remove_member', 'ban'])
    assert.strictEqual(r.body.banned, true)
  })
  await check('remove_guest: account_remove_guest(p_client_id, p_user_id, p_actor), then the ban', async () => {
    freshDb()
    const r = await post({ action: 'remove_guest', client_id: 20, user_id: GUEST })
    assert.strictEqual(r.status, 200)
    assertOneRpc('account_remove_guest', { p_client_id: 20, p_user_id: GUEST })
    assert.deepStrictEqual(order, ['rpc:account_remove_guest', 'ban'])
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('3. previews')
  await check('convert preview: home brand and every login on it with email, no rpc, no write', async () => {
    freshDb()
    const before = JSON.stringify(db.tables)
    const r = await post({ action: 'convert', account_id: 2 })
    assert.strictEqual(r.status, 200)
    assert.strictEqual(r.body.preview, true)
    assert.deepStrictEqual(r.body.brand, { id: 30, name: 'Direct Brand' })
    assert.deepStrictEqual(r.body.users, [{ id: D_OWNER, email: 'direct@example.com' }])
    assert.strictEqual(rpcLog.length, 0)
    assert.strictEqual(JSON.stringify(db.tables), before)
  })
  await check('attach preview: brand name, plan, current account, logins by profile OR user_clients row', async () => {
    freshDb()
    db.seed('user_clients', [{ user_id: NEWBIE, client_id: 30, role: 'member', grant_source: 'direct' }])
    db.usersById.set(NEWBIE, { id: NEWBIE, email: 'newbie@example.com' })
    const r = await post({ action: 'attach_brand', account_id: 1, client_id: 30, confirm: false })
    assert.strictEqual(r.status, 200)
    assert.deepStrictEqual(r.body.brand, { id: 30, name: 'Direct Brand', plan: 'radar', category: 'active', current_account_id: 2 })
    assert.deepStrictEqual(r.body.users.map((u) => u.id).sort(), [D_OWNER, NEWBIE].sort())
    assert.ok(r.body.users.every((u) => typeof u.email === 'string'))
    assert.strictEqual(r.body.stripe_linked, false)
    assert.strictEqual(r.body.blocked_by, null)
    assert.strictEqual(rpcLog.length, 0)
  })
  await check('attach preview of a brand with a Stripe customer or subscription: stripe_linked, blocked_by brand_has_stripe, no id leaks (F1)', async () => {
    for (const extra of [{ stripe_customer_id: 'cus_testplaceholder' }, { stripe_subscription_id: 'sub_testplaceholder' }]) {
      freshDb()
      const c30 = db.rows('clients').find((c) => c.id === 30)
      Object.assign(c30, extra)
      const r = await post({ action: 'attach_brand', account_id: 1, client_id: 30 })
      assert.strictEqual(r.status, 200, JSON.stringify(r.body))
      assert.strictEqual(r.body.stripe_linked, true)
      assert.strictEqual(r.body.blocked_by, 'brand_has_stripe')
      assert.strictEqual(typeof r.body.blocked_message, 'string')
      assert.ok(!JSON.stringify(r.body).includes('placeholder'), 'a Stripe id leaked: ' + JSON.stringify(r.body))
      assert.strictEqual(rpcLog.length, 0)
    }
  })
  await check('attach confirm refused by SQL with brand_has_stripe: 409 { code: brand_has_stripe } (F1)', async () => {
    freshDb()
    rpcScript.account_attach_brand = { data: null, error: { code: 'P0001', message: 'brand_has_stripe' } }
    const r = await post({ action: 'attach_brand', account_id: 1, client_id: 30, confirm: true, confirm_user_ids: [D_OWNER] })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.body.code, 'brand_has_stripe')
    assert.match(r.body.error, /Stripe/)
  })
  await check('previews of a missing account or brand are 404', async () => {
    freshDb()
    assert.strictEqual((await post({ action: 'convert', account_id: 99 })).body.code, 'account_not_found')
    assert.strictEqual((await post({ action: 'attach_brand', account_id: 1, client_id: 99 })).status, 404)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('4. error mapping')
  const cases = [
    ['last_owner', 422], ['account_not_found', 404], ['client_not_found', 404], ['user_not_found', 404],
    ['unconfirmed_users', 409], ['account_not_agency', 409], ['brand_not_attachable', 409],
    ['brand_is_agency_home', 409], ['user_in_account', 409], ['profile_exists', 409], ['brand_has_stripe', 409],
    ['some_future_token', 409],
  ]
  for (const [token, status] of cases) {
    await check(`P0001 ${token}: ${status} { error, code: '${token}' }, no ban`, async () => {
      freshDb()
      rpcScript.account_remove_member = { data: null, error: { code: 'P0001', message: token } }
      const r = await post({ action: 'remove_member', account_id: 1, user_id: OWNER })
      assert.strictEqual(r.status, status)
      assert.strictEqual(r.body.code, token)
      assert.strictEqual(typeof r.body.error, 'string')
      assert.ok(r.body.error.length > 0)
      assert.strictEqual(banCalls.length, 0)
    })
  }
  await check('P0001 with a sentence (not a token) and a non-P0001 error: 500 db_error, the database text never leaks', async () => {
    for (const error of [
      { code: 'P0001', message: 'prompt_cap_reached: plan growth cap 35' },
      { code: '23505', message: 'duplicate key value violates unique constraint "secret_index_name"' },
      { message: 'fetch failed' },
    ]) {
      freshDb()
      rpcScript.account_detach_brand = { data: null, error }
      const r = await post({ action: 'detach_brand', account_id: 1, client_id: 20 })
      assert.strictEqual(r.status, 500)
      assert.strictEqual(r.body.code, 'db_error')
      assert.ok(!JSON.stringify(r.body).includes(error.message), 'leaked: ' + JSON.stringify(r.body))
    }
  })
  await check('an rpc that throws: 500 db_error', async () => {
    freshDb()
    rpcScript.account_add_staff = () => { throw new Error('socket hang up') }
    const r = await post({ action: 'add_staff', account_id: 1, user_id: NEWBIE, role: 'owner' })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.code, 'db_error')
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('5. the ban')
  await check('the ban value is fixed: 876000h, a ban_duration in the body is ignored', async () => {
    freshDb()
    const r = await post({ action: 'remove_member', account_id: 1, user_id: OWNER, ban_duration: '1h', duration: 'none' })
    assert.strictEqual(r.status, 200)
    assert.deepStrictEqual(banCalls, [{ id: OWNER, attrs: { ban_duration: '876000h' } }])
    assert.strictEqual(agency.BAN_DURATION, '876000h')
    assert.strictEqual(r.body.ban_duration, '876000h')
  })
  await check('a failed ban: 500 { access_removed: true, ban_failed: true }, the rpc result kept', async () => {
    freshDb()
    banResult = { data: null, error: { status: 500, message: 'gotrue down' } }
    const r = await post({ action: 'remove_guest', client_id: 20, user_id: GUEST })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.access_removed, true)
    assert.strictEqual(r.body.ban_failed, true)
    assert.strictEqual(r.body.code, 'ban_failed')
    assert.strictEqual(r.body.result.ban_login, true)
    // F2: the message and the body point at the retry action, not the Supabase dashboard
    assert.match(r.body.error, /ban_removed/)
    assert.ok(!/Supabase/.test(r.body.error))
    assert.deepStrictEqual(r.body.retry, { action: 'ban_removed', account_id: 1, user_id: GUEST })
  })
  await check('a ban that throws: the same 500 shape', async () => {
    freshDb()
    banResult = () => { throw new Error('network') }
    const r = await post({ action: 'remove_member', account_id: 1, user_id: OWNER })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.ban_failed, true)
    assert.strictEqual(r.body.access_removed, true)
  })
  await check('an admin target (or the caller) is refused before the rpc, never banned', async () => {
    for (const uid of [ADMIN2, ADMIN]) {
      freshDb()
      const r = await post({ action: 'remove_member', account_id: 1, user_id: uid })
      assert.strictEqual(r.status, 409)
      assert.strictEqual(r.body.code, 'target_is_admin')
      assert.strictEqual(rpcLog.length, 0)
      assert.strictEqual(banCalls.length, 0)
    }
  })
  await check('the target profile read failing: 500 read_failed, no rpc, no ban', async () => {
    freshDb()
    // requireAuth's own profile read is the first user_profiles query; the
    // target's role read is the second, and that one fails.
    const realFrom = db.from.bind(db)
    let n = 0
    db.from = (t) => {
      const q = realFrom(t)
      if (t === 'user_profiles' && ++n === 2) q._run = async () => ({ data: null, error: { message: 'boom' } })
      return q
    }
    const r = await post({ action: 'remove_member', account_id: 1, user_id: OWNER })
    assert.strictEqual(r.status, 500, JSON.stringify(r))
    assert.strictEqual(r.body.code, 'read_failed')
    assert.strictEqual(rpcLog.length, 0)
    assert.strictEqual(banCalls.length, 0)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('5b. ban_removed, the retry of a failed ban (F2)')
  // A removed staffer: default brand 10 (agency home), no member row, no rows.
  const REMOVED = 'cccccccc-0000-4000-8000-000000000007'
  // A removed guest: default brand 20 (agency client brand), no rows.
  const REMOVED_G = 'cccccccc-0000-4000-8000-000000000008'
  const seedRemoved = () => {
    db.usersById.set(REMOVED, { id: REMOVED, email: 'removed@example.com' })
    db.usersById.set(REMOVED_G, { id: REMOVED_G, email: 'removedguest@example.com' })
    db.seed('user_profiles', [
      { id: REMOVED, role: 'viewer', client_id: 10 },
      { id: REMOVED_G, role: 'viewer', client_id: 20 },
    ])
  }
  await check('a removed staffer and a removed guest are banned with the fixed 876000h, no rpc', async () => {
    for (const uid of [REMOVED, REMOVED_G]) {
      freshDb(); seedRemoved()
      const r = await post({ action: 'ban_removed', account_id: 1, user_id: uid, ban_duration: '1h' })
      assert.strictEqual(r.status, 200, JSON.stringify(r.body))
      assert.deepStrictEqual(banCalls, [{ id: uid, attrs: { ban_duration: '876000h' } }])
      assert.strictEqual(r.body.banned, true)
      assert.strictEqual(r.body.ban_duration, '876000h')
      assert.strictEqual(rpcLog.length, 0)
    }
  })
  await check('refused 409 user_not_removed, no ban: an active member, a login with a row on a brand of the account, a default brand outside the account', async () => {
    const cases = [
      [() => {}, OWNER],                                                          // still an account member
      [() => {}, GUEST],                                                          // still holds a primary row on 20
      [() => db.seed('user_clients', [{ user_id: REMOVED, client_id: 20, role: 'member', grant_source: 'direct' }]), REMOVED],
      [() => {}, D_OWNER],                                                        // default brand 30 is in account 2
    ]
    for (const [setup, uid] of cases) {
      freshDb(); seedRemoved(); setup()
      const r = await post({ action: 'ban_removed', account_id: 1, user_id: uid })
      assert.strictEqual(r.status, 409, uid + ' ' + JSON.stringify(r.body))
      assert.strictEqual(r.body.code, 'user_not_removed')
      assert.strictEqual(banCalls.length, 0)
    }
    // the removed staffer is refused against another account too
    freshDb(); seedRemoved()
    const r = await post({ action: 'ban_removed', account_id: 2, user_id: REMOVED })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(banCalls.length, 0)
  })
  await check('refused: the caller and an admin target (409 target_is_admin), a login without a profile and a missing account (404)', async () => {
    for (const [body, status, code] of [
      [{ action: 'ban_removed', account_id: 1, user_id: ADMIN }, 409, 'target_is_admin'],
      [{ action: 'ban_removed', account_id: 1, user_id: ADMIN2 }, 409, 'target_is_admin'],
      [{ action: 'ban_removed', account_id: 1, user_id: NEWBIE }, 404, 'user_not_found'],
      [{ action: 'ban_removed', account_id: 99, user_id: REMOVED }, 404, 'account_not_found'],
    ]) {
      freshDb(); seedRemoved()
      const r = await post(body)
      assert.strictEqual(r.status, status, JSON.stringify(body) + ' ' + JSON.stringify(r.body))
      assert.strictEqual(r.body.code, code)
      assert.strictEqual(banCalls.length, 0)
    }
  })
  await check('any read error: 500 read_failed, no ban', async () => {
    for (const table of ['account_members', 'user_clients', 'clients', 'accounts']) {
      freshDb(); seedRemoved()
      db.faults.push({ table, error: { message: 'boom' } })
      const r = await post({ action: 'ban_removed', account_id: 1, user_id: REMOVED })
      assert.strictEqual(r.status, 500, table + ' ' + JSON.stringify(r.body))
      assert.strictEqual(r.body.code, 'read_failed')
      assert.strictEqual(banCalls.length, 0)
    }
  })
  await check('a ban that fails again: the same 500 ban_failed shape with the retry', async () => {
    freshDb(); seedRemoved()
    banResult = { data: null, error: { status: 500, message: 'gotrue down' } }
    const r = await post({ action: 'ban_removed', account_id: 1, user_id: REMOVED })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.code, 'ban_failed')
    assert.strictEqual(r.body.access_removed, true)
    assert.strictEqual(r.body.ban_failed, true)
    assert.deepStrictEqual(r.body.retry, { action: 'ban_removed', account_id: 1, user_id: REMOVED })
  })
  await check('a viewer cannot call ban_removed (403)', async () => {
    freshDb(); seedRemoved()
    const r = await post({ action: 'ban_removed', account_id: 1, user_id: REMOVED }, 'tok-viewer')
    assert.strictEqual(r.status, 403)
    assert.strictEqual(banCalls.length, 0)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('6. create_guest_login')
  const usersCount = () => db.usersById.size
  await check('guest refusals create no auth user and call no rpc', async () => {
    for (const [body, status, code] of [
      [{ action: 'create_guest_login', client_id: 99, email: 'g@example.com' }, 404, 'client_not_found'],
      [{ action: 'create_guest_login', client_id: 30, email: 'g@example.com' }, 409, 'brand_not_in_agency'],
      [{ action: 'create_guest_login', client_id: 10, email: 'g@example.com' }, 409, 'brand_is_agency_home'],
    ]) {
      freshDb()
      const n = usersCount()
      const r = await post(body)
      assert.strictEqual(r.status, status, JSON.stringify(r.body))
      assert.strictEqual(r.body.code, code)
      assert.strictEqual(usersCount(), n)
      assert.strictEqual(db.generatedLinks.length, 0)
      assert.strictEqual(rpcLog.length, 0)
    }
  })
  await check('guest success: ONE rpc account_create_guest_profile (F4), no direct profile insert, invite after the rpc', async () => {
    freshDb()
    const membersBefore = db.rows('account_members').length
    const r = await post({ action: 'create_guest_login', client_id: 20, email: 'New.Guest@Example.com' })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    const uid = r.body.user_id
    assertOneRpc('account_create_guest_profile', { p_client_id: 20, p_user_id: uid })
    assert.ok(!db.calls.some((c) => c.table === 'user_profiles' && c.op === 'insert'), 'the function inserted a profile itself')
    assert.deepStrictEqual(r.body.result, { account_id: 1, user_id: uid, client_id: 20 })
    assert.strictEqual(db.rows('account_members').length, membersBefore)
    assert.deepStrictEqual(order, ['generate_link', 'rpc:account_create_guest_profile', 'invite_email'])
    assert.strictEqual(db.invites.length, 1)
    assert.strictEqual(db.invites[0].email, 'new.guest@example.com')
    assert.strictEqual(r.body.invite.sent, true)
  })
  await check('guest: an SQL refusal after the login was created removes it (ours, no profile), no email, token mapped', async () => {
    for (const [token, status] of [['brand_not_in_agency', 409], ['brand_is_agency_home', 409], ['client_not_found', 404]]) {
      freshDb()
      rpcScript.account_create_guest_profile = { data: null, error: { code: 'P0001', message: token } }
      const r = await post({ action: 'create_guest_login', client_id: 20, email: 'g2@example.com' })
      assert.strictEqual(r.status, status, token)
      assert.strictEqual(r.body.code, token)
      assert.strictEqual(r.body.login_removed, true)
      assert.strictEqual(db.deletedUsers.length, 1)
      assert.strictEqual(db.invites.length, 0)
      assert.ok(!order.includes('invite_email'))
    }
  })
  await check('guest: an SQL failure after a profile exists keeps the login, 500 db_error, no email', async () => {
    freshDb()
    rpcScript.account_create_guest_profile = (a) => {
      db.seed('user_profiles', [{ id: a.p_user_id, role: 'viewer', client_id: 20 }])
      return { data: null, error: { code: 'XX000', message: 'internal' } }
    }
    const r = await post({ action: 'create_guest_login', client_id: 20, email: 'g3@example.com' })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.code, 'db_error')
    assert.strictEqual(r.body.login_removed, false)
    assert.strictEqual(db.deletedUsers.length, 0)
    assert.strictEqual(db.invites.length, 0)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('7. create_staff_login')
  await check('an address that already has a login: 409 email_registered before any invite', async () => {
    freshDb()
    const r = await post({ action: 'create_staff_login', account_id: 1, email: 'GUEST@example.com', role: 'manager' })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.body.code, 'email_registered')
    assert.strictEqual(db.generatedLinks.length, 0)
    assert.strictEqual(rpcLog.length, 0)
  })
  await check('an account that is not an agency: 409 account_not_agency, no user created', async () => {
    freshDb()
    const r = await post({ action: 'create_staff_login', account_id: 2, email: 's@example.com', role: 'owner' })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.body.code, 'account_not_agency')
    assert.strictEqual(db.generatedLinks.length, 0)
  })
  await check('success: generateLink (sends nothing), ONE rpc, then the invite email', async () => {
    freshDb()
    const r = await post({ action: 'create_staff_login', account_id: 1, email: 'staff@example.com', role: 'owner' })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assertOneRpc('account_create_staff_profile', { p_account_id: 1, p_user_id: r.body.user_id, p_role: 'owner' })
    assert.deepStrictEqual(order, ['generate_link', 'rpc:account_create_staff_profile', 'invite_email'])
    assert.strictEqual(r.body.invite.sent, true)
    assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('SQL failure, user ours with no profile: deleted, no email, error mapped', async () => {
    freshDb()
    rpcScript.account_create_staff_profile = { data: null, error: { code: 'P0001', message: 'user_in_account' } }
    const r = await post({ action: 'create_staff_login', account_id: 1, email: 'staff2@example.com', role: 'manager' })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.body.code, 'user_in_account')
    assert.strictEqual(r.body.login_removed, true)
    assert.strictEqual(db.deletedUsers.length, 1)
    assert.strictEqual(db.invites.length, 0)
    assert.ok(!order.includes('invite_email'))
  })
  await check('SQL failure, the user has a profile by then: kept, no email', async () => {
    freshDb()
    rpcScript.account_create_staff_profile = (a) => {
      db.seed('user_profiles', [{ id: a.p_user_id, role: 'viewer', client_id: 30 }])
      return { data: null, error: { code: 'XX000', message: 'internal' } }
    }
    const r = await post({ action: 'create_staff_login', account_id: 1, email: 'staff3@example.com', role: 'manager' })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.login_removed, false)
    assert.strictEqual(db.deletedUsers.length, 0)
    assert.strictEqual(db.invites.length, 0)
  })
  await check('a user that is not ours (old created_at): 409, never bound, never deleted, no rpc', async () => {
    freshDb()
    const OLD = 'cccccccc-0000-4000-8000-0000000000aa'
    db.authBehaviour = { invite: async (email) => ({ data: { user: { id: OLD, email, created_at: '2020-01-01T00:00:00Z' } }, error: null }) }
    const r = await post({ action: 'create_staff_login', account_id: 1, email: 'race@example.com', role: 'owner' })
    assert.strictEqual(r.status, 409)
    assert.strictEqual(r.body.code, 'email_registered')
    assert.strictEqual(rpcLog.length, 0)
    assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('an incomplete auth listing: 503 auth_lookup_incomplete, nothing created', async () => {
    freshDb()
    db.auth.admin.listUsers = async () => ({ data: null, error: { message: 'down' } })
    const r = await post({ action: 'create_staff_login', account_id: 1, email: 'x@example.com', role: 'owner' })
    assert.strictEqual(r.status, 503)
    assert.strictEqual(db.generatedLinks.length, 0)
  })

  // ════════════════════════════════════════════════════════════════════════
  console.log('8. list and the 4.4 checks')
  await check('list one account: members with email, brands with active prompts, rows by grant_source, checks 0', async () => {
    freshDb()
    const r = await post({ action: 'list', account_id: 1 })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.deepStrictEqual(r.body.account, { id: 1, name: 'Agency Account', kind: 'agency', home_client_id: 10, created_at: r.body.account.created_at })
    assert.deepStrictEqual(r.body.members.map((m) => [m.user_id, m.email, m.role]), [[OWNER, 'owner@example.com', 'owner']])
    assert.deepStrictEqual(r.body.brands.map((b) => [b.id, b.plan, b.is_home, b.active_prompts]), [[10, 'growth', true, 1], [20, 'essentials', false, 2]])
    assert.deepStrictEqual(Object.fromEntries(Object.entries(r.body.rows).map(([k, v]) => [k, v.length])), { backfill: 0, primary: 2, account: 1, direct: 0 })
    assert.strictEqual(r.body.checks.complete, true)
    assert.deepStrictEqual([r.body.checks.missing.count, r.body.checks.stale.count, r.body.checks.stray.count], [0, 0, 0])
    assert.strictEqual(rpcLog.length, 0)
  })
  await check('the checks count missing, stale and stray rows', async () => {
    freshDb()
    db.seed('account_members', [{ account_id: 1, user_id: NEWBIE, role: 'manager' }])          // missing x2
    db.seed('user_clients', [{ user_id: GUEST, client_id: 10, role: 'member', grant_source: 'account' }]) // stale and stray
    db.seed('user_clients', [{ user_id: D_OWNER, client_id: 20, role: 'member', grant_source: 'direct' }]) // direct: excluded from stray
    const r = await post({ action: 'list' })
    assert.strictEqual(r.status, 200)
    assert.strictEqual(r.body.checks.missing.count, 2)
    assert.strictEqual(r.body.checks.stale.count, 1)
    assert.strictEqual(r.body.checks.stray.count, 1)
    assert.deepStrictEqual(r.body.accounts.map((a) => [a.id, a.brand_count, a.member_count]), [[1, 2, 2]])
  })
  await check('the user_clients read pages past 1,000 rows without losing or doubling a user', async () => {
    freshDb()
    const u = (n) => `dddddddd-0000-4000-8000-${String(n).padStart(12, '0')}`
    const rows = []
    for (let i = 0; i < 700; i++) rows.push({ user_id: u(1), client_id: 1000 + i, role: 'member', grant_source: 'direct' })
    for (let i = 0; i < 600; i++) rows.push({ user_id: u(2), client_id: 2000 + i, role: 'member', grant_source: 'direct' })
    for (let i = 0; i < 900; i++) rows.push({ user_id: u(3), client_id: 3000 + i, role: 'member', grant_source: 'direct' })
    db.seed('user_clients', rows)
    const { data, checks } = await agency.computeChecks(db)
    assert.strictEqual(checks.complete, true)
    assert.strictEqual(data.links.rows.length, 4 + 2200)
    assert.strictEqual(new Set(data.links.rows.map((l) => `${l.user_id}|${l.client_id}`)).size, 4 + 2200)
  })
  await check('a read error: 500 read_failed, never partial checks', async () => {
    freshDb()
    db.faults.push({ table: 'account_members', error: { message: 'boom' } })
    const r = await post({ action: 'list', account_id: 1 })
    assert.strictEqual(r.status, 500)
    assert.strictEqual(r.body.code, 'read_failed')
  })
  await check('list of a missing account: 404', async () => {
    freshDb()
    const r = await post({ action: 'list', account_id: 77 })
    assert.strictEqual(r.status, 404)
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  loud()
  console.error(e)
  process.exit(1)
})
