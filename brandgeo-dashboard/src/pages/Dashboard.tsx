import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, Eye, Target, Hash, RefreshCw } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockPrompts, mockAIResults } from '../lib/mockData'
import { useClient } from '../lib/clientContext'
import { useI18n, fmt } from '../lib/i18nContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { useTheme } from '../lib/themeContext'
import { ENGINE_META } from '../lib/planConfig'
import {
  computeAiVisibilityScore, buildScoreResultMap,
  type AiVisibilityDimensions,
} from '../lib/aiVisibilityScore'
import type { LLMName, Sentiment, Prompt, AIResult } from '../types'

// Chart colors sourced from ENGINE_META (planConfig.ts), not hardcoded here — keeps this
// page's palette from drifting out of sync with AIVisibility.tsx (DESIGN-SYSTEM.md §1/§5).
const LLM_IDS: LLMName[] = ['chatgpt', 'gemini', 'claude', 'perplexity', 'meta']
const LLMS = LLM_IDS.map(id => ({
  id,
  label: ENGINE_META[id].label,
  color: ENGINE_META[id].color,
  chartColor: ENGINE_META[id].chartColor,
}))

const DIMENSION_LABELS: [keyof AiVisibilityDimensions, string][] = [
  ['recognition', 'Recognition'], ['knowledge', 'Knowledge'], ['sentiment', 'Sentiment'],
  ['accuracy', 'Accuracy'], ['reach', 'Reach'], ['consistency', 'Consistency'],
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
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { t } = useI18n()
  const { getStartDate, timeRange } = useTimeFilter()
  const { theme } = useTheme()
  const brandName = activeClient?.name ?? 'your brand'

  const [rows, setRows]           = useState<AIResultRow[]>([])
  const [stats, setStats]         = useState<OverviewStats | null>(null)
  const [scoreData, setScoreData] = useState<{ dimensions: AiVisibilityDimensions; aiScore: number } | null>(null)
  const [loading, setLoading]     = useState(true)

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      const demoRows: AIResultRow[] = mockAIResults.map((r: AIResult) => {
        const p = mockPrompts.find((mp: Prompt) => mp.id === r.prompt_id)
        return {
          ...r,
          competitors_mentioned: r.competitors_mentioned ?? null,
          prompts: p ? { text: p.text, category: p.category } : null,
        }
      })
      setRows(demoRows)
      setStats(computeStats(demoRows))

      // AI Visibility Score — same shared computation as AIVisibility.tsx, deliberately
      // all-time (not time-filtered) so both pages always show the identical headline number.
      const scoreMap = buildScoreResultMap(mockAIResults)
      setScoreData(computeAiVisibilityScore(mockPrompts.map(p => p.id), scoreMap, activeEngines))

      setLoading(false)
      return
    }

    const startDate = getStartDate()
    let query = supabase
      .from('ai_results')
      .select('*, prompts(text, category)')
      .eq('client_id', activeClientId)
      .order('checked_at', { ascending: false })
      .limit(1000)
    if (startDate) query = query.gte('checked_at', startDate.toISOString())

    const [{ data, error }, { data: pData }, { data: scoreRows }] = await Promise.all([
      query,
      supabase.from('prompts').select('id').eq('is_active', true).eq('client_id', activeClientId),
      supabase.from('ai_results')
        .select('prompt_id, llm, brand_mentioned, brand_position, sentiment')
        .eq('client_id', activeClientId),
    ])

    if (!error && data) {
      const r = data as AIResultRow[]
      setRows(r)
      setStats(computeStats(r))
    }

    if (pData && scoreRows) {
      const scoreMap = buildScoreResultMap(scoreRows as unknown as { prompt_id: number; llm: string; brand_mentioned: boolean; brand_position: number | null; sentiment: string | null }[])
      setScoreData(computeAiVisibilityScore(pData.map((p: { id: number }) => p.id), scoreMap, activeEngines))
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId, timeRange])

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

      {scoreData && (
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <svg viewBox="0 0 120 120" className="w-32 h-32 sm:w-40 sm:h-40" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="overviewScoreRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
                <filter id="overviewScoreGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="60" cy="60" r="54" fill="none"
                stroke={theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth="6" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#overviewScoreRingGrad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 - (scoreData.aiScore / 100) * (2 * Math.PI * 54)}`}
                transform="rotate(-90 60 60)" filter="url(#overviewScoreGlow)" opacity="0.3"
                style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }} />
              <circle cx="60" cy="60" r="54" fill="none" stroke="url(#overviewScoreRingGrad)" strokeWidth="5.5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 - (scoreData.aiScore / 100) * (2 * Math.PI * 54)}`}
                transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)' }} />
              <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fontFamily="Inter, -apple-system, sans-serif">
                <tspan fontSize="34" fontWeight="800" fill={theme === 'light' ? '#1e293b' : 'white'} letterSpacing="-1.5">
                  {scoreData.aiScore}
                </tspan>
                <tspan fontSize="13" fontWeight="500" fill={theme === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)'} dy="-12">%</tspan>
              </text>
            </svg>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">AI Visibility Score</div>
          </div>

          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DIMENSION_LABELS.map(([key, label]) => (
              <div key={key} className="bg-dark-700/60 rounded-lg px-3 py-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                <div className="text-lg font-bold text-white tabular-nums">{scoreData.dimensions[key]}%</div>
              </div>
            ))}
            <Link to="/ai-visibility"
              className="col-span-2 sm:col-span-3 mt-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
              View full breakdown →
            </Link>
          </div>
        </div>
      )}

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
