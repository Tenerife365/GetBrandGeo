VERDICT: PASS WITH FINDINGS (0 BLOCKER, 0 MAJOR, 2 MEDIUM, 6 LOW, 6 INFO)

# Fix states review: done, re-check and next fixes on the Fix This hub

Reviewer: bg-verify (Opus), read-only. Date: 2026-11-06.
Subject: uncommitted build on `main` against `docs/arch/fix-states.md`.
Files reviewed: `db/supabase-fix-states-migration-2026-11-06.sql`,
`brandgeo-dashboard/src/lib/fixStates.ts`, `brandgeo-dashboard/tests/fix_states.test.js`,
the fix-state hunks of `brandgeo-dashboard/src/pages/AIVisibility.tsx` and
`brandgeo-dashboard/src/lib/aiVisibilityCopy.ts` (read through `git diff`, read-only).
No source file was edited. No git command that writes was run. No build, no dev server.

Nothing here needs a block. The database side holds under every probe I could
construct. The two MEDIUM findings are in the browser logic: one can write a
verdict onto the wrong client's row during an admin client switch, and one
can print a false sentence and close a competitor fix as "Verified" on a
number that measures something else.

## 1. Standard checks, pasted

```
$ npx tsc --noEmit -p .            (from brandgeo-dashboard/)
TSC_EXIT=0

$ node tests/fix_states.test.js
24 passed, 0 failed
$ node tests/prompt_performance.test.js
50 passed, 0 failed
$ node tests/no_answer_rows.test.js
All checks passed.
```

`git diff --stat -- brandgeo-dashboard/src` (read-only):
```
 brandgeo-dashboard/src/lib/aiVisibilityCopy.ts |  44 +++
 brandgeo-dashboard/src/pages/AIVisibility.tsx  | 425 +++++++++++++++++++++++--
 2 files changed, 442 insertions(+), 27 deletions(-)
```
Every hunk in both files belongs to this feature (imports, fix state, `fixItems`
ids, the new fix block, `copyFix`, hub JSX). No other session's change sits in
these two files. New untracked files in scope: `src/lib/fixStates.ts`,
`tests/fix_states.test.js`, the migration, `docs/arch/fix-states.md`.

Secret scan over the diff of both files plus the three new files: 1 hit, a SQL
comment containing the word `service_role` (migration line 53). No value.

Dash scan (`rg` with a character class of U+2014 and U+2013) over the added
lines of both changed files and over the four new files: 0 hits. Positive
control (a string containing U+2014) returned 1.

`npm run build` NOT run, by instruction.

## 2. Acceptance criteria

Criteria taken from design section 9 step 3 and the review brief.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Viewer can insert, select and update own client's rows | PASS | Probe A P1, P2; probe B Q1, Q3 (viewer of client 5) |
| 2 | Viewer cannot select another client's rows | PASS | Probe B Q1: 3 rows exist (2 for client 5, 1 for client 1), viewer sees 2 |
| 3 | Viewer cannot insert for another client | PASS | Probe A P7: `new row violates row-level security policy` |
| 4 | Viewer cannot update another client's rows | PASS | Probe B Q2: `update ... where client_id=1` affects 0 rows |
| 5 | A row cannot be moved to another client_id | PASS | Probe A P3: update reports 1 row, row still reads client 5 (trigger pins). Probe B Q10: with the trigger disabled inside the transaction, the same move is refused by WITH CHECK |
| 6 | Viewer cannot delete | PASS | Probe A P6: delete affects 0 rows |
| 7 | `marked_by` stamped to auth.uid() even when payload spoofs it | PASS | Probe A P1: payload sent client 1's viewer uuid, stored value equals auth.uid() |
| 8 | `marked_at` cannot be backdated | PASS | Probe A P1 (insert with 2020-01-01) and P2 (update with 2020-01-01): both read now() |
| 9 | Baseline cannot change after done | PASS | Probe A P2 (update baseline 55 stays 0); probe B Q7 (upsert done on done keeps baseline 22, payload sent 77) |
| 10 | New row cannot start as verified or reopened | PASS | Probe A P5, P5b: trigger raises |
| 11 | Verdict refused before 7 days | PASS | Probe A P4: `a verdict needs 7 days after marked_at` |
| 12 | Verdict refused unless from done | PASS | Probe A P9 (dismissed to reopened), probe B Q5 (verified to reopened): both refused |
| 13 | Verdict accepted from done after 7 days, checked_at server-stamped | PASS | Probe B Q3: marked_at backdated 8 days as postgres with the trigger off, then as viewer: status verified, checked_at = now() although payload sent 2020-01-01 |
| 14 | Upsert ON CONFLICT (client_id, fix_id) behaves as the UI expects | PASS | Probe B Q6 (reopened to done: new baseline, new marked_at, check_value cleared), Q7 (done to done: baseline pinned) |
| 15 | Cross-tenant upsert refused, and refused the same way whether or not the other client has that row (no existence oracle) | PASS | Probe B Q8 and Q9: identical message |
| 16 | anon sees and writes nothing | PASS | Probe B Q11 (0 rows), Q12 (insert refused), Q13 (update 0 rows) |
| 17 | Production left clean | PASS | After all probes: `rows_after 0`, trigger `O`, RLS true |
| 18 | Every fix id generator matches `^[a-z_]{1,40}(:.{1,150})?$` | PASS | `fix_states.test.js` check 1; reviewer probe P3: `***`, a name with a newline (normalised to `a b`), accented names, 80 emoji (160 UTF-16 units, 85 code points) all pass. A whitespace-only name yields `outranked:` and fails the CHECK, but no generator path produces a blank competitor name |
| 19 | Verdict rule: 7 days, fresh coverage, +10 points or 0 to any | PASS WITH FINDINGS | `fixStates.ts:38-42, 221-224, 242-258`; DB trigger `migration:117`. See L1 (rounding) and L2 (80 percent vs "every cell") |
| 20 | Verdict effect cannot loop or double write | PASS | `AIVisibility.tsx:1069-1112`: `verdictInFlight` guards re-entry, success moves the row out of `done`, failure changes no dependency, so no loop. React StrictMode double effects are absorbed by the ref |
| 21 | Verdict effect cannot write on the wrong client after a switch | FAIL | M1 |
| 22 | `checkRequested` handling | PASS | `AIVisibility.tsx:1075-1084, 1114-1118`: notice set and request cleared on every branch where the row is done |
| 23 | Demo mode never touches Supabase | PASS | `loadFixRows` returns at `:575`, `markFix` and `reopenFix` return before the client call, verdict effect returns at the `isDemoMode` branch, `checkFixNow` calls `load` whose demo branch is `:458-470` |
| 24 | Client with no fix_states rows sees the same P0/P1/P2 items as before plus up to 10 P2 prompt gaps | PASS | Diff: each existing `items.push` gained only `id` and `metricKey`; `isOpenState(undefined)` is true; gaps appended after the existing P2 items, `slice(0, MAX_PROMPT_GAP_FIXES)` at `:955-972`. Ids are unique per render (visibility:all excludes engine_missing by the if/else; MISSING and PARTIAL are exclusive per engine) |
| 25 | Page does not break if the fix_states read fails | PASS | `AIVisibility.tsx:584-590`: logs, sets an empty map, sets loaded |
| 26 | Prompt table, engine cards and score untouched | PASS | No diff hunk outside the hub, its state and its imports |
| 27 | tsc exit 0 and the three node suites pass | PASS | Section 1 |

## 3. Security findings

No BLOCKER, no MAJOR. The tenant boundary holds: RLS, the WITH CHECK and the
trigger each refuse the cross-tenant move independently (criteria 2 to 6, 15).

### M1. MEDIUM: a verdict can be written onto the wrong client's row during an admin client switch

Where: `brandgeo-dashboard/src/pages/AIVisibility.tsx:605-614` (fix rows effect),
`:1069-1112` (verdict effect), `:574-602` (`loadFixRows`), `:455-558` (`load`),
`:1004-1036` (`markFix` response).

What: nothing ties `fixRows` and `results` to the client they were read for.
The verdict effect writes with the CURRENT `activeClientId` and the fix id of a
row that may belong to the PREVIOUS client:

```
.update({ status: ev.status, check_value: ev.value, check_n: ev.n })
.eq('client_id', activeClientId)
.eq('fix_id', row.fix_id)
.eq('status', 'done')
```

Reproduction, path 1 (deterministic given the timing):
1. Admin opens client A, which has a `done` row, for example `engine_missing:claude`,
   past 7 days with fresh answers. On load the verdict effect starts the write
   and adds the id to `verdictInFlight`.
2. Before the response returns, the admin switches to client B, which also has
   `engine_missing:claude` in `done` past 7 days (common ids: `visibility:all`,
   `engine_missing:<engine>`, `consistency`, `ranking`).
3. In that commit, effects run in declaration order. The effect at `:605` runs
   first and replaces `verdictInFlight.current` with an empty set. The `load`
   effect at `:560` has called `setLoading(true)`, but the verdict effect at
   `:1069` runs in the same commit with this render's closure: `loading` false,
   `fixRowsLoaded` true, `fixRows` and `results` still client A's,
   `activeClientId` now B, and `activeClientId` is a dependency, so it fires.
4. A's row is still `done` locally and no longer "in flight", so the effect
   computes A's verdict from A's data and sends the update above with
   `client_id = B`. RLS allows it (admin), the trigger allows it (B is done and
   past 7 days). B's row becomes `verified` or `reopened` with A's `check_value`.
   A `verified` row closes for good (design 4.3).

Path 2: `load` has no stale-response guard. A silent `load` started for A (Check
now, a collection completion) that resolves after B's load sets `results` and
`prompts` to A's data while `activeClientId` and `fixRows` are B's; `resultsKey`
changes, and the effect judges B's done rows against A's answers and writes the
verdict to B. Path 3 (display only): a `markFix` or `loadFixRows` response for A
that lands after the switch puts A's row into B's map, so B's Done list shows
A's title (which can carry A's prompt text).

Who can trigger it: only an admin, because only an admin can switch clients.
Not exploitable by a viewer or across tenants on purpose; it is a data
integrity defect in customer-visible state.

Demonstrated: the database half by probe B Q3 (a verdict update from `done`
past 7 days is accepted); the browser half by code trace of effect order. Not
reproduced in a browser (no dev server by instruction).

Fix (bg-app): record the client a read belongs to and refuse to act across a
switch. Concretely: keep `fixRowsClientId` beside `fixRows` and a
`resultsClientId` set by `load`; in `loadFixRows`, `load`, `markFix` and
`reopenFix` capture `const cid = activeClientId` before the await and drop the
response if a ref holding the current client differs; clear `fixRows` to an
empty map at the top of the `:605` effect; in the verdict effect return early
unless `fixRowsClientId === activeClientId && resultsClientId === activeClientId`,
and send `.eq('client_id', row.client_id)` instead of `activeClientId`.

## 4. Data and claim integrity

### M2. MEDIUM: a competitor fix can be "Verified" on a different number than its baseline, and the card says something false

Where: `brandgeo-dashboard/src/lib/fixStates.ts:180-187` (fallback),
`:244-258` (verdict), label `:113`, copy `aiVisibilityCopy.ts` `fixVerifiedLine`.

What: the baseline for `outranked:<rival>` is the brand's rate in answers that
name the rival. At the verdict, if the rival is named in none of the fresh
answers, `measureFix` falls back to the brand's rate over ALL fresh answers.
The two numbers measure different populations, `isImprovement` compares them
anyway, and the card prints the fallback number under the rival label.

Reproduction (reviewer probe, `node probe_fix.js` from `brandgeo-dashboard/`,
fixture of 5 prompts, 1 engine, fictional "Rival Co"):
```
P2 baseline {"value":0,"n":5} verdict {"state":"verdict","status":"verified","value":20,"n":5}
P2 card text: Verified 10 Nov: Mention rate where that competitor is named went from 0% to 20%.
```
In the fresh answers the rival is named nowhere, so "where that competitor is
named" is false, and the fix closes for good on a number that does not measure
it. The rival dropping out of answers is common (the top-ranked name rotates).

Fix (bg-app, with a ruling if preferred): when the rival is named in no fresh
answer, return `waiting` (or a distinct `not_measurable` state shown as "Rival
no longer named in recent answers"), never fall back for the verdict. If the
fallback is kept by decision, the label and copy must name the population
actually measured, and the comparison must use the same population at baseline.

### Every user-facing number traced

| Number on screen | Source |
|---|---|
| "N actions to improve your score", P0/P1/P2 counts | `openFixItems.length` and per-priority filter, `AIVisibility.tsx:987` |
| Prompt gap "N answers", "M of them named another brand" | `gaps` at `:955-966`: cells in `results` for the prompt (newest OK row per active engine), and cells with a non-empty `competitors_mentioned` array |
| "Done (N)" | `doneFixRows.length`, rows in done, verified or dismissed, `:988-990` |
| Verified "b% to a%" | `baseline_value` and `check_value` from `fix_states`, written by `markFix` (`measureFix` at mark) and the verdict effect (`evaluateFix`). See M2 and L1 |
| Reopened "is a% (was b%)" | same columns |
| "fresh of needed needed so far" | `evaluateFix` `fresh`, `needed` (`ceil(cells x 0.8)`), `fixStates.ts:246-247` |
| Dates | `marked_at`, `checked_at` (trigger-stamped) and `verdictCutoff` (marked_at + 7 days) |

### Copy, sentence by sentence (`FIX_COPY` and the `fix*` functions)

| Text | True of the code? |
|---|---|
| explainer "Mark it done when you have, and we check the number after a later collection." | True. The check runs when the page is opened after such a collection, not on the collection itself (I6 below is not about this; noted only) |
| allDone "All current fixes are done." | Shown when no open item exists and the Done list is not empty. Also shown when the remaining items were set aside ("Not for us"), where "done" is loose. Acceptable |
| manual "cannot be measured, so there is nothing to check" | True: shown only when the row has no parseable metric or baseline |
| `fixDoneWaiting` "We check the number on the first collection after X" | Approximately true: the verdict needs 80 percent of the scope fresh, so a partial first collection after X does not decide it (L2) |
| `fixDoneWaitingData` | True |
| `fixVerifiedLine` | False in the M2 case; otherwise true |
| `fixReopenedLine` "After the answers collected by Y" | Y is `checked_at`, the day the page took the verdict; answers were indeed collected by then. True |
| `fixDismissedLine`, `fixPromptGapTitle` | True |
| `fixPromptGapLine` "No engine named X in N answers" | True: a gap requires `!cells.some(brand_mentioned)` |
| `fixCheckNowWaiting` | True, but the design (4.4) promised the next collection date and this names the cutoff (L6) |
| `promptGapFix` | Advice, no factual claim |

### LOW

**L1. A single mention rounds to 0 on scopes over 200 cells, so "0 to any mention" is missed.**
`fixStates.ts:160-163` rounds before `isImprovement` (`:221-224`). Probe:
```
P1 rounding, 1 mention in 201 fresh cells, baseline 0 -> {"state":"verdict","status":"reopened","value":0,"n":201}
```
The reopened card then reads "is 0% (was 0%)" while the brand was named.
Reachable for `rate:all` on plans with 200 prompts. The mirror case also
exists: a baseline of 0.4 percent stores as 0, so a later 1 percent counts as
"0 to any". Fix: compare on mention counts, or keep one decimal in the value
and apply the zero rule on the raw count.

**L2. The design says "every cell"; the code says 80 percent; the design was not updated.**
`docs/arch/fix-states.md` section 4.3 "only when every cell in the fix's
scope ... has a successful answer"; `fixStates.ts:42` `READY_SHARE = 0.8`. The
80 percent rule is defensible (one failing engine would otherwise block every
verdict), but it is an unrecorded change to an approved design, and the doc's
own status line (`fix-states.md:3`) still reads "awaiting Constantin's ok"
while the migration header says approved. Fix (bg-architect): record the 80
percent rule and the approval in the design.

**L3. A done fix whose scope left the page waits forever, saying "0 of 1".**
`fixStates.ts:142-151, 246`: `coverageCells` filters to the active prompt and
engine lists, so a fix on an engine removed by a downgrade, or on a prompt
deactivated or deleted, has 0 cells, `needed` becomes 1, and the card reads:
```
P4 engine left plan -> {"state":"waiting",...,"fresh":0,"needed":1} | Marked done 1 Nov. Waiting for newer answers: 0 of 1 needed so far.
```
No newer answer can ever arrive. Fix: when the scope has 0 cells, return a
distinct state and say the prompt or engine is no longer tracked.

**L6. "Check now" does not name the next collection date (design 4.4).**
`AIVisibility.tsx:1078` uses the cutoff date. Fix: compute the next run from
`refresh_cadence` and `last_refresh_at` where available, or amend the design.

## 5. Accessibility findings

Contrast, computed (WCAG relative luminance), dark tokens from `index.css:7-10`
and the dark remap at `index.css:151-152` (`.text-slate-500` and
`.text-slate-600` render as rgb(148 163 184)), light overrides from
`index.css:189, 214, 333`:

| Pair | Dark | Light |
|---|---|---|
| text-slate-500 (remapped) on bg-dark-800 card | 6.96:1 | 6.03:1 |
| text-slate-500 on explainer bg-dark-700/20 | 6.73:1 | 5.81:1 |
| text-amber-300 reopened line on bg-amber-500/10 | 10.63:1 | 4.65:1 |
| text-amber-300 `role="status"` notice on card | 12.38:1 | 5.02:1 |
| text-emerald-300 "Mark as done" on bg-emerald-500/15 | 9.26:1 | 4.76:1 |
| text-emerald-300 verified title on bg-dark-700/10 | 11.52:1 | not computed |
| text-slate-300 done title on bg-dark-700/10 | 11.82:1 | not computed |

All measured pairs pass 4.5:1. Light-mode background overrides for the
translucent `bg-*-500/NN` fills were not found and were assumed to render as
composed over white.

Keyboard: every new control is a native `<button>`, so all are reachable and
operable. Focus: the six new buttons carry `focus-visible:ring-2
ring-brand-400` (measured 6.56:1 in the 2026-11-02 review); the Done toggle
has no ring class but inherits the global `:focus-visible` outline
(`index.css:633-637`). `aria-expanded` is on the Done toggle (`:2404`). No
headings were added. Hit targets: hub buttons are `py-1.5 text-xs` (about
28 px tall), Done list buttons `py-1` (about 24 px), meeting the 24 px floor
of WCAG 2.5.8 at the edge.

**L4. Focus is lost after Mark as done, Not for us, Reopen and Restore.**
`AIVisibility.tsx:2369, 2377` and the Reopen button: on success the item moves
lists, the focused button unmounts, and focus falls to `<body>`. A keyboard
user has to tab from the top of the page again (WCAG 2.4.3). Fix: after the
write, move focus to the next item's first button, or to the hub heading or
the Done toggle when the list is empty.

**L5. Repeated "Check now" buttons share one accessible name.**
`AIVisibility.tsx:2436`: Reopen and Mark as done carry `aria-label` with the
fix title, Check now does not, so a screen reader's button list shows several
identical "Check now" entries. Fix: `aria-label={`${FIX_COPY.checkNow}: ${row.title ?? row.fix_id}`}`.

## 6. INFO

- **I1.** A `done` row's `title` and `metric_key` stay writable (probe B Q7:
  upsert done on done changed `title` to the new payload while the baseline
  stayed pinned). Only the client's own row, inside the accepted limit in
  design section 3. Pinning `metric_key` while status is `done` would keep the
  verdict on the same metric as the baseline.
- **I2.** The two `role="status"` notices (`:2354, :2430`) are inserted with
  their text already inside. Some screen readers do not announce a live region
  that appears already filled. Not tested with assistive technology. A
  persistent, empty `role="status"` container per list would be safer.
- **I3.** `fixBusy` is global: while one item saves, a click on another
  item's enabled button is silently ignored (`markFix` returns at `:1005`).
- **I4.** The test's `FIX_ID_RE` (`fix_states.test.js:78`) and the Postgres
  CHECK disagree on newlines: Postgres `.` matches a newline (probe A P11
  accepted `outranked:a\nb`), JavaScript `.` does not. Harmless, since
  `competitorKey` collapses whitespace, but the test does not mirror the DB.
- **I5.** `anon` and `authenticated` hold the platform-default table grants,
  including DELETE and TRUNCATE. DELETE is neutralised by the absence of a
  policy (probe A P6); TRUNCATE is not reachable through PostgREST. Platform
  posture, not exploitable here.
- **I6.** A verdict update that matches 0 rows (another tab already moved the
  row) returns no error and no data, so local state keeps the row as `done`
  and re-sends the no-op on later reloads until the page is reloaded. No harm.

## 7. Regression surface

Grep for importers of the new modules and table:
```
rg -l "fixStates|FIX_COPY|fix_states" brandgeo-dashboard/src brandgeo-dashboard/netlify brandgeo-dashboard/tests db
  db/supabase-fix-states-migration-2026-11-06.sql
  brandgeo-dashboard/src/pages/AIVisibility.tsx
  brandgeo-dashboard/tests/fix_states.test.js
```
`fixStates.ts` imports `computeAiVisibilityScore` (`aiVisibilityScore.ts`) and
`competitorKey` (`competitorFilter.ts`); any change to either moves the stored
`dimension` metrics and the `outranked` ids. A change to `competitorKey`
normalisation would orphan existing `outranked:` rows (the generator would
emit a new id and the old done row would sit in the Done list for a card that
no longer exists). Paths that need a manual look after deploy: the AI
Visibility hub as an admin switching between two clients (M1), as a viewer,
and in light mode.

`delete-client.js` deletes client rows; `fix_states.client_id` is
`on delete cascade`, so account deletion is not blocked by this table.

## 8. Production probes, how they were run

Supabase project `duiyifepitvugyulobqm`, through `execute_sql`. Each probe was
ONE `begin; ... rollback;`. Impersonation: `set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', <viewer uuid>,
'role','authenticated')::text, true);` with a real viewer of client 5 (uuid
not reproduced here), client 1 as the other tenant. Outcomes were collected
in a transaction-local setting and selected before the rollback. Probe B
seeded three rows as postgres and backdated two `marked_at` values with the
trigger disabled, then re-enabled it before switching role; one sub-probe
(Q10) disabled the trigger again to prove WITH CHECK alone refuses the move.
All DDL ran inside the rolled-back transactions. Read back afterwards:
`fix_states` 0 rows, trigger `fix_states_guard_trg` enabled (`O`), RLS on.

The upsert was simulated as the SQL PostgREST generates for
`.upsert(payload, { onConflict: 'client_id,fix_id' })` (INSERT ... ON CONFLICT
(client_id, fix_id) DO UPDATE SET each payload column = EXCLUDED), not sent
over HTTP with a real JWT.

## 9. What was not checked

- Any browser rendering: no dev server, no build. M1 is shown by code trace
  and a database probe, not by clicking. Mobile layout of the new button
  column, light mode on screen, and motion of the Done collapse were not seen.
- A real viewer or admin JWT against PostgREST over HTTP; the RLS path was
  proven in SQL with an impersonated role.
- An admin impersonation probe in SQL (admin writes are allowed by policy by
  construction; not exercised).
- Screen reader behaviour of the `role="status"` notices.
- Light-mode overrides for translucent background fills.
- Behaviour against real `ai_results` rows of any client (all logic probes
  used fictional fixtures).
- Whether `aggregateCompetitors` can ever emit a blank name (it would yield
  `outranked:` and fail the CHECK on insert, surfacing as "Could not save").
- `npm run build`.
