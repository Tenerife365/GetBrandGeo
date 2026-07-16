/**
 * set-client-category.js
 * Admin-only: change a client's switcher grouping category
 * (active | free | test | research | archived).
 *
 * The clients table is service-role-write-only (RLS has SELECT only), and it
 * holds sensitive fields (plan, stripe ids) — so rather than open a broad admin
 * UPDATE policy on it, this function uses the service key to update ONLY the
 * category column, gated behind requireAuth({ adminOnly: true }).
 *
 * POST body: { client_id, category }
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const VALID_CATEGORIES = new Set(['active', 'free', 'test', 'research', 'archived'])

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const { client_id, category } = body
  if (!client_id || !VALID_CATEGORIES.has(category)) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing client_id or invalid category' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { error } = await supabase.from('clients').update({ category }).eq('id', client_id)
  if (error) {
    console.error('[set-client-category] update failed:', error.message)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: error.message }) }
  }

  console.log(`[set-client-category] client ${client_id} -> ${category} (by ${auth.user.id})`)
  return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ ok: true, client_id, category }) }
}
