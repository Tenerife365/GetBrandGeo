import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts'
import { RefreshCw, Sparkles, ChevronDown, ChevronUp, TrendingUp, Target, Hash, Eye } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { useI18n, fmt } from '../lib/i18nContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { useCollection } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { useTheme } from '../lib/themeContext'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import type { AiVisibilityDimensions } from '../lib/aiVisibilityScore'
import { staggerContainer, heroReveal, useCountUp, EASE_OUT } from '../lib/motion'
import { useChartTheme } from '../lib/chartTheme'
import { useResults } from '../lib/resultsContext'
import { nextSeq, isStale } from '../lib/resultsGuards'
import { readResultHistory } from '../lib/historyRead'
import { formatAvgPosition } from '../lib/metrics'
import {
  buildDashboardView, DASHBOARD_HISTORY_COLUMNS,
  type DashboardHistoryRow, type RecentEntry, type SparkPoint,
} from '../lib/views/dashboardView'
import MotionCard from '../components/MotionCard'
import Skeleton from '../components/Skeleton'
import Collapse from '../components/Collapse'
import { PageTitle } from '../components/Typography'
import LoadErrorCard from '../components/LoadErrorCard'
import ChartTooltip from '../components/ChartTooltip'
import SharedEmptyState from '../components/EmptyState'
import { formatDate, formatOrdinal } from '../lib/format'

const DIMENSION_LABELS: [keyof AiVisibilityDimensions, string][] = [
  ['recognition', 'Recognition'], ['knowledge', 'Knowledge'], ['sentiment', 'Sentiment'],
  ['accuracy', 'Accuracy'], ['reach', 'Reach'], ['consistency', 'Consistency'],
]

// Plain "X, Y and Z" join of the plan's real engine names, sourced from
// ENGINE_META so it can never name an engine the plan does not run. Replaces
// a hardcoded "ChatGPT and Gemini" in the zero-data empty state below, which
// falsely promised ChatGPT to a Free client (PLAN_ENGINES.free is Gemini
// only, per the 2026-07-31 ruling).
function joinEngineNames(ids: EngineId[]): string {
  const names = ids.map(id => ENGINE_META[id]?.label ?? id)
  if (names.length === 0) return 'AI engines'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * Top-of-page "what to do next" callout, DASHBOARD-UX-2026.md section 6 Phase B.
 * Sourced from the persisted recommendation_runs/recommendations tables, not
 * recomputed here. One embedded read (run plus its recommendations).
 */
interface TopRec {
  id: number
  title: string
  priority: 'critical' | 'high' | 'medium'
  status?: string
  position?: number | null
}

export default function Dashboard() {
  const { activeClientId, activeClient, activeEngines } = useClient()
  // clientContext rebuilds this array on every render, so memo deps use a
  // stable string key instead of the array identity.
  const activeEnginesKey = activeEngines.join(',')
  const { t } = useI18n()
  const { getStartDate, timeRange, setTimeRange } = useTimeFilter()
  const { lastCompletedAt } = useCollection()
  const { theme } = useTheme()
  const chart = useChartTheme()
  const brandName = activeClient?.name ?? 'your brand'
  // Personalised, time-of-day greeting — "this is my dashboard" ownership touch.
  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()
  // Gates the Recharts draw-in animation below (DASHBOARD-UX-2026.md §6 Phase C).
  // Not covered by App.tsx's <MotionConfig> — Recharts isn't a Motion component,
  // same reason useCountUp checks this itself in motion.ts.
  const prefersReducedMotion = useReducedMotion()

  const { snapshot, status, loadError, reload } = useResults()
  const [history, setHistory] = useState<DashboardHistoryRow[] | null>(null)
  const [historyFailed, setHistoryFailed] = useState(false)
  const [topRecs, setTopRecs]     = useState<TopRec[]>([])
  const [recsLoaded, setRecsLoaded] = useState(false)
  // Progressive disclosure (Hick's Law): detail charts/lists start hidden.
  const [showDetails, setShowDetails] = useState(false)

  // Window history: only the Checks tile, the sparklines and the two recent
  // lists read it. Paged (readResultHistory) so a long window is never cut at
  // 1,000 rows. A sequence guard drops an older response that lands late.
  const historySeq = useRef(0)
  const loadHistory = useCallback(async (quiet: boolean) => {
    const seq = nextSeq(historySeq)
    if (!quiet) { setHistory(null); setHistoryFailed(false) }
    if (isDemoMode) {
      setHistory(mockAIResults
        .map(r => ({
          id: r.id, prompt_id: r.prompt_id, llm: r.llm, brand_mentioned: r.brand_mentioned,
          brand_position: r.brand_position, checked_at: r.checked_at, response_snippet: r.response_snippet,
        }))
        .sort((a, b) => b.checked_at.localeCompare(a.checked_at) || b.id - a.id))
      return
    }
    const res = await readResultHistory<DashboardHistoryRow>(supabase, {
      clientId: activeClientId,
      sinceIso: getStartDate()?.toISOString() ?? null,
      columns: DASHBOARD_HISTORY_COLUMNS,
    })
    if (isStale(historySeq, seq)) return
    if (res.error) { setHistoryFailed(true); return }
    setHistoryFailed(false)
    setHistory(res.rows)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClientId, timeRange])

  useEffect(() => { void loadHistory(false) }, [loadHistory])

  // The snapshot reloads itself on lastCompletedAt (resultsContext); the window
  // history does not, so re-read it quietly (rows stay on screen).
  useCollectionLanded(lastCompletedAt, () => { void loadHistory(true) })

  const view = useMemo(() => snapshot
    ? buildDashboardView({
        rows: snapshot.rows,
        activePrompts: snapshot.activePrompts,
        prompts: snapshot.prompts,
        activeEngines,
        history,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    : null, [snapshot, activeEnginesKey, history])

  // "What to do next": reads the SAME persisted advice Recommendations.tsx
  // shows. One embedded read (the run and its recommendations together), so
  // there is no second round trip. Independent of the snapshot so a slower
  // read never delays the rest of the page.
  useEffect(() => {
    if (isDemoMode || !activeClientId) { setTopRecs([]); setRecsLoaded(true); return }
    let cancelled = false
    ;(async () => {
      setRecsLoaded(false)
      const { data: runRows } = await supabase
        .from('recommendation_runs')
        .select('id, generated_at, recommendations(id, title, priority, status, position)')
        .eq('client_id', activeClientId)
        .order('generated_at', { ascending: false })
        .limit(1)
      const recs = ((runRows?.[0] as { recommendations?: TopRec[] } | undefined)?.recommendations ?? [])
        .filter(r => r.status !== 'dismissed')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .slice(0, 2)
      if (!cancelled) { setTopRecs(recs); setRecsLoaded(true) }
    })()
    return () => { cancelled = true }
  }, [activeClientId])

  // Count-up target is the real, already-loaded score; active flips true only
  // once the snapshot has resolved, so this animates the display, never the data.
  const scoreData: { dimensions: AiVisibilityDimensions; aiScore: number } | null = view?.score ?? null
  const displayedScore = useCountUp(scoreData?.aiScore ?? 0, !!scoreData)

  const win = view?.window ?? null
  const llmData = view?.engineBars ?? []
  const recentMentioned = win?.recentMentioned ?? []
  const recentNotMentioned = win?.recentNotMentioned ?? []

  // KPI trend sparklines. Avg-position only gets a sparkline when it has at
  // least 2 real (non-null) buckets, so a brand that is never ranked does not
  // show an empty 32px gap.
  const spark = win?.sparks ?? null
  const avgPosSpark = spark && spark.avgPosition.filter(p => p.v != null).length >= 2
    ? spark.avgPosition
    : undefined

  // Human-readable window length for the "no checks in this window" line below,
  // mirroring timeFilterContext.tsx's own 7d/30d/90d/all day counts.
  const windowDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : null

  // Ring sweep math. RING_R must match the SVG circles' r="54" below.
  const RING_R = 54
  const RING_CIRC = 2 * Math.PI * RING_R
  const ringOffset = scoreData
    ? RING_CIRC - (scoreData.aiScore / 100) * RING_CIRC
    : RING_CIRC

  const mentionPct = view?.mention.pct ?? 0
  const checkedCount = view?.mention.checked ?? 0

  // Content-shaped skeleton (DASHBOARD-UX-2026.md §6 Phase C) — mirrors the real
  // page's layout below (header / hero score card / KPI grid / two chart cards)
  // so the page doesn't visually jump/reflow once data arrives (CLS). Replaces
  // the old centered "pulsing text" spinner.
  if (!snapshot || !view) {
    if (status === 'error') return (
      <div className="p-5 sm:p-8 md:p-10 max-w-6xl mx-auto">
        <div className="mb-6">
          <PageTitle>{greeting}, {brandName}</PageTitle>
        </div>
        <LoadErrorCard onRetry={() => reload()} />
      </div>
    )
    return (
    <div className="p-5 sm:p-8 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="bg-dark-800 rounded-card p-card-feature mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="flex flex-col items-center gap-3 shrink-0">
          <Skeleton className="w-36 h-36 sm:w-48 sm:h-48 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-dark-800 border border-dark-700 rounded-xl p-5 space-y-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-dark-800 rounded-xl p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-dark-800 rounded-xl p-6 space-y-3">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
    )
  }

  return (
    <div className="p-5 sm:p-8 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <PageTitle>{greeting}, {brandName}</PageTitle>
          <p className="text-sm text-slate-400 mt-0.5">Here&apos;s your AI visibility snapshot.</p>
        </div>
        <button onClick={() => { void reload({ quiet: true }); void loadHistory(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm text-slate-300 transition-colors border border-dark-600">
          <RefreshCw size={15} />{t.dash_refresh}</button>
      </div>

      {loadError && <LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} />}

      {/* Zero-data first run (dashboard-visual-system.md §11 rule 1 / audit F-02,
          the single worst moment in the product per the audit's verdict): a
          brand-new tenant used to see "0% AI VISIBILITY SCORE" across all six
          dimensions — a verdict, not an absence of measurement. Never render a
          zero as though it were a measurement. Routes to /prompts when there are
          no prompts yet, otherwise to /ai-visibility to run the first collection. */}
      {scoreData && !view.hasAnyMeasurement && (
        <motion.div
          className="bg-dark-800 rounded-xl mb-6"
          variants={heroReveal} initial="hidden" animate="show"
        >
          <SharedEmptyState
            icon={Target}
            title="Not measured yet"
            body={
              view.promptCount === 0
                ? `BrandGEO measures how ${joinEngineNames(activeEngines)} ${activeEngines.length === 1 ? 'answers' : 'answer'} real buyer questions about ${brandName}. Add a prompt to start.`
                : `BrandGEO is about to check how ${joinEngineNames(activeEngines)} ${activeEngines.length === 1 ? 'answers' : 'answer'} ${view.promptCount} tracked prompt${view.promptCount === 1 ? '' : 's'} about ${brandName}. Run the first collection to see your score.`
            }
            actionLabel={view.promptCount === 0 ? 'Add a prompt' : 'Run first collection'}
            actionTo={view.promptCount === 0 ? '/prompts' : '/ai-visibility'}
            minHeight={220}
          />
        </motion.div>
      )}

      {scoreData && view.hasAnyMeasurement && (
        <motion.div
          className="bg-dark-800 rounded-card p-card-feature mb-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-10"
          variants={heroReveal} initial="hidden" animate="show"
        >
          <div className="flex flex-col items-center gap-3 shrink-0">
            <svg viewBox="0 0 120 120" className="w-36 h-36 sm:w-48 sm:h-48" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="overviewScoreRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
                <filter id="overviewScoreGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="60" cy="60" r={RING_R} fill="none"
                stroke={theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth="6" />
              {/* Sweeps in from empty (0%) to the real score on every mount — genuinely
                  animates, unlike the old plain-CSS-transition circles, which had no
                  distinct "from" state to animate from on first paint (DASHBOARD-UX-2026.md §6). */}
              <motion.circle cx="60" cy="60" r={RING_R} fill="none" stroke="url(#overviewScoreRingGrad)"
                strokeWidth="10" strokeLinecap="round" strokeDasharray={RING_CIRC}
                transform="rotate(-90 60 60)" filter="url(#overviewScoreGlow)" opacity="0.3"
                initial={{ strokeDashoffset: RING_CIRC }} animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.4, ease: EASE_OUT }} />
              <motion.circle cx="60" cy="60" r={RING_R} fill="none" stroke="url(#overviewScoreRingGrad)"
                strokeWidth="5.5" strokeLinecap="round" strokeDasharray={RING_CIRC}
                transform="rotate(-90 60 60)"
                initial={{ strokeDashoffset: RING_CIRC }} animate={{ strokeDashoffset: ringOffset }}
                transition={{ duration: 1.4, ease: EASE_OUT }} />
              <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif">
                <tspan fontSize="38" fontWeight="800" fill={theme === 'light' ? '#1e293b' : 'white'} letterSpacing="-1.5">
                  {displayedScore}
                </tspan>
                {/* Solid hexes, not alpha, so this can be contrast-checked.
                    Light was rgba(0,0,0,0.4), composites to rgb(153,153,153)
                    on the white card: 2.85:1 at 14px/500 against a 4.5 floor.
                    #556479 measures 6.03:1. Dark is unchanged in appearance,
                    #93979f is the old alpha composited on --dark-800, 6.09:1.
                    Mirrors AIVisibility.tsx's ringTextFillDim. */}
                <tspan fontSize="14" fontWeight="500" fill={theme === 'light' ? '#556479' : '#93979f'} dy="-13">%</tspan>
              </text>
            </svg>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">AI Visibility Score</div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            {DIMENSION_LABELS.map(([key, label]) => (
              <div key={key}>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                <div className="text-lg font-bold text-white tabular-nums">{scoreData.dimensions[key]}%</div>
              </div>
            ))}
            {/* Padded to a real 44px/40px touch target (WCAG 2.5.8, F-18) — this was
                a bare 16px-tall text link and the only link on the page at 375. */}
            <Link to="/ai-visibility"
              className="col-span-2 sm:col-span-3 mt-1 flex items-center min-h-[44px] sm:min-h-[40px] text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
              View full breakdown →
            </Link>
          </div>
        </motion.div>
      )}

      {/* "What to do next" — top of page, summarized, sourced from the SAME persisted
          advice /recommendations shows (CLAUDE.md §14), not a duplicate generator.
          Only renders once real data has loaded and there's something to say — an
          empty/loading callout would just be noise above the fold. */}
      {recsLoaded && topRecs.length > 0 && (
        <motion.div
          className="mb-6 p-6 bg-dark-800 rounded-xl"
          variants={heroReveal} initial="hidden" animate="show"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-sm font-semibold text-slate-200">What to do next</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15">
              AI insight
            </span>
          </div>
          <div className="space-y-2">
            {topRecs.map(rec => (
              <div key={rec.id} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                  rec.priority === 'critical' ? 'bg-red-400' : rec.priority === 'high' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <span className="truncate">{rec.title}</span>
              </div>
            ))}
          </div>
          <Link to="/recommendations"
            className="inline-block mt-3 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
            View all recommendations →
          </Link>
        </motion.div>
      )}

      {/* Island 3 — KPI strip. One card, four quiet stats (Hick's Law: one island,
          not four separate cards). Values stay neutral; color appears only on a
          genuine anomaly (Gestalt Focal-Point Law). */}
      {(
        <motion.div
          className="bg-dark-800 rounded-card p-card-feature mb-6"
          variants={heroReveal} initial="hidden" animate="show"
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Key metrics</h2>
          {/* The score hero above is gated on all-time data (hasAnyRows), so it
              keeps showing a real score even when the SELECTED window has no
              rows in it, and a free client on a monthly cadence would otherwise
              lose their score to a first-run verdict for three weeks out of
              four. This line is what explains the gap between "there is a
              score" and "these window-scoped stats read zero", with a control
              that removes the gap instead of just naming it. */}
          {view.hasAnyMeasurement && win && win.checks === 0 && timeRange !== 'all' && windowDays != null && (
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-500">
              <span className="italic">No checks in the last {windowDays} days.</span>
              <button
                onClick={() => setTimeRange('all')}
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                Show all time
              </button>
            </div>
          )}
          {historyFailed && (
            <LoadErrorCard
              message="Couldn't load recent activity."
              onRetry={() => { void loadHistory(false) }}
            />
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            <Stat
              icon={<TrendingUp size={15} />}
              label={t.dash_statMentionRate}
              // A zero-check tenant has no rate to alert on, only an absence of
              // measurement (dashboard-visual-system.md 11 rule 1). Falls through
              // to Stat's own "Not measured yet" branch instead of a red 0 percent,
              // which used to sit directly under the "Not measured yet" hero above
              // and contradict it on the same screen.
              value={view.mention.pct === null ? null : `${view.mention.pct}%`}
              sub={t.dash_statMentionRateSub}
              tone={
                view.mention.pct === null
                  ? 'neutral'
                  : view.mention.pct < 25 ? 'alert' : view.mention.pct < 50 ? 'warn' : 'neutral'
              }
              spark={spark?.mentionRate}
            />
            <Stat
              icon={<Target size={15} />}
              label={t.dash_statAvgPos}
              value={formatAvgPosition(view.avgPosition)}
              sub={t.dash_statAvgPosSub}
              tone={view.avgPosition != null && view.avgPosition > 6 ? 'warn' : 'neutral'}
              spark={avgPosSpark}
              connectNulls
            />
            <Stat icon={<Hash size={15} />} label={t.dash_statPrompts} value={String(view.promptCount)} sub={t.dash_statPromptsSub} />
            <Stat
              icon={<Eye size={15} />}
              label={t.dash_statChecks}
              value={win ? String(win.checks) : null}
              pending={!win && !historyFailed}
              emptyLabel="Unavailable"
              sub="In the selected window"
              spark={spark?.volume}
            />
          </div>
        </motion.div>
      )}

      {/* Progressive disclosure (Hick's Law): the engine-breakdown charts and the
          recent-activity lists are secondary detail — pulled out of the primary
          sightline behind an intentional, text-labeled toggle. */}
      <button
        onClick={() => setShowDetails(v => !v)}
        aria-expanded={showDetails}
        className="flex items-center justify-between gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-sm font-medium text-slate-300 transition-colors mb-4"
      >
        <span>{showDetails ? 'Hide breakdown & recent activity' : 'Show engine breakdown & recent activity'}</span>
        {showDetails ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      <Collapse open={showDetails}>
      <div className="space-y-6 pb-2">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer} initial="hidden" animate="show"
      >
        <MotionCard stagger hoverLift={false} className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_mentionRate}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_mentionRateDesc, { brand: brandName })}</p>
          {llmData.length === 0 ? (
            <EmptyState text={t.dash_noResults} ctaText={t.dash_noDataCta} to="/ai-visibility" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={llmData} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid stroke={chart.gridLine} strokeWidth={1} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chart.axisInk, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chart.axisInk, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" width={40} tickCount={4} />
                <Tooltip
                  content={<ChartTooltip formatValue={item => `${item.value}%`} />}
                  cursor={{ fill: chart.gridLine, fillOpacity: 0.35 }}
                />
                {/* Coloured per engine (§8.6 rule 2 — colour follows the entity, brand
                    violet is chrome not data, §8.6 rule 3) rather than one flat hue:
                    the x-axis label already names each engine, and the swatch is the
                    same identity used everywhere else engines appear. */}
                <Bar
                  dataKey="rate"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {llmData.map(d => <Cell key={d.id} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {llmData.map(d => (
              <div key={d.label} className="px-2.5 py-1 rounded-full text-xs border border-dark-600 text-slate-400">
                {d.label} · {d.rate}%
              </div>
            ))}
          </div>
        </MotionCard>

        <MotionCard stagger hoverLift={false} className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">{t.dash_brandVisibility}</h2>
          {checkedCount > 0 ? (
            <>
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{brandName} mentioned</span>
                  <span>{mentionPct}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${mentionPct >= 50 ? 'bg-emerald-500' : mentionPct >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${mentionPct}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {llmData.map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="text-xs font-medium w-20 text-slate-300">{d.label}</div>
                    <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${d.rate}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 w-10 text-right">{d.rate}%</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState text={t.dash_noResults} ctaText={t.dash_noDataCta} to="/ai-visibility" />
          )}
        </MotionCard>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer} initial="hidden" animate="show"
      >
        <MotionCard stagger hoverLift={false} className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_recentMentions}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_mentionsDesc, { brand: brandName })}</p>
          {!win ? (
            historyFailed
              ? <LoadErrorCard message="Couldn't load recent activity." onRetry={() => { void loadHistory(false) }} />
              : <Skeleton className="h-24 w-full rounded-lg" />
          ) : recentMentioned.length === 0 ? (
            checkedCount === 0 ? (
              <EmptyState text={t.dash_noDataYet} ctaText={t.dash_noDataCta} to="/ai-visibility" />
            ) : (
              <EmptyState text={t.dash_noMentions} ctaText={t.dash_noMentionsCta} to="/recommendations" />
            )
          ) : (
            <div className="space-y-3">
              {recentMentioned.map(r => (
                <ResultRow key={r.id} row={r} mentioned />
              ))}
            </div>
          )}
        </MotionCard>

        <MotionCard stagger hoverLift={false} className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_recentGaps}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_gapsDesc, { brand: brandName })}</p>
          {!win ? (
            historyFailed
              ? <LoadErrorCard message="Couldn't load recent activity." onRetry={() => { void loadHistory(false) }} />
              : <Skeleton className="h-24 w-full rounded-lg" />
          ) : recentNotMentioned.length === 0 ? (
            checkedCount === 0 ? (
              /* Brand-new client with no data at all — NOT "great visibility!".
                 Fixes the false-positive celebratory state (DASHBOARD-UX-2026.md §9 step 7). */
              <EmptyState text={t.dash_noDataYet} ctaText={t.dash_noDataCta} to="/ai-visibility" />
            ) : (
              /* Genuine 100% mention rate — every checked prompt mentioned the brand.
                 Keep the celebratory text, no CTA (there's nothing to fix). */
              <p className="text-sm text-slate-500 py-8 text-center">{t.dash_noGaps}</p>
            )
          ) : (
            <div className="space-y-3">
              {recentNotMentioned.map(r => (
                <ResultRow key={r.id} row={r} mentioned={false} />
              ))}
            </div>
          )}
        </MotionCard>
      </motion.div>
      </div>
      </Collapse>
    </div>
  )
}

// LLM_COLOR/LLM_LABEL (a sixth independent hand-picked engine-colour map,
// keying off Tailwind class names rather than hex, which is why the earlier
// V5 hex/ENGINE_META greps never caught it) are DELETED —
// dashboard-visual-system.md §8.4: one source (ENGINE_META[id].chartColor),
// never a second hand-picked map. This one was live on Overview, the
// highest-traffic route, still rendering the pre-spec Claude-orange /
// Meta-amber pair the audit measured at dE 9.6 normal / 3.4 tritan.
// EngineTag mirrors ScoreBadge's swatch-plus-text-token treatment; the
// fallback keeps a historical row with a retired/unknown engine id rendering
// (grey dot, raw id as label) instead of blanking.
function EngineTag({ id }: { id: string }) {
  const meta = ENGINE_META[id as keyof typeof ENGINE_META]
  const chart = useChartTheme()
  return (
    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-dark-700 text-slate-300">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: meta?.chartColor ?? chart.sentimentNeutral }}
      />
      {meta?.label ?? id}
    </span>
  )
}

function ResultRow({ row, mentioned }: { row: RecentEntry; mentioned: boolean }) {
  const { t } = useI18n()
  return (
    <div className="flex items-start gap-3">
      <EngineTag id={row.llm} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">
          {row.text ?? `Prompt #${row.prompt_id}`}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {formatDate(row.checked_at)}
          {mentioned && row.brand_position != null && ` · ${formatOrdinal(row.brand_position)} position`}
        </p>
      </div>
      <span className={`shrink-0 text-[10px] font-semibold ${mentioned ? 'text-emerald-400' : 'text-red-400'}`}>
        {mentioned ? t.aiv_yes : t.aiv_no}
      </span>
    </div>
  )
}

// CTA-driven empty state (DASHBOARD-UX-2026.md §9.3) — a blank/muted chart reads
// as broken; naming the concrete next action that would populate the widget is
// the 2026 pattern. Uses the app's existing Link/react-router navigation.
function EmptyState({ text, ctaText, to }: { text: string; ctaText: string; to: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-slate-500 mb-3">{text}</p>
      <Link to={to}
        className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
        {ctaText} →
      </Link>
    </div>
  )
}

// Tiny at-a-glance trend line under a KPI value (DASHBOARD-UX-2026.md §9.4).
// No axes/grid/tooltip — pure trend shape. Animation deliberately off
// (isAnimationActive={false}) so it never replays a draw-in on re-render and
// needs no reduced-motion gate; §9 permits either that or the prefersReduced
// gate, and "off" is the more predictable choice for a 32px sparkline.
function Sparkline({ data, color, connectNulls = false }: {
  data: SparkPoint[]; color: string; connectNulls?: boolean
}) {
  return (
    <div className="h-8 w-full mt-1.5" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 1, bottom: 3, left: 1 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            dot={false} isAnimationActive={false} connectNulls={connectNulls} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Quiet KPI stat (Gestalt Focal-Point Law): neutral by default; the value only
// takes a semantic color when it's a genuine ANOMALY (tone 'warn'/'alert'), so
// color stays meaningful and the eye isn't pulled four directions at once.
// Rendered inside ONE shared KPI card (Hick's Law — one island, not four). The
// muted icon + one-line descriptor keep each number self-explanatory for a
// first-time reader without adding color noise.
function Stat({ icon, label, value, sub, tone = 'neutral', spark, connectNulls, emptyLabel = 'Not measured yet', pending = false }: {
  icon: React.ReactNode; label: string; value: string | null; sub: string
  tone?: 'neutral' | 'warn' | 'alert'; spark?: SparkPoint[]; connectNulls?: boolean
  emptyLabel?: string; pending?: boolean
}) {
  const valueColor = tone === 'alert' ? 'text-red-400' : tone === 'warn' ? 'text-amber-400' : 'text-white'
  // The sparkline stroke was hardcoded #94a3b8, which measures 2.56:1 against a
  // white page, below the 3:1 graphical minimum in light mode.
  const chart = useChartTheme()
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      {/* A null value is an ABSENCE, never a dash glyph. `value={'—'}` used to be
          passed here for an unmeasured average position, which reads as a broken
          string rather than "we have not measured this" (UI/UX audit 2026-07-30),
          besides breaking the no-dash content rule. The empty label sits in a
          fixed h-8 box so it occupies the same 32px line box as a real value and
          the four KPI columns stay on the same baseline grid. */}
      {pending
        ? <Skeleton className="h-8 w-16" />
        : value !== null
        ? <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
        : <div className="h-8 flex items-end text-sm italic text-slate-300 leading-snug">{emptyLabel}</div>}
      {spark && spark.length >= 2 && (
        <Sparkline data={spark} color={chart.axisInk} connectNulls={connectNulls} />
      )}
      <p className="text-xs text-slate-500 mt-1.5 leading-snug">{sub}</p>
    </div>
  )
}
