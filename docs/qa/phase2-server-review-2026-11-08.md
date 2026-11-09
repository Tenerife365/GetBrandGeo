FAIL (BLOCK): the gate changes are correct, but the same three collector handlers still let any viewer buy unlimited engine calls through an unverified prompt_id. That is a live, pre-existing spend exposure, and the fix belongs in the files under review.

# Phase 2 server lens review, 2026-11-08 (run 2026-11-09)

```
INTENT: review Phase 2 lane 2A (collector gates, reaper, client_results_latest)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, server and SQL lens. I did not build any of this and edited no reviewed file. I ran no git command, no build, no dev server and no browser. Database access was read-only SELECT, EXPLAIN and begin ... rollback probes against duiyifepitvugyulobqm. One disclosure: my first probe transaction also contained a stray `create temp view _noop as select 1` run as `authenticated`. It sat inside `begin; ... rollback;`, was rolled back and left nothing behind, but it was a DDL statement, so I am recording it here.

---

## HUMAN CHECKPOINT: live spend exposure (F1)

Any signed-in viewer can make the platform call an engine an unlimited number of times, and none of the three spend gates notices. This includes the competitor account that self-service signed up.

How it works, all from code I read and one live constraint:

1. `collect-claude.js:64-72`, `collect-chatgpt.js:64-72` and `collect-prompt.js:81-88` check only that `client_id` is the caller's own. They never check that `prompt_id` belongs to that client, and they never check that it exists at all. `grep -c "from('prompts')"` returns 0 for all three files.
2. The engine is called first (`collect-claude.js:126`, `collect-chatgpt.js:131`, `collect-prompt.js:184`), and the row is inserted after (`:133`, `:139`, `:193`).
3. `ai_results_prompt_id_fkey` is `FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE` (read live from `pg_constraint`). A `prompt_id` that does not exist makes the insert fail **after** the call has already been billed.
4. All three spend gates count rows that were actually inserted: the hourly ceiling at `_auth.js:261-267` counts `ai_results` rows, the client budget at `_auth.js:278` calls `sum_cost_eur`, and `sum_cost_eur` is `select coalesce(sum(cost_eur),0) from public.ai_results ...` (read live). A failed insert writes neither a row nor `cost_eur`, so none of the gates ever moves.
5. The monthly skip at `collect-claude.js:107-118` is keyed on the caller-supplied `prompt_id`, so a new or fake id always passes it. `prompt_text` is also supplied by the caller, so the text sent to the engine is whatever the caller chooses.

**Reproduced** in a scratch copy outside the repo (`scratchpad/mut/tests/fk_bypass_probe.js`). It uses an in-memory DB with the live FK rule and a limits stub that counts rows, as `_auth.js` does. A viewer sent 20 POSTs with `prompt_id: 999999`:

```
collect-claude.js: fake prompt_id -> 20 posts, engine calls 20, rows 0, last body {"done":false,"llm":"claude","reason":"insert_error","detail":"insert or update on table \"ai_results\" violates foreign key constraint \"ai_results_prompt_id_fkey\"","force_ignored":true}
collect-claude.js: control real prompt_id 7 -> engine calls 1 (monthly skip after the first), rows 1
collect-chatgpt.js: fake prompt_id -> 20 posts, engine calls 20, rows 0, last body {...same...}
collect-chatgpt.js: control real prompt_id 7 -> engine calls 1 (monthly skip after the first), rows 1
```

**Where it is reachable today:**
- `collect-prompt.js` (live since `9560027`) for every plan, including the 5 `free` clients on Gemini (clients by plan, read live: pro 37, free 5, growth_pro 3, essentials 2, managed 2, growth 1, radar 1).
- The live, pre-Phase-2 `collect-claude.js` and `collect-chatgpt.js` for every plan.
- After this change, `collect-claude.js` and `collect-chatgpt.js` refuse `free` (and `radar` for ChatGPT), so the change narrows the hole but does not close it.

**The real-but-foreign variant:** sending another client's real `prompt_id` (ids run sequentially, max 603 today) does insert. The row is counted, so it is bounded, but it is recorded under the caller's `client_id` with a foreign `prompt_id`. That breaks the invariant spec section 0.1 relies on: "0 rows whose prompt_id is missing or belongs to another client", read 0 again today.

**Fix, owner bg-backend on Opus, in all three collectors, in the same build as the gate change:**
- Right after the ownership check, read `prompts` with the service key: `select id, text, client_id from prompts where id = prompt_id`. Answer 404 when no row comes back, and 403 when `client_id` differs.
- For a non-admin, send the stored `text` to the engine, not `body.prompt_text`.
- Add checks for a fake id, a foreign id and a forged `prompt_text`.

As defence in depth, a failed insert should still be counted somewhere the limits read. For example, write the error row with the real cost and a null `prompt_id`, or record spend in a separate ledger.

Decision owed from Constantin: ship the 2A gate as is and fix F1 next, or hold 2A until F1 rides the same Netlify build. I recommend holding, because F1 is a few lines in the same three handlers and needs no new build.

---

## Calibration (bg-verify)

1. **Diff stat:** not run. The run's hard rule forbids every git command, so I cannot paste `git diff --stat` or prove the changed set from git. The files reviewed are the ones the packet names: `collect-claude.js` (154 lines), `collect-chatgpt.js` (160), `tests/phase2_collector_gate.test.js` (409, new), `db/supabase-collection-jobs-reaper-2026-11-08.sql` (289, new) and `db/supabase-client-results-latest-rpc-2026-11-08.sql` (149, new). All of them are in the declared server-lane scope. I found no reviewed file outside scope, but I cannot prove the absence of unlisted changes without git. Not checked.
2. **Secret scan:** I ran it over the five reviewed files with rg instead of over the diff. It found 0 real values. The only hits are `SUPABASE_SERVICE_KEY` env reads and the test placeholder `test-service-key-placeholder` (`phase2_collector_gate.test.js:39`).
3. **Criteria:** these come from plan section 2A items 1 to 3 (`phase2-dashboard-plan-2026-11-08.md:59-67`) and spec acceptance 2.1 to 2.5 (`phase2-results-layer-spec.md:412-417`). All are checkable. Spec 2.4 needs the full export with the service key on Constantin's machine, and spec 2.5 needs EXPLAIN as a real viewer after the function exists, so I checked both only partly (table below).
4. **Baseline:** I ran no tsc or build (server lens, and the build is forbidden). `node tests/phase2_collector_gate.test.js` prints `36 passed, 0 failed`, exit 0.
5. **Most sensitive auth check:** `requireAuth(event)` at `collect-claude.js:52` and `collect-chatgpt.js:52`. Ownership is at `:70` and the admin-only force rule at `:41-43`.
6. **Writes:** I wrote only this file. I edited no reviewed file. My mutations ran on copies under the session scratchpad.

CALIBRATED, with the git-dependent parts of items 1 and 4 listed under "Not checked".

---

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | Claude and ChatGPT honour force for admins only; otherwise `force_ignored` is set | PASS | `collect-claude.js:41-43,74-76`, `collect-chatgpt.js:41-43,74-76`. The drift guard asserts equality with `collect-prompt.js:64-66` and `enqueue-collection.js:26-27` on 32 inputs. Suite: `viewer force ignored ... ok` for both. Mutants M1 to M4 below fail the suite. |
| A2 | The engine is checked against `activeEnginesFor(plan, engines_enabled)` of the live clients row, and the body cannot grant it | PASS | `collect-claude.js:81-96`, `collect-chatgpt.js:86-101`. The refusal comes before limits and spend (`:93` before `:99`). Mutants M5 (plan from `client_config`) and M8 (limits before the gate) fail the suite. |
| A3 | No viewer path can still force a delete | PASS | Neither collector deletes (`collect-claude.js:121-124`). `collect-prompt.js:146-160` deletes only under `effectiveForce`. `enqueue-collection.js:85` passes `effectiveForce` into `_enqueue.js:89-91`, where `replace = force && trigger === 'manual'`. `schedule-collections.js:141` passes `replaceExisting: false`. Repo-wide grep: no other caller of `collectEngines` (only `collection-worker-background.js:78`) or of the two endpoints (only `collectionContext.tsx:403-404`). |
| A4 | No path collects an engine outside the plan | PASS for the plan rule, FAIL for spend | The worker runs `job.engines`, built at `_enqueue.js:104-108` from the clients row, with `plan` from the server-built config at `_enqueue.js:131`. The plan rule holds on every path I found. Spend inside the plan is not bounded: F1. |
| A5 | The tests fail without the gate (proved by an independent mutation) | PASS with gaps | 9 of 11 independent mutants fail the suite. M9 and M10 survive: F3. |
| A6 | The reaper re-queues or fails stuck `running` jobs after N minutes | PASS (logic), not applied | The statement compiles under `search_path = ''` (EXPLAIN, rolled back, plan uses LockRows plus a pkey Update). Threshold, attempts and run-completion logic match the live `claim_collection_jobs` and the worker (details below). |
| A7 | The reaper actually unblocks a stuck run | FAIL (partial) | A requeued job waits for a worker trigger that may not come: F2. |
| R2.1 | The migration holds exactly the SQL of spec 2.2 | FAIL by design | `nulls last` was added at `rpc...sql:109-110`. The deviation is correct (F5). The spec needs to be updated so 2.1 holds again. |
| R2.2 | Grants: authenticated and service_role only; INVOKER | PASS from source, not read back | `rpc...sql:96,148-149`. The function does not exist live (`pg_proc` has no `client_results_latest`), so I could not read `routine_privileges` back. |
| R2.3 | A viewer of client 54 asking for client 1 gets 0 rows | PASS on the body | I ran the body as `authenticated` with the JWT sub of a client 54 viewer (`user_profiles` row role viewer, client_id 54), rolled back. Client 1: 0 rows (raw count 0). Client 54: 385 RPC rows from 660 raw rows. The function itself was not created. |
| R2.4 | RPC output equals `deriveLatestRows` on the full export | NOT CHECKED | This needs the service-key export on Constantin's machine. Partial check: the body as owner returns 589 rows, 401 cells and 3 run starts for client 1, and 385, 385 and 2 for client 54. There are 0 null `checked_at` and 0 null `prompt_id` rows. |
| R2.5 | Viewer EXPLAIN ANALYZE under 700 ms | NOT CHECKED | The function does not exist. The spec measured 507.6 ms. |
| R-cols | The RPC covers every column the pages read | PASS | The only caller is `resultsContext.tsx:36`. Row fields read in `lib/views`, `metrics.ts` and `csv.ts` (rg) are id, prompt_id, llm, status, error_code, brand_mentioned, brand_position, sentiment, response_snippet, competitors_mentioned, checked_at and the five flags plus engine_error_since. All are returned. The `client_id` and `cost_eur` hits in `AIVisibility.tsx:654,912,975` read `fix_states` and the paged cost read, not snapshot rows. |

---

## Security findings, by severity

**F1, BLOCKER (live, pre-existing, in the reviewed handlers).** The unverified `prompt_id` gives unbounded engine spend. Full detail is in the HUMAN CHECKPOINT above. Where: `collect-claude.js:64-72,107-133`, `collect-chatgpt.js:64-72,112-139`, `collect-prompt.js:81-88,164-193`, `_auth.js:261-267,278`.

**F2, MEDIUM.** The reaper requeues without a worker, so the run it targets stays open. Where: `supabase-collection-jobs-reaper-2026-11-08.sql:129-131`, `schedule-collections.js:160`.
- **Exploit or failure:** a worker invocation dies on attempt 1 or 2. The reaper sets the job to `pending` with `scheduled_for = now()`. Nothing claims it until the next `enqueue-collection` call or a `schedule-collections` run that itself enqueued work: `if (totalJobs > 0) await triggerWorker()` at `schedule-collections.js:160`, and the trigger at `enqueue-collection.js:98`.
- **Effect:** the dashboard poll that the file header says this fixes (`:13-19`) keeps spinning. Only an attempt-3 job is closed by the reaper alone.
- **Related, pre-existing and latent:** the worker's own retry sets `scheduled_for = now + 60 s` (`collection-worker-background.js:122`), while its self-chain count only counts due jobs (`:172-177`). A retry on the final batch is left without a worker the same way. Not observed so far: 3 jobs ever retried, the slowest finished 10 min 11 s after creation (read live).
- **Fix:** the builder's option (a). `schedule-collections.js` calls `triggerWorker()` whenever any `pending` job with `scheduled_for <= now()` exists. Code only, no new secret. This needs Constantin's go (`/escalate`).

**F3, LOW, test coverage.** The monthly-skip predicates are untested. Where: `phase2_collector_gate.test.js:161-169` seeds only ok rows for client 42.
- **Evidence:** independent mutants in a scratch copy. M9 drops `.eq('client_id', client_id)` from the Claude skip (`collect-claude.js:112`) and still gives `36 passed, 0 failed`. M10 drops `.neq('status','error')` from the ChatGPT skip (`collect-chatgpt.js:118`) and still gives `36 passed, 0 failed`.
- **Failure:** with M10 in production, a cell whose only row this month is an error could never be retried by a viewer. With M9, another client's row for the same `prompt_id` would suppress this client's collection.
- **Fix:** add a check that seeds an error row (expect a collect) and a check that seeds another client's ok row for the same prompt (expect a collect).

**F4, LOW, pre-existing, flagged by the builder and confirmed.** The driver message is echoed to the viewer. Where: `collect-claude.js:137` and `collect-chatgpt.js:143` return `detail: insErr.message`. The F1 probe body shows it leaking the constraint name `ai_results_prompt_id_fkey`. `collect-prompt.js:210-222` deliberately omits it. Fix: drop `detail`. `collectionContext.tsx:425-427` reads only `reason`.

No finding on the SQL security hygiene. The supporting evidence:
- **Reaper:** SECURITY INVOKER (`:99`), `search_path = ''` (`:100`), revokes from public, anon and authenticated, and grants to service_role (`:191-194`). Even if `authenticated` could run it, RLS gives `collection_jobs` no UPDATE policy, so the update would touch 0 rows. service_role and postgres have BYPASSRLS (read live). service_role has UPDATE on `collection_jobs` and INSERT on `job_runs`. `job_runs` columns `job, ran_at default now(), ok, detail` and `ops.watch_expectations` (pkey `job`, source in job_runs or cron) match part B.
- **RPC:** SECURITY INVOKER with `search_path = public`. Every relation is schema-qualified (`public.ai_results`). Because it is INVOKER, a hijacked search_path grants nothing the caller does not already have. RLS on `ai_results` is `is_admin() OR has_client_access(client_id)` for authenticated, plus a `my_role()` policy for public (read live).

**Race with a live worker: none found.**
- `claim_collection_jobs` (read live) sets `claimed_at = now()` in the database clock, the same clock the reaper compares against, so there is no client clock skew.
- A claiming invocation dies by Netlify's 15-minute hard limit (`collection-worker-background.js:4-5`). The reaper refuses values under 16 minutes (`:109`) and defaults to 30.
- `FOR UPDATE SKIP LOCKED` (`:126`) and the `status = 'running'` recheck (`:141`) leave a row that a worker is updating at that moment untouched.
- `attempts >= max_attempts` mirrors `collection-worker-background.js:113`, since the claim has already incremented attempts.
- Completion is derived and nothing writes `collection_runs` (columns read in the header). That matches `:154-161`.

---

## Accessibility

Not applicable to this lens. No new text, surface or interactive element ships in the server files. The pages that consume the RPC are another lane's.

---

## Regression surface (by grep)

- `collect-claude` and `collect-chatgpt` are called only from `src/lib/collectionContext.tsx:403-404`, via `AIVisibility.tsx:469`. That button is inside `{isAdmin && (...)}` (`AIVisibility.tsx:1352`). **This refutes the builder's caller change 1:** no viewer UI path reaches the new `skipped` answer. Only devtools does.
- `collectEngines` is called only by `collection-worker-background.js:78` and the three HTTP collectors. The worker path is unchanged.
- `activeEnginesFor` (`_cost.js:468-473`) maps an unknown or null plan to essentials. That means claude and chatgpt are allowed. This is pre-existing and consistent with the worker, and no client has a null plan today.
- The RPC is consumed only by `resultsContext.tsx:36`, through `readAllById` (`keysetRead.ts:35-55`).
- The plan text (`plan:64-67`, "active prompts") differs from spec 2.1 ("all prompts"). The spec's reasons (`fixItems.ts:47-49`, MCP) win. Info.
- Paths that need a manual look: `src/lib/collectionContext.tsx:425-440` (the reason mapping for `no_engines_for_plan` and the 404 and 500 answers) and `schedule-collections.js:160` (F2).

---

## Data and claim integrity

- Builder: "589 for client 1, 401 is_latest, 385 for client 54". Reproduced with the `nulls last` body: 589, 401, 3 run starts; 385, 385, 2.
- Builder: "0 rows have a null checked_at". Reproduced: 0 for clients 1 and 54. The column is `timestamp without time zone`, nullable (information_schema).
- Builder: "metrics.deriveLatestRows should also order nulls last". **Already true:** `compareNewestFirst` maps null to `''` (`metrics.ts:44-45`), which sorts oldest, matching `nulls last`. No change is needed. F5, INFO: update spec 2.2 so acceptance 2.1 holds.
- Builder: "collection_jobs 1,583 rows, all done". Read live: 0 pending or running and 0 pending older than 1 hour.
- Builder: "Calls go down ... a client whose plan lacks the engine is refused before any spend". True for the plan rule. **Incomplete as a spend claim** (F1).
- Builder: "net zero read for collect-chatgpt". True: it read `clients` before too, per its own comment at `:84-85`. I cannot see the prior file without git.
- Dash scan (rg, with a control file that fires): 0 em or en dashes in the test and both SQL files. Six hits are in comments of `collect-claude.js:3,98,132` and `collect-chatgpt.js:3,103,138`. The same old comment style sits at `collect-prompt.js:115`, so they are probably pre-existing, but I cannot attribute them without git. Comments only, no copy.
- F6, INFO: `readAllById` re-runs the whole function for each 1,000-row page, and a row's role flags can change between pages if a collection lands mid-read. This only matters for a client whose subset exceeds 1,000 rows. Today the maximum is 589.

---

## Independent mutation results (scratch copy, outside the repo)

| Mutant | Result |
|---|---|
| M1 claude `effectiveForce` returns `!!force` | 30 passed, 6 failed |
| M2 chatgpt the same | 30 passed, 6 failed |
| M3 claude skip keyed on raw `body.force` | 33 passed, 3 failed |
| M4 chatgpt the same | 33 passed, 3 failed |
| M5 claude plan from `client_config` first | 34 passed, 2 failed |
| M6 chatgpt model plan from `client_config` first | 35 passed, 1 failed |
| M7 chatgpt lookup error falls through | 35 passed, 1 failed |
| M8 claude limits before the plan gate | 34 passed, 2 failed |
| **M9 claude skip without client_id** | **36 passed, 0 failed (survives)** |
| **M10 chatgpt skip counts error rows** | **36 passed, 0 failed (survives)** |
| M11 claude ownership check removed | 35 passed, 1 failed |

---

## What was not checked

- Everything that needs git: the diff, the diff stat, the prior file versions, whether an unlisted file changed, and the attribution of the six comment dashes.
- The RPC and the reaper as created functions: neither exists live, so there was no `routine_privileges` read-back, no `security_type` read-back, no EXPLAIN ANALYZE as a viewer (R2.5) and no parity against a full export (R2.4).
- Part B of the reaper: cron scheduling and the watchdog expectation in practice. I did not read `ops.watchdog_findings` beyond its constraints.
- The real `_auth.js` `checkCollectionLimits` inside a harness. F1 was proved with a stub that counts rows the same way, plus the live `sum_cost_eur` body.
- Gemini and the other fast engines on `collect-prompt.js` were not exercised in the F1 harness. The code path is identical (`:81-88,184,193`).
- The page lanes (A and B), `metrics.ts` beyond `compareNewestFirst` and `deriveLatestRows`, `evaluateFix` on subset rows, CSV, tsc, and light mode.
- Live Netlify behaviour, real tokens, and the recommendations FK the pageB builder asked about.
