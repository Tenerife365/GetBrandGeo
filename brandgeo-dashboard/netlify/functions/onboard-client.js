/**
 * onboard-client.js
 * Creates a new client + Supabase auth user + initial prompts in one call,
 * with manual rollback on any partial failure.
 * Requires SUPABASE_SERVICE_KEY (service role, admin privileges).
 *
 * POST body: {
 *   name, slug, brand_website, brand_aliases, known_competitors,
 *   plan?: one of Object.keys(PLAN_LIVE_ENGINES) in _cost.js. Omit it to get
 *          the documented 'essentials' default; an unrecognised value is a
 *          400, never a silent downgrade (see the 2026-07-27 note below),
 *   default_market_id?: string,   // e.g. 'RO', 'WW' — see marketContext.tsx MARKETS
 *   default_region_id?: string,   // e.g. 'B' (Bucharest) — must belong to default_market_id's regions
 *   contact_email,
 *   role?: 'admin'|'viewer',      // access level for the invited user (default 'viewer')
 *   prompts?: string[] | { text, location_keys?: string[] }[]
 *                        // initial buyer-query prompts to seed for this client;
 *                        // location_keys entries are 'primary' or 'MARKET:REGION'
 *   locations?: { market_id, region_ids: string[] }[]   // extra locations (2026-11-13)
 *   allow_over_cap?: boolean      // explicit admin override of the plan's prompt cap
 * }
 * Response adds locations_created (2026-11-13). A location refusal answers
 * 400 { error, code: 'invalid_location' }, an over-cap request 400
 * { error, code: 'prompt_cap_exceeded' }; both happen before anything is
 * created (docs/arch/multi-location-collection.md 5.4).
 *
 * Note (task #73 fix, 2026-07-08): this function sets an explicit `plan`
 * default on the new client (was previously omitted, falling through to an
 * undocumented DB column default), returns `plan`/`engines_enabled` so the
 * caller can compute `active_engines` for the initial collection pass, and
 * seeds `prompts` rows if provided, since nothing else in onboarding ever
 * created any.
 *
 * Update (2026-07-09): the wizard now collects `plan` and `default_market_id`
 * explicitly instead of hardcoding 'essentials' and leaving market unset
 * (the latter previously meant every new client silently defaulted to
 * Romania in marketContext.tsx — see its `loadSaved()`). Also switched from
 * `auth.admin.createUser({ password })` to `auth.admin.inviteUserByEmail()`
 * — the admin no longer sets/relays a password by hand; Supabase emails the
 * client an invite link to `/reset-password` (existing page) to set their
 * own.
 *
 * Update (2026-07-09, onboarding-gaps pass): `role` is now accepted so the
 * wizard can create an admin account, not just viewer (previously
 * hardcoded). Also added friendly error translation for the two most common
 * failure modes — duplicate slug (Postgres unique violation) and an email
 * that's already registered (Supabase Auth) — since the raw driver error
 * messages were unreadable dead ends for the admin filling out the form.
 *
 * Update (2026-07-27, packet 008, plan coercion): `VALID_PLANS` used to be a
 * hand-written array here, a FOURTH copy of the plan ladder, and it was missing
 * both `growth` and `growth_pro`. Worse, the check coerced rather than rejected
 * (`VALID_PLANS.includes(plan) ? plan : 'essentials'`), so a client onboarded on
 * Growth (EUR 299) or Growth PRO (EUR 449), both offered by the wizard, which
 * maps the real PLAN_ORDER, was silently provisioned with Essentials (EUR 99)
 * entitlements, with no error surfaced to anyone. The list is now derived from
 * _cost.js (the mirror that ENFORCES entitlement and budget), and an
 * unrecognised plan is a 400. A `client_events` audit row is also written on
 * success, so the plan a client was provisioned with is recoverable from the
 * database. Previously provisioning left no trail at all, which is why the
 * clients affected by this defect cannot be found retroactively in Supabase.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { PLAN_LIVE_ENGINES, refreshCadenceFor, DEFAULT_CLIENT_CATEGORY } = require('./_cost')
const { provisionAdminWizardClient } = require('./_provision_client')

// Derive the accepted ladder from _cost.js, never by hand. _cost.js is the
// current server-side mirror of planConfig.ts and is the copy that enforces
// entitlement and spend, so a plan this file accepts is exactly a plan the
// product can actually serve. promotions-admin.js and _auth.js:28 derive their
// plan lists the same way, and for the same reason.
const VALID_PLANS = new Set(Object.keys(PLAN_LIVE_ENGINES))
const DEFAULT_PLAN = 'essentials'
const VALID_ROLES = ['admin', 'viewer']

exports.handler = async (event) => {
  // Auth: only admin users may create clients
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid body' }) }
  }

  const {
    name, slug, brand_website, brand_aliases, known_competitors,
    plan, default_market_id, default_region_id, contact_email, role, prompts,
    locations, allow_over_cap,
  } = body

  if (!name || !slug || !contact_email) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields: name, slug, contact_email' }) }
  }

  // A plan that was SUPPLIED must be one we actually sell. Reject it, never
  // coerce. Coercion here is fail-open against revenue: it under-provisions a
  // paying client and tells nobody. An omitted `plan` is a different case and
  // keeps the documented default; it is an unset optional field, not a
  // mis-typed tier.
  const planProvided = plan !== undefined && plan !== null && plan !== ''
  if (planProvided && !VALID_PLANS.has(plan)) {
    return {
      statusCode: 400,
      headers: auth.headers,
      body: JSON.stringify({
        error: `Unknown plan "${plan}". Must be one of: ${[...VALID_PLANS].join(', ')}.`,
      }),
    }
  }
  const clientPlan = planProvided ? plan : DEFAULT_PLAN

  // `role` deliberately keeps coercing: defaulting to 'viewer' is fail-SAFE
  // (least privilege), the opposite of defaulting a plan down to Essentials.
  const userRole = VALID_ROLES.includes(role) ? role : 'viewer'

  // Automatic refresh cadence, derived from the tier at the moment the tier is
  // established (2026-07-31), so it can never drift from the plan. This INSERT
  // names no category, so the row lands on the column default
  // (DEFAULT_CLIENT_CATEGORY), which is not 'research'.
  //
  // THE CITY-RESEARCH CASE, because this is the wizard those studies are created
  // with. A research client made here is 'active' until an admin flips it with
  // set-client-category, so for a short window it holds a paid cadence. Two
  // things close that: last_refresh_at is stamped below, so the first automatic
  // run is a full period away rather than within the hour, and
  // schedule-collections.js refuses category 'research' outright at the point of
  // spend, whatever the column says. Flip the category any time inside the first
  // week and nothing is ever collected.
  //
  // last_refresh_at IS STAMPED AT CREATION deliberately: isDue() in
  // schedule-collections.js treats NULL as "due now", so an unstamped new client
  // is collected by the next hourly cron on top of the wizard's own initial
  // collection run. Stamping starts the cadence clock at provisioning.
  //
  // The write itself now lives in _provision_client.js (2026-11-11, the Explee
  // lead import shares it); this line keeps the derivation visible here and is
  // the fallback value of refresh_cadence in the response below.
  const refreshCadence = refreshCadenceFor(clientPlan, DEFAULT_CLIENT_CATEGORY)

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Steps 1 to 5 (client row, invite to /reset-password, user_profiles row,
  // prompts, client_events audit row last and non-fatal), with the rollback
  // of earlier steps on a later failure, run in _provision_client.js, in the
  // same order and with the same writes as before.
  //
  // One deliberate behaviour change (Rule U, docs/arch/explee-lead-import.md
  // D8): an address that already has an auth user (confirmed, pending, or
  // without a profile) is answered with the existing "already has an account"
  // 409 BEFORE anything is created, instead of being re-invited, and a user
  // that existed before this call is never bound to the new client or deleted
  // by a rollback. Revision 4 (V1): the helper checks the logins a second
  // time immediately before the invite (Check B), so an address that
  // registered during this call also gets that 409, with the client row
  // rolled back, at any stage (wizardError maps email_registered by code).
  const result = await provisionAdminWizardClient(supabase, {
    name, slug, brand_website, brand_aliases, known_competitors,
    plan: clientPlan,
    default_market_id, default_region_id,
    contact_email,
    prompts,
    locations,
    allow_over_cap: allow_over_cap === true,
    role: userRole,
  }, {
    actor: auth.user.id,
    source: 'onboard-client',
    meta: { plan_provided: planProvided },   // false = the DEFAULT_PLAN default was applied
    now: () => new Date(),
  })

  if (!result.ok) {
    const { statusCode, error, code } = wizardError(result, { slug, contact_email })
    if (statusCode >= 500) console.error(`[OnboardClient] provisioning failed at ${result.stage} (${result.code}): ${result.message}`)
    return { statusCode, headers: auth.headers, body: JSON.stringify(code ? { error, code } : { error }) }
  }

  const client = result.client
  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({
      client_id:       client.id,
      client_name:     client.name,
      user_id:         result.userId,
      plan:            client.plan,
      role:            userRole,
      refresh_cadence: client.refresh_cadence ?? refreshCadence,
      engines_enabled: client.engines_enabled ?? null,
      prompts_created: result.promptsCreated,
      locations_created: result.locationsCreated || 0,
      audit_logged:    result.auditLogged,
    }),
  }
}

/**
 * Maps a failed ProvisionResult onto the status codes and texts this endpoint
 * has always answered with. A rollback_failed result keeps the answer of the
 * step that failed (the old code ignored rollback errors).
 */
function wizardError(result, { slug, contact_email }) {
  const msg = result.message
  if (result.code === 'email_registered') {
    return { statusCode: 409, error: `${contact_email} already has an account. Use a different email, or have them use "Forgot password" on the login screen to regain access.` }
  }
  if (result.code === 'slug_taken') {
    return { statusCode: 409, error: `A client with the slug "${slug}" already exists. Choose a different slug and try again.` }
  }
  if (result.code === 'auth_lookup_incomplete') {
    return { statusCode: 500, error: 'Client creation failed: the existing logins could not be checked. Try again in a minute.' }
  }
  // 2026-11-13, both refused before anything is created.
  if (result.code === 'invalid_location') {
    return { statusCode: 400, code: 'invalid_location', error: `A location is not valid: ${msg}` }
  }
  if (result.code === 'prompt_cap_exceeded') {
    return { statusCode: 400, code: 'prompt_cap_exceeded', error: `Too many prompts for this plan: ${msg}. Each location of a question uses one prompt.` }
  }
  switch (result.stage) {
    case 'validate':  return { statusCode: 500, error: 'Client creation failed: the prompt cap could not be checked. Try again in a minute.' }
    case 'locations': return { statusCode: 500, error: 'Location setup failed. Nothing was kept; try again.' }
    case 'client':  return { statusCode: 409, error: `Client creation failed: ${msg}` }
    case 'invite':  return { statusCode: 409, error: `Invite email failed: ${msg}` }
    case 'profile': return { statusCode: 500, error: `Profile creation failed: ${msg}` }
    case 'prompts': return { statusCode: 500, error: `Prompt seeding failed: ${msg}` }
    default:        return { statusCode: 500, error: `Client creation failed: ${msg}` }
  }
}

exports.wizardError = wizardError
