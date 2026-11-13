BLOCK

# Multi-location collection: pre-build review of the spec

Date: 2026-11-13. Reviewer: bg-verify (packet 0 of section 12). Subject: `docs/arch/multi-location-collection.md` as on disk today.
Mode: read only. No code, no spec, no database, no git, no npm, no node run. Every claim below is from reading source under `brandgeo-dashboard/` and `db/`, plus the live database facts the orchestrator read on 2026-11-13 and handed to this run. Nothing was executed.

The verdict is BLOCK because two findings would ship a broken production function or wrong data if built as written. Both are spec edits, not redesigns. Once M1 and M2 are pasted into the spec, the build can start; nothing else found here needs to stop it.

## 1. Must fix before build

### M1. HIGH. `_locations.js` requiring `src/lib/markets.ts` breaks seven non-esbuild functions in production

Where: spec section 5.2, line 346 ("Requires `../../src/lib/markets.ts` the way `mcp-server.js:59` does").

Evidence, read in source:
- `mcp-server.js:53-60` requires six `.ts` files and works only because `netlify.toml:424-426` gives it `node_bundler = "esbuild"`. `explee-import-background` has the same entry at `netlify.toml:279-280` and requires `markets.ts` at `explee-import-background.js:142`.
- `tests/ts_require_bundler.test.js:49-62` follows every relative `require` from each endpoint through local `.js` helpers and fails any endpoint that reaches a `.ts` file without an esbuild block (`:94-97`). Its own header (`:8-11`) records that on 2026-11-11 a function in exactly this state made no database call in production. Its check at `:105-109` asserts that `onboard-client` and `schedule-collections` are NOT flagged, so this design fails the suite as written.
- Who would reach `_locations.js`, read from the requires: `_enqueue.js` is required by `enqueue-collection.js:20`, `schedule-collections.js:46` and `explee-import-background.js:37, 134`. `_provision_client.js` is required by `onboard-client.js:59` and `explee-import-background.js:36`. The three collectors resolve locations directly under spec 6.2 (`collect-prompt.js:33`, `collect-claude.js:34`, `collect-chatgpt.js:34` already require `_collect.js`). `collection-worker-background.js:30` requires `_collect.js`, which spec row 3 says imports `_locations.js`. The new `client-locations.js` requires it directly.
- Functions that would break (no esbuild entry today): `enqueue-collection`, `schedule-collections`, `collect-prompt`, `collect-claude`, `collect-chatgpt`, `collection-worker-background` (if `_collect.js` requires `_locations.js`), `onboard-client`, and the new `client-locations`. Unaffected: `mcp-server` and `explee-import-background` (already esbuild).
- Correction to the orchestrator brief, read in source: `provision-account.js:39-41`, `signup-client.js:41-42` and `stripe-webhook.js:56-73` do NOT require `_provision_client.js` or `_enqueue.js` today, so they are not on this path. They stay out of it only if the builder does not add such a require; the fix below keeps it that way.

Fix to paste into spec section 5.2 (replacing the first sentence), section 11 and row 1 of section 12:

> 5.2 `netlify/functions/_locations.js` requires only plain JavaScript: `./_country_names` and the new `./_market_regions`. No file under `netlify/functions/` that is reachable from a function without `node_bundler = "esbuild"` may require a `.ts` file, directly or through a helper. `netlify/functions/_market_regions.js` is data only, CommonJS, no require of any kind: `module.exports = { MARKET_REGIONS }` where `MARKET_REGIONS` is an array of `{ id, label, regions: [{ id, label }] }` in the exact order of `MARKETS` in `src/lib/markets.ts` (flags, flagCode and aliases are not needed on the server and are left out). `validatePair` and `resolveLocation` read `MARKET_REGIONS`, never `MARKETS`. `src/lib/markets.ts` is not edited. No `netlify.toml` entry is added for any function, and `netlify.toml` is in nobody's write scope.
>
> 11, new test `tests/market_regions_mirror.test.js` (bg-backend, row 1): loads `src/lib/markets.ts` through `tests/helpers/ts_require.js` and `_market_regions.js` with plain `require`, and asserts with `assert.deepStrictEqual` that `MARKET_REGIONS` equals `MARKETS.map(m => ({ id: m.id, label: m.label, regions: m.regions.map(r => ({ id: r.id, label: r.label })) }))`, so ids, labels and region order are all pinned, the same way `tests/markets_data.test.js` pins `COUNTRY_NAMES`. A market or region appended to `markets.ts` without the mirror fails this test.
>
> 12, row 1 write scope adds `netlify/functions/_market_regions.js` and `tests/market_regions_mirror.test.js`. Acceptance for rows 1 and 3: `node tests/ts_require_bundler.test.js` passes with `netlify.toml` unchanged, and its check that `onboard-client` and `schedule-collections` are not flagged still passes.

### M2. MEDIUM. The location filter seam misses the Recommendations page, so it shows all-location numbers under a one-location filter

Where: spec 7.1, line 466, and section 12 row 5.

Evidence: `buildSnapshotView(rows, activePromptIds, activeEngines)` exists at `src/lib/metrics.ts:161-182`, so the seam the spec names is real. But there is no single caller: it is called from `BrandSentiment.tsx:158`, `Competitors.tsx:106`, `Recommendations.tsx:547`, `views/aiVisibilityView.ts:62`, `views/dashboardView.ts:130` and `views/mentionsView.ts:57`, and every page derives its ids from `snapshot.activePrompts` returned by `useResults()` (`BrandSentiment.tsx:157`, `Competitors.tsx:105`, `Recommendations.tsx:546`). `src/pages/Recommendations.tsx` is in no row of section 12, so built as written it ignores the filter while the sidebar says one location is selected. Also, `buildSnapshotView` computes `errorEngines`, `partialErrorEngines` and `latestChecked` over ALL rows passed in (`metrics.ts:166-179`), so filtering only the id list still lets another location's rows set "last checked" and engine error state under a filter.

Fix to paste into spec 7.1 and row 4:

> The filter is applied once, inside `src/lib/resultsContext.tsx` (row 4): the `snapshot` it exposes carries `activePrompts` and `rows` already restricted to the selected locations (rows kept when `row.prompt_id` is in the filtered prompt ids), and it also exposes `allActivePrompts` and `allRows` unfiltered for the Prompts page and the AI Visibility "Split by location" view. No page computes its own location filter. This covers `Recommendations.tsx`, `dashboardView.ts` and `mentionsView.ts` without adding them to a write scope, and keeps `latestChecked` and the per-engine error sets per location. The results cache key stays unchanged (filtering happens after fetch). `tests/locations_view.test.js` asserts on a two-location fixture that the snapshot exposed under a one-location filter gives a different mention rate and a different `latestChecked` than the unfiltered one.

## 2. Should fix (none of these blocks the build on its own)

S1. Test scope gap that will stop row 1 at its own gate. `tests/explee_import.test.js:35-37` runs the real `_enqueue.enqueueClientCollection` and the real `_provision_client` against `tests/helpers/fake_supabase_mem.js`. That fake answers any rpc it does not know with an error (`fake_supabase_mem.js:344`) and has no `client_locations` table. Built as written, `_provision_client` calling `rpc('add_client_locations')` fails every Explee provisioning in that test, and `_enqueue` leaves out every prompt whose location row is missing (spec 6.1). `explee_import.test.js` is listed in spec section 11 as "must keep passing untouched" and neither file is in any write scope. Fix: add `tests/helpers/fake_supabase_mem.js` (new rpc `add_client_locations`, `ensure_primary_client_location`, a `client_locations` table, and a prompts insert hook that fills `location_id` with the primary) and `tests/explee_import.test.js` to row 1, or have `_provision_client` call `add_client_locations` only when extra locations are given and let the trigger fill the primary, and state which in the spec.

S2. The `PLAN_LOCATION_LIMIT` equality test sits in row 1 (`tests/locations_resolve.test.js`) but reads the `planConfig.ts` export that row 4 writes, and row 4 starts after row 1. Row 1 cannot pass its own test. Move the equality assertion into `tests/locations_view.test.js` (row 4).

S3. `locationLimitFor` must take the plan from the `clients` row read with the service key in `client-locations.js`, never from the request body. The spec does not say where the plan comes from. One line in 5.3.

S4. Grant the service role explicitly. The migration revokes all from `anon, authenticated` on `client_locations` and relies on Supabase default privileges for `service_role` (used by `client-locations.js`, `_enqueue.js` and the collectors to read it). Add `grant select on public.client_locations to service_role;` to step 1 and a read-back row for it in 4.4, so the endpoint cannot answer 500 on a project whose default privileges differ.

S5. Deploy-day behaviour change not listed in 6.7. Four scheduled clients have a WW continent primary (WW/OCE 2, WW/NA 1, WW/APAC 1, WW/EU 1, per the live census). Today scheduled runs ignore `default_region_id` and use the website TLD (`_enqueue.js:151-155`). After the change they get "You are a user based in Oceania, Worldwide" (`_collect.js:50`), no ChatGPT `user_location` (`_collect.js:338`), and ai_overview gets `location=Oceania` with no `gl` (`_collect.js:758-759`), which SerpApi may refuse and retry without location. Add it to 6.7 as (d), and let owner question 2 decide the continent text as well (for example "Europe" alone, not "Europe, Worldwide").

S6. Research workspaces store region ids that are not in `MARKETS`. `db/supabase-research-cities-batch2-2026-11-06.sql:19-55` writes US regions `AUS`, `SJC`, `JAX`, `CMH`, `IND`, `BNA`, `LAS`, `PDX`, `MCO`, `SMF`; none is in the US region list at `markets.ts:141` (grep found none of AUS, SJC, JAX, PDX, BNA, MCO). Their backfilled primary will be `US/AUS` and so on. `resolveLocation` returns a null region label (country level), which matches today's browser behaviour (`marketContext.tsx:92` falls back to `regions[0]`), so collection does not change. But `locationLabel` in `src/lib/locations.ts` must render an unknown region id without throwing, and `validatePair` will refuse re-adding such a location. State both in 5.2 and 7.1.

S7. Onboarding with an extra location that duplicates the primary raises 23505 inside `add_client_locations` AFTER the invite email went out (`_provision_client.js:226` is before the new step). The rollback deletes the user, but the person has an invitation mail. Deduplicate extra pairs against the primary and against each other before the client insert, and refuse with 400 `invalid_location`.

S8. The `_provision_client` server cap check needs a hard fallback when `plan_prompt_caps` has neither the plan nor `free`, matching the SQL trigger's `v_cap := 5` (`supabase-prompt-cap-bypass-fix-2026-11-09.sql:92-94`). Say "else 5" in 5.4.

S9. INFO. A viewer insert with a foreign `client_id` and no `location_id` runs `ensure_primary_client_location` for that foreign client inside the BEFORE trigger, before RLS `WITH CHECK` rejects the row. The statement aborts and the side effect rolls back, so nothing persists. The only observable is a different error (`client_not_found` for a nonexistent id versus the RLS error), which reveals whether a client id exists; client ids are sequential integers already. No fix required; one sentence in 4.3 notes so a reviewer does not rediscover it.

S10. INFO. A rare deadlock is possible between `set_primary_client_location` (advisory lock, then FOR UPDATE on the old primary) and a multi-row prompt insert that already holds FOR SHARE on that row and then needs the advisory lock because no committed primary exists yet. It needs a client with no primary and both calls at once; PostgreSQL detects and aborts one side. No fix required.

S11. The `ctxGeo` string returned by the three collectors is built from the body `market_label` (`collect-prompt.js:304-306`). Once the body labels are ignored, build it from the resolved location so the response and the stored stamp agree.

## 3. Migration SQL, statement by statement (section 4.3)

Checked by reading against the live facts handed to this run. Not executed; the orchestrator's rehearsal is the proof.

| Statement | Result |
|---|---|
| `create table client_locations`, constraint `client_locations_id_client_uq unique (id, client_id)` | Provides the unique constraint the composite FK needs. `client_id integer` matches `has_client_access(cid integer)` and `prompts.client_id` (int4 per `collect-prompt.js:120-124`). |
| Partial unique indexes, check `client_locations_primary_live` | Sound. `set_primary` clears the old primary before setting the new one in separate statements, so the partial unique index never sees two. |
| RLS, revoke, grant select to authenticated, one SELECT policy | Matches the live `prompts_client_read` predicate family. anon gets nothing. See S4 for service_role. |
| `ensure_primary_client_location`, `search_path = ''` | Every table is schema qualified. `pg_advisory_xact_lock`, `hashtextextended` (present on PostgreSQL 17.6), `coalesce`, `nullif` resolve from `pg_catalog`, which is always searched. The second SELECT after the lock runs in a new snapshot under READ COMMITTED, so a concurrent creator is seen. For the 6 WW clients with NULL `default_region_id` it yields `WW/ALL`; `ALL` is present under WW (`markets.ts:34`). The continent ids `OCE`, `NA`, `APAC`, `EU` are present under WW (`markets.ts:35-40`). `RO/B` and `ES/TF` are present (`markets.ts:48, 88`). 66 advisory locks held to commit in one transaction is well inside the lock table. |
| Backfill `select ensure...` then `update prompts ... where location_id is null` | Live facts: every prompt has a client row and every client with prompts gets a primary, so 0 nulls remain and `set not null` succeeds. The UPDATE fires `trg_enforce_prompt_cap`, which returns early for an active row with an unchanged client and for an inactive row (`supabase-prompt-cap-bypass-fix-2026-11-09.sql:50-62`), and runs with no JWT claims (`:72-75`), so it cannot be refused. `trg_prompt_location` does not exist yet at that point. |
| `set not null`, composite FK in a guarded DO block, index | 545 rows, trivial scan. FK validates against rows just backfilled. NO ACTION is correct for `delete-client.js`, which deletes prompts at `:96` before the client at `:102`. |
| `grant insert (location_id) on prompts to authenticated` | Adds to the live column grant list (category, client_id, is_active, position, text). No UPDATE grant, so a viewer and an admin through PostgREST alike get 42501 on any UPDATE naming `location_id`; the live UPDATE grant is (category, is_active, position, text). |
| `enforce_prompt_location` and `trg_prompt_location` | Fires after `trg_enforce_prompt_cap` (name order). Archive (`update({ is_active: false })`, `Prompts.tsx:248`) fires it and returns at the inactive check. Text and category edits (`Prompts.tsx:213`) do not fire it (columns not in `UPDATE OF`). No position reorder write exists in `Prompts.tsx` today. Re-activation into an archived location is refused. Service role inserts without `location_id` (`_provision_client.js:291`, Explee, Stripe and self signup) get the primary. A cross-client `location_id` is refused by the trigger when active and by the FK when inactive. |
| Multi-row insert against the cap | PostgreSQL makes earlier rows of the same command visible to SQL run in a VOLATILE row-level BEFORE trigger, so `enforce_prompt_cap`'s count includes them and a K row insert past the cap fails as one statement. Reasoned from the documented semantics, not executed; the rehearsal must probe it. |
| `add_client_locations`, `archive_client_location`, `set_primary_client_location` | All `p_client_id` scoped; EXECUTE revoked from public, anon, authenticated and granted to service_role only. `return query insert ... returning *` is expected to work on 17.6; not executed. Archive takes FOR UPDATE on the location, which conflicts with the trigger's FOR SHARE in both orders as the spec says. |
| Stamp and job columns | Nullable, no default, metadata only. `claim_collection_jobs` returns `SETOF public.collection_jobs` with `RETURNING j.*` (`db/supabase-collection-queue-migration.sql:95-110`), a LANGUAGE sql body re-planned at execution, so the worker receives the new job columns with no RPC change. |
| Second run | Every statement is `if not exists`, `create or replace`, `drop ... if exists` or guarded; the backfill UPDATE matches 0 rows. Idempotent. |
| Rollback 4.6 | Order is valid: trigger, then the functions that depend on nothing, then the grant and FK, the column, `ensure_primary`, the stamp columns, the table. The policy goes with the table. |

## 4. Authorisation

Confirmed by reading: a viewer cannot read another client's locations (policy `is_admin() or has_client_access(client_id)`); cannot create, change or archive a location except through `client-locations.js`, which passes only the authorised `client_id` to every RPC; cannot attach a prompt to another client's location (trigger when active, FK when inactive; RLS `WITH CHECK` on `client_id`); cannot re-activate a prompt into an archived location; cannot change a prompt's location (no UPDATE grant on `location_id`); cannot exceed the location limit as long as the plan is read server side (S3). `set_primary` is admin only. The admin may exceed the location limit and the prompt cap on purpose, recorded in `client_events`.

## 5. Money

Confirmed in source that no `(prompt, engine)` mechanism needs a location key, because a location is a prompt:
- `_enqueue.js:165-176` SerpApi window, `:183-197` force delete, `:203-216` month skip: all keyed on `prompt_id` and `llm`, filtered by `client_id`.
- `collection-worker-background.js:96-98` upsert on `run_id,prompt_id,llm`.
- `collect-prompt.js:229-277` cap, force delete and month skip keyed on `prompt_id` and `client_id`; `collect-claude.js:208` and `collect-chatgpt.js:213` the same per engine.
- RPC partitions `(prompt_id, llm)` at `db/supabase-client-results-latest-rpc-2026-11-08.sql:109, 121`.
Job count per run stays one per active prompt; the engine set stays re-gated per plan (`_enqueue.js:115-119`, `collect-prompt.js:55-63`); the cooldown (`_enqueue.js:299-325`) and the hourly and monthly checks are untouched. Nothing found that makes a run cost more than today for the same prompts. The known spend increase paths (clients filling their cap across locations, archive and re-add resetting the month skip and SerpApi window) are the ones the spec already names. The euro table in section 9 was not recomputed.

## 6. Truth of data

- Worker rows: the job carries location and region (spec 6.1), `claim_collection_jobs` returns them (section 3 above), the worker passes them into `collectEngines`, `buildResultRow` (`_collect.js:986-1046`) writes the stamp. Seam confirmed.
- Single cell refresh rows: stamped from the prompt's own location read by `(id, client_id)` (spec 6.2). Seam confirmed in `loadPromptForCollect` (`collect-prompt.js:92-105`, copies at `collect-claude.js:77`, `collect-chatgpt.js:77`).
- Dashboard filter: see M2.
- Old rows are counted under the primary even when the browser chip asked them from elsewhere; the spec states this (7.3) and stamps them null. Accepted as recorded.

## 7. Build plan (section 12)

- Scopes as listed are disjoint. Missing files: `_market_regions.js` and its test (M1); `tests/helpers/fake_supabase_mem.js` and `tests/explee_import.test.js` (S1). With M2 applied, `Recommendations.tsx`, `dashboardView.ts` and `mentionsView.ts` need no scope.
- No `netlify.toml` change is needed once M1 is applied; `client-locations.js` stays on the default 10 s timeout as the spec says. One Netlify build, provided row 6 waits for the other session's `Onboard.tsx` commit as written.
- Row 1 must not depend on row 4 output (S2).

## 8. Confirmed

- The bundler flaw (M1), the affected function list, and that `provision-account`, `signup-client` and `stripe-webhook` are not on the path today.
- WW continent and city region ids used by the live census exist in `markets.ts`.
- Trigger order, the cap trigger's early returns, the column grants, the `delete-client.js` order, the claim RPC shape, the `(prompt, engine)` keys.
- `buildSnapshotView` and `useResults().snapshot.activePrompts` are the seam, with six call sites.

## 9. Not checked

- Nothing was executed: no SQL, no rolled-back probe, no node test, no build. The multi-row cap claim, `return query insert ... returning *`, FOR SHARE versus FOR UPDATE ordering and the deadlock in S10 are reasoned from PostgreSQL semantics only.
- Live definitions of `has_client_access`, `my_role`, `is_admin` and the live `plan_prompt_caps` values; live default privileges for `service_role` (S4).
- The live definition of `claim_collection_jobs` (read from the repo file, which says it was read back live on 2026-11-08).
- The type of `prompts.client_id` in the live schema (taken from the comment at `collect-prompt.js:120-124`).
- `src/lib/marketContext.tsx`, `collectionContext.tsx`, `Layout.tsx`, `AIVisibility.tsx`, `Account.tsx`, `Onboard.tsx` beyond the lines quoted; the UI contract in section 8.
- The euro and SerpApi figures in section 9.
- `_geo_signals.js` and its consumer, `generate-recommendations.js`, `fixItems.ts` per-location behaviour.
- How `tests/enqueue_force_gate.test.js` and `tests/phase2_schedule_worker_trigger.test.js` stub modules beyond the `installModule` lines.
- Which July research workspaces (clients 28 to 47) carry region ids outside `MARKETS`; only the 2026-11-06 batch file was read.
- SerpApi acceptance of continent names as `location`.
