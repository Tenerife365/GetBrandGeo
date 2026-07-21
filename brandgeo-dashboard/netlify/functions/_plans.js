// ============================================================================
// _plans.js  --  CommonJS mirror of the plan config the frontend keeps in
// src/lib/planConfig.ts. Netlify functions can't import the Vite-bundled .ts at
// runtime, so this carries the same plan facts as a hand-synced copy (same
// tradeoff already accepted for _cost.js <-> planConfig ENGINE_COST_EUR and
// _score.js <-> aiVisibilityScore.ts). UPDATE THIS TOGETHER WITH planConfig.ts.
// ============================================================================

const PLAN_ORDER = ['free', 'essentials', 'growth', 'managed', 'pro', 'enterprise'];

const PLAN_LABELS = {
  free: 'Free', essentials: 'Essentials', growth: 'Growth',
  managed: 'Managed', pro: 'Pro', enterprise: 'Enterprise',
};

// Mirror of PLAN_ENGINES (planConfig.ts). Kept as internal engine ids.
const PLAN_ENGINES = {
  free:       ['chatgpt'],
  essentials: ['chatgpt', 'gemini', 'claude'],
  growth:     ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
  managed:    ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai'],
  pro:        ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'copilot', 'deepseek', 'grok'],
  enterprise: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'copilot', 'deepseek', 'grok'],
};

// Engines built + collecting today (the rest are "coming soon"). Mirror of
// planConfig COMING_SOON_ENGINES inverted, so the congrats email only promises
// engines that actually return data.
const LIVE_ENGINES = new Set(['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai']);

const ENGINE_LABELS = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', perplexity: 'Perplexity',
  meta: 'Meta AI', google_ai: 'Google AI Mode', copilot: 'Copilot',
  deepseek: 'DeepSeek', grok: 'Grok',
};

// One human line per plan, for the congrats email + banner body.
const PLAN_BLURB = {
  free:       'A single AI engine (ChatGPT) so you can see where your brand stands.',
  essentials: 'The three core AI engines, self-serve, for teams that run their own visibility.',
  growth:     'Five AI engines with more prompts and markets — for brands scaling their AI presence.',
  managed:    'A done-for-you service across all five live AI engines, with our team running your visibility and acting on the findings.',
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

// What a plan unlocks, in human terms, for notifications.
function planUnlocks(plan) {
  const key = isValidPlan(plan) ? plan : 'free';
  const engineLabels = (PLAN_ENGINES[key] || [])
    .filter((e) => LIVE_ENGINES.has(e))
    .map((e) => ENGINE_LABELS[e] || e);
  return {
    plan: key,
    label: PLAN_LABELS[key],
    engineLabels,
    blurb: PLAN_BLURB[key],
  };
}

module.exports = {
  PLAN_ORDER, PLAN_LABELS, PLAN_ENGINES, LIVE_ENGINES, ENGINE_LABELS, PLAN_BLURB,
  isValidPlan, planRank, planUnlocks,
};
