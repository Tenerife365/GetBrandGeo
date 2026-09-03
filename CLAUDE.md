# CLAUDE.md — BrandGEO Platform Memory

> ⚠️ **§0 through §7 below were last updated 2026-07-08 and are PARTLY STALE.**
> The "CURRENT STATE" section immediately below this header was verified against
> the live sites and the working tree on 2026-07-26 and wins wherever the two
> disagree. Known-stale items are marked inline where they occur.
>
> **Last updated (§0 to §7):** 2026-07-08 (task #103 shipped, not yet built/committed; task #83 shipped + pushed; git index corruption resolved; #100/#102 closed)
> **New this pass:** #103 (fixed onboarding — seeds initial prompts, fires
> all 3 collection functions with plan gating; build/commit still pending
> on Constantin's machine, see §5). Previous pass: #73 (onboarding flow doc,
> found the bug #103 now fixes) and #84 (website CTA finalized, not yet
> uploaded to cPanel).  
> **App:** [app.getbrandgeo.com](https://app.getbrandgeo.com)  
> **Website:** [getbrandgeo.com](https://getbrandgeo.com) (static HTML, cPanel hosted)  
> **Project root:** `C:\Users\const\Constantin Daniel Goane\BrandGEO` (canonical — the old `C:\Users\const\Desktop\BpR` no longer exists, archived, see §6.4 step 8)  
> **Dashboard repo:** `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard` (Netlify)  
> **Website files:** `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\` + `brandgeo-signup\`  
> **Admin email:** `constantin@talentwelove.com` (Supabase admin, NOT workfully.com)

---

## CURRENT STATE (newest entry 2026-09-03)

### 2026-09-03: sprint 17 closed at 1 free subscriber, the next five trust items are built, reviewed, PUSHED and LIVE

**Sprint 17 result, stated by Constantin 2026-09-03: one new free subscriber.**
Against G1 (EUR 2,900 MRR-equivalent), G2 (100 activated free accounts) and
G3 (three channels firing daily), none was met. The 2026-08-13 diagnosis holds:
no always-on channel ever fired, so one signup reads as no traffic, not as a
product rejection. A polish audit cannot fix an empty funnel top; the next
question is acquisition, and it has not been launched.

**Correction to the 2026-08-21 entry: the push built, but ten days late.**
`b60a108` and `551a6d1` were pushed 2026-08-21 and Netlify created NO deploy
until 2026-08-31 17:42Z, when both queued builds ran (551a6d1 published,
a9c612b correctly cancelled as docs-only). So batch 1 was live for the
sprint's final day only. Verified via `netlify api getSite` and by grepping the
live bundle for identifiers unique to the batch, NOT by comparing a local
`dist/` hash, which produced a false "never deployed" claim twice (2026-08-21
and again 2026-09-03 00:19). Netlify's `npm install` resolves a different
dependency set, so identical source hashes differently. Judge a deploy by
`published_deploy.commit_ref` or a unique identifier in the live bundle.

**Two of the three 2026-08-21 chip sessions landed the same night:**
`f11e8d9` (host matcher false negatives, pushed 00:23 local, built within two
minutes) and `3bb3a7a` (escaped Play Store URL form, pushed 00:44, published
00:45), so push-to-build is working normally again. **Still not landed:** the
`collect-prompt.js` silent insert failure and the `Prospects.tsx` truncation
banner.

**A session-only cron never fired.** The re-audit was scheduled with
`CronCreate` for 02:24 local so it would run after the 5-hour usage window
refreshed. The desktop session went idle overnight and the job vanished
(`CronList` empty by morning, no transcript entry 00:30 to 07:23). Never
promise a timed follow-up on a session cron alone: keep the session alive and
check `CronList` near the fire time, or hand over the exact `scriptPath` to
fire by hand. Memory `session-cron-does-not-survive-idle` records it.

**The re-audit ran by hand at 07:28 and found the next five.** Workflow
`wf_d5906b18-d25`: 4 read-only lenses at concurrency 2 (the 32 GB RAM cap, no
builds or browsers inside agents), a ranker and a skeptic, 6 agents, 24 raw
findings, 5 of 5 stand. Report `docs/audit/product-reaudit-2026-09-03.md`
(`3d98bdc`). Batch 1 was excluded as already fixed; the lenses read HEAD
`3bb3a7a`; `netlify/functions` and `Revenue.tsx` were off limits. The five, in
rank order: (1) Overview's first-run hero read `ai_results` rows instead of the
prompts query, looping a client with prompts back to /prompts, and hid a free
client's score for three weeks of every month; (2) the cold audit report died
on a dead or purged token as raw "Audit not found" with no way forward, and
reports purge at 90 days so every batch-01 link was scheduled to fail that
way; (3) AI Visibility blanked to a text line on every 4-second poll during
the first collection and listed retired engines as purchasable; (4) the auth
screens sent a new user to the login form, led with a dead LinkedIn button,
and printed raw transport strings; (5) the insight pages showed coloured zeros
above "Not measured yet", only AI Visibility reloaded when a run landed, and
the time filter rendered on 13 routes while changing data on 3.

**Built by 5 `bg-app` builders at concurrency 2 (`wf_9f1943f3-5ed`, 20 min),
all five self-reporting every criterion met. The three-lens review
(`wf_269a6214-ba0`, correctness, acceptance, design and copy truth) returned
FAIL, FAIL, FAIL: 20 findings, 5 blocker, 6 major, 9 minor.** The two worth
remembering: `serverError()` did not exist yet, so the new error humanizer
swallowed the API's own validation copy (rejected disposable address, daily
limit, which field is wrong) into "Signup failed. Please try again.", a closed
loop for that visitor; and the shell's end-of-run notice inferred completion
from `collecting` flipping false, so it announced "Collection complete" for a
run the server refused (the previous run's total leaked through) and for a
stopped one. All 20 fixed in one pass, then an independent verifier re-checked
every finding: **PASS_WITH_FINDINGS**, all 20 closed or accepted, four residual
minors (retired engine still "Coming Soon" in the admin modal, the notice
surviving a client switch, an orphan poll tick after Stop, the pass-through
unbounded by status), all four fixed before commit. Record:
`docs/qa/next5-review-2026-09-03.md`. `npm run build` exit 0, zero em or en
dashes in added lines (scan proven with a positive control), dirty set exactly
the batch. Free RAM stayed between 7.5 and 10 GB throughout; no freeze.

**One accepted deviation, so it is not re-argued:** the cooldown upgrade link
renders only for plans slower than weekly (today, free at 720h). Every paid
plan is already weekly, so the link would promise nothing there. Latent gap
for a hypothetical 169 to 719h tier, documented in the review record.

**PUSHED 2026-09-03 10:49Z, LIVE 10:50:29Z.** One commit per item, rank order, pathspec-limited so
the other sessions' dirty files (`Revenue.tsx`, `netlify/functions`, `db/`,
`brandgeo/web/site.js`) stayed out: `69460b0` Overview, `8f4799e` AuditReport,
`c047191` AI Visibility plus `collectionContext.tsx` and `planConfig.ts`
(`RETIRED_ENGINES`, `lastRunOutcome`, the Stop hang and its orphan tick),
`ac1ec1c` auth screens plus new `src/lib/errors.ts`, `4c6db93` insight pages
and `Layout.tsx`, then `713479f` docs. Pushed with `BATCH_PUSH=1` (AUTONOMY
section 7), one Netlify build. Scale note: Supabase reads neutral to reduced (item 3 bumps
`lastCompletedAt` only when the done count changes, so the per-tick page reload
is gone, and item 2 stops polling dead tokens); no new writes; no new function
invocations. Deploy `713479f` was created 10:49:51Z and published 10:50:29Z,
38 seconds after the push, confirmed by the deploy record and by five strings
unique to the batch in the live bundle `index-CMgok0LE.js`, never by hash.
`origin/main` is `713479f`.

**Follow-ups closed the same day, COMMITTED, NOT PUSHED (second build of the
day, inside the two-a-day cap):** `655a7af` removes the em dash from the
customer-facing 429 sentence in `signup-client.js`; `14e4105` closes the
August chip where `collect-prompt.js` logged `[Insert] FAILED` and still
answered `{ done: true }`, so the single-cell refresh reported success for a
row that was never saved (now `{ done: false, reason: 'insert_error' }`, the
sibling collectors' shape minus `detail`, and the client's prompt branch reads
the reason); `7d07f5f` closes the other August chip: `Prospects.tsx` now reads
`results[0].errors`, so a crawl cut short by its time budget says so instead
of "found nothing published", counts unreadable pages, and routes a crash to
the error banner. `npm run build` exit 0, added lines dash-free, 16 of 17
node tests pass. Scale note for the push: neutral, no new reads, writes or
invocations; one branch on an existing insert result plus client copy.

**Found while running the suite, pre-existing and NOT touched:**
`tests/package_provisioning.test.js` fails at HEAD. It asserts that
`stripe-webhook.js` contains `.select('plan_grant_until, plan_source')` and
the webhook has no such select; both files are clean and last changed
2026-07-31 (test) and 2026-08-02 (`13bb92d`, webhook), so the suite has been
red since the billing migration and nobody ran it. Billing file: owed to
`bg-backend` on Opus with `bg-verify`, not a drive-by.

**Recorded, not fixed:** the poll counts `done` or `failed` jobs alike, so a
failed job reads as "checked" in the end-of-run line (needs a ruling); the
four item-5 pages fire a duplicate load on mount when `lastCompletedAt` is
already set; 226 pre-existing em or en dash lines sit in the base files'
comments and older copy, none added by this batch, customer visibility
unscanned.

### 2026-08-21: top 5 trust/UX improvements SHIPPED, F6/F6b closed, packet 020/021 review returned FAIL

Two sessions were running in parallel on 2026-08-20 and both were interrupted.
The PC froze, but that was the SECOND problem: a **weekly usage limit** at
roughly 23:59 killed one builder and all three reviewers first. Recovered from
the workflow run journals, not from memory. **2 commits, `b60a108` and
`551a6d1`, both made 2026-08-21.**

**What the audit was.** Constantin asked for the top 5 immediate improvements
to build trust and an ultra-premium feel. A five-lens audit workflow ranked
them, then a build workflow ran five `bg-app` builders in parallel over disjoint
file scopes. 4 of 5 returned. Builder t1 (collection feedback) was killed
mid-run **after writing 283 lines**, and 0 of 3 adversarial reviewers ever ran.
So roughly 511 lines sat uncommitted and completely unreviewed. `tsc` and
`npm run build` both passed, which is exactly why this was dangerous: nothing
looked wrong.

**t1's orphaned work was audited rather than rewritten.** 6 of its 7 criteria
were already correct, including server field names checked against the real
`_enqueue.js` and `enqueue-collection.js` response bodies. Two real gaps
remained: `lastBlockReason` **leaked across a client switch** (the context is
app-level and nothing cleared it), and the budget-block copy was rendering the
server's raw message, which **prints our own EUR cost of goods** ("EUR 0.16 of
EUR 0.30", "API budget") to a paying customer, contradicting the same file's
documented rule that the euro meter is admin-only.

**The 3-lens review then returned PASS_WITH_FINDINGS, FAIL, FAIL: 21 findings
(2 blocker, 8 major, 11 minor), all fixed.** The one worth remembering:
**all three collect endpoints answer HTTP 200 even when the engine call
failed**, so the single-cell refresh judged success from `res.ok` and reported
success for a quota error, an auth error, and a row that was never saved. It
now parses the body.

**F6 and F6b are closed, and the first attempt at them did not work.** Both
were live in production. Two adversarial verifiers returned **FAIL with 3
blockers** against the builder's own 8/8 self-report: the new `BARE_HOST_RE`
still treated underscore and punctuation as valid host boundaries, a foreign
domain still leaked in via a URL path/query/fragment, and a truncated crawl was
still indistinguishable from an empty one. **Shipping on the builder's
self-report would have left the headline defect live under a commit message
claiming it was fixed.** After remediation: host matching is one shared
`hostMatchesDomain` rule, a second layer filters search-discovered listing
emails to the prospect's own domain, the per-prospect budget is a real deadline
(worst case measured 18,005ms against the 26s ceiling, was 24,001ms), and
`MAX_PROSPECTS_PER_CALL` is **1**. New test `tests/contact_routes_host_match.test.js`,
30 assertions.

**`MAX_PROSPECTS_PER_CALL = 1` costs nothing today.** `src/pages/Prospects.tsx`
already posts a single `prospect_id` per click. Only a hypothetical multi-id
script caller is affected, and it now gets an explicit 400 instead of a silently
truncated crawl.

**F13 is measured now, and it is smaller than the review implied.** Queried
directly: **the 09:51 batch is CLEAN.** All 9 of its rows cite the prospect's
own host. Only **candidate id 10** is contaminated (prospect 24 RunSensible,
`source_url` on `rocketreach.co`, a named individual's personal LinkedIn
profile, written 10:33, 42 minutes after the legitimate batch). **Nothing has
ever been promoted**, so prospect 24's `linkedin_url` is still null and the
broker value never reached the prospect record. But **touch id 18 went out 12
minutes later**, a real connection request to that named person. That cannot be
undone.

**The never-query list is now a database constraint, not prose.**
`db/supabase-prospect-contact-candidates-never-query-2026-08-21.sql`, **APPLIED
TO PRODUCTION 2026-08-21** (`convalidated = false`, 10 rows preserved, 0
promoted). It is deliberately `NOT VALID`: candidate 10 survives as the audit
record, while `INSERT` and `UPDATE` are still enforced, and since `promote`
updates the candidate row, **the database refuses to promote candidate 10**.
Permanently unpromotable beats deleted, because deleting it destroys the only
evidence. Predicate verified read-only first (9 of 10 rows pass, only id 10
fails), then **proved behaviourally after applying**, with every write undone:
promoting candidate 10 REFUSED, promoting candidate 3 (own host) ALLOWED so
there is no false positive, inserting a new `hunter.io` row REFUSED, inserting
a new own-domain row ALLOWED. **Do not widen this list into a global host
block**: `logo.clearbit.com` is used legitimately by
`src/components/BrandLogo.tsx` and `netlify/functions/social-image.js`.

**Known open, all demonstrated rather than speculated:** the tightened host
matcher has two false negatives, both fail-safe but both able to make a real
address read as "publishes nothing", and one of them is **the exact
backslash-escaped URL form Google Play embeds in its `AF_initDataCallback` JSON**,
which is precisely the page the matcher targets. `Prospects.tsx` never reads
`results[0].errors`, so the truncation message the backend now emits reaches the
JSON and the logs but **not the banner a human reads**. `collect-prompt.js:150`
logs `[Insert] FAILED` then returns `{done:true}`, so a saved-row failure is
still invisible to the client. All three were dispatched as separate sessions
2026-08-21.

**Two measurement traps worth not relearning.** `grep -P "\x{2014}"` **fails on
Git Bash** with "character value too large", exit 2, printing nothing, which is
indistinguishable from a clean pass. Use `rg` for any em/en dash scan, and prove
the pattern fires with a positive control. And a `git diff` scoped to
`brandgeo-dashboard/src` sweeps in `Revenue.tsx`, which belongs to a different
uncommitted session and **carries 6 em dashes**; scope dash scans to the files
actually under review.

**Deploy state: `b60a108` and `551a6d1` are PUSHED, 2026-08-21**, `origin/main`
at `551a6d1`, one Netlify build for both. The pre-push hook blocked the first
attempt, correctly: AUTONOMY section 7 groups dashboard pushes and the override
is `BATCH_PUSH=1`, which exists so a human spends a build deliberately. Nothing
under `brandgeo/web/` changed, so getbrandgeo.com is unaffected. Scale note
required by section 7: `b60a108` has no scale impact (client-side render and
state only, no new reads, writes or invocations); `551a6d1` is neutral to
slightly reduced (reads and writes unchanged, real invocation count unchanged
because the only caller already sends one id per click, and clamping every
fetch to the remaining budget cuts worst-case function time from about 24s to
about 18s).

### 2026-08-20: contact route resolver + promotion UI DEPLOYED, follow-up schedule built

Closes the 2026-08-16 blocker below ("all 43 `stage='new'` prospects have ZERO
contact routes"). Packet `019` ran, plus its `bg-app` half in the same commit.

**Dates, because three different ones are in play here and conflating them has
already produced one wrong record.** `5452e59` was AUTHORED 2026-08-16. Outbound
touches and the contact candidates were written 2026-08-17 by a parallel growth
session. The commit was PUSHED and deployed 2026-08-20, which is also when
everything in the rest of this entry was done. An earlier version of this entry
was headed 2026-08-17 and was wrong.

**Deploy is confirmed live**, not assumed from a green build: an unauthenticated
`POST` to `/.netlify/functions/resolve-contact-routes` returns
`401 {"error":"Unauthorized: missing token"}` rather than 404, so the function
exists and its gate is wired.

What shipped, all in one commit so both halves land in one build:
`netlify/functions/resolve-contact-routes.js` (new) crawls up to 12 of the
prospect's own pages, plus a Play Store name search and up to 6 listing
fetches where the site links no address. It **never writes `public.prospects`**.
It stages findings in the new `public.prospect_contact_candidates` table
(migration `db/supabase-prospect-contact-candidates-2026-08-16.sql`) with
`source_url` NOT NULL, and a human promotes one via a new `promote` action on
`prospects-admin.js`. `src/pages/Prospects.tsx` gained the **Find contact
routes** button and the candidate list with confidence, individual/role, and a
link to the exact source URL.

**The design ruling, so it is not re-argued:** a resolver can prove a string
appeared at a URL, it cannot prove the string belongs to the person you mean.
2026-08-15 produced three impostor X accounts that all looked correct. So
`promote` accepts **only a candidate id**, no value, no kind, no source URL.
The written string is by construction one the resolver saw at a recorded URL,
which is why `update`'s 7-field `WRITABLE_FIELDS` whitelist did NOT have to be
widened. `contact_email`, `linkedin_url` and `x_url` remain unpatchable from
the UI, and the two write surfaces are disjoint by test. Promotion also
**never sets `x_verified`/`linkedin_verified`** -- choosing to use a URL is not
confirmation, and LinkedIn returns HTTP 999 to every automated client so it
cannot be machine-confirmed at all. `promoted` means "was promoted at some
point", not "is currently live"; live-ness is derived by comparing
`candidate.value` against the prospect field, which cannot drift.

**Deploy blocker found and fixed before it shipped, worth knowing.**
`resolve-contact-routes` had no `netlify.toml` timeout entry, so it would have
inherited the 10s default while budgeting 20s per prospect in batches of 10.
Every real call would have been killed mid-crawl and returned nothing, which
reads **identically to "this company publishes no address"** and would have
been believed. Fixed: `timeout = 26`, batch cap 10 to 3, per-prospect 18s, a
new 22s invocation budget, and an explicit `skipped: invocation time budget
reached` report rather than a silent cap. `tests/prospects_admin_whitelist.test.js`
is at 63 assertions, up from 49.

**Still owed on this:**
1. First click on **Find contact routes** against the real runtime is the
   actual test of that timeout entry. If it returns nothing for a company that
   obviously publishes an address, that is the timeout, not the company.
2. The adminOnly gate on both new endpoints is unproven against the deployed
   URL with a real viewer token (the live 401 only proves it rejects a
   MISSING token).
3. ~~DB-level rollback probe of the promote path.~~ **DONE 2026-08-20.**
   Simulated promoting candidate 3 onto prospect 33 inside `begin; ...
   rollback;`. In-transaction, exactly `contact_email`,
   `contact_email_source`, `contact_email_kind` and the candidate's `promoted`
   flag changed; `x_url`, `linkedin_url`, `x_verified`, `linkedin_verified`
   and `stage` were untouched. After rollback nothing persisted
   (`promoted_rows` 0, `verified_rows` still 8). RLS on
   `prospect_contact_candidates` is 4 policies, one per verb, all
   `is_admin()`.
4. Packet `020` (`bg-backend` to `bg-verify`, Opus) is **STILL NOT RUN.** It
   was dispatched 2026-08-20 and the agent stopped mid-run without writing
   `docs/qa/contact-route-promotion-020-review.md`. It edited nothing, so the
   code is unchanged, but the review produced nothing and must start over. It
   is mandatory: this touches RLS and a new write path, and it lists SSRF
   given `redirect: 'follow'` as a claim to attack.

**A candidate row cites a lead database, and that needs a ruling.** Candidate
id 10 (`runsensible.com`, kind `linkedin`) carries
`source_url = https://rocketreach.co/sahar-asadi-email_106199103`. RocketReach
is on the never-query list with Hunter, Apollo, Clearbit and Snov. It was
written 2026-08-17 at 10:33 UTC, apart from the 09:51 batch, and touch id 18
went out on the back of it. `_contact_routes.js` cannot emit that URL (it
crawls only the prospect's own pages plus a Play Store fallback), so the row
came from outside the resolver. Whether that is a process problem or a code
problem is exactly what packet `020`'s claim 5 exists to settle.

**Nothing has ever been promoted.** 0 rows have `promoted = true`, and all four
prospects contacted 2026-08-17 (ids 24, 26, 30, 33) still have
`contact_email` null while real email went to `adam@hoowla.com`,
`sales@casepacer.com` and `sales@amberlo.io`. The routes exist only in
`prospect_contact_candidates` and in touch notes. Unavoidable before the UI
deployed; now it is just owed.

### 2026-08-20: reply handling part A built, the due queue was starved not missing

Design: `docs/arch/reply-handling.md`. Constantin's decisions, taken this day:
**automatic Gmail polling** (not manual only) and a cadence of **+4 days, then
+7 days, then stop at 3 outbound touches**.

**The premise in the 2026-08-16 entry below ("no follow-up sequence, no due
queue") is imprecise in a way that changes the size of the job.** The due queue
EXISTS and always has: `src/pages/Prospects.tsx` carries `isActionableNow()`,
`isOverdue()`, `queueSort()`, `evidenceStrength()`, a `next_action_at` date
picker wired to `update`, and an out/in toggle that can already log an inbound
touch. It was starved, not missing. Measured 2026-08-20: **13 prospects at
`stage='contacted'`, 0 of them carrying a `next_action_at`, 0 of 71 prospects
carrying one at all, 0 inbound touches ever logged.** Nothing had ever written
that column, because `touch` stamps exactly one field
(`last_contacted_at` or `replied_at`) and never read it.

**Built, all uncommitted, nothing deployed:**

| File | What |
|---|---|
| `netlify/functions/_touches.js` | NEW. `recordTouch()` is now the ONE write path for `prospect_touches` and the prospect fields derived from it. |
| `netlify/functions/prospects-admin.js` | The `touch` handler is now only a mapping from `recordTouch`'s structured outcome onto HTTP. |
| `netlify/functions/poll-inbound-replies.js` | NEW. Cron-gated Gmail poller. Written, NOT deployed, deliberately NOT scheduled. |
| `netlify.toml` | `poll-inbound-replies` timeout = 26. |
| `tests/touches_record.test.js` | NEW, 20 assertions, exercises the actual call sequence. |
| `tests/prospects_admin_whitelist.test.js` | 63 to **76** assertions. |

**Applied to production (2 migrations, both verified after the fact):**
`external_id text` on `prospect_touches` plus a PARTIAL unique index
(`where external_id is not null`, so the 14 existing rows and every future
manual touch are unaffected), file
`db/supabase-prospect-touches-external-id-2026-08-20.sql`; and the
`next_action_at` backfill, 13 rows.

**The `_touches.js` extraction is the riskiest edit here** and is worth knowing
about: an inline write path inside a LIVE, UNREVIEWED endpoint was moved into a
shared function so the poller could not become a second copy of it, which is
the `_plans.js` drift defect this project already paid for once. Nothing tested
that call sequence before, which is why `tests/touches_record.test.js` exists.
It uses a scripted fake, so it proves control flow and nothing about Postgres.

**Deploy order for the poller is not negotiable** (design 7.1): set the four
`GMAIL_*` env vars, THEN deploy, THEN schedule in `pg_cron` at minute 20 (not
10, which is `schedule-collections`). Scheduling first writes an hourly
`ok = false` row into `job_runs` forever, because the function fails closed
without its credentials and 404s before it is deployed.

**The backfill guard is the part worth remembering.** Logging an older touch
after a newer one must not reschedule the future, which is the S8 defect one
field over. The stamp UPDATE already answers this: it carries
`buildAdvanceOnlyFilter()`, so it matches ZERO rows exactly when the touch is a
backfill. So the rule is "write `next_action_at` only when the stamp actually
applied". No new comparison, no second read, no new race.

**Two distinctions that are load bearing and were tested explicitly:**
`{ skip: true }` (write nothing) and `{ value: null }` (deliberately clear) are
NOT the same, and collapsing them would wipe a date a human set on a closed
prospect. And the rule never writes a stage: an exhausted prospect sits at
`contacted` with a null `next_action_at` and leaves the queue, because calling
it lost is a human judgement.

**Backfilling the 13 produces a real queue immediately:** 8 due 2026-08-20,
4 due 2026-08-21, 1 (glood.ai, already on its 2nd touch) due 2026-08-24.

**Still owed on reply handling, and none of it is code:** the four `GMAIL_*`
env vars (consent must be granted on the TalentWeLove account), the deploy, and
then the `pg_cron` entry. Packet `021` covers this work and was dispatched to
`bg-verify` together with `020`, on the reasoning that both halves ride the same
build so one review of the final state beats two of a moving one.

**Four limits are stated in the design and should not be rediscovered:**
**automatic polling covers email only** (6 of 14 outbound touches; LinkedIn
returns HTTP 999 to automated clients and X has no usable route); the mailbox
is on the **TalentWeLove** Workspace, so a read-only Gmail scope there reaches
unrelated company mail and **Constantin has not ruled on that**; a reply to a
role inbox usually arrives FROM a different address than the one we mailed, so
sender matching misses it and a thread-id match is the natural follow-up; and
**bounces are invisible** (a mailer-daemon address never matches a
`contact_email`, so a dead route keeps receiving follow-ups). The last two
deserve their own packets.

**Growth-side facts that outlived this session:** 22 of the 43 `stage='new'`
rows have `company` null and several are large ESPs (ActiveCampaign, Klaviyo,
Brevo, MailerLite, Omnisend, Voyado), so they are probably competitor research
parked in the pipeline; 43 is not the real pipeline size until they are split
out. Three report links are still owed on LinkedIn acceptance and are stored on
their `prospect_touches.note` rows: Harry Singh `9E8gooatqve-HmJUByTdEuXq`,
Harshul Jain `fSYVjKhY-aiQDmqC7g5iW3FL`, Serene Lim `12QW0p-YdnjkzmKNDe-3n38a`.
Reply handling still does not exist: no follow-up sequence, no due queue, no
inbound touch ever logged, and advancing a prospect to `replied` is still a
manual SQL statement.

### 2026-08-16: FIRST OUTBOUND EVER SENT. 9 prospects contacted across 3 channels

**Every "nothing has been contacted" and "0 `prospect_touches`" claim below this
entry is now STALE.** Founder batch 01 went out by hand today. Verified by query
after the fact, not assumed: 71 prospects, **9 at `stage='contacted'`**, 9 with
`last_contacted_at`, **9 rows in `prospect_touches`** (6 email, 3 linkedin, 0 x),
0 inbound, 0 `replied_at`. Stage split is now `new=43, disqualified=19,
contacted=9`.

Who and how: PageLightPrime, PureClarity, EasyDVM, IntelliBill, DriveSchoolPro by
email; Harry Singh (Lawcus), Harshul Jain (Glood.AI), Serene Lim (Vibefam) by
LinkedIn connection request with a note; Smilenotes via their own web contact
form. Full paste-ready record of every message:
`docs/growth/outbound/fire-pack-2026-08-16.md`. Send log:
`docs/growth/outbound/email/send-tracker-2026-08-16.md`.

**The DKIM finding from 2026-08-15 was WRONG and is withdrawn. Do not add any TXT
record at CyberFolks.** `constantin@getbrandgeo.com` is a send-as alias on the
**TalentWeLove** Google Workspace, and Gmail's own settings page states it relays
through `mail.getbrandgeo.com` on port 465 SSL. So the mail never leaves via
Google's servers: cPanel Exim signs it on the `default` selector, which is
published with a valid 2048 bit RSA key, and `mail.getbrandgeo.com` resolves to
`91.200.121.45`, the A record of `getbrandgeo.com`, already authorised by the
`+a` mechanism in SPF. DKIM and SPF both align. The absence of
`google._domainkey` is irrelevant on this path. Constantin had settled this in
earlier sessions and asked for it to be recorded here so it stops being
re-derived.

**Gmail does not reliably default to the getbrandgeo alias.** Two composes in a
row opened as `constantin@talentwelove.com` with the TalentWeLove signature.
Always open the From dropdown and pick it explicitly, then confirm the row before
sending.

**Three rulings made while sending, recorded so they are not re-argued:**

1. **The report is a LINK, never an attachment.** Attachments cost
   deliverability on cold mail for no gain and a PDF goes stale the moment the
   data changes. All 9 tokens were re-verified against `get-audit-report` before
   sending: every one returned `status: ready`, `unlocked: true`,
   `low_confidence: false`, correct domain.
2. **Smilenotes was routed away from `privacy@smilenotes.co.uk` deliberately**,
   and this closes S4-era question about that prospect. It is the data protection
   mailbox of a UK registered data controller where Lee McMeeking is both named
   DPO and sole director; a commercial message there invites a UK GDPR reply
   rather than a conversation. The X DM route is **CLOSED**, their inbox refuses
   messages from non-followed accounts (attempted and refused today, recorded in
   `prospects.notes` id 12 so nobody retries). Their own contact form at
   `smilenotes.co.uk/help/contact` was used instead. That form carries bot
   detection (`interaction_score`, `form_loaded_at`), so it must always be filled
   by a human at human speed.
3. **A LinkedIn Company Page cannot send connection requests or messages to
   individuals.** Only a personal profile can. Those three went from Constantin's
   personal profile `in/daniel-geo` as founder. Notes are capped at 200
   characters and invitations carrying URLs get filtered, so **the report link is
   still owed to all three on acceptance**. The three links are stored on their
   `prospect_touches.note` rows so they cannot be lost.

**Known environment problem, cost most of a session.** Driving Gmail through the
Chrome extension failed repeatedly with `Cannot access a chrome-extension:// URL
of different extension`, blocking synthetic clicks, keystrokes and JS injection
while screenshots and DOM reads kept working. Two browser instances were
connected at once, which is the likely cause. Partial workarounds: put every
action in one `browser_batch` beginning with a `navigate`, and never call `find`
or `read_page` mid-sequence, because any call between batches loses the
attachment. **Do not drive Gmail this way again.** Constantin's ruling: outbound
sending moves to scheduling from the dashboard.

**`trybrandgeo.com` IS registered and fully stood up. The 2026-08-13 audit's
"NXDOMAIN, never registered" is badly stale.** Measured 2026-08-16: A record
`91.200.121.45`, MX `1 smtp.google.com` (Google Workspace),
SPF `v=spf1 include:_spf.google.com ~all`, **`google._domainkey` published with a
valid RSA key**, a `default` cPanel selector as well, and DMARC
`p=none; rua=mailto:dmarc@trybrandgeo.com; fo=1; adkim=r; aspf=r; pct=100`.
Note its `rua` is on its own domain, so its aggregate reports actually get
delivered, unlike `getbrandgeo.com` whose `rua` points cross domain at
`talentwelove.com` with no authorisation record. Someone executed
`docs/growth/outbound-infra.md`. **Consequence: no third party sending platform
is needed.** Google Workspace allows 2,000 recipients per user per day and the
near term target is roughly 500 a month, so volume is not the constraint. Free
ESP tiers are a trap here regardless: Resend, Brevo and comparable transactional
providers prohibit cold outreach in their acceptable use policies, so using one
risks the account and the domain reputation together.

**Decision still owed on which domain sends at volume.** The five emails today
went from `constantin@getbrandgeo.com` per Constantin's 2026-08-14 ruling, and
that identity is part of why the message works, because the sender built the tool
being described. `trybrandgeo.com` protects the primary domain but weakens that
signal. Not urgent; it belongs with the sender build, not the resolver.

**BLOCKER for tomorrow, found 2026-08-16 and larger than the tooling gap: all 43
`stage='new'` prospects have ZERO contact routes.** 0 email, 0 `linkedin_url`,
0 `x_url`, while 43 of 43 carry an `audit_token`, 43 of 43 an `ai_score`, and 40
of 43 named competitors. The expensive half is paid for and the cheap half is
missing. The nine contacted today were the only rows in the table with a route,
because that research was done by hand and consumed most of a session. **There is
no five day runway; there is no next batch at all until routes exist.** Packet
`019` (`bg-orchestrator` to `bg-backend`, Opus) specifies the contact route
resolver that closes this and is READY, not yet run.

**What has NOT been tested and is the next real question after that:** what
happens on a reply. There is no reply handling, no follow-up sequence, no due
queue, and no inbound touch has ever been logged. Advancing a prospect to
`replied` is currently a manual SQL statement.

### 2026-08-15: prospect-channels re-review PASS, S8/S9 closed same day, 0 rows touched

`bg-verify` returned **PASS, safe to push** on the S1/S2/S3/S5/S6 fix round
below (`docs/qa/prospect-channels-review-2026-08-15.md`, section R1
onward), independently reproducing all seven acceptance criteria, the S1
boundary probe (floor and ceiling both exact, no off-by-one), and the
`retry_of` attack surface (cannot cross prospects, cannot rewrite an
existing touch's body). Two new findings, neither blocking the push:

**S8, MEDIUM, closed same day, before push.** The prospect stamp UPDATE
(`last_contacted_at`/`replied_at`) was unconditional, so an ordinary,
explicitly-supported backfill (log today's email, then remember last week's
LinkedIn message) rewound the queue field to the older date -- the same
double-touch failure S1 was blocked on, just narrower (S1 bounded the blast
radius to roughly seven months, it did not close the mechanism). Fixed with
`buildAdvanceOnlyFilter()`: a single conditional `UPDATE ... WHERE (field IS
NULL OR field < newIso)`, so the compare-and-swap is one atomic Postgres
statement, safe under concurrent touches, no separate read-then-write.
**Verified at the database level, not just as a filter string**: ran two
`begin; ... rollback;` transactions against production, each inserting a
same-day touch then an older backfill touch for a real prospect id. The
OLD (unconditional) technique rewound `last_contacted_at` from
`2026-08-15 17:38:53` to `2026-08-08 17:38:53` after the backfill. The NEW
(conditional) technique, run the same way, left `last_contacted_at` at
`2026-08-15 17:36:08` (unchanged) after the identical backfill, with BOTH
touch timestamps present in `prospect_touches` either way. Both rolled back;
confirmed `prospect_touches = 0` and both stamps null on every row
afterward.

**Chose the endpoint fix over the `rpc()` bg-verify flagged as the natural
home for S2 and S8 together, reasoning stated inline since the coordinator
asked for it explicitly.** A new `SECURITY DEFINER` function that writes
`prospects`/`prospect_touches`, if it inherited this project's existing
default EXECUTE grants the way `is_admin()`/`my_client_id()` already do,
would let ANY authenticated caller bypass the admin-only RLS entirely via
the function owner's privileges -- a genuine RLS-widening risk, not
hypothetical, and closing it properly needs the same role-scoped
rollback-probe verification `bg-verify` used to prove table containment.
That is Opus-tier review work, not something to fold into the same round as
a MEDIUM non-blocking fix. The conditional UPDATE gets the identical
forward-only, race-safe guarantee with zero schema change and zero new
attack surface. S2's `retry_of` idempotency workaround is therefore kept,
not deleted; `bg-verify` should keep judging round to round whether the
`rpc()` is still owed.

**S9, INFO, closed.** The comment claiming a `retry_of` call "may omit
channel/direction/occurred_at entirely" was wrong -- `validateTouch()`
requires both `channel` and `direction` before `retry_of` is even parsed.
Corrected to state what the code actually does (only `occurred_at` legitimately
defaults).

**Also closed, flagged in the prior round rather than fixed then, free this
round per the coordinator's explicit allowance:** `validateUpdate()`'s `id`
now routes through `parseId()`, closing the same coercion class S5 fixed on
`prospect_id` (`true`, `[1]`, `"1e0"`, `" 1 "` all previously became `1`).

**Confirmed after all fixes: 71 `prospects`, 0 `prospect_touches`, 0
non-null `last_contacted_at`, 0 non-null `replied_at`.** Nothing has been
contacted. 49/49 test assertions pass (up from 41). No em or en dash in any
changed file. Handoff `018` to `bg-verify` is READY, not yet run.

**Not this packet's to fix, recorded because the re-review surfaced it as
now-live rather than theoretical:** 9 `prospects` rows were written outside
this endpoint at 17:13-17:14 UTC today carrying real `contact_email`/
`x_url`/verification data, confirmed via direct query not to have gone
through `prospects-admin.js` (the write whitelist still rejects every one of
those columns). This crossed **S4's own stated deadline** ("before the first
`true` is written") -- 7 `x_verified=true` and 5 `linkedin_verified=true`
rows now exist, and 3 `linkedin_verified=false` rows carry a real
`linkedin_url`, which is exactly the ambiguity S4 named (unresearched vs.
checked-and-failed, indistinguishable). **Decision owed from Constantin,
now overdue rather than upcoming**: add `x_verified_at`/`linkedin_verified_at`
timestamps (additive, does not disturb the shipped contract) per S4's
original fix direction in `docs/qa/prospect-channels-review-2026-08-15.md`.

### 2026-08-15: prospect-channels review fixes, S1/S2/S3/S5/S6 closed, 0 rows touched

`bg-verify` returned PASS WITH FINDINGS on the channels work below
(`docs/qa/prospect-channels-review-2026-08-15.md`), with a hard condition:
**S1 (unbounded `occurred_at`) had to close before the first real touch is
ever logged.** This pass closes S1, S2, S3, S5, S6 (S4 and S7 are explicitly
deferred, S4 to a later deadline before the first `verified: true` write, S7
pre-existing and out of scope). Handoff `017` to `bg-verify` is READY.

**S1, BLOCKING, fixed.** `occurred_at` now rejects non-string input outright
(`0`, `1`, `true`, `false`, arrays, objects all become 1970 or worse under a
bare `new Date()` and were silently accepted before this fix) and clamps a
valid ISO string to `[2026-01-01, now + 24h]` (`TOUCH_MIN_OCCURRED_AT`,
`TOUCH_MAX_FUTURE_MS` in `prospects-admin.js`). A year-0001 date and
`"3026-01-01"` are both rejected. Reconstructed the pre-fix logic standalone
(not committed, run from `/tmp` and deleted) to confirm all six of the
reviewer's exact values were genuinely accepted before this change and are
genuinely rejected after; permanent regression tests for all six are in
`tests/prospects_admin_whitelist.test.js`.

**S5, LOW, fixed.** New `parseId()` replaces a bare `Number(v)` for
`prospect_id` (and the new `retry_of`): rejects `true`, `[1]`, `"1e0"` and
`" 1 "`, all of which previously coerced to `1` and would have misattributed
a message to the wrong company. **Deliberately not applied to
`validateUpdate()`'s `id` field**, which has the identical class of
looseness but was not named in the review's S5 finding -- flagged in the
handoff as a follow-up candidate rather than silently fixed beyond scope.

**S6, LOW, fixed.** `fail500()` is now a module-scope, exported, testable
function: every 5xx logs the real driver error server side and returns a
fixed message plus a `code` naming the operation, never `error.message`
verbatim. All 5 original leak sites now route through it.

**S3, MEDIUM, fixed, ruling acted on.** `prospect_touches.prospect_id`'s FK
was `ON DELETE CASCADE` (would silently destroy every message ever sent to a
named human if a prospect row were deleted); changed to `ON DELETE RESTRICT`
via new migration `db/supabase-prospect-touches-restrict-2026-08-15.sql`,
applied to production and verified (`pg_get_constraintdef` now reads
`... ON DELETE RESTRICT`). The base migration file's own `CREATE TABLE` DDL
was also updated so a fresh apply on a clean database gets it right the
first time; a header note explains why production needed the separate
amendment file (`CREATE TABLE IF NOT EXISTS` does not alter an existing
table). No delete affordance exists anywhere in the app per the reviewer's
grep, so this closes a latent risk, not a live one.

**S2, MEDIUM, fixed via the comment+idempotency path, not rpc().** Chose not
to move the insert-then-stamp into a Postgres `rpc()` transaction (would add
a new SECURITY DEFINER function to the same anon-executable-function
category the security advisors already flag as accepted platform posture,
for a two-write sequence with 0 real touches ever logged so far) -- the
packet's own "either is acceptable" framing was used. Instead: the header
comment no longer claims the writes "can never disagree" (that claim was
false, per the review); a partial failure now returns a **structured**
`touch_id` field on the 500 body, not just interpolated into a string; and a
new optional `retry_of: <touch_id>` field on the `touch` action skips the
insert and re-uses the existing touch row, so a retry after a partial
failure cannot create a duplicate. `bg-verify` should judge in the next
round whether this is sufficient or whether the `rpc()` path is still owed.

**Also fixed, found by `bg-app` while building against packet 016's
contract, not by `bg-verify`:** `update` and `touch` used to return a
prospect with no `touches` key while `list` nested it, and only a comment
said so. Chose to make the shape **uniform** rather than just fix the
comment: `attachTouches()` runs one extra indexed query
(`prospect_touches` filtered to one `prospect_id`) after `update` and
`touch` now, so all three actions return a prospect that is never partial.
`bg-app`'s existing client-side merge is unaffected either way (it only
gains a key that previously did not exist).

**Contract additions this round, stated loudly since packet 016 called the
contract fixed:** `touch` gained an optional `retry_of` request field and an
optional `touch_id` response field on its 500 body; `update` and `touch`
responses both gained `touches: Touch[]`. All three are additive, nothing
was renamed or removed.

**Confirmed after all fixes: 71 `prospects` rows, 0 `prospect_touches` rows,
0 non-null `last_contacted_at`, 0 non-null `replied_at`, 0 rows at
`stage='contacted'`.** Nothing has been contacted. 41/41 assertions pass in
`tests/prospects_admin_whitelist.test.js`. No em or en dash in any changed
file, grep-verified.

### 2026-08-15: prospect CRM extended to 3 channels (email/LinkedIn/X), migration applied, 0 rows touched

`bg-backend` extended the prospect CRM from packet `015` (one implicit
channel) to three, in parallel with `bg-app` building the UI against the
identical contract. Migration `db/supabase-prospect-channels-migration.sql`
is applied to production (`duiyifepitvugyulobqm`): `public.prospects` gains
`contact_email`, `contact_email_source`, `contact_email_kind` (CHECK
`individual`/`role`/null), `x_url`, `x_verified`, `linkedin_verified` (the
last two default `false`, not null, because LinkedIn returns HTTP 999 to
automated clients so an unverified URL must never render as fact); new table
`public.prospect_touches` (one prospect, many touches, `channel`
`email|linkedin|x`, `direction` `out|in`, both CHECK enforced) with the exact
same admin-only RLS pattern as `prospects` itself (`public.is_admin()` on all
four verbs). Verified directly against Postgres after applying, not assumed
from the migration text: all 6 columns present with correct types/defaults,
both CHECK constraints in place, RLS enabled with exactly 4 policies on
`prospect_touches` all calling `is_admin()`, and `prospects` row count
unchanged at 71 before and after (schema-only change, no data touched;
`prospect_touches` starts at 0 rows). `get_advisors` (security) shows no new
finding attributable to this migration.

`prospects-admin.js` gains `action: 'touch'` behind the same
`requireAuth({ adminOnly: true })` gate as `list`/`update`:
`POST {action:'touch', prospect_id, channel, direction, occurred_at?,
subject?, body?, note?} -> {touch, prospect}`. An outbound touch sets
`prospects.last_contacted_at`, an inbound one sets `replied_at`, both to the
touch's own `occurred_at` in the same handler call as the insert, so the
queue can never disagree with the touch history. **`touch` never sets a
stage** -- nobody has been contacted yet, and writing a touch that did not
happen would corrupt the one record this table exists to keep honest, so no
row was written by this session, migration only.

**Envelope decision made and reported loudly, since `bg-app` builds against
it:** `action: 'list'` nests each prospect's touches as `touches: Touch[]`
directly on the prospect row (most recent first), not a sibling top-level
`touches` key. One extra query grouped in memory by `prospect_id`, not N+1.

`WRITABLE_FIELDS` for `action: 'update'` is unchanged at 7 fields; all 6 new
columns are research/server-written only and are rejected (400, hard reject,
not silently dropped) if sent in an update patch, same behavior as every
other audit-derived column. `tests/prospects_admin_whitelist.test.js` extended
with `validateTouch()` coverage (channel/direction validation, occurred_at
default-and-round-trip, the out/in to last_contacted_at/replied_at mapping,
optional subject/body/note) plus 2 new auth-gate cases for `touch` -- 29
assertions total, all passing (`node tests/prospects_admin_whitelist.test.js`
from `brandgeo-dashboard/`). No em or en dash in any of the three changed
files, grep-verified.

Handoff `016` to `bg-verify` is READY (mandatory, this touches RLS and a new
table). Not yet run.

### 2026-08-15: prospect CRM data half built, migration applied, 71 rows backfilled

`bg-backend` built the data half of BrandGEO's own prospect CRM
(`public.prospects`) while `bg-app` built `src/pages/Prospects.tsx` in
parallel against the same fixed contract. Migration
`db/supabase-prospects-migration.sql` is applied to production
(duiyifepitvugyulobqm): admin only RLS on all four verbs via the existing
`public.is_admin()`, a `stage` CHECK constraint, an `updated_at` trigger.
Backfill `db/supabase-prospects-backfill-2026-08-15.sql` is run: 71 rows,
merged from all 70 `prospect_audits` domains with `status='ready'` plus one
Drive only domain (`getglossa.com`, never audited). 9 `audited`, 19
`disqualified`, 43 `new`. `netlify/functions/prospects-admin.js` is new
(list/update, admin gated, a hard reject on any non whitelisted patch key,
not a silent drop). Envelope matches `promotions-admin.js`'s precedent
exactly, confirmed against what `bg-app` actually built, not just agreed in
chat: `POST {action:'list'} -> {prospects}`, `POST {action:'update', id,
patch} -> {prospect}`.

**One real, unresolved finding, not silently picked either way:**
`revenuehunt.com` has two conflicting 2026-08-14 measurements 3 minutes
apart (54, disqualifying, then 0, which would qualify). Stored disqualified
as the Drive record decided, with the conflict spelled out in
`disqualified_reason`. Needs Constantin's call.

**One inference beyond direct transcription, evidenced not guessed:** the 9
tier 2 domains in `51-qualification-recheck-2026-08-14.md` are documented as
"check 4 open," but `prospect_audits` already holds a fresh ready row for
all 9 from the same 2026-08-14 batch window the Drive doc reports for tier
1, undocumented there. Applied the qualification bar's own D4 formula to
that real data: 4 of 9 qualify, 5 fail. Full reasoning and the domain by
domain breakdown: `.claude/handoffs/015-bg-backend-to-bg-verify-prospects-crm.md`.

**One interop note for whoever next touches `src/types/index.ts`:** `tier`
is typed `string | null` but the column is `smallint`; PostgREST returns it
as a JSON number. Harmless today, worth fixing so the type is honest.

Handoff `015` to `bg-verify` is READY (mandatory, this touches RLS and a new
admin endpoint). Not yet run. Nothing committed; the migration and backfill
are the one authorized exception to "never run a mutating statement," per
the packet that commissioned this work.

### 2026-08-14: Sprint 17 day 2, four GTM seats delivered, three live defects closed

The other subscription hit its limit mid-session on day 1; this session picked
the sprint up. Recovered `gtm-demand`'s uncommitted day-1 work first
(`2f61220`), then ran the four seats that had never produced a file.

**Three live defects found and fixed, verified over HTTP or by test:**

1. **50 articles were invisible to every search engine.** `sitemap.xml` stopped
   at `bg-054.html` while `bg-055` to `bg-104` served 200. `ping-sitemap` only
   reads the live sitemap, so those pages reached neither Google nor IndexNow.
   50 entries appended, live sitemap now ends at bg-104 (`36ad6e1`).
2. **The industry pages cited other companies' research as ours.** 31 claim
   sites across 9 pages (`3c7a8ac`). Worst item: home services claimed SOCi's
   98.8% as "the most AI-invisible category BrandGEO has measured". Siftly, ALM
   Corp, SOCi and Digital Bloom reattributed per `bg-008`'s own record; 5WPR
   and FlyDragon verified first-party and linked; 3 unverifiable claims
   deleted. The 27 city pages share the `ai-visibility-for-*` prefix and were
   deliberately NOT touched.
3. **Scheduled refresh erased history instead of accumulating it.** Committed
   `ac263ca`, **NOT PUSHED**, held by the batch-push hook. One `force` flag
   controlled two decisions; `replaceExisting` splits them, defaulting to
   `force && trigger === 'manual'`. `tests/enqueue_history.test.js` (23
   assertions) fails pre-fix, passes post-fix. Cost per run unchanged.

**BpR (client 1) is allocated Growth PRO to 2027-06-02**, `plan_source =
'package'` (one of the three values `expire-plan-grants` acts on), plus a
`client_events` row. Cadence deliberately left `manual`: `last_refresh_at` is
null so `isDue()` is true immediately and the hourly cron fires at :10, so
flipping cadence before the fix deploys destroys their 277 rows within the
hour. **Order is not negotiable: deploy, THEN `update clients set
refresh_cadence='weekly' where id=1`.** Client 52 already lost its history to
this bug (1 day, 6 rows) and cannot get it back.

**Finding that reframes the funnel, verified rather than inherited:** the
8-of-8 zero-score audits are TRUTHFUL, not a detection bug (the brand strings
appear nowhere in the stored `engine_results`). But the real split is brand
SIZE: HubSpot 61, Mailchimp 54, CaretLegal 56, GetResponse 33, and every small
brand since scores 0. The screening audit asks generic category questions, so
it returns a near-constant result for the whole SMB segment, while the only
visitor-specific output (which competitors were named instead of them) sits
behind the email gate. Also found: `top_gaps` IS the first three
`competitor_flags` re-keyed (`_score.js:167-170`), so the planned "names in
front, gaps behind" split is not implementable as written; `bg-architect` owes
a granularity ruling.

**The Evidence Machine already exists in production**, contradicting the plan's
day-9 schedule: `audit-domain.js` with `X-Internal-Key` writes `unlocked:true`
and `app.getbrandgeo.com/audit/<token>` renders it publicly with no gate. 55
internal audits across 41 domains, EUR 15.31 lifetime. Founder-led sales needs
no build and no sending domain.

**Left uncommitted deliberately, not this session's to sweep in:** ~805 lines
of pending-invoices work in `_revenue.js`, `revenue-report.js` and
`Revenue.tsx` from another session, carrying 65 em dashes that must be
stripped before it ships.

## CURRENT STATE (newest entry 2026-08-13)

### 2026-08-13: INV-35 PAID, GTM team created, five rulings made

**BpR's EUR 3,500 invoice is PAID** (confirmed by Constantin 2026-08-13). The
hand-provisioning runbook had NOT run at the time of writing: client 1 is
`growth_pro` but `plan_source` and `plan_grant_until` are still null. Exact SQL
is in `docs/growth/sprint17/PLAN-2026-08-13.md` section 6. Still owed from the
same handoff: the invoice promises 4 social channels against
`PLAN_SOCIAL_CHANNEL_LIMIT.growth_pro = 3`; catalogue descriptions still say
"five engines" for a 7-engine tier; `statement_descriptor_prefix` is null.

**Constantin's rulings on the audit's five open decisions:**
1. Homepage motion: delegated to a new GTM team. Sprint working assumption is
   self-serve owns the homepage for 17 days, with `get-found-online.html` given
   a nav route; reversible after day 17 (PLAN section 8).
2. ChatGPT in the free audit: **NO**, on cost. Note recorded for a future
   revisit: the ruling used EUR 0.108/check, production has since measured
   EUR 0.0615/check (`_cost.js:383-391`), so the real cost is ~EUR 0.25/audit.
3. Auto-refresh: **weekly, ruled better for delivered value.** SEQUENCING TRAP,
   do not reverse: `_enqueue.js:138-152` force-deletes on scheduled runs, so the
   history fix must ship BEFORE the cadence backfill or every client's trend is
   wiped weekly. Order and the research-row exclusion are in PLAN section 7.
4. Analytics: Plausible stays OFF, its history to be synced in a dedicated
   growth session; GA4 `G-9H6C2NSYPH` is the live (consent-gated) instrument.
5. Pricing surface: recommendation issued, awaiting sign-off. Show 3 cards
   (Free, Radar EUR 29, Growth EUR 299), hide Essentials EUR 99 (worst
   positioned, loses to Peec EUR 85), fix Radar with honest engine naming and
   outcome-worded cards rather than a price change. PLAN section 5.

**New GTM strike team**, constitution `docs/growth/GTM-TEAM.md`, seats
`.claude/agents/gtm-{lead,analyst,demand,outbound,content,conversion,verify}.md`.
Governing rule: a seat is judged only on whether it reduced the steps between an
asset and it being live; nothing is "done" until `gtm-verify` confirms it
externally. Agents may never create accounts, post, send, or submit; the last
mile is Constantin or the auto-poster.

**The 17-day goal was restated after arithmetic** (`PLAN` section 1): 100 PAID
self-serve subs needs roughly 100,000 visitors against a measured baseline of 8
audits in 38 days, a 30x to 100x gap. Committed instead: G1 revenue EUR 2,900
MRR-equivalent (same money, via the founder-led motion that actually closes),
G2 100 activated free accounts (stretch), G3 three channels firing daily by day
7 and still firing on day 17 (non-negotiable, the thing that has never been true).

### 2026-08-13: five-seat product-status audit (why it went quiet), read-only

Five parallel audit seats measured the funnel, landing page, positioning and
pricing, activation, and GTM against production. Master synthesis:
`docs/audit/product-status-audit-2026-08-13.md`. Seat evidence:
`docs/audit/funnel-data-2026-08-13.md`,
`docs/audit/landing-page-audit-2026-08-13.md`,
`docs/strategy/positioning-pricing-audit-2026-08-13.md`,
`docs/audit/activation-audit-2026-08-13.md`,
`docs/audit/gtm-channel-audit-2026-08-13.md`. All uncommitted; nothing else
was written or changed.

**Diagnosis: the inputs stopped, the market never said no.** All-time measured:
8 real public audits (the week-2 spike of 54 was an internal batch), ~5
self-serve signups, 1 customer-triggered collection ever, 0 organic checkout
intents, EUR 1.00 collected (founder test) vs EUR 37.12 API cost. Early
"interest" = founder pushes + hand onboarding; every input stopped Aug 2-7
(last signup 08-02, last social post 08-03, last commit 08-07, Plausible
removed 08-07). No always-on channel has ever run: outbound domain
trybrandgeo.com NXDOMAIN (never registered), 2 of 10 directories live, 9
staged social day-folders expired unposted, no X account.

**Refuted stale beliefs (stop re-deriving):** Growth PRO HAS self-serve
checkout (`_terms_gate.js:141`, backlog entry stale); Radar IS on the homepage
pricing section; the free-tier billing error never hit a real customer and the
Free=Gemini fix is deployed; the mobile horizontal scroll is fixed; Otterly no
longer 403s; live dashboard bundle = repo (nothing newer than 4b67a8d to
deploy); site analytics is not fully dark, GA4 `G-9H6C2NSYPH` runs consent
gated but Plausible's removal broke the everyone-measured design.

**Live delivery gaps found:** refresh_cadence backfill never ran (36 of 38
clients manual, the weekly refresh paid tiers advertise is not delivered,
monthly free refresh has fired 0 times); scheduled refreshes FORCE-DELETE
prior ai_results (proven on client 52), so no trend ever accumulates; enqueue
blocks are console-only, invisible to users; no lifecycle email exists; BpR
INV-35 (EUR 3,500) payment state unknowable from the DB (webhook lacks
invoice.paid), needs a Stripe Dashboard check + the provisioning runbook.

**Decisions owed (only Constantin):** which motion owns the homepage (the
2026-07-18 GTM ruling made done-for-you primary, homepage sells self-serve and
links get-found-online.html 0 times); ChatGPT in the free screening audit at
~EUR 0.43/audit; cadence backfill vs pulling the weekly claim; analytics stack
(reactivate Plausible or GA4+consoles); collapse visible pricing to 3 cards.
Full ranked plan in the synthesis §5.

### 2026-08-07: the homepage IS the Live Instrument page now (founder-approved swap)

Full rebuild via a three-seat Fable waterfall (research, design spec, build),
all artifacts in `docs/design/landing-rebuild-research-2026-08-07/` and
`docs/design/landing-instrument-spec-2026-08-07.md`. Live and verified over
HTTP at `4e698cf`. Load-bearing facts for anyone touching the homepage now:

- **The hero prints REAL client data** (BpR anonymized, per Constantin's
  ruling): 70.8% mention rate, 46/65 answers, window 2026-07-21 to
  2026-08-07, per-engine rates pulled from `ai_results` by the orchestrator
  and recomputed at build. Refresh procedure is in the HTML comment above
  the card. NEVER relabel it as sample, never name the client, never show
  the client domain.
- `hero.js` (canvas mesh) is NO LONGER LOADED on the homepage; the new
  interaction file is `instrument.js`. `site.js` is loaded unmodified.
- Type system is exactly six sizes {56,32,18,15,14,12}, weight cap 600, one
  1200px container; the fold budget is 0 red/orange, 1 green, ~6 violet.
  Contrast verified 4.5:1+ both themes on 28 pairs.
- Pricing CTAs are structurally pinned to one baseline (measured [5055 x5]);
  Growth holds the section's ONLY solid violet CTA, others are ghost.
- `index-new.html` remains on disk and live as a noindex preview alias
  (cPanel never deletes); the pre-swap homepage is in git history at
  `c612b02`.
- Mode-switch and footer-grid mobile overflows are FIXED (scrollX 0 at
  320/375/768/1440, real-scroll measured); the backlog "decision owed" entry
  below is CLOSED by the stacked-button design.
- Footer carries all 8 platforms incl. GBP share link (supplied 2026-08-07,
  exists nowhere else in the repo) and Threads (@brandgeo_global).
- Product stage (real workspace showcase) is DEFERRED by Constantin until
  traction provides SaaS-grade data; anonymized competitors only when built.

Every claim in this section was checked against the live sites, the running
bundle, or the working tree. Not remembered. If you change something here, check
it the same way. This section takes precedence over §0 through §7 below.

**Entries are dated individually and newest first. Read the date on the entry,
not the date on this header.** The header used to read "verified 2026-07-26"
while carrying entries a week newer, which is the same drift this section exists
to prevent.

### 2026-08-02: S21 admin Revenue page — COMMITTED, awaiting batch push

The Usage & Costs admin page is now Revenue, with Usage / Cost / Revenue
tabs (`brandgeo-dashboard/src/pages/Revenue.tsx`, replacing `Usage.tsx`) plus
a new admin-only `netlify/functions/revenue-report.js` (Stripe invoices,
refunds, customers, promotion codes — read-only) and its pure logic in
`_revenue.js`. Full CQO four-stage gate run: data contract
(`docs/arch/revenue-report-data-contract.md`), a 97-check fixture harness
(`brandgeo-dashboard/tests/revenue_report.test.js`), SIMULATE against real
live Stripe/Supabase data (zero mismatched cents,
`docs/qa/s21-revenue-report-simulate-2026-08-02.md`), and a blocking CQO
review (`docs/qa/s21-revenue-report-cqo-review-2026-08-02.md`, verdict PASS
WITH FINDINGS, independently reproduced). 10 commits, none pushed yet — rides
in the next batch push per the credit-economy rule
(`docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md` binding rule 9).

**Real finding worth knowing before touching this page again:**
`clients.stripe_customer_id` exists as a column but is populated for only 1
of 38 clients (a test row scheduled for deletion) — every real paying client
was provisioned outside the Stripe webhook. The join resolves per Stripe
Customer instead: `metadata.client_id` first (the hand-invoiced path,
verified live on BpR's own Customer), then `clients.stripe_customer_id`,
then an explicit `unattributed` row rather than a guess. A cost-only client
with no Stripe customer at all gets a fourth value, `attribution: null`,
distinct from `unattributed` — conflating the two would false-alarm on every
research client's row.

**Three policy decisions are open, not made unilaterally** (contract §11):
whether a refund on an already-commissioned affiliate invoice claws back the
commission (F3); whether `draft`/`void` Stripe invoices should count toward
"gross invoiced" (F4); and whether the pipeline's upgrade-opportunity value
should price Radar at its €39 list price (as built, per the contract) or its
€29 launch price (what a campaign run today would actually sell at).

### 2026-08-02: BrandGEO bills from a SPANISH Stripe account now

**`acct_1Tzui063lspobjfO` (ES) is the live billing account. The Romanian
`acct_1LHjKrKh2GaZE2B4` is superseded** and awaiting close-out. Full record and
the remaining steps: `handoff-billing-2026-08-02.md`, read its top block first.

**Why it had to be a new account: `account.country` cannot be changed after
activation.** Stripe's documented remedy is a new account in the correct
country. So "fix the country" is never a task, it is a migration. The old
account was `country: RO` carrying a Tenerife address, which made a sale to a
Romanian buyer look DOMESTIC and put 19% Romanian VAT on the BpR EUR 3,500
instead of Art. 44 / Art. 196 reverse charge. That is what forced the move, and
it is why the BpR invoice was deliberately NOT issued from the old account.

It cost almost nothing because it was done before the first real customer: the
old account's entire lifetime was 2 customers, both Constantin's own tests, 2
charges totalling EUR 1.50, and 1 canceled subscription.

**Verified end to end, not reported:** the catalogue is 4 products / 7 prices /
7 links, all livemode; a live `POST accept-terms` returned the new account's
link, proving the env vars reached the functions; and a EUR 1 payment
provisioned a client through `checkout.session.completed` with a `client_events`
row, proving the webhook still parses under API version `2026-07-29.dahlia`
where the old endpoint ran `2020-08-27`.

**No code changed for the migration.** The links live in `STRIPE_CHECKOUT_LINKS`
on Netlify with no fallback, so it was three env vars and one redeploy.

**Rules earned, do not relearn:**
- **The Stripe CLI defaults to TEST mode.** `--live` on every command. An empty
  product list in test mode looks identical to a fresh account, and nearly got a
  whole catalogue built in test mode with every call returning success.
- **`scripts/stripe-create-catalogue.js` now REQUIRES `--project-name`.** Without
  it, it targeted whatever profile the CLI was logged into, which was the account
  being abandoned.
- **Diagnose the layer before spending a Netlify build.** "Contact us, no link"
  on the Radar CTA looked exactly like a failed env var. One live POST proved the
  env was fine and the real fault was `site.js` sending `period: 'annual'` for a
  plan that has never had an annual price, fixed for free via cPanel. The billing
  toggle is global and applies to cards that show no yearly price; see
  `MONTHLY_ONLY_PLANS` in `brandgeo/web/site.js`.
- The old account's payment links are still ACTIVE and are permanent bearer URLs
  in public git history. Deactivating them is owed, and only AFTER the new
  checkout is confirmed working.

**Still open:** the invoice template on the new account is not compliant yet
(legal name, VAT id, footer, 0% tax line, invoice prefix, and `page_size` is
`letter` on a European invoice), and the accountant's reverse-charge footer
wording is the one true blocker on the BpR sale.

### 2026-08-02: `/#free-audit` is the site-wide CTA target, and it is load bearing

**`brandgeo/web/index.html`'s hero carries `id="free-audit"`. Ninety plus pages
link to it. Renaming or removing that id breaks the call to action on the whole
site at once.** `site.js` focuses `#brandInput` when a visitor arrives on the
hash. Verified live: 92 of 98 pages carry a CTA, and **zero** still point their
primary button at `/#contact`.

Why it moved: `/#contact` is the **48-hour manual request form**. The instant
audit lives in the hero and, until this change, nothing on the site linked to it.
The weaker promise was the one on 77 pages. The six pages with no CTA are legal
and terminal pages, by decision, and `article-builder.html` is excluded as an
internal tool.

**Articles are generated, not hand-copied.** `scripts/build_articles.py` plus
`scripts/articles_content.py` render every `bg-*.html` from one template. This
exists because six pages (`bg-020`, `bg-022` to `bg-026`) were found loading
**Google Analytics before consent**: they were written after `399723c` swept that
tag off the other 79 pages, by copying a page that predated the sweep. A page
copied from a page inherits the state of that page, not the state of the site.
Removed on all six. **Do not hand-copy an article template again.**

**BG-027 to BG-034 are live**, the bilingual series, off `ai_results` data
collected 2026-07-10 that had sat unpublished. 34 articles now exist. The dataset
and its query traps are in memory as `bilingual-research-dataset`; full method
in `scripts/articles_content.py`'s header. `news/radar-plan-launch/` is live and
is the first announcement of Radar and of the free tier moving to Gemini.

**Indexing reality, unchanged but now load bearing for content work.**
`ping-sitemap` (pg_cron job 5, `10 5 * * *`) submits to **IndexNow only**;
`google_skipped: "NO_CREDENTIALS"` on every run is the intended 2026-07-28
ruling, not a fault. Google gets nothing automatically. New URLs reach Google
only via the sitemap being crawled, or by Constantin submitting them by hand in
Search Console. `job_runs.ok` is `true` whenever a submitter was merely
configured, so **read `pinged` against `indexnowOk` in `detail`, never `ok`**.

**Two measurement rules that cost time this session, both now in memory.**

1. **The Browser pane cannot measure layout.** Undisplayed it does not
   composite, so `document.documentElement.clientWidth` reads **0** and every
   geometry number from it is meaningless; `resize_window` does not fix it and
   screenshots fail outright. Use headless Chrome over CDP (Node 24 has a global
   `WebSocket`, no dependency). Memory: `preview-pane-cannot-measure-layout`.
2. **`scrollWidth` is not evidence of a horizontal scroll.** Attempt a real
   `window.scrollTo(600, 0)` and read `scrollX` back. To prove a change is not
   the cause of an overflow, delete that element in the live page and re-measure.

**Live defect that measurement found, NOT fixed, do not re-derive it.** The site
scrolls sideways on a phone. Measured at 375 CSS px with a real scroll:
**`bg-026` 146px, `bg-019` 428px, the homepage 123px** from `.mode-switch` (two
buttons of 221px and 233px inside a 320px wrapper carrying `flex-wrap: nowrap`),
and 53px at 768px from `.footer-grid` never collapsing. BG-027 to BG-034 are the
only articles measuring **zero**; the four-line media query that got them there
is in `build_articles.py`. The mode-switch fix carries a design choice (stack,
shrink or wrap) and is owed a decision, not a patch.

### 2026-07-31: the pricing ladder is ruled (S1). One follow-on unsigned.

`docs/strategy/sprint-ladder-ruling.md` is now the single source for the ladder,
argued with its arithmetic in euros, and **all four decisions carry Constantin's
`DECIDED 2026-07-31` lines.** A Radar entry tier at EUR 39 list and EUR 29 launch
for the first 100, **Gemini and Claude** (he amended this off ChatGPT and Gemini:
ChatGPT at EUR 0.108 a check was 77 percent of Radar's cost, and the amendment
saves EUR 227.55 a month at 100 subscribers), 7 prompts, weekly, 1 site.
`PLAN_PROMPTS = 5, 7, 18, 35, 56, 200, 200`, sentinel for enterprise, which holds
the 15 percent ceiling, closes both inversions and reduces nothing. SUM the D1
pools, MAX the site allowance, enforced at ACCOUNT level or it is decorative.

**The amendment created decision 1b, also ruled the same day:
`PLAN_ENGINES.free = ['gemini']`, was `['chatgpt']`.** Otherwise a Free client
paying EUR 29 for Radar would have LOST ChatGPT. Radar is now a strict superset
of Free. **Consequence S2 owns: ChatGPT is first sold at Essentials, so the
locked-engine "upgrade to unlock" nudge on Free must name Essentials and not the
next rung.** Consequence for the constants: Free costs EUR 0.160 a month, so
**`PLAN_MONTHLY_API_BUDGET_EUR.free` stays at 0.30 and the raise to 0.60 drafted
in decision 2 is cancelled.** Radar ships at 7 prompts; the optional 8 was
declined.

Three findings from the costing that stand on their own. The free tier's EUR 0.30
budget cannot pay for its own 5 ChatGPT prompts (EUR 0.540), so a free signup
collects 3 and gets a billing error, and this is LIVE until S2 ships 1b. One
Managed client at 200 prompts consumes
the entire 500 credit monthly SerpApi pool, platform wide. And the ladder's
headline numbers depend on `MONTHLY_CAPPED_ENGINES` in `_cost.js:541`: delete
that constant and Growth PRO and Managed breach by EUR 8.61 and EUR 46.27, so S2
should pin it with an assertion. The stale ladder comment at
`planConfig.ts:400-420` must be deleted in the same commit as the new constants.

### 2026-07-31: outbound sending infrastructure (S8), instructions written

`docs/growth/outbound-infra.md` is the full build-out for the cold channel:
secondary sending domain `trybrandgeo.com` (never send cold from
`getbrandgeo.com`), two Google Workspace inboxes on a SEPARATE subscription so a
suspension cannot reach company mail, exact SPF/DKIM/DMARC records, cPanel root
redirect, Instantly warmup and the per-inbox cap ramp, plus the GBP description
and services rewrite with the lineup read from `planConfig.ts`. Registrar and
DNS host is **CyberFolks**, mail is **Google Workspace**, cPanel IP is
**91.200.121.45**, all measured not remembered. Two open findings recorded
there: the plan's Day 25 to 28 volumes (55 to 70/day) exceed two inboxes' safe
capacity, so inboxes 3 and 4 must be created on Day 12; and the new domain's
DMARC moves to `p=quarantine` on Day 15. S8 stays IN PROGRESS until mail-tester
scores 9+ on both inboxes and the public GBP profile is re-checked.

Two rulings recorded in that doc rather than left to be re-argued. **A subdomain
was rejected**: `getbrandgeo.com` publishes `p=none` with no `sp=` tag, so under
RFC 7489 a sending subdomain inherits `none` and could not move to
`p=quarantine` independently, and organisational-domain scoring plus domain
blocklists would put the primary inside the blast radius. A subdomain is still
the right answer for opted-in mail later (`mail.getbrandgeo.com`). **The name is
`trybrandgeo.com`**, Constantin's suggestion, over the original
`trygetbrandgeo.com` which stutters at the `try-get` seam.

**Found while checking that name, and it is a decision owed:
`brandgeo.com` is for sale at USD 9,995** on Atom.com (`ns1/ns2.atom.com`, 302s
to `atom.com/name/BrandGEO`). It is parked marketplace inventory, not an
operating competitor, which is what makes `trybrandgeo.com` safe to use.
**Constantin's ruling 2026-07-31: keep it OPEN, no funds available for now.**
Deferred, not closed and not to be re-argued from scratch. Revisit triggers are
the Day 30 close-out, the Atom listing changing, or any GEO competitor being
seen on it. Nothing in the sprint depends on it.

### 2026-07-31: the acquisition funnel has a forward step, and payment has a gate

Sprint task S3, roadmap Stream C. The Stripe payment links are **no longer in
`brandgeo/web/site.js`**: they moved to `netlify/functions/_terms_gate.js` and
are issued one at a time by `accept-terms.js`, which records a
`terms_acceptances` row first and returns nothing if it cannot. Never put a
checkout URL back in a browser-served file.

**But do not read C3 as closed, and this is the load-bearing correction.** Those
links are Stripe **Payment Links**: permanent, reusable, and enough on their own
to pay. `_terms_gate.js` is in the **public** repo, the links are in four
committed docs, and they are in git history forever. Moving them gated the route
and not the destination. `stripe-webhook.js` now raises a
`checkout_without_acceptance` admin event when a payment arrives without a
matching acceptance, so a bypass is visible; it never withholds provisioning.
**Rotating the six links, and keeping the replacements in env vars, is what
actually closes it, and it needs Constantin.** Caught by `bg-verify`, which
returned FAIL on the first four commits: an earlier commit message here claimed
the gate was real and it was not.

Also: the audit success path now
offers signup with `?domain=` prefilled (it previously offered nothing, while
the FAILURE path offered exactly that), the domain survives into `/welcome`, and
a failed HubSpot push records why on `prospect_leads.hubspot_error` instead of a
silent `false`. Two new checks: `scripts/check-funnel-accept-path.sh` and
`scripts/check-contract-gate.sh`, both exit 0, both proven to fail on the commit
before. Full detail in `docs/ROADMAP.md` Stream C.

### 2026-07-28: colour system, engine lineup and plan limits (all LIVE)

Four commits, all pushed and verified over HTTP against getbrandgeo.com.
`7da5a67` `9b6bbe3` `49c5c72` `0acd83b` `68b8e1d`.

**The palette is now derived from measurement and is documented in place** in
`index.html`'s `:root` block. Full teardown, sources and method:
`docs/research/competitive-and-conversion-2026-07-28.md`. Headlines:

- `--t` moved off `#ffffff` (20.9:1, halation range) to `#E8E9ED` (16.2:1).
- Surfaces were OKLCH C 0.019 at hue 284 while `--ac` is C 0.219 at hue 293, so
  the accent sat on a desaturated copy of itself. Surfaces are near-neutral now.
  **The violet did not change and should not.** Of ten competitors scraped none
  owns it; peec.ai `#6b5bff` and AthenaHQ `#4f39f6` sit at hue 277-281 and
  BrandGEO's `#8b5cf6` is 293, clear of that cluster.
- Alpha text/border tokens are solid hexes now, so they can be contrast-checked.
- **Light mode is no longer UNAUDITED.** It failed at the token level on every
  page (`--t2` 4.09:1, `--t3` 2.19:1, `--ac2` 1.79:1) and 76 of 79 pages never
  overrode the accent tokens in their light block at all. Fixed everywhere.
- `--ac` `#8b5cf6` is a FILL only in dark; white on it is 4.23:1. `--ac-strong`
  `#7c3aed` (5.7:1) is the button fill, `--ac-text` `#a78bfa` (7.23:1) is accent
  text. New `--ok/--part/--bad/--info` and `--warn` carry status and risk.
- Verified in-browser at 1280px: 292 text nodes, **0 contrast failures in dark,
  0 real failures in light**, no horizontal overflow.

**Engine lineup is corrected in every product claim.** Growth gained `google_ai`
(`9b6bbe3`), so Growth and Growth PRO now have identical 5-engine coverage. All
ten `brandgeo-vs-*.html` pages had advertised "ChatGPT, Gemini, Claude,
Perplexity, and Meta AI" — a retired engine — and `brandgeo-vs-profound.html`
additionally conceded Google AI Mode to Profound twice. `faq.html` answered
"Which AI engines does BrandGEO monitor?" with Meta AI in the visible copy AND
the JSON-LD. 22 claims corrected. **Historical research pages were deliberately
left alone**; when a city study reports what Meta AI answered in a given run,
that is a measured result and rewriting it would falsify the record.

**Published plan limits now match `planConfig.ts`.** The page had promised
Essentials 30 prompts (enforced 20) and Growth 150 (enforced **75**), plus
"4 AI engines" for Growth (now 5) and "Daily/weekly refresh" against a 48h
cooldown. Corrected downward to reality, because the code has enforced the lower
numbers all along so no customer ever received the published figure.

**Three FAQPage schemas were invalid and silently dropped** on Baltimore,
Charlotte and Detroit: the last FAQ entry closed with `"}]` instead of `"}}]`,
leaving `acceptedAnswer` unclosed. Pre-existing, confirmed identical at
`0c6e740`. Site-wide JSON-LD now validates **110/111**; the one failure is
`article-builder.html`, an internal tool excluded from the cPanel upload.
**Add a JSON-LD validation step to any content workflow** — this went unnoticed
on a product whose whole thesis is being parsed correctly by AI engines.

**Open decisions this created, none of which a copy edit can settle:**
1. **Growth PRO's ladder is thin.** EUR 449 vs EUR 299 now buys +25 prompts and
   a 12h faster refresh, with identical engines. Direct consequence of giving
   Growth `google_ai`.
2. Whether to raise `PLAN_PROMPTS` to the previously published numbers instead
   of having lowered the page. That roughly doubles Growth's collection spend.
3. The two uncited hero stats (73%, 4.2x) still need a source or removal.
4. Otterly's pricing in the research doc is secondary-sourced (they 403 a plain
   client) and needs a first-party check before it appears in public copy.

**Measurement traps that produced two false findings in that session, worth
knowing before trusting any browser audit:** a hidden/throttled tab does not
advance CSS transitions, so `getComputedStyle` returns the pre-transition value
indefinitely (this made light mode look completely broken, 107 phantom
failures). Kill transitions at *matching specificity* — a `*` rule loses to a
class rule carrying its own `!important` transition — then force a reflow. And a
zero-width viewport reports every element as overflowing; assert
`document.documentElement.clientWidth` before trusting any layout number.

### Agent Operating System
- Constitution: `docs/AGENT-OS.md` (roster, model routing, waterfall, handoff
  packet schema, command set, guardrails). Binding on every agent and session.
- Agent prompts: `.claude/agents/*.md` (12: ten `bg-` waterfall agents plus two
  portable read-only auditors, `dashboard-auditor` and `landing-page-optimizer`,
  which write one exact file each into `docs/audit/`). Roster and the reason the
  auditors are separate: `docs/AGENT-OS.md` §1.
- Handoff packets: `.claude/handoffs/` (the only state that crosses a session
  boundary). Template: `.claude/handoffs/_TEMPLATE.md`.
- Artifacts: `docs/strategy/`, `docs/arch/`, `docs/design/`, `docs/copy/`,
  `docs/qa/`.
- Start any multi-department initiative with `bg-orchestrator /plan`, run each
  stage in a fresh session, `/clear` between stages.

### Deploy pipelines (read before reporting a deploy as broken)

Two independent pipelines. A failure in one says nothing about the other.

- **`getbrandgeo.com` (marketing) deploys via GitHub webhook to
  `brandgeo/web/deploy.php` on cPanel.** Netlify is not involved.
- **`app.getbrandgeo.com` (dashboard) deploys via Netlify** from
  `brandgeo-dashboard/`.

**Netlify showing "Canceled" on a run of deploys is normal and intended.**
`brandgeo-dashboard/netlify.toml` sets
`ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."`. Netlify's
`ignore` inverts the usual convention: exit 0 means cancel. `git diff --quiet`
exits 0 when nothing changed, so any push that does not touch
`brandgeo-dashboard/` is cancelled on purpose and labelled "Canceled" rather
than "Skipped". Without it the dashboard rebuilds on every marketing and blog
push. `$CACHED_COMMIT_REF` tracks the last commit actually built, so the diff is
cumulative and no dashboard change is lost to a run of cancellations.

Verified live 2026-07-26: `getbrandgeo.com/site.js` line 1 is
`/* build: 2026-07-26 hook-rebuild */` and `index.html` carries the same stamp as
its first `<body>` comment, so the cPanel pipeline is delivering. CSP is a
response header from `brandgeo/web/.htaccess`, not a meta tag, and the live
header includes `connect-src ... https://app.getbrandgeo.com`.

### Engine lineup and collection (supersedes §1.2, §2.8, §4.9)

- `meta` is RETIRED as of 2026-07-16 and is in no plan set. Kept in `ENGINE_META`
  so historical rows render, and in `collect-prompt.js` `FAST_ENGINES` so a stale
  request does not error (`planConfig.ts:41`, `collect-prompt.js:31`).
- `google_ai` (Google AI Mode via SerpApi) went live 2026-07-16, Growth PRO and
  up only, to cap SerpApi spend (`planConfig.ts:43`).
- **§2.8 "No Scheduled Collection" is WRONG now.** Collection is server-side: a
  queue, `collection-worker-background`, and an hourly `schedule-collections`
  cron that is inert while `refresh_cadence` is `manual` (the default).
  `docs/STATE-OF-PRODUCT.md` §4.1 is stale on this too.
- Plan ladder single source of truth is `src/lib/planConfig.ts`. `_cost.js` is a
  current mirror and is the copy that ENFORCES entitlement and budget.
  `_plans.js` is a DRIFTED mirror, see the defect below.

### Content pipeline
BG-001 through BG-019 are live in `brandgeo/web/` (19 `bg-*.html` files,
counted; `bg-018.html` and its hero image are live but still untracked in git,
`bg-019.html` is committed and pushed at `e6d9af4`). 27 city AI-visibility
research pages are live (the original 7 plus 20 more US cities added
2026-07-24/25), 10 industry pages, 10 comparison pages, 1 AI Visibility Index
issue (#1, 2026-07-14), 2 press releases. Recent `ROADMAP-*.md` and
`linkedin-posts-*.md` live in `docs/`, not the repo root, per reorg commit
`5326a59`.

**Weekly content roadmap, run 2026-07-27:** `docs/ROADMAP-2026-07-27.md`.
Decided focus: BG-020, a cross-city consensus follow-up to BG-016 using the
now-27-city dataset (needs no new collection). AI Visibility Index Issue #2
confirmed not due, no client of any kind has more than one distinct collection
day in `ai_results` yet, so there is no trend data to report regardless of the
30-day day-count. Full detail, sources, and an important flag in that file:
this scheduled task was briefed to read `CLAUDE.md` §9/§12/§13, which **do not
exist** — see the note directly below.

### Dashboard: shipped and verified live 2026-07-26

Pushed, built by Netlify, and confirmed against the running bundle. This was the
first dashboard deploy since `2c0f281` (2026-07-24). The served bundle is
`index-DzC066bP.js`; its prices read €0, €99, €299, €449, from €1,500, `€900` is
gone, and `Pro (legacy)` and `promotions-admin` are both present. An
unauthenticated POST to `/.netlify/functions/promotions-admin` returns
`401 Unauthorized: missing token`, so the function deployed and its auth gate
works.

- `34e41bb` `fix(app)`: aligns `PLAN_TIERS` with the 2026 ladder (Free,
  Essentials €99, Growth €299, Growth PRO €449, Managed from €1,500, Enterprise
  custom). Legacy `pro` is dropped from the offered ladder and re-inserted,
  labelled legacy, only for a client still on it, positioned before Enterprise
  per `planConfig.ts:159` so Enterprise still reads as an upgrade for them. This
  closes the live mismatch where the dashboard showed Managed €900 while the
  marketing site published €1,500 in its JSON-LD product schema
  (`index.html:82` to `:85`).
- `3dadd8b` `feat(app)`: the admin Promotions panel plus its backend,
  `promotions-admin.js` (list/create/toggle, service key behind
  `requireAuth({ adminOnly: true })`), plus `db/supabase-promotions-migration.sql`.
- `97b3723` `docs`: superseded by this restore, see the note at the end.

**The promotions migration was APPLIED 2026-07-26** and verified: `pg_policies`
returns exactly three rows for `promotions` (`promotions_select`,
`promotions_insert`, `promotions_update`). There is no delete policy by design,
so promotions deactivate and never disappear, and `promotions-admin.js` exposes
no delete action to match. `db/supabase-promotions-migration.sql` is now a record
of a migration already run, like the rest of `db/`, and is safe to re-run.

The table records which promotions exist. It prices nothing. Nothing on the
checkout path reads it and no Stripe coupon is created, so no promotion created
here changes what any customer is charged until the Stripe wiring is built.

`promotions-admin.js` validates plans against `_cost.js`, not `_plans.js`.
Validating against the drifted mirror would reject a promo targeting Growth PRO,
which is C1 one layer down. `_auth.js:28` derives its plan list the same way.

### Growth PRO is unsellable and unassignable (revenue defect)

Found by `bg-architect`, recorded in `docs/arch/activation-path.md` §3.
`planConfig.ts` is authoritative and `_cost.js` matches it, so entitlement and
spend are NOT affected. `_plans.js` is the lone drifted mirror:

- **C1.** `_plans.js:9` `PLAN_ORDER` has no `growth_pro`, and
  `set-client-plan.js:116` gates on its `isValidPlan`. `set-client-plan` is the
  only admin path that writes `clients.plan`, so Growth PRO cannot be assigned by
  anyone. It also has no Stripe price or checkout link (`site.js:513`,
  `stripe-webhook.js:37` to `:45`), so it cannot be bought self-serve either.
- **C2.** `_plans.js:20` gives Growth five engines including `google_ai`.
  `planConfig.ts:49` and `_cost.js:112` give four, deliberately. So a client
  upgrading to Growth is emailed a written promise of "Google AI Mode", an engine
  the product will never collect for them, at the moment they pay more.

- **C3, found by B1 and worse than C1/C2.** `planUnlocks` (`_plans.js:58`) opens
  with `const key = isValidPlan(plan) ? plan : 'free'`, so an unknown plan does
  not throw or render blank, it silently becomes Free. `planRank` degrades the
  same way, returning 0. If `growth_pro` reaches `buildNotice()`, a €449 upgrade
  is announced to the buyer as "1 AI engine monitored: ChatGPT", with the Free
  plan's blurb, in a DOWNGRADE-toned email, because `planRank('growth_pro')` is 0
  against `planRank('growth')` of 2. `activation-path.md` §3.3 originally
  recorded this as an empty section; running the code proved otherwise.
- **C4, latent.** `managed`, `pro` and `enterprise` each sit one rank lower in
  `_plans.js` than in `planConfig.ts`. Harmless today because every comparison
  happens within one file, and fixed for free by the same edit.

Fix direction is `activation-path.md` §3.4, adjudicated by
`docs/qa/plans-divergence-b1.md` §5, which also ships a runnable harness in §4 so
the fix has a pass or fail condition rather than a judgement call. `bg-backend`,
Opus not Sonnet: it rewrites the copy a paying customer is emailed on upgrade,
which is billing under AGENT-OS §2. Packet `005` is written and ready.

**UPDATE 2026-07-26, `bg-backend` ran packet `005`.** `_plans.js` and
`set-client-plan.js` are edited on the working tree, per the "Do" list in
`005`. C1 through C4 are all addressed: `growth_pro` is now `isValidPlan`,
`PLAN_ENGINES` is deleted (`planUnlocks` now derives from `_cost.js`'s
`activeEnginesFor()`), `PLAN_BLURB.growth` no longer claims a fifth engine, and
`planRank` matches `planConfig.ts` for all seven plans. The §4 harness printed
`PASS`. **These changes are UNCOMMITTED — no git command has been run**, per
`005`'s "Do not" list and AGENT-OS's builder/reviewer separation. Packet `006`
(`bg-backend` → `bg-verify`) is written and READY; it is the next thing to run,
before anything is committed. Full detail, the harness output, and the exact
commit command bg-backend drafted: `.claude/handoffs/006-bg-backend-to-bg-verify-plans-drift.md`.

### Conversion initiative: where the waterfall stands

| Stage | Agent | Artifact | State |
|---|---|---|---|
| S0 | bg-strategy | `docs/strategy/hook-thesis-web.md`, `activation-thesis-app.md` | COMPLETE |
| A1 | bg-design | `docs/design/homepage-hook.md` | COMPLETE |
| A2 | bg-copy | `docs/copy/` | **BYPASSED, never ran** |
| A3 | bg-web | `brandgeo/web/index.html`, `site.js` | **SHIPPED LIVE, UNREVIEWED** (`801732c` plus 4 follow-ups) |
| A4 | bg-verify (web) | `docs/qa/web-hook-verification.md` | NOT RUN |
| B1 | bg-verify | `docs/qa/plans-divergence-b1.md` | **COMPLETE** |
| (B1 slot) | bg-architect | `docs/arch/activation-path.md` | COMPLETE, then amended by B1 |
| B2 | bg-design | `docs/design/activation-path.md` | READY, packet `004` on disk, not started |
| (`_plans.js` fix) | bg-backend | `_plans.js`, `set-client-plan.js` | **COMMITTED `f6deb01`, not yet pushed** |
| (`_plans.js` review) | bg-verify | `docs/qa/plans-drift-fix-006.md` | **COMPLETE 2026-07-26, verdict PASS WITH FINDINGS** |
| B3 to B5 | copy, app, backend, verify | | BLOCKED on B2 |
| (none) | bg-app, bg-backend | `34e41bb`, `3dadd8b` | SHIPPED OUTSIDE THE WATERFALL |

Packets `001` to `006` all exist in `.claude/handoffs/`. `005` (`bg-verify` to
`bg-backend`, the `_plans.js` drift fix) has been run — see the UPDATE note
above. `006` (`bg-backend` to `bg-verify`, reviewing that fix) **has now been
run**: verdict `PASS WITH FINDINGS`, report `docs/qa/plans-drift-fix-006.md`.
`bg-verify` reproduced the §4 harness independently (`PASS`, exit 0), confirmed
all four B1 findings closed and all seven of packet `005`'s acceptance criteria
met, and traced the `growth_pro` assignment path across 14 hops without finding
any remaining consumer of the old `PLAN_ORDER` / `PLAN_ENGINES` shape. It wrote
the commit command itself rather than verifying a drafted one, because
**packet `006` contains no commit command** — an earlier claim in this file that
it did was wrong, corrected below.

Findings from the review, none of which block the commit:

- **V1, MEDIUM, CLOSED 2026-07-26 by query.** `clients.plan` has no `CREATE` or
  `ALTER` anywhere in `db/` (the column was made ad hoc, see #94), so `bg-verify`
  could not close the Supabase write from source and flagged the risk that an
  ad-hoc CHECK constraint over the old six-plan ladder would keep Growth PRO
  unassignable, turning a fixed 400 into a 500. **Checked against production:**
  `pg_constraint` returns exactly two CHECK constraints on `public.clients`,
  `clients_category_check` (on `category`) and `clients_type_check` (on `type`).
  Neither touches `plan`. There is no constraint blocking `growth_pro`, so the
  fix reaches production intact. The underlying gap stands and is worth closing
  on its own: `clients.plan` still has no migration file in `db/` while every
  other column on that table does.
- **V2, LOW, pre-existing.** `_cost.js:135` falls back to `essentials` for an
  unknown plan while `planConfig.ts:329` falls back to `free`. Unreachable via
  `planUnlocks`, reachable via the collection queue with a corrupt `clients.plan`.
- **V3, LOW, pre-existing.** `_prospect_engines.js:384`'s comment still claims
  Growth has five live engines. Comment only.

`npm run build` was deliberately not run: `tsconfig.json` has
`"include": ["src"]`, so neither changed file is compiled or even read by it,
and a green build would be evidence about a different part of the repo.

State of the protocol, corrected 2026-07-26 20:45:

1. **B1 ran and is complete.** An earlier pass in this file claimed it was skipped
   and `docs/qa/` was empty. That was wrong: the observation was made before
   15:22 and not rechecked. B1 loaded `_plans.js` and `_cost.js` in Node and
   called them, with the harness reproduced in its §4. It confirmed four findings
   and corrected `activation-path.md` §3.3 where reading the code had suggested a
   milder fault than running it does.
2. **The A branch is the real gap, not the B branch.** `bg-web` shipped the
   public homepage with no `bg-copy` stage and no `bg-verify` stage, then patched
   the same surface four more times (`82f0474`, `68afbaa`, `662ea8e`, `4ed6a94`).
   This is the largest unreviewed surface in the initiative and it is live to
   every visitor.
3. **Packet ids are allocated when a packet is written, never reserved in advance
   inside an artifact.** `homepage-hook.md` §13 drafts a `bg-copy` packet as `003`
   and a `bg-web` packet as `004`; both numbers are consumed by other packets and
   those drafts are dead. An artifact refers to a downstream packet by
   from/to/slug, never by number. `bg-orchestrator` assigns the number on write.
4. **Not a defect:** the design artifact is `homepage-hook.md`, not the plan's
   `web-hook-and-conversion.md`. Packet `002`'s `scope_write` names
   `homepage-hook.md`. The packet superseded the plan's stale filename.
5. `bg-architect` read the WORKING TREE, not `HEAD`. Its `Account.tsx:41`
   citation pointed at then-uncommitted work. The load-bearing claim
   (`set-client-plan.js:116`) is committed code and stands regardless.
6. **Untracked, and this is load-bearing.** Packets `003`, `004`, `005` and
   `docs/qa/plans-divergence-b1.md` are untracked, and
   `docs/arch/activation-path.md` has B1's uncommitted amendment. Until they are
   committed, a fresh session cannot cold-start from them per AGENT-OS §4, and
   committed state misrepresents the initiative. That is exactly what produced
   the false claim in item 1.

### Priority backlog

Rewritten 2026-07-26 23:10 against the full commit history of the day and every
artifact on disk. Ordered by exposure, then revenue, then everything else. The
top two are live and reachable by anyone on the internet right now.

> **UPDATE 2026-07-28: the first Live exposure item below is CLOSED and the
> entry is stale.** `6accc67` shipped the gate; the migration was applied
> 2026-07-27 and the whole chain is verified end to end. Anonymous `POST` to
> `schedule-collections`, `expire-plan-grants` and `ping-sitemap` returns `401`;
> the two deleted functions answer identically to a name that never existed
> (Netlify returns `400 Bad request, missing form`, not `404` — the criterion's
> expected code was wrong, the outcome was not). `cron.job` holds five active
> jobs, `public.job_runs` is filling (`schedule-collections` 17 consecutive
> `ok = true`), and all 17 runs land at minute `:10`, none at `:00`, so Netlify's
> old schedule is confirmed not double-firing. Review:
> `docs/qa/scheduled-function-auth-012-review.md`, verdict PASS WITH FINDINGS.

| (scheduled-function auth) | bg-verify | `docs/qa/scheduled-function-auth-012-review.md` | **COMPLETE 2026-07-27, verdict PASS WITH FINDINGS** |

#### Decision 2026-07-28: Google Indexing API dropped, indexing goes manual

`GOOGLE_JSON_KEY` is **not being restored.** A service account was re-created and
Search Console re-authorised on 2026-07-28, but the Netlify deploy hit the same
4KB Lambda env-var ceiling that caused the original deletion. Constantin's call:
drop it, submit URLs by hand via Search Console's URL Inspection tool instead.

The reasoning that made this cheap, from `_indexing.js:11-14`, which is honest
about it: Google documents the Indexing API as supported **only** for JobPosting
and BroadcastEvent pages. Every BrandGEO page is blog, comparison, industry or
city research, so Google returns a real `200` with no documented crawl benefit.
The service-account JSON costs ~2.3KB of a 4KB budget for that.

**Consequences, all live, none yet fixed in code:**

1. `ping-sitemap` fails every day at 05:10 UTC with
   `{"stage":"google_auth","error":"NO_CREDENTIALS"}`. Permanent `ok = false`
   noise in `job_runs`, which erodes the exact observability packet `012` just
   built. Cheapest stopgap is one line, and it is reversible:
   `SELECT cron.unschedule('ping-sitemap');`
2. **IndexNow is dark as collateral damage and should not be.**
   `ping-sitemap.js:120-126` returns `500` at `createGoogleIndexer()` before
   IndexNow is ever called, and the loop at `:131-133` awaits `indexer.publish()`
   first. IndexNow needs no Google credential, acts on arbitrary URLs, reaches
   Bing/Yandex/Seznam/Naver, costs ~32 bytes of env, and its verification file is
   live (`getbrandgeo.com/b857aee5749c1fb84e8cf6b220793454.txt`, `200`, 32 bytes).
   It has been down since 2026-07-19 for no reason of its own.
3. `force-index.js` reads the same variable, so the in-product manual tool is
   dead too. "Manual" now means Search Console by hand, not that endpoint.
4. 22 sitemap URLs are unsubmitted (`sitemap_pings` last wrote 2026-07-19
   05:07 UTC, 57 rows). These are the 20 US city pages plus two.

> ✅ **CLOSED. Items 1 to 4 above are STALE and were already fixed by `933dd6a`
> (2026-07-28), which this file never recorded.** Verified independently against
> production on 2026-07-29, not taken from the commit message:
>
> - `job_runs` for `ping-sitemap`: **2026-07-28 05:10 `ok=false`**
>   `{"error":"NO_CREDENTIALS","stage":"google_auth","changed":22}`, then
>   **2026-07-29 05:10 `ok=true`**
>   `{"pinged":22,"indexnowOk":22,"googleOk":0,"google_skipped":"NO_CREDENTIALS"}`.
>   The last run under the old code failed, the first under the new code
>   succeeded.
> - `sitemap_pings` is at **79 rows** (was 57), `last_pinged_at` 2026-07-29
>   05:10 UTC, and **22 rows written in the last two days** — exactly the 22
>   stuck URLs.
> - `cron.job` id 5 `ping-sitemap` `10 5 * * *` is `active = true`. It was never
>   unscheduled, so the suggested `cron.unschedule` stopgap was never needed.
>   To pause it in future use `cron.alter_job(job_id => 5, active => false)`,
>   NOT `cron.unschedule`, which deletes the row.
>
> Google is now optional at all three touch points, IndexNow runs and is
> reported independently, and a Google-absent run is a SUCCESS rather than a
> logged failure.
>
> **A cycle was wasted on this**: an agent was dispatched on 2026-07-29 to build
> a fix that already existed, because this backlog entry was believed over the
> commit history. Check `git log -- <file>` before briefing any backlog item in
> this file.
>
> **One real gap remains, worth a decision.** `job_runs.ok` is `true` whenever a
> submitter was merely CONFIGURED, even if every submission failed. It does not
> distinguish "pinged 22 URLs" from "pinged 0". `pinged` / `indexnowOk` in
> `detail` carry that signal; `ok` does not. Only a both-credentials-absent run
> returns 500. That undercuts the observability packet `012` was built for.

**Still open, owner `bg-backend`:** R1, `collection-worker-background.js:35-43`
fail-open, latent not live (Constantin confirmed `INTERNAL_AUDIT_KEY` IS set in
Netlify 2026-07-28).

#### Live exposure

- [ ] **All five scheduled Netlify functions accept an unauthenticated public
      POST and do real work.** `docs/qa/deploy-pipeline-netlify.md` F1, escalated
      to Opus by that audit and re-confirmed here from source: none of
      `expire-plan-grants.js`, `purge-old-results.js`, `purge-old-audits.js`,
      `schedule-collections.js` or `ping-sitemap.js` calls `requireAuth`, wraps
      itself in `schedule()`, or checks any secret. The only thing protecting
      them is that the URL is not advertised. Consequences if hit:
      `purge-old-results` and `purge-old-audits` DELETE rows,
      `expire-plan-grants` reverts customer plans to Free and emails them,
      `schedule-collections` enqueues collection runs and spends LLM budget.
      **DESIGNED 2026-07-27, NOT YET BUILT.**
      `docs/arch/scheduled-function-auth.md` is the binding architecture and
      packet `010` is READY for `bg-backend` on Opus. Ruling: Netlify's
      scheduled-invocation signal is a `POST` body `{"next_run": "..."}` with no
      signature and no secret, so it is **not a credential** and cannot be gated
      on. The shared secret wins, which forces the caller to change, because
      Netlify's scheduler cannot attach a custom header. **Supabase `pg_cron`
      becomes the scheduler.** It was already installed (1.6.4) and
      `cron.job_run_details` shows jobid 1 succeeding within 210ms of 03:00:00
      UTC for 12 consecutive days, and unlike Netlify its history is queryable by
      any agent. Two of the five are pure SQL and get **deleted, not gated**:
      `purge-old-results.js` is fully redundant with that existing pg_cron job,
      which has been running the identical 24-month `ai_results` delete on the
      identical schedule, undetected. Surface drops five endpoints to three and
      both service-key `DELETE` endpoints stop existing. **Do not migrate to the
      `schedule()` wrapper**: same platform mechanism, no credential gained, and
      it would force a CommonJS to ESM conversion on functions that delete rows
      and email customers (arch §3.2).
      **Prerequisites are DONE** (2026-07-27): `pg_net` 0.20.3 enabled with
      `net.http_post` signature confirmed and its functions in schema `net`, not
      `extensions`; `cron_secret` in Supabase Vault verified as 64 lowercase hex;
      `CRON_SECRET` set in Netlify. Sequencing is load-bearing and is arch §8:
      apply the migration while the functions are **still ungated**, verify in
      SQL, and only then ship the gating deploy. A fail-closed gate deployed
      ahead of the secret breaks every job at once.
- [ ] **Correction to `deploy-pipeline-netlify.md` §5.2 and F1(b): the Netlify
      schedules probably ARE firing.** That audit inferred non-registration from
      five `200` responses. Checked 2026-07-27: `sitemap_pings` records a write at
      **2026-07-19 05:07 UTC**, inside `ping-sitemap`'s `0 5 * * *` slot. The
      silence since is not evidence of anything, because `ping-sitemap.js:79`
      throws at `createGoogleIndexer()` and returns before any row is written
      (`:82`), so nothing has been recorded since the Google credential broke.
      Evidence for, not proof: the database records the effect, not the caller.
      The consequence is that in this project a toml-declared scheduled function
      appears to be **both scheduled and publicly HTTP-invokable**, contradicting
      Netlify's own documentation, which is why the design deliberately does not
      depend on the platform gate.
- [ ] **Files never meant to be public are live in the cPanel docroot.**
      `docs/qa/deploy-pipeline-cpanel.md` F1, confirmed over HTTP, owner
      `bg-web`. F3 is adjacent and latent: `deploy-secret.php` sits inside the
      public docroot with no deny rule, so it is one PHP misconfiguration away
      from serving the webhook secret as text.

#### Revenue

- [ ] **Run packet `008`: the onboarding plan coercion.** `bg-backend` on Opus,
      then `bg-verify`. `onboard-client.js:44` `VALID_PLANS` is a FOURTH hardcoded
      copy of the ladder, missing `growth` and `growth_pro`, and line 67 coerces
      instead of rejecting: `VALID_PLANS.includes(plan) ? plan : 'essentials'`.
      `Onboard.tsx:242` offers the real ladder from `PLAN_ORDER`, so a client
      onboarded on Growth (€299) or Growth PRO (€449) is silently provisioned
      with Essentials (€99) entitlements and no error is raised anywhere. Broader
      than the `_plans.js` C1 defect that `f6deb01` closed, which covered only
      `growth_pro` and only via `set-client-plan.js`.
      **Detection caveat, load-bearing:** affected rows cannot be found in
      Supabase. A coerced row reads `essentials` and is identical to a genuine
      Essentials customer, and `onboard-client.js` writes no `client_events` row
      (unlike `set-client-plan.js:166`). Finding victims requires cross
      referencing Stripe subscriptions against `clients.plan`. Constantin ran that
      comparison 2026-07-26; **the result was never recorded.** Record it in
      packet `008` before closing it.
- [ ] Create the Stripe price and checkout link for Growth PRO. `f6deb01` made the
      tier assignable by an admin, so this is the only remaining reason it cannot
      be bought self-serve. External dependency; sequencing is `bg-strategy`'s per
      `activation-path.md` §5.5.
- [ ] Wire promotions to Stripe coupons and redemption at checkout. Table and
      admin CRUD exist as of `3dadd8b` and the migration is applied; nothing
      prices or discounts anything yet, by design
      (`PRICING-STRATEGY-2026-07.md` §8).

#### Review debt on work already shipped

- [ ] **Retroactive `bg-verify` on `b6d4038` (view as current user).** It shipped
      without the independent review its own backlog entry required, and it is
      auth adjacent. Check the stated invariant holds everywhere: presentation
      only, `isRealAdmin` never weakened, no token minted or swapped, no
      server-side check softened, impersonated state continuously visible.
- [ ] **Retroactive `bg-verify` scoped to `3dadd8b` (promotions).**
      `promotions-admin.js` holds the service key behind
      `requireAuth({ adminOnly: true })` and that gate has never been tested with
      a real viewer token; the live 401 only proves it rejects a MISSING token,
      the weaker test. Also covers the three applied RLS policies and an
      independent close on `SECURITY-AUDIT.md` F1's `role` provisioning path.
      `34e41bb` does NOT need this: B1 treated `planConfig.ts` as its subject and
      confirmed `_cost.js` matches it, so ordering was violated but coverage was
      not.
- [ ] **Close the A branch gap.** `bg-web` shipped `801732c` plus four follow-ups
      with no copy stage and no verification stage, so this is a review and copy
      pass over live pages, not a build. Sequence: run `landing-page-optimizer`
      against the live homepage first, since it produces the evidence the other
      two stages need, then `bg-copy` against its ledger, then `bg-verify` (A4).
      Note `docs/design/homepage-hook.md` §2 already measured the page as FAILING
      the three-second test at 1280x800, and §12 recorded seven defects of which
      F6 and F7 were never assigned. The optimizer should try to REFUTE those
      rather than inherit them; two audits today earned their keep that way.

#### Deploy pipeline hardening

- [ ] **Deploy success is unobservable from outside the cPanel server**
      (`deploy-pipeline-cpanel.md` F2, High, owner `bg-backend`). GitHub returns
      202 whether or not the copy worked, so the webhook delivery list proves
      nothing. F4 is the same gap one level down: nothing records which
      acknowledgement branch fired.
- [ ] **Pushes over 20 commits silently under-deploy** (`deploy-pipeline-cpanel.md`
      F5). GitHub caps the webhook payload's `commits[]`, so files changed in the
      overflow never reach the docroot and nothing reports it. F6, self-overwrite
      with no guard, is recorded alongside it.
- [ ] **All 23 `_` prefixed helpers are deployed as public function endpoints**
      (`deploy-pipeline-netlify.md` F2). Low severity, confirmed here: `_auth.js`,
      `_cost.js` and `_plans.js` export no handler, so the endpoints do nothing.
      But **`CLAUDE.md` §4.6 states the `_` prefix stops Netlify exposing them,
      and that is false.** Correct the guardrail text so nobody relies on it.
- [ ] **Three functions call external APIs on the inherited 10s timeout**
      (`deploy-pipeline-netlify.md` F3), while comparable functions in
      `netlify.toml` were deliberately given 26s. Owner `bg-backend`.
- [ ] **Two packets share id `006`**: `006-bg-backend-to-bg-verify-plans-drift.md`
      and `006-bg-orchestrator-to-bg-verify-deploy-cpanel.md`. Exactly the
      collision the numbering rule exists to prevent. Renumber one and record the
      rule: ids are allocated when a packet is written, never reserved inside an
      artifact.

#### Product quality

- [ ] **`bg-design` spec for contrast and first-run**, then `bg-app` builds it.
      Both from the 2026-07-26 dashboard audit, both measured: side panel vs
      canvas **1.07:1** (border 1.31:1), active nav tab differs from inactive by
      **1.24:1** text and 1.17:1 background with the whole active state resting on
      one 3px rail, and the time-filter bar is worse at **1.39:1** with no rail.
      WCAG 1.4.11 wants 3:1. First-run: a zero-data tenant sees "0% AI VISIBILITY
      SCORE" across all six dimensions and AI Visibility calls an unmeasured brand
      "Needs Work", so the product issues a verdict before it has data.
      `/sentiment` at zero data renders 0 buttons and 0 links, an absolute dead
      end. Census: 52% reachable, 24% dead ends, five of six hit on day one.
- [ ] **Engine palette is broken twice over** (audit §Amendment 4, validated with
      `dataviz`'s validator, not by eye). Claude `#f97316` vs Meta `#f59e0b` is
      ΔE **9.6** normal vision against a floor of 15, and 3.4 for tritanopia, and
      they co-render on the `/sentiment` and `/mentions` filter chip rows. Grok
      `#94a3b8` fails the chroma floor and reads as a disabled series. Deeper
      problem underneath: `#10b981` means ChatGPT AND Positive, `#ef4444` means
      Google AI Mode AND Negative AND a categorical series. One hue, three
      meanings, so this is a token-semantics fix, not a recolor.
      `Competitors.tsx:258` carries a fourth independent palette assigned by
      array index.
- [ ] **Light mode is UNAUDITED** (~60 `!important` overrides in `index.css`).
      The dashboard audit could not exercise it because doing so mutates a
      persisted preference.

#### Decisions owed

- [ ] **Decide how the pricing mode switch behaves below 640px.** It is the cause
      of 123px of real horizontal scroll on the homepage at 375 CSS px, measured
      2026-08-02 with an actual scroll attempt, not a `scrollWidth` comparison.
      `.mode-switch` is `flex-wrap: nowrap` around two `.mode-btn` of 221px and
      233px inside a 320px wrapper. Three fixes and each reads differently:
      stack them vertically, shrink the type, or drop `white-space: nowrap` and
      let each button wrap internally. Owner `bg-design`, then `bg-web`. The
      same pass should take `.footer-grid`, which does not collapse at 768px and
      adds 53px there.
- [ ] Decide whether `PLAN_PROMPTS` is enforced server-side or stays display-only
      (`activation-path.md` §5.4).
- [ ] Decide whether `free` clients get a non-manual `refresh_cadence`, a spend
      decision against a €0.30 monthly budget (`activation-path.md` §5.3).
      Blocked in practice until the scheduled-function exposure above is settled,
      since that is the same code path.

#### Hygiene

- [ ] **Confirm the Promotions panel renders for an admin** on the live Account
      page: the amber "backend isn't deployed yet" banner should be gone and
      replaced by "No promotions yet." plus a New promotion button. Everything
      either side of that call is verified; this last hop needs an admin login,
      which no agent has.
- [ ] Write a migration file for `clients.plan` in `db/`. The column was created
      ad hoc and is the only column on `clients` with no migration on disk, which
      is what made V1 unverifiable from source. No CHECK constraint exists on it
      (confirmed 2026-07-26), so this is hygiene, not a live defect.
- [ ] Commit or discard the last untracked items: `docs/audit/`,
      `docs/linkedin-posts-2026-07-24.md`, and the modified
      `.claude/agents/README.md`. Everything else is now committed.
- [ ] Refresh `docs/STATE-OF-PRODUCT.md` §4.1, stale on collection architecture.
- [ ] Reconcile §5's task list (#1 to #97) and §7 against reality; much of it
      predates the 2026-07 work.
- [ ] Sonnet 5 / Opus 4.8 hybrid model migration in the collection functions.
- [ ] Shared authentication / SSO with TalentWeLove and RecruiterAI portals.

Closed 2026-07-26:
- ~~Growth PRO unassignable (`_plans.js` C1 to C4).~~ `f6deb01` shipped and is
  pushed. `growth_pro` is assignable in production. Reviewed in
  `docs/qa/plans-drift-fix-006.md`, verdict PASS WITH FINDINGS, all seven of
  packet `005`'s acceptance criteria met and B1's harness reproduced independently.
- ~~The cPanel 10 second webhook ceiling.~~ **CONTRADICTED by measurement** up to
  20 files per push (`deploy-pipeline-cpanel.md` F7): 59 pages deployed in
  batches of 2, 5, 12, 20 and 20, all verified live byte for byte. The batch that
  previously returned 504 and copied nothing now completes in about a second. The
  real limit is the 20-commit payload cap, filed as F5 above.
- ~~"View as current user" spec'd but not built.~~ `b6d4038`. Needs the
  retroactive review filed above.
- ~~Untracked packets and QA artifacts.~~ `695d3f7` committed the outstanding
  packets, QA artifacts and the `dashboard-auditor` agent.
- ~~Dashboard plan ladder vs marketing site pricing mismatch.~~ `34e41bb`, live;
  the served bundle no longer contains €900.
- ~~Promotions panel had no backend.~~ `3dadd8b`; migration applied and verified.
- ~~Confirm cPanel re-upload of `index.html` + `site.js` (CSP fix landing).~~
  Verified live, see Deploy pipelines above.
- ~~Scheduled background triggers for engine evaluation runs.~~ Built, but see the
  exposure and the unproven cron registration at the top of this list before
  treating them as working.
- ~~Logo is not clickable, scroll carried across routes, viewer blank on
  `/usage`.~~ All `2e7f048`, verified on the deployed bundle. Note for whoever
  touches scroll next: react-router's `<ScrollRestoration>` is NOT usable here,
  it requires a data router and this app mounts `BrowserRouter`, and the scroll
  container is `<main>`, not the window.
- ~~Em and en dashes across the marketing site.~~ Removed in `c9a2451`, `3a8e3d5`,
  `cc45220`, `bf009ea`, `a896349`.

### Four §7.1 claims REFUTED by measurement 2026-07-26 — do not re-file

The dashboard audit (`docs/qa/dashboard-audit-2026-07-26.md`) measured these and
found nothing to fix. §7.1 below is stale on all four; re-filing any of them burns
a build cycle.

1. **"Overview renders light-themed."** False. `documentElement.className` is `""`
   and body measures `rgb(10,15,30)` on all 12 routes.
2. **"Overview chart overflows its container."** False. A real horizontal scroll
   was attempted; `scrollX` never moved, and `docScrollW === innerWidth` at both
   1280 and 375. `scrollWidth` alone is not evidence — ancestor-clipped decorative
   elements are intentional.
3. **"Cards are flat with no elevation."** False. 163 of 164 cards carry a
   computed box-shadow (`index.css:269` to `:286`).
4. **"Teal used for active states."** False. Zero `teal-` occurrences in
   `AIVisibility.tsx` or `Prompts.tsx`.

Also corrected: the scrollbar IS styled and passes contrast at 4.01:1, and
`motion` v12 is Framer Motion under its current package name with
`MotionConfig reducedMotion="user"` already wired at `App.tsx:88`.

Role gating came out better than expected: all twelve privileged Netlify functions
enforce `requireAuth({ adminOnly: true })` server-side against `user_profiles.role`
— no surface hides a link and relies on that hiding for protection.

Largest thing the audit could NOT reach: **light mode** (~60 `!important`
overrides in `index.css`), untouched because exercising it mutates a persisted
preference. Treat light mode as UNAUDITED.

### Note on this file's history

On 2026-07-26 a session found `CLAUDE.md` replaced in the working tree by a
65-line stub while the committed version was this 1,268-line document. The stub
was committed in `97b3723`, deleting §0 through §7. That was a mistake and this
file restores them. **Do not truncate this file.** If a section is stale, mark it
stale in place, as done for §2.8 above.

**Confirmed 2026-07-27, this restore is incomplete in a way worth knowing.**
This file used to have sections well past §7 (at least a §9 Content, SEO &
Own-GEO Initiative, a §12 State of Product, a §13 Client Health, and more,
`docs/ROADMAP-2026-07-20.md` cites reading §8, §9, §11, §12, §13, and §18.1
directly). Checked via `git log -- CLAUDE.md`: the commit right before
`97b3723` (`205fb30`, 2026-07-09) is already only 1,268 lines, §0-7, same as
what `97b3723`'s parent shows. So those later sections were never committed at
any point, they only ever existed in an uncommitted working tree between
roughly 2026-07-09 and 2026-07-20, and are gone for good, not recoverable from
git history. The restore in this file's own header only restored what git
had, §0-7, which is genuinely all that git ever had. If those sections matter
going forward, they need to be deliberately rebuilt from what still exists in
`docs/` (`CONTENT-STRATEGY-OVERVIEW.md`, `STATE-OF-PRODUCT.md`,
`CLIENT-HEALTH-BPR.md`, and others cover overlapping ground) as their own
task, and then actually committed this time, not left to accumulate
uncommitted again.

---

## 0. Working Agreement — Read This First

**Session workflow:** one chat session builds exactly one scoped feature or
fix. When it's done and saved, the session ends and the next task starts in
a **fresh chat**. This file is the only thing carried between sessions — a
new chat has no memory of prior chats — so every session must update this
file (task list, architecture, limitations, schema — whichever sections the
change touched) before ending. Reason: long threads force re-reading and
compressing the entire history on every message, which is what burns through
usage limits fastest, not the actual work. Full rule: `rules/session-workflow.md`
(also copied to `.claude/rules/session-workflow.md`).

**Model routing:** within a session, route by task type — Opus 4.8 for deep
reasoning, architecture (e.g. Geo-Agent design), complex/nested debugging,
and security/schema review; Sonnet 5 for the high-volume implementation work
(dashboard UI, response normalization, standard scripting). This governs how
Claude approaches work in this codebase — it is separate from whatever model
the product's own Netlify functions call via the Anthropic API, which is
already configured independently. Full rule: `.claude/rules/hybrid-routing.md`.

**Specificity in hand-offs:** any manual step handed to Constantin (a
command to run, a file to move, a UI to click through) must include the
exact full path, the exact copy-pasteable command, and the exact app/panel —
never "the new folder" or "run npm install" without saying where. Full rule:
`rules/specificity.md`.

**Execution delegation (cost efficiency):** for shell/PowerShell commands,
Supabase SQL, Netlify actions, cPanel uploads, git operations — default to
handing Constantin the exact command/instructions and letting him run it,
rather than Claude spending tool calls to execute it directly. He's offered
to run these himself specifically to reduce token/cost usage. Still fine to
execute directly for cheap read-only checks or genuinely large/repetitive
operations impractical to hand-run. Full rule: `rules/execution-delegation.md`.

**Completion status — never bury a pending action inside "done":** if
finishing a task still requires Constantin to act (upload, deploy, run a
command, approve, connect something), Claude must say so explicitly and
give that action as a numbered, copy-pasteable step-by-step list (per the
Specificity rule above) — never just say "done" and let the action get lost
in the summary. Structure end-of-task status as: Completed / Requires your
action / Still pending. Full rule: `rules/completion-status.md`.

**Parallel task scoping (added 2026-07-08, after a real collision):** when
multiple BrandGEO chats run at once (see the parallel-work window below),
each task must be assigned a non-overlapping `Scope:` (files/folders it
touches) before it starts — check the `Scope:` tags on other in-flight
entries in §5 before picking a task. File-level non-overlap is necessary
but **not sufficient** on its own: `git commit`/`push`/`stash` touch
repo-wide state (`.git/index`) that isn't partitionable by path, so git
commands must also be serialized (one session at a time), independent of
which files each session edited. Full rule: `rules/parallel-task-scoping.md`.

**Temporary parallel-work window (2026-07-08 → 2026-08-12):** Constantin
has extra credits during this window, so multiple BrandGEO chats may run
at the same time instead of strictly one-at-a-time (the usage-limit
reasoning behind the normal one-session rule doesn't apply the same way
while credits are cheap). This does not relax anything above — it's the
condition that makes the parallel-task-scoping rule necessary in the first
place. After 2026-08-12 this window closes; go back to strict
one-chat-at-a-time unless Constantin explicitly extends it.

**Chat naming & kickoff convention** (agreed 2026-07-08 — makes it easy to
find and click into the right conversation in the Cowork "BrandGEO" project
sidebar):

- **Title every new chat:** `#<task-id> · <3–6 word description>` — no
  "BrandGEO" prefix needed since every chat already lives inside the Cowork
  "BrandGEO" project sidebar, so the project name would be redundant.
  - Numbered task → `#99 · Git commit web merge`
  - Ad-hoc/unnumbered work → `<topic> · <YYYY-MM-DD>`, e.g.
    `Restructuring step 2 · 2026-07-10`
  - Set the title by renaming the conversation in the Cowork sidebar (right-click
    the chat → Rename, or the pencil icon next to the title at the top of the
    chat) right after starting it.
- **First message in every new chat** — folder connections do **not**
  automatically carry over to a new chat, even within the same Cowork
  project (confirmed 2026-07-08 — only the folder originally selected for
  the project itself persists; any folder connected mid-session via a tool
  call does not). So every kickoff message must start by having the new
  chat connect the folder itself, then name the task:
  `Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then
  continue BrandGEO — task #<id>: <one-line description, copy from §5 below>.`
  Once connected, this file auto-loads as context, so the rest of the
  message only needs to name the task, not restate the rules.
- **Picking up an old task_id from §5/§6:** open a fresh chat (don't resume a
  finished one), use the kickoff line above, and Claude will read the matching
  entry in §5/§6 for full context before starting.
- **Closing convention (unchanged from Session workflow above):** before the
  chat ends, update §5 (mark the task done or add its follow-ups) and §6 if
  the restructuring plan moved — same as every other session.

---

## 1. Current Architecture

### 1.1 Overview

BrandGEO is a managed AI Visibility & Brand Perception (GEO — Generative Engine Optimization) SaaS. It monitors how well a client's brand appears in answers from multiple AI search engines. The product:

1. Stores **commercial buyer prompts** per client (e.g. "Best catering companies in Bucharest")
2. **Fires those prompts** against real LLM APIs on a schedule or on demand
3. **Analyses responses** for brand mention, position, sentiment, and competitor presence
4. **Displays results** in a React dashboard with engine-level breakdown, mention history, competitor radar, and recommendations

### 1.2 Backend — Three Parallel Netlify Functions per Prompt

Each prompt fires three Netlify functions in parallel. All functions share auth via `_auth.js`.

| Function | Engines | Timeout | Notes |
|---|---|---|---|
| `collect-prompt.js` | Gemini + Perplexity + Meta | 26s | Gemini uses Google Search grounding; Perplexity + Meta via OpenRouter |
| `collect-claude.js` | Claude (claude-sonnet-4-6) | 26s | Streams SSE, aborts after 2500 chars; training-data mode (no web search) |
| `collect-chatgpt.js` | ChatGPT (gpt-5.5) | 26s | Responses API + `web_search_preview` + `user_location` for geo |

**Next model migration:** Moving from `claude-sonnet-4-6` to a hybrid of **Claude Sonnet 5** (high-volume) + **Claude Opus 4.8** (deep analysis) — not yet implemented.

### 1.3 Geo Context Injection

Every function calls `buildSystemContext(cfg, marketLabel, regionLabel)` which:
- Sets a system prompt: `"You are a user based in ${location}. Answer as if you are that local user..."`
- Derives location from: selected market + region (explicit) OR TLD of `brand_website` (fallback)
- ChatGPT additionally passes `user_location: { type: 'approximate', country: marketId, city?: regionLabel }` to the `web_search_preview` tool for native geo routing

Markets are stored as `market_id` (ISO country codes, `WW` for worldwide) and `region_label`.

### 1.4 Response Analysis — `analyseResponse(text, cfg)`

All three collect functions contain a **copy** of the same `analyseResponse` function (see §2 — this duplication is a known limitation). It returns:

```js
{
  brand_mentioned:       boolean,
  brand_position:        number | null,   // 1-based list rank, or null
  sentiment:             'positive' | 'neutral' | 'negative',
  response_snippet:      string | null,   // ~300 chars around first brand mention
  competitors_mentioned: string | null,   // JSON array of { pos, name }
}
```

**Mention detection:**
- Checks `brand_aliases[]` (lowercased) and stripped aliases (no spaces/dashes) against response text
- Checks `brand_website` domain (stripped of protocol/www)
- `matchesAlias(segment, aliases, aliasesStripped, website)` is the core fn

**Competitor extraction:**
- Regex: `/(?:^|\n)[^\d\n]{0,6}(\d+)[.)](?:\*{0,2})\s+([^\n]{2,120})/gm` — captures numbered list entries
- `NOT_A_COMPANY` filter rejects Romanian + English descriptive phrases (not brand names)
- Secondary pass: `scanForKnownCompetitors()` catches known competitors mentioned in prose

**Position detection:**
- Numbered list rank if brand appears in list → `brandInList.pos`
- Else sentence index via `detectListPosition()`

### 1.5 Frontend — React (Vite + Tailwind)

**State management via React Context:**

| Context | File | Provides |
|---|---|---|
| `ClientProvider` | `src/lib/clientContext.tsx` | `activeClientId`, `activeClient`, `clients[]`, `isAdmin`, `engineStates`, `activeEngines`, `setClientEngineOverride` |
| `CollectionProvider` | `src/lib/collectionContext.tsx` | `collecting`, `progress`, `lastCompletedAt`, `runCollection`, `runSinglePrompt`, `stopCollection` |
| `MarketContext` | `src/lib/marketContext.tsx` | `selectedMarkets`, `setSelectedMarkets` |
| `TimeFilterContext` | `src/lib/timeFilterContext.tsx` | `timeFilter` (7d/30d/90d/all) |
| `I18nContext` | `src/lib/i18nContext.tsx` | `lang`, `t()` translation function |

**Key pages:**

| Route | Component | Purpose |
|---|---|---|
| `/` | `Dashboard.tsx` | Overview stats + recent activity |
| `/ai-visibility` | `AIVisibility.tsx` | Engine cards, prompt table, Fix This hub |
| `/sentiment` | `BrandSentiment.tsx` | Sentiment score (0-100), positive/neutral/negative breakdown, per-engine chart, trend over time, filterable response feed — driven from `ai_results` where `brand_mentioned = true` |
| `/competitors` | `Competitors.tsx` | Competitor radar + trend chart |
| `/prompts` | `Prompts.tsx` | CRUD for commercial buyer prompts |
| `/recommendations` | `Recommendations.tsx` | AI-generated action items |
| `/usage` | `Usage.tsx` | Admin cost estimator (OVERHEAD_MULTIPLIER = 1.5) |
| `/onboard` | `Onboard.tsx` | Multi-step client onboarding wizard |
| `/signup` | `Signup.tsx` | Self-serve signup page |

### 1.6 Auth & Security

- **Frontend auth:** Supabase anon key + RLS; JWT stored by Supabase client
- **Netlify functions:** All protected by `_auth.js` — verifies JWT, origin whitelist, role, client ownership, rate limit (150 rows/hr/client)
- **Origin whitelist:** `https://app.getbrandgeo.com`, `http://localhost:5173`, `http://localhost:3000`
- **User roles:** `admin` (full access, all clients) / `viewer` (own client only)
- **Rate limit:** 150 `ai_results` rows per client per hour — protects against runaway collection

### 1.7 Plan-Based Engine Gating

Defined in `src/lib/planConfig.ts`:

| Plan | Engines |
|---|---|
| `free` | ChatGPT |
| `essentials` | ChatGPT, Gemini, Claude |
| `managed` | + Perplexity, Google AI |
| `pro` / `enterprise` | + Meta, Copilot, DeepSeek, Grok |

`COMING_SOON_ENGINES = ['google_ai', 'copilot', 'deepseek', 'grok']` — never collected, always show as coming soon.

Admin can override per-engine via `clients.engines_enabled` JSONB (sparse map, `false` = disable even if plan allows).

`getEngineStates(plan, enginesEnabled)` → `Record<EngineId, 'active' | 'coming_soon' | 'locked'>`

### 1.8 Error State Architecture (implemented in #95–#97)

When an API call fails (quota, auth, network), collect functions store an error row instead of silently skipping:

```js
// On error:
{ status: 'error', error_code: 'quota_exceeded' | 'api_error' | 'auth_error', brand_mentioned: false }

// On success:
{ status: 'ok', brand_mentioned: ..., sentiment: ..., ... }
```

Skip check for non-force runs: `.neq('status', 'error')` — so error rows don't block retries.

Dashboard `AIVisibility.tsx` derives engine state:
- **UNAVAILABLE**: `errorEngines.has(id) && checked === 0` — grey card, "Temporarily unavailable", AlertTriangle icon
- **Mixed** (some ok, some errors): shows normal stats from ok rows; error rows ignored for %

Force Refresh deletes ALL rows (including error rows) before re-collecting.

---

## 2. Current Limitations

### 2.1 `analyseResponse` Duplication
> ⚠️ **STALE, verified 2026-07-29. This limitation no longer exists.** The
> extraction happened: `analyseResponse` is defined exactly once, in
> `netlify/functions/_analysis.js:738` (exported at `:874`), and is required by
> `_collect.js`, which the three HTTP collectors are now thin wrappers over.
> `grep -c "^function analyseResponse"` returns 0 for `collect-prompt.js`,
> `collect-claude.js` and `collect-chatgpt.js`, and 1 for `_analysis.js`. The
> paragraph below describes the pre-`_collect.js` architecture.

The full analysis function is **copy-pasted** into all three collect functions (`collect-chatgpt.js`, `collect-claude.js`, `collect-prompt.js`). Changes must be made in three places. **Fix:** extract to a shared `_analysis.js` helper (not yet done).

### 2.2 Netlify Hard Timeout (26s)
All collect functions run at the 26s Netlify limit. gpt-5.5 with web search can take 20–25s. If the response arrives at 25.9s, the function times out and nothing is saved — no error row is stored either (timeout kills the process). This is a structural limitation of the serverless model.

### 2.3 Claude Streaming Early Abort
`collect-claude.js` reads the SSE stream and aborts after **2500 characters** of accumulated text. This is sufficient for brand mention detection but means competitors mentioned later in a long Claude response are missed.

### 2.4 Regex-Based Mention Extraction
`analyseResponse` uses regex on raw text. It works well for numbered lists but can miss:
- Brand mentions inside tables or markdown blocks
- Mentions buried 3000+ chars into a response (Claude early abort)
- Multi-word brands with unusual spacing or diacritics

### 2.5 No Caching Layer
Every collection run hits LLM APIs directly. No semantic deduplication — if the same prompt fires for two markets, two separate API calls are made. At 1000 clients this will be expensive.

### 2.6 `analyseResponse` Sentiment is Keyword-Based
Sentiment is detected by simple word lists (`posWords`, `negWords`). No LLM-based sentiment analysis on the response text.

### 2.7 OpenRouter as Single Point of Failure for Perplexity + Meta
Both Perplexity and Meta AI are routed through OpenRouter. If OpenRouter credits run out, both engines fail simultaneously.

### 2.8 No Scheduled Collection
> ⚠️ **STALE as of 2026-07-26. This limitation no longer exists.** A collection
> queue, `collection-worker-background`, and an hourly `schedule-collections`
> cron are all live. The cron is inert only because `refresh_cadence` defaults to
> `manual`. See CURRENT STATE above.

Collection is manual (dashboard "Run Collection" button) or triggered post-onboarding. There is a `purge-old-results` scheduled function (3am daily) but no scheduled collect.

### 2.9 `collect-prompt.js` Gemini Fallback Chain
Gemini tries `gemini-2.5-flash-preview-05-14` → `gemini-2.0-flash` → without Google Search grounding. Fallback is silent — logs exist but the dashboard can't tell which model actually ran.

---

## 3. Database Schema

### Table: `clients`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial PK` | |
| `name` | `text` | Display name |
| `slug` | `text UNIQUE` | URL-safe identifier |
| `plan` | `text` | `free \| essentials \| managed \| pro \| enterprise` |
| `engines_enabled` | `jsonb` | Sparse override map `{ "meta": false }` |
| `brand_name` | `text` | Primary brand name |
| `brand_aliases` | `text[]` | All names to detect (incl. short forms) |
| `brand_website` | `text` | Used for domain matching + TLD-based geo fallback |
| `known_competitors` | `text[]` | Pre-seeded competitor list for prose scanning |
| `default_market_id` | `text` | ISO country code or `WW` |
| `created_at` | `timestamptz` | |

### Table: `user_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | References `auth.users.id` |
| `role` | `text` | `admin \| viewer` |
| `client_id` | `int FK` | References `clients.id`; null for admin |
| `created_at` | `timestamptz` | |

### Table: `prompts`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial PK` | |
| `client_id` | `int FK` | Multi-tenant FK |
| `text` | `text` | The full prompt text |
| `category` | `text` | `mid \| large \| very_large \| general \| tool_discovery \| geo_category \| problem_based \| direct_brand` |
| `is_active` | `boolean` | Whether to include in collection runs |
| `position` | `int` | Display sort order |
| `created_at` | `timestamptz` | |

### Table: `ai_results`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial PK` | |
| `prompt_id` | `int FK` | References `prompts.id` |
| `client_id` | `int FK` | Denormalized for fast filtering |
| `llm` | `text` | `chatgpt \| gemini \| claude \| perplexity \| meta \| google_ai \| copilot \| deepseek \| grok` |
| `brand_mentioned` | `boolean` | |
| `brand_position` | `int` | Rank in numbered list (1-based), or null |
| `sentiment` | `text` | `positive \| neutral \| negative \| none` |
| `response_snippet` | `text` | ~300 chars around first brand mention |
| `competitors_mentioned` | `text` | JSON string: `[{ pos, name }]` |
| `checked_at` | `timestamptz` | When the API call completed |
| `status` | `text DEFAULT 'ok'` | `ok \| error` — added in migration #95 |
| `error_code` | `text DEFAULT NULL` | `quota_exceeded \| api_error \| auth_error` — added in migration #95 |

**Index:** `idx_ai_results_status ON ai_results(status)`

**Migration SQL (#95):**
```sql
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS error_code TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_results_status ON ai_results(status);
```

### RLS Policy Pattern
All tables use Row Level Security. Service key (in Netlify functions) bypasses RLS. Anon key (frontend) is governed by policies that check `auth.uid()` via `user_profiles.client_id`.

---

## 4. Coding Guardrails

### 4.1 Scalability Rule
**Every solution must scale to 1,000 clients with diverse needs.** No hardcoded client names, no per-client branching in shared code, no "quick patches" that assume a single tenant. Always use `client_id` FK, `client_config` objects, and plan-based gating.

### 4.2 Violet Brand Theme
The dashboard uses a **violet theme** throughout (replaced the old teal). Never revert to teal/green as a primary brand color.

Key color tokens:
- Primary: `violet-500` / `#8b5cf6`
- Accent: `violet-400`, `violet-600`
- Backgrounds: `bg-slate-900` (page), `bg-slate-800` (card), `bg-slate-700` (elevated)
- Text: `text-white` (primary), `text-slate-300` (secondary), `text-slate-500` (muted)
- Error/unavailable: `bg-slate-700/60 text-slate-400 border-slate-600/40`

Engine logo colors (from `ENGINE_META` in `planConfig.ts`):
- ChatGPT: `text-emerald-400`
- Gemini: `text-blue-400`
- Claude: `text-purple-400`
- Perplexity: `text-cyan-400`
- Meta AI: `text-amber-400`

### 4.3 Tailwind Usage
- Tailwind CSS only — no custom CSS classes unless in `index.css` for global resets
- Use Tailwind's `bg-{color}/{opacity}` pattern for translucent cards (e.g. `bg-violet-500/10`)
- Dark-mode only — no light mode exists; never add `dark:` prefixes
- Responsive classes: `md:`, `lg:` for layout breakpoints; mobile-first

### 4.4 TypeScript Patterns
- All shared types in `src/types/index.ts` — add new fields there, not inline
- `LLMName` union type must match the exact strings stored in `ai_results.llm`
- Optional fields on interfaces: `field?: Type` — don't use `| undefined` explicitly
- Never cast `as any` — use proper type guards or optional chaining

### 4.5 React Context Rules
- App-level state lives in Context providers (see §1.5)
- Never fetch Supabase directly in a page component if a context already provides that data
- Use `useCallback` for functions passed down as props or stored in context
- `lastCompletedAt` in `CollectionContext` is the signal to reload data — watch it with `useEffect`

### 4.6 Netlify Functions
- All functions must call `requireAuth(event)` first and return `auth.response` if present
- Never expose `SUPABASE_SERVICE_KEY` to the frontend — server-side only
- Use `createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)` inside functions, not the anon client
- Shared utilities: prefix with `_` (e.g. `_auth.js`) so Netlify doesn't expose them as endpoints
- Log format: `[FunctionName/invId] message` for traceability

### 4.7 No Mock Data in Production
`isDemoMode` (from `src/lib/supabase.ts`) gates mock data — it's only active when `VITE_SUPABASE_URL` is missing or placeholder. Never add mock data to code paths that run in production.

### 4.8 Supabase Queries
- Filter by `client_id` on every query — never fetch all rows across tenants
- Use `.neq('status', 'error')` on `ai_results` queries that should exclude API-failure rows
- Use service key in functions, anon key + RLS in frontend
- `user_profiles` is the source of truth for role and client_id

### 4.9 Collection Architecture Rules
- `collectionContext.tsx` fires 3 parallel fetches per prompt (`collect-prompt`, `collect-claude`, `collect-chatgpt`)
- `active_engines` array in the POST body tells `collect-prompt` which engines to run (Gemini/Perplexity/Meta only — Claude and ChatGPT have dedicated functions)
- Force collect: caller first deletes all existing rows for the prompt, then fires all 3 functions with `force: true`
- Non-force: each function checks for existing ok rows this month and skips if present
- `setLastCompletedAt` fires at: immediately after each prompt + 15s + 40s (catches late gpt-5.5 saves)

### 4.10 Git Workflow
- Single repo root: `C:\Users\const\Constantin Daniel Goane\BrandGEO` — always `git commit` from here (moved from `C:\Users\const\Desktop\BpR` in step 8, see §6.4)
- Dashboard code: `brandgeo-dashboard/`
- Website files: `brandgeo/web/` + `brandgeo-signup/`
- Dashboard deploys automatically to Netlify on push to main
- If Netlify skips ("no content change"), use Force Deploy from the Netlify UI

---

## 5. Full Task List (#1–#97)

### Completed

- **#1** Fix Gemini (google-genai) and Perplexity (model name)
- **#2** Add competitor extraction to collect_llm_responses.py
- **#3** Enhance AIVisibility dashboard page for demo
- **#4** Build and deploy updated dashboard to Netlify
- **#5** Build Prompt Discovery chat feature in dashboard
- **#6** Fix footer on getbrandgeo.com
- **#7** Add logo + day/night theme toggle to dashboard
- **#9** Fix TypeScript errors in Prompts.tsx and AIVisibility.tsx
- **#10** Build dashboard and deploy to Netlify
- **#11** Git commit and push all changes
- **#12** Replace Grok with Meta (Llama) in all engine lists
- **#13** Fix Competitors tab — make auto-discover actually populate
- **#14** Fix Mentions tab to show actionable value
- **#15** Update Overview competitor seed list to Bucharest catering brands
- **#16** Make Overview classification columns clickable with detail drawer
- **#17** Replace Grok with Meta in types, mockData, AIVisibility, collector
- **#18** Update mockCompetitors to real Bucharest catering brands
- **#19** Fix Competitors auto-discover to also read from ai_results
- **#20** Redesign Mentions tab to show AI engine mention events
- **#21** Make classification breakdown bars clickable with slide-over drawer
- **#22** Build and deploy to Netlify
- **#23** Create blog.html — BrandGEO Research™ index page
- **#24** Create bg-001.html — first research article
- **#25** Create faq.html — FAQ page
- **#26** Update index.html nav + footer + engine strip
- **#27** Create BG-001 LinkedIn asset kit
- **#28** Upload index.html to cPanel
- **#29** Build and deploy dashboard to Netlify
- **#30** Fix Netlify build: commit src/lib/ files that .gitignore is hiding
- **#31** Fix Market selector: flag encoding + add city/region sub-selector
- **#32** Multi-tenant migration: add client_id to Supabase + BrandGEO setup
- **#33** Build client switcher in dashboard for admin users
- **#34** Refactor Dashboard.tsx Overview to use ai_results with client_id filter
- **#35** Replace Bot icon with LLM logos in AIVisibility top cards
- **#36** Make collector multi-client: loop BpR + BrandGEO with per-client config
- **#37** Add sitemap.xml and robots.txt to getbrandgeo.com
- **#38** Fix dashboard login — set password for mobile access
- **#39** Make dashboard fully responsive for mobile
- **#40** Import Meta × BpR (50 responses)
- **#41** Import all Claude batches — BpR + BrandGEO (autonomous run)
- **#42** Add i18n language toggle to dashboard (EN/ES/DE/FR/NL/RO + others)
- **#43** Add regions to Markets selector (Europe, North America, APAC, Oceania, etc.)
- **#45** Extend clients table with brand config columns + seed BpR & BrandGEO
- **#46** Build netlify/functions/collect-prompt.js — on-demand LLM collection
- **#47** Build netlify/functions/onboard-client.js — create client + auth user
- **#48** Build Onboard.tsx — multi-step client onboarding wizard
- **#49** Gap 3: Viewer role restrictions in Prompts.tsx + sidebar
- **#50** Wire up collection runner in AIVisibility + auto-trigger on onboard
- **#51** Save scalability memory rule
- **#52** Multi-market architecture: all 5 files
- **#53** Website homepage redesign — implement in code
- **#54** Dashboard results view — implement AI Visibility Score card + engine grid + Fix This hub
- **#56** Update faq.html — fix engine count, add free audit Q&A, update pricing
- **#57** Create terms.html — Terms & Conditions with pricing and service terms
- **#58** Fix ChatGPT geo: add user_location to web_search_preview
- **#59** Fix Claude: clear error when ANTHROPIC_API_KEY missing + verify beta header
- **#60** Fix Meta: diagnose 0/0 — add logging, verify model ID
- **#61** Add response preview logging for all 5 engines
- **#62** Fix Claude timeout: reduce max_uses to 1, clean up function structure
- **#63** Remove web search from Claude — use training data mode
- **#64** Add per-prompt refresh button to AIVisibility prompt table
- **#65** Create collect-chatgpt.js dedicated function
- **#66** Remove ChatGPT from collect-prompt.js
- **#67** Update collectionContext.tsx to fire 3 parallel functions
- **#68** Add collect-chatgpt timeout to netlify.toml
- **#69** Rewrite Competitors.tsx — ai_results driven, fixed radar
- **#70** Build generate-recommendations.js Netlify function
- **#71** Add AI insights section to Recommendations.tsx
- **#74** Create timeFilterContext.tsx
- **#75** Create Usage.tsx — admin cost estimator
- **#76** Update App.tsx — TimeFilterProvider + Usage route
- **#77** Update Layout.tsx — nav reorder, time filter bar, mobile bottom nav, Usage link
- **#78** Update index.css — theme softening
- **#79** Update Competitors.tsx — trend line chart
- **#80** Git commit and push all changes
- **#81** Rewrite pricing section in index.html
- **#82** Update faq.html pricing references
- **#85** Secure all Netlify functions — JWT auth + origin lock + rate limiting
- **#86** Create signup-client.js Netlify function
- **#87** Create Signup.tsx page
- **#88** Wire signup into App.tsx + Login.tsx + index.html
- **#89** Verify Supabase config requirements
- **#90** Create planConfig.ts — engine/plan/coming-soon map
- **#91** Update clientContext.tsx — add plan/engines_enabled/activeEngines
- **#92** Update AIVisibility.tsx — engine gating UI + admin toggle panel
- **#93** Update collectionContext.tsx + collect-prompt.js — gate collection to active engines
- **#94** Provide SQL + git commands for plan gating feature
- **#95** DB migration: add status + error_code to ai_results
- **#96** Update collect functions to write error states
- **#97** Dashboard: show ⚠ Temporarily unavailable per engine
- **#98** Merge standalone `brandgeo\web\` into `BpR\brandgeo\web\` — one
  canonical website source. Backed up both originals to
  `BpR\legacy\web-snapshots\2026-07-08-standalone\` and
  `...\2026-07-08-bpr-copy\` first. Additive files (`bg-002.html`,
  `bg-003.html`, `bg-004.html`, `cookies.html`, `images\`) copied straight
  in — no conflict. `blog.html` and `bg-001.html` needed real reconciliation
  (BpR-copy had newer dates/branding/pricing but had dropped content found
  only in standalone) — staged both, reviewed with Constantin, confirmed,
  then copied into the live folder. `blog.html` = standalone's full 4-post
  layout + BpR-copy's `<head>` (favicon, Plausible). `bg-001.html` =
  BpR-copy's branding/dates + standalone's "six disciplines" section, plus
  three judgment calls Constantin confirmed: restored hero image +
  og:image/twitter/keywords meta (had been silently dropped), fixed the
  next-post link to `/bg-002.html`, kept the theme-toggle nav for
  consistency with `blog.html`. Live folder now has one reconciled copy —
  see file list in §1.5 note below. **Not yet done:** git commit this into
  the BpR repo (was previously untracked per `.gitignore`'s `!brandgeo/web/`
  exception — verify tracking now that the folder has real content).

- **#72** ✅ **DONE 2026-07-08** — Audited all 11 dashboard pages for bugs/UX
  issues (read-only pass, scoped to findings-only since #83 was running in
  parallel on `Layout.tsx`/`App.tsx`). Full writeup:
  `dashboard-audit-72-findings.md` (repo root). Headline findings: (1) the
  global 7d/30d/90d/All time filter shown on every page is fully decorative
  everywhere except `Usage.tsx` — no other page reads `timeRange`; (2)
  `Onboard.tsx` has its own hand-rolled collection loop that only calls
  `collect-prompt` (Gemini/Perplexity/Meta), silently skipping Claude and
  ChatGPT for every newly onboarded client despite the UI claiming "5
  engines collected"; (3) `marketContext.tsx` defaults any session with no
  saved market to Romania (`MARKETS[1]`, leftover BpR assumption) — violates
  the Scalability Rule for every non-Romanian client; (4) teal is used for
  active/selected states in `AIVisibility.tsx` and `Prompts.tsx`, violating
  the violet-only brand rule (§4.2); (5) `as any` casts in `Dashboard.tsx`
  and `Mentions.tsx`, violating §4.4; (6) i18n coverage is inconsistent —
  only 4 of 11 pages (`Dashboard`, `AIVisibility`, `Prompts`, `Mentions`) use
  `useI18n()`, the other 7 are 100% hardcoded English; (7) `PromptCategory`
  type drift across pages; (8) dead frontend code mirroring the
  already-tracked dead DB tables in #102 (`ScoreBadge.tsx`'s
  `ClassificationBadge`/`GeoScoreRing`, several unused `types/index.ts`
  types). Plus ~10 lower-severity polish items (no confirm-on-delete,
  inconsistent date locales, hardcoded "2026" copyright year, etc.) — see
  the findings file for the full list and a suggested triage order.
  **Not fixed yet** — next session should pick a slice (the findings file
  suggests: time filter first, then onboarding collection gap, then the
  Romania default) rather than fixing everything at once, and should wait
  for #83 to land first since it touches `Layout.tsx`/`App.tsx`.
- **#83** ✅ **DONE 2026-07-08** — Built `src/pages/BrandSentiment.tsx`
  (new file, ~360 lines) at route `/sentiment`. Query: `ai_results` filtered
  to `client_id` + `brand_mentioned = true` (sentiment is only meaningful
  once the brand is actually mentioned — `collect-prompt.js` leaves
  `sentiment: 'neutral'` by default and only scores positive/negative when
  `mentioned` is true, see §1.4/§2.6), respecting the global time filter
  (`getStartDate()`) and `activeEngines` plan gating, same pattern as
  `Usage.tsx`/`Competitors.tsx`. Shows: a 0-100 weighted sentiment score
  card (positive=100/neutral=50/negative=0, averaged) with a label band
  (Mostly Positive/Mixed/Needs Attention/Mostly Negative), positive/neutral/
  negative count+% cards, an overall stacked breakdown bar, a per-engine
  stacked % bar chart (`ENGINE_META` from `planConfig.ts`), a
  weekly/monthly/quarterly trend line chart (3 series, same
  `computeTrend`-style bucketing as `Competitors.tsx`), and a filterable
  "Recent Sentiment Signals" feed (sentiment + engine chips, expandable rows
  with response snippet) reusing `SentimentDot` from `ScoreBadge.tsx` and
  the `Mentions.tsx` expand/collapse pattern. Demo mode derives varied demo
  sentiment (positive/neutral/negative) from `brand_position` since
  `mockAIResults` only ever stores `'positive'`/`'neutral'` — done locally
  in the component, `mockData.ts` itself was not touched. Wired: `/sentiment`
  route in `App.tsx`, nav entry in `Layout.tsx` (desktop sidebar + mobile
  bottom nav, `Smile` icon, placed right after AI Visibility), and
  `nav_sentiment` translation key added to all 8 languages in
  `i18nContext.tsx` (interface + EN/ES/DE/FR/NL/RO/PT/IT blocks).
  **Build verification caveat:** this session's sandboxed Linux shell has a
  proven platform mismatch (`node_modules` was installed on Windows —
  confirmed via an `esbuild` native-binary crash: `@esbuild/win32-x64`
  present, `@esbuild/linux-x64` needed). `npx tsc --noEmit` in that sandbox
  reports 14 cascading JSX "no corresponding closing tag" errors in
  `App.tsx`/`Layout.tsx` — but this **reproduces identically with the new
  `/sentiment` route line removed** (isolated by temporarily reverting just
  that one line and re-running tsc), and also appears in the untouched
  mobile-nav section of `Layout.tsx`, so it's a **pre-existing sandbox/tsc
  quirk, not a real defect** — this exact file structure is already live in
  production at app.getbrandgeo.com. `BrandSentiment.tsx` itself reports
  **zero** tsc errors on its own. Still, **run a real build once from
  Windows before pushing**, since that's the only environment that matches
  the installed `node_modules`: open PowerShell in
  `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard` and
  run `npm run build` — should exit 0 with a `dist\` folder produced. If it
  reports real errors there (unlikely given the isolation test above),
  paste them into the next session before committing.
- **⚠️ Git index corruption found 2026-07-08 — ✅ RESOLVED same day.**
  Mid-session, a `git status` in `brandgeo-dashboard\` returned
  `error: bad signature 0x00000000` / `fatal: index file corrupt`, with a
  leftover `.git/index.lock` — consistent with another session's git
  process touching this repo concurrently (see §6.5 Collision risk; #72's
  audit and #84's website edit were both confirmed running in parallel
  this same session). Constantin fixed it (removed the lock + corrupt
  index, `git reset` to rebuild from `HEAD`) and committed everything in
  one go: **`7f439da` — "Add Brand Sentiment page (#83), site spotlight
  section (#84), audit findings (#72), restructuring rules"** — pushed to
  `origin/main` (0 ahead/behind, confirmed). Verified `BrandSentiment.tsx`
  content in that commit is byte-identical (MD5 match) to what's on disk,
  so nothing was lost or mangled in the recovery. `brandgeo-dashboard/dist/`
  also exists with compiled assets, confirming `npm run build` passed on
  Constantin's machine. No further action needed on this incident — the
  standing prevention rule is `rules/parallel-task-scoping.md` (§0).

### Pending

Each entry below is tagged `Scope:` per the parallel-task-scoping rule
(§0, `rules/parallel-task-scoping.md`) — only launch two of these in
parallel if their `Scope:` lines don't intersect, and never run git
commands from two sessions at once regardless of scope.

- **#44 / #55** Clean up folder structure — consolidate all project locations. **Expanded scope agreed 2026-07-08, see §6 below. All 8 steps are now done — the restructuring is complete.** Old `C:\Users\const\Desktop\BpR` and standalone `brandgeo` were archived (not deleted) to `C:\Users\const\Constantin Daniel Goane\BrandGEO-archives\` in step 8. `C:\Users\const\Constantin Daniel Goane\BrandGEO` is now the one and only canonical project root. Remaining independent cleanup decisions (#100, #101, #102) are tracked separately below and were deliberately left open.
  Scope: none — closed out, no further files touched.
- **#102** ✅ **DONE 2026-07-08** — Legacy single-tenant tables
  (`search_queries`, `search_results`, `page_analysis`, `mentions` — 430
  rows total, includes a `mentions_bpr` column, predates the multi-tenant
  migration) moved from `public` to a new `archive` schema in the
  `brandgeo-dashboard` Supabase project (`duiyifepitvugyulobqm`) —
  archived, not dropped. Confirmed via `list_tables`: data intact, RLS
  still enabled, tables off the exposed `public`/API surface. Chose
  archive over drop (irreversible, no storage benefit gained) or leaving
  in `public` (clutters schema). **Not cleaned up, left as an open
  non-blocking follow-up if raised again:** legacy code that still
  references the old `public.*` path — `app/collect_searxng_results.py`,
  `app/generate_queries.py`, `app/analyze_search_results.py`,
  `collectors/searxng_search.py`, `dashboard/streamlit_app.py`, the
  `searxng` service in `bpr-geo-monitor/docker-compose.yml` — is already
  orphaned from production (not wired into `run_monthly_collection.bat` or
  `geo_monitor_service.py`, which only write `ai_results`/`prompts`/`clients`).
  Scope: Supabase only, no local files.
- **#99** ✅ **DONE 2026-07-08** — Git commit the merged `web/` folder into
  the BpR repo. Verified via `git ls-files` (both `blog.html` and
  `bg-001.html` tracked), `git check-ignore -v` (prints nothing — the
  `.gitignore`'s `!brandgeo/web/` exception works correctly, nothing silently
  ignored), and `git log` (commit `4122a03`, message "Merge web/ folder:
  reconcile blog.html and bg-001.html, add bg-002/003/004, cookies, images",
  already at `HEAD -> main, origin/main, origin/HEAD` — pushed to GitHub).
  **cPanel upload deliberately NOT done** — per §6.4 sequencing, cPanel
  re-upload is step 6, which comes after backup (step 2), GitHub rename
  (step 3), and the move to the new root folder (step 4), not immediately
  after the merge/commit. Caught mid-session (2026-07-08) after Claude
  jumped ahead and asked Constantin to upload to cPanel too early — corrected,
  no upload happened. Live getbrandgeo.com currently still runs the
  pre-six-disciplines version of bg-001.html; that's expected until step 6.
- **#100** ✅ **DONE 2026-07-08** — Fate of the abandoned standalone
  `github.com/Tenerife365/brandgeo` repo decided: Constantin archived it
  via GitHub's own "Archive this repository" feature (Settings → Danger
  Zone) rather than deleting it. Chose archive over delete since it's free,
  reversible, and preserves anything GitHub-native (issues/PRs/history)
  that the local file archive (`BrandGEO-archives\brandgeo-standalone\`,
  see §6.4 step 8) wouldn't have captured. It's now a read-only archived
  repo, not an active or deletable concern — only #101 remains open from
  the original #100/#101/#102 cleanup trio (and #101 is itself mostly done,
  see its entry above).
  Scope: GitHub repo settings only, no local files.
- **#101** ✅ **DONE 2026-07-08** — Investigated and resolved both parts:
  **Signup:** confirmed `brandgeo-signup/` was a drop-in install kit (its own
  `INSTALL.md` says "copy these files into your repo") whose content was
  already merged into `brandgeo-dashboard/src/pages/Signup.tsx` +
  `netlify/functions/signup-client.js` (styled version, ~1hr newer). Copied
  `brandgeo-signup/` to `BrandGEO-archives/brandgeo-signup/` (content-diff
  verified identical). The original at the canonical root
  (`C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-signup\`) is now
  confirmed deleted — Claude's own `mv`/`rm` was blocked by the
  connected-folder mount (`Operation not permitted`), but Constantin ran
  `rmdir /S /Q` on his end and it's gone; verified via directory listing.
  It was untracked in git, so no `git rm` was needed.
  **Backend:** confirmed `BrandGEO-archives/brandgeo-standalone/backend/` is
  a stale snapshot of the canonical `brandgeo/backend/` — single one-line
  diff in `app/engine_runner.py` (older Perplexity model name + missing
  headers), canonical is newer (2026-07-06) and authoritative. No unique code
  in the archived copy — nothing to reconcile, already correctly archived,
  no action needed.
  **Also surfaced (unrelated, found while investigating):** the git index at
  the canonical root is badly out of sync with HEAD — `git status` shows all
  ~222 tracked files staged as deleted while the same files show up as
  untracked, meaning a `git commit` right now would strip most of the repo's
  tracked history. Likely a leftover `git rm -r --cached .` from the
  restructuring that never got a follow-up `git add -A`. Constantin is
  handling the fix himself (`git add -A`, review `git status`, then commit)
  — not yet confirmed done as of this note.
  Scope: `brandgeo-signup/`, `brandgeo/backend/`, `BrandGEO-archives/brandgeo-standalone/backend/`.
- **#73** ✅ **DONE 2026-07-08** — Wrote `client-onboarding-flow.md` (repo
  root), documenting the real, as-implemented onboarding flow (not an
  aspirational design), based on reading `Onboard.tsx`,
  `onboard-client.js`, `planConfig.ts`, and the §3 schema. Flow: a single
  admin-only 5-step wizard (Company → Brand Aliases → Competitors → Login
  → Collecting) that POSTs once to `onboard-client.js`, which atomically
  creates a `clients` row, a Supabase Auth user, and a `user_profiles` row
  (hard-coded `role: viewer`), with rollback on partial failure — then the
  wizard runs its own local, hand-rolled collection loop over the client's
  prompts. Confirms the known #72 finding (Claude/ChatGPT silently
  skipped) and found it's **worse than previously recorded**: (1) **no
  prompts are ever created during onboarding** — neither the wizard nor
  `onboard-client.js` inserts into `prompts`, so step 5's "Running Initial
  Collection" will show "No active prompts found" for every real new
  client; the admin has to manually add prompts via `/prompts` afterward,
  which the wizard never tells them to do; (2) confirmed in code:
  `Onboard.tsx`'s local `runCollection()` (~line 94) calls only
  `collect-prompt` and never `collect-claude`/`collect-chatgpt` — contrast
  with the correct pattern in `collectionContext.tsx`, which fires all
  three via `Promise.allSettled`; (3) Onboard's local loop also never
  passes `active_engines` in its payload, so onboarding collection isn't
  plan-gated at all, unlike the rest of the app. The wizard's final
  success message ("{total} prompts × 5 engines collected") is therefore
  inaccurate on two counts, not one. **Not fixed** — this session was
  docs-only by design; fixing onboarding to (a) seed default prompts and
  (b) reuse `collectionContext`'s real `runCollection` instead of its own
  loop is a good candidate for its own scoped task.
  Scope: docs-only, `client-onboarding-flow.md` output only.
- **#84** ✅ **DONE 2026-07-08 (finalized)** — Updated the `id="sentiment"`
  spotlight section in `brandgeo/web/index.html` now that #83 shipped:
  CTA `href` changed from `#contact` to
  `https://app.getbrandgeo.com/sentiment` (the real page is live); CTA
  text changed from "Ask about Brand Sentiment →" (inquiry-style, implied
  no self-serve access) to "See Brand Sentiment live →" (direct, matches a
  button that now links straight into the working app). Fact-checked all 4
  bullet points against what's actually live on `/sentiment` (score,
  positive/neutral/negative breakdown, per-engine chart, trend chart,
  response-snippet feed) — all accurate, no copy changes needed. Mockup
  card deliberately left untouched (no screenshot-capture tooling
  available in this environment) — swapping it for a real `/sentiment`
  screenshot remains an optional future polish item, not a blocker.
  **Not yet live** — like #99, this is a local file change only; needs
  manual cPanel re-upload from
  `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\` before
  it's visible on getbrandgeo.com.
  Scope: `brandgeo/web/index.html` only.

- **#103** ✅ **DONE 2026-07-08** — Fixed the two broken-onboarding bugs
  documented by #73/`client-onboarding-flow.md` (also flagged as a
  don't-wait-for-Phase-3 risk in §7.5).
  1. **No prompts ever seeded.** Added a new required "Prompts" step
     (step 4 of 6) to `Onboard.tsx`'s wizard, between Competitors and
     Login — same free-text tag-input pattern as aliases/competitors, "Next"
     disabled until at least one prompt is entered (this is the actual fix:
     a brand-new client can no longer reach the Collecting step with zero
     prompts). `onboard-client.js` now accepts an optional `prompts: string[]`
     in its POST body and inserts them as `prompts` rows
     (`category: 'general', is_active: true, position: idx+1`) via one
     `.insert()` call (atomic as a single INSERT statement), with the same
     rollback-on-failure chain as the existing client/auth/profile steps.
  2. **Collection silently skipped Claude + ChatGPT and ignored plan
     gating.** Deleted `Onboard.tsx`'s local hand-rolled `runCollection()`
     (only ever called `collect-prompt.js`, i.e. gemini/perplexity/meta)
     entirely. The wizard now imports `useCollection()` from
     `collectionContext.tsx` and calls the same shared `runCollection(clientId,
     true, undefined, activeEngines)` that `AIVisibility.tsx`'s Force Refresh
     already uses — fires `collect-prompt` + `collect-claude` + `collect-chatgpt`
     in parallel via `Promise.allSettled`, correctly gated to the new client's
     plan. `activeEngines` is computed via `getActiveEngines(plan,
     engines_enabled)` from `planConfig.ts`, using the *new* client's own
     plan/engines_enabled — not the admin's currently-selected client from
     `useClient()`, which would have been wrong.
  3. **Follow-on fix needed to make (2) correct:** `onboard-client.js`
     previously never set `plan` on insert at all (fell through to an
     undocumented DB column default — see #73 finding). Now explicitly sets
     `plan: 'essentials'` (matches the fallback default already used
     elsewhere in `clientContext.tsx` for clients missing plan data) and
     returns `plan` + `engines_enabled` + `prompts_created` in its response
     so the frontend can compute `activeEngines` without a second round-trip.
  4. Rewired the Collecting step's progress UI (now step 6) to read
     `collecting`/`progress`/off the shared `CollectionContext` instead of a
     local `progress` state — the old "{total} prompts × 5 engines
     collected" copy (inaccurate on two counts per #73) is now "{N} prompts
     collected across this client's active engines," which is honest about
     however many engines the client's plan actually allows.
  **Files touched:** `brandgeo-dashboard/src/pages/Onboard.tsx`,
  `brandgeo-dashboard/netlify/functions/onboard-client.js` — matches the
  `Scope:` already committed to in §7.5 for this task, nothing else touched.
  **Build verification caveat (same category as #83):** this sandbox's
  `npx tsc --noEmit` and `npx esbuild` both still hit the documented
  Windows/Linux `node_modules` platform mismatch (confirmed again this
  session: `@esbuild/win32-x64` present, needs `@esbuild/linux-x64`) —
  `App.tsx`/`Layout.tsx`, untouched this session, threw the identical class
  of cascading JSX errors, reconfirming it's environment noise, not a real
  defect. **New wrinkle found this session, worth knowing for next time:**
  partway through editing `Onboard.tsx`, this sandbox's mounted view of the
  file stopped picking up further edits — `wc -l` via the bash tool stayed
  frozen at a stale, mid-write 338-line snapshot (cut off mid-word) even
  10+ seconds after later edits landed, while the Read tool (which goes
  straight to the real Windows disk) correctly showed the final, complete
  374-line file. So neither `tsc` nor `esbuild` in-sandbox actually checked
  the final version of this file at all this session — verification here
  was a manual structural review of the Read tool's output only (JSX
  tags/step blocks balance out on inspection). **Run a real build before
  pushing:** open PowerShell in
  `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard` and
  run `npm run build` — should exit 0. If it reports real errors, paste
  them into the next session before committing.
  **Not yet committed** — git add/commit/push not run this session (per
  the execution-delegation rule). Once the build above passes:
  ```
  cd "C:\Users\const\Constantin Daniel Goane\BrandGEO"
  git status
  git add brandgeo-dashboard/src/pages/Onboard.tsx brandgeo-dashboard/netlify/functions/onboard-client.js
  git commit -m "Fix onboarding: seed initial prompts + fire all 3 collection functions with plan gating (#73/#103)"
  git push
  ```
  **Deliberately still open (out of today's Scope):** no plan *picker* UI
  (every new client is hard-set to `essentials` — upgrading to
  managed/pro/enterprise still needs a manual Supabase edit afterward); no
  welcome/credentials email; no admin-role creation path; no
  `default_market_id` set. All four were already flagged as open in
  `client-onboarding-flow.md` §4 and remain so.
  Scope: `Onboard.tsx`, `onboard-client.js` only.

---

## 6. Restructuring — New Root Folder & GitHub Rename (agreed 2026-07-08, ✅ COMPLETE)

**All 8 steps below are done as of 2026-07-08.** `C:\Users\const\Constantin
Daniel Goane\BrandGEO` is the canonical project root; the old
`C:\Users\const\Desktop\BpR` and standalone `brandgeo` folders were archived
(not deleted) to `C:\Users\const\Constantin Daniel Goane\BrandGEO-archives\`.
Of the three independent cleanup decisions, #100 and #102 are now closed
(see §5 Completed) — only #101's remainder (deleting `brandgeo-signup/`
manually, see its §5 entry) is still open, and it's non-blocking. Only
re-open this section's sequencing if actually touching #101 or if
something about the new structure turns out to be broken.

### 6.1 Why

The current structure grew without an initial plan: `BpR` (short for "Bucate
pe Roate," the first client the dashboard was built for as a demo) ended up
as the root folder/repo name for the entire BrandGEO product. That's
backwards — BpR is just one client and should only exist as a row in the
`clients` table, with no special status in folder structure, code, or naming.
This also directly serves the existing Scalability Rule (§4.1): no
hardcoded/special-cased client should ever leak into structure.

### 6.2 Target structure

- New root: `C:\Users\const\Constantin Daniel Goane\` — the personal/company
  root, containing every project as a subfolder.
- BrandGEO becomes one project folder under that root (exact target path TBD
  at execution time, e.g. `...\Constantin Daniel Goane\BrandGEO\`), containing
  what's currently split across `C:\Users\const\Desktop\BpR` (dashboard,
  signup, rules, CLAUDE.md, loose utility scripts) and
  `C:\Users\const\Desktop\brandgeo` (website source, once merged).
- Loose personal-utility files currently at BpR root (`credentials.json`,
  `gpt_agents_benchmark.csv`, `run_benchmarker.bat`, `test_apis.py`,
  `benchmarker_log.txt`, `token.json`, `rotation_state.json`,
  `name_intelligence.py`, `run_name_intelligence.bat`, `name_results.json`,
  `geo-visibility-report-2026-06-30.md`) **stay inside the BrandGEO project
  folder** (decided 2026-07-08 — they support BrandGEO, e.g. the GPT agent
  benchmarker) rather than getting split into a separate tools folder.
- The Cowork-connected folder `C:\Users\const\Claude\Projects\BrandGEO`
  (holds `CLAUDE-MEMORY.md` + a stray `bg-001.html`/hero image/2 PDFs) is a
  separate concern from this local-disk restructuring — not yet folded in,
  needs its own review.

### 6.3 GitHub

- ✅ **DONE 2026-07-08** — Live repo `github.com/Tenerife365/BpR` renamed to
  **`github.com/Tenerife365/GetBrandGeo`** (not `brandgeo` as originally
  planned — see below for why). Constantin did this manually via GitHub
  Desktop + the repo's GitHub.com settings tab. Verified live via web fetch:
  111 commits, all expected content present (`brandgeo-dashboard`,
  `brandgeo/web`, `brandgeo-signup`, etc.).
  **Naming collision sidestepped, not resolved:** the separate abandoned
  standalone repo (2 commits) still occupies `github.com/Tenerife365/brandgeo`
  — see below. Renaming to `GetBrandGeo` instead of `brandgeo` avoided needing
  to touch that repo at all. #100 (deciding that repo's fate) is now a
  fully independent, non-blocking cleanup task.
  **Not yet done:** the local clone's git remote at `C:\Users\const\Desktop\BpR`
  still points to the old URL (`https://github.com/Tenerife365/BpR.git`).
  GitHub redirects it, so it likely still works, but Constantin should run
  `git remote set-url origin https://github.com/Tenerife365/GetBrandGeo.git`
  to point it at the real URL directly (Claude can't edit `.git/config` —
  blocked as a protected path).
- The separate abandoned repo `github.com/Tenerife365/brandgeo` (2 commits,
  the standalone scaffold whose `web/` folder was merged into the real repo
  back in #98) — its fate (delete vs. leave dormant) is still an open,
  low-priority decision (#100), but no longer blocks anything since the
  rename went to a different name.

### 6.4 Sequencing (do not skip steps or parallelize with another session)

1. ✅ **DONE 2026-07-08** — `web/` merge (standalone `brandgeo\web` +
   `BpR\brandgeo\web` → one reconciled version). See #98 in §5. Both
   originals backed up to `BpR\legacy\web-snapshots\` before merging.
2. ✅ **DONE 2026-07-08** — Fresh snapshot backup of the confirmed-correct,
   merged `web/` folder (distinct from the step-1 backups, which are of the
   pre-merge *originals*). Live folder `BpR\brandgeo\web\` copied to
   `BpR\legacy\web-snapshots\2026-07-08-merged\`. Verified: 25/25 files match
   (19 text files + `images\` subfolder with 6 binaries: `bg-001/002/003-hero.jpg`,
   `bg-004-hero.png`, `bg-004-hero-old-pil.png.bak`, `logo.png`), directory
   structure matches source exactly, spot-checked `robots.txt` (byte-identical)
   and `images\bg-001-hero.jpg` (renders identically).
   **Note for future sessions:** this session's sandboxed Linux shell
   (`mcp__workspace__bash`) was down (`HYPERVISOR_VIRT_DISABLED`) — Read/Write
   tools can't do byte-exact copies of binary files, and hand-transcribing
   text files through chat is slow and risks transcription errors. Constantin
   ran the copy himself instead. First attempt used
   `Copy-Item -Path "...\web\*" -Destination "..." -Recurse -Force`, which
   silently **flattened the `images\` subfolder** (a known PowerShell
   `Copy-Item` + wildcard-source + `-Recurse` bug) — caught on verification,
   fixed with `robocopy "...\web" "..." /E` instead, which preserves directory
   structure correctly. **Prefer `robocopy /E` over `Copy-Item -Recurse` for
   any future folder snapshots in this project** (relevant again at §6.4 step 4,
   the local-disk move).
3. ✅ **DONE 2026-07-08** — GitHub rename. See §6.3 — renamed to
   `github.com/Tenerife365/GetBrandGeo` (not `brandgeo`), which sidestepped
   the naming collision rather than resolving it. Local git remote still
   needs `git remote set-url` (not yet done — see §6.3).
4. ✅ **DONE 2026-07-08** — New root created at
   `C:\Users\const\Constantin Daniel Goane\BrandGEO\` and populated via
   `robocopy` (real Windows desktop access this session, not the sandboxed
   shell — that stayed down the whole session, `HYPERVISOR_VIRT_DISABLED`).
   This was a **copy, not a move** — both source folders
   (`C:\Users\const\Desktop\BpR` and the standalone
   `C:\Users\const\Desktop\brandgeo`) are left untouched on disk; deletion of
   old locations is step 8, only after steps 5–7 verify everything works from
   the new structure.
   - Copied `C:\Users\const\Desktop\BpR\*` → new root, excluding
     `node_modules`, `dist`, `__pycache__` (regenerable build artifacts —
     **run `npm install` inside the new `brandgeo-dashboard\` before building
     or dev-serving from the new location**). Verified 1296/1296 files copied,
     git repo intact at the new path (`git status` clean branch, remote
     already `https://github.com/Tenerife365/GetBrandGeo.git`).
   - **Scope discovery not in the original §6.2 plan:** the standalone
     `C:\Users\const\Desktop\brandgeo\marketing\` folder (LinkedIn banners,
     article post images, `BrandGEO_Posts_5_to_14.pdf` — 19 files) had never
     been accounted for anywhere in this restructuring plan. Constantin
     confirmed it should move in too — copied to
     `...\BrandGEO\marketing\`. Verified 19/19 files. The rest of the
     standalone `brandgeo` folder (its own `backend\`, `rules\`, `web\`,
     `.git\`) was **not** copied — that's the abandoned repo covered by #100/
     #101, left in place until those are separately resolved.
   - **Not yet done:** Cowork's connected-folder setting still points at
     `C:\Users\const\Desktop\BpR` — future sessions should connect to
     `C:\Users\const\Constantin Daniel Goane\BrandGEO\` instead once this is
     confirmed as the canonical copy. Until step 8 deletes the old `BpR`
     folder, **the two copies will drift out of sync** — treat
     `C:\Users\const\Constantin Daniel Goane\BrandGEO\` as canonical going
     forward and avoid editing `C:\Users\const\Desktop\BpR` directly.
5. Verify Netlify still builds/deploys correctly from the renamed repo.
   Constantin confirmed build status is correct (checked 2026-07-08, before
   the local disk move above — worth a quick re-check now that a second local
   copy exists, though Netlify builds from GitHub, not local disk, so this
   move shouldn't affect it).
6. ✅ **DONE 2026-07-08** — Merged `web/` re-uploaded to cPanel by
   Constantin from `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\`.
   `images\bg-004-hero-old-pil.png.bak` and `article-builder.html` were
   deliberately left out of the upload (backup artifact / internal tool,
   not meant to be public).
7. ✅ **DONE 2026-07-08** — Supabase audit (project `brandgeo-dashboard`,
   `duiyifepitvugyulobqm`). Findings:
   - BpR itself is **not** special-cased — it's `clients` row `id=1,
     slug='bpr'`, no different from any other client. No policy, function,
     or trigger hardcodes its id or slug.
   - Found (and left in place, low priority): a legacy single-tenant table
     set — `search_queries` → `search_results` → `page_analysis` → `mentions`
     — predating the multi-tenant migration (#32). `page_analysis` has a
     column literally named `mentions_bpr`. None of these tables have a
     `client_id` column at all; they're unreferenced by the current
     architecture (§1). Dead schema clutter, not an active bug — candidate
     for a future cleanup, not urgent.
   - Found and **fixed**: several tables had leftover permissive RLS
     policies (`qual: true`, role `authenticated`) sitting *alongside* the
     correct per-client policies — `ai_results` ("Auth read/write
     ai_results"), `prompts` ("Auth read/write prompts"), `clients`
     ("clients_read"), `competitors` ("Auth read"), plus "Auth read" on the
     legacy `search_results`/`page_analysis`/`mentions` tables. Since
     Postgres OR's multiple permissive RLS policies together, these
     **completely bypassed per-client isolation** — any authenticated user
     (any client's viewer) could read every other client's `ai_results` and
     `prompts`, and write/delete any client's `prompts`. Not BpR-specific —
     affected every tenant. Constantin ran the fix directly in the Supabase
     SQL Editor (`DROP POLICY` on all 9 leaky policies); re-verified via
     `pg_policies` afterward — all leaky policies gone, every remaining
     policy correctly scoped to admin-or-own-client, and the legacy tables
     now correctly deny-all (no policies = locked down, only service_role
     bypasses).
8. ✅ **DONE 2026-07-08 (partial — archived, not deleted)** — Constantin
   chose to **archive rather than delete**: `C:\Users\const\Desktop\BpR` and
   the standalone `C:\Users\const\Desktop\brandgeo` were moved (not copied)
   to `C:\Users\const\Constantin Daniel Goane\BrandGEO-archives\BpR` and
   `...\BrandGEO-archives\brandgeo-standalone` respectively. Verified: both
   old Desktop paths now return false on `Test-Path`; both archive paths
   exist; the canonical `C:\Users\const\Constantin Daniel Goane\BrandGEO`
   folder is untouched and correct (top-level structure unchanged, and
   `brandgeo-dashboard\node_modules` now present — `npm install` was run
   there at some point after step 4, as instructed).
   **Still open, not part of this pass** (each is independent, none were
   confirmed in scope when this ran):
   - #100 — fate of the abandoned GitHub repo `Tenerife365/brandgeo` (2
     commits) — delete vs. leave dormant. The local clone of it now lives
     at `...\BrandGEO-archives\brandgeo-standalone\` (still has its own
     `.git\` pointing at that GitHub repo).
   - #101 — retiring `brandgeo-signup/` and reconciling the duplicate
     `backend/` copies (one now in the canonical root's `brandgeo\backend`,
     one in the archived `brandgeo-standalone\backend`).
   - #102 — the legacy `search_queries`/`search_results`/`page_analysis`/
     `mentions` Supabase tables (already RLS-locked, ~430 rows of old test
     data) — drop vs. archive vs. leave as-is.

### 6.5 Collision risk

Constantin sometimes runs a second "old chat" session in parallel. Two
sessions already collided once (2026-07-08) writing to `BpR\brandgeo\web`
at the same time. Before doing any write under this restructuring, confirm
with Constantin that no other session is active on the same paths.

**Second collision, different failure mode (2026-07-08):** during task
#83, file-level scoping worked correctly (#72 and #84 both deliberately
avoided `Layout.tsx`/`App.tsx` while #83 was using them), but a `git
stash`/`git status` from one session still collided with another session's
git operation and corrupted `.git/index` (see #83's entry in §5 for the
full incident and recovery command). Lesson: non-overlapping file scope
does not by itself prevent git-level collisions — `git commit`/`push`/
`stash` are repo-wide and must be serialized separately. This is now a
standing rule, not a one-off fix — see the "Parallel task scoping" bullet
in §0 and `rules/parallel-task-scoping.md`. Going forward, pending tasks in
§5 should carry a `Scope:` tag so overlapping work is visible before two
sessions start in parallel.

### Planned (not yet numbered)

- Extract `analyseResponse` into `_analysis.js` shared helper (resolves §2.1)
- Model migration: `collect-claude.js` → hybrid Sonnet 5 + Opus 4.8
- OpenRouter fallback for same-model continuity when primary quota runs out (medium-term)
- Scheduled automatic collection (cron-triggered Netlify function)
- Caching layer to deduplicate identical prompt+market combinations across clients

---

## 7. Redesign Initiative — Website + Dashboard Modernization (opened 2026-07-08)

**Status: kicked off, not yet built.** Constantin wants both `getbrandgeo.com`
and `app.getbrandgeo.com` to compete visually with modern AI-visibility SaaS
tools (named benchmark: **peec.ai**) — describes current state as "25% of
100%" vs. a slick, intuitive, modern competitor bar. This should live in its
own **`Master-Redesign`** chat going forward (see §0 chat-naming convention —
ongoing/occasional-update area, not a single scoped task), not be folded into
unrelated task chats.

### 7.1 Audit findings (design-critique pass, 2026-07-08, live site + dashboard)

> ⚠️ **STALE as of 2026-07-26. Four of this section's findings were REFUTED by
> measurement** — the light-theme Overview, the chart overflow, the flat cards,
> and the teal active states. See "Four §7.1 claims REFUTED by measurement" in
> CURRENT STATE above before acting on anything below. The real defects on these
> surfaces are contrast (side panel 1.07:1, active tab 1.24:1) and the first-run
> experience, neither of which this section names.

Checked live via browser: `getbrandgeo.com` (hero + "what you get" section)
and `app.getbrandgeo.com` (Overview page), plus source-code check of
`Dashboard.tsx` and `tailwind.config.js`.

- 🔴 **Critical bug, not a design problem:** the dashboard **Overview** page
  (`Dashboard.tsx`) renders in a plain light/white theme live, even though
  its own source code uses `bg-dark-700`, `text-white`, `border-dark-600`
  throughout, and `tailwind.config.js` does define those tokens via CSS
  variables (`--dark-700`, `--dark-600`, etc.). The rest of the app
  (`Layout.tsx`, `AIVisibility.tsx`, `Recommendations.tsx`, `Prompts.tsx`,
  `Mentions.tsx`) correctly renders the violet/dark theme — **Overview is the
  outlier**, both in the live screenshot and in that it's the one page that
  doesn't grep-match the dark theme classes as heavily. Root cause not fully
  confirmed — leading hypothesis is either a stale Netlify deploy vs. latest
  commit, or the `--dark-700`/`--dark-600` CSS custom properties not being
  defined/loaded correctly for that route. **This needs to be fixed BEFORE
  any visual redesign work on Overview**, since new components would render
  on top of the same broken variables otherwise.
- 🔴 Marketing site's own "what you get" section shows a polished dark
  dashboard-preview mockup (big AI Visibility Score ring, clean card
  layout) that **does not match the real dashboard** — a real trust/first-
  impression gap between what's promised and what's delivered.
- 🟡 Overview's `Brand Visibility by AI Engine` chart overflows/cuts off at
  the right edge of its container — responsive/overflow bug in the chart
  container, separate from the theme issue.
- 🟡 Sidebar nav is a flat icon+label list with no grouping and a weak
  active-state indicator, compared to grouped/sectioned nav patterns in
  modern competitors.
- 🟢 Cards are flat-bordered with no elevation/depth — reads as less premium
  than competitor dashboards.
- ✅ What's already working: the website hero/copy/preview-mockup section is
  close to competitive already; the underlying violet dark-theme design
  system already exists and is correctly used on 5 of 6 dashboard pages —
  this is a fix-and-polish effort, not a from-scratch rebuild.

Full critique (first-impression/usability/hierarchy/consistency/accessibility
breakdown) was delivered in chat on 2026-07-08 — not fully duplicated here;
this section captures the decisions and findings that need to survive into
the next session.

### 7.2 Constantin's priority call (2026-07-08)

Given three recommended priorities (1. fix the Overview theme bug, 2. unify
chart styling to brand palette, 3. redesign sidebar nav + Overview layout for
stronger visual hierarchy — bigger score treatment, grouped nav, card
elevation), **Constantin confirmed priority 3 (the actual visual redesign) is
the most relevant one to him.**

**Sequencing dependency flagged and accepted:** priority 3 depends on
priority 1 being fixed first — a redesigned Overview layout would still
render with the same broken/light theme until the CSS variable / stale-
deploy issue is resolved. So the `Master-Redesign` work should treat the
theme-bug fix as **step zero** (quick, mechanical, not a design decision)
before building the new sidebar/Overview layout on top of it, rather than
skipping straight to the redesign and having it render broken too.

### 7.3 Next steps for the `Master-Redesign` chat (short version — see §7.4 for the full roadmap)

1. Diagnose and fix the Overview theme bug (check latest Netlify deploy
   timestamp vs. latest commit; check `index.css` for `--dark-700`/
   `--dark-600` variable definitions and confirm they ship in the production
   build).
2. Fix the Overview chart overflow bug.
3. Redesign sidebar nav (grouping, stronger active state) and Overview card
   layout (lead with a large AI Visibility Score treatment matching the
   marketing site's own preview mockup, add card elevation) — this is the
   actual "modern SaaS" polish pass Constantin asked for.
4. Unify chart color palette to brand violet/teal tokens across all pages
   (lower priority than 1–3 per Constantin, but still open).
5. Revisit whether the marketing site's dashboard-preview mockup should be
   swapped for a real screenshot once the redesigned Overview exists (ties
   into #84's still-open "real screenshot vs. mockup" question).

### 7.4 Full Phased Roadmap (requested 2026-07-08 — "plan even further")

Constantin asked for a fuller phased plan beyond the 5-bullet list above:
design-system definition, page-by-page order, and milestones. This
supersedes §7.3 as the actual working plan — §7.3 stays as the quick-glance
summary of Phase 0.

**Phase 0 — Unblock (bug fixes, not design decisions)**
- 0.1 Diagnose + fix the Overview theme bug (§7.1).
- 0.2 Fix the Overview chart overflow/responsive bug.
- *Exit criteria:* Overview renders in the same dark/violet theme as every
  other page; no chart clipping.

**Phase 1 — Design System Consolidation**
Formalize what's partially already there (§4.2 violet tokens,
`ENGINE_META` colors) plus what's missing:
- Color: primary/accent violet, slate backgrounds, engine colors — mostly
  defined already, needs to be the single source of truth (this file §4.2,
  or a new `DESIGN-SYSTEM.md`).
- Typography scale — currently ad hoc per page, needs a defined
  heading/body/label scale.
- Spacing scale — for consistent card padding/gaps across pages.
- Elevation/shadow tokens — new; cards are currently flat-bordered (§7.1
  finding), need a subtle shadow/gradient-border system for "premium" feel.
- Chart color palette — unify whatever charting lib is in use to brand
  violet/teal tokens instead of default library colors.
- CTA/button variants — primary/secondary/ghost, directly serves
  Constantin's "smooth call-to-action" ask.
- Empty/loading/error state patterns — for consistency across pages.
- *Exit criteria:* every token Phase 2+ needs is named and defined once,
  not invented per-page.

**Phase 2 — Shell Redesign (`Layout.tsx`)**
- Group sidebar nav into logical sections (e.g. Insights: Overview/AI
  Visibility/Sentiment; Strategy: Competitors/Recommendations; Manage:
  Prompts/Usage/Onboard — illustrative, adjust to taste) instead of one flat
  list.
- Stronger active-state indicator (e.g. left accent bar + background tint,
  not just a bg tint).
- Highest-leverage single change — `Layout.tsx` wraps every page, so fixing
  it once benefits all of them.
- *Exit criteria:* current page is obvious at a glance; nav reads as
  organized, not a flat icon dump.

**Phase 3 — Page-by-Page Redesign (priority order)**

Bundle the relevant still-open #72 audit findings into each page's pass
below — same file is already being opened, so fixing these alongside the
visual work is close to free rather than a separate future cleanup pass.

1. **Overview** (`Dashboard.tsx`) — highest-traffic page, first thing seen
   after login, currently the most broken. Lead with a large AI Visibility
   Score treatment (ring/gauge) matching the marketing site's own preview
   mockup; add card elevation from Phase 1; fix chart styling. **Also fix
   while here (#72):** `as any` casts, decorative time filter (page doesn't
   actually read `timeRange`).
2. **AI Visibility** (`AIVisibility.tsx`) — core feature page (engine cards,
   prompt table, Fix This hub); apply Phase 1–2 conventions. **Also fix
   while here (#72):** teal used for active/selected states, violating the
   violet-only brand rule (§4.2).
3. **Brand Sentiment** (`BrandSentiment.tsx`) — newest page (#83), least
   legacy-encumbered, good candidate to set the "target look" other pages
   get matched to.
4. **Competitors, Recommendations, Mentions** — same treatment, lower
   individual traffic than 1–3. **Also fix while here (#72):** `as any`
   casts in `Mentions.tsx`.
5. **Prompts, Usage, Onboard, Signup** — functional/utility pages, lowest
   visual priority but still worth bringing onto the token system, to avoid
   repeating the "5 of 11 pages" inconsistency pattern already documented in
   #72 (i18n coverage drift). **Also fix while here (#72):** teal violation
   in `Prompts.tsx`. **Onboard.tsx is a special case — see §7.5 Risks below,
   don't let it wait for its Phase 3 turn.**
- *Exit criteria per page:* passes a quick self-check against Phase 1
  tokens — hierarchy, consistency, no `as any` casts or hardcoded one-off
  colors (§4.4).
- `marketContext.tsx`'s Romania-default bug (#72 finding 3 — any session
  with no saved market defaults to `MARKETS[1]`, a leftover BpR assumption
  that violates the Scalability Rule for every non-Romanian client) isn't
  page-specific — fix it once, in whichever session first touches
  `marketContext.tsx`, rather than waiting for a specific page's turn.

**Phase 4 — Marketing Site Alignment**
- Swap the "what you get" dashboard-preview mockup on `getbrandgeo.com` for
  a real screenshot/embed of the redesigned Overview — resolves the open
  question already flagged in #84.
- Lower-priority pass on `blog.html`/`bg-00X.html`/`faq.html`/`terms.html`
  for the same visual consistency (these already scored better in the §7.1
  audit, so this is polish, not a fix).

**Phase 5 — Polish & Accessibility Pass**
- Run `design:accessibility-review` (contrast, touch targets) across every
  redesigned page.
- Dedicated `design:ux-copy` pass on CTAs/microcopy — this is Constantin's
  explicit "smooth call-to-action" ask, worth its own pass rather than
  folding into Phase 3.
- Motion/transition polish (hover states, subtle transitions) for the
  "pleasant to open" feel Constantin described.

**Timeline framing**
This codebase's workflow is session-scoped, not calendar-scoped (§0: one
Task chat = one scoped step). Rough session budget, not calendar time:

| Phase | Est. sessions |
|---|---|
| 0 — Unblock | 1 |
| 1 — Design system | 1 |
| 2 — Shell/nav | 1 |
| 3 — Page-by-page (6 pages/groups) | 5–6 |
| 4 — Marketing site alignment | 1–2 |
| 5 — Polish/accessibility | 1–2 |
| **Total** | **~10–13 sessions** |

The temporary parallel-work window (§0, through 2026-08-12) makes this a
good time to push through Phases 0–3 (the structural, highest-leverage
work) since multiple Task chats can run at once on non-overlapping pages —
e.g. one session on Phase 3.1 (Overview) while another does Phase 3.3
(Sentiment), as long as neither touches `Layout.tsx` at the same time as
Phase 2. Phases 4–5 are lower-risk and can spill past the window if needed.

### 7.5 Risks & Open Questions (added 2026-07-08)

- ✅ **RESOLVED 2026-07-08 (see #103 in §5).** Onboarding's two bugs — zero
  prompts ever seeded, and collection silently skipping Claude/ChatGPT +
  plan gating — are both fixed. Build verification still pending on
  Constantin's machine (`npm run build`), and the change isn't committed
  yet — see #103's entry for exact commands.
- 🟡 **The roadmap in §7.4 is based on general "modern SaaS" conventions,
  not an actual peec.ai teardown.** If beating that specific competitor
  matters, a real side-by-side (their onboarding flow, empty states, actual
  color/type choices, live screenshots) would sharpen Phase 1's
  design-system decisions more than general impressions would. Worth doing
  before Phase 1 locks in tokens, not after.
- 🟡 **No success metric defined for the redesign.** Plausible analytics is
  already live on the website. Before Phase 4/5, decide what "the redesign
  worked" actually means — signup conversion rate, time-to-first-prompt,
  session length — so there's something concrete to check against rather
  than a vibe-based judgment.
- 🟢 **Mobile/responsive coverage isn't explicitly called out per-phase.**
  #39 already made the dashboard responsive once; Phase 3's exit criteria
  should explicitly include a mobile check per page, not just desktop, so
  this doesn't regress silently during the redesign.
