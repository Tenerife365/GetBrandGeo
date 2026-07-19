/**
 * set-client-billing.js
 * Admin-only: set a client's manual billing dates (subscription_started_at,
 * paid_until) — used for Managed/Pro clients invoiced outside Stripe self-serve,
 * whose dates get-subscription.js can't provide.
 *
 * Same posture as set-client-category.js: the clients table is
 * service-role-write-only (RLS SELECT only) and holds sensitive fields, so this
 * uses the service key to update ONLY these two date columns, gated behind
 * requireAuth({ adminOnly: true }).
 *
 * POST body: { client_id, subscription_started_at?: 'YYYY-MM-DD'|null, paid_until?: 'YYYY-MM-DD'|null }
 * Either date may be provided; only the keys present are updated. Pass null to clear one.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Accept a valid YYYY-MM-DD string or null/empty (to clear); reject anything else. */
function normDate(v) {
  if (v === null || v === undefined || v === '') return { ok: true, value: null }
  if (typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(Date.parse(v))) return { ok: true, value: v }
  return { ok: false }
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const { client_id } = body
  if (!client_id) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing client_id' }) }
  }

  const update = {}
  if ('subscription_started_at' in body) {
    const d = normDate(body.subscription_started_at)
    if (!d.ok) return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'subscription_started_at must be YYYY-MM-DD or null' }) }
    update.subscription_started_at = d.value
  }
  if ('paid_until' in body) {
    const d = normDate(body.paid_until)
    if (!d.ok) return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'paid_until must be YYYY-MM-DD or null' }) }
    update.paid_until = d.value
  }
  if (Object.keys(update).length === 0) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'No billing dates provided' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { error } = await supabase.from('clients').update(update).eq('id', client_id)
  if (error) {
    console.error('[set-client-billing] update failed:', error.message)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: error.message }) }
  }

  console.log(`[set-client-billing] client ${client_id} <- ${JSON.stringify(update)} (by ${auth.user.id})`)
  return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ ok: true, client_id, ...update }) }
}
