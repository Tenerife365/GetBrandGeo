/**
 * /affiliates (admin only): programs, affiliates and applications, conversions
 * and commissions, payouts, clicks and audit. Backend: affiliate-admin.js.
 * Same shape as Prospects.tsx: local state per tab, one authed POST helper,
 * server copy shown verbatim on 4xx. Nothing here computes money; every
 * amount arrives as a formatted string from the server.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, Loader2, Plus, RefreshCw, Copy, Check, Download, KeyRound, Mail, Ban, RotateCcw, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Undo2, FileText, Upload, ExternalLink, Handshake, Filter,
} from 'lucide-react'
import { isDemoMode, supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import EmptyState from '../components/EmptyState'
import { PageTitle, SectionHeading, StatLabel, StatValue } from '../components/Typography'
import { affiliatePost, downloadCsv, fmtDate, copyText, StatusPill } from '../lib/affiliateApi'
import {
  CONVERSION_TYPES, COMMISSION_STATUSES, PAYOUT_METHODS, PAYOUT_METHOD_LABELS,
  type AdminOverview, type AffiliateProgram, type ProgramInput, type AdminAffiliate, type AdminMembership, type AffiliateApplication,
  type AdminVisit, type AdminConversion, type AdminCommission, type PayoutCandidate, type PayoutBatch, type AuditEntry, type AffiliateResource,
  type CustomRules, type PayoutMethod,
} from '../types/affiliate'

type Tab = 'programs' | 'affiliates' | 'conversions' | 'payouts' | 'activity'
const TABS: { id: Tab; label: string }[] = [
  { id: 'programs', label: 'Programs' },
  { id: 'affiliates', label: 'Affiliates & applications' },
  { id: 'conversions', label: 'Conversions & commissions' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'activity', label: 'Clicks & audit' },
]

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
// Same look, intrinsic width: for the filter bars, where w-full in `ic` would win over a trailing w-auto.
const icAuto = ic.replace('w-full', 'w-auto')
const btn = 'inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-control text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
const btnPrimary = `${btn} bg-brand-500 hover:bg-brand-400 text-white`
const btnGhost = `${btn} bg-dark-700 hover:bg-dark-600 text-slate-200 border border-dark-600`
const btnDanger = `${btn} bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30`
const btnSmall = 'inline-flex items-center gap-1 min-h-[28px] px-2 rounded text-xs font-medium transition-colors disabled:opacity-60'
const card = 'rounded-card border border-dark-700 bg-dark-800'
const th = 'text-left px-3 py-2 text-[11px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap'
const td = 'px-3 py-2 text-sm text-slate-300 align-top'

const api = <T,>(body: Record<string, unknown>) => affiliatePost<T>('affiliate-admin', body)

/* ── Demo fixtures (vite --mode demo only; never reached in production) ──── */
const DEMO_PROGRAMS: AffiliateProgram[] = [
  { id: 'p1', slug: 'brandgeo', name: 'BrandGEO', tagline: 'AI visibility monitoring for brands', description: 'Refer companies that want to know how AI engines describe them.', logo_url: null, brand_color: '#8b5cf6', destination_url: 'https://getbrandgeo.com/', status: 'active', is_public: true, currency: 'EUR', lead_commission_cents: 0, sale_commission_type: 'percent', sale_commission_cents: 0, sale_commission_bps: 2000, recurring_commission_bps: 2000, recurring_months: 12, attribution_days: 30, attribution_mode: 'last_touch', approval_days: 30, min_payout_cents: 5000, payout_schedule: 'Monthly, by the 10th', terms_md: null, terms_url: 'https://getbrandgeo.com/affiliate-terms.html', terms_version: '2026-09-12', has_api_key: true, api_key_prefix: 'bgaff_brandgeo_3f1c', api_key_created_at: '2026-09-12T08:00:00Z', commission_summary: '20% of every sale, plus 20% of each renewal for 12 months', created_at: '2026-09-12T08:00:00Z', archived_at: null },
  { id: 'p2', slug: 'talentwelove', name: 'TalentWeLove Recruiting', tagline: 'Recruitment services for tech teams', description: null, logo_url: null, brand_color: '#0ea5e9', destination_url: 'https://talentwelove.com/', status: 'active', is_public: false, currency: 'EUR', lead_commission_cents: 10000, sale_commission_type: 'fixed', sale_commission_cents: 50000, sale_commission_bps: 0, recurring_commission_bps: 0, recurring_months: 0, attribution_days: 60, attribution_mode: 'first_touch', approval_days: 45, min_payout_cents: 10000, payout_schedule: 'Monthly', terms_md: null, terms_url: null, terms_version: '2026-09-12', has_api_key: false, api_key_prefix: null, api_key_created_at: null, commission_summary: 'EUR 100.00 per qualified lead, EUR 500.00 per sale', created_at: '2026-09-12T08:00:00Z', archived_at: null },
]
const DEMO_AFFILIATES: AdminAffiliate[] = [
  { id: 'a1', email: 'demo.affiliate@example.com', full_name: 'Demo Affiliate', company: 'Demo Studio', website: 'https://example.com', social_url: null, country: 'ES', promo_method: 'Newsletter and LinkedIn', status: 'active', payout_method: 'wise', payout_details: { account_holder: 'Demo Affiliate', email: 'demo.affiliate@example.com' }, terms_accepted_at: '2026-09-01T10:00:00Z', terms_version: '2026-09-12', invited_at: '2026-08-30T10:00:00Z', invite_expires_at: null, suspended_at: null, suspended_reason: null, notes: null, user_id: 'u1', has_login: true, invite_pending: false, created_at: '2026-08-30T10:00:00Z', totals: { EUR: { pending: '59.80', approved: '119.60', payable: '0.00', paid: '59.80' } }, memberships: [
    { id: 'm1', affiliate_id: 'a1', program_id: 'p1', program_slug: 'brandgeo', program_name: 'BrandGEO', status: 'active', custom_rules: null, applied_at: null, approved_at: '2026-09-01T10:00:00Z', rejected_reason: null, clicks_total: 148, clicks_last_at: '2026-09-11T14:22:00Z', primary_code: 'DEMO10', referral_link: 'https://app.getbrandgeo.com/r/brandgeo/DEMO10', codes: [{ id: 'c1', program_id: 'p1', membership_id: 'm1', affiliate_id: 'a1', code: 'DEMO10', kind: 'link', is_primary: true, is_active: true, stripe_promotion_code_id: null, stripe_coupon_id: null, note: null, created_at: '2026-09-01T10:00:00Z' }, { id: 'c2', program_id: 'p1', membership_id: 'm1', affiliate_id: 'a1', code: 'DEMOFREE', kind: 'coupon', is_primary: false, is_active: true, stripe_promotion_code_id: 'promo_demo', stripe_coupon_id: null, note: 'Free month', created_at: '2026-09-01T10:00:00Z' }], commission_summary: '20% of every sale, plus 20% of each renewal for 12 months', created_at: '2026-08-30T10:00:00Z' },
    { id: 'm2', affiliate_id: 'a1', program_id: 'p2', program_slug: 'talentwelove', program_name: 'TalentWeLove Recruiting', status: 'pending', custom_rules: null, applied_at: '2026-09-10T10:00:00Z', approved_at: null, rejected_reason: null, clicks_total: 0, clicks_last_at: null, primary_code: null, referral_link: null, codes: [], commission_summary: 'EUR 100.00 per qualified lead, EUR 500.00 per sale', created_at: '2026-09-10T10:00:00Z' },
  ] },
  { id: 'a2', email: 'partner.two@example.com', full_name: 'Partner Two', company: null, website: 'https://example.org', social_url: null, country: 'RO', promo_method: null, status: 'invited', payout_method: null, payout_details: {}, terms_accepted_at: null, terms_version: null, invited_at: '2026-09-11T09:00:00Z', invite_expires_at: '2026-09-18T09:00:00Z', suspended_at: null, suspended_reason: null, notes: null, user_id: null, has_login: false, invite_pending: true, created_at: '2026-09-11T09:00:00Z', totals: {}, memberships: [
    { id: 'm3', affiliate_id: 'a2', program_id: 'p1', program_slug: 'brandgeo', program_name: 'BrandGEO', status: 'invited', custom_rules: { sale_commission_bps: 2500 }, applied_at: null, approved_at: null, rejected_reason: null, clicks_total: 0, clicks_last_at: null, primary_code: 'PARTNER2', referral_link: 'https://app.getbrandgeo.com/r/brandgeo/PARTNER2', codes: [], commission_summary: '25% of every sale, plus 20% of each renewal for 12 months', created_at: '2026-09-11T09:00:00Z' },
  ] },
]
const DEMO_APPLICATIONS: AffiliateApplication[] = [
  { id: 7, program_id: 'p1', program_slug: 'brandgeo', program_name: 'BrandGEO', affiliate_id: null, membership_id: null, full_name: 'Applicant Example', email: 'applicant@example.net', company: 'Example Agency', website: 'https://example.net', social_url: null, country: 'DE', promo_method: 'Agency clients and a monthly newsletter', payout_method: 'paypal', status: 'pending', review_note: null, reviewed_at: null, created_at: '2026-09-12T07:30:00Z' },
]
const DEMO_CONVERSIONS: AdminConversion[] = [
  { id: 'c1', program_id: 'p1', program_slug: 'brandgeo', membership_id: 'm1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', idempotency_key: 'stripe_invoice:in_demo1', external_id: 'in_demo1', customer_ref: 'a***@example.com', conversion_type: 'sale', amount: '299.00', amount_cents: 29900, currency: 'EUR', status: 'confirmed', source: 'stripe', occurred_at: '2026-09-10T09:12:00Z', is_self_referral: false, flags: [], manual_reason: null, reversal_reason: null, reversed_at: null, commission: { id: 'k1', status: 'pending', amount: '59.80', currency: 'EUR', reconciliation_flag: false }, created_at: '2026-09-10T09:12:00Z' },
  { id: 'c2', program_id: 'p1', program_slug: 'brandgeo', membership_id: 'm1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', idempotency_key: 'lead:client:52', external_id: 'client:52', customer_ref: 'm***@example.com', conversion_type: 'lead', amount: '0.00', amount_cents: 0, currency: 'EUR', status: 'confirmed', source: 'link', occurred_at: '2026-09-09T16:40:00Z', is_self_referral: false, flags: [], manual_reason: null, reversal_reason: null, reversed_at: null, commission: null, created_at: '2026-09-09T16:40:00Z' },
  { id: 'c3', program_id: 'p1', program_slug: 'brandgeo', membership_id: 'm1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', idempotency_key: 'stripe_session:cs_demo3', external_id: 'cs_demo3', customer_ref: 'k***@example.com', conversion_type: 'sale', amount: '299.00', amount_cents: 29900, currency: 'EUR', status: 'refunded', source: 'coupon', occurred_at: '2026-08-20T11:00:00Z', is_self_referral: false, flags: [], manual_reason: null, reversal_reason: 'Stripe charge refunded', reversed_at: '2026-08-25T11:00:00Z', commission: { id: 'k4', status: 'reversed', amount: '59.80', currency: 'EUR', reconciliation_flag: false }, created_at: '2026-08-20T11:00:00Z' },
]
const DEMO_COMMISSIONS: AdminCommission[] = [
  { id: 'k1', conversion_id: 'c1', program_id: 'p1', program_slug: 'brandgeo', membership_id: 'm1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', amount: '59.80', amount_cents: 5980, currency: 'EUR', status: 'pending', approve_after: '2026-10-10T09:12:00Z', approved_at: null, paid_at: null, payout_item_id: null, rejected_reason: null, reversal_reason: null, reconciliation_flag: false, reconciliation_note: null, rule_snapshot: { rule: '20% of sale' }, conversion: { conversion_type: 'sale', status: 'confirmed', customer_ref: 'a***@example.com', amount: '299.00', currency: 'EUR', occurred_at: '2026-09-10T09:12:00Z', source: 'stripe', flags: [], is_self_referral: false }, created_at: '2026-09-10T09:12:00Z' },
  { id: 'k2', conversion_id: 'c4', program_id: 'p1', program_slug: 'brandgeo', membership_id: 'm1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', amount: '119.60', amount_cents: 11960, currency: 'EUR', status: 'approved', approve_after: '2026-09-01T00:00:00Z', approved_at: '2026-09-02T00:00:00Z', paid_at: null, payout_item_id: null, rejected_reason: null, reversal_reason: null, reconciliation_flag: false, reconciliation_note: null, rule_snapshot: { rule: '20% of sale' }, conversion: { conversion_type: 'sale', status: 'confirmed', customer_ref: 'b***@example.com', amount: '598.00', currency: 'EUR', occurred_at: '2026-08-01T00:00:00Z', source: 'link', flags: [], is_self_referral: false }, created_at: '2026-08-01T00:00:00Z' },
]
const DEMO_BATCHES: PayoutBatch[] = [
  { id: 'b1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', currency: 'EUR', status: 'paid', total: '59.80', total_cents: 5980, item_count: 1, payout_method: 'wise', payout_details: { account_holder: 'Demo Affiliate', email: 'demo.affiliate@example.com' }, external_reference: 'WISE-48812', note: null, documents: [], items: [{ id: 'i1', commission_id: 'k3', amount: '59.80', currency: 'EUR' }], created_at: '2026-08-09T00:00:00Z', paid_at: '2026-08-10T00:00:00Z', cancelled_at: null },
]
const DEMO_VISITS: AdminVisit[] = [
  { id: 'v1', program_id: 'p1', program_slug: 'brandgeo', membership_id: 'm1', affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', code_id: 'c1', visit_token: 'Zk3xq9Lp2Ra7Vt1Y', landing_path: '/', referrer_host: 'linkedin.com', utm: { utm_source: 'affiliate', utm_medium: 'referral', utm_campaign: 'brandgeo' }, ua_family: 'chrome', country: null, created_at: '2026-09-11T14:22:00Z' },
]
const DEMO_AUDIT: AuditEntry[] = [
  { id: 1, actor_type: 'admin', actor_id: null, actor_label: 'admin@example.com', action: 'payout.batch_paid', entity_type: 'payout_batch', entity_id: 'b1', program_id: null, affiliate_id: 'a1', before: { status: 'draft' }, after: { status: 'paid', external_reference: 'WISE-48812' }, reason: null, created_at: '2026-08-10T00:00:00Z' },
]

/* ── Small shared pieces ────────────────────────────────────────────────── */
function Notice({ kind, text, onClose }: { kind: 'error' | 'ok'; text: string; onClose?: () => void }) {
  if (!text) return null
  const tone = kind === 'error' ? 'text-red-300 bg-red-500/10 border-red-500/20' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
  return (
    <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 border ${tone}`} role={kind === 'error' ? 'alert' : 'status'}>
      {kind === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
      <span className="flex-1 whitespace-pre-wrap">{text}</span>
      {onClose && <button type="button" onClick={onClose} className="text-xs opacity-70 hover:opacity-100" aria-label="Dismiss">Dismiss</button>}
    </div>
  )
}

function Field({ label, children, hint, className = '' }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs text-slate-400 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  )
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`${card} w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} p-5 my-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-sm" aria-label="Close">Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CopyInline({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" onClick={async () => { if (await copyText(text)) { setOk(true); setTimeout(() => setOk(false), 1200) } }} className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300" aria-label={`Copy ${text}`}>
      {ok ? <Check size={12} /> : <Copy size={12} />} {ok ? 'copied' : 'copy'}
    </button>
  )
}

function useAsync() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const run = useCallback(async <T,>(fn: () => Promise<{ error: string | null; data: T | null }>, successMessage?: string): Promise<T | null> => {
    setBusy(true); setError(''); setOk('')
    try {
      const res = await fn()
      if (res.error) { setError(res.error); return null }
      if (successMessage) setOk(successMessage)
      return res.data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.')
      return null
    } finally {
      setBusy(false)
    }
  }, [])
  return { busy, error, ok, run, setError, setOk }
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AffiliatesAdmin() {
  const { isAdmin } = useClient()
  const [tab, setTab] = useState<Tab>(() => (['programs', 'affiliates', 'conversions', 'payouts', 'activity'].includes(window.location.hash.slice(1)) ? (window.location.hash.slice(1) as Tab) : (window.location.hash === '#applications' ? 'affiliates' : 'programs')))
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [programs, setPrograms] = useState<AffiliateProgram[]>([])
  const [loadErr, setLoadErr] = useState('')

  const loadOverview = useCallback(async () => {
    if (isDemoMode) {
      setPrograms(DEMO_PROGRAMS)
      setOverview({ programs: DEMO_PROGRAMS, counts: { affiliates_active: 1, affiliates_total: 2, applications_pending: 1, clicks_total: 148, reconciliation_flags: 0 }, totals: { EUR: { pending: '59.80', approved: '119.60', payable: '0.00', paid: '59.80', reversed: '59.80', rejected: '0.00' } } })
      return
    }
    const res = await api<AdminOverview>({ action: 'overview' })
    if (res.error || !res.data) { setLoadErr(res.error || 'Could not load the affiliate overview.'); return }
    setLoadErr('')
    setOverview(res.data)
    setPrograms(res.data.programs)
  }, [])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => {
    document.title = 'Affiliates · BrandGEO'
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  // Demo builds (vite --mode demo) never populate isAdmin; let the fixtures
  // render there so the page can be previewed. isDemoMode is false in production.
  if (!isAdmin && !isDemoMode) {
    return <EmptyState icon={Handshake} title="Admins only" body="The affiliate program is managed by BrandGEO staff." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <PageTitle>Affiliates</PageTitle>
          <p className="text-sm text-slate-400 mt-1">Programs, partners, commissions and manual payouts. Public page: <a href="https://getbrandgeo.com/affiliates.html" target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">getbrandgeo.com/affiliates</a>.</p>
        </div>
        <button type="button" className={btnGhost} onClick={loadOverview}><RefreshCw size={14} /> Refresh</button>
      </div>
      <Notice kind="error" text={loadErr} />

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className={`${card} p-3`}><StatLabel>Active affiliates</StatLabel><StatValue>{overview.counts.affiliates_active}<span className="text-sm text-slate-500 font-normal"> / {overview.counts.affiliates_total}</span></StatValue></div>
          <div className={`${card} p-3`}><StatLabel>Applications waiting</StatLabel><StatValue>{overview.counts.applications_pending}</StatValue></div>
          <div className={`${card} p-3`}><StatLabel>Clicks</StatLabel><StatValue>{overview.counts.clicks_total}</StatValue></div>
          <div className={`${card} p-3`}><StatLabel>Owed (approved + payable)</StatLabel><StatValue size="tile">{Object.entries(overview.totals).map(([cur, t]) => `${cur} ${(Number(t.approved || 0) + Number(t.payable || 0)).toFixed(2)}`).join(' · ') || '0.00'}</StatValue></div>
          <div className={`${card} p-3`}><StatLabel>Needs reconciliation</StatLabel><StatValue>{overview.counts.reconciliation_flags}</StatValue></div>
        </div>
      )}

      <div className="flex gap-1 border-b border-dark-700 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); window.history.replaceState(null, '', `#${t.id}`) }}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-brand-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'programs' && <ProgramsTab programs={programs} onChanged={loadOverview} />}
      {tab === 'affiliates' && <AffiliatesTab programs={programs} onChanged={loadOverview} />}
      {tab === 'conversions' && <ConversionsTab programs={programs} onChanged={loadOverview} />}
      {tab === 'payouts' && <PayoutsTab onChanged={loadOverview} />}
      {tab === 'activity' && <ActivityTab programs={programs} />}
    </div>
  )
}

/* ── Programs ───────────────────────────────────────────────────────────── */
const EMPTY_PROGRAM: ProgramInput = {
  slug: '', name: '', tagline: '', description: '', logo_url: '', brand_color: '#8b5cf6', destination_url: 'https://', status: 'draft', is_public: false,
  currency: 'EUR', lead_commission_cents: 0, sale_commission_type: 'percent', sale_commission_cents: 0, sale_commission_bps: 2000, recurring_commission_bps: 0, recurring_months: null,
  attribution_days: 30, attribution_mode: 'last_touch', approval_days: 30, min_payout_cents: 5000, payout_schedule: 'Monthly', terms_md: '', terms_url: '', terms_version: '',
}

function centsToInput(c: number | undefined): string { return c === undefined ? '' : (Number(c) / 100).toFixed(2) }
function inputToCents(v: string): number { const n = Math.round(Number(String(v).replace(',', '.')) * 100); return Number.isFinite(n) && n >= 0 ? n : 0 }

function ProgramForm({ initial, onSave, onCancel, busy, error }: { initial: ProgramInput; onSave: (p: ProgramInput) => void; onCancel: () => void; busy: boolean; error: string }) {
  const [p, setP] = useState<ProgramInput>({ ...EMPTY_PROGRAM, ...initial })
  const set = (k: keyof ProgramInput, v: unknown) => setP((prev) => ({ ...prev, [k]: v }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(p) }} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name"><input className={ic} required value={p.name || ''} onChange={(e) => set('name', e.target.value)} maxLength={120} /></Field>
        <Field label="Slug" hint="Lowercase, used in links: /r/<slug>/<code>"><input className={ic} required pattern="[a-z0-9][a-z0-9-]{1,39}" value={p.slug || ''} onChange={(e) => set('slug', e.target.value.toLowerCase())} maxLength={40} /></Field>
        <Field label="Tagline"><input className={ic} value={p.tagline || ''} onChange={(e) => set('tagline', e.target.value)} maxLength={500} /></Field>
        <Field label="Destination URL" hint="Where a referral link sends the visitor"><input className={ic} required type="url" value={p.destination_url || ''} onChange={(e) => set('destination_url', e.target.value)} maxLength={500} /></Field>
        <Field label="Logo URL"><input className={ic} value={p.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} maxLength={500} /></Field>
        <Field label="Brand colour"><input className={ic} value={p.brand_color || ''} onChange={(e) => set('brand_color', e.target.value)} maxLength={20} placeholder="#8b5cf6" /></Field>
        <Field label="Status">
          <select className={ic} value={p.status} onChange={(e) => set('status', e.target.value)}>
            {['draft', 'active', 'paused', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Visibility">
          <select className={ic} value={p.is_public ? 'public' : 'private'} onChange={(e) => set('is_public', e.target.value === 'public')}>
            <option value="private">Private (invite only, hidden from the public page)</option>
            <option value="public">Public (listed on getbrandgeo.com/affiliates, accepts applications)</option>
          </select>
        </Field>
      </div>
      <Field label="Description"><textarea className={ic} rows={3} value={p.description || ''} onChange={(e) => set('description', e.target.value)} maxLength={20000} /></Field>

      <SectionHeading>Commission rules</SectionHeading>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Currency"><input className={ic} value={p.currency || ''} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={3} pattern="[A-Za-z]{3}" /></Field>
        <Field label="Per qualified lead" hint="Fixed amount, 0 for none"><input className={ic} inputMode="decimal" value={centsToInput(p.lead_commission_cents)} onChange={(e) => set('lead_commission_cents', inputToCents(e.target.value))} /></Field>
        <Field label="Sale commission type">
          <select className={ic} value={p.sale_commission_type} onChange={(e) => set('sale_commission_type', e.target.value)}>
            <option value="none">None</option><option value="fixed">Fixed per sale</option><option value="percent">Percent of sale</option>
          </select>
        </Field>
        {p.sale_commission_type === 'fixed' && <Field label="Fixed per sale"><input className={ic} inputMode="decimal" value={centsToInput(p.sale_commission_cents)} onChange={(e) => set('sale_commission_cents', inputToCents(e.target.value))} /></Field>}
        {p.sale_commission_type === 'percent' && <Field label="Percent of sale" hint="e.g. 20 = 20%"><input className={ic} inputMode="decimal" value={((p.sale_commission_bps || 0) / 100).toString()} onChange={(e) => set('sale_commission_bps', Math.round(Number(e.target.value) * 100) || 0)} /></Field>}
        <Field label="Recurring percent" hint="Of each renewal, 0 for one-time only"><input className={ic} inputMode="decimal" value={((p.recurring_commission_bps || 0) / 100).toString()} onChange={(e) => set('recurring_commission_bps', Math.round(Number(e.target.value) * 100) || 0)} /></Field>
        <Field label="Recurring months" hint="Empty = unlimited, 0 = none"><input className={ic} inputMode="numeric" value={p.recurring_months === null || p.recurring_months === undefined ? '' : String(p.recurring_months)} onChange={(e) => set('recurring_months', e.target.value === '' ? null : Number(e.target.value))} /></Field>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        <Field label="Attribution days"><input className={ic} inputMode="numeric" value={String(p.attribution_days ?? 30)} onChange={(e) => set('attribution_days', Number(e.target.value) || 0)} /></Field>
        <Field label="Attribution mode">
          <select className={ic} value={p.attribution_mode} onChange={(e) => set('attribution_mode', e.target.value)}><option value="last_touch">Last touch</option><option value="first_touch">First touch</option></select>
        </Field>
        <Field label="Approval delay (days)"><input className={ic} inputMode="numeric" value={String(p.approval_days ?? 30)} onChange={(e) => set('approval_days', Number(e.target.value) || 0)} /></Field>
        <Field label="Minimum payout"><input className={ic} inputMode="decimal" value={centsToInput(p.min_payout_cents)} onChange={(e) => set('min_payout_cents', inputToCents(e.target.value))} /></Field>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Payout schedule (text)"><input className={ic} value={p.payout_schedule || ''} onChange={(e) => set('payout_schedule', e.target.value)} maxLength={500} /></Field>
        <Field label="Terms URL"><input className={ic} value={p.terms_url || ''} onChange={(e) => set('terms_url', e.target.value)} maxLength={500} placeholder="https://getbrandgeo.com/affiliate-terms.html" /></Field>
        <Field label="Terms version"><input className={ic} value={p.terms_version || ''} onChange={(e) => set('terms_version', e.target.value)} maxLength={500} /></Field>
      </div>
      <Field label="Program-specific terms (markdown, optional)"><textarea className={ic} rows={4} value={p.terms_md || ''} onChange={(e) => set('terms_md', e.target.value)} maxLength={20000} /></Field>
      <Notice kind="error" text={error} />
      <div className="flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onCancel}>Cancel</button>
        <button type="submit" className={btnPrimary} disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />} Save program</button>
      </div>
    </form>
  )
}

function ProgramsTab({ programs, onChanged }: { programs: AffiliateProgram[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<AffiliateProgram | 'new' | null>(null)
  const [keyShown, setKeyShown] = useState<{ program: string; key: string } | null>(null)
  const [resourcesFor, setResourcesFor] = useState<AffiliateProgram | null>(null)
  const { busy, error, ok, run, setError } = useAsync()

  async function save(input: ProgramInput) {
    if (isDemoMode) { setEditing(null); return }
    const res = editing === 'new'
      ? await run(() => api<{ program: AffiliateProgram }>({ action: 'programs.create', ...input }), 'Program created.')
      : await run(() => api<{ program: AffiliateProgram }>({ action: 'programs.update', id: (editing as AffiliateProgram).id, patch: input }), 'Program saved.')
    if (res) { setEditing(null); onChanged() }
  }
  async function rotateKey(p: AffiliateProgram) {
    if (p.has_api_key && !window.confirm(`Rotate the API key for ${p.name}? The current key stops working immediately.`)) return
    if (isDemoMode) { setKeyShown({ program: p.name, key: 'bgaff_demo_0000000000000000000000000000000000000000000000000' }); return }
    const res = await run(() => api<{ api_key: string }>({ action: 'programs.rotate_key', id: p.id }))
    if (res) { setKeyShown({ program: p.name, key: res.api_key }); onChanged() }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Each program is an independent brand with its own rules, links and API key.</p>
        <button type="button" className={btnPrimary} onClick={() => { setError(''); setEditing('new') }}><Plus size={14} /> New program</button>
      </div>
      <Notice kind="ok" text={ok} />
      {programs.length === 0 ? (
        <EmptyState icon={Handshake} title="No programs yet" body="Create the first program, then invite an affiliate to it." actionLabel="New program" onAction={() => setEditing('new')} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {programs.map((p) => (
            <article key={p.id} className={`${card} p-5 space-y-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold text-white shrink-0" style={{ background: p.brand_color || '#8b5cf6' }}>{p.name.slice(0, 1)}</span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{p.name} <span className="text-xs text-slate-500 font-normal">/{p.slug}</span></h3>
                    <p className="text-xs text-slate-400 truncate">{p.tagline || p.destination_url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0"><StatusPill value={p.status} /><span className={`text-[11px] px-2 py-0.5 rounded-full border ${p.is_public ? 'border-emerald-500/30 text-emerald-300' : 'border-dark-600 text-slate-400'}`}>{p.is_public ? 'public' : 'private'}</span></div>
              </div>
              <p className="text-sm text-slate-300">{p.commission_summary}</p>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><dt className="text-slate-500">Attribution</dt><dd className="text-slate-300">{p.attribution_days}d, {p.attribution_mode.replace('_', ' ')}</dd></div>
                <div><dt className="text-slate-500">Approval</dt><dd className="text-slate-300">{p.approval_days} days</dd></div>
                <div><dt className="text-slate-500">Min payout</dt><dd className="text-slate-300">{p.currency} {(p.min_payout_cents / 100).toFixed(2)}</dd></div>
                <div><dt className="text-slate-500">API key</dt><dd className="text-slate-300">{p.has_api_key ? <code className="text-brand-300">{p.api_key_prefix}…</code> : 'none'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnGhost} onClick={() => { setError(''); setEditing(p) }}>Edit</button>
                <button type="button" className={btnGhost} onClick={() => setResourcesFor(p)}><FileText size={14} /> Resources</button>
                <button type="button" className={btnGhost} onClick={() => rotateKey(p)} disabled={busy}><KeyRound size={14} /> {p.has_api_key ? 'Rotate API key' : 'Create API key'}</button>
                <a className={btnGhost} href={p.destination_url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Destination</a>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New program' : `Edit ${editing.name}`} onClose={() => setEditing(null)} wide>
          <ProgramForm initial={editing === 'new' ? EMPTY_PROGRAM : editing} onSave={save} onCancel={() => setEditing(null)} busy={busy} error={error} />
        </Modal>
      )}
      {keyShown && (
        <Modal title={`API key for ${keyShown.program}`} onClose={() => setKeyShown(null)}>
          <p className="text-sm text-slate-300 mb-3">Copy it now. It is shown once and stored hashed. Use it as <code>Authorization: Bearer …</code> on <code>POST /api/affiliate/conversions</code>.</p>
          <div className="flex gap-2"><input readOnly className={`${ic} font-mono text-xs`} value={keyShown.key} onFocus={(e) => e.currentTarget.select()} /><button type="button" className={btnGhost} onClick={() => copyText(keyShown.key)}><Copy size={14} /> Copy</button></div>
        </Modal>
      )}
      {resourcesFor && <ResourcesModal program={resourcesFor} onClose={() => setResourcesFor(null)} />}
    </div>
  )
}

function ResourcesModal({ program, onClose }: { program: AffiliateProgram; onClose: () => void }) {
  const [list, setList] = useState<AffiliateResource[]>([])
  const [form, setForm] = useState({ title: '', kind: 'link', url: '', body: '' })
  const { busy, error, run } = useAsync()
  const load = useCallback(async () => {
    if (isDemoMode) { setList([{ id: 1, program_id: program.id, title: 'Logo pack and screenshots', kind: 'link', url: 'https://getbrandgeo.com/affiliates.html#assets', body: null, sort_order: 0, is_active: true }]); return }
    const res = await api<{ resources: AffiliateResource[] }>({ action: 'resources.list', program_id: program.id })
    if (res.data) setList(res.data.resources)
  }, [program.id])
  useEffect(() => { load() }, [load])
  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (isDemoMode) return
    const res = await run(() => api<{ resource: AffiliateResource }>({ action: 'resources.create', program_id: program.id, ...form }))
    if (res) { setForm({ title: '', kind: 'link', url: '', body: '' }); load() }
  }
  async function toggle(r: AffiliateResource) {
    if (isDemoMode) return
    await run(() => api({ action: 'resources.update', id: r.id, patch: { is_active: !r.is_active } }))
    load()
  }
  return (
    <Modal title={`Resources for ${program.name}`} onClose={onClose}>
      <p className="text-xs text-slate-400 mb-3">Links, copy and assets shown to active affiliates of this program in their dashboard.</p>
      <ul className="space-y-2 mb-4">
        {list.length === 0 && <li className="text-sm text-slate-500">No resources yet.</li>}
        {list.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0"><span className={r.is_active ? 'text-white' : 'text-slate-500 line-through'}>{r.title}</span>{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-brand-400">{r.url}</a>}{r.body && <p className="text-xs text-slate-400">{r.body}</p>}</div>
            <button type="button" className={btnSmall + ' text-slate-300 bg-dark-700'} onClick={() => toggle(r)}>{r.is_active ? 'Hide' : 'Show'}</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="space-y-2 border-t border-dark-700 pt-3">
        <div className="grid sm:grid-cols-3 gap-2">
          <input className={ic} placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
          <select className={ic} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="link">Link</option><option value="file">File link</option><option value="text">Text</option></select>
          <input className={ic} placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} maxLength={500} />
        </div>
        <textarea className={ic} rows={2} placeholder="Text (optional)" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={5000} />
        <Notice kind="error" text={error} />
        <button type="submit" className={btnPrimary} disabled={busy}><Plus size={14} /> Add resource</button>
      </form>
    </Modal>
  )
}

/* ── Affiliates & applications ──────────────────────────────────────────── */
function AffiliatesTab({ programs, onChanged }: { programs: AffiliateProgram[]; onChanged: () => void }) {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [applications, setApplications] = useState<AffiliateApplication[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const { busy, error, ok, run, setOk } = useAsync()

  const load = useCallback(async () => {
    if (isDemoMode) { setAffiliates(DEMO_AFFILIATES); setApplications(DEMO_APPLICATIONS); setLoading(false); return }
    const [a, b] = await Promise.all([
      api<{ affiliates: AdminAffiliate[] }>({ action: 'affiliates.list', status: statusFilter || undefined, limit: 500 }),
      api<{ applications: AffiliateApplication[] }>({ action: 'applications.list', status: 'pending' }),
    ])
    if (a.data) setAffiliates(a.data.affiliates)
    if (b.data) setApplications(b.data.applications)
    setLoading(false)
  }, [statusFilter])
  useEffect(() => { load() }, [load])

  const refresh = () => { load(); onChanged() }

  async function decideApplication(app: AffiliateApplication, approve: boolean) {
    const note = window.prompt(approve ? 'Optional note for your records:' : 'Reason (sent to the applicant):', '') ?? null
    if (note === null) return
    if (isDemoMode) { setApplications((l) => l.filter((x) => x.id !== app.id)); return }
    const res = await run(() => api<{ ok: boolean; join_url?: string | null }>({ action: approve ? 'applications.approve' : 'applications.reject', id: app.id, note }), approve ? 'Application approved. The affiliate has been emailed.' : 'Application rejected.')
    if (res) refresh()
  }
  async function membershipAction(m: AdminMembership, action: 'approve' | 'reject' | 'suspend') {
    let reason = ''
    if (action !== 'approve') { const r = window.prompt('Reason:', ''); if (r === null) return; reason = r }
    if (isDemoMode) return
    const res = await run(() => api({ action: `memberships.${action}`, id: m.id, reason }), `Membership ${action === 'approve' ? 'approved' : action + 'ed'}.`)
    if (res) refresh()
  }
  async function affiliateAction(a: AdminAffiliate, action: 'suspend' | 'reactivate' | 'resend_invite') {
    let reason = ''
    if (action === 'suspend') { const r = window.prompt('Reason for suspension:', ''); if (r === null) return; reason = r }
    if (isDemoMode) return
    const res = await run(() => api<{ join_url?: string }>({ action: `affiliates.${action}`, id: a.id, reason }), action === 'resend_invite' ? 'Invitation re-sent.' : `Affiliate ${action === 'suspend' ? 'suspended' : 'reactivated'}.`)
    if (res) { if (action === 'resend_invite' && res.join_url) setOk(`Invitation re-sent. Join link: ${res.join_url}`); refresh() }
  }
  async function saveRules(m: AdminMembership, rules: CustomRules | null) {
    if (isDemoMode) return
    const res = await run(() => api({ action: 'memberships.update', id: m.id, patch: { custom_rules: rules } }), 'Custom rate saved.')
    if (res) refresh()
  }
  async function addCode(m: AdminMembership, kind: 'link' | 'coupon') {
    const code = window.prompt(kind === 'coupon' ? 'Coupon code (must also exist in Stripe as a promotion code):' : 'New link code:', '')
    if (!code) return
    const stripeId = kind === 'coupon' ? (window.prompt('Stripe promotion code id (promo_…), optional:', '') || '') : ''
    if (isDemoMode) return
    const res = await run(() => api({ action: 'codes.create', membership_id: m.id, kind, code, stripe_promotion_code_id: stripeId || undefined }), 'Code created.')
    if (res) refresh()
  }
  async function toggleCode(codeId: string, isActive: boolean) {
    if (isDemoMode) return
    const res = await run(() => api({ action: 'codes.update', id: codeId, patch: { is_active: !isActive } }))
    if (res) refresh()
  }
  async function addMembership(a: AdminAffiliate) {
    const remaining = programs.filter((p) => p.status !== 'archived' && !a.memberships.some((m) => m.program_id === p.id))
    if (!remaining.length) { window.alert('This affiliate is already in every program.'); return }
    const slug = window.prompt(`Program slug to add (${remaining.map((p) => p.slug).join(', ')}):`, remaining[0].slug)
    const p = remaining.find((x) => x.slug === slug)
    if (!p) return
    if (isDemoMode) return
    const res = await run(() => api({ action: 'memberships.add', affiliate_id: a.id, program_id: p.id, status: 'active' }), `Added to ${p.name}.`)
    if (res) refresh()
  }
  async function editPayout(a: AdminAffiliate) {
    const method = window.prompt(`Payout method (${PAYOUT_METHODS.join(', ')}):`, a.payout_method || 'wise') as PayoutMethod | null
    if (!method || !PAYOUT_METHODS.includes(method)) return
    const holder = window.prompt('Account holder:', a.payout_details.account_holder || a.full_name) || ''
    const detail = window.prompt(method === 'bank' ? 'IBAN:' : method === 'revolut' ? 'Revtag:' : method === 'other' ? 'Instructions:' : 'Email:', '') || ''
    const key = method === 'bank' ? 'iban' : method === 'revolut' ? 'revtag' : method === 'other' ? 'instructions' : 'email'
    if (isDemoMode) return
    const res = await run(() => api({ action: 'affiliates.update', id: a.id, patch: { payout_method: method, payout_details: { ...a.payout_details, account_holder: holder, [key]: detail } } }), 'Payout details saved.')
    if (res) refresh()
  }
  async function exportCsv(kind: 'affiliates' | 'memberships') {
    if (isDemoMode) return
    const res = await api<string>({ action: 'export', kind })
    if (typeof res.data === 'string') downloadCsv(`affiliate-${kind}.csv`, res.data)
  }

  return (
    <div className="space-y-6">
      {applications.length > 0 && (
        <section id="applications" className="space-y-3">
          <SectionHeading>Applications waiting for review ({applications.length})</SectionHeading>
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className={`${card} p-4 flex flex-col md:flex-row md:items-center gap-3`}>
                <div className="flex-1 min-w-0 text-sm">
                  <div className="text-white font-medium">{app.full_name} <span className="text-slate-500 font-normal">· {app.email}</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">{app.program_name || app.program_slug} · {app.company || 'no company'} · {app.country || 'country n/a'} · {fmtDate(app.created_at)}{app.website && <> · <a href={app.website} target="_blank" rel="noreferrer" className="text-brand-400">{app.website}</a></>}</div>
                  {app.promo_method && <p className="text-xs text-slate-300 mt-1">How they promote: {app.promo_method}</p>}
                  {app.payout_method && <p className="text-xs text-slate-500">Payout: {PAYOUT_METHOD_LABELS[app.payout_method]}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" className={btnPrimary} disabled={busy} onClick={() => decideApplication(app, true)}><CheckCircle2 size={14} /> Approve</button>
                  <button type="button" className={btnDanger} disabled={busy} onClick={() => decideApplication(app, false)}><XCircle size={14} /> Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading>Affiliates</SectionHeading>
          <div className="flex flex-wrap gap-2 items-center">
            <select className={icAuto} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {['invited', 'pending', 'active', 'suspended', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className={btnGhost} onClick={() => exportCsv('affiliates')}><Download size={14} /> Affiliates CSV</button>
            <button type="button" className={btnGhost} onClick={() => exportCsv('memberships')}><Download size={14} /> Memberships CSV</button>
            <button type="button" className={btnPrimary} onClick={() => setInviteOpen(true)}><Mail size={14} /> Invite affiliate</button>
          </div>
        </div>
        <Notice kind="error" text={error} />
        <Notice kind="ok" text={ok} onClose={() => setOk('')} />
        {loading ? <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading</div> : affiliates.length === 0 ? (
          <EmptyState icon={Handshake} title="No affiliates yet" body="Invite your first partner. They get an email with a one-time link to accept the terms." actionLabel="Invite affiliate" onAction={() => setInviteOpen(true)} />
        ) : (
          <div className={`${card} divide-y divide-dark-700`}>
            {affiliates.map((a) => {
              const isOpen = !!open[a.id]
              return (
                <div key={a.id}>
                  <button type="button" onClick={() => setOpen({ ...open, [a.id]: !isOpen })} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-700/40" aria-expanded={isOpen}>
                    {isOpen ? <ChevronDown size={16} className="text-slate-500 shrink-0" /> : <ChevronRight size={16} className="text-slate-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{a.full_name} <span className="text-slate-500 font-normal">· {a.email}</span></div>
                      <div className="text-xs text-slate-400 truncate">{a.memberships.map((m) => `${m.program_name || m.program_slug} (${m.status})`).join(' · ') || 'no programs'}{a.company ? ` · ${a.company}` : ''}</div>
                    </div>
                    <div className="hidden sm:block text-xs text-slate-400 text-right">
                      {Object.entries(a.totals).map(([cur, t]) => <div key={cur}>{cur} owed {(Number(t.approved || 0) + Number(t.payable || 0)).toFixed(2)} · paid {t.paid || '0.00'}</div>)}
                    </div>
                    <StatusPill value={a.status} />
                    {a.invite_pending && <span className="text-[11px] text-brand-300">invite pending</span>}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pl-11 space-y-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-slate-500">{a.website && <a href={a.website} className="text-brand-400 mr-2" target="_blank" rel="noreferrer">{a.website}</a>}{a.country || ''} {a.has_login ? '· has login' : '· no login yet'} · payout {a.payout_method ? PAYOUT_METHOD_LABELS[a.payout_method] : 'not set'}{a.promo_method ? ` · promotes via ${a.promo_method}` : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {a.status === 'suspended'
                          ? <button type="button" className={btnGhost} disabled={busy} onClick={() => affiliateAction(a, 'reactivate')}><RotateCcw size={14} /> Reactivate</button>
                          : <button type="button" className={btnDanger} disabled={busy} onClick={() => affiliateAction(a, 'suspend')}><Ban size={14} /> Suspend</button>}
                        {!a.has_login && <button type="button" className={btnGhost} disabled={busy} onClick={() => affiliateAction(a, 'resend_invite')}><Mail size={14} /> Resend invite</button>}
                        <button type="button" className={btnGhost} disabled={busy} onClick={() => addMembership(a)}><Plus size={14} /> Add to program</button>
                        <button type="button" className={btnGhost} disabled={busy} onClick={() => editPayout(a)}>Edit payout details</button>
                      </div>
                      {Object.keys(a.payout_details || {}).length > 0 && (
                        <div className="text-xs text-slate-400">Payout details: {Object.entries(a.payout_details).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>
                      )}
                      <div className="space-y-3">
                        {a.memberships.map((m) => <MembershipRow key={m.id} m={m} busy={busy} onAction={membershipAction} onRules={saveRules} onAddCode={addCode} onToggleCode={toggleCode} />)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {inviteOpen && <InviteModal programs={programs} onClose={() => setInviteOpen(false)} onDone={(msg) => { setInviteOpen(false); setOk(msg); refresh() }} />}
    </div>
  )
}

function MembershipRow({ m, busy, onAction, onRules, onAddCode, onToggleCode }: {
  m: AdminMembership; busy: boolean
  onAction: (m: AdminMembership, a: 'approve' | 'reject' | 'suspend') => void
  onRules: (m: AdminMembership, rules: CustomRules | null) => void
  onAddCode: (m: AdminMembership, kind: 'link' | 'coupon') => void
  onToggleCode: (id: string, active: boolean) => void
}) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [pct, setPct] = useState(m.custom_rules?.sale_commission_bps !== undefined ? String(m.custom_rules.sale_commission_bps / 100) : '')
  const [rec, setRec] = useState(m.custom_rules?.recurring_commission_bps !== undefined ? String(m.custom_rules.recurring_commission_bps / 100) : '')
  const [lead, setLead] = useState(m.custom_rules?.lead_commission_cents !== undefined ? (m.custom_rules.lead_commission_cents / 100).toFixed(2) : '')
  const [fixed, setFixed] = useState(m.custom_rules?.sale_commission_cents !== undefined ? (m.custom_rules.sale_commission_cents / 100).toFixed(2) : '')
  return (
    <div className="rounded-lg border border-dark-600 bg-dark-700/40 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-white font-medium">{m.program_name || m.program_slug}</span>
        <StatusPill value={m.status} />
        <span className="text-xs text-slate-500">{m.clicks_total} clicks{m.clicks_last_at ? `, last ${fmtDate(m.clicks_last_at)}` : ''}</span>
        <span className="text-xs text-slate-400">· {m.commission_summary}</span>
      </div>
      {m.referral_link && <div className="text-xs text-slate-300 flex items-center gap-2 font-mono"><span className="truncate">{m.referral_link}</span><CopyInline text={m.referral_link} /></div>}
      {m.codes.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {m.codes.map((c) => (
            <span key={c.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${c.is_active ? 'border-dark-600 text-slate-200' : 'border-dark-700 text-slate-500 line-through'}`}>
              {c.kind === 'coupon' ? 'coupon' : 'link'} <code>{c.code}</code>{c.is_primary && <span className="text-brand-300">primary</span>}
              <button type="button" className="text-slate-500 hover:text-white" onClick={() => onToggleCode(c.id, c.is_active)}>{c.is_active ? 'disable' : 'enable'}</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {(m.status === 'pending' || m.status === 'invited' || m.status === 'suspended' || m.status === 'rejected') && <button type="button" className={btnSmall + ' bg-emerald-500/15 text-emerald-300'} disabled={busy} onClick={() => onAction(m, 'approve')}><CheckCircle2 size={12} /> Approve</button>}
        {m.status === 'pending' && <button type="button" className={btnSmall + ' bg-red-500/15 text-red-300'} disabled={busy} onClick={() => onAction(m, 'reject')}><XCircle size={12} /> Reject</button>}
        {m.status === 'active' && <button type="button" className={btnSmall + ' bg-red-500/15 text-red-300'} disabled={busy} onClick={() => onAction(m, 'suspend')}><Ban size={12} /> Suspend</button>}
        <button type="button" className={btnSmall + ' bg-dark-700 text-slate-300'} disabled={busy} onClick={() => onAddCode(m, 'link')}><Plus size={12} /> Link code</button>
        <button type="button" className={btnSmall + ' bg-dark-700 text-slate-300'} disabled={busy} onClick={() => onAddCode(m, 'coupon')}><Plus size={12} /> Coupon code</button>
        <button type="button" className={btnSmall + ' bg-dark-700 text-slate-300'} onClick={() => setRulesOpen(!rulesOpen)}>{m.custom_rules ? 'Custom rate set' : 'Custom rate'}</button>
      </div>
      {rulesOpen && (
        <div className="grid sm:grid-cols-5 gap-2 items-end pt-1">
          <Field label="% of sale"><input className={ic} value={pct} onChange={(e) => setPct(e.target.value)} placeholder="program default" /></Field>
          <Field label="% recurring"><input className={ic} value={rec} onChange={(e) => setRec(e.target.value)} placeholder="default" /></Field>
          <Field label="Fixed per sale"><input className={ic} value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="default" /></Field>
          <Field label="Per lead"><input className={ic} value={lead} onChange={(e) => setLead(e.target.value)} placeholder="default" /></Field>
          <div className="flex gap-2">
            <button type="button" className={btnPrimary} disabled={busy} onClick={() => {
              const rules: CustomRules = {}
              if (pct !== '') { rules.sale_commission_type = 'percent'; rules.sale_commission_bps = Math.round(Number(pct) * 100) }
              if (fixed !== '') { rules.sale_commission_type = 'fixed'; rules.sale_commission_cents = inputToCents(fixed) }
              if (rec !== '') rules.recurring_commission_bps = Math.round(Number(rec) * 100)
              if (lead !== '') rules.lead_commission_cents = inputToCents(lead)
              onRules(m, Object.keys(rules).length ? rules : null)
            }}>Save</button>
            <button type="button" className={btnGhost} disabled={busy} onClick={() => { setPct(''); setRec(''); setFixed(''); setLead(''); onRules(m, null) }}>Reset</button>
          </div>
        </div>
      )}
    </div>
  )
}

function InviteModal({ programs, onClose, onDone }: { programs: AffiliateProgram[]; onClose: () => void; onDone: (msg: string) => void }) {
  const [f, setF] = useState({ full_name: '', email: '', company: '', website: '', country: '', code: '', notes: '' })
  const [slugs, setSlugs] = useState<string[]>(programs.filter((p) => p.status === 'active').slice(0, 1).map((p) => p.slug))
  const { busy, error, run } = useAsync()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemoMode) { onDone('Demo mode: invitation not sent.'); return }
    const res = await run(() => api<{ ok: boolean; join_url: string; email_sent: boolean; email_error: string | null }>({ action: 'affiliates.invite', ...f, program_slugs: slugs }))
    if (res) onDone(res.email_sent ? `Invitation sent to ${f.email}.` : `Invitation created but the email did not send (${res.email_error || 'no email provider'}). Share this link by hand: ${res.join_url}`)
  }
  return (
    <Modal title="Invite an affiliate" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name"><input className={ic} required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={120} /></Field>
          <Field label="Email"><input className={ic} required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Company (optional)"><input className={ic} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} maxLength={160} /></Field>
          <Field label="Website (optional)" hint="Used to flag self-referrals"><input className={ic} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} maxLength={300} /></Field>
          <Field label="Country (optional)"><input className={ic} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} maxLength={80} /></Field>
          <Field label="Preferred code (optional)" hint="3 to 32 letters, digits, - or _"><input className={ic} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} maxLength={32} /></Field>
        </div>
        <Field label="Programs">
          <div className="flex flex-wrap gap-2">
            {programs.filter((p) => p.status !== 'archived').map((p) => (
              <label key={p.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${slugs.includes(p.slug) ? 'border-brand-500 bg-brand-500/10 text-white' : 'border-dark-600 text-slate-300'}`}>
                <input type="checkbox" className="sr-only" checked={slugs.includes(p.slug)} onChange={(e) => setSlugs(e.target.checked ? [...slugs, p.slug] : slugs.filter((s) => s !== p.slug))} />
                {p.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Internal notes (optional)"><textarea className={ic} rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={2000} /></Field>
        <Notice kind="error" text={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={busy || !slugs.length}>{busy && <Loader2 size={14} className="animate-spin" />} Send invitation</button>
        </div>
      </form>
    </Modal>
  )
}

/* ── Conversions & commissions ──────────────────────────────────────────── */
interface Filters { program_id: string; affiliate_id: string; conversion_type: string; status: string; from: string; to: string }
const EMPTY_FILTERS: Filters = { program_id: '', affiliate_id: '', conversion_type: '', status: '', from: '', to: '' }
const clean = (f: Filters) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))

function FilterBar({ f, setF, programs, affiliates, statuses, types }: { f: Filters; setF: (f: Filters) => void; programs: AffiliateProgram[]; affiliates: { id: string; full_name: string }[]; statuses: string[]; types?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Filter size={14} className="text-slate-500" />
      <select className={icAuto} value={f.program_id} onChange={(e) => setF({ ...f, program_id: e.target.value })} aria-label="Program"><option value="">All programs</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select className={icAuto} value={f.affiliate_id} onChange={(e) => setF({ ...f, affiliate_id: e.target.value })} aria-label="Affiliate"><option value="">All affiliates</option>{affiliates.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select>
      {types && <select className={icAuto} value={f.conversion_type} onChange={(e) => setF({ ...f, conversion_type: e.target.value })} aria-label="Type"><option value="">All types</option>{CONVERSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>}
      <select className={icAuto} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <input type="date" className={icAuto} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} aria-label="From" />
      <input type="date" className={icAuto} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label="To" />
      <button type="button" className={btnGhost} onClick={() => setF(EMPTY_FILTERS)}>Clear</button>
    </div>
  )
}

function useAffiliateNames() {
  const [names, setNames] = useState<{ id: string; full_name: string }[]>([])
  useEffect(() => {
    if (isDemoMode) { setNames(DEMO_AFFILIATES.map((a) => ({ id: a.id, full_name: a.full_name }))); return }
    api<{ affiliates: AdminAffiliate[] }>({ action: 'affiliates.list', limit: 500 }).then((r) => { if (r.data) setNames(r.data.affiliates.map((a) => ({ id: a.id, full_name: a.full_name }))) })
  }, [])
  return names
}

function ConversionsTab({ programs, onChanged }: { programs: AffiliateProgram[]; onChanged: () => void }) {
  const names = useAffiliateNames()
  const [cf, setCf] = useState<Filters>(EMPTY_FILTERS)
  const [kf, setKf] = useState<Filters>(EMPTY_FILTERS)
  const [conversions, setConversions] = useState<AdminConversion[]>([])
  const [commissions, setCommissions] = useState<AdminCommission[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [manualOpen, setManualOpen] = useState(false)
  const { busy, error, ok, run, setOk } = useAsync()

  const loadConversions = useCallback(async () => {
    if (isDemoMode) { setConversions(DEMO_CONVERSIONS); return }
    const res = await api<{ conversions: AdminConversion[] }>({ action: 'conversions.list', ...clean(cf), limit: 500 })
    if (res.data) setConversions(res.data.conversions)
  }, [cf])
  const loadCommissions = useCallback(async () => {
    if (isDemoMode) { setCommissions(DEMO_COMMISSIONS); return }
    const res = await api<{ commissions: AdminCommission[] }>({ action: 'commissions.list', ...clean(kf), limit: 500 })
    if (res.data) setCommissions(res.data.commissions)
    setSelected(new Set())
  }, [kf])
  useEffect(() => { loadConversions() }, [loadConversions])
  useEffect(() => { loadCommissions() }, [loadCommissions])
  const reloadAll = () => { loadConversions(); loadCommissions(); onChanged() }

  async function reverse(c: AdminConversion) {
    const status = window.confirm('Mark as REFUNDED? (Cancel = mark as cancelled instead)') ? 'refunded' : 'cancelled'
    const reason = window.prompt('Reason (recorded in the audit log):', '')
    if (!reason) return
    if (isDemoMode) return
    const res = await run(() => api({ action: 'conversions.reverse', id: c.id, status, reason }), 'Conversion reversed; its unpaid commission is reversed too.')
    if (res) reloadAll()
  }
  async function bulk(action: 'approve' | 'reject' | 'reverse' | 'reopen') {
    const ids = Array.from(selected)
    if (!ids.length) return
    let reason = ''
    if (action === 'reject' || action === 'reverse') { const r = window.prompt('Reason:', ''); if (!r) return; reason = r }
    if (isDemoMode) return
    const res = await run(() => api<{ updated: unknown[]; skipped: { id: string; from: string }[] }>({ action: `commissions.${action}`, ids, reason }))
    if (res) { setOk(`${res.updated.length} updated${res.skipped.length ? `, ${res.skipped.length} skipped (not allowed from their current status)` : ''}.`); reloadAll() }
  }
  async function mature() {
    if (isDemoMode) return
    const res = await run(() => api<{ matured: number }>({ action: 'commissions.mature' }))
    if (res) { setOk(`${res.matured} pending commission${res.matured === 1 ? '' : 's'} past the approval period moved to approved.`); reloadAll() }
  }
  async function exportCsv(kind: 'conversions' | 'commissions') {
    if (isDemoMode) return
    const res = await api<string>({ action: 'export', kind, ...clean(kind === 'conversions' ? cf : kf) })
    if (typeof res.data === 'string') downloadCsv(`affiliate-${kind}.csv`, res.data)
  }
  const toggleAll = (on: boolean) => setSelected(on ? new Set(commissions.map((k) => k.id)) : new Set())

  return (
    <div className="space-y-8">
      <Notice kind="error" text={error} />
      <Notice kind="ok" text={ok} onClose={() => setOk('')} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading>Leads and sales</SectionHeading>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={() => exportCsv('conversions')}><Download size={14} /> CSV</button>
            <button type="button" className={btnPrimary} onClick={() => setManualOpen(true)}><Plus size={14} /> Record manually</button>
          </div>
        </div>
        <FilterBar f={cf} setF={setCf} programs={programs} affiliates={names} statuses={['confirmed', 'refunded', 'cancelled']} types />
        {conversions.length === 0 ? <EmptyState icon={Handshake} title="No conversions match" body="Leads arrive from signups and forms, sales from Stripe or the conversion API." /> : (
          <div className={`${card} overflow-x-auto`}>
            <table className="min-w-full">
              <thead><tr><th className={th}>When</th><th className={th}>Program</th><th className={th}>Affiliate</th><th className={th}>Type</th><th className={th}>Customer</th><th className={`${th} text-right`}>Amount</th><th className={th}>Source</th><th className={th}>Flags</th><th className={th}>Status</th><th className={th}>Commission</th><th className={th}></th></tr></thead>
              <tbody className="divide-y divide-dark-700">
                {conversions.map((c) => (
                  <tr key={c.id}>
                    <td className={td + ' whitespace-nowrap'}>{fmtDate(c.occurred_at, true)}</td>
                    <td className={td}>{c.program_slug}</td>
                    <td className={td}>{c.affiliate_name}</td>
                    <td className={td}>{c.conversion_type.replace('_', ' ')}</td>
                    <td className={td + ' text-slate-400'}>{c.customer_ref || ''}<div className="text-[11px] text-slate-500">{c.external_id || c.idempotency_key}</div></td>
                    <td className={td + ' text-right whitespace-nowrap'}>{c.amount_cents ? `${c.currency} ${c.amount}` : ''}</td>
                    <td className={td}>{c.source}</td>
                    <td className={td}>{[...(c.is_self_referral ? ['self referral'] : []), ...(c.flags || [])].map((f) => <span key={f} className="inline-block mr-1 mb-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[11px]">{f.replace(/_/g, ' ')}</span>)}</td>
                    <td className={td}><StatusPill value={c.status} />{c.reversal_reason && <div className="text-[11px] text-slate-500 mt-1">{c.reversal_reason}</div>}</td>
                    <td className={td + ' whitespace-nowrap'}>{c.commission ? <><span>{c.commission.currency} {c.commission.amount}</span> <StatusPill value={c.commission.status} />{c.commission.reconciliation_flag && <span className="ml-1 text-[11px] text-amber-300">reconcile</span>}</> : <span className="text-slate-600">none</span>}</td>
                    <td className={td}>{c.status === 'confirmed' && <button type="button" className={btnSmall + ' bg-red-500/15 text-red-300'} disabled={busy} onClick={() => reverse(c)}><Undo2 size={12} /> Reverse</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading>Commissions</SectionHeading>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnGhost} disabled={busy} onClick={mature}><RefreshCw size={14} /> Mature pending</button>
            <button type="button" className={btnGhost} onClick={() => exportCsv('commissions')}><Download size={14} /> CSV</button>
          </div>
        </div>
        <FilterBar f={kf} setF={setKf} programs={programs} affiliates={names} statuses={COMMISSION_STATUSES} />
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-300">{selected.size} selected:</span>
            <button type="button" className={btnPrimary} disabled={busy} onClick={() => bulk('approve')}><CheckCircle2 size={14} /> Approve</button>
            <button type="button" className={btnDanger} disabled={busy} onClick={() => bulk('reject')}><XCircle size={14} /> Reject</button>
            <button type="button" className={btnDanger} disabled={busy} onClick={() => bulk('reverse')}><Undo2 size={14} /> Reverse</button>
            <button type="button" className={btnGhost} disabled={busy} onClick={() => bulk('reopen')}><RotateCcw size={14} /> Reopen (back to pending)</button>
          </div>
        )}
        {commissions.length === 0 ? <EmptyState icon={Handshake} title="No commissions match" body="A commission is created for every attributed sale and stays pending until the approval period passes." /> : (
          <div className={`${card} overflow-x-auto`}>
            <table className="min-w-full">
              <thead><tr>
                <th className={th}><input type="checkbox" aria-label="Select all" checked={selected.size === commissions.length} onChange={(e) => toggleAll(e.target.checked)} /></th>
                <th className={th}>Created</th><th className={th}>Program</th><th className={th}>Affiliate</th><th className={th}>Conversion</th><th className={th}>Rule</th><th className={`${th} text-right`}>Amount</th><th className={th}>Approves after</th><th className={th}>Status</th><th className={th}>Notes</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-700">
                {commissions.map((k) => (
                  <tr key={k.id} className={k.reconciliation_flag ? 'bg-amber-500/5' : ''}>
                    <td className={td}><input type="checkbox" aria-label={`Select commission ${k.id}`} checked={selected.has(k.id)} onChange={(e) => { const s = new Set(selected); if (e.target.checked) s.add(k.id); else s.delete(k.id); setSelected(s) }} /></td>
                    <td className={td + ' whitespace-nowrap'}>{fmtDate(k.created_at)}</td>
                    <td className={td}>{k.program_slug}</td>
                    <td className={td}>{k.affiliate_name}<div className="text-[11px] text-slate-500">{k.affiliate_email}</div></td>
                    <td className={td}>{k.conversion ? <>{k.conversion.conversion_type.replace('_', ' ')} · {k.conversion.customer_ref || ''} · {k.conversion.currency} {k.conversion.amount}<div className="text-[11px] text-slate-500">{fmtDate(k.conversion.occurred_at)} via {k.conversion.source}{k.conversion.status !== 'confirmed' ? ` · ${k.conversion.status}` : ''}</div></> : ''}</td>
                    <td className={td + ' text-slate-400'}>{k.rule_snapshot?.rule || ''}</td>
                    <td className={td + ' text-right whitespace-nowrap text-white'}>{k.currency} {k.amount}</td>
                    <td className={td + ' whitespace-nowrap text-slate-400'}>{k.status === 'pending' ? fmtDate(k.approve_after) : k.paid_at ? `paid ${fmtDate(k.paid_at)}` : k.approved_at ? `approved ${fmtDate(k.approved_at)}` : ''}</td>
                    <td className={td}><StatusPill value={k.status} />{k.reconciliation_flag && <div className="text-[11px] text-amber-300 mt-1">paid, then refunded: reconcile</div>}</td>
                    <td className={td + ' text-[11px] text-slate-500'}>{k.rejected_reason || k.reversal_reason || k.reconciliation_note || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {manualOpen && <ManualConversionModal programs={programs} onClose={() => setManualOpen(false)} onDone={(msg) => { setManualOpen(false); setOk(msg); reloadAll() }} />}
    </div>
  )
}

function ManualConversionModal({ programs, onClose, onDone }: { programs: AffiliateProgram[]; onClose: () => void; onDone: (m: string) => void }) {
  const [programId, setProgramId] = useState(programs[0]?.id || '')
  const [memberships, setMemberships] = useState<{ id: string; label: string }[]>([])
  const [f, setF] = useState({ membership_id: '', conversion_type: 'sale', amount: '', currency: '', customer_ref: '', customer_email: '', external_id: '', occurred_at: '', reason: '', note: '' })
  const { busy, error, run } = useAsync()
  useEffect(() => {
    if (!programId) return
    if (isDemoMode) { setMemberships(DEMO_AFFILIATES.flatMap((a) => a.memberships.filter((m) => m.program_id === programId).map((m) => ({ id: m.id, label: a.full_name })))); return }
    api<{ affiliates: AdminAffiliate[] }>({ action: 'affiliates.list', limit: 500 }).then((r) => {
      if (!r.data) return
      setMemberships(r.data.affiliates.flatMap((a) => a.memberships.filter((m) => m.program_id === programId).map((m) => ({ id: m.id, label: `${a.full_name} (${m.status})` }))))
    })
  }, [programId])
  const program = programs.find((p) => p.id === programId)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemoMode) { onDone('Demo mode: nothing recorded.'); return }
    const res = await run(() => api<{ ok: boolean; duplicate: boolean }>({
      action: 'conversions.create_manual', program_id: programId, membership_id: f.membership_id, conversion_type: f.conversion_type,
      amount: f.amount || undefined, currency: f.currency || program?.currency, customer_ref: f.customer_ref || undefined, customer_email: f.customer_email || undefined,
      external_id: f.external_id || undefined, occurred_at: f.occurred_at || undefined, reason: f.reason, note: f.note || undefined,
    }))
    if (res) onDone(res.duplicate ? 'That external id was already recorded; nothing changed.' : 'Conversion recorded and its commission computed from the program rules.')
  }
  return (
    <Modal title="Record a conversion manually" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-400">For offline deals, invoices paid outside Stripe, or corrections. The commission is computed from the program (or the affiliate's custom) rules; you cannot type an amount for it.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Program"><select className={ic} value={programId} onChange={(e) => setProgramId(e.target.value)}>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Affiliate"><select className={ic} required value={f.membership_id} onChange={(e) => setF({ ...f, membership_id: e.target.value })}><option value="">Choose</option>{memberships.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></Field>
          <Field label="Type"><select className={ic} value={f.conversion_type} onChange={(e) => setF({ ...f, conversion_type: e.target.value })}>{CONVERSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label={`Amount (${f.currency || program?.currency || ''})`} hint="Sale value, not the commission"><input className={ic} inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="0.00" /></Field>
          <Field label="Currency" hint="Defaults to the program currency"><input className={ic} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value.toUpperCase() })} maxLength={3} /></Field>
          <Field label="Occurred at" hint="Defaults to now"><input className={ic} type="datetime-local" value={f.occurred_at} onChange={(e) => setF({ ...f, occurred_at: e.target.value })} /></Field>
          <Field label="Customer label" hint="What the affiliate sees, e.g. 'Acme (invoice 42)'"><input className={ic} value={f.customer_ref} onChange={(e) => setF({ ...f, customer_ref: e.target.value })} maxLength={120} /></Field>
          <Field label="Customer email (optional)" hint="Hashed for matching and self-referral checks, never shown"><input className={ic} type="email" value={f.customer_email} onChange={(e) => setF({ ...f, customer_email: e.target.value })} /></Field>
          <Field label="External id (optional)" hint="Invoice or order id; prevents duplicates"><input className={ic} value={f.external_id} onChange={(e) => setF({ ...f, external_id: e.target.value })} maxLength={200} /></Field>
        </div>
        <Field label="Reason (required, audited)"><input className={ic} required value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} maxLength={500} /></Field>
        <Field label="Internal note (optional)"><textarea className={ic} rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={1000} /></Field>
        <Notice kind="error" text={error} />
        <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />} Record</button></div>
      </form>
    </Modal>
  )
}

/* ── Payouts ────────────────────────────────────────────────────────────── */
function PayoutsTab({ onChanged }: { onChanged: () => void }) {
  const [candidates, setCandidates] = useState<PayoutCandidate[]>([])
  const [batches, setBatches] = useState<PayoutBatch[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const { busy, error, ok, run, setOk } = useAsync()

  const load = useCallback(async () => {
    if (isDemoMode) { setCandidates([{ affiliate_id: 'a1', affiliate_name: 'Demo Affiliate', affiliate_email: 'demo.affiliate@example.com', currency: 'EUR', total: '119.60', total_cents: 11960, min_payout: '50.00', min_payout_cents: 5000, meets_threshold: true, commission_ids: ['k2'], payout_method: 'wise', has_payout_details: true }]); setBatches(DEMO_BATCHES); return }
    const [c, b] = await Promise.all([
      api<{ candidates: PayoutCandidate[] }>({ action: 'payouts.candidates' }),
      api<{ batches: PayoutBatch[] }>({ action: 'payouts.list', status: statusFilter || undefined, limit: 200 }),
    ])
    if (c.data) setCandidates(c.data.candidates)
    if (b.data) setBatches(b.data.batches)
  }, [statusFilter])
  useEffect(() => { load() }, [load])
  const reload = () => { load(); onChanged() }

  async function createBatch(c: PayoutCandidate) {
    if (!c.meets_threshold && !window.confirm(`${c.affiliate_name} is below the ${c.currency} ${c.min_payout} minimum. Create the payout anyway?`)) return
    if (isDemoMode) return
    const res = await run(() => api<{ batch: PayoutBatch }>({ action: 'payouts.create_batch', affiliate_id: c.affiliate_id, currency: c.currency, commission_ids: c.commission_ids }), 'Payout batch created. Export the CSV, pay it, then mark it paid.')
    if (res) reload()
  }
  async function markPaid(b: PayoutBatch) {
    const reference = window.prompt('Payment reference (Wise/Revolut/bank transfer id):', '')
    if (!reference) return
    const paidAt = window.prompt('Paid on (YYYY-MM-DD, empty = today):', '') || ''
    if (isDemoMode) return
    const res = await run(() => api({ action: 'payouts.mark_paid', id: b.id, external_reference: reference, paid_at: paidAt || undefined }), 'Marked paid. The affiliate has been emailed.')
    if (res) reload()
  }
  async function cancel(b: PayoutBatch) {
    const note = window.prompt('Why cancel this batch? Its commissions go back to approved.', '')
    if (note === null) return
    if (isDemoMode) return
    const res = await run(() => api({ action: 'payouts.cancel', id: b.id, note }), 'Batch cancelled.')
    if (res) reload()
  }
  async function upload(b: PayoutBatch, file: File, kind: 'invoice' | 'proof') {
    if (isDemoMode) return
    const prep = await run(() => api<{ url: string; token: string; path: string }>({ action: 'payouts.upload_url', batch_id: b.id, filename: file.name }))
    if (!prep) return
    const { error: upErr } = await supabase.storage.from('affiliate-documents').uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type || 'application/octet-stream' })
    if (upErr) { window.alert('Upload failed: ' + upErr.message); return }
    const res = await run(() => api({ action: 'payouts.attach_document', batch_id: b.id, path: prep.path, name: file.name, size: file.size, kind }), 'Document attached.')
    if (res) reload()
  }
  async function openDoc(b: PayoutBatch, path: string) {
    if (isDemoMode) return
    const res = await api<{ url: string }>({ action: 'payouts.document_url', batch_id: b.id, path })
    if (res.data?.url) window.open(res.data.url, '_blank', 'noopener')
  }
  async function exportCsv(kind: 'payout_batches' | 'payout_items', batchId?: string) {
    if (isDemoMode) return
    const res = await api<string>({ action: 'export', kind, batch_id: batchId })
    if (typeof res.data === 'string') downloadCsv(`affiliate-${kind}${batchId ? '-' + batchId.slice(0, 8) : ''}.csv`, res.data)
  }

  return (
    <div className="space-y-8">
      <Notice kind="error" text={error} />
      <Notice kind="ok" text={ok} onClose={() => setOk('')} />

      <section className="space-y-3">
        <SectionHeading>Ready to pay (approved commissions, grouped by affiliate and currency)</SectionHeading>
        <p className="text-xs text-slate-500">Workflow: create a batch, export its CSV, pay it from Wise, Revolut or your bank, then mark it paid with the transfer reference. Nothing here moves money.</p>
        {candidates.length === 0 ? <EmptyState icon={Handshake} title="Nothing to pay right now" body="Approved commissions appear here. Pending ones are still inside their approval period." /> : (
          <div className={`${card} overflow-x-auto`}>
            <table className="min-w-full">
              <thead><tr><th className={th}>Affiliate</th><th className={th}>Method</th><th className={`${th} text-right`}>Approved total</th><th className={th}>Minimum</th><th className={th}>Items</th><th className={th}></th></tr></thead>
              <tbody className="divide-y divide-dark-700">
                {candidates.map((c) => (
                  <tr key={`${c.affiliate_id}:${c.currency}`}>
                    <td className={td}>{c.affiliate_name}<div className="text-[11px] text-slate-500">{c.affiliate_email}</div></td>
                    <td className={td}>{c.payout_method ? PAYOUT_METHOD_LABELS[c.payout_method] : <span className="text-amber-300">not set</span>}{c.payout_method && !c.has_payout_details && <span className="text-amber-300 text-[11px]"> (no details)</span>}</td>
                    <td className={td + ' text-right text-white whitespace-nowrap'}>{c.currency} {c.total}</td>
                    <td className={td}>{c.currency} {c.min_payout} {c.meets_threshold ? <span className="text-emerald-300 text-[11px]">met</span> : <span className="text-amber-300 text-[11px]">below</span>}</td>
                    <td className={td}>{c.commission_ids.length}</td>
                    <td className={td}><button type="button" className={btnPrimary} disabled={busy} onClick={() => createBatch(c)}>Create payout</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading>Payout batches</SectionHeading>
          <div className="flex gap-2">
            <select className={icAuto} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Batch status"><option value="">All</option><option value="draft">draft</option><option value="paid">paid</option><option value="cancelled">cancelled</option></select>
            <button type="button" className={btnGhost} onClick={() => exportCsv('payout_batches')}><Download size={14} /> Batches CSV</button>
          </div>
        </div>
        {batches.length === 0 ? <EmptyState icon={FileText} title="No payout batches yet" body="Create one from the list above." /> : (
          <div className="space-y-3">
            {batches.map((b) => (
              <article key={b.id} className={`${card} p-4 space-y-3`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-semibold text-white">{b.currency} {b.total}</span>
                  <StatusPill value={b.status} />
                  <span className="text-sm text-slate-300">{b.affiliate_name} <span className="text-slate-500">· {b.affiliate_email}</span></span>
                  <span className="text-xs text-slate-500">{b.item_count} commission{b.item_count === 1 ? '' : 's'} · created {fmtDate(b.created_at)}{b.paid_at ? ` · paid ${fmtDate(b.paid_at)}` : ''}{b.external_reference ? ` · ref ${b.external_reference}` : ''}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Pay via {b.payout_method ? PAYOUT_METHOD_LABELS[b.payout_method] : 'method not set'}{Object.keys(b.payout_details || {}).length ? ': ' + Object.entries(b.payout_details).map(([k, v]) => `${k} ${v}`).join(' · ') : ''}
                  {b.note && <div className="mt-1">Note: {b.note}</div>}
                </div>
                {b.documents.length > 0 && (
                  <ul className="flex flex-wrap gap-3">
                    {b.documents.map((d) => <li key={d.path}><button type="button" onClick={() => openDoc(b, d.path)} className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"><FileText size={12} /> {d.name} <span className="text-slate-500">({d.kind}, {d.uploaded_by}, {fmtDate(d.uploaded_at)})</span></button></li>)}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnGhost} onClick={() => exportCsv('payout_items', b.id)}><Download size={14} /> Items CSV</button>
                  {b.status === 'draft' && <button type="button" className={btnPrimary} disabled={busy} onClick={() => markPaid(b)}><CheckCircle2 size={14} /> Mark paid</button>}
                  {b.status === 'draft' && <button type="button" className={btnDanger} disabled={busy} onClick={() => cancel(b)}><XCircle size={14} /> Cancel batch</button>}
                  {b.status !== 'cancelled' && (
                    <>
                      <label className={`${btnGhost} cursor-pointer`}><Upload size={14} /> Attach proof<input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(b, f, 'proof'); e.target.value = '' }} /></label>
                      <label className={`${btnGhost} cursor-pointer`}><Upload size={14} /> Attach invoice<input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(b, f, 'invoice'); e.target.value = '' }} /></label>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Clicks & audit ─────────────────────────────────────────────────────── */
function ActivityTab({ programs }: { programs: AffiliateProgram[] }) {
  const names = useAffiliateNames()
  const [f, setF] = useState<Filters>(EMPTY_FILTERS)
  const [visits, setVisits] = useState<AdminVisit[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const { error, ok, run, setOk } = useAsync()
  const load = useCallback(async () => {
    if (isDemoMode) { setVisits(DEMO_VISITS); setAudit(DEMO_AUDIT); return }
    const [v, a] = await Promise.all([
      api<{ visits: AdminVisit[] }>({ action: 'visits.list', ...clean(f), limit: 300 }),
      api<{ entries: AuditEntry[] }>({ action: 'audit.list', program_id: f.program_id || undefined, affiliate_id: f.affiliate_id || undefined, limit: 200 }),
    ])
    if (v.data) setVisits(v.data.visits)
    if (a.data) setAudit(a.data.entries)
  }, [f])
  useEffect(() => { load() }, [load])
  async function exportClicks() {
    if (isDemoMode) return
    const res = await api<string>({ action: 'export', kind: 'clicks', ...clean(f) })
    if (typeof res.data === 'string') downloadCsv('affiliate-clicks.csv', res.data)
  }
  const affiliatesById = useMemo(() => new Map(names.map((n) => [n.id, n.full_name])), [names])

  return (
    <div className="space-y-8">
      <Notice kind="error" text={error} />
      <Notice kind="ok" text={ok} onClose={() => setOk('')} />
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading>Clicks (raw visits, kept 90 days)</SectionHeading>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={() => setManualOpen(true)}><Plus size={14} /> Manual attribution</button>
            <button type="button" className={btnGhost} onClick={exportClicks}><Download size={14} /> CSV</button>
          </div>
        </div>
        <FilterBar f={f} setF={setF} programs={programs} affiliates={names} statuses={[]} />
        {visits.length === 0 ? <EmptyState icon={Handshake} title="No clicks recorded" body="Clicks on referral links appear here. Bots and repeat hits within a minute from the same connection are not counted." /> : (
          <div className={`${card} overflow-x-auto`}>
            <table className="min-w-full">
              <thead><tr><th className={th}>When</th><th className={th}>Program</th><th className={th}>Affiliate</th><th className={th}>Referral id</th><th className={th}>Landing</th><th className={th}>Referrer</th><th className={th}>UTM</th><th className={th}>Browser</th></tr></thead>
              <tbody className="divide-y divide-dark-700">
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td className={td + ' whitespace-nowrap'}>{fmtDate(v.created_at, true)}</td>
                    <td className={td}>{v.program_slug}</td>
                    <td className={td}>{v.affiliate_name || (v.affiliate_id ? affiliatesById.get(v.affiliate_id) : '') || ''}</td>
                    <td className={td + ' font-mono text-xs text-slate-400'}>{v.visit_token}</td>
                    <td className={td}>{v.landing_path}</td>
                    <td className={td}>{v.referrer_host || ''}</td>
                    <td className={td + ' text-xs text-slate-400'}>{v.utm ? Object.entries(v.utm).filter(([k]) => k !== 'utm_source' && k !== 'utm_medium').map(([k, val]) => `${k.replace('utm_', '')}=${val}`).join(' ') : ''}</td>
                    <td className={td}>{v.ua_family || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading>Audit log</SectionHeading>
        {audit.length === 0 ? <EmptyState icon={FileText} title="No audit entries" body="Every admin action, conversion, commission change and payout is recorded here permanently." /> : (
          <div className={`${card} overflow-x-auto`}>
            <table className="min-w-full">
              <thead><tr><th className={th}>When</th><th className={th}>Actor</th><th className={th}>Action</th><th className={th}>Entity</th><th className={th}>Change</th><th className={th}>Reason</th></tr></thead>
              <tbody className="divide-y divide-dark-700">
                {audit.map((e) => (
                  <tr key={e.id}>
                    <td className={td + ' whitespace-nowrap'}>{fmtDate(e.created_at, true)}</td>
                    <td className={td}>{e.actor_type}{e.actor_label ? ` · ${e.actor_label}` : ''}</td>
                    <td className={td + ' font-medium text-white'}>{e.action}</td>
                    <td className={td + ' text-xs text-slate-400'}>{e.entity_type} {e.entity_id ? String(e.entity_id).slice(0, 8) : ''}</td>
                    <td className={td + ' text-xs text-slate-400 max-w-md'}><span className="break-all">{e.before ? `from ${JSON.stringify(e.before)} ` : ''}{e.after ? `to ${JSON.stringify(e.after)}` : ''}</span></td>
                    <td className={td + ' text-xs'}>{e.reason || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {manualOpen && <ManualAttributionModal programs={programs} onClose={() => setManualOpen(false)} onDone={(msg) => { setManualOpen(false); setOk(msg); load() }} run={run} />}
    </div>
  )
}

function ManualAttributionModal({ programs, onClose, onDone, run }: { programs: AffiliateProgram[]; onClose: () => void; onDone: (m: string) => void; run: ReturnType<typeof useAsync>['run'] }) {
  const [programId, setProgramId] = useState(programs[0]?.id || '')
  const [memberships, setMemberships] = useState<{ id: string; label: string }[]>([])
  const [f, setF] = useState({ membership_id: '', external_customer_id: '', customer_ref: '', reason: '' })
  useEffect(() => {
    if (!programId || isDemoMode) return
    api<{ affiliates: AdminAffiliate[] }>({ action: 'affiliates.list', limit: 500 }).then((r) => {
      if (r.data) setMemberships(r.data.affiliates.flatMap((a) => a.memberships.filter((m) => m.program_id === programId).map((m) => ({ id: m.id, label: a.full_name }))))
    })
  }, [programId])
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemoMode) { onDone('Demo mode: nothing recorded.'); return }
    const res = await run(() => api({ action: 'attributions.manual', program_id: programId, ...f }))
    if (res) onDone('Attribution recorded. Future conversions for this customer id credit this affiliate.')
  }
  return (
    <Modal title="Manual attribution" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-slate-400">Link a customer to an affiliate by hand, e.g. after a call where they named who referred them. Uses the customer id your systems send (for BrandGEO signups: <code>email:&lt;sha256 of the lowercase email&gt;</code>, <code>client:&lt;id&gt;</code> or <code>stripe_customer:&lt;cus_…&gt;</code>). Manual attribution overrides links and coupons.</p>
        <Field label="Program"><select className={ic} value={programId} onChange={(e) => setProgramId(e.target.value)}>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Affiliate"><select className={ic} required value={f.membership_id} onChange={(e) => setF({ ...f, membership_id: e.target.value })}><option value="">Choose</option>{memberships.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></Field>
        <Field label="External customer id"><input className={ic} required value={f.external_customer_id} onChange={(e) => setF({ ...f, external_customer_id: e.target.value })} maxLength={200} /></Field>
        <Field label="Customer label (what the affiliate sees)"><input className={ic} value={f.customer_ref} onChange={(e) => setF({ ...f, customer_ref: e.target.value })} maxLength={120} /></Field>
        <Field label="Reason (required, audited)"><input className={ic} required value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} maxLength={500} /></Field>
        <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary}>Save</button></div>
      </form>
    </Modal>
  )
}
