---
id: 012
from: bg-backend
to: bg-verify
status: READY
created: 2026-07-27
scope_write: docs/qa/
scope_read: brandgeo-dashboard/netlify/functions/_cron_auth.js, brandgeo-dashboard/netlify/functions/expire-plan-grants.js, brandgeo-dashboard/netlify/functions/schedule-collections.js, brandgeo-dashboard/netlify/functions/ping-sitemap.js, brandgeo-dashboard/netlify/functions/collection-worker-background.js, brandgeo-dashboard/netlify/functions/force-index.js, brandgeo-dashboard/netlify/functions/_auth.js, brandgeo-dashboard/netlify/functions/_enqueue.js, brandgeo-dashboard/netlify/functions/_email.js, brandgeo-dashboard/netlify/functions/_admin_notify.js, brandgeo-dashboard/netlify/functions/_indexing.js, brandgeo-dashboard/netlify.toml, db/supabase-scheduled-jobs-migration.sql, db/supabase-prospect-audits-migration.sql, db/supabase-sitemap-pings-migration.sql, docs/arch/scheduled-function-auth.md, docs/qa/deploy-pipeline-netlify.md, .claude/handoffs/010-bg-architect-to-bg-backend-scheduled-function-auth.md
model: opus
---

## Decision

`bg-backend` ran packet `010` against `docs/arch/scheduled-function-auth.md`. All
ten "Do" items are implemented. Eight files are edited, added or deleted on the
working tree and **every one is uncommitted**: no git command has been run, and
the migration has **not** been applied, per `010`'s "Do not" list and AGENT-OS
builder/reviewer separation.

This closes `deploy-pipeline-netlify.md` **F1**. It touches an auth gate, a
service key, plan reversion and customer email, so `bg-backend.md` OBJECTIVE #5
makes this `bg-verify` handoff mandatory. Nothing is committed and nothing is
applied until this review lands.

**Two of `010`'s own acceptance criteria are unsatisfiable as written.** Both are
arithmetic/grep errors inherited from the arch doc, not implementation gaps. See
§Corrections. Do not chase them.

## What changed

Eight files, exactly `010`'s `scope_write`, nothing outside it.

| File | Change |
|---|---|
| `netlify/functions/_cron_auth.js` | **NEW.** 79 lines. The gate. |
| `netlify/functions/expire-plan-grants.js` | Gate call + `job_runs` write. |
| `netlify/functions/schedule-collections.js` | Gate call + `job_runs` write. |
| `netlify/functions/ping-sitemap.js` | Gate call + `job_runs` write. |
| `netlify/functions/purge-old-results.js` | **DELETED.** |
| `netlify/functions/purge-old-audits.js` | **DELETED.** |
| `netlify.toml` | All five `schedule` keys removed; two `timeout = 26` added. |
| `db/supabase-scheduled-jobs-migration.sql` | **NEW.** `job_runs` + four pg_cron jobs. |

1. **`_cron_auth.js` implements §6.1 exactly**: `405` non-POST, `503` on unset or
   empty `CRON_SECRET`, `401` with body exactly `{"error":"unauthorized"}` on a
   missing or wrong `X-Cron-Key`, `null` on pass. `crypto.timingSafeEqual` behind
   an explicit length check. No CORS, no `OPTIONS`, no `_auth.js`, no origin
   logic. It does **not** copy the `collection-worker-background.js:35` fail-open.
2. **The gate is the first statement of all three handlers**, before
   `createClient`. Proven behaviourally, not by reading: the harness in §Harness
   asserts that a rejected request constructs no Supabase client at all.
3. **`job_runs` write on every post-gate return path.** 3 paths in
   `expire-plan-grants`, 3 in `schedule-collections`, 8 in `ping-sitemap`,
   carrying the summary each already computed and previously only logged.
4. **Gate rejections deliberately write no `job_runs` row.** A `401` is not a job
   run, and recording it would hand an anonymous caller an unbounded write
   primitive into the table — turning an observability fix into a new exposure.
   This is a judgement call and is the first thing to review in §Do item 3.
5. **Business logic diff is empty for all three survivors.** The only additions
   are the gate call, the `recordJobRun` helper, its call sites, and comments.
   No filter, cutoff, cap, loop bound or return status was touched.
6. **`netlify.toml`**: zero `schedule = ` keys remain (four textual matches for
   the string `schedule` survive and are correct — see §Corrections C2).
   `expire-plan-grants` and `schedule-collections` now declare `timeout = 26`
   with the reason inline; `ping-sitemap` keeps its existing 26.
7. **The migration creates four jobs, not five**, and deliberately does not
   recreate jobid 1. The secret is read from `vault.decrypted_secrets` inside
   each command; no literal appears anywhere.

### One defect found and fixed beyond the packet text

`recordJobRun` as first written caught only thrown exceptions:

```js
try { await supabase.from('job_runs').insert({...}) } catch (err) { ... }
```

`supabase-js` **returns** `{ error }` for a database-level failure (missing
table, RLS denial, constraint violation) and only **throws** at the network
layer. So the single likeliest failure of all — this code deployed ahead of the
migration that creates `job_runs` — would have been swallowed with no log
whatsoever, and the job would have looked healthy while recording nothing. That
is the exact failure class this table exists to eliminate.

Fixed in all three files: the returned `error` is now checked and logged, the
throw is caught separately, and neither can fail the job. Reviewed as part of
"the `job_runs` write", not as business logic.

## The three determinations `010` required of me

### D1. `purge-old-results.js` vs pg_cron jobid 1 — equivalent. Deletion stands.

`010` item 2 required this diff before the file could be deleted, and a BLOCKED
packet if they were not equivalent. They are. Measured, not reasoned.

Jobid 1's command, read from `cron.job` today:

```sql
DELETE FROM public.ai_results WHERE checked_at < NOW() - INTERVAL '24 months';
```

`purge-old-results.js:21` to `:27`: `new Date()`, `setMonth(getMonth() - 24)`,
then `.from('ai_results').delete().lt('checked_at', cutoff)`. Same table, same
column, same operator, same schedule slot.

Both cutoffs computed side by side across seven dates including every calendar
edge case:

| Run day | JS (`setMonth`) | Postgres (`INTERVAL '24 months'`) | Same |
|---|---|---|---|
| 2026-07-27 | 2024-07-27 | 2024-07-27 | yes |
| 2026-01-31 | 2024-01-31 | 2024-01-31 | yes |
| 2026-03-31 | 2024-03-31 | 2024-03-31 | yes |
| 2026-02-28 | 2024-02-28 | 2024-02-28 | yes |
| 2026-08-31 | 2024-08-31 | 2024-08-31 | yes |
| 2026-12-31 | 2024-12-31 | 2024-12-31 | yes |
| **2028-02-29** | **2026-03-01** | **2026-02-28** | **no, 1 day** |

The sole divergence is 29 February of a leap year, where JS `setMonth` overflows
a non-existent 2026-02-29 forward to 03-01 while Postgres clamps back to 02-28.
Next occurrence 2028-02-29. On that one day the deleted Node version would have
had the **wider** window, i.e. it would delete rows not yet 24 full months old.
pg_cron is the stricter and more correct of the two. Nothing is lost by deleting
the Node copy; a latent off-by-one-day retention bug is lost with it.

Both have been returning `DELETE 0` regardless: no data on the platform is 24
months old yet.

### D2. Fail-closed `503` demonstrated with the variable cleared

Not asserted. Run, with `CRON_SECRET` deleted from the environment and then set
to `''`. Full matrix in §Harness; the load-bearing rows:

```
unset secret, POST + no header   -> 503 {"error":"cron auth not configured"}
unset secret, POST + good header -> 503 {"error":"cron auth not configured"}
empty secret, POST               -> 503 {"error":"cron auth not configured"}
```

A correct key does **not** rescue an unset secret, which is the property that
distinguishes fail-closed from fail-open. All three handlers return `503` with
zero side effects in that state.

### D3. `pg_net` `timeout_milliseconds` — **I did not measure it. Stated plainly.**

`010` item 10 permits measuring or saying plainly that I did not. I did not, and
I am not going to dress up the reasoning as a measurement.

**Why not measured:** settling it requires an endpoint that runs longer than the
pg_net timeout *and* records server-side whether it completed. None of the three
functions is such an endpoint today — `ping-sitemap` fails fast at Google auth,
`expire-plan-grants` has nothing due, `schedule-collections` finds all 36 clients
on `manual`. Building a purpose-made slow endpoint is outside `010`'s
`scope_write`, and firing `net.http_post` at production to find out is an
outward-facing side effect I will not take unilaterally.

**What I believe and why:** `pg_net` is a background worker driving libcurl;
`timeout_milliseconds` is a **client-side** wait, and its expiry aborts the
client's side of the connection. A Netlify function is a Lambda invocation driven
by the platform, not by the client socket, so a client disconnect discards the
response rather than cancelling the run. On that model a pg_net timeout loses the
status and **cannot** terminate in-flight work. This is reasoning from mechanism.
Treat it as a hypothesis.

**Why it is low-stakes either way, which is the real answer:** the migration sets
`30000`, and both long functions cap at `26000`. pg_net always outlasts the
function, so the race does not arise. The default `5000` is what would have made
it bite — a 6-to-26-second run would log a pg_net timeout against a function that
in fact finished. `job_runs` is precisely the instrument that tells those apart.

**The query that settles it after cutover**, and it settles it in one full cycle:

```sql
select r.job, r.ran_at, r.ok, h.status_code, h.error_msg
from public.job_runs r
left join net._http_response h on h.created >= r.ran_at - interval '1 minute'
order by r.ran_at desc limit 20;
```

A `job_runs` row with `ok = true` beside a pg_net timeout proves the work
completed despite the client giving up, and confirms the hypothesis. A pg_net
timeout with **no** `job_runs` row at all refutes it and means the timeout really
does kill the invocation — in which case `30000` is load-bearing rather than
merely tidy, and that must be recorded in the arch doc.

## Corrections to packet 010 and the arch doc

Both are defects in the acceptance criteria, not in the build. Recorded so
`bg-verify` does not spend a cycle proving an impossibility.

- **C1. "`cron.job` holds six active jobs" is wrong. The correct number is
  five.** `010` acceptance criterion 7 and arch doc §11 both say "jobid 1
  unmodified, plus the five from arch doc §7.1". §7.1's table has five rows, and
  **jobid 1 is one of them** — its own row says "already exists, do not touch".
  So the sum double-counts it. Correct expectation: **five active jobs**, being
  jobid 1 plus the four the migration creates. The migration's own verify block
  says five and is right.
- **C2. "`grep -c schedule netlify.toml` returns 0" is unsatisfiable.** Arch doc
  §11 states it. It cannot be zero while the function is *named*
  `schedule-collections`. Four textual matches remain and all four are correct:
  the `[functions."schedule-collections"]` block header, a comment naming
  `db/supabase-scheduled-jobs-migration.sql`, and two unrelated comments about
  the social-post scheduled queue. The substantive criterion is **no
  `schedule = ` key assignment**, which is met:
  `grep -nE '^\s*schedule\s*=' brandgeo-dashboard/netlify.toml` returns nothing,
  exit 1.

## Do

1. **Reproduce §Harness independently.** Write it yourself from the description,
   run it, paste output and exit code. Do not quote my results. It drives the
   REAL `exports.handler` of all three functions with every dependency stubbed,
   so it is behavioural, not a paraphrase.
2. **Re-verify every `010` acceptance criterion against the diff**, substituting
   C1 and C2 above for the two broken ones. In particular confirm the business
   logic diff really is empty for all three survivors — read the full diff, not
   my table.
3. **Adjudicate the four judgement calls.** These are where I went beyond the
   packet text and they are the highest-value part of this review:
   - Gate rejections write no `job_runs` row (§What changed item 4). Accept or
     reject.
   - `recordJobRun` now checks the returned `error`, not only the throw.
   - `405` on non-POST removes any GET-based uptime check on these three URLs.
     Confirm nothing external polls them. I found no in-repo caller.
   - The header read is `headers['x-cron-key'] || headers['X-Cron-Key']`.
     Netlify lowercases, so branch one is what fires; branch two is defensive.
     Confirm no multi-value-header path bypasses it.
4. **Independently diff the two deleted files against what replaces them.**
   D1 covers `purge-old-results.js`; do not take it on trust, `010` item 2 makes
   this a stop condition. For `purge-old-audits.js`, confirm the migration's two
   `DELETE`s reproduce `:30` to `:38` exactly — same tables, same 90/180-day
   windows, same `created_at` column, and confirm the independence claim
   (`prospect_leads.audit_id` is `ON DELETE SET NULL`).
5. **Review the migration as a migration.** It has not been applied. Check it is
   re-runnable, that `cron.schedule` upserts by name on pg_cron 1.6.4, that no
   command contains a secret literal, and that `job_runs` gets RLS enabled with
   zero policies. Prerequisites I confirmed by query today and you should
   re-confirm: `net.http_post` exists in schema `net` with signature
   `(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)`
   and defaults on the last four (so omitting `params` is valid); Vault holds
   `cron_secret`; `job_runs` does not yet exist; `prospect_audits.created_at` and
   `prospect_leads.created_at` are both `timestamptz`; the SQL editor runs as
   `postgres` in database `postgres` with `SELECT` on `vault.decrypted_secrets`.
6. **Confirm the sequencing in §Rollout is not reorderable.** This is the part
   that can break production. A fail-closed gate deployed before the secret
   exists breaks every job at once. Verify the order, and verify the overlap
   window in arch §8.1 is genuinely safe per job.
7. Standard checks on the changed files: `git diff --stat`, secret scan, AI-tell
   scan (`rg "[—–]"`) reporting added-line and pre-existing counts separately.
   **Baseline measured before you start, so this is not read as a regression:**
   6 on added lines across the three survivors, 4 in `_cron_auth.js`, 13 in the
   migration — all in code comments. Their HEAD versions already carry 3, 2 and
   7 respectively, and **58 of the 71 files in `netlify/functions/` already
   contain them.** The no-AI-tells rule governs customer-facing copy, not code
   comments; nothing here reaches a customer. Rule on it once and move on rather
   than opening a 58-file cleanup inside a security fix.
8. Write the verdict report to `docs/qa/`.
9. If the verdict is `PASS` or `PASS WITH FINDINGS`, **write the `git add` /
   `git commit` command yourself** against the final diff. I have deliberately
   not drafted one: packet `006` recorded that `bg-verify` wrote its own anyway,
   and packet `011` adopted the same rule. Note the commit must include the two
   deletions.

## Do not

- Do not edit `_cron_auth.js`, the three functions, `netlify.toml`, or the
  migration. Report; do not fix.
- Do not apply the migration. It is Constantin's step 3 in §Rollout and it must
  land in that position, not earlier and not from an agent.
- Do not run any git command.
- Do not re-add a `schedule` key to `netlify.toml` for any reason.
- Do not gate on `next_run`, body shape, `user-agent` or any `x-nf-` header, and
  do not accept an argument that the platform gate makes the secret unnecessary.
  Arch doc §2.1 and §3.1 settle both.
- Do not fix `collection-worker-background.js`'s fail-open. Real, live, and R1
  below — separate packet.
- Do not fix the Google indexing credential. R2 below; needs Constantin.
- Do not touch `_auth.js`, `ALLOWED_ORIGINS`, `_plans.js`, `_cost.js`, or
  anything under `brandgeo-dashboard/src/`.
- Do not put a secret value in the report, a commit, or any packet.

## Acceptance criteria

- [ ] Verdict (`PASS` / `PASS WITH FINDINGS` / `BLOCK`) is the first line.
- [ ] Harness rebuilt and run independently; output and exit code pasted.
- [ ] All `010` criteria re-verified with pasted evidence, with C1 and C2
      substituted and the substitution explicitly confirmed as correct.
- [ ] The `503`-on-unset-secret behaviour is reproduced, not quoted.
- [ ] `401` body is byte-exactly `{"error":"unauthorized"}` for all three.
- [ ] A rejected request is shown to construct no Supabase client.
- [ ] D1's cutoff equivalence independently reproduced, including the leap-year
      row, with an explicit ruling that deleting `purge-old-results.js` is safe.
- [ ] The `purge-old-audits.js` → SQL reproduction is confirmed exact.
- [ ] All four judgement calls in "Do" item 3 explicitly accepted or rejected.
- [ ] Migration confirmed re-runnable and secret-free by reading, plus the
      prerequisite queries in "Do" item 5 re-run with output pasted.
- [ ] §Rollout confirmed correct and non-reorderable, or a corrected order given.
- [ ] Report written to `docs/qa/`, filename recorded in `CLAUDE.md`.

## Rollout — Constantin's sequence, in this order

Per `010` item 9, from arch §8 and §9. **The order is load-bearing.** Steps 1
and 2 are already done and verified; the rest run after this review passes.

1. ~~`CRON_SECRET` set in Netlify.~~ **Done.** Confirm it is still present before
   step 4.
2. ~~`pg_net` enabled; `cron_secret` in Vault.~~ **Done and verified today:**
   `pg_net` 0.20.3 with functions in schema `net`, Vault holds `cron_secret` at
   64 characters.
3. **Apply the migration, while the functions are still ungated.** Supabase SQL
   editor, paste `db/supabase-scheduled-jobs-migration.sql`. The jobs begin
   sending a header nothing yet checks, exercising the new path end to end before
   anything depends on it.
4. **Verify step 3 in SQL before deploying anything.** Expect five active jobs
   (C1), `succeeded` in `cron.job_run_details`, and a `200` in
   `net._http_response` for the three HTTP jobs. `schedule-collections` proves
   itself fastest, being hourly — wait for it before continuing.
5. **Only then commit and push the code**, using the command `bg-verify` writes.
   Netlify builds `brandgeo-dashboard/` and the gate goes live. Because the
   caller is already sending the header and already proven working, this is a
   pure tightening.
6. **Verify the gate.** Anonymous `POST` to each of the three returns `401`;
   `POST` to the two deleted ones returns `404`. Then one more full cycle still
   shows `succeeded`, and now `job_runs` gains rows.
7. **Confirm in the Netlify Functions UI that no function carries a "Scheduled"
   badge.** No agent can see that screen. A leftover badge means a stale deploy
   and a live duplicate scheduler.
8. **Habit change:** removing the `schedule` keys removes the **Run now** button.
   Manual triggering is now an authenticated request, and it leaves a `job_runs`
   row like any other invocation:
   ```
   curl -X POST https://app.getbrandgeo.com/.netlify/functions/schedule-collections -H "X-Cron-Key: $CRON_SECRET" -H "Content-Type: application/json" -d '{}'
   ```

If step 4 fails, **stop**. Do not deploy. An ungated function that works is
strictly better than a gated one whose only caller cannot reach it.

## Residual gaps found while building (file, do not fix here)

- **R1. `collection-worker-background.js:35` to `:43` still fails open.** If
  `INTERNAL_AUDIT_KEY` is unset it accepts any caller and warns to a log nobody
  reads. That function drains the collection queue and calls engines, so an
  unauthenticated trigger spends real LLM budget. This is the same defect class
  `010` just fixed, on a function with a larger blast radius than two of the
  three just gated. Whether it is live depends entirely on whether that variable
  is set in Netlify, which no agent can check. Arch §10 item 1. **Owner
  `bg-backend`, needs Constantin to confirm the variable. Worth a packet
  immediately after this one.**
- **R2. The Google indexing credential has been broken since 2026-07-19.**
  `ping-sitemap.js` returns `500 google credentials unavailable` before writing
  anything, so the 20 US city pages added 2026-07-24/25 have never been
  submitted. Not caused by `010` and not fixed by it, but `010` is what makes it
  visible: after cutover it appears daily in `job_runs` as
  `{"stage":"google_auth"}` with `ok = false` instead of vanishing into a log.
  Arch §9 item 6.
- **R3. Three `db/` migration files carry comments that now name deleted
  functions.** `supabase-cost-eur-migration.sql:34` and
  `supabase-response-text-migration.sql:20` both cite `purge-old-results.js`;
  `supabase-prospect-audits-migration.sql:74` cites `purge-old-audits.js` and
  points at `netlify.toml` for its schedule. All three are comments, nothing
  breaks, and all three are outside `010`'s `scope_write` so I left them. They
  are now misleading to the next reader and should be repointed at
  `supabase-scheduled-jobs-migration.sql`. (Copies under `_reorg-stray/` are
  git-ignored quarantine — ignore them.)
- **R4. `_cron_auth.js` adds a 24th publicly routable underscore helper.**
  `deploy-pipeline-netlify.md` **F2**, existing finding, existing owner. It
  exports no handler, so the failure is at handler lookup and no logic runs.
  `010` does not make F2 worse; recording it so the new file does not read as an
  endorsement of the `CLAUDE.md` §4.6 rule that F2 already disproved.
- **R5. Process note, not a code defect.** Two independent schedulers ran the
  same `ai_results` retention delete daily, undetected, for at least 12 days.
  Nothing surfaced it because neither had anything to delete. Worth a line in
  `CLAUDE.md` about how a second scheduler got added without anyone noticing the
  first, rather than a fix. Arch §10 item 3.

## Open questions for Constantin

None blocking. Status is READY.

One thing only he can settle, and it is step 7 of §Rollout rather than a
question: whether the Netlify schedules actually deregister on the deploy that
removes the `schedule` keys. Arch §12 item 1 records that no agent has ever been
able to confirm those schedules were registered in the first place. The design
removes the dependency rather than resolving the question, so a leftover
"Scheduled" badge is a live duplicate-scheduler bug and must be reported back,
not shrugged off.

## Harness

I ran two. Both are fixtures, not deliverables — rebuild them wherever you like
outside the repo. Neither needs network, Supabase, or environment variables.

**Harness A — the gate contract, `_cron_auth.js` in isolation.** 14 cases, all
passing. Require the real module, drive `requireCronAuth(event)` directly, and
assert `statusCode` and byte-exact `body`:

| Case | Expected |
|---|---|
| `CRON_SECRET` unset, POST, no header | `503 {"error":"cron auth not configured"}` |
| `CRON_SECRET` unset, POST, **correct** header | `503` — a good key must not rescue an unset secret |
| `CRON_SECRET = ''`, POST | `503` |
| set, `GET` with correct key | `405 {"error":"method not allowed"}` |
| set, `OPTIONS` | `405` — no CORS preflight path exists |
| set, POST, no header | `401 {"error":"unauthorized"}` |
| set, POST, wrong key **same length** | `401` — exercises `timingSafeEqual`, not the length guard |
| set, POST, wrong key shorter / longer | `401` — exercises the length guard; must not throw |
| set, POST, correct key, `x-cron-key` | `null` (pass) |
| set, POST, correct key, `X-Cron-Key` | `null` (pass) |
| `undefined` event | `405`, no throw |
| POST with `headers` undefined | `401`, no throw |

Assert the `401` body with `JSON.stringify(body) === JSON.stringify('{"error":"unauthorized"}')`.
A same-length wrong key and an unequal-length wrong key are separate cases on
purpose: they exercise different branches, and the length guard exists because
`timingSafeEqual` throws rather than returning false.

**Harness B — the real handlers, end to end.** Override `Module._load` to stub
`@supabase/supabase-js`, `./_plans`, `./_email`, `./_admin_notify`,
`./_indexing`, `./_auth` and `./_enqueue`, with every stub **pushing onto a
`touched` array**. Then `require` each of the three real functions and drive
`exports.handler`. Assert both the status and that `touched` is empty:

```
expire-plan-grants     anon POST      -> 401 {"error":"unauthorized"}       | sideEffects: NONE
expire-plan-grants     GET+good key   -> 405 {"error":"method not allowed"} | sideEffects: NONE
expire-plan-grants     no CRON_SECRET -> 503 {"error":"cron auth not configured"} | sideEffects: NONE
schedule-collections   anon POST      -> 401 {"error":"unauthorized"}       | sideEffects: NONE
schedule-collections   GET+good key   -> 405 {"error":"method not allowed"} | sideEffects: NONE
schedule-collections   no CRON_SECRET -> 503 {"error":"cron auth not configured"} | sideEffects: NONE
ping-sitemap           anon POST      -> 401 {"error":"unauthorized"}       | sideEffects: NONE
ping-sitemap           GET+good key   -> 405 {"error":"method not allowed"} | sideEffects: NONE
ping-sitemap           no CRON_SECRET -> 503 {"error":"cron auth not configured"} | sideEffects: NONE
```

The `sideEffects: NONE` column is the point of Harness B and is what Harness A
cannot show. It proves the gate precedes `createClient`, so a rejected request
never constructs a service-key client, never opens a socket, never sends an
email and never enqueues work. `grep` proves the line ordering; this proves the
behaviour.

**Not covered by either harness, and why.** Whether Netlify returns `404` for
the two deleted functions (deploy-time, §Rollout step 6); whether the migration
applies cleanly (it has not been applied, "Do" item 5); whether pg_cron can read
Vault at run time as opposed to `postgres` reading it interactively (§Rollout
step 4); and D3's pg_net timeout question. All four are post-cutover
observations, and all four are exactly what `job_runs` and `cron.job_run_details`
were added to make answerable.
