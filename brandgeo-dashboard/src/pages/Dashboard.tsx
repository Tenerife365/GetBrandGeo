import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { RefreshCw, Sparkles, ChevronDown, ChevronUp, TrendingUp, Target, Hash, Eye } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockPrompts, mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { useI18n, fmt } from '../lib/i18nContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { useTheme } from '../lib/themeContext'
import { ENGINE_META } from '../lib/planConfig'
import {
  computeAiVisibilityScore, buildScoreResultMap,
  type AiVisibilityDimensions, type ScoreInputRow,
} from '../lib/aiVisibilityScore'
import { staggerContainer, heroReveal, useCountUp, EASE_OUT } from '../lib/motion'
import { useChartTheme } from '../lib/chartTheme'
import MotionCard from '../components/MotionCard'
import Skeleton from '../components/Skeleton'
import Collapse from '../components/Collapse'
import type { LLMName, Sentiment, Prompt, AIResult } from '../types'

// Chart colors sourced from ENGINE_META (planConfig.ts), not hardcoded here — keeps this
// page's palette from drifting out of sync with AIVisibility.tsx (DESIGN-SYSTEM.md §1/§5).
const LLM_IDS: LLMName[] = ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai']
const LLMS = LLM_IDS.map(id => ({
  id,
  label: ENGINE_META[id].label,
  color: ENGINE_META[id].color,
  chartColor: ENGINE_META[id].chartColor,
}))

const DIMENSION_LABELS: [keyof AiVisibilityDimensions, string][] = [
  ['recognition', 'Recognition'], ['knowledge', 'Knowledge'], ['sentiment', 'Sentiment'],
  ['accuracy', 'Accuracy'], ['reach', 'Reach'], ['consistency', 'Consistency'],
]

interface AIResultRow {
  id: number
  prompt_id: number
  llm: LLMName
  response_snippet: string | null
  brand_mentioned: boolean
  brand_position: number | null
  sentiment: Sentiment
  checked_at: string
  competitors_mentioned: string | null
  prompts?: { text: string; category: string } | null
}

interface OverviewStats {
  totalChecks: number
  mentionRate: number
  avgPosition: number | null
  promptCount: number
}

/**
 * Top-of-page "what to do next" callout — DASHBOARD-UX-2026.md §6 Phase B.
 * Sourced from the persisted recommendation_runs/recommendations tables
 * (CLAUDE.md §14, Recommendations.tsx's loadHistory pattern), not recomputed
 * here — this reads the SAME advice a client would see on /recommendations,
 * it doesn't run its own rule-based generator.
 */
interface TopRec {
  id: number
  title: string
  priority: 'critical' | 'high' | 'medium'
}

function computeStats(rows: AIResultRow[]): OverviewStats {
  const mentionCount = rows.filter(r => r.brand_mentioned).length
  const posRows = rows.filter(r => r.brand_mentioned && r.brand_position != null)
  const avgPos = posRows.length > 0
    ? Math.round(posRows.reduce((s, r) => s + (r.brand_position ?? 0), 0) / posRows.length * 10) / 10
    : null
  const uniquePrompts = new Set(rows.map(r => r.prompt_id)).size
  return {
    totalChecks: rows.length,
    mentionRate: rows.length > 0 ? Math.round((mentionCount / rows.length) * 100) : 0,
    avgPosition: avgPos,
    promptCount: uniquePrompts,
  }
}

// A single sparkline point. avg-position buckets can be null (a bucket with no
// ranked mentions) — Sparkline's <Line connectNulls> draws across those gaps
// rather than dipping the line to a fake "position #0".
interface SparkPoint { v: number | null }

/**
 * KPI trend sparklines (DASHBOARD-UX-2026.md §9.4) — bucket the SAME rows already
 * fetched for the page into ~8 chronological slices (no new query) and derive a
 * per-bucket series for each KPI card that carries one: mention-rate %, avg
 * ranked position (nullable), and check volume. `rows` arrive newest-first, so
 * we sort ascending here for a left-to-right (oldest→newest) sparkline.
 */
function buildKpiSparklines(rows: AIResultRow[]): {
  mentionRate: SparkPoint[]
  avgPosition: SparkPoint[]
  volume: SparkPoint[]
} {
  const BUCKETS = 8
  const sorted = [...rows].sort(
    (a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
  )
  const mentionRate: SparkPoint[] = []
  const avgPosition: SparkPoint[] = []
  const volume: SparkPoint[] = []
  if (sorted.length === 0) return { mentionRate, avgPosition, volume }

  const size = Math.max(1, Math.ceil(sorted.length / BUCKETS))
  for (let i = 0; i < sorted.length; i += size) {
    const chunk = sorted.slice(i, i + size)
    const mentions = chunk.filter(r => r.brand_mentioned).length
    mentionRate.push({ v: Math.round((mentions / chunk.length) * 100) })
    const posRows = chunk.filter(r => r.brand_mentioned && r.brand_position != null)
    avgPosition.push({
      v: posRows.length > 0
        ? posRows.reduce((s, r) => s + (r.brand_position ?? 0), 0) / posRows.length
        : null,
    })
    volume.push({ v: chunk.length })
  }
  return { mentionRate, avgPosition, volume }
}

export default function Dashboard() {
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { t } = useI18n()
  const { getStartDate, timeRange } = useTimeFilter()
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

  const [rows, setRows]           = useState<AIResultRow[]>([])
  const [stats, setStats]         = useState<OverviewStats | null>(null)
  const [scoreData, setScoreData] = useState<{ dimensions: AiVisibilityDimensions; aiScore: number } | null>(null)
  const [loading, setLoading]     = useState(true)
  const [topRecs, setTopRecs]     = useState<TopRec[]>([])
  const [recsLoaded, setRecsLoaded] = useState(false)
  // Progressive disclosure (Hick's Law) — detail charts/lists start hidden.
  const [showDetails, setShowDetails] = useState(false)

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      const demoRows: AIResultRow[] = mockAIResults.map((r: AIResult) => {
        const p = mockPrompts.find((mp: Prompt) => mp.id === r.prompt_id)
        return {
          ...r,
          competitors_mentioned: r.competitors_mentioned ?? null,
          prompts: p ? { text: p.text, category: p.category } : null,
        }
      })
      setRows(demoRows)
      setStats(computeStats(demoRows))

      // AI Visibility Score — same shared computation as AIVisibility.tsx, deliberately
      // all-time (not time-filtered) so both pages always show the identical headline number.
      const scoreMap = buildScoreResultMap(mockAIResults, activeEngines)
      setScoreData(computeAiVisibilityScore(mockPrompts.map(p => p.id), scoreMap, activeEngines))

      setLoading(false)
      return
    }

    const startDate = getStartDate()
    // .neq('status','error') — API-failure rows are not real "not mentioned"
    // results; counting them tanked every KPI/chart on this page (CLAUDE.md §4.8,
    // CLIENT-HEALTH-BPR.md §4.6). AIVisibility.tsx already excluded them.
    let query = supabase
      .from('ai_results')
      .select('*, prompts(text, category)')
      .eq('client_id', activeClientId)
      .neq('status', 'error')
      .order('checked_at', { ascending: false })
      .limit(1000)
    if (startDate) query = query.gte('checked_at', startDate.toISOString())

    const [{ data, error }, { data: pData }, { data: scoreRows }] = await Promise.all([
      query,
      supabase.from('prompts').select('id').eq('is_active', true).eq('client_id', activeClientId),
      // Score query: deliberately all-time (no startDate) so the headline number
      // never disagrees with AI Visibility's. Now also ordered + error-filtered +
      // carrying checked_at/status, so buildScoreResultMap can enforce
      // newest-non-error-wins itself rather than trusting this query's shape.
      supabase.from('ai_results')
        .select('prompt_id, llm, brand_mentioned, brand_position, sentiment, checked_at, status')
        .eq('client_id', activeClientId)
        .neq('status', 'error')
        .order('checked_at', { ascending: false }),
    ])

    if (!error && data) {
      const r = data as AIResultRow[]
      setRows(r)
      setStats(computeStats(r))
    }

    if (pData && scoreRows) {
      const scoreMap = buildScoreResultMap(scoreRows as unknown as ScoreInputRow[], activeEngines)
      setScoreData(computeAiVisibilityScore(pData.map((p: { id: number }) => p.id), scoreMap, activeEngines))
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId, timeRange])

  // "What to do next" — reads the SAME persisted advice Recommendations.tsx
  // shows (recommendation_runs/recommendations, CLAUDE.md §14), it does not
  // generate its own. Independent of the main load() above so a slower
  // recs fetch never delays the rest of the page — DASHBOARD-UX-2026.md §7's
  // "never delay already-loaded data for the sake of an effect" cuts both
  // ways: this data loading a beat later than the rest is fine, since the
  // callout only renders once it has real data (recsLoaded && topRecs.length).
  useEffect(() => {
    if (isDemoMode || !activeClientId) { setTopRecs([]); setRecsLoaded(true); return }
    let cancelled = false
    ;(async () => {
      setRecsLoaded(false)
      const { data: runRows } = await supabase
        .from('recommendation_runs')
        .select('id')
        .eq('client_id', activeClientId)
        .order('generated_at', { ascending: false })
        .limit(1)
      const runId = runRows?.[0]?.id
      if (!runId) {
        if (!cancelled) { setTopRecs([]); setRecsLoaded(true) }
        return
      }
      const { data } = await supabase
        .from('recommendations')
        .select('id, title, priority, status')
        .eq('run_id', runId)
        .neq('status', 'dismissed')
        .order('position', { ascending: true })
        .limit(2)
      if (!cancelled) {
        setTopRecs((data ?? []) as TopRec[])
        setRecsLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [activeClientId])

  // Count-up target is real, already-loaded scoreData — active flips true only
  // once the fetch has resolved, so this animates the display, never the data.
  const displayedScore = useCountUp(scoreData?.aiScore ?? 0, !!scoreData)

  const llmData = LLMS.map(l => {
    const lRows     = rows.filter(r => r.llm === l.id)
    const lMentions = lRows.filter(r => r.brand_mentioned).length
    return {
      label:     l.label,
      rate:      lRows.length > 0 ? Math.round((lMentions / lRows.length) * 100) : 0,
      count:     lRows.length,
      color:     l.chartColor,
      textColor: l.color,
    }
  }).filter(d => d.count > 0)

  const recentMentioned   = rows.filter(r => r.brand_mentioned).slice(0, 5)
  const recentNotMentioned = rows.filter(r => !r.brand_mentioned).slice(0, 5)

  // KPI trend sparklines — DASHBOARD-UX-2026.md §9.4. Built from the SAME rows
  // already fetched (no new query). Avg-position only gets a sparkline when it
  // has ≥2 real (non-null) buckets, so a brand that's never ranked doesn't show
  // an empty 32px gap.
  const spark = buildKpiSparklines(rows)
  const avgPosSpark = spark.avgPosition.filter(p => p.v != null).length >= 2
    ? spark.avgPosition
    : undefined

  // Ring sweep math — DASHBOARD-UX-2026.md §6 Phase B. RING_R must match the
  // SVG circles' r="54" below (kept as one constant so the two never drift).
  const RING_R = 54
  const RING_CIRC = 2 * Math.PI * RING_R
  const ringOffset = scoreData
    ? RING_CIRC - (scoreData.aiScore / 100) * RING_CIRC
    : RING_CIRC

  // Content-shaped skeleton (DASHBOARD-UX-2026.md §6 Phase C) — mirrors the real
  // page's layout below (header / hero score card / KPI grid / two chart cards)
  // so the page doesn't visually jump/reflow once data arrives (CLS). Replaces
  // the old centered "pulsing text" spinner.
  if (loading) return (
    <div className="p-5 sm:p-8 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="bg-dark-800 rounded-xl p-6 sm:p-10 mb-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
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

  return (
    <div className="p-5 sm:p-8 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{greeting}, {brandName}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Here&apos;s your AI visibility snapshot.</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm text-slate-300 transition-colors border border-dark-600">
          <RefreshCw size={15} />{t.dash_refresh}</button>
      </div>

      {scoreData && (
        <motion.div
          className="bg-dark-800 rounded-xl p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-10"
          variants={heroReveal} initial="hidden" animate="show"
        >
          <div className="flex flex-col items-center gap-3 shrink-0">
            <svg viewBox="0 0 120 120" className="w-36 h-36 sm:w-48 sm:h-48" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="overviewScoreRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#2a1cf5" />
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
                <tspan fontSize="14" fontWeight="500" fill={theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)'} dy="-13">%</tspan>
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
            <Link to="/ai-visibility"
              className="col-span-2 sm:col-span-3 mt-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
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
      {stats && (
        <motion.div
          className="bg-dark-800 rounded-xl p-6 sm:p-7 mb-6"
          variants={heroReveal} initial="hidden" animate="show"
        >
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Key metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            <Stat
              icon={<TrendingUp size={15} />}
              label={t.dash_statMentionRate}
              value={`${stats.mentionRate}%`}
              sub={t.dash_statMentionRateSub}
              tone={stats.mentionRate < 25 ? 'alert' : stats.mentionRate < 50 ? 'warn' : 'neutral'}
              spark={spark.mentionRate}
            />
            <Stat
              icon={<Target size={15} />}
              label={t.dash_statAvgPos}
              value={stats.avgPosition != null ? `#${stats.avgPosition}` : '—'}
              sub={t.dash_statAvgPosSub}
              tone={stats.avgPosition != null && stats.avgPosition > 6 ? 'warn' : 'neutral'}
              spark={avgPosSpark}
              connectNulls
            />
            <Stat icon={<Hash size={15} />} label={t.dash_statPrompts} value={String(stats.promptCount)} sub={t.dash_statPromptsSub} />
            <Stat icon={<Eye size={15} />} label={t.dash_statChecks} value={String(stats.totalChecks)} sub={t.dash_statChecksDesc} spark={spark.volume} />
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
        <MotionCard stagger className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_mentionRate}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_mentionRateDesc, { brand: brandName })}</p>
          {llmData.length === 0 ? (
            <EmptyState text={t.dash_noResults} ctaText={t.dash_noDataCta} to="/ai-visibility" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={llmData} margin={{ left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: chart.axisTick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chart.axisTick, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={chart.tooltipContent}
                  labelStyle={chart.tooltipLabel} itemStyle={chart.tooltipItem}
                  formatter={(v: any) => [`${v}%`, 'Mention rate']}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                {/* Single calm brand hue — the x-axis label already identifies each
                    engine, so 5 different bar colors was decorative rainbow, not
                    meaning (Gestalt Focal-Point Law). */}
                <Bar
                  dataKey="rate"
                  fill="#6c63ff"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
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

        <MotionCard stagger className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">{t.dash_brandVisibility}</h2>
          {stats && stats.totalChecks > 0 ? (
            <>
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{brandName} mentioned</span>
                  <span>{Math.round(stats.mentionRate)}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.mentionRate >= 50 ? 'bg-emerald-500' : stats.mentionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.mentionRate}%` }}
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
        <MotionCard stagger className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_recentMentions}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_mentionsDesc, { brand: brandName })}</p>
          {recentMentioned.length === 0 ? (
            (stats?.totalChecks ?? 0) === 0 ? (
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

        <MotionCard stagger className="bg-dark-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_recentGaps}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_gapsDesc, { brand: brandName })}</p>
          {recentNotMentioned.length === 0 ? (
            (stats?.totalChecks ?? 0) === 0 ? (
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

const LLM_COLOR: Record<string, string> = {
  chatgpt:    'text-emerald-400 bg-emerald-400/10',
  gemini:     'text-blue-400 bg-blue-400/10',
  claude:     'text-orange-400 bg-orange-400/10',
  perplexity: 'text-cyan-400 bg-cyan-400/10',
  meta:       'text-amber-400 bg-amber-400/10',
}
const LLM_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', perplexity: 'Perplexity', meta: 'Meta AI'
}

function ResultRow({ row, mentioned }: { row: AIResultRow; mentioned: boolean }) {
  const { t } = useI18n()
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${LLM_COLOR[row.llm] ?? 'text-slate-400 bg-slate-400/10'}`}>
        {LLM_LABEL[row.llm] ?? row.llm}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">
          {row.prompts?.text ?? `Prompt #${row.prompt_id}`}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {new Date(row.checked_at).toLocaleDateString('en-GB')}
          {mentioned && row.brand_position != null && ` · position #${row.brand_position}`}
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
function Stat({ icon, label, value, sub, tone = 'neutral', spark, connectNulls }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  tone?: 'neutral' | 'warn' | 'alert'; spark?: SparkPoint[]; connectNulls?: boolean
}) {
  const valueColor = tone === 'alert' ? 'text-red-400' : tone === 'warn' ? 'text-amber-400' : 'text-white'
  // The sparkline stroke was hardcoded #94a3b8, which measures 2.56:1 against a
  // white page — below the 3:1 graphical minimum in light mode.
  const chart = useChartTheme()
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
      {spark && spark.length >= 2 && (
        <Sparkline data={spark} color={chart.axisTick} connectNulls={connectNulls} />
      )}
      <p className="text-xs text-slate-500 mt-1.5 leading-snug">{sub}</p>
    </div>
  )
}
