/**
 * BrandSentiment.tsx
 * Snapshot numbers (score, counts, per-engine chart) come from the shared results
 * layer: useResults() plus metrics.ts over the newest usable cell per active
 * prompt and engine. The trend and the signals feed come from paged, time-windowed
 * history (readResultHistory), so neither is cut at the 1,000-row cap.
 * Pure logic lives in lib/views/sentimentView.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { motion } from 'motion/react'
import { Smile, Meh, Frown, ChevronDown, Sparkles } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { useCollection } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { useTimeFilter } from '../lib/timeFilterContext'
import { useResults } from '../lib/resultsContext'
import { isOwn, ownRows, nextSeq, isStale } from '../lib/resultsGuards'
import { buildSnapshotView } from '../lib/metrics'
import { readResultHistory } from '../lib/historyRead'
import {
  buildSentimentView, buildEngineSentimentData, computeTrend, scoreMeta, feedRows, feedCounts, filterFeed,
  type SentimentHistoryRow, type TrendPeriod, type SentimentKey,
} from '../lib/views/sentimentView'
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
import LoadErrorCard from '../components/LoadErrorCard'
import RouteSkeleton from '../components/RouteSkeleton'
import Skeleton from '../components/Skeleton'
import { formatDate } from '../lib/format'
import type { Sentiment } from '../types'

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

type SentimentFilter = SentimentKey | 'all'
type EngineFilter = string

const HISTORY_COLUMNS = 'id, prompt_id, llm, sentiment, brand_position, response_snippet, checked_at'

interface HistoryState {
  status: 'loading' | 'ready' | 'error'
  rows: SentimentHistoryRow[]
  /** The client the rows belong to; rows of another client are never shown. */
  clientId: number
}

/**
 * Paged, windowed history of mentioned rows for the trend and the feed. Reloads
 * on client change, window change and every collection landing, each guarded by
 * a sequence number so a slow earlier read can never overwrite a newer one.
 */
function useSentimentHistory(
  clientId: number,
  sinceIso: string | null,
  lastCompletedAt: number,
) {
  const [state, setState] = useState<HistoryState>({ status: 'loading', rows: [], clientId })
  const seq = useRef(0)

  const load = useCallback(async (quiet: boolean) => {
    const mine = nextSeq(seq)
    if (!quiet) setState(prev => ({ status: 'loading', rows: prev.clientId === clientId ? prev.rows : [], clientId }))
    if (isDemoMode) {
      const since = sinceIso ? new Date(sinceIso).getTime() : null
      const rows: SentimentHistoryRow[] = mockAIResults
        .filter(r => r.brand_mentioned && (since === null || new Date(r.checked_at).getTime() >= since))
        .map(r => ({
          id: r.id,
          prompt_id: r.prompt_id,
          llm: r.llm as string,
          sentiment: r.sentiment as string,
          brand_position: r.brand_position,
          response_snippet: r.response_snippet,
          checked_at: r.checked_at,
        }))
        .sort((a, b) => b.checked_at.localeCompare(a.checked_at))
      if (!isStale(seq, mine)) setState({ status: 'ready', rows, clientId })
      return
    }
    const res = await readResultHistory<SentimentHistoryRow>(supabase, {
      clientId, sinceIso, columns: HISTORY_COLUMNS, mentionedOnly: true,
    })
    if (isStale(seq, mine)) return
    if (res.error) {
      console.error('[BrandSentiment] history load failed:', res.error)
      setState(prev => ({ status: 'error', rows: quiet && prev.clientId === clientId ? prev.rows : [], clientId }))
      return
    }
    setState({ status: 'ready', rows: res.rows, clientId })
  }, [clientId, sinceIso])

  useEffect(() => { void load(false) }, [load])
  useCollectionLanded(lastCompletedAt, () => { void load(true) })
  // On the render right after a client switch the state still holds the old
  // client's rows; expose none of them.
  const mineNow = isOwn(state, clientId)
  return {
    status: mineNow ? state.status : 'loading' as const,
    rows: ownRows(state, clientId, [] as SentimentHistoryRow[]),
    reload: () => { void load(false) },
  }
}

// --- Main component ----------------------------------------------------------

export default function BrandSentiment() {
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { lastCompletedAt } = useCollection()
  const { getStartDate, timeRange } = useTimeFilter()
  const chart = useChartTheme()
  const brandName = activeClient?.name ?? 'Your brand'
  const { snapshot, status, loadError, reload } = useResults()

  // timeRange is the dependency that changes the window; getStartDate reads it.
  const sinceIso = useMemo(
    () => getStartDate()?.toISOString() ?? null,
    [timeRange], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const history = useSentimentHistory(activeClientId, sinceIso, lastCompletedAt)

  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('weekly')
  const [filterSentiment, setFilterSentiment] = useState<SentimentFilter>('all')
  const [filterEngine, setFilterEngine] = useState<EngineFilter>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  const snap = useMemo(() => {
    if (!snapshot) return null
    const activeIds = snapshot.activePrompts.map(pr => pr.id)
    const view = buildSnapshotView(snapshot.rows, activeIds, activeEngines)
    return { view, sv: buildSentimentView(view) }
  }, [snapshot, activeEngines])

  const promptText = useMemo(
    () => new Map((snapshot?.prompts ?? []).map(pr => [pr.id, pr.text] as [number, string])),
    [snapshot],
  )

  const feed = useMemo(
    () => feedRows(history.rows).filter(r => activeEngines.includes(r.llm as EngineId)),
    [history.rows, activeEngines],
  )
  const trendData = useMemo(() => computeTrend(feed, trendPeriod), [feed, trendPeriod])
  const feedTotals = useMemo(() => feedCounts(feed), [feed])
  const filtered = useMemo(
    () => filterFeed(feed, filterSentiment, filterEngine),
    [feed, filterSentiment, filterEngine],
  )

  if (snapshot === null || snap === null) {
    if (status === 'error') {
      return (
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          <div className="mb-6"><PageTitle>Brand Sentiment</PageTitle></div>
          <LoadErrorCard onRetry={() => reload()} />
        </div>
      )
    }
    return <RouteSkeleton />
  }

  const { summary, byEngine } = snap.sv
  const total = summary.total
  const score = total > 0 ? summary.score : null
  const { label: scoreLabel, color: scoreColor } = scoreMeta(score)
  const pct = summary.pct
  const engineData = buildEngineSentimentData(byEngine, snap.view.population.engineIds)
  const counts = { positive: summary.positive, neutral: summary.neutral, negative: summary.negative }
  const historyLoading = history.status === 'loading' && history.rows.length === 0
  const historyFailed = history.status === 'error'

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-0.5">
          <PageTitle>Brand Sentiment</PageTitle>
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

      {loadError && <LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} />}

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
          {total > 0 && <div className="text-xs text-slate-500 mt-0.5">{pct.positive}% of mentions</div>}
        </MotionCard>
        <MotionCard stagger hoverLift={false} className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Meh size={12} className={total === 0 ? 'text-slate-500' : 'text-sentiment-neutral'} />
            <span className="text-xs text-slate-500">Neutral</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${total === 0 ? 'text-slate-500' : 'text-slate-300'}`}>{counts.neutral}</div>
          {total > 0 && <div className="text-xs text-slate-500 mt-0.5">{pct.neutral}% of mentions</div>}
        </MotionCard>
        <MotionCard stagger hoverLift={false} className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Frown size={12} className={total === 0 ? 'text-slate-500' : 'text-sentiment-negative'} />
            <span className="text-xs text-slate-500">Negative</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${total === 0 ? 'text-slate-500' : 'text-sentiment-negative'}`}>{counts.negative}</div>
          {total > 0 && <div className="text-xs text-slate-500 mt-0.5">{pct.negative}% of mentions</div>}
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
              {counts.positive > 0 && <div className="h-full bg-sentiment-positive" style={{ width: `${pct.positive}%` }} title={`Positive ${pct.positive}%`} />}
              {counts.neutral > 0 && <div className="h-full bg-sentiment-neutral" style={{ width: `${pct.neutral}%` }} title={`Neutral ${pct.neutral}%`} />}
              {counts.negative > 0 && <div className="h-full bg-sentiment-negative" style={{ width: `${pct.negative}%` }} title={`Negative ${pct.negative}%`} />}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-sentiment-positive" />Positive {pct.positive}%</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-sentiment-neutral" />Neutral {pct.neutral}%</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-sentiment-negative" />Negative {pct.negative}%</span>
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
              {historyLoading ? (
                <Skeleton className="h-[220px] w-full rounded-lg" />
              ) : historyFailed ? (
                <LoadErrorCard onRetry={history.reload} />
              ) : trendData.length < 2 ? (
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

            {historyLoading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : historyFailed ? (
              <LoadErrorCard onRetry={history.reload} />
            ) : (
              <>
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
                      {s === 'all' ? `All (${feedTotals.total})` : `${s[0].toUpperCase()}${s.slice(1)} (${feedTotals[s]})`}
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
                                  <SentimentDot value={e.sentiment as Sentiment} />{e.sentiment}
                                </span>
                              </div>
                              <p className="text-sm text-slate-200 truncate">{promptText.get(e.prompt_id) ?? ''}</p>
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
