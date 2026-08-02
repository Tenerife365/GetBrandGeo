/**
 * revenue_report.test.js — guards the money computation behind the admin
 * Revenue page (S21). Run: `node tests/revenue_report.test.js` (exits non-zero
 * on failure).
 *
 * WHY THIS EXISTS AT ALL, and why it carries more weight here than usual. The
 * live Stripe account cannot exercise these formulas. Verified 2026-08-02
 * (docs/arch/revenue-report-data-contract.md §2, §4): 2 invoices, 1 charge, 0
 * refunds, 0 subscriptions, 1 coupon/promo pair with 0 redemptions. So there is
 * no paid subscription invoice, no refund, no affiliate redemption and no
 * 12-month window to expire anywhere in production. Running the real function
 * against the real account today would print two numbers and prove nothing about
 * the arithmetic that will decide what a partner is owed.
 *
 * These fixtures are that coverage. Every one of them describes a scenario the
 * account does not have yet, and every expected figure below is HAND-CALCULATED
 * in the comment directly above its assertion, in cents and then in euros, so
 * the assertion can be checked without running the code it checks.
 *
 * It imports and calls the SAME pure functions revenue-report.js uses. A harness
 * that reimplements the maths to check itself proves only that it agrees with
 * itself — the same standard package_provisioning.test.js sets in its own header.
 *
 * WHAT IT CANNOT DO. It never touches Stripe, Supabase or the network, so it
 * cannot prove that revenue-report.js fetches the right objects, pages them
 * correctly, or that requireAuth rejects a non-admin. Those are code review plus
 * the curl in the handoff. What it CAN pin down is every euro figure the page
 * will display.
 */
const assert = require('assert')

const {
  COMMISSION_RATE,
  PLAN_LADDER,
  UNKNOWN_PLAN,
  periodForMonth,
  resolveClientForCustomer,
  planForInvoiceLine,
  planForInvoice,
  findAffiliateAttribution,
  isWithinCommissionWindow,
  computeCommissionForInvoice,
  refundTarget,
  invoiceDiscountCents,
  sumApiCostByClient,
  aggregateRevenue,
  nextOfferedPlan,
  computeEngagementPipeline,
  isoWeekKey,
} = require('../netlify/functions/_revenue')

// The real cost table, so the legacy-NULL fallback below is proven against the
// exact numbers Usage.tsx's client-side copy reads (contract §5 requires the two
// tabs to agree).
const { ENGINE_COST_EUR } = require('../netlify/functions/_cost')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)
/** Float compare for EUR sums that never round-trip exactly in binary. */
const near = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `expected ${b}, got ${a} (diff ${Math.abs(a - b)})`)

/** Stripe timestamps are unix SECONDS, and the fixtures keep that. */
const unix = (iso) => Math.floor(Date.parse(iso) / 1000)

// ── Shared fixtures ─────────────────────────────────────────────────────────
// Shaped like the real objects. Stripe metadata values are ALWAYS strings —
// client_id is '1', never 1 — and the fixtures keep that, because the strict
// integer parse in resolveClientForCustomer exists precisely to handle it.

const PRICE_TO_PLAN = {
  price_1Ty5a3Kh2GaZE2B4WSWURHv8: 'growth',      // real live id, from stripe-webhook.js
  price_LEGACY_NO_METADATA: 'essentials',
}

const CLIENTS = [
  // BpR: the founding client. clients.stripe_customer_id is NULL (provisioned
  // through Onboard.tsx, not the checkout webhook) — attribution must come from
  // the Stripe side, contract §3.
  { id: 1, name: 'Bucate pe Roate', plan: 'growth_pro', stripe_customer_id: null, category: 'active' },
  // A self-serve subscriber: the reverse join, clients.stripe_customer_id set.
  { id: 2, name: 'Acme SL', plan: 'growth', stripe_customer_id: 'cus_ACME', category: 'active' },
  // Referred by the BPRFREE affiliate code.
  { id: 3, name: 'Referred Ltd', plan: 'essentials', stripe_customer_id: 'cus_REF', category: 'active' },
  // Free-tier clients, for the pipeline.
  { id: 52, name: 'Doctor Mihail', plan: 'free', stripe_customer_id: null, category: 'active' },
  { id: 53, name: 'One Shot', plan: 'free', stripe_customer_id: null, category: 'active' },
  { id: 54, name: 'Two Weeks', plan: 'free', stripe_customer_id: null, category: 'active' },
  { id: 55, name: 'Dormant', plan: 'free', stripe_customer_id: null, category: 'active' },
  { id: 56, name: 'City Study Free', plan: 'free', stripe_customer_id: null, category: 'research' },
  // A research study: costs money, earns nothing, has no Stripe customer.
  { id: 60, name: 'City Study Madrid', plan: 'pro', stripe_customer_id: null, category: 'research' },
]

const CUSTOMERS = [
  { id: 'cus_BPR', name: 'Bucate pe Roate SRL', email: 'ap@bucatePeRoate.ro', metadata: { client_id: '1', client_slug: 'bpr' } },
  { id: 'cus_ACME', name: 'Acme SL', email: 'billing@acme.es', metadata: {} },
  { id: 'cus_REF', name: 'Referred Ltd', email: 'hi@referred.co', metadata: {} },
  { id: 'cus_GHOST', name: null, email: 'someone@nowhere.example', metadata: {} },
]

const PROMO_BPRFREE = {
  id: 'promo_1U06XY63lspobjfOcXNBKaSI',
  code: 'BPRFREE',
  metadata: { affiliate: 'bpr' },
  coupon: { id: 'XKfymWe7', percent_off: 100, duration: 'once', metadata: { affiliate_terms: '20pct-recurring-12mo' } },
}
const PROMO_SAVE10 = {
  id: 'promo_SAVE10',
  code: 'SAVE10',
  metadata: {},                                     // no affiliate tag
  coupon: { id: 'cpn_SAVE10', percent_off: 10, duration: 'once' },
}
// Indexed by id, human code AND coupon id — the handler does the same, so an
// invoice resolves however deeply Stripe expanded its discount.
const PROMOTION_CODES = {
  [PROMO_BPRFREE.id]: PROMO_BPRFREE,
  [PROMO_BPRFREE.code]: PROMO_BPRFREE,
  [PROMO_BPRFREE.coupon.id]: PROMO_BPRFREE,
  [PROMO_SAVE10.id]: PROMO_SAVE10,
  [PROMO_SAVE10.code]: PROMO_SAVE10,
  [PROMO_SAVE10.coupon.id]: PROMO_SAVE10,
}

const line = (plan, over = {}) => Object.assign({ metadata: { plan }, quantity: 1 }, over)

// BpR's real founding-package invoice: EUR 3,500, status open, unpaid.
const IN_BPR = {
  id: 'in_bpr', object: 'invoice', customer: 'cus_BPR', currency: 'eur',
  status: 'open', created: unix('2026-08-02T10:00:00Z'),
  subtotal: 350000, total: 350000, amount_due: 350000, amount_paid: 0,
  status_transitions: { paid_at: null },
  lines: { data: [line('growth_pro')], has_more: false },
}

// A paid subscription invoice. The account has none; this is the fixture.
const IN_ACME = {
  id: 'in_acme', object: 'invoice', customer: 'cus_ACME', currency: 'eur',
  status: 'paid', created: unix('2026-08-05T08:00:00Z'),
  subtotal: 29900, total: 29900, amount_due: 29900, amount_paid: 29900,
  status_transitions: { paid_at: unix('2026-08-05T08:00:30Z') },
  // Plan resolved from price.metadata.plan, the key stripe-webhook.js uses.
  lines: { data: [{ price: { id: 'price_1Ty5a3Kh2GaZE2B4WSWURHv8', metadata: { plan: 'growth' } }, quantity: 1 }], has_more: false },
}

// The BPRFREE free month: 100% off, EUR 0 paid, and the invoice that ATTRIBUTES
// the customer. June 2026, i.e. outside the August period under test.
const IN_REF1 = {
  id: 'in_ref1', object: 'invoice', customer: 'cus_REF', currency: 'eur',
  status: 'paid', created: unix('2026-06-10T09:00:00Z'),
  subtotal: 9900, total: 0, amount_due: 0, amount_paid: 0,
  status_transitions: { paid_at: unix('2026-06-10T09:00:10Z') },
  total_discount_amounts: [{ amount: 9900, discount: 'di_ref1' }],
  discounts: [{ id: 'di_ref1', promotion_code: { id: PROMO_BPRFREE.id, code: 'BPRFREE' }, coupon: PROMO_BPRFREE.coupon }],
  lines: { data: [line('essentials')], has_more: false },
}

// Month 2 for the same customer. Carries NO promotion code — the coupon's
// duration is `once`, so Stripe does not re-tag it (contract §4). Commissionable
// only because the June invoice attributed the customer.
const IN_REF2 = {
  id: 'in_ref2', object: 'invoice', customer: 'cus_REF', currency: 'eur',
  status: 'paid', created: unix('2026-08-10T09:00:00Z'),
  subtotal: 9900, total: 9900, amount_due: 9900, amount_paid: 9900,
  status_transitions: { paid_at: unix('2026-08-10T09:00:10Z') },
  lines: { data: [line('essentials')], has_more: false },
}

// Month 14 for the same customer: past the 12-month window.
const IN_REF3 = {
  id: 'in_ref3', object: 'invoice', customer: 'cus_REF', currency: 'eur',
  status: 'paid', created: unix('2027-08-10T09:00:00Z'),
  subtotal: 9900, total: 9900, amount_due: 9900, amount_paid: 9900,
  status_transitions: { paid_at: unix('2027-08-10T09:00:10Z') },
  lines: { data: [line('essentials')], has_more: false },
}

// A discounted invoice that is NOT affiliate-tagged, from a customer that
// resolves to no client at all.
const IN_GHOST = {
  id: 'in_ghost', object: 'invoice', customer: 'cus_GHOST', currency: 'eur',
  status: 'paid', created: unix('2026-08-20T12:00:00Z'),
  subtotal: 29900, total: 26910, amount_due: 26910, amount_paid: 26910,
  status_transitions: { paid_at: unix('2026-08-20T12:00:05Z') },
  total_discount_amounts: [{ amount: 2990, discount: 'di_ghost' }],
  discounts: [{ id: 'di_ghost', promotion_code: { id: PROMO_SAVE10.id, code: 'SAVE10' }, coupon: PROMO_SAVE10.coupon }],
  lines: { data: [line('growth')], has_more: false },
}

const ALL_INVOICES = [IN_BPR, IN_ACME, IN_REF1, IN_REF2, IN_REF3, IN_GHOST]

// A partial refund against IN_ACME, with the charge expanded as the handler
// expands it (contract §2: refund -> charge -> invoice/customer).
const RE_ACME = {
  id: 're_acme', object: 'refund', amount: 5000, currency: 'eur',
  created: unix('2026-08-25T15:00:00Z'),
  charge: { id: 'ch_acme', object: 'charge', invoice: 'in_acme', customer: 'cus_ACME' },
}

const PERIOD = periodForMonth('2026-08')

// ── 1. Period ───────────────────────────────────────────────────────────────
section('1. period (contract §6b)')
{
  assert.strictEqual(PERIOD.start, '2026-08-01')
  assert.strictEqual(PERIOD.end, '2026-08-31')
  assert.strictEqual(PERIOD.label, 'August 2026')
  ok('periodForMonth("2026-08") -> 2026-08-01 .. 2026-08-31, "August 2026"')

  // The inclusive `end` is a display value; every comparison uses the exclusive
  // one. An invoice created at 23:30 on the 31st must be inside its own month.
  assert.strictEqual(PERIOD.endMsExclusive, Date.UTC(2026, 8, 1))
  assert.ok(Date.parse('2026-08-31T23:30:00Z') < PERIOD.endMsExclusive)
  ok('the exclusive end is 2026-09-01T00:00Z, so 2026-08-31T23:30Z is inside August')

  // Defaults to the current UTC month.
  const feb = periodForMonth(undefined, new Date('2027-02-14T00:00:00Z'))
  assert.strictEqual(feb.start, '2027-02-01')
  assert.strictEqual(feb.end, '2027-02-28')
  assert.strictEqual(feb.label, 'February 2027')
  ok('no period given -> the current UTC month, with a correct non-leap February end')

  const leap = periodForMonth('2028-02')
  assert.strictEqual(leap.end, '2028-02-29')
  ok('leap February ends on the 29th')

  for (const junk of ['2026-13', 'August', '', null, {}, '2026-8']) {
    assert.doesNotThrow(() => periodForMonth(junk, new Date('2026-08-15T00:00:00Z')))
    assert.strictEqual(periodForMonth(junk, new Date('2026-08-15T00:00:00Z')).label, 'August 2026')
  }
  ok('a malformed period falls back to the current month rather than throwing')
}

// ── 2. Client join resolution (contract §3) ─────────────────────────────────
section('2. client join resolution (contract §3)')
{
  const byId = new Map(CLIENTS.map((c) => [c.id, c]))
  const byCust = new Map(CLIENTS.filter((c) => c.stripe_customer_id).map((c) => [c.stripe_customer_id, c]))

  // Path 1: customer.metadata.client_id. The founding-package path — this is the
  // ONLY key that resolves BpR, whose clients.stripe_customer_id is NULL.
  assert.deepStrictEqual(
    resolveClientForCustomer(CUSTOMERS[0], byId, byCust),
    { clientId: 1, attribution: 'metadata' })
  ok("metadata.client_id '1' -> clientId 1, attribution 'metadata'")

  // Path 2: clients.stripe_customer_id. The self-serve webhook path.
  assert.deepStrictEqual(
    resolveClientForCustomer(CUSTOMERS[1], byId, byCust),
    { clientId: 2, attribution: 'stripe_customer_id' })
  ok("no metadata, clients.stripe_customer_id matches -> clientId 2, attribution 'stripe_customer_id'")

  // Path 3: neither.
  assert.deepStrictEqual(
    resolveClientForCustomer(CUSTOMERS[3], byId, byCust),
    { clientId: null, attribution: 'unattributed' })
  ok("neither key resolves -> clientId null, attribution 'unattributed'")

  // Order matters: metadata WINS over the reverse join. A third party paying on
  // a client's behalf must land on the client the price named, not the payer.
  const both = { id: 'cus_ACME', metadata: { client_id: '1' } }
  assert.deepStrictEqual(resolveClientForCustomer(both, byId, byCust), { clientId: 1, attribution: 'metadata' })
  ok('metadata.client_id takes precedence over clients.stripe_customer_id')

  // Strict parse, matching resolveBoundClient() in stripe-webhook.js. Anything
  // that is not a whole number FALLS THROUGH rather than guessing a client.
  for (const raw of ['', '   ', '1 BpR', 'one', '1.5', '-1', '01x', null, undefined, {}]) {
    const c = { id: 'cus_X', metadata: { client_id: raw } }
    assert.strictEqual(resolveClientForCustomer(c, byId, byCust).clientId, null,
      `metadata.client_id ${JSON.stringify(raw)} must not resolve a client`)
  }
  ok('a non-integer metadata.client_id never resolves a client (strict /^\\d+$/, same as the webhook)')

  // A metadata id pointing at a client that does not exist must FALL THROUGH to
  // the reverse join, not fail outright — the customer may still be linked the
  // other way round.
  const ghostMeta = { id: 'cus_ACME', metadata: { client_id: '9999' } }
  assert.deepStrictEqual(resolveClientForCustomer(ghostMeta, byId, byCust),
    { clientId: 2, attribution: 'stripe_customer_id' })
  ok('metadata naming a non-existent client falls through to the stripe_customer_id join')

  // Plain objects work as well as Maps, and number/string keys both resolve.
  const objById = { 1: CLIENTS[0], 2: CLIENTS[1] }
  const objByCust = { cus_ACME: CLIENTS[1] }
  assert.strictEqual(resolveClientForCustomer(CUSTOMERS[0], objById, objByCust).clientId, 1)
  ok('lookup tolerates plain objects and the number/string key split')

  for (const junk of [null, undefined, 'cus_X', 42]) {
    assert.doesNotThrow(() => resolveClientForCustomer(junk, byId, byCust))
    assert.strictEqual(resolveClientForCustomer(junk, byId, byCust).attribution, 'unattributed')
  }
  ok('resolveClientForCustomer never throws on a malformed customer')
}

// ── 3. Plan resolution (contract §2) ────────────────────────────────────────
section('3. plan resolution (contract §2)')
{
  assert.strictEqual(planForInvoiceLine(line('growth_pro'), PRICE_TO_PLAN), 'growth_pro')
  ok('line.metadata.plan resolves (the key contract §2 names)')

  assert.strictEqual(
    planForInvoiceLine({ price: { id: 'price_x', metadata: { plan: 'growth' } } }, PRICE_TO_PLAN), 'growth')
  ok('price.metadata.plan resolves (the key stripe-webhook.js:358 uses)')

  // API 2026-07-29.dahlia shape: no embedded price object.
  assert.strictEqual(
    planForInvoiceLine({ pricing: { price_details: { metadata: { plan: 'radar' } } } }, PRICE_TO_PLAN), 'radar')
  assert.strictEqual(
    planForInvoiceLine({ pricing: { price_details: { price: 'price_1Ty5a3Kh2GaZE2B4WSWURHv8' } } }, PRICE_TO_PLAN),
    'growth')
  ok('the dahlia-era pricing.price_details shape resolves, by metadata and by price id')

  // The PRICE_TO_PLAN fallback, same role it plays in the webhook.
  assert.strictEqual(planForInvoiceLine({ price: { id: 'price_LEGACY_NO_METADATA' } }, PRICE_TO_PLAN), 'essentials')
  ok('a price with no metadata falls back to the PRICE_TO_PLAN map')

  assert.strictEqual(planForInvoiceLine({ price: { id: 'price_UNKNOWN' } }, PRICE_TO_PLAN), null)
  assert.strictEqual(planForInvoiceLine({}, PRICE_TO_PLAN), null)
  assert.strictEqual(planForInvoiceLine(null, PRICE_TO_PLAN), null)
  ok('an unresolvable line returns null rather than a guessed plan')

  // Whole-invoice resolution, and the mixed-plan flag.
  assert.deepStrictEqual(planForInvoice(IN_ACME, PRICE_TO_PLAN), { plan: 'growth', mixed: false, lineCount: 1 })
  const mixed = { lines: { data: [line('growth'), line('essentials')] } }
  assert.strictEqual(planForInvoice(mixed, PRICE_TO_PLAN).plan, 'growth')
  assert.strictEqual(planForInvoice(mixed, PRICE_TO_PLAN).mixed, true)
  ok('an invoice takes its first resolvable line\'s plan, and flags disagreeing lines as mixed')
}

// ── 4. Discount amounts (contract §4) ───────────────────────────────────────
section('4. discount amounts (contract §4)')
{
  // total_discount_amounts wins when Stripe provides it.
  // IN_REF1: subtotal 9900, total_discount_amounts [9900] => 9900 cents = EUR 99.00
  assert.strictEqual(invoiceDiscountCents(IN_REF1), 9900)
  ok('100%-off free month: total_discount_amounts 9900 cents = EUR 99.00 given away')

  // IN_GHOST: subtotal 29900, total_discount_amounts [2990] => 2990 = EUR 29.90
  assert.strictEqual(invoiceDiscountCents(IN_GHOST), 2990)
  ok('10%-off invoice: total_discount_amounts 2990 cents = EUR 29.90 given away')

  // Fallback when total_discount_amounts is absent: apply the coupon to the
  // PRE-discount subtotal. 29900 x 10% = 2990 cents = EUR 29.90 — the same
  // number, derived the other way.
  const noTda = { subtotal: 29900, total: 26910, discounts: [{ coupon: { percent_off: 10 } }] }
  assert.strictEqual(invoiceDiscountCents(noTda), 2990)
  ok('no total_discount_amounts: 10% of a 29900-cent subtotal = 2990 cents = EUR 29.90')

  // amount_off coupon: a flat 5000 cents = EUR 50.00 off.
  const flat = { subtotal: 29900, total: 24900, discounts: [{ coupon: { amount_off: 5000 } }] }
  assert.strictEqual(invoiceDiscountCents(flat), 5000)
  ok('an amount_off coupon of 5000 cents = EUR 50.00 off')

  // 100% of 9900 = 9900 cents = EUR 99.00, derived from the coupon alone.
  const freeMonth = { subtotal: 9900, total: 0, discounts: [{ coupon: { percent_off: 100 } }] }
  assert.strictEqual(invoiceDiscountCents(freeMonth), 9900)
  ok('a 100%-off coupon with no total_discount_amounts still reports the full 9900 cents')

  assert.strictEqual(invoiceDiscountCents(IN_ACME), 0)
  assert.strictEqual(invoiceDiscountCents(null), 0)
  ok('an undiscounted invoice reports 0, and a null invoice does not throw')
}

// ── 5. Affiliate attribution (contract §4) ──────────────────────────────────
section('5. affiliate attribution (contract §4)')
{
  const refInvoices = [IN_REF2, IN_REF1, IN_REF3]   // deliberately out of order
  const attribution = findAffiliateAttribution(refInvoices, PROMOTION_CODES)

  assert.ok(attribution, 'a customer whose first invoice carried BPRFREE must be attributed')
  assert.strictEqual(attribution.affiliateCode, 'bpr')
  assert.strictEqual(attribution.attributedAt, new Date(unix('2026-06-10T09:00:00Z') * 1000).toISOString())
  assert.strictEqual(attribution.invoiceId, 'in_ref1')
  ok('the EARLIEST tagged invoice attributes the customer, whatever order the list arrives in')

  // A promotion code with no metadata.affiliate is not an affiliate referral.
  assert.strictEqual(findAffiliateAttribution([IN_GHOST], PROMOTION_CODES), null)
  ok('SAVE10 carries no metadata.affiliate, so a discounted invoice is NOT an affiliate referral')

  assert.strictEqual(findAffiliateAttribution([IN_ACME], PROMOTION_CODES), null)
  assert.strictEqual(findAffiliateAttribution([], PROMOTION_CODES), null)
  assert.strictEqual(findAffiliateAttribution(null, PROMOTION_CODES), null)
  ok('no discount, an empty list, or a null list all return null')

  // Indexed by code alone, the way a caller might reasonably build the map.
  assert.strictEqual(findAffiliateAttribution([IN_REF1], { BPRFREE: PROMO_BPRFREE }).affiliateCode, 'bpr')
  // Indexed by coupon id alone.
  assert.strictEqual(findAffiliateAttribution([IN_REF1], { XKfymWe7: PROMO_BPRFREE }).affiliateCode, 'bpr')
  ok('the promotion-code map resolves by promo id, by human code, or by coupon id')
}

// ── 6. Commission window and amount (contract §4) ───────────────────────────
section('6. commission window and amount (contract §4)')
{
  const attributedAt = '2026-06-10T09:00:00.000Z'

  assert.strictEqual(isWithinCommissionWindow('2026-06-10T09:00:00Z', attributedAt), true)
  assert.strictEqual(isWithinCommissionWindow('2026-08-10T09:00:00Z', attributedAt), true)
  assert.strictEqual(isWithinCommissionWindow('2027-06-09T23:59:59Z', attributedAt), true)
  ok('month 0, month 2 and the last instant of month 11 are all inside the window')

  // HALF-OPEN: exactly 12 months later is OUT. "20% recurring for 12 months"
  // must not accrue a thirteenth commission.
  assert.strictEqual(isWithinCommissionWindow('2027-06-10T09:00:00Z', attributedAt), false)
  assert.strictEqual(isWithinCommissionWindow('2027-08-10T09:00:00Z', attributedAt), false)
  ok('exactly +12 months is OUTSIDE, and so is month 14 (half-open window)')

  assert.strictEqual(isWithinCommissionWindow('2026-06-09T09:00:00Z', attributedAt), false)
  ok('an invoice predating the referral is outside the window')

  for (const junk of [null, undefined, '', 'nope', {}]) {
    assert.strictEqual(isWithinCommissionWindow(junk, attributedAt), false)
    assert.strictEqual(isWithinCommissionWindow('2026-08-10T09:00:00Z', junk), false)
  }
  ok('an unparseable date on either side is outside the window, never inside')

  const attribution = findAffiliateAttribution([IN_REF1, IN_REF2, IN_REF3], PROMOTION_CODES)

  // THE FREE MONTH ITSELF. D-7: "free month = zero commission accrues".
  // in_ref1: amount_paid 0, and it IS the attributing invoice => 0 cents = EUR 0.00
  assert.strictEqual(computeCommissionForInvoice(IN_REF1, attribution), 0)
  ok('the attributing free month accrues 0 cents = EUR 0.00 commission')

  // MONTH 2, inside the window.
  // in_ref2: amount_paid 9900 cents x 20% = 1980 cents = EUR 19.80
  assert.strictEqual(computeCommissionForInvoice(IN_REF2, attribution), 1980)
  ok('month 2: 9900 cents paid x 20% = 1980 cents = EUR 19.80 commission')

  // MONTH 14, window expired.
  // in_ref3: amount_paid 9900, paid_at 2027-08-10 > 2026-06-10 + 12mo => 0 cents = EUR 0.00
  assert.strictEqual(computeCommissionForInvoice(IN_REF3, attribution), 0)
  ok('month 14: window expired, 0 cents = EUR 0.00 commission despite 9900 cents paid')

  // An unattributed customer never accrues commission.
  assert.strictEqual(computeCommissionForInvoice(IN_ACME, null), 0)
  assert.strictEqual(computeCommissionForInvoice(IN_ACME, { affiliateCode: '' }), 0)
  ok('no attribution -> 0 commission')

  // An OPEN invoice accrues nothing: commission is on paid revenue.
  // in_bpr: amount_paid 0 (status open) => 0 cents, even at 350000 total.
  assert.strictEqual(
    computeCommissionForInvoice(IN_BPR, { affiliateCode: 'bpr', attributedAt, invoiceId: 'in_other' }), 0)
  ok('an OPEN invoice of 350000 cents accrues 0 commission — nothing has been paid')

  // The rate is the coupon's own documented 20%, not a local guess.
  assert.strictEqual(COMMISSION_RATE, 0.20)
  // 350000 cents x 20% = 70000 cents = EUR 700.00, had it been paid inside the window.
  assert.strictEqual(
    computeCommissionForInvoice(
      Object.assign({}, IN_BPR, { amount_paid: 350000, status_transitions: { paid_at: unix('2026-08-02T10:00:00Z') } }),
      { affiliateCode: 'bpr', attributedAt, invoiceId: 'in_other' }),
    70000)
  ok('350000 cents paid inside the window x 20% = 70000 cents = EUR 700.00')
}

// ── 7. Refund attribution (contract §2) ─────────────────────────────────────
section('7. refund attribution (contract §2)')
{
  assert.deepStrictEqual(refundTarget(RE_ACME), { invoiceId: 'in_acme', customerId: 'cus_ACME' })
  ok('refund -> expanded charge -> invoice + customer')

  // An unexpanded charge yields nothing, which the aggregate turns into a
  // warning rather than netting the refund against an arbitrary client.
  assert.deepStrictEqual(refundTarget({ id: 're_x', charge: 'ch_x' }), { invoiceId: null, customerId: null })
  ok('an unexpanded charge id resolves to nothing (the caller warns instead of guessing)')

  for (const junk of [null, undefined, 'r', 42, {}]) {
    assert.doesNotThrow(() => refundTarget(junk))
  }
  ok('refundTarget never throws')
}

// ── 8. API cost, matching Usage.tsx exactly (contract §5) ───────────────────
section('8. API cost (contract §5, mirrors Usage.tsx:145-192)')
{
  const rows = [
    { client_id: 1, llm: 'claude', cost_eur: 0.0331 },      // metered
    { client_id: 1, llm: 'gemini', cost_eur: null },        // legacy NULL -> flat estimate
    { client_id: 2, llm: 'chatgpt', cost_eur: 0.0615 },     // metered
  ]
  const { costByClientId, estimatedRowsByClientId, totalCostEur, totalEstimatedRows } =
    sumApiCostByClient(rows, ENGINE_COST_EUR)

  // Client 1: 0.0331 metered + gemini's flat 0.032 fallback = 0.0651
  assert.strictEqual(ENGINE_COST_EUR.gemini, 0.032, 'the fallback must be _cost.js\'s real figure')
  near(costByClientId[1], 0.0331 + 0.032)
  ok('client 1: 0.0331 metered + 0.032 legacy fallback = EUR 0.0651')

  // Client 2: 0.0615 metered, no fallback rows.
  near(costByClientId[2], 0.0615)
  assert.strictEqual(estimatedRowsByClientId[2], undefined)
  ok('client 2: 0.0615 metered, 0 estimated rows')

  assert.strictEqual(estimatedRowsByClientId[1], 1)
  assert.strictEqual(totalEstimatedRows, 1)
  near(totalCostEur, 0.0331 + 0.032 + 0.0615)
  ok('1 of 3 rows is a flat estimate; total EUR 0.1266')

  // A NULL cost on an engine with no entry costs 0, exactly as Usage.tsx's
  // `ENGINE_COST[llm] ?? 0` does — not NaN, which would poison every total.
  const unknown = sumApiCostByClient([{ client_id: 9, llm: 'not_an_engine', cost_eur: null }], ENGINE_COST_EUR)
  assert.strictEqual(unknown.costByClientId[9], 0)
  ok('an unknown engine with a NULL cost contributes 0, not NaN')

  assert.doesNotThrow(() => sumApiCostByClient(null, ENGINE_COST_EUR))
  assert.doesNotThrow(() => sumApiCostByClient([null, {}, { client_id: null }], ENGINE_COST_EUR))
  ok('sumApiCostByClient never throws on malformed rows')
}

// ── 9. Full aggregation (contract §5, §6b) ──────────────────────────────────
section('9. full aggregation for August 2026 (contract §5, §6b)')
{
  // API cost for the period, as sumApiCostByClient would have produced it.
  // Client 60 is a research study: it costs money and earns nothing.
  const costByClientId = { 1: 12.3456, 2: 3.21, 60: 45.00 }

  const result = aggregateRevenue({
    invoices: ALL_INVOICES,     // FULL history: June and 2027 invoices included
    refunds: [RE_ACME],
    customers: CUSTOMERS,
    clients: CLIENTS,
    costByClientId,
    period: PERIOD,
    priceToPlanFallback: PRICE_TO_PLAN,
    promotionCodes: PROMOTION_CODES,
  })

  const g = result.global

  // ── GROSS INVOICED: every invoice CREATED in August 2026, at invoice.total.
  //   in_bpr    350000 (open, unpaid)      = EUR 3,500.00
  //   in_acme    29900                     = EUR   299.00
  //   in_ref2     9900                     = EUR    99.00
  //   in_ghost   26910 (29900 less 10%)    = EUR   269.10
  //   in_ref1  (created 2026-06-10)        excluded
  //   in_ref3  (created 2027-08-10)        excluded
  //   total    416710 cents                = EUR 4,167.10
  assert.strictEqual(g.grossInvoicedEur, 4167.10)
  ok('grossInvoicedEur = 3500.00 + 299.00 + 99.00 + 269.10 = EUR 4,167.10 (June and 2027 invoices excluded)')

  // ── PAID REVENUE: sum of amount_paid where paid_at is in August.
  //   in_bpr        0 (status open, due 2026-08-04)  = EUR   0.00
  //   in_acme   29900                                = EUR 299.00
  //   in_ref2    9900                                = EUR  99.00
  //   in_ghost  26910                                = EUR 269.10
  //   total     66710 cents                          = EUR 667.10
  assert.strictEqual(g.paidRevenueEur, 667.10)
  ok('paidRevenueEur = 0.00 + 299.00 + 99.00 + 269.10 = EUR 667.10 (the open EUR 3,500 contributes nothing)')

  // The two are DIFFERENT NUMBERS and that is contract §5's whole point.
  assert.notStrictEqual(g.grossInvoicedEur, g.paidRevenueEur)
  assert.strictEqual(round2(g.grossInvoicedEur - g.paidRevenueEur), 3500.00)
  ok("gross minus paid is exactly BpR's unpaid EUR 3,500 founding invoice")

  // ── REFUNDS: re_acme, 5000 cents created 2026-08-25 = EUR 50.00
  assert.strictEqual(g.refundsEur, 50.00)
  ok('refundsEur = EUR 50.00')

  // ── DISCOUNTS: only invoices CREATED in the period.
  //   in_ghost  2990  = EUR 29.90
  //   in_ref1   9900  excluded (created 2026-06-10)
  assert.strictEqual(g.discountsEur, 29.90)
  ok('discountsEur = EUR 29.90 (the June free month is outside the period)')

  // ── AFFILIATE COMMISSION: 20% of in_ref2 only.
  //   9900 x 0.20 = 1980 cents = EUR 19.80
  assert.strictEqual(g.affiliateCommissionEstEur, 19.80)
  ok('affiliateCommissionEstEur = 9900 x 20% = EUR 19.80 (free month 0, month 14 outside the window)')

  // ── API COST: 12.3456 + 3.21 + 45.00 = 60.5556 -> EUR 60.56 displayed
  assert.strictEqual(g.estimatedApiCostEur, 60.56)
  ok('estimatedApiCostEur = 12.3456 + 3.21 + 45.00 = EUR 60.5556, displayed as 60.56')

  // ── NET (contract §5): paid - refunds - commission - cost
  //   667.10 - 50.00 - 19.80 - 60.5556 = 536.7444 -> EUR 536.74
  // Computed from UNROUNDED cost, so this is 536.74 and not 536.73.
  assert.strictEqual(g.netRevenueEur, 536.74)
  ok('netRevenueEur = 667.10 - 50.00 - 19.80 - 60.5556 = EUR 536.74')

  // ── byPlan ────────────────────────────────────────────────────────────────
  const plan = (id) => result.byPlan.find((p) => p.plan === id)

  // growth_pro: in_bpr only. gross 3500.00, paid 0, cost 12.3456
  //   net = 0 - 0 - 0 - 12.3456 = -12.3456 -> EUR -12.35
  assert.strictEqual(plan('growth_pro').grossInvoicedEur, 3500.00)
  assert.strictEqual(plan('growth_pro').paidRevenueEur, 0)
  assert.strictEqual(plan('growth_pro').invoiceCount, 1)
  assert.strictEqual(plan('growth_pro').netRevenueEur, -12.35)
  ok('byPlan growth_pro: EUR 3,500.00 invoiced, EUR 0.00 paid, net EUR -12.35 (cost only)')

  // growth: in_acme + in_ghost. gross 299.00 + 269.10 = 568.10, paid the same,
  //   refunds 50.00, discounts 29.90, cost 3.21 (client 2 is on growth)
  //   net = 568.10 - 50.00 - 0 - 3.21 = EUR 514.89
  assert.strictEqual(plan('growth').grossInvoicedEur, 568.10)
  assert.strictEqual(plan('growth').paidRevenueEur, 568.10)
  assert.strictEqual(plan('growth').refundsEur, 50.00)
  assert.strictEqual(plan('growth').discountsEur, 29.90)
  assert.strictEqual(plan('growth').invoiceCount, 2)
  assert.strictEqual(plan('growth').netRevenueEur, 514.89)
  ok('byPlan growth: EUR 568.10 paid, EUR 50.00 refunded, EUR 3.21 cost, net EUR 514.89')

  // essentials: in_ref2. gross/paid 99.00, commission 19.80, cost 0
  //   net = 99.00 - 0 - 19.80 - 0 = EUR 79.20
  assert.strictEqual(plan('essentials').paidRevenueEur, 99.00)
  assert.strictEqual(plan('essentials').affiliateCommissionEstEur, 19.80)
  assert.strictEqual(plan('essentials').netRevenueEur, 79.20)
  ok('byPlan essentials: EUR 99.00 paid less EUR 19.80 commission = net EUR 79.20')

  // pro: the research study. No invoices at all, EUR 45.00 of cost.
  //   net = 0 - 0 - 0 - 45.00 = EUR -45.00
  assert.strictEqual(plan('pro').grossInvoicedEur, 0)
  assert.strictEqual(plan('pro').invoiceCount, 0)
  assert.strictEqual(plan('pro').netRevenueEur, -45.00)
  ok('byPlan pro: no revenue, EUR 45.00 of research cost, net EUR -45.00')

  // byPlan MUST sum to global, or the page contradicts itself on screen.
  const sumBy = (rows, key) => round2(rows.reduce((s, r) => s + r[key], 0))
  assert.strictEqual(sumBy(result.byPlan, 'grossInvoicedEur'), g.grossInvoicedEur)
  assert.strictEqual(sumBy(result.byPlan, 'paidRevenueEur'), g.paidRevenueEur)
  assert.strictEqual(sumBy(result.byPlan, 'refundsEur'), g.refundsEur)
  assert.strictEqual(sumBy(result.byPlan, 'discountsEur'), g.discountsEur)
  assert.strictEqual(sumBy(result.byPlan, 'affiliateCommissionEstEur'), g.affiliateCommissionEstEur)
  ok('every byPlan column sums to its global figure')

  // ── byClient, one row per attribution path (contract §6b) ─────────────────
  const client = (id) => result.byClient.find((c) => c.clientId === id)

  // Path 1, metadata: BpR. gross 3500.00, paid 0, cost 12.3456 -> net -12.35
  assert.strictEqual(client(1).attribution, 'metadata')
  assert.strictEqual(client(1).clientName, 'Bucate pe Roate')
  assert.strictEqual(client(1).stripeCustomerId, 'cus_BPR')
  assert.strictEqual(client(1).grossInvoicedEur, 3500.00)
  assert.strictEqual(client(1).paidRevenueEur, 0)
  assert.strictEqual(client(1).netRevenueEur, -12.35)
  ok("byClient 1 (metadata): EUR 3,500.00 invoiced, EUR 0.00 paid, net EUR -12.35")

  // Path 2, stripe_customer_id: Acme. paid 299.00, refund 50.00, cost 3.21
  //   net = 299.00 - 50.00 - 0 - 3.21 = EUR 245.79
  assert.strictEqual(client(2).attribution, 'stripe_customer_id')
  assert.strictEqual(client(2).refundsEur, 50.00)
  assert.strictEqual(client(2).netRevenueEur, 245.79)
  ok('byClient 2 (stripe_customer_id): EUR 299.00 paid less EUR 50.00 refund less EUR 3.21 cost = net EUR 245.79')

  // The referred client: paid 99.00, commission 19.80 -> net EUR 79.20
  assert.strictEqual(client(3).attribution, 'stripe_customer_id')
  assert.strictEqual(client(3).affiliateCommissionEstEur, 19.80)
  assert.strictEqual(client(3).netRevenueEur, 79.20)
  ok('byClient 3: EUR 99.00 paid less EUR 19.80 affiliate commission = net EUR 79.20')

  // Path 3, unattributed: its own row, NOT dropped and NOT guessed onto a client.
  //   paid 269.10, discounts 29.90, no cost -> net EUR 269.10
  const ghost = result.byClient.find((c) => c.attribution === 'unattributed')
  assert.ok(ghost, 'an unresolved customer must appear as its own row (contract §3)')
  assert.strictEqual(ghost.clientId, null)
  assert.strictEqual(ghost.stripeCustomerId, 'cus_GHOST')
  assert.strictEqual(ghost.grossInvoicedEur, 269.10)
  assert.strictEqual(ghost.discountsEur, 29.90)
  assert.strictEqual(ghost.netRevenueEur, 269.10)
  ok('byClient unattributed: clientId null, EUR 269.10 invoiced, EUR 29.90 discounted, still counted')

  // A client with API cost and NO Stripe activity still gets a row, or the table
  // would not sum to its own global total.
  assert.strictEqual(client(60).estimatedApiCostEur, 45.00)
  assert.strictEqual(client(60).netRevenueEur, -45.00)
  assert.strictEqual(client(60).attribution, null)
  ok('byClient 60 (cost only, no Stripe customer): net EUR -45.00, attribution null')

  assert.strictEqual(sumBy(result.byClient, 'grossInvoicedEur'), g.grossInvoicedEur)
  assert.strictEqual(sumBy(result.byClient, 'paidRevenueEur'), g.paidRevenueEur)
  assert.strictEqual(sumBy(result.byClient, 'estimatedApiCostEur'), 60.56)
  ok('every byClient column sums to its global figure')

  // Only the three contract §6b values, plus null for a cost-only row.
  for (const row of result.byClient) {
    assert.ok(['metadata', 'stripe_customer_id', 'unattributed', null].includes(row.attribution),
      `unexpected attribution value: ${row.attribution}`)
  }
  ok('every attribution value is one of metadata / stripe_customer_id / unattributed / null')

  // ── affiliates ────────────────────────────────────────────────────────────
  const bpr = result.affiliates.find((a) => a.affiliateCode === 'bpr')
  assert.ok(bpr)
  assert.strictEqual(bpr.redemptions, 1)
  assert.strictEqual(bpr.attributedClients, 1)
  assert.strictEqual(bpr.commissionAccruedEur, 19.80)
  ok('affiliates: bpr, 1 redemption, 1 attributed client, EUR 19.80 accrued')

  // SAVE10 is a discount, not an affiliate, and must not appear.
  assert.strictEqual(result.affiliates.length, 1)
  ok('a non-affiliate promotion code creates no affiliate row')

  // ── warnings ──────────────────────────────────────────────────────────────
  assert.ok(result.warnings.some((w) => /cus_GHOST/.test(w) && /no client/.test(w)),
    'an unattributed paying customer must be named in meta.warnings')
  ok('meta.warnings names the unattributed customer and the amount it invoiced')
}

// ── 10. Aggregation edge cases ──────────────────────────────────────────────
section('10. aggregation edge cases')
{
  // An invoice whose plan cannot be resolved is bucketed and WARNED, not dropped.
  //   80000 cents = EUR 800.00 under "(unknown)"
  const orphan = {
    id: 'in_orphan', customer: 'cus_ACME', currency: 'eur', status: 'paid',
    created: unix('2026-08-12T10:00:00Z'),
    subtotal: 80000, total: 80000, amount_paid: 80000,
    status_transitions: { paid_at: unix('2026-08-12T10:00:00Z') },
    lines: { data: [{ price: { id: 'price_NOT_IN_MAP' } }], has_more: false },
  }
  const r = aggregateRevenue({
    invoices: [orphan], customers: CUSTOMERS, clients: CLIENTS,
    period: PERIOD, priceToPlanFallback: PRICE_TO_PLAN, promotionCodes: PROMOTION_CODES,
  })
  assert.strictEqual(r.global.grossInvoicedEur, 800.00)
  assert.strictEqual(r.byPlan.find((p) => p.plan === UNKNOWN_PLAN).grossInvoicedEur, 800.00)
  assert.ok(r.warnings.some((w) => /in_orphan/.test(w) && /plan could not be resolved/.test(w)))
  ok('an unresolvable plan: EUR 800.00 counted under "(unknown)" and named in warnings')

  // A non-EUR invoice is summed as if it were EUR, and says so.
  const usd = Object.assign({}, orphan, { id: 'in_usd', currency: 'usd' })
  const rUsd = aggregateRevenue({
    invoices: [usd], customers: CUSTOMERS, clients: CLIENTS,
    period: PERIOD, priceToPlanFallback: PRICE_TO_PLAN,
  })
  assert.ok(rUsd.warnings.some((w) => /USD/.test(w)))
  ok('a non-EUR invoice raises a warning rather than being silently mixed in')

  // A refund that traces to nothing still reaches the global total.
  //   1234 cents = EUR 12.34
  const orphanRefund = { id: 're_orphan', amount: 1234, created: unix('2026-08-14T10:00:00Z'), charge: 'ch_unexpanded' }
  const rRef = aggregateRevenue({
    invoices: [], refunds: [orphanRefund], customers: CUSTOMERS, clients: CLIENTS, period: PERIOD,
  })
  assert.strictEqual(rRef.global.refundsEur, 12.34)
  assert.strictEqual(rRef.global.netRevenueEur, -12.34)
  assert.ok(rRef.warnings.some((w) => /re_orphan/.test(w)))
  ok('an untraceable EUR 12.34 refund still nets the global total, and is warned about')

  // A refund created outside the period is ignored entirely.
  const oldRefund = Object.assign({}, RE_ACME, { id: 're_old', created: unix('2026-07-25T15:00:00Z') })
  const rOld = aggregateRevenue({
    invoices: ALL_INVOICES, refunds: [oldRefund], customers: CUSTOMERS, clients: CLIENTS, period: PERIOD,
    priceToPlanFallback: PRICE_TO_PLAN, promotionCodes: PROMOTION_CODES,
  })
  assert.strictEqual(rOld.global.refundsEur, 0)
  ok('a July refund contributes EUR 0.00 to August')

  // Two Stripe customers for one client MERGE into one row.
  //   29900 + 9900 = 39800 cents = EUR 398.00
  const second = Object.assign({}, IN_REF2, { id: 'in_second', customer: 'cus_SECOND' })
  const merged = aggregateRevenue({
    invoices: [IN_ACME, second],
    customers: [...CUSTOMERS, { id: 'cus_SECOND', metadata: { client_id: '2' } }],
    clients: CLIENTS, period: PERIOD, priceToPlanFallback: PRICE_TO_PLAN,
  })
  const acme = merged.byClient.filter((c) => c.clientId === 2)
  assert.strictEqual(acme.length, 1, 'one client, one row, however many Stripe customers')
  assert.strictEqual(acme[0].grossInvoicedEur, 398.00)
  ok('two Stripe customers resolving to client 2 merge into one EUR 398.00 row')

  // Empty everything is a valid, all-zero report rather than a crash.
  const empty = aggregateRevenue({ period: PERIOD })
  assert.strictEqual(empty.global.grossInvoicedEur, 0)
  assert.strictEqual(empty.global.netRevenueEur, 0)
  assert.deepStrictEqual(empty.byClient, [])
  ok('an empty account produces an all-zero report, not an error')

  // A missing period is a programming error and must be loud.
  assert.throws(() => aggregateRevenue({}), /periodForMonth/)
  assert.throws(() => aggregateRevenue({ period: { start: '2026-08-01' } }), /periodForMonth/)
  ok('a missing or malformed period throws rather than silently reporting on all time')
}

// ── 11. ISO week keys ───────────────────────────────────────────────────────
section('11. ISO-8601 week keys (contract §9)')
{
  // 2026-08-03 is a Monday, so 08-03 .. 08-09 is one ISO week.
  assert.strictEqual(isoWeekKey(Date.parse('2026-08-03T00:00:00Z')), isoWeekKey(Date.parse('2026-08-09T23:59:59Z')))
  assert.notStrictEqual(isoWeekKey(Date.parse('2026-08-09T00:00:00Z')), isoWeekKey(Date.parse('2026-08-10T00:00:00Z')))
  ok('Mon 2026-08-03 through Sun 2026-08-09 is one week; 08-10 starts the next')

  // The Thursday rule: 2026-12-31 is a Thursday, so 2027-01-01 belongs to ISO
  // week 2026-W53. Keying on the calendar year would collapse it into 2027-W01
  // and understate a client active either side of new year.
  assert.strictEqual(isoWeekKey(Date.parse('2026-12-31T00:00:00Z')), '2026-W53')
  assert.strictEqual(isoWeekKey(Date.parse('2027-01-01T00:00:00Z')), '2026-W53')
  assert.strictEqual(isoWeekKey(Date.parse('2027-01-04T00:00:00Z')), '2027-W01')
  ok('the Thursday rule holds across the year boundary (2027-01-01 is 2026-W53)')
}

// ── 12. Plan ladder / opportunity value (contract §9) ───────────────────────
section('12. plan ladder and opportunity value (contract §9)')
{
  // Values mirror src/pages/Account.tsx's PLAN_TIERS; radar is the LIST price
  // (39) per contract §9 and §6b's own example, not the 29 launch price.
  assert.deepStrictEqual(nextOfferedPlan('free'), { plan: 'radar', listPriceEur: 39 })
  assert.deepStrictEqual(nextOfferedPlan('radar'), { plan: 'essentials', listPriceEur: 99 })
  assert.deepStrictEqual(nextOfferedPlan('essentials'), { plan: 'growth', listPriceEur: 299 })
  assert.deepStrictEqual(nextOfferedPlan('growth'), { plan: 'growth_pro', listPriceEur: 449 })
  assert.deepStrictEqual(nextOfferedPlan('growth_pro'), { plan: 'managed', listPriceEur: 1500 })
  ok('every rung points at the next one, at Account.tsx\'s prices (free -> radar at EUR 39)')

  // 'pro' is legacy with no new signups, exactly as Account.tsx excludes it from
  // PLAN_TIERS. A Managed client is offered Enterprise, not a tier nobody can buy.
  assert.deepStrictEqual(nextOfferedPlan('managed'), { plan: 'enterprise', listPriceEur: null })
  ok("'pro' is skipped as an upgrade target (legacy); managed -> enterprise, no list price")

  assert.strictEqual(nextOfferedPlan('enterprise'), null)
  assert.strictEqual(nextOfferedPlan('not_a_plan'), null)
  ok('the top of the ladder and an unknown plan both return null')

  // The ladder order must match planConfig.ts's PLAN_ORDER export.
  assert.deepStrictEqual(PLAN_LADDER.map((p) => p.plan),
    ['free', 'radar', 'essentials', 'growth', 'growth_pro', 'managed', 'pro', 'enterprise'])
  ok('PLAN_LADDER order matches planConfig.ts PLAN_ORDER')
}

// ── 13. Engagement pipeline (contract §9) ───────────────────────────────────
section('13. engagement pipeline (contract §9)')
{
  const now = new Date('2026-08-31T12:00:00Z')   // window opens 2026-07-02T12:00Z

  const aiResultsRows = [
    // Client 52: three distinct Mondays -> 3 weeks -> ENGAGED (threshold 3).
    { client_id: 52, checked_at: '2026-08-03T09:00:00Z' },
    { client_id: 52, checked_at: '2026-08-10T09:00:00Z' },
    { client_id: 52, checked_at: '2026-08-17T09:00:00Z' },
    // Same ISO week as 08-17 (Mon) — a Tuesday. Must NOT count as a fourth week.
    { client_id: 52, checked_at: '2026-08-18T11:00:00Z' },
    // Outside the 60-day window. Must not count at all.
    { client_id: 52, checked_at: '2026-05-01T09:00:00Z' },

    // Client 53: two rows in ONE week -> 1 week -> "used it once", NOT engaged.
    { client_id: 53, checked_at: '2026-08-04T09:00:00Z' },
    { client_id: 53, checked_at: '2026-08-05T09:00:00Z' },

    // Client 54: exactly 2 distinct weeks -> the far side of the boundary.
    { client_id: 54, checked_at: '2026-08-03T09:00:00Z' },
    { client_id: 54, checked_at: '2026-08-10T09:00:00Z' },

    // Client 56 is category 'research' — it must be excluded despite activity.
    { client_id: 56, checked_at: '2026-08-03T09:00:00Z' },
    { client_id: 56, checked_at: '2026-08-10T09:00:00Z' },
    { client_id: 56, checked_at: '2026-08-17T09:00:00Z' },
  ]

  const freeClients = CLIENTS.filter((c) => c.plan === 'free')
  const pipeline = computeEngagementPipeline({ freeClients, aiResultsRows, windowDays: 60, engagedWeeks: 3, now })

  assert.strictEqual(pipeline.windowDays, 60)
  assert.strictEqual(pipeline.engagedThresholdWeeks, 3)
  ok('pipeline echoes its own window and threshold (contract §6b)')

  const byId = Object.fromEntries(pipeline.clients.map((c) => [c.clientId, c]))

  // ENGAGED side of the boundary: 3 distinct weeks.
  assert.strictEqual(byId[52].distinctActiveWeeks, 3)
  assert.strictEqual(byId[52].engaged, true)
  assert.strictEqual(byId[52].lastActiveAt, '2026-08-18T11:00:00.000Z')
  ok('client 52: 4 rows across 3 distinct ISO weeks -> 3 weeks, ENGAGED (a same-week repeat adds nothing)')

  // NOT-ENGAGED side of the boundary: 2 distinct weeks.
  assert.strictEqual(byId[54].distinctActiveWeeks, 2)
  assert.strictEqual(byId[54].engaged, false)
  ok('client 54: 2 distinct weeks -> NOT engaged (threshold is 3)')

  // "Used it once": two rows, one week.
  assert.strictEqual(byId[53].distinctActiveWeeks, 1)
  assert.strictEqual(byId[53].engaged, false)
  ok('client 53: 2 rows in one week -> 1 week, NOT engaged (the "used it once" case)')

  // Opportunity value: free's next rung is Radar at EUR 39/month.
  assert.strictEqual(byId[52].opportunityMonthlyEur, 39)
  assert.strictEqual(byId[52].nextPlan, 'radar')
  ok('every free client is worth EUR 39/month of opportunity, nextPlan radar')

  // Exclusions.
  assert.strictEqual(byId[55], undefined)
  ok('client 55 (free, zero activity in 60 days) is omitted — dormant, not a campaign target')
  assert.strictEqual(byId[56], undefined)
  ok("client 56 (category 'research') is excluded despite 3 weeks of activity")

  // Ranked most engaged first.
  assert.deepStrictEqual(pipeline.clients.map((c) => c.clientId), [52, 54, 53])
  ok('clients are ranked most engaged first: 52 (3wk), 54 (2wk), 53 (1wk)')

  // The window is enforced inside the function, not only in the query.
  const narrow = computeEngagementPipeline({ freeClients, aiResultsRows, windowDays: 14, engagedWeeks: 3, now })
  const narrowById = Object.fromEntries(narrow.clients.map((c) => [c.clientId, c]))
  // 14 days back from 2026-08-31T12:00Z is 2026-08-17T12:00Z, so only the
  // 2026-08-18 row survives for client 52 -> 1 distinct week.
  assert.strictEqual(narrowById[52].distinctActiveWeeks, 1)
  assert.strictEqual(narrowById[53], undefined)
  ok('a 14-day window drops everything older: client 52 falls to 1 week, client 53 disappears')

  assert.doesNotThrow(() => computeEngagementPipeline({}))
  assert.doesNotThrow(() => computeEngagementPipeline({ freeClients: [null], aiResultsRows: [null, {}] }))
  ok('computeEngagementPipeline never throws on empty or malformed input')
}

console.log(`\n${passed} checks passed.`)
console.log('NOT covered here (no Stripe test mode, no DB): that revenue-report.js')
console.log('fetches the right Stripe objects, pages them correctly, or that')
console.log('requireAuth rejects a non-admin. See the curl in the handoff packet.')

// round2 is used above for a couple of derived assertions; imported last so the
// fixture block above reads as data rather than as setup.
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100 }
