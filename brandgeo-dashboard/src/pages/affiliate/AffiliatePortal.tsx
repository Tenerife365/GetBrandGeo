/**
 * /affiliate: the affiliate's own dashboard. Sits OUTSIDE the customer Layout
 * and OnboardGate (an affiliate has no user_profiles row) behind AffiliateRoute
 * in App.tsx. Every number here is the affiliate's own, served by
 * affiliate-portal.js `me`; customer identities arrive already masked.
 *
 * Hash sections (#programs, #referred, #conversions, #commissions, #payouts,
 * #settings) are the targets the transactional emails link to.
 *
 * #referred lists every account attributed to the affiliate, paying or not,
 * with what it has earned and an estimate of what is still to come. The
 * estimate is computed server side (core.projectReferredAccount) from the price
 * the admin set for the account (else, for self-serve accounts, the plan's
 * list price, monthly billing, inside the program's recurring window.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle, Loader2, LogOut, Copy, Check, Link2, MousePointerClick, Users, ShoppingCart, Wallet,
  FileText, Upload, ExternalLink, Handshake, RefreshCw, Building2, TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase, isDemoMode } from '../../lib/supabase'
import BrandGeoMark from '../../components/BrandGeoLogo'
import EmptyState from '../../components/EmptyState'
import { PageTitle, SectionHeading, StatLabel, StatValue } from '../../components/Typography'
import { affiliatePost, copyText, fmtDate, StatusPill } from '../../lib/affiliateApi'
import {
  PAYOUT_METHODS, PAYOUT_METHOD_LABELS,
  type PortalMe, type PortalMembership, type PortalBatch, type PayoutMethod, type PayoutDetailFields,
  type PortalProgram, type PortalReferredAccount, type ReferredAccountStatus,
} from '../../types/affiliate'

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
const btn = 'inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-control text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
const btnPrimary = `${btn} bg-brand-500 hover:bg-brand-400 text-white`
const btnGhost = `${btn} bg-dark-700 hover:bg-dark-600 text-slate-200 border border-dark-600`

const DEFAULT_FIELDS: PayoutDetailFields = {
  wise: ['account_holder', 'email', 'iban', 'country', 'note'],
  revolut: ['account_holder', 'revtag', 'email', 'iban', 'note'],
  paypal: ['account_holder', 'email', 'note'],
  bank: ['account_holder', 'iban', 'bic', 'bank_name', 'country', 'note'],
  other: ['account_holder', 'instructions', 'note'],
}
const FIELD_LABELS: Record<string, string> = {
  account_holder: 'Account holder', email: 'Email', iban: 'IBAN', bic: 'BIC / SWIFT', bank_name: 'Bank name', country: 'Country',
  revtag: 'Revtag', instructions: 'Instructions', note: 'Note',
}

const DEMO_ME: PortalMe = {
  affiliate: { id: 'a1', full_name: 'Demo Affiliate', email: 'demo.affiliate@example.com', company: 'Demo Studio', website: 'https://example.com', social_url: null, country: 'ES', status: 'active', payout_method: 'wise', payout_details: { account_holder: 'Demo Affiliate', email: 'demo.affiliate@example.com' }, terms_accepted_at: '2026-09-01T10:00:00Z', terms_version: '2026-09-12', created_at: '2026-09-01T10:00:00Z' },
  memberships: [
    { id: 'm1', status: 'active', approved_at: '2026-09-01T10:00:00Z', clicks_total: 148, clicks_last_at: '2026-09-11T14:22:00Z', program: { id: 'p1', slug: 'brandgeo', name: 'BrandGEO', tagline: 'AI visibility monitoring for brands', description: null, logo_url: null, brand_color: '#8b5cf6', destination_url: 'https://getbrandgeo.com/', status: 'active', currency: 'EUR', commission_summary: '10% of every sale, plus 10% of each renewal for 12 months', attribution_days: 30, approval_days: 30, min_payout: '50.00', payout_schedule: 'Monthly, within 15 days after month end', terms_md: null, terms_url: 'https://getbrandgeo.com/affiliate-terms.html', terms_version: '2026-09-12' }, custom_rules: null, referral_link: 'https://app.getbrandgeo.com/r/brandgeo/DEMO10', referral_code: 'DEMO10', coupon_codes: ['DEMOFREE'], leads: 9, sales: 3, resources: [{ id: 1, title: 'Logo pack and screenshots', kind: 'link', url: 'https://getbrandgeo.com/affiliates.html#assets', body: null }] },
    { id: 'm2', status: 'pending', approved_at: null, clicks_total: 0, clicks_last_at: null, program: { id: 'p2', slug: 'talentwelove', name: 'TalentWeLove Recruiting', tagline: 'Recruitment services for tech teams', description: null, logo_url: null, brand_color: '#0ea5e9', destination_url: 'https://talentwelove.com/', status: 'active', currency: 'EUR', commission_summary: 'EUR 100.00 per qualified lead, EUR 500.00 per sale', attribution_days: 60, approval_days: 45, min_payout: '100.00', payout_schedule: 'Monthly', terms_md: null, terms_url: 'https://getbrandgeo.com/affiliate-terms.html', terms_version: '2026-09-12' }, custom_rules: null, referral_link: null, referral_code: null, coupon_codes: [], leads: 0, sales: 0, resources: [] },
  ],
  stats: { clicks: 148, leads: 9, conversions: 3, by_currency: { EUR: { pending: '29.90', approved: '59.80', payable: '0.00', paid: '29.90', reversed: '0.00', rejected: '0.00' } } },
  conversions: [
    { id: 'c1', conversion_type: 'sale', status: 'confirmed', source: 'link', customer_ref: 'a***@example.com', amount: '299.00', currency: 'EUR', occurred_at: '2026-09-10T09:12:00Z', program_id: 'p1', membership_id: 'm1' },
    { id: 'c2', conversion_type: 'lead', status: 'confirmed', source: 'link', customer_ref: 'm***@example.com', amount: '0.00', currency: 'EUR', occurred_at: '2026-09-09T16:40:00Z', program_id: 'p1', membership_id: 'm1' },
    { id: 'c4', conversion_type: 'custom', status: 'confirmed', source: 'manual', customer_ref: 'Northwind Bakery', amount: '800.00', currency: 'EUR', occurred_at: '2026-10-05T09:00:00Z', program_id: 'p1', membership_id: 'm1', one_time_fee: true, description: 'Website GEO audit and setup' },
    { id: 'c3', conversion_type: 'sale', status: 'refunded', source: 'coupon', customer_ref: 'k***@example.com', amount: '299.00', currency: 'EUR', occurred_at: '2026-08-20T11:00:00Z', program_id: 'p1', membership_id: 'm1' },
  ],
  commissions: [
    { id: 'k1', conversion_id: 'c1', program_id: 'p1', status: 'pending', amount: '29.90', amount_cents: 2990, currency: 'EUR', approve_after: '2026-10-10T09:12:00Z', approved_at: null, paid_at: null, rule: '10% of sale', created_at: '2026-09-10T09:12:00Z' },
    { id: 'k2', conversion_id: 'c4', program_id: 'p1', status: 'approved', amount: '59.80', amount_cents: 5980, currency: 'EUR', approve_after: '2026-09-01T00:00:00Z', approved_at: '2026-09-02T00:00:00Z', paid_at: null, rule: '10% of sale', created_at: '2026-08-01T00:00:00Z' },
    { id: 'k3', conversion_id: 'c5', program_id: 'p1', status: 'paid', amount: '29.90', amount_cents: 2990, currency: 'EUR', approve_after: '2026-08-01T00:00:00Z', approved_at: '2026-08-02T00:00:00Z', paid_at: '2026-08-10T00:00:00Z', rule: '10% of sale', created_at: '2026-07-01T00:00:00Z' },
  ],
  payouts: [{ id: 'b1', status: 'paid', currency: 'EUR', total: '29.90', item_count: 1, payout_method: 'wise', external_reference: 'WISE-48812', created_at: '2026-08-09T00:00:00Z', paid_at: '2026-08-10T00:00:00Z', documents: [] }],
  payout_detail_fields: DEFAULT_FIELDS,
  referred_accounts: [
    { id: 'r1', program_id: 'p1', customer_ref: 'Northwind Bakery', source: 'manual', referred_at: '2026-08-01T10:00:00Z', plan: 'growth', status: 'paying', currency: 'EUR', payments_count: 3, last_payment_at: '2026-10-05T10:00:00Z', first_sale_at: '2026-08-05T10:00:00Z', window_ends_at: '2027-08-05T10:00:00Z', payments_left: 9, earned: '169.70', paid: '29.90', estimate: '225.00', estimate_cents: 22500, monthly_basis: '250.00', estimate_basis: 'set_price', basis: '250.00', basis_interval: 'month', fees_count: 1, fees_total: '800.00' },
    { id: 'r2', program_id: 'p1', customer_ref: 'Blue Harbor Dental', source: 'manual', referred_at: '2026-10-12T10:00:00Z', plan: 'essentials', status: 'not_paying_yet', currency: 'EUR', payments_count: 0, last_payment_at: null, first_sale_at: null, window_ends_at: null, payments_left: 1, earned: '0.00', paid: '0.00', estimate: '120.00', estimate_cents: 12000, monthly_basis: null, estimate_basis: 'set_price', basis: '1200.00', basis_interval: 'once', prepaid_until: '2027-10-12T00:00:00Z', fees_count: 0, fees_total: '0.00' },
    { id: 'r3', program_id: 'p1', customer_ref: 'm***@example.com', source: 'link', referred_at: '2026-09-09T16:40:00Z', plan: 'free', status: 'not_paying_yet', currency: 'EUR', payments_count: 0, last_payment_at: null, first_sale_at: null, window_ends_at: null, payments_left: 12, earned: '0.00', paid: '0.00', estimate: null, estimate_cents: null, monthly_basis: null, estimate_basis: null },
  ],
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', radar: 'Radar', essentials: 'Essentials', growth: 'Growth', growth_pro: 'Growth PRO',
  managed: 'Managed', pro: 'Pro', enterprise: 'Enterprise',
}

const REFERRED_STATUS: Record<ReferredAccountStatus, { label: string; tone: string; note: string }> = {
  paying: { label: 'Paying', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', note: 'Each payment earns you a commission until the window closes.' },
  not_paying_yet: { label: 'Not paying yet', tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30', note: 'Nothing earned until the first payment arrives.' },
  one_time: { label: 'Paid once', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', note: 'This program pays a single commission per account.' },
  window_ended: { label: 'Window closed', tone: 'bg-slate-500/15 text-slate-300 border-slate-500/30', note: 'Renewals after the commission window earn nothing.' },
  cancelled: { label: 'Cancelled', tone: 'bg-slate-500/15 text-slate-300 border-slate-500/30', note: 'The subscription has ended.' },
  complimentary: { label: 'Complimentary', tone: 'bg-slate-500/15 text-slate-300 border-slate-500/30', note: 'We give this account its plan at no charge. It earns once it starts paying.' },
  prepaid: { label: 'Prepaid', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', note: 'Paid a package up front. No further payment is expected for that period.' },
  no_further_payments: { label: 'No further payments', tone: 'bg-slate-500/15 text-slate-300 border-slate-500/30', note: 'No more payments are expected from this account under its current agreement.' },
  not_eligible: { label: 'Not eligible', tone: 'bg-red-500/15 text-red-300 border-red-500/30', note: 'Purchases by the affiliate themselves earn no commission.' },
}

function planLabel(plan: string | null) {
  if (!plan) return ''
  return PLAN_LABELS[plan] || plan.replace('_', ' ')
}

function sumByCurrency(rows: PortalReferredAccount[], pick: (r: PortalReferredAccount) => string | null) {
  const totals = new Map<string, number>()
  for (const r of rows) {
    const v = pick(r)
    if (v === null) continue
    totals.set(r.currency, (totals.get(r.currency) || 0) + Math.round(Number(v) * 100))
  }
  return [...totals.entries()].map(([cur, cents]) => `${cur} ${(cents / 100).toFixed(2)}`).join(' · ')
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" className={btnGhost} onClick={async () => { if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 1500) } }} aria-label={`${label} ${text}`}>
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} {copied ? 'Copied' : label}
    </button>
  )
}

export default function AffiliatePortal() {
  const navigate = useNavigate()
  const [me, setMe] = useState<PortalMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setError('')
    if (isDemoMode) { setMe(DEMO_ME); setLoading(false); return }
    const res = await affiliatePost<PortalMe>('affiliate-portal', { action: 'me' })
    if (res.status === 401) { navigate('/affiliate/login', { replace: true }); return }
    if (res.error || !res.data) setError(res.error || 'Could not load your dashboard.')
    else setMe(res.data)
    setLoading(false)
  }, [navigate])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    document.title = 'Affiliate dashboard · BrandGEO'
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])
  useEffect(() => {
    if (!loading && window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading])

  async function signOut() {
    if (!isDemoMode) await supabase.auth.signOut()
    navigate('/affiliate/login', { replace: true })
  }

  const programsById = useMemo(() => new Map((me?.memberships || []).map((m) => [m.program.id, m.program])), [me])

  if (loading) {
    return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin" size={22} /></div>
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200">
      <header className="border-b border-dark-700 bg-dark-800/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandGeoMark href="/affiliate" ariaLabel="Affiliate dashboard" />
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-brand-300"><Handshake size={12} /> Affiliate</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={btnGhost} onClick={load} aria-label="Refresh"><RefreshCw size={14} /><span className="hidden sm:inline">Refresh</span></button>
            <button type="button" className={btnGhost} onClick={signOut}><LogOut size={14} /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{notice}</div>
        )}

        {!me || !me.affiliate ? (
          <EmptyState
            icon={Handshake}
            title="No affiliate account on this login"
            body="This email is signed in but is not linked to an affiliate account. Apply on getbrandgeo.com/affiliates, or sign in with the email your invitation went to."
            actionLabel="Affiliate sign in"
            actionTo="/affiliate/login"
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <PageTitle>Hello, {me.affiliate.full_name.split(' ')[0]}</PageTitle>
                <p className="text-sm text-slate-400 mt-1">Your referral activity, commissions and payouts, all in one place.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Account</span> <StatusPill value={me.affiliate.status} />
              </div>
            </div>

            {/* Stats */}
            <section aria-label="Overview" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon={MousePointerClick} label="Clicks" value={String(me.stats?.clicks ?? 0)} />
              <Stat icon={Users} label="Leads" value={String(me.stats?.leads ?? 0)} />
              <Stat icon={ShoppingCart} label="Sales" value={String(me.stats?.conversions ?? 0)} />
              <Stat icon={Wallet} label="Paid out" value={Object.entries(me.stats?.by_currency || {}).map(([cur, t]) => `${cur} ${t.paid || '0.00'}`).join(' · ') || '0.00'} />
            </section>
            {me.stats && Object.keys(me.stats.by_currency).length > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 -mt-6">
                {Object.entries(me.stats.by_currency).map(([cur, t]) => (
                  <span key={cur}>{cur}: pending {t.pending || '0.00'} · approved {t.approved || '0.00'} · in a payout {t.payable || '0.00'}</span>
                ))}
              </div>
            )}

            {/* Programs */}
            <section id="programs" className="space-y-4 scroll-mt-20">
              <SectionHeading>Your programs</SectionHeading>
              {me.memberships.length === 0 ? (
                <EmptyState icon={Link2} title="No programs yet" body="Once you are approved for a program, your referral link appears here." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {me.memberships.map((m) => <ProgramCard key={m.id} m={m} />)}
                </div>
              )}
            </section>

            {/* Referred accounts */}
            <ReferredAccounts rows={me.referred_accounts || []} programsById={programsById} />

            {/* How payouts work */}
            <HowYouGetPaid program={me.memberships.find((m) => m.status === 'active')?.program || me.memberships[0]?.program || null} />

            {/* Conversions */}
            <section id="conversions" className="space-y-3 scroll-mt-20">
              <SectionHeading>Referred leads and sales</SectionHeading>
              {me.conversions.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Nothing referred yet" body="Share your link. Leads and sales attributed to you show up here within minutes." />
              ) : (
                <div className="overflow-x-auto rounded-card border border-dark-700 bg-dark-800">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs text-slate-400 uppercase tracking-wider">
                      <tr><th className="text-left px-4 py-2">Date</th><th className="text-left px-4 py-2">Program</th><th className="text-left px-4 py-2">Type</th><th className="text-left px-4 py-2">Customer</th><th className="text-right px-4 py-2">Amount</th><th className="text-left px-4 py-2">Source</th><th className="text-left px-4 py-2">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {me.conversions.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-300">{fmtDate(c.occurred_at)}</td>
                          <td className="px-4 py-2 text-slate-300">{programsById.get(c.program_id)?.name || ''}</td>
                          <td className="px-4 py-2 text-slate-300">{c.one_time_fee ? <>one-time fee{c.description && <div className="text-xs text-slate-500 max-w-[16rem]">{c.description}</div>}</> : c.conversion_type.replace('_', ' ')}</td>
                          <td className="px-4 py-2 text-slate-400">{c.customer_ref}</td>
                          <td className="px-4 py-2 text-right text-slate-200 whitespace-nowrap">{Number(c.amount) > 0 ? `${c.currency} ${c.amount}` : ''}</td>
                          <td className="px-4 py-2 text-slate-400">{c.source}</td>
                          <td className="px-4 py-2"><StatusPill value={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Commissions */}
            <section id="commissions" className="space-y-3 scroll-mt-20">
              <SectionHeading>Commissions</SectionHeading>
              <p className="text-xs text-slate-500">Pending commissions become approved after the program's approval period, unless the sale is refunded. Approved commissions are grouped into a payout once they pass the minimum.</p>
              {me.commissions.length === 0 ? (
                <EmptyState icon={Wallet} title="No commissions yet" body="Your first sale creates your first commission." />
              ) : (
                <div className="overflow-x-auto rounded-card border border-dark-700 bg-dark-800">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs text-slate-400 uppercase tracking-wider">
                      <tr><th className="text-left px-4 py-2">Created</th><th className="text-left px-4 py-2">Program</th><th className="text-left px-4 py-2">Rule</th><th className="text-right px-4 py-2">Amount</th><th className="text-left px-4 py-2">Approves after</th><th className="text-left px-4 py-2">Paid</th><th className="text-left px-4 py-2">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {me.commissions.map((k) => (
                        <tr key={k.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-300">{fmtDate(k.created_at)}</td>
                          <td className="px-4 py-2 text-slate-300">{programsById.get(k.program_id)?.name || ''}</td>
                          <td className="px-4 py-2 text-slate-400">{k.rule || ''}</td>
                          <td className="px-4 py-2 text-right text-slate-200 whitespace-nowrap">{k.currency} {k.amount}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-400">{k.status === 'pending' ? fmtDate(k.approve_after) : ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-400">{fmtDate(k.paid_at)}</td>
                          <td className="px-4 py-2"><StatusPill value={k.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Payouts */}
            <section id="payouts" className="space-y-3 scroll-mt-20">
              <SectionHeading>Payouts</SectionHeading>
              {me.payouts.length === 0 ? (
                <EmptyState icon={FileText} title="No payouts yet" body="A payout is created once your approved commissions reach the program minimum. You can attach your invoice to each payout here." />
              ) : (
                <div className="space-y-3">
                  {me.payouts.map((b) => <PayoutCard key={b.id} b={b} onChanged={load} onNotice={setNotice} />)}
                </div>
              )}
            </section>

            {/* Settings */}
            <section id="settings" className="space-y-4 scroll-mt-20">
              <SectionHeading>Profile and payout details</SectionHeading>
              <SettingsForm me={me} onSaved={(msg) => { setNotice(msg); load() }} />
              <p className="text-xs text-slate-500">
                Terms accepted {fmtDate(me.affiliate.terms_accepted_at)} (version {me.affiliate.terms_version || 'n/a'}). Read the current <a href="https://getbrandgeo.com/affiliate-terms.html" target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">affiliate terms</a>. Questions: <a href="mailto:support@getbrandgeo.com" className="text-brand-400 hover:text-brand-300">support@getbrandgeo.com</a>.
              </p>
            </section>
          </>
        )}
        <p className="text-xs text-slate-600 text-center pt-6"><Link to="/login" className="hover:text-slate-400">Customer dashboard</Link></p>
      </main>
    </div>
  )
}

/** Display strings for one referred account, shared by the phone cards and the desktop table. */
function referredView(r: PortalReferredAccount) {
  const st = REFERRED_STATUS[r.status] || REFERRED_STATUS.not_paying_yet
  const onFree = r.status === 'not_paying_yet' && r.plan === 'free'
  return {
    st,
    note: onFree ? 'On the free plan. It earns once they upgrade to a paid plan.' : st.note,
    basis: basisLabel(r),
    fees: (r.fees_count || 0) > 0 ? `includes ${r.fees_count} one-time fee${r.fees_count === 1 ? '' : 's'} (${r.currency} ${r.fees_total} paid)` : '',
    showEstimate: r.estimate !== null && r.payments_left > 0,
    left: r.basis_interval === 'once' ? 'on the package payment' : `${r.payments_left} more payment${r.payments_left === 1 ? '' : 's'}${r.window_ends_at ? `, until ${fmtDate(r.window_ends_at)}` : r.status === 'not_paying_yet' ? ' from the first one' : ''}`,
    noEstimate: onFree ? 'after upgrade' : r.estimate_basis === 'price_not_set' ? 'not set yet' : '0.00',
  }
}

/** What the estimate is based on, in words: the price the account really pays when we set one. */
function basisLabel(r: PortalReferredAccount): string {
  const amount = r.basis ?? r.monthly_basis
  if (r.basis_interval === 'none') return 'pays nothing'
  if (!amount) return ''
  if (r.basis_interval === 'once') return `${r.currency} ${amount} package${r.prepaid_until ? `, prepaid until ${fmtDate(r.prepaid_until)}` : ''}`
  if (r.basis_interval === 'year') return `${r.currency} ${amount} / year`
  return `${r.currency} ${amount} / month${r.estimate_basis === 'last_payment' ? ', last payment' : ''}`
}

function ReferredAccounts({ rows, programsById }: { rows: PortalReferredAccount[]; programsById: Map<string, PortalProgram> }) {
  const earned = sumByCurrency(rows, (r) => r.earned)
  const toCome = sumByCurrency(rows.filter((r) => r.payments_left > 0), (r) => r.estimate)
  const multiProgram = new Set(rows.map((r) => r.program_id)).size > 1
  return (
    <section id="referred" className="space-y-3 scroll-mt-20">
      <SectionHeading>Referred accounts</SectionHeading>
      <p className="text-xs text-slate-500">Every account credited to you, paying or not. Earned is what your commissions add up to so far, refunds excluded. Still to come is an estimate, not a promise: it uses the price the account pays today (monthly, yearly or a prepaid package) and assumes it stays until your commission window closes. One-time fees outside the plans are in Earned, never in the estimate. "Not set yet" means we have not recorded this account's price.</p>
      {rows.length === 0 ? (
        <EmptyState icon={Building2} title="No referred accounts yet" body="When someone you referred signs up, or we credit an account you introduced to us, it appears here with what it can earn you." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat icon={Building2} label="Referred accounts" value={String(rows.length)} />
            <Stat icon={Wallet} label="Earned so far" value={earned || '0.00'} />
            <Stat icon={TrendingUp} label="Still to come (estimate)" value={toCome || '0.00'} />
          </div>
          <ul className="md:hidden space-y-3">
            {rows.map((r) => {
              const v = referredView(r)
              return (
                <li key={r.id} className="rounded-card border border-dark-700 bg-dark-800 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-200 truncate">{r.customer_ref || 'Customer'}</div>
                      <div className="text-xs text-slate-500">{planLabel(r.plan)}{v.basis ? ` · ${v.basis}` : ''}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${v.st.tone}`}>{v.st.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{v.note}</p>
                  <dl className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-dark-700/60 px-3 py-2">
                      <dt className="text-[11px] text-slate-500">Earned</dt>
                      <dd className="text-sm font-semibold text-white">{r.currency} {r.earned}</dd>
                      <dd className="text-[11px] text-slate-500">{r.payments_count} payment{r.payments_count === 1 ? '' : 's'}{Number(r.paid) > 0 ? `, ${r.currency} ${r.paid} paid out` : ''}</dd>
                      {v.fees && <dd className="text-[11px] text-slate-500">{v.fees}</dd>}
                    </div>
                    <div className="rounded-lg bg-dark-700/60 px-3 py-2">
                      <dt className="text-[11px] text-slate-500">Still to come</dt>
                      <dd className={`text-sm font-semibold ${v.showEstimate ? 'text-brand-300' : 'text-slate-500'}`}>{v.showEstimate ? `up to ${r.currency} ${r.estimate}` : v.noEstimate}</dd>
                      {v.showEstimate && <dd className="text-[11px] text-slate-500">{v.left}</dd>}
                    </div>
                  </dl>
                  <div className="text-[11px] text-slate-500">Referred {fmtDate(r.referred_at)}{multiProgram ? ` · ${programsById.get(r.program_id)?.name || ''}` : ''}{r.last_payment_at ? ` · last payment ${fmtDate(r.last_payment_at)}` : ''}</div>
                </li>
              )
            })}
          </ul>
          <div className="hidden md:block overflow-x-auto rounded-card border border-dark-700 bg-dark-800">
            <table className="min-w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">Account</th>
                  <th className="text-left px-4 py-2">Plan</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Payments</th>
                  <th className="text-right px-4 py-2">Earned</th>
                  <th className="text-right px-4 py-2">Still to come</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {rows.map((r) => {
                  const v = referredView(r)
                  return (
                    <tr key={r.id} className="align-top">
                      <td className="px-4 py-2">
                        <div className="text-slate-200">{r.customer_ref || 'Customer'}</div>
                        <div className="text-xs text-slate-500">
                          Referred {fmtDate(r.referred_at)}{multiProgram ? ` · ${programsById.get(r.program_id)?.name || ''}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-300 whitespace-nowrap">
                        {planLabel(r.plan)}
                        {v.basis && <div className="text-xs text-slate-500">{v.basis}</div>}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${v.st.tone}`}>{v.st.label}</span>
                        <div className="text-xs text-slate-500 mt-1 max-w-[16rem]">{v.note}</div>
                      </td>
                      <td className="px-4 py-2 text-right text-slate-300 whitespace-nowrap">
                        {r.payments_count}
                        {r.last_payment_at && <div className="text-xs text-slate-500">last {fmtDate(r.last_payment_at)}</div>}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-200 whitespace-nowrap">
                        {r.currency} {r.earned}
                        {Number(r.paid) > 0 && <div className="text-xs text-slate-500">{r.currency} {r.paid} paid out</div>}
                        {v.fees && <div className="text-xs text-slate-500 max-w-[14rem] whitespace-normal">{v.fees}</div>}
                      </td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {v.showEstimate ? (
                          <>
                            <span className="text-brand-300">up to {r.currency} {r.estimate}</span>
                            <div className="text-xs text-slate-500">{v.left}</div>
                          </>
                        ) : <span className="text-slate-500">{v.noEstimate}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function HowYouGetPaid({ program }: { program: PortalProgram | null }) {
  if (!program) return null
  const steps = [
    { title: 'Your referral pays', body: 'Each payment from an account credited to you creates a commission right away, marked pending. Accounts we invoice by hand are recorded when their payment reaches us.' },
    { title: `${program.approval_days} days to approve`, body: `After ${program.approval_days} days without a refund the commission becomes approved. A refund in that time cancels it.` },
    { title: 'Monthly payout', body: `Once a month we group your approved commissions into one payout when they reach ${program.currency} ${program.min_payout}${program.payout_schedule ? ` (${program.payout_schedule.toLowerCase()})` : ''}. A smaller total carries over to the next month.` },
    { title: 'Invoice and transfer', body: 'You attach your invoice to the payout on this page, we send the transfer to the payout method in your settings and record the reference here.' },
  ]
  return (
    <section id="how-payouts-work" aria-label="How you get paid" className="rounded-card border border-dark-700 bg-dark-800 p-5 space-y-4 scroll-mt-20">
      <h3 className="text-sm font-semibold text-white">How you get paid</h3>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-500/15 text-brand-300 text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
            <div>
              <div className="text-sm font-medium text-slate-200">{s.title}</div>
              <p className="text-xs text-slate-400 mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-500">You earn: {program.commission_summary}. Full rules in the <a href={program.terms_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">program terms</a>.</p>
    </section>
  )
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-card border border-dark-700 bg-dark-800 p-4">
      <div className="flex items-center gap-2 text-slate-400"><Icon size={14} /><StatLabel>{label}</StatLabel></div>
      <StatValue className="mt-1">{value}</StatValue>
    </div>
  )
}

function ProgramCard({ m }: { m: PortalMembership }) {
  const p = m.program
  return (
    <article className="rounded-card border border-dark-700 bg-dark-800 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {p.logo_url ? (
            <img src={p.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/5" />
          ) : (
            <span className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold text-white shrink-0" style={{ background: p.brand_color || '#8b5cf6' }}>{p.name.slice(0, 1)}</span>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{p.name}</h3>
            {p.tagline && <p className="text-xs text-slate-400 truncate">{p.tagline}</p>}
          </div>
        </div>
        <StatusPill value={m.status} />
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-dark-700/60 py-2"><dt className="text-[11px] text-slate-500">Clicks</dt><dd className="text-sm font-semibold text-white">{m.clicks_total}</dd></div>
        <div className="rounded-lg bg-dark-700/60 py-2"><dt className="text-[11px] text-slate-500">Leads</dt><dd className="text-sm font-semibold text-white">{m.leads}</dd></div>
        <div className="rounded-lg bg-dark-700/60 py-2"><dt className="text-[11px] text-slate-500">Sales</dt><dd className="text-sm font-semibold text-white">{m.sales}</dd></div>
      </dl>

      <p className="text-sm text-slate-300"><span className="text-slate-500">You earn:</span> {p.commission_summary}</p>

      {m.status === 'active' && m.referral_link ? (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Your referral link</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input readOnly className={`${ic} font-mono text-xs`} value={m.referral_link} onFocus={(e) => e.currentTarget.select()} aria-label="Referral link" />
            <CopyButton text={m.referral_link} label="Copy link" />
          </div>
          {m.coupon_codes.length > 0 && (
            <div className="text-xs text-slate-400">Coupon code{m.coupon_codes.length > 1 ? 's' : ''}: {m.coupon_codes.map((c) => <code key={c} className="ml-1 px-1.5 py-0.5 rounded bg-dark-700 text-brand-300">{c}</code>)}</div>
          )}
        </div>
      ) : m.status === 'pending' ? (
        <p className="text-xs text-amber-300">Your application is being reviewed. You will get an email once it is approved.</p>
      ) : m.status === 'invited' ? (
        <p className="text-xs text-brand-300">Invitation pending. Use the link in your invitation email to activate this program.</p>
      ) : (
        <p className="text-xs text-slate-500">This membership is {m.status}.</p>
      )}

      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>{p.attribution_days}-day attribution</span>
        <span>{p.approval_days}-day approval</span>
        <span>Min payout {p.currency} {p.min_payout}</span>
        {p.payout_schedule && <span>{p.payout_schedule}</span>}
        <a href={p.terms_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">Program terms</a>
      </div>

      {m.resources.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-1">Resources</div>
          <ul className="space-y-1">
            {m.resources.map((r) => (
              <li key={r.id} className="text-sm">
                {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300">{r.title} <ExternalLink size={12} /></a> : <span className="text-slate-300">{r.title}</span>}
                {r.body && <p className="text-xs text-slate-400 whitespace-pre-wrap">{r.body}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

function PayoutCard({ b, onChanged, onNotice }: { b: PortalBatch; onChanged: () => void; onNotice: (m: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function upload(file: File) {
    setErr('')
    setBusy(true)
    try {
      if (isDemoMode) { onNotice('Demo mode: uploads are disabled.'); return }
      const prep = await affiliatePost<{ url: string; token: string; path: string }>('affiliate-portal', { action: 'upload_url', batch_id: b.id, filename: file.name })
      if (prep.error || !prep.data) throw new Error(prep.error || 'Could not prepare the upload.')
      const { error: upErr } = await supabase.storage.from('affiliate-documents').uploadToSignedUrl(prep.data.path, prep.data.token, file, { contentType: file.type || 'application/octet-stream' })
      if (upErr) throw new Error('Upload failed. Please try again.')
      const att = await affiliatePost<{ ok: boolean }>('affiliate-portal', { action: 'attach_document', batch_id: b.id, path: prep.data.path, name: file.name, size: file.size })
      if (att.error) throw new Error(att.error)
      onNotice('Invoice attached. Thank you.')
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function open(path: string) {
    if (isDemoMode) return
    const res = await affiliatePost<{ url: string }>('affiliate-portal', { action: 'document_url', batch_id: b.id, path })
    if (res.data?.url) window.open(res.data.url, '_blank', 'noopener')
    else setErr(res.error || 'Could not open the document.')
  }

  return (
    <div className="rounded-card border border-dark-700 bg-dark-800 p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white">{b.currency} {b.total}</span>
          <StatusPill value={b.status} />
          <span className="text-xs text-slate-500">{b.item_count} commission{b.item_count === 1 ? '' : 's'}</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Created {fmtDate(b.created_at)}{b.paid_at ? ` · paid ${fmtDate(b.paid_at)}` : ''}{b.external_reference ? ` · ref ${b.external_reference}` : ''}{b.payout_method ? ` · ${PAYOUT_METHOD_LABELS[b.payout_method]}` : ''}
        </div>
        {b.documents.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {b.documents.map((d) => (
              <li key={d.path}>
                <button type="button" onClick={() => open(d.path)} className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"><FileText size={12} /> {d.name} <span className="text-slate-500">({d.kind}, {d.uploaded_by})</span></button>
              </li>
            ))}
          </ul>
        )}
        {err && <p className="text-xs text-red-300 mt-1">{err}</p>}
      </div>
      {b.status !== 'cancelled' && (
        <label className={`${btnGhost} cursor-pointer`}>
          {busy ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} Attach invoice
          <input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
        </label>
      )}
    </div>
  )
}

function SettingsForm({ me, onSaved }: { me: PortalMe; onSaved: (msg: string) => void }) {
  const a = me.affiliate!
  const fields = me.payout_detail_fields || DEFAULT_FIELDS
  const [profile, setProfile] = useState({ full_name: a.full_name, company: a.company || '', website: a.website || '', social_url: a.social_url || '', country: a.country || '' })
  const [method, setMethod] = useState<PayoutMethod | ''>(a.payout_method || '')
  const [details, setDetails] = useState<Record<string, string>>(a.payout_details || {})
  const [busy, setBusy] = useState<'profile' | 'payout' | null>(null)
  const [err, setErr] = useState('')

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setBusy('profile')
    if (isDemoMode) { setTimeout(() => { setBusy(null); onSaved('Profile saved.') }, 300); return }
    const res = await affiliatePost<{ ok: boolean }>('affiliate-portal', { action: 'update_profile', ...profile })
    setBusy(null)
    if (res.error) setErr(res.error); else onSaved('Profile saved.')
  }
  async function savePayout(e: React.FormEvent) {
    e.preventDefault()
    if (!method) { setErr('Choose a payout method.'); return }
    setErr(''); setBusy('payout')
    if (isDemoMode) { setTimeout(() => { setBusy(null); onSaved('Payout details saved.') }, 300); return }
    const res = await affiliatePost<{ ok: boolean }>('affiliate-portal', { action: 'update_payout', payout_method: method, payout_details: details })
    setBusy(null)
    if (res.error) setErr(res.error); else onSaved('Payout details saved.')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="rounded-card border border-dark-700 bg-dark-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Profile</h3>
        {(['full_name', 'company', 'website', 'social_url', 'country'] as const).map((k) => (
          <div key={k}>
            <label htmlFor={`pf-${k}`} className="block text-xs text-slate-500 mb-1">{{ full_name: 'Full name', company: 'Company', website: 'Website', social_url: 'Main social profile', country: 'Country' }[k]}</label>
            <input id={`pf-${k}`} className={ic} value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} maxLength={200} required={k === 'full_name'} />
          </div>
        ))}
        <div className="text-xs text-slate-500">Email: {a.email} (contact support to change it)</div>
        <button type="submit" disabled={busy === 'profile'} className={btnPrimary}>{busy === 'profile' ? <Loader2 className="animate-spin" size={14} /> : null} Save profile</button>
      </form>

      <form onSubmit={savePayout} className="rounded-card border border-dark-700 bg-dark-800 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Payout method</h3>
        <select className={ic} value={method} onChange={(e) => { setMethod(e.target.value as PayoutMethod | ''); setDetails({}) }} aria-label="Payout method">
          <option value="">Choose</option>
          {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{PAYOUT_METHOD_LABELS[m]}</option>)}
        </select>
        {method && fields[method].map((k) => (
          <div key={k}>
            <label htmlFor={`pd-${k}`} className="block text-xs text-slate-500 mb-1">{FIELD_LABELS[k] || k}</label>
            {k === 'instructions' || k === 'note'
              ? <textarea id={`pd-${k}`} className={ic} rows={2} value={details[k] || ''} onChange={(e) => setDetails({ ...details, [k]: e.target.value })} maxLength={500} />
              : <input id={`pd-${k}`} className={ic} value={details[k] || ''} onChange={(e) => setDetails({ ...details, [k]: e.target.value })} maxLength={200} />}
          </div>
        ))}
        <p className="text-[11px] text-slate-500">Only what a transfer needs. Never enter a password, card number or API key.</p>
        {err && <p className="text-xs text-red-300">{err}</p>}
        <button type="submit" disabled={busy === 'payout'} className={btnPrimary}>{busy === 'payout' ? <Loader2 className="animate-spin" size={14} /> : null} Save payout details</button>
      </form>
    </div>
  )
}
