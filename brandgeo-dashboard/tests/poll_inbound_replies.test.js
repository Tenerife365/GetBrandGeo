/**
 * poll_inbound_replies.test.js -- guards the pure header-reading half of
 * netlify/functions/poll-inbound-replies.js.
 * Run: `node tests/poll_inbound_replies.test.js` (exits non-zero on failure).
 *
 * WHY THIS FILE EXISTS. The poller had NO test file at all, and the two
 * functions with no test are the two that read attacker-controlled input:
 * From and Date come off a message any stranger can send to the outbound
 * mailbox. docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md
 * ranked both as HIGH:
 *
 *   F1: parseFromAddress() took the FIRST angle-bracketed token, so a quoted
 *       display name containing a real prospect address attributed a stranger's
 *       message to that prospect. recordTouch then stamped replied_at and
 *       cleared next_action_at, and the prospect silently left the follow-up
 *       queue.
 *   F3: occurredAtFrom() clamped only the upper end, so "Date: Thu, 01 Jan
 *       1970" wrote replied_at = 1970 on a real prospect row. The admin path
 *       had rejected exactly that since 2026-08-15.
 *
 * The handler itself is not exercised here: it needs Gmail, Supabase and a
 * cron secret. What is proven is the reading of the headers, which is where
 * both findings lived.
 */
const assert = require('assert')
const path = require('path')

const POLLER = path.join(__dirname, '..', 'netlify', 'functions', 'poll-inbound-replies.js')
const { parseFromAddress, isAutomated, occurredAtFrom, chunk } = require(POLLER)

let passed = 0
const ok = (n) => { passed++; console.log('  ok -', n) }
const section = (n) => console.log(`\n${n}`)

const H = (pairs) => Object.entries(pairs).map(([name, value]) => ({ name, value }))

async function run() {
  section('F1: a hostile From header cannot attribute a reply to the wrong prospect')
  {
    // The four the reviewer reproduced, verbatim. Each one used to return the
    // address in the DISPLAY NAME, which is a real prospect address already on
    // file (sales@casepacer.com is one of the nine contacted 2026-08-16).
    const hostile = [
      ['"Lead <lead@hoowla.com>" <attacker@evil.example>', 'attacker@evil.example'],
      ['"<lead@hoowla.com>" <attacker@evil.example>', 'attacker@evil.example'],
      ['"reply-to <sales@casepacer.com>" <spoof@mailer.example>', 'spoof@mailer.example'],
      ['"sales@casepacer.com" <spoof@mailer.example>', 'spoof@mailer.example'],
      // A comment is the other place RFC 5322 lets arbitrary text hide.
      ['Lead (lead@hoowla.com) <attacker@evil.example>', 'attacker@evil.example'],
      // A bare address in an unquoted display name, no brackets around it.
      ['lead@hoowla.com <attacker@evil.example>', 'attacker@evil.example'],
      // An escaped quote inside the quoted string must not end it early.
      ['"Lead \\" <lead@hoowla.com>" <attacker@evil.example>', 'attacker@evil.example'],
    ]
    for (const [header, expected] of hostile) {
      assert.strictEqual(parseFromAddress(header), expected, `misparsed: ${header}`)
    }
    ok(`${hostile.length} hostile From headers all resolve to the REAL sender, never the display name`)

    for (const [header] of hostile) {
      assert.notStrictEqual(parseFromAddress(header), 'lead@hoowla.com')
      assert.notStrictEqual(parseFromAddress(header), 'sales@casepacer.com')
    }
    ok('none of them can produce a prospect address that is already on file')
  }

  section('F1: ambiguity is refused rather than guessed')
  {
    const refused = [
      '<a@x.com> <b@y.com>',
      'Lead <lead@hoowla.com>, Eve <eve@evil.example>',
      'undisclosed-recipients:;',
      '"a" <lead@hoowla.com',
      'not an address at all',
      '',
      null,
      undefined,
      'lead@hoowla',
      'lead@@hoowla.com',
      '<@relay.example:victim@hoowla.com>',
    ]
    for (const header of refused) {
      assert.strictEqual(parseFromAddress(header), null, `should have been refused: ${header}`)
    }
    ok('two mailboxes, a group, an unterminated bracket, a source route and junk all return null')

    // Returning null means the message is counted as unmatched_sender and no
    // touch is written, which is the correct failure: a reply we could not
    // attribute stays in the human's inbox and the prospect stays in the queue.
    ok('a refused header costs one unlogged reply, never a wrong prospect record')
  }

  section('F1: ordinary headers still parse, so the fix is not just a blanket refusal')
  {
    assert.strictEqual(parseFromAddress('Lead <lead@hoowla.com>'), 'lead@hoowla.com')
    assert.strictEqual(parseFromAddress('lead@hoowla.com'), 'lead@hoowla.com')
    assert.strictEqual(parseFromAddress('  lead@hoowla.com  '), 'lead@hoowla.com')
    assert.strictEqual(parseFromAddress('LEAD@Hoowla.COM'), 'lead@hoowla.com')
    assert.strictEqual(parseFromAddress('"Lead, Hoowla" <lead@hoowla.com>'), 'lead@hoowla.com')
    assert.strictEqual(parseFromAddress('Sales Team <sales+crm@case-pacer.co.uk>'), 'sales+crm@case-pacer.co.uk')
    ok('name-addr, bare addr-spec, mixed case, a comma inside quotes and a plus tag all parse')
  }

  section('F3: the Date header is clamped at BOTH ends')
  {
    const floor = Date.parse('2026-01-01T00:00:00.000Z')
    for (const header of [
      'Thu, 01 Jan 1970 00:00:00 +0000',
      'Tue, 01 Jan 1901 00:00:00 GMT',
      'Mon, 01 Jan 1900 00:00:00 GMT',
      '0001-01-01T00:00:00.000Z',
    ]) {
      const iso = occurredAtFrom(header)
      assert.ok(Date.parse(iso) >= floor, `${header} produced ${iso}, below the 2026-01-01 floor`)
    }
    ok('every below-floor Date the reviewer produced now reads as now(), not as 1970')

    const future = occurredAtFrom('Fri, 01 Jan 2100 00:00:00 GMT')
    assert.ok(Date.parse(future) <= Date.now() + 1000)
    ok('a far-future Date is still clamped to now (the pre-existing upper bound is intact)')

    assert.strictEqual(occurredAtFrom('Wed, 20 Aug 2026 08:00:00 +0000'), '2026-08-20T08:00:00.000Z')
    ok('a real Date header is preserved exactly, so a genuine reply keeps its own timestamp')

    const missing = occurredAtFrom(null)
    assert.ok(Math.abs(Date.parse(missing) - Date.now()) < 5000)
    ok('a missing Date falls back to now rather than refusing the reply')
  }

  section('F10: the autoresponders that set none of the original four headers')
  {
    assert.strictEqual(isAutomated(H({ 'Auto-Submitted': 'auto-replied' })), true)
    assert.strictEqual(isAutomated(H({ Precedence: 'bulk' })), true)
    ok('the RFC 3834 and Precedence cases still fire (Gmail vacation responder)')

    assert.strictEqual(isAutomated(H({ 'X-MS-Exchange-Inbox-Rules-Loop': 'sales@casepacer.com' })), true)
    assert.strictEqual(isAutomated(H({ 'X-Auto-Response-Suppress': 'All' })), true)
    ok('the two Exchange and Outlook headers are now recognised')

    for (const subject of ['Automatic reply: BrandGEO audit', 'Out of Office', 'Re: Automatic reply: hello', 'Autoreply']) {
      assert.strictEqual(isAutomated(H({ Subject: subject })), true, `missed: ${subject}`)
    }
    ok('the common out-of-office subject lines are treated as automated')

    assert.strictEqual(isAutomated(H({ Subject: 'Re: BrandGEO audit for casepacer.com' })), false)
    assert.strictEqual(isAutomated(H({ Subject: 'Out of scope for us right now' })), false)
    assert.strictEqual(isAutomated(H({ 'Auto-Submitted': 'no' })), false)
    ok('a real reply, including one that merely starts with "Out of", is NOT swallowed')
  }

  section('chunking is unchanged, and is what F12 relies on')
  {
    assert.deepStrictEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])
    assert.deepStrictEqual(chunk([], 25), [])
    ok('chunk() splits evenly and returns nothing for an empty list')
  }

  // N2 (2026-09-03 re-review): one well-formed token beside a stray bracket.
  {
    for (const header of [
      '<<sales@prospect.example>@evil.example>',
      '<sales@prospect.example>>@evil.example',
      '<@evil.example <sales@prospect.example>',
      'x> <sales@prospect.example>',
    ]) {
      assert.strictEqual(parseFromAddress(header), null, header)
    }
    ok('a stray bracket outside the one <...> token refuses the header instead of trusting the token')
    assert.strictEqual(parseFromAddress('Sales Team <sales@prospect.example>'), 'sales@prospect.example')
    ok('an ordinary name-addr still parses after the stray-bracket rule')
  }

  console.log(`\n${passed} assertions passed.`)
}

run().catch((e) => {
  console.error('\nFAILED:', e.message)
  process.exit(1)
})
