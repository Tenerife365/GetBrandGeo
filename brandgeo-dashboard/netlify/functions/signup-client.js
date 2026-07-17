/**
 * signup-client.js — PUBLIC endpoint (no JWT). Self-serve Free-tier signup.
 * Creates: clients row → Supabase auth user (sends confirmation email) → user_profiles row.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 SECURITY — READ BEFORE EDITING (SECURITY-AUDIT.md F1, fixed 2026-07-13)
 *
 *   NEVER set `role: 'admin'` here. The RLS policies treat role='admin' as
 *   GLOBAL, CROSS-TENANT access:
 *
 *     ai_results_select → (my_role() = 'admin') OR (client_id = my_client_id())
 *     clients_select    → (my_role() = 'admin') OR (id        = my_client_id())
 *     prompts_select    → (my_role() = 'admin') OR (client_id = my_client_id())
 *
 *   i.e. ANY user with role='admin' can read EVERY client's data. This is a
 *   PUBLIC, unauthenticated endpoint — a stranger who signs up must never get
 *   that. This function previously wrote role:'admin' (an "admin of my own
 *   account" that the RLS read as "admin of the platform"). It was never
 *   exploited only because the function was separately broken (see below) and
 *   never reached that write.
 *
 *   Self-serve accounts are `viewer`, matching stripe-webhook.js (the paid
 *   self-serve path). role='admin' is created ONLY by onboard-client.js, which
 *   is gated behind requireAuth({ adminOnly: true }).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Also fixed 2026-07-13 — this function had NEVER worked. Two inserts referenced
 * columns that do not exist in the live schema:
 *   - clients:       wrote company_name / brand_domain / status
 *                    → real columns are name / slug / brand_website / brand_aliases /
 *                      plan / default_market_id / default_region_id
 *   - user_profiles: wrote an `email` column that does not exist
 *                    → real columns are id / client_id / role / created_at
 * Both are corrected below.
 *
 * Abuse hardening (SECURITY-AUDIT.md F2): this is an unauthenticated endpoint
 * that creates Supabase Auth users and sends email. It now has a honeypot bot
 * guard and a per-IP daily cap, reusing _prospect_guard.js's existing hashIp /
 * domain-validation helpers — the same guard pattern already live on the public
 * audit endpoints, rather than a second, divergent implementation.
 *
 * Ordering matters: we validate everything, then create the clients row, and
 * only THEN send the invite (the step that actually emails the address). The
 * old order (auth-user creation first) meant a request that was going to fail
 * anyway had already hit the address — an email-bomb vector on an endpoint
 * anyone can hit. Rollback unwinds in reverse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 📧 EMAIL — why this uses inviteUserByEmail(), not createUser() (fixed 2026-07-13)
 *
 *   `auth.admin.createUser()` DOES NOT SEND ANY EMAIL. It is a silent admin
 *   operation. The `email_confirm: false` flag only marks the user as
 *   *unconfirmed* — it does NOT trigger a confirmation email. This function
 *   used to call createUser and claimed in a comment that Supabase "sends the
 *   confirmation email automatically". It does not. Proven on live data: the
 *   first real signup produced an auth.users row with confirmation_sent_at =
 *   NULL and no confirmation token at all — the email was never sent, and no
 *   amount of waiting would have produced one.
 *
 *   `inviteUserByEmail()` DOES send (branded template + verified DKIM/SPF/DMARC
 *   via Resend — see CLAUDE.md #106). It is what onboard-client.js and
 *   stripe-webhook.js already use. Signup now uses the same path.
 *
 *   Consequence: the user does NOT choose a password here. They receive the
 *   invite email, click through to /reset-password, and set their own. So this
 *   endpoint never receives or handles a password at all — which is also
 *   strictly better for a public, unauthenticated endpoint.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * POST body: { email, brand_domain, company_website? (honeypot) }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 FIXED 2026-07-17 — this endpoint could DELETE an existing user's account.
 *
 *   Scenario that actually happened in production: an admin invites a real
 *   client (creates their `clients` row + `user_profiles` row + sends a
 *   Supabase invite by hand). The invited person then, confused, uses the
 *   public "Start for free" signup form on the marketing site with the SAME
 *   email instead of clicking the invite link in their inbox.
 *
 *   `inviteUserByEmail()` is IDEMPOTENT for an already-invited-but-unconfirmed
 *   user — it does not error, it just re-sends the invite and returns the
 *   EXISTING user object. Step 3 then tries to INSERT a user_profiles row
 *   with that same `id` — but one already exists (PK conflict, `user_profiles.id`
 *   is the primary key) — so `profileError` fires. The old rollback treated
 *   *any* profileError as "we just created this auth user seconds ago, undo
 *   it" and called `deleteUser(userId)` unconditionally. For this scenario
 *   that user was NOT newly created — it was someone's real, already-working
 *   account — and this deleted it, silently logging them out of an account
 *   that had nothing to do with the free-tier signup they were confused into
 *   attempting.
 *
 *   Fix: a PK-conflict profileError (code 23505) means "this auth user
 *   already has a profile/client elsewhere" — a completely different, much
 *   friendlier case than "our own insert failed for some other reason". In
 *   that case we roll back ONLY the orphaned `clients` row this call just
 *   created (never claimed by anyone) and NEVER touch the auth user. Any
 *   other profileError still gets the full rollback, since in that case this
 *   call really did just create the auth user seconds ago and undoing it is
 *   correct and safe.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { createClient } = require('@supabase/supabase-js')
const { hashIp, isPlausibleDomain, normalizeDomain } = require('./_prospect_guard')

const ALLOWED_ORIGINS = [
  'https://app.getbrandgeo.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

const APP_URL = 'https://app.getbrandgeo.com'
const SIGNUPS_PER_IP_PER_DAY = 3

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'client'
}

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

  // Origin lock — a browser always sends Origin. An unknown one is rejected.
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return fail(403, 'Forbidden: origin not allowed')
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return fail(400, 'Invalid request body')
  }

  const { email, brand_domain, company_website } = body

  // ── Honeypot bot guard ────────────────────────────────────────────────────
  // `company_website` is a hidden field no human/real JS ever fills. If it has
  // a value, it's a form-filling bot. Return a success-shaped response so the
  // bot doesn't learn it was rejected (same convention as _prospect_guard.js).
  if (company_website) {
    console.warn('[signup] honeypot triggered — silently dropping request')
    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ success: true, message: 'Account created. Check your email to confirm and log in.' }),
    }
  }

  // ── Validate BEFORE any write and before any email is sent ────────────────
  if (!email || !brand_domain) {
    return fail(400, 'email and brand_domain are required')
  }

  const cleanEmail = String(email).trim().toLowerCase()
  if (!EMAIL_RE.test(cleanEmail)) return fail(400, 'Please enter a valid email address')

  const cleanDomain = normalizeDomain(brand_domain)
  if (!isPlausibleDomain(cleanDomain)) {
    return fail(400, 'Please enter a valid website domain (e.g. example.com)')
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // ── Per-IP daily cap (SECURITY-AUDIT.md F2) ───────────────────────────────
  // IP is stored only as SHA-256(ip + pepper), never a raw IP (GDPR
  // minimisation — same treatment as the prospect-audit path).
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

  // Record the attempt BEFORE doing the work, so failed/retried attempts also
  // count against the cap (otherwise an attacker just retries failures forever).
  await supabase.from('signup_attempts').insert({ ip_hash: ipHash })

  // ── Step 1: clients row ───────────────────────────────────────────────────
  // Created BEFORE the auth user so a doomed signup never sends an email.
  const companyName = cleanDomain
    .split('.')[0]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const baseSlug = slugify(cleanDomain.split('.')[0])

  let clientData = null
  let clientError = null

  // `clients.slug` is UNIQUE — retry with a suffix on collision rather than
  // dead-ending a legitimate signup whose domain root is already taken.
  for (let attempt = 0; attempt < 5 && !clientData; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: companyName,
        slug,
        brand_website: cleanDomain,
        brand_aliases: [companyName, cleanDomain.split('.')[0]],
        plan: 'free',
        default_market_id: 'WW',   // never default to a specific country (§4.1 / #104)
      })
      .select('id')
      .single()

    if (!error) { clientData = data; break }
    clientError = error
    if (error.code !== '23505') break   // not a slug collision — a real failure
  }

  if (!clientData) {
    console.error('[signup] client insert failed:', clientError?.message)
    return fail(500, 'Account setup failed. Please try again.')
  }

  // ── Step 2: invite the user (THIS is what actually sends the email) ───────
  // 📧 Must be inviteUserByEmail, NOT createUser — see the email header at the
  // top of this file. createUser is silent and sends nothing.
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    cleanEmail,
    {
      redirectTo: `${APP_URL}/reset-password`,
      data: { brand_domain: cleanDomain },
    },
  )

  if (authError) {
    await supabase.from('clients').delete().eq('id', clientData.id)   // rollback

    const isDuplicate =
      authError.code === 'email_exists' ||
      /already (registered|exists|invited)/i.test(authError.message || '')

    return fail(
      isDuplicate ? 409 : 400,
      isDuplicate
        ? 'An account with this email already exists. Try logging in, or use "Forgot password" to regain access.'
        : 'Account setup failed. Please try again.',
    )
  }

  const userId = authData.user.id

  // ── Step 3: user_profiles row ─────────────────────────────────────────────
  // 🔴 role MUST be 'viewer' — see the security header at the top of this file.
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      client_id: clientData.id,
      role: 'viewer',
    })

  if (profileError) {
    console.error('[signup] user_profiles insert failed:', profileError.message)

    // 23505 = unique_violation on user_profiles' PK (id). This means the auth
    // user we just got back from inviteUserByEmail() ALREADY had a profile —
    // i.e. it is a pre-existing account (most likely: someone who was already
    // invited by an admin, hitting this public form with the same email
    // instead of using their invite link). That account is real and must
    // never be deleted here — see the 2026-07-17 header note above.
    const preExistingAccount = profileError.code === '23505'

    if (!preExistingAccount) {
      await supabase.auth.admin.deleteUser(userId)   // safe: this call just created it
    }
    await supabase.from('clients').delete().eq('id', clientData.id)   // always orphaned, always safe to remove

    return fail(
      preExistingAccount ? 409 : 500,
      preExistingAccount
        ? 'An account with this email already exists. Check your email for a sign-in link, or use "Forgot password" on the login page.'
        : 'Account setup failed. Please try again.',
    )
  }

  console.log(`[signup] New free account: ${cleanEmail} → client ${clientData.id} (viewer, invite sent)`)

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Account created. Check your email for a link to set your password and log in.',
    }),
  }
}
