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
 *   gemini     MEDIUM — see the 2026-07-13 note below.
 *
 * ⚠️ GEMINI REPRICED 2026-07-13, 0.020 → 0.034. The 0.020 figure was derived for
 * `gemini-3.5-flash` ($14 per 1,000 SEARCH QUERIES, ~1.4 queries/prompt). We are NO
 * LONGER ON 3.5 — it is a reasoning-first model that thinks by default and timed out
 * on 10/10 grounded calls, so collect-prompt.js and _prospect_engines.js were reverted
 * to `gemini-2.5-flash`, which bills a FLAT $35 per 1,000 grounded PROMPTS ≈ €0.034
 * (CLAUDE.md §12.2's original derivation). Leaving 0.020 in place would have
 * under-priced Gemini by ~1.7x — and this table is NOT cosmetic: _prospect_guard.js's
 * checkMonthlyBudget() sums estimated_cost_eur against PROSPECTING_MONTHLY_BUDGET_EUR
 * (default €200), so an under-priced engine silently loosens a real spend cap. That is
 * the exact failure §12.3 caught when gemini was priced at 0.001.
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
  gemini:     0.034,   // 2.5-flash, flat $35/1k grounded prompts (see the note above)
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

/**
 * PLAN_LIVE_ENGINES — the engines that actually collect (and cost money) per
 * plan. This is the server-side mirror of planConfig.ts's getActiveEngines()
 * output: PLAN_ENGINES minus the 4 not-yet-built COMING_SOON engines
 * (google_ai/copilot/deepseek/grok), which never collect even on pro/enterprise
 * (those tiers only reserve slots for them). Used by the collection queue
 * (schedule-collections.js / enqueue-collection.js) to decide which engines a
 * job runs, and by activeEnginesFor() below. Keep in sync with planConfig.ts's
 * PLAN_ENGINES by hand — same tradeoff as ENGINE_COST_EUR (CJS functions can't
 * import the Vite-bundled .ts).
 */
const PLAN_LIVE_ENGINES = {
  free:       ['chatgpt'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
  managed:    ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
  pro:        ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
  enterprise: ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
}

// Derived from PLAN_LIVE_ENGINES so there is ONE source of truth for the
// per-plan engine set. Used by _auth.js's SCALE-SPEC §2.2 hourly ceiling
// (max(150, activePrompts * engineCount)).
const PLAN_LIVE_ENGINE_COUNT = Object.fromEntries(
  Object.entries(PLAN_LIVE_ENGINES).map(([plan, engines]) => [plan, engines.length])
)

/**
 * activeEnginesFor(plan, enginesEnabled) -> string[]
 * The engines that should actually run for a client — its plan's live engines,
 * minus any the admin explicitly disabled via clients.engines_enabled
 * ({ "meta": false } → drop meta). Mirrors planConfig.ts's getActiveEngines()
 * for server-side (queue/worker) use. Unknown plan → 'essentials' fallback
 * (matches clientContext.tsx #104).
 */
function activeEnginesFor(plan, enginesEnabled) {
  const key = PLAN_LIVE_ENGINES[plan] ? plan : 'essentials'
  const base = PLAN_LIVE_ENGINES[key]
  if (!enginesEnabled || typeof enginesEnabled !== 'object') return base.slice()
  return base.filter(e => enginesEnabled[e] !== false)
}

/**
 * PLAN_MONTHLY_API_BUDGET_EUR — SCALE-SPEC.md §2.1's monthly per-client EUR
 * spend cap, enforced by _auth.js's checkCollectionLimits() before a new
 * collection call is allowed.
 *
 * Derivation (2026-07-13, this pass): SCALE-SPEC's own published Scenario
 * A/B tables were NOT used verbatim — neither matches what's actually live.
 * Scenario A predates the 2026-07-10 cost fixes; Scenario B assumes the
 * Batch API + Gemini 3.x, and Gemini 3.x was reverted 2026-07-13 (§12.3b,
 * it times out on grounded calls). These are computed fresh from _cost.js's
 * CURRENT live ENGINE_COST_EUR values above, at 9% of monthly plan price
 * (SCALE-SPEC §1.2's own sizing rule — 9%, not 10%, so the reserved 1%
 * headroom absorbs Free-tier + prospecting spend):
 *   5-engine check (chatgpt+gemini+claude+perplexity+meta): EUR 0.111
 *   3-engine check (chatgpt+gemini+claude):                 EUR 0.104
 *   1-engine check (chatgpt):                                EUR 0.060
 * free:       fixed small allowance (5 checks), not price-derived (E0 revenue)
 * essentials: 9% of EUR 99   = 8.91
 * growth:     9% of EUR 299  = 26.91
 * managed:    9% of EUR 900  = 81.00
 * pro:        9% of EUR 1500 = 135.00
 * enterprise: 9% of EUR 10000 (pricing floor) = 900.00
 *
 * Not exact — same caveat as ENGINE_COST_EUR above. True these up once
 * real cost_eur data accumulates (SCALE-SPEC §2.1's own stated intent).
 * Keep in sync with src/lib/planConfig.ts's copy of the same map.
 */
const PLAN_MONTHLY_API_BUDGET_EUR = {
  free: 0.30,
  essentials: 8.91,
  growth: 26.91,
  managed: 81.00,
  pro: 135.00,
  enterprise: 900.00,
}

module.exports = {
  ENGINE_COST_EUR,
  FREE_ERROR_CODES,
  costForRow,
  PLAN_LIVE_ENGINES,
  PLAN_LIVE_ENGINE_COUNT,
  activeEnginesFor,
  PLAN_MONTHLY_API_BUDGET_EUR,
}
