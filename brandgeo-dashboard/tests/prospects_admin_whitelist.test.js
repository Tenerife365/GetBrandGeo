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
const { handler, validateUpdate, WRITABLE_FIELDS, VALID_STAGES } = require(MOD)

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

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
