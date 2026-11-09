import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, TrendingUp, Award, ChevronDown } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'
import { useCollection } from '../lib/collectionContext'
import { useCollectionLanded } from '../lib/useCollectionLanded'
import { useResults } from '../lib/resultsContext'
import { readResultHistory } from '../lib/historyRead'
import { formatAvgPosition } from '../lib/metrics'
import { buildMentionsView, MENTIONS_HISTORY_COLUMNS, type MentionsHistoryRow } from '../lib/views/mentionsView'
import { mockAIResults } from '../lib/mockData'
import RouteSkeleton from '../components/RouteSkeleton'
import Skeleton from '../components/Skeleton'
import { ownRows, nextSeq, isStale } from '../lib/resultsGuards'
import LoadErrorCard from '../components/LoadErrorCard'
import { SentimentDot } from '../components/ScoreBadge'
import { PageTitle, SectionHeading } from '../components/Typography'
import EngineChip from '../components/EngineChip'
import SharedEmptyState from '../components/EmptyState'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { formatDate } from '../lib/format'
import type { LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { promptCategoryLabel } from '../lib/promptCategories'

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
  const { activeClientId, activeClient, activeEngines } = useClient()
  const { lastCompletedAt } = useCollection()
  const { snapshot, status, loadError, reload } = useResults()
  const brandName = activeClient?.name ?? 'your brand'
  const [historyState, setHistoryState] = useState<{ rows: MentionsHistoryRow[] | null; clientId: number }>({ rows: null, clientId: activeClientId })
  // Rows of another client are never shown, not even for one render.
  const history = ownRows(historyState, activeClientId, null)
  const historySeq = useRef(0)
  const [historyFailed, setHistoryFailed] = useState(false)
  const [filterLLM, setFilterLLM] = useState<FilterLLM>('all')
  const [filterCat, setFilterCat] = useState<FilterCat>('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  // The feed is every mention on record, so it reads paged history (all time).
  // A quiet reload keeps the rows on screen; only a client change clears them.
  const loadHistory = useCallback(async (quiet: boolean) => {
    const mine = nextSeq(historySeq)
    if (!quiet) {
      setHistoryState(prev => (prev.clientId === activeClientId ? prev : { rows: null, clientId: activeClientId }))
      setHistoryFailed(false)
    }
    if (isDemoMode) {
      setHistoryState({ clientId: activeClientId, rows: mockAIResults
        .filter(r => r.brand_mentioned)
        .map(r => ({
          id: r.id, prompt_id: r.prompt_id, llm: r.llm, brand_position: r.brand_position,
          sentiment: r.sentiment, response_snippet: r.response_snippet, checked_at: r.checked_at,
        }))
        .sort((a, b) => (a.brand_position ?? 99) - (b.brand_position ?? 99)) })
      return
    }
    const res = await readResultHistory<MentionsHistoryRow>(supabase, {
      clientId: activeClientId, sinceIso: null, columns: MENTIONS_HISTORY_COLUMNS, mentionedOnly: true,
    })
    if (isStale(historySeq, mine)) return
    if (res.error) { setHistoryFailed(true); return }
    setHistoryFailed(false)
    setHistoryState({ rows: res.rows, clientId: activeClientId })
  }, [activeClientId])

  useEffect(() => { void loadHistory(false) }, [loadHistory])

  // The snapshot reloads itself on lastCompletedAt (resultsContext); the paged
  // feed does not, so re-read it quietly.
  useCollectionLanded(lastCompletedAt, () => { void loadHistory(true) })

  const view = useMemo(() => snapshot
    ? buildMentionsView({
        rows: snapshot.rows,
        activePrompts: snapshot.activePrompts,
        prompts: snapshot.prompts,
        activeEngines,
        history: history ?? [],
      })
    : null, [snapshot, activeEngines, history])

  if (!snapshot || !view) {
    if (status === 'error') {
      return (
        <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
          <PageTitle>{t.men_title}</PageTitle>
          <div className="mt-4"><LoadErrorCard onRetry={() => reload()} /></div>
        </div>
      )
    }
    return <RouteSkeleton />
  }

  const mentions = view.feed
  const filtered = mentions.filter(m => {
    if (filterLLM !== 'all' && m.llm !== filterLLM) return false
    if (filterCat !== 'all' && m.category !== filterCat) return false
    return true
  })

  const totalMentions = view.summary.mentions
  // N2: until the history arrives (and has not failed) the feed is a skeleton
  // and the All engines chip carries no count.
  const historyLoading = history === null && !historyFailed
  const allEnginesLabel = t.men_allEngines.replace(/\s*\(\{n\}\)/, '')
  const noMentions = totalMentions === 0 && mentions.length === 0
  const avgPositionLabel = formatAvgPosition(view.summary.avgPosition)
  const positiveSentiment = view.summary.positive
  const engineCounts = view.engineCounts

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <PageTitle>{t.men_title}</PageTitle>
        <p className="text-sm text-slate-400 mt-0.5">
          {fmt(t.men_subtitle, { brandName })}
        </p>
      </div>

      {loadError && (
        <LoadErrorCard
          message="These numbers may be out of date. We could not refresh them."
          onRetry={() => reload({ quiet: true })}
        />
      )}

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
            {avgPositionLabel !== null ? (
              <div className="text-2xl font-bold text-white tabular-nums">{avgPositionLabel}</div>
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

      <p className="text-xs text-slate-500 -mt-3 mb-6">
        Latest answer per prompt and engine. The list below is every mention on record.
      </p>

      <SectionHeading className="sr-only">Filter mentions</SectionHeading>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterLLM('all')}
          aria-pressed={filterLLM === 'all'}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            filterLLM === 'all'
              ? 'bg-brand-500/30 text-brand-300 border-brand-500/40'
              : 'bg-dark-800 text-slate-400 border-dark-700 hover:border-dark-600'
          }`}>
          {historyLoading ? allEnginesLabel : fmt(t.men_allEngines, { n: mentions.length })}
        </button>
        {engineCounts.map(({ llm, count }) => {
          if (count === 0) return null
          return (
            <EngineChip
              key={llm}
              id={llm as EngineId}
              selected={filterLLM === llm}
              onClick={() => setFilterLLM(llm === filterLLM ? 'all' : (llm as LLMName))}
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

      {historyFailed && (
        <LoadErrorCard
          message="Couldn't load the list of mentions."
          onRetry={() => { void loadHistory(false) }}
        />
      )}

      {historyLoading && <Skeleton className="h-[220px] w-full rounded-lg" />}
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

      {filtered.length === 0 && !historyFailed && history !== null && (
        noMentions ? (
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
