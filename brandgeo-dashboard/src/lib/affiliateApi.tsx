/**
 * affiliateApi.ts: the one fetch helper the affiliate pages share. Same shape
 * as the local authedPost() in Prospects.tsx: the Supabase session token goes
 * in Authorization, the body is JSON, the response is parsed leniently so a
 * non-JSON 5xx still yields a status the caller can act on.
 */
import { supabase } from './supabase'

export interface ApiResult<T> { status: number; data: T | null; error: string | null }

export async function affiliatePost<T>(fn: 'affiliate-admin' | 'affiliate-portal', body: Record<string, unknown>, { auth = true }: { auth?: boolean } = {}): Promise<ApiResult<T>> {
  let token = ''
  if (auth) {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token ?? ''
  }
  const res = await fetch(`/.netlify/functions/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    const text = await res.text()
    return { status: res.status, data: (text as unknown) as T, error: null }
  }
  const data = await res.json().catch(() => null)
  const error = !res.ok ? (data && typeof data.error === 'string' ? data.error : `Request failed (${res.status})`) : null
  return { status: res.status, data, error }
}

/** Trigger a browser download for CSV text returned by an export action. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return withTime
    ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function money(amount: string | number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined || amount === '') return ''
  return `${currency} ${amount}`
}

/** Copy to clipboard with a graceful fallback for insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export const STATUS_TONE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  payable: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  invited: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
  draft: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  paused: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  suspended: 'bg-red-500/15 text-red-300 border-red-500/30',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  reversed: 'bg-red-500/15 text-red-300 border-red-500/30',
  refunded: 'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  archived: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export function StatusPill({ value }: { value: string }) {
  const tone = STATUS_TONE[value] || 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tone}`}>{value.replace('_', ' ')}</span>
}
