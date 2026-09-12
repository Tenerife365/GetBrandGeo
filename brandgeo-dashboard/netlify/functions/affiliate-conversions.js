/**
 * affiliate-conversions.js -- POST /api/affiliate/conversions
 * (netlify.toml rewrites that path here). The generic conversion endpoint for
 * BrandGEO itself and for any other project that runs a program.
 *
 * AUTH: Authorization: Bearer <program api key>  (or X-Api-Key). The key
 * identifies the program, so `program` in the body is optional and, if sent,
 * must match. Rotate keys from the admin page.
 *
 * POST {
 *   idempotency_key: "order_1234",            required, unique per program
 *   conversion_type: "lead|qualified_lead|sale|recurring|custom",
 *   affiliate_code?: "DANIEL10",              a link or coupon code
 *   referral_id?:    "<bg_rid from the redirect>",
 *   external_id?:    "order_1234",            order / invoice / lead id
 *   external_customer_id?: "customer_88",     stable customer id in YOUR system
 *   customer_email?: "j@example.com",         hashed for matching, masked for display, never stored raw
 *   amount?: "299.00" | amount_cents?: 29900,
 *   currency?: "EUR",
 *   status?: "confirmed|refunded|cancelled",  refunded/cancelled on a NEW key records it reversed
 *   occurred_at?: ISO timestamp,
 *   metadata?: { ... }                        up to 4 KB, stored as sent
 * }
 *   -> 201 { ok, conversion: {...}, commission: {...}|null, duplicate: false }
 *   -> 200 { ok, duplicate: true, conversion, commission }   same key or same external_id seen before
 *   -> 400 validation, 401 bad key, 422 nothing to attribute, 500 write failed
 *
 * To refund or cancel an EXISTING conversion:
 *   POST { action: "reverse", idempotency_key: "<the original key>", status: "refunded", reason?: "..." }
 *   -> 200 { ok, conversion, commissions }
 *
 * THE COMMISSION IS NEVER ACCEPTED FROM THE CALLER. Any `commission` field in
 * the body is ignored; the amount is computed from the program's rules.
 */

const { requireProgramApiKey } = require('./_affiliate_auth')
const core = require('./_affiliate_core')
const service = require('./_affiliate_service')

async function handle(event, { supabase = null } = {}) {
  const auth = await requireProgramApiKey(event, { client: supabase })
  if (auth.response) return auth.response
  const { program, headers } = auth
  const db = auth.supabase
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })
  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { error: 'Invalid JSON' }) }
  if (body.program && String(body.program).toLowerCase() !== program.slug) return json(400, { error: 'program does not match the API key' })

  const actor = { type: 'api', label: `api:${program.slug}` }

  if (body.action === 'reverse') {
    const key = core.str(body.idempotency_key, 200)
    if (!key) return json(400, { error: 'idempotency_key is required' })
    const newStatus = body.status === 'cancelled' ? 'cancelled' : 'refunded'
    const { data: existing } = await db.from('affiliate_conversions').select('id, program_id').eq('idempotency_key', key).maybeSingle()
    if (!existing || existing.program_id !== program.id) return json(404, { error: 'Conversion not found' })
    try {
      const result = await service.reverseConversion(db, { conversionId: existing.id, newStatus, reason: core.str(body.reason, 500), actor })
      if (!result.ok) return json(result.status, { error: result.error })
      return json(200, { ok: true, conversion: shapeConversion(result.conversion), commissions: (result.commissions || []).map(shapeCommission) })
    } catch (e) {
      console.error('[affiliate-conversions] reverse failed:', e.message)
      return json(500, { error: 'Could not reverse the conversion' })
    }
  }

  const { errors, row } = core.validateConversionInput(body)
  if (errors.length) return json(400, { error: errors[0], errors })

  try {
    const result = await service.recordConversion(db, { program, input: row, actor, source: 'api' })
    if (!result.ok) return json(result.status, { error: result.error })
    // A conversion that arrives already refunded/cancelled is recorded and immediately reversed.
    if (!result.duplicate && row.status !== 'confirmed') {
      const rev = await service.reverseConversion(db, { conversionId: result.conversion.id, newStatus: row.status, reason: 'received as ' + row.status, actor })
      return json(201, { ok: true, duplicate: false, conversion: shapeConversion(rev.conversion), commission: null })
    }
    return json(result.duplicate ? 200 : 201, {
      ok: true,
      duplicate: !!result.duplicate,
      conversion: shapeConversion(result.conversion),
      commission: result.commission ? shapeCommission(result.commission) : null,
    })
  } catch (e) {
    console.error('[affiliate-conversions] record failed:', e.message)
    return json(500, { error: 'Could not record the conversion' })
  }
}

function shapeConversion(c) {
  return {
    id: c.id, idempotency_key: c.idempotency_key, conversion_type: c.conversion_type, status: c.status,
    amount: core.centsToMajor(c.amount_cents), amount_cents: Number(c.amount_cents), currency: c.currency,
    external_id: c.external_id, customer_ref: c.customer_ref, source: c.source, occurred_at: c.occurred_at, flags: c.flags || [],
  }
}

function shapeCommission(c) {
  return { id: c.id, status: c.status, amount: core.centsToMajor(c.amount_cents), amount_cents: Number(c.amount_cents), currency: c.currency, approve_after: c.approve_after }
}

exports.handler = (event) => handle(event)
exports.handle = handle
