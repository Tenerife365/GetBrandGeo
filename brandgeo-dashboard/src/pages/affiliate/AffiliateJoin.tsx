/**
 * /affiliate/join/:token: accept an invitation. Public (no session): the
 * single-use token in the URL is the credential. Shows the programs the
 * affiliate was invited to, collects terms acceptance and (optionally) payout
 * details, then the server mints a magic link that signs them in.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, Loader2, ArrowRight, CheckCircle, Handshake } from 'lucide-react'
import BrandGeoMark from '../../components/BrandGeoLogo'
import { affiliatePost } from '../../lib/affiliateApi'
import { PAYOUT_METHODS, PAYOUT_METHOD_LABELS, type JoinPreview, type PayoutMethod } from '../../types/affiliate'
import { isDemoMode } from '../../lib/supabase'

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
const bc = 'w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2'

const DETAIL_FIELDS: Record<PayoutMethod, { key: string; label: string }[]> = {
  wise: [{ key: 'account_holder', label: 'Account holder' }, { key: 'email', label: 'Wise email' }, { key: 'iban', label: 'IBAN (optional)' }, { key: 'country', label: 'Country' }],
  revolut: [{ key: 'account_holder', label: 'Account holder' }, { key: 'revtag', label: 'Revtag' }, { key: 'email', label: 'Revolut email' }],
  paypal: [{ key: 'account_holder', label: 'Account holder' }, { key: 'email', label: 'PayPal email' }],
  bank: [{ key: 'account_holder', label: 'Account holder' }, { key: 'iban', label: 'IBAN' }, { key: 'bic', label: 'BIC / SWIFT' }, { key: 'bank_name', label: 'Bank name' }, { key: 'country', label: 'Country' }],
  other: [{ key: 'account_holder', label: 'Account holder' }, { key: 'instructions', label: 'How to pay you' }],
}

const DEMO_PREVIEW: JoinPreview = {
  affiliate: { full_name: 'Demo Affiliate', email: 'd***@example.com', company: 'Demo Studio', payout_method: null, terms_accepted_at: null },
  programs: [{
    id: 'p1', slug: 'brandgeo', name: 'BrandGEO', tagline: 'AI visibility monitoring', description: null, logo_url: null, brand_color: '#8b5cf6', destination_url: 'https://getbrandgeo.com/',
    status: 'active', currency: 'EUR', commission_summary: '20% of every sale, plus 20% of each renewal for 12 months', attribution_days: 30, approval_days: 30, min_payout: '50.00', payout_schedule: 'Monthly, by the 10th',
    terms_md: null, terms_url: 'https://getbrandgeo.com/affiliate-terms.html', terms_version: '2026-09-12', membership_status: 'invited',
  }],
  terms_version: '2026-09-12',
  terms_url: 'https://getbrandgeo.com/affiliate-terms.html',
}

export default function AffiliateJoin() {
  const { token = '' } = useParams()
  const [preview, setPreview] = useState<JoinPreview | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [method, setMethod] = useState<PayoutMethod | ''>('')
  const [details, setDetails] = useState<Record<string, string>>({})
  const [done, setDone] = useState<{ link: string | null; message?: string } | null>(null)

  useEffect(() => {
    document.title = 'Join the affiliate program · BrandGEO'
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (isDemoMode) { setPreview(DEMO_PREVIEW); setLoading(false); return }
      const res = await affiliatePost<JoinPreview & { error?: string }>('affiliate-portal', { action: 'join_preview', token }, { auth: false })
      if (cancelled) return
      if (res.error || !res.data) setLoadError(res.error || 'This invitation link is not valid.')
      else { setPreview(res.data); if (res.data.affiliate.payout_method) setMethod(res.data.affiliate.payout_method) }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [token])

  async function accept(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !terms || !privacy) return
    setError('')
    setSubmitting(true)
    if (isDemoMode) { setTimeout(() => { setDone({ link: '/affiliate' }); setSubmitting(false) }, 500); return }
    const res = await affiliatePost<{ ok: boolean; action_link: string | null; message?: string }>('affiliate-portal', {
      action: 'join_accept', token, terms_accepted: terms, privacy_accepted: privacy,
      payout_method: method || undefined, payout_details: method ? details : undefined,
    }, { auth: false })
    setSubmitting(false)
    if (res.error || !res.data) { setError(res.error || 'Could not accept the invitation.'); return }
    setDone({ link: res.data.action_link, message: res.data.message })
    if (res.data.action_link) window.location.assign(res.data.action_link)
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center mb-8">
          <BrandGeoMark size="xl" href="https://getbrandgeo.com/affiliates.html" ariaLabel="BrandGEO affiliates" />
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-card p-card-feature">{children}</div>
      </div>
    </div>
  )

  if (loading) return shell(<div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>)

  if (loadError || !preview) return shell(
    <div className="text-center">
      <AlertCircle className="mx-auto mb-3 text-red-400" size={36} />
      <h1 className="text-lg font-semibold text-white mb-2">This link does not work</h1>
      <p className="text-sm text-slate-400 mb-6">{loadError}</p>
      <p className="text-xs text-slate-500">Already accepted? <Link to="/affiliate/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>. Otherwise reply to the invitation email and we will send a fresh link.</p>
    </div>,
  )

  if (done) return shell(
    <div className="text-center">
      <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} />
      <h1 className="text-lg font-semibold text-white mb-2">You are in</h1>
      <p className="text-sm text-slate-400 mb-6">{done.link ? 'Signing you in and opening your affiliate dashboard.' : (done.message || 'Your account is active.')}</p>
      {done.link ? (
        <a href={done.link} className={bc}>Open my dashboard <ArrowRight size={16} /></a>
      ) : (
        <Link to="/affiliate/login" className={bc}>Sign in <ArrowRight size={16} /></Link>
      )}
    </div>,
  )

  return shell(
    <form onSubmit={accept} className="space-y-5">
      <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider"><Handshake size={14} /> Affiliate invitation</div>
      <div>
        <h1 className="text-lg font-semibold text-white">Welcome, {preview.affiliate.full_name}</h1>
        <p className="text-sm text-slate-400 mt-1">You have been invited to promote {preview.programs.length === 1 ? 'this program' : 'these programs'}. Accept the terms to activate your referral links.</p>
      </div>

      <ul className="space-y-3">
        {preview.programs.map((p) => (
          <li key={p.id} className="rounded-lg border border-dark-600 bg-dark-700/60 p-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: p.brand_color || '#8b5cf6' }}>{p.name.slice(0, 1)}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{p.name}</div>
                {p.tagline && <div className="text-xs text-slate-400 truncate">{p.tagline}</div>}
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <dt className="text-slate-500">Commission</dt><dd className="text-slate-300">{p.commission_summary}</dd>
              <dt className="text-slate-500">Attribution window</dt><dd className="text-slate-300">{p.attribution_days} days</dd>
              <dt className="text-slate-500">Approval period</dt><dd className="text-slate-300">{p.approval_days} days after the sale</dd>
              <dt className="text-slate-500">Minimum payout</dt><dd className="text-slate-300">{p.currency} {p.min_payout}</dd>
              {p.payout_schedule && <><dt className="text-slate-500">Payout schedule</dt><dd className="text-slate-300">{p.payout_schedule}</dd></>}
            </dl>
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor="aff-method" className="block text-xs font-medium text-slate-400 mb-1">How should we pay you? (you can add this later)</label>
        <select id="aff-method" className={ic} value={method} onChange={(e) => { setMethod(e.target.value as PayoutMethod | ''); setDetails({}) }}>
          <option value="">Decide later</option>
          {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{PAYOUT_METHOD_LABELS[m]}</option>)}
        </select>
        {method && (
          <div className="grid gap-3 mt-3 sm:grid-cols-2">
            {DETAIL_FIELDS[method].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-slate-500 mb-1" htmlFor={`pd-${f.key}`}>{f.label}</label>
                <input id={`pd-${f.key}`} className={ic} value={details[f.key] || ''} onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} maxLength={200} />
              </div>
            ))}
            <p className="sm:col-span-2 text-[11px] text-slate-500">We store only what is needed to send a transfer. Never share passwords or card numbers.</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input type="checkbox" className="mt-1" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>I accept the <a href={preview.terms_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">affiliate terms</a> (version {preview.terms_version}).</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input type="checkbox" className="mt-1" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
          <span>I have read the <a href="https://getbrandgeo.com/privacy.html" target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300">privacy policy</a>.</span>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      <button type="submit" disabled={submitting || !terms || !privacy} className={bc}>
        {submitting ? <Loader2 className="animate-spin" size={16} /> : <>Accept and open my dashboard <ArrowRight size={16} /></>}
      </button>
    </form>,
  )
}
