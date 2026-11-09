const path = require('path')
require('./helpers/ts_require')
const L = f => require(path.join(__dirname, '..', 'src', 'lib', f))
const M = L('metrics.ts')
const { buildFixResultMap } = L('fixItems.ts')
const { buildCellViews, engineErrorSince } = L('promptPerformance.ts')
const { computeAiVisibilityScore } = L('aiVisibilityScore.ts')
const { measureFix, evaluateFix } = L('fixStates.ts')
const F = require('./fixtures/results-fixture')

let passed = 0, failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
}
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}

const full = F.history.slice().sort(M.compareNewestFirst)
const derived = M.deriveLatestRows(F.history)
const byId = id => derived.find(r => r.id === id)
const idsOf = (p, l) => derived.filter(r => r.prompt_id === p && r.llm === l).map(r => r.id).sort((a, b) => a - b)

check('derived output is id desc', () => {
  const ids = derived.map(r => r.id)
  eq(ids, ids.slice().sort((a, b) => b - a))
})
check('cell p2/gemini keeps latest, run start and usable only', () => eq(idsOf(2, 'gemini'), [5, 12, 14]))
check('cell p1/gemini flags', () => {
  eq(idsOf(1, 'gemini'), [2, 11])
  const e = byId(11), o = byId(2)
  eq([e.is_latest, e.is_newest_error, e.is_run_start, e.is_usable], [true, true, true, false])
  eq([o.is_latest, o.is_usable, o.is_last_nonerror, o.is_run_start], [false, true, true, false])
})
check('cell p3/gemini: no-answer above error above ok', () => {
  eq(idsOf(3, 'gemini'), [8, 17, 18])
  eq([byId(17).is_latest, byId(17).is_last_nonerror, byId(17).is_usable], [true, true, false])
  eq([byId(18).is_newest_error, byId(8).is_usable], [true, true])
})
check('equal checked_at: id desc wins', () => {
  eq(byId(20).is_latest, true)
  eq(byId(20).is_usable, true)
  eq(idsOf(3, 'claude'), [20])
})
check('errors only cell', () => {
  const e = byId(15)
  eq([e.is_latest, e.is_newest_error, e.is_usable, e.is_last_nonerror], [true, true, false, false])
})
check('engine_error_since', () => {
  eq(byId(15).engine_error_since, '2026-11-04T10:00:00')
  eq(byId(10).engine_error_since, null)
  eq(byId(17).engine_error_since, null)
})
check('status defaults to ok for demo rows', () => {
  const d = M.deriveLatestRows([{ id: 1, prompt_id: 1, llm: 'chatgpt', brand_mentioned: true, brand_position: 1, sentiment: 'positive', response_snippet: null, checked_at: '2026-11-01T00:00:00' }])
  eq(d[0].status, 'ok')
  eq(d[0].is_usable, true)
  eq(d[0].model, null)
})

const view = M.buildSnapshotView(derived, F.activePromptIds, F.activeEngines)
const pop = view.population

function cellIds(results) {
  const out = {}
  for (const pid of [1, 2, 3, 4]) {
    for (const e of F.activeEngines) {
      const row = results.get(pid) && results.get(pid).get(e)
      out[pid + '|' + e] = row ? row.id : null
    }
  }
  return out
}
check('buildFixResultMap parity full vs derived', () => {
  const a = buildFixResultMap(full, F.activeEngines)
  eq(cellIds(a.results), cellIds(view.results))
  eq([...a.errorEngines].sort(), [...view.errorEngines].sort())
  eq([...a.partialErrorEngines].sort(), [...view.partialErrorEngines].sort())
  eq(a.latestChecked, view.latestChecked)
})
check('buildCellViews parity', () => {
  const proj = m => {
    const o = {}
    m.forEach((cells, pid) => cells.forEach((c, e) => {
      o[pid + '|' + e] = [c.state, c.position, c.current && c.current.id, c.errorSince, c.previousOk && c.previousOk.id]
    }))
    return o
  }
  const a = buildCellViews(full.filter(r => F.activeEngines.includes(r.llm) && F.activePromptIds.includes(r.prompt_id)), F.activeEngines, F.activePromptIds)
  const b = buildCellViews(M.cellViewRows(derived, F.activePromptIds, F.activeEngines), F.activeEngines, F.activePromptIds)
  eq(proj(a), proj(b))
})
check('engineErrorSince parity', () => {
  const a = engineErrorSince(full.filter(r => F.activeEngines.includes(r.llm)))
  const b = M.engineErrorSinceByEngine(M.engineLevelRows(derived, F.activeEngines))
  for (const e of F.activeEngines) eq(b[e] === undefined ? null : b[e], a[e] === undefined ? null : a[e])
})
check('engineHealth matches the full-history walk', () => {
  const walk = {}
  for (const r of full) {
    if (!F.activeEngines.includes(r.llm)) continue
    const h = walk[r.llm] || (walk[r.llm] = { lastAttemptAt: null, lastAttemptFailed: false, lastErrorCode: null, lastOkAt: null })
    if (h.lastAttemptAt === null) {
      h.lastAttemptAt = r.checked_at
      h.lastAttemptFailed = r.status === 'error'
      h.lastErrorCode = r.error_code == null ? null : r.error_code
    }
    if (r.status !== 'error' && h.lastOkAt === null) h.lastOkAt = r.checked_at
  }
  const got = M.engineHealth(derived, F.activeEngines)
  for (const e of F.activeEngines) eq(got.get(e), walk[e])
})
check('newestErrorAtByEngine matches full history', () => {
  const walk = {}
  for (const r of full) {
    if (r.status !== 'error' || !F.activeEngines.includes(r.llm)) continue
    if (!walk[r.llm] || r.checked_at > walk[r.llm]) walk[r.llm] = r.checked_at
  }
  eq(M.newestErrorAtByEngine(derived, F.activeEngines), walk)
})
check('measureFix and evaluateFix parity', () => {
  const a = buildFixResultMap(full, F.activeEngines).results
  const scope = { kind: 'all' }
  eq(measureFix(scope, a, F.activePromptIds, F.activeEngines), measureFix(scope, view.results, F.activePromptIds, F.activeEngines))
  const row = { status: 'done', metric_key: 'all', baseline_value: 10, marked_at: '2026-10-01T00:00:00Z' }
  const now = Date.parse('2026-11-08T00:00:00Z')
  eq(evaluateFix(row, a, F.activePromptIds, F.activeEngines, now), evaluateFix(row, view.results, F.activePromptIds, F.activeEngines, now))
})

check('M1 mention rate', () => eq(M.mentionRate(pop), { checked: 8, mentioned: 4, pct: 50 }))
check('M1 empty', () => eq(M.mentionRate({ promptIds: [], engineIds: [], cells: [] }).pct, null))
check('M2 and M2b', () => {
  eq(M.averagePosition(pop.cells), 2.7)
  eq(M.bestPosition(pop.cells), 1)
})
check('M3 and M3b', () => {
  const s = M.sentimentSummary(pop.cells)
  eq(s.total, 4)
  eq([s.positive, s.neutral, s.negative, s.other], [1, 2, 1, 0])
  eq(s.score, 50)
  eq(s.pct, { positive: 25, neutral: 50, negative: 25 })
  eq(M.sentimentSummary([]).score, null)
})
check('M4 coverage', () => eq(M.engineCoverage(pop), { active: F.activeEngines, heardFrom: F.activeEngines, withMention: F.activeEngines, reachPct: 100 }))
check('M5 engine rates and bands', () => {
  const rates = M.engineRates(pop, new Set())
  eq(rates.map(x => [x.engine, x.checked, x.mentioned, x.pct, x.avgPosition, x.bestPosition, x.band]), [
    ['chatgpt', 3, 2, 67, 2.5, 1, 'KNOW'],
    ['gemini', 3, 1, 33, 3, 3, 'PARTIAL'],
    ['claude', 2, 1, 50, null, null, 'KNOW'],
  ])
  const un = M.engineRates({ promptIds: [1], engineIds: ['gemini'], cells: [] }, new Set(['gemini']))
  eq(un[0].band, 'UNAVAILABLE')
  eq(M.engineRates({ promptIds: [1], engineIds: ['gemini'], cells: [] }, new Set())[0].band, 'NOT_MEASURED')
})
check('M6 competitors and M6b share', () => {
  const comps = M.competitorStats(pop, 5)
  eq(comps.map(c => c.name).sort(), ['Acme Co', 'Beta Ltd'])
  const share = M.competitorEngineShare(pop, comps)
  eq(share.map(s => s.engine), F.activeEngines)
  eq(share[0].brandPct, 67)
})
check('M7 category rates ascending', () => {
  const c = M.categoryRates(pop, F.prompts)
  eq(c.map(x => [x.category, x.checked, x.mentioned]), [['mid', 5, 2], ['general', 3, 2]])
})
check('M8 score, and M1 equals recognition', () => {
  const v = M.visibilityScore(pop, view.results)
  eq(v.dimensions.recognition, M.mentionRate(pop).pct)
  eq(v, computeAiVisibilityScore(F.activePromptIds, view.results, F.activeEngines))
})
check('M9 any measurement', () => {
  eq(M.hasAnyMeasurement(derived), true)
  eq(M.hasAnyMeasurement(derived.map(r => ({ ...r, is_usable: false }))), false)
})
check('engineErrorCells', () => {
  const mk = (id, p) => ({ id, prompt_id: p, llm: 'gemini', status: 'error', brand_mentioned: false, brand_position: null, sentiment: 'none', checked_at: '2026-11-01T00:00:00' })
  const only = M.deriveLatestRows([mk(1, 1), mk(2, 2)])
  eq(M.engineErrorCells(only, ['gemini', 'claude']), [{ engine: 'gemini', count: 2 }])
  eq(M.engineErrorCells(derived, F.activeEngines), [])
})
check('formatAvgPosition', () => {
  eq(M.formatAvgPosition(2.666), '#2.7')
  eq(M.formatAvgPosition(null), null)
})
check('no NaN from empty input', () => {
  const v = M.buildSnapshotView([], [], [])
  eq(M.mentionRate(v.population).pct, null)
  eq(M.visibilityScore(v.population, v.results).aiScore, 0)
})
console.log(`metrics: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
