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
// `radar` added 2026-07-31 IN THE SAME CHANGE that made the tier real, and
// deliberately BEFORE any Radar price exists in Stripe. bg-verify F1: with the
// tier live in planConfig but absent here, the first Radar payment would reach
// stripe-webhook.js:242, log "non-self-serve plan", return 200 and provision
// NOTHING. Money taken, no entitlement, and no error anywhere, because a 200 is
// what tells Stripe to stop retrying.
//
// This is not hypothetical and it is not new: growth_pro closed this exact hole
// on 2026-07-28. It is also primed rather than latent, because AUTONOMY.md §2
// pre-authorises an agent to create Stripe prices without asking, so the next
// agent to do so would open it.
const SELF_SERVE_PLANS = ['essentials', 'growth', 'growth_pro', 'radar'];

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
 * Guard the SHAPE OF THE SALE, as distinct from resolvePackage()'s guard on the
 * shape of the PRICE. Added 2026-07-31 for docs/qa/package-provisioning-014.md
 * S3.
 *
 * The months a package grants come from price.metadata.months and from nothing
 * else -- `grep -n quantity` over netlify/functions returned nothing before this
 * change. So a 6-month package bought at quantity 2 charges the customer for
 * twelve months and provisions six, with no error and no admin event, because
 * resolution SUCCEEDS. The entitlement is silently half the money taken.
 *
 * FAIL CLOSED, deliberately, rather than multiplying months by quantity:
 *
 *   - Multiplying would double an entitlement off a field nobody currently
 *     sets, on a livemode:true account with no test mode. The first time it
 *     ever ran in anger would also be the first time it was exercised at all.
 *   - Refusing produces a paid-but-unprovisioned admin alert, which is the
 *     outcome A1 exists to make visible (arch §3.2 step 2), and the human fix
 *     is one manual provision from Account.
 *   - A quantity-2 package is not a shape anyone designed. Provisioning
 *     ANYTHING for it is guessing about money.
 *
 * `hasMore` covers the same hole one level up: stripe-webhook.js lists line
 * items with limit 1 and reads data[0], so a two-line package link would charge
 * for both lines and provision the first. Stripe sets has_more on that list, so
 * the second line is detectable without changing the fetch.
 *
 * An ABSENT quantity defaults to 1 and passes. Stripe always sets it; defaulting
 * to allow means a missing field can never block a legitimate sale, while any
 * value that is present and not exactly 1 is refused (including the string '1',
 * which is not a shape Stripe produces).
 *
 * @param {object|null|undefined} line   lineItems.data[0]
 * @param {boolean} hasMore              lineItems.has_more
 * @returns {{ok: true}|{ok: false, reason: string, detail: string}}
 */
function checkPackageLineItem(line, hasMore) {
  if (hasMore === true) {
    return {
      ok: false,
      reason: 'multiple_line_items',
      detail: 'the checkout has more than one line item; a package must be a single line so the money and the entitlement cannot disagree',
    };
  }
  const quantity = line && line.quantity !== undefined && line.quantity !== null ? line.quantity : 1;
  if (quantity !== 1) {
    return {
      ok: false,
      reason: 'invalid_quantity',
      detail: `line item quantity is ${JSON.stringify(quantity)}; a package must be sold at quantity 1 (the months granted come from price.metadata.months and are never multiplied by quantity)`,
    };
  }
  return { ok: true };
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

/**
 * Read a stored plan_grant_until back into a 'YYYY-MM-DD' string, or null if it
 * is not one.
 *
 * Anything that is not a parseable date -- null, undefined, '', a Date object, a
 * number, junk -- returns null, which the caller treats as "no existing grant"
 * and falls back to today. That degradation is the point: this runs on the
 * provisioning path of a checkout whose money is already captured, so an
 * unexpected column shape must cost the customer their stacked months at worst,
 * never throw and leave them unprovisioned.
 *
 * Accepts a leading date inside a longer ISO timestamp so it keeps working if
 * plan_grant_until is ever widened from `date` to `timestamptz`.
 */
function normaliseGrantDate(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * The date a package grant lapses when the buyer ALREADY holds a live grant.
 * Added 2026-07-31 for docs/qa/package-provisioning-014.md S2, per Constantin's
 * ruling: renewing early STACKS the unused remainder, it does not forfeit it.
 *
 * Before this, grantUntil was always today + N months, so a client renewing at
 * month 9 of a 12-month package silently lost 3 paid months -- and
 * expire-plan-grants.js's lapse copy explicitly invites early renewal ("reach
 * out and we'll set up your next period"), so that is the expected motion, not
 * an edge case.
 *
 * Base date rules, all deliberate:
 *
 *   - LIVE grant  -> stack from it. The client keeps the plan THROUGH
 *     plan_grant_until (expire-plan-grants.js selects `< today`), so a grant
 *     dated exactly today is still live and still stacks.
 *   - LAPSED grant (strictly before today) -> ignored, start from today. A date
 *     in the past must never extend anything; that is the whole reason the base
 *     is max(today, existing) and not simply `existing`.
 *   - ABSENT or unparseable -> start from today, i.e. exactly the behaviour
 *     before this change.
 *
 * SOURCE IS DELIBERATELY NOT CONSIDERED. A live 'trial' or 'comp' window stacks
 * the same as a live 'package' one. Truncating a comp window because the client
 * then paid would take back something already given, at the moment they hand
 * over money -- the same class of error as forfeiting their remainder. What
 * this function is NOT allowed to do is shorten anything, and it cannot: the
 * result is always >= the base and the base is always >= today.
 *
 * The month-end clamp in addMonths() is preserved because the base only ever
 * changes WHICH date is clamped, never how. 2026-01-31 + 1 month is 2026-02-28
 * whether that base came from today or from a stacked grant.
 *
 * @param {number} months               validated whole months, 1..36
 * @param {string|null} currentGrantUntil  clients.plan_grant_until as stored
 * @param {Date} [now]                  injectable clock, for tests
 * @returns {string} 'YYYY-MM-DD'
 */
function stackedGrantUntil(months, currentGrantUntil, now) {
  const today = todayUtc(now);
  const existing = normaliseGrantDate(currentGrantUntil);
  const base = existing && !(existing < today) ? existing : today;
  return addMonths(base, months);
}

module.exports = {
  SELF_SERVE_PLANS,
  MIN_PACKAGE_MONTHS,
  MAX_PACKAGE_MONTHS,
  PACKAGE_PLAN_SOURCE,
  resolvePackage,
  checkPackageLineItem,
  addMonths,
  todayUtc,
  packageGrantUntil,
  normaliseGrantDate,
  stackedGrantUntil,
};
