# Reply handling

**Date:** 2026-08-20
**Author:** bg-architect (session), against production measurement, not memory
**State:** Parts A and B BUILT and uncommitted. Both production migrations are
APPLIED. 96 test assertions passing across two suites. The poller is not
deployed and deliberately not yet scheduled, see 7.1.
**Decisions taken by Constantin 2026-08-20:** automatic Gmail polling (not
manual only), cadence +4 days then +7 days then stop at 3 outbound touches.

---

## 1. What is actually missing

Measured against production on 2026-08-20, not inherited from `CLAUDE.md`:

| | |
|---|---|
| Prospects at `stage='contacted'` | 13 |
| Of those, carrying a `next_action_at` | 0 |
| Prospects with `next_action_at` at all, of 71 | 0 |
| Inbound touches ever logged | 0 |
| Non-null `replied_at` / `reply_note` | 0 / 0 |
| Outbound touches | 14, across 13 prospects |

`CLAUDE.md` records this as "no follow-up sequence, no due queue". That is
imprecise in a way that changes the size of the job. The due queue **exists**:
`src/pages/Prospects.tsx` already has `isActionableNow()`, `isOverdue()`,
queue ordering by `evidenceStrength()`, a `next_action_at` date picker wired to
`update`, and an out/in direction toggle that can already log an inbound touch
through the shipped `touch` action.

The queue is not missing. It is empty, because nothing has ever written
`next_action_at`. `prospects-admin.js` `touch` stamps exactly one field,
`last_contacted_at` for outbound or `replied_at` for inbound, and never reads
or writes `next_action_at` at all.

So the open loop is three gaps, and only the first needs new logic in an
existing file:

1. **Nothing schedules the next step.** Section 3.
2. **Nothing notices a reply.** Section 4.
3. **Nothing ever stops.** Folded into section 3, because the stop rule is the
   terminal case of the schedule rule.

---

## 2. Principles carried forward, so they are not re-argued

These are existing rulings this design is bound by. Listed because each one
rules out an implementation that would otherwise look obvious.

- **A touch never sets a stage.** Established when `prospect_touches` shipped.
  A touch records that contact happened, nothing about pipeline progress.
  Auto-advancing a prospect to `replied` on an inbound touch is therefore out,
  even though it is tempting. `replied_at` is a timestamp, not a stage.
- **Forward-only stamps.** `buildAdvanceOnlyFilter()` (the S8 fix, verified at
  DB level 2026-08-15) means logging last week's message after today's cannot
  rewind `last_contacted_at`. The schedule rule in section 3 has to respect the
  same property or it reintroduces the bug one field over.
- **Scheduled functions are gated and are scheduled from Supabase.** The
  2026-07-28 ruling: `requireCronAuth()` in `_cron_auth.js`, `x-cron-key`
  header, fail closed on a missing `CRON_SECRET`, and `pg_cron` is the
  scheduler, not Netlify's. Any new scheduled function follows this or it is a
  fifth public endpoint doing real work behind nothing but an unadvertised URL.
- **Agents never send.** The poller in section 4 takes a **read-only Gmail
  scope**. A function holding a send scope is a function that can cold-email
  without a human, which crosses the standing rule regardless of what the code
  currently does with it.
- **Provenance over inference**, the ruling the contact resolver rests on. It
  applies again here: an auto-logged reply must record the Gmail message id it
  came from, so a wrong match can be traced and undone rather than argued about.

---

## 3. Part A: the schedule rule

### 3.1 Behaviour

On a successful `touch`, after the existing stamp UPDATE:

| Trigger | `next_action_at` becomes |
|---|---|
| Outbound touch, and it is this prospect's 1st outbound | `occurred_at + 4 days` |
| Outbound touch, and it is the 2nd | `occurred_at + 7 days` |
| Outbound touch, and it is the 3rd or later | `null` (sequence exhausted) |
| Inbound touch, any | `null` (they answered, stop nagging) |
| Prospect is at a terminal stage (`won`, `lost`, `disqualified`) | unchanged, no write |

Counting is over `prospect_touches` rows for that prospect with
`direction='out'`, including the row just inserted.

### 3.2 The backfill guard, which is the part that is easy to get wrong

Logging an older touch after a newer one must **not** reschedule the future.
This is the same class of defect as S8: an ordinary, explicitly supported
workflow (log today's email, then remember last week's LinkedIn message)
silently corrupting the queue field.

The existing code already computes the answer. The stamp UPDATE carries
`buildAdvanceOnlyFilter()`, so it **affects zero rows when the touch being
logged is older than what is already stamped**. Therefore:

> Write `next_action_at` only when the stamp UPDATE actually applied. If it
> affected no rows, this touch is a backfill: insert it into the history and
> leave the schedule exactly as it was.

This needs no new comparison, no second read, and no new race. It reuses a
guarantee that has already been proven at the database level.

### 3.3 Why the auto-schedule is a default and not a lock

`next_action_at` stays in `WRITABLE_FIELDS`, so the date picker still overrides
it afterwards. The rule sets a sensible next step; a human who knows better
changes it. Nothing here removes an affordance that exists today.

### 3.4 What this does not do

It does not touch `stage`. A prospect that exhausts its three touches sits at
`stage='contacted'` with a null `next_action_at` and simply stops appearing in
the actionable queue. Deciding it is `lost` is a human judgement, and the UI
already lets a human make it. Auto-marking it lost would be a stage write from
a touch, which section 2 rules out.

---

## 4. Part B: the Gmail poller

New function `netlify/functions/poll-inbound-replies.js`.

### 4.1 Honest scope, stated first

**This covers email only.** Of the 14 outbound touches logged, 6 are email,
8 are LinkedIn or a web form. LinkedIn and X replies remain manual forever,
because neither exposes an API this project can use and LinkedIn returns
HTTP 999 to automated clients. Choosing automatic polling does not close gap 2.
It closes somewhat under half of it, and the manual toggle stays load bearing.

### 4.2 Access

- OAuth2 refresh-token flow. Env: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
  `GMAIL_REFRESH_TOKEN`, `GMAIL_USER`.
- Scope: `https://www.googleapis.com/auth/gmail.readonly`, and nothing else.
- **Env budget is fine.** The 4KB Lambda ceiling that killed `GOOGLE_JSON_KEY`
  was a 2.3KB service-account JSON. Client id, secret and refresh token total
  well under 500 bytes.
- **The mailbox is the awkward part.** `constantin@getbrandgeo.com` is a
  send-as alias on the **TalentWeLove** Google Workspace, so replies land in
  the TalentWeLove mailbox, not a getbrandgeo one. Consent has to be granted on
  that account, and the poller will therefore have read access to a mailbox
  containing unrelated company mail. That is a real consideration and it is
  Constantin's to accept or reject before any credential is created.

### 4.3 Matching

1. Read prospects where `contact_email is not null` and
   `last_contacted_at is not null` and `replied_at is null` and stage is not
   terminal.
2. Chunk their addresses into groups of 25 and query
   `newer_than:30d from:(a@x.com OR b@y.com OR ...)`.
3. For each message, read `From`, `Date`, `Subject`, `Message-Id` and Gmail's
   snippet. Resolve the sender address back to the prospect.

**Skip a message if it carries `Auto-Submitted: auto-replied`, or
`Precedence: bulk`, or `X-Autoreply`.** An out-of-office that clears
`next_action_at` and stops the sequence is worse than no automation, because it
looks exactly like a real reply and silently removes the prospect from the
queue.

### 4.4 Idempotency

`prospect_touches` has no external id column, so a re-run would log the same
reply repeatedly. Add one:

```sql
alter table public.prospect_touches
  add column if not exists external_id text;

create unique index if not exists prospect_touches_external_id_key
  on public.prospect_touches (external_id)
  where external_id is not null;
```

Partial, so the 14 existing rows and every future manual touch keep a null and
are unaffected. The poller writes `external_id = 'gmail:' || messageId` and
inserts with on-conflict-do-nothing.

### 4.5 What it writes

An ordinary inbound touch: `channel='email'`, `direction='in'`,
`occurred_at` from the message `Date` header, `subject` from the subject,
`body` set to Gmail's snippet truncated to 500 characters, `note` recording the
Gmail message id, `external_id` as above.

It then goes through **the same write path as a manual touch**, so it stamps
`replied_at` under the advance-only filter and clears `next_action_at` per
section 3. It must not write `public.prospects` by any other route.

That requirement forces one refactor: the touch write currently lives inline in
`prospects-admin.js`. It should be extracted into a shared `_touches.js` so both
callers use it. Two copies of a write path that stamps a customer-facing record
is exactly the `_plans.js` drift defect this project already paid for once.

### 4.6 Schedule

`pg_cron`, hourly at minute 20. Not minute 10, which is already
`schedule-collections`. Not Netlify's scheduler, per section 2.

---

## 5. Known limits, stated rather than discovered later

- **A role inbox reply often arrives from a different address.** Mail sent to
  `sales@casepacer.com` may be answered by a named person whose address we have
  never seen, and the match in 4.3 will miss it. Unfixable by sender matching
  alone. A thread-id based match would close it and is the natural follow-up.
- **Bounces are invisible.** A bounce comes from a mailer-daemon address that
  will never match a `contact_email`, so a dead route keeps receiving follow-ups
  forever. This is a separate defect and deserves its own packet.
- **Nothing dedupes a human and the poller logging the same reply.** The human
  row carries a null `external_id`, so the partial unique index does not catch
  it. Low harm, one duplicate history row, no stamp corruption (the stamp is
  advance-only). Stated, not fixed.
- **Read access to a mailbox that is not ours in spirit.** Section 4.2.

---

## 6. What this is worth

The immediate value is not the automation. It is that 13 contacted prospects
currently have no next step at all, and the first outbound batch in this
product's history is at real risk of simply being forgotten. Part A alone fixes
that, in one file, with no new credential and no new endpoint.

Part B removes the need to remember to go and look, and covers under half the
channels while doing it.

---

## 7. Order of work, and what is done

| # | Step | State |
|---|---|---|
| 1 | The schedule rule | **DONE.** Now lives in `_touches.js`, not inline. |
| 2 | Backfill `next_action_at` for the already-contacted 13 | **DONE, applied to production.** 13 rows. 8 due 2026-08-20, 4 due 08-21, glood.ai 08-24. |
| 3 | The `_touches.js` extraction | **DONE.** `recordTouch()` is the single write path; `prospects-admin.js` now only maps its outcome onto HTTP. |
| 4 | The `external_id` migration | **DONE, applied to production.** Column nullable, index partial, 14 existing rows untouched. |
| 5 | `poll-inbound-replies.js` | **WRITTEN, not deployed, not scheduled.** |

Tests: `tests/prospects_admin_whitelist.test.js` at 76 assertions (was 63), plus
a new `tests/touches_record.test.js` at 20 that exercises the actual call
sequence `recordTouch()` makes against a scripted fake. Nothing covered that
sequence before, which made the extraction in step 3 the riskiest edit in this
set; it is now the best covered.

### 7.1 Deployment order, which is not negotiable

1. **Set the four `GMAIL_*` env vars in Netlify** (section 4.2). Consent has to
   be granted on the TalentWeLove account.
2. **Deploy.** Both `poll-inbound-replies` and the changed `prospects-admin`
   ride the same build.
3. **Only then schedule it in `pg_cron`:**

```sql
select cron.schedule(
  'poll-inbound-replies',
  '20 * * * *',
  $$select net.http_post(
      url     := 'https://app.getbrandgeo.com/.netlify/functions/poll-inbound-replies',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'x-cron-key', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
                 ),
      body    := '{}'::jsonb
    );$$
);
```

Minute 20, not minute 10, which is already `schedule-collections`.

**Scheduling before steps 1 and 2 writes an hourly failure row into `job_runs`
forever**: the function fails closed with 503 when `GMAIL_USER` or
`GMAIL_REFRESH_TOKEN` is missing, and returns 404 before it is deployed at all.
That is the same "permanent `ok = false` noise" that eroded the observability
`ping-sitemap` was built for.

---

## 8. The blocker, and what happened to it

This section originally said steps 1, 3 and 4 were blocked because
`prospects-admin.js` and `public.prospect_touches` were under active review by
`bg-verify` (packet `020`), and editing a file mid-review invalidates the review.

**That block lifted, but not for a good reason.** The `020` agent stopped
mid-run without writing `docs/qa/contact-route-promotion-020-review.md` and
without editing anything. The files were therefore never really under review,
and the review still has to happen from scratch.

Step 1 is consequently BUILT (see the state header). Steps 3 to 5 are not, and
the sequencing question is now a genuine judgement rather than a hard block:

- Packet `020` reviews a write path that is **already live in production**. It
  is mandatory and overdue.
- Part A adds a write to `next_action_at` on that same path, and Part B adds a
  second caller to it.
- Reviewing now means reviewing an intermediate state that is about to change.
  Reviewing after steps 3 and 4 means one review covers the resolver, the
  promotion path, the schedule rule and the extraction together, in the state
  that will actually ship.

**Recommendation: re-run `020` extended to cover Part A, before steps 3 to 5.**
Both halves ride the same next Netlify build regardless, so one review of the
final state is cheaper and more honest than two of a moving one. It does not
extend how long unreviewed code sits in production, because that code is
already deployed and the review has not started either way.

---

## 9. Review round 022, 2026-09-03: what changed, and what a human must know

`docs/qa/contact-routes-and-reply-handling-review-2026-08-20.md` returned
**FAIL** on the state described above. Its findings F1 to F14 were re-verified
against the tree on 2026-09-03 and the open ones in `bg-backend`'s scope were
closed. This section records only what a person deploying this needs to know;
the packet `.claude/handoffs/022-bg-backend-to-bg-verify-reply-handling-fixes.md`
carries the claims to attack.

### 9.1 The poller reads a hostile `From` and a hostile `Date` now

**F1.** `parseFromAddress()` took the first angle-bracketed token. RFC 5322
lets a quoted display name contain angle brackets, so
`"<sales@casepacer.com>" <spoof@mailer.example>` returned a real prospect
address, and Gmail's `from:` operator matches display names, so such a message
reached the candidate list. The result was an inbound touch, `replied_at`
stamped, `next_action_at` cleared, and a prospect who had said nothing
silently leaving the queue.

The rule is now: blank out quoted strings and comments first, then read the
address from what is left. Exactly one `<...>` token wins; **more than one is
refused outright** rather than guessed, and so is anything with more than one
`@`, any whitespace, or a domain with no dot.

**Behaviour a human must know:** a `From` the parser cannot resolve
unambiguously counts as `unmatched_sender`. The reply stays in the inbox, the
prospect stays in the queue, and nothing is written. That is the intended
failure: an unlogged reply costs a human one glance, a misattributed one
corrupts the record this table exists to keep honest.

**F3.** `occurredAtFrom()` clamped only the future. The sender writes the
`Date` header, so `Date: Thu, 01 Jan 1970` wrote `occurred_at = 1970` and, via
the forward-only stamp's null branch, `replied_at = 1970` on a real prospect.
The floor (`TOUCH_MIN_OCCURRED_AT`, 2026-01-01) and the 24h ceiling now live in
`_touches.js` as one copy for both callers, and the poller reads an untrusted
date through `clampOccurredAt()`, which CORRECTS to now(). The admin path still
REJECTS with a 400 instead, because a human typing a date deserves an error.

**F10.** `isAutomated()` now also catches `X-MS-Exchange-Inbox-Rules-Loop`,
`X-Auto-Response-Suppress` and an out-of-office subject line. It is the cheap
80 percent, not a solution. A false positive costs one skipped reply; a false
negative stamps `replied_at` off an out-of-office and removes the prospect from
the queue, which is the worse error.

### 9.2 The queue can no longer be re-armed on somebody who answered

**F2.** The forward-only stamp is per column, so an outbound touch older than a
logged reply but newer than `last_contacted_at` counted as applied and
scheduled a follow-up. The reviewer reproduced it against production inside a
rolled-back transaction: `replied_at = 2026-08-19`, backfill dated 08-18,
`next_action_at` came back 2026-08-25. `nextActionAtFor()` now takes
`repliedAtIso` (both callers already select `replied_at`) and returns
`{ skip: true }` for an outbound touch at or before it.

**Behaviour a human must know:** the touch is still written to
`prospect_touches` in full. Only the derived schedule is left alone, and it is
`skip`, not `null`, so a date a human deliberately set on a prospect who
replied survives. An outbound touch dated AFTER the reply still schedules
normally. An unparseable `replied_at` fails closed (no schedule).

The review's second half of F2, `isActionableNow()` in
`src/pages/Prospects.tsx`, is **not closed**: that file is `bg-app`'s scope.

### 9.3 The resolver only fetches two hosts, and checks where they resolve to

**F7 and F5.** `fetchPage()` used `redirect: 'follow'` with no check on the
destination. Redirects are now followed BY HAND, at most three hops, and every
hop including the first goes through `checkFetchTarget()` in
`_contact_routes.js`: http or https only, the prospect's own domain or
`play.google.com` only, resolving entirely to public addresses only. An IP
literal in `prospects.domain` no longer parses as a domain at all.

**Behaviour a human must know, and it is visible in the UI.** A prospect site
that redirects off its own domain now produces an entry in that result's
`errors` array reading, for example:

```
https://runsensible.com/contact: refused: refused host rocketreach.co: not the
prospect's own domain (runsensible.com) or play.google.com
```

and no candidate from that page. Before, the resolver followed the redirect and
recorded the foreign URL as `source_url`. Other refusal shapes are
`refused: refused scheme ftp`, `refused: refused host x: resolves to non-public
address 169.254.169.254`, `refused: dns lookup failed for x`, and
`refused: more than 3 redirects`. **A company that has genuinely moved to a
different registrable domain will now report refusals rather than an address.**
That is a true statement about what the resolver is allowed to read, and the
fix is to correct `prospects.domain`, not to widen the guard.

Known limit, stated rather than hidden: resolving the host and then handing the
URL to `fetch()` leaves a DNS rebinding gap that only a socket-pinning agent
would close. The guard raises the attack from "302 to the metadata address" to
"control authoritative DNS for a host on the prospect's own domain and win a
race".

### 9.4 The poller's own accounting

**F12.** The message-id loop used to stop collecting once it had
`MAX_MESSAGES_PER_RUN` ids, BEFORE the already-logged dedupe, so a busy first
chunk starved addresses 26 and up on every run forever. Every chunk now runs,
the dedupe runs, and the cap applies to what is left. A per-hour rotation
offset stops messages that are never logged (an unmatched sender comes back on
every run) from permanently occupying the front of the queue.

**F11.** `job_runs.ok` was `true` for a run that stopped on its time budget,
which is the narrower version of the `ping-sitemap` blur `CLAUDE.md` already
criticises. A partial run is now `ok = false`, and `detail` carries
`complete`, `skipped_time_budget` and `deferred_over_cap`.

**EXPECT SOME `ok = false` ROWS ONCE THIS IS SCHEDULED** if the mailbox is
busy. Read `complete` and `errors` to tell a partial run from a broken one:
`errors: []` with `complete: false` is a run that simply had more mail than one
invocation, and the next hourly run continues it.

### 9.5 What did NOT change

- No schema change, no migration, no RLS change, no new environment variable.
- No Stripe, plan or entitlement code was touched.
- No model call was added or removed anywhere, so the cost per collection run
  is unchanged and the poller's per-run cost is unchanged (Gmail API calls
  only, no LLM).
- The deployment order in 7.1 stands exactly as written: set the four `GMAIL_*`
  variables, THEN deploy, THEN schedule in `pg_cron` at minute 20.
- `promote` still writes a candidate's value verbatim with no format
  validation (F14), and candidate id 10 is still the open data question (F13).
  Both are outside this packet.
