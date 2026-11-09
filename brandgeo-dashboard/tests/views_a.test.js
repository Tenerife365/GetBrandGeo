const path = require('path')
const fs = require('fs')
require('./helpers/ts_require')
const L = f => require(path.join(__dirname, '..', 'src', 'lib', f))
const M = L('metrics.ts')
const A = L('views/aiVisibilityView.ts')
const D = L('views/dashboardView.ts')
const N = L('views/mentionsView.ts')
const { buildCellViews } = L('promptPerformance.ts')
const { buildFixResultMap, buildFixItems } = L('fixItems.ts')
const { toCsv } = L('csv.ts')
const F = require('./fixtures/results-fixture')

let passed = 0, failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL', name, e.message) }
}
const eq = (a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b)
  if (x !== y) throw new Error(x + ' !== ' + y)
}

const rows = M.deriveLatestRows(F.history)
const activePrompts = F.prompts.filter(p => F.activePromptIds.includes(p.id))
const engines = F.activeEngines
const sv = M.buildSnapshotView(rows, F.activePromptIds, engines)

// ── Overview ────────────────────────────────────────────────────────────────
const dash = D.buildDashboardView({ rows, activePrompts, prompts: F.prompts, activeEngines: engines, history: null })
check('overview mention equals metrics', () => eq(dash.mention, M.mentionRate(sv.population)))
check('overview avgPosition equals metrics', () => eq(dash.avgPosition, M.averagePosition(sv.population.cells)))
check('overview score equals metrics', () => eq(dash.score, M.visibilityScore(sv.population, sv.results)))
check('overview engine bars equal metrics', () => {
  const r = M.engineRates(sv.population, sv.errorEngines).filter(e => e.checked > 0)
  eq(dash.engineBars.map(b => [b.id, b.rate, b.count]), r.map(e => [e.engine, e.pct ?? 0, e.checked]))
})
check('overview window is null until history loads', () => eq(dash.window, null))
check('overview window drops inactive engines and no-answer rows', () => {
  const w = D.buildDashboardView({ rows, activePrompts, prompts: F.prompts, activeEngines: engines, history: F.history }).window
  const kept = D.filterWindowRows(F.history, engines)
  eq(w.checks, kept.length)
  if (kept.some(r => r.llm === 'perplexity')) throw new Error('inactive engine kept')
})

// ── AI Visibility ───────────────────────────────────────────────────────────
const av = A.buildAiVisibilityData({ rows, activePrompts, activeEngines: engines, clientId: 1 })
check('aiv rates equal metrics', () => eq(av.rates, M.engineRates(sv.population, sv.errorEngines)))
check('aiv score equals metrics', () => eq(av.score, M.visibilityScore(sv.population, sv.results)))
check('aiv totalChecked and gapCount equal metrics', () => {
  const mr = M.mentionRate(sv.population)
  eq([av.totalChecked, av.gapCount], [mr.checked, mr.checked - mr.mentioned])
})
check('aiv competitors equal metrics', () => {
  eq(av.competitorFreq.map(c => c.name), M.competitorStats(sv.population, 8).map(c => c.name))
})
check('aiv category stats equal metrics', () => eq(av.categoryStats, M.categoryRates(sv.population, activePrompts)))
check('aiv cell views from the snapshot equal those from full history', () => {
  // Same-timestamp ties are resolved id-descending, as the snapshot does.
  const full = F.history.slice().sort(M.compareNewestFirst).filter(r => engines.includes(r.llm) && F.activePromptIds.includes(r.prompt_id))
  const a = buildCellViews(av.cellRows, engines, F.activePromptIds)
  const b = buildCellViews(full, engines, F.activePromptIds)
  const strip = m => Array.from(m.entries()).map(([p, cm]) => [p, Array.from(cm.entries()).map(([e, c]) => [e, c.state, c.position])])
  eq(strip(a), strip(b))
})
check('fix items identical from snapshot and from full rows', () => {
  const mk = rs => {
    const o = buildFixResultMap(rs, engines)
    return buildFixItems({
      brandName: 'Acme', engines: engines.map(e => ({ id: e, label: e })),
      prompts: activePrompts.map((p, i) => ({ id: p.id, text: p.text, position: i })),
      results: o.results, errorEngines: o.errorEngines, stateOf: () => undefined,
    }).map(f => [f.id, f.title])
  }
  eq(mk(rows), mk(F.history.slice().sort(M.compareNewestFirst)))
})

// ── CSV ─────────────────────────────────────────────────────────────────────
check('csv header is exact', () => eq(A.AI_VISIBILITY_CSV_HEADER, [
  'Prompt ID', 'Prompt', 'Category', 'Engine', 'Result', 'Brand mentioned', 'Position',
  'Sentiment', 'Competitors named', 'Checked at', 'Last answer at', 'Not answering since',
]))
const cellViews = buildCellViews(av.cellRows, engines, F.activePromptIds)
const csvRows = A.buildAiVisibilityCsvRows({
  prompts: activePrompts, engines: engines.map(e => ({ id: e, label: e })), cellViews, results: av.results,
})
const csvCell = (pid, eng) => csvRows.find(r => r[0] === pid && r[3] === eng)
const COL = { result: 4, mentioned: 5, position: 6, sentiment: 7, comps: 8, checked: 9, lastAnswer: 10, since: 11 }
check('csv has one row per prompt and engine', () => eq(csvRows.length, activePrompts.length * engines.length))
check('csv rows are as wide as the header', () => csvRows.forEach(r => eq(r.length, A.AI_VISIBILITY_CSV_HEADER.length)))
check('csv result labels come from the fixed set', () => {
  const ok = new Set(['Mentioned', 'Not mentioned', 'No answer', 'Error', 'Not checked'])
  csvRows.forEach(r => { if (!ok.has(r[4])) throw new Error('label ' + r[4]) })
})
check('csv covers the error and no-answer states of the fixture', () => {
  const labels = new Set(csvRows.map(r => r[4]))
  if (!labels.has('Error') || !labels.has('No answer')) throw new Error(Array.from(labels).join(','))
})
check('csv error rows carry the not-answering-since date, others do not', () => {
  csvRows.forEach(r => { if ((r[4] === 'Error') !== (r[11] != null)) throw new Error('row ' + r[0] + r[3]) })
})
check('csv Brand mentioned is lowercase yes/no for answered cells, empty otherwise', () => {
  eq(csvCell(1, 'chatgpt')[COL.mentioned], 'yes')            // mentioned
  eq(csvCell(2, 'chatgpt')[COL.mentioned], 'no')             // absent
  eq(csvCell(1, 'gemini')[COL.mentioned], '')                // error
  eq(csvCell(3, 'chatgpt')[COL.mentioned], '')               // no answer
  eq(csvCell(3, 'chatgpt')[COL.result], 'No answer')
})
check('csv Position is set for mentioned cells only', () => {
  eq(csvCell(1, 'chatgpt')[COL.position], 1)
  eq(csvCell(2, 'chatgpt')[COL.position], null)
  eq(csvCell(3, 'chatgpt')[COL.position], null)
})
check('csv Sentiment is printed for mentioned cells only, not the default of an absent one', () => {
  eq(csvCell(1, 'chatgpt')[COL.sentiment], 'positive')
  eq(csvCell(1, 'claude')[COL.sentiment], 'neutral')
  eq(csvCell(2, 'chatgpt')[COL.result], 'Not mentioned')
  eq(csvCell(2, 'chatgpt')[COL.sentiment], '')
  eq(csvCell(3, 'chatgpt')[COL.sentiment], '')
})
check('csv Competitors named go through toDisplayName', () => {
  const { toDisplayName, isLikelyCompanyName } = L('competitorFilter.ts')
  const { parseRankedCompetitors } = L('promptPerformance.ts')
  const raw = JSON.parse(F.history.find(r => r.id === 10).competitors_mentioned).map(x => x.name)
  const want = raw.filter(isLikelyCompanyName).map(toDisplayName).join('; ')
  eq(csvCell(1, 'chatgpt')[COL.comps], want)
  eq(csvCell(1, 'chatgpt')[COL.comps] === '', false)
  eq(csvCell(1, 'gemini')[COL.comps], '')                    // error cell names nothing
})
check('csv Checked at is the current row as stored, empty for a pending cell', () => {
  eq(csvCell(1, 'chatgpt')[COL.checked], '2026-11-05T10:00:00')
  eq(csvCell(2, 'claude')[COL.result], 'Error')
})
check('csv Last answer at is the usable row in results, for error and no-answer cells', () => {
  eq(csvCell(1, 'chatgpt')[COL.lastAnswer], '2026-11-05T10:00:00')
  eq(csvCell(1, 'gemini')[COL.result], 'Error')
  eq(csvCell(1, 'gemini')[COL.lastAnswer], '2026-11-01T10:00:00')   // the older ok row
  eq(csvCell(3, 'chatgpt')[COL.lastAnswer], '2026-11-02T11:00:00')  // under the no-answer row
  eq(csvCell(2, 'claude')[COL.lastAnswer], null)                    // error and never an ok row
})
check('csv Not answering since is the error run start, error cells only', () => {
  eq(csvCell(1, 'gemini')[COL.since], '2026-11-05T11:00:00')
  eq(csvCell(1, 'chatgpt')[COL.since], null)
  eq(csvCell(3, 'chatgpt')[COL.since], null)
})
check('csv serialises with BOM and CRLF', () => {
  const s = toCsv(A.AI_VISIBILITY_CSV_HEADER, csvRows)
  if (s.charCodeAt(0) !== 0xFEFF || !s.includes('\r\n')) throw new Error('format')
})

// ── Mentions ────────────────────────────────────────────────────────────────
const hist = F.history.filter(r => r.brand_mentioned)
const nv = N.buildMentionsView({ rows, activePrompts, prompts: F.prompts, activeEngines: engines, history: hist })
check('mentions summary equals metrics', () => {
  const cells = sv.population.cells.filter(c => c.brand_mentioned)
  eq(nv.summary, { mentions: cells.length, avgPosition: M.averagePosition(cells), positive: M.sentimentSummary(cells).positive })
})
check('mentions engine counts sum to the feed length', () => eq(nv.engineCounts.reduce((s, e) => s + e.count, 0), nv.feed.length))
check('mentions feed has only active engines', () => nv.feed.forEach(f => { if (!engines.includes(f.llm)) throw new Error(f.llm) }))

// ── Source greps ────────────────────────────────────────────────────────────
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', 'pages', f), 'utf8')
const pages = ['Dashboard.tsx', 'AIVisibility.tsx', 'Mentions.tsx']
check('no hand-rolled rate or average maths in the pages', () => {
  pages.forEach(f => {
    const s = src(f)
    for (const bad of ['brand_mentioned).length', 'reduce((s, r) => s + (r.brand_position', 'aggregateCompetitors(']) {
      if (s.includes(bad)) throw new Error(f + ' still has ' + bad)
    }
  })
})
// ── F4, F6, F8 source guards ────────────────────────────────────────────────
check('aiv: quiet reload at every call site, only the full-error card may be non-quiet', () => {
  const s = src('AIVisibility.tsx')
  const bare = s.match(/reload\(\)/g) || []
  eq(bare.length, 1)
  if (!s.includes('onRetry={() => reload()}')) throw new Error('the one non-quiet reload must be the full-error card retry')
})
check('aiv: fix state side reads run in one Promise.all by client_id', () => {
  const s = src('AIVisibility.tsx')
  if (!/Promise\.all\(\[\s*readFixStates\(\),\s*supabase\.from\('client_api_keys'\)\.select\('id, label'\)\.eq\('client_id', cid\),\s*supabase\.from\('oauth_grants'\)\.select\('id, client_name'\)\.eq\('client_id', cid\),/.test(s)) throw new Error('not one Promise.all')
  if (s.includes("from('oauth_grants').select('id, client_name').in(")) throw new Error('conditional grant read remains')
})
check('aiv: engine band and best position come from engineRates, resultsKey from snapshot.version', () => {
  const s = src('AIVisibility.tsx')
  if (s.includes("s.pct >= 50 ? 'KNOW'")) throw new Error('inline band')
  if (s.includes('bestPos === null ||')) throw new Error('inline best position')
  if (!s.includes('const resultsKey = String(snapshot?.version')) throw new Error('resultsKey')
})
check('recommendations: generate refuses a snapshot of another client', () => {
  if (!src('Recommendations.tsx').includes('snapshot.clientId !== activeClientId) return')) throw new Error('guard missing')
})

check('no text loading placeholder left', () => pages.forEach(f => { if (src(f).includes('text-sm animate-pulse')) throw new Error(f) }))
check('only the paged cost read touches ai_results outside history', () => {
  eq((src('AIVisibility.tsx').match(/from\('ai_results'\)/g) || []).length, 1)
  eq((src('Dashboard.tsx').match(/from\('ai_results'\)/g) || []).length, 0)
  eq((src('Mentions.tsx').match(/from\('ai_results'\)/g) || []).length, 0)
})

console.log(`views_a: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
