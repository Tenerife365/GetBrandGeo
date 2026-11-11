# Explee lead import: orchestrator record, 2026-11-11

Written from the orchestrator seat. It is not a review. It records what was
run from this seat on the final state of the build, the migration rehearsal,
and what nobody has checked. The reviews are the eight `bg-verify` reports
named in section 1.

State when sections 1 to 6 were written: nothing committed, nothing
deployed, the migration NOT applied, no cron job, no Explee write of any
kind. Section 7 records the migration, applied afterwards on the owner's go.

## 1. The chain

| Step | Agent | Output | Verdict |
|---|---|---|---|
| Spec, revision 1 | bg-architect | `docs/arch/explee-lead-import.md` | |
| Spec review, abuse lens | bg-verify | `explee-lead-import-spec-review-abuse-2026-11-11.md` | SOUND WITH CHANGES (M1 to M7) |
| Spec review, ops lens | bg-verify | `explee-lead-import-spec-review-ops-2026-11-11.md` | SOUND WITH CHANGES (M1 to M9) |
| Spec, revision 2, then build | bg-architect, bg-backend | 13 files of spec section 11 | |
| Build review, auth lens | bg-verify | `explee-lead-import-build-review-auth-2026-11-11.md` | PASS WITH FINDINGS (2 MEDIUM, 3 LOW) |
| Build review, ops lens | bg-verify | `explee-lead-import-build-review-ops-2026-11-11.md` | PASS WITH FINDINGS (4 MEDIUM, 7 LOW) |
| Spec, revision 3, then fix round 1 | bg-architect, bg-backend | | |
| Re-review 1, auth lens | bg-verify | `explee-lead-import-fix-rereview-auth-2026-11-11.md` | PASS WITH FINDINGS, round 1 all closed, 1 new MEDIUM, 3 LOW |
| Re-review 1, ops lens | bg-verify | `explee-lead-import-fix-rereview-ops-2026-11-11.md` | PASS WITH FINDINGS, round 1 all closed, 2 new LOW |
| Spec, revision 4, then fix round 2 | bg-architect, bg-backend | | |
| Re-review 2, auth lens | bg-verify | `explee-lead-import-fix-rereview2-auth-2026-11-11.md` | PASS WITH FINDINGS, all closed, 2 INFO |
| Re-review 2, ops lens | bg-verify | `explee-lead-import-fix-rereview2-ops-2026-11-11.md` | PASS WITH FINDINGS, all closed, 3 INFO |

Both lenses of re-review 2 state: nothing blocks a dry-run ship with the cron
off, and nothing they found blocks a later switch to live. The second
statement covers their lens only; the preconditions of spec D13 step 8 still
apply.

Fix round 1 was cut off once when the desktop app restarted. It was resumed;
the restarted builder audited the partial work before finishing it, and both
re-reviews ran on the finished state.

## 2. Run from this seat on the final state

All figures are from runs that exited 0. Node crashed on several attempts on
this machine on 2026-11-11 (segmentation faults and random parse errors
inside `node_modules`), the same command passing on a retry.

- Every node test file, one at a time: 57 of 57 files pass.
- `explee_rules` 155 passed, `explee_import` 111 passed, `provision_client`
  51 passed, `refresh_cadence` 17 assertions passed.
- `tsc --noEmit` exit 0. `npm run build` exit 0, entry chunk 580.20 kB. No
  file under `src/` belongs to this build; the 0.07 kB over the previous
  build comes from another session's uncommitted page work.
- Dash scan with a positive control: no em or en dash in the untracked
  files of this change or in the added lines of the 4 modified tracked files.
- Address scan: only `.example` fixtures, the deliberate variant on
  `.examplex`, and invented local parts on our own two domains (the exception
  recorded in spec criteria 22 and 59). No key-shaped string. No lead or
  customer name.

## 3. Migration rehearsal against production

Part A of `db/supabase-explee-lead-import-2026-11-11.sql` (the lines from the
first `create table` to the watchdog insert) was executed inside one
`do` block that ends in `raise exception`, so the whole block is a single
statement that cannot commit. The text run was fingerprinted inside the
block and matches the file (md5 of the whitespace-normalised text
`27441e304ed5a4954163e3c3dba0057e`, 6,822 characters, the same value
computed locally from the file). Read after the block: 0 Explee tables, 0
Explee indexes, no `explee-import` watchdog row. Nothing persisted.

Before the rehearsal, read-only: neither table existed,
`ops.watch_expectations` has the six columns the insert names with `job` as
primary key, `public.is_admin()` exists, `clients.id` is integer, the vault
holds one `cron_secret`, and no cron job uses minute 35 of every hour
(jobs 1, 4 to 11 are unchanged).

Results inside the block:

| Check | Result |
|---|---|
| Part A applied once, then a second time | both ok (idempotent) |
| RLS on both tables | on |
| Policies | two, both SELECT only |
| Settings row | 1 row, mode `dry_run`, `project_ids` empty, follow-up off |
| Watchdog row | 1 row, disabled |
| Cron jobs named for the import | 0 |
| `authenticated` table privileges | SELECT only on both tables |
| `anon` table privileges | none |
| `service_role` | can insert leads and update settings |
| As role `authenticated` with no admin identity | sees 0 lead rows and 0 settings rows; insert and settings update refused (42501) |
| As role `anon` | select and insert refused (42501) |
| `creating` without identity fields | refused by CHECK |
| Second `creating` row with the same address hash | refused by the unique index |
| Second `creating` row with the same brand domain | refused by the unique index |
| `created` without an account time | refused by CHECK |
| `attempts_total` 11 | refused by CHECK |
| Lower-case country | refused by CHECK |
| A created, erased row with a null address and status `skipped_label` | accepted |
| A skipped row that keeps the same address hash | accepted |

This covers spec criteria 25 and 33 as far as a rolled-back run can. It is
not the migration: applying it is the owner's step.

## 4. Changes made from this seat

- `explee-lead-import-spec-review-abuse-2026-11-11.md`: one invented example
  address on a real free-mail domain was moved to `freemail.example`. Nothing
  else in any reviewer's text was changed.
- No source file of the build was edited from this seat.

## 5. Open, none blocking a dry-run ship

To rule before the switch to live (spec D13 step 8):

- Re-review 2 auth N-1: a pending login that somebody else creates in the
  five seconds before the invite, after the last check, with no profile yet,
  is treated as ours; a later failure of our own would delete it. Needs a
  self-signup in those seconds plus a database failure. The architect either
  accepts it under Q15 or rules that a post-invite rollback never deletes a
  login older than the invite.
- Q3 and Q4: the invite text and whether the follow-up is switched on.
- Q11: whether creation pauses by itself after two runs that each end in a
  post-invite failure.

Recorded only:

- Re-review 2 auth N-2: a function clock more than five seconds ahead of the
  auth server makes every new login "not ours". Watch `not_ours` in
  `job_runs` after the switch.
- Re-review 2 ops N9, N10, N11: an alert email after a slow provisioning call
  can start past 13 minutes; our own sent messages count as activity for a
  hidden conversation; one test accepts either of two reasons.
- Q12, Q13, Q14: alert wording, the 20 page ceiling of the login listing,
  the whole-thread scope of the follow-up label rule.
- Q10: an alias or name whose separator-collapsed form is an ordinary word
  matches that word in any text. Not solved.
- `resend-invite.js` (another session's file) ends its paged login listing on
  a short page, the assumption this build removed from its own helper.

## 6. Not checked by anyone

- The real Explee account in dry-run mode: item order during paging,
  `has_more` and `next_offset`, the shape of an erased item, label names
  beyond the six seen on 2026-11-11.
- The real auth server: the answer of an invite for an existing unconfirmed
  login, the `created_at` it stamps, its page size, the hourly email limit.
- Real prompt generation in the Japanese, Korean, Thai and Chinese markets.
- The admin wizard on the deployed site after this change (create and delete
  one test client, spec D13 step 4). The wizard now makes two login listing
  passes per submit and puts the account name first among the aliases.
- The real 15 minute limit of a background function.

## 7. Migration applied, 2026-11-11 15:24 UTC

On the owner's "Yes, start rollout", Part A was applied to production
(`duiyifepitvugyulobqm`) as migration `explee_lead_import_2026_11_11`
(version 20261111152426), the same text as the rehearsal. Part B (the cron
job) was not run.

Read back after applying: RLS on for both tables; two SELECT-only policies;
one settings row with mode `dry_run`, `project_ids` empty and the follow-up
off; 0 lead rows; 49 columns and 6 indexes on `explee_leads`; the watchdog
row present and disabled; `authenticated` has no insert, update, delete or
truncate on either table; `anon` cannot select either table; 0 cron jobs
named for the import.

