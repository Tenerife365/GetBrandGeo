/**
 * provision_client.test.js: shared provisioning and the admin wizard path
 * (docs/arch/explee-lead-import.md, revision 2, criteria 11 and 12).
 * Run from brandgeo-dashboard/:  node tests/provision_client.test.js
 *
 *   1. The wizard, BEFORE and AFTER: the onboard-client.js of commit feed1d5
 *      (the last version before the refactor, read with `git show`, never
 *      written to disk) and the current one run against identical in-memory
 *      fakes. For a NEW address the side-effect order, the clients insert
 *      payload, the invite redirect, the profile, the prompts, the audit row,
 *      the response keys, the status codes and the error texts must match.
 *      Skipped with a note when git is unavailable.
 *   2. The wizard after the change, pinned on its own (so the pins survive
 *      when feed1d5 is no longer reachable).
 *   3. Rule U: an existing pending user and an existing profile-less user get
 *      email_registered with zero invites, zero deleteUser calls and the user
 *      unchanged; an invite returning a pre-existing user is never deleted.
 *   4. provisionViewerClient always writes 'viewer'; a derived slug retries
 *      on 23505; the audit row is non-fatal.
 *   5. Source text: the importer and the rules module carry no 'admin'
 *      literal and never import provisionAdminWizardClient.
 *
 * Fakes: @supabase/supabase-js (tests/helpers/fake_supabase_mem.js) and
 * _auth.js (requireAuth passes as an admin). No clock is read by the
 * assertions; fixtures use example.com addresses only.
 */
const assert = require('assert')
const path = require('path')
const fs = require('fs')
const Module = require('module')
const { execFileSync } = require('child_process')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const FIXED = new Date('2026-11-11T09:00:00.000Z')
const ADMIN_ID = '00000000-0000-4000-8000-0000000000aa'

let passes = 0
let failures = 0
async function check(name, fn) {
  try { await fn(); passes++; console.log(`  ok   ${name}`) } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e}`) }
}

// ── module fakes ───────────────────────────────────────────────────────────
let currentDb = null
function installModule(resolved, exportsObj) {
  const m = new Module(resolved, null)
  m.filename = resolved
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolved] = m
}
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => currentDb })
installModule(path.join(FN, '_auth.js'), {
  requireAuth: async () => ({ user: { id: ADMIN_ID }, headers: { 'Content-Type': 'application/json' } }),
  checkCollectionLimits: async () => ({ blocked: false }),
})

const P = require('../netlify/functions/_provision_client')
const newWizard = require('../netlify/functions/onboard-client')

// ── 7 day invite link (docs/arch/invite-link-7-days.md section 10) ────────
// Every provisioning case runs TWICE: mode 'supabase' sets the kill switch
// INVITE_LINK_CHANNEL=supabase (today's path), mode 'link' turns the channel
// on with a dummy Resend key and the Resend sender stubbed on the cached
// _email.js module (which _invite_link.js reads at call time). No fixture flag
// differs between the two runs of one case.
let MODE = 'supabase'
let emailDb = null
let emailImpl = async () => ({ ok: true, id: 'em_test' })
const emailMod = require(path.join(FN, '_email.js'))
emailMod.sendBrandedEmail = async (msg) => {
  const r = await emailImpl(msg)
  if (emailDb) {
    emailDb.resendCalls.push({ to: msg && msg.to, ok: !!(r && r.ok) })
    if (r && r.ok) emailDb.emailLog.push({ to: msg && msg.to, via: 'resend' })
  }
  return r
}
function setMode(mode) {
  MODE = mode
  emailImpl = async () => ({ ok: true, id: 'em_test' })
  if (mode === 'supabase') { process.env.INVITE_LINK_CHANNEL = 'supabase'; delete process.env.RESEND_API_KEY }
  else { delete process.env.INVITE_LINK_CHANNEL; process.env.RESEND_API_KEY = 'test-resend-key' }
}
/** Records every email that went out on this db (the newest db made). */
function track(db) {
  emailDb = db
  db.emailLog = []
  db.resendCalls = []
  const inv = db.auth.admin.inviteUserByEmail
  db.auth.admin.inviteUserByEmail = async (email, options) => {
    const r = await inv(email, options)
    if (!(r && r.error)) db.emailLog.push({ to: email, via: 'supabase' })
    return r
  }
  return db
}
// The two helpers of section 10, plus the address list behind them.
/** Emails that went out: Resend answers ok plus inviteUserByEmail calls without an error. generateLink sends nothing. */
const emailsSent = (db) => db.emailLog.length
const emailAddresses = (db) => db.emailLog.map((x) => x.to)
/** Users the fake auth created (generateLink or inviteUserByEmail on an unknown address). */
const usersCreatedByAuth = (db) => db.createdUsers.length
const inviteLinks = (db) => db.generatedLinks.filter((g) => g.type === 'invite')

let oldWizard = null
try {
  const src = execFileSync('git', ['show', 'feed1d5:brandgeo-dashboard/netlify/functions/onboard-client.js'], { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const filename = path.join(FN, '__onboard_client_feed1d5__.js')   // never written; only names the module for require resolution
  const m = new Module(filename, null)
  m.filename = filename
  m.paths = Module._nodeModulePaths(FN)
  m._compile(src, filename)
  oldWizard = m.exports
} catch {
  oldWizard = null
}

// ── fake database helpers ──────────────────────────────────────────────────
function errQuery(message) {
  const q = {
    insert() { return q }, select() { return q }, single() { return q }, eq() { return q }, delete() { return q },
    then(res) { return Promise.resolve({ data: null, error: { message } }).then(res) },
  }
  return q
}

// rev 4, V1: stampCreatedAt is on by default here (a user the invite creates
// carries created_at = now), as section 5.6 of the spec asks of every test
// that expects a successful create; a case that needs it off says so.
function makeDb({ failInsert = [], invite = null, users = [], stampCreatedAt = true, inviteResendsPending = false, beforeInvite = null, onListUsers = null, now = () => FIXED } = {}) {
  const db = createFakeSupabase({
    now,
    extraUnique: { clients: [['slug']] },
    pagedListUsers: true,
    stampCreatedAt,
    inviteResendsPending,
    authBehaviour: {
      beforeInvite: async (email, options) => { db.calls.push({ auth: 'invite' }); if (beforeInvite) await beforeInvite(email, options) },
      invite,
      onListUsers,
    },
  })
  for (const u of users) db.usersById.set(u.id, u)
  const orig = db.from.bind(db)
  const fails = new Set(failInsert)
  db.from = (t) => {
    const q = orig(t)
    if (fails.has(t)) q.insert = () => errQuery(`${t} insert refused`)
    return q
  }
  return track(db)
}

function wizardBody(over = {}) {
  return Object.assign({
    name: 'Acme Widgets', slug: 'acme-widgets', brand_website: 'acme.example',
    brand_aliases: ['Acme'], known_competitors: ['Other Co'], plan: 'growth',
    default_market_id: 'ES', default_region_id: 'ALL', contact_email: 'owner@acme.example',
    role: 'viewer', prompts: ['best widget makers in Spain', { text: 'top widget suppliers' }, '  '],
  }, over)
}

async function runWizard(handler, db, body) {
  currentDb = db
  const res = await handler({ httpMethod: 'POST', headers: { origin: 'https://app.getbrandgeo.com' }, body: JSON.stringify(body) })
  let parsed = null
  try { parsed = JSON.parse(res.body) } catch { parsed = res.body }
  return { status: res.statusCode, body: parsed }
}

function strip(rows, drop = ['id', 'created_at', 'last_refresh_at']) {
  return rows.map((r) => { const o = Object.assign({}, r); for (const k of drop) delete o[k]; return o })
}
function sideEffects(db) {
  return db.calls.filter((c) => c.auth || c.op !== 'select').map((c) => c.auth ? `auth:${c.auth}` : `${c.table}:${c.op}`)
}

const SCENARIOS = [
  ['new address, success', {}, {}],
  ['admin role', { role: 'admin' }, {}],
  ['plan omitted keeps the essentials default', { plan: undefined }, {}],
  ['slug already taken', {}, { seedSlug: true }],
  ['invite fails with a generic error', {}, { invite: async () => ({ data: { user: null }, error: { message: 'smtp unavailable' } }) }],
  ['invite says already registered', {}, { invite: async () => ({ data: { user: null }, error: { message: 'A user with this email address has already been registered' } }) }],
  ['profile insert fails', {}, { failInsert: ['user_profiles'] }],
  ['prompts insert fails', {}, { failInsert: ['prompts'] }],
  ['audit row fails, non-fatal', {}, { failInsert: ['client_events'] }],
  ['unknown plan is a 400', { plan: 'platinum' }, {}],
  ['missing fields is a 400', { slug: '' }, {}],
]

// The wizard (onboard-client.js) passes now: () => new Date(), so for the
// wizard the fake GoTrue stamps created_at from that same clock, as the real
// one would. No assertion reads this clock.
const WIZARD_CLOCK = () => new Date()

async function runScenario(handler, body, opts) {
  const db = makeDb({ failInsert: opts.failInsert || [], invite: opts.invite || null, now: WIZARD_CLOCK })
  if (opts.seedSlug) db.seed('clients', [{ name: 'Existing', slug: 'acme-widgets' }])
  db.calls.length = 0
  const r = await runWizard(handler, db, body)
  return { r, db }
}

async function suite() {
  console.log('\n1. wizard before (feed1d5) and after, identical fakes')
  console.log('   rev 3, A1: brand_aliases is the ONE intended difference in the client row (the account name first)')
  if (!oldWizard) {
    console.log('  note: feed1d5 is not readable through git here; section 1 skipped, section 2 still pins the behaviour')
  } else {
    let aliasDiffs = 0
    for (const [name, over, opts] of SCENARIOS) {
      await check(`before = after: ${name}`, async () => {
        const body = wizardBody(over)
        const a = await runScenario(oldWizard.handler, body, opts)
        const b = await runScenario(newWizard.handler, body, opts)
        assert.strictEqual(b.r.status, a.r.status, 'status code')
        // locations_created (2026-11-13, multi-location 5.4) is the one key the
        // new wizard adds to its response; it is pinned at 0 for these
        // string-only scenarios in section 2 and compared without it here.
        const norm = (x) => { const o = Object.assign({}, x); if (o.client_id !== undefined) o.client_id = 'ID'; if (o.user_id !== undefined) o.user_id = 'UID'; delete o.locations_created; return o }
        assert.deepStrictEqual(typeof b.r.body === 'object' ? norm(b.r.body) : b.r.body, typeof a.r.body === 'object' ? norm(a.r.body) : a.r.body, 'response body')
        // Link run: the new wizard also writes its own client_invite_links
        // rows (supersede, insert), which feed1d5 never had; every other side
        // effect keeps its order.
        const ownLinkWrites = (list) => (MODE === 'link' ? list.filter((x) => !x.startsWith('client_invite_links:')) : list)
        assert.deepStrictEqual(ownLinkWrites(sideEffects(b.db)), sideEffects(a.db), 'side-effect order')
        // Every column identical except brand_aliases ...
        assert.deepStrictEqual(strip(b.db.rows('clients'), ['id', 'created_at', 'last_refresh_at', 'brand_aliases']), strip(a.db.rows('clients'), ['id', 'created_at', 'last_refresh_at', 'brand_aliases']), 'clients rows except brand_aliases')
        // ... and brand_aliases differs ONLY by the aliases rule of 5.4.
        const ra = a.db.rows('clients')
        const rb = b.db.rows('clients')
        for (let i = 0; i < rb.length; i++) {
          if (JSON.stringify(rb[i].brand_aliases) === JSON.stringify(ra[i].brand_aliases)) continue
          assert.deepStrictEqual(rb[i].brand_aliases, P.aliasesWithName(ra[i].name, ra[i].brand_aliases), 'brand_aliases follows the A1 rule')
          aliasDiffs++
        }
        assert.deepStrictEqual(strip(b.db.rows('prompts'), ['id', 'created_at', 'client_id']), strip(a.db.rows('prompts'), ['id', 'created_at', 'client_id']), 'prompts rows')
        assert.deepStrictEqual(strip(b.db.rows('user_profiles'), ['id', 'created_at', 'client_id']), strip(a.db.rows('user_profiles'), ['id', 'created_at', 'client_id']), 'profile rows')
        // CHANGED ON PURPOSE (spec 6.4): the onboarded meta gains
        // invite_channel, which feed1d5 never wrote; compared without it.
        const noChannel = (rows) => rows.map((ev) => { const m = Object.assign({}, ev.meta); delete m.invite_channel; return Object.assign({}, ev, { meta: m }) })
        assert.deepStrictEqual(noChannel(strip(b.db.rows('client_events'), ['id', 'created_at', 'client_id'])), strip(a.db.rows('client_events'), ['id', 'created_at', 'client_id']), 'audit rows')
        if (MODE === 'supabase') assert.deepStrictEqual(b.db.invites, a.db.invites, 'invites and redirect')
        else assert.deepStrictEqual(emailAddresses(b.db), emailAddresses(a.db), 'emails that went out, to the same addresses')
      })
    }
    await check('the A1 difference really shows: the success scenario stores the name first', async () => {
      assert.ok(aliasDiffs >= 1, 'no scenario showed the intended brand_aliases difference')
      const { db } = await runScenario(newWizard.handler, wizardBody(), {})
      assert.deepStrictEqual(db.rows('clients')[0].brand_aliases, ['acme widgets', 'Acme'])
    })
  }

  console.log('\n2. wizard after the change, pinned on its own')
  await check('success: 200, response keys, writes in order, redirect, viewer profile, 2 prompts, audit meta', async () => {
    const { r, db } = await runScenario(newWizard.handler, wizardBody(), {})
    assert.strictEqual(r.status, 200)
    assert.deepStrictEqual(Object.keys(r.body).sort(), ['audit_logged', 'client_id', 'client_name', 'engines_enabled', 'locations_created', 'plan', 'prompts_created', 'refresh_cadence', 'role', 'user_id'])
    assert.strictEqual(r.body.plan, 'growth'); assert.strictEqual(r.body.refresh_cadence, 'weekly'); assert.strictEqual(r.body.prompts_created, 2); assert.strictEqual(r.body.audit_logged, true)
    assert.strictEqual(r.body.locations_created, 0, 'no extra location: 0, and no add_client_locations call')
    assert.ok(!db.calls.some((c) => c.rpc), 'no rpc at all without extra locations (S1)')
    assert.ok(db.rows('prompts').every((p) => !('location_id' in p)), 'primary rows carry no location_id key')
    if (MODE === 'supabase') {
      assert.deepStrictEqual(sideEffects(db), ['clients:insert', 'auth:invite', 'user_profiles:insert', 'prompts:insert', 'client_events:insert'])
      assert.deepStrictEqual(db.invites, [{ email: 'owner@acme.example', redirectTo: 'https://app.getbrandgeo.com/reset-password' }])
    } else {
      // The user is created by generateLink (its hooks fire there), then our
      // link row is issued and the Resend email goes out, all before the profile.
      assert.deepStrictEqual(sideEffects(db), ['clients:insert', 'auth:invite', 'client_invite_links:update', 'client_invite_links:insert', 'user_profiles:insert', 'prompts:insert', 'client_events:insert'])
      assert.deepStrictEqual(inviteLinks(db).map((g) => [g.email, g.redirectTo]), [['owner@acme.example', 'https://app.getbrandgeo.com/reset-password']])
      assert.deepStrictEqual(db.emailLog, [{ to: 'owner@acme.example', via: 'resend' }])
      assert.strictEqual(db.invites.length, 0, 'no Supabase invite email')
    }
    const c = db.rows('clients')[0]
    assert.deepStrictEqual(Object.keys(strip([c])[0]).filter((k) => !['stripe_customer_id', 'stripe_subscription_id'].includes(k)).sort(),
      ['brand_aliases', 'brand_website', 'default_market_id', 'default_region_id', 'known_competitors', 'name', 'plan', 'refresh_cadence', 'slug'].sort())
    assert.strictEqual(c.last_refresh_at.length, 24)
    assert.strictEqual(db.rows('user_profiles')[0].role, 'viewer')
    const ev = db.rows('client_events')[0]
    // CHANGED ON PURPOSE (spec 6.4): the meta gains invite_channel.
    assert.deepStrictEqual(Object.keys(ev.meta).sort(), ['default_market_id', 'invite_channel', 'plan_provided', 'prompts_created', 'refresh_cadence', 'role', 'slug', 'source'])
    assert.strictEqual(ev.meta.invite_channel, MODE === 'link' ? 'brandgeo' : 'supabase')
    assert.strictEqual(ev.meta.source, 'onboard-client'); assert.strictEqual(ev.actor, ADMIN_ID); assert.strictEqual(ev.type, 'onboarded')
  })
  await check('409 texts: slug taken, invite failed, already registered', async () => {
    const s = await runScenario(newWizard.handler, wizardBody(), { seedSlug: true })
    assert.strictEqual(s.r.status, 409); assert.strictEqual(s.r.body.error, 'A client with the slug "acme-widgets" already exists. Choose a different slug and try again.')
    const i = await runScenario(newWizard.handler, wizardBody(), { invite: async () => ({ data: { user: null }, error: { message: 'smtp unavailable' } }) })
    assert.strictEqual(i.r.status, 409); assert.strictEqual(i.r.body.error, 'Invite email failed: smtp unavailable')
    assert.strictEqual(i.db.rows('clients').length, 0, 'client rolled back')
    const a = await runScenario(newWizard.handler, wizardBody(), { invite: async () => ({ data: { user: null }, error: { message: 'User already registered' } }) })
    assert.strictEqual(a.r.status, 409); assert.ok(a.r.body.error.startsWith('owner@acme.example already has an account.'))
  })
  await check('500 texts and full rollback: profile and prompts failures', async () => {
    const p = await runScenario(newWizard.handler, wizardBody(), { failInsert: ['user_profiles'] })
    assert.strictEqual(p.r.status, 500); assert.strictEqual(p.r.body.error, 'Profile creation failed: user_profiles insert refused')
    assert.strictEqual(p.db.rows('clients').length, 0); assert.strictEqual(p.db.deletedUsers.length, 1)
    const q = await runScenario(newWizard.handler, wizardBody(), { failInsert: ['prompts'] })
    assert.strictEqual(q.r.status, 500); assert.strictEqual(q.r.body.error, 'Prompt seeding failed: prompts insert refused')
    assert.strictEqual(q.db.rows('clients').length, 0); assert.strictEqual(q.db.rows('user_profiles').length, 0); assert.strictEqual(q.db.deletedUsers.length, 1)
  })
  await check('the audit row is non-fatal: 200 with audit_logged false', async () => {
    const { r } = await runScenario(newWizard.handler, wizardBody(), { failInsert: ['client_events'] })
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.audit_logged, false)
  })
  await check('deliberate change: an existing pending user gets the 409 email text BEFORE anything is written', async () => {
    const db = makeDb({ users: [{ id: 'u-existing', email: 'Owner@Acme.example', invited_at: '2026-11-01T00:00:00Z' }] })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 409); assert.ok(r.body.error.startsWith('owner@acme.example already has an account.'))
    assert.strictEqual(db.rows('clients').length, 0); assert.strictEqual(emailsSent(db), 0); assert.strictEqual(db.deletedUsers.length, 0)
    assert.ok(db.usersById.has('u-existing'))
  })

  console.log('\n3. Rule U in the shared helper')
  const viewerInput = (over = {}) => Object.assign({
    name: 'Blue River', brand_website: 'blue-river.example', brand_aliases: ['Blue River'], known_competitors: [],
    plan: 'free', default_market_id: 'ES', default_region_id: 'ALL', contact_email: 'ana@blue-river.example',
    prompts: ['a1 prompt text here', 'a2 prompt text here'], onboarding_complete: true,
  }, over)
  const ctxFor = (over = {}) => Object.assign({ actor: null, source: 'explee-import', meta: { explee_person_id: 'p1' }, now: () => FIXED, random: () => 0.5 }, over)
  for (const [label, user] of [
    ['pending (invited, not confirmed)', { id: 'u-pending', email: 'ana@blue-river.example', invited_at: '2026-11-01T00:00:00Z' }],
    ['profile-less and confirmed', { id: 'u-noprofile', email: 'ana@blue-river.example', email_confirmed_at: '2026-10-01T00:00:00Z' }],
  ]) {
    await check(`existing ${label} user: email_registered, zero invites, zero deletes, user unchanged`, async () => {
      const db = makeDb({ users: [Object.assign({}, user)] })
      const before = JSON.stringify(db.usersById.get(user.id))
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
      assert.strictEqual(r.ok, false); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.stage, 'precheck')
      assert.strictEqual(emailsSent(db), 0); assert.strictEqual(db.deletedUsers.length, 0)
      assert.strictEqual(JSON.stringify(db.usersById.get(user.id)), before)
      assert.strictEqual(db.rows('clients').length, 0)
    })
  }
  await check('an invite returning a user that was in the pre-check set is never deleted and never bound', async () => {
    const existing = { id: 'u-race', email: 'other@blue-river.example', created_at: '2026-01-01T00:00:00Z' }
    const db = makeDb({ users: [existing], invite: async () => ({ data: { user: existing }, error: null }) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.code, 'email_registered')
    assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('user_profiles').length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('an invite returning an old user (created long before the call) is never deleted', async () => {
    const old = { id: 'u-old', email: 'ana@blue-river.example', created_at: '2025-01-01T00:00:00Z' }
    const db = makeDb({ invite: async () => ({ data: { user: old }, error: null }) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ authEmails: { set: new Set(), ids: new Set(), complete: true } }))
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('a user created by this call IS compensated on a later failure', async () => {
    const db = makeDb({ failInsert: ['user_profiles'] })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.code, 'db_error'); assert.strictEqual(r.stage, 'profile'); assert.strictEqual(db.deletedUsers.length, 1)
  })
  await check('an incomplete auth listing creates nothing', async () => {
    const db = makeDb()
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ authEmails: { set: new Set(), ids: new Set(), complete: false } }))
    assert.strictEqual(r.code, 'auth_lookup_incomplete'); assert.strictEqual(db.calls.length, 0); assert.strictEqual(emailsSent(db), 0)
  })
  await check('listUsers paging: a user on page 2 is still found', async () => {
    const db = makeDb()
    for (let i = 0; i < 1005; i++) db.usersById.set(`u${i}`, { id: `u${i}`, email: `user${i}@many.example` })
    db.usersById.set('u-target', { id: 'u-target', email: 'ana@blue-river.example' })
    const auth = await P.loadAuthEmails(db)
    assert.strictEqual(auth.complete, true); assert.ok(auth.set.has('ana@blue-river.example'))
  })
  await check('rate limit on the invite: email_rate_limited, client rolled back', async () => {
    const db = makeDb({ invite: async () => ({ data: { user: null }, error: { status: 429, message: 'too many' } }) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.code, 'email_rate_limited'); assert.strictEqual(db.rows('clients').length, 0)
  })

  console.log('\n4. viewer helper')
  await check('provisionViewerClient always writes viewer, even when input says admin', async () => {
    const db = makeDb()
    const r = await P.provisionViewerClient(db, viewerInput({ role: 'admin' }), ctxFor())
    assert.strictEqual(r.ok, true); assert.strictEqual(r.role, 'viewer'); assert.strictEqual(db.rows('user_profiles')[0].role, 'viewer')
    const c = db.rows('clients')[0]
    assert.strictEqual(c.plan, 'free'); assert.strictEqual(c.refresh_cadence, 'monthly'); assert.strictEqual(c.onboarding_complete, true)
    assert.strictEqual(c.last_refresh_at, FIXED.toISOString()); assert.strictEqual(c.slug, 'blue-river')
    const ev = db.rows('client_events')[0]
    assert.strictEqual(ev.meta.source, 'explee-import'); assert.strictEqual(ev.meta.explee_person_id, 'p1'); assert.strictEqual(ev.actor, null)
  })
  await check('a derived slug retries on 23505 with a suffix from the injected randomness', async () => {
    const db = makeDb()
    db.seed('clients', [{ name: 'Taken', slug: 'blue-river' }])
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, true); assert.strictEqual(r.client.slug, 'blue-river-ssss')
  })
  await check('an explicit slug does not retry', async () => {
    const db = makeDb()
    db.seed('clients', [{ name: 'Taken', slug: 'blue-river' }])
    const r = await P.provisionViewerClient(db, viewerInput({ slug: 'blue-river' }), ctxFor())
    assert.strictEqual(r.code, 'slug_taken')
  })
  await check('onStep is called with the client id, then the user id', async () => {
    const db = makeDb()
    const steps = []
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ onStep: async (s, ids) => { steps.push([s, Object.keys(ids)[0]]) } }))
    assert.strictEqual(r.ok, true); assert.deepStrictEqual(steps, [['client', 'clientId'], ['invite', 'userId']])
  })

  console.log('\n4b. revision 3: A1, the account name leads brand_aliases on both paths (criterion 46)')
  const A1_CASES = [
    [['acme', 'ACME STUDIO', 'acmestudio.example'], ['acme studio', 'acme', 'acmestudio.example']],
    [[], ['acme studio']],
    [['acme studio', 'x-acme'], ['acme studio', 'x-acme']],
  ]
  for (const [given, want] of A1_CASES) {
    await check(`provisionViewerClient and provisionAdminWizardClient: ${JSON.stringify(given)} -> ${JSON.stringify(want)}`, async () => {
      for (const fn of [P.provisionViewerClient, P.provisionAdminWizardClient]) {
        const db = makeDb()
        const r = await fn(db, viewerInput({ name: '  Acme Studio ', brand_aliases: given.slice(), brand_website: 'acmestudio.example', contact_email: 'ana@acmestudio.example' }), ctxFor())
        assert.strictEqual(r.ok, true, r.message)
        assert.deepStrictEqual(db.rows('clients')[0].brand_aliases, want)
      }
    })
  }
  await check('the wizard endpoint stores the name first (name absent from the aliases, then present in another case)', async () => {
    const one = await runScenario(newWizard.handler, wizardBody({ name: 'Acme Widgets', brand_aliases: ['Acme'] }), {})
    assert.deepStrictEqual(one.db.rows('clients')[0].brand_aliases, ['acme widgets', 'Acme'])
    const two = await runScenario(newWizard.handler, wizardBody({ name: 'Acme Widgets', brand_aliases: ['Acme', ' ACME Widgets '] }), {})
    assert.deepStrictEqual(two.db.rows('clients')[0].brand_aliases, ['acme widgets', 'Acme'])
  })

  console.log('\n4c. revision 3: onBeforeClient (criterion 32, helper part)')
  await check('onBeforeClient is awaited before EVERY insert attempt, slug retries included', async () => {
    const db = makeDb()
    db.seed('clients', [{ name: 'Taken', slug: 'blue-river' }])
    const log = []
    const origFrom = db.from
    db.from = (t) => { const q = origFrom(t); if (t === 'clients') { const ins = q.insert.bind(q); q.insert = (rows) => { log.push(`insert:${rows.slug}`); return ins(rows) } } return q }
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ onBeforeClient: async (slug) => { await new Promise((res) => setImmediate(res)); log.push(`before:${slug}`) } }))
    assert.strictEqual(r.ok, true)
    assert.deepStrictEqual(log, ['before:blue-river', 'insert:blue-river', 'before:blue-river-ssss', 'insert:blue-river-ssss'])
  })
  await check('a throwing onBeforeClient inserts nothing and invites nobody', async () => {
    const db = makeDb()
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ onBeforeClient: async () => { throw new Error('write failed') } }))
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'client'); assert.strictEqual(r.code, 'db_error')
    assert.strictEqual(db.rows('clients').length, 0); assert.strictEqual(emailsSent(db), 0)
  })
  await check('a failure after the invite carries the userId (C2, C3); one before it does not', async () => {
    const after = await P.provisionViewerClient(makeDb({ failInsert: ['user_profiles'] }), viewerInput(), ctxFor())
    assert.strictEqual(after.stage, 'profile'); assert.ok(after.userId); assert.strictEqual(after.inviteSent, true)
    const before = await P.provisionViewerClient(makeDb({ failInsert: ['clients'] }), viewerInput(), ctxFor())
    assert.strictEqual(before.stage, 'client'); assert.strictEqual(before.userId, undefined)
  })

  console.log('\n4d. revision 3: listUsers paging on the end marker (criterion 34)')
  function manyUsers(opts) {
    const db = createFakeSupabase(Object.assign({ now: () => FIXED, pagedListUsers: true }, opts))
    for (let i = 0; i < 2100; i++) db.usersById.set(`u${i}`, { id: `u${i}`, email: `user${i}@many.example` })
    // the 1,460th user sits on page 30 when 50 are served a page
    db.usersById.set('u1459', { id: 'u1459', email: 'ana@blue-river.example' })
    return track(db)
  }
  await check('pages capped at 50 with nextPage: a user on page 30 is found and the pre-check says email_registered', async () => {
    const db = manyUsers({ listUsersPageCap: 50, listUsersNextPage: true })
    const auth = await P.loadAuthEmails(db, { perPage: 1000, maxPages: 60 })
    assert.strictEqual(auth.complete, true); assert.ok(auth.set.has('ana@blue-river.example')); assert.strictEqual(auth.set.size, 2100)
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ authEmails: auth }))
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(emailsSent(db), 0)
  })
  await check('pages capped at 50 WITHOUT nextPage: the pass ends only at the first empty page and still finds it', async () => {
    const db = manyUsers({ listUsersPageCap: 50 })
    let calls = 0
    const orig = db.auth.admin.listUsers
    db.auth.admin.listUsers = async (a) => { calls++; return orig(a) }
    const auth = await P.loadAuthEmails(db, { perPage: 1000, maxPages: 60 })
    assert.strictEqual(auth.complete, true); assert.ok(auth.set.has('ana@blue-river.example'))
    assert.strictEqual(calls, 43, '42 full pages and one empty page')
  })
  await check('the 20 page cap reached before the end marker: complete false, auth_lookup_incomplete, 0 invites', async () => {
    const db = manyUsers({ listUsersPageCap: 50, listUsersNextPage: true })
    const auth = await P.loadAuthEmails(db)
    assert.strictEqual(auth.complete, false); assert.strictEqual(auth.error, 'page_cap')
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.code, 'auth_lookup_incomplete'); assert.strictEqual(emailsSent(db), 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('a short first page (GoTrue capping) never ends the pass by itself', async () => {
    const db = manyUsers({ listUsersPageCap: 50 })
    const auth = await P.loadAuthEmails(db, { perPage: 1000, maxPages: 2 })
    assert.strictEqual(auth.complete, false, 'two short pages of 50 must not read as the end')
  })

  console.log('\n5. source text')
  await check("importer and rules module: no 'admin' literal, no provisionAdminWizardClient import", async () => {
    for (const f of ['explee-import-background.js', '_explee_rules.js']) {
      const src = fs.readFileSync(path.join(FN, f), 'utf8')
      assert.ok(!/['"`]admin['"`]/.test(src), `${f} carries an admin literal`)
      assert.ok(!/provisionAdminWizardClient/.test(src), `${f} mentions provisionAdminWizardClient`)
    }
  })

  console.log('\n6. revision 4: V1, Check B before the invite and the "created by this call" rule (criterion 50, helper and wizard)')
  const T_INV = FIXED.getTime()
  const iso = (msOff) => new Date(T_INV + msOff).toISOString()
  // Idempotent: on the link run a hook can fire twice (generateLink, then a
  // restore or fallback inviteUserByEmail); the other call made the user and
  // its profile once, so a second firing adds nothing.
  const addUser = (db, u, withProfile) => {
    db.usersById.set(u.id, u)
    if (withProfile && !db.rows('user_profiles').some((p) => p.id === u.id)) db.seed('user_profiles', [{ id: u.id, client_id: 999, role: 'viewer' }])
  }
  await check('(c) a user made after Check B, returned by the invite (re-send), created 6 s before T_inv: not ours, 0 binds, 0 deletes, inviteSent', async () => {
    const u = { id: 'u-late', email: 'ana@blue-river.example', created_at: iso(-6000) }
    const db = makeDb({ inviteResendsPending: true, beforeInvite: async () => addUser(db, u, false) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(r.userId, undefined, 'a not-ours user is never reported as ours')
    assert.strictEqual(emailsSent(db), 1); assert.strictEqual(db.deletedUsers.length, 0)
    assert.strictEqual(db.rows('user_profiles').length, 0, 'not bound (was bound)'); assert.strictEqual(db.rows('clients').length, 0)
    assert.ok(db.usersById.has('u-late'))
  })
  await check('(d) created 1 s before T_inv with a profile already present: the profile insert answers 23505, user and profile untouched', async () => {
    const u = { id: 'u-own-profile', email: 'ana@blue-river.example', created_at: iso(-1000) }
    const db = makeDb({ inviteResendsPending: true, beforeInvite: async () => addUser(db, u, true) })
    const profileBefore = JSON.stringify(db.rows('user_profiles'))
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'profile'); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(db.deletedUsers.length, 0, 'the user is never deleted (was deleted)')
    assert.ok(db.usersById.has('u-own-profile'))
    assert.strictEqual(db.rows('user_profiles').length, 1); assert.strictEqual(db.rows('user_profiles')[0].client_id, 999)
    assert.notStrictEqual(profileBefore, JSON.stringify(db.rows('user_profiles')), 'sanity: the profile was added by the hook')
    assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('(e) the invite returns a NEW user with no created_at (stampCreatedAt off): not bound, not deleted, inviteSent', async () => {
    const db = makeDb({ stampCreatedAt: false })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(db.rows('user_profiles').length, 0, 'not bound (was bound)'); assert.strictEqual(db.deletedUsers.length, 0)
    assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('a user made between Check A and Check B (no invite yet): Check B finds it, 0 invites, client rolled back', async () => {
    let passes1 = 0
    const db = makeDb({ onListUsers: async (a) => { if (a && a.page === 1 && ++passes1 === 2) addUser(db, { id: 'u-mid', email: 'ana@blue-river.example', invited_at: iso(0) }, false) } })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'precheck'); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, undefined)
    assert.strictEqual(emailsSent(db), 0, 'no invite (was 1)'); assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('Check B ignores ctx.authEmails: an importer snapshot without the user still stops before the invite', async () => {
    const db = makeDb()
    addUser(db, { id: 'u-snap', email: 'ana@blue-river.example', invited_at: iso(0) }, true)
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ authEmails: { set: new Set(), ids: new Set(), complete: true } }))
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.stage, 'precheck')
    assert.strictEqual(emailsSent(db), 0); assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
    assert.strictEqual(db.rows('user_profiles').length, 1)
  })
  await check('Check B incomplete: client rolled back, auth_lookup_incomplete, 0 invites', async () => {
    let passes1 = 0
    const db = makeDb({ onListUsers: async (a) => { if (a && a.page === 1 && ++passes1 === 2) throw new Error('listing down') } })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'precheck'); assert.strictEqual(r.code, 'auth_lookup_incomplete')
    assert.strictEqual(emailsSent(db), 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('(f) the wizard for a new address: exactly 2 listUsers passes (Check A and Check B), the same 200 answer', async () => {
    let passCount = 0
    const db = makeDb({ now: WIZARD_CLOCK, onListUsers: async (a) => { if (a && a.page === 1) passCount++ } })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.prompts_created, 2)
    assert.strictEqual(passCount, 2)
    assert.strictEqual(emailsSent(db), 1); assert.strictEqual(db.rows('user_profiles').length, 1)
  })
  await check('(g) the wizard, a login made between Check A and Check B: the existing 409 email text, 0 invites, 0 deletes', async () => {
    let passes1 = 0
    const db = makeDb({ onListUsers: async (a) => { if (a && a.page === 1 && ++passes1 === 2) addUser(db, { id: 'u-w', email: 'owner@acme.example', invited_at: iso(0) }, true) } })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 409); assert.ok(r.body.error.startsWith('owner@acme.example already has an account.'))
    assert.strictEqual(emailsSent(db), 0); assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('the wizard maps a not-ours invite (inviteSent) to the same 409 email text', async () => {
    const db = makeDb({ stampCreatedAt: false })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 409); assert.ok(r.body.error.startsWith('owner@acme.example already has an account.'))
    assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('source text: no FRESH_WINDOW_MS; onStep(\'client\'), channelReady, Check B, the invite call, the "ours" test, deliverInvite, onStep(\'invite\') in that order', async () => {
    const src = fs.readFileSync(path.join(FN, '_provision_client.js'), 'utf8')
    assert.ok(!/FRESH_WINDOW_MS/.test(src), 'FRESH_WINDOW_MS is gone')
    assert.ok(/OURS_SKEW_MS\s*=\s*5000/.test(src), 'OURS_SKEW_MS = 5000')
    // CHANGED ON PURPOSE (spec section 10): the first call after Check B may be
    // generateLink( or inviteUserByEmail(; channelReady sits before Check B
    // and deliverInvite between the "ours" test and onStep('invite').
    const a = src.indexOf("onStep('client'")
    const r = src.indexOf('channelReady(supabase', a)
    const b = src.indexOf('loadAuthEmails(supabase', a)
    const firstAfter = (needles, from) => Math.min(...needles.map((n) => src.indexOf(n, from)).filter((i) => i >= 0))
    const c = firstAfter(['generateLink(', 'inviteUserByEmail('], b)
    const o = src.indexOf('const ours =', c)
    const d = src.indexOf('deliverInvite(', o)
    const s = src.indexOf("onStep('invite'", o)
    assert.ok(a > 0 && r > a && b > r && c > b, `onStep('client') ${a}, channelReady ${r}, Check B ${b}, invite ${c}`)
    assert.ok(o > c && d > o && s > d, `ours ${o}, deliverInvite ${d}, onStep('invite') ${s}`)
  })

  await linkCases(viewerInput, ctxFor, iso, addUser)
}

// ── 7. the 7 day invite link in provisioning (spec 6.4 and section 10) ─────
async function linkCases(viewerInput, ctxFor, iso, addUser) {
  console.log(`\n7. 7 day invite link, ${MODE} run`)
  if (MODE === 'supabase') {
    await check('kill switch: a viewer gets today\'s inviteUserByEmail, no link row, no readiness read, no generateLink, invite_channel supabase', async () => {
      const db = makeDb()
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
      assert.strictEqual(r.ok, true, r.message); assert.strictEqual(r.inviteChannel, 'supabase')
      assert.strictEqual(db.invites.length, 1); assert.strictEqual(inviteLinks(db).length, 0); assert.strictEqual(db.resendCalls.length, 0)
      assert.strictEqual(db.calls.filter((c) => c.table === 'client_invite_links').length, 0)
      assert.strictEqual(db.rows('client_events')[0].meta.invite_channel, 'supabase')
    })
    return
  }
  await check('viewer, channel on: generateLink creates the user, one Resend email, zero inviteUserByEmail, one active 7 day row', async () => {
    const db = makeDb()
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, true, r.message); assert.strictEqual(r.inviteChannel, 'brandgeo')
    assert.deepStrictEqual(inviteLinks(db).map((g) => [g.email, g.redirectTo]), [['ana@blue-river.example', 'https://app.getbrandgeo.com/reset-password']])
    assert.deepStrictEqual(db.resendCalls, [{ to: 'ana@blue-river.example', ok: true }])
    assert.strictEqual(db.invites.length, 0)
    assert.strictEqual(usersCreatedByAuth(db), 1); assert.strictEqual(emailsSent(db), 1)
    const rows = db.rows('client_invite_links')
    assert.strictEqual(rows.length, 1)
    assert.deepStrictEqual([rows[0].user_id, rows[0].client_id, rows[0].source, rows[0].created_by, rows[0].revoked_at, rows[0].accepted_at], [r.userId, r.client.id, 'explee-import', null, null, null])
    assert.strictEqual(Date.parse(rows[0].expires_at) - Date.parse(rows[0].created_at), 7 * 24 * 3600 * 1000)
    assert.strictEqual(db.rows('client_events')[0].meta.invite_channel, 'brandgeo')
  })
  await check('the wizard passes its source and actor into the row', async () => {
    const db = makeDb({ now: WIZARD_CLOCK })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 200)
    const row = db.rows('client_invite_links')[0]
    assert.strictEqual(row.source, 'onboard-client'); assert.strictEqual(row.created_by, ADMIN_ID)
  })
  await check('admin role, channel on: inviteUserByEmail only, no link row, no Resend', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, viewerInput({ role: 'admin' }), ctxFor())
    assert.strictEqual(r.ok, true, r.message); assert.strictEqual(r.role, 'admin'); assert.strictEqual(r.inviteChannel, 'supabase')
    assert.strictEqual(db.invites.length, 1); assert.strictEqual(inviteLinks(db).length, 0); assert.strictEqual(db.resendCalls.length, 0)
    assert.strictEqual(db.rows('client_invite_links').length, 0)
  })
  for (const code of ['42P01', 'PGRST205']) {
    await check(`table missing (${code}), channel on: today's inviteUserByEmail only, no generateLink, no Resend (M3)`, async () => {
      const db = makeDb()
      db.missingTables = { client_invite_links: code }
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
      assert.strictEqual(r.ok, true, r.message); assert.strictEqual(r.inviteChannel, 'supabase')
      assert.strictEqual(db.invites.length, 1); assert.strictEqual(inviteLinks(db).length, 0); assert.strictEqual(db.resendCalls.length, 0)
    })
  }
  await check('Resend refuses, the Supabase fallback answers: created, invite_channel supabase, 1 generateLink, 1 Resend refusal, 1 inviteUserByEmail', async () => {
    emailImpl = async () => ({ ok: false, error: 'Resend HTTP 422' })
    try {
      const db = makeDb({ inviteResendsPending: true })
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
      assert.strictEqual(r.ok, true, r.message); assert.strictEqual(r.inviteChannel, 'supabase')
      assert.strictEqual(inviteLinks(db).length, 1); assert.deepStrictEqual(db.resendCalls.map((x) => x.ok), [false]); assert.strictEqual(db.invites.length, 1)
      assert.strictEqual(usersCreatedByAuth(db), 1); assert.strictEqual(emailsSent(db), 1)
      assert.strictEqual(db.rows('client_invite_links')[0].revoked_reason, 'send_failed')
      assert.strictEqual(db.rows('client_events')[0].meta.invite_channel, 'supabase')
    } finally { emailImpl = async () => ({ ok: true, id: 'em_test' }) }
  })
  await check('delivery failure (Resend refuses, the fallback errors): stage invite, invite_error, no userId, no inviteSent, user and client deleted', async () => {
    emailImpl = async () => ({ ok: false, error: 'Resend HTTP 500' })
    try {
      const db = makeDb()
      const steps = []
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ onStep: async (s) => { steps.push(s) } }))
      assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'invite'); assert.strictEqual(r.code, 'invite_error')
      assert.strictEqual(r.userId, undefined); assert.strictEqual(r.inviteSent, undefined)
      assert.strictEqual(db.deletedUsers.length, 1); assert.strictEqual(db.rows('clients').length, 0)
      assert.strictEqual(db.rows('user_profiles').length, 0); assert.strictEqual(emailsSent(db), 0)
      assert.deepStrictEqual(steps, ['client'], 'onStep(invite) never runs when no email went out')
    } finally { emailImpl = async () => ({ ok: true, id: 'em_test' }) }
  })
  await check('delivery failure with a rate-limited fallback: email_rate_limited, no userId, user and client deleted', async () => {
    emailImpl = async () => ({ ok: false, error: 'Resend HTTP 500' })
    try {
      let n = 0
      const db = makeDb({ invite: async () => (++n === 2 ? { data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } } : undefined) })
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
      assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'invite'); assert.strictEqual(r.code, 'email_rate_limited')
      assert.strictEqual(r.userId, undefined); assert.strictEqual(db.deletedUsers.length, 1); assert.strictEqual(db.rows('clients').length, 0)
    } finally { emailImpl = async () => ({ ok: true, id: 'em_test' }) }
  })
  await check('"not ours" on the generateLink branch: exactly one inviteUserByEmail (the restore), zero Resend, inviteSent true', async () => {
    const u = { id: 'u-late2', email: 'ana@blue-river.example', created_at: iso(-6000) }
    const db = makeDb({ inviteResendsPending: true, beforeInvite: async () => addUser(db, u, false) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true); assert.strictEqual(r.userId, undefined)
    assert.strictEqual(inviteLinks(db).length, 1); assert.strictEqual(db.invites.length, 1); assert.strictEqual(db.resendCalls.length, 0)
    assert.strictEqual(db.rows('client_invite_links').length, 0); assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('"not ours" on the generateLink branch with a failed restore: still email_registered with inviteSent true', async () => {
    const db = makeDb({ stampCreatedAt: false })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(inviteLinks(db).length, 1); assert.strictEqual(db.invites.length, 1, 'the restore was tried once'); assert.strictEqual(emailsSent(db), 0, 'and it failed')
    assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })

  // Server review LOW-1 (docs/qa/invite-link-7-days-server-review-2026-11-13.md).
  // Two calls for one address inside the 5 s "ours" window: the hook stands for
  // the OTHER call, which made the user (created 1 s before T_inv, so this call
  // judges it ours) and its profile.
  const REGISTERED = 'an auth user already exists for this address'
  await check('LOW-1 (a) delivery failure (Resend refuses, fallback 429) for a user that already has a profile: the user is kept, only the client is deleted, email_registered with inviteSent', async () => {
    emailImpl = async () => ({ ok: false, error: 'Resend HTTP 500' })
    try {
      const u = { id: 'u-other-call', email: 'ana@blue-river.example', created_at: iso(-1000) }
      let n = 0
      const db = makeDb({
        inviteResendsPending: true,
        beforeInvite: async () => addUser(db, u, true),
        invite: async () => (++n === 2 ? { data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } } : undefined),
      })
      const steps = []
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ onStep: async (s) => { steps.push(s) } }))
      assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'invite'); assert.strictEqual(r.code, 'email_registered')
      assert.strictEqual(r.message, REGISTERED); assert.strictEqual(r.inviteSent, true); assert.strictEqual(r.userId, undefined)
      assert.strictEqual(n, 2, 'sanity: generateLink, then the fallback inviteUserByEmail')
      assert.strictEqual(inviteLinks(db).length, 1); assert.deepStrictEqual(db.resendCalls.map((x) => x.ok), [false]); assert.strictEqual(db.invites.length, 1)
      assert.strictEqual(db.deletedUsers.length, 0, 'the other call\'s user is never deleted (was deleted)')
      assert.ok(db.usersById.has('u-other-call'))
      assert.strictEqual(db.rows('user_profiles').length, 1); assert.strictEqual(db.rows('user_profiles')[0].client_id, 999)
      assert.strictEqual(db.rows('clients').length, 0)
      assert.deepStrictEqual(steps, ['client'])
    } finally { emailImpl = async () => ({ ok: true, id: 'em_test' }) }
  })
  await check('LOW-1 (a) delivery failure when the profile read errors: the user is kept, only the client is deleted, email_registered with inviteSent', async () => {
    emailImpl = async () => ({ ok: false, error: 'Resend HTTP 500' })
    try {
      const db = makeDb()
      db.faults.push({ table: 'user_profiles', op: 'select', error: { message: 'profile read refused' } })
      const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
      assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'invite'); assert.strictEqual(r.code, 'email_registered')
      assert.strictEqual(r.message, REGISTERED); assert.strictEqual(r.inviteSent, true); assert.strictEqual(r.userId, undefined)
      assert.strictEqual(db.deletedUsers.length, 0, 'an unreadable profile never licenses a delete')
      assert.strictEqual(usersCreatedByAuth(db), 1); assert.strictEqual(db.rows('clients').length, 0)
      assert.ok(db.calls.some((c) => c.table === 'user_profiles' && c.op === 'select'), 'sanity: the profile read ran')
    } finally { emailImpl = async () => ({ ok: true, id: 'em_test' }) }
  })
  await check('LOW-1 (b) profile unique violation on the link run: one Resend email, then exactly one restore inviteUserByEmail; user and profile untouched; the same answer', async () => {
    const u = { id: 'u-own-profile2', email: 'ana@blue-river.example', created_at: iso(-1000) }
    const db = makeDb({ inviteResendsPending: true, beforeInvite: async () => addUser(db, u, true) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'profile'); assert.strictEqual(r.code, 'email_registered')
    assert.strictEqual(r.message, REGISTERED); assert.strictEqual(r.inviteSent, true); assert.strictEqual(r.userId, undefined)
    assert.strictEqual(inviteLinks(db).length, 1); assert.deepStrictEqual(db.resendCalls, [{ to: 'ana@blue-river.example', ok: true }])
    assert.deepStrictEqual(db.invites, [{ email: 'ana@blue-river.example', redirectTo: 'https://app.getbrandgeo.com/reset-password' }], 'exactly one restore')
    assert.strictEqual(emailsSent(db), 2); assert.deepStrictEqual(emailAddresses(db), ['ana@blue-river.example', 'ana@blue-river.example'])
    assert.strictEqual(db.deletedUsers.length, 0); assert.ok(db.usersById.has('u-own-profile2'))
    assert.strictEqual(db.rows('user_profiles').length, 1); assert.strictEqual(db.rows('user_profiles')[0].client_id, 999)
    assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('LOW-1 (b) the same with a failed restore (429): the answer is unchanged, the restore was tried once', async () => {
    const u = { id: 'u-own-profile3', email: 'ana@blue-river.example', created_at: iso(-1000) }
    let n = 0
    const db = makeDb({
      inviteResendsPending: true,
      beforeInvite: async () => addUser(db, u, true),
      invite: async () => (++n === 2 ? { data: { user: null }, error: { status: 429, message: 'email rate limit exceeded' } } : undefined),
    })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'profile'); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(n, 2); assert.strictEqual(db.invites.length, 1); assert.strictEqual(emailsSent(db), 1, 'only the Resend email went out')
    assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
}

async function main() {
  for (const mode of ['supabase', 'link']) {
    setMode(mode)
    console.log(`\n==== run: ${mode === 'supabase' ? 'INVITE_LINK_CHANNEL=supabase (today\'s path)' : 'channel on, dummy Resend key, Resend stubbed'} ====`)
    await suite()
  }
  setMode('supabase')
  console.log(`\n${passes} passed, ${failures} failed`)
  if (failures) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
