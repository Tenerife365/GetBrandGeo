PASS WITH FINDINGS

# Explee lead import, second fix round re-review: account safety, auth and abuse

```
INTENT: re-review the rev 4 fix round of the Explee lead import  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Reviewer: bg-verify, lens ACCOUNT SAFETY, AUTH AND ABUSE. Date 2026-11-11.
Contract: `docs/arch/explee-lead-import.md`, revision 4 (section 0 table,
D3 own-domain guard, D8 Rule U, criteria 50 to 54). Subject: the UNCOMMITTED
working tree on `main`. Previous round of this lens:
`docs/qa/explee-lead-import-fix-rereview-auth-2026-11-11.md` (V1 MEDIUM, V2 to
V4 LOW, I-1 INFO).

Verdict in one line: V1, V2, V3, V4 and I-1 are CLOSED by my own runs on the
repo's fakes, every earlier probe that touches the changed lines still holds,
and no new hole of MEDIUM or higher was found. Two INFO residuals of the
5 second "ours" window are recorded (N-1, N-2). Nothing blocks shipping in
`dry_run` with the cron off; nothing in this lens blocks `mode='live'` later,
subject to the real-GoTrue checks listed in section 6.

---

## 0. Calibration

1. Scope: `git status` shows the build files (4 modified tracked:
   `onboard-client.js`, `_prospect_prompts.js`, `fake_supabase_mem.js`,
   `refresh_cadence.test.js`; new: `_explee_rules.js`, `_provision_client.js`,
   `explee-import-background.js`, `_explee_client.js`, the migration, three
   test files, `fake_explee.js`) plus other sessions' dirty files
   (`netlify.toml`, `resend-invite.js`, `unlock-audit-report.js`,
   `Onboard.tsx`, `PendingInvitesPanel.tsx`, affiliate tests, web and growth
   docs, `.claude/agents`), the same set the earlier rounds attributed to
   other sessions. The builder's changed list sits inside the 13 files.
2. Secret scan: 12 pattern hits on the tracked diff, every one an identifier
   or prose (`apiKey` read from `process.env`, `max_tokens`, "password" in a
   removed comment, `redirectTo`); 0 values. A value-shaped scan
   (`sk-...`, `pk_live`, a quoted `service_role`) over all 13 files: 0.
3. Criteria 50 to 54 are objectively checkable on the fakes; I checked each.
4. Baseline: tsc and build not run (forbidden). The four test files pass.
5. Most sensitive function: `_provision_client.js` `provision()`, reached by
   `onboard-client.js` behind `requireAuth(event, { adminOnly: true })` and
   by `explee-import-background.js` behind `requireCronAuth(event)` (both
   unchanged this round, not re-read in full).
6. Writes: this file only. Probe scripts lived in the session scratchpad
   (`probes/harness.js`, `v1_helper.js`, `imp.js`, `rules.js`, `regress.js`),
   outside the repo, deleted after the run.

CALIBRATED

---

## 1. Commands run (pasted, trimmed to result lines)

```
$ node tests/explee_rules.test.js       -> 155 passed, 0 failed   (exit 0)
$ node tests/explee_import.test.js      -> 111 passed, 0 failed   (exit 0)
$ node tests/provision_client.test.js   -> 51 passed, 0 failed    (exit 0)
     section 1 "wizard before (feed1d5) and after, identical fakes" ran (git show readable):
     11 before = after scenarios ok, plus "the A1 difference really shows"
$ node tests/refresh_cadence.test.js    -> 17 assertions passed.  (exit 0)
$ node --check  explee-import-background.js _explee_rules.js _explee_client.js
                _provision_client.js onboard-client.js _prospect_prompts.js   -> ok x6

$ rg -c "<class of U+2014 and U+2013>" <9 new files, whole>          -> no match (exit 1)
$ git diff -U0 <4 modified files> | rg "^\+" | rg -c "<same class>"   -> 0, 0, 0, 0
$ positive control file with one em and one en dash                   -> 2

$ rg -o addresses in the 13 files, minus .example, example.com, getbrandgeo.com, trybrandgeo.com
  1 xbo@acme.examplex   (the existing negative test of the address regex)
```

---

## 2. Items, one by one

| Id | State | Evidence (my own runs) |
|---|---|---|
| V1 (crit. 50) | CLOSED | Helper and importer probes below. A login that appears after the run snapshot and before Check B, with or without a profile, in mixed case, during the homepage read (a point the builder's test does not use): 0 invites, 0 deletes, 0 profile inserts, 0 clients, user alive, lead `skipped already_customer final`. Lead 2's address registered WHILE lead 1 provisions (stale snapshot for lead 2): lead 1 created, lead 2 `already_customer`, 0 invites to lead 2, 0 deletes. Between Check B and the invite, invite re-sends to the pending user: created 6 s before `T_inv` with or without a profile, not ours, 0 binds, 0 deletes, client rolled back, `inviteSent`; 1 s or 0 s with a profile: 23505 profile proof, 0 deletes, profile unchanged. Confirmed user in the same gap: GoTrue refuses, `email_registered`, 0 invites sent as re-send, 0 deletes. Not ours AND the client delete failing: `half_made`, user alive, 0 deletes, `invite_sent_at` set, orphan event. Check B listing throwing: `auth_lookup_incomplete`, client rolled back, wizard 500. Next hourly run after a not-ours: `day_cap` with cap 1 (the `invite_sent_at` row stays in the window). Wizard: every case answers 409 (or 500 for the incomplete listing) with 0 deletes and 0 binds; a new address makes exactly 2 listing passes (Check A, Check B) and stores `["acme studio","acme"]`; the feed1d5 parity section passes, `brand_aliases` the only client column difference. Residuals inside the documented 5 s window: N-1, N-2. Fix sits at `_provision_client.js:214-252` and `:277-284`, importer `explee-import-background.js:1070-1085`. |
| V2 (crit. 51) | CLOSED | Previous round's `p1b_halfmade` re-run: cap 1, profile insert and rollback client delete failing, 4 runs, 4 leads: 1 invite in total (was 4), stops `provision_error, day_cap, day_cap, day_cap`, first row `failed half_made final` with `invite_sent_at`. One free-mail address under two companies, first `half_made`, second run healthy: 1 invite (was 2), second row `already_customer`. Variation not in the builder's test: the `onStep('invite')` progress write failing (post-invite `provision_error` whose stamp comes from `result.userId`, not from `onStep`), cap 1, the same address under a second company, 3 runs then +25 h: invites `bo@mailbox`, then nothing until the window expires, then `lead3` created; the second company's row `already_customer`. `suppresses()` matrix: only `invite_sent_at` true, final `half_made` true, non-final `half_made` false, non-final `provision_error` false, plain `already_customer` false. Fix `_explee_rules.js:329-334`, importer `:793-797`, `:839-849`, `:999`, `:1067-1068`. |
| V3 (crit. 52) | CLOSED | Previous round's `p3b_livelock` re-run (p2 created, brand `other.example`, invitee at `sales.acme.example`; p1 brand `acme.example`): 4 runs, `reservationRechecks` 0, 0, 0, 0 (was 1 every run), p1 `skipped company_has_account final`, 0 invites. Variations: the other row still `creating` (another run mid-flight) with email at `acme.example` and p1 at `shop.acme.example`: `company_has_account`, 0 rechecks, 0 invites. Free-mail on both sides with different brands: created (no over-block). Unit: `(['acme.example', null], ['other.example', 'sales.acme.example'])` true; `(['acme.example','gmail.com'], ['other.example','gmail.com'])` false; case and trailing dot true. Both callers use `R.companyConflict` (`:809`, `:827`). |
| V4 (crit. 53) | CLOSED | `followUpDecision`, created 10:00, run 11:05, include `hot_lead`: hot then `opted_out` or `Opted-Out` `skipped_declined`; hot then `wrong_person`, then `interested`, then `no_interest` `skipped_label`; `out_of_office` before hot `skipped_label`; item `latest_intent` null `skipped_label`; listing-only `wrong_person` `skipped_label`; all hot (one message intent null) `send`. Decline regex: `opted_out`, `optedout`, `opt_out`, `optout`, `opted-out`, `Opted Out` true; `opted_in`, `opt_in` false. `qualifyLead` with an earlier `opted_out` then `hot_lead`: `skip declined final`. Fix `_explee_rules.js:27`, `:699-708`. Off today (`follow_up_enabled=false`). |
| I-1 (crit. 54) | CLOSED | Both directions: under a default true; parent of the sent domain (`persona.example` vs `mail.persona.example`) true; grandparent true; a bare label `example` false; lookalikes `notgetbrandgeo.com` and `getbrandgeo.com.evil.example` false; `GetBrandGEO.com.` true. Defaults always on: setting `[]`, `null`, missing, a non-array string, `['']`: a replier at `getbrandgeo.com` and a company `WWW.TryBrandGeo.com` are each `own_sender_domain`; `rulesHash` identical for `[]`, null, missing, string, `['']` and the explicit defaults, different when a domain is added. `qualifyLead`: replier at the parent of the sent domain `own_sender_domain` held; a referral body naming a colleague at that parent `own_sender_domain`; control at `acme.example` with sent from `sales@getbrandgeo.com` creates. Importer section 34 (setting `[]`) passes. Fix `_explee_rules.js:64`, `:212-246`. |

Earlier probes re-run on the lines this round touched (all hold):

| Earlier item | Result now |
|---|---|
| F1 caps (round one `p1_caps`): 12 leads, profile insert failing, 3 runs | 1 invite per run, 3 distinct addresses, `createsToday` 1, 2, 3 |
| F1 healthy, day cap 3, 2 runs | 3 created in run 1, 0 in run 2 |
| F3 race, `Promise.all`, `acme` vs `shop.acme` | 1 invite, 1 client, 1 created |
| F3 race, one free-mail address under two companies | 1 invite, 1 client |
| F5 `dry_run` settings row, 3 qualifying leads | 0 invites, 0 clients, 0 deletes, 0 Explee POSTs, 1 read-only `listUsers` pass |

---

## 3. Probe output (pasted, provision log lines removed)

Helper level, `v1_helper.js` (viewer path; the wizard path printed the same
counts, with `http` 409 on every refusal and 500 on F):

```
viewer A: pending user before Check A => {"code":"email_registered","stage":"precheck","invites":0,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":0}
viewer B: after snapshot, before Check B, profile=true => {"code":"email_registered","stage":"precheck","inviteSent":false,"invites":0,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":1}
viewer B: after snapshot, before Check B, profile=false => {"code":"email_registered","stage":"precheck","inviteSent":false,"invites":0,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":0}
viewer C: between Check B and invite, created 6s before T_inv, profile=true => {"ok":false,"code":"email_registered","stage":"invite","inviteSent":true,"invites":1,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":1}
viewer C: between Check B and invite, created 1s before T_inv, profile=true => {"ok":false,"code":"email_registered","stage":"profile","inviteSent":true,"invites":1,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":1}
viewer C: between Check B and invite, created 0s before T_inv, profile=true => {"ok":false,"code":"email_registered","stage":"profile","inviteSent":true,"invites":1,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":1}
viewer C: between Check B and invite, created 6s before T_inv, profile=false => {"ok":false,"code":"email_registered","stage":"invite","inviteSent":true,"invites":1,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":0}
viewer C: between Check B and invite, created 1s before T_inv, profile=false => {"ok":true,"inviteSent":false,"invites":1,"deletes":0,"foreignAlive":true,"binds":1,"clients":1,"profiles":1}
viewer C: between Check B and invite, created 0s before T_inv, profile=false => {"ok":true,"inviteSent":false,"invites":1,"deletes":0,"foreignAlive":true,"binds":1,"clients":1,"profiles":1}
viewer C2: between Check B and invite, 1s, no profile, prompts insert fails => {"ok":false,"code":"db_error","stage":"prompts","invites":1,"deletes":1,"foreignAlive":false,"binds":0,"clients":0,"profiles":0}
viewer D: confirmed user between Check B and invite => {"ok":false,"code":"email_registered","stage":"invite","inviteSent":false,"invites":1,"deletes":0,"foreignAlive":true,"binds":0,"clients":0,"profiles":1}
viewer E: not ours (6s) and client delete fails => {"code":"rollback_failed","stage":"invite","inviteSent":true,"clientId":1,"userId":null,"invites":1,"deletes":0,"foreignAlive":true,"binds":0,"clients":1,"profiles":0}
viewer F: Check B listing throws => {"code":"auth_lookup_incomplete","stage":"precheck","invites":0,"deletes":0,"binds":0,"clients":0,"profiles":0}
viewer G: new address => {"ok":true,"role":"viewer","listPassesInCall":1,"aliases":["acme studio","acme"],"invites":1,"deletes":0,"clients":1,"profiles":1}
viewer H: own new user stamped 6s before T_inv (clock skew) => {"ok":false,"code":"email_registered","inviteSent":true,"invites":1,"deletes":0,"binds":0,"clients":0,"profiles":0}
wizard G: new address => {"ok":true,"role":"viewer","listPassesInCall":2,"aliases":["acme studio","acme"],"invites":1,"deletes":0,"clients":1,"profiles":1}
wizard F: Check B listing throws => {... "code":"auth_lookup_incomplete","http":500}
wizard C (6s, either profile), D, B => http 409, deletes 0, binds 0
```

(In D the "invites" count is the fake's record of the call; GoTrue refused it,
so no mail. `listPassesInCall` 1 on the viewer path is Check B only, because
the importer passes its snapshot as Check A.)

Importer level, `imp.js` (live mode, fakes, injected clock):

```
V1 homepage-time self-serve, mixed case, profile=true  => invites 0, deletes 0, profileInserts 0, clients 0, alive true, lead skipped already_customer final
V1 homepage-time self-serve, mixed case, profile=false => invites 0, deletes 0, profileInserts 0, clients 0, alive true, lead skipped already_customer final
V1 lead 2 registers during lead 1 provisioning => invites ["lead1@co1.example"], deletes 0, alive true, l1 created, l2 skipped already_customer
V1 not ours (6s), next run => r1 invites 1, stop not_ours, l1 skipped already_customer final invite_sent_at sha reserved; r2 invites 1, stop day_cap, createsToday 1; deletes 0
V1 not ours + client delete fails => invites 1, deletes 0, alive true, lead failed half_made final invite_sent_at client_id 1 user_id null, events ["explee_orphan"]
V2 p1b: cap 1, profile insert + client delete fail, 4 runs 4 leads => invites 1, stops [provision_error, day_cap, day_cap, day_cap], l1 failed half_made final invite_sent_at
V2 p1b: one address two companies, half_made then healthy => invites 1, l1 half_made, l2 skipped already_customer
V2 var: onStep(invite) write fails, cap 1, 3 runs then +25h => invites [bo@mailbox.example, lead3@co3.example], stops [provision_error, day_cap, day_cap], l1 provision_error final invite_sent_at, l2 already_customer, l3 created
V2 var: suppresses() matrix => onlyInvite true, halfMadeFinal true, halfMadeNotFinal false, provErrNonFinal false, skippedPlain false
V3 p3b, 4 runs => rechecks [0,0,0,0], invites 0, l1 skipped company_has_account final
V3 var: other row creating, p1 at shop.acme.example => rechecks 0, invites 0, l1 company_has_account
V3 var: free-mail on both sides, different brands => invites 1, l1 created
V3 unit => a true, b false, c true
```

Rules level, `rules.js`: the V4 and I-1 rows of the table above are its
output verbatim in substance (every case printed the stated value).

Regression, `regress.js`:

```
F1 caps, profile insert failing, 3 runs => per [[1,1],[1,2],[1,3]], total 3, distinct 3
F1 healthy, day cap 3, per run 5, 2 runs => run1 3, total 3, clients 3
F3 race acme vs shop.acme, Promise.all => invites 1, clients 1, created 1
F3 race one free-mail address under two companies => invites 1, clients 1
F5 dry_run settings row, 3 qualifying leads => invites 0, clients 0, deletes 0, listUsersCalls 1, posts 0
```

---

## 4. New findings, ranked

No security finding of MEDIUM or higher. Two INFO residuals, both inside the
window revision 4 accepted on purpose (contract D8 Rule U step 2, failure
table line "Unconfirmed login made after Check B read its page", Q15).

### N-1. INFO. Inside the 5 s window, a bound foreign login is DELETED when a later step fails

Where: `_provision_client.js:246` judges a pending login created within
`OURS_SKEW_MS` before `T_inv` as ours when it has no profile yet; a later
failure then runs `rollbackUserAndClient` (`:254-265`), which calls
`deleteUser` on it (prompts insert failing, a non-23505 profile error, or the
`onStep('invite')` write failing).

Demonstrated (`v1_helper.js` C2, both paths): a pending login created 1 s
before `T_inv`, after Check B, no profile, prompts insert failing: 1 delete,
the foreign login gone. The contract's residual names only the BIND outcome
(Q15), not this delete.

Path to harm: a lead self-registers within the same few seconds the importer
invites them (after Check B read the auth listing), their signup has not yet
written its profile, AND a database write of ours fails. Three coincidences;
the login lost is a pending one that a re-signup restores. Not a release
blocker.

Fix direction (bg-architect rules, it is a trade-off): either record it in
Q15 as accepted, or never call `deleteUser` on a post-invite rollback when the
user's `created_at` is earlier than `T_inv` (keep the login, mark the lead
`provision_error final`, let Check A answer `already_customer` next time).

### N-2. INFO. Clock skew is judged per call; the contract's handling is bounded but invites one orphan login per run

Where: `_provision_client.js:225` reads `T_inv` from the function clock and
compares it with GoTrue's `created_at`. Demonstrated (`v1_helper.js` H): with
the function 6 s ahead of GoTrue, our own new login is not ours: not bound,
not deleted, client rolled back, `inviteSent`. The importer then stops the
run with `not_ours` and keeps the row in the daily window, so the cost is at
most one invited, profile-less login per run until the skew is fixed; the
wizard answers 409 "already has an account" to an admin for an address that
had none before the call. This is the contract's own failure-table row
("Function clock more than 5 s ahead of GoTrue"); recorded here only because
the owner signal is `stopCreating='not_ours'` in `job_runs`, which the daily
summary counts (`not_ours_runs`). No action beyond watching that count after
the switch to live.

---

## 5. Regression surface (grep)

- `_provision_client.js` is required by `onboard-client.js` and
  `explee-import-background.js` only (`rg "_provision_client"` over
  `netlify/functions`). Manual look owed: one real wizard create and delete
  of a test client after deploy (D13 step 4), since the wizard now makes two
  `listUsers` passes per submit.
- `_explee_rules.js` `suppresses`, `companyConflict`, `isOwnDomain` are used
  by the importer only.
- `tests/helpers/fake_supabase_mem.js` gained opt-in options only; the other
  sessions' suites that import it (`affiliate_*`, `resend_invite`) were not
  run by me.

---

## 6. What was not checked

- tsc, `npm run build`, a browser, every other test file (forbidden or out of
  lens).
- Real GoTrue: that `inviteUserByEmail` on an unconfirmed address re-sends
  and returns the existing user with its original `created_at`; that a
  confirmed address is refused with a message matching
  `/already.*(regist|exist)/`; the real `per_page` cap; the clock difference
  between Netlify functions and GoTrue (N-2). V1's closure rests on the fake
  modelling these as the contract describes.
- Whether self-serve signup or Google sign-in writes `user_profiles` before
  or after a pending login exists (decides how often the N-1 window is
  reachable).
- The migration on a database: `invite_sent_at` column and partial index,
  criterion 33's privilege line, the RLS probe as anon, viewer and admin.
- Real Explee label names (V4 and the decline regex depend on them) and
  whether `sent` messages always carry `from_email` (I-1 residual recorded in
  the contract).
- `_cron_auth.js`, `withObservability`, `_auth.js`: unchanged this round,
  not re-read.
- Ops and prompt lenses (caps timing, the 13 minute guard, N1 to N4 beyond
  what my runs touched).

---

## 7. Release answers

- Blocks shipping in `dry_run` with the cron off: NO. In `dry_run` the
  importer makes one read-only `listUsers` pass and no invite, client,
  delete or Explee write (F5 re-run above); mode default `dry_run` and the
  commented `cron.schedule` are in the migration.
- Blocks switching to `live` later: NO from this lens. V1, V2, V3 and I-1
  (live gates) and V4 (follow-up gate) are closed by my runs. Before the
  switch, the real-GoTrue behaviours in section 6 should be observed once on
  a test address, and bg-architect should rule N-1.
