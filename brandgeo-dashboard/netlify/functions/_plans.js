// ============================================================================
// _plans.js  --  CommonJS mirror of the plan facts the frontend keeps in
// src/lib/planConfig.ts. Netlify functions can't import the Vite-bundled .ts at
// runtime, so the ladder, the labels and the human blurbs are carried here as a
// hand-synced copy (same tradeoff already accepted for _cost.js <-> planConfig
// ENGINE_COST_EUR and _score.js <-> aiVisibilityScore.ts).
// UPDATE PLAN_ORDER / PLAN_LABELS / PLAN_BLURB TOGETHER WITH planConfig.ts.
//
// The per-plan ENGINE table is deliberately NOT mirrored here any more. It used
// to be (a PLAN_ENGINES map plus a LIVE_ENGINES filter set) and it drifted:
// Growth was promising a fifth engine it is not entitled to, and growth_pro was
// missing from every table in this file (docs/qa/plans-divergence-b1.md F1-F4).
// planUnlocks() now derives engines from _cost.js's PLAN_LIVE_ENGINES through
// activeEnginesFor(), which is the copy that ENFORCES entitlement, so what the
// upgrade email promises and what the collection queue actually runs cannot
// disagree. Do not reintroduce a per-plan engine table here.
// ============================================================================

const { activeEnginesFor } = require('./_cost');

// Mirror of planConfig.ts:159 (PLAN_ORDER). growth_pro is ladder position 3.
const PLAN_ORDER = ['free', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise'];

// Mirror of planConfig.ts:161-:169 (PLAN_LABELS).
const PLAN_LABELS = {
  free: 'Free', essentials: 'Essentials', growth: 'Growth', growth_pro: 'Growth PRO',
  managed: 'Managed', pro: 'Pro', enterprise: 'Enterprise',
};

// Engine id -> human label, for the congrats email + banner. Display only; the
// per-plan engine SET comes from _cost.js, never from this file.
// EVERY engine id that activeEnginesFor() can return MUST have a key here.
// planUnlocks() does `ENGINE_LABELS[e] || e`, so a missing key does not throw,
// it prints the raw id. `ai_overview` was missing for the few hours between the
// engine shipping and this line, which would have emailed a customer the literal
// string "ai_overview" in the list of what their EUR 449 just bought. This file
// is the copy a paying customer reads at the moment they are charged.
const ENGINE_LABELS = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', perplexity: 'Perplexity',
  meta: 'Meta AI', google_ai: 'Google AI Mode', ai_overview: 'Google AI Overviews',
  copilot: 'Copilot', deepseek: 'DeepSeek', grok: 'Grok',
};

// One human line per plan, for the congrats email + banner body. Every claim
// here has to be true of the plan it describes: this text is sent to a customer
// at the moment they are charged. Engine counts must match _cost.js's
// PLAN_LIVE_ENGINES; limits come from planConfig.ts's PLAN_* tables.
const PLAN_BLURB = {
  // Named the engine, so it changed when the engine did (1b, 2026-07-31). This
  // text is sent to a customer at the moment they are charged, and it would have
  // promised ChatGPT to someone whose account collects Gemini.
  free:       'A single AI engine (Gemini) so you can see where your brand stands.',
  essentials: 'The three core AI engines, self-serve, for teams that run their own visibility.',
  // CORRECTED 2026-07-29. Three claims here were false at the moment of charge.
  // `growth` sold AI Social, which is admin-only and shows as coming soon to
  // customers. `growth_pro` sold "a faster refresh cycle", which stopped being
  // true when every paid plan moved to the same weekly cadence. `managed` said
  // five engines when it now has seven.
  growth:     'All five live AI engines, including Google AI Mode, plus site audit, for brands scaling their AI presence.',
  growth_pro: 'Two more AI engines than Growth, Grok and Google AI Overviews, at the same prompt allowance, plus three times the SEO page depth and more social channels.',
  managed:    'A done-for-you service across all seven live AI engines, with our team running your visibility and acting on the findings.',
  pro:        'Everything in Managed at higher volume, more markets, and priority support, with the next wave of engines unlocking automatically.',
  enterprise: 'Custom scale, dedicated support, and bespoke reporting for large brands and agencies.',
};

function isValidPlan(p) {
  return typeof p === 'string' && PLAN_ORDER.includes(p);
}

function planRank(p) {
  const i = PLAN_ORDER.indexOf(p);
  return i < 0 ? 0 : i;
}

// What a plan unlocks, in human terms, for notifications. engineLabels is
// derived from _cost.js's activeEnginesFor(), so it is exactly the set of
// engines the queue will run for this plan.
function planUnlocks(plan) {
  const key = isValidPlan(plan) ? plan : 'free';
  const engineLabels = activeEnginesFor(key, null).map((e) => ENGINE_LABELS[e] || e);
  return {
    plan: key,
    label: PLAN_LABELS[key],
    engineLabels,
    blurb: PLAN_BLURB[key],
  };
}

module.exports = {
  PLAN_ORDER, PLAN_LABELS, ENGINE_LABELS, PLAN_BLURB,
  isValidPlan, planRank, planUnlocks,
};
