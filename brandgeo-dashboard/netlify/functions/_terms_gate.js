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
// THE LINKS THEMSELVES were moved verbatim out of brandgeo/web/site.js, where
// they had been since the 2026-07-28 catalogue rebuild. Every price carries
// metadata.plan so stripe-webhook.js resolves the tier without a hardcoded id
// map (scripts/stripe-create-catalogue.js generated them).
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

const CHECKOUT_LINKS = {
  essentials: {
    monthly: 'https://buy.stripe.com/5kQcN63yI6io6AcdcCdZ605',
    annual:  'https://buy.stripe.com/bJe4gAb1a0Y47Eg7SidZ606',
  },
  growth: {
    monthly: 'https://buy.stripe.com/7sY3cw9X6ayEf6IegGdZ607',
    annual:  'https://buy.stripe.com/bJeaEY5GQ4agbUwegGdZ608',
  },
  growth_pro: {
    monthly: 'https://buy.stripe.com/7sYaEY3yIcGMaQsa0qdZ609',
    annual:  'https://buy.stripe.com/4gM28s1qA36c1fS3C2dZ60a',
  },
};

const PERIODS = ['monthly', 'annual'];

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
  if (!Object.prototype.hasOwnProperty.call(CHECKOUT_LINKS, planKey)) {
    // Covers three cases with one message on purpose: a typo, a sales-assisted
    // tier (managed, enterprise), and a prototype-pollution probe such as
    // "constructor" or "__proto__", which hasOwnProperty is here to stop.
    return fail('unknown_plan', `"${planKey}" is not a self-serve plan`);
  }

  const periodKey = String(period == null ? '' : period).trim();
  if (!PERIODS.includes(periodKey)) {
    return fail('unknown_period', `"${periodKey}" is not a billing period`);
  }

  const url = CHECKOUT_LINKS[planKey][periodKey];
  if (!url) {
    // Unreachable while the catalogue above is complete. It is kept because the
    // alternative is returning undefined as a URL and sending a paying customer
    // to "undefined".
    return fail('no_link', `no checkout link is configured for ${planKey}/${periodKey}`);
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
  SELF_SERVE_CHECKOUT_PLANS: Object.keys(CHECKOUT_LINKS),
  resolveCheckout,
  withReference,
};
