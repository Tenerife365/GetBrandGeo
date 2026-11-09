/**
 * Competitors.tsx
 * Driven entirely from ai_results.competitors_mentioned -- no legacy page_analysis.
 * Shows top 5 competitors by AI mention frequency vs the client brand.
 *
 * Phase 3 visual (spec 11.5): six blocks, PageHeader, HeroAnswer, Share of mentions,
 * Competitor table, Disclosure "By engine and over time", Your tracked competitors.
 * Presentation only; no query, metric, sequence guard or sort changed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { Plus, Trash2, X, Globe, Tag, TrendingDown, Download } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockCompetitors, mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { ownRows, nextSeq, isStale } from '../lib/resultsGuards'
import { useCollection } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { useTimeFilter } from '../lib/timeFilterContext'
import { useResults } from '../lib/resultsContext'
import { buildSnapshotView } from '../lib/metrics'
import { readResultHistory } from '../lib/historyRead'
import { downloadCsv, csvFilename } from '../lib/csv'
import {
  buildCompetitorsView, buildEngineGroupData, samplePromptFor, computeTrend, trendEligibleRows, buildCompetitorsCsv,
  engineLabel,
  type TrendPeriod, type TrendRow,
} from '../lib/views/competitorsView'
import type { CompetitorAggregate } from '../lib/competitorFilter'
import { useChartTheme, gridProps, axisProps, yPercentAxis, barProps, lineProps, fieldDash } from '../lib/chartTheme'
import ChartTooltip from '../components/ChartTooltip'
import ChartLegend from '../components/ChartLegend'
import EmptyState from '../components/EmptyState'
import LoadErrorCard from '../components/LoadErrorCard'
import RouteSkeleton from '../components/RouteSkeleton'
import { SkeletonChart } from '../components/ui/skeletons'
import {
  Page, PageHeader, SectionHeader, HeroAnswer, Card, Badge, Button, IconButton, Notice,
  SegmentedControl, BarList, DataList, Disclosure, tableClasses,
} from '../components/ui'

// --- Types -------------------------------------------------------------------

/** "#2.9": position to one decimal, trailing zero dropped. */
const fmtPos = (p: number) => `#${(Math.round(p * 10) / 10).toString()}`

// --- Main component ----------------------------------------------------------

const TREND_COLUMNS = 'id, prompt_id, llm, brand_mentioned, competitors_mentioned, response_snippet, checked_at'

interface TrendHistoryRow extends TrendRow {
  id: number; prompt_id: number; llm: string; response_snippet?: string | null
}

export default function Competitors() {
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { lastCompletedAt } = useCollection()
  const { getStartDate, timeRange } = useTimeFilter()
  const chart = useChartTheme()
  const brandName = activeClient?.name ?? 'your brand'
  const { snapshot, status, loadError, reload } = useResults()

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  // Tagged with its client: an admin switch never shows another client's manual competitors.
  const [manualState, setManualState] = useState<{ rows: any[]; clientId: number }>({ rows: [], clientId: activeClientId })
  const manualComps = ownRows(manualState, activeClientId, [] as any[])
  const setManualComps = (next: any[] | ((prev: any[]) => any[])) => {
    setManualState(s => {
      const base = ownRows(s, activeClientId, [] as any[])
      return { clientId: activeClientId, rows: typeof next === 'function' ? next(base) : next }
    })
  }
  const [manualFailed, setManualFailed] = useState(false)
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('weekly')
  // Mirrors the capError banner in Prompts.tsx: one visible notice for a
  // write that failed, shown next to the row it happened to rather than
  // discarded.
  const [competitorError, setCompetitorError] = useState<string | null>(null)

  // Snapshot numbers: one shared population over the provider's rows.
  const snap = useMemo(() => {
    if (!snapshot) return null
    const activeIds = snapshot.activePrompts.map(pr => pr.id)
    const view = buildSnapshotView(snapshot.rows, activeIds, activeEngines)
    return { view, cv: buildCompetitorsView(view, snapshot.activePrompts) }
  }, [snapshot, activeEngines])

  // Trend: paged, windowed history. Reads only the columns the trend needs and
  // follows the top competitor names from the snapshot. Each reload carries its
  // own sequence number so a slow earlier read cannot overwrite a newer one.
  const sinceIso = useMemo(
    () => getStartDate()?.toISOString() ?? null,
    [timeRange], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const [trendState, setTrendState] = useState<{ rows: TrendHistoryRow[]; clientId: number }>({ rows: [], clientId: activeClientId })
  // Rows of another client are never shown (switch race, spec 3.4).
  const trendRowsRaw = ownRows(trendState, activeClientId, [] as TrendHistoryRow[])
  const [trendStatus, setTrendStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const trendSeq = useRef(0)

  const loadTrend = useCallback(async (quiet: boolean) => {
    const mine = nextSeq(trendSeq)
    if (!quiet) {
      setTrendStatus('loading')
      setTrendState(prev => (prev.clientId === activeClientId ? prev : { rows: [], clientId: activeClientId }))
    }
    if (isDemoMode) {
      const since = sinceIso ? new Date(sinceIso).getTime() : null
      const rows = mockAIResults
        .filter(r => since === null || new Date(r.checked_at).getTime() >= since)
        .map(r => ({
          id: r.id, prompt_id: r.prompt_id, llm: r.llm as string,
          brand_mentioned: r.brand_mentioned, competitors_mentioned: r.competitors_mentioned ?? null,
          response_snippet: r.response_snippet ?? null,
          checked_at: r.checked_at,
        }))
      if (!isStale(trendSeq, mine)) { setTrendState({ rows, clientId: activeClientId }); setTrendStatus('ready') }
      return
    }
    const res = await readResultHistory<TrendHistoryRow>(supabase, {
      clientId: activeClientId, sinceIso, columns: TREND_COLUMNS,
    })
    if (isStale(trendSeq, mine)) return
    if (res.error) {
      console.error('[Competitors] trend load failed:', res.error)
      setTrendStatus('error')
      return
    }
    setTrendState({ rows: res.rows, clientId: activeClientId })
    setTrendStatus('ready')
  }, [activeClientId, sinceIso])

  useEffect(() => { void loadTrend(false) }, [loadTrend])

  // Manual competitors are page-local and not part of the results snapshot.
  const manualSeq = useRef(0)
  const loadManual = useCallback(async () => {
    const mine = nextSeq(manualSeq)
    if (isDemoMode) { setManualFailed(false); return }
    const { data: manual, error } = await supabase
      .from('competitors').select('*').eq('client_id', activeClientId).eq('source', 'manual')
    if (isStale(manualSeq, mine)) return
    if (error) {
      console.error('[Competitors] manual load failed:', error)
      setManualFailed(true)
      return
    }
    setManualState({ rows: manual ?? [], clientId: activeClientId })
    setManualFailed(false)
  }, [activeClientId])

  useEffect(() => { void loadManual() }, [loadManual])

  // Reload quietly every time a collection run completes -- lastCompletedAt
  // bumps incrementally as jobs land (collectionContext.tsx), so this must
  // never assume a single final bump. The snapshot reloads itself in the provider.
  useCollectionLanded(lastCompletedAt, () => { void loadTrend(true) })

  const addCompetitor = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const entry = { name: newName.trim(), website: newWebsite.trim() || null, source: 'manual' as const, client_id: activeClientId }
    if (!isDemoMode) {
      const { data: saved, error } = await supabase.from('competitors').insert(entry).select().single()
      if (error) {
        // The form stays open and what was typed stays typed, so a failed
        // write never drops the name the user just entered. The driver
        // message is logged for diagnosis, not shown, since it can name
        // internal tables and policies.
        console.error('[Competitors] addCompetitor failed:', error)
        setCompetitorError(`Could not add ${entry.name}. Try again, and if it keeps failing contact support.`)
        setSaving(false)
        return
      }
      if (saved) setManualComps(prev => [...prev, saved])
    }
    setCompetitorError(null)
    setNewName(''); setNewWebsite(''); setShowAdd(false); setSaving(false)
  }

  const deleteManual = async (id: number) => {
    const index = manualComps.findIndex(c => c.id === id)
    const removed = manualComps[index]
    // Optimistic removal, restored below at its original position if the
    // server disagrees, so a failed delete never leaves the row silently
    // gone with no explanation.
    setManualComps(prev => prev.filter(c => c.id !== id))
    if (!isDemoMode) {
      const { error } = await supabase.from('competitors').delete().eq('id', id)
      if (error) {
        if (removed) {
          setManualComps(prev => {
            const next = [...prev]
            next.splice(index, 0, removed)
            return next
          })
        }
        // The driver message is logged for diagnosis, not shown, since it
        // can name internal tables and policies.
        console.error('[Competitors] deleteManual failed:', error)
        setCompetitorError(`Could not remove ${removed?.name ?? 'that competitor'}. Try again, and if it keeps failing contact support.`)
        return
      }
    }
    setCompetitorError(null)
  }


  const [openRow, setOpenRow] = useState<string | null>(null)

  if (snapshot === null || snap === null) {
    if (status === 'error') {
      return (
        <Page>
          <PageHeader title="Competitors" />
          <LoadErrorCard onRetry={() => reload()} />
        </Page>
      )
    }
    return <RouteSkeleton />
  }

  const { view } = snap
  let { cv } = snap
  // Demo: when the demo snapshot yields no competitor names, fall back to the
  // mock competitor list so the demo page still shows a populated table.
  if (isDemoMode && cv.topCompetitors.length === 0) {
    cv = {
      ...cv,
      topCompetitors: mockCompetitors.slice(0, 5).map((c, i) => ({
        name: c.name, totalMentions: 8 - i * 1.5 | 0, rankedMentions: 2,
        proseOnly: false,
        byEngine: { chatgpt: 2, gemini: 2, claude: 1 },
        positions: [2, 3], promptIds: [], avgPos: 2.5,
      })),
    }
  }
  const { topCompetitors, brandMentions, brandAvgPos, totalResponses, promptText } = cv
  const engineGroupData = buildEngineGroupData(brandName, cv.engineShare)
  const groupKeys       = [brandName, ...topCompetitors.slice(0, 3).map(c => c.name)]
  const trendRows       = trendEligibleRows(trendRowsRaw, activeEngines)
  const trendData       = computeTrend(trendRows, brandName, topCompetitors, trendPeriod)
  const trendLoading    = (trendStatus === 'loading' || trendState.clientId !== activeClientId) && trendRows.length === 0
  const trendFailed     = trendStatus === 'error'
  const exportDisabled  = view.population.cells.length === 0
  const onExport = () => {
    downloadCsv(
      csvFilename('competitors', activeClient?.slug, activeClientId, new Date()),
      buildCompetitorsCsv(view, brandName, snapshot.activePrompts),
    )
  }
  const engineWord = `${activeEngines.length} engine${activeEngines.length === 1 ? '' : 's'}`
  const enginesLabel = (c: CompetitorAggregate) =>
    view.population.engineIds.filter(e => (c.byEngine[e] ?? 0) > 0).map(engineLabel).join(', ')
  const brandEnginesLabel = view.population.engineIds
    .filter(e => view.population.cells.some(c => c.llm === e && c.brand_mentioned))
    .map(engineLabel).join(', ')
  const noCompetitors = topCompetitors.length === 0
  const top = topCompetitors[0]
  const tiedAtTop = top ? topCompetitors.filter(c => c.totalMentions === top.totalMentions).length : 0
  const mentionWord = (n: number) => `${n} mention${n === 1 ? '' : 's'}`
  const timesWord = (n: number) => `${n} time${n === 1 ? '' : 's'}`
  const responseWord = (n: number) => `${n} AI response${n === 1 ? '' : 's'}`

  // Share of mentions: you first in accent, then the field in neutral.
  const shareRows = [
    { label: brandName, value: brandMentions, isYou: true },
    ...topCompetitors.map(c => ({ label: c.name, value: c.totalMentions })),
  ]

  // Visibility by engine: one engine with data reads as a bar list, two or more as grouped bars.
  const singleEngineRow = engineGroupData.length === 1 ? engineGroupData[0] : null

  const addForm = showAdd && (
    <Card className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="competitor-name-input" className="text-meta text-ink-2 mb-1 block">Competitor name</label>
          <input id="competitor-name-input" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="e.g. Premier Catering"
            className="w-full h-9 bg-surface-2 border border-edge rounded-control px-3 text-body text-ink placeholder:text-ink-3 focus:border-accent" />
        </div>
        <div className="flex-1">
          <label htmlFor="competitor-website-input" className="text-meta text-ink-2 mb-1 block">Website (optional)</label>
          <input id="competitor-website-input" value={newWebsite} onChange={e => setNewWebsite(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="https://example.com"
            className="w-full h-9 bg-surface-2 border border-edge rounded-control px-3 text-body text-ink placeholder:text-ink-3 focus:border-accent" />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={addCompetitor} disabled={saving || !newName.trim()} loading={saving} aria-label="Add competitor">
            Add
          </Button>
          <Button variant="secondary" onClick={() => setShowAdd(false)} aria-label="Cancel adding competitor">
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <Page>
      <PageHeader
        title="Competitors"
        subtitle={totalResponses === 0
          ? 'No responses measured yet.' // copy: pending bg-copy
          : `Top competitors mentioned across ${responseWord(totalResponses)} for ${brandName}`} // copy: pending bg-copy
        actions={
          <Button variant="secondary" icon={Plus} onClick={() => setShowAdd(v => !v)} aria-expanded={showAdd}>
            Add manually
          </Button>
        }
      />

      {loadError && <div className="mb-6"><LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} /></div>}

      {manualFailed && <div className="mb-6"><LoadErrorCard message="Couldn't load your manually tracked competitors." onRetry={() => { void loadManual() }} /></div>}

      {competitorError && (
        <div className="mb-6">
          <Notice tone="neg" title={competitorError} action={<Button variant="ghost" size="sm" icon={X} onClick={() => setCompetitorError(null)} aria-label="Dismiss">Dismiss</Button>} />
        </div>
      )}

      {addForm}

      <div className="space-y-8">
        {/* 1. Hero. The shared card keeps a 280 floor; this answer is short, so
            on a phone the floor is lifted here to remove the empty bottom space. */}
        {noCompetitors ? (
          <HeroAnswer
            answer=""
            empty={{
              icon: Tag,
              title: 'Not measured yet',
              body: 'Competitors appear when AI answers name other companies for your prompts.', // copy: pending bg-copy
              actionLabel: 'Add a competitor',
              onAction: () => setShowAdd(true),
              variant: 'inline',
            }}
          />
        ) : (
          <div className="max-md:[&>*]:min-h-0">
            <HeroAnswer
              value={brandMentions}
              unit={brandMentions === 1 ? 'mention' : 'mentions'}
              answer={top
                ? (tiedAtTop > 1
                  ? `AI engines named ${brandName} ${timesWord(brandMentions)}; ${tiedAtTop} competitors were each named ${timesWord(top.totalMentions)}.`
                  : `AI engines named ${brandName} ${timesWord(brandMentions)}; the most named competitor, ${top.name}, ${timesWord(top.totalMentions)}.`) // copy: pending bg-copy
                : `AI engines named ${brandName} ${timesWord(brandMentions)}.`} // copy: pending bg-copy
              context={`across ${engineWord}`} // copy: pending bg-copy
            />
          </div>
        )}

        {!noCompetitors && (
          <>
            {/* 2. Share of mentions */}
            <section aria-labelledby="share-heading">
              <SectionHeader title={<span id="share-heading">Share of mentions</span>} description="How often AI engines named each company." />
              <Card>
                <BarList rows={shareRows} format={v => String(Math.round(v))} />
              </Card>
            </section>

            {/* 3. Competitor table */}
            <section>
              <SectionHeader
                title="Competitors"
                count={topCompetitors.length}
                actions={
                  <Button variant="secondary" size="sm" icon={Download} onClick={onExport} disabled={exportDisabled}
                    aria-label="Export competitors as CSV" title={exportDisabled ? 'Nothing to export yet' : undefined}>
                    Export CSV
                  </Button>
                }
              />

              {/* >= 768: table */}
              <div className={`${tableClasses.wrap} hidden md:block`}>
                <table className={`${tableClasses.table} table-fixed min-w-[720px]`}>
                  <caption className="sr-only">Competitors named in AI responses, with mention counts, average position, engines and a sample prompt</caption>
                  <colgroup>
                    <col style={{ minWidth: '140px' }} />
                    <col style={{ width: '7rem' }} />
                    <col style={{ width: '7rem' }} />
                    <col style={{ width: '10rem' }} />
                    <col />
                  </colgroup>
                  <thead className={tableClasses.thead}>
                    <tr>
                      <th scope="col" className={tableClasses.th}>Competitor</th>
                      <th scope="col" className={tableClasses.thRight}>AI mentions</th>
                      <th scope="col" className={tableClasses.thRight}>Avg position</th>
                      <th scope="col" className={tableClasses.th}>Engines</th>
                      <th scope="col" className={tableClasses.th}>Sample prompt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`${tableClasses.tr} bg-accent-tint`}>
                      <th scope="row" className={`${tableClasses.td} text-left font-semibold`}>
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="break-words">{brandName}</span>
                          <Badge tone="accent">you</Badge>
                        </span>
                      </th>
                      <td className={tableClasses.tdRight}>{brandMentions}</td>
                      <td className={tableClasses.tdRight}>{brandAvgPos ? fmtPos(brandAvgPos) : <span className="text-ink-3">Not ranked</span>}</td>
                      <td className={tableClasses.tdMuted}>{brandEnginesLabel || <span className="text-ink-3">n/a</span>}</td>
                      <td className={tableClasses.tdMuted}><span className="text-ink-3">No sample prompt</span></td>
                    </tr>
                    {topCompetitors.map(c => {
                      const samplePrompt = samplePromptFor(c, promptText) || null
                      return (
                        <tr key={c.name} className={tableClasses.tr}>
                          <th scope="row" className={`${tableClasses.td} text-left font-normal`}>
                            <span className="flex items-center gap-2">
                              <span className="break-words">{c.name}</span>
                              <TrendingDown size={12} className="text-neg shrink-0" role="img" aria-label="Named instead of you" />
                            </span>
                          </th>
                          <td className={tableClasses.tdRight}>
                            {c.totalMentions}
                            {c.rankedMentions === 0 && (
                              <span className="block text-meta text-ink-3" title="Named in prose, but never ranked in a list by any engine">prose only</span>
                            )}
                          </td>
                          <td className={tableClasses.tdRight}>{c.avgPos ? fmtPos(c.avgPos) : <span className="text-ink-3">Not ranked</span>}</td>
                          <td className={tableClasses.tdMuted}>{enginesLabel(c) || <span className="text-ink-3">n/a</span>}</td>
                          <td className={`${tableClasses.tdMuted} truncate`} title={samplePrompt ?? ''}>
                            {samplePrompt ?? <span className="text-ink-3">No sample prompt</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* < 768: list */}
              <div className="md:hidden">
                <DataList
                  ariaLabel="Competitors named in AI responses"
                  rows={[{ you: true as const, c: null as CompetitorAggregate | null }, ...topCompetitors.map(c => ({ you: false as const, c }))]}
                  getKey={r => r.c?.name ?? '__you'}
                  renderRow={r => {
                    const key = r.c?.name ?? '__you'
                    const pos = r.you ? brandAvgPos : r.c?.avgPos ?? null
                    const n = r.you ? brandMentions : r.c?.totalMentions ?? 0
                    const sp = r.c ? (samplePromptFor(r.c, promptText) || null) : null
                    const open = openRow === key
                    return (
                      <div className={r.you ? 'w-[calc(100%+2rem)] min-w-0 shrink-0 bg-accent-tint -mx-4 px-4 -my-3 py-3' : 'w-full min-w-0'}>
                        <button type="button" aria-expanded={open} onClick={() => setOpenRow(open ? null : key)} className="w-full text-left min-h-[44px]">
                          <span className="flex items-center gap-2 flex-wrap text-body text-ink font-medium">
                            <span className="break-words min-w-0">{r.you ? brandName : r.c?.name}</span>
                            {r.you && <Badge tone="accent">you</Badge>}
                          </span>
                          <span className="block text-meta text-ink-2 tabular-nums">
                            {mentionWord(n)}{pos ? `, avg ${fmtPos(pos)}` : ', not ranked'}
                          </span>
                        </button>
                        {open && (
                          <p className="mt-1 mb-0 text-meta text-ink-2 break-words">
                            {sp ?? 'No sample prompt'}
                          </p>
                        )}
                      </div>
                    )
                  }}
                />
              </div>
            </section>

            {/* 4. By engine and over time */}
            <Disclosure title="By engine and over time">
              <div className="space-y-8 pt-3">
                <div>
                  <SectionHeader level={3} title="Visibility by engine" description="% of prompts where each brand appears, per AI engine" />
                  {engineGroupData.length === 0 ? (
                    <EmptyState variant="inline" icon={Tag} title="Not enough data yet" body="Engine results appear after a collection runs." minHeight={200} /> // copy: pending bg-copy
                  ) : singleEngineRow ? (
                    <BarList
                      rows={groupKeys.map((k, i) => ({ label: k, value: Number(singleEngineRow[k] ?? 0), isYou: i === 0 }))}
                      format={v => `${Math.round(v)}%`}
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={engineGroupData} margin={{ left: 0, right: 8, bottom: 4 }} barCategoryGap="25%">
                        <CartesianGrid {...gridProps(chart)} />
                        <XAxis dataKey="engine" {...axisProps(chart)} />
                        <YAxis {...yPercentAxis(chart)} />
                        <Tooltip content={<ChartTooltip formatValue={item => `${item.value}%`} />} cursor={{ fill: chart.gridLine, fillOpacity: 0.35 }} />
                        <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
                        {groupKeys.map((key, i) => (
                          <Bar key={key} dataKey={key} fill={i === 0 ? chart.you : chart.field} fillOpacity={i === 0 ? 1 : [0.85, 0.6, 0.4][i - 1] ?? 0.4} {...barProps(chart)} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div>
                  <SectionHeader
                    level={3}
                    title="Performance over time"
                    description={`AI mention trends for ${brandName} vs top competitors`}
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
                  {trendLoading ? (
                    <SkeletonChart h={240} />
                  ) : trendFailed && trendRows.length === 0 ? (
                    <LoadErrorCard message="Couldn't load the trend." onRetry={() => { void loadTrend(false) }} />
                  ) : trendData.length < 2 ? (
                    <EmptyState variant="inline" minHeight={240} title="Not enough data yet" body="Trend fills in as collections accumulate" /> // copy: pending bg-copy
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={trendData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                        <CartesianGrid {...gridProps(chart)} />
                        <XAxis dataKey="period" {...axisProps(chart)} minTickGap={24} />
                        <YAxis {...axisProps(chart)} allowDecimals={false} width={40} tickCount={4} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.gridLine, strokeWidth: 1 }} />
                        <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
                        {/* The field first, you last: later series paint on top. */}
                        {topCompetitors.slice(0, 3).map((c, i) => (
                          <Line key={c.name} type="monotone" dataKey={c.name} stroke={chart.field}
                            strokeDasharray={fieldDash[i % fieldDash.length]} {...lineProps(chart)} />
                        ))}
                        <Line type="monotone" dataKey={brandName} stroke={chart.you} {...lineProps(chart)} strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </Disclosure>
          </>
        )}

        {/* 5. Your tracked competitors */}
        {manualComps.length > 0 && (
          <section>
            <SectionHeader title="Your tracked competitors" count={manualComps.length} />
            <DataList
              ariaLabel="Your tracked competitors"
              rows={manualComps}
              getKey={c => c.id}
              renderRow={c => (
                <>
                  <span className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-body text-ink break-words">{c.name}</span>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer"
                        aria-label={`Visit ${c.name} website`}
                        className="row-actions inline-flex" onClick={e => e.stopPropagation()}>
                        <Globe size={14} aria-hidden="true" />
                      </a>
                    )}
                  </span>
                  <IconButton label={`Remove ${c.name}`} icon={Trash2} className="row-actions" onClick={() => deleteManual(c.id)} />
                </>
              )}
            />
          </section>
        )}
      </div>
    </Page>
  )
}
