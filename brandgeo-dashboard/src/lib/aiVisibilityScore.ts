/**
 * aiVisibilityScore.ts
 *
 * Single source of truth for the "AI Visibility Score" and its 6 dimensions
 * (recognition, knowledge, sentiment, accuracy, reach, consistency).
 *
 * Extracted 2026-07-09 (Master-Redesign Phase 3.1) from AIVisibility.tsx's
 * inline computation so Dashboard.tsx's new hero treatment shows the exact
 * same number as the AI Visibility page — no drift between two independently
 * hand-rolled formulas. See CLAUDE.md §7.4 Phase 3.1.
 *
 * Deliberately computed over ALL-time results (no time-range filtering),
 * matching AIVisibility.tsx's existing behavior — this keeps the headline
 * score identical everywhere it's shown, even on pages that otherwise
 * respect the global 7d/30d/90d/All time filter for their other widgets.
 */

export interface ScoreResultRow {
  brand_mentioned: boolean
  brand_position: number | null
  sentiment: string | null
}

/**
 * promptId -> engineId -> result row (one row per prompt+engine pair).
 * Typed as ReadonlyMap so callers with a more specific value type (e.g. the
 * full `AIResult` shape used by AIVisibility.tsx) can pass their existing
 * map straight in without a cast — this function only ever reads from it.
 */
export type ScoreResultMap = ReadonlyMap<number, ReadonlyMap<string, ScoreResultRow>>

export interface AiVisibilityDimensions {
  recognition: number
  knowledge: number
  sentiment: number
  accuracy: number
  reach: number
  consistency: number
}

export function computeAiVisibilityScore(
  promptIds: number[],
  results: ScoreResultMap,
  activeLLMIds: string[],
): { dimensions: AiVisibilityDimensions; aiScore: number } {

  // Recognition — overall mention rate across every prompt x active-engine pair with a result
  let total = 0, mentioned = 0
  promptIds.forEach(pid => {
    activeLLMIds.forEach(llmId => {
      const r = results.get(pid)?.get(llmId)
      if (r) { total++; if (r.brand_mentioned) mentioned++ }
    })
  })
  const recognition = total > 0 ? Math.round((mentioned / total) * 100) : 0

  // Knowledge — average position quality when mentioned (position 1 = 100, decaying to a 20 floor)
  let posSum = 0, posCount = 0
  results.forEach(llmMap => llmMap.forEach(r => {
    if (r.brand_mentioned && r.brand_position) {
      posSum += Math.max(20, 100 - ((r.brand_position - 1) / 4) * 80)
      posCount++
    }
  }))
  const knowledge = posCount > 0 ? Math.round(posSum / posCount) : 0

  // Sentiment — tone when mentioned (positive=1, neutral=0.5, negative=0)
  let sentScore = 0, sentTotal = 0
  results.forEach(llmMap => llmMap.forEach(r => {
    if (r.brand_mentioned) {
      sentTotal++
      if (r.sentiment === 'positive') sentScore += 1
      else if (r.sentiment === 'neutral') sentScore += 0.5
    }
  }))
  const sentiment = sentTotal > 0 ? Math.round((sentScore / sentTotal) * 100) : (knowledge > 0 ? 55 : 0)

  // Accuracy — % of mentions that land in the top 3 (or have no position at all, treated as accurate)
  let topThree = 0, mentionedTotal = 0
  results.forEach(llmMap => llmMap.forEach(r => {
    if (r.brand_mentioned) {
      mentionedTotal++
      if (!r.brand_position || r.brand_position <= 3) topThree++
    }
  }))
  const accuracy = mentionedTotal > 0 ? Math.round((topThree / mentionedTotal) * 100) : 0

  // Reach — % of active engines that mention the brand in at least one prompt
  const enginesWithMention = activeLLMIds.filter(llmId =>
    promptIds.some(pid => results.get(pid)?.get(llmId)?.brand_mentioned)
  ).length
  const reach = activeLLMIds.length > 0 ? Math.round((enginesWithMention / activeLLMIds.length) * 100) : 0

  // Consistency — % of prompts where >=60% of checked active engines mention the brand
  const consistentPrompts = promptIds.filter(pid => {
    const checked = activeLLMIds.filter(llmId => results.get(pid)?.has(llmId)).length
    const mentionedCount = activeLLMIds.filter(llmId => results.get(pid)?.get(llmId)?.brand_mentioned).length
    return checked > 0 && mentionedCount / checked >= 0.6
  }).length
  const consistency = promptIds.length > 0 ? Math.round((consistentPrompts / promptIds.length) * 100) : 0

  const dimensions: AiVisibilityDimensions = { recognition, knowledge, sentiment, accuracy, reach, consistency }

  const aiScore = Math.round(
    dimensions.recognition * 0.25 +
    dimensions.knowledge   * 0.20 +
    dimensions.sentiment   * 0.15 +
    dimensions.accuracy    * 0.15 +
    dimensions.reach       * 0.15 +
    dimensions.consistency * 0.10
  )

  return { dimensions, aiScore }
}

/** Builds the promptId -> engineId -> row Map that computeAiVisibilityScore expects. */
export function buildScoreResultMap(rows: { prompt_id: number; llm: string; brand_mentioned: boolean; brand_position: number | null; sentiment: string | null }[]): ScoreResultMap {
  // Built as a real (mutable) Map internally — ScoreResultMap's ReadonlyMap type has no
  // `.set()`, it's only the return type callers see, so the map used while building this
  // has to stay a plain Map<...> or tsc rejects the `.set()` calls below.
  const map: Map<number, Map<string, ScoreResultRow>> = new Map()
  rows.forEach(r => {
    if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
    const llmMap = map.get(r.prompt_id)!
    if (!llmMap.has(r.llm)) llmMap.set(r.llm, r)
  })
  return map
}
