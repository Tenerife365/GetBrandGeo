import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, Eye, Target, Hash, RefreshCw } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockPrompts, mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { useI18n, fmt } from '../lib/i18nContext'
import type { LLMName, Sentiment } from '../types'

const LLMS: { id: LLMName; label: string; color: string; chartColor: string }[] = [
  { id: 'chatgpt',    label: 'ChatGPT',    color: 'text-emerald-400', chartColor: '#10b981' },
  { id: 'gemini',     label: 'Gemini',     color: 'text-blue-400',    chartColor: '#3b82f6' },
  { id: 'claude',     label: 'Claude',     color: 'text-purple-400',  chartColor: '#a855f7' },
  { id: 'perplexity', label: 'Perplexity', color: 'text-cyan-400',    chartColor: '#06b6d4' },
  { id: 'meta',       label: 'Meta AI',    color: 'text-amber-400',   chartColor: '#f59e0b' },
]

interface AIResultRow {
  id: number
  prompt_id: number
  llm: LLMName
  response_snippet: string | null
  brand_mentioned: boolean
  brand_position: number | null
  sentiment: Sentiment
  checked_at: string
  competitors_mentioned: string | null
  prompts?: { text: string; category: string } | null
}

interface OverviewStats {
  totalChecks: number
  mentionRate: number
  avgPosition: number | null
  promptCount: number
}

function computeStats(rows: AIResultRow[]): OverviewStats {
  const mentionCount = rows.filter(r => r.brand_mentioned).length
  const posRows = rows.filter(r => r.brand_mentioned && r.brand_position != null)
  const avgPos = posRows.length > 0
    ? Math.round(posRows.reduce((s, r) => s + (r.brand_position ?? 0), 0) / posRows.length * 10) / 10
    : null
  const uniquePrompts = new Set(rows.map(r => r.prompt_id)).size
  return {
    totalChecks: rows.length,
    mentionRate: rows.length > 0 ? Math.round((mentionCount / rows.length) * 100) : 0,
    avgPosition: avgPos,
    promptCount: uniquePrompts,
  }
}

export default function Dashboard() {
  const { activeClientId, activeClient } = useClient()
  const { t } = useI18n()
  const brandName = activeClient?.name ?? 'your brand'

  const [rows, setRows]       = useState<AIResultRow[]>([])
  const [stats, setStats]     = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      const demoRows: AIResultRow[] = mockAIResults.map((r: any) => ({
        ...r,
        prompts: mockPrompts.find((p: any) => p.id === r.prompt_id)
          ? { text: (mockPrompts.find((p: any) => p.id === r.prompt_id) as any).text,
              category: (mockPrompts.find((p: any) => p.id === r.prompt_id) as any).category }
          : null,
      }))
      setRows(demoRows)
      setStats(computeStats(demoRows))
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('ai_results')
      .select('*, prompts(text, category)')
      .eq('client_id', activeClientId)
      .order('checked_at', { ascending: false })
      .limit(1000)

    if (!error && data) {
      const r = data as AIResultRow[]
      setRows(r)
      setStats(computeStats(r))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId])

  const llmData = LLMS.map(l => {
    const lRows     = rows.filter(r => r.llm === l.id)
    const lMentions = lRows.filter(r => r.brand_mentioned).length
    return {
      label:     l.label,
      rate:      lRows.length > 0 ? Math.round((lMentions / lRows.length) * 100) : 0,
      count:     lRows.length,
      color:     l.chartColor,
      textColor: l.color,
    }
  }).filter(d => d.count > 0)

  const recentMentioned   = rows.filter(r => r.brand_mentioned).slice(0, 5)
  const recentNotMentioned = rows.filter(r => !r.brand_mentioned).slice(0, 5)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-500 text-sm animate-pulse">{t.dash_loading}</div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">GEO Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            AI visibility snapshot for <span className="text-slate-200 font-medium">{brandName}</span>
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-sm text-slate-300 transition-colors border border-dark-600">
          <RefreshCw size={15} />{t.dash_refresh}</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<TrendingUp size={18} className="text-brand-400" />}
            label={t.dash_statMentionRate}
            value={
              <div className={`text-2xl font-bold tabular-nums ${stats.mentionRate >= 50 ? 'text-emerald-400' : stats.mentionRate >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                {stats.mentionRate}%
              </div>
            }
            sub={t.dash_statMentionRateSub}
          />
          <KpiCard
            icon={<Target size={18} className="text-cyan-400" />}
            label={t.dash_statAvgPos}
            value={
              <div className="text-2xl font-bold text-white tabular-nums">
                {stats.avgPosition != null ? `#${stats.avgPosition}` : '—'}
              </div>
            }
            sub={t.dash_statAvgPosSub}
          />
          <KpiCard
            icon={<Hash size={18} className="text-blue-400" />}
            label={t.dash_statPrompts}
            value={<div className="text-2xl font-bold text-white tabular-nums">{stats.promptCount}</div>}
            sub={t.dash_statPromptsSub}
          />
          <KpiCard
            icon={<Eye size={18} className="text-emerald-400" />}
            label={t.dash_statChecks}
            value={<div className="text-2xl font-bold text-white tabular-nums">{stats.totalChecks}</div>}
            sub={t.dash_statChecksDesc}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_mentionRate}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_mentionRateDesc, { brand: brandName })}</p>
          {llmData.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">{t.dash_noResults}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={llmData} margin={{ left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#94a3b8' }}
                  formatter={(v: any) => [`${v}%`, 'Mention rate']}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {llmData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {llmData.map(d => (
              <div key={d.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-dark-600 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.label} · {d.rate}%
              </div>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">{t.dash_brandVisibility}</h2>
          {stats && stats.totalChecks > 0 ? (
            <>
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{brandName} mentioned</span>
                  <span>{Math.round(stats.mentionRate)}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${stats.mentionRate >= 50 ? 'bg-emerald-500' : stats.mentionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.mentionRate}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {llmData.map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className={`text-xs font-medium w-20 ${d.textColor}`}>{d.label}</div>
                    <div className="flex-1 bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ background: d.color, width: `${d.rate}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 w-10 text-right">{d.rate}%</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 py-8 text-center">{t.dash_noResults}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_recentMentions}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_mentionsDesc, { brand: brandName })}</p>
          {recentMentioned.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">{t.dash_noMentions}</p>
          ) : (
            <div className="space-y-3">
              {recentMentioned.map(r => (
                <ResultRow key={r.id} row={r} mentioned />
              ))}
            </div>
          )}
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-1">{t.dash_recentGaps}</h2>
          <p className="text-xs text-slate-500 mb-4">{fmt(t.dash_gapsDesc, { brand: brandName })}</p>
          {recentNotMentioned.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">{t.dash_noGaps}</p>
          ) : (
            <div className="space-y-3">
              {recentNotMentioned.map(r => (
                <ResultRow key={r.id} row={r} mentioned={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const LLM_COLOR: Record<string, string> = {
  chatgpt:    'text-emerald-400 bg-emerald-400/10',
  gemini:     'text-blue-400 bg-blue-400/10',
  claude:     'text-purple-400 bg-purple-400/10',
  perplexity: 'text-cyan-400 bg-cyan-400/10',
  meta:       'text-amber-400 bg-amber-400/10',
}
const LLM_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude', perplexity: 'Perplexity', meta: 'Meta AI'
}

function ResultRow({ row, mentioned }: { row: AIResultRow; mentioned: boolean }) {
  const { t } = useI18n()
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${LLM_COLOR[row.llm] ?? 'text-slate-400 bg-slate-400/10'}`}>
        {LLM_LABEL[row.llm] ?? row.llm}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-300 truncate">
          {row.prompts?.text ?? `Prompt #${row.prompt_id}`}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          {new Date(row.checked_at).toLocaleDateString('en-GB')}
          {mentioned && row.brand_position != null && ` · position #${row.brand_position}`}
        </p>
      </div>
      <span className={`shrink-0 text-[10px] font-semibold ${mentioned ? 'text-emerald-400' : 'text-red-400'}`}>
        {mentioned ? t.aiv_yes : t.aiv_no}
      </span>
    </div>
  )
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      {value}
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </div>
  )
}
