/**
 * resend_invite.test.js: pending invites (netlify/functions/resend-invite.js),
 * the list, the guarded resend and the legacy { email } form, against the
 * in-memory Supabase fake.
 *
 * _auth.js is replaced through tests/helpers/affiliate_test_env.js
 * (installAuthMock). @supabase/supabase-js is replaced in require.cache so the
 * handler's createClient() returns the fake. The shared fake's auth.admin is
 * NOT GoTrue-faithful (its invite errors for every existing user and it has no
 * getUserById), so this file installs its own model on db.auth.admin, without
 * touching the shared helper:
 *   - inviteUserByEmail on an unknown address CREATES a user (what makes the
 *     orphan guard provable);
 *   - on an existing unconfirmed user it restamps invited_at and returns it;
 *   - on a confirmed user it errors "already been registered";
 *   - listUsers honours { page, perPage };
 *   - getUserById answers 404 for an unknown id.
 *
 * Fixtures use @example.com addresses and invented company names only.
 *
 * Run: `node tests/resend_invite.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const crypto = require('crypto')

const { installAuthMock, fn, post, parse } = require('./helpers/affiliate_test_env')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const ADMIN_ID = 'aaaaaaaa-0000-4000-8000-000000000001'
const VIEWER_ID = 'bbbbbbbb-0000-4000-8000-000000000002'
installAuthMock({
  tokens: {
    'admin-jwt': { role: 'admin', user: { id: ADMIN_ID, email: 'admin@example.com' } },
    'viewer-jwt': { role: 'viewer', user: { id: VIEWER_ID, email: 'viewer@example.com' }, client_id: 10 },
  },
})

let db = null
function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient() { return db } })

const handlerMod = fn('resend-invite.js')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

// ── fixtures ────────────────────────────────────────────────────────────────
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const U1 = id(1)   // viewer, client 10, pending
const U2 = id(2)   // viewer, client 12, pending (newest invite)
const U3 = id(3)   // viewer, client 12, pending (oldest invite)
const U4 = id(4)   // viewer, client 13, accepted (email confirmed)
const U4B = id(41) // viewer, client 11, accepted (signed in only)
const U5 = id(5)   // viewer, client 14, self-serve signup never confirmed
const U6 = id(6)   // viewer, client 15, no auth user
const U7 = id(7)   // admin, no client
const U8 = id(8)   // admin, client 10, pending (wizard admin invite)
const U9 = id(9)   // viewer, client null
const U10 = id(10) // auth user, no profile, pending, created long ago
const T = (d) => `2026-11-${d}T09:00:00.000Z`

function fresh() {
  db = createFakeSupabase({ now: () => new Date('2026-11-11T10:00:00Z') })
  db.seed('clients', [
    { id: 10, name: 'Acme Widgets Test', plan: 'growth', category: 'active' },
    { id: 11, name: 'Borealis Bakery Test', plan: 'radar', category: 'active' },
    { id: 12, name: 'Cobalt Clinic Test', plan: 'essentials', category: null },
    { id: 13, name: 'Delta Dental Test', plan: 'free', category: 'active' },
    { id: 14, name: 'Echo Ecom Test', plan: 'free', category: 'active' },
    { id: 15, name: 'Foxtrot Freight Test', plan: 'radar', category: 'research' },
  ])
  db.seed('user_profiles', [
    { id: U1, client_id: 10, role: 'viewer' },
    { id: U2, client_id: 12, role: 'viewer' },
    { id: U3, client_id: 12, role: 'viewer' },
    { id: U4, client_id: 13, role: 'viewer' },
    { id: U4B, client_id: 11, role: 'viewer' },
    { id: U5, client_id: 14, role: 'viewer' },
    { id: U6, client_id: 15, role: 'viewer' },
    { id: U7, client_id: null, role: 'admin' },
    { id: U8, client_id: 10, role: 'admin' },
    { id: U9, client_id: null, role: 'viewer' },
  ])
  const users = [
    { id: U1, email: 'person.one@example.com', created_at: T('01'), invited_at: T('05'), email_confirmed_at: null, last_sign_in_at: null },
    { id: U2, email: 'person.two@example.com', created_at: T('02'), invited_at: T('09'), email_confirmed_at: null, last_sign_in_at: null },
    { id: U3, email: 'person.three@example.com', created_at: T('02'), invited_at: T('03'), email_confirmed_at: null, last_sign_in_at: null },
    { id: U4, email: 'person.four@example.com', created_at: T('01'), invited_at: T('02'), email_confirmed_at: T('02'), last_sign_in_at: T('04') },
    { id: U4B, email: 'person.fourb@example.com', created_at: T('01'), invited_at: null, email_confirmed_at: null, last_sign_in_at: T('06') },
    { id: U5, email: 'person.five@example.com', created_at: T('01'), invited_at: null, email_confirmed_at: null, last_sign_in_at: null },
    { id: U7, email: 'ops.admin@example.com', created_at: T('01'), invited_at: null, email_confirmed_at: T('01'), last_sign_in_at: T('10') },
    { id: U8, email: 'wizard.admin@example.com', created_at: T('07'), invited_at: T('07'), email_confirmed_at: null, last_sign_in_at: null },
    { id: U9, email: 'person.nine@example.com', created_at: T('01'), invited_at: T('01'), email_confirmed_at: null, last_sign_in_at: null },
    { id: U10, email: 'orphan.ten@example.com', created_at: '2026-01-01T00:00:00.000Z', invited_at: T('04'), email_confirmed_at: null, last_sign_in_at: null },
  ]
  installGoTrue(db, users)
  return db
}

// GoTrue-faithful model of auth.admin, local to this file.
function installGoTrue(d, seedUsers) {
  const g = {
    users: new Map(seedUsers.map((u) => [u.id, { ...u }])),
    inviteCalls: [],
    deleteCalls: [],
    listCalls: [],
    getCalls: [],
    inviteOverride: null, // (email, opts) => result, replaces the default
    deleteFails: false,
    listFails: false,
  }
  d.gotrue = g
  d.auth.admin = {
    async listUsers({ page = 1, perPage = 50 } = {}) {
      g.listCalls.push({ page, perPage })
      if (g.listFails) return { data: { users: [] }, error: { message: 'gotrue internal detail xyz' } }
      const all = Array.from(g.users.values())
      return { data: { users: all.slice((page - 1) * perPage, page * perPage).map((u) => ({ ...u })) }, error: null }
    },
    async getUserById(uid) {
      g.getCalls.push(uid)
      const u = g.users.get(uid)
      return u ? { data: { user: { ...u } }, error: null } : { data: { user: null }, error: { status: 404, message: 'User not found' } }
    },
    async inviteUserByEmail(email, opts) {
      g.inviteCalls.push({ email, opts })
      if (g.inviteOverride) return g.inviteOverride(email, opts)
      const existing = Array.from(g.users.values()).find((u) => u.email.toLowerCase() === String(email).toLowerCase())
      if (existing && (existing.email_confirmed_at || existing.last_sign_in_at)) {
        return { data: { user: null }, error: { status: 422, message: 'A user with this email address has already been registered' } }
      }
      if (existing) {
        existing.invited_at = new Date().toISOString()
        return { data: { user: { ...existing } }, error: null }
      }
      const now = new Date().toISOString()
      const u = { id: crypto.randomUUID(), email, created_at: now, invited_at: now, email_confirmed_at: null, last_sign_in_at: null }
      g.users.set(u.id, u)
      return { data: { user: { ...u } }, error: null }
    },
    async deleteUser(uid) {
      g.deleteCalls.push(uid)
      if (g.deleteFails) return { data: null, error: { message: 'delete refused' } }
      g.users.delete(uid)
      return { data: {}, error: null }
    },
  }
}

// Wrap db.from to refuse one table, the way a CHECK or a read error would.
function refuse(table, op, message) {
  const orig = db.from.bind(db)
  db.from = (t) => {
    if (t !== table) return orig(t)
    if (op === 'insert') return { insert: async () => ({ data: null, error: { code: '23514', message } }) }
    const res = { data: null, error: { message } }
    const stub = { select: () => stub, eq: () => stub, in: () => stub, maybeSingle: () => stub, then: (r, j) => Promise.resolve(res).then(r, j) }
    return stub
  }
}

async function call(body, opts = {}) {
  const ev = post(body, { token: 'admin-jwt', ...opts })
  if (opts.method) ev.httpMethod = opts.method
  return parse(await handlerMod.handler(ev))
}

async function main() {
  section('1. auth gate')
  fresh()
  let r = await call({ action: 'list' }, { token: null })
  assert.strictEqual(r.status, 401)
  ok('no token: 401')
  for (const body of [{ action: 'list' }, { action: 'resend', user_id: U1 }, { email: 'person.one@example.com' }]) {
    r = await call(body, { token: 'viewer-jwt' })
    assert.strictEqual(r.status, 403, JSON.stringify(body))
    const raw = JSON.stringify(r.body)
    assert.ok(!raw.includes('invites') && !raw.includes('@example.com'), raw)
  }
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  assert.strictEqual(db.gotrue.listCalls.length, 0)
  ok('viewer token: 403 on list, resend and the legacy form; no invite, no listing, nothing in the body')
  r = await call({ action: 'list' }, { method: 'GET' })
  assert.strictEqual(r.status, 405)
  r = parse(await handlerMod.handler(post('{not json', { token: 'admin-jwt' })))
  assert.strictEqual(r.status, 400); assert.strictEqual(r.body, 'Invalid JSON')
  ok('405 on GET and plain "Invalid JSON" 400 kept as before')

  section('2. list')
  fresh()
  r = await call({ action: 'list' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  const inv = r.body.invites
  assert.deepStrictEqual(inv.map((i) => i.user_id).slice(0, 4), [U2, U1, U3, U4])
  assert.deepStrictEqual(new Set(inv.slice(4).map((i) => i.user_id)), new Set([U4B, U5, U6]))
  assert.ok(!inv.some((i) => [U7, U8, U9].includes(i.user_id)), 'admins and null client excluded')
  assert.deepStrictEqual(r.body.counts, { total: 7, pending: 3, accepted: 2 })
  assert.strictEqual(r.body.link_ttl_minutes, 60)
  assert.ok(!('auth_users_truncated' in r.body))
  ok('order pending first by invited_at desc, then the rest with null invited_at last; admin and null-client profiles excluded; counts; ttl 60')
  const byId = Object.fromEntries(inv.map((i) => [i.user_id, i]))
  assert.deepStrictEqual(Object.keys(byId[U1]).sort(), ['accepted', 'accepted_at', 'category', 'client_id', 'client_name', 'email', 'first_invited_at', 'invited_at', 'plan', 'role', 'status', 'user_id'])
  assert.deepStrictEqual(byId[U1], { user_id: U1, client_id: 10, client_name: 'Acme Widgets Test', plan: 'growth', category: 'active', email: 'person.one@example.com', role: 'viewer', first_invited_at: T('01'), invited_at: T('05'), accepted: false, accepted_at: null, status: 'pending' })
  assert.strictEqual(byId[U2].category, null)
  assert.strictEqual(byId[U4].status, 'accepted'); assert.strictEqual(byId[U4].accepted_at, T('02'))
  assert.strictEqual(byId[U4B].status, 'accepted'); assert.strictEqual(byId[U4B].accepted_at, T('06'))
  assert.strictEqual(byId[U5].status, 'not_invited'); assert.strictEqual(byId[U5].accepted, false)
  assert.deepStrictEqual([byId[U6].status, byId[U6].email, byId[U6].accepted, byId[U6].invited_at], ['missing_user', null, false, null])
  assert.strictEqual(byId[U6].client_name, 'Foxtrot Freight Test')
  assert.strictEqual(db.gotrue.getCalls.length, 0, 'list uses listUsers, never getUserById')
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  ok('entry shape exact; statuses pending, accepted (confirmed or signed in), not_invited, missing_user; accepted_at falls back to last_sign_in_at')

  process.env.INVITE_LINK_TTL_MINUTES = '15'
  r = await call({ action: 'list' })
  assert.strictEqual(r.body.link_ttl_minutes, 15)
  process.env.INVITE_LINK_TTL_MINUTES = '-3'
  r = await call({ action: 'list' })
  assert.strictEqual(r.body.link_ttl_minutes, 60)
  delete process.env.INVITE_LINK_TTL_MINUTES
  ok('INVITE_LINK_TTL_MINUTES read when a positive integer, else 60')

  fresh()
  handlerMod.PAGING.perPage = 3
  r = await call({ action: 'list' })
  assert.strictEqual(r.status, 200)
  assert.deepStrictEqual(db.gotrue.listCalls.map((c) => c.page), [1, 2, 3, 4])
  assert.ok(db.gotrue.listCalls.every((c) => c.perPage === 3))
  assert.deepStrictEqual(r.body.counts, { total: 7, pending: 3, accepted: 2 })
  ok('paging: 10 users at 3 per page read in 4 pages, stops on the short page, same result')
  fresh()
  handlerMod.PAGING.maxPages = 1
  r = await call({ action: 'list' })
  assert.strictEqual(r.status, 200)
  assert.strictEqual(db.gotrue.listCalls.length, 1)
  assert.strictEqual(r.body.auth_users_truncated, true)
  assert.ok(r.body.invites.some((i) => i.status === 'missing_user' && i.user_id !== U6), 'past the cap reads as missing_user')
  handlerMod.PAGING.perPage = 1000
  handlerMod.PAGING.maxPages = 20
  ok('page cap: stops after maxPages and says so with auth_users_truncated')

  fresh(); refuse('user_profiles', 'select', 'relation secret driver detail')
  r = await call({ action: 'list' })
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body.code, 'read_failed')
  assert.ok(!JSON.stringify(r.body).includes('secret driver'))
  fresh(); db.gotrue.listFails = true
  r = await call({ action: 'list' })
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body.code, 'read_failed')
  assert.ok(!JSON.stringify(r.body).includes('xyz'))
  ok('a profiles read error or a listUsers error is 500 read_failed with a fixed sentence')

  section('3. resend by user_id: refusals')
  const refusals = [
    ['unknown user id', { user_id: id(999) }, 404, 'not_found'],
    ['client mismatch', { user_id: U1, client_id: 11 }, 404, 'not_found'],
    ['already accepted', { user_id: U4 }, 409, 'already_accepted'],
    ['accepted by sign in only', { user_id: U4B }, 409, 'already_accepted'],
    ['self-serve signup', { user_id: U5 }, 409, 'not_invited'],
    ['no auth user', { user_id: U6 }, 404, 'not_found'],
    ['admin profile', { user_id: U8 }, 404, 'not_found'],
    ['viewer with no client', { user_id: U9 }, 404, 'not_found'],
    ['auth user without profile', { user_id: U10 }, 404, 'not_found'],
  ]
  for (const [name, b, status, code] of refusals) {
    fresh()
    r = await call({ action: 'resend', ...b })
    assert.strictEqual(r.status, status, `${name}: ${JSON.stringify(r.body)}`)
    assert.strictEqual(r.body.code, code, name)
    assert.strictEqual(db.gotrue.inviteCalls.length, 0, name)
    assert.strictEqual(db.rows('client_events').length, 0, name)
    ok(`${name}: ${status} ${code}, no invite call, no audit row`)
  }
  fresh()
  r = await call({ action: 'resend', user_id: U4 })
  assert.ok(/Forgot password/.test(r.body.error))
  ok('the already_accepted sentence points the admin at "Forgot password"')

  section('4. resend by user_id: happy path')
  fresh()
  const before = db.gotrue.users.get(U1).invited_at
  const usersBefore = db.gotrue.users.size
  r = await call({ action: 'resend', user_id: U1.toUpperCase(), client_id: 10 })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.deepStrictEqual(db.gotrue.inviteCalls, [{ email: 'person.one@example.com', opts: { redirectTo: 'https://app.getbrandgeo.com/reset-password' } }])
  const after = db.gotrue.users.get(U1).invited_at
  assert.notStrictEqual(after, before)
  assert.deepStrictEqual(r.body, { ok: true, user_id: U1, client_id: 10, email: 'person.one@example.com', invited_at: after, audit_logged: true })
  assert.strictEqual(db.gotrue.users.size, usersBefore)
  const ev = db.rows('client_events')
  assert.strictEqual(ev.length, 1)
  assert.deepStrictEqual({ client_id: ev[0].client_id, actor: ev[0].actor, type: ev[0].type, from_plan: ev[0].from_plan, to_plan: ev[0].to_plan, meta: ev[0].meta }, { client_id: 10, actor: ADMIN_ID, type: 'invite_resent', from_plan: null, to_plan: null, meta: { source: 'resend-invite', user_id: U1, via: 'user_id' } })
  assert.ok(!JSON.stringify(ev[0]).includes('@'), 'no email in the audit row')
  assert.strictEqual(db.gotrue.listCalls.length, 0, 'resend by id does not list every user')
  ok('one invite with the stored email and the exact redirectTo; invited_at restamped; one audit row, exact shape, no email; no user created')

  fresh()
  refuse('client_events', 'insert', 'new row for relation "client_events" violates check constraint "client_events_type_check"')
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.audit_logged, false)
  assert.strictEqual(db.gotrue.inviteCalls.length, 1)
  ok('audit insert refused by the CHECK: still 200, audit_logged false')

  section('5. resend by client_id')
  fresh()
  r = await call({ action: 'resend', client_id: 10 })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.user_id, U1)
  assert.strictEqual(db.gotrue.inviteCalls.length, 1)
  assert.strictEqual(db.rows('client_events')[0].meta.via, 'client_id')
  ok('one pending viewer: resolved and sent, via client_id (the admin U8 of the same client is not a candidate)')
  for (const [name, cid, status, code] of [
    ['several pending', 12, 409, 'ambiguous'],
    ['all accepted', 13, 409, 'already_accepted'],
    ['only a self-serve signup', 14, 404, 'not_found'],
    ['only a missing user', 15, 404, 'not_found'],
    ['no such client', 999, 404, 'not_found'],
  ]) {
    fresh()
    r = await call({ action: 'resend', client_id: cid })
    assert.strictEqual(r.status, status, `${name}: ${JSON.stringify(r.body)}`)
    assert.strictEqual(r.body.code, code, name)
    assert.strictEqual(db.gotrue.inviteCalls.length, 0, name)
    ok(`${name}: ${status} ${code}, no invite call`)
  }

  section('6. Supabase errors and the race guard')
  fresh()
  db.gotrue.inviteOverride = () => ({ data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 429); assert.strictEqual(r.body.code, 'rate_limited')
  fresh()
  db.gotrue.inviteOverride = () => ({ data: { user: null }, error: { status: 400, message: 'Too many requests: rate limit hit' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 429)
  ok('status 429 or a "rate limit" message: 429 rate_limited')
  fresh()
  db.gotrue.inviteOverride = () => ({ data: { user: null }, error: { status: 422, message: 'A user with this email address has already been registered' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'already_accepted')
  ok('confirmed between check and call ("already been registered"): 409 already_accepted')
  fresh()
  db.gotrue.inviteOverride = () => ({ data: { user: null }, error: { status: 500, message: 'smtp relay secret detail' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 502); assert.strictEqual(r.body.code, 'invite_failed')
  assert.ok(!JSON.stringify(r.body).includes('secret detail'))
  assert.strictEqual(db.rows('client_events').length, 0)
  ok('any other error: 502 invite_failed, fixed sentence, no audit row')

  fresh()
  // The user is deleted between the check and the call: the default model now
  // creates a fresh user for the address, as GoTrue would.
  db.gotrue.inviteOverride = null
  const realInvite = db.auth.admin.inviteUserByEmail
  db.auth.admin.inviteUserByEmail = async (email, opts) => { db.gotrue.users.delete(U1); return realInvite(email, opts) }
  const countBefore = db.gotrue.users.size
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409, JSON.stringify(r.body)); assert.strictEqual(r.body.code, 'not_found')
  assert.strictEqual(db.gotrue.deleteCalls.length, 1)
  assert.notStrictEqual(db.gotrue.deleteCalls[0], U1)
  assert.strictEqual(db.gotrue.users.size, countBefore - 1, 'the vanished user stays gone and the new one is rolled back')
  assert.ok(!Array.from(db.gotrue.users.values()).some((u) => u.email === 'person.one@example.com'))
  assert.strictEqual(db.rows('client_events').length, 0)
  ok('race: invite returns a new id, the new user is deleted, 409 not_found, no audit row')

  fresh()
  db.gotrue.deleteFails = true
  const modelInvite = db.auth.admin.inviteUserByEmail
  db.auth.admin.inviteUserByEmail = async (email, opts) => { db.gotrue.users.delete(U1); return modelInvite(email, opts) }
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 500); assert.strictEqual(r.body.code, 'orphan_created')
  assert.strictEqual(db.gotrue.deleteCalls.length, 1)
  assert.ok(!JSON.stringify(r.body).includes(db.gotrue.deleteCalls[0]), 'the new user id is logged, not returned')
  ok('race with a failed rollback: 500 orphan_created, the id stays out of the body')

  fresh()
  db.gotrue.inviteOverride = () => ({ data: { user: { ...db.gotrue.users.get(U10) } }, error: null })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409)
  assert.strictEqual(db.gotrue.deleteCalls.length, 0)
  assert.ok(db.gotrue.users.has(U10))
  ok('a different id that plainly predates the request is never deleted (409, no delete)')

  section('7. malformed input')
  fresh()
  const bad = [
    { action: 'resend' },
    { action: 'resend', user_id: 123 },
    { action: 'resend', user_id: 'abc' },
    { action: 'resend', user_id: [U1] },
    { action: 'resend', client_id: true },
    { action: 'resend', client_id: [1] },
    { action: 'resend', client_id: '1e0' },
    { action: 'resend', client_id: ' 1 ' },
    { action: 'resend', client_id: '01' },
    { action: 'resend', client_id: 0 },
    { action: 'resend', client_id: -4 },
    { action: 'resend', client_id: 1.5 },
    { action: 'resend', client_id: 2147483648 },
    { action: 'resend', user_id: U1, client_id: 'ten' },
    { action: 'nope' },
    { action: 'LIST' },
    { email: '' },
    { email: 42 },
    { email: 'no-at-sign' },
    {},
    [],
    'null',
  ]
  for (const b of bad) {
    const raw = typeof b === 'string' ? b : JSON.stringify(b)
    r = parse(await handlerMod.handler(post(raw, { token: 'admin-jwt' })))
    assert.strictEqual(r.status, 400, raw)
    assert.strictEqual(r.body.code, 'bad_request', raw)
  }
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  assert.strictEqual(handlerMod.parsePositiveInt('12'), 12)
  assert.strictEqual(handlerMod.parsePositiveInt(12), 12)
  ok(`${bad.length} malformed bodies (ids, unknown action, bad email, non-object): 400 bad_request, no invite`)

  section('8. legacy { email }')
  fresh()
  let n0 = db.gotrue.users.size
  r = await call({ email: 'Stranger.Typo@Example.com' })
  assert.strictEqual(r.status, 404); assert.strictEqual(r.body.code, 'not_found')
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  assert.strictEqual(db.gotrue.users.size, n0)
  assert.ok(!r.body.error.toLowerCase().includes('stranger'), 'the sentence does not echo the address')
  ok('unknown address: 404, inviteUserByEmail NOT called, auth user count unchanged, address not echoed')
  fresh()
  r = await call({ email: 'orphan.ten@example.com' })
  assert.strictEqual(r.status, 404); assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  ok('auth user with no profile: 404, no invite')
  fresh()
  n0 = db.gotrue.users.size
  r = await call({ email: '  PERSON.One@Example.COM ' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.user_id, U1); assert.strictEqual(r.body.email, 'person.one@example.com')
  assert.deepStrictEqual(db.gotrue.inviteCalls, [{ email: 'person.one@example.com', opts: { redirectTo: 'https://app.getbrandgeo.com/reset-password' } }])
  assert.strictEqual(db.rows('client_events')[0].meta.via, 'email')
  assert.strictEqual(db.gotrue.users.size, n0)
  ok('different case and spaces: resolved to the stored address, which is the one sent; via email')
  fresh()
  r = await call({ email: 'wizard.admin@example.com' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body)); assert.strictEqual(r.body.user_id, U8)
  ok('legacy accepts any role (the wizard can invite an admin login)')
  fresh()
  r = await call({ email: 'person.four@example.com' })
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'already_accepted')
  r = await call({ email: 'person.five@example.com' })
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'not_invited')
  r = await call({ email: 'ops.admin@example.com' })
  assert.strictEqual(r.status, 404)
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  ok('legacy runs the same checks: accepted 409, self-serve 409, admin with no client 404, no invite')

  console.log(`\n${passed} checks passed`)
}

main().catch((e) => { console.error('FAIL:', e && e.stack ? e.stack : e); process.exit(1) })
