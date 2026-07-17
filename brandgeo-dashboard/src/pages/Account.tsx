/**
 * Account.tsx — "My Account" for any signed-in user (viewer or admin).
 * Profile (brand, email, access level, plan), plan/billing management, and a
 * self-serve password change. Non-admins finally have a home for their own info.
 */
import { useEffect, useState } from 'react'
import {
  Mail, CreditCard, KeyRound, Loader2, Check, ShieldCheck, Building2,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { PLAN_LABELS } from '../lib/planConfig'

/** Brand initials for the avatar — "Bucate pe Roate" -> "BR", "Qonto" -> "QO". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Account() {
  const { activeClient, activeClientId, isAdmin } = useClient()
  const brandName = activeClient?.name ?? 'Your brand'
  const [email, setEmail] = useState('')

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    if (isDemoMode) { setEmail('demo@getbrandgeo.com'); return }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const changePassword = async () => {
    setPwMsg(null)
    if (pw1.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return }
    if (pw1 !== pw2)    { setPwMsg({ ok: false, text: 'The two passwords do not match.' }); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    setPwSaving(false)
    if (error) { setPwMsg({ ok: false, text: error.message }); return }
    setPw1(''); setPw2('')
    setPwMsg({ ok: true, text: 'Password updated.' })
  }

  // Opens the Stripe Customer Portal (same path as the sidebar "Manage billing").
  const openBilling = async () => {
    if (billingLoading) return
    setBillingLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ client_id: activeClientId }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) { window.location.href = data.url; return }
      alert(data?.error || 'Could not open the billing portal. Please try again.')
    } catch { alert('Could not open the billing portal. Please try again.') }
    setBillingLoading(false)
  }

  const planLabel = activeClient
    ? (PLAN_LABELS[activeClient.plan as keyof typeof PLAN_LABELS] ?? activeClient.plan)
    : '—'
  const hasStripe = !!activeClient?.stripe_customer_id

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      {/* Header + avatar — a bit of "this is mine" ownership. */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25 flex items-center justify-center text-lg font-bold shrink-0">
          {initials(brandName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white tracking-tight">My Account</h1>
          <p className="text-sm text-slate-400 mt-0.5 truncate">
            Signed in for <span className="text-slate-200 font-medium">{brandName}</span>
          </p>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-dark-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          <Field icon={<Building2 size={15} />}   label="Brand"        value={brandName} />
          <Field icon={<Mail size={15} />}        label="Email"        value={email || '—'} />
          <Field icon={<ShieldCheck size={15} />} label="Access level" value={isAdmin ? 'Admin' : 'Member'} />
          <Field icon={<CreditCard size={15} />}  label="Plan"         value={planLabel} />
        </div>
      </div>

      {/* Plan & billing */}
      <div className="bg-dark-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">Plan &amp; billing</h2>
        <p className="text-xs text-slate-500 mb-4">
          You&apos;re on the <span className="text-slate-300 font-medium">{planLabel}</span> plan.
        </p>
        {hasStripe ? (
          <button onClick={openBilling} disabled={billingLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-60">
            {billingLoading ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            Manage billing &amp; plan
          </button>
        ) : (
          <a href="mailto:support@getbrandgeo.com?subject=Plan%20change%20request"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors">
            <CreditCard size={15} /> Contact us to change your plan
          </a>
        )}
      </div>

      {/* Change password */}
      <div className="bg-dark-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
          <KeyRound size={15} className="text-slate-500" /> Change password
        </h2>
        <p className="text-xs text-slate-500 mb-4">Set a new password for signing in.</p>
        <div className="space-y-3 max-w-sm">
          <input type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="New password"
            aria-label="New password"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Confirm new password"
            aria-label="Confirm new password"
            onKeyDown={e => e.key === 'Enter' && changePassword()}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
          <div className="flex items-center gap-3">
            <button onClick={changePassword} disabled={pwSaving || !pw1 || !pw2}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50">
              {pwSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Update password
            </button>
            {pwMsg && <span className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        {icon}<span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-sm text-slate-200 font-medium break-words">{value}</div>
    </div>
  )
}
