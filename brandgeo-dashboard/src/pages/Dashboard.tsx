import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  TrendingUp, AlertTriangle, Layers, Eye, Download, RefreshCw
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

export default function Dashboard() {
  const [analyses, setAnalyses] = useState<PageAnalysis[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [competitorData, setCompetitorData] = useState<{ name: string; count: number; avgScore: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

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

      // Compute stats
      const avg = Math.round(flat.reduce((s, a) => s + a.geo_score, 0) / flat.length)
      setStats({
        totalAnalyzed:           flat.length,
        avgGeoScore:             avg,
        strategicCount:          flat.filter(a => a.classification === 'strategic').length,
        highValueCount:          flat.filter(a => a.classification === 'high_value').length,
        mentionsCount:           flat.filter(a => a.mentions_bpr).length,
        competitorOpportunities: flat.filter(a => a.classification === 'competitor_opportunity').length,
      })

      // Competitor breakdown
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
    name: cls.replace(/_/g, ' '),
    count: analyses.filter(a => a.classification === cls).length,
    color: SCORE_COLORS[cls],
  })).filter(d => d.count > 0)

  if (loading) return <LoadingScreen />

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">GEO Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {stats?.totalAnalyzed} pages analyzed · last run Jun 17, 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm text-slate-300 transition-colors"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-sm text-white font-medium transition-colors"
          >
            <Download size={15} />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<TrendingUp size={18} className="text-brand-400" />}
            label="Avg GEO Score"
            value={<GeoScoreRing score={stats.avgGeoScore} />}
          />
          <KpiCard
            icon={<Eye size={18} className="text-emerald-400" />}
            label="Brand Mentions"
            value={<Num value={stats.mentionsCount} />}
          />
          <KpiCard
            icon={<Layers size={18} className="text-blue-400" />}
            label="Strategic Pages"
            value={<Num value={stats.strategicCount + stats.highValueCount} />}
          />
          <KpiCard
            icon={<AlertTriangle size={18} className="text-amber-400" />}
            label="Competitor Opps"
            value={<Num value={stats.competitorOpportunities} />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Classification breakdown */}
        <Card title="Classification Breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classBreakdown} margin={{ left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#cbd5e1' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {classBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Competitor comparison */}
        <Card title="Competitor Appearances">
          {competitorData.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No competitor data yet.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {competitorData.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="text-sm text-slate-300 w-28 truncate">{c.name}</div>
                  <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (c.count / Math.max(...competitorData.map(x => x.count))) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 w-16 text-right">{c.count} pages · {c.avgScore} avg</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top pages */}
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
                  <td className="py-3 pr-4">
                    <ClassificationBadge value={a.classification} />
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: SCORE_COLORS[a.classification] }}
                    >
                      {a.geo_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
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
      <div className="text-slate-500 text-sm animate-pulse">Loading data…</div>
    </div>
  )
}
