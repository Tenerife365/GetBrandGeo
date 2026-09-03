# Packet 021: reply handling, parts A and B

**From:** `bg-backend` (session)
**To:** `bg-verify`, Opus
**Date:** 2026-08-20
**State:** READY
**Mandatory:** yes. This refactors the write path that stamps a customer-facing
record, adds a new scheduled endpoint that holds a Google credential, and two
production migrations are already applied.

**Run this together with packet `020`, not after it.** `020` reviews the
contact route resolver and the promotion path, which are already live in
production and still unreviewed (its first agent stopped mid-run and wrote
nothing). This packet changes the same file. One review of the state that will
actually ship beats two reviews of a moving one.

## What changed

Design: `docs/arch/reply-handling.md`. Constantin's decisions, 2026-08-20:
automatic Gmail polling, cadence +4 days then +7 days then stop at 3 outbound
touches.

| File | State |
|---|---|
| `netlify/functions/_touches.js` | NEW. `recordTouch()`, the single write path. |
| `netlify/functions/prospects-admin.js` | `touch` handler now only maps `recordTouch`'s outcome onto HTTP. Three functions moved out. |
| `netlify/functions/poll-inbound-replies.js` | NEW, cron-gated, reads Gmail. |
| `netlify.toml` | New `poll-inbound-replies` timeout entry. |
| `db/supabase-prospect-touches-external-id-2026-08-20.sql` | APPLIED to production. |
| `db/supabase-prospect-channels-migration.sql` | Base DDL amended so a fresh apply matches. |
| `tests/touches_record.test.js` | NEW, 20 assertions. |
| `tests/prospects_admin_whitelist.test.js` | 63 to 76 assertions. |

Also applied to production: a backfill setting `next_action_at` on the 13
already-contacted prospects.

## The claims to attack

Ranked by what it would cost to be wrong.

1. **The extraction changed no behaviour.** `recordTouch()` was moved out of
   `prospects-admin.js` verbatim. Diff the old inline logic against the new
   function and prove the retry_of path, the FK 404, the forward-only stamp,
   the 0-row refetch and the structured `touch_id` on failure all behave
   identically. `tests/touches_record.test.js` uses a scripted fake, not a
   database, so it proves control flow and nothing about Postgres.
2. **The backfill guard actually holds.** The rule is "write `next_action_at`
   only when the stamp UPDATE applied". Attack it: is there any ordering of
   touches where a backfill still reschedules, or where a legitimate touch
   fails to schedule? Prove it against a real transaction you roll back, the
   way S8 was proven.
3. **A count failure cannot clear a live schedule.** If the outbound count
   query errors, the code skips rather than falling through to
   `FOLLOW_UP_STEPS_DAYS[-1]`, which is `undefined`, which would resolve to
   `null` and wipe the date. Confirm there is no other path to that.
4. **`skip` and `value: null` never collapse.** A terminal prospect must keep
   a date a human set. An exhausted sequence must lose its date.
5. **The poller cannot send, cannot modify mail, and cannot write a stage.**
   Scope is `gmail.readonly`. Read it adversarially for anything that mutates a
   message, and confirm nothing in this change set can set `stage`.
6. **Autoresponder detection.** `isAutomated()` gates on `Auto-Submitted`,
   `Precedence` and two `X-Auto*` headers. An out-of-office logged as a reply
   clears `next_action_at` and silently removes a prospect from the queue,
   which is worse than no automation. Try to defeat it.
7. **Sender matching cannot misattribute.** `parseFromAddress()` plus the
   `byAddress` map. Can a crafted From header attribute a reply to the wrong
   prospect? Note Gmail's `from:` operator matches more loosely than an exact
   compare, which is why there is a second exact check.
8. **The timeout arithmetic.** `timeout = 26` platform, 40 messages per run,
   22s invocation budget, and a run that stops early reports
   `skipped_time_budget` rather than looking like "nobody replied". Check it
   holds and that `job_runs.ok` is false whenever any API error occurred.
9. **The migration is safe.** `external_id` nullable, unique index partial on
   `where external_id is not null`. Confirm the 14 pre-existing rows and every
   future manual touch are unaffected, and that RLS on `prospect_touches` is
   unchanged.

## Known gaps, stated rather than hidden

- **The poller has never run.** No `GMAIL_*` env var exists, so it fails closed
  with 503. It is not deployed and deliberately not yet scheduled (design 7.1).
  Nothing here is proven against real Gmail.
- **The mailbox is TalentWeLove's.** `constantin@getbrandgeo.com` is a send-as
  alias, so a read-only scope reaches unrelated company mail. Constantin has
  been told and has not yet ruled.
- **Email only.** 6 of 14 outbound touches. LinkedIn and X stay manual.
- **Role-inbox replies and bounces are both invisible** to sender matching.
  Stated in the design, not fixed.
- **A human and the poller can double-log one reply.** The human row has a null
  `external_id` so the partial index does not catch it.
- **The adminOnly branch is still unproven live**, same caveat as every admin
  function in this project.

## Do not

- Do not edit the code you are reviewing.
- Do not run `git`.
- Do not promote a candidate, write to `public.prospects`, or set any
  `verified` flag outside a transaction you roll back.
- Do not schedule the `pg_cron` job.
