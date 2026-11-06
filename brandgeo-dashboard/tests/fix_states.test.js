/**
 * fix_states.test.js - guards the pure logic behind the Fix This done and
 * re-check states in src/lib/fixStates.ts (design docs/arch/fix-states.md).
 * Run: `node tests/fix_states.test.js` from brandgeo-dashboard/
 * (exits non-zero on failure).
 *
 * Same TS loading approach as prompt_performance.test.js: transpile each
 * src/lib/*.ts in process and resolve './x' siblings to src/lib/x.ts.
 * Fixtures use fictional names only.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const Module = require('module')

const LIB = path.join(__dirname, '..', 'src', 'lib')
const cache = new Map()

function load(file) {
  if (cache.has(file)) return cache.get(file).exports
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const mod = new Module(file)
  mod.filename = file
  cache.set(file, mod)
  const localRequire = spec => {
    if (spec.startsWith('./') || spec.startsWith('../')) {
      return load(path.join(path.dirname(file), spec) + '.ts')
    }
    return require(spec)
  }
  mod.require = localRequire
  const wrapped = new Function('exports', 'require', 'module', '__filename', '__dirname', js)
  wrapped.call(mod.exports, mod.exports, localRequire, mod, file, path.dirname(file))
  return mod.exports
}

const F = load(path.join(LIB, 'fixStates.ts'))

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log('  ok   ' + name)
  } catch (e) {
    failed++
    console.log('  FAIL ' + name + '\n       ' + (e && e.message ? e.message.split('\n').join('\n       ') : e))
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const DAY = 86_400_000
const MARKED = '2026-11-01T10:00:00.000Z'
const markedMs = Date.parse(MARKED)
const before = new Date(markedMs - 2 * DAY).toISOString()
const after8 = new Date(markedMs + 8 * DAY).toISOString()
const NOW = markedMs + 9 * DAY

function cell(mentioned, checked_at, extra) {
  return Object.assign({ brand_mentioned: mentioned, brand_position: mentioned ? 2 : null, sentiment: 'neutral', checked_at, competitors_mentioned: null }, extra || {})
}
/** rows: [[promptId, engine, cell]] -> Map<prompt, Map<engine, cell>> */
function map(rows) {
  const m = new Map()
  rows.forEach(([p, e, c]) => {
    if (!m.has(p)) m.set(p, new Map())
    m.get(p).set(e, c)
  })
  return m
}
const PROMPTS = [1, 2, 3, 4, 5]
const ENGINES = ['alpha', 'beta']
const FIX_ID_RE = /^[a-z_]{1,40}(:.{1,150})?$/
const doneRow = (metric_key, baseline_value) => ({ status: 'done', metric_key, baseline_value, marked_at: MARKED })

// ── Ids and keys ──────────────────────────────────────────────────────────────

test('every fix id matches the database CHECK', () => {
  const ids = [
    F.fixIds.visibilityAll(), F.fixIds.engineMissing('claude'), F.fixIds.engineLow('gemini'),
    F.fixIds.outranked('Fictional Rival Co'), F.fixIds.consistency(), F.fixIds.ranking(),
    F.fixIds.promptGap(42), F.fixIds.outranked('x'.repeat(400)),
  ]
  ids.forEach(id => assert.ok(FIX_ID_RE.test(id), id))
})

test('outranked id ignores case and accents, so the same rival keeps one id', () => {
  assert.strictEqual(F.fixIds.outranked('Müller Catering'), F.fixIds.outranked('muller catering'))
})

test('engine_missing and engine_low are different ids for the same engine', () => {
  assert.notStrictEqual(F.fixIds.engineMissing('claude'), F.fixIds.engineLow('claude'))
})

test('metric keys round trip through parseMetricKey', () => {
  assert.deepStrictEqual(F.parseMetricKey(F.metricKeys.all()), { kind: 'all' })
  assert.deepStrictEqual(F.parseMetricKey(F.metricKeys.engine('claude')), { kind: 'engine', engine: 'claude' })
  assert.deepStrictEqual(F.parseMetricKey(F.metricKeys.prompt(7)), { kind: 'prompt', promptId: 7 })
  assert.deepStrictEqual(F.parseMetricKey(F.metricKeys.consistency()), { kind: 'dimension', dim: 'consistency' })
  assert.deepStrictEqual(F.parseMetricKey(F.metricKeys.knowledge()), { kind: 'dimension', dim: 'knowledge' })
  assert.strictEqual(F.parseMetricKey(F.metricKeys.competitor('Rival')).kind, 'competitor')
})

test('unknown or malformed metric keys parse to null (treated as manual)', () => {
  ;[null, '', 'rate:engine:', 'rate:prompt:abc', 'rate:prompt:-3', 'nonsense'].forEach(k =>
    assert.strictEqual(F.parseMetricKey(k), null, String(k)))
})

// ── Measurement ───────────────────────────────────────────────────────────────

const base = map([
  [1, 'alpha', cell(true, before)], [1, 'beta', cell(false, before)],
  [2, 'alpha', cell(false, before)], [2, 'beta', cell(false, before)],
])

test('rate:all is the mention rate over every cell', () => {
  assert.deepStrictEqual(F.measureFix({ kind: 'all' }, base, PROMPTS, ENGINES), { value: 25, n: 4 })
})

test('rate:engine counts only that engine', () => {
  assert.deepStrictEqual(F.measureFix({ kind: 'engine', engine: 'alpha' }, base, PROMPTS, ENGINES), { value: 50, n: 2 })
  assert.deepStrictEqual(F.measureFix({ kind: 'engine', engine: 'beta' }, base, PROMPTS, ENGINES), { value: 0, n: 2 })
})

test('rate:prompt counts only that prompt', () => {
  assert.deepStrictEqual(F.measureFix({ kind: 'prompt', promptId: 2 }, base, PROMPTS, ENGINES), { value: 0, n: 2 })
})

test('no cells in scope measures as null, never as 0', () => {
  assert.deepStrictEqual(F.measureFix({ kind: 'prompt', promptId: 5 }, base, PROMPTS, ENGINES), { value: null, n: 0 })
})

test('competitor metric is the brand share of answers naming the brand or the rival', () => {
  const named = JSON.stringify([{ pos: 1, name: 'Rival Co' }])
  const m = map([
    [1, 'alpha', cell(true, before, { competitors_mentioned: named })],
    [1, 'beta', cell(false, before, { competitors_mentioned: named })],
    [2, 'alpha', cell(true, before)],
    [2, 'beta', cell(false, before)],
  ])
  const key = F.parseMetricKey(F.metricKeys.competitor('Rival Co'))
  assert.deepStrictEqual(F.measureFix(key, m, PROMPTS, ENGINES), { value: 66.7, n: 3 })
})

test('review M2: rival gone and brand absent reads 0, never a borrowed overall rate', () => {
  const m = map([[1, 'alpha', cell(false, after8)], [2, 'alpha', cell(false, after8)]])
  const key = F.parseMetricKey(F.metricKeys.competitor('Rival Co'))
  assert.deepStrictEqual(F.measureFix(key, m, PROMPTS, ENGINES), { value: 0, n: 2 })
  const ev = F.evaluateFix(doneRow(F.metricKeys.competitor('Rival Co'), 0), m, PROMPTS, ENGINES, NOW)
  assert.strictEqual(ev.status, 'reopened')
})

test('review M2: rival gone and brand now named counts as a real win', () => {
  const m = map([[1, 'alpha', cell(true, after8)], [2, 'alpha', cell(false, after8)]])
  const key = F.parseMetricKey(F.metricKeys.competitor('Rival Co'))
  assert.deepStrictEqual(F.measureFix(key, m, PROMPTS, ENGINES), { value: 100, n: 1 })
})

test('review L1: one new mention in 201 answers is not rounded away', () => {
  const prompts = Array.from({ length: 201 }, (_, i) => i + 1)
  const rows = prompts.map(p => [p, 'alpha', cell(p === 1, after8)])
  const ev = F.evaluateFix(doneRow('rate:all', 0), map(rows), prompts, ['alpha'], NOW)
  assert.strictEqual(ev.status, 'verified')
  assert.ok(ev.value > 0 && ev.value < 1, String(ev.value))
})

test('review L3: a fix whose prompt or engine is no longer tracked is untracked, not waiting', () => {
  const m = map([[1, 'alpha', cell(true, after8)]])
  assert.strictEqual(F.evaluateFix(doneRow('rate:prompt:99', 0), m, PROMPTS, ENGINES, NOW).state, 'untracked')
  assert.strictEqual(F.evaluateFix(doneRow('rate:engine:gamma', 0), m, PROMPTS, ENGINES, NOW).state, 'untracked')
})

test('sinceIso keeps only answers at or after that moment', () => {
  const m = map([[1, 'alpha', cell(false, before)], [2, 'alpha', cell(true, after8)]])
  assert.deepStrictEqual(F.measureFix({ kind: 'all' }, m, PROMPTS, ENGINES, MARKED), { value: 100, n: 1 })
})

test('dimension metric uses the shared score on the same cells', () => {
  const v = F.measureFix({ kind: 'dimension', dim: 'knowledge' }, base, PROMPTS, ENGINES)
  assert.strictEqual(v.n, 4)
  assert.ok(v.value > 0 && v.value <= 100)
})

// ── Verdict ───────────────────────────────────────────────────────────────────


test('improvement threshold: +10 verifies, +9 does not, 0 to any mention verifies', () => {
  assert.strictEqual(F.isImprovement(20, 30), true)
  assert.strictEqual(F.isImprovement(20, 29), false)
  assert.strictEqual(F.isImprovement(0, 1), true)
  assert.strictEqual(F.isImprovement(0, 0), false)
  assert.strictEqual(F.isImprovement(50, 40), false)
})

test('not_applicable: not done, no metric, no baseline, no mark date', () => {
  const m = map([[1, 'alpha', cell(true, after8)]])
  assert.strictEqual(F.evaluateFix({ ...doneRow('rate:all', 0), status: 'verified' }, m, PROMPTS, ENGINES, NOW).state, 'not_applicable')
  assert.strictEqual(F.evaluateFix(doneRow(null, 0), m, PROMPTS, ENGINES, NOW).state, 'not_applicable')
  assert.strictEqual(F.evaluateFix(doneRow('rate:all', null), m, PROMPTS, ENGINES, NOW).state, 'not_applicable')
  assert.strictEqual(F.evaluateFix({ ...doneRow('rate:all', 0), marked_at: null }, m, PROMPTS, ENGINES, NOW).state, 'not_applicable')
})

test('waits for 7 days even when newer answers exist', () => {
  const m = map([[1, 'alpha', cell(true, new Date(markedMs + DAY).toISOString())]])
  const ev = F.evaluateFix(doneRow('rate:all', 0), m, PROMPTS, ENGINES, markedMs + 3 * DAY)
  assert.strictEqual(ev.state, 'waiting')
  assert.strictEqual(ev.readyAfter, new Date(markedMs + 7 * DAY).toISOString())
})

test('an answer from day 1 after marking does not count after the wait', () => {
  const m = map([[1, 'alpha', cell(true, new Date(markedMs + DAY).toISOString())]])
  assert.strictEqual(F.evaluateFix(doneRow('rate:all', 0), m, PROMPTS, ENGINES, NOW).state, 'waiting')
})

test('waits until 80 percent of the scope is fresh', () => {
  const m = map([
    [1, 'alpha', cell(true, after8)], [2, 'alpha', cell(true, after8)],
    [3, 'alpha', cell(true, after8)], [4, 'alpha', cell(false, before)], [5, 'alpha', cell(false, before)],
  ])
  const ev = F.evaluateFix(doneRow('rate:engine:alpha', 0), m, PROMPTS, ENGINES, NOW)
  assert.deepStrictEqual([ev.state, ev.fresh, ev.needed], ['waiting', 3, 4])
})

test('verified when the fresh number rose enough, measured over fresh cells only', () => {
  const m = map([
    [1, 'alpha', cell(true, after8)], [2, 'alpha', cell(false, after8)],
    [3, 'alpha', cell(true, after8)], [4, 'alpha', cell(false, after8)], [5, 'alpha', cell(false, before)],
  ])
  const ev = F.evaluateFix(doneRow('rate:engine:alpha', 0), m, PROMPTS, ENGINES, NOW)
  assert.deepStrictEqual(ev, { state: 'verdict', status: 'verified', value: 50, n: 4 })
})

test('reopened when the number did not move', () => {
  const m = map([[1, 'alpha', cell(false, after8)], [2, 'alpha', cell(false, after8)]])
  const ev = F.evaluateFix(doneRow('rate:engine:alpha', 0), m, PROMPTS, ENGINES, NOW)
  assert.deepStrictEqual(ev, { state: 'verdict', status: 'reopened', value: 0, n: 2 })
})

test('reopened when it rose by less than the threshold', () => {
  const m = map([
    [1, 'alpha', cell(true, after8)], [2, 'alpha', cell(false, after8)],
    [3, 'alpha', cell(false, after8)], [4, 'alpha', cell(false, after8)],
  ])
  const ev = F.evaluateFix(doneRow('rate:engine:alpha', 20), m, PROMPTS, ENGINES, NOW)
  assert.strictEqual(ev.status, 'reopened')
})

test('an engine fix is not held back by stale cells on another engine', () => {
  const m = map([[1, 'alpha', cell(true, after8)], [1, 'beta', cell(false, before)], [2, 'beta', cell(false, before)]])
  assert.strictEqual(F.evaluateFix(doneRow('rate:engine:alpha', 0), m, PROMPTS, ENGINES, NOW).status, 'verified')
})

test('a competitor fix needs the whole page fresh, not just answers naming the rival', () => {
  const named = JSON.stringify([{ pos: 1, name: 'Rival Co' }])
  const m = map([
    [1, 'alpha', cell(true, after8, { competitors_mentioned: named })],
    [2, 'alpha', cell(false, before)], [3, 'alpha', cell(false, before)],
  ])
  assert.strictEqual(F.evaluateFix(doneRow(F.metricKeys.competitor('Rival Co'), 0), m, PROMPTS, ENGINES, NOW).state, 'waiting')
})

test('verdictCutoff is marked_at plus VERDICT_WAIT_DAYS', () => {
  assert.strictEqual(F.VERDICT_WAIT_DAYS, 7)
  assert.strictEqual(F.verdictCutoff(MARKED), new Date(markedMs + 7 * DAY).toISOString())
})

test('isOpenState: no row, open and reopened are open; the rest are not', () => {
  assert.strictEqual(F.isOpenState(undefined), true)
  assert.strictEqual(F.isOpenState('open'), true)
  assert.strictEqual(F.isOpenState('reopened'), true)
  ;['done', 'verified', 'dismissed'].forEach(s => assert.strictEqual(F.isOpenState(s), false, s))
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
