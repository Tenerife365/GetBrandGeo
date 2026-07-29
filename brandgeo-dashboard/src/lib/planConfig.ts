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

// PRICING-STRATEGY-2026-07.md ladder: Free → Essentials → Growth → Growth PRO
// (self-serve) → Managed → Enterprise (done-for-you). `pro` is LEGACY (old €1,500
// tier merged into Managed) — kept only so existing pro clients don't fall back
// until they migrate at renewal; no new signups use it.
export type Plan = 'free' | 'essentials' | 'growth' | 'growth_pro' | 'managed' | 'pro' | 'enterprise'

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
  free:       ['chatgpt'],
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
// Kept in sync with PLAN_ENGINES above by hand — derive the "X+" label shown
// on locked engine cards. perplexity/meta moved to 'growth' (was
// managed/pro) and google_ai moved to 'pro' (was managed) to match the
// PLAN_ENGINES change above (2026-07-09).
export const ENGINE_UNLOCK_PLAN: Record<EngineId, Plan> = {
  chatgpt:    'free',
  gemini:     'essentials',
  claude:     'essentials',
  perplexity: 'growth',
  meta:       'growth',   // retired (no plan includes it) — kept for type completeness
  google_ai:  'growth_pro',  // AI Mode (SerpApi) is Growth PRO and up only (PRICING-STRATEGY-2026-07)
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
  essentials:  14.85,   // 15% of €99
  growth:      44.85,   // 15% of €299
  growth_pro:  67.35,   // 15% of €449
  managed:    225.00,   // 15% of €1,500 floor
  pro:        225.00,   // legacy (treated as Managed)
  enterprise: 1500.00,  // 15% of the €10,000 pricing floor
}

export const PLAN_ORDER: Plan[] = ['free', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise']

export const PLAN_LABELS: Record<Plan, string> = {
  free:       'Free',
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

// Minimum plan that unlocks each feature (PRICING-STRATEGY-2026-07.md §3):
//   AI SEO   — from Essentials (1 landing page; 10 on Growth, 30 on Growth PRO).
//   AI Social — from Growth (1 channel; 3 on Growth PRO). Per-tier depth is in
//   the PLAN_* limit tables below, not here.
export const FEATURE_MIN_PLAN: Record<FeatureId, Plan> = {
  // ai_social is ADMIN-ONLY while the feature is finished (2026-07-29).
  // Customers see it as coming soon; admins drive it for any account to test.
  // The real gate is requireAuth({ adminOnly: true }) on the three social-*.js
  // functions — this constant only controls customer-facing copy, and until
  // 2026-07-29 there was NO server-side gate at all, so the UI lock was
  // bypassable by a direct POST.
  ai_social: 'enterprise',
  ai_seo:    'growth',
}

// Copy for the locked/upgrade screen.
export const FEATURE_META: Record<FeatureId, { label: string; blurb: string }> = {
  ai_social: {
    label: 'AI Social',
    blurb: 'Write a post once, adapt it for each network, and schedule or publish to all your social channels from one place, with AI drafting copy built to be quoted by AI answer engines.',
  },
  ai_seo: {
    label: 'AI SEO',
    blurb: 'Turn your AI visibility gaps into ready-to-write content briefs, then generate full, GEO-scored drafts built to be cited by AI answer engines, and hand them straight to AI Social.',
  },
}

// ── Per-plan usage limits (PRICING-STRATEGY-2026-07.md §3) ───────────────────
// Single source of truth for every metered dimension. The Netlify functions that
// ENFORCE these (collect-* , seo-*, social-*) can't import this Vite module, so
// they carry hand-synced CommonJS copies of the numbers they need (same tradeoff
// as ENGINE_COST_EUR <-> _cost.js). Update BOTH when a number changes.
// managed/pro/enterprise are done-for-you / custom — generous placeholders, not
// self-serve caps.

/** Buyer prompts included per plan. */
/* RESIZED 2026-07-29. Prompt caps are now derived from what the monthly EUR
   budget can actually sustain at a WEEKLY collection cadence, instead of being
   picked and then silently blocked by the budget gate.

   Per-prompt cost at the rebuilt prices (google_ai on SerpApi Starter):
     3-engine (Essentials)  EUR 0.121
     5-engine (Growth up)   EUR 0.145
   Weekly = 4.33 runs/month. Budget = 12% of plan price.

     plan         budget    max @ weekly   set to   budget used
     essentials   11.88            22        20         88%
     growth       35.88            57        50         88%
     growth_pro   53.88            85        75         87%
     managed     180.00           286       250         87%

   ~12% headroom is left on every tier so an occasional MANUAL refresh does not
   immediately trip the hard block in _auth.js. A client who refreshes manually
   and often will still hit it — that is the budget doing its job, and the UI
   already surfaces both the cooldown countdown and the budget message.

   free stays at 5 prompts and MONTHLY (not weekly): its EUR 0.30 budget buys
   exactly one 1-engine run of 5 prompts.

   REBALANCED TWICE ON 2026-07-29, and the second pass undid the first.
   29b cut growth_pro 75 -> 70 and managed 250 -> 230 to fit a 6th engine
   (Grok, +EUR 0.012/prompt) under a 12%-of-price ceiling. 29c raised that
   ceiling to 15% on the owner's instruction, which removed the reason for the
   cut, so both are restored. Net effect of the day: an extra engine on Growth
   PRO and up, and no allowance was reduced.

   READ THE LAST COLUMN AS A SHARE OF REVENUE, not of the budget. An earlier
   version of this table showed "% of budget used" (~88%) with no label, which
   read as if 88 cents of every euro went to inference. It does not.

     plan          engines  prompts  EUR/run  weekly EUR/mo  price   % of price
     free                1      5      0.28          0.28*      0        n/a
     essentials          3     20      2.42         10.49       99      10.6%
     growth              5     50      7.25         31.41      299      10.5%
     growth_pro          6     75     11.78         51.02      449      11.4%
     managed             6    250     39.25        170.07     1500      11.3%
   * free is monthly, not weekly.

   The hard ceiling is 15% of price (PLAN_MONTHLY_API_BUDGET_EUR), so scheduled
   collection uses roughly two thirds of each client's allowance and the rest
   absorbs manual refreshes. True cash out is lower again, 6.5-7.8% of price,
   because gemini (free under 1,500 requests/day) and google_ai (fixed SerpApi
   subscription) sit inside the modelled figure without being marginal spend. */
export const PLAN_PROMPTS: Record<Plan, number> = {
  free: 5, essentials: 15, growth: 35, growth_pro: 35,
  managed: 120, pro: 120, enterprise: 100000,
}

/** Minimum hours between manual collection runs (the Run-Collection cooldown).
 *  The button shows a live countdown until this elapses; the monthly € budget
 *  (PLAN_MONTHLY_API_BUDGET_EUR) is the separate hard cost cap. free = monthly. */
// WEEKLY for every paid plan as of 2026-07-29. Refresh frequency is no longer a
// tier differentiator, because it never actually was one: the EUR budget bound
// first on every plan, so the advertised 48h/36h split was unreachable. Tiers
// now differentiate on ENGINES, PROMPTS and AI SEO depth. 168h = one manual
// refresh per week, matching the automatic cadence. free = monthly.
export const PLAN_COLLECTION_COOLDOWN_HOURS: Record<Plan, number> = {
  free: 720, essentials: 168, growth: 168, growth_pro: 168,
  managed: 168, pro: 168, enterprise: 0,
}

/** AI SEO — max pages that can be crawled/audited (0 = feature locked). */
// MOVED TO GROWTH+ 2026-07-29 (was Essentials at 1 page). Site audit is now one
// of the three things separating Essentials from Growth, alongside engines
// (3 -> 5) and prompts (20 -> 50).
export const PLAN_SEO_PAGE_CAP: Record<Plan, number> = {
  free: 0, essentials: 0, growth: 10, growth_pro: 30,
  managed: 100, pro: 100, enterprise: 500,
}

/** AI SEO — max page audits per week. */
export const PLAN_SEO_AUDITS_PER_WEEK: Record<Plan, number> = {
  free: 0, essentials: 0, growth: 1, growth_pro: 1,
  managed: 3, pro: 3, enterprise: 7,
}

/** AI SEO — max content drafts generated per month. */
export const PLAN_SEO_DRAFTS_PER_MONTH: Record<Plan, number> = {
  free: 0, essentials: 0, growth: 10, growth_pro: 30,
  managed: 60, pro: 60, enterprise: 200,
}

/** AI Social — number of channels the client may connect/target (0 = locked). */
export const PLAN_SOCIAL_CHANNEL_LIMIT: Record<Plan, number> = {
  free: 0, essentials: 0, growth: 1, growth_pro: 3,
  managed: 13, pro: 13, enterprise: 13,
}

/** AI Social — max posts per channel per month (composer + scheduling). */
export const PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH: Record<Plan, number> = {
  free: 0, essentials: 0, growth: 12, growth_pro: 30,
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

/** Convenience: all self-serve limits for a plan, for UI display + gating. */
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

/** True if `plan` includes `feature` (i.e. is at or above its minimum plan). */
export function hasFeature(plan: string, feature: FeatureId): boolean {
  return planRank(plan) >= planRank(FEATURE_MIN_PLAN[feature])
}

/** The minimum plan that unlocks a feature (for the "Upgrade to X" prompt). */
export function featureUnlockPlan(feature: FeatureId): Plan {
  return FEATURE_MIN_PLAN[feature]
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
