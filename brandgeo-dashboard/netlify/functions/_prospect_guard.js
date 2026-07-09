/**
 * _prospect_guard.js
 * Guardrails shared by the Instant Audit Engine's public functions
 * (SALES-ENGINE.md §5 "guardrails are as important as the tools"):
 * origin/CORS, internal-caller auth, per-IP rate limit, monthly spend
 * ceiling, and domain-format/bot-guard validation.
 *
 * Deliberately separate from _auth.js — that module verifies a real Supabase
 * JWT for the authenticated dashboard app; these functions are public by
 * design (anonymous visitors, the site widget, and headless automation all
 * need to call them without logging in), so the checks here are different in
 * kind, not just a relaxed version of _auth.js.
 */

const crypto = require('crypto')

// getbrandgeo.com/www = the marketing site (future site widget, SALES-ENGINE.md
// §4 Component D). app.getbrandgeo.com = this dashboard's own /audit test UI.
const PUBLIC_ALLOWED_ORIGINS = [
  'https://getbrandgeo.com',
  'https://www.getbrandgeo.com',
  'https://app.getbrandgeo.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

const IP_RATE_LIMIT_PER_DAY = 3   // per-IP cap for public (non-internal) audit requests

function corsHeaders(origin) {
  const allowed = PUBLIC_ALLOWED_ORIGINS.includes(origin) ? origin : PUBLIC_ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Headers': 'Content-Type, X-Internal-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
}

function preflight(origin) {
  return { statusCode: 204, headers: corsHeaders(origin), body: '' }
}

function err(statusCode, message, origin) {
  console.warn(`[ProspectGuard] ${statusCode}: ${message}`)
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify({ error: message }) }
}

/** True if the caller presented the shared internal secret (Radar / site widget backend, not the public browser widget itself). */
function isInternalCaller(event) {
  const key = event.headers['x-internal-key'] || event.headers['X-Internal-Key']
  return !!process.env.INTERNAL_AUDIT_KEY && key === process.env.INTERNAL_AUDIT_KEY
}

/** SHA-256(ip + server-side pepper) — used only to rate-limit, never stored/exposed as a real IP (GDPR minimisation, CLAUDE.md §11/SALES-ENGINE.md §5). */
function hashIp(event) {
  const ip = (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()
  const pepper = process.env.IP_HASH_PEPPER || 'brandgeo-dev-pepper-change-in-prod'
  return crypto.createHash('sha256').update(`${ip}:${pepper}`).digest('hex')
}

/** Basic domain-format validation — rejects obvious junk without needing a real DNS lookup. */
function isPlausibleDomain(input) {
  if (typeof input !== 'string') return false
  const d = input.trim().toLowerCase()
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(d) && d.length <= 253
}

function normalizeDomain(input) {
  return String(input).trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

/**
 * Full guard for the public audit-creation endpoint. Returns either
 * { response } (caller must return it immediately) or { origin, headers, ipHash, internal }.
 * honeypotField: value of a hidden form field that legitimate users/JS never
 * fill in — simple bot-guard without pulling in a CAPTCHA service. If your
 * embed form doesn't have one yet, pass '' (fails open on this one check
 * only — origin + rate-limit + domain-format still apply).
 */
async function guardPublicRequest(event, supabase, { honeypotField = '' } = {}) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''

  if (event.httpMethod === 'OPTIONS') return { response: preflight(origin) }

  const internal = isInternalCaller(event)

  if (!internal && origin && !PUBLIC_ALLOWED_ORIGINS.includes(origin)) {
    return { response: err(403, 'Forbidden: origin not allowed', origin) }
  }

  if (honeypotField) {
    // A hidden field got filled in — almost certainly a bot form-filler.
    // Return a generic-looking success shape rather than an error, so the
    // bot doesn't learn its submission was rejected (standard honeypot practice).
    console.warn('[ProspectGuard] honeypot triggered — silently dropping request')
    return { response: { statusCode: 202, headers: corsHeaders(origin), body: JSON.stringify({ token: null, status: 'pending' }) } }
  }

  const ipHash = hashIp(event)

  if (!internal) {
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
    const { count } = await supabase
      .from('prospect_audits')
      .select('*', { count: 'exact', head: true })
      .eq('requester_ip_hash', ipHash)
      .gte('created_at', dayAgo)
    if (count !== null && count >= IP_RATE_LIMIT_PER_DAY) {
      return { response: err(429, `Rate limit exceeded: max ${IP_RATE_LIMIT_PER_DAY} audits/day. Try again tomorrow.`, origin) }
    }
  }

  return { origin, headers: corsHeaders(origin), ipHash, internal }
}

/**
 * Monthly prospecting-spend ceiling (SALES-ENGINE.md §5). Configurable via
 * PROSPECTING_MONTHLY_BUDGET_EUR env var; defaults to €200/mo per the
 * kickoff spec. Sums estimated_cost_eur across this calendar month rather
 * than maintaining a separate running counter — one source of truth,
 * consistent with how Usage.tsx derives cost from ai_results on the fly
 * instead of a duplicated tally.
 */
async function checkMonthlyBudget(supabase) {
  const budget = Number(process.env.PROSPECTING_MONTHLY_BUDGET_EUR || 200)
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('prospect_audits')
    .select('estimated_cost_eur')
    .gte('created_at', monthStart.toISOString())

  const spent = (data || []).reduce((sum, r) => sum + (r.estimated_cost_eur || 0), 0)
  return { withinBudget: spent < budget, spent: Number(spent.toFixed(4)), budget }
}

/**
 * Global hourly circuit breaker, same spirit as _auth.js's 150-row/hr
 * per-client limit — but scoped globally (there's no client_id for an
 * anonymous prospect). This exists specifically to catch a fast burst (bug,
 * script, coordinated abuse) that the monthly budget check alone would let
 * through for the first several minutes before enough cost has accumulated
 * to trip it. GLOBAL_HOURLY_LIMIT is deliberately generous — it's a circuit
 * breaker for runaway abuse, not the primary cost control (that's the
 * monthly budget + per-IP daily cap above).
 */
const GLOBAL_HOURLY_LIMIT = 100

async function checkGlobalHourlyLimit(supabase) {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await supabase
    .from('prospect_audits')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', hourAgo)
  return { withinLimit: count === null || count < GLOBAL_HOURLY_LIMIT, count: count ?? 0, limit: GLOBAL_HOURLY_LIMIT }
}

function generateToken() {
  return crypto.randomBytes(18).toString('base64url')   // ~24 chars, URL-safe, unguessable
}

module.exports = {
  corsHeaders, preflight, err,
  isInternalCaller, hashIp, isPlausibleDomain, normalizeDomain,
  guardPublicRequest, checkMonthlyBudget, checkGlobalHourlyLimit, generateToken,
  PUBLIC_ALLOWED_ORIGINS, IP_RATE_LIMIT_PER_DAY, GLOBAL_HOURLY_LIMIT,
}
