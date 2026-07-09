/**
 * get-audit-report.js
 * Public read endpoint for an Instant Audit report (SALES-ENGINE.md §2.3/§2.4).
 * GET /.netlify/functions/get-audit-report?token=<token>
 * Header X-Internal-Key (optional) — matching INTERNAL_AUDIT_KEY returns the
 * full report without needing unlocked=true, for Prospect Radar / other
 * internal callers that don't go through the public email-gate.
 *
 * Response shapes:
 *   404 { error }                                       — unknown token
 *   200 { status: 'pending'|'generating_prompts'|'collecting', domain }
 *   200 { status: 'error', domain, error_message }
 *   200 { status: 'ready', unlocked: false, domain, category, ai_score,
 *         low_confidence, gap_count }                    — teaser (no email yet)
 *   200 { status: 'ready', unlocked: true, domain, category, ai_score,
 *         low_confidence, dimensions, engine_states, engine_results,
 *         top_gaps, competitor_flags, depth, engines_used }  — full (unlocked/internal)
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, preflight, err, isInternalCaller } = require('./_prospect_guard')

exports.handler = async (event) => {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  if (event.httpMethod === 'OPTIONS') return preflight(origin)
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: corsHeaders(origin), body: 'Method Not Allowed' }

  const token = event.queryStringParameters?.token
  if (!token) return err(400, 'Missing token', origin)

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: audit, error } = await supabase.from('prospect_audits').select('*').eq('token', token).single()

  if (error || !audit) return err(404, 'Audit not found', origin)

  const headers = corsHeaders(origin)

  if (audit.status !== 'ready') {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ status: audit.status, domain: audit.domain, error_message: audit.status === 'error' ? audit.error_message : undefined }),
    }
  }

  const canSeeFullReport = audit.unlocked || isInternalCaller(event)
  const gapCount = Array.isArray(audit.top_gaps) ? audit.top_gaps.length : 0

  if (!canSeeFullReport) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        status: 'ready',
        unlocked: false,
        domain: audit.domain,
        category: audit.category,
        ai_score: audit.ai_score,
        low_confidence: audit.low_confidence,
        gap_count: gapCount,
      }),
    }
  }

  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      status: 'ready',
      unlocked: true,
      domain: audit.domain,
      category: audit.category,
      ai_score: audit.ai_score,
      low_confidence: audit.low_confidence,
      depth: audit.depth,
      engines_used: audit.engines_used,
      dimensions: audit.dimensions,
      engine_states: audit.engine_states,
      engine_results: audit.engine_results,
      top_gaps: audit.top_gaps,
      competitor_flags: audit.competitor_flags,
    }),
  }
}
