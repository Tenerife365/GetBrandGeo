VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 0 medium, 1 low, 3 info)

# Multi-location fix round: server and database re-review

Reviewer: bg-verify (Opus), read only. Date: 2026-11-13. Lane: server and database.
Subject: the fix round on the uncommitted multi-location build, against `docs/qa/multi-location-review-server-2026-11-13.md` (L1 to L4, I1, I3) and the test asked for in `docs/qa/multi-location-review-regression-2026-11-13.md` R9.

No git, tsc, build, dev server or browser was run. Judged by reading the current files. Files read in full: `netlify/functions/_enqueue.js`, `schedule-collections.js`, `client-locations.js`, `db/supabase-client-locations-2026-11-13.sql`, `tests/enqueue_locations.test.js`, `tests/phase2_schedule_worker_trigger.test.js`. Read in part: `tests/client_locations_endpoint.test.js` (add section, lines 155 to 200), `_locations.js` (limits and loaders), `enqueue-collection.js:90-125`, `explee-import-background.js:1148-1176`, `collection-worker-background.js` (MAX_ATTEMPTS), the three collectors' prompt lookup line, `_auth.js` `checkCollectionLimits`, `db/supabase-prompts-delete-admin-only-2026-11-09.sql` (grants), `db/supabase-client-events-invite-resent-2026-11-11.sql` (the ten type values).

Tests run here, from `brandgeo-dashboard`, one at a time, all exit 0, no crash:

```
node tests/enqueue_locations.test.js               -> enqueue_locations: 19 passed, 0 failed   (16 at the first review)
node tests/phase2_schedule_worker_trigger.test.js  -> 14 passed, 0 failed                      (11 before)
node tests/client_locations_endpoint.test.js       -> client_locations_endpoint: 29 passed, 0 failed (28 before)
node tests/enqueue_history.test.js                 -> PASS: 24 assertions
node tests/refresh_cadence.test.js                 -> 17 assertions passed.
```

## 1. Earlier findings

| Id | State | Proof |
|---|---|---|
| L1 | CLOSED | `_enqueue.js:150-155` returns `transient: true` on a failed `client_locations` read, before the monthly cap read (`:170`), the replace delete (`:188-202`), the run insert (`:246`) and the job insert (`:274`). `schedule-collections.js:200-204` skips the stamp and `continue`s; the stamp at `:208` is reached by every other outcome as before. Details in 2.1. |
| L2 | CLOSED | FK read-back `sql:336-338`, index read-back `sql:339-344`, routine expectation corrected with the owner row explained plus a zero-row filter `sql:328-335`. A neighbouring read-back line has the same defect class, see N1. |
| L3 | CLOSED | `set local lock_timeout = '5s'` is the first statement after `begin;` (`sql:87-88`); pre-check P5 (`sql:78-81`) reads running jobs before the apply. |
| L4 | CLOSED | `client-locations.js:37-44` now says step 7 adds `location_change` in the same transaction and that a refused audit insert after the apply is a real fault. |
| I1 | CLOSED | `sql:16-34` matches the code: collectors answer 500 "Prompt lookup failed" before any engine call (`collect-prompt.js:100`, `collect-claude.js:85`, `collect-chatgpt.js:85`); `_enqueue.js:114-121` ignores the prompts read error and answers "no active prompts", which `schedule-collections.js:208-212` stamps; the worker retries to `MAX_ATTEMPTS` 3 (`collection-worker-background.js:35, 124`). |
| I3 | CLOSED | `client-locations.js:279-282`: `limit_override: live.used > limit`. See 2.3. |
| R9 test | CLOSED | `tests/enqueue_locations.test.js:188-207`: a client with a `.de` website and a `WW / ALL` primary gets a job with `Worldwide` and no region, and `buildSystemContext` returns the language instruction alone (no "Germany", no "based in"). It seeds the row the trigger would create; the trigger itself is database code, covered by probe Q1. |
| I4, I5 | Accepted, unchanged | `client-locations.js:146-149` still answers `fail(null, ...)` before auth, as recorded. |

## 2. The attack points

### 2.1 L1, the scheduler

- Money: a transient refusal happens after `checkCollectionLimits` (read only: `clients`, `prompts`, `ai_results`) and inside `_enqueue.js` after three reads (client, prompts, locations). No job, run or delete exists before `_enqueue.js:152`. A client whose location read fails every hour is re-read every hour (about six reads) and never billed. No loop inside one invocation: the `continue` moves to the next client.
- Stamp: only `last_refresh_at` is skipped. Budget skip, no-work skip and enqueue paths are unchanged (`schedule-collections.js:169-173, 208-217`). The worker kick at `:222` still runs once per invocation.
- Other callers of `enqueueClientCollection` (grep over `netlify/functions` and `src`: three callers):
  - `enqueue-collection.js:101-113` reads only `skipped` and `reason`; a transient refusal answers 200 `skipped: true, reason: 'location read failed'`, exactly as before the fix. The extra key is not forwarded and nothing breaks.
  - `explee-import-background.js:1156-1157`: anything without `runId` becomes `enqueue_failed`, and `retryCollections` (`:1163-1176`) retries up to `MAX_ATTEMPTS`. Copes.
  - `schedule-collections.js:175`. No onboard path calls it (`onboard-client.js` and `_provision_client.js` do not appear in the grep).
- Do the tests fail without the fix: yes, by reading. Without the `_enqueue.js` return change, `enqueue_locations.test.js:165` and `:178` (`r.transient === true`) fail. Without the scheduler branch, `phase2_schedule_worker_trigger.test.js:243` (stamp stays null) and `:245` (`skippedTransient` is 1, would be undefined) fail. `:262-269` pins that a non-transient skip is still stamped. The scheduler tests stub `_enqueue.js`, so the two halves are joined only by the literal key `transient`; a rename on one side breaks one of the two suites, so the coupling is guarded.

### 2.2 `_enqueue.js`, anything beyond the one return

No diff was available. By line offsets against the first review's citations: replace default `86-88` is now `90-92` (+4), the refusal `142-147` is now `150-155` (+8), the delete `180-194` is now `188-202` (+8), run insert `243` is `251`, jobs insert `270` is `278` (+8). The +4 sits in the doc comment (`:62-67`, the `transient` paragraph) and the next +4 in the step 4 comment (`:144-149`). Every executable line I compared reads as the first review describes it. The only executable change is `transient: true` on `:154`.

### 2.3 I3, `limit_override`

`limit` comes from `locationLimitFor(plan)` (`_locations.js:52-57`), never null: unknown or missing plan gives 1. `live.used` is the live count after the add.
- One below the limit after the add (used 2, limit 3): false. Correct.
- Exactly at the limit (used 3, limit 3): false. Correct, a viewer may also reach the limit (`sql:217` refuses only `v_used + v_new > p_limit`). Tested at `client_locations_endpoint.test.js:189-197` (that test is titled "within the limit" but sits exactly at it).
- One above (used 4, limit 3): true. Tested at `:177-187` (used 5).
- Plan read fails: `readPlan` error answers 500 at `:238-243` before the RPC; nothing is added, no event. Plan null or unknown: limit 1, so an admin's second location records `true`, which matches what a viewer of that client would be refused.
- `limit_override` and `over_limit` now always carry the same value. Harmless; one could be dropped later.

### 2.4 The migration file, top to bottom

- One transaction: `begin;` at `:87`, `commit;` at `:304`, nothing executable outside it (pre-checks, read-back and rollback are comments).
- `lock_timeout` is the statement right after `begin;`.
- Steps 1 to 7 intact and in the order the first review approved: table, resolver, column, backfill, NOT NULL, FK, index, column grant, trigger after the backfill, RPCs, revokes and grants, stamp columns, audit type.
- Second run, by reading: table, indexes and columns `if not exists`; functions `create or replace` with unchanged signatures and return types; policy and trigger dropped and recreated; FK under the `pg_constraint` guard; backfill touches only null rows (zero after run 1); `set not null` on an already NOT NULL column is a no-op; grants and revokes repeat cleanly; step 7 lists `location_change`, so existing rows still validate. Still never executed live a second time (probe Q1).
- Ten type values in step 7 equal the list in `db/supabase-client-events-invite-resent-2026-11-11.sql:32-43`, plus `location_change`.
- Pre-checks P1 to P5 are valid SQL as written.
- Read-back: every catalog and column name exists in PostgreSQL 17 (`information_schema.columns`, `pg_policies.policyname/cmd/qual`, `information_schema.column_privileges`, `pg_trigger.tgrelid/tgisinternal`, `pg_proc.prosecdef/proconfig`, `information_schema.routine_privileges.routine_name/grantee`, `pg_constraint.conrelid/conname` with `pg_get_constraintdef(oid)`, `pg_indexes.schemaname/tablename/indexname/indexdef`, `information_schema.role_table_grants`). `information_schema` spells the public grantee `PUBLIC`, so the zero-row filter at `:333-335` is right. Two expectations will not match what the owner sees, N1.
- Rollback block: order is sound (trigger, functions that reference the table type, column grant, FK, column, resolver, stamp columns, table). Step 7 rollback is separate and guarded by a count. Accurate.

## 3. New findings

### N1 LOW: two read-back expectations omit rows PostgreSQL will print

- Owner: bg-backend.
- Where: `db/supabase-client-locations-2026-11-13.sql:321-323` and `:345-347`.
- Scenario 1: `information_schema.column_privileges` lists a table-level grant once per column for SELECT, INSERT, UPDATE and REFERENCES. `db/supabase-prompts-delete-admin-only-2026-11-09.sql:107-118` revoked only table-level UPDATE and INSERT from `authenticated` on `prompts`, so the table-level SELECT (and, with the Supabase default grants, REFERENCES) remains. The query will print a SELECT row and a REFERENCES row for every `prompts` column, including `location_id`, next to the expected INSERT and UPDATE lists. The owner, reading "INSERT: ...; UPDATE: ...", sees about twenty unexpected rows and either stops the apply or learns to skim the read-back. This is the same class as L2 scenario 2, on the neighbouring line.
- Scenario 2: `role_table_grants` for `client_locations` will also list the owner role's own privileges (after the explicit grants the ACL carries the owner entry). The expectation names authenticated and service_role only.
- Fix: add `and privilege_type in ('INSERT', 'UPDATE')` to the `column_privileges` query (the 2026-11-09 file filters the same way); on `role_table_grants`, say the owner role's rows are expected, or filter `grantee in ('anon', 'authenticated')` and EXPECT exactly `authenticated SELECT`.

### N2 INFO: a transient refusal that repeats is invisible to the watchdog

- Owner: bg-backend.
- Where: `schedule-collections.js:227` writes `ok: true` whatever `skippedTransient` is.
- Scenario: the location read fails every hour for one client (a lost grant on `service_role`, a broken read path). Before the fix the client lost one cycle per cadence; now it is retried every hour, never collected and never stamped, and `job_runs` reads `ok = true` each time, so the watchdog never alerts. No money is spent, so this is visibility only.
- Fix, optional: record `ok: false` when `skippedTransient > 0`, or add a watch expectation on `detail.skippedTransient`.

### N3 INFO: the client and prompts reads still turn a read error into a stamped skip

- Owner: bg-backend. Pre-existing, not introduced by the fix.
- Where: `_enqueue.js:95-100` (a client read error answers "client not found") and `:114-121` (a prompts read error answers "no active prompts"); both are stamped by `schedule-collections.js:208`.
- Scenario: the same transient database error that L1 now retries for `client_locations` hits the prompts read one statement earlier; the client loses its whole cycle with `ok = true`. This is also the path I1 describes for a deploy before the migration.
- Fix, optional: read `error` on both selects and return `transient: true` for a read error, keeping "no active prompts" for a real empty set.

### N4 INFO: the I3 tests cover at and above the limit, not one below or an unknown plan

- Owner: bg-backend.
- Where: `tests/client_locations_endpoint.test.js:177-197`.
- The code is right for both missing cases by reading (2.3). Optional: one check for an admin add on a client with an unknown plan (limit 1).

## 4. Probes for the orchestrator (each in a block that ends in rollback)

Q1, the final file twice, with its corrected read-back (closes the never-rehearsed second run; supersedes P1 of the first review). Paste the statements of `sql:88-302` twice between the markers:

```sql
begin;
-- [file lines 88 to 302, run 1]
-- [file lines 88 to 302, run 2: must finish with no error]
select count(*) from public.prompts where location_id is null;                 -- EXPECT 0
select conname, pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.prompts'::regclass and conname = 'prompts_location_fk';
   -- EXPECT FOREIGN KEY (location_id, client_id) REFERENCES client_locations(id, client_id)
select indexname from pg_indexes where schemaname = 'public' and tablename = 'client_locations' order by 1;
   -- EXPECT 5 rows
select routine_name, grantee from information_schema.routine_privileges
 where routine_name like '%client_location%' and grantee in ('anon', 'authenticated', 'PUBLIC');  -- EXPECT 0
select privilege_type, column_name from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'prompts' and grantee = 'authenticated'
 order by 1, 2;   -- read the output against N1: SELECT and REFERENCES rows expected beside INSERT and UPDATE
-- R9 trigger half: a client defaulting to WW with no region gets WW / ALL
select market_id, region_id from public.client_locations
 where is_primary and archived_at is null
   and client_id = (select id from public.clients where default_market_id = 'WW' and default_region_id is null limit 1);
   -- EXPECT WW, ALL (no row means no such client exists; then skip)
rollback;
```

Q2, before the real apply: P5 of the file, plus `select pid, state, xact_start, left(query, 80) from pg_stat_activity where state <> 'idle' and xact_start < now() - interval '5 seconds';` EXPECT no long transaction.

## 5. Not checked

- No diff of any file: "unchanged" statements rest on line offsets and reading.
- No database call of any kind; Q1 and Q2 are for the orchestrator. Live `proacl`, live grants on `prompts`, the second run and the trigger's WW / ALL result are unproven.
- No concurrency (two sessions).
- `collection-worker-background.js`, `_collect.js`, the collectors and `mcp-server.js` were not re-read beyond the lines cited; the fix round did not list them in this lane.
- The frontend's handling of `reason: 'location read failed'` on a manual run (bg-app lane).
- Tests other than the five above; the 65-file pass, tsc and build are the orchestrator's.
