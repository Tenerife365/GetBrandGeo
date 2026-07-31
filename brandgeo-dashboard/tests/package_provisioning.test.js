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
  checkPackageLineItem,
  addMonths,
  todayUtc,
  packageGrantUntil,
  normaliseGrantDate,
  stackedGrantUntil,
} = require('../netlify/functions/_package_checkout')
const { PLAN_ORDER, isValidPlan } = require('../netlify/functions/_plans')
// Safe to require: expire-plan-grants.js builds its Supabase client INSIDE the
// handler and reads no env var at module load, so the pure partition function
// can be called here rather than asserted on as source text.
const { partitionDueGrants } = require('../netlify/functions/expire-plan-grants')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

// Same, with whole-line // comments removed, for assertions that a statement is
// EXECUTED rather than merely present. Found by mutation testing 2026-07-31:
// `assert.match(src, /grantUntil = stacked/)` passes happily against
// `// grantUntil = stacked`, so commenting a line out survived every source
// assertion in the file. Only whole-line comments are dropped, so URLs like
// https://app.getbrandgeo.com inside real code are left intact.
const readCode = (p) => read(p).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')

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
  const src = readCode('netlify/functions/stripe-webhook.js')

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

  // ── S6: pin the one line the whole review had to adjudicate ──────────────
  // docs/qa/package-provisioning-014.md §6 mutation M10: deleting plan_source
  // and plan_grant_until from the existing-client UPDATE reduces it to
  // `{ plan, stripe_customer_id: custId }` and ALL 43 CHECKS STILL PASSED. The
  // most contested and most consequential line in A1 was pinned by nothing, so
  // a future edit could revert the declared deviation with a green harness and
  // silently reopen the leak: a package holder who converts to a monthly
  // subscription keeps plan_source='package' and the old grant date, and
  // expire-plan-grants.js reverts a PAYING SUBSCRIBER to Free.
  //
  // Asserted per PROPERTY rather than as one byte-exact line. A whole-line
  // match would also fail the day someone legitimately ADDS a column to the
  // update, which trains people to delete the assertion. These two kill M10 and
  // either half of it, while tolerating growth.
  const updateLiteral = /const update = \{([^}]*)\}/.exec(readCode('netlify/functions/stripe-webhook.js'))
  assert.ok(updateLiteral, 'the existing-client update literal must still be recognisable')
  assert.match(updateLiteral[1], /plan_source: planSource/,
    'every paid checkout must state plan_source explicitly, or a converted package holder is reverted to Free by expire-plan-grants.js')
  assert.match(updateLiteral[1], /plan_grant_until: grantUntil/,
    'every paid checkout must state plan_grant_until explicitly, or a stale grant date outlives the package that set it')
  ok('S6: the existing-client update states plan_source AND plan_grant_until (kills mutation M10)')
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

  const pkgSrc = readCode('netlify/functions/_package_checkout.js')
  assert.match(pkgSrc, /require\('\.\/_plans'\)/, '_package_checkout.js must derive validity from _plans.js')
  for (const p of ['free', 'managed', 'pro', 'enterprise']) {
    assert.ok(!new RegExp(`'${p}'`).test(pkgSrc.replace(/\/\/[^\n]*/g, '')),
      `_package_checkout.js restates the ladder: it hardcodes '${p}' outside a comment`)
  }
  ok('_package_checkout.js hardcodes no plan beyond the pre-existing self-serve list')

  const hookSrc = readCode('netlify/functions/stripe-webhook.js')
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
  const exp = readCode('netlify/functions/expire-plan-grants.js')
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

// ── 7. A paying subscriber is never auto-reverted (S1) ──────────────────────
section('7. subscription-liveness guard (S1, HIGH)')
{
  // The state A1 made reachable: stripe-webhook.js writes plan_source='package'
  // on an existing client's row while deliberately preserving their live
  // stripe_subscription_id. On the day the package ends, expire-plan-grants.js
  // matched every clause of its filter and reverted a customer to Free, emailed
  // them a lapse notice, and Stripe kept charging the card.
  const due = [
    { id: 1, name: 'lapsed trial',        plan: 'growth',     plan_source: 'trial',   plan_grant_until: '2026-07-01', stripe_subscription_id: null },
    { id: 2, name: 'package + live sub',  plan: 'growth_pro', plan_source: 'package', plan_grant_until: '2026-07-01', stripe_subscription_id: 'sub_LIVE' },
    { id: 3, name: 'package, no sub',     plan: 'growth',     plan_source: 'package', plan_grant_until: '2026-07-01', stripe_subscription_id: null },
    { id: 4, name: 'comp + live sub',     plan: 'growth',     plan_source: 'comp',    plan_grant_until: '2026-07-01', stripe_subscription_id: 'sub_OTHER' },
  ]
  const { held, toExpire } = partitionDueGrants(due)

  assert.deepStrictEqual(held.map((c) => c.id), [2, 4],
    'every client Stripe is still charging must be HELD, whatever their plan_source says')
  assert.deepStrictEqual(toExpire.map((c) => c.id), [1, 3],
    'a grant with no live subscription behind it must still expire normally')
  ok('a due grant on a client with a live subscription is held, not reverted (ids 2 and 4)')

  // The guard is on the subscription id, NOT on plan_source === 'package'.
  // Client 4 is the case that proves it: a comp grant stamped onto a paying
  // subscriber is the same harm with a different label, and set-client-plan.js
  // can still create it.
  assert.strictEqual(held.some((c) => c.plan_source === 'comp'), true,
    "the guard must not be package-only — 'paying customers are never auto-downgraded' is the invariant")
  ok("the guard keys on stripe_subscription_id, so a trial/comp grant on a subscriber is held too")

  // Nothing may be lost or duplicated by the partition.
  assert.strictEqual(held.length + toExpire.length, due.length, 'partition must not drop or duplicate a row')
  assert.deepStrictEqual(partitionDueGrants([]), { held: [], toExpire: [] })
  assert.deepStrictEqual(partitionDueGrants(null), { held: [], toExpire: [] })
  assert.deepStrictEqual(partitionDueGrants(undefined), { held: [], toExpire: [] })
  assert.doesNotThrow(() => partitionDueGrants([null, undefined]))
  assert.strictEqual(partitionDueGrants([{ id: 9, stripe_subscription_id: '' }]).toExpire.length, 1,
    'an empty-string id is not a live subscription and must not block expiry forever')
  ok('partition is total, order-preserving, and never throws on a malformed row')

  const exp = readCode('netlify/functions/expire-plan-grants.js')
  assert.match(exp, /\.select\('id, name, plan, plan_source, plan_grant_until, stripe_subscription_id'\)/,
    'the job cannot apply the guard to a column it never selects')
  assert.match(exp, /const \{ held, toExpire \} = partitionDueGrants\(due\)/,
    'the handler must actually partition rather than compute a guard it ignores')
  assert.match(exp, /for \(const c of toExpire\)/,
    'the revert loop must iterate the partitioned list')
  assert.ok(!/for \(const c of due\)\s*\{[\s\S]{0,400}plan: 'free'/.test(exp),
    'the revert loop must not iterate the unpartitioned due list — that is the defect')
  ok('expire-plan-grants selects the column, partitions on it, and reverts only toExpire')

  // Held clients are REPORTED, not silently skipped. A silent skip turns a
  // customer-visible bug into an invisible one.
  assert.match(exp, /type: 'plan_expiry_held'/, 'a held grant must raise an admin event')
  assert.match(exp, /held: held\.length/, 'held count must reach job_runs so it is answerable in SQL')
  ok('a held grant raises plan_expiry_held and is recorded in job_runs')

  // COMPANION FIX. Without it the guard rots in the dangerous direction: a
  // cancelled subscription leaves a stale id, which reads as "still paying" and
  // exempts the client's grant from expiry forever — arch §2.1's permanent leak
  // by another door.
  const hook = readCode('netlify/functions/stripe-webhook.js')
  assert.match(hook, /stripe_subscription_id: null/,
    'handleSubscriptionDeleted must clear the id, or the liveness guard is permanently wrong')
  assert.match(hook, /holdsLivePackage/,
    'cancelling a subscription must not wipe a live paid package (plan: free would strand it below the expiry filter)')
  assert.match(hook, /const update = holdsLivePackage\s*\n?\s*\? \{ stripe_subscription_id: null \}/,
    'a client holding a live package keeps their plan when the subscription is cancelled')
  ok('subscription.deleted nulls the id and leaves a live paid package standing')
}

// ── 8. Quantity is read, and refused unless it is 1 (S3) ────────────────────
section('8. line-item quantity (S3, MEDIUM)')
{
  // Before this, `grep -n quantity` over netlify/functions returned nothing. A
  // 6-month package bought at quantity 2 charged for twelve months and
  // provisioned six, with NO error and NO admin event, because resolution
  // succeeds — months come from metadata and quantity was simply never read.
  assert.deepStrictEqual(checkPackageLineItem({ quantity: 1 }, false), { ok: true })
  ok('quantity 1 provisions normally')

  for (const q of [2, 3, 12, 0, -1, 1.5, '1', '2', true]) {
    const r = checkPackageLineItem({ quantity: q }, false)
    assert.strictEqual(r.ok, false, `quantity ${JSON.stringify(q)} must be refused`)
    assert.strictEqual(r.reason, 'invalid_quantity')
    assert.ok(r.detail && r.detail.length > 0, 'must carry a human detail for the admin event')
  }
  ok('any quantity that is not exactly 1 is refused, provisioning nothing (fail-closed, not months x quantity)')

  // Absent quantity defaults to 1: a missing field must never block a real sale.
  for (const line of [{}, { quantity: undefined }, { quantity: null }]) {
    assert.deepStrictEqual(checkPackageLineItem(line, false), { ok: true },
      'an absent quantity must default to 1 rather than refusing a legitimate sale')
  }
  assert.doesNotThrow(() => checkPackageLineItem(null, false))
  assert.doesNotThrow(() => checkPackageLineItem(undefined, undefined))
  ok('absent quantity defaults to 1; the guard never throws on a missing line item')

  // Same hole one level up: the webhook lists with limit 1 and reads data[0], so
  // a two-line package link would charge for both and provision the first.
  const multi = checkPackageLineItem({ quantity: 1 }, true)
  assert.strictEqual(multi.ok, false)
  assert.strictEqual(multi.reason, 'multiple_line_items')
  ok('a checkout with more than one line item is refused (has_more), not half-provisioned')

  const hook = readCode('netlify/functions/stripe-webhook.js')
  assert.match(hook, /const line = lineItems\.data\[0\]/,
    'the webhook must keep the line item, not just its price, or quantity is unreachable')
  assert.match(hook, /checkPackageLineItem\(line, lineItems\.has_more === true\)/,
    'the guard must be wired to the real line item and the real has_more flag')
  // Order matters: refusing the sale shape before resolving the price means a
  // wrong-quantity sale can never reach a successful resolution.
  assert.ok(hook.indexOf('checkPackageLineItem(') < hook.indexOf('const resolved = resolvePackage(price)'),
    'the quantity guard must run BEFORE resolution, so a bad shape cannot resolve first')
  assert.ok(!/months \* .*quantity|quantity \* /.test(hook),
    'months must never be multiplied by quantity — that silently doubles an entitlement off a field nobody sets')
  ok('the webhook checks the sale shape before the price, and never multiplies months by quantity')
}

// ── 9. Early renewal stacks the remainder (S2) ──────────────────────────────
section('9. renewal stacking (S2, MEDIUM — Constantin ruled 2026-07-31)')
{
  // Ruling: a client renewing at month 9 of a 12-month package carries their
  // unused 3 months over. Previously grantUntil was always today + N, so those
  // months were deleted — and the lapse email explicitly invites early renewal
  // ("reach out and we'll set up your next period"), so this is the expected
  // motion rather than an edge case.
  const now = new Date('2026-07-31T22:45:00Z')

  assert.strictEqual(stackedGrantUntil(12, '2027-06-30', now), '2028-06-30')
  ok('live grant to 2027-06-30 + a 12-month renewal → 2028-06-30 (11 unused months carried over)')

  assert.strictEqual(stackedGrantUntil(12, '2026-01-01', now), '2027-07-31')
  assert.strictEqual(stackedGrantUntil(12, '2026-07-30', now), '2027-07-31')
  ok('a LAPSED grant extends nothing — the base falls back to today (yesterday counts as lapsed)')

  // Boundary: expire-plan-grants selects `plan_grant_until < today`, so a grant
  // dated exactly today is still live and must still stack.
  assert.strictEqual(stackedGrantUntil(3, '2026-07-31', now), '2026-10-31')
  ok('a grant ending exactly today is still live and stacks (same boundary the expiry job uses)')

  // No grant at all must be byte-identical to the behaviour before this change.
  for (const empty of [null, undefined, '', '   ', 'not-a-date', 0, 12, new Date()]) {
    assert.strictEqual(stackedGrantUntil(12, empty, now), packageGrantUntil(12, now),
      `an absent/unparseable grant (${JSON.stringify(empty)}) must behave exactly as before stacking existed`)
  }
  assert.strictEqual(packageGrantUntil(12, now), '2027-07-31')
  ok('no grant, null, or an unparseable value degrades to today + N months, never throws')

  // The month-end clamp must survive stacking: the base only changes WHICH date
  // is clamped, never how.
  assert.strictEqual(stackedGrantUntil(1, '2027-01-31', now), '2027-02-28')
  assert.strictEqual(stackedGrantUntil(12, '2028-02-29', now), '2029-02-28')
  assert.strictEqual(stackedGrantUntil(36, '2026-08-31', now), '2029-08-31')
  ok('stacking preserves the month-end clamp (2027-01-31 + 1 → 2027-02-28, not March)')

  // Stacking can only ever move the date forward.
  for (const base of ['2026-07-31', '2027-06-30', '2026-01-01', null]) {
    for (const m of [1, 6, 12, 36]) {
      assert.ok(stackedGrantUntil(m, base, now) > todayUtc(now),
        `stacking must never shorten a grant (base ${base}, ${m} months)`)
    }
  }
  ok('the result is always in the future, for every base and every legal month count')

  assert.strictEqual(normaliseGrantDate('2027-06-30'), '2027-06-30')
  assert.strictEqual(normaliseGrantDate('2027-06-30T00:00:00+00:00'), '2027-06-30',
    'must keep working if plan_grant_until is ever widened to a timestamp')
  for (const junk of [null, undefined, '', 'tomorrow', 20270630, new Date(), {}]) {
    assert.strictEqual(normaliseGrantDate(junk), null)
  }
  ok('normaliseGrantDate reads a stored date back safely and returns null for anything else')

  const hook = readCode('netlify/functions/stripe-webhook.js')
  assert.match(hook, /const stacked = stackedGrantUntil\(months, cur\?\.plan_grant_until\)/,
    'the existing-client branch must read the current grant and stack onto it')
  assert.match(hook, /\.select\('plan_grant_until, plan_source'\)/,
    'the branch must actually read the column it stacks from')
  assert.match(hook, /grantUntil = stacked/, 'the stacked date must reach the update')
  // The admin event reports the date that was WRITTEN. Built as an object
  // literal before the branch, it would freeze the pre-stack value and the feed
  // would state a grant end the row does not have.
  assert.match(hook, /const eventMeta = \(\) =>/,
    'eventMeta must be evaluated after stacking, not snapshotted before it')
  assert.ok(!/meta: eventMeta,/.test(hook),
    'every admin event must call eventMeta() so it reports the date actually stored')
  ok('the webhook stacks from the live grant and reports the stacked date, not the pre-stack one')
}

console.log(`\n${passed} checks passed.`)
console.log('NOT covered here (no Stripe test mode, no DB): the three provisioning')
console.log('branches writing real rows. See the SQL in the handoff packet.')
