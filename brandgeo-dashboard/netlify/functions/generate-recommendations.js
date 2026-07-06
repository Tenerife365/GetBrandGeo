/**
 * generate-recommendations.js
 * Calls Claude with real ai_results data (response_snippets, competitors, engine stats)
 * to produce specific, data-driven recommendations for a client.
 *
 * POST body:
 *   {
 *     client_id,
 *     brand_name,
 *     engine_stats:   { chatgpt: { total, mentioned, rate, avgPos }, ... }
 *     top_competitors: [ { name, totalMentions, byEngine, avgPos } ]
 *     mentioned_snippets:  [ { engine, prompt, snippet } ]   -- where brand WAS mentioned
 *     absent_snippets:     [ { engine, prompt, snippet, topComp } ]  -- where brand was ABSENT
 *     prompts:            [ { text, category } ]
 *   }
 *
 * Returns:
 *   { recommendations: [ { title, insight, action, engines, priority } ] }
 */

const Anthropic = require('@anthropic-ai/sdk')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const {
    brand_name,
    engine_stats       = {},
    top_competitors    = [],
    mentioned_snippets = [],
    absent_snippets    = [],
    prompts            = [],
  } = body

  if (!brand_name) return { statusCode: 400, body: JSON.stringify({ error: 'brand_name required' }) }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) }

  // --- Build prompt -------------------------------------------------------

  const engineLines = Object.entries(engine_stats)
    .filter(([, s]) => s.total > 0)
    .map(([engine, s]) => {
      const pct  = Math.round(s.rate * 100)
      const pos  = s.avgPos ? ` avg position #${s.avgPos}` : ''
      return `  ${engine}: ${pct}% (${s.mentioned}/${s.total} responses)${pos}`
    })
    .join('\n')

  const compLines = top_competitors.slice(0, 5).map((c, i) => {
    const engines = Object.entries(c.byEngine || {})
      .filter(([, n]) => n > 0)
      .map(([e, n]) => `${e}(${n}x)`)
      .join(', ')
    const pos = c.avgPos ? ` avg position #${c.avgPos}` : ''
    return `  ${i + 1}. ${c.name} — ${c.totalMentions} AI mentions${pos}${engines ? ` [${engines}]` : ''}`
  }).join('\n')

  const mentionedLines = mentioned_snippets.slice(0, 4).map(s =>
    `  [${s.engine}] Prompt: "${s.prompt}"\n  Snippet: "${s.snippet}"`
  ).join('\n\n')

  const absentLines = absent_snippets.slice(0, 5).map(s =>
    `  [${s.engine}] Prompt: "${s.prompt}"\n  Top result instead: "${s.topComp ?? 'unknown'}"\n  Snippet: "${s.snippet}"`
  ).join('\n\n')

  const promptLines = prompts.slice(0, 8).map(p => `  - [${p.category ?? 'general'}] "${p.text}"`).join('\n')

  const systemPrompt = `You are an AI visibility consultant with deep expertise in how LLMs source and rank brands.
You analyse real data from AI engine responses and provide specific, evidence-based recommendations.
You cite actual competitor names, actual prompt questions, and actual patterns you observe in the snippets.
You never give generic SEO advice — every insight must reference the data provided.
You respond only with valid JSON.`

  const userPrompt = `Analyse the following real AI visibility data for the brand "${brand_name}" and generate 3 to 5 specific, actionable recommendations.

## Per-engine visibility
${engineLines || '  (no data)'}

## Top competitors appearing instead of ${brand_name}
${compLines || '  (none detected)'}

## Snippets where ${brand_name} WAS mentioned (what worked)
${mentionedLines || '  (none)'}

## Snippets where ${brand_name} was ABSENT (what competitors won)
${absentLines || '  (none)'}

## Prompts tracked
${promptLines || '  (none)'}

---

Instructions:
- Each recommendation MUST reference specific data points: name actual competitors, name specific engines, quote or paraphrase actual prompt text or snippet content.
- Explain WHY the competitor ranks there (what the snippet reveals about their authority, page type, or signal).
- Give a concrete action the brand can take — not "improve your SEO" but "create a Trustpilot profile because ${top_competitors[0]?.name ?? 'your top competitor'} appears in ChatGPT responses immediately after their Trustpilot rating is cited".
- Priority: "critical" = 0% on an engine or competitor has 3x more mentions, "high" = significant gap, "medium" = optimisation opportunity.

Return ONLY this JSON (no markdown, no explanation outside it):
{
  "recommendations": [
    {
      "title": "short title (max 12 words)",
      "insight": "specific observation from the data (2-3 sentences, cite actual names/engines/snippets)",
      "action": "concrete action to take (2-3 sentences)",
      "engines": ["chatgpt", "gemini"],
      "priority": "critical" | "high" | "medium"
    }
  ]
}`

  // --- Call Claude --------------------------------------------------------

  try {
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    console.log('[GenRec] Claude raw output (first 400):', raw.slice(0, 400))

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    let parsed
    try { parsed = JSON.parse(jsonStr) } catch (e) {
      console.error('[GenRec] JSON parse failed:', e.message, '| raw:', jsonStr.slice(0, 200))
      return { statusCode: 200, body: JSON.stringify({ error: 'parse_failed', raw: jsonStr.slice(0, 500) }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    }
  } catch (e) {
    console.error('[GenRec] Claude threw:', e.message)
    return { statusCode: 200, body: JSON.stringify({ error: e.message }) }
  }
}
