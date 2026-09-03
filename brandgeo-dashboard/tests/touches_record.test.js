/**
 * touches_record.test.js -- exercises recordTouch() in netlify/functions/
 * _touches.js, the ONE write path for prospect_touches and the prospect fields
 * derived from it. Run: `node tests/touches_record.test.js`.
 *
 * WHY THIS EXISTS. prospects_admin_whitelist.test.js deliberately calls only
 * pure functions and the two auth branches that return before any network
 * call, so until now NOTHING tested the actual sequence of database calls a
 * touch makes. That was tolerable while the sequence had one caller and lived
 * inline. It stopped being tolerable on 2026-08-20, when it was extracted so
 * the inbound reply poller could share it: a refactor of an unreviewed write
 * path with no test covering it is how a silent regression ships.
 *
 * The fake Supabase below records every call the chain makes and returns
 * scripted results. It is not a database and proves nothing about Postgres
 * semantics (the forward-only stamp was proven separately, against a real
 * transaction that was rolled back, see CLAUDE.md 2026-08-15). What it DOES
 * prove is the control flow: which tables are written, in what order, with
 * what payload, and critically WHICH WRITES ARE SKIPPED.
 */
const assert = require('assert')
const path = require('path')

const { recordTouch } = require(path.join(__dirname, '..', 'netlify', 'functions', '_touches.js'))

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

const SELECT_COLS = 'id, stage, next_action_at'

/**
 * handler(state, mode) -> { data, error, count }
 * state carries { table, op, eq, or, patch, row, selectCols, selectOpts }.
 */
function fakeSupabase(handler) {
  const calls = []
  return {
    calls,
    from(table) {
      const st = { table, eq: [] }
      calls.push(st)
      const chain = {
        select(cols, opts) { st.op = st.op || 'select'; st.selectCols = cols; st.selectOpts = opts; return chain },
        insert(row) { st.op = 'insert'; st.row = row; return chain },
        update(patch) { st.op = 'update'; st.patch = patch; return chain },
        eq(k, v) { st.eq.push([k, v]); return chain },
        or(f) { st.or = f; return chain },
        maybeSingle() { return Promise.resolve(handler(st, 'maybeSingle')) },
        single() { return Promise.resolve(handler(st, 'single')) },
        then(a, b) { return Promise.resolve(handler(st, 'many')).then(a, b) },
      }
      return chain
    },
  }
}

// A scripted backend covering the common shape: the insert succeeds, the stamp
// applies, the count returns `outboundCount`, the reschedule succeeds.
function backend({
  stampRows = null,
  outboundCount = 1,
  stage = 'contacted',
  touch = {},
  countError = null,
  stampError = null,
  repliedAt = null,
  retryRow = undefined,
  retryError = null,
  refetchError = null,
} = {}) {
  const written = { insert: null, stamp: null, schedule: null, refetched: false, retryLookup: null }
  const touchRow = { id: 99, prospect_id: 7, channel: 'email', direction: 'out', occurred_at: '2026-08-20T12:00:00.000Z', ...touch }
  const prospectRow = { id: 7, stage, next_action_at: null, replied_at: repliedAt }

  const supabase = fakeSupabase((st, mode) => {
    if (st.table === 'prospect_touches' && mode === 'maybeSingle') {
      // The retry_of lookup (review finding F9: this branch had no coverage).
      written.retryLookup = st.eq
      if (retryError) return { data: null, error: retryError }
      return { data: retryRow === undefined ? touchRow : retryRow, error: null }
    }
    if (st.table === 'prospect_touches' && st.op === 'insert') {
      written.insert = st.row
      return { data: touchRow, error: null }
    }
    if (st.table === 'prospect_touches' && st.selectOpts && st.selectOpts.head) {
      if (countError) return { count: null, error: countError }
      return { count: outboundCount, error: null }
    }
    if (st.table === 'prospects' && st.op === 'update' && 'next_action_at' in st.patch) {
      written.schedule = st.patch
      return { data: [{ ...prospectRow, ...st.patch }], error: null }
    }
    if (st.table === 'prospects' && st.op === 'update') {
      written.stamp = st.patch
      if (stampError) return { data: null, error: stampError }
      return { data: stampRows === null ? [prospectRow] : stampRows, error: null }
    }
    if (st.table === 'prospects' && st.op === 'select' && mode === 'single') {
      written.refetched = true
      if (refetchError) return { data: null, error: refetchError }
      return { data: prospectRow, error: null }
    }
    throw new Error(`unscripted call: ${st.table}/${st.op}/${mode}`)
  })

  return { supabase, written, touchRow }
}

const baseInsert = { prospect_id: 7, channel: 'email', direction: 'out', occurred_at: '2026-08-20T12:00:00.000Z' }

async function run() {
  section('recordTouch: the happy path writes the touch, the stamp, then the schedule')
  {
    const { supabase, written } = backend({ outboundCount: 1 })
    const res = await recordTouch(supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })

    assert.strictEqual(res.ok, true)
    ok('a first outbound touch succeeds')
    assert.deepStrictEqual(written.insert, baseInsert)
    ok('the touch row written is exactly the insert the caller supplied, unmodified')
    assert.deepStrictEqual(written.stamp, { last_contacted_at: '2026-08-20T12:00:00.000Z' })
    ok('an outbound touch stamps last_contacted_at, never replied_at')
    assert.deepStrictEqual(written.schedule, { next_action_at: '2026-08-24T12:00:00.000Z' })
    ok('the 1st outbound touch schedules next_action_at exactly 4 days out')
  }

  section('recordTouch: THE BACKFILL GUARD, the part that is easy to get wrong')
  {
    // stampRows: [] is what the forward-only filter returns when the touch is
    // older than what is already stamped, i.e. this is a backfill.
    const { supabase, written } = backend({ stampRows: [] })
    const res = await recordTouch(supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })

    assert.strictEqual(res.ok, true)
    ok('a backfilled touch still succeeds and is still recorded in the history')
    assert.strictEqual(written.refetched, true)
    ok('the prospect is re-read rather than trusting the empty stamp result')
    assert.strictEqual(written.schedule, null)
    ok('NO next_action_at write happens at all: a backfill cannot reschedule the future')
    const scheduleCalls = supabase.calls.filter(c => c.op === 'update' && c.patch && 'next_action_at' in c.patch)
    assert.strictEqual(scheduleCalls.length, 0)
    ok('confirmed at the call level, not just the recorded payload')
  }

  section('recordTouch: a reply stops the queue asking')
  {
    const { supabase, written } = backend({ touch: { direction: 'in' } })
    const res = await recordTouch(supabase, {
      prospect_id: 7,
      insert: { ...baseInsert, direction: 'in' },
      selectCols: SELECT_COLS,
    })

    assert.strictEqual(res.ok, true)
    assert.deepStrictEqual(written.stamp, { replied_at: '2026-08-20T12:00:00.000Z' })
    ok('an inbound touch stamps replied_at, never last_contacted_at')
    assert.deepStrictEqual(written.schedule, { next_action_at: null })
    ok('an inbound touch CLEARS next_action_at')
    const counted = supabase.calls.some(c => c.selectOpts && c.selectOpts.head)
    assert.strictEqual(counted, false)
    ok('it does not even count outbound touches for an inbound one: no wasted query')
  }

  section('recordTouch: the sequence stops at three')
  {
    const { supabase, written } = backend({ outboundCount: 3 })
    await recordTouch(supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })
    assert.deepStrictEqual(written.schedule, { next_action_at: null })
    ok('a 3rd outbound touch clears next_action_at instead of extending the sequence')
  }

  section('recordTouch: a terminal prospect is skipped, not cleared')
  {
    const { supabase, written } = backend({ stage: 'won', outboundCount: 1 })
    const res = await recordTouch(supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })
    assert.strictEqual(res.ok, true)
    assert.strictEqual(written.schedule, null)
    ok("a won/lost/disqualified prospect gets NO next_action_at write, so a human's date survives")
  }

  section('recordTouch: a failed count skips the schedule rather than wiping it')
  {
    const { supabase, written } = backend({ countError: { message: 'count blew up' } })
    const res = await recordTouch(supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })

    assert.strictEqual(res.ok, true)
    ok('the touch still succeeds: the meaningful writes already landed')
    assert.strictEqual(written.schedule, null)
    ok('NO next_action_at write: a count failure must never fall through to a null and clear a live schedule')
    assert.strictEqual(typeof res.warning, 'string')
    ok('the caller is told, via a warning on a SUCCESS outcome rather than a 500')
  }

  section('recordTouch: failures are typed so the caller can map them honestly')
  {
    const fk = fakeSupabase(() => ({ data: null, error: { code: '23503' } }))
    const r1 = await recordTouch(fk, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })
    assert.strictEqual(r1.ok, false)
    assert.strictEqual(r1.kind, 'prospect_not_found')
    ok('an FK violation (23503) is prospect_not_found, which the endpoint maps to 404')

    const dupe = fakeSupabase(() => ({ data: null, error: { code: '23505' } }))
    const r2 = await recordTouch(dupe, {
      prospect_id: 7,
      insert: { ...baseInsert, external_id: 'gmail:abc' },
      selectCols: SELECT_COLS,
    })
    assert.strictEqual(r2.kind, 'duplicate_external_id')
    ok('a unique violation (23505) is duplicate_external_id: the poller re-run case, not a crash')

    const { supabase: stampFails } = backend({ stampError: { message: 'stamp blew up' } })
    const r3 = await recordTouch(stampFails, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })
    assert.strictEqual(r3.ok, false)
    assert.strictEqual(r3.kind, 'stamp_failed')
    assert.strictEqual(r3.touch_id, 99)
    ok('a stamp failure carries a STRUCTURED touch_id so a retry cannot duplicate the touch')
  }

  section('recordTouch: it never writes a stage, on any path')
  {
    for (const opts of [{ outboundCount: 1 }, { outboundCount: 3 }, { touch: { direction: 'in' } }, { stampRows: [] }]) {
      const { supabase } = backend(opts)
      await recordTouch(supabase, {
        prospect_id: 7,
        insert: { ...baseInsert, direction: opts.touch ? opts.touch.direction : 'out' },
        selectCols: SELECT_COLS,
      })
      for (const call of supabase.calls) {
        if (call.op === 'update' && call.patch) {
          assert.strictEqual('stage' in call.patch, false, `stage written on ${JSON.stringify(opts)}`)
        }
      }
    }
    ok('no code path in recordTouch ever puts `stage` in an UPDATE payload')
  }

  section('F2: an outbound touch older than a logged reply must not re-arm the queue')
  {
    // The reviewer reproduced this against production inside a rolled-back
    // transaction: prospect 4 had replied_at = 2026-08-19, an outbound
    // BACKFILL dated 2026-08-18 was logged, and next_action_at came back as
    // 2026-08-25. The stamp's forward-only filter did not catch it because it
    // is per column: 08-18 IS newer than last_contacted_at, it is only older
    // than replied_at, which the schedule never consulted.
    const { supabase, written } = backend({ repliedAt: '2026-08-19T08:00:00.000Z', touch: { occurred_at: '2026-08-18T09:00:00.000Z' } })
    const res = await recordTouch(supabase, {
      prospect_id: 7,
      insert: { ...baseInsert, occurred_at: '2026-08-18T09:00:00.000Z' },
      selectCols: SELECT_COLS,
    })
    assert.strictEqual(res.ok, true)
    assert.ok(written.insert, 'the backfilled touch must still be recorded in the history')
    assert.strictEqual(written.schedule, null, 'no next_action_at write may happen after a reply')
    ok('an outbound backfill BEFORE a logged reply is history: touch written, schedule untouched')

    // Same instant counts as history too: a touch stamped exactly at the reply
    // cannot be a follow-up to it.
    const same = backend({ repliedAt: '2026-08-19T08:00:00.000Z', touch: { occurred_at: '2026-08-19T08:00:00.000Z' } })
    await recordTouch(same.supabase, {
      prospect_id: 7,
      insert: { ...baseInsert, occurred_at: '2026-08-19T08:00:00.000Z' },
      selectCols: SELECT_COLS,
    })
    assert.strictEqual(same.written.schedule, null)
    ok('an outbound touch at exactly replied_at is history as well, not a schedule input')

    // And the ordinary case must be unaffected: a genuinely NEW outbound touch
    // after a reply (they answered, we wrote back) still schedules.
    const after = backend({ repliedAt: '2026-08-19T08:00:00.000Z', touch: { occurred_at: '2026-08-21T09:00:00.000Z' } })
    await recordTouch(after.supabase, {
      prospect_id: 7,
      insert: { ...baseInsert, occurred_at: '2026-08-21T09:00:00.000Z' },
      selectCols: SELECT_COLS,
      })
    assert.deepStrictEqual(after.written.schedule, { next_action_at: '2026-08-25T09:00:00.000Z' })
    ok('an outbound touch AFTER the reply still schedules the next step, so the fix is not a blanket stop')

    // With no reply on file, nothing changes at all.
    const none = backend({ repliedAt: null })
    await recordTouch(none.supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })
    assert.deepStrictEqual(none.written.schedule, { next_action_at: '2026-08-24T12:00:00.000Z' })
    ok('a prospect who has never replied schedules exactly as before')
  }

  section('F9: the retry_of branch and the refetch failure, which had zero coverage')
  {
    const { supabase, written } = backend({ retryRow: { id: 99, prospect_id: 7, channel: 'email', direction: 'out', occurred_at: '2026-08-20T12:00:00.000Z' } })
    const res = await recordTouch(supabase, {
      prospect_id: 7,
      insert: baseInsert,
      retryOf: 99,
      selectCols: SELECT_COLS,
    })
    assert.strictEqual(res.ok, true)
    assert.strictEqual(written.insert, null, 'a retry must NEVER insert a second touch row')
    assert.strictEqual(res.touch.id, 99)
    assert.deepStrictEqual(written.stamp, { last_contacted_at: '2026-08-20T12:00:00.000Z' })
    ok('retry_of re-uses the existing touch row and re-runs only the stamp')

    // The lookup is scoped by BOTH id and prospect_id, which is what stops a
    // retry_of from crossing prospects.
    assert.deepStrictEqual(written.retryLookup, [['id', 99], ['prospect_id', 7]])
    ok('the retry lookup is filtered by id AND prospect_id, so it cannot cross prospects')

    const missing = backend({ retryRow: null })
    const r2 = await recordTouch(missing.supabase, { prospect_id: 7, insert: baseInsert, retryOf: 1234, selectCols: SELECT_COLS })
    assert.strictEqual(r2.ok, false)
    assert.strictEqual(r2.kind, 'retry_not_found')
    assert.strictEqual(missing.written.insert, null, 'a failed retry must not fall through to an insert')
    ok('retry_of naming a touch that is not this prospect fails closed as retry_not_found')

    const lookupBroken = backend({ retryError: { message: 'lookup blew up' } })
    const r3 = await recordTouch(lookupBroken.supabase, { prospect_id: 7, insert: baseInsert, retryOf: 99, selectCols: SELECT_COLS })
    assert.strictEqual(r3.kind, 'retry_lookup_failed')
    ok('a broken retry lookup is retry_lookup_failed, not a silent insert')

    // 0-row stamp (a backfill) plus a failing re-read: the touch is durable,
    // so the outcome must hand back touch_id rather than asking for a resend.
    const refetch = backend({ stampRows: [], refetchError: { message: 'refetch blew up' } })
    const r4 = await recordTouch(refetch.supabase, { prospect_id: 7, insert: baseInsert, selectCols: SELECT_COLS })
    assert.strictEqual(r4.ok, false)
    assert.strictEqual(r4.kind, 'refetch_failed')
    assert.strictEqual(r4.touch_id, 99)
    ok('a refetch failure after a 0-row stamp is refetch_failed and carries touch_id')
  }

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
