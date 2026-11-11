/**
 * explee_import.test.js: the Explee lead import run loop end to end against
 * an in-memory Supabase (tests/helpers/fake_supabase_mem.js, opt-in
 * extensions) and an in-memory Explee (tests/helpers/fake_explee.js) driven
 * through the real _explee_client.js. docs/arch/explee-lead-import.md,
 * revision 3, criteria 6 to 10 and 13 to 20, plus the live label set, and
 * the revision 3 criteria 27 to 33, 35, 36 and 39 to 48 (sections 12 to 29).
 * Run from brandgeo-dashboard/:  node tests/explee_import.test.js
 *
 * Real modules: the importer, _explee_rules, _explee_client, _provision_client,
 * _cost, _auth.checkCollectionLimits, _enqueue.enqueueClientCollection and,
 * for the OpenAI invariant, _prospect_prompts.generateClientPrompts with a
 * captured fetch. Stubbed: triggerWorker (counted), admin notifications
 * (captured), the homepage fetch.
 *
 * Every timestamp comes from a test clock over fixed dates. No test reads the
 * real date. Fixtures use example.com style addresses and invented companies.
 */
const assert = require('assert')
const path = require('path')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const { createFakeExplee } = require('./helpers/fake_explee')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
process.env.CRON_SECRET = 'test-cron-secret-placeholder'
process.env.OPENAI_API_KEY = 'test-openai-placeholder'
delete process.env.SENTRY_DSN
delete process.env.EXPLEE_API_KEY

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const importer = require(path.join(FN, 'explee-import-background.js'))
const { createExpleeClient, ExpleeError, ALLOWED_CALLS } = require(path.join(FN, '_explee_client.js'))
const auth = require(path.join(FN, '_auth.js'))
const enq = require(path.join(FN, '_enqueue.js'))
const pp = require(path.join(FN, '_prospect_prompts.js'))
const P = require(path.join(FN, '_provision_client.js'))
const R = require(path.join(FN, '_explee_rules.js'))
const fs = require('fs')

let passes = 0
let failures = 0
async function check(name, fn) {
  try { await fn(); passes++; console.log(`  ok   ${name}`) } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n       ') : e}`) }
}

const MARKETS = [
  { id: 'WW', regions: [{ id: 'ALL' }] }, { id: 'ES', regions: [{ id: 'ALL' }, { id: 'MAD' }] },
  { id: 'GB', regions: [{ id: 'ALL' }] }, { id: 'DE', regions: [{ id: 'ALL' }] },
]
const GOOD_PROMPTS = [
  'best widget suppliers for small workshops in Spain',
  'which widget makers deliver fast across Europe',
  'top rated industrial widget manufacturers this year',
  'affordable custom widgets for hardware startups',
  'reliable widget wholesalers with low minimum orders',
  'how to choose a widget supplier for prototypes',
  'recommended widget brands for outdoor equipment',
  'where to buy durable widgets in bulk online',
]
const REPLY_SENTENCE = 'Sounds interesting, we are reviewing our widget pricing this quarter.'

function makeClock(iso) {
  const c = { t: Date.parse(iso) }
  c.now = () => new Date(c.t)
  c.set = (x) => { c.t = Date.parse(x) }
  c.add = (msAdd) => { c.t += msAdd }
  return c
}

function settingsRow(over = {}) {
  return Object.assign({
    id: true, mode: 'dry_run', project_ids: [11], include_intents: ['hot_lead'],
    referral_intents: ['out_of_office', 'email_changed'], exclude_intents: ['not_interested', 'unsubscribe'],
    unknown_label_policy: 'hold', max_creates_per_run: 5, max_creates_per_day: 30, max_referrals_per_run: 1,
    max_threads_per_run: 100, max_inbox_pages: 50, max_dry_payloads_per_run: 5, max_reconcile_per_day: 100,
    note_enabled: true, follow_up_enabled: false, follow_up_body: null, follow_up_delay_min: 60,
    paused_until: null, last_summary_date: null, last_reconcile_date: null, last_me_at: null,
  }, over)
}

let uuidN = 0
function env({ mode = 'dry_run', settings = {}, clockIso = '2026-11-11T05:00:00Z', key = 'test-explee-key', noSettings = false, authBehaviour = null, sbOpts = {}, fxOpts = {} } = {}) {
  const clock = makeClock(clockIso)
  // rev 4, V1: stampCreatedAt on by default (a user the invite creates carries
  // created_at from the injected clock, as GoTrue would); a case that needs
  // it off passes sbOpts: { stampCreatedAt: false }.
  const db = createFakeSupabase(Object.assign({ now: clock.now, sumCostEur: true, pagedListUsers: true, extraUnique: { clients: [['slug']] }, authBehaviour, stampCreatedAt: true }, sbOpts))
  if (!noSettings) db.seed('explee_import_settings', [settingsRow(Object.assign({ mode }, settings))])
  // rev 3, M3: every Explee call may "take" e.delayMs on the injected clock;
  // e.callStarts records the elapsed time at which each call started.
  const timing = { delayMs: 0, runStart: clock.t, callStarts: [] }
  const fx = createFakeExplee(Object.assign({
    onCall: (entry) => { timing.callStarts.push({ path: entry.path, method: entry.method, elapsed: clock.t - timing.runStart }); clock.t += timing.delayMs },
  }, fxOpts))
  const events = []
  const openai = []
  const worker = { n: 0 }
  const e = { clock, db, fx, events, openai, worker, key, timing }
  e.deps = (over = {}) => Object.assign({
    supabase: db,
    now: clock.now,
    getKey: () => e.key,
    makeExplee: ({ write }) => createExpleeClient({ write, fetchImpl: fx.fetch, sleep: async () => {}, getKey: () => e.key }),
    markets: MARKETS,
    fetchHomepage: async () => ({ signal: 'Widgets for workshops and makers', ogSiteName: null }),
    generatePrompts: (domain, opts) => pp.generateClientPrompts(domain, Object.assign({}, opts, { fetchImpl: e.openaiFetch })),
    checkCollectionLimits: auth.checkCollectionLimits,
    enqueueClientCollection: enq.enqueueClientCollection,
    triggerWorker: async () => { worker.n++ },
    notify: async (_sb, evt) => { events.push(evt) },
    provision: P.provisionViewerClient,
    loadAuthEmails: P.loadAuthEmails,
    random: () => 0.5,
    uuid: () => `00000000-0000-4000-8000-${String(++uuidN).padStart(12, '0')}`,
    invId: 'TEST',
  }, over)
  e.openaiPrompts = GOOD_PROMPTS
  e.openaiFetch = async (url, init) => {
    openai.push({ url, body: init.body })
    return { ok: true, status: 200, async json() { return { choices: [{ message: { content: JSON.stringify({ brand_name: '', prompts: e.openaiPrompts }) } }] } } }
  }
  e.run = (over, opts) => { timing.runStart = clock.t; timing.callStarts = []; return importer.runImport(e.deps(over), opts || {}) }
  e.setSettings = (patch) => Object.assign(db.rows('explee_import_settings')[0], patch)
  e.lead = (personId) => db.rows('explee_leads').find((r) => r.person_id === personId)
  e.jobRuns = () => db.rows('job_runs')
  return e
}

/** One replied lead. email null means the inbox does not reveal it. */
function addLead(e, i, { intent = 'hot_lead', email, from, company, body = REPLY_SENTENCE, country = 'ES', ts, status = null, projectId = 11 } = {}) {
  const domain = company || `co${i}.example`
  const replier = email === undefined ? `lead${i}@${domain}` : email
  const fromAddr = from || replier || `lead${i}@${domain}`
  const at = ts || new Date(Date.parse('2026-10-01T00:00:00Z') + i * 60000).toISOString()
  e.fx.addLead({
    projectId, campaignId: 21, personId: `p${i}`,
    item: { email: replier, latest_intent: intent, latest_reply_at: at, lead_status: status, name: `Person ${i}` },
    thread: {
      latest_intent: intent,
      messages: [
        { type: 'sent', from_email: 'outreach@brandgeo.example', to_email: fromAddr, cc: [], body_text: 'Hello from the outreach team', intent: null, ts: '2026-09-30T00:00:00Z' },
        { type: 'reply', from_email: fromAddr, to_email: 'outreach@brandgeo.example', cc: [], body_text: body, intent, ts: at },
      ],
      lead: { erased: false, name: `Person ${i}`, email: `enriched${i}@${domain}`, company_name: `Company ${i} Ltd`, company_domain: domain, country, note: null },
    },
  })
}

const writtenTables = (db) => new Set(db.calls.filter((c) => c.table && c.op !== 'select').map((c) => c.table))
const lastRun = (e) => e.jobRuns()[e.jobRuns().length - 1]

async function main() {
  console.log('\n1. gate, modes, settings (criterion 17)')
  await check('a refused gate writes no job_runs row and builds no deps', async () => {
    const e = env()
    let built = 0
    importer._handler._depsFactory = () => { built++; return e.deps() }
    const r1 = await importer._handler({ httpMethod: 'POST', headers: { 'x-cron-key': 'wrong-key-placeholder-wrong-key-x' }, body: '{}' })
    const r2 = await importer._handler({ httpMethod: 'GET', headers: {}, body: '' })
    assert.strictEqual(r1.statusCode, 401); assert.strictEqual(r2.statusCode, 405)
    assert.strictEqual(built, 0); assert.strictEqual(e.jobRuns().length, 0)
    importer._handler._depsFactory = null
  })
  await check('the gate passes with the right key and the body may only lower live to dry_run', async () => {
    const e = env({ mode: 'live', settings: { project_ids: [] } })
    importer._handler._depsFactory = () => e.deps()
    await importer._handler({ httpMethod: 'POST', headers: { 'x-cron-key': process.env.CRON_SECRET }, body: '{"mode":"dry_run"}' })
    await importer._handler({ httpMethod: 'POST', headers: { 'x-cron-key': process.env.CRON_SECRET }, body: '{"mode":"live"}' })
    importer._handler._depsFactory = null
    assert.strictEqual(e.jobRuns().length, 2)
    assert.strictEqual(e.jobRuns()[0].detail.mode, 'dry_run'); assert.strictEqual(e.jobRuns()[1].detail.mode, 'live')
  })
  for (const [name, opts] of [['mode off with a key', { mode: 'off' }], ['mode off without a key', { mode: 'off', key: null }], ['a missing settings row', { noSettings: true }], ["mode 'bogus'", { mode: 'bogus' }]]) {
    await check(`${name}: exactly one job_runs row ok=true skipped=off, purge ran, no Explee call`, async () => {
      const e = env(opts)
      e.key = opts.key === null ? null : 'test-explee-key'
      e.db.seed('explee_leads', [{ person_id: 'old1', project_id: 11, state: 'decided', decision: 'skipped', reason: 'unknown_intent', final: false, reply_excerpt: 'old words', decided_at: '2026-10-01T00:00:00Z', first_seen_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }])
      await e.run()
      assert.strictEqual(e.jobRuns().length, 1)
      assert.strictEqual(lastRun(e).ok, true); assert.strictEqual(lastRun(e).detail.skipped, 'off')
      assert.strictEqual(e.lead('old1').reply_excerpt, null); assert.strictEqual(lastRun(e).detail.purged.excerpts, 1)
      assert.strictEqual(e.fx.log.length, 0)
    })
  }
  await check('no key in dry_run: ok=false stage=config, no Explee call', async () => {
    const e = env()
    e.key = null
    await e.run()
    assert.strictEqual(lastRun(e).ok, false); assert.strictEqual(lastRun(e).detail.stage, 'config'); assert.strictEqual(lastRun(e).detail.error, 'missing_key')
    assert.strictEqual(e.fx.log.length, 0)
  })
  await check('an exception inside the run gives ok=false and a normal return', async () => {
    const e = env()
    addLead(e, 1)
    const r = await e.run({ loadAuthEmails: async () => { throw new TypeError('boom') } })
    assert.strictEqual(r.ok, false); assert.strictEqual(lastRun(e).ok, false); assert.strictEqual(lastRun(e).detail.error, 'unhandled')
  })
  await check('paused: ok=true skipped=paused, nothing listed', async () => {
    const e = env({ settings: { paused_until: '2026-11-11T06:00:00Z' } })
    addLead(e, 1)
    await e.run()
    assert.strictEqual(lastRun(e).detail.skipped, 'paused')
    assert.ok(!e.fx.log.some((l) => l.path.includes('/inbox')))
  })

  console.log('\n2. projects (criterion 7)')
  await check('project_ids empty: only the projects list is read, projectsVisible recorded, nothing decided', async () => {
    const e = env({ settings: { project_ids: [] } })
    addLead(e, 1)
    await e.run()
    const r = lastRun(e)
    assert.strictEqual(r.ok, true); assert.strictEqual(r.detail.skipped, 'no_projects')
    assert.deepStrictEqual(r.detail.projectsVisible, [{ id: 11, name: 'Outreach test', domain: 'brandgeo.example' }])
    assert.deepStrictEqual(e.fx.log.map((l) => `${l.method} ${l.path}`), ['GET /autogtm/projects'])
    assert.strictEqual(e.db.rows('explee_leads').length, 0)
  })
  await check('a conversation of an unlisted project is never read; a listed id the key cannot see is recorded', async () => {
    const e = env({ settings: { project_ids: [11, 99] } })
    e.fx.projects.push({ id: 12, name: 'Other', domain: null })
    addLead(e, 1)
    addLead(e, 2, { projectId: 12 })
    await e.run()
    assert.ok(!e.fx.log.some((l) => l.path.includes('/projects/12') || l.path.includes('/p2')))
    assert.deepStrictEqual(lastRun(e).detail.projectsMissing, [99])
    assert.ok(!e.lead('p2'))
  })

  console.log('\n3. the live label set, dry run (L, criterion 13)')
  await check('17 classified conversations decide as the owner ruled', async () => {
    const e = env({ settings: { max_dry_payloads_per_run: 20 } })
    let i = 0
    for (let k = 0; k < 5; k++) addLead(e, ++i, { intent: 'hot_lead' })                                     // 5 create
    addLead(e, ++i, { intent: 'hot_lead', email: null })                                                     // replied_by_other
    addLead(e, ++i, { intent: 'hot_lead', company: 'acme.example', email: 'ana@acme-mail.example' })          // differing domains, create
    for (let k = 0; k < 2; k++) addLead(e, ++i, { intent: 'email_changed', email: null, body: `My new address is new${i}@co${i}.example.` })  // referral
    for (let k = 0; k < 3; k++) addLead(e, ++i, { intent: 'email_changed', body: 'I changed my address.' })  // no referral
    for (let k = 0; k < 5; k++) addLead(e, ++i, { intent: 'not_interested', email: k < 2 ? null : undefined }) // declined
    addLead(e, ++i, { intent: 'out_of_office', email: null, body: 'Out until Monday.' })                       // no referral
    addLead(e, ++i, { intent: 'unsubscribe' })                                                               // declined by the label alone
    await e.run()
    const by = {}
    for (const r of e.db.rows('explee_leads')) by[`${r.decision}:${r.reason || ''}`] = (by[`${r.decision}:${r.reason || ''}`] || 0) + 1
    assert.deepStrictEqual(by, { 'would_create:': 8, 'skipped:replied_by_other': 1, 'skipped:auto_reply_no_referral': 4, 'skipped:declined': 6 })
    const diff = e.lead('p7')
    assert.strictEqual(diff.brand_domain, 'acme.example'); assert.strictEqual(diff.email_domain, 'acme-mail.example'); assert.strictEqual(diff.would_payload.domainsDiffer, true)
    const ref = e.lead('p8')
    assert.strictEqual(ref.invitee_source, 'referral'); assert.strictEqual(ref.email, 'new8@co8.example')
    for (const r of e.db.rows('explee_leads').filter((x) => x.reason === 'declined')) assert.strictEqual(r.reply_excerpt, null)
  })
  await check('dry run over 22 conversations: own tables only, zero Explee POSTs, payloads with 5 prompts, OpenAI request clean', async () => {
    const e = env()
    for (let i = 1; i <= 22; i++) addLead(e, i, { intent: i % 4 === 0 ? 'not_interested' : 'hot_lead', body: `${REPLY_SENTENCE} Call me on +34 600 12 34 56.` })
    e.db.calls.length = 0
    await e.run()
    const tables = writtenTables(e.db)
    for (const t of tables) assert.ok(['explee_leads', 'explee_import_settings', 'job_runs'].includes(t), `wrote ${t}`)
    assert.strictEqual(e.fx.posts().length, 0)
    assert.strictEqual(e.openai.length, 5, 'one OpenAI call per payload, max 5')
    const payloaded = e.db.rows('explee_leads').filter((r) => r.would_payload)
    assert.strictEqual(payloaded.length, 5)
    for (const r of payloaded) {
      const w = r.would_payload
      assert.ok(w.brandName && w.website && w.marketId === 'ES' && /^l\*\*\*@co\d+\.example$/.test(w.inviteeMasked), JSON.stringify(w))
      assert.strictEqual(w.prompts.length, 5); assert.strictEqual(w.error, null); assert.strictEqual(w.rulesHash.length, 64)
    }
    for (const call of e.openai) {
      assert.ok(!call.body.includes('@'), 'no @ in the OpenAI request')
      assert.ok(!call.body.includes('widget pricing this quarter'), 'no reply sentence')
      assert.ok(!/Person \d/.test(call.body), 'no person name')
      assert.ok(!call.body.includes('600 12'), 'no phone')
    }
    assert.strictEqual(e.db.rows('clients').length, 0); assert.strictEqual(e.db.invites.length, 0)
    assert.strictEqual(lastRun(e).detail.dryPayloads, 5)
  })
  await check('a second dry run payloads the next 5 and leaves current payloads alone', async () => {
    const e = env()
    for (let i = 1; i <= 8; i++) addLead(e, i)
    await e.run()
    await e.run()
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.would_payload).length, 8)
    assert.strictEqual(e.openai.length, 8)
  })
  await check('a failing generator gives a payload with error prompt_gen_error after one retry', async () => {
    const e = env()
    addLead(e, 1)
    await e.run({ generatePrompts: async () => { e.openai.push({ body: '' }); return { error: 'http_error' } } })
    assert.strictEqual(e.lead('p1').would_payload.error, 'prompt_gen_error'); assert.deepStrictEqual(e.lead('p1').would_payload.prompts, [])
    assert.strictEqual(e.openai.length, 2)
  })

  console.log('\n4. no cursor, the table is the queue (criterion 6)')
  await check('450 candidates with max_threads_per_run 200: all rowed after run 1, all decided after run 3', async () => {
    const e = env({ settings: { max_threads_per_run: 200, max_dry_payloads_per_run: 0 } })
    for (let i = 1; i <= 450; i++) addLead(e, i)
    await e.run()
    assert.strictEqual(e.db.rows('explee_leads').length, 450)
    assert.strictEqual(lastRun(e).detail.listing['11'].pages, 3); assert.strictEqual(lastRun(e).detail.listing['11'].complete, true)
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.state === 'seen').length, 250)
    const firstDecided = e.db.rows('explee_leads').filter((r) => r.state === 'decided').map((r) => Number(r.person_id.slice(1))).sort((a, b) => a - b)
    assert.deepStrictEqual(firstDecided, Array.from({ length: 200 }, (_, k) => k + 1), 'oldest reply first')
    await e.run()
    await e.run()
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.state !== 'decided').length, 0)
  })

  console.log('\n5. Rule F, hidden, incomplete listing (criterion 8)')
  await check('a would_create set to Lost after the dry run is team_lost on the live run', async () => {
    const e = env()
    addLead(e, 1); addLead(e, 2)
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'would_create')
    e.fx.setStatus('p1', 'Lost')
    e.setSettings({ mode: 'live' })
    e.clock.add(3600000)
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'skipped'); assert.strictEqual(e.lead('p1').reason, 'team_lost'); assert.strictEqual(e.lead('p1').final, true)
    assert.strictEqual(e.lead('p2').decision, 'created')
    assert.strictEqual(e.db.rows('clients').length, 1)
  })
  await check('a would_create absent from two complete listings 50+ minutes apart is skipped hidden (one absence only stamps absent_since)', async () => {
    const e = env()
    addLead(e, 1); addLead(e, 2)
    await e.run()
    const sha = e.lead('p1').email_sha256
    e.fx.hide('p1')
    e.clock.add(5 * 60000)
    await e.run()
    assert.strictEqual(e.lead('p1').final, false); assert.strictEqual(e.lead('p1').absent_since, '2026-11-11T05:05:00.000Z')
    assert.strictEqual(lastRun(e).detail.listing['11'].absentFirst, 1)
    e.clock.add(40 * 60000)
    await e.run()
    assert.strictEqual(e.lead('p1').final, false, '45 minutes after the first absence is too soon')
    e.clock.add(20 * 60000)
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'hidden'); assert.strictEqual(e.lead('p1').final, true); assert.strictEqual(e.lead('p1').email, null)
    assert.strictEqual(e.lead('p1').email_sha256, sha, 'the suppression hash is kept')
    assert.strictEqual(lastRun(e).detail.listing['11'].hiddenConfirmed, 1)
    assert.strictEqual(e.lead('p2').decision, 'would_create')
  })
  await check('an incomplete listing changes no row', async () => {
    const e = env()
    addLead(e, 1); addLead(e, 2)
    await e.run()
    const snap = JSON.stringify(e.db.rows('explee_leads'))
    e.fx.hide('p1')
    e.fx.setStatus('p2', 'Lost')
    e.fx.failInboxOffsets.add('11:0')
    e.setSettings({ mode: 'live' })
    await e.run()
    assert.strictEqual(JSON.stringify(e.db.rows('explee_leads')), snap)
    assert.strictEqual(lastRun(e).ok, false); assert.strictEqual(lastRun(e).detail.error, 'listing_unreadable')
  })
  await check('a newer reply re-decides a held row; a rules change re-decides too', async () => {
    const e = env()
    addLead(e, 1, { intent: 'meeting_request' })
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'unknown_intent'); assert.ok(e.lead('p1').reply_excerpt)
    assert.deepStrictEqual(lastRun(e).detail.unknownIntents, { meeting_request: 1 })
    e.setSettings({ include_intents: ['hot_lead', 'meeting_request'] })
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'would_create')
    e.fx.addReply('p1', { intent: 'not_interested', body: 'Actually no.', from: 'lead1@co1.example', ts: '2026-11-05T00:00:00Z' })
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'declined'); assert.strictEqual(e.lead('p1').reply_excerpt, null)
  })

  console.log('\n6. a qualifying lead in live mode (criterion 10)')
  await check('exactly one client, invite, viewer profile, 5 prompts, audit row, scheduled run, one note POST, no reply or status POST', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { country: 'es' })
    await e.run()
    assert.strictEqual(lastRun(e).ok, true, JSON.stringify(lastRun(e).detail))
    const clients = e.db.rows('clients')
    assert.strictEqual(clients.length, 1)
    const c = clients[0]
    assert.strictEqual(c.plan, 'free'); assert.strictEqual(c.refresh_cadence, 'monthly'); assert.strictEqual(c.last_refresh_at, '2026-11-11T05:00:00.000Z')
    assert.strictEqual(c.onboarding_complete, true); assert.strictEqual(c.default_market_id, 'ES'); assert.strictEqual(c.default_region_id, 'ALL')
    assert.strictEqual(c.brand_website, 'co1.example'); assert.strictEqual(c.name, 'Company 1'); assert.deepStrictEqual(c.known_competitors, [])
    assert.deepStrictEqual(e.db.invites, [{ email: 'lead1@co1.example', redirectTo: 'https://app.getbrandgeo.com/reset-password' }])
    assert.strictEqual(e.db.rows('user_profiles').length, 1); assert.strictEqual(e.db.rows('user_profiles')[0].role, 'viewer')
    assert.strictEqual(e.db.rows('prompts').length, 5)
    const ev = e.db.rows('client_events')
    assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].meta.source, 'explee-import'); assert.strictEqual(ev[0].meta.explee_person_id, 'p1')
    const runs = e.db.rows('collection_runs')
    assert.strictEqual(runs.length, 1); assert.strictEqual(runs[0].trigger, 'scheduled')
    assert.strictEqual(e.worker.n, 1)
    const posts = e.fx.posts()
    assert.deepStrictEqual(posts.map((p) => p.path), ['/autogtm/campaigns/21/inbox/p1/note'])
    assert.ok(!e.fx.log.some((l) => l.path.endsWith('/status') || l.path.endsWith('/reply')))
    assert.ok(/^\[BrandGEO\] Free account created 2026-11-11 for l\*\*\*@co1\.example, client \d+\.$/.test(e.fx.notes.get('21:p1')))
    const row = e.lead('p1')
    assert.strictEqual(row.decision, 'created'); assert.strictEqual(row.collection_status, 'enqueued'); assert.strictEqual(row.note_status, 'written')
    assert.strictEqual(row.created_at_account, '2026-11-11T05:00:00.000Z'); assert.strictEqual(row.would_payload, null)
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_account_created').length, 1)
    assert.strictEqual(e.events[0].email, false)
  })
  await check('a second live run creates nothing more and writes no second note', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    await e.run(); await e.run()
    assert.strictEqual(e.db.rows('clients').length, 1); assert.strictEqual(e.fx.posts().length, 1)
  })

  console.log('\n7. Rule U from the importer (criterion 11)')
  await check('an existing pending auth user: already_customer, zero invites, zero deletes, user unchanged', async () => {
    const e = env({ mode: 'live' })
    e.db.usersById.set('u1', { id: 'u1', email: 'lead1@co1.example', invited_at: '2026-11-11T04:00:00Z' })
    e.db.usersById.set('u2', { id: 'u2', email: 'lead2@co2.example' })
    addLead(e, 1); addLead(e, 2)
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'already_customer'); assert.strictEqual(e.lead('p2').reason, 'already_customer')
    assert.strictEqual(e.db.invites.length, 0); assert.strictEqual(e.db.deletedUsers.length, 0)
    assert.deepStrictEqual(e.db.usersById.get('u1'), { id: 'u1', email: 'lead1@co1.example', invited_at: '2026-11-11T04:00:00Z' })
  })
  await check('a client already on the domain (or a subdomain) is already_customer; the dry run sees it too', async () => {
    const e = env()
    e.db.seed('clients', [{ name: 'Hand made', slug: 'hand', brand_website: 'https://www.co1.example/' }, { name: 'Sub', slug: 'sub', brand_website: 'shop.co2.example' }])
    addLead(e, 1); addLead(e, 2); addLead(e, 3)
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'already_customer'); assert.strictEqual(e.lead('p2').reason, 'already_customer')
    assert.strictEqual(e.lead('p3').decision, 'would_create')
  })

  console.log('\n8. overlapping runs (criterion 9)')
  await check('two runs interleaved inside provisioning create one account per identity', async () => {
    const e = env({ mode: 'live', authBehaviour: { beforeInvite: async () => { for (let k = 0; k < 5; k++) await new Promise((r) => setImmediate(r)) } } })
    addLead(e, 1, { company: 'one.example', email: 'same@shared.example' })
    addLead(e, 2, { company: 'two.example', email: 'same@shared.example' })
    addLead(e, 3, { company: 'acme.example', email: 'ana@acme.example' })
    addLead(e, 4, { company: 'acme.example', email: 'bo@acme.example' })
    const [ra, rb] = await Promise.all([e.run({ invId: 'A' }), e.run({ invId: 'B' })])
    // The interleaving really happened: one run lost at least one identity
    // reservation to the unique index while the other was inside provisioning.
    assert.ok((ra.detail.reservationConflicts || 0) + (rb.detail.reservationConflicts || 0) >= 1, 'no reservation conflict occurred')
    assert.strictEqual(e.db.rows('clients').length, 2, 'two accounts after the overlapping runs, not four')
    e.clock.add(25 * 60000)
    await e.run({ invId: 'C' })
    const d = (p) => `${e.lead(p).decision}:${e.lead(p).reason || ''}`
    const pair1 = [d('p1'), d('p2')].sort()
    const pair2 = [d('p3'), d('p4')].sort()
    assert.deepStrictEqual(pair1, ['created:', 'skipped:already_customer'], pair1.join(' '))
    assert.deepStrictEqual(pair2, ['created:', 'skipped:company_has_account'], pair2.join(' '))
    assert.strictEqual(e.db.rows('clients').length, 2)
    assert.strictEqual(e.db.invites.length, 2)
  })
  await check('the daily cap counts creating rows', async () => {
    const e = env({ mode: 'live', settings: { max_creates_per_day: 1 } })
    e.db.seed('explee_leads', [{ person_id: 'other', project_id: 11, state: 'processing', decision: 'creating', email: 'x@busy.example', email_sha256: 'f'.repeat(64), brand_domain: 'busy.example', reserved_at: '2026-11-11T04:59:00Z', claimed_at: '2026-11-11T04:59:00Z', attempts: 0, final: false, first_seen_at: '2026-11-11T04:59:00Z', updated_at: '2026-11-11T04:59:00Z' }])
    addLead(e, 1)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 0); assert.strictEqual(lastRun(e).detail.dailyCapReached, true)
    assert.strictEqual(e.lead('p1').decision ?? null, null); assert.strictEqual(e.lead('p1').state, 'seen')
  })

  console.log('\n9. caps and breaker (criteria 14 and 15)')
  await check('6 qualifying leads with max_creates_per_run 5 give 5 then 1', async () => {
    const e = env({ mode: 'live' })
    for (let i = 1; i <= 6; i++) addLead(e, i)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 5)
    e.clock.add(3600000)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 6)
  })
  await check('two referral leads give one per run', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { intent: 'out_of_office', body: 'Away, write to bo@co1.example' })
    addLead(e, 2, { intent: 'email_changed', body: 'New address: cy@co2.example' })
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 1); assert.strictEqual(lastRun(e).detail.referralsThisRun, 1)
    assert.strictEqual(e.db.invites[0].email, 'bo@co1.example')
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 2)
    assert.strictEqual(e.lead('p2').invitee_source, 'referral')
  })
  await check('max_creates_per_day holds over a 24 hour window across a UTC midnight', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-30T23:30:00Z', settings: { max_creates_per_day: 2 } })
    for (let i = 1; i <= 4; i++) addLead(e, i)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 2)
    e.clock.set('2026-12-01T00:30:00Z')
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 2, 'still inside the 24 h window after midnight')
    e.clock.set('2026-12-01T23:31:00Z')
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 4)
  })
  await check('a 429 on the invite rolls back, pauses for 1 hour and creates nothing else that run', async () => {
    let n = 0
    const e = env({ mode: 'live', authBehaviour: { invite: async () => (++n === 1 ? { data: { user: null }, error: { status: 429, message: 'Email rate exceeded' } } : undefined) } })
    addLead(e, 1); addLead(e, 2)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 0)
    assert.strictEqual(e.lead('p1').reason, 'email_rate_limited'); assert.strictEqual(e.lead('p1').final, false)
    assert.strictEqual(e.lead('p2').state, 'seen')
    assert.strictEqual(e.db.rows('explee_import_settings')[0].paused_until, '2026-11-11T06:00:00.000Z')
    assert.strictEqual(lastRun(e).detail.breaker, true)
    await e.run()
    assert.strictEqual(lastRun(e).detail.skipped, 'paused')
    e.clock.add(61 * 60000)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 2)
  })
  await check("a 'rate limit' message opens the breaker; 'generate' or 'limit' alone does not", async () => {
    const msgs = ['Rate limit reached', 'could not generate the link', 'template limit exceeded']
    const want = [true, false, false]
    for (let k = 0; k < msgs.length; k++) {
      let n = 0
      const e = env({ mode: 'live', authBehaviour: { invite: async () => (++n === 1 ? { data: { user: null }, error: { message: msgs[k] } } : undefined) } })
      addLead(e, 1); addLead(e, 2)
      await e.run()
      assert.strictEqual(lastRun(e).detail.breaker, want[k], msgs[k])
      // rev 3, C4: any first provisioning failure stops creation for the run,
      // so the second lead waits in every case.
      assert.strictEqual(e.db.rows('clients').length, 0, msgs[k])
      assert.strictEqual(e.lead('p2').state, 'seen', msgs[k])
      if (!want[k]) {
        assert.strictEqual(e.lead('p1').reason, 'provision_error'); assert.strictEqual(e.lead('p1').final, false, 'no invite went out: not final')
        assert.strictEqual(lastRun(e).detail.stopCreating, 'provision_error')
      }
    }
  })
  await check('mode set to off between two provisions of one run stops the second', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1); addLead(e, 2)
    const gen = e.deps().generatePrompts
    let n = 0
    await e.run({ generatePrompts: async (d, o) => { if (++n === 2) e.setSettings({ mode: 'off' }); return gen(d, o) } })
    assert.strictEqual(e.db.rows('clients').length, 1); assert.strictEqual(lastRun(e).detail.stoppedBySettings, true)
    assert.strictEqual(e.lead('p2').state, 'seen')
  })
  await check('a stale processing row with client_id set is half_made, never provisioned again', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'lead1@co1.example', email_sha256: 'a'.repeat(64), brand_domain: 'co1.example', reserved_at: '2026-11-11T04:00:00Z', claimed_at: '2026-11-11T04:00:00Z', client_id: 77, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:00:00Z', updated_at: '2026-11-11T04:00:00Z' }])
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'half_made'); assert.strictEqual(e.lead('p1').final, true)
    assert.strictEqual(e.db.invites.length, 0)
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_orphan').length, 1)
  })
  await check('a stale processing row with no ids is decided again', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'lead1@co1.example', email_sha256: 'b'.repeat(64), brand_domain: 'co1.example', reserved_at: '2026-11-11T04:00:00Z', claimed_at: '2026-11-11T04:00:00Z', client_id: null, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:00:00Z', updated_at: '2026-11-11T04:00:00Z' }])
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'created')
  })
  await check('a fresh processing row (another run working) is not touched', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: null, claimed_at: '2026-11-11T04:50:00Z', attempts: 0, final: false, first_seen_at: '2026-11-11T04:00:00Z', updated_at: '2026-11-11T04:00:00Z' }])
    await e.run()
    assert.strictEqual(e.lead('p1').state, 'processing'); assert.strictEqual(e.db.rows('clients').length, 0)
  })

  console.log('\n10. reconciliation and summary (criteria 16, 18, 19)')
  await check('a created lead erased and hidden: personal fields nulled, sha kept, one emailed event', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T05:00:00Z' })
    addLead(e, 1)
    await e.run()
    const sha = e.lead('p1').email_sha256
    e.fx.erase('p1'); e.fx.hide('p1')
    e.clock.set('2026-11-11T08:00:00Z')
    await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'created'); assert.strictEqual(r.email, null); assert.strictEqual(r.email_sha256, sha)
    assert.strictEqual(r.erased_at, '2026-11-11T08:00:00.000Z'); assert.strictEqual(r.company_name, null)
    assert.ok(r.erased_at || r.undone_at || r.email, 'the created CHECK holds')
    const ev = e.events.filter((x) => x.type === 'explee_created_erased')
    assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].email, true); assert.strictEqual(ev[0].client_id, r.client_id)
  })
  await check("a created lead's new not_interested reply raises explee_created_declined once", async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T05:00:00Z' })
    addLead(e, 1)
    await e.run()
    e.fx.addReply('p1', { intent: 'not_interested', body: 'Please stop.', from: 'lead1@co1.example', ts: '2026-11-11T06:00:00Z' })
    e.clock.set('2026-11-11T08:00:00Z')
    await e.run()
    e.clock.set('2026-11-12T08:00:00Z')
    await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_created_declined').length, 1)
    assert.strictEqual(e.lead('p1').decision, 'created')
  })
  await check('a created lead whose client was deleted is marked undone, address nulled, never re-created', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T05:00:00Z' })
    addLead(e, 1)
    await e.run()
    e.lead('p1').client_id = null   // ON DELETE SET NULL
    e.clock.set('2026-11-11T08:00:00Z')
    await e.run()
    assert.strictEqual(e.lead('p1').undone_at, '2026-11-11T08:00:00.000Z'); assert.strictEqual(e.lead('p1').email, null)
    assert.strictEqual(e.db.rows('clients').length, 1)
  })
  await check('retention: excerpts and payloads older than 30 days are nulled in every mode', async () => {
    for (const mode of ['dry_run', 'live', 'off']) {
      const e = env({ mode })
      e.db.seed('explee_leads', [
        { person_id: 'x1', project_id: 98, state: 'decided', decision: 'would_create', email: 'a@x.example', reply_excerpt: 'old', would_payload: { a: 1 }, decided_at: '2026-10-11T04:59:00Z', final: false, first_seen_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
        { person_id: 'x2', project_id: 98, state: 'decided', decision: 'would_create', email: 'b@x.example', reply_excerpt: 'recent', would_payload: { a: 1 }, decided_at: '2026-10-13T00:00:00Z', final: false, first_seen_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
      ])
      await e.run()
      assert.strictEqual(e.lead('x1').reply_excerpt, null, mode); assert.strictEqual(e.lead('x1').would_payload, null, mode); assert.strictEqual(e.lead('x1').email, null, mode)
      assert.strictEqual(e.lead('x2').reply_excerpt, 'recent', mode)
    }
  })
  await check('no excerpt for declined, team_lost, hidden or erased; a phone number is masked in a stored excerpt', async () => {
    const e = env()
    addLead(e, 1, { intent: 'not_interested', body: 'No thanks, call +34 600 12 34 56' })
    addLead(e, 2, { status: 'Lost' })
    addLead(e, 3, { intent: 'meeting_request', body: 'Call me on +34 600 12 34 56 tomorrow' })
    addLead(e, 4)
    e.fx.erase('p4')
    await e.run()
    for (const p of ['p1', 'p2', 'p4']) assert.strictEqual(e.lead(p).reply_excerpt, null, p)
    assert.strictEqual(e.lead('p4').reason, 'erased')
    assert.ok(e.lead('p3').reply_excerpt.includes('[number]')); assert.ok(!e.lead('p3').reply_excerpt.includes('600 12'))
  })
  await check('summary: once per UTC date at or after 07:00, no @ and no excerpt in it; dry run sends none', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T06:59:00Z' })
    addLead(e, 1, { intent: 'meeting_request', body: 'Write to someone@co1.example about the secret plan' })
    addLead(e, 2)
    await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_daily_summary').length, 0)
    e.clock.set('2026-11-11T07:00:00Z'); await e.run()
    e.clock.set('2026-11-11T07:30:00Z'); await e.run()
    const s = e.events.filter((x) => x.type === 'explee_daily_summary')
    assert.strictEqual(s.length, 1)
    assert.ok(!s[0].body.includes('@')); assert.ok(!JSON.stringify(s[0]).includes('secret plan')); assert.ok(s[0].body.includes('meeting_request 1'))
    assert.strictEqual(e.db.rows('explee_import_settings')[0].last_summary_date, '2026-11-11')
    e.clock.set('2026-11-12T07:05:00Z'); await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_daily_summary').length, 2)
    const d = env({ clockIso: '2026-11-11T08:00:00Z' })
    addLead(d, 1)
    await d.run()
    assert.strictEqual(d.events.length, 0); assert.strictEqual(lastRun(d).detail.summary, 'skipped_dry_run')
    assert.ok(!writtenTables(d.db).has('admin_notifications'))
  })
  await check('timestamps come from the injected clock at 23:59 UTC and on the first of a month', async () => {
    for (const iso of ['2026-11-30T23:59:00Z', '2026-12-01T00:00:00Z']) {
      const e = env({ mode: 'live', clockIso: iso })
      addLead(e, 1)
      await e.run()
      const r = e.lead('p1')
      const want = new Date(iso).toISOString()
      for (const k of ['first_seen_at', 'decided_at', 'reserved_at', 'created_at_account', 'listing_seen_at']) assert.strictEqual(r[k], want, `${k} at ${iso}`)
      assert.strictEqual(e.db.rows('clients')[0].last_refresh_at, want)
      assert.strictEqual(lastRun(e).detail.elapsedMs, 0)
    }
  })
  await check('the 11 minute guard stops new leads (rev 3 replaces the 12 minute guard)', async () => {
    const e = env()
    for (let i = 1; i <= 5; i++) addLead(e, i)
    // The first thread read takes "13 minutes" on the test clock.
    const makeSlow = ({ write }) => {
      const real = createExpleeClient({ write, fetchImpl: e.fx.fetch, sleep: async () => {}, getKey: () => 'k' })
      return Object.assign({}, real, { getThread: async (c, p) => { e.clock.add(13 * 60000); return real.getThread(c, p) } })
    }
    await e.run({ makeExplee: makeSlow })
    assert.strictEqual(lastRun(e).detail.wallClockStop, true); assert.ok(lastRun(e).detail.truncated.includes('decide'))
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.state === 'decided').length, 1)
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.state === 'seen').length, 4)
    assert.strictEqual(lastRun(e).detail.elapsedMs, 13 * 60000)
  })
  await check('follow-up: off by default; when enabled, sent once after the delay, not to a referral', async () => {
    const e = env({ mode: 'live', settings: { follow_up_enabled: true, follow_up_body: 'Hi {first_name}, {brand} is set up.', follow_up_delay_min: 60 } })
    addLead(e, 1)
    addLead(e, 2, { intent: 'out_of_office', body: 'Away, write to bo@co2.example' })
    await e.run()
    assert.strictEqual(e.fx.posts().filter((p) => p.path.endsWith('/reply')).length, 0)
    e.clock.add(61 * 60000); await e.run()
    e.clock.add(61 * 60000); await e.run()
    const replies = e.fx.posts().filter((p) => p.path.endsWith('/reply'))
    assert.strictEqual(replies.length, 1); assert.ok(replies[0].path.includes('/p1/'))
    assert.strictEqual(e.lead('p1').follow_up_status, 'sent'); assert.strictEqual(e.lead('p2').follow_up_status, 'skipped_referral')
  })

  await revision3()
  await revision4()

  console.log('\n11. the narrow client (criterion 20)')
  await check('the write client exposes exactly the seven calls; the dry client has no POST call', async () => {
    const w = createExpleeClient({ write: true, fetchImpl: async () => { throw new Error('no') }, getKey: () => 'k' })
    const r = createExpleeClient({ write: false, fetchImpl: async () => { throw new Error('no') }, getKey: () => 'k' })
    assert.deepStrictEqual(Object.keys(w).sort(), ALLOWED_CALLS.slice().sort())
    assert.deepStrictEqual(Object.keys(r).sort(), ['getMe', 'getNote', 'getThread', 'listInbox', 'listProjects'])
    assert.strictEqual(r.postNote, undefined); assert.strictEqual(r.postReply, undefined)
    assert.ok(Object.isFrozen(r))
    try { r.postNote = () => {} } catch { /* strict callers throw; either way nothing is added */ }
    assert.strictEqual(r.postNote, undefined)
  })
  await check('a person_id containing / is rejected before any request; ids are validated', async () => {
    const fx = createFakeExplee()
    const c = createExpleeClient({ write: true, fetchImpl: fx.fetch, getKey: () => 'k', sleep: async () => {} })
    await assert.rejects(c.getThread(21, 'a/b'), (er) => er.code === 'bad_id')
    await assert.rejects(c.postNote(21, '../x', 'n'), (er) => er.code === 'bad_id')
    await assert.rejects(c.listInbox(-1), (er) => er.code === 'bad_id')
    await assert.rejects(c.getThread(2 ** 31, 'p1'), (er) => er.code === 'bad_id')
    assert.strictEqual(fx.log.length, 0)
  })
  await check('nothing is sent after the first 402; every call carries an abort signal and the key header', async () => {
    const fx = createFakeExplee()
    const c = createExpleeClient({ write: true, fetchImpl: fx.fetch, getKey: () => 'k', sleep: async () => {} })
    await c.listProjects()
    fx.paymentRequired = true
    await assert.rejects(c.listInbox(11), (er) => er instanceof ExpleeError && er.code === 'insufficient_credits')
    const n = fx.log.length
    await assert.rejects(c.getMe(), (er) => er.code === 'insufficient_credits')
    await assert.rejects(c.postNote(21, 'p1', 'n'), (er) => er.code === 'insufficient_credits')
    assert.strictEqual(fx.log.length, n)
    assert.ok(fx.log.every((l) => l.hasSignal && l.hasKey))
  })
  await check('a missing key throws missing_key, sends nothing, and no error carries the key', async () => {
    const fx = createFakeExplee()
    const none = createExpleeClient({ write: false, fetchImpl: fx.fetch, getKey: () => undefined })
    await assert.rejects(none.listProjects(), (er) => er.code === 'missing_key')
    assert.strictEqual(fx.log.length, 0)
    const secret = 'secret-key-value-placeholder'
    const c = createExpleeClient({ write: false, fetchImpl: async () => { throw new Error(`net down ${secret}`) }, getKey: () => secret })
    await assert.rejects(c.listProjects(), (er) => !String(er.message).includes(secret) && er.code === 'network')
  })
  await check('a 402 during a run stops it with ok=false stage=explee insufficient_credits', async () => {
    const e = env()
    addLead(e, 1)
    e.fx.paymentRequired = true
    await e.run()
    assert.strictEqual(lastRun(e).ok, false); assert.strictEqual(lastRun(e).detail.error, 'insufficient_credits'); assert.strictEqual(lastRun(e).detail.stage, 'explee')
  })
  await check('the key is read at call time from process.env by default and never appears in job_runs', async () => {
    const e = env()
    e.key = 'run-key-placeholder-123'
    addLead(e, 1)
    await e.run()
    assert.ok(!JSON.stringify(e.jobRuns()).includes('run-key-placeholder-123'))
    const c = createExpleeClient({ write: false, fetchImpl: e.fx.fetch })
    process.env.EXPLEE_API_KEY = 'env-key-placeholder'
    await c.listProjects()
    delete process.env.EXPLEE_API_KEY
    await assert.rejects(c.listProjects(), (er) => er.code === 'missing_key')
  })

  console.log(`\n${passes} passed, ${failures} failed`)
  if (failures) process.exit(1)
}

// ── revision 3 (criteria 27 to 45, 47) ─────────────────────────────────────

const HOUR_MS = 3600000
const inWindow = (e) => {
  const since = new Date(e.clock.t - 24 * HOUR_MS).toISOString()
  return e.db.rows('explee_leads').filter((r) => r.reserved_at && r.reserved_at >= since
    && (r.decision === 'creating' || r.decision === 'created' || (r.decision === 'failed' && r.reason === 'provision_error'))).length
}
const threadGets = (e, pid) => e.fx.log.filter((l) => l.method === 'GET' && l.path === `/autogtm/campaigns/21/inbox/${pid}`).length
const callsFor = (e, pid) => e.fx.log.filter((l) => l.path.includes(`/inbox/${pid}`)).length
const replyPosts = (e) => e.fx.posts().filter((p) => p.path.endsWith('/reply'))

/** A created lead, seeded directly (client row and lead row), listed in the fake inbox. */
function seedCreated(e, i, { createdAt, over = {} } = {}) {
  addLead(e, i)
  const [c] = e.db.seed('clients', [{ name: `Company ${i}`, slug: `co${i}`, brand_website: `co${i}.example` }])
  e.db.seed('explee_leads', [Object.assign({
    person_id: `p${i}`, project_id: 11, campaign_id: 21, state: 'decided', decision: 'created', reason: null, final: true,
    invitee_source: 'replier', email: `lead${i}@co${i}.example`, email_sha256: R.emailSha256(`lead${i}@co${i}.example`),
    brand_domain: `co${i}.example`, email_domain: `co${i}.example`, client_id: c.id, user_id: null,
    reserved_at: createdAt, created_at_account: createdAt, decided_at: createdAt, attempts: 0,
    note_status: 'written', note_attempts: 0, collection_status: 'enqueued', collection_attempts: 1,
    follow_up_status: null, follow_up_attempts: 0, intents_seen: ['hot_lead'],
    first_seen_at: createdAt, updated_at: createdAt,
  }, over)])
  return c
}

const FOLLOW_UP = { follow_up_enabled: true, follow_up_body: 'Hi {first_name}, a free account was set up for {brand}.', follow_up_delay_min: 60 }

async function revision3() {
  console.log('\n12. revision 3: caps C1 to C4 (F1, M1, criterion 27)')
  await check('6 leads, user_profiles insert failing: run 1 sends exactly 1 invite, run 2 one more to a DIFFERENT address', async () => {
    const e = env({ mode: 'live', sbOpts: { failInsert: ['user_profiles'] } })
    for (let i = 1; i <= 6; i++) addLead(e, i)
    await e.run()
    assert.strictEqual(e.db.invites.length, 1, 'one invite in run 1 (was 6)')
    const failed = e.db.rows('explee_leads').filter((r) => r.decision === 'failed' && r.reason === 'provision_error')
    assert.strictEqual(failed.length, 1); assert.strictEqual(failed[0].final, true); assert.ok(failed[0].reserved_at, 'reserved_at kept')
    assert.ok(failed[0].email_sha256, 'the address stays suppressed')
    const others = e.db.rows('explee_leads').filter((r) => r !== failed[0])
    assert.strictEqual(others.length, 5)
    for (const r of others) assert.ok(r.reserved_at === null || r.reserved_at === undefined, `${r.person_id} reserved_at`)
    assert.strictEqual(e.db.rows('clients').length, 0)
    assert.strictEqual(lastRun(e).detail.createsAttempted, 1); assert.strictEqual(lastRun(e).detail.stopCreating, 'provision_error')
    const first = e.db.invites[0].email
    e.clock.add(HOUR_MS)
    await e.run()
    assert.strictEqual(e.db.invites.length, 2)
    assert.notStrictEqual(e.db.invites[1].email, first)
    assert.strictEqual(e.db.invites.filter((x) => x.email === first).length, 1, 'never re-invited')
    assert.strictEqual(inWindow(e), 2, 'both failed calls stay in the daily window')
    assert.strictEqual(lastRun(e).detail.createsToday, 2)
  })
  await check('a failure before the invite (clients insert failing): 0 invites, row non-final with reserved_at null, creation stopped', async () => {
    const e = env({ mode: 'live', sbOpts: { failInsert: ['clients'] } })
    for (let i = 1; i <= 3; i++) addLead(e, i)
    await e.run()
    assert.strictEqual(e.db.invites.length, 0)
    const r = e.lead('p1')
    assert.strictEqual(r.reason, 'provision_error'); assert.strictEqual(r.final, false); assert.strictEqual(r.attempts, 1)
    assert.ok(r.reserved_at === null || r.reserved_at === undefined)
    assert.strictEqual(lastRun(e).detail.stopCreating, 'provision_error'); assert.strictEqual(lastRun(e).detail.createsAttempted, 1)
    assert.strictEqual(e.lead('p2').state, 'seen'); assert.strictEqual(e.lead('p3').state, 'seen')
  })

  console.log('\n13. revision 3: F2, follow-up after a decline (criterion 28)')
  await check('a not_interested reply 30 minutes after creation: 0 reply POSTs at 11:05, follow_up_status skipped_declined', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T10:00:00Z', settings: FOLLOW_UP })
    addLead(e, 1)
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'created')
    e.fx.addReply('p1', { intent: 'not_interested', body: 'Actually not for us.', from: 'lead1@co1.example', ts: '2026-11-11T10:30:00Z' })
    e.clock.set('2026-11-11T11:05:00Z')
    await e.run()
    assert.strictEqual(replyPosts(e).length, 0)
    assert.strictEqual(e.lead('p1').follow_up_status, 'skipped_declined')
  })

  console.log('\n14. revision 3: F3, overlapping runs and related domains (criterion 29)')
  for (const [label, second] of [
    ['p2 brand shop.acme.example', { company: 'shop.acme.example', email: 'bo@shop.acme.example' }],
    ['p2 with email domain acme.example and brand other.example', { company: 'other.example', email: 'bo@acme.example' }],
  ]) {
    await check(`two interleaved live runs, p1 brand acme.example and ${label}: exactly 1 created and 1 invite`, async () => {
      // The interleaving the reviewer measured: BOTH runs pass the D5
      // duplicate checks before EITHER reserves. Each run gets its own
      // Supabase handle over the same fake; its second settings read (the
      // early read in createLive, after duplicateOf, before the reservation)
      // is held: the first run to arrive waits until the second arrives, and
      // the second then waits until the first has passed its post-reservation
      // re-check (it reaches prompt generation).
      const e = env({ mode: 'live' })
      addLead(e, 1, { company: 'acme.example', email: 'ana@acme.example' })
      addLead(e, 2, second)
      let arrivals = 0
      let releaseFirst
      let releaseSecond
      const firstGo = new Promise((r) => { releaseFirst = r })
      const secondGo = new Promise((r) => { releaseSecond = r })
      const handle = () => {
        let reads = 0
        const h = Object.create(e.db)
        h.from = (t) => {
          const q = e.db.from(t)
          if (t !== 'explee_import_settings') return q
          const sel = q.select.bind(q)
          q.select = (...a) => {
            const out = sel(...a)
            if (q.op === 'select' && ++reads === 2) {
              q.then = (res, rej) => (async () => {
                if (++arrivals === 1) await firstGo
                else { releaseFirst(); await secondGo }
                return q._run()
              })().then(res, rej)
            }
            return out
          }
          return q
        }
        return h
      }
      const gen = e.deps().generatePrompts
      const genWrap = async (d, o) => { releaseSecond(); return gen(d, o) }
      const [ra, rb] = await Promise.all([
        e.run({ invId: 'A', supabase: handle(), generatePrompts: genWrap }),
        e.run({ invId: 'B', supabase: handle(), generatePrompts: genWrap }),
      ])
      assert.strictEqual(arrivals, 2, 'both runs passed the duplicate checks before either reserved')
      const created = e.db.rows('explee_leads').filter((r) => r.decision === 'created')
      assert.strictEqual(created.length, 1, 'one account per company (was 2)'); assert.strictEqual(e.db.invites.length, 1)
      assert.strictEqual(e.db.rows('clients').length, 1)
      assert.strictEqual((ra.detail.reservationRechecks || 0) + (rb.detail.reservationRechecks || 0), 1, 'the post-reservation re-check released the second row')
      const loser = created[0].person_id === 'p1' ? 'p2' : 'p1'
      assert.ok(e.lead(loser).decision !== 'created'); assert.strictEqual(e.lead(loser).final, false, 'released, not decided')
      e.clock.add(25 * 60000)
      await e.run({ invId: 'C' })
      assert.strictEqual(e.lead(loser).decision, 'skipped'); assert.strictEqual(e.lead(loser).final, true)
      // D5 checks 3 (a client monitors the domain) before 4, so once the
      // winner's client exists the sequential run answers already_customer.
      assert.ok(['company_has_account', 'already_customer'].includes(e.lead(loser).reason), e.lead(loser).reason)
      assert.strictEqual(e.db.rows('clients').length, 1)
    })
  }

  console.log('\n15. revision 3: F4, the kill switch read immediately before provisioning (criterion 30)')
  for (const [label, patch] of [["mode set to 'off'", { mode: 'off' }], ['paused_until set to now + 1 hour', { paused_until: '2026-11-11T06:00:00Z' }]]) {
    await check(`${label} inside the prompt generator: 0 clients, 0 invites, row back to its previous decision`, async () => {
      const e = env({ mode: 'live' })
      addLead(e, 1)
      const gen = e.deps().generatePrompts
      await e.run({ generatePrompts: async (d, o) => { e.setSettings(patch); return gen(d, o) } })
      assert.strictEqual(e.db.rows('clients').length, 0, 'no account (was 1)'); assert.strictEqual(e.db.invites.length, 0)
      const r = e.lead('p1')
      assert.strictEqual(r.state, 'seen'); assert.strictEqual(r.decision ?? null, null); assert.strictEqual(r.final, false)
      assert.ok(r.reserved_at === null || r.reserved_at === undefined)
      assert.strictEqual(lastRun(e).detail.createsAttempted, 0)
    })
  }

  console.log('\n16. revision 3: F5, a dry run after a live period notifies nobody (criterion 31)')
  await check('dry run at 08:00: 0 events, created rows unchanged, only last_dry_reconcile_date stamped; the live run at 09:00 raises both events', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T05:00:00Z' })
    addLead(e, 1); addLead(e, 2)
    await e.run()
    assert.strictEqual(e.db.rows('clients').length, 2)
    e.fx.erase('p1')
    e.fx.addReply('p2', { intent: 'not_interested', body: 'No thanks.', from: 'lead2@co2.example', ts: '2026-11-11T06:00:00Z' })
    e.setSettings({ last_reconcile_date: '2026-11-10', last_summary_date: '2026-11-10' })
    e.events.length = 0
    const snap = JSON.stringify([e.lead('p1'), e.lead('p2')])
    e.clock.set('2026-11-11T08:00:00Z')
    e.db.calls.length = 0
    await e.run({}, { requestedMode: 'dry_run' })
    assert.strictEqual(lastRun(e).detail.mode, 'dry_run')
    assert.strictEqual(e.events.length, 0, 'no notification or email from a dry run')
    assert.ok(!writtenTables(e.db).has('admin_notifications'))
    assert.strictEqual(JSON.stringify([e.lead('p1'), e.lead('p2')]), snap, 'created rows untouched by the dry reconcile')
    const s = e.db.rows('explee_import_settings')[0]
    assert.strictEqual(s.last_reconcile_date, '2026-11-10'); assert.strictEqual(s.last_dry_reconcile_date, '2026-11-11')
    e.clock.set('2026-11-11T09:00:00Z')
    await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_created_erased').length, 1)
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_created_declined').length, 1)
    assert.strictEqual(e.db.rows('explee_import_settings')[0].last_reconcile_date, '2026-11-11')
  })

  console.log('\n17. revision 3: auth I1 and L7, the orphan client found by pending_slug (criterion 32)')
  await check('a reclaimed creating row whose pending_slug names an existing client: half_made, client_id recorded, one explee_orphan, nothing created or deleted', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { company: 'acme.example', email: 'ana@acme.example' })
    const [orphan] = e.db.seed('clients', [{ name: 'Acme', slug: 'acme', brand_website: 'acme.example' }])
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'ana@acme.example', email_sha256: R.emailSha256('ana@acme.example'), brand_domain: 'acme.example', reserved_at: '2026-11-11T04:39:00Z', claimed_at: '2026-11-11T04:39:00Z', pending_slug: 'acme', client_id: null, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:30:00Z', updated_at: '2026-11-11T04:39:00Z' }])
    e.db.calls.length = 0
    await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'failed'); assert.strictEqual(r.reason, 'half_made'); assert.strictEqual(r.final, true)
    assert.strictEqual(r.client_id, orphan.id)
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_orphan').length, 1); assert.strictEqual(e.events.find((x) => x.type === 'explee_orphan').email, true)
    assert.strictEqual(e.db.invites.length, 0); assert.strictEqual(e.db.deletedUsers.length, 0)
    assert.strictEqual(e.db.calls.filter((c) => c.table === 'clients' && (c.op === 'insert' || c.op === 'delete')).length, 0)
    assert.strictEqual(e.db.rows('clients').length, 1)
  })
  await check('a pending_slug with no such client: the row is reverted and decided again', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'lead1@co1.example', email_sha256: R.emailSha256('lead1@co1.example'), brand_domain: 'co1.example', reserved_at: '2026-11-11T04:39:00Z', claimed_at: '2026-11-11T04:39:00Z', pending_slug: 'nomatch', client_id: null, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:30:00Z', updated_at: '2026-11-11T04:39:00Z' }])
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'created'); assert.strictEqual(e.events.filter((x) => x.type === 'explee_orphan').length, 0)
  })
  await check('the importer writes pending_slug before the clients insert', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    const order = []
    const orig = e.db.from
    e.db.from = (t) => {
      const q = orig(t)
      if (t === 'clients') { const ins = q.insert.bind(q); q.insert = (rows) => { order.push(`clients:${rows.slug}`); return ins(rows) } }
      if (t === 'explee_leads') { const up = q.update.bind(q); q.update = (p) => { if (p && p.pending_slug) order.push(`pending:${p.pending_slug}`); return up(p) } }
      return q
    }
    await e.run()
    assert.deepStrictEqual(order, ['pending:co1', 'clients:co1'])
  })

  console.log('\n18. revision 3: M2, paging on has_more and two absences (criterion 35)')
  {
    const big = (fxOpts, n = 450) => {
      const e = env({ settings: { max_threads_per_run: 1000, max_dry_payloads_per_run: 0 }, fxOpts })
      for (let i = 1; i <= n; i++) addLead(e, i)
      return e
    }
    await check('an item that moves to index 0 between page reads is NOT hidden; it only gets absent_since', async () => {
      const e = big({ moveToFront: { personId: 'p301', afterOffset: 0 } })
      e.db.seed('explee_leads', [{ person_id: 'p301', project_id: 11, campaign_id: 21, state: 'decided', decision: 'would_create', reason: null, final: false, email: 'lead301@co301.example', email_sha256: R.emailSha256('lead301@co301.example'), brand_domain: 'co301.example', attempts: 0, decided_at: '2026-11-11T04:00:00Z', decided_reply_at: '2026-10-01T05:00:00.000Z', first_seen_at: '2026-11-11T04:00:00Z', updated_at: '2026-11-11T04:00:00Z' }])
      await e.run()
      const x = e.lead('p301')
      assert.strictEqual(x.final, false, 'not finalised on one absence (was hidden)'); assert.strictEqual(x.absent_since, '2026-11-11T05:00:00.000Z')
      assert.strictEqual(lastRun(e).detail.listing['11'].complete, true)
      e.fx.addReply('p301', { intent: 'hot_lead', body: 'Yes, still interested.', from: 'lead301@co301.example', ts: '2026-11-11T05:30:00Z' })
      e.clock.add(60 * 60000)
      await e.run()
      const y = e.lead('p301')
      assert.strictEqual(y.absent_since, null); assert.strictEqual(y.decided_at, '2026-11-11T06:00:00.000Z', 're-decided'); assert.strictEqual(y.decision, 'would_create')
    })
    await check('an item truly gone: run 1 stamps absent_since, run 2 at +60 minutes reads its thread once and writes hidden, final, hash kept', async () => {
      const e = env()
      addLead(e, 1); addLead(e, 2)
      await e.run()
      const sha = e.lead('p1').email_sha256
      e.fx.hide('p1')
      e.clock.add(60000)
      await e.run()
      assert.ok(e.lead('p1').absent_since); assert.strictEqual(e.lead('p1').final, false)
      e.clock.add(60 * 60000)
      const before = threadGets(e, 'p1')
      await e.run()
      assert.strictEqual(threadGets(e, 'p1') - before, 1)
      assert.strictEqual(e.lead('p1').reason, 'hidden'); assert.strictEqual(e.lead('p1').final, true); assert.strictEqual(e.lead('p1').email_sha256, sha)
    })
    await check('a short page with has_more true is not the last page (a 4th page is read)', async () => {
      const e = big({ pageSizeCap: 150 }, 451)
      await e.run()
      const l = lastRun(e).detail.listing['11']
      assert.strictEqual(l.pages, 4, 'was 1'); assert.strictEqual(l.complete, true); assert.strictEqual(l.items, 451)
    })
    await check('with has_more omitted, paging ends only on an empty page', async () => {
      const e = big({ omitHasMore: true }, 450)
      await e.run()
      const l = lastRun(e).detail.listing['11']
      assert.strictEqual(l.pages, 4, '3 pages of items and one empty page'); assert.strictEqual(l.complete, true); assert.strictEqual(l.items, 450)
    })
  }

  console.log('\n19. revision 3: M3, one deadline for every stage (criterion 36)')
  await check('a slow reconcile stops at 5 minutes, no call starts at 13 minutes, job_runs written, the next run finishes the list', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T07:10:00Z', settings: { last_me_at: '2026-11-11T07:00:00Z' } })
    const rows = []
    for (let i = 1; i <= 100; i++) {
      e.fx.addLead({ projectId: 98, campaignId: 21, personId: `r${i}` })
      rows.push({ person_id: `r${i}`, project_id: 98, campaign_id: 21, state: 'decided', decision: 'skipped', reason: 'unknown_intent', final: false, reply_excerpt: 'held for a human', decided_at: '2026-11-10T07:00:00Z', attempts: 0, first_seen_at: '2026-11-10T07:00:00Z', updated_at: '2026-11-10T07:00:00Z' })
    }
    e.db.seed('explee_leads', rows)
    e.timing.delayMs = 10000
    await e.run()
    const starts = e.timing.callStarts
    assert.ok(starts.every((s) => s.elapsed < 13 * 60000), 'no call at or after 13 minutes')
    const recon = starts.filter((s) => /\/inbox\/r\d+$/.test(s.path))
    assert.ok(recon.length > 0 && recon.every((s) => s.elapsed < 5 * 60000), 'no reconcile read at or after 5 minutes')
    const d = lastRun(e).detail
    assert.ok(d.truncated.includes('reconcile'), JSON.stringify(d.truncated))
    assert.notStrictEqual(e.db.rows('explee_import_settings')[0].last_reconcile_date, '2026-11-11')
    const read = e.db.rows('explee_leads').filter((r) => r.reconciled_at)
    assert.strictEqual(read.length, recon.length, 'every row read has reconciled_at')
    assert.ok(recon.length < 100)
    e.timing.delayMs = 0
    e.clock.set('2026-11-11T08:10:00Z')
    await e.run()
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.reconciled_at).length, 100)
    assert.strictEqual(e.db.rows('explee_import_settings')[0].last_reconcile_date, '2026-11-11')
  })
  await check('a listing cut at 13 minutes is complete:false and hides nothing', async () => {
    const e = env({ settings: { last_me_at: '2026-11-11T04:30:00Z', max_dry_payloads_per_run: 0 } })
    for (let i = 1; i <= 450; i++) addLead(e, i)
    e.db.seed('explee_leads', [{ person_id: 'gone1', project_id: 11, campaign_id: 21, state: 'decided', decision: 'would_create', final: false, email: 'g@gone.example', email_sha256: R.emailSha256('g@gone.example'), brand_domain: 'gone.example', attempts: 0, decided_at: '2026-11-11T04:00:00Z', first_seen_at: '2026-11-11T04:00:00Z', updated_at: '2026-11-11T04:00:00Z' }])
    e.timing.delayMs = 5 * 60000
    await e.run()
    const d = lastRun(e).detail
    assert.strictEqual(d.listing['11'].complete, false); assert.ok(d.truncated.includes('listing:11'), JSON.stringify(d.truncated))
    assert.ok(e.timing.callStarts.every((s) => s.elapsed < 13 * 60000))
    const g = e.lead('gone1')
    assert.strictEqual(g.final, false); assert.ok(!g.absent_since)
    assert.strictEqual(e.jobRuns().length, 1)
  })

  console.log('\n20. revision 3: follow-up answers, gave_up and the maximum age (L2, L3, L4; criteria 39 to 41)')
  for (const [status, want, attempts] of [['not_ok', 'failed', 1], ['deduped_only', 'sent', 0], [undefined, 'sent', 0]]) {
    await check(`a reply POST answered 200 ${status === 'not_ok' ? '{ ok: false }' : status === 'deduped_only' ? '{ deduped: true }' : '{ ok: true }'} is ${want}`, async () => {
      const e = env({ mode: 'live', settings: FOLLOW_UP })
      addLead(e, 1)
      await e.run()
      if (status) e.fx.replyStatus.set('p1', status)
      e.clock.add(61 * 60000)
      await e.run()
      assert.strictEqual(replyPosts(e).length, 1)
      assert.strictEqual(e.lead('p1').follow_up_status, want); assert.strictEqual(e.lead('p1').follow_up_attempts, attempts)
      assert.strictEqual(lastRun(e).detail.followUps[want === 'sent' ? 'sent' : 'failed'], 1)
    })
  }
  await check('a follow-up that failed 3 times becomes gave_up with 0 thread GETs, and costs 0 Explee calls after that', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    await e.run()
    Object.assign(e.lead('p1'), { follow_up_status: 'failed', follow_up_attempts: 3 })
    // The daily reconcile (its own duty, once a day) is pinned as done so the
    // count below sees only the follow-up path.
    e.setSettings(Object.assign({ last_reconcile_date: '2026-11-11' }, FOLLOW_UP))
    e.clock.add(61 * 60000)
    const before = threadGets(e, 'p1')
    await e.run()
    assert.strictEqual(e.lead('p1').follow_up_status, 'gave_up'); assert.strictEqual(threadGets(e, 'p1') - before, 0)
    assert.strictEqual(lastRun(e).detail.followUps.gaveUp, 1)
    const after = callsFor(e, 'p1')
    e.clock.add(HOUR_MS); await e.run()
    e.clock.add(HOUR_MS); await e.run()
    assert.strictEqual(callsFor(e, 'p1'), after, 'no Explee call for a gave_up row')
  })
  await check('follow-up switched on with 8 created rows: the 2 older than 72 hours expire unread, 5 replies in run 1, the sixth in run 2', async () => {
    const e = env({ mode: 'live', settings: FOLLOW_UP, clockIso: '2026-11-11T05:00:00Z' })
    for (let i = 1; i <= 2; i++) seedCreated(e, i, { createdAt: '2026-11-07T01:00:00Z' })   // 100 hours old
    for (let i = 3; i <= 8; i++) seedCreated(e, i, { createdAt: '2026-11-11T03:00:00Z' })   // 2 hours old
    await e.run()
    for (const p of ['p1', 'p2']) {
      assert.strictEqual(e.lead(p).follow_up_status, 'skipped_expired', p); assert.strictEqual(threadGets(e, p), 0, `${p} thread read`)
    }
    assert.strictEqual(replyPosts(e).length, 5, 'max_follow_ups_per_run (was 8)')
    assert.strictEqual(lastRun(e).detail.followUps.expired, 2)
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.follow_up_status === 'sent').length, 5)
    e.clock.add(60000)
    await e.run()
    assert.strictEqual(replyPosts(e).length, 6)
    assert.strictEqual(e.db.rows('explee_leads').filter((r) => r.follow_up_status === 'sent').length, 6)
  })

  console.log('\n21. revision 3: L5, no listed project visible (criterion 42)')
  await check("project_ids {999} with only project 11 visible: ok=false stage=explee error=projects_missing, no inbox read", async () => {
    const e = env({ settings: { project_ids: [999] } })
    addLead(e, 1)
    await e.run()
    const r = lastRun(e)
    assert.strictEqual(r.ok, false); assert.strictEqual(r.detail.stage, 'explee'); assert.strictEqual(r.detail.error, 'projects_missing')
    assert.ok(!e.fx.log.some((l) => l.path.includes('/inbox')))
  })
  await check('project_ids {11,999}: ok=true, project 11 read, projectsMissing [999]', async () => {
    const e = env({ settings: { project_ids: [11, 999] } })
    addLead(e, 1)
    await e.run()
    assert.strictEqual(lastRun(e).ok, true); assert.deepStrictEqual(lastRun(e).detail.projectsMissing, [999])
    assert.ok(e.fx.log.some((l) => l.path.startsWith('/autogtm/projects/11/inbox')))
  })

  console.log('\n22. revision 3: L6, no note for an erased or undone row (criterion 43)')
  await check('created rows with note_status failed and erased_at, or undone_at: 0 note GETs and POSTs, note_status skipped', async () => {
    const e = env({ mode: 'live' })
    seedCreated(e, 1, { createdAt: '2026-11-11T04:00:00Z', over: { note_status: 'failed', note_attempts: 1, erased_at: '2026-11-11T04:30:00Z', email: null } })
    seedCreated(e, 2, { createdAt: '2026-11-11T04:00:00Z', over: { note_status: 'failed', note_attempts: 1, undone_at: '2026-11-11T04:30:00Z', client_id: null, email: null } })
    await e.run()
    assert.strictEqual(e.fx.log.filter((l) => l.path.endsWith('/note')).length, 0)
    assert.strictEqual(e.lead('p1').note_status, 'skipped'); assert.strictEqual(e.lead('p2').note_status, 'skipped')
  })

  console.log('\n23. revision 3: ops I1, attempts count consecutive failures of the same reason (criterion 44)')
  await check('explee_error twice, then prompts_invalid: attempts 1 and not final; two more prompts_invalid make it final at 3', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    e.fx.failThreads.add('p1')
    await e.run(); await e.run()
    assert.strictEqual(e.lead('p1').reason, 'explee_error'); assert.strictEqual(e.lead('p1').attempts, 2); assert.strictEqual(e.lead('p1').final, false)
    e.fx.failThreads.delete('p1')
    e.openaiPrompts = ['too short', 'also short']
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'prompts_invalid'); assert.strictEqual(e.lead('p1').attempts, 1, 'was 3 and final'); assert.strictEqual(e.lead('p1').final, false)
    await e.run()
    assert.strictEqual(e.lead('p1').attempts, 2); assert.strictEqual(e.lead('p1').final, false)
    await e.run()
    assert.strictEqual(e.lead('p1').attempts, 3); assert.strictEqual(e.lead('p1').final, true)
  })
  await check('a would_create decision between failures resets attempts to 0', async () => {
    const e = env()
    addLead(e, 1)
    e.fx.failThreads.add('p1')
    await e.run(); await e.run()
    assert.strictEqual(e.lead('p1').attempts, 2)
    e.fx.failThreads.delete('p1')
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'would_create'); assert.strictEqual(e.lead('p1').attempts, 0)
  })

  console.log('\n24. revision 3: ops I7, skeletons and the erased hidden row (criterion 45)')
  await check('a skeleton item { person_id: null, erased: true }: no row, skeletons = 1, no error', async () => {
    const e = env()
    addLead(e, 1)
    e.fx.addSkeleton(11)
    await e.run()
    assert.strictEqual(e.db.rows('explee_leads').length, 1)
    assert.strictEqual(lastRun(e).ok, true); assert.strictEqual(lastRun(e).detail.listing['11'].skeletons, 1)
  })
  await check('a would_create row absent twice 60 minutes apart whose thread says erased: skipped erased, hash kept; the same address later is already_customer', async () => {
    const e = env()
    addLead(e, 1)
    await e.run()
    const sha = e.lead('p1').email_sha256
    assert.ok(sha)
    e.fx.erase('p1'); e.fx.hide('p1')
    e.clock.add(60000); await e.run()
    e.clock.add(60 * 60000); await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'skipped'); assert.strictEqual(r.reason, 'erased'); assert.strictEqual(r.final, true)
    assert.ok(r.erased_at); assert.strictEqual(r.email_sha256, sha); assert.strictEqual(r.email, null)
    addLead(e, 2, { email: 'lead1@co1.example', company: 'co9.example' })
    e.clock.add(60000); await e.run()
    assert.strictEqual(e.lead('p2').reason, 'already_customer')
  })

  console.log('\n25. revision 3: A2, no figures in the follow-up (criterion 47)')
  await check('an invalid follow-up body ({score}): 0 reply POSTs, statuses unchanged, followUpBodyInvalid', async () => {
    const e = env({ mode: 'live', settings: Object.assign({}, FOLLOW_UP, { follow_up_body: 'Hi {first_name}, your score is {score}.' }) })
    addLead(e, 1)
    await e.run()
    e.clock.add(61 * 60000)
    await e.run()
    assert.strictEqual(replyPosts(e).length, 0); assert.strictEqual(e.lead('p1').follow_up_status ?? null, null)
    assert.strictEqual(lastRun(e).detail.followUpBodyInvalid, true)
  })
  await check('the follow-up code path reads no results data', async () => {
    const src = fs.readFileSync(path.join(FN, 'explee-import-background.js'), 'utf8')
    const start = src.indexOf('function renderFollowUp')
    const end = src.indexOf('// ── daily')
    assert.ok(start > 0 && end > start)
    const block = src.slice(start, end)
    for (const t of ['ai_results', 'collection_runs', 'client_results_latest']) assert.ok(!block.includes(t), t)
  })

  console.log('\n26. revision 3: A3 from the importer (criterion 48)')
  await check('a hot_lead replier on mail.trybrandgeo.com: skipped own_sender_domain, held, 0 invites', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { company: 'acme.example', email: 'ana@mail.trybrandgeo.com' })
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'own_sender_domain'); assert.strictEqual(e.lead('p1').final, false)
    assert.strictEqual(e.db.invites.length, 0)
  })

  console.log('\n27. revision 3: M3, a lead claimed just before 11 minutes starts no outbound call at 13 (criterion 36)')
  for (const mode of ['live', 'dry_run']) {
    await check(`${mode}: the thread read ends past 13 minutes, so no homepage, OpenAI or provisioning call starts`, async () => {
      // Each Explee call takes 5.4 minutes: projects at 0, inbox at 5.4, the
      // lead is claimed at 10.8 (before 11) and its thread read ends at 16.2.
      const e = env({ mode, settings: { last_me_at: '2026-11-11T04:30:00Z' } })
      addLead(e, 1)
      let homepageCalls = 0
      e.timing.delayMs = 5.4 * 60000
      await e.run({ fetchHomepage: async () => { homepageCalls++; return { signal: 'Widgets', ogSiteName: null } } })
      assert.strictEqual(threadGets(e, 'p1'), 1, 'the lead was claimed and read before 11 minutes')
      assert.strictEqual(homepageCalls, 0, 'no homepage read after 13 minutes (was 1)')
      assert.strictEqual(e.openai.length, 0, 'no OpenAI call after 13 minutes')
      assert.strictEqual(e.db.rows('clients').length, 0); assert.strictEqual(e.db.invites.length, 0)
      assert.ok(e.timing.callStarts.every((s) => s.elapsed < 13 * 60000))
      assert.ok((lastRun(e).detail.truncated || []).includes('decide'), JSON.stringify(lastRun(e).detail.truncated))
      const r = e.lead('p1')
      assert.strictEqual(r.final, false)
      if (mode === 'live') { assert.strictEqual(r.state, 'seen'); assert.ok(!r.reserved_at) }
      else { assert.strictEqual(r.decision, 'would_create'); assert.strictEqual(r.would_payload ?? null, null) }
      assert.strictEqual(e.jobRuns().length, 1)
    })
  }

  console.log('\n28. revision 3: auth I1 and L7, a pending_slug that names ANOTHER website is not our orphan (criterion 32)')
  await check('a client found by pending_slug on a different brand_website: no orphan event, the row is decided again, that client untouched', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { company: 'acme.example', email: 'ana@acme.example' })
    const [theirs] = e.db.seed('clients', [{ name: 'Acme Other', slug: 'acme', brand_website: 'other-brand.example' }])
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'ana@acme.example', email_sha256: R.emailSha256('ana@acme.example'), brand_domain: 'acme.example', reserved_at: '2026-11-11T04:39:00Z', claimed_at: '2026-11-11T04:39:00Z', pending_slug: 'acme', client_id: null, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:30:00Z', updated_at: '2026-11-11T04:39:00Z' }])
    await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_orphan').length, 0, 'another client is never named as our orphan (was 1)')
    const r = e.lead('p1')
    assert.notStrictEqual(r.client_id, theirs.id)
    assert.strictEqual(r.decision, 'created')
    const kept = e.db.rows('clients').find((c) => c.id === theirs.id)
    assert.strictEqual(kept.slug, 'acme'); assert.strictEqual(kept.brand_website, 'other-brand.example')
  })

  console.log('\n29. revision 3: the migration file (criterion 33, 5.1 columns, still dry_run and no schedule)')
  await check('the migration revokes writes from authenticated, carries the rev 3 columns, defaults to dry_run, and schedules nothing', async () => {
    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'supabase-explee-lead-import-2026-11-11.sql'), 'utf8')
    assert.ok(sql.includes('revoke insert, update, delete, truncate on public.explee_leads, public.explee_import_settings from authenticated;'), 'auth I3 revoke line')
    for (const col of ['absent_since', 'pending_slug', 'last_dry_reconcile_date', 'follow_up_max_age_hours', 'max_follow_ups_per_run', 'own_sender_domains']) assert.ok(sql.includes(col), col)
    for (const st of ['skipped_declined', 'skipped_expired', 'gave_up']) assert.ok(sql.includes(`'${st}'`), st)
    assert.ok(/mode\s+text not null default 'dry_run'/.test(sql), 'ships in dry_run')
    const live = sql.split(/\r?\n/).filter((l) => !/^\s*--/.test(l)).join('\n')
    assert.ok(!/cron\.schedule/.test(live), 'the cron job stays commented out')
    assert.ok(!/create policy[^;]*for (insert|update|delete|all)/i.test(live), 'no write policy')
  })
}

// ── revision 4 (criteria 50 to 60) ─────────────────────────────────────────

/** Every clients delete answers an error (the rollback's client delete fails). */
function failClientsDelete(e) {
  const orig = e.db.from
  e.db.from = (t) => {
    const q = orig(t)
    if (t === 'clients') {
      q.delete = () => {
        const f = { eq() { return f }, then(res, rej) { return Promise.resolve({ data: null, error: { message: 'clients delete refused' } }).then(res, rej) } }
        return f
      }
    }
    return q
  }
}
const profileInserts = (e) => e.db.calls.filter((c) => c.table === 'user_profiles' && c.op === 'insert').length

async function revision4() {
  console.log('\n30. revision 4: V1, a login that appears during the run is never deleted or bound (criterion 50)')
  for (const withProfile of [true, false]) {
    await check(`(${withProfile ? 'a' : 'b'}) an unconfirmed self-serve login ${withProfile ? 'WITH' : 'without'} a profile appears during prompt generation: 0 invites, 0 deletes, 0 binds, already_customer`, async () => {
      const e = env({ mode: 'live', sbOpts: { inviteResendsPending: true } })
      addLead(e, 1)
      const gen = e.deps().generatePrompts
      let added = false
      await e.run({
        generatePrompts: async (d, o) => {
          if (!added) {
            added = true
            e.db.usersById.set('u-self', { id: 'u-self', email: 'lead1@co1.example', created_at: e.clock.now().toISOString() })
            if (withProfile) e.db.seed('user_profiles', [{ id: 'u-self', client_id: null, role: 'viewer' }])
          }
          return gen(d, o)
        },
      })
      assert.strictEqual(e.db.invites.length, 0, 'no invite (the reviewer measured 1)')
      assert.strictEqual(e.db.deletedUsers.length, 0, 'no delete (the reviewer measured the self-serve user deleted)')
      assert.strictEqual(profileInserts(e), 0, 'no user_profiles insert by the helper')
      assert.strictEqual(e.db.rows('clients').length, 0)
      assert.ok(e.db.usersById.has('u-self'))
      assert.strictEqual(e.db.rows('user_profiles').length, withProfile ? 1 : 0)
      const r = e.lead('p1')
      assert.strictEqual(r.decision, 'skipped'); assert.strictEqual(r.reason, 'already_customer'); assert.strictEqual(r.final, true)
      assert.strictEqual(r.invite_sent_at ?? null, null)
    })
  }
  await check('(c) the login appears after Check B and the invite returns it (re-send), created 6 s before T_inv: 1 invite, 0 deletes, 0 binds, not_ours stops the run', async () => {
    const e = env({
      mode: 'live',
      sbOpts: { inviteResendsPending: true },
      authBehaviour: {
        beforeInvite: async (email) => {
          if (email === 'lead1@co1.example') e.db.usersById.set('u-late', { id: 'u-late', email, created_at: new Date(e.clock.t - 6000).toISOString() })
        },
      },
    })
    addLead(e, 1); addLead(e, 2)
    await e.run()
    assert.strictEqual(e.db.invites.length, 1); assert.strictEqual(e.db.deletedUsers.length, 0)
    assert.strictEqual(profileInserts(e), 0, 'not bound (was bound)')
    assert.strictEqual(e.db.rows('clients').length, 0)
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'skipped'); assert.strictEqual(r.reason, 'already_customer'); assert.strictEqual(r.final, true)
    assert.ok(r.invite_sent_at, 'invite_sent_at set'); assert.strictEqual(r.user_id ?? null, null)
    assert.ok(r.email_sha256 && r.reserved_at, 'suppression and window kept')
    assert.strictEqual(lastRun(e).detail.stopCreating, 'not_ours')
    assert.strictEqual(lastRun(e).detail.createsAttempted, 1, 'the second lead gets no provisioning call')
    assert.ok(e.lead('p2').decision !== 'created')
  })
  await check('(d) created 1 s before T_inv and a profile already exists: 23505, 0 deletes, profile unchanged, already_customer with invite_sent_at', async () => {
    const e = env({
      mode: 'live',
      sbOpts: { inviteResendsPending: true },
      authBehaviour: {
        beforeInvite: async (email) => {
          e.db.usersById.set('u-close', { id: 'u-close', email, created_at: new Date(e.clock.t - 1000).toISOString() })
          e.db.seed('user_profiles', [{ id: 'u-close', client_id: null, role: 'viewer' }])
        },
      },
    })
    addLead(e, 1)
    await e.run()
    assert.strictEqual(e.db.deletedUsers.length, 0, 'never deleted (was deleted)')
    assert.strictEqual(e.db.rows('user_profiles').length, 1); assert.strictEqual(e.db.rows('user_profiles')[0].client_id, null)
    assert.strictEqual(e.db.rows('clients').length, 0)
    const r = e.lead('p1')
    assert.strictEqual(r.reason, 'already_customer'); assert.strictEqual(r.final, true); assert.ok(r.invite_sent_at)
  })
  await check('(e) the invite returns a new user with no created_at (stampCreatedAt off): not bound, not deleted, already_customer with invite_sent_at', async () => {
    const e = env({ mode: 'live', sbOpts: { stampCreatedAt: false } })
    addLead(e, 1)
    await e.run()
    assert.strictEqual(e.db.invites.length, 1); assert.strictEqual(profileInserts(e), 0); assert.strictEqual(e.db.deletedUsers.length, 0)
    assert.strictEqual(e.db.rows('clients').length, 0)
    const r = e.lead('p1')
    assert.strictEqual(r.reason, 'already_customer'); assert.ok(r.invite_sent_at)
    assert.strictEqual(lastRun(e).detail.stopCreating, 'not_ours')
  })
  await check('a normal live create still binds the new user (stampCreatedAt on): created, invite_sent_at written with user_id', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'created'); assert.ok(r.user_id); assert.strictEqual(r.invite_sent_at, '2026-11-11T05:00:00.000Z')
  })

  console.log('\n31. revision 4: V2, a half_made after an invite stays in the daily window and suppresses the address (criterion 51)')
  await check('max_creates_per_day 1, profile insert AND the rollback client delete failing, 4 hourly runs, 4 leads: exactly 1 invite', async () => {
    const e = env({ mode: 'live', settings: { max_creates_per_day: 1 }, sbOpts: { failInsert: ['user_profiles'] } })
    failClientsDelete(e)
    for (let i = 1; i <= 4; i++) addLead(e, i)
    await e.run()
    const first = e.lead('p1')
    assert.strictEqual(first.decision, 'failed'); assert.strictEqual(first.reason, 'half_made'); assert.strictEqual(first.final, true)
    assert.ok(first.invite_sent_at, 'invite_sent_at set')
    for (let run = 2; run <= 4; run++) {
      e.clock.add(HOUR_MS)
      await e.run()
      assert.strictEqual(lastRun(e).detail.stopCreating, 'day_cap', `run ${run}`)
    }
    assert.strictEqual(e.db.invites.length, 1, 'one invite in total (the reviewer measured 4)')
  })
  await check('one address under two person_ids of two companies: the first half_made after its invite, the second run healthy: 1 invite, already_customer', async () => {
    const e = env({ mode: 'live', sbOpts: { failInsert: ['user_profiles'] } })
    const origFrom = e.db.from
    failClientsDelete(e)
    addLead(e, 1, { email: 'ana@mailbox.example', company: 'one.example' })
    addLead(e, 2, { email: 'ana@mailbox.example', company: 'two.example' })
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'half_made')
    e.db.from = origFrom
    e.db.failInsert = null
    e.clock.add(HOUR_MS)
    await e.run()
    assert.strictEqual(e.db.invites.length, 1, 'the same address is invited once (was twice)')
    assert.strictEqual(e.lead('p2').decision, 'skipped'); assert.strictEqual(e.lead('p2').reason, 'already_customer')
  })

  console.log('\n32. revision 4: V3, D5 duplicate 4 and the re-check share companyConflict (criterion 52)')
  await check("p1's only conflict is a created row's email_domain: company_has_account in run 1 with 0 reservations; run 2 makes 0 Explee calls for it", async () => {
    const e = env({ mode: 'live' })
    addLead(e, 2, { company: 'other.example', email: 'bo@sales.acme.example' })
    const [c] = e.db.seed('clients', [{ name: 'Other', slug: 'other', brand_website: 'other.example' }])
    e.db.seed('explee_leads', [{
      person_id: 'p2', project_id: 11, campaign_id: 21, state: 'decided', decision: 'created', reason: null, final: true,
      invitee_source: 'replier', email: 'bo@sales.acme.example', email_sha256: R.emailSha256('bo@sales.acme.example'),
      brand_domain: 'other.example', email_domain: 'sales.acme.example', client_id: c.id, reserved_at: '2026-11-10T05:00:00Z',
      invite_sent_at: '2026-11-10T05:00:00Z', created_at_account: '2026-11-10T05:00:00Z', decided_at: '2026-11-10T05:00:00Z', attempts: 0,
      note_status: 'written', collection_status: 'enqueued', collection_attempts: 1, first_seen_at: '2026-11-10T05:00:00Z', updated_at: '2026-11-10T05:00:00Z',
    }])
    addLead(e, 1, { company: 'acme.example', email: 'ana@acme.example' })
    await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'skipped'); assert.strictEqual(r.reason, 'company_has_account'); assert.strictEqual(r.final, true)
    assert.strictEqual(lastRun(e).detail.reservationRechecks || 0, 0, 'no reservation was made (was 1 every run)')
    assert.strictEqual(e.db.invites.length, 0)
    const before = callsFor(e, 'p1')
    e.clock.add(HOUR_MS)
    await e.run()
    assert.strictEqual(callsFor(e, 'p1'), before, 'decided, never looped')
  })
  await check('source text: duplicateOf and conflictAfterReservation both call companyConflict', async () => {
    const src = fs.readFileSync(path.join(FN, 'explee-import-background.js'), 'utf8')
    for (const fn of ['duplicateOf', 'conflictAfterReservation']) {
      const start = src.indexOf(`async function ${fn}(`)
      const end = src.indexOf('\n}\n', start)
      assert.ok(start > 0 && end > start, fn)
      assert.ok(src.slice(start, end).includes('R.companyConflict('), `${fn} calls companyConflict`)
    }
  })

  console.log('\n33. revision 4: V4, a follow-up thread with a non-include label (criterion 53)')
  await check('a wrong_person reply after creation: skipped_label, 0 reply POSTs, counted; the next run reads no thread for it', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T10:00:00Z', settings: Object.assign({ last_reconcile_date: '2026-11-11', last_summary_date: '2026-11-11' }, FOLLOW_UP) })
    addLead(e, 1)
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'created')
    e.fx.addReply('p1', { intent: 'wrong_person', body: 'Not my area.', from: 'lead1@co1.example', ts: '2026-11-11T10:30:00Z' })
    e.clock.set('2026-11-11T11:05:00Z')
    await e.run()
    assert.strictEqual(replyPosts(e).length, 0, 'no follow-up (was sent)')
    assert.strictEqual(e.lead('p1').follow_up_status, 'skipped_label')
    assert.strictEqual(lastRun(e).detail.followUps.label, 1)
    const before = threadGets(e, 'p1')
    e.clock.add(HOUR_MS)
    await e.run()
    assert.strictEqual(threadGets(e, 'p1'), before, 'skipped_label is never selected again')
  })

  console.log('\n34. revision 4: I-1 from the importer (criterion 54)')
  await check('own_sender_domains = [] in the settings row: a replier at getbrandgeo.com is still own_sender_domain, 0 invites', async () => {
    const e = env({ mode: 'live', settings: { own_sender_domains: [] } })
    addLead(e, 1, { company: 'acme.example', email: 'ana@getbrandgeo.com' })
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'own_sender_domain', 'was created'); assert.strictEqual(e.lead('p1').final, false)
    assert.strictEqual(e.db.invites.length, 0)
  })
  await check('a replier at persona.example when our sent messages came from team@mail.persona.example: own_sender_domain, 0 invites', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { company: 'persona.example', email: 'ana@persona.example' })
    for (const m of e.fx.threadOf('p1').messages) if (m.type === 'sent') m.from_email = 'team@mail.persona.example'
    await e.run()
    assert.strictEqual(e.lead('p1').reason, 'own_sender_domain', 'was created'); assert.strictEqual(e.db.invites.length, 0)
  })

  console.log('\n35. revision 4: N1, the 13 minute guard before the homepage, each generation, provisioning and the summary (criterion 55)')
  const slowGen = (e, answers, counter) => async () => {
    counter.n++
    e.clock.add(25000)
    return answers[counter.n - 1] || answers[answers.length - 1]
  }
  await check('thread read ends at 12.6 min, homepage 6 s, first answer invalid at 13.1 min: the retry is not started, no invite, row released, guard', async () => {
    const e = env({ mode: 'live', settings: { last_me_at: '2026-11-11T04:30:00Z' } })
    addLead(e, 1)
    e.timing.delayMs = 4.2 * 60000
    const counter = { n: 0 }
    await e.run({
      fetchHomepage: async () => { e.clock.add(6000); return { signal: 'Widgets', ogSiteName: null } },
      generatePrompts: slowGen(e, [{ prompts: ['too short'], brandName: '' }, { prompts: GOOD_PROMPTS, brandName: '' }], counter),
    })
    assert.strictEqual(counter.n, 1, 'the second generation is not started (was 2)')
    assert.strictEqual(e.db.invites.length, 0, 'no invite at or after 13 minutes (the reviewer measured 13.53)')
    assert.strictEqual(e.db.rows('clients').length, 0)
    const r = e.lead('p1')
    assert.ok(!r.reserved_at); assert.strictEqual(r.final, false); assert.strictEqual(r.attempts || 0, 0); assert.strictEqual(r.attempts_total || 0, 0)
    const d = lastRun(e).detail
    assert.ok((d.truncated || []).includes('decide'), JSON.stringify(d.truncated)); assert.strictEqual(d.stopCreating, 'guard')
  })
  await check('first answer valid but it returns at 13.02 min: the check after the settings re-read stops provisioning', async () => {
    const e = env({ mode: 'live', settings: { last_me_at: '2026-11-11T04:30:00Z' } })
    addLead(e, 1)
    e.timing.delayMs = 250000
    const counter = { n: 0 }
    await e.run({
      fetchHomepage: async () => { e.clock.add(6000); return { signal: 'Widgets', ogSiteName: null } },
      generatePrompts: slowGen(e, [{ prompts: GOOD_PROMPTS, brandName: '' }], counter),
    })
    assert.strictEqual(counter.n, 1)
    assert.strictEqual(e.db.invites.length, 0, 'no provisioning at or after 13 minutes (was 1)'); assert.strictEqual(e.db.rows('clients').length, 0)
    assert.ok(!e.lead('p1').reserved_at); assert.strictEqual(lastRun(e).detail.stopCreating, 'guard')
    assert.strictEqual(lastRun(e).detail.createsAttempted, 0)
  })
  await check('the thread read ends at 12.95 min: no homepage read is started after 13 min of a 6 s homepage (checked before it)', async () => {
    const e = env({ mode: 'live', settings: { last_me_at: '2026-11-11T04:30:00Z' } })
    addLead(e, 1)
    e.timing.delayMs = (13 * 60000 - 3000) / 3
    let homepage = 0
    await e.run({ fetchHomepage: async () => { homepage++; e.clock.add(6000); return { signal: 'W', ogSiteName: null } } })
    assert.strictEqual(homepage, 1, 'started at 12.95, before the guard')
    assert.strictEqual(e.db.invites.length, 0); assert.strictEqual(e.openai.length, 0, 'no generation started after 13 minutes')
  })
  await check('the last listing page returns at 14.0 min at 07:05 UTC: no summary, last_summary_date unchanged, deferred_guard; 08:05 sends it once', async () => {
    const e = env({ mode: 'live', clockIso: '2026-11-11T07:05:00Z', settings: { last_me_at: '2026-11-11T07:00:00Z', last_summary_date: '2026-11-10', last_reconcile_date: '2026-11-11' } })
    e.timing.delayMs = 7 * 60000
    await e.run()
    const d = lastRun(e).detail
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_daily_summary').length, 0, 'not sent past 13 minutes (was sent at 14.0)')
    assert.strictEqual(e.db.rows('explee_import_settings')[0].last_summary_date, '2026-11-10')
    assert.strictEqual(d.summary, 'deferred_guard'); assert.ok((d.truncated || []).includes('summary'), JSON.stringify(d.truncated))
    e.timing.delayMs = 0
    e.clock.set('2026-11-11T08:05:00Z')
    await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_daily_summary').length, 1)
    assert.strictEqual(lastRun(e).detail.summary, 'sent')
  })

  console.log('\n36. revision 4: N3, a total-attempts ceiling of 10 (criterion 57)')
  await check('explee_error and prompts_invalid alternating: attempts stays 1, attempts_total 1 to 10, final at the 10th; the 11th run costs 0 calls; listed in the summary', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1)
    for (let run = 1; run <= 10; run++) {
      if (run % 2 === 1) { e.fx.failThreads.add('p1'); e.openaiPrompts = GOOD_PROMPTS } else { e.fx.failThreads.delete('p1'); e.openaiPrompts = ['too short'] }
      await e.run()
      const r = e.lead('p1')
      assert.strictEqual(r.attempts, 1, `run ${run} attempts`)
      assert.strictEqual(r.attempts_total, run, `run ${run} attempts_total`)
      assert.strictEqual(r.final, run === 10, `run ${run} final (was never final)`)
      e.clock.add(60000)
    }
    assert.strictEqual(e.lead('p1').reason, 'prompts_invalid')
    const calls = callsFor(e, 'p1')
    const ai = e.openai.length
    await e.run()
    assert.strictEqual(callsFor(e, 'p1'), calls); assert.strictEqual(e.openai.length, ai)
    e.setSettings({ last_reconcile_date: '2026-11-11' })
    e.clock.set('2026-11-11T07:05:00Z')
    await e.run()
    const s = e.events.find((x) => x.type === 'explee_daily_summary')
    assert.ok(s && /Final after 10 failures: p1\b/.test(s.body), s && s.body)
  })
  await check('failure(): email_rate_limited raises attempts_total by 0; any other reason by 1, capped at 10', async () => {
    assert.strictEqual(typeof importer.failure, 'function', 'failure is exported for this test')
    const base = { decision: 'failed', reason: 'email_rate_limited', attempts: 2, attempts_total: 4 }
    let row = base
    for (let i = 0; i < 12; i++) { row = Object.assign({}, row, importer.failure(row, 'email_rate_limited')) }
    assert.strictEqual(row.attempts_total, 4)
    assert.strictEqual(importer.failure({ decision: 'failed', reason: 'x', attempts: 1, attempts_total: 9 }, 'y').attempts_total, 10)
    assert.strictEqual(importer.failure({ decision: 'failed', reason: 'x', attempts: 1, attempts_total: 9 }, 'y').final, true)
    assert.strictEqual(importer.failure({ decision: 'failed', reason: 'x', attempts: 1, attempts_total: 10 }, 'y').attempts_total, 10)
  })

  console.log('\n37. revision 4: N4, a thread message newer than absent_since keeps the row (criterion 58)')
  await check('absent from two complete listings 60 min apart, a reply 10 min after absent_since: not hidden, absent_since cleared, absentCleared 1', async () => {
    const e = env()
    addLead(e, 1)
    await e.run()
    assert.strictEqual(e.lead('p1').decision, 'would_create')
    e.fx.addReply('p1', { intent: 'hot_lead', body: 'Still keen.', from: 'lead1@co1.example', ts: '2026-11-11T05:11:00Z' })
    e.fx.hide('p1')
    e.clock.add(60000); await e.run()
    assert.strictEqual(e.lead('p1').absent_since, '2026-11-11T05:01:00.000Z')
    e.clock.add(60 * 60000); await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.final, false, 'not finalised (was hidden)'); assert.strictEqual(r.absent_since, null)
    assert.notStrictEqual(r.reason, 'hidden')
    assert.strictEqual(lastRun(e).detail.listing['11'].absentCleared, 1)
    assert.strictEqual(lastRun(e).detail.listing['11'].hiddenConfirmed, 0)
  })
  await check('the same with an erased thread: erased wins (order: erased, declined, newer message, hidden)', async () => {
    const e = env()
    addLead(e, 1)
    await e.run()
    e.fx.addReply('p1', { intent: 'hot_lead', body: 'Still keen.', from: 'lead1@co1.example', ts: '2026-11-11T05:11:00Z' })
    e.fx.erase('p1'); e.fx.hide('p1')
    e.clock.add(60000); await e.run()
    e.clock.add(60 * 60000); await e.run()
    assert.strictEqual(e.lead('p1').reason, 'erased'); assert.strictEqual(e.lead('p1').final, true)
  })
  await check('the same with a newer decline: declined wins over the newer message', async () => {
    const e = env()
    addLead(e, 1)
    await e.run()
    e.fx.addReply('p1', { intent: 'opted_out', body: 'Take me off.', from: 'lead1@co1.example', ts: '2026-11-11T05:11:00Z' })
    e.fx.hide('p1')
    e.clock.add(60000); await e.run()
    e.clock.add(60 * 60000); await e.run()
    assert.strictEqual(e.lead('p1').reason, 'declined'); assert.strictEqual(e.lead('p1').final, true)
  })

  console.log('\n38. revision 4: criterion 60, the builder deviation (pinned, it passed before this round)')
  await check('pending_slug client on another website: no orphan event, pending_slug cleared, created on a suffixed slug', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { company: 'acme.example', email: 'ana@acme.example' })
    e.db.seed('clients', [{ name: 'Acme Other', slug: 'acme', brand_website: 'other.example' }])
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'ana@acme.example', email_sha256: R.emailSha256('ana@acme.example'), brand_domain: 'acme.example', reserved_at: '2026-11-11T04:39:00Z', claimed_at: '2026-11-11T04:39:00Z', pending_slug: 'acme', client_id: null, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:30:00Z', updated_at: '2026-11-11T04:39:00Z' }])
    await e.run()
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_orphan').length, 0)
    const r = e.lead('p1')
    assert.strictEqual(r.decision, 'created'); assert.strictEqual(r.pending_slug ?? null, null)
    assert.strictEqual(e.db.rows('clients').find((c) => c.id === r.client_id).slug, 'acme-ssss')
  })
  await check('pending_slug client stored as https://www.ACME.example/: half_made with that client_id, 1 event, 0 deletes', async () => {
    const e = env({ mode: 'live' })
    addLead(e, 1, { company: 'acme.example', email: 'ana@acme.example' })
    const [orphan] = e.db.seed('clients', [{ name: 'Acme', slug: 'acme', brand_website: 'https://www.ACME.example/' }])
    e.db.seed('explee_leads', [{ person_id: 'p1', project_id: 11, campaign_id: 21, state: 'processing', decision: 'creating', email: 'ana@acme.example', email_sha256: R.emailSha256('ana@acme.example'), brand_domain: 'acme.example', reserved_at: '2026-11-11T04:39:00Z', claimed_at: '2026-11-11T04:39:00Z', pending_slug: 'acme', client_id: null, user_id: null, attempts: 0, final: false, first_seen_at: '2026-11-11T04:30:00Z', updated_at: '2026-11-11T04:39:00Z' }])
    await e.run()
    const r = e.lead('p1')
    assert.strictEqual(r.reason, 'half_made'); assert.strictEqual(r.client_id, orphan.id)
    assert.strictEqual(e.events.filter((x) => x.type === 'explee_orphan').length, 1)
    assert.strictEqual(e.db.deletedUsers.length, 0); assert.strictEqual(e.db.rows('clients').length, 1)
  })

  console.log('\n39. revision 4: the migration file (5.1, criteria 51, 53, 57), still dry_run and no schedule')
  await check('the migration carries invite_sent_at, attempts_total with its CHECK, the invite_sent index and skipped_label', async () => {
    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'supabase-explee-lead-import-2026-11-11.sql'), 'utf8')
    assert.ok(/invite_sent_at\s+timestamptz/.test(sql), 'invite_sent_at')
    assert.ok(/attempts_total\s+integer not null default 0 check \(attempts_total between 0 and 10\)/.test(sql), 'attempts_total')
    assert.ok(/create index if not exists idx_explee_leads_invite_sent[^\n]*\n\s*on public\.explee_leads \(invite_sent_at\) where invite_sent_at is not null;/.test(sql), 'invite_sent index')
    assert.ok(sql.includes("'skipped_label'"), 'skipped_label')
    assert.ok(/mode\s+text not null default 'dry_run'/.test(sql), 'ships in dry_run')
    const live = sql.split(/\r?\n/).filter((l) => !/^\s*--/.test(l)).join('\n')
    assert.ok(!/cron\.schedule/.test(live), 'the cron job stays commented out')
  })
}

main().catch((e) => { console.error(e); process.exit(1) })
