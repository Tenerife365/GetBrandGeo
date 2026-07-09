/**
 * audit-domain.js
 * Public entrypoint for the Instant Audit Engine (SALES-ENGINE.md §2,
 * CLAUDE.md §10 Component A). Creates a prospect audit for an arbitrary
 * domain and either:
 *   - runs it to completion synchronously (SCREENING depth — fast/cheap
 *     enough to fit Netlify's 26s function limit, see the engine choice
 *     rationale in _prospect_engines.js), or
 *   - kicks off run-full-audit-background.js and returns immediately
 *     (FULL depth — 5 engines x 6 prompts can't fit in 26s).
 *
 * POST body: { domain: string, depth?: 'screening'|'full', email?: string, honeypot?: string }
 * Headers:   X-Internal-Key (optional — Prospect Radar / internal callers,
 *            see the internal-endpoint contract note at the bottom of this file)
 *
 * PUBLIC (non-internal) callers are always forced to 'screening' depth,
 * regardless of what they request — SALES-ENGINE.md §5: "the full audit
 * only for prospects the human greenlights or inbound leads who convert",
 * never a raw anonymous visitor. Only internal callers may request 'full'.
 */

const { createClient } = require('@supabase/supabase-js')
const { analyseResponse } = require('./_analysis')
const {
  buildAuditContext, withTimeout, ALL_CALLERS, SCREENING_ENGINES, FULL_ENGINES, estimateAuditCost,
} = require('./_prospect_engines')
const { generateAuditPrompts } = require('./_prospect_prompts')
const { computeAuditScore, buildResultMap, computeEngineStates, computeGapsAndFlags } = require('./_score')
const {
  guardPublicRequest, checkMonthlyBudget, checkGlobalHourlyLimit, generateToken, isPlausibleDomain, normalizeDomain, isInternalCaller,
} = require('./_prospect_guard')

const SCREENING_PROMPT_COUNT = 4   // within SALES-ENGINE.md §5's "3-5 prompts" screening spec
const FAST_TIMEOUT = 22000         // per-call budget inside the synchronous screening path

exports.handler = async (event) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { body = {} }

  const guard = await guardPublicRequest(event, supabase, { honeypotField: body.honeypot || '' })
  if (guard.response) return guard.response
  const { origin, headers, ipHash, internal } = guard

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' }
  }

  if (!isPlausibleDomain(normalizeDomain(body.domain || ''))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Please enter a valid domain, e.g. example.com' }) }
  }
  const domain = normalizeDomain(body.domain)

  const budget = await checkMonthlyBudget(supabase)
  if (!budget.withinBudget) {
    console.warn(`[Audit] monthly budget reached: €${budget.spent}/€${budget.budget}`)
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Instant audits are temporarily paused for this month — please check back soon, or contact us directly.' }) }
  }

  // Global hourly circuit breaker (same spirit as _auth.js's 150-row/hr
  // per-client limit) — catches a fast burst the monthly budget check alone
  // wouldn't stop in time. Internal callers (Radar, site widget backend) are
  // exempt — they're expected to run controlled batches, not anonymous spikes.
  if (!internal) {
    const hourly = await checkGlobalHourlyLimit(supabase)
    if (!hourly.withinLimit) {
      console.warn(`[Audit] global hourly limit reached: ${hourly.count}/${hourly.limit}`)
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Instant audits are experiencing high demand right now — please try again in a few minutes.' }) }
    }
  }

  const depth = internal && body.depth === 'full' ? 'full' : 'screening'
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()
  console.log(`[Audit/${invId}] domain:${domain} depth:${depth} internal:${internal}`)

  // ── 1. Generate prompts (one LLM call, ~2-5s) ──────────────────────────────
  const generated = await generateAuditPrompts(domain)
  const promptsAll = generated.prompts.map((text, id) => ({ id, text }))
  const engines = depth === 'screening' ? SCREENING_ENGINES : FULL_ENGINES
  const promptsToRun = depth === 'screening' ? promptsAll.slice(0, SCREENING_PROMPT_COUNT) : promptsAll
  const estimatedCost = estimateAuditCost(engines, promptsToRun.length)

  const token = generateToken()
  const nowIso = new Date().toISOString()
  const baseRow = {
    token, domain,
    category: generated.category,
    depth,
    status: depth === 'screening' ? 'collecting' : 'generating_prompts',
    created_via: internal ? 'internal' : 'public',
    low_confidence: generated.lowConfidence,
    unlocked: internal || !!body.email,
    email: body.email || null,
    email_captured_at: body.email ? nowIso : null,
    generated_prompts: promptsAll,
    engines_used: engines,
    estimated_cost_eur: estimatedCost,
    requester_ip_hash: ipHash,
    created_at: nowIso,
    updated_at: nowIso,
  }

  const { data: inserted, error: insErr } = await supabase
    .from('prospect_audits').insert([baseRow]).select('id, token').single()
  if (insErr || !inserted) {
    console.error(`[Audit/${invId}] insert failed:`, insErr?.message)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not start audit. Please try again.' }) }
  }

  // ── 2a. FULL depth — hand off to the background function and return now ───
  if (depth === 'full') {
    try {
      const base = process.env.URL || 'https://app.getbrandgeo.com'
      await withTimeout(
        fetch(`${base}/.netlify/functions/run-full-audit-background`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Self-to-self call — proves to run-full-audit-background.js that
            // this trigger came from audit-domain.js and not an arbitrary
            // public POST to the background function's own URL (Netlify
            // background functions are routable the same as any other
            // function unless the handler itself checks something).
            'X-Internal-Key': process.env.INTERNAL_AUDIT_KEY || '',
          },
          body: JSON.stringify({ audit_id: inserted.id }),
        }),
        5000,
      )
    } catch (e) {
      console.error(`[Audit/${invId}] failed to trigger background run:`, e.message)
      // Row stays 'generating_prompts' — get-audit-report.js surfaces this as
      // still-running rather than erroring, and it can be manually re-triggered.
    }
    return { statusCode: 200, headers, body: JSON.stringify({ token: inserted.token, status: 'collecting' }) }
  }

  // ── 2b. SCREENING depth — run to completion now, synchronously ────────────
  const ctx = buildAuditContext(domain)
  const jobs = []
  for (const p of promptsToRun) {
    for (const engine of engines) {
      jobs.push({ promptId: p.id, promptText: p.text, engine })
    }
  }

  const settled = await Promise.allSettled(
    jobs.map(j => withTimeout(ALL_CALLERS[j.engine](j.promptText, ctx), FAST_TIMEOUT))
  )

  const engineResults = []
  const scoreRows = []
  const promptTextById = new Map(promptsToRun.map(p => [p.id, p.text]))

  for (let i = 0; i < jobs.length; i++) {
    const { promptId, promptText, engine } = jobs[i]
    const result = settled[i]
    if (result.status === 'rejected') {
      console.warn(`[Audit/${invId}] ${engine} timed out for prompt ${promptId}`)
      continue
    }
    const { text, errorCode } = result.value || {}
    if (errorCode || !text) continue

    let analysis
    try {
      // No real client_aliases exist for an audited prospect — synthesize a
      // minimal config from the domain itself, same fallback shape
      // analyseResponse already expects (brand_aliases[] + brand_website).
      analysis = analyseResponse(text, { brand_aliases: [domain.split('.')[0]], brand_website: domain, known_competitors: [] })
    } catch (e) {
      console.error(`[Audit/${invId}] analyseResponse threw:`, e.message)
      continue
    }

    engineResults.push({
      prompt_id: promptId, prompt: promptText, engine,
      brand_mentioned: analysis.brand_mentioned,
      brand_position: analysis.brand_position,
      sentiment: analysis.sentiment,
      competitors_mentioned: analysis.competitors_mentioned,
      snippet: analysis.response_snippet,
    })
    scoreRows.push({ prompt_id: promptId, engine, brand_mentioned: analysis.brand_mentioned, brand_position: analysis.brand_position, sentiment: analysis.sentiment, competitors_mentioned: analysis.competitors_mentioned })
  }

  const resultMap = buildResultMap(scoreRows)
  const promptIds = promptsToRun.map(p => p.id)
  const { dimensions, aiScore } = computeAuditScore(promptIds, resultMap, engines)
  const engineStates = computeEngineStates(promptIds, resultMap, engines)
  const { topGaps, competitorFlags } = computeGapsAndFlags(promptTextById, resultMap)

  const { error: updErr } = await supabase.from('prospect_audits').update({
    status: 'ready',
    ai_score: aiScore,
    dimensions,
    engine_states: engineStates,
    engine_results: engineResults,
    top_gaps: topGaps,
    competitor_flags: competitorFlags,
    updated_at: new Date().toISOString(),
  }).eq('id', inserted.id)

  if (updErr) console.error(`[Audit/${invId}] update failed:`, updErr.message)

  console.log(`[Audit/${invId}] ready | score:${aiScore} | engines:${engines.join(',')} | cost:€${estimatedCost}`)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      token: inserted.token,
      status: 'ready',
      teaser: { domain, ai_score: aiScore, category: generated.category },
    }),
  }
}

/**
 * ── Internal endpoint contract, for Master-Sales-Engine (Prospect Radar) and
 * Master-SiteDesign (site widget) to consume without re-deriving anything ──
 *
 * POST https://app.getbrandgeo.com/.netlify/functions/audit-domain
 * Headers: Content-Type: application/json
 *          X-Internal-Key: <INTERNAL_AUDIT_KEY>   (required for 'full' depth
 *            and to bypass the public per-IP rate limit; omit entirely for
 *            normal public/site-widget calls, which are always 'screening')
 * Body:    { "domain": "example.com", "depth": "screening" | "full" }
 *          (depth is ignored — forced to 'screening' — unless the internal
 *          key is present)
 *
 * Response (screening, synchronous):
 *   200 { "token": "...", "status": "ready", "teaser": { domain, ai_score, category } }
 *   Fetch the full breakdown with GET get-audit-report (below) using the
 *   same token + X-Internal-Key header to skip the email-gate.
 *
 * Response (full, async):
 *   200 { "token": "...", "status": "collecting" }
 *   Poll GET get-audit-report?token=... (with X-Internal-Key) every ~5-10s
 *   until status is "ready" or "error".
 *
 * GET https://app.getbrandgeo.com/.netlify/functions/get-audit-report?token=...
 * Headers: X-Internal-Key: <INTERNAL_AUDIT_KEY>   (returns the FULL report;
 *          omit to get only the free teaser fields, same as a public visitor)
 * Response: see get-audit-report.js's header comment for the exact shape.
 *
 * Errors: 400 invalid domain, 403 origin/internal-key rejected, 429 rate
 * limit or monthly budget reached, 500 internal error. All error bodies are
 * { "error": "<human-readable message>" }.
 */
