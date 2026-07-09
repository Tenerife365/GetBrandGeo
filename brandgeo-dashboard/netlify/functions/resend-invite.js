/**
 * resend-invite.js
 * Re-sends a Supabase Auth invite email for a client contact who missed,
 * lost, or let their original invite link expire (invite links expire in
 * 24 hours — see the "Invite user" email template's expiry copy).
 * Admin-only. Requires SUPABASE_SERVICE_KEY.
 *
 * POST body: { email: string }
 *
 * Behavior notes:
 * - If the user hasn't accepted their invite yet (still unconfirmed),
 *   calling inviteUserByEmail again simply issues a fresh token and email —
 *   this is the common case right after onboarding when the first email
 *   was missed or landed in spam.
 * - If the user has ALREADY accepted the invite and set a password,
 *   inviteUserByEmail will error (Supabase won't re-invite a confirmed
 *   user). In that case we return a friendly message pointing at the
 *   existing "Forgot password" flow on the login screen instead of a raw
 *   driver error.
 *
 * Added 2026-07-09 (onboarding-gaps pass) — previously the only way to
 * resend a missed invite was to trigger it manually from the Supabase
 * Dashboard.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const APP_URL = 'https://app.getbrandgeo.com'

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const { email } = body
  if (!email) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required field: email' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${APP_URL}/reset-password` },
  )

  if (inviteErr) {
    const alreadyConfirmed = /already.*regist|already.*exist|already.*confirm/i.test(inviteErr.message)
    const friendly = alreadyConfirmed
      ? `${email} has already accepted their invite and set a password. To help them regain access, use "Forgot password" on the login screen instead.`
      : `Resend failed: ${inviteErr.message}`
    return { statusCode: 409, headers: auth.headers, body: JSON.stringify({ error: friendly }) }
  }

  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({ ok: true, email }),
  }
}
