/**
 * signup-client.js — PUBLIC endpoint (no JWT). Self-serve email-path signup.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS DOES NOW (unified provisioning, 2026-07-21)
 *
 *   This endpoint ONLY sends the invite email. It no longer creates a clients or
 *   user_profiles row. Provisioning (create clients + user_profiles as `viewer`,
 *   from the "company vs personal brand" onboarding answer) happens in
 *   provision-account.js, called by the /welcome onboarding screen AFTER the user
 *   authenticates. Both the email path and the social path (Google/LinkedIn)
 *   converge on that single provisioning function, so the "new signup" admin
 *   alert now fires from provision-account.js (when a real brand exists), not
 *   here (which would alert on every abandoned invite).
 *
 *   Consequence: the signup form no longer asks for a brand domain (a personal /
 *   influencer brand does not have one). It asks only for an email. The brand is
 *   captured during onboarding.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 SECURITY
 *   - This endpoint creates NO role and NO clients row, so it cannot mint an
 *     admin (SECURITY-AUDIT.md F1). role is written only by provision-account.js
 *     (always 'viewer') and onboard-client.js (admin-gated).
 *   - Because it no longer inserts a user_profiles row, the 2026-07-17
 *     account-deletion hazard is gone entirely: there is no profile-insert whose
 *     failure could trigger a deleteUser on a pre-existing account. An
 *     already-registered email is simply reported as a 409.
 *   - Abuse hardening (F2): honeypot + per-IP daily cap (salted IP hash, GDPR
 *     minimisation) + disposable-email soft block. The real gate is the mandatory
 *     invite/verification: no inbox, no account.
 *   - inviteUserByEmail (NOT createUser): createUser is SILENT and sends no email.
 *     inviteUserByEmail sends the branded Resend template. The user sets their own
 *     password via the /reset-password link, so no password ever transits this
 *     public endpoint.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * POST body: { email, company_website? (honeypot) }
 */

const { createClient } = require('@supabase/supabase-js')
const { hashIp } = require('./_prospect_guard')
const { isDisposableEmail } = require('./_disposable_domains')

const ALLOWED_ORIGINS = [
  'https://app.getbrandgeo.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

const APP_URL = 'https://app.getbrandgeo.com'
const SIGNUPS_PER_IP_PER_DAY = 3
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
  const fail = (statusCode, error) => ({ statusCode, headers, body: JSON.stringify({ error }) })

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return fail(403, 'Forbidden: origin not allowed')

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return fail(400, 'Invalid request body') }

  const { email, company_website } = body

  // ── Honeypot bot guard ────────────────────────────────────────────────────
  // A hidden field a real user never fills. Return a success-shaped response so a
  // bot doesn't learn it was rejected.
  if (company_website) {
    console.warn('[signup] honeypot triggered — silently dropping request')
    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ success: true, message: 'Check your email for a link to finish setting up your account.' }),
    }
  }

  if (!email) return fail(400, 'Email is required')
  const cleanEmail = String(email).trim().toLowerCase()
  if (!EMAIL_RE.test(cleanEmail)) return fail(400, 'Please enter a valid email address')

  // ── Disposable / throwaway email soft block (SIGNUP-RESEARCH.md §5.2) ──────
  if (isDisposableEmail(cleanEmail)) {
    return fail(400, 'Please use a permanent email address so we can send your results and sign-in link.')
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // ── Per-IP daily cap (F2). IP stored only as a salted hash. ───────────────
  const ipHash = hashIp(event)
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()

  const { count: recentAttempts } = await supabase
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', dayAgo)

  if (recentAttempts !== null && recentAttempts >= SIGNUPS_PER_IP_PER_DAY) {
    console.warn(`[signup] rate limit hit for ip_hash ${ipHash.slice(0, 12)}…`)
    return fail(429, `Too many signup attempts. Max ${SIGNUPS_PER_IP_PER_DAY} per day — please try again tomorrow.`)
  }

  // Record BEFORE the work so failed/retried attempts also count against the cap.
  await supabase.from('signup_attempts').insert({ ip_hash: ipHash })

  // ── Send the invite (the only side effect) ────────────────────────────────
  // Must be inviteUserByEmail, NOT createUser — createUser sends nothing.
  const { error: authError } = await supabase.auth.admin.inviteUserByEmail(
    cleanEmail,
    { redirectTo: `${APP_URL}/reset-password` },
  )

  if (authError) {
    const isDuplicate =
      authError.code === 'email_exists' ||
      /already (registered|exists|invited)/i.test(authError.message || '')
    return fail(
      isDuplicate ? 409 : 400,
      isDuplicate
        ? 'An account with this email already exists. Try logging in, or use "Forgot password" to regain access.'
        : 'Signup failed. Please try again.',
    )
  }

  console.log(`[signup] invite sent: ${cleanEmail}`)
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Check your email for a link to set your password and finish setup.',
    }),
  }
}
