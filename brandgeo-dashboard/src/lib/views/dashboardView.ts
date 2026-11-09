/**
 * dashboardView.ts - Overview numbers from the shared results snapshot
 * (docs/arch/phase2-results-layer-spec.md section 10.3, Overview row).
 *
 * Pure: no supabase import, so it runs under node in tests/views_a.test.js.
 * Snapshot numbers come from metrics.ts. The windowed history rows (paged by
 * readResultHistory) only feed the Checks tile, the sparklines and the two
 * recent lists.
 */
import { ENGINE_META, type EngineId } from '../planConfig'
import { isNoAnswerRow, type AiVisibilityDimensions } from '../aiVisibilityScore'
import {
  buildSnapshotView, mentionRate, averagePosition, engineRates, visibilityScore, hasAnyMeasurement,
  type ResultRow, type RateStat,
} from '../metrics'
import type { Prompt } from '../../types'

/** Columns read by readResultHistory for the Overview window. */
export const DASHBOARD_HISTORY_COLUMNS =
  'id, prompt_id, llm, brand_mentioned, brand_position, checked_at, response_snippet'

export interface DashboardHistoryRow {
  id: number
  prompt_id: number
  llm: string
  brand_mentioned: boolean
  brand_position: number | null
  checked_at: string
  response_snippet: string | null
}

// A single sparkline point. avg-position buckets can be null (a bucket with no
// ranked mentions); the chart connects across those gaps.
export interface SparkPoint { v: number | null }

/**
 * KPI trend sparklines: bucket the window's history rows into ~8 chronological
 * slices and derive one series per KPI card (mention rate %, average ranked
 * position, check volume). Moved here unchanged from Dashboard.tsx.
 */
export function buildKpiSparklines(rows: ReadonlyArray<{
  checked_at: string
  brand_mentioned: boolean
  brand_position: number | null
}>): { mentionRate: SparkPoint[]; avgPosition: SparkPoint[]; volume: SparkPoint[] } {
  const BUCKETS = 8
  const sorted = [...rows].sort(
    (a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime(),
  )
  const mentionRateS: SparkPoint[] = []
  const avgPositionS: SparkPoint[] = []
  const volumeS: SparkPoint[] = []
  if (sorted.length === 0) return { mentionRate: mentionRateS, avgPosition: avgPositionS, volume: volumeS }

  const size = Math.max(1, Math.ceil(sorted.length / BUCKETS))
  for (let i = 0; i < sorted.length; i += size) {
    const chunk = sorted.slice(i, i + size)
    const mentions = chunk.filter(r => r.brand_mentioned).length
    mentionRateS.push({ v: Math.round((mentions / chunk.length) * 100) })
    const posRows = chunk.filter(r => r.brand_mentioned && r.brand_position != null)
    avgPositionS.push({
      v: posRows.length > 0
        ? posRows.reduce((s, r) => s + (r.brand_position ?? 0), 0) / posRows.length
        : null,
    })
    volumeS.push({ v: chunk.length })
  }
  return { mentionRate: mentionRateS, avgPosition: avgPositionS, volume: volumeS }
}

export interface EngineBar {
  id: string
  label: string
  rate: number
  count: number
  color: string
}

export interface RecentEntry {
  id: number
  prompt_id: number
  llm: string
  brand_position: number | null
  checked_at: string
  text: string | null
}

export interface DashboardView {
  /** M8. Null when there are no active prompts. */
  score: { dimensions: AiVisibilityDimensions; aiScore: number } | null
  /** M9. */
  hasAnyMeasurement: boolean
  promptCount: number
  /** M1 over the snapshot population. */
  mention: RateStat
  /** M2 over the snapshot population. */
  avgPosition: number | null
  /** M5 for active engines with at least one check. */
  engineBars: EngineBar[]
  /** M10 and the windowed lists, from the paged history. Null while it has not loaded. */
  window: {
    checks: number
    sparks: ReturnType<typeof buildKpiSparklines>
    recentMentioned: RecentEntry[]
    recentNotMentioned: RecentEntry[]
  } | null
}

/**
 * History rows that count for the window: active engines only, no-answer rows
 * dropped (they are not failures and were never winnable).
 */
export function filterWindowRows(
  history: ReadonlyArray<DashboardHistoryRow>,
  activeEngines: readonly string[],
): DashboardHistoryRow[] {
  const eng = new Set(activeEngines)
  return history.filter(r => eng.has(r.llm) && !isNoAnswerRow(r))
}

export function buildDashboardView(input: {
  rows: ResultRow[]
  activePrompts: ReadonlyArray<Prompt>
  prompts: ReadonlyArray<Prompt>
  activeEngines: readonly EngineId[] | readonly string[]
  history: ReadonlyArray<DashboardHistoryRow> | null
}): DashboardView {
  const { rows, activePrompts, prompts, activeEngines, history } = input
  const ids = activePrompts.map(p => p.id)
  const sv = buildSnapshotView(rows, ids, activeEngines)
  const mention = mentionRate(sv.population)

  const bars: EngineBar[] = engineRates(sv.population, sv.errorEngines)
    .filter(e => e.checked > 0)
    .map(e => ({
      id: e.engine,
      label: ENGINE_META[e.engine as EngineId]?.label ?? e.engine,
      rate: e.pct ?? 0,
      count: e.checked,
      color: ENGINE_META[e.engine as EngineId]?.chartColor ?? '#94a3b8',
    }))

  let win: DashboardView['window'] = null
  if (history) {
    const kept = filterWindowRows(history, activeEngines)
    const textOf = new Map<number, string>()
    for (const p of prompts) textOf.set(p.id, p.text)
    const toEntry = (r: DashboardHistoryRow): RecentEntry => ({
      id: r.id,
      prompt_id: r.prompt_id,
      llm: r.llm,
      brand_position: r.brand_position,
      checked_at: r.checked_at,
      text: textOf.get(r.prompt_id) ?? null,
    })
    win = {
      checks: kept.length,
      sparks: buildKpiSparklines(kept),
      recentMentioned: kept.filter(r => r.brand_mentioned).slice(0, 5).map(toEntry),
      recentNotMentioned: kept.filter(r => !r.brand_mentioned).slice(0, 5).map(toEntry),
    }
  }

  return {
    score: ids.length > 0 ? visibilityScore(sv.population, sv.results) : null,
    hasAnyMeasurement: hasAnyMeasurement(rows),
    promptCount: ids.length,
    mention,
    avgPosition: averagePosition(sv.population.cells),
    engineBars: bars,
    window: win,
  }
}
