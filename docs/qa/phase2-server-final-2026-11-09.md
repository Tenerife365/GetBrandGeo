PASS WITH FINDINGS: N1, N3 and N4 are closed and reproduced, with no regression in the three collectors. N2 stays open as an accepted risk until Constantin rules, so criterion C10 (spend bounded per viewer) is still FAIL and is carried as that accepted risk. I am not approving it.

# Phase 2 server lens final review, 2026-11-09

```
INTENT: final review of Phase 2 lane 2A after the N1/N3/N4 fix round  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, server lens. I did not build this, and I edited no reviewed file. The only git command was `git show HEAD:<path>`. There was no build, no dev server and no browser. Database access was read-only SELECT against duiyifepitvugyulobqm. Every probe and mutant ran in `C:\Users\const\AppData\Local\Temp\claude\12b463c33e04e536\480feb20-92ad-4e24-a739-62986901bb51\scratchpad\final\` (a copy of `netlify/functions` and `tests`, with `node_modules` reached through a junction). Prior reviews: `docs/qa/phase2-server-review-2026-11-08.md` and `docs/qa/phase2-server-rereview-2026-11-09.md`.

---

## HUMAN CHECKPOINT: live exposure, unchanged by this review

1. **Production still has the F1 hole.** The live collectors are the HEAD versions: they have no prompt lookup and no id guard. In my scratch run, the HEAD `collect-prompt.js` answered `prompt_id [7]` with 25 engine calls and 0 rows over 5 posts. This change closes F1 and N1. It narrows the live exposure, and it only takes effect once it ships.
2. **N2 is still open.** A viewer can insert a prompt, start a collect, and delete the prompt while the engine is answering. Live RLS still reads `prompts_delete` as `is_admin() OR has_client_access(client_id)` (checked again today). This needs Constantin's ruling: (b) remove DELETE on `prompts` for non-admins, or (a) add a spend ledger.

---

## Calibration

1. **Diff:** git diff is forbidden in this run, so I compared each file with `git show HEAD:` instead. `_collect.js`, `_auth.js` and `collection-worker-background.js` are unchanged. `tests/phase1_server_hardening.test.js` differs from HEAD by exactly one added line (259, the N3 line). In `collect-prompt.js`, the only changes are `loadPromptForCollect`, `parseId`, the raw/body/row id split, the 400 guard, `prompt_text: promptText` and two exports. `resolveEngines`, `effectiveForce`, the cap, the force delete and the insert are byte-identical apart from the variable source. All of these files are in the builder's list. Whether some unlisted file changed cannot be proven without git.
2. **Secret scan** (rg, names only) over the three collectors and the two test files: 0 real values. The hits are the `Bearer` parsing in the test harness and the placeholder service key.
3. **Criteria:** close N1, N3 and N4 with reproduced evidence; check for regressions in all three collectors; run every test that loads them. All of these can be checked objectively.
4. **Baseline:** the re-review measured phase2_prompt_ownership 53/0, phase2_collector_gate 48/0, phase1 59/6 and tsc exit 0.
5. **Most sensitive auth check:** `requireAuth(event)` at the top of each handler. The viewer client match is at `collect-claude.js:133`, `collect-chatgpt.js:133` and `collect-prompt.js:151`. It now compares against the parsed `bodyClientId`. Prompt ownership is checked in `loadPromptForCollect`, at `collect-claude.js:74-87` and the equivalent lines in the other two files.
6. **Writes:** only this file.

CALIBRATED. The git-dependent part of item 1 is listed under "What was not checked".

---

## Prior findings

| Id | Status | Evidence |
|---|---|---|
| N1 | **closed** | See the attack below: 49 malformed forms × 2 fields × 2 roles × 3 files × 5 posts, with 0 cases where an engine was billed and no row landed. Independent mutants are listed below. Each layer of the fix, removed on its own, fails `phase2_prompt_ownership`. |
| N2 | **accepted (pending Constantin's ruling)** | No code was written for it, as instructed. Live RLS is unchanged (`prompts_delete`, `prompts_insert`, `prompts_update` all `is_admin() OR has_client_access(client_id)`, read today). C10 stays FAIL. |
| N3 | **closed** | The repo `phase1_server_hardening` runs 65 passed, 0 failed. The diff against HEAD is the single `prompts` fixture line. Mutant (line removed, scratch copy): 59 passed, 6 failed, first `no body engines on growth: runs the plan fast set, not all six`. |
| N4 | **closed** | Three independent mutants, each killed (table below): the limits call removed in Claude, limits called with the body id in collect-prompt, the blocked answer ignored in ChatGPT. |
| N5, N6 | accepted (INFO) | Unchanged, no code needed. |
| F2 | accepted (pending ruling) | Out of this round. |

---

## N1 attack (scratch `probe_ids.js`, real repo collectors loaded read-only)

How the fake behaves: `eq(col, v)` sends `` `eq.${v}` `` the way postgrest-js 2.110.0 does. The integer columns are cast the way Postgres casts them: whitespace and a sign are accepted, anything else is 22P02, and a value out of int4 range is 22003. The `ai_results` insert rejects a non-integer id with 22P02. `collectEngines` is a stub that counts engine calls. Counted as UNSAFE: any outcome other than a 400, 403, 404 or 500 with 0 engine calls and 0 rows.

Forms tried, for `prompt_id` (with `client_id` 42) and for `client_id` (with `prompt_id` 7):
`[7]`, `[[7]]`, `[[[7]]]`, `["7"]`, `[7,8]`, `[]`, `{}`, `{"0":7}`, `{"id":7}`, `true`, `false`, `null`, `7.5`, `-7`, `-0`, `0`, `0.0`, `"0"`, `"-7"`, `" 7"`, `"7 "`, `"\t7"`, `"7\n"`, `"\n7"`, `"+7"`, `"07"`, `"007"`, `"7.0"`, `"7e0"`, `"1e2"`, `"0x7"`, `"7x"`, `""`, `" "`, Arabic-Indic digit seven, fullwidth digit seven, `"7\u0000"`, `1e21`, `9007199254740992`, `9007199254740993`, `"9007199254740993"`, `"99999999999999999999"`, `1.7976931348623157e308`, `-9007199254740991`, `"NaN"`, `"Infinity"`, a 400-digit string, `2147483648`, `"2147483648"`.
Also tried: a duplicate key (`"prompt_id":7,"prompt_id":[7]`), `__proto__` smuggling, a `null` body and an array body.

```
forms tried 49 x 2 fields x 2 roles x 3 files x 5 posts; UNSAFE count: 0
refusals: 492 x 400 Invalid id, 72 x 400 Missing required fields (falsy: 0, -0, 0.0, false, null, ""),
          12 x 500 Prompt lookup failed (2147483648 as prompt_id, see I1),
          6 x 403 Forbidden: client mismatch and 6 x 403 prompt does not belong (2147483648 as client_id)
edge dup key last [7]      -> 400 {"error":"Invalid id"}               engine 0 rows 0   (all 3 files, both roles)
edge __proto__ prompt_id   -> 400 {"error":"Missing required fields"}  engine 0 rows 0
edge body array            -> 400 {"error":"Missing required fields"}  engine 0 rows 0
edge body null             -> THROW Cannot destructure property 'prompt_id' of 'body' as it is null, engine 0 rows 0  (I2, pre-existing)
```

Valid forms keep working, and the row and limits get the canonical numbers (both roles, all three files):

```
valid collect-prompt.js viewer prompt_id 7     -> 200 engine 5 rows 5 rowIds number:7/number:42 ... limitArgs [42] CANONICAL
valid collect-prompt.js viewer prompt_id "7"   -> 200 engine 5 rows 5 rowIds number:7/number:42 ... limitArgs [42] CANONICAL
valid collect-claude.js viewer prompt_id 70e-1 -> 200 engine 1 rows 1 rowIds number:7/number:42 limitArgs [42] CANONICAL
valid collect-chatgpt.js admin prompt_id 7e0   -> 200 engine 1 rows 1 rowIds number:7/number:42 limitArgs [42] CANONICAL
```

`7.0`, `7e0` and `70e-1` are JSON numbers that `JSON.parse` turns into 7, so accepting them is correct. The string forms `"7.0"` and `"7e0"` are rejected.

## Independent mutants (scratch `mutants.js`, repo untouched, restored after each)

| Mutant | Probe | phase2_prompt_ownership | phase1 |
|---|---|---|---|
| baseline | 0 unsafe | 87 passed, 0 failed | 65/0 |
| HEAD collectors (no F1, no N1) | `prompt_id [7]` -> 200 insert_error, engine 25, rows 0 | 15 passed, 72 failed | 65/0 |
| `parseId` returns its input unchanged (row ids kept) | malformed ids now reach the engine, but rows land with canonical ids, so spend stays counted | 77 passed, 10 failed, first `N1: prompt_id [7] posted 20 times by a viewer: 400 each, 0 engine calls, 0 rows` | 65/0 |
| body ids used downstream (`parseId` kept) | no billed-without-row case; 6 non-canonical `"7"` rows | 75 passed, 12 failed, first `N1: digit strings "7" and "42" are accepted; the engine and the row get the numbers` | 65/0 |
| both layers removed | 84 unsafe, first `prompt_id [7]` -> insert_error, engine 25, rows 0 | 65 passed, 22 failed | 65/0 |
| `parseId` accepts surrounding whitespace | `" 7"` reaches the engines | 83 passed, 4 failed (`every malformed id is 400 Invalid id before any read`) | 65/0 |
| `parseId` accepts 0 and negatives | 0 unsafe (lookup 404) | 83 passed, 4 failed | 65/0 |
| claude: `checkCollectionLimits` removed | 0 | 84 passed, 3 failed, first `collect-claude: N4: a collect calls the limits check exactly once, with the canonical client_id` | 65/0 |
| prompt: limits called with `rawClientId` | 0 | 85 passed, 2 failed, first `collect-prompt: N4: ... with the canonical client_id` | 65/0 |
| chatgpt: `limitCheck.blocked` ignored | 0 | 86 passed, 1 failed, `collect-chatgpt: N4: limits blocked: 429 with the limits message and reason, 0 engine calls, 0 rows` | 65/0 |
| phase1 N3 fixture line removed | 0 | 87/0 | 59 passed, 6 failed |

What this shows: the fix has two independent layers, and each one alone stops the billed-without-row case. `parseId` refuses malformed ids before any read. The ids read from the row mean the insert always receives integers. The suite kills a mutant that removes either layer. `phase2_collector_gate` stays at 48/0 under every mutant here, so N4 coverage lives in `phase2_prompt_ownership` only, as the builder said.

Note for whoever reruns this: on the HEAD-collectors row, the probe stopped before it printed its total, after it had already printed the UNSAFE line quoted above. That row's evidence is the quoted line and the 72 suite failures, not a count.

---

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| C1 | A fake `prompt_id` costs nothing | PASS | 87/0 suite, including `fake prompt_id posted 20 times by a viewer: 0 engine calls`. |
| C2 | A foreign `prompt_id` is refused, admins included | PASS | Suite 87/0. Probe: `2147483648` as `client_id` gives a 403 for an admin. |
| C3 | Forged viewer text never reaches an engine | PASS | `text: isAdmin ? bodyText : data.text`, unchanged since the re-review. The suite check passes. |
| C4 | Inactive prompt refused for a viewer | PASS | The skip now carries the row's `prompt_id` (number). The suite check passes. |
| C5 | Id guard, then lookup, run before limits, delete and engine | PASS | `parseId` guard at `collect-claude.js:126-131`, `collect-chatgpt.js:126-131`, `collect-prompt.js:143-148`, before `createClient` and the lookup. A malformed id makes 0 reads (probe). |
| C6 | Every later step uses the row ids | PASS | `const prompt_id = promptCheck.promptId` / `client_id = promptCheck.clientId` (`collect-claude.js:154-155`, `collect-chatgpt.js:154-155`, `collect-prompt.js:172-173`). The probe shows `limitArgs [42]` and number ids in every row. The body-ids mutant is killed. |
| C7 | N1 malformed ids refused | PASS | Attack above: 0 unsafe. |
| C8 | N3 phase1 green in repo | PASS | 65 passed, 0 failed. |
| C9 | N4 limits gate covered in all three files | PASS | Three mutants killed (table). |
| C10 | Spend bounded per viewer | **FAIL, carried as accepted N2** | N2 not addressed, by instruction. RLS read today is unchanged. |
| C11 | Phase 1 behaviour of collect-prompt.js unchanged | PASS | Diff vs HEAD shown in calibration item 1. phase1 65/0. |
| C12 | Each fix has a test that fails without it | PASS | Mutant table. |
| C13 | No em or en dash added | PASS | rg with a control file that fires (count 1). Now: collect-prompt 12, collect-claude 3, collect-chatgpt 3. At HEAD: 12, 5 and 5. The two test files: 0. |
| C14 | No real names in fixtures | PASS | `Acme Example`, `acme.example`, `Testville`, `Testland`. |
| C15 | Type check and syntax | PASS | `npx tsc --noEmit` exit 0. `node --check` ok on all three collectors. |

Test runs in the repo, from `brandgeo-dashboard/`. These are every test that loads a collector, found by `grep -l "collect-prompt\|collect-claude\|collect-chatgpt" tests/*.js`, plus `enqueue_force_gate`:

```
node tests/phase2_prompt_ownership.test.js   87 passed, 0 failed
node tests/phase2_collector_gate.test.js     48 passed, 0 failed
node tests/phase1_server_hardening.test.js   65 passed, 0 failed
node tests/enqueue_force_gate.test.js        13 passed, 0 failed
node tests/engine_routing.test.js            5 checks passed
node --check collect-prompt.js / collect-claude.js / collect-chatgpt.js   ok
npx tsc --noEmit                             exit 0
```

---

## Security findings, by severity

**N2, MAJOR, accepted, pending ruling.** Unchanged from the re-review. The exploit and the options are in `docs/qa/phase2-server-rereview-2026-11-09.md`. `/escalate`.

**I1, INFO, new.** An id above 2147483647 passes `parseId`, because it is a safe integer. The prompts lookup then fails: `prompts.id`, `prompts.client_id`, `ai_results.prompt_id` and `ai_results.client_id` are all `integer` (information_schema, read today), and `select id from public.prompts where id = '2147483648'` raises `22003: value "2147483648" is out of range for type integer`. The collector answers `500 {"error":"Prompt lookup failed"}` and writes an error-level log line. Nothing is billed and nothing is written, so this is not a spend issue. It does let any signed-in caller produce error-level noise on demand. Where: `parseId` in all three files (`collect-claude.js:101-105` and the same function in the other two). Fix: in `parseId`, also require `n <= 2147483647`, so these become 400 Invalid id. Add `2147483648` and `"2147483648"` to the suite's malformed list.

**I2, INFO, PRE-EXISTING.** A JSON body of `null` throws `TypeError: Cannot destructure property 'prompt_id' of 'body' as it is null` in all three handlers (the HEAD versions destructure the same way). It surfaces as an unhandled error, not a 400. No spend. Fix: after `JSON.parse`, return 400 when `!body || typeof body !== 'object' || Array.isArray(body)`. Not a blocker for this release.

---

## Accessibility

Not applicable to this lens. No server change ships text or an interactive element.

## Regression surface (by grep)

- `parseId` and `loadPromptForCollect` are imported only by `tests/phase2_prompt_ownership.test.js`. The three copies agree under its drift guard, and the whitespace and zero mutants above, applied to all three, each fail it.
- The only HTTP caller is `src/lib/collectionContext.tsx:402-404`. It posts `prompt_id: promptId` and `client_id: clientId`, typed `number` at `:92` and `:331-333`, so it never reaches a 400 path. The skip and response bodies now carry the row's numeric `prompt_id`, the same value a numeric caller already sent.
- `collectEngines`, `_auth.js` and `collection-worker-background.js` are unchanged against HEAD, so the worker path is untouched.
- Paths that need a manual look: the `public.prompts` RLS (N2), and the Prompts page delete path if ruling (b) is taken.

## Data and claim integrity

- Builder: "phase1 65 passed, 0 failed (was 59/6)". Reproduced both numbers (repo and mutant).
- Builder: "phase2_prompt_ownership 87 passed". Reproduced.
- Builder: "phase2_collector_gate 48, unchanged file". Reproduced 48/0. Its mutant patterns still match.
- Builder: "a malformed id is refused before any Supabase read". True by reading (the guard sits before `createClient`), and the probe agrees.
- Builder: "dash counts 12, 3, 3, test files 0". Reproduced with a control that fires.
- Builder: "`\"07\"` and leading zeros rejected; digit strings normalized to numbers". Reproduced.
- Builder: "the fake insert rejects non-integer ids with 22P02 as Postgres does". Matches the live casts the re-review showed, and the 22003 range behaviour I read today.
- Live reads made here: column types of the four id columns, the five `prompts` RLS policies, and the 22003 out-of-range error.

## What was not checked

- Anything that needs git: the full diff and diff stat, and whether a file outside the builder's list changed.
- A real PostgREST round trip with a malformed id. The cast behaviour was modelled in the fake and confirmed against Postgres with read-only SELECTs only.
- N2 against live engines, and the real `checkCollectionLimits` with a non-canonical id. The latter can no longer happen, because limits get the row id.
- The app lane (`resultsGuards.ts`, `resultsLoader.ts`, `resultsContext.tsx`, the pages, `client_switch_guards.test.js`, the earlier provider and page switch probes). That is the app lens, not this one.
- Live Netlify behaviour, real tokens, Sentry capture of the 500 in I1, and the reaper and RPC as created functions.
