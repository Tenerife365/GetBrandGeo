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

// 7 day invite link (docs/arch/invite-link-7-days.md section 10): the Resend
// sender is stubbed on the cached _email.js module, which _invite_link.js reads
// at call time. Every call is recorded with its order; emailImpl sets the answer.
const emailMod = require(path.join(FN, '_email.js'))
let sentEmails = []
let callOrder = []
let emailImpl = async () => ({ ok: true, id: 'em_test' })
emailMod.sendBrandedEmail = async (msg) => {
  sentEmails.push(msg)
  callOrder.push('resend')
  const r = await emailImpl(msg)
  callOrder.push(r && r.ok ? 'resend:ok' : 'resend:fail')
  return r
}
const DUMMY_RESEND_KEY = 'test-resend-key'
const { buildInviteUrl, INVITE_TOKEN_RE } = require(path.join(FN, '_invite_link.js'))

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
  sentEmails = []
  callOrder = []
  emailImpl = async () => ({ ok: true, id: 'em_test' })
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
    genCalls: [],
    inviteOverride: null, // (email, opts) => result, replaces the default
    genOverride: null,    // ({ type, email, options }) => result, replaces the default generateLink
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
    // generateLink (added for the 7 day link, section 10): sends nothing. An
    // accepted login answers 422 email_exists; an existing pending one gets a
    // new confirmation_token and invited_at (the rotation); an unknown address
    // CREATES a user, as GoTrue does.
    async generateLink({ type, email, options } = {}) {
      g.genCalls.push({ type, email, options })
      callOrder.push('generateLink')
      if (g.genOverride) return g.genOverride({ type, email, options })
      const props = () => ({ hashed_token: crypto.randomBytes(28).toString('hex'), verification_type: 'invite', action_link: 'https://fake.supabase/auth/v1/verify?token=x', email_otp: '123456' })
      const existing = Array.from(g.users.values()).find((u) => u.email.toLowerCase() === String(email).toLowerCase())
      if (existing && (existing.email_confirmed_at || existing.last_sign_in_at)) {
        return { data: { user: null, properties: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } }
      }
      const now = new Date().toISOString()
      if (existing) {
        existing.confirmation_token = crypto.randomBytes(16).toString('hex')
        existing.invited_at = now
        return { data: { user: { ...existing }, properties: props() }, error: null }
      }
      const u = { id: crypto.randomUUID(), email, created_at: now, invited_at: now, email_confirmed_at: null, last_sign_in_at: null, confirmation_token: crypto.randomBytes(16).toString('hex') }
      g.users.set(u.id, u)
      return { data: { user: { ...u }, properties: props() }, error: null }
    },
    async inviteUserByEmail(email, opts) {
      g.inviteCalls.push({ email, opts })
      callOrder.push('inviteUserByEmail')
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
  // Sections 1 to 8 pin today's Supabase channel byte for byte: the kill
  // switch is set and no Resend key exists (affiliate_test_env deletes it).
  process.env.INVITE_LINK_CHANNEL = 'supabase'
  delete process.env.RESEND_API_KEY
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
  // CHANGED ON PURPOSE (spec section 10): 1440, the owner's 86400 s, not 60.
  assert.strictEqual(r.body.link_ttl_minutes, 1440)
  assert.strictEqual(r.body.invite_link_days, 7)
  assert.ok(!('auth_users_truncated' in r.body))
  ok('order pending first by invited_at desc, then the rest with null invited_at last; admin and null-client profiles excluded; counts; ttl 1440; invite_link_days 7')
  const byId = Object.fromEntries(inv.map((i) => [i.user_id, i]))
  // CHANGED ON PURPOSE (spec section 10): the key set gains the three link fields.
  assert.deepStrictEqual(Object.keys(byId[U1]).sort(), ['accepted', 'accepted_at', 'category', 'client_id', 'client_name', 'email', 'first_invited_at', 'invited_at', 'link_channel', 'link_expires_at', 'link_last_pressed_at', 'plan', 'role', 'status', 'user_id'])
  assert.deepStrictEqual(byId[U1], { user_id: U1, client_id: 10, client_name: 'Acme Widgets Test', plan: 'growth', category: 'active', email: 'person.one@example.com', role: 'viewer', first_invited_at: T('01'), invited_at: T('05'), accepted: false, accepted_at: null, status: 'pending', link_channel: 'supabase', link_expires_at: T('06'), link_last_pressed_at: null })
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
  // CHANGED ON PURPOSE (spec section 10): the fallback is 1440.
  assert.strictEqual(r.body.link_ttl_minutes, 1440)
  delete process.env.INVITE_LINK_TTL_MINUTES
  ok('INVITE_LINK_TTL_MINUTES read when a positive integer, else 1440')

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
  // CHANGED ON PURPOSE (spec 6.3, additive 200 fields): channel, delivery and
  // link_expires_at (invited_at plus 24 hours on the Supabase channel).
  assert.deepStrictEqual(r.body, { ok: true, user_id: U1, client_id: 10, email: 'person.one@example.com', invited_at: after, audit_logged: true, channel: 'supabase', delivery: 'email', link_expires_at: new Date(Date.parse(after) + 1440 * 60000).toISOString() })
  assert.strictEqual(db.gotrue.users.size, usersBefore)
  assert.strictEqual(db.gotrue.genCalls.length, 0, 'the Supabase channel never rotates')
  assert.strictEqual(sentEmails.length, 0, 'no Resend email on the Supabase channel')
  const ev = db.rows('client_events')
  assert.strictEqual(ev.length, 1)
  // CHANGED ON PURPOSE (spec section 10): the audit meta gains channel and delivery.
  assert.deepStrictEqual({ client_id: ev[0].client_id, actor: ev[0].actor, type: ev[0].type, from_plan: ev[0].from_plan, to_plan: ev[0].to_plan, meta: ev[0].meta }, { client_id: 10, actor: ADMIN_ID, type: 'invite_resent', from_plan: null, to_plan: null, meta: { source: 'resend-invite', user_id: U1, via: 'user_id', channel: 'supabase', delivery: 'email' } })
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

  await linkSections()

  console.log(`\n${passed} checks passed`)
}

// ── 7 day invite link (docs/arch/invite-link-7-days.md 6.3 and section 10) ──
const HOUR = 3600 * 1000
const DAY = 24 * HOUR
const LINKS = 'client_invite_links'
const activeLinks = () => db.rows(LINKS).filter((r) => r.revoked_at === null && r.accepted_at === null)
function channelOn() {
  delete process.env.INVITE_LINK_CHANNEL
  process.env.RESEND_API_KEY = DUMMY_RESEND_KEY
}
function channelOff() {
  process.env.INVITE_LINK_CHANNEL = 'supabase'
  delete process.env.RESEND_API_KEY
}
// A different user GoTrue answers with, stored so a profile can be attached.
function strangerUser(createdAt) {
  const u = { id: crypto.randomUUID(), email: 'person.one@example.com', created_at: createdAt, invited_at: createdAt, email_confirmed_at: null, last_sign_in_at: null }
  db.gotrue.users.set(u.id, u)
  return u
}

async function linkSections() {
  let r

  section('9. list: link fields (spec 6.3)')
  channelOn()
  fresh()
  db.gotrue.users.get(U1).invited_at = new Date(Date.now() - 2 * HOUR).toISOString()
  db.gotrue.users.get(U2).invited_at = new Date(Date.now() - 25 * HOUR).toISOString()
  r = await call({ action: 'list' })
  let by = Object.fromEntries(r.body.invites.map((i) => [i.user_id, i]))
  assert.strictEqual(by[U1].link_channel, 'supabase')
  assert.ok(Date.parse(by[U1].link_expires_at) > Date.now(), 'invited 2 h ago: still valid')
  assert.ok(Date.parse(by[U2].link_expires_at) < Date.now(), 'invited 25 h ago: expired')
  assert.strictEqual(by[U5].link_expires_at, null, 'no invited_at: no estimate')
  ok('TTL env unset: a Supabase link invited 2 h ago is in the future, one invited 25 h ago in the past')

  fresh()
  db.seed(LINKS, [
    { user_id: U1, client_id: 10, token_hash: 'a'.repeat(64), source: 'resend-invite', created_at: '2026-11-10T08:00:00.000Z', expires_at: '2026-11-17T08:00:00.000Z', last_redeemed_at: '2026-11-10T09:30:00.000Z', redeem_count: 1 },
    { user_id: U2, client_id: 12, token_hash: 'b'.repeat(64), source: 'onboard-client', created_at: '2026-10-01T08:00:00.000Z', expires_at: '2026-10-08T08:00:00.000Z' },
    { user_id: U3, client_id: 12, token_hash: 'c'.repeat(64), source: 'resend-invite', created_at: '2026-11-10T08:00:00.000Z', expires_at: '2026-11-17T08:00:00.000Z', revoked_at: '2026-11-10T08:05:00.000Z', revoked_reason: 'superseded' },
  ])
  r = await call({ action: 'list' })
  assert.strictEqual(r.status, 200)
  by = Object.fromEntries(r.body.invites.map((i) => [i.user_id, i]))
  assert.deepStrictEqual([by[U1].link_channel, by[U1].link_expires_at, by[U1].link_last_pressed_at, by[U1].invited_at], ['brandgeo', '2026-11-17T08:00:00.000Z', '2026-11-10T09:30:00.000Z', '2026-11-10T08:00:00.000Z'])
  assert.deepStrictEqual([by[U2].link_channel, by[U2].link_expires_at, by[U2].link_last_pressed_at, by[U2].invited_at], ['brandgeo', '2026-10-08T08:00:00.000Z', null, '2026-10-01T08:00:00.000Z'])
  assert.deepStrictEqual([by[U3].link_channel, by[U3].invited_at], ['supabase', T('03')], 'a revoked row is not active')
  assert.ok(!JSON.stringify(r.body).includes('a'.repeat(64)), 'no hash in the list')
  ok('an active row wins: link_channel brandgeo, its expires_at (an EXPIRED active row too), last press, invited_at from the row; a revoked row is ignored')

  for (const code of ['42P01', 'PGRST205']) {
    fresh()
    db.missingTables = { [LINKS]: code }
    r = await call({ action: 'list' })
    assert.strictEqual(r.status, 200, code)
    assert.ok(r.body.invites.every((i) => i.link_channel === 'unknown' && i.link_expires_at === null && i.link_last_pressed_at === null), code)
    assert.strictEqual(r.body.invites.find((i) => i.user_id === U1).invited_at, T('05'))
  }
  ok('a link table read error: still 200, every row link_channel unknown with null expiry')

  section('10. resend on the BrandGEO channel')
  fresh()
  const tokenBefore = db.gotrue.users.get(U1).confirmation_token
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.channel, 'brandgeo')
  assert.strictEqual(r.body.delivery, 'email')
  assert.strictEqual(r.body.previous_link_revoked, true)
  assert.strictEqual(Date.parse(r.body.link_expires_at) - Date.parse(r.body.invited_at), 7 * DAY)
  assert.ok(!('invite_url' in r.body))
  assert.ok(!/no-store/.test(String(r.headers['Cache-Control'] || '')), 'only the copy answer carries no-store')
  assert.strictEqual(sentEmails.length, 1)
  assert.strictEqual(sentEmails[0].to, 'person.one@example.com')
  assert.strictEqual(sentEmails[0].cta.url.startsWith('https://app.getbrandgeo.com/invite#t='), true)
  assert.deepStrictEqual(callOrder, ['resend', 'resend:ok', 'generateLink'], 'the rotation runs after Resend accepted the email')
  assert.deepStrictEqual(db.gotrue.genCalls.map((c) => [c.type, c.email]), [['invite', 'person.one@example.com']])
  assert.notStrictEqual(db.gotrue.users.get(U1).confirmation_token, tokenBefore, 'the earlier Supabase link is dead')
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  assert.strictEqual(activeLinks().length, 1)
  const ev10 = db.rows('client_events')
  assert.deepStrictEqual(ev10[0].meta, { source: 'resend-invite', user_id: U1, via: 'user_id', channel: 'brandgeo', delivery: 'email', invite_link_id: activeLinks()[0].id })
  assert.ok(!JSON.stringify(ev10[0]).includes('@'), 'no address in the audit row')
  assert.ok(!JSON.stringify(ev10[0]).includes(activeLinks()[0].token_hash), 'no hash in the audit row')
  ok('email: channel brandgeo, 7 days, previous_link_revoked true, one Resend email to the stored address, then one rotation; audit meta with channel, delivery and the link id')

  r = await call({ action: 'list' })
  by = Object.fromEntries(r.body.invites.map((i) => [i.user_id, i]))
  assert.strictEqual(by[U1].link_channel, 'brandgeo')
  ok('the next list reads the row just issued')

  fresh()
  r = await call({ action: 'resend', user_id: U1 })
  const firstId = activeLinks()[0].id
  r = await call({ action: 'resend', client_id: 10 })
  assert.strictEqual(r.status, 200)
  assert.strictEqual(activeLinks().length, 1)
  assert.notStrictEqual(activeLinks()[0].id, firstId)
  assert.strictEqual(db.rows(LINKS).find((x) => x.id === firstId).revoked_reason, 'superseded')
  ok('a second resend supersedes the first link')

  section('11. copy delivery')
  fresh()
  r = await call({ action: 'resend', user_id: U1, delivery: 'copy' })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.headers['Cache-Control'], 'no-store')
  assert.strictEqual(r.body.delivery, 'copy'); assert.strictEqual(r.body.channel, 'brandgeo')
  assert.ok(typeof r.body.invite_url === 'string' && r.body.invite_url.startsWith('https://app.getbrandgeo.com/invite#t='))
  assert.ok(INVITE_TOKEN_RE.test(r.body.invite_url.split('#t=')[1]))
  assert.strictEqual(r.body.invite_url, buildInviteUrl(r.body.invite_url.split('#t=')[1]))
  assert.strictEqual(sentEmails.length, 0, 'copy sends nothing')
  assert.strictEqual(db.gotrue.inviteCalls.length, 0)
  assert.strictEqual(db.gotrue.genCalls.length, 1, 'copy rotates the earlier Supabase link too')
  assert.strictEqual(db.rows('client_events')[0].meta.delivery, 'copy')
  assert.ok(!JSON.stringify(db.rows('client_events')[0]).includes('#t='), 'no link in the audit row')
  ok('copy: invite_url returned once with Cache-Control no-store, no email, one rotation, audited as delivery copy')

  fresh()
  r = await call({ action: 'resend', client_id: 10, delivery: 'copy' })
  assert.strictEqual(r.status, 200); assert.ok(r.body.invite_url)
  ok('copy by client_id is allowed')

  fresh()
  for (const b of [{ email: 'person.one@example.com', delivery: 'copy' }, { email: 'person.one@example.com', delivery: 'sms' }, { action: 'resend', user_id: U1, delivery: 'sms' }, { action: 'resend', user_id: U1, delivery: null }]) {
    r = await call(b)
    assert.strictEqual(r.status, 400, JSON.stringify(b)); assert.strictEqual(r.body.code, 'bad_request', JSON.stringify(b))
  }
  assert.strictEqual(sentEmails.length + db.gotrue.inviteCalls.length + db.gotrue.genCalls.length, 0)
  r = await call({ email: 'person.one@example.com', delivery: 'email' })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.delivery, 'email')
  ok('legacy { email } with delivery copy (or any unknown delivery) is 400 and sends nothing; delivery email is accepted')

  section('12. error mapping and fallbacks')
  fresh()
  channelOff()
  r = await call({ action: 'resend', user_id: U1, delivery: 'copy' })
  assert.strictEqual(r.status, 503); assert.strictEqual(r.body.code, 'link_unavailable')
  assert.strictEqual(db.gotrue.inviteCalls.length, 0); assert.strictEqual(db.rows(LINKS).length, 0)
  channelOn()
  ok('copy with the kill switch: 503 link_unavailable, nothing sent or written')

  fresh()
  db.faults.push({ table: LINKS, op: 'insert', times: 2, error: { code: '23505', message: 'duplicate key value violates unique constraint "client_invite_links_one_active"' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'busy')
  assert.strictEqual(sentEmails.length, 0); assert.strictEqual(db.rows('client_events').length, 0)
  ok('two unique clashes: 409 busy, no email, no audit row')

  fresh()
  emailImpl = async () => ({ ok: false, error: 'Resend HTTP 422: refused for person.one@example.com' })
  const tok12 = db.gotrue.users.get(U1).confirmation_token
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 200, JSON.stringify(r.body))
  assert.strictEqual(r.body.channel, 'supabase')
  assert.ok(!('previous_link_revoked' in r.body))
  assert.strictEqual(db.gotrue.inviteCalls.length, 1); assert.strictEqual(db.gotrue.genCalls.length, 0, 'no rotation by us on the fallback')
  assert.strictEqual(db.gotrue.users.get(U1).confirmation_token, tok12)
  assert.strictEqual(db.rows(LINKS)[0].revoked_reason, 'send_failed')
  assert.strictEqual(db.rows('client_events')[0].meta.channel, 'supabase')
  ok('Resend refuses: the Supabase invite goes out, channel supabase, no rotation, row send_failed')

  fresh()
  emailImpl = async () => ({ ok: false, error: 'Resend HTTP 500' })
  db.gotrue.inviteOverride = () => ({ data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 429); assert.strictEqual(r.body.code, 'rate_limited')
  assert.strictEqual(db.gotrue.genCalls.length, 0)
  ok('Resend refuses and the fallback is rate limited: 429 rate_limited, nothing rotated')

  fresh()
  db.gotrue.genOverride = () => ({ data: { user: null, properties: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409); assert.strictEqual(r.body.code, 'already_accepted')
  assert.ok(db.rows(LINKS)[0].accepted_at, 'the new row is stamped accepted')
  ok('rotation answers 422 email_exists: 409 already_accepted, row accepted')

  fresh()
  db.gotrue.genOverride = () => ({ data: { user: null, properties: null }, error: { status: 500, message: 'gotrue down' } })
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 200); assert.strictEqual(r.body.channel, 'brandgeo'); assert.strictEqual(r.body.previous_link_revoked, false)
  ok('rotation fails otherwise: still 200 brandgeo, previous_link_revoked false')

  section('13. the tightened race guard (section 4: 60 s, no profile, parseable created_at)')
  // user_changed: the rotation answers another user.
  fresh()
  let other = null
  db.gotrue.genOverride = () => { db.gotrue.users.delete(U1); other = strangerUser(new Date().toISOString()); return { data: { user: { ...other } }, error: null } }
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409, JSON.stringify(r.body)); assert.strictEqual(r.body.code, 'not_found')
  assert.deepStrictEqual(db.gotrue.deleteCalls, [other.id])
  assert.strictEqual(db.rows(LINKS)[0].revoked_reason, 'revoked')
  assert.strictEqual(db.rows('client_events').length, 0)
  ok('user_changed with a fresh profile-less user: that user is deleted, 409 not_found, row revoked, no audit row')

  fresh()
  db.gotrue.genOverride = () => { other = strangerUser(new Date().toISOString()); db.seed('user_profiles', [{ id: other.id, client_id: 99, role: 'viewer' }]); return { data: { user: { ...other } }, error: null } }
  r = await call({ action: 'resend', user_id: U1 })
  assert.strictEqual(r.status, 409); assert.strictEqual(db.gotrue.deleteCalls.length, 0)
  ok('user_changed with a user that has a profile: never deleted')

  channelOff()
  const raceCase = async (createdAt, withProfile) => {
    fresh()
    let o = null
    db.gotrue.inviteOverride = () => {
      o = strangerUser(createdAt)
      if (withProfile) db.seed('user_profiles', [{ id: o.id, client_id: 99, role: 'viewer' }])
      return { data: { user: { ...o } }, error: null }
    }
    const res = await call({ action: 'resend', user_id: U1 })
    assert.strictEqual(res.status, 409, JSON.stringify(res.body))
    return { deleted: db.gotrue.deleteCalls.includes(o.id) }
  }
  assert.strictEqual((await raceCase(new Date(Date.now() - 5 * 60000).toISOString(), false)).deleted, false, '5 minutes old: kept (the old 10 minute window deleted it)')
  assert.strictEqual((await raceCase(new Date(Date.now() - 30000).toISOString(), false)).deleted, true, '30 s old, no profile: deleted')
  assert.strictEqual((await raceCase(new Date().toISOString(), true)).deleted, false, 'fresh but with a profile: kept')
  assert.strictEqual((await raceCase('not a date', false)).deleted, false, 'unparseable created_at: kept (the old guard deleted it)')
  assert.strictEqual((await raceCase(undefined, false)).deleted, false, 'no created_at: kept')
  channelOn()
  ok('Supabase channel race: 60 s replaces the 10 minute window, a profile or an unparseable created_at is never deleted')

  section('14. no secret in a log line')
  {
    const lines = []
    const realLog = console.log
    const realErr = console.error
    console.log = (...a) => lines.push(a.map(String).join(' '))
    console.error = (...a) => lines.push(a.map(String).join(' '))
    try {
      fresh()
      await call({ action: 'resend', user_id: U1 })
      await call({ action: 'resend', user_id: U1, delivery: 'copy' })
      emailImpl = async () => ({ ok: false, error: 'Resend HTTP 422: refused for person.one@example.com' })
      await call({ action: 'resend', user_id: U1 })
      await call({ action: 'list' })
    } finally {
      console.log = realLog
      console.error = realErr
    }
    const secrets = db.rows(LINKS).map((x) => x.token_hash)
    for (const m of sentEmails) secrets.push(m.cta.url, m.cta.url.split('#t=')[1])
    assert.ok(lines.length > 0)
    for (const l of lines) {
      assert.ok(!l.includes('@example.com'), l)
      for (const s of secrets) assert.ok(!l.includes(s), 'a token or hash reached a log line')
    }
    ok(`${lines.length} log lines: no address, token or hash`)
  }
  channelOff()
}

main().catch((e) => { console.error('FAIL:', e && e.stack ? e.stack : e); process.exit(1) })
