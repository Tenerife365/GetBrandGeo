/**
 * markets_data.test.js - pins src/lib/markets.ts (the market selector data) and
 * its server mirror COUNTRY_NAMES in netlify/functions/_enqueue.js.
 *
 * Ids are stored in clients.default_market_id, clients.default_region_id and
 * localStorage, so nothing that existed before the 2026-11-11 expansion may be
 * renamed, removed or reordered. New markets and regions may only be appended.
 *
 * Run: `node tests/markets_data.test.js` from brandgeo-dashboard/.
 */
require('./helpers/ts_require')
const assert = require('assert')
const path = require('path')
const { MARKETS } = require(path.join(__dirname, '..', 'src', 'lib', 'markets.ts'))
const { COUNTRY_NAMES } = require(path.join(__dirname, '..', 'netlify', 'functions', '_enqueue'))

// En dash and em dash, built from code points so no escape can be lost in transit.
const DASH_RE = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']')

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL: ' + name + '\n  ' + (e && e.message)) }
}

// Frozen snapshot of the 26 markets (and their region ids) that existed before
// the expansion. Order of markets matters; each old region list must remain a
// prefix of the current one.
const SNAPSHOT = [
  ['WW', 'ALL EU NA LATAM APAC MEA OCE'],
  ['RO', 'ALL B SB CJ CT IS'],
  ['DE', 'ALL BE MU HH FRA'],
  ['GB', 'ALL LDN MAN EDI'],
  ['IE', 'ALL DUB CRK'],
  ['FR', 'ALL PAR LYO MRS'],
  ['ES', 'ALL MAD BCN VAL SVQ AGP BIO ZAZ TF LPA IBZ PMI'],
  ['NL', 'ALL AMS RTM'],
  ['IT', 'ALL MIL ROM'],
  ['PL', 'ALL WAW KRK'],
  ['PT', 'ALL LIS OPO'],
  ['BE', 'ALL BRU ANT'],
  ['CH', 'ALL ZRH GVA'],
  ['AT', 'ALL VIE'],
  ['SE', 'ALL STO'],
  ['DK', 'ALL CPH'],
  ['US', 'ALL NYC LA CHI MIA HOU DAL'],
  ['CA', 'ALL TOR VAN MTL'],
  ['BR', 'ALL SAO RIO'],
  ['MX', 'ALL MEX GDL'],
  ['AU', 'ALL SYD MEL BNE'],
  ['SG', 'ALL'],
  ['IN', 'ALL BOM BLR DEL'],
  ['JP', 'ALL TYO OSA'],
  ['AE', 'ALL DXB AUH'],
  ['SA', 'ALL RIY JED'],
].map(([id, regions]) => ({ id, regions: regions.split(' ') }))
// Labels of the same 26 markets and their old regions, read from git HEAD on
// 2026-11-11. Labels reach the engines (system context, city, location) and
// the customer, so a rename is as breaking as a changed id.
const OLD_LABELS = [
  ["WW", "Worldwide", "un", [["ALL", "All regions"], ["EU", "Europe"], ["NA", "North America"], ["LATAM", "Latin America"], ["APAC", "Asia Pacific"], ["MEA", "Middle East & Africa"], ["OCE", "Oceania"]]],
  ["RO", "Romania", "ro", [["ALL", "All regions"], ["B", "Bucharest"], ["SB", "Sibiu"], ["CJ", "Cluj-Napoca"], ["CT", "Constanta"], ["IS", "Iasi"]]],
  ["DE", "Germany", "de", [["ALL", "All regions"], ["BE", "Berlin"], ["MU", "Munich"], ["HH", "Hamburg"], ["FRA", "Frankfurt"]]],
  ["GB", "UK", "gb", [["ALL", "All regions"], ["LDN", "London"], ["MAN", "Manchester"], ["EDI", "Edinburgh"]]],
  ["IE", "Ireland", "ie", [["ALL", "All regions"], ["DUB", "Dublin"], ["CRK", "Cork"]]],
  ["FR", "France", "fr", [["ALL", "All regions"], ["PAR", "Paris"], ["LYO", "Lyon"], ["MRS", "Marseille"]]],
  ["ES", "Spain", "es", [["ALL", "All regions"], ["MAD", "Madrid"], ["BCN", "Barcelona"], ["VAL", "Valencia"], ["SVQ", "Seville"], ["AGP", "M\u00e1laga"], ["BIO", "Bilbao"], ["ZAZ", "Zaragoza"], ["TF", "Tenerife"], ["LPA", "Las Palmas"], ["IBZ", "Ibiza"], ["PMI", "Palma de Mallorca"]]],
  ["NL", "Netherlands", "nl", [["ALL", "All regions"], ["AMS", "Amsterdam"], ["RTM", "Rotterdam"]]],
  ["IT", "Italy", "it", [["ALL", "All regions"], ["MIL", "Milan"], ["ROM", "Rome"]]],
  ["PL", "Poland", "pl", [["ALL", "All regions"], ["WAW", "Warsaw"], ["KRK", "Krakow"]]],
  ["PT", "Portugal", "pt", [["ALL", "All regions"], ["LIS", "Lisbon"], ["OPO", "Porto"]]],
  ["BE", "Belgium", "be", [["ALL", "All regions"], ["BRU", "Brussels"], ["ANT", "Antwerp"]]],
  ["CH", "Switzerland", "ch", [["ALL", "All regions"], ["ZRH", "Zurich"], ["GVA", "Geneva"]]],
  ["AT", "Austria", "at", [["ALL", "All regions"], ["VIE", "Vienna"]]],
  ["SE", "Sweden", "se", [["ALL", "All regions"], ["STO", "Stockholm"]]],
  ["DK", "Denmark", "dk", [["ALL", "All regions"], ["CPH", "Copenhagen"]]],
  ["US", "USA", "us", [["ALL", "All states"], ["NYC", "New York"], ["LA", "Los Angeles"], ["CHI", "Chicago"], ["MIA", "Miami"], ["HOU", "Houston"], ["DAL", "Dallas"]]],
  ["CA", "Canada", "ca", [["ALL", "All provinces"], ["TOR", "Toronto"], ["VAN", "Vancouver"], ["MTL", "Montreal"]]],
  ["BR", "Brazil", "br", [["ALL", "All regions"], ["SAO", "S\u00e3o Paulo"], ["RIO", "Rio de Janeiro"]]],
  ["MX", "Mexico", "mx", [["ALL", "All regions"], ["MEX", "Mexico City"], ["GDL", "Guadalajara"]]],
  ["AU", "Australia", "au", [["ALL", "All regions"], ["SYD", "Sydney"], ["MEL", "Melbourne"], ["BNE", "Brisbane"]]],
  ["SG", "Singapore", "sg", [["ALL", "Singapore"]]],
  ["IN", "India", "in", [["ALL", "All regions"], ["BOM", "Mumbai"], ["BLR", "Bangalore"], ["DEL", "Delhi"]]],
  ["JP", "Japan", "jp", [["ALL", "All regions"], ["TYO", "Tokyo"], ["OSA", "Osaka"]]],
  ["AE", "UAE", "ae", [["ALL", "All emirates"], ["DXB", "Dubai"], ["AUH", "Abu Dhabi"]]],
  ["SA", "Saudi Arabia", "sa", [["ALL", "All regions"], ["RIY", "Riyadh"], ["JED", "Jeddah"]]],
]

const OLD_IDS = new Set(SNAPSHOT.map(s => s.id))
// Pre-existing market whose ALL label is not "All ...": legacy, kept as is.
const LEGACY_ALL_LABEL = new Set(['SG'])

const byId = new Map(MARKETS.map(m => [m.id, m]))

check('first two markets are WW then RO', () => {
  assert.strictEqual(MARKETS[0].id, 'WW')
  assert.strictEqual(MARKETS[1].id, 'RO')
})

check('market ids are unique', () => {
  assert.strictEqual(byId.size, MARKETS.length)
})

check('ids are ISO-shaped and flagCode matches (WW is un)', () => {
  for (const m of MARKETS) {
    if (m.id === 'WW') { assert.strictEqual(m.flagCode, 'un'); continue }
    assert.ok(/^[A-Z]{2}$/.test(m.id), 'bad id ' + m.id)
    assert.strictEqual(m.flagCode, m.id.toLowerCase(), 'flagCode for ' + m.id)
  }
})

check('every market has regions, ALL first, unique well-formed region ids', () => {
  for (const m of MARKETS) {
    assert.ok(Array.isArray(m.regions) && m.regions.length >= 1, m.id + ' has no regions')
    assert.strictEqual(m.regions[0].id, 'ALL', m.id + ' first region')
    const seen = new Set()
    for (const r of m.regions) {
      // Legacy exception: RO's pre-existing region 'B' (Bucharest) is one letter
      // and is stored in clients.default_region_id, so it cannot be renamed.
      const legacyOneLetter = m.id === 'RO' && r.id === 'B'
      assert.ok(legacyOneLetter || /^[A-Z]{2,5}$/.test(r.id), m.id + ' bad region id ' + r.id)
      assert.ok(!seen.has(r.id), m.id + ' duplicate region ' + r.id)
      seen.add(r.id)
    }
  }
})

check('new markets: ALL label starts with "All " (server reads it as whole country)', () => {
  for (const m of MARKETS) {
    if (OLD_IDS.has(m.id)) continue
    assert.ok(m.regions[0].label.startsWith('All '), m.id + ' ALL label is "' + m.regions[0].label + '"')
  }
  for (const id of LEGACY_ALL_LABEL) assert.ok(OLD_IDS.has(id), id + ' must be a pre-existing market')
})

check('labels non-empty and free of en and em dashes (labels, aliases, region labels)', () => {
  const DASH = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']')
  const bad = (s) => typeof s !== 'string' || !s.trim() || DASH.test(s)
  for (const m of MARKETS) {
    assert.ok(!bad(m.label), 'market label ' + m.id)
    for (const a of (m.aliases || [])) assert.ok(!bad(a), 'alias of ' + m.id + ': ' + a)
    for (const r of m.regions) assert.ok(!bad(r.label), 'region label ' + m.id + '/' + r.id)
  }
})

check('26 pre-existing markets survive, same order', () => {
  assert.strictEqual(SNAPSHOT.length, 26)
  const current = MARKETS.map(m => m.id)
  const oldOrder = current.filter(id => OLD_IDS.has(id))
  assert.deepStrictEqual(oldOrder, SNAPSHOT.map(s => s.id), 'old markets missing or reordered')
  // appended, not interleaved: the old ids occupy the first 26 slots
  assert.deepStrictEqual(current.slice(0, 26), SNAPSHOT.map(s => s.id), 'old markets must come first')
})

for (const s of SNAPSHOT) {
  check('old region ids of ' + s.id + ' are a prefix of the current list', () => {
    const cur = byId.get(s.id).regions.map(r => r.id)
    assert.deepStrictEqual(cur.slice(0, s.regions.length), s.regions)
  })
}

check('old market labels, flag codes and old region labels are unchanged', () => {
  assert.strictEqual(OLD_LABELS.length, 26)
  for (const [id, label, flagCode, regions] of OLD_LABELS) {
    const m = byId.get(id)
    assert.ok(m, 'missing market ' + id)
    assert.strictEqual(m.label, label, 'label of ' + id)
    assert.strictEqual(m.flagCode, flagCode, 'flagCode of ' + id)
    regions.forEach(([rid, rlabel], i) => {
      assert.strictEqual(m.regions[i].id, rid, 'region id ' + id + '/' + i)
      assert.strictEqual(m.regions[i].label, rlabel, 'region label ' + id + '/' + rid)
    })
  }
})

check('the markets the user asked for exist', () => {
  assert.strictEqual(byId.get('KR') && byId.get('KR').label, 'South Korea')
  assert.ok(byId.get('SG'))
  assert.ok(byId.get('AU'))
})

check('market list grew beyond the original 26', () => {
  assert.ok(MARKETS.length > 26)
})

check('COUNTRY_NAMES has a full name for every market id except WW', () => {
  assert.ok(COUNTRY_NAMES && typeof COUNTRY_NAMES === 'object')
  for (const m of MARKETS) {
    if (m.id === 'WW') continue
    const v = COUNTRY_NAMES[m.id]
    assert.ok(typeof v === 'string' && v.trim().length > 0, 'COUNTRY_NAMES missing ' + m.id)
  }
})

check('COUNTRY_NAMES has no ids outside markets.ts and no dashes', () => {
  for (const [k, v] of Object.entries(COUNTRY_NAMES)) {
    assert.ok(byId.has(k), 'COUNTRY_NAMES has unknown id ' + k)
    assert.ok(!DASH_RE.test(v), 'dash in ' + k)
  }
})

check('COUNTRY_NAMES uses full names, not short selector labels', () => {
  assert.strictEqual(COUNTRY_NAMES.US, 'United States')
  assert.strictEqual(COUNTRY_NAMES.GB, 'United Kingdom')
  assert.strictEqual(COUNTRY_NAMES.AE, 'United Arab Emirates')
  assert.strictEqual(COUNTRY_NAMES.KR, 'South Korea')
  assert.strictEqual(COUNTRY_NAMES.CZ, 'Czechia')
  assert.strictEqual(COUNTRY_NAMES.TR, 'Turkey')
})

console.log(`markets_data: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
