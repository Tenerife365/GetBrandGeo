import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, TrendingUp, Target, Hash, Eye, Radar } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { useI18n } from '../lib/i18nContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { useCollection } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import type { AiVisibilityDimensions } from '../lib/aiVisibilityScore'
import { useResults } from '../lib/resultsContext'
import { nextSeq, isStale } from '../lib/resultsGuards'
import { readResultHistory } from '../lib/historyRead'
import { formatAvgPosition } from '../lib/metrics'
import {
  buildDashboardView, DASHBOARD_HISTORY_COLUMNS,
  type DashboardHistoryRow, type RecentEntry, type SparkPoint,
} from '../lib/views/dashboardView'
import LoadErrorCard from '../components/LoadErrorCard'
import EngineChip from '../components/EngineChip'
import {
  Page, PageHeader, HeroAnswer, ScoreDial, Card, ReadoutRow, Stat, Meter, BarList, DataList,
  Button, Badge, Disclosure, SkeletonHero, SkeletonReadout, SkeletonBlock, StatusGlyph, buttonClasses,
} from '../components/ui'
import { formatDate } from '../lib/format'

const DIMENSION_LABELS: [keyof AiVisibilityDimensions, string][] = [
  ['recognition', 'Recognition'], ['knowledge', 'Knowledge'], ['sentiment', 'Sentiment'],
  ['accuracy', 'Accuracy'], ['reach', 'Reach'], ['consistency', 'Consistency'],
]

// Plain "X, Y and Z" join of the plan's real engine names, sourced from
// ENGINE_META so it can never name an engine the plan does not run.
function joinEngineNames(ids: EngineId[]): string {
  const names = ids.map(id => ENGINE_META[id]?.label ?? id)
  if (names.length === 0) return 'AI engines'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

// Same bands the AI Visibility page uses for its score label.
function scoreBand(score: number): { label: string; tone: 'pos' | 'warn' | 'neg' } {
  if (score >= 60) return { label: 'Strong', tone: 'pos' }
  if (score >= 35) return { label: 'Developing', tone: 'warn' }
  return { label: 'Needs work', tone: 'neg' }
}

// Staggered reveal index for the first four top-level blocks (CSS keyframe, no motion import).
const rv = (i: number) => ({ '--i': i } as CSSProperties)

const sparkNumbers = (pts: SparkPoint[] | undefined): number[] | undefined =>
  pts ? pts.map(p => p.v).filter((v): v is number => v != null) : undefined

/**
 * Top-of-page "what to do next" callout. Sourced from the persisted
 * recommendation_runs/recommendations tables, not recomputed here. One embedded
 * read (run plus its recommendations).
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
  const brandName = activeClient?.name ?? 'your brand'
  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  })()

  const { snapshot, status, loadError, reload } = useResults()
  const [history, setHistory] = useState<DashboardHistoryRow[] | null>(null)
  const [historyFailed, setHistoryFailed] = useState(false)
  const [topRecs, setTopRecs]     = useState<TopRec[]>([])
  const [recsLoaded, setRecsLoaded] = useState(false)

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

  const scoreData: { dimensions: AiVisibilityDimensions; aiScore: number } | null = view?.score ?? null
  const win = view?.window ?? null
  const llmData = view?.engineBars ?? []
  const recentMentioned = win?.recentMentioned ?? []
  const recentNotMentioned = win?.recentNotMentioned ?? []

  // KPI trend sparklines. Avg-position only gets a sparkline when it has at
  // least 2 real (non-null) buckets.
  const spark = win?.sparks ?? null
  const avgPosSpark = spark && spark.avgPosition.filter(p => p.v != null).length >= 2
    ? sparkNumbers(spark.avgPosition)
    : undefined

  // Human-readable window length for the "no checks in this window" line below,
  // mirroring timeFilterContext.tsx's own 7d/30d/90d/all day counts.
  const windowDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : null

  const checkedCount = view?.mention.checked ?? 0

  const refreshButton = (
    <Button variant="secondary" icon={RefreshCw}
      onClick={() => { void reload({ quiet: true }); void loadHistory(true) }}>
      {t.dash_refresh}
    </Button>
  )

  // Content-shaped skeleton: mirrors the real page (header / hero / what to do
  // next / metrics / disclosure) so nothing reflows when data arrives.
  if (!snapshot || !view) {
    if (status === 'error') return (
      <Page>
        <PageHeader title={`${greeting}, ${brandName}`} />
        <LoadErrorCard onRetry={() => reload()} />
      </Page>
    )
    return (
      <Page>
        <PageHeader title={`${greeting}, ${brandName}`} actions={refreshButton} />
        <div className="space-y-4 md:space-y-6">
          <SkeletonHero />
          <Card pad="standard"><SkeletonBlock className="h-16 w-full" /></Card>
          <SkeletonReadout />
          <SkeletonBlock className="h-12 w-full" />
        </div>
      </Page>
    )
  }

  const band = scoreData ? scoreBand(scoreData.aiScore) : null
  const topRec = topRecs[0]

  return (
    <Page>
      <PageHeader title={`${greeting}, ${brandName}`} actions={refreshButton} />

      {loadError && <LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} />}

      <div className="space-y-4 md:space-y-6">
        {/* Zero-data first run: never render a zero as though it were a
            measurement. No score, no label, no 0%. Routes to /prompts when
            there are no prompts yet, otherwise to /ai-visibility. */}
        {!view.hasAnyMeasurement && (
          <div className="reveal" style={rv(0)}>
          <HeroAnswer
            empty={{
              icon: Radar,
              title: 'Not measured yet',
              body:
                view.promptCount === 0
                  ? `BrandGEO measures how ${joinEngineNames(activeEngines)} ${activeEngines.length === 1 ? 'answers' : 'answer'} real buyer questions about ${brandName}. Add a prompt to start.`
                  : `BrandGEO is about to check how ${joinEngineNames(activeEngines)} ${activeEngines.length === 1 ? 'answers' : 'answer'} ${view.promptCount} tracked prompt${view.promptCount === 1 ? '' : 's'} about ${brandName}. Run the first collection to see your score.`,
              actionLabel: view.promptCount === 0 ? 'Add a prompt' : 'Run first collection',
              actionTo: view.promptCount === 0 ? '/prompts' : '/ai-visibility',
            }}
            answer=""
          />
          </div>
        )}

        {view.hasAnyMeasurement && scoreData && band && (
          <div className="reveal" style={rv(0)}>
          <HeroAnswer
            visual={<ScoreDial score={scoreData.aiScore} size="lg" />}
            badge={{ label: band.label, tone: band.tone, glyph: <StatusGlyph kind={band.tone} size={12} /> }}
            // copy: pending bg-copy
            answer={view.mention.pct === null
              ? 'Your brand has not been checked yet.'
              : `Your brand is named in ${view.mention.pct}% of the AI answers checked.`}
            // copy: pending bg-copy
            context={`Score from the latest answer for ${checkedCount} prompt and engine result${checkedCount === 1 ? '' : 's'}, all time.`}
            action={<Link to="/ai-visibility" className={buttonClasses('tertiary')}>View full breakdown</Link>}
          >
            {/* The Meter header carries the name and the value once; no second dt/dd copy. */}
            <ul className="m-0 p-0 list-none grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              {DIMENSION_LABELS.map(([key, label]) => {
                const v = scoreData.dimensions[key]
                const num = typeof v === 'number' ? v : null
                return (
                  <li key={key} className="min-w-0">
                    <Meter value={num} thick label={label} valueLabel={num === null ? undefined : `${Math.round(num)}%`} />
                  </li>
                )
              })}
            </ul>
          </HeroAnswer>
          </div>
        )}

        {/* "What to do next": the SAME persisted advice /recommendations shows,
            not a duplicate generator. Only renders once there is something to say. */}
        {recsLoaded && topRec && (
          <Card interactive pad="standard" className="reveal" style={rv(1)}>
            <h2 className="m-0 text-heading text-ink">What to do next</h2>
            <div className="mt-2 flex items-start gap-3">
              <Badge tone="neutral">{topRec.priority}</Badge>
              <p className="m-0 text-body text-ink min-w-0">{topRec.title}</p>
            </div>
            <Link to="/recommendations" className={`${buttonClasses('tertiary', 'sm')} mt-2 -ml-2.5`}>
              View all recommendations
            </Link>
          </Card>
        )}

        {view.hasAnyMeasurement && (
          <section aria-labelledby="key-metrics-h" className="reveal" style={rv(2)}>
            <h2 id="key-metrics-h" className="sr-only">Key metrics</h2>
            {/* The score hero is gated on all-time data, so it keeps a real score
                even when the SELECTED window has no rows. This line explains the
                gap, with a control that removes it. */}
            {win && win.checks === 0 && timeRange !== 'all' && windowDays != null && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-meta text-ink-3">
                <span>No checks in the last {windowDays} days.</span>
                <Button variant="tertiary" size="sm" onClick={() => setTimeRange('all')}>Show all time</Button>
              </div>
            )}
            {historyFailed && (
              <LoadErrorCard
                message="Couldn't load recent activity."
                onRetry={() => { void loadHistory(false) }}
              />
            )}
            <ReadoutRow>
              <Stat
                icon={TrendingUp}
                label={t.dash_statMentionRate}
                // A zero-check tenant has no rate, only an absence of measurement.
                value={view.mention.pct === null ? null : view.mention.pct}
                unit={view.mention.pct === null ? undefined : '%'}
                emptyLabel={view.mention.pct === null ? 'Not measured yet' : undefined}
                sub={t.dash_statMentionRateSub}
                tone={view.mention.pct !== null && view.mention.pct < 50 ? 'warn' : 'neutral'}
                spark={sparkNumbers(spark?.mentionRate)}
              />
              <Stat
                icon={Target}
                label={t.dash_statAvgPos}
                value={formatAvgPosition(view.avgPosition)}
                emptyLabel={formatAvgPosition(view.avgPosition) === null ? 'Not measured yet' : undefined}
                sub={t.dash_statAvgPosSub}
                tone={view.avgPosition != null && view.avgPosition > 6 ? 'warn' : 'neutral'}
                spark={avgPosSpark}
              />
              <Stat icon={Hash} label={t.dash_statPrompts} value={view.promptCount} sub={t.dash_statPromptsSub} />
              <Stat
                icon={Eye}
                label={t.dash_statChecks}
                value={win ? win.checks : null}
                pending={!win && !historyFailed}
                emptyLabel={win ? undefined : 'Unavailable'}
                sub="In the selected window"
                spark={sparkNumbers(spark?.volume)}
              />
            </ReadoutRow>
          </section>
        )}

        {view.hasAnyMeasurement && (
          <div className="reveal" style={rv(3)}>
          <Disclosure title="Show engine breakdown and recent activity">
            <div className="space-y-6 pt-3">
              <div>
                <h3 className="m-0 mb-3 text-heading text-ink">{t.dash_mentionRate}</h3>
                {llmData.length === 0 ? (
                  <EmptyLine text={t.dash_noResults} ctaText={t.dash_noDataCta} to="/ai-visibility" />
                ) : (
                  <BarList
                    rows={llmData.map(d => ({ label: d.label, value: d.rate, swatch: d.color }))}
                    format={v => `${v}%`}
                  />
                )}
              </div>

              <div>
                <h3 className="m-0 mb-3 text-heading text-ink">{t.dash_recentMentions}</h3>
                {!win ? (
                  historyFailed
                    ? <LoadErrorCard message="Couldn't load recent activity." onRetry={() => { void loadHistory(false) }} />
                    : <SkeletonBlock className="h-24 w-full" />
                ) : recentMentioned.length === 0 ? (
                  checkedCount === 0
                    ? <EmptyLine text={t.dash_noDataYet} ctaText={t.dash_noDataCta} to="/ai-visibility" />
                    : <EmptyLine text={t.dash_noMentions} ctaText={t.dash_noMentionsCta} to="/recommendations" />
                ) : (
                  <DataList rows={recentMentioned} getKey={r => r.id} renderRow={r => <ResultRow row={r} mentioned />} />
                )}
              </div>

              <div>
                <h3 className="m-0 mb-3 text-heading text-ink">{t.dash_recentGaps}</h3>
                {!win ? (
                  historyFailed
                    ? <LoadErrorCard message="Couldn't load recent activity." onRetry={() => { void loadHistory(false) }} />
                    : <SkeletonBlock className="h-24 w-full" />
                ) : recentNotMentioned.length === 0 ? (
                  checkedCount === 0
                    ? <EmptyLine text={t.dash_noDataYet} ctaText={t.dash_noDataCta} to="/ai-visibility" />
                    : <p className="m-0 py-4 text-body text-ink-3">{t.dash_noGaps}</p>
                ) : (
                  <DataList rows={recentNotMentioned} getKey={r => r.id} renderRow={r => <ResultRow row={r} mentioned={false} />} />
                )}
              </div>
            </div>
          </Disclosure>
          </div>
        )}
      </div>
    </Page>
  )
}

function ResultRow({ row, mentioned }: { row: RecentEntry; mentioned: boolean }) {
  const { t } = useI18n()
  const known = row.llm in ENGINE_META
  return (
    <>
      {known
        ? <EngineChip id={row.llm as EngineId} interactive={false} />
        : <Badge tone="neutral">{row.llm}</Badge>}
      <div className="flex-1 min-w-0">
        <p className="m-0 text-body text-ink truncate">{row.text ?? `Prompt #${row.prompt_id}`}</p>
        <p className="m-0 mt-0.5 text-meta text-ink-3">
          {formatDate(row.checked_at)}
          {mentioned && row.brand_position != null && ` · #${row.brand_position}`}
        </p>
      </div>
      <Badge tone={mentioned ? 'pos' : 'neutral'} glyph={mentioned ? <StatusGlyph kind="pos" size={12} /> : undefined}>{mentioned ? t.aiv_yes : t.aiv_no}</Badge>
    </>
  )
}

// CTA-driven empty line: naming the concrete next action that would populate
// the widget reads better than a blank block.
function EmptyLine({ text, ctaText, to }: { text: string; ctaText: string; to: string }) {
  return (
    <div className="py-4">
      <p className="m-0 mb-2 text-body text-ink-3">{text}</p>
      <Link to={to} className={buttonClasses('tertiary', 'sm')}>{ctaText}</Link>
    </div>
  )
}
