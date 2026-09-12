/**
 * _affiliate_stripe.js -- the affiliate side of stripe-webhook.js.
 *
 * Called AFTER the existing provisioning handlers, inside a try/catch that
 * logs and never rethrows: a failed commission must not release the webhook's
 * idempotency lock and make Stripe redeliver a paid checkout (see the long
 * note on checkContractAcceptance in stripe-webhook.js for why that matters).
 *
 * Events consumed (all verified by stripe.webhooks.constructEvent upstream):
 *
 *   checkout.session.completed   -> sale conversion when the buyer is attributed
 *   invoice.paid                 -> sale (first invoice, same idempotency key as
 *                                   the checkout) or recurring (renewal)
 *   charge.refunded              -> refund reversal of the matching conversion
 *   customer.subscription.deleted-> recurring stops for that attribution
 *
 * HOW A BUYER IS ATTRIBUTED, in order:
 *   1. a promotion code on the session / invoice whose id or code matches an
 *      affiliate coupon code in an active program (coupon attribution),
 *   2. the terms_acceptances row matched by client_reference_id, when the
 *      tracking snippet handed accept-terms.js an affiliate_code,
 *   3. a stored attribution for the BrandGEO client provisioned for this
 *      customer (client:<id>), written by provision-account.js at signup,
 *   4. a stored attribution keyed on the buyer's hashed email.
 *
 * Every conversion is keyed on the Stripe INVOICE id when there is one
 * (`stripe_invoice:<in_...>`), so checkout.session.completed and the
 * invoice.paid for the same first payment collapse into one sale.
 */

const core = require('./_affiliate_core')
const service = require('./_affiliate_service')

const ACTOR = { type: 'stripe', label: 'stripe-webhook' }

async function findProgramForCoupon(supabase, { promotionCodeId = null, promotionCode = null }) {
  if (promotionCodeId) {
    const { data } = await supabase.from('affiliate_codes').select('*').eq('stripe_promotion_code_id', promotionCodeId).eq('is_active', true).limit(1)
    if (data && data[0]) return data[0]
  }
  if (promotionCode) {
    const code = core.normalizeCode(promotionCode)
    if (core.isValidCode(code)) {
      const { data } = await supabase.from('affiliate_codes').select('*').eq('code', code).eq('kind', 'coupon').eq('is_active', true).limit(1)
      if (data && data[0]) return data[0]
    }
  }
  return null
}

/** The BrandGEO program row (slug 'brandgeo'), or null if none is configured. */
async function brandgeoProgram(supabase) {
  const slug = process.env.AFFILIATE_STRIPE_PROGRAM_SLUG || 'brandgeo'
  return service.getProgramBySlug(supabase, slug)
}

async function attributionForCustomer(supabase, program, { customerId, email, clientId }) {
  if (customerId) {
    const a = await service.findAttribution(supabase, program.id, `stripe_customer:${customerId}`)
    if (a) return a
    const b = await service.findAttributionByStripe(supabase, { customerId })
    if (b && b.program_id === program.id) return b
  }
  if (clientId) {
    const a = await service.findAttribution(supabase, program.id, `client:${clientId}`)
    if (a) return a
  }
  if (email) {
    const a = await service.findAttribution(supabase, program.id, `email:${core.hashEmail(email)}`)
    if (a) return a
  }
  return null
}

async function clientIdForCustomer(supabase, customerId) {
  if (!customerId) return null
  const { data } = await supabase.from('clients').select('id').eq('stripe_customer_id', customerId).limit(1)
  return data && data[0] ? data[0].id : null
}

/**
 * Resolve the affiliate context for a payment, or null when nobody referred
 * this buyer. Returns { program, affiliate_code?, membershipId?, externalCustomerId, source }.
 */
async function resolveContext(supabase, { customerId, email, clientReferenceId, promotionCodeId, promotionCode, log }) {
  // 1. Coupon on the payment.
  const couponRow = await findProgramForCoupon(supabase, { promotionCodeId, promotionCode })
  if (couponRow) {
    const program = await service.getProgramById(supabase, couponRow.program_id)
    if (program) {
      log(`affiliate: coupon ${couponRow.code} -> program ${program.slug}`)
      return { program, affiliate_code: couponRow.code, source: 'coupon', externalCustomerId: customerId ? `stripe_customer:${customerId}` : null }
    }
  }

  // 2. The contract gate carried a referral.
  if (clientReferenceId) {
    const { data: acceptance } = await supabase.from('terms_acceptances').select('affiliate_code, affiliate_visit_token, affiliate_program').eq('reference', clientReferenceId).maybeSingle()
    if (acceptance && acceptance.affiliate_code) {
      const program = await service.getProgramBySlug(supabase, acceptance.affiliate_program || 'brandgeo')
      if (program) {
        log(`affiliate: terms acceptance carried code ${acceptance.affiliate_code}`)
        return { program, affiliate_code: acceptance.affiliate_code, visit_token: acceptance.affiliate_visit_token || null, source: 'link', externalCustomerId: customerId ? `stripe_customer:${customerId}` : null }
      }
    }
  }

  // 3 and 4. A stored attribution for the client or the email.
  const program = await brandgeoProgram(supabase)
  if (!program) return null
  const clientId = await clientIdForCustomer(supabase, customerId)
  const attribution = await attributionForCustomer(supabase, program, { customerId, email, clientId })
  if (attribution) {
    log(`affiliate: stored attribution ${attribution.id} (${attribution.source}) for ${attribution.external_customer_id}`)
    return { program, membershipId: attribution.membership_id, source: attribution.source, externalCustomerId: attribution.external_customer_id, viaAttribution: true }
  }
  return null
}

function promoFromSession(session) {
  const d = session && Array.isArray(session.discounts) ? session.discounts[0] : null
  if (!d) return { promotionCodeId: null, promotionCode: null }
  const pc = d.promotion_code
  if (typeof pc === 'string') return { promotionCodeId: pc, promotionCode: null }
  if (pc && typeof pc === 'object') return { promotionCodeId: pc.id || null, promotionCode: pc.code || null }
  return { promotionCodeId: null, promotionCode: null }
}

function promoFromInvoice(invoice) {
  const d = invoice && Array.isArray(invoice.discounts) ? invoice.discounts[0] : null
  if (d && typeof d === 'object' && d.promotion_code) {
    const pc = d.promotion_code
    if (typeof pc === 'string') return { promotionCodeId: pc, promotionCode: null }
    return { promotionCodeId: pc.id || null, promotionCode: pc.code || null }
  }
  const legacy = invoice && invoice.discount && invoice.discount.promotion_code
  if (legacy) return typeof legacy === 'string' ? { promotionCodeId: legacy, promotionCode: null } : { promotionCodeId: legacy.id || null, promotionCode: legacy.code || null }
  return { promotionCodeId: null, promotionCode: null }
}

async function record(supabase, ctx, { key, type, amountCents, currency, occurredAt, externalId, customerEmail, stripe, log }) {
  const input = {
    idempotency_key: key,
    conversion_type: type,
    affiliate_code: ctx.affiliate_code || null,
    visit_token: ctx.visit_token || null,
    external_id: externalId,
    external_customer_id: ctx.externalCustomerId,
    customer_email: customerEmail || null,
    amount_cents: amountCents,
    currency,
    status: 'confirmed',
    occurred_at: occurredAt,
    metadata: { via: 'stripe' },
  }
  // A payment matched through a stored attribution keeps that attribution's
  // source (link, form, api, manual): it says how the customer was referred.
  // A payment attributed on the spot is 'coupon' or 'stripe'.
  const source = ctx.viaAttribution ? ctx.source : (ctx.source === 'coupon' ? 'coupon' : 'stripe')
  const result = await service.recordConversion(supabase, {
    program: ctx.program, input, actor: ACTOR, source,
    membershipId: ctx.viaAttribution ? ctx.membershipId : null, stripe,
  })
  if (!result.ok) log(`affiliate: conversion refused (${result.error})`)
  else log(`affiliate: ${type} ${result.duplicate ? 'already recorded' : 'recorded'} ${result.conversion.id} commission=${result.commission ? result.commission.amount_cents : 0}`)
  return result
}

async function onCheckoutCompleted(supabase, session, log) {
  const email = (session.customer_details && session.customer_details.email) || session.customer_email || null
  const customerId = typeof session.customer === 'string' ? session.customer : (session.customer && session.customer.id) || null
  const ctx = await resolveContext(supabase, {
    customerId, email, clientReferenceId: session.client_reference_id || null, ...promoFromSession(session), log,
  })
  if (!ctx) { log('affiliate: checkout not attributed'); return null }
  const invoiceId = typeof session.invoice === 'string' ? session.invoice : (session.invoice && session.invoice.id) || null
  const piId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || null
  const subId = typeof session.subscription === 'string' ? session.subscription : (session.subscription && session.subscription.id) || null
  const key = invoiceId ? `stripe_invoice:${invoiceId}` : `stripe_session:${session.id}`
  return record(supabase, ctx, {
    key, type: 'sale', amountCents: Number(session.amount_total || 0), currency: String(session.currency || 'eur').toUpperCase(),
    occurredAt: session.created ? new Date(session.created * 1000).toISOString() : new Date().toISOString(),
    externalId: invoiceId || session.id, customerEmail: email,
    stripe: { checkout_session_id: session.id, invoice_id: invoiceId, payment_intent_id: piId, subscription_id: subId, customer_id: customerId }, log,
  })
}

async function onInvoicePaid(supabase, invoice, log) {
  if (!invoice || Number(invoice.amount_paid || 0) <= 0) { log('affiliate: zero invoice, nothing to commission'); return null }
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer && invoice.customer.id) || null
  const subId = typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription && invoice.subscription.id) || null
  const email = invoice.customer_email || null
  const isRenewal = invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_update'

  let ctx = null
  if (isRenewal) {
    // Renewals follow the attribution locked by the first sale, never a new touch.
    const attribution = await service.findAttributionByStripe(supabase, { subscriptionId: subId, customerId })
    if (!attribution) { log('affiliate: renewal has no attribution'); return null }
    const program = await service.getProgramById(supabase, attribution.program_id)
    if (!program) return null
    ctx = { program, membershipId: attribution.membership_id, source: attribution.source, externalCustomerId: attribution.external_customer_id, viaAttribution: true }
  } else {
    ctx = await resolveContext(supabase, { customerId, email, clientReferenceId: null, ...promoFromInvoice(invoice), log })
    if (!ctx) { log('affiliate: invoice not attributed'); return null }
  }
  const piId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : (invoice.payment_intent && invoice.payment_intent.id) || null
  const chargeId = typeof invoice.charge === 'string' ? invoice.charge : (invoice.charge && invoice.charge.id) || null
  return record(supabase, ctx, {
    key: `stripe_invoice:${invoice.id}`, type: isRenewal ? 'recurring' : 'sale',
    amountCents: Number(invoice.amount_paid || 0), currency: String(invoice.currency || 'eur').toUpperCase(),
    occurredAt: invoice.status_transitions && invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString(),
    externalId: invoice.id, customerEmail: email,
    stripe: { invoice_id: invoice.id, payment_intent_id: piId, charge_id: chargeId, subscription_id: subId, customer_id: customerId }, log,
  })
}

async function onChargeRefunded(supabase, charge, log) {
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : (charge.payment_intent && charge.payment_intent.id) || null
  const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : (charge.invoice && charge.invoice.id) || null
  let conversion = null
  if (invoiceId) {
    const { data } = await supabase.from('affiliate_conversions').select('*').eq('stripe_invoice_id', invoiceId).limit(1)
    conversion = data && data[0] ? data[0] : null
  }
  if (!conversion && piId) {
    const { data } = await supabase.from('affiliate_conversions').select('*').eq('stripe_payment_intent_id', piId).limit(1)
    conversion = data && data[0] ? data[0] : null
  }
  if (!conversion && charge.id) {
    const { data } = await supabase.from('affiliate_conversions').select('*').eq('stripe_charge_id', charge.id).limit(1)
    conversion = data && data[0] ? data[0] : null
  }
  if (!conversion) { log('affiliate: refund matches no conversion'); return null }
  const full = Number(charge.amount_refunded || 0) >= Number(charge.amount || 0)
  if (!full) {
    // Partial refunds are flagged for a human: the commission may or may not be owed.
    await supabase.from('affiliate_conversions').update({ flags: Array.from(new Set([...(conversion.flags || []), 'partial_refund'])) }).eq('id', conversion.id)
    await service.audit(supabase, { actor: ACTOR, action: 'conversion.partial_refund', entityType: 'conversion', entityId: conversion.id, programId: conversion.program_id, after: { amount_refunded: charge.amount_refunded } })
    log(`affiliate: partial refund flagged on ${conversion.id}`)
    return { partial: true }
  }
  const result = await service.reverseConversion(supabase, { conversionId: conversion.id, newStatus: 'refunded', reason: `Stripe charge ${charge.id} refunded`, actor: ACTOR })
  log(`affiliate: refund reversed ${conversion.id} (${(result.commissions || []).length} commission rows touched)`)
  return result
}

async function onSubscriptionDeleted(supabase, sub, log) {
  const r = await service.markSubscriptionEnded(supabase, { subscriptionId: sub.id, actor: ACTOR })
  log(r ? `affiliate: recurring stopped for attribution ${r.id}` : 'affiliate: deleted subscription has no attribution')
  return r
}

/** One entry point for the webhook. Never throws. */
async function handleStripeEvent(supabase, type, object, log) {
  try {
    if (type === 'checkout.session.completed') return await onCheckoutCompleted(supabase, object, log)
    if (type === 'invoice.paid') return await onInvoicePaid(supabase, object, log)
    if (type === 'charge.refunded') return await onChargeRefunded(supabase, object, log)
    if (type === 'customer.subscription.deleted') return await onSubscriptionDeleted(supabase, object, log)
    return null
  } catch (e) {
    log('affiliate hook failed (continuing):', e.message)
    return null
  }
}

module.exports = { handleStripeEvent, onCheckoutCompleted, onInvoicePaid, onChargeRefunded, onSubscriptionDeleted, resolveContext, promoFromSession, promoFromInvoice }
