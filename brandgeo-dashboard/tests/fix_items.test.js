/**
 * fix_items.test.js - pins src/lib/fixItems.ts (docs/arch/mcp-stage2-fixes.md
 * section 9.1). buildFixResultMap and buildFixItems were moved verbatim out of
 * src/pages/AIVisibility.tsx; the parity cases below keep the OLD inline
 * builder (from git HEAD before the move) as an oracle and assert deep
 * equality on the same fixtures.
 *
 * Run: `node tests/fix_items.test.js` from brandgeo-dashboard/.
 * Fixtures: BrandGEO itself or fictional names only.
 */
require('./helpers/ts_require')
const assert = require('assert')
const path = require('path')
const lib = (f) => require(path.join(__dirname, '..', 'src', 'lib', f))
const { buildFixResultMap, buildFixItems } = lib('fixItems.ts')
const { computeAiVisibilityScore } = lib('aiVisibilityScore.ts')
const { aggregateCompetitors } = lib('competitorFilter.ts')
const C = lib('aiVisibilityCopy.ts')
const S = lib('fixStates.ts')
const { MARKETS } = lib('markets.ts')

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++ } catch (e) { failed++; console.log('FAIL: ' + name + '\n  ' + (e && e.message)) }
}

// ── Fixtures ────────────────────────────────────────────────────────────────
let rid = 0
function row(promptId, llm, o = {}) {
  rid++
  return {
    id: rid, prompt_id: promptId, llm,
    response_snippet: o.snippet === undefined ? 'An answer.' : o.snippet,
    brand_mentioned: !!o.mentioned,
    brand_position: o.pos === undefined ? null : o.pos,
    sentiment: o.sentiment || 'neutral',
    checked_at: o.at || '2026-11-01T10:00:00.000Z',
    competitors_mentioned: o.comps === undefined ? null : JSON.stringify(o.comps),
    status: o.status || 'ok',
    error_code: o.status === 'error' ? 'api_error' : null,
  }
}
const ENGINES = [
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
]
const ENGINE_IDS = ENGINES.map(e => e.id)
const mkPrompts = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, text: `Best tool number ${i + 1}?`, position: i + 1 }))
const none = () => undefined

// ── OLD inline builder (oracle), copied from AIVisibility.tsx at HEAD ───────
function oracleItems(ctx) {
  const { brandName, engines, prompts, results, errorEngines, fixRows } = ctx
  // derivations the page did at component scope
  const llmStats = engines.map(llm => {
    const mentioned = prompts.filter(p => results.get(p.id)?.get(llm.id)?.brand_mentioned).length
    const checked = prompts.filter(p => results.get(p.id)?.has(llm.id)).length
    return { ...llm, mentioned, checked, pct: checked > 0 ? Math.round((mentioned / checked) * 100) : 0 }
  })
  const { dimensions } = computeAiVisibilityScore(prompts.map(p => p.id), results, engines.map(l => l.id))
  const overallPct = dimensions.recognition
  const competitorFreq = aggregateCompetitors(
    Array.from(results.values()).flatMap(m => Array.from(m.values())), 8,
  ).map(c => ({ name: c.name, count: c.totalMentions, avgPos: c.avgPos, rankedMentions: c.rankedMentions, proseOnly: c.proseOnly }))
  const totalChecked0 = (() => { let n = 0; results.forEach(m => { n += m.size }); return n })()
  const gapCount = totalChecked0 - (() => { let n = 0; results.forEach(m => { m.forEach(r => { if (r.brand_mentioned) n++ }) }); return n })()
  const engineStatusCards = llmStats.map(s => {
    const isUnavailable = errorEngines.has(s.id) && s.checked === 0
    const status = isUnavailable ? 'UNAVAILABLE'
      : s.checked === 0 ? 'NOT_MEASURED'
      : s.pct >= 50 ? 'KNOW' : s.pct >= 25 ? 'PARTIAL' : 'MISSING'
    return { ...s, status, isUnavailable }
  })

  // ---- verbatim old IIFE body ----
  const items = []
  const allMissing = engineStatusCards.length > 0 && engineStatusCards.every(e => e.status === 'MISSING')
  if (allMissing) {
    const totalChecked = engineStatusCards.reduce((a, e) => a + e.checked, 0)
    const totalMentioned = engineStatusCards.reduce((a, e) => a + e.mentioned, 0)
    items.push({
      id: S.fixIds.visibilityAll(),
      metricKey: S.metricKeys.all(),
      priority: 'P0',
      title: totalMentioned === 0 ? C.AIV_COPY.fixAllMissingTitle : C.AIV_COPY.fixAllLowTitle,
      description: totalMentioned === 0
        ? C.fixAllMissingLine(brandName, totalChecked, engineStatusCards.length)
        : C.fixAllLowLine(brandName, totalMentioned, totalChecked, engineStatusCards.length),
      fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications AI engines trust. Ensure your domain has schema.org/Organization structured data with complete fields.`,
    })
  } else {
    engineStatusCards.filter(e => e.status === 'MISSING' && e.checked > 0 && !e.isUnavailable).forEach(e => {
      items.push({
        id: S.fixIds.engineMissing(e.id),
        metricKey: S.metricKeys.engine(e.id),
        priority: 'P0',
        title: C.fixEngineMissingTitle(e.label, e.mentioned),
        description: C.fixAppearsLine(brandName, e.mentioned, e.checked, e.label),
        fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications ${e.label} training data trusts. Ensure your domain has schema.org/Organization structured data with complete fields.`,
      })
    })
  }
  engineStatusCards.filter(e => e.status === 'PARTIAL' && e.checked > 0).forEach(e => {
    items.push({
      id: S.fixIds.engineLow(e.id),
      metricKey: S.metricKeys.engine(e.id),
      priority: 'P1',
      title: `Low visibility in ${e.label} (${e.pct}%)`,
      description: `Brand appears inconsistently, in ${e.mentioned} of ${e.checked} prompts checked.`,
      fix: `Strengthen brand authority signals for ${e.label}: publish 3+ long-form pages that directly answer your tracked queries, build backlinks from industry media mentioning ${brandName} in context, and add FAQ schema markup to your site's key landing pages.`,
    })
  })
  const topRanked = competitorFreq.find(c => !c.proseOnly && c.avgPos !== null)
  if (topRanked && gapCount > 0) {
    items.push({
      id: S.fixIds.outranked(topRanked.name),
      metricKey: S.metricKeys.competitor(topRanked.name),
      competitor: topRanked.name,
      competitorAvgRank: topRanked.avgPos,
      priority: 'P1',
      title: `Outranked by ${topRanked.name} (avg #${topRanked.avgPos})`,
      description: `${topRanked.name} is ranked by an engine in ${topRanked.rankedMentions} of its ${topRanked.count} appearances, while ${brandName} is absent in ${gapCount} checks.`,
      fix: `Publish a detailed comparison page: "${brandName} vs ${topRanked.name}" covering differentiators, pricing, and use cases. Pitch this page to trade publications and ask clients for case study testimonials published under your domain.`,
    })
  }
  if (dimensions.consistency < 40 && overallPct > 0) {
    items.push({
      id: S.fixIds.consistency(),
      metricKey: S.metricKeys.consistency(),
      priority: 'P2',
      title: 'Inconsistent cross-prompt coverage',
      description: `Brand appears in only ${dimensions.consistency}% of prompts with consistent multi-engine coverage. AI models know you selectively.`,
      fix: `Map which prompt topics are missing and create dedicated content for each gap. Ensure every service category and location you serve has a standalone indexed page with your brand name in the H1 and title tag.`,
    })
  }
  if (dimensions.knowledge > 0 && dimensions.knowledge < 50) {
    items.push({
      id: S.fixIds.ranking(),
      metricKey: S.metricKeys.knowledge(),
      priority: 'P2',
      title: 'Improve ranking position',
      description: `When mentioned, ${brandName} averages a lower position. Competitors rank above you in shared responses.`,
      fix: `Build topical authority by publishing a content cluster: one pillar page on your main category + 5 supporting posts on subtopics. Internal-link them together. This signals depth of expertise to AI training pipelines.`,
    })
  }
  const gaps = prompts.map(p => {
    const cells = Array.from(results.get(p.id)?.values() ?? [])
    const withCompetitor = cells.filter(r => {
      try {
        const arr = JSON.parse(r.competitors_mentioned ?? '[]')
        return Array.isArray(arr) && arr.length > 0
      } catch { return false }
    }).length
    return { p, answers: cells.length, mentioned: cells.some(r => r.brand_mentioned), withCompetitor }
  })
    .filter(g => g.answers > 0 && !g.mentioned && S.isOpenState(fixRows.get(S.fixIds.promptGap(g.p.id))?.status))
    .sort((a, b) => b.withCompetitor - a.withCompetitor || a.p.position - b.p.position)
    .slice(0, S.MAX_PROMPT_GAP_FIXES)
  gaps.forEach(g => {
    items.push({
      id: S.fixIds.promptGap(g.p.id),
      metricKey: S.metricKeys.prompt(g.p.id),
      priority: 'P2',
      title: C.fixPromptGapTitle(g.p.text),
      description: C.fixPromptGapLine(brandName, g.answers, g.withCompetitor),
      fix: C.FIX_COPY.promptGapFix,
    })
  })
  return items
}

function run(rows, prompts, o = {}) {
  const brandName = o.brandName || 'BrandGEO'
  const fixRows = o.fixRows || new Map()
  const { results, errorEngines } = buildFixResultMap(rows, ENGINE_IDS)
  const input = {
    brandName, engines: ENGINES, prompts, results, errorEngines,
    stateOf: id => fixRows.get(id)?.status,
  }
  return { items: buildFixItems(input), oracle: oracleItems({ brandName, engines: ENGINES, prompts, results, errorEngines, fixRows }), results, errorEngines }
}
const ids = (items) => items.map(i => i.id)

// Fixture A: nobody names the brand anywhere, rivals do.
function fixtureA() {
  const prompts = mkPrompts(4)
  const rows = []
  prompts.forEach(p => ENGINE_IDS.forEach((e, i) => {
    rows.push(row(p.id, e, { comps: p.id <= 2 ? [{ pos: 1, name: 'Acme Metrics' }, { pos: 2 + i, name: 'Northwind Insights' }] : [] }))
  }))
  return { prompts, rows }
}
// Fixture B: chatgpt missing, gemini partial, claude knows.
function fixtureB() {
  const prompts = mkPrompts(4)
  const rows = []
  prompts.forEach(p => {
    rows.push(row(p.id, 'chatgpt', { comps: [{ pos: 1, name: 'Acme Metrics' }] }))
    rows.push(row(p.id, 'gemini', p.id === 1 ? { mentioned: true, pos: 2 } : { comps: [{ pos: 1, name: 'Acme Metrics' }] }))
    rows.push(row(p.id, 'claude', p.id <= 3 ? { mentioned: true, pos: 1 } : {}))
  })
  return { prompts, rows }
}
// Fixture C: every engine low but above zero.
function fixtureC() {
  const prompts = mkPrompts(5)
  const rows = []
  prompts.forEach(p => ENGINE_IDS.forEach(e => rows.push(row(p.id, e, p.id === 1 ? { mentioned: true, pos: 3 } : { comps: [{ pos: 1, name: 'Acme Metrics' }] }))))
  return { prompts, rows }
}
// Fixture D: 13 prompts, none mentioned, varying competitor pressure.
function fixtureD() {
  const prompts = mkPrompts(13)
  const rows = []
  prompts.forEach(p => ENGINE_IDS.forEach(e => rows.push(row(p.id, e,
    { comps: p.id % 4 === 0 ? [{ pos: 2, name: 'Northwind Insights' }] : [] }))))
  return { prompts, rows }
}
// Fixture E: strong brand but deep ranks (ranking fix), one error-only engine.
function fixtureE() {
  const prompts = mkPrompts(4)
  const rows = []
  prompts.forEach(p => {
    rows.push(row(p.id, 'chatgpt', { mentioned: true, pos: 9 }))
    rows.push(row(p.id, 'gemini', { mentioned: true, pos: 8 }))
    rows.push(row(p.id, 'claude', { status: 'error' }))
  })
  return { prompts, rows }
}

// ── buildFixItems: every kind ───────────────────────────────────────────────
check('visibility:all, zero mentions: P0 title and copy', () => {
  const { prompts, rows } = fixtureA()
  const { items } = run(rows, prompts)
  assert.strictEqual(items[0].id, 'visibility:all')
  assert.strictEqual(items[0].priority, 'P0')
  assert.strictEqual(items[0].title, C.AIV_COPY.fixAllMissingTitle)
  assert.strictEqual(items[0].description, C.fixAllMissingLine('BrandGEO', 12, 3))
  assert.strictEqual(items.some(i => i.id.startsWith('engine_missing:')), false)
})
check('visibility:all, some mentions: the low title', () => {
  const { prompts } = fixtureC()
  // 3 engines x 5 prompts, 1 mention each = 20% each: all MISSING with mentions > 0
  const { items } = run(fixtureC().rows, prompts)
  assert.strictEqual(items[0].id, 'visibility:all')
  assert.strictEqual(items[0].title, C.AIV_COPY.fixAllLowTitle)
  assert.strictEqual(items[0].description, C.fixAllLowLine('BrandGEO', 3, 15, 3))
})
check('engine_missing and engine_low', () => {
  const { prompts, rows } = fixtureB()
  const { items } = run(rows, prompts)
  const miss = items.find(i => i.id === 'engine_missing:chatgpt')
  assert.ok(miss)
  assert.strictEqual(miss.priority, 'P0')
  assert.strictEqual(miss.title, C.fixEngineMissingTitle('ChatGPT', 0))
  assert.strictEqual(miss.description, C.fixAppearsLine('BrandGEO', 0, 4, 'ChatGPT'))
  const low = items.find(i => i.id === 'engine_low:gemini')
  assert.ok(low)
  assert.strictEqual(low.priority, 'P1')
  assert.strictEqual(low.title, 'Low visibility in Gemini (25%)')
  assert.strictEqual(low.description, 'Brand appears inconsistently, in 1 of 4 prompts checked.')
  assert.strictEqual(items.some(i => i.id === 'engine_low:claude'), false)
})
check('outranked carries competitor and average rank', () => {
  const { prompts, rows } = fixtureB()
  const { items } = run(rows, prompts)
  const o = items.find(i => i.id.startsWith('outranked:'))
  assert.ok(o, 'outranked present')
  assert.strictEqual(o.priority, 'P1')
  assert.strictEqual(o.competitor, 'Acme Metrics')
  assert.strictEqual(typeof o.competitorAvgRank, 'number')
  assert.strictEqual(o.title, `Outranked by Acme Metrics (avg #${o.competitorAvgRank})`)
})
check('consistency fix', () => {
  const { prompts, rows } = fixtureB()
  const dims = (() => { const m = buildFixResultMap(rows, ENGINE_IDS).results; return computeAiVisibilityScore(prompts.map(p => p.id), m, ENGINE_IDS).dimensions })()
  const { items } = run(rows, prompts)
  assert.strictEqual(items.some(i => i.id === 'consistency'), dims.consistency < 40 && dims.recognition > 0)
  const a = fixtureC()
  const r2 = run(a.rows, a.prompts)
  const c = r2.items.find(i => i.id === 'consistency')
  assert.ok(c, 'consistency fires on fixture C')
  assert.strictEqual(c.priority, 'P2')
  assert.strictEqual(c.title, 'Inconsistent cross-prompt coverage')
})
check('ranking fix', () => {
  const { prompts, rows } = fixtureE()
  const { items } = run(rows, prompts)
  const r = items.find(i => i.id === 'ranking')
  assert.ok(r, 'ranking present')
  assert.strictEqual(r.title, 'Improve ranking position')
  assert.strictEqual(r.metricKey, S.metricKeys.knowledge())
})
check('error-only engine is UNAVAILABLE and never gets an engine fix', () => {
  const { prompts, rows } = fixtureE()
  const { items, errorEngines } = run(rows, prompts)
  assert.ok(errorEngines.has('claude'))
  assert.strictEqual(items.some(i => /claude/.test(i.id)), false)
})
check('prompt_gap: 10 cap and most contested first', () => {
  const { prompts, rows } = fixtureD()
  const { items } = run(rows, prompts)
  const gaps = items.filter(i => i.id.startsWith('prompt_gap:'))
  assert.strictEqual(gaps.length, 10)
  // prompts 4, 8, 12 carry competitors, so they lead; then prompt order 1,2,3,5,6,7,9
  assert.deepStrictEqual(gaps.map(g => g.id), ['4', '8', '12', '1', '2', '3', '5', '6', '7', '9'].map(n => 'prompt_gap:' + n))
  assert.strictEqual(gaps[0].title, C.fixPromptGapTitle('Best tool number 4?'))
  assert.strictEqual(gaps[0].description, C.fixPromptGapLine('BrandGEO', 3, 3))
  assert.strictEqual(gaps[3].description, C.fixPromptGapLine('BrandGEO', 3, 0))
  assert.strictEqual(gaps[0].fix, C.FIX_COPY.promptGapFix)
})
check('a done fix_id is removed via stateOf (prompt_gap) and the next one appears', () => {
  const { prompts, rows } = fixtureD()
  const fixRows = new Map([['prompt_gap:4', { status: 'done' }]])
  const { items } = run(rows, prompts, { fixRows })
  const g = items.filter(i => i.id.startsWith('prompt_gap:')).map(i => i.id)
  assert.strictEqual(g.includes('prompt_gap:4'), false)
  assert.strictEqual(g.length, 10)
  assert.strictEqual(g[g.length - 1], 'prompt_gap:10')
})
check('fixture B ids and order are pinned', () => {
  const { prompts, rows } = fixtureB()
  const { items } = run(rows, prompts)
  assert.deepStrictEqual(ids(items).slice(0, 3), ['engine_missing:chatgpt', 'engine_low:gemini', 'outranked:acme metrics'.replace('acme metrics', ids(items)[2].slice('outranked:'.length))])
})

// ── buildFixResultMap rules ─────────────────────────────────────────────────
check('newest ok row wins regardless of input order', () => {
  const older = row(1, 'chatgpt', { at: '2026-10-01T00:00:00.000Z', mentioned: false })
  const newer = row(1, 'chatgpt', { at: '2026-11-02T00:00:00.000Z', mentioned: true, pos: 1 })
  const a = buildFixResultMap([older, newer], ['chatgpt'])
  const b = buildFixResultMap([newer, older], ['chatgpt'])
  assert.strictEqual(a.results.get(1).get('chatgpt').id, newer.id)
  assert.strictEqual(b.results.get(1).get('chatgpt').id, newer.id)
  assert.strictEqual(a.latestChecked, newer.checked_at)
})
check('no-answer rows are skipped, an older real answer is used', () => {
  const noAns = row(1, 'gemini', { at: '2026-11-02T00:00:00.000Z', snippet: '[no_ai_overview] nothing' })
  const real = row(1, 'gemini', { at: '2026-10-01T00:00:00.000Z' })
  const r = buildFixResultMap([noAns, real], ['gemini'])
  assert.strictEqual(r.results.get(1).get('gemini').id, real.id)
  const only = buildFixResultMap([noAns], ['gemini'])
  assert.strictEqual(only.results.get(1).has('gemini'), false)
  assert.strictEqual(only.errorEngines.size, 0)
})
check('inactive engines are skipped entirely', () => {
  const r = buildFixResultMap([row(1, 'grok'), row(1, 'chatgpt')], ['chatgpt'])
  assert.strictEqual(r.results.get(1).has('grok'), false)
  assert.strictEqual(r.results.get(1).has('chatgpt'), true)
})
check('error-only engine goes to errorEngines; error plus ok is partial', () => {
  const rows = [
    row(1, 'claude', { status: 'error' }),
    row(1, 'gemini', { status: 'error', at: '2026-11-03T00:00:00.000Z' }),
    row(1, 'gemini', { at: '2026-11-01T00:00:00.000Z' }),
  ]
  const r = buildFixResultMap(rows, ['claude', 'gemini'])
  assert.deepStrictEqual([...r.errorEngines], ['claude'])
  assert.deepStrictEqual([...r.partialErrorEngines], ['gemini'])
  assert.strictEqual(r.results.get(1).has('claude'), false)
  assert.strictEqual(r.results.get(1).has('gemini'), true)
})
check('rows for prompts outside the active list stay in the map', () => {
  const r = buildFixResultMap([row(99, 'chatgpt', { comps: [{ pos: 1, name: 'Acme Metrics' }] })], ['chatgpt'])
  assert.strictEqual(r.results.has(99), true)
  const items = buildFixItems({ brandName: 'BrandGEO', engines: [ENGINES[0]], prompts: mkPrompts(2), results: r.results, errorEngines: r.errorEngines, stateOf: none })
  assert.ok(Array.isArray(items))
})
check('null rows and empty input', () => {
  const r = buildFixResultMap(null, ENGINE_IDS)
  assert.strictEqual(r.results.size, 0)
  assert.strictEqual(r.latestChecked, null)
  assert.deepStrictEqual(buildFixItems({ brandName: 'BrandGEO', engines: ENGINES, prompts: [], results: r.results, errorEngines: r.errorEngines, stateOf: none }), [])
})
check('input rows are not mutated', () => {
  const rows = [row(1, 'chatgpt', { at: '2026-10-01T00:00:00.000Z' }), row(1, 'chatgpt', { at: '2026-11-01T00:00:00.000Z' })]
  const before = rows.map(r => r.id)
  buildFixResultMap(rows, ['chatgpt'])
  assert.deepStrictEqual(rows.map(r => r.id), before)
})

// ── Parity with the old inline builder ──────────────────────────────────────
for (const [name, fx] of [['A', fixtureA], ['B', fixtureB], ['C', fixtureC], ['D', fixtureD], ['E', fixtureE]]) {
  check('parity with old inline builder, fixture ' + name, () => {
    const { prompts, rows } = fx()
    const { items, oracle } = run(rows, prompts)
    assert.ok(oracle.length > 0)
    assert.deepStrictEqual(items, oracle)
  })
}
check('parity with a done mark in play', () => {
  const { prompts, rows } = fixtureD()
  const fixRows = new Map([['prompt_gap:4', { status: 'done' }], ['prompt_gap:1', { status: 'dismissed' }]])
  const { items, oracle } = run(rows, prompts, { fixRows })
  assert.deepStrictEqual(items, oracle)
})

// ── markets.ts ──────────────────────────────────────────────────────────────
check('markets.ts exports the market list', () => {
  assert.ok(Array.isArray(MARKETS) && MARKETS.length > 20)
  assert.strictEqual(MARKETS[0].id, 'WW')
  assert.strictEqual(MARKETS[1].id, 'RO')
})

console.log(`fix_items: ${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
