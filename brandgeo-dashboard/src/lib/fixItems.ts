/**
 * fixItems.ts - the Fix This list, built once for every caller.
 *
 * Pure: no React, no Supabase, no browser globals. The AI Visibility page and
 * the MCP server (netlify/functions/mcp-server.js, bundled by esbuild) both
 * call buildFixResultMap and buildFixItems so the ids, order and copy cannot
 * drift (docs/arch/mcp-stage2-fixes.md section 2 and 9.1). This file was moved
 * out of src/pages/AIVisibility.tsx; behaviour is unchanged.
 */
import type { AIResult, LLMName } from '../types'
import { computeAiVisibilityScore, isNoAnswerRow } from './aiVisibilityScore'
import { aggregateCompetitors } from './competitorFilter'
import {
  AIV_COPY, fixAppearsLine, fixAllMissingLine, fixAllLowLine, fixEngineMissingTitle,
  FIX_COPY, fixPromptGapTitle, fixPromptGapLine,
} from './aiVisibilityCopy'
import {
  fixIds, metricKeys, isOpenState, MAX_PROMPT_GAP_FIXES, type FixStatus,
} from './fixStates'

export interface FixItem {
  id: string
  metricKey: string | null
  priority: 'P0' | 'P1' | 'P2'
  title: string
  description: string
  fix: string
  /** Display name and average rank of the rival, outranked fixes only (feed the copied prompt). */
  competitor?: string
  competitorAvgRank?: number | null
}

export type FixResultMap = Map<number, Map<LLMName, AIResult>>

export interface FixResultMapOutput {
  results: FixResultMap
  /** Engines with error rows and no ok row at all. */
  errorEngines: Set<LLMName>
  /** Engines with at least one error row AND at least one ok row. */
  partialErrorEngines: Set<LLMName>
  /** Newest checked_at among the ok rows kept, or null when there is none. */
  latestChecked: string | null
}

/**
 * Newest ok row per (prompt, engine), active engines only, no-answer rows
 * dropped. Rows are sorted newest first here; the caller's order is not relied
 * on. Rows for inactive prompts stay in the map (the competitor and gap numbers
 * read them).
 */
export function buildFixResultMap(
  rows: AIResult[] | null | undefined,
  activeEngines: readonly string[],
): FixResultMapOutput {
  const map: FixResultMap = new Map()
  const errEngines = new Set<LLMName>()
  const okEngines = new Set<LLMName>()
  let latestChecked: string | null = null
  const sorted = (rows ?? []).slice().sort((a, b) =>
    a.checked_at < b.checked_at ? 1 : a.checked_at > b.checked_at ? -1 : 0)
  sorted.forEach((r: AIResult) => {
    // Only show results for active engines
    if (!activeEngines.includes(r.llm as string)) return
    if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
    const llmMap = map.get(r.prompt_id)!
    const llm = r.llm as LLMName
    // Rows where the engine ran but produced no answer leave both numerator and
    // denominator (isNoAnswerRow in aiVisibilityScore.ts).
    if (isNoAnswerRow(r)) return
    if (!llmMap.has(llm)) {
      if (r.status === 'error') {
        // Track error but exclude from analysis: not a real result
        errEngines.add(llm)
      } else {
        llmMap.set(llm, r)
        okEngines.add(llm)
        if (!latestChecked || r.checked_at > latestChecked) latestChecked = r.checked_at
      }
    }
  })
  return {
    results: map,
    // Engine is "unavailable" only when it has errors AND zero ok results
    errorEngines: new Set([...errEngines].filter(e => !okEngines.has(e))),
    partialErrorEngines: new Set([...errEngines].filter(e => okEngines.has(e))),
    latestChecked,
  }
}

export interface FixItemsInput {
  brandName: string
  engines: { id: string; label: string }[]
  /** Active prompts only. */
  prompts: { id: number; text: string; position: number }[]
  results: FixResultMap
  errorEngines: Set<LLMName>
  stateOf: (fixId: string) => FixStatus | undefined
}

export function buildFixItems(input: FixItemsInput): FixItem[] {
  const { brandName, engines, prompts, results, errorEngines, stateOf } = input

  const llmStats = engines.map(llm => {
    const mentioned = prompts.filter(p => results.get(p.id)?.get(llm.id as LLMName)?.brand_mentioned).length
    const checked   = prompts.filter(p => results.get(p.id)?.has(llm.id as LLMName)).length
    return { ...llm, mentioned, checked, pct: checked > 0 ? Math.round((mentioned / checked) * 100) : 0 }
  })

  const { dimensions } = computeAiVisibilityScore(
    prompts.map(p => p.id),
    results,
    engines.map(l => l.id),
  )
  const overallPct = dimensions.recognition

  const competitorFreq = aggregateCompetitors(
    Array.from(results.values()).flatMap(llmMap => Array.from(llmMap.values())),
    8,
  ).map(c => ({
    name: c.name,
    count: c.totalMentions,
    avgPos: c.avgPos,
    rankedMentions: c.rankedMentions,
    proseOnly: c.proseOnly,
  }))

  const totalChecked = (() => {
    let n = 0
    results.forEach(m => { n += m.size })
    return n
  })()

  const gapCount = totalChecked - (() => {
    let n = 0
    results.forEach(m => { m.forEach(r => { if (r.brand_mentioned) n++ }) })
    return n
  })()

  const engineStatusCards = llmStats.map(s => {
    const isUnavailable = errorEngines.has(s.id as LLMName) && s.checked === 0
    // Zero checks with no error is an absence of data, not a verdict.
    const status: 'KNOW' | 'PARTIAL' | 'MISSING' | 'UNAVAILABLE' | 'NOT_MEASURED' = isUnavailable
      ? 'UNAVAILABLE'
      : s.checked === 0 ? 'NOT_MEASURED'
      : s.pct >= 50 ? 'KNOW' : s.pct >= 25 ? 'PARTIAL' : 'MISSING'
    return { ...s, status, isUnavailable }
  })

  // `id` is the stable fix id (fixStates.ts) a done mark is stored under;
  // `metricKey` is the number the re-check compares, null for a manual fix.
  const items: FixItem[] = []

  // Every active engine MISSING reads as one finding, not one P0 per engine.
  const allMissing = engineStatusCards.length > 0 && engineStatusCards.every(e => e.status === 'MISSING')
  if (allMissing) {
    const totalChecked = engineStatusCards.reduce((a, e) => a + e.checked, 0)
    const totalMentioned = engineStatusCards.reduce((a, e) => a + e.mentioned, 0)
    items.push({
      id: fixIds.visibilityAll(),
      metricKey: metricKeys.all(),
      priority: 'P0',
      title: totalMentioned === 0 ? AIV_COPY.fixAllMissingTitle : AIV_COPY.fixAllLowTitle,
      description: totalMentioned === 0
        ? fixAllMissingLine(brandName, totalChecked, engineStatusCards.length)
        : fixAllLowLine(brandName, totalMentioned, totalChecked, engineStatusCards.length),
      fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications AI engines trust. Ensure your domain has schema.org/Organization structured data with complete fields.`,
    })
  } else {
    engineStatusCards.filter(e => e.status === 'MISSING' && e.checked > 0 && !e.isUnavailable).forEach(e => {
      items.push({
        id: fixIds.engineMissing(e.id),
        metricKey: metricKeys.engine(e.id),
        priority: 'P0',
        title: fixEngineMissingTitle(e.label, e.mentioned),
        description: fixAppearsLine(brandName, e.mentioned, e.checked, e.label),
        fix: `Create a dedicated "${brandName} overview" page answering your most common category queries. Submit it to authoritative directories and request coverage from publications ${e.label} training data trusts. Ensure your domain has schema.org/Organization structured data with complete fields.`,
      })
    })
  }

  engineStatusCards.filter(e => e.status === 'PARTIAL' && e.checked > 0).forEach(e => {
    items.push({
      id: fixIds.engineLow(e.id),
      metricKey: metricKeys.engine(e.id),
      priority: 'P1',
      title: `Low visibility in ${e.label} (${e.pct}%)`,
      description: `Brand appears inconsistently, in ${e.mentioned} of ${e.checked} prompts checked.`,
      fix: `Strengthen brand authority signals for ${e.label}: publish 3+ long-form pages that directly answer your tracked queries, build backlinks from industry media mentioning ${brandName} in context, and add FAQ schema markup to your site's key landing pages.`,
    })
  })

  // "Outranked by" is a claim about RANK, so it requires a rank on both sides.
  const topRanked = competitorFreq.find(c => !c.proseOnly && c.avgPos !== null)
  if (topRanked && gapCount > 0) {
    items.push({
      id: fixIds.outranked(topRanked.name),
      metricKey: metricKeys.competitor(topRanked.name),
      competitor: topRanked.name,
      competitorAvgRank: topRanked.avgPos,
      priority: 'P1',
      title: `Outranked by ${topRanked.name} (avg #${topRanked.avgPos})`,
      description: `${topRanked.name} is ranked by an engine in ${topRanked.rankedMentions} of its ${topRanked.count} appearances, while ${brandName} is absent in ${gapCount} checks.`,
      fix: `Publish a detailed comparison page: "${brandName} vs ${topRanked.name}" covering differentiators, pricing, and use cases. Pitch this page to trade publications and ask clients for case study testimonials published under your domain.`,
    })
  }

  if (dimensions.consistency < 40 && overallPct > 0) {
    items.push({
      id: fixIds.consistency(),
      metricKey: metricKeys.consistency(),
      priority: 'P2',
      title: 'Inconsistent cross-prompt coverage',
      description: `Brand appears in only ${dimensions.consistency}% of prompts with consistent multi-engine coverage. AI models know you selectively.`,
      fix: `Map which prompt topics are missing and create dedicated content for each gap. Ensure every service category and location you serve has a standalone indexed page with your brand name in the H1 and title tag.`,
    })
  }

  if (dimensions.knowledge > 0 && dimensions.knowledge < 50) {
    items.push({
      id: fixIds.ranking(),
      metricKey: metricKeys.knowledge(),
      priority: 'P2',
      title: 'Improve ranking position',
      description: `When mentioned, ${brandName} averages a lower position. Competitors rank above you in shared responses.`,
      fix: `Build topical authority by publishing a content cluster: one pillar page on your main category + 5 supporting posts on subtopics. Internal-link them together. This signals depth of expertise to AI training pipelines.`,
    })
  }

  // Per-prompt gaps: every engine that answered left the brand out. Most
  // contested first, then prompt order; at most MAX_PROMPT_GAP_FIXES open.
  const gaps = prompts.map(p => {
    const cells = Array.from(results.get(p.id)?.values() ?? [])
    const withCompetitor = cells.filter(r => {
      try {
        const arr = JSON.parse(r.competitors_mentioned ?? '[]')
        return Array.isArray(arr) && arr.length > 0
      } catch { return false }
    }).length
    return { p, answers: cells.length, mentioned: cells.some(r => r.brand_mentioned), withCompetitor }
  })
    .filter(g => g.answers > 0 && !g.mentioned && isOpenState(stateOf(fixIds.promptGap(g.p.id))))
    .sort((a, b) => b.withCompetitor - a.withCompetitor || a.p.position - b.p.position)
    .slice(0, MAX_PROMPT_GAP_FIXES)
  gaps.forEach(g => {
    items.push({
      id: fixIds.promptGap(g.p.id),
      metricKey: metricKeys.prompt(g.p.id),
      priority: 'P2',
      title: fixPromptGapTitle(g.p.text),
      description: fixPromptGapLine(brandName, g.answers, g.withCompetitor),
      fix: FIX_COPY.promptGapFix,
    })
  })

  return items
}
