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
export const PLAN_ENGINES: Record<Plan, EngineId[]> = {
  free:       ['chatgpt'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
  managed:    ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta'],
  pro:        ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta', 'google_ai', 'copilot', 'deepseek', 'grok'],
  enterprise: ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta', 'google_ai', 'copilot', 'deepseek', 'grok'],
}

// ── Engines not yet built/collecting — always "coming soon" ──────────────────
export const COMING_SOON_ENGINES = new Set<EngineId>(['google_ai', 'copilot', 'deepseek', 'grok'])

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
  meta:       'growth',
  google_ai:  'pro',
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
  google_ai:  { label: 'Google AI', color: 'text-red-400',     bg: 'bg-red-400/10',     logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://ai.google',             chartColor: '#ef4444' },
  copilot:    { label: 'Copilot',   color: 'text-sky-400',     bg: 'bg-sky-400/10',     logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://copilot.microsoft.com', chartColor: '#38bdf8' },
  deepseek:   { label: 'DeepSeek',  color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://deepseek.com',          chartColor: '#818cf8' },
  grok:       { label: 'Grok',      color: 'text-slate-300',   bg: 'bg-slate-300/10',   logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://x.ai',                  chartColor: '#94a3b8' },
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
