/**
 * recommendationsView.ts - pure view model for the Recommendations page
 * (docs/arch/phase2-results-layer-spec.md 10.3).
 *
 * Every number comes from metrics.ts over the shared population P (the newest
 * usable cell per active prompt and active engine). No ai_results read.
 */
import type { SnapshotView, ResultRow } from '../metrics'
import {
  engineRates, categoryRates, competitorStats, averagePosition, mentionRate, engineErrorCells,
  compareNewestFirst,
} from '../metrics'
import type { CompetitorAggregate } from '../competitorFilter'
import type { LLMName } from '../../types'

export interface LLMStat {
  llm: LLMName
  total: number
  mentioned: number
  rate: number
  avgPos: number | null
}

export interface CatStat {
  cat: string
  label: string
  total: number
  mentioned: number
  rate: number
}

export interface RecommendationsStats {
  llmStats: LLMStat[]
  catStats: CatStat[]
  competitors: CompetitorAggregate[]
  avgBrandPos: number | null
  totalChecks: number
  totalMentioned: number
  overallRate: number
  brandName: string
}

export const CATEGORY_LABEL: Record<string, string> = {
  mid: 'Mid (100-200)', large: 'Large (500+)', very_large: 'Very Large (1k+)',
  tool_discovery: 'Tool Discovery', geo_category: 'GEO / AIO', problem_based: 'Problem-based',
  general: 'General', direct_brand: 'Direct Brand',
  large_scale: 'Large Scale', corporate: 'Corporate', wedding: 'Wedding',
  galas: 'Galas & Events', quality: 'Quality & Awards', location: 'Location',
  competitive: 'Competitive', portfolio: 'Portfolio',
}

export function buildRecommendationsStats(
  view: SnapshotView,
  prompts: ReadonlyArray<{ id: number; category?: string | null }>,
  brandName: string,
): RecommendationsStats {
  const p = view.population
  const llmStats: LLMStat[] = engineRates(p, view.errorEngines)
    .filter(r => r.checked > 0)
    .map(r => ({
      llm: r.engine as LLMName,
      total: r.checked,
      mentioned: r.mentioned,
      rate: r.rate ?? 0,
      avgPos: r.avgPosition,
    }))
  const catStats: CatStat[] = categoryRates(p, prompts as never).map(c => ({
    cat: c.category,
    label: CATEGORY_LABEL[c.category] ?? c.category,
    total: c.checked,
    mentioned: c.mentioned,
    rate: c.rate,
  }))
  const mentioned = p.cells.filter(c => c.brand_mentioned)
  const totalChecks = mentionRate(p).checked
  return {
    llmStats,
    catStats,
    competitors: competitorStats(p, 6),
    avgBrandPos: averagePosition(mentioned),
    totalChecks,
    totalMentioned: mentioned.length,
    overallRate: totalChecks > 0 ? mentioned.length / totalChecks : 0,
    brandName,
  }
}

/** Failed prompt checks for engines whose only rows were failures. */
export function buildEngineErrors(
  rows: ReadonlyArray<ResultRow>,
  activeEngines: readonly string[],
): { engine: string; count: number }[] {
  return engineErrorCells(rows, activeEngines)
}

export interface AiSnippets {
  mentioned: { engine: string; prompt: string; snippet: string | null }[]
  absent: { engine: string; prompt: string; snippet: string | null; topComp: string | null }[]
}

/** Snippets for the AI payload, from P sorted newest first. */
export function buildAiSnippets(
  view: SnapshotView,
  prompts: ReadonlyArray<{ id: number; text: string }>,
): AiSnippets {
  const text = new Map(prompts.map(p => [p.id, p.text]))
  const sorted = view.population.cells.slice().sort(compareNewestFirst)
  const mentioned = sorted
    .filter(r => r.brand_mentioned && r.response_snippet)
    .slice(0, 4)
    .map(r => ({ engine: r.llm as string, prompt: text.get(r.prompt_id) ?? '', snippet: r.response_snippet }))
  const absent = sorted
    .filter(r => !r.brand_mentioned && r.response_snippet)
    .slice(0, 5)
    .map(r => {
      let topComp: string | null = null
      try {
        const comps = JSON.parse(r.competitors_mentioned || '[]')
        topComp = comps[0]?.name ?? comps[0] ?? null
      } catch { /* malformed */ }
      return { engine: r.llm as string, prompt: text.get(r.prompt_id) ?? '', snippet: r.response_snippet, topComp }
    })
  return { mentioned, absent }
}
