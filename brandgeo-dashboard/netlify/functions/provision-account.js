/**
 * provision-account.js — the SINGLE server-side provisioning path for a new
 * self-serve account, shared by BOTH the email-invite and social-login (Google/
 * LinkedIn) signup paths (SIGNUP-RESEARCH.md §6). Called by the /welcome
 * onboarding screen after the user has authenticated.
 *
 * Why this exists (unified provisioning, 2026-07-21):
 *   - The email path (signup-client.js) now only sends the invite. It no longer
 *     creates a clients/user_profiles row.
 *   - The social path creates only an auth.users row (Supabase does that on first
 *     OAuth login) and nothing else.
 *   So in BOTH cases a freshly-authenticated user arrives with NO clients row and
 *   NO user_profiles row. This function creates them, keyed to the "company vs
 *   personal brand" answer the onboarding screen collected.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 SECURITY — READ BEFORE EDITING
 *
 *   1. role is ALWAYS 'viewer'. NEVER 'admin'. RLS treats role='admin' as GLOBAL
 *      cross-tenant access (SECURITY-AUDIT.md F1). A self-serve user must never
 *      get it. role='admin' is written ONLY by onboard-client.js (admin-gated).
 *   2. This canNOT use requireAuth() from _auth.js: that helper REQUIRES an
 *      existing user_profiles row and 403s without one — but the whole point here
 *      is that the caller has no profile yet. So we verify the JWT ourselves and
 *      then provision. We still verify a real, authenticated Supabase user.
 *   3. If the caller ALREADY has a profile, we never create a second client and
 *      never change their role — we only update THEIR OWN client's brand fields
 *      (idempotent re-run of onboarding). A crafted request cannot escalate.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * POST body:
 *   { account_type: 'company' | 'personal',
 *     brand_name?: string,        // required for personal; derived from domain for company
 *     brand_website?: string,     // required for company; optional link for personal
 *     brand_aliases?: string[] }  // optional extra names/handles
 */

const { createClient } = require('@supabase/supabase-js')
const { isPlausibleDomain, normalizeDomain } = require('./_prospect_guard')
const { recordAdminEvent } = require('./_admin_notify')
const { refreshCadenceFor, DEFAULT_CLIENT_CATEGORY } = require('./_cost')

const ALLOWED_ORIGINS = [
  'https://app.getbrandgeo.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'brand'
}

function titleCase(input) {
  return String(input).replace(/\b\w/g, (c) => c.toUpperCase())
}

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
  const fail = (statusCode, error) => ({ statusCode, headers, body: JSON.stringify({ error }) })

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return fail(405, 'Method not allowed')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return fail(403, 'Forbidden: origin not allowed')

  // ── Verify the JWT ourselves (see security note 2) ────────────────────────
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return fail(401, 'Unauthorized: missing token')

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !user) return fail(401, 'Unauthorized: invalid or expired token')

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return fail(400, 'Invalid request body') }

  const accountType = body.account_type === 'personal' ? 'personal' : 'company'
  const rawName = String(body.brand_name || '').trim()
  const extraAliases = Array.isArray(body.brand_aliases)
    ? body.brand_aliases.map((a) => String(a).trim()).filter(Boolean).slice(0, 10)
    : []

  // Normalise the brand fields per branch.
  let brandName, brandWebsite, brandAliases
  if (accountType === 'company') {
    const domain = normalizeDomain(body.brand_website || '')
    if (!isPlausibleDomain(domain)) {
      return fail(400, 'Please enter a valid company website (e.g. example.com)')
    }
    const root = domain.split('.')[0]
    brandWebsite = domain
    brandName = rawName || titleCase(root.replace(/-/g, ' '))
    brandAliases = Array.from(new Set([brandName, root, ...extraAliases]))
  } else {
    // personal / influencer brand — the person's public name is the anchor; a
    // website is OPTIONAL (a personal brand often has none). Monitoring runs off
    // brand_aliases against the AI response text (SIGNUP-RESEARCH.md §3.2).
    if (!rawName) return fail(400, 'Please enter your name as it appears publicly')
    const maybeDomain = normalizeDomain(body.brand_website || '')
    brandWebsite = isPlausibleDomain(maybeDomain) ? maybeDomain : ''
    brandName = rawName
    brandAliases = Array.from(new Set([brandName, ...extraAliases]))
  }

  // ── Already provisioned? Idempotent re-run: update own brand only ─────────
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('client_id, role')
    .eq('id', user.id)
    .single()

  if (existingProfile && existingProfile.client_id) {
    // Never create a second client, never touch role. Just refresh the brand
    // fields for the client this user already owns, and mark onboarding done.
    //
    // NO client_events ROW HERE, and that is a decision rather than an omission:
    // this update writes name / brand_website / brand_aliases /
    // onboarding_complete and deliberately does NOT write `plan`. Whatever tier
    // the client is on — including a paid one, if they bought before re-running
    // onboarding — survives untouched. There is no plan change, so there is
    // nothing for the plan audit log to say. If `plan` is ever added to this
    // update, it needs an event exactly like the creation path below.
    const { error: updErr } = await supabase
      .from('clients')
      .update({
        name: brandName,
        brand_website: brandWebsite,
        brand_aliases: brandAliases,
        onboarding_complete: true,
      })
      .eq('id', existingProfile.client_id)

    if (updErr) {
      console.error('[provision] update existing client failed:', updErr.message)
      return fail(500, 'Could not save your brand. Please try again.')
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, client_id: existingProfile.client_id, created: false }),
    }
  }

  // ── First-time provisioning: create clients row, then user_profiles ───────
  const baseSlug = slugify(accountType === 'company' ? brandWebsite.split('.')[0] : brandName)

  // Automatic refresh cadence, derived from the tier at the moment the tier is
  // established (2026-07-31). This row is created with plan 'free' and NO
  // category, so it lands on the column default — DEFAULT_CLIENT_CATEGORY —
  // which is not 'research', so refreshCadenceFor returns free's cadence.
  //
  // last_refresh_at IS STAMPED AT CREATION, and that is a deliberate spend
  // decision rather than bookkeeping. schedule-collections.js's isDue() treats a
  // NULL last_refresh_at as "due now", so without this stamp every newly
  // provisioned client would be collected by the very next hourly cron — on top
  // of the activation collection the app already fires at signup. Stamping it
  // starts the cadence clock at provisioning, so the first AUTOMATIC run lands
  // one full period later, which is both cheaper and what "weekly from when I
  // signed up" actually means.
  const refreshCadence = refreshCadenceFor('free', DEFAULT_CLIENT_CATEGORY)
  const cadenceClockStart = new Date().toISOString()

  let clientRow = null
  let clientErr = null
  for (let attempt = 0; attempt < 5 && !clientRow; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: brandName,
        slug,
        brand_website: brandWebsite,
        brand_aliases: brandAliases,
        plan: 'free',
        refresh_cadence: refreshCadence,
        last_refresh_at: cadenceClockStart,
        default_market_id: 'WW',         // never default to a country (§4.1)
        onboarding_complete: true,
      })
      .select('id, slug')     // slug is for the audit row's meta, nothing else
      .single()
    if (!error) { clientRow = data; break }
    clientErr = error
    if (error.code !== '23505') break     // not a slug collision — real failure
  }

  if (!clientRow) {
    console.error('[provision] client insert failed:', clientErr?.message)
    return fail(500, 'Account setup failed. Please try again.')
  }

  // 🔴 role MUST be 'viewer' — see security note 1.
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({ id: user.id, client_id: clientRow.id, role: 'viewer' })

  if (profileErr) {
    // Roll back the orphaned client so a retry is clean.
    await supabase.from('clients').delete().eq('id', clientRow.id)
    console.error('[provision] user_profiles insert failed:', profileErr.message)
    return fail(500, 'Account setup failed. Please try again.')
  }

  console.log(`[provision] ${accountType} account: user ${user.id} -> client ${clientRow.id} (viewer)`)

  // ── Plan audit ────────────────────────────────────────────────────────────
  // The clients INSERT above writes `plan: 'free'`, which makes this function a
  // plan-writing path, and until 2026-07-31 it recorded nothing. Every account
  // in the product therefore begins with a hole in its own history: the log
  // could not even say when the client started on Free, so a later change had
  // nothing to be a change FROM. See docs/qa/s3-e2e-payment-test-2026-07-31.md.
  //
  // from_plan is null because this is a plan write from NOTHING — the row did
  // not exist a moment ago. type 'signup' (one of the values the migration
  // documents) is what distinguishes creation from a change when reading back.
  //
  // actor is the signing-up user, not null: unlike the Stripe and cron paths,
  // this write has a real authenticated human behind it and naming them costs
  // nothing.
  //
  // Best-effort, and placed AFTER every step that can still roll back — the
  // same placement and the same reasoning as onboard-client.js:206. An account
  // that was created correctly must not be undone because an audit row failed,
  // and an account must never fail to be created because of one. If a rollback
  // above did fire this line is never reached, so no event is written for a
  // client that no longer exists (and client_events cascades on client delete
  // in any case).
  try {
    const { error: evErr } = await supabase.from('client_events').insert({
      client_id: clientRow.id,
      actor:     user.id,
      type:      'signup',
      from_plan: null,
      to_plan:   'free',
      meta: {
        source:        'provision-account',
        account_type:  accountType,
        slug:          clientRow.slug ?? null,
        brand_website: brandWebsite || null,
        email:         user.email || null,
        role:          'viewer',
        refresh_cadence: refreshCadence,
      },
    })
    if (evErr) console.error(`[provision] audit row failed for client ${clientRow.id}: ${evErr.message}`)
  } catch (e) {
    console.error(`[provision] audit row threw for client ${clientRow.id}: ${e.message}`)
  }

  // Notify the admin now that a real, named brand exists (best-effort, never
  // throws). Fires here rather than at invite time so abandoned invites (a user
  // who never completes onboarding) don't generate a false "new signup" alert.
  await recordAdminEvent(supabase, {
    type: 'new_signup',
    client_id: clientRow.id,
    title: `New signup: ${brandName}`,
    body: `${user.email || 'A new user'} set up a free ${accountType === 'personal' ? 'personal brand' : 'company'} account${brandWebsite ? ` (${brandWebsite})` : ''}.`,
    meta: { email: user.email || null, account_type: accountType, brand_website: brandWebsite, plan: 'free' },
  })

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ success: true, client_id: clientRow.id, created: true }),
  }
}
