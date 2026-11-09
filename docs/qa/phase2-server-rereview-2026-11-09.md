BLOCK: the F1 fix closes every case the first review named (fake id, foreign id, forged text, inactive prompt, lookup error), but a viewer can still buy unlimited engine calls through the same three handlers in two ways, and one of them is a three-line fix inside the files under review.

# Phase 2 server lens re-review, 2026-11-09

```
INTENT: re-review Phase 2 lane 2A after the F1/F3/F4 fix round  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, server lens. I did not build this and edited no reviewed file. No git command other than `git show HEAD:<path>`, no build, no dev server, no browser. Database access was read-only SELECT against duiyifepitvugyulobqm. Every probe and mutation ran on copies under `C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\rr\`. Prior review: `docs/qa/phase2-server-review-2026-11-08.md`.

---

## HUMAN CHECKPOINT: the live spend exposure is still open after this fix

The live collectors (pre-fix) still carry the F1 hole the first review raised. This fix round does not fully close it. Two concrete ways remain for any signed-in viewer, including the competitor account, to make the engines run while no `ai_results` row lands, so the hourly ceiling, the client budget and the platform ceiling never move.

**N1, a single-element array as the id (BLOCKER, fixable in scope).** Send `"prompt_id": [7]` where 7 is the viewer's own active prompt.
1. postgrest-js 2.110.0 serializes every filter with a template literal: `eq(column, value) { this.url.searchParams.append(column, \`eq.${value}\`) }` (`node_modules/@supabase/postgrest-js/dist/index.cjs:1447-1448`). `[7]` becomes `eq.7`, so `loadPromptForCollect` finds prompt 7, sees `client_id` 42, and passes (`collect-claude.js:70-81`, the same in the other two files).
2. The handler keeps using the raw body value. `collectEngines` gets `prompt_id` from the body (`collect-claude.js:174-176`, `collect-chatgpt.js:179-182`, `collect-prompt.js:234-236`) and `buildResultRow` copies it into the row unchanged (`_collect.js:990`).
3. The insert then fails. Read live, read-only: `select x.prompt_id from json_to_recordset('[{"prompt_id":[7]}]'::json) as x(prompt_id integer)` raises `22P02: invalid input syntax for type integer: "[7]"`. `json_populate_recordset(null::public.ai_results, ...)` with `client_id: [42]` raises the same. A digit string `"7"` casts fine, so only the array form breaks.
4. The engine has already been billed and no row exists. The monthly skip (`collect-claude.js:155-167`) only stops the loop once an ok row exists for that prompt and engine, and none ever lands. The viewer can always get a prompt with no row: live RLS lets a viewer INSERT prompts of its own client (`prompts_insert`, `is_admin() OR has_client_access(client_id)`, read live).

**Reproduced** against the real edited collectors (`scratchpad\rr\probe_array_id.js`, a fake DB whose `eq` stringifies like postgrest-js and whose insert rejects non-integer ids like Postgres, and a limits stub that counts rows like `_auth.js:261-267`), 20 posts each:

```
collect-claude.js control prompt_id 7: 20 posts -> engine calls 1, ai_results rows 1, last 200 {"skipped":true,"llm":"claude"}
collect-claude.js fake prompt_id 999999: 20 posts -> engine calls 0, ai_results rows 0, last 404 {"error":"Prompt not found"}
collect-claude.js prompt_id [7]: 20 posts -> engine calls 20, ai_results rows 0, last 200 {"done":false,"llm":"claude","reason":"insert_error"}
collect-chatgpt.js prompt_id [7]: 20 posts -> engine calls 20, ai_results rows 0, last 200 {"done":false,"llm":"chatgpt","reason":"insert_error"}
collect-prompt.js control prompt_id 7: 20 posts -> engine calls 5, ai_results rows 5, last 429 {"error":"ceiling","reason":"hourly_ceiling"}
collect-prompt.js prompt_id [7]: 20 posts -> engine calls 100, ai_results rows 0, last 200 {"done":false,"prompt_id":[7],"reason":"insert_error",...}
```

The same probe with `"client_id": [42]` also reaches the engine in the harness (the ownership check at `collect-claude.js:103` compares `String([42])` to `"42"`). The real `checkCollectionLimits` probably fails closed on that variant, because `sum_cost_eur` would receive an array for its integer argument and `_auth.js:200,279` then blocks with `budget_unverifiable`. I did not run that against PostgREST, so I treat the `client_id` variant as plausible only. The `prompt_id` variant never reaches `checkCollectionLimits` with the array, so nothing there stops it.

**Fix proven in a scratch copy** (`scratchpad\rr\patch_fix.js` on `scratchpad\rr\fix\`, the repo untouched, `grep -c "Invalid id"` on the repo file returns 0). One guard after the required-fields check in each collector:

```js
const isId = (v) => (typeof v === 'number' && Number.isSafeInteger(v) && v > 0) || (typeof v === 'string' && /^[1-9][0-9]{0,15}$/.test(v))
if (!isId(prompt_id) || !isId(client_id))
  return { statusCode: 400, headers: auth.headers, body: JSON.stringify({ error: 'Invalid id' }) }
```

With it, all six array vectors give 400 and 0 engine calls, and the controls are unchanged (claude and chatgpt 1 call then skip, collect-prompt 5 calls then 429). Belt and braces for the builder: also return `data.id` and `data.client_id` from `loadPromptForCollect` and use those canonical values in every later query, the delete and `collectEngines`, so no body value reaches a row.

**N2, a viewer-controlled delete race (MAJOR, needs a ruling).** The builder recorded the remaining FK path as "a race ... bounded to one call per delete". It is not bounded, because the viewer controls the delete. Live RLS lets a viewer DELETE its own client's prompts (`prompts_delete`, read live), and the delete cascades (`ai_results_prompt_id_fkey ... ON DELETE CASCADE`, read live). Loop: insert a prompt, POST a collect with its real id, delete the prompt while the engine answers (ChatGPT with web search takes up to about 25 s), and the insert fails on the FK. Every gate reads inserted rows only.

Reproduced (`scratchpad\rr\probe_delete_race.js`, FK enforced on insert, the delete performed inside the engine window):

```
collect-claude.js create, collect, delete during call x20 -> engine calls 20, ai_results rows 0, last 200 {"done":false,"llm":"claude","reason":"insert_error"}
collect-chatgpt.js create, collect, delete during call x20 -> engine calls 20, ai_results rows 0, last 200 {"done":false,"llm":"chatgpt","reason":"insert_error"}
collect-prompt.js create, collect, delete during call x20 -> engine calls 100, ai_results rows 0, last 200 {"done":false,"prompt_id":1019,"reason":"insert_error",...}
```

This cannot be fixed inside the three collectors, so it is `/escalate` (NEEDS_HUMAN). Options for Constantin:
- (a) A spend ledger with no FK to `prompts`, written before or right after the engine call and read by `checkCollectionLimits`. Robust, needs a table and an `_auth.js` change.
- (b) Take DELETE on `prompts` away from non-admins (RLS), so a viewer retires a prompt with `is_active = false` instead. Smallest change, also stops a viewer erasing its own history through the cascade. Needs a check that the Prompts page does not delete as a viewer.
- (c) On an insert failure, write the error row again with `prompt_id` null so the cost is counted. Breaks the spec section 0.1 invariant the pages rely on, which is why the builder declined it.
My recommendation is (b) now and (a) later. Either way N1 must ship in the same build as the F1 fix.

---

## Calibration

1. **Diff stat:** not run, git is forbidden in this run. I compared the three collectors against `git show HEAD:` copies instead. collect-prompt.js: the only changes are the new `loadPromptForCollect`, its call and `prompt_text: promptText` in the `collectEngines` call. collect-claude.js and collect-chatgpt.js: the Phase 2 gate (already reviewed), plus `loadPromptForCollect` and the removal of `detail`. All three plus the two test files are the files the builder lists. I cannot prove from git that nothing else changed.
2. **Secret scan:** rg over the two test files and the three collectors: 0 real values. Hits are `Bearer` header construction and the placeholder `test-service-key-placeholder`.
3. **Criteria:** the F1 to F6 fix directions of the prior review plus the run's own list (fake id, foreign id, forged text, inactive prompt, admin path, worker path, every caller, Phase 1 regressions). All objectively checkable.
4. **Baseline:** prior review: `phase2_collector_gate` 36 passed. Now: see the table below. `npx tsc --noEmit` exit 0.
5. **Most sensitive auth check:** `requireAuth(event)` at `collect-claude.js:85`, `collect-chatgpt.js:85`, `collect-prompt.js:104`; ownership at `:103`, `:103`, `:120`; prompt ownership at `loadPromptForCollect` (`:70-82`, `:70-82`, `:88-100`).
6. **Writes:** only this file. Mutations and probes ran on scratch copies.

CALIBRATED, with the git-dependent part of item 1 listed under "Not checked".

---

## Prior findings

| Id | Status | Evidence |
|---|---|---|
| F1 | **OPEN** | Every case the first review named is closed: fake id 404 with 0 engine calls (probe above, all three files), foreign id 403 for viewer and admin, forged text replaced by stored text, inactive refused for a viewer, lookup error 500. Independent mutants K1 to K7 below are all killed. But the unbounded-spend class it describes is still reachable through N1 (reproduced, fixable in scope) and N2 (reproduced, needs a ruling). |
| F2 | **accepted (pending Constantin's ruling)** | The builder notes restate the options: (a) `schedule-collections.js` triggers the worker whenever a due `pending` job exists, (b) the reaper invokes the worker through `pg_net` with a Vault key, (c) the reaper fails stuck jobs instead of requeueing. Nothing was built, as intended. |
| F3 | **closed** | Reproduced independently in a scratch copy. M9 (drop `.eq('client_id', client_id)` from the Claude skip) fails `claude: monthly skip: another client ok row for the same prompt_id does not block a collect`. M10 (drop `.neq('status','error')` from the ChatGPT skip) fails `chatgpt: monthly skip: an error row this month does not block a collect`. Baseline 48 passed, 0 failed. |
| F4 | **closed** | `collect-claude.js:181-190` and `collect-chatgpt.js:187-196` return `{ done: false, llm, reason: 'insert_error' }` with no `detail`; the message stays in `console.error` and `captureException`. The probes above show the body. Mutant M12 (put `detail: insErr.message` back in Claude) fails `claude: insert failure: done false, reason insert_error, no detail and no driver text in the body`. |
| F5 | **open (docs only, INFO)** | `rg "nulls last"` finds 0 hits in `docs/arch/phase2-results-layer-spec.md`; the migration carries it at `db/supabase-client-results-latest-rpc-2026-11-08.sql:109-110`. Owner bg-architect: put `nulls last` in spec 2.2 so acceptance 2.1 holds. |
| F6 | **accepted** | Info only. `readAllById` page consistency matters above 1,000 rows per client; today's maximum is 589. |

---

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| C1 | A fake `prompt_id` costs nothing | PASS | Probe: 20 posts, 0 engine calls, 0 rows, `404 {"error":"Prompt not found"}` in all three files. Suite check `fake prompt_id: 404 Prompt not found, no limits check, no engine, no row`. |
| C2 | A foreign `prompt_id` is refused, admins included | PASS | `collect-*.js` `loadPromptForCollect` line `if (String(data.client_id) !== String(clientId)) return { status: 403 ... }`. Mutant K3 (line removed in collect-prompt.js) fails 5 checks, first `foreign prompt_id (client 43) under the viewer own client_id: 403, no engine, no row`. |
| C3 | A forged viewer `prompt_text` never reaches an engine | PASS | `text: isAdmin ? bodyText : data.text`. K2 (chatgpt always body text) and K4 (collect-prompt passes `prompt_text` to `collectEngines`) each fail `forged prompt_text from a viewer: the engine gets the stored text`. |
| C4 | Inactive prompt refused for a viewer, collected for an admin | PASS | K5 (inactive branch removed in Claude) fails 4 checks, first `inactive prompt, viewer: 200 skipped prompt_inactive, no limits check, no engine`. Live: `is_active` 383 true, 71 false, 0 null (builder's read). |
| C5 | Prompt lookup runs before limits, the plan gate, any delete and any engine call | PASS | Line order in all three files (lookup at `:114`/`:114`/`:132`, clients read after, limits after, delete at `collect-prompt.js:196-210` after). A scratch mutant that moves the chatgpt lookup below the limits call fails 3 checks, first `fake prompt_id: 404 Prompt not found, no limits check, no engine, no row`. |
| C6 | Lookup error never falls through to collecting | PASS | K7 (500 branch removed in collect-prompt.js) fails 5 checks, first `prompts lookup error: 500, no engine (never falls through to collecting)`. |
| C7 | Admin path | PASS | Admin keeps body text and may collect inactive prompts; foreign prompt is 403 for an admin; admin force on a foreign prompt deletes nothing (suite check). `effectiveForce` unchanged. |
| C8 | Worker path unaffected | PASS | `collection-worker-background.js:78-80` uses `job.prompt_id` and `job.prompt_text`, which `_enqueue.js:113-118` reads from `prompts` filtered by `client_id` and `is_active = true` and writes at `:236-246`. No body value reaches it. |
| C9 | Every caller still works | PASS (by reading) | The only HTTP caller is `collectionContext.tsx:402-404`, sending numeric `prompt_id`, the stored `prompt_text` and `client_id` (`:366-376`). A 404 or 403 becomes `reason = body.error` at `:413-415`; a viewer `skipped` becomes `reason = 'skipped'` at `:430-433`. Repo grep found no other caller. |
| C10 | Spend bounded per viewer on these endpoints | **FAIL** | N1 and N2 above. |
| C11 | collect-prompt.js Phase 1 behaviour unchanged | PASS with a condition | Diff against `git show HEAD:` shows only the added lookup and the stored-text substitution; `resolveEngines`, `effectiveForce`, `force_ignored`, the cap and the force delete are byte-identical. `tests/phase1_server_hardening.test.js` in the repo: 59 passed, 6 failed. The builder's scratch copy differs from the repo file in exactly two lines (the `FN` path and one `prompts` fixture line, verified with `diff`) and runs 65 passed, 0 failed. Condition: N3. |
| C12 | Each fix has a test that fails without it | PASS for F1 (named cases), F3, F4 | K1 to K7, M9, M10, M12 above. No test covers N1 or N2. |
| C13 | No em or en dash added | PASS | rg with a control file that fires (count 1). Test files 0. collect-prompt.js 12 now, 12 at HEAD; collect-claude.js 3 now, 5 at HEAD; collect-chatgpt.js 3 now, 5 at HEAD. All remaining hits are comments. |
| C14 | No real names in fixtures | PASS | Fixtures use `Acme Example`, `acme.example`, `Testville`, `Testland`. |
| C15 | Type check | PASS | `npx tsc --noEmit` exit 0. |

Test runs in the repo, from `brandgeo-dashboard/`:

```
node tests/phase2_prompt_ownership.test.js   53 passed, 0 failed
node tests/phase2_collector_gate.test.js     48 passed, 0 failed
node tests/phase1_server_hardening.test.js   59 passed, 6 failed
node tests/enqueue_force_gate.test.js        13 passed, 0 failed
node tests/engine_routing.test.js            5 checks passed
node --check on the three collectors         ok
```

The six phase1 failures: `no body engines on growth`, `free client asking google_ai`, `client lookup error: 500`, `viewer + force on a cell that already ran`, `viewer + force on a fresh cell`, `admin + force`. All are the fixture's `promptDb` answering `{data:null}` for the new `prompts` read.

## Independent mutation results (scratch copy, `scratchpad\rr\mutate_run.js`)

| Mutant | Result against `phase2_prompt_ownership` |
|---|---|
| baseline, unmutated copy | 53 passed, 0 failed |
| K1 claude: no 404 branch | 49 passed, 4 failed |
| K2 chatgpt: viewer text from body | 51 passed, 2 failed |
| K3 prompt: no 403 branch | 48 passed, 5 failed |
| K4 prompt: engines get body prompt_text | 52 passed, 1 failed |
| K5 claude: inactive allowed for viewers | 49 passed, 4 failed |
| K6 chatgpt: lookup moved below the limits call | 50 passed, 3 failed |
| K7 prompt: 500 branch falls through | 48 passed, 5 failed |
| K8 chatgpt: `checkCollectionLimits` call removed | **48 passed, 0 failed on `phase2_collector_gate` (survives)**: N4 |

---

## Security findings, by severity

**N1, BLOCKER.** Array id bypasses the F1 gate. Where: `collect-claude.js:97-126,174-181`, `collect-chatgpt.js:97-126,179-187`, `collect-prompt.js:115-144,234-243`, `_collect.js:990`. Exploit, reproduction and proven fix in the checkpoint above. Owner bg-backend on Opus. Add to `tests/phase2_prompt_ownership.test.js`: posts with `prompt_id: [7]`, `client_id: [42]`, `prompt_id: {}`, `prompt_id: 7.5`, `prompt_id: "7x"`, each expecting 400 and 0 engine calls, using a fake insert that rejects non-integer ids so the old code fails the check.

**N2, MAJOR, needs a ruling.** Viewer-controlled delete race. Where: RLS `prompts_delete` and `prompts_insert` on `public.prompts`, `ai_results_prompt_id_fkey ... ON DELETE CASCADE`, the insert at `collect-claude.js:181`, `collect-chatgpt.js:187`, `collect-prompt.js:243`, the row-counting gates at `_auth.js:261-267,278`. Reproduction and options in the checkpoint. `/escalate`.

**N3, MEDIUM, process.** `tests/phase1_server_hardening.test.js` is red in the repo until its `promptDb` fixture learns the `prompts` table. `dashboard-ci.yml` runs the tests on every push to `main`, so pushing the collectors without the fixture makes CI red and mails a failure. The one line, verified in the builder's scratch copy to give 65 passed, 0 failed: in `promptDb`, before `if (st.table === 'clients') return { data: clientsRow, error: clientErr }` (around line 259), add `if (st.table === 'prompts') return { data: { id: 7, text: 'best dentist near me', client_id: 42, is_active: true }, error: null }`. It must ride the same commit. The file sits outside the builder's scope, so the orchestrator has to grant it to bg-backend.

**N4, LOW, test coverage.** Removing the `checkCollectionLimits` call from `collect-chatgpt.js` survives both Phase 2 suites (48 passed, 0 failed; reproduced in a scratch copy). The same holds by construction for `collect-claude.js`, whose suites stub limits the same way. A future edit could drop the spend gate unnoticed. Fix: one check per file that a collect calls the limits stub exactly once, and one where the stub answers `blocked` and the handler returns 429 with 0 engine calls.

**N5, INFO.** 404 versus 403 tells a viewer whether a prompt id exists in another client. It reveals existence only, never text or owner. Ids are sequential, so this adds little. Accept, or answer 404 for both.

**N6, INFO, so nobody reads more into the control than it gives.** Using the stored text does not restrict what a viewer can send to an engine: live RLS `prompts_update` lets a viewer rewrite `prompts.text` and `is_active` of its own client. The control's real value is that the call is tied to a row that inserts and counts. That holds once N1 and N2 are closed.

---

## Accessibility

Not applicable to this lens. No server change ships text or an interactive element. The app lanes are another lens.

## Regression surface (by grep)

- `collect-prompt`, `collect-claude`, `collect-chatgpt` are called only from `src/lib/collectionContext.tsx:402-404` (the refresh button sits inside `{isAdmin && ...}` per the prior review). The other grep hits are comments (`fixPrompt.ts:94`, `planConfig.ts:162-184`).
- `loadPromptForCollect` is exported from all three files and imported only by `tests/phase2_prompt_ownership.test.js`.
- `collectEngines`: `collection-worker-background.js:78` and the three collectors. Unchanged.
- Paths that need a manual look: `tests/phase1_server_hardening.test.js:259` (N3), `public.prompts` RLS (N2), the Prompts page delete path if option (b) is chosen.

## Data and claim integrity

- Builder: "unbounded billed engine calls with fake prompt_ids ... are now 0". True for a numeric fake id (reproduced). **Not true as a general spend claim** (N1, N2).
- Builder: "the FK failure path only remains on a race ... bounded to one call per delete". The race is real; "bounded" is wrong because the viewer can insert and delete prompts at will under RLS (read live).
- Builder: phase1 suite "59 passed, 6 failed ... with that one line it runs 65 passed, 0 failed". Reproduced both numbers, and the scratch file differs only by that line and the path constant.
- Builder: "53 passed" and "48 passed (was 36)". Reproduced.
- Builder: "Every dash line still in the three collectors also appears in git show HEAD versions". Reproduced by count: no file gained a dash.
- Builder: "0 added model calls ... one Supabase primary-key read per invocation". True by reading.
- Live reads made here: `ai_results` FKs (`client_id` to `clients(id)`, `prompt_id` to `prompts(id) ON DELETE CASCADE`), the five `prompts` RLS policies, and the two 22P02 casts.

## What was not checked

- Everything that needs git: the full diff and diff stat, and whether an unlisted file changed.
- A real PostgREST insert of an array id. The 22P02 was shown with `json_to_recordset` and `json_populate_recordset` read-only, not through PostgREST, because writes are forbidden.
- The real `checkCollectionLimits` with `client_id: [42]`; I believe `sum_cost_eur` fails closed on it but did not run it.
- The real N2 timing against live engines, and whether the Prompts page lets a viewer delete in the UI (only RLS was read).
- The prior review's `scratchpad/mut/tests/fk_bypass_probe.js` was not rerun as such; `probe_array_id.js` covers the same fake-id case against the current files (404, 0 engine calls).
- Live Netlify behaviour, real tokens, the app lanes (loader, provider, pages, CSV), light mode, the reaper and the RPC as created functions (still not applied).
