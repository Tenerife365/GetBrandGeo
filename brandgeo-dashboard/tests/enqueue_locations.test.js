/**
 * enqueue_locations.test.js - per-prompt location on the collection queue
 * (docs/arch/multi-location-collection.md section 6.1).
 *
 * Run: `node tests/enqueue_locations.test.js` from brandgeo-dashboard/.
 *
 * The real _enqueue.js runs against tests/helpers/fake_supabase_mem.js. The
 * manual path also runs the real enqueue-collection.js handler with _auth.js
 * stubbed and fetch stubbed (the worker kick), so nothing touches the network.
 * Fixtures name no real client.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN

const FN = path.join(__dirname, '..', 'netlify', 'functions')

let passes = 0
let failures = 0
async function check(name, fn) {
  try { await fn(); passes++; console.log(`  ok   ${name}`) } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e && e.message}`) }
}

function installModule(resolved, exportsObj) {
  const m = new Module(resolved, null)
  m.filename = resolved
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolved] = m
}

let db = null
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => db })
installModule(path.join(FN, '_auth.js'), {
  async requireAuth(event) {
    const h = (event.headers && event.headers.authorization) || ''
    if (h === 'Bearer tok-admin') return { user: { id: 'u-admin' }, profile: { role: 'admin', client_id: null }, supabase: db, headers: { 'Content-Type': 'application/json' } }
    if (h === 'Bearer tok-viewer') return { user: { id: 'u-viewer' }, profile: { role: 'viewer', client_id: 1 }, supabase: db, headers: { 'Content-Type': 'application/json' } }
    return { response: { statusCode: 401, headers: {}, body: '{"error":"Unauthorized"}' } }
  },
  async checkCollectionLimits() { return { blocked: false } },
})
let fetches = 0
global.fetch = async () => { fetches++; return { ok: true, status: 200, json: async () => ({}) } }

const { enqueueClientCollection } = require(path.join(FN, '_enqueue'))
const enqueueHandler = require(path.join(FN, 'enqueue-collection.js')).handler

// radar = gemini + claude: no monthly-capped engine, so every job carries both.
const CLIENT = { id: 1, name: 'Fixture Example', plan: 'radar', engines_enabled: null, brand_aliases: ['fixture'], brand_website: 'fixture.example', known_competitors: [], default_market_id: 'RO', default_region_id: 'ALL' }

function fresh({ prompts, locations, client = CLIENT } = {}) {
  db = createFakeSupabase()
  db.seed('clients', [client, { id: 2, name: 'Other Example', plan: 'radar', default_market_id: 'US', default_region_id: 'ALL' }])
  db.seed('client_locations', locations || [
    { id: 10, client_id: 1, market_id: 'RO', region_id: 'ALL', is_primary: true, position: 0, archived_at: null },
    { id: 11, client_id: 1, market_id: 'ES', region_id: 'TF', is_primary: false, position: 1, archived_at: null },
    { id: 12, client_id: 1, market_id: 'WW', region_id: 'ALL', is_primary: false, position: 2, archived_at: null },
    { id: 13, client_id: 1, market_id: 'WW', region_id: 'OCE', is_primary: false, position: 3, archived_at: null },
    { id: 14, client_id: 1, market_id: 'US', region_id: 'AUS', is_primary: false, position: 4, archived_at: null },
    { id: 15, client_id: 1, market_id: 'DE', region_id: 'BE', is_primary: false, position: 5, archived_at: '2026-11-01T00:00:00.000Z' },
    { id: 90, client_id: 2, market_id: 'US', region_id: 'NYC', is_primary: true, position: 0, archived_at: null },
  ])
  db.seed('prompts', prompts || [
    { id: 101, client_id: 1, text: 'q romania', is_active: true, position: 1, location_id: 10 },
    { id: 102, client_id: 1, text: 'q tenerife', is_active: true, position: 2, location_id: 11 },
    { id: 103, client_id: 1, text: 'q worldwide', is_active: true, position: 3, location_id: 12 },
    { id: 104, client_id: 1, text: 'q oceania', is_active: true, position: 4, location_id: 13 },
    { id: 105, client_id: 1, text: 'q research city', is_active: true, position: 5, location_id: 14 },
    { id: 106, client_id: 1, text: 'q archived location', is_active: true, position: 6, location_id: 15 },
    { id: 107, client_id: 1, text: 'q inactive', is_active: false, position: 7, location_id: 11 },
  ])
  db.seed('ai_results', [])
  db.seed('collection_runs', [])
  db.seed('collection_jobs', [])
}
const jobs = () => db.rows('collection_jobs')
const job = (pid) => jobs().find(j => j.prompt_id === pid)
const geo = (j) => ({ location_id: j.location_id, market_id: j.market_id, region_id: j.region_id, market_label: j.market_label, region_label: j.region_label })

;(async () => {
  const warn = console.warn; const err = console.error; const log = console.log
  console.warn = () => {}; console.error = () => {}
  console.log = (...a) => { if (String(a[0] || '').startsWith('[')) return; log(...a) }

  console.log('scheduled run, geo per prompt')
  await check('one run, one job per active prompt, each with its own location', async () => {
    fresh()
    const r = await enqueueClientCollection(db, { clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled' })
    assert.strictEqual(r.skipped, false)
    assert.strictEqual(db.rows('collection_runs').length, 1)
    assert.strictEqual(jobs().length, 6, 'the inactive prompt is not enqueued')
    assert.ok(jobs().every(j => j.run_id === r.runId))
  })
  await check('a country at ALL: country level', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(101)), { location_id: 10, market_id: 'RO', region_id: 'ALL', market_label: 'Romania', region_label: null })
  })
  await check('a city: region label set', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(102)), { location_id: 11, market_id: 'ES', region_id: 'TF', market_label: 'Spain', region_label: 'Tenerife' })
  })
  await check('WW / ALL: Worldwide label and no country-level market geo (no region)', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    const g = geo(job(103))
    assert.deepStrictEqual(g, { location_id: 12, market_id: 'WW', region_id: 'ALL', market_label: 'Worldwide', region_label: null })
  })
  await check('a WW continent: Worldwide plus the continent', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(104)), { location_id: 13, market_id: 'WW', region_id: 'OCE', market_label: 'Worldwide', region_label: 'Oceania' })
  })
  await check('an unknown research region resolves to country level, run not failed', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(105)), { location_id: 14, market_id: 'US', region_id: 'AUS', market_label: 'United States', region_label: null })
  })
  await check('a prompt on an archived location keeps that location (archived rows are read)', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(106)), { location_id: 15, market_id: 'DE', region_id: 'BE', market_label: 'Germany', region_label: 'Berlin' })
  })
  await check('the job keeps every column the worker read before, plus region_id and location_id', async () => {
    fresh(); await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    const keys = Object.keys(job(101)).filter(k => !['id', 'created_at'].includes(k)).sort()
    assert.deepStrictEqual(keys, ['client_config', 'client_id', 'engines', 'location_id', 'market_id', 'market_label', 'prompt_id', 'prompt_text', 'region_id', 'region_label', 'run_id'])
    assert.deepStrictEqual(job(101).engines, ['gemini', 'claude'])
  })

  console.log('the S1 fallback')
  await check('a null location_id: the client default market at country level, location_id null', async () => {
    fresh({ prompts: [{ id: 201, client_id: 1, text: 'old', is_active: true, position: 1, location_id: null }] })
    await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(201)), { location_id: null, market_id: 'RO', region_id: null, market_label: 'Romania', region_label: null })
  })
  await check('no prompt with a location_id: client_locations is not read at all', async () => {
    fresh({ prompts: [{ id: 201, client_id: 1, text: 'old', is_active: true, position: 1 }] })
    db.calls.length = 0
    await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.ok(!db.calls.some(c => c.table === 'client_locations'))
  })
  await check('a location id of another client is never used: fallback to this client default', async () => {
    fresh({ prompts: [{ id: 202, client_id: 1, text: 'forged', is_active: true, position: 1, location_id: 90 }] })
    await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.deepStrictEqual(geo(job(202)), { location_id: null, market_id: 'RO', region_id: null, market_label: 'Romania', region_label: null })
  })
  await check('exactly one client_locations read per run, whatever the number of prompts', async () => {
    fresh(); db.calls.length = 0
    await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.strictEqual(db.calls.filter(c => c.table === 'client_locations').length, 1)
  })
  await check('a failed client_locations read: run refused, nothing written, nothing deleted', async () => {
    fresh()
    db.seed('ai_results', [{ client_id: 1, prompt_id: 101, llm: 'gemini', checked_at: new Date().toISOString(), status: 'ok' }])
    const orig = db.from
    db.from = (t) => {
      if (t !== 'client_locations') return orig(t)
      const b = { select() { return b }, eq() { return b }, in() { return b }, then(res, rej) { return Promise.resolve({ data: null, error: { message: 'simulated read failure' } }).then(res, rej) } }
      return b
    }
    const r = await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'manual' })
    assert.strictEqual(r.skipped, true); assert.strictEqual(r.reason, 'location read failed')
    assert.strictEqual(r.transient, true, 'marked transient so the scheduler retries (L1)')
    assert.strictEqual(db.rows('collection_runs').length, 0); assert.strictEqual(jobs().length, 0)
    assert.strictEqual(db.rows('ai_results').length, 1, 'the manual force delete did not run')
  })
  await check('a failed client_locations read on a SCHEDULED run: refused and marked transient: true', async () => {
    fresh()
    const orig = db.from
    db.from = (t) => {
      if (t !== 'client_locations') return orig(t)
      const b = { select() { return b }, eq() { return b }, in() { return b }, then(res, rej) { return Promise.resolve({ data: null, error: { message: 'simulated read failure' } }).then(res, rej) } }
      return b
    }
    const r = await enqueueClientCollection(db, { clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled' })
    assert.strictEqual(r.skipped, true); assert.strictEqual(r.reason, 'location read failed'); assert.strictEqual(r.transient, true)
    assert.strictEqual(db.rows('collection_runs').length, 0); assert.strictEqual(jobs().length, 0)
  })
  await check('a skip that says something about the client is NOT transient (no active prompts)', async () => {
    fresh({ prompts: [{ id: 301, client_id: 1, text: 'off', is_active: false, position: 1, location_id: 10 }] })
    const r = await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'scheduled' })
    assert.strictEqual(r.skipped, true); assert.strictEqual(r.reason, 'no active prompts')
    assert.ok(!r.transient, 'stamped by the scheduler as before')
  })

  console.log('R9: an imported client whose trigger-filled primary is WW / ALL')
  await check('the job geo is the neutral worldwide one and the system text names no place', async () => {
    const imported = { id: 1, name: 'Imported Example', plan: 'radar', engines_enabled: null, brand_aliases: ['imported'], brand_website: 'imported.example.de', known_competitors: [], default_market_id: 'WW', default_region_id: null }
    fresh({
      client: imported,
      locations: [{ id: 30, client_id: 1, market_id: 'WW', region_id: 'ALL', is_primary: true, position: 0, archived_at: null }],
      prompts: [{ id: 401, client_id: 1, text: 'q imported', is_active: true, position: 1, location_id: 30 }],
    })
    const r = await enqueueClientCollection(db, { clientId: 1, force: true, replaceExisting: false, trigger: 'scheduled' })
    assert.strictEqual(r.skipped, false)
    assert.deepStrictEqual(geo(job(401)), { location_id: 30, market_id: 'WW', region_id: 'ALL', market_label: 'Worldwide', region_label: null })
    // The worker hands these labels to buildSystemContext. With WORLDWIDE_NEUTRAL
    // on, the text is the language instruction alone: not the TLD fallback
    // (the .de website would otherwise give "Germany") and not "based in Worldwide".
    const { buildSystemContext, WORLDWIDE_NEUTRAL } = require(path.join(FN, '_collect'))
    assert.strictEqual(WORLDWIDE_NEUTRAL, true)
    const text = buildSystemContext(job(401).client_config, job(401).market_label, job(401).region_label)
    assert.strictEqual(text, 'Respond in the same language as the question.')
    assert.ok(!/Germany|Worldwide|based in/.test(text))
  })

  console.log('manual run')
  await check('opts.market is ignored: each prompt still gets its own location', async () => {
    fresh()
    await enqueueClientCollection(db, { clientId: 1, force: true, trigger: 'manual', market: { market_id: 'US', market_label: 'USA', region_label: 'New York' } })
    assert.strictEqual(job(101).market_id, 'RO'); assert.strictEqual(job(102).region_label, 'Tenerife')
    assert.ok(jobs().every(j => j.region_label !== 'New York'))
  })
  await check('the real enqueue-collection handler with browser markets: jobs follow the prompts, not the body', async () => {
    fresh(); fetches = 0
    const res = await enqueueHandler({
      httpMethod: 'POST',
      headers: { authorization: 'Bearer tok-viewer', origin: 'https://app.getbrandgeo.com' },
      body: JSON.stringify({ client_id: 1, markets: [{ market: { id: 'US', label: 'USA' }, region: { id: 'NYC', label: 'New York' } }, { market: { id: 'FR', label: 'France' } }] }),
    })
    assert.strictEqual(res.statusCode, 200, res.body)
    const body = JSON.parse(res.body)
    assert.strictEqual(body.total_jobs, 6); assert.strictEqual(db.rows('collection_runs').length, 1)
    assert.deepStrictEqual(geo(job(102)), { location_id: 11, market_id: 'ES', region_id: 'TF', market_label: 'Spain', region_label: 'Tenerife' })
    assert.ok(jobs().every(j => j.market_id !== 'FR' && j.region_label !== 'New York'))
    assert.strictEqual(fetches, 1, 'the worker kick (stubbed fetch)')
  })
  await check('non-force manual run: the month skip is per prompt, so a location\'s prompt is skipped only on its own OK row', async () => {
    fresh()
    const now = new Date().toISOString()
    db.seed('ai_results', [
      { client_id: 1, prompt_id: 101, llm: 'gemini', checked_at: now, status: 'ok' },
      { client_id: 1, prompt_id: 101, llm: 'claude', checked_at: now, status: 'ok' },
    ])
    await enqueueClientCollection(db, { clientId: 1, force: false, trigger: 'manual' })
    assert.strictEqual(job(101), undefined, 'prompt 101 (RO) done this month')
    assert.deepStrictEqual(job(102).engines, ['gemini', 'claude'], 'prompt 102 (Tenerife) still runs in full')
  })

  console.log = log; console.warn = warn; console.error = err
  console.log(`\nenqueue_locations: ${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
})().catch((e) => { console.error('suite crashed:', e); process.exit(1) })
