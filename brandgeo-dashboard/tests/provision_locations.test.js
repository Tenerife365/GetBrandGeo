/**
 * provision_locations.test.js - extra locations, prompts mapped per location
 * key and the server prompt cap in onboarding
 * (docs/arch/multi-location-collection.md section 5.4).
 *
 * Run: `node tests/provision_locations.test.js` from brandgeo-dashboard/.
 *
 * Fakes: @supabase/supabase-js (tests/helpers/fake_supabase_mem.js with the
 * opt-in client_locations SQL functions) and _auth.js (requireAuth passes as
 * an admin). The fake has no trigger, so a primary prompt row stays without a
 * location_id here (the database trigger fills it in production). Fixtures use
 * example.com addresses and name no real client.
 */
const assert = require('assert')
const path = require('path')
const Module = require('module')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key-placeholder'
delete process.env.SENTRY_DSN

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const ADMIN_ID = '00000000-0000-4000-8000-0000000000aa'

let passes = 0
let failures = 0
async function check(name, fn) {
  try { await fn(); passes++; console.log(`  ok   ${name}`) } catch (e) { failures++; console.log(`  FAIL ${name}\n       ${e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e}`) }
}

function installModule(resolved, exportsObj) {
  const m = new Module(resolved, null)
  m.filename = resolved
  m.loaded = true
  m.exports = exportsObj
  require.cache[resolved] = m
}
let currentDb = null
installModule(require.resolve('@supabase/supabase-js', { paths: [FN] }), { createClient: () => currentDb })
installModule(path.join(FN, '_auth.js'), {
  requireAuth: async () => ({ user: { id: ADMIN_ID }, profile: { role: 'admin', client_id: null }, headers: { 'Content-Type': 'application/json' } }),
  checkCollectionLimits: async () => ({ blocked: false }),
})

const P = require(path.join(FN, '_provision_client'))
const wizard = require(path.join(FN, 'onboard-client'))

function makeDb({ caps = [{ plan: 'free', prompt_cap: 5 }, { plan: 'growth', prompt_cap: 35 }], rpcFails = false } = {}) {
  const db = createFakeSupabase({ now: () => new Date(), pagedListUsers: true, stampCreatedAt: true, clientLocations: true, extraUnique: { clients: [['slug']] } })
  if (caps) db.seed('plan_prompt_caps', caps)
  if (rpcFails) {
    const orig = db.rpc.bind(db)
    db.rpc = async (name, args) => (name === 'add_client_locations' ? { data: null, error: { message: 'simulated rpc failure' } } : orig(name, args))
  }
  return db
}

const input = (over = {}) => Object.assign({
  name: 'Harbor Example', brand_website: 'harbor.example', brand_aliases: ['Harbor'], known_competitors: [],
  plan: 'growth', default_market_id: 'RO', default_region_id: 'ALL', contact_email: 'owner@harbor.example',
  prompts: ['plain question one'],
}, over)
const ctx = (over = {}) => Object.assign({ actor: ADMIN_ID, source: 'onboard-client', meta: {}, now: () => new Date() }, over)
const writes = (db) => db.calls.filter((c) => c.rpc || (c.op && c.op !== 'select')).map((c) => (c.rpc ? `rpc:${c.rpc}` : `${c.table}:${c.op}`))
const rpcNames = (db) => db.calls.filter((c) => c.rpc).map((c) => c.rpc)
const nothingCreated = (db) => {
  assert.strictEqual(db.rows('clients').length, 0, 'no client row')
  assert.strictEqual(db.invites.length, 0, 'no invite')
  assert.strictEqual(rpcNames(db).length, 0, 'no rpc')
  assert.strictEqual(db.rows('prompts').length, 0, 'no prompt')
}

async function main() {
  console.log('locations created, prompts mapped per key')
  await check('two extra markets, a multi-key prompt and a string prompt: rows, ids and order', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, input({
      locations: [{ market_id: 'US', region_ids: ['NYC', 'LA'] }, { market_id: 'DE', region_ids: ['ALL'] }],
      prompts: ['plain', { text: ' multi ', location_keys: ['primary', 'US:NYC', 'DE:ALL'] }, { text: 'nyc only', location_keys: ['US:NYC', 'US:NYC'] }, '   '],
    }), ctx())
    assert.strictEqual(r.ok, true, r.message)
    assert.strictEqual(r.locationsCreated, 3)
    const locs = db.rows('client_locations')
    const idOf = (m, rg) => locs.find((l) => l.market_id === m && l.region_id === rg).id
    assert.deepStrictEqual(locs.filter((l) => l.is_primary).map((l) => [l.market_id, l.region_id]), [['RO', 'ALL']], 'the primary row comes from the clients defaults')
    const rows = db.rows('prompts').map((p) => [p.text, 'location_id' in p ? p.location_id : 'none', p.position])
    assert.deepStrictEqual(rows, [
      ['plain', 'none', 1],
      ['multi', 'none', 2],
      ['multi', idOf('US', 'NYC'), 3],
      ['multi', idOf('DE', 'ALL'), 4],
      ['nyc only', idOf('US', 'NYC'), 5],
    ])
    assert.strictEqual(r.promptsCreated, 5)
    const ev = db.rows('client_events')[0]
    assert.strictEqual(ev.meta.locations_created, 3)
    assert.deepStrictEqual(ev.meta.locations, [{ market_id: 'US', region_id: 'NYC' }, { market_id: 'US', region_id: 'LA' }, { market_id: 'DE', region_id: 'ALL' }])
    assert.ok(!('allow_over_cap' in ev.meta))
  })
  await check('order: client, invite, profile, add_client_locations (p_limit null), prompts, event', async () => {
    const db = makeDb()
    db.calls.length = 0
    const r = await P.provisionAdminWizardClient(db, input({ locations: [{ market_id: 'FR', region_ids: ['PAR'] }], prompts: [{ text: 'q', location_keys: ['FR:PAR'] }] }), ctx())
    assert.strictEqual(r.ok, true, r.message)
    const w = writes(db).filter((x) => x !== 'rpc:ensure_primary_client_location')
    assert.deepStrictEqual(w, ['clients:insert', 'user_profiles:insert', 'rpc:add_client_locations', 'prompts:insert', 'client_events:insert'])
    assert.strictEqual(db.invites.length, 1)
    const args = db.rpcArgs.find((a) => a.name === 'add_client_locations').args
    assert.strictEqual(args.p_limit, null); assert.strictEqual(args.p_created_by, ADMIN_ID)
    assert.deepStrictEqual(args.p_pairs, [{ market_id: 'FR', region_id: 'PAR' }])
  })
  await check('string prompts only and no extra location: no rpc at all, rows carry no location_id key', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, input({ prompts: ['a', { text: 'b' }, { text: 'c', location_keys: [] }] }), ctx())
    assert.strictEqual(r.ok, true)
    assert.deepStrictEqual(rpcNames(db), [])
    assert.ok(db.rows('prompts').every((p) => !('location_id' in p)))
    assert.strictEqual(db.rows('prompts').length, 3)
    assert.strictEqual(r.locationsCreated, 0)
    assert.ok(!('locations_created' in db.rows('client_events')[0].meta), 'meta unchanged without extra locations')
  })
  await check('the primary key written as MARKET:REGION maps to the primary', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, input({ prompts: [{ text: 'q', location_keys: ['RO:ALL', 'primary'] }] }), ctx())
    assert.strictEqual(r.ok, true)
    assert.strictEqual(db.rows('prompts').length, 1, 'one distinct key, one row')
    assert.ok(!('location_id' in db.rows('prompts')[0]))
  })

  console.log('deduplication before the clients insert (S7)')
  await check('extras equal to the primary or to each other are dropped, first-seen order kept', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, input({
      locations: [{ market_id: 'RO', region_ids: ['ALL'] }, { market_id: 'US', region_ids: ['NYC', 'LA'] }, { market_id: 'US', region_ids: ['LA', 'NYC'] }],
      prompts: [{ text: 'q', location_keys: ['US:LA'] }],
    }), ctx())
    assert.strictEqual(r.ok, true, r.message)
    const args = db.rpcArgs.find((a) => a.name === 'add_client_locations').args
    assert.deepStrictEqual(args.p_pairs, [{ market_id: 'US', region_id: 'NYC' }, { market_id: 'US', region_id: 'LA' }])
    assert.strictEqual(r.locationsCreated, 2)
  })
  await check('only duplicates of the primary: no rpc', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, input({ locations: [{ market_id: 'RO', region_ids: ['ALL'] }] }), ctx())
    assert.strictEqual(r.ok, true); assert.deepStrictEqual(rpcNames(db), [])
  })
  await check('a null primary market reads as WW / ALL', async () => {
    const plan = P.planLocations(input({ default_market_id: null, default_region_id: null }))
    assert.deepStrictEqual(plan.primary, { market_id: 'WW', region_id: 'ALL' })
  })

  console.log('refusals, all before the clients insert and the invite')
  const REFUSALS = [
    ['a primary not in the market list', { default_market_id: 'XX' }, 'invalid_location'],
    ['a primary region of another market', { default_market_id: 'RO', default_region_id: 'NYC' }, 'invalid_location'],
    ['an extra research region', { locations: [{ market_id: 'US', region_ids: ['AUS'] }] }, 'invalid_location'],
    ['ALL mixed with regions in one entry', { locations: [{ market_id: 'US', region_ids: ['ALL', 'NYC'] }] }, 'invalid_location'],
    ['an empty region_ids list', { locations: [{ market_id: 'US', region_ids: [] }] }, 'invalid_location'],
    ['locations not a list', { locations: { market_id: 'US' } }, 'invalid_location'],
    ['an unknown location key', { prompts: [{ text: 'q', location_keys: ['FR:PAR'] }] }, 'invalid_location'],
    ['location_keys not a list', { prompts: [{ text: 'q', location_keys: 'primary' }] }, 'invalid_location'],
    ['over the cap (growth 35)', { prompts: Array.from({ length: 36 }, (_, i) => `q${i}`) }, 'prompt_cap_exceeded'],
    ['over the cap through keys (3 questions in 12 locations is 36 rows)', {
      locations: [{ market_id: 'US', region_ids: ['NYC', 'LA', 'CHI', 'MIA', 'HOU', 'DAL', 'SFO', 'SEA', 'BOS', 'DC', 'ATL'] }],
      prompts: ['a', 'b', 'c'].map((t) => ({ text: t, location_keys: ['primary', 'US:NYC', 'US:LA', 'US:CHI', 'US:MIA', 'US:HOU', 'US:DAL', 'US:SFO', 'US:SEA', 'US:BOS', 'US:DC', 'US:ATL'] })),
    }, 'prompt_cap_exceeded'],
  ]
  for (const [label, over, code] of REFUSALS) {
    await check(`${label}: ${code}, nothing created`, async () => {
      const db = makeDb()
      const r = await P.provisionAdminWizardClient(db, input(over), ctx())
      assert.strictEqual(r.ok, false); assert.strictEqual(r.code, code); assert.strictEqual(r.stage, 'validate')
      nothingCreated(db)
    })
  }
  await check('pure refusals make no database call at all', async () => {
    const db = makeDb(); db.calls.length = 0
    await P.provisionAdminWizardClient(db, input({ default_market_id: 'XX' }), ctx({ authEmails: { set: new Set(), ids: new Set(), complete: true } }))
    assert.strictEqual(db.calls.length, 0)
  })

  console.log('cap source (S8) and the admin override (owner question 4)')
  await check('no row for the plan: the free row (5) applies', async () => {
    const db = makeDb({ caps: [{ plan: 'free', prompt_cap: 5 }] })
    const r = await P.provisionAdminWizardClient(db, input({ prompts: ['1', '2', '3', '4', '5', '6'] }), ctx())
    assert.strictEqual(r.code, 'prompt_cap_exceeded'); assert.match(r.message, /allows 5/)
  })
  await check('no row at all: the hard fallback of 5', async () => {
    const db = makeDb({ caps: [] })
    const ok = await P.provisionAdminWizardClient(db, input({ prompts: ['1', '2', '3', '4', '5'] }), ctx())
    assert.strictEqual(ok.ok, true, ok.message)
    const db2 = makeDb({ caps: [] })
    const no = await P.provisionAdminWizardClient(db2, input({ contact_email: 'two@harbor.example', prompts: ['1', '2', '3', '4', '5', '6'] }), ctx())
    assert.strictEqual(no.code, 'prompt_cap_exceeded')
    assert.strictEqual(P.HARD_PROMPT_CAP_FALLBACK, 5)
  })
  await check('a plan row with a null cap falls to the free row, not to 0', async () => {
    const db = makeDb({ caps: [{ plan: 'growth', prompt_cap: null }, { plan: 'free', prompt_cap: 7 }] })
    const r = await P.provisionAdminWizardClient(db, input({ prompts: ['1', '2', '3', '4', '5', '6', '7'] }), ctx())
    assert.strictEqual(r.ok, true, r.message)
  })
  await check('allow_over_cap true: created, and recorded in the onboarded event meta', async () => {
    const db = makeDb({ caps: [{ plan: 'free', prompt_cap: 5 }, { plan: 'growth', prompt_cap: 2 }] })
    const r = await P.provisionAdminWizardClient(db, input({ allow_over_cap: true, prompts: ['1', '2', '3'] }), ctx())
    assert.strictEqual(r.ok, true, r.message)
    const meta = db.rows('client_events')[0].meta
    assert.strictEqual(meta.allow_over_cap, true); assert.strictEqual(meta.prompt_cap, 2); assert.strictEqual(meta.prompts_requested, 3)
  })
  await check('allow_over_cap must be exactly true: "true" is refused', async () => {
    const db = makeDb({ caps: [{ plan: 'growth', prompt_cap: 2 }] })
    const r = await P.provisionAdminWizardClient(db, input({ allow_over_cap: 'true', prompts: ['1', '2', '3'] }), ctx())
    assert.strictEqual(r.code, 'prompt_cap_exceeded')
  })
  await check('within the cap no override is recorded even when allow_over_cap is sent', async () => {
    const db = makeDb()
    const r = await P.provisionAdminWizardClient(db, input({ allow_over_cap: true }), ctx())
    assert.strictEqual(r.ok, true); assert.ok(!('allow_over_cap' in db.rows('client_events')[0].meta))
  })
  await check('a failed cap read refuses before the clients insert', async () => {
    const db = makeDb()
    const orig = db.from
    db.from = (t) => {
      if (t !== 'plan_prompt_caps') return orig(t)
      const b = { select() { return b }, in() { return b }, then(res, rej) { return Promise.resolve({ data: null, error: { message: 'simulated' } }).then(res, rej) } }
      return b
    }
    const r = await P.provisionAdminWizardClient(db, input(), ctx())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'validate'); assert.strictEqual(r.code, 'db_error')
    nothingCreated(db)
  })

  console.log('rollback')
  await check('add_client_locations fails: profile, user and client rolled back, no prompt', async () => {
    const db = makeDb({ rpcFails: true })
    const r = await P.provisionAdminWizardClient(db, input({ locations: [{ market_id: 'FR', region_ids: ['ALL'] }] }), ctx())
    assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'locations'); assert.strictEqual(r.inviteSent, true)
    assert.strictEqual(db.rows('clients').length, 0); assert.strictEqual(db.rows('user_profiles').length, 0)
    assert.strictEqual(db.deletedUsers.length, 1); assert.strictEqual(db.rows('prompts').length, 0)
  })

  console.log('the onboard-client endpoint')
  async function post(body, db) {
    currentDb = db
    const res = await wizard.handler({ httpMethod: 'POST', headers: { origin: 'https://app.getbrandgeo.com' }, body: JSON.stringify(body) })
    return { status: res.statusCode, body: JSON.parse(res.body) }
  }
  const wbody = (over = {}) => Object.assign({ slug: 'harbor-example' }, input(), over)
  await check('200 with locations_created and prompts_created', async () => {
    const r = await post(wbody({ locations: [{ market_id: 'US', region_ids: ['NYC'] }], prompts: [{ text: 'q', location_keys: ['primary', 'US:NYC'] }] }), makeDb())
    assert.strictEqual(r.status, 200, JSON.stringify(r.body))
    assert.strictEqual(r.body.locations_created, 1); assert.strictEqual(r.body.prompts_created, 2)
  })
  await check('400 { error, code: invalid_location }', async () => {
    const db = makeDb()
    const r = await post(wbody({ default_market_id: 'XX' }), db)
    assert.strictEqual(r.status, 400); assert.strictEqual(r.body.code, 'invalid_location'); assert.ok(typeof r.body.error === 'string')
    nothingCreated(db)
  })
  await check('400 { error, code: prompt_cap_exceeded }, then 200 with allow_over_cap', async () => {
    const many = Array.from({ length: 36 }, (_, i) => `q${i}`)
    const no = await post(wbody({ prompts: many }), makeDb())
    assert.strictEqual(no.status, 400); assert.strictEqual(no.body.code, 'prompt_cap_exceeded')
    const yes = await post(wbody({ prompts: many, allow_over_cap: true }), makeDb())
    assert.strictEqual(yes.status, 200, JSON.stringify(yes.body)); assert.strictEqual(yes.body.prompts_created, 36)
  })
  await check('a non-object body is 400', async () => {
    currentDb = makeDb()
    const res = await wizard.handler({ httpMethod: 'POST', headers: {}, body: 'null' })
    assert.strictEqual(res.statusCode, 400)
  })

  console.log(`\nprovision_locations: ${passes} passed, ${failures} failed`)
  process.exit(failures ? 1 : 0)
}

const log = console.log; const err = console.error
console.error = () => {}
console.log = (...a) => { if (String(a[0] || '').startsWith('[')) return; log(...a) }
main().catch((e) => { console.log = log; console.error = err; console.error('suite crashed:', e); process.exit(1) })
