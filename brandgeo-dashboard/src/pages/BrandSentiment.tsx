/**
 * BrandSentiment.tsx
 * Driven entirely from ai_results (brand_mentioned = true rows) -- sentiment is only
 * meaningful once the brand actually appears in a response (see collect-prompt.js:
 * sentiment stays 'neutral' by default and is only scored positive/negative when mentioned).
 * Shows an overall sentiment score, positive/neutral/negative breakdown, per-engine
 * breakdown, a trend over time, and a filterable feed of the underlying AI responses.
 */

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { motion } from 'motion/react'
import { Smile, Meh, Frown, Bot, ChevronDown, Sparkles } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockAIResults, mockPrompts } from '../lib/mockData'
import { useMarket } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import { useTimeFilter } from '../lib/timeFilterContext'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { useChartTheme } from '../lib/chartTheme'
import { staggerContainer } from '../lib/motion'
import MotionCard from '../components/MotionCard'
import { SentimentDot } from '../components/ScoreBadge'
import type { LLMName, Sentiment } from '../types'

// --- Types -------------------------------------------------------------------

interface SentimentEvent {
  id: number
  prompt_id: number
  promptText: string
  llm: LLMName
  sentiment: Sentiment
  brand_position: number | null
  response_snippet: string | null
  checked_at: string
}

interface SentimentCounts { positive: number; neutral: number; negative: number }

const emptyCounts = (): SentimentCounts => ({ positive: 0, neutral: 0, negative: 0 })

// --- Data computation --------------------------------------------------------

function computeStats(events: SentimentEvent[]) {
  const total = events.length
  const counts = emptyCounts()
  const byEngine: Partial<Record<LLMName, SentimentCounts & { total: number }>> = {}

  for (const e of events) {
    if (e.sentiment === 'positive' || e.sentiment === 'neutral' || e.sentiment === 'negative') {
      counts[e.sentiment]++
    }
    if (!byEngine[e.llm]) byEngine[e.llm] = { ...emptyCounts(), total: 0 }
    const eng = byEngine[e.llm]!
    eng.total++
    if (e.sentiment === 'positive' || e.sentiment === 'neutral' || e.sentiment === 'negative') {
      eng[e.sentiment]++
    }
  }

  // 0-100 weighted score: positive=100pts, neutral=50pts, negative=0pts
  const score = total > 0
    ? Math.round((counts.positive * 100 + counts.neutral * 50) / total)
    : null

  return { total, counts, byEngine, score }
}

function scoreMeta(score: number | null) {
  if (score === null) return { label: 'No data yet', color: 'text-slate-500' }
  if (score >= 75) return { label: 'Mostly Positive', color: 'text-emerald-400' }
  if (score >= 50) return { label: 'Mixed / Neutral', color: 'text-blue-400' }
  if (score >= 25) return { label: 'Needs Attention', color: 'text-amber-400' }
  return { label: 'Mostly Negative', color: 'text-red-400' }
}

type TrendPeriod = 'weekly' | 'monthly' | 'quarterly'

function computeTrend(events: SentimentEvent[], period: TrendPeriod) {
  if (!events.length) return []

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

  const buckets: Record<string, SentimentCounts> = {}
  for (const e of events) {
    const key = getPeriodKey(new Date(e.checked_at))
    if (!buckets[key]) buckets[key] = emptyCounts()
    if (e.sentiment === 'positive' || e.sentiment === 'neutral' || e.sentiment === 'negative') {
      buckets[key][e.sentiment]++
    }
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, c]) => ({ period: p, Positive: c.positive, Neutral: c.neutral, Negative: c.negative }))
}

function buildEngineSentimentData(
  byEngine: Partial<Record<LLMName, SentimentCounts & { total: number }>>,
  activeEngines: EngineId[],
) {
  return activeEngines
    .filter(e => (byEngine[e]?.total ?? 0) > 0)
    .map(engine => {
      const eng = byEngine[engine]!
      return {
        engine: ENGINE_META[engine].label,
        Positive: Math.round(eng.positive / eng.total * 100),
        Neutral: Math.round(eng.neutral / eng.total * 100),
        Negative: Math.round(eng.negative / eng.total * 100),
      }
    })
}

// --- Main component ----------------------------------------------------------

type SentimentFilter = Sentiment | 'all'
type EngineFilter = LLMName | 'all'

export default function BrandSentiment() {
  const { primaryMarket } = useMarket()
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { getStartDate, timeRange } = useTimeFilter()
  const chart = useChartTheme()
  const brandName = activeClient?.name ?? 'Your brand'

  const [events, setEvents] = useState<SentimentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('weekly')
  const [filterSentiment, setFilterSentiment] = useState<SentimentFilter>('all')
  const [filterEngine, setFilterEngine] = useState<EngineFilter>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)

    if (isDemoMode) {
      const demo: SentimentEvent[] = mockAIResults
        .filter(r => r.brand_mentioned)
        .map(r => {
          const prompt = mockPrompts.find(p => p.id === r.prompt_id)
          // Demo data only stores 'positive'/'neutral' — derive a bit of realistic
          // variety (incl. negative) from position so the demo isn't 100% positive.
          const pos = r.brand_position
          const demoSentiment: Sentiment =
            pos !== null && pos <= 2 ? 'positive' :
            pos !== null && pos === 3 ? 'neutral' :
            pos !== null && pos >= 4 ? 'negative' : 'positive'
          return {
            id: r.id,
            prompt_id: r.prompt_id,
            promptText: prompt?.text ?? '',
            llm: r.llm as LLMName,
            sentiment: demoSentiment,
            brand_position: r.brand_position,
            response_snippet: r.response_snippet,
            checked_at: r.checked_at,
          }
        })
        .filter(e => activeEngines.includes(e.llm))
      setEvents(demo)
      setLoading(false)
      return
    }

    let q = supabase.from('ai_results')
      .select('id, prompt_id, llm, sentiment, brand_position, response_snippet, checked_at, prompts(text)')
      .eq('client_id', activeClientId)
      .eq('brand_mentioned', true)
    const startDate = getStartDate()
    if (startDate) q = q.gte('checked_at', startDate.toISOString())

    const { data } = await q.order('checked_at', { ascending: false })

    const mapped: SentimentEvent[] = (data ?? []).map((r: any) => ({
      id: r.id,
      prompt_id: r.prompt_id,
      promptText: r.prompts?.text ?? '',
      llm: r.llm,
      sentiment: r.sentiment,
      brand_position: r.brand_position,
      response_snippet: r.response_snippet,
      checked_at: r.checked_at,
    })).filter(e => activeEngines.includes(e.llm))

    setEvents(mapped)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeClientId, activeEngines.join(','), timeRange]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading sentiment data…</div>

  const { total, counts, byEngine, score } = computeStats(events)
  const { label: scoreLabel, color: scoreColor } = scoreMeta(score)
  const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0
  const trendData = computeTrend(events, trendPeriod)
  const engineData = buildEngineSentimentData(byEngine, activeEngines)

  const filtered = events.filter(e => {
    if (filterSentiment !== 'all' && e.sentiment !== filterSentiment) return false
    if (filterEngine !== 'all' && e.llm !== filterEngine) return false
    return true
  })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-0.5">
          <h1 className="text-2xl font-bold text-white">Brand Sentiment</h1>
          {primaryMarket && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
              {primaryMarket.flag} {primaryMarket.id} results
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-0.5">
          How AI engines talk about {brandName} — sentiment across {total} response{total !== 1 ? 's' : ''} that mention {brandName}
        </p>
      </div>

      {/* Summary cards. Every card carries a border: the score card previously had
          border-brand-500/30 while the other three had none at all, so the row read
          as one boxed card next to three floating patches. The score card keeps the
          brand-tinted border to mark it as the primary metric — the difference is now
          the border's COLOUR, not its existence. Stagger entrance matches the other
          insight pages (Dashboard, AI Visibility), which this page lacked entirely. */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        variants={staggerContainer} initial="hidden" animate="show"
      >
        <MotionCard stagger className="bg-dark-800 border border-brand-500/30 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={12} className="text-brand-400" />
            <span className="text-xs text-slate-500">Sentiment score</span>
          </div>
          <div className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
            {score !== null ? score : '—'}
            {score !== null && <span className="text-sm text-slate-500 font-normal">/100</span>}
          </div>
          <div className={`text-xs mt-0.5 ${scoreColor}`}>{scoreLabel}</div>
        </MotionCard>
        <MotionCard stagger className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Smile size={12} className="text-emerald-400" />
            <span className="text-xs text-slate-500">Positive</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{counts.positive}</div>
          <div className="text-xs text-slate-500 mt-0.5">{pct(counts.positive)}% of mentions</div>
        </MotionCard>
        <MotionCard stagger className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Meh size={12} className="text-slate-400" />
            <span className="text-xs text-slate-500">Neutral</span>
          </div>
          <div className="text-2xl font-bold text-slate-300 tabular-nums">{counts.neutral}</div>
          <div className="text-xs text-slate-500 mt-0.5">{pct(counts.neutral)}% of mentions</div>
        </MotionCard>
        <MotionCard stagger className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Frown size={12} className="text-red-400" />
            <span className="text-xs text-slate-500">Negative</span>
          </div>
          <div className="text-2xl font-bold text-red-400 tabular-nums">{counts.negative}</div>
          <div className="text-xs text-slate-500 mt-0.5">{pct(counts.negative)}% of mentions</div>
        </MotionCard>
      </motion.div>

      {total === 0 ? (
        <div className="bg-dark-800 rounded-xl py-16 text-center mb-6">
          <Meh size={28} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-1">No sentiment data yet</p>
          <p className="text-xs text-slate-600">Run a collection from the AI Visibility tab — sentiment appears here once AI engines mention {brandName}.</p>
        </div>
      ) : (
        <>
          {/* Overall breakdown bar */}
          <div className="bg-dark-800 rounded-xl p-5 mb-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Overall Breakdown
            </h2>
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-dark-700">
              {counts.positive > 0 && <div className="h-full bg-emerald-500" style={{ width: `${pct(counts.positive)}%` }} title={`Positive ${pct(counts.positive)}%`} />}
              {counts.neutral > 0 && <div className="h-full bg-slate-500" style={{ width: `${pct(counts.neutral)}%` }} title={`Neutral ${pct(counts.neutral)}%`} />}
              {counts.negative > 0 && <div className="h-full bg-red-500" style={{ width: `${pct(counts.negative)}%` }} title={`Negative ${pct(counts.negative)}%`} />}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />Positive {pct(counts.positive)}%</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-500" />Neutral {pct(counts.neutral)}%</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-red-500" />Negative {pct(counts.negative)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Sentiment by engine */}
            <div className="bg-dark-800 rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                Sentiment by Engine
              </h2>
              <p className="text-[11px] text-slate-600 mb-3">% of {brandName} mentions per AI engine</p>
              {engineData.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-600">No per-engine data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={engineData} margin={{ left: -20, right: 8, bottom: 4 }} barCategoryGap="25%">
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
                    <Bar dataKey="Positive" stackId="s" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Neutral" stackId="s" fill="#64748b" maxBarSize={28} />
                    <Bar dataKey="Negative" stackId="s" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Trend over time */}
            <div className="bg-dark-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Sentiment Over Time
                </h2>
                <div className="flex gap-1 bg-dark-700 rounded-lg p-1">
                  {(['weekly', 'monthly', 'quarterly'] as const).map(p => (
                    <button key={p} onClick={() => setTrendPeriod(p)}
                      aria-pressed={trendPeriod === p}
                      aria-label={`View ${p} trend`}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
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
                  <p className="text-xs text-slate-600 mt-1">Trend fills in as collections accumulate</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fill: chart.axisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: chart.axisTick, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={chart.tooltipContent}
                      labelStyle={chart.tooltipLabel}
                      itemStyle={chart.tooltipItem}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: chart.legend, paddingTop: 8 }} />
                    <Line type="monotone" dataKey="Positive" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Neutral" stroke="#64748b" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Negative" stroke="#ef4444" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent sentiment signals */}
          <div>
            {/* Matches the section-heading treatment used by the cards above —
                this was text-sm/slate-300 while the sibling section headings on
                the same screen were text-xs/uppercase/slate-400. */}
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Sentiment Signals</h2>

            <div className="flex flex-wrap gap-2 mb-3">
              {(['all', 'positive', 'neutral', 'negative'] as const).map(s => (
                <button key={s} onClick={() => setFilterSentiment(s)}
                  aria-pressed={filterSentiment === s}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    filterSentiment === s
                      ? 'bg-brand-500/30 text-brand-300 border-brand-500/40'
                      : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600'
                  }`}>
                  {s !== 'all' && <SentimentDot value={s} />}
                  {s === 'all' ? `All (${total})` : `${s[0].toUpperCase()}${s.slice(1)} (${counts[s as keyof SentimentCounts]})`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setFilterEngine('all')}
                aria-pressed={filterEngine === 'all'}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors border ${
                  filterEngine === 'all' ? 'bg-brand-500/30 text-brand-300 border-brand-500/40' : 'bg-dark-800 text-slate-500 border-dark-700 hover:border-dark-600'
                }`}>
                All engines
              </button>
              {activeEngines.filter(e => (byEngine[e]?.total ?? 0) > 0).map(e => {
                const meta = ENGINE_META[e]
                return (
                  <button key={e} onClick={() => setFilterEngine(e === filterEngine ? 'all' : e)}
                    aria-pressed={filterEngine === e}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                      filterEngine === e ? `${meta.bg} ${meta.color} border-transparent` : 'bg-dark-800 text-slate-500 border-dark-700 hover:border-dark-600'
                    }`}>
                    <Bot size={11} />{meta.label}
                  </button>
                )
              })}
            </div>

            <div className="space-y-2">
              {filtered.map(e => {
                const meta = ENGINE_META[e.llm as EngineId] ?? ENGINE_META.chatgpt
                const isOpen = expanded === e.id
                return (
                  <div key={e.id} className="bg-dark-800 rounded-xl overflow-hidden">
                    <button className="w-full text-left px-5 py-4 hover:bg-dark-700/30 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                      aria-expanded={isOpen}>
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 text-center mt-0.5">
                          {e.brand_position ? (
                            <>
                              <div className="text-lg font-bold text-emerald-400 tabular-nums">#{e.brand_position}</div>
                              <div className="text-[10px] text-slate-600">pos</div>
                            </>
                          ) : (
                            <div className="text-sm text-slate-600 mt-1">-</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-transparent ${meta.bg} ${meta.color}`}>
                              <Bot size={10} />{meta.label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400 capitalize">
                              <SentimentDot value={e.sentiment} />{e.sentiment}
                            </span>
                          </div>
                          <p className="text-sm text-slate-200 truncate">{e.promptText}</p>
                        </div>
                        <ChevronDown size={15}
                          className={`shrink-0 text-slate-600 transition-transform mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isOpen && e.response_snippet && (
                      <div className="border-t border-dark-700 px-5 py-4 bg-dark-700/20">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Response snippet</div>
                        <blockquote className={`text-sm text-slate-300 italic leading-relaxed border-l-2 pl-3 ${
                          e.sentiment === 'positive' ? 'border-emerald-500/40' : e.sentiment === 'negative' ? 'border-red-500/40' : 'border-slate-500/40'
                        }`}>
                          "{e.response_snippet}"
                        </blockquote>
                        <div className="mt-3 text-xs text-slate-600">
                          Checked {new Date(e.checked_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {isOpen && !e.response_snippet && (
                      <div className="border-t border-dark-700 px-5 py-3 bg-dark-700/20 text-xs text-slate-600 italic">
                        No response snippet captured for this mention.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-sm">
                No signals match this filter.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
