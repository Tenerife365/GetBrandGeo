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
/* ═══════════════════════════════════════════════════════════════════════════
   COST MODEL — rebuilt 2026-07-29 against verified list prices.

   WHAT WAS WRONG. cost_eur was never metered. costForRow() returned a flat
   constant per engine, so every ai_results row for a given engine carried an
   identical value (confirmed in production: `count(distinct cost_eur) = 1` for
   all six engines). The comment in Usage.tsx claiming the column "now meters
   this per row for real" was not true — it stored the same estimate in the
   database instead of computing it in the UI.

   The engines all return token usage and it was being discarded at the point
   of collection: every callX() in _collect.js returned {text, errorCode,
   detail} and dropped the usage block. Metering is now wired (see
   estimateCostEur below and the `usage` returns in _collect.js).

   THE TOTAL WAS ACCIDENTALLY CLOSE; THE ATTRIBUTION WAS NOT. Modelled against
   list prices verified 2026-07-29, a 5-engine run costs about EUR 0.135 vs the
   EUR 0.125 the constants implied — 8% out in total, because two large errors
   pointed in opposite directions and cancelled:

     engine      was      modelled   error
     chatgpt     0.060    0.056      ok
     claude      0.010    0.033      3.3x UNDER
     gemini      0.034    0.032      ok at list (but see the free tier below)
     perplexity  0.006    0.001      5x OVER
     google_ai   0.015    fixed fee  not a marginal cost at all

   Per-engine attribution is what Usage.tsx displays and what any "which engine
   do we cut" decision would rest on, so being right in aggregate and wrong per
   engine is the worse failure. Claude in particular looked like the cheapest
   engine when it is the second most expensive.

   WHY CLAUDE WAS 3.3x UNDER — the constant is exactly the no-web-search cost.
   ~500 input + ~600 output on sonnet-4-6 is $0.0105, which is EUR 0.010 to
   three decimals. Task #63 removed web search from Claude, the constant was set
   for that shape, and then `8b7496c` was reverted and web search was restored
   (see the long note in _collect.js callClaude, which explicitly says
   "reconcile the cost math"). This closes that TODO. Web search adds a
   $10/1,000 tool fee AND bills the retrieved results as input tokens.

   TWO OF THE FIVE ARE NOT PER-CALL COSTS. Modelling them as marginal is a
   category error that makes the budget gate block collection over spend that
   is incurred whether or not you collect:
     - gemini: grounding is $35/1,000 prompts BUT the first 1,500 requests per
       DAY are free, and retrieved context is not billed as tokens. BrandGEO has
       made ~200 grounded calls in total, so the true marginal cost is EUR 0.
     - google_ai: SerpApi is a fixed monthly subscription and unused searches
       expire at renewal. Marginal cost inside the plan is EUR 0; the real cost
       is plan_fee / searches_actually_used, which at current volume is far
       higher than any per-search figure.
   Both are kept as non-zero here deliberately — see FIXED_FEE_ENGINES below.

   PRICES (USD, verified 2026-07-29, converted at USD_TO_EUR):
     gpt-5.5            $5.00 / $30.00 per 1M   + web_search $10/1k, results billed as input
     claude-sonnet-4-6  $3.00 / $15.00 per 1M   + web_search $10/1k, results billed as input
     perplexity/sonar   $1.00 /  $1.00 per 1M   search included, no separate fee
     gemini-2.5-flash   $35 per 1k grounded prompts, 1,500/day free, context not billed
     SerpApi            $10-25 per 1k depending on plan tier; fixed monthly commitment

   NOTE gpt-5.5 is legacy as of the GPT-5.6 release (2026-07) and OpenAI doubled
   the GPT-5 line on 2026-04-23 ($2.50->$5.00 in, $15->$30 out). If the model id
   in _collect.js is ever bumped, revisit MODEL_PRICE_USD in the same commit.
   ═══════════════════════════════════════════════════════════════════════════ */

const USD_TO_EUR = 0.92

/** Per-1M-token list prices in USD, by engine. */
const MODEL_PRICE_USD = {
  // gpt-4o-mini as of 2026-07-29 (owner's switch off legacy gpt-5.5, which was
  // $5.00/$30.00 and 74% of all marginal collection spend). Token prices are
  // list. The web_search_preview fee in TOOL_FEE_USD below is NOT verified for
  // this model and is the larger share of the cost now that tokens are cheap,
  // so the first metered rows should be checked against the OpenAI dashboard
  // and this table corrected. If the gpt-5.5 fallback in _collect.js fires, the
  // row is priced with these numbers and will UNDERSTATE the real cost; a run
  // of suspiciously cheap chatgpt rows means the fallback is firing.
  chatgpt:    { in: 0.15, out: 0.60 },   // gpt-4o-mini
  claude:     { in: 3.00, out: 15.00 },  // claude-sonnet-4-6
  perplexity: { in: 1.00, out:  1.00 },  // perplexity/sonar via OpenRouter
  meta:       { in: 0.35, out:  0.40 },  // llama-3.1-70b, retired — historical rows only
  grok:       { in: 2.00, out:  6.00 },  // x-ai/grok-4.5 via OpenRouter, live 2026-07-29
}

/** Flat per-call tool fees in USD (charged on top of tokens). */
const TOOL_FEE_USD = {
  chatgpt: 0.010,   // web_search_preview, $10 per 1,000 calls
  claude:  0.010,   // web_search_20250305, $10 per 1,000 searches, max_uses:1
}

/**
 * Engines whose cost is a fixed periodic commitment, not a per-call charge.
 * The value below is a per-call ACCOUNTING figure so the monthly budget gate
 * still throttles them; it is not what the call marginally costs. Do not quote
 * these as marginal cost when deciding whether a run is "worth it".
 */
const FIXED_FEE_ENGINES = new Set(['gemini', 'google_ai', 'ai_overview'])

/**
 * SerpApi per-search accounting rate in EUR.
 * Starter tier is $25 per 1,000 searches = $0.025 per search, which is
 * EUR 0.023 at USD_TO_EUR. Both SerpApi engines (google_ai, ai_overview) draw
 * on the SAME monthly commitment, so this is the shared unit.
 *
 * ai_overview is metered rather than estimated because its search count is not
 * fixed: engine=google returns the overview inline for 1 search, but when
 * Google defers it behind a page_token a second call to
 * engine=google_ai_overview is required and that bills as a SECOND search.
 * _collect.js returns the real count as usage.serpSearches, so a deferred
 * overview is billed EUR 0.046 and an inline one EUR 0.023. Averaging the two
 * would understate every deferred call and overstate every inline one, and the
 * split is not stable across markets or query types.
 */
/**
 * SerpApi cost per search, and the hard ceiling underneath it.
 *
 * REPRICED 2026-07-29d, owner's correction, and it doubles. The account is
 * $25/month for 500 CREDITS, which is $0.05 per search, not the $0.025 that
 * "$25 per 1,000" implied. Both SerpApi engines were priced at half their real
 * cost.
 *
 *   $25 / 500 credits = $0.05 = EUR 0.046 per search
 *
 * THE EURO FIGURE IS NOT THE BINDING CONSTRAINT. The credit pool is. 500
 * credits a month is a PLATFORM-WIDE ceiling shared by every client, unlike
 * PLAN_MONTHLY_API_BUDGET_EUR which is per client, and unused credits expire at
 * renewal. google_ai spends 1 credit per prompt-check; ai_overview spends 1, or
 * 2 when Google defers the overview behind a page_token. So a single prompt on
 * a 7-engine plan costs up to 3 credits.
 *
 * Owner's decision (2026-07-29): these stay in the budget gate and are NOT
 * excluded as fixed-fee. A credit spent is a credit gone, and at 500 a month
 * they are scarce rather than free. See SERPAPI_MONTHLY_CREDITS and
 * serpApiCreditsPerMonth() below for the allowance model.
 */
const SERPAPI_COST_PER_SEARCH_EUR = 0.046
const SERPAPI_MONTHLY_CREDITS = 500
const SERPAPI_CREDITS_PER_CHECK = { google_ai: 1, ai_overview: 1.5 }   // ai_overview averages 1-2

/**
 * serpApiCreditsPerMonth(plan, prompts, runsPerMonth) -> number
 * Credits ONE client on this plan consumes per month at the given prompt count
 * and cadence. Sum across the book must stay under SERPAPI_MONTHLY_CREDITS.
 */
function serpApiCreditsPerMonth(plan, prompts, runsPerMonth = 4.333) {
  const engines = PLAN_LIVE_ENGINES[plan] || PLAN_LIVE_ENGINES.essentials
  const perCheck = engines.reduce((s, e) => s + (SERPAPI_CREDITS_PER_CHECK[e] || 0), 0)
  return prompts * perCheck * runsPerMonth
}

const ENGINE_COST_EUR = {
  // Fallback estimates, used only when an engine returns no usage block.
  // Recomputed 2026-07-29 from the prices above at the observed call shape.
  claude:     0.033,   // was 0.010 — that figure predated web search being restored
  // 0.014, MODELLED for gpt-4o-mini, 2026-07-29. NOT measured yet, unlike the
  // 0.108 it replaces, which WAS measured across 6 gpt-5.5 rows (range 0.078 to
  // 0.174). Shape assumed: ~10k input (web results are billed as input) at
  // $0.15/1M, ~1k output at $0.60/1M, plus one $0.010 search fee. Tokens are now
  // about a fifth of the cost and the flat search fee is the rest, which is a
  // different cost structure, so re-measure before quoting this anywhere.
  // Replace with a measured figure once real 4o-mini rows exist.
  chatgpt:    0.014,
  perplexity: 0.005,   // MEASURED 2026-07-29 (avg of 6, tight range 0.0050-0.0052).
                       // Was 0.001, modelled. Still the cheapest engine by far.
  meta:       0.001,   // retired 2026-07-16 (replaced by google_ai); historical rows only
  // grok-4.5 + web plugin. The 0.012 here was modelled on a 500in/650out shape
  // and the first six production rows METERED at EUR 0.165, fourteen times more,
  // which back-solves to about 30,000 output tokens per call. grok-4.5 reasons by
  // default. Reasoning is now disabled at the call site (_collect.js), so this
  // returns to roughly the modelled figure, and 0.020 is deliberately a little
  // above it rather than optimistic. TRUE THIS UP from metered rows once a
  // collection has run with reasoning off, and if it does not fall, the engine
  // is not viable at this price.
  grok:       0.020,
  // Fixed-fee engines: accounting figures, marginal cost is EUR 0 at current volume.
  gemini:     0.032,   // $35/1k grounded LIST price; free under 1,500/day
  google_ai:  0.046,   // 1 SerpApi credit. $25/500 credits, owner-confirmed 2026-07-29
  // Google AI Overviews. FALLBACK ONLY — every real row is metered from
  // usage.serpSearches, so this is the blended figure used before any usage
  // exists (and by the budget projection): a mix of 1-search inline overviews
  // at EUR 0.023 and 2-search deferred ones at EUR 0.046. True it up from
  // ai_results.cost_eur once a week of real rows exists; the blend ratio is the
  // one number here that is genuinely unknown until measured.
  ai_overview: 0.069,   // 1.5 SerpApi credits on average (2 when Google defers)
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
/**
 * estimateCostEur(llm, usage) -> number | null
 *
 * Real per-call cost from the token counts the provider returned. Returns null
 * when the engine has no token-based price (the fixed-fee engines) or when the
 * caller passed no usage — callers fall back to ENGINE_COST_EUR in that case.
 *
 * `usage` is the normalised shape produced by _collect.js:
 *   { inputTokens: number, outputTokens: number, searches?: number }
 *
 * searches defaults to 1 for the two web-search engines because both are
 * configured to search once per call (max_uses:1 on Claude, a single
 * web_search_preview tool on ChatGPT). If a provider reports the real count,
 * pass it and this bills it exactly.
 */
function estimateCostEur(llm, usage) {
  // PROVIDER-REPORTED COST WINS. OpenRouter returns what it actually charged
  // (usage.cost, requested via `usage: { include: true }`), which already
  // includes the web plugin's per-result fee and any routing markup. Modelling
  // that from tokens would be guessing at a number the provider already told
  // us. Applies to perplexity and grok today.
  if (usage && typeof usage.costUsd === 'number' && usage.costUsd > 0) {
    return usage.costUsd * USD_TO_EUR
  }
  // SERPAPI SEARCHES ARE METERED BY COUNT, NOT BY TOKENS. There are no tokens
  // on this path — SerpApi bills per search — so the count the caller returned
  // IS the cost basis. ai_overview consumes 1 search inline and 2 when Google
  // defers the overview behind a page_token. google_ai returns no usage today
  // and falls through to its flat estimate; if it is ever wired to report a
  // count, it bills correctly here with no further change.
  if (usage && typeof usage.serpSearches === 'number' && usage.serpSearches > 0) {
    return usage.serpSearches * SERPAPI_COST_PER_SEARCH_EUR
  }
  const price = MODEL_PRICE_USD[llm]
  if (!price || !usage) return null
  const inTok  = Number(usage.inputTokens)  || 0
  const outTok = Number(usage.outputTokens) || 0
  if (inTok === 0 && outTok === 0) return null

  const feePerSearch = TOOL_FEE_USD[llm] ?? 0
  const searches = feePerSearch
    ? (usage.searches === undefined ? 1 : Number(usage.searches) || 0)
    : 0

  const usd = (inTok * price.in / 1e6) + (outTok * price.out / 1e6) + (searches * feePerSearch)
  return usd * USD_TO_EUR
}

/**
 * costForRow(llm, errorCode, usage) -> number
 *
 * Metered when the provider returned usage, estimated otherwise. The third
 * argument is optional so every existing 2-argument call site keeps working and
 * silently falls back to the flat estimate.
 */
function costForRow(llm, errorCode, usage) {
  if (errorCode && FREE_ERROR_CODES.has(errorCode)) return 0
  const metered = estimateCostEur(llm, usage)
  if (metered !== null) return metered
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
// Google AI Mode (google_ai, via SerpApi) replaced Meta AI as the 5th live
// engine 2026-07-16. Keep in sync with planConfig.ts's PLAN_ENGINES.
// SUPERSEDED 2026-07-28: Growth gets google_ai too, so Growth = 5 engines. The
// old "Growth PRO and up" rule meant the FREE public audit (_prospect_engines.js
// FULL_ENGINES) showed a prospect Google AI Mode results that they then lost by
// paying EUR 299. Owner's call. Keep in sync with planConfig.ts PLAN_ENGINES.
//
// Spend note: this raises Growth's collection cost by google_ai's EUR 0.015 per
// search. At Growth's 150-prompt ceiling that is EUR 2.25 per full run, against
// a PLAN_MONTHLY_API_BUDGET_EUR of EUR 35.88 (12% of EUR 299), so the budget
// still holds. PLAN_LIVE_ENGINE_COUNT below derives from this map, so _auth.js's
// hourly ceiling for Growth widens from 4 to 5 engines automatically.
const PLAN_LIVE_ENGINES = {
  free:       ['chatgpt'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
  // GROK IS THE 6TH ENGINE, GROWTH PRO AND UP (2026-07-29). Growth PRO vs
  // Growth was +25 prompts and 3x AI SEO depth and nothing else once refresh
  // frequency stopped being a differentiator; a 6th engine is the thing that
  // makes the step legible. Grok is also the only engine with live X/Twitter
  // retrieval, so it measures a surface none of the other five can see.
  // AI OVERVIEWS IS THE 7TH ENGINE, GROWTH PRO AND UP (2026-07-29). It is ADDED
  // alongside google_ai, not a replacement for it, because the two measure
  // different Google products: google_ai is AI Mode, the conversational tab a
  // user has to switch to deliberately; ai_overview is the AI summary block on
  // an ordinary results page, shown by default and therefore reaching far more
  // searchers. A brand can be cited in one and absent from the other, and only
  // measuring them separately shows that. Growth and below are unchanged at 5.
  growth_pro: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
  managed:    ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
  pro:        ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
  enterprise: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
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
 *
 * RESTATED 2026-07-29 at the rebuilt prices (the figures below were computed
 * against the old constants, where claude was 3.3x under and perplexity 5x
 * over; the per-check totals move less than the per-engine numbers because
 * those two errors partly cancelled):
 *   5-engine check (chatgpt+gemini+claude+perplexity+google_ai): EUR 0.137  (was 0.111 w/ meta)
 *   3-engine check (chatgpt+gemini+claude):                      EUR 0.121  (was 0.104)
 *   1-engine check (chatgpt):                                    EUR 0.056  (was 0.060)
 *
 * Note the 5-engine figure now includes google_ai rather than the retired meta,
 * and that gemini + google_ai inside it are FIXED_FEE_ENGINES — the true
 * marginal cost of a 5-engine check at current volume is about EUR 0.090.
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
// PRICING-STRATEGY-2026-07 §3: repriced to 12% of monthly plan price (was 9%),
// giving ~88% gross margin at the §3 prompt counts + ~weekly collection. This is
// the hard cost ceiling; PLAN_COLLECTION_COOLDOWN_HOURS below is the separate
// frequency limiter. Keep in sync with planConfig.ts.
// RAISED TO 15% OF PRICE, 2026-07-29c. Owner's instruction: API spend per client
// is hard-capped at 15% of what that client pays, because BrandGEO carries other
// costs on top of inference and has to clear a margin.
//
// THIS IS A CEILING, NOT THE EXPECTED SPEND, and the distinction is the whole
// point of the change. Scheduled weekly collection costs about 10.5% of price on
// every paid tier (see the table in planConfig.ts PLAN_PROMPTS). The old 12%
// ceiling left only 1.5 points of slack, so a customer who pressed Run
// Collection manually once or twice in a month could hit a hard block on spend
// that was already budgeted for. 15% leaves real room for manual refreshes while
// still stopping runaway use, and it is the number to enforce rather than drift
// past.
//
// Reading these against revenue: the gate is 15% of price, scheduled use is
// ~10.5%, and true cash out is 6.5-7.8% because gemini (free under 1,500
// requests/day) and google_ai (fixed SerpApi subscription) are inside the
// modelled figure but are not marginal spend.
const PLAN_MONTHLY_API_BUDGET_EUR = {
  free:       0.30,    // not price-derived: EUR 0 revenue, fixed small allowance
  essentials:  14.85,  // 15% of €99
  growth:      44.85,  // 15% of €299
  growth_pro:  67.35,  // 15% of €449
  managed:    225.00,  // 15% of €1,500 floor
  pro:        225.00,  // legacy (treated as Managed)
  enterprise: 1500.00, // 15% of the €10,000 pricing floor
}

// PRICING-STRATEGY-2026-07 §6 — minimum hours between MANUAL collection runs (the
// Run-Collection button cooldown), enforced in enqueue-collection.js via
// checkCollectionCooldown (_enqueue.js). Separate from the € budget above: this
// stops prompt-thrash (edit prompts, re-run repeatedly). free = monthly;
// managed/pro/enterprise = 0 (on-demand). Keep in sync with planConfig.ts.
// WEEKLY for every paid plan as of 2026-07-29. Refresh frequency is no longer a
// tier differentiator, because it never actually was one: the EUR budget above
// bound first on every plan, so the advertised 48h/36h split was unreachable.
// Tiers differentiate on ENGINES, PROMPTS and AI SEO depth instead. 168h = one
// manual refresh per week, matching the automatic cadence. free = monthly.
// Keep in sync with planConfig.ts.
const PLAN_COLLECTION_COOLDOWN_HOURS = {
  free: 720, essentials: 168, growth: 168, growth_pro: 168,
  managed: 168, pro: 168, enterprise: 0,
}

// Engines capped at 1 run per (client, prompt) per MONTHLY_CAP_DAYS — a hard
// throttle regardless of manual/force/scheduled, to protect a metered external
// budget. Both capped engines run no_cache, so every call consumes a SerpApi
// credit against a 500-credit monthly pool shared by the whole platform.
// ai_overview joined the cap 2026-07-29 for the same reason and more strongly:
// it draws on the SAME SerpApi commitment as google_ai and consumes TWO credits
// whenever Google defers the overview behind a page_token, so an uncapped
// manual refresh loop burns the plan roughly twice as fast as google_ai does.
// The cap is invisible to scheduled collection, which already runs weekly; it
// only stops manual thrash. Removing it is a one-word edit if SerpApi headroom
// later makes it unnecessary.
/**
 * Engines whose collection frequency is capped INDEPENDENTLY of the plan's
 * normal cadence, and the window they are capped to.
 *
 * MOVED FROM WEEKLY TO MONTHLY 2026-07-29, owner's decision, and the rename is
 * not cosmetic: the constant was called WEEKLY_CAP_DAYS and is now 30.
 *
 * WHY. Both capped engines are SerpApi, and SerpApi is a 500-credit monthly
 * pool shared by the ENTIRE platform, not a per-client budget. At weekly cadence
 * the sold prompt counts do not fit inside it: one Growth PRO client would draw
 * 812 credits a month, 162% of the whole pool, and one Managed client 2,708,
 * or 542%. The book only fit because no customer used their allowance.
 *
 * At monthly cadence the same allowances draw 187 and 625, and Growth drops
 * from 217 to 50. The pool now supports a real book rather than one customer.
 *
 * The signal cost is small, which is what makes this the right lever rather
 * than cutting prompts. Google's AI surfaces are assembled from its search
 * index and move on the timescale of indexing and content changes, not on the
 * timescale of a chat model's sampling. The five token-based engines stay
 * weekly, so week-over-week trend is unaffected for the majority of the data.
 *
 * Enforced on BOTH paths, which is the reason this works at all: _enqueue.js
 * for scheduled collection and collect-prompt.js for the manual refresh button.
 * A cap that only covered manual refresh would not have touched the 812.
 */
const MONTHLY_CAPPED_ENGINES = ['google_ai', 'ai_overview']
const MONTHLY_CAP_DAYS = 30

module.exports = {
  ENGINE_COST_EUR,
  MODEL_PRICE_USD,
  TOOL_FEE_USD,
  FIXED_FEE_ENGINES,
  SERPAPI_COST_PER_SEARCH_EUR,
  SERPAPI_MONTHLY_CREDITS,
  SERPAPI_CREDITS_PER_CHECK,
  serpApiCreditsPerMonth,
  USD_TO_EUR,
  FREE_ERROR_CODES,
  costForRow,
  estimateCostEur,
  PLAN_LIVE_ENGINES,
  PLAN_LIVE_ENGINE_COUNT,
  activeEnginesFor,
  PLAN_MONTHLY_API_BUDGET_EUR,
  PLAN_COLLECTION_COOLDOWN_HOURS,
  MONTHLY_CAPPED_ENGINES,
  MONTHLY_CAP_DAYS,
}
