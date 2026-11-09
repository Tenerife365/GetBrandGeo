BLOCK: the prompts_delete migration does not close N2. A viewer can still bill engine calls that are never counted: it UPDATEs the prompt's primary key in the middle of a collect instead of deleting the row. I proved this as a real viewer inside a rolled-back transaction, with the migration applied. The scheduler worker trigger (F2), I1 and I2 are closed and proven by mutants.

# Phase 2 server lens, final review 2, 2026-11-09

```
INTENT: review Phase 2 lane 2A after rulings 1 and 2 (prompts RLS, scheduler worker kick) plus I1/I2  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, server lens. I did not build this, and I edited no reviewed file. The only git command was `git show HEAD:<path>`. I ran no build, no dev server and no browser. Every database probe was a read or a single `DO` block that ends in `raise exception`, so Postgres rolled all of it back. Live state was read back afterwards (below). Mutants ran on a copy at `C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\f2v\`, driven by `...\scratchpad\f2v_run.js`. That copy reaches `node_modules` through a junction: remove it with `rmdir`, not a recursive delete. Prior reviews: `docs/qa/phase2-server-final-2026-11-09.md` and `docs/qa/phase2-server-rereview-2026-11-09.md`.

---

## HUMAN CHECKPOINT: live spend exposure, and the migration as written does not close it

1. **Live today:** viewers can still DELETE prompts (`prompts_delete` = `is_admin() OR has_client_access(client_id)`, read again after my probe). N2 is reachable in production exactly as the re-review described it.
2. **After `db/supabase-prompts-delete-admin-only-2026-11-09.sql` is applied:** the same race still works, through UPDATE instead of DELETE (N7 below). Applying the file alone would mark N2 closed while it stays open. **Do not apply it as written.** Amend it first (fix under N7). Either way it still ships after the dashboard build that carries the Prompts.tsx archive path.

---

## Calibration

1. **Diff:** I could not run git diff here, so I compared each file with `git show HEAD:`. Changed files: the three collectors, `schedule-collections.js`, `tests/phase2_prompt_ownership.test.js`, the new `tests/phase2_schedule_worker_trigger.test.js`, the new `db/supabase-prompts-delete-admin-only-2026-11-09.sql`, and `db/supabase-collection-jobs-reaper-2026-11-08.sql`. The reaper file is not in HEAD; it is untracked from the earlier round, and I read its header edits at lines 73-85 and 283-289. All of these are in the builder's list. I cannot prove from git that no other file changed. The app lane's files belong to the other lens.
2. **Secret scan** (rg, names only) over `schedule-collections.js`, the new test and the new SQL: 0 real values. The only hits are the cron gate names and test placeholders.
3. **Criteria:** (a) the migration closes N2, shown in begin/rollback as a viewer and an admin, with live policies unchanged afterwards; (b) the N2 race model re-run against the post-migration policy; (c) the scheduler fires the worker once per run, best effort, no double trigger, no new secret, with a cost note; (d) I1 and I2 closed; (e) full collector suites; (f) regressions. Every one of these can be checked objectively.
4. **Baseline** (previous final review): phase2_prompt_ownership 87/0, phase2_collector_gate 48/0, phase1 65/0, enqueue_force_gate 13/0, tsc exit 0.
5. **Most sensitive check touched:** the RLS policy `prompts_delete` on `public.prompts`, in the migration at lines 72-77. Collector auth is unchanged: `requireAuth(event)`, then the viewer client match at `collect-claude.js:148`, then `loadPromptForCollect`. The scheduler is gated by `requireCronAuth(event)` at `schedule-collections.js:126`, before any read.
6. **Writes:** only this file.

CALIBRATED. The git-dependent part of item 1 is listed under "What was not checked".

---

## Prior findings

| Id | Status | Evidence |
|---|---|---|
| N2 | **OPEN** | The DELETE path is closed by the migration (probe: viewer delete 0 rows, archive 1 row, admin delete 1 row). The same race survives through UPDATE of `prompts.id` (N7, probe below). |
| F2 | **closed (code, not deployed)** | `kickWorkerIfNeeded` at `schedule-collections.js:104-123`, called once at `:212`. Seven independent mutants are all killed (table). |
| I1 | **closed** | `parseId` adds `n <= PG_INT_MAX` (`collect-prompt.js:125-130`, `collect-claude.js:107-112`, `collect-chatgpt.js:107-112`). Mutant: no ceiling in all three gives 92/7. No ceiling in chatgpt only gives 96/3. |
| I2 | **closed** | `if (!body \|\| typeof body !== 'object' \|\| Array.isArray(body))` returns 400 `Invalid body` (`collect-prompt.js:149-150`, `collect-claude.js:131-132`, `collect-chatgpt.js:131-132`), after `JSON.parse` and before the destructure. Mutant: guard removed in prompt gives 97/2. Arrays allowed again in claude gives 97/2. |
| N1, N3, N4 | closed (previous review) | Still green: 99/0, 65/0. The N1 and N4 mutants are kept inside the suite. |
| N5, N6 | accepted (INFO) | Unchanged. N6's point, that a viewer may UPDATE its prompts, is the root of N7. |

---

## RLS probe (one `DO` block, rolled back by its own `raise exception`)

The block applied PART A verbatim, without its begin/commit. It then impersonated client 54's only viewer, and then an admin of client 1, each as role `authenticated` with `request.jwt.claims.sub`. That is the same path PostgREST takes. The fresh prompt was inserted with an explicit id, so the sequence was not consumed (`prompts_id_seq` last_value is still 603 afterwards).

```
PROBE_RESULT {"v_is_admin": false, "v_sees_481": 1,
  "v_delete_481": 0,                <- viewer DELETE refused by the new policy
  "v_archive_481": 1,               <- viewer archive (is_active=false) allowed
  "v_insert_fresh": 1,              <- viewer inserts a fresh prompt (the archive freed a cap slot)
  "v_renumber_fresh": 1,            <- viewer UPDATE prompts SET id = <new> on it: ALLOWED
  "v_delete_renumbered": 0,
  "v_renumber_482_err": "23503",    <- renumbering a prompt that has rows is refused (FK NO ACTION)
  "collector_insert_err": "23503",  <- service-role ai_results insert with the id the collector read: FK violation
  "a_is_admin": true, "a_delete_486": 1, "ai_486_after": 0, "cj_486_after": 0,
  "policy_in_txn": "is_admin()"}
```

Read back after the probe: all five `prompts` policies are byte-identical to before, and `prompts_delete` still reads `(is_admin() OR has_client_access(client_id))`. Prompt 481 is active with 12 `ai_results` rows. Prompt 486 is active with 12 rows and 10 jobs. Prompt 482 is present. Rows with ids 1999999999, 2000000001 and 2000000002: 0.

The builder's three DELETE and archive numbers reproduce. The N2 re-run under the new policy does not come back clean.

---

## Security findings, by severity

**N7, MAJOR, new. N2 survives the migration: a viewer renumbers the prompt mid-call.**
- What: `authenticated` holds UPDATE on every column of `public.prompts`, including `id` (`has_column_privilege('authenticated','public.prompts','id','UPDATE')` is true, read live). `prompts_update` allows any row of the viewer's own client. Both FKs from `ai_results` and `collection_jobs` are `ON DELETE CASCADE` with the default `ON UPDATE NO ACTION`. The cap trigger `enforce_prompt_cap` returns early on an UPDATE that keeps the prompt active on the same client, so it does not stop a change of id.
- Where: the grants and `prompts_update` on `public.prompts`. The collector insert is at `collect-claude.js` and `collect-chatgpt.js` (the `ai_results` insert after `collectEngines`) and at `collect-prompt.js`. The row-counting gates are `_auth.js` `checkCollectionLimits`.
- Exploit path, with the migration applied:
  1. The viewer has a prompt P with no `ai_results` rows. It can make one with its own INSERT (archive one prompt first if it is at the cap), or it can reuse a prompt it has already renumbered, because that prompt never gets a row.
  2. It POSTs a collect for P. `loadPromptForCollect` finds P, and the engine call starts. ChatGPT with web search takes up to about 25 s.
  3. During that call it sends `PATCH /rest/v1/prompts?id=eq.P` with `{"id": P2}`. The probe shows this update affects 1 row.
  4. The collector inserts with `prompt_id = P`, and the insert fails with 23503 (probe: `collector_insert_err`). The engine has billed, no row exists, and no gate moves.
  5. It repeats with P2, then P3, and so on. It never needs a second INSERT and never reaches the cap. This gives the same unbounded loop as N2, with one prompt.
- Fix, to go in the same migration file before it is applied (owner bg-backend on Opus, then bg-verify): remove column-level UPDATE on `id` (and on `client_id` and `created_at`, which no client path writes) from browser roles. A suggested form follows; the builder proves it in begin/rollback:
  ```sql
  revoke update on public.prompts from anon, authenticated;
  grant update (text, category, is_active, position) on public.prompts to authenticated;
  ```
  By grep, the only browser writes to `prompts` are `Prompts.tsx:210` (`text`, `category`), `Prompts.tsx:245` (`is_active` through `removalWrite`) and `Prompts.tsx:275` (an insert). Service-key paths bypass grants. As a second layer, you can also add a `BEFORE UPDATE` trigger that raises when `new.id is distinct from old.id` and `current_user` is not `service_role` or `postgres`, so a future blanket re-grant cannot reopen this. Proof required, as a viewer: renumber fails with 42501 or the trigger's error, archive affects 1 row, a text edit affects 1 row, and an admin edit still works. Add the renumber case to the migration's PROVEN block. Then read back `information_schema.column_privileges` for `prompts`.
- Note on `anon`: it also holds UPDATE on `id`, but every `prompts` policy that allows UPDATE is `TO authenticated`, so an anon update matches 0 rows. This is not a separate finding.

**INFO S1, PRE-EXISTING, not new from F2.** The worker does not re-check the client budget when it runs a job (`collection-worker-background.js:78-90`). The budget is checked at enqueue time (`schedule-collections.js:168`, `enqueue-collection.js`). F2 means a job that was retried or reaped now runs within the hour instead of waiting for the next manual enqueue. It does not create jobs. `MAX_ATTEMPTS` bounds each job, and `claim_collection_jobs` claims `FOR UPDATE SKIP LOCKED` (read live). This adds no new spend class. Recorded only so nobody reads "already budgeted" as "budget re-checked".

---

## Scheduler worker trigger (ruling 2): criterion detail

- **Once per run:** there is a single call site at `:212`. The old `if (totalJobs > 0) await triggerWorker()` line is gone (`rg triggerWorker` in the file hits only the import at `:46` and the default argument at `:104`). Mutants S2 (trigger twice) and S6 (old line kept) are killed.
- **Best effort:** a failed read is caught at `:108-110`, and a trigger that throws is caught at `:119-122`. Both are recorded in `job_runs.detail.worker`, and the run still answers 200 with `ok=true`. Mutants S3 and S7 are killed. `triggerWorker` itself also swallows fetch errors (`_enqueue.js:266-277`).
- **No double trigger with the worker's own retry:** the worker self-chains only when due pending jobs remain (`collection-worker-background.js:170-181`). A retry is scheduled at now + 60 s (`:122`), so it is not due when the worker counts. That is exactly the gap the hourly kick closes. If a kick lands while a worker is still running, the two claim disjoint rows (SKIP LOCKED, read live), so a redundant invocation claims nothing and exits.
- **No new secret:** the key handling stays in `_enqueue.js` `triggerWorker` (`X-Internal-Key`, the existing `INTERNAL_AUDIT_KEY`). The scheduler is still gated by `requireCronAuth`, and the suite's "no key is 401 with no read" check passes.
- **Due filter correct:** the query is `.eq('status','pending').lte('scheduled_for', nowIso).limit(1)`. That matches the live partial index `idx_collection_jobs_claim (status, scheduled_for) WHERE status='pending'` and the claim function's own predicate. Mutants S4 (no `scheduled_for` filter) and S5 (no status filter) are killed.
- **Cost note:** zero model calls added. The run makes 1 indexed read per hourly run (cron job 7, `10 * * * *`, active, read live), which is 24 a day platform-wide, plus at most 1 extra worker invocation per hour, and only when due pending jobs exist. Live: `collection_jobs` holds 1,583 rows, 0 of them pending, so the first deploy triggers nothing.

## Independent mutants (`f2v_run.js`, scratch copy, restored afterwards: `restored: true`)

| Mutant | phase2_schedule_worker_trigger | phase2_prompt_ownership | gate / phase1 |
|---|---|---|---|
| baseline | 11/0 | 99/0 | 48/0, 65/0 |
| S1 kick only on new work (HEAD behaviour) | 8/3, first `a due pending job (reaper requeue) and no client due: trigger fires exactly once` | | |
| S2 trigger called twice | 6/5 | | |
| S3 read error propagates | 9/2, first `collection_jobs read fails, nothing enqueued: 200, no trigger, no throw` | | |
| S4 no `scheduled_for` filter | 9/2 | | |
| S5 no status filter | 9/2 | | |
| S6 old trigger line kept too | 8/3, first `new work AND due leftovers: still exactly once per run` | | |
| S7 trigger error rethrown | 10/1 | | |
| I1 no int4 ceiling, all three | | 92/7 | 48/0, 65/0 |
| I1 no ceiling, chatgpt only | | 96/3 | 48/0, 65/0 |
| I2 body guard removed, prompt | | 97/2 | 48/0, 65/0 |
| I2 arrays allowed, claude | | 97/2 | 48/0, 65/0 |

`refresh_cadence` cannot run in the scratch copy, because it reads `db/`, which lies outside the copy. It passes in the repo (below).

---

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| C1 | Migration: viewer DELETE refused | PASS | Probe: `v_delete_481: 0`, `v_delete_renumbered: 0`. |
| C2 | Migration: viewer archive allowed | PASS | Probe: `v_archive_481: 1`. |
| C3 | Migration: admin hard delete kept, cascade intact | PASS | Probe: `a_delete_486: 1`, `ai_486_after: 0`, `cj_486_after: 0`. |
| C4 | Live policies unchanged after the probe | PASS | Read back: the five policies are identical to before, and the probe rows are 0. |
| C5 | N2 race closed under the post-migration policy | **FAIL** | N7: `v_renumber_fresh: 1`, `collector_insert_err: 23503`. |
| C6 | Migration is idempotent, single transaction, with read-back and exact rollback | PASS | `db/supabase-prompts-delete-admin-only-2026-11-09.sql:68-82` (`drop policy if exists` then `create` inside begin/commit), read-back `:91-94`, rollback `:101-109`, which matches the live definition read today. |
| C7 | Worker kick once per run when due pending or new work | PASS | Code `:104-123`, `:212`. Mutants S1, S2 and S6 are killed. |
| C8 | Best effort, never fails the run | PASS | Mutants S3 and S7 are killed. Suite checks 4 and 5. |
| C9 | No double trigger with the worker retry, no new secret | PASS | See the scheduler section. SKIP LOCKED was read live. |
| C10 | Cost note | PASS | See the scheduler section. 0 pending jobs live. |
| C11 | I1 closed | PASS | `parseId` ceiling. Mutants killed. |
| C12 | I2 closed | PASS | Body guard. Mutants killed. |
| C13 | Full collector and scheduler suites green | PASS | See the test runs below. |
| C14 | Spend bounded per viewer (carried from the earlier reviews) | **FAIL** | N7. |
| C15 | Each fix has a test that fails without it | PASS for F2, I1 and I2. N/A for the SQL | The migration has no automated test, only the in-file PROVEN block. That block does not include the renumber case. |
| C16 | No em or en dash added | PASS | rg with a firing control (count 1). collect-prompt 12 now and 12 at HEAD. collect-claude 3 now and 5 at HEAD. collect-chatgpt 3 now and 5 at HEAD. schedule-collections, both test files and both SQL files: 0. |
| C17 | No real names in fixtures | PASS | The scheduler test header states this, and its fixtures use test clients. The probe uuids are not written anywhere. |
| C18 | Type check and syntax | PASS | `npx tsc --noEmit` exit 0. `node --check` ok on all four functions. |

Test runs in the repo, from `brandgeo-dashboard/`:

```
node tests/phase2_prompt_ownership.test.js        99 passed, 0 failed
node tests/phase2_schedule_worker_trigger.test.js 11 passed, 0 failed
node tests/phase2_collector_gate.test.js          48 passed, 0 failed
node tests/phase1_server_hardening.test.js        65 passed, 0 failed
node tests/enqueue_force_gate.test.js             13 passed, 0 failed
node tests/engine_routing.test.js                 5 checks passed
node tests/refresh_cadence.test.js                17 assertions passed
node tests/enqueue_history.test.js                PASS: 23 assertions
node --check collect-prompt / collect-claude / collect-chatgpt / schedule-collections   ok
npx tsc --noEmit                                  exit 0
```

---

## Accessibility

This lens has no accessibility scope: no server change ships text or an interactive element. The viewer Archive control belongs to the app lens.

## Regression surface (by grep)

- `kickWorkerIfNeeded` and `hasDuePendingJobs` are imported only by `tests/phase2_schedule_worker_trigger.test.js`. `schedule-collections.js` is invoked only by pg_cron job 7. The other repo hits are comments (`planConfig.ts`, `onboard-client.js`, `provision-account.js`, `stripe-webhook.js`, `_auth.js`). `refresh_cadence.test.js` and `enqueue_history.test.js` pin its source, and both are green.
- The response body gains `workerTriggered`, and `job_runs.detail` gains `worker`. No reader of `job_runs.detail` for this job depends on the old shape. The watchdog reads `ok` and the age of the row, per `docs/ops/alerting-runbook.md`.
- `public.prompts` writers from the browser are `Prompts.tsx:210`, `:244-245` and `:275`. These are what the N7 column grant must keep working. Service-key writers (`onboard-client.js`, `_enqueue.js`, `mcp-server.js` and others found by `rg "from('prompts')"`) bypass grants.
- Paths needing a manual look: the amended migration's column privileges, and an admin editing a prompt in the real UI after the grant change.

## Data and claim integrity

- Builder: "viewer DELETE 0, viewer UPDATE is_active 1, admin DELETE 1, 12 ai_results cascaded, control viewer DELETE 1". The first three, and the cascade, reproduced (on prompt 486 rather than 481). I did not re-run the control. The live policy read back today still allows a viewer DELETE, which is consistent with it.
- Builder: "Without DELETE a viewer cannot remove the parent row mid-call, so the insert lands" (migration header lines 25-26). **False as stated.** UPDATE of `id` removes the parent key just as well (N7).
- Builder: "collection_jobs is 1,583 rows, all done, 0 pending". Reproduced: 1,583 rows, 0 pending.
- Builder: test counts 99, 11, 48, 65, 13, 5, 17, 23 and tsc 0. All reproduced.
- Builder: the mutant results B0 to B5 and C1 to C3. Each was reproduced by an equivalent independent mutant (S1 to S7, I1, I2). The counts differ only where my mutants differ in shape.
- Builder: dash counts 12, 3 and 3, with the new files at 0. Reproduced.
- Live reads made here: the `prompts` policies (before and after), the FKs on `prompts` and their actions, the trigger `enforce_prompt_cap` (body read), column UPDATE privileges for `authenticated` and `anon`, the `ai_results` policies (no viewer UPDATE or DELETE) and constraints, `claim_collection_jobs` (SKIP LOCKED), cron job 7, the `collection_jobs` counts, and `prompts_id_seq`.

## What was not checked

- Anything that needs git: the full diff and diff stat, and whether a file outside the builder's list changed.
- A real PostgREST `PATCH` that changes `id`, and the real engine timing. The renumber was proven at the database level under the same role and JWT claims PostgREST uses, not over HTTP.
- The builder's live-policy control (viewer DELETE = 1 under today's policy) was not re-run. Today's policy text was read instead.
- The proposed N7 grant or trigger fix. It does not exist yet, so nothing about it is verified.
- The deployed scheduler (code only, not deployed), Sentry, and real cron invocation of the new branch. The reaper migration is still not applied.
- The app lane (Prompts.tsx archive UI, `promptRemoval.ts`, the page sequencing work), bg-copy sign-off on the archive copy, the browser and light mode.
- The `prompts_select TO public` observation the builder raised. By reading it is a no-op for anon (both branches are false without a JWT), and I did not probe it as anon.
