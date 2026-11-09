// Parity tests for the Phase 2 builder B view modules: Sentiment, Competitors,
// Recommendations. Pages cannot load in node (supabase.ts uses import.meta.env),
// so the pure view modules carry the logic and are tested here.
const path = require('path')
require('./helpers/ts_require')
const L = f => require(path.join(__dirname, '..', 'src', 'lib', f))
const M = L('metrics.ts')
const SV = L('views/sentimentView.ts')
const CV = L('views/competitorsView.ts')
const RV = L('views/recommendationsView.ts')
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
const view = M.buildSnapshotView(rows, F.activePromptIds, F.activeEngines)
const p = view.population
const activePrompts = F.prompts.filter(x => x.is_active)

// ── Sentiment ───────────────────────────────────────────────────────────────
check('sentiment summary is M3 over P', () => {
  const sv = SV.buildSentimentView(view)
  eq(sv.summary, M.sentimentSummary(p.cells))
  eq(sv.summary.total, p.cells.filter(c => c.brand_mentioned).length)
})
check('sentiment by engine only lists engines with a mention', () => {
  const sv = SV.buildSentimentView(view)
  eq(Object.keys(sv.byEngine).sort(), Object.keys(M.sentimentByEngine(p)).sort())
})
check('engine chart data follows engine order and percentages', () => {
  const sv = SV.buildSentimentView(view)
  const d = SV.buildEngineSentimentData(sv.byEngine, p.engineIds)
  for (const r of d) eq(typeof r.Positive + typeof r.Neutral + typeof r.Negative, 'numbernumbernumber')
  eq(d.length, Object.keys(sv.byEngine).length)
})
check('scoreMeta bands', () => {
  eq(SV.scoreMeta(null).label, 'No data yet')
  eq(SV.scoreMeta(75).label, 'Mostly Positive')
  eq(SV.scoreMeta(74).label, 'Mixed / Neutral')
  eq(SV.scoreMeta(49).label, 'Needs Attention')
  eq(SV.scoreMeta(24).label, 'Mostly Negative')
})
check('sentiment trend buckets by month and counts each sentiment', () => {
  const t = SV.computeTrend([
    { checked_at: '2026-11-01T10:00:00Z', sentiment: 'positive' },
    { checked_at: '2026-11-02T10:00:00Z', sentiment: 'negative' },
    { checked_at: '2026-11-03T10:00:00Z', sentiment: 'neutral' },
    { checked_at: '2026-10-03T10:00:00Z', sentiment: 'positive' },
  ], 'monthly')
  eq(t, [
    { period: '2026-10', Positive: 1, Neutral: 0, Negative: 0 },
    { period: '2026-11', Positive: 1, Neutral: 1, Negative: 1 },
  ])
})
check('feed drops no-answer rows and chip counts equal list length', () => {
  const hist = F.history.filter(r => r.brand_mentioned)
  const feed = SV.feedRows(hist.concat([{ ...hist[0], id: 999, response_snippet: '[no_ai_overview] x' }]))
  eq(feed.length, hist.length)
  const c = SV.feedCounts(feed)
  eq(c.total, feed.length)
  eq(c.positive + c.neutral + c.negative, feed.length)
  eq(SV.filterFeed(feed, 'all', 'all').length, c.total)
  eq(SV.filterFeed(feed, 'positive', 'all').length, c.positive)
  eq(SV.filterFeed(feed, 'all', 'chatgpt').length, feed.filter(r => r.llm === 'chatgpt').length)
})

// ── Competitors ─────────────────────────────────────────────────────────────
check('competitors view is metrics over P', () => {
  const v = CV.buildCompetitorsView(view, activePrompts)
  eq(v.topCompetitors, M.competitorStats(p, 5))
  eq(v.brandMentions, p.cells.filter(c => c.brand_mentioned).length)
  eq(v.brandAvgPos, M.averagePosition(p.cells.filter(c => c.brand_mentioned)))
  eq(v.totalResponses, p.cells.length)
  eq(v.engineShare, M.competitorEngineShare(p, v.topCompetitors.slice(0, 3)))
})
check('engine group rows use labels and one column per name', () => {
  const v = CV.buildCompetitorsView(view, activePrompts)
  const g = CV.buildEngineGroupData('Brand', v.engineShare)
  eq(g.length, v.engineShare.length)
  for (const r of g) {
    eq(typeof r.engine, 'string')
    eq(typeof r.Brand, 'number')
  }
})
check('sample prompt is the first ACTIVE prompt', () => {
  const m = new Map([[2, 'two'], [3, 'three']])
  eq(CV.samplePromptFor({ promptIds: [4, 3, 2] }, m), 'three')
  eq(CV.samplePromptFor({ promptIds: [4] }, m), '')
})
check('competitors trend counts brand and top names, case-insensitively', () => {
  const t = CV.computeTrend([
    { checked_at: '2026-11-01T10:00:00Z', brand_mentioned: true, competitors_mentioned: JSON.stringify([{ pos: 1, name: 'ACME co' }]) },
    { checked_at: '2026-11-02T10:00:00Z', brand_mentioned: false, competitors_mentioned: 'not json' },
  ], 'Brand', [{ name: 'Acme Co' }], 'monthly')
  eq(t, [{ period: '2026-11', Brand: 1, 'Acme Co': 1 }])
  eq(CV.computeTrend([], 'Brand', [], 'weekly'), [])
})
check('F5: trend drops inactive engines and no-answer rows', () => {
  const rows = [
    { llm: 'gemini', response_snippet: 'ok', checked_at: 'a' },
    { llm: 'meta', response_snippet: 'ok', checked_at: 'b' },
    { llm: 'gemini', response_snippet: '[no_ai_overview] none', checked_at: 'c' },
    { llm: 'claude', checked_at: 'd' },
  ]
  eq(CV.trendEligibleRows(rows, ['gemini', 'claude']).map(r => r.checked_at), ['a', 'd'])
})
check('competitors csv header, brand row first, exact rows', () => {
  const csv = CV.buildCompetitorsCsv(view, 'Brand, Inc', activePrompts)
  const lines = csv.replace('﻿', '').split('\r\n')
  eq(lines[0], 'Name,Is you,AI mentions,Ranked mentions,Avg position,Engines,Sample prompt')
  eq(csv.startsWith('﻿'), true)
  eq(csv.endsWith('\r\n'), true)
  eq(lines[1].startsWith('"Brand, Inc",yes,'), true)
  const comps = M.competitorStats(p, 100)
  eq(lines.length, 1 + 1 + comps.length + 1)
  comps.forEach((c, i) => {
    eq(lines[2 + i].startsWith(c.name + ',no,' + c.totalMentions + ',' + c.rankedMentions + ','), true)
  })
})
check('competitors csv with no data is header plus brand row', () => {
  const empty = M.buildSnapshotView([], F.activePromptIds, F.activeEngines)
  const lines = CV.buildCompetitorsCsv(empty, 'Brand', activePrompts).replace('﻿', '').split('\r\n')
  eq(lines.length, 3)
  eq(lines[1], 'Brand,yes,0,0,,,')
})

// ── Recommendations ─────────────────────────────────────────────────────────
check('recommendations stats shape and parity', () => {
  const s = RV.buildRecommendationsStats(view, F.prompts, 'Brand')
  eq(Object.keys(s).sort(), ['avgBrandPos', 'brandName', 'catStats', 'competitors', 'llmStats', 'overallRate', 'totalChecks', 'totalMentioned'])
  eq(s.totalChecks, p.cells.length)
  eq(s.totalMentioned, p.cells.filter(c => c.brand_mentioned).length)
  eq(s.overallRate, s.totalMentioned / s.totalChecks)
  eq(s.competitors, M.competitorStats(p, 6))
  eq(s.avgBrandPos, M.averagePosition(p.cells.filter(c => c.brand_mentioned)))
  for (const l of s.llmStats) eq(l.total > 0, true)
  eq(s.llmStats.map(l => l.llm), M.engineRates(p, view.errorEngines).filter(r => r.checked > 0).map(r => r.engine))
})
check('category stats are rate ascending with labels', () => {
  const s = RV.buildRecommendationsStats(view, F.prompts, 'Brand')
  const rates = s.catStats.map(c => c.rate)
  eq(rates, rates.slice().sort((a, b) => a - b))
  for (const c of s.catStats) eq(c.label, RV.CATEGORY_LABEL[c.cat] ?? c.cat)
})
check('engine errors count failed prompt checks, not calls', () => {
  eq(RV.buildEngineErrors(rows, F.activeEngines), M.engineErrorCells(rows, F.activeEngines))
})
check('ai snippets come from P, newest first, capped 4 and 5', () => {
  const sn = RV.buildAiSnippets(view, F.prompts)
  eq(sn.mentioned.length <= 4, true)
  eq(sn.absent.length <= 5, true)
  for (const m of sn.mentioned) eq(typeof m.prompt, 'string')
  for (const a of sn.absent) eq('topComp' in a, true)
})

console.log(`views_b: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
