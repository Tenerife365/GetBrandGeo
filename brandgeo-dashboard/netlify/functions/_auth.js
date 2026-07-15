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
 *
 * Rate/cost limiting for collection calls is NOT part of requireAuth() itself
 * (see checkCollectionLimits() below) — see SCALE-SPEC.md §2 and the comment
 * above that function for why it moved out of the universal auth gate.
 */

const { createClient } = require('@supabase/supabase-js')
const { PLAN_LIVE_ENGINE_COUNT, PLAN_MONTHLY_API_BUDGET_EUR } = require('./_cost')

const ALLOWED_ORIGINS = [
  'https://app.getbrandgeo.com',
  'http://localhost:5173',   // Vite dev
  'http://localhost:3000',
]

const HOURLY_CEILING_FLOOR = 150  // never go below this even for a 1-prompt free client
const VALID_PLANS = Object.keys(PLAN_LIVE_ENGINE_COUNT)

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

  return { user, profile, supabase, headers: corsHeaders(origin) }
}

// ── Collection rate/cost limiting (SCALE-SPEC.md §2) ────────────────────────────
//
// Replaces the old flat "150 ai_results rows/hr/client" check that used to sit
// inside requireAuth() step 6 above. That check was doing two unrelated jobs
// badly (SCALE-SPEC.md §2's own framing) — cost control and abuse control — with
// a real scoping bug on top: none of the 3 collect-*.js functions ever pass
// `clientId` into requireAuth(), so `clientId ?? profile.client_id` silently
// rate-limited the CALLING USER's own client, not the client the collection was
// actually being run for. For an admin running collection on behalf of a
// different client (the common path today — Constantin runs Force Refresh for
// research/managed clients from his own admin account), the ceiling was being
// checked against the wrong account entirely, and a Growth-tier client's real
// 150-prompt plan would still 429 around prompt 30 regardless, since the old
// limit was a flat number with no notion of plan size.
//
// Deliberately NOT folded back into requireAuth() as an unconditional step:
// requireAuth() is shared by 6+ non-collection endpoints (onboard-client,
// resend-invite, create-portal-session, generate-recommendations,
// suggest-prompts) that never write ai_results rows and have no business being
// budget-gated by a client's collection spend. checkCollectionLimits() is
// instead called explicitly by the 3 collect-*.js functions, AFTER they've
// parsed the request body and confirmed (via their existing manual ownership
// check) which client_id the call is really for — so the checks below are keyed
// to the correct target client, not whoever happens to be authenticated.
//
// Three checks, in cheapest-first order so an already-blocked client doesn't
// pay for two extra queries after the first one already says no:
//   1. Plan-derived hourly ceiling — abuse circuit-breaker only, sized so it
//      never blocks legitimate use: max(150, activePrompts × liveEngineCount).
//   2. Per-client monthly EUR budget — the real cost control, summing
//      ai_results.cost_eur since the start of the current calendar month
//      against PLAN_MONTHLY_API_BUDGET_EUR[plan] (see _cost.js for the
//      derivation of those numbers).
//   3. Platform-wide monthly EUR ceiling — the last line of defence, summing
//      cost_eur across ALL clients for the month against
//      process.env.PLATFORM_MONTHLY_API_BUDGET_EUR (mirrors
//      _prospect_guard.js's existing checkMonthlyBudget()/GLOBAL_HOURLY_LIMIT
//      pattern for the Instant Audit Engine — same shape, applied here to the
//      paying-client collection path, which never had an equivalent).

const PLATFORM_MONTHLY_API_BUDGET_EUR = Number(process.env.PLATFORM_MONTHLY_API_BUDGET_EUR || 12000)

function monthStartIso() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * checkCollectionLimits(supabase, clientId) -> Promise<{ blocked, reason?, message?, detail? }>
 *
 * clientId: the CONFIRMED target client for this collection call (from the
 * request body, after the caller's own ownership check has already passed —
 * this function does not re-verify ownership, only spend/volume).
 */
async function checkCollectionLimits(supabase, clientId) {
  if (!clientId) return { blocked: false }

  const { data: client } = await supabase
    .from('clients')
    .select('plan')
    .eq('id', clientId)
    .single()

  // Same fallback convention already established in clientContext.tsx (#104)
  // for a client with missing/unrecognized plan data.
  const plan = client && VALID_PLANS.includes(client.plan) ? client.plan : 'essentials'

  // ── 1. Plan-derived hourly ceiling (abuse circuit-breaker) ──
  const { count: activePromptCount } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_active', true)

  const hourlyCeiling = Math.max(
    HOURLY_CEILING_FLOOR,
    (activePromptCount || 0) * PLAN_LIVE_ENGINE_COUNT[plan],
  )

  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: hourlyCount } = await supabase
    .from('ai_results')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('checked_at', hourAgo)

  if (hourlyCount !== null && hourlyCount >= hourlyCeiling) {
    console.warn(`[Auth] Hourly ceiling hit: client ${clientId} (${plan}) has ${hourlyCount} rows in last hour, ceiling ${hourlyCeiling}`)
    return {
      blocked: true,
      reason: 'hourly_ceiling',
      message: `Rate limit exceeded: max ${hourlyCeiling} LLM calls/hour for this plan. Try again later.`,
    }
  }

  // ── 2. Per-client monthly EUR budget ──
  const monthStart = monthStartIso()
  const { data: clientRows } = await supabase
    .from('ai_results')
    .select('cost_eur')
    .eq('client_id', clientId)
    .gte('checked_at', monthStart)

  const clientSpent = (clientRows || []).reduce((sum, r) => sum + (r.cost_eur || 0), 0)
  const clientBudget = PLAN_MONTHLY_API_BUDGET_EUR[plan]

  if (clientSpent >= clientBudget) {
    console.warn(`[Auth] Monthly budget hit: client ${clientId} (${plan}) spent EUR ${clientSpent.toFixed(4)} of EUR ${clientBudget}`)
    return {
      blocked: true,
      reason: 'monthly_budget',
      message: `Monthly API budget exceeded for this plan (EUR ${clientSpent.toFixed(2)} of EUR ${clientBudget.toFixed(2)}). Contact support to raise this limit.`,
    }
  }

  // ── 3. Platform-wide monthly EUR ceiling ──
  const { data: platformRows } = await supabase
    .from('ai_results')
    .select('cost_eur')
    .gte('checked_at', monthStart)

  const platformSpent = (platformRows || []).reduce((sum, r) => sum + (r.cost_eur || 0), 0)

  if (platformSpent >= PLATFORM_MONTHLY_API_BUDGET_EUR) {
    console.error(`[Auth] PLATFORM-WIDE monthly budget hit: EUR ${platformSpent.toFixed(2)} of EUR ${PLATFORM_MONTHLY_API_BUDGET_EUR} — blocking client ${clientId}`)
    return {
      blocked: true,
      reason: 'platform_budget',
      message: 'Collection is temporarily paused platform-wide (monthly API budget reached). Try again later.',
    }
  }

  return { blocked: false, detail: { plan, hourlyCeiling, hourlyCount: hourlyCount || 0, clientSpent, clientBudget, platformSpent } }
}

module.exports = { requireAuth, corsHeaders, ALLOWED_ORIGINS, checkCollectionLimits }
