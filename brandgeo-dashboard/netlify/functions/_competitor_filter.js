/**
 * _competitor_filter.js — semantic competitor gate (Master-Reasoning, 2026-07-13)
 *
 * WHY THIS EXISTS. `_analysis.js` extracts competitor NAMES structurally (numbered
 * lists, bold/bullet names, prose). Structural rules cannot tell a *company* from a
 * Title-Cased proper noun that merely appears in the same list — and over five rounds
 * of denylist patches (§8.10–§8.15) the false positives kept mutating: certifications
 * ("FSSC 22000"), criterion labels ("Best for:"), section nouns ("Referințe",
 * "Prezentare", "Logistica"), and finally the brand's OWN credentials extracted as
 * rivals ("Papei Francisc", "Summit-ul UE de la Sibiu", "Horeca Awards", "LuxLife
 * Magazine"). That space is unbounded and multilingual; a denylist will never converge.
 *
 * So this module is the FINAL, semantic gate: given the brand and the already-extracted
 * short candidate list, one cheap Claude Haiku call returns only the names that are
 * genuine competing companies/products in the brand's market. The structural filters in
 * `_analysis.js` stay in place as a free, deterministic pre-pass (frozen, not grown) —
 * they shrink the list the LLM sees and provide the fallback below.
 *
 * CONTRACT / SAFETY:
 *  - Runs only when there is at least one candidate. Zero candidates → no call.
 *  - ONE call per response, hard-timeout-bounded, tiny token budget.
 *  - FAIL-OPEN: no API key, timeout, non-200, or unparseable output → return the input
 *    candidates UNCHANGED. This is never worse than today's structural-only behaviour.
 *  - The model may only REMOVE candidates, never add or rename — the output is
 *    intersected back against the input by identity, so a hallucinated name can't leak.
 *
 * `_analysis.js` stays pure/sync; this module owns the I/O.
 */

const MODEL = 'claude-haiku-4-5-20251001'
const TIMEOUT_MS = 8000
const MAX_CANDIDATES = 15   // beyond this the list is noise; still bounded input

function firstBrandName(cfg) {
  const a = Array.isArray(cfg?.brand_aliases) ? cfg.brand_aliases.find(Boolean) : null
  return a || (cfg?.brand_website ? String(cfg.brand_website).replace(/^https?:\/\//, '').replace(/^www\./, '') : 'the brand')
}

/**
 * Build the classification prompt.
 *
 * THE QUESTION IS THE CATEGORY (2026-07-29). The original prompt gave the model
 * a bare brand NAME and nothing else, so it had to guess what business the brand
 * was in. It guessed badly and in a specific, repeatable direction: it kept
 * anything adjacent to the industry. Bucate pe Roate, a catering company, ended
 * up with JW Marriott, Sheraton, Crowne Plaza, Hotel CARO, InterContinental,
 * Palatul Bragadiru, Terra Events Hall, Le Chateau and Domeniile Saftica on its
 * competitor board. Those are venues. A venue that has a kitchen is not a
 * catering supplier, and no buyer choosing a caterer is choosing between them.
 *
 * There is no industry field to hand it either: `clients.category` holds
 * 'active' / 'research' / 'free', an account status, not a business category.
 *
 * THE SUPPLY TEST (owner's rule, 2026-07-29) is what actually separates these,
 * and it is sharper than "is this its primary business". A venue that caters its
 * own events cannot be hired by a buyer who already has a venue: it does not
 * sell into the market at all, it consumes internally. It is not competing for
 * the same contract, so it cannot cost the client the deal, so it does not
 * belong on a board whose entire purpose is showing who takes their business.
 * Generalised: if a company cannot be engaged as an external vendor by a
 * customer it does not already host, it is not a competitor. That phrasing
 * transfers to any industry without naming venues or hotels.
 *
 * The prompt that produced the answer IS the missing signal, and it is exact.
 * Every one of BpR's active prompts says "firma de catering" (catering company),
 * so the category is stated outright in the question. Deriving from the question
 * also self-corrects in the other direction: if a client asks "best event venues
 * in Bucharest", venues become the correct answer and are kept. A hardcoded
 * "exclude venues" rule could never do that.
 *
 * `industry` is accepted as an explicit override for the prospect-audit path,
 * which really does have a generated category. `knownCompetitors` is passed as
 * calibration: names the client themselves nominated show the model what the
 * right KIND of company looks like in this market.
 */
function buildPrompt(brand, names, snippet, opts = {}) {
  const list = names.map((n, i) => `${i + 1}. ${n}`).join('\n')
  const question = opts.promptText ? String(opts.promptText).trim().slice(0, 400) : ''

  const askedBlock = question
    ? `The question that was asked:\n"""\n${question}\n"""\n\n`
    : ''
  const industryBlock = opts.industry
    ? `"${brand}" operates in this category: ${String(opts.industry).slice(0, 120)}.\n\n`
    : ''
  const knownBlock = Array.isArray(opts.knownCompetitors) && opts.knownCompetitors.length
    ? `Known genuine competitors of "${brand}", as examples of the RIGHT kind of ` +
      `company (they may or may not appear below): ` +
      `${opts.knownCompetitors.slice(0, 8).map(n => `"${n}"`).join(', ')}.\n\n`
    : ''
  const ctx = snippet
    ? `An excerpt of the answer, for context:\n"""\n${String(snippet).slice(0, 700)}\n"""\n\n`
    : ''

  // The category step only makes sense when we actually have the question.
  const step1 = question
    ? `STEP 1. From the question, identify the exact product or service category ` +
      `the asker wants to BUY. Be specific: "catering company", not "food"; ` +
      `"employment law firm", not "professional services".\n\n` +
      `STEP 2. Keep a candidate ONLY if BOTH are true:\n` +
      `  (a) it is a real, named company or product, AND\n` +
      `  (b) supplying that exact category is its OWN primary business, so a buyer ` +
      `reading this answer could pick it INSTEAD of "${brand}" for the same purchase.\n\n`
    : `Keep a candidate ONLY if it is a real, named company or product whose primary ` +
      `business directly competes with "${brand}" for the same purchase.\n\n`

  return (
`${askedBlock}${industryBlock}${knownBlock}` +
`An AI assistant answered that question. From its answer we extracted the ` +
`candidate names below. Some are genuine competitors. Many are not.\n\n` +
`Candidates:\n${list}\n\n${ctx}${step1}` +
`REJECT, even when the answer lists them alongside real competitors:\n` +
`  - Anything that is not a company: certifications and standards (ISO 9001, ` +
`FSSC 22000, HACCP), the bodies that issue or audit them (TUV, SGS, Bureau ` +
`Veritas, Lloyd's Register), section labels and generic nouns ("References", ` +
`"Presentation", "Logistics", "Pricing", "Budget"), events, awards, publications, ` +
`institutions, and government agencies.\n` +
`  - A business that provides the asked-for service ONLY inside its own ` +
`premises, to its own guests. THE TEST: could a buyer hire this company as an ` +
`EXTERNAL supplier and have it deliver at a location the buyer chooses? A hotel, ` +
`restaurant, conference centre or event venue that caters its own events fails ` +
`that test. It does not sell catering into the market, it consumes it ` +
`internally, and a buyer who already has a venue cannot hire it at all. It is ` +
`not competing for the same contract. Apply this test in any industry: if the ` +
`company cannot be engaged as a vendor by a customer it does not already host, ` +
`it is not a competitor.\n` +
`  - A company whose primary business is a DIFFERENT, adjacent category and ` +
`that offers the asked-for category only as a side activity.\n` +
`  - Things "${brand}" was merely associated with: its own clients, references, ` +
`partners, suppliers, credentials or past events.\n` +
`  - "${brand}" itself, under any spelling or alias.\n\n` +
`KEEP a company in a category only because the QUESTION asked for that category. ` +
`If the question had asked for event venues, venues would be the right answer.\n\n` +
`Do not invent, rename, translate, or reorder. Copy kept names EXACTLY as ` +
`written above.\n\n` +
`Reply with one short line naming the category you identified, then the kept ` +
`names as a JSON array of strings wrapped in <keep></keep> tags. If none ` +
`qualify, reply <keep>[]</keep>. Example:\n` +
`Category: catering company for corporate events\n` +
`<keep>["Acme Foods","Beta Catering"]</keep>`
  )
}

function parseKept(rawText, names) {
  // Tolerate ```json fences / stray prose around the array.
  let s = String(rawText || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  // Preferred shape since 2026-07-29: a one-line category statement followed by
  // <keep>[...]</keep>. Read inside the tags first, so a bracket appearing in
  // the category line ("catering [corporate]") cannot corrupt the scan. The bare
  // bracket scan below stays as the fallback for a model that ignores the tags.
  const tagged = /<keep>([\s\S]*?)<\/keep>/i.exec(s)
  if (tagged) s = tagged[1].trim()
  const start = s.indexOf('['), end = s.lastIndexOf(']')
  if (start === -1 || end === -1 || end < start) return null
  let arr
  try { arr = JSON.parse(s.slice(start, end + 1)) } catch { return null }
  if (!Array.isArray(arr)) return null
  // Intersect back against the real input by exact identity, so the model can only
  // remove — a hallucinated/renamed name is dropped, not trusted.
  const keep = new Set(arr.filter(x => typeof x === 'string').map(x => x.trim().toLowerCase()))
  return names.filter(n => keep.has(String(n).trim().toLowerCase()))
}

/**
 * Filter a structural competitor list down to genuine competitors via one Haiku call.
 * @param {Array<{pos:number,name:string}>} candidates  parsed competitors_mentioned
 * @param {{cfg?:object, brand?:string, snippet?:string, promptText?:string,
 *          industry?:string, knownCompetitors?:string[], fetchImpl?:function}} ctx
 *   promptText — the prompt the engine answered. Strongly recommended: it is the
 *   only reliable signal of which product category the buyer is shopping for.
 *   See buildPrompt. Omitting it degrades to the pre-2026-07-29 behaviour.
 * @returns {Promise<Array<{pos:number,name:string}>>}  same shape; only removals
 */
async function classifyCompetitors(candidates, ctx = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return candidates || []
  const apiKey = ctx.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) return candidates                         // fail-open: no key → unchanged

  const brand = ctx.brand || firstBrandName(ctx.cfg)
  const names = candidates.slice(0, MAX_CANDIDATES).map(c => c.name)
  const doFetch = ctx.fetchImpl || fetch
  const opts = {
    promptText: ctx.promptText,
    industry:   ctx.industry,
    knownCompetitors: ctx.knownCompetitors
      ?? (Array.isArray(ctx.cfg?.known_competitors) ? ctx.cfg.known_competitors : undefined),
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ctx.timeoutMs ?? TIMEOUT_MS)
  try {
    const r = await doFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        // 300 -> 500: the reply now opens with a one-line category statement
        // before the array. Truncating that line would cost the whole result,
        // since an unparseable reply fails open and keeps every candidate.
        max_tokens: 500,
        messages:   [{ role: 'user', content: buildPrompt(brand, names, ctx.snippet, opts) }],
      }),
    })
    if (!r.ok) return candidates                         // fail-open: non-200 → unchanged
    const msg = await r.json()
    if (msg?.error) return candidates
    const rawText = msg?.content?.[0]?.type === 'text' ? msg.content[0].text : ''
    const keptNames = parseKept(rawText, names)
    if (keptNames === null) return candidates            // fail-open: unparseable → unchanged
    const keepSet = new Set(keptNames.map(n => n.toLowerCase()))
    // Re-number kept competitors 1..n by their original order (positions may now have
    // gaps, which some readers treat as ranks); preserve the pos:99 prose sentinel.
    const kept = candidates.filter(c => keepSet.has(String(c.name).toLowerCase()))
    return kept
  } catch {
    return candidates                                    // fail-open: timeout/network → unchanged
  } finally {
    clearTimeout(timer)
  }
}

module.exports = {
  classifyCompetitors,
  // exported for unit testing:
  buildPrompt,
  parseKept,
  firstBrandName,
  MODEL,
}
