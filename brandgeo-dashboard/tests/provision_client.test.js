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
  return db
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

async function main() {
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
        assert.deepStrictEqual(sideEffects(b.db), sideEffects(a.db), 'side-effect order')
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
        assert.deepStrictEqual(strip(b.db.rows('client_events'), ['id', 'created_at', 'client_id']), strip(a.db.rows('client_events'), ['id', 'created_at', 'client_id']), 'audit rows')
        assert.deepStrictEqual(b.db.invites, a.db.invites, 'invites and redirect')
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
    assert.deepStrictEqual(sideEffects(db), ['clients:insert', 'auth:invite', 'user_profiles:insert', 'prompts:insert', 'client_events:insert'])
    assert.deepStrictEqual(db.invites, [{ email: 'owner@acme.example', redirectTo: 'https://app.getbrandgeo.com/reset-password' }])
    const c = db.rows('clients')[0]
    assert.deepStrictEqual(Object.keys(strip([c])[0]).filter((k) => !['stripe_customer_id', 'stripe_subscription_id'].includes(k)).sort(),
      ['brand_aliases', 'brand_website', 'default_market_id', 'default_region_id', 'known_competitors', 'name', 'plan', 'refresh_cadence', 'slug'].sort())
    assert.strictEqual(c.last_refresh_at.length, 24)
    assert.strictEqual(db.rows('user_profiles')[0].role, 'viewer')
    const ev = db.rows('client_events')[0]
    assert.deepStrictEqual(Object.keys(ev.meta).sort(), ['default_market_id', 'plan_provided', 'prompts_created', 'refresh_cadence', 'role', 'slug', 'source'])
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
    assert.strictEqual(db.rows('clients').length, 0); assert.strictEqual(db.invites.length, 0); assert.strictEqual(db.deletedUsers.length, 0)
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
      assert.strictEqual(db.invites.length, 0); assert.strictEqual(db.deletedUsers.length, 0)
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
    assert.strictEqual(r.code, 'auth_lookup_incomplete'); assert.strictEqual(db.calls.length, 0); assert.strictEqual(db.invites.length, 0)
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
    assert.strictEqual(db.rows('clients').length, 0); assert.strictEqual(db.invites.length, 0)
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
    return db
  }
  await check('pages capped at 50 with nextPage: a user on page 30 is found and the pre-check says email_registered', async () => {
    const db = manyUsers({ listUsersPageCap: 50, listUsersNextPage: true })
    const auth = await P.loadAuthEmails(db, { perPage: 1000, maxPages: 60 })
    assert.strictEqual(auth.complete, true); assert.ok(auth.set.has('ana@blue-river.example')); assert.strictEqual(auth.set.size, 2100)
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ authEmails: auth }))
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(db.invites.length, 0)
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
    assert.strictEqual(r.code, 'auth_lookup_incomplete'); assert.strictEqual(db.invites.length, 0); assert.strictEqual(db.rows('clients').length, 0)
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
  const addUser = (db, u, withProfile) => {
    db.usersById.set(u.id, u)
    if (withProfile) db.seed('user_profiles', [{ id: u.id, client_id: 999, role: 'viewer' }])
  }
  await check('(c) a user made after Check B, returned by the invite (re-send), created 6 s before T_inv: not ours, 0 binds, 0 deletes, inviteSent', async () => {
    const u = { id: 'u-late', email: 'ana@blue-river.example', created_at: iso(-6000) }
    const db = makeDb({ inviteResendsPending: true, beforeInvite: async () => addUser(db, u, false) })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(r.userId, undefined, 'a not-ours user is never reported as ours')
    assert.strictEqual(db.invites.length, 1); assert.strictEqual(db.deletedUsers.length, 0)
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
    assert.strictEqual(db.invites.length, 0, 'no invite (was 1)'); assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('Check B ignores ctx.authEmails: an importer snapshot without the user still stops before the invite', async () => {
    const db = makeDb()
    addUser(db, { id: 'u-snap', email: 'ana@blue-river.example', invited_at: iso(0) }, true)
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor({ authEmails: { set: new Set(), ids: new Set(), complete: true } }))
    assert.strictEqual(r.code, 'email_registered'); assert.strictEqual(r.stage, 'precheck')
    assert.strictEqual(db.invites.length, 0); assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
    assert.strictEqual(db.rows('user_profiles').length, 1)
  })
  await check('Check B incomplete: client rolled back, auth_lookup_incomplete, 0 invites', async () => {
    let passes1 = 0
    const db = makeDb({ onListUsers: async (a) => { if (a && a.page === 1 && ++passes1 === 2) throw new Error('listing down') } })
    const r = await P.provisionViewerClient(db, viewerInput(), ctxFor())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'precheck'); assert.strictEqual(r.code, 'auth_lookup_incomplete')
    assert.strictEqual(db.invites.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('(f) the wizard for a new address: exactly 2 listUsers passes (Check A and Check B), the same 200 answer', async () => {
    let passCount = 0
    const db = makeDb({ now: WIZARD_CLOCK, onListUsers: async (a) => { if (a && a.page === 1) passCount++ } })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 200); assert.strictEqual(r.body.prompts_created, 2)
    assert.strictEqual(passCount, 2)
    assert.strictEqual(db.invites.length, 1); assert.strictEqual(db.rows('user_profiles').length, 1)
  })
  await check('(g) the wizard, a login made between Check A and Check B: the existing 409 email text, 0 invites, 0 deletes', async () => {
    let passes1 = 0
    const db = makeDb({ onListUsers: async (a) => { if (a && a.page === 1 && ++passes1 === 2) addUser(db, { id: 'u-w', email: 'owner@acme.example', invited_at: iso(0) }, true) } })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 409); assert.ok(r.body.error.startsWith('owner@acme.example already has an account.'))
    assert.strictEqual(db.invites.length, 0); assert.strictEqual(db.deletedUsers.length, 0); assert.strictEqual(db.rows('clients').length, 0)
  })
  await check('the wizard maps a not-ours invite (inviteSent) to the same 409 email text', async () => {
    const db = makeDb({ stampCreatedAt: false })
    const r = await runWizard(newWizard.handler, db, wizardBody())
    assert.strictEqual(r.status, 409); assert.ok(r.body.error.startsWith('owner@acme.example already has an account.'))
    assert.strictEqual(db.deletedUsers.length, 0)
  })
  await check('source text: no FRESH_WINDOW_MS, and loadAuthEmails is called between onStep(\'client\') and inviteUserByEmail', async () => {
    const src = fs.readFileSync(path.join(FN, '_provision_client.js'), 'utf8')
    assert.ok(!/FRESH_WINDOW_MS/.test(src), 'FRESH_WINDOW_MS is gone')
    assert.ok(/OURS_SKEW_MS\s*=\s*5000/.test(src), 'OURS_SKEW_MS = 5000')
    const a = src.indexOf("onStep('client'")
    const b = src.indexOf('loadAuthEmails(supabase', a)
    const c = src.indexOf('inviteUserByEmail(', a)
    assert.ok(a > 0 && b > a && c > b, `onStep('client') ${a}, Check B ${b}, invite ${c}`)
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  if (failures) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
