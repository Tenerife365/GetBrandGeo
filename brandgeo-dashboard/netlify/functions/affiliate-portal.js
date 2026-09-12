/**
 * affiliate-portal.js -- everything the affiliate dashboard (/affiliate) reads
 * and writes. POST { action, ... } with the affiliate's Supabase JWT, except
 * the two join actions, which are gated by the single-use invitation token
 * instead (the affiliate has no login yet at that point).
 *
 *   join_preview   { token }                        -> { affiliate, programs, terms }
 *   join_accept    { token, payout_method?, payout_details?, terms_accepted, privacy_accepted }
 *                                                   -> { ok, action_link }   (a Supabase magic link; the browser follows it)
 *   me             {}                               -> { affiliate, memberships[], stats, conversions[], commissions[], payouts[] }
 *   update_profile { full_name?, company?, website?, social_url?, country? }
 *   update_payout  { payout_method, payout_details }
 *   apply_program  { program }                      -> membership pending
 *   upload_url     { batch_id, filename }           -> { url, token, path }  (own batch, Supabase Storage signed upload)
 *   attach_document{ batch_id, path, name, size }
 *   document_url   { batch_id, path }               -> { url }
 *
 * DATA MINIMISATION. Conversions are returned with customer_ref (a masked
 * label), date, type, status and amount. Never the email, never an order's
 * contents, never Stripe ids.
 */

const { requireAffiliate, serviceClient, jsonResponse } = require('./_affiliate_auth')
const { corsHeaders, ALLOWED_ORIGINS } = require('./_auth')
const core = require('./_affiliate_core')
const service = require('./_affiliate_service')
const { summarizeRules } = core

const APP_URL = 'https://app.getbrandgeo.com'
const BUCKET = 'affiliate-documents'
const AFFILIATE_TERMS_VERSION = '2026-09-12'

function nowIso() { return new Date().toISOString() }

function shapeProgramForAffiliate(p, membership) {
  return {
    id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, description: p.description, logo_url: p.logo_url, brand_color: p.brand_color,
    destination_url: p.destination_url, status: p.status, currency: p.currency,
    commission_summary: summarizeRules(p, membership), attribution_days: p.attribution_days, approval_days: p.approval_days,
    min_payout: core.centsToMajor(p.min_payout_cents), payout_schedule: p.payout_schedule,
    terms_md: p.terms_md, terms_url: p.terms_url || 'https://getbrandgeo.com/affiliate-terms.html', terms_version: p.terms_version,
  }
}

function shapeConversion(c) {
  return {
    id: c.id, conversion_type: c.conversion_type, status: c.status, source: c.source, customer_ref: c.customer_ref || 'customer',
    amount: core.centsToMajor(c.amount_cents), currency: c.currency, occurred_at: c.occurred_at, program_id: c.program_id, membership_id: c.membership_id,
  }
}

function shapeCommission(c) {
  return {
    id: c.id, conversion_id: c.conversion_id, program_id: c.program_id, status: c.status, amount: core.centsToMajor(c.amount_cents), amount_cents: Number(c.amount_cents),
    currency: c.currency, approve_after: c.approve_after, approved_at: c.approved_at, paid_at: c.paid_at, rule: c.rule_snapshot && c.rule_snapshot.rule, created_at: c.created_at,
  }
}

function shapeBatch(b) {
  return {
    id: b.id, status: b.status, currency: b.currency, total: core.centsToMajor(b.total_cents), item_count: b.item_count, payout_method: b.payout_method,
    external_reference: b.external_reference, created_at: b.created_at, paid_at: b.paid_at, documents: (b.documents || []).map((d) => ({ name: d.name, path: d.path, kind: d.kind, uploaded_at: d.uploaded_at, uploaded_by: d.uploaded_by })),
  }
}

async function loadInviteByToken(db, token) {
  if (!token || typeof token !== 'string' || token.length > 100) return null
  const hash = core.sha256(token)
  const { data } = await db.from('affiliates').select('*').eq('invite_token_hash', hash).maybeSingle()
  if (!data) return null
  if (data.invite_expires_at && new Date(data.invite_expires_at).getTime() < Date.now()) return { expired: true, affiliate: data }
  return { affiliate: data }
}

async function programsForAffiliate(db, affiliateId) {
  const { data: memberships } = await db.from('affiliate_memberships').select('*').eq('affiliate_id', affiliateId).order('created_at', { ascending: true })
  const out = []
  for (const m of memberships || []) {
    const program = await service.getProgramById(db, m.program_id)
    if (program) out.push({ membership: m, program })
  }
  return out
}

/** Creates the auth user if needed, links it, and returns a magic sign-in link. */
async function issueMagicLink(db, affiliate) {
  const redirectTo = `${APP_URL}/affiliate`
  let userId = affiliate.user_id
  if (!userId) {
    const { data: created, error } = await db.auth.admin.createUser({ email: affiliate.email, email_confirm: true, user_metadata: { affiliate_id: affiliate.id } })
    if (error && !/already/i.test(error.message || '')) throw new Error(`createUser failed: ${error.message}`)
    userId = created && created.user ? created.user.id : null
    if (!userId) {
      // The address already has a login (a client, or an admin): link to it.
      const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const found = list && list.users ? list.users.find((u) => String(u.email || '').toLowerCase() === affiliate.email) : null
      if (!found) throw new Error('could not resolve the login for this email')
      userId = found.id
    }
    await db.from('affiliates').update({ user_id: userId }).eq('id', affiliate.id)
  }
  const { data, error } = await db.auth.admin.generateLink({ type: 'magiclink', email: affiliate.email, options: { redirectTo } })
  if (error) throw new Error(`generateLink failed: ${error.message}`)
  const link = data && data.properties && data.properties.action_link ? data.properties.action_link : (data && data.action_link) || null
  if (!link) throw new Error('no action_link returned')
  return link
}

async function handle(event, { supabase = null } = {}) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  const headers = corsHeaders(origin)
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method Not Allowed' }, headers)
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return jsonResponse(403, { error: 'Forbidden: origin not allowed' }, headers)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return jsonResponse(400, { error: 'Invalid JSON' }, headers) }
  const json = (s, o) => jsonResponse(s, o, headers)
  const db = supabase || serviceClient()

  // ── Token-gated join flow (no JWT yet) ─────────────────────────────────────
  if (body.action === 'join_preview' || body.action === 'join_accept') {
    const inv = await loadInviteByToken(db, body.token)
    if (!inv) return json(404, { error: 'This invitation link is not valid.' })
    if (inv.expired) return json(410, { error: 'This invitation link has expired. Ask for a new one.' })
    const affiliate = inv.affiliate
    if (affiliate.status === 'suspended' || affiliate.status === 'rejected') return json(403, { error: 'This affiliate account is not active.' })
    const pairs = await programsForAffiliate(db, affiliate.id)

    if (body.action === 'join_preview') {
      return json(200, {
        affiliate: { full_name: affiliate.full_name, email: core.maskEmail(affiliate.email), company: affiliate.company, payout_method: affiliate.payout_method, terms_accepted_at: affiliate.terms_accepted_at },
        programs: pairs.map(({ program, membership }) => ({ ...shapeProgramForAffiliate(program, membership), membership_status: membership.status })),
        terms_version: AFFILIATE_TERMS_VERSION,
        terms_url: 'https://getbrandgeo.com/affiliate-terms.html',
      })
    }

    if (body.terms_accepted !== true || body.privacy_accepted !== true) return json(400, { error: 'Please accept the affiliate terms and the privacy policy.' })
    const patch = { terms_accepted_at: affiliate.terms_accepted_at || nowIso(), terms_version: AFFILIATE_TERMS_VERSION, privacy_accepted_at: affiliate.privacy_accepted_at || nowIso() }
    if (body.payout_method) {
      if (!core.PAYOUT_METHODS.includes(body.payout_method)) return json(400, { error: 'Unknown payout method.' })
      patch.payout_method = body.payout_method
      patch.payout_details = core.sanitizePayoutDetails(body.payout_method, body.payout_details)
    }
    if (affiliate.status === 'invited' || affiliate.status === 'pending') patch.status = 'active'
    // Single use: the token is consumed here.
    patch.invite_token_hash = null
    patch.invite_expires_at = null
    const { data: updated, error } = await db.from('affiliates').update(patch).eq('id', affiliate.id).select('*').single()
    if (error) return json(500, { error: 'Could not accept the invitation. Please try again.' })
    for (const { membership } of pairs) {
      if (membership.status === 'invited') {
        await db.from('affiliate_memberships').update({ status: 'active', approved_at: membership.approved_at || nowIso() }).eq('id', membership.id)
      }
    }
    await service.audit(db, { actor: { type: 'affiliate', id: affiliate.id, label: affiliate.email }, action: 'affiliate.joined', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: { status: updated.status, terms_version: AFFILIATE_TERMS_VERSION } })
    try {
      const link = await issueMagicLink(db, updated)
      return json(200, { ok: true, action_link: link })
    } catch (e) {
      console.error('[affiliate-portal] magic link failed:', e.message)
      return json(200, { ok: true, action_link: null, message: 'Your account is active. Sign in with your email to continue.' })
    }
  }

  // ── Everything else needs the affiliate's JWT ─────────────────────────────
  const auth = await requireAffiliate(event, { client: db, allowMissing: body.action === 'me' })
  if (auth.response) return auth.response
  const { affiliate, user } = auth
  const actor = affiliate ? { type: 'affiliate', id: affiliate.id, label: affiliate.email } : { type: 'affiliate', id: user.id, label: user.email }

  if (body.action === 'me') {
    if (!affiliate) return json(200, { affiliate: null, memberships: [], stats: null, conversions: [], commissions: [], payouts: [] })
    const pairs = await programsForAffiliate(db, affiliate.id)
    const membershipIds = pairs.map((p) => p.membership.id)
    const { data: codes } = membershipIds.length ? await db.from('affiliate_codes').select('*').in('membership_id', membershipIds) : { data: [] }
    const { data: conversions } = membershipIds.length
      ? await db.from('affiliate_conversions').select('*').in('membership_id', membershipIds).order('occurred_at', { ascending: false }).limit(200)
      : { data: [] }
    const { data: commissions } = await db.from('affiliate_commissions').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(500)
    const { data: batches } = await db.from('affiliate_payout_batches').select('*').eq('affiliate_id', affiliate.id).order('created_at', { ascending: false }).limit(100)
    const programIds = pairs.filter((p) => p.membership.status === 'active').map((p) => p.program.id)
    const { data: resources } = programIds.length ? await db.from('affiliate_resources').select('*').in('program_id', programIds).eq('is_active', true).order('sort_order', { ascending: true }) : { data: [] }

    const memberships = pairs.map(({ membership, program }) => {
      const mine = (codes || []).filter((c) => c.membership_id === membership.id)
      const primary = mine.find((c) => c.kind === 'link' && c.is_primary && c.is_active) || mine.find((c) => c.kind === 'link' && c.is_active) || null
      const convs = (conversions || []).filter((c) => c.membership_id === membership.id)
      return {
        id: membership.id, status: membership.status, approved_at: membership.approved_at, clicks_total: Number(membership.clicks_total || 0), clicks_last_at: membership.clicks_last_at,
        program: shapeProgramForAffiliate(program, membership),
        custom_rules: membership.custom_rules || null,
        referral_link: primary ? `${APP_URL}/r/${program.slug}/${primary.code}` : null,
        referral_code: primary ? primary.code : null,
        coupon_codes: mine.filter((c) => c.kind === 'coupon' && c.is_active).map((c) => c.code),
        leads: convs.filter((c) => (c.conversion_type === 'lead' || c.conversion_type === 'qualified_lead') && c.status === 'confirmed').length,
        sales: convs.filter((c) => (c.conversion_type === 'sale' || c.conversion_type === 'recurring' || c.conversion_type === 'custom') && c.status === 'confirmed').length,
        resources: (resources || []).filter((r) => r.program_id === program.id).map((r) => ({ id: r.id, title: r.title, kind: r.kind, url: r.url, body: r.body })),
      }
    })

    const sums = {}
    for (const c of commissions || []) {
      const k = c.currency
      sums[k] = sums[k] || { pending: 0, approved: 0, payable: 0, paid: 0, reversed: 0, rejected: 0 }
      sums[k][c.status] = (sums[k][c.status] || 0) + Number(c.amount_cents)
    }
    const stats = {
      clicks: memberships.reduce((s, m) => s + m.clicks_total, 0),
      leads: memberships.reduce((s, m) => s + m.leads, 0),
      conversions: memberships.reduce((s, m) => s + m.sales, 0),
      by_currency: Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([s, cents]) => [s, core.centsToMajor(cents)]))])),
    }

    return json(200, {
      affiliate: {
        id: affiliate.id, full_name: affiliate.full_name, email: affiliate.email, company: affiliate.company, website: affiliate.website, social_url: affiliate.social_url,
        country: affiliate.country, status: affiliate.status, payout_method: affiliate.payout_method, payout_details: affiliate.payout_details || {},
        terms_accepted_at: affiliate.terms_accepted_at, terms_version: affiliate.terms_version, created_at: affiliate.created_at,
      },
      memberships, stats,
      conversions: (conversions || []).map(shapeConversion),
      commissions: (commissions || []).map(shapeCommission),
      payouts: (batches || []).map(shapeBatch),
      payout_detail_fields: core.PAYOUT_DETAIL_FIELDS,
    })
  }

  if (body.action === 'update_profile') {
    const patch = {}
    for (const k of ['full_name', 'company', 'website', 'social_url', 'country']) if (body[k] !== undefined) patch[k] = core.str(body[k], 200)
    if (patch.full_name === null) return json(400, { error: 'Name is required.' })
    const { data, error } = await db.from('affiliates').update(patch).eq('id', affiliate.id).select('*').single()
    if (error) return json(500, { error: 'Could not save your profile.' })
    await service.audit(db, { actor, action: 'affiliate.profile_updated', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: patch })
    return json(200, { ok: true, affiliate: { full_name: data.full_name, company: data.company, website: data.website, social_url: data.social_url, country: data.country } })
  }

  if (body.action === 'update_payout') {
    if (!core.PAYOUT_METHODS.includes(body.payout_method)) return json(400, { error: 'Choose a payout method.' })
    const details = core.sanitizePayoutDetails(body.payout_method, body.payout_details)
    const { error } = await db.from('affiliates').update({ payout_method: body.payout_method, payout_details: details }).eq('id', affiliate.id)
    if (error) return json(500, { error: 'Could not save your payout details.' })
    await service.audit(db, { actor, action: 'affiliate.payout_updated', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: { payout_method: body.payout_method, fields: Object.keys(details) } })
    return json(200, { ok: true, payout_method: body.payout_method, payout_details: details })
  }

  if (body.action === 'apply_program') {
    const program = await service.getProgramBySlug(db, String(body.program || '').toLowerCase())
    if (!program || program.status !== 'active' || !program.is_public) return json(404, { error: 'This program is not open for applications.' })
    const { data: existing } = await db.from('affiliate_memberships').select('*').eq('affiliate_id', affiliate.id).eq('program_id', program.id).maybeSingle()
    if (existing) return json(409, { error: `You are already ${existing.status} in this program.` })
    const { data: m, error } = await db.from('affiliate_memberships').insert({ affiliate_id: affiliate.id, program_id: program.id, status: 'pending', applied_at: nowIso() }).select('*').single()
    if (error) return json(500, { error: 'Could not submit the application.' })
    await db.from('affiliate_applications').insert({
      program_id: program.id, affiliate_id: affiliate.id, membership_id: m.id, full_name: affiliate.full_name, email: affiliate.email, company: affiliate.company,
      website: affiliate.website, social_url: affiliate.social_url, country: affiliate.country, promo_method: core.str(body.promo_method, 2000) || affiliate.promo_method,
      payout_method: affiliate.payout_method, terms_accepted: true, privacy_accepted: true, status: 'pending',
    })
    await service.audit(db, { actor, action: 'membership.applied', entityType: 'membership', entityId: m.id, programId: program.id, affiliateId: affiliate.id })
    return json(201, { ok: true, membership_id: m.id })
  }

  if (body.action === 'upload_url' || body.action === 'attach_document' || body.action === 'document_url') {
    const { data: batch } = await db.from('affiliate_payout_batches').select('*').eq('id', String(body.batch_id || '')).maybeSingle()
    if (!batch || batch.affiliate_id !== affiliate.id) return json(404, { error: 'Payout not found.' })

    if (body.action === 'upload_url') {
      const name = core.str(body.filename, 120) || 'invoice.pdf'
      if (!/\.(pdf|png|jpg|jpeg)$/i.test(name)) return json(400, { error: 'Upload a PDF, PNG or JPG.' })
      const path = `${affiliate.id}/${batch.id}/${Date.now()}-${name.replace(/[^A-Za-z0-9._-]/g, '_')}`
      const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path)
      if (error) return json(500, { error: 'Could not prepare the upload.' })
      return json(200, { url: data.signedUrl, token: data.token, path })
    }
    if (body.action === 'attach_document') {
      const path = core.str(body.path, 300)
      if (!path || !path.startsWith(`${affiliate.id}/${batch.id}/`)) return json(400, { error: 'Invalid document path.' })
      const doc = { name: core.str(body.name, 120) || 'document', path, size: Number(body.size) || null, kind: 'invoice', uploaded_by: 'affiliate', uploaded_at: nowIso() }
      const documents = [...(batch.documents || []), doc]
      const { error } = await db.from('affiliate_payout_batches').update({ documents }).eq('id', batch.id)
      if (error) return json(500, { error: 'Could not attach the document.' })
      await service.audit(db, { actor, action: 'payout.document_attached', entityType: 'payout_batch', entityId: batch.id, affiliateId: affiliate.id, after: { name: doc.name } })
      return json(200, { ok: true, documents })
    }
    const path = core.str(body.path, 300)
    if (!path || !(batch.documents || []).some((d) => d.path === path)) return json(404, { error: 'Document not found.' })
    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 600)
    if (error) return json(500, { error: 'Could not open the document.' })
    return json(200, { url: data.signedUrl })
  }

  return json(400, { error: 'Unknown action.' })
}

exports.handler = (event) => handle(event)
exports.handle = handle
exports.AFFILIATE_TERMS_VERSION = AFFILIATE_TERMS_VERSION
