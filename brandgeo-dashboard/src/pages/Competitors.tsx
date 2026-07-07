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
import type { LLMName } from '../types'

// --- Types -------------------------------------------------------------------

// ENGINES is kept for display-only fallback; runtime filtering uses activeEngines from context
const ENGINES: LLMName[] = ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta']
const ENGINE_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
  perplexity: 'Perplexity', meta: 'Meta AI',
  google_ai: 'Google AI', copilot: 'Copilot', deepseek: 'DeepSeek', grok: 'Grok',
}
const ENGINE_COLOR: Record<string, string> = {
  chatgpt: '#10b981', gemini: '#3b82f6', claude: '#8b5cf6',
  perplexity: '#06b6d4', meta: '#f59e0b',
  google_ai: '#ef4444', copilot: '#38bdf8', deepseek: '#818cf8', grok: '#94a3b8',
}

interface EngineRow { total: number; mentioned: number; positions: number[] }

interface CompetitorStat {
  name: string
  totalMentions: number
  byEngine: Partial<Record<LLMName, number>>
  positions: number[]
  promptIds: number[]
  avgPos: number | null
}

// --- Noise filter ------------------------------------------------------------
// AI responses sometimes include generic phrases in numbered lists (e.g.
// "Other large-scale options", "Alte optiuni de volum mare"). Filter these out
// so only real company names appear as competitors.

// Must match NOT_A_COMPANY in the Netlify collect functions — single source of truth.
const GENERIC_TOKENS = [
  'experienta', 'experiență', 'recomandare', 'capacitate', 'planificare',
  'infrastructur', 'specializare', 'diversitate', 'acoperire', 'competitivitate',
  'masiva', 'masivă', 'proprie', 'proprii',
  ' pentru ', 'datorit', 'grație', 'gratie',
  'options', 'providers', 'vendors', 'services', 'alternatives', 'solutions',
  'alte ', 'altele', 'optiuni', 'opțiuni', 'furnizori', 'companii de',
  'firme de', 'si altele', 'și altele',
]

function isLikelyCompanyName(name: string): boolean {
  if (name.length > 60) return false
  if (name.length < 2)  return false
  const lower = name.toLowerCase()
  if (GENERIC_TOKENS.some(t => lower.includes(t))) return false
  return /[a-zA-ZăâîșțÎȘȚĂÂ]/.test(name)
}

// Title-case a competitor name for display (handles "flavours catering" → "Flavours Catering")
function toDisplayName(name: string): string {
  return name.replace(/\b\w/g, c => c.toUpperCase())
}

// --- Data computation --------------------------------------------------------

function computeData(
  aiResults: any[],
  prompts: any[],
  brandName: string,
) {
  const engineStats: Partial<Record<LLMName, EngineRow>> = {}
  const compMap: Record<string, { totalMentions: number; byEngine: Partial<Record<LLMName, number>>; positions: number[]; promptIds: Set<number> }> = {}

  for (const row of aiResults) {
    const llm = row.llm as LLMName
    if (!engineStats[llm]) engineStats[llm] = { total: 0, mentioned: 0, positions: [] }
    const es = engineStats[llm]!
    es.total++
    if (row.brand_mentioned) {
      es.mentioned++
      if (row.brand_position) es.positions.push(row.brand_position)
    }

    let comps: any[] = []
    try { comps = JSON.parse(row.competitors_mentioned || '[]') } catch {}
    if (!Array.isArray(comps)) continue

    for (const c of comps) {
      const rawName = typeof c === 'string' ? c : c?.name
      if (!rawName || rawName.length < 2) continue
      if (!isLikelyCompanyName(rawName)) continue   // skip generic phrases
      const key = rawName.toLowerCase().trim()
      if (!compMap[key]) compMap[key] = { totalMentions: 0, byEngine: {}, positions: [], promptIds: new Set() }
      const cm = compMap[key]
      cm.totalMentions++
      cm.byEngine[llm] = (cm.byEngine[llm] ?? 0) + 1
      if (c?.pos) cm.positions.push(c.pos)
      if (row.prompt_id) cm.promptIds.add(row.prompt_id)
    }
  }

  // Top 5 competitors by total mentions
  const topCompetitors: CompetitorStat[] = Object.entries(compMap)
    .map(([key, v]) => ({
      name: toDisplayName(key),
      totalMentions: v.totalMentions,
      byEngine: v.byEngine,
      positions: v.positions,
      promptIds: Array.from(v.promptIds),
      avgPos: (() => {
        const real = v.positions.filter(p => p !== 99)
        return real.length > 0
          ? Math.round(real.reduce((a, b) => a + b, 0) / real.length * 10) / 10
          : null
      })(),
    }))
    .sort((a, b) => b.totalMentions - a.totalMentions)
    .slice(0, 5)

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
    { name: short(brandName), fullName: brandName, mentions: brandMentions, fill: '#1f9baa', isYou: true },
    ...topCompetitors.map((c, i) => ({
      name: short(c.name),
      fullName: c.name,
      mentions: c.totalMentions,
      fill: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'][i],
      isYou: false,
    })),
  ]
}

// --- Main component ----------------------------------------------------------

export default function Competitors() {
  const { primaryMarket } = useMarket()
  const { activeClientId, activeClient, activeEngines } = useClient()
  const brandName = activeClient?.name ?? 'Your brand'

  const [data, setData] = useState<ReturnType<typeof computeData> | null>(null)
  const [allResults, setAllResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWebsite, setNewWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [manualComps, setManualComps] = useState<any[]>([])
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly')

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      setData({
        engineStats: {},
        topCompetitors: mockCompetitors.slice(0, 5).map((c, i) => ({
          name: c.name, totalMentions: 8 - i * 1.5 | 0,
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
  const barData    = buildBarData(brandName, brandMentions, topCompetitors)
  const trendData  = computeTrend(allResults, brandName, topCompetitors, trendPeriod)
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors">
          <Plus size={14} />
          Add manually
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-dark-800 border border-brand-500/30 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">{brandName} — AI mentions</div>
          <div className="text-2xl font-bold text-brand-300 tabular-nums">{brandMentions}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {brandAvgPos ? `Avg position #${brandAvgPos}` : 'No position data'}
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Top competitor</div>
          <div className="text-sm font-bold text-red-300 leading-tight mt-1">
            {topCompetitors[0]?.name ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {topCompetitors[0] ? `${topCompetitors[0].totalMentions} AI mentions` : 'None found yet'}
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Competitors tracked</div>
          <div className="text-2xl font-bold text-white tabular-nums">{topCompetitors.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">from AI responses</div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">AI responses analysed</div>
          <div className="text-2xl font-bold text-slate-300 tabular-nums">{totalResponses}</div>
          <div className="text-xs text-slate-500 mt-0.5">across {activeEngines.length} engines</div>
        </div>
      </div>

      {/* Add manually */}
      {showAdd && (
        <div className="mb-5 bg-dark-800 border border-brand-500/30 rounded-xl p-4 flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Competitor name</label>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="e.g. Premier Catering"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Website (optional)</label>
              <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="https://example.com"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="flex gap-2 pb-0.5">
            <button onClick={addCompetitor} disabled={saving || !newName.trim()}
              className="p-2.5 rounded-lg bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 disabled:opacity-40 transition-colors">
              <Check size={16} />
            </button>
            <button onClick={() => setShowAdd(false)}
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
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              AI Mention Count
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ left: -20, bottom: 10, right: 8 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={0} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#cbd5e1', fontSize: 12 }}
                  itemStyle={{ color: '#94a3b8' }}
                  labelFormatter={(_: any, payload: any) => payload?.[0]?.payload?.fullName ?? ''}
                  formatter={(v: any) => [v, 'AI mentions']}
                />
                <Bar dataKey="mentions" name="AI mentions" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peec-style visibility % bar chart */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
              AI Visibility Rate
            </h2>
            <p className="text-[11px] text-slate-600 mb-5">% of AI responses where each brand appears</p>
            {(() => {
              const entries = [
                { name: brandName, mentions: brandMentions, isYou: true,  color: '#8b5cf6' },
                ...topCompetitors.slice(0, 4).map((c, i) => ({
                  name: c.name,
                  mentions: c.totalMentions,
                  isYou: false,
                  color: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][i],
                })),
              ]
              const maxMentions = Math.max(...entries.map(e => e.mentions), 1)
              return (
                <div className="flex items-end gap-3 h-40">
                  {entries.map(e => {
                    const pct = totalResponses > 0 ? Math.round(e.mentions / totalResponses * 100) : 0
                    const barH = maxMentions > 0 ? Math.max((e.mentions / maxMentions) * 100, 4) : 4
                    const initials = e.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <div key={e.name} className="flex-1 flex flex-col items-center gap-1.5">
                        {/* Avatar */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: e.color, opacity: e.isYou ? 1 : 0.75 }}
                        >
                          {initials}
                        </div>
                        {/* Bar */}
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t-md transition-all duration-500"
                            style={{
                              height: `${barH}%`,
                              background: e.isYou
                                ? `linear-gradient(180deg, ${e.color} 0%, ${e.color}88 100%)`
                                : `linear-gradient(180deg, ${e.color}99 0%, ${e.color}33 100%)`,
                            }}
                          />
                        </div>
                        {/* Label */}
                        <div className="text-[11px] font-semibold tabular-nums" style={{ color: e.color }}>
                          {pct}%
                        </div>
                        <div className="text-[10px] text-slate-600 truncate w-full text-center leading-tight">
                          {e.name.split(' ')[0]}
                          {e.isYou && <span className="ml-0.5 text-[9px] text-slate-500">(you)</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Competitors table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden mb-4">
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
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: ['#ef444420','#f59e0b20','#8b5cf620','#06b6d420','#10b98120'][idx], color: ['#ef4444','#f59e0b','#8b5cf6','#06b6d4','#10b981'][idx] }}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                  <TrendingDown size={12} className="text-red-500/60 flex-shrink-0" />
                </div>
                <div className="px-3 py-3 text-center tabular-nums">
                  <span className="text-red-400 font-semibold">{c.totalMentions}</span>
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
        <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-700 text-xs font-medium text-slate-400 uppercase tracking-wide">
            Manually tracked
          </div>
          {manualComps.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 last:border-0 hover:bg-dark-700/20 group transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">{c.name}</span>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="text-slate-600 hover:text-brand-400 transition-colors" onClick={e => e.stopPropagation()}>
                    <Globe size={13} />
                  </a>
                )}
              </div>
              <button onClick={() => deleteManual(c.id)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Performance Over Time */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5 mt-4">
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
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#cbd5e1', fontSize: 11 }}
                itemStyle={{ fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8', paddingTop: 8 }} />
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
