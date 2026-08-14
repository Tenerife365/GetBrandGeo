/**
 * audit_teaser_gate.test.js - guards the granularity split in
 * netlify/functions/get-audit-report.js. Run:
 *   node tests/audit_teaser_gate.test.js
 * (exits non-zero on failure).
 *
 * WHAT THIS PROTECTS
 *
 * The instant audit computes competitor names, per-engine presence, per-prompt
 * attribution and answer snippets, stores all four, and used to serve none of
 * them to a visitor until an email was entered. Measured 2026-08-14: 8 public
 * audits ever, 2 unlocked, both founder tests. Every one of the 8 scored 0 with
 * both screening engines `missing`, and every one carried 2 to 6 named
 * competitors that nobody ever saw.
 *
 * The fix moves the DIAGNOSIS in front of the gate and keeps the ATTRIBUTION
 * behind it. That line is easy to redraw by accident, in either direction, and
 * both directions are expensive:
 *
 *   - Too little in front: the visitor gets a bare 0 with no evidence, which
 *     reads as a broken tool. That is the state this test was written against.
 *   - Too much in front: the gate protects nothing and the only lead capture in
 *     the funnel stops working. Note that `top_gaps` is built as the first three
 *     `competitor_flags` re-keyed (_score.js:167-170), so a split by FIELD NAME
 *     silently ships a re-labelled copy of the free data. The split is by
 *     GRANULARITY, and the checks below assert the granularity directly rather
 *     than trusting a field name.
 *
 * FIXTURE PROVENANCE. The competitor_flags below are the real stored flags of
 * public audit id 61 (prejmer-raceway.com), read read-only from production
 * 2026-08-14:
 *   SELECT id, to_jsonb(competitor_flags) FROM prospect_audits WHERE id = 61;
 * One extra flag is appended to exercise case-insensitive dedup, modelled on
 * audit 59, which really does carry 4 flags with only 3 distinct names
 * ("Microsoft Power BI" named by both gemini and perplexity).
 */
const assert = require('assert')
const path = require('path')

const MOD = path.join(__dirname, '..', 'netlify', 'functions', 'get-audit-report.js')
const mod = require(MOD)

// Run with BG_LEGACY_TEASER=1 to point every check below at a replica of the
// PRE-CHANGE contract (get-audit-report.js:48-80 as it stood on 2026-08-14),
// rather than at the shipped code. That mode exists so "this test fails against
// the old behaviour" is a demonstrable claim about the payload's CONTENT and
// not merely about a missing export. It is never the default.
const LEGACY = process.env.BG_LEGACY_TEASER === '1'

const legacyBuild = (audit, opts) => {
  const gapCount = Array.isArray(audit.top_gaps) ? audit.top_gaps.length : 0
  if (!opts.canSeeFullReport) {
    return {
      status: 'ready', unlocked: false, domain: audit.domain, category: audit.category,
      ai_score: audit.ai_score, low_confidence: audit.low_confidence, gap_count: gapCount,
    }
  }
  return {
    status: 'ready', unlocked: true, domain: audit.domain, category: audit.category,
    ai_score: audit.ai_score, low_confidence: audit.low_confidence, depth: audit.depth,
    engines_used: audit.engines_used, dimensions: audit.dimensions,
    engine_states: audit.engine_states, engine_results: audit.engine_results,
    top_gaps: audit.top_gaps, competitor_flags: audit.competitor_flags,
  }
}

const buildReportPayload = LEGACY ? legacyBuild : mod.buildReportPayload
const distinctCompetitorNames = LEGACY ? (() => []) : mod.distinctCompetitorNames

let failures = 0
function check(name, fn) {
  try { fn(); console.log(`  ok  ${name}`) }
  catch (e) { failures++; console.log(`FAIL  ${name}\n      ${e.message}`) }
}

if (typeof buildReportPayload !== 'function' || typeof distinctCompetitorNames !== 'function') {
  console.log('FAIL  get-audit-report.js must export buildReportPayload and distinctCompetitorNames')
  console.log(`      exports found: ${JSON.stringify(Object.keys(mod))}`)
  console.log('\n1 check(s) FAILED.')
  process.exit(1)
}

// ── Fixture ────────────────────────────────────────────────────────────────
// Real flags of audit 61, in stored order, plus a 7th duplicating K1 Speed from
// the other engine in different case.
const FLAGS = [
  { engine: 'perplexity', prompt: 'best karting tracks in Romania',    competitor_name: 'Vmax Electric Indoor Karting' },
  { engine: 'gemini',     prompt: 'top go-karting experiences near me', competitor_name: 'Andretti Indoor Karting & Games' },
  { engine: 'perplexity', prompt: 'top go-karting experiences near me', competitor_name: 'Fast Lane Boise' },
  { engine: 'gemini',     prompt: 'family-friendly karting venues',     competitor_name: 'K1 Speed' },
  { engine: 'perplexity', prompt: 'family-friendly karting venues',     competitor_name: 'Crofton Go-Kart Raceway' },
  { engine: 'perplexity', prompt: 'karting raceway reviews and ratings', competitor_name: 'Bay Area Raceway' },
  { engine: 'gemini',     prompt: 'karting raceway reviews and ratings', competitor_name: '  k1 SPEED  ' },
]

// Exactly what _score.js:167-170 would produce from those flags: the first
// three, re-keyed. Reproduced by hand so this test fails if that shape drifts.
const TOP_GAPS = [
  { engine: 'perplexity', prompt: 'best karting tracks in Romania',     issue: 'competitor_named', competitor_named: 'Vmax Electric Indoor Karting' },
  { engine: 'gemini',     prompt: 'top go-karting experiences near me',  issue: 'competitor_named', competitor_named: 'Andretti Indoor Karting & Games' },
  { engine: 'perplexity', prompt: 'top go-karting experiences near me',  issue: 'competitor_named', competitor_named: 'Fast Lane Boise' },
]

const AUDIT = {
  id: 61,
  token: 'fixture_token',
  status: 'ready',
  unlocked: false,
  domain: 'prejmer-raceway.com',
  category: 'karting and motorsport venues',
  ai_score: 0,
  low_confidence: false,
  depth: 'screening',
  engines_used: ['gemini', 'perplexity'],
  dimensions: { recognition: 0, knowledge: 0, sentiment: 0, accuracy: 0, reach: 0, consistency: 0 },
  engine_states: { gemini: 'missing', perplexity: 'missing' },
  engine_results: [
    {
      prompt_id: 0, prompt: 'best karting tracks in Romania', engine: 'perplexity',
      brand_mentioned: false, brand_position: null, sentiment: 'neutral',
      competitors_mentioned: '[{"pos":1,"name":"Vmax Electric Indoor Karting"}]',
      snippet: 'For indoor karting in Romania the most frequently recommended venue is Vmax Electric Indoor Karting in Bucharest.',
    },
  ],
  top_gaps: TOP_GAPS,
  competitor_flags: FLAGS,
}

// Hand-calculated: 7 flags, first-seen order, case-insensitive dedup, trimmed.
// "  k1 SPEED  " collapses into the earlier "K1 Speed" and the FIRST spelling
// is the one kept, so the visitor never sees a mangled brand name.
const EXPECTED_NAMES = [
  'Vmax Electric Indoor Karting',
  'Andretti Indoor Karting & Games',
  'Fast Lane Boise',
  'K1 Speed',
  'Crofton Go-Kart Raceway',
  'Bay Area Raceway',
]

const locked = buildReportPayload(AUDIT, { canSeeFullReport: false })
const unlocked = buildReportPayload(AUDIT, { canSeeFullReport: true })
const lockedJson = JSON.stringify(locked)

// ── 1. The free view carries the diagnosis ─────────────────────────────────
console.log('pre-gate payload: what a visitor gets with no email')

check('is marked locked and keeps the fields it already had', () => {
  assert.strictEqual(locked.status, 'ready')
  assert.strictEqual(locked.unlocked, false)
  assert.strictEqual(locked.domain, 'prejmer-raceway.com')
  assert.strictEqual(locked.category, 'karting and motorsport venues')
  assert.strictEqual(locked.ai_score, 0)
  assert.strictEqual(locked.low_confidence, false)
  // gap_count is top_gaps.length, unchanged from before this change.
  assert.strictEqual(locked.gap_count, 3)
})

check('carries per-engine presence, verbatim', () => {
  assert.deepStrictEqual(locked.engine_states, { gemini: 'missing', perplexity: 'missing' })
})

check('carries the distinct competitor names, in first-seen order', () => {
  assert.deepStrictEqual(locked.competitor_names, EXPECTED_NAMES)
})

check('carries the distinct competitor count', () => {
  assert.strictEqual(locked.competitor_count, 6)
})

check('every competitor name is a bare string, never an object', () => {
  assert.ok(Array.isArray(locked.competitor_names), 'competitor_names must be an array')
  locked.competitor_names.forEach((n, i) => {
    assert.strictEqual(typeof n, 'string', `competitor_names[${i}] is ${typeof n}, not a string`)
  })
})

// ── 2. The free view does NOT carry the attribution ────────────────────────
console.log('pre-gate payload: what the email still buys')

check('no top_gaps, no competitor_flags, no dimensions, no engine_results', () => {
  for (const k of ['top_gaps', 'competitor_flags', 'dimensions', 'engine_results']) {
    assert.strictEqual(k in locked, false, `locked payload must not contain "${k}"`)
  }
})

check('no prompt text anywhere in the serialized body', () => {
  // The buyer question is the join key between a name and an engine. If it
  // leaks, the gate is decorative regardless of which field carried it.
  assert.strictEqual(/"prompt"\s*:/.test(lockedJson), false, 'a "prompt" key is present')
  for (const f of FLAGS) {
    assert.strictEqual(lockedJson.includes(f.prompt), false, `prompt text leaked: "${f.prompt}"`)
  }
})

check('no per-flag engine attribution in the serialized body', () => {
  // engine_states is keyed BY engine id, which is fine. A literal "engine" or
  // "competitor_name" key is the attribution shape and must not appear.
  assert.strictEqual(/"engine"\s*:/.test(lockedJson), false, 'an "engine" key is present')
  assert.strictEqual(/"competitor_name"\s*:/.test(lockedJson), false, 'a "competitor_name" key is present')
  assert.strictEqual(/"competitor_named"\s*:/.test(lockedJson), false, 'a "competitor_named" key is present')
})

check('no answer snippet in the serialized body', () => {
  assert.strictEqual(/"snippet"\s*:/.test(lockedJson), false, 'a "snippet" key is present')
  assert.strictEqual(
    lockedJson.includes('most frequently recommended venue'), false,
    'engine answer text leaked into the free view',
  )
})

check('the names alone cannot be re-joined to an engine', () => {
  // The whole ruling in one assertion: the free payload knows WHO was named and
  // WHICH engines answered, and nothing that pairs the two. A per-engine
  // competitor count would break this, because with two screening engines a
  // count plus a name list often reconstructs the pairing by arithmetic.
  const keys = Object.keys(locked).sort()
  assert.deepStrictEqual(keys, [
    'ai_score', 'category', 'competitor_count', 'competitor_names',
    'domain', 'engine_states', 'gap_count', 'low_confidence', 'status', 'unlocked',
  ], `unexpected key set in the free payload: ${keys.join(', ')}`)
})

// ── 3. The gated view is a strict superset ─────────────────────────────────
console.log('post-unlock payload: everything')

check('is marked unlocked and carries every gated field', () => {
  assert.strictEqual(unlocked.unlocked, true)
  for (const k of ['dimensions', 'engine_states', 'engine_results', 'top_gaps', 'competitor_flags', 'depth', 'engines_used']) {
    assert.ok(k in unlocked, `unlocked payload must contain "${k}"`)
  }
  assert.deepStrictEqual(unlocked.top_gaps, TOP_GAPS)
  assert.deepStrictEqual(unlocked.competitor_flags, FLAGS)
  assert.deepStrictEqual(unlocked.engine_results, AUDIT.engine_results)
})

check('carries the per-prompt attribution the free view withholds', () => {
  const json = JSON.stringify(unlocked)
  assert.ok(json.includes('family-friendly karting venues'), 'buyer question missing from the gated view')
  assert.ok(json.includes('most frequently recommended venue'), 'answer snippet missing from the gated view')
  assert.ok(/"competitor_name"\s*:/.test(json), 'per-flag competitor_name missing from the gated view')
})

check('is a superset: it also carries the free view fields', () => {
  // A visitor who unlocks must never LOSE something they could already see.
  assert.deepStrictEqual(unlocked.competitor_names, EXPECTED_NAMES)
  assert.strictEqual(unlocked.competitor_count, 6)
  assert.deepStrictEqual(unlocked.engine_states, AUDIT.engine_states)
  assert.strictEqual(unlocked.ai_score, 0)
})

// ── 4. Derivation edge cases ───────────────────────────────────────────────
console.log('distinctCompetitorNames')

check('null, undefined and non-array all give an empty list', () => {
  assert.deepStrictEqual(distinctCompetitorNames(null), [])
  assert.deepStrictEqual(distinctCompetitorNames(undefined), [])
  assert.deepStrictEqual(distinctCompetitorNames('Brandwatch'), [])
  assert.deepStrictEqual(distinctCompetitorNames({}), [])
})

check('flags with a missing or blank name are dropped, not rendered empty', () => {
  assert.deepStrictEqual(
    distinctCompetitorNames([
      { engine: 'gemini', prompt: 'p', competitor_name: 'Brandwatch' },
      { engine: 'gemini', prompt: 'p' },
      { engine: 'gemini', prompt: 'p', competitor_name: '   ' },
      { engine: 'gemini', prompt: 'p', competitor_name: null },
      null,
      { engine: 'gemini', prompt: 'p', competitor_name: 42 },
    ]),
    ['Brandwatch'],
  )
})

check('an audit with no flags yields an empty list and a zero count', () => {
  const bare = buildReportPayload({ ...AUDIT, competitor_flags: null, top_gaps: null }, { canSeeFullReport: false })
  assert.deepStrictEqual(bare.competitor_names, [])
  assert.strictEqual(bare.competitor_count, 0)
  assert.strictEqual(bare.gap_count, 0)
})

check('the list is capped, and the count still reports the truth', () => {
  // Screening depth can produce at most 4 prompts x 2 engines = 8 flags, so the
  // cap never bites on a public audit. It exists so a FULL-depth row (6 x 5)
  // cannot make the teaser payload grow without bound.
  const many = Array.from({ length: 14 }, (_, i) => ({ engine: 'gemini', prompt: `p${i}`, competitor_name: `Brand ${i}` }))
  const capped = buildReportPayload({ ...AUDIT, competitor_flags: many }, { canSeeFullReport: false })
  assert.strictEqual(capped.competitor_names.length, 8, 'the free list must be capped at 8')
  assert.strictEqual(capped.competitor_count, 14, 'the count must report every distinct name, not the capped slice')
  assert.strictEqual(capped.competitor_names[0], 'Brand 0')
})

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
