/**
 * generate-recommendations.js
 * Calls Claude with real ai_results data (response snippets, competitors, engine stats)
 * to produce specific, evidence-based recommendations for a client — and PERSISTS both
 * the advice and the exact inputs it was derived from.
 *
 * WHY IT PERSISTS (CLIENT-HEALTH-BPR.md §6)
 *   This used to generate on demand, return JSON to the browser, and store nothing.
 *   Managed is EUR 900/mo and the advice IS the deliverable — so there was no record of
 *   what any client was ever told, and "did they act on it, and did it move?" was
 *   structurally unanswerable. Every run now writes:
 *     recommendation_runs  — the receipt: model, timestamp, and input_snapshot (the
 *                            EXACT stats/competitors/snippets the model saw). ai_results
 *                            get re-analysed as the extraction improves, so without the
 *                            snapshot a past recommendation could never be re-explained.
 *     recommendations      — one row per item, with a workflow status the admin can move.
 *   Content columns are frozen by a DB trigger; only status/notes change.
 *   See supabase-recommendations-migration.sql.
 *
 * POST body:
 *   {
 *     client_id,                                  -- REQUIRED (ownership-checked)
 *     brand_name,
 *     engine_stats:        { chatgpt: { total, mentioned, rate, avgPos }, ... }
 *     engines_with_errors: [ { engine, count } ]  -- API failures, NOT visibility failures
 *     top_competitors:     [ { name, totalMentions, rankedMentions, proseOnly, byEngine, avgPos } ]
 *     mentioned_snippets:  [ { engine, prompt, snippet } ]
 *     absent_snippets:     [ { engine, prompt, snippet, topComp } ]
 *     prompts:             [ { text, category } ]
 *   }
 *
 * Returns:
 *   { recommendations: [...], run_id, persisted: bool, persist_error?: string }
 */

const { requireAuth } = require('./_auth')

const MODEL = 'claude-haiku-4-5-20251001'
const VALID_PRIORITIES = ['critical', 'high', 'medium']

exports.handler = async (event) => {
  // requireAuth cannot see the body, so it can't do the client_id ownership check for
  // us. Same pattern as the collect-* functions: authenticate first, then re-check
  // ownership against the parsed body ourselves. This matters more than it used to —
  // we now WRITE rows keyed by client_id, so a viewer must not be able to generate
  // (or store) advice against someone else's tenant.
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  const { headers, supabase, profile, user } = auth

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' }
  }

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers, body: 'Invalid JSON' }
  }

  const {
    client_id,
    brand_name,
    engine_stats        = {},
    engines_with_errors = [],
    top_competitors     = [],
    mentioned_snippets  = [],
    absent_snippets     = [],
    prompts             = [],
  } = body

  if (!brand_name) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'brand_name required' }) }
  }
  if (client_id === undefined || client_id === null || client_id === '') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'client_id required' }) }
  }

  // ── Ownership check ─────────────────────────────────────────────────────────
  if (profile.role !== 'admin' && String(profile.client_id) !== String(client_id)) {
    console.warn(`[GenRec] 403: user ${user.id} (client ${profile.client_id}) tried client ${client_id}`)
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }) }
  }

  // ── Build prompt ────────────────────────────────────────────────────────────

  const engineLines = Object.entries(engine_stats)
    .filter(([, s]) => s && s.total > 0)
    .map(([engine, s]) => {
      const pct = Math.round((s.rate ?? 0) * 100)
      const pos = s.avgPos ? ` avg position #${s.avgPos}` : ''
      return `  ${engine}: ${pct}% (${s.mentioned}/${s.total} responses)${pos}`
    })
    .join('\n')

  // Engines whose only rows are API failures (quota, auth, network). These are OUR
  // outage, not the brand's invisibility. The API-error rows are already excluded from
  // engine_stats upstream; we name them here so the model cannot infer "no data on
  // ChatGPT" as "0% visibility on ChatGPT" and emit a critical recommendation about an
  // unpaid API bill. (BpR had 3 quota_exceeded rows doing exactly this.)
  const errorLines = (engines_with_errors || [])
    .filter(e => e && e.engine)
    .map(e => `  ${e.engine}: ${e.count ?? '?'} API failure(s) — no usable data`)
    .join('\n')

  const compLines = top_competitors.slice(0, 5).map((c, i) => {
    const engines = Object.entries(c.byEngine || {})
      .filter(([, n]) => n > 0)
      .map(([e, n]) => `${e}(${n}x)`)
      .join(', ')
    const pos = c.avgPos ? ` avg rank #${c.avgPos}` : ''
    // The prose-only flag is load-bearing — see the instruction block below.
    const evidence = c.proseOnly
      ? 'PROSE-ONLY: never ranked by any engine; matched only because the client listed them as a competitor themselves'
      : `ranked ${c.rankedMentions}x by engines${pos}`
    return `  ${i + 1}. ${c.name} — ${c.totalMentions} total mentions [${evidence}]${engines ? ` (${engines})` : ''}`
  }).join('\n')

  const mentionedLines = mentioned_snippets.slice(0, 4).map(s =>
    `  [${s.engine}] Prompt: "${s.prompt}"\n  Snippet: "${s.snippet}"`
  ).join('\n\n')

  const absentLines = absent_snippets.slice(0, 5).map(s =>
    `  [${s.engine}] Prompt: "${s.prompt}"\n  Top result instead: "${s.topComp ?? 'unknown'}"\n  Snippet: "${s.snippet}"`
  ).join('\n\n')

  const promptLines = prompts.slice(0, 8)
    .map(p => `  - [${p.category ?? 'general'}] "${p.text}"`)
    .join('\n')

  const systemPrompt = `You are an AI visibility consultant with deep expertise in how LLMs source and rank brands.
You analyse real data from AI engine responses and give specific, evidence-based recommendations.
You cite actual competitor names, actual prompt questions, and actual patterns visible in the snippets you are shown.
You never give generic SEO advice, and you never invent a causal mechanism you cannot see in the data.
Saying "the data does not show why" is a correct and valued answer. A confident guess is not.
You respond only with valid JSON.`

  const userPrompt = `Analyse the following real AI visibility data for the brand "${brand_name}" and generate 3 to 5 specific, actionable recommendations.

## Per-engine visibility (API-failure rows already excluded)
${engineLines || '  (no data)'}

## Engines with no usable data (OUR API failures — not visibility failures)
${errorLines || '  (none)'}

## Competitors appearing alongside or instead of ${brand_name}
${compLines || '  (none detected)'}

## Snippets where ${brand_name} WAS mentioned (what worked)
${mentionedLines || '  (none)'}

## Snippets where ${brand_name} was ABSENT (what competitors won)
${absentLines || '  (none)'}

## Prompts tracked
${promptLines || '  (none)'}

---

Instructions:

1. EVIDENCE. Every recommendation must reference specific data above: name the engine, name
   the competitor, quote or paraphrase actual prompt or snippet text.

2. NEVER FABRICATE A MECHANISM. When you explain WHY a competitor ranks, that explanation
   must be visible in the snippets you were given — e.g. the snippet cites their directory
   listing, quotes their review score, names one of their pages, or repeats a specific claim
   from their site. If the snippets do not reveal why, write exactly that:
   "The current data does not show why they rank here." Then recommend a concrete way to find
   out (e.g. "pull the raw response text for prompt X and read what it cites").
   Do NOT assert a source, a platform, a backlink, a review site, or a citation that does not
   appear in the data above. An invented "because" is worse than no "because" — this advice is
   a paid deliverable and it will be checked.

3. PROSE-ONLY COMPETITORS. A competitor marked PROSE-ONLY was never ranked by any engine. It
   appears only because the client themselves seeded that name into their own competitor list,
   and an engine happened to say the words. Do NOT describe such a name as outranking,
   beating, or being preferred over ${brand_name}. Treat it as background context at most.
   The competitors that matter are the ones engines actually ranked.

4. NO DATA IS NOT A ZERO. An engine listed under "no usable data" has NOT been shown to ignore
   ${brand_name} — we simply failed to collect from it. Never issue a recommendation about that
   engine's visibility. If it is worth mentioning at all, say the data is missing.

5. ACTIONS must be concrete and specific to this brand's situation — a thing to publish, fix,
   claim, or measure — not "improve your SEO". Ground the action in the same evidence as the
   insight.

6. PRIORITY: "critical" = 0% on an engine that DID return data, or a competitor ranked by
   engines far more often than ${brand_name}. "high" = a significant, evidenced gap.
   "medium" = an optimisation opportunity.

Return ONLY this JSON (no markdown, no explanation outside it):
{
  "recommendations": [
    {
      "title": "short title (max 12 words)",
      "insight": "specific observation from the data (2-3 sentences, cite actual names/engines/snippets; say plainly if the data does not explain why)",
      "action": "concrete action to take (2-3 sentences)",
      "engines": ["chatgpt", "gemini"],
      "priority": "critical" | "high" | "medium"
    }
  ]
}`

  // ── Call Claude ─────────────────────────────────────────────────────────────

  // Abort if Anthropic takes too long — we must return JSON before Netlify's 26s kill.
  const ctrl = new AbortController()
  const killTimer = setTimeout(() => ctrl.abort(), 20000)

  let parsed
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })
    clearTimeout(killTimer)

    const msg = await r.json()
    if (msg.error) {
      console.error('[GenRec] Anthropic error:', JSON.stringify(msg.error))
      return { statusCode: 200, headers, body: JSON.stringify({ error: msg.error.message ?? 'anthropic_error' }) }
    }

    const raw = msg.content?.[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    console.log('[GenRec] raw (first 500):', raw.slice(0, 500))

    // Robust JSON extraction: strip code fences, then slice first { .. last }.
    let jsonStr = raw
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/```\s*$/m, '')
      .trim()
    const firstBrace = jsonStr.indexOf('{')
    const lastBrace  = jsonStr.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1)
    }

    try { parsed = JSON.parse(jsonStr) } catch (e) {
      console.error('[GenRec] parse failed:', e.message, '| extracted:', jsonStr.slice(0, 300))
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ error: `JSON parse failed: ${e.message}. Raw starts: ${raw.slice(0, 120)}` }),
      }
    }
  } catch (e) {
    clearTimeout(killTimer)
    const m = e.name === 'AbortError' ? 'Request timed out — try again' : (e.message ?? 'unknown_error')
    console.error('[GenRec] threw:', m)
    return { statusCode: 200, headers, body: JSON.stringify({ error: m }) }
  }

  // ── Normalise ───────────────────────────────────────────────────────────────

  const items = Array.isArray(parsed?.recommendations) ? parsed.recommendations : []
  const clean = items
    .filter(r => r && typeof r.title === 'string' && r.title.trim())
    .map((r, i) => ({
      position: i,
      title:    String(r.title).slice(0, 300),
      insight:  r.insight ? String(r.insight) : null,
      action:   r.action  ? String(r.action)  : null,
      engines:  Array.isArray(r.engines) ? r.engines.map(String) : [],
      priority: VALID_PRIORITIES.includes(r.priority) ? r.priority : 'medium',
    }))

  // ── Persist ─────────────────────────────────────────────────────────────────
  // Best-effort: if the write fails we still return the advice rather than throwing it
  // away, but we tell the caller it was not saved. Silently losing a paid deliverable is
  // worse than showing it unsaved. `supabase` here is the service-key client (bypasses
  // RLS); the freeze trigger still applies, but we only ever INSERT.

  let runId = null
  let persistError = null

  if (clean.length > 0) {
    try {
      const inputSnapshot = {
        brand_name,
        engine_stats,
        engines_with_errors,
        top_competitors,
        mentioned_snippets,
        absent_snippets,
        prompts,
      }

      const { data: run, error: runErr } = await supabase
        .from('recommendation_runs')
        .insert({
          client_id:      client_id,
          generated_by:   user.id,
          model:          MODEL,
          input_snapshot: inputSnapshot,
          rec_count:      clean.length,
        })
        .select('id')
        .single()

      if (runErr) throw runErr
      runId = run.id

      const { error: itemErr } = await supabase
        .from('recommendations')
        .insert(clean.map(r => ({ ...r, run_id: runId, client_id })))

      if (itemErr) {
        // Don't leave an orphan receipt claiming N recs with none stored.
        await supabase.from('recommendation_runs').delete().eq('id', runId)
        runId = null
        throw itemErr
      }

      console.log(`[GenRec] persisted run ${runId} — ${clean.length} recs for client ${client_id}`)
    } catch (e) {
      persistError = e.message ?? 'persist_failed'
      console.error('[GenRec] persist failed:', persistError)
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      recommendations: clean,
      run_id:          runId,
      persisted:       runId !== null,
      ...(persistError ? { persist_error: persistError } : {}),
    }),
  }
}
