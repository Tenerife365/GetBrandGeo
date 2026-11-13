PASS WITH FINDINGS

# 7 day invite link: independent post-build review, SERVER lens

Reviewer: bg-verify (Opus), read-only on code. Date: 2026-11-13.
Binding spec: `docs/arch/invite-link-7-days.md` (read in full, sections 0 to 14).
Design reviews already absorbed: `docs/qa/invite-link-7-days-design-review-security-2026-11-13.md`, `docs/qa/invite-link-7-days-design-review-delivery-2026-11-13.md`, `docs/qa/invite-link-7-days-design-rereview-2026-11-13.md`.

Counts: 0 BLOCKER, 0 MAJOR, 0 MEDIUM, 2 LOW, 11 INFO.

```
INTENT: review invite-link-7-days packet 1 (bg-backend)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

## 0. Calibration

1. Diff under review: the tracked-file patch handed over by the orchestrator (`scratchpad/invite-diff.patch`, 2,725 lines) touches exactly `_provision_client.js`, `resend-invite.js`, `tests/explee_import.test.js`, `tests/helpers/fake_supabase_mem.js`, `tests/provision_client.test.js`, `tests/provision_locations.test.js`, `tests/resend_invite.test.js` (packet 1 scope) and `src/App.tsx`, `src/components/PendingInvitesPanel.tsx`, `src/pages/Onboard.tsx` (packet 2 scope, not this lens). New untracked server files: `_invite_link.js`, `invite-redeem.js`, `db/supabase-client-invite-links-2026-11-13.sql`, `tests/invite_link.test.js`, `tests/invite_redeem.test.js`. Every one is in a packet's `scope_write`. `stripe-webhook.js`, `signup-client.js`, `onboard-client.js`, `explee-import-background.js`, `_email.js`, `_auth.js`, `_prospect_guard.js` do not appear in the patch. No git command was run (caller's rule), so the comparison is against that patch only; other dirty files in the tree (for example `unlock-audit-report.js`) belong to other sessions and are outside this review.
2. Secret scan: added lines of the patch matching the name pattern (`api key|secret|token|password|bearer|sk-|pk_live|service_role`): 56, all identifier names, comments, the dummy `test-resend-key` and `service_role` grants. Value shapes (JWT `eyJ`, Resend `re_`, `sk_live`, `rk_live`, `pk_live`, `whsec_`) in the patch and the two new test files: 0. No value printed.
3. Criteria: spec sections 4, 6.1 to 6.4 and 10 are objectively checkable; table in section 1.
4. tsc and build baseline: NOT run, by the caller's rule (memory pressure, shared tree). The orchestrator owns `tsc`, the full node suite and the build (spec 12 step 4).
5. Most sensitive function touched: `invite-redeem.js` is public by design; it is guarded by the 256 bit token looked up by hash (`invite-redeem.js:89`, `:114`), the row state (`:129-138`), the bound user by id (`:150-167`) and the profile binding `role = viewer` and `client_id` equal to the row's (`:178-182`). `resend-invite.js` stays behind `requireAuth(event, { adminOnly: true })` at `resend-invite.js:154`, first statement of the handler.
6. Write access used: this file only. No reviewed file edited.

CALIBRATED

## 1. Acceptance criteria (server side)

| # | Criterion (spec) | Result | Evidence |
|---|---|---|---|
| 1 | Token 32 random bytes, base64url 43 chars, only sha256 hex stored (4, 6.1) | PASS | `_invite_link.js:44-50`, insert at `:157-165` stores `token_hash` only; invite_link test 1 and 3 ok |
| 2 | Link carries the token in the fragment only (4) | PASS | `_invite_link.js:52-54`; test 2 ok |
| 3 | deliverInvite steps 1 to 7 in order (6.1) | PASS | `_invite_link.js:286-365`; tests 4, 5, 6, 7, 8, 9 ok |
| 4 | Rotation only after Resend accepted, or just before a copy return; never on the fallback path (4, 6.1 steps 4 to 6) | PASS | `_invite_link.js:332-358`, fallback `:359-365` has no rotation; invite_link 12 and 12b ok; resend_invite section 10 asserts call order `['resend','resend:ok','generateLink']` |
| 5 | Viewer under the kill switch or without a key still supersedes (re-read M2) | PASS | `_invite_link.js:291-297`; test 7b ok (3 checks) |
| 6 | 8 s send timeout, timed-out row `send_failed`, fallback runs | PASS | `_invite_link.js:37`, `:226-244`, `:362`; test 11 ok |
| 7 | channelReady false for admin, kill switch, empty key, table read error; never throws | PASS | `_invite_link.js:95-108`; test 13 ok |
| 8 | Redeem check order and every row of the 6.2 status table | PASS | `invite-redeem.js:76-138`, `:150-253`; invite_redeem sections 1 to 9, 43 checks ok |
| 9 | 200 body exactly `{ ok, token_hash, type }`; nothing of the generateLink answer returned or logged | PASS | `invite-redeem.js:272`; section 3 asserts the key set; section 7 asserts unexpected `verification_type` and token shape give 503 with nothing returned |
| 10 | Zero-row conditional update never returns the minted hash; rotates it away | PASS (with INFO-3) | `invite-redeem.js:258-296`; section 8, six cases ok |
| 11 | Race guard: delete only a user created within 60 s of start with no profile; an unparseable `created_at` is never deleted (redeem and resend, closes pending invites L1) | PASS | `invite-redeem.js:195-216`; `resend-invite.js:406-438`; invite_redeem section 9 (4 cases), resend_invite section 13 (7 cases) ok |
| 12 | Rate limits before the lookup: ip 20/h, token prefix 16 hex 10/h; RPC error fails open | PASS | `invite-redeem.js:93-104`; section 10 ok, including the real fixed window (eleventh press 429) |
| 13 | `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, CORS on every redeem answer; copy answer of resend no-store | PASS | `invite-redeem.js:68-72`; section 11 checks all 69 answers; `resend-invite.js:517-521`, resend_invite section 11 ok |
| 14 | No token, hash, address, `action_link` or `email_otp` in any log line | PASS | invite_redeem section 11 (56 lines against 173 secrets, every line prefixed `[invite-redeem] `); invite_link test 10 (44 lines, 61 secrets); resend_invite section 14 |
| 15 | Accepted detection: `email_exists` or the wording only, not a bare 422 | PASS | `_invite_link.js:80-84`; `invite-redeem.js:50-54`, `:225-239`; invite_link 12 "a bare 422 ... is NOT acceptance"; invite_redeem section 7 |
| 16 | Table missing (`42P01`, `PGRST205`) answers 404 `invalid` | PASS | `invite-redeem.js:44-48`, `:119-120`; section 4 both codes ok |
| 17 | `INVITE_REDEEM_DISABLED=1`: 503 after the shape check, zero reads | PASS | `invite-redeem.js:86`; section 2 asserts `db.calls.length === 0` |
| 18 | resend list: 1440 default, `invite_link_days`, `link_channel`, `link_expires_at` (active row wins, expired active row included), `unknown` on a read error | PASS | `resend-invite.js:66`, `:73-82`, `:219-302`; resend_invite section 2 and section 9 ok |
| 19 | resend copy: no email, `invite_url` once, no-store; legacy `{ email }` copy refused | PASS | `resend-invite.js:179-180`, `:196-198`, `:517-521`; section 11 ok |
| 20 | resend error mapping (`busy` 409, `link_unavailable` 503, `already_accepted` 409, `rate_limited` 429, `invite_failed` 502) | PASS | `resend-invite.js:462-472`; section 12 ok |
| 21 | Audit meta `{ source, user_id, via, channel, delivery, invite_link_id? }`, no address, token or hash | PASS | `resend-invite.js:488-503`; section 10 asserts the exact meta and no `@`, no hash |
| 22 | Admin-only gate and input validation of resend not weakened | PASS (INFO-7) | `resend-invite.js:154-155` unchanged first statement; uuid and int4 parsers unchanged `:93-108`; section 1 of resend_invite unchanged and green |
| 23 | Provisioning: `channelReady` before Check B, no awaited call between Check B and the creating call | PASS | `_provision_client.js:358`, `:365-382` (only the synchronous `now()` between); source-order test in provision_client ok |
| 24 | "Not ours" on the generateLink branch restores with one `inviteUserByEmail`, keeps `inviteSent: true` on success and failure | PASS | `_provision_client.js:403-421`; provision_client section 7, two cases ok |
| 25 | Step 2b before `onStep('invite')`; failure deletes user and client, no `userId`/`inviteSent`; `rollback_failed` carries both ids | PASS (LOW-1) | `_provision_client.js:443-470`; provision_client section 7 ok (`steps` equals `['client']` on failure) |
| 26 | `invite_channel` in the onboarded meta and `inviteChannel` in the return | PASS | `_provision_client.js:540`, `:562`; asserted in all three provisioning suites |
| 27 | Migration: table, checks, indexes, RLS on with no policy, grants and revokes, idempotent, read-backs, runbook, rollback | PASS (static, INFO-5) | `db/supabase-client-invite-links-2026-11-13.sql:56-111`, `:117-161`, `:167-199`; not executed against Postgres |
| 28 | No file under `netlify/functions` requires a `.ts` file | PASS | `_invite_link.js:30-31`, `invite-redeem.js:32-35` require only `crypto`, `./_email`, `@supabase/supabase-js`, `./_auth`, `./_prospect_guard`, `./_invite_link`; `tests/ts_require_bundler.test.js` 5 of 5 |
| 29 | Files that must stay untouched are untouched | PASS | absent from the patch (calibration 1) |
| 30 | Provisioning suites run every case twice with no fixture flag differing between runs | PASS (INFO-8, INFO-9) | provision_client 113, provision_locations 60, explee_import 222 (`suite()` runs `revision3()` and `revision4()` inside it, `explee_import.test.js:731-732`, so both modes) |

## 2. Security findings

No finding at BLOCKER, MAJOR or MEDIUM. Attack scenarios tried and closed are listed in section 6.

### LOW-1. On the BrandGEO channel the V1 profile proof runs after our 7 day email and after a possible user delete

Where: `brandgeo-dashboard/netlify/functions/_provision_client.js:443-464` (step 2b) against `:476-483` (profile proof).

Scenario. Two provisioning calls for one address inside the 5 s "ours" window (the wizard and a lead import run, or two import runs). Call 1 creates the unconfirmed user U with `generateLink`, issues its 7 day row R1 and emails it. Call 2's Check B ran before U existed; its `generateLink` returns U (existing, unconfirmed) with `created_at >= tInv - 5 s`, so `ours` is true. Step 2b of call 2 then runs `deliverInvite`: step 2 supersedes R1 (call 1's emailed link now answers 410 `replaced`), inserts R2 bound to (U, client 2), and emails a second link naming client 2. Call 1's profile insert lands first, so call 2's profile insert hits the unique violation at `:476`: only client 2 is deleted, R2 cascades, and call 2's link answers 404 `invalid`. The person holds two emails and no working link (and `generateLink` rotated their Supabase token). Today's path ends with GoTrue's re-sent invite, which works.
Second branch of the same misjudgement: if call 2's Resend refuses and its fallback `inviteUserByEmail` fails (429), `:458` deletes U, which belongs to call 1, before the profile proof ever runs. The pre-existing proof exists precisely so that a misjudged user is never deleted.
Bounded: needs concurrent provisioning of one address within seconds; the lead import's stop rule still fires; recoverable with one Resend from the panel (first branch). Not exploitable by an outside party.

Fix (bg-backend):
1. In the 2b failure branch, before `deleteUser(user.id)`, read `user_profiles` by `user.id`; on a row or a read error, delete only the client and return `fail('invite', 'email_registered', 'an auth user already exists for this address', { inviteSent: true })` (same shape as `:482`).
2. In the profile unique-violation branch at `:476`, when `useLink` is true, call `inviteUserByEmail(contact, { redirectTo: REDIRECT_TO })` once, logged by status only, exactly as the "not ours" restore at `:405-417`, so the person ends with one working link.
3. Add one provision_client case per branch on the link run (a `beforeInvite` hook that adds the user and, for branch 1, a profile).

### LOW-2. invite-redeem's token-hash shape is a hand copy of authLinkState.ts with no mirror test

Where: `brandgeo-dashboard/netlify/functions/invite-redeem.js:40` copies `src/lib/authLinkState.ts:20` (`/^[A-Za-z0-9_-]{16,256}$/`). The spec (6.2) requires the 200 `token_hash` to match `authLinkState.ts:20`. No test reads both files; `tests/invite_redeem.test.js:142` repeats the literal a third time.
Scenario: a later edit narrows the shape in `authLinkState.ts` only; redeem keeps answering 200 with hashes `/reset-password` treats as no token, and every invitee who presses Continue lands on a dead form with no error from the server.
Fix (bg-backend): add an assertion in `tests/invite_redeem.test.js` that reads both files as text and compares the two literals, the way `tests/invite_link_client.test.js` pins `INVITE_TOKEN_RE`.

### INFO (no action required unless stated)

- INFO-1. The builder's change of "already registered" to `already_accepted` in `fallbackInvite` (`_invite_link.js:259-262`) is right for both callers. resend-invite: identical to the removed line (old `resend-invite.js`, `if (/already.*(regist|exist|confirm)/i.test(msg)) return fail(409, 'already_accepted', ALREADY)`), now at `resend-invite.js:468`. Provisioning: `_provision_client.js:461` maps any non rate-limit code to `invite_error` and rolls back; the fallback runs only for a user `generateLink` just created whose token was discarded, so GoTrue cannot answer "already registered" there.
- INFO-2. Resend refusals are logged with `status n/a` in practice: `_email.js` replaces "Resend HTTP NNN" with Resend's JSON `message` when the body parses (`_email.js` `msg = j.message || msg`), so the regex at `_invite_link.js:242` rarely finds a status. Logging nothing from the message is the safer choice and matches the no-address rule; the log loses diagnostic value only.
- INFO-3. Zero-row path order deviates from the 6.2 text: the builder re-reads the row first and skips the second `generateLink` when the row is gone or the re-read errors (`invite-redeem.js:278-292`). Safer than the text (a cascaded row means the user is gone, and `generateLink` would CREATE a user); the minted hash is returned in no branch, and nobody else holds it. Pinned by invite_redeem section 8. Spec 6.2 should be amended to the built order.
- INFO-4. A 422 `email_exists` in redeem re-reads the user and stamps `accepted_at` only when the login is really accepted, else 503 (`invite-redeem.js:227-239`), stricter than the 6.2 table. Pinned (section 7). Spec should record it.
- INFO-5. Migration. Postgres 17 checks: the identity sequence default name `client_invite_links_id_seq` is right; `timestamptz + interval` in a CHECK is accepted (STABLE, not verified for immutability in CHECK); the partial unique index and inline constraints are idempotent under `if not exists`; the R2 count of 6 checks is right on 15 and 17 (from Postgres 18 NOT NULL constraints also appear in `pg_constraint`). `revoke delete ... from service_role` (`:103`) does NOT break `on delete cascade`: referential actions run as the owner of the referencing table, so a GoTrue `deleteUser` and the service-role client delete in `_provision_client.js` still cascade. No server code deletes from the table. Note: `service_role` still holds TRUNCATE, REFERENCES and TRIGGER from Supabase's default privileges, so "rows leave only by cascade" is a convention, not enforced; optional `revoke truncate on public.client_invite_links from service_role;` plus one R5 line.
- INFO-6. `loadActiveLinks` reads every active row without paging (`resend-invite.js:225-227`); PostgREST's default 1,000 row cap would silently truncate past 1,000 unaccepted viewers (active includes expired rows, which never leave that state on their own). The pre-existing `user_profiles` read at `:246-247` has the same cap and hits it first. Display only.
- INFO-7. `{ action: 'resend', delivery: null }` is now 400 (`resend-invite.js:179-180`); before, unknown keys were ignored. The panel never sends null.
- INFO-8. The explee case the builder reported (`tests/explee_import.test.js`, "not ours" with `stampCreatedAt: false`, now around `:1421-1436` of the new file) is a correct translation, not a weakening. The fixture is identical in both runs; the behavioural assertions (no profile, no delete, no client, `already_customer`, `invite_sent_at` stamped, stop `not_ours`) are asserted on both runs; only the raw email count differs, because on the link run the restore `inviteUserByEmail` meets the fake's refusal of an existing address without `inviteResendsPending`. That is exactly the "failed restore" case spec section 10 requires this fixture to cover. Against real GoTrue the restore would send (count 1). No fixture change needed.
- INFO-9. `tests/refresh_cadence.test.js` (in scope_write) was not doubled; it only reads source text (`:191-224`) and runs no provisioning, so a second run would test nothing new.
- INFO-10. resend_invite section 14 adds the email tokens and the row hashes to its secret list but not the raw token of the copy delivery (`r.body.invite_url`). `_invite_link.js` never logs it (invite_link test 10 covers the copy path), so this is a test gap only; optional fix: push the copy URL and its fragment into `secrets`.
- INFO-11. A 2b `rollback_failed` carries `userId` (`_provision_client.js:460`), so the lead import stamps `invite_sent_at` (`explee-import-background.js:1067-1068`, `:1109-1114`) although no email may have gone out. Exactly the spec 6.4 return shape; the effect is conservative (the address stays suppressed).

## 3. Accessibility findings

Not in this lens (server only). `Invite.tsx`, `PendingInvitesPanel.tsx`, `Onboard.tsx` belong to the frontend review.

## 4. Regression surface (found by grep)

- `_invite_link.js` is required by `resend-invite.js`, `_provision_client.js`, `invite-redeem.js` only.
- `_provision_client.js` is required by `onboard-client.js:67` and `explee-import-background.js:36` (esbuild bundled). Every return shape traced: the wizard maps by `code` and `stage` (`onboard-client.js:208-234`), a 2b failure reads "Invite email failed: <message>" with 409 as any invite failure did; the import's branches (`explee-import-background.js:1065-1119`) see the same codes as today on the Supabase channel (kill-switch runs green byte for byte) and on the link channel (`invite_error` and `email_rate_limited` without `userId`, `email_registered` with `inviteSent`, `rollback_failed` with ids).
- `resend-invite.js` callers: `src/components/PendingInvitesPanel.tsx`, `src/pages/Onboard.tsx` (frontend lens). Mentions in `_auth.js:141` and `client-locations.js:43` are comments.
- `tests/helpers/fake_supabase_mem.js` is used by 19 suites. Its additions default to inert (`faults` empty, `missingTables` null, `rpcFaults` null, non-invite `generateLink` keeps the old answer). Re-ran three consumers: affiliate_auth 16, affiliate_flow 67, client_locations_endpoint 29, all green. The other 13 consumers were not re-run here.
- Manual look needed: the live first invite through Resend (owner step 5 of spec 12), and `affiliate-portal.js:193` (the only other `generateLink` caller, type `magiclink`, unchanged).

## 5. Data and claim integrity

- "7 days": `INVITE_LINK_DAYS = 7` (`_invite_link.js:33`), row `expires_at = created_at + 7 * 86400000 ms` from one clock (`:153-155`); asserted exact in invite_link 3, resend_invite 10, provision_client 7.
- "24 hours" on the Supabase channel: `SUPABASE_EMAIL_LINK_TTL_MINUTES = 1440` (`resend-invite.js:66`), traced to the owner's statement of 2026-11-13 (spec header and 1 row 21); not read from Supabase (needs the Management API).
- Email copy (`_invite_link.js:111-125`) equals spec 9 C-E1 to C-E6, marked `copy: pending bg-copy`; no em or en dash in any of the five new or changed server files (rg scan, positive control fired).

## 6. Attack scenarios tried and closed

- Redeem with a guessed or malformed token: 400 before any read for a bad shape; 404 after the two rate RPCs and one indexed lookup for an unknown one; the 404 is one answer for unknown, revoked, `send_failed`, table missing, user gone, profile mismatch and race guard.
- Redeem with a request address: ignored; `generateLink` gets the stored address (section 3 asserts it with a second address in the body).
- Redeem of a superseded, expired (at exactly `expires_at`), accepted row: 410 with the right code before any mint; superseded wins over expired.
- Redeem racing a Resend: the conditional stamp (`.is('revoked_at', null).is('accepted_at', null)`) after the mint catches it; the minted hash is never returned and is rotated away.
- Redeem for an admin, or a viewer of another client: 404 before any mint.
- A rotation that answers a different user: new row revoked, `user_changed`, the tightened guard runs (resend section 13).
- A refused or timed-out email followed by a 429 fallback: no rotation, the user's `confirmation_token` and `invited_at` unchanged (invite_link 12b), so the person keeps their earlier link and the panel estimate stays true.
- Copy link: admin only, viewer targets only (`resend-invite.js:350`, `:364`), legacy `{ email }` refused, no-store, rotation before the return, audited without the URL.

## 7. Reproduced

All from `brandgeo-dashboard`, one file at a time, `node <file>`:

| File | Result |
|---|---|
| `tests/invite_link.test.js` | exit 0, 28 checks passed |
| `tests/invite_redeem.test.js` | exit 0, 43 checks passed |
| `tests/resend_invite.test.js` | exit 0, 58 checks passed |
| `tests/provision_client.test.js` | exit 0, 113 passed, 0 failed |
| `tests/provision_locations.test.js` | exit 0, 60 passed, 0 failed |
| `tests/explee_import.test.js` | exit 0, 222 passed, 0 failed (both runs) |
| `tests/ts_require_bundler.test.js` | exit 0, 5 passed |
| `tests/affiliate_auth.test.js` | exit 0, 16 passed |
| `tests/affiliate_flow.test.js` | exit 0, 67 passed |
| `tests/client_locations_endpoint.test.js` | exit 0, 29 passed |

No crash or garbled output; no rerun needed. Dash scan with `rg` over the five server files and two new tests: 0 hits, positive control 1. Secret value-shape scan: 0.

## 8. Not checked

- `tsc`, `npm run build`, the full node suite (the other 13 fake consumers and every other test file): not run, by the caller's rule.
- The migration against a real Postgres: read only; P1 to P3 and R1 to R6 not executed; the cascade-under-revoked-delete reasoning is from Postgres semantics, not a run.
- Real GoTrue: `generateLink('invite')` on the deployed version (existing unconfirmed user, confirmed user 422 text, `invited_at` stamping), and `verifyOtp` with the minted hash.
- Real Resend delivery, spam placement, click and open tracking state, whether mail clients and link scanners (for example Safe Links rewriting) keep the `#t=` fragment.
- Real Netlify: function timeouts under load, `x-nf-client-connection-ip`, the IP pepper being set, the live `affiliate_rate_check` behaviour.
- The frontend half (`Invite.tsx`, `inviteLink.ts`, `PendingInvitesPanel.tsx`, `Onboard.tsx`, `App.tsx`) and `tests/invite_link_client.test.js`: the frontend lens.
- Concurrency beyond the fake (two real resends or a resend racing a redeem against real Postgres).
- Scope of dirty files outside the supplied patch (no git run).
