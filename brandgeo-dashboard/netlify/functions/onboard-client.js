/**
 * onboard-client.js
 * Creates a new client + Supabase auth user + initial prompts in one call,
 * with manual rollback on any partial failure.
 * Requires SUPABASE_SERVICE_KEY (service role, admin privileges).
 *
 * POST body: {
 *   name, slug, brand_website, brand_aliases, known_competitors,
 *   contact_email, contact_password,
 *   prompts?: string[]   // initial buyer-query prompts to seed for this client
 * }
 *
 * Note (task #73 fix, 2026-07-08): this function now (a) sets an explicit
 * `plan: 'essentials'` default on the new client — previously omitted, so
 * the row fell through to whatever the DB column default happened to be —
 * and returns `plan`/`engines_enabled` so the caller can compute
 * `active_engines` correctly for the initial collection pass, and (b)
 * seeds `prompts` rows if provided, since nothing else in onboarding ever
 * created any and the wizard's own collection step had nothing to collect.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

exports.handler = async (event) => {
  // Auth: only admin users may create clients
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, headers: auth.headers, body: 'Invalid JSON' } }

  const {
    name, slug, brand_website, brand_aliases, known_competitors,
    contact_email, contact_password, prompts,
  } = body

  if (!name || !slug || !contact_email || !contact_password) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields: name, slug, contact_email, contact_password' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // 1. Create client row
  // `plan` explicitly set (was previously omitted, falling through to an
  // undocumented DB column default) — 'essentials' matches the fallback
  // default already used elsewhere in the app (clientContext.tsx) for
  // clients missing plan data, and unlocks chatgpt+gemini+claude out of
  // the box rather than the bare 'free' tier's chatgpt-only.
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({ name, slug, brand_website, brand_aliases, known_competitors, plan: 'essentials' })
    .select()
    .single()

  if (clientErr) {
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: `Client creation failed: ${clientErr.message}` }) }
  }

  // 2. Create Supabase auth user (email confirmed immediately)
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: contact_email,
    password: contact_password,
    email_confirm: true,
  })

  if (authErr) {
    // Rollback client row
    await supabase.from('clients').delete().eq('id', client.id)
    return { statusCode: 500, headers: auth.headers, body: JSON.stringify({ error: `Auth user creation failed: ${authErr.message}` }) }
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
