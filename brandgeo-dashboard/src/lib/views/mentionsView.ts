/**
 * mentionsView.ts - Mentions summary and feed
 * (docs/arch/phase2-results-layer-spec.md section 10.3, Mentions row).
 *
 * Pure: no supabase import. The summary is the latest answer per prompt and
 * engine (snapshot population); the feed is every mention on record, read as
 * paged history by the page.
 */
import { type EngineId } from '../planConfig'
import { isNoAnswerRow } from '../aiVisibilityScore'
import {
  buildSnapshotView, averagePosition, sentimentSummary, type ResultRow,
} from '../metrics'
import type { Prompt } from '../../types'

/** Columns read by readResultHistory (mentioned only, all time). */
export const MENTIONS_HISTORY_COLUMNS =
  'id, prompt_id, llm, brand_position, sentiment, response_snippet, checked_at'

export interface MentionsHistoryRow {
  id: number
  prompt_id: number
  llm: string
  brand_position: number | null
  sentiment: string
  response_snippet: string | null
  checked_at: string
}

export interface MentionFeedEvent {
  id: number
  prompt_id: number
  promptText: string
  category: string
  llm: string
  brand_position: number | null
  sentiment: string
  response_snippet: string | null
  checked_at: string
}

export interface MentionsView {
  summary: { mentions: number; avgPosition: number | null; positive: number }
  feed: MentionFeedEvent[]
  /** Counts over the feed, most first. Engines with no mention are omitted. */
  engineCounts: { llm: string; count: number }[]
}

export function buildMentionsView(input: {
  rows: ResultRow[]
  activePrompts: ReadonlyArray<Prompt>
  prompts: ReadonlyArray<Prompt>
  activeEngines: readonly EngineId[] | readonly string[]
  history: ReadonlyArray<MentionsHistoryRow>
}): MentionsView {
  const { rows, activePrompts, prompts, activeEngines, history } = input
  const sv = buildSnapshotView(rows, activePrompts.map(p => p.id), activeEngines)
  const mentionedCells = sv.population.cells.filter(c => c.brand_mentioned)

  const eng = new Set<string>(activeEngines as readonly string[])
  const byId = new Map<number, Prompt>()
  for (const p of prompts) byId.set(p.id, p)

  const feed: MentionFeedEvent[] = history
    .filter(r => eng.has(r.llm) && !isNoAnswerRow(r))
    .map(r => {
      const p = byId.get(r.prompt_id)
      return {
        id: r.id,
        prompt_id: r.prompt_id,
        promptText: p?.text ?? '',
        category: p?.category ?? 'general',
        llm: r.llm,
        brand_position: r.brand_position,
        sentiment: r.sentiment,
        response_snippet: r.response_snippet,
        checked_at: r.checked_at,
      }
    })

  const counts = new Map<string, number>()
  for (const f of feed) counts.set(f.llm, (counts.get(f.llm) ?? 0) + 1)
  const engineCounts = Array.from(counts.entries())
    .map(([llm, count]) => ({ llm, count }))
    .sort((a, b) => b.count - a.count)

  return {
    summary: {
      mentions: mentionedCells.length,
      avgPosition: averagePosition(mentionedCells),
      positive: sentimentSummary(mentionedCells).positive,
    },
    feed,
    engineCounts,
  }
}
