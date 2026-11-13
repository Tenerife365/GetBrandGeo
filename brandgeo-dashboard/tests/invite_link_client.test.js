/**
 * invite_link_client.test.js - pins src/lib/inviteLink.ts, the pure half of the
 * 7 day invite link on the dashboard (spec docs/arch/invite-link-7-days.md,
 * sections 6.5 and 10), and the places where the page and the panel must stay
 * clean.
 *
 * Covers: the fragment-only token parser, the link expiry state, the mirror of
 * INVITE_TOKEN_RE in netlify/functions/_invite_link.js, and static checks that
 * the new client files never touch storage or the console, never hold a dash,
 * and that the panel no longer derives expiry from a time to live.
 *
 * Run: `node tests/invite_link_client.test.js` from brandgeo-dashboard/.
 * Fixtures: made-up hosts and tokens only.
 */
require('./helpers/ts_require')
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const LIB = path.join(ROOT, 'src', 'lib', 'inviteLink.ts')
const { INVITE_TOKEN_RE, parseInviteToken, linkStateFromExpiry, formatTimeLeft, formatAge } = require(LIB)

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL: ' + name + '\n  ' + (e && e.message)) }
}

const BASE = 'https://app.example.test'
// 43 characters from the url-safe alphabet, the shape the server issues.
const TOKEN = 'Abcdefghij_klmnopqrst-UVWXYZ0123456789abcde'

check('the fixture token is 43 characters', () => {
  assert.strictEqual(TOKEN.length, 43)
})

// ── parseInviteToken ───────────────────────────────────────────────────────

check('a token in the fragment is accepted', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + TOKEN), TOKEN)
})

check('a token in the fragment is accepted when other fragment keys exist', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite#x=1&t=' + TOKEN + '&y=2'), TOKEN)
})

check('a token only in the query string is ignored', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite?t=' + TOKEN), null)
})

check('a query token does not win over a missing fragment token', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite?t=' + TOKEN + '#other=1'), null)
})

check('a fragment token is used even when the query holds a different one', () => {
  const other = 'Z'.repeat(43)
  assert.strictEqual(parseInviteToken(BASE + '/invite?t=' + other + '#t=' + TOKEN), TOKEN)
})

check('no fragment gives null', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite'), null)
  assert.strictEqual(parseInviteToken(BASE + '/invite#'), null)
})

check('an empty token value gives null', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite#t='), null)
})

check('a 42 character token is refused', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + TOKEN.slice(0, 42)), null)
})

check('a 44 character token is refused', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + TOKEN + 'a'), null)
})

check('a plus sign is refused', () => {
  const bad = TOKEN.slice(0, 42) + '+'
  assert.strictEqual(bad.length, 43)
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + bad), null)
})

check('a slash is refused', () => {
  const bad = TOKEN.slice(0, 42) + '/'
  assert.strictEqual(bad.length, 43)
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + bad), null)
})

check('an equals sign padding is refused', () => {
  const bad = TOKEN.slice(0, 42) + '='
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + encodeURIComponent(bad)), null)
})

check('a percent-encoded character outside the alphabet is refused', () => {
  const bad = TOKEN.slice(0, 42) + '%2B'
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=' + bad), null)
})

check('a malformed URL gives null and does not throw', () => {
  assert.strictEqual(parseInviteToken('not a url'), null)
  assert.strictEqual(parseInviteToken(''), null)
  assert.strictEqual(parseInviteToken('/invite#t=' + TOKEN), null)
})

check('a token with a leading hash character inside the value is refused', () => {
  assert.strictEqual(parseInviteToken(BASE + '/invite#t=#' + TOKEN.slice(1)), null)
})

// ── INVITE_TOKEN_RE ────────────────────────────────────────────────────────

check('INVITE_TOKEN_RE accepts exactly the 43 character url-safe shape', () => {
  assert.strictEqual(INVITE_TOKEN_RE.test(TOKEN), true)
  assert.strictEqual(INVITE_TOKEN_RE.test(TOKEN.slice(0, 42)), false)
  assert.strictEqual(INVITE_TOKEN_RE.test(TOKEN + 'a'), false)
  assert.strictEqual(INVITE_TOKEN_RE.test(TOKEN + '\n'), false)
})

// ── linkStateFromExpiry ────────────────────────────────────────────────────

const NOW = Date.parse('2026-11-13T12:00:00.000Z')

check('a missing expiry is unknown', () => {
  assert.strictEqual(linkStateFromExpiry(null, NOW), 'unknown')
  assert.strictEqual(linkStateFromExpiry('', NOW), 'unknown')
})

check('an unparseable expiry is unknown', () => {
  assert.strictEqual(linkStateFromExpiry('not a date', NOW), 'unknown')
  assert.strictEqual(linkStateFromExpiry('2026-13-45T99:99:99Z', NOW), 'unknown')
})

check('an expiry in the future is valid', () => {
  assert.strictEqual(linkStateFromExpiry('2026-11-13T12:00:00.001Z', NOW), 'valid')
  assert.strictEqual(linkStateFromExpiry('2026-11-20T12:00:00.000Z', NOW), 'valid')
})

check('an expiry in the past is expired', () => {
  assert.strictEqual(linkStateFromExpiry('2026-11-13T11:59:59.999Z', NOW), 'expired')
  assert.strictEqual(linkStateFromExpiry('2026-11-01T00:00:00.000Z', NOW), 'expired')
})

check('the boundary is strict: now equal to the expiry is expired', () => {
  assert.strictEqual(linkStateFromExpiry('2026-11-13T12:00:00.000Z', NOW), 'expired')
})

check('without a clock argument it reads the real clock', () => {
  const past = new Date(Date.now() - 60_000).toISOString()
  const future = new Date(Date.now() + 60_000).toISOString()
  assert.strictEqual(linkStateFromExpiry(past), 'expired')
  assert.strictEqual(linkStateFromExpiry(future), 'valid')
})

// ── formatTimeLeft and formatAge ───────────────────────────────────────────

const MIN = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const iso = ms => new Date(ms).toISOString()

check('a link just sent (7 days ahead) reads 7 days left', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW + 7 * DAY), NOW), '7 days left')
})

check('exactly 1 day left reads 1 day left, singular', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW + DAY), NOW), '1 day left')
})

check('23 hours 59 minutes reads in hours', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW + 23 * HOUR + 59 * MIN), NOW), '23 hours left')
})

check('exactly 1 hour left reads 1 hour left, singular', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW + HOUR), NOW), '1 hour left')
})

check('under an hour reads less than an hour left', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW + 59 * MIN), NOW), 'less than an hour left')
  assert.strictEqual(formatTimeLeft(iso(NOW + 1), NOW), 'less than an hour left')
})

check('an expired or exactly now expiry reads empty', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW), NOW), '')
  assert.strictEqual(formatTimeLeft(iso(NOW - HOUR), NOW), '')
})

check('formatTimeLeft gives empty for null and unparseable input', () => {
  assert.strictEqual(formatTimeLeft(null, NOW), '')
  assert.strictEqual(formatTimeLeft('', NOW), '')
  assert.strictEqual(formatTimeLeft('not a date', NOW), '')
})

check('the one hour slack: 47 hours reads 2 days left', () => {
  assert.strictEqual(formatTimeLeft(iso(NOW + 47 * HOUR), NOW), '2 days left')
})

check('formatAge reads just now, minutes, hours and days, and empty for bad input', () => {
  assert.strictEqual(formatAge(iso(NOW - 30_000), NOW), 'just now')
  assert.strictEqual(formatAge(iso(NOW + HOUR), NOW), 'just now')
  assert.strictEqual(formatAge(iso(NOW - MIN), NOW), '1 minute ago')
  assert.strictEqual(formatAge(iso(NOW - 3 * HOUR), NOW), '3 hours ago')
  assert.strictEqual(formatAge(iso(NOW - 2 * DAY), NOW), '2 days ago')
  assert.strictEqual(formatAge(null, NOW), '')
  assert.strictEqual(formatAge('not a date', NOW), '')
})

// ── Mirror of INVITE_TOKEN_RE in the server helper ─────────────────────────

function literalFrom(file) {
  const src = fs.readFileSync(file, 'utf8')
  const m = src.match(/INVITE_TOKEN_RE\s*=\s*(\/\^[^\n]*?\$\/)/)
  return m ? m[1] : null
}

check('the INVITE_TOKEN_RE literal equals the one in netlify/functions/_invite_link.js', () => {
  const serverFile = path.join(ROOT, 'netlify', 'functions', '_invite_link.js')
  assert.ok(fs.existsSync(serverFile), 'netlify/functions/_invite_link.js does not exist yet')
  const client = literalFrom(LIB)
  const server = literalFrom(serverFile)
  assert.ok(client, 'no INVITE_TOKEN_RE literal found in src/lib/inviteLink.ts')
  assert.ok(server, 'no INVITE_TOKEN_RE literal found in _invite_link.js')
  assert.strictEqual(client, server)
})

check('the mirror extractor fires on a changed literal (positive control)', () => {
  const tmp = path.join(require('os').tmpdir(), 'invite_link_mirror_control_' + process.pid + '.js')
  fs.writeFileSync(tmp, 'const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{44}$/\n')
  try {
    assert.notStrictEqual(literalFrom(tmp), literalFrom(LIB))
  } finally {
    fs.unlinkSync(tmp)
  }
})

// ── Static checks on the new client files ──────────────────────────────────

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

const FILES = {
  lib: LIB,
  page: path.join(ROOT, 'src', 'pages', 'Invite.tsx'),
  panel: path.join(ROOT, 'src', 'components', 'PendingInvitesPanel.tsx'),
}

check('the three client files exist', () => {
  for (const f of Object.values(FILES)) assert.ok(fs.existsSync(f), f + ' is missing')
})

check('the invite page and the lib never touch storage, the console or cookies', () => {
  for (const f of [FILES.lib, FILES.page]) {
    const code = stripComments(fs.readFileSync(f, 'utf8'))
    assert.ok(!/\b(localStorage|sessionStorage|indexedDB)\b/.test(code), f + ' touches storage')
    assert.ok(!/\bconsole\s*\./.test(code), f + ' writes to the console')
    assert.ok(!/document\.cookie/.test(code), f + ' touches cookies')
  }
})

check('the panel never touches storage, the console or cookies', () => {
  const code = stripComments(fs.readFileSync(FILES.panel, 'utf8'))
  assert.ok(!/\b(localStorage|sessionStorage|indexedDB)\b/.test(code), 'touches storage')
  assert.ok(!/\bconsole\s*\./.test(code), 'writes to the console')
  assert.ok(!/document\.cookie/.test(code), 'touches cookies')
})

check('the invite page makes no function call outside the redeem handler', () => {
  const code = stripComments(fs.readFileSync(FILES.page, 'utf8'))
  const fetches = code.match(/\bfetch\s*\(/g) || []
  assert.strictEqual(fetches.length, 1, 'expected exactly one fetch, found ' + fetches.length)
  assert.ok(/invite-redeem/.test(code))
})

check('the panel no longer derives link expiry from a time to live', () => {
  const code = stripComments(fs.readFileSync(FILES.panel, 'utf8'))
  assert.ok(!/FALLBACK_TTL_MINUTES/.test(code), 'FALLBACK_TTL_MINUTES is back')
  assert.ok(!/linkTtlMinutes/.test(code), 'linkTtlMinutes is back')
  assert.ok(!/\bsetTtl\b/.test(code), 'the ttl state is back')
  assert.ok(/linkStateFromExpiry\s*\(/.test(code), 'the badge does not use linkStateFromExpiry')
  assert.ok(/link_expires_at/.test(code), 'the panel does not read link_expires_at')
})

check('the panel keeps the invite url in component state only', () => {
  const code = stripComments(fs.readFileSync(FILES.panel, 'utf8'))
  assert.ok(/invite_url/.test(code), 'the panel does not read invite_url')
  // The only place a url is written outside state is the clipboard.
  const writes = (code.match(/navigator\.clipboard\.writeText/g) || []).length
  assert.strictEqual(writes, 1)
})

// No em dash (U+2014) or en dash (U+2013), built from char codes so this file holds none.
const DASH_RE = new RegExp('[' + String.fromCharCode(0x2013) + String.fromCharCode(0x2014) + ']')

check('no new client file holds an em or en dash', () => {
  for (const f of Object.values(FILES)) {
    const src = fs.readFileSync(f, 'utf8')
    assert.ok(!DASH_RE.test(src), f + ' holds a dash')
  }
})

check('the dash scan fires on a dash (positive control)', () => {
  assert.ok(DASH_RE.test('a ' + String.fromCharCode(0x2014) + ' b'))
  assert.ok(DASH_RE.test('a ' + String.fromCharCode(0x2013) + ' b'))
  assert.ok(!DASH_RE.test('a - b'))
})

console.log(`invite_link_client: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
