import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

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

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.')
      }

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
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📧</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--text-muted, #8888aa)', lineHeight: 1.6, marginBottom: '24px' }}>
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account, then log in.
          </p>
          <Link to="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            Go to Login →
          </Link>
          <p style={{ marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted, #8888aa)' }}>
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => setDone(false)}
              style={{ background: 'none', border: 'none', color: 'var(--accent, #6c63ff)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
            >
              try again
            </button>.
          </p>
        </div>
      </div>
    )
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo" style={{ marginBottom: '4px' }}>
          Brand<span style={{ background: 'linear-gradient(90deg,#6c63ff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GEO</span>
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px' }}>
          Start for free
        </h1>
        <p style={{ color: 'var(--text-muted, #8888aa)', fontSize: '0.88rem', margin: '0 0 24px' }}>
          No credit card required
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="sg-email">Work email</label>
            <input
              id="sg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sg-password">Password</label>
            <input
              id="sg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sg-domain">Brand domain</label>
            <input
              id="sg-domain"
              type="text"
              value={brandDomain}
              onChange={(e) => setBrandDomain(e.target.value)}
              placeholder="yourcompany.com"
              required
            />
            <span className="form-hint">
              The website you want to track in AI results
            </span>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Creating account…' : 'Create free account →'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '20px', fontSize: '0.88rem', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>

        <p style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted, #8888aa)', textAlign: 'center', lineHeight: 1.5 }}>
          By signing up you agree to our{' '}
          <a href="https://getbrandgeo.com/terms.html" target="_blank" rel="noopener noreferrer">
            Terms
          </a>{' '}
          and{' '}
          <a href="https://getbrandgeo.com/privacy.html" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  )
}
