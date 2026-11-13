VERDICT: PASS WITH FINDINGS (0 blocker, 0 major, 0 medium, 4 low, 5 info)

# Multi-location feature: server and database review

Reviewer: bg-verify (Opus), read only. Date: 2026-11-13. Lens: server and database, security and money.
Inputs read: `docs/arch/multi-location-collection.md` (all 750 lines, including section 16), `docs/qa/multi-location-orchestrator-record-2026-11-13.md`, and the working files listed below. The UI design document was not read: it is outside this lens.

No git command was run, so nothing here is a diff. Every statement about "unchanged" behaviour is from reading the current working file against the spec and the old behaviour the spec and the file comments describe.

Files read in full: `db/supabase-client-locations-2026-11-13.sql`, `netlify/functions/client-locations.js`, `_locations.js`, `_enqueue.js`, `enqueue-collection.js`, `_provision_client.js`, `onboard-client.js`, `collect-prompt.js`, `collection-worker-background.js`.
Read in the relevant parts: `_collect.js` (lines 30 to 99, 740 to 805, 995 to 1174), `collect-chatgpt.js` (lines 200 to 299), `collect-claude.js` (every location line by grep), `mcp-server.js` (lines 405 to 505 plus every location line by grep), `_geo_signals.js` (location lines), `_country_names.js` (exports), `_auth.js` (requireAuth ownership block), `schedule-collections.js` (lines 160 to 218), `explee-import-background.js` (provision call and failure mapping), `_explee_rules.js` (resolveMarket, FREE_PROMPT_COUNT), `db/supabase-prompt-cap-bypass-fix-2026-11-09.sql` (lines 60 to 130), `db/supabase-multitenant-migration.sql` (ai_results policies).

Tests run by this reviewer (node, from `brandgeo-dashboard`, one at a time, all exit 0): `ts_require_bundler` 5 of 5, `client_locations_endpoint` 28 of 28, `provision_locations` 30 of 30.

## 1. Findings

### L1 LOW: a transient location read failure on a scheduled run silently skips the client's whole cycle

- Owner: bg-backend.
- Where: `brandgeo-dashboard/netlify/functions/_enqueue.js:142-147` returns `{ skipped: true, reason: 'location read failed' }`; `brandgeo-dashboard/netlify/functions/schedule-collections.js:196-202` stamps `last_refresh_at` for every non-budget outcome and counts it as `skippedNoWork`; `recordJobRun` then writes `ok: true`.
- Scenario: a weekly Growth client is due at the hourly :10 run. The `client_locations` read returns a PostgREST error (timeout, pool exhaustion). `_enqueue.js` refuses the run, correctly, before any delete or write. The scheduler stamps `last_refresh_at = now()`, so `isDue` is false for the next seven days. The client loses one week of trend data. `job_runs` reads `ok = true`, so the watchdog sees nothing.
- Why LOW and not higher: the same pattern already exists for `run insert failed` and `jobs insert failed` (`_enqueue.js:243, 270`), and the read is one indexed query right after the prompts read. This change adds one more transient path into an existing hole; it does not create the hole. The refusal itself is the right call: it never runs a prompt at a wrong location and never runs twice.
- Fix: return a distinguishable marker from `_enqueue.js` for a transient read failure (for example `transient: true` beside the reason) and have `schedule-collections.js` treat it like the budget skip, without stamping, so the next hour retries. `schedule-collections.js` is outside this change's write scope, so this needs its own small packet; alternatively retry the read once inside `_enqueue.js`.

### L2 LOW: the migration read-back set cannot prove the foreign key, and one expectation will not match

- Owner: bg-backend.
- Where: `db/supabase-client-locations-2026-11-13.sql:291-316` (read-back) against `:143-149` (FK added under a guard that checks `conname` only, not the table) and `:309-310`.
- Scenario 1: nothing in the read-back reads `prompts_location_fk` or the two unique indexes. "Prompt and location on different clients = 0" (`:299-300`) proves today's data, not the constraint. Without the FK, the trigger is the only cross-client guard, and the trigger returns early for an inactive row (`:166`), so a viewer could insert an inactive prompt carrying another client's `location_id`. The rehearsal proved the FK was created then; the owner's read-back on the real apply does not.
- Scenario 2: `select routine_name, grantee from information_schema.routine_privileges where routine_name like '%client_location%'` is annotated "service_role only". After `revoke all ... from public` and an explicit grant, PostgreSQL materialises the owner's own EXECUTE in `proacl`, so the owner role also appears as a grantee. The owner, reading "service_role only", will see an extra row and either stop the apply or learn to ignore the read-back.
- Fix: add `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.prompts'::regclass and conname = 'prompts_location_fk';` (EXPECT `FOREIGN KEY (location_id, client_id) REFERENCES client_locations(id, client_id)`) and `select indexname, indexdef from pg_indexes where tablename = 'client_locations';` (EXPECT the two partial unique indexes); change the routine expectation to "service_role and the owner, no anon, no authenticated, no PUBLIC", or filter `grantee in ('anon','authenticated','PUBLIC')` and EXPECT 0 rows.

### L3 LOW: no lock timeout in the migration, and it holds ACCESS EXCLUSIVE on four hot tables for the whole transaction

- Owner: bg-backend.
- Where: `db/supabase-client-locations-2026-11-13.sql:69` (`begin;` with no `set local lock_timeout`); the transaction alters `prompts` (`:129, :141, :145`), `collection_jobs` and `ai_results` (`:255-259`), and rebuilds the `client_events` check (`:268-283`).
- Scenario: the owner applies while a worker invocation is upserting into `ai_results` or the dashboard holds a long read. The `alter table public.ai_results` waits for that lock; every later dashboard read of `ai_results` and `prompts` queues behind the waiting ACCESS EXCLUSIVE request, so the dashboard stalls for every user until the blocker ends. The rehearsals ran with `lock_timeout` 4 s and an idle queue; the file as handed to the owner carries neither.
- Fix: add `set local lock_timeout = '5s';` right after `begin;` and a header line: apply when `collection_jobs` has no `running` row (`select count(*) from public.collection_jobs where status = 'running';` EXPECT 0). A timeout aborts the whole transaction cleanly, and the file is idempotent, so the owner just re-runs it.

### L4 LOW: stale comment in client-locations.js about the audit type

- Owner: bg-backend.
- Where: `brandgeo-dashboard/netlify/functions/client-locations.js:37-41`.
- Scenario: the comment says the live CHECK on `client_events.type` "does not carry this value yet (see the commented optional block at the end of db/supabase-client-locations-2026-11-13.sql)". Step 7 is now inside the main transaction (`sql:261-283`), and there is no commented optional block. A later reader may think the audit row is expected to fail, and stop treating a refused audit insert in the logs as a fault.
- Fix: rewrite the comment to say step 7 of the migration adds `location_change`, and that a refused insert after the apply is a real fault.

### I1 INFO: the header's account of "deploy before migration" is wrong in detail, right in conclusion

- Owner: bg-backend.
- Where: `db/supabase-client-locations-2026-11-13.sql:16-21` and spec section 4.5.
- What the code would actually do: the three collectors select `location_id` in `loadPromptForCollect` (`collect-prompt.js:97` and copies), so they fail with 500 "Prompt lookup failed" BEFORE any engine call, not after billing. `_enqueue.js:110-117` ignores the prompts read error and answers "no active prompts", and `schedule-collections.js:198` then stamps `last_refresh_at`, so every due scheduled client silently loses its cycle. The money loss is in the worker: jobs pending from before the deploy hit an upsert with unknown columns, throw, and are retried up to `MAX_ATTEMPTS` 3 (`collection-worker-background.js:35, 124-138`), each attempt billing the engines with nothing saved.
- Fix: correct the header so the owner knows what to look for if the order is ever broken. The order rule itself stands.

### I2 INFO: which text was rehearsed cannot be matched to the final file, and parts of the final file were never rehearsed

- Owner: orchestrator (not a builder defect).
- Where: the orchestrator record section 4 says the first rehearsal ran "lines 62 to 250 as they stood at 12:10 UTC, before packet 3 added the audit type step". The file's last write time on disk is 2026-11-13 12:03:18 UTC (read by `Get-Item`), so at 12:10 the file already held step 7, and its lines 62 to 250 today do not start at `begin;` (line 69) or end after the grants (line 252). The second rehearsal tested step 7 and the effect of the new columns on two RPCs.
- Never rehearsed in its final form: the whole file as one paste with its own `begin;` and `commit;`; a second run on top of the first (the idempotency claim of `:23-26`); the read-back set; both rollback blocks (`:329-342` and `:350-357`); anything with two sessions. The record already says the final file is rehearsed again before handover; this list is what that rehearsal must cover. Probe P1 below gives it.

### I3 INFO: every admin add records `limit_override: true`

- Owner: bg-backend.
- Where: `client-locations.js:269-283`.
- The event meta sets `limit_override: true` on every admin add, including one well within the limit; `over_limit` carries the truth. Not wrong, but a reader of `client_events` counting overrides by that key will over-count. Fix, optional: set `limit_override: live.used > limit` or rename the key `admin_add`.

### I4 INFO: a malformed request is answered 400 before authentication, without CORS headers

- Owner: bg-backend.
- Where: `client-locations.js:143-147` (`fail(null, ...)`, default headers only).
- An unauthenticated caller with a bad body gets 400 instead of 401; nothing is read and nothing leaks. In a browser the missing CORS headers turn the 400 into an opaque network error. The dashboard always sends a valid body, so this is cosmetic. The test file pins the 400.

### I5 INFO: add and archive have no rate limit, and archived rows are never purged

- Owner: bg-backend (or an owner ruling).
- Where: `client-locations.js:220-308`; table `client_locations` (`sql:72-84`).
- A viewer can add and archive the same pair in a loop; each cycle leaves one archived row. No money is spent (a location costs nothing until prompts are added, and prompts stay bounded by the cap trigger), so this is table growth only. Owner question 7 already covers the related churn of archive and re-add on prompts.

## 2. Confirmed

### 2.1 Authorisation

- `client-locations.js`: the body is parsed and `client_id` validated by `parseId` (`:143-147`) before `requireAuth(event, { clientId })` (`:149`); `_auth.js:115-119` refuses a viewer whose `profile.client_id` differs (403). Every RPC call passes `p_client_id: clientId` (the authorised id) and the location id only as a second argument (`:173, :247-252, :296, :324`); the SQL functions match `(id, client_id)` (`sql:213-214, :232-233`). A viewer passing another client's location id gets `not_found` (test "IDOR" passed in my run). The plan comes from one service-key read of `clients.plan` (`:104-109, :236-242`), never the body. `set_primary` is refused for a viewer (`:311`). A viewer's limit is passed as `p_limit` and enforced inside `add_client_locations` under the per-client advisory lock (`sql:193-201`); an admin passes `null` and an event row is written (`:269-284`). `VIEWER_MAY_EDIT_LOCATIONS` is one constant (`:31`).
- `onboard-client.js`: `requireAuth(event, { adminOnly: true })` at `:80`, unchanged. In `_provision_client.js`, `planLocations` (pure, `:153-205`) and the prompt cap check (`:270-284`) both run before the clients insert (`:320`) and before Check B and the invite (`:347, :359`). Refusals return `stage: 'validate'` with no database write (test "pure refusals make no database call at all" passed).
- Rollback after the client row exists: every path reached after `:320` deletes what it created. Locations stage (`:441, :444`) and prompts stage (`:452`) call `rollbackUserAndClient(..., true)`, which deletes the profile, the auth user and the client; `client_locations` cascades from `clients` (`sql:74`). A primary created by the prompt trigger inside a failed prompts insert rolls back with that statement. A half-made account is left only when a rollback delete itself fails, and that returns `rollback_failed` with the ids, as before. One residual, pre-existing in kind: a failure at the locations or prompts stage happens after the invite email has gone out (the deleted user's link is dead); the spec's design moves every predictable refusal before the invite, which the code does.
- `enqueue-collection.js`: `effectiveForceFor` (`:30-32`) is unchanged in meaning (admin and `force === true` only); ownership check `:69-71`; `body.markets` is not destructured (`:61`) and `market: null` is passed (`:106`); `_enqueue.js:83` voids `market`.
- The three collectors: `loadPromptForCollect` adds only `location_id` to its select and returns it (`collect-prompt.js:94-107`, identical in the other two by grep); `market_label`, `region_label` and `market_id` are no longer destructured from the body (`collect-prompt.js:175`); `resolvePromptGeo` runs after the plan engine gate and before `checkCollectionLimits`, the force delete and any engine call, and a read error answers 500 `location_read_failed` (`collect-prompt.js:238-243`, `collect-chatgpt.js:227-232`, `collect-claude.js:222` onward). `effectiveForce`, `resolveEngines` and `engineAllowed` are unchanged in meaning. `ctx_geo` is built from the resolved labels only (`collect-prompt.js:339-341`).
- Pre-existing and unchanged, recorded by the spec: an admin refresh still sends the body text and body `client_config` to the engines.

### 2.2 Money

- `_collect.js`: the only new code I found is the `WORLDWIDE_NEUTRAL` branch in `buildSystemContext` (`:49-87`, it changes the system text only) and the `asked` parameter, which adds three keys to the row (`:1004-1020`, `:1093-1096`, passed through at `:1130, :1136`). `collectEngines` still calls each engine once with the same `opts` shape (`marketId`, `regionLabel`, `plan`, worker budgets) and the same timeouts (`:1103-1119`). I could not diff the engine callers against HEAD (no git allowed); see section 3.
- `_enqueue.js`: one job per prompt (`:249-264`), one run, one cooldown check; the cap query stays above the delete (`:162-173`), the delete is still `replace`-gated and excludes capped engines (`:180-194`), `replace` still defaults to `force && trigger === 'manual'` (`:86-88`), and the month skip is unchanged (`:197-214`). The new location read is a single query, before the delete and before any write; on failure the run is refused, so no run at a wrong location and no duplicate run. No new loop, retry or fan-out.
- A scheduled refresh still never deletes history: `schedule-collections.js:191` passes `replaceExisting: false` and `_enqueue.js` honours it.
- Collectors: the only addition before the engine call is one indexed read; force delete, month skip and the 30 day SerpApi cap are unchanged (`collect-prompt.js:259-309`).
- Worker: identical flow; `asked` is built from the job (`collection-worker-background.js:96-100`); the upsert conflict target is unchanged (`:109`).
- Provisioning: the server cap check counts one row per (question, location) and matches the trigger's fallback order (`_provision_client.js:232-244`); the cap trigger lets `service_role` through (`supabase-prompt-cap-bypass-fix-2026-11-09.sql:67-71`), so `allow_over_cap` is the only override and it is recorded in the event meta (`:477`).

### 2.3 Data truth

- Writers of `ai_results` (grep over `netlify/functions`, `src` and `db`): `collect-prompt.js:325`, `collect-claude.js:266`, `collect-chatgpt.js:272`, `collection-worker-background.js:107-109`. All four build rows through `collectEngines` with `asked`, and `buildResultRow` stamps ok rows and every error branch alike (`_collect.js:1016-1020` sits before the branches; timeout rows at `:1130` also pass `asked`). No other writer of `ai_results` exists in the repository.
- Worldwide neutral: `buildSystemContext` returns the language instruction alone only when `marketLabel === 'Worldwide'` and the region is absent or an "All ..." label (`_collect.js:56-65`). `COUNTRY_NAMES` has no `WW` entry (`_country_names.js:10-12`), so no country label can equal `Worldwide`; `fallbackGeo` gives a null label for `WW`, so a prompt without a location keeps the website TLD fallback.
- A prompt with no location row: `geoForPrompt` and `resolvePromptGeo` fall back to `clients.default_market_id` at country level with a null region (`_locations.js:115-135`), which is the old scheduled behaviour.
- A location archived between enqueue and the worker changes nothing: the job carries its resolved labels and ids. A job queued before the migration stamps `location_id` null plus its own `market_id` (`collection-worker-background.js:96-100`); the record's second rehearsal shows `claim_collection_jobs` returns the new columns.

### 2.4 Migration file

- Header: says NOT APPLIED (`:3`) and states the order rule (`:16-21`).
- Statement order: table, primary resolver, column, backfill, NOT NULL, FK, index, grant, then the trigger after the backfill, the RPCs, revokes and grants, the stamp columns, the audit type. Sound: the trigger does not exist while the backfill UPDATE runs, and the FK is added after every row has a location.
- Idempotency by reading: every object is `if not exists`, `create or replace`, guarded by `pg_constraint`, or dropped and recreated (policy, trigger, check); the backfill touches only null rows; step 7 lists the new value, so a re-run after a `location_change` row exists still validates. A live second run was never executed (I2).
- Trigger and race semantics: as the spec reasons. Two adds at the limit serialise on `pg_advisory_xact_lock` and the count is a fresh statement after the lock. Archive against a concurrent active insert is safe in both orders (FOR SHARE in the trigger against FOR UPDATE in archive). Set primary against a concurrent insert for a client with no primary can deadlock (S10, recorded); PostgreSQL aborts one side. None of these was run with two sessions.

### 2.5 Bundler rule

- `_locations.js` requires only `./_country_names` and `./_market_regions`; those two and `client-locations.js` require no `.ts` file (grep). `mcp-server.js:59` requires `markets.ts`, and it is esbuild bundled. `ts_require_bundler` passed (5 of 5).
- `netlify.toml`: last written 2026-11-11 15:39:15 UTC (`Get-Item`), two days before this work, and it contains no location entry. Untouched by this change.

## 3. Not checked

- No diff: `_collect.js` engine callers (`callChatGPT`, `callClaude`, `callGemini`, `callOpenRouter`, `callGoogleAiMode`), `CHATGPT_MODEL_BY_PLAN`, max token values, web search settings and `_cost.js` constants were not compared against HEAD. I read the ai_overview caller and the shared builders only. The claim "no engine caller changed" rests on the record, the spec and the file comments, not on my reading.
- No database call: nothing in sections 4.4 and 4.6 of the spec, the live `plan_prompt_caps` values (Explee provisioning now refuses when the live `free` cap is below `FREE_PROMPT_COUNT` 5 or when the cap read fails, see probe P4), `has_client_access`, live `proacl` of the new functions, live triggers.
- Concurrency of any kind (two sessions).
- `schedule-collections.js` and `delete-client.js` were not read in full; `explee-import-background.js` only around the provision call.
- The frontend: `client-locations.js` callers, Prompts page insert shape, sidebar and filter. Another lens.
- Tests other than the three I ran; the 65-file pass is the orchestrator's.
- SerpApi acceptance of continent names as `location`, the UK `gl` question.

## 4. Probes for the orchestrator (each inside a block that ends in rollback or a raised exception)

P1, the final file, twice, with its read-back (covers I2 and L2). Paste lines 72 to 283 of the final file between the two markers, twice:

```sql
begin;
set local lock_timeout = '4s';
-- [statements of steps 1 to 7, file lines 72 to 283, run 1]
-- [the same statements, run 2: must succeed with no error]
select count(*) from public.client_locations;                         -- EXPECT 66 after both runs
select count(*) from public.prompts where location_id is null;        -- EXPECT 0
select conname, pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.prompts'::regclass and conname = 'prompts_location_fk';
   -- EXPECT FOREIGN KEY (location_id, client_id) REFERENCES client_locations(id, client_id)
select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = 'client_locations';
   -- EXPECT the pkey, the id_client unique, uq_client_locations_live, uq_client_locations_primary, idx_client_locations_client
select p.proname, p.proacl from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('ensure_primary_client_location','add_client_locations','archive_client_location','set_primary_client_location','enforce_prompt_location');
   -- EXPECT the owner and service_role only on the four RPCs; no anon, authenticated or bare =X/ (PUBLIC) entry
select pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.client_events'::regclass and conname = 'client_events_type_check';  -- EXPECT eleven values
rollback;
```

P2, the delete path and the FK on `prompts.client_id`:

```sql
begin;
select conname, pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.prompts'::regclass and contype = 'f';    -- read the ON DELETE of prompts.client_id
-- after applying P1's statements, pick one client id X with prompts:
delete from public.prompts where client_id = X;                   -- the delete-client.js order
delete from public.clients where id = X;                          -- EXPECT success, client_locations cascades
rollback;
```

P3, a mixed multi-location insert as a real viewer (after P1's statements, inside the same rolled-back block), with two live locations L1 and L2 of the viewer's client X and enough free cap:

```sql
set local role authenticated;
select set_config('request.jwt.claims', '<the viewer claims json>', true);
insert into public.prompts (client_id, text, is_active, location_id)
values (X, 'probe a', true, L1), (X, 'probe b', true, L2)
returning id, location_id;                                        -- EXPECT 2 rows with L1 and L2
reset role;
```

P4, the cap the Explee import now checks before every account:

```sql
select plan, prompt_cap from public.plan_prompt_caps order by prompt_cap nulls first;
   -- EXPECT the free row at 5 or more (FREE_PROMPT_COUNT is 5); below 5 every Explee import is refused prompt_cap_exceeded
```

P5, set primary writes `ALL` into the mirror (after P1's statements, rolled back):

```sql
select public.add_client_locations(X, '[{"market_id":"DE","region_id":"ALL"}]'::jsonb, null, null);
select public.set_primary_client_location(X, (select id from public.client_locations where client_id = X and market_id = 'DE' and archived_at is null));
select default_market_id, default_region_id from public.clients where id = X;   -- EXPECT DE, ALL (was possibly null before)
```

P6, two adds at the limit (needs two SQL sessions, both against a rolled-back copy, so run only on a branch or with care): session A `begin; select public.add_client_locations(X, '[{"market_id":"DE","region_id":"ALL"}]', 2, null);` and hold; session B `begin; select public.add_client_locations(X, '[{"market_id":"FR","region_id":"ALL"}]', 2, null);` EXPECT B waits; then `commit` A (or `rollback` on a production copy); EXPECT B raises `location_limit_reached` when A committed, succeeds when A rolled back. Then roll back both.

P7, before the real apply (L3):

```sql
select count(*) from public.collection_jobs where status = 'running';                      -- EXPECT 0
select pid, state, xact_start, left(query, 80) from pg_stat_activity
 where state <> 'idle' and xact_start < now() - interval '5 seconds';                       -- EXPECT no long transaction
```
