// ============================================================================
// _package_checkout.js  --  resolution + validation for a PACKAGE checkout: a
// multi-month entitlement sold as a Stripe one-time payment
// (checkout.session.mode === 'payment') rather than a subscription.
//
// WHY THIS IS ITS OWN FILE. Two reasons, both deliberate.
//
//   1. There is no Stripe test mode connected to this project, so A1 ships
//      verified by code review plus a local harness only
//      (docs/arch/custom-entitlements.md §4 asks for test mode; it does not
//      exist, which was raised rather than worked around by testing on live).
//      stripe-webhook.js constructs a Stripe client and a Supabase service
//      client at module load, so it cannot be required from a test without
//      real credentials. Everything below is pure -- no I/O, no clock except
//      the one the caller passes in -- so tests/package_provisioning.test.js
//      can exercise the exact code the webhook runs, not a paraphrase of it.
//
//   2. SELF_SERVE_PLANS moved here from stripe-webhook.js rather than being
//      copied. This repo already carries four hand-kept copies of the plan
//      ladder (planConfig.ts, _cost.js, _plans.js, onboard-client.js
//      VALID_PLANS) and their drift has caused real incidents
//      (docs/qa/plans-divergence-b1.md). A fifth is not a fix for four.
//      The ladder itself is NOT restated here: isValidPlan() comes from
//      _plans.js, whose PLAN_ORDER mirrors planConfig.ts.
//
// A package price carries two metadata keys (arch §3.1):
//     metadata.plan   = 'growth' | 'growth_pro' | ...   (must be in the ladder)
//     metadata.months = '12'                            (integer, 1..36)
//
// AND the Payment Link that sells it must set customer_creation: 'always'.
// In `payment` mode Stripe defaults customer_creation to 'if_required' and a
// one-time charge does not require a Customer, so session.customer comes back
// null and stripe-webhook.js cannot link the purchase to anything. The six
// live links today are all subscription links, where a Customer is always
// created, so this trap has never been hit before.
//
// metadata.plan is already the primary resolution mechanism for subscriptions,
// so packages reuse a proven path instead of inventing one. There is
// deliberately NO price-id fallback for packages: PRICE_TO_PLAN in
// stripe-webhook.js maps subscription prices only, and it carries no months, so
// a package price missing its metadata is unresolvable by definition and must
// fail loudly rather than half-resolve.
// ============================================================================

const { isValidPlan } = require('./_plans');

// Tiers this webhook is allowed to provision, from either a subscription or a
// package. MOVED here from stripe-webhook.js 2026-07-31, unchanged; the comment
// that came with it is worth keeping verbatim:
//
//   growth_pro added 2026-07-28, deliberately BEFORE its Stripe prices exist.
//   Ordering matters here and it is the safe direction: with growth_pro absent
//   from this list, a paid EUR 449 checkout would reach handleCheckoutCompleted,
//   fail the membership test, log "unresolved/non-self-serve plan", return 200,
//   and provision nothing -- money taken, no entitlement, no error raised
//   anywhere. Adding it first is inert until a matching price exists, so the
//   gap can never open. Do not create the Stripe prices without this line.
//
// Every entry MUST also be a member of _plans.js's PLAN_ORDER. That is asserted
// by tests/package_provisioning.test.js rather than at module load, because a
// throw here would take the whole webhook down and stop provisioning working
// subscriptions too -- the failure mode this file exists to prevent.
const SELF_SERVE_PLANS = ['essentials', 'growth', 'growth_pro'];

// 36 months is the ceiling from arch §3.1. It is not arbitrary: it bounds how
// long a single card payment can hold an entitlement open, so a fat-fingered
// metadata.months of 120 is rejected instead of granting a decade.
const MIN_PACKAGE_MONTHS = 1;
const MAX_PACKAGE_MONTHS = 36;

const PACKAGE_PLAN_SOURCE = 'package';

/**
 * Resolve a package purchase from the checkout line item's price.
 *
 * @param {object|null|undefined} price  A Stripe Price object (lineItems.data[0].price).
 * @returns {{ok: true, plan: string, months: number, raw: {plan: any, months: any}}
 *          |{ok: false, reason: string, detail: string, raw: {plan: any, months: any}}}
 *
 * Never throws: the caller is a webhook that must return 200 to Stripe, and a
 * throw here would release the idempotency lock and make Stripe redeliver the
 * same unprovisionable session on a retry schedule, emailing the admin each time.
 *
 * Failure reasons are distinct on purpose. "missing" means the price was never
 * configured as a package (likeliest cause: someone sold a one-off using a
 * subscription price, or forgot the metadata when creating it). "invalid" means
 * it was configured and configured wrongly. Those need different human actions,
 * so the admin event must be able to say which.
 */
function resolvePackage(price) {
  const rawPlan = price && price.metadata ? price.metadata.plan : undefined;
  const rawMonths = price && price.metadata ? price.metadata.months : undefined;
  const raw = { plan: rawPlan === undefined ? null : rawPlan, months: rawMonths === undefined ? null : rawMonths };

  const fail = (reason, detail) => ({ ok: false, reason, detail, raw });

  // ---- plan ---------------------------------------------------------------
  if (rawPlan === undefined || rawPlan === null || String(rawPlan).trim() === '') {
    return fail('missing_plan', 'price.metadata.plan is not set');
  }
  const plan = String(rawPlan).trim();
  // Two checks, not one. isValidPlan() asks "is this a plan at all", derived
  // from _plans.js's mirror of planConfig.ts's PLAN_ORDER. SELF_SERVE_PLANS
  // asks "is this webhook allowed to provision it". A package for 'managed'
  // is a real plan that is still sales-closed, and must not auto-provision.
  if (!isValidPlan(plan)) {
    return fail('invalid_plan', `"${plan}" is not a plan in the ladder`);
  }
  if (!SELF_SERVE_PLANS.includes(plan)) {
    return fail('invalid_plan', `"${plan}" is a real plan but is not self-serve provisionable`);
  }

  // ---- months -------------------------------------------------------------
  if (rawMonths === undefined || rawMonths === null || String(rawMonths).trim() === '') {
    return fail('missing_months', 'price.metadata.months is not set');
  }
  const monthsText = String(rawMonths).trim();
  // Stripe metadata values are always strings, so parse strictly rather than
  // with Number()/parseInt(), both of which are too forgiving here:
  // Number('') is 0, parseInt('12.9') is 12, and parseInt('12 months') is 12.
  // A package that silently rounds a typo into a valid grant is worse than one
  // that refuses to provision and says so.
  if (!/^\d+$/.test(monthsText)) {
    return fail('invalid_months', `months "${monthsText}" is not a whole number`);
  }
  const months = Number(monthsText);
  if (!Number.isInteger(months) || months < MIN_PACKAGE_MONTHS || months > MAX_PACKAGE_MONTHS) {
    return fail('invalid_months', `months ${months} is outside ${MIN_PACKAGE_MONTHS}..${MAX_PACKAGE_MONTHS}`);
  }

  return { ok: true, plan, months, raw };
}

/**
 * Add whole months to a YYYY-MM-DD date, clamping to the last day of the target
 * month. All arithmetic is in UTC.
 *
 * The clamp is the point. `d.setMonth(d.getMonth() + 1)` on 2026-01-31 yields
 * 2026-03-03, so a 1-month package bought on the 31st would have silently
 * granted 31 extra days. set-client-plan.js's todayPlusDays() has no such
 * problem because it works in days; months are not a fixed length and cannot
 * be delegated to the Date rollover.
 *
 * @param {string} ymd     start date, 'YYYY-MM-DD'
 * @param {number} months  whole months to add (>= 0)
 * @returns {string} 'YYYY-MM-DD'
 */
function addMonths(ymd, months) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd));
  if (!m) throw new Error(`addMonths: expected YYYY-MM-DD, got "${ymd}"`);
  if (!Number.isInteger(months) || months < 0) throw new Error(`addMonths: expected a whole month count, got "${months}"`);

  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);

  const target = monthIndex + months;
  const targetYear = year + Math.floor(target / 12);
  const targetMonth = ((target % 12) + 12) % 12;

  // Day 0 of the following month == last day of the target month.
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);

  const pad = (n) => String(n).padStart(2, '0');
  return `${targetYear}-${pad(targetMonth + 1)}-${pad(targetDay)}`;
}

/** Today in UTC as YYYY-MM-DD -- the same clock expire-plan-grants.js compares against. */
function todayUtc(now) {
  return (now instanceof Date ? now : new Date()).toISOString().slice(0, 10);
}

/**
 * The date a package grant lapses.
 *
 * expire-plan-grants.js selects `plan_grant_until < today`, so the client keeps
 * the plan THROUGH this date and reverts to Free the following day -- which is
 * exactly arch §3.3's "reverts to Free on the day after it ends".
 */
function packageGrantUntil(months, now) {
  return addMonths(todayUtc(now), months);
}

module.exports = {
  SELF_SERVE_PLANS,
  MIN_PACKAGE_MONTHS,
  MAX_PACKAGE_MONTHS,
  PACKAGE_PLAN_SOURCE,
  resolvePackage,
  addMonths,
  todayUtc,
  packageGrantUntil,
};
