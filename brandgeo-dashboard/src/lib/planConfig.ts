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
// PRICING-STRATEGY-2026-07.md §3: Growth = 4 engines (NO Google AI Mode);
// Google AI Mode (SerpApi, the expensive engine) is Growth PRO and up only, to
// protect SerpApi spend. Essentials = 3.
export const PLAN_ENGINES: Record<Plan, EngineId[]> = {
  free:       ['chatgpt'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity'],
  growth_pro: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
  managed:    ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
  pro:        ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'copilot', 'deepseek', 'grok'],
  enterprise: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'copilot', 'deepseek', 'grok'],
}

// ── Engines not yet built/collecting — always "coming soon" ──────────────────
// google_ai went LIVE 2026-07-16 (Google AI Mode via SerpApi), so it's no longer here.
export const COMING_SOON_ENGINES = new Set<EngineId>(['copilot', 'deepseek', 'grok'])

// ── All engines in display order ──────────────────────────────────────────────
export const ALL_ENGINES: EngineId[] = [
  'chatgpt', 'gemini', 'claude', 'perplexity', 'meta',
  'google_ai', 'copilot', 'deepseek', 'grok',
]

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
  copilot:    'pro',
  deepseek:   'pro',
  grok:       'pro',
}

// ── Engine UI metadata ────────────────────────────────────────────────────────
export const ENGINE_META: Record<EngineId, {
  label:      string
  color:      string   // Tailwind text class
  bg:         string   // Tailwind bg class
  logoUrl:    string
  chartColor: string   // hex for recharts
}> = {
  chatgpt:    { label: 'ChatGPT',   color: 'text-emerald-400', bg: 'bg-emerald-400/10', logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://openai.com',              chartColor: '#10b981' },
  gemini:     { label: 'Gemini',    color: 'text-blue-400',    bg: 'bg-blue-400/10',    logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://gemini.google.com',       chartColor: '#3b82f6' },
  claude:     { label: 'Claude',    color: 'text-orange-400',  bg: 'bg-orange-400/10',  logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://claude.ai',              chartColor: '#f97316' },
  perplexity: { label: 'Perplexity',color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://perplexity.ai',          chartColor: '#06b6d4' },
  meta:       { label: 'Meta AI',   color: 'text-amber-400',   bg: 'bg-amber-400/10',   logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://meta.ai',               chartColor: '#f59e0b' },
  google_ai:  { label: 'Google AI Mode', color: 'text-red-400', bg: 'bg-red-400/10',     logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://google.com',            chartColor: '#ef4444' },
  copilot:    { label: 'Copilot',   color: 'text-sky-400',     bg: 'bg-sky-400/10',     logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://copilot.microsoft.com', chartColor: '#38bdf8' },
  deepseek:   { label: 'DeepSeek',  color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://deepseek.com',          chartColor: '#818cf8' },
  grok:       { label: 'Grok',      color: 'text-slate-300',   bg: 'bg-slate-300/10',   logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://x.ai',                  chartColor: '#94a3b8' },
}

// ── Per-call engine API cost (EUR) ───────────────────────────────────────────
// SCALE-SPEC.md §2.1 — single source of truth for the FRONTEND. The Netlify
// functions (which write ai_results.cost_eur on every insert, and the
// Instant Audit Engine's cost guardrail) can't import a Vite-bundled .ts
// module at runtime, so netlify/functions/_cost.js carries the same numbers
// as a separate, hand-kept-in-sync CommonJS copy — same tradeoff already
// accepted for _score.js <-> aiVisibilityScore.ts. Update BOTH files together.
//
// REPRICED 2026-07-10 (SCALE-SPEC.md §1.1, CLAUDE.md §12.3) after Claude's
// web_search tool was removed and ChatGPT's reasoning effort was capped to
// 'low'. See _cost.js for full per-engine confidence notes (gemini MEDIUM,
// chatgpt MEDIUM, the rest HIGH) — these are derived from published rate
// cards + measured response size, not an invoice, and are not exact. Only
// the 5 currently-built engines have a real cost; the other 4
// (google_ai/copilot/deepseek/grok) never collect.
//
// ⚠️ gemini CORRECTED 2026-07-13 (CLAUDE.md §12.3b), 0.020 → 0.034 — this
// value had drifted out of sync with netlify/functions/_cost.js (the
// authoritative, server-enforced copy). 0.020 was priced for
// gemini-3.5-flash grounding; that model was reverted back to
// gemini-2.5-flash after it timed out on 10/10 grounded calls in
// production, and 2.5-flash bills a flat $35/1k grounded prompts ≈ €0.034,
// not 3.5's per-search-query rate. This file is display-only (no server-side
// enforcement reads it), but a stale value here still misleads anyone
// reading Usage.tsx's cost estimator. Keep in sync with _cost.js by hand.
export const ENGINE_COST_EUR: Partial<Record<EngineId, number>> = {
  claude:     0.010,
  chatgpt:    0.060,
  gemini:     0.034,
  perplexity: 0.006,
  meta:       0.001,   // retired engine; kept for cost calc on historical rows
  google_ai:  0.015,   // SerpApi Google AI Mode, per-search — PLACEHOLDER, true up to your SerpApi plan's per-search price
}

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
export const PLAN_MONTHLY_API_BUDGET_EUR: Record<Plan, number> = {
  free:       0.30,
  essentials: 11.88,    // 12% of €99
  growth:     35.88,    // 12% of €299
  growth_pro: 53.88,    // 12% of €449
  managed:    180.00,   // 12% of €1,500 floor
  pro:        180.00,   // legacy (treated as Managed)
  enterprise: 1200.00,  // custom; generous default
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
  ai_social: 'growth',
  ai_seo:    'essentials',
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
export const PLAN_PROMPTS: Record<Plan, number> = {
  free: 5, essentials: 20, growth: 75, growth_pro: 100,
  managed: 1000, pro: 1000, enterprise: 100000,
}

/** Minimum hours between manual collection runs (the Run-Collection cooldown).
 *  The button shows a live countdown until this elapses; the monthly € budget
 *  (PLAN_MONTHLY_API_BUDGET_EUR) is the separate hard cost cap. free = monthly. */
export const PLAN_COLLECTION_COOLDOWN_HOURS: Record<Plan, number> = {
  free: 720, essentials: 72, growth: 48, growth_pro: 36,
  managed: 0, pro: 0, enterprise: 0,
}

/** AI SEO — max pages that can be crawled/audited (0 = feature locked). */
export const PLAN_SEO_PAGE_CAP: Record<Plan, number> = {
  free: 0, essentials: 1, growth: 10, growth_pro: 30,
  managed: 100, pro: 100, enterprise: 500,
}

/** AI SEO — max page audits per week. */
export const PLAN_SEO_AUDITS_PER_WEEK: Record<Plan, number> = {
  free: 0, essentials: 1, growth: 1, growth_pro: 1,
  managed: 3, pro: 3, enterprise: 7,
}

/** AI SEO — max content drafts generated per month. */
export const PLAN_SEO_DRAFTS_PER_MONTH: Record<Plan, number> = {
  free: 0, essentials: 2, growth: 10, growth_pro: 30,
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
