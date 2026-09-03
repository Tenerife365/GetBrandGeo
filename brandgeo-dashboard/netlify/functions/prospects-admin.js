/**
 * prospects-admin.js -- admin-only read/update for the BrandGEO prospect CRM
 * (public.prospects, db/supabase-prospects-migration.sql;
 * public.prospect_touches, db/supabase-prospect-channels-migration.sql, FK
 * behaviour corrected to ON DELETE RESTRICT by
 * db/supabase-prospect-touches-restrict-2026-08-15.sql).
 *
 * Backend half of the prospect CRM. bg-app built the UI in parallel against
 * the same contract; this is the exact envelope agreed to close the one gap
 * the contract left open (the request/response shape), matching the app's
 * one existing precedent, promotions-admin.js paired with PromotionsPanel.tsx:
 *
 *   POST { action: 'list', stage?, segment? }
 *     -> 200 { prospects: Prospect[] }   -- each row carries `touches:
 *                                            Touch[]` (most recent first).
 *   POST { action: 'update', id, patch: { ...writable fields } }
 *     -> 200 { prospect: Prospect }      -- ALSO carries `touches: Touch[]`.
 *                                            See "uniform response shape".
 *     -> 4xx { error: string }
 *   POST { action: 'touch', prospect_id, channel, direction, occurred_at?,
 *          subject?, body?, note?, retry_of? }
 *     -> 200 { touch: Touch, prospect: Prospect, warning?: string }
 *                                         -- prospect is the row
 *                                            AFTER last_contacted_at/
 *                                            replied_at was updated, and ALSO
 *                                            carries `touches: Touch[]`. The
 *                                            UI never needs a second call.
 *                                            `warning` appears when the touch
 *                                            and the stamp both landed but the
 *                                            follow-up date could not be
 *                                            scheduled; the write succeeded and
 *                                            must NOT be retried. Undeclared
 *                                            until 2026-09-03 (review F8).
 *     -> 4xx { error: string }
 *     -> 500 { error: string, code: string, touch_id?: number }  -- see
 *                                            "not atomic" below. NOTE the
 *                                            2026-08-20 extraction into
 *                                            _touches.js renamed four of these
 *                                            codes (touch:retry_lookup ->
 *                                            touch:retry_lookup_failed,
 *                                            touch:insert -> touch:insert_failed,
 *                                            touch:stamp -> touch:stamp_failed,
 *                                            touch:restamp_fetch ->
 *                                            touch:refetch_failed) and TOUCH_COLS
 *                                            gained `external_id`, so every
 *                                            Touch carries one more key. Both
 *                                            were undeclared until 2026-09-03
 *                                            (review F8); nothing in src/ reads
 *                                            either, so no live caller broke.
 *   POST { action: 'promote', candidate_id }
 *     -> 200 { prospect: Prospect, candidate: Candidate, warning?: string }
 *     -> 4xx { error: string }
 *
 * CONTACT ROUTE CANDIDATES (packet 019, added 2026-08-16). Every prospect a
 * response returns also carries `candidates: Candidate[]` from
 * public.prospect_contact_candidates, ordered strongest first, the same
 * uniform-shape rule the `touches` key already follows.
 *
 * `promote` is the ONLY way a contact route reaches public.prospects, and it
 * exists because resolve-contact-routes.js deliberately refuses to write that
 * table at all: a resolver can find a string on a page, it cannot decide the
 * string belongs to the person you mean (2026-08-15 produced three X accounts
 * that looked right and were impostors). So the resolver stages evidence and
 * a human picks one. `promote` takes ONLY a candidate id -- never a free-text
 * value -- so the value written is by construction a string the resolver
 * actually saw at a recorded URL, and the WRITABLE_FIELDS whitelist below
 * stays exactly as narrow as it was: contact_email, linkedin_url and x_url
 * remain unpatchable through `update`.
 *
 * `promote` NEVER sets x_verified or linkedin_verified. Choosing to use a URL
 * is not the same as having confirmed it belongs to that person, and LinkedIn
 * cannot be positively confirmed by machine at all (HTTP 999). Conflating the
 * two would put "Verified" in the UI on the strength of a click.
 *
 * UNIFORM RESPONSE SHAPE (found by bg-app building against this contract,
 * 2026-08-15). `list` was the only action nesting `touches` onto each
 * prospect; `update` and `touch` returned a prospect with no `touches` key
 * at all, and only this comment said so -- SELECT_COLS never included it, so
 * a caller trusting the doc over the actual shape got a partial row. bg-app
 * had already merged client side and was unaffected either way, but the fix
 * chosen is to make the shape itself uniform rather than keep documenting an
 * exception: `attachTouches()` below runs one extra indexed query
 * (`prospect_touches` filtered to a single `prospect_id`) after `update` and
 * `touch`, so all three actions now return a prospect that is never partial.
 * Chosen over "just fix the comment" because the query is cheap and indexed,
 * and it removes a whole class of "which action returns what" bug for every
 * future caller, not only the one that found it.
 *
 * `stage`/`segment` on a list request are optional server-side filters (the
 * packet asks for "list with filtering by stage and segment"); a bare
 * { action: 'list' } returns every row, exactly matching the coordinator's
 * minimal envelope.
 *
 * WRITE WHITELIST for `update`. The only fields a client may ever set: stage,
 * notes, owner, next_action_at, last_contacted_at, replied_at, reply_note.
 * `domain` and every audit/research-derived field (company, contact_name,
 * contact_role, contact_url, linkedin_url, segment, tier,
 * disqualified_reason, audit_token, ai_score, competitor_count, source,
 * contact_email, contact_email_source, contact_email_kind, x_url, x_verified,
 * linkedin_verified) are read only from this endpoint -- they come from
 * db/supabase-prospects-backfill-*.sql, gtm-outbound's research, and whatever
 * job re-audits a domain or re-verifies a profile URL later, never from the
 * UI. A patch key outside the whitelist is REJECTED (400, nothing written),
 * not silently dropped, so a future UI bug surfaces instead of quietly
 * failing to persist. This mirrors promotions-admin.js's validateCreate()
 * shape: one pure function decides what is allowed, the handler only calls it.
 *
 * disqualified_reason is deliberately not writable here. It is set only by
 * the backfill (a human-reviewed qualification record) or a future re-audit
 * job. The UI's Disqualify button writes only stage='disqualified'; a row
 * disqualified from the UI has disqualified_reason: null, which is correct,
 * not a bug -- there is no evidenced reason to record for a UI-driven call.
 *
 * `touch` NEVER sets a stage. Logging a touch records that an outreach event
 * happened; it says nothing about qualification or pipeline stage, and the
 * packet that added this action was explicit that nobody has been contacted
 * yet -- this endpoint exists so a real touch can be logged truthfully when
 * it happens, not to backfill one. An outbound touch sets
 * `last_contacted_at = occurred_at`; an inbound touch sets
 * `replied_at = occurred_at`.
 *
 * OCCURRED_AT IS BOUNDED (bg-verify S1, 2026-08-15, BLOCKING, fixed here).
 * `occurred_at` is written verbatim into `last_contacted_at`/`replied_at`, so
 * a loose value there causes exactly the double touch this table exists to
 * prevent. Non-string input (`0`, `1`, `true`, `false`, arrays, objects) is
 * rejected outright before any date parsing, and a valid ISO string is
 * further clamped to [`TOUCH_MIN_OCCURRED_AT`, now + `TOUCH_MAX_FUTURE_MS`].
 * The floor is 2026-01-01: this CRM's own data starts at the 2026-08-15
 * backfill (packet 015) and nothing legitimate predates this year. The 24h
 * forward ceiling absorbs real clock skew and someone logging a touch just
 * before midnight in a timezone ahead of UTC, without admitting a
 * "3026-01-01" style far-future value that would make a prospect look
 * permanently just-contacted and never get followed up.
 *
 * NOT ATOMIC, STATED HONESTLY (bg-verify S2, 2026-08-15 -- an earlier version
 * of this comment claimed the two writes below "can never disagree", which
 * was false; see docs/qa/prospect-channels-review-2026-08-15.md). The insert
 * into prospect_touches and the UPDATE on prospects are two separate
 * PostgREST calls, not one transaction. If the prospect stamp UPDATE fails
 * after the insert already succeeded, the handler returns 500 with a
 * STRUCTURED `touch_id` field (never only interpolated into the message
 * string), so the caller does not have to guess whether the touch was
 * logged. The caller then retries with `retry_of: <touch_id>` added to the
 * SAME request -- resending the FULL payload, including `channel` and
 * `direction`; `validateTouch()` requires both regardless of `retry_of` and
 * they are validated before `retry_of` is even parsed (bg-verify S9
 * correction: an earlier version of this comment incorrectly said a retry
 * "may omit channel/direction/occurred_at"). The handler then skips the
 * insert, re-uses the already-logged touch row by id, and only retries the
 * prospect stamp -- so a retry after a partial failure cannot create a
 * duplicate touch row. A retry with no `retry_of` is treated as a new,
 * distinct event, by design.
 *
 * THE STAMP IS FORWARD-ONLY (bg-verify S8, 2026-08-15, MEDIUM, fixed here).
 * An unconditional stamp let an ordinary, explicitly supported backfill
 * (log today's touch, then remember to log last week's) rewind
 * `last_contacted_at`/`replied_at` to the older date -- the same double
 * touch S1 was blocked on, just with a narrower window (roughly seven
 * months instead of unbounded) rather than the mechanism being closed. The
 * stamp UPDATE now carries `buildAdvanceOnlyFilter()`'s WHERE clause (the
 * column is null OR strictly earlier than the new value) IN THE SAME
 * statement as the SET, so Postgres's row lock makes the compare-and-swap
 * atomic under concurrent touches, and the older touch is still recorded
 * faithfully in `prospect_touches` -- only the derived queue field is
 * clamped. Chosen over the `rpc()` bg-verify flagged as the natural home
 * for S2 and S8 together: see the inline comment at the stamp UPDATE for
 * why an `rpc()` was judged not worth the RLS-widening risk this round.
 *
 * AUTH. requireAuth({ adminOnly: true }), same as promotions-admin.js and
 * set-client-plan.js. Holds the service key (bypasses RLS) behind that gate;
 * public.prospects' and public.prospect_touches' own RLS policies (admin-
 * only, supabase-prospects-migration.sql / supabase-prospect-channels-
 * migration.sql) are defence in depth for direct PostgREST access, not the
 * primary gate.
 *
 * ERROR RESPONSES DO NOT LEAK RAW POSTGRES TEXT (bg-verify S6, 2026-08-15).
 * Every 5xx logs `error.message` server side via `fail500()` below and
 * returns a fixed message plus a `code` naming which operation failed, never
 * the driver's own error string.
 */

const { createClient } = require('@supabase/supabase-js')
const { requireAuth } = require('./_auth')
// The touch write path lives in _touches.js so the inbound reply poller can
// reuse it instead of becoming a second copy (docs/arch/reply-handling.md 4.5).
// The names below are re-exported at the bottom of this file so the existing
// test suite keeps importing them from here.
const {
  recordTouch, nextActionAtFor, stampFieldFor, buildAdvanceOnlyFilter,
  TOUCH_COLS, FOLLOW_UP_STEPS_DAYS, TERMINAL_STAGES,
  // The occurred_at bounds moved to _touches.js on 2026-09-03 (review F3):
  // there are two callers now and the poller was enforcing only half of them.
  // They are still re-exported from this file so existing tests keep working.
  TOUCH_MIN_OCCURRED_AT, TOUCH_MAX_FUTURE_MS,
} = require('./_touches')

const SELECT_COLS = `
  id, domain, company, contact_name, contact_role, contact_url, linkedin_url,
  segment, tier, stage, disqualified_reason, audit_token, ai_score,
  competitor_count, source, owner, last_contacted_at, next_action_at,
  replied_at, reply_note, notes, created_at, updated_at,
  contact_email, contact_email_source, contact_email_kind, x_url,
  x_verified, linkedin_verified
`.replace(/\s+/g, ' ').trim()

const CANDIDATE_COLS = 'id, prospect_id, kind, value, source_url, email_kind, confidence, promoted, created_at'

// db/supabase-prospect-contact-candidates-2026-08-16.sql's kind CHECK.
const VALID_CANDIDATE_KINDS = new Set(['email', 'linkedin', 'x'])

// Strongest first. Sorted in memory rather than in the query because
// `confidence` is text, and Postgres would order it alphabetically as
// high, low, medium -- putting the weakest evidence second.
const CONFIDENCE_RANK = { high: 0, medium: 1, low: 2 }

function candidateSort(a, b) {
  const rankA = CONFIDENCE_RANK[a.confidence] ?? 3
  const rankB = CONFIDENCE_RANK[b.confidence] ?? 3
  if (rankA !== rankB) return rankA - rankB
  // An address that reaches one named person beats a shared inbox at the
  // same confidence, for the same reason Prospects.tsx's channelStrength()
  // weights it: a role mailbox reaches a queue, not a decision maker.
  const indivA = a.email_kind === 'individual' ? 0 : 1
  const indivB = b.email_kind === 'individual' ? 0 : 1
  if (indivA !== indivB) return indivA - indivB
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

// Exactly db/supabase-prospects-migration.sql's stage CHECK constraint.
const VALID_STAGES = new Set([
  'new', 'qualified', 'audited', 'contacted', 'replied', 'meeting', 'won', 'lost', 'disqualified',
])

// Exactly db/supabase-prospect-channels-migration.sql's prospect_touches
// CHECK constraints.
const VALID_CHANNELS = new Set(['email', 'linkedin', 'x'])
const VALID_DIRECTIONS = new Set(['out', 'in'])

// bg-verify S1 fix: occurred_at bounds. See the header comment's "OCCURRED_AT
// IS BOUNDED" section for the reasoning behind these exact values. The two
// constants now live in _touches.js (imported above) so the poller enforces
// the identical floor; review finding F3, 2026-09-03.

// The ONLY columns a PATCH may ever touch. Everything else on the row
// (domain, and every audit/research-derived field, including the new
// contact_email*/x_url/verified columns) is read only from this endpoint.
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
 * parseId(v) -> number | null
 *
 * bg-verify S5 fix, 2026-08-15. A bare `Number(v)` coerces `true`, `[1]`,
 * `"1e0"` and `" 1 "` (leading/trailing whitespace) into `1`, so a malformed
 * caller can file a touch against the wrong prospect without ever sending
 * anything that looks like an id. Only a real JS number, or a string of one
 * or more ASCII digits with no surrounding whitespace and no exponent or
 * decimal notation, is accepted.
 */
function parseId(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? v : null
  if (typeof v === 'string' && /^[0-9]+$/.test(v)) return Number(v)
  return null
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
  // Routed through parseId() (bg-verify R6, "carried forward" note,
  // 2026-08-15): the same coercion looseness S5 fixed on prospect_id
  // (`true`, `[1]`, `"1e0"`, `" 1 "` all becoming `1`) existed here too via
  // a bare `Number(body.id)`. Lower severity than S5 was -- `update` writes
  // only whitelisted queue fields to a row the caller named, it files no
  // message against anyone, and a wrong id mostly just 404s -- but free to
  // fix while already in this file, so it is fixed rather than re-flagged.
  const id = parseId(body.id)
  if (id === null || id <= 0) return { error: 'Missing or invalid id.' }

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

/**
 * validateTouch(body) -> { error: string }
 *   | { prospect_id, channel, direction, occurredAtIso, insert: object, retryOf: number | null }
 *
 * Pure and side-effect free, same shape as validateUpdate() -- unit-tested
 * without a database in tests/prospects_admin_whitelist.test.js.
 * `occurred_at` defaults to now() (a real-time touch) when absent; if
 * present it must be a string, must parse, and must fall inside
 * [TOUCH_MIN_OCCURRED_AT, now + TOUCH_MAX_FUTURE_MS] (bg-verify S1).
 * subject/body/note are optional free text, each capped the same as the
 * TEXT_FIELDS above. `retry_of` is an optional existing touch id (bg-verify
 * S2) -- see the header comment's "NOT ATOMIC" section.
 */
function validateTouch(body) {
  const prospect_id = parseId(body.prospect_id)
  if (prospect_id === null || prospect_id <= 0) return { error: 'Missing or invalid prospect_id.' }

  if (typeof body.channel !== 'string' || !VALID_CHANNELS.has(body.channel)) {
    return { error: `channel must be one of: ${[...VALID_CHANNELS].join(', ')}.` }
  }
  const channel = body.channel

  if (typeof body.direction !== 'string' || !VALID_DIRECTIONS.has(body.direction)) {
    return { error: `direction must be one of: ${[...VALID_DIRECTIONS].join(', ')}.` }
  }
  const direction = body.direction

  let occurredAtIso
  if (body.occurred_at === undefined || body.occurred_at === null || body.occurred_at === '') {
    occurredAtIso = new Date().toISOString()
  } else {
    // bg-verify S1: reject anything that is not a string outright, BEFORE
    // parsing. `new Date(0)`, `new Date(true)` and `new Date(false)` all
    // parse successfully to 1970 -- the bug was never in parseWhen's date
    // handling, it was in accepting a type parseWhen was never meant to see.
    if (typeof body.occurred_at !== 'string') {
      return { error: 'occurred_at must be an ISO 8601 date string.' }
    }
    const parsed = parseWhen(body.occurred_at)
    if (parsed === undefined || parsed === null) return { error: 'occurred_at is not a valid date.' }
    const ms = parsed.getTime()
    if (ms < TOUCH_MIN_OCCURRED_AT) {
      return { error: `occurred_at cannot predate ${new Date(TOUCH_MIN_OCCURRED_AT).toISOString()}.` }
    }
    if (ms > Date.now() + TOUCH_MAX_FUTURE_MS) {
      return { error: 'occurred_at cannot be more than 24 hours in the future.' }
    }
    occurredAtIso = parsed.toISOString()
  }

  const insert = { prospect_id, channel, direction, occurred_at: occurredAtIso }
  for (const field of ['subject', 'body', 'note']) {
    if (!(field in body)) continue
    const v = body[field]
    if (v !== null && typeof v !== 'string') return { error: `${field} must be a string or null.` }
    insert[field] = v === null ? null : v.slice(0, 10000)
  }

  let retryOf = null
  if (body.retry_of !== undefined && body.retry_of !== null) {
    retryOf = parseId(body.retry_of)
    if (retryOf === null || retryOf <= 0) return { error: 'retry_of must be a valid touch id.' }
  }

  return { prospect_id, channel, direction, occurredAtIso, insert, retryOf }
}

/**
 * validatePromote(body) -> { error: string } | { candidate_id: number }
 *
 * Pure, same shape as validateUpdate/validateTouch, unit-tested without a
 * database. Deliberately accepts NOTHING but an id: no value, no kind, no
 * source_url. Everything written to public.prospects by the promote path is
 * read back out of the candidate row the resolver wrote, so a caller cannot
 * use this action to smuggle an arbitrary contact_email past the
 * WRITABLE_FIELDS whitelist that `update` enforces.
 */
function validatePromote(body) {
  const candidate_id = parseId(body.candidate_id)
  if (candidate_id === null || candidate_id <= 0) return { error: 'Missing or invalid candidate_id.' }
  return { candidate_id }
}

/**
 * promotionPatch(candidate) -> { error: string } | { patch: object }
 *
 * Maps one staged candidate onto the prospect columns it may set. Pure, so
 * the mapping itself is unit-testable -- this is the function that decides
 * what a click on "Use this" actually writes, which makes it the one place
 * the "never sets a verified flag" rule has to hold.
 *
 * An email carries its provenance across with it (contact_email_source =
 * the URL the literal string was seen at, contact_email_kind = individual or
 * role), because a bare address with no source is a guess wearing a database
 * column -- the same reasoning that made source_url NOT NULL on the staging
 * table.
 */
function promotionPatch(candidate) {
  if (!candidate || !VALID_CANDIDATE_KINDS.has(candidate.kind)) {
    return { error: 'Candidate has an unrecognised kind.' }
  }
  if (typeof candidate.value !== 'string' || !candidate.value.trim()) {
    return { error: 'Candidate has no value to promote.' }
  }

  if (candidate.kind === 'email') {
    return {
      patch: {
        contact_email: candidate.value,
        contact_email_source: candidate.source_url,
        contact_email_kind: candidate.email_kind === 'individual' || candidate.email_kind === 'role'
          ? candidate.email_kind
          : null,
      },
    }
  }

  // linkedin_verified / x_verified are deliberately absent from both
  // branches. Promoting a URL records which URL to use; it records nothing
  // about whether it belongs to the intended person, and LinkedIn returns
  // HTTP 999 to every automated client so that question cannot be settled
  // by machine at all. A human who has actually checked can still flip the
  // flag in SQL; a click in this UI must never do it.
  if (candidate.kind === 'linkedin') return { patch: { linkedin_url: candidate.value } }
  return { patch: { x_url: candidate.value } }
}
// stampFieldFor, buildAdvanceOnlyFilter and nextActionAtFor moved to
// _touches.js on 2026-08-20 so the inbound reply poller shares them rather
// than copying them. They are re-exported at the bottom of this file.


/**
 * attachRelated(supabase, prospect) -> Promise<{ error, code } | { prospect }>
 *
 * bg-app finding, 2026-08-15: `update` and `touch` used to return a prospect
 * with no `touches` key while `list` nested it, and only a comment said so.
 * This makes the shape uniform across every action -- two extra indexed
 * queries filtered to a single `prospect_id`, mutating `prospect.touches` and
 * `prospect.candidates` in place and returning the same object for
 * convenience. Extended to candidates in packet 019 rather than adding a
 * second half-attached shape, which is the exact bug this function was
 * written to close.
 */
async function attachRelated(supabase, prospect) {
  const { data: touches, error: touchesError } = await supabase
    .from('prospect_touches')
    .select(TOUCH_COLS)
    .eq('prospect_id', prospect.id)
    .order('occurred_at', { ascending: false })

  if (touchesError) return { error: touchesError, code: 'touches' }
  prospect.touches = touches ?? []

  const { data: candidates, error: candidatesError } = await supabase
    .from('prospect_contact_candidates')
    .select(CANDIDATE_COLS)
    .eq('prospect_id', prospect.id)

  if (candidatesError) return { error: candidatesError, code: 'candidates' }
  prospect.candidates = (candidates ?? []).sort(candidateSort)
  return { prospect }
}

/**
 * fail500(headers, code, error, extra) -> Netlify response object
 *
 * bg-verify S6 fix, 2026-08-15. Module scope (not a closure inside the
 * handler) specifically so it is unit-testable: prospects-admin.js used to
 * return `error.message` -- the raw PostgREST/Postgres driver text --
 * straight to the client on every 5xx. Logs the real error server side and
 * returns a fixed message plus a `code` naming the failed operation, never
 * the driver's own string. `extra` lets a caller (touch's partial-failure
 * path) attach a structured field like `touch_id`.
 */
function fail500(headers, code, error, extra = {}) {
  console.error(`[prospects-admin] ${code} failed:`, error.message)
  return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error. Check the function logs for detail.', code, ...extra }) }
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
    if (error) return fail500(headers, 'list', error)

    const prospects = data ?? []

    // Nest each prospect's touches (most recent first) as `touches: Touch[]`
    // -- one extra query, not N+1, then grouped in memory by prospect_id.
    if (prospects.length > 0) {
      const ids = prospects.map(p => p.id)
      const { data: touches, error: touchesError } = await supabase
        .from('prospect_touches')
        .select(TOUCH_COLS)
        .in('prospect_id', ids)
        .order('occurred_at', { ascending: false })

      if (touchesError) return fail500(headers, 'list:touches', touchesError)

      const byProspect = new Map()
      for (const t of touches ?? []) {
        if (!byProspect.has(t.prospect_id)) byProspect.set(t.prospect_id, [])
        byProspect.get(t.prospect_id).push(t)
      }
      for (const p of prospects) p.touches = byProspect.get(p.id) ?? []

      // Same shape for staged contact routes: one extra query, grouped in
      // memory by prospect_id, never N+1.
      const { data: candidates, error: candidatesError } = await supabase
        .from('prospect_contact_candidates')
        .select(CANDIDATE_COLS)
        .in('prospect_id', ids)

      if (candidatesError) return fail500(headers, 'list:candidates', candidatesError)

      const candidatesByProspect = new Map()
      for (const c of candidates ?? []) {
        if (!candidatesByProspect.has(c.prospect_id)) candidatesByProspect.set(c.prospect_id, [])
        candidatesByProspect.get(c.prospect_id).push(c)
      }
      for (const p of prospects) p.candidates = (candidatesByProspect.get(p.id) ?? []).sort(candidateSort)
    }

    return json(200, { prospects })
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
      return fail500(headers, 'update', error)
    }

    const { error: relatedError, code: relatedCode } = await attachRelated(supabase, data)
    if (relatedError) return fail500(headers, `update:${relatedCode}`, relatedError)

    console.log(`[prospects-admin] prospect ${data.id} updated (${Object.keys(patch).join(', ')}) by ${auth.user.id}`)
    return json(200, { prospect: data })
  }

  // ── touch ─────────────────────────────────────────────────────────────────
  // Logs one real outreach event. Never sets stage. Sets last_contacted_at
  // (direction 'out') or replied_at (direction 'in') on the prospect after
  // the touch row exists. The two writes are NOT one transaction -- see the
  // header comment's "NOT ATOMIC" section for the honest description and the
  // retry_of contract that keeps a retry from duplicating the touch.
  if (body.action === 'touch') {
    const { error: invalid, prospect_id, insert, retryOf } = validateTouch(body)
    if (invalid) return json(400, { error: invalid })

    // The write itself lives in _touches.js so the inbound reply poller uses
    // the identical path (docs/arch/reply-handling.md 4.5). Everything below
    // is only the mapping from a structured outcome onto HTTP.
    const outcome = await recordTouch(supabase, {
      prospect_id,
      insert,
      retryOf,
      selectCols: SELECT_COLS,
    })

    if (!outcome.ok) {
      if (outcome.kind === 'retry_not_found' || outcome.kind === 'prospect_not_found') {
        return json(404, { error: outcome.message })
      }
      if (outcome.kind === 'duplicate_external_id') {
        // Not reachable from this endpoint: validateTouch() never accepts an
        // external_id, so a UI caller cannot produce one. Mapped anyway rather
        // than falling through to a misleading 500 if that ever changes.
        return json(409, { error: outcome.message })
      }
      if (outcome.kind === 'stamp_failed' || outcome.kind === 'refetch_failed') {
        // The touch is already durable; report that honestly and hand back a
        // STRUCTURED touch_id (bg-verify S2) so the caller can retry with
        // `retry_of` instead of resending the whole touch and duplicating it.
        console.error(`[prospects-admin] touch: ${outcome.kind}:`, outcome.cause && outcome.cause.message)
        return json(500, { error: outcome.message, code: `touch:${outcome.kind}`, touch_id: outcome.touch_id })
      }
      return fail500(headers, `touch:${outcome.kind}`, outcome.cause || new Error(outcome.message))
    }

    const { touch, prospect } = outcome

    const { error: relatedError, code: relatedCode } = await attachRelated(supabase, prospect)
    if (relatedError) return fail500(headers, `touch:${relatedCode}`, relatedError, { touch_id: touch.id })

    console.log(`[prospects-admin] touch ${touch.id} logged (${touch.channel}/${touch.direction}) for prospect ${prospect_id} by ${auth.user.id}${retryOf ? ` (retry_of=${retryOf})` : ''} next_action_at=${prospect.next_action_at || 'none'}`)
    return json(200, outcome.warning ? { touch, prospect, warning: outcome.warning } : { touch, prospect })
  }

  // ── promote ───────────────────────────────────────────────────────────────
  // Puts ONE staged contact route candidate onto the prospect row. This is
  // the only write path to contact_email/linkedin_url/x_url anywhere in the
  // app: resolve-contact-routes.js refuses to touch public.prospects, and
  // `update` above hard-rejects all three columns. See the header comment.
  if (body.action === 'promote') {
    const { error: invalid, candidate_id } = validatePromote(body)
    if (invalid) return json(400, { error: invalid })

    const { data: candidate, error: readError } = await supabase
      .from('prospect_contact_candidates')
      .select(CANDIDATE_COLS)
      .eq('id', candidate_id)
      .maybeSingle()

    if (readError) return fail500(headers, 'promote:read', readError)
    if (!candidate) return json(404, { error: `Candidate ${candidate_id} not found.` })

    const { error: mapError, patch } = promotionPatch(candidate)
    if (mapError) return json(400, { error: mapError })

    const { data: prospect, error: writeError } = await supabase
      .from('prospects')
      .update(patch)
      .eq('id', candidate.prospect_id)
      .select(SELECT_COLS)
      .single()

    if (writeError) {
      if (writeError.code === 'PGRST116') {
        return json(404, { error: `Prospect ${candidate.prospect_id} not found.` })
      }
      return fail500(headers, 'promote:write', writeError)
    }

    // Flag the candidate second, and on purpose. The prospect row is the
    // meaningful write and it has already succeeded by this point; `promoted`
    // is a UI convenience that nothing depends on for correctness (the page
    // decides which candidate is live by comparing its value against the
    // prospect field, which cannot drift). So a failure here is reported as a
    // warning on a 200 rather than a 500 that would wrongly suggest the route
    // was not saved. These are two PostgREST calls, not one transaction, and
    // saying so is the same honesty bg-verify S2 required of `touch`.
    let warning
    const { data: flagged, error: flagError } = await supabase
      .from('prospect_contact_candidates')
      .update({ promoted: true })
      .eq('id', candidate_id)
      .select(CANDIDATE_COLS)
      .single()

    if (flagError) {
      console.error('[prospects-admin] promote: flagging the candidate failed:', flagError.message)
      warning = 'The contact route was saved to the prospect, but marking the candidate as promoted failed. Harmless; the route is live.'
    }

    const { error: relatedError, code: relatedCode } = await attachRelated(supabase, prospect)
    if (relatedError) return fail500(headers, `promote:${relatedCode}`, relatedError)

    console.log(`[prospects-admin] candidate ${candidate_id} (${candidate.kind}) promoted onto prospect ${candidate.prospect_id} by ${auth.user.id}`)
    return json(200, { prospect, candidate: flagged ?? { ...candidate, promoted: true }, ...(warning ? { warning } : {}) })
  }

  return json(400, { error: "Unknown action. One of: 'list', 'update', 'touch', 'promote'." })
}

module.exports.validateUpdate = validateUpdate
module.exports.WRITABLE_FIELDS = WRITABLE_FIELDS
module.exports.VALID_STAGES = VALID_STAGES
module.exports.validateTouch = validateTouch
module.exports.VALID_CHANNELS = VALID_CHANNELS
module.exports.VALID_DIRECTIONS = VALID_DIRECTIONS
module.exports.parseId = parseId
module.exports.TOUCH_MIN_OCCURRED_AT = TOUCH_MIN_OCCURRED_AT
module.exports.TOUCH_MAX_FUTURE_MS = TOUCH_MAX_FUTURE_MS
module.exports.fail500 = fail500
module.exports.stampFieldFor = stampFieldFor
module.exports.buildAdvanceOnlyFilter = buildAdvanceOnlyFilter
module.exports.validatePromote = validatePromote
module.exports.promotionPatch = promotionPatch
module.exports.candidateSort = candidateSort
module.exports.VALID_CANDIDATE_KINDS = VALID_CANDIDATE_KINDS
module.exports.nextActionAtFor = nextActionAtFor
module.exports.FOLLOW_UP_STEPS_DAYS = FOLLOW_UP_STEPS_DAYS
module.exports.TERMINAL_STAGES = TERMINAL_STAGES
