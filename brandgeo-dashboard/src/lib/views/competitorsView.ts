/**
 * competitorsView.ts - pure view model for the Competitors page
 * (docs/arch/phase2-results-layer-spec.md 8.3, 10.3).
 *
 * No React, no Supabase. Snapshot numbers come from metrics.ts over the shared
 * population P; the trend is computeTrend over paged windowed history.
 */
import type { SnapshotView, EngineShareRow } from '../metrics'
import { competitorStats, competitorEngineShare, averagePosition, mentionRate } from '../metrics'
import type { CompetitorAggregate } from '../competitorFilter'
import { ENGINE_META } from '../planConfig'
import { isNoAnswerRow } from '../aiVisibilityScore'
import { toCsv } from '../csv'

export type TrendPeriod = 'weekly' | 'monthly' | 'quarterly'

export interface CompetitorsView {
  topCompetitors: CompetitorAggregate[]
  brandMentions: number
  brandAvgPos: number | null
  /** M5, engines in population order. */
  engineShare: EngineShareRow[]
  /** n(P) */
  totalResponses: number
  /** Active prompt id -> text. */
  promptText: Map<number, string>
}

export function engineLabel(id: string): string {
  return (ENGINE_META as Record<string, { label: string }>)[id]?.label ?? id
}

export function buildCompetitorsView(
  view: SnapshotView,
  activePrompts: ReadonlyArray<{ id: number; text: string }>,
): CompetitorsView {
  const p = view.population
  const topCompetitors = competitorStats(p, 5)
  const mentionedCells = p.cells.filter(c => c.brand_mentioned)
  return {
    topCompetitors,
    brandMentions: mentionedCells.length,
    brandAvgPos: averagePosition(mentionedCells),
    engineShare: competitorEngineShare(p, topCompetitors.slice(0, 3)),
    totalResponses: mentionRate(p).checked,
    promptText: new Map(activePrompts.map(pr => [pr.id, pr.text])),
  }
}

/** One row per engine with data: { engine: label, <brand>: pct, <competitor>: pct }. */
export function buildEngineGroupData(
  brandName: string,
  share: EngineShareRow[],
): Record<string, string | number>[] {
  return share.map(r => {
    const row: Record<string, string | number> = { engine: engineLabel(r.engine) }
    row[brandName] = r.brandPct
    for (const [name, pct] of Object.entries(r.competitorPct)) row[name] = pct
    return row
  })
}

/** First ACTIVE prompt a competitor appeared on, or ''. */
export function samplePromptFor(c: CompetitorAggregate, promptText: Map<number, string>): string {
  for (const id of c.promptIds) {
    const t = promptText.get(id)
    if (t !== undefined) return t
  }
  return ''
}

// --- Trend -------------------------------------------------------------------

export interface TrendRow {
  checked_at: string
  brand_mentioned: boolean
  competitors_mentioned?: string | null
}

/**
 * History rows eligible for the trend: active engines only, and no-answer rows
 * dropped, the same population rule as the snapshot (spec 1.1).
 */
export function trendEligibleRows<T extends { llm: string; response_snippet?: string | null }>(
  rows: ReadonlyArray<T>,
  activeEngines: ReadonlyArray<string>,
): T[] {
  return rows.filter(r => activeEngines.includes(r.llm) && !isNoAnswerRow(r))
}

export function computeTrend(
  aiResults: ReadonlyArray<TrendRow>,
  brandName: string,
  topCompetitors: ReadonlyArray<{ name: string }>,
  period: TrendPeriod,
): Record<string, string | number>[] {
  if (!aiResults.length) return []

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

  const compNames = topCompetitors.slice(0, 4).map(c => c.name)
  const buckets: Record<string, Record<string, number>> = {}

  for (const row of aiResults) {
    const key = getPeriodKey(new Date(row.checked_at))
    if (!buckets[key]) {
      buckets[key] = { [brandName]: 0 }
      for (const n of compNames) buckets[key][n] = 0
    }
    if (row.brand_mentioned) buckets[key][brandName]++
    let comps: unknown[] = []
    try { comps = JSON.parse(row.competitors_mentioned || '[]') } catch { /* ignore */ }
    for (const c of comps) {
      const n = typeof c === 'string' ? c : (c as { name?: string } | null)?.name
      const match = compNames.find(cn => cn.toLowerCase() === n?.toLowerCase())
      if (match) buckets[key][match]++
    }
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([p, counts]) => ({ period: p, ...counts }))
}

// --- CSV (spec 8.1, 8.3) -----------------------------------------------------

export const COMPETITORS_CSV_HEADER = [
  'Name', 'Is you', 'AI mentions', 'Ranked mentions', 'Avg position', 'Engines', 'Sample prompt',
]

/**
 * Brand row first, then competitorStats(P, 100). Manual competitors are not
 * exported. Engines are labels of ACTIVE engines, in population order.
 */
export function buildCompetitorsCsv(
  view: SnapshotView,
  brandName: string,
  activePrompts: ReadonlyArray<{ id: number; text: string }>,
): string {
  const p = view.population
  const promptText = new Map(activePrompts.map(pr => [pr.id, pr.text]))
  const mentioned = p.cells.filter(c => c.brand_mentioned)
  const brandEngines = p.engineIds
    .filter(e => mentioned.some(c => c.llm === e))
    .map(engineLabel)
    .join('; ')
  const rows: Array<Array<string | number | null>> = [[
    brandName,
    'yes',
    mentioned.length,
    mentioned.filter(c => c.brand_position !== null && c.brand_position !== undefined).length,
    averagePosition(mentioned),
    brandEngines,
    '',
  ]]
  for (const c of competitorStats(p, 100)) {
    rows.push([
      c.name,
      'no',
      c.totalMentions,
      c.rankedMentions,
      c.avgPos,
      p.engineIds.filter(e => (c.byEngine[e] ?? 0) > 0).map(engineLabel).join('; '),
      samplePromptFor(c, promptText),
    ])
  }
  return toCsv(COMPETITORS_CSV_HEADER, rows)
}
