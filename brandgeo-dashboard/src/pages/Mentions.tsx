import { useEffect, useState } from 'react'
import { Bot, TrendingUp, Award, ChevronDown } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { mockAIResults, mockPrompts } from '../lib/mockData'
import { SentimentDot } from '../components/ScoreBadge'
import type { LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { promptCategoryLabel } from '../lib/promptCategories'

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

// Shape of the raw Supabase row for the joined ai_results + prompts select below.
// `engine` is a legacy/fallback field some older rows may carry; current schema
// column is `llm` (see CLAUDE.md §3) — preserved as-is, just typed instead of `any`.
interface RawMentionRow {
  id: number
  prompt_id: number
  llm: LLMName
  engine?: LLMName
  brand_position: number | null
  sentiment: string
  response_snippet: string | null
  checked_at: string
  prompts?: { text: string; category: string; position: number } | null
}

const LLM_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  chatgpt:    { label: 'ChatGPT',    color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25', dot: 'bg-emerald-400' },
  gemini:     { label: 'Gemini',     color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/25',       dot: 'bg-blue-400'    },
  claude:     { label: 'Claude',     color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/25',   dot: 'bg-orange-400'  },
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

const getCatLabel = (cat: string) => CATEGORY_LABEL[cat] ?? promptCategoryLabel(cat)
const getCatColor = (cat: string) => CATEGORY_COLOR[cat] ?? 'bg-slate-500/20 text-slate-300'

type FilterLLM = LLMName | 'all'
type FilterCat = PromptCategory | 'all'

export default function Mentions() {
  const { t } = useI18n()
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
        setMentions((data as RawMentionRow[]).map(r => ({
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

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">{t.men_loading}</div>

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{t.men_title}</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {fmt(t.men_subtitle, { brandName })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
          <TrendingUp size={20} className="text-emerald-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">{totalMentions}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.men_totalMentions}</div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
          <Award size={20} className="text-amber-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-white tabular-nums">#{avgPosition || '-'}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.men_avgPosition}</div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
          <Bot size={20} className="text-blue-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">{positiveSentiment}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.men_positiveSentiment}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterLLM('all')}
          aria-pressed={filterLLM === 'all'}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            filterLLM === 'all'
              ? 'bg-brand-500/30 text-brand-300 border-brand-500/40'
              : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600'
          }`}>
          {fmt(t.men_allEngines, { n: totalMentions })}
        </button>
        {engineCounts.map(({ llm, count }) => {
          const meta = LLM_META[llm]
          if (!meta || count === 0) return null
          return (
            <button key={llm} onClick={() => setFilterLLM(llm === filterLLM ? 'all' : llm)}
              aria-pressed={filterLLM === llm}
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
        {(['all', ...Object.keys(CATEGORY_LABEL)] as FilterCat[]).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            aria-pressed={filterCat === cat}
            className={`px-3 py-1 rounded-lg text-xs transition-colors border ${
              filterCat === cat
                ? 'bg-brand-500/30 text-brand-300 border-brand-500/40'
                : 'bg-dark-800 text-slate-500 border-dark-700 hover:border-dark-600'
            }`}>
            {cat === 'all' ? t.men_allCategories : getCatLabel(cat)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(m => {
          const llmMeta = LLM_META[m.llm] ?? LLM_META['chatgpt']
          const isOpen = expanded === m.id
          return (
            <div key={m.id} className="bg-dark-800 rounded-xl overflow-hidden">
              <button className="w-full text-left px-5 py-4 hover:bg-dark-700/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : m.id)}
                aria-expanded={isOpen}>
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
                        <SentimentDot value={m.sentiment} />{m.sentiment}
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
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{t.men_responseSnippet}</div>
                  <blockquote className="text-sm text-slate-300 italic leading-relaxed border-l-2 border-emerald-500/40 pl-3">
                    "{m.response_snippet}"
                  </blockquote>
                  <div className="mt-3 text-xs text-slate-600">
                    {t.men_checked} {new Date(m.checked_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {isOpen && !m.response_snippet && (
                <div className="border-t border-dark-700 px-5 py-3 bg-dark-700/20 text-xs text-slate-600 italic">
                  {t.men_noSnippet}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          {totalMentions === 0
            ? t.men_noMentions
            : t.men_noFilter}
        </div>
      )}
    </div>
  )
}
