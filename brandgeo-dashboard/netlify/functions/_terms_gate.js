// ============================================================================
// _terms_gate.js  --  the decision behind the contract gate: may this request be
// given a Stripe checkout URL at all?
//
// ROADMAP.md Stream C item C3: "the Stripe payment must be unreachable until the
// visitor has either opened and accepted the contract or ticked an explicit
// 'I have read and accept' box... The gate must be enforced server-side too, not
// only by a disabled button, or it is decorative."
//
// WHAT MAKES IT NOT DECORATIVE. Until 2026-07-31 the six live payment links were
// in site.js, shipped to every visitor, so the "gate" could only ever have been a
// disabled button in front of a URL anyone could read out of the page source.
// The links now live HERE, on the server, and reach a browser only in the
// response to a request that carried an acceptance. There is nothing to bypass
// in the page because the page no longer contains the destination.
//
// WHY THIS FILE IS PURE. No I/O, no Supabase, no env, no clock. Same reasoning as
// _package_checkout.js: this is a money path on a livemode:true Stripe account
// with no test mode, so the decision has to be exercisable directly.
// scripts/check-contract-gate.sh requires this module and calls it with
// acceptance absent, with a stale contract version, and with a plan nobody may
// self-serve, asserting that no URL comes back in any of them. A UI-only gate
// fails that script, which is the point of it.
//
// THE LINKS ARE NOT IN THIS FILE AND MUST NEVER BE PUT BACK. They live in the
// STRIPE_CHECKOUT_LINKS env var on the Netlify project.
//
// The first version of this module DID hardcode them, having moved them out of
// brandgeo/web/site.js, and review (docs/qa/s3-acquisition-funnel-contract-gate.md
// S1) showed that changed nothing: a Stripe Payment Link is a permanent,
// reusable bearer URL, and THIS REPOSITORY IS PUBLIC. Moving six live payment
// URLs from one public file to another public file gated the route and not the
// destination, and they were additionally in four committed docs and in git
// history forever.
//
// Those six links were ROTATED on 2026-07-31: new links were created against the
// same prices (no price, amount or currency changed), the new URLs went into the
// env var, and the old ones were deactivated in Stripe. The URLs still sitting in
// git history are now dead.
//
// Every price carries metadata.plan so stripe-webhook.js resolves the tier
// without a hardcoded id map (scripts/stripe-create-catalogue.js generated them).
//
// NOT IN HERE, DELIBERATELY: managed and enterprise. Both are sales-assisted and
// have no self-serve link by design, so asking this module for one is a refusal
// and not an oversight. That matches SELF_SERVE_PLANS in _package_checkout.js,
// which is the list stripe-webhook.js is allowed to auto-provision.
// ============================================================================

// The effective date printed at the top of brandgeo/web/terms.html. It is the
// version string recorded against every acceptance, so it must be changed here
// IN THE SAME COMMIT that changes that date, or acceptances will claim a
// contract nobody was shown.
//
// A mismatch is a hard refusal rather than a warning: an open tab from before an
// update would otherwise let someone accept terms that no longer exist, and the
// stored evidence would be wrong in the one way that matters.
const TERMS_VERSION = '2026-07-13';

const TERMS_URL = 'https://getbrandgeo.com/terms.html';

/**
 * The checkout catalogue, read from STRIPE_CHECKOUT_LINKS:
 *
 *   {"essentials":{"monthly":"https://buy.stripe.com/...","annual":"..."},
 *    "growth":{...},"growth_pro":{...}}
 *
 * One variable rather than six, because this project has already lost an
 * integration to Lambda's 4KB environment ceiling (GOOGLE_JSON_KEY, see
 * CLAUDE.md), and one compact JSON costs ~350 bytes where six keys plus their
 * names cost noticeably more.
 *
 * NO FALLBACK, deliberately. A hardcoded default here would defeat the entire
 * point of the rotation, and a silent fallback to stale links would send buyers
 * to deactivated URLs while every check still passed. If the variable is absent
 * or malformed, resolveCheckout refuses every request with `no_link` and the
 * page tells the visitor to contact us. That is a loud, visible outage rather
 * than a quiet wrong answer on a money path.
 *
 * Parsed once at module load: it never changes within an invocation, and a
 * throw here would take down every function that requires this module, so a bad
 * value degrades to an empty catalogue instead.
 */
const CHECKOUT_LINKS = (() => {
  const raw = process.env.STRIPE_CHECKOUT_LINKS;

  // The first deploy of this loader returned no_link in production and there was
  // no way to tell WHY from outside: an unset variable and a malformed one both
  // fail closed and look identical to a caller. These logs exist so the next
  // failure is diagnosable from the function log in one look. They deliberately
  // never print the value, only its shape, because the value is six payable URLs.
  if (!raw) {
    console.error('[TermsGate] STRIPE_CHECKOUT_LINKS is NOT SET. No checkout can be issued. '
      + 'If it is set in the Netlify UI, check it is scoped to Functions and that the site has been '
      + 'REDEPLOYED since (functions read env at deploy time), and note that a variable marked SECRET '
      + 'may not reach the function bundle.');
    return {};
  }

  const shape = `len=${raw.length} starts=${JSON.stringify(raw.slice(0, 12))}`;

  // Tolerate two manglings that are easy to introduce by hand or by an API
  // client and impossible to spot in the Netlify UI, where the value is masked:
  //   1. the whole JSON wrapped in an extra pair of quotes
  //   2. every inner quote backslash-escaped, i.e. {\"essentials\":...}
  // Both parse cleanly once undone, and neither can be confused with valid JSON.
  const candidates = [raw, raw.trim()];
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    candidates.push(trimmed.slice(1, -1));
  }
  if (trimmed.includes('\\"')) candidates.push(trimmed.replace(/\\"/g, '"'));

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (c !== raw) console.warn(`[TermsGate] STRIPE_CHECKOUT_LINKS needed unwrapping before it parsed (${shape}). Re-save it as plain JSON.`);
        return parsed;
      }
    } catch { /* try the next candidate */ }
  }

  console.error(`[TermsGate] STRIPE_CHECKOUT_LINKS is set but does not parse as a JSON object (${shape}). No checkout can be issued.`);
  return {};
})();

const PERIODS = ['monthly', 'annual'];

// The tiers the gate is willing to sell, kept SEPARATE from the catalogue above.
// Membership questions ("is growth_pro a thing you can buy?") must not depend on
// an env var: if STRIPE_CHECKOUT_LINKS were missing or truncated, deriving this
// from it would silently turn a real plan into "not a self-serve plan" and the
// refusal would name the wrong cause. A missing LINK is a `no_link` outage; an
// unknown PLAN is a bad request. Those need different answers.
const SELF_SERVE_CHECKOUT_PLANS = ['essentials', 'growth', 'growth_pro'];

/**
 * Decide whether a checkout may proceed, and to where.
 *
 * @param {object} input
 * @param {string} input.plan             'essentials' | 'growth' | 'growth_pro'
 * @param {string} input.period           'monthly' | 'annual'
 * @param {boolean} input.accepted        must be the boolean true
 * @param {string} input.acceptedVersion  the contract version the buyer was shown
 * @returns {{ok: true, url: string, plan: string, period: string, version: string}
 *          |{ok: false, reason: string, detail: string}}
 *
 * Never throws. The caller is a public endpoint on a money path; a throw would
 * turn a refusal into a 500 and tell the buyer nothing.
 *
 * A refusal NEVER carries the URL, in any field. That is asserted by the check
 * script, because a refusal that echoes the link in a debug string has handed
 * over exactly what it declined to hand over.
 *
 * `accepted` is compared with === true on purpose. The string 'false', the
 * string 'no', 0, and the object {} are all things a hand-built POST body can
 * carry, and JavaScript's truthiness rules would let two of them through.
 */
function resolveCheckout({ plan, period, accepted, acceptedVersion } = {}) {
  const fail = (reason, detail) => ({ ok: false, reason, detail });

  if (accepted !== true) {
    return fail('not_accepted', 'the terms were not accepted (expected accepted === true)');
  }

  if (!acceptedVersion || String(acceptedVersion).trim() === '') {
    return fail('missing_version', 'no terms version was submitted, so there is no record of what was accepted');
  }
  if (String(acceptedVersion).trim() !== TERMS_VERSION) {
    // Naming both sides is safe (a public date on a public page) and is the only
    // way the browser can tell the buyer to reload rather than retry forever.
    return fail(
      'version_mismatch',
      `the terms accepted (${String(acceptedVersion).trim()}) are not the current terms (${TERMS_VERSION})`
    );
  }

  const planKey = String(plan == null ? '' : plan).trim();
  // Checked against the STATIC list, not against the env-var catalogue. A typo,
  // a sales-assisted tier (managed, enterprise), and a prototype-pollution probe
  // such as "constructor" or "__proto__" all land here and all mean "bad
  // request". `includes` on a plain array also closes the pollution case that
  // hasOwnProperty was guarding before.
  if (!SELF_SERVE_CHECKOUT_PLANS.includes(planKey)) {
    return fail('unknown_plan', `"${planKey}" is not a self-serve plan`);
  }

  const periodKey = String(period == null ? '' : period).trim();
  if (!PERIODS.includes(periodKey)) {
    return fail('unknown_period', `"${periodKey}" is not a billing period`);
  }

  // A real plan and a real period that resolve to no URL means the catalogue is
  // missing or malformed, which is an outage on our side and NOT a bad request.
  // Distinguishing the two is why the plan list above is static: without it, an
  // unset env var would tell a would-be Growth customer that Growth is not a
  // plan.
  const forPlan = CHECKOUT_LINKS[planKey];
  const url = forPlan && typeof forPlan === 'object' ? forPlan[periodKey] : null;
  if (!url || typeof url !== 'string' || !/^https:\/\/buy\.stripe\.com\//.test(url)) {
    return fail('no_link', `no checkout link is configured for ${planKey}/${periodKey} (check STRIPE_CHECKOUT_LINKS)`);
  }

  return { ok: true, url, plan: planKey, period: periodKey, version: TERMS_VERSION };
}

/**
 * Append the acceptance reference to a payment link as Stripe's
 * client_reference_id, so the checkout Stripe records and the acceptance this
 * project recorded can be matched later from either side.
 *
 * Stripe accepts alphanumerics, dashes and underscores here, up to 200 chars;
 * a UUID satisfies that. An absent or unusable reference returns the URL
 * unchanged rather than refusing: by the time this is called the acceptance is
 * already written and the buyer is entitled to their checkout.
 */
function withReference(url, reference) {
  if (!reference || !/^[A-Za-z0-9_-]{1,200}$/.test(String(reference))) return url;
  return `${url}${url.includes('?') ? '&' : '?'}client_reference_id=${encodeURIComponent(reference)}`;
}

module.exports = {
  TERMS_VERSION,
  TERMS_URL,
  PERIODS,
  SELF_SERVE_CHECKOUT_PLANS,
  resolveCheckout,
  withReference,
};
