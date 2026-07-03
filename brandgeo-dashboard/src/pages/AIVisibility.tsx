import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, AlertTriangle, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { mockPrompts, mockAIResults } from '../lib/mockData'
import { useMarket } from '../lib/marketContext'
import { useClient } from '../lib/clientContext'
import type { Prompt, AIResult, LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'

const LLMS: { id: LLMName; label: string; color: string; bg: string; logoUrl: string }[] = [
  { id: 'chatgpt',    label: 'ChatGPT',    color: 'text-emerald-400', bg: 'bg-emerald-400/10', logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://openai.com'       },
  { id: 'gemini',     label: 'Gemini',     color: 'text-blue-400',    bg: 'bg-blue-400/10',    logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://gemini.google.com' },
  { id: 'claude',     label: 'Claude',     color: 'text-purple-400',  bg: 'bg-purple-400/10',  logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://claude.ai'         },
  { id: 'perplexity', label: 'Perplexity', color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://perplexity.ai'     },
  { id: 'meta',       label: 'Meta AI',    color: 'text-amber-400',   bg: 'bg-amber-400/10',   logoUrl: 'https://www.google.com/s2/favicons?sz=64&domain_url=https://meta.ai'            },
]

const CATEGORY_LABEL: Record<string, string> = {
  // BrandGEO categories
  mid:            'Mid (100-200)',
  large:          'Large (500+)',
  very_large:     'Very Large (1k+)',
  tool_discovery: 'Tool Discovery',
  geo_category:   'GEO / AIO',
  problem_based:  'Problem-based',
  // Shared
  general:        'General',
  direct_brand:   'Direct Brand',
  // BpR categories
  large_scale:    'Large Scale',
  corporate:      'Corporate',
  wedding:        'Wedding',
  galas:          'Galas & Events',
  quality:        'Quality & Awards',
  location:       'Location',
  competitive:    'Competitive',
  portfolio:      'Portfolio',
}

const CATEGORY_COLOR: Record<string, string> = {
  mid:            'bg-blue-500/20 text-blue-300',
  large:          'bg-purple-500/20 text-purple-300',
  very_large:     'bg-amber-500/20 text-amber-300',
  general:        'bg-slate-500/20 text-slate-300',
  tool_discovery: 'bg-emerald-500/20 text-emerald-300',
  geo_category:   'bg-blue-500/20 text-blue-300',
  problem_based:  'bg-amber-500/20 text-amber-300',
  direct_brand:   'bg-violet-500/20 text-violet-300',
  large_scale:    'bg-purple-500/20 text-purple-300',
  corporate:      'bg-sky-500/20 text-sky-300',
  wedding:        'bg-pink-500/20 text-pink-300',
  galas:          'bg-amber-500/20 text-amber-300',
  quality:        'bg-emerald-500/20 text-emerald-300',
  location:       'bg-teal-500/20 text-teal-300',
  competitive:    'bg-red-500/20 text-red-300',
  portfolio:      'bg-indigo-500/20 text-indigo-300',
}

const getCatLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat
const getCatColor = (cat: string) => CATEGORY_COLOR[cat] ?? 'bg-slate-500/20 text-slate-300'

type ResultMap = Map<number, Map<LLMName, AIResult>>

function parseCompetitors(raw: string | null | undefined): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export default function AIVisibility() {
  const { market } = useMarket()
  const { activeClientId, activeClient } = useClient()
  const brandName = activeClient?.name ?? 'your brand'
  const { t } = useI18n()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [results, setResults] = useState<ResultMap>(new Map())
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<PromptCategory | 'all'>('all')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(true)
  const [refreshed, setRefreshed] = useState(false)

  const load = async () => {
    setLoading(true)
    if (isDemoMode) {
      const map: ResultMap = new Map()
      mockAIResults.forEach(r => {
        if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
        map.get(r.prompt_id)!.set(r.llm as LLMName, r)
      })
      setPrompts(mockPrompts)
      setResults(map)
      setLastChecked(new Date().toISOString())
      setLoading(false)
      return
    }

    const [{ data: pData }, { data: rData }] = await Promise.all([
      supabase.from('prompts').select('*').eq('is_active', true).eq('client_id', activeClientId).order('position'),
      supabase.from('ai_results').select('*').eq('client_id', activeClientId).order('checked_at', { ascending: false }),
    ])

    const map: ResultMap = new Map()
    let latestChecked = lastChecked
    if (rData) {
      rData.forEach((r: AIResult) => {
        if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
        const llmMap = map.get(r.prompt_id)!
        if (!llmMap.has(r.llm as LLMName)) {
          llmMap.set(r.llm as LLMName, r)
          if (!latestChecked || r.checked_at > latestChecked) latestChecked = r.checked_at
        }
      })
    }

    if (pData) setPrompts(pData)
    setResults(map)
    if (latestChecked) setLastChecked(latestChecked)
    setLoading(false)
    setRefreshed(true)
    setTimeout(() => setRefreshed(false), 2500)
  }

  useEffect(() => { load() }, [activeClientId])

  const filtered = filterCat === 'all' ? prompts : prompts.filter(p => p.category === filterCat)

  const llmStats = LLMS.map(llm => {
    const mentioned = prompts.filter(p => results.get(p.id)?.get(llm.id)?.brand_mentioned).length
    const checked   = prompts.filter(p => results.get(p.id)?.has(llm.id)).length
    return { ...llm, mentioned, checked, pct: checked > 0 ? Math.round((mentioned / checked) * 100) : 0 }
  })

  const overallPct = (() => {
    let total = 0, mentioned = 0
    prompts.forEach(p => {
      LLMS.forEach(llm => {
        const r = results.get(p.id)?.get(llm.id)
        if (r) { total++; if (r.brand_mentioned) mentioned++ }
      })
    })
    return total > 0 ? Math.round((mentioned / total) * 100) : 0
  })()

  const competitorFreq = (() => {
    const freq: Record<string, number> = {}
    results.forEach(llmMap => {
      llmMap.forEach(r => {
        if (!r.brand_mentioned) {
          parseCompetitors(r.competitors_mentioned).forEach(c => {
            const key = c.toLowerCase()
            freq[key] = (freq[key] || 0) + 1
          })
        }
      })
    })
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
  })()

  const totalChecked = (() => {
    let n = 0
    results.forEach(m => { n += m.size })
    return n
  })()

  const gapCount = totalChecked - (() => {
    let n = 0
    results.forEach(m => { m.forEach(r => { if (r.brand_mentioned) n++ }) })
    return n
  })()

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">{t.aiv_loading}</div>

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-bold text-white">{t.aiv_title}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600/50">
              {market.flag} {market.id} {t.aiv_results}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {t.aiv_subtitle}
            {lastChecked && (
              <span className="ml-2 text-slate-600">
                - {t.aiv_lastChecked} {new Date(lastChecked).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border border-dark-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 text-slate-400 hover:text-slate-200"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {refreshed ? <span className="text-emerald-400">{t.aiv_refreshed}</span> : t.aiv_reload}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        <div className="col-span-1 bg-dark-800 border border-dark-700 rounded-xl p-4 flex flex-col items-center justify-center">
          <TrendingUp size={18} className="text-brand-400 mb-2" />
          <div className={`text-3xl font-bold tabular-nums ${overallPct >= 50 ? 'text-emerald-400' : overallPct >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
            {overallPct}%
          </div>
          <div className="text-xs text-slate-500 mt-1 text-center">{t.aiv_totalVisibility}</div>
        </div>
        {llmStats.map(s => (
          <div key={s.id} className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex flex-col items-center justify-center">
            <img src={s.logoUrl} alt={s.label} className="w-7 h-7 mb-2 rounded-md object-contain" />
            <div className={`text-2xl font-bold tabular-nums ${s.pct >= 50 ? 'text-emerald-400' : s.pct >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
              {s.pct}%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">{s.label}</div>
            <div className="text-xs text-slate-600">{s.mentioned}/{s.checked}</div>
          </div>
        ))}
      </div>

      {(competitorFreq.length > 0 || gapCount > 0) && (
        <div className="mb-4 bg-dark-800 border border-amber-500/30 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-3 text-left"
            onClick={() => setShowInsights(v => !v)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">
                {fmt(t.aiv_compIntel, { n: gapCount, brand: brandName })}
              </span>
            </div>
            {showInsights ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>

          {showInsights && (
            <div className="px-5 pb-4 border-t border-dark-700/50">
              <p className="text-xs text-slate-500 mt-3 mb-3">
                {fmt(t.aiv_compDesc, { brand: brandName })}
              </p>
              {competitorFreq.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {competitorFreq.map(({ name, count }) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <Target size={11} className="text-red-400" />
                      <span className="text-sm font-medium text-red-300">{name}</span>
                      <span className="text-xs text-red-500/70">{count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 italic">
                  {t.aiv_noCompetitors}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {(() => {
        const activeCats = [...new Set(prompts.map(p => p.category).filter(Boolean))]
        if (activeCats.length === 0) return null
        return (
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', ...activeCats] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterCat === cat
                    ? 'bg-brand-500/30 text-brand-300 border border-brand-500/40'
                    : 'bg-dark-800 text-slate-400 border border-dark-700 hover:border-dark-600 hover:text-slate-300'
                }`}
              >
                {cat === 'all' ? t.aiv_allCategories : getCatLabel(cat)}
              </button>
            ))}
          </div>
        )
      })()}

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[640px]">
        <div
          className="grid border-b border-dark-700 bg-dark-700/50"
          style={{ gridTemplateColumns: '2rem 1fr repeat(5, 8rem)' }}
        >
          <div className="px-3 py-3 text-xs text-slate-600">#</div>
          <div className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{t.aiv_prompt}</div>
          {LLMS.map(llm => (
            <div key={llm.id} className={`px-2 py-3 text-xs font-medium text-center ${llm.color}`}>
              {llm.label}
            </div>
          ))}
        </div>

        {filtered.map((prompt, i) => {
          const rowResults = results.get(prompt.id)
          const isExpanded = expandedRow === prompt.id
          const mentionCount = LLMS.filter(l => rowResults?.get(l.id)?.brand_mentioned).length
          const hasData = LLMS.some(l => rowResults?.has(l.id))

          return (
            <div key={prompt.id} className="border-b border-dark-700 last:border-0">
              <button
                className="w-full grid hover:bg-dark-700/30 transition-colors text-left"
                style={{ gridTemplateColumns: '2rem 1fr repeat(5, 8rem)' }}
                onClick={() => setExpandedRow(isExpanded ? null : prompt.id)}
              >
                <div className="px-3 py-3 text-xs text-slate-600 self-center">{prompt.position || i + 1}</div>

                <div className="px-4 py-3 self-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getCatColor(prompt.category)}`}>
                      {getCatLabel(prompt.category)}
                    </span>
                    {hasData && (
                      <span className={`text-xs font-semibold ${mentionCount >= 4 ? 'text-emerald-400' : mentionCount >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                        {mentionCount}/{LLMS.filter(l => rowResults?.has(l.id)).length} LLMs
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 truncate max-w-md">{prompt.text}</div>
                </div>

                {LLMS.map(llm => {
                  const r = rowResults?.get(llm.id)
                  if (!r) {
                    return (
                      <div key={llm.id} className="px-2 py-3 flex items-center justify-center">
                        <span className="text-slate-700 text-xs">-</span>
                      </div>
                    )
                  }
                  const competitors = parseCompetitors(r.competitors_mentioned)
                  return (
                    <div key={llm.id} className="px-2 py-3 flex flex-col items-center justify-center gap-1">
                      {r.brand_mentioned ? (
                        <>
                          <span className="text-emerald-400 font-bold text-sm">{t.aiv_yes}</span>
                          {r.brand_position && (
                            <span className="text-[10px] text-emerald-500 font-medium">pos #{r.brand_position}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-red-400 font-bold text-sm">{t.aiv_no}</span>
                          {competitors.length > 0 && (
                            <span
                              className="text-[9px] text-red-400/70 text-center leading-tight max-w-[70px] truncate"
                              title={competitors.join(', ')}
                            >
                              {competitors[0]}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </button>

              {isExpanded && (
                <div className="border-t border-dark-700/50 bg-dark-700/20 px-4 py-4">
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {LLMS.map(llm => {
                      const r = rowResults?.get(llm.id)
                      const competitors = r ? parseCompetitors(r.competitors_mentioned) : []
                      return (
                        <div key={llm.id} className={`rounded-lg p-3 border ${r?.brand_mentioned ? 'bg-emerald-500/5 border-emerald-500/20' : r ? 'bg-red-500/5 border-red-500/20' : 'bg-dark-800 border-dark-700'}`}>
                          <div className={`text-xs font-semibold ${llm.color} mb-2 flex items-center gap-1.5`}>
                            <img src={llm.logoUrl} alt={llm.label} className="w-3.5 h-3.5 rounded object-contain" />
                            {llm.label}
                          </div>
                          {r ? (
                            <>
                              <div className={`text-xs font-bold mb-2 ${r.brand_mentioned ? 'text-emerald-400' : 'text-red-400'}`}>
                                {r.brand_mentioned ? t.aiv_mentioned : t.aiv_absent}
                              </div>
                              {r.brand_mentioned && r.brand_position && (
                                <div className="text-[10px] text-slate-500 mb-1">
                                  {fmt(t.aiv_position, { n: r.brand_position ?? '' })}
                                </div>
                              )}
                              {r.sentiment && r.brand_mentioned && (
                                <div className={`text-[10px] font-medium mb-2 ${
                                  r.sentiment === 'positive' ? 'text-emerald-500'
                                  : r.sentiment === 'negative' ? 'text-red-500'
                                  : 'text-slate-500'
                                }`}>
                                  {r.sentiment}
                                </div>
                              )}
                              {!r.brand_mentioned && competitors.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-[10px] text-red-400/80 font-semibold mb-1 uppercase tracking-wide">
                                    {t.aiv_recommendsInstead}
                                  </div>
                                  {competitors.slice(0, 4).map(c => (
                                    <div key={c} className="text-[10px] text-red-300/70 flex items-center gap-1 mb-0.5">
                                      <Target size={8} className="text-red-500/50 shrink-0" />
                                      {c}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {r.response_snippet && (
                                <p className="text-[10px] text-slate-500 mt-2 line-clamp-4 italic leading-relaxed">
                                  {r.response_snippet}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-slate-600">{t.aiv_notChecked}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {rowResults && (() => {
                    const missing = LLMS.filter(l => {
                      const r = rowResults.get(l.id)
                      return r && !r.brand_mentioned
                    })
                    if (missing.length === 0) return null
                    return (
                      <div className="mt-3 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="text-xs text-amber-300 font-medium mb-0.5">
                          {fmt(t.aiv_opportunity, { brand: brandName, llms: missing.map(l => l.label).join(', ') })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {t.aiv_opportunityTip}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">{t.aiv_noPrompts}</div>
        )}
        </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-slate-600">
        <span>{t.aiv_legend1}</span>
        <span>{t.aiv_legend2}</span>
        <span>{t.aiv_legend3}</span>
      </div>
    </div>
  )
}
