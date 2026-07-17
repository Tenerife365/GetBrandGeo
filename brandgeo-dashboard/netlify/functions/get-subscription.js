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
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const auth = await requireAuth(event)
  if (auth && auth.response) return auth.response

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'Bad JSON' }) }
  const clientId = body.client_id
  if (!clientId) return json(400, { error: 'client_id required' })

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
