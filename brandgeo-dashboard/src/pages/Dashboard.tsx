import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  TrendingUp, AlertTriangle, Layers, Eye, Download, RefreshCw, X, ExternalLink
} from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAnalyses, mockStats, mockCompetitorData } from '../lib/mockData'
import { ClassificationBadge, GeoScoreRing } from '../components/ScoreBadge'
import type { PageAnalysis, DashboardStats } from '../types'
import { exportPDF } from '../lib/exportPDF'

const SCORE_COLORS: Record<string, string> = {
  strategic:              '#10b981',
  high_value:             '#1f9baa',
  medium_value:           '#3b82f6',
  low_value:              '#64748b',
  competitor_opportunity: '#f59e0b',
}

const CLASS_LABELS: Record<string, string> = {
  strategic:              'Strategic',
  high_value:             'High Value',
  medium_value:           'Medium Value',
  low_value:              'Low Value',
  competitor_opportunity: 'Competitor Opp.',
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  strategic:              'Highest-impact pages where your brand has strong presence and authority. Prioritize these for optimization.',
  high_value:             'Pages with solid brand mentions and good GEO scores. Nurture these to push into Strategic tier.',
  medium_value:           'Brand is present but with moderate visibility. Content improvements can lift these significantly.',
  low_value:              'Low GEO score pages. Requires fundamental content or authority improvements.',
  competitor_opportunity: 'Pages where competitors appear but your brand does not. High-opportunity targets for new content.',
}

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<PageAnalysis[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [competitorData, setCompetitorData] = useState<{ name: string; count: number; avgScore: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    if (isDemoMode) {
      setAnalyses(mockAnalyses)
      setStats(mockStats)
      setCompetitorData(mockCompetitorData)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('page_analysis')
      .select('*, search_results(url, title, snippet, query)')
      .order('analyzed_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const flat: PageAnalysis[] = data.map((r: any) => ({
        ...r,
        url:     r.search_results?.url,
        title:   r.search_results?.title,
        snippet: r.search_results?.snippet,
        query:   r.search_results?.query,
      }))
      setAnalyses(flat)

      const avg = Math.round(flat.reduce((s, a) => s + a.geo_score, 0) / flat.length)
      setStats({
        totalAnalyzed:           flat.length,
        avgGeoScore:             avg,
        strategicCount:          flat.filter(a => a.classification === 'strategic').length,
        highValueCount:          flat.filter(a => a.classification === 'high_value').length,
        mentionsCount:           flat.filter(a => a.mentions_bpr).length,
        competitorOpportunities: flat.filter(a => a.classification === 'competitor_opportunity').length,
      })

      const compMap: Record<string, number[]> = {}
      flat.forEach(a => {
        try {
          const comps: string[] = JSON.parse(a.competitors || '[]')
          comps.forEach(c => {
            if (!compMap[c]) compMap[c] = []
            compMap[c].push(a.geo_score)
          })
        } catch {}
      })
      setCompetitorData(
        Object.entries(compMap).map(([name, scores]) => ({
          name,
          count: scores.length,
          avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
        }))
      )
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportPDF({ analyses, stats, competitorData })
    } finally {
      setExporting(false)
    }
  }

  const classBreakdown = [
    'strategic', 'high_value', 'medium_value', 'low_value', 'competitor_opportunity'
  ].map(cls => ({
    cls,
    name: CLASS_LABELS[cls] ?? cls.replace(/_/g, ' '),
    count: analyses.filter(a => a.classification === cls).length,
    color: SCORE_COLORS[cls],
  })).filter(d => d.count > 0)

  const drawerAnalyses = selectedClass
    ? analyses.filter(a => a.classification === selectedClass)
    : []

  if (loading) return <LoadingScreen />

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">GEO Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats?.totalAnalyzed} pages analyzed · last run Jun 17, 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm text-slate-300 transition-colors">
            <RefreshCw size={15} />Refresh
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-sm text-white font-medium transition-colors">
            <Download size={15} />{exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={<TrendingUp size={18} className="text-brand-400" />} label="Avg GEO Score"
            value={<GeoScoreRing score={stats.avgGeoScore} />} />
          <KpiCard icon={<Eye size={18} className="text-emerald-400" />} label="Brand Mentions"
            value={<Num value={stats.mentionsCount} />} />
          <KpiCard icon={<Layers size={18} className="text-blue-400" />} label="Strategic Pages"
            value={<Num value={stats.strategicCount + stats.highValueCount} />} />
          <KpiCard icon={<AlertTriangle size={18} className="text-amber-400" />} label="Competitor Opps"
            value={<Num value={stats.competitorOpportunities} />} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">Classification Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">Click any bar or label to drill into that group</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classBreakdown} margin={{ left: -20, bottom: 0 }}
              onClick={(data) => {
                if (data?.activePayload?.[0]) {
                  const cls = (data.activePayload[0].payload as any).cls
                  setSelectedClass(prev => prev === cls ? null : cls)
                }
              }}
              style={{ cursor: 'pointer' }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#94a3b8' }}
                formatter={(value: any) => [value, 'Pages']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {classBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color}
                    opacity={selectedClass && selectedClass !== entry.cls ? 0.3 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {classBreakdown.map(d => (
              <button key={d.cls}
                onClick={() => setSelectedClass(prev => prev === d.cls ? null : d.cls)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  selectedClass === d.cls
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-dark-600 text-slate-400 hover:border-dark-500 hover:text-slate-300'
                }`}>
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name} · {d.count}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Competitor Appearances</h2>
          {competitorData.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No competitor data yet.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {competitorData.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="text-sm text-slate-300 w-28 truncate">{c.name}</div>
                  <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (c.count / Math.max(...competitorData.map(x => x.count))) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 w-16 text-right">{c.count} pages · {c.avgScore} avg</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card title="Top Analyzed Pages">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-dark-700">
                <th className="text-left py-2 pr-4 font-medium">Page</th>
                <th className="text-left py-2 pr-4 font-medium">Classification</th>
                <th className="text-right py-2 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {analyses.slice(0, 8).map(a => (
                <tr key={a.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="text-slate-200 font-medium truncate max-w-xs">{a.title || a.url}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{a.url}</div>
                  </td>
                  <td className="py-3 pr-4"><ClassificationBadge value={a.classification} /></td>
                  <td className="py-3 text-right">
                    <span className="font-bold tabular-nums" style={{ color: SCORE_COLORS[a.classification] }}>
                      {a.geo_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedClass && (
        <ClassDrawer cls={selectedClass} analyses={drawerAnalyses} onClose={() => setSelectedClass(null)} />
      )}
    </div>
  )
}

function ClassDrawer({ cls, analyses, onClose }: { cls: string; analyses: PageAnalysis[]; onClose: () => void }) {
  const color = SCORE_COLORS[cls]
  const label = CLASS_LABELS[cls] ?? cls
  const desc  = CLASS_DESCRIPTIONS[cls] ?? ''
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-dark-900 border-l border-dark-700 z-50 flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-dark-700 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ background: color }} />
              <h2 className="text-lg font-bold text-white">{label}</h2>
              <span className="text-sm text-slate-400 font-normal ml-1">({analyses.length})</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{desc}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-dark-700 transition-colors mt-0.5 shrink-0 ml-4">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
          {analyses.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">No pages in this classification.</p>
          )}
          {analyses.map(a => (
            <div key={a.id}
              className="bg-dark-800 border border-dark-700 rounded-xl p-4 hover:border-dark-600 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm tabular-nums"
                  style={{ background: color + '22', color }}>
                  {a.geo_score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200 leading-snug mb-0.5">{a.title || 'Untitled'}</div>
                  <div className="text-xs text-slate-500 truncate">{a.url}</div>
                </div>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-slate-600 hover:text-brand-400 transition-colors mt-1"
                    onClick={e => e.stopPropagation()}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
              {a.query && (
                <div className="mb-2">
                  <span className="text-[10px] text-slate-600 uppercase tracking-wide font-medium">Trigger query </span>
                  <span className="text-xs text-slate-400 italic">{a.query}</span>
                </div>
              )}
              {(() => {
                try {
                  const comps: string[] = JSON.parse(a.competitors || '[]')
                  if (comps.length > 0) return (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {comps.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  )
                } catch {}
                return null
              })()}
              {a.suggested_action && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-dark-700/60 border border-dark-600">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mb-0.5">Suggested action</div>
                  <p className="text-xs text-slate-300">{a.suggested_action}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      {value}
    </div>
  )
}

function Num({ value }: { value: number }) {
  return <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-500 text-sm animate-pulse">Loading data...</div>
    </div>
  )
}
