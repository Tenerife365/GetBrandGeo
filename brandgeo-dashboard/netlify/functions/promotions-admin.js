/**
 * promotions-admin.js -- admin-only CRUD for platform-wide promotion codes.
 * Backend half of PromotionsPanel.tsx (PRICING-STRATEGY-2026-07.md §8, §12 T3).
 *
 * POST body, one of:
 *   { action: 'list' }
 *     -> { promotions: Promotion[] }
 *   { action: 'create', label, code, discount_type, value, plans[], starts_at?, ends_at? }
 *     -> { promotion: Promotion }
 *   { action: 'toggle', id, active }
 *     -> { ok: true, id, active }
 *
 * SCOPE. This manages the record of which promotions exist. It does NOT create
 * Stripe coupons and nothing on the checkout path reads this table yet, so no
 * call here can change what a customer is charged. Stripe wiring is separate
 * work with a real external dependency (PRICING-STRATEGY-2026-07.md §8).
 *
 * THE MIGRATION IS APPLIED (2026-07-26, re-verified 2026-07-29). The paragraph
 * below describes the pre-migration state and is kept because the 42P01 fallback
 * is still live code. It is no longer the current situation: the table, its three
 * admin-gated RLS policies and the deliberate absence of a delete policy are all
 * confirmed in production.
 *
 * BEFORE THE MIGRATION WAS APPLIED. db/supabase-promotions-migration.sql had not
 * been run. Until it was, every query failed with Postgres 42P01
 * (undefined_table) and this returned 404 -- which is exactly the signal
 * PromotionsPanel.tsx keys its "backend isn't deployed yet" state off
 * (PromotionsPanel.tsx:77, :113, :124). So shipping this function ahead of the
 * migration is safe and visible rather than silently broken.
 *
 * The promotions table is admin-only at the RLS level, but this holds the
 * service key (which bypasses RLS) behind requireAuth({ adminOnly: true }), the
 * same shape as set-client-category.js and set-client-plan.js.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
const { PLAN_LIVE_ENGINES } = require('./_cost')

// Validate plans against _cost.js, NOT _plans.js. _cost.js is the current mirror
// of planConfig.ts and is the copy that enforces entitlement; _plans.js has
// drifted and is missing growth_pro entirely (docs/arch/activation-path.md §3).
// Validating against the drifted copy would reject a promo targeting the €449
// tier -- the same defect as C1, one layer down. _auth.js:28 derives its plan
// list from _cost.js for this reason.
const VALID_PLANS = new Set(Object.keys(PLAN_LIVE_ENGINES))

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/
const MAX_LABEL = 120

const SELECT_COLS = 'id, label, code, discount_type, value, plans, starts_at, ends_at, active'

/** Postgres 42P01 = undefined_table. Means the migration has not been applied. */
function isMissingTable(error) {
  return error && (error.code === '42P01' || /relation .*promotions.* does not exist/i.test(error.message || ''))
}

/** PostgREST can hand numeric back as a string; the panel calls .toFixed() on it. */
function shapePromotion(row) {
  return { ...row, value: Number(row.value), plans: row.plans ?? [] }
}

/** null for absent, a Date for valid, undefined for present-but-unparseable. */
function parseWhen(v) {
  if (v === null || v === undefined || v === '') return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? undefined : d
}

function validateCreate(body) {
  const label = typeof body.label === 'string' ? body.label.trim() : ''
  if (!label) return { error: 'Label is required.' }
  if (label.length > MAX_LABEL) return { error: `Label must be ${MAX_LABEL} characters or fewer.` }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!code) return { error: 'Code is required.' }
  if (!CODE_RE.test(code)) {
    return { error: 'Code must be 3 to 32 characters, letters, digits, hyphen or underscore, starting with a letter or digit.' }
  }

  const discount_type = body.discount_type
  if (discount_type !== 'percent' && discount_type !== 'fixed') {
    return { error: "Discount type must be 'percent' or 'fixed'." }
  }

  const value = Number(body.value)
  if (!Number.isFinite(value) || value < 0) return { error: 'Value must be a number of 0 or more.' }
  if (discount_type === 'percent' && value > 100) return { error: 'A percent discount cannot exceed 100.' }

  const plans = Array.isArray(body.plans) ? body.plans : []
  if (plans.length === 0) return { error: 'Pick at least one plan this promo applies to.' }
  const unknown = plans.filter(p => !VALID_PLANS.has(p))
  if (unknown.length) return { error: `Unknown plan: ${unknown.join(', ')}.` }

  const starts = parseWhen(body.starts_at)
  if (starts === undefined) return { error: 'Start date is not a valid date.' }
  const ends = parseWhen(body.ends_at)
  if (ends === undefined) return { error: 'End date is not a valid date.' }
  if (starts && ends && ends <= starts) return { error: 'End date must be after the start date.' }

  return {
    row: {
      label,
      code,
      discount_type,
      // Round to cents so a fixed promo can't carry sub-cent precision the
      // numeric(10,2) column would silently truncate anyway.
      value: Math.round(value * 100) / 100,
      plans: [...new Set(plans)],
      starts_at: starts ? starts.toISOString() : null,
      ends_at: ends ? ends.toISOString() : null,
    },
  }
}

exports.handler = async (event) => {
  const auth = await requireAuth(event, { adminOnly: true })
  if (auth.response) return auth.response

  const headers = auth.headers
  const json = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) })

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' }

  let body
  try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // ── list ──────────────────────────────────────────────────────────────────
  if (body.action === 'list') {
    const { data, error } = await supabase
      .from('promotions')
      .select(SELECT_COLS)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingTable(error)) {
        console.log('[promotions-admin] promotions table missing; migration not applied yet')
        return json(404, { error: 'Promotions backend is not deployed yet.' })
      }
      console.error('[promotions-admin] list failed:', error.message)
      return json(500, { error: error.message })
    }
    return json(200, { promotions: (data ?? []).map(shapePromotion) })
  }

  // ── create ────────────────────────────────────────────────────────────────
  if (body.action === 'create') {
    const { error: invalid, row } = validateCreate(body)
    if (invalid) return json(400, { error: invalid })

    const { data, error } = await supabase
      .from('promotions')
      .insert({ ...row, created_by: auth.user.id })
      .select(SELECT_COLS)
      .single()

    if (error) {
      if (isMissingTable(error)) {
        console.log('[promotions-admin] promotions table missing; migration not applied yet')
        return json(404, { error: 'Promotions backend is not deployed yet.' })
      }
      if (error.code === '23505') return json(409, { error: `Code ${row.code} is already in use.` })
      console.error('[promotions-admin] create failed:', error.message)
      return json(500, { error: error.message })
    }

    console.log(`[promotions-admin] created promo ${data.id} (${data.code}) by ${auth.user.id}`)
    return json(200, { promotion: shapePromotion(data) })
  }

  // ── toggle ────────────────────────────────────────────────────────────────
  if (body.action === 'toggle') {
    const id = Number(body.id)
    if (!Number.isInteger(id) || id <= 0) return json(400, { error: 'Missing or invalid id.' })
    if (typeof body.active !== 'boolean') return json(400, { error: 'active must be true or false.' })

    const { data, error } = await supabase
      .from('promotions')
      .update({ active: body.active })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      if (isMissingTable(error)) {
        console.log('[promotions-admin] promotions table missing; migration not applied yet')
        return json(404, { error: 'Promotions backend is not deployed yet.' })
      }
      // .single() with no matching row surfaces as PGRST116. Deliberately NOT a
      // 404: the panel reads any 404 as "backend not deployed" and would show
      // the amber unavailable banner for what is really a stale row reference.
      if (error.code === 'PGRST116') return json(400, { error: `Promotion ${id} not found.` })
      console.error('[promotions-admin] toggle failed:', error.message)
      return json(500, { error: error.message })
    }

    console.log(`[promotions-admin] promo ${data.id} active=${body.active} by ${auth.user.id}`)
    return json(200, { ok: true, id: data.id, active: body.active })
  }

  return json(400, { error: "Unknown action. One of: 'list', 'create', 'toggle'." })
}
