/**
 * get-subscription.js — returns the Stripe subscription status + renewal date
 * for a client, so the profile page can show "Active · renews on <date>".
 * Read-only, low-sensitivity (status + a date). Requires STRIPE_SECRET_KEY +
 * SUPABASE_SERVICE_KEY (both already set for stripe-webhook.js).
 */
const { requireAuth } = require('./_auth')
const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  // A CORS preflight goes to requireAuth, which answers it (204) before any
  // token check. Everything else must be a POST.
  if (event.httpMethod === 'OPTIONS') {
    const pre = await requireAuth(event)
    return pre.response
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  // The body is parsed BEFORE auth so the target client is known when
  // requireAuth runs. Until 2026-11-08 requireAuth ran with no clientId and
  // the service key then read body.client_id, so any signed-in viewer could
  // read any client's subscription status (IDOR). Passing clientId makes
  // _auth.js answer 403 "Forbidden: client mismatch" to a non-admin whose
  // profile.client_id differs; admins may read any client.
  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'Bad JSON' }) }
  const clientId = body && typeof body === 'object' ? body.client_id : null
  if (!clientId) return json(400, { error: 'client_id required' })

  const auth = await requireAuth(event, { clientId })
  if (auth && auth.response) return auth.response

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { data: client } = await supabase
    .from('clients')
    .select('stripe_subscription_id, plan')
    .eq('id', clientId)
    .single()

  if (!client) return json(404, { error: 'Client not found' })
  if (!client.stripe_subscription_id || !process.env.STRIPE_SECRET_KEY) {
    return json(200, { active: false, plan: client.plan })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sub = await stripe.subscriptions.retrieve(client.stripe_subscription_id)
    return json(200, {
      active: sub.status === 'active' || sub.status === 'trialing',
      status: sub.status,
      current_period_end: sub.current_period_end,     // unix seconds
      cancel_at_period_end: sub.cancel_at_period_end,
      plan: client.plan,
    })
  } catch (e) {
    console.error('[get-subscription]', e && e.message)
    return json(200, { active: false, plan: client.plan })
  }
}

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) }
}
