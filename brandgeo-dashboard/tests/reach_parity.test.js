/**
 * reach_parity.test.js guards `reach` (one of the six AI Visibility Score
 * dimensions) staying identical between the two places it is computed:
 * netlify/functions/_score.js (the public Instant Audit path) and
 * src/lib/aiVisibilityScore.ts (the paying-customer dashboard path). Run:
 * `node tests/reach_parity.test.js` (exits non-zero on failure).
 *
 * WHY THIS EXISTS (docs/qa/audit-scoring-investigation-2026-08-14.md F1).
 * Issue #109 fixed reach so an engine WE failed to reach (quota, timeout, API
 * error, zero rows for every prompt) drops out of the reach denominator
 * along with the numerator, instead of silently counting as "the brand isn't
 * there". That fix landed in _score.js only. aiVisibilityScore.ts kept
 * dividing by every engine the client's plan requests, active or not, so a
 * PAYING client whose collection run hit a failed engine saw a lower reach
 * than the truth, caused by our error, not theirs. _score.js's header
 * comment claims the two files are "byte-for-byte the same formula"; they
 * were not, on this one dimension, until this fix.
 *
 * This file builds ONE fixture (3 prompts x 3 engines, one engine, perplexity,
 * with zero rows for any prompt, i.e. an engine we never heard from) and
 * feeds it through both files' scoring functions, then asserts every
 * dimension, reach included, comes out identical.
 *
 * Same in-process TS transpile technique as tests/no_answer_rows.test.js: no
 * test runner exists in this repo, and aiVisibilityScore.ts cannot be
 * `require()`d directly since it is TypeScript.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const Module = require('module')

const FN_DIR = process.env.BG_FN_DIR
  ? path.resolve(process.env.BG_FN_DIR)
  : path.join(__dirname, '..', 'netlify', 'functions')
const TS_SRC = process.env.BG_TS_SRC
  ? path.resolve(process.env.BG_TS_SRC)
  : path.join(__dirname, '..', 'src', 'lib', 'aiVisibilityScore.ts')

const { computeAuditScore, buildResultMap } = require(path.join(FN_DIR, '_score'))

const js = ts.transpileModule(fs.readFileSync(TS_SRC, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const mod = new Module(TS_SRC)
mod._compile(js, TS_SRC)
const { computeAiVisibilityScore, buildScoreResultMap } = mod.exports

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }

// ── One fixture, fed through both paths ──────────────────────────────────────
// 3 prompts x 3 requested engines (chatgpt, gemini, perplexity). chatgpt and
// gemini each answered every prompt (mixed mentions). perplexity answered
// NOTHING, no rows at all for any prompt, standing in for an engine that
// failed outright (quota/timeout/API error), which is the exact case #109
// exists for: our own failure must never read as "the brand wasn't there".
const CHECKED_AT = '2026-08-14T21:00:00Z'
const FIXTURE_ROWS = [
  { prompt_id: 1, engine: 'chatgpt', llm: 'chatgpt', brand_mentioned: true,  brand_position: 1,    sentiment: 'positive', status: 'ok', checked_at: CHECKED_AT, competitors_mentioned: null },
  { prompt_id: 1, engine: 'gemini',  llm: 'gemini',  brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: CHECKED_AT, competitors_mentioned: null },
  { prompt_id: 2, engine: 'chatgpt', llm: 'chatgpt', brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: CHECKED_AT, competitors_mentioned: null },
  { prompt_id: 2, engine: 'gemini',  llm: 'gemini',  brand_mentioned: true,  brand_position: 2,    sentiment: 'neutral',  status: 'ok', checked_at: CHECKED_AT, competitors_mentioned: null },
  { prompt_id: 3, engine: 'chatgpt', llm: 'chatgpt', brand_mentioned: true,  brand_position: 1,    sentiment: 'positive', status: 'ok', checked_at: CHECKED_AT, competitors_mentioned: null },
  { prompt_id: 3, engine: 'gemini',  llm: 'gemini',  brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: CHECKED_AT, competitors_mentioned: null },
  // perplexity: deliberately ZERO rows for any prompt.
]
const PROMPT_IDS = [1, 2, 3]
const ACTIVE_ENGINES = ['chatgpt', 'gemini', 'perplexity']

function runAuditPath() {
  const resultMap = buildResultMap(FIXTURE_ROWS)
  return computeAuditScore(PROMPT_IDS, resultMap, ACTIVE_ENGINES)
}

function runDashboardPath() {
  const resultMap = buildScoreResultMap(FIXTURE_ROWS, ACTIVE_ENGINES)
  return computeAiVisibilityScore(PROMPT_IDS, resultMap, ACTIVE_ENGINES)
}

async function main() {
  console.log('\n1. reach agrees between _score.js and aiVisibilityScore.ts on an identical fixture')
  {
    const audit = runAuditPath()
    const dashboard = runDashboardPath()

    console.log(`     audit path (_score.js):        reach=${audit.dimensions.reach}`)
    console.log(`     dashboard path (aiVisibilityScore.ts): reach=${dashboard.dimensions.reach}`)

    // Hand-calculated expectation: perplexity produced zero rows for every
    // prompt, so it must drop out of the denominator entirely. Engines heard
    // from = [chatgpt, gemini], both of which mention the brand at least once.
    // reach = round(2/2 * 100) = 100. If perplexity were still counted in the
    // denominator (the pre-fix aiVisibilityScore.ts behaviour), reach would
    // instead read round(2/3 * 100) = 67, deflated by an engine we simply
    // never heard from, exactly the #109 defect.
    assert.strictEqual(audit.dimensions.reach, 100, 'sanity: _score.js already had the #109 fix')
    ok('_score.js reach = 100 (perplexity excluded from the denominator, as #109 intended)')

    assert.strictEqual(dashboard.dimensions.reach, 100,
      'aiVisibilityScore.ts must also exclude the unreached engine from the denominator, matching _score.js')
    ok('aiVisibilityScore.ts reach = 100 (now excludes the unreached engine, matching _score.js)')

    assert.strictEqual(dashboard.dimensions.reach, audit.dimensions.reach,
      'THE ASSERTION THIS FILE EXISTS FOR: reach must be identical between the two paths on the same fixture')
    ok('reach is identical between the audit path and the dashboard path')
  }

  console.log('\n2. every OTHER dimension already agreed and must still agree (no collateral change)')
  {
    const audit = runAuditPath()
    const dashboard = runDashboardPath()
    for (const dim of ['recognition', 'knowledge', 'sentiment', 'accuracy', 'consistency']) {
      assert.strictEqual(dashboard.dimensions[dim], audit.dimensions[dim],
        `${dim} must still agree between the two paths (the fix was scoped to reach only)`)
    }
    ok('recognition, knowledge, sentiment, accuracy, consistency all still agree')

    assert.strictEqual(dashboard.aiScore, audit.aiScore, 'the composite aiScore must agree once every dimension does')
    ok(`composite aiScore agrees: audit=${audit.aiScore} dashboard=${dashboard.aiScore}`)
  }

  console.log(`\nPASS: ${passed} assertions\n`)
}

main().catch((e) => {
  console.error(`\nFAIL: ${e.message}`)
  if (process.env.BG_TEST_STACK) console.error(e.stack)
  process.exit(1)
})
