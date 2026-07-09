/**
 * stripe-webhook.js
 * Stripe → Supabase self-serve auto-provisioning webhook.
 * Built per STRIPE-WEBHOOK-SPEC.md (CLAUDE.md §10, Master-DashboardDesign).
 *
 * Today a customer pays via a self-serve Stripe Payment Link (Essentials /
 * Growth) but their plan is NOT set in Supabase — provisioning is manual. This
 * function closes that gap:
 *   - checkout.session.completed  → find/create the client + login, set plan.
 *   - customer.subscription.updated → update clients.plan (upgrade/downgrade/swap).
 *   - customer.subscription.deleted → downgrade clients.plan to 'free'.
 *
 * SCOPE: Essentials & Growth only — the only self-serve tiers with Payment
 * Links. Managed/Pro/Enterprise stay sales-closed via the Onboard wizard.
 *
 * AUTH MODEL — this function does NOT call requireAuth(event) (see spec §2).
 * Stripe calls it server-to-server with no JWT and not from the site's origin,
 * so _auth.js's JWT + origin whitelist would reject every call. Authentication
 * is Stripe signature verification (stripe.webhooks.constructEvent) instead.
 *
 * Requires env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
 * SUPABASE_SERVICE_KEY. Requires the supabase-stripe-webhook-migration.sql
 * schema (clients.stripe_customer_id / .stripe_subscription_id + stripe_events).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const APP_URL = 'https://app.getbrandgeo.com'

// Fallback price-ID → plan map (real live IDs, STRIPE-WEBHOOK-SPEC.md §5B).
// Primary source is price.metadata.plan (§5A, already set on all 4 live prices);
// this fallback covers a price whose metadata ever goes missing. Plan slugs must
// match planConfig.ts's Plan union exactly.
const PRICE_TO_PLAN = {
  price_1TrLPgKh2GaZE2B4kqgmQsiO: 'essentials', // Essentials €99/mo
  price_1TrLSeKh2GaZE2B48iVobXF9: 'essentials', // Essentials €990/yr
  price_1TrLQhKh2GaZE2B4gLPWMger: 'growth',     // Growth €299/mo
  price_1TrLR6Kh2GaZE2B4mYqOHBhQ: 'growth',     // Growth €2,990/yr
}

// Only these self-serve tiers are ever provisioned by this webhook.
const SELF_SERVE_PLANS = ['essentials', 'growth']

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']

  // constructEvent needs the EXACT raw bytes — never JSON.parse before verifying.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log('[stripe-webhook] bad signature:', err.message)
    return { statusCode: 400, body: `Webhook signature failed: ${err.message}` }
  }

  const evtId = stripeEvent.id
  const type = stripeEvent.type
  const log = (...a) => console.log(`[stripe-webhook/${evtId}]`, ...a)

  // Event types we don't handle: return 200 immediately so Stripe stops
  // retrying them (a 4xx/5xx here would trigger endless retries).
  const HANDLED = new Set([
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ])
  if (!HANDLED.has(type)) {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: type }) }
  }

  // Idempotency: insert-first. A unique-violation means this event.id was
  // already handled → 200 without re-processing (Stripe delivers duplicates
  // and retries). On a real processing failure below we delete this row again
  // so a Stripe retry re-runs the handler.
  const { error: dedupeErr } = await supabase
    .from('stripe_events')
    .insert({ id: evtId, type })
  if (dedupeErr) {
    if (dedupeErr.code === '23505') {
      log('duplicate delivery, already handled — 200')
      return { statusCode: 200, body: JSON.stringify({ received: true, duplicate: true }) }
    }
    // Idempotency table itself failed (not a dup). Don't block provisioning on
    // it — log and continue; worst case a retry is re-processed idempotently.
    log('stripe_events insert error (continuing):', dedupeErr.message)
  }

  try {
    if (type === 'checkout.session.completed') {
      await handleCheckoutCompleted(stripeEvent.data.object, log)
    } else if (type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(stripeEvent.data.object, log)
    } else if (type === 'customer.subscription.deleted') {
      await handleSubscriptionDeleted(stripeEvent.data.object, log)
    }
    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    log('handler error:', err.message)
    // Release the idempotency lock so Stripe's retry re-processes this event.
    await supabase.from('stripe_events').delete().eq('id', evtId)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session, log) {
  // Only subscription checkouts provision a plan (ignore one-time payments).
  if (session.mode && session.mode !== 'subscription') {
    log('non-subscription checkout, skipping:', session.mode)
    return
  }

  const email = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase()
  const custId = session.customer
  const subId = session.subscription

  if (!email) { log('no customer email on session, skipping'); return }
  if (!custId) { log('no customer id on session, skipping'); return }

  // Resolve the purchased plan from the line item's price.
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
  const price = lineItems.data[0]?.price
  const priceId = price?.id
  const plan = (price?.metadata?.plan) || PRICE_TO_PLAN[priceId]

  if (!plan || !SELF_SERVE_PLANS.includes(plan)) {
    // Not a self-serve tier this webhook provisions (or unknown price). Leave
    // it to manual/sales provisioning — but this is a real gap to notice.
    log(`unresolved/non-self-serve plan for price ${priceId} (plan=${plan}) — skipping provisioning`)
    return
  }

  log(`provisioning email=${email} plan=${plan} cust=${custId} sub=${subId}`)

  // Find an existing auth user by email (returning subscriber, re-subscribe, or
  // someone who already had a login from the Onboard wizard / an earlier buy).
  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    // Link/refresh the plan on their existing client. Their client is via
    // user_profiles.client_id.
    const { data: profile, error: profErr } = await supabase
      .from('user_profiles')
      .select('client_id')
      .eq('id', existingUser.id)
      .maybeSingle()
    if (profErr) throw new Error(`user_profiles lookup failed: ${profErr.message}`)

    if (profile?.client_id) {
      const { error: updErr } = await supabase
        .from('clients')
        .update({ plan, stripe_customer_id: custId, stripe_subscription_id: subId })
        .eq('id', profile.client_id)
      if (updErr) throw new Error(`clients update failed: ${updErr.message}`)
      log(`existing user ${existingUser.id} → client ${profile.client_id} set to ${plan}`)
      return
    }

    // Auth user exists but has no client/profile (edge case). Create a client
    // and link it to them — no invite needed, they already have a login.
    const client = await createClientRow({ email, plan, custId, subId, log })
    const { error: linkErr } = await supabase
      .from('user_profiles')
      .insert({ id: existingUser.id, client_id: client.id, role: 'viewer' })
    if (linkErr) {
      await supabase.from('clients').delete().eq('id', client.id)
      throw new Error(`user_profiles insert failed: ${linkErr.message}`)
    }
    log(`existing user ${existingUser.id} linked to new client ${client.id} (${plan})`)
    return
  }

  // No existing user → provision new, mirroring onboard-client.js's atomic
  // create-client → invite → user_profiles chain with rollback.
  const client = await createClientRow({ email, plan, custId, subId, log })

  const { data: authData, error: authErr } = await supabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${APP_URL}/reset-password` },
  )
  if (authErr) {
    await supabase.from('clients').delete().eq('id', client.id)
    throw new Error(`invite email failed: ${authErr.message}`)
  }

  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({ id: authData.user.id, client_id: client.id, role: 'viewer' })
  if (profileErr) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    await supabase.from('clients').delete().eq('id', client.id)
    throw new Error(`user_profiles insert failed: ${profileErr.message}`)
  }

  log(`new client ${client.id} provisioned + invite sent to ${email} (${plan})`)
}

async function handleSubscriptionUpdated(sub, log) {
  const custId = sub.customer
  const price = sub.items?.data?.[0]?.price
  const plan = (price?.metadata?.plan) || PRICE_TO_PLAN[price?.id]

  if (!plan || !SELF_SERVE_PLANS.includes(plan)) {
    log(`subscription.updated: unresolved/non-self-serve plan (price=${price?.id}, plan=${plan}) — skipping`)
    return
  }

  const { data, error } = await supabase
    .from('clients')
    .update({ plan, stripe_subscription_id: sub.id })
    .eq('stripe_customer_id', custId)
    .select('id')
  if (error) throw new Error(`clients update failed: ${error.message}`)

  if (!data || data.length === 0) {
    // No client mapped yet — likely arrived before checkout.session.completed.
    // That handler will set the plan; nothing to do here.
    log(`subscription.updated: no client for cust ${custId} yet — no-op`)
    return
  }
  log(`subscription.updated: cust ${custId} → plan ${plan} (${data.length} client row(s))`)
}

async function handleSubscriptionDeleted(sub, log) {
  const custId = sub.customer
  // Downgrade to free rather than deleting — keeps their login + history so they
  // can re-subscribe. (Business call per spec §6.3: free vs read-only → free.)
  const { data, error } = await supabase
    .from('clients')
    .update({ plan: 'free' })
    .eq('stripe_customer_id', custId)
    .select('id')
  if (error) throw new Error(`clients downgrade failed: ${error.message}`)

  if (!data || data.length === 0) {
    log(`subscription.deleted: no client for cust ${custId} — no-op`)
    return
  }
  log(`subscription.deleted: cust ${custId} downgraded to free (${data.length} client row(s))`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Insert a clients row for a self-serve subscriber. Name defaults to the email
// domain, slug is derived + made unique (retry once with a random suffix on a
// unique-violation). Placeholder brand fields — the customer/admin can fill
// these in later; market defaults to Worldwide, matching onboard-client's
// nullable-market handling.
async function createClientRow({ email, plan, custId, subId, log }) {
  const domain = email.split('@')[1] || email
  const baseSlug = slugify(domain) || `client-${Date.now()}`

  for (let attempt = 0; attempt < 2; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomSuffix()}`
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: domain,
        slug,
        plan,
        stripe_customer_id: custId,
        stripe_subscription_id: subId,
        default_market_id: 'WW',
      })
      .select()
      .single()
    if (!error) return data
    if (error.code === '23505' && attempt === 0) {
      log(`slug "${slug}" taken, retrying with suffix`)
      continue
    }
    throw new Error(`clients insert failed: ${error.message}`)
  }
  // Unreachable in practice (loop returns or throws), but keep the type honest.
  throw new Error('clients insert failed: could not generate a unique slug')
}

// Find an auth user by email via the admin API. @supabase/supabase-js v2 has no
// getUserByEmail, so paginate listUsers and match. Capped at 20 pages (20k
// users) — far beyond the current base, and each page is a single admin call.
async function findUserByEmail(email) {
  const target = email.trim().toLowerCase()
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`listUsers failed: ${error.message}`)
    const users = data?.users || []
    const hit = users.find((u) => (u.email || '').trim().toLowerCase() === target)
    if (hit) return hit
    if (users.length < perPage) break // last page
  }
  return null
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6)
}
