/**
 * market_regions_mirror.test.js - netlify/functions/_market_regions.js is the
 * plain JavaScript mirror of MARKETS in src/lib/markets.ts (ids, labels and
 * region order only), and neither it nor _locations.js requires a .ts file
 * (docs/arch/multi-location-collection.md section 5.2, M1).
 *
 * Run: `node tests/market_regions_mirror.test.js` from brandgeo-dashboard/.
 * markets.ts is append only, so a market added there later fails this test
 * until the mirror gains it.
 */
require('./helpers/ts_require')
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const FN = path.join(__dirname, '..', 'netlify', 'functions')
const { MARKETS } = require(path.join(__dirname, '..', 'src', 'lib', 'markets.ts'))
const { MARKET_REGIONS } = require(path.join(FN, '_market_regions'))

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name) } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)) }
}

// Comments stripped so a commented-out require is not counted.
function code(file) {
  return fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

check('MARKET_REGIONS deeply equals MARKETS reduced to ids, labels and region order', () => {
  assert.deepStrictEqual(MARKET_REGIONS, MARKETS.map(m => ({ id: m.id, label: m.label, regions: m.regions.map(r => ({ id: r.id, label: r.label })) })))
})

check('the mirror carries the same counts as markets.ts (61 markets, 253 regions on 2026-11-11, append only)', () => {
  assert.strictEqual(MARKET_REGIONS.length, MARKETS.length)
  const regions = MARKET_REGIONS.reduce((n, m) => n + m.regions.length, 0)
  assert.strictEqual(regions, MARKETS.reduce((n, m) => n + m.regions.length, 0))
  assert.ok(MARKET_REGIONS.length >= 61 && regions >= 253, `${MARKET_REGIONS.length} markets, ${regions} regions`)
})

check('_market_regions.js is data only: no require at all', () => {
  assert.ok(!/require\(/.test(code(path.join(FN, '_market_regions.js'))))
})

check('_locations.js requires no .ts file, and only its two plain helpers', () => {
  const reqs = []
  const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g
  let m
  const src = code(path.join(FN, '_locations.js'))
  while ((m = re.exec(src)) !== null) reqs.push(m[1])
  assert.ok(reqs.every(r => !r.endsWith('.ts')), reqs.join(', '))
  assert.deepStrictEqual(reqs.sort(), ['./_country_names', './_market_regions'])
})

check('_country_names.js is data only: no require at all', () => {
  assert.ok(!/require\(/.test(code(path.join(FN, '_country_names.js'))))
})

console.log(`\nmarket_regions_mirror: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
