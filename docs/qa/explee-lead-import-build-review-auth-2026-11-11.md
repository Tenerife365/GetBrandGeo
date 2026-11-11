PASS WITH FINDINGS

# Explee lead import, build review: account safety, auth and abuse

```
INTENT: review the Explee lead import build (spec rev 2)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, lens ACCOUNT SAFETY, AUTH AND ABUSE. Date 2026-11-11.
Contract: `docs/arch/explee-lead-import.md`, revision 2. Subject: the
UNCOMMITTED working tree on `main` (no commit exists for this build).

Verdict in one line: no blocker and no live exposure (nothing is deployed and
no migration is applied). Two MEDIUM findings must close before
`mode='live'` (F1) and before `follow_up_enabled=true` (F2). Nothing in this
review lets the importer delete or re-bind a login it did not create, write
role `admin`, act in dry run or when off (with the narrow exceptions in F4
and F5), run without the cron secret, or leak the key or a reply into logs.

---

## 0. Calibration

1. Scope. `git diff --stat` shows 20 modified tracked files; this build owns
   4 of them (`onboard-client.js`, `_prospect_prompts.js`,
   `tests/helpers/fake_supabase_mem.js`, `tests/refresh_cadence.test.js`) plus
   9 untracked new files, all 13 inside spec section 11. The other modified
   files (`netlify.toml`: `resend-invite` timeout 15 to 26; `src/pages/Onboard.tsx`:
   `PendingInvitesPanel`; `resend-invite.js`; the web and docs files) belong to
   other sessions and were dirty before this run, per the builder's report and
   the content of each hunk. No file outside `scope_write` is attributable to
   this build.
2. Secret scan: not re-run as a pipe over the whole tree diff (other
   sessions' hunks would dominate it). Instead every new file was read in
   full: no key, token or secret value appears; the only key-like strings are
   test placeholders (`test-cron-secret-placeholder` and similar). Count of
   real secrets found: 0.
3. Criteria: 26, all objectively checkable; 1 (tsc, whole suite), 25
   (migration on a production copy) and 26 (bundle size) cannot be checked in
   this run because tsc, builds and Supabase writes are forbidden.
4. Baseline: not established for tsc or the build (forbidden). The four test
   files this build touches were run, see section 1.
5. Most sensitive function touched: `_provision_client.js` `provision()`,
   guarded by `requireAuth(event, { adminOnly: true })` at
   `onboard-client.js:72` on the wizard path and by `requireCronAuth(event)`
   at `explee-import-background.js:1046` on the importer path.
6. Write access used: this file only. No reviewed file was edited. Three
   throwaway probe scripts were written in the session scratchpad (outside
   the repo) and run against the repo's own fakes.

CALIBRATED

---

## 1. Commands run (pasted, trimmed to the result lines)

```
$ node tests/explee_rules.test.js      -> 110 passed, 0 failed
$ node tests/provision_client.test.js  -> 29 passed, 0 failed
$ node tests/explee_import.test.js     -> 50 passed, 0 failed
$ node tests/refresh_cadence.test.js   -> 17 assertions passed.
$ node --check  explee-import-background.js _explee_rules.js _explee_client.js
                _provision_client.js onboard-client.js _prospect_prompts.js   -> ok x6
$ git log -2 -- brandgeo-dashboard/netlify/functions/onboard-client.js
  feed1d5 2026-07-31 feat(collect): the advertised refresh cadence becomes real ...
```

`feed1d5` is the last commit that touched `onboard-client.js`, so the
builder's before/after harness compares against the real HEAD version.

Probes (scratchpad, not committed, repo fakes, no network):

```
probe_invite_cap.js  (12 hot leads, user_profiles insert fails, live, caps 5/run 30/day)
run 1: invites sent this run = 12, deleted users total = 12
run 2: invites sent this run = 12, deleted users total = 24
run 3: invites sent this run = 12, deleted users total = 36
total invites 36 distinct addresses 12
{ 'failed:provision_error:final=true': 12 }

probe_race.js  (two runImport calls in parallel, brands acme.example and shop.acme.example)
run 1: invites sent this run = 2
{ 'created:null:final=true': 2 }

probe_kill.js  (mode set to 'off' inside the prompt generator of the only lead)
run 1: invites sent this run = 1
{ 'created:null:final=true': 1 }

followUpDecision with a not_interested reply 30 min after creation, 65 min later -> send
```

---

## 2. Acceptance criteria

| # | Criterion (short) | Result | Evidence |
|---|---|---|---|
| 1 | node --check, tsc, every test file | PARTIAL | `node --check` ok on all 6 function files; the 4 owned test files pass (section 1). tsc and the rest of `tests/` NOT run (forbidden in this run). |
| 2 | D3 table, decline regex, 70+ checks | met | `explee_rules.test.js` 110 passed; rule order read at `_explee_rules.js:374-432` |
| 3 | domains, excluded, subdomains | met | `_explee_rules.js:228-247`, `:301-309`; tests pass |
| 4 | replier rules | met | `resolveReplier` `_explee_rules.js:207-214` uses only the listing email matched to a reply `from_email`; `LeadProfile.email` is never read there; tests pass |
| 5 | validatePrompts | met | `_explee_rules.js:438-472`; tests pass (not deep-read for script edge cases, other lens) |
| 6 | 450 candidates, 3 runs | met | test "450 candidates ... all decided after run 3" |
| 7 | empty project_ids, unlisted project unread | met | `explee-import-background.js:193`, `:195`; tests pass |
| 8 | Lost after dry run, hidden, incomplete listing | met | Rule F: `:278` requires a complete listing, `:524` decides from this run's item and thread; tests pass |
| 9 | interleaved runs, one account per identity | met as written (equal email, equal domain) | test passes; see F3 for the subdomain case the unique index does not cover |
| 10 | live: exact writes, zero reply and status POSTs | met | test passes; `_explee_client.js` has no status call at all |
| 11 | Rule U pre-check, pending and profile-less users | met | `_provision_client.js:97-99`, `:164-173`; tests pass |
| 12 | wizard equivalence, viewer always, no admin literal | met | section 6 below; `provision_client.test.js` 29 passed incl. 11 before/after scenarios and the source-text test |
| 13 | dry run writes only own tables, no POST, clean OpenAI body | met as written | `_explee_client.js:83` refuses any non-GET without `write`; `:137` the dry client has no POST functions; see F5 for a narrow exception after a live period |
| 14 | caps | met as written | tests pass; see F1: caps count only successes |
| 15 | breaker | met | `_provision_client.js:66-68`, `explee-import-background.js:785-791`; test passes |
| 16 | erasure and declined reconciliation | met | `:980-994`; tests pass |
| 17 | off, bogus, refused gate, exception | met | `:171-174`, `:1046-1047`, `:141-151`; tests pass |
| 18 | retention, no excerpt for finals, phone mask, summary no @ | met | `:384-404`, `:534`, `:1037`; tests pass |
| 19 | injected clock | met | every timestamp in the importer reads `run.now()`; tests pass |
| 20 | client: seven calls, `/` rejected, 402 latch, abort signal | met | `_explee_client.js:40-43`, `:84`, `:90`, `:63`; tests pass |
| 21 | fake changes opt-in | PARTIAL | the 4 owned files pass; the other test files that import the fake were NOT run by me |
| 22 | no real person or key, no dashes | met for this lens | all new files read; fixtures use `.example`; no dash seen in the files I read (no scan with positive control run by me) |
| 23 | untouched files | met for this build | the do-not-touch files show no hunk from this build; `netlify.toml` and `src/pages/Onboard.tsx` carry another session's hunks (section 0 item 1) |
| 24 | one new env var | met | `grep process.env` on the 4 new modules: only `EXPLEE_API_KEY` is new (plus the existing `SUPABASE_*`, `OPENAI_API_KEY`) |
| 25 | migration on a prod copy, RLS probe | not checkable | no Supabase access in this run; DDL read, section 4 |
| 26 | entry chunk does not grow | not checkable | no build in this run; all new code is under `netlify/functions/`, nothing under `src/` changed by this build |

---

## 3. Security findings, ranked

### F1. MEDIUM. A failure after the invite escapes every cap and re-invites the same person up to 3 times

Where: `explee-import-background.js:762` (`createsThisRun` counts only
successes), `:771` and `:803` (`cleared` sets `reserved_at: null`, so the
failed row leaves the 24 h window counted at `:707`), `:803`
(`provision_error` is non-final until attempt 3), `:284-288` (a `failed` row
is re-taken every run).

Exploit path (a fault, not an attacker): any persistent error AFTER
`inviteUserByEmail` succeeds (profile insert, prompts insert, the `onStep`
progress write) makes `_provision_client.js` send the invite, then delete the
user (`:180`). The importer records `failed provision_error`, does not count
it against `max_creates_per_run` or `max_creates_per_day`, and retries it
next run. Measured with `probe_invite_cap.js`: 12 qualifying leads, caps 5
per run and 30 per day, profile insert failing: 12 invites in run 1, 12 in
run 2, 12 in run 3, 36 invite emails to 12 strangers, every link pointing at
a deleted user. Only the SMTP rate limit (the breaker) bounds it, and on a
custom SMTP with a high limit, nothing does until `max_threads_per_run`
(100 a run). These are cold-outreach replies mailed from the owner's domain;
a dead invite three times is exactly the "cannot be undone" harm D3 names.

Fix (smallest): count every provisioning call that got past the invite
against the caps, and never re-invite after a delivered invite.
1. In `createLive`, increment `run.createsThisRun` (and the referral counter)
   right after `deps.provision` returns, whatever the result, except for
   `email_registered` and `auth_lookup_incomplete` at stage `precheck`.
2. Keep `reserved_at` on a failed row whose `result.stage` is `profile`,
   `prompts`, or `invite` with a user returned, and count `failed` rows with a
   non-null `reserved_at` in the daily window query at `:707` and `:341`.
3. Make `provision_error` with `result.stage` in `profile`, `prompts` final
   (or require `attempts` >= 1 to skip straight to final), and list it in the
   daily summary; a human retries by resetting the row.
Add a test: profile insert failing for 6 leads gives at most 5 invites in run
1 and 0 re-invites in run 2.

Owner: bg-backend. Must close before `mode='live'`.

### F2. MEDIUM (spec gap, needs bg-architect then bg-backend). The follow-up is sent to a created lead who declined after creation

Where: `_explee_rules.js:514-529` `followUpDecision`; spec D9 "Not sent if"
lists referral, already answered, `can_reply` false, erased, but not a
decline.

Exploit path: account created at 10:00 from a `hot_lead` reply. At 10:30 the
lead replies "not interested" (`can_reply` stays true; only an unsubscribe
blocks replies). With `follow_up_enabled=true` and the default 60 minute
delay, the 11:05 run calls `followUpDecision`, which returns `send`
(measured, section 1), and `followUps` at `explee-import-background.js:907`
posts the "your free account is ready" text into the thread of a person who
just declined. The daily reconciliation would raise
`explee_created_declined`, but only once a day and after the fact.

Fix: in `followUpDecision`, after the erased check, return `skipped_blocked`
when `thread.reply_blocked_reason === 'unsubscribe'` or any label in
`threadIntents({}, thread)` is a decline (`isDeclineLabel(label, exclude)`,
pass the exclude set in through `settings`). Add the case to D9's list and a
rules test. Off by default today (`follow_up_enabled` false), so this blocks
only the switch-on, not the release.

### F3. LOW. Two overlapping runs create two accounts for one company when the brand domains differ only by a subdomain

Where: `explee-import-background.js:600-622` (`duplicateOf` runs before the
reservation and is not repeated after it); migration
`uq_explee_leads_identity_domain` enforces exact equality only.

Exploit path: two live runs overlap (the cron at :35 and a hand
`net.http_post` with body `{}`, D13 hands the owner exactly that statement).
Lead p1 has brand `acme.example`, lead p2 `shop.acme.example`. Run A claims
p1, run B claims p2; both pass `duplicateOf` step 4 before either reserves;
the unique index sees two different values. Measured with `probe_race.js`:
2 `created`. Run one after the other, the same two leads give 1 created and
1 `company_has_account`. Same gap for brand of one lead equal to the email
domain of the other. Consequence: a second Free account for one company
(R10 broken), no data exposure.

Fix: after the reservation succeeds and the daily count passes (`:712`),
re-run `duplicateOf` steps 2 and 4 against `creating`/`created` rows other
than this one; on a match, release the row unless this row's
`(reserved_at, person_id)` is the smaller of the two (deterministic winner,
the loser releases and decides `company_has_account` next run).

### F4. LOW. The kill switch is read before prompt generation, not before the provisioning call

Where: `explee-import-background.js:687-692` reads `mode` and `paused_until`;
`:715-716` then fetches the homepage and runs up to two OpenAI calls (up to
about 52 s); `:733` provisions without a second read.

Exploit path: the owner sets `mode='off'` while a lead's prompts are being
generated. Measured with `probe_kill.js`: the account is still created and
the invite still sent. Spec D8 says "Effective before the next provisioning
call of a running run".

Fix: move the settings re-read (or repeat it) immediately before
`deps.provision(...)`, and on `off`, `dry_run` or a future pause, release the
reservation (`release(run, row, token)` restores the previous decision).

### F5. LOW. A dry run after a live period can write admin notifications and email

Where: `explee-import-background.js:935-938` runs `reconcile` in every mode;
`:983` and `:992` call `notify(..., email: true)` for `created` rows.

Path: settings `live` for a while (created rows exist), then a run with body
`{"mode":"dry_run"}` (D13's hand statement) or the owner flips to `dry_run`.
The first such run at or after 07:00 UTC whose `last_reconcile_date` is not
today emails `explee_created_erased` or `explee_created_declined`, a write
to `admin_notifications` and an email from a dry run. Criterion 13's text
("writes to no table but ...") is met on a fresh account, not after live.
Harm is low (the owner learns something true). Fix: either skip the two
`notify` calls when `run.mode === 'dry_run'` (and do not stamp
`last_reconcile_date`, so the live run does it), or amend D8 to name this
exception. bg-architect to choose.

### INFO

- I1. Reclaim gap: if a run dies between the `clients` insert and the
  `onStep('client')` write (`_provision_client.js:126` to `:142`), the
  reclaimed row has neither id, is decided again (`:481-483`) and a second
  client row is created; the first is an orphan nobody is told about. Spec
  6 accepts "orphan client" for half-made rows only. Fix if wanted: write a
  placeholder `client_slug` on the lead before the insert and look it up on
  reclaim. Requires a kill between two awaited statements.
- I2. Pre-check snapshot window (design-accepted by Rule U step 2): the
  importer loads auth users once per run. A self-serve signup by the same
  address that lands after that load and less than 10 minutes before the
  invite is treated as "ours" if GoTrue returns the unconfirmed user, and a
  later step failure would delete it. Same guard as `resend-invite.js:338`.
- I3. Grants: the migration revokes from `anon` only. `authenticated` keeps
  the default table privileges; RLS with no write policy denies every
  insert, update and delete through PostgREST, so this is defence in depth,
  not a hole. Optional: `revoke insert, update, delete, truncate on ... from
  authenticated;`.
- I4. The other session's `Onboard.tsx` comment says invite links now expire
  "after about an hour". An imported lead receives the generic invite with no
  follow-up until D9 is switched on, so many links will expire unused. This
  is Q3 and Q4 of the spec, not a defect of this build; worth answering
  before `live`.

---

## 4. Auth, RLS and abuse trace

- **Gate.** `handler` (`explee-import-background.js:1044-1060`) calls
  `requireCronAuth(event)` as its first statement; on refusal it returns
  before `runImport`, so no `job_runs` row is written (test "a refused gate
  writes no job_runs row and builds no deps"). `_cron_auth.js` fails closed
  (503 when `CRON_SECRET` is unset, 401 otherwise, constant-time compare).
  `withObservability` wraps the handler, and the handler never throws, so
  Netlify never retries it. The body can only lower `live` to `dry_run`
  (`:1051`, `:172`).
- **Unauthenticated caller** of the importer: 401/503 from the gate, nothing
  read or written. **Free-tier viewer**: has no path into the importer or the
  helper; `onboard-client.js` answers 401/403 from `requireAuth` with
  `adminOnly`; the two new tables return 0 rows (SELECT policy
  `public.is_admin()` only, no write policy, `anon` revoked). Not probed on a
  database (criterion 25).
- **Role.** The importer imports only `provisionViewerClient`
  (`:31`), which passes the literal `'viewer'` (`_provision_client.js:244`).
  `provisionAdminWizardClient` coerces anything but `'admin'` to `'viewer'`
  (`:248`). No `'admin'` literal in the importer or the rules module (grep and
  the source-text test).
- **Delete or re-bind a login it did not create.** Pre-check against every
  auth user before any write (`_provision_client.js:97-99`); a returned user
  whose id was in the pre-check set or is older than 10 minutes is neither
  bound nor deleted (`:164-173`); `deleteUser` is only reached through
  `rollbackUserAndClient`, which runs only after `ours` is true. An
  incomplete listing creates nothing (`:98`). Traced; no path found.
- **Two accounts for one person or company.** Claims are a compare-and-swap
  on `state`, `attempts`, `claimed_at` (`:408-418`), which Postgres
  re-evaluates after the competing row lock under READ COMMITTED, so one run
  wins. The identity reservation (`:696-704`) is one conditional UPDATE; a
  concurrent identical `email_sha256` or `brand_domain` gets 23505 once the
  first commits, and the loser releases. Gap: F3 (non-equal related domains).
- **Address not literally in the reply.** Replier: only the listing email
  that equals a reply `from_email` (`_explee_rules.js:207-214`). Referral:
  `extractReferral` returns only a lowercase substring of the stripped body,
  asserted twice (`:283`, `:295`), on the brand or replier domain or a
  subdomain, never ours, never a no-reply local part, never an excluded
  domain, exactly one candidate. The enriched `LeadProfile.email` is never
  an invitee. A replier on a different domain from the brand IS invited
  (spec D5 allows it; 4 of 13 live repliers).
- **Declined, unsubscribed, erased, Lost between runs.** Every create is
  re-decided from this run's listing item and thread (Rule F, `:524`), and a
  listing that is not complete decides nothing (`:278`). `would_create` rows
  are re-taken in live (`:286`). Rule 2 checks every label in the thread, so
  an earlier decline beats a later `hot_lead`. After creation: F2.
- **Create or send in dry run or off.** `off` returns after purge (`:174`).
  The dry run never reaches `createLive` (`:567-585`) and its Explee client
  has no POST functions and refuses non-GET (`_explee_client.js:83`, `:137`).
  Exceptions: F4 (off during generation), F5 (reconcile notifications).
- **Leaks.** The key is only in the `X-API-Key` header
  (`_explee_client.js:62`); errors carry a code only. `job_runs.detail`
  holds counts, codes, `person_id`s and the owner's project names; labels go
  through `safeLabel` (`[a-z0-9_]`). Log lines carry client ids and
  `person_id`s only. Admin notifications carry client ids, `person_id`s and
  sanitised labels; the summary strips `@` (`:1037`). Explee notes carry the
  masked address (`maskEmail`) and the client id.
- **Reply text into the prompt generator.** `generateValidated` passes the
  brand domain, the country name, the cleaned Explee company name and the
  homepage signal only (`:634`); `generateClientPrompts` strips anything
  shaped like an address and quotes (`_prospect_prompts.js` `cleanForPrompt`)
  and tells the model to treat the user message as data. No reply body,
  excerpt or person name reaches it. The output passes `validatePrompts`
  (no URL, no `@`, no brackets, no brand term) before any write.

---

## 5. Accessibility

Not applicable: no UI in this build (server functions, tests, one migration).

---

## 6. onboard-client.js against HEAD, line by line

Kept identical: `requireAuth({ adminOnly: true })` first; 405, 400 invalid
JSON, 400 missing `name`/`slug`/`contact_email`, 400 unknown plan text;
`DEFAULT_PLAN` and role coercion; client row columns (`name`, `slug`,
`brand_website`, `brand_aliases`, `known_competitors`, `plan`,
`refresh_cadence` via `refreshCadenceFor`, `last_refresh_at` stamped,
`default_market_id`/`default_region_id` or null); invite to
`https://app.getbrandgeo.com/reset-password`; profile row
`{ id, client_id, role }`; prompt rows (same mapping, one insert); rollback
order; the audit row last and non-fatal with the same meta keys
(`plan_provided` now arrives through `ctx.meta`); the 200 response keys and
values; every 409 and 500 text (`wizardError`, `onboard-client.js:186-207`).

Behaviour for a NEW address: identical, with three differences, none
harmful:
1. One extra paged `listUsers` pass before the insert. If it errors or hits
   20 pages of 1,000, the wizard now answers 500 "the existing logins could
   not be checked" where it used to proceed.
2. `contact_email` is trimmed before the invite (`_provision_client.js:92`);
   HEAD passed it raw.
3. A non-string `slug` (never sent by the wizard UI) is treated as absent,
   so a slug is derived from `brand_website` with retries; HEAD used it as
   given.

Deliberate change (spec 5.4): an address with any existing auth user gets
the existing "already has an account" 409 before anything is written,
instead of a re-invite, a possible bind, and a possible delete of that user.
This closes the pre-existing defect at HEAD `onboard-client.js` where the
profile-failure rollback deleted the user the invite returned, even one that
predated the call.

---

## 7. Regression surface (grep, not intuition)

- `_provision_client.js` is required by `onboard-client.js` and
  `explee-import-background.js` only. Manual look: the admin wizard
  (D13 step 4 smoke test: create and delete one test client).
- `_prospect_prompts.js` gained two exports; existing exports untouched
  (diff is additive, `+118`). Its importers (`audit-domain.js`, the prospect
  functions, now `_explee_rules.js`) are unaffected by the diff.
- `_explee_rules.js` requires `_prospect_prompts.js` at load; that module has
  no top-level I/O.
- `tests/helpers/fake_supabase_mem.js` is shared by other sessions' tests
  (`affiliate_*`, `resend_invite`); I did not run those.
- `tests/refresh_cadence.test.js` now names `_provision_client.js`; it passes.

---

## 8. Data and claim integrity

No user-facing number or copy in this build. The live facts in the brief
(13 human repliers, 17 classified conversations, label set) are reflected in
the default label sets of the migration and `SETTINGS_DEFAULTS`
(`explee-import-background.js:47-54`), which match spec R6 and R7.

---

## 9. What was not checked

- tsc, `npm run build`, the bundle size (criteria 1 and 26): forbidden here.
- Every test file other than the four this build touches, including the
  other sessions' tests that import the modified fake (criterion 21).
- The migration on a real database, the RLS probe as anon, viewer and admin,
  and `is_admin()` behaviour (criterion 25).
- Real GoTrue behaviour: the answer of `inviteUserByEmail` for an existing
  unconfirmed user, whether `listUsers` caps `per_page` below 1,000 (if it
  does, `users.length < perPage` ends the pass early and Rule U's pre-check
  misses users beyond the first page; same assumption as `resend-invite.js`),
  and SMTP limits.
- Real Explee behaviour, including whether a spoofed `From` on a reply is
  recorded as `from_email` (would let a third party pick the invitee address;
  the invite still goes to that address, not to the attacker).
- `withObservability` internals and Sentry scrubbing on this function.
- The homepage fetch following redirects to any host (pre-existing, spec 10
  declined it).
- Prompt quality, CJK and Thai validation edge cases, market resolution
  details: the other review lenses.
- A dash scan with a positive control over the added lines (I read the new
  files and saw none, which is weaker than a scan).
- The other sessions' uncommitted work in the same tree (`resend-invite.js`,
  `PendingInvitesPanel.tsx`, `netlify.toml`), beyond confirming it is not this
  build's.
