/**
 * AuditRequest.tsx — public, unauthenticated "instant audit" entry page
 * (SALES-ENGINE.md §2, CLAUDE.md §10 Component A). Lives outside PrivateRoute
 * in App.tsx — anyone can load /audit without logging in.
 *
 * This is a minimal reference implementation so Component A is testable
 * end-to-end from within brandgeo-dashboard/ alone. The real high-conversion
 * version of this input (embedded on the homepage) is Master-SiteDesign's
 * Component D — this page's job is just to prove the API works, not to be
 * the final marketing surface.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'

export default function AuditRequest() {
  const navigate = useNavigate()
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')   // hidden field — real users never fill this in

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
    if (!cleaned) { setError('Enter a domain, e.g. example.com'); return }

    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/audit-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleaned, honeypot }),
      })
      const data = await res.json()
      if (!res.ok || !data.token) {
        setError(data.error || 'Could not start the audit. Please try again.')
        setLoading(false)
        return
      }
      navigate(`/audit/${data.token}`)
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="BrandGEO" style={{ height: 36, width: 'auto' }} />
            <span className="font-bold text-xl text-white">
              Brand<span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6D28D9 55%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GEO</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Free Instant AI Visibility Audit</h1>
          <p className="text-sm text-slate-400">
            See whether ChatGPT, Gemini, and other AI assistants actually mention your business when people ask for recommendations — in about a minute.
          </p>
        </div>

        <form onSubmit={submit} className="bg-dark-800 border border-dark-700 rounded-xl p-6 space-y-4">
          <div>
            <label htmlFor="audit-domain" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Your website
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="audit-domain"
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>

          {/* Honeypot — hidden from real users via CSS, bots that auto-fill every field trip it */}
          <input
            type="text"
            name="company_website_url"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute opacity-0 pointer-events-none -z-10"
            style={{ left: '-9999px' }}
          />

          {error && (
            <div className="bg-dark-800 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Auditing your visibility…' : 'Run my free audit'}
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            No signup required for your score. We'll ask for your email to unlock the full breakdown.
          </p>
        </form>
      </div>
    </div>
  )
}
