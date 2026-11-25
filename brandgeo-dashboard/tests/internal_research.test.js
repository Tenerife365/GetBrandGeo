/**
 * internal_research.test.js - the 'internal_research' plan source (ruling,
 * Constantin, 2026-11-25): BrandGEO's own city research workspaces are not
 * clients, carry no compensation, show as "Internal research", and are left
 * out of every client count, with their API cost reported as internal cost.
 *
 * Pins:
 *   1. the label and the one rule, in src/lib/planConfig.ts and its server
 *      mirror netlify/functions/_internal_research.js, which must agree;
 *   2. the census split: 37 internal research rows and 36 clients, before and
 *      after db/supabase-internal-research-plan-source-2026-11-25.sql runs;
 *   3. the revenue report puts their cost on its own line, not the pro plan,
 *      and the upgrade pipeline never lists them;
 *   4. set-client-plan.js refuses to overwrite the plan source while the row is
 *      still in the Research category, before it writes anything;
 *   5. the reports no longer test category 'research' on their own.
 *
 * Run: `node tests/internal_research.test.js` from brandgeo-dashboard/.
 * Fixture rows are synthetic; no real client is named.
 */
require('./helpers/ts_require')
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const FN = path.join(ROOT, 'netlify', 'functions')
const TS = require(path.join(ROOT, 'src', 'lib', 'planConfig.ts'))
const JS = require(path.join(FN, '_internal_research'))
const { aggregateRevenue, computeEngagementPipeline, periodForMonth } = require(path.join(FN, '_revenue'))
const { isInternalResearchLocked } = require(path.join(FN, 'set-client-plan'))

let passed = 0
let failed = 0
function check(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name) } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)) }
}
function code(file) {
  return fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

// The 37 ids of 2026-11-25 and a 36 row client book, all synthetic names.
const RESEARCH_IDS = [10, 11, 12, 13, 14, 15, 16, ...Array.from({ length: 20 }, (_, i) => 28 + i), ...Array.from({ length: 10 }, (_, i) => 58 + i)]
const CLIENT_IDS = Array.from({ length: 36 }, (_, i) => 200 + i)
const before = [
  ...RESEARCH_IDS.map((id) => ({ id, name: `Research: City ${id}`, plan: 'pro', category: 'research', plan_source: null })),
  ...CLIENT_IDS.map((id, i) => ({ id, name: `Client ${id}`, plan: i % 3 === 0 ? 'free' : 'essentials', category: i === 0 ? 'free' : 'active', plan_source: i % 2 ? 'manual' : null })),
]
const after = before.map((c) => (c.category === 'research' ? { ...c, plan_source: 'internal_research' } : c))

console.log('\n1. label and rule')

check('the plan source value and label are pinned', () => {
  assert.strictEqual(TS.INTERNAL_RESEARCH_PLAN_SOURCE, 'internal_research')
  assert.strictEqual(TS.INTERNAL_RESEARCH_LABEL, 'Internal research')
  assert.strictEqual(TS.PLAN_SOURCE_LABELS.internal_research, 'Internal research')
  assert.strictEqual(TS.planSourceLabel('internal_research'), 'Internal research')
  assert.strictEqual(TS.internalResearchLine(37), 'Internal research (37)')
})

check('the server mirror equals planConfig.ts', () => {
  assert.strictEqual(JS.INTERNAL_RESEARCH_PLAN_SOURCE, TS.INTERNAL_RESEARCH_PLAN_SOURCE)
  assert.strictEqual(JS.INTERNAL_RESEARCH_LABEL, TS.INTERNAL_RESEARCH_LABEL)
  assert.strictEqual(JS.RESEARCH_CATEGORY, TS.RESEARCH_CATEGORY)
  assert.strictEqual(JS.internalResearchLine(37), TS.internalResearchLine(37))
})

check('isInternalResearch agrees on both sides for every marker combination', () => {
  const cases = [
    [{ plan_source: 'internal_research', category: 'research' }, true],
    [{ plan_source: 'internal_research', category: 'active' }, true],
    [{ plan_source: null, category: 'research' }, true],
    [{ plan_source: 'manual', category: 'active' }, false],
    [{ plan_source: 'comp', category: 'active' }, false],
    [{ plan_source: 'trial', category: 'free' }, false],
    [{ plan_source: null, category: null }, false],
    [{}, false],
    [null, false],
    [undefined, false],
  ]
  for (const [c, want] of cases) {
    assert.strictEqual(TS.isInternalResearch(c), want, `ts ${JSON.stringify(c)}`)
    assert.strictEqual(JS.isInternalResearch(c), want, `js ${JSON.stringify(c)}`)
  }
})

console.log('\n2. census')

check('before the migration: 36 clients, internal research 37', () => {
  const s = JS.splitCensus(before)
  assert.strictEqual(s.clients, 36)
  assert.strictEqual(s.internal_research, 37)
  assert.strictEqual(TS.internalResearchLine(s.internal_research), 'Internal research (37)')
})

check('after the migration: the same split', () => {
  const s = JS.splitCensus(after)
  assert.deepStrictEqual([s.clients, s.internal_research], [36, 37])
})

check('internal research API cost is never counted as client cost', () => {
  const cost = {}
  for (const id of RESEARCH_IDS.slice(-11)) cost[id] = 1
  cost[CLIENT_IDS[0]] = 2.5
  const s = JS.splitCensus(after, cost)
  assert.strictEqual(s.internal_research_cost_eur, 11)
  assert.strictEqual(s.client_cost_eur, 2.5)
})

console.log('\n3. revenue report')

const PERIOD = periodForMonth('2026-11')
function revenueFor(clients) {
  return aggregateRevenue({ clients, costByClientId: { 10: 1.25, 200: 3 }, period: PERIOD })
}

check('research cost lands on the internal_research line, never on pro (both markers)', () => {
  for (const clients of [before, after, after.map((c) => (c.category === 'research' ? { ...c, category: 'active' } : c))]) {
    const r = revenueFor(clients)
    const plans = Object.fromEntries(r.byPlan.map((p) => [p.plan, p]))
    assert.strictEqual(plans.pro, undefined, 'no pro row')
    assert.strictEqual(plans.internal_research.estimatedApiCostEur, 1.25)
    const row = r.byClient.find((c) => c.clientId === 10)
    assert.strictEqual(row.plan, 'internal_research')
  }
})

check('the upgrade pipeline never lists an internal research row, even a free one', () => {
  const now = new Date('2026-11-25T12:00:00Z')
  const freeClients = [
    { id: 1, name: 'Free Client', plan: 'free', category: 'active', plan_source: null },
    { id: 2, name: 'Research: Free', plan: 'free', category: 'active', plan_source: 'internal_research' },
  ]
  const aiResultsRows = []
  for (const id of [1, 2]) for (const d of ['2026-11-03', '2026-11-10', '2026-11-17']) aiResultsRows.push({ client_id: id, checked_at: `${d}T10:00:00Z` })
  const p = computeEngagementPipeline({ freeClients, aiResultsRows, windowDays: 60, engagedWeeks: 3, now })
  const ids = p.clients.map((c) => c.clientId)
  assert.ok(ids.includes(1), 'the real free client is listed')
  assert.ok(!ids.includes(2), 'the internal research row is not')
})

console.log('\n4. set-client-plan guard')

check('locked only while plan source is internal_research AND category is research', () => {
  assert.strictEqual(isInternalResearchLocked({ plan_source: 'internal_research', category: 'research' }), true)
  assert.strictEqual(isInternalResearchLocked({ plan_source: 'internal_research', category: 'active' }), false)
  assert.strictEqual(isInternalResearchLocked({ plan_source: null, category: 'research' }), false)
  assert.strictEqual(isInternalResearchLocked({ plan_source: 'manual', category: 'active' }), false)
  assert.strictEqual(isInternalResearchLocked(null), false)
})

check('the guard answers 409 before the clients update is issued', () => {
  const src = code(path.join(FN, 'set-client-plan.js'))
  const guard = src.indexOf('if (isInternalResearchLocked(client))')
  const update = src.indexOf(".from('clients').update(")
  assert.ok(guard > 0 && update > 0 && guard < update, 'guard precedes the update')
  assert.ok(/statusCode: 409[\s\S]{0,300}internal_research_locked/.test(src.slice(guard, update)), '409 with code internal_research_locked')
})

console.log('\n5. no report tests the category alone')

check('platform-activity, revenue-report, _revenue and the Revenue page use the one rule', () => {
  const files = [
    path.join(FN, 'platform-activity.js'),
    path.join(FN, 'revenue-report.js'),
    path.join(FN, '_revenue.js'),
    path.join(ROOT, 'src', 'pages', 'Revenue.tsx'),
  ]
  for (const f of files) {
    const src = code(f)
    assert.ok(!/category\s*[!=]==\s*(RESEARCH_CATEGORY|'research')/.test(src), `${path.basename(f)} compares category to research`)
    assert.ok(/isInternalResearch\(/.test(src), `${path.basename(f)} uses isInternalResearch`)
  }
})

check('both platform-activity client reads select plan_source', () => {
  const src = code(path.join(FN, 'platform-activity.js'))
  const reads = src.match(/loadClients\(supabase, '[^']*'\)/g) || []
  assert.strictEqual(reads.length, 2)
  for (const r of reads) assert.ok(r.includes('plan_source'), r)
  assert.ok(/splitCensus\(clients,/.test(src), 'the summary census comes from splitCensus')
})

console.log(`\ninternal_research: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
