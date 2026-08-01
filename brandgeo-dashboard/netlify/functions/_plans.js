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

// Mirror of planConfig.ts PLAN_ORDER. MUST match it index for index, for all
// eight plans. planRank() below reads the INDEX, and set-client-plan.js:47 uses
// planRank to decide whether a plan change is announced to the customer as an
// upgrade or a downgrade. When growth_pro was missing from this array it ranked
// 0, so a EUR 449 upgrade was emailed to the buyer in downgrade tone with the
// Free plan's blurb. A plan missing here does not throw; it silently becomes
// Free (see planUnlocks below). That is the defect class this file has already
// shipped once, so verify against planConfig.ts rather than assuming.
// `radar` inserted at position 1, 2026-07-31 (ruling decision 1).
const PLAN_ORDER = ['free', 'radar', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise'];

// Mirror of planConfig.ts PLAN_LABELS.
const PLAN_LABELS = {
  free: 'Free', radar: 'Radar', essentials: 'Essentials', growth: 'Growth',
  growth_pro: 'Growth PRO', managed: 'Managed', pro: 'Pro', enterprise: 'Enterprise',
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
  // Every claim here is checked against what the tier actually grants, because
  // this string is sent to a customer at the moment they are charged: two
  // engines (PLAN_LIVE_ENGINES.radar), seven prompts (PLAN_PROMPTS.radar),
  // weekly (PLAN_COLLECTION_COOLDOWN_HOURS.radar = 168), one website. It does
  // not mention ChatGPT, which Radar does not carry, and it does not promise a
  // prompt count above the tier's own (ruling decision 4).
  // "checked weekly" WAS a promise the product did not keep (bg-verify F2):
  // nothing wrote clients.refresh_cadence, every row sat at the column default
  // 'manual', schedule-collections was inert, and no automatic collection ever
  // happened for anyone.
  //
  // RESTORED 2026-07-31, in the same change that made it true, exactly as the
  // note here asked. refreshCadenceFor() in _cost.js now derives the cadence from
  // the tier and five paths write it whenever a plan is established, so a Radar
  // client is provisioned with refresh_cadence='weekly' and the hourly
  // schedule-collections cron collects them. The other half of the claim was
  // already true and still is: PLAN_COLLECTION_COOLDOWN_HOURS.radar is 168, so
  // the customer may also force a fresh check once a week themselves.
  //
  // THE ONE CAVEAT, and it is why this says "from signup". No backfill was run,
  // so a client that existed before that change keeps 'manual' until its plan is
  // next written. Every Radar client is necessarily new, so the claim holds for
  // every reader of this string. If Radar is ever granted to a pre-existing
  // client by some route that does not write cadence, this sentence stops being
  // true for them.
  radar:      'Two AI engines, Gemini and Claude, across seven buyer prompts for one website, checked automatically every week from the day you sign up.',
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

// ── Per-plan self-serve limits ───────────────────────────────────────────────
// Mirror of planConfig.ts's five limit tables, in this order: PLAN_SEO_PAGE_CAP,
// PLAN_SEO_AUDITS_PER_WEEK, PLAN_SEO_DRAFTS_PER_MONTH, PLAN_SOCIAL_CHANNEL_LIMIT
// and PLAN_SOCIAL_POSTS_PER_CHANNEL_MONTH. UPDATE THEM TOGETHER, and note that
// tests/plan_limits_drift.test.js will fail the moment they disagree.
//
// 0 MEANS LOCKED, and on the SEO paths the number IS the gate: seo-crawl.js has
// no hasFeature() call, it refuses on `maxPages <= 0` and nothing else. So a
// wrong value here is an entitlement leak, not a display bug.
//
// WHY ONE TABLE INSTEAD OF ONE PER FUNCTION. Every consumer used to hand-write
// its own copy, and on 2026-07-31 all of them were wrong at once: seo-crawl.js
// and seo-draft.js each disagreed with planConfig.ts on `essentials`, and none
// of the three carried `radar` at all. seo-crawl.js read its map with `?? 1`, so
// the missing key did not fail, it GRANTED a one-page crawl. Those two files
// have since been corrected in place; this table is what stops the sixth copy
// being written in the first place.
//
// The values are the ruled ones as of 2026-07-31: Radar and Essentials each get
// the one-page landing-page audit (a crawl is one HTTP fetch plus one audit
// call, affordable at EUR 29), and radar: 1 with essentials: 0 would have
// inverted the ladder at EUR 29 against EUR 99. Drafts and social stay at 0 for
// both. planConfig.ts PLAN_SEO_PAGE_CAP carries the full reasoning.
const PLAN_LIMITS = {
  seoPages:              { free: 0, radar: 1, essentials: 1, growth: 10, growth_pro: 30, managed: 100, pro: 100, enterprise: 500 },
  seoAuditsPerWeek:      { free: 0, radar: 1, essentials: 1, growth: 1,  growth_pro: 1,  managed: 3,   pro: 3,   enterprise: 7 },
  seoDraftsPerMonth:     { free: 0, radar: 0, essentials: 0, growth: 10, growth_pro: 30, managed: 60,  pro: 60,  enterprise: 200 },
  socialChannels:        { free: 0, radar: 0, essentials: 0, growth: 1,  growth_pro: 3,  managed: 13,  pro: 13,  enterprise: 13 },
  socialPostsPerChannel: { free: 0, radar: 0, essentials: 0, growth: 12, growth_pro: 30, managed: 100, pro: 100, enterprise: 100 },
};

/**
 * THIS IS THE PART THAT STOPS THE NEXT `radar`.
 *
 * Same idiom as _cost.js's MONTHLY_CAPPED_ENGINES assertion, which this module
 * already sits downstream of (line 19): it reads two constants in this file, so
 * it either always throws or never does, and it can never fire on tenant data.
 * Adding a plan to PLAN_ORDER without pricing it in every table above now breaks
 * every function requiring this module, instead of quietly handing the new tier
 * whatever each caller's fallback happened to be. That silence is the whole of
 * how Radar reached a crawl nobody had priced for it.
 *
 * WHERE IT SURFACES: not at build. Netlify does not execute functions during a
 * build, so a bad constant here appears at the FIRST INVOCATION on this chain,
 * and for stripe-webhook.js that is a customer paying. Run
 * tests/plan_limits_drift.test.js locally rather than relying on a deploy to
 * catch it. _package_checkout.js:59-62 argues against throwing for exactly this
 * reason; that tension is Constantin's call, not this file's.
 */
for (const [limit, table] of Object.entries(PLAN_LIMITS)) {
  for (const plan of PLAN_ORDER) {
    if (typeof table[plan] !== 'number') {
      throw new Error(
        `_plans.js: PLAN_LIMITS.${limit} has no number for plan "${plan}". Every plan ` +
        'in PLAN_ORDER must be priced in every limit table: these values ARE the ' +
        'entitlement gate on the AI SEO paths, so an unpriced plan is a feature ' +
        'given away. See src/lib/planConfig.ts.'
      );
    }
  }
}

function isValidPlan(p) {
  return typeof p === 'string' && PLAN_ORDER.includes(p);
}

function planRank(p) {
  const i = PLAN_ORDER.indexOf(p);
  return i < 0 ? 0 : i;
}

/**
 * The `limit` allowance for `plan`, FAILING CLOSED.
 *
 * An unknown, legacy or corrupt plan gets 0, never a default allowance. Callers
 * gate on the number itself (`cap <= 0` means not entitled), so any other answer
 * for a plan we do not recognise hands a paid feature to an account nobody has
 * priced. This is the line that used to be `?? 1` in seo-crawl.js.
 *
 * An unknown `limit` throws instead, because that is a typo in our own code
 * rather than tenant data: returning 0 there would silently lock a paying
 * customer out of something they bought, which is failing closed in the wrong
 * direction. Every valid plan is guaranteed a number by the assertion above.
 */
function planLimit(limit, plan) {
  const table = PLAN_LIMITS[limit];
  if (!table) {
    throw new Error(`_plans.js: unknown limit "${limit}". One of: ${Object.keys(PLAN_LIMITS).join(', ')}`);
  }
  return isValidPlan(plan) ? table[plan] : 0;
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
  PLAN_ORDER, PLAN_LABELS, ENGINE_LABELS, PLAN_BLURB, PLAN_LIMITS,
  isValidPlan, planRank, planLimit, planUnlocks,
};
