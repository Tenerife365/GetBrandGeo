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
 * PLAN AUDIT, added 2026-07-31. EVERY branch below that writes clients.plan also
 * appends a client_events row carrying from_plan, to_plan and the Stripe ids
 * that caused it. There are five plan writes in this file — the existing-client
 * checkout update, the two createClientRow inserts, subscription.updated, and
 * the reverting half of subscription.deleted — and none of them recorded
 * anything before. If you add a sixth, it appends an event in the SAME change:
 * see recordPlanEvent below for why from_plan has to be read before the write
 * and why the insert is best-effort.
 *
 * REFRESH CADENCE, added 2026-07-31. Every branch that writes clients.plan also
 * writes clients.refresh_cadence, derived from the tier by refreshCadenceFor()
 * in _cost.js. A plan without a cadence is a tier sold on a weekly refresh that
 * never happens; a cadence without a plan behind it is spend on a customer who
 * has stopped paying. The one branch that does NOT write it is the held-package
 * half of subscription.deleted, because that branch does not change the plan
 * either. On the two update paths the client's `category` is read first and the
 * cadence write is SKIPPED if that read failed — see readCurrentPlan.
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
const { recordAdminEvent, clientLabel } = require('./_admin_notify')
const { PLAN_LABELS } = require('./_plans')
const { refreshCadenceFor, DEFAULT_CLIENT_CATEGORY } = require('./_cost')
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
// Plan audit
// ─────────────────────────────────────────────────────────────────────────────

// Append-only client_events row for EVERY clients.plan write this webhook makes.
//
// WHY IT EXISTS. On 2026-07-31 client 1's plan was changed three times in one
// day — by an end-to-end payment test, by a manual restore, and by a correction
// — and `select count(*) from client_events where client_id = 1` returned 0. The
// question "what tier was this customer on an hour ago" had no answer, so the
// tier was inferred from which engines had produced ai_results rows, and the
// inference was WRONG: the client was restored to `pro` (9 engines, EUR 225
// budget) when the true tier was `growth_pro` (7 engines, EUR 67.35). A paying
// customer was briefly over-entitled because this function wrote plans and kept
// no record. See docs/qa/s3-e2e-payment-test-2026-07-31.md.
//
// BEST-EFFORT, AND THIS ONE IS NOT THE USUAL "LOGGING IS OPTIONAL" HAND-WAVE.
// Every call site below runs on the money path: by the time this is reached the
// customer has already been charged and their entitlement has already been
// written to clients. If this insert were allowed to throw, the catch in the
// handler above would DELETE the idempotency row and return 500, and Stripe
// would redeliver the same event — re-running provisioning because an AUDIT row
// could not be written. A missing audit row is a gap in the record. A failed
// provisioning is a customer who paid and got nothing. Same convention, and the
// same reason, as _admin_notify.js's recordAdminEvent and onboard-client.js:206.
//
// FROM_PLAN IS THE WHOLE POINT and it is the easy thing to get wrong: you cannot
// read what a client WAS after you have overwritten it. Every caller reads the
// current plan before its update and passes it through. Never pass the plan you
// are about to write.
//
// actor is null on purpose: the migration documents null as "system/auto", and
// Stripe is not a human admin. The identifying cause lives in meta instead
// (stripe customer id, checkout session id, subscription id, price, months).
// The plan a client is on RIGHT NOW, for the from_plan of a write about to
// happen. Returns null rather than throwing on any failure, for the same reason
// recordPlanEvent swallows: this runs in front of an entitlement write on the
// money path, and a customer must not go unprovisioned because the audit could
// not read a column. A null from_plan is a weaker record than a real one; a 500
// here is a Stripe redelivery loop around a paid checkout.
//
// ALSO READS `category`, added 2026-07-31 with the refresh-cadence write. The
// two are read together because they are needed at the same instant and both are
// unrecoverable after the update. `read` distinguishes "we looked and the client
// is 'active'" from "the lookup failed and we know nothing" — the caller must not
// grant an automatic cadence on a guess, because a guess of 'active' against a
// real 'research' row is the EUR 6,075 mistake refreshCadenceFor exists to stop.
// from_plan keeps its old policy of degrading to null; only the cadence write is
// suppressed when the read fails.
async function readCurrentPlan(clientId, log) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('plan, category')
      .eq('id', clientId)
      .maybeSingle()
    if (error) {
      log('prior-plan lookup failed (continuing, from_plan will be null):', error.message)
      return { plan: null, category: null, read: false }
    }
    return { plan: data?.plan ?? null, category: data?.category ?? null, read: true }
  } catch (e) {
    log('prior-plan lookup threw (continuing, from_plan will be null):', e.message)
    return { plan: null, category: null, read: false }
  }
}

async function recordPlanEvent({ client_id, type, from_plan, to_plan, meta }) {
  try {
    const { error } = await supabase.from('client_events').insert({
      client_id,
      actor: null,
      type,
      from_plan: from_plan ?? null,
      to_plan: to_plan ?? null,
      meta: { source: 'stripe-webhook', ...(meta || {}) },
    })
    if (error) console.error(`[stripe-webhook] client_events insert failed for client ${client_id}: ${error.message}`)
  } catch (e) {
    console.error(`[stripe-webhook] client_events insert threw for client ${client_id}: ${e.message}`)
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
  // Set only on the package path, and only when the price names a client. null
  // means "resolve the buyer from the payer's email", which is every other case.
  let boundClientId = null

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

    // Who is this package FOR? Only packages may name a client: a self-serve
    // subscription has no admin behind it to name one, and letting a public
    // price carry a client_id would let anyone who guessed a price id provision
    // against an account they do not own.
    const bound = await resolveBoundClient(price, log)
    if (!bound.ok) {
      log(`package NOT provisioned (${bound.reason}): ${bound.detail} [price=${priceId} email=${email}]`)
      await reportUnprovisionedPackage({ session, log, reason: bound.reason, detail: bound.detail, email, priceId })
      return
    }
    boundClientId = bound.clientId
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

  // Did this purchase come through the contract gate? (ROADMAP Stream C, C3.)
  //
  // PLACED HERE, AFTER PLAN RESOLUTION, AND THAT POSITION IS THE FIX for two
  // false-alarm sources found in review. Above this point the plan is unknown,
  // so the check fired on things that could not possibly carry an acceptance and
  // then asserted a bypass had happened:
  //
  //   - PACKAGES are created by hand in Stripe (see the customer_creation note
  //     above) and _terms_gate.js knows only the three subscription tiers, so a
  //     package can never carry a client_reference_id. Skipped outright.
  //   - SALES-ASSISTED and unknown-price subscriptions (managed, enterprise, the
  //     four previous payment links still live in Stripe) return at the `else`
  //     branch above, so they no longer reach this at all.
  //
  // An alert that cries bypass at a legitimate sale is worse than no alert: it
  // trains the reader to dismiss it, and it would send someone rotating live
  // payment links in response to a purchase that was fine.
  if (!isPackage) {
    await checkContractAcceptance({ session, email, plan, log })
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

  // What caused the plan write, for the client_events audit row. Everything here
  // identifies the CAUSE and nothing here is the plan itself — from_plan and
  // to_plan are columns, not meta. A FUNCTION for the same reason eventMeta() is:
  // grantUntil can still move in the existing-client branch (S2 stacking), and an
  // object literal built here would freeze the pre-stack date into the audit
  // trail, which is exactly the class of "the record disagrees with the row" bug
  // this whole change exists to end.
  //
  // stripe_subscription_id is null for a package on purpose: the package path
  // deliberately does not write one (see the update comment below), so recording
  // the session's subId here would put an id in the audit trail that was never
  // written to the client.
  const auditMeta = () => ({
    reason: isPackage ? 'package_purchase' : 'checkout_subscription',
    mode,
    email,
    stripe_customer_id: custId,
    stripe_subscription_id: isPackage ? null : (subId || null),
    checkout_session: session.id,
    price: priceId || null,
    months: isPackage ? months : null,
    plan_source: planSource,
    plan_grant_until: grantUntil,
  })

  log(`provisioning email=${email} plan=${plan} source=${planSource} grant_until=${grantUntil} (before stacking) cust=${custId} sub=${subId}`)

  // Find an existing auth user by email (returning subscriber, re-subscribe, or
  // someone who already had a login from the Onboard wizard / an earlier buy).
  //
  // SKIPPED ENTIRELY when the package named its client: the whole point of the
  // binding is that the payer's mailbox is not consulted, so looking it up and
  // then ignoring the answer would leave a lookup whose result silently does
  // nothing — the shape that invites someone to "simplify" it back into a bug.
  const existingUser = boundClientId ? null : await findUserByEmail(email)

  if (boundClientId || existingUser) {
    // Which client this checkout provisions. From the price when the package
    // named one, otherwise from the payer's profile.
    let targetClientId = boundClientId

    if (!targetClientId) {
      // Link/refresh the plan on their existing client. Their client is via
      // user_profiles.client_id.
      const { data: profile, error: profErr } = await supabase
        .from('user_profiles')
        .select('client_id')
        .eq('id', existingUser.id)
        .maybeSingle()
      if (profErr) throw new Error(`user_profiles lookup failed: ${profErr.message}`)
      targetClientId = profile?.client_id
    }

    if (targetClientId) {
      // The plan this client is on BEFORE the update below overwrites it — the
      // value whose absence made the 2026-07-31 incident unanswerable. Read on
      // BOTH paths: a subscription checkout changes a plan just as much as a
      // package does.
      //
      // A SEPARATE read from the stacking read below, deliberately, and not
      // merged into it even though the two hit the same row a moment apart.
      // They have opposite failure policies, and merging them would force one
      // policy on the other: the stacking read is load-bearing for a paying
      // customer's months and MUST throw, while an audit read must never be
      // able to fail a checkout. Audit machinery does not get to sit on the
      // critical path, not even in its error handling.
      const prior = await readCurrentPlan(targetClientId, log)
      const fromPlan = prior.plan
      let priorSource = null
      let priorGrantUntil = null
      let priorCustomerId = null

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
          .select('plan_grant_until, plan_source, stripe_customer_id')
          .eq('id', targetClientId)
          .maybeSingle()
        if (curErr) throw new Error(`clients grant lookup failed: ${curErr.message}`)
        priorSource = cur?.plan_source ?? null
        priorGrantUntil = cur?.plan_grant_until ?? null
        priorCustomerId = cur?.stripe_customer_id ?? null

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

      // DO NOT repoint an existing stripe_customer_id on the bound path.
      //
      // Binding exists so a third party can pay: accounts payable, a parent
      // company, a reseller. That payer is a DIFFERENT Stripe Customer from the
      // client's own. Writing it here would silently repoint the client's
      // stripe_customer_id at someone else's customer record, and
      // get-subscription.js reads exactly that field to find the renewal panel
      // and set-client-plan.js to decide whether a client is Stripe-billed. A
      // client with a live subscription would lose both to a one-off package
      // paid by their finance team.
      //
      // Only on the bound path, and only when a value already exists: an
      // unbound checkout is the payer's own, and a bound client with no
      // customer id yet has nothing to lose.
      if (boundClientId && priorCustomerId && priorCustomerId !== custId) {
        delete update.stripe_customer_id
        log(`bound package: keeping client ${targetClientId} stripe_customer_id ${priorCustomerId}, NOT repointing to payer ${custId}`)
      }

      // Automatic refresh cadence follows the tier the customer just bought
      // (2026-07-31). Written here rather than anywhere else because this is one
      // of the moments a plan is established, and cadence that does not follow
      // the plan is a tier sold on a weekly refresh that never happens.
      //
      // ONLY when the prior read actually succeeded. If it did not we do not know
      // this client's category, and writing a paid cadence onto a row that might
      // be category 'research' is exactly the mistake refreshCadenceFor guards.
      // The cost of skipping is that the customer keeps 'manual' and is found by
      // one query; the cost of guessing wrong is EUR 225 of budget ceiling per
      // row. last_refresh_at is left alone: an upgrade should not restart or skip
      // a cycle already in flight.
      const cadence = prior.read ? refreshCadenceFor(plan, prior.category) : null
      if (cadence) update.refresh_cadence = cadence
      else log(`refresh_cadence NOT written for client ${targetClientId}: category unknown (prior read failed)`)

      const { error: updErr } = await supabase
        .from('clients')
        .update(update)
        .eq('id', targetClientId)
      if (updErr) throw new Error(`clients update failed: ${updErr.message}`)
      // Two hazards closed in one line, both invisible to `node --check`:
      //   - `profile` is now block-scoped to the email branch above, so naming
      //     it here was a ReferenceError on EVERY checkout, not just bound ones.
      //   - `existingUser` is null on the bound path, so dereferencing it threw
      //     a TypeError AFTER the clients row had already been updated. The
      //     outer catch deletes the idempotency row, so Stripe would redeliver,
      //     re-apply the update and throw again: a provisioned customer that
      //     looks like a permanently failing webhook.
      log(`${boundClientId ? `bound price → client ${targetClientId}` : `existing user ${existingUser.id} → client ${targetClientId}`}`
        + ` set to ${plan} (${planSource}${grantUntil ? `, until ${grantUntil}` : ''})`)
      // Audit row for the plan write immediately above. Runs after the update,
      // so it only ever claims a change that actually landed.
      await recordPlanEvent({
        client_id: targetClientId,
        type: 'stripe_change',
        from_plan: fromPlan,
        to_plan: plan,
        meta: {
          ...auditMeta(),
          // What the row held before this checkout, so a reverted plan_source
          // (trial → stripe, package → stripe) is reconstructable too — the
          // plan is not the only thing this update overwrites. Only populated
          // on the package path, which is the only one that reads them; null
          // here means "not read", not "was null".
          previous_plan_source: priorSource,
          previous_grant_until: priorGrantUntil,
          // null = the category read failed, so cadence was deliberately left
          // untouched. Not the same as "cadence is null".
          refresh_cadence: cadence,
        },
      })
      await recordAdminEvent(supabase, {
        type: eventType, client_id: targetClientId,
        title: isPackage ? `Package purchased: ${what}` : `Subscription: ${planLabel}`,
        body: isPackage
          ? `${email} bought a ${what}. Access runs to ${grantUntil}, then reverts to Free.`
          : `${email} subscribed to ${planLabel}.`,
        meta: eventMeta(),
      })
      return
    }

    // Defensive, and it should never fire: a bound package always resolves a
    // targetClientId (resolveBoundClient rejects an id with no row) and returns
    // above. Stated rather than assumed, because everything below this point
    // dereferences existingUser, which is null on the bound path.
    if (!existingUser) {
      throw new Error(`bound package (client_id=${boundClientId}) reached the user-creation branch; this is a bug`)
    }

    // Auth user exists but has no client/profile (edge case). Create a client
    // and link it to them — no invite needed, they already have a login.
    // The audit row for this plan write is emitted inside createClientRow, at
    // the INSERT that performs it; see the note there for why it lives there.
    const client = await createClientRow({ email, plan, custId, subId, planSource, grantUntil, log, audit: auditMeta() })
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
  // Audit row: emitted inside createClientRow, see the note there.
  const client = await createClientRow({ email, plan, custId, subId, planSource, grantUntil, log, audit: auditMeta() })

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

// Was this checkout preceded by a recorded acceptance of the Terms?
// (ROADMAP Stream C, C3, added 2026-07-31 after review finding S1.)
//
// WHY THIS EXISTS. accept-terms.js will not issue a checkout URL without first
// writing a terms_acceptances row, and it appends that row's reference to the
// payment link as client_reference_id. But the six links are Stripe PAYMENT
// LINKS: permanent, reusable, and sufficient on their own to pay. They are
// published in this repository, which is public, and they are in its history.
// So the gate in front of the pricing page is a gate on the ROUTE, not on the
// destination, and anyone who reads the source can pay without ever seeing the
// contract. Removing the links from the docroot did not change that and it was
// wrong to record it as if it had.
//
// This closes the half that can be closed in code: such a purchase is no longer
// INVISIBLE. It does not close the hole. Only rotating the payment links, and
// keeping their replacements out of the repository, does that.
//
// IT NEVER WITHHOLDS PROVISIONING, and that is the whole design. The money is
// already captured by the time this runs. Refusing to provision a paying
// customer because a query did not find a row would take a real defect (a
// missing acceptance record) and turn it into a much worse one (a customer who
// paid and got nothing). So this observes, records, and alerts, and provisioning
// downstream proceeds exactly as it did before.
//
// It cannot throw. A throw here would release the idempotency lock in the
// handler above and make Stripe redeliver the session forever. recordAdminEvent
// is already best-effort by construction; the try/catch covers the query.
//
// AND NOT THROWING IS NOT THE SAME AS NOT BLOCKING. This was a real regression
// in the first version of this function and is worth stating so nobody
// reintroduces it. recordAdminEvent defaults to `email: true`, which sends
// through _email.js, whose fetch to Resend has no timeout and no AbortController.
// This function runs IN FRONT OF provisioning, under the 15s ceiling in
// netlify.toml. If Resend hung, the platform would kill the invocation, and a
// platform kill is not an exception: the catch in the handler above never runs,
// so the idempotency row is never deleted, so Stripe's retry hits the 23505
// duplicate branch and returns 200 "already handled". The customer would have
// paid and never been provisioned, silently, which is the exact failure the
// admin event exists to prevent.
//
// So the alert writes the feed row and sends NO email. The row is what makes it
// visible in the product; an email is not worth putting a network call with no
// timeout in front of a paid customer's entitlement.
async function checkContractAcceptance({ session, email, plan, log }) {
  try {
    const reference = session.client_reference_id || null

    if (reference) {
      const { data: acceptance } = await supabase
        .from('terms_acceptances')
        .select('id, terms_version, plan, period')
        .eq('reference', reference)
        .maybeSingle()

      if (acceptance) {
        // Tie the contract to the purchase it authorised, so the acceptance can
        // be evidenced from either side later.
        await supabase.from('terms_acceptances').update({
          stripe_session_id: session.id,
          matched_email: email,
          matched_at: new Date().toISOString(),
        }).eq('id', acceptance.id)
        log(`contract acceptance matched: ref=${reference} v${acceptance.terms_version} (${acceptance.plan}/${acceptance.period})`)
        return
      }
      // A reference that matches nothing is more interesting than none at all:
      // it means someone constructed one, or a row was deleted.
      log(`contract acceptance NOT FOUND for reference ${reference}`)
    }

    await recordAdminEvent(supabase, {
      type: 'checkout_without_acceptance',
      client_id: null,
      // See the note above: no email. This runs in front of provisioning.
      email: false,
      title: 'Paid subscription with no recorded Terms acceptance',
      // States what was OBSERVED and offers the likeliest cause as a likelihood,
      // not as a finding. The first draft asserted "a live Stripe payment link
      // was used directly", which would have been stated as fact about sales
      // that had nothing to do with it.
      body: `${email} completed a paid ${plan} subscription that did not come through the contract gate`
          + `${reference ? `. It carried a client_reference_id (${reference}) matching no acceptance on record` : ' and carried no client_reference_id'}. `
          + 'The customer HAS been provisioned as normal; nothing is owed to them. '
          + 'The likeliest cause is that one of the live Stripe payment links was opened directly, which is possible '
          + 'because those links are permanent and are published in the public repository and its history. '
          + 'Rotating them, and keeping the replacements in env vars, is what closes that. '
          + 'Check terms_acceptances before concluding: a gate acceptance that failed to record would look identical from here.',
      meta: {
        checkout_session: session.id,
        client_reference_id: reference,
        email: email || null,
        plan: plan || null,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
      },
    })
    log('admin event raised: checkout_without_acceptance')
  } catch (e) {
    // Never let observability break provisioning.
    log('contract acceptance check failed (continuing):', e.message)
  }
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

  // The plans these clients are on BEFORE the update. This read is the only
  // moment they exist: `.update().select()` returns POST-update rows, so
  // from_plan is unrecoverable after the fact — reusing `data` below would
  // record from_plan === to_plan for every upgrade and downgrade, which is worse
  // than recording nothing because it looks like an answer.
  //
  // Best-effort by design. This handler had no read before, and a subscription
  // change must not start failing because an AUDIT read failed. On error the map
  // stays empty and from_plan lands null.
  //
  // `category` joined this read on 2026-07-31 for the refresh-cadence write in
  // the loop below. It is deliberately NOT folded into the blanket update that
  // follows: that update matches every row for the customer at once, and cadence
  // depends on each row's own category, so it is written per row from this map.
  // A row absent from the map (read failed, or created between the two queries)
  // gets no cadence write at all rather than a guessed one.
  const priorPlans = new Map()
  const priorCategories = new Map()
  const { data: before, error: beforeErr } = await supabase
    .from('clients')
    .select('id, plan, category')
    .eq('stripe_customer_id', custId)
  if (beforeErr) log('prior-plan lookup failed (continuing, from_plan will be null):', beforeErr.message)
  else for (const r of before || []) {
    priorPlans.set(r.id, r.plan ?? null)
    priorCategories.set(r.id, r.category ?? null)
  }

  const { data, error } = await supabase
    .from('clients')
    .update({ plan, stripe_subscription_id: sub.id })
    .eq('stripe_customer_id', custId)
    // `name` is selected ONLY so the admin notification can say which client
    // this was. An admin reading "A client's subscription changed" has to go
    // hunting; the whole point of the bell is to remove that step.
    .select('id, name')
  if (error) throw new Error(`clients update failed: ${error.message}`)

  if (!data || data.length === 0) {
    // No client mapped yet — likely arrived before checkout.session.completed.
    // That handler will set the plan; nothing to do here.
    log(`subscription.updated: no client for cust ${custId} yet — no-op`)
    return
  }
  log(`subscription.updated: cust ${custId} → plan ${plan} (${data.length} client row(s))`)
  for (const row of data) {
    // Automatic refresh cadence follows the tier this subscription now carries.
    // Per row, because cadence depends on the row's category and this handler can
    // match more than one. Skipped entirely when the prior read did not see this
    // row: guessing 'active' for a row that is really 'research' is the EUR 6,075
    // mistake. Best-effort — a cadence write must not fail a subscription change,
    // and the plan write above has already landed.
    let cadence = null
    if (priorCategories.has(row.id)) {
      cadence = refreshCadenceFor(plan, priorCategories.get(row.id))
      const { error: cadErr } = await supabase
        .from('clients')
        .update({ refresh_cadence: cadence })
        .eq('id', row.id)
      if (cadErr) {
        log(`refresh_cadence update failed for client ${row.id} (plan already set): ${cadErr.message}`)
        cadence = null
      }
    } else {
      log(`refresh_cadence NOT written for client ${row.id}: category unknown (prior read failed)`)
    }

    await recordPlanEvent({
      client_id: row.id,
      type: 'stripe_change',
      from_plan: priorPlans.get(row.id) ?? null,
      to_plan: plan,
      meta: {
        reason: 'subscription_updated',
        stripe_customer_id: custId,
        stripe_subscription_id: sub.id,
        price: price?.id || null,
        client_name: row.name || null,
        // null = not written (category unknown, or the cadence update failed).
        refresh_cadence: cadence,
      },
    })
    await recordAdminEvent(supabase, {
      type: 'subscription_changed', client_id: row.id,
      title: `Subscription changed to ${PLAN_LABELS[plan] || plan}: ${clientLabel(row)}`,
      body: `${clientLabel(row)} changed to ${PLAN_LABELS[plan] || plan}.`,
      meta: { plan, cust: custId, client_name: row.name || null },
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
    // `name`: see the note on the subscription.updated select above. Both
    // cancellation notices below name the client.
    // `category` is read for the refresh-cadence write on the reverting branch
    // below, and for nothing else.
    .select('id, name, plan, category, plan_source, plan_grant_until')
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

    // Note which of these writes clients.plan, because only one does and only
    // that one gets a plan audit row. The held-package branch writes
    // stripe_subscription_id ONLY and leaves plan exactly as it was — there is
    // no plan change to record, and inventing a client_events row saying
    // growth_pro → growth_pro would put noise in the one log that is supposed
    // to answer "what changed". That branch's admin_notifications row already
    // records the cancellation.
    // refresh_cadence follows plan, so it moves on exactly the branch plan moves
    // on and stays put on the other. A held package keeps its paid tier, so it
    // keeps its paid cadence; a client reverted to Free drops to Free's cadence.
    // Without this the cancelled customer would keep collecting weekly on a Free
    // plan — spend on someone who has stopped paying, capped only by the EUR 0.30
    // free budget, which would then read as a product fault rather than a
    // cancellation.
    const update = holdsLivePackage
      ? { stripe_subscription_id: null }
      : { plan: 'free', stripe_subscription_id: null, refresh_cadence: refreshCadenceFor('free', row.category) }

    const { error: updErr } = await supabase.from('clients').update(update).eq('id', row.id)
    if (updErr) throw new Error(`clients downgrade failed: ${updErr.message}`)

    if (holdsLivePackage) {
      log(`subscription.deleted: client ${row.id} keeps ${row.plan} — paid package runs to ${row.plan_grant_until}`)
      await recordAdminEvent(supabase, {
        type: 'subscription_canceled', client_id: row.id,
        title: `Subscription canceled, paid package kept: ${clientLabel(row)}`,
        body: `${clientLabel(row)} canceled their subscription but holds a paid package on `
            + `${PLAN_LABELS[row.plan] || row.plan} until ${row.plan_grant_until}. They were NOT downgraded to `
            + `Free; the package expires on its own date.`,
        meta: { cust: custId, plan: row.plan, plan_grant_until: row.plan_grant_until, downgraded: false, client_name: row.name || null },
      })
      continue
    }

    log(`subscription.deleted: client ${row.id} downgraded to free`)
    // from_plan comes off the row selected BEFORE the update at the top of this
    // handler, not from the update's result. A cancellation is the change most
    // likely to be queried later ("what were they paying for before they left"),
    // so losing it here would defeat the point.
    await recordPlanEvent({
      client_id: row.id,
      type: 'stripe_change',
      from_plan: row.plan ?? null,
      to_plan: 'free',
      meta: {
        reason: 'subscription_deleted',
        stripe_customer_id: custId,
        stripe_subscription_id: sub.id,
        previous_plan_source: row.plan_source ?? null,
        previous_grant_until: row.plan_grant_until ?? null,
        client_name: row.name || null,
      },
    })
    await recordAdminEvent(supabase, {
      type: 'subscription_canceled', client_id: row.id,
      title: `Subscription canceled: ${clientLabel(row)}`,
      body: `${clientLabel(row)} canceled and was downgraded to Free.`,
      meta: { cust: custId, downgraded: true, client_name: row.name || null },
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
//
// `audit` is the cause metadata for the client_events row this writes. The audit
// lives HERE rather than at the two call sites because the INSERT below IS the
// plan write for a brand-new client — putting it next to the write is what makes
// it impossible for a future third caller to create a client with a plan and no
// record of it. Both current callers pass auditMeta().
async function createClientRow({ email, plan, custId, subId, planSource, grantUntil, log, audit }) {
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
        // Automatic refresh cadence for the tier just purchased (2026-07-31).
        // This INSERT names no category, so the row lands on the column default
        // DEFAULT_CLIENT_CATEGORY, which is not 'research' — a Stripe checkout
        // cannot create a research client.
        //
        // last_refresh_at IS STAMPED, and it is a spend decision, not
        // bookkeeping: schedule-collections.js's isDue() reads a NULL
        // last_refresh_at as "due now", so an unstamped new subscriber would be
        // collected by the next hourly cron on top of whatever the app runs at
        // activation. Stamping starts their cadence clock at purchase, which is
        // both cheaper and what "weekly" means to someone who just paid.
        refresh_cadence: refreshCadenceFor(plan, DEFAULT_CLIENT_CATEGORY),
        last_refresh_at: new Date().toISOString(),
        default_market_id: 'WW',
      })
      .select()
      .single()
    if (!error) {
      // from_plan is null and that is correct, not a gap: this row did not
      // exist a moment ago, so there is no prior plan to record. That is also
      // the signal that distinguishes a CREATION from a CHANGE when reading the
      // log back — a stripe_provision row always has a null from_plan.
      //
      // Written before the caller's invite / user_profiles steps, which can
      // still roll back by deleting this client. That is safe and intentional:
      // client_events.client_id is `on delete cascade`, so a rolled-back
      // provisioning takes its own audit row with it and leaves no event
      // pointing at a client that does not exist.
      await recordPlanEvent({
        client_id: data.id,
        type: 'stripe_provision',
        from_plan: null,
        to_plan: plan,
        meta: { ...(audit || {}), slug, name: data.name ?? null },
      })
      return data
    }
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
/**
 * Resolve the client a package is BOUND to, from price.metadata.client_id.
 *
 * WHY THIS EXISTS. Everything else on this path identifies the buyer from the
 * PAYER'S EMAIL: email -> auth user -> user_profiles.client_id. That is correct
 * for self-serve, where the person paying is the person signing up. It is wrong
 * for a hand-sold package, where an admin agrees terms with a named client and
 * emails them a link. The moment that mail is forwarded to accounts payable, the
 * payer's address is not the account's address, and the email path provisions a
 * BRAND NEW client for the AP mailbox while the client who agreed the deal is
 * never upgraded. They have paid and nothing changed.
 *
 * So a package may name its client explicitly, and when it does, the payer's
 * identity stops mattering entirely: any card, any mailbox, any device.
 *
 * OPTIONAL BY DESIGN. Absent metadata returns {ok:true, clientId:null} and the
 * caller falls back to the email path unchanged, so every existing price keeps
 * its current behaviour. PRESENT BUT BAD fails closed: a typo'd or deleted
 * client id must not silently degrade into "create a new client from the payer's
 * email", because that is the exact failure this was built to stop, and it would
 * be indistinguishable from success in the admin feed.
 *
 * @returns {{ok:true, clientId:number|null}|{ok:false, reason:string, detail:string}}
 */
async function resolveBoundClient(price, log) {
  const raw = price && price.metadata ? price.metadata.client_id : undefined
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return { ok: true, clientId: null }
  }

  const text = String(raw).trim()
  // Strict, for the same reason resolvePackage parses months strictly: Number('')
  // is 0 and parseInt('1 BpR') is 1, and provisioning the wrong client silently
  // is worse than refusing and alerting.
  if (!/^\d+$/.test(text)) {
    return { ok: false, reason: 'invalid_client_id', detail: `price.metadata.client_id "${text}" is not a whole number` }
  }
  const clientId = Number(text)

  // The row must exist NOW, not when the link was made. A link can outlive the
  // client it names, and provisioning a deleted id would write nothing while
  // reporting success.
  const { data, error } = await supabase.from('clients').select('id, name').eq('id', clientId).maybeSingle()
  if (error) {
    // Throw, do not report: nothing has been written yet, so the outer catch
    // releases the idempotency lock and Stripe redelivers, which retries cleanly.
    // Reporting here would burn the one delivery on a transient database blip.
    throw new Error(`bound client lookup failed: ${error.message}`)
  }
  if (!data) {
    return { ok: false, reason: 'unknown_client_id', detail: `price.metadata.client_id ${clientId} matches no clients row` }
  }

  log(`package is BOUND to client ${clientId} (${data.name}); payer email is not used for resolution`)
  return { ok: true, clientId }
}

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

// Test-only surface. Netlify routes on exports.handler and ignores everything
// else, so this adds no endpoint and changes no behaviour. It exists because
// the client-binding change shipped two runtime-only defects that `node --check`
// and a careful diff read both missed: a `profile` reference left outside its
// new block scope, and an `existingUser` dereference on the path where it is
// null. Neither is reachable without calling the function.
// Harness: scripts/check-package-client-binding.js
exports.__test__ = { handleCheckoutCompleted, resolveBoundClient }
