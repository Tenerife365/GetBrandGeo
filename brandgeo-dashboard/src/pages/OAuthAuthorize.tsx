import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { PLAN_LABELS } from '../lib/planConfig'
import { loginUrlWithNext, clearOauthNext } from '../lib/oauthNext'
import {
  CONSENT, ERROR_BUTTONS, SUPPORT_EMAIL, GENERIC_SUPPORT_BEFORE, GENERIC_SUPPORT_AFTER,
  errorCopy,
} from '../lib/mcpOauthCopy'
import type { ErrorKey } from '../lib/mcpOauthCopy'
import BrandGeoMark from '../components/BrandGeoLogo'
import Skeleton from '../components/Skeleton'

/**
 * OAuth consent page for MCP stage 3 (docs/arch/mcp-stage3-oauth.md 4.2 and 11.1,
 * docs/design/mcp-stage3-oauth-2026-11-06.md section 3). Outside Layout,
 * PrivateRoute and OnboardGate: it does its own session check. The request_id the
 * server returns lives in component memory only. The only place this page ever
 * navigates away to is a redirect string the server returned.
 */

const PARAM_KEYS = [
  'response_type', 'client_id', 'redirect_uri', 'scope', 'state',
  'code_challenge', 'code_challenge_method', 'resource',
] as const

interface CheckOk {
  ok: true
  request_id: string
  client_name: string
  redirect_host: string
  loopback: boolean
  brand_name: string
  write_requested: boolean
}

interface ApiReply {
  ok?: boolean
  error?: string
  redirect?: string
  request_id?: string
  client_name?: string
  redirect_host?: string
  loopback?: boolean
  brand_name?: string
  write_requested?: boolean
  current_plan?: string
}

type Phase = 'loading' | 'ready' | 'deciding' | 'done' | 'error'

interface ErrState { key: ErrorKey; from: 'check' | 'decide'; planName: string }

const primaryBtn =
  'w-full min-h-[44px] bg-accent-strong hover:bg-accent-strong-hover disabled:opacity-60 disabled:cursor-not-allowed text-on-accent font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2'
const ghostBtn =
  'w-full min-h-[44px] rounded-lg text-sm font-medium bg-dark-700 hover:bg-dark-600 text-slate-200 border border-dark-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'

function errorKeyFor(code: string | undefined): ErrorKey {
  switch (code) {
    case 'invalid_client': return 'unknown_client'
    case 'client_metadata_unavailable': return 'metadata_unavailable'
    case 'invalid_redirect_uri': return 'redirect_not_allowed'
    case 'admin_account': return 'admin_refused'
    case 'no_account': return 'no_account'
    case 'plan_required': return 'plan_below_radar'
    case 'account_unavailable': return 'research_account'
    case 'request_expired': return 'request_expired'
    case 'invalid_request': return 'invalid_request'
    default: return 'generic'
  }
}

function planLabel(plan: string | undefined): string {
  if (plan && Object.prototype.hasOwnProperty.call(PLAN_LABELS, plan)) {
    return (PLAN_LABELS as Record<string, string>)[plan]
  }
  return PLAN_LABELS.free
}

async function postAuthorize(body: Record<string, unknown>, token: string): Promise<{ status: number; data: ApiReply | null }> {
  const res = await fetch('/.netlify/functions/oauth-authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as ApiReply | null
  return { status: res.status, data }
}

/**
 * Navigates only to a redirect the server returned AND that has a safe form:
 * https, or the http loopback form Claude Code uses (review L2). Anything else
 * (javascript:, data:, a plain http host) is dropped and the page shows the
 * generic failure instead.
 */
function isSafeClientRedirect(target: string): boolean {
  try {
    const u = new URL(target)
    if (u.protocol === 'https:') return !u.username && !u.password
    return u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.pathname === '/callback'
  } catch {
    return false
  }
}

function goToClient(target: string): void {
  if (isSafeClientRedirect(target)) window.location.assign(target)
  else throw new Error('unsafe redirect refused')
}

export default function OAuthAuthorize() {
  const navigate = useNavigate()
  const { activeClient } = useClient()
  const [phase, setPhase] = useState<Phase>('loading')
  const [req, setReq] = useState<CheckOk | null>(null)
  const [err, setErr] = useState<ErrState | null>(null)
  const [writeTicked, setWriteTicked] = useState(false)
  const [pressed, setPressed] = useState<'allow' | 'cancel' | null>(null)
  const [announce, setAnnounce] = useState<string>(CONSENT.loading)
  const [sendingTo, setSendingTo] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const started = useRef(false)
  const lastDecide = useRef<{ allow: boolean } | null>(null)

  useEffect(() => {
    document.title = CONSENT.title
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  const goLogin = useCallback(() => {
    navigate(loginUrlWithNext(window.location.pathname + window.location.search), { replace: true })
  }, [navigate])

  const runCheck = useCallback(async () => {
    setPhase('loading'); setErr(null); setAnnounce(CONSENT.loading)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { goLogin(); return }
      const sp = new URLSearchParams(window.location.search)
      const body: Record<string, unknown> = { action: 'check' }
      for (const k of PARAM_KEYS) {
        const v = sp.get(k)
        body[k] = v === null || v === '' ? null : v
      }
      const { status, data } = await postAuthorize(body, session.access_token)
      if (status === 401) { goLogin(); return }
      if (data && data.ok === true && typeof data.request_id === 'string') {
        setReq({
          ok: true,
          request_id: data.request_id,
          client_name: data.client_name || '',
          redirect_host: data.redirect_host || '',
          loopback: !!data.loopback,
          brand_name: data.brand_name || '',
          write_requested: !!data.write_requested,
        })
        setPhase('ready'); setAnnounce('')
        return
      }
      if (data && data.ok === false && typeof data.redirect === 'string') {
        // Redirect proven, failure goes back to the app. Nothing of our own to show.
        goToClient(data.redirect)
        return
      }
      setErr({ key: errorKeyFor(data?.error), from: 'check', planName: planLabel(data?.current_plan) })
      setPhase('error'); setAnnounce('')
    } catch {
      setErr({ key: 'generic', from: 'check', planName: planLabel(undefined) })
      setPhase('error'); setAnnounce('')
    }
  }, [goLogin])

  useEffect(() => {
    if (started.current) return
    started.current = true
    // A Google round trip stashes `next`; being here means it was consumed.
    clearOauthNext()
    runCheck()
  }, [runCheck])

  // Move focus to the heading once, when the card settles into Ready or an error.
  useEffect(() => {
    if (phase === 'ready' || phase === 'error') headingRef.current?.focus()
  }, [phase])

  const decide = useCallback(async (allow: boolean) => {
    if (!req || phase === 'deciding' || phase === 'done') return
    lastDecide.current = { allow }
    setPressed(allow ? 'allow' : 'cancel')
    setPhase('deciding'); setAnnounce(CONSENT.deciding)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { goLogin(); return }
      const { status, data } = await postAuthorize({
        action: 'decide',
        request_id: req.request_id,
        allow,
        write: req.write_requested ? writeTicked : false,
      }, session.access_token)
      if (status === 401) { goLogin(); return }
      if (data && data.ok === true && typeof data.redirect === 'string') {
        const target = req.loopback ? CONSENT.thisComputer : req.redirect_host
        setSendingTo(target)
        setPhase('done'); setAnnounce(CONSENT.sending(target))
        goToClient(data.redirect)
        return
      }
      setErr({ key: errorKeyFor(data?.error), from: 'decide', planName: planLabel(data?.current_plan) })
      setPhase('error'); setAnnounce('')
    } catch {
      setErr({ key: 'generic', from: 'decide', planName: planLabel(undefined) })
      setPhase('error'); setAnnounce('')
    } finally {
      setPressed(null)
    }
  }, [req, phase, writeTicked, goLogin])

  const appName = req?.client_name || CONSENT.appFallback

  const retry = () => {
    if (err?.from === 'decide' && lastDecide.current && req) decide(lastDecide.current.allow)
    else runCheck()
  }

  const signOutAndReturn = async () => {
    try { await supabase.auth.signOut() } catch { /* the login screen will cope */ }
    goLogin()
  }

  const footerLinks = (
    <p className="text-center text-xs text-slate-600 mt-3">
      © BrandGEO ·{' '}
      <a href="https://getbrandgeo.com/terms.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-slate-500 hover:text-slate-400">Terms</a>
      {' '}·{' '}
      <a href="https://getbrandgeo.com/privacy.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-slate-500 hover:text-slate-400">Privacy Policy</a>
    </p>
  )

  let body: React.ReactNode = null

  if (phase === 'loading') {
    body = (
      <div>
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-14 w-full mb-4" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="space-y-2 mb-5">
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>
        <p className="text-xs text-slate-400 text-center mt-4">{CONSENT.loading}</p>
      </div>
    )
  } else if (phase === 'error' && err) {
    const brandName = activeClient?.name || CONSENT.brandFallback
    const copy = errorCopy(err.key, { appName, brandName, planName: err.planName })
    const isOurSide = err.key === 'generic'
    const tile = isOurSide ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-300'
    let action: React.ReactNode
    if (err.key === 'generic' || err.key === 'metadata_unavailable') {
      action = <button type="button" onClick={retry} className={primaryBtn}>{ERROR_BUTTONS.retry}</button>
    } else if (err.key === 'plan_below_radar') {
      action = <Link to="/account" className={primaryBtn}>{ERROR_BUTTONS.plans}</Link>
    } else if (err.key === 'admin_refused') {
      action = <button type="button" onClick={signOutAndReturn} className={ghostBtn}>{ERROR_BUTTONS.signOut}</button>
    } else {
      action = <Link to="/" className={ghostBtn}>{ERROR_BUTTONS.dashboard}</Link>
    }
    body = (
      <div>
        <div className="flex justify-center">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tile}`} aria-hidden="true">
            {isOurSide ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
          </div>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-white text-center mt-4 mb-2 outline-none break-words">{copy.heading}</h1>
        <p className="text-sm text-slate-400 text-center mb-6 break-words">
          {copy.body}
          {isOurSide && (
            <>
              {GENERIC_SUPPORT_BEFORE}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-400 hover:text-brand-300 underline underline-offset-2">{SUPPORT_EMAIL}</a>
              {GENERIC_SUPPORT_AFTER}
            </>
          )}
        </p>
        {action}
      </div>
    )
  } else if (req) {
    const busy = phase === 'deciding'
    body = (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-white mb-2 outline-none break-words">{CONSENT.heading(appName)}</h1>
        <p className="text-sm text-slate-400 mb-3 break-words">{CONSENT.intro(appName, req.brand_name || CONSENT.brandFallback)}</p>
        <div className="rounded-lg bg-dark-700/60 border border-dark-700 px-3 py-2 mb-4">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{CONSENT.accountLabel}</p>
          <p className="text-sm font-medium text-slate-200 break-words">{req.brand_name || CONSENT.brandFallback}</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {req.loopback
            ? CONSENT.redirectLoopback
            : <>{CONSENT.redirectBefore}<span className="font-medium text-slate-200 break-all">{req.redirect_host}</span>{CONSENT.redirectAfter}</>}
        </p>
        {req.loopback && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-slate-300 break-words">{CONSENT.loopbackWarning(appName)}</p>
          </div>
        )}
        <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">{CONSENT.readHeading(appName)}</h2>
        <ul className="space-y-1.5 mb-3">
          {CONSENT.readItems.map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <Check size={14} className="text-brand-300 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 mb-5">{CONSENT.readLimits}</p>

        {phase === 'done' ? (
          <div className="min-h-[100px] flex items-center justify-center gap-2 text-sm text-slate-300 text-center">
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            <span className="break-all">{CONSENT.sending(sendingTo)}</span>
          </div>
        ) : (
          <>
            {req.write_requested && (
              <div className="mb-5 rounded-lg border border-dark-600 bg-dark-700/40 p-3">
                <label htmlFor="oauth-write" className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    id="oauth-write"
                    checked={writeTicked}
                    disabled={busy}
                    aria-disabled={busy}
                    aria-describedby="oauth-write-help"
                    onChange={e => setWriteTicked(e.target.checked)}
                    className="h-5 w-5 mt-0.5 shrink-0 accent-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  />
                  <span className="text-sm font-medium text-slate-200">{CONSENT.writeLabel}</span>
                </label>
                <p id="oauth-write-help" className="text-xs text-slate-400 mt-1 ml-8">{CONSENT.writeHelper}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => decide(true)} disabled={busy} aria-disabled={busy} className={primaryBtn}>
                {pressed === 'allow' && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {CONSENT.allow}
              </button>
              <button type="button" onClick={() => decide(false)} disabled={busy} aria-disabled={busy} className={ghostBtn}>
                {pressed === 'cancel' && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {CONSENT.cancel}
              </button>
            </div>
          </>
        )}
        <p className="text-xs text-slate-500 mt-4 text-center break-words">{CONSENT.footnote(appName)}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8"><BrandGeoMark size="xl" /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-card p-card-feature">
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>
          {body}
        </div>
        {footerLinks}
      </div>
    </div>
  )
}
