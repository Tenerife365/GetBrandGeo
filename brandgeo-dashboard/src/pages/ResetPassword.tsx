import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import BrandGeoMark from '../components/BrandGeoLogo'
import { humanizeError } from '../lib/errors'
import { parseAuthLink, isExpiredLinkCode } from '../lib/authLinkState'

// Same literal as the "Forgot password?" call in Login.tsx.
const RESET_REDIRECT = 'https://app.getbrandgeo.com/reset-password'

// Unauthenticated shell, same reasoning as Login.tsx: "/" is gated and would
// bounce straight back to sign-in, so the wordmark links to the marketing site.
function BrandGeoLogo() {
  return <BrandGeoMark size="xl" href="https://getbrandgeo.com" ariaLabel="BrandGEO: go to getbrandgeo.com" />
}

type Stage = 'checking' | 'form' | 'expired' | 'sent' | 'done'
// 'expired': the link itself was refused as expired. 'generic': any other
// reason (no session, another error code), where we cannot say why.
type ExpiredReason = 'expired' | 'generic'

// A transport failure leaves the single-use token unspent, so the person can
// retry on the same form. A 4xx answer from the auth server means the token
// was refused and a new link is the only way forward.
function isTransportFailure(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return true
  const e = err as { status?: unknown; name?: unknown; message?: unknown }
  const name = typeof e.name === 'string' ? e.name.toLowerCase() : ''
  const message = typeof e.message === 'string' ? e.message.toLowerCase() : ''
  if (name.includes('fetch') || message.includes('failed to fetch') || message.includes('load failed')) return true
  const status = e.status
  if (typeof status !== 'number') return true
  // 429 is the auth server's rate limit: the token was not looked at, so it is
  // still unspent and the person can retry from the same form.
  return status === 0 || status === 429 || status >= 500
}

function isRateLimited(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { status?: unknown }).status === 429
}

// A password the auth server refused (project password rules, or the same
// password as before). Its sentence names what to change, so it is shown as
// written instead of the generic fallback, which would invite the same retry.
function refusedPasswordMessage(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null
  const e = err as { name?: unknown; code?: unknown; message?: unknown }
  const refused = e.name === 'AuthWeakPasswordError' || e.code === 'weak_password' || e.code === 'same_password'
  if (!refused || typeof e.message !== 'string' || !e.message.trim()) return null
  return e.message.trim().slice(0, 300)
}

// Removes the query and fragment so a reload or a shared screenshot never
// carries the link parameters again.
function stripAddressBar() {
  try {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  } catch {
    // Some embedded browsers refuse replaceState; the page still works.
  }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  // Read once, before anything strips the address bar.
  const [link] = useState(() => parseAuthLink(window.location.href))
  const [stage, setStage] = useState<Stage>(() =>
    link.kind === 'error' ? 'expired' : link.kind === 'token' ? 'form' : 'checking'
  )
  const [expiredReason, setExpiredReason] = useState<ExpiredReason>(() =>
    link.kind === 'error' && isExpiredLinkCode(link.code) ? 'expired' : 'generic'
  )
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const mountedRef = useRef(true)
  const stageRef = useRef<Stage>(stage)
  // True only when 'expired' came from "no session found" (case d), the one
  // expired state a later auth event is allowed to lift.
  const noSessionRef = useRef(false)
  const verifiedRef = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // The stage the heading was last focused for. Compared instead of a
  // first-render flag, which React StrictMode's double effect run would spend.
  const focusedStageRef = useRef<Stage>(stage)

  const go = (next: Stage) => {
    stageRef.current = next
    if (next !== 'expired') noSessionRef.current = false
    setError('')
    setStage(next)
  }

  useEffect(() => {
    document.title = 'Set your password · BrandGEO'
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (link.kind === 'error' || link.kind === 'token') {
      // A failed link never falls through to the form of whatever session is
      // in this browser, and a token link needs no network call on load.
      stripAddressBar()
    } else {
      supabase.auth.getSession()
        .then(({ data }) => {
          if (!mountedRef.current || stageRef.current !== 'checking') return
          if (data.session) {
            go('form')
          } else {
            setExpiredReason('generic')
            go('expired')
            noSessionRef.current = true
          }
        })
        .catch(() => {
          if (!mountedRef.current || stageRef.current !== 'checking') return
          setExpiredReason('generic')
          go('expired')
          noSessionRef.current = true
        })
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current || !session) return
      const current = stageRef.current
      if (current === 'checking' || (current === 'expired' && noSessionRef.current)) {
        go('form')
      }
    })

    return () => {
      mountedRef.current = false
      sub.subscription.unsubscribe()
    }
    // Runs once: link is read once on mount and never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Announce each new state by moving focus to its heading, except on load.
  useEffect(() => {
    if (focusedStageRef.current === stage) return
    focusedStageRef.current = stage
    headingRef.current?.focus()
  }, [stage])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    // Validate before any network call: a typo must never spend the token.
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')

    if (isDemoMode) { go('done'); return }

    setBusy(true)
    if (link.kind === 'token' && !verifiedRef.current) {
      let verifyErr: unknown = null
      try {
        const { error: err } = await supabase.auth.verifyOtp({ token_hash: link.tokenHash, type: link.type })
        verifyErr = err
      } catch (thrown) {
        verifyErr = thrown ?? new Error('verify failed')
      }
      if (!mountedRef.current) return
      if (verifyErr) {
        setBusy(false)
        if (isRateLimited(verifyErr)) {
          setError('Too many attempts. Please wait a minute and try again.')
        } else if (isTransportFailure(verifyErr)) {
          setError(humanizeError(verifyErr, 'Could not confirm your link. Please try again.'))
        } else {
          setExpiredReason('expired')
          go('expired')
        }
        return
      }
      verifiedRef.current = true
    }

    let updateErr: unknown = null
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      updateErr = err
    } catch (thrown) {
      updateErr = thrown ?? new Error('update failed')
    }
    if (!mountedRef.current) return
    setBusy(false)
    if (updateErr) setError(refusedPasswordMessage(updateErr) ?? humanizeError(updateErr, 'Could not update your password. Please try again.'))
    else go('done')
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    const address = email.trim().toLowerCase()
    if (!address) return
    setEmail(address)
    setError('')

    if (isDemoMode) { go('sent'); return }

    setBusy(true)
    let sendErr: unknown = null
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: RESET_REDIRECT })
      sendErr = err
    } catch (thrown) {
      sendErr = thrown ?? new Error('send failed')
    }
    if (!mountedRef.current) return
    setBusy(false)
    if (sendErr) setError(humanizeError(sendErr, 'Could not send the link. Please wait a minute and try again.'))
    else go('sent')
  }

  const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm max-md:text-base text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition disabled:opacity-50'
  const primaryBtn = 'w-full bg-accent-strong hover:bg-accent-strong-hover disabled:opacity-60 disabled:cursor-not-allowed text-on-accent font-medium py-2.5 max-md:min-h-[44px] rounded-lg text-sm transition-colors flex items-center justify-center gap-2'
  const h1Class = 'text-lg font-semibold text-white mb-1 outline-none'
  const textLink = 'inline-flex items-center max-md:min-h-[44px] text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors'

  const errorBlock = error ? (
    <div role="alert" className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
      <AlertCircle size={14} aria-hidden="true" /> {error}
    </div>
  ) : null

  const backToSignIn = (
    <p className="text-center text-xs text-slate-400 mt-4">
      Already have a password?{' '}<Link to="/login" className={textLink}>Sign in</Link>
    </p>
  )

  let body: React.ReactNode
  if (stage === 'done') {
    body = (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} aria-hidden="true" />
        <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-white mb-2 outline-none">Password saved</h1>
        <p className="text-sm text-slate-400 mb-6">Next, tell us what to track.</p>
        <button onClick={() => navigate('/', { replace: true })} className="w-full bg-accent-strong hover:bg-accent-strong-hover text-on-accent font-medium py-2.5 max-md:min-h-[44px] rounded-lg text-sm transition-colors">Continue</button>
      </div>
    )
  } else if (stage === 'checking') {
    body = (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className={h1Class}>Set your password</h1>
        <p role="status" className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking your link...
        </p>
      </div>
    )
  } else if (stage === 'form') {
    body = (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className={h1Class}>Set your password</h1>
        <p className="text-sm text-slate-400 mb-6">Choose a password for your BrandGEO account. Use at least 8 characters.</p>
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <div>
            <label htmlFor="reset-new-password" className="block text-xs text-slate-400 mb-1.5 font-medium">New password</label>
            <input id="reset-new-password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" disabled={busy} className={ic} />
          </div>
          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs text-slate-400 mb-1.5 font-medium">Confirm password</label>
            <input id="reset-confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" disabled={busy} className={ic} />
          </div>
          {errorBlock}
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? 'Saving...' : 'Save password'}
          </button>
        </form>
      </div>
    )
  } else if (stage === 'expired') {
    const isExpired = expiredReason === 'expired'
    body = (
      <div>
        <h1 ref={headingRef} tabIndex={-1} className={h1Class}>
          {isExpired ? 'This link has expired' : 'We could not open this link'}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {isExpired
            ? 'The links in our emails work once and for a limited time. Enter your email address and we will send you a new one.'
            : 'It may have been used already, or opened in a different browser. Enter your email address and we will send you a new one.'}
        </p>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-xs text-slate-400 mb-1.5 font-medium">Email address</label>
            <input id="reset-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" disabled={busy} className={ic} />
          </div>
          {errorBlock}
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? 'Sending...' : 'Send me a new link'}
          </button>
        </form>
        {backToSignIn}
      </div>
    )
  } else {
    body = (
      <div className="text-center">
        <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} aria-hidden="true" />
        <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-white mb-2 outline-none">Check your inbox</h1>
        <p className="text-sm text-slate-400 mb-4">
          If <strong className="text-white font-medium break-all">{email}</strong> has a BrandGEO account, a new link is on its way. It can take a minute or two. Please use the newest email we sent you.
        </p>
        <p className="text-xs text-slate-400">
          Nothing after a few minutes? Check your spam folder, or{' '}
          <button type="button" onClick={() => go('expired')} className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors">try again</button>.
        </p>
        {backToSignIn}
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
