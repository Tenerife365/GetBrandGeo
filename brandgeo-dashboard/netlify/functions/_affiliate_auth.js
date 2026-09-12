/**
 * _affiliate_auth.js -- the two auth gates the affiliate module adds.
 *
 *  requireAffiliate(event)     JWT -> the caller's affiliates row. Deliberately
 *                              NOT _auth.js requireAuth: that gate demands a
 *                              user_profiles row, and an affiliate is not a
 *                              client, so most affiliates have none. Same JWT
 *                              verification (supabase.auth.getUser), same
 *                              origin whitelist, same CORS headers.
 *
 *  requireProgramApiKey(event) Bearer <program api key> -> the program row.
 *                              For external projects posting conversions. The
 *                              key is compared by SHA-256 hash; the plaintext
 *                              exists only in the admin's one-time reveal.
 *
 * Admin endpoints keep using _auth.js requireAuth({ adminOnly: true }).
 */

const { createClient } = require('@supabase/supabase-js')
const { corsHeaders, ALLOWED_ORIGINS } = require('./_auth')
const { hashApiKey } = require('./_affiliate_core')

function jsonResponse(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) }
}

function serviceClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

function bearer(event) {
  const h = event.headers['authorization'] || event.headers['Authorization'] || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

/**
 * Returns { response } to return immediately, or
 * { user, affiliate, supabase, headers } on success. `affiliate` is null when
 * the signed-in user has no affiliate row yet (the join page handles that).
 */
async function requireAffiliate(event, { allowMissing = false, client = null } = {}) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  const headers = corsHeaders(origin)
  if (event.httpMethod === 'OPTIONS') return { response: { statusCode: 204, headers, body: '' } }
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return { response: jsonResponse(403, { error: 'Forbidden: origin not allowed' }, headers) }

  const token = bearer(event)
  if (!token) return { response: jsonResponse(401, { error: 'Unauthorized: missing token' }, headers) }

  const supabase = client || serviceClient()
  const { data: { user } = {}, error } = await supabase.auth.getUser(token)
  if (error || !user) return { response: jsonResponse(401, { error: 'Unauthorized: invalid or expired token' }, headers) }

  const { data: affiliate } = await supabase.from('affiliates').select('*').eq('user_id', user.id).maybeSingle()
  if (!affiliate && !allowMissing) return { response: jsonResponse(403, { error: 'No affiliate account is linked to this login' }, headers) }
  if (affiliate && affiliate.status === 'suspended') return { response: jsonResponse(403, { error: 'This affiliate account is suspended. Contact support.' }, headers) }
  if (affiliate && affiliate.status === 'rejected') return { response: jsonResponse(403, { error: 'This affiliate account is not active.' }, headers) }

  return { user, affiliate: affiliate || null, supabase, headers }
}

/**
 * Returns { response } or { program, supabase }. No CORS: this is a
 * server-to-server endpoint. A missing or wrong key is 401 with a fixed body.
 */
async function requireProgramApiKey(event, { client = null } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' }
  const key = bearer(event) || event.headers['x-api-key'] || event.headers['X-Api-Key'] || ''
  if (!key || !/^bgaff_[a-z0-9]+_[a-f0-9]{48}$/.test(key)) return { response: jsonResponse(401, { error: 'unauthorized' }, headers) }

  const supabase = client || serviceClient()
  const { data, error } = await supabase.from('affiliate_programs').select('*').eq('api_key_hash', hashApiKey(key)).maybeSingle()
  if (error || !data) return { response: jsonResponse(401, { error: 'unauthorized' }, headers) }
  return { program: data, supabase, headers }
}

module.exports = { requireAffiliate, requireProgramApiKey, serviceClient, bearer, jsonResponse }
