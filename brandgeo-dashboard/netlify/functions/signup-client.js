// signup-client.js — public endpoint, no JWT required
// Creates: Supabase auth user + clients row + user_profiles row
// Supabase sends the confirmation email automatically (email_confirm: false)

const { createClient } = require('@supabase/supabase-js')

const ALLOWED_ORIGINS = [
  'https://app.getbrandgeo.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

exports.handler = async (event) => {
  const origin = event.headers.origin || ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  const { email, password, brand_domain } = body

  if (!email || !password || !brand_domain) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'email, password, and brand_domain are required' }),
    }
  }

  if (password.length < 8) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Password must be at least 8 characters' }),
    }
  }

  // Normalise the domain (strip protocol + www + trailing path)
  const cleanDomain = brand_domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]

  // Derive a human-readable company name from the domain
  const company_name = cleanDomain
    .split('.')[0]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  // ── Step 1: Create auth user ──────────────────────────────────────────────
  // email_confirm: false → Supabase sends confirmation email automatically
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: false,
    user_metadata: { brand_domain: cleanDomain },
  })

  if (authError) {
    const isDuplicate =
      authError.message.toLowerCase().includes('already registered') ||
      authError.message.toLowerCase().includes('already exists') ||
      authError.code === 'email_exists'

    return {
      statusCode: isDuplicate ? 409 : 400,
      headers,
      body: JSON.stringify({
        error: isDuplicate
          ? 'An account with this email already exists. Try logging in.'
          : authError.message,
      }),
    }
  }

  const userId = authData.user.id

  // ── Step 2: Create client record ──────────────────────────────────────────
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .insert({
      company_name,
      brand_domain: cleanDomain,
      plan: 'free',
      status: 'active',
    })
    .select('id')
    .single()

  if (clientError) {
    console.error('[signup] client insert failed:', clientError.message)
    await supabase.auth.admin.deleteUser(userId)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Account setup failed. Please try again.' }),
    }
  }

  // ── Step 3: Create user profile ───────────────────────────────────────────
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      client_id: clientData.id,
      role: 'admin',
      email: email.trim().toLowerCase(),
    })

  if (profileError) {
    console.error('[signup] user_profiles insert failed:', profileError.message)
    await supabase.auth.admin.deleteUser(userId)
    await supabase.from('clients').delete().eq('id', clientData.id)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Account setup failed. Please try again.' }),
    }
  }

  console.log(`[signup] New free account: ${email} → client ${clientData.id}`)

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Account created. Check your email to confirm and log in.',
    }),
  }
}
