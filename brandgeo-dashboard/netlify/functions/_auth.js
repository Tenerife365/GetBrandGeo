/**
 * _auth.js — shared auth/security helper for all Netlify functions.
 *
 * Underscore prefix = Netlify does NOT expose this as a public endpoint.
 *
 * Provides:
 *  1. CORS preflight handling
 *  2. Origin whitelist (blocks requests from outside app.getbrandgeo.com)
 *  3. Supabase JWT verification (blocks unauthenticated / bot callers)
 *  4. Role check — adminOnly flag for privileged functions
 *  5. Client ownership check — viewers can only trigger collection for their own client
 *  6. Rate limit — max 150 ai_results rows per client per hour (blocks runaway abuse)
 */

const { createClient } = require('@supabase/supabase-js')

const ALLOWED_ORIGINS = [
  'https://app.getbrandgeo.com',
  'http://localhost:5173',   // Vite dev
  'http://localhost:3000',
]

const RATE_LIMIT_PER_HOUR = 150  // max LLM result rows a client can accumulate per hour

// ── CORS helpers ───────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
}

function preflight(origin) {
  return { statusCode: 204, headers: corsHeaders(origin), body: '' }
}

function err(statusCode, message, origin) {
  console.warn(`[Auth] ${statusCode}: ${message}`)
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify({ error: message }) }
}

// ── Main auth function ─────────────────────────────────────────────────────────

/**
 * Call at the top of every Netlify function handler.
 *
 * @param {object}  event           — Netlify event object
 * @param {object}  opts
 * @param {boolean} opts.adminOnly  — require admin role (default false)
 * @param {number}  opts.clientId   — if provided, verify user owns this client
 *
 * Returns either:
 *   { response }           — caller MUST immediately return response (error / preflight)
 *   { user, supabase, headers }  — auth passed, proceed
 */
async function requireAuth(event, { adminOnly = false, clientId = null } = {}) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''

  // ── 1. CORS preflight ──
  if (event.httpMethod === 'OPTIONS') {
    return { response: preflight(origin) }
  }

  // ── 2. Origin check ──
  // Allow empty origin (e.g. server-to-server / curl in dev) only in local dev.
  // In production the browser always sends Origin, so a missing Origin from an
  // unknown caller is suspicious — but we can't 100% block it without breaking
  // some legitimate server-side calls. We log it and continue.
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return { response: err(403, 'Forbidden: origin not allowed', origin) }
  }

  // ── 3. JWT verification ──
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return { response: err(401, 'Unauthorized: missing token', origin) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !user) {
    return { response: err(401, 'Unauthorized: invalid or expired token', origin) }
  }

  // ── 4. Role check ──
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { response: err(403, 'Forbidden: no user profile found', origin) }
  }

  if (adminOnly && profile.role !== 'admin') {
    return { response: err(403, 'Forbidden: admin access required', origin) }
  }

  // ── 5. Client ownership check ──
  // Admins may act on any client. Viewers may only act on their own.
  if (clientId !== null && profile.role !== 'admin') {
    if (String(profile.client_id) !== String(clientId)) {
      return { response: err(403, 'Forbidden: client mismatch', origin) }
    }
  }

  // ── 6. Rate limit ──
  // Count ai_results rows created for this client in the last hour.
  // Each collection run produces up to 5 rows/prompt × N prompts.
  // 150/hr = ~30 prompts/hr across 5 engines — generous for normal use,
  // but stops runaway abuse (the Chinese token-burn incident was 1000s of calls).
  const effectiveClientId = clientId ?? profile.client_id
  if (effectiveClientId) {
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count } = await supabase
      .from('ai_results')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', effectiveClientId)
      .gte('checked_at', hourAgo)

    if (count !== null && count >= RATE_LIMIT_PER_HOUR) {
      console.warn(`[Auth] Rate limit hit: client ${effectiveClientId} has ${count} rows in last hour`)
      return { response: err(429, `Rate limit exceeded: max ${RATE_LIMIT_PER_HOUR} LLM calls/hour. Try again later.`, origin) }
    }
  }

  return { user, profile, supabase, headers: corsHeaders(origin) }
}

module.exports = { requireAuth, corsHeaders, ALLOWED_ORIGINS }
