/**
 * agency_access.test.js
 *
 * Run from brandgeo-dashboard/:  node tests/agency_access.test.js
 *
 * Release P1 of docs/arch/agency-multi-brand.md, the access half (sections
 * 1.1, 4.6, 5.1, 5.3). Covers:
 *   1. assertClientAccess (_auth.js): a target that is not a positive int4 is
 *      400 before any read; an admin passes with no read; the default brand
 *      (disjunct c) passes with no read; a user_clients row passes; no row is
 *      403; a read error and a throw are 403, never a fallback; a missing
 *      profile is 403.
 *   2. requireAuth: a user whose banned_until has not lapsed is 401 before the
 *      profile read; a lapsed ban passes; a value that does not parse is 401.
 *      The clientId option runs on assertClientAccess (a membership row
 *      passes, none is 403).
 *   3. Ledger rows 2 to 10, 21 and 22 call assertClientAccess and no longer
 *      compare a request id with profile.client_id (source assertion), and a
 *      behaviour check over the in-memory fake for rows 6 to 10, 21 and 22: a
 *      viewer with a membership row on another brand passes the gate, a viewer
 *      without one is 403 before anything else is read. Rows 21 and 22 keep
 *      the default brand when the body names no client.
 *
 * Nothing touches the network: @supabase/supabase-js is replaced in
 * require.cache BEFORE any function module is loaded, and fetch is stubbed.
 * Fixtures name no real person (example.com only).
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

const FN = path.join(__dirname, '..', 'netlify', 'functions')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN
delete process.env.ANTHROPIC_API_KEY
delete process.env.RESEND_API_KEY
process.env.OPENAI_API_KEY = 'test-openai-placeholder'

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
const ADMIN = 'bbbbbbbb-0000-4000-8000-000000000001'
const VIEWER = 'bbbbbbbb-0000-4000-8000-000000000002'   // default brand 10
const STAFF = 'bbbbbbbb-0000-4000-8000-000000000003'    // default brand 10, member of brand 20
const BANNED = 'bbbbbbbb-0000-4000-8000-000000000004'
const NOPROFILE = 'bbbbbbbb-0000-4000-8000-000000000005'

let db = null
function freshDb() {
  db = createFakeSupabase()
  db.addUser('tok-admin', { id: ADMIN, email: 'admin@example.com' })
  db.addUser('tok-viewer', { id: VIEWER, email: 'viewer@example.com' })
  db.addUser('tok-staff', { id: STAFF, email: 'staff@example.com' })
  db.addUser('tok-banned', { id: BANNED, email: 'banned@example.com', banned_until: '2126-01-01T00:00:00Z' })
  db.addUser('tok-noprofile', { id: NOPROFILE, email: 'noprofile@example.com' })
  db.seed('user_profiles', [
    { id: ADMIN, role: 'admin', client_id: null },
    { id: VIEWER, role: 'viewer', client_id: 10 },
    { id: STAFF, role: 'viewer', client_id: 10 },
    { id: BANNED, role: 'viewer', client_id: 10 },
  ])
  db.seed('clients', [
    { id: 10, name: 'Home Brand', plan: 'growth', category: 'active', account_id: 1 },
    { id: 20, name: 'Client Brand', plan: 'growth', category: 'active', account_id: 1 },
    { id: 30, name: 'Other Brand', plan: 'growth', category: 'active', account_id: 2 },
  ])
  db.seed('user_clients', [
    { user_id: VIEWER, client_id: 10, role: 'owner', grant_source: 'backfill' },
    { user_id: STAFF, client_id: 10, role: 'member', grant_source: 'primary' },
    { user_id: STAFF, client_id: 20, role: 'member', grant_source: 'account' },
  ])
  return db
}
freshDb()

installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => db })

const fetchCalls = []
global.fetch = async (url) => {
  fetchCalls.push(String(url))
  if (/openai\.com/.test(String(url))) return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '[]' } }] }) }
  throw new Error('network disabled in tests')
}

const auth = require(path.join(FN, '_auth.js'))
const { assertClientAccess, requireAuth, isBannedUser, parseClientId } = auth

const realWarn = console.warn
const realError = console.error
const realLog = console.log
const quiet = () => { console.warn = () => {}; console.error = () => {} }
const loud = () => { console.warn = realWarn; console.error = realError }

const ORIGIN = 'https://app.getbrandgeo.com'
const ev = (token, body, method = 'POST') => ({
  httpMethod: method,
  headers: { authorization: token ? 'Bearer ' + token : '', origin: ORIGIN },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})
const reads = (table) => db.calls.filter((c) => c.table === table && c.op === 'select').length
const authFor = (userId, profile) => ({ user: { id: userId }, profile, supabase: db, headers: { 'Content-Type': 'application/json' } })

;(async () => {
  quiet()
  // ════════════════════════════════════════════════════════════════════════
  realLog('1. assertClientAccess')
  await check('a target that is not a positive int4 is 400 before any read (viewer and admin)', async () => {
    for (const bad of [0, -1, 1.5, '1e1', 'abc', ' 10', '010', [10], {}, null, undefined, 2147483648, '2147483648', NaN]) {
      freshDb()
      for (const a of [authFor(VIEWER, { role: 'viewer', client_id: 10 }), authFor(ADMIN, { role: 'admin', client_id: null })]) {
        const r = await assertClientAccess(a, bad)
        assert.strictEqual(r.ok, false, `ok for ${JSON.stringify(bad)}`)
        assert.strictEqual(r.response.statusCode, 400)
        assert.deepStrictEqual(JSON.parse(r.response.body), { error: 'Invalid client_id' })
      }
      assert.strictEqual(db.calls.length, 0)
    }
  })
  await check('admin: ok for any brand, no read', async () => {
    freshDb()
    const r = await assertClientAccess(authFor(ADMIN, { role: 'admin', client_id: null }), 30)
    assert.deepStrictEqual(r, { ok: true })
    assert.strictEqual(db.calls.length, 0)
  })
  await check('default brand (disjunct c): ok, no read; a digit string works too', async () => {
    freshDb()
    assert.deepStrictEqual(await assertClientAccess(authFor(VIEWER, { role: 'viewer', client_id: 10 }), 10), { ok: true })
    assert.deepStrictEqual(await assertClientAccess(authFor(VIEWER, { role: 'viewer', client_id: 10 }), '10'), { ok: true })
    assert.strictEqual(db.calls.length, 0)
  })
  await check('a user_clients row on the target: ok after exactly one user_clients read', async () => {
    freshDb()
    const r = await assertClientAccess(authFor(STAFF, { role: 'viewer', client_id: 10 }), 20)
    assert.deepStrictEqual(r, { ok: true })
    assert.strictEqual(reads('user_clients'), 1)
    assert.strictEqual(db.calls.length, 1)
  })
  await check('no row: 403 Forbidden: client mismatch', async () => {
    freshDb()
    const r = await assertClientAccess(authFor(VIEWER, { role: 'viewer', client_id: 10 }), 20)
    assert.strictEqual(r.ok, false)
    assert.strictEqual(r.response.statusCode, 403)
    assert.deepStrictEqual(JSON.parse(r.response.body), { error: 'Forbidden: client mismatch' })
  })
  await check('a user_clients read error is 403, never a fallback to the default brand', async () => {
    freshDb()
    db.faults.push({ table: 'user_clients', error: { code: '08006', message: 'connection reset' } })
    const r = await assertClientAccess(authFor(STAFF, { role: 'viewer', client_id: 10 }), 20)
    assert.strictEqual(r.ok, false)
    assert.strictEqual(r.response.statusCode, 403)
  })
  await check('a user_clients read that throws is 403', async () => {
    freshDb()
    const throwing = { from() { throw new Error('boom') } }
    const r = await assertClientAccess({ user: { id: STAFF }, profile: { role: 'viewer', client_id: 10 }, supabase: throwing, headers: {} }, 20)
    assert.strictEqual(r.ok, false)
    assert.strictEqual(r.response.statusCode, 403)
  })
  await check('a missing profile or user is 403', async () => {
    freshDb()
    for (const a of [{ user: { id: STAFF }, profile: null, supabase: db }, { user: null, profile: { role: 'viewer', client_id: 10 }, supabase: db }, null]) {
      const r = await assertClientAccess(a, 20)
      assert.strictEqual(r.ok, false)
      assert.strictEqual(r.response.statusCode, 403)
    }
  })
  await check('parseClientId: number or canonical digit string, positive int4 only', async () => {
    assert.strictEqual(parseClientId(7), 7)
    assert.strictEqual(parseClientId('7'), 7)
    assert.strictEqual(parseClientId(2147483647), 2147483647)
    for (const bad of [0, '07', '+7', '7 ', 7.5, true, [7], 2147483648]) assert.strictEqual(parseClientId(bad), null)
  })

  // ════════════════════════════════════════════════════════════════════════
  realLog('2. requireAuth: banned_until and the clientId option')
  await check('isBannedUser: future 401, past and null pass, unparseable is banned', async () => {
    const now = Date.now()
    assert.strictEqual(isBannedUser({ banned_until: new Date(now + 3600_000).toISOString() }), true)
    assert.strictEqual(isBannedUser({ banned_until: new Date(now - 3600_000).toISOString() }), false)
    assert.strictEqual(isBannedUser({ banned_until: null }), false)
    assert.strictEqual(isBannedUser({}), false)
    assert.strictEqual(isBannedUser({ banned_until: 'not a date' }), true)
    assert.strictEqual(isBannedUser(null), false)
  })
  await check('a banned user: 401 before the profile read, even with a valid token and a profile', async () => {
    freshDb()
    const r = await requireAuth(ev('tok-banned', {}))
    assert.ok(r.response, 'expected a response')
    assert.strictEqual(r.response.statusCode, 401)
    assert.match(JSON.parse(r.response.body).error, /login disabled/)
    assert.strictEqual(reads('user_profiles'), 0)
  })
  await check('a lapsed ban passes', async () => {
    freshDb()
    db.users.get('tok-banned').banned_until = new Date(Date.now() - 60_000).toISOString()
    const r = await requireAuth(ev('tok-banned', {}))
    assert.ok(!r.response, r.response && r.response.body)
    assert.strictEqual(r.user.id, BANNED)
  })
  await check('requireAuth clientId: a membership row passes, none is 403, a read error is 403', async () => {
    freshDb()
    const ok = await requireAuth(ev('tok-staff', {}), { clientId: 20 })
    assert.ok(!ok.response, ok.response && ok.response.body)
    const no = await requireAuth(ev('tok-viewer', {}), { clientId: 20 })
    assert.strictEqual(no.response.statusCode, 403)
    assert.deepStrictEqual(JSON.parse(no.response.body), { error: 'Forbidden: client mismatch' })
    db.faults.push({ table: 'user_clients', error: { message: 'boom' } })
    const err = await requireAuth(ev('tok-staff', {}), { clientId: 20 })
    assert.strictEqual(err.response.statusCode, 403)
    const own = await requireAuth(ev('tok-viewer', {}), { clientId: 10 })
    assert.ok(!own.response)
    const adm = await requireAuth(ev('tok-admin', {}), { clientId: 30 })
    assert.ok(!adm.response)
  })
  await check('requireAuth clientId: a malformed id is 400 (was a string comparison)', async () => {
    freshDb()
    const r = await requireAuth(ev('tok-viewer', {}), { clientId: 'abc' })
    assert.strictEqual(r.response.statusCode, 400)
  })
  await check('a user with no profile is still 403 (unchanged)', async () => {
    freshDb()
    const r = await requireAuth(ev('tok-noprofile', {}))
    assert.strictEqual(r.response.statusCode, 403)
  })

  // ════════════════════════════════════════════════════════════════════════
  realLog('3. ledger rows 2 to 10, 21, 22')
  const LEDGER = {
    'collect-chatgpt.js': 2, 'collect-claude.js': 3, 'collect-prompt.js': 4, 'enqueue-collection.js': 5,
    'generate-recommendations.js': 6, 'seo-audit-page.js': 7, 'seo-crawl.js': 8, 'seo-draft.js': 9,
    'seo-opportunities.js': 10, 'suggest-prompts.js': 21, 'support-request.js': 22,
  }
  const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const [file, row] of Object.entries(LEDGER)) {
    await check(`row ${row} ${file}: imports and calls assertClientAccess; no profile.client_id equality left`, async () => {
      const src = strip(fs.readFileSync(path.join(FN, file), 'utf8'))
      assert.match(src, /require\('\.\/_auth'\)/)
      assert.match(src, /\bassertClientAccess\b[^\n]*=\s*require\('\.\/_auth'\)|\{[^}]*\bassertClientAccess\b[^}]*\}\s*=\s*require\('\.\/_auth'\)/)
      assert.match(src, /await assertClientAccess\(auth, /)
      assert.ok(!/String\((auth\.)?profile\.client_id\)\s*!==\s*String\(/.test(src), 'inline equality still present')
      assert.match(src, /if \(!access\.ok\)/)
    })
  }
  await check('rows 11 to 20 (social-*.js, admin path) keep their inline check and stay adminOnly', async () => {
    for (const f of ['social-accounts.js', 'social-boost.js', 'social-brandkit.js', 'social-delete.js', 'social-generate.js', 'social-image.js', 'social-link.js', 'social-publish.js', 'social-queue.js', 'social-status.js']) {
      const src = fs.readFileSync(path.join(FN, f), 'utf8')
      assert.match(src, /requireAuth\(event, \{ adminOnly: true \}\)/, f)
      assert.ok(!/assertClientAccess/.test(src), f)
    }
  })

  // Behaviour: rows 6 to 10 over the fake. STAFF reaches brand 20 through a
  // membership row; VIEWER does not. 403 must come before any other read.
  const handlers = {
    'generate-recommendations.js': (cid) => ({ client_id: cid, brand_name: 'Client Brand' }),
    'seo-audit-page.js': (cid) => ({ client_id: cid, page_id: 1 }),
    'seo-crawl.js': (cid) => ({ client_id: cid }),
    'seo-draft.js': (cid) => ({ client_id: cid, brief_id: 1 }),
    'seo-opportunities.js': (cid) => ({ client_id: cid }),
  }
  for (const [file, mk] of Object.entries(handlers)) {
    const mod = require(path.join(FN, file))
    await check(`row ${LEDGER[file]} ${file}: viewer without a row on brand 20 is 403 before any other read`, async () => {
      freshDb()
      const res = await mod.handler(ev('tok-viewer', mk(20)))
      assert.strictEqual(res.statusCode, 403, res.body)
      assert.deepStrictEqual(JSON.parse(res.body), { error: 'Forbidden: client mismatch' })
      const tables = db.calls.filter((c) => c.table && c.table !== 'user_profiles' && c.table !== 'user_clients')
      assert.strictEqual(tables.length, 0, 'read after a 403: ' + JSON.stringify(tables))
    })
    await check(`row ${LEDGER[file]} ${file}: staff with a membership row on brand 20 passes the gate`, async () => {
      freshDb()
      let res
      try { res = await mod.handler(ev('tok-staff', mk(20))) } catch (e) { res = { statusCode: 'threw after the gate', body: String(e) } }
      assert.notStrictEqual(res.statusCode, 403, res.body)
      assert.strictEqual(reads('user_clients'), 1)
    })
    await check(`row ${LEDGER[file]} ${file}: a malformed client_id is 400 at the gate`, async () => {
      freshDb()
      const res = await mod.handler(ev('tok-viewer', mk('10x')))
      assert.strictEqual(res.statusCode, 400, res.body)
    })
  }

  // Row 21, suggest-prompts.js: the rate-limit subject is the brand used.
  const suggest = require(path.join(FN, 'suggest-prompts.js'))
  const sbody = (extra) => Object.assign({ messages: [{ role: 'user', content: 'We sell garden tools.' }] }, extra)
  await check('row 21 suggest-prompts: no client_id in the body keeps the default brand', async () => {
    freshDb()
    const res = await suggest.handler(ev('tok-staff', sbody({})))
    assert.strictEqual(res.statusCode, 200, res.body)
    const evs = db.rows('assistant_events')
    assert.strictEqual(evs.length, 1)
    assert.strictEqual(evs[0].ip_hash, 'client:10')
    assert.strictEqual(reads('user_clients'), 0)
  })
  await check('row 21 suggest-prompts: a member brand in the body is used after the check', async () => {
    freshDb()
    const res = await suggest.handler(ev('tok-staff', sbody({ client_id: 20 })))
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(db.rows('assistant_events')[0].ip_hash, 'client:20')
    assert.strictEqual(db.rows('assistant_events')[0].meta.client_id, 20)
  })
  await check('row 21 suggest-prompts: a brand without a row is 403, no OpenAI call, no event', async () => {
    freshDb()
    fetchCalls.length = 0
    const res = await suggest.handler(ev('tok-viewer', sbody({ client_id: 20 })))
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(fetchCalls.length, 0)
    assert.strictEqual(db.rows('assistant_events').length, 0)
  })

  // Row 22, support-request.js: the ticket's client_id.
  const support = require(path.join(FN, 'support-request.js'))
  await check('row 22 support-request: no client_id keeps the default brand', async () => {
    freshDb()
    const res = await support.handler(ev('tok-staff', { message: 'Help with a report' }))
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(db.rows('tickets')[0].client_id, 10)
  })
  await check('row 22 support-request: a member brand in the body files against that brand', async () => {
    freshDb()
    const res = await support.handler(ev('tok-staff', { message: 'Help with a report', client_id: 20 }))
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(db.rows('tickets')[0].client_id, 20)
    assert.strictEqual(db.rows('tickets')[0].source, 'customer')
  })
  await check('row 22 support-request: a brand without a row is 403, no ticket', async () => {
    freshDb()
    const res = await support.handler(ev('tok-viewer', { message: 'Help', client_id: 30 }))
    assert.strictEqual(res.statusCode, 403)
    assert.strictEqual(db.rows('tickets').length, 0)
  })
  await check('row 22 support-request: the widget sending the default brand still works (no read)', async () => {
    freshDb()
    const res = await support.handler(ev('tok-viewer', { message: 'Help', client_id: 10 }))
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(db.rows('tickets')[0].client_id, 10)
    assert.strictEqual(reads('user_clients'), 0)
  })
  await check('row 22 support-request: admin path unchanged (lenient parse, internal ticket when absent)', async () => {
    freshDb()
    let res = await support.handler(ev('tok-admin', { message: 'Note', client_id: 'x' }))
    assert.strictEqual(res.statusCode, 200, res.body)
    assert.strictEqual(db.rows('tickets')[0].client_id, null)
    assert.strictEqual(db.rows('tickets')[0].source, 'internal')
    freshDb()
    res = await support.handler(ev('tok-admin', { message: 'Note', client_id: 30 }))
    assert.strictEqual(db.rows('tickets')[0].client_id, 30)
  })

  loud()
  console.log(`\n${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => {
  loud()
  console.error(e)
  process.exit(1)
})
