/**
 * _cost.js
 * Single shared source of truth for per-call engine API cost (EUR), used to
 * meter cost_eur on every ai_results insert (SCALE-SPEC.md §2.1).
 *
 * Before this file, the same table was hand-duplicated in THREE places
 * (src/pages/Usage.tsx, netlify/functions/_prospect_engines.js, and nowhere
 * at all for the actual ai_results collectors) — SCALE-SPEC.md §2.1 calls
 * this out by name as a keep-in-sync-by-hand hazard to fix. Netlify functions
 * run as plain CommonJS and can't import a Vite-bundled .ts module at
 * runtime, so this is deliberately duplicated ONE more time, by hand, into
 * src/lib/planConfig.ts's ENGINE_COST_EUR (same tradeoff already accepted for
 * _score.js <-> aiVisibilityScore.ts). Every server-side caller — the three
 * collectors below, and _prospect_engines.js — requires THIS file instead of
 * declaring its own copy, so there is now exactly one server-side copy to
 * update instead of two.
 *
 * REPRICED 2026-07-10 (SCALE-SPEC.md §1.1, CLAUDE.md §12.3) — the original
 * figures were never checked against a published rate card and were ~2.4x too
 * low. These values are AFTER that day's three config fixes:
 *   - Claude:  web_search tool removed (was ~75% of Claude's cost; task #63
 *              claimed this was already done — it wasn't). ~EUR 0.040 -> ~EUR 0.010.
 *   - ChatGPT: reasoning effort capped to 'low' (gpt-5.5 bills reasoning
 *              tokens as uncapped output at $30/MTok). ~EUR 0.075 -> ~EUR 0.060.
 *   - Gemini:  2.5-flash -> 3.5-flash grounding ($35/1k prompts -> $14/1k
 *              search queries — see the caveat in Usage.tsx, confidence LOW).
 *
 * CONFIDENCE (derived from published rate cards + measured mean response size
 * of 2,598 chars / 650 output tokens, n=243 — NOT from an invoice, per
 * SCALE-SPEC.md §1.1's own note that invoice-division was ruled out because
 * the OpenAI key is shared with other work):
 *   claude     HIGH   — no tool fee left, token counts are small and known.
 *   perplexity HIGH   — flat OpenRouter rate.
 *   meta       HIGH   — flat OpenRouter rate.
 *   chatgpt    MEDIUM — reasoning-token volume isn't directly observable.
 *   gemini     LOW    — 3.x bills per SEARCH QUERY, not per prompt, and one
 *                       prompt can fire several; 0.020 assumes ~1.4 queries/prompt.
 *
 * Do not treat these as exact. This IS the fix SCALE-SPEC promised — once
 * every row carries cost_eur, actual spend can be measured directly and these
 * constants can be trued up from real data instead of re-derived by hand.
 *
 * Keep in sync with src/lib/planConfig.ts's ENGINE_COST_EUR whenever either
 * changes.
 */
const ENGINE_COST_EUR = {
  claude:     0.010,
  chatgpt:    0.060,
  gemini:     0.020,
  perplexity: 0.006,
  meta:       0.001,
}

// Error codes where NO billable API call happened — the request was rejected
// before (or without) any generation, so there is nothing to charge for:
//   quota_exceeded — provider rejected the call outright (429/402/RESOURCE_EXHAUSTED)
//   auth_error     — missing/invalid API key, request never reached the provider
//                     in a billable way (or wasn't sent at all)
// Every OTHER outcome — 'ok', or a failure that still means a request was sent
// to the provider (timeout, api_error, empty_response, no_response,
// analysis_error) — is charged the FULL engine cost. This is a deliberate
// simplification, not an oversight: we don't have real per-call token
// accounting, so "was a request actually made" is the best signal available,
// and it errs toward NOT under-counting real spend for the monthly budget
// check in SCALE-SPEC §2.1.
const FREE_ERROR_CODES = new Set(['quota_exceeded', 'auth_error'])

/**
 * costForRow(llm, errorCode) -> number
 *
 * llm: engine id ('chatgpt' | 'gemini' | 'claude' | 'perplexity' | 'meta' | ...)
 * errorCode: null/undefined for a successful ('ok') row, or one of the
 *            ai_results.error_code values (#95-#97 / #109) for an error row.
 *
 * Unknown engine ids (e.g. the 4 not-yet-built ones) return 0 — they never
 * collect, so there's nothing to meter.
 */
function costForRow(llm, errorCode) {
  if (errorCode && FREE_ERROR_CODES.has(errorCode)) return 0
  return ENGINE_COST_EUR[llm] ?? 0
}

module.exports = { ENGINE_COST_EUR, FREE_ERROR_CODES, costForRow }
