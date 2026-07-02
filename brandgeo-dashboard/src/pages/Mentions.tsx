import { useEffect, useState } from 'react'
import { Bot, TrendingUp, Award, ChevronDown } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { mockAIResults, mockPrompts } from '../lib/mockData'
import { SentimentDot } from '../components/ScoreBadge'
import type { LLMName, PromptCategory } from '../types'

interface MentionEvent {
  id: number
  prompt_id: number
  promptText: string
  category: PromptCategory
  llm: LLMName
  brand_position: number | null
  sentiment: string
  response_snippet: string | null
  checked_at: string
}

const LLM_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  chatgpt:    { label: 'ChatGPT',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25', dot: 'bg-emerald-400' },
  gemini:     { label: 'Gemini',     color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/25',       dot: 'bg-blue-400'    },
  claude:     { label: 'Claude',     color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/25',   dot: 'bg-purple-400'  },
  perplexity: { label: 'Perplexity', color: 'text-cyan-400',    bg: 'bg-cyan-500/15 border-cyan-500/25',       dot: 'bg-cyan-400'    },
  meta:       { label: 'Meta AI',    color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/25',     dot: 'bg-amber-400'   },
}

const CATEGORY_LABEL: Record<string, string> = {
  mid:            'Mid (100-200)',
  large:          'Large (500+)',
  very_large:     'Very Large (1k+)',
  general:        'General',
  tool_discovery: 'Tool Discovery',
  geo_category:   'GEO / AIO',
  problem_based:  'Problem-based',
  direct_brand:   'Direct Brand',
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
}

const getCatLabel = (cat: string) => CATEGORY_LABEL[cat] ?? cat
const getCatColor = (cat: string) => CATEGORY_COLOR[cat] ?? 'bg-slate-500/20 text-slate-300'

type FilterLLM = LLMName | 'all'
type FilterCat = PromptCategory | 'all'

export default function Mentions() {
  const { activeClientId, activeClient } = useClient()
  const brandName = activeClient?.name ?? 'your brand'
  const [mentions, setMentions] = useState<MentionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLLM, setFilterLLM] = useState<FilterLLM>('all')
  const [filterCat, setFilterCat] = useState<FilterCat>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      if (isDemoMode) {
        const events: MentionEvent[] = mockAIResults
          .filter(r => r.brand_mentioned)
          .map(r => {
            const prompt = mockPrompts.find(p => p.id === r.prompt_id)
            return {
              id: r.id,
              prompt_id: r.prompt_id,
              promptText: prompt?.text ?? '',
              category: (prompt?.category ?? 'general') as PromptCategory,
              llm: r.llm as LLMName,
              brand_position: r.brand_position,
              sentiment: r.sentiment,
              response_snippet: r.response_snippet,
              checked_at: r.checked_at,
            }
          })
          .sort((a, b) => (a.brand_position ?? 99) - (b.brand_position ?? 99))
        setMentions(events)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('ai_results')
        .select('*, prompts(text, category, position)')
        .eq('brand_mentioned', true)
        .eq('client_id', activeClientId)
        .order('checked_at', { ascending: false })

      if (data) {
        setMentions(data.map((r: any) => ({
          id: r.id,
          prompt_id: r.prompt_id,
          promptText: r.prompts?.text ?? '',
          category: (r.prompts?.category ?? 'general') as PromptCategory,
          llm: r.engine ?? r.llm,
          brand_position: r.brand_position,
          sentiment: r.sentiment,
          response_snippet: r.response_snippet,
          checked_at: r.checked_at,
        })))
      }
      setLoading(false)
    }
    load()
  }, [activeClientId])

  const filtered = mentions.filter(m => {
    if (filterLLM !== 'all' && m.llm !== filterLLM) return false
    if (filterCat !== 'all' && m.category !== filterCat) return false
    return true
  })

  const totalMentions = mentions.length
  const avgPosition = mentions.filter(m => m.brand_position).length
    ? Math.round(mentions.filter(m => m.brand_position).reduce((s, m) => s + (m.brand_position ?? 0), 0) /
        mentions.filter(m => m.brand_position).length)
    : 0
  const positiveSentiment = mentions.filter(m => m.sentiment === 'positive').length

  const engineCounts = Object.keys(LLM_META).map(llm => ({
    llm: llm as LLMName,
    count: mentions.filter(m => m.llm === llm).length,
  })).sort((a, b) => b.count - a.count)

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">Loading mentions...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Mentions</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Every time {brandName} was recommended by an AI engine and the prompt that triggered it
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex items-center gap-4">
          <TrendingUp size={20} className="text-emerald-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">{totalMentions}</div>
            <div className="text-xs text-slate-500 mt-0.5">Total AI mentions</div>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex items-center gap-4">
          <Award size={20} className="text-amber-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">#{avgPosition || '-'}</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg mention position</div>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex items-center gap-4">
          <Bot size={20} className="text-blue-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">{positiveSentiment}</div>
            <div className="text-xs text-slate-500 mt-0.5">Positive sentiment</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterLLM('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            filterLLM === 'all'
              ? 'bg-brand-500/30 text-brand-300 border-brand-500/40'
              : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600'
          }`}>
          All engines ({totalMentions})
        </button>
        {engineCounts.map(({ llm, count }) => {
          const meta = LLM_META[llm]
          if (!meta || count === 0) return null
          return (
            <button key={llm} onClick={() => setFilterLLM(llm === filterLLM ? 'all' : llm)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filterLLM === llm ? `${meta.bg} ${meta.color}` : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', ...Object.keys(CATEGORY_LABEL)] as const).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat as any)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors border ${
              filterCat === cat
                ? 'bg-slate-700 text-slate-200 border-slate-600'
                : 'bg-dark-800 text-slate-500 border-dark-700 hover:border-dark-600'
            }`}>
            {cat === 'all' ? 'All categories' : getCatLabel(cat)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(m => {
          const llmMeta = LLM_META[m.llm] ?? LLM_META['chatgpt']
          const isOpen = expanded === m.id
          return (
            <div key={m.id} className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
              <button className="w-full text-left px-5 py-4 hover:bg-dark-700/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : m.id)}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 text-center mt-0.5">
                    {m.brand_position ? (
                      <>
                        <div className="text-lg font-bold text-emerald-400 tabular-nums">#{m.brand_position}</div>
                        <div className="text-[10px] text-slate-600">pos</div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-600 mt-1">-</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${llmMeta.bg} ${llmMeta.color}`}>
                        <Bot size={10} />{llmMeta.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCatColor(m.category)}`}>
                        {getCatLabel(m.category)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <SentimentDot value={m.sentiment as any} />{m.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 truncate">{m.promptText}</p>
                  </div>
                  <ChevronDown size={15}
                    className={`shrink-0 text-slate-600 transition-transform mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isOpen && m.response_snippet && (
                <div className="border-t border-dark-700 px-5 py-4 bg-dark-700/20">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">AI Response Snippet</div>
                  <blockquote className="text-sm text-slate-300 italic leading-relaxed border-l-2 border-emerald-500/40 pl-3">
                    "{m.response_snippet}"
                  </blockquote>
                  <div className="mt-3 text-xs text-slate-600">
                    Checked: {new Date(m.checked_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
              )}
              {isOpen && !m.response_snippet && (
                <div className="border-t border-dark-700 px-5 py-3 bg-dark-700/20 text-xs text-slate-600 italic">
                  No snippet captured for this mention.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          {totalMentions === 0
            ? 'No AI mentions yet — run the collector to get real data.'
            : 'No mentions match these filters.'}
        </div>
      )}
    </div>
  )
}
