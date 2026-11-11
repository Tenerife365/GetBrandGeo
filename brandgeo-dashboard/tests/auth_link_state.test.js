/**
 * auth_link_state.test.js - pins src/lib/authLinkState.ts, the parser the
 * set-password page (/reset-password) uses to tell an expired or refused email
 * link from a usable one.
 *
 * Why it exists: on 2026-11-11 an invited person opened the invite link after
 * it had expired. Supabase Auth redirected to /reset-password with the error in
 * the URL fragment, and the page showed two disabled fields and no way to ask
 * for a new link. The page now reads the URL through this parser.
 *
 * Run: `node tests/auth_link_state.test.js` from brandgeo-dashboard/.
 * Fixtures: made-up hosts and tokens only.
 */
require('./helpers/ts_require')
const assert = require('assert')
const path = require('path')
const { parseAuthLink, isExpiredLinkCode } = require(path.join(__dirname, '..', 'src', 'lib', 'authLinkState.ts'))

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL: ' + name + '\n  ' + (e && e.message)) }
}

const BASE = 'https://app.example.test/reset-password'
const HASH = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'

check('the exact redirect Supabase Auth sends for an expired invite is an error', () => {
  const s = parseAuthLink(BASE + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=')
  assert.strictEqual(s.kind, 'error')
  assert.strictEqual(s.code, 'otp_expired')
  assert.strictEqual(s.description, 'Email link is invalid or has expired')
  assert.strictEqual(isExpiredLinkCode(s.code), true)
})

check('the same error in the query string (PKCE redirect) is an error', () => {
  const s = parseAuthLink(BASE + '?error=access_denied&error_code=otp_expired&error_description=Email%20link%20is%20invalid%20or%20has%20expired')
  assert.strictEqual(s.kind, 'error')
  assert.strictEqual(s.code, 'otp_expired')
  assert.strictEqual(s.description, 'Email link is invalid or has expired')
})

check('error without error_code falls back to the error value, then to unknown', () => {
  const a = parseAuthLink(BASE + '#error=access_denied')
  assert.strictEqual(a.kind, 'error')
  assert.strictEqual(a.code, 'access_denied')
  const b = parseAuthLink(BASE + '#error_description=Something+went+wrong')
  assert.strictEqual(b.kind, 'error')
  assert.strictEqual(b.code, 'unknown')
  assert.strictEqual(b.description, 'Something went wrong')
})

check('the code is trimmed and lower-cased', () => {
  const s = parseAuthLink(BASE + '#error_code=%20OTP_Expired%20')
  assert.strictEqual(s.kind, 'error')
  assert.strictEqual(s.code, 'otp_expired')
})

check('only otp_expired counts as an expired link', () => {
  assert.strictEqual(isExpiredLinkCode('otp_expired'), true)
  assert.strictEqual(isExpiredLinkCode('access_denied'), false)
  assert.strictEqual(isExpiredLinkCode('unknown'), false)
  assert.strictEqual(isExpiredLinkCode(''), false)
})

check('a long description is capped at 200 characters', () => {
  const s = parseAuthLink(BASE + '#error_code=x&error_description=' + 'a'.repeat(500))
  assert.strictEqual(s.kind, 'error')
  assert.ok(s.description.length <= 200, 'length ' + s.description.length)
})

check('a token link in the query is a token', () => {
  const s = parseAuthLink(BASE + '?token_hash=' + HASH + '&type=invite')
  assert.deepStrictEqual(s, { kind: 'token', tokenHash: HASH, type: 'invite' })
})

check('every allowed type is accepted', () => {
  for (const t of ['invite', 'recovery', 'signup', 'magiclink', 'email']) {
    const s = parseAuthLink(BASE + '?token_hash=' + HASH + '&type=' + t)
    assert.strictEqual(s.kind, 'token', t)
    assert.strictEqual(s.type, t)
  }
})

check('a pkce-prefixed token hash is accepted', () => {
  const s = parseAuthLink(BASE + '?token_hash=pkce_' + HASH + '&type=recovery')
  assert.strictEqual(s.kind, 'token')
  assert.strictEqual(s.tokenHash, 'pkce_' + HASH)
})

check('an unknown type is not a token', () => {
  for (const t of ['email_change', 'sms', 'INVITE', '', 'invite%20']) {
    assert.deepStrictEqual(parseAuthLink(BASE + '?token_hash=' + HASH + '&type=' + t), { kind: 'none' }, JSON.stringify(t))
  }
})

check('a token hash with a bad shape is not a token', () => {
  const bad = ['short', 'a'.repeat(300), HASH + '%20', HASH + '<script>', HASH + '/..', '']
  for (const h of bad) {
    assert.deepStrictEqual(parseAuthLink(BASE + '?token_hash=' + h + '&type=invite'), { kind: 'none' }, JSON.stringify(h.slice(0, 20)))
  }
})

check('token_hash without type, or type without token_hash, is none', () => {
  assert.deepStrictEqual(parseAuthLink(BASE + '?token_hash=' + HASH), { kind: 'none' })
  assert.deepStrictEqual(parseAuthLink(BASE + '?type=invite'), { kind: 'none' })
})

check('an error wins over a token in the same URL', () => {
  const s = parseAuthLink(BASE + '?token_hash=' + HASH + '&type=invite#error_code=otp_expired')
  assert.strictEqual(s.kind, 'error')
  assert.strictEqual(s.code, 'otp_expired')
})

check('a success fragment (session tokens) is none, so the page waits for the session', () => {
  const s = parseAuthLink(BASE + '#access_token=aaa.bbb.ccc&expires_in=3600&refresh_token=rrr&token_type=bearer&type=invite')
  assert.deepStrictEqual(s, { kind: 'none' })
})

check('a plain URL is none', () => {
  assert.deepStrictEqual(parseAuthLink(BASE), { kind: 'none' })
  assert.deepStrictEqual(parseAuthLink(BASE + '?utm_source=mail'), { kind: 'none' })
  assert.deepStrictEqual(parseAuthLink(BASE + '#'), { kind: 'none' })
})

check('malformed input never throws and is none', () => {
  for (const v of ['', 'not a url', '%%%', 'https://', BASE + '#%E0%A4%A', BASE + '?%', null, undefined, 42]) {
    let out
    assert.doesNotThrow(() => { out = parseAuthLink(v) }, 'threw on ' + String(v))
    assert.ok(out && typeof out.kind === 'string', 'no state for ' + String(v))
  }
  assert.deepStrictEqual(parseAuthLink('not a url'), { kind: 'none' })
})

check('markup in the description stays plain text and inside the cap', () => {
  const s = parseAuthLink(BASE + '#error_code=otp_expired&error_description=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E')
  assert.strictEqual(s.kind, 'error')
  assert.strictEqual(typeof s.description, 'string')
  assert.ok(s.description.length <= 200)
})

check('the module is pure: no import and no window access', () => {
  const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'lib', 'authLinkState.ts'), 'utf8')
  assert.ok(!/^\s*import\s/m.test(src), 'has an import')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  assert.ok(!/\bwindow\b/.test(code), 'touches window')
  assert.ok(!/\bdocument\b/.test(code), 'touches document')
  assert.ok(!/console\./.test(code), 'logs')
})

console.log(`auth_link_state: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
