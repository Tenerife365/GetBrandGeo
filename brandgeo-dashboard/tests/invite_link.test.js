/**
 * invite_link.test.js: netlify/functions/_invite_link.js, the 7 day invite
 * link (docs/arch/invite-link-7-days.md section 10, items 1 to 13).
 *
 * _email.js is replaced in require.cache (the way affiliate_test_env.js
 * replaces _auth.js) by a stub whose behaviour each case sets; it records
 * every message and the call order. The Supabase side is the shared
 * in-memory fake (tests/helpers/fake_supabase_mem.js) with GoTrue-faithful
 * flags. RESEND_API_KEY is a dummy test string wherever the channel must be
 * on; no network.
 *
 * Fixtures use @example.com addresses and invented names only.
 *
 * Run: `node tests/invite_link.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const crypto = require('crypto')

const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const DUMMY_KEY = 'test-resend-key'

// ── console capture (item 10) ───────────────────────────────────────────────
const captured = []
const realLog = console.log
const realErr = console.error
const realWarn = console.warn
const capture = (...a) => { captured.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')) }
console.log = capture
console.error = capture
console.warn = capture
let passed = 0
const ok = (n) => { passed++; process.stdout.write(`  ok - ${n}\n`) }
const section = (n) => process.stdout.write(`\n${n}\n`)

// ── _email.js stub ──────────────────────────────────────────────────────────
let order = []
let sent = []
let emailImpl = async () => ({ ok: true, id: 'em_test' })
function installModule(resolvedPath, exportsObj) {
  const m = new Module(resolvedPath, null)
  m.filename = resolvedPath
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolvedPath] = m
}
installModule(require.resolve(path.join(FN, '_email.js')), {
  async sendBrandedEmail(msg) {
    sent.push(msg)
    order.push('resend')
    const r = await emailImpl(msg)
    order.push(r && r.ok ? 'resend:ok' : 'resend:fail')
    return r
  },
})

const mod = require(path.join(FN, '_invite_link.js'))
const {
  INVITE_LINK_DAYS, INVITE_TOKEN_RE, SEND_TIMEOUT_MS, generateInviteToken, hashInviteToken,
  buildInviteUrl, isAccepted, channelEnabled, channelReady, deliverInvite,
} = mod

// Everything that must never reach a log line.
const secrets = new Set()

// ── fixtures ────────────────────────────────────────────────────────────────
const USER_ID = '11111111-0000-4000-8000-000000000001'
const ADMIN_ACTOR = '22222222-0000-4000-8000-000000000002'
const EMAIL = 'invitee.one@example.com'
const DB_NOW = new Date('2026-11-13T09:00:00.000Z')
const FN_NOW = new Date('2026-11-13T12:34:56.789Z')
const T = 'client_invite_links'

function fresh({ env = 'on' } = {}) {
  order = []
  sent = []
  emailImpl = async () => ({ ok: true, id: 'em_test' })
  mod.SEND_TIMEOUT_MS = SEND_TIMEOUT_MS
  delete process.env.INVITE_LINK_CHANNEL
  if (env === 'on') process.env.RESEND_API_KEY = DUMMY_KEY
  const db = createFakeSupabase({ now: () => DB_NOW, inviteResendsPending: true, stampCreatedAt: true })
  const user = { id: USER_ID, email: EMAIL, created_at: '2026-11-01T09:00:00.000Z', invited_at: '2026-11-12T09:00:00.000Z', confirmation_token: 'token-before', email_confirmed_at: null, last_sign_in_at: null }
  db.usersById.set(USER_ID, user)
  db.seed('clients', [{ id: 10, name: 'Acme Widgets Test' }])
  const gen = db.auth.admin.generateLink
  db.auth.admin.generateLink = async (p) => { order.push('generateLink'); return gen(p) }
  const inv = db.auth.admin.inviteUserByEmail
  db.auth.admin.inviteUserByEmail = async (e, o) => { order.push('inviteUserByEmail'); return inv(e, o) }
  return db
}

const args = (over = {}) => Object.assign({
  user: { id: USER_ID, email: EMAIL },
  clientId: 10,
  clientName: 'Acme Widgets Test',
  role: 'viewer',
  source: 'resend-invite',
  actor: ADMIN_ACTOR,
  delivery: 'email',
  rotate: false,
  now: () => FN_NOW,
}, over)

const rows = (db) => db.rows(T)
const active = (db) => rows(db).filter((r) => r.revoked_at === null && r.accepted_at === null)
const tableCalls = (db) => db.calls.filter((c) => c.table === T)
const gens = (db) => db.generatedLinks.filter((g) => g.type === 'invite')
const tokenFromUrl = (url) => new URL(url).hash.replace(/^#t=/, '')
function remember(db) {
  for (const r of rows(db)) secrets.add(r.token_hash)
  for (const g of db.generatedLinks) if (g.properties) { secrets.add(g.properties.action_link); secrets.add(g.properties.email_otp); secrets.add(g.properties.hashed_token) }
  for (const m of sent) if (m.cta && m.cta.url) { secrets.add(m.cta.url); secrets.add(tokenFromUrl(m.cta.url)) }
}

async function main() {
  section('1. token and hash')
  {
    const seen = new Set()
    for (let i = 0; i < 1000; i++) {
      const t = generateInviteToken()
      assert.strictEqual(t.length, 43)
      assert.ok(INVITE_TOKEN_RE.test(t), t)
      seen.add(t)
    }
    assert.strictEqual(seen.size, 1000)
    const t = generateInviteToken()
    const h = hashInviteToken(t)
    assert.ok(/^[0-9a-f]{64}$/.test(h))
    assert.strictEqual(h, crypto.createHash('sha256').update(t).digest('hex'))
    assert.strictEqual(INVITE_LINK_DAYS, 7)
    assert.strictEqual(SEND_TIMEOUT_MS, 8000)
    assert.ok(!INVITE_TOKEN_RE.test('a'.repeat(42)) && !INVITE_TOKEN_RE.test('a'.repeat(44)) && !INVITE_TOKEN_RE.test('a'.repeat(42) + '+'))
    ok('43 chars, the shape regex, 1,000 distinct draws; hash is 64 lowercase hex equal to node sha256')
  }

  section('2. buildInviteUrl')
  {
    const t = generateInviteToken()
    const u = new URL(buildInviteUrl(t))
    assert.strictEqual(u.origin + u.pathname, 'https://app.getbrandgeo.com/invite')
    assert.strictEqual(u.search, '')
    assert.strictEqual(u.hash, `#t=${t}`)
    ok('token in the fragment only, no query')
  }

  section('3. issue supersedes, 7 days from one clock, no token stored')
  {
    const db = fresh()
    db.seed(T, [{ user_id: USER_ID, client_id: 10, token_hash: 'a'.repeat(64), source: 'onboard-client', created_at: '2026-11-10T09:00:00.000Z', expires_at: '2026-11-17T09:00:00.000Z' }])
    const r = await deliverInvite(db, args())
    assert.strictEqual(r.ok, true); assert.strictEqual(r.channel, 'brandgeo')
    const old = rows(db).find((x) => x.token_hash === 'a'.repeat(64))
    assert.strictEqual(old.revoked_reason, 'superseded'); assert.ok(old.revoked_at)
    assert.strictEqual(active(db).length, 1)
    const row = active(db)[0]
    assert.strictEqual(row.created_at, FN_NOW.toISOString(), 'created_at written by the function, not the table default')
    assert.strictEqual(Date.parse(row.expires_at) - Date.parse(row.created_at), 7 * 24 * 3600 * 1000)
    assert.strictEqual(r.expiresAt, row.expires_at); assert.strictEqual(r.issuedAt, row.created_at); assert.strictEqual(r.linkId, row.id)
    assert.strictEqual(row.source, 'resend-invite'); assert.strictEqual(row.created_by, ADMIN_ACTOR); assert.strictEqual(row.client_id, 10)
    const token = tokenFromUrl(sent[0].cta.url)
    assert.strictEqual(row.token_hash, hashInviteToken(token))
    for (const v of Object.values(row)) assert.ok(!String(v).includes(token), 'no column holds the token')
    remember(db)
    ok('earlier active row superseded; new row expires exactly 7 days after its created_at, both from args.now; only the hash stored')
  }

  section('4. viewer, email, rotate false')
  {
    const db = fresh()
    const r = await deliverInvite(db, args())
    assert.strictEqual(sent.length, 1)
    assert.strictEqual(sent[0].to, EMAIL)
    assert.strictEqual(sent[0].kind, 'transactional')
    const row = active(db)[0]
    assert.strictEqual(hashInviteToken(tokenFromUrl(sent[0].cta.url)), row.token_hash)
    assert.strictEqual(sent[0].cta.url, buildInviteUrl(tokenFromUrl(sent[0].cta.url)))
    assert.strictEqual(db.invites.length, 0, 'zero inviteUserByEmail')
    assert.strictEqual(gens(db).length, 0, 'zero generateLink')
    assert.deepStrictEqual(Object.keys(r).sort(), ['channel', 'expiresAt', 'issuedAt', 'linkId', 'ok', 'previousLinkRevoked'])
    assert.strictEqual(r.previousLinkRevoked, true)
    assert.strictEqual(r.inviteUrl, undefined)
    remember(db)
    ok('one Resend call to the stored address with the CTA equal to buildInviteUrl(token); no Supabase call; no inviteUrl')
  }

  section('5. insert error falls back')
  {
    const db = fresh()
    db.faults.push({ table: T, op: 'insert', error: { code: 'XX000', message: 'insert failed detail' } })
    const r = await deliverInvite(db, args())
    assert.strictEqual(sent.length, 0)
    assert.strictEqual(db.invites.length, 1)
    assert.strictEqual(db.invites[0].redirectTo, 'https://app.getbrandgeo.com/reset-password')
    assert.strictEqual(r.ok, true); assert.strictEqual(r.channel, 'supabase')
    assert.strictEqual(r.supabaseUser.id, USER_ID)
    assert.ok(r.issuedAt)
    ok('zero Resend calls, one inviteUserByEmail, channel supabase')
  }

  section('6. Resend skipped')
  {
    const db = fresh()
    emailImpl = async () => ({ ok: false, skipped: true, error: 'RESEND_API_KEY not set' })
    const r = await deliverInvite(db, args())
    assert.strictEqual(r.channel, 'supabase')
    assert.strictEqual(rows(db).length, 1)
    assert.strictEqual(rows(db)[0].revoked_reason, 'send_failed'); assert.ok(rows(db)[0].revoked_at)
    assert.strictEqual(db.invites.length, 1)
    assert.ok(captured.some((l) => /email not sent \(skipped/.test(l)))
    remember(db)
    ok('row revoked send_failed, one inviteUserByEmail, logged as skipped')
  }

  section('7. admin role never uses the channel')
  for (const variant of ['plain', 'kill switch', 'no key']) {
    const db = fresh()
    if (variant === 'kill switch') process.env.INVITE_LINK_CHANNEL = 'supabase'
    if (variant === 'no key') process.env.RESEND_API_KEY = ''
    const r = await deliverInvite(db, args({ role: 'admin' }))
    assert.strictEqual(tableCalls(db).length, 0, variant)
    assert.strictEqual(db.invites.length, 1, variant)
    assert.strictEqual(sent.length, 0, variant)
    assert.strictEqual(r.channel, 'supabase', variant)
    const c = await deliverInvite(db, args({ role: 'admin', delivery: 'copy' }))
    assert.strictEqual(c.ok, false); assert.strictEqual(c.code, 'link_unavailable')
    assert.strictEqual(tableCalls(db).length, 0, variant)
    ok(`admin, ${variant}: no table write, one inviteUserByEmail; copy answers link_unavailable`)
  }

  section('7b. viewer with the channel off still supersedes (re-read M2)')
  for (const variant of ['kill switch', 'no key']) {
    const db = fresh()
    db.seed(T, [{ user_id: USER_ID, client_id: 10, token_hash: 'b'.repeat(64), source: 'resend-invite', created_at: '2026-11-10T09:00:00.000Z', expires_at: '2026-11-17T09:00:00.000Z' }])
    if (variant === 'kill switch') process.env.INVITE_LINK_CHANNEL = 'supabase'
    else process.env.RESEND_API_KEY = ''
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.strictEqual(active(db).length, 0, variant)
    assert.strictEqual(rows(db).length, 1, `${variant}: no row inserted`)
    assert.strictEqual(rows(db)[0].revoked_reason, 'superseded')
    assert.strictEqual(gens(db).length, 0, variant)
    assert.strictEqual(db.invites.length, 1, variant)
    assert.strictEqual(r.channel, 'supabase')
    ok(`${variant}: earlier row superseded, nothing inserted, zero generateLink, one inviteUserByEmail`)
  }
  {
    const db = fresh()
    process.env.INVITE_LINK_CHANNEL = 'supabase'
    const mark = captured.length
    db.faults.push({ table: T, op: 'update', error: { code: '57014', message: 'canceling statement detail words' } })
    const r = await deliverInvite(db, args())
    assert.strictEqual(r.channel, 'supabase')
    assert.strictEqual(db.invites.length, 1)
    assert.ok(captured.slice(mark).some((l) => l.includes('57014')))
    assert.ok(!captured.some((l) => l.includes('detail words')))
    ok('a supersede error is logged by code only and the inviteUserByEmail still runs')
  }

  section('8. copy delivery')
  {
    const db = fresh()
    const r = await deliverInvite(db, args({ delivery: 'copy' }))
    assert.strictEqual(sent.length, 0)
    assert.strictEqual(r.ok, true); assert.strictEqual(r.channel, 'brandgeo')
    assert.strictEqual(hashInviteToken(tokenFromUrl(r.inviteUrl)), active(db)[0].token_hash)
    assert.strictEqual(db.invites.length, 0)
    secrets.add(r.inviteUrl); secrets.add(tokenFromUrl(r.inviteUrl)); remember(db)
    const db2 = fresh()
    process.env.INVITE_LINK_CHANNEL = 'supabase'
    const off = await deliverInvite(db2, args({ delivery: 'copy' }))
    assert.deepStrictEqual([off.ok, off.code], [false, 'link_unavailable'])
    assert.strictEqual(db2.invites.length, 0); assert.strictEqual(sent.length, 0)
    const db3 = fresh()
    db3.faults.push({ table: T, op: 'insert', error: { code: 'XX000', message: 'x' } })
    const bad = await deliverInvite(db3, args({ delivery: 'copy' }))
    assert.deepStrictEqual([bad.ok, bad.code], [false, 'link_unavailable'])
    assert.strictEqual(db3.invites.length, 0)
    ok('copy: no email, inviteUrl returned; channel off or an insert error answers link_unavailable with no fallback email')
  }

  section('9. unique violation twice answers busy after one retry')
  {
    const db = fresh()
    db.faults.push({ table: T, op: 'insert', times: 2, error: { code: '23505', message: 'duplicate key value' } })
    const r = await deliverInvite(db, args())
    assert.deepStrictEqual([r.ok, r.code], [false, 'busy'])
    assert.strictEqual(db.calls.filter((c) => c.table === T && c.op === 'insert').length, 2)
    assert.strictEqual(db.calls.filter((c) => c.table === T && c.op === 'update').length, 2)
    assert.strictEqual(sent.length, 0); assert.strictEqual(db.invites.length, 0)
    const db2 = fresh()
    db2.faults.push({ table: T, op: 'insert', times: 1, error: { code: '23505', message: 'duplicate key value' } })
    const r2 = await deliverInvite(db2, args())
    assert.strictEqual(r2.channel, 'brandgeo')
    remember(db2)
    ok('two 23505 answers busy after exactly one retry; one 23505 then success sends')
  }

  section('11. send timeout')
  {
    const db = fresh()
    mod.SEND_TIMEOUT_MS = 30
    emailImpl = () => new Promise(() => {})
    const mark = captured.length
    const t0 = Date.now()
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.ok(Date.now() - t0 < 2000)
    assert.strictEqual(rows(db)[0].revoked_reason, 'send_failed')
    assert.strictEqual(db.invites.length, 1)
    assert.strictEqual(gens(db).length, 0, 'no rotation on a timeout')
    assert.strictEqual(r.channel, 'supabase')
    assert.ok(captured.slice(mark).some((l) => /email not sent \(timeout/.test(l)))
    remember(db)
    ok('a send that never resolves: row send_failed after the timer, one inviteUserByEmail, no rotation')
  }

  section('12. rotation')
  {
    const db = fresh()
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.strictEqual(gens(db).length, 1)
    assert.strictEqual(gens(db)[0].email, EMAIL)
    assert.ok(order.indexOf('resend:ok') >= 0 && order.indexOf('resend:ok') < order.indexOf('generateLink'), order.join(','))
    assert.notStrictEqual(db.usersById.get(USER_ID).confirmation_token, 'token-before')
    assert.strictEqual(r.previousLinkRevoked, true); assert.strictEqual(r.channel, 'brandgeo')
    assert.strictEqual(db.invites.length, 0)
    remember(db)
    ok('email: exactly one generateLink for the stored address AFTER Resend answered ok; the user token changed; previousLinkRevoked true')
  }
  {
    const db = fresh()
    const r = await deliverInvite(db, args({ rotate: true, delivery: 'copy' }))
    assert.deepStrictEqual(order, ['generateLink'])
    assert.strictEqual(r.previousLinkRevoked, true); assert.ok(r.inviteUrl)
    assert.notStrictEqual(db.usersById.get(USER_ID).confirmation_token, 'token-before')
    secrets.add(r.inviteUrl); remember(db)
    ok('copy: one generateLink before the return, no email')
  }
  {
    const db = fresh()
    db.generateLinkOverride = async () => ({ data: { user: null, properties: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } })
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.deepStrictEqual([r.ok, r.code], [false, 'already_accepted'])
    assert.strictEqual(sent.length, 1)
    assert.deepStrictEqual(order, ['resend', 'resend:ok', 'generateLink'])
    assert.ok(rows(db)[0].accepted_at)
    remember(db)
    ok('rotation 422 email_exists: new row accepted_at, already_accepted, the one Resend call before it and none after')
  }
  {
    const db = fresh()
    db.generateLinkOverride = async () => ({ data: { user: null }, error: { status: 422, message: 'Unprocessable request' } })
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.strictEqual(r.channel, 'brandgeo'); assert.strictEqual(r.previousLinkRevoked, false)
    assert.strictEqual(rows(db)[0].accepted_at, null)
    remember(db)
    ok('a bare 422 with other wording is NOT acceptance (re-read LOW-1): brandgeo, previousLinkRevoked false')
  }
  {
    const db = fresh()
    const other = { id: '33333333-0000-4000-8000-000000000003', email: EMAIL, created_at: DB_NOW.toISOString() }
    db.generateLinkOverride = async () => ({ data: { user: other, properties: {} }, error: null })
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.deepStrictEqual([r.ok, r.code], [false, 'user_changed'])
    assert.strictEqual(r.otherUser.id, other.id)
    assert.strictEqual(rows(db)[0].revoked_reason, 'revoked'); assert.ok(rows(db)[0].revoked_at)
    remember(db)
    ok('rotation returns another user: new row revoked, user_changed carrying that user')
  }
  {
    const db = fresh()
    db.generateLinkOverride = async () => ({ data: { user: null }, error: { status: 500, message: 'internal' } })
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.strictEqual(r.channel, 'brandgeo'); assert.strictEqual(r.previousLinkRevoked, false)
    assert.strictEqual(active(db).length, 1)
    remember(db)
    ok('rotation other error: brandgeo result, previousLinkRevoked false')
  }

  section('12b. a refused email never rotates (re-read M1)')
  for (const variant of ['refused', 'timeout']) {
    const db = fresh()
    if (variant === 'refused') emailImpl = async () => ({ ok: false, error: 'Resend HTTP 422' })
    else { mod.SEND_TIMEOUT_MS = 30; emailImpl = () => new Promise(() => {}) }
    db.authBehaviour = { invite: async () => ({ data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } }) }
    const mark = captured.length
    const r = await deliverInvite(db, args({ rotate: true }))
    assert.deepStrictEqual([r.ok, r.code], [false, 'email_rate_limited'], variant)
    assert.strictEqual(gens(db).length, 0, variant)
    const u = db.usersById.get(USER_ID)
    assert.strictEqual(u.confirmation_token, 'token-before', variant)
    assert.strictEqual(u.invited_at, '2026-11-12T09:00:00.000Z', variant)
    if (variant === 'refused') assert.ok(captured.slice(mark).some((l) => l.includes('refused, status 422')))
    remember(db)
    ok(`${variant} plus a 429 fallback: email_rate_limited, zero generateLink, token and invited_at unchanged`)
  }
  {
    const db = fresh()
    emailImpl = async () => ({ ok: false, error: `The to address ${EMAIL} is not allowed` })
    const mark = captured.length
    await deliverInvite(db, args())
    assert.ok(captured.slice(mark).some((l) => l.includes('refused, status n/a')))
    assert.ok(!captured.some((l) => l.includes('not allowed')), 'Resend message text never logged (re-read LOW-10)')
    remember(db)
    ok('a Resend refusal is logged by category and status, never by its message text')
  }

  section('13. channelReady')
  {
    let db = fresh()
    assert.strictEqual(await channelReady(db, 'viewer'), true)
    assert.strictEqual(await channelReady(db, 'admin'), false)
    process.env.INVITE_LINK_CHANNEL = 'supabase'
    assert.strictEqual(channelEnabled(), false)
    assert.strictEqual(await channelReady(db, 'viewer'), false)
    delete process.env.INVITE_LINK_CHANNEL
    assert.strictEqual(channelEnabled(), true)
    process.env.RESEND_API_KEY = ''
    assert.strictEqual(await channelReady(db, 'viewer'), false)
    process.env.RESEND_API_KEY = DUMMY_KEY
    db = fresh()
    db.missingTables = { [T]: '42P01' }
    assert.strictEqual(await channelReady(db, 'viewer'), false)
    db.missingTables = { [T]: 'PGRST205' }
    assert.strictEqual(await channelReady(db, 'viewer'), false)
    db.missingTables = null
    db.faults.push({ table: T, op: 'select', error: { code: '08006', message: 'connection failure' } })
    assert.strictEqual(await channelReady(db, 'viewer'), false)
    assert.strictEqual(await channelReady(db, 'viewer'), false)
    db.faults.length = 0
    assert.strictEqual(await channelReady(db, 'viewer'), true)
    assert.strictEqual(rows(db).length, 0, 'the readiness read writes nothing')
    ok('false for admin, the kill switch, an empty key, a missing table, a read error; true otherwise')
  }
  {
    assert.strictEqual(isAccepted(null), false)
    assert.strictEqual(isAccepted({ email_confirmed_at: null, last_sign_in_at: null }), false)
    assert.strictEqual(isAccepted({ email_confirmed_at: '2026-11-01T00:00:00Z' }), true)
    assert.strictEqual(isAccepted({ last_sign_in_at: '2026-11-01T00:00:00Z' }), true)
    ok('isAccepted unchanged: confirmed or ever signed in')
  }
  {
    const db = fresh()
    const r = await deliverInvite(db, args({ user: { id: USER_ID }, delivery: 'email' }))
    assert.deepStrictEqual([r.ok, r.code], [false, 'invite_error'])
    const r2 = await deliverInvite(db, args({ delivery: 'sms' }))
    assert.deepStrictEqual([r2.ok, r2.code], [false, 'invite_error'])
    assert.strictEqual(tableCalls(db).length, 0); assert.strictEqual(db.invites.length, 0)
    ok('a call without a resolved address or with an unknown delivery touches nothing')
  }

  section('10. no secret in any log line; no dash in the email copy')
  {
    const db = fresh()
    await deliverInvite(db, args({ clientName: null }))
    await deliverInvite(db, args({ clientName: '   ' }))
    await deliverInvite(db, args())
    remember(db)
    const texts = sent.map((m) => [m.subject, m.heading, ...(m.paragraphs || []), m.footerNote, m.cta.label].join('\n'))
    // Built from code points so this file itself holds no dash character.
    const EM = String.fromCharCode(0x2014)
    const EN = String.fromCharCode(0x2013)
    const dash = new RegExp(`[${EM}${EN}]`)
    assert.ok(dash.test(`control ${EM} control`), 'positive control: the em dash scan fires')
    assert.ok(dash.test(`control ${EN} control`), 'positive control: the en dash scan fires')
    for (const t of texts) assert.ok(!dash.test(t), t)
    assert.strictEqual(sent[0].subject, 'Your BrandGEO login is ready')
    assert.strictEqual(sent[0].heading, 'Set up your BrandGEO login')
    assert.strictEqual(sent[0].paragraphs[0], 'You have been invited to BrandGEO, where you can see how AI engines describe your brand.')
    assert.strictEqual(sent[1].paragraphs[0], 'You have been invited to BrandGEO, where you can see how AI engines describe your brand.')
    assert.strictEqual(sent[2].paragraphs[0], 'You have been invited to see how AI engines describe Acme Widgets Test.')
    assert.strictEqual(sent[2].paragraphs[1], 'Choose a password to open your dashboard. This link works for 7 days.')
    assert.strictEqual(sent[2].cta.label, 'Set up my login')
    assert.strictEqual(sent[2].footerNote, 'If you did not expect this email, you can ignore it. Nothing happens until you choose a password.')
    secrets.add(EMAIL)
    secrets.delete(undefined); secrets.delete(null); secrets.delete('')
    assert.ok(secrets.size > 20, `collected ${secrets.size} secrets`)
    const all = captured.join('\n')
    assert.ok(captured.length > 10, 'logs were captured')
    for (const s of secrets) assert.ok(!all.includes(s), `a log line holds a secret (${String(s).slice(0, 6)}...)`)
    const src = require('fs').readFileSync(path.join(FN, '_invite_link.js'), 'utf8')
    assert.ok(!dash.test(src), 'no dash in _invite_link.js')
    assert.ok(!/require\([^)]*\.ts['"]\)/.test(src), 'no .ts require')
    ok(`${captured.length} captured log lines hold none of ${secrets.size} tokens, hashes, links, codes or the address; copy dash free (control fired)`)
  }

  console.log = realLog; console.error = realErr; console.warn = realWarn
  console.log(`\ninvite_link: ${passed} checks passed`)
}

main().catch((e) => {
  console.log = realLog; console.error = realErr; console.warn = realWarn
  console.error(e)
  console.error('\nlast captured log lines:\n' + captured.slice(-15).join('\n'))
  process.exit(1)
})
