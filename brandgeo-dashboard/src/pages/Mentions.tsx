import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, ChevronDown } from 'lucide-react'
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
import EngineChip from '../components/EngineChip'
import {
  Page, PageHeader, HeroAnswer, Badge, Chip, ChipGroup, Select, DataList, StatusGlyph,
} from '../components/ui'
import { ENGINE_META, type EngineId } from '../lib/planConfig'
import { formatDate } from '../lib/format'
import type { LLMName, PromptCategory } from '../types'
import { useI18n, fmt } from '../lib/i18nContext'
import { promptCategoryLabel } from '../lib/promptCategories'

// Engine identity is ENGINE_META + EngineChip / Chip swatch (one source, one hex).

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

const getCatLabel = (cat: string) => CATEGORY_LABEL[cat] ?? promptCategoryLabel(cat)

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
        <Page>
          <PageHeader title={t.men_title} />
          <LoadErrorCard onRetry={() => reload()} />
        </Page>
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
  const engineCounts = view.engineCounts.filter(e => e.count > 0)

  const sentimentKind = (s: string) => (s === 'positive' ? 'pos' : s === 'negative' ? 'neg' : 'neu') as 'pos' | 'neg' | 'neu'

  const engineChips = (
    <ChipGroup label="Engine">
      <Chip selected={filterLLM === 'all'} onClick={() => setFilterLLM('all')}>
        {historyLoading ? allEnginesLabel : fmt(t.men_allEngines, { n: mentions.length })}
      </Chip>
      {engineCounts.map(({ llm, count }) => (
        <Chip
          key={llm}
          selected={filterLLM === llm}
          count={count}
          swatch={ENGINE_META[llm as EngineId]?.chartColor}
          onClick={() => setFilterLLM(llm === filterLLM ? 'all' : (llm as LLMName))}
        >
          {ENGINE_META[llm as EngineId]?.label ?? llm}
        </Chip>
      ))}
    </ChipGroup>
  )
  const catKeys = ['all', ...Object.keys(CATEGORY_LABEL)] as FilterCat[]
  const catChips = (
    <ChipGroup label="Category">
      {catKeys.map(cat => (
        <Chip key={cat} selected={filterCat === cat} onClick={() => setFilterCat(cat)}>
          {cat === 'all' ? t.men_allCategories : getCatLabel(cat)}
        </Chip>
      ))}
    </ChipGroup>
  )

  return (
    <Page>
      <PageHeader title={t.men_title} />

      {loadError && (
        <LoadErrorCard
          message="These numbers may be out of date. We could not refresh them."
          onRetry={() => reload({ quiet: true })}
        />
      )}

      <div className="space-y-4 md:space-y-6">
        {noMentions ? (
          <HeroAnswer
            loading={historyLoading}
            empty={{
              icon: Bot,
              // copy: pending bg-copy
              title: 'No AI answer has named your brand yet.',
              body: t.men_noMentions,
              actionLabel: 'See the prompts',
              actionTo: '/ai-visibility',
            }}
            answer=""
          />
        ) : (
          <HeroAnswer
            value={totalMentions}
            unit={totalMentions === 1 ? 'mention' : 'mentions'}
            // copy: pending bg-copy
            answer={`AI engines named ${brandName} ${totalMentions} ${totalMentions === 1 ? 'time' : 'times'}${avgPositionLabel !== null ? `, at an average position of ${avgPositionLabel}` : ''}.`}
            // copy: pending bg-copy
            context={`${positiveSentiment} of them positive. Latest answer per prompt and engine.`}
          />
        )}

        {!noMentions && (
          <>
            <div className="hidden md:flex flex-col gap-3">
              {engineChips}
              {catChips}
            </div>
            <div className="md:hidden grid grid-cols-1 gap-3">
              <Select aria-label="Engine" value={filterLLM} onChange={e => setFilterLLM(e.target.value as FilterLLM)}>
                <option value="all">{historyLoading ? allEnginesLabel : fmt(t.men_allEngines, { n: mentions.length })}</option>
                {engineCounts.map(({ llm, count }) => (
                  <option key={llm} value={llm}>{ENGINE_META[llm as EngineId]?.label ?? llm} ({count})</option>
                ))}
              </Select>
              <Select aria-label="Category" value={filterCat} onChange={e => setFilterCat(e.target.value as FilterCat)}>
                {catKeys.map(cat => (
                  <option key={cat} value={cat}>{cat === 'all' ? t.men_allCategories : getCatLabel(cat)}</option>
                ))}
              </Select>
            </div>
          </>
        )}

        {historyFailed && (
          <LoadErrorCard
            message="Couldn't load the list of mentions."
            onRetry={() => { void loadHistory(false) }}
          />
        )}

        {historyLoading && <Skeleton className="h-[220px] w-full rounded-lg" />}

        {filtered.length > 0 && (
          <DataList
            ariaLabel="Mentions"
            rows={filtered}
            getKey={m => m.id}
            renderRow={m => {
              const engineId = (ENGINE_META[m.llm as EngineId] ? m.llm : 'chatgpt') as EngineId
              const isOpen = expanded === m.id
              return (
                <div className="w-full min-w-0">
                  <button
                    type="button"
                    className="w-full text-left flex items-start gap-4 min-h-[44px]"
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="shrink-0 w-10 text-center">
                      {m.brand_position ? (
                        <>
                          <span className="block text-value text-ink tabular-nums">#{m.brand_position}</span>
                          <span className="block text-meta text-ink-3">pos</span>
                        </>
                      ) : (
                        <span className="block text-body text-ink-3 mt-1">n/a</span>
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-body text-ink line-clamp-2 md:line-clamp-1 break-words">{m.promptText}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <EngineChip id={engineId} interactive={false} />
                        <Badge tone="neutral">{getCatLabel(m.category)}</Badge>
                        <span className="inline-flex items-center gap-1 text-meta text-ink-2">
                          <StatusGlyph kind={sentimentKind(m.sentiment)} size={12} />{m.sentiment}
                        </span>
                      </span>
                    </span>
                    <ChevronDown size={16} aria-hidden="true"
                      className={`shrink-0 text-ink-3 transition-transform motion-reduce:transition-none mt-1 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && m.response_snippet && (
                    <div className="mt-3 rounded-control bg-surface-2 p-4">
                      <div className="text-meta text-ink-3 mb-2">{t.men_responseSnippet}</div>
                      <blockquote className="m-0 text-body text-ink-2 leading-relaxed">
                        &quot;{m.response_snippet}&quot;
                      </blockquote>
                      <div className="mt-3 text-meta text-ink-3">
                        {t.men_checked} {formatDate(m.checked_at)}
                      </div>
                    </div>
                  )}
                  {isOpen && !m.response_snippet && (
                    <div className="mt-3 rounded-control bg-surface-2 p-4 text-meta text-ink-3">
                      {t.men_noSnippet}
                    </div>
                  )}
                </div>
              )
            }}
          />
        )}

        {filtered.length === 0 && !historyFailed && history !== null && !noMentions && (
          <p className="m-0 py-12 text-center text-body text-ink-3">{t.men_noFilter}</p>
        )}
      </div>
    </Page>
  )
}
