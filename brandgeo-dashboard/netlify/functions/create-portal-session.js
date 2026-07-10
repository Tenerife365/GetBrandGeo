/**
 * create-portal-session.js
 * Returns a Stripe Billing Portal URL for the logged-in client so they can
 * self-serve manage their subscription (update card, switch plan, cancel).
 * Cancellations/plan-changes made in the portal flow back through
 * stripe-webhook.js's customer.subscription.updated/deleted handlers.
 *
 * Unlike stripe-webhook.js (Stripe-signed, no JWT), this IS a normal
 * dashboard-called function → it uses requireAuth(event) like every other
 * function (§4.6). requireAuth's clientId ownership check ensures a viewer can
 * only open their OWN client's portal; an admin may open any client's.
 *
 * POST body: { client_id: number }   // the active client in the dashboard
 * Requires env: STRIPE_SECRET_KEY (needs Billing Portal Sessions: WRITE scope
 * if a restricted key — Checkout-read-only is NOT enough for this endpoint).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { requireAuth } = require('./_auth')

const APP_URL = 'https://app.getbrandgeo.com'

exports.handler = async (event) => {
  let body = {}
  try { body = event.body ? JSON.parse(event.body) : {} } catch { /* validated after auth */ }

  const clientId = body.client_id ?? null

  // Ownership enforced here: viewers may only pass their own client_id; admins any.
  const auth = await requireAuth(event, { clientId })
  if (auth.response) return auth.response

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: auth.headers, body: 'Method Not Allowed' }
  }

  const targetClientId = clientId ?? auth.profile.client_id
  if (!targetClientId) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'No client associated with this login.' }) }
  }

  const { data: client, error } = await auth.supabase
    .from('clients')
    .select('stripe_customer_id')
    .eq('id', targetClientId)
    .single()

  if (error || !client) {
    return { statusCode: 404, headers: auth.headers, body: JSON.stringify({ error: 'Client not found.' }) }
  }
  if (!client.stripe_customer_id) {
    return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'No active subscription to manage. Managed/Pro/Enterprise plans are billed separately — contact support.' }) }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${APP_URL}/`,
    })
    return { statusCode: 200, headers: auth.headers, body: JSON.stringify({ url: session.url }) }
  } catch (err) {
    console.error('[create-portal-session]', err.message)
    return { statusCode: 502, headers: auth.headers, body: JSON.stringify({ error: 'Could not open the billing portal. Please try again.' }) }
  }
}
