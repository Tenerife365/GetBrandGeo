/**
 * package_provisioning.test.js — guards package (one-time payment) checkout
 * provisioning. Run: `node tests/package_provisioning.test.js` (exits non-zero
 * on failure).
 *
 * WHY THIS EXISTS AT ALL. There is no Stripe TEST MODE connected to this
 * project. docs/arch/custom-entitlements.md §4 says to verify A1 against test
 * mode and that its absence is "a blocker to raise, not a reason to test on
 * live". It was raised; Constantin accepted that A1 ships verified by code
 * review plus this harness. So this file is not a nice-to-have around a tested
 * change, it is the only executable evidence that exists. It is written to
 * exercise the SAME functions the webhook calls, not a re-implementation of
 * them — a harness that restates the logic it is checking proves nothing.
 *
 * WHAT IT CANNOT DO. It does not touch Stripe, Supabase, or the network, so it
 * cannot prove the three provisioning branches write the rows they claim to.
 * Those are code review, plus the SQL in the handoff. What it CAN pin down is
 * every decision made before the first write: resolution, validation, the
 * grant date, and the plan-ladder invariants. That is where the money is lost.
 *
 * Covers docs/arch/custom-entitlements.md §4 criteria 1, 2 and 5 directly,
 * plus the resolution half of 4. Criterion 3 (expire-plan-grants reverts a
 * package) is a source assertion here and a SQL check in production.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const {
  SELF_SERVE_PLANS,
  MIN_PACKAGE_MONTHS,
  MAX_PACKAGE_MONTHS,
  PACKAGE_PLAN_SOURCE,
  resolvePackage,
  addMonths,
  todayUtc,
  packageGrantUntil,
} = require('../netlify/functions/_package_checkout')
const { PLAN_ORDER, isValidPlan } = require('../netlify/functions/_plans')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

// ── Fixtures ────────────────────────────────────────────────────────────────
// Shaped like the real objects: a checkout.session as Stripe delivers it, and
// the price that `stripe.checkout.sessions.listLineItems(...).data[0].price`
// returns. Stripe metadata values are ALWAYS strings — months is '12', never 12
// — and the fixtures keep that, because the difference is exactly what the
// strict parse in resolvePackage() exists to handle.
const session = (over = {}) => ({
  id: 'cs_test_' + Math.random().toString(36).slice(2, 10),
  object: 'checkout.session',
  mode: 'payment',
  amount_total: 299000,
  currency: 'eur',
  customer: 'cus_TEST123',
  customer_details: { email: 'Founder@Example.com' },
  subscription: null,
  ...over,
})

const price = (metadata) => ({ id: 'price_TESTpackage', object: 'price', type: 'one_time', metadata })

// ── 1. Valid package ────────────────────────────────────────────────────────
section('1. valid package (arch §4.1)')
{
  const s = session()
  assert.strictEqual(s.mode, 'payment')
  const r = resolvePackage(price({ plan: 'growth', months: '12' }))
  assert.strictEqual(r.ok, true, 'a well-formed package must resolve')
  assert.strictEqual(r.plan, 'growth')
  assert.strictEqual(r.months, 12)
  ok('mode=payment, plan=growth, months="12" resolves to growth / 12')

  assert.strictEqual(PACKAGE_PLAN_SOURCE, 'package')
  ok(`plan_source constant is '${PACKAGE_PLAN_SOURCE}', not 'stripe' (arch §2.1 — 'stripe' never expires)`)

  // The grant date the webhook will store. Pinned to a fixed clock so this
  // assertion means the same thing on every day of the year.
  const until = packageGrantUntil(12, new Date('2026-07-31T22:45:00Z'))
  assert.strictEqual(until, '2027-07-31')
  ok('12 months from 2026-07-31 → plan_grant_until 2027-07-31')

  // Semantics of that date against the job that consumes it: expire-plan-grants
  // selects plan_grant_until < today, so the client keeps the plan THROUGH the
  // stored date and reverts the next day (arch §3.3).
  assert.ok(!('2027-07-31' < '2027-07-31'), 'must NOT be due on its final day')
  assert.ok('2027-07-31' < '2027-08-01', 'must be due the day after')
  ok('grant is live on 2027-07-31 and due on 2027-08-01 (lexical compare, same as the SQL)')

  for (const p of SELF_SERVE_PLANS) {
    assert.strictEqual(resolvePackage(price({ plan: p, months: '1' })).ok, true, `${p} must be package-able`)
  }
  ok(`every self-serve plan resolves as a package: ${SELF_SERVE_PLANS.join(', ')}`)
}

// ── 2. Month arithmetic ─────────────────────────────────────────────────────
section('2. grant-date arithmetic')
{
  // The bug this guards: `d.setMonth(d.getMonth() + 1)` on 2026-01-31 gives
  // 2026-03-03, silently granting 31 extra days on every month-end purchase.
  assert.strictEqual(addMonths('2026-01-31', 1), '2026-02-28')
  ok('2026-01-31 + 1 month → 2026-02-28 (clamped, not rolled over into March)')

  assert.strictEqual(addMonths('2028-02-29', 12), '2029-02-28')
  ok('leap day + 12 months → 2029-02-28')

  assert.strictEqual(addMonths('2026-12-15', 1), '2027-01-15')
  assert.strictEqual(addMonths('2026-08-31', 36), '2029-08-31')
  ok('year rollover and the 36-month ceiling land on the right dates')

  assert.strictEqual(addMonths('2026-07-31', 0), '2026-07-31')
  ok('0 months is identity')

  assert.throws(() => addMonths('31/07/2026', 12), /YYYY-MM-DD/)
  assert.throws(() => addMonths('2026-07-31', 1.5), /whole month count/)
  ok('malformed date and fractional months both throw rather than guess')

  assert.match(todayUtc(), /^\d{4}-\d{2}-\d{2}$/)
  assert.strictEqual(todayUtc(new Date('2026-07-31T23:59:59Z')), '2026-07-31')
  ok('todayUtc() is UTC-day, matching the clock expire-plan-grants.js compares against')
}

// ── 3. Missing / invalid metadata provisions nothing ────────────────────────
section('3. missing or invalid metadata (arch §4.2)')
{
  const bad = [
    ['metadata.plan absent',        price({ months: '12' }),                          'missing_plan'],
    ['metadata.plan empty',         price({ plan: '', months: '12' }),                'missing_plan'],
    ['metadata.plan whitespace',    price({ plan: '   ', months: '12' }),             'missing_plan'],
    ['no metadata at all',          price(undefined),                                 'missing_plan'],
    ['no price on the line item',   undefined,                                        'missing_plan'],
    ['unknown plan slug',           price({ plan: 'gold', months: '12' }),            'invalid_plan'],
    ['typo in a real plan',         price({ plan: 'growthpro', months: '12' }),       'invalid_plan'],
    ['real but not self-serve',     price({ plan: 'managed', months: '12' }),         'invalid_plan'],
    ['free as a paid package',      price({ plan: 'free', months: '12' }),            'invalid_plan'],
    ['metadata.months absent',      price({ plan: 'growth' }),                        'missing_months'],
    ['metadata.months empty',       price({ plan: 'growth', months: '' }),            'missing_months'],
    ['months zero',                 price({ plan: 'growth', months: '0' }),           'invalid_months'],
    ['months above the ceiling',    price({ plan: 'growth', months: '37' }),          'invalid_months'],
    ['months wildly out of range',  price({ plan: 'growth', months: '120' }),         'invalid_months'],
    ['months negative',             price({ plan: 'growth', months: '-6' }),          'invalid_months'],
    ['months fractional',           price({ plan: 'growth', months: '12.5' }),        'invalid_months'],
    ['months with a unit',          price({ plan: 'growth', months: '12 months' }),   'invalid_months'],
    ['months as words',             price({ plan: 'growth', months: 'twelve' }),      'invalid_months'],
  ]

  for (const [name, p, expected] of bad) {
    const r = resolvePackage(p)
    assert.strictEqual(r.ok, false, `${name}: must NOT provision`)
    assert.strictEqual(r.reason, expected, `${name}: expected reason ${expected}, got ${r.reason}`)
    assert.ok(r.detail && r.detail.length > 0, `${name}: must carry a human detail for the admin event`)
    assert.strictEqual(r.plan, undefined, `${name}: must not leak a plan`)
    assert.strictEqual(r.months, undefined, `${name}: must not leak a month count`)
    ok(`${name} → ${expected}, nothing provisioned`)
  }

  // 'managed' is the case that matters most: it IS a real plan, so a check
  // against the ladder alone would let a sales-closed tier auto-provision from
  // a card payment. Both checks are load-bearing.
  assert.strictEqual(isValidPlan('managed'), true)
  assert.strictEqual(resolvePackage(price({ plan: 'managed', months: '12' })).ok, false)
  ok("'managed' is a valid plan AND still refused — ladder check and self-serve check are both doing work")

  // Never throws: a throw in the webhook releases the idempotency lock and
  // Stripe redelivers the same unfixable session on a retry schedule.
  for (const junk of [null, undefined, {}, { metadata: null }, { metadata: { plan: 12, months: {} } }]) {
    assert.doesNotThrow(() => resolvePackage(junk), `resolvePackage must not throw on ${JSON.stringify(junk)}`)
    assert.strictEqual(resolvePackage(junk).ok, false)
  }
  ok('resolvePackage never throws, on any shape of junk')
}

// ── 4. A subscription is untouched by any of this ───────────────────────────
section('4. subscription regression (arch §4.4)')
{
  const sub = session({
    mode: 'subscription',
    subscription: 'sub_TEST456',
    amount_total: 29900,
  })
  const src = read('netlify/functions/stripe-webhook.js')

  // Mode routing, read off the source that actually runs.
  assert.match(src, /const mode = session\.mode \|\| 'subscription'/,
    'a session with no mode must still be treated as a subscription, as before')
  assert.match(src, /if \(mode !== 'subscription' && mode !== 'payment'\)/,
    'exactly two modes provision; anything else (e.g. setup) still returns early')
  assert.match(src, /const isPackage = mode === 'payment'/)
  ok('mode routing: subscription | absent → subscription path, payment → package path, else skip')

  assert.strictEqual(sub.mode === 'payment', false)
  ok('a subscription session never enters the package path')

  // The subscription path keeps price.metadata.plan primary with the
  // PRICE_TO_PLAN fallback. resolvePackage() is NOT in that path — packages
  // deliberately have no price-id fallback (there is no months to fall back to).
  assert.match(src, /plan = \(price\?\.metadata\?\.plan\) \|\| PRICE_TO_PLAN\[priceId\]/,
    'subscription resolution must be byte-identical to what it was')
  ok('subscription resolution is unchanged: metadata.plan, then PRICE_TO_PLAN')

  assert.match(src, /planSource = 'stripe'[\s\S]{0,40}grantUntil = null/,
    "the subscription path must provision as ('stripe', null) per arch §3.2")
  ok("subscription provisions as plan_source 'stripe', plan_grant_until null")

  // createClientRow's new parameters must be required, not defaulted: a default
  // would let a future caller provision a package as 'stripe' by omission, and
  // 'stripe' is not in the revert filter.
  assert.match(src, /async function createClientRow\(\{ email, plan, custId, subId, planSource, grantUntil, log \}\)/)
  assert.match(src, /if \(!planSource\) throw new Error\('createClientRow: planSource is required'\)/)
  const callSites = src.match(/await createClientRow\(\{[^}]*\}\)/g) || []
  assert.strictEqual(callSites.length, 2, `expected 2 createClientRow call sites, found ${callSites.length}`)
  for (const c of callSites) {
    assert.ok(/planSource/.test(c) && /grantUntil/.test(c), `call site missing the new params: ${c}`)
  }
  ok('createClientRow requires planSource and both call sites pass it (fails loudly, never defaults to stripe)')

  assert.match(src, /stripe_subscription_id: subId \?\? null/,
    'a package must never be given a fabricated subscription id')
  assert.match(src, /if \(!isPackage\) update\.stripe_subscription_id = subId/,
    'the package path must leave an existing subscription id alone rather than blanking it')
  ok('stripe_subscription_id: null for a new package, untouched for an existing client')
}

// ── 5. No fifth copy of the plan ladder (arch §4.5) ─────────────────────────
section('5. plan ladder integrity (arch §4.5)')
{
  // Everything the package path knows about plans is derived from _plans.js,
  // whose PLAN_ORDER mirrors planConfig.ts. Nothing new restates the ladder.
  for (const p of SELF_SERVE_PLANS) {
    assert.ok(PLAN_ORDER.includes(p), `SELF_SERVE_PLANS member "${p}" is not in PLAN_ORDER — the ladder has drifted`)
  }
  ok(`SELF_SERVE_PLANS is a subset of PLAN_ORDER (${SELF_SERVE_PLANS.length} of ${PLAN_ORDER.length})`)

  const pkgSrc = read('netlify/functions/_package_checkout.js')
  assert.match(pkgSrc, /require\('\.\/_plans'\)/, '_package_checkout.js must derive validity from _plans.js')
  for (const p of ['free', 'managed', 'pro', 'enterprise']) {
    assert.ok(!new RegExp(`'${p}'`).test(pkgSrc.replace(/\/\/[^\n]*/g, '')),
      `_package_checkout.js restates the ladder: it hardcodes '${p}' outside a comment`)
  }
  ok('_package_checkout.js hardcodes no plan beyond the pre-existing self-serve list')

  const hookSrc = read('netlify/functions/stripe-webhook.js')
  assert.ok(!/const SELF_SERVE_PLANS\s*=/.test(hookSrc),
    'SELF_SERVE_PLANS must be imported, not redeclared — one list, not two')
  assert.match(hookSrc, /require\('\.\/_package_checkout'\)/)
  ok('stripe-webhook.js imports the list instead of keeping its own copy')
}

// ── 6. Expiry actually covers packages (arch §4.3) ──────────────────────────
section('6. expiry filter (arch §4.3)')
{
  // The trap in arch §2.1: provisioning without touching this file means a
  // customer who paid for twelve months keeps the plan forever.
  const exp = read('netlify/functions/expire-plan-grants.js')
  assert.match(exp, /\.in\('plan_source', \['trial', 'comp', 'package'\]\)/,
    "expire-plan-grants.js must revert 'package' or the grant never ends")
  ok("expire-plan-grants.js filters plan_source in (trial, comp, package)")

  assert.ok(!/\.in\('plan_source', \['trial', 'comp'\]\)/.test(exp), 'the old two-source filter must be gone')
  assert.ok(PACKAGE_PLAN_SOURCE !== 'stripe' && PACKAGE_PLAN_SOURCE !== 'manual',
    'the package source must not collide with an open-ended paid source')
  ok("the source the webhook writes ('package') is the source the job reverts")

  // kind must stay 'trial_expired': ClientBanner.tsx:51 and types/index.ts:162
  // both switch on that literal, so changing it would silently unstyle the banner.
  assert.match(exp, /kind: 'trial_expired'/, "client_notifications.kind must stay 'trial_expired'")
  assert.ok(!/complimentary \$\{planLabel\} plan has ended`,\s*$/m.test(exp) || /package has ended/.test(exp),
    'a paying package customer must not be told their plan was complimentary')
  assert.match(exp, /Your \$\{planLabel\} package has ended/)
  ok('lapsed package gets paid-customer wording; notification kind is unchanged')
}

console.log(`\n${passed} checks passed.`)
console.log('NOT covered here (no Stripe test mode, no DB): the three provisioning')
console.log('branches writing real rows. See the SQL in the handoff packet.')
