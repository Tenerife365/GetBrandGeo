/**
 * Competitors.tsx
 * Driven entirely from ai_results.competitors_mentioned -- no legacy page_analysis.
 * Shows top 5 competitors by AI mention frequency vs the client brand.
 * Radar chart: 5 axes = 5 AI engines, showing visibility profile per entity.
 */

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { Plus, Trash2, Check, X, Globe, Tag, TrendingDown } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockCompetitors } from '../lib/mockData'
import { useMarket } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import { ENGINE_META } from '../lib/planConfig'
import { aggregateCompetitors, type CompetitorAggregate } from '../lib/competitorFilter'
import { useChartTheme } from '../lib/chartTheme'
import type { LLMName } from '../types'

// --- Types -------------------------------------------------------------------

// ENGINES is kept for display-only fallback; runtime filtering uses activeEngines from context
const ENGINES: LLMName[] = ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai']
// Engine label/color sourced from ENGINE_META (planConfig.ts), not hardcoded here — this
// file used to re-declare its own hex values and had drifted (Claude was '#8b5cf6' here vs
// ENGINE_META's '#a855f7') per DESIGN-SYSTEM.md §1/§5's flagged duplication risk.
const ENGINE_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(ENGINE_META).map(([id, meta]) => [id, meta.label])
)
const ENGINE_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(ENGINE_META).map(([id, meta]) => [id, meta.chartColor])
)

interface EngineRow { total: number; mentioned: number; positions: number[] }

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

// --- Data computation --------------------------------------------------------

function computeData(
  aiResults: any[],
  prompts: any[],
  brandName: string,
) {
  const engineStats: Partial<Record<LLMName, EngineRow>> = {}

  for (const row of aiResults) {
    const llm = row.llm as LLMName
    if (!engineStats[llm]) engineStats[llm] = { total: 0, mentioned: 0, positions: [] }
    const es = engineStats[llm]!
    es.total++
    if (row.brand_mentioned) {
      es.mentioned++
      if (row.brand_position) es.positions.push(row.brand_position)
    }
  }

  // Top 5 competitors — one shared implementation (lib/competitorFilter.ts).
  // Already sorts genuinely-ranked competitors first (raw mentions only break
  // ties) and excludes the pos:99 prose sentinel from avgPos — not re-derived here.
  const topCompetitors: CompetitorStat[] = aggregateCompetitors(aiResults, 5)

  // Brand overall stats
  const brandMentions = Object.values(engineStats).reduce((s, e) => s + (e?.mentioned ?? 0), 0)
  const brandPositions = Object.values(engineStats).flatMap(e => e?.positions ?? [])
  const brandAvgPos = brandPositions.length > 0
    ? Math.round(brandPositions.reduce((a, b) => a + b, 0) / brandPositions.length * 10) / 10
    : null

  const promptMap = new Map(prompts.map((p: any) => [p.id, p.text]))

  return { engineStats, topCompetitors, brandMentions, brandAvgPos, promptMap }
}

// --- Trend computation -------------------------------------------------------

type TrendPeriod = 'weekly' | 'monthly' | 'quarterly'

function computeTrend(
  aiResults: any[],
  brandName: string,
  topCompetitors: CompetitorStat[],
  period: TrendPeriod,
): Record<string, string | number>[] {
  if (!aiResults.length) return []

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

  const compNames = topCompetitors.slice(0, 4).map(c => c.name)
  const buckets: Record<string, Record<string, number>> = {}

  for (const row of aiResults) {
    const key = getPeriodKey(new Date(row.checked_at))
    if (!buckets[key]) {
      buckets[key] = { [brandName]: 0 }
      for (const n of compNames) buckets[key][n] = 0
    }
    if (row.brand_mentioned) buckets[key][brandName]++
    let comps: any[] = []
    try { comps = JSON.parse(row.competitors_mentioned || '[]') } catch {}
    for (const c of comps) {
      const n = typeof c === 'string' ? c : c?.name
      const match = compNames.find(cn => cn.toLowerCase() === n?.toLowerCase())
      if (match) buckets[key][match]++
    }
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, counts]) => ({ period: p, ...counts }))
}

// --- Charts ------------------------------------------------------------------

const short = (s: string, n = 10) => s.length > n ? s.slice(0, n - 1) + '…' : s

function buildBarData(brandName: string, brandMentions: number, topCompetitors: CompetitorStat[]) {
  return [
    { name: short(brandName), fullName: brandName, mentions: brandMentions, fill: '#8b5cf6', isYou: true },
    ...topCompetitors.map(c => ({
      name: short(c.name),
      fullName: c.name,
      mentions: c.totalMentions,
      // Competitors share one quiet hue — the brand's violet bar is the focal
      // point (you vs them), and the x-axis label already identifies each
      // competitor, so 5 different bar colors was decorative rainbow, not meaning.
      fill: '#64748b',
      isYou: false,
    })),
  ]
}

/** One row per active engine; columns = brand + top 3 competitors (% of prompts) */
function buildEngineGroupData(
  brandName: string,
  engineStats: Partial<Record<LLMName, EngineRow>>,
  topCompetitors: CompetitorStat[],
  activeEngines: LLMName[],
): Record<string, string | number>[] {
  return activeEngines
    .filter(e => (engineStats[e]?.total ?? 0) > 0)
    .map(engine => {
      const es = engineStats[engine]!
      const row: Record<string, string | number> = { engine: ENGINE_LABEL[engine] }
      row[brandName] = es.total > 0 ? Math.round(es.mentioned / es.total * 100) : 0
      for (const comp of topCompetitors.slice(0, 3)) {
        row[comp.name] = es.total > 0 ? Math.round((comp.byEngine[engine] ?? 0) / es.total * 100) : 0
      }
      return row
    })
}

// --- Main component ----------------------------------------------------------

export default function Competitors() {
  const { primaryMarket } = useMarket()
  const { activeClientId, activeClient, activeEngines } = useClient()
  const chart = useChartTheme()
  const brandName = activeClient?.name ?? 'Your brand'

  const [data, setData] = useState<ReturnType<typeof computeData> | null>(null)
  const [allResults, setAllResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [manualComps, setManualComps] = useState<any[]>([])
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('weekly')

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      setData({
        engineStats: {},
        topCompetitors: mockCompetitors.slice(0, 5).map((c, i) => ({
          name: c.name, totalMentions: 8 - i * 1.5 | 0, rankedMentions: 2,
          proseOnly: false,
          byEngine: { chatgpt: 2, gemini: 2, claude: 1 },
          positions: [2, 3], promptIds: [], avgPos: 2.5,
        })),
        brandMentions: 8, brandAvgPos: 2,
        promptMap: new Map(),
      })
      setLoading(false)
      return
    }

    const [{ data: aiResults }, { data: prompts }, { data: manual }] = await Promise.all([
      supabase.from('ai_results')
        .select('llm, brand_mentioned, brand_position, competitors_mentioned, prompt_id, checked_at')
        .eq('client_id', activeClientId),
      supabase.from('prompts').select('id, text').eq('client_id', activeClientId).eq('is_active', true),
      supabase.from('competitors').select('*').eq('client_id', activeClientId).eq('source', 'manual'),
    ])

    // Filter to active engines only before computing
    const filtered = (aiResults ?? []).filter(r => activeEngines.includes(r.llm))
    setData(computeData(filtered, prompts ?? [], brandName))
    setAllResults(filtered)
    setManualComps(manual ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId, brandName, activeEngines.join(',')])

  const addCompetitor = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const entry = { name: newName.trim(), website: newWebsite.trim() || null, source: 'manual' as const, client_id: activeClientId }
    if (!isDemoMode) {
      const { data: saved } = await supabase.from('competitors').insert(entry).select().single()
      if (saved) setManualComps(prev => [...prev, saved])
    }
    setNewName(''); setNewWebsite(''); setShowAdd(false); setSaving(false)
  }

  const deleteManual = async (id: number) => {
    if (!isDemoMode) await supabase.from('competitors').delete().eq('id', id)
    setManualComps(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading competitors…</div>

  const { engineStats, topCompetitors, brandMentions, brandAvgPos, promptMap } = data!
  const totalResponses = Object.values(engineStats).reduce((s, e) => s + (e?.total ?? 0), 0)
  const barData         = buildBarData(brandName, brandMentions, topCompetitors)
  const engineGroupData = buildEngineGroupData(brandName, engineStats, topCompetitors, activeEngines as LLMName[])
  const groupColors     = ['#8b5cf6', '#ef4444', '#f59e0b', '#3b82f6']
  const groupKeys       = [brandName, ...topCompetitors.slice(0, 3).map(c => c.name)]
  const trendData       = computeTrend(allResults, brandName, topCompetitors, trendPeriod)
  const trendColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-bold text-white">Competitors</h1>
            {primaryMarket && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
                {primaryMarket.flag} {primaryMarket.id} results
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Top competitors mentioned across {totalResponses} AI responses for {brandName}
          </p>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          aria-expanded={showAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors">
          <Plus size={14} />
          Add manually
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-dark-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">{brandName} — AI mentions</div>
          <div className="text-2xl font-bold text-brand-300 tabular-nums">{brandMentions}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {brandAvgPos ? `Avg position #${brandAvgPos}` : 'No position data'}
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Top competitor</div>
          <div className="text-sm font-bold text-red-300 leading-tight mt-1">
            {topCompetitors[0]?.name ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {topCompetitors[0] ? `${topCompetitors[0].totalMentions} AI mentions` : 'None found yet'}
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
          <div className="text-xs text-slate-500 mt-0.5">across {activeEngines.length} engines</div>
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
                <XAxis dataKey="name" tick={{ fill: chart.axisTick, fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={0} />
                <YAxis tick={{ fill: chart.axisTick, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={chart.tooltipContent}
                  labelStyle={chart.tooltipLabel}
                  itemStyle={chart.tooltipItem}
                  labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName ?? ''}
                  formatter={(v: any) => [v, 'AI mentions']}
                />
                <Bar dataKey="mentions" name="AI mentions" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
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
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="engine" tick={{ fill: chart.axisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chart.axisTick, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={chart.tooltipContent}
                  labelStyle={chart.tooltipLabel}
                  itemStyle={chart.tooltipItem}
                  formatter={(v: any) => [`${v}%`]}
                />
                <Legend wrapperStyle={{ fontSize: 10, color: chart.legend, paddingTop: 6 }} />
                {groupKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} fill={groupColors[i]} radius={[3, 3, 0, 0]} maxBarSize={28} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Competitors table */}
      <div className="bg-dark-800 rounded-xl overflow-hidden mb-4">
        <div className="grid border-b border-dark-700 bg-dark-700/40"
          style={{ gridTemplateColumns: '1fr 7rem 7rem 7rem 1fr' }}>
          <div className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Competitor</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">AI Mentions</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Avg Position</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Engines</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Sample prompts</div>
        </div>

        {/* Brand row */}
        <div className="grid border-b border-dark-700/50 bg-brand-500/5"
          style={{ gridTemplateColumns: '1fr 7rem 7rem 7rem 1fr' }}>
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-300">{brandName}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400">you</span>
          </div>
          <div className="px-3 py-3 text-center font-bold text-emerald-400 tabular-nums">{brandMentions}</div>
          <div className="px-3 py-3 text-center tabular-nums text-emerald-400 font-semibold">
            {brandAvgPos ? `#${brandAvgPos}` : '—'}
          </div>
          <div className="px-3 py-3 flex items-center justify-center gap-1 flex-wrap">
            {activeEngines.filter(e => (engineStats[e]?.mentioned ?? 0) > 0).map(e => (
              <span key={e} className="w-2 h-2 rounded-full" style={{ background: ENGINE_COLOR[e] }} title={ENGINE_LABEL[e]} />
            ))}
          </div>
          <div className="px-3 py-3 text-xs text-slate-500">—</div>
        </div>

        {topCompetitors.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-1">No competitors found in AI responses yet</p>
            <p className="text-xs text-slate-600">Run a collection from the AI Visibility tab — competitors mentioned by AI will appear here automatically.</p>
          </div>
        ) : (
          topCompetitors.map((c, idx) => {
            const engineDots = activeEngines.filter(e => (c.byEngine[e] ?? 0) > 0)
            const samplePrompt = c.promptIds[0] ? promptMap.get(c.promptIds[0]) : null
            const sampleText = samplePrompt
              ? (samplePrompt.length > 60 ? samplePrompt.slice(0, 58) + '…' : samplePrompt)
              : null

            return (
              <div key={c.name} className="grid border-b border-dark-700/50 last:border-0 hover:bg-dark-700/20 transition-colors"
                style={{ gridTemplateColumns: '1fr 7rem 7rem 7rem 1fr' }}>
                <div className="px-4 py-3 flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-dark-700 text-slate-400">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                  <TrendingDown size={12} className="text-red-500/60 flex-shrink-0" />
                </div>
                <div className="px-3 py-3 text-center tabular-nums">
                  <span className="text-red-400 font-semibold">{c.totalMentions}</span>
                  {/* Never ranked by any engine — only spotted in prose (pos:99).
                      Without this the number reads as if they beat you in a list. */}
                  {c.rankedMentions === 0 && (
                    <span className="block text-[10px] text-slate-500 leading-tight" title="Named in prose, but never ranked in a list by any engine">
                      prose only
                    </span>
                  )}
                </div>
                <div className="px-3 py-3 text-center tabular-nums text-slate-300">
                  {c.avgPos ? `#${c.avgPos}` : '—'}
                </div>
                <div className="px-3 py-3 flex items-center justify-center gap-1 flex-wrap">
                  {engineDots.map(e => (
                    <span key={e} className="w-2 h-2 rounded-full" style={{ background: ENGINE_COLOR[e] }} title={`${ENGINE_LABEL[e]}: ${c.byEngine[e]}×`} />
                  ))}
                </div>
                <div className="px-3 py-3 text-xs text-slate-500 truncate" title={samplePrompt ?? ''}>
                  {sampleText ?? <span className="text-slate-700">—</span>}
                </div>
              </div>
            )
          })
        )}
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
                aria-label={`Remove ${c.name} from tracked competitors`}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
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
              AI mention trends — {brandName} vs top competitors
            </p>
          </div>
          <div className="flex gap-1 bg-dark-700 rounded-lg p-1">
            {(['weekly', 'monthly', 'quarterly'] as const).map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)}
                aria-pressed={trendPeriod === p}
                aria-label={`View ${p} trend`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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
            <p className="text-xs text-slate-600 mt-1">
              Trend chart fills in as monthly collections accumulate
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fill: chart.axisTick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: chart.axisTick, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={chart.tooltipContent}
                labelStyle={chart.tooltipLabel}
                itemStyle={chart.tooltipItem}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: chart.legend, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey={brandName}
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {topCompetitors.slice(0, 4).map((c, i) => (
                <Line
                  key={c.name}
                  type="monotone"
                  dataKey={c.name}
                  stroke={trendColors[i]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
