/**
 * PromotionsPanel.tsx — admin Promotions panel (PRICING-STRATEGY-2026-07.md §8,
 * §12 T2b). Platform-wide, not scoped to the currently-active client — a promo
 * applies across signups/renewals for whichever plans it targets.
 *
 * "reusing the existing plan-management UI" (§8) — same visual language as
 * Account.tsx's "Manage plan" admin section (card, header, admin badge, form
 * + list layout).
 *
 * BACKEND DEPENDENCY (T3, not yet built): this calls `promotions-admin.js`
 * (list/create/toggle) and expects a `promotions` table — neither exists yet.
 * Until T3 lands, every call 404s and the panel shows a clear "not available
 * yet" state instead of a raw fetch error, so T2b ships without blocking on
 * T3's Stripe coupon wiring. Wire-up contract for T3:
 *   POST /.netlify/functions/promotions-admin  { action: 'list' }
 *     -> { promotions: Promotion[] }
 *   POST /.netlify/functions/promotions-admin  { action: 'create', ...PromotionInput }
 *     -> { promotion: Promotion } | { error }
 *   POST /.netlify/functions/promotions-admin  { action: 'toggle', id, active }
 *     -> { ok: true } | { error }
 */
import { useEffect, useState } from 'react'
import { Percent, Loader2, Check, Ban, Gift } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PLAN_LABELS, PLAN_ORDER, type Plan } from '../lib/planConfig'

interface Promotion {
  id: number
  label: string
  code: string
  discount_type: 'percent' | 'fixed'
  value: number
  plans: Plan[]
  starts_at: string | null
  ends_at: string | null
  active: boolean
}

const card = 'bg-dark-800 rounded-xl p-6 mb-6'
const inputCls = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500'
const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

async function authedPost<T>(fn: string, body: unknown): Promise<{ status: number; data: T | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch(`/.netlify/functions/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

export default function PromotionsPanel() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  // Distinguishes "no promos yet" (backend live, empty list) from "backend not
  // built yet" (T3 not shipped) — 404 is the only signal we have for the latter
  // until promotions-admin.js exists.
  const [unavailable, setUnavailable] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState(10)
  const [plans, setPlans] = useState<Set<Plan>>(new Set())
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { status, data } = await authedPost<{ promotions?: Promotion[]; error?: string }>('promotions-admin', { action: 'list' })
    if (status === 404) { setUnavailable(true); setLoading(false); return }
    setUnavailable(false)
    setPromotions(data?.promotions ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const togglePlan = (p: Plan) => {
    setPlans(prev => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p); else next.add(p)
      return next
    })
  }

  const resetForm = () => {
    setLabel(''); setCode(''); setDiscountType('percent'); setValue(10)
    setPlans(new Set()); setStartsAt(''); setEndsAt(''); setShowForm(false)
  }

  const create = async () => {
    setMsg(null)
    if (!label.trim() || !code.trim()) { setMsg({ ok: false, text: 'Label and code are required.' }); return }
    if (plans.size === 0) { setMsg({ ok: false, text: 'Pick at least one plan this promo applies to.' }); return }
    setSaving(true)
    const { status, data } = await authedPost<{ promotion?: Promotion; error?: string }>('promotions-admin', {
      action: 'create',
      label: label.trim(),
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      value,
      plans: [...plans],
      starts_at: startsAt || null,
      ends_at: endsAt || null,
    })
    setSaving(false)
    if (status === 404) { setUnavailable(true); return }
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    setMsg({ ok: true, text: `Promotion "${label}" created.` })
    resetForm()
    load()
  }

  const toggleActive = async (promo: Promotion) => {
    const { status, data } = await authedPost<{ ok?: boolean; error?: string }>('promotions-admin', {
      action: 'toggle', id: promo.id, active: !promo.active,
    })
    if (status === 404) { setUnavailable(true); return }
    if (data?.error) { setMsg({ ok: false, text: data.error }); return }
    setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, active: !p.active } : p))
  }

  const formatValue = (p: Promotion) => p.discount_type === 'percent' ? `${p.value}% off` : `€${p.value.toFixed(2)} off`

  return (
    <div className={card}>
      <h2 className="text-sm font-semibold text-slate-300 mb-1 flex items-center gap-2">
        <Gift size={15} className="text-brand-400" /> Promotions
        <span className="text-[10px] font-normal uppercase tracking-wide text-slate-500 border border-dark-600 rounded px-1.5 py-0.5">Admin</span>
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Platform-wide discount codes — apply to signups and renewals for the plans you pick. Propagates to the
        marketing site's pricing page automatically (PRICING-STRATEGY-2026-07.md §8).
      </p>

      {unavailable ? (
        <p className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
          Promotions backend isn't deployed yet (T3 — the <code className="text-amber-300">promotions</code> table +
          Stripe coupon wiring). This panel is ready; it'll start working the moment that ships.
        </p>
      ) : loading ? (
        <p className="text-xs text-slate-500">Loading promotions…</p>
      ) : (
        <>
          {promotions.length === 0 ? (
            <p className="text-xs text-slate-500 mb-4">No promotions yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {promotions.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-dark-700/40 border border-dark-700 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-200 font-medium truncate">{p.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.code}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatValue(p)} · {p.plans.map(pl => PLAN_LABELS[pl]).join(', ')}
                      {p.ends_at ? ` · ends ${new Date(p.ends_at).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                      p.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-dark-700 text-slate-500 border-dark-600 hover:text-slate-300'
                    }`}
                  >
                    {p.active ? <><Check size={12} /> Active</> : <><Ban size={12} /> Inactive</>}
                  </button>
                </div>
              ))}
            </div>
          )}
          {msg && <p className={`text-xs mb-3 ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>}

          {!showForm ? (
            <button onClick={() => setShowForm(true)} className={primaryBtn}>
              <Percent size={15} /> New promotion
            </button>
          ) : (
            <div className="border border-dark-700 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Label</label>
                  <input className={inputCls} value={label} onChange={e => setLabel(e.target.value)} placeholder="Launch week 20% off" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Code</label>
                  <input className={inputCls} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="LAUNCH20" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Type</label>
                  <select className={inputCls} value={discountType} onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}>
                    <option value="percent">Percent off</option>
                    <option value="fixed">Fixed € off</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Value</label>
                  <input type="number" className={inputCls} value={value} onChange={e => setValue(Number(e.target.value))} min={0} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 block">Ends</label>
                  <input type="date" className={inputCls} value={endsAt} onChange={e => setEndsAt(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5 block">Applies to</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLAN_ORDER.filter(p => p !== 'pro').map(p => (
                    <button
                      key={p}
                      onClick={() => togglePlan(p)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        plans.has(p)
                          ? 'bg-brand-500/15 text-brand-300 border-brand-500/40'
                          : 'bg-dark-700 text-slate-400 border-dark-600 hover:text-slate-200'
                      }`}
                    >
                      {PLAN_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={create} disabled={saving} className={primaryBtn}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Create
                </button>
                <button onClick={resetForm} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
