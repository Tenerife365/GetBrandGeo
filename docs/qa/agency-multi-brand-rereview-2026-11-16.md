BLOCK

# Agency multi-brand: re-review of revision 2, 2026-11-16

Reviewer: `bg-verify` (Opus), read-only. Subject: `docs/arch/agency-multi-brand.md`
revision 2 (1,164 lines), against review A
(`docs/qa/agency-multi-brand-design-review-2026-11-16.md`) and review B
(`docs/qa/agency-multi-brand-design-review-b-2026-11-16.md`). Nothing was
edited except this file. No migration, no git, no build, no browser. Every SQL
statement was a read-only SELECT against project `duiyifepitvugyulobqm`.

```
INTENT: re-review agency-multi-brand rev 2  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

## Verdict and counts

**BLOCK.** Revision 2 closes most of what both reviews found, and the closures
are real in the text and against the code. But the fix for the old blocker
introduces a new one: `accounts.home_client_id ... on delete restrict`, filled
for every client by the backfill and by the new AFTER INSERT trigger, makes
every `clients` row undeletable from the moment step 1 is applied. That breaks
the rollback delete in all three insert paths (including the unedited Stripe
webhook, which then multiplies orphan paid clients on each redelivery) and turns
the admin "Delete account" into a destructive half-delete. Step 1's own
read-back cannot see it.

New findings in this re-review:

| Severity | Count |
|---|---|
| BLOCKER | 1 |
| MAJOR | 0 |
| MEDIUM | 5 |
| LOW | 6 |
| INFO | 7 |

Earlier findings (BLOCKER, MAJOR, MEDIUM of both reports, 22 entries):
**12 CLOSED, 10 PARTIAL, 0 OPEN.**

---

## 1. Calibration

1. **Diff under review.** No code diff; the subject is one untracked spec
   file. Git was not run (brief forbids it). This review writes only this file.
2. **Secret scan.** Run on this report after writing (section 9); names and
   patterns only.
3. **Criteria.** The brief's four items (closure, new surface, release order,
   spot checks) plus the spec's own V1 to V21. All are checkable by reading the
   spec, the cited code and the live schema.
4. **tsc and build baseline.** Not run: a design review changes no compiled
   file.
5. **Most sensitive auth check touched.** `requireAuth` client gate
   (`brandgeo-dashboard/netlify/functions/_auth.js:115-119`) and
   `public.has_client_access(integer)` (SECURITY DEFINER, `search_path ''`,
   EXECUTE `postgres, authenticated, service_role`, read live today).
6. **Write access.** `docs/qa/` only; no reviewed file edited.

CALIBRATED

---

## 2. Closure table (every BLOCKER, MAJOR, MEDIUM of both reports)

| Finding | Status | Evidence |
|---|---|---|
| A F-B1 / B B1: NOT NULL `account_id` breaks inserts | **PARTIAL** | The insert half is closed. `ensure_client_account()` BEFORE INSERT fills `account_id` when null (spec 4.3, lines 391-403). The three inserts name no `account_id`: `provision-account.js:180-193`, `_provision_client.js:331` (row built at `:318-330`), `stripe-webhook.js:1085-1113` (`createClientRow`). `clients.name` is NOT NULL live, so `accounts.name = NEW.name` cannot fail on null. A slug collision (23505) rolls back the statement, the account insert with it, so the retry loops (`provision-account.js:178-198`, `stripe-webhook.js:1084-1085`, `:1134`) stay clean. `stripe-webhook.js` is genuinely unedited (spec 14). If the trigger itself raises mid-checkout, `createClientRow` throws, the handler releases the idempotency row (`stripe-webhook.js:182`) and Stripe redelivers: the same behaviour as any DB failure today, not worse. **The delete half is broken by the companion trigger: new blocker N-B1.** |
| A F-M1 / B M1: default brand and credentials survive removal | **PARTIAL** | Closed for staff created by `create_staff_login`: `account_remove_member` deletes the `primary` row on the home brand, reconcile removes `account` rows, keys with `created_by = user` get `revoked_at`, OAuth grants are revoked (spec 4.6 table, 9.3). OAuth revocation is effective per call: `mcp-server.js` `resolveOAuth` rejects `grant.revoked_at` on every request (read at `:1156-1169`). The `resolveKey` creator re-check is specified (9.3) against code that today reads `created_by` only for the research rule (`mcp-server.js:1138-1143`, confirmed). `client_api_keys.created_by` has no FK (read live), so a deleted creator leaves a dangling id, no profile, dead key: correct. **Gap:** `account_remove_member` deletes only the `primary` row, but the agency lead and every login that existed before step 2 holds a `backfill` row on its brand (spec 4.2 table: `backfill` is "never automatically" removed). Converting a lead's direct account makes that brand the home brand, so a removed pre-existing login keeps a `backfill` row on the home brand, invisible to both 4.4 checks. Only the ban stops it, and `ban_duration` is unspecified. N-Md1. |
| A F-M2 / B Md8: fan-out not atomic, races, stale rows invisible | **CLOSED** | One reconcile (4.4), every account write a `SECURITY DEFINER` function that takes `pg_advisory_xact_lock(hashtext('account:' || id))` and ends in reconcile in one transaction (4.6). Concurrent `attach` and `remove_member` on one account serialize on the lock. Reverse (stale) check query present and correct for `grant_source = 'account'` leftovers: a member removed or a brand detached both produce a row it returns. ON CONFLICT rule stated (DO NOTHING, delete only `account` rows). `account_detach_brand` is defined (4.6 table) and exposed (`detach_brand`, 9.1). Pattern exists live: `add_client_locations` is SECURITY DEFINER, `search_path ""`, EXECUTE `postgres, service_role` only. Residual race with the profile trigger, LOW N-L1. |
| A F-M3 / B Md5: `delete-client.js` deletes staff | **PARTIAL** | Ledger row 29 and 9.5 add a 409. Two defects: (1) the refusal reads "any attached profile holds an `account_members` row", and step 1 backfills an owner row for every profile (4.3, 13 step 1), so every customer brand with a login is refused, including ordinary direct customers (N-Md2); (2) the delete it then allows cannot succeed (N-B1). Coverage of the cases asked: staff on a client brand are not attached (their default is home), guests are deleted with the brand, a home brand with siblings is refused, a lone home brand is meant to be deletable but is not. |
| A F-M4 / B Md7: P2 messages leak pooled numbers | **CLOSED** | 7.4: the collection budget message carries no numbers for anyone; numbers to log and admin event only. Today's callers return only `message` and `reason`, not `detail` (`enqueue-collection.js:92-94`, read), so renaming `detail` leaks nothing. The prompt cap text prints numbers only for an account member or a direct account; a guest gets the fixed sentence. V21 covers both. |
| A F-Md1 / B M3: release 1 reaches the webhook | **CLOSED** | Section 8 now says "not edited", not "not reached"; guard 1 hides Upgrade, Billing portal and purchase CTAs on agency brands through `brand_account_kind` (not through `accounts` RLS); guard 3 is a daily watchdog finding; the residual (public payment link with the login email) is stated. V11, V18. Fail-open edge, LOW N-L4. |
| A F-Md2 / B M2: guests become owners; trigger on update | **PARTIAL** | Closed for new logins: trigger is INSERT only and writes `member` on an agency brand (4.5); `repoint_default_brand` replaces ad hoc updates. **Gap:** `account_attach_brand` keeps the confirmed existing users' rows as they are (ON CONFLICT DO NOTHING; nothing in 4.6 changes a role). The former direct customer of an attached brand keeps `role = 'owner'` from the step 2 backfill, so in P3 that end customer may manage `direct` grants on an agency brand (invite arbitrary addresses), which is review B M2's exploit. N-Md3. |
| A F-Md3: staff login without a stray brand | **CLOSED** | `create_staff_login` (9.1) creates the login on the home brand, the 4.5 trigger writes the `primary` row as `member`, then `account_add_staff`. `convert` builds the first agency from the lead's own brand. Non-atomic pair, LOW N-L3. |
| A F-Md4 / B L6: step 4 rollback after step 5 | **PARTIAL** | The trap is named and the rollback text exists, but it says "`detach_brand` every attached brand **and** `remove_member` every staff member". `account_remove_member` refuses the last owner (422), so the runbook cannot complete, and every successful removal bans a login (4.6). Detach alone already restores the single-brand state (section 4 below). N-Md4. |
| B Md1: per-brand P1 is not the ruled product; inert overrides | **CLOSED** | Q11 escalated with default "P2 before step 5"; override columns moved to P2 and read there (4.3, 7.4). Needs Constantin's ruling, which is the correct closure for a product question. |
| B Md2: `account_members` backfill unspecified | **CLOSED** | Step 1 backfills owners from `user_profiles`; `convert_to_agency` converts the lead's own account, so the unique index never collides. Window between steps 1 and 2, LOW N-L2. |
| B Md3: `attach_brand` guard guards nothing | **CLOSED** | Refuses research, archived and test categories, a brand in a multi-brand account, a home brand, and unconfirmed users; two-call confirm echoing the name (4.6, 9.2, V20). Live categories are only `active` 34, `free` 1, `research` 37, so the research refusal is the one that bites. |
| B Md4: keys and grants survive removal | **CLOSED** | Same evidence as M1 for keys and OAuth. Live: `client_api_keys` holds 0 rows, so the creator re-check breaks no existing key on deploy day; `oauth_grants` holds 3, revoked per call. |
| B Md6 / A F-L5: notices and grant note reach the guest | **PARTIAL** | `set-client-plan.js` routing (9.6) and the non-admin select without `plan_grant_note` (6.1) are specified. **Gap:** `expire-plan-grants.js:219-228` writes a `client_notifications` row ("Your {plan} package has ended ... returned to the Free plan") on every lapsed grant. Section 8 puts agency brands on `plan_source = 'package'` or `'manual'` with `plan_grant_until`, and step 3 moves `client_notifications` RLS to `has_client_access`, so the agency's end customer reads the agency's contract lapse. Review B listed `expire-plan-grants.js` in its regression surface; revision 2 does not touch it. N-Md5. |

---

## 3. New findings

### BLOCKER

**N-B1. `home_client_id ... on delete restrict` makes every client
undeletable from step 1; the three provisioning rollbacks fail silently, the
unedited webhook multiplies orphan paid clients, and `delete-client.js`
half-deletes a brand.**

- Spec: 4.3 (`home_client_id integer null references public.clients(id) on
  delete restrict`; `set_account_home()` AFTER INSERT sets it to `NEW.id`),
  13 step 1 (backfill: 72 accounts, "home = the client").
- Evidence: after step 1 every client is the `home_client_id` of its own
  account, so `DELETE FROM clients WHERE id = x` raises 23503. Today no FK to
  `clients` is RESTRICT (read live: every referencing FK is cascade, set null,
  or no action on child tables the code clears first). Delete sites:
  - `provision-account.js:212`: rollback after a failed `user_profiles`
    insert; error not checked; the orphan client and its account stay.
  - `_provision_client.js:341` (`deleteClient`), called by every rollback
    (`:348`, `:367`, `:371`, `:384`, `:392`, `:418`, `:429`, `:474`, `:479`, `:514`): returns false, the function reports
    `rollback_failed`; the orphan stays.
  - `stripe-webhook.js:658`, `:683`, `:692`: rollback after a failed profile
    insert or a failed invite; error not checked; then `throw`, the handler
    releases the idempotency row (`:182`), Stripe redelivers. On the no-login
    branch the redelivery finds no user (invite failed), calls
    `createClientRow` again, hits the orphan's slug, retries with a suffix
    (`:1134`), and leaves a second orphan carrying the same
    `stripe_customer_id`, a paid `plan` and a stamped cadence. Each
    redelivery adds one. Subscription update and delete then move every client
    sharing the customer id together (`stripe-webhook.js:873`, `:883`, `:976`).
  - `delete-client.js:102`: runs AFTER it has deleted every attached auth user
    (`:76-84`), the profiles (`:90`), and `ai_results`, `prompts`,
    `competitors`, `user_clients` (`:95-98`). The client delete then fails and
    the admin gets a 500 with the brand row still present and its logins and
    history gone. Not reversible.
  - Section 9.5's own plan ("after deleting a brand that was alone in its
    direct account, delete that empty account") cannot run in that order
    either: the brand cannot go before its account stops pointing at it.
- Exploit path: no attacker needed. Step 1 is applied by Constantin ahead of
  any push ("migration first"). The next signup whose profile insert fails, the
  next paid checkout whose invite fails, or the next admin "Delete account"
  takes the path above. The paid-checkout case is the standing-context class:
  a billing path silently broken by a step the spec calls safe, in a file the
  spec forbids editing.
- Why the read-back misses it: step 1's rolled-back block inserts a client per
  path and asserts an account (13 step 1, V15). It never deletes.
- Fix: make it `home_client_id ... on delete set null`. For a direct account
  the delete then succeeds; for an agency account the `agency_has_home` CHECK
  rejects the null, which is exactly the "never delete an agency home brand"
  refusal 9.5 wants, enforced by the database. Add an `AFTER DELETE ON
  clients` step (or extend `delete-client.js`) that deletes a direct account
  left with no brand, so rollbacks in the unedited files leave no orphan
  account. Extend the step 1 rolled-back read-back: insert through each path's
  column list, then `delete` the row, and assert both succeed and no account is
  left. Add a V-criterion: a provisioning rollback and an admin delete each
  leave zero rows in `clients` and `accounts` for the brand.

### MEDIUM

**N-Md1. A removed pre-existing login keeps its `backfill` row on the home
brand, and the ban that covers it has no stated duration.**
- Spec 4.2 (`backfill` never removed automatically), 4.6
  (`account_remove_member` deletes "the user's `primary` row on the home
  brand"), 9.1 (`convert` uses the lead's existing brand as home).
- Every login that exists at step 2 holds a `backfill` row. Live: one brand
  already has two logins (`user_profiles` grouped by `client_id`, 1 brand with
  more than one). If that brand's account is converted, its second login becomes
  an account owner (spec: "existing members keep their roles") and, once
  removed, keeps the `backfill` row: neither 4.4 check returns it, and after P4
  it still grants the home brand. The ban (`updateUserById(id, { ban_duration
  })`) is the only control, and the spec never states the value, so an admin
  can set a short one and the access returns when it lapses.
- Fix: `account_remove_member` and `account_remove_guest` delete the user's
  rows on the brand whatever their `grant_source` except `direct`, or
  `convert_to_agency` rewrites the home brand's `backfill` rows to `primary`.
  State the ban value ("876000h" or equivalent) and add a third standing check:
  a `user_clients` row on an agency brand whose user is neither an account
  member nor a profile defaulting to that brand.

**N-Md2. The 9.5 refusal blocks deleting every customer brand.**
- Spec 9.5: refuse "when any attached profile holds an `account_members`
  row". Step 1 backfills an owner row for every profile, and the 4.5 trigger
  adds one for every new direct login. So V16 as written makes
  `delete-client.js` answer 409 for an ordinary direct customer.
- Fix: refuse only for an `account_members` row on an account other than the
  brand's own direct account, or on any `kind = 'agency'` account.

**N-Md3. Attaching a brand leaves its former customer as brand `owner`.**
- See the closure row for A F-Md2 / B M2. `account_attach_brand` should set
  the confirmed users' rows on the attached brand to `role = 'member'` (and
  their `grant_source` to `primary`, which also closes N-Md1 for them), in the
  same locked function.

**N-Md4. The step 4 rollback runbook cannot complete and bans staff for no
reason.**
- Spec 13 step 4. `remove_member` 422s on the last owner; each other removal
  bans the login. Detaching every attached brand alone returns every staff
  member and guest to rows on their default brand only, which the reverted
  equality code serves consistently.
- Fix: "first `detach_brand` every attached brand, then revert". Keep
  `remove_member` out of the rollback.

**N-Md5. Grant lapse notices reach an agency's end customer.**
- `expire-plan-grants.js:219-228` (see the closure row for B Md6).
- Fix: skip the `client_notifications` insert when the brand's account is
  `kind = 'agency'`, the same rule as 9.6, and add it to the step 4 file list
  and to V17.

### LOW

- **N-L1.** `account_attach_brand` locks the target account only. A profile
  insert on the brand during an admin attach runs `sync_primary_membership`
  against the brand's old direct account without that lock: the new login can
  escape the confirm list and land as `owner`. Lock the source account too, or
  `select ... for update` the `clients` row first, and have the trigger read
  `account_id` from that locked row.
- **N-L2.** Between steps 1 and 2 a new signup gets an account but no
  `account_members` row (the trigger arrives in step 2, the member backfill ran
  in step 1), and step 2 says "backfill 36 rows". Ship steps 1 and 2 as one
  migration, or make step 2 re-run both backfills as `insert ... select ... on
  conflict do nothing` over all profiles.
- **N-L3.** `create_staff_login` is a profile insert plus a separate
  `account_add_staff` call. A failure between them leaves a home-brand member
  who is not staff, invisible to both 4.4 checks. Do both in one SQL function.
- **N-L4.** Guard 1 hides billing only when `activeBrandAccountKind ===
  'agency'`; on a read error the kind is null and Upgrade shows. Hide billing
  while the kind is unknown (5.6 already says "hide account UI" on error).
- **N-L5.** `account_remove_member` leaves P3 `direct` rows on agency brands.
  Either delete them too or state that a direct grant outlives staff removal.
- **N-L6.** `convert_to_agency` promotes every login already on the lead's
  brand to agency owner without confirmation (live: one brand has two logins).
  Refuse unless the caller names them, as attach does.

### INFO

- **N-I1.** `ensure_client_account()` keeps a caller-supplied `account_id`,
  which bypasses every attach guard. No viewer can reach it (`clients` has only
  `clients_select`, no INSERT or UPDATE policy, read live), so only service
  role code could. Consider rejecting a non-null value outside the 4.6
  functions.
- **N-I2.** The `serial` id creates `accounts_id_seq`, which inherits the
  project's default sequence grants to `anon` and `authenticated`. No exploit
  (no insert path); add it to the `relacl` read-back.
- **N-I3.** PRE-EXISTING. `enforce_prompt_cap` is SECURITY DEFINER with
  `search_path = public, pg_temp` and EXECUTE for PUBLIC, `anon`,
  `authenticated` (read live). P2 rewrites it; set `search_path ''` and revoke
  in the same migration.
- **N-I4.** Triggers: live user triggers are only `trg_enforce_prompt_cap` and
  `trg_prompt_location` on `prompts`; none on `clients`, `user_profiles`,
  `user_clients`, `client_locations`. Revision 2's triggers write `accounts`,
  `account_members`, `user_clients`, which carry no triggers, so there is no
  recursion. The P2 cap rewrite reads `clients.account_id`; it does not
  interact with `trg_prompt_location` (which fills and pins
  `prompts.location_id`). `ensure_primary_client_location` and
  `enforce_prompt_location` are SECURITY DEFINER, `search_path ""`, service
  role only, untouched. Locations are now 70 with 70 primaries (the brief's 66
  is stale); the spec makes no location count claim, and attach leaves a
  brand's locations with the brand.
- **N-I5.** 4.6 lists `archived` and `test` categories; neither exists live.
  Harmless.
- **N-I6.** The OAuth MCP path checks `grant.revoked_at` per call
  (`mcp-server.js:1156-1169`), so revocation in `account_remove_member` takes
  effect on the next request, not at token expiry.
- **N-I7.** Group B substitution, `oauth_grants_select` exception,
  `ticket_client_id` fix, the 11 `client_events_type_check` values: re-read
  live, unchanged from the earlier reviews, and the spec carries them
  correctly. `ticket_client_id` is still SECURITY DEFINER with no `search_path`
  and EXECUTE for PUBLIC and `anon` (pre-existing, fixed at step 3).

---

## 4. New surface (brief item 2)

| Object | SECURITY DEFINER, search_path | EXECUTE | Can a viewer widen access with it? |
|---|---|---|---|
| `ensure_client_account`, `set_account_home` (triggers) | yes, `''` | revoked from PUBLIC, anon, authenticated | No: viewers cannot insert `clients` (no policy). The FK choice is N-B1. |
| `sync_primary_membership` (trigger) | yes, `''` | revoked | No: `user_profiles` has SELECT policies only (`profiles_read_own`, `user_profiles_select_own`, read live), so no viewer insert fires it. |
| `account_reconcile` and the seven 4.6 writers | yes, `''` | `service_role` only | No; and they lock per account. |
| `is_account_member(aid)` | yes, `''` | authenticated, service_role | Returns only the caller's own membership; no widening. |
| `brand_account_kind(cid)` | yes, `''` | authenticated, service_role | Null unless `is_admin() or has_client_access(cid)`; leaks only `kind` for a brand already readable. |
| `accounts`, `account_members` | RLS on, SELECT policies only | `revoke all` then `grant select` to authenticated | No write grant, no write policy. |
| `user_clients` | existing RLS | DML revoked from anon, authenticated (live today: full `arwdDxtm` for both) | Closes the latent table grant. |
| `clients.account_id` | n/a | `authenticated` holds table-level UPDATE on `clients` (live), but there is no UPDATE policy | No viewer can set it. |

Grants text in 4.7 covers PUBLIC as well as `anon` and `authenticated`, which
matters here because `pg_default_acl` grants functions to PUBLIC. Read-backs
compare `relrowsecurity`, `relacl`, `proacl`, `proconfig` to expected strings,
as review B asked.

## 5. Release order (brief item 3)

| Step | Safe as ordered? | Rollback real? |
|---|---|---|
| 1 | **No**: N-B1 from the moment it is applied; read-back blind to it. Inserts are safe. | Yes (drop NOT NULL, triggers, column, tables). Rolling back also restores deletes. |
| 2 | Yes, if run as a re-runnable backfill over all profiles (N-L2). | Yes before step 8, stated invalid after it. |
| 3 | Yes: with one row per profile on its own brand, `has_client_access(x)` equals today's equality, so Group B substitution is the identity (5.5 queries). | Yes, old texts saved in the migration. |
| 4 | Yes before step 5. | Before step 5, a plain revert. After step 5, the text is wrong (N-Md4); detach alone is the correct and sufficient pre-step. The first review's trap (F-Md4) is otherwise answered. |
| 5 | Yes after 3, 4 and (default) 6. | `detach_brand`, `remove_member` as stated. |
| 6 | Yes; one-brand accounts unchanged. Set `search_path ''` on the rewrite (N-I3). | `create or replace` with saved bodies. |
| 7 | Yes. | Revert. |
| 8 | Yes, if every login holds a row on its default brand (5.5 #2). | Restore the old body. |

## 6. Accessibility

Design stage, nothing rendered. Not measured: contrast, focus, hit targets.
Section 6.2 now carries review A's requirements (listbox semantics, keyboard
reach, focus return, 44 px rows at phone width, identity block and switcher
never both in the tab order). Owed at the build review: contrast of the switcher
label, brand row and filter placeholder in both themes, and the Account page
"contact us" line.

## 7. Regression surface (grep)

- `clients` deletes broken by N-B1: `provision-account.js:212`,
  `_provision_client.js:341`, `stripe-webhook.js:658`, `:683`, `:692`,
  `delete-client.js:102`.
- Notice writers on agency brands: `set-client-plan.js:196-218` (in spec),
  `expire-plan-grants.js:219` (not in spec, N-Md5).
- Membership readers in the browser: only `src/lib/clientContext.tsx:211`; no
  browser code writes `user_clients`, so the step 2 revoke breaks nothing.
- Credential paths: `mcp-server.js` `resolveKey` (`:1107-1145`) and
  `resolveOAuth`; `oauth-token.js` `userStillMapped` (`:82-86`).
- `accounts` and `account_id` appear in no Netlify function today (grep), so
  step 1 to 3 SQL changes no current reader except through N-B1.

## 8. Data and claim integrity (read-only SELECTs, 2026-11-16)

| Claim | Result |
|---|---|
| 72 clients: active 34, free 1, research 37 | confirmed |
| 36 profiles, 0 `user_clients` rows, `accounts` absent | confirmed |
| No user trigger on `clients` (1.4) | confirmed; only `prompts` carries two |
| `user_clients` grants full DML to anon and authenticated (1.1) | confirmed `arwdDxtm` |
| `clients.name` NOT NULL (implied by 4.3) | confirmed |
| `add_client_locations` SECURITY DEFINER, service role only (4.4) | confirmed |
| `sum_cost_eur` EXECUTE postgres and service_role only (1.3) | confirmed |
| `ticket_client_id` no search_path, PUBLIC and anon EXECUTE (1.1) | confirmed |
| `client_events_type_check` 11 values, last `location_change` (1.4) | confirmed |
| `client_api_keys.created_by`, `revoked_at`; `oauth_grants.user_id`, `revoked_at` exist (4.6) | confirmed; `client_api_keys` 0 rows, `oauth_grants` 3 rows |
| Every FK into `clients` today | none RESTRICT (basis of N-B1) |
| `client_locations` 66 (brief) | 70 rows, 70 primary today; the spec does not cite it |

No user-facing copy is added by the spec; strings remain `copy: pending
bg-copy`.

## 9. What was not checked

- Supabase Auth: whether `updateUserById` with `ban_duration` revokes existing
  refresh tokens or sessions at once, whether `auth.getUser(token)`
  (`_auth.js:93`) rejects a banned user before JWT expiry, and the project's JWT
  expiry. The spec defers the expiry read to `bg-backend`; the ban's effect on
  the Netlify path is therefore unverified.
- D1 (`docs/arch/multi-site-tenancy.md`) was not re-read; departures were
  judged as stated in section 18.
- No concurrency was executed; N-L1 and the lock analysis are reasoned from
  READ COMMITTED semantics.
- No browser, build, tsc or tests: nothing is built.
- The 4.6 function bodies do not exist; every judgement is on the prose
  contract.
- `client-api-keys.js` mint and revoke rules beyond the cited gate,
  `oauth-revoke.js`, `create-portal-session.js` beyond its gate.
- Watchdog internals (`ops.watchdog_findings()`) were not read.
- Secret scan of this report: run after writing, 0 secret-shaped values; the
  pattern scan matches design vocabulary only. Dash scan: `rg "[\x{2014}\x{2013}]"`
  with a positive control file, 0 hits in this report.

## 10. Routing

- N-B1: back to `bg-architect` (FK choice, empty-account cleanup, step 1
  read-back, V-criterion), then `bg-backend` on Opus. Blocks the build.
- N-Md1, N-Md3, N-L1, N-L3, N-L5, N-L6: `bg-architect`, 4.6 function
  contracts.
- N-Md2, N-Md5: `bg-architect`, ledger and 9.5 or 9.6 text.
- N-Md4, N-L2: `bg-architect`, section 13.
- N-L4: `bg-architect` with a `bg-app` note.
- A third re-review of the amended sections (4.3, 4.6, 9.5, 13) is required
  before any build; the rest of revision 2 need not be re-read.
