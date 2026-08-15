/**
 * prospects-admin.js -- admin-only read/update for the BrandGEO prospect CRM
 * (public.prospects, db/supabase-prospects-migration.sql).
 *
 * Backend half of the prospect CRM. bg-app built the UI in parallel against
 * the same contract; this is the exact envelope agreed to close the one gap
 * the contract left open (the request/response shape), matching the app's
 * one existing precedent, promotions-admin.js paired with PromotionsPanel.tsx:
 *
 *   POST { action: 'list', stage?, segment? }
 *     -> 200 { prospects: Prospect[] }
 *   POST { action: 'update', id, patch: { ...writable fields } }
 *     -> 200 { prospect: Prospect }
 *     -> 4xx { error: string }
 *
 * `stage`/`segment` on a list request are optional server-side filters (the
 * packet asks for "list with filtering by stage and segment"); a bare
 * { action: 'list' } returns every row, exactly matching the coordinator's
 * minimal envelope.
 *
 * WRITE WHITELIST. The only fields a client may ever set: stage, notes,
 * owner, next_action_at, last_contacted_at, replied_at, reply_note. `domain`
 * and every audit-derived field (company, contact_name, contact_role,
 * contact_url, linkedin_url, segment, tier, disqualified_reason, audit_token,
 * ai_score, competitor_count, source) are read only from this endpoint --
 * they come from db/supabase-prospects-backfill-*.sql and whatever job
 * re-audits a domain later, never from the UI. A patch key outside the
 * whitelist is REJECTED (400, nothing written), not silently dropped, so a
 * future UI bug surfaces instead of quietly failing to persist. This mirrors
 * promotions-admin.js's validateCreate() shape: one pure function decides
 * what is allowed, the handler only calls it.
 *
 * disqualified_reason is deliberately not writable here. It is set only by
 * the backfill (a human-reviewed qualification record) or a future re-audit
 * job. The UI's Disqualify button writes only stage='disqualified'; a row
 * disqualified from the UI has disqualified_reason: null, which is correct,
 * not a bug -- there is no evidenced reason to record for a UI-driven call.
 *
 * AUTH. requireAuth({ adminOnly: true }), same as promotions-admin.js and
 * set-client-plan.js. Holds the service key (bypasses RLS) behind that gate;
 * public.prospects' own RLS policies (admin-only, supabase-prospects-
 * migration.sql) are defence in depth for direct PostgREST access, not the
 * primary gate.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')

const SELECT_COLS = `
  id, domain, company, contact_name, contact_role, contact_url, linkedin_url,
  segment, tier, stage, disqualified_reason, audit_token, ai_score,
  competitor_count, source, owner, last_contacted_at, next_action_at,
  replied_at, reply_note, notes, created_at, updated_at
`.replace(/\s+/g, ' ').trim()

// Exactly db/supabase-prospects-migration.sql's stage CHECK constraint.
const VALID_STAGES = new Set([
  'new', 'qualified', 'audited', 'contacted', 'replied', 'meeting', 'won', 'lost', 'disqualified',
])

// The ONLY columns a PATCH may ever touch. Everything else on the row
// (domain, and every audit-derived field) is read only from this endpoint.
const WRITABLE_FIELDS = new Set([
  'stage', 'notes', 'owner', 'next_action_at', 'last_contacted_at', 'replied_at', 'reply_note',
])

const TIMESTAMP_FIELDS = new Set(['next_action_at', 'last_contacted_at', 'replied_at'])
const TEXT_FIELDS = new Set(['notes', 'owner', 'reply_note'])

/** null for absent, a Date for valid, undefined for present-but-unparseable. */
function parseWhen(v) {
  if (v === null || v === undefined || v === '') return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? undefined : d
}

/**
 * validateUpdate(body) -> { error: string } | { id: number, patch: object }
 *
 * Pure and side-effect free (no Supabase call), so it is unit-testable on
 * its own -- see tests/prospects_admin_whitelist.test.js. Rejects the whole
 * request on any non-whitelisted key in body.patch, per the contract: a
 * future UI bug that starts sending e.g. `ai_score` in a patch must surface
 * as a 400, not silently no-op on that one field while the rest saves.
 */
function validateUpdate(body) {
  const id = Number(body.id)
  if (!Number.isInteger(id) || id <= 0) return { error: 'Missing or invalid id.' }

  const rawPatch = body.patch
  if (!rawPatch || typeof rawPatch !== 'object' || Array.isArray(rawPatch)) {
    return { error: 'patch must be an object.' }
  }

  const keys = Object.keys(rawPatch)
  if (keys.length === 0) return { error: 'patch must contain at least one field.' }

  const rejected = keys.filter(k => !WRITABLE_FIELDS.has(k))
  if (rejected.length > 0) {
    return { error: `Not writable: ${rejected.join(', ')}. Only ${[...WRITABLE_FIELDS].join(', ')} may be set here.` }
  }

  const patch = {}

  if ('stage' in rawPatch) {
    if (typeof rawPatch.stage !== 'string' || !VALID_STAGES.has(rawPatch.stage)) {
      return { error: `stage must be one of: ${[...VALID_STAGES].join(', ')}.` }
    }
    patch.stage = rawPatch.stage
  }

  for (const field of TEXT_FIELDS) {
    if (!(field in rawPatch)) continue
    const v = rawPatch[field]
    if (v !== null && typeof v !== 'string') return { error: `${field} must be a string or null.` }
    patch[field] = v === null ? null : v.slice(0, 10000)
  }

  for (const field of TIMESTAMP_FIELDS) {
    if (!(field in rawPatch)) continue
    const parsed = parseWhen(rawPatch[field])
    if (parsed === undefined) return { error: `${field} is not a valid date.` }
    patch[field] = parsed ? parsed.toISOString() : null
  }

  return { id, patch }
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
    let query = supabase.from('prospects').select(SELECT_COLS).order('created_at', { ascending: false })

    if (body.stage !== undefined && body.stage !== null) {
      if (typeof body.stage !== 'string' || !VALID_STAGES.has(body.stage)) {
        return json(400, { error: `stage must be one of: ${[...VALID_STAGES].join(', ')}.` })
      }
      query = query.eq('stage', body.stage)
    }

    if (body.segment !== undefined && body.segment !== null) {
      if (typeof body.segment !== 'string' || !body.segment.trim()) {
        return json(400, { error: 'segment must be a non-empty string.' })
      }
      query = query.eq('segment', body.segment)
    }

    const { data, error } = await query
    if (error) {
      console.error('[prospects-admin] list failed:', error.message)
      return json(500, { error: error.message })
    }
    return json(200, { prospects: data ?? [] })
  }

  // ── update ────────────────────────────────────────────────────────────────
  if (body.action === 'update') {
    const { error: invalid, id, patch } = validateUpdate(body)
    if (invalid) return json(400, { error: invalid })

    const { data, error } = await supabase
      .from('prospects')
      .update(patch)
      .eq('id', id)
      .select(SELECT_COLS)
      .single()

    if (error) {
      // .single() with no matching row surfaces as PGRST116.
      if (error.code === 'PGRST116') return json(404, { error: `Prospect ${id} not found.` })
      console.error('[prospects-admin] update failed:', error.message)
      return json(500, { error: error.message })
    }

    console.log(`[prospects-admin] prospect ${data.id} updated (${Object.keys(patch).join(', ')}) by ${auth.user.id}`)
    return json(200, { prospect: data })
  }

  return json(400, { error: "Unknown action. One of: 'list', 'update'." })
}

module.exports.validateUpdate = validateUpdate
module.exports.WRITABLE_FIELDS = WRITABLE_FIELDS
module.exports.VALID_STAGES = VALID_STAGES
