/**
 * combobox_filter.test.js - pins src/lib/comboboxFilter.ts, the search used by
 * the Combobox primitive (market and region selectors).
 *
 * Run: `node tests/combobox_filter.test.js` from brandgeo-dashboard/.
 * Fixtures: fictional labels only.
 */
require('./helpers/ts_require')
const assert = require('assert')
const path = require('path')
const { filterComboboxOptions, normalizeForSearch } = require(path.join(__dirname, '..', 'src', 'lib', 'comboboxFilter.ts'))
const { MARKETS } = require(path.join(__dirname, '..', 'src', 'lib', 'markets.ts'))

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL: ' + name + '\n  ' + (e && e.message)) }
}

const labels = (arr) => arr.map(o => o.label)

check('empty and whitespace query return the same options in the same order', () => {
  const opts = [{ label: 'Beta' }, { label: 'Alpha' }, { label: 'Gamma' }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, '')), ['Beta', 'Alpha', 'Gamma'])
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, '   ')), ['Beta', 'Alpha', 'Gamma'])
})

check('prefix matches come before word-start before substring', () => {
  const opts = [
    { label: 'Mountain' },        // substring "ount" ... query "tai" is substring
    { label: 'Big Tailor' },      // word start
    { label: 'Tailwind' },        // prefix
  ]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 'tai')), ['Tailwind', 'Big Tailor', 'Mountain'])
})

check('order inside a tier follows the incoming order', () => {
  const opts = [{ label: 'Sol' }, { label: 'Sun' }, { label: 'Sea' }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 's')), ['Sol', 'Sun', 'Sea'])
})

check('diacritics are ignored in the label', () => {
  const opts = [{ label: 'São Paulo' }, { label: 'Rio' }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 'sao')), ['São Paulo'])
})

check('diacritics are ignored in the query', () => {
  const opts = [{ label: 'Sao Paulo' }, { label: 'Rio' }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 'são')), ['Sao Paulo'])
})

check('keywords match: "united" finds USA via keyword "United States"', () => {
  const opts = [{ label: 'France' }, { label: 'USA', keywords: ['US', 'United States'] }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 'united')), ['USA'])
})

check('keyword substring match works (tier 3)', () => {
  const opts = [{ label: 'Nowhere', keywords: ['Republic of Examplia'] }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 'public')), ['Nowhere'])
})

check('no duplicates when label and keyword both match', () => {
  const opts = [{ label: 'Korea North', keywords: ['Korea', 'Korean'] }, { label: 'South Korea', keywords: ['Korea'] }]
  const out = filterComboboxOptions(opts, 'kor')
  assert.strictEqual(out.length, 2)
  assert.strictEqual(new Set(out).size, 2)
})

check('case and surrounding whitespace are ignored', () => {
  const opts = [{ label: 'Lisbon' }, { label: 'Madrid' }]
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, '  LIS  ')), ['Lisbon'])
  assert.deepStrictEqual(labels(filterComboboxOptions(opts, 'mAdR')), ['Madrid'])
})

check('a query with no match returns an empty array', () => {
  assert.deepStrictEqual(filterComboboxOptions([{ label: 'Alpha' }, { label: 'Beta' }], 'zzz'), [])
})

check('normalizeForSearch lowercases, trims, strips accents, collapses spaces', () => {
  assert.strictEqual(normalizeForSearch('  Málaga   Costa  '), 'malaga costa')
})

// End to end on the real market list, built like the selector builds options.
const marketOptions = MARKETS.map(m => ({ label: m.label, keywords: [m.id, ...(m.aliases ?? [])] }))

check('real markets: "s" puts every label starting with S first', () => {
  const out = filterComboboxOptions(marketOptions, 's')
  const startsWithS = marketOptions.filter(o => o.label.toLowerCase().startsWith('s')).map(o => o.label)
  assert.ok(startsWithS.length >= 6, 'expected several S markets, got ' + startsWithS.length)
  assert.deepStrictEqual(labels(out).slice(0, startsWithS.length), startsWithS)
  assert.ok(labels(out).includes('South Korea') && labels(out).includes('Singapore'))
})

check('real markets: "kor" returns South Korea', () => {
  assert.ok(labels(filterComboboxOptions(marketOptions, 'kor')).includes('South Korea'))
})

check('real markets: "united" finds UK, USA and UAE', () => {
  const out = labels(filterComboboxOptions(marketOptions, 'united'))
  for (const l of ['UK', 'USA', 'UAE']) assert.ok(out.includes(l), l + ' missing')
})

console.log(`combobox_filter: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
