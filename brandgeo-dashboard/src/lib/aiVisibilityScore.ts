/**
 * aiVisibilityScore.ts
 *
 * Single source of truth for the "AI Visibility Score" and its 6 dimensions
 * (recognition, knowledge, sentiment, accuracy, reach, consistency).
 *
 * Extracted 2026-07-09 (Master-Redesign Phase 3.1) from AIVisibility.tsx's
 * inline computation so Dashboard.tsx's hero shows the exact same number as the
 * AI Visibility page.
 *
 * FIXED 2026-07-10 (CLIENT-HEALTH-BPR.md §4.6). Phase 3.1 claimed extracting
 * this function *guaranteed* both pages show the same score. It did not — the
 * FUNCTION was shared but the INPUTS were not, so Overview and AI Visibility
 * really did disagree (~78 vs ~80 for BpR). Three input-level holes, all now
 * closed inside this module rather than assumed at each call site:
 *
 *   1. `status = 'error'` rows (e.g. BpR's quota_exceeded ChatGPT rows) were
 *      being counted as genuine "not mentioned" results by Overview, dragging
 *      recognition/reach down. AIVisibility.tsx already excluded them. Violates
 *      CLAUDE.md §4.8. buildScoreResultMap now drops them unconditionally.
 *   2. buildScoreResultMap was first-wins over whatever order the caller's query
 *      happened to return. Overview's query had no ORDER BY at all — and
 *      Postgres guarantees no ordering without one — so the headline score
 *      depended on undefined row order. It is now explicitly NEWEST-wins,
 *      decided here from `checked_at`, not from the caller's ORDER BY.
 *   3. computeAiVisibilityScore's knowledge/sentiment/accuracy dimensions used
 *      to iterate the ENTIRE map, while recognition/reach/consistency iterated
 *      only promptIds x activeLLMIds. So any row for an inactive prompt or a
 *      non-active engine leaked into 3 of the 6 dimensions. All six now iterate
 *      the same population, which also makes the score independent of whatever
 *      extra rows a caller's map happens to carry — the real enforcement of the
 *      Phase 3.1 guarantee.
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

/** Raw row shape buildScoreResultMap accepts (a superset of ScoreResultRow). */
export interface ScoreInputRow extends ScoreResultRow {
  prompt_id: number
  llm: string
  /** Used for newest-wins de-duplication. Absent (demo data) => falls back to first-wins. */
  checked_at?: string | null
  /** 'error' rows are API failures, never real "not mentioned" results (CLAUDE.md §4.8). */
  status?: string | null
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

  // The single population every dimension is computed over: one row per
  // (active prompt x active engine) pair that actually has a result. Fixing
  // this in one place is what makes the score independent of any extra rows a
  // caller's map may contain (see hole 3 in the header comment).
  const scoped: ScoreResultRow[] = []
  promptIds.forEach(pid => {
    activeLLMIds.forEach(llmId => {
      const r = results.get(pid)?.get(llmId)
      if (r) scoped.push(r)
    })
  })

  // Recognition — overall mention rate across every prompt x active-engine pair with a result
  const total     = scoped.length
  const mentioned = scoped.filter(r => r.brand_mentioned).length
  const recognition = total > 0 ? Math.round((mentioned / total) * 100) : 0

  // Knowledge — average position quality when mentioned (position 1 = 100, decaying to a 20 floor)
  let posSum = 0, posCount = 0
  scoped.forEach(r => {
    if (r.brand_mentioned && r.brand_position) {
      posSum += Math.max(20, 100 - ((r.brand_position - 1) / 4) * 80)
      posCount++
    }
  })
  const knowledge = posCount > 0 ? Math.round(posSum / posCount) : 0

  // Sentiment — tone when mentioned (positive=1, neutral=0.5, negative=0)
  let sentScore = 0, sentTotal = 0
  scoped.forEach(r => {
    if (r.brand_mentioned) {
      sentTotal++
      if (r.sentiment === 'positive') sentScore += 1
      else if (r.sentiment === 'neutral') sentScore += 0.5
    }
  })
  const sentiment = sentTotal > 0 ? Math.round((sentScore / sentTotal) * 100) : (knowledge > 0 ? 55 : 0)

  // Accuracy — % of mentions that land in the top 3 (or have no position at all, treated as accurate)
  let topThree = 0, mentionedTotal = 0
  scoped.forEach(r => {
    if (r.brand_mentioned) {
      mentionedTotal++
      if (!r.brand_position || r.brand_position <= 3) topThree++
    }
  })
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

/**
 * Builds the promptId -> engineId -> row Map that computeAiVisibilityScore expects.
 *
 * Guarantees, enforced HERE so no call site has to remember them:
 *  - `status = 'error'` rows are dropped (API failures are not real results).
 *  - Exactly one row survives per (prompt, engine): the NEWEST by `checked_at`.
 *    Does not rely on the caller's ORDER BY — Postgres gives no ordering without
 *    one, which is precisely how Overview's score drifted from AI Visibility's.
 *  - Optionally restricted to `activeEngineIds` (a client's plan-gated engines),
 *    so rows for engines the client isn't paying for never reach the score.
 */
export function buildScoreResultMap(
  rows: ScoreInputRow[],
  activeEngineIds?: string[],
): ScoreResultMap {
  const allowed = activeEngineIds ? new Set(activeEngineIds) : null

  // Built as real (mutable) Maps internally — ScoreResultMap is a ReadonlyMap,
  // which has no `.set()`; it's only the type callers see on the way out.
  const map: Map<number, Map<string, ScoreResultRow>> = new Map()
  const bestAt: Map<number, Map<string, string>> = new Map()

  rows.forEach(r => {
    if (r.status === 'error') return                    // never a real "not mentioned"
    if (allowed && !allowed.has(r.llm)) return          // engine not on this client's plan

    if (!map.has(r.prompt_id)) {
      map.set(r.prompt_id, new Map())
      bestAt.set(r.prompt_id, new Map())
    }
    const llmMap = map.get(r.prompt_id)!
    const atMap  = bestAt.get(r.prompt_id)!

    // ISO-8601 timestamps compare correctly as strings. Missing checked_at
    // (demo/mock data) degrades to first-wins, which is fine there.
    const thisAt = r.checked_at ?? ''
    const prevAt = atMap.get(r.llm)

    if (!llmMap.has(r.llm) || thisAt > (prevAt ?? '')) {
      llmMap.set(r.llm, r)
      atMap.set(r.llm, thisAt)
    }
  })

  return map
}
