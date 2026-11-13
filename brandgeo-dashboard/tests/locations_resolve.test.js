/**
 * locations_resolve.test.js - the pure helpers of netlify/functions/_locations.js
 * (docs/arch/multi-location-collection.md section 5.2).
 *
 * Run: `node tests/locations_resolve.test.js` from brandgeo-dashboard/.
 * Pure, no network, no database. Fixture rows carry no real client.
 */
const assert = require('assert')
const path = require('path')

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const L = require(path.join(FN, '_locations'))
const { COUNTRY_NAMES } = require(path.join(FN, '_country_names'))
const { MARKET_REGIONS } = require(path.join(FN, '_market_regions'))
const enqueueMod = require(path.join(FN, '_enqueue'))

let passed = 0
let failed = 0
async function check(name, fn) {
  try { await fn(); passed++; console.log('  ok   ' + name) } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)) }
}

const row = (id, market_id, region_id, extra = {}) => Object.assign({ id, client_id: 9, market_id, region_id, is_primary: false, position: 0, archived_at: null }, extra)

;(async () => {
  console.log('resolveLocation')
  await check('a country at ALL: country label, no region label', () => {
    assert.deepStrictEqual(L.resolveLocation(row(11, 'RO', 'ALL')), { location_id: 11, market_id: 'RO', region_id: 'ALL', market_label: 'Romania', region_label: null })
  })
  await check('a city: the region label from the market list', () => {
    assert.deepStrictEqual(L.resolveLocation(row(12, 'ES', 'TF')), { location_id: 12, market_id: 'ES', region_id: 'TF', market_label: 'Spain', region_label: 'Tenerife' })
  })
  await check('the full country name, not the short selector label', () => {
    assert.strictEqual(L.resolveLocation(row(13, 'US', 'NYC')).market_label, 'United States')
    assert.strictEqual(L.resolveLocation(row(13, 'US', 'NYC')).region_label, 'New York')
    assert.strictEqual(L.resolveLocation(row(14, 'GB', 'ALL')).market_label, 'United Kingdom')
  })
  await check('WW / ALL: Worldwide, no region label', () => {
    assert.deepStrictEqual(L.resolveLocation(row(15, 'WW', 'ALL')), { location_id: 15, market_id: 'WW', region_id: 'ALL', market_label: 'Worldwide', region_label: null })
  })
  await check('a WW continent: Worldwide plus the continent label', () => {
    const r = L.resolveLocation(row(16, 'WW', 'OCE'))
    assert.strictEqual(r.market_label, 'Worldwide'); assert.strictEqual(r.region_label, 'Oceania')
    assert.strictEqual(L.resolveLocation(row(17, 'WW', 'EU')).region_label, 'Europe')
  })
  await check('an unknown research region (US / AUS): country level, no throw, region id kept', () => {
    const warn = console.warn; let warned = 0; console.warn = () => { warned++ }
    try {
      const r = L.resolveLocation(row(18, 'US', 'AUS'))
      assert.strictEqual(r.region_label, null); assert.strictEqual(r.market_label, 'United States'); assert.strictEqual(r.region_id, 'AUS')
      assert.strictEqual(warned, 1, 'one warning')
    } finally { console.warn = warn }
  })
  await check('an unknown market id: null labels, no throw', () => {
    const warn = console.warn; console.warn = () => {}
    try {
      const r = L.resolveLocation(row(19, 'XX', 'ZZ'))
      assert.strictEqual(r.market_label, null); assert.strictEqual(r.region_label, null)
    } finally { console.warn = warn }
  })
  await check('an empty region id reads as ALL', () => {
    assert.strictEqual(L.resolveLocation(row(20, 'RO', '')).region_id, 'ALL')
  })

  console.log('validatePair')
  await check('known pairs pass', () => {
    assert.deepStrictEqual(L.validatePair('RO', 'B'), { ok: true, market_id: 'RO', region_id: 'B' })
    assert.strictEqual(L.validatePair('WW', 'ALL').ok, true)
    assert.strictEqual(L.validatePair('KR', 'PUS').ok, true)
  })
  await check('refusals: unknown market, region of another market, research region, wrong case, non-strings', () => {
    for (const [m, r] of [['XX', 'ALL'], ['RO', 'NYC'], ['US', 'AUS'], ['ro', 'ALL'], ['RO', 'all'], [null, 'ALL'], ['RO', null], [1, 'ALL'], ['RO', undefined]]) {
      assert.deepStrictEqual(L.validatePair(m, r), { ok: false, error: 'invalid_location' }, `${m}/${r}`)
    }
  })

  console.log('locationLimitFor and PLAN_LOCATION_LIMIT')
  await check('the section 10 defaults', () => {
    assert.deepStrictEqual({ ...L.PLAN_LOCATION_LIMIT }, { free: 1, radar: 3, essentials: 5, growth: 5, growth_pro: 8, managed: 25, pro: 25, enterprise: 100 })
    assert.strictEqual(L.locationLimitFor('growth_pro'), 8)
  })
  await check('an unknown, null or prototype plan is 1, never unlimited', () => {
    for (const p of ['platinum', null, undefined, '', 'toString', '__proto__', 42]) assert.strictEqual(L.locationLimitFor(p), 1, String(p))
  })
  await check('PLAN_LOCATION_LIMIT is frozen', () => { assert.ok(Object.isFrozen(L.PLAN_LOCATION_LIMIT)) })

  console.log('COUNTRY_NAMES coverage and the re-export')
  await check('every MARKET_REGIONS id except WW has a COUNTRY_NAMES entry', () => {
    for (const m of MARKET_REGIONS) {
      if (m.id === 'WW') continue
      assert.ok(typeof COUNTRY_NAMES[m.id] === 'string' && COUNTRY_NAMES[m.id].length > 0, 'missing ' + m.id)
    }
  })
  await check('_enqueue.js re-exports the same COUNTRY_NAMES object', () => {
    assert.strictEqual(enqueueMod.COUNTRY_NAMES, COUNTRY_NAMES)
  })

  console.log('geoForPrompt and fallbackGeo')
  const client = { default_market_id: 'DE' }
  const byId = new Map([[21, row(21, 'FR', 'PAR')]])
  await check('a resolvable prompt gets its location', () => {
    const g = L.geoForPrompt({ id: 1, location_id: 21 }, byId, client)
    assert.deepStrictEqual(g, { location_id: 21, market_id: 'FR', region_id: 'PAR', market_label: 'France', region_label: 'Paris' })
  })
  await check('a string location_id from the driver still resolves', () => {
    assert.strictEqual(L.geoForPrompt({ id: 1, location_id: '21' }, byId, client).location_id, 21)
  })
  await check('a null location_id or a missing row: the client default at country level (S1)', () => {
    const want = { location_id: null, market_id: 'DE', region_id: null, market_label: 'Germany', region_label: null }
    assert.deepStrictEqual(L.geoForPrompt({ id: 1, location_id: null }, byId, client), want)
    assert.deepStrictEqual(L.geoForPrompt({ id: 1, location_id: 99 }, byId, client), want)
  })
  await check('fallback with WW or no default: no label, as before 2026-11-13', () => {
    assert.strictEqual(L.fallbackGeo({ default_market_id: 'WW' }).market_label, null)
    assert.deepStrictEqual(L.fallbackGeo({}), { location_id: null, market_id: null, region_id: null, market_label: null, region_label: null })
  })

  console.log('loadLocationsByIds')
  await check('no ids: no read at all', async () => {
    let reads = 0
    const sb = { from() { reads++; throw new Error('no read expected') } }
    const r = await L.loadLocationsByIds(sb, 9, [null, undefined])
    assert.strictEqual(r.ok, true); assert.strictEqual(r.byId.size, 0); assert.strictEqual(reads, 0)
  })
  await check('one read filtered by client_id and the distinct ids', async () => {
    const calls = []
    const sb = { from(t) { const b = { select(c) { calls.push(['select', t, c]); return b }, eq(c, v) { calls.push(['eq', c, v]); return b }, in(c, v) { calls.push(['in', c, v]); return b }, then(res, rej) { return Promise.resolve({ data: [row(21, 'FR', 'PAR')], error: null }).then(res, rej) } }; return b } }
    const r = await L.loadLocationsByIds(sb, 9, [21, 21, '21', 0, -3])
    assert.strictEqual(r.byId.get(21).market_id, 'FR')
    assert.deepStrictEqual(calls, [['select', 'client_locations', L.LOCATION_COLUMNS], ['eq', 'client_id', 9], ['in', 'id', [21]]])
  })
  await check('a read error is reported, not swallowed', async () => {
    const sb = { from() { const b = { select() { return b }, eq() { return b }, in() { return b }, then(res, rej) { return Promise.resolve({ data: null, error: { message: 'boom' } }).then(res, rej) } }; return b } }
    const r = await L.loadLocationsByIds(sb, 9, [21])
    assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'boom')
    const one = await L.loadLocationRow(sb, 9, 21)
    assert.strictEqual(one.ok, false)
  })

  console.log(`\nlocations_resolve: ${passed} passed, ${failed} failed`)
  process.exit(failed ? 1 : 0)
})().catch((e) => { console.error('suite crashed:', e); process.exit(1) })
