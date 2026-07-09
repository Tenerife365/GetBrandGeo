/**
 * _score.js
 * CommonJS port of src/lib/aiVisibilityScore.ts's scoring math, for use inside
 * Netlify functions (which run as plain Node/CommonJS and can't import a
 * Vite-bundled .ts module at runtime).
 *
 * Deliberately byte-for-byte the same formula/weights as aiVisibilityScore.ts
 * so an Instant Audit's score means the same thing as a real client's AI
 * Visibility Score on the dashboard — this is the "reuse the existing
 * 6-dimension AI Visibility Score" requirement from SALES-ENGINE.md §2.3.
 * If the weights in aiVisibilityScore.ts ever change, update this file too
 * (same kept-in-sync-by-hand tradeoff as _prospect_engines.js's cost table).
 *
 * Takes a flat array of { prompt_id, engine, brand_mentioned, brand_position,
 * sentiment } rows (audits don't have a real prompts/ai_results DB — prompt_id
 * here is just the generated prompt's array index) instead of reading from
 * Supabase, but the math is identical.
 */

function computeAuditScore(promptIds, resultsByPromptEngine, activeEngines) {
  // Recognition — overall mention rate across every prompt x engine pair with a result
  let total = 0, mentioned = 0
  promptIds.forEach(pid => {
    activeEngines.forEach(engine => {
      const r = resultsByPromptEngine.get(pid)?.get(engine)
      if (r) { total++; if (r.brand_mentioned) mentioned++ }
    })
  })
  const recognition = total > 0 ? Math.round((mentioned / total) * 100) : 0

  // Knowledge — average position quality when mentioned (position 1 = 100, decaying to a 20 floor)
  let posSum = 0, posCount = 0
  resultsByPromptEngine.forEach(engineMap => engineMap.forEach(r => {
    if (r.brand_mentioned && r.brand_position) {
      posSum += Math.max(20, 100 - ((r.brand_position - 1) / 4) * 80)
      posCount++
    }
  }))
  const knowledge = posCount > 0 ? Math.round(posSum / posCount) : 0

  // Sentiment — tone when mentioned (positive=1, neutral=0.5, negative=0)
  let sentScore = 0, sentTotal = 0
  resultsByPromptEngine.forEach(engineMap => engineMap.forEach(r => {
    if (r.brand_mentioned) {
      sentTotal++
      if (r.sentiment === 'positive') sentScore += 1
      else if (r.sentiment === 'neutral') sentScore += 0.5
    }
  }))
  const sentiment = sentTotal > 0 ? Math.round((sentScore / sentTotal) * 100) : (knowledge > 0 ? 55 : 0)

  // Accuracy — % of mentions that land in the top 3 (or have no position, treated as accurate)
  let topThree = 0, mentionedTotal = 0
  resultsByPromptEngine.forEach(engineMap => engineMap.forEach(r => {
    if (r.brand_mentioned) {
      mentionedTotal++
      if (!r.brand_position || r.brand_position <= 3) topThree++
    }
  }))
  const accuracy = mentionedTotal > 0 ? Math.round((topThree / mentionedTotal) * 100) : 0

  // Reach — % of engines that mention the brand in at least one prompt
  const enginesWithMention = activeEngines.filter(engine =>
    promptIds.some(pid => resultsByPromptEngine.get(pid)?.get(engine)?.brand_mentioned)
  ).length
  const reach = activeEngines.length > 0 ? Math.round((enginesWithMention / activeEngines.length) * 100) : 0

  // Consistency — % of prompts where >=60% of checked engines mention the brand
  const consistentPrompts = promptIds.filter(pid => {
    const checked = activeEngines.filter(e => resultsByPromptEngine.get(pid)?.has(e)).length
    const mentionedCount = activeEngines.filter(e => resultsByPromptEngine.get(pid)?.get(e)?.brand_mentioned).length
    return checked > 0 && mentionedCount / checked >= 0.6
  }).length
  const consistency = promptIds.length > 0 ? Math.round((consistentPrompts / promptIds.length) * 100) : 0

  const dimensions = { recognition, knowledge, sentiment, accuracy, reach, consistency }
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

function buildResultMap(rows) {
  const map = new Map()
  rows.forEach(r => {
    if (!map.has(r.prompt_id)) map.set(r.prompt_id, new Map())
    map.get(r.prompt_id).set(r.engine, r)
  })
  return map
}

// Per-engine KNOW / PARTIAL / MISSING state (SALES-ENGINE.md §2.3), using the
// same 60%-of-prompts threshold aiVisibilityScore.ts's "consistency" dimension
// already uses, rather than inventing a new cutoff.
function computeEngineStates(promptIds, resultsByPromptEngine, activeEngines) {
  const states = {}
  for (const engine of activeEngines) {
    const checked = promptIds.filter(pid => resultsByPromptEngine.get(pid)?.has(engine))
    if (checked.length === 0) { states[engine] = 'missing'; continue }
    const mentionedCount = checked.filter(pid => resultsByPromptEngine.get(pid)?.get(engine)?.brand_mentioned).length
    const rate = mentionedCount / checked.length
    states[engine] = rate === 0 ? 'missing' : rate >= 0.6 ? 'know' : 'partial'
  }
  return states
}

// Top-3 gaps + "a competitor was named instead of you" flags, prioritising
// competitor-named misses first (the most compelling/loss-aversion finding)
// then plain not-mentioned engine/prompt pairs.
function computeGapsAndFlags(promptTextById, resultsByPromptEngine) {
  const competitorFlags = []
  const plainGaps = []

  resultsByPromptEngine.forEach((engineMap, pid) => {
    engineMap.forEach((r, engine) => {
      if (r.brand_mentioned) return
      const promptText = promptTextById.get(pid) || ''
      let topCompetitor = null
      if (r.competitors_mentioned) {
        try {
          const parsed = JSON.parse(r.competitors_mentioned)
          if (Array.isArray(parsed) && parsed.length) topCompetitor = parsed[0].name
        } catch { /* ignore malformed JSON */ }
      }
      if (topCompetitor) {
        competitorFlags.push({ engine, prompt: promptText, competitor_name: topCompetitor })
      } else {
        plainGaps.push({ engine, prompt: promptText, issue: 'not_mentioned' })
      }
    })
  })

  const topGaps = [
    ...competitorFlags.map(f => ({ engine: f.engine, prompt: f.prompt, issue: 'competitor_named', competitor_named: f.competitor_name })),
    ...plainGaps,
  ].slice(0, 3)

  return { topGaps, competitorFlags }
}

module.exports = { computeAuditScore, buildResultMap, computeEngineStates, computeGapsAndFlags }
