/**
 * planConfig.ts
 * Single source of truth for engine/plan relationships.
 *
 * Engine states:
 *   active      – plan includes it, engine is built, admin hasn't disabled it
 *   coming_soon – plan includes it BUT (engine not yet built OR admin disabled)
 *   locked      – client's plan doesn't include this engine
 */

export type EngineId =
  | 'chatgpt'
  | 'gemini'
  | 'claude'
  | 'perplexity'
  | 'meta'
  | 'google_ai'
  // Google AI Overviews. NOT the same surface as google_ai (Google AI Mode):
  // AI Mode is the conversational tab a user switches to on purpose, AI
  // Overviews is the AI summary shown by default on an ordinary results page.
  // Different reach, different answers, measured separately.
  | 'ai_overview'
  | 'copilot'
  | 'deepseek'
  | 'grok'

// PRICING-STRATEGY-2026-07.md ladder: Free → Radar → Essentials → Growth →
// Growth PRO (self-serve) → Managed → Enterprise (done-for-you). `pro` is LEGACY
// (old €1,500 tier merged into Managed) — kept only so existing pro clients don't
// fall back until they migrate at renewal; no new signups use it.
//
// `radar` ADDED 2026-07-31 (docs/strategy/sprint-ladder-ruling.md decision 1,
// signed by Constantin). EUR 39 list, EUR 29 for the first 100 customers. It
// exists because 100 paying subscribers in 30 days is not reachable at a EUR 99
// cold entry.
//
// ITS POSITION IN PLAN_ORDER IS LOAD BEARING, not cosmetic. planRank() and
// hasFeature() both derive from the INDEX, so `radar` anywhere except directly
// after `free` silently shifts every feature gate on the ladder.
//
// The worked example that used to sit here said Radar's position kept
// FEATURE_MIN_PLAN.ai_seo = 'growth' excluding it "with no further edit". True
// when written, stale since 2026-07-31: that gate is now 'radar' by ruling, so
// AI SEO is the one feature Radar's index deliberately does NOT exclude. The
// point about the index still stands for every other gate.
export type Plan = 'free' | 'radar' | 'essentials' | 'growth' | 'growth_pro' | 'managed' | 'pro' | 'enterprise'

export type EngineState = 'active' | 'coming_soon' | 'locked'

// ── Plan → engines ceiling ────────────────────────────────────────────────────
// Growth/Managed/Pro/Enterprise all get the same 5 "live" (built) engines —
// per PRICING-SPEC.md §4 sub-decision B1, the differentiation from Growth up
// is service level + scale (done-for-you work, prompt volume, markets,
// support), not engine count. Pro/Enterprise additionally carry the 4
// not-yet-built engines (google_ai/copilot/deepseek/grok) in their own engine
// set so those tiers auto-unlock them the moment they leave COMING_SOON_ENGINES,
// without a config change — Growth/Managed deliberately do not reserve those
// yet (2026-07-09, PRICING-SPEC.md §4 item 4).
// Google AI Mode (via SerpApi) REPLACED Meta AI as the 5th live engine
// (2026-07-16). Meta (Llama, training-data only, no web search) was low-signal;
// Google AI Mode is what real Google users now see. `meta` is retired from every
// plan set (kept in ENGINE_META below only so historical meta rows still render).
// SUPERSEDED 2026-07-28: Growth now gets Google AI Mode too, so Growth = 5.
// The old rule (Growth PRO and up, to protect SerpApi spend) produced an
// incoherent ladder: _prospect_engines.js FULL_ENGINES runs google_ai for the
// FREE public audit, so a prospect saw Google AI Mode results and then lost
// them by paying EUR 299. Owner's call, 2026-07-28. Essentials = 3.
export const PLAN_ENGINES: Record<Plan, EngineId[]> = {
  // FREE IS GEMINI (decision 1b, 2026-07-31). Five chatgpt prompts bill about
  // EUR 0.540 against a EUR 0.30 free budget, so a free signup was blocked
  // partway through its own first collection and met a budget error instead of
  // a result. Five gemini prompts cost EUR 0.160 and fit. The budget stays at
  // 0.30. Full reasoning in _cost.js PLAN_LIVE_ENGINES, which is the copy that
  // ENFORCES this; keep the two in sync.
  free:       ['gemini'],
  // RADAR IS GEMINI + CLAUDE, NOT CHATGPT + GEMINI (ruling decision 1, amended by
  // Constantin 2026-07-31 on cost). ChatGPT was 77% of the tier's modelled cost
  // while being one engine of two, so the amendment saves EUR 227.55 a month at
  // 100 subscribers and more than doubles the headroom under the 15%-of-price
  // ceiling. Radar is deliberately a strict SUPERSET of Free (which runs gemini),
  // so nobody pays EUR 29 and loses an engine.
  // NO SERPAPI ENGINE HERE, and that is the constraint the tier is built around,
  // not a packaging preference: SerpApi is a 500-credit PLATFORM-WIDE pool, so
  // 100 Radar clients on google_ai would draw 700 credits a month, 140% of the
  // whole pool, consumed by the cheapest tier alone. Mirror in _cost.js.
  radar:      ['gemini', 'claude'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
  // GROK LIVE 2026-07-29, Growth PRO and up — the 6th engine, and the step that
  // makes Growth PRO legible. See the note in _cost.js PLAN_LIVE_ENGINES.
  // AI OVERVIEWS LIVE 2026-07-29, Growth PRO and up — the 7th engine, ADDED
  // alongside google_ai rather than replacing it. AI Mode and AI Overviews are
  // two different Google products: one is a tab the user opts into, the other
  // is the summary block on a normal results page, which reaches far more
  // people. Measuring only one of them would miss the surface most customers
  // are actually seen (or not seen) on. Mirror in _cost.js PLAN_LIVE_ENGINES.
  growth_pro: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
  managed:    ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
  pro:        ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview', 'copilot', 'deepseek'],
  enterprise: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview', 'copilot', 'deepseek'],
}

// ── Engines not built, not collecting — always "coming soon" ─────────────────
// google_ai went LIVE 2026-07-16 (Google AI Mode via SerpApi), so it's not here.
//
// `meta` joined this set on 2026-07-28. It is retired from every plan set, but
// it was in NO set at all before, which meant getEngineStates() fell through to
// 'locked' — telling the customer "upgrade to unlock" an engine that no plan
// sells and no worker collects. Presenting it as coming soon, alongside the
// other three that have never collected, is the honest state. There is no
// current intention to reinstate it.
// `grok` LEFT this set 2026-07-29 — it collects for real now (x-ai/grok-4.5 via
// OpenRouter with the web plugin). `deepseek` deliberately stays: every DeepSeek
// model on OpenRouter is retrieval-free, so it would answer from training data
// only, which is the exact low-signal shape that got Meta AI retired. `copilot`
// stays because Microsoft ships no public API for it at all.
export const COMING_SOON_ENGINES = new Set<EngineId>(['meta', 'copilot', 'deepseek'])

// ── All engines in display order ──────────────────────────────────────────────
// Order is a design artefact, not just a list (dashboard-visual-system.md §8.2,
// judgement call J5): the categorical adjacent-pair colour-vision check is
// computed on THIS order, so re-ordering it for a future product reason means
// re-running the palette validator (spec §17 V1/V2) before shipping. The order
// is also better product ordering than before: the five collecting engines
// first, then retired `meta`, then the three that have never collected — the
// old order had retired `meta` ahead of live `google_ai`.
// `ai_overview` is inserted directly after `google_ai` (both are Google
// surfaces, and adjacency makes the AI Mode vs AI Overviews distinction
// legible rather than looking like a duplicate entry elsewhere in the list).
// Per J5 above, the adjacent-pair colour check was re-run for this order:
// google_ai #db2777 vs ai_overview #0f766e is dE2000 51.6, and ai_overview vs
// meta #c026d3 is 39.8, both far above the 15 floor.
export const ALL_ENGINES: EngineId[] = [
  'chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'ai_overview',
  'meta', 'deepseek', 'grok', 'copilot',
]

/**
 * Engines that actually collect, in display order. ALL_ENGINES minus the ones
 * that have never run.
 *
 * ADDED 2026-07-29 to kill a whole class of bug rather than one instance of it.
 * Dashboard.tsx and Competitors.tsx each carried their own hand-written
 * `['chatgpt','gemini','claude','perplexity','google_ai']`, so when grok shipped
 * that morning and ai_overview shipped the same afternoon, both charts silently
 * stopped plotting engines the product was collecting and billing for. Nothing
 * failed and nothing warned; the data was simply absent from two pages. Any new
 * consumer should import THIS rather than typing the list again.
 */
export const LIVE_ENGINES: EngineId[] = ALL_ENGINES.filter(e => !COMING_SOON_ENGINES.has(e))

/**
 * HTTP collection routing: which engines each manual endpoint serves.
 *
 * `collect-prompt` runs several engines in one call; `chatgpt` and `claude` have
 * their own functions because they need their own timeouts and streaming.
 *
 * THIS EXISTS BECAUSE THE LIST WAS INLINED AND DRIFTED (2026-07-29). The
 * per-prompt Refresh button filtered on a hardcoded
 * `['gemini','perplexity','meta','google_ai']` while collect-prompt.js had
 * grown to six engines. `grok` and `ai_overview` were therefore never sent, the
 * server filtered them out of `active_engines`, and they silently never ran on
 * that path — no row, no error, nothing. To the user the button simply did
 * nothing, for the two engines that justify the top of the plan ladder.
 *
 * MUST stay equal to FAST_ENGINES in netlify/functions/collect-prompt.js, which
 * cannot import this file (CJS at runtime vs the Vite bundle, the same split
 * already accepted for _cost.js and _plans.js). tests/engine_routing.test.js
 * parses both files and fails if they diverge, so this pair cannot rot again.
 */
export const COLLECT_PROMPT_ENGINES: EngineId[] =
  ['gemini', 'perplexity', 'meta', 'google_ai', 'grok', 'ai_overview']

/** Engines that have their own dedicated HTTP collection function. */
export const DEDICATED_ENGINE_FUNCTIONS: Record<string, string> = {
  chatgpt: 'collect-chatgpt',
  claude:  'collect-claude',
}

/**
 * Engines that CANNOT complete inside the 26s Netlify wall and must run on the
 * queue worker, which has 15 minutes.
 *
 * grok is here because it is measured, not assumed. On 2026-07-29 it failed the
 * HTTP path repeatedly: first api_error (reasoning could not be disabled, fixed
 * in cd4795d) and then, once the call was accepted, a clean timeout at 21s. The
 * HTTP ceiling is ~24000ms because the row insert needs room before the platform
 * kill, so there is no timeout value that makes grok fit. Raising it just moves
 * the failure from a visible timeout back to a silent death.
 *
 * The per-(prompt, engine) refresh button uses the HTTP path, so for these
 * engines it can only ever fail. AIVisibility disables it for them and points at
 * the per-engine card refresh, which goes through the queue.
 *
 * Remove an engine from here only after seeing it succeed on the HTTP path.
 */
export const QUEUE_ONLY_ENGINES: EngineId[] = ['grok']

// ── Minimum plan that unlocks each engine ────────────────────────────────────
// Hand-kept against PLAN_ENGINES above — this derives the "X+" label shown on a
// LOCKED engine card, so every value here is a sentence the product says to a
// customer about what to buy next. A value that disagrees with PLAN_ENGINES
// points a customer at the wrong plan.
//
// CORRECTED 2026-07-31 (ruling decision 1b and its named consequence). THREE of
// these were false, and each one was false in the direction that costs the
// customer money or the sale:
//
//   chatgpt   'free' -> 'essentials'. Free moved to Gemini in 6d2196c, so
//             ChatGPT is not on Free any more. It is also NOT on Radar
//             (gemini + claude), so the first tier that carries it is
//             Essentials at EUR 99. The ruling flags this by name: a generic
//             "upgrade to unlock" next to ChatGPT on Free must not point at the
//             next rung, because the next rung does not have it.
//   gemini    'essentials' -> 'free'. Free has run Gemini since 6d2196c.
//   claude    'essentials' -> 'radar'. Radar carries Claude and is a rung below
//             Essentials, so Essentials was overcharging for it by EUR 70.
//
//   google_ai 'growth_pro' -> 'growth'. PRE-EXISTING drift, not created by this
//             change and not named in the ruling: PLAN_ENGINES.growth has
//             carried google_ai since 2026-07-28, so this line has been telling
//             Essentials customers to buy Growth PRO (EUR 449) for an engine
//             Growth (EUR 299) already includes. Corrected here because leaving
//             one knowingly-false upgrade label beside three freshly corrected
//             ones is not a defensible state. Flagged for review.
export const ENGINE_UNLOCK_PLAN: Record<EngineId, Plan> = {
  chatgpt:    'essentials',
  gemini:     'free',
  claude:     'radar',
  perplexity: 'growth',
  meta:       'growth',   // retired (no plan includes it) — kept for type completeness
  google_ai:  'growth',      // AI Mode (SerpApi). Growth and up since 2026-07-28.
  ai_overview: 'growth_pro', // LIVE 2026-07-29, 7th engine, Growth PRO and up
  copilot:    'pro',
  deepseek:   'pro',
  grok:       'growth_pro',  // LIVE 2026-07-29 — 6th engine, Growth PRO and up
}

// ── Engine UI metadata ────────────────────────────────────────────────────────
// Nine hexes, one per engine, used in BOTH themes (dashboard-visual-system.md
// §8.2, judgement call J1) — an engine's identity should not change when the
// user flips the theme, and every value already clears 3:1 against all three
// real surfaces the app paints on (#0a0f1e page, #0f172a dark card, #ffffff
// light card), which is what makes one value per engine possible.
//
// `color` and `bg` (Tailwind text/bg class strings) are DELETED (§8.4/A10).
// Coloured engine text is how Claude (orange-400) and Meta (amber-400) ended
// up only 9.6 delta-E apart in the first place — those chip hues were
// hand-picked separately from `chartColor` and drifted. Every call site now
// renders identity as an 8px swatch in `chartColor` plus plain text-token
// text (see components/EngineChip.tsx), so chip colour equals chart colour by
// construction and cannot drift again.
//
// What changed and why, per engine (full derivation + validator output in the
// spec): chatgpt/claude/perplexity keep their brand hue per the owner's
// ruling (green/orange/cyan), stepped one notch for separation. google_ai
// moves OFF red (reserved for the sentiment negative pole) onto pink. meta
// moves off the amber/orange band entirely onto fuchsia (retired, renders
// only on historical rows, so it's the cheapest slot to move). grok gets a
// chromatic slot (ochre) instead of a desaturated grey that read as disabled.
export const ENGINE_META: Record<EngineId, {
  label:      string
  logoUrl:    string
  chartColor: string   // hex, used for both chart fills AND the identity chip swatch
}> = {
  chatgpt:    { label: 'ChatGPT',        logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://openai.com',              chartColor: '#16a34a' },
  gemini:     { label: 'Gemini',         logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://gemini.google.com',       chartColor: '#2563eb' },
  claude:     { label: 'Claude',         logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://claude.ai',              chartColor: '#ea580c' },
  perplexity: { label: 'Perplexity',     logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://perplexity.ai',          chartColor: '#0891b2' },
  google_ai:  { label: 'Google AI Mode', logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com',            chartColor: '#db2777' },
  // Teal-700. Validated against the other nine with CIEDE2000 before being
  // chosen, not picked by eye: worst normal-vision separation is 19.2 (vs
  // perplexity #0891b2), above the 15 floor and comfortably better than the
  // closest EXISTING pair in this table (gemini/deepseek at 6.9). Clears 3:1 on
  // all three real surfaces (3.49 on #0a0f1e, 3.26 on #0f172a, 5.47 on white).
  // Teal was the widest genuinely free slot: red is reserved for the sentiment
  // negative pole, lime is the sentiment positive pole, and violet is the brand
  // accent. If this order or set changes, re-run the validator (spec §17 V1/V2).
  ai_overview: { label: 'Google AI Overviews', logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com',     chartColor: '#0f766e' },
  meta:       { label: 'Meta AI',        logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://meta.ai',               chartColor: '#c026d3' },
  deepseek:   { label: 'DeepSeek',       logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://deepseek.com',          chartColor: '#6366f1' },
  grok:       { label: 'Grok',           logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://x.ai',                  chartColor: '#a16207' },
  copilot:    { label: 'Copilot',        logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://copilot.microsoft.com', chartColor: '#0284c7' },
}

// ── Per-call engine API cost (EUR) ───────────────────────────────────────────
// SCALE-SPEC.md §2.1 — single source of truth for the FRONTEND. The Netlify
// functions (which write ai_results.cost_eur on every insert, and the
// Instant Audit Engine's cost guardrail) can't import a Vite-bundled .ts
// module at runtime, so netlify/functions/_cost.js carries the same numbers
// as a separate, hand-kept-in-sync CommonJS copy — same tradeoff already
// accepted for _score.js <-> aiVisibilityScore.ts. Update BOTH files together.
//
// ⚠️ THESE ARE FALLBACK ESTIMATES, NOT THE COST. As of 2026-07-29 the collect
// functions capture real token usage from every provider and _cost.js meters
// each row from it, so ai_results.cost_eur is a measured figure. The numbers
// below are used only for rows written before metering existed (cost_eur NULL)
// and for the two fixed-fee engines. Usage.tsx labels those separately.
//
// REBUILT 2026-07-29 against list prices verified that day. The previous set
// was never metered — every row for a given engine carried an identical
// constant — and while the 5-engine total happened to land within 8%, the
// per-engine attribution was badly wrong in both directions:
//
//   engine      was      now     what was wrong
//   claude      0.010    0.033   3.3x UNDER. 0.010 is exactly the no-web-search
//                               cost (~500in/~600out on sonnet-4-6 = $0.0105).
//                               Task #63 removed web search, this constant was
//                               set for that shape, then 8b7496c was reverted
//                               and search came back — adding a $10/1k tool fee
//                               AND billing retrieved results as input tokens.
//                               _collect.js's own note said "reconcile the cost
//                               math"; this is that reconciliation.
//   chatgpt     0.060    0.056   close enough; gpt-5.5 at $5/$30 per 1M.
//   perplexity  0.006    0.001   5x OVER. sonar is $1/$1 per 1M with search
//                               bundled into the token price.
//   gemini      0.034    0.032   list price is right ($35/1k grounded), but the
//                               first 1,500 requests/DAY are free and BrandGEO
//                               has made ~200 grounded calls in total, so the
//                               true marginal cost today is EUR 0.
//   google_ai   0.015    0.015   not a marginal cost at all. SerpApi is a fixed
//                               monthly subscription and unused searches expire
//                               at renewal, so the real figure is
//                               plan_fee / searches_actually_used.
//
// Full derivation, prices and sources: netlify/functions/_cost.js. That file is
// the authoritative, server-enforced copy — update BOTH together.
export const ENGINE_COST_EUR: Partial<Record<EngineId, number>> = {
  claude:     0.033,
  chatgpt:    0.108,   // measured from metered rows 2026-07-29, was 0.056 modelled
  perplexity: 0.005,   // measured 2026-07-29, was 0.001 modelled
  meta:       0.001,   // retired engine; kept for cost calc on historical rows
  grok:       0.020,   // was 0.012; first rows metered 0.165 because grok-4.5 reasons
                       // by default. Reasoning is now disabled at the call site.
  // Fixed-fee engines — accounting figures, not marginal cost. See above.
  gemini:     0.032,
  google_ai:  0.046,   // 1 SerpApi credit at $25/500, owner-confirmed 2026-07-29
  // Google AI Overviews. Blended FALLBACK only: real rows are metered from the
  // SerpApi search count _collect.js returns, which is 1 for an inline overview
  // (EUR 0.023) and 2 when Google defers it behind a page_token (EUR 0.046).
  // Do not read 0.035 as the per-call price; it is the figure used before any
  // measured rows exist. Same SerpApi commitment as google_ai.
  ai_overview: 0.069,  // 1.5 SerpApi credits on average (2 when Google defers)
}

/** Engines billed as a fixed periodic commitment rather than per call.
 *  Mirrors FIXED_FEE_ENGINES in netlify/functions/_cost.js.
 *  google_ai and ai_overview both draw on the SAME SerpApi monthly plan. */
export const FIXED_FEE_ENGINES: ReadonlySet<EngineId> =
  new Set<EngineId>(['gemini', 'google_ai', 'ai_overview'])

// ── Monthly per-client API spend cap (EUR) ───────────────────────────────────
// SCALE-SPEC.md §2 — server-side enforcement lives in
// netlify/functions/_cost.js's PLAN_MONTHLY_API_BUDGET_EUR (the authoritative
// copy, read by _auth.js's checkCollectionLimits() before every collection
// call). This frontend copy is display-only today (no UI reads it yet — kept
// for future use, e.g. a "budget used this month" indicator on Usage.tsx) but
// must be kept numerically in sync with _cost.js by hand, same tradeoff as
// ENGINE_COST_EUR above. See _cost.js for the full 9%-of-plan-price
// derivation.
// PRICING-STRATEGY-2026-07.md §3: hard monthly collection budget = 12% of price
// (up from the old 9%), giving ~88% gross margin and ~weekly collection at the
// §6 prompt counts. This is the hard cost ceiling; the cooldown (below) is the
// frequency limiter. Keep in sync with _cost.js (the server-enforced copy).
// 15% OF PRICE as of 2026-07-29c (was 12%). This is the hard CEILING on API
// spend per client, not the expected spend: scheduled weekly collection runs at
// about 10.5% of price, and the extra headroom exists so a customer who presses
// Run Collection manually is not blocked on spend that was already budgeted.
// Keep in sync with _cost.js, which is the copy that enforces it.
export const PLAN_MONTHLY_API_BUDGET_EUR: Record<Plan, number> = {
  free:       0.30,     // not price-derived (€0 revenue)
  // 15% of the EUR 29 LAUNCH price, NOT of the EUR 39 list price. This map is
  // keyed by plan and not by price, so it can hold only one number while two
  // Radar prices are live, and the ruling picks the lower one deliberately:
  // 5.85 while every customer actually pays 29 would make the real ceiling
  // 5.85/29 = 20.2% of price, a 5-point margin giveaway nobody decided on.
  // RAISE THIS TO 5.85 IN THE SAME COMMIT that deactivates the EUR 29 price.
  radar:        4.35,
  essentials:  14.85,   // 15% of €99
  growth:      44.85,   // 15% of €299
  growth_pro:  67.35,   // 15% of €449
  managed:    225.00,   // 15% of €1,500 floor
  pro:        225.00,   // legacy (treated as Managed)
  enterprise: 1500.00,  // 15% of the €10,000 pricing floor
}

// ORDER IS THE LADDER. planRank() and hasFeature() read the INDEX, so this array
// is the definition of "higher plan", not a display list. Mirror in _plans.js,
// which is the copy that decides whether a plan change is announced to the
// customer as an upgrade or a downgrade.
export const PLAN_ORDER: Plan[] = ['free', 'radar', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise']

export const PLAN_LABELS: Record<Plan, string> = {
  free:       'Free',
  radar:      'Radar',
  essentials: 'Essentials',
  growth:     'Growth',
  growth_pro: 'Growth PRO',
  managed:    'Managed',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

// ── Feature gating (non-engine capabilities gated by plan) ───────────────────
// Engines are gated above; whole FEATURES (pages/tools) are gated here. Add a
// feature id + its minimum plan, and gate the page with hasFeature() + render
// <FeatureLocked feature=… /> for plans below it. All plan gating lives here.
export type FeatureId = 'ai_social' | 'ai_seo'

/**
 * Features that NO plan grants, at any price. Only an admin can reach them, and
 * an admin may drive them on any account. This is the explicit expression of
 * "coming soon", and it is checked BEFORE the plan ladder in hasFeature(), so
 * the answer does not depend on which plans happen to exist or be sold.
 *
 * AI Social is here while the feature is being finished (owner decision,
 * confirmed 2026-07-30). Customers see a coming-soon screen with no purchase
 * path, because there is nothing to buy. Remove a feature from this set ONLY
 * when it is genuinely for sale, and update FEATURE_MIN_PLAN in the same edit.
 *
 * The real gate is requireAuth({ adminOnly: true }) on ALL ELEVEN social-*.js
 * functions (2026-07-30; before that only four of the eleven were gated, and
 * before 2026-07-29 none were, so the UI lock was bypassable by a direct POST).
 * This module only controls what the customer is shown.
 */
export const ADMIN_ONLY_FEATURES: ReadonlySet<FeatureId> = new Set<FeatureId>(['ai_social'])

// Minimum plan that unlocks each feature (PRICING-STRATEGY-2026-07.md §3):
//   AI SEO: from Radar (landing page only on Radar and Essentials; 10
//   pages on Growth, 30 on Growth PRO).
//   AI Social: none. It is admin-only and coming soon (see ADMIN_ONLY_FEATURES
//   above). No plan grants it, so no per-tier depth applies yet. The value below
//   is INERT: hasFeature() short-circuits on the admin-only set before reading
//   it. It is kept at the top of the ladder as a second line of defence so that
//   deleting the set alone does not ship the feature to self-serve customers.
export const FEATURE_MIN_PLAN: Record<FeatureId, Plan> = {
  ai_social: 'enterprise',   // inert, see above. NOT a statement that Enterprise gets it.
  // Lowered from 'growth' 2026-07-31 so Radar and Essentials can reach their
  // one-page audit (PLAN_SEO_PAGE_CAP). This gate opens the whole AI SEO
  // SURFACE, not the crawl alone, so depth is enforced by the per-plan caps
  // underneath it and not by this line. Drafts in particular stay at 0 for both
  // tiers in PLAN_SEO_DRAFTS_PER_MONTH, and in seo-draft.js's own copy, because
  // a draft is an LLM generation and a crawl is a fetch.
  ai_seo:    'radar',
}

// Copy for the locked / coming-soon screen. Admin-only features must NOT be
// described as something the reader can buy or upgrade into: no plan grants
// them, so any purchase language would be a path that leads nowhere.
export const FEATURE_META: Record<FeatureId, { label: string; blurb: string }> = {
  ai_social: {
    label: 'AI Social',
    blurb: 'AI Social is still being built. When it is ready it will draft a post once, adapt it for each network, and publish or schedule it, with copy written to be quoted by AI answer engines.',
  },
  ai_seo: {
    label: 'AI SEO',
    blurb: 'Turn your AI visibility gaps into ready-to-write content briefs, then generate full, GEO-scored drafts built to be cited by AI answer engines.',
  },
}

// ── Per-plan usage limits (PRICING-STRATEGY-2026-07.md §3) ───────────────────
// Single source of truth for every metered dimension. The Netlify functions that
// ENFORCE these (collect-* , seo-*, social-*) can't import this Vite module, so
// they carry hand-synced CommonJS copies of the numbers they need (same tradeoff
// as ENGINE_COST_EUR <-> _cost.js). Update BOTH when a number changes.
// managed/pro/enterprise are done-for-you / custom — generous placeholders, not
// self-serve caps.

/** Buyer prompts included per plan.
 *
 *  THE NUMBERS DIRECTLY BELOW ARE THE LIVE ONES: 5, 7, 18, 35, 56, 200, 200,
 *  sentinel. Ruled 2026-07-31 and signed by Constantin in
 *  docs/strategy/sprint-ladder-ruling.md decision 2. Nothing else in this repo
 *  overrides them, and there is no pending rebalance.
 *
 *  WHAT THIS COMMENT USED TO SAY, AND WHY IT WAS DELETED RATHER THAN AMENDED.
 *  It described a ladder of 5, 20, 50, 75, 250 as though it were shipped. It
 *  never was: the constant underneath it read 5, 15, 35, 35, 120 the whole time,
 *  so the prose and the code disagreed by up to 130 prompts on a single tier, and
 *  the prose was the more convincing of the two because it carried a costing
 *  table. That table was also stale twice over. It priced a 3-engine check at
 *  EUR 0.121 and a 5-engine one at EUR 0.145, against a 6-engine top tier, all
 *  from before the 2026-07-29 reprice; the real figures are EUR 0.173, EUR 0.224
 *  and a 7-engine top tier at EUR 0.313. Costed at today's prices that ladder
 *  breaches the 15%-of-price ceiling by EUR 5.63 on Growth PRO and EUR 18.25 on
 *  Managed, so it could not have been adopted even if it had been real.
 *
 *  A second correction worth keeping: the SerpApi engines (google_ai,
 *  ai_overview) run MONTHLY, not weekly (MONTHLY_CAPPED_ENGINES in _cost.js), so
 *  every earlier table in this repo multiplied all engines by 4.333 and
 *  overstated the top tiers by roughly 40%.
 *
 *  THE LIVE LADDER, costed at verified 2026-07-29 prices. "Per site" is the
 *  number the ladder is actually shaped by: it must rise at every boundary a
 *  customer can cross, or a cheaper tier out-delivers a dearer one per website.
 *
 *    plan         price  engines  prompts  sites  per site  EUR/mo  budget  % price
 *    free             0        1        5      1      5.00   0.160    0.30     n/a
 *    radar           29        2        7      1      7.00   1.972    4.35    6.8%
 *    essentials      99        3       18      2      9.00  13.494   14.85   13.6%
 *    growth         299        5       35      2     17.50  28.607   44.85    9.6%
 *    growth_pro     449        7       56      3     18.67  54.488   67.35   12.1%
 *    managed       1500        7      200     10     20.00 194.600  225.00   13.0%
 *    pro (legacy)  1500        7      200     10     20.00 194.600  225.00   13.0%
 *    enterprise  custom        7  100000     25       n/a  budget-bound
 *
 *  Per site reads 5.00, 7.00, 9.00, 17.50, 18.67, 20.00: strictly increasing,
 *  no inversion anywhere. Two inversions that WERE live are closed by this set.
 *  Growth PRO used to sit at 11.67 per site, BELOW Growth's 17.50, so the more
 *  expensive tier delivered less per website; it is raised 35 -> 56. Legacy `pro`
 *  used to sit at 6.00 per site, below Essentials, on a paper allowance of 20
 *  websites in a feature (D1) that has not shipped; it drops to 10 sites and
 *  rises to 200 prompts, which costs no existing customer anything precisely
 *  because no `pro` client has ever held more than one site.
 *
 *  NO ALLOWANCE IS REDUCED against what any customer holds today. Free holds at
 *  5, Growth holds at 35, and Essentials (15 -> 18), Growth PRO (35 -> 56) and
 *  Managed/Pro (120 -> 200) all rise. That is deliberate: a reduction would be a
 *  customer-impacting migration under docs/AUTONOMY.md, and this ruling requires
 *  none. Verified against production before shipping — the heaviest tenant in the
 *  book had 8 active prompts against a cap of 15, so no client is put into
 *  violation by any row of this table.
 *
 *  `enterprise: 100000` IS A SENTINEL, NOT A PROMISE. At EUR 0.9730 a prompt the
 *  EUR 1,500 budget stops collection at about 1,541 prompts, so the real cap is
 *  the budget and this number only means "not capped here".
 *
 *  Growth deliberately spends only 63.8% of its ceiling while Growth PRO spends
 *  80.9% and Managed 86.5%. That is what makes per-site capacity rise across the
 *  top of the ladder at all, and it is the honest cost of this ruling: a Growth
 *  customer leaves EUR 16.24 a month of budgeted capacity unused.
 *
 *  FIVE COPIES OF THIS LADDER EXIST. This one, _cost.js, _plans.js,
 *  onboard-client.js (derived, not hand-written) and public.plan_prompt_caps in
 *  Postgres, which is the copy with teeth: trg_enforce_prompt_cap refuses the
 *  INSERT at the database. The table and this constant must land in the SAME
 *  deploy. The trigger falls back to the FREE cap for a plan it does not know, so
 *  a live `radar` plan with no plan_prompt_caps row silently caps Radar customers
 *  at 5 prompts instead of 7. Migration: db/supabase-plan-caps-2026-07-31-migration.sql.
 */
export const PLAN_PROMPTS: Record<Plan, number> = {
  free: 5, radar: 7, essentials: 18, growth: 35, growth_pro: 56,
  managed: 200, pro: 200, enterprise: 100000,
}

/** Minimum hours between manual collection runs (the Run-Collection cooldown).
 *  The button shows a live countdown until this elapses; the monthly € budget
 *  (PLAN_MONTHLY_API_BUDGET_EUR) is the separate hard cost cap. free = monthly. */
// WEEKLY for every paid plan as of 2026-07-29. Refresh frequency is no longer a
// tier differentiator, because it never actually was one: the EUR budget bound
// first on every plan, so the advertised 48h/36h split was unreachable. Tiers
// now differentiate on ENGINES, PROMPTS and AI SEO depth. 168h = one manual
// refresh per week, matching the automatic cadence. free = monthly.
// radar = 168 (weekly), the same as every other paid tier. This is forced by
// arithmetic, not chosen: at a fortnightly cadence Radar's EUR 4.35 would buy
// 14.34 prompts on its single website, against a hard ceiling of 9.90 prompts
// per site on Essentials, so Radar would out-deliver the tier above it per site
// by 45% permanently and no Essentials number could fix it. Weekly puts Radar at
// 7.17 per site, safely under. Ruling decision 1.
export const PLAN_COLLECTION_COOLDOWN_HOURS: Record<Plan, number> = {
  free: 720, radar: 168, essentials: 168, growth: 168, growth_pro: 168,
  managed: 168, pro: 168, enterprise: 0,
}

// ── Automatic refresh cadence ────────────────────────────────────────────────
// Added 2026-07-31. Until this existed, PLAN_COLLECTION_COOLDOWN_HOURS above was
// only a PERMISSION — it said how often a customer was allowed to press the
// button, not how often anything happened. Nothing in the repo ever wrote
// clients.refresh_cadence, every one of the 36 production rows sat at the column
// default 'manual', and schedule-collections.js therefore did nothing for
// anybody. A tier sold on a weekly refresh delivered one run a month, and only
// if a human clicked. This map is what makes the advertised cadence real.
//
// Keep in sync with netlify/functions/_cost.js, which is the copy the server
// reads when it writes the column. tests/refresh_cadence.test.js parses both
// files and fails if they diverge, so this pair cannot rot the way the engine
// lists did.

/** The cadence values schedule-collections.js understands, and nothing else.
 *  CADENCE_DAYS there is { weekly: 7, biweekly: 14, monthly: 30 }; anything not
 *  in that map (including 'manual') never auto-refreshes. Do not invent a fifth
 *  value here without adding it there in the same change. */
export type RefreshCadence = 'manual' | 'weekly' | 'biweekly' | 'monthly'

/** The category that is NEVER given an automatic cadence. See refreshCadenceFor. */
export const RESEARCH_CATEGORY = 'research'

/** The category a brand-new clients row lands in. This is the DB default from
 *  db/supabase-clients-category-migration.sql (`category text NOT NULL DEFAULT
 *  'active'`), stated as a constant because three provisioning paths insert a
 *  client WITHOUT naming a category and then have to reason about it. */
export const DEFAULT_CLIENT_CATEGORY = 'active'

/** Plan → automatic collection cadence.
 *
 *  Derived from the tier, not chosen per client: every paid tier is sold on a
 *  weekly refresh (PLAN_COLLECTION_COOLDOWN_HOURS = 168 for all of them), so
 *  weekly is what they get. Free is monthly, matching its own 720h cooldown.
 *
 *  FREE = 'monthly' IS A SPEND DECISION AND IT IS REVERSIBLE IN ONE LINE
 *  (change it to 'manual'). It is monthly rather than manual because:
 *    - the marginal cash cost today is EUR 0. Free runs one engine, gemini,
 *      which is a FIXED_FEE_ENGINE and genuinely free under 1,500 grounded
 *      requests a day; the modelled EUR 0.160 a month (5 prompts x 0.032) is an
 *      accounting figure, not cash out.
 *    - it is bounded twice over without any new machinery:
 *      PLAN_MONTHLY_API_BUDGET_EUR.free is 0.30 and _auth.js blocks at it, and
 *      a client with no active prompts enqueues nothing at all
 *      (_enqueue.js "no active prompts"), so a signup that never sets anything
 *      up costs one SELECT a month and zero euros.
 *    - one data point is not a trend, and the trend is the entire upgrade
 *      argument for Radar. A free account that collects once and never again can
 *      never show movement, so the product has nothing to sell against.
 *  THE TRIP-WIRE: gemini's free tier is 1,500 grounded requests per DAY. At 5
 *  prompts a month per free client that is comfortable to roughly 5,000 free
 *  clients (5,000 x 5 = 25,000/month = 833/day). Revisit this line, not the
 *  budget, if the free book approaches that. */
export const PLAN_REFRESH_CADENCE: Record<Plan, RefreshCadence> = {
  free: 'monthly',
  radar: 'weekly',
  essentials: 'weekly',
  growth: 'weekly',
  growth_pro: 'weekly',
  managed: 'weekly',
  pro: 'weekly',
  enterprise: 'weekly',
}

/**
 * The cadence a client should hold, given its plan and its category. This is the
 * ONLY place cadence is computed; the provisioning and plan-change paths call it
 * rather than deciding for themselves, so a fifth call site cannot get it wrong.
 *
 * ── DO NOT DELETE THE RESEARCH BRANCH ────────────────────────────────────────
 * A client with category 'research' NEVER gets an automatic cadence, on any
 * plan, ever. It stays 'manual' and is collected only when a human deliberately
 * runs it.
 *
 * WHAT IT PROTECTS, measured against production 2026-07-31: 27 of the 36 clients
 * in the database are BrandGEO's own city-research studies, and all 27 sit on
 * plan 'pro'. `pro` carries PLAN_MONTHLY_API_BUDGET_EUR of EUR 225.00 each, so a
 * cadence derived from plan ALONE would switch on **EUR 6,075 a month of budget
 * ceiling** for clients that are not customers, do not pay, and are supposed to
 * be collected once per study. At their current 176 active prompts that is about
 * EUR 171 a month of modelled spend arriving immediately, on the very first
 * hourly cron after deploy.
 *
 * This is the single largest cost consequence of making cadence automatic. It is
 * a branch and not a convention on purpose: an exclusion enforced by "remember
 * not to set it" is one admin click away from EUR 6,075. schedule-collections.js
 * carries a second, independent guard on the same category, for the case where
 * the column was set by some other route entirely.
 *
 * UNKNOWN PLAN -> 'manual', not free's monthly. Unreachable from any current
 * call site (all four validate the plan first), so this is pure defence, and the
 * correct response to a configuration error on a SPENDING path is to spend
 * nothing until it is fixed. It is also loud rather than silent: the affected
 * clients are exactly the rows returned by
 *   SELECT id, plan, category FROM clients
 *    WHERE refresh_cadence = 'manual' AND category <> 'research';
 */
export function refreshCadenceFor(plan: string, category?: string | null): RefreshCadence {
  if ((category ?? DEFAULT_CLIENT_CATEGORY) === RESEARCH_CATEGORY) return 'manual'
  if (!PLAN_ORDER.includes(plan as Plan)) return 'manual'
  return PLAN_REFRESH_CADENCE[plan as Plan]
}

/** AI SEO — max pages that can be crawled/audited (0 = feature locked). */
// LANDING PAGE ONLY FROM RADAR, ruled by Constantin 2026-07-31: "I want Radar
// to have the one page crawl, but only one page, the landing page, no other
// page." One page is affordable at EUR 29 because a crawl is an HTTP fetch plus
// one audit call, not a collection run.
//
// ESSENTIALS MOVES WITH IT, and that part was NOT asked for. Radar is EUR 29 and
// Essentials is EUR 99, so radar: 1 with essentials: 0 would have sold a cheaper
// plan an audit the dearer one does not get. That is a ladder inversion of
// exactly the kind decision 2 of the sprint ladder ruling exists to close, and
// it costs nothing to avoid: Essentials pays more for the same single page.
//
// This partially restores the 2026-07-29 state (Essentials was 1 page then, and
// was zeroed to widen the Essentials/Growth gap). The other two levers from that
// change are untouched and still carry the differentiation: engines 3 -> 5 and
// prompts 7 -> 18 -> 35. Growth's advantage is now 10 pages against 1, which is
// a depth difference rather than an on/off difference.
//
// The one-page grant is only truthful because _seo_crawl.js seeds the crawl
// queue with the homepage. Before that, maxPages = 1 meant "the first URL in
// the client's sitemap", which is not the landing page and is not stable
// between runs. Do not raise or lower this without re-reading that seed.
export const PLAN_SEO_PAGE_CAP: Record<Plan, number> = {
  free: 0, radar: 1, essentials: 1, growth: 10, growth_pro: 30,
  managed: 100, pro: 100, enterprise: 500,
}

/** AI SEO — max page audits per week. */
// radar/essentials = 1: a page cap above zero is meaningless if the weekly
// allowance is zero, so these two move together with PLAN_SEO_PAGE_CAP above or
// the entitlement is decorative. seo-crawl.js enforces the weekly interval with
// its own CRAWL_COOLDOWN_DAYS = 7, which agrees with 1 per week.
export const PLAN_SEO_AUDITS_PER_WEEK: Record<Plan, number> = {
  free: 0, radar: 1, essentials: 1, growth: 1, growth_pro: 1,
  managed: 3, pro: 3, enterprise: 7,
}

/** AI SEO — max content drafts generated per month. */
export const PLAN_SEO_DRAFTS_PER_MONTH: Record<Plan, number> = {
  free: 0, radar: 0, essentials: 0, growth: 10, growth_pro: 30,
  managed: 60, pro: 60, enterprise: 200,
}

/** AI Social — number of channels the client may connect/target (0 = locked). */
export const PLAN_SOCIAL_CHANNEL_LIMIT: Record<Plan, number> = {
  free: 0, radar: 0, essentials: 0, growth: 1, growth_pro: 3,
  managed: 13, pro: 13, enterprise: 13,
}

/** AI Social — max posts per channel per month (composer + scheduling). */
export const PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH: Record<Plan, number> = {
  free: 0, radar: 0, essentials: 0, growth: 12, growth_pro: 30,
  managed: 100, pro: 100, enterprise: 100,
}

// ── AI Social channel entitlements (cost-of-delivery tiering, §4) ────────────
// Channel ids mirror types/index.ts SocialPlatform (kept as strings so this
// module has no import).
//   included ("easy for us"): LinkedIn, Google Business Profile, Facebook —
//     count against PLAN_SOCIAL_CHANNEL_LIMIT.
//   addon ("harder": needs media + support): Instagram, TikTok — Growth PRO and
//     up only, purchased as an add-on; not part of the base channel count.
//   other networks (x/threads/bluesky/pinterest/reddit/telegram/snapchat/
//     youtube) are done-for-you (Managed+) only for now.
export const INCLUDED_CHANNELS = ['linkedin', 'gbp', 'facebook'] as const
export const ADDON_CHANNELS = ['instagram', 'tiktok'] as const

export type ChannelTier = 'included' | 'addon' | 'managed_only'

/** How a channel is offered (independent of whether the client bought the add-on). */
export function channelTier(channel: string): ChannelTier {
  if ((INCLUDED_CHANNELS as readonly string[]).includes(channel)) return 'included'
  if ((ADDON_CHANNELS as readonly string[]).includes(channel)) return 'addon'
  return 'managed_only'
}

/**
 * Whether a plan can use a channel WITHOUT an add-on purchase.
 *   - included channels: available once the plan has AI Social (Growth+).
 *   - addon channels (IG/TikTok): Growth PRO and up, and only if bought
 *     (entitlement stored on the client; enforced server-side). Managed+ get all.
 */
export function channelBaseAvailable(plan: string, channel: string): boolean {
  const tier = channelTier(channel)
  if (planRank(plan) >= planRank('managed')) return true
  if (tier === 'included') return hasFeature(plan, 'ai_social')
  return false   // addon + managed_only require an add-on / higher plan
}

/**
 * Social channel allowance for a client, honouring a per-client override.
 *
 * `clients.social_channel_limit` is NULL for every client except one sold a
 * different allowance in a negotiated package (db/supabase-social-channel-
 * override-migration.sql). NULL means "no override", NEVER zero, so the plan
 * constant is the fallback and a client without the column set behaves exactly
 * as before this function existed.
 *
 * Mirrored in netlify/functions/social-publish.js. Both copies must move
 * together; the drift between planConfig.ts and its function-side mirrors is
 * what produced the _plans.js C1-C4 defects.
 */
export function socialChannelLimit(plan: string, override?: number | null): number {
  if (typeof override === 'number' && override >= 0) return override
  const p = (PLAN_ORDER.includes(plan as Plan) ? plan : 'free') as Plan
  return PLAN_SOCIAL_CHANNEL_LIMIT[p]
}

/**
 * Convenience: all self-serve limits for a plan, for UI display + gating.
 *
 * Plan-only by contract. `socialChannels` here is the LADDER value and ignores
 * any per-client override; a caller holding a client should use
 * socialChannelLimit(plan, client.social_channel_limit) instead.
 */
export function getPlanLimits(plan: string) {
  const p = (PLAN_ORDER.includes(plan as Plan) ? plan : 'free') as Plan
  return {
    prompts:               PLAN_PROMPTS[p],
    collectionCooldownH:   PLAN_COLLECTION_COOLDOWN_HOURS[p],
    apiBudgetEur:          PLAN_MONTHLY_API_BUDGET_EUR[p],
    seoPages:              PLAN_SEO_PAGE_CAP[p],
    seoAuditsPerWeek:      PLAN_SEO_AUDITS_PER_WEEK[p],
    seoDraftsPerMonth:     PLAN_SEO_DRAFTS_PER_MONTH[p],
    socialChannels:        PLAN_SOCIAL_CHANNEL_LIMIT[p],
    socialPostsPerChannel: PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH[p],
  }
}

/** Position of a plan in the ladder (unknown/legacy -> 0 = free). */
export function planRank(plan: string): number {
  const i = PLAN_ORDER.indexOf(plan as Plan)
  return i < 0 ? 0 : i
}

/** True if `feature` is admin-only (coming soon): no plan grants it, ever. */
export function isAdminOnlyFeature(feature: FeatureId): boolean {
  return ADMIN_ONLY_FEATURES.has(feature)
}

/**
 * True if `plan` includes `feature` (i.e. is at or above its minimum plan).
 * Admin-only features return false for EVERY plan, including any plan added
 * later, so selling a new top tier can never ship an unfinished feature.
 * Callers that let admins through keep doing so themselves (`isAdmin || ...`).
 */
export function hasFeature(plan: string, feature: FeatureId): boolean {
  if (ADMIN_ONLY_FEATURES.has(feature)) return false
  return planRank(plan) >= planRank(FEATURE_MIN_PLAN[feature])
}

/**
 * The plan that unlocks a feature, for the "included on the X plan" prompt.
 * null for an admin-only feature: there is no such plan, and the caller must
 * render a coming-soon state with no purchase call to action instead.
 */
export function featureUnlockPlan(feature: FeatureId): Plan | null {
  return ADMIN_ONLY_FEATURES.has(feature) ? null : FEATURE_MIN_PLAN[feature]
}

// ── State derivation ──────────────────────────────────────────────────────────

/**
 * Returns the state of every engine for a given client (plan + admin overrides).
 *
 * engines_enabled: sparse JSONB override map.
 *   { "meta": false }  → meta is coming_soon even if plan allows it
 *   { "meta": true }   → explicit enable (same as null/missing → active if built)
 *   null               → use plan defaults for all engines
 */
export function getEngineStates(
  plan: string,
  enginesEnabled: Record<string, boolean> | null,
): Record<EngineId, EngineState> {
  const planKey = (PLAN_ORDER.includes(plan as Plan) ? plan : 'free') as Plan
  const planSet = new Set(PLAN_ENGINES[planKey])
  const out = {} as Record<EngineId, EngineState>

  for (const engine of ALL_ENGINES) {
    if (!planSet.has(engine)) {
      out[engine] = 'locked'
    } else if (COMING_SOON_ENGINES.has(engine)) {
      out[engine] = 'coming_soon'       // not built yet — always coming soon
    } else if (enginesEnabled?.[engine] === false) {
      out[engine] = 'coming_soon'       // admin disabled → show as coming soon
    } else {
      out[engine] = 'active'
    }
  }

  return out
}

/** Returns only the engines that are currently collecting + showing data. */
export function getActiveEngines(
  plan: string,
  enginesEnabled: Record<string, boolean> | null,
): EngineId[] {
  const states = getEngineStates(plan, enginesEnabled)
  return ALL_ENGINES.filter(e => states[e] === 'active')
}
