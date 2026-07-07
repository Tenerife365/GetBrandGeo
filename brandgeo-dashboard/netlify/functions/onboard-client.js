/**
 * onboard-client.js
 * Creates a new client + Supabase auth user in one atomic call.
 * Requires SUPABASE_SERVICE_KEY (service role, admin privileges).
 *
 * POST body: {
 *   name, slug, brand_website, brand_aliases, known_competitors,
 *   contact_email, contact_password
 * }
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
    contact_email, contact_password,
  } = body

  if (!name || !slug || !contact_email || !contact_password) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Missing required fields: name, slug, contact_email, contact_password' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // 1. Create client row
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({ name, slug, brand_website, brand_aliases, known_competitors })
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

  return {
    statusCode: 200,
    headers: auth.headers,
    body: JSON.stringify({
      client_id:   client.id,
      client_name: client.name,
      user_id:     authData.user.id,
    }),
  }
}
