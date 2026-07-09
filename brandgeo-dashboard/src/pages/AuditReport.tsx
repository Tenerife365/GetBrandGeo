/**
 * AuditReport.tsx — public, unauthenticated report page for the Instant Audit
 * Engine (SALES-ENGINE.md §2, CLAUDE.md §10 Component A). Route: /audit/:token,
 * outside PrivateRoute in App.tsx.
 *
 * Polls get-audit-report.js while the audit is still running (screening
 * audits are usually already 'ready' by the time this page loads, since
 * audit-domain.js runs them synchronously before returning a token — full
 * audits run in the background and this page will show a live "generating"
 * state for those). Shows a free teaser (score only) until the visitor
 * submits an email via unlock-audit-report.js, then shows the full
 * per-engine breakdown.
 */

import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, TrendingUp, Mail } from 'lucide-react'
import { SentimentDot } from '../components/ScoreBadge'

type ReportStatus = 'pending' | 'generating_prompts' | 'collecting' | 'ready' | 'error'

interface TeaserReport {
  status: 'ready'; unlocked: false
  domain: string; category: string | null; ai_score: number; low_confidence: boolean; gap_count: number
}

interface EngineResult {
  prompt_id: number; prompt: string; engine: string
  brand_mentioned: boolean; brand_position: number | null; sentiment: string
  competitors_mentioned: string | null; snippet: string | null
}

interface Gap {
  engine: string; prompt: string; issue: 'competitor_named' | 'not_mentioned'; competitor_named?: string
}

interface FullReport {
  status: 'ready'; unlocked: true
  domain: string; category: string | null; ai_score: number; low_confidence: boolean
  depth: 'screening' | 'full'; engines_used: string[]
  dimensions: Record<string, number>
  engine_states: Record<string, 'know' | 'partial' | 'missing'>
  engine_results: EngineResult[]
  top_gaps: Gap[]
  competitor_flags: { engine: string; prompt: string; competitor_name: string }[]
}

interface PendingReport { status: Exclude<ReportStatus, 'ready'>; domain: string; error_message?: string }

type Report = TeaserReport | FullReport | PendingReport

const ENGINE_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', perplexity: 'Perplexity', meta: 'Meta AI',
}

const STATE_STYLE: Record<string, string> = {
  know:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  partial: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  missing: 'bg-slate-700/60 text-slate-400 border-slate-600/40',
}

function scoreColor(score: number) {
  return score >= 76 ? 'text-emerald-400' : score >= 51 ? 'text-brand-400' : score >= 21 ? 'text-blue-400' : 'text-slate-500'
}

export default function AuditReport() {
  const { token } = useParams<{ token: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchReport = async () => {
    if (!token) return
    try {
      const res = await fetch(`/.netlify/functions/get-audit-report?token=${encodeURIComponent(token)}`)
      const data = await res.json()
      if (!res.ok) { setLoadError(data.error || 'Could not load this report.'); return }
      setReport(data)
      if (data.status === 'ready' && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    } catch {
      setLoadError('Network error loading this report.')
    }
  }

  useEffect(() => {
    fetchReport()
    pollRef.current = setInterval(fetchReport, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setUnlockError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setUnlockError('Enter a valid email address'); return }
    setUnlocking(true)
    try {
      const res = await fetch('/.netlify/functions/unlock-audit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      })
      const data = await res.json()
      if (!res.ok) { setUnlockError(data.error || 'Could not unlock report.'); setUnlocking(false); return }
      await fetchReport()
    } catch {
      setUnlockError('Network error — please try again.')
    }
    setUnlocking(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/audit" className="inline-flex items-center gap-2 mb-6">
          <img src="/logo.png" alt="BrandGEO" style={{ height: 28, width: 'auto' }} />
          <span className="font-bold text-base text-white">
            Brand<span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #6D28D9 55%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GEO</span>
          </span>
        </Link>

        {loadError && (
          <div className="bg-dark-800 border border-red-500/20 rounded-xl p-6 text-sm text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} /> {loadError}
          </div>
        )}

        {!loadError && !report && (
          <div className="p-8 text-slate-500 text-sm animate-pulse">Loading your report…</div>
        )}

        {report && report.status !== 'ready' && (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
            <Loader2 size={28} className="animate-spin text-brand-400 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-white mb-1">
              {report.status === 'error' ? 'Something went wrong' : `Auditing ${report.domain}…`}
            </h1>
            <p className="text-sm text-slate-400">
              {report.status === 'error'
                ? (report as PendingReport).error_message || 'Please try running a new audit.'
                : 'Asking AI assistants what they know about your business — this usually takes under a minute.'}
            </p>
          </div>
        )}

        {report && report.status === 'ready' && !report.unlocked && (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-400 mb-1">{report.domain}{report.category ? ` · ${report.category}` : ''}</p>
            <div className={`text-6xl font-bold tabular-nums my-4 ${scoreColor(report.ai_score)}`}>
              {report.ai_score}<span className="text-2xl text-slate-500 font-normal">/100</span>
            </div>
            <h1 className="text-lg font-semibold text-white mb-1">AI Visibility Score</h1>
            <p className="text-sm text-slate-400 mb-6">
              {report.gap_count > 0
                ? `We found ${report.gap_count} visibility gap${report.gap_count === 1 ? '' : 's'} — see exactly where AI assistants aren't finding you.`
                : `Enter your email to see the full per-engine breakdown.`}
            </p>
            {report.low_confidence && (
              <p className="text-xs text-amber-400/80 mb-4">
                We couldn't fully analyse your homepage, so this is a lower-confidence estimate — the full report will still show exactly what we checked.
              </p>
            )}
            <form onSubmit={unlock} className="max-w-sm mx-auto space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  aria-label="Email address to unlock the full report"
                  className="w-full pl-9 pr-3 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50"
                />
              </div>
              {unlockError && <p className="text-xs text-red-400">{unlockError}</p>}
              <button
                type="submit"
                disabled={unlocking}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                {unlocking ? <Loader2 size={16} className="animate-spin" /> : null}
                See my full breakdown
              </button>
            </form>
          </div>
        )}

        {report && report.status === 'ready' && report.unlocked && (
          <FullReportView report={report} />
        )}
      </div>
    </div>
  )
}

function FullReportView({ report }: { report: FullReport }) {
  return (
    <div className="space-y-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-400 mb-1">{report.domain}{report.category ? ` · ${report.category}` : ''}</p>
        <div className={`text-5xl font-bold tabular-nums my-2 ${scoreColor(report.ai_score)}`}>
          {report.ai_score}<span className="text-xl text-slate-500 font-normal">/100</span>
        </div>
        <p className="text-xs text-slate-500">
          AI Visibility Score · {report.depth === 'full' ? 'Full audit' : 'Screening audit'} · {report.engines_used.length} engine{report.engines_used.length === 1 ? '' : 's'} checked
        </p>
      </div>

      {/* 6-dimension breakdown */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(report.dimensions).map(([dim, val]) => (
            <div key={dim} className="bg-dark-700 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase tracking-wide capitalize mb-1">{dim}</div>
              <div className={`text-lg font-bold tabular-nums ${scoreColor(val)}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-engine KNOW/PARTIAL/MISSING */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">By AI engine</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(report.engine_states).map(([engine, state]) => (
            <span key={engine} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATE_STYLE[state] ?? STATE_STYLE.missing}`}>
              {ENGINE_LABEL[engine] ?? engine}: {state.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Top gaps */}
      {report.top_gaps.length > 0 && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-amber-400" /> Top gaps
          </h2>
          <ul className="space-y-2">
            {report.top_gaps.map((g, i) => (
              <li key={i} className="text-sm text-slate-300 bg-dark-700 rounded-lg p-3">
                <span className="font-medium text-white">{ENGINE_LABEL[g.engine] ?? g.engine}</span>{' '}
                {g.issue === 'competitor_named'
                  ? <>named <span className="text-amber-400 font-medium">{g.competitor_named}</span> instead of you</>
                  : <>didn't mention you</>}
                {' '}for "<span className="text-slate-400">{g.prompt}</span>"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full per-prompt results */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">All checks</h2>
        <div className="space-y-2">
          {report.engine_results.map((r, i) => (
            <div key={i} className="bg-dark-700 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <SentimentDot value={r.sentiment} />
                <span className="font-medium text-white">{ENGINE_LABEL[r.engine] ?? r.engine}</span>
                <span className="text-slate-500">·</span>
                <span className={r.brand_mentioned ? 'text-emerald-400' : 'text-slate-500'}>
                  {r.brand_mentioned ? (r.brand_position ? `Mentioned (#${r.brand_position})` : 'Mentioned') : 'Not mentioned'}
                </span>
              </div>
              <p className="text-slate-400 text-xs">"{r.prompt}"</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-5 text-center">
        <p className="text-sm text-slate-300 mb-3">Want this monitored continuously, with recommendations to fix each gap?</p>
        <a
          href="https://getbrandgeo.com/#pricing"
          className="inline-block bg-brand-500 hover:bg-brand-400 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
        >
          See BrandGEO plans
        </a>
      </div>
    </div>
  )
}
