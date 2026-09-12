/**
 * affiliate_stripe.test.js: the Stripe side of the affiliate module.
 *
 *   1. stripe-webhook.js refuses an unsigned or badly signed payload with 400
 *      before touching anything (the real stripe library, a placeholder secret).
 *   2. The webhook's HANDLED set carries invoice.paid and charge.refunded and
 *      hands every accepted event to the affiliate hook (checked in source, the
 *      only way to test it without a Stripe signature).
 *   3. _affiliate_stripe.handleStripeEvent, driven directly with the in-memory
 *      fake: coupon attribution on checkout, invoice de-duplication, renewals
 *      inside and outside the recurring window, partial and full refunds,
 *      subscription cancellation, the terms-acceptance and stored-attribution
 *      paths, and an unattributed buyer.
 *
 * Run: `node tests/affiliate_stripe.test.js` from brandgeo-dashboard/.
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const env = require('./helpers/affiliate_test_env')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')

env.installAuthMock()
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key'
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'

const webhook = env.fn('stripe-webhook.js')
const aff = env.fn('_affiliate_stripe.js')
const core = env.fn('_affiliate_core.js')

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)
const quiet = () => {}

async function main() {
  section('webhook signature')
  const body = JSON.stringify({ id: 'evt_1', type: 'invoice.paid', data: { object: { id: 'in_1', amount_paid: 29900 } } })
  let res = await webhook.handler({ httpMethod: 'POST', headers: {}, body, isBase64Encoded: false })
  assert.strictEqual(res.statusCode, 400)
  assert.match(res.body, /^Webhook signature failed/)
  res = await webhook.handler({ httpMethod: 'POST', headers: { 'stripe-signature': 't=1,v1=deadbeef' }, body, isBase64Encoded: false })
  assert.strictEqual(res.statusCode, 400)
  ok('an unsigned or wrongly signed event is refused with 400 and nothing runs')

  section('webhook wiring (source)')
  const src = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'stripe-webhook.js'), 'utf8')
  const handled = /const HANDLED = new Set\(\[([\s\S]*?)\]\)/.exec(src)[1]
  for (const t of ['checkout.session.completed', 'customer.subscription.deleted', 'invoice.paid', 'charge.refunded']) assert.ok(handled.includes(`'${t}'`), `HANDLED lacks ${t}`)
  assert.ok(/await handleAffiliateEvent\(supabase, type, stripeEvent\.data\.object, log\)/.test(src))
  assert.ok(/require\('\.\/_affiliate_stripe'\)/.test(src))
  ok('invoice.paid and charge.refunded are accepted and every accepted event reaches the affiliate hook')
  assert.ok(src.indexOf('await handleAffiliateEvent(') > src.indexOf("from('stripe_events').insert"), 'the affiliate hook runs after the idempotency insert')
  ok('the hook runs inside the event idempotency lock, so a retry cannot double-record')

  section('affiliate Stripe handlers with the fake')
  const db = createFakeSupabase()
  const [program] = db.seed('affiliate_programs', [{ slug: 'brandgeo', name: 'BrandGEO', destination_url: 'https://getbrandgeo.com/', status: 'active', is_public: true, sale_commission_type: 'percent', sale_commission_bps: 2000, recurring_commission_bps: 2000, recurring_months: 12, attribution_days: 30, approval_days: 30 }])
  const [ana] = db.seed('affiliates', [{ email: 'ana@partner-a.example.com', full_name: 'Ana Partner', status: 'active', user_id: 'u-ana', email_hash: core.hashEmail('ana@partner-a.example.com') }])
  const [mAna] = db.seed('affiliate_memberships', [{ affiliate_id: ana.id, program_id: program.id, status: 'active' }])
  db.seed('affiliate_codes', [
    { program_id: program.id, membership_id: mAna.id, affiliate_id: ana.id, code: 'ANA10', kind: 'link', is_primary: true },
    { program_id: program.id, membership_id: mAna.id, affiliate_id: ana.id, code: 'ANAFREE', kind: 'coupon', stripe_promotion_code_id: 'promo_123' },
  ])
  const convs = () => db.rows('affiliate_conversions')
  const comms = () => db.rows('affiliate_commissions')
  const T0 = Math.floor(Date.parse('2026-09-12T10:00:00Z') / 1000)

  // 1. checkout with the affiliate's promotion code
  const session = { id: 'cs_1', customer: 'cus_1', customer_details: { email: 'buyer@customer-x.example.com' }, amount_total: 29900, currency: 'eur', invoice: 'in_1', subscription: 'sub_1', payment_intent: 'pi_1', created: T0, discounts: [{ promotion_code: 'promo_123' }] }
  let r = await aff.handleStripeEvent(db, 'checkout.session.completed', session, quiet)
  assert.strictEqual(r.ok, true)
  assert.strictEqual(r.duplicate, false)
  assert.strictEqual(r.conversion.idempotency_key, 'stripe_invoice:in_1')
  assert.strictEqual(r.conversion.source, 'coupon')
  assert.strictEqual(r.conversion.membership_id, mAna.id)
  assert.strictEqual(r.conversion.stripe_customer_id, 'cus_1')
  assert.strictEqual(r.commission.amount_cents, 5980)
  assert.strictEqual(r.commission.status, 'pending')
  const att = db.rows('affiliate_attributions')[0]
  assert.strictEqual(att.stripe_customer_id, 'cus_1')
  assert.strictEqual(att.stripe_subscription_id, 'sub_1')
  assert.strictEqual(att.recurring_until, '2027-09-12T10:00:00.000Z')
  ok('checkout.session.completed with the affiliate coupon records a sale, 20% commission, and locks the attribution to the subscription')

  // 2. the invoice.paid for the same first payment collapses into it
  const inv1 = { id: 'in_1', customer: 'cus_1', subscription: 'sub_1', customer_email: 'buyer@customer-x.example.com', amount_paid: 29900, currency: 'eur', billing_reason: 'subscription_create', payment_intent: 'pi_1', charge: 'ch_1', status_transitions: { paid_at: T0 + 5 } }
  r = await aff.handleStripeEvent(db, 'invoice.paid', inv1, quiet)
  assert.strictEqual(r.duplicate, true)
  assert.strictEqual(convs().length, 1)
  assert.strictEqual(comms().length, 1)
  ok('invoice.paid for the same invoice is a duplicate: still one sale, one commission')

  // 3. a renewal inside the window earns recurring commission
  const inv2 = { id: 'in_2', customer: 'cus_1', subscription: 'sub_1', amount_paid: 29900, currency: 'eur', billing_reason: 'subscription_cycle', payment_intent: 'pi_2', charge: 'ch_2', status_transitions: { paid_at: T0 + 30 * 86400 } }
  r = await aff.handleStripeEvent(db, 'invoice.paid', inv2, quiet)
  assert.strictEqual(r.duplicate, false)
  assert.strictEqual(r.conversion.conversion_type, 'recurring')
  assert.strictEqual(r.conversion.parent_conversion_id, convs()[0].id)
  assert.strictEqual(r.conversion.membership_id, mAna.id)
  assert.strictEqual(r.commission.amount_cents, 5980)
  ok('invoice.paid subscription_cycle records a recurring conversion linked to the first sale, with 20% commission')

  // 4. a renewal after the 12-month window records but pays nothing
  const inv3 = { ...inv2, id: 'in_3', payment_intent: 'pi_3', charge: 'ch_3', status_transitions: { paid_at: T0 + 400 * 86400 } }
  r = await aff.handleStripeEvent(db, 'invoice.paid', inv3, quiet)
  assert.strictEqual(r.ok, true)
  assert.strictEqual(r.commission, null)
  assert.strictEqual(convs().find((c) => c.stripe_invoice_id === 'in_3').metadata.no_commission_reason, 'recurring_window_ended')
  assert.strictEqual(comms().length, 2)
  ok('a renewal after month 12 is recorded with no commission and the reason on the row')

  // 5. zero invoices are ignored
  r = await aff.handleStripeEvent(db, 'invoice.paid', { ...inv2, id: 'in_0', amount_paid: 0 }, quiet)
  assert.strictEqual(r, null)
  assert.strictEqual(convs().length, 3)
  ok('a zero-amount invoice records nothing')

  // 6. partial refund flags, full refund reverses
  r = await aff.handleStripeEvent(db, 'charge.refunded', { id: 'ch_2', invoice: 'in_2', payment_intent: 'pi_2', amount: 29900, amount_refunded: 10000 }, quiet)
  assert.deepStrictEqual(r, { partial: true })
  const c2 = convs().find((c) => c.stripe_invoice_id === 'in_2')
  assert.ok(c2.flags.includes('partial_refund'))
  assert.strictEqual(c2.status, 'confirmed')
  assert.strictEqual(comms().find((k) => k.conversion_id === c2.id).status, 'pending')
  ok('a partial refund flags the conversion for a human and leaves the commission alone')
  r = await aff.handleStripeEvent(db, 'charge.refunded', { id: 'ch_1', invoice: 'in_1', payment_intent: 'pi_1', amount: 29900, amount_refunded: 29900 }, quiet)
  assert.strictEqual(r.ok, true)
  const c1 = convs().find((c) => c.stripe_invoice_id === 'in_1')
  assert.strictEqual(c1.status, 'refunded')
  assert.strictEqual(comms().find((k) => k.conversion_id === c1.id).status, 'reversed')
  assert.ok(db.rows('affiliate_audit_log').some((a) => a.action === 'commission.reversed'))
  ok('a full refund reverses the sale and its commission, with an audit entry')
  r = await aff.handleStripeEvent(db, 'charge.refunded', { id: 'ch_zzz', payment_intent: 'pi_zzz', amount: 100, amount_refunded: 100 }, quiet)
  assert.strictEqual(r, null)
  ok('a refund that matches no conversion is ignored')

  // 7. cancellation ends recurring
  r = await aff.handleStripeEvent(db, 'customer.subscription.deleted', { id: 'sub_1' }, quiet)
  assert.ok(r.subscription_ended_at)
  const inv4 = { ...inv2, id: 'in_4', payment_intent: 'pi_4', charge: 'ch_4', status_transitions: { paid_at: T0 + 60 * 86400 } }
  r = await aff.handleStripeEvent(db, 'invoice.paid', inv4, quiet)
  assert.strictEqual(r.commission, null)
  assert.strictEqual(convs().find((c) => c.stripe_invoice_id === 'in_4').metadata.no_commission_reason, 'subscription_ended')
  ok('customer.subscription.deleted stops recurring commission for that attribution')

  // 8. terms-acceptance path (tracking snippet handed the code to accept-terms)
  db.seed('terms_acceptances', [{ reference: 'ref_abc', affiliate_code: 'ANA10', affiliate_program: 'brandgeo', email: 'second@customer-y.example.com' }])
  const session2 = { id: 'cs_2', customer: 'cus_2', customer_details: { email: 'second@customer-y.example.com' }, amount_total: 9900, currency: 'eur', invoice: 'in_5', subscription: 'sub_2', payment_intent: 'pi_5', created: T0, client_reference_id: 'ref_abc' }
  r = await aff.handleStripeEvent(db, 'checkout.session.completed', session2, quiet)
  assert.strictEqual(r.duplicate, false)
  assert.strictEqual(r.conversion.membership_id, mAna.id)
  assert.strictEqual(r.commission.amount_cents, 1980)
  ok('a checkout whose terms acceptance carried the referral is attributed through the link code')

  // 9. stored attribution from the signup lead (provision-account keys on the hashed email)
  db.seed('affiliate_attributions', [{ program_id: program.id, membership_id: mAna.id, external_customer_id: `email:${core.hashEmail('third@customer-z.example.com')}`, source: 'link', first_touch_at: '2026-09-01T00:00:00Z', last_touch_at: '2026-09-01T00:00:00Z', expires_at: '2026-10-01T00:00:00Z' }])
  const session3 = { id: 'cs_3', customer: 'cus_3', customer_details: { email: 'Third@Customer-Z.example.com' }, amount_total: 29900, currency: 'eur', invoice: 'in_6', payment_intent: 'pi_6', created: T0 }
  r = await aff.handleStripeEvent(db, 'checkout.session.completed', session3, quiet)
  assert.strictEqual(r.duplicate, false)
  assert.strictEqual(r.conversion.membership_id, mAna.id)
  assert.strictEqual(r.conversion.source, 'link', 'the stored source is kept; it must not become the admin override "manual"')
  const attZ = db.rows('affiliate_attributions').find((a) => a.external_customer_id === `email:${core.hashEmail('third@customer-z.example.com')}`)
  assert.strictEqual(attZ.source, 'link')
  assert.strictEqual(attZ.stripe_customer_id, 'cus_3')
  ok('a buyer whose signup lead was attributed is matched by hashed email, case-insensitively, and the attribution keeps its source')

  // 10. nobody referred this buyer
  const before = convs().length
  r = await aff.handleStripeEvent(db, 'checkout.session.completed', { id: 'cs_9', customer: 'cus_9', customer_details: { email: 'organic@customer-q.example.com' }, amount_total: 29900, currency: 'eur', invoice: 'in_9', created: T0 }, quiet)
  assert.strictEqual(r, null)
  assert.strictEqual(convs().length, before)
  ok('an organic buyer records nothing')

  // 11. never throws
  const broken = { from() { throw new Error('db down') }, rpc() { throw new Error('db down') } }
  r = await aff.handleStripeEvent(broken, 'invoice.paid', inv2, quiet)
  assert.strictEqual(r, null)
  ok('a failing database never surfaces to the webhook (the provisioning path is protected)')

  section('promotion code readers')
  assert.deepStrictEqual(aff.promoFromSession({ discounts: [{ promotion_code: { id: 'promo_1', code: 'ANAFREE' } }] }), { promotionCodeId: 'promo_1', promotionCode: 'ANAFREE' })
  assert.deepStrictEqual(aff.promoFromSession({}), { promotionCodeId: null, promotionCode: null })
  assert.deepStrictEqual(aff.promoFromInvoice({ discount: { promotion_code: 'promo_2' } }), { promotionCodeId: 'promo_2', promotionCode: null })
  assert.deepStrictEqual(aff.promoFromInvoice({ discounts: [{ promotion_code: { id: 'promo_3', code: 'X' } }] }), { promotionCodeId: 'promo_3', promotionCode: 'X' })
  ok('expanded and unexpanded promotion codes are both read')

  console.log(`\n${passed} checks passed`)
}

main().catch((e) => { console.error(e); process.exit(1) })
