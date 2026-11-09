/**
 * aiVisibilityView.ts - AI Visibility numbers from the shared results snapshot
 * (docs/arch/phase2-results-layer-spec.md section 10.3 and 8.2).
 *
 * Pure: no supabase import, so it runs under node in tests/views_a.test.js.
 * Every number comes from metrics.ts over the snapshot rows; nothing here reads
 * the database.
 */
import type { EngineId } from '../planConfig'
import type { AiVisibilityDimensions } from '../aiVisibilityScore'
import type { FixResultMap } from '../fixItems'
import {
  buildSnapshotView, visibilityScore, competitorStats, mentionRate, engineRates, categoryRates,
  cellViewRows, engineHealth, engineErrorSinceByEngine, newestErrorAtByEngine,
  type ResultRow, type EngineHealth, type EngineRate, type CategoryRate,
} from '../metrics'
import {
  parseRankedCompetitors, type CellView, type PerfRow,
} from '../promptPerformance'
import { isLikelyCompanyName, toDisplayName } from '../competitorFilter'
import type { Prompt, LLMName } from '../../types'

export interface CompetitorFreqRow {
  name: string
  count: number
  avgPos: number | null
  rankedMentions: number
  proseOnly: boolean
}

export interface AiVisibilityData {
  results: FixResultMap
  errorEngines: Set<LLMName>
  partialErrorEngines: Set<LLMName>
  latestChecked: string | null
  engineHealth: Map<LLMName, EngineHealth>
  errorSinceByEngine: Record<string, string | null>
  newestErrorAtByEngine: Record<string, string>
  /** Rows for buildCellViews: active engines and active prompts. */
  cellRows: PerfRow[]
  /** Active-prompt, active-engine cells that have a usable answer. */
  cells: ReturnType<typeof buildSnapshotView>['population']['cells']
  rates: EngineRate[]
  categoryStats: CategoryRate[]
  score: { dimensions: AiVisibilityDimensions; aiScore: number }
  competitorFreq: CompetitorFreqRow[]
  totalChecked: number
  gapCount: number
  prompts: Prompt[]
  resultsKey: string
}

export function buildAiVisibilityData(input: {
  rows: ResultRow[]
  activePrompts: ReadonlyArray<Prompt>
  activeEngines: readonly EngineId[] | readonly string[]
  clientId: number | null
  knownCompetitors?: string[]
}): AiVisibilityData {
  const { rows, activePrompts, activeEngines, clientId, knownCompetitors } = input
  const ids = activePrompts.map(p => p.id)
  const sv = buildSnapshotView(rows, ids, activeEngines)
  const mr = mentionRate(sv.population)
  const cellRows = cellViewRows(rows, ids, activeEngines) as unknown as PerfRow[]
  const health = engineHealth(rows, activeEngines) as Map<string, EngineHealth>

  const competitorFreq: CompetitorFreqRow[] = competitorStats(sv.population, 8, knownCompetitors).map(c => ({
    name: c.name,
    count: c.totalMentions,
    avgPos: c.avgPos,
    rankedMentions: c.rankedMentions,
    proseOnly: c.proseOnly,
  }))

  return {
    results: sv.results,
    errorEngines: sv.errorEngines,
    partialErrorEngines: sv.partialErrorEngines,
    latestChecked: sv.latestChecked,
    engineHealth: health as Map<LLMName, EngineHealth>,
    errorSinceByEngine: engineErrorSinceByEngine(rows),
    newestErrorAtByEngine: newestErrorAtByEngine(rows, activeEngines),
    cellRows,
    cells: sv.population.cells,
    rates: engineRates(sv.population, sv.errorEngines),
    categoryStats: categoryRates(sv.population, activePrompts),
    score: visibilityScore(sv.population, sv.results),
    competitorFreq,
    totalChecked: mr.checked,
    gapCount: mr.checked - mr.mentioned,
    prompts: activePrompts.slice(),
    resultsKey: `${rows.length}:${sv.latestChecked ?? ''}`,
  }
}

// ── CSV (spec 8.2) ──────────────────────────────────────────────────────────

export const AI_VISIBILITY_CSV_HEADER = [
  'Prompt ID', 'Prompt', 'Category', 'Engine', 'Result', 'Brand mentioned', 'Position',
  'Sentiment', 'Competitors named', 'Checked at', 'Last answer at', 'Not answering since',
]

function resultLabel(c: CellView | undefined): string {
  switch (c?.state) {
    case 'mentioned': return 'Mentioned'
    case 'absent': return 'Not mentioned'
    case 'no_answer': return 'No answer'
    case 'error': return 'Error'
    default: return 'Not checked'
  }
}

/**
 * One row per visible prompt (in the order given) times each active engine.
 * `engineLabel` maps an engine id to the label the page prints.
 */
export function buildAiVisibilityCsvRows(input: {
  prompts: ReadonlyArray<Prompt>
  engines: ReadonlyArray<{ id: string; label: string }>
  cellViews: Map<number, Map<string, CellView>>
  /** The snapshot's usable-row map (newest ok row per prompt and engine). */
  results: ReadonlyMap<number, ReadonlyMap<string, { checked_at: string }>>
}): Array<Array<string | number | null>> {
  const out: Array<Array<string | number | null>> = []
  for (const p of input.prompts) {
    const cells = input.cellViews.get(p.id)
    for (const e of input.engines) {
      const c = cells?.get(e.id)
      const state = c?.state
      const cur = c?.current ?? null
      const answered = state === 'mentioned' || state === 'absent'
      const names = answered
        ? parseRankedCompetitors(cur?.competitors_mentioned)
            .filter(x => isLikelyCompanyName(x?.name))
            .map(x => toDisplayName(x.name))
            .join('; ')
        : ''
      // The usable row's own date, for every state (an error or no-answer cell
      // shows when the engine last gave a usable answer).
      const lastAnswer: string | null = input.results.get(p.id)?.get(e.id)?.checked_at ?? null
      out.push([
        p.id,
        p.text,
        p.category ?? '',
        e.label,
        resultLabel(c),
        answered ? (state === 'mentioned' ? 'yes' : 'no') : '',
        state === 'mentioned' ? (c?.position ?? null) : null,
        state === 'mentioned' ? (((cur as { sentiment?: string | null } | null)?.sentiment) ?? '') : '',
        names,
        cur?.checked_at ?? null,
        lastAnswer,
        state === 'error' ? (c?.errorSince ?? null) : null,
      ])
    }
  }
  return out
}
