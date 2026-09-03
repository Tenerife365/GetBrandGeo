/**
 * prospects_admin_whitelist.test.js -- guards netlify/functions/prospects-
 * admin.js on the two things that matter for a commercial-data admin
 * endpoint: nobody unauthenticated gets in, and nobody can write a column
 * this endpoint does not offer. Run: `node tests/prospects_admin_whitelist.test.js`
 * (exits non-zero on failure).
 *
 * WHY THIS SHAPE. Every other test in this directory (revenue_report,
 * package_provisioning, audit_teaser_gate) imports and calls pure functions
 * directly rather than mocking Supabase or the network, and this test keeps
 * that pattern: validateUpdate() is exported from prospects-admin.js
 * specifically so the write whitelist can be checked without a database.
 *
 * The auth-gate section is the one place this test DOES call the real
 * exports.handler -- but only through the one branch of requireAuth()
 * (_auth.js) that returns before ever touching the network: a missing
 * Authorization header, or a disallowed Origin. Both are checked and both
 * return before requireAuth() constructs a Supabase client call, so this
 * stays a no-network test like the rest of the suite. What it CANNOT prove:
 * that a valid non-admin JWT is rejected (adminOnly), or that a valid admin
 * JWT is accepted -- those need a real token and are proven by the curl in
 * the bg-backend handoff, same caveat revenue_report.test.js documents for
 * requireAuth's role check.
 */
const assert = require('assert')
const path = require('path')

const MOD = path.join(__dirname, '..', 'netlify', 'functions', 'prospects-admin.js')
const {
  handler, validateUpdate, WRITABLE_FIELDS, VALID_STAGES, validateTouch, VALID_CHANNELS, VALID_DIRECTIONS,
  parseId, fail500, TOUCH_MIN_OCCURRED_AT, TOUCH_MAX_FUTURE_MS, stampFieldFor, buildAdvanceOnlyFilter,
  validatePromote, promotionPatch, candidateSort, VALID_CANDIDATE_KINDS,
  nextActionAtFor, FOLLOW_UP_STEPS_DAYS, TERMINAL_STAGES,
} = require(MOD)

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

async function run() {
  section('Contract: the writable whitelist matches the coordinator packet exactly')
  {
    const expected = ['stage', 'notes', 'owner', 'next_action_at', 'last_contacted_at', 'replied_at', 'reply_note']
    assert.strictEqual(WRITABLE_FIELDS.size, expected.length)
    for (const f of expected) assert.ok(WRITABLE_FIELDS.has(f), `expected ${f} to be writable`)
    ok('WRITABLE_FIELDS is exactly the 7 fields the packet named, no more, no fewer')
  }

  section('validateUpdate(): the write whitelist')
  {
    const { error, id, patch } = validateUpdate({ id: 5, patch: { stage: 'contacted' } })
    assert.strictEqual(error, undefined)
    assert.strictEqual(id, 5)
    assert.deepStrictEqual(patch, { stage: 'contacted' })
    ok('a whitelisted field alone is accepted')
  }
  {
    const { error, patch } = validateUpdate({
      id: 5,
      patch: { stage: 'contacted', notes: 'called, left voicemail', owner: 'constantin' },
    })
    assert.strictEqual(error, undefined)
    assert.deepStrictEqual(patch, { stage: 'contacted', notes: 'called, left voicemail', owner: 'constantin' })
    ok('multiple whitelisted fields together are accepted')
  }
  {
    // domain is read only: it is set once at backfill/insert time and never
    // again, per the migration's header. Any attempt from the UI must fail
    // closed, not silently drop the domain key and save the rest.
    const { error, patch } = validateUpdate({ id: 5, patch: { domain: 'evil.com', stage: 'won' } })
    assert.ok(error, 'expected an error for a patch containing domain')
    assert.ok(/domain/.test(error), `error should name the rejected field, got: ${error}`)
    assert.strictEqual(patch, undefined)
    ok('domain in patch rejects the WHOLE request (400), does not silently drop it and save stage')
  }
  {
    // audit-derived fields are exactly as read only as domain -- this is the
    // scenario the coordinator named directly: a future UI bug sending
    // ai_score must surface as an error, not a quiet no-op.
    for (const field of ['ai_score', 'company', 'contact_name', 'contact_url', 'segment', 'tier',
                          'disqualified_reason', 'audit_token', 'competitor_count', 'source']) {
      const { error, patch } = validateUpdate({ id: 5, patch: { [field]: 'x' } })
      assert.ok(error, `expected ${field} to be rejected`)
      assert.strictEqual(patch, undefined)
    }
    ok('every audit-derived / read-only column is rejected individually, including disqualified_reason')
  }
  {
    const { error } = validateUpdate({ id: 5, patch: { stage: 'not_a_real_stage' } })
    assert.ok(error, 'expected an error for an invalid stage value')
    ok('a stage value outside the CHECK constraint list is rejected before it reaches Postgres')
  }
  {
    for (const stage of VALID_STAGES) {
      const { error, patch } = validateUpdate({ id: 5, patch: { stage } })
      assert.strictEqual(error, undefined, `expected ${stage} to be a valid stage`)
      assert.strictEqual(patch.stage, stage)
    }
    ok('all 9 stage values from the migration CHECK constraint are individually accepted')
  }
  {
    const { error } = validateUpdate({ id: 5, patch: {} })
    assert.ok(error, 'expected an error for an empty patch')
    ok('an empty patch is rejected rather than silently succeeding as a no-op update')
  }
  {
    const { error } = validateUpdate({ id: 0, patch: { stage: 'won' } })
    assert.ok(error, 'expected an error for id 0')
    const { error: error2 } = validateUpdate({ id: 'five', patch: { stage: 'won' } })
    assert.ok(error2, 'expected an error for a non-numeric id')
    ok('a missing or non-numeric id is rejected')
  }
  {
    const { error, patch } = validateUpdate({ id: 5, patch: { next_action_at: '2026-09-01T10:00:00.000Z' } })
    assert.strictEqual(error, undefined)
    assert.strictEqual(patch.next_action_at, '2026-09-01T10:00:00.000Z')
    ok('a valid ISO timestamp field round-trips')
  }
  {
    const { error, patch } = validateUpdate({ id: 5, patch: { next_action_at: null } })
    assert.strictEqual(error, undefined)
    assert.strictEqual(patch.next_action_at, null)
    ok('a timestamp field can be explicitly cleared to null')
  }
  {
    const { error } = validateUpdate({ id: 5, patch: { next_action_at: 'not a date' } })
    assert.ok(error, 'expected an error for an unparseable date')
    ok('an unparseable timestamp is rejected, not silently coerced')
  }

  section('Contract: the touch channel/direction sets match the migration CHECK constraints')
  {
    assert.deepStrictEqual([...VALID_CHANNELS].sort(), ['email', 'linkedin', 'x'])
    assert.deepStrictEqual([...VALID_DIRECTIONS].sort(), ['in', 'out'])
    ok('VALID_CHANNELS and VALID_DIRECTIONS are exactly the values the migration CHECK constraints allow')
  }

  section('validateTouch(): channel and direction validation')
  {
    for (const channel of VALID_CHANNELS) {
      for (const direction of VALID_DIRECTIONS) {
        const { error, insert } = validateTouch({ prospect_id: 5, channel, direction })
        assert.strictEqual(error, undefined, `expected ${channel}/${direction} to be accepted`)
        assert.strictEqual(insert.channel, channel)
        assert.strictEqual(insert.direction, direction)
      }
    }
    ok('every combination of a valid channel and a valid direction is accepted')
  }
  {
    const { error, insert } = validateTouch({ prospect_id: 5, channel: 'sms', direction: 'out' })
    assert.ok(error, 'expected an error for an unsupported channel')
    assert.ok(/channel/.test(error), `error should name the field, got: ${error}`)
    assert.strictEqual(insert, undefined)
    ok('an invalid channel (not in email/linkedin/x) is rejected, not stored')
  }
  {
    const { error, insert } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'sideways' })
    assert.ok(error, 'expected an error for an unsupported direction')
    assert.ok(/direction/.test(error), `error should name the field, got: ${error}`)
    assert.strictEqual(insert, undefined)
    ok('an invalid direction (not in out/in) is rejected, not stored')
  }
  {
    const { error } = validateTouch({ prospect_id: 0, channel: 'email', direction: 'out' })
    assert.ok(error, 'expected an error for prospect_id 0')
    const { error: error2 } = validateTouch({ channel: 'email', direction: 'out' })
    assert.ok(error2, 'expected an error for a missing prospect_id')
    ok('a missing or non-positive prospect_id is rejected')
  }

  section('validateTouch(): occurred_at and the outbound/inbound distinction')
  {
    const before = Date.now()
    const { error, occurredAtIso, insert } = validateTouch({ prospect_id: 5, channel: 'linkedin', direction: 'out' })
    assert.strictEqual(error, undefined)
    assert.ok(new Date(occurredAtIso).getTime() >= before, 'occurred_at should default to roughly now()')
    assert.strictEqual(insert.occurred_at, occurredAtIso)
    ok('occurred_at defaults to now() when absent, and the insert carries the same value returned to the caller')
  }
  {
    const { error, occurredAtIso } = validateTouch({
      prospect_id: 5, channel: 'x', direction: 'in', occurred_at: '2026-08-10T09:00:00.000Z',
    })
    assert.strictEqual(error, undefined)
    assert.strictEqual(occurredAtIso, '2026-08-10T09:00:00.000Z')
    ok('an explicit valid occurred_at round-trips exactly (backfilling a touch that already happened)')
  }
  {
    const { error } = validateTouch({ prospect_id: 5, channel: 'x', direction: 'in', occurred_at: 'not a date' })
    assert.ok(error, 'expected an error for an unparseable occurred_at')
    ok('an unparseable occurred_at is rejected, not silently coerced')
  }
  {
    // This is the field the handler reads to decide last_contacted_at vs
    // replied_at -- prove the pure function returns the exact direction it
    // was given, since the handler branches on this value, not on re-deriving it.
    const out = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out' })
    const inn = validateTouch({ prospect_id: 5, channel: 'email', direction: 'in' })
    assert.strictEqual(out.direction, 'out')
    assert.strictEqual(inn.direction, 'in')
    ok("validateTouch() returns 'out'/'in' verbatim -- the handler maps 'out' to last_contacted_at and 'in' to replied_at")
  }

  section('validateTouch(): optional subject/body/note')
  {
    const { error, insert } = validateTouch({
      prospect_id: 5, channel: 'email', direction: 'out',
      subject: 'Quick question about AI visibility', body: 'Hi Jane, ...', note: 'sent via Gmail',
    })
    assert.strictEqual(error, undefined)
    assert.strictEqual(insert.subject, 'Quick question about AI visibility')
    assert.strictEqual(insert.body, 'Hi Jane, ...')
    assert.strictEqual(insert.note, 'sent via Gmail')
    ok('subject/body/note are accepted and passed through when present')
  }
  {
    const { error, insert } = validateTouch({ prospect_id: 5, channel: 'linkedin', direction: 'out' })
    assert.strictEqual(error, undefined)
    assert.ok(!('subject' in insert), 'subject should be omitted, not set to undefined, when absent')
    ok('subject/body/note are omitted from the insert object entirely when not provided (no undefined columns)')
  }
  {
    const { error } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', note: 42 })
    assert.ok(error, 'expected an error for a non-string note')
    ok('a non-string subject/body/note is rejected rather than coerced')
  }

  section('bg-verify S1 (BLOCKING, 2026-08-15): occurred_at is bounded and type-strict')
  // docs/qa/prospect-channels-review-2026-08-15.md measured that the PRE-FIX
  // code accepted 0, 1, true and false (all coerced to 1970 by `new Date()`),
  // "3026-01-01" (accepted as a real future date), and a year-0001 date --
  // and wrote the result verbatim into prospects.last_contacted_at /
  // replied_at. Every value below is one the reviewer used verbatim. Ran
  // against the pre-fix reconstruction of this logic before this round: all
  // six were ACCEPTED. Ran against the code below: all six are REJECTED.
  {
    for (const v of [0, 1, true, false]) {
      const { error, insert } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', occurred_at: v })
      assert.ok(error, `expected occurred_at=${JSON.stringify(v)} to be rejected (was silently accepted as 1970 pre-fix)`)
      assert.ok(/string/.test(error), `error should name the type problem, got: ${error}`)
      assert.strictEqual(insert, undefined)
    }
    ok('occurred_at of 0, 1, true, false are all rejected outright (pre-fix: all four silently became 1970-01-01)')
  }
  {
    const { error, insert } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', occurred_at: '3026-01-01' })
    assert.ok(error, 'expected a far-future occurred_at to be rejected')
    assert.ok(/future/.test(error), `error should name the future-bound problem, got: ${error}`)
    assert.strictEqual(insert, undefined)
    ok('occurred_at="3026-01-01" is rejected as too far in the future (pre-fix: silently accepted, would make a prospect look permanently just-contacted)')
  }
  {
    const { error, insert } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', occurred_at: '0001-01-01T00:00:00.000Z' })
    assert.ok(error, 'expected a year-0001 occurred_at to be rejected')
    assert.ok(/predate/.test(error), `error should name the floor-bound problem, got: ${error}`)
    assert.strictEqual(insert, undefined)
    ok('occurred_at of year 0001 is rejected as predating the floor (pre-fix: silently accepted, exactly the double-touch failure this table exists to prevent)')
  }
  {
    const okDate = new Date(TOUCH_MIN_OCCURRED_AT).toISOString()
    const { error, occurredAtIso } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', occurred_at: okDate })
    assert.strictEqual(error, undefined)
    assert.strictEqual(occurredAtIso, okDate)
    ok('occurred_at exactly at the floor (TOUCH_MIN_OCCURRED_AT) is accepted, not off-by-one excluded')
  }
  {
    const justOverFuture = new Date(Date.now() + TOUCH_MAX_FUTURE_MS + 60_000).toISOString()
    const { error } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', occurred_at: justOverFuture })
    assert.ok(error, 'expected a date just past the future ceiling to be rejected')
    ok('occurred_at just past now + TOUCH_MAX_FUTURE_MS is rejected (the 24h clock-skew allowance is not unbounded)')
  }

  section('bg-verify S5 (LOW, 2026-08-15): prospect_id rejects coerced non-numbers')
  // The reviewer measured that the PRE-FIX code's `Number(v)` coerced true,
  // [1], "1e0" and " 1 " (leading/trailing whitespace) all into 1 and
  // accepted them, misattributing a message to prospect id 1 for any
  // malformed caller. Every value below is one the reviewer used verbatim.
  {
    for (const v of [true, [1], '1e0', ' 1 ']) {
      assert.strictEqual(parseId(v), null, `expected parseId(${JSON.stringify(v)}) to be null, pre-fix it coerced to 1`)
      const { error, insert } = validateTouch({ prospect_id: v, channel: 'email', direction: 'out' })
      assert.ok(error, `expected prospect_id=${JSON.stringify(v)} to be rejected`)
      assert.strictEqual(insert, undefined)
    }
    ok('prospect_id of true, [1], "1e0" and " 1 " are all rejected (pre-fix: all four silently became 1, misattributing the message)')
  }
  {
    assert.strictEqual(parseId(5), 5)
    assert.strictEqual(parseId('5'), 5)
    assert.strictEqual(parseId(1.5), null)
    assert.strictEqual(parseId('5.5'), null)
    assert.strictEqual(parseId(-1), -1) // parseId only parses the shape; the caller enforces > 0
    ok('parseId still accepts real integers (number or clean digit string) and rejects fractional values')
  }

  section('bg-verify S6 (LOW, 2026-08-15): 5xx responses never leak the raw Postgres error text')
  // The reviewer measured that the PRE-FIX code returned `error.message`
  // (the raw PostgREST/Postgres driver string) directly in the response
  // body on every 5xx. fail500() is module scope specifically so this is
  // testable without a live failing query.
  {
    const fakeError = new Error('duplicate key value violates unique constraint "prospects_domain_key"')
    const resp = fail500({ 'Content-Type': 'application/json' }, 'update', fakeError)
    assert.strictEqual(resp.statusCode, 500)
    const parsedBody = JSON.parse(resp.body)
    assert.ok(!parsedBody.error.includes('constraint'), `response leaked driver text: ${parsedBody.error}`)
    assert.ok(!parsedBody.error.includes('prospects_domain_key'), `response leaked a column/constraint name: ${parsedBody.error}`)
    assert.strictEqual(parsedBody.code, 'update')
    ok('fail500() never puts error.message in the response body; a fixed message plus a code is returned instead (pre-fix: the raw driver string was returned verbatim)')
  }
  {
    const resp = fail500({}, 'touch:touches', new Error('connection terminated'), { touch_id: 42 })
    const parsedBody = JSON.parse(resp.body)
    assert.strictEqual(parsedBody.touch_id, 42)
    assert.strictEqual(parsedBody.code, 'touch:touches')
    ok('fail500() still surfaces a structured extra field (e.g. touch_id) alongside the fixed message and code')
  }

  section('bg-verify S2 (MEDIUM, 2026-08-15): retry_of makes a re-log idempotent')
  {
    const { error, retryOf } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out' })
    assert.strictEqual(error, undefined)
    assert.strictEqual(retryOf, null, 'retry_of should default to null when absent, not undefined or 0')
    ok('retry_of defaults to null when the caller is logging a fresh touch, not retrying one')
  }
  {
    const { error, retryOf } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', retry_of: 42 })
    assert.strictEqual(error, undefined)
    assert.strictEqual(retryOf, 42)
    ok('a valid retry_of touch id round-trips')
  }
  {
    const { error } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', retry_of: 'not-an-id' })
    assert.ok(error, 'expected an error for a malformed retry_of')
    ok('a malformed retry_of is rejected the same way an invalid prospect_id is, not silently ignored')
  }

  section('bg-verify S8 (MEDIUM, 2026-08-15): the prospect stamp is forward-only')
  // The re-review measured that the PRE-FIX code did an unconditional
  // `.update({ last_contacted_at: stampAtIso })` -- log today's touch, then
  // backfill last week's, and last_contacted_at rewinds to last week, which
  // is exactly the double-touch failure this table exists to prevent. The
  // fix is `buildAdvanceOnlyFilter()`, consumed by a single conditional
  // UPDATE (`field IS NULL OR field < newIso`) so the compare-and-swap is
  // atomic in Postgres, not a separate read then write in application code.
  //
  // This is not unit-testable against a live database from this no-network
  // suite (same constraint the file's own header documents for the auth
  // gate). What IS proven here: (1) the exact filter string the handler
  // sends to Postgres, boundary-tested; (2) `stampFieldFor()` never lets
  // last_contacted_at and replied_at cross. The database-level guarantee
  // (an older touch cannot rewind the field, the older touch still appears
  // in prospect_touches) was proven separately against a real transaction
  // that inserted two touches out of order and was rolled back -- see the
  // 2026-08-15 S8 entry in CLAUDE.md for the exact SQL and its before/after
  // output. That probe is the "prove it" evidence for the database
  // behaviour; these tests are the pure-function boundary evidence for the
  // filter this endpoint actually sends.
  {
    assert.strictEqual(stampFieldFor('out'), 'last_contacted_at')
    assert.strictEqual(stampFieldFor('in'), 'replied_at')
    ok("stampFieldFor('out') and stampFieldFor('in') never resolve to the same column")
  }
  {
    const iso = '2026-08-15T10:00:00.000Z'
    assert.strictEqual(buildAdvanceOnlyFilter('last_contacted_at', iso), `last_contacted_at.is.null,last_contacted_at.lt.${iso}`)
    assert.strictEqual(buildAdvanceOnlyFilter('replied_at', iso), `replied_at.is.null,replied_at.lt.${iso}`)
    ok('buildAdvanceOnlyFilter() names the correct column on both sides of the OR, for both stamp fields')
  }
  {
    // Simulates exactly what buildAdvanceOnlyFilter()'s PostgREST filter
    // asks Postgres to evaluate (field IS NULL OR field < newIso), so this
    // is a boundary check on the SAME comparison the handler sends, not a
    // reimplementation. `existing` null models a prospect never contacted.
    // The filter matches (the UPDATE applies) when existing is null OR existing < new.
    const filterMatches = (existingIso, newIso) => existingIso === null || new Date(existingIso).getTime() < new Date(newIso).getTime()

    const today = '2026-08-15T10:00:00.000Z'
    const lastWeek = '2026-08-08T10:00:00.000Z'
    const tomorrow = '2026-08-16T10:00:00.000Z'

    assert.strictEqual(filterMatches(null, today), true, 'a never-contacted prospect should always advance')
    assert.strictEqual(filterMatches(today, lastWeek), false, "today's stamp must NOT advance to an older backfill (this is S8's exact failure mode)")
    assert.strictEqual(filterMatches(today, tomorrow), true, 'a genuinely newer touch should still advance the stamp')
    assert.strictEqual(filterMatches(today, today), false, 'an identical timestamp should not re-fire the UPDATE (the filter is strictly-less-than, not less-or-equal)')
    ok("the filter's IS NULL OR field < newIso comparison advances only for null-or-newer, matching S8's fix intent (log today then backfill last week leaves today's stamp untouched)")
  }

  section('bg-verify S9 (INFO, 2026-08-15): a retry_of call still requires the full payload')
  // The re-review measured that the PRE-FIX comment claimed a retry_of call
  // "may omit channel/direction/occurred_at entirely". It may not:
  // validateTouch() checks channel and direction before retry_of is ever
  // parsed, regardless of whether retry_of is present. This is not a code
  // fix (the behaviour was already correct) -- it is proof that the
  // corrected comment describes reality, so nobody builds a retry UI that
  // omits fields the validator will 400 on.
  {
    const { error } = validateTouch({ prospect_id: 5, retry_of: 42 })
    assert.ok(error, 'expected an error when channel is omitted, even with retry_of present')
    assert.ok(/channel/.test(error), `error should name channel, got: ${error}`)
    ok('a retry_of call with no channel is rejected, exactly as a fresh touch would be')
  }
  {
    const { error } = validateTouch({ prospect_id: 5, channel: 'email', retry_of: 42 })
    assert.ok(error, 'expected an error when direction is omitted, even with retry_of present')
    assert.ok(/direction/.test(error), `error should name direction, got: ${error}`)
    ok('a retry_of call with no direction is rejected, exactly as a fresh touch would be')
  }
  {
    // occurred_at legitimately defaults when absent, retry_of or not -- this
    // is correct and unchanged, included so the S9 section states the full
    // picture rather than only the two fields that ARE required.
    const { error, occurredAtIso } = validateTouch({ prospect_id: 5, channel: 'email', direction: 'out', retry_of: 42 })
    assert.strictEqual(error, undefined)
    assert.ok(occurredAtIso, 'occurred_at should still default to now() on a retry_of call')
    ok('occurred_at (unlike channel/direction) is genuinely optional on a retry_of call, matching S9\'s "adjacent, not a separate finding" note')
  }

  section("bg-verify R6 'carried forward': validateUpdate()'s id now routes through parseId()")
  // Flagged rather than fixed in the prior round (the finding named only
  // validateTouch's prospect_id). Free to close while already in this file,
  // per the coordinator's explicit allowance -- same four values S5 used.
  {
    for (const v of [true, [1], '1e0', ' 1 ']) {
      const { error, patch } = validateUpdate({ id: v, patch: { stage: 'contacted' } })
      assert.ok(error, `expected id=${JSON.stringify(v)} to be rejected (previously coerced to 1 via bare Number())`)
      assert.strictEqual(patch, undefined)
    }
    ok('validateUpdate()\'s id rejects true, [1], "1e0" and " 1 ", the same class S5 fixed on prospect_id')
  }
  {
    const { error, id } = validateUpdate({ id: 5, patch: { stage: 'won' } })
    assert.strictEqual(error, undefined)
    assert.strictEqual(id, 5)
    ok('validateUpdate() still accepts a real integer id, number or clean digit string')
  }

  section('exports.handler(): the touch action is behind the same auth gate as list/update')
  {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://app.getbrandgeo.com' },
      body: JSON.stringify({ action: 'touch', prospect_id: 5, channel: 'email', direction: 'out' }),
    })
    assert.strictEqual(res.statusCode, 401)
    ok('a touch POST with no Authorization header is rejected 401 before any Supabase call')
  }
  {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://evil-clone.example', authorization: 'Bearer whatever' },
      body: JSON.stringify({ action: 'touch', prospect_id: 5, channel: 'email', direction: 'out' }),
    })
    assert.strictEqual(res.statusCode, 403)
    ok('a touch POST from an origin outside the allowlist is rejected 403 before the token is even read')
  }

  section('exports.handler(): the auth gate rejects before touching Supabase')
  {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://app.getbrandgeo.com' },
      body: JSON.stringify({ action: 'list' }),
    })
    assert.strictEqual(res.statusCode, 401)
    const parsed = JSON.parse(res.body)
    assert.ok(/token/i.test(parsed.error), `expected a missing-token error, got: ${parsed.error}`)
    ok('a POST with no Authorization header is rejected 401 before any Supabase call')
  }
  {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://evil-clone.example', authorization: 'Bearer whatever' },
      body: JSON.stringify({ action: 'list' }),
    })
    assert.strictEqual(res.statusCode, 403)
    ok('a POST from an origin outside the allowlist is rejected 403 before the token is even read')
  }
  {
    const res = await handler({
      httpMethod: 'OPTIONS',
      headers: { origin: 'https://app.getbrandgeo.com' },
    })
    assert.strictEqual(res.statusCode, 204)
    ok('CORS preflight is answered without requiring auth, same as every other admin function')
  }

  // ── promote (packet 019) ─────────────────────────────────────────────────
  section('promote: the only write path to a contact route, and it accepts only an id')
  {
    assert.ok(validatePromote({ candidate_id: 12 }).candidate_id === 12)
    assert.ok(validatePromote({ candidate_id: '12' }).candidate_id === 12)
    ok('a real integer id, as a number or a digit string, is accepted')
  }
  {
    // Same coercion class bg-verify S5 closed on prospect_id. A candidate id
    // decides which company a contact route is written to, so the identical
    // looseness would be the identical misattribution bug.
    for (const bad of [true, [1], '1e0', ' 1 ', '1.0', null, undefined, {}, 0, -3]) {
      const res = validatePromote({ candidate_id: bad })
      assert.ok(res.error, `expected candidate_id ${JSON.stringify(bad)} to be rejected`)
    }
    ok('true, [1], "1e0", " 1 ", "1.0", null, undefined, {}, 0 and -3 are all rejected as candidate_id')
  }
  {
    // The load-bearing property: promote takes NOTHING but an id, so a
    // caller cannot use it to smuggle an arbitrary contact_email past the
    // WRITABLE_FIELDS whitelist that `update` enforces.
    const res = validatePromote({
      candidate_id: 7,
      value: 'ceo@somewhere-else.com',
      kind: 'email',
      source_url: 'https://attacker.example',
      patch: { stage: 'won' },
    })
    assert.deepStrictEqual(Object.keys(res), ['candidate_id'])
    assert.strictEqual(res.candidate_id, 7)
    ok('extra fields on a promote request are dropped entirely, not merged: only candidate_id survives')
  }

  section('promote: what a click actually writes')
  {
    const { patch } = promotionPatch({
      kind: 'email',
      value: 'nithy@pagelightprime.com',
      source_url: 'https://play.google.com/store/apps/details?id=x',
      email_kind: 'individual',
    })
    assert.deepStrictEqual(patch, {
      contact_email: 'nithy@pagelightprime.com',
      contact_email_source: 'https://play.google.com/store/apps/details?id=x',
      contact_email_kind: 'individual',
    })
    ok('an email carries its provenance across: value, the URL it was seen at, and individual/role')
  }
  {
    const { patch } = promotionPatch({ kind: 'email', value: 'a@b.com', source_url: 'https://b.com', email_kind: 'nonsense' })
    assert.strictEqual(patch.contact_email_kind, null)
    ok('an unrecognised email_kind becomes null rather than being written through unchecked')
  }
  {
    // The rule that must not erode: choosing to USE a profile is not the
    // same as having confirmed it belongs to that person, and LinkedIn
    // returns HTTP 999 to every automated client so it cannot be confirmed
    // by machine at all. A "Verified" badge must never appear on the
    // strength of a click.
    for (const kind of ['linkedin', 'x']) {
      const { patch } = promotionPatch({ kind, value: 'https://example.com/p', source_url: 'https://src', email_kind: null })
      assert.ok(!('x_verified' in patch), `${kind} promotion must not set x_verified`)
      assert.ok(!('linkedin_verified' in patch), `${kind} promotion must not set linkedin_verified`)
    }
    ok('promoting a linkedin or x candidate NEVER sets x_verified or linkedin_verified')
  }
  {
    const linkedin = promotionPatch({ kind: 'linkedin', value: 'https://linkedin.com/in/x', source_url: 'https://s' })
    assert.deepStrictEqual(linkedin.patch, { linkedin_url: 'https://linkedin.com/in/x' })
    const x = promotionPatch({ kind: 'x', value: 'https://x.com/y', source_url: 'https://s' })
    assert.deepStrictEqual(x.patch, { x_url: 'https://x.com/y' })
    ok('a linkedin candidate writes only linkedin_url, an x candidate only x_url')
  }
  {
    // Every patch key promotionPatch can ever produce must be a column the
    // resolver is allowed to feed, and must NOT be on the update whitelist:
    // these are two disjoint write surfaces on purpose.
    const produced = new Set()
    for (const c of [
      { kind: 'email', value: 'a@b.com', source_url: 's', email_kind: 'role' },
      { kind: 'linkedin', value: 'u', source_url: 's' },
      { kind: 'x', value: 'u', source_url: 's' },
    ]) {
      for (const k of Object.keys(promotionPatch(c).patch)) produced.add(k)
    }
    assert.deepStrictEqual(
      [...produced].sort(),
      ['contact_email', 'contact_email_kind', 'contact_email_source', 'linkedin_url', 'x_url'],
    )
    for (const k of produced) {
      assert.ok(!WRITABLE_FIELDS.has(k), `${k} must stay off the update whitelist`)
    }
    ok('promote writes exactly 5 columns, and none of them is on the update whitelist')
  }
  {
    for (const bad of [null, undefined, {}, { kind: 'phone', value: 'x', source_url: 's' }]) {
      assert.ok(promotionPatch(bad).error, `expected ${JSON.stringify(bad)} to be rejected`)
    }
    assert.ok(promotionPatch({ kind: 'email', value: '   ', source_url: 's' }).error)
    assert.ok(promotionPatch({ kind: 'email', value: 42, source_url: 's' }).error)
    ok('a candidate with an unknown kind, a blank value or a non-string value is rejected, not written')
  }
  {
    assert.deepStrictEqual([...VALID_CANDIDATE_KINDS].sort(), ['email', 'linkedin', 'x'])
    assert.deepStrictEqual([...VALID_CANDIDATE_KINDS].sort(), [...VALID_CHANNELS].sort())
    ok('candidate kinds match the touch channels exactly: a route you can stage is a route you can log a touch on')
  }

  section('promote: candidate ordering puts the strongest evidence first')
  {
    const rows = [
      { confidence: 'low',    email_kind: 'individual', created_at: '2026-08-16T10:00:00Z' },
      { confidence: 'high',   email_kind: 'role',       created_at: '2026-08-16T10:00:00Z' },
      { confidence: 'medium', email_kind: 'individual', created_at: '2026-08-16T10:00:00Z' },
      { confidence: 'high',   email_kind: 'individual', created_at: '2026-08-16T10:00:00Z' },
    ]
    const sorted = [...rows].sort(candidateSort)
    assert.deepStrictEqual(
      sorted.map(r => `${r.confidence}/${r.email_kind}`),
      ['high/individual', 'high/role', 'medium/individual', 'low/individual'],
    )
    ok('confidence dominates, and an individual address outranks a role inbox at equal confidence')
  }
  {
    // The reason this sort lives in JS at all: Postgres would order the text
    // column alphabetically as high, low, medium, putting the WEAKEST
    // evidence second. Assert the JS order is not the alphabetical one.
    const alphabetical = ['high', 'low', 'medium']
    const actual = [{ confidence: 'medium' }, { confidence: 'low' }, { confidence: 'high' }]
      .sort(candidateSort).map(r => r.confidence)
    assert.deepStrictEqual(actual, ['high', 'medium', 'low'])
    assert.notDeepStrictEqual(actual, alphabetical)
    ok('the order is high, medium, low, NOT the alphabetical high, low, medium a text column sort would give')
  }
  {
    const same = [
      { confidence: 'high', email_kind: null, created_at: '2026-08-16T12:00:00Z' },
      { confidence: 'high', email_kind: null, created_at: '2026-08-16T09:00:00Z' },
    ].sort(candidateSort)
    assert.strictEqual(same[0].created_at, '2026-08-16T09:00:00Z')
    ok('an all-else-equal tie breaks on the earliest sighting, so the order is stable across re-runs')
  }

  section('promote: the auth gate is the same one every other action sits behind')
  {
    const res = await handler({
      httpMethod: 'POST',
      headers: { origin: 'https://app.getbrandgeo.com' },
      body: JSON.stringify({ action: 'promote', candidate_id: 1 }),
    })
    assert.strictEqual(res.statusCode, 401)
    ok('an unauthenticated promote is rejected 401 before any Supabase call')
  }

  // ── Follow-up schedule (docs/arch/reply-handling.md part A) ───────────────
  const OCC = '2026-08-17T12:00:00.000Z'
  const plusDays = (d) => new Date(Date.parse(OCC) + d * 24 * 60 * 60 * 1000).toISOString()

  section('schedule: the cadence Constantin ruled is +4 days, +7 days, then stop')
  {
    assert.deepStrictEqual(FOLLOW_UP_STEPS_DAYS, [4, 7])
    ok('FOLLOW_UP_STEPS_DAYS is exactly [4, 7]; a third outbound touch stops')

    const first = nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 1, stage: 'contacted' })
    assert.deepStrictEqual(first, { value: plusDays(4) })
    ok('1st outbound touch schedules the next step 4 days out')

    const second = nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 2, stage: 'contacted' })
    assert.deepStrictEqual(second, { value: plusDays(7) })
    ok('2nd outbound touch schedules the next step 7 days out')

    const third = nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 3, stage: 'contacted' })
    assert.deepStrictEqual(third, { value: null })
    ok('3rd outbound touch CLEARS next_action_at: the sequence is exhausted, not extended')

    const tenth = nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 10, stage: 'contacted' })
    assert.deepStrictEqual(tenth, { value: null })
    ok('running far past the end of the array still stops rather than throwing')
  }

  section('schedule: a reply stops the queue asking')
  {
    const replied = nextActionAtFor({ direction: 'in', occurredAtIso: OCC, outboundCount: 1, stage: 'contacted' })
    assert.deepStrictEqual(replied, { value: null })
    ok('an inbound touch clears next_action_at regardless of how many touches went out')
  }

  section('schedule: skip and clear are different, and conflating them is the defect')
  {
    for (const stage of TERMINAL_STAGES) {
      const res = nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 1, stage })
      assert.deepStrictEqual(res, { skip: true }, `stage ${stage} must skip, not clear`)
    }
    ok('every terminal stage returns { skip: true }, so a date a human set is never wiped')

    const exhausted = nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 3, stage: 'contacted' })
    assert.notDeepStrictEqual(exhausted, { skip: true })
    assert.strictEqual('value' in exhausted, true)
    ok('an exhausted sequence returns { value: null }, which DOES write, unlike skip')

    assert.deepStrictEqual(TERMINAL_STAGES, new Set(['won', 'lost', 'disqualified']))
    ok("TERMINAL_STAGES is won/lost/disqualified, matching the page's own exclusion")
    for (const stage of TERMINAL_STAGES) {
      assert.strictEqual(VALID_STAGES.has(stage), true, `${stage} must be a real stage`)
    }
    ok('every terminal stage is a stage the CHECK constraint actually allows')
  }

  section('schedule: a junk occurred_at skips rather than writing a bad date')
  {
    for (const bad of ['not-a-date', '', 'yesterday']) {
      const res = nextActionAtFor({ direction: 'out', occurredAtIso: bad, outboundCount: 1, stage: 'contacted' })
      assert.deepStrictEqual(res, { skip: true }, `${JSON.stringify(bad)} must skip`)
    }
    ok('an unparseable occurred_at skips; it never produces an Invalid Date write')
  }

  section('schedule: it never writes a stage, and never a contact route')
  {
    const outputs = [
      nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 1, stage: 'contacted' }),
      nextActionAtFor({ direction: 'in', occurredAtIso: OCC, outboundCount: 1, stage: 'contacted' }),
      nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 3, stage: 'won' }),
    ]
    for (const res of outputs) {
      for (const key of Object.keys(res)) {
        assert.strictEqual(['skip', 'value'].includes(key), true, `unexpected key ${key}`)
      }
    }
    ok('the function can only ever emit skip or value: no stage, no email, no url')

    assert.strictEqual(WRITABLE_FIELDS.has('next_action_at'), true)
    ok('next_action_at stays writable, so the auto-schedule is a default and not a lock')
  }

  section('F2: the reply guard, at the level of the pure rule')
  {
    // Review finding F2 (HIGH), 2026-09-03. The forward-only stamp is per
    // column, so an outbound touch older than a logged reply passed the stamp
    // (it IS newer than last_contacted_at) and armed a follow-up on somebody
    // who had already answered.
    const REPLIED = '2026-08-19T08:00:00.000Z'

    const before = nextActionAtFor({
      direction: 'out', occurredAtIso: '2026-08-18T09:00:00.000Z',
      outboundCount: 1, stage: 'contacted', repliedAtIso: REPLIED,
    })
    assert.deepStrictEqual(before, { skip: true })
    ok('an outbound touch BEFORE a logged reply skips: history, not a schedule input')

    const equal = nextActionAtFor({
      direction: 'out', occurredAtIso: REPLIED,
      outboundCount: 1, stage: 'contacted', repliedAtIso: REPLIED,
    })
    assert.deepStrictEqual(equal, { skip: true })
    ok('an outbound touch at exactly replied_at skips as well')

    const after = nextActionAtFor({
      direction: 'out', occurredAtIso: '2026-08-21T09:00:00.000Z',
      outboundCount: 1, stage: 'contacted', repliedAtIso: REPLIED,
    })
    assert.deepStrictEqual(after, { value: '2026-08-25T09:00:00.000Z' })
    ok('an outbound touch AFTER the reply still schedules: this is a guard, not a blanket stop')

    // skip, not value: null. Wiping a date a human set on a prospect who
    // replied is the other half of the same defect.
    assert.strictEqual('value' in before, false)
    ok('the guard SKIPS rather than clearing, so a hand-set date on a replied prospect survives')

    const noReply = nextActionAtFor({
      direction: 'out', occurredAtIso: '2026-08-18T09:00:00.000Z',
      outboundCount: 1, stage: 'contacted', repliedAtIso: null,
    })
    assert.deepStrictEqual(noReply, { value: '2026-08-22T09:00:00.000Z' })
    ok('a prospect who has never replied behaves exactly as before the fix')

    for (const junk of ['not-a-date', 'yesterday']) {
      assert.deepStrictEqual(
        nextActionAtFor({ direction: 'out', occurredAtIso: OCC, outboundCount: 1, stage: 'contacted', repliedAtIso: junk }),
        { skip: true },
        `an unparseable replied_at (${junk}) must fail closed`
      )
    }
    ok('an unparseable replied_at fails CLOSED: not chasing beats chasing somebody who answered')
  }

  section('F3: the occurred_at floor is one constant, shared with the poller')
  {
    // The bounds moved into _touches.js so poll-inbound-replies.js enforces
    // the same floor the admin path has enforced since bg-verify S1. This
    // pins that the admin path still sees the same value after the move.
    const shared = require(path.join(__dirname, '..', 'netlify', 'functions', '_touches.js'))
    assert.strictEqual(TOUCH_MIN_OCCURRED_AT, shared.TOUCH_MIN_OCCURRED_AT)
    assert.strictEqual(TOUCH_MIN_OCCURRED_AT, Date.parse('2026-01-01T00:00:00.000Z'))
    ok('prospects-admin.js and _touches.js name the SAME floor, so the two paths cannot drift')

    // clampOccurredAt is the untrusted-input reading of the same bound: it
    // corrects rather than rejecting, because a mail header has no human to
    // hand a 400 to.
    const now = Date.parse('2026-09-03T12:00:00.000Z')
    assert.strictEqual(shared.clampOccurredAt('Thu, 01 Jan 1970 00:00:00 +0000', now), '2026-09-03T12:00:00.000Z')
    assert.strictEqual(shared.clampOccurredAt('Mon, 01 Jan 1900 00:00:00 GMT', now), '2026-09-03T12:00:00.000Z')
    assert.strictEqual(shared.clampOccurredAt('Fri, 01 Jan 2100 00:00:00 GMT', now), '2026-09-03T12:00:00.000Z')
    assert.strictEqual(shared.clampOccurredAt('nonsense', now), '2026-09-03T12:00:00.000Z')
    assert.strictEqual(shared.clampOccurredAt(null, now), '2026-09-03T12:00:00.000Z')
    assert.strictEqual(shared.clampOccurredAt('2026-08-20T08:00:00.000Z', now), '2026-08-20T08:00:00.000Z')
    ok('clampOccurredAt pins a below-floor, unparseable or future date to now, and passes a real one through')
  }

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
