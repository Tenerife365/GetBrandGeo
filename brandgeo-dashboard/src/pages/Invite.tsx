/**
 * Invite: public landing page for the 7 day invite email (spec
 * docs/arch/invite-link-7-days.md, sections 3 and 6.5).
 *
 * The email links to /invite#t=<token>. Opening the page makes NO function
 * call: it reads the token from the fragment, strips the address bar and shows
 * one button, so a mail scanner that fetches the page spends nothing. Pressing
 * Continue asks invite-redeem for a fresh Supabase token and hands it to the
 * existing /reset-password form, which verifies it only when a password is saved.
 *
 * The token is held in component state only: never storage, never a log line,
 * never an analytics or error-report call.
 *
 * Every English literal below is marked "copy: pending bg-copy".
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { isDemoMode } from '../lib/supabase'
import BrandGeoMark from '../components/BrandGeoLogo'
import { parseInviteToken } from '../lib/inviteLink'

const REDEEM_URL = '/.netlify/functions/invite-redeem'

// Unauthenticated shell, same reasoning as ResetPassword.tsx: "/" is gated, so
// the wordmark links to the marketing site.
function BrandGeoLogo() {
  return <BrandGeoMark size="xl" href="https://getbrandgeo.com" ariaLabel="BrandGEO: go to getbrandgeo.com" />
}

type Stage = 'ready' | 'working' | 'invalid' | 'expired' | 'replaced' | 'used' | 'error'

// Dead-end copy per stage: heading and body (C-I2 to C-I5).
// copy: pending bg-copy
const DEAD_END: Record<'invalid' | 'expired' | 'replaced' | 'used' | 'error', { heading: string; body: string }> = {
  invalid: {
    heading: 'We could not open this invite',
    body: 'The link may be incomplete or no longer active. Ask the person who invited you to send a new one, or sign in if you already have a password.',
  },
  expired: {
    heading: 'This invite has expired',
    body: 'Invite links work for 7 days. Ask the person who invited you to send a new one.',
  },
  replaced: {
    heading: 'A newer invite was sent',
    body: 'Please use the link in the most recent invite email.',
  },
  used: {
    heading: 'This invite was already used',
    body: 'Sign in with your email and password. If you never chose a password, use Forgot your password.',
  },
  // The spec gives no copy for the one case that lands here (the server answered
  // with a token type the page refuses), so it reuses the C-I2 heading and the C-I6 sentence.
  error: {
    heading: 'We could not open this invite',
    body: 'Something went wrong. Please try again.',
  },
}

const MSG_RATE_LIMITED = 'Too many attempts. Please wait a few minutes and try again.' // copy: pending bg-copy
const MSG_GENERIC = 'Something went wrong. Please try again.' // copy: pending bg-copy

// Removes the query and fragment so a reload or a shared screenshot never
// carries the token again.
function stripAddressBar() {
  try {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  } catch {
    // Some embedded browsers refuse replaceState; the page still works.
  }
}

// Loads the set-password chunk ahead of the hand-off, so no request is made
// while the minted token sits in the address bar.
function loadResetPasswordChunk(): Promise<unknown> {
  return import('./ResetPassword')
}

export default function Invite() {
  const navigate = useNavigate()
  // Read once, before anything strips the address bar.
  const [token] = useState<string | null>(() => parseInviteToken(window.location.href))
  const [stage, setStage] = useState<Stage>(() => (token || isDemoMode ? 'ready' : 'invalid'))
  const [error, setError] = useState('')

  const mountedRef = useRef(true)
  const busyRef = useRef(false)
  const prefetchRef = useRef<Promise<unknown> | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // The stage the heading was last focused for. Compared instead of a
  // first-render flag, which React StrictMode's double effect run would spend.
  const focusedStageRef = useRef<Stage>(stage)

  useEffect(() => {
    document.title = 'Set up your login · BrandGEO' // copy: pending bg-copy
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    stripAddressBar()
    if (!isDemoMode && prefetchRef.current === null) {
      // A failed prefetch is retried at Continue; nothing is shown for it here.
      const p = loadResetPasswordChunk()
      p.then(m => { if (!m) prefetchRef.current = null }, () => { prefetchRef.current = null })
      prefetchRef.current = p
    }
    return () => { mountedRef.current = false }
  }, [])

  // Announce each new state by moving focus to its heading, except on load.
  useEffect(() => {
    if (focusedStageRef.current === stage) return
    focusedStageRef.current = stage
    headingRef.current?.focus()
  }, [stage])

  const handleContinue = async () => {
    if (busyRef.current) return
    if (isDemoMode) {
      navigate('/reset-password', { replace: true })
      return
    }
    if (!token) { setStage('invalid'); return }
    busyRef.current = true
    setError('')
    setStage('working')

    const fail = (next: Stage, message = '') => {
      busyRef.current = false
      if (!mountedRef.current) return
      setError(message)
      setStage(next)
    }

    let status = 0
    let result: Record<string, unknown> | null = null
    try {
      const res = await fetch(REDEEM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      status = res.status
      try {
        const parsed: unknown = JSON.parse(await res.text())
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) result = parsed as Record<string, unknown>
      } catch {
        result = null
      }
    } catch {
      fail('ready', MSG_GENERIC)
      return
    }
    if (!mountedRef.current) { busyRef.current = false; return }

    if (status === 200 && result && result.ok === true) {
      const hash = result.token_hash
      const type = result.type
      // Only an invite or signup token may be handed to the password form.
      if (typeof hash !== 'string' || !hash || (type !== 'invite' && type !== 'signup')) {
        fail('error')
        return
      }
      // Wait for the chunk so no request is made while the token is in the address bar.
      // An undefined module counts as a failure: a preload handler may resolve the
      // import with nothing, and the page must never navigate before the chunk is there.
      try {
        const pending = prefetchRef.current ?? loadResetPasswordChunk()
        let mod: unknown
        try {
          mod = await pending
        } catch {
          mod = undefined
        }
        if (!mod) mod = await loadResetPasswordChunk()
        if (!mod) {
          fail('ready', MSG_GENERIC)
          return
        }
      } catch {
        fail('ready', MSG_GENERIC)
        return
      }
      if (!mountedRef.current) { busyRef.current = false; return }
      busyRef.current = false
      navigate('/reset-password?token_hash=' + encodeURIComponent(hash) + '&type=' + type, { replace: true })
      return
    }

    const code = result && typeof result.code === 'string' ? result.code : ''
    if (status === 410) {
      if (code === 'expired') fail('expired')
      else if (code === 'replaced') fail('replaced')
      else if (code === 'used') fail('used')
      else fail('invalid')
      return
    }
    if (status === 400 || status === 404) { fail('invalid'); return }
    if (status === 429) { fail('ready', MSG_RATE_LIMITED); return }
    // 503, a non-JSON answer (a gateway timeout) or anything unexpected: keep the
    // token and leave a working button.
    fail('ready', MSG_GENERIC)
  }

  const h1Class = 'text-lg font-semibold text-white mb-1 outline-none'
  const primaryBtn = 'w-full bg-accent-strong hover:bg-accent-strong-hover disabled:opacity-60 disabled:cursor-not-allowed text-on-accent font-medium py-2.5 max-md:min-h-[44px] rounded-lg text-sm transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
  const textLink = 'inline-flex items-center max-md:min-h-[44px] text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors'

  // C-I7: under every dead-end state. The "used" state already has a Sign in
  // button, so its link row carries only the second link.
  const deadEndLinks = (withSignIn: boolean) => (
    <p className="text-center text-xs text-slate-400 mt-4 flex flex-wrap items-center justify-center gap-x-4">
      {/* copy: pending bg-copy */}
      {withSignIn && <Link to="/login" className={textLink}>Sign in</Link>}
      {/* copy: pending bg-copy */}
      <Link to="/reset-password" className={textLink}>Forgot your password?</Link>
    </p>
  )

  let body: React.ReactNode
  if (stage === 'ready' || stage === 'working') {
    const working = stage === 'working'
    body = (
      <div>
        {/* copy: pending bg-copy */}
        <h1 ref={headingRef} tabIndex={-1} className={h1Class}>Set up your BrandGEO login</h1>
        {/* copy: pending bg-copy */}
        <p className="text-sm text-slate-400 mb-6">Continue to choose your password.</p>
        {error && (
          <div role="alert" className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={14} aria-hidden="true" /> {error}
          </div>
        )}
        {/* copy: pending bg-copy */}
        <span role="status" className="sr-only">{working ? 'Opening...' : ''}</span>
        <button type="button" onClick={() => { void handleContinue() }} disabled={working} aria-busy={working || undefined} className={primaryBtn}>
          {working && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {/* copy: pending bg-copy */}
          {working ? 'Opening...' : 'Continue'}
        </button>
      </div>
    )
  } else {
    const copy = DEAD_END[stage]
    body = (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className={h1Class}>{copy.heading}</h1>
        <p className="text-sm text-slate-400 mb-6">{copy.body}</p>
        {stage === 'used' && (
          // copy: pending bg-copy
          <Link to="/login" className={primaryBtn}>Sign in</Link>
        )}
        {deadEndLinks(stage !== 'used')}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-card p-card-feature">
          {body}
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">
          © BrandGEO ·{' '}
          <a href="https://getbrandgeo.com/terms.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-slate-500 hover:text-slate-400">Terms</a>
          {' '}·{' '}
          <a href="https://getbrandgeo.com/privacy.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-slate-500 hover:text-slate-400">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
