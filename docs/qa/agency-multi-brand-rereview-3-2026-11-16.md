PASS WITH FINDINGS

# Agency multi-brand: third review (revision 3), 2026-11-16

Reviewer: `bg-verify` (Opus), read-only. Subject: `docs/arch/agency-multi-brand.md`
revision 3 (1,330 lines), scoped to the sections its header lists as changed
(4.2 to 4.7, 5.3, 5.5, 6.1, 8, 9.1, 9.3, 9.5, 9.6, 13, 15, 19, 20), judged
against `docs/qa/agency-multi-brand-rereview-2026-11-16.md` and the cited code.
Section 20.1 of the spec was not taken as evidence for anything. Nothing was
edited except this file. No migration, no git, no build, no browser. Every SQL
statement was a read-only SELECT against project `duiyifepitvugyulobqm`.

```
INTENT: review agency-multi-brand rev 3  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

## Verdict and counts

**PASS WITH FINDINGS.** The blocker is closed for real: with `on delete set
null` plus the `agency_has_home` CHECK, a direct brand deletes cleanly and an
agency home brand is refused by the database, and every one of the 15
re-review findings closes against the text and the code. No new blocker and no
major. Two new MEDIUM findings must be written into the spec before the build
starts (both are a few lines of 4.6 and 13); they can be verified at the build
review, no fourth design review is needed.

New findings in this review:

| Severity | Count |
|---|---|
| BLOCKER | 0 |
| MAJOR | 0 |
| MEDIUM | 2 |
| LOW | 3 |
| INFO | 6 |

Closure: re-review findings (N-B1, N-Md1 to N-Md5, N-L1 to N-L6, N-I1 to N-I3):
**15 CLOSED, 0 PARTIAL, 0 OPEN.** The 10 earlier PARTIAL entries: **8 CLOSED,
2 PARTIAL** (A F-M1 and B M1, reopened by new finding N3-Md1).

---

## 1. Calibration

1. **Diff under review.** No code diff; the subject is one untracked spec file.
   Git was not run (the brief forbids it). This review writes only this file,
   inside `docs/qa/`.
2. **Secret scan.** Run on this report after writing (section 9); names and
   patterns only, count reported.
3. **Criteria.** The brief's four items plus the spec's V1 to V23. All are
   checkable by reading the spec, the cited code and the live schema, except
   the Supabase Auth behaviours named in section 9, which the spec itself
   defers to measurement (V13).
4. **tsc and build baseline.** Not run: a design review changes no compiled
   file.
5. **Most sensitive auth check touched.** `requireAuth`
   (`brandgeo-dashboard/netlify/functions/_auth.js:67-122`, JWT at `:93`, client
   gate at `:115-119`) and `public.has_client_access(integer)` (read live:
   SECURITY DEFINER, `search_path=""`, EXECUTE `postgres, authenticated,
   service_role`, body reads `user_clients`).
6. **Write access.** `docs/qa/` only; no reviewed file edited.

CALIBRATED

---

## 2. Closure table

### 2.1 Findings of the re-review of revision 2

| Finding | Status | Evidence |
|---|---|---|
| N-B1: RESTRICT home FK makes every client undeletable | **CLOSED** | Spec 4.3 line 361: `home_client_id integer null references public.clients(id) on delete set null`, CHECK `agency_has_home` line 363. Traced: a DELETE on `clients` fires the RI set-null action, an `UPDATE accounts SET home_client_id = NULL`; for `kind = 'direct'` the CHECK holds and the row survives until `cleanup_empty_account()` removes it; for `kind = 'agency'` the CHECK raises 23514 and the whole DELETE rolls back, so nothing is half-deleted at the database level. `clients.account_id ... on delete restrict` (line 380) does not fire in the cleanup, because the cleanup runs AFTER the client row is gone. Every delete site was re-read: `provision-account.js:212` (after a failed profile insert, no profile exists), `_provision_client.js:341` (`deleteClient`; callers at `:348`, `:367`, `:371`, `:384`, `:392`, `:418`, `:429`, `:474`, `:479`, `:514`; at `:426-428` the profile and auth user go first), `stripe-webhook.js:658`, `:683`, `:692` (at `:690-692` the auth user goes first), `delete-client.js:102`. None now meets a new blocking FK. Live: 27 FKs reference `clients`; 5 are NO ACTION (`user_profiles`, `prompts`, `ai_results`, `competitors`, `tickets`), 2 SET NULL, 20 CASCADE, none RESTRICT, so the new FK is the only new constraint and it never blocks a direct brand. |
| N-Md1: `backfill` row survives removal; ban duration unstated | **CLOSED** | 4.2 lines 342-347 and 4.6 table (`account_remove_member`, `account_remove_guest`: every row, whatever its source); `convert_to_agency` and `account_attach_brand` rewrite `backfill` to `primary`; third standing check (4.4, lines 492-501) catches a stray non-`direct` row on an agency brand; ban fixed at `'876000h'` with no admin input (4.6 line 561); V13. The credential side of the parent finding reopens elsewhere, N3-Md1. |
| N-Md2: 9.5 refusal blocks every customer delete | **CLOSED** | 9.5 lines 989-993: refuse only for an agency home brand, a login in an agency account or a multi-brand direct account, or a login holding rows on another brand. Traced for an ordinary direct customer after step 2: one profile, one row on its own brand, owner of its own one-brand direct account: passes all three. The refusals can sit where the existing admin refusal sits (`delete-client.js:64-71`), which is before the first destructive call (`:76`). |
| N-Md3: attached brand's former customer stays `owner` | **CLOSED** | 4.6 `account_attach_brand` (line 547): confirmed users set to `member`, `backfill` to `primary`, their `account_members` rows on the old direct account deleted, the empty direct account deleted; detach reverses it (line 548); V22. Wording defect in the same row's refusal list: N3-L1. |
| N-Md4: step 4 rollback cannot complete | **CLOSED** | 13 step 4 (line 1076): detach every attached brand, then revert; `remove_member` excluded. Traced: after detach, staff hold only their `primary` row on the home brand and former customers own their brands again, which the reverted equality code serves consistently. What the reverted code then does to the agency home brand is new finding N3-Md2. |
| N-Md5: grant lapse notice reaches the end customer | **CLOSED** | 9.6 lines 1008-1013, 1.6, step 4 file list, V17. Read `expire-plan-grants.js:202-241`: the only customer-facing write is the `client_notifications` insert at `:219-228`; no customer email exists in this function (the email at `:245` on is the admin summary), so skipping that one insert is complete. Fail direction on an account read error unstated: INFO N3-I4. |
| N-L1: attach and profile trigger race | **CLOSED** | 4.4 lines 468-474 and 4.5 step 1: ascending lock order, the trigger locks the brand's account then re-reads it. Traced under READ COMMITTED: trigger first, attach then sees the unconfirmed user and refuses; attach first, the trigger waits on the old account's lock, re-reads with a new statement snapshot and writes an agency `member`. It holds the old account's lock rather than the new one while writing a `primary` row, which `account_reconcile` never touches, so no interleaving matters. No lock cycle: the trigger takes one lock, attach takes two in order. |
| N-L2: window between steps 1 and 2 | **CLOSED** | 13 lines 1082-1085: one migration, one transaction, backfills as `insert ... select ... on conflict do nothing`. The `ALTER TABLE clients` of step 1 holds ACCESS EXCLUSIVE until commit, and every `user_profiles` or `clients` insert needs a lock on `clients` (FK key share, or the insert itself), so no write can land in between. Read-back placement: INFO N3-I5. |
| N-L3: staff creation not atomic | **CLOSED** | 4.6 `account_create_staff_profile` (line 549): profile and `account_members` in one SQL function; the 4.5 trigger re-takes an advisory lock the function already holds, which is re-entrant within a session. The auth user delete on failure in 9.1 needs an ownership rule: INFO N3-I3. |
| N-L4: billing shows on a kind read error | **CLOSED** | 6.1 line 767-769 `'unknown'` state; 8 guard 1 (line 891) hides billing unless the kind is `direct`; V18. Admin side effect: INFO N3-I6. |
| N-L5: `direct` rows outlive staff removal | **CLOSED** | 4.6 `account_remove_member` deletes every source; 9.3 table first row. |
| N-L6: `convert` promotes logins unconfirmed | **CLOSED** | 4.6 `convert_to_agency(..., p_confirm_user_ids, ...)`, refuses any unnamed login on the brand; 9.1 preview then confirm; V23. Live: still exactly 1 brand with more than one login. |
| N-I1: caller-supplied `account_id` | **CLOSED** | 4.3 line 418-421: the BEFORE trigger raises `account_id_on_insert`. NOT NULL is checked after BEFORE triggers, so null still fills. Grep: the only `clients` inserts are `provision-account.js:180-193`, `_provision_client.js:331`, `stripe-webhook.js:1085-1088` and the hand SQL `db/supabase-research-cities-batch2-2026-11-06.sql`; none names `account_id`; no `clients` upsert exists. The step 1 read-back asserts the refusal. |
| N-I2: `accounts_id_seq` default grants | **CLOSED** | 4.7 line 585 revokes all on the sequence from `anon`, `authenticated`; `relacl` read-back names it. Live `pg_default_acl` for sequences in `public` grants `rwU` to `anon` and `authenticated` (both `postgres` and `supabase_admin` defaults), so the revoke is needed and correct. Trigger and 4.6 functions run as the definer, so no caller needs `USAGE`. |
| N-I3: `enforce_prompt_cap` search_path and EXECUTE | **CLOSED** (as planned for P2) | 4.7 lines 608-611. Outside this release; check at the P2 build review. |

N-I4 to N-I7 were confirmations; nothing to close. Re-read live: still no user
trigger on `clients`, `user_profiles` or `user_clients`.

### 2.2 The 10 earlier entries that the re-review left PARTIAL

| Earlier finding | Status | Evidence |
|---|---|---|
| A F-B1 | **CLOSED** | Insert half closed in revision 2; delete half closed by the N-B1 trace above. |
| B B1 | **CLOSED** | Same. `stripe-webhook.js` stays unedited and its rollbacks now leave no orphan client or account, so the redelivery loop described in N-B1 cannot start. |
| A F-M1 | **PARTIAL** | `backfill` row and ban duration closed (N-Md1). But a removed login can still obtain a fresh OAuth grant from a code issued before the removal, which neither the ban nor the grant revocation stops: N3-Md1. |
| B M1 | **PARTIAL** | Same as A F-M1. |
| A F-M3 | **CLOSED** | 9.5 narrowed and ordered before any destructive step; a guest-only agency client brand deletes with its guests; the backstop is the CHECK. Post-rollback residual recorded as N3-Md2. |
| B Md5 | **CLOSED** | Same. |
| A F-Md2 | **CLOSED** | N-Md3 trace. |
| B M2 | **CLOSED** | N-Md3 trace; V22 asserts a P3 `client-members.js` call from the former customer is refused. |
| A F-Md4 | **CLOSED** | N-Md4 trace. |
| B Md6 | **CLOSED** | N-Md5 trace; `set-client-plan.js` routing and the `plan_grant_note` select unchanged from revision 2. |

---

## 3. New findings

### MEDIUM

**N3-Md1. An OAuth authorization code issued before a removal mints a fresh,
live grant after it; neither the grant revocation nor the ban stops it, and P4
does not either.**

- Spec: 4.6 `account_remove_member` and `account_remove_guest` revoke
  "every `oauth_grants` row of the user on those brands" (line 551-552); 9.3
  claims every channel closed; V14 "their OAuth grants are dead".
- Code, traced:
  - `oauth-authorize.js:207` stores a code with `expires_at = now + CODE_TTL_S`
    (`_oauth.js:45`, 300 s). Consent itself goes through `requireAuth`, so it
    cannot START after the ban; a code issued in the 300 s before the removal
    survives it.
  - `oauth-token.js` `exchangeCode`: claims the code (`:97-100`), then
    `userStillMapped` (`:82-86`, used at `:118`) checks only
    `role !== 'admin'` and `profile.client_id === grant client`. A banned
    login keeps its profile (Q12, ban not delete) and its default brand, so
    this passes.
  - `upsertGrant` (`:139-150`) looks for a live grant with
    `.is('revoked_at', null)`; the revoked one is invisible, so a NEW grant is
    inserted and a token pair minted (`:122`, `:127`).
  - `mcp-server.js` `resolveOAuth` (`:1156-1176`) accepts it: grant not
    revoked, profile still maps to the grant's client. Refresh repeats
    `userStillMapped`, so the connection lives until the grant's idle expiry,
    renewed on use.
- Exploit path: a staff member (or guest) who expects removal keeps an
  unexchanged code at hand by re-running consent every few minutes (one
  scripted POST with their still-valid session), and exchanges the newest code
  after removal. Result: indefinite MCP read access (and write, for a write
  scope) to their default brand, the agency's home brand for staff. No
  Supabase Auth assumption is involved; it is all BrandGEO code. P4 does not
  close it, because ledger rows 25 to 27 (OAuth) stay bound to
  `profile.client_id`, which a ban keeps.
- Fix: in `account_remove_member` and `account_remove_guest`, in the same
  locked function, also `update oauth_codes set used_at = now() where user_id
  = p_user_id and used_at is null` (over the affected brands, or all of the
  user's codes), so the exchange claim at `oauth-token.js:97-100` finds no row.
  Add to V14: "a code issued before `remove_member` cannot be exchanged after
  it". The columns exist live (`oauth_codes.used_at`, `user_id`, `client_id`).

**N3-Md2. After the step 4 rollback, an agency account remains, and the
reverted `delete-client.js` half-deletes its home brand: the N-B1 failure
mode on the rollback path.**

- Spec: 13 step 4 rollback (line 1076) detaches every attached brand, then
  reverts the commit. Nothing turns the agency account back into a direct one
  (no 4.6 function does), so `kind = 'agency'` and `home_client_id` stay, and
  `agency_has_home` stays (step 1 is not rolled back).
- Code: the reverted `delete-client.js` has no 9.5 refusal. On the agency's
  home brand it deletes every staff auth user (`:76-84`, staff default to the
  home brand by 4.1), the profiles (`:90`), `ai_results`, `prompts`,
  `competitors`, `user_clients` (`:95-98`), then the client delete at `:102`
  fails with 23514 and the admin gets a 500. Logins and history are gone, the
  brand row remains. Not reversible.
- Exploit path: no attacker. A rollback after step 5 is most likely when the
  agency trial fails, and the natural next admin action is "Delete account" on
  that agency's own brand.
- Fix, either one, stated in the step 4 rollback cell: (a) after detaching,
  return the account to `kind = 'direct'` (a small `revert_agency_to_direct`
  in 4.6, refusing unless the account holds only its home brand, or a single
  guarded statement in the runbook), so the brand deletes like any direct
  brand; or (b) keep the 9.5 refusal 1 in `delete-client.js` as its own commit
  that is not reverted. Add to V16: "after a step 4 rollback, deleting the
  former agency's home brand either succeeds completely or answers 409 before
  any destructive step".

### LOW

**N3-L1. The attach refusal "brand is a home brand" is true for every brand.**
4.3 line 384-385 makes every direct account's home its own brand, and step 1
backfills "home = the client" for all 72. Read literally, 4.6 line 547 and 9.2
refuse every attach, so V20 and V22 fail at build, or a builder drops the
guard to make them pass. The row itself then deletes "the now empty direct
account", so the intent is plain. Fix: "the brand is the home brand of an
**agency** account".

**N3-L2. The step 1 "agency home delete fails with 23514" read-back is
fragile.** It sets "one backfilled account" to agency and deletes its home
brand. A backfilled brand can have rows in the five NO ACTION children (read
live: `user_profiles`, `prompts`, `ai_results`, `competitors`, `tickets`).
All RI actions and checks on `clients` fire as AFTER triggers named
`RI_ConstraintTrigger_a_<oid>`, ordered by name, so whether 23503 or 23514
surfaces depends on oids, and the brand's CASCADE children are deleted inside
the block first. An expected error also aborts the surrounding transaction,
so the later assertions in the same block cannot run. Fix: use the client the
block just inserted (no children), wrap each expected failure in a `DO` block
with an `EXCEPTION WHEN check_violation` (or a savepoint), and assert the
SQLSTATE.

**N3-L3. Two server paths sit outside the `banned_until` refusal; their last
hop depends on Supabase Auth behaviour the spec has not measured.**
- `provision-account.js:84` verifies the JWT itself (not through
  `requireAuth`) and, for a user with a profile, updates `name`,
  `brand_website`, `brand_aliases` of the default brand (`:136-143`). A
  removed staff member whose access token Supabase still accepts in
  `auth.getUser` (the spec's own open question, V13) can rewrite the agency's
  home brand for up to the JWT expiry. 4.6 line 565-570 ("closes the Netlify
  path at once") and V13 ("every Netlify function answers 401") are therefore
  not true as specified, and section 14 forbids editing this file.
- `invite-redeem.js` is public; it reads the bound user (`:150-167`), never
  `banned_until`, and mints a fresh invite token (`:220`) while the profile
  still matches (`:178-182`, a ban keeps the profile). A staff member or guest
  removed before accepting a 7-day invite reaches `/reset-password`; whether
  `verifyOtp` then refuses a banned user is unverified. If it does not, they
  get a session and, until P4, RLS reads of their default brand.
- Fix: in the two remove functions, also set `revoked_at` and a
  `revoked_reason` on the user's open `client_invite_links` rows (columns
  exist live); and either let `provision-account.js` refuse a banned user
  (amend section 14 and the ledger) or narrow V13 to the functions that use
  `requireAuth` and record the measured `getUser` behaviour.

### INFO

- **N3-I1.** `cleanup_empty_account()`'s "direct and still holds brands, set
  home when null" branch depends on firing order against the RI set-null
  action (both AFTER row triggers, ordered by name). If the user trigger fired
  first, it would see the old home and skip, and the RI action would then null
  it. The branch is unreachable in P1 and P2 (a direct account only ever holds
  one brand: attach needs an agency target, detach creates one account per
  brand), but make it order-free: reassign when `home_client_id is null or
  home_client_id = OLD.id`.
- **N3-I2.** The step 1 insert-then-delete read-back catches the N-B1 class
  (any new FK or trigger that blocks deleting a fresh client). It does not
  exercise a rollback after a profile insert, the only case where trigger
  written `user_clients` and `account_members` rows exist
  (`_provision_client.js:426-429`, `stripe-webhook.js:690-692`). Add one
  variant: insert a client, a scratch `auth.users` row and its profile, delete
  in the code's order, assert zero `clients`, `accounts`, `account_members`,
  `user_clients` rows left.
- **N3-I3.** 9.1 `create_staff_login` "deletes the auth user it just
  created": specify the ownership test `_provision_client.js` already applies
  to a returned user (id not seen before the call, fresh `created_at`, no
  profile), so an existing login answered by `generateLink` is never deleted,
  and send the invite email only after the SQL call commits.
- **N3-I4.** 9.6 for `expire-plan-grants.js`: state the fail direction when
  the brand's account kind cannot be read (skip the customer notice, keep the
  admin bell row).
- **N3-I5.** Steps 1 and 2 are "one transaction", but the step 1 read-back
  runs its own `begin; ... rollback;` blocks, so it must run after the commit.
  "A re-run is harmless" also needs `if not exists` on the DDL,
  `create or replace` on functions and `drop trigger if exists`, not only the
  idempotent backfills.
- **N3-I6.** `activeBrandAccountKind` is `null` for an admin (6.1) and guard 1
  hides billing "unless `direct`", so an admin sees no Upgrade or Billing
  portal on any brand. Probably intended (admins use `set-client-plan.js`);
  state it.

---

## 4. Attack results on the new mechanisms (brief item 2)

| Mechanism | Result |
|---|---|
| `on delete set null` with `agency_has_home` | Holds. Direct brand: delete succeeds, account removed by cleanup. Agency home: 23514, whole statement rolled back. `delete-client.js` refuses first (9.5), so the backstop never fires on the forward path. Rollback path: N3-Md2. |
| `cleanup_empty_account()` ordering and the three unedited rollbacks | Correct in every traced order: the RESTRICT from `clients.account_id` sees no referencing row once the client is gone; `account_members` cascades; each rollback is its own PostgREST transaction, so the advisory lock is short. Order sensitivity only in a dead branch: N3-I1. |
| Step 1 insert-then-delete read-back | Would catch an N-B1-class regression (a RESTRICT home FK fails the fresh delete). Gaps: N3-L2, N3-I2. |
| 876000h ban with `requireAuth` | Covers the 45 functions that call `requireAuth`, including `oauth-authorize.js`. MCP key path: covered by the 9.3 creator re-check ("creator is not banned"). MCP OAuth path: covered by grant revocation, except a pre-issued code (N3-Md1). Not covered: `provision-account.js`, `invite-redeem.js` (N3-L3). `_affiliate_auth.js:51` serves affiliate data only, out of scope. |
| Narrowed 9.5 | Runs before any destructive step if placed with the existing check at `delete-client.js:64-71`; correct for direct, home and guest-only cases. |
| Attach demotes, detach reverses | Correct, once N3-L1 is reworded. Detach makes every login defaulting to the brand an owner again; the unique `account_members(user_id)` cannot collide because attach removed them from every account and guests never join one. |
| Step 4 rollback | Completes. Leaves an agency account: N3-Md2. |
| Steps 1 and 2 merged | Closes the window (lock argument in 2.1, N-L2). Read-back placement: N3-I5. |
| `expire-plan-grants.js` skip | Complete: no customer email exists in that function. N3-I4. |
| `account_create_staff_profile` atomicity | Atomic in SQL; the advisory lock is re-entrant; the 4.5 trigger writes `primary`/`member` because the home account is agency, and skips its step 3. Auth user side: N3-I3. |
| Sequence grants; refusing `account_id` on insert | Both correct and needed (live default ACL grants `rwU` on sequences to `anon`, `authenticated`). |

## 5. Grants and security (brief item 3)

| Object | SECURITY DEFINER, search_path | EXECUTE | Finding |
|---|---|---|---|
| `ensure_client_account`, `set_account_home`, `cleanup_empty_account` (triggers) | yes, `''` (4.3 line 438) | revoked from PUBLIC, `anon`, `authenticated` (4.7) | none |
| `sync_primary_membership` (trigger) | yes, `''` (4.5) | revoked | none; `user_profiles` has no viewer INSERT policy, so no viewer fires it |
| `account_reconcile` and the eight 4.6 functions, including `account_create_staff_profile` | yes, `''` (4.6 line 536) | `service_role` only, all named in the 4.7 list with signatures | none |
| `is_account_member`, `brand_account_kind` | yes, `''` (5.2) | revoked from PUBLIC, `anon`; granted to `authenticated`, `service_role` | none; `brand_account_kind` returns null unless `is_admin() or has_client_access(cid)` |
| `accounts`, `account_members` | RLS on, SELECT policies only | `revoke all` then `grant select` | none |
| `accounts_id_seq` | n/a | revoked from `anon`, `authenticated` | none |
| `user_clients` | existing RLS | DML revoked from `anon`, `authenticated` | none |

Every function revision 3 adds appears in the 4.7 revoke and grant lists.
The read-backs compare `proacl`, `proconfig`, `relacl`, `relrowsecurity` to
expected strings. Live reference points re-read today: `add_client_locations`
`{postgres=X,service_role=X}` with `search_path=""`; `has_client_access` as in
calibration; `is_admin`, `my_client_id`, `get_my_client_id` executable by
PUBLIC and `anon` (pre-existing, not changed by this spec, unchanged from the
earlier reviews).

## 6. Accessibility

Design stage, nothing rendered. Not measured: contrast, focus, hit targets.
Section 6.2 still carries listbox semantics, keyboard reach, focus return,
44 px rows at phone width, and one tab stop between identity block and
switcher. Owed at the build review: contrast of the switcher label, brand
rows, filter placeholder and the Account page "contact us" line in both
themes; heading order of the new admin panel.

## 7. Regression surface (grep)

- `clients` deletes: `provision-account.js:212`, `_provision_client.js:341`
  (11 callers), `stripe-webhook.js:658`, `:683`, `:692`, `delete-client.js:102`.
- `clients` inserts: `provision-account.js:180-193`, `_provision_client.js:331`,
  `stripe-webhook.js:1085-1088`, `db/supabase-research-cities-batch2-2026-11-06.sql`
  (hand SQL; fine under the trigger, must never name `account_id`).
- JWT verification outside `requireAuth`: `provision-account.js:84`,
  `_affiliate_auth.js:51`. Public user-bound paths: `invite-redeem.js`,
  `oauth-token.js` (`userStillMapped` `:82-86`, used at `:118`).
- 45 function files call `requireAuth`; the `banned_until` check lands in all
  of them through `_auth.js`.
- Notice writers on agency brands: `set-client-plan.js:196-218`,
  `expire-plan-grants.js:219-228`.

Manual look owed at build: `oauth-token.js` refresh path, `delete-client.js`
refusal placement, every rollback in `_provision_client.js` after step 1 is
applied on a staging copy.

## 8. Data and claim integrity (read-only SELECTs, 2026-11-16)

| Claim in the changed sections | Result |
|---|---|
| 72 clients (34 active, 1 free, 37 research) | confirmed |
| 36 profiles; 36 backfill rows (step 2) | confirmed 36 profiles |
| 0 `user_clients` rows; `accounts`, `account_members` absent | confirmed |
| No user trigger on `clients`, `user_profiles`, `user_clients` | confirmed 0 |
| "Today no foreign key into `clients` is RESTRICT" (4.3) | confirmed: 27 FKs, none RESTRICT |
| "one brand already has two logins" (4.6) | confirmed: 1 brand |
| `client_api_keys` rows with `created_by` null (9.3, "build review lists how many") | 0 keys exist at all today |
| `oauth_grants` rows | 3 |
| Agency billing guard query (8) would read 0 | 0 clients carry any Stripe id |
| `client_invite_links` has `revoked_at`, `revoked_reason`; `oauth_codes` has `used_at`, `user_id` | confirmed (basis of the N3-Md1 and N3-L3 fixes) |
| Sequence default grants (4.7, N-I2) | confirmed `rwU` to `anon`, `authenticated` |

No user-facing copy is added; strings stay `copy: pending bg-copy`. No number
in the changed sections is untraceable.

## 9. What was not checked

- Supabase Auth: whether `auth.getUser(token)` returns `banned_until` and
  whether it rejects a banned user's live access token; whether `verifyOtp`
  refuses a banned user; whether a ban ends existing refresh tokens; the
  project's JWT expiry. N3-L3 depends on these; V13 measures them.
- Trigger firing order was reasoned from Postgres semantics (AFTER row
  triggers by name, RI triggers named `RI_ConstraintTrigger_a_<oid>`), not
  executed. No concurrency was executed.
- The 4.6 function bodies do not exist; every judgement is on the prose
  contract.
- Sections outside the brief's list were read only where a changed section
  depends on them (1.1, 1.6, 12, 14, 17). D1 was not re-read.
- `oauth-revoke.js`, `client-api-keys.js` mint rules, `create-portal-session.js`
  beyond its gate, watchdog internals.
- No browser, build, tsc or tests: nothing is built.
- Secret scan of this report: pattern scan run after writing; count in the
  handback. Dash scan: `rg` with a positive control file; count in the
  handback.

## 10. Routing

- N3-Md1, N3-L1, N3-L3, N3-I3: `bg-architect`, 4.6 remove functions, 9.1,
  V13 and V14, section 14 if `provision-account.js` changes. Then
  `bg-backend` on Opus.
- N3-Md2, N3-L2, N3-I2, N3-I5: `bg-architect`, section 13 (rollback cell,
  read-back text) and V16.
- N3-I1, N3-I4, N3-I6: `bg-architect`, one line each.
- No fourth design review is required: the build review of steps 1 to 4 checks
  these closures against the migration file and the function bodies.
