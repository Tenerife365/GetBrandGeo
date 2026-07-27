# Architecture: authentication and scheduling for the five scheduled Netlify functions

**Decision: adopt the shared secret header, and move the scheduler to Supabase
`pg_cron` + `pg_net`. Delete two of the five functions outright.**

- Subject: `docs/qa/deploy-pipeline-netlify.md` **F1**, both halves.
- Agent: `bg-architect` (Opus) | Date: 2026-07-27 | Write scope: this file, plus
  `.claude/handoffs/010-bg-architect-to-bg-backend-scheduled-function-auth.md`.
- No implementation code written, by role. The build packet is `010`.
- Downstream: `bg-backend` (Opus, this touches billing-adjacent code and a
  service key), then `bg-verify`.

---

## 0. The ruling in five lines

Netlify's scheduled-invocation signal is **not a credential** and cannot be made
into one, so gating on it is theatre. A shared secret header **is** a credential,
but Netlify's scheduler cannot send one, so choosing it forces the caller to
change. Supabase `pg_cron` can send one, is **already installed and provably
firing daily in this project**, and its run history is queryable in SQL by every
agent in this OS. Two of the five functions are pure SQL and should not exist as
HTTP endpoints at all. The public attack surface goes from **five endpoints to
three**, and both endpoints that `DELETE` rows disappear.

---

## 1. What I verified, and how

Everything load-bearing below was checked against production or against the
Netlify documentation. Nothing here is remembered or inferred from `CLAUDE.md`.

| # | Claim | Method | Result |
|---|---|---|---|
| 1 | `pg_cron` is available in this Supabase project | `list_extensions` on `duiyifepitvugyulobqm` | **Already installed**, version `1.6.4`, schema `pg_catalog` |
| 2 | `pg_net` is available | same | Available, version `0.20.3`, **not installed** |
| 3 | Supabase Vault is available | same | **Installed**, `supabase_vault` `0.3.1`, schema `vault` |
| 4 | A pg_cron job already exists | `select * from cron.job` | **Yes, one:** jobid 1, `purge-old-ai-results`, `0 3 * * *`, active |
| 5 | That job actually fires | `select * from cron.job_run_details order by start_time desc limit 12` | **12 consecutive days, 2026-07-16 through 2026-07-27, every one `succeeded`, every one starting within 210ms of 03:00:00.000 UTC, every one returning `DELETE 0`** |
| 6 | What that job runs | `select command from cron.job where jobid = 1` | `DELETE FROM public.ai_results WHERE checked_at < NOW() - INTERVAL '24 months';` |
| 7 | Whether any Netlify schedule has ever fired | `select last_pinged_at, count(*) from public.sitemap_pings group by 1` | Three distinct runs: `2026-07-18 23:53:49` (25 rows), `2026-07-19 05:07:05` (18), `2026-07-19 05:07:20` (14) |
| 8 | Whether `expire-plan-grants` left a trace | `select ... from client_events where type = 'trial_expired'` | Zero rows. Uninformative: nothing has ever been due |
| 9 | Whether `schedule-collections` left a trace | `select refresh_cadence, count(*), max(last_refresh_at) from clients group by 1` | All **36** clients are `manual`, every `last_refresh_at` is `null`. Uninformative by design |
| 10 | Netlify's documented position on URL invocation | `docs.netlify.com/build/functions/scheduled-functions` | "You can't invoke scheduled functions directly with a URL." |
| 11 | What the scheduler sends | same | A `POST` whose body is `{"next_run": "<ISO-8601>"}`. **No signature. No secret. No documented `x-nf-` header.** |

Rows 5 and 6 are the finding that reshapes the fix. Row 7 is the finding that
corrects the audit. Row 11 is the finding that decides the auth mechanism.

---

## 2. Defect 1: the impossibility at the centre of it

The brief asks me to compare Netlify's own scheduled-invocation signal against a
shared secret header. The comparison resolves immediately once row 11 is on the
table, and it resolves in a way that has a consequence.

### 2.1 The scheduled-invocation signal is not a credential

Netlify's scheduler identifies itself with a JSON body containing `next_run`.
That is all it is documented to send. There is no HMAC, no bearer token, no
signed timestamp, nothing the receiver can verify and an attacker cannot
reproduce. Contrast `stripe-webhook.js`, which this codebase already treats as
correctly authenticated: Stripe signs the payload with a shared secret, so the
receiver can verify authorship. Netlify's scheduler signs nothing.

A gate of the form "accept if the body parses and contains `next_run`" is
satisfied by:

```
POST /.netlify/functions/expire-plan-grants
Content-Type: application/json

{"next_run":"2026-07-28T06:00:00Z"}
```

which is one line longer than the request the audit already sent successfully.
So that gate stops nothing, while creating the appearance that something is
stopped. It is also coupled to an undocumented payload shape that Netlify can
change without notice, so it would fail closed on the cron path at some
unpredictable future date, silently, which is failure mode 4 in the audit's own
table.

**Rejected. Not on preference. It does not authenticate.**

### 2.2 The shared secret header is a credential, but the caller cannot send one

A shared secret in a request header is a real credential and this codebase
already uses the pattern twice, in `force-index.js` (`FORCE_INDEX_KEY`) and in
`collection-worker-background.js` (`INTERNAL_AUDIT_KEY`). The problem is
mechanical: **Netlify's scheduler offers no way to attach a custom header to a
scheduled invocation.** There is no field for it in `netlify.toml`, none in the
in-code `config` object, and none documented anywhere.

So requiring the header while Netlify remains the caller locks out the only
legitimate caller. The brief's constraint, "the auth mechanism must not break the
cron path", is what makes this decisive rather than a detail.

### 2.3 Therefore

The choice is not really "which check do I add to the handler". It is:

- **Option A.** Keep Netlify as the scheduler and accept that the endpoint cannot
  be authenticated. The only remaining protection is Netlify's claim in row 10
  that a registered scheduled function is not URL-routable, which section 3 shows
  is **false in this project's production**. Under Option A the exposure stays
  open and we would be documenting it as accepted risk.
- **Option B.** Keep the shared secret and **replace the caller with one that can
  present it.**

**Option B.** Section 4 picks the replacement, and it is picked on evidence, not
on taste.

---

## 3. Defect 2 settled: the schedules probably *are* firing, and the audit's inference was wrong

The audit reasoned that a `200` with a real body from all five endpoints is
evidence against cron registration, since Netlify documents that scheduled
functions are not URL-invokable. That reasoning is sound but the conclusion does
not survive the data.

**`sitemap_pings` (row 7) records three write events and nothing since.**

| When (UTC) | Rows written | Reading |
|---|---|---|
| 2026-07-18 23:53:49 | 25, **exactly `MAX_PINGS_PER_RUN`** | A capped first run. 23:53 is not a scheduled slot, so this was a manual or post-deploy invocation. |
| 2026-07-19 05:07:05 | 18 | Inside the `0 5 * * *` slot, 7 minutes of scheduler jitter. |
| 2026-07-19 05:07:20 | 14 | 15 seconds later. Two overlapping invocations racing on the same `changed` set, which is why neither reached the 25 cap. |

**A write landed inside `ping-sitemap`'s scheduled hour, on the one day between
the function's first run and its credentials breaking.** That is evidence the
toml-declared schedule fired. It is not proof, because a human could have clicked
Run now at 05:07, but nothing else in the record suggests that and the timing
lines up with the cron.

**The silence after 2026-07-19 is fully explained and is not evidence of
anything.** `ping-sitemap.js:79` calls `createGoogleIndexer()` and `:80` to `:83`
returns `500 google credentials unavailable` on throw, **before any row is
written**. The audit hit exactly that 500 on 2026-07-26. So every run since the
credential broke, scheduled or not, writes nothing. Absence of rows since 07-19
tells us the credential is broken. It tells us nothing about registration.

Rows 8 and 9 confirm the audit's own prediction that the other traces are
uninformative: nothing has ever been due for `expire-plan-grants`, and all 36
clients sit on `refresh_cadence = 'manual'`, so `schedule-collections` has never
had work.

### 3.1 What this means for the platform gate

If the schedules are registered **and** the endpoints returned `200` to an
anonymous POST on 2026-07-26, then in this project a toml-declared scheduled
function is **both scheduled and publicly HTTP-invokable at the same time**,
which contradicts row 10.

I am not going to litigate whether Netlify's documentation is wrong, whether the
toml route differs from the in-code route, or whether the behaviour changed. It
does not matter. What matters for the design is the conclusion, and the
conclusion is one-way:

> **The platform gate is not something this system may depend on.** Either it
> does not exist here, or it exists and is contradicted by the docs, or it exists
> and can be withdrawn silently. In all three cases the correct architecture is
> one that does not rely on it.

Option B does not rely on it. That is its main virtue, ahead of everything else.

### 3.2 Should the fix migrate to the `schedule()` wrapper?

**No.** The brief asks, so here is the answer with reasoning rather than a
preference.

The in-code route (`export const config = { schedule: "..." }`, or the older
`schedule()` wrapper from `@netlify/functions`) is an **alternative declaration
syntax for the same platform mechanism.** It changes where the cron string is
written. It does not add a credential, does not add a signature, does not change
what the scheduler sends, and does not change URL routability. Every argument in
section 2.1 applies to it identically.

Adopting it would also cost something real: these are CommonJS files
(`netlify/functions/package.json` sets `"type": "commonjs"`, which is what lets
all 72 use `require()` and `exports.handler` inside a repo whose root
`package.json` is `"type": "module"`). The in-code `config` export is the modern
ESM handler style. Migrating would mean converting handler signatures on
functions that also do `DELETE`s and send customer emails, for zero security
gain, in the same commit as a security fix. That is exactly the kind of coupled
change that makes a review unable to say what broke.

Under this design the question is moot anyway: **all five `schedule` keys are
removed and Netlify stops being the scheduler entirely.**

---

## 4. Why Supabase `pg_cron`, and not the other candidates

The replacement caller must be able to set an HTTP header. Three candidates
qualify.

| Candidate | Can send a header | Proven here | Run history readable by an agent | Verdict |
|---|---|---|---|---|
| **Supabase `pg_cron` + `pg_net`** | Yes | **Yes. Row 5: 12 consecutive daily runs, all `succeeded`, all within 210ms of the scheduled second** | **Yes.** `cron.job_run_details` is one SQL query | **Chosen** |
| GitHub Actions `schedule` | Yes | No | Only via the GitHub UI or API | Rejected |
| cPanel cron on the marketing host | Yes | No | No | Rejected |

**GitHub Actions** is rejected on two grounds. Its `schedule` trigger is
explicitly best-effort and is delayed or dropped under load, which is
unacceptable for a retention job with a compliance rationale. And the repo is
public, which means adding a scheduled workflow adds a public, forkable
description of exactly which internal endpoints exist and when they run. The
secret itself would be safe in Actions secrets; the schedule map would not be.

**cPanel cron** is rejected because `CLAUDE.md` keeps the two deploy pipelines
deliberately independent, and routing the dashboard's scheduling through the
marketing host couples them at the worst possible layer. The cPanel pipeline also
has its own open observability findings (`deploy-pipeline-cpanel.md` F2, F4).

**`pg_cron` is chosen on the third column as much as the second.** No agent in
this OS can read Netlify function logs. Every agent can query Supabase. The
audit's failure mode 4, "a scheduled function that silently never registers,
there is no error anywhere", is the most dangerous mode in this pipeline
precisely because it is unobservable from where the work happens. Moving the
scheduler into Postgres converts that mode into:

```sql
select jobname, status, start_time, return_message
from cron.job_run_details d join cron.job j using (jobid)
order by start_time desc limit 20;
```

That is the single largest durable improvement in this design, and it is
available today because row 5 proves the mechanism already works here.

### 4.1 The counter-argument, stated fairly

Swapping one scheduler for another swaps one set of silent failure modes for
another. `pg_net` can be disabled, the Vault secret can be missing, the Supabase
project can be paused. That is a real objection and it is why section 8 sequences
the migration so the new path is **proven working before the old one is removed**,
rather than the reverse.

The deciding difference is not reliability, it is **provability**. Netlify's
scheduler may well be reliable; row 7 suggests it is. But after a full audit by
`bg-verify` with production access, the honest verdict on it was still
UNVERIFIED, and it took a database query today to move that needle at all. A
mechanism this project cannot check is a mechanism this project should not depend
on for `DELETE`s, plan reversions and LLM spend.

---

## 5. The reshape: two of the five should not be HTTP endpoints at all

This is the part that does more for the exposure than any header check, and it
came out of row 6.

**`purge-old-results.js` is redundant.** pg_cron job 1, `purge-old-ai-results`,
has been running

```sql
DELETE FROM public.ai_results WHERE checked_at < NOW() - INTERVAL '24 months';
```

daily at 03:00 UTC, successfully, for at least 12 days. `purge-old-results.js:18`
to `:24` computes the same 24-month cutoff and issues the same delete against the
same table on the same schedule. **Two independent schedulers have been running
the same retention job, and nobody knew.** It has been harmless only because both
delete zero rows: the platform has no data older than 24 months yet.

So the correct fix for that endpoint is not a gate. It is **deletion**.

Generalising: a scheduled job only needs to be a Node function if it needs
something Postgres cannot do. Classify all five on that test.

| Function | Needs Node for | Destination |
|---|---|---|
| `purge-old-results.js` | Nothing. One `DELETE` with a time cutoff | **Delete the file.** pg_cron job 1 already does it, verified |
| `purge-old-audits.js` | Nothing. Two `DELETE`s with time cutoffs (`purge-old-audits.js:30` to `:38`) | **Delete the file.** Becomes a pg_cron SQL job alongside job 1 |
| `expire-plan-grants.js` | Resend email via `_email.js`, `PLAN_LABELS` from `_plans.js`, `recordAdminEvent` from `_admin_notify.js` | **Keep.** Gate it, call it from pg_cron via `pg_net` |
| `schedule-collections.js` | `checkCollectionLimits` from `_auth.js`, `enqueueClientCollection` and `triggerWorker` from `_enqueue.js` | **Keep.** Gate it, call it via `pg_net` |
| `ping-sitemap.js` | Fetches an external sitemap, Google OAuth, IndexNow submission | **Keep.** Gate it, call it via `pg_net` |

**Result: the public surface drops from five endpoints to three, and both
endpoints that issue a `DELETE` with the service key stop existing.** Those two
were the sharpest items in F1(a). They are not being defended, they are being
removed.

The remaining three still need a real gate, because they retain the two effects
F1(a) called out as the actual exploit path: `expire-plan-grants` is an
unauthenticated email and client-notification amplifier, and
`schedule-collections` enqueues work that spends LLM budget.

---

## 6. The gate contract

A new shared helper, `netlify/functions/_cron_auth.js`, exporting one function.
`bg-backend` writes it; this section is the contract it must satisfy.

### 6.1 Behaviour

`requireCronAuth(event)` returns either `{ response }`, which the caller must
return immediately, or `null`, meaning proceed.

1. **`event.httpMethod !== 'POST'` returns `405`.** No `OPTIONS` handling, no CORS
   headers, no origin logic. These are server-to-server endpoints and are never
   called from a browser. Do not route them through `_auth.js` and do not add
   anything to `ALLOWED_ORIGINS`.
2. **`process.env.CRON_SECRET` unset or empty returns `503`** with
   `{"error":"cron auth not configured"}`, and logs it. **Fail closed.**
3. **Header `X-Cron-Key` absent, or not equal to `CRON_SECRET`, returns `401`**
   with exactly `{"error":"unauthorized"}`. No job name, no hint, no echo of what
   was supplied.
4. **Otherwise returns `null`.**

Compare with `crypto.timingSafeEqual` over `Buffer.from(...)`, guarded by an
explicit length check first, since `timingSafeEqual` throws on unequal lengths.
Timing is not a practical attack against a 32-byte random secret over the public
internet, but the correct comparison costs one line and removes the question from
review.

### 6.2 Rule 2 is not negotiable, and here is the precedent it overturns

`collection-worker-background.js:35` to `:43` implements the opposite:

```js
const configured = process.env.INTERNAL_AUDIT_KEY
if (!configured) {
  console.warn('[Worker] INTERNAL_AUDIT_KEY not set - accepting unauthenticated trigger. ...')
  return true
}
```

**That fails open.** A missing environment variable, which is the single most
likely misconfiguration on a serverless platform and the exact state a fresh
deploy target is in, turns the gate off completely and announces it only to a log
nobody can read. `_cron_auth.js` must not copy this pattern. The consequence is
that `CRON_SECRET` has to be set in Netlify **before** the gating deploy goes
live, which section 8 sequences explicitly.

The worker's own fail-open is a separate live defect on a separate function. It
is **out of scope for packet 010** and is filed in section 10.

### 6.3 Why a new secret and a new header name

**New secret, `CRON_SECRET`.** `force-index.js:36` to `:42` already argues this
case for itself: a separate secret keeps the blast radius contained if either is
compromised. These three functions revert customer plans, send customer email and
spend LLM budget, which is a different blast radius from the audit engine's
`INTERNAL_AUDIT_KEY` and from the Google quota `FORCE_INDEX_KEY`.

**New header, `X-Cron-Key`.** `X-Internal-Key` already carries two different
secrets on two different endpoints. A third overload would make it impossible to
tell from a call site which secret is expected. This is a readability decision,
not a security one, and it is cheap.

### 6.4 Observability: the `job_runs` table

`cron.job_run_details` proves the **request was issued**. It cannot prove the
function did its work, because `pg_net` is asynchronous: the cron row succeeds the
moment the request is queued. `net._http_response` records the eventual status
but Supabase prunes it on a short horizon, so it is a debugging aid, not a record.

So each of the three surviving functions writes one row per invocation to a new
`public.job_runs` table before returning, on both the success and the failure
path:

| Column | Type | Notes |
|---|---|---|
| `id` | `bigserial` primary key | |
| `job` | `text not null` | the function name |
| `ran_at` | `timestamptz not null default now()` | |
| `ok` | `boolean not null` | |
| `detail` | `jsonb` | the summary the function already computes and currently only logs |

Index on `(job, ran_at desc)`. RLS enabled with **no policies**, which denies
`anon` and `authenticated` outright while the service key continues to bypass it.
That is the same deny-all posture applied to the legacy tables in `CLAUDE.md`
§6.4 step 7.

This is what finally answers "did the job run, and what did it do" in SQL, for
the three jobs where the answer has never been available. The two pure-SQL jobs
need nothing: `cron.job_run_details` already records their `DELETE n` return
message in full, as row 5 demonstrates.

---

## 7. The `pg_cron` and `pg_net` contract

A new migration file, `db/supabase-scheduled-jobs-migration.sql`, following the
existing `db/` convention of a re-runnable script that records a migration
already applied.

### 7.1 Schedules

Times are UTC. The three HTTP jobs are **deliberately offset by 10 minutes** from
their old Netlify slots.

| Job | Schedule | Mechanism |
|---|---|---|
| `purge-old-ai-results` | `0 3 * * *` | **Already exists as jobid 1. Do not touch it, do not recreate it, do not renumber it.** |
| `purge-old-prospect-audits` | `0 4 * * *` | New. Direct SQL, the two `DELETE`s from `purge-old-audits.js:30` to `:38` |
| `ping-sitemap` | `10 5 * * *` | New. `net.http_post` |
| `expire-plan-grants` | `10 6 * * *` | New. `net.http_post` |
| `schedule-collections` | `10 * * * *` | New. `net.http_post` |

The 10-minute offset exists because of the cutover window in section 8: the
migration lands before the deploy that removes the `schedule` keys, so for a
period both schedulers may fire. Offsetting them means the two callers never run
the same job concurrently. That is not hypothetical. Row 7 recorded two
`ping-sitemap` invocations 15 seconds apart racing on the same `changed` set, and
neither reached its cap as a result.

### 7.2 The secret must come from Vault, never from the command text

`cron.job.command` is plain text and is readable by anyone who can query the
database, which includes every agent in this OS. Embedding the literal secret
there would leak it to exactly the population this design is trying to keep
honest. Read it at run time from `vault.decrypted_secrets` instead, so the job
command contains a lookup and never a value.

Shape, illustrative and not to be copied verbatim:

```
cron.schedule(
  '<job name>',
  '<cron>',
  $$ select net.http_post(
       url     := 'https://app.getbrandgeo.com/.netlify/functions/<name>',
       headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'X-Cron-Key',   (select decrypted_secret
                                       from vault.decrypted_secrets
                                      where name = 'cron_secret')),
       body    := '{}'::jsonb,
       timeout_milliseconds := 30000
     ); $$
);
```

**Signature confirmed against the installed version on 2026-07-27**, so the
sketch above is accurate and not a guess:

```
net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer)
```

Note the schema. Supabase registers the **extension** in `extensions`, but
`pg_net` puts its **functions** in a schema called `net`. Call
`net.http_post(...)`, not `extensions.http_post(...)`. A pg_cron job does not
necessarily inherit a `search_path` containing either, so schema-qualify it.

### 7.3 One thing `bg-backend` must confirm empirically, not assume

`pg_net`'s `timeout_milliseconds` governs how long **pg_net waits for a
response**, not how long the Netlify function is allowed to run. A pg_net timeout
should not abort work already running server-side. Two of the three functions are
allowed 26 seconds, so the default 5000ms would record a timeout in
`net._http_response` for a function that in fact completed. Setting 30000 is what
makes `net._http_response` record a real status.

**Verify this, do not assert it.** If `pg_net` turns out to abort the connection
in a way that terminates the invocation, the `job_runs` table from section 6.4 is
what will reveal it, and the packet's acceptance criteria are written so that
this shows up as a failure rather than passing silently.

---

## 8. Sequencing: how to change the auth without breaking the cron path

The brief's constraint. The order below never has a window in which a job is
both gated and unreachable.

**Step 1. `CRON_SECRET` exists in both places, before any code changes.**
Generated once, set as a Netlify site environment variable, and stored in
Supabase Vault under `cron_secret`. Both are Constantin's, section 9.

**Step 2. Apply the migration, while the functions are still ungated.** The
pg_cron jobs start calling the live endpoints with an `X-Cron-Key` header that
nothing yet checks. The header is ignored, the calls succeed, and the new path
is exercised end to end **before** anything depends on it.

**Step 3. Verify step 2 from SQL.** `cron.job_run_details` shows `succeeded` for
each new job, and `net._http_response` shows a `200` for each of the three HTTP
jobs, within one full cycle of each schedule. `schedule-collections` proves
itself fastest, being hourly.

**Step 4. Deploy the code.** Add `_cron_auth.js`, gate the three survivors, delete
`purge-old-results.js` and `purge-old-audits.js`, remove all five `schedule` keys
from `netlify.toml`, add the two missing timeouts from section 8.1. This is a
pure tightening: the caller is already sending the header and is already proven
working, so nothing about the cron path is reconfigured at the moment the gate
turns on.

**Step 5. Verify the gate.** An anonymous POST to each of the three returns `401`.
Then one further full cycle of each schedule still shows `succeeded` and, now,
new `job_runs` rows.

### 8.1 The overlap window in steps 2 and 3 is safe, per job

Both schedulers may fire during that window. All four jobs are idempotent, and
this is not an assumption, it is what each one does:

- **`purge-old-audits`** deletes by a fixed time cutoff. A second run in the same
  day matches nothing the first did not already remove.
- **`ping-sitemap`** records a URL only after Google accepts it
  (`ping-sitemap.js:91` to `:95`), and skips anything whose `lastmod` is unchanged
  (`:71`). A second run finds nothing changed. It is currently failing at
  `:79` anyway, section 10.
- **`expire-plan-grants`** filters on `plan_source in ('trial','comp')` **and**
  `plan_grant_until < today` **and** `plan != 'free'`
  (`expire-plan-grants.js:22` to `:28`), then sets `plan_source = 'expired'`. A
  row cannot match twice. Row 8 also shows nothing has ever matched.
- **`schedule-collections`** stamps `last_refresh_at`
  (`schedule-collections.js:74`) so a second run within the cadence window finds
  nothing due (`:53`), and `checkCollectionLimits` caps spend regardless (`:58`).
  Row 9 shows all 36 clients are `manual`, so it does nothing today either way.

The 10-minute offsets in section 7.1 mean they do not even overlap in time.

### 8.2 Two timeouts to fix while `netlify.toml` is already open

`expire-plan-grants` and `schedule-collections` currently declare only a
`schedule` and therefore **inherit Netlify's 10 second default**
(`deploy-pipeline-netlify.md` §5). Both loop per client with several sequential
awaits: `expire-plan-grants` does four database writes plus a Resend email per
expiring client, and `schedule-collections` does a `checkCollectionLimits` call,
an enqueue and an update per due client across 36 clients.

**Neither has ever had real work to do**, per rows 8 and 9, which is the only
reason this has not surfaced. The first day either has work is the day it
truncates mid-loop. Once the `schedule` key is removed both blocks would be empty
and deleted, so this must be a deliberate `timeout = 26` on each, matching the
reasoning `netlify.toml:53` to `:57` already applies to `set-client-plan` for the
same shape of work. `ping-sitemap` already has 26.

This is in scope because it is the same file, the same commit, and removing the
`schedule` key without adding the timeout would silently delete configuration.

---

## 9. Steps that need Constantin

Flagged because no agent can read Netlify function logs, set Netlify environment
variables, or see the Netlify Functions UI.

1. **Generate the secret and set it in Netlify.** 32 random bytes, hex or base64.
   Netlify UI, site `dreamy-raindrop-4f29d5`, Site configuration, Environment
   variables, add `CRON_SECRET`. **Must be done before step 4 of section 8**, or
   the fail-closed gate rejects `pg_net` too. Do not paste the value into a chat
   session, a commit, or a handoff packet.

2. **Store the same value in Supabase Vault**, SQL editor:
   ```sql
   select vault.create_secret('<the same value>', 'cron_secret', 'Shared secret for pg_cron -> Netlify scheduled jobs');
   ```

3. **Enable the `pg_net` extension.** Supabase Dashboard, Database, Extensions,
   search `pg_net`, enable. `pg_cron` is already installed and needs nothing.

4. **Run `db/supabase-scheduled-jobs-migration.sql`** in the SQL editor, after
   `bg-backend` writes it and `bg-verify` reviews it.

5. **After the deploy, confirm in the Netlify Functions UI that no function
   carries a "Scheduled" badge.** This is the one check only Constantin can do,
   and it is the only way to prove the toml schedules are actually deregistered
   rather than merely edited in the repo. A leftover badge means a stale deploy
   and a live duplicate scheduler.

6. **Separately: the Google indexing credential is broken and has been since
   2026-07-19.** `ping-sitemap` returns `500 google credentials unavailable` at
   `ping-sitemap.js:82`. Row 7 shows the last successful ping was 2026-07-19
   05:07 UTC, and the 20 US city pages added on 2026-07-24 and 07-25 have
   therefore never been submitted. This is not caused by anything in this design
   and is not fixed by it, but this design is what makes it visible: after the
   migration the failure appears daily in `job_runs` and `net._http_response`
   instead of in an unread log. Filed in section 10.

### 9.1 One workflow change worth knowing about

Removing the `schedule` keys removes the **Run now** button from the Netlify
Functions UI, which is currently the documented way to trigger these by hand.
Manual triggering moves to an authenticated request:

```bash
curl -X POST https://app.getbrandgeo.com/.netlify/functions/schedule-collections -H "X-Cron-Key: $CRON_SECRET" -H "Content-Type: application/json" -d '{}'
```

This is a net improvement: scriptable, works from anywhere, needs no Netlify
login, and leaves a `job_runs` row like any other invocation. It is called out
because it is a habit change, not because it is a loss.

---

## 10. Found while designing this, not fixed by it

Each is real, each has evidence, none belongs in packet 010.

1. **`collection-worker-background.js:35` to `:43` fails open.** If
   `INTERNAL_AUDIT_KEY` is unset it accepts any caller and logs a warning. That
   function drains the collection queue and calls engines, so an unauthenticated
   trigger spends real LLM budget. Whether it is currently exposed depends
   entirely on whether that variable is set in Netlify, which no agent can check.
   **Owner: `bg-backend`, after 010, and it needs Constantin to confirm the
   variable is set.**
2. **The Google indexing credential has been broken since 2026-07-19**, section
   9 item 6. Owner `bg-backend`, needs a Netlify environment variable from
   Constantin.
3. **`purge-old-results.js` and pg_cron job 1 have been duplicating the same
   retention delete**, undetected, on the same schedule. 010 removes the
   duplication. The process question, how a second scheduler was added without
   anyone noticing the first, is worth a line in `CLAUDE.md` rather than a fix.
4. **`_cron_auth.js` will be publicly routable as a `502`**, like the other 23
   underscore-prefixed helpers. That is `deploy-pipeline-netlify.md` **F2**, an
   existing separate finding with its own owner. 010 adds one more file to that
   count and does not make the finding worse: the module exports no handler, so
   the failure is at handler lookup and no logic runs.
5. **`CLAUDE.md` §4.6 is still wrong** in stating that the underscore prefix stops
   Netlify exposing a helper. F2 proved otherwise. Already on the backlog;
   repeating it here so 010's new helper does not read as an endorsement of the
   rule.

---

## 11. Acceptance criteria for the design

These are the conditions under which this architecture is correctly implemented.
Packet `010` restates them as build criteria and a follow-on `bg-verify` packet,
number allocated when it is written per the rule in `CLAUDE.md` that ids are
never reserved inside an artifact, checks them independently.

- [ ] An unauthenticated `POST` to `expire-plan-grants`, `schedule-collections`
      and `ping-sitemap` returns `401` with body `{"error":"unauthorized"}`.
- [ ] An unauthenticated `POST` to `purge-old-results` and `purge-old-audits`
      returns `404`, because the files are gone.
- [ ] A `POST` carrying the correct `X-Cron-Key` returns the function's normal
      response.
- [ ] `grep -c schedule brandgeo-dashboard/netlify.toml` returns 0.
- [ ] `expire-plan-grants` and `schedule-collections` each declare `timeout = 26`.
- [ ] `cron.job` holds six active jobs: the pre-existing jobid 1 unmodified, plus
      the five from section 7.1.
- [ ] `cron.job_run_details` shows `succeeded` for every new job across at least
      one full cycle.
- [ ] `job_runs` holds at least one row per surviving function, written by a
      pg_cron invocation and not by a hand-run probe.
- [ ] `cron.job.command` contains no secret literal for any job.
- [ ] `_cron_auth.js` returns `503` when `CRON_SECRET` is unset. Fail closed.
- [ ] Netlify's Functions UI shows no "Scheduled" badge on any function.

---

## 12. Could not verify

Stated plainly, with the reason.

1. **That Netlify's schedules are currently registered.** Section 3 raises the
   evidence from "no evidence" to "one write inside the scheduled hour on
   2026-07-19". That is not proof. Only the Netlify Functions UI settles it, and
   no agent can see it. This design removes the dependency rather than resolving
   the question.
2. **Whether the two `ping-sitemap` invocations 15 seconds apart on 2026-07-19
   were both from the scheduler**, or one scheduler run plus one manual click.
   The database records the effect, not the caller. This is the single weakest
   link in section 3's argument and I am not going to overstate it.
3. **Whether `CRON_SECRET`, `INTERNAL_AUDIT_KEY` or the Google service account
   credentials are set in Netlify.** Environment variables are not readable by an
   agent and must not be requested. Every claim about item 1 in section 10 is
   conditional on this.
4. ~~The exact `net.http_post` argument names in `pg_net` 0.20.3.~~ **Resolved
   2026-07-27** by querying `pg_proc` after the extension was enabled. Signature
   and schema are recorded in section 7.2.
5. **Whether `pg_net`'s `timeout_milliseconds` can terminate an in-flight Netlify
   invocation.** Section 7.3. Must be measured, not assumed.
6. **That deleting `purge-old-results.js` loses nothing.** Row 6 shows pg_cron job
   1 issues the identical delete on the identical schedule, and both have been
   returning zero rows. If the two definitions ever diverged in a way not visible
   in the command text, that divergence is invisible to me. `bg-verify` should
   diff the two cutoff computations directly.
7. **Anything about the cPanel pipeline.** Different pipeline, different owner.
