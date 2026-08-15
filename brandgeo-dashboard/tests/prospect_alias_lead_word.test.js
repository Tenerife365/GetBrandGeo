/**
 * prospect_alias_lead_word.test.js guards the line between "a lead-word alias
 * identifies the brand" and "a lead-word alias matches an ordinary English
 * word". Run: `node tests/prospect_alias_lead_word.test.js`
 * (exits non-zero on failure).
 *
 * WHY THIS EXISTS. buildProspectAliases() in _prospect_prompts.js emits the
 * lead word of a multi-word brand name as a standalone alias entry, and
 * buildAliasRegex() (_analysis.js:397) compiles every alias into a
 * boundary-anchored whole-word matcher. So when the lead word is a common
 * word, the alias matches that word anywhere in an engine response, whether
 * or not the brand was ever named.
 *
 * MEASURED AGAINST PRODUCTION, 2026-08-15. All 165 stored engine results that
 * currently carry brand_mentioned = true were replayed with the alias set built
 * before and after this guard:
 *
 *   false positives removed ......... 12  (casetempo.com 6, unittrac.com 6)
 *   true mentions broken ............  0
 *
 * casetempo.com sells legal practice software and unittrac.com sells
 * self-storage software, so "case" and "unit" appear in essentially every
 * relevant answer. Neither brand is named anywhere in the twelve.
 *
 * This CORRECTS finding T2 in docs/qa/scoring-fixes-review-2026-08-14.md on two
 * points, and both corrections are load bearing:
 *   - T2 listed financial-cents.com as a false positive. Its stored results say
 *     otherwise: all three mentions name "Financial Cents" in full. They are
 *     true, and they survive this guard.
 *   - T2 never found unittrac.com, because it has no og:site_name and so was
 *     absent from the 38 values T2 sampled. Its name is LLM-derived. It carried
 *     twice as many false positives as the case T2 did find.
 *
 * This is the same credibility failure as the false ZEROS that
 * docs/qa/audit-scoring-investigation-2026-08-14.md documents, in the opposite
 * direction, and it is harder to catch: a prospect who is shown a score that
 * flatters them does not write in to complain, so it never self-corrects.
 * casetempo.com's public audit currently reads ai_score 68 on six mentions that
 * are all this artifact.
 *
 * THE OPPOSITE RISK IS TESTED JUST AS HARD. An over-aggressive guard would
 * re-open the false zeros the 2026-07-16 brand-name work closed, so section 2
 * pins the lead words that MUST still survive (CARET, Rebuy, Jetpack, Kickflip)
 * using the same real domains that fix is named for, and section 4 proves the
 * surviving aliases still score a true mention that the full-name alias alone
 * would miss.
 *
 * Ten properties, one per assertion group:
 *   1. the three affected production names emit no generic lead alias
 *   2. distinctive lead words are still emitted (no new false zeros)
 *   3. through the REAL matcher, a competitor-only response no longer counts
 *      as a mention, on verbatim stored snippets
 *   4. through the REAL matcher, a response naming only the distinctive lead
 *      word still counts as a mention (this is the whole point of the alias)
 *   5. blocking a lead word never removes the full-name alias: the brand named
 *      in full is still matched
 *   6. blocking a lead word never removes the domain-root alias
 *   7. isDistinctiveLeadWord(), table driven, on the exact strings above
 *   8. single-word brand names are unaffected in either direction
 *   9. numeric and single-character lead tokens are refused
 *  10. the guard is case insensitive, so "CASE Tempo" is blocked like
 *      "Case Tempo"
 *
 * Runs entirely offline: no network, no OpenAI spend, no database read or
 * write, no audit call. buildProspectAliases() and analyseResponse() are both
 * pure functions over their arguments.
 *
 * MODULE UNDER TEST is resolvable via BG_FN_DIR so this file can be pointed at
 * a pre-fix copy of netlify/functions to demonstrate that it fails there.
 * Default is the real directory. To reproduce the pre-fix failure:
 *
 *   mkdir -p /tmp/prefix-fns && git show HEAD:brandgeo-dashboard/netlify/functions/_prospect_prompts.js > /tmp/prefix-fns/_prospect_prompts.js
 *   cp brandgeo-dashboard/netlify/functions/_analysis.js /tmp/prefix-fns/
 *   BG_FN_DIR=/tmp/prefix-fns node brandgeo-dashboard/tests/prospect_alias_lead_word.test.js
 */
const assert = require('assert')
const path = require('path')

const FN_DIR = process.env.BG_FN_DIR
  ? path.resolve(process.env.BG_FN_DIR)
  : path.join(__dirname, '..', 'netlify', 'functions')

const prospectPrompts = require(path.join(FN_DIR, '_prospect_prompts'))
const { buildProspectAliases } = prospectPrompts
const { analyseResponse } = require(path.join(FN_DIR, '_analysis'))

// Pre-fix the guard does not exist as its own export. Fall back to a shim that
// reports the pre-fix answer (everything at least 2 chars that is not one of
// the eight old prefix stopwords was distinctive), so section 7 still runs and
// still fails there rather than erroring out with "not a function".
const OLD_LEADING_WORD_STOPWORDS = new Set(['the', 'get', 'my', 'your', 'a', 'an', 'go', 'try'])
const isDistinctiveLeadWord = prospectPrompts.isDistinctiveLeadWord
  || (w => String(w || '').length >= 2 && !OLD_LEADING_WORD_STOPWORDS.has(String(w || '').toLowerCase()))

let passed = 0
function ok(msg) { passed++; console.log(`  ok  ${msg}`) }
function section(n, title) { console.log(`\n${n}. ${title}`) }

// analyseResponse is called by audit-domain.js:226 with exactly this cfg shape.
function auditCfg(domain, aliases) {
  return { brand_aliases: aliases, brand_website: domain, known_competitors: [] }
}
function mentioned(text, domain, aliases) {
  return analyseResponse(text, auditCfg(domain, aliases)).brand_mentioned
}

// ── The reproduced production cases ─────────────────────────────────────────
// og:site_name values are the real ones read off the live homepages, not
// invented strings.
const CASE_TEMPO = { domain: 'casetempo.com', brandName: 'Case Tempo', lead: 'Case' }
// unittrac.com was NOT in T2. It was found on 2026-08-15 by replaying all 165
// stored mentions. It has no og:site_name, so its name is LLM-derived, and
// "Unit Trac" is not a guess: it is the only alias shape that reproduces all 7
// of its stored matches (a one-word "UnitTrac" reproduces 0 of 7). Six of those
// seven never name the brand and matched the bare word "unit" in "per unit per
// month" and "unit availability", on a self-storage category where that word is
// unavoidable. The seventh genuinely names it and survives via the full name.
const UNIT_TRAC = { domain: 'unittrac.com', brandName: 'Unit Trac', lead: 'Unit' }

// T2 listed this one as a false positive too. The stored engine_results say
// otherwise: all three of its mentions name "Financial Cents" in full, so they
// are TRUE and they survive. It is kept here as a regression fixture for the
// opposite direction, and its lead word is still blocked because "financial"
// carries no evidence on its own.
const FINANCIAL_CENTS = { domain: 'financial-cents.com', brandName: 'Financial Cents', lead: 'Financial' }

// Competitor-only responses, in the shape the audit actually stores: the brand
// is named nowhere, but the generic lead word appears in ordinary prose. The
// competitors are the ones T2 records for each domain.
// Verbatim from prospect_audits row 70, engine perplexity, one of the six
// stored casetempo.com results that counted as a mention and should not have.
// Truncated at a sentence boundary only.
const CASE_TEMPO_COMPETITOR_ONLY =
  'If you want the **top case management tools for lawyers**, the strongest names '
  + 'that show up consistently are **Clio, MyCase, PracticePanther, Filevine, '
  + 'Smokeball, CosmoLex, and LEAP**.[1][4][5][7][9]'

// Verbatim from prospect_audits row 95, engine gemini, one of the six stored
// unittrac.com results that counted as a mention and should not have.
const UNIT_TRAC_COMPETITOR_ONLY =
  'competitive pricing, starting around 75 cents per unit per month. It helps '
  + 'automate processes and takes manual work off your plate. *   **Yardi Breeze:** '
  + 'While part of a larger suite, it gives insights into occupancy rates, payment '
  + 'statuses, unit availability, and tenant information.'

const FINANCIAL_CENTS_COMPETITOR_ONLY = [
  'The strongest practice management tools for accounting firms are Karbon,',
  'Canopy and Jetpack Workflow. Karbon is built around email and workflow,',
  'Canopy adds client portals and document management, and Jetpack Workflow',
  'is the lightest to adopt. Each one reports on financial performance per job.',
].join(' ')

// ── Distinctive lead words that MUST survive ─────────────────────────────────
// Three of the five domains the 2026-07-16 brand-name fix is named for, plus
// caretlegal.com, which T2 records as already behaving correctly today. If the
// guard ever swallows these, it has reintroduced the false zeros that fix
// closed, which is the failure mode this file exists to prevent in both
// directions.
const DISTINCTIVE = [
  { domain: 'caretlegal.com', brandName: 'CARET Legal', lead: 'CARET' },
  { domain: 'rebuyengine.com', brandName: 'Rebuy Engine', lead: 'Rebuy' },
  { domain: 'jetpackworkflow.com', brandName: 'Jetpack Workflow', lead: 'Jetpack' },
  { domain: 'gokickflip.com', brandName: 'Kickflip Studio', lead: 'Kickflip' },
]

function main() {
  console.log('\nprospect_alias_lead_word.test.js')
  console.log(`module under test: ${FN_DIR}`)

  // ───────────────────────────────────────────────────────────────────────────
  section(1, 'the three affected production names emit no generic lead alias')
  // THE ASSERTION T2 EXISTS FOR. Pre-fix, aliases are
  // ["casetempo", "Case Tempo", "Case"] and ["financial-cents", "Financial Cents", "Financial"].
  for (const c of [CASE_TEMPO, UNIT_TRAC, FINANCIAL_CENTS]) {
    const aliases = buildProspectAliases(c.domain, c.brandName)
    assert.ok(
      !aliases.some(a => a.toLowerCase() === c.lead.toLowerCase()),
      `${c.domain}: "${c.lead}" must not be emitted as a standalone alias `
      + `(got ${JSON.stringify(aliases)})`,
    )
    ok(`${c.domain} -> ${JSON.stringify(aliases)}, no bare "${c.lead}"`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(2, 'distinctive lead words are still emitted (no new false zeros)')
  for (const d of DISTINCTIVE) {
    const aliases = buildProspectAliases(d.domain, d.brandName)
    assert.ok(
      aliases.some(a => a.toLowerCase() === d.lead.toLowerCase()),
      `${d.domain}: "${d.lead}" is a coined, distinguishing token and MUST still `
      + `be emitted (got ${JSON.stringify(aliases)})`,
    )
    ok(`${d.domain} -> ${JSON.stringify(aliases)}, keeps "${d.lead}"`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(3, 'through the real matcher: a competitor-only response is no longer a mention')
  // This is the assertion that carries the score consequence. Sections 1 and 2
  // check the alias list; this checks what analyseResponse() actually decides,
  // which is what writes brand_mentioned and therefore every one of the six
  // dimensions in _score.js.
  {
    const caseAliases = buildProspectAliases(CASE_TEMPO.domain, CASE_TEMPO.brandName)
    assert.strictEqual(
      mentioned(CASE_TEMPO_COMPETITOR_ONLY, CASE_TEMPO.domain, caseAliases), false,
      'casetempo.com: a response naming only Clio, MyCase, PracticePanther, '
      + 'Filevine, Smokeball, CosmoLex and LEAP must NOT count as a mention. '
      + '"case management tools" is not evidence that Case Tempo was named.',
    )
    ok('casetempo.com: competitor-only response scores brand_mentioned = false')

    const centsAliases = buildProspectAliases(FINANCIAL_CENTS.domain, FINANCIAL_CENTS.brandName)
    assert.strictEqual(
      mentioned(FINANCIAL_CENTS_COMPETITOR_ONLY, FINANCIAL_CENTS.domain, centsAliases), false,
      'financial-cents.com: a response naming only Karbon, Canopy and Jetpack '
      + 'Workflow must NOT count as a mention. "financial performance" is not '
      + 'evidence that Financial Cents was named.',
    )
    ok('financial-cents.com: competitor-only response scores brand_mentioned = false')

    // The case T2 missed, and the one that makes the guard worth more than the
    // 5.3% headline: 6 of unittrac.com's 7 stored mentions were this shape.
    const unitAliases = buildProspectAliases(UNIT_TRAC.domain, UNIT_TRAC.brandName)
    assert.strictEqual(
      mentioned(UNIT_TRAC_COMPETITOR_ONLY, UNIT_TRAC.domain, unitAliases), false,
      'unittrac.com: a response naming only Yardi Breeze must NOT count as a '
      + 'mention. "per unit per month" and "unit availability" are not evidence '
      + 'that Unit Trac was named.',
    )
    ok('unittrac.com: real stored competitor-only response scores brand_mentioned = false')
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(4, 'through the real matcher: a lead-word-only mention still counts')
  // The negative control for section 3. buildAliasRegex() compiles the
  // full-name alias "Rebuy Engine" into a matcher requiring both words
  // adjacent, so a response that says only "Rebuy" is matched by the lead-word
  // alias and by nothing else. If the guard ever removed it, this true mention
  // would become a false zero, which is exactly the direction that already cost
  // two prospective customers.
  {
    const aliases = buildProspectAliases('rebuyengine.com', 'Rebuy Engine')
    const leadOnly = 'For Shopify upsells most stores land on Rebuy, which handles '
      + 'post-purchase offers and smart cart recommendations.'
    assert.ok(
      !/rebuy[\s_.-]*engine/i.test(leadOnly),
      'fixture guard: this text must NOT contain the full name, or it would pass '
      + 'via the full-name alias and prove nothing about the lead-word alias',
    )
    assert.strictEqual(
      mentioned(leadOnly, 'rebuyengine.com', aliases), true,
      'rebuyengine.com: a response naming the brand as just "Rebuy" must still count',
    )
    ok('rebuyengine.com: lead-word-only response still scores brand_mentioned = true')
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(5, 'blocking a lead word never removes the full-name alias')
  // The bound on the fix's cost. Whatever the guard rejects, the full name is
  // still emitted unconditionally, so a genuine mention that names the brand
  // properly is untouched.
  for (const c of [CASE_TEMPO, UNIT_TRAC, FINANCIAL_CENTS]) {
    const aliases = buildProspectAliases(c.domain, c.brandName)
    assert.ok(
      aliases.some(a => a.toLowerCase() === c.brandName.toLowerCase()),
      `${c.domain}: the full name "${c.brandName}" must always be an alias`,
    )
    const named = `A smaller alternative worth a look is ${c.brandName}, which covers the same ground.`
    assert.strictEqual(
      mentioned(named, c.domain, aliases), true,
      `${c.domain}: a response naming "${c.brandName}" in full must still count as a mention`,
    )
    ok(`${c.domain}: "${c.brandName}" named in full still scores brand_mentioned = true`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(6, 'blocking a lead word never removes the domain-root alias')
  for (const c of [CASE_TEMPO, UNIT_TRAC, FINANCIAL_CENTS]) {
    const aliases = buildProspectAliases(c.domain, c.brandName)
    const root = c.domain.split('.')[0]
    assert.ok(
      aliases.some(a => a.toLowerCase() === root.toLowerCase()),
      `${c.domain}: the domain root "${root}" must always be an alias`,
    )
    ok(`${c.domain}: domain root "${root}" still present`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(7, 'isDistinctiveLeadWord(), table driven')
  const TABLE = [
    // [word, expected, why]
    ['Case', false, 'ordinary noun, saturates legal software answers (casetempo.com)'],
    ['Financial', false, 'ordinary adjective, saturates accounting answers (financial-cents.com)'],
    ['Unit', false, 'saturates self-storage answers (unittrac.com), 6 real false positives'],
    ['Home', false, 'R5 already reproduced this one from a tagline og:site_name'],
    ['Legal', false, 'category word'],
    ['Smart', false, 'category word'],
    ['Cloud', false, 'category word'],
    ['Data', false, 'category word'],
    ['Sales', false, 'category word'],
    ['Team', false, 'category word'],
    ['IT', false, 'matches the pronoun "it" in every response ever written'],
    ['AI', false, 'appears in every answer this product collects, by construction'],
    ['The', false, 'previous LEADING_WORD_STOPWORDS member, must stay blocked'],
    ['Get', false, 'previous LEADING_WORD_STOPWORDS member, must stay blocked'],
    ['Go', false, 'previous LEADING_WORD_STOPWORDS member, must stay blocked'],
    ['CARET', true, 'real brand lead, rare enough to identify caretlegal.com'],
    ['Rebuy', true, 'coined, identifies rebuyengine.com on its own'],
    ['Jetpack', true, 'identifies jetpackworkflow.com on its own'],
    ['Kickflip', true, 'identifies gokickflip.com on its own'],
    ['Salesmsg', true, 'coined despite starting with the generic string "sales"'],
    ['Klaviyo', true, 'coined'],
    ['Quilia', true, 'coined, a real domain in prospect_audits'],
  ]
  for (const [word, expected, why] of TABLE) {
    assert.strictEqual(
      isDistinctiveLeadWord(word), expected,
      `isDistinctiveLeadWord(${JSON.stringify(word)}) must be ${expected}: ${why}`,
    )
    ok(`${JSON.stringify(word)} -> ${expected} (${why})`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(8, 'single-word brand names are unaffected')
  // There is no lead word to guard when the name has one word, so this path
  // must be byte-identical before and after the fix in both directions.
  {
    // salesmessage.com -> "Salesmsg" is one of the five real divergences the
    // 2026-07-16 brand-name fix is named for. One word, so no lead-word split
    // happens at all, and the guard must be invisible on this path.
    const diverging = buildProspectAliases('salesmessage.com', 'Salesmsg')
    assert.deepStrictEqual(diverging, ['salesmessage', 'Salesmsg'],
      'a single-word name yields exactly the domain root plus the name')
    ok('salesmessage.com / "Salesmsg" -> ["salesmessage","Salesmsg"], no lead-word split')

    const deduped = buildProspectAliases('getresponse.com', 'GetResponse')
    assert.deepStrictEqual(deduped, ['getresponse'],
      'case-insensitive dedup of domain root against an identical name is unchanged')
    ok('getresponse.com / "GetResponse" -> ["getresponse"], dedup unchanged')
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(9, 'numeric and single-character lead tokens are refused')
  {
    assert.strictEqual(isDistinctiveLeadWord('360'), false,
      'a bare "360" matches any figure of 360 in any response')
    assert.strictEqual(isDistinctiveLeadWord('7'), false, 'single character')
    assert.strictEqual(isDistinctiveLeadWord('X'), false, 'single character')
    assert.strictEqual(isDistinctiveLeadWord(''), false, 'empty')
    assert.strictEqual(isDistinctiveLeadWord(null), false, 'null')
    const aliases = buildProspectAliases('360learning.com', '360 Learning')
    assert.ok(!aliases.includes('360'), '"360 Learning" must not contribute a bare "360"')
    ok('numeric, single-character, empty and null lead tokens all refused')
  }

  // ───────────────────────────────────────────────────────────────────────────
  section(10, 'the guard is case insensitive')
  {
    assert.strictEqual(isDistinctiveLeadWord('CASE'), false, 'uppercase must block too')
    assert.strictEqual(isDistinctiveLeadWord('cAsE'), false, 'mixed case must block too')
    const aliases = buildProspectAliases('casetempo.com', 'CASE Tempo')
    assert.ok(!aliases.some(a => a.toLowerCase() === 'case'),
      'an uppercased og:site_name must not slip a "CASE" alias through')
    ok('"CASE" and "cAsE" are blocked exactly like "Case"')
  }

  console.log(`\nPASS: ${passed} assertions\n`)
}

try {
  main()
} catch (e) {
  console.error(`\nFAIL: ${e.message}`)
  if (process.env.BG_TEST_STACK) console.error(e.stack)
  process.exit(1)
}
