/**
 * PlatformActivity: admin only live view of who is using the platform
 * (docs/arch/platform-activity.md, sections 5.1 to 5.4). Reads only through the
 * platform-activity function; in demo mode it renders the fixture instead.
 * This is the only file of the feature that imports motion/react.
 * Every user visible string is an English literal, reviewed in
 * docs/copy/pending-strings-2026-11-16.md (rows PA01 to PA09).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useClient } from '../lib/clientContext'
import { isDemoMode } from '../lib/supabase'
import { MOTION_FAST } from '../lib/motion'
import {
  Badge, Button, Card, Chip, Meter, Notice, Page, PageHeader, SectionHeader, Stat, tableClasses,
  SkeletonList, SkeletonStat, SkeletonTable,
} from '../components/ui'
import type { BadgeTone } from '../components/ui'
import {
  BADGE_TEXT, FEED_RENDER_CAP, createPollingActivitySource, engineText, fetchFeedFromServer,
  fetchSummaryFromServer, formatDetail, planText, relativeTime, useSummaryPoll,
  type ActivitySource, type ClientActivityRow, type FeedRow, type FeedTone, type SourceStatus,
  type SummaryResponse,
} from '../lib/platformActivity'
import { createFixtureActivitySource, fixtureSummary } from '../lib/platformActivityFixture'
import { INTERNAL_RESEARCH_LABEL, internalResearchLine } from '../lib/planConfig'

const TONE_TO_BADGE: Record<FeedTone, BadgeTone> = {
  neutral: 'neutral', info: 'accent', ok: 'pos', warn: 'warn', bad: 'neg',
}

const STATUS_WORD: Record<SourceStatus, string> = {
  live: 'Live',
  paused: 'Paused',
  retrying: 'Retrying',
  stopped: 'Stopped',
}

const fixtureFetchSummary = async () => ({ status: 200, data: fixtureSummary() as SummaryResponse | null })

function clockTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function FeedLine({ row }: { row: FeedRow }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_FAST, ease: 'easeOut' }}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 min-w-0"
    >
      <time dateTime={row.at} title={row.at} className="text-ink-3 tabular-nums shrink-0">{clockTime(row.at)}</time>
      <Badge tone={TONE_TO_BADGE[row.tone]}>{BADGE_TEXT[row.badge]}</Badge>
      <span className="text-ink min-w-0 truncate max-w-full">
        {row.client_name ?? (row.client_id !== null ? `Client ${row.client_id}` : 'Platform')}
      </span>
      <span className="text-ink-2 min-w-0 break-words">{formatDetail(row)}</span>
    </motion.li>
  )
}

// Short labels below the sm breakpoint so the qualifiers ("UTC", "80%") are
// not cut by Stat's single line label (review L4).
function TileLabel({ short, full }: { short: string; full: string }) {
  return (
    <>
      <span className="sm:hidden" aria-hidden="true">{short}</span>
      <span className="hidden sm:inline" aria-hidden="true">{full}</span>
      <span className="sr-only">{full}</span>
    </>
  )
}

function ClientsTable({ clients, now, partial }: { clients: ClientActivityRow[]; now: number; partial: boolean }) {
  return (
    <div className={tableClasses.wrap}>
      <table className={tableClasses.table}>
        <thead>
          <tr>
            <th scope="col" className={tableClasses.th}>Client</th>
            <th scope="col" className={tableClasses.th}>Plan</th>
            <th scope="col" className={tableClasses.th}>Engine calls this month</th>
            <th scope="col" className={tableClasses.th}>Engines</th>
            <th scope="col" className={tableClasses.th}>Last active</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.client_id} className={tableClasses.tr}>
              <td className={tableClasses.td}>
                <span className="block max-w-[220px] truncate">{c.name}</span>
              </td>
              <td className={tableClasses.tdMuted}>{c.is_research ? INTERNAL_RESEARCH_LABEL : c.plan_known ? planText(c.plan) : `${c.plan || 'none'} (unknown)`}</td>
              <td className={tableClasses.td}>
                <div className="flex items-center gap-3 min-w-[180px]">
                  <span className="tabular-nums w-14 text-right shrink-0">{c.requests_month}</span>
                  {c.budget_pct !== null && (
                    <div className="flex-1 min-w-[72px]">
                      <Meter
                        value={Math.min(100, c.budget_pct)}
                        tone={c.budget_level === 'bad' ? 'neg' : c.budget_level === 'warn' ? 'warn' : 'accent'}
                        ariaLabel={`${c.name} budget used`}
                      />
                    </div>
                  )}
                  {c.budget_pct !== null && (
                    <span
                      className="text-meta text-ink-2 tabular-nums shrink-0"
                      title={`${partial ? 'At least ' : ''}EUR ${c.spent_eur.toFixed(2)} of EUR ${c.budget_eur.toFixed(2)} budget`}
                    >
                      {partial ? 'at least ' : ''}{Math.round(c.budget_pct)}%
                    </span>
                  )}
                </div>
              </td>
              <td className={tableClasses.tdMuted}>
                <span
                  className="block max-w-[200px] truncate tabular-nums"
                  title={c.engines_used.length > 0 ? c.engines_used.map(engineText).join(', ') : undefined}
                >
                  {`${c.engines_used.length} of ${c.engines_entitled.length}`}
                </span>
              </td>
              <td className={tableClasses.tdMuted}>
                {relativeTime(c.last_active_at, now)}
                {c.last_active_source && (
                  <span className="text-meta text-ink-3">
                    {c.last_active_source === 'sign_in' ? ' (sign in)' : ' (manual run)'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PlatformActivity() {
  const { isAdmin } = useClient()
  const enabled = isAdmin || isDemoMode

  const summary = useSummaryPoll(isDemoMode ? fixtureFetchSummary : fetchSummaryFromServer, { enabled })

  const source: ActivitySource = useMemo(
    () => (isDemoMode
      ? createFixtureActivitySource()
      : createPollingActivitySource({ fetchFeed: fetchFeedFromServer })),
    [],
  )

  const [rows, setRows] = useState<FeedRow[]>([])
  const [feedStatus, setFeedStatus] = useState<SourceStatus>('live')
  const [feedLoaded, setFeedLoaded] = useState(false)
  const [burst, setBurst] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [showResearchFeed, setShowResearchFeed] = useState(false)
  const [showResearchTable, setShowResearchTable] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  // The subscribe callback outlives renders, so it reads the research filter
  // through a ref to announce only rows the admin can see (review L5).
  const showResearchFeedRef = useRef(showResearchFeed)
  showResearchFeedRef.current = showResearchFeed
  const announceSeq = useRef(0)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const off = source.subscribe(
      (batch) => {
        setFeedLoaded(true)
        if (batch.truncated) setBurst(true)
        setRows((prev) => {
          const merged = [...batch.rows, ...prev]
          merged.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
          return merged.slice(0, FEED_RENDER_CAP)
        })
        if (!batch.initial) {
          const n = batch.rows.filter((r) => showResearchFeedRef.current || !r.is_research).length
          if (n > 0) {
            // A trailing zero width toggle makes two equal messages differ, so
            // screen readers announce both.
            announceSeq.current += 1
            setAnnounce(`${n} new ${n === 1 ? 'event' : 'events'}${announceSeq.current % 2 ? '' : '​'}`)
          }
        }
      },
      (s) => {
        setFeedStatus(s)
        if (s === 'live') setFeedLoaded(true)
      },
    )
    return off
  }, [enabled, source])

  if (!enabled) {
    return (
      <Page>
        <PageHeader title="Platform activity" />
        <Card>
          <p className="text-body text-ink-2">
            This page is for administrators.{' '}
            <Link to="/" className="text-accent-ink underline">Back to Overview</Link>
          </p>
        </Card>
      </Page>
    )
  }

  const stopped = feedStatus === 'stopped' || summary.status === 'stopped'
  const data = summary.data
  const visibleRows = showResearchFeed ? rows : rows.filter((r) => !r.is_research)
  const allClients = data?.clients ?? []
  const researchCount = allClients.filter((c) => c.is_research).length
  const tableClients = showResearchTable ? allClients : allClients.filter((c) => !c.is_research)
  const health = data?.tiles.engine_health_24h
  const watch = data?.tiles.budget_watch
  const census = data?.tiles.census
  const monthTruncated = !!data?.truncated.ai_results_month
  const headStatus: SourceStatus = stopped ? 'stopped' : feedStatus
  // Server warnings (failed gate RPC, spend delta, any capped read) are shown
  // as one Notice; the page adds its own line only if the month truncation
  // sentence is somehow missing from them (review M1).
  const warnings = [...new Set([
    ...(data?.warnings ?? []),
    ...(monthTruncated && !(data?.warnings ?? []).some((w) => w.startsWith('More than'))
      ? ['Too many engine calls to read this month, so per client figures are at least the numbers shown.']
      : []),
  ])]
  const runs = data?.tiles.runs_today

  return (
    <Page>
      <PageHeader
        title="Platform activity"
        subtitle={(
          <span className="inline-flex items-center gap-2">
            <span className={`status-dot ${headStatus === 'live' ? 'is-live' : ''} text-pos`} aria-hidden="true" />
            <span>{STATUS_WORD[headStatus]}</span>
            <span className="text-ink-3">
              {data ? `Updated ${relativeTime(data.generated_at, now)}` : 'Waiting for first update'}
            </span>
          </span>
        )}
      />

      {stopped && (
        <div className="mb-4">
          <Notice tone="warn" title="Admin access required">
            Your session cannot read platform activity. Sign in again as an administrator.
          </Notice>
        </div>
      )}

      {!stopped && summary.failed && !data && (
        <div className="mb-4">
          <Notice
            tone="neg"
            title="Could not load platform activity"
            action={<Button variant="secondary" size="sm" onClick={summary.retry}>Retry</Button>}
          >
            The summary did not load. It will try again automatically.
          </Notice>
        </div>
      )}

      {!stopped && summary.failed && data && (
        <p className="mb-4 text-meta text-ink-2">
          The last summary update failed. Figures below are from the previous update. Retrying.
        </p>
      )}

      {warnings.length > 0 && (
        <div className="mb-4">
          <Notice tone="warn" title="Some figures may be incomplete">
            <ul className="list-disc pl-5 space-y-1">
              {warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </Notice>
        </div>
      )}

      {summary.loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line rounded-card overflow-hidden border border-line">
          <div className="bg-surface p-5 min-h-[120px] min-w-0">
            <Stat
              label={<TileLabel short="Sign ins, 24 h" full="Signed in, last 24 h" />}
              value={data.tiles.active_users_24h.viewers}
              sub={`${data.tiles.active_users_24h.clients} clients`}
            />
          </div>
          <div className="bg-surface p-5 min-h-[120px] min-w-0">
            <Stat
              label={<TileLabel short="Runs (UTC)" full="AI runs today (UTC)" />}
              value={runs ? runs.customer : 0}
              sub={runs
                ? `${runs.manual} manual, ${runs.scheduled} scheduled, ${runs.engine_calls} engine calls${runs.research > 0 ? `, ${runs.research} research runs` : ''}`
                : undefined}
            />
          </div>
          <div className="bg-surface p-5 min-h-[120px] min-w-0">
            <Stat
              label={<TileLabel short="Success, 24 h" full="Engine success, 24 h" />}
              value={health && health.error_rate !== null ? (100 - health.error_rate * 100).toFixed(1) : ''}
              unit="%"
              emptyLabel={health && health.error_rate === null ? 'No calls' : undefined}
              tone={health?.level === 'bad' ? 'alert' : health?.level === 'warn' ? 'warn' : 'neutral'}
              sub={health ? (
                <span className={health.level === 'bad' ? 'text-neg' : undefined}>
                  {health.reason === 'engine_outage'
                    ? `${health.outage_llms.map(engineText).join(', ')} failing`
                    : `${health.errors} errors of ${health.calls} calls`}
                </span>
              ) : undefined}
            />
          </div>
          <div className="bg-surface p-5 min-h-[120px] min-w-0">
            <Stat
              label={<TileLabel short="Budget 80%+" full="Clients over 80% of budget" />}
              value={watch?.over_80 ?? 0}
              tone={watch && watch.over_90 > 0 ? 'alert' : watch && watch.over_80 > 0 ? 'warn' : 'neutral'}
              sub={watch
                ? `${monthTruncated ? 'at least ' : ''}${watch.over_90} over 90%, ${watch.customers_measured} measured`
                : undefined}
            />
          </div>
        </div>
      ) : null}

      <section className="mt-8" aria-labelledby="pa-feed">
        <Card pad="none">
          <div className="p-4 pb-0">
            <SectionHeader
              title={<span id="pa-feed">Live feed</span>}
              description="Sign ins show the latest per person."
              actions={(
                <Chip selected={showResearchFeed} onClick={() => setShowResearchFeed((v) => !v)}>
                  Include research
                </Chip>
              )}
            />
          </div>
          {burst && (
            <div className="px-4 pb-3">
              <Notice tone="warn" title="Some events in a burst were not listed." />
            </div>
          )}
          {feedStatus === 'retrying' && (
            <p className="px-4 pb-3 text-meta text-ink-2">Feed paused: could not reach the server. Retrying.</p>
          )}
          {stopped && !feedLoaded ? null : !feedLoaded ? (
            <div className="p-4"><SkeletonList rows={6} /></div>
          ) : visibleRows.length === 0 ? (
            <p className="px-4 pb-6 text-body text-ink-2">No activity in the last 24 h.</p>
          ) : (
            <ol
              aria-live="off"
              className="font-mono text-meta divide-y divide-line max-h-[480px] overflow-y-auto border-t border-line"
            >
              <AnimatePresence initial={false}>
                {visibleRows.map((row) => <FeedLine key={row.id} row={row} />)}
              </AnimatePresence>
            </ol>
          )}
          <p role="status" className="sr-only">{announce}</p>
        </Card>
      </section>

      <section className="mt-8" aria-labelledby="pa-clients">
        <SectionHeader
          title={<span id="pa-clients">Clients</span>}
          count={tableClients.length}
          description={census ? `${census.clients} clients, EUR ${census.client_cost_eur.toFixed(2)} client cost this month. ${internalResearchLine(census.internal_research)}, EUR ${census.internal_research_cost_eur.toFixed(2)} internal cost.` : undefined}
          actions={researchCount > 0 ? (
            <Chip selected={showResearchTable} onClick={() => setShowResearchTable((v) => !v)}>
              {`Show ${internalResearchLine(researchCount).toLowerCase()}`}
            </Chip>
          ) : undefined}
        />
        {summary.loading && !data ? (
          <SkeletonTable rows={8} cols={5} />
        ) : tableClients.length === 0 ? (
          <Card><p className="text-body text-ink-2">No clients.</p></Card>
        ) : (
          <ClientsTable clients={tableClients} now={now} partial={monthTruncated} />
        )}
      </section>
    </Page>
  )
}
