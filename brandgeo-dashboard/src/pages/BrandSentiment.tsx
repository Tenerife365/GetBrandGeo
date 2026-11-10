/**
 * BrandSentiment.tsx
 * Snapshot numbers (score, counts, per-engine chart) come from the shared results
 * layer: useResults() plus metrics.ts over the newest usable cell per active
 * prompt and engine. The trend and the signals feed come from paged, time-windowed
 * history (readResultHistory), so neither is cut at the 1,000-row cap.
 * Pure logic lives in lib/views/sentimentView.ts.
 *
 * Phase 3 visual (spec 11.3): five blocks, PageHeader, HeroAnswer, By engine,
 * Over time, Recent signals. Presentation only; no query, metric or sort changed.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { ChevronDown, Meh } from 'lucide-react'
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
  buildSentimentView, computeTrend, scoreMeta, feedRows, feedCounts, filterFeed,
  type SentimentHistoryRow, type TrendPeriod, type SentimentKey,
} from '../lib/views/sentimentView'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { useChartTheme, gridProps, axisProps, lineProps } from '../lib/chartTheme'
import EngineChip from '../components/EngineChip'
import ChartTooltip from '../components/ChartTooltip'
import ChartLegend from '../components/ChartLegend'
import EmptyState from '../components/EmptyState'
import LoadErrorCard from '../components/LoadErrorCard'
import RouteSkeleton from '../components/RouteSkeleton'
import { SkeletonChart, SkeletonList } from '../components/ui/skeletons'
import {
  Page, PageHeader, SectionHeader, HeroAnswer, Card, Badge, Button, Chip, ChipGroup,
  SegmentedControl, SplitBar, StatusGlyph, DataList,
  type BadgeTone, type StatusKind,
} from '../components/ui'
import { formatDate } from '../lib/format'

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


// Staggered reveal index (CSS keyframe in index.css, no motion import).
const rv = (i: number) => ({ '--i': i } as CSSProperties)

const SENTIMENT_KIND: Record<string, StatusKind> = { positive: 'pos', neutral: 'neu', negative: 'neg' }
const kindOf = (s: string): StatusKind => SENTIMENT_KIND[s] ?? 'neu'

/** Badge tone for the score label bands in scoreMeta (75 / 50 / 25). Polarity, so tone not colour of the number. */
function scoreTone(score: number | null): BadgeTone {
  if (score === null) return 'neutral'
  if (score >= 75) return 'pos'
  if (score >= 50) return 'neutral'
  if (score >= 25) return 'warn'
  return 'neg'
}

// --- Main component ----------------------------------------------------------

export default function BrandSentiment() {
  const { activeClientId, activeEngines } = useClient()
  const { lastCompletedAt } = useCollection()
  const { getStartDate, timeRange, setTimeRange } = useTimeFilter()
  const chart = useChartTheme()
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
        <Page>
          <PageHeader title="Brand Sentiment" />
          <LoadErrorCard onRetry={() => reload()} />
        </Page>
      )
    }
    return <RouteSkeleton />
  }

  const { summary, byEngine } = snap.sv
  const total = summary.total
  const score = total > 0 ? summary.score : null
  const { label: scoreLabel } = scoreMeta(score)
  const pct = summary.pct
  const counts = { positive: summary.positive, neutral: summary.neutral, negative: summary.negative }
  const engineRows = snap.view.population.engineIds.filter(id => (byEngine[id]?.total ?? 0) > 0)
  const historyLoading = history.status === 'loading' && history.rows.length === 0
  const historyFailed = history.status === 'error'
  // Two scopes on this page: the hero is the newest answer per prompt and engine
  // across all time; the signals feed follows the selected window. Say so.
  const windowPhrase = timeRange === 'all' ? 'across all time'
    : `in the last ${timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90} days`
  const widenHint = feed.length === 0 && timeRange !== 'all'

  return (
    <Page>
      <PageHeader title="Brand Sentiment" />

      {loadError && <LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} />}

      <div className="space-y-6">
        {total === 0 ? (
          <div className="reveal" style={rv(0)}>
          <HeroAnswer
            empty={{
              icon: Meh,
              title: 'Not measured yet',
              // copy: pending bg-copy
              body: 'Sentiment appears once an AI answer mentions your brand.',
              actionLabel: 'See where you appear',
              actionTo: '/ai-visibility',
              minHeight: 200,
            }}
            answer=""
          />
          </div>
        ) : (
          <>
            <div className="reveal" style={rv(0)}>
            <HeroAnswer
              value={score}
              unit="/100"
              badge={{
                label: scoreLabel,
                tone: scoreTone(score),
                glyph: (() => {
                  const tone = scoreTone(score)
                  return tone === 'pos' || tone === 'warn' || tone === 'neg'
                    ? <StatusGlyph kind={tone} size={12} />
                    : undefined
                })(),
              }}
              // copy: pending bg-copy
              answer={`${pct.positive}% of the ${total} AI answer${total !== 1 ? 's' : ''} that mention${total !== 1 ? '' : 's'} your brand ${total !== 1 ? 'are' : 'is'} positive.`}
              // copy: pending bg-copy
              context={`Score from the latest answer per prompt and engine, across all time: ${total} AI answer${total !== 1 ? 's' : ''} that mention your brand.`}
            >
              <SplitBar
                segments={[
                  { key: 'pos', count: counts.positive, pct: pct.positive },
                  { key: 'neu', count: counts.neutral, pct: pct.neutral },
                  { key: 'neg', count: counts.negative, pct: pct.negative },
                ]}
              />
            </HeroAnswer>
            </div>

            {/* By engine: one row per engine with data, a 100% stacked bar. Polarity by
                fixed order, and the n is printed, so one engine reads as one row. */}
            <section aria-labelledby="sent-by-engine" className="reveal" style={rv(1)}>
              <SectionHeader
                title={<span id="sent-by-engine">By engine</span>}
                description="Share of positive, neutral and negative mentions per engine."
              />
              <Card>
                {engineRows.length === 0 ? (
                  <EmptyState variant="inline" minHeight={120} body="No per-engine data yet." />
                ) : (
                  <ul className="space-y-3">
                    {engineRows.map((id, idx) => {
                      const s = byEngine[id]
                      const segs = [
                        { key: 'pos', n: s.positive, p: s.pct.positive, cls: 'bg-pos', word: 'Positive' },
                        { key: 'neu', n: s.neutral, p: s.pct.neutral, cls: 'bg-neu', word: 'Neutral' },
                        { key: 'neg', n: s.negative, p: s.pct.negative, cls: 'bg-neg', word: 'Negative' },
                      ].filter(x => x.p > 0)
                      return (
                        <li key={id} className={`flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3${idx < 10 ? ' reveal-row' : ''}`} style={idx < 10 ? rv(idx) : undefined}>
                          <span className="sm:w-[200px] shrink-0">
                            <EngineChip id={id as EngineId} interactive={false} />
                          </span>
                          <span
                            className="flex h-2 w-full flex-none gap-[2px] overflow-hidden rounded-sm sm:w-auto sm:flex-1"
                            role="img"
                            aria-label={`${ENGINE_META[id as EngineId]?.label ?? id}: ${s.pct.positive}% positive, ${s.pct.neutral}% neutral, ${s.pct.negative}% negative`}
                          >
                            {segs.map(x => (
                              <span key={x.key} className={`block h-full ${x.cls}`} style={{ width: `${x.p}%` }} />
                            ))}
                          </span>
                          <span className="shrink-0 text-meta text-ink-3 tabular-nums sm:w-12 sm:text-right">n {s.total}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </section>

            {/* Over time */}
            <section aria-labelledby="sent-over-time" className="reveal" style={rv(2)}>
              <SectionHeader
                title={<span id="sent-over-time">Over time</span>}
                actions={
                  <SegmentedControl<TrendPeriod>
                    ariaLabel="Trend period"
                    value={trendPeriod}
                    onChange={setTrendPeriod}
                    options={[
                      { value: 'weekly', label: 'W' },
                      { value: 'monthly', label: 'M' },
                      { value: 'quarterly', label: 'Q' },
                    ]}
                  />
                }
              />
              <Card>
                {historyLoading ? (
                  <SkeletonChart h={240} />
                ) : historyFailed ? (
                  <LoadErrorCard onRetry={history.reload} />
                ) : trendData.length < 2 ? (
                  <EmptyState
                    variant="inline"
                    minHeight={240}
                    title="Not enough data yet"
                    body="Trend fills in as collections accumulate"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trendData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid {...gridProps(chart)} />
                      <XAxis dataKey="period" {...axisProps(chart)} minTickGap={24} />
                      <YAxis {...axisProps(chart)} allowDecimals={false} width={40} tickCount={4} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.gridLine, strokeWidth: 1 }} />
                      <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
                      <Line type="monotone" dataKey="Positive" stroke={chart.sentimentPositive} {...lineProps(chart)} />
                      <Line type="monotone" dataKey="Neutral" stroke={chart.sentimentNeutral} {...lineProps(chart)} />
                      <Line type="monotone" dataKey="Negative" stroke={chart.sentimentNegative} {...lineProps(chart)} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </section>

            {/* Recent signals */}
            <section aria-labelledby="sent-recent" className="reveal" style={rv(3)}>
              <SectionHeader
                title={<span id="sent-recent">Recent signals</span>}
                // copy: pending bg-copy
                description={`Answers that mention your brand ${windowPhrase}.`}
              />

              {historyLoading ? (
                <SkeletonList rows={5} />
              ) : historyFailed ? (
                <LoadErrorCard onRetry={history.reload} />
              ) : (
                <>
                  <div className="mb-3 space-y-2">
                    <ChipGroup label="Sentiment">
                      {(['all', 'positive', 'neutral', 'negative'] as const).map(s => (
                        <Chip
                          key={s}
                          selected={filterSentiment === s}
                          count={s === 'all' ? feedTotals.total : feedTotals[s]}
                          onClick={() => setFilterSentiment(s)}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {s !== 'all' && <StatusGlyph kind={kindOf(s)} size={10} />}
                            {s === 'all' ? 'All' : `${s[0].toUpperCase()}${s.slice(1)}`}
                          </span>
                        </Chip>
                      ))}
                    </ChipGroup>
                    <ChipGroup label="Engine">
                      <Chip selected={filterEngine === 'all'} onClick={() => setFilterEngine('all')}>All engines</Chip>
                      {activeEngines.filter(e => (byEngine[e]?.total ?? 0) > 0).map(e => (
                        <EngineChip
                          key={e}
                          id={e as EngineId}
                          selected={filterEngine === e}
                          onClick={() => setFilterEngine(e === filterEngine ? 'all' : e)}
                        />
                      ))}
                    </ChipGroup>
                  </div>

                  {widenHint && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-meta text-ink-3">
                      {/* copy: pending bg-copy */}
                      <span>No signals {windowPhrase}. The score above covers all time.</span>
                      <Button variant="tertiary" size="sm" onClick={() => setTimeRange('all')}>Show all time</Button>
                    </div>
                  )}

                  {filtered.length === 0 ? (widenHint ? null : (
                    <Card>
                      <EmptyState variant="inline" body="No signals match this filter." />
                    </Card>
                  )
                  ) : (
                    <DataList
                      ariaLabel="Recent sentiment signals"
                      rows={filtered}
                      getKey={e => e.id}
                      renderRow={e => {
                        const engineId = (ENGINE_META[e.llm as EngineId] ? e.llm : 'chatgpt') as EngineId
                        const isOpen = expanded === e.id
                        return (
                          <div className="w-full min-w-0">
                            <button
                              type="button"
                              className="flex w-full items-start gap-4 text-left"
                              onClick={() => setExpanded(isOpen ? null : e.id)}
                              aria-expanded={isOpen}
                            >
                              <span className="shrink-0 w-10 text-center mt-0.5">
                                {e.brand_position ? (
                                  <>
                                    <span className="block text-heading text-ink tabular-nums">#{e.brand_position}</span>
                                    <span className="block text-meta text-ink-3">pos</span>
                                  </>
                                ) : (
                                  <span className="block text-body text-ink-3 mt-1">-</span>
                                )}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <EngineChip id={engineId} interactive={false} />
                                  <span className="inline-flex items-center gap-1.5 text-meta text-ink-2 capitalize">
                                    <StatusGlyph kind={kindOf(e.sentiment)} size={10} />{e.sentiment}
                                  </span>
                                </span>
                                <span className="block text-body text-ink truncate">{promptText.get(e.prompt_id) ?? ''}</span>
                              </span>
                              <ChevronDown
                                size={15}
                                aria-hidden="true"
                                className={`shrink-0 text-ink-3 transition-transform mt-1 ${isOpen ? 'rotate-180' : ''}`}
                              />
                            </button>
                            {isOpen && e.response_snippet && (
                              <div className="mt-3 rounded-control bg-surface-2 px-4 py-3">
                                <div className="text-meta text-ink-3 mb-2">Response snippet</div>
                                <blockquote className={`text-body text-ink-2 italic border-l-2 pl-3 ${
                                  e.sentiment === 'positive' ? 'border-pos' : e.sentiment === 'negative' ? 'border-neg' : 'border-neu'
                                }`}>
                                  "{e.response_snippet}"
                                </blockquote>
                                <div className="mt-3 text-meta text-ink-3">Checked {formatDate(e.checked_at)}</div>
                              </div>
                            )}
                            {isOpen && !e.response_snippet && (
                              <div className="mt-3 rounded-control bg-surface-2 px-4 py-3 text-meta text-ink-3 italic">
                                No response snippet captured for this mention.
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </Page>
  )
}
