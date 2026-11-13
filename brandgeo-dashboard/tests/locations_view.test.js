/**
 * locations_view.test.js - pins src/lib/locations.ts (labels, filter, error
 * copy, snapshot filter) and the plan location limits in planConfig.ts against
 * the server copy in netlify/functions/_locations.js.
 *
 * Run: `node tests/locations_view.test.js` from brandgeo-dashboard/.
 * Fixtures: fictional ids only.
 */
require('./helpers/ts_require')
const assert = require('assert')
const path = require('path')
const L = require(path.join(__dirname, '..', 'src', 'lib', 'locations.ts'))
const PC = require(path.join(__dirname, '..', 'src', 'lib', 'planConfig.ts'))
const SRV = require(path.join(__dirname, '..', 'netlify', 'functions', '_locations.js'))

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL: ' + name + '\n  ' + (e && e.message)) }
}

// locationLabel
check('label: known pair is market plus region', () => {
  assert.strictEqual(L.locationLabel({ market_id: 'US', region_id: 'NYC' }).includes(' · '), true)
})
check('label: ALL is the market label alone', () => {
  const l = L.locationLabel({ market_id: 'US', region_id: 'ALL' })
  assert.strictEqual(l.includes('·'), false)
  assert.ok(l.length > 0)
})
check('label: unknown region reads market and raw id in parentheses', () => {
  const l = L.locationLabel({ market_id: 'US', region_id: 'zz-raw' })
  assert.ok(l.endsWith('(zz-raw)'))
})
check('label: unknown market reads the raw id', () => {
  assert.strictEqual(L.locationLabel({ market_id: 'QQ', region_id: 'ALL' }), 'QQ')
})
check('label: never throws on junk', () => {
  assert.strictEqual(typeof L.locationLabel({}), 'string')
  assert.strictEqual(typeof L.locationLabel(null), 'string')
})

// promptLocationId / filterPromptsByLocation / locationFilterKey
check('promptLocationId: own id, else primary, else null', () => {
  assert.strictEqual(L.promptLocationId({ location_id: 7 }, 1), 7)
  assert.strictEqual(L.promptLocationId({ location_id: null }, 1), 1)
  assert.strictEqual(L.promptLocationId({}, null), null)
})
check('filterPromptsByLocation: null and empty return the same reference', () => {
  const ps = [{ id: 1, location_id: 1 }, { id: 2, location_id: 2 }]
  assert.strictEqual(L.filterPromptsByLocation(ps, null, 1), ps)
  assert.strictEqual(L.filterPromptsByLocation(ps, new Set(), 1), ps)
})
check('filterPromptsByLocation: keeps selected, null location falls to primary', () => {
  const ps = [{ id: 1, location_id: 1 }, { id: 2, location_id: 2 }, { id: 3, location_id: null }]
  assert.deepStrictEqual(L.filterPromptsByLocation(ps, new Set([2]), 1).map(p => p.id), [2])
  assert.deepStrictEqual(L.filterPromptsByLocation(ps, new Set([1]), 1).map(p => p.id), [1, 3])
})
check('locationFilterKey: empty is blank, else sorted ids', () => {
  assert.strictEqual(L.locationFilterKey(null), '')
  assert.strictEqual(L.locationFilterKey(new Set()), '')
  assert.strictEqual(L.locationFilterKey(new Set([9, 3, 5])), '3,5,9')
})

// error copy
check('locationErrorMessage: every code has its own message', () => {
  const m = (c, s = 400) => L.locationErrorMessage(s, c, { limit: 3, isAdmin: false })
  const codes = ['invalid_request', 'invalid_location', 'location_limit_reached', 'location_exists',
    'location_in_use', 'location_is_primary', 'not_found', 'forbidden', 'server_error']
  const out = codes.map(c => m(c))
  for (const x of out) assert.ok(x && x.length > 0)
  assert.strictEqual(new Set(out.filter((_, i) => codes[i] !== 'server_error')).size, codes.length - 1)
})
check('locationErrorMessage: limit code names the limit', () => {
  assert.strictEqual(L.locationErrorMessage(409, 'location_limit_reached', { limit: 5, isAdmin: false }), 'Your plan allows 5 locations.')
})
check('locationErrorMessage: no code falls back by status', () => {
  const ctx = { isAdmin: false }
  assert.strictEqual(L.locationErrorMessage(401, undefined, ctx), 'Your session ended. Sign in again.')
  assert.strictEqual(L.locationErrorMessage(403, undefined, ctx), 'You do not have access to this account.')
  assert.strictEqual(L.locationErrorMessage(0, undefined, ctx), 'Could not save. Try again.')
  assert.strictEqual(L.locationErrorMessage(500, undefined, ctx), 'Could not save. Try again.')
})
check('locationErrorNeedsRefetch: stale-list codes only', () => {
  for (const c of ['location_limit_reached', 'location_exists', 'location_in_use', 'not_found', 'forbidden']) assert.strictEqual(L.locationErrorNeedsRefetch(c), true)
  for (const c of ['invalid_request', 'server_error', undefined]) assert.strictEqual(L.locationErrorNeedsRefetch(c), false)
})

// copy helpers
check('promptCountLabel and locationScopeLine', () => {
  assert.strictEqual(L.promptCountLabel(1), '1 prompt')
  assert.strictEqual(L.promptCountLabel(0), '0 prompts')
  assert.strictEqual(L.promptCountLabel(4), '4 prompts')
  assert.strictEqual(L.locationScopeLine(3, 2), 'Showing 2 of 3 locations.')
  assert.strictEqual(L.locationScopeLine(3, 0), 'Combined across 3 locations, weighted by prompt count.')
  assert.strictEqual(L.locationScopeLine(3, 3), 'Combined across 3 locations, weighted by prompt count.')
})

// applyLocationFilter on a two-location fixture
function fixture() {
  const prompts = [
    { id: 10, location_id: 1, is_active: true },
    { id: 11, location_id: 1, is_active: false },
    { id: 20, location_id: 2, is_active: true },
    { id: 30, location_id: null, is_active: true },
  ]
  const rows = [
    { prompt_id: 10 }, { prompt_id: 11 }, { prompt_id: 20 }, { prompt_id: 20 }, { prompt_id: 30 }, { prompt_id: 999 },
  ]
  const activePrompts = prompts.filter(p => p.is_active)
  return { rows, prompts, activePrompts, extra: 'kept' }
}
check('applyLocationFilter: unfiltered keeps the same references', () => {
  const snap = fixture()
  for (const sel of [null, new Set()]) {
    const out = L.applyLocationFilter(snap, sel, 1)
    assert.strictEqual(out.rows, snap.rows)
    assert.strictEqual(out.activePrompts, snap.activePrompts)
    assert.strictEqual(out.allRows, snap.rows)
    assert.strictEqual(out.allActivePrompts, snap.activePrompts)
    assert.strictEqual(out.locationPromptIds, null)
    assert.strictEqual(out.filterKey, '')
    assert.strictEqual(out.extra, 'kept')
  }
})
check('applyLocationFilter: filtered to the primary keeps its prompts and orphan-null prompts', () => {
  const snap = fixture()
  const out = L.applyLocationFilter(snap, new Set([1]), 1)
  assert.deepStrictEqual(out.rows.map(r => r.prompt_id), [10, 11, 30])
  assert.deepStrictEqual(out.activePrompts.map(p => p.id), [10, 30])
  assert.deepStrictEqual([...out.locationPromptIds].sort((a, b) => a - b), [10, 11, 30])
  assert.strictEqual(out.filterKey, '1')
})
check('applyLocationFilter: filtered to location 2 drops the others and the orphan row', () => {
  const snap = fixture()
  const out = L.applyLocationFilter(snap, new Set([2]), 1)
  assert.deepStrictEqual(out.rows.map(r => r.prompt_id), [20, 20])
  assert.deepStrictEqual(out.activePrompts.map(p => p.id), [20])
  assert.strictEqual(out.rows.some(r => r.prompt_id === 999), false)
})
check('applyLocationFilter: the all fields still hold everything and prompts pass through', () => {
  const snap = fixture()
  const out = L.applyLocationFilter(snap, new Set([2]), 1)
  assert.strictEqual(out.allRows.length, 6)
  assert.strictEqual(out.allActivePrompts.length, 3)
  assert.strictEqual(out.prompts, snap.prompts)
})
check('applyLocationFilter: two locations produce a sorted key', () => {
  const out = L.applyLocationFilter(fixture(), new Set([2, 1]), 1)
  assert.strictEqual(out.filterKey, '1,2')
  assert.strictEqual(out.rows.length, 5)
})
check('applyLocationFilter: does not mutate its input', () => {
  const snap = fixture()
  const before = JSON.stringify(snap)
  L.applyLocationFilter(snap, new Set([2]), 1)
  assert.strictEqual(JSON.stringify(snap), before)
})

// stored filter rules
check('normalise: fewer than two live locations gives empty', () => {
  assert.deepStrictEqual(L.normaliseLocationIds([1], [1]), [])
  assert.deepStrictEqual(L.normaliseLocationIds([1], []), [])
})
check('normalise: a selection covering every live location collapses to empty', () => {
  assert.deepStrictEqual(L.normaliseLocationIds([2, 1], [1, 2]), [])
  assert.deepStrictEqual(L.normaliseLocationIds([1, 2, 9], [1, 2]), [])
})
check('normalise: ids that are not live are dropped', () => {
  assert.deepStrictEqual(L.normaliseLocationIds([1, 9], [1, 2, 3]), [1])
})
check('normalise: duplicates collapse, first-seen order is kept', () => {
  assert.deepStrictEqual(L.normaliseLocationIds([3, 1, 3, 1], [1, 2, 3, 4]), [3, 1])
})
check('storage key carries the user id and the client id', () => {
  const k = L.locationFilterStorageKey('user-abc', 42)
  assert.ok(k.includes('user-abc') && k.includes('42'))
  assert.notStrictEqual(k, L.locationFilterStorageKey('user-abc', 43))
  assert.notStrictEqual(k, L.locationFilterStorageKey('user-xyz', 42))
})
check('storage key: no user id means no key', () => {
  assert.strictEqual(L.locationFilterStorageKey(null, 42), null)
  assert.strictEqual(L.locationFilterStorageKey(undefined, 42), null)
  assert.strictEqual(L.locationFilterStorageKey('', 42), null)
})

// plan limits match the server copy
check('PLAN_LOCATION_LIMIT equals the server table, plan by plan', () => {
  assert.deepStrictEqual({ ...PC.PLAN_LOCATION_LIMIT }, { ...SRV.PLAN_LOCATION_LIMIT })
})
check('locationLimitFor matches the server function, including unknown plans', () => {
  for (const p of [...Object.keys(SRV.PLAN_LOCATION_LIMIT), 'nope', '', null, undefined, 'toString']) {
    assert.strictEqual(PC.locationLimitFor(p), SRV.locationLimitFor(p), String(p))
  }
  assert.strictEqual(PC.locationLimitFor('nope'), 1)
})

console.log(`locations_view: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
