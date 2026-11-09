/**
 * sentimentView.ts - pure view model for the Brand Sentiment page
 * (docs/arch/phase2-results-layer-spec.md 10.3).
 *
 * Snapshot numbers (cards, per-engine chart) come from metrics.ts over the
 * shared population. The trend and the feed come from paged windowed history.
 */
import type { SnapshotView, SentimentSummary } from '../metrics'
import { sentimentSummary, sentimentByEngine } from '../metrics'
import { isNoAnswerRow } from '../aiVisibilityScore'
import { ENGINE_META } from '../planConfig'

export type TrendPeriod = 'weekly' | 'monthly' | 'quarterly'
export type SentimentKey = 'positive' | 'neutral' | 'negative'

export interface SentimentHistoryRow {
  id: number
  prompt_id: number
  llm: string
  sentiment: string
  brand_position: number | null
  response_snippet: string | null
  checked_at: string
}

export interface ScoreMeta { label: string; color: string }

export function scoreMeta(score: number | null): ScoreMeta {
  if (score === null) return { label: 'No data yet', color: 'text-slate-500' }
  if (score >= 75) return { label: 'Mostly Positive', color: 'text-sentiment-positive' }
  if (score >= 50) return { label: 'Mixed / Neutral', color: 'text-sentiment-neutral' }
  if (score >= 25) return { label: 'Needs Attention', color: 'text-amber-400' }
  return { label: 'Mostly Negative', color: 'text-sentiment-negative' }
}

export interface SentimentView {
  summary: SentimentSummary
  byEngine: Record<string, SentimentSummary>
}

export function buildSentimentView(view: SnapshotView): SentimentView {
  return {
    summary: sentimentSummary(view.population.cells),
    byEngine: sentimentByEngine(view.population),
  }
}

/** Per active engine with mentions: { engine: label, Positive, Neutral, Negative } as percentages. */
export function buildEngineSentimentData(
  byEngine: Record<string, SentimentSummary>,
  engineIds: readonly string[],
): { engine: string; Positive: number; Neutral: number; Negative: number }[] {
  const out: { engine: string; Positive: number; Neutral: number; Negative: number }[] = []
  for (const id of engineIds) {
    const s = byEngine[id]
    if (!s || s.total === 0) continue
    out.push({
      engine: (ENGINE_META as Record<string, { label: string }>)[id]?.label ?? id,
      Positive: s.pct.positive,
      Neutral: s.pct.neutral,
      Negative: s.pct.negative,
    })
  }
  return out
}

// --- Trend -------------------------------------------------------------------

export function computeTrend(
  events: ReadonlyArray<{ checked_at: string; sentiment: string }>,
  period: TrendPeriod,
): { period: string; Positive: number; Neutral: number; Negative: number }[] {
  const getKey = (date: Date): string => {
    if (period === 'weekly') {
      const d = new Date(date)
      d.setDate(d.getDate() - d.getDay())
      return d.toISOString().slice(0, 10)
    }
    if (period === 'monthly') return date.toISOString().slice(0, 7)
    return `${date.getFullYear()} Q${Math.floor(date.getMonth() / 3) + 1}`
  }
  const buckets: Record<string, { Positive: number; Neutral: number; Negative: number }> = {}
  for (const e of events) {
    const key = getKey(new Date(e.checked_at))
    if (!buckets[key]) buckets[key] = { Positive: 0, Neutral: 0, Negative: 0 }
    if (e.sentiment === 'positive') buckets[key].Positive++
    else if (e.sentiment === 'negative') buckets[key].Negative++
    else buckets[key].Neutral++
  }
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, c]) => ({ period: p, ...c }))
}

// --- Feed --------------------------------------------------------------------

/** Drop no-answer rows from history; they carry no sentiment signal. */
export function feedRows(history: ReadonlyArray<SentimentHistoryRow>): SentimentHistoryRow[] {
  return history.filter(r => !isNoAnswerRow(r))
}

export interface FeedCounts { total: number; positive: number; neutral: number; negative: number }

/** Counts for the filter chips, so `All (N)` equals the list length. */
export function feedCounts(rows: ReadonlyArray<{ sentiment: string }>): FeedCounts {
  const c: FeedCounts = { total: rows.length, positive: 0, neutral: 0, negative: 0 }
  for (const r of rows) {
    if (r.sentiment === 'positive') c.positive++
    else if (r.sentiment === 'negative') c.negative++
    else c.neutral++
  }
  return c
}

export function filterFeed<T extends { sentiment: string; llm: string }>(
  rows: ReadonlyArray<T>,
  sentiment: SentimentKey | 'all',
  engine: string | 'all',
): T[] {
  return rows.filter(r => {
    if (sentiment !== 'all') {
      const s = r.sentiment === 'positive' || r.sentiment === 'negative' ? r.sentiment : 'neutral'
      if (s !== sentiment) return false
    }
    return engine === 'all' || r.llm === engine
  })
}
