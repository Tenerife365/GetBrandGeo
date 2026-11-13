/**
 * invite_redeem.test.js: netlify/functions/invite-redeem.js, the public
 * Continue of /invite (docs/arch/invite-link-7-days.md sections 4, 6.2 and
 * 10). Every row of the 6.2 table, the race guard, the rate limits, the
 * headers and the no-log rule.
 *
 * _auth.js is replaced through tests/helpers/affiliate_test_env.js (only its
 * corsHeaders and ALLOWED_ORIGINS are used here); the handler is called
 * through its exported handle(event, { supabase, now }) with the in-memory
 * fake, so no network and no env Supabase client.
 *
 * Fixtures use @example.com addresses and invented names only.
 *
 * Run: `node tests/invite_redeem.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const path = require('path')

const { installAuthMock, post, parse } = require('./helpers/affiliate_test_env')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

installAuthMock({ tokens: {} })
process.env.RESEND_API_KEY = 'test-resend-key'   // affiliate_test_env deletes it; nothing here sends

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const { handle } = require(path.join(FN, 'invite-redeem.js'))
const { generateInviteToken, hashInviteToken } = require(path.join(FN, '_invite_link.js'))

// ── console capture ─────────────────────────────────────────────────────────
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

// ── fixtures ────────────────────────────────────────────────────────────────
const NOW = new Date('2026-11-13T12:00:00.000Z')
const T = 'client_invite_links'
const U1 = '11111111-0000-4000-8000-000000000001'
const EMAIL = 'invitee.one@example.com'
const secrets = new Set([EMAIL])
const responses = []

let clock = NOW.getTime()
const now = () => new Date(clock)

function fresh({ row = {}, user = {}, profile = {} } = {}) {
  clock = NOW.getTime()
  delete process.env.INVITE_REDEEM_DISABLED
  const db = createFakeSupabase({ now, inviteResendsPending: true, stampCreatedAt: true })
  db.seed('clients', [{ id: 10, name: 'Acme Widgets Test' }, { id: 11, name: 'Borealis Bakery Test' }])
  db.seed('user_profiles', [Object.assign({ id: U1, client_id: 10, role: 'viewer' }, profile)])
  db.usersById.set(U1, Object.assign({ id: U1, email: EMAIL, created_at: '2026-11-01T09:00:00.000Z', invited_at: '2026-11-12T09:00:00.000Z', confirmation_token: 'token-before', email_confirmed_at: null, last_sign_in_at: null }, user))
  const token = generateInviteToken()
  const hash = hashInviteToken(token)
  secrets.add(token); secrets.add(hash)
  db.seed(T, [Object.assign({
    user_id: U1, client_id: 10, token_hash: hash, source: 'resend-invite',
    created_at: '2026-11-12T12:00:00.000Z', expires_at: '2026-11-19T12:00:00.000Z',
  }, row)])
  // rate check recorder and switch
  db.rateArgs = []
  db.rateFalse = null
  const rpc = db.rpc
  db.rpc = async (name, a) => {
    if (name === 'affiliate_rate_check') {
      db.rateArgs.push(a)
      if (db.rateFalse && db.rateFalse(a.p_key)) { db.calls.push({ rpc: name }); return { data: false, error: null } }
    }
    return rpc(name, a)
  }
  return { db, token, hash }
}

const linkRow = (db) => db.rows(T)[0]
const gens = (db) => db.generatedLinks.filter((g) => g.type === 'invite')
const tableReads = (db) => db.calls.filter((c) => c.table)
function remember(db) {
  for (const g of db.generatedLinks) if (g.properties) { secrets.add(g.properties.action_link); secrets.add(g.properties.email_otp); secrets.add(g.properties.hashed_token) }
}

async function redeem(db, body, opts = {}) {
  const ev = post(typeof body === 'string' ? body : JSON.stringify(body), opts)
  if (opts.method) ev.httpMethod = opts.method
  const res = parse(await handle(ev, { supabase: db, now }))
  responses.push(res)
  remember(db)
  return res
}
const expectFail = (r, status, code) => {
  assert.strictEqual(r.status, status, JSON.stringify(r.body))
  assert.deepStrictEqual(r.body, { ok: false, code })
}

async function main() {
  section('1. transport: OPTIONS, method, Origin, body shape')
  {
    const { db, token } = fresh()
    let r = await redeem(db, { token }, { method: 'OPTIONS' })
    assert.strictEqual(r.status, 204)
    r = await redeem(db, { token }, { method: 'GET' })
    assert.strictEqual(r.status, 405); assert.strictEqual(r.body, 'Method Not Allowed')
    r = await redeem(db, { token }, { origin: 'https://evil.example' })
    assert.strictEqual(r.status, 403); assert.ok(r.body.error)
    for (const bad of ['{not json', '[]', '"x"', JSON.stringify({}), JSON.stringify({ token: 5 }), JSON.stringify({ token: 'a'.repeat(42) }), JSON.stringify({ token: 'a'.repeat(44) }), JSON.stringify({ token: 'a'.repeat(42) + '+' })]) {
      r = await redeem(db, bad)
      expectFail(r, 400, 'bad_request')
    }
    assert.strictEqual(tableReads(db).length, 0); assert.strictEqual(db.rateArgs.length, 0)
    r = await redeem(db, { token }, { origin: null })
    assert.strictEqual(r.status, 200, 'no Origin header is allowed (same as _auth.js)')
    ok('OPTIONS 204, GET 405, foreign Origin 403, every malformed body 400 with no read; a missing Origin passes')
  }

  section('2. kill switch')
  {
    const { db, token } = fresh()
    process.env.INVITE_REDEEM_DISABLED = '1'
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    assert.strictEqual(db.calls.length, 0, 'zero table reads and zero rpc')
    expectFail(await redeem(db, { token: 'short' }), 400, 'bad_request')
    delete process.env.INVITE_REDEEM_DISABLED
    ok('INVITE_REDEEM_DISABLED=1: 503 after the shape check, before any read')
  }

  section('3. happy path, not consumed on mint')
  {
    const { db, token } = fresh()
    const r = await redeem(db, { token, email: 'someone.else@example.com' })
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.deepStrictEqual(Object.keys(r.body).sort(), ['ok', 'token_hash', 'type'])
    assert.strictEqual(r.body.ok, true); assert.strictEqual(r.body.type, 'invite')
    assert.strictEqual(gens(db).length, 1)
    assert.strictEqual(gens(db)[0].email, EMAIL, 'the STORED address, never the request')
    assert.strictEqual(r.body.token_hash, gens(db)[0].properties.hashed_token)
    assert.ok(/^[A-Za-z0-9_-]{16,256}$/.test(r.body.token_hash))
    assert.strictEqual(linkRow(db).redeem_count, 1)
    assert.strictEqual(linkRow(db).last_redeemed_at, NOW.toISOString())
    assert.strictEqual(linkRow(db).accepted_at, null); assert.strictEqual(linkRow(db).revoked_at, null)
    assert.strictEqual(db.deletedUsers.length, 0)
    clock += 1000
    const r2 = await redeem(db, { token })
    assert.strictEqual(r2.status, 200)
    assert.notStrictEqual(r2.body.token_hash, r.body.token_hash)
    assert.strictEqual(linkRow(db).redeem_count, 2)
    ok('200 with exactly ok, token_hash, type; generateLink for the stored address; count bumped; a second press also 200')
  }

  section('4. unknown, revoked, send_failed, table missing')
  {
    const { db } = fresh()
    const other = generateInviteToken(); secrets.add(other)
    expectFail(await redeem(db, { token: other }), 404, 'invalid')
    assert.strictEqual(gens(db).length, 0)
    assert.ok(captured.some((l) => l === '[invite-redeem] unknown token'))
    ok('unknown token: 404 invalid, no generateLink, logged as "unknown token"')
  }
  for (const reason of ['send_failed', 'revoked']) {
    const { db, token } = fresh({ row: { revoked_at: '2026-11-12T13:00:00.000Z', revoked_reason: reason } })
    expectFail(await redeem(db, { token }), 404, 'invalid')
    assert.strictEqual(gens(db).length, 0)
    ok(`${reason} row: 404 invalid`)
  }
  for (const code of ['42P01', 'PGRST205']) {
    const { db, token } = fresh()
    db.missingTables = { [T]: code }
    expectFail(await redeem(db, { token }), 404, 'invalid')
    ok(`table missing (${code}): 404 invalid`)
  }
  {
    const { db, token } = fresh()
    db.faults.push({ table: T, op: 'select', error: { code: '08006', message: 'connection failure' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    ok('another lookup error: 503 unavailable')
  }

  section('5. replaced, expired, used')
  {
    const { db, token } = fresh({ row: { revoked_at: '2026-11-12T13:00:00.000Z', revoked_reason: 'superseded', expires_at: '2026-11-12T12:30:00.000Z' } })
    expectFail(await redeem(db, { token }), 410, 'replaced')
    ok('superseded AND expired answers replaced (checked before expiry)')
  }
  {
    const { db, token } = fresh({ row: { expires_at: NOW.toISOString() } })
    expectFail(await redeem(db, { token }), 410, 'expired')
    assert.strictEqual(gens(db).length, 0)
    const { db: db2, token: t2 } = fresh({ row: { expires_at: new Date(NOW.getTime() + 1).toISOString() } })
    assert.strictEqual((await redeem(db2, { token: t2 })).status, 200)
    ok('expired at exactly expires_at (strict); one millisecond before still redeems')
  }
  {
    const { db, token } = fresh({ row: { accepted_at: '2026-11-12T15:00:00.000Z' } })
    expectFail(await redeem(db, { token }), 410, 'used')
    assert.strictEqual(gens(db).length, 0)
    ok('accepted_at set: 410 used')
  }
  for (const field of ['email_confirmed_at', 'last_sign_in_at']) {
    const { db, token } = fresh({ user: { [field]: '2026-11-12T15:00:00.000Z' } })
    expectFail(await redeem(db, { token }), 410, 'used')
    assert.strictEqual(gens(db).length, 0)
    assert.strictEqual(linkRow(db).accepted_at, NOW.toISOString())
    ok(`accepted user (${field}): 410 used and accepted_at stamped, no generateLink`)
  }

  section('6. user and profile binding')
  {
    const { db, token } = fresh()
    db.usersById.delete(U1)
    expectFail(await redeem(db, { token }), 404, 'invalid')
    assert.strictEqual(gens(db).length, 0)
    ok('user missing: 404 invalid')
  }
  for (const [label, profile] of [['admin profile', { role: 'admin' }], ['other client', { client_id: 11 }], ['no client', { client_id: null }]]) {
    const { db, token } = fresh({ profile })
    expectFail(await redeem(db, { token }), 404, 'invalid')
    assert.strictEqual(gens(db).length, 0)
    ok(`${label}: 404 invalid`)
  }
  {
    const { db, token } = fresh()
    db.tables.user_profiles = []
    expectFail(await redeem(db, { token }), 404, 'invalid')
    ok('no profile: 404 invalid')
  }
  {
    const { db, token } = fresh()
    const get = db.auth.admin.getUserById
    db.auth.admin.getUserById = async () => ({ data: { user: null }, error: { status: 500, message: 'gotrue down' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    db.auth.admin.getUserById = get
    db.faults.push({ table: 'user_profiles', op: 'select', error: { code: '08006', message: 'x' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    ok('getUserById error or profile read error: 503 unavailable')
  }

  section('7. generateLink answers')
  {
    // The person accepts between our read and the mint: GoTrue refuses with
    // 422 email_exists, the re-read shows the confirmed login.
    const { db, token } = fresh()
    db.authBehaviour = { beforeInvite: async () => { db.usersById.get(U1).email_confirmed_at = NOW.toISOString() } }
    expectFail(await redeem(db, { token }), 410, 'used')
    assert.strictEqual(linkRow(db).accepted_at, NOW.toISOString())
    ok('generateLink 422 email_exists for a login that is now confirmed: 410 used, accepted_at stamped')
  }
  {
    const { db, token } = fresh()
    db.generateLinkOverride = async () => ({ data: { user: null }, error: { status: 422, code: 'email_exists', message: 'A user with this email address has already been registered' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    assert.strictEqual(linkRow(db).accepted_at, null)
    db.generateLinkOverride = async () => ({ data: { user: null }, error: { status: 422, message: 'Unprocessable request' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    assert.strictEqual(linkRow(db).accepted_at, null)
    ok('422 but the re-read shows no acceptance, or a bare 422: 503, accepted_at NOT stamped (re-read LOW-1)')
  }
  {
    const { db, token } = fresh()
    db.generateLinkOverride = async () => ({ data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } })
    expectFail(await redeem(db, { token }), 429, 'rate_limited')
    db.generateLinkOverride = async () => ({ data: { user: null }, error: { status: 500, message: 'internal' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    assert.strictEqual(linkRow(db).redeem_count, 0, 'token kept, nothing stamped')
    ok('generateLink 429: 429 rate_limited; another error: 503 unavailable, row untouched')
  }
  for (const vt of ['magiclink', 'recovery', undefined]) {
    const { db, token } = fresh()
    db.generateLinkOverride = async () => ({ data: { user: { id: U1, email: EMAIL }, properties: { hashed_token: 'f'.repeat(56), verification_type: vt, action_link: 'https://fake.supabase/x', email_otp: '123456' } }, error: null })
    const r = await redeem(db, { token })
    expectFail(r, 503, 'unavailable')
    assert.ok(!JSON.stringify(r.body).includes('f'.repeat(56)))
    ok(`verification_type ${vt}: 503 unavailable, nothing of the response returned`)
  }
  {
    const { db, token } = fresh()
    db.generateLinkOverride = async () => ({ data: { user: { id: U1, email: EMAIL }, properties: { hashed_token: 'bad hash!', verification_type: 'invite' } }, error: null })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    ok('a token_hash outside the authLinkState shape: 503')
  }
  {
    const { db, token } = fresh()
    db.generateLinkOverride = async () => ({ data: { user: { id: U1, email: EMAIL }, properties: { hashed_token: 'e'.repeat(56), verification_type: 'signup' } }, error: null })
    const r = await redeem(db, { token })
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.type, 'signup')
    ok('verification_type signup: 200 with type signup')
  }

  section('8. conditional update hits zero rows (re-read LOW-4)')
  {
    const { db, token } = fresh()
    db.faults.push({ table: T, op: 'update', times: 1, before: (d) => { const r = d.rows(T)[0]; r.revoked_at = NOW.toISOString(); r.revoked_reason = 'superseded' } })
    const r = await redeem(db, { token })
    expectFail(r, 410, 'replaced')
    assert.ok(!JSON.stringify(r.body).includes(gens(db)[0].properties.hashed_token), 'the minted hash is never returned')
    assert.strictEqual(gens(db).length, 2, 'a second generateLink rotates the minted token away')
    assert.strictEqual(linkRow(db).redeem_count, 0)
    ok('superseded between read and update: 410 replaced, minted hash not returned, generateLink called twice')
  }
  {
    const { db, token } = fresh()
    db.faults.push({ table: T, op: 'update', times: 1, before: (d) => { const r = d.rows(T)[0]; r.revoked_at = NOW.toISOString(); r.revoked_reason = 'revoked' } })
    expectFail(await redeem(db, { token }), 404, 'invalid')
    assert.strictEqual(gens(db).length, 2)
    ok('revoked between read and update: 404 invalid, generateLink twice')
  }
  {
    const { db, token } = fresh()
    db.faults.push({ table: T, op: 'update', times: 1, before: (d) => { d.rows(T)[0].accepted_at = NOW.toISOString() } })
    expectFail(await redeem(db, { token }), 410, 'used')
    assert.strictEqual(gens(db).length, 2)
    ok('accepted between read and update: 410 used, generateLink twice')
  }
  {
    const { db, token } = fresh()
    db.faults.push({ table: T, op: 'update', times: 1, before: (d) => { d.tables[T] = [] } })
    expectFail(await redeem(db, { token }), 404, 'invalid')
    assert.strictEqual(gens(db).length, 1, 'row gone: no second generateLink')
    ok('row gone between read and update: 404 invalid, no second generateLink')
  }
  {
    const { db, token } = fresh()
    db.faults.push({ table: T, op: 'update', times: 1, before: (d) => { d.rows(T)[0].revoked_at = NOW.toISOString(); d.rows(T)[0].revoked_reason = 'superseded' } })
    // The first select (the lookup) takes the no-op entry; the second (the
    // re-read) takes the error entry.
    db.faults.push({ table: T, op: 'select', times: 1 })
    db.faults.push({ table: T, op: 'select', times: 1, error: { code: '08006', message: 'x' } })
    expectFail(await redeem(db, { token }), 503, 'unavailable')
    assert.strictEqual(gens(db).length, 1, 're-read error: no second generateLink')
    ok('re-read error after a zero-row update: 503, no second generateLink')
  }
  {
    const { db, token } = fresh()
    const OTHER2 = '55555555-0000-4000-8000-000000000005'
    db.faults.push({ table: T, op: 'update', times: 1, before: (d) => { const r = d.rows(T)[0]; r.revoked_at = NOW.toISOString(); r.revoked_reason = 'superseded' } })
    let n = 0
    db.authBehaviour = {
      invite: async () => {
        n++
        if (n === 1) return undefined
        const u = { id: OTHER2, email: EMAIL, created_at: NOW.toISOString() }
        db.usersById.set(OTHER2, u)
        return { data: { user: u }, error: null }
      },
    }
    expectFail(await redeem(db, { token }), 410, 'replaced')
    assert.ok(db.deletedUsers.includes(OTHER2), 'the race guard ran on the second generateLink')
    assert.ok(!db.deletedUsers.includes(U1))
    ok('the second generateLink gets the race guard too: a fresh profile-less different user is deleted')
  }

  section('9. race guard (generateLink answered another user)')
  const OTHER = '44444444-0000-4000-8000-000000000004'
  const raceCase = async (label, otherUser, withProfile, expectDeleted) => {
    const { db, token } = fresh()
    db.usersById.set(OTHER, Object.assign({ id: OTHER, email: EMAIL }, otherUser))
    if (withProfile) db.seed('user_profiles', [{ id: OTHER, client_id: 11, role: 'viewer' }])
    db.authBehaviour = { invite: async () => ({ data: { user: db.usersById.get(OTHER) }, error: null }) }
    const r = await redeem(db, { token })
    expectFail(r, 404, 'invalid')
    assert.strictEqual(db.deletedUsers.includes(OTHER), expectDeleted, label)
    assert.strictEqual(db.deletedUsers.includes(U1), false)
    assert.strictEqual(linkRow(db).redeem_count, 0)
    ok(`${label}: 404 invalid, ${expectDeleted ? 'deleted' : 'spared'}`)
  }
  await raceCase('fresh profile-less different user', { created_at: new Date(NOW.getTime() - 5000).toISOString() }, false, true)
  await raceCase('different user older than 60 s', { created_at: new Date(NOW.getTime() - 61000).toISOString() }, false, false)
  await raceCase('fresh different user with a profile', { created_at: NOW.toISOString() }, true, false)
  await raceCase('different user with no created_at', {}, false, false)

  section('10. rate limits')
  {
    const { db, token, hash } = fresh()
    db.rateFalse = (k) => k.startsWith('invite:ip:')
    expectFail(await redeem(db, { token }), 429, 'rate_limited')
    assert.strictEqual(tableReads(db).length, 0, 'zero table reads')
    db.rateFalse = (k) => k.startsWith('invite:tok:')
    expectFail(await redeem(db, { token }), 429, 'rate_limited')
    assert.strictEqual(tableReads(db).length, 0)
    const tokKeys = db.rateArgs.filter((a) => a.p_key.startsWith('invite:tok:'))
    assert.ok(tokKeys.length >= 1)
    for (const a of tokKeys) {
      assert.strictEqual(a.p_key, `invite:tok:${hash.slice(0, 16)}`)
      assert.ok(/^invite:tok:[0-9a-f]{16}$/.test(a.p_key))
      assert.ok(!a.p_key.includes(hash))
      assert.deepStrictEqual([a.p_limit, a.p_window_seconds], [10, 3600])
    }
    const ipKeys = db.rateArgs.filter((a) => a.p_key.startsWith('invite:ip:'))
    for (const a of ipKeys) assert.deepStrictEqual([a.p_limit, a.p_window_seconds], [20, 3600])
    ok('ip or token limiter false: 429 with zero table reads; the token key carries 16 hex chars, not the hash')
  }
  {
    const { db, token } = fresh()
    db.rpcFaults = { affiliate_rate_check: { message: 'function does not exist' } }
    const r = await redeem(db, { token })
    assert.strictEqual(r.status, 200)
    assert.ok(captured.some((l) => /rate check failed .*proceeding/.test(l)))
    ok('a limiter RPC error is logged and the request proceeds')
  }
  {
    const { db, token } = fresh()
    for (let i = 0; i < 10; i++) assert.strictEqual((await redeem(db, { token })).status, 200, `press ${i + 1}`)
    expectFail(await redeem(db, { token }), 429, 'rate_limited')
    ok('the real fixed window: ten presses of one token pass, the eleventh is limited')
  }

  section('11. headers and logs on every answer')
  {
    assert.ok(responses.length > 40, `${responses.length} answers checked`)
    for (const r of responses) {
      assert.strictEqual(r.headers['Cache-Control'], 'no-store')
      assert.strictEqual(r.headers['Referrer-Policy'], 'no-referrer')
      assert.strictEqual(r.headers['Content-Type'], 'application/json')
      assert.ok(r.headers['Access-Control-Allow-Origin'])
    }
    ok(`Cache-Control no-store, Referrer-Policy no-referrer and CORS on all ${responses.length} answers`)
    secrets.delete(undefined); secrets.delete(null); secrets.delete('')
    const all = captured.join('\n')
    assert.ok(captured.length > 20)
    for (const s of secrets) assert.ok(!all.includes(s), `a log line holds a secret (${String(s).slice(0, 6)}...)`)
    for (const l of captured) assert.ok(/^\[invite-redeem\] /.test(l), l)
    const src = require('fs').readFileSync(path.join(FN, 'invite-redeem.js'), 'utf8')
    // Built from code points so this file itself holds no dash character.
    const dash = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`)
    assert.ok(!dash.test(src), 'no dash in invite-redeem.js')
    assert.ok(dash.test(`control ${String.fromCharCode(0x2014)}`), 'positive control')
    assert.ok(!/require\([^)]*\.ts['"]\)/.test(src))
    ok(`${captured.length} log lines hold none of ${secrets.size} tokens, hashes, links, codes or the address`)
  }

  section('12. TOKEN_HASH_RE mirrors src/lib/authLinkState.ts (server review LOW-2)')
  {
    // invite-redeem.js cannot require a .ts file, so it carries a hand copy of
    // the shape /reset-password accepts. Both files are read as text only.
    const fs = require('fs')
    const literalIn = (src) => {
      const m = String(src).match(/const\s+TOKEN_HASH_RE\s*=\s*(\/\^[^\n]*?\$\/)/)
      return m ? m[1] : null
    }
    const serverLit = literalIn(fs.readFileSync(path.join(FN, 'invite-redeem.js'), 'utf8'))
    const clientLit = literalIn(fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'authLinkState.ts'), 'utf8'))
    assert.ok(serverLit, 'no TOKEN_HASH_RE literal found in netlify/functions/invite-redeem.js')
    assert.ok(clientLit, 'no TOKEN_HASH_RE literal found in src/lib/authLinkState.ts')
    ok(`the extraction found both literals (${serverLit.length} and ${clientLit.length} characters)`)
    assert.strictEqual(serverLit, clientLit, 'invite-redeem.js and authLinkState.ts disagree on TOKEN_HASH_RE')
    ok('the TOKEN_HASH_RE literal in invite-redeem.js equals the one in authLinkState.ts')
    // Positive control: the extractor tells a changed literal apart, and finds
    // nothing in text without the constant.
    const narrowed = literalIn('const TOKEN_HASH_RE = /^[A-Za-z0-9_-]{32,256}$/\n')
    assert.ok(narrowed, 'control: the extractor fires on a sample literal')
    assert.notStrictEqual(narrowed, clientLit, 'control: a narrowed literal reads as different')
    assert.strictEqual(literalIn('const OTHER_RE = /^a$/\n'), null, 'control: no constant, no literal')
    ok('positive control: a narrowed literal is told apart, a missing constant reads as null')
  }

  console.log = realLog; console.error = realErr; console.warn = realWarn
  console.log(`\ninvite_redeem: ${passed} checks passed`)
}

main().catch((e) => {
  console.log = realLog; console.error = realErr; console.warn = realWarn
  console.error(e)
  console.error('\nlast captured log lines:\n' + captured.slice(-15).join('\n'))
  process.exit(1)
})
