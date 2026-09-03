// ============================================================================
// _touches.js -- the ONE write path for public.prospect_touches and the
// prospect fields derived from it (last_contacted_at, replied_at,
// next_action_at).
//
// WHY THIS FILE EXISTS. Until 2026-08-20 this logic lived inline in
// prospects-admin.js's `touch` action and had exactly one caller. The inbound
// reply poller (docs/arch/reply-handling.md part B) is a second caller, and
// copying a write path that stamps a customer-facing record is the precise
// defect this project already paid for once with _plans.js: four hardcoded
// copies of the plan ladder, three of which drifted, one of which silently
// downgraded a paying customer. One copy, two callers.
//
// WHAT IT DELIBERATELY DOES NOT DO:
//   - It never sets a stage. Logging a touch records that contact happened and
//     says nothing about pipeline progress. Advancing a prospect to 'replied'
//     is a human judgement and stays one.
//   - It never validates an HTTP body. Callers validate their own input
//     (prospects-admin.js has validateTouch(); the poller builds its insert
//     from Gmail headers) and hand this function an already-clean insert.
//   - It never returns an HTTP response. It returns a structured outcome and
//     the caller maps it. That is what lets a cron function and an admin
//     endpoint share it without the cron function pretending to be HTTP.
//
// NOT ATOMIC, and stated honestly here as well as in prospects-admin.js's
// header: the insert into prospect_touches and the UPDATE on prospects are two
// separate PostgREST calls, not one transaction. When the stamp fails after
// the insert succeeded, the outcome carries `touch_id` so the caller can retry
// with retryOf instead of inserting a duplicate.
// ============================================================================

const TOUCH_COLS = 'id, prospect_id, channel, direction, occurred_at, subject, body, note, external_id, created_at'

// ── Follow-up schedule (docs/arch/reply-handling.md, Constantin 2026-08-20) ──
// Days to wait after each OUTBOUND touch before the prospect is due again.
// Index 0 is the wait after the 1st outbound touch, index 1 after the 2nd.
// Running off the end of this array is the STOP rule: a 3rd outbound touch
// clears next_action_at and the prospect leaves the actionable queue.
//
// Measured cause for this existing at all: on 2026-08-20, 13 of 13 prospects
// at stage='contacted' had a null next_action_at, because nothing had ever
// written that column. The queue machinery in src/pages/Prospects.tsx
// (isActionableNow, isOverdue, queueSort) was complete and starved.
const FOLLOW_UP_STEPS_DAYS = [4, 7]
const DAY_MS = 24 * 60 * 60 * 1000

// ── occurred_at bounds (bg-verify S1, moved here 2026-09-03, review F3) ──────
// These lived in prospects-admin.js and were therefore enforced on the admin
// path only. The poller builds its insert straight from a Gmail Date header,
// which the SENDER controls, and applied only the upper clamp: a reply dated
// "Thu, 01 Jan 1970" wrote occurred_at = 1970 and, because the poller's own
// query selects rows with replied_at IS NULL, the forward-only stamp's `is
// null` branch matched and stamped replied_at = 1970 on a real prospect.
// One copy, two callers, exactly the argument that created this file.
// The floor is 2026-01-01: this CRM's data starts at the 2026-08-15 backfill
// and nothing legitimate predates this year. The ceiling absorbs real clock
// skew without admitting a far-future value that would make a prospect look
// permanently just-contacted.
const TOUCH_MIN_OCCURRED_AT = Date.parse('2026-01-01T00:00:00.000Z')
const TOUCH_MAX_FUTURE_MS = 24 * 60 * 60 * 1000

/**
 * clampOccurredAt(value, nowMs) -> ISO string
 *
 * The bounded reading of an UNTRUSTED date (a mail header, not an admin form).
 * Anything unparseable, anything below the floor, and anything above now is
 * reported as now(): a reply we cannot date is a reply that just arrived, not
 * one from 1970. The admin path does NOT use this, it REJECTS out-of-range
 * input with a 400 instead, because a human typing a date deserves an error
 * rather than a silent correction.
 */
function clampOccurredAt(value, nowMs = Date.now()) {
  const ms = typeof value === 'string' ? Date.parse(value) : NaN
  if (!Number.isFinite(ms) || ms < TOUCH_MIN_OCCURRED_AT) return new Date(nowMs).toISOString()
  return new Date(Math.min(ms, nowMs)).toISOString()
}

// A prospect at one of these is finished; nothing schedules work on it. Mirrors
// TERMINAL_STAGES in src/pages/Prospects.tsx, which drives the same exclusion
// client side.
const TERMINAL_STAGES = new Set(['won', 'lost', 'disqualified'])

/**
 * stampFieldFor(direction) -> 'last_contacted_at' | 'replied_at'
 *
 * Single source for the direction -> column mapping, used to build both the
 * UPDATE's SET payload and its WHERE filter, so the two can never name
 * different columns for the same touch.
 */
function stampFieldFor(direction) {
  return direction === 'out' ? 'last_contacted_at' : 'replied_at'
}

/**
 * buildAdvanceOnlyFilter(field, newIso) -> string
 *
 * bg-verify S8 fix, 2026-08-15. The PostgREST OR-filter that makes the
 * prospect stamp UPDATE forward-only: matches a row only when `field` is
 * null or strictly earlier than `newIso`. Extracted as a pure function so
 * the filter STRING is unit-testable without a database; the semantics it
 * encodes were separately proven against a real transaction that was rolled
 * back (see the S8 entry in CLAUDE.md's 2026-08-15 section), since a filter
 * string being well-formed is not the same as the database enforcing it.
 */
function buildAdvanceOnlyFilter(field, newIso) {
  return `${field}.is.null,${field}.lt.${newIso}`
}

/**
 * nextActionAtFor({ direction, occurredAtIso, outboundCount, stage, repliedAtIso })
 *   -> { skip: true } | { value: string | null }
 *
 * The follow-up schedule rule. Pure, so it is unit-testable without a
 * database (tests/prospects_admin_whitelist.test.js).
 *
 * `{ skip: true }` means write nothing at all and leave whatever is there.
 * `{ value: null }` means deliberately CLEAR the schedule. The two are not
 * the same and collapsing them would be a real defect: skipping a terminal
 * prospect must not wipe a date a human deliberately set on it.
 *
 * Rules:
 *   inbound touch          -> null. They answered. The queue must stop asking.
 *   terminal stage         -> skip. Nothing schedules work on a closed row.
 *   outbound at or before
 *     an existing replied_at -> skip. History, not a schedule input. See below.
 *   outbound touch 1       -> occurred_at + 4 days
 *   outbound touch 2       -> occurred_at + 7 days
 *   outbound touch 3 or up -> null. Sequence exhausted, stop.
 *
 * THE REPLY GUARD (review finding F2, 2026-09-03). The forward-only stamp is
 * per COLUMN: an outbound touch is compared against last_contacted_at and
 * never against replied_at. So an outbound touch older than a logged reply but
 * newer than last_contacted_at counted as "applied" and armed a follow-up on
 * somebody who had already answered. That needs no attacker, it is the
 * ordinary backfill this endpoint advertises: log today's email, then remember
 * the LinkedIn message from two days ago. Reproduced by the reviewer against
 * production inside a rolled-back transaction: replied_at 2026-08-19 with
 * next_action_at pushed back out to 2026-08-25.
 *
 * `repliedAtIso` is the prospect's CURRENT replied_at, which both callers
 * already select (SELECT_COLS in prospects-admin.js and in
 * poll-inbound-replies.js both carry replied_at). An outbound touch that
 * predates it is history. It is still written to prospect_touches in full;
 * only the derived schedule is left alone, which is the same rule the S8
 * stamp guard applies one column over.
 *
 * `outboundCount` counts rows already in prospect_touches INCLUDING the one
 * just written, so the first ever outbound touch arrives here as 1.
 *
 * Deliberately does NOT set a stage. A prospect that exhausts its three
 * touches sits at stage='contacted' with a null next_action_at and simply
 * stops being actionable; calling it lost is a human judgement. Auto-advancing
 * it would be a stage write driven by a touch, which this project has refused
 * to do since prospect_touches shipped.
 *
 * next_action_at also stays in prospects-admin.js's WRITABLE_FIELDS, so this
 * is a DEFAULT and not a lock: the date picker on the Prospects page still
 * overrides it afterwards.
 */
function nextActionAtFor({ direction, occurredAtIso, outboundCount, stage, repliedAtIso = null }) {
  if (TERMINAL_STAGES.has(stage)) return { skip: true }
  if (direction === 'in') return { value: null }

  if (repliedAtIso) {
    const replied = Date.parse(repliedAtIso)
    const occurred = Date.parse(occurredAtIso)
    // Unparseable on either side means we cannot prove this touch is newer
    // than the reply, so skip rather than schedule. Fail closed: not chasing
    // somebody who might have answered is cheaper than chasing somebody who
    // did.
    if (!Number.isFinite(replied) || !Number.isFinite(occurred) || occurred <= replied) {
      return { skip: true }
    }
  }

  const waitDays = FOLLOW_UP_STEPS_DAYS[outboundCount - 1]
  if (waitDays === undefined) return { value: null }

  const base = Date.parse(occurredAtIso)
  if (!Number.isFinite(base)) return { skip: true }
  return { value: new Date(base + waitDays * DAY_MS).toISOString() }
}

/**
 * recordTouch(supabase, opts) -> Promise<outcome>
 *
 * opts:
 *   prospect_id  number, already parsed and validated by the caller
 *   insert       the prospect_touches row to write (caller-built, clean)
 *   retryOf      optional touch id to re-use instead of inserting
 *   selectCols   the prospect projection the caller wants back
 *
 * outcome, success:
 *   { ok: true, touch, prospect, warning?: string }
 *
 * outcome, failure:
 *   { ok: false, kind, message, touch_id?, cause? }
 *   kind is one of:
 *     'retry_lookup_failed'  could not read the retryOf row
 *     'retry_not_found'      retryOf does not exist for this prospect
 *     'prospect_not_found'   FK violation, the prospect does not exist
 *     'insert_failed'        the touch row could not be written
 *     'stamp_failed'         touch is durable, prospect stamp failed
 *     'refetch_failed'       touch is durable, prospect could not be re-read
 *
 * A `warning` on a SUCCESS outcome means the touch and the stamp both landed
 * but the follow-up date could not be scheduled. That is deliberately not a
 * failure: the meaningful writes already succeeded and telling the caller to
 * retry them would be wrong.
 */
async function recordTouch(supabase, { prospect_id, insert, retryOf = null, selectCols }) {
  let touch

  if (retryOf) {
    // Idempotent retry path (bg-verify S2). The insert already succeeded on a
    // prior attempt and only the prospect stamp failed; re-use that touch row
    // by id instead of inserting a duplicate. The FK plus this explicit
    // prospect_id match means a retry_of for the wrong prospect (or a
    // nonexistent one) fails closed, not as a cross-attribution.
    const { data: existing, error: fetchError } = await supabase
      .from('prospect_touches')
      .select(TOUCH_COLS)
      .eq('id', retryOf)
      .eq('prospect_id', prospect_id)
      .maybeSingle()

    if (fetchError) {
      return { ok: false, kind: 'retry_lookup_failed', message: 'Could not read the touch named by retry_of.', cause: fetchError }
    }
    if (!existing) {
      return {
        ok: false,
        kind: 'retry_not_found',
        message: `retry_of touch ${retryOf} not found for prospect ${prospect_id}. Retry with the full touch payload instead of retry_of.`,
      }
    }
    touch = existing
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('prospect_touches')
      .insert(insert)
      .select(TOUCH_COLS)
      .single()

    if (insertError) {
      // FK violation on a non-existent prospect_id surfaces as 23503.
      if (insertError.code === '23503') {
        return { ok: false, kind: 'prospect_not_found', message: `Prospect ${prospect_id} not found.` }
      }
      // 23505 is the partial unique index on external_id: this exact provider
      // message has already been logged. For the poller that is the normal
      // steady state, not an error, so it is surfaced as its own kind.
      if (insertError.code === '23505') {
        return { ok: false, kind: 'duplicate_external_id', message: `A touch for ${insert.external_id} already exists.` }
      }
      return { ok: false, kind: 'insert_failed', message: 'The touch could not be written.', cause: insertError }
    }
    touch = inserted
  }

  // Stamp from the PERSISTED touch row, not the caller's request (bg-verify
  // S9). Reading the stamp values from the row that was actually written or
  // reused means a retry whose direction happens to disagree with the original
  // is harmlessly ignored, since the persisted row is the truthful one.
  const stampAtIso = touch.occurred_at
  const stampField = stampFieldFor(touch.direction)

  // bg-verify S8 fix. An older touch is an explicitly supported backfill and
  // must be recorded faithfully, but it must NEVER move the derived queue
  // field backwards. This is a single conditional UPDATE, not a
  // read-then-compare-then-write: the WHERE clause and the SET happen inside
  // the same statement, so Postgres's row lock makes the compare-and-swap
  // atomic even under two concurrent touches on the same prospect.
  const { data: stampedRows, error: stampError } = await supabase
    .from('prospects')
    .update({ [stampField]: stampAtIso })
    .eq('id', prospect_id)
    .or(buildAdvanceOnlyFilter(stampField, stampAtIso))
    .select(selectCols)

  if (stampError) {
    return {
      ok: false,
      kind: 'stamp_failed',
      message: 'Touch was logged, but updating the prospect record failed. Retry with retry_of set to touch_id.',
      touch_id: touch.id,
      cause: stampError,
    }
  }

  // A 0-row result means the conditional UPDATE's WHERE clause correctly did
  // not match: the existing stamp was already >= this touch's occurred_at, so
  // the field is intentionally unchanged, NOT an error.
  let prospect
  const stampApplied = !!(stampedRows && stampedRows.length > 0)
  if (stampApplied) {
    prospect = stampedRows[0]
  } else {
    const { data: current, error: refetchError } = await supabase
      .from('prospects')
      .select(selectCols)
      .eq('id', prospect_id)
      .single()

    if (refetchError) {
      return {
        ok: false,
        kind: 'refetch_failed',
        message: 'Touch was logged, but the prospect record could not be re-read. Retry with retry_of set to touch_id.',
        touch_id: touch.id,
        cause: refetchError,
      }
    }
    prospect = current
  }

  // ── Schedule the next step (docs/arch/reply-handling.md part A) ───────────
  //
  // THE BACKFILL GUARD, which is the part that is easy to get wrong. Logging
  // an older touch after a newer one is explicitly supported, and it must NOT
  // reschedule the future: "log today's email, then remember last week's
  // LinkedIn message" would otherwise drag next_action_at backwards, which is
  // the same class of defect as S8, one field over.
  //
  // The stamp UPDATE above already computed the answer. It carries
  // buildAdvanceOnlyFilter(), so it matches ZERO rows exactly when this touch
  // is older than what is already stamped. So a 0-row stamp means "this is a
  // backfill": record it in the history, leave the schedule alone. No new
  // comparison, no second read, no new race, and it reuses a guarantee already
  // proven against a real rolled-back transaction.
  let warning
  if (stampApplied) {
    let outboundCount = 0
    let countFailed = false

    if (touch.direction === 'out') {
      const { count, error: countError } = await supabase
        .from('prospect_touches')
        .select('id', { count: 'exact', head: true })
        .eq('prospect_id', prospect_id)
        .eq('direction', 'out')

      if (countError) {
        // Do NOT fall through with a count of 0. That would index past the
        // start of FOLLOW_UP_STEPS_DAYS, resolve to null, and silently CLEAR a
        // live schedule because a count query failed. Skip instead.
        countFailed = true
        console.error('[touches] counting outbound touches failed:', countError.message)
        warning = 'Touch logged, but the follow-up date could not be scheduled. Set next_action_at by hand.'
      } else {
        outboundCount = count || 0
      }
    }

    if (!countFailed) {
      const decision = nextActionAtFor({
        direction: touch.direction,
        occurredAtIso: stampAtIso,
        outboundCount,
        stage: prospect.stage,
        // Review finding F2. `prospect` here is the row AFTER this touch's
        // stamp, and an outbound touch never writes replied_at, so this is
        // the reply that was already on file. Both callers select it.
        repliedAtIso: prospect.replied_at || null,
      })

      if (!decision.skip) {
        const { data: rescheduled, error: scheduleError } = await supabase
          .from('prospects')
          .update({ next_action_at: decision.value })
          .eq('id', prospect_id)
          .select(selectCols)

        if (scheduleError) {
          // The touch is durable and the stamp applied, so the meaningful
          // writes already succeeded. Failing here would tell the caller to
          // retry work that is done.
          console.error('[touches] scheduling next_action_at failed:', scheduleError.message)
          warning = 'Touch logged, but the follow-up date could not be scheduled. Set next_action_at by hand.'
        } else if (rescheduled && rescheduled.length > 0) {
          prospect = rescheduled[0]
        }
      }
    }
  }

  return warning ? { ok: true, touch, prospect, warning } : { ok: true, touch, prospect }
}

module.exports = {
  recordTouch,
  nextActionAtFor,
  clampOccurredAt,
  TOUCH_MIN_OCCURRED_AT,
  TOUCH_MAX_FUTURE_MS,
  stampFieldFor,
  buildAdvanceOnlyFilter,
  TOUCH_COLS,
  FOLLOW_UP_STEPS_DAYS,
  TERMINAL_STAGES,
  DAY_MS,
}
