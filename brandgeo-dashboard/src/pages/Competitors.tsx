/**
 * Competitors.tsx
 * Driven entirely from ai_results.competitors_mentioned -- no legacy page_analysis.
 * Shows top 5 competitors by AI mention frequency vs the client brand.
 * Radar chart: 5 axes = 5 AI engines, showing visibility profile per entity.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { Plus, Trash2, Check, X, Globe, Tag, TrendingDown, Download } from 'lucide-react'
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
  type TrendPeriod, type TrendRow,
} from '../lib/views/competitorsView'
import { ENGINE_META } from '../lib/planConfig'
import type { CompetitorAggregate } from '../lib/competitorFilter'
import { useChartTheme } from '../lib/chartTheme'
import ChartTooltip from '../components/ChartTooltip'
import ChartLegend from '../components/ChartLegend'
import { PageTitle } from '../components/Typography'
import SharedEmptyState from '../components/EmptyState'
import LoadErrorCard from '../components/LoadErrorCard'
import RouteSkeleton from '../components/RouteSkeleton'
import Skeleton from '../components/Skeleton'
import type { LLMName } from '../types'

// --- Types -------------------------------------------------------------------

// Engine label/color sourced from ENGINE_META (planConfig.ts), not hardcoded here — this
// file used to re-declare its own hex values and had drifted (Claude was '#8b5cf6' here vs
// ENGINE_META's '#a855f7') per DESIGN-SYSTEM.md §1/§5's flagged duplication risk.
const ENGINE_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(ENGINE_META).map(([id, meta]) => [id, meta.label])
)
const ENGINE_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(ENGINE_META).map(([id, meta]) => [id, meta.chartColor])
)

/**
 * The noise filter (GENERIC_TOKENS / isLikelyCompanyName / toDisplayName) and the
 * competitor aggregation loop that used to live in this file both moved to
 * lib/competitorFilter.ts (2026-07-13, CLAUDE.md §14.2) — it was the last front-end
 * copy of a filter triplicated across this file, Recommendations.tsx, and the
 * authoritative write-time filter in netlify/functions/_analysis.js. See that
 * module's header for the full history and why two copies (not one) is the
 * deliberate floor.
 *
 * `CompetitorAggregate` already carries every field this page used
 * (name/totalMentions/rankedMentions/byEngine/avgPos), plus `positions` and
 * `promptIds` — added to the shared type specifically so this page didn't need a
 * second, parallel loop to rebuild them.
 */
type CompetitorStat = CompetitorAggregate

// --- Charts ------------------------------------------------------------------

const short = (s: string, n = 10) => s.length > n ? s.slice(0, n - 1) + '…' : s

/**
 * Empty-cell placeholder. Replaces the bare em dash this page used to render in
 * `text-slate-700`, which measured 1.72:1 on --dark-800 and was the last
 * dark-mode contrast failure anywhere in the app (audit 2026-07-30, F5).
 *
 * Two faults were wearing one glyph. It was unreadable, and a lone dash does not
 * say WHAT is missing on a product whose whole claim is honest measurement, so
 * every call site below now passes the specific reason the cell is empty
 * ("Not ranked", "No sample prompt") rather than a punctuation mark.
 *
 * `text-slate-500` is the palette's existing muted step and is the only muted
 * value that is remapped in BOTH themes: index.css:143 lifts it to
 * rgb(148 163 184) in dark and index.css:170 drops it to rgb(85 100 121) in
 * light, precisely so it stays muted without going invisible. No new token is
 * needed and index.css is not touched.
 */
function NoData({ children }: { children: ReactNode }) {
  return <span className="text-slate-500 font-normal">{children}</span>
}

/**
 * Segmented trend control. The hit area, not the label, is what was undersized:
 * these measured 29x24 in the first audit and 32x33 once the earlier pass landed
 * a 32px floor. 32x33 passes WCAG 2.2 SC 2.5.8 (24x24 minimum) but sits under the
 * 44x44 best practice, which the owner has decided to meet at every width, not
 * only under a coarse pointer. The previous coarse-pointer clause is therefore
 * gone: it delivered 44x44 only on touch hardware, and a desktop browser at
 * 375px wide still reports `pointer: fine`, so the narrow case measured 32x33.
 *
 * The visual stays 32x32. The target is expanded by a transparent `::after` at a
 * negative inset, the pattern index.css already ships for `.time-pill` and
 * `.engine-chip`. -inset-1.5 is -6px on all four sides, so 32 + 6 + 6 = 44 in
 * both axes. Expressed as a utility here rather than a rule because index.css is
 * owned by the coordinator and off limits to this change.
 *
 * The gap-3 in TREND_GROUP is load-bearing and must not be reduced. Three 44px
 * targets whose visuals are 32px wide need their centres at least 44px apart, so
 * the gap floor is 44 - 32 = 12px exactly. This was verified on the running app
 * rather than argued: with the ::after in place but the gap forced back to 4px,
 * the three chips hit-test at 37x45, 36x45 and 44x45, because a later sibling's
 * pseudo-element paints over an earlier one and the first two chips lose 8px of
 * their own hit area to their right-hand neighbour. Raising the target without
 * raising the gap would have made mis-taps worse, not better. At gap-3 all three
 * measure 44 to 45 in both axes with zero overlap.
 */
const TREND_CHIP_TARGET =
  "relative inline-flex items-center justify-center min-w-[32px] min-h-[32px] " +
  "after:content-[''] after:absolute after:-inset-1.5"
const TREND_GROUP = 'flex gap-3 bg-dark-700 rounded-lg p-1'

/**
 * Categorical palette for the competitor lines in the trend chart. No existing
 * token set fits: ENGINE_META colours mean engines, and chartTheme carries only
 * the brand, sentiment and chrome colours. Eight hues, none of them the brand
 * violet, each with relative luminance between about 0.14 and 0.30 so the line
 * holds at least 3:1 (WCAG 1.4.11) on BOTH the dark card (#1e293b, #0f172a) and
 * the white light card. Measured: lowest on white 3.00 (orange), lowest on dark
 * 3.34 to 3.55 (blue, magenta). Cycled past eight.
 */
const COMPETITOR_SERIES_COLORS = [
  '#e07b00', // orange
  '#2f86d6', // blue
  '#d6409f', // magenta
  '#1f9e89', // teal
  '#9a7d0a', // gold
  '#d9534f', // coral
  '#4f9d2d', // green
  '#7c8fd9', // periwinkle
]

/** Stable colour per competitor: index in the alphabetical name order, so a rank change never recolours a line. */
function buildCompetitorColors(names: string[]): Record<string, string> {
  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  const out: Record<string, string> = {}
  sorted.forEach((n, i) => { out[n] = COMPETITOR_SERIES_COLORS[i % COMPETITOR_SERIES_COLORS.length] })
  return out
}

/**
 * Competitor rows are not engines (dashboard-visual-system.md §9.5). Colour is
 * resolved at RENDER time from the current chart theme, not baked in here:
 * the tenant's own brand renders in --rail-active and every competitor
 * renders in one flat --sentiment-neutral — identity here is "you vs. the
 * field", not nine distinguishable hues. Rank is already carried by bar
 * length and sort order, which is the whole reason the old index-keyed
 * per-position colour arrays existed here and drifted (F-22).
 */
function buildBarData(brandName: string, brandMentions: number, topCompetitors: CompetitorStat[]) {
  return [
    { name: short(brandName), fullName: brandName, mentions: brandMentions, isYou: true },
    ...topCompetitors.map(c => ({
      name: short(c.name),
      fullName: c.name,
      mentions: c.totalMentions,
      isYou: false,
    })),
  ]
}

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
  const brandName = activeClient?.name ?? 'Your brand'
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

  if (snapshot === null || snap === null) {
    if (status === 'error') {
      return (
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          <div className="mb-6"><PageTitle>Competitors</PageTitle></div>
          <LoadErrorCard onRetry={() => reload()} />
        </div>
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
  const brandEngineIds = view.population.engineIds.filter(e =>
    view.population.cells.some(c => c.llm === e && c.brand_mentioned))
  const barData         = buildBarData(brandName, brandMentions, topCompetitors)
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
  // "You vs. the field" (§9.5) — resolved from the live chart theme, never a
  // hand-picked hex, and never an array index (that's what F-22 was).
  const colorForKey = (key: string) => key === brandName ? chart.railActive : chart.sentimentNeutral
  // Trend lines only: one distinct colour per competitor (the legend reads the same stroke).
  const competitorColors = buildCompetitorColors(topCompetitors.map(c => c.name))

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header. flex-wrap + min-w-0 are load-bearing at 320: without them the
          title column cannot shrink below its content and the Add manually
          button cannot drop to a second line, so <main> overflowed (338 against
          a 320 clientWidth). Pre-existing, found 2026-07-30 when 320 was first
          tested. The document itself never overflowed, so only a checker reading
          <main> could see it. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-0.5">
            <PageTitle>Competitors</PageTitle>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalResponses === 0
              ? 'No responses measured yet.'
              : `Top competitors mentioned across ${totalResponses} AI responses for ${brandName}`}
          </p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          aria-expanded={showAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors">
          <Plus size={14} />
          Add manually
        </button>
      </div>

      {loadError && <LoadErrorCard message="Couldn't refresh these results. What you see may be out of date." onRetry={() => reload({ quiet: true })} />}

      {manualFailed && <LoadErrorCard message="Couldn't load your manually tracked competitors." onRetry={() => { void loadManual() }} />}

      {competitorError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start justify-between gap-3">
          <span>{competitorError}</span>
          <button onClick={() => setCompetitorError(null)} aria-label="Dismiss" className="relative flex-shrink-0 text-red-300/70 hover:text-red-200 after:absolute after:content-[''] after:[inset:-15px]">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-dark-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">AI mentions of {brandName}</div>
          <div className={`text-2xl font-bold tabular-nums ${totalResponses === 0 ? 'text-slate-500' : 'text-brand-300'}`}>{brandMentions}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {brandAvgPos ? `Avg position #${brandAvgPos}` : 'No position data'}
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Top competitor</div>
          <div className="text-sm font-bold text-red-300 leading-tight mt-1">
            {topCompetitors[0]?.name ?? <NoData>None yet</NoData>}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {topCompetitors[0]
              ? `${topCompetitors[0].totalMentions} AI mentions`
              : 'No competitor named in AI responses'}
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Competitors tracked</div>
          <div className="text-2xl font-bold text-white tabular-nums">{topCompetitors.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">from AI responses</div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">AI responses analysed</div>
          <div className="text-2xl font-bold text-slate-300 tabular-nums">{totalResponses}</div>
          <div className="text-xs text-slate-500 mt-0.5">across {activeEngines.length} engine{activeEngines.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      {/* Add manually */}
      {showAdd && (
        <div className="mb-5 bg-dark-800 rounded-xl p-4 flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <div>
              <label htmlFor="competitor-name-input" className="text-xs text-slate-500 mb-1 block">Competitor name</label>
              <input id="competitor-name-input" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="e.g. Premier Catering"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label htmlFor="competitor-website-input" className="text-xs text-slate-500 mb-1 block">Website (optional)</label>
              <input id="competitor-website-input" value={newWebsite} onChange={e => setNewWebsite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="https://example.com"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="flex gap-2 pb-0.5">
            <button onClick={addCompetitor} disabled={saving || !newName.trim()}
              aria-label="Add competitor"
              className="p-2.5 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40 transition-colors">
              <Check size={16} />
            </button>
            <button onClick={() => setShowAdd(false)}
              aria-label="Cancel adding competitor"
              className="p-2.5 rounded-lg bg-dark-700 text-slate-400 hover:bg-dark-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Charts */}
      {topCompetitors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* Bar chart — AI mention counts */}
          <div className="bg-dark-800 rounded-xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              AI Mention Count
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ left: -20, bottom: 10, right: 8 }}>
                <CartesianGrid stroke={chart.gridLine} strokeWidth={1} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: chart.axisInk, fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={0} />
                <YAxis tick={{ fill: chart.axisInk, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={40} tickCount={4} />
                <Tooltip
                  content={<ChartTooltip
                    formatValue={item => `${item.value} AI mentions`}
                    formatLabel={(_l, payload) => String(payload?.[0]?.payload?.fullName ?? '')}
                  />}
                  cursor={{ fill: chart.gridLine, fillOpacity: 0.35 }}
                />
                <Bar dataKey="mentions" name="AI mentions" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {barData.map(entry => <Cell key={entry.fullName} fill={entry.isYou ? chart.railActive : chart.sentimentNeutral} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grouped bar chart — visibility % per AI engine per brand */}
          <div className="bg-dark-800 rounded-xl p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
              Visibility by Engine
            </h2>
            <p className="text-[11px] text-slate-600 mb-3">% of prompts where each brand appears, per AI engine</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={engineGroupData} margin={{ left: -20, right: 8, bottom: 4 }} barCategoryGap="25%">
                <CartesianGrid stroke={chart.gridLine} strokeWidth={1} vertical={false} />
                <XAxis dataKey="engine" tick={{ fill: chart.axisInk, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chart.axisInk, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} width={40} tickCount={4} />
                <Tooltip
                  content={<ChartTooltip formatValue={item => `${item.value}%`} />}
                  cursor={{ fill: chart.gridLine, fillOpacity: 0.35 }}
                />
                <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
                {groupKeys.map(key => (
                  <Bar key={key} dataKey={key} fill={colorForKey(key)} radius={[3, 3, 0, 0]} maxBarSize={28} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-2">
        <button type="button" onClick={onExport} disabled={exportDisabled}
          aria-label="Export competitors as CSV"
          title={exportDisabled ? 'Nothing to export yet' : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Competitors table. A real table so screen readers get row and column
          context; the wrapper scrolls sideways on a phone instead of the page. */}
      <div className="bg-dark-800 rounded-xl overflow-x-auto mb-4">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
          <caption className="sr-only">Competitors named in AI responses, with mention counts, average position, engines and a sample prompt</caption>
          <colgroup>
            <col />
            <col style={{ width: '7rem' }} />
            <col style={{ width: '7rem' }} />
            <col style={{ width: '7rem' }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-dark-700 bg-dark-700/40">
              <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Competitor</th>
              <th scope="col" className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">AI Mentions</th>
              <th scope="col" className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Avg Position</th>
              <th scope="col" className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Engines</th>
              <th scope="col" className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Sample prompts</th>
            </tr>
          </thead>
          <tbody>
            {/* Brand row */}
            <tr className="border-b border-dark-700/50 bg-brand-500/5">
              <th scope="row" className="px-4 py-3 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-brand-300">{brandName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400">you</span>
                </span>
              </th>
              <td className={`px-3 py-3 text-center font-bold tabular-nums ${totalResponses === 0 ? 'text-slate-500' : 'text-emerald-400'}`}>{brandMentions}</td>
              <td className={`px-3 py-3 text-center tabular-nums font-semibold ${totalResponses === 0 ? 'text-slate-500' : 'text-emerald-400'}`}>
                {brandAvgPos ? `#${brandAvgPos}` : <NoData>Not ranked</NoData>}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {brandEngineIds.map(e => (
                    <span key={e} className="w-2 h-2 rounded-full" style={{ background: ENGINE_COLOR[e] }} title={ENGINE_LABEL[e]} />
                  ))}
                </div>
              </td>
              <td className="px-3 py-3 text-xs"><NoData>No sample prompt</NoData></td>
            </tr>

            {topCompetitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <SharedEmptyState
                    icon={Tag}
                    title="Not measured yet"
                    body="Competitors mentioned by AI appear here automatically once a collection runs. You can also add one manually below."
                    actionLabel="Run a collection"
                    actionTo="/ai-visibility"
                  />
                </td>
              </tr>
            ) : (
              topCompetitors.map((c, idx) => {
                const engineDots = view.population.engineIds.filter(e => (c.byEngine[e] ?? 0) > 0)
                const samplePrompt = samplePromptFor(c, promptText) || null
                const sampleText = samplePrompt
                  ? (samplePrompt.length > 60 ? samplePrompt.slice(0, 58) + '…' : samplePrompt)
                  : null

                return (
                  <tr key={c.name} className="border-b border-dark-700/50 last:border-0 hover:bg-dark-700/20 transition-colors">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-dark-700 text-slate-400">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                        <TrendingDown size={12} className="text-red-500/60 flex-shrink-0" aria-hidden="true" />
                      </span>
                    </th>
                    <td className="px-3 py-3 text-center tabular-nums">
                      <span className="text-red-400 font-semibold">{c.totalMentions}</span>
                      {/* Never ranked by any engine, only spotted in prose (pos:99).
                          Without this the number reads as if they beat you in a list. */}
                      {c.rankedMentions === 0 && (
                        <span className="block text-[10px] text-slate-500 leading-tight" title="Named in prose, but never ranked in a list by any engine">
                          prose only
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums text-slate-300">
                      {c.avgPos ? `#${c.avgPos}` : <NoData>Not ranked</NoData>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {engineDots.map(e => (
                          <span key={e} className="w-2 h-2 rounded-full" style={{ background: ENGINE_COLOR[e] }} title={`${ENGINE_LABEL[e]}: ${c.byEngine[e]}×`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 truncate" title={samplePrompt ?? ''}>
                      {sampleText ?? <NoData>No sample prompt</NoData>}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manually tracked (secondary) */}
      {manualComps.length > 0 && (
        <div className="bg-dark-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
            Manually tracked
          </div>
          {manualComps.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 last:border-0 hover:bg-dark-700/20 group transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">{c.name}</span>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    aria-label={`Visit ${c.name} website`}
                    className="text-slate-600 hover:text-brand-400 transition-colors" onClick={e => e.stopPropagation()}>
                    <Globe size={13} />
                  </a>
                )}
              </div>
              <button onClick={() => deleteManual(c.id)}
                aria-label={`Remove ${c.name}`}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-70 hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Performance Over Time */}
      <div className="bg-dark-800 rounded-xl p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Performance Over Time</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI mention trends for {brandName} vs top competitors
            </p>
          </div>
          <div className={TREND_GROUP}>
            {(['weekly', 'monthly', 'quarterly'] as const).map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)}
                aria-pressed={trendPeriod === p}
                aria-label={`View ${p} trend`}
                className={`${TREND_CHIP_TARGET} px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  trendPeriod === p ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {p === 'weekly' ? 'W' : p === 'monthly' ? 'M' : 'Q'}
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <Skeleton className="h-[220px] w-full rounded-lg" />
        ) : trendFailed && trendRows.length === 0 ? (
          <LoadErrorCard message="Couldn't load the trend." onRetry={() => { void loadTrend(false) }} />
        ) : trendData.length < 2 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">Not enough data yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Trend chart fills in as monthly collections accumulate
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={chart.gridLine} strokeWidth={1} vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: chart.axisInk, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: chart.axisInk, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={40}
                tickCount={4}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: chart.gridLine, strokeWidth: 1 }}
              />
              <Legend content={<ChartLegend />} verticalAlign="top" align="left" height={28} />
              {/* The brand keeps the same colour as in the grouped bar chart above
                  (colorForKey). Competitors get distinct hues here because a line
                  chart with four identical grey lines cannot be read. */}
              {/* Competitors first, brand last: later series paint on top, and the
                  brand line is thicker, so it stays the primary read. */}
              {topCompetitors.slice(0, 4).map(c => (
                <Line
                  key={c.name}
                  type="monotone"
                  dataKey={c.name}
                  stroke={competitorColors[c.name]}
                  strokeWidth={1.75}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: chart.cardSurface }}
                />
              ))}
              <Line
                type="monotone"
                dataKey={brandName}
                stroke={colorForKey(brandName)}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: chart.cardSurface }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
