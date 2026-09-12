/**
 * Affiliate module types. Mirrors the JSON shapes returned by
 * netlify/functions/affiliate-admin.js and affiliate-portal.js. Money arrives
 * as decimal strings ("12.50") already formatted server side from integer
 * cents; the client never does money arithmetic.
 */

export type ProgramStatus = 'draft' | 'active' | 'paused' | 'archived'
export type AffiliateStatus = 'invited' | 'pending' | 'active' | 'suspended' | 'rejected'
export type MembershipStatus = AffiliateStatus
export type ConversionType = 'lead' | 'qualified_lead' | 'sale' | 'recurring' | 'custom'
export type ConversionStatus = 'confirmed' | 'refunded' | 'cancelled'
export type CommissionStatus = 'pending' | 'approved' | 'payable' | 'paid' | 'rejected' | 'reversed'
export type PayoutMethod = 'wise' | 'revolut' | 'paypal' | 'bank' | 'other'
export type BatchStatus = 'draft' | 'paid' | 'cancelled'
export type SaleCommissionType = 'none' | 'fixed' | 'percent'
export type AttributionMode = 'last_touch' | 'first_touch'
export type AttributionSource = 'link' | 'coupon' | 'form' | 'api' | 'stripe' | 'manual'

export const CONVERSION_TYPES: ConversionType[] = ['lead', 'qualified_lead', 'sale', 'recurring', 'custom']
export const COMMISSION_STATUSES: CommissionStatus[] = ['pending', 'approved', 'payable', 'paid', 'rejected', 'reversed']
export const PAYOUT_METHODS: PayoutMethod[] = ['wise', 'revolut', 'paypal', 'bank', 'other']
export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  wise: 'Wise', revolut: 'Revolut', paypal: 'PayPal', bank: 'Bank transfer', other: 'Other',
}
export type PayoutDetailFields = Record<PayoutMethod, string[]>

export interface AffiliateProgram {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  brand_color: string | null
  destination_url: string
  status: ProgramStatus
  is_public: boolean
  currency: string
  lead_commission_cents: number
  sale_commission_type: SaleCommissionType
  sale_commission_cents: number
  sale_commission_bps: number
  recurring_commission_bps: number
  recurring_months: number | null
  attribution_days: number
  attribution_mode: AttributionMode
  approval_days: number
  min_payout_cents: number
  payout_schedule: string | null
  terms_md: string | null
  terms_url: string | null
  terms_version: string | null
  has_api_key: boolean
  api_key_prefix: string | null
  api_key_created_at: string | null
  commission_summary: string
  created_at: string
  archived_at: string | null
}

/** Fields an admin can send on programs.create / programs.update (patch). */
export type ProgramInput = Partial<Pick<AffiliateProgram,
  'slug' | 'name' | 'tagline' | 'description' | 'logo_url' | 'brand_color' | 'destination_url' | 'status' | 'is_public' |
  'currency' | 'lead_commission_cents' | 'sale_commission_type' | 'sale_commission_cents' | 'sale_commission_bps' |
  'recurring_commission_bps' | 'recurring_months' | 'attribution_days' | 'attribution_mode' | 'approval_days' |
  'min_payout_cents' | 'payout_schedule' | 'terms_md' | 'terms_url' | 'terms_version'>>

export interface AffiliateCode {
  id: string
  program_id: string
  membership_id: string
  affiliate_id: string
  code: string
  kind: 'link' | 'coupon'
  is_primary: boolean
  is_active: boolean
  stripe_promotion_code_id: string | null
  stripe_coupon_id: string | null
  note: string | null
  created_at: string
}

export interface CustomRules {
  lead_commission_cents?: number
  sale_commission_type?: SaleCommissionType
  sale_commission_cents?: number
  sale_commission_bps?: number
  recurring_commission_bps?: number
  recurring_months?: number | null
}

export interface AdminMembership {
  id: string
  affiliate_id: string
  program_id: string
  program_slug: string | null
  program_name: string | null
  status: MembershipStatus
  custom_rules: CustomRules | null
  applied_at: string | null
  approved_at: string | null
  rejected_reason: string | null
  clicks_total: number
  clicks_last_at: string | null
  primary_code: string | null
  referral_link: string | null
  codes: AffiliateCode[]
  commission_summary: string | null
  created_at: string
}

export type MoneyByStatus = Record<string, string>
export type Totals = Record<string, MoneyByStatus>

export interface AdminAffiliate {
  id: string
  email: string
  full_name: string
  company: string | null
  website: string | null
  social_url: string | null
  country: string | null
  promo_method: string | null
  status: AffiliateStatus
  payout_method: PayoutMethod | null
  payout_details: Record<string, string>
  terms_accepted_at: string | null
  terms_version: string | null
  invited_at: string | null
  invite_expires_at: string | null
  suspended_at: string | null
  suspended_reason: string | null
  notes: string | null
  user_id: string | null
  has_login: boolean
  invite_pending: boolean
  memberships: AdminMembership[]
  totals: Totals
  created_at: string
}

export interface AffiliateApplication {
  id: number
  program_id: string
  program_slug?: string
  program_name?: string
  affiliate_id: string | null
  membership_id: string | null
  full_name: string
  email: string
  company: string | null
  website: string | null
  social_url: string | null
  country: string | null
  promo_method: string | null
  payout_method: PayoutMethod | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  reviewed_at: string | null
  created_at: string
}

export interface AdminVisit {
  id: string
  program_id: string
  program_slug: string | null
  membership_id: string
  affiliate_id: string | null
  affiliate_name: string | null
  code_id: string | null
  visit_token: string
  landing_path: string | null
  referrer_host: string | null
  utm: Record<string, string> | null
  ua_family: string | null
  country: string | null
  created_at: string
}

export interface AdminConversion {
  id: string
  program_id: string
  program_slug: string | null
  membership_id: string
  affiliate_id: string | null
  affiliate_name: string | null
  affiliate_email: string | null
  idempotency_key: string
  external_id: string | null
  customer_ref: string | null
  conversion_type: ConversionType
  amount: string
  amount_cents: number
  currency: string
  status: ConversionStatus
  source: AttributionSource
  occurred_at: string
  is_self_referral: boolean
  flags: string[]
  manual_reason: string | null
  reversal_reason: string | null
  reversed_at: string | null
  commission: { id: string; status: CommissionStatus; amount: string; currency: string; reconciliation_flag: boolean } | null
  created_at: string
}

export interface AdminCommission {
  id: string
  conversion_id: string
  program_id: string
  program_slug: string | null
  membership_id: string
  affiliate_id: string
  affiliate_name: string | null
  affiliate_email: string | null
  amount: string
  amount_cents: number
  currency: string
  status: CommissionStatus
  approve_after: string | null
  approved_at: string | null
  paid_at: string | null
  payout_item_id: string | null
  rejected_reason: string | null
  reversal_reason: string | null
  reconciliation_flag: boolean
  reconciliation_note: string | null
  rule_snapshot: { rule?: string } | null
  conversion: { conversion_type: ConversionType; status: ConversionStatus; customer_ref: string | null; amount: string; currency: string; occurred_at: string; source: AttributionSource; flags: string[]; is_self_referral: boolean } | null
  created_at: string
}

export interface PayoutCandidate {
  affiliate_id: string
  affiliate_name: string
  affiliate_email: string
  currency: string
  total: string
  total_cents: number
  min_payout: string
  min_payout_cents: number
  meets_threshold: boolean
  commission_ids: string[]
  payout_method: PayoutMethod | null
  has_payout_details: boolean
}

export interface PayoutDocument {
  name: string
  path: string
  kind: 'invoice' | 'proof'
  size?: number | null
  uploaded_by: 'admin' | 'affiliate'
  uploaded_at: string
}

export interface PayoutBatch {
  id: string
  affiliate_id: string
  affiliate_name?: string
  affiliate_email?: string
  currency: string
  status: BatchStatus
  total: string
  total_cents: number
  item_count: number
  payout_method: PayoutMethod | null
  payout_details: Record<string, string>
  external_reference: string | null
  note: string | null
  documents: PayoutDocument[]
  items?: { id: string; commission_id: string; amount: string; currency: string }[]
  created_at: string
  paid_at: string | null
  cancelled_at: string | null
}

export interface AuditEntry {
  id: number
  actor_type: string
  actor_id: string | null
  actor_label: string | null
  action: string
  entity_type: string
  entity_id: string | null
  program_id: string | null
  affiliate_id: string | null
  before: unknown
  after: unknown
  reason: string | null
  created_at: string
}

export interface AffiliateResource {
  id: number
  program_id: string
  title: string
  kind: 'link' | 'file' | 'text'
  url: string | null
  body: string | null
  sort_order: number
  is_active: boolean
}

export interface AdminOverview {
  programs: AffiliateProgram[]
  counts: { affiliates_active: number; affiliates_total: number; applications_pending: number; clicks_total: number; reconciliation_flags: number }
  totals: Totals
}

/* ── Affiliate portal (own data) ─────────────────────────────────────────── */

export interface PortalProgram {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  logo_url: string | null
  brand_color: string | null
  destination_url: string
  status: ProgramStatus
  currency: string
  commission_summary: string
  attribution_days: number
  approval_days: number
  min_payout: string
  payout_schedule: string | null
  terms_md: string | null
  terms_url: string
  terms_version: string | null
}

export interface PortalMembership {
  id: string
  status: MembershipStatus
  approved_at: string | null
  clicks_total: number
  clicks_last_at: string | null
  program: PortalProgram
  custom_rules: CustomRules | null
  referral_link: string | null
  referral_code: string | null
  coupon_codes: string[]
  leads: number
  sales: number
  resources: { id: number; title: string; kind: string; url: string | null; body: string | null }[]
}

export interface PortalConversion {
  id: string
  conversion_type: ConversionType
  status: ConversionStatus
  source: AttributionSource
  customer_ref: string
  amount: string
  currency: string
  occurred_at: string
  program_id: string
  membership_id: string
}

export interface PortalCommission {
  id: string
  conversion_id: string
  program_id: string
  status: CommissionStatus
  amount: string
  amount_cents: number
  currency: string
  approve_after: string | null
  approved_at: string | null
  paid_at: string | null
  rule: string | null
  created_at: string
}

export interface PortalBatch {
  id: string
  status: BatchStatus
  currency: string
  total: string
  item_count: number
  payout_method: PayoutMethod | null
  external_reference: string | null
  created_at: string
  paid_at: string | null
  documents: PayoutDocument[]
}

export interface PortalAffiliate {
  id: string
  full_name: string
  email: string
  company: string | null
  website: string | null
  social_url: string | null
  country: string | null
  status: AffiliateStatus
  payout_method: PayoutMethod | null
  payout_details: Record<string, string>
  terms_accepted_at: string | null
  terms_version: string | null
  created_at: string
}

export interface PortalMe {
  affiliate: PortalAffiliate | null
  memberships: PortalMembership[]
  stats: { clicks: number; leads: number; conversions: number; by_currency: Totals } | null
  conversions: PortalConversion[]
  commissions: PortalCommission[]
  payouts: PortalBatch[]
  payout_detail_fields?: PayoutDetailFields
}

export interface JoinPreview {
  affiliate: { full_name: string; email: string; company: string | null; payout_method: PayoutMethod | null; terms_accepted_at: string | null }
  programs: (PortalProgram & { membership_status: MembershipStatus })[]
  terms_version: string
  terms_url: string
}
