# PASS WITH FINDINGS

`bg-verify` review of packet `012` (`bg-backend`'s implementation of packet `010`
against `docs/arch/scheduled-function-auth.md`). Reviewer: `bg-verify`, Opus,
2026-07-27. Write scope: this file only. No reviewed file was edited. No git
command that mutates state was run. The migration was **not** applied.

Nothing blocks the commit. Six findings, all LOW, none in the gate itself.
Two of them should be fixed **before Constantin applies the migration** (M1, M2)
because they are cheap now and awkward later; neither is a reason to hold the
code.

---

## CALIBRATION STEP — bg-verify

### 1. `git diff --stat`, and whether every changed file is in `010`'s `scope_write`

```
$ git -C "C:/Users/const/Constantin Daniel Goane/BrandGEO" diff --stat
 brandgeo-dashboard/netlify.toml                    | 33 +++++-----
 .../netlify/functions/expire-plan-grants.js        | 38 +++++++++--
 .../netlify/functions/ping-sitemap.js              | 73 +++++++++++++++++-----
 .../netlify/functions/purge-old-audits.js          | 47 --------------
 .../netlify/functions/purge-old-results.js         | 33 ----------
 .../netlify/functions/schedule-collections.js      | 48 ++++++++++----
 6 files changed, 149 insertions(+), 123 deletions(-)

$ git status --porcelain      (relevant rows)
 M brandgeo-dashboard/netlify.toml
 M brandgeo-dashboard/netlify/functions/expire-plan-grants.js
 M brandgeo-dashboard/netlify/functions/ping-sitemap.js
 D brandgeo-dashboard/netlify/functions/purge-old-audits.js
 D brandgeo-dashboard/netlify/functions/purge-old-results.js
 M brandgeo-dashboard/netlify/functions/schedule-collections.js
?? brandgeo-dashboard/netlify/functions/_cron_auth.js
?? db/supabase-scheduled-jobs-migration.sql
```

`git diff --stat` shows six because the two new files are untracked and a plain
`diff` cannot see them. The full change is **eight** files. All eight are in
`010`'s `scope_write`, exactly, with nothing left over:

| File | State | In `scope_write` |
|---|---|---|
| `netlify/functions/_cron_auth.js` | new | yes |
| `netlify/functions/expire-plan-grants.js` | modified | yes |
| `netlify/functions/schedule-collections.js` | modified | yes |
| `netlify/functions/ping-sitemap.js` | modified | yes |
| `netlify/functions/purge-old-results.js` | deleted | yes |
| `netlify/functions/purge-old-audits.js` | deleted | yes |
| `brandgeo-dashboard/netlify.toml` | modified | yes |
| `db/supabase-scheduled-jobs-migration.sql` | new | yes |

**No file outside `scope_write` was modified.** `git status` also lists
unrelated untracked items (`.claude/skills/`, `brandgeo/web/bg-018.html`,
`docs/audit/`, `docs/ROADMAP-2026-07-27.md`, `docs/design/dashboard-visual-system.md`,
`docs/linkedin-posts-2026-07-24.md`, packet `011` and its QA report). Those
predate this packet and belong to other work; `CLAUDE.md`'s Hygiene backlog
already tracks them. **They must not be swept into this commit** — the command
in §10 is written path-by-path for that reason.

### 2. Secret scan, count only

Tracked diff:

```
$ git diff -U0 | grep -niE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role"
60:+// shared secret. It used to be a Netlify-scheduled function with no auth at
111:+ * shared secret (_cron_auth.js). Fetches the live getbrandgeo.com sitemap, diffs
297:+ * Auth: X-Cron-Key shared secret (_cron_auth.js). Invoked by Supabase pg_cron
```

**3 matches, all prose in comments.** The two untracked new files were scanned
separately (a plain `git diff` cannot reach them): **4 matches in
`_cron_auth.js`, 15 in the migration**, all of them variable names
(`CRON_SECRET`), header names (`X-Cron-Key`), the Vault key name
(`cron_secret`), the role name (`service_role`), the column name
(`decrypted_secret`), or prose. **Total 22 matches, zero values.**

Independent entropy check, which is the one that actually matters:

```
$ rg -n "[A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{40,}={0,2}" <all six code/config files>
rg exit=1   (no match)
```

**No high-entropy literal exists anywhere in the change.** No secret value
appears in this report either.

### 3. Acceptance criteria, verbatim, and whether each is objectively checkable

`010`'s eleven, quoted verbatim, with the two `012` substitutions applied:

1. "Unauthenticated `POST` to `expire-plan-grants`, `schedule-collections` and
   `ping-sitemap` returns `401` with body exactly `{"error":"unauthorized"}`."
   — checkable behaviourally now; the over-HTTP half is deploy-time.
2. "Unauthenticated `POST` to `purge-old-results` and `purge-old-audits`
   returns `404`. The files are gone." — half checkable (files gone), half
   deploy-time.
3. "A `POST` with a correct `X-Cron-Key` returns each function's normal
   response, unchanged from today's behaviour." — checkable only as far as
   "the gate passes and the business-logic diff is empty"; a genuine normal
   response needs live Supabase, Resend and Google credentials.
4. "`_cron_auth.js` returns `503`, not `200`, when `CRON_SECRET` is unset.
   Demonstrate this with the variable cleared locally." — fully checkable.
5. ~~"No occurrence of `schedule` remains in `netlify.toml`."~~ **Unsatisfiable
   as written.** Substituted per C2: *no `schedule = ` key assignment remains*.
   Fully checkable.
6. "`expire-plan-grants` and `schedule-collections` each declare `timeout = 26`."
   — fully checkable.
7. ~~"`cron.job` holds six active jobs."~~ **Arithmetically wrong.**
   Substituted per C1: *five active jobs*. Checkable only after the migration
   is applied.
8. "No row of `cron.job.command` contains a secret literal." — checkable by
   reading the migration now, by query after apply.
9. "`job_runs` exists with RLS enabled and zero policies, and gains a row per
   invocation." — DDL checkable now, existence and rows are post-apply.
10. "Business logic diff is empty for all three survivors." — fully checkable.
11. "No file outside `scope_write` was modified." — fully checkable.

**Not objectively checkable at review time: 1 (partly), 2 (partly), 3 (partly),
7, 9 (partly).** All five are deploy-time or post-migration by construction,
not by vagueness, and `012`'s §Rollout already assigns each to a numbered step.
That is the correct disposition and is **not** a reason to BLOCK: `010`'s
criteria describe the end state of a three-stage cutover, and a reviewer sitting
before stage one cannot see stage three. They are reported as **NOT CHECKED**
in §2 rather than passed.

Criteria 5 and 7 **were** unverifiable as written. Per my own edge-case rule
that sends unverifiable criteria back to whoever wrote them, they go to
`bg-architect` (finding P4) — but `bg-backend` already caught both and supplied
correct substitutes, which I independently confirmed (§4), so this costs the
release nothing.

### 4. `tsc` and build baseline

```
$ cd brandgeo-dashboard && npx tsc --noEmit
TSC EXIT: 0

$ npm run build
✓ 2791 modules transformed.  ✓ built in 6.25s
BUILD EXIT: 0
```

**Both green, and both are evidence about a different part of the repo.**
`brandgeo-dashboard/tsconfig.json` sets `"include": ["src"]`, so neither `tsc`
nor `vite build` reads, compiles or even opens any of the four changed `.js`
files — they live in `netlify/functions/`, which `netlify/functions/package.json`
declares `"type": "commonjs"` and which the Vite build never touches. A green
build here proves only that this change did not break the dashboard bundle.
Same caveat `docs/qa/plans-drift-fix-006.md` recorded.

The check that actually covers the changed files:

```
$ node --check <each of the four>
OK  brandgeo-dashboard/netlify/functions/_cron_auth.js
OK  brandgeo-dashboard/netlify/functions/expire-plan-grants.js
OK  brandgeo-dashboard/netlify/functions/schedule-collections.js
OK  brandgeo-dashboard/netlify/functions/ping-sitemap.js
```

Pre-existing baseline: `tsc` and `build` were green at HEAD too, so no failure
is attributable to this change either way.

### 5. The auth check guarding the most sensitive function touched

Most sensitive of the three is **`expire-plan-grants.js`**: it holds the service
key, reverts a paying-adjacent customer's `clients.plan` to `free`, writes
`client_events` and `client_notifications`, and sends customer-visible email via
Resend. Its guard is the **first statement of the handler**:

```
brandgeo-dashboard/netlify/functions/expire-plan-grants.js:42-44
  exports.handler = async (event) => {
    const gate = requireCronAuth(event);
    if (gate) return gate.response;
```

implemented at `brandgeo-dashboard/netlify/functions/_cron_auth.js:49-77`, and
the `createClient` that mints the service-key client is at `:46`, **after** the
gate. Proven behaviourally, not by line order, in Harness B (§3.2).

Before this change the guard was **nothing at all** — `git show HEAD:...` shows
`exports.handler = async () => {` taking no `event` and performing no check.

### 6. Write access

I have write access to **`docs/qa/` only**, and this file is the only thing I
wrote inside the repo. Both harnesses, the D1 fixture and the probes were
written to the scratchpad at
`C:\Users\const\AppData\Local\Temp\claude\C--Users-const-Constantin-Daniel-Goane-BrandGEO\9e0aefbe-53ef-4e1c-92b5-f9ed1411172f\scratchpad`,
outside the repo. I did not edit `_cron_auth.js`, the three functions,
`netlify.toml`, the migration, or any packet.

**One scope conflict to declare.** `012`'s acceptance criteria include "Report
written to `docs/qa/`, **filename recorded in `CLAUDE.md`**". `CLAUDE.md` is
`bg-orchestrator`'s write scope under AGENT-OS §1 and is outside mine. I did not
edit it. The exact line to add is handed over in §10.

**CALIBRATED.**

---

## 1. Verdict

**PASS WITH FINDINGS.**

The gate is correct, fail-closed, and provably precedes every side effect in all
three functions. The business-logic diff is genuinely empty. Both deletions are
safe and I reproduced the evidence for both rather than taking D1 on trust. The
migration is re-runnable and contains no secret literal. C1 and C2 are both
correct corrections and I confirmed each independently before substituting it.

Six findings, all LOW. None touches the gate. M1 and M2 are worth fixing before
the migration is applied; the rest are documentation.

---

## 2. Acceptance criteria

### 2.1 Packet `010`'s criteria, C1 and C2 substituted

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Unauth `POST` to the three → `401` body exactly `{"error":"unauthorized"}` | **PASS** (behavioural) | Harness B, §3.2: all three return `401 {"error":"unauthorized"}`, byte-compared |
| 2 | Unauth `POST` to `purge-old-*` → `404`, files gone | **PARTIAL** | Files gone: `git status` shows ` D` for both; `rg "purge-old" netlify.toml` exit 1. `404` is deploy-time — **NOT CHECKED**, Rollout step 6 |
| 3 | `POST` with correct key returns each function's normal response, unchanged | **PARTIAL** | Business-logic diff empty (row 10). Harness B positive control: valid key → gate returns `null`, execution proceeds into `createClient` + `supabase.from(clients)`. Full live response — **NOT CHECKED** |
| 4 | `503` not `200` when `CRON_SECRET` unset, demonstrated with the variable cleared | **PASS** | Harness A cases 1-3 and Harness B rows 3/7/11, §3.1-3.2. `delete process.env.CRON_SECRET` and `= ''` both → `503 {"error":"cron auth not configured"}` |
| 5 | **[C2]** No `schedule = ` key assignment in `netlify.toml` | **PASS** | `grep -nE '^\s*schedule\s*=' brandgeo-dashboard/netlify.toml` → no output, `exit=1` |
| 6 | `expire-plan-grants` and `schedule-collections` each declare `timeout = 26` | **PASS** | `netlify.toml:63-64` and `:134-135`; `ping-sitemap` keeps its 26 at `:169-170` |
| 7 | **[C1]** `cron.job` holds **five** active jobs | **NOT CHECKED** (post-apply) | Migration contains exactly four `SELECT cron.schedule(` calls (`:77, :113, :131, :150`); `cron.job` today holds exactly one (jobid 1). 4 + 1 = 5 |
| 8 | No row of `cron.job.command` contains a secret literal | **PASS** (by reading + current state) | Migration `:122-124, :140-142, :159-161` are Vault sub-selects. `rg "[A-Fa-f0-9]{32,}"` exit 1. Current `cron.job` has one row, a plain `DELETE` |
| 9 | `job_runs` exists, RLS enabled, zero policies, one row per invocation | **PARTIAL** | DDL correct: `:45` `CREATE TABLE IF NOT EXISTS`, `:59` `ENABLE ROW LEVEL SECURITY`, zero `CREATE POLICY` / `GRANT` in the file. `to_regclass('public.job_runs')` → `null` (not yet created). Rows are post-cutover — **NOT CHECKED** |
| 10 | Business logic diff empty for all three survivors | **PASS** | Full diff read line by line, §4 |
| 11 | No file outside `scope_write` modified | **PASS** | Calibration step 1 |

**Tally: 6 PASS, 3 PARTIAL, 1 NOT CHECKED, 0 FAIL.** Every PARTIAL and the one
NOT CHECKED are deploy-time or post-migration and are assigned to a numbered
Rollout step.

### 2.2 Packet `012`'s own criteria

| Criterion | Result |
|---|---|
| Verdict is the first line | **PASS** — line 1 |
| Harness rebuilt and run independently; output and exit code pasted | **PASS** — §3, written from the §Harness description only, bg-backend's fixtures never read |
| All `010` criteria re-verified, C1/C2 substituted, substitution confirmed correct | **PASS** — §2.1 and §5 |
| `503`-on-unset reproduced, not quoted | **PASS** — §3.1 |
| `401` body byte-exactly `{"error":"unauthorized"}` for all three | **PASS** — §3.2, `JSON.stringify` comparison |
| A rejected request constructs no Supabase client | **PASS** — §3.2, `sideEffects: NONE` on all 12 rejection rows, with a positive control proving the instrumentation is live |
| D1 cutoff equivalence reproduced incl. leap year, explicit safe/unsafe ruling | **PASS** — §6 |
| `purge-old-audits.js` → SQL reproduction confirmed exact | **PASS** — §7, with one accepted semantic difference (M3) |
| All four judgement calls explicitly accepted or rejected | **PASS** — §8 |
| Migration re-runnable and secret-free by reading; prerequisite queries re-run with output | **PASS** — §9 |
| §Rollout confirmed correct and non-reorderable, or corrected order given | **PASS** — §11, confirmed with two additions |
| Report in `docs/qa/`, filename recorded in `CLAUDE.md` | **PARTIAL** — report written; `CLAUDE.md` is outside my write scope, exact line handed over in §10 |

---

## 3. The harnesses, rebuilt

Both written from `012` §Harness prose only. bg-backend's fixtures were never
read (they are not in the repo). Files:
`…\scratchpad\harnessA.js`, `…\scratchpad\harnessB.js`.

### 3.1 Harness A — the gate contract in isolation

Drives the real `requireCronAuth` from
`brandgeo-dashboard/netlify/functions/_cron_auth.js`. 14 cases. I added a 14th
beyond the described set: `CRON_SECRET` unset **plus** `GET`, to check the
method gate fires before the config gate so a probe cannot fingerprint whether
the secret is configured.

```
[cron-auth] CRON_SECRET is not set — refusing all requests
[cron-auth] CRON_SECRET is not set — refusing all requests
[cron-auth] CRON_SECRET is not set — refusing all requests
=== HARNESS A — _cron_auth.js gate contract (bg-verify rebuild) ===
PASS  CRON_SECRET unset, POST, no header                   -> 503         {"error":"cron auth not configured"}
PASS  CRON_SECRET unset, POST, CORRECT header              -> 503         {"error":"cron auth not configured"}
PASS  CRON_SECRET = '', POST, correct header               -> 503         {"error":"cron auth not configured"}
PASS  secret set, GET with correct key                     -> 405         {"error":"method not allowed"}
PASS  secret set, OPTIONS (no CORS preflight path)         -> 405         {"error":"method not allowed"}
PASS  secret set, POST, no header                          -> 401         {"error":"unauthorized"}
PASS  secret set, POST, wrong key SAME length              -> 401         {"error":"unauthorized"}
PASS  secret set, POST, wrong key SHORTER                  -> 401         {"error":"unauthorized"}
PASS  secret set, POST, wrong key LONGER                   -> 401         {"error":"unauthorized"}
PASS  secret set, POST, correct key lowercase x-cron-key   -> null(pass)
PASS  secret set, POST, correct key canonical X-Cron-Key   -> null(pass)
PASS  undefined event                                      -> 405         {"error":"method not allowed"}
PASS  POST with headers undefined                          -> 401         {"error":"unauthorized"}
PASS  CRON_SECRET unset, GET  (405 before 503?)            -> 405         {"error":"method not allowed"}

14 passed, 0 failed, 14 total
EXIT CODE: 0
```

The load-bearing row is line 2: **a correct key does not rescue an unset
secret.** That is the property that distinguishes fail-closed from fail-open,
and it is the one `collection-worker-background.js:35` gets wrong.

Rows 8 and 9 confirm the length guard: `timingSafeEqual` throws on unequal
lengths, and neither the shorter nor the longer key throws — both reach `401`.

### 3.2 Harness B — the real handlers, end to end

`Module._load` overridden to stub `@supabase/supabase-js`, `./_plans`,
`./_email`, `./_admin_notify`, `./_indexing`, `./_auth`, `./_enqueue`. Every
stub pushes onto a `touched` array. `global.fetch` is also instrumented and
throws, so an outbound socket would be visible. I extended the described matrix
with a fourth case per function (`POST` with a wrong key) and with a **positive
control**, because `sideEffects: NONE` is worthless if the instrumentation is
simply dead.

```
[cron-auth] CRON_SECRET is not set — refusing all requests
[cron-auth] CRON_SECRET is not set — refusing all requests
[cron-auth] CRON_SECRET is not set — refusing all requests
=== HARNESS B — real handlers, rejected requests must have zero side effects ===
PASS  expire-plan-grants  anon POST              -> 401  {"error":"unauthorized"}               | sideEffects: NONE
PASS  expire-plan-grants  GET+good key           -> 405  {"error":"method not allowed"}         | sideEffects: NONE
PASS  expire-plan-grants  no CRON_SECRET         -> 503  {"error":"cron auth not configured"}   | sideEffects: NONE
PASS  expire-plan-grants  POST wrong key         -> 401  {"error":"unauthorized"}               | sideEffects: NONE
PASS  schedule-collections  anon POST            -> 401  {"error":"unauthorized"}               | sideEffects: NONE
PASS  schedule-collections  GET+good key         -> 405  {"error":"method not allowed"}         | sideEffects: NONE
PASS  schedule-collections  no CRON_SECRET       -> 503  {"error":"cron auth not configured"}   | sideEffects: NONE
PASS  schedule-collections  POST wrong key       -> 401  {"error":"unauthorized"}               | sideEffects: NONE
PASS  ping-sitemap  anon POST                    -> 401  {"error":"unauthorized"}               | sideEffects: NONE
PASS  ping-sitemap  GET+good key                 -> 405  {"error":"method not allowed"}         | sideEffects: NONE
PASS  ping-sitemap  no CRON_SECRET               -> 503  {"error":"cron auth not configured"}   | sideEffects: NONE
PASS  ping-sitemap  POST wrong key               -> 401  {"error":"unauthorized"}               | sideEffects: NONE

POSITIVE CONTROL  schedule-collections with a VALID key -> THREW:supabase.from(...).select(...).in is not a function | sideEffects: createClient, supabase.from(clients)
  PASS — instrumentation proven live (a passing request DOES touch stubs)

13 passed, 0 failed, 13 total
EXIT CODE: 0
```

The positive control is the row that makes the other twelve mean something. With
a valid key the same handler immediately reaches `createClient` and
`supabase.from('clients')` — so the stubs and the `touched` array demonstrably
fire. It then throws on my deliberately shallow chain stub, which is my fixture's
limit, not a defect in the code. **Therefore `sideEffects: NONE` on the twelve
rejection rows is a real negative, not a broken instrument: a rejected request
never constructs a service-key Supabase client, never opens a socket, never
sends email, never enqueues work.**

### 3.3 Bypass probe (beyond the packet)

`…\scratchpad\probe_attacker.js`. Twelve attacker-controlled header shapes,
attacker does **not** know the secret:

```
no header                        -> 401 {"error":"unauthorized"}
empty string                     -> 401 {"error":"unauthorized"}
junk same length                 -> 401 {"error":"unauthorized"}
junk short                       -> 401 {"error":"unauthorized"}
array of junk                    -> 401 {"error":"unauthorized"}
multiValueHeaders only           -> 401 {"error":"unauthorized"}
proto carries junk               -> 401 {"error":"unauthorized"}
proto carries "constructor"      -> 401 {"error":"unauthorized"}
toString injection               -> THREW TypeError (fails closed -> platform 5xx)
Buffer of correct bytes?         -> *** BYPASS (null) ***
GET with junk                    -> 405 {"error":"method not allowed"}
lowercase absent, upper junk     -> 401 {"error":"unauthorized"}
```

**Zero real bypasses.** The one row flagged `BYPASS` is my own fixture bug: it
passes `Buffer.from(SECRET)`, i.e. the correct secret, so passing is the correct
behaviour. Every case where the caller does not hold the secret returns `401`,
`405`, or throws — and a throw is a platform 5xx, never a pass. Recorded here
rather than quietly deleted, because a pasted output with an unexplained
`BYPASS` line would be worse than no output.

---

## 4. Business logic diff — empty for all three survivors, confirmed by reading

I read the complete diff for each file, not `012`'s summary table.

**`expire-plan-grants.js`.** Additions: the `_cron_auth` require (`:21`), the
`recordJobRun` helper (`:33-40`), `(event)` on the handler signature plus the
two gate lines (`:42-44`), three `recordJobRun` call sites (`:59, :64, :112`),
and header comments. The query at `:49-55` is byte-identical to HEAD
(`plan_source in ('trial','comp')`, `plan_grant_until` not null and `< today`,
`plan != 'free'`). The loop `:69-98`, the update payload `:72`, the
`client_events` and `client_notifications` inserts, `recordAdminEvent`, and the
Resend summary `:102-109` are all unchanged. Every `return` still carries its
original `statusCode` and `body`. **Empty.**

**`schedule-collections.js`.** Additions: require (`:30`), helper (`:40-47`),
signature and gate (`:57-59`), two call sites (`:71, :114`), comments. `isDue`
(`:49-55`), `CADENCE_DAYS` (`:32`), the `.in('refresh_cadence', …)` filter, the
`checkCollectionLimits` budget gate, `enqueueClientCollection`, the
`last_refresh_at` stamp at `:99`, and the `triggerWorker` condition at `:111`
are untouched. **Empty.**

**`ping-sitemap.js`.** Additions: require (`:35`), helper (`:48-55`), signature
and gate (`:71-73`), seven call sites, and a rewritten header comment. The four
one-line early returns were reflowed to multi-line **only** to fit the
`recordJobRun` call — `parseSitemap` (`:57-69`), the regex, `SITEMAP_URL`,
`MAX_PINGS_PER_RUN = 25`, the `changed` filter at `:110`, `slice(0, 25)` at
`:117`, the publish loop `:131-147`, the upsert-after-Google-accepts ordering at
`:137-139`, and the deliberate no-record-on-failure at `:145` are all identical.
Every status code is unchanged (502/502/200/500/200/500/200). **Empty.**

**`netlify.toml`.** Five `schedule` keys removed, two `timeout = 26` added, both
`purge-old-*` blocks deleted entirely, comments rewritten. No other function's
config touched. The `ignore` directive that `CLAUDE.md` documents is untouched.

**Coverage note.** `012` §What changed item 3 claims "8" `job_runs` paths in
`ping-sitemap`. There are **7** post-gate return paths and **7** `recordJobRun`
calls (`:83, :89, :96, :104, :113, :125, :151`), and every path is covered — so
the code is right and the count is wrong. Finding P1.

---

## 5. C1 and C2 verified before substitution

**C1 — "six active jobs" is wrong, five is correct. CONFIRMED.**
Arch §11 and `010` criterion 7 both read "jobid 1 unmodified, **plus** the five
from arch doc §7.1". Arch §7.1's table has five rows, and its first row is
`purge-old-ai-results | 0 3 * * * | **Already exists as jobid 1. Do not touch
it, do not recreate it.**` So jobid 1 is inside the five and adding it again
double-counts. Confirmed against the artefacts:

```
$ grep -c 'cron.schedule' db/supabase-scheduled-jobs-migration.sql   → 5 textual
$ grep -n  'cron.schedule' …                                         → :30 is a comment;
                                                                       :77, :113, :131, :150 are the calls
```

Four jobs created. Current state:

```sql
SELECT jobid, jobname, schedule, active, username, database FROM cron.job ORDER BY jobid;
[{"jobid":1,"jobname":"purge-old-ai-results","schedule":"0 3 * * *","active":true,
  "username":"postgres","database":"postgres"}]
```

One existing + four new = **five**. C1 is correct. The migration's own verify
block (`:185`) already says five and is right; the arch doc and `010` are the
ones carrying the error.

**C2 — `grep -c schedule netlify.toml` cannot return 0. CONFIRMED.**

```
$ grep -nE '^\s*schedule\s*=' brandgeo-dashboard/netlify.toml
(no output)   exit=1

$ grep -c schedule brandgeo-dashboard/netlify.toml   → 4
$ grep -n  schedule brandgeo-dashboard/netlify.toml
123:# (db/supabase-scheduled-jobs-migration.sql). It needed nothing from Node, so it
134:[functions."schedule-collections"]
182:# Cancels a scheduled post: one provider deletePost call per platform target, so
187:# Reads the provider's own scheduled queue (posts created outside BrandGEO too).
```

Four matches, exactly as `012` describes them: one comment naming the migration
file, the `schedule-collections` block header (the criterion is unsatisfiable
while the function bears that name), and two unrelated comments about the social
publishing queue. **The substantive criterion — no `schedule = ` key assignment
— is met, exit 1.** C2 is correct.

Both substitutions accepted. Both underlying defects are recorded against
`bg-architect` as finding P4, since the arch doc still carries them unamended.

---

## 6. D1 reproduced independently — deleting `purge-old-results.js` is SAFE

I did not take `012`'s table on trust. The deleted file was recovered from git
(`git show HEAD:brandgeo-dashboard/netlify/functions/purge-old-results.js`) and
both sides were computed fresh.

The Node side, `purge-old-results.js:18-19` then `:24`:

```js
const cutoff = new Date()
cutoff.setMonth(cutoff.getMonth() - 24)
…
.lt('checked_at', cutoff.toISOString())
```

The Postgres side, `cron.job` jobid 1, read today:

```
DELETE FROM public.ai_results WHERE checked_at < NOW() - INTERVAL '24 months';
```

Same table (`ai_results`), same column (`checked_at`), same operator (`<`), same
slot (`0 3 * * *`).

`…\scratchpad\d1_js.js` computes the JS half; the Postgres half was computed by
`execute_sql` against `duiyifepitvugyulobqm`. Both jobs run at 03:00 UTC and the
database `TimeZone` is `UTC` (`current_setting('TimeZone')` → `UTC`,
PostgreSQL 17.6, user `postgres`, database `postgres`), so no timezone term
enters the comparison.

| Run day (03:00 UTC) | JS `setMonth(-24)` | Postgres `- INTERVAL '24 months'` | Same |
|---|---|---|---|
| 2026-07-27 | 2024-07-27 | 2024-07-27 | yes |
| 2026-01-31 | 2024-01-31 | 2024-01-31 | yes |
| 2026-03-31 | 2024-03-31 | 2024-03-31 | yes |
| 2026-02-28 | 2024-02-28 | 2024-02-28 | yes |
| 2026-08-31 | 2024-08-31 | 2024-08-31 | yes |
| 2026-12-31 | 2024-12-31 | 2024-12-31 | yes |
| **2028-02-29** | **2026-03-01** | **2026-02-28** | **no, 1 day** |
| 2028-08-31 *(my addition)* | 2026-08-31 | 2026-08-31 | yes |
| 2028-01-31 *(my addition)* | 2026-01-31 | 2026-01-31 | yes |

The leap-year row reproduces exactly as `012` states. I added two further rows
to test whether the divergence was really leap-day-specific rather than a
general month-length effect; both agree, so it is.

**Direction of the divergence, which is what decides the ruling.** On
2028-02-29 the JS cutoff is 2026-03-01 and the Postgres cutoff is 2026-02-28.
The predicate is `checked_at < cutoff`, so the **deleted Node version would
delete strictly more** — one extra day of rows that are not yet a full 24 months
old. `setMonth` overflows a non-existent 2026-02-29 forward to 03-01; Postgres
clamps back to 02-28. pg_cron is the stricter and more correct of the two.

**RULING: deleting `purge-old-results.js` is SAFE.** No delete is lost. Nothing
that pg_cron jobid 1 fails to remove was being removed by the Node copy — the
only asymmetry runs the other way, and losing it removes a latent
one-day-early-retention bug once every four years. Corroborating evidence that
jobid 1 is genuinely doing the work:

```sql
SELECT status, count(*), min(start_time), max(start_time), max(return_message)
FROM cron.job_run_details WHERE jobid = 1 GROUP BY status;
[{"status":"succeeded","runs":20,
  "first_run":"2026-07-08 03:00:00.203404+00",
  "last_run":"2026-07-27 03:00:00.188964+00",
  "sample_msg":"DELETE 0"}]
```

**20 consecutive successful runs**, 2026-07-08 through 2026-07-27 — longer than
the 12 days the arch doc claimed, with zero failures. `DELETE 0` throughout,
confirming the "nothing is 24 months old yet" premise, which is also why the
duplication stayed invisible.

---

## 7. `purge-old-audits.js` → SQL, confirmed exact (one accepted difference)

Source recovered with `git show HEAD:…/purge-old-audits.js`. The two deletes are
at `:30-31` and `:37-38`, exactly the `:30` to `:38` span `010` and the arch doc
cite (the `012` citation of `purge-old-results.js` is the one that is off, P2):

```js
const auditCutoff = new Date(Date.now() - 90  * 86_400_000).toISOString()
const leadCutoff  = new Date(Date.now() - 180 * 86_400_000).toISOString()
.from('prospect_audits').delete({count:'exact'}).lt('created_at', auditCutoff)
.from('prospect_leads' ).delete({count:'exact'}).lt('created_at', leadCutoff)
```

Migration `:81-82`:

```sql
DELETE FROM public.prospect_audits WHERE created_at < NOW() - INTERVAL '90 days';
DELETE FROM public.prospect_leads  WHERE created_at < NOW() - INTERVAL '180 days';
```

| Property | Node | SQL | Match |
|---|---|---|---|
| Table 1 | `prospect_audits` | `public.prospect_audits` | yes |
| Table 2 | `prospect_leads` | `public.prospect_leads` | yes |
| Column | `created_at` | `created_at` | yes |
| Operator | `.lt` | `<` | yes |
| Window 1 | 90 days | `INTERVAL '90 days'` | yes |
| Window 2 | 180 days | `INTERVAL '180 days'` | yes |
| Slot | `0 4 * * *` | `0 4 * * *` | yes |

Arithmetic equivalence confirmed by query, not assumed. `90 * 86_400_000` ms is
exactly 90×24h; `timestamptz - INTERVAL '90 days'` is also exactly 90×24h
**provided the session timezone has no DST**, which is the case here
(`TimeZone = UTC`, verified). Sample rows from the same query as §6:

| Run day | PG `- 90 days` | PG `- 180 days` |
|---|---|---|
| 2026-07-27 03:00 | 2026-04-28 03:00 | 2026-01-28 03:00 |
| 2028-02-29 03:00 | 2027-12-01 03:00 | 2027-09-02 03:00 |

All at the identical clock time, i.e. pure 24-hour multiples, matching the JS
millisecond arithmetic exactly — including across the leap day, where the
`months` interval diverged but the `days` interval does not.

**Column types confirmed**, since a `date` column would have changed the
comparison:

```sql
SELECT table_name, column_name, data_type FROM information_schema.columns …
prospect_audits.created_at  → timestamp with time zone
prospect_leads.created_at   → timestamp with time zone
prospect_leads.audit_id     → bigint
```

**Independence claim confirmed:**

```sql
SELECT conname, confdeltype, child_table, parent_table FROM pg_constraint …
[{"conname":"prospect_leads_audit_id_fkey","delete_rule":"SET NULL",
  "child_table":"prospect_leads","parent_table":"prospect_audits"}]
```

`ON DELETE SET NULL`, exactly as claimed. Deleting a `prospect_audits` row
nulls the child's `audit_id` rather than cascading, so the 180-day lead clock is
never truncated by the 90-day audit purge. The two deletes are genuinely
independent and the order between them does not matter.

**One genuine semantic difference — see finding M3.** It is a behaviour change,
it is accepted, and it is recorded rather than glossed.

---

## 8. The four judgement calls

### JC1 — gate rejections write no `job_runs` row. **ACCEPT.**

This is the right call and the reasoning in `012` understates it. Writing a row
on `401` would hand any unauthenticated caller on the public internet an
**unbounded `INSERT` primitive into a service-key-written table** — an
observability improvement that creates a storage-exhaustion and cost vector, on
endpoints whose entire problem was being anonymously callable. It would also
poison the signal: `job_runs` exists so that a query like "show me `ok = false`
for `ping-sitemap`" surfaces R2's broken Google credential. Burying that under
scanner noise would defeat the table's purpose in the first week.

A `401` is not a job run. It is a rejected request, and rejected-request volume
belongs at the platform layer (Netlify function logs), which still records it.
ACCEPT, unreservedly.

### JC2 — `recordJobRun` checks the returned `error`, not only the throw. **ACCEPT.**

Correct, and this is the most valuable thing `bg-backend` found beyond the
packet text. `supabase-js` **resolves** with `{ data, error }` for anything
PostgREST rejects — missing table, RLS denial, constraint violation — and only
**rejects** at the transport layer. A bare `try/catch` catches the rare case and
misses the common one. Present and correct in all three files:

```
expire-plan-grants.js:35-36     schedule-collections.js:42-43     ping-sitemap.js:50-51
const { error } = await supabase.from('job_runs').insert({…})
if (error) console.error('… job_runs write failed:', error.message)
```

The failure it defends against is not hypothetical: it is precisely the state
that exists if the code is deployed before the migration, which the Rollout is
sequenced to avoid but which one misordered step would produce. Without this
check the job would report success while recording nothing — the exact silent
failure this table was added to eliminate. Both shapes are also correctly
prevented from failing the job. ACCEPT.

### JC3 — `405` on non-POST removes any GET-based uptime check. **ACCEPT, with one item I cannot close.**

In-repo: confirmed clean. A repo-wide `rg` for the three function names, with
docs, packets and `_reorg-stray/` excluded, returns **no caller** — every hit is
a comment, a `netlify.toml` block header, a `db/` migration comment, or the
functions' own source. Nothing under `brandgeo-dashboard/src/` fetches them.
`_cron_auth` itself is imported by exactly the three survivors and nothing else.

**What I cannot check:** an external monitor (UptimeRobot, Better Stack, a
Netlify check) is invisible to every agent. Two things make the risk small and
the failure benign. These were `schedule`-declared functions, which Netlify
documents as not URL-invokable, so a deliberate external GET poller is
improbable. And the failure mode is loud, not silent: such a poller would start
seeing `405` instead of `200` and page somebody, rather than quietly reporting
green. ACCEPT. Constantin should glance at any uptime tool he runs; this is a
30-second check, not a blocker.

### JC4 — `headers['x-cron-key'] || headers['X-Cron-Key']`, no multi-value bypass. **ACCEPT.**

Probed, not reasoned — §3.3. Twelve attacker-controlled shapes including
array-valued headers, comma-joined duplicates, `multiValueHeaders` populated
while `headers` is empty, prototype-chain injection, and an object with a
`toString` that returns the secret. **Zero bypasses.**

Two specifics worth stating because they look like holes and are not:

- The `multiValueHeaders`-only case returns `401`. Netlify always populates
  `headers` (lowercased), so this shape does not occur in production; if it ever
  did, the consequence is a **false reject**, never a bypass. Fail-closed.
- The lookup is `headers['x-cron-key']`, a prototype-chain read rather than
  `Object.prototype.hasOwnProperty.call(...)`. That is not exploitable here:
  whatever the chain resolves must still survive `crypto.timingSafeEqual`
  against the secret, and an attacker who could place the correct secret on the
  prototype already has the secret. Probe rows `proto carries junk` and
  `proto carries "constructor"` both return `401`.

Branch two (`'X-Cron-Key'`) is dead in production and harmless. ACCEPT.

---

## 9. The migration reviewed as a migration

**Re-runnable: YES.**

```
$ grep -nE "IF NOT EXISTS|ENABLE ROW LEVEL SECURITY" db/supabase-scheduled-jobs-migration.sql
45:CREATE TABLE IF NOT EXISTS public.job_runs (
53:CREATE INDEX IF NOT EXISTS idx_job_runs_job_ran_at
59:ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
```

`ALTER TABLE … ENABLE ROW LEVEL SECURITY` is idempotent. The `cron.schedule`
upsert claim is **confirmed at the storage layer**, not taken from the pg_cron
changelog:

```sql
SELECT i.relname, idx.indisunique, pg_get_indexdef(idx.indexrelid) …
job_pkey               UNIQUE  (jobid)
jobname_username_uniq  UNIQUE  (jobname, username)
```

The unique index on `(jobname, username)` is the mechanism by which
`cron.schedule` replaces in place. Both the existing jobid 1 and the SQL editor
session run as `username = postgres` in `database = postgres`, so the four new
jobs land under the same owner and a re-run updates rather than duplicates.

**Secret-free: YES.** All three header expressions (`:122-124`, `:140-142`,
`:159-161`) are Vault sub-selects. `rg "[A-Fa-f0-9]{32,}|[A-Za-z0-9+/]{40,}"`
over the file → exit 1, no match. `cron.job.command` will contain a lookup, never
a value.

**`job_runs` RLS posture: correct.** `:59` enables RLS. Zero `CREATE POLICY` and
zero `GRANT` in the file (`grep -niE "create policy|^\s*grant " …` → exit 1).
Deny-all to `anon` and `authenticated`, service key bypasses. The precedent the
migration comment cites is real, verified:

```sql
SELECT relname, relrowsecurity, policy_count …
assistant_events  rls_enabled=true  policy_count=0
prospect_audits   rls_enabled=true  policy_count=0
prospect_leads    rls_enabled=true  policy_count=0
sitemap_pings     rls_enabled=true  policy_count=0
```

`job_runs` is absent from that result — it does not exist yet, as expected.

### 9.1 Prerequisite queries re-run

All read-only, against project `brandgeo-dashboard` (`duiyifepitvugyulobqm`).
**The migration was not applied and nothing was created.**

**`net.http_post` signature and schema:**

```sql
SELECT n.nspname, p.proname, pg_get_function_arguments(p.oid) …
[{"schema":"net","proname":"http_post",
  "args":"url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer",
  "args_with_defaults":"url text, body jsonb DEFAULT '{}'::jsonb, params jsonb DEFAULT '{}'::jsonb,
     headers jsonb DEFAULT '{\"Content-Type\": \"application/json\"}'::jsonb,
     timeout_milliseconds integer DEFAULT 5000"}]
```

Exactly one overload, in schema **`net`**, signature exactly as arch §7.2
records. **Defaults exist on all four trailing parameters**, so the migration's
omission of `params` and its named-argument call style are both valid. The
migration's `net.http_post(...)` qualification is correct — the extension is
registered in `extensions` while its functions live in `net`:

```sql
SELECT extname, extversion, n.nspname …
pg_cron         1.6.4    pg_catalog
pg_net          0.20.3   extensions
supabase_vault  0.3.1    vault
```

**Vault holds `cron_secret`** (name and shape only, value never selected into
output):

```sql
SELECT name, char_length(decrypted_secret) AS secret_len,
       decrypted_secret ~ '^[0-9a-f]+$' AS is_lower_hex FROM vault.decrypted_secrets;
[{"name":"cron_secret","secret_len":64,"is_lower_hex":true}]
```

One secret, correctly named, 64 characters, lowercase hex — consistent with
32 random bytes hex-encoded as arch §9 item 1 specifies.

**`job_runs` does not yet exist:**

```sql
SELECT to_regclass('public.job_runs');   →  null
```

**Column types and FK rule:** §7 above.

**SQL editor identity:**

```sql
SELECT current_setting('TimeZone'), current_database(), current_user, version();
[{"db_timezone":"UTC","db":"postgres","run_as":"postgres",
  "pg_version":"PostgreSQL 17.6 on aarch64-unknown-linux-gnu"}]
```

Runs as `postgres` in `postgres`, and `SELECT` on `vault.decrypted_secrets`
succeeded, so the interactive prerequisite holds. Since `cron.schedule` records
`username = postgres`, the pg_cron worker will execute the job under the same
role that just demonstrated it can read Vault. That is strong evidence — not
proof — that the run-time Vault read will work; only a real run settles it, and
Rollout step 4 is where it gets settled.

**Every prerequisite `012` "Do" item 5 lists is confirmed present.**

---

## 10. Findings

Ranked by severity. All six are LOW. Nothing here blocks the commit.

### S1 — LOW — the "secret never touches a table" rationale is incomplete

**Where:** `docs/arch/scheduled-function-auth.md:412-418` (§7.2), echoed at
`db/supabase-scheduled-jobs-migration.sql:92-94`.

**What.** §7.2 justifies the Vault lookup on the ground that `cron.job.command`
is plaintext and "readable by anyone who can query the database, which includes
every agent in this OS". True, and the lookup does keep the value out of
`cron.job`. But the resolved value does not stay out of the database: `pg_net`
materialises the request into `net.http_request_queue`, whose `headers` column
is `jsonb` and which therefore holds the live `X-Cron-Key` value while the
request is pending.

**Evidence.**

```sql
SELECT c.relname, a.attname, format_type(a.atttypid, a.atttypmod) FROM … WHERE n.nspname='net';
http_request_queue.headers  →  jsonb          (holds the REQUEST headers)
_http_response.headers      →  jsonb          (response headers only)

SELECT count(*) FROM net.http_request_queue;   →  0     -- query succeeded as `postgres`
```

The table is readable by `postgres`, which is the role the Supabase MCP connects
as, i.e. the role every agent in this OS effectively has.

**Exploit path, stated honestly:** an actor able to `SELECT` from
`net.http_request_queue` during the sub-second window a request is queued could
read the secret. **This is not an incremental exposure** — the same role can
read `vault.decrypted_secrets` directly, which is faster, deterministic and
needs no timing. So the design does not change and the mitigation is unchanged.

**Fix.** One sentence in arch §7.2, so nobody later builds on a claim the
architecture does not actually make: note that the Vault lookup keeps the value
out of the *persistent* `cron.job.command`, not out of the database entirely,
and that `net.http_request_queue.headers` transits it. **Owner: `bg-architect`.**
Documentation only.

### M1 — LOW — the migration has no guard for a missing Vault secret, and fails silently

**Where:** `db/supabase-scheduled-jobs-migration.sql:122-124`, `:140-142`,
`:159-161`.

**What.** The header expression is a bare sub-select. If `cron_secret` is absent
from Vault, the sub-select yields `NULL` and `jsonb_build_object` produces a
JSON null rather than raising. The migration then succeeds, creates all four
jobs, and they begin firing with a header carrying no usable credential.

**Demonstrated:**

```sql
SELECT jsonb_build_object('Content-Type','application/json',
         'X-Cron-Key',(SELECT decrypted_secret FROM vault.decrypted_secrets
                        WHERE name = 'no_such_secret'));
[{"headers_if_vault_secret_missing":{"X-Cron-Key":null,"Content-Type":"application/json"}}]
```

**Failure scenario.** Not today — the secret is verified present (§9.1). But the
file is written to be re-runnable and to survive as the record of this migration.
Re-run it after a Vault rename, on a restored project, or on a staging branch
with no secret, and the result is four jobs that appear healthy in
`cron.job_run_details` (pg_net succeeds the moment the request is queued) while
every invocation is rejected `401` once the gate is live. The operator sees
`succeeded` in cron and silence in `job_runs`, which is the exact "looks healthy,
records nothing" mode this whole packet exists to remove.

**Fix.** Add at the top of the file, before any `cron.schedule`:

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cron_secret') THEN
    RAISE EXCEPTION 'vault secret "cron_secret" is missing. Set it before applying this migration (arch doc §9 item 2).';
  END IF;
END $$;
```

Cheap, idempotent, and turns a silent misconfiguration into a refusal to apply.
**Owner: `bg-backend`.** Worth doing before Rollout step 3.

### M2 — LOW — `purge-old-prospect-audits` is the one job with no cutover offset

**Where:** `db/supabase-scheduled-jobs-migration.sql:79` (`'0 4 * * *'`) versus
`brandgeo-dashboard/netlify.toml:122-123` at HEAD (`purge-old-audits`,
`schedule = "0 4 * * *"`).

**What.** Arch §7.1 offsets the schedules by 10 minutes precisely so that during
the step-3-to-step-5 window, when both schedulers are live, the same job never
runs concurrently with itself. Verified for three of four:

| Job | Netlify slot (HEAD) | pg_cron slot | Offset |
|---|---|---|---|
| `ping-sitemap` | `0 5 * * *` | `10 5 * * *` | 10 min |
| `expire-plan-grants` | `0 6 * * *` | `10 6 * * *` | 10 min |
| `schedule-collections` | `0 * * * *` | `10 * * * *` | 10 min |
| **`purge-old-audits` / `purge-old-prospect-audits`** | **`0 4 * * *`** | **`0 4 * * *`** | **none** |

**Failure scenario.** On any day between applying the migration and deploying
the code, at 04:00 UTC the still-live Netlify `purge-old-audits.js` and the new
pg_cron job issue the same two `DELETE`s against the same rows simultaneously.
Consequence is bounded: both are fixed-cutoff deletes, Postgres row locks
serialise them, and the second finds nothing the first left. It is not a data
risk. It is that the design's stated collision-avoidance rationale silently does
not apply to one of the four jobs and nobody wrote down that it was deliberate —
which is how the original duplicate-scheduler defect (R5) came about.

**Fix.** Either change `:79` to `'5 4 * * *'`, or add one line to arch §7.1
recording that this job is intentionally not offset because concurrent
fixed-cutoff deletes are harmless. Either closes it. **Owner: `bg-backend`
(schedule) or `bg-architect` (note).** Keeping the step-3-to-step-5 window short
also closes it in practice.

### M3 — LOW — accepted behaviour change: the two audit deletes are now atomic

**Where:** `db/supabase-scheduled-jobs-migration.sql:80-83` versus
`purge-old-audits.js:30-38` at HEAD.

**What.** The Node version issued two independent `supabase-js` calls, logged an
error from the first (`:33`) and **continued** to the second (`:37`). pg_cron
executes a job command as a single transaction, so if the `prospect_audits`
`DELETE` errors, the `prospect_leads` `DELETE` no longer runs.

**Failure scenario.** A lock timeout or constraint error on `prospect_audits`
now also skips that day's `prospect_leads` purge, where previously it would not
have. Both recover on the next daily run, so the practical impact is one day of
deferred retention.

**RULING: ACCEPT.** Atomicity is the better posture for a retention pair, and
the observability trade goes the right way: the Node version returned `500` to a
caller nobody was watching, whereas a failed pg_cron command lands in
`cron.job_run_details` as `failed` with the Postgres error text, queryable by any
agent. Recorded because it is a genuine semantic difference from the file being
deleted and `012` did not name it.

### P1-P4 — LOW — packet and artefact accuracy (no code impact)

- **P1.** `012` §What changed item 3 says "8" `job_runs` paths in
  `ping-sitemap`. There are **7** (`ping-sitemap.js:83, :89, :96, :104, :113,
  :125, :151`), and all 7 post-gate return paths are covered. Code correct,
  count wrong.
- **P2.** `012` §D1 cites `purge-old-results.js:21` to `:27`. The cutoff and
  delete are at `:18` to `:24` (`git show HEAD:…`). Packet `010` item 2 cited it
  correctly; only `012` drifted.
- **P3.** `012` "Do" item 7's AI-tell baseline is not reproducible as stated. It
  claims 13 in the migration and "58 of the 71 files in `netlify/functions/`".
  I measure **9** in the migration and **51 of 72** files
  (`rg -c "[—–]" …`; `rg -l "[—–]" … | wc -l`; `ls … | wc -l`). The added-line
  counts on the three survivors (6 total; 3 / 1 / 2) and the HEAD counts (3 / 7 /
  2) do reproduce. Conclusion is unaffected.
- **P4.** `docs/arch/scheduled-function-auth.md` §11 still carries both defective
  criteria ("six active jobs", "`grep -c schedule` returns 0"). `bg-backend`
  caught them and I confirmed both wrong, but the arch doc is unamended, so the
  next reader hits the same trap. **Owner: `bg-architect`** — amend §11 in place
  per the `CLAUDE.md` convention of marking stale text where it sits.

### Not findings, ruled on and closed

- **AI-tell scan.** 6 em/en dashes on added lines across the three survivors, 4
  in `_cron_auth.js`, 9 in the migration. Every one is inside a code comment;
  51 of the 72 files in `netlify/functions/` already contain them. AGENT-OS §7
  rule 3 governs **customer-facing output**, and nothing in this change reaches a
  customer. **Ruled: not a finding.** No cleanup opened. `rg -n "[—–]"` over
  `brandgeo/web/` and `docs/copy/` returns 28 hits, but this change touches
  neither directory, so those are out of scope here.
- **Non-string header values throw.** `Buffer.from(12345)` and
  `Buffer.from({...})` raise a `TypeError` out of `requireCronAuth`, which
  propagates from the handler as a platform 5xx (§3.3). **Not reported as a
  finding**: Netlify's `event.headers` is always `Record<string,string>`, so I
  could not construct an HTTP-reachable path, and the behaviour fails closed
  regardless. Recorded here only so that a later reader does not mistake my
  silence for not having looked.

---

## 11. §Rollout — confirmed correct and non-reorderable, with two additions

I tested each adjacent swap rather than reading the order approvingly.

- **3 before 5 is load-bearing.** Deploying first makes the gate live while
  removing the `schedule` keys, so Netlify stops calling and pg_cron does not yet
  exist. All four jobs stop at once, silently, with `expire-plan-grants` and
  `ping-sitemap` invisible for a full day before anyone would notice.
- **1 and 2 before 3 is load-bearing.** Without the Vault secret the jobs are
  created sending a null header (M1), and without `CRON_SECRET` in Netlify the
  gate rejects `pg_net` too. Both verified present today.
- **4 before 5 is load-bearing**, and `012`'s "If step 4 fails, **stop**" is the
  single most important line in the sequence. An ungated function that works is
  strictly better than a gated one whose only caller cannot reach it.
- **6 and 7 must follow 5**, trivially — neither the `401` nor the badge state
  exists before the deploy.

**The order stands. Two additions.**

**Addition A, to step 3.** During the step-3-to-step-5 window
`purge-old-prospect-audits` (pg_cron, 04:00) and `purge-old-audits` (Netlify,
04:00) fire at the same minute, unlike the other three (M2). Harmless, but keep
the window short and do not leave it open across a weekend.

**Addition B, a step 4b.** Before deploying, confirm the header the jobs are
actually sending is not null:

```sql
-- expect exactly 1
SELECT count(*) FROM vault.decrypted_secrets WHERE name = 'cron_secret';

-- expect 5 rows
SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid;

-- expect ZERO rows (no command holds a literal instead of a lookup)
SELECT jobid, jobname FROM cron.job
 WHERE command ILIKE '%X-Cron-Key%' AND command NOT ILIKE '%decrypted_secrets%';

-- expect 200 for the three HTTP jobs, and timed_out = false
SELECT id, status_code, timed_out, error_msg, created
  FROM net._http_response ORDER BY created DESC LIMIT 10;
```

**One imprecision, not an error.** Step 1 says "Confirm it is still present
before step 4." `CRON_SECRET` is not needed until step **5**, when the gate goes
live. Checking at step 4 is early, i.e. conservative, so the instruction is safe
as written.

---

## 12. Regression surface (grep, not intuition)

Paths that reference what changed, found by `rg` across the repo excluding
`docs/`, `.claude/` and the git-ignored `_reorg-stray/`:

- **Importers of `_cron_auth`:** exactly the three survivors
  (`expire-plan-grants.js:21`, `schedule-collections.js:30`,
  `ping-sitemap.js:35`). Nothing else. **No manual look needed.**
- **Callers of the three gated endpoints:** none. Every hit is a comment, a
  `netlify.toml` block header, or a `db/` migration comment. Nothing under
  `brandgeo-dashboard/src/` performs a `fetch` to any of them. **No frontend
  regression surface.**
- **References to the two deleted functions:** all documentation. Three need a
  manual look because they now name files that do not exist — this is `012`'s R3
  and I confirm all three:
  - `db/supabase-cost-eur-migration.sql:34`
  - `db/supabase-response-text-migration.sql:20`
  - `db/supabase-prospect-audits-migration.sql:74` (also points at
    `netlify.toml` for a schedule that is gone)
  Comments only, nothing breaks, all outside `010`'s `scope_write`. Repoint them
  at `db/supabase-scheduled-jobs-migration.sql` in a follow-up.
  `CLAUDE.md:280, :284, :298, :807` and `docs/MASTER-TASK-LIST.md:65, :438` also
  reference them and are stale on the same point.
- **`netlify/functions/package.json`** is `"type": "commonjs"`, so
  `_cron_auth.js`'s `require` / `module.exports` is correct for this directory
  and the arch §3.2 argument against an ESM conversion holds.
- **Adjacent but untouched:** `force-index.js` shares `_indexing.js` with
  `ping-sitemap.js`. `_indexing.js` is unmodified, so `force-index.js` is
  unaffected. `collection-worker-background.js` is triggered by
  `schedule-collections.js` via `triggerWorker()` in `_enqueue.js`, unchanged —
  but see R1 below, its own gate still fails open.

---

## 13. Data and claim integrity

Every user-facing number in this change: **none.** Nothing in the diff renders to
a customer. The three functions produce log lines, `job_runs` rows and one admin
email; the migration produces database objects. No pricing, plan label, metric or
marketing claim is touched.

Numbers asserted in the packet and traced to source by me: the 24-month window
(traced to `cron.job` jobid 1's command and `purge-old-results.js:19`), 90 and
180 days (traced to `purge-old-audits.js:21-22`), `timeout = 26` (traced to
`netlify.toml:64, :135, :170`), `timeout_milliseconds := 30000` (traced to
migration `:125, :143, :162`), `MAX_PINGS_PER_RUN = 25` (unchanged,
`ping-sitemap.js:38`), 64-character Vault secret (verified by query), 36 clients
on `manual` (arch doc row 9, not re-verified — see §14). **Nothing untraceable.**

---

## 14. What was NOT checked

Stated plainly. A reviewer who lists nothing here did not review.

1. **Every deploy-time criterion.** That an anonymous `POST` returns `401` over
   real HTTP; that the two deleted functions return `404`; that a correct
   `X-Cron-Key` produces each function's full normal response against live
   Supabase, Resend and Google. Harness B proves the gate decision; it cannot
   prove Netlify's routing. Rollout step 6.
2. **The migration was not applied**, per the packet's "Do not". So: that it
   applies cleanly, that `cron.job` then holds five rows, that `job_runs` is
   created with the intended shape, and that it gains rows. All read from the SQL
   text only.
3. **Whether pg_cron can read Vault at run time**, as opposed to `postgres`
   reading it interactively. I established that the job will run as `postgres`
   (`cron.job.username`), the same role whose interactive read I demonstrated —
   strong evidence, not proof. Rollout step 4.
4. **D3, the `pg_net` `timeout_milliseconds` question.** `bg-backend` did not
   measure it and said so plainly, which is the correct disposition. I did not
   measure it either, for the same reason: settling it requires firing
   `net.http_post` at production or building a purpose-made slow endpoint, both
   outside a read-only review. The stated mitigation is sound — 30000 always
   outlasts the 26000 function cap, so the race does not arise — and the
   post-cutover query in `012` §D3 does settle it in one cycle. **Treat
   bg-backend's mechanism argument as an untested hypothesis, as they labelled
   it.**
5. **Whether the Netlify schedules deregister on deploy.** No agent can see the
   Netlify Functions UI. Rollout step 7, Constantin only. A leftover "Scheduled"
   badge means a live duplicate scheduler and must be reported back.
6. **Whether `CRON_SECRET` is set in Netlify.** Environment variables are not
   readable by an agent and must not be requested. Every claim about the gate
   working in production is conditional on this.
7. **Whether any external uptime monitor GETs these three URLs** (JC3). In-repo
   is clean; outside the repo is invisible to me.
8. **`INTERNAL_AUDIT_KEY`'s state**, on which R1's severity entirely depends.
9. **Light mode, accessibility, and any UI surface.** This change has no UI. No
   contrast ratio, keyboard path, focus state, heading order or hit target
   exists to measure. The accessibility section of this review is empty because
   the change is server-side only, not because it was skipped.
10. **The 36-clients-on-`manual` claim** from arch doc row 9 was not re-queried.
    It bears on how inert `schedule-collections` currently is, not on whether the
    gate is correct.
11. **`docs/qa/deploy-pipeline-netlify.md` F2** (underscore helpers are publicly
    routable). `_cron_auth.js` adds a 24th, per R4. Pre-existing finding,
    pre-existing owner, exports no handler, not re-litigated here.

---

## 15. Pre-existing defects noted, not blocking this release

- **`collection-worker-background.js:35-43` fails open — PRE-EXISTING, LIVE.**
  If `INTERNAL_AUDIT_KEY` is unset it accepts any caller and warns to a log
  nobody reads. That function drains the collection queue and calls engines, so
  an unauthenticated trigger spends real LLM budget. This is the same defect
  class `010` just fixed, on a function with a **larger** blast radius than two
  of the three just gated. It is `012` R1 and arch §10 item 1, and it is
  explicitly out of scope for this packet.
  **I am not blocking on it, and here is the reasoning rather than a shrug:**
  whether it is live depends entirely on an environment variable no agent can
  read, this packet does not make it worse, and holding a fix that closes three
  live endpoints in order to also close a fourth is a net loss in exposure.
  **It deserves a packet immediately after this one** and it needs Constantin to
  confirm the variable first.
- **Google indexing credential broken since 2026-07-19 — PRE-EXISTING.**
  `ping-sitemap.js:122-127` returns `500` before any row is written, so the 20 US
  city pages added 2026-07-24/25 have never been submitted. Not caused by this
  change and not fixed by it. This change is what makes it visible: after
  cutover it appears daily in `job_runs` as
  `{"stage":"google_auth", ...}` with `ok = false`. `012` R2.
- **F1 itself remains live until Rollout step 5 completes.** Five ungated
  endpoints are anonymously callable on the public internet right now. That is
  the pre-existing exposure this packet closes, already on the `CLAUDE.md`
  backlog and already escalated; nothing I found today changes its status. It is
  named here so that "PASS WITH FINDINGS" is not misread as "the exposure is
  closed" — the exposure closes when the code deploys, not when this review
  lands.

---

## 16. The commit command

Written by `bg-verify` against the final diff, per `012` "Do" item 9. **Not
run.** Path-by-path on purpose: `git add -A .` would sweep in seven unrelated
untracked items (`.claude/skills/`, `brandgeo/web/bg-018.html` and its hero
image, `docs/audit/`, `docs/ROADMAP-2026-07-27.md`,
`docs/design/dashboard-visual-system.md`, `docs/linkedin-posts-2026-07-24.md`)
plus packet `011` and its QA report, which belong to a different, concurrent
initiative and must not ride along.

`-A` is required so the **two deletions** are staged, not just the modifications.

Per AGENT-OS §7 rule 7 and `rules/execution-delegation.md`, Constantin runs this,
not an agent. Per `rules/parallel-task-scoping.md`, no other session may hold a
git command while this runs.

```bash
cd "C:/Users/const/Constantin Daniel Goane/BrandGEO"

git add -A -- \
  "brandgeo-dashboard/netlify/functions/_cron_auth.js" \
  "brandgeo-dashboard/netlify/functions/expire-plan-grants.js" \
  "brandgeo-dashboard/netlify/functions/schedule-collections.js" \
  "brandgeo-dashboard/netlify/functions/ping-sitemap.js" \
  "brandgeo-dashboard/netlify/functions/purge-old-results.js" \
  "brandgeo-dashboard/netlify/functions/purge-old-audits.js" \
  "brandgeo-dashboard/netlify.toml" \
  "db/supabase-scheduled-jobs-migration.sql" \
  ".claude/handoffs/012-bg-backend-to-bg-verify-scheduled-function-auth.md" \
  "docs/qa/scheduled-function-auth-012-review.md"

# Verify before committing. Expect exactly these 10 rows and nothing else:
#   A  brandgeo-dashboard/netlify/functions/_cron_auth.js
#   M  brandgeo-dashboard/netlify.toml
#   M  brandgeo-dashboard/netlify/functions/expire-plan-grants.js
#   M  brandgeo-dashboard/netlify/functions/ping-sitemap.js
#   D  brandgeo-dashboard/netlify/functions/purge-old-audits.js
#   D  brandgeo-dashboard/netlify/functions/purge-old-results.js
#   M  brandgeo-dashboard/netlify/functions/schedule-collections.js
#   A  db/supabase-scheduled-jobs-migration.sql
#   A  .claude/handoffs/012-bg-backend-to-bg-verify-scheduled-function-auth.md
#   A  docs/qa/scheduled-function-auth-012-review.md
git status --short

git commit -m @'
feat(functions): gate the cron jobs on a shared secret, move scheduling to pg_cron

Closes docs/qa/deploy-pipeline-netlify.md F1. Five Netlify functions accepted an
unauthenticated public POST and did real work: two DELETEd rows with the service
key, one reverted customer plans and emailed them, one enqueued work that spends
LLM budget. Netlify's scheduler sends only a {"next_run": "..."} body, which is
not a credential, so no gate was possible while it remained the caller.

Adds _cron_auth.js: 405 non-POST, 503 on unset or empty CRON_SECRET (fail closed,
unlike collection-worker-background.js), 401 {"error":"unauthorized"} on a missing
or wrong X-Cron-Key, timingSafeEqual behind a length guard. Gates expire-plan-grants,
schedule-collections and ping-sitemap as the first statement of each handler, before
the service-key client is constructed. Each now writes one public.job_runs row per
invocation on every post-gate return path, checking supabase-js's returned error and
not only the throw, so a missing table cannot look healthy.

Deletes purge-old-results.js (fully redundant with pg_cron jobid 1, which has run
the identical 24-month ai_results delete on the identical schedule for 20 days) and
purge-old-audits.js (pure SQL, reproduced as a direct pg_cron job). The public
surface drops from five endpoints to three and both service-key DELETE endpoints
stop existing.

Removes all five schedule keys from netlify.toml and gives expire-plan-grants and
schedule-collections the timeout = 26 they had been silently inheriting 10s for.
Supabase pg_cron plus pg_net becomes the scheduler: it can send a header, it is
already proven firing daily here, and its history is queryable in SQL.

db/supabase-scheduled-jobs-migration.sql is NOT YET APPLIED. Apply it BEFORE this
deploy reaches production, per docs/arch/scheduled-function-auth.md section 8. A
fail-closed gate deployed ahead of the secret breaks every job at once.

Build: bg-backend, packet 010. Review: bg-verify, packet 012, verdict PASS WITH
FINDINGS, docs/qa/scheduled-function-auth-012-review.md. All six findings are LOW;
M1 and M2 are worth closing before the migration is applied.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
'@
```

> **PowerShell note.** The `@'` … `'@` here-string requires the closing `'@` at
> column 0 on its own line. In Git Bash, replace it with
> `git commit -F -` followed by the message on stdin, or use repeated `-m` flags.

**Do not push until Rollout step 4 has passed.** Netlify builds
`brandgeo-dashboard/` on push and the gate goes live at that moment. The
migration must already be applied and verified, or every job breaks.

### Line for `CLAUDE.md` (outside my write scope — `bg-orchestrator` or Constantin adds it)

In the initiative table:

```
| (scheduled-function auth) | bg-verify | `docs/qa/scheduled-function-auth-012-review.md` | **COMPLETE 2026-07-27, verdict PASS WITH FINDINGS** |
```
