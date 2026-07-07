import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useTheme } from '../lib/themeContext'

function BrandGeoLogo() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="BrandGEO icon" style={{ height: '40px', width: 'auto', display: 'block' }} />
      <span className="text-2xl font-bold tracking-tight">
        <span className={isDark ? 'text-white' : 'text-slate-900'}>Brand</span>
        <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6D28D9 55%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GEO</span>
      </span>
    </div>
  )
}

const ic = 'w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition'
const bc = 'w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2'

export default function Signup() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [brandDomain, setBrandDomain] = useState(searchParams.get('domain') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

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
          password,
          brand_domain: brandDomain.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Signup failed. Please try again.')
      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-lg font-semibold text-white mb-2">Check your email</h1>
            <p className="text-sm text-slate-400 mb-6">
              We sent a confirmation link to{' '}
              <strong className="text-slate-300">{email}</strong>.<br />
              Click it to activate your account, then log in.
            </p>
            <Link to="/login" className={bc} style={{ textDecoration: 'none' }}>
              Go to Login →
            </Link>
            <p className="text-xs text-slate-600 mt-4">
              Didn't get it? Check spam, or{' '}
              <button
                onClick={() => setDone(false)}
                className="text-brand-400 hover:text-brand-300 transition-colors bg-transparent border-none cursor-pointer text-xs p-0"
              >
                try again
              </button>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8"><BrandGeoLogo /></div>
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
          <h1 className="text-lg font-semibold text-white mb-1">Start for free</h1>
          <p className="text-sm text-slate-400 mb-6">No credit card required</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Work email</label>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={ic}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={ic}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Brand domain</label>
              <input
                type="text"
                required
                value={brandDomain}
                onChange={e => setBrandDomain(e.target.value)}
                placeholder="yourcompany.com"
                className={ic}
              />
              <p className="text-xs text-slate-600 mt-1.5">The website you want to track in AI results</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className={bc}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create free account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Log in</Link>
        </p>
        <p className="text-center text-xs text-slate-600 mt-2">
          By signing up you agree to our{' '}
          <a href="https://getbrandgeo.com/terms.html" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400">Terms</a>
          {' '}and{' '}
          <a href="https://getbrandgeo.com/privacy.html" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-400">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
