import { useEffect, useState } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts'
import { Plus, Trash2, Check, X, Sparkles, Globe, Tag } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAnalyses, mockCompetitors } from '../lib/mockData'
import { useMarket } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import type { Competitor, PageAnalysis } from '../types'

interface CompetitorStats extends Competitor {
  webPages: number
  avgScore: number
  queries: string[]
}

const SOURCE_BADGE: Record<Competitor['source'], string> = {
  auto:   'bg-emerald-500/15 text-emerald-400',
  manual: 'bg-slate-500/15 text-slate-400',
}
const SOURCE_LABEL: Record<Competitor['source'], string> = {
  auto:   'Auto-discovered',
  manual: 'Manual',
}

export default function Competitors() {
  const { market } = useMarket()
  const { activeClientId } = useClient()
  const [competitors, setCompetitors]   = useState<CompetitorStats[]>([])
  const [bprStats, setBprStats]         = useState({ pages: 0, avgScore: 0 })
  const [loading, setLoading]           = useState(true)
  const [discovering, setDiscovering]   = useState(false)
  const [showAdd, setShowAdd]           = useState(false)
  const [newName, setNewName]           = useState('')
  const [newWebsite, setNewWebsite]     = useState('')
  const [saving, setSaving]             = useState(false)

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      const analyses = mockAnalyses
      const bprPages = analyses.filter(a => a.mentions_bpr)
      setBprStats({
        pages:    bprPages.length,
        avgScore: bprPages.length
          ? Math.round(bprPages.reduce((s, a) => s + a.geo_score, 0) / bprPages.length)
          : 0,
      })
      const occMap = buildOccMap(analyses)
      setCompetitors(
        mockCompetitors.map(c => ({
          ...c,
          webPages: occMap[c.name]?.count ?? 0,
          avgScore: occMap[c.name]?.avgScore ?? 0,
          queries:  occMap[c.name]?.queries ?? [],
        }))
      )
      setLoading(false)
      return
    }

    const [{ data: compData }, { data: analysisData }] = await Promise.all([
      supabase.from('competitors').select('*').eq('client_id', activeClientId).order('created_at'),
      supabase.from('page_analysis').select('*, search_results(url, query)'),
    ])

    const analyses: PageAnalysis[] = (analysisData ?? []).map((r: any) => ({
      ...r,
      url:   r.search_results?.url,
      query: r.search_results?.query,
    }))

    const bprPages = analyses.filter(a => a.mentions_bpr)
    setBprStats({
      pages:    bprPages.length,
      avgScore: bprPages.length
        ? Math.round(bprPages.reduce((s, a) => s + a.geo_score, 0) / bprPages.length)
        : 0,
    })

    const occMap = buildOccMap(analyses)
    setCompetitors(
      (compData ?? []).map((c: Competitor) => ({
        ...c,
        webPages: occMap[c.name]?.count ?? 0,
        avgScore: occMap[c.name]?.avgScore ?? 0,
        queries:  occMap[c.name]?.queries ?? [],
      }))
    )
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId])

  function buildOccMap(analyses: PageAnalysis[]) {
    const map: Record<string, { count: number; scores: number[]; queries: Set<string> }> = {}
    analyses.forEach(a => {
      try {
        const comps: string[] = JSON.parse(a.competitors || '[]')
        comps.forEach(name => {
          if (!map[name]) map[name] = { count: 0, scores: [], queries: new Set() }
          map[name].count++
          map[name].scores.push(a.geo_score)
          if (a.query) map[name].queries.add(a.query)
        })
      } catch {}
    })
    return Object.fromEntries(
      Object.entries(map).map(([name, d]) => [
        name,
        {
          count:    d.count,
          avgScore: Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length),
          queries:  Array.from(d.queries),
        },
      ])
    )
  }

  const autoDiscover = async () => {
    if (isDemoMode) return
    setDiscovering(true)

    // Read from both page_analysis.competitors AND ai_results.competitors_mentioned
    const [{ data: analysisData }, { data: aiData }] = await Promise.all([
      supabase.from('page_analysis').select('competitors'),
      supabase.from('ai_results').select('competitors_mentioned').eq('client_id', activeClientId),
    ])

    const existing = new Set(competitors.map(c => c.name.toLowerCase()))
    const discovered: string[] = []

    const addIfNew = (name: string) => {
      const trimmed = name.trim()
      if (trimmed.length < 2) return
      if (!existing.has(trimmed.toLowerCase()) && !discovered.map(d => d.toLowerCase()).includes(trimmed.toLowerCase())) {
        discovered.push(trimmed)
      }
    }

    ;(analysisData ?? []).forEach((r: any) => {
      try { (JSON.parse(r.competitors || '[]') as string[]).forEach(addIfNew) } catch {}
    })
    ;(aiData ?? []).forEach((r: any) => {
      try { (JSON.parse(r.competitors_mentioned || '[]') as string[]).forEach(addIfNew) } catch {}
    })

    if (discovered.length > 0) {
      await supabase.from('competitors').insert(discovered.map(name => ({ name, source: 'auto', website: null, client_id: activeClientId })))
    }
    await load()
    setDiscovering(false)
  }

  const addCompetitor = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const entry = { name: newName.trim(), website: newWebsite.trim() || null, source: 'manual' as const }
    if (isDemoMode) {
      setCompetitors(prev => [...prev, { ...entry, id: Date.now(), created_at: new Date().toISOString(), webPages: 0, avgScore: 0, queries: [] }])
    } else {
      const { data } = await supabase.from('competitors').insert(entry).select().single()
      if (data) setCompetitors(prev => [...prev, { ...data, webPages: 0, avgScore: 0, queries: [] }])
    }
    setNewName('')
    setNewWebsite('')
    setShowAdd(false)
    setSaving(false)
  }

  const deleteCompetitor = async (id: number) => {
    if (!isDemoMode) await supabase.from('competitors').delete().eq('id', id)
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }

  const barData = [
    { name: 'BpR (you)', pages: bprStats.pages, fill: '#1f9baa' },
    ...competitors.map(c => ({ name: c.name, pages: c.webPages, fill: '#f59e0b' })),
  ]

  const radarData = ['Web Pages', 'Avg Score'].map((metric, i) => {
    const row: Record<string, string | number> = { metric }
    row['BpR'] = i === 0 ? bprStats.pages : bprStats.avgScore
    competitors.slice(0, 3).forEach(c => { row[c.name] = i === 0 ? c.webPages : c.avgScore })
    return row
  })
  const radarKeys  = ['BpR', ...competitors.slice(0, 3).map(c => c.name)]
  const RADAR_COLORS = ['#1f9baa', '#f59e0b', '#ef4444', '#8b5cf6']

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-bold text-white">Competitors</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
              {market.flag} {market.id} results
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {competitors.length} competitors tracked — top Bucharest catering & events brands
          </p>
        </div>
        <div className="flex gap-2">
          {!isDemoMode && (
            <button onClick={autoDiscover} disabled={discovering}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors disabled:opacity-50">
              <Sparkles size={14} />
              {discovering ? 'Scanning...' : 'Auto-discover'}
            </button>
          )}
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors">
            <Plus size={14} />
            Add manually
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-dark-800 border border-brand-500/30 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">BpR - Web pages</div>
          <div className="text-2xl font-bold text-brand-300 tabular-nums">{bprStats.pages}</div>
          <div className="text-xs text-slate-500 mt-0.5">Avg score {bprStats.avgScore}</div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Total competitors</div>
          <div className="text-2xl font-bold text-white tabular-nums">{competitors.length}</div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Auto-discovered</div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">
            {competitors.filter(c => c.source === 'auto').length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">from web + AI analyses</div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1">Added manually</div>
          <div className="text-2xl font-bold text-slate-300 tabular-nums">
            {competitors.filter(c => c.source === 'manual').length}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="mb-5 bg-dark-800 border border-brand-500/30 rounded-xl p-4 flex gap-3 items-end">
          <div className="flex-1 space-y-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Competitor name *</label>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="e.g. Flavours"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Website (optional)</label>
              <input value={newWebsite} onChange={e => setNewWebsite(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCompetitor()} placeholder="https://competitor.ro"
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

      {competitors.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Web search appearances
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="pages" name="Pages" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Visibility radar (BpR vs top 3)
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                {radarKeys.map((key, i) => (
                  <Radar key={key} name={key} dataKey={key} stroke={RADAR_COLORS[i]}
                    fill={RADAR_COLORS[i]} fillOpacity={0.12} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="grid border-b border-dark-700 bg-dark-700/40" style={{ gridTemplateColumns: '1fr 8rem 6rem 6rem 1fr 2.5rem' }}>
          <div className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Competitor</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Source</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Pages</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Score</div>
          <div className="px-3 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Detected queries</div>
          <div />
        </div>

        <div className="grid border-b border-dark-700/50 bg-brand-500/5" style={{ gridTemplateColumns: '1fr 8rem 6rem 6rem 1fr 2.5rem' }}>
          <div className="px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-300">Bucate pe Roate</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400">you</span>
          </div>
          <div className="px-3 py-3" />
          <div className="px-3 py-3 text-center font-bold text-emerald-400 tabular-nums">{bprStats.pages}</div>
          <div className="px-3 py-3 text-center font-bold text-emerald-400 tabular-nums">{bprStats.avgScore}</div>
          <div className="px-3 py-3 text-xs text-slate-500">-</div>
          <div />
        </div>

        {competitors.map(c => (
          <div key={c.id} className="grid border-b border-dark-700/50 last:border-0 hover:bg-dark-700/20 transition-colors group"
            style={{ gridTemplateColumns: '1fr 8rem 6rem 6rem 1fr 2.5rem' }}>
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="text-sm text-slate-200 font-medium">{c.name}</span>
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer"
                  className="text-slate-600 hover:text-brand-400 transition-colors" onClick={e => e.stopPropagation()}>
                  <Globe size={13} />
                </a>
              )}
            </div>
            <div className="px-3 py-3 flex items-center">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGE[c.source]}`}>
                {SOURCE_LABEL[c.source]}
              </span>
            </div>
            <div className="px-3 py-3 text-center tabular-nums">
              {c.webPages > 0 ? <span className="text-amber-400 font-semibold">{c.webPages}</span> : <span className="text-slate-600">-</span>}
            </div>
            <div className="px-3 py-3 text-center tabular-nums">
              {c.avgScore > 0
                ? <span className={c.avgScore >= bprStats.avgScore ? 'text-red-400' : 'text-slate-300'}>{c.avgScore}</span>
                : <span className="text-slate-600">-</span>}
            </div>
            <div className="px-3 py-3 text-xs text-slate-500 truncate">
              {c.queries.length > 0
                ? c.queries.slice(0, 2).join(' - ')
                : <span className="text-slate-700">Not detected in web analyses</span>}
            </div>
            <div className="py-3 pr-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => deleteCompetitor(c.id)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {competitors.length === 0 && (
          <div className="py-16 text-center">
            <Tag size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-3">No competitors added yet.</p>
            <div className="flex gap-2 justify-center">
              {!isDemoMode && (
                <button onClick={autoDiscover} disabled={discovering}
                  className="px-4 py-2 rounded-lg text-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors flex items-center gap-2">
                  <Sparkles size={13} />
                  Auto-discover from analyses
                </button>
              )}
              <button onClick={() => setShowAdd(true)}
                className="px-4 py-2 rounded-lg text-sm bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 transition-colors flex items-center gap-2">
                <Plus size={13} />
                Add manually
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
