/**
 * AuditReport.tsx, public, unauthenticated report page for the Instant Audit
 * Engine (SALES-ENGINE.md §2, CLAUDE.md §10 Component A). Route: /audit/:token,
 * outside PrivateRoute in App.tsx.
 *
 * Polls get-audit-report.js while the audit is still running (screening
 * audits are usually already 'ready' by the time this page loads, since
 * audit-domain.js runs them synchronously before returning a token, full
 * audits run in the background and this page will show a live "generating"
 * state for those). Shows a free teaser (score only) until the visitor
 * submits an email via unlock-audit-report.js, then shows the full
 * per-engine breakdown.
 */

import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, AlertTriangle, TrendingUp, Mail } from 'lucide-react'
import { SentimentDot } from '../components/ScoreBadge'
import BrandGeoMark from '../components/BrandGeoLogo'

type ReportStatus = 'pending' | 'generating_prompts' | 'collecting' | 'ready' | 'error'

interface TeaserReport {
  status: 'ready'; unlocked: false
  domain: string; category: string | null; ai_score: number; low_confidence: boolean; gap_count: number
  // Already returned by get-audit-report.js's `shared` object (the granularity
  // ruling documented there: the gate protects the JOIN, not the VALUES), but
  // never typed on this interface until now. No backend change.
  engine_states: Record<string, 'know' | 'partial' | 'missing' | 'unavailable'>
  competitor_names: string[]
  competitor_count: number
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
  // 'unavailable' = we could not reach this engine (quota/timeout/API error).
  // Deliberately NOT the same as 'missing', which means the engine answered and
  // never named the brand. Claiming the first is the second would be telling a
  // prospect an AI engine has never heard of them when we simply failed to ask.
  engine_states: Record<string, 'know' | 'partial' | 'missing' | 'unavailable'>
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
  know:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  partial:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  missing:     'bg-slate-700/60 text-slate-400 border-slate-600/40',
  // Same muted treatment the client dashboard already uses for an unreachable
  // engine (§1.8 "Temporarily unavailable"), so it never reads as a finding
  // about the brand.
  unavailable: 'bg-slate-700/60 text-slate-500 border-slate-600/40',
}

// Plain-English reading of the four states _score.js:124-139 can produce.
// Ported verbatim from brandgeo/web/site.js's STATE_PHRASE (site.js:266-271)
// per docs/copy/audit-score-presentation-2026-08-14.md section 2.3, so both
// surfaces say the same thing about the same data.
const STATE_PHRASE: Record<string, string> = {
  know: 'names you',
  partial: 'names you sometimes',
  missing: 'did not name you',
  unavailable: 'could not be reached',
}

// SCREENING_PROMPT_COUNT (audit-domain.js:34). Safe to hardcode here: this is
// a request count, not an answered count, and the public audit is always
// forced to screening depth (audit-domain.js:74). Per copy deck section 2.1,
// reused identically in section 2.2's teaser fraction.
const SCREENING_PROMPT_COUNT = 4

// How many of the checked engines named the brand at least once. 'know' and
// 'partial' both count as named, matching STATE_PHRASE above. Works on both
// the teaser and full payloads, since engine_states is shared by both.
function engineNamedFraction(engineStates: Record<string, string>) {
  const ids = Object.keys(engineStates)
  const named = ids.filter(id => engineStates[id] === 'know' || engineStates[id] === 'partial').length
  return { named, total: ids.length }
}

// Copy deck section 2.4, the shared pre-empt block, verbatim. The single
// highest-impact string in the deck: it has to land before the visitor forms
// the "but I searched my own name" objection, not after, and it runs
// unconditionally regardless of score. Text only; callers own the wrapper
// styling so it can sit inside a boxed note on the teaser and a plain card on
// the full view without duplicating the copy.
function PreemptText({ engineCount }: { engineCount: number }) {
  return (
    <>
      Search your own name and you already show up. That's not what we tested here.
      {' '}We asked {engineCount} AI engines the kind of question a buyer types before
      they've ever heard of you, not your name, and checked who got named back.
    </>
  )
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
      setUnlockError('Network error. Please try again.')
    }
    setUnlocking(false)
  }

  return (
    <div className="min-h-screen bg-dark-900 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Goes to the marketing site, not to /audit. This route is
            `/audit/:token`, public and usually reached from an emailed link by
            someone who has never signed in, so "home" for them is
            getbrandgeo.com. /audit is a sibling form, not a parent. */}
        <BrandGeoMark size="sm" href="https://getbrandgeo.com" ariaLabel="BrandGEO: go to getbrandgeo.com" className="mb-6" />

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
              {report.status === 'error' ? "We couldn't finish this audit" : `Auditing ${report.domain}…`}
            </h1>
            <p className="text-sm text-slate-400">
              {report.status === 'error'
                ? (report as PendingReport).error_message || `Something interrupted the check before we could score ${report.domain}. Run it again, it usually finishes in under a minute.`
                : 'Asking AI engines the questions a buyer asks before they know you exist. This usually takes under a minute.'}
            </p>
          </div>
        )}

        {report && report.status === 'ready' && !report.unlocked && (
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-400 mb-1">{report.domain}{report.category ? ` · ${report.category}` : ''}</p>
            <div className={`text-6xl font-bold tabular-nums my-4 ${scoreColor(report.ai_score)}`}>
              {report.ai_score}<span className="text-2xl text-slate-500 font-normal">/100</span>
            </div>
            <h1 className="text-lg font-semibold text-white mb-1">AI Visibility Score (screening sample)</h1>
            <p className="text-sm text-slate-300 mb-4">
              {engineNamedFraction(report.engine_states).named} of {engineNamedFraction(report.engine_states).total} AI engines named you, at least once, across {SCREENING_PROMPT_COUNT} buyer questions.
            </p>
            <p className="text-sm text-slate-400 text-left bg-dark-700/60 border border-dark-600 rounded-lg p-4 mb-4">
              <PreemptText engineCount={engineNamedFraction(report.engine_states).total} />
            </p>
            {Object.keys(report.engine_states).length > 0 && (
              <div className="text-left bg-dark-700/60 border border-dark-600 rounded-lg p-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.engine_states).map(([engine, state]) => (
                    <span
                      key={engine}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATE_STYLE[state] ?? STATE_STYLE.unavailable}`}
                      title={state === 'unavailable'
                        ? 'We could not reach this engine during your audit. This is not a result about your brand.'
                        : undefined}
                    >
                      {ENGINE_LABEL[engine] ?? engine}: {STATE_PHRASE[state] ?? state}
                    </span>
                  ))}
                </div>
                {report.competitor_count > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      {report.competitor_count === 1 ? 'Named in an answer where you were not' : 'Named in answers where you were not'}
                    </div>
                    <p className="text-sm font-semibold text-brand-400">
                      {report.competitor_names.join(', ')}
                      {report.competitor_count > report.competitor_names.length
                        ? `, and ${report.competitor_count - report.competitor_names.length} more`
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
            <p className="text-sm text-slate-400 mb-6">
              {report.gap_count > 0
                ? `We found ${report.gap_count} visibility gap${report.gap_count === 1 ? '' : 's'}. See exactly where AI assistants aren't finding you.`
                : `Enter your email to see the full per-engine breakdown.`}
            </p>
            {report.low_confidence && (
              <p className="text-xs text-amber-400/80 mb-4">
                We couldn't fully analyse your homepage, so this is a lower-confidence estimate. The full report will still show exactly what we checked.
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
  const mentionedCount = report.engine_results.filter(r => r.brand_mentioned).length
  const cellsChecked = report.engine_results.length
  const promptCount = new Set(report.engine_results.map(r => r.prompt_id)).size
  return (
    <div className="space-y-4">
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-400 mb-1">{report.domain}{report.category ? ` · ${report.category}` : ''}</p>
        <div className={`text-5xl font-bold tabular-nums my-2 ${scoreColor(report.ai_score)}`}>
          {report.ai_score}<span className="text-xl text-slate-500 font-normal">/100</span>
        </div>
        <p className="text-xs text-slate-500">
          AI Visibility Score (screening sample) · {mentionedCount} of {cellsChecked} answers named you · {report.engines_used.length} engine{report.engines_used.length === 1 ? '' : 's'} checked
        </p>
        {cellsChecked < 8 && (
          <p className="text-xs text-slate-500 mt-1">{cellsChecked} of 8 questions returned an answer.</p>
        )}
      </div>

      {/* Copy deck section 2.4, the shared pre-empt block. Placed directly
          under the score card, above Breakdown, unconditional on score. */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
        <p className="text-sm text-slate-400">
          <PreemptText engineCount={Object.keys(report.engine_states).length} />
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

      {/* Per-engine KNOW / PARTIAL / MISSING / UNAVAILABLE */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">By AI engine</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(report.engine_states).map(([engine, state]) => (
            <span
              key={engine}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATE_STYLE[state] ?? STATE_STYLE.unavailable}`}
              title={state === 'unavailable'
                ? 'We could not reach this engine during your audit. This is not a result about your brand.'
                : undefined}
            >
              {ENGINE_LABEL[engine] ?? engine}: {STATE_PHRASE[state] ?? state}
            </span>
          ))}
        </div>
        {Object.values(report.engine_states).includes('unavailable') && (
          <p className="text-xs text-slate-500 mt-3">
            One or more engines could not be reached during your audit. They are shown as
            UNAVAILABLE and are excluded from your score, so they are not counted against you.
          </p>
        )}
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
        <h2 className="text-sm font-semibold text-slate-300 mb-1">The exact questions we asked</h2>
        <p className="text-xs text-slate-500 mb-3">
          We asked {report.domain} {promptCount} questions a buyer types before they've heard of you. Here is what each AI engine said back.
        </p>
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

      {/* Terminal CTA. Until 2026-07-31 the only outbound link here was the
          marketing pricing anchor (funnel audit F5): a reader who had just been
          shown their own gaps was sent across domains to find for themselves the
          signup link this page could hand them with their domain already filled
          in. Pricing survives below as a secondary line, because wanting the
          price before opening an account is reasonable; it is simply no longer
          the only way out.

          A router <Link>, not an absolute URL, because this page is already
          served from app.getbrandgeo.com. Same destination, no full reload, and
          the query string survives either way. */}
      {/* The question above the button has to match where the button goes. It
          used to ask about continuous monitoring and lead to pricing, which was
          consistent. It now leads to FREE signup, and the free tier is one
          engine, five prompts and a manual refresh, so the continuous claim
          moved down to the line that leads to the plans. */}
      <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-5 text-center">
        <p className="text-sm text-slate-300 mb-3">Want to keep track of this, and work through each gap?</p>
        <Link
          to={`/signup?domain=${encodeURIComponent(report.domain)}`}
          className="inline-block bg-brand-500 hover:bg-brand-400 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
        >
          Start tracking {report.domain} →
        </Link>
        <p className="text-xs text-slate-500 mt-3">
          Free to start, no credit card. For every engine, automatic refreshes and fix recommendations,{' '}
          <a href="https://getbrandgeo.com/#pricing" className="text-slate-400 hover:text-slate-300 underline">see the plans</a>.
        </p>
      </div>
    </div>
  )
}
