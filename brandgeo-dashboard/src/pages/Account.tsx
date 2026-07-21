/**
 * Account.tsx — the client's profile page (viewer or admin).
 * Header reads as the brand's own profile (logo + brand name + site + plan).
 * Shows plan-as-blocks with the current tier highlighted, subscription status +
 * billing dates (started / paid-until — manual for non-Stripe Managed clients,
 * editable by admins), change-email, and a secure change-password flow.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Mail, CreditCard, KeyRound, Loader2, Check, ShieldCheck, Globe, RefreshCw, Crown, Pencil, Gift, Trash2,
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { PLAN_LABELS, PLAN_ORDER, type Plan } from '../lib/planConfig'
import BrandLogo from '../components/BrandLogo'

interface ClientEvent {
  id: number
  type: string
  from_plan: string | null
  to_plan: string | null
  created_at: string
  meta: { grant_until?: string | null; note?: string | null } | null
}

const GRANT_TYPE_LABELS: Record<string, string> = {
  manual: 'Assign plan', trial: 'Free trial', comp: 'Complimentary', stripe: 'Stripe', signup: 'Signup', expired: 'Expired',
}

/** Plan ladder for the "plans as blocks" section — display prices only (source
 *  of truth for billing is Stripe / PRICING-SPEC.md). */
const PLAN_TIERS: { id: string; label: string; price: string }[] = [
  { id: 'free',       label: 'Free',       price: '€0' },
  { id: 'essentials', label: 'Essentials', price: '€99 / mo' },
  { id: 'growth',     label: 'Growth',     price: '€299 / mo' },
  { id: 'managed',    label: 'Managed',    price: '€900 / mo' },
  { id: 'pro',        label: 'Pro',        price: 'from €1,500 / mo' },
  { id: 'enterprise', label: 'Enterprise', price: 'Custom' },
]

function domainOf(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = url.includes('://') ? url : `https://${url}`
    return new URL(u).hostname.replace(/^www\./, '')
  } catch { return null }
}

/** Format a Stripe unix-seconds timestamp. */
const fmtUnix = (unixSec: number) =>
  new Date(unixSec * 1000).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })

/** Format a date string (YYYY-MM-DD or a full timestamp). Returns null if unusable. */
const fmtDateStr = (s?: string | null): string | null => {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
}

interface SubInfo {
  active?: boolean
  status?: string
  current_period_end?: number
  cancel_at_period_end?: boolean
}

export default function Account() {
  const { activeClient, activeClientId, isAdmin, patchClient } = useClient()
  const brandName = activeClient?.name ?? 'Your brand'
  const website = activeClient?.brand_website ?? null
  const domain = domainOf(website)
  const [email, setEmail] = useState('')
  const [sub, setSub] = useState<SubInfo | null>(null)

  // billing dates (admin editor) — localDates overrides activeClient after a save
  const [localDates, setLocalDates] = useState<{ started: string | null; paid: string | null } | null>(null)
  const [editingDates, setEditingDates] = useState(false)
  const [startedInput, setStartedInput] = useState('')
  const [paidInput, setPaidInput] = useState('')
  const [datesSaving, setDatesSaving] = useState(false)
  const [datesMsg, setDatesMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // change email
  const [newEmail, setNewEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // change password (current pw -> emailed code -> new pw)
  const [oldPw, setOldPw] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwStage, setPwStage] = useState<'form' | 'code'>('form')
  const [pwCode, setPwCode] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [billingLoading, setBillingLoading] = useState(false)

  // ── Admin: manage plan / grant a trial or comp ──────────────────────────────
  const [planInput, setPlanInput] = useState<Plan>('free')
  const [grantType, setGrantType] = useState<'manual' | 'trial' | 'comp'>('manual')
  const [grantDays, setGrantDays] = useState(30)
  const [planNote, setPlanNote] = useState('')
  const [notifyClient, setNotifyClient] = useState(true)
  const [planMessage, setPlanMessage] = useState('')
  const [planSaving, setPlanSaving] = useState(false)
  const [planMsg, setPlanMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [events, setEvents] = useState<ClientEvent[]>([])
  const [clientUsers, setClientUsers] = useState<{ email: string | null; role: string; last_sign_in_at: string | null; confirmed: boolean }[]>([])

  // Admin: delete-account (danger zone)
  const [delConfirm, setDelConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [delMsg, setDelMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Reset any local date override when switching clients.
  useEffect(() => { setLocalDates(null); setEditingDates(false); setDatesMsg(null) }, [activeClientId])

  // Seed + reset the plan editor when the client changes.
  useEffect(() => {
    setPlanInput((activeClient?.plan as Plan) ?? 'free')
    setGrantType('manual'); setGrantDays(30); setPlanNote(''); setPlanMessage('')
    setNotifyClient(true); setPlanMsg(null)
    setDelConfirm(''); setDelMsg(null); setDeleting(false)
  }, [activeClientId, activeClient?.plan])

  // Admin: recent plan-change audit trail for this client.
  const loadEvents = useCallback(async () => {
    if (!isAdmin || !activeClientId || isDemoMode) { setEvents([]); return }
    try {
      const { data } = await supabase
        .from('client_events')
        .select('id, type, from_plan, to_plan, created_at, meta')
        .eq('client_id', activeClientId)
        .order('created_at', { ascending: false })
        .limit(6)
      setEvents((data as ClientEvent[]) ?? [])
    } catch { setEvents([]) } // table not migrated yet
  }, [isAdmin, activeClientId])
  useEffect(() => { loadEvents() }, [loadEvents])

  // Admin: the login users attached to this client (email + last sign-in), so a
  // wrong/test address on file is visible without opening Supabase.
  const loadClientUsers = useCallback(async () => {
    if (!isAdmin || !activeClientId || isDemoMode) { setClientUsers([]); return }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/client-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ client_id: activeClientId }),
      })
      if (res.ok) { const d = await res.json(); setClientUsers(d.users ?? []) } else setClientUsers([])
    } catch { setClientUsers([]) }
  }, [isAdmin, activeClientId])
  useEffect(() => { loadClientUsers() }, [loadClientUsers])

  const grantEndPreview = (() => {
    if (grantType === 'manual') return null
    const d = new Date(); d.setDate(d.getDate() + grantDays)
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })
  })()

  const savePlan = async () => {
    setPlanMsg(null); setPlanSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/set-client-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          client_id: activeClientId,
          plan: planInput,
          grant_type: grantType,
          ...(grantType !== 'manual' ? { period_days: grantDays } : {}),
          note: planNote || null,
          notify: notifyClient,
          message: planMessage || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || (data as { error?: string }).error) {
        throw new Error((data as { error?: string }).error || 'Could not update the plan.')
      }
      const d = data as { plan_source?: string; plan_grant_until?: string | null; warning?: string; email?: { sent?: boolean; skipped?: boolean } }
      patchClient(activeClientId, {
        plan: planInput, plan_source: d.plan_source ?? grantType, plan_grant_until: d.plan_grant_until ?? null,
      })
      const parts = [`Plan set to ${PLAN_LABELS[planInput]}.`]
      if (notifyClient) parts.push(d.email?.sent ? 'Client notified by email + banner.' : d.email?.skipped ? 'Banner shown; email skipped (no client email on file).' : 'Client banner shown.')
      if (d.warning) parts.push(d.warning)
      setPlanMsg({ ok: true, text: parts.join(' ') })
      loadEvents()
    } catch (e) {
      setPlanMsg({ ok: false, text: (e as Error).message })
    } finally {
      setPlanSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (deleting) return
    setDelMsg(null); setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/delete-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ client_id: activeClientId, confirm: delConfirm.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || (data as { error?: string }).error) throw new Error((data as { error?: string }).error || 'Could not delete the account.')
      const warnings = (data as { warnings?: string[] }).warnings
      setDelMsg({
        ok: true,
        text: `Deleted "${(data as { name?: string }).name ?? 'the account'}".${warnings?.length ? ` (${warnings.length} warning(s) logged.)` : ''} Reloading…`,
      })
      setTimeout(() => window.location.reload(), 1400)  // re-init picks a remaining client
    } catch (e) {
      setDelMsg({ ok: false, text: (e as Error).message })
      setDeleting(false)
    }
  }

  // Load the signed-in user's email.
  useEffect(() => {
    if (isDemoMode) { setEmail('demo@getbrandgeo.com'); return }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [activeClientId])

  // Subscription status + renewal date (Netlify function → Stripe). No-ops in dev
  // preview (functions don't run under `vite`); shows after deploy. Only relevant
  // for Stripe self-serve clients; Managed/Pro are covered by the manual dates below.
  useEffect(() => {
    if (isDemoMode || !activeClientId) return
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token ?? ''
        const res = await fetch('/.netlify/functions/get-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ client_id: activeClientId }),
        })
        if (res.ok) setSub(await res.json())
      } catch { /* function unavailable (e.g. dev) — just hide the date */ }
    })()
  }, [activeClientId])

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

  const changeEmail = async () => {
    setEmailMsg(null)
    if (!/^\S+@\S+\.\S+$/.test(newEmail.trim())) { setEmailMsg({ ok: false, text: 'Enter a valid email address.' }); return }
    setEmailSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailSaving(false)
    if (error) { setEmailMsg({ ok: false, text: error.message }); return }
    setNewEmail('')
    setEmailMsg({ ok: true, text: 'Confirmation sent — check both your old and new inbox to complete the change.' })
  }

  // Step 1: verify the current password, then email a confirmation code.
  const startPasswordChange = async () => {
    setPwMsg(null)
    if (!oldPw)          { setPwMsg({ ok: false, text: 'Enter your current password.' }); return }
    if (pw1.length < 8)  { setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' }); return }
    if (pw1 !== pw2)     { setPwMsg({ ok: false, text: 'The two new passwords do not match.' }); return }
    setPwSaving(true)
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: oldPw })
    if (signErr) { setPwSaving(false); setPwMsg({ ok: false, text: 'Your current password is incorrect.' }); return }
    const { error: reauthErr } = await supabase.auth.reauthenticate()
    setPwSaving(false)
    if (reauthErr) { setPwMsg({ ok: false, text: reauthErr.message }); return }
    setPwStage('code')
    setPwMsg({ ok: true, text: 'We emailed you a confirmation code. Enter it below to finish.' })
  }

  // Step 2: apply the new password with the emailed code (nonce).
  const confirmPasswordChange = async () => {
    setPwMsg(null)
    if (!pwCode.trim()) { setPwMsg({ ok: false, text: 'Enter the code from your email.' }); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw1, nonce: pwCode.trim() })
    setPwSaving(false)
    if (error) { setPwMsg({ ok: false, text: error.message }); return }
    setOldPw(''); setPw1(''); setPw2(''); setPwCode(''); setPwStage('form')
    setPwMsg({ ok: true, text: 'Password updated.' })
  }

  const planLabel = activeClient
    ? (PLAN_LABELS[activeClient.plan as keyof typeof PLAN_LABELS] ?? activeClient.plan)
    : '—'
  const hasStripe = !!activeClient?.stripe_customer_id
  const currentIdx = PLAN_TIERS.findIndex(p => p.id === activeClient?.plan)

  const upgradeTo = (tier: { id: string; label: string }) => {
    if (hasStripe) return openBilling()
    window.location.href =
      `mailto:support@getbrandgeo.com?subject=${encodeURIComponent(`Upgrade to ${tier.label}`)}`
  }

  // ── Effective billing dates ────────────────────────────────────────────────
  const startedRaw = localDates ? localDates.started : (activeClient?.subscription_started_at ?? null)
  const paidRaw    = localDates ? localDates.paid    : (activeClient?.paid_until ?? null)
  const startedStr = fmtDateStr(startedRaw ?? activeClient?.created_at)  // fall back to record creation
  const paidUntilStr = paidRaw
    ? fmtDateStr(paidRaw)
    : (sub?.active && sub.current_period_end ? fmtUnix(sub.current_period_end) : null)

  const openDateEditor = () => {
    setStartedInput((startedRaw ?? activeClient?.created_at ?? '').slice(0, 10))
    setPaidInput(paidRaw ?? '')
    setDatesMsg(null)
    setEditingDates(true)
  }

  const saveDates = async () => {
    setDatesMsg(null); setDatesSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/set-client-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          client_id: activeClientId,
          subscription_started_at: startedInput || null,
          paid_until: paidInput || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Could not save dates.')
      setLocalDates({ started: startedInput || null, paid: paidInput || null })
      setEditingDates(false)
      setDatesMsg({ ok: true, text: 'Billing dates saved.' })
    } catch (e) {
      setDatesMsg({ ok: false, text: (e as Error).message })
    } finally {
      setDatesSaving(false)
    }
  }

  const inputCls = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500'
  const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50'

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      {/* Header — brand identity: logo + name + site + plan */}
      <div className="flex items-center gap-4 mb-8">
        <BrandLogo name={brandName} website={website} sizeClass="w-14 h-14" roundedClass="rounded-2xl" textClass="text-lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white tracking-tight truncate">{brandName}</h1>
          <p className="text-sm text-slate-400 mt-0.5 truncate flex items-center gap-2 flex-wrap">
            {domain && (
              <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                <Globe size={13} /> {domain}
              </a>
            )}
            {domain && <span className="text-slate-600">·</span>}
            <span>{planLabel} plan</span>
          </p>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-dark-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          <Field icon={<Globe size={15} />}       label="Website"      value={domain || '—'} />
          <Field icon={<Mail size={15} />}        label="Email"        value={email || '—'} />
          <Field icon={<ShieldCheck size={15} />} label="Access level" value={isAdmin ? 'Admin' : 'Member'} />
          <Field icon={<CreditCard size={15} />}  label="Current plan" value={planLabel} />
        </div>
      </div>

      {/* Plan & billing */}
      <div className="bg-dark-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-1">Plan &amp; billing</h2>

        {/* Subscription status line */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-4">
          {sub?.active ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active subscription
              </span>
              {sub.current_period_end && (
                <span className="text-slate-500">
                  · {sub.cancel_at_period_end ? 'ends' : 'renews'} on{' '}
                  <span className="text-slate-300">{fmtUnix(sub.current_period_end)}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-500">You&apos;re on the <span className="text-slate-300 font-medium">{planLabel}</span> plan.</span>
          )}
          {hasStripe && (
            <button onClick={openBilling} disabled={billingLoading}
              className="ml-auto inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-medium">
              {billingLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Manage &amp; renew
            </button>
          )}
        </div>

        {/* Billing dates — client since / paid until (manual for non-Stripe clients) */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3 mb-5 pb-5 border-b border-dark-700">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Client since</div>
            <div className="text-sm text-slate-200 font-medium">{startedStr ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Paid until</div>
            <div className={`text-sm font-medium ${paidUntilStr ? 'text-slate-200' : 'text-slate-500'}`}>{paidUntilStr ?? 'Not set'}</div>
          </div>
          {isAdmin && !editingDates && (
            <button onClick={openDateEditor}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium">
              <Pencil size={12} /> Edit dates
            </button>
          )}
          {datesMsg && !editingDates && (
            <span className={`text-xs w-full ${datesMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{datesMsg.text}</span>
          )}
        </div>

        {/* Admin date editor */}
        {isAdmin && editingDates && (
          <div className="mb-5 pb-5 border-b border-dark-700">
            <div className="grid sm:grid-cols-2 gap-4 max-w-md">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Client since</span>
                <input type="date" value={startedInput} onChange={e => setStartedInput(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Paid until</span>
                <input type="date" value={paidInput} onChange={e => setPaidInput(e.target.value)} className={inputCls} />
              </label>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={saveDates} disabled={datesSaving} className={primaryBtn}>
                {datesSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save dates
              </button>
              <button onClick={() => { setEditingDates(false); setDatesMsg(null) }}
                className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              {datesMsg && <span className={`text-xs ${datesMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{datesMsg.text}</span>}
            </div>
            <p className="text-[11px] text-slate-600 mt-2">Leave a field empty to clear it. Used for Managed/Pro clients billed outside the self-serve card flow.</p>
          </div>
        )}

        {/* Plans as blocks — current highlighted, higher tiers upgradeable */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PLAN_TIERS.map((tier, i) => {
            const isCurrent = tier.id === activeClient?.plan
            const isUpgrade = currentIdx >= 0 && i > currentIdx
            return (
              <div key={tier.id}
                className={`rounded-xl p-4 border flex flex-col ${
                  isCurrent
                    ? 'border-brand-500/50 bg-brand-500/10 ring-1 ring-brand-500/30'
                    : 'border-dark-700 bg-dark-800'
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-brand-200' : 'text-slate-200'}`}>{tier.label}</span>
                  {isCurrent && <Crown size={12} className="text-brand-300" />}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{tier.price}</div>
                {isCurrent ? (
                  <span className="mt-3 text-[10px] font-bold uppercase tracking-wide text-brand-300">Your plan</span>
                ) : isUpgrade ? (
                  <button onClick={() => upgradeTo(tier)}
                    className="mt-3 text-xs font-medium text-brand-400 hover:text-brand-300 text-left">
                    Upgrade →
                  </button>
                ) : (
                  <span className="mt-3 text-[10px] text-slate-600">Included below</span>
                )}
              </div>
            )
          })}
        </div>
        {!hasStripe && (
          <p className="text-[11px] text-slate-600 mt-3">Managed plans are handled by our team — upgrading opens an email to us.</p>
        )}
      </div>

      {/* Manage plan (admin) */}
      {isAdmin && (
        <div className="bg-dark-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
            <Gift size={15} className="text-brand-400" /> Manage plan
            <span className="text-[10px] font-normal uppercase tracking-wide text-slate-500 border border-dark-600 rounded px-1.5 py-0.5">Admin</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Change this client&apos;s tier, or grant a one-off trial or complimentary plan for a period.
            Trials and comps revert to Free automatically when they end.
          </p>

          {/* current state */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5 text-xs">
            <div><span className="text-slate-500">Current: </span><span className="text-slate-200 font-medium">{planLabel}</span></div>
            {activeClient?.plan_source && (
              <div><span className="text-slate-500">Source: </span><span className="text-slate-300">{GRANT_TYPE_LABELS[activeClient.plan_source] ?? activeClient.plan_source}</span></div>
            )}
            {activeClient?.plan_grant_until && (
              <div><span className="text-slate-500">Reverts to Free: </span><span className="text-amber-300">{fmtDateStr(activeClient.plan_grant_until)}</span></div>
            )}
          </div>

          {/* Login users on this account — so a wrong/test email (who a notification
              would go to) is visible without opening Supabase. */}
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Users on this account (notifications go here)</div>
            {clientUsers.length === 0 ? (
              <p className="text-xs text-slate-500">No login user attached yet — a grant will show the dashboard banner but has no address to email.</p>
            ) : (
              <ul className="space-y-1">
                {clientUsers.map((u, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                    <Mail size={12} className="text-slate-500 shrink-0" />
                    <span className="text-slate-200">{u.email ?? '—'}</span>
                    <span className="text-slate-600">· {u.role}</span>
                    {!u.confirmed && <span className="text-amber-400/80">· not confirmed</span>}
                    <span className="text-slate-600">· {u.last_sign_in_at ? `last in ${fmtDateStr(u.last_sign_in_at)}` : 'never signed in'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Plan</span>
              <select value={planInput} onChange={e => setPlanInput(e.target.value as Plan)} className={inputCls}>
                {PLAN_ORDER.map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Type</span>
              <select value={grantType} onChange={e => setGrantType(e.target.value as 'manual' | 'trial' | 'comp')} className={inputCls}>
                <option value="manual">Assign plan (no expiry)</option>
                <option value="trial">Free trial (reverts to Free)</option>
                <option value="comp">Complimentary (reverts to Free)</option>
              </select>
            </label>
          </div>

          {grantType !== 'manual' && (
            <div className="mt-4 flex flex-wrap items-end gap-4 max-w-xl">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Period (days)</span>
                <input type="number" min={1} max={3650} value={grantDays}
                  onChange={e => setGrantDays(Math.max(1, Math.min(3650, parseInt(e.target.value || '0', 10) || 1)))}
                  className={`${inputCls} w-32`} />
              </label>
              {grantEndPreview && (
                <span className="text-xs text-slate-400 pb-2">Ends <span className="text-slate-200">{grantEndPreview}</span></span>
              )}
            </div>
          )}

          <label className="block mt-4 max-w-xl">
            <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Internal note (optional)</span>
            <input value={planNote} onChange={e => setPlanNote(e.target.value)} placeholder="e.g. Managed launch bonus" className={inputCls} />
          </label>

          <label className="flex items-center gap-2 mt-4 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={notifyClient} onChange={e => setNotifyClient(e.target.checked)} className="accent-violet-500 w-4 h-4" />
            Notify the client (dashboard banner + email)
          </label>

          {notifyClient && (
            <label className="block mt-3 max-w-xl">
              <span className="block text-[10px] uppercase tracking-wide text-slate-500 mb-1">Extra line in the message (optional)</span>
              <textarea rows={2} value={planMessage} onChange={e => setPlanMessage(e.target.value)}
                placeholder="e.g. Thanks for being an early supporter — enjoy Managed on us." className={inputCls} />
            </label>
          )}

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <button onClick={savePlan} disabled={planSaving} className={primaryBtn}>
              {planSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {grantType === 'manual' ? 'Apply plan' : grantType === 'trial' ? 'Grant trial' : 'Grant complimentary'}
            </button>
            {planMsg && <span className={`text-xs ${planMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{planMsg.text}</span>}
          </div>

          {/* audit trail */}
          {events.length > 0 && (
            <div className="mt-6 pt-5 border-t border-dark-700">
              <h3 className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Recent changes</h3>
              <ul className="space-y-1.5">
                {events.map(ev => (
                  <li key={ev.id} className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500">{fmtDateStr(ev.created_at)}</span>
                    <span className="text-slate-300">
                      {ev.from_plan ? `${PLAN_LABELS[ev.from_plan as Plan] ?? ev.from_plan} → ` : ''}
                      {PLAN_LABELS[ev.to_plan as Plan] ?? ev.to_plan ?? '—'}
                    </span>
                    <span className="text-slate-600">· {ev.type.replace(/_/g, ' ')}</span>
                    {ev.meta?.grant_until && <span className="text-amber-400/80">until {fmtDateStr(ev.meta.grant_until)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Change email */}
      <div className="bg-dark-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2"><Mail size={15} className="text-slate-500" /> Change email</h2>
        <p className="text-xs text-slate-500 mb-4">We&apos;ll email both your old and new address to confirm the change.</p>
        <div className="space-y-3 max-w-sm">
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email address"
            aria-label="New email address" className={inputCls} />
          <div className="flex items-center gap-3">
            <button onClick={changeEmail} disabled={emailSaving || !newEmail} className={primaryBtn}>
              {emailSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Update email
            </button>
            {emailMsg && <span className={`text-xs ${emailMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{emailMsg.text}</span>}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-dark-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2"><KeyRound size={15} className="text-slate-500" /> Change password</h2>
        <p className="text-xs text-slate-500 mb-4">For your security, confirm your current password, then a code we email you.</p>
        <div className="space-y-3 max-w-sm">
          {pwStage === 'form' ? (
            <>
              <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Current password"
                aria-label="Current password" className={inputCls} />
              <input type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="New password"
                aria-label="New password" className={inputCls} />
              <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Confirm new password"
                aria-label="Confirm new password" onKeyDown={e => e.key === 'Enter' && startPasswordChange()} className={inputCls} />
              <div className="flex items-center gap-3">
                <button onClick={startPasswordChange} disabled={pwSaving || !oldPw || !pw1 || !pw2} className={primaryBtn}>
                  {pwSaving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Continue
                </button>
                {pwMsg && <span className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</span>}
              </div>
            </>
          ) : (
            <>
              <input value={pwCode} onChange={e => setPwCode(e.target.value)} placeholder="6-digit code from your email"
                aria-label="Email confirmation code" onKeyDown={e => e.key === 'Enter' && confirmPasswordChange()} className={inputCls} />
              <div className="flex items-center gap-3">
                <button onClick={confirmPasswordChange} disabled={pwSaving || !pwCode} className={primaryBtn}>
                  {pwSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirm new password
                </button>
                <button onClick={() => { setPwStage('form'); setPwMsg(null); setPwCode('') }}
                  className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
              {pwMsg && <span className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwMsg.text}</span>}
            </>
          )}
        </div>
      </div>

      {/* Danger zone (admin) — delete the whole account + its login user(s) */}
      {isAdmin && (
        <div className="bg-dark-800 rounded-xl p-6 mt-6 border border-red-500/20">
          <h2 className="text-sm font-semibold text-red-300 mb-1 flex items-center gap-2">
            <Trash2 size={15} /> Delete account
            <span className="text-[10px] font-normal uppercase tracking-wide text-slate-500 border border-dark-600 rounded px-1.5 py-0.5">Admin</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4 max-w-xl">
            Permanently deletes <span className="text-slate-300">{brandName}</span>, all of its data
            (prompts, results, competitors, recommendations, social posts, notifications) and its
            login user(s). This cannot be undone. Blocked if an admin user is attached.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              value={delConfirm}
              onChange={e => setDelConfirm(e.target.value)}
              placeholder={`Type "${activeClient?.slug ?? ''}" to confirm`}
              aria-label="Type the account slug to confirm deletion"
              autoComplete="off"
              className={inputCls}
            />
            <button
              onClick={deleteAccount}
              disabled={deleting || !activeClient?.slug || delConfirm.trim() !== activeClient.slug}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/90 text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
            </button>
          </div>
          {delMsg && <p className={`text-xs mt-3 ${delMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{delMsg.text}</p>}
        </div>
      )}
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
