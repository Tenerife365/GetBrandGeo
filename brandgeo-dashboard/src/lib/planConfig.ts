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

export type Plan = 'free' | 'essentials' | 'growth' | 'managed' | 'pro' | 'enterprise'

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
export const PLAN_ENGINES: Record<Plan, EngineId[]> = {
  free:       ['chatgpt'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
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
  google_ai:  'growth',   // Google AI Mode is now the 5th live engine, from Growth up
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
  claude:     { label: 'Claude',    color: 'text-purple-400',  bg: 'bg-purple-400/10',  logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://claude.ai',              chartColor: '#a855f7' },
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
export const PLAN_MONTHLY_API_BUDGET_EUR: Record<Plan, number> = {
  free: 0.30,
  essentials: 8.91,
  growth: 26.91,
  managed: 81.00,
  pro: 135.00,
  enterprise: 900.00,
}

export const PLAN_ORDER: Plan[] = ['free', 'essentials', 'growth', 'managed', 'pro', 'enterprise']

export const PLAN_LABELS: Record<Plan, string> = {
  free:       'Free',
  essentials: 'Essentials',
  growth:     'Growth',
  managed:    'Managed',
  pro:        'Pro',
  enterprise: 'Enterprise',
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
