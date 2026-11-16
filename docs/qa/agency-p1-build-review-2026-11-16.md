FAIL

# Agency multi-brand, release P1: independent build review

Reviewer: bg-verify (Opus), read-only. Date 2026-11-16.
Spec: `docs/arch/agency-multi-brand.md` revision 4 (read in full).
Scope: the SQL, server, test and dashboard files named in the review brief.
Unrelated working-tree edits (GlowScoreDial.tsx, index.css, AIVisibility.tsx,
Dashboard.tsx, tokens_sync.test.js, unlock-audit-report.js, brandgeo/web) were
ignored.

**Verdict: FAIL**, scoped. Nothing here is a live exposure today: production
holds 0 `user_clients` rows, 0 clients with a Stripe id, 0 API keys, and no
agency can exist before step 5 (which Q11 puts after P2). The SQL files are
sound and their pre-apply checks still match production (see section 7), so
steps 1 to 3 may be applied and read back. The **step 4 push should wait** for
F1 and F2, both small, because V18 is not fully met and the ban retry contract
of spec 4.6 is not implemented. Under this seat's rules a criterion that is not
met cannot be approved, whatever its present reachability.

---

## 1. Calibration

1. `git diff --stat` on the reviewed paths: 28 files, 725 insertions, 100
   deletions (includes unrelated `tokens_sync.test.js` and
   `unlock-audit-report.js`, ignored). New untracked: the four `db/supabase-agency-*`
   files, `agency-admin.js`, three `tests/agency_*.test.js`. Every reviewed
   file is inside the spec 13 step 4 file list. Spec section 14 files are
   untouched: `git status` on `stripe-webhook.js`, `_plans.js`, `_cost.js`,
   `accept-terms.js`, `_terms_gate.js`, `_affiliate_stripe.js`,
   `invite-redeem.js`, `_provision_client.js`, `BrandLogo.tsx`,
   `components/ui/`, `McpAccessSection.tsx` printed nothing.
   `provision-account.js` carries only the `banned_until` check (8 added lines).
2. Secret scan over 5,739 added lines (diff hunks plus the new files): one hit,
   `process.env.OPENAI_API_KEY = 'test-openai-placeholder'` in a test, a
   placeholder. 0 live values. Addresses: only `@example.com` fixtures and the
   company support address. No real person, client or lead name (scanned for
   the known client and partner names: 0).
3. Criteria V1 to V23 are checkable; V9, V12 (size, 12-brand layout), V13
   (live ban), V15 (real signup) need a browser, a build or production writes,
   which this seat may not run. Marked below.
4. Baseline: `tsc` exit 0 reported by the orchestrator, not re-run (forbidden
   here). `npm run build` not run (forbidden). Node tests re-run here, section 7.
5. Most sensitive function: `assertClientAccess`
   (`brandgeo-dashboard/netlify/functions/_auth.js:178-205`), reached through
   `requireAuth` at `_auth.js:131-134` after the ban refusal at `_auth.js:106-108`.
6. Write access used: this file only. No reviewed file edited.

CALIBRATED.

---

## 2. Acceptance criteria, V1 to V23

| V | Status | Evidence |
|---|---|---|
| V1 | MET | grep of `profile.client_id` in `netlify/functions`: remaining comparisons are `social-*.js` (rows 11 to 20, each behind `adminOnly`), `create-portal-session.js:37` (row 23), `invite-redeem.js:178-179`, `oauth-authorize.js:76-78`, `mcp-server.js:1210` (rows 24 to 27), `resend-invite.js:350-354` (row 28), and `_auth.js:188` (disjunct c inside the helper). Rows 2 to 10 call `assertClientAccess` (`collect-chatgpt.js:175`, `collect-claude.js:175`, `collect-prompt.js:189`, `enqueue-collection.js:70`, `generate-recommendations.js:95`, `seo-audit-page.js:106`, `seo-crawl.js:55`, `seo-draft.js:150`, `seo-opportunities.js:38`); rows 21, 22 at `suggest-prompts.js:111`, `support-request.js:128` |
| V2 | NOT CHECKABLE (P4) | P4 work; `_auth.js:188` still holds disjunct (c), as P1 requires |
| V3 | MET (unit), live NOT CHECKED | `tests/agency_access.test.js` 50 of 50, including a membership row passing every ledger row; no live staff token exists |
| V4 | MET (unit and dry run) | no row is 403 (`_auth.js:203`); RLS empty for a brand without a row measured in R3 by the orchestrator |
| V5 | PARTIAL | RLS isolation measured in R3 (orchestrator); `canSwitchClient` false with one brand (`clientContext.tsx:424`); `plan_grant_note` dropped from the member select (`clientContext.tsx:101`, `:260`) but still returned by RLS to a guest who queries PostgREST directly (F8); `/portfolio` does not exist in P1 |
| V6 | MET (dry run) | 5.5 #1 to #4 = 0 in R2 (orchestrator, 37 of 37); default brand path unchanged (`_auth.js:188`) |
| V7 | MET (unit) | read error and throw are 403 (`_auth.js:196-202`), tests "a user_clients read error is 403, never a fallback" and "a read that throws is 403"; frontend error branch keeps the default brand only (`clientContext.tsx` `linkErr` branch) |
| V8 | MET (static) | `canSwitchClient: !isAdmin && clients.length > 1` where the provider's `isAdmin` is the real role (`clientContext.tsx:424`); admin switcher gate unchanged; identity block renders for an admin in View as user |
| V9 | NOT CHECKED | browser required; by design the caches are keyed per brand (spec 6.3) |
| V10 | PARTIAL | three 4.4 checks after every 4.6 function measured in R3 (orchestrator); locks present (`account_lock_brand`, ascending order in attach and repoint); the concurrent attach plus remove and the login-during-attach race were not exercised |
| V11 | NOT MET YET | query in place (`db/supabase-agency-watchdog-2026-11-16.sql:297-306`); file and R4 not executed. Becomes MET when R4 answers 3 pass, 0 fail |
| V12 | PARTIAL | no `motion` in `Layout.tsx` imports (grep of `Layout.tsx`, `clientContext.tsx`, `ui/Combobox.tsx`: comment only); entry chunk size and 12-brand layout at 390 and 1440 NOT CHECKED (no build, no browser) |
| V13 | PARTIAL | row deletion over every source (`supabase-agency-accounts-2026-11-16.sql:1091-1093`), fixed `876000h` (`agency-admin.js:58`, `:467`), `requireAuth` 401 (`_auth.js:106-108`), `provision-account.js:90-93`, invite links revoked (`accounts sql:427-428`). Live ban, sign-in and refresh refusal, `getUser` and `verifyOtp` behaviour, JWT expiry: NOT CHECKED. A failed ban has no retry path (F2) |
| V14 | MET (unit and dry run) | `creatorStillHasAccess` (`mcp-server.js:1111-1126`, wired at `:1156-1161`); `tests/agency_lifecycle_server.test.js` section 2, 8 checks; codes marked used (`accounts sql:423-424`); credentials revoked measured in R3. Production holds 0 keys, so no key is affected on deploy day |
| V15 | PARTIAL | rolled-back insert then delete for all three paths plus the scratch-login variant measured in R2 (orchestrator); the real signup after the push is owed |
| V16 | MET (unit and dry run) | refusals before step 1 (`delete-client.js:151-162`); 8 checks in `agency_lifecycle_server` section 1; revert path measured in R3. The reverted-code delete after a rollback is NOT CHECKED live |
| V17 | MET (unit) | `set-client-plan.js:200-246`, `expire-plan-grants.js:220-231`; lifecycle sections 4 and 5, 6 checks |
| V18 | **NOT MET (PARTIAL)** | Account page guards correct (`Account.tsx:368`, `:636-641`, `:749`, `:824-829`, `:837`, `:856`). But the sidebar Billing row is gated on the Stripe id only (`Layout.tsx:1313`) and `create-portal-session.js` is not gated on kind (F1); `McpAccessSection.tsx:731-733` still shows "Upgrade to Radar" on an agency brand below Radar (F6) |
| V19 | MET (dry run) | `relrowsecurity`, `relacl`, `proacl` against expected strings and ten privilege probes in R2 (orchestrator); grants in `accounts sql:1263-1306` match spec 4.7 |
| V20 | MET | refusals `accounts sql:851-854` (research, archived, test) and `:867-876` (unconfirmed); measured in R3 |
| V21 | NOT CHECKABLE (P2) | P2 |
| V22 | PARTIAL | member and primary on attach (`accounts sql:882-886`), out of any account (`:889-894`), owner again on detach (`:946-957`), measured in R3; the P3 `client-members.js` refusal cannot be checked until P3 exists |
| V23 | MET | `accounts sql:767-776` refusal, `:782-786` rewrite; measured in R3 |

---

## 3. Findings

### F1. MAJOR: an attached brand that carries a Stripe customer opens its billing portal to the agency's staff

- Where: `db/supabase-agency-accounts-2026-11-16.sql:845-876` (no refusal for a
  Stripe id), `brandgeo-dashboard/src/components/Layout.tsx:1313` (sidebar
  Billing row gated only on `activeClient?.stripe_customer_id`),
  `brandgeo-dashboard/netlify/functions/create-portal-session.js:29`, `:37`
  (widens through `requireAuth({ clientId })`, `_auth.js:131-134`).
- Scenario: an existing self-serve customer that pays by card (their brand has
  `stripe_customer_id`) is taken over by an agency. The admin runs
  `attach_brand`; nothing refuses it, the preview does not mention the Stripe
  id. Every staff member of the agency now holds an `account` row on the
  brand. When a staffer switches to it, the sidebar shows Billing (the member
  select includes `stripe_customer_id`); one click, or a direct POST
  `{ client_id }` to `create-portal-session`, opens the former customer's
  Stripe portal: card brand and last four, billing address, invoices, and
  Cancel subscription. The subscription also keeps billing the former customer
  for a brand now sold to the agency. The guard 3 watchdog reports it within
  the hour, after the fact.
- Reachability: not before step 5. Spec 8 assumes "stripe_customer_id stays
  NULL on agency brands", but no write path enforces it.
- Fix: (a) `account_attach_brand` refuses with a new token
  (`brand_has_stripe`) when `stripe_customer_id` or `stripe_subscription_id` is
  not null, and the attach preview names it; (b) gate the sidebar Billing row
  on `activeBrandAccountKind === 'direct'`, as `Account.tsx` already does;
  (c) optional server belt: `create-portal-session.js` refuses a non-admin on a
  brand whose account is not direct (it is not on the section 14 list).
  Owners: bg-backend (a, c), bg-app (b). This also needs one line in spec 4.6
  and 9.2 (bg-architect).

### F2. MEDIUM: a failed ban cannot be retried, and until it lands the removed login keeps its default brand

- Where: `brandgeo-dashboard/netlify/functions/agency-admin.js:463-475`; the SQL
  refuses a second call at `supabase-agency-accounts-2026-11-16.sql:1075-1078`
  (`user_not_member`) and `:1133-1137`.
- Scenario: `remove_member` commits, then GoTrue answers 5xx to
  `updateUserById`. The admin gets 500 `ban_failed` and a sentence telling them
  to ban by hand in Supabase. Pressing Remove again returns 409 and bans
  nothing. Until a human bans the login, disjunct (c) still grants the home
  brand: `requireAuth` passes (no ban), `assertClientAccess` passes at
  `_auth.js:188`, and RLS `has_client_access` passes through
  `get_my_client_id()`; the token refreshes normally. Spec 4.6 says "the admin
  retries"; the build offers no retry.
- Fix: add a `ban_login` action that bans with the fixed `BAN_DURATION` only
  when the target is not an admin and holds no `user_clients` row on any brand
  of the named account (or the brand), so it cannot be used to ban an active
  member; or let `removeAndBan` treat `user_not_member` as "already removed"
  and proceed to the ban after the same row check. Owner: bg-backend.

### F3. LOW: read-back files state the wrong expected pass counts

- Where: `db/supabase-agency-readback-2026-11-16.sql:435` ("33 pass"), `:765`
  ("52 pass").
- Scenario: the dry runs produced 37 and 58 passes (orchestrator). An operator
  told "every answer must match" either stops a good apply or learns to ignore
  the count, which is the line meant to catch a missing assertion.
- Fix: write the measured counts (37, 58) into both lines. Owner: bg-backend.

### F4. LOW: create_guest_login is not one locked SQL call (builder question 7, agree it is a gap)

- Where: `agency-admin.js:623-637`; the kind is read without a lock, then the
  profile is inserted, and `sync_primary_membership`
  (`accounts sql:701-716`) re-reads the kind under the lock.
- Scenario: a detach of the brand commits between the read at `:625` and the
  insert at `:637`. The trigger sees a direct account and makes the new login
  an `account_members` owner and brand owner of the detached brand's own
  account. No cross-tenant read follows (the brand is no longer the agency's),
  but the login the admin meant as a guest owns a customer account, and spec
  9.1 says every write action is one rpc.
- Fix: `account_create_guest_profile(p_client_id, p_user_id, p_actor)`, under
  `account_lock_brand`, refusing a non-agency account and the home brand, then
  the profile insert, reconcile and the event row. Owner: bg-backend.

### F5. LOW: two frontend callers never send the brand they work on

- Where: `src/pages/Prompts.tsx:136`, `:423` (suggest-prompts body has no
  `client_id`), `src/pages/Tickets.tsx:304-307` (no `client_id`);
  `src/components/SupportWidget.tsx:46-49` comment says the server ignores the
  body id, which is no longer true.
- Scenario: a staffer on client brand B files a ticket from /tickets; it is
  saved against the home brand, so it does not appear when they view brand B.
  Prompt suggestions are rate-limited and logged against the home brand.
  Functional, not a leak: the server checks every id it receives.
- Fix: send `client_id: activeClientId` in both places; update the
  SupportWidget comment. Owner: bg-app.

### F6. LOW: McpAccessSection still shows "Upgrade to Radar" on an agency brand (builder question 8, disagree that it is within V18)

- Where: `src/components/McpAccessSection.tsx:731-733`, fed by
  `Account.tsx:866` through `upgradeTo` (`Account.tsx:636-641`, now a mailto).
- Scenario: an agency brand on Free (P3's default for new brands, or set by
  an admin) shows a primary button reading "Upgrade to Radar" to a guest. It no
  longer reaches checkout, so guard 1's purpose holds, but V18 says the page
  shows no Upgrade, and the label promises a purchase the guest cannot make.
- Fix: needs a ruling, because hiding it means an optional prop on a shared
  component: either accept the mailto with a bg-copy label, or add an optional
  prop. Owner: Constantin, then bg-app.

### F7. LOW: new Account.tsx text uses raw palette classes

- Where: `src/pages/Account.tsx:845-847` (`text-slate-600`, `text-brand-400`,
  `hover:text-brand-300`).
- Scenario: the binding rule is semantic tokens only in new dashboard code; the
  line copies its neighbour at `:838`. Its light-mode contrast is not measured.
- Fix: `text-ink-3` and `text-accent-ink` (both mapped in `tailwind.config.js`).
  Owner: bg-app.

### F8. LOW: plan_grant_note is hidden from guests by the frontend only

- Where: `src/lib/clientContext.tsx:101`, `:260`; spec 9.6 says "6.1 stops
  non-admins reading it".
- Scenario: a guest with the anon key and their JWT calls
  `/rest/v1/clients?select=plan_grant_note&id=eq.<their brand>`; Group A
  `clients_select` returns it. Today the note is admin text; the runbook rule
  (no commercial text on agency brands) is the real control.
- Fix: amend spec 9.6 to say so (bg-architect), or move the note to an
  admin-only table later. No P1 code change required.

### INFO

- I1 (builder question 11): `account_remove_guest` always returns
  `ban_login: true` (`accounts sql:1146`), and `agency-admin.js:463-467` bans
  regardless of the field. In P1 no one can hold a row on an agency client brand
  without that brand being their default or being staff (refused at
  `:1128-1132`), so the ban is always right today. P3's `direct` grants change
  that: return `ban_login` only when `user_profiles.client_id = p_client_id`.
- I2: `account_remove_member` (`accounts sql:1052-1107`) does not check the
  account kind, so an admin can remove and ban a co-owner of a direct account.
  Admin-only; record in the runbook.
- I3: `ticket_client_id(bigint)` keeps EXECUTE for PUBLIC and `anon`
  (`rls-group-b sql:445-453`, RB5 expects it). Pre-existing; spec 5.4 asked only
  for the search_path.
- I4: `user_clients` keeps `rxtm` for anon and authenticated (R1.8). Exactly the
  revoke the spec asked for; TRIGGER and MAINTAIN are not reachable through
  PostgREST.
- I5: the 4.6 refusal tokens without a mapped sentence (`user_not_member`,
  `brand_not_in_account`, `not_home_default`, `user_is_account_member`,
  `brand_in_multi_brand_account`, `account_has_client_brands`) answer 409 "The
  change was refused." with the token in `code`; `concurrent_change` (40001)
  answers 500 "Nothing was changed", which is true. Copy for bg-copy.
- I6: `account_attach_brand` deletes the account_members rows of confirmed users
  only; any other member of the source direct account would cascade away with
  the empty account. Unreachable in P1 (a direct account's members are its
  brand's logins, all confirmed).
- I7: the step 1+2 file needs the step 3 file before any 4.6 function works
  (23514 on `client_events`), stated in its header; the dashboard push before
  step 1+2 would hide Upgrade for every customer (`brand_account_kind` missing,
  kind `unknown`). The order rule covers both.

---

## 4. Builder questions

1. `hashtextextended(..., 0)`: **agree.** Read 2026-11-16: `add_client_locations`
   uses `hashtextextended` and not `hashtext`; every function in this file uses
   the same form, so the lock keys agree. Spec 4.4 text should be amended.
2. Backfills filtered to `direct`: **agree.** Unfiltered, a re-run after step 5
   would give a removed staffer a `backfill` owner row on the home brand and an
   owner `account_members` row on the agency. Identical on a first run. Amend
   spec 13 step 2 wording.
3. `convert_to_agency` also sets `primary` rows to `member`: **agree.** Spec
   intent is that account owners manage through `account_members`; a primary
   row written by the trigger between step 2 and convert would otherwise stay
   a brand owner.
4. Detach restores ownership only to logins still holding a row: **agree.** A
   removed guest stays removed, which is the point of removal.
5. `brand_account_kind` returns the kind to an admin: **agree,** no
   contradiction: spec 5.2 defines the SQL function, 6.1 and 8 define the
   frontend field, which is null for a real admin (`clientContext.tsx`
   `activeBrandAccountKind`).
6. Failed ban not retryable: **disagree that it is acceptable as built.** F2.
7. `create_guest_login` not one locked call: **agree it is a gap.** F4, LOW.
8. McpAccessSection upgrade button: **disagree that it is within V18.** F6.
9. 400 for an admin's malformed `client_id`: **agree.** Every caller sends a
   number or canonical digits; the earlier admin pass-through only deferred the
   failure to a later query.
10. `set-client-plan.js` sends nothing when the kind is unreadable: **agree.**
    Same fail-toward-less-disclosure rule as 9.6; the admin sees
    `skipped: true` in `email`, and the plan change itself still lands.
11. `remove_guest` always bans: **agree for P1, record for P3.** I1.

---

## 5. Revision 4 closures (spec 20.2) against the code

| Finding | Status | Evidence |
|---|---|---|
| N3-Md1 OAuth code after removal | CONFIRMED | `accounts sql:423-425` marks every unused `oauth_codes` row of the user used; called from both remove functions (`:1096`, `:1143`) |
| N3-Md2 rollback leaves an agency | CONFIRMED | `revert_agency_to_direct`, `accounts sql:1156-1194`; refuses with client brands left; measured in R3 |
| N3-L1 home brand wording | CONFIRMED | `accounts sql:856-860` refuses only an agency's home |
| N3-L2 fragile 23514 read-back | CONFIRMED | `readback sql:262-287`: self-inserted client, own `DO` block, SQLSTATE asserted |
| N3-L3 provision-account and invite links | CONFIRMED | `provision-account.js:86-93`; `accounts sql:427-429` |
| N3-I1 cleanup order | CONFIRMED | `accounts sql:500-503` (null or `OLD.id`) plus an explicit 23514 for an agency home (`:490-494`) |
| N3-I2 scratch login rollback | CONFIRMED | `readback sql:203` section R2.4 |
| N3-I3 staff login creation | CONFIRMED | ownership test `agency-admin.js:515-546`, deletion only without a profile `:555-575`, email after commit `:609-614`, source `agency-admin` (`rls-group-b sql:485-488`) |
| N3-I4 notice fail direction | CONFIRMED | `expire-plan-grants.js:226-231`, bell kept `:246-251` |
| N3-I5 read-back placement, re-run safety | CONFIRMED | headers say after commit; `if not exists`, `create or replace`, `drop trigger if exists`, `drop policy if exists`, constraint drop then add |
| N3-I6 admins see no Upgrade | CONFIRMED | `Account.tsx:368` (null kind hides) |

---

## 6. Security trace: unauthenticated, free-tier, guest, staff

- Unauthenticated: `agency-admin.js:671` `requireAuth({ adminOnly: true })` before
  any read; 401 on a missing token (unit test). The four 4.6 groups of SQL
  functions are EXECUTE for `service_role` only (`accounts sql:1263-1301`,
  probes in R2).
- Free-tier direct viewer: one `backfill` owner row on their own brand; every
  ledger row passes on the default brand at `_auth.js:188` before any read, so
  their behaviour is unchanged; any other brand reads `user_clients`, finds
  nothing, 403. RLS identical (5.5, R2).
- Guest: one `primary` member row; `accounts` and `account_members` RLS return
  0 (no member row); `brand_account_kind` returns kind only for their brand.
- Removed staffer: rows gone, keys, grants, codes and invite links revoked in
  the same transaction; then the ban. Residual channel only through F2.

---

## 7. Commands run and results

- Node tests from `brandgeo-dashboard/`: `agency_access` 50 passed 0 failed;
  `agency_admin` 45, 0; `agency_lifecycle_server` 25, 0; `enqueue_force_gate`
  16, 0; `enqueue_locations` 19, 0; `mcp_server` 85 passed; `phase2_collector_gate`
  48, 0; `phase2_prompt_ownership` 126, 0; `ts_require_bundler` 5, 0.
- Edits to existing tests, judged: the four collector and enqueue suites now
  install the real `assertClientAccess` into their `_auth.js` stubs, which
  tightens them. `phase2_prompt_ownership` drops `N1_CLIENT_ARRAY` from two
  mutant lists only: with the collector's own guard removed the new access check
  still returns 400 for `[42]`, so the mutant no longer fails that case; the
  plain run still asserts it. `mcp_server` gives the key creator a membership
  row on clients 1, 2, 3, 5 (and 62, 63) and an auth record, which the 9.3
  re-check now requires; no assertion was removed. **No check was weakened.**
- Dash scan with `rg` and a character class of the em and en dash over the 5,739 added lines: 0 hits; positive
  control file with one em dash: 1 hit.
- Read-only production SQL, 2026-11-16: Group B policies 36, md5
  `0c462086f2a2b55a1739398e12957e3c` (matches step 3 pre-check P1); watchdog body
  md5 `0fc8dea647437615df5472c2952d29e6` (matches W0); `user_clients` 0 rows;
  `accounts` absent; clients with a Stripe id 0; `client_api_keys` 0 rows (0 with
  null `created_by`); `revoked_reason` check allows `'revoked'`; `oauth_codes`
  has `user_id` and `used_at`; `add_client_locations` uses `hashtextextended`.
- No code path upserts into `clients` (grep), so the BEFORE INSERT trigger
  cannot leave an orphan account through `ON CONFLICT DO UPDATE`.

---

## 8. Regression surface (by grep)

- `_auth.js` `requireAuth` change reaches every function that calls it (19
  non-admin callers listed by grep, plus every admin function): the ban check
  and the `clientId` path. Callers passing `clientId`: `client-api-keys.js`,
  `client-locations.js`, `create-portal-session.js`, `get-subscription.js`, all
  widened by design. Manual look owed: `create-portal-session.js` (F1).
- `clientContext.tsx` new fields: consumed by `Layout.tsx` and `Account.tsx`
  only; the member select drops `plan_grant_note`, so any page reading it for a
  non-admin now gets null (grep: Account page plan block shows it to admins).
- New triggers on `clients` and `user_profiles` reach every insert path:
  `provision-account.js:190`, `:216`; `_provision_client.js:331`, `:495`;
  `stripe-webhook.js:656`, `:689`, `:1088`; `agency-admin.js:637`; the
  `db/` seed files that insert research clients (they name no `account_id`).
- `client_events_type_check` and `client_invite_links_source_check` rewrites:
  every writer of those tables keeps its values (lists compared to production).

---

## 9. Data and claim integrity

No user-facing number is added. New customer-facing strings: "Brand", "Switch
brand", "Search brands", the "contact us" line on Account, all marked
`copy: pending bg-copy`; none states a fact that needs a source. Agency-admin
error sentences are admin-only.

---

## 10. Not checked

- Any browser rendering: the switcher at 390 and 1440, 12 brands, keyboard and
  screen reader behaviour, focus return, light mode contrast of new lines (V9,
  V12 layout).
- `npm run build`, entry chunk size, `tsc` (forbidden here; orchestrator
  reported `tsc` exit 0).
- The watchdog file and section R4 (not executed by anyone).
- R2 and R3 were not re-run by this seat; their results are the orchestrator's.
- Live ban behaviour: GoTrue `getUser` and `verifyOtp` with a banned user,
  refresh refusal, the JWT expiry value (V13).
- A real signup after the push (V15), concurrent attach and remove (V10).
- `oauth-token.js` and the OAuth MCP path were read only as far as the spec's
  revocation claims; their unchanged code was not re-reviewed.
- `_affiliate_auth.js` verifies JWTs itself without the ban check; it gates the
  affiliate portal, not a brand, so it was not followed further.
- Whether Supabase's dashboard "Ban user" control matches the wording in
  `agency-admin.js` `ban_failed` message.

---

## 11. To pass

Close F1 and F2, then re-check V18 and V13 statically; take a ruling on F6.
F3 to F5, F7 before the step 4 push if convenient, else before step 5. F8 and
the INFO items are spec or runbook notes.
