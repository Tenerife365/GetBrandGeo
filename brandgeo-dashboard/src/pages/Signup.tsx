import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2, MailCheck, ArrowRight } from 'lucide-react'
import SocialAuthButtons from '../components/SocialAuthButtons'
import BrandGeoMark from '../components/BrandGeoLogo'
import { domainFromQuery, rememberSignupDomain } from '../lib/signupDomain'
import { humanizeError, isCustomerFacingStatus, serverError } from '../lib/errors'

// Unauthenticated shell, same reasoning as Login.tsx: "/" is gated and would
// bounce straight back to sign-in, so the wordmark links to the marketing site.
function BrandGeoLogo() {
  return <BrandGeoMark size="xl" href="https://getbrandgeo.com" ariaLabel="BrandGEO: go to getbrandgeo.com" />
}

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
const bc = 'w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  // Honeypot (SECURITY-AUDIT.md F2): a hidden field a real user never fills.
  const [companyWebsite, setCompanyWebsite] = useState('')

  // The domain the visitor typed into the audit widget on getbrandgeo.com, which
  // site.js forwards as ?domain= (ROADMAP Stream C, C2). Until 2026-07-31 that
  // parameter arrived and was thrown away, so someone who had just audited their
  // own site was asked for it again two screens later.
  //
  // Stored immediately on arrival rather than at submit, because the two ways
  // out of this page both leave it: Google SSO hands off to a provider and comes
  // back on a different route, and the email path goes out through the user's
  // inbox. Neither carries React state or the query string with it.
  const [searchParams] = useSearchParams()
  const signupDomain = domainFromQuery(searchParams.toString())
  useEffect(() => { rememberSignupDomain(signupDomain) }, [signupDomain])

  useEffect(() => {
    document.title = 'Start free · BrandGEO'
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/signup-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          company_website: companyWebsite,   // honeypot — expected to be ''
        }),
      })
      const data = await res.json().catch(() => null)
      // A 4xx body with `error` is copy the API wrote for the customer
      // (invalid address, disposable domain, daily limit); it must reach the
      // screen as written. An auth or server fault is logged and shown as a
      // fixed sentence, the same rule the shell applies to the billing portal.
      if (!res.ok) {
        if (data?.error && isCustomerFacingStatus(res.status)) throw serverError(String(data.error))
        console.error('[Signup] signup-client failed:', res.status, data?.error ?? null)
        throw new Error('Signup failed. Please try again.')
      }
      setDone(true)
    } catch (err: any) {
      setError(humanizeError(err, 'Signup failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmation screen (email path) ──────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
          <div className="bg-dark-800 border border-dark-700 rounded-card p-card-feature">
            <MailCheck className="mx-auto mb-3 text-emerald-400" size={36} />
            <h1 className="text-lg font-semibold text-white mb-2">Check your email</h1>
            <p className="text-sm text-slate-400 mb-2">
              We sent a link to{' '}
              <strong className="text-slate-300">{email}</strong>.<br />
              Click it to set your password, then we'll help you set up what to track.
            </p>
            <p className="text-xs text-slate-600 mt-2">
              Didn't get it? Check spam, or{' '}
              <button
                onClick={() => setDone(false)}
                className="text-brand-400 hover:text-brand-300 transition-colors bg-transparent border-none cursor-pointer text-xs p-0"
              >
                try again
              </button>.
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Already have a password?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Signup screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-card p-card-feature">
          {/* Naming the domain is the whole point of carrying it: it tells a
              visitor arriving from the audit that this is the same journey and
              not a fresh form. Rendered as text by React, and validated as a
              domain before it ever reaches here (signupDomain.ts). */}
          <h1 className="text-lg font-semibold text-white mb-1">
            {signupDomain ? <>Start tracking {signupDomain}</> : 'Start for free'}
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            {/* No "continuously" here: the free tier is one engine, five
                prompts and a manual refresh. More engines and automatic
                refreshes are what a plan adds. */}
            {signupDomain
              ? 'Free to start, no credit card required. See how AI answers name you, and add engines when you are ready.'
              : 'Track a company or your personal brand in AI answers. No credit card required.'}
          </p>

          <SocialAuthButtons onError={setError} />

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-dark-600" />
            <span className="text-xs text-slate-600">or</span>
            <div className="h-px flex-1 bg-dark-600" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot — hidden from humans and screen readers; only bots fill it. */}
            <input
              type="text"
              name="company_website"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={ic}
              />
              {/* No password field by design. Signup sends an invite email and the
                  user sets their own password on /reset-password. */}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className={bc}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Sending link…</>
                : <>Continue with email <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Log in</Link>
        </p>
        <p className="text-center text-xs text-slate-600 mt-2">
          By signing up you agree to our{' '}
          <a href="https://getbrandgeo.com/terms.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-slate-500 hover:text-slate-400">Terms</a>
          {' '}and{' '}
          <a href="https://getbrandgeo.com/privacy.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-slate-500 hover:text-slate-400">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
