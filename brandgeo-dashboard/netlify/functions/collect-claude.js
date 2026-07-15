/**
 * collect-claude.js
 * Dedicated HTTP endpoint for Claude-only collection — the manual
 * "Refresh this prompt" path still uses it.
 *
 * Now a THIN WRAPPER over _collect.js (SCALE-SPEC.md §3.3): the Claude caller
 * (training-data mode, wall-clock time budget) + row building live in the shared
 * module so the collection worker runs the exact same code. This file keeps only
 * the HTTP concerns — auth, ownership, rate/budget limits, the non-force
 * monthly-skip check, and the insert.
 *
 * POST body:
 *   { prompt_id, prompt_text, client_id, client_config, force?,
 *     market_label?, region_label? }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth, checkCollectionLimits } = require('./_auth')
const { collectEngines } = require('./_collect')

exports.handler = async (event) => {
  const auth = await requireAuth(event)
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  const invId = Math.random().toString(36).slice(2, 8).toUpperCase()

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' }
  }

  const { prompt_id, prompt_text, client_id, client_config, force, market_label, region_label } = body

  if (!prompt_id || !prompt_text || !client_id || !client_config)
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields' }) }

  // Client ownership check
  if (auth.profile.role !== 'admin' && String(auth.profile.client_id) !== String(client_id)) {
    return { statusCode: 403, headers: auth.headers, body: JSON.stringify({ error: 'Forbidden: client mismatch' }) }
  }

  // SCALE-SPEC.md §2 — see _auth.js's checkCollectionLimits doc comment.
  const limitCheck = await checkCollectionLimits(auth.supabase, client_id)
  if (limitCheck.blocked) {
    return { statusCode: 429, headers: auth.headers, body: JSON.stringify({ error: limitCheck.message, reason: limitCheck.reason }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  console.log(`[Claude/${invId}] user:${auth.user.id} prompt_id:${prompt_id} client_id:${client_id} force:${force}`)

  // For non-force: skip if Claude already has a successful result this month
  if (!force) {
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const { data: existing } = await supabase
      .from('ai_results').select('llm')
      .eq('prompt_id', prompt_id).eq('client_id', client_id).eq('llm', 'claude')
      .neq('status', 'error')
      .gte('checked_at', monthStart.toISOString())
    if (existing?.length > 0) {
      console.log(`[Claude/${invId}] already ran this month — skipping`)
      return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ skipped: true, llm: 'claude' }) }
    }
  }

  // For force: collect-prompt.js has already deleted all rows for this prompt.
  const T0 = Date.now()
  const { rows } = await collectEngines(['claude'], {
    prompt_id, prompt_text, client_id, client_config, market_label, region_label,
  })
  const row = rows[0]
  console.log(`[Claude/${invId}] call finished in ${Date.now() - T0}ms | status:${row.status}${row.status === 'error' ? ' ' + row.error_code : ''}`)

  // #109: always exactly one row — ok OR error, never silence.
  const { error: insErr } = await supabase.from('ai_results').insert([row])
  if (insErr) {
    console.error(`[Claude/${invId}] insert FAILED:`, insErr.message)
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'claude', reason: 'insert_error', detail: insErr.message }) }
  }

  if (row.status === 'error') {
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ done: false, llm: 'claude', reason: row.error_code }) }
  }

  console.log(`[Claude/${invId}] saved | mentioned:${row.brand_mentioned} | position:${row.brand_position} | sentiment:${row.sentiment}`)
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ done: true, llm: 'claude', summary: { brand_mentioned: row.brand_mentioned } }),
  }
}
