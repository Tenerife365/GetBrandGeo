import { useEffect, useState } from 'react'
import { Bot, TrendingUp, Award, ChevronDown } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { useCollection } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { mockAIResults, mockPrompts } from '../lib/mockData'
import { SentimentDot } from '../components/ScoreBadge'
import { PageTitle, SectionHeading } from '../components/Typography'
import EngineChip from '../components/EngineChip'
import SharedEmptyState from '../components/EmptyState'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { formatDate } from '../lib/format'
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

// Engine identity is now ENGINE_META + EngineChip (dashboard-visual-system.md
// §8.4) — this file used to carry its OWN independent copy of engine label +
// colour (a fourth such copy in the app, alongside Competitors.tsx and
// AIVisibility.tsx), hand-picked separately from the chart palette and cited
// by the audit (F-14/F-15) as one of the two places Claude/Meta AI collide.

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
  const { lastCompletedAt } = useCollection()
  const brandName = activeClient?.name ?? 'your brand'
  const [mentions, setMentions] = useState<MentionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLLM, setFilterLLM] = useState<FilterLLM>('all')
  const [filterCat, setFilterCat] = useState<FilterCat>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = async (opts: { silent?: boolean } = {}) => {
    // Silent: a background reload triggered by lastCompletedAt, not a fresh
    // page open. Data is already on screen, so this must never bounce the
    // page back to the full-page loading state.
    if (!opts.silent) setLoading(true)

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

  useEffect(() => { load() }, [activeClientId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload quietly every time a collection run completes -- lastCompletedAt
  // bumps incrementally as jobs land (collectionContext.tsx), so this must
  // never assume a single final bump.
  useCollectionLanded(lastCompletedAt, () => load({ silent: true }))

  const filtered = mentions.filter(m => {
    if (filterLLM !== 'all' && m.llm !== filterLLM) return false
    if (filterCat !== 'all' && m.category !== filterCat) return false
    return true
  })

  const totalMentions = mentions.length
  const noMentions = totalMentions === 0
  const positionedMentions = mentions.filter(m => m.brand_position)
  // null, not 0, when nothing is ranked yet, so the card below can tell "no
  // positioned mention exists" apart from a real average, and never has to
  // spell the two the same way (the old fallback built the string "#-").
  const avgPosition = positionedMentions.length
    ? Math.round(positionedMentions.reduce((s, m) => s + (m.brand_position ?? 0), 0) / positionedMentions.length)
    : null
  const positiveSentiment = mentions.filter(m => m.sentiment === 'positive').length

  const engineCounts = (Object.keys(ENGINE_META) as EngineId[]).map(llm => ({
    llm: llm as LLMName,
    count: mentions.filter(m => m.llm === llm).length,
  })).sort((a, b) => b.count - a.count)

  if (loading) return <div className="p-8 text-slate-500 text-sm animate-pulse">{t.men_loading}</div>

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <PageTitle>{t.men_title}</PageTitle>
        <p className="text-sm text-slate-400 mt-0.5">
          {fmt(t.men_subtitle, { brandName })}
        </p>
      </div>

      <SectionHeading className="sr-only">Mention summary</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
          <TrendingUp size={20} className={noMentions ? 'text-slate-600 shrink-0' : 'text-emerald-400 shrink-0'} />
          <div>
            <div className={`text-2xl tabular-nums ${noMentions ? 'font-medium text-slate-500' : 'font-bold text-white'}`}>{totalMentions}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.men_totalMentions}</div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
          <Award size={20} className={noMentions ? 'text-slate-600 shrink-0' : 'text-amber-400 shrink-0'} />
          <div>
            {avgPosition !== null ? (
              <div className="text-2xl font-bold text-white tabular-nums">#{avgPosition}</div>
            ) : (
              <div className="text-sm font-medium text-slate-500 mt-1.5">Not ranked yet</div>
            )}
            <div className="text-xs text-slate-500 mt-0.5">{t.men_avgPosition}</div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-4 flex items-center gap-4">
          <Bot size={20} className={noMentions ? 'text-slate-600 shrink-0' : 'text-blue-400 shrink-0'} />
          <div>
            <div className={`text-2xl tabular-nums ${noMentions ? 'font-medium text-slate-500' : 'font-bold text-sentiment-positive'}`}>{positiveSentiment}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.men_positiveSentiment}</div>
          </div>
        </div>
      </div>

      <SectionHeading className="sr-only">Filter mentions</SectionHeading>
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
          if (count === 0) return null
          return (
            <EngineChip
              key={llm}
              id={llm as EngineId}
              selected={filterLLM === llm}
              onClick={() => setFilterLLM(llm === filterLLM ? 'all' : llm)}
            >
              {' '}({count})
            </EngineChip>
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
          const engineId = (ENGINE_META[m.llm as EngineId] ? m.llm : 'chatgpt') as EngineId
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
                        <div className="text-lg font-bold text-sentiment-positive tabular-nums">#{m.brand_position}</div>
                        <div className="text-[10px] text-slate-600">pos</div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-600 mt-1">-</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <EngineChip id={engineId} interactive={false} />
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
                  <blockquote className={`text-sm text-slate-300 italic leading-relaxed border-l-2 pl-3 ${
                    m.sentiment === 'positive' ? 'border-sentiment-positive' : m.sentiment === 'negative' ? 'border-sentiment-negative' : 'border-sentiment-neutral'
                  }`}>
                    "{m.response_snippet}"
                  </blockquote>
                  <div className="mt-3 text-xs text-slate-600">
                    {t.men_checked} {formatDate(m.checked_at)}
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
        totalMentions === 0 ? (
          <SharedEmptyState
            icon={Bot}
            title="Not measured yet"
            body={t.men_noMentions}
            actionLabel="Run a collection"
            actionTo="/ai-visibility"
            minHeight={220}
          />
        ) : (
          <div className="text-center py-16 text-slate-500">{t.men_noFilter}</div>
        )
      )}
    </div>
  )
}
