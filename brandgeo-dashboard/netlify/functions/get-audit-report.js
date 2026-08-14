/**
 * get-audit-report.js
 * Public read endpoint for an Instant Audit report (SALES-ENGINE.md §2.3/§2.4).
 * GET /.netlify/functions/get-audit-report?token=<token>
 * Header X-Internal-Key (optional) - matching INTERNAL_AUDIT_KEY returns the
 * full report without needing unlocked=true, for Prospect Radar / other
 * internal callers that don't go through the public email-gate.
 *
 * Response shapes:
 *   404 { error }                                       - unknown token
 *   200 { status: 'pending'|'generating_prompts'|'collecting', domain }
 *   200 { status: 'error', domain, error_message }
 *   200 { status: 'ready', unlocked: false, domain, category, ai_score,
 *         low_confidence, gap_count, engine_states,
 *         competitor_names: string[], competitor_count }   - teaser (no email yet)
 *   200 { status: 'ready', unlocked: true, ...everything above plus
 *         dimensions, engine_results, top_gaps, competitor_flags,
 *         depth, engines_used }                            - full (unlocked/internal)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE GATE IS SPLIT BY GRANULARITY, NOT BY FIELD NAME. Ruling 2026-08-14.
 *
 * The measured problem. 8 public audits ever, 2 unlocked, both founder tests on
 * getbrandgeo.com. All 8 scored ai_score 0 with both screening engines
 * `missing`, and that is truthful, not a detection bug: the brand strings appear
 * nowhere in the stored engine_results. The screening audit asks generic
 * CATEGORY questions, and a small brand is essentially never named in the answer
 * to a generic category question, so the free result was near-constant across
 * the whole SMB segment this funnel is aimed at. Meanwhile all 8 carried 2 to 6
 * named competitors, which is the only visitor-specific thing the audit knows,
 * and it was the part behind the gate. A visitor got a bare 0 with no evidence,
 * which reads as a broken tool, while the persuasive part sat unread.
 *
 * Why the obvious fix is wrong. `top_gaps` is built as the first three
 * `competitor_flags` re-keyed (_score.js:167-170), and 6 of the 8 public audits
 * carry 3 or more flags, so `top_gaps` is a strict subset of `competitor_flags`
 * on every public audit that has ever run. "Competitor names in front,
 * `top_gaps` behind" would leave the gate protecting a re-labelled copy of what
 * is already free, and the first prospect to compare the two screens would see
 * it.
 *
 * The ruling. The gate protects the JOIN, not the VALUES.
 *
 *   In front of the gate  - the diagnosis:
 *     engine_states       which engines answered, and whether each named you
 *     competitor_names    the DEDUPLICATED SET of names, no engine, no prompt
 *     competitor_count    how many distinct names there were
 *
 *   Behind the gate       - the attribution and the evidence:
 *     competitor_flags    which engine named which competitor on which prompt
 *     top_gaps            the same, prioritised
 *     engine_results      the answer snippets, the only place they exist at all
 *     dimensions          the six-dimension breakdown
 *
 * Deliberately NOT in front of the gate: a per-engine competitor count. With
 * only two screening engines (_prospect_engines.js:395), a per-engine count plus
 * the global name list frequently reconstructs the pairing by arithmetic - a
 * split of 0 and 2 attributes both names outright. That would be the gated asset
 * leaking through a sum. The free view therefore carries a per-engine VERDICT
 * and a name SET, and nothing that pairs the two.
 *
 * Why an email is still worth giving after this change. The free view answers
 * "am I invisible, and who was named while I was not". It cannot answer "on
 * which buyer question, in which engine, in whose words". On audit 61 the free
 * view shows six karting brands and two engines that did not name the visitor;
 * the gated view is the only place that says the question "family-friendly
 * karting venues" returned K1 Speed on Gemini and Crofton Go-Kart Raceway on
 * Perplexity, and shows the sentence each engine actually wrote. The first is
 * the diagnosis and it is what makes someone care. The second is the worksheet:
 * which question to attack first and the wording to attack it with. It is also
 * the only surface carrying engine_results snippets anywhere in the funnel.
 *
 * Note on framing for any caller rendering this: every entry in
 * `competitor_flags` comes from a row where the brand was NOT mentioned
 * (_score.js:150 returns early on `brand_mentioned`). So "named in answers where
 * you were not" is true of every name in `competitor_names` by construction,
 * including on a high-scoring audit. "Named INSTEAD OF you" is a per-prompt
 * claim and must not be used in the free view, which has no per-prompt data to
 * support it.
 *
 * No new API call, no new query, no new stored column. `competitor_names` is
 * derived at read time from the `competitor_flags` this function already selects
 * (`select('*')`), so the eight existing rows gain the field with no migration,
 * no backfill and no write. Per-audit cost is unchanged.
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, err, isInternalCaller } = require('./_prospect_guard')

// Screening depth runs at most 4 prompts x 2 engines, so at most 8 flags and
// therefore at most 8 distinct names - the cap never bites on a public audit.
// It exists so a FULL-depth row (6 prompts x 5 engines = up to 30 flags) cannot
// make an ungated payload grow without bound. `competitor_count` always reports
// the true distinct total, so the cap hides names but never misstates a number.
const MAX_TEASER_COMPETITORS = 8

/**
 * The deduplicated set of competitor names on an audit, with every trace of
 * which engine said it and which question produced it stripped off.
 *
 * Deduplication is case-insensitive and the FIRST spelling wins, so a name the
 * engines wrote two ways is shown once, as the engine first wrote it, rather
 * than lowercased into something no visitor would recognise. Measured need:
 * audit 59 carries 4 flags and only 3 distinct names, because both Gemini and
 * Perplexity named "Microsoft Power BI".
 *
 * Anything that is not a non-empty string is dropped rather than rendered as a
 * blank chip. Fail-soft on shape: this runs on a public read path and a
 * malformed stored row must degrade to "no names" and never to a 500.
 */
function distinctCompetitorNames(competitorFlags) {
  if (!Array.isArray(competitorFlags)) return []
  const seen = new Set()
  const names = []
  for (const flag of competitorFlags) {
    const raw = flag && flag.competitor_name
    if (typeof raw !== 'string') continue
    const name = raw.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}

/**
 * The whole gate, as one pure function of a stored audit row. Split out of the
 * handler so the split can be tested without a database or a live token -
 * tests/audit_teaser_gate.test.js asserts the granularity directly rather than
 * trusting a field name, because a field-name split is exactly the mistake this
 * ruling exists to prevent.
 *
 * Caller must have already established that audit.status === 'ready'.
 */
function buildReportPayload(audit, { canSeeFullReport }) {
  const allNames = distinctCompetitorNames(audit.competitor_flags)

  const shared = {
    status: 'ready',
    domain: audit.domain,
    category: audit.category,
    ai_score: audit.ai_score,
    low_confidence: audit.low_confidence,
    // gap_count is unchanged: top_gaps.length, the count the widget has always
    // had. It is a count, not an attribution, so it stays free.
    gap_count: Array.isArray(audit.top_gaps) ? audit.top_gaps.length : 0,
    engine_states: audit.engine_states,
    competitor_names: allNames.slice(0, MAX_TEASER_COMPETITORS),
    competitor_count: allNames.length,
  }

  if (!canSeeFullReport) return { ...shared, unlocked: false }

  // Unlocking must be a strict superset. A visitor who gives an email can never
  // LOSE something the free card had already shown them.
  return {
    ...shared,
    unlocked: true,
    depth: audit.depth,
    engines_used: audit.engines_used,
    dimensions: audit.dimensions,
    engine_results: audit.engine_results,
    top_gaps: audit.top_gaps,
    competitor_flags: audit.competitor_flags,
  }
}

exports.handler = async (event) => {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: corsHeaders(origin), body: 'Method Not Allowed' }

  const token = event.queryStringParameters?.token
  if (!token) return err(400, 'Missing token', origin)

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: audit, error } = await supabase.from('prospect_audits').select('*').eq('token', token).single()

  if (error || !audit) return err(404, 'Audit not found', origin)

  const headers = corsHeaders(origin)

  if (audit.status !== 'ready') {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ status: audit.status, domain: audit.domain, error_message: audit.status === 'error' ? audit.error_message : undefined }),
    }
  }

  // Unchanged. The email gate and the internal-key bypass both keep exactly the
  // authority they had; only the contents of the two branches move.
  const canSeeFullReport = audit.unlocked || isInternalCaller(event)

  return {
    statusCode: 200, headers,
    body: JSON.stringify(buildReportPayload(audit, { canSeeFullReport })),
  }
}

exports.buildReportPayload = buildReportPayload
exports.distinctCompetitorNames = distinctCompetitorNames
exports.MAX_TEASER_COMPETITORS = MAX_TEASER_COMPETITORS
