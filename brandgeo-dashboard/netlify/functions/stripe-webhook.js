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
 * SCOPE: the self-serve tiers only (SELF_SERVE_PLANS in _package_checkout.js).
 * Managed/Pro/Enterprise stay sales-closed via the Onboard wizard.
 *
 * PACKAGES, added 2026-07-31 (ROADMAP A1, docs/arch/custom-entitlements.md §3).
 * A checkout with mode 'payment' is a package: N months of a tier bought
 * outright, resolved from the price's metadata.plan + metadata.months. It
 * provisions with plan_source 'package' and plan_grant_until = today + N
 * months, so expire-plan-grants.js reverts it to Free when it runs out. Before
 * this, such a checkout logged one line and provisioned nothing — the customer
 * paid and the product did not react (arch §2). If you ever add another
 * plan_source here, add it to expire-plan-grants.js's filter in the same
 * change, or the grant never ends.
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
const { recordAdminEvent } = require('./_admin_notify')
const { PLAN_LABELS } = require('./_plans')
const {
  SELF_SERVE_PLANS,
  PACKAGE_PLAN_SOURCE,
  resolvePackage,
  checkPackageLineItem,
  packageGrantUntil,
  stackedGrantUntil,
  todayUtc,
} = require('./_package_checkout')

const APP_URL = 'https://app.getbrandgeo.com'

// Fallback price-ID → plan map (real live IDs, STRIPE-WEBHOOK-SPEC.md §5B).
// Primary source is price.metadata.plan (§5A, already set on all 4 live prices);
// this fallback covers a price whose metadata ever goes missing. Plan slugs must
// match planConfig.ts's Plan union exactly.
const PRICE_TO_PLAN = {
  // Current catalogue, created 2026-07-28 by scripts/stripe-create-catalogue.js.
  // Each of these six carries metadata.plan, which is what actually resolves the
  // tier; this map is only the fallback for a price whose metadata goes missing.
  price_1Ty5ZyKh2GaZE2B4UBLxnzdc: 'essentials', // Essentials €99/mo
  price_1Ty5a0Kh2GaZE2B4cRsrKalr: 'essentials', // Essentials €990/yr
  price_1Ty5a3Kh2GaZE2B4WSWURHv8: 'growth',     // Growth €299/mo
  price_1Ty5a5Kh2GaZE2B4NivZ8zmd: 'growth',     // Growth €2,990/yr
  price_1Ty5a7Kh2GaZE2B4vQhoTktV: 'growth_pro', // Growth PRO €449/mo
  price_1Ty5a9Kh2GaZE2B4ibycxUST: 'growth_pro', // Growth PRO €4,490/yr

  // Superseded catalogue. Their payment links are still active so the live site
  // keeps working until the new site.js reaches cPanel, and a subscription
  // bought in that window must still resolve. Delete these four only after the
  // old links are deactivated in Stripe, not before.
  price_1TrLPgKh2GaZE2B4kqgmQsiO: 'essentials', // old Essentials €99/mo
  price_1TrLSeKh2GaZE2B48iVobXF9: 'essentials', // old Essentials €990/yr
  price_1TrLQhKh2GaZE2B4gLPWMger: 'growth',     // old Growth €299/mo
  price_1TrLR6Kh2GaZE2B4mYqOHBhQ: 'growth',     // old Growth €2,990/yr
}

// SELF_SERVE_PLANS moved to _package_checkout.js on 2026-07-31 (imported above),
// unchanged, so the package path and the subscription path share one list
// instead of two. Its original comment moved with it.

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
  // Two checkout modes provision a plan:
  //   'subscription' — recurring self-serve, the original behaviour.
  //   'payment'      — a PACKAGE: N months of a tier bought outright, added
  //                    2026-07-31 per docs/arch/custom-entitlements.md §3.
  // A missing mode is treated as 'subscription', which is what the previous
  // `session.mode && session.mode !== 'subscription'` guard did. Anything else
  // Stripe may introduce (today: 'setup') is still skipped.
  const mode = session.mode || 'subscription'
  if (mode !== 'subscription' && mode !== 'payment') {
    log('unhandled checkout mode, skipping:', mode)
    return
  }
  const isPackage = mode === 'payment'

  const email = (session.customer_details?.email || session.customer_email || '').trim().toLowerCase()
  const custId = session.customer
  const subId = session.subscription

  // For a package the money is already captured, so a session we cannot act on
  // is a paid-but-unprovisioned customer. Arch §3.2 requires those to be
  // visible in the product rather than only in a log — the whole point of A1 is
  // that "the money arrives and the product does not react" stops happening
  // silently. The subscription path keeps its original log-and-return, so this
  // cannot change its behaviour.
  if (!email) {
    log('no customer email on session, skipping')
    if (isPackage) await reportUnprovisionedPackage({ session, log, reason: 'missing_email', detail: 'checkout session carries no customer email', email: null })
    return
  }
  // ⚠️ READ THIS BEFORE CREATING A PACKAGE PAYMENT LINK. In `payment` mode
  // Stripe does NOT create a Customer by default — customer_creation defaults
  // to 'if_required', and a one-time charge does not require one — so
  // session.customer is null and this branch fires. In `subscription` mode a
  // Customer is always created, which is why this has never been hit.
  // The package link MUST be created with customer_creation: 'always'.
  // Getting it wrong does not lose the sale silently any more: the package
  // path raises a package_unprovisioned admin event with the session id, so
  // the fix is one link setting and a manual provision from Account.
  if (!custId) {
    log('no customer id on session, skipping')
    if (isPackage) await reportUnprovisionedPackage({ session, log, reason: 'missing_customer', detail: 'checkout session carries no customer id (payment-mode link needs customer_creation: always)', email })
    return
  }

  // Resolve the purchased plan from the line item's price. The line item itself
  // is kept, not just its price: the package path checks quantity off it (S3).
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
  const line = lineItems.data[0]
  const price = line?.price
  const priceId = price?.id

  // Everything below branches on these four, and on nothing else. Both modes
  // then run the SAME three provisioning branches (arch §3.2 step 3).
  let plan, planSource, grantUntil, months

  if (isPackage) {
    // Shape of the SALE before shape of the PRICE (S3). The months granted come
    // from price.metadata.months and are never multiplied by quantity, so a
    // quantity of 2 on a 6-month package charges for twelve and would provision
    // six — resolution SUCCEEDS, so nothing downstream would ever notice.
    // Refuse rather than multiply; see checkPackageLineItem's comment for why.
    const shape = checkPackageLineItem(line, lineItems.has_more === true)
    if (!shape.ok) {
      log(`package NOT provisioned (${shape.reason}): ${shape.detail} [price=${priceId} email=${email}]`)
      await reportUnprovisionedPackage({ session, log, reason: shape.reason, detail: shape.detail, email, priceId })
      return
    }

    const resolved = resolvePackage(price)
    if (!resolved.ok) {
      // Arch §3.2 step 2: provision NOTHING, but say so loudly. Deliberately not
      // a throw — a throw releases the idempotency lock (see the handler above),
      // so Stripe would redeliver this same unfixable session on its retry
      // schedule and re-alert the admin every time. The money is already taken;
      // the correct outcome is one alert and a human decision.
      log(`package NOT provisioned (${resolved.reason}): ${resolved.detail} ` +
          `[price=${priceId} plan=${JSON.stringify(resolved.raw.plan)} months=${JSON.stringify(resolved.raw.months)} email=${email}]`)
      await reportUnprovisionedPackage({ session, log, reason: resolved.reason, detail: resolved.detail, email, priceId, raw: resolved.raw })
      return
    }
    plan = resolved.plan
    months = resolved.months
    planSource = PACKAGE_PLAN_SOURCE
    // Held THROUGH this date; expire-plan-grants.js reverts it the day after,
    // because that job selects plan_grant_until < today.
    grantUntil = packageGrantUntil(months)
  } else {
    plan = (price?.metadata?.plan) || PRICE_TO_PLAN[priceId]
    if (!plan || !SELF_SERVE_PLANS.includes(plan)) {
      // Not a self-serve tier this webhook provisions (or unknown price). Leave
      // it to manual/sales provisioning — but this is a real gap to notice.
      log(`unresolved/non-self-serve plan for price ${priceId} (plan=${plan}) — skipping provisioning`)
      return
    }
    planSource = 'stripe'
    grantUntil = null
  }

  // Wording for the admin feed, so a package and a subscription are told apart
  // at a glance in the bell and in the alert email.
  const planLabel = PLAN_LABELS[plan] || plan
  const what = isPackage ? `${months}-month ${planLabel} package` : `${planLabel} subscription`
  const eventType = isPackage ? 'package_purchased' : 'subscription_new'
  // A FUNCTION, not an object literal, and that matters: the existing-client
  // branch below can still move grantUntil (S2 stacking). An object built here
  // would freeze the pre-stack date and the admin feed would report a grant end
  // that is not the one written to the row.
  const eventMeta = () => (isPackage
    ? { email, plan, months, plan_source: planSource, plan_grant_until: grantUntil, price: priceId }
    : { email, plan })

  log(`provisioning email=${email} plan=${plan} source=${planSource} grant_until=${grantUntil} (before stacking) cust=${custId} sub=${subId}`)

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
      // S2 (docs/qa/package-provisioning-014.md), ruled by Constantin
      // 2026-07-31: renewing a package early STACKS the unused remainder rather
      // than forfeiting it. This is the only branch where that can apply — the
      // other two provisioning branches create a brand new clients row, which
      // by definition has no grant to stack on.
      //
      // This is a NEW READ on the provisioning path. It throws on failure
      // rather than degrading to today, on purpose: nothing has been written
      // yet, so the outer catch releases the idempotency lock and Stripe
      // redelivers, which re-runs this cleanly. Silently forfeiting a paying
      // customer's months because one SELECT blipped is the exact bug being
      // fixed. A missing, null or unparseable plan_grant_until does NOT throw —
      // stackedGrantUntil() treats it as "no existing grant" and falls back to
      // today, i.e. the behaviour before this change.
      if (isPackage) {
        const { data: cur, error: curErr } = await supabase
          .from('clients')
          .select('plan_grant_until, plan_source')
          .eq('id', profile.client_id)
          .maybeSingle()
        if (curErr) throw new Error(`clients grant lookup failed: ${curErr.message}`)

        const stacked = stackedGrantUntil(months, cur?.plan_grant_until)
        if (stacked !== grantUntil) {
          log(`stacking ${months}mo onto live ${cur?.plan_source} grant ending ${cur?.plan_grant_until}: `
            + `${grantUntil} → ${stacked}`)
        }
        grantUntil = stacked
      }

      // plan_source and plan_grant_until are now written EXPLICITLY on every
      // paid checkout, not left at whatever the client already had.
      //
      // This is the one place this change goes beyond arch §3.2, which only
      // asks createClientRow() to state them. It is not optional, for two
      // reasons, and bg-verify should judge it on these:
      //
      //   1. WITHOUT it, A1 introduces the exact leak §2.1 warns about, just
      //      one step later. A founding client buys a 12-month package
      //      (plan_source='package', plan_grant_until=+12m) and then converts
      //      to a monthly subscription. This branch would set plan and leave
      //      plan_source='package', so expire-plan-grants.js reverts a PAYING
      //      subscriber to Free on the old package's end date.
      //   2. It also closes a live bug that predates packages: a client on a
      //      trial (plan_source='trial', plan_grant_until set) who then pays
      //      keeps both, and the expiry job reverts their paid plan to Free.
      //      Checked against production 2026-07-31: zero clients are currently
      //      in that state (no row has plan_source in ('trial','comp') with a
      //      stripe_subscription_id), so this is preventive, not a repair.
      //
      // stripe_subscription_id is deliberately NOT written on the package path.
      // Arch §3.2 says a package has no subscription id and must not invent
      // one, which is satisfied by leaving it alone: a package-only client
      // already has null there, while a client with a genuine live
      // subscription keeps it. Writing null would have blanked a real id and
      // broken get-subscription.js's renewal panel and set-client-plan.js's
      // "this client is Stripe-billed" warning.
      const update = { plan, stripe_customer_id: custId, plan_source: planSource, plan_grant_until: grantUntil }
      if (!isPackage) update.stripe_subscription_id = subId

      const { error: updErr } = await supabase
        .from('clients')
        .update(update)
        .eq('id', profile.client_id)
      if (updErr) throw new Error(`clients update failed: ${updErr.message}`)
      log(`existing user ${existingUser.id} → client ${profile.client_id} set to ${plan} (${planSource}${grantUntil ? `, until ${grantUntil}` : ''})`)
      await recordAdminEvent(supabase, {
        type: eventType, client_id: profile.client_id,
        title: isPackage ? `Package purchased: ${what}` : `Subscription: ${planLabel}`,
        body: isPackage
          ? `${email} bought a ${what}. Access runs to ${grantUntil}, then reverts to Free.`
          : `${email} subscribed to ${planLabel}.`,
        meta: eventMeta(),
      })
      return
    }

    // Auth user exists but has no client/profile (edge case). Create a client
    // and link it to them — no invite needed, they already have a login.
    const client = await createClientRow({ email, plan, custId, subId, planSource, grantUntil, log })
    const { error: linkErr } = await supabase
      .from('user_profiles')
      .insert({ id: existingUser.id, client_id: client.id, role: 'viewer' })
    if (linkErr) {
      await supabase.from('clients').delete().eq('id', client.id)
      throw new Error(`user_profiles insert failed: ${linkErr.message}`)
    }
    log(`existing user ${existingUser.id} linked to new client ${client.id} (${plan}, ${planSource})`)
    await recordAdminEvent(supabase, {
      type: eventType, client_id: client.id,
      title: isPackage ? `New package: ${what}` : `New subscription: ${planLabel}`,
      body: isPackage
        ? `${email} bought a ${what}. Access runs to ${grantUntil}, then reverts to Free.`
        : `${email} subscribed to ${planLabel}.`,
      meta: eventMeta(),
    })
    return
  }

  // No existing user → provision new, mirroring onboard-client.js's atomic
  // create-client → invite → user_profiles chain with rollback.
  const client = await createClientRow({ email, plan, custId, subId, planSource, grantUntil, log })

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

  log(`new client ${client.id} provisioned + invite sent to ${email} (${plan}, ${planSource})`)
  await recordAdminEvent(supabase, {
    type: eventType, client_id: client.id,
    title: isPackage ? `New paid package: ${what}` : `New paid signup: ${planLabel}`,
    body: isPackage
      ? `${email} bought a ${what}. Access runs to ${grantUntil}, then reverts to Free.`
      : `${email} subscribed to the ${planLabel} plan.`,
    meta: eventMeta(),
  })
}

// A package checkout that took money but could not be provisioned. Arch §3.2
// step 2: "record an admin event so a paid-but-unprovisioned customer is
// visible in the product rather than only in a log."
//
// recordAdminEvent is best-effort by construction (_admin_notify.js never
// throws), which is what we want here: the alert must not be able to turn a
// silent non-provisioning into a 500 that Stripe then retries forever.
//
// client_id is null on purpose. There is no client — that is the entire
// problem. admin_notifications.client_id is nullable and ON DELETE SET NULL.
async function reportUnprovisionedPackage({ session, log, reason, detail, email, priceId = null, raw = null }) {
  const amount = typeof session.amount_total === 'number'
    ? `${(session.amount_total / 100).toFixed(2)} ${String(session.currency || '').toUpperCase()}`
    : 'unknown amount'
  await recordAdminEvent(supabase, {
    type: 'package_unprovisioned',
    client_id: null,
    title: 'Paid package could NOT be provisioned',
    body: `A one-time checkout for ${amount}${email ? ` from ${email}` : ''} completed but provisioned nothing: ${detail}. `
        + `The customer has paid and has no plan. Fix the price metadata (plan + months, 1-36) and provision by hand from Account.`,
    meta: {
      reason, detail, email: email || null, price: priceId,
      metadata_plan: raw ? raw.plan : null,
      metadata_months: raw ? raw.months : null,
      checkout_session: session.id,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
    },
  })
  log(`admin event raised: package_unprovisioned (${reason})`)
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
  for (const row of data) {
    await recordAdminEvent(supabase, {
      type: 'subscription_changed', client_id: row.id,
      title: `Subscription changed to ${PLAN_LABELS[plan] || plan}`,
      body: `A client's subscription changed to ${PLAN_LABELS[plan] || plan}.`, meta: { plan, cust: custId },
    })
  }
}

// Cancellation. Two things changed here on 2026-07-31 for
// docs/qa/package-provisioning-014.md S1, and both exist because a client can
// now hold a package AND a subscription at the same time.
//
//   1. stripe_subscription_id is cleared. It used to be left behind, pointing at
//      a subscription Stripe has deleted. That stale id is what would make
//      expire-plan-grants.js's new liveness guard wrong in the dangerous
//      direction: it would read as "still paying" and exempt the client's
//      package from ever expiring — arch §2.1's permanent revenue leak by
//      another route. Safe for get-subscription.js, which already returns
//      { active: false } for a null id (get-subscription.js:30-32).
//
//   2. A LIVE package grant is no longer destroyed by the downgrade. The blind
//      `update({ plan: 'free' })` set plan to Free for every row matching the
//      customer, including one holding months of paid, unexpired package. That
//      left plan='free' with plan_source='package' and a future
//      plan_grant_until, which nothing restores: expire-plan-grants.js excludes
//      it (.neq('plan','free')) and no other job reads it. The customer's paid
//      months vanished silently. So the read now happens first and the plan is
//      only reverted when there is no live package underneath.
//
// Downgrading rather than deleting is unchanged (spec §6.3: keeps their login
// and history so they can re-subscribe).
async function handleSubscriptionDeleted(sub, log) {
  const custId = sub.customer

  const { data: rows, error: selErr } = await supabase
    .from('clients')
    .select('id, plan, plan_source, plan_grant_until')
    .eq('stripe_customer_id', custId)
  if (selErr) throw new Error(`clients lookup failed: ${selErr.message}`)

  if (!rows || rows.length === 0) {
    log(`subscription.deleted: no client for cust ${custId} — no-op`)
    return
  }

  const today = todayUtc()
  for (const row of rows) {
    // Held THROUGH plan_grant_until, same boundary expire-plan-grants.js uses.
    const holdsLivePackage = row.plan_source === PACKAGE_PLAN_SOURCE
      && !!row.plan_grant_until
      && !(row.plan_grant_until < today)

    const update = holdsLivePackage
      ? { stripe_subscription_id: null }
      : { plan: 'free', stripe_subscription_id: null }

    const { error: updErr } = await supabase.from('clients').update(update).eq('id', row.id)
    if (updErr) throw new Error(`clients downgrade failed: ${updErr.message}`)

    if (holdsLivePackage) {
      log(`subscription.deleted: client ${row.id} keeps ${row.plan} — paid package runs to ${row.plan_grant_until}`)
      await recordAdminEvent(supabase, {
        type: 'subscription_canceled', client_id: row.id,
        title: 'Subscription canceled, paid package kept',
        body: `A client canceled their subscription but holds a paid package on ${PLAN_LABELS[row.plan] || row.plan} `
            + `until ${row.plan_grant_until}. They were NOT downgraded to Free; the package expires on its own date.`,
        meta: { cust: custId, plan: row.plan, plan_grant_until: row.plan_grant_until, downgraded: false },
      })
      continue
    }

    log(`subscription.deleted: client ${row.id} downgraded to free`)
    await recordAdminEvent(supabase, {
      type: 'subscription_canceled', client_id: row.id,
      title: 'Subscription canceled', body: 'A client canceled and was downgraded to Free.',
      meta: { cust: custId, downgraded: true },
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Insert a clients row for a self-serve subscriber or a package buyer. Name
// defaults to the email domain, slug is derived + made unique (retry once with
// a random suffix on a unique-violation). Placeholder brand fields — the
// customer/admin can fill these in later; market defaults to Worldwide,
// matching onboard-client's nullable-market handling.
//
// planSource / grantUntil are required, not defaulted, per arch §3.2. A default
// would let a future call site provision a package as 'stripe' by omission, and
// 'stripe' is not in expire-plan-grants.js's revert filter — the silent,
// permanent revenue leak that arch §2.1 exists to prevent. Callers:
//   subscription → ('stripe', null)   — today's behaviour, now stated. The row
//                                        used to be written with plan_source
//                                        NULL ("legacy/unknown"); neither NULL
//                                        nor 'stripe' is in the revert filter,
//                                        so no expiry behaviour changes.
//   package      → ('package', 'YYYY-MM-DD')
async function createClientRow({ email, plan, custId, subId, planSource, grantUntil, log }) {
  if (!planSource) throw new Error('createClientRow: planSource is required')
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
        // A package has no subscription; never fabricate an id for one.
        stripe_subscription_id: subId ?? null,
        plan_source: planSource,
        plan_grant_until: grantUntil ?? null,
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
