/**
 * prompt_performance.test.js - guards the pure logic behind the AI Visibility
 * prompt list in src/lib/promptPerformance.ts.
 * Run: `node tests/prompt_performance.test.js` from brandgeo-dashboard/
 * (exits non-zero on failure).
 *
 * TS loading approach: no test runner exists in this repo, so, like
 * no_answer_rows.test.js and competitor_aggregate.test.js, each src/lib/*.ts
 * module is transpiled in process with the `typescript` package
 * (ts.transpileModule, CommonJS, ES2022) and compiled with
 * `new Module()._compile`. This file adds one thing those tests do not need:
 * promptPerformance.ts imports sibling modules with relative specifiers
 * ('./planConfig'), so the loader resolves './x' to src/lib/x.ts, with a cache.
 * Nothing under src/ is changed to make this work.
 *
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

const P = load(path.join(LIB, 'promptPerformance.ts'))
const S = load(path.join(LIB, 'aiVisibilityScore.ts'))
const PC = load(path.join(LIB, 'planConfig.ts'))

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

const D = n => `2026-07-${String(n).padStart(2, '0')}T06:00:00Z`
let nextId = 1
function ok(prompt_id, llm, mentioned, position, day, extra) {
  return Object.assign({
    id: nextId++, prompt_id, llm, status: 'ok',
    brand_mentioned: mentioned, brand_position: position,
    response_snippet: null, checked_at: D(day), competitors_mentioned: null,
  }, extra || {})
}
function err(prompt_id, llm, day) {
  return {
    id: nextId++, prompt_id, llm, status: 'error', error_code: 'quota_exceeded',
    brand_mentioned: false, brand_position: null, response_snippet: null, checked_at: D(day),
  }
}
const comps = list => JSON.stringify(list.map((name, i) => ({ pos: i + 1, name })))

const ENGINES = ['chatgpt', 'gemini', 'claude']

function cellsFor(rows, promptId, engines) {
  return P.buildCellViews(rows, engines || ENGINES, [promptId]).get(promptId)
}

// ── buildCellViews: states ────────────────────────────────────────────────────

console.log('cell states')

test('mentioned, absent, no_answer, error and pending are told apart', () => {
  const rows = [
    ok(1, 'chatgpt', true, 2, 10),
    ok(1, 'gemini', false, null, 10),
    ok(1, 'claude', false, null, 10, { response_snippet: '[no_ai_overview] nothing rendered' }),
    err(2, 'chatgpt', 10),
  ]
  const views = P.buildCellViews(rows, ENGINES, [1, 2, 3])
  assert.strictEqual(views.get(1).get('chatgpt').state, 'mentioned')
  assert.strictEqual(views.get(1).get('chatgpt').position, 2)
  assert.strictEqual(views.get(1).get('gemini').state, 'absent')
  assert.strictEqual(views.get(1).get('claude').state, 'no_answer')
  assert.strictEqual(views.get(2).get('chatgpt').state, 'error')
  assert.strictEqual(views.get(2).get('gemini').state, 'pending')
  // A prompt with no rows at all still gets an all-pending entry.
  assert.strictEqual(views.get(3).get('chatgpt').state, 'pending')
  assert.strictEqual(views.get(3).get('chatgpt').current, null)
})

test('data never produces the locked state', () => {
  const rows = [ok(1, 'chatgpt', true, 1, 10), err(1, 'gemini', 10)]
  const c = cellsFor(rows, 1)
  c.forEach(v => assert.notStrictEqual(v.state, 'locked'))
})

test('engines outside the active list are ignored', () => {
  const rows = [ok(1, 'perplexity', true, 1, 10), ok(1, 'chatgpt', false, null, 10)]
  const c = cellsFor(rows, 1)
  assert.deepStrictEqual(Array.from(c.keys()), ENGINES)
  assert.strictEqual(c.get('chatgpt').state, 'absent')
})

test('the current cell is the newest row, whatever its status', () => {
  const rows = [ok(1, 'gemini', true, 1, 5), err(1, 'gemini', 12)]
  const g = cellsFor(rows, 1).get('gemini')
  assert.strictEqual(g.state, 'error')
  assert.strictEqual(g.current.checked_at, D(12))
})

test('input order does not matter', () => {
  const a = [ok(1, 'gemini', true, 1, 5), err(1, 'gemini', 12), err(1, 'gemini', 9)]
  const b = a.slice().reverse()
  const ga = cellsFor(a, 1).get('gemini')
  const gb = cellsFor(b, 1).get('gemini')
  assert.strictEqual(ga.errorSince, gb.errorSince)
  assert.strictEqual(ga.previousOk.checked_at, gb.previousOk.checked_at)
})

// ── errorSince: oldest error in the current unbroken run ──────────────────────

console.log('errorSince and previousOk')

test('errorSince is the oldest error of the unbroken run, not the last attempt', () => {
  // ok on 20 June style day 3, then errors on 8, 10 and 12.
  const rows = [ok(1, 'gemini', true, 3, 3), err(1, 'gemini', 8), err(1, 'gemini', 10), err(1, 'gemini', 12)]
  const g = cellsFor(rows, 1).get('gemini')
  assert.strictEqual(g.state, 'error')
  assert.strictEqual(g.errorSince, D(8))
  assert.notStrictEqual(g.errorSince, g.current.checked_at)
  assert.strictEqual(g.previousOk.checked_at, D(3))
  assert.strictEqual(g.previousOk.brand_mentioned, true)
})

test('a run broken by an ok row restarts: older errors before that ok row do not count', () => {
  const rows = [
    err(1, 'gemini', 2), err(1, 'gemini', 3),   // old outage
    ok(1, 'gemini', false, null, 5),           // recovered
    err(1, 'gemini', 9), err(1, 'gemini', 11), // current outage
  ]
  const g = cellsFor(rows, 1).get('gemini')
  assert.strictEqual(g.errorSince, D(9))
  assert.strictEqual(g.previousOk.checked_at, D(5))
})

test('a single error with no earlier row has errorSince = its own date and no previousOk', () => {
  const g = cellsFor([err(1, 'gemini', 7)], 1).get('gemini')
  assert.strictEqual(g.errorSince, D(7))
  assert.strictEqual(g.previousOk, null)
})

test('errors only, three in a row: since is the oldest of them', () => {
  const g = cellsFor([err(1, 'gemini', 4), err(1, 'gemini', 6), err(1, 'gemini', 8)], 1).get('gemini')
  assert.strictEqual(g.errorSince, D(4))
  assert.strictEqual(g.previousOk, null)
})

test('a non-error cell carries no errorSince', () => {
  const rows = [err(1, 'gemini', 2), ok(1, 'gemini', true, 1, 6)]
  const g = cellsFor(rows, 1).get('gemini')
  assert.strictEqual(g.state, 'mentioned')
  assert.strictEqual(g.errorSince, null)
  assert.strictEqual(g.previousOk, null)
})

test('a no-answer row inside the run ends it (it is an ok row, not an error)', () => {
  const rows = [
    err(1, 'gemini', 2),
    ok(1, 'gemini', false, null, 4, { response_snippet: '[no_ai_overview]' }),
    err(1, 'gemini', 8),
  ]
  const g = cellsFor(rows, 1).get('gemini')
  assert.strictEqual(g.errorSince, D(8))
  assert.strictEqual(g.previousOk.checked_at, D(4))
})

test('runs are tracked per engine, not across engines', () => {
  const rows = [err(1, 'gemini', 5), err(1, 'chatgpt', 9), ok(1, 'chatgpt', true, 1, 3)]
  const c = cellsFor(rows, 1)
  assert.strictEqual(c.get('gemini').errorSince, D(5))
  assert.strictEqual(c.get('chatgpt').errorSince, D(9))
})

test('engineErrorSince works across prompts and is null when the newest row is ok', () => {
  const rows = [
    ok(1, 'gemini', true, 1, 2),
    err(1, 'gemini', 6), err(2, 'gemini', 8),     // gemini broken since day 6
    ok(1, 'chatgpt', true, 1, 6), err(1, 'chatgpt', 3), // chatgpt healthy now
    ok(1, 'claude', false, null, 4),
  ]
  const out = P.engineErrorSince(rows)
  assert.strictEqual(out.gemini, D(6))
  assert.strictEqual(out.chatgpt, null)
  assert.strictEqual(out.claude, null)
})

// ── Score stays on the newest ok row during an outage ─────────────────────────

console.log('score during an outage')

test('the score map keeps the newest ok row while the cell view shows the error', () => {
  const rows = [
    ok(1, 'gemini', true, 2, 3),
    err(1, 'gemini', 8),
    err(1, 'gemini', 11),
    ok(1, 'chatgpt', false, null, 11),
  ]
  const score = S.buildScoreResultMap(rows, ENGINES)
  const scoreRow = score.get(1).get('gemini')
  assert.strictEqual(scoreRow.brand_mentioned, true, 'score input must stay on the last good row')
  assert.strictEqual(scoreRow.brand_position, 2)
  const cell = cellsFor(rows, 1).get('gemini')
  assert.strictEqual(cell.state, 'error', 'the list must show the outage')
  assert.strictEqual(cell.previousOk.brand_mentioned, true)
})

test('an engine that has only ever failed contributes nothing to the score map', () => {
  const rows = [err(1, 'gemini', 8), ok(1, 'chatgpt', false, null, 8)]
  const score = S.buildScoreResultMap(rows, ENGINES)
  assert.strictEqual(score.get(1).has('gemini'), false)
  assert.strictEqual(score.get(1).has('chatgpt'), true)
})

// ── summarisePrompt and section assignment ────────────────────────────────────

console.log('summaries and sections')

function summaryOf(rows, id) {
  return P.summarisePrompt(cellsFor(rows, id))
}

test('one mention puts a prompt in "appear"', () => {
  const s = summaryOf([ok(1, 'chatgpt', true, 3, 10), ok(1, 'gemini', false, null, 10), ok(1, 'claude', false, null, 10)], 1)
  assert.strictEqual(s.section, 'appear')
  assert.strictEqual(s.mentions, 1)
  assert.strictEqual(s.answered, 3)
  assert.strictEqual(s.bestPosition, 3)
})

test('answered but never mentioned is "notYet"', () => {
  const s = summaryOf([ok(1, 'chatgpt', false, null, 10), ok(1, 'gemini', false, null, 10)], 1)
  assert.strictEqual(s.section, 'notYet')
  assert.strictEqual(s.answered, 2)
  assert.strictEqual(s.bestPosition, null)
})

test('errors, no-answers and pending alone are "unchecked"', () => {
  assert.strictEqual(summaryOf([err(1, 'chatgpt', 10)], 1).section, 'unchecked')
  assert.strictEqual(summaryOf([ok(1, 'chatgpt', false, null, 10, { response_snippet: '[no_ai_overview]' })], 1).section, 'unchecked')
  assert.strictEqual(summaryOf([], 1).section, 'unchecked')
})

test('a mention on one engine and an error on another stays in "appear" and counts the error', () => {
  const s = summaryOf([ok(1, 'chatgpt', true, 1, 10), err(1, 'gemini', 4), err(1, 'gemini', 10)], 1)
  assert.strictEqual(s.section, 'appear')
  assert.strictEqual(s.errors, 1)
  assert.strictEqual(s.answered, 1)
  assert.strictEqual(s.oldestErrorSince, D(4))
  assert.strictEqual(s.pendings, 1) // claude never ran
})

test('a mention in a position-less answer counts as a mention but not as a best position', () => {
  const s = summaryOf([ok(1, 'chatgpt', true, null, 10), ok(1, 'gemini', true, 4, 10)], 1)
  assert.strictEqual(s.mentions, 2)
  assert.strictEqual(s.bestPosition, 4)
})

test('lastCheckedAt is the newest current cell, errors included', () => {
  const s = summaryOf([ok(1, 'chatgpt', true, 1, 6), err(1, 'gemini', 12)], 1)
  assert.strictEqual(s.lastCheckedAt, D(12))
})

test('an older error does not hide a newer ok mention', () => {
  const s = summaryOf([err(1, 'chatgpt', 2), ok(1, 'chatgpt', true, 1, 9)], 1)
  assert.strictEqual(s.errors, 0)
  assert.strictEqual(s.section, 'appear')
})

// ── sortPrompts ───────────────────────────────────────────────────────────────

console.log('sorting')

// Prompt layout (display position = id):
//  1: 1/3 mentioned, best pos 2        -> appear, rate .33
//  2: 3/3 mentioned, best pos 1        -> appear, rate 1
//  3: 2/3 mentioned, best pos 3        -> appear, rate .67
//  4: 2/3 mentioned, best pos 1        -> appear, rate .67 (beats 3 on position)
//  5: 0/3 answered                     -> notYet
//  6: 0/2 answered (claude errored)    -> notYet, fewer answered
//  7: error on all                     -> unchecked, error since day 9
//  8: error on all                     -> unchecked, error since day 4 (older)
//  9: no-answer only                   -> unchecked, rank 1
// 10: no rows                          -> unchecked, rank 2
function sortFixture() {
  const rows = []
  const add = (...r) => r.forEach(x => rows.push(x))
  add(ok(1, 'chatgpt', true, 2, 10), ok(1, 'gemini', false, null, 10), ok(1, 'claude', false, null, 10))
  add(ok(2, 'chatgpt', true, 1, 8), ok(2, 'gemini', true, 2, 8), ok(2, 'claude', true, 3, 8))
  add(ok(3, 'chatgpt', true, 3, 12), ok(3, 'gemini', true, 5, 12), ok(3, 'claude', false, null, 12))
  add(ok(4, 'chatgpt', true, 1, 11), ok(4, 'gemini', true, 4, 11), ok(4, 'claude', false, null, 11))
  add(ok(5, 'chatgpt', false, null, 3), ok(5, 'gemini', false, null, 3), ok(5, 'claude', false, null, 3))
  add(ok(6, 'chatgpt', false, null, 5), ok(6, 'gemini', false, null, 5), err(6, 'claude', 5))
  ENGINES.forEach(e => add(err(7, e, 9)))
  ENGINES.forEach(e => add(err(8, e, 4)))
  add(ok(9, 'chatgpt', false, null, 6, { response_snippet: '[no_ai_overview]' }))
  const prompts = []
  for (let i = 1; i <= 10; i++) prompts.push({ id: i, position: i })
  const views = P.buildCellViews(rows, ENGINES, prompts.map(p => p.id))
  const summaries = new Map()
  views.forEach((cells, id) => summaries.set(id, P.summarisePrompt(cells)))
  return { prompts, summaries, views, rows }
}

test('best: appear by rate desc, then best position asc, then answered desc, then page order', () => {
  const { prompts, summaries } = sortFixture()
  const out = P.sortPrompts(prompts, summaries, 'best')
  assert.deepStrictEqual(out.sections, ['appear', 'notYet', 'unchecked'])
  assert.deepStrictEqual(out.ids.appear, [2, 4, 3, 1])
})

test('best: notYet orders by answered desc (all rates are 0 and there is no position)', () => {
  const { prompts, summaries } = sortFixture()
  assert.deepStrictEqual(P.sortPrompts(prompts, summaries, 'best').ids.notYet, [5, 6])
})

test('needs_work reverses performance and puts notYet first', () => {
  const { prompts, summaries } = sortFixture()
  const out = P.sortPrompts(prompts, summaries, 'needs_work')
  assert.deepStrictEqual(out.sections, ['notYet', 'appear', 'unchecked'])
  assert.deepStrictEqual(out.ids.appear, [1, 4, 3, 2])
})

test('position: stored page order inside each section', () => {
  const { prompts, summaries } = sortFixture()
  const out = P.sortPrompts(prompts, summaries, 'position')
  assert.deepStrictEqual(out.ids.appear, [1, 2, 3, 4])
  assert.deepStrictEqual(out.ids.notYet, [5, 6])
})

test('recent: newest lastCheckedAt first, never-checked last, ties by page order', () => {
  const { prompts, summaries } = sortFixture()
  const out = P.sortPrompts(prompts, summaries, 'recent')
  // appear last-checked days: 1 -> 10, 2 -> 8, 3 -> 12, 4 -> 11
  assert.deepStrictEqual(out.ids.appear, [3, 4, 1, 2])
  // notYet: 5 -> day 3, 6 -> day 5
  assert.deepStrictEqual(out.ids.notYet, [6, 5])
})

test('unchecked reads the same in every mode: errors (oldest failure first), no answer, pending', () => {
  const { prompts, summaries } = sortFixture()
  SORT_MODES().forEach(mode => {
    assert.deepStrictEqual(P.sortPrompts(prompts, summaries, mode).ids.unchecked, [8, 7, 9, 10], mode)
  })
})

test('every prompt lands in exactly one section', () => {
  const { prompts, summaries } = sortFixture()
  SORT_MODES().forEach(mode => {
    const out = P.sortPrompts(prompts, summaries, mode)
    const all = [].concat(out.ids.appear, out.ids.notYet, out.ids.unchecked).sort((a, b) => a - b)
    assert.deepStrictEqual(all, prompts.map(p => p.id), mode)
  })
})

test('sorting is stable for fully tied prompts (page order decides)', () => {
  const rows = []
  for (const id of [1, 2, 3]) rows.push(ok(id, 'chatgpt', true, 2, 10), ok(id, 'gemini', false, null, 10))
  const prompts = [{ id: 3, position: 1 }, { id: 1, position: 2 }, { id: 2, position: 3 }]
  const views = P.buildCellViews(rows, ENGINES, [1, 2, 3])
  const summaries = new Map()
  views.forEach((cells, id) => summaries.set(id, P.summarisePrompt(cells)))
  assert.deepStrictEqual(P.sortPrompts(prompts, summaries, 'best').ids.appear, [3, 1, 2])
})

function SORT_MODES() { return P.SORT_MODES }

test('parseSortMode accepts the four modes and defaults on anything else', () => {
  assert.deepStrictEqual(P.SORT_MODES, ['best', 'needs_work', 'position', 'recent'])
  P.SORT_MODES.forEach(m => assert.strictEqual(P.parseSortMode(m), m))
  for (const bad of [null, undefined, '', 'BEST', 'worst', 7, {}, []]) {
    assert.strictEqual(P.parseSortMode(bad), 'best')
  }
  assert.strictEqual(P.DEFAULT_SORT_MODE, 'best')
})

test('sortStorageKey is per client and has a stable fallback', () => {
  assert.strictEqual(P.sortStorageKey(12), 'brandgeo_aiv_sort_12')
  assert.strictEqual(P.sortStorageKey(null), 'brandgeo_aiv_sort_none')
  assert.notStrictEqual(P.sortStorageKey(1), P.sortStorageKey(2))
})

// ── promptCompetitors ─────────────────────────────────────────────────────────

console.log('competitors')

test('promptCompetitors: engines naming it desc, then best rank asc, then name; max five', () => {
  const rows = [
    ok(1, 'chatgpt', false, null, 10, { competitors_mentioned: comps(['Lantern Table Co', 'Cedar Ash Events', 'Green Plate Kitchen']) }),
    ok(1, 'gemini', false, null, 10, { competitors_mentioned: comps(['Green Plate Kitchen', 'Lantern Table Co']) }),
    ok(1, 'claude', false, null, 10, { competitors_mentioned: comps(['Sprout Spoon Catering']) }),
  ]
  const out = P.promptCompetitors(cellsFor(rows, 1))
  const names = out.map(c => c.name)
  // Lantern: 2 engines, ranks 1 and 2 -> bestRank 1. Green Plate: 2 engines, ranks 3 and 1 -> bestRank 1.
  assert.deepStrictEqual(names.slice(0, 2), ['Green Plate Kitchen', 'Lantern Table Co'])
  assert.strictEqual(out[0].k, 2)
  assert.strictEqual(out[0].bestRank, 1)
  assert.ok(out.length <= 5)
  const single = out.filter(c => c.k === 1).map(c => c.name)
  // Single-engine names: Sprout is rank 1 on Claude, Cedar is rank 2 on ChatGPT.
  assert.deepStrictEqual(single, ['Sprout Spoon Catering', 'Cedar Ash Events'])
})

test('promptCompetitors ignores error, no-answer and pending cells', () => {
  const rows = [
    ok(1, 'chatgpt', false, null, 10, { competitors_mentioned: comps(['Lantern Table Co']) }),
    ok(1, 'gemini', false, null, 10, { response_snippet: '[no_ai_overview]', competitors_mentioned: comps(['Ghost Kitchen Hub']) }),
    err(1, 'claude', 10),
  ]
  const names = P.promptCompetitors(cellsFor(rows, 1)).map(c => c.name)
  assert.deepStrictEqual(names, ['Lantern Table Co'])
})

test('promptCompetitors caps at five', () => {
  const six = ['Alder Hall Events', 'Birch Lane Catering', 'Cobalt Fork Kitchen', 'Dune Plate Co', 'Elm Street Eats', 'Fern Table Studio']
  const rows = [ok(1, 'chatgpt', false, null, 10, { competitors_mentioned: comps(six) })]
  assert.strictEqual(P.promptCompetitors(cellsFor(rows, 1)).length, 5)
})

test('parseRankedCompetitors handles objects, plain strings, empty and broken input', () => {
  assert.deepStrictEqual(P.parseRankedCompetitors(null), [])
  assert.deepStrictEqual(P.parseRankedCompetitors(''), [])
  assert.deepStrictEqual(P.parseRankedCompetitors('not json'), [])
  assert.deepStrictEqual(P.parseRankedCompetitors('[]'), [])
  assert.deepStrictEqual(P.parseRankedCompetitors(JSON.stringify(['One Co', 'Two Co'])), [{ pos: 1, name: 'One Co' }, { pos: 2, name: 'Two Co' }])
  const sorted = P.parseRankedCompetitors(JSON.stringify([{ pos: 3, name: 'C' }, { pos: 1, name: 'A' }]))
  assert.deepStrictEqual(sorted.map(e => e.name), ['A', 'C'])
})

// ── buildHeadline ─────────────────────────────────────────────────────────────

console.log('headline')

function headlineFor(rows, ids, freq) {
  const views = P.buildCellViews(rows, ENGINES, ids)
  const summaries = new Map()
  views.forEach((cells, id) => summaries.set(id, P.summarisePrompt(cells)))
  return P.buildHeadline(summaries, views, freq || [])
}

test('variant is recommended when at least one prompt appears, with a of n', () => {
  const rows = [
    ok(1, 'chatgpt', true, 2, 10), ok(1, 'gemini', false, null, 10),
    ok(2, 'chatgpt', false, null, 10),
    ok(3, 'chatgpt', false, null, 10, { response_snippet: '[no_ai_overview]' }),
  ]
  const h = headlineFor(rows, [1, 2, 3])
  assert.strictEqual(h.variant, 'recommended')
  assert.strictEqual(h.a, 1)
  assert.strictEqual(h.n, 2) // prompts with at least one real answer
})

test('variant is notYet when answers exist but the brand never appears', () => {
  const h = headlineFor([ok(1, 'chatgpt', false, null, 10), ok(2, 'gemini', false, null, 10)], [1, 2])
  assert.strictEqual(h.variant, 'notYet')
  assert.strictEqual(h.a, 0)
  assert.strictEqual(h.n, 2)
})

test('variant is unchecked when nothing answered, and error engines plus the oldest since are reported', () => {
  const rows = [err(1, 'gemini', 4), err(1, 'gemini', 9), err(2, 'claude', 6)]
  const h = headlineFor(rows, [1, 2])
  assert.strictEqual(h.variant, 'unchecked')
  assert.strictEqual(h.n, 0)
  assert.deepStrictEqual(h.errorEngines.slice().sort(), ['claude', 'gemini'])
  assert.strictEqual(h.since, D(4))
})

test('headline k counts distinct competitors across answered cells only', () => {
  const rows = [
    ok(1, 'chatgpt', false, null, 10, { competitors_mentioned: comps(['Lantern Table Co', 'Cedar Ash Events']) }),
    ok(2, 'gemini', false, null, 10, { competitors_mentioned: comps(['lantern table co', 'Green Plate Kitchen']) }),
    err(3, 'claude', 10),
  ]
  const h = headlineFor(rows, [1, 2, 3])
  assert.strictEqual(h.k, 3)
})

test('chips are the first three names of the page competitor list', () => {
  const freq = [{ name: 'A Co' }, { name: 'B Co' }, { name: 'C Co' }, { name: 'D Co' }]
  const h = headlineFor([ok(1, 'chatgpt', false, null, 10)], [1], freq)
  assert.deepStrictEqual(h.chips, ['A Co', 'B Co', 'C Co'])
})

// ── Best engine and tie-breaks ────────────────────────────────────────────────

console.log('best engine')

test('best engine is the highest mentioned/answered rate', () => {
  const rows = [
    ok(1, 'chatgpt', true, 3, 10), ok(2, 'chatgpt', false, null, 10),   // 1/2
    ok(1, 'gemini', true, 5, 10), ok(2, 'gemini', true, 6, 10),         // 2/2
    ok(1, 'claude', false, null, 10), ok(2, 'claude', false, null, 10), // 0/2
  ]
  const h = headlineFor(rows, [1, 2])
  assert.strictEqual(h.engine, 'gemini')
  assert.strictEqual(h.pos, 5)
})

test('equal rates: the engine with the lower best position wins', () => {
  const rows = [
    ok(1, 'chatgpt', true, 4, 10),
    ok(1, 'gemini', true, 2, 10),
    ok(1, 'claude', true, 3, 10),
  ]
  const h = headlineFor(rows, [1])
  assert.strictEqual(h.engine, 'gemini')
  assert.strictEqual(h.pos, 2)
})

test('equal rates and equal positions: ALL_ENGINES order decides', () => {
  const rows = [ok(1, 'gemini', true, 2, 10), ok(1, 'chatgpt', true, 2, 10)]
  const h = headlineFor(rows, [1])
  const first = PC.ALL_ENGINES.indexOf('chatgpt') < PC.ALL_ENGINES.indexOf('gemini') ? 'chatgpt' : 'gemini'
  assert.strictEqual(h.engine, first)
})

test('a null position loses the position tie-break to a real one', () => {
  const rows = [ok(1, 'chatgpt', true, null, 10), ok(1, 'gemini', true, 7, 10)]
  const h = headlineFor(rows, [1])
  assert.strictEqual(h.engine, 'gemini')
  assert.strictEqual(h.pos, 7)
})

test('no engine qualifies when nothing is mentioned, and engines with zero answers are excluded', () => {
  const rows = [ok(1, 'chatgpt', false, null, 10), err(1, 'gemini', 10)]
  const h = headlineFor(rows, [1])
  assert.strictEqual(h.engine, null)
  assert.strictEqual(h.pos, null)
})

test('an outage engine is not credited from its stale good row', () => {
  const rows = [ok(1, 'gemini', true, 1, 3), err(1, 'gemini', 11), ok(1, 'chatgpt', true, 4, 11)]
  const h = headlineFor(rows, [1])
  assert.strictEqual(h.engine, 'chatgpt')
})

// ── Locked columns ────────────────────────────────────────────────────────────

console.log('locked columns')

test('pickLockedColumns returns at most two, cheapest unlock first', () => {
  const states = {}
  PC.ALL_ENGINES.forEach(e => { states[e] = 'locked' })
  const picked = P.pickLockedColumns(states)
  assert.ok(picked.length <= 2)
  const cand = P.lockedCandidates(states)
  assert.deepStrictEqual(picked, cand.slice(0, 2))
  const rank = e => PC.PLAN_ORDER.indexOf(PC.ENGINE_UNLOCK_PLAN[e])
  for (let i = 1; i < cand.length; i++) assert.ok(rank(cand[i - 1]) <= rank(cand[i]), 'cheapest unlock first')
})

test('retired and non-locked engines are never candidates', () => {
  const states = {}
  PC.ALL_ENGINES.forEach(e => { states[e] = 'active' })
  assert.deepStrictEqual(P.pickLockedColumns(states), [])
  const retired = Array.from(PC.RETIRED_ENGINES)
  const all = {}
  PC.ALL_ENGINES.forEach(e => { all[e] = 'locked' })
  P.lockedCandidates(all).forEach(e => assert.ok(!retired.includes(e), e + ' is retired'))
})

test('missing state entries are not treated as locked', () => {
  assert.deepStrictEqual(P.pickLockedColumns({}), [])
})

// ── Result ────────────────────────────────────────────────────────────────────

console.log('\n' + passed + ' passed, ' + failed + ' failed')
if (failed > 0) process.exit(1)
