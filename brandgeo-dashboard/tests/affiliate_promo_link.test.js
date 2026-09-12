/**
 * affiliate_promo_link.test.js: the referred customer's discount deep link.
 *
 * Ruled 2026-09-12: a customer referred by an affiliate gets 10% off for 12
 * months. The discount is a Stripe coupon with one promotion code per
 * affiliate; this test pins the part that makes it automatic. When the terms
 * acceptance carries a referral, accept-terms.js looks up the affiliate's
 * coupon code that is bound to a Stripe promotion code and appends it to the
 * payment link as `prefilled_promo_code`, next to the `client_reference_id`
 * it already appends.
 *
 * Three layers, each pinned on its own:
 *   1. _terms_gate.withPromoCode: the pure URL builder and its shape rule.
 *   2. _affiliate_service.promoCodeForReferral: which code, if any, is used,
 *      against the in-memory fake (active program, membership and affiliate
 *      only; a coupon without a Stripe binding never prefills).
 *   3. accept-terms.js end to end with the fake: the URL carries both
 *      parameters, the acceptance row still records the referral, and every
 *      failure of the courtesy (no coupon, unknown code, a lookup that throws)
 *      still answers 200 with the plain link. Refusals stay refusals.
 *
 * Run: node tests/affiliate_promo_link.test.js   (from brandgeo-dashboard/)
 */
process.env.STRIPE_CHECKOUT_LINKS = JSON.stringify({
  growth: { monthly: 'growthM', annual: 'https://buy.stripe.com/growthA' },
  radar: { monthly: 'radarM' },
})
delete process.env.RESEND_API_KEY
delete process.env.AFFILIATE_STRIPE_PROGRAM_SLUG

const assert = require('assert')
const env = require('./helpers/affiliate_test_env')
const { createFakeSupabase } = require('./helpers/fake_supabase_mem')
const gate = env.fn('_terms_gate.js')
const service = env.fn('_affiliate_service.js')
const acceptTerms = env.fn('accept-terms.js')

let checks = 0
const ok = (m) => { checks++; console.log('  ok  ' + m) }
const section = (t) => console.log('\n' + t)

async function main() {
  section('1. withPromoCode (pure)')
  const { withPromoCode } = gate
  assert.strictEqual(withPromoCode('https://buy.stripe.com/abc', 'ANAFREE'), 'https://buy.stripe.com/abc?prefilled_promo_code=ANAFREE')
  assert.strictEqual(withPromoCode('https://buy.stripe.com/abc?client_reference_id=r1', 'ANAFREE'), 'https://buy.stripe.com/abc?client_reference_id=r1&prefilled_promo_code=ANAFREE')
  ok('appends prefilled_promo_code with ? on a bare link and & after client_reference_id')
  for (const bad of [null, undefined, '', 'anafree', 'AB', 'ANA FREE', 'ANA&x=1', 'A'.repeat(33), '-ANA', 'ANA/FREE']) {
    assert.strictEqual(withPromoCode('https://buy.stripe.com/abc', bad), 'https://buy.stripe.com/abc', `must ignore ${JSON.stringify(bad)}`)
  }
  ok('nothing, lowercase, too short, too long, spaces, separators and query injection all leave the URL unchanged')

  section('2. promoCodeForReferral (fake database)')
  const db = createFakeSupabase()
  const [program] = db.seed('affiliate_programs', [{ slug: 'brandgeo', name: 'BrandGEO', destination_url: 'https://getbrandgeo.com/', status: 'active', is_public: true, sale_commission_type: 'percent', sale_commission_bps: 1000, recurring_commission_bps: 1000, recurring_months: 12, attribution_days: 30, approval_days: 30 }])
  const [paused] = db.seed('affiliate_programs', [{ slug: 'paused-prog', name: 'Paused', destination_url: 'https://example.com/', status: 'paused', is_public: false }])
  const [ana, bo, cy, dee] = db.seed('affiliates', [
    { email: 'ana@partner-a.example.com', full_name: 'Ana Partner', status: 'active' },
    { email: 'bo@partner-b.example.com', full_name: 'Bo Partner', status: 'active' },
    { email: 'cy@partner-c.example.com', full_name: 'Cy Partner', status: 'active' },
    { email: 'dee@partner-d.example.com', full_name: 'Dee Partner', status: 'suspended' },
  ])
  const [mAna, mBo, mCy, mDee, mAnaPaused] = db.seed('affiliate_memberships', [
    { affiliate_id: ana.id, program_id: program.id, status: 'active' },
    { affiliate_id: bo.id, program_id: program.id, status: 'active' },
    { affiliate_id: cy.id, program_id: program.id, status: 'suspended' },
    { affiliate_id: dee.id, program_id: program.id, status: 'active' },
    { affiliate_id: ana.id, program_id: paused.id, status: 'active' },
  ])
  const codeRow = (m, code, extra = {}) => ({ program_id: program.id, membership_id: m.id, affiliate_id: m.affiliate_id, code, ...extra })
  db.seed('affiliate_codes', [
    codeRow(mAna, 'ANA10', { kind: 'link', is_primary: true }),
    codeRow(mAna, 'ANAOFF', { kind: 'link', is_active: false }),
    codeRow(mAna, 'ANANOPROMO', { kind: 'coupon' }),
    codeRow(mAna, 'ANAOLD', { kind: 'coupon', stripe_promotion_code_id: 'promo_old', is_active: false }),
    codeRow(mAna, 'ANAFREE', { kind: 'coupon', stripe_promotion_code_id: 'promo_123' }),
    codeRow(mBo, 'BO10', { kind: 'link', is_primary: true }),
    codeRow(mBo, 'BOCODE', { kind: 'coupon' }),
    codeRow(mCy, 'CY10', { kind: 'link', is_primary: true }),
    codeRow(mCy, 'CYFREE', { kind: 'coupon', stripe_promotion_code_id: 'promo_cy' }),
    codeRow(mDee, 'DEE10', { kind: 'link', is_primary: true }),
    codeRow(mDee, 'DEEFREE', { kind: 'coupon', stripe_promotion_code_id: 'promo_dee' }),
    { program_id: paused.id, membership_id: mAnaPaused.id, affiliate_id: ana.id, code: 'PP10', kind: 'link', is_primary: true },
    { program_id: paused.id, membership_id: mAnaPaused.id, affiliate_id: ana.id, code: 'PPFREE', kind: 'coupon', stripe_promotion_code_id: 'promo_pp' },
  ])
  const promo = (slug, code) => service.promoCodeForReferral(db, slug, code)

  assert.strictEqual(await promo('brandgeo', 'ANA10'), 'ANAFREE')
  assert.strictEqual(await promo('brandgeo', 'ana10'), 'ANAFREE')
  ok('a link code resolves to the same membership\'s active coupon code that is bound to a Stripe promotion code, case-insensitively')
  assert.strictEqual(await promo('brandgeo', 'ANAFREE'), 'ANAFREE')
  ok('a bound coupon code used as the referral is returned as is')
  assert.strictEqual(await promo('brandgeo', 'ANANOPROMO'), 'ANAFREE')
  ok('a coupon code without a Stripe binding falls through to the bound one on the same membership')
  assert.strictEqual(await promo('brandgeo', 'BO10'), null)
  ok('an affiliate whose only coupon has no Stripe binding prefills nothing')
  assert.strictEqual(await promo('brandgeo', 'NOPE'), null)
  assert.strictEqual(await promo('brandgeo', 'ANAOFF'), null)
  ok('an unknown code and an inactive link code prefill nothing')
  assert.strictEqual(await promo('brandgeo', 'CY10'), null)
  assert.strictEqual(await promo('brandgeo', 'DEE10'), null)
  ok('a suspended membership and a suspended affiliate prefill nothing even though a bound coupon exists')
  assert.strictEqual(await promo('paused-prog', 'PP10'), null)
  assert.strictEqual(await promo('no-such-program', 'ANA10'), null)
  ok('a program that is not active and an unknown program prefill nothing')

  section('3. accept-terms.js end to end (fake database)')
  const call = (body, opts = {}) => acceptTerms.handle(env.post(body, { origin: 'https://getbrandgeo.com', ...opts }), { supabase: opts.supabase || db }).then(env.parse)
  const accepted = (extra = {}) => ({ plan: 'growth', period: 'monthly', accepted: true, accepted_version: gate.TERMS_VERSION, ...extra })
  const acceptances = () => db.rows('terms_acceptances')
  const last = () => acceptances()[acceptances().length - 1]

  let r = await call(accepted({ affiliate_ref: 'ana10', affiliate_visit: 'visit_token_0001', affiliate_program: 'brandgeo' }))
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.ok, true)
  assert.strictEqual(r.body.url, `https://buy.stripe.com/growthM?client_reference_id=${r.body.reference}&prefilled_promo_code=ANAFREE`)
  assert.strictEqual(r.body.promo_code, 'ANAFREE')
  assert.strictEqual(last().reference, r.body.reference)
  assert.strictEqual(last().affiliate_code, 'ANA10')
  assert.strictEqual(last().affiliate_visit_token, 'visit_token_0001')
  assert.strictEqual(last().affiliate_program, 'brandgeo')
  ok('a referred checkout gets client_reference_id AND prefilled_promo_code, and the acceptance row still records the referral')

  r = await call(accepted({ plan: 'growth', period: 'annual', affiliate_ref: 'ANA10' }))
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.url, `https://buy.stripe.com/growthA?client_reference_id=${r.body.reference}&prefilled_promo_code=ANAFREE`)
  assert.strictEqual(last().affiliate_program, null)
  ok('a full-URL annual link gets the same two parameters, and a referral without a program name defaults to brandgeo')

  r = await call(accepted())
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.url, `https://buy.stripe.com/growthM?client_reference_id=${r.body.reference}`)
  assert.strictEqual(r.body.promo_code, null)
  assert.ok(!JSON.stringify(r.body).includes('prefilled'))
  ok('an organic checkout is untouched: client_reference_id only, no promo field value')

  for (const [label, ref] of [['no bound coupon', 'BO10'], ['an unknown code', 'NOPE'], ['a suspended affiliate', 'DEE10']]) {
    r = await call(accepted({ affiliate_ref: ref }))
    assert.strictEqual(r.status, 200, label)
    assert.strictEqual(r.body.url, `https://buy.stripe.com/growthM?client_reference_id=${r.body.reference}`, label)
    assert.strictEqual(r.body.promo_code, null, label)
  }
  assert.strictEqual(last().affiliate_code, 'DEE10')
  ok('no bound coupon, an unknown code and a suspended affiliate all still get the plain link, and the referral is still recorded for attribution')

  const throwing = { from: (t) => (t === 'affiliate_codes' ? { select() { throw new Error('boom') } } : db.from(t)) }
  const before = acceptances().length
  r = await call(accepted({ affiliate_ref: 'ANA10' }), { supabase: throwing })
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.url, `https://buy.stripe.com/growthM?client_reference_id=${r.body.reference}`)
  assert.strictEqual(acceptances().length, before + 1)
  ok('a lookup that throws never blocks the purchase: 200, plain link, acceptance written')

  const n = acceptances().length
  r = await call(accepted({ accepted: false, affiliate_ref: 'ANA10' }))
  assert.strictEqual(r.status, 403)
  assert.ok(!JSON.stringify(r.body).includes('buy.stripe.com') && !JSON.stringify(r.body).includes('prefilled'))
  r = await call(accepted({ affiliate_ref: 'ANA10', honeypot: 'x' }))
  assert.strictEqual(r.status, 200)
  assert.strictEqual(r.body.url, undefined)
  assert.strictEqual(acceptances().length, n)
  ok('a refusal and a honeypot hit carry no URL and no promo code, and write no acceptance, referral or not')

  assert.strictEqual(typeof acceptTerms.handler, 'function')
  ok('the Netlify entry point is still exported as handler')

  console.log(`\n${checks} checks passed`)
}

main().catch((e) => { console.error(e); process.exit(1) })
