PASS WITH FINDINGS

# Explee lead import, fix round re-review: account safety, auth and abuse

```
INTENT: re-review the rev 3 fix round of the Explee lead import  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, lens ACCOUNT SAFETY, AUTH AND ABUSE. Date 2026-11-11.
Contract: `docs/arch/explee-lead-import.md`, revision 3 (section 0 table and
criteria 27 to 49). Subject: the UNCOMMITTED working tree on `main`. First
round: `docs/qa/explee-lead-import-build-review-auth-2026-11-11.md`.

Verdict in one line: all eleven findings of this lens are closed by my own
runs. Nothing blocks the release as it ships (mode `dry_run`, cron commented
out, no migration applied). One MEDIUM (V1) and three LOW (V2 to V4) are new
or newly demonstrated and must close before `mode='live'` (V1, V2, V3) or
before `follow_up_enabled=true` (V4). No live exposure: nothing is deployed.

---

## 0. Calibration

1. Scope: `git status` shows the 13 build files (4 modified tracked, 9 new)
   plus other sessions' dirty files (`netlify.toml`, `resend-invite.js`,
   `unlock-audit-report.js`, `Onboard.tsx`, `PendingInvitesPanel.tsx`,
   affiliate tests, web and growth docs), the same set the first round
   attributed to other sessions. Nothing new outside the build's scope.
2. Secret scan: no key or token value in any of the 13 files (read in full
   for the function files; tests use `*-placeholder` strings). Count 0.
3. Criteria: every rev 3 criterion of this lens is checkable on the fakes,
   except the database half of 33 (needs a production copy).
4. Baseline: tsc and build not run (forbidden). The four test files pass.
5. Most sensitive path: `_provision_client.js` `provision()`, reached by
   `onboard-client.js:72` (`requireAuth(event, { adminOnly: true })`) and by
   `explee-import-background.js:1392` (`requireCronAuth(event)`).
6. Writes: this file only. Probe scripts lived in the session scratchpad,
   outside the repo, and were deleted after the run.

CALIBRATED

---

## 1. Commands run (pasted, trimmed to result lines)

```
$ node tests/explee_rules.test.js       -> 134 passed, 0 failed   (exit 0)
$ node tests/explee_import.test.js      -> 86 passed, 0 failed    (exit 0)
$ node tests/provision_client.test.js   -> 41 passed, 0 failed    (exit 0)
     section 1 ran against the real feed1d5 (git show readable), 11 before/after scenarios ok
$ node tests/refresh_cadence.test.js    -> 17 assertions passed.  (exit 0)
$ node --check explee-import-background.js _explee_rules.js _explee_client.js
               _provision_client.js onboard-client.js _prospect_prompts.js   -> ok x6

$ rg -c "<class of U+2014 and U+2013>" <the 13 files>
  tests/refresh_cadence.test.js:8  netlify/functions/onboard-client.js:6  netlify/functions/_prospect_prompts.js:19
$ positive control file with one em and one en dash -> 2
$ git diff -U0 -- <those 3 files and fake_supabase_mem.js> | rg "^\+" | rg -c "<same class>"  -> no match in any (0)
  => every dash is in pre-existing lines; the added lines carry none.

$ rg -o addresses in the 13 files, excluding .example and example.com:
  ANA@Acme.Example (case test), xbo@acme.examplex (negative test),
  ana@getbrandgeo.com, ana@mail.trybrandgeo.com, sales@getbrandgeo.com
  => the last three are invented local parts on our own domains, required by
     criterion 48 (A3 tests); no real person, lead or company.
```

---

## 2. Findings of the first round and rev 3 additions, one by one

| Id | State | Evidence (my own run unless stated) |
|---|---|---|
| F1 / M1 (C1 to C4) | CLOSED | `p1_caps.js`, 12 qualifying leads, live, caps 5/30, 3 hourly runs. Profile insert failing: 1 invite per run, 3 distinct addresses, 0 re-invites, rows `failed:provision_error:final=true:reserved=y` x3, `createsToday` 1, 2, 3. Variations not in the builder's test, same result: prompts insert failing (rollback with profile), and the `onStep('invite')` progress write failing after the invite. Round one measured 12 invites per run and 36 in total. Fix at `explee-import-background.js:971` (count before the call), `:1048-1055` (post-invite final, `reserved_at` kept), `:1060` (stop creation), `:819-825` (window). Residual: V2 (the `half_made` branch). |
| F2 | CLOSED | `p2_followup.js` on `followUpDecision` (`_explee_rules.js:618-640`): `not_interested` (as "Not Interested"), `do-not-contact`, a decline only on the listing item, only on `thread.latest_intent`, `lead_status` "LOST" and " Unqualified ", `reply_blocked_reason='unsubscribe'`, a custom exclude label: each `skipped_declined`; listing incomplete: `wait`. End to end: created 10:00, "Do Not Contact" reply 10:30, run 11:05: 0 reply POSTs, `skipped_declined`; control without the decline: 1 POST, `sent`. Residual: V4 (labels outside the regex). |
| F3 | CLOSED | `p3_race.js`, two live runs with `Promise.all`: acme / shop.acme, acme / brand other with invitee at sales.acme, acme / www.ACME, one free-mail address under two companies: each 1 created, 1 invite, 1 client. Forced interleave where BOTH runs reserve before EITHER re-checks (`conflictAfterReservation` select held until both arrive): 0 created, then the sequential run creates exactly 1. The re-check reads after its own reservation committed, so two conflicting rows cannot both miss each other. New hole next to it: V3. |
| F4 | CLOSED | `p4_kill.js`, settings changed while a lead is prepared: mode `off` in the generator, `dry_run` in the homepage fetch, an invalid mode, the settings row deleted, `paused_until` one minute ahead: each 0 clients, 0 invites, row back to `seen`, `reserved_at` null, `createsAttempted` 0. Control (`paused_until` in the past): 2 created. Read at `:963`, nothing awaited between it and `deps.provision` at `:974`. Round one: account created. |
| F5 | CLOSED | `p5_dry.js`, variation the builder's test does not cover: live period (3 created), then the SETTINGS row flipped to `dry_run` (not the body), with an erased created lead, a declined created lead, a stale `creating` row with `client_id`, a stale `creating` row with `pending_slug`, follow-up on, summary and reconcile dates yesterday, 08:00 UTC: 0 events, 0 suppressed (no event was even attempted), 0 invites, 0 Explee POSTs, 0 deletes, tables written `explee_import_settings, explee_leads, job_runs` only; both stale `creating` rows left untouched for the live run (`:338`); `summary=skipped_dry_run`; `last_reconcile_date` unchanged. Mode `off`: 0 Explee calls, only `job_runs` written. |
| auth I1 / L7 | CLOSED | `p6_orphan.js`: (a) our orphan stored as `https://www.ACME.example/`: `failed half_made`, `client_id` recorded, 1 orphan event, 0 inserts, 0 deletes. (b) slug held by another customer on another website: not taken as ours, no event, the lead is decided again and created on a suffixed slug. (d) no client with that slug: decided again, created. (e) the `pending_slug` write failing: 0 clients, 0 invites, `provision_error` non-final, `reserved_at` null. Fix `:604-628`, helper `_provision_client.js:158-162`. Residual INFO I-2 (case c). |
| auth I3 | CLOSED (text); DB half NOT CHECKED | `db/supabase-explee-lead-import-2026-11-11.sql:126` is the exact line of criterion 33; `explee_import.test.js` section 29 pins it, the dry_run default (`:26`), no live `cron.schedule` (`:202` commented), no write policy. The test fails on the round one file (the line was absent). `has_table_privilege` on a database: not run, no Supabase access. |
| listUsers paging | CLOSED | `p7_paging.js` against `loadAuthEmails` (`_provision_client.js:61-86`): supabase-js shape with `nextPage` and a 50 cap ends only at `nextPage === null`; without `nextPage` ends only on an empty page; an EMPTY middle page with `nextPage: 3` does not end the pass (found the user on page 3); `nextPage: undefined` treated as absent; error on page 3, throw: `complete:false`. Residual INFO I-3. |
| A1 | CLOSED | `p8_aliases.js`: `aliasesWithName` adds no empty and no duplicate of its own: name first, every case or space variant of the name removed, the rest unchanged in order (pre-existing empties or duplicates in the INPUT pass through untouched, as the spec says "nothing else changes"); blank, null or non-string name leaves the list as given. Both paths store `["acme studio","acme"]`; wizard role `admin` kept, viewer path `viewer`. The `feed1d5` parity test ran for real: `brand_aliases` is the only differing client column in every scenario, the 200 response has no alias field, the result keys are unchanged. |
| A2 | CLOSED | `followUpBodyValid` rejects `{score}`, `{mentions}`, `%`, `{{brand}}`, `{Brand}`, `{ brand }` and an unclosed brace; accepts `{brand}` and `{first_name}` only. `renderFollowUp` (`:1149-1153`) reads `clients.name` and the thread's first name (letters only); `followUps` (`:1161-1236`) reads no result table. A literal figure typed by the owner (e.g. "42") or a fullwidth percent passes, which is owner-authored copy, not a measured figure. |
| A3 | CLOSED | `p9_own.js` on `qualifyLead`: subdomain `ana@mail.trybrandgeo.com`, `ANA@GetBrandGEO.COM`, a trailing dot, padding, a persona sender `team@persona.example` with replier on it or on `eu.persona.example`, an upper-case persona sender, a referral body naming `bob@persona.example`, a referral body naming `sales@getbrandgeo.com` (no invitee), company domain `getbrandgeo.com` with a body naming a colleague there, company domain `WWW.TryBrandGeo.com`: every one `own_sender_domain` or no invitee. Control on `acme.example`: create. `rulesHash` changes with the setting. Residuals INFO I-1. |

---

## 3. New findings, ranked

### V1. MEDIUM. The run-start auth snapshot lets the importer delete (or bind) a self-serve login created during the run

Where: `explee-import-background.js:378` loads `run.authEmails` once, before
the decide loop, and `:991` passes that snapshot to every provisioning call
of the run (up to about 13 minutes later); `_provision_client.js:212-214`
then treats the invite's returned user as ours when it is not in the
snapshot and was created less than 10 minutes before the call.

Exploit path (demonstrated, `p10_snapshot.js`): a lead who replied hot signs
up by themselves on the site while the run is preparing their prompts (the
outreach mail points at the site, so this is the expected next step of an
interested lead). Their auth user is pending and has its own viewer profile.
GoTrue's invite to an unconfirmed address re-sends and returns that user;
it is absent from the snapshot and fresh, so `ours` is true. The importer's
`user_profiles` insert then collides with the user's own profile (a
deterministic failure, not a coincidental fault) and
`rollbackUserAndClient` calls `deleteUser` on it. Measured: 1 invite,
`deletedUsers=["self-serve-user"]`, the self-serve user gone, their profile
row orphaned, the lead `failed provision_error`. If the self-serve profile
does not exist yet, the same path BINDS that login to the importer's new
client instead. Round one recorded this window as INFO I2 ("design
accepted"); the probe shows the triggering failure is caused by the race
itself, so it is not rare once the race happens.

Fix (bg-architect rules, bg-backend builds): reload the auth check for the
invitee immediately before each provisioning call (call
`deps.loadAuthEmails(sb)` again, or let the helper load per call as the
wizard does; at most 5 calls a run), and for the importer path require
`created_at >= callStart - 60 s` instead of 10 minutes. Add a test: a user
created between the run's snapshot and the invite is `email_registered`,
0 deletes, 0 binds. Must close before `mode='live'`.

### V2. LOW. A `half_made` after a sent invite escapes the daily cap and the same-address suppression

Where: `explee-import-background.js:1036-1046` records `rollback_failed`
(and `:595` a reclaimed row with ids) as `failed half_made` with
`reserved_at` kept; `dailyWindowCount` (`:824`) counts only `creating`,
`created` and `provision_error`; `SUPPRESSING_REASONS` (`:55`) holds
`erased`, `hidden`, `provision_error`, not `half_made`. Spec C2 lists only
`provision_error`, so this is a spec gap.

Path (demonstrated, `p1b_halfmade.js`): profile insert failing and the
rollback's client delete failing too. With `max_creates_per_day = 1`, four
hourly runs send 4 invites (the window reads 0 each time). With one
free-mail address under two `person_id`s of different companies, the first
attempt `half_made` and the second run healthy: the same address is invited
twice (control with a plain `provision_error`: once, the second row
`already_customer`). Needs two database failures in one call, so it is
rare.

Fix: count `failed half_made` rows with `reserved_at` in the window and add
`half_made` to `SUPPRESSING_REASONS`; amend D8 C2 and D5 duplicate 2. Test:
the two probe scenarios above give 1 invite.

### V3. LOW. The F3 re-check and D5 duplicate 4 disagree, so a lead can be released every run forever

Where: `conflictAfterReservation` (`:802-812`) matches this row's domains
against the other row's `brand_domain` OR `email_domain`; `duplicateOf`
step 4 (`:789-793`, spec D5 item 4 at line 595) matches only the other
row's `brand_domain`. Spec D8 step 2 promises "the next run decides it
sequentially".

Path (demonstrated, `p3b_livelock.js`, no overlap needed): p2 is created
with brand `other.example` and invitee `bo@sales.acme.example`; later p1
(brand `acme.example`) qualifies. Every run: p1 passes D5, reserves, the
re-check matches p2's `email_domain`, p1 is released to `seen`, not final.
Runs 1 to 4: `reservationRechecks=1`, 3 or 4 Explee calls for nothing, no
decision, never in the summary. Fail-safe (0 invites) but a permanent loop
and a lead nobody is told about. The criterion 29 second case passes only
because its winner is p1.

Fix: make D5 duplicate 4 compare against the other row's `email_domain`
too (excluded domains dropped, as the re-check does), so the sequential run
gives `company_has_account`. bg-architect amends D5, bg-backend builds; add
the probe scenario as a test.

### V4. LOW (spec gap). The follow-up is sent after a post-creation label the decline regex does not match

Where: `followUpDecision` (`_explee_rules.js:629-631`) skips only labels in
`exclude_intents` or matching `DECLINE_RE` (spec D3 rule 2).

Path (demonstrated, `p2_followup.js`): a created lead later labelled
`opted_out` or `wrong_person`: `followUpDecision` returns `send`.
`DECLINE_RE` has `opt_?out`, which does not match `opted_out`. The same gap
lets an earlier `opted_out` label pass Rule 2 before creation, but there an
unknown label is held only when it is the LATEST label. Off today
(`follow_up_enabled=false`).

Fix: for the follow-up, send only when every reply label after
`created_at_account` is in `include_intents` (anything else:
`skipped_declined` or a held status), and widen the regex to `opt(ed)?_?out`.
bg-architect, then bg-backend. Blocks only the follow-up switch-on.

### INFO

- I-1 (A3 residuals). `isOwnDomain` is one direction only: with outbound
  sent from `team@mail.persona.example`, a replier at `persona.example`
  (the parent) is created. An owner who sets `own_sender_domains = '{}'`
  drops the two defaults too (`normaliseSettings` keeps any array). A thread
  whose sent messages carry no `from_email` is guarded by the setting only.
  None was asked for in criterion 48; worth a ruling before live.
- I-2 (I1 residual). A client on the SAME website and slug made by someone
  else after the kill and before the reclaim (for example the admin
  onboarding that very lead by hand in the wizard) is taken as the orphan:
  the emailed event says "Delete what is left by hand" about a real client
  (`p6_orphan.js` case c). Nothing is deleted by code. A creation time check
  against `claimed_at` would narrow it; spec 10 declined a time-based lookup.
- I-3 (paging). With the production default `maxPages = 20` and a GoTrue
  that serves 50 a page, the pass is incomplete past 1,000 users, so the
  wizard answers 500 and the importer stops (fail closed; criterion 34's
  "page 30" test passes only with `maxPages: 60`). A page whose `data` has no
  `users` array and no `nextPage` reads as an empty page and ends the pass
  complete with 0 users; supabase-js never returns that shape.
- I-4 (time guard). `createLive` checks `canCall` once at entry (`:898`);
  the homepage read and up to two OpenAI calls follow, then provisioning
  starts with no further check, so a lead entering at 12:59 can provision
  after 13 minutes. A kill there is caught by the reclaim. Ops lens.

---

## 4. Answers to the extra questions

- Invite the same address twice: only through V2 (and V1 re-invites a
  pending self-serve user once). Every other path I tried sends one invite
  per address.
- Exceed a cap: the per-run and referral caps hold (counted before the
  call); the daily cap is exceeded only through V2.
- Create in `dry_run` or `off`: no, by settings row, by body, mid-run (F4,
  F5 rows above).
- Bind or delete a login the call did not create: yes, V1 (the run snapshot
  window). Pre-check members, logins older than 10 minutes, and every login
  on the wizard path are never deleted or bound.
- A3 by subdomain, letter case, or a referral address in the body: no
  bypass found; residuals in I-1.
- A1: no empty alias and no duplicate of its own; the wizard's only change
  is `brand_aliases`.

---

## 5. Regression surface (grep)

- `_provision_client.js` is required by `onboard-client.js` and
  `explee-import-background.js` only. Manual look: one wizard create and
  delete of a test client (D13 step 4).
- `tests/helpers/fake_supabase_mem.js` gained opt-in options only; the
  other sessions' suites that import it (`affiliate_*`, `resend_invite`)
  were not run by me.

---

## 6. What was not checked

- tsc, `npm run build`, every other test file (forbidden or out of lens).
- Criterion 33 on a database (`has_table_privilege`), the RLS probe as anon,
  viewer and admin, the migration itself.
- Real GoTrue: the invite answer for an unconfirmed existing user (V1
  assumes the re-send behaviour `resend-invite.js` relies on), whether a
  failed invite email leaves a user, the real `per_page` cap.
- Whether self-serve signup writes `user_profiles` before email
  confirmation (decides between the delete and the bind outcome of V1).
- Real Explee label names (V4 depends on which labels Explee emits) and
  whether sent messages always carry `from_email` (I-1).
- Criteria 35, 36, 37 to 45 beyond what the test runs show: ops and prompt
  lenses.
- `_cron_auth.js` and `withObservability` internals (unchanged since round
  one, not re-read).
