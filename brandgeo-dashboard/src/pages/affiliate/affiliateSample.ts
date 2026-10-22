/**
 * The sample partner dashboard behind the public /affiliate/demo page. Made-up
 * partner, accounts and amounts, so a prospective partner can see how the
 * portal works before applying. Nothing here is read from or written to the
 * server.
 *
 * The numbers follow the rule the sample explains: platform subscriptions earn
 * 10% of each payment for 12 months, custom services (setup, audits, content
 * work sold outside the plans) earn 5% once. They also follow the real
 * mechanics: 30 days on hold, approved after that, paid monthly once the
 * approved balance reaches EUR 50 (September carried EUR 29.90 over). Every
 * total below adds up; keep it that way when editing.
 *
 *   Northwind Bakery  Growth EUR 299/month, 4 payments x 29.90 = 119.60
 *   Harbor Clinic     setup EUR 1,200 x 5% = 60.00, Essentials EUR 99 x 10% = 9.90
 *   Lumen Studio      audit EUR 800 x 5% = 40.00
 *   Earned 229.50 = paid 119.80 + available 29.90 + on hold 79.80
 */
import type { PortalMe } from '../../types/affiliate'

export const SAMPLE_RATES = { subscriptions: 10, services: 5, months: 12 }

export const SAMPLE_ME: PortalMe = {
  affiliate: {
    id: 'sample', full_name: 'Sample Partner', email: 'partner@example.com', company: 'Sample Studio', website: 'https://example.com', social_url: null,
    country: 'ES', status: 'active', payout_method: 'bank', payout_details: { account_holder: 'Sample Studio SL', iban: 'ES00 0000 0000 0000 0000 0000', bank_name: 'Sample Bank' },
    terms_accepted_at: '2026-06-20T10:00:00Z', terms_version: '2026-09-12', created_at: '2026-06-20T10:00:00Z',
  },
  memberships: [
    {
      id: 'sm1', status: 'active', approved_at: '2026-06-21T10:00:00Z', clicks_total: 212, clicks_last_at: '2026-10-21T15:40:00Z',
      program: {
        id: 'sp1', slug: 'brandgeo', name: 'BrandGEO', tagline: 'AI visibility monitoring for brands', description: null, logo_url: null, brand_color: '#8b5cf6',
        destination_url: 'https://getbrandgeo.com/', status: 'active', currency: 'EUR', attribution_days: 30, approval_days: 30, min_payout: '50.00',
        payout_schedule: 'Monthly, within 15 days after month end', terms_md: null, terms_url: 'https://getbrandgeo.com/affiliate-terms.html', terms_version: '2026-09-12',
      },
      referral_link: 'https://app.getbrandgeo.com/r/brandgeo/SAMPLE', referral_code: 'SAMPLE', coupon_codes: [], leads: 4, sales: 7,
      resources: [{ id: 1, title: 'Logo pack and screenshots', kind: 'link', url: 'https://getbrandgeo.com/affiliates.html', body: null }],
    },
  ],
  stats: { clicks: 212, leads: 4, conversions: 7, by_currency: { EUR: { pending: '79.80', approved: '29.90', payable: '0.00', paid: '119.80', reversed: '0.00', rejected: '0.00' } } },
  balances: {
    EUR: {
      to_receive: '109.70', available_now: '29.90', in_payout: '0.00', on_hold: '79.80', paid: '119.80', min_payout: '50.00', meets_minimum: false,
      next_available_at: '2026-10-31', next_available_amount: '9.90',
      upcoming: [{ date: '2026-10-31', amount: '9.90' }, { date: '2026-11-09', amount: '40.00' }, { date: '2026-11-14', amount: '29.90' }],
    },
  },
  conversions: [
    { id: 'sc8', conversion_type: 'lead', status: 'confirmed', source: 'link', customer_ref: 'm***@example.com', amount: '0.00', currency: 'EUR', occurred_at: '2026-10-18T11:20:00Z', program_id: 'sp1', membership_id: 'sm1' },
    { id: 'sc7', conversion_type: 'recurring', status: 'confirmed', source: 'link', customer_ref: 'Northwind Bakery', amount: '299.00', currency: 'EUR', occurred_at: '2026-10-15T09:00:00Z', program_id: 'sp1', membership_id: 'sm1' },
    { id: 'sc6', conversion_type: 'custom', status: 'confirmed', source: 'manual', customer_ref: 'Lumen Studio', amount: '800.00', currency: 'EUR', occurred_at: '2026-10-10T10:00:00Z', program_id: 'sp1', membership_id: 'sm1', one_time_fee: true, description: 'AI visibility audit' },
    { id: 'sc5', conversion_type: 'sale', status: 'confirmed', source: 'manual', customer_ref: 'Harbor Clinic', amount: '99.00', currency: 'EUR', occurred_at: '2026-10-01T09:00:00Z', program_id: 'sp1', membership_id: 'sm1' },
    { id: 'sc4', conversion_type: 'recurring', status: 'confirmed', source: 'link', customer_ref: 'Northwind Bakery', amount: '299.00', currency: 'EUR', occurred_at: '2026-09-15T09:00:00Z', program_id: 'sp1', membership_id: 'sm1' },
    { id: 'sc3', conversion_type: 'custom', status: 'confirmed', source: 'manual', customer_ref: 'Harbor Clinic', amount: '1200.00', currency: 'EUR', occurred_at: '2026-09-01T10:00:00Z', program_id: 'sp1', membership_id: 'sm1', one_time_fee: true, description: 'GEO setup and content plan' },
    { id: 'sc2', conversion_type: 'recurring', status: 'confirmed', source: 'link', customer_ref: 'Northwind Bakery', amount: '299.00', currency: 'EUR', occurred_at: '2026-08-15T09:00:00Z', program_id: 'sp1', membership_id: 'sm1' },
    { id: 'sc1', conversion_type: 'sale', status: 'confirmed', source: 'link', customer_ref: 'Northwind Bakery', amount: '299.00', currency: 'EUR', occurred_at: '2026-07-15T09:00:00Z', program_id: 'sp1', membership_id: 'sm1' },
  ],
  commissions: [
    { id: 'sk7', conversion_id: 'sc7', program_id: 'sp1', status: 'pending', amount: '29.90', amount_cents: 2990, currency: 'EUR', approve_after: '2026-11-14T09:00:00Z', approved_at: null, paid_at: null, created_at: '2026-10-15T09:00:00Z', customer_ref: 'Northwind Bakery', kind: 'renewal', description: null },
    { id: 'sk6', conversion_id: 'sc6', program_id: 'sp1', status: 'pending', amount: '40.00', amount_cents: 4000, currency: 'EUR', approve_after: '2026-11-09T10:00:00Z', approved_at: null, paid_at: null, created_at: '2026-10-10T10:00:00Z', customer_ref: 'Lumen Studio', kind: 'one_time_fee', description: 'AI visibility audit' },
    { id: 'sk5', conversion_id: 'sc5', program_id: 'sp1', status: 'pending', amount: '9.90', amount_cents: 990, currency: 'EUR', approve_after: '2026-10-31T09:00:00Z', approved_at: null, paid_at: null, created_at: '2026-10-01T09:00:00Z', customer_ref: 'Harbor Clinic', kind: 'payment', description: null },
    { id: 'sk4', conversion_id: 'sc4', program_id: 'sp1', status: 'approved', amount: '29.90', amount_cents: 2990, currency: 'EUR', approve_after: '2026-10-15T09:00:00Z', approved_at: '2026-10-15T09:00:00Z', paid_at: null, created_at: '2026-09-15T09:00:00Z', customer_ref: 'Northwind Bakery', kind: 'renewal', description: null },
    { id: 'sk3', conversion_id: 'sc3', program_id: 'sp1', status: 'paid', amount: '60.00', amount_cents: 6000, currency: 'EUR', approve_after: '2026-10-01T10:00:00Z', approved_at: '2026-10-01T10:00:00Z', paid_at: '2026-10-10T12:00:00Z', created_at: '2026-09-01T10:00:00Z', customer_ref: 'Harbor Clinic', kind: 'one_time_fee', description: 'GEO setup and content plan' },
    { id: 'sk2', conversion_id: 'sc2', program_id: 'sp1', status: 'paid', amount: '29.90', amount_cents: 2990, currency: 'EUR', approve_after: '2026-09-14T09:00:00Z', approved_at: '2026-09-14T09:00:00Z', paid_at: '2026-10-10T12:00:00Z', created_at: '2026-08-15T09:00:00Z', customer_ref: 'Northwind Bakery', kind: 'renewal', description: null },
    { id: 'sk1', conversion_id: 'sc1', program_id: 'sp1', status: 'paid', amount: '29.90', amount_cents: 2990, currency: 'EUR', approve_after: '2026-08-14T09:00:00Z', approved_at: '2026-08-14T09:00:00Z', paid_at: '2026-10-10T12:00:00Z', created_at: '2026-07-15T09:00:00Z', customer_ref: 'Northwind Bakery', kind: 'payment', description: null },
  ],
  payouts: [
    { id: 'sb1', status: 'paid', currency: 'EUR', total: '119.80', item_count: 3, payout_method: 'bank', external_reference: 'SEPA-SAMPLE-1010', created_at: '2026-10-05T10:00:00Z', paid_at: '2026-10-10T12:00:00Z', documents: [] },
  ],
  referred_accounts: [
    { id: 'sr1', program_id: 'sp1', customer_ref: 'Northwind Bakery', source: 'link', referred_at: '2026-07-02T10:00:00Z', plan: 'growth', status: 'paying', currency: 'EUR', payments_count: 4, last_payment_at: '2026-10-15T09:00:00Z', first_sale_at: '2026-07-15T09:00:00Z', window_ends_at: '2027-07-15T09:00:00Z', payments_left: 8, earned: '119.60', paid: '59.80', estimate: '239.20', estimate_cents: 23920, monthly_basis: '299.00', estimate_basis: 'list_price', basis: '299.00', basis_interval: 'month', fees_count: 0, fees_total: '0.00' },
    { id: 'sr2', program_id: 'sp1', customer_ref: 'Harbor Clinic', source: 'manual', referred_at: '2026-08-20T10:00:00Z', plan: 'essentials', status: 'paying', currency: 'EUR', payments_count: 1, last_payment_at: '2026-10-01T09:00:00Z', first_sale_at: '2026-10-01T09:00:00Z', window_ends_at: '2027-10-01T09:00:00Z', payments_left: 11, earned: '69.90', paid: '60.00', estimate: '108.90', estimate_cents: 10890, monthly_basis: '99.00', estimate_basis: 'set_price', basis: '99.00', basis_interval: 'month', fees_count: 1, fees_total: '1200.00' },
    { id: 'sr3', program_id: 'sp1', customer_ref: 'Lumen Studio', source: 'manual', referred_at: '2026-09-28T10:00:00Z', plan: null, status: 'no_further_payments', currency: 'EUR', payments_count: 0, last_payment_at: null, first_sale_at: null, window_ends_at: null, payments_left: 0, earned: '40.00', paid: '0.00', estimate: null, estimate_cents: null, monthly_basis: null, estimate_basis: null, fees_count: 1, fees_total: '800.00' },
    { id: 'sr4', program_id: 'sp1', customer_ref: 'm***@example.com', source: 'link', referred_at: '2026-10-18T11:20:00Z', plan: 'free', status: 'not_paying_yet', currency: 'EUR', payments_count: 0, last_payment_at: null, first_sale_at: null, window_ends_at: null, payments_left: 12, earned: '0.00', paid: '0.00', estimate: null, estimate_cents: null, monthly_basis: null, estimate_basis: null },
  ],
}
