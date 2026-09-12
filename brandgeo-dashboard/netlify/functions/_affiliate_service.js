/**
 * _affiliate_service.js -- the ONE write path for attributions, conversions and
 * commissions. Every caller (the public conversion API, the Stripe webhook,
 * provision-account's lead hook and the admin's manual entry) goes through
 * recordConversion() and reverseConversion() here, so the rules in
 * _affiliate_core.js are applied once and the audit log is written once.
 *
 * Takes a service-role supabase client. Uses only the query shapes the
 * in-memory fake in tests/helpers/fake_supabase_mem.js supports (no embedded
 * selects, no upsert): joins are done in memory, which is fine at this scale
 * and keeps the whole flow testable without a database.
 *
 * Never throws on the audit log or on email. Throws on a failed financial
 * write, so a caller can decide whether to surface it (the API returns 500,
 * the Stripe hook swallows and logs so provisioning is never blocked).
 */

const core = require('./_affiliate_core')
const emails = require('./_affiliate_email')

const ACTIVE = 'active'

// ── Audit log ────────────────────────────────────────────────────────────────

async function audit(supabase, { actor, action, entityType, entityId, programId = null, affiliateId = null, before = null, after = null, reason = null }) {
  try {
    const a = actor || { type: 'system' }
    await supabase.from('affiliate_audit_log').insert({
      actor_type: a.type || 'system',
      actor_id: a.id ? String(a.id) : null,
      actor_label: a.label || null,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      program_id: programId,
      affiliate_id: affiliateId,
      before,
      after,
      reason,
    })
  } catch (e) {
    console.warn('[affiliate] audit insert failed:', e.message)
  }
}

// ── Lookups ──────────────────────────────────────────────────────────────────

async function getProgramBySlug(supabase, slug) {
  if (!core.isValidSlug(slug)) return null
  const { data, error } = await supabase.from('affiliate_programs').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(`program lookup failed: ${error.message}`)
  return data || null
}

async function getProgramById(supabase, id) {
  const { data, error } = await supabase.from('affiliate_programs').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`program lookup failed: ${error.message}`)
  return data || null
}

async function getMembership(supabase, id) {
  const { data, error } = await supabase.from('affiliate_memberships').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`membership lookup failed: ${error.message}`)
  return data || null
}

async function getAffiliate(supabase, id) {
  const { data, error } = await supabase.from('affiliates').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`affiliate lookup failed: ${error.message}`)
  return data || null
}

/**
 * findCode(supabase, programId, code) -> { code, membership, affiliate } | null
 * Case-insensitive on the stored value (codes are upper-cased on write).
 */
async function findCode(supabase, programId, rawCode) {
  const code = core.normalizeCode(rawCode)
  if (!core.isValidCode(code)) return null
  const { data, error } = await supabase.from('affiliate_codes').select('*').eq('program_id', programId).eq('code', code).maybeSingle()
  if (error) throw new Error(`code lookup failed: ${error.message}`)
  if (!data) return null
  const membership = await getMembership(supabase, data.membership_id)
  const affiliate = membership ? await getAffiliate(supabase, membership.affiliate_id) : null
  return { code: data, membership, affiliate }
}

async function findVisit(supabase, visitToken) {
  if (!visitToken || typeof visitToken !== 'string' || visitToken.length > 64) return null
  const { data, error } = await supabase.from('affiliate_visits').select('*').eq('visit_token', visitToken).maybeSingle()
  if (error) throw new Error(`visit lookup failed: ${error.message}`)
  return data || null
}

async function findAttribution(supabase, programId, externalCustomerId) {
  if (!externalCustomerId) return null
  const { data, error } = await supabase.from('affiliate_attributions').select('*')
    .eq('program_id', programId).eq('external_customer_id', externalCustomerId).maybeSingle()
  if (error) throw new Error(`attribution lookup failed: ${error.message}`)
  return data || null
}

async function findAttributionByStripe(supabase, { subscriptionId = null, customerId = null }) {
  if (subscriptionId) {
    const { data, error } = await supabase.from('affiliate_attributions').select('*').eq('stripe_subscription_id', subscriptionId).limit(1)
    if (error) throw new Error(`attribution lookup failed: ${error.message}`)
    if (data && data[0]) return data[0]
  }
  if (customerId) {
    const { data, error } = await supabase.from('affiliate_attributions').select('*').eq('stripe_customer_id', customerId).limit(1)
    if (error) throw new Error(`attribution lookup failed: ${error.message}`)
    if (data && data[0]) return data[0]
  }
  return null
}

/**
 * The resolver behind /r/:program/:code. Returns everything the redirect needs
 * or a refusal reason. Only an ACTIVE program, an ACTIVE membership, an ACTIVE
 * affiliate and an active link code redirect with tracking; anything else
 * still sends the visitor to the destination (a dead link must not be a dead
 * page) but records nothing.
 */
async function resolveReferralLink(supabase, programSlug, rawCode) {
  const program = await getProgramBySlug(supabase, programSlug)
  if (!program) return { ok: false, reason: 'unknown_program' }
  if (program.status !== ACTIVE) return { ok: false, reason: 'program_not_active', program }
  const found = await findCode(supabase, program.id, rawCode)
  if (!found || !found.membership || !found.affiliate) return { ok: false, reason: 'unknown_code', program }
  if (found.code.kind !== 'link' || !found.code.is_active) return { ok: false, reason: 'code_inactive', program }
  if (found.membership.status !== ACTIVE) return { ok: false, reason: 'membership_not_active', program }
  if (found.affiliate.status !== ACTIVE) return { ok: false, reason: 'affiliate_not_active', program }
  return { ok: true, program, ...found }
}

// ── Attribution ──────────────────────────────────────────────────────────────

/**
 * upsertAttribution(supabase, { program, membership, externalCustomerId, source, now, visit, codeRow, customerRef, actor, manualReason })
 *   -> { attribution, membership_id, flags, winner }
 *
 * Applies core.decideAttribution against whatever is stored for this customer
 * identity, then writes the winner. The returned membership_id is the one the
 * conversion must be credited to, which may differ from the touch that
 * arrived (a locked, converted customer keeps their original affiliate).
 */
async function upsertAttribution(supabase, { program, membership, externalCustomerId, source, now, visit = null, codeRow = null, customerRef = null, actor = null, manualReason = null, isSelfReferral = false }) {
  const nowIso = new Date(now).toISOString()
  const existing = await findAttribution(supabase, program.id, externalCustomerId)
  const touchAt = visit ? visit.created_at : nowIso
  const expiresAt = source === 'link' || source === 'form'
    ? core.addDays(touchAt, program.attribution_days ?? 30).toISOString()
    : null
  const incoming = { membership_id: membership.id, source, at: nowIso, expires_at: expiresAt }
  const decision = core.decideAttribution({ existing, incoming, mode: program.attribution_mode, now: nowIso })
  const flags = [...decision.flags]

  if (decision.winner === 'existing') {
    const patch = { last_touch_at: nowIso }
    if (flags.length) patch.flags = Array.from(new Set([...(existing.flags || []), ...flags]))
    const { data, error } = await supabase.from('affiliate_attributions').update(patch).eq('id', existing.id).select('*').single()
    if (error) throw new Error(`attribution update failed: ${error.message}`)
    return { attribution: data, membership_id: existing.membership_id, flags, winner: 'existing' }
  }

  if (existing) {
    const patch = {
      membership_id: membership.id,
      source,
      visit_id: visit ? visit.id : existing.visit_id,
      visit_token: visit ? visit.visit_token : existing.visit_token,
      code_id: codeRow ? codeRow.id : existing.code_id,
      last_touch_at: nowIso,
      expires_at: expiresAt,
      customer_ref: customerRef || existing.customer_ref,
      is_self_referral: isSelfReferral || existing.is_self_referral,
      flags: Array.from(new Set([...(existing.flags || []), ...flags])),
      created_by: actor && actor.type === 'admin' ? actor.id : existing.created_by,
      manual_reason: manualReason || existing.manual_reason,
    }
    const { data, error } = await supabase.from('affiliate_attributions').update(patch).eq('id', existing.id).select('*').single()
    if (error) throw new Error(`attribution reassign failed: ${error.message}`)
    await audit(supabase, {
      actor, action: 'attribution.reassigned', entityType: 'attribution', entityId: existing.id,
      programId: program.id, affiliateId: membership.affiliate_id,
      before: { membership_id: existing.membership_id, source: existing.source }, after: { membership_id: membership.id, source }, reason: manualReason,
    })
    return { attribution: data, membership_id: membership.id, flags, winner: 'incoming' }
  }

  const row = {
    program_id: program.id,
    membership_id: membership.id,
    external_customer_id: externalCustomerId,
    customer_ref: customerRef,
    source,
    visit_id: visit ? visit.id : null,
    visit_token: visit ? visit.visit_token : null,
    code_id: codeRow ? codeRow.id : null,
    first_touch_at: touchAt,
    last_touch_at: nowIso,
    expires_at: expiresAt,
    is_self_referral: !!isSelfReferral,
    flags,
    created_by: actor && actor.type === 'admin' ? actor.id : null,
    manual_reason: manualReason,
  }
  const { data, error } = await supabase.from('affiliate_attributions').insert(row).select('*').single()
  if (error) throw new Error(`attribution insert failed: ${error.message}`)
  return { attribution: data, membership_id: membership.id, flags, winner: 'incoming' }
}

// ── Conversions ──────────────────────────────────────────────────────────────

/**
 * recordConversion(supabase, { program, input, actor, source, membershipId, stripe, now })
 *
 * input: the validated shape from core.validateConversionInput (plus optional
 *        customer_email, manual_reason).
 * source: link | coupon | form | api | stripe | manual (may be refined to
 *         'coupon' when the code found is a coupon).
 * membershipId: set only by an admin's manual attribution.
 *
 * Returns { ok: true, conversion, commission, attribution, duplicate }
 *      or { ok: false, status, error }.
 */
async function recordConversion(supabase, { program, input, actor = { type: 'system' }, source = 'api', membershipId = null, stripe = null, now = new Date(), notify = true }) {
  if (!program) return { ok: false, status: 404, error: 'Unknown program' }
  if (program.status === 'archived') return { ok: false, status: 422, error: 'This program is archived' }
  const nowIso = new Date(now).toISOString()
  const occurredAt = input.occurred_at || nowIso

  // 1. Idempotency: an existing key returns the existing conversion, no writes.
  {
    const { data, error } = await supabase.from('affiliate_conversions').select('*').eq('idempotency_key', input.idempotency_key).maybeSingle()
    if (error) throw new Error(`idempotency lookup failed: ${error.message}`)
    if (data) {
      const { data: comm } = await supabase.from('affiliate_commissions').select('*').eq('conversion_id', data.id).limit(1)
      return { ok: true, duplicate: true, conversion: data, commission: comm && comm[0] ? comm[0] : null, attribution: null }
    }
  }

  // 2. Second dedupe layer: same order / lead in the same program.
  const dedupeId = input.external_id || null
  if (dedupeId) {
    const { data, error } = await supabase.from('affiliate_conversions').select('*')
      .eq('program_id', program.id).eq('conversion_type', input.conversion_type).eq('external_id', dedupeId).limit(1)
    if (error) throw new Error(`dedupe lookup failed: ${error.message}`)
    if (data && data[0]) {
      const { data: comm } = await supabase.from('affiliate_commissions').select('*').eq('conversion_id', data[0].id).limit(1)
      return { ok: true, duplicate: true, reason: 'external_id_exists', conversion: data[0], commission: comm && comm[0] ? comm[0] : null, attribution: null }
    }
  }

  // 3. Who is this for? Resolve the touch that brought the customer.
  let membership = null
  let affiliate = null
  let codeRow = null
  let visit = null
  let resolvedSource = source
  let manualReason = input.manual_reason || null

  if (membershipId) {
    membership = await getMembership(supabase, membershipId)
    if (!membership || membership.program_id !== program.id) return { ok: false, status: 422, error: 'Membership does not belong to this program' }
    affiliate = await getAffiliate(supabase, membership.affiliate_id)
    // The caller names the membership, so it also names the source: the admin's
    // manual conversion passes 'manual'; a Stripe payment matched through a
    // stored attribution passes that attribution's own source. Forcing 'manual'
    // here would let a renewal rewrite a link attribution as an admin override,
    // which then beats every later coupon (see decideAttribution).
    resolvedSource = source
  } else if (input.affiliate_code) {
    const found = await findCode(supabase, program.id, input.affiliate_code)
    if (!found || !found.membership) return { ok: false, status: 422, error: 'Unknown affiliate code for this program' }
    membership = found.membership
    affiliate = found.affiliate
    codeRow = found.code
    if (found.code.kind === 'coupon') resolvedSource = 'coupon'
    else if (source === 'api') resolvedSource = 'api'
  } else if (input.visit_token) {
    visit = await findVisit(supabase, input.visit_token)
    if (!visit || visit.program_id !== program.id) return { ok: false, status: 422, error: 'Unknown referral id for this program' }
    membership = await getMembership(supabase, visit.membership_id)
    affiliate = membership ? await getAffiliate(supabase, membership.affiliate_id) : null
    if (visit.code_id) {
      const { data } = await supabase.from('affiliate_codes').select('*').eq('id', visit.code_id).maybeSingle()
      codeRow = data || null
    }
    resolvedSource = 'link'
  }

  // 4. The customer identity the attribution is keyed on.
  const emailHash = input.customer_email ? core.hashEmail(input.customer_email) : null
  const externalCustomerId = input.external_customer_id
    || (emailHash ? `email:${emailHash}` : null)
    || (input.visit_token ? `visit:${input.visit_token}` : null)
    || (input.external_id ? `ext:${input.external_id}` : null)
    || `conv:${input.idempotency_key}`
  const customerRef = input.customer_ref
    || (input.customer_email ? core.maskEmail(input.customer_email) : null)
    || (input.external_customer_id ? `customer ${core.shortRef(input.external_customer_id)}` : null)

  if (!membership) {
    // No touch on this call: fall back to a stored attribution for the identity.
    const existing = await findAttribution(supabase, program.id, externalCustomerId)
    if (!existing) return { ok: false, status: 422, error: 'No affiliate could be attributed: send affiliate_code, referral_id or a known customer id' }
    membership = await getMembership(supabase, existing.membership_id)
    affiliate = membership ? await getAffiliate(supabase, membership.affiliate_id) : null
    resolvedSource = existing.source
  }
  if (!membership || !affiliate) return { ok: false, status: 422, error: 'Affiliate membership not found' }

  const selfReferral = core.isSelfReferral({ affiliate, customerEmail: input.customer_email || null, customerEmailHash: emailHash })

  // 5. Attribution policy (last touch, first touch, coupon override, lock).
  const att = await upsertAttribution(supabase, {
    program, membership, externalCustomerId, source: resolvedSource, now: nowIso, visit, codeRow, customerRef, actor, manualReason, isSelfReferral: selfReferral,
  })
  if (att.membership_id !== membership.id) {
    membership = await getMembership(supabase, att.membership_id)
    affiliate = await getAffiliate(supabase, membership.affiliate_id)
  }
  const flags = [...att.flags]
  if (selfReferral) flags.push('self_referral')
  if (membership.status !== ACTIVE) flags.push('membership_not_active')
  if (program.status !== ACTIVE) flags.push('program_not_active')
  if (affiliate.status !== ACTIVE) flags.push('affiliate_not_active')

  // 6. Write the conversion.
  const currency = (input.currency || program.currency || 'EUR').toUpperCase()
  if (currency !== (program.currency || 'EUR')) flags.push('currency_mismatch')

  const convRow = {
    program_id: program.id,
    membership_id: membership.id,
    attribution_id: att.attribution.id,
    idempotency_key: input.idempotency_key,
    external_id: input.external_id || null,
    external_customer_id: externalCustomerId,
    customer_ref: customerRef,
    conversion_type: input.conversion_type,
    amount_cents: input.amount_cents || 0,
    currency,
    status: input.status || 'confirmed',
    source: resolvedSource,
    occurred_at: occurredAt,
    parent_conversion_id: null,
    stripe_checkout_session_id: stripe ? stripe.checkout_session_id || null : null,
    stripe_invoice_id: stripe ? stripe.invoice_id || null : null,
    stripe_payment_intent_id: stripe ? stripe.payment_intent_id || null : null,
    stripe_charge_id: stripe ? stripe.charge_id || null : null,
    stripe_subscription_id: stripe ? stripe.subscription_id || null : null,
    stripe_customer_id: stripe ? stripe.customer_id || null : null,
    is_self_referral: selfReferral,
    flags: Array.from(new Set(flags)),
    metadata: input.metadata || {},
    created_by: actor && actor.type === 'admin' ? actor.id : null,
    manual_reason: manualReason,
  }

  if (input.conversion_type === 'recurring') {
    const { data: parent } = await supabase.from('affiliate_conversions').select('*')
      .eq('attribution_id', att.attribution.id).eq('conversion_type', 'sale').order('occurred_at', { ascending: true }).limit(1)
    if (parent && parent[0]) convRow.parent_conversion_id = parent[0].id
  }

  const { data: conversion, error: convErr } = await supabase.from('affiliate_conversions').insert(convRow).select('*').single()
  if (convErr) {
    if (convErr.code === '23505') {
      const { data } = await supabase.from('affiliate_conversions').select('*').eq('idempotency_key', input.idempotency_key).maybeSingle()
      if (data) return { ok: true, duplicate: true, conversion: data, commission: null, attribution: att.attribution }
    }
    throw new Error(`conversion insert failed: ${convErr.message}`)
  }

  // 7. Lock the attribution on the first sale and mark Stripe ids for renewals.
  const rules = core.effectiveRules(program, membership)
  const attPatch = {}
  if (input.conversion_type === 'sale' && !att.attribution.converted_at) {
    attPatch.converted_at = occurredAt
    attPatch.first_sale_at = occurredAt
    const until = core.recurringUntil(rules, occurredAt)
    attPatch.recurring_until = until ? until.toISOString() : null
  }
  if (stripe && stripe.customer_id && !att.attribution.stripe_customer_id) attPatch.stripe_customer_id = stripe.customer_id
  if (stripe && stripe.subscription_id && !att.attribution.stripe_subscription_id) attPatch.stripe_subscription_id = stripe.subscription_id
  let attribution = att.attribution
  if (Object.keys(attPatch).length) {
    const { data, error } = await supabase.from('affiliate_attributions').update(attPatch).eq('id', att.attribution.id).select('*').single()
    if (error) throw new Error(`attribution lock failed: ${error.message}`)
    attribution = data
  }

  // 8. The commission, computed here and nowhere else.
  let commission = null
  const blocked = flags.find((f) => f === 'membership_not_active' || f === 'program_not_active' || f === 'affiliate_not_active')
  const calc = blocked
    ? { amountCents: 0, snapshot: { rule: 'blocked' }, reason: blocked }
    : core.computeCommission({ rules, conversionType: input.conversion_type, amountCents: input.amount_cents || 0, occurredAt, attribution })

  if (calc.amountCents > 0 && (input.status || 'confirmed') === 'confirmed') {
    const commRow = {
      conversion_id: conversion.id,
      program_id: program.id,
      membership_id: membership.id,
      affiliate_id: affiliate.id,
      amount_cents: calc.amountCents,
      currency,
      rule_snapshot: calc.snapshot,
      status: 'pending',
      approve_after: core.approveAfter(occurredAt, rules.approval_days).toISOString(),
      notes: selfReferral ? 'Flagged: possible self-referral, review before approving.' : null,
    }
    const { data, error } = await supabase.from('affiliate_commissions').insert(commRow).select('*').single()
    if (error) throw new Error(`commission insert failed: ${error.message}`)
    commission = data
  } else if (calc.reason) {
    await supabase.from('affiliate_conversions').update({ metadata: { ...(conversion.metadata || {}), no_commission_reason: calc.reason } }).eq('id', conversion.id)
  }

  await audit(supabase, {
    actor, action: 'conversion.recorded', entityType: 'conversion', entityId: conversion.id,
    programId: program.id, affiliateId: affiliate.id,
    after: { type: conversion.conversion_type, amount_cents: conversion.amount_cents, currency, source: resolvedSource, commission_cents: commission ? commission.amount_cents : 0, flags: convRow.flags },
    reason: manualReason,
  })

  if (notify && commission) {
    try { await emails.sendNewConversion({ affiliate, program, conversion, commission }) } catch (e) { console.warn('[affiliate] conversion email failed:', e.message) }
  }

  return { ok: true, duplicate: false, conversion, commission, attribution }
}

/**
 * reverseConversion(supabase, { conversionId, newStatus: 'refunded'|'cancelled', reason, actor })
 *
 * Unpaid commissions (pending, approved, payable) become `reversed`; a payable
 * one is also pulled out of its draft batch. A PAID commission is never
 * touched: it is flagged for reconciliation so a human decides about the
 * clawback (docs/affiliates/ADMIN-GUIDE.md, "Refunds after payout").
 */
async function reverseConversion(supabase, { conversionId, newStatus = 'refunded', reason = null, actor = { type: 'system' }, now = new Date() }) {
  const nowIso = new Date(now).toISOString()
  const { data: conversion, error } = await supabase.from('affiliate_conversions').select('*').eq('id', conversionId).maybeSingle()
  if (error) throw new Error(`conversion lookup failed: ${error.message}`)
  if (!conversion) return { ok: false, status: 404, error: 'Conversion not found' }
  if (conversion.status !== 'confirmed') return { ok: true, alreadyReversed: true, conversion, commissions: [] }

  const { data: updated, error: updErr } = await supabase.from('affiliate_conversions')
    .update({ status: newStatus, reversed_at: nowIso, reversal_reason: reason }).eq('id', conversion.id).select('*').single()
  if (updErr) throw new Error(`conversion reversal failed: ${updErr.message}`)

  const { data: commissions } = await supabase.from('affiliate_commissions').select('*').eq('conversion_id', conversion.id)
  const results = []
  for (const c of commissions || []) {
    if (c.status === 'paid') {
      const { data } = await supabase.from('affiliate_commissions').update({
        reconciliation_flag: true,
        reconciliation_note: `Conversion ${newStatus} on ${nowIso} after payout${reason ? `: ${reason}` : ''}. Decide clawback by hand.`,
      }).eq('id', c.id).select('*').single()
      results.push(data || c)
      await audit(supabase, { actor, action: 'commission.flagged_reconciliation', entityType: 'commission', entityId: c.id, programId: c.program_id, affiliateId: c.affiliate_id, before: { status: c.status }, after: { reconciliation_flag: true }, reason })
      continue
    }
    if (c.status === 'reversed' || c.status === 'rejected') { results.push(c); continue }
    if (c.status === 'payable' && c.payout_item_id) {
      // Pull it out of the draft batch and fix the batch totals.
      const { data: item } = await supabase.from('affiliate_payout_items').select('*').eq('id', c.payout_item_id).maybeSingle()
      if (item) {
        await supabase.from('affiliate_payout_items').delete().eq('id', item.id)
        const { data: batch } = await supabase.from('affiliate_payout_batches').select('*').eq('id', item.batch_id).maybeSingle()
        if (batch && batch.status === 'draft') {
          await supabase.from('affiliate_payout_batches').update({
            total_cents: Number(batch.total_cents) - Number(item.amount_cents),
            item_count: Number(batch.item_count) - 1,
          }).eq('id', batch.id)
        }
      }
    }
    const { data } = await supabase.from('affiliate_commissions').update({
      status: 'reversed', reversal_reason: reason || `conversion ${newStatus}`, payout_item_id: null,
    }).eq('id', c.id).select('*').single()
    results.push(data || c)
    await audit(supabase, { actor, action: 'commission.reversed', entityType: 'commission', entityId: c.id, programId: c.program_id, affiliateId: c.affiliate_id, before: { status: c.status }, after: { status: 'reversed' }, reason })
  }

  await audit(supabase, { actor, action: `conversion.${newStatus}`, entityType: 'conversion', entityId: conversion.id, programId: conversion.program_id, before: { status: 'confirmed' }, after: { status: newStatus }, reason })
  return { ok: true, conversion: updated, commissions: results }
}

/**
 * markSubscriptionEnded: stops recurring commission for an attribution when a
 * Stripe subscription is deleted. Never touches existing commissions.
 */
async function markSubscriptionEnded(supabase, { subscriptionId, now = new Date(), actor = { type: 'stripe' } }) {
  const attribution = await findAttributionByStripe(supabase, { subscriptionId })
  if (!attribution) return null
  const nowIso = new Date(now).toISOString()
  const { data } = await supabase.from('affiliate_attributions').update({ subscription_ended_at: nowIso }).eq('id', attribution.id).select('*').single()
  await audit(supabase, { actor, action: 'attribution.subscription_ended', entityType: 'attribution', entityId: attribution.id, programId: attribution.program_id, after: { subscription_ended_at: nowIso } })
  return data || attribution
}

/**
 * Manual attribution by an admin: ties a customer identity to a membership
 * without recording a conversion. Records who, why and when.
 */
async function manualAttribute(supabase, { program, membershipId, externalCustomerId, customerRef, reason, actor, now = new Date() }) {
  const membership = await getMembership(supabase, membershipId)
  if (!membership || membership.program_id !== program.id) return { ok: false, status: 422, error: 'Membership does not belong to this program' }
  const att = await upsertAttribution(supabase, {
    program, membership, externalCustomerId, source: 'manual', now, customerRef, actor, manualReason: reason,
  })
  await audit(supabase, { actor, action: 'attribution.manual', entityType: 'attribution', entityId: att.attribution.id, programId: program.id, affiliateId: membership.affiliate_id, after: { membership_id: membership.id, external_customer_id: externalCustomerId }, reason })
  return { ok: true, attribution: att.attribution }
}

/**
 * promoCodeForReferral(supabase, programSlug, rawCode) -> string | null
 *
 * The coupon code Stripe should prefill at checkout for a customer who arrived
 * through this referral (the referred customer's discount, ruled 2026-09-12).
 * The referral code is usually a link code; the discount lives on the same
 * membership's active coupon code that is bound to a Stripe promotion code
 * (stripe_promotion_code_id). If the referral code is itself such a coupon
 * code it is returned as is. Anything short of an active program, an active
 * referral code, an active membership and an active affiliate returns null:
 * the discount is a courtesy that must never block a purchase, so the caller
 * treats null as "send the plain link".
 */
async function promoCodeForReferral(supabase, programSlug, rawCode) {
  const program = await getProgramBySlug(supabase, programSlug)
  if (!program || program.status !== ACTIVE) return null
  const found = await findCode(supabase, program.id, rawCode)
  if (!found || !found.membership || !found.affiliate) return null
  if (!found.code.is_active) return null
  if (found.membership.status !== ACTIVE || found.affiliate.status !== ACTIVE) return null
  const bound = (c) => !!c && c.kind === 'coupon' && c.is_active === true && !!c.stripe_promotion_code_id
  if (bound(found.code)) return found.code.code
  const { data, error } = await supabase.from('affiliate_codes').select('*')
    .eq('membership_id', found.membership.id).eq('kind', 'coupon').eq('is_active', true)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`coupon lookup failed: ${error.message}`)
  const coupon = (data || []).find(bound)
  return coupon ? coupon.code : null
}

module.exports = {
  audit,
  getProgramBySlug, getProgramById, getMembership, getAffiliate, findCode, findVisit, findAttribution, findAttributionByStripe,
  resolveReferralLink, promoCodeForReferral, upsertAttribution, recordConversion, reverseConversion, markSubscriptionEnded, manualAttribute,
}
