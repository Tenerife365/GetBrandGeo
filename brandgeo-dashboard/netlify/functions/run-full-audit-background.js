/**
 * run-full-audit-background.js
 * Netlify Background Function (the `-background` filename suffix is what
 * makes Netlify run this asynchronously for up to 15 minutes instead of the
 * normal 26s function limit — no extra netlify.toml config needed for that
 * part, it's filename-triggered). Does the actual FULL-depth audit work:
 * fan out every generated prompt across all 5 live engines, score, store.
 *
 * Triggered only by audit-domain.js's own fire-and-forget POST to this
 * function's URL right after it creates a 'full' depth prospect_audits row
 * (status starts 'generating_prompts'). Not meant to be called any other way.
 *
 * ASSUMPTION FLAGGED FOR CONSTANTIN: this assumes Netlify Background
 * Functions are available on the current plan/site. If they're not (or
 * behave differently than expected), FULL-depth audits will get stuck in
 * 'generating_prompts'/'collecting' — SCREENING depth (the default for every
 * public/site-widget call) does NOT depend on this at all, it runs
 * synchronously in audit-domain.js. Worth a quick real test (see the
 * CLAUDE.md §10 handoff notes) before relying on FULL depth in production.
 */

const { createClient } = require('@supabase/supabase-js')
const { analyseResponse } = require('./_analysis')
const { classifyCompetitors } = require('./_competitor_filter')
const { buildAuditContext, withTimeout, ALL_CALLERS, FULL_ENGINES } = require('./_prospect_engines')
const { computeAuditScore, buildResultMap, computeEngineStates, computeGapsAndFlags, enginesWithResults } = require('./_score')

const PER_CALL_TIMEOUT = 60000   // generous — background functions aren't racing a 26s wall

function checkInternalKey(event) {
  const configured = process.env.INTERNAL_AUDIT_KEY
  if (!configured) {
    console.warn('[FullAudit] INTERNAL_AUDIT_KEY not set — accepting unauthenticated trigger. Set this env var in Netlify.')
    return true
  }
  const provided = event.headers['x-internal-key'] || event.headers['X-Internal-Key']
  return provided === configured
}

exports.handler = async (event) => {
  if (!checkInternalKey(event)) {
    console.warn('[FullAudit] rejected — bad or missing X-Internal-Key')
    return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  let body
  try { body = JSON.parse(event.body || '{}') } catch { body = {} }
  const auditId = body.audit_id
  if (!auditId) return { statusCode: 400, body: JSON.stringify({ error: 'Missing audit_id' }) }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  const { data: audit, error: fetchErr } = await supabase
    .from('prospect_audits').select('*').eq('id', auditId).single()
  if (fetchErr || !audit) {
    console.error(`[FullAudit/${invId}] could not load audit ${auditId}:`, fetchErr?.message)
    return { statusCode: 404, body: JSON.stringify({ error: 'Audit not found' }) }
  }

  // Idempotency guard — if this audit has already moved past
  // 'generating_prompts', don't reprocess (protects against a retried/duplicate
  // trigger burning API budget twice on the same audit).
  if (audit.status !== 'generating_prompts') {
    console.log(`[FullAudit/${invId}] audit ${auditId} already status=${audit.status} — skipping`)
    return { statusCode: 200, body: JSON.stringify({ skipped: true, status: audit.status }) }
  }

  await supabase.from('prospect_audits').update({ status: 'collecting', updated_at: new Date().toISOString() }).eq('id', auditId)

  try {
    const domain = audit.domain
    // FIX 2026-07-16 (see audit-domain.js's matching comment): brand identity
    // for an anonymous prospect used to be synthesized as [domain.split('.')[0]]
    // ONLY — a single domain-root token, which fails to match a real brand
    // name whenever it diverges from the domain root, producing a false
    // ai_score: 0 even when the brand is genuinely, repeatedly cited.
    // audit-domain.js already extracts+builds the real alias list before
    // triggering this background function; thread it through the trigger
    // body instead of recomputing (would mean a second LLM call + a third
    // copy of the extraction logic). Falls back to [domain-root] alone for
    // any older/direct trigger that doesn't supply it.
    const prospectAliases = Array.isArray(body.brand_aliases) && body.brand_aliases.length > 0
      ? body.brand_aliases
      : [domain.split('.')[0]]
    const brandForFilter = body.brand_name || domain.split('.')[0]
    const ctx = buildAuditContext(domain)
    const engines = Array.isArray(audit.engines_used) && audit.engines_used.length ? audit.engines_used : FULL_ENGINES
    const prompts = Array.isArray(audit.generated_prompts) ? audit.generated_prompts : []

    const jobs = []
    for (const p of prompts) {
      for (const engine of engines) {
        jobs.push({ promptId: p.id, promptText: p.text, engine })
      }
    }

    console.log(`[FullAudit/${invId}] audit:${auditId} domain:${domain} jobs:${jobs.length}`)

    const settled = await Promise.allSettled(
      jobs.map(j => withTimeout(ALL_CALLERS[j.engine](j.promptText, ctx), PER_CALL_TIMEOUT))
    )

    const engineResults = []
    const scoreRows = []
    const promptTextById = new Map(prompts.map(p => [p.id, p.text]))

    for (let i = 0; i < jobs.length; i++) {
      const { promptId, promptText, engine } = jobs[i]
      const result = settled[i]
      if (result.status === 'rejected') {
        console.warn(`[FullAudit/${invId}] ${engine} timed out on prompt ${promptId}`)
        continue
      }
      const { text, errorCode, detail } = result.value || {}
      if (errorCode || !text) {
        // #109: log WHY. Dropped engines are now reported 'unavailable', not
        // 'missing' (see _score.js) — we never claim an engine doesn't know a
        // prospect when the truth is we failed to ask it.
        console.warn(`[FullAudit/${invId}] ${engine} failed on prompt ${promptId}: ${errorCode || 'no text'} ${detail || ''}`)
        continue
      }

      let analysis
      try {
        analysis = analyseResponse(text, { brand_aliases: prospectAliases, brand_website: domain, known_competitors: [] })
      } catch (e) {
        console.error(`[FullAudit/${invId}] analyseResponse threw:`, e.message)
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

    // Semantic competitor gate (Master-Reasoning 2026-07-13). This is the OUTBOUND
    // prospect scorecard, so a false "a competitor was named instead of you" is worse
    // than for a client. engineResults[i] and scoreRows[i] are pushed in lockstep, so
    // they align by index. All calls in parallel; fail-open (see _competitor_filter.js).
    await Promise.all(engineResults.map(async (er, i) => {
      if (!er.competitors_mentioned) return
      let cands; try { cands = JSON.parse(er.competitors_mentioned) } catch { return }
      const kept = await classifyCompetitors(cands, { brand: brandForFilter, snippet: er.snippet })
      const val = kept.length ? JSON.stringify(kept) : null
      er.competitors_mentioned = val
      if (scoreRows[i]) scoreRows[i].competitors_mentioned = val
    }))

    const resultMap = buildResultMap(scoreRows)
    const promptIds = prompts.map(p => p.id)

    // #109: every engine failed → we have zero evidence. Never publish a 0/100
    // scorecard off no data; that would tell a prospect no AI engine knows them
    // when we simply never got an answer. Fail loudly instead.
    const heardFrom = enginesWithResults(promptIds, resultMap, engines)
    if (heardFrom.length === 0) {
      console.error(`[FullAudit/${invId}] every engine failed for ${domain} — refusing to publish a 0/100 scorecard`)
      await supabase.from('prospect_audits').update({
        status: 'error',
        error_message: 'Could not reach the AI engines for this audit. Please try again shortly.',
        updated_at: new Date().toISOString(),
      }).eq('id', auditId)
      return
    }

    const { dimensions, aiScore } = computeAuditScore(promptIds, resultMap, engines)
    const engineStates = computeEngineStates(promptIds, resultMap, engines)
    const { topGaps, competitorFlags } = computeGapsAndFlags(promptTextById, resultMap)

    await supabase.from('prospect_audits').update({
      status: 'ready',
      ai_score: aiScore,
      dimensions,
      engine_states: engineStates,
      engine_results: engineResults,
      top_gaps: topGaps,
      competitor_flags: competitorFlags,
      updated_at: new Date().toISOString(),
    }).eq('id', auditId)

    console.log(`[FullAudit/${invId}] ready | score:${aiScore} | results:${engineResults.length}/${jobs.length}`)
    return { statusCode: 200, body: JSON.stringify({ done: true, audit_id: auditId, ai_score: aiScore }) }
  } catch (e) {
    console.error(`[FullAudit/${invId}] threw:`, e.message)
    await supabase.from('prospect_audits').update({
      status: 'error', error_message: e.message?.slice(0, 500) || 'unknown error',
      updated_at: new Date().toISOString(),
    }).eq('id', auditId)
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
