/**
 * affiliate-admin.js -- the admin side of the affiliate module. One endpoint,
 * POST { action, ...params }, behind requireAuth({ adminOnly: true }) exactly
 * like promotions-admin.js and prospects-admin.js. Backend of
 * src/pages/AffiliatesAdmin.tsx.
 *
 * Actions (grouped):
 *   overview
 *   programs.list | programs.create | programs.update | programs.rotate_key
 *   resources.list | resources.create | resources.update
 *   affiliates.list | affiliates.invite | affiliates.resend_invite | affiliates.update | affiliates.suspend | affiliates.reactivate
 *   memberships.add | memberships.update | memberships.approve | memberships.reject | memberships.suspend
 *   codes.list | codes.create | codes.update
 *   applications.list | applications.approve | applications.reject
 *   visits.list
 *   conversions.list | conversions.create_manual | conversions.reverse
 *   attributions.list | attributions.manual
 *   commissions.list | commissions.approve | commissions.reject | commissions.reverse | commissions.reopen | commissions.mature
 *   payouts.candidates | payouts.create_batch | payouts.list | payouts.mark_paid | payouts.cancel
 *   payouts.upload_url | payouts.attach_document | payouts.document_url
 *   export { kind: affiliates|memberships|clicks|conversions|commissions|payout_batches|payout_items, ...filters }
 *   audit.list
 *
 * Every financial or attribution change writes affiliate_audit_log with the
 * admin's user id. Nothing here deletes a conversion, commission, batch or
 * attribution; the only delete is a payout item leaving a DRAFT batch.
 *
 * Filters accepted by list/export actions: program_id, affiliate_id,
 * membership_id, conversion_type, status, from, to (ISO dates), limit.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const core = require('./_affiliate_core')
const service = require('./_affiliate_service')
const emails = require('./_affiliate_email')

const APP_URL = 'https://app.getbrandgeo.com'
const BUCKET = 'affiliate-documents'
const INVITE_DAYS = 7
const MAX_LIMIT = 1000

function nowIso() { return new Date().toISOString() }

function applyFilters(q, f, { dateCol = 'created_at', typeCol = null } = {}) {
  if (f.program_id) q = q.eq('program_id', f.program_id)
  if (f.affiliate_id) q = q.eq('affiliate_id', f.affiliate_id)
  if (f.membership_id) q = q.eq('membership_id', f.membership_id)
  if (f.status) q = q.eq('status', f.status)
  if (typeCol && f.conversion_type) q = q.eq(typeCol, f.conversion_type)
  if (f.from) q = q.gte(dateCol, new Date(f.from).toISOString())
  if (f.to) q = q.lte(dateCol, new Date(f.to).toISOString())
  return q
}

function limitOf(body) {
  const n = Number(body.limit)
  return Number.isInteger(n) && n > 0 ? Math.min(n, MAX_LIMIT) : 200
}

async function mapsFor(db) {
  const { data: programs } = await db.from('affiliate_programs').select('*')
  const { data: affiliates } = await db.from('affiliates').select('*')
  const { data: memberships } = await db.from('affiliate_memberships').select('*')
  return {
    programs: new Map((programs || []).map((p) => [p.id, p])),
    affiliates: new Map((affiliates || []).map((a) => [a.id, a])),
    memberships: new Map((memberships || []).map((m) => [m.id, m])),
  }
}

function programPublicFields(p) {
  const { api_key_hash, ...rest } = p
  return { ...rest, has_api_key: !!api_key_hash, commission_summary: core.summarizeRules(p) }
}

async function ensurePrimaryCode(db, { program, membership, affiliate, actor, preferred = null }) {
  const { data: existing } = await db.from('affiliate_codes').select('*').eq('membership_id', membership.id).eq('kind', 'link').eq('is_active', true).limit(1)
  if (existing && existing[0]) return existing[0]
  let code = preferred ? core.normalizeCode(preferred) : core.suggestCode(affiliate.full_name || affiliate.company || 'AFF')
  for (let attempt = 0; attempt < 6; attempt++) {
    if (!core.isValidCode(code)) code = core.suggestCode(affiliate.full_name)
    const { data, error } = await db.from('affiliate_codes').insert({
      program_id: program.id, membership_id: membership.id, affiliate_id: affiliate.id, code, kind: 'link', is_primary: true, is_active: true,
    }).select('*').single()
    if (!error) {
      await service.audit(db, { actor, action: 'code.created', entityType: 'code', entityId: data.id, programId: program.id, affiliateId: affiliate.id, after: { code, kind: 'link' } })
      return data
    }
    if (error.code !== '23505') throw new Error(`code insert failed: ${error.message}`)
    code = core.suggestCode(affiliate.full_name)
  }
  throw new Error('could not allocate a unique code')
}

async function issueInviteToken(db, affiliate) {
  const token = core.randomToken(24)
  await db.from('affiliates').update({ invite_token_hash: core.sha256(token), invite_expires_at: core.addDays(new Date(), INVITE_DAYS).toISOString(), invited_at: nowIso() }).eq('id', affiliate.id)
  return token
}

exports.handler = async (event) => handle(event)

async function handle(event, { supabase = null } = {}) {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response
  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'Invalid JSON' }) }
  const db = supabase || createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const actor = { type: 'admin', id: auth.user.id, label: auth.user.email || 'admin' }
  const action = String(body.action || '')

  try {
    // ── overview ──────────────────────────────────────────────────────────────
    if (action === 'overview') {
      await db.rpc('affiliate_mature_commissions')
      const { data: programs } = await db.from('affiliate_programs').select('*').order('created_at', { ascending: true })
      const { data: affiliates } = await db.from('affiliates').select('id, status')
      const { data: apps } = await db.from('affiliate_applications').select('id').eq('status', 'pending')
      const { data: commissions } = await db.from('affiliate_commissions').select('status, amount_cents, currency, reconciliation_flag')
      const { data: memberships } = await db.from('affiliate_memberships').select('clicks_total')
      const totals = {}
      for (const c of commissions || []) {
        totals[c.currency] = totals[c.currency] || { pending: 0, approved: 0, payable: 0, paid: 0, reversed: 0, rejected: 0 }
        totals[c.currency][c.status] += Number(c.amount_cents)
      }
      return json(200, {
        programs: (programs || []).map(programPublicFields),
        counts: {
          affiliates_active: (affiliates || []).filter((a) => a.status === 'active').length,
          affiliates_total: (affiliates || []).length,
          applications_pending: (apps || []).length,
          clicks_total: (memberships || []).reduce((s, m) => s + Number(m.clicks_total || 0), 0),
          reconciliation_flags: (commissions || []).filter((c) => c.reconciliation_flag).length,
        },
        totals: Object.fromEntries(Object.entries(totals).map(([cur, t]) => [cur, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, core.centsToMajor(v)]))])),
      })
    }

    // ── programs ──────────────────────────────────────────────────────────────
    if (action === 'programs.list') {
      const { data, error } = await db.from('affiliate_programs').select('*').order('created_at', { ascending: true })
      if (error) throw error
      return json(200, { programs: (data || []).map(programPublicFields) })
    }
    if (action === 'programs.create') {
      const { errors, row } = core.validateProgramInput(body)
      if (errors.length) return json(400, { error: errors[0], errors })
      const { data, error } = await db.from('affiliate_programs').insert({ ...row, created_by: auth.user.id }).select('*').single()
      if (error) return json(error.code === '23505' ? 409 : 400, { error: error.code === '23505' ? 'That slug is already in use.' : error.message })
      await service.audit(db, { actor, action: 'program.created', entityType: 'program', entityId: data.id, programId: data.id, after: row })
      return json(201, { program: programPublicFields(data) })
    }
    if (action === 'programs.update') {
      const id = String(body.id || '')
      const before = await service.getProgramById(db, id)
      if (!before) return json(404, { error: 'Program not found.' })
      const { errors, row } = core.validateProgramInput(body.patch || {}, { partial: true })
      if (errors.length) return json(400, { error: errors[0], errors })
      if (row.status === 'archived') row.archived_at = nowIso()
      const { data, error } = await db.from('affiliate_programs').update(row).eq('id', id).select('*').single()
      if (error) return json(error.code === '23505' ? 409 : 400, { error: error.message })
      const changed = Object.fromEntries(Object.keys(row).map((k) => [k, before[k]]))
      await service.audit(db, { actor, action: 'program.updated', entityType: 'program', entityId: id, programId: id, before: changed, after: row })
      return json(200, { program: programPublicFields(data) })
    }
    if (action === 'programs.rotate_key') {
      const id = String(body.id || '')
      const program = await service.getProgramById(db, id)
      if (!program) return json(404, { error: 'Program not found.' })
      const key = core.makeApiKey(program.slug)
      const { error } = await db.from('affiliate_programs').update({ api_key_hash: core.hashApiKey(key), api_key_prefix: core.apiKeyPrefix(key), api_key_created_at: nowIso() }).eq('id', id)
      if (error) throw error
      await service.audit(db, { actor, action: 'program.api_key_rotated', entityType: 'program', entityId: id, programId: id, after: { prefix: core.apiKeyPrefix(key) } })
      return json(200, { api_key: key, prefix: core.apiKeyPrefix(key) })
    }

    // ── resources ─────────────────────────────────────────────────────────────
    if (action === 'resources.list') {
      let q = db.from('affiliate_resources').select('*').order('sort_order', { ascending: true })
      if (body.program_id) q = q.eq('program_id', body.program_id)
      const { data, error } = await q
      if (error) throw error
      return json(200, { resources: data || [] })
    }
    if (action === 'resources.create') {
      const title = core.str(body.title, 160)
      const kind = ['link', 'file', 'text'].includes(body.kind) ? body.kind : 'link'
      if (!title || !body.program_id) return json(400, { error: 'title and program_id are required.' })
      const { data, error } = await db.from('affiliate_resources').insert({ program_id: body.program_id, title, kind, url: core.str(body.url, 500), body: core.str(body.body, 5000), sort_order: Number(body.sort_order) || 0 }).select('*').single()
      if (error) throw error
      return json(201, { resource: data })
    }
    if (action === 'resources.update') {
      const patch = {}
      for (const k of ['title', 'url', 'body']) if (body.patch && body.patch[k] !== undefined) patch[k] = core.str(body.patch[k], k === 'body' ? 5000 : 500)
      if (body.patch && body.patch.is_active !== undefined) patch.is_active = body.patch.is_active === true
      if (body.patch && body.patch.sort_order !== undefined) patch.sort_order = Number(body.patch.sort_order) || 0
      const { data, error } = await db.from('affiliate_resources').update(patch).eq('id', Number(body.id)).select('*').single()
      if (error) throw error
      return json(200, { resource: data })
    }

    // ── affiliates ────────────────────────────────────────────────────────────
    if (action === 'affiliates.list') {
      let q = db.from('affiliates').select('*').order('created_at', { ascending: false })
      if (body.status) q = q.eq('status', body.status)
      const { data: affiliates, error } = await q.limit(limitOf(body))
      if (error) throw error
      const ids = (affiliates || []).map((a) => a.id)
      const { data: memberships } = ids.length ? await db.from('affiliate_memberships').select('*').in('affiliate_id', ids) : { data: [] }
      const { data: codes } = ids.length ? await db.from('affiliate_codes').select('*').in('affiliate_id', ids) : { data: [] }
      const { data: commissions } = ids.length ? await db.from('affiliate_commissions').select('affiliate_id, status, amount_cents, currency').in('affiliate_id', ids) : { data: [] }
      const maps = await mapsFor(db)
      const out = (affiliates || []).map((a) => {
        const mine = (memberships || []).filter((m) => m.affiliate_id === a.id)
        const sums = {}
        for (const c of (commissions || []).filter((c) => c.affiliate_id === a.id)) {
          sums[c.currency] = sums[c.currency] || { pending: 0, approved: 0, payable: 0, paid: 0 }
          if (sums[c.currency][c.status] !== undefined) sums[c.currency][c.status] += Number(c.amount_cents)
        }
        const { invite_token_hash, ...safe } = a
        return {
          ...safe,
          has_login: !!a.user_id,
          invite_pending: !!invite_token_hash && (!a.invite_expires_at || new Date(a.invite_expires_at).getTime() > Date.now()),
          memberships: mine.map((m) => {
            const p = maps.programs.get(m.program_id)
            const codesFor = (codes || []).filter((c) => c.membership_id === m.id)
            const primary = codesFor.find((c) => c.kind === 'link' && c.is_primary) || codesFor.find((c) => c.kind === 'link') || null
            return { ...m, program_slug: p ? p.slug : null, program_name: p ? p.name : null, primary_code: primary ? primary.code : null, referral_link: primary && p ? `${APP_URL}/r/${p.slug}/${primary.code}` : null, codes: codesFor, commission_summary: p ? core.summarizeRules(p, m) : null }
          }),
          totals: Object.fromEntries(Object.entries(sums).map(([cur, t]) => [cur, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, core.centsToMajor(v)]))])),
        }
      })
      return json(200, { affiliates: out })
    }

    if (action === 'affiliates.invite') {
      const email = core.normalizeEmail(body.email)
      const fullName = core.str(body.full_name, 120)
      if (!core.isValidEmail(email)) return json(400, { error: 'A valid email is required.' })
      if (!fullName) return json(400, { error: 'Full name is required.' })
      const slugs = Array.isArray(body.program_slugs) ? body.program_slugs.map((s) => String(s).toLowerCase()) : []
      if (!slugs.length) return json(400, { error: 'Pick at least one program.' })
      const programs = []
      for (const s of slugs) {
        const p = await service.getProgramBySlug(db, s)
        if (!p || p.status === 'archived') return json(400, { error: `Unknown or archived program: ${s}` })
        programs.push(p)
      }
      let { data: affiliate } = await db.from('affiliates').select('*').eq('email', email).maybeSingle()
      if (!affiliate) {
        const { data, error } = await db.from('affiliates').insert({
          email, full_name: fullName, company: core.str(body.company, 160), website: core.str(body.website, 300), social_url: core.str(body.social_url, 300), country: core.str(body.country, 80),
          status: 'invited', invited_by: auth.user.id, email_hash: core.hashEmail(email), notes: core.str(body.notes, 2000),
        }).select('*').single()
        if (error) throw error
        affiliate = data
        await service.audit(db, { actor, action: 'affiliate.created', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: { email, status: 'invited' } })
      }
      const created = []
      for (const p of programs) {
        const { data: existing } = await db.from('affiliate_memberships').select('*').eq('affiliate_id', affiliate.id).eq('program_id', p.id).maybeSingle()
        let membership = existing
        if (!membership) {
          const { data, error } = await db.from('affiliate_memberships').insert({ affiliate_id: affiliate.id, program_id: p.id, status: 'invited' }).select('*').single()
          if (error) throw error
          membership = data
          await service.audit(db, { actor, action: 'membership.invited', entityType: 'membership', entityId: membership.id, programId: p.id, affiliateId: affiliate.id })
        }
        const code = await ensurePrimaryCode(db, { program: p, membership, affiliate, actor, preferred: body.code })
        created.push({ program: p.slug, membership_id: membership.id, status: membership.status, code: code.code })
      }
      const token = await issueInviteToken(db, affiliate)
      const mail = await emails.sendInvitation({ affiliate, programs, token, inviterName: auth.user.email })
      await service.audit(db, { actor, action: 'affiliate.invited', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: { programs: slugs, email_sent: !!mail.ok } })
      return json(201, { ok: true, affiliate_id: affiliate.id, memberships: created, join_url: emails.joinUrl(token), email_sent: !!mail.ok, email_error: mail.error || null })
    }

    if (action === 'affiliates.resend_invite') {
      const affiliate = await service.getAffiliate(db, String(body.id || ''))
      if (!affiliate) return json(404, { error: 'Affiliate not found.' })
      const pairs = []
      const { data: memberships } = await db.from('affiliate_memberships').select('*').eq('affiliate_id', affiliate.id)
      for (const m of memberships || []) { const p = await service.getProgramById(db, m.program_id); if (p) pairs.push(p) }
      const token = await issueInviteToken(db, affiliate)
      const mail = await emails.sendInvitation({ affiliate, programs: pairs, token, inviterName: auth.user.email })
      await service.audit(db, { actor, action: 'affiliate.invite_resent', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: { email_sent: !!mail.ok } })
      return json(200, { ok: true, join_url: emails.joinUrl(token), email_sent: !!mail.ok, email_error: mail.error || null })
    }

    if (action === 'affiliates.update') {
      const affiliate = await service.getAffiliate(db, String(body.id || ''))
      if (!affiliate) return json(404, { error: 'Affiliate not found.' })
      const p = body.patch || {}
      const patch = {}
      for (const k of ['full_name', 'company', 'website', 'social_url', 'country', 'promo_method', 'notes']) if (p[k] !== undefined) patch[k] = core.str(p[k], k === 'notes' || k === 'promo_method' ? 2000 : 200)
      if (p.payout_method !== undefined) {
        if (p.payout_method !== null && !core.PAYOUT_METHODS.includes(p.payout_method)) return json(400, { error: 'Unknown payout method.' })
        patch.payout_method = p.payout_method
        patch.payout_details = core.sanitizePayoutDetails(p.payout_method, p.payout_details !== undefined ? p.payout_details : affiliate.payout_details)
      }
      const { data, error } = await db.from('affiliates').update(patch).eq('id', affiliate.id).select('*').single()
      if (error) throw error
      await service.audit(db, { actor, action: 'affiliate.updated', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, before: Object.fromEntries(Object.keys(patch).map((k) => [k, affiliate[k]])), after: patch })
      const { invite_token_hash, ...safe } = data
      return json(200, { affiliate: safe })
    }

    if (action === 'affiliates.suspend' || action === 'affiliates.reactivate') {
      const affiliate = await service.getAffiliate(db, String(body.id || ''))
      if (!affiliate) return json(404, { error: 'Affiliate not found.' })
      const suspend = action === 'affiliates.suspend'
      const patch = suspend ? { status: 'suspended', suspended_at: nowIso(), suspended_reason: core.str(body.reason, 500) } : { status: 'active', suspended_at: null, suspended_reason: null }
      const { error } = await db.from('affiliates').update(patch).eq('id', affiliate.id)
      if (error) throw error
      await service.audit(db, { actor, action: suspend ? 'affiliate.suspended' : 'affiliate.reactivated', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, before: { status: affiliate.status }, after: { status: patch.status }, reason: patch.suspended_reason || null })
      return json(200, { ok: true, status: patch.status })
    }

    // ── memberships ───────────────────────────────────────────────────────────
    if (action === 'memberships.add') {
      const affiliate = await service.getAffiliate(db, String(body.affiliate_id || ''))
      const program = await service.getProgramById(db, String(body.program_id || ''))
      if (!affiliate || !program) return json(404, { error: 'Affiliate or program not found.' })
      const status = ['invited', 'active', 'pending'].includes(body.status) ? body.status : 'active'
      const { data, error } = await db.from('affiliate_memberships').insert({ affiliate_id: affiliate.id, program_id: program.id, status, approved_at: status === 'active' ? nowIso() : null, approved_by: status === 'active' ? auth.user.id : null }).select('*').single()
      if (error) return json(error.code === '23505' ? 409 : 400, { error: error.code === '23505' ? 'Already a member of this program.' : error.message })
      const code = await ensurePrimaryCode(db, { program, membership: data, affiliate, actor, preferred: body.code })
      await service.audit(db, { actor, action: 'membership.added', entityType: 'membership', entityId: data.id, programId: program.id, affiliateId: affiliate.id, after: { status } })
      return json(201, { membership: { ...data, primary_code: code.code, referral_link: `${APP_URL}/r/${program.slug}/${code.code}` } })
    }

    if (action === 'memberships.update' || action === 'memberships.approve' || action === 'memberships.reject' || action === 'memberships.suspend') {
      const membership = await service.getMembership(db, String(body.id || ''))
      if (!membership) return json(404, { error: 'Membership not found.' })
      const program = await service.getProgramById(db, membership.program_id)
      const affiliate = await service.getAffiliate(db, membership.affiliate_id)
      const patch = {}
      if (action === 'memberships.approve') Object.assign(patch, { status: 'active', approved_at: nowIso(), approved_by: auth.user.id, rejected_reason: null })
      if (action === 'memberships.reject') Object.assign(patch, { status: 'rejected', rejected_reason: core.str(body.reason, 500) })
      if (action === 'memberships.suspend') Object.assign(patch, { status: 'suspended', rejected_reason: core.str(body.reason, 500) })
      if (action === 'memberships.update') {
        const p = body.patch || {}
        if (p.status !== undefined) { if (!core.MEMBERSHIP_STATUSES.includes(p.status)) return json(400, { error: 'Invalid status.' }); patch.status = p.status; if (p.status === 'active' && !membership.approved_at) { patch.approved_at = nowIso(); patch.approved_by = auth.user.id } }
        if (p.custom_rules !== undefined) { const v = core.validateCustomRules(p.custom_rules); if (v.errors.length) return json(400, { error: v.errors[0] }); patch.custom_rules = v.rules }
      }
      const { data, error } = await db.from('affiliate_memberships').update(patch).eq('id', membership.id).select('*').single()
      if (error) throw error
      if (data.status === 'active') await ensurePrimaryCode(db, { program, membership: data, affiliate, actor })
      await service.audit(db, { actor, action: action.replace('memberships.', 'membership.'), entityType: 'membership', entityId: membership.id, programId: membership.program_id, affiliateId: membership.affiliate_id, before: { status: membership.status, custom_rules: membership.custom_rules }, after: patch, reason: patch.rejected_reason || null })
      if (action === 'memberships.approve' && affiliate.status === 'invited') await db.from('affiliates').update({ status: 'active' }).eq('id', affiliate.id)
      if (action === 'memberships.approve' && affiliate.status === 'pending') await db.from('affiliates').update({ status: 'active' }).eq('id', affiliate.id)
      return json(200, { membership: data })
    }

    // ── codes ─────────────────────────────────────────────────────────────────
    if (action === 'codes.list') {
      let q = db.from('affiliate_codes').select('*').order('created_at', { ascending: true })
      if (body.membership_id) q = q.eq('membership_id', body.membership_id)
      if (body.program_id) q = q.eq('program_id', body.program_id)
      const { data, error } = await q
      if (error) throw error
      return json(200, { codes: data || [] })
    }
    if (action === 'codes.create') {
      const membership = await service.getMembership(db, String(body.membership_id || ''))
      if (!membership) return json(404, { error: 'Membership not found.' })
      const kind = body.kind === 'coupon' ? 'coupon' : 'link'
      const code = core.normalizeCode(body.code)
      if (!core.isValidCode(code)) return json(400, { error: 'Code must be 3 to 32 characters: letters, digits, hyphen or underscore.' })
      const { data, error } = await db.from('affiliate_codes').insert({
        program_id: membership.program_id, membership_id: membership.id, affiliate_id: membership.affiliate_id, code, kind, is_primary: body.is_primary === true && kind === 'link',
        stripe_promotion_code_id: core.str(body.stripe_promotion_code_id, 100), stripe_coupon_id: core.str(body.stripe_coupon_id, 100), note: core.str(body.note, 300),
      }).select('*').single()
      if (error) return json(error.code === '23505' ? 409 : 400, { error: error.code === '23505' ? 'That code already exists in this program.' : error.message })
      if (data.is_primary) await db.from('affiliate_codes').update({ is_primary: false }).eq('membership_id', membership.id).neq('id', data.id)
      await service.audit(db, { actor, action: 'code.created', entityType: 'code', entityId: data.id, programId: membership.program_id, affiliateId: membership.affiliate_id, after: { code, kind } })
      return json(201, { code: data })
    }
    if (action === 'codes.update') {
      const { data: before } = await db.from('affiliate_codes').select('*').eq('id', String(body.id || '')).maybeSingle()
      if (!before) return json(404, { error: 'Code not found.' })
      const p = body.patch || {}
      const patch = {}
      if (p.is_active !== undefined) patch.is_active = p.is_active === true
      if (p.is_primary === true) patch.is_primary = true
      if (p.code !== undefined) { const c = core.normalizeCode(p.code); if (!core.isValidCode(c)) return json(400, { error: 'Invalid code.' }); patch.code = c }
      if (p.stripe_promotion_code_id !== undefined) patch.stripe_promotion_code_id = core.str(p.stripe_promotion_code_id, 100)
      if (p.note !== undefined) patch.note = core.str(p.note, 300)
      const { data, error } = await db.from('affiliate_codes').update(patch).eq('id', before.id).select('*').single()
      if (error) return json(error.code === '23505' ? 409 : 400, { error: error.code === '23505' ? 'That code already exists in this program.' : error.message })
      if (patch.is_primary) await db.from('affiliate_codes').update({ is_primary: false }).eq('membership_id', before.membership_id).neq('id', before.id)
      await service.audit(db, { actor, action: 'code.updated', entityType: 'code', entityId: before.id, programId: before.program_id, affiliateId: before.affiliate_id, before: { code: before.code, is_active: before.is_active }, after: patch })
      return json(200, { code: data })
    }

    // ── applications ──────────────────────────────────────────────────────────
    if (action === 'applications.list') {
      let q = db.from('affiliate_applications').select('*').order('created_at', { ascending: false })
      if (body.status) q = q.eq('status', body.status)
      if (body.program_id) q = q.eq('program_id', body.program_id)
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      const maps = await mapsFor(db)
      return json(200, { applications: (data || []).map((a) => ({ ...a, program_slug: (maps.programs.get(a.program_id) || {}).slug, program_name: (maps.programs.get(a.program_id) || {}).name })) })
    }

    if (action === 'applications.approve' || action === 'applications.reject') {
      const { data: application } = await db.from('affiliate_applications').select('*').eq('id', Number(body.id)).maybeSingle()
      if (!application) return json(404, { error: 'Application not found.' })
      if (application.status !== 'pending') return json(409, { error: `Application already ${application.status}.` })
      const program = await service.getProgramById(db, application.program_id)
      if (!program) return json(404, { error: 'Program not found.' })

      if (action === 'applications.reject') {
        const note = core.str(body.note, 1000)
        await db.from('affiliate_applications').update({ status: 'rejected', reviewed_by: auth.user.id, reviewed_at: nowIso(), review_note: note }).eq('id', application.id)
        if (application.membership_id) await db.from('affiliate_memberships').update({ status: 'rejected', rejected_reason: note }).eq('id', application.membership_id)
        await service.audit(db, { actor, action: 'application.rejected', entityType: 'application', entityId: application.id, programId: program.id, affiliateId: application.affiliate_id, reason: note })
        await emails.sendApplicationRejected({ application, program, note })
        return json(200, { ok: true })
      }

      let affiliate = application.affiliate_id ? await service.getAffiliate(db, application.affiliate_id) : null
      if (!affiliate) {
        const { data: byEmail } = await db.from('affiliates').select('*').eq('email', application.email).maybeSingle()
        affiliate = byEmail
      }
      if (!affiliate) {
        const { data, error } = await db.from('affiliates').insert({
          email: application.email, full_name: application.full_name, company: application.company, website: application.website, social_url: application.social_url, country: application.country,
          promo_method: application.promo_method, payout_method: application.payout_method, status: 'active', email_hash: core.hashEmail(application.email),
          terms_accepted_at: application.terms_accepted ? application.created_at : null, privacy_accepted_at: application.privacy_accepted ? application.created_at : null,
        }).select('*').single()
        if (error) throw error
        affiliate = data
        await service.audit(db, { actor, action: 'affiliate.created', entityType: 'affiliate', entityId: affiliate.id, affiliateId: affiliate.id, after: { email: affiliate.email, via: 'application' } })
      } else if (affiliate.status === 'pending' || affiliate.status === 'invited') {
        await db.from('affiliates').update({ status: 'active' }).eq('id', affiliate.id)
        affiliate.status = 'active'
      }
      let membership = application.membership_id ? await service.getMembership(db, application.membership_id) : null
      if (!membership) {
        const { data: existing } = await db.from('affiliate_memberships').select('*').eq('affiliate_id', affiliate.id).eq('program_id', program.id).maybeSingle()
        membership = existing
      }
      if (!membership) {
        const { data, error } = await db.from('affiliate_memberships').insert({ affiliate_id: affiliate.id, program_id: program.id, status: 'active', applied_at: application.created_at, approved_at: nowIso(), approved_by: auth.user.id }).select('*').single()
        if (error) throw error
        membership = data
      } else {
        const { data } = await db.from('affiliate_memberships').update({ status: 'active', approved_at: nowIso(), approved_by: auth.user.id, rejected_reason: null }).eq('id', membership.id).select('*').single()
        membership = data || membership
      }
      const code = await ensurePrimaryCode(db, { program, membership, affiliate, actor, preferred: body.code })
      await db.from('affiliate_applications').update({ status: 'approved', affiliate_id: affiliate.id, membership_id: membership.id, reviewed_by: auth.user.id, reviewed_at: nowIso(), review_note: core.str(body.note, 1000) }).eq('id', application.id)
      const token = affiliate.user_id ? null : await issueInviteToken(db, affiliate)
      await service.audit(db, { actor, action: 'application.approved', entityType: 'application', entityId: application.id, programId: program.id, affiliateId: affiliate.id, after: { membership_id: membership.id, code: code.code } })
      const mail = await emails.sendApplicationApproved({ affiliate, program, code: code.code, token })
      return json(200, { ok: true, affiliate_id: affiliate.id, membership_id: membership.id, code: code.code, join_url: token ? emails.joinUrl(token) : null, email_sent: !!mail.ok })
    }

    // ── visits ────────────────────────────────────────────────────────────────
    if (action === 'visits.list') {
      let q = db.from('affiliate_visits').select('*').order('created_at', { ascending: false })
      q = applyFilters(q, body)
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      const maps = await mapsFor(db)
      return json(200, { visits: (data || []).map((v) => decorate(v, maps)) })
    }

    // ── conversions ───────────────────────────────────────────────────────────
    if (action === 'conversions.list') {
      let q = db.from('affiliate_conversions').select('*').order('occurred_at', { ascending: false })
      q = applyFilters(q, body, { dateCol: 'occurred_at', typeCol: 'conversion_type' })
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      const ids = (data || []).map((c) => c.id)
      const { data: commissions } = ids.length ? await db.from('affiliate_commissions').select('*').in('conversion_id', ids) : { data: [] }
      const maps = await mapsFor(db)
      return json(200, {
        conversions: (data || []).map((c) => ({ ...decorate(c, maps), amount: core.centsToMajor(c.amount_cents), commission: (commissions || []).filter((k) => k.conversion_id === c.id).map((k) => ({ id: k.id, status: k.status, amount: core.centsToMajor(k.amount_cents), currency: k.currency, reconciliation_flag: k.reconciliation_flag }))[0] || null })),
      })
    }

    if (action === 'conversions.create_manual') {
      const program = await service.getProgramById(db, String(body.program_id || ''))
      if (!program) return json(404, { error: 'Program not found.' })
      const membership = await service.getMembership(db, String(body.membership_id || ''))
      if (!membership || membership.program_id !== program.id) return json(400, { error: 'Pick an affiliate membership in this program.' })
      const reason = core.str(body.reason, 500)
      if (!reason) return json(400, { error: 'A reason is required for a manual conversion.' })
      const { errors, row } = core.validateConversionInput({
        idempotency_key: body.idempotency_key || `manual:${program.slug}:${core.randomToken(8)}`,
        conversion_type: body.conversion_type, external_id: body.external_id, external_customer_id: body.external_customer_id, customer_email: body.customer_email,
        amount: body.amount, amount_cents: body.amount_cents, currency: body.currency || program.currency, occurred_at: body.occurred_at, metadata: { note: core.str(body.note, 1000) || undefined },
      })
      if (errors.length) return json(400, { error: errors[0], errors })
      row.customer_ref = core.str(body.customer_ref, 120) || null
      row.manual_reason = reason
      const result = await service.recordConversion(db, { program, input: row, actor, source: 'manual', membershipId: membership.id })
      if (!result.ok) return json(result.status, { error: result.error })
      return json(result.duplicate ? 200 : 201, { ok: true, duplicate: !!result.duplicate, conversion: result.conversion, commission: result.commission })
    }

    if (action === 'conversions.reverse') {
      const newStatus = body.status === 'cancelled' ? 'cancelled' : 'refunded'
      const reason = core.str(body.reason, 500)
      if (!reason) return json(400, { error: 'A reason is required.' })
      const result = await service.reverseConversion(db, { conversionId: String(body.id || ''), newStatus, reason, actor })
      if (!result.ok) return json(result.status, { error: result.error })
      return json(200, { ok: true, conversion: result.conversion, commissions: result.commissions })
    }

    // ── attributions ──────────────────────────────────────────────────────────
    if (action === 'attributions.list') {
      let q = db.from('affiliate_attributions').select('*').order('last_touch_at', { ascending: false })
      q = applyFilters(q, body, { dateCol: 'last_touch_at' })
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      const maps = await mapsFor(db)
      return json(200, { attributions: (data || []).map((a) => decorate(a, maps)) })
    }
    if (action === 'attributions.manual') {
      const program = await service.getProgramById(db, String(body.program_id || ''))
      if (!program) return json(404, { error: 'Program not found.' })
      const externalCustomerId = core.str(body.external_customer_id, 200)
      const reason = core.str(body.reason, 500)
      if (!externalCustomerId || !reason) return json(400, { error: 'external_customer_id and reason are required.' })
      const result = await service.manualAttribute(db, { program, membershipId: String(body.membership_id || ''), externalCustomerId, customerRef: core.str(body.customer_ref, 120), reason, actor })
      if (!result.ok) return json(result.status, { error: result.error })
      return json(201, { ok: true, attribution: result.attribution })
    }

    // ── commissions ───────────────────────────────────────────────────────────
    if (action === 'commissions.mature') {
      const { data, error } = await db.rpc('affiliate_mature_commissions')
      if (error) throw error
      return json(200, { matured: Number(data) || 0 })
    }
    if (action === 'commissions.list') {
      let q = db.from('affiliate_commissions').select('*').order('created_at', { ascending: false })
      q = applyFilters(q, body)
      if (body.reconciliation_flag === true) q = q.eq('reconciliation_flag', true)
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      const maps = await mapsFor(db)
      const convIds = (data || []).map((c) => c.conversion_id)
      const { data: convs } = convIds.length ? await db.from('affiliate_conversions').select('*').in('id', convIds) : { data: [] }
      const convMap = new Map((convs || []).map((c) => [c.id, c]))
      return json(200, {
        commissions: (data || []).map((c) => {
          const v = convMap.get(c.conversion_id)
          return { ...decorate(c, maps), amount: core.centsToMajor(c.amount_cents), conversion: v ? { conversion_type: v.conversion_type, status: v.status, customer_ref: v.customer_ref, amount: core.centsToMajor(v.amount_cents), currency: v.currency, occurred_at: v.occurred_at, source: v.source, flags: v.flags, is_self_referral: v.is_self_referral } : null }
        }),
      })
    }
    if (['commissions.approve', 'commissions.reject', 'commissions.reverse', 'commissions.reopen'].includes(action)) {
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : body.id ? [String(body.id)] : []
      if (!ids.length) return json(400, { error: 'ids is required.' })
      const target = { 'commissions.approve': 'approved', 'commissions.reject': 'rejected', 'commissions.reverse': 'reversed', 'commissions.reopen': 'pending' }[action]
      const reason = core.str(body.reason, 500)
      if ((target === 'rejected' || target === 'reversed') && !reason) return json(400, { error: 'A reason is required.' })
      const { data: rows } = await db.from('affiliate_commissions').select('*').in('id', ids)
      const updated = []
      const skipped = []
      for (const c of rows || []) {
        if (!core.canTransition(c.status, target)) { skipped.push({ id: c.id, from: c.status }); continue }
        const patch = { status: target }
        if (target === 'approved') { patch.approved_at = nowIso(); patch.approved_by = auth.user.id }
        if (target === 'rejected') patch.rejected_reason = reason
        if (target === 'reversed') patch.reversal_reason = reason
        if (target === 'pending') { patch.rejected_reason = null; patch.approved_at = null; patch.approved_by = null }
        if (c.status === 'payable' && c.payout_item_id) {
          const { data: item } = await db.from('affiliate_payout_items').select('*').eq('id', c.payout_item_id).maybeSingle()
          if (item) {
            const { data: batch } = await db.from('affiliate_payout_batches').select('*').eq('id', item.batch_id).maybeSingle()
            if (batch && batch.status !== 'draft') { skipped.push({ id: c.id, from: c.status, why: 'batch not draft' }); continue }
            await db.from('affiliate_payout_items').delete().eq('id', item.id)
            if (batch) await db.from('affiliate_payout_batches').update({ total_cents: Number(batch.total_cents) - Number(item.amount_cents), item_count: Number(batch.item_count) - 1 }).eq('id', batch.id)
          }
          patch.payout_item_id = null
        }
        const { data } = await db.from('affiliate_commissions').update(patch).eq('id', c.id).select('*').single()
        updated.push(data || { ...c, ...patch })
        await service.audit(db, { actor, action: `commission.${target}`, entityType: 'commission', entityId: c.id, programId: c.program_id, affiliateId: c.affiliate_id, before: { status: c.status }, after: { status: target }, reason })
      }
      if (target === 'approved' && updated.length && body.notify !== false) {
        const byAff = new Map()
        for (const c of updated) { const k = `${c.affiliate_id}:${c.program_id}`; if (!byAff.has(k)) byAff.set(k, []); byAff.get(k).push(c) }
        for (const [k, list] of byAff) {
          const [affId, progId] = k.split(':')
          const affiliate = await service.getAffiliate(db, affId)
          const program = await service.getProgramById(db, progId)
          if (affiliate && program) await emails.sendCommissionApproved({ affiliate, program, commissions: list })
        }
      }
      return json(200, { ok: true, updated: updated.map((c) => ({ id: c.id, status: c.status })), skipped })
    }

    // ── payouts ───────────────────────────────────────────────────────────────
    if (action === 'payouts.candidates') {
      const { data: commissions } = await db.from('affiliate_commissions').select('*').eq('status', 'approved')
      const maps = await mapsFor(db)
      const groups = new Map()
      for (const c of commissions || []) {
        const k = `${c.affiliate_id}:${c.currency}`
        if (!groups.has(k)) groups.set(k, { affiliate_id: c.affiliate_id, currency: c.currency, total_cents: 0, commission_ids: [], min_payout_cents: 0 })
        const g = groups.get(k)
        g.total_cents += Number(c.amount_cents)
        g.commission_ids.push(c.id)
        const p = maps.programs.get(c.program_id)
        if (p && Number(p.min_payout_cents) > g.min_payout_cents) g.min_payout_cents = Number(p.min_payout_cents)
      }
      return json(200, {
        candidates: Array.from(groups.values()).map((g) => {
          const a = maps.affiliates.get(g.affiliate_id) || {}
          return { ...g, total: core.centsToMajor(g.total_cents), min_payout: core.centsToMajor(g.min_payout_cents), meets_threshold: g.total_cents >= g.min_payout_cents, affiliate_name: a.full_name, affiliate_email: a.email, payout_method: a.payout_method, has_payout_details: !!(a.payout_details && Object.keys(a.payout_details).length) }
        }),
      })
    }

    if (action === 'payouts.create_batch') {
      const affiliate = await service.getAffiliate(db, String(body.affiliate_id || ''))
      if (!affiliate) return json(404, { error: 'Affiliate not found.' })
      const currency = String(body.currency || '').toUpperCase()
      const ids = Array.isArray(body.commission_ids) ? body.commission_ids.map(String) : []
      if (!currency || !ids.length) return json(400, { error: 'currency and commission_ids are required.' })
      const { data: rows } = await db.from('affiliate_commissions').select('*').in('id', ids)
      const eligible = (rows || []).filter((c) => c.status === 'approved' && c.affiliate_id === affiliate.id && c.currency === currency)
      if (!eligible.length) return json(400, { error: 'No approved commissions match this affiliate and currency.' })
      const total = eligible.reduce((s, c) => s + Number(c.amount_cents), 0)
      const { data: batch, error } = await db.from('affiliate_payout_batches').insert({
        affiliate_id: affiliate.id, currency, status: 'draft', total_cents: total, item_count: eligible.length, payout_method: affiliate.payout_method, payout_details: affiliate.payout_details || {}, note: core.str(body.note, 500), created_by: auth.user.id,
      }).select('*').single()
      if (error) throw error
      for (const c of eligible) {
        const { data: item, error: itemErr } = await db.from('affiliate_payout_items').insert({ batch_id: batch.id, commission_id: c.id, amount_cents: c.amount_cents, currency }).select('*').single()
        if (itemErr) throw itemErr
        await db.from('affiliate_commissions').update({ status: 'payable', payout_item_id: item.id }).eq('id', c.id)
      }
      await service.audit(db, { actor, action: 'payout.batch_created', entityType: 'payout_batch', entityId: batch.id, affiliateId: affiliate.id, after: { total_cents: total, item_count: eligible.length, currency } })
      return json(201, { batch })
    }

    if (action === 'payouts.list') {
      let q = db.from('affiliate_payout_batches').select('*').order('created_at', { ascending: false })
      q = applyFilters(q, body)
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      const maps = await mapsFor(db)
      const ids = (data || []).map((b) => b.id)
      const { data: items } = ids.length ? await db.from('affiliate_payout_items').select('*').in('batch_id', ids) : { data: [] }
      return json(200, {
        batches: (data || []).map((b) => {
          const a = maps.affiliates.get(b.affiliate_id) || {}
          return { ...b, total: core.centsToMajor(b.total_cents), affiliate_name: a.full_name, affiliate_email: a.email, items: (items || []).filter((i) => i.batch_id === b.id).map((i) => ({ ...i, amount: core.centsToMajor(i.amount_cents) })) }
        }),
      })
    }

    if (action === 'payouts.mark_paid' || action === 'payouts.cancel') {
      const { data: batch } = await db.from('affiliate_payout_batches').select('*').eq('id', String(body.id || '')).maybeSingle()
      if (!batch) return json(404, { error: 'Batch not found.' })
      if (batch.status !== 'draft') return json(409, { error: `Batch is already ${batch.status}.` })
      const { data: items } = await db.from('affiliate_payout_items').select('*').eq('batch_id', batch.id)
      if (action === 'payouts.cancel') {
        for (const i of items || []) await db.from('affiliate_commissions').update({ status: 'approved', payout_item_id: null }).eq('id', i.commission_id)
        const { data } = await db.from('affiliate_payout_batches').update({ status: 'cancelled', cancelled_at: nowIso(), note: core.str(body.note, 500) || batch.note }).eq('id', batch.id).select('*').single()
        await service.audit(db, { actor, action: 'payout.batch_cancelled', entityType: 'payout_batch', entityId: batch.id, affiliateId: batch.affiliate_id, before: { status: 'draft' }, after: { status: 'cancelled' }, reason: core.str(body.note, 500) })
        return json(200, { batch: data })
      }
      const paidAt = body.paid_at ? new Date(body.paid_at).toISOString() : nowIso()
      const reference = core.str(body.external_reference, 200)
      if (!reference) return json(400, { error: 'The external payment reference is required.' })
      for (const i of items || []) await db.from('affiliate_commissions').update({ status: 'paid', paid_at: paidAt }).eq('id', i.commission_id)
      const { data } = await db.from('affiliate_payout_batches').update({ status: 'paid', paid_at: paidAt, paid_by: auth.user.id, external_reference: reference, note: core.str(body.note, 500) || batch.note }).eq('id', batch.id).select('*').single()
      await service.audit(db, { actor, action: 'payout.batch_paid', entityType: 'payout_batch', entityId: batch.id, affiliateId: batch.affiliate_id, before: { status: 'draft' }, after: { status: 'paid', external_reference: reference, paid_at: paidAt, total_cents: batch.total_cents } })
      const affiliate = await service.getAffiliate(db, batch.affiliate_id)
      if (affiliate && body.notify !== false) await emails.sendPayoutCompleted({ affiliate, batch: data })
      return json(200, { batch: data })
    }

    if (action === 'payouts.upload_url' || action === 'payouts.attach_document' || action === 'payouts.document_url') {
      const { data: batch } = await db.from('affiliate_payout_batches').select('*').eq('id', String(body.batch_id || '')).maybeSingle()
      if (!batch) return json(404, { error: 'Batch not found.' })
      if (action === 'payouts.upload_url') {
        const name = core.str(body.filename, 120) || 'document.pdf'
        const path = `${batch.affiliate_id}/${batch.id}/admin-${Date.now()}-${name.replace(/[^A-Za-z0-9._-]/g, '_')}`
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path)
        if (error) throw error
        return json(200, { url: data.signedUrl, token: data.token, path })
      }
      if (action === 'payouts.attach_document') {
        const path = core.str(body.path, 300)
        if (!path || !path.startsWith(`${batch.affiliate_id}/${batch.id}/`)) return json(400, { error: 'Invalid document path.' })
        const doc = { name: core.str(body.name, 120) || 'document', path, size: Number(body.size) || null, kind: body.kind === 'invoice' ? 'invoice' : 'proof', uploaded_by: 'admin', uploaded_at: nowIso() }
        const documents = [...(batch.documents || []), doc]
        await db.from('affiliate_payout_batches').update({ documents }).eq('id', batch.id)
        await service.audit(db, { actor, action: 'payout.document_attached', entityType: 'payout_batch', entityId: batch.id, affiliateId: batch.affiliate_id, after: { name: doc.name, kind: doc.kind } })
        return json(200, { ok: true, documents })
      }
      const path = core.str(body.path, 300)
      if (!path || !(batch.documents || []).some((d) => d.path === path)) return json(404, { error: 'Document not found.' })
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 600)
      if (error) throw error
      return json(200, { url: data.signedUrl })
    }

    // ── exports ───────────────────────────────────────────────────────────────
    if (action === 'export') {
      const kind = String(body.kind || '')
      const columns = core.EXPORT_COLUMNS[kind]
      if (!columns) return json(400, { error: 'Unknown export kind.' })
      const rows = await exportRows(db, kind, body)
      await service.audit(db, { actor, action: 'export', entityType: 'export', entityId: kind, after: { rows: rows.length, filters: { program_id: body.program_id || null, affiliate_id: body.affiliate_id || null, status: body.status || null, from: body.from || null, to: body.to || null } } })
      return { statusCode: 200, headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="affiliate-${kind}-${nowIso().slice(0, 10)}.csv"` }, body: core.toCsv(columns, rows) }
    }

    // ── audit ─────────────────────────────────────────────────────────────────
    if (action === 'audit.list') {
      let q = db.from('affiliate_audit_log').select('*').order('created_at', { ascending: false })
      if (body.entity_type) q = q.eq('entity_type', body.entity_type)
      if (body.entity_id) q = q.eq('entity_id', String(body.entity_id))
      if (body.affiliate_id) q = q.eq('affiliate_id', body.affiliate_id)
      if (body.program_id) q = q.eq('program_id', body.program_id)
      const { data, error } = await q.limit(limitOf(body))
      if (error) throw error
      return json(200, { entries: data || [] })
    }

    return json(400, { error: `Unknown action: ${action}` })
  } catch (e) {
    console.error(`[affiliate-admin] ${action} failed:`, e.message)
    return json(500, { error: 'The request failed. Check the function log.', code: action })
  }
}

function decorate(row, maps) {
  const p = row.program_id ? maps.programs.get(row.program_id) : null
  const m = row.membership_id ? maps.memberships.get(row.membership_id) : null
  const affId = row.affiliate_id || (m ? m.affiliate_id : null)
  const a = affId ? maps.affiliates.get(affId) : null
  return { ...row, program_slug: p ? p.slug : null, program_name: p ? p.name : null, affiliate_id: affId, affiliate_name: a ? a.full_name : null, affiliate_email: a ? a.email : null }
}

async function exportRows(db, kind, f) {
  const maps = await mapsFor(db)
  const lim = MAX_LIMIT * 5
  const utm = (v, k) => (v.utm && v.utm[k]) || null
  if (kind === 'affiliates') {
    const { data } = await db.from('affiliates').select('*').order('created_at', { ascending: true })
    return (data || []).map((a) => ({ affiliate_id: a.id, status: a.status, full_name: a.full_name, email: a.email, company: a.company, website: a.website, social_url: a.social_url, country: a.country, payout_method: a.payout_method, created_at: a.created_at }))
  }
  if (kind === 'memberships') {
    const { data } = await db.from('affiliate_memberships').select('*')
    const { data: codes } = await db.from('affiliate_codes').select('*').eq('kind', 'link')
    return (data || []).map((m) => {
      const p = maps.programs.get(m.program_id) || {}
      const a = maps.affiliates.get(m.affiliate_id) || {}
      const c = (codes || []).find((x) => x.membership_id === m.id && x.is_primary) || (codes || []).find((x) => x.membership_id === m.id)
      return { membership_id: m.id, program_slug: p.slug, affiliate_id: m.affiliate_id, affiliate_email: a.email, status: m.status, primary_code: c ? c.code : null, clicks_total: m.clicks_total, approved_at: m.approved_at, created_at: m.created_at }
    })
  }
  if (kind === 'clicks') {
    let q = db.from('affiliate_visits').select('*').order('created_at', { ascending: false })
    q = applyFilters(q, f)
    const { data } = await q.limit(lim)
    const { data: codes } = await db.from('affiliate_codes').select('*')
    return (data || []).map((v) => {
      const p = maps.programs.get(v.program_id) || {}
      const m = maps.memberships.get(v.membership_id) || {}
      const c = (codes || []).find((x) => x.id === v.code_id)
      return { visit_id: v.id, program_slug: p.slug, affiliate_id: m.affiliate_id, code: c ? c.code : null, visit_token: v.visit_token, landing_path: v.landing_path, referrer_host: v.referrer_host, utm_source: utm(v, 'utm_source'), utm_medium: utm(v, 'utm_medium'), utm_campaign: utm(v, 'utm_campaign'), created_at: v.created_at }
    })
  }
  if (kind === 'conversions') {
    let q = db.from('affiliate_conversions').select('*').order('occurred_at', { ascending: false })
    q = applyFilters(q, f, { dateCol: 'occurred_at', typeCol: 'conversion_type' })
    const { data } = await q.limit(lim)
    return (data || []).map((c) => {
      const p = maps.programs.get(c.program_id) || {}
      const m = maps.memberships.get(c.membership_id) || {}
      const a = maps.affiliates.get(m.affiliate_id) || {}
      return { conversion_id: c.id, program_slug: p.slug, affiliate_id: m.affiliate_id, affiliate_email: a.email, conversion_type: c.conversion_type, status: c.status, source: c.source, external_id: c.external_id, customer_ref: c.customer_ref, amount: core.centsToMajor(c.amount_cents), currency: c.currency, occurred_at: c.occurred_at, idempotency_key: c.idempotency_key, flags: (c.flags || []).join('|') }
    })
  }
  if (kind === 'commissions') {
    let q = db.from('affiliate_commissions').select('*').order('created_at', { ascending: false })
    q = applyFilters(q, f)
    const { data } = await q.limit(lim)
    const { data: items } = await db.from('affiliate_payout_items').select('*')
    return (data || []).map((c) => {
      const p = maps.programs.get(c.program_id) || {}
      const a = maps.affiliates.get(c.affiliate_id) || {}
      const item = (items || []).find((i) => i.commission_id === c.id)
      return { commission_id: c.id, conversion_id: c.conversion_id, program_slug: p.slug, affiliate_id: c.affiliate_id, affiliate_email: a.email, status: c.status, amount: core.centsToMajor(c.amount_cents), currency: c.currency, approve_after: c.approve_after, approved_at: c.approved_at, paid_at: c.paid_at, payout_batch_id: item ? item.batch_id : null, reconciliation_flag: c.reconciliation_flag, created_at: c.created_at }
    })
  }
  if (kind === 'payout_batches') {
    let q = db.from('affiliate_payout_batches').select('*').order('created_at', { ascending: false })
    q = applyFilters(q, f)
    const { data } = await q.limit(lim)
    return (data || []).map((b) => {
      const a = maps.affiliates.get(b.affiliate_id) || {}
      return { batch_id: b.id, affiliate_id: b.affiliate_id, affiliate_email: a.email, affiliate_name: a.full_name, status: b.status, currency: b.currency, total: core.centsToMajor(b.total_cents), item_count: b.item_count, payout_method: b.payout_method, payout_details: b.payout_details, external_reference: b.external_reference, created_at: b.created_at, paid_at: b.paid_at }
    })
  }
  if (kind === 'payout_items') {
    let q = db.from('affiliate_payout_items').select('*').order('created_at', { ascending: false })
    if (f.batch_id) q = q.eq('batch_id', f.batch_id)
    const { data } = await q.limit(lim)
    const ids = (data || []).map((i) => i.commission_id)
    const { data: comms } = ids.length ? await db.from('affiliate_commissions').select('*').in('id', ids) : { data: [] }
    const convIds = (comms || []).map((c) => c.conversion_id)
    const { data: convs } = convIds.length ? await db.from('affiliate_conversions').select('*').in('id', convIds) : { data: [] }
    return (data || []).map((i) => {
      const c = (comms || []).find((x) => x.id === i.commission_id) || {}
      const v = (convs || []).find((x) => x.id === c.conversion_id) || {}
      const a = maps.affiliates.get(c.affiliate_id) || {}
      return { batch_id: i.batch_id, commission_id: i.commission_id, conversion_id: c.conversion_id, affiliate_email: a.email, amount: core.centsToMajor(i.amount_cents), currency: i.currency, conversion_type: v.conversion_type, occurred_at: v.occurred_at }
    })
  }
  return []
}

exports.handle = handle
