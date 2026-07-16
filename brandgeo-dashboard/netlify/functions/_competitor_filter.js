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

function buildPrompt(brand, names, snippet) {
  const list = names.map((n, i) => `${i + 1}. ${n}`).join('\n')
  const ctx = snippet ? `\n\nFor context, an excerpt of the answer:\n"""\n${String(snippet).slice(0, 700)}\n"""` : ''
  return (
`An AI assistant answered a question about the market that "${brand}" competes in. ` +
`From that answer we extracted the candidate names below. Some are real competing ` +
`companies/products; others are NOT companies at all — certifications or standards ` +
`(ISO 9001, FSSC 22000, HACCP), section labels or generic nouns ("References", ` +
`"Presentation", "Logistics", "Pricing"), events, awards, publications, venues, ` +
`institutions, or things the brand was merely associated with (its own clients, ` +
`references, or credentials).\n\n` +
`Candidates:\n${list}${ctx}\n\n` +
`Return ONLY the names that are genuine companies or products COMPETING with ` +
`"${brand}" in the same market. Exclude everything else. Do not invent, rename, ` +
`translate, or reorder — copy kept names EXACTLY as written above. Reply with a JSON ` +
`array of strings and nothing else, e.g. ["Acme Foods","Beta Co"]. If none qualify, reply [].`
  )
}

function parseKept(rawText, names) {
  // Tolerate ```json fences / stray prose around the array.
  let s = String(rawText || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
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
 * @param {{cfg?:object, brand?:string, snippet?:string, fetchImpl?:function}} ctx
 * @returns {Promise<Array<{pos:number,name:string}>>}  same shape; only removals
 */
async function classifyCompetitors(candidates, ctx = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return candidates || []
  const apiKey = ctx.apiKey ?? process.env.ANTHROPIC_API_KEY
  if (!apiKey) return candidates                         // fail-open: no key → unchanged

  const brand = ctx.brand || firstBrandName(ctx.cfg)
  const names = candidates.slice(0, MAX_CANDIDATES).map(c => c.name)
  const doFetch = ctx.fetchImpl || fetch

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
        max_tokens: 300,
        messages:   [{ role: 'user', content: buildPrompt(brand, names, ctx.snippet) }],
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
