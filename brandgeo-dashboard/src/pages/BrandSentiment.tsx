/**
 * BrandSentiment.tsx
 * Driven entirely from ai_results (brand_mentioned = true rows) -- sentiment is only
 * meaningful once the brand actually appears in a response (see collect-prompt.js:
 * sentiment stays 'neutral' by default and is only scored positive/negative when mentioned).
 * Shows an overall sentiment score, positive/neutral/negative breakdown, per-engine
 * breakdown, a trend over time, and a filterable feed of the underlying AI responses.
 */

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { motion } from 'motion/react'
import { Smile, Meh, Frown, ChevronDown, Sparkles } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAIResults, mockPrompts } from '../lib/mockData'
import { useMarket } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import { useCollection } from '../lib/collectionContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { useChartTheme } from '../lib/chartTheme'
import { staggerContainer } from '../lib/motion'
import MotionCard from '../components/MotionCard'
import { SentimentDot } from '../components/ScoreBadge'
import EngineChip from '../components/EngineChip'
import { PageTitle } from '../components/Typography'
import ChartTooltip from '../components/ChartTooltip'
import ChartLegend from '../components/ChartLegend'
import SharedEmptyState from '../components/EmptyState'
import { formatDate } from '../lib/format'
import type { LLMName, Sentiment } from '../types'

// --- Types -------------------------------------------------------------------

interface SentimentEvent {
  id: number
  prompt_id: number
  promptText: string
  llm: LLMName
  sentiment: Sentiment
  brand_position: number | null
  response_snippet: string | null
  checked_at: string
}

interface SentimentCounts { positive: number; neutral: number; negative: number }

const emptyCounts = (): SentimentCounts => ({ positive: 0, neutral: 0, negative: 0 })

// --- Data computation --------------------------------------------------------

function computeStats(events: SentimentEvent[]) {
  const total = events.length
  const counts = emptyCounts()
  const byEngine: Partial<Record<LLMName, SentimentCounts & { total: number }>> = {}

  for (const e of events) {
    if (e.sentiment === 'positive' || e.sentiment === 'neutral' || e.sentiment === 'negative') {
      counts[e.sentiment]++
    }
    if (!byEngine[e.llm]) byEngine[e.llm] = { ...emptyCounts(), total: 0 }
    const eng = byEngine[e.llm]!
    eng.total++
    if (e.sentiment === 'positive' || e.sentiment === 'neutral' || e.sentiment === 'negative') {
      eng[e.sentiment]++
    }
  }

  // 0-100 weighted score: positive=100pts, neutral=50pts, negative=0pts
  const score = total > 0
    ? Math.round((counts.positive * 100 + counts.neutral * 50) / total)
    : null

  return { total, counts, byEngine, score }
}

// Sentiment tokens (dashboard-visual-system.md §8.5) carry the two unambiguous
// ends; "Mixed / Neutral" now uses the neutral token too (was blue — Gemini's
// engine hue, a direct F-14-class collision). Amber stays for the one band
// with no defined token ("Needs Attention" sits between neutral and negative).
function scoreMeta(score: number | null) {
  if (score === null) return { label: 'No data yet', color: 'text-slate-500' }
  if (score >= 75) return { label: 'Mostly Positive', color: 'text-sentiment-positive' }
  if (score >= 50) return { label: 'Mixed / Neutral', color: 'text-sentiment-neutral' }
  if (score >= 25) return { label: 'Needs Attention', color: 'text-amber-400' }
  return { label: 'Mostly Negative', color: 'text-sentiment-negative' }
}

type TrendPeriod = 'weekly' | 'monthly' | 'quarterly'

function computeTrend(events: SentimentEvent[], period: TrendPeriod) {
  if (!events.length) return []

  const getPeriodKey = (date: Date): string => {
    if (period === 'weekly') {
      const d = new Date(date)
      d.setDate(d.getDate() - d.getDay())
      return d.toISOString().slice(0, 10)
    } else if (period === 'monthly') {
      return date.toISOString().slice(0, 7)
    } else {
      const q = Math.floor(date.getMonth() / 3) + 1
      return `${date.getFullYear()} Q${q}`
    }
  }

  const buckets: Record<string, SentimentCounts> = {}
  for (const e of events) {
    const key = getPeriodKey(new Date(e.checked_at))
    if (!buckets[key]) buckets[key] = emptyCounts()
    if (e.sentiment === 'positive' || e.sentiment === 'neutral' || e.sentiment === 'negative') {
      buckets[key][e.sentiment]++
    }
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, c]) => ({ period: p, Positive: c.positive, Neutral: c.neutral, Negative: c.negative }))
}

/**
 * Same segmented-control hit-area treatment as Competitors.tsx, and the same
 * reasoning, which is written out in full there. Short version: these chips
 * measured 24.5x20.5 in the first audit and 32x33 after the earlier pass. The
 * visual stays 32x32; a transparent `::after` at -6px on all four sides takes
 * the TARGET to 44x44 at every width, replacing a coarse-pointer query that left
 * a narrow desktop window (still `pointer: fine`) at 32x33.
 *
 * The group gap goes from 4px to 12px because that is the exact arithmetic floor
 * for three non-overlapping 44px targets around 32px visuals. Do not lower it.
 *
 * Duplicated rather than shared because this fix is scoped to two page files
 * and a shared control would have to live in src/components/. Worth extracting
 * next time either page is opened; noted in the handoff.
 */
const TREND_CHIP_TARGET =
  "relative inline-flex items-center justify-center min-w-[32px] min-h-[32px] " +
  "after:content-[''] after:absolute after:-inset-1.5"
const TREND_GROUP = 'flex gap-3 bg-dark-700 rounded-lg p-1'

function buildEngineSentimentData(
  byEngine: Partial<Record<LLMName, SentimentCounts & { total: number }>>,
  activeEngines: EngineId[],
) {
  return activeEngines
    .filter(e => (byEngine[e]?.total ?? 0) > 0)
    .map(engine => {
      const eng = byEngine[engine]!
      return {
        engine: ENGINE_META[engine].label,
        Positive: Math.round(eng.positive / eng.total * 100),
        Neutral: Math.round(eng.neutral / eng.total * 100),
        Negative: Math.round(eng.negative / eng.total * 100),
      }
    })
}

// --- Main component ----------------------------------------------------------

type SentimentFilter = Sentiment | 'all'
type EngineFilter = LLMName | 'all'

export default function BrandSentiment() {
  const { primaryMarket } = useMarket()
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { lastCompletedAt } = useCollection()
  const { getStartDate, timeRange } = useTimeFilter()
  const chart = useChartTheme()
  const brandName = activeClient?.name ?? 'Your brand'

  const [events, setEvents] = useState<SentimentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('weekly')
  const [filterSentiment, setFilterSentiment] = useState<SentimentFilter>('all')
  const [filterEngine, setFilterEngine] = useState<EngineFilter>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = async (opts: { silent?: boolean } = {}) => {
    // Silent: a background reload triggered by lastCompletedAt, not a fresh
    // page open. Data is already on screen, so this must never bounce the
    // page back to the loading skeleton mid-view (same reasoning as
    // AIVisibility.tsx's load({ silent: true })).
    if (!opts.silent) setLoading(true)

    if (isDemoMode) {
      const demo: SentimentEvent[] = mockAIResults
        .filter(r => r.brand_mentioned)
        .map(r => {
          const prompt = mockPrompts.find(p => p.id === r.prompt_id)
          // Demo data only stores 'positive'/'neutral' — derive a bit of realistic
          // variety (incl. negative) from position so the demo isn't 100% positive.
          const pos = r.brand_position
          const demoSentiment: Sentiment =
            pos !== null && pos <= 2 ? 'positive' :
            pos !== null && pos === 3 ? 'neutral' :
            pos !== null && pos >= 4 ? 'negative' : 'positive'
          return {
            id: r.id,
            prompt_id: r.prompt_id,
            promptText: prompt?.text ?? '',
            llm: r.llm as LLMName,
            sentiment: demoSentiment,
            brand_position: r.brand_position,
            response_snippet: r.response_snippet,
            checked_at: r.checked_at,
          }
        })
        .filter(e => activeEngines.includes(e.llm))
      setEvents(demo)
      setLoading(false)
      return
    }

    let q = supabase.from('ai_results')
      .select('id, prompt_id, llm, sentiment, brand_position, response_snippet, checked_at, prompts(text)')
      .eq('client_id', activeClientId)
      .eq('brand_mentioned', true)
    const startDate = getStartDate()
    if (startDate) q = q.gte('checked_at', startDate.toISOString())

    const { data } = await q.order('checked_at', { ascending: false })

    const mapped: SentimentEvent[] = (data ?? []).map((r: any) => ({
      id: r.id,
      prompt_id: r.prompt_id,
      promptText: r.prompts?.text ?? '',
      llm: r.llm,
      sentiment: r.sentiment,
      brand_position: r.brand_position,
      response_snippet: r.response_snippet,
      checked_at: r.checked_at,
    })).filter(e => activeEngines.includes(e.llm))

    setEvents(mapped)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId, activeEngines.join(','), timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload quietly every time a collection run completes, not just once at
  // the very end -- lastCompletedAt bumps incrementally as jobs land (see
  // collectionContext.tsx), so this must never assume a single final bump.
  useEffect(() => { if (lastCompletedAt > 0) load({ silent: true }) }, [lastCompletedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading sentiment data…</div>

  const { total, counts, byEngine, score } = computeStats(events)
  const { label: scoreLabel, color: scoreColor } = scoreMeta(score)
  const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0
  const trendData = computeTrend(events, trendPeriod)
  const engineData = buildEngineSentimentData(byEngine, activeEngines)

  const filtered = events.filter(e => {
    if (filterSentiment !== 'all' && e.sentiment !== filterSentiment) return false
    if (filterEngine !== 'all' && e.llm !== filterEngine) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-0.5">
          <PageTitle>Brand Sentiment</PageTitle>
          {primaryMarket && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
              {primaryMarket.flag} {primaryMarket.id} results
            </span>
          )}
        </div>
        {/* The em dash is gone (audit F4) and so is the second {brandName}: the
            old string named the brand twice, which reads badly for anything
            longer than one word. "mention{s}" agrees with the count — the old
            copy said "1 response that mention", which was already wrong. */}
        <p className="text-sm text-slate-400 mt-0.5">
          {total === 0
            ? 'No responses measured yet.'
            : <>How AI engines talk about {brandName}, measured across {total} response{total !== 1 ? 's' : ''} that
              {' '}mention{total === 1 ? 's' : ''} it</>}
        </p>
      </div>

      {/* Summary cards. Every card carries a border: the score card previously had
          border-brand-500/30 while the other three had none at all, so the row read
          as one boxed card next to three floating patches. The score card keeps the
          brand-tinted border to mark it as the primary metric — the difference is now
          the border's COLOUR, not its existence. Stagger entrance matches the other
          insight pages (Dashboard, AI Visibility), which this page lacked entirely. */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        variants={staggerContainer} initial="hidden" animate="show"
      >
        <MotionCard stagger hoverLift={false} className="bg-dark-800 border border-brand-500/30 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={12} className="text-brand-400" />
            <span className="text-xs text-slate-500">Sentiment score</span>
          </div>
          {/* The null branch used to render a bare em dash. A dash is not a
              measurement and does not say why there is none, which is the same
              defect fixed on /competitors (audit F4/F5). text-slate-500 is the
              muted step that is remapped legibly in both themes
              (index.css:143 dark, :170 light). */}
          <div className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
            {score !== null
              ? score
              : <span className="text-base font-semibold text-slate-500">Not measured</span>}
            {score !== null && <span className="text-sm text-slate-500 font-normal">/100</span>}
          </div>
          <div className={`text-xs mt-0.5 ${scoreColor}`}>{scoreLabel}</div>
        </MotionCard>
        <MotionCard stagger hoverLift={false} className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Smile size={12} className={total === 0 ? 'text-slate-500' : 'text-sentiment-positive'} />
            <span className="text-xs text-slate-500">Positive</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${total === 0 ? 'text-slate-500' : 'text-sentiment-positive'}`}>{counts.positive}</div>
          {/* No "% of mentions" caption at total 0 -- a percentage of zero
              measurements is not a measurement (same reasoning as the score
              card's null branch just above). */}
          {total > 0 && <div className="text-xs text-slate-500 mt-0.5">{pct(counts.positive)}% of mentions</div>}
        </MotionCard>
        <MotionCard stagger hoverLift={false} className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Meh size={12} className={total === 0 ? 'text-slate-500' : 'text-sentiment-neutral'} />
            <span className="text-xs text-slate-500">Neutral</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${total === 0 ? 'text-slate-500' : 'text-slate-300'}`}>{counts.neutral}</div>
          {total > 0 && <div className="text-xs text-slate-500 mt-0.5">{pct(counts.neutral)}% of mentions</div>}
        </MotionCard>
        <MotionCard stagger hoverLift={false} className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Frown size={12} className={total === 0 ? 'text-slate-500' : 'text-sentiment-negative'} />
            <span className="text-xs text-slate-500">Negative</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${total === 0 ? 'text-slate-500' : 'text-sentiment-negative'}`}>{counts.negative}</div>
          {total > 0 && <div className="text-xs text-slate-500 mt-0.5">{pct(counts.negative)}% of mentions</div>}
        </MotionCard>
      </motion.div>

      {total === 0 ? (
        <div className="bg-dark-800 rounded-xl mb-6">
          <SharedEmptyState
            icon={Meh}
            title="Not measured yet"
            body={`Sentiment appears here once AI engines mention ${brandName}. Run a collection to check.`}
            actionLabel="Run a collection"
            actionTo="/ai-visibility"
            minHeight={220}
          />
        </div>
      ) : (
        <>
          {/* Overall breakdown bar */}
          <div className="bg-dark-800 rounded-xl p-5 mb-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Overall Breakdown
            </h2>
            {/* Fixed order, positive-neutral-negative, left to right — position
                also encodes polarity, per §8.5's mandatory secondary encoding. */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-dark-700">
              {counts.positive > 0 && <div className="h-full bg-sentiment-positive" style={{ width: `${pct(counts.positive)}%` }} title={`Positive ${pct(counts.positive)}%`} />}
              {counts.neutral > 0 && <div className="h-full bg-sentiment-neutral" style={{ width: `${pct(counts.neutral)}%` }} title={`Neutral ${pct(counts.neutral)}%`} />}
              {counts.negative > 0 && <div className="h-full bg-sentiment-negative" style={{ width: `${pct(counts.negative)}%` }} title={`Negative ${pct(counts.negative)}%`} />}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-sentiment-positive" />Positive {pct(counts.positive)}%</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-sentiment-neutral" />Neutral {pct(counts.neutral)}%</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-sentiment-negative" />Negative {pct(counts.negative)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Sentiment by engine */}
            <div className="bg-dark-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                Sentiment by Engine
              </h2>
              <p className="text-[11px] text-slate-600 mb-3">% of {brandName} mentions per AI engine</p>
              {engineData.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-600">No per-engine data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={engineData} margin={{ left: -20, right: 8, bottom: 4 }} barCategoryGap="25%">
                    {/* Solid hairline grid, no dashing (§9.2 F-21 — dashing reads as
                        "projection", this is neither) */}
                    <CartesianGrid stroke={chart.gridLine} strokeWidth={1} vertical={false} />
                    <XAxis dataKey="engine" tick={{ fill: chart.axisInk, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: chart.axisInk, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} width={40} tickCount={4} />
                    <Tooltip
                      content={<ChartTooltip formatValue={item => `${item.value}%`} />}
                      cursor={{ fill: chart.gridLine, fillOpacity: 0.35 }}
                    />
                    <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
                    {/* Fixed order + a stroke gap between segments so they read as
                        separate quantities, not one blended bar (§9.5). */}
                    <Bar dataKey="Positive" stackId="s" fill={chart.sentimentPositive} stroke={chart.cardSurface} strokeWidth={2} maxBarSize={28} />
                    <Bar dataKey="Neutral" stackId="s" fill={chart.sentimentNeutral} stroke={chart.cardSurface} strokeWidth={2} maxBarSize={28} />
                    <Bar dataKey="Negative" stackId="s" fill={chart.sentimentNegative} stroke={chart.cardSurface} strokeWidth={2} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Trend over time */}
            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Sentiment Over Time
                </h2>
                <div className={TREND_GROUP}>
                  {(['weekly', 'monthly', 'quarterly'] as const).map(p => (
                    <button key={p} onClick={() => setTrendPeriod(p)}
                      aria-pressed={trendPeriod === p}
                      aria-label={`View ${p} trend`}
                      className={`${TREND_CHIP_TARGET} px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                        trendPeriod === p ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      {p === 'weekly' ? 'W' : p === 'monthly' ? 'M' : 'Q'}
                    </button>
                  ))}
                </div>
              </div>
              {trendData.length < 2 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">Not enough data yet</p>
                  <p className="text-xs text-slate-600 mt-1">Trend fills in as collections accumulate</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke={chart.gridLine} strokeWidth={1} vertical={false} />
                    <XAxis dataKey="period" tick={{ fill: chart.axisInk, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fill: chart.axisInk, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={40} tickCount={4} />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: chart.gridLine, strokeWidth: 1 }}
                    />
                    <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
                    {/* All series the same strokeWidth (§9.5) — the old 2 vs 1.5 said
                        "Positive matters more" when it doesn't. */}
                    <Line type="monotone" dataKey="Positive" stroke={chart.sentimentPositive} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: chart.cardSurface }} />
                    <Line type="monotone" dataKey="Neutral" stroke={chart.sentimentNeutral} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: chart.cardSurface }} />
                    <Line type="monotone" dataKey="Negative" stroke={chart.sentimentNegative} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: chart.cardSurface }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent sentiment signals */}
          <div>
            {/* Matches the section-heading treatment used by the cards above —
                this was text-sm/slate-300 while the sibling section headings on
                the same screen were text-xs/uppercase/slate-400. */}
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Sentiment Signals</h2>

            <div className="flex flex-wrap gap-2 mb-3">
              {(['all', 'positive', 'neutral', 'negative'] as const).map(s => (
                <button key={s} onClick={() => setFilterSentiment(s)}
                  aria-pressed={filterSentiment === s}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    filterSentiment === s
                      ? 'bg-brand-500/30 text-brand-300 border-brand-500/40'
                      : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600'
                  }`}>
                  {s !== 'all' && <SentimentDot value={s} />}
                  {s === 'all' ? `All (${total})` : `${s[0].toUpperCase()}${s.slice(1)} (${counts[s as keyof SentimentCounts]})`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFilterEngine('all')}
                aria-pressed={filterEngine === 'all'}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                  filterEngine === 'all' ? 'bg-brand-500/30 text-brand-300 border-brand-500/40' : 'bg-dark-800 text-slate-500 border-dark-700 hover:border-dark-600'
                }`}>
                All engines
              </button>
              {activeEngines.filter(e => (byEngine[e]?.total ?? 0) > 0).map(e => (
                <EngineChip
                  key={e}
                  id={e as EngineId}
                  selected={filterEngine === e}
                  onClick={() => setFilterEngine(e === filterEngine ? 'all' : e)}
                />
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map(e => {
                const engineId = (ENGINE_META[e.llm as EngineId] ? e.llm : 'chatgpt') as EngineId
                const isOpen = expanded === e.id
                return (
                  <div key={e.id} className="bg-dark-800 rounded-xl overflow-hidden">
                    <button className="w-full text-left px-5 py-4 hover:bg-dark-700/30 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                      aria-expanded={isOpen}>
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 text-center mt-0.5">
                          {e.brand_position ? (
                            <>
                              <div className="text-lg font-bold text-sentiment-positive tabular-nums">#{e.brand_position}</div>
                              <div className="text-[10px] text-slate-600">pos</div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-600 mt-1">-</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <EngineChip id={engineId} interactive={false} />
                            <span className="flex items-center gap-1 text-xs text-slate-400 capitalize">
                              <SentimentDot value={e.sentiment} />{e.sentiment}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 truncate">{e.promptText}</p>
                        </div>
                        <ChevronDown size={15}
                          className={`shrink-0 text-slate-600 transition-transform mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isOpen && e.response_snippet && (
                      <div className="border-t border-dark-700 px-5 py-4 bg-dark-700/20">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Response snippet</div>
                        <blockquote className={`text-sm text-slate-300 italic leading-relaxed border-l-2 pl-3 ${
                          e.sentiment === 'positive' ? 'border-sentiment-positive' : e.sentiment === 'negative' ? 'border-sentiment-negative' : 'border-sentiment-neutral'
                        }`}>
                          "{e.response_snippet}"
                        </blockquote>
                        <div className="mt-3 text-xs text-slate-600">
                          Checked {formatDate(e.checked_at)}
                        </div>
                      </div>
                    )}
                    {isOpen && !e.response_snippet && (
                      <div className="border-t border-dark-700 px-5 py-3 bg-dark-700/20 text-xs text-slate-600 italic">
                        No response snippet captured for this mention.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm">
                No signals match this filter.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
