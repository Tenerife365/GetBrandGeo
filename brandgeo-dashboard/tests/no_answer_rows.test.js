/**
 * no_answer_rows.test.js — guards the `[no_ai_overview]` exclusion in
 * src/lib/aiVisibilityScore.ts. Run: `node tests/no_answer_rows.test.js`
 * (exits non-zero on failure).
 *
 * What this protects, and why it is worth a test rather than a code comment:
 *
 * Google renders an AI Overview for some queries and not others. When it
 * renders none there is no answer for a brand to appear in, but the row is not
 * an error either — the collector succeeded. So the row lands with status 'ok'
 * and brand_mentioned false, indistinguishable from a genuine "we looked and
 * you were not there" unless something checks the marker.
 *
 * Measured in production 2026-07-31, client BpR: 3 of 6 `ai_overview` rows were
 * `[no_ai_overview]`. The dashboard reported 33%. The rate over answerable
 * queries was 67%. The client was shown exactly half their real number.
 *
 * The exclusion originally existed inline in AIVisibility.tsx and nowhere else,
 * so that page said 67% while the Overview headline score said 33% for the same
 * client at the same moment. The fixtures below cover both the predicate and
 * the map builder, because the bug was never in the logic — it was in the logic
 * existing in only one of the two places that needed it.
 *
 * Same in-process transpile trick as competitor_aggregate.test.js: no test
 * runner exists in this repo.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const Module = require('module')

const SRC = path.join(__dirname, '..', 'src', 'lib', 'aiVisibilityScore.ts')
const js = ts.transpileModule(fs.readFileSync(SRC, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const mod = new Module(SRC)
mod._compile(js, SRC)
const { isNoAnswerRow, buildScoreResultMap } = mod.exports

let failures = 0
function check(name, fn) {
  try { fn(); console.log(`  ok  ${name}`) }
  catch (e) { failures++; console.log(`FAIL  ${name}\n      ${e.message}`) }
}

// The exact string _collect.js writes (netlify/functions/_collect.js,
// AI_OVERVIEW_NOT_SHOWN). If this constant ever changes there, this test must
// fail — that coupling is deliberate.
const NOT_SHOWN =
  '[no_ai_overview] No AI Overview block was rendered for this query in this location.'

console.log('isNoAnswerRow')

check('the real collector string is a no-answer row', () => {
  assert.strictEqual(isNoAnswerRow({ response_snippet: NOT_SHOWN }), true)
})

check('a genuine absence is NOT a no-answer row', () => {
  // Brand truly absent from a real AI Overview. Must still count against them.
  assert.strictEqual(
    isNoAnswerRow({ response_snippet: 'The best caterers in Bucharest include ...' }),
    false,
  )
})

check('null and undefined snippets are not no-answer rows', () => {
  assert.strictEqual(isNoAnswerRow({ response_snippet: null }), false)
  assert.strictEqual(isNoAnswerRow({}), false)
})

check('the marker must be at the START, not merely present', () => {
  // An engine quoting the phrase mid-answer must not be silently dropped from
  // scoring — that would hide a real miss.
  assert.strictEqual(
    isNoAnswerRow({ response_snippet: `Some answer mentioning ${NOT_SHOWN}` }),
    false,
  )
})

console.log('buildScoreResultMap')

// Reproduces the measured production shape: 6 rows over 3 prompts x 2 engines,
// 3 of them no-answer, 2 real mentions.
const rows = [
  { prompt_id: 1, llm: 'ai_overview', brand_mentioned: true,  brand_position: 1,    sentiment: 'positive', status: 'ok', checked_at: '2026-07-30T10:00:00Z', response_snippet: 'BpR is a top choice ...' },
  { prompt_id: 2, llm: 'ai_overview', brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: '2026-07-30T10:00:00Z', response_snippet: NOT_SHOWN },
  { prompt_id: 3, llm: 'ai_overview', brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: '2026-07-30T10:00:00Z', response_snippet: NOT_SHOWN },
  { prompt_id: 1, llm: 'chatgpt',     brand_mentioned: true,  brand_position: 2,    sentiment: 'positive', status: 'ok', checked_at: '2026-07-30T10:00:00Z', response_snippet: 'Options include BpR ...' },
  { prompt_id: 2, llm: 'chatgpt',     brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: '2026-07-30T10:00:00Z', response_snippet: 'Try these caterers ...' },
  { prompt_id: 3, llm: 'chatgpt',     brand_mentioned: false, brand_position: null, sentiment: null,       status: 'ok', checked_at: '2026-07-30T10:00:00Z', response_snippet: NOT_SHOWN },
]

check('no-answer rows never reach the score map', () => {
  const map = buildScoreResultMap(rows, ['ai_overview', 'chatgpt'])
  // Prompt 2 keeps an entry: its chatgpt row is a real result, only the
  // ai_overview one is dropped.
  assert.strictEqual(map.get(2)?.has('ai_overview') ?? false, false, 'prompt 2 ai_overview should be absent')
  // Prompt 3 has NO entry at all, because every engine returned no answer. That
  // is deliberate: a prompt nobody could answer must not appear in the score in
  // any form, not even as an empty row. Hence `?? false` rather than asserting
  // on `.has()` directly, which would be reading a property of undefined.
  assert.strictEqual(map.has(3), false, 'prompt 3 should not be in the map at all')
  assert.strictEqual(map.get(3)?.has('chatgpt') ?? false, false, 'prompt 3 chatgpt should be absent')
})

check('real results still reach the score map', () => {
  const map = buildScoreResultMap(rows, ['ai_overview', 'chatgpt'])
  assert.strictEqual(map.get(1)?.get('ai_overview')?.brand_mentioned, true)
  assert.strictEqual(map.get(1)?.get('chatgpt')?.brand_mentioned, true)
  // A genuine absence must survive — dropping it would inflate the score.
  assert.strictEqual(map.get(2)?.get('chatgpt')?.brand_mentioned, false)
})

check('the measured 33-vs-67 discrepancy is gone', () => {
  const map = buildScoreResultMap(rows, ['ai_overview'])
  let total = 0, mentioned = 0
  for (const llmMap of map.values()) {
    for (const r of llmMap.values()) { total++; if (r.brand_mentioned) mentioned++ }
  }
  assert.strictEqual(total, 1, `expected 1 answerable ai_overview row, got ${total}`)
  assert.strictEqual(Math.round((mentioned / total) * 100), 100)
})

check('error rows are still excluded, unchanged', () => {
  const map = buildScoreResultMap(
    [{ prompt_id: 9, llm: 'chatgpt', brand_mentioned: false, brand_position: null, sentiment: null, status: 'error', checked_at: '2026-07-30T10:00:00Z', response_snippet: null }],
    ['chatgpt'],
  )
  assert.strictEqual(map.get(9)?.has('chatgpt') ?? false, false)
})

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
