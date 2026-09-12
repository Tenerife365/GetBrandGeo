/**
 * /affiliate/login: magic-link sign in for affiliates. An affiliate has an
 * auth.users row (created when they accepted the invitation) but NO
 * user_profiles row, so the customer login page's password flow and the
 * OnboardGate would both mis-route them. This page only ever sends an OTP
 * link and never creates a user (shouldCreateUser: false), so a stranger
 * cannot mint an affiliate account from here.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, MailCheck, ArrowRight, Handshake } from 'lucide-react'
import { supabase, isDemoMode } from '../../lib/supabase'
import BrandGeoMark from '../../components/BrandGeoLogo'
import { humanizeError } from '../../lib/errors'

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
const bc = 'w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2'

export default function AffiliateLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    document.title = 'Affiliate sign in · BrandGEO'
    return () => { document.title = 'BrandGEO Dashboard' }
  }, [])

  // Already signed in: go straight to the portal.
  useEffect(() => {
    if (isDemoMode) return
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate('/affiliate', { replace: true }) })
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    if (isDemoMode) { sessionStorage.setItem('demo_logged_in', 'true'); setTimeout(() => navigate('/affiliate'), 400); return }
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/affiliate` },
    })
    setLoading(false)
    if (err) {
      // Supabase answers "Signups not allowed for otp" for an unknown address.
      // Say the useful thing instead of echoing that.
      const msg = /signups not allowed|not found/i.test(err.message)
        ? 'We could not find an affiliate account for that email. Apply on getbrandgeo.com/affiliates or use the email your invitation was sent to.'
        : humanizeError(err, 'Could not send the sign-in link. Please try again.')
      setError(msg)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <BrandGeoMark size="xl" href="https://getbrandgeo.com/affiliates.html" ariaLabel="BrandGEO affiliates" />
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-card p-card-feature">
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto mb-3 text-emerald-400" size={36} />
              <h1 className="text-lg font-semibold text-white mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-400 mb-6">
                We sent a sign-in link to <strong className="text-slate-300">{email}</strong>. It works once and expires in an hour.
              </p>
              <button onClick={() => { setSent(false); setError('') }} className="text-sm text-brand-400 hover:text-brand-300 transition-colors">Use a different email</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Handshake size={14} /> Affiliate portal
              </div>
              <h1 className="text-lg font-semibold text-white">Sign in with a magic link</h1>
              <p className="text-sm text-slate-400">Enter the email your invitation or approval was sent to. No password needed.</p>
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="aff-email" className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input id="aff-email" type="email" required autoComplete="email" className={ic} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <button type="submit" disabled={loading || !email.trim()} className={bc}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>Send sign-in link <ArrowRight size={16} /></>}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Not an affiliate yet? <a href="https://getbrandgeo.com/affiliates.html" className="text-brand-400 hover:text-brand-300">Apply here</a>.
                Customer? <Link to="/login" className="text-brand-400 hover:text-brand-300">Dashboard sign in</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
