/**
 * onboard-client.js
 * Creates a new client + Supabase auth user + initial prompts in one call,
 * with manual rollback on any partial failure.
 * Requires SUPABASE_SERVICE_KEY (service role, admin privileges).
 *
 * POST body: {
 *   name, slug, brand_website, brand_aliases, known_competitors,
 *   plan?: 'free'|'essentials'|'managed'|'pro'|'enterprise',
 *   default_market_id?: string,   // e.g. 'RO', 'WW' — see marketContext.tsx MARKETS
 *   default_region_id?: string,   // e.g. 'B' (Bucharest) — must belong to default_market_id's regions
 *   contact_email,
 *   prompts?: string[]   // initial buyer-query prompts to seed for this client
 * }
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
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const VALID_PLANS = ['free', 'essentials', 'managed', 'pro', 'enterprise']
const APP_URL = 'https://app.getbrandgeo.com'

exports.handler = async (event) => {
  // Auth: only admin users may create clients
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const {
    name, slug, brand_website, brand_aliases, known_competitors,
    plan, default_market_id, default_region_id, contact_email, prompts,
  } = body

  if (!name || !slug || !contact_email) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields: name, slug, contact_email' }) }
  }

  const clientPlan = VALID_PLANS.includes(plan) ? plan : 'essentials'

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // 1. Create client row
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({
      name, slug, brand_website, brand_aliases, known_competitors,
      plan: clientPlan,
      default_market_id: default_market_id || null,
      default_region_id: default_region_id || null,
    })
    .select()
    .single()

  if (clientErr) {
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: `Client creation failed: ${clientErr.message}` }) }
  }

  // 2. Invite the client by email instead of setting a password directly —
  // Supabase sends its "Invite user" template email (same delivery path
  // signup-client.js already relies on for its confirmation email) with a
  // link to /reset-password, where ResetPassword.tsx lets them set their
  // own password. The admin never sees or has to relay a password.
  const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(
    contact_email,
    { redirectTo: `${APP_URL}/reset-password` },
  )

  if (authErr) {
    // Rollback client row
    await supabase.from('clients').delete().eq('id', client.id)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: `Invite email failed: ${authErr.message}` }) }
  }

  // 3. Create user_profiles row linking user → client as viewer
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({ id: authData.user.id, client_id: client.id, role: 'viewer' })

  if (profileErr) {
    // Rollback both
    await supabase.auth.admin.deleteUser(authData.user.id)
    await supabase.from('clients').delete().eq('id', client.id)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: `Profile creation failed: ${profileErr.message}` }) }
  }

  // 4. Seed initial prompts, if any were provided by the wizard.
  // A single .insert() with an array is one INSERT statement — atomic on
  // its own even without an explicit DB transaction wrapping all 4 steps.
  let promptsCreated = 0
  const promptRows = Array.isArray(prompts)
    ? prompts
        .map(t => (typeof t === 'string' ? t : t?.text))
        .filter(t => typeof t === 'string' && t.trim().length > 0)
        .map((text, idx) => ({
          client_id: client.id,
          text: text.trim(),
          category: 'general',
          is_active: true,
          position: idx + 1,
        }))
    : []

  if (promptRows.length > 0) {
    const { error: promptsErr } = await supabase.from('prompts').insert(promptRows)
    if (promptsErr) {
      // Rollback everything created so far
      await supabase.from('user_profiles').delete().eq('id', authData.user.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('clients').delete().eq('id', client.id)
      return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: `Prompt seeding failed: ${promptsErr.message}` }) }
    }
    promptsCreated = promptRows.length
  }

  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({
      client_id:       client.id,
      client_name:     client.name,
      user_id:         authData.user.id,
      plan:            client.plan,
      engines_enabled: client.engines_enabled ?? null,
      prompts_created: promptsCreated,
    }),
  }
}
