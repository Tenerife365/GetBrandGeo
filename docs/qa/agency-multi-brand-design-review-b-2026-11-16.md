VERDICT: FAIL

# Agency multi-brand: design review B, 2026-11-16

Reviewer: `bg-verify` (Opus), read-only. Subject: `docs/arch/agency-multi-brand.md`
(945 lines, status READY for design review). Gate: AGENT-OS section 6, auth, RLS
and billing adjacent, so this review precedes any build.

Counts: **1 BLOCKER, 4 MAJOR, 8 MEDIUM, 10 LOW, 7 INFO.**

The authorization core holds up: INVARIANT M, the explicit fan-out instead of an
account predicate, and the 5.5 no-widening proof are sound as written, and every
`path:line` citation I re-measured is accurate. The spec fails on what sits around
that core. Step 1 of the migration breaks every signup path. Three revocation and
ownership gaps let a departed staff member or a brand guest keep or take control
of an agency brand. The claim that release 1 never reaches Stripe is false from
inside the dashboard. And the new tables and functions carry no grant or RLS
instructions, in a project whose default ACL hands both to `anon`.

Method: I read the spec end to end, `docs/arch/multi-site-tenancy.md` (D1)
sections 6, 10 and 17, and `docs/strategy/sprint-ladder-ruling.md` Decision 3
(lines 639 to 731). I read the cited code. I ran read-only SQL against
`duiyifepitvugyulobqm`: `pg_policies` full text, `pg_get_functiondef` and
`proacl` for 11 functions, `pg_default_acl`, `pg_trigger`, `pg_class` ACLs and
RLS flags, `information_schema.columns`, and counts. No write, no migration, no
git, no build, no browser.

---

## 1. Review criteria

| # | What was attacked (brief item) | Result | Evidence |
|---|---|---|---|
| 1 | Every `path:line` and production fact the spec cites | PASS, with 1 count error (L3) | All 28 ledger rows match (grep output in section 5). `_auth.js:19,21,67,99,105,115-119,221,235,238,255,278,321`; `clientContext.tsx:37,205,211,226,227,282,358-359`; `Layout.tsx:22,1061,1201`; `resultsContext.tsx:90`; `stripe-webhook.js:465-475,873,883,976`; `_provision_client.js:370-373`; `planConfig.ts:399,516-528,562-565`; `_plans.js:30`; `_cost.js:532` area. SQL: 142 public policies, Group A 15, Group B 36, 72 clients (34 active, 1 free, 37 research), 36 profiles, 1 admin, 0 null `client_id`, 0 `user_clients`, `accounts` absent, 0 Stripe ids, `plan_prompt_caps` values as cited. |
| 2 | Authorization design (INVARIANT M, A, fan-out, new policies, SECURITY DEFINER, default EXECUTE grants) | FAIL | M1, M2, M4, Md3, Md4, Md8. `pg_default_acl` for schema public, objtype f: `postgres=X, anon=X, authenticated=X, service_role=X`. `user_clients.relacl`: `anon=arwdDxtm, authenticated=arwdDxtm`. |
| 3 | Ledger completeness; rows 24 to 28 | FAIL | `delete-client.js:66-86` decides which logins to destroy by `user_profiles.client_id` and is missing (Md5). Rows 24 to 28 are safe as single-brand in P1 (they only narrow), except the default-brand non-revocability in M1. Rows 11 to 20 are admin-only (L2). |
| 4 | Group B substitution, 15 + 36 counts | PASS WITH FINDINGS | Counts reproduced exactly from `pg_policies`. `tickets_insert`, `tickets_select`, `ticket_comments_*` substitute mechanically; extra conjunctions are plain ANDs. `oauth_grants_select` is a per-user credential (L1). |
| 5 | 7.3 safe-subset claim; P2 changes to `enforce_prompt_cap()` and `checkCollectionLimits()` | PASS WITH FINDINGS | Arithmetic holds (`spend(bi) <= budget(plan(bi))` sums to the ruled SUM). But the ruling makes account-level enforcement part of the D1 build (ruling lines 680-682, 726-731), override columns are inert in P1 (Md1), and the P2 429 message leaks pooled euros to a guest (Md7). |
| 6 | Billing: release 1 never reaches `stripe-webhook.js` | FAIL | M3: `Account.tsx:626-635` opens public pricing; `stripe-webhook.js:465-475` resolves the payer's default brand; `:556` writes `stripe_customer_id`. Bound packages write the payer's customer id onto a brand that has none (`:556`, `:573`). |
| 7 | Migration order; is each step neutral alone; is each rollback real | FAIL | B1 (step 1 NOT NULL). L5, L6 (rollbacks). |
| 8 | Switcher guardrails | PASS | `Layout.tsx` imports no `motion` (only `motion-reduce:` classes at 376, 464, 942, 1230); `Combobox` already imported at `:22`; `canSwitchClient` keyed on `isRealAdmin` matches `clientContext.tsx:358-359`. |
| 9 | Contradictions with D1 not stated | PASS WITH FINDINGS | Stated: `my_account_id()`, `owner_user_id`, MAX vs SUM, R5. Not stated: migration step order reversed (L9); D1's webhook change (10.3) dropped and replaced by a guard that does not prevent (M3); D1 shares the B1 gap (D1 step 2 also sets NOT NULL with no creation path). |

---

## 2. Findings

### BLOCKER

**B1. Step 1 makes `clients.account_id` NOT NULL, and nothing creates an account
for a new client. Every signup, onboarding and checkout that creates a brand
fails from the moment step 1 is applied.**

- Spec: 4.3 (`-- NOT NULL after backfill`), 13 step 1 ("then `account_id` NOT
  NULL"), 4.5 ("zero edits to those files"), 14 (`stripe-webhook.js`, every
  handler, must not change).
- Evidence: three live insert sites, none of which can set a column that does
  not exist yet. `provision-account.js:182` (self-serve signup after auth),
  `_provision_client.js:331` (Onboard wizard and the lead import),
  `stripe-webhook.js:1088` (checkout for a payer with no login). `pg_trigger` on
  `clients` returns no user trigger, so there is no default either. The spec has
  no `before insert` trigger, no default, and no edit to those paths. D1 has the
  same gap (D1 17 step 2), so inheriting D1 did not catch it.
- Failure: step 1 is SQL, applied by Constantin before any push, and its
  read-back (5.5 query #3 returns 0, 72 accounts, policies listed) passes. The
  next free signup hits `23502 not_null_violation`, `/welcome` errors, and the
  person never gets a workspace. Same for an onboarded lead and for a new paying
  customer, where the webhook throws, deletes its idempotency row and Stripe
  redelivers forever. This is the "free-tier activation silently broken" class
  from the standing context, shipped by a step the spec calls behaviour-neutral.
  Section 14 forbids the one file edit that would fix the checkout path.
- Fix direction: add `ensure_client_account()` as a `BEFORE INSERT` trigger on
  `clients` (`SECURITY DEFINER`, `search_path ''`, EXECUTE revoked from PUBLIC,
  `anon`, `authenticated`): when `new.account_id is null`, insert one
  `kind='direct'` account named after the client and set it. Keep it in step 1,
  before the NOT NULL. Add a read-back: inside `begin; ... rollback;`, insert a
  `clients` row as the service role with no `account_id` and assert it gets one.
  Add an acceptance criterion: signup, Onboard and the no-login checkout branch
  each create a client after step 1. Alternative: keep the column nullable
  through P1, but then every reader of `account_id` needs a null branch.

### MAJOR

**M1. A staff member's default brand cannot be revoked, and the spec never says
what an agency staff member's default brand is.**

- Spec: 4.1 (`client_id` stays, NOT NULL in practice), 4.4 and 9.1
  `remove_member` ("never the row on their default brand"), 5.3 (P1 permissive
  disjunct), 9.3 (invite stays bound to the default brand).
- Evidence: every login has a default brand (0 null `client_id`). A staff login
  can only be created by Onboard (`_provision_client.js`, which creates a brand
  for it) or by self-serve signup (which creates a free brand), or by an invite
  for a brand. `has_client_access` grants on `cid = get_my_client_id()` before it
  reads `user_clients` (function body read today), and `assertClientAccess` in P1
  also ORs `profile.client_id === target`. OAuth grants stay alive while
  `profile.client_id === grant.client_id` (`oauth-token.js:85`,
  `mcp-server.js:1175`).
- Failure: an admin onboards a staff member's login on an agency client brand X,
  the natural choice because the wizard needs a brand. The person leaves the
  agency, and the admin runs `remove_member`. The `account` rows go, but X is
  their default brand: RLS still returns X through the first disjunct, every
  Netlify function still answers 200 through the permissive disjunct, and any
  OAuth connection to X stays live. The only ways out are deleting the login or
  hand-editing `user_profiles.client_id` in SQL, and neither is in the spec. The
  agency's client data stays open to a former employee.
- Fix direction: rule that agency staff get a default brand that is not a client
  brand (an agency workspace brand created with the account, research-like, no
  collection), and make `create_account` and `add_member` refuse a user whose
  default brand is a brand of another account. Or add a `rehome_default`
  admin action that moves `user_profiles.client_id` and deletes the old
  membership row in one function. Add criterion V13: after `remove_member`, the
  user gets 403 and empty RLS on every brand of the account, including the one
  that was their default.

**M2. The membership trigger makes every brand guest the OWNER of their brand.**

- Spec: 4.5 (`sync_primary_membership()` inserts `'owner'`), 13 step 2 (backfill
  `'owner'`), 4.2 (`owner` may manage the brand's member list), 9.2
  (`client-members.js`: brand `owner` may invite and remove).
- Evidence: D1 6.5 chose `owner` because "the person a site is provisioned for
  owns it". That holds for a customer's own sites. For an agency it inverts: the
  end customer given a login on their brand X is provisioned onto X, so the
  trigger makes them `owner` of X.
- Failure: in P3 that guest calls `client-members.js remove` on agency staff's
  `account` rows on X and locks out the agency that pays for X. Or they invite
  arbitrary addresses onto X. The fan-out check query (4.4) then fails on its
  own. The role is written in P1 (step 2 backfill and the trigger), so it has to
  be ruled now, not at P3.
- Fix direction: the trigger writes `'member'` when the brand's account has
  `kind = 'agency'`, `'owner'` otherwise, and the backfill stays `'owner'` (no
  agency exists yet). `client-members.js` may delete a `grant_source = 'account'`
  row only for an account owner or an admin.

**M3. Release 1 can reach `stripe-webhook.js`. The section 8 guard detects the
problem after the fact; it does not prevent it.**

- Spec: 8 ("The Stripe webhook is not edited and not reached"; "no code path and
  no admin action writes a `stripe_customer_id`" onto an agency brand, checked by
  a read-back).
- Evidence:
  1. Self-serve from inside the dashboard. `Account.tsx:626-635` sends the
     Upgrade action to `getbrandgeo.com/#pricing`. The checkout carries no brand,
     and `stripe-webhook.js:459` finds the payer by email. Lines `465-475` take
     `user_profiles.client_id`, and `:556` writes
     `{ plan, stripe_customer_id: custId, ... }` onto that brand.
  2. Bound packages (the admin's custom offers). `:556` writes the payer's
     customer id onto the bound brand. `:573` only keeps an EXISTING different
     id; a brand with none, which every agency brand has by rule, takes the
     agency's.
- Failure: an agency member switched to brand B presses Upgrade on the Account
  page and pays. Brand A, their default, is upgraded and stamped with a Stripe
  customer and subscription, and B is unchanged. If one Stripe Customer later
  lands on two brands through either path, `handleSubscriptionUpdated` and
  `handleSubscriptionDeleted` (`:873`, `:883`, `:976`) move both brands together,
  the exact hazard section 8 cites as its reason. The read-back finds this only
  after the money and the plan have moved.
- Fix direction: in P1, `bg-app` hides the self-serve Upgrade control and shows
  "contact us" when `accountAccess?.kind === 'agency'` or the active brand's
  account is an agency account. Expose `kind` to brand members through
  `ClientCtx`, not through `accounts` RLS, so INVARIANT A is not widened. The
  admin offer builder refuses to bind a package to an agency brand. The 8
  read-back becomes an `ops.watch_expectations` row, so a violation alerts the
  same day. Record in section 8 that the webhook is "not edited", not "not
  reached".

**M4. No RLS or grant instructions for the new tables and functions, in a
project whose defaults grant both to `anon`.**

- Spec: 4.3, 5.2 ("No INSERT, UPDATE or DELETE policy ... writes go through
  service-role functions only"), 4.4 ("EXECUTE granted to `service_role` only"),
  7.4 (`sum_cost_eur_account`, no security mode or grant stated), 13 step 1
  read-back ("policies listed").
- Evidence: `pg_default_acl` for functions in public grants EXECUTE to `anon`,
  `authenticated` and `service_role`, and `CREATE FUNCTION` also grants PUBLIC
  (see `enforce_prompt_cap` proacl `=X/postgres, anon=X, authenticated=X`).
  Tables get full DML: `user_clients` relacl is
  `anon=arwdDxtm authenticated=arwdDxtm`, so only RLS stops a write there. The
  spec never says `enable row level security` on `accounts` or
  `account_members`. Creating a policy does not enable RLS, and "policies
  listed" passes with RLS off. "Granted to service_role only" read literally adds
  a grant and revokes nothing.
- Failure (exploit path if the builder implements the text verbatim): RLS is off
  on `account_members`, so any signed-in viewer (the competitor who self-served
  is one) POSTs `account_members {account_id: <agency>, user_id: <self>, role:
  'owner'}` through PostgREST. The next `attach_brand` or `add_member` by the
  admin runs `sync_account_access(<agency>)`, which writes `user_clients` rows
  for that viewer on every agency brand, and INVARIANT M then grants all of it.
  Separately, `sync_account_access` stays callable by `anon` through
  `/rpc/sync_account_access`. And a `SECURITY DEFINER`
  `sum_cost_eur_account(p_account_id)` would return any account's euro spend to
  anyone.
- Fix direction: write the DDL into the spec. `alter table ... enable row level
  security` on both tables. `revoke all on accounts, account_members from anon,
  authenticated; grant select on ... to authenticated`. `revoke execute on
  function sync_account_access, sync_primary_membership, sum_cost_eur_account
  from public, anon, authenticated; grant ... to service_role`. Keep
  `is_account_member` for `authenticated` only. Read-backs: `relrowsecurity`
  true, `relacl` and `proacl` printed and compared to an expected string. While
  here, revoke INSERT, UPDATE, DELETE and TRUNCATE on `user_clients` from
  `anon` and `authenticated`, since it becomes THE authorization table (I6).

### MEDIUM

**Md1. Release 1 ships the SUM-by-accident the ruling warned against, and the
override columns are inert.**

- Spec: 7.3; 4.3 (`prompt_limit_override`, `budget_override_eur`); 7.1.
- Evidence: the ruling (lines 680-682): "the day D1 ships without touching
  either, the product delivers SUM by accident"; (726-731): "Enforcing the sum
  is part of D1's build". The 7.3 arithmetic is right: per-brand enforcement
  never exceeds the ruled SUM. But the ruling chose account-level SUM as the
  product a Growth plus Essentials customer buys (59.70 available to either
  brand), and P1 sells something different. The spec says "Not re-argued here"
  and then defers the ruling's binding condition, which is a product decision.
  Also, step 1 creates override columns that nothing reads until P2. An admin
  who sets `budget_override_eur` below the sum in P1 gets no enforcement, so
  "never looser than the ruling" fails for overrides.
- Fix direction: add Q11 for Constantin ("ship P1 with per-brand limits for
  hand-sold agencies, yes or no"), `/escalate`. Create the override columns in
  P2, or state in 4.3 that they are inert until P2 and that `agency-admin.js`
  refuses to write them.

**Md2. Whether step 1 backfills `account_members` is not said, and the answer
breaks something either way.**

- Spec: 13 step 1 (accounts only), 4.3 unique index (Q3), 9.1 `create_account`.
- Failure: if step 1 makes each brand's login an owner of its direct account,
  `create_account` for an agency lead fails on
  `account_members_one_account_per_user`, because the lead is already an owner of
  their backfilled account. If it does not, no direct customer is ever an
  account member, so P2's banner and P3's `create-site.js` (account owner only)
  are unreachable for every existing customer.
- Fix direction: state it. Recommended: backfill owners for direct accounts, and
  make `create_account` move the owner out of their direct account (deleting the
  empty direct account when `move_default_brand` is true) inside one function.

**Md3. The `attach_brand` guard guards nothing.**

- Spec: 9.1 ("an existing brand whose current account holds only that brand");
  4.3 (research brands "are never attached to a customer account").
- Evidence: after step 1 every one of the 72 brands sits alone in its own
  account, so the condition is always true. Nothing in the action enforces the
  research rule. 37 research brands hold internal prospect research.
- Failure: one mistyped `client_id` attaches another customer's brand, or a
  research brand, to the agency, and the fan-out gives every staff member full
  read and write on it at once.
- Fix direction: refuse `category in ('research','archived')`. Refuse a brand
  that has any `user_profiles` or `user_clients` row outside the target account
  unless `confirm_existing_users: [ids]` names them. Return the brand name for
  the admin UI to echo before confirming.

**Md4. Removing a staff member leaves their API keys and OAuth grants working.**

- Spec: 12 ("An agency member mints one key per brand. No change."); 9.1
  `remove_member`.
- Evidence: `mcp-server.js:1109-1124` accepts a key when it is unrevoked and its
  `client_id` matches. `created_by` is read only for the research-client admin
  check (`:1138-1143`), never for membership. `client_api_keys` has `created_by`
  (column read today).
- Failure: a staff member mints `bgmcp_` keys on five agency brands and is then
  removed. The keys keep reading every brand, and calling the write tool where
  scope allows, until someone notices them in a list.
- Fix direction: `remove_member` revokes (`revoked_at`) every key with
  `created_by = user` on the account's brands, in the same function as the row
  deletes, and revokes their `oauth_grants` on those brands. Criterion V14.

**Md5. `delete-client.js` is missing from the ledger, and it destroys logins by
default brand.**

- Spec: 1.1 ledger, 1.5.
- Evidence: `delete-client.js:66-86` selects `user_profiles where client_id =
  target` and calls `auth.admin.deleteUser` on each.
- Failure: an agency's client churns and the admin deletes brand X. Every login
  whose default brand is X is deleted, including an agency owner or staff member
  provisioned onto X (see M1), so they lose every brand. If that was the last
  owner, `account_members` cascades away and the "at least one owner" rule is
  broken with no 422. The emptied direct account from step 1 is left orphaned.
- Fix direction: add the row. Refuse with 409 when any such profile holds an
  `account_members` row or another `user_clients` row, the same shape as the
  existing admin refusal at `:69-71`.

**Md6. Plan notices and the internal grant label reach the agency's end
customer.**

- Spec: 8 (hand billing via `set-client-plan.js`), INVARIANT A.
- Evidence: `set-client-plan.js:205-218` emails every login whose
  `user_profiles.client_id` is the brand, and `:200-203` writes a
  `client_notifications` row that Group B will show to every brand member.
  `clientContext.tsx:83` selects `plan_grant_note` ("internal label for a
  grant", `:26`), and `clients_select` returns it to any brand member.
- Failure: the admin sets an agency brand's plan by hand. The agency's client,
  a guest on that brand, gets "Your BrandGEO plan is now Growth" or
  "complimentary through" mail about a contract they are not party to, and can
  read the admin's billing note. The agency staff, whose default brand is
  elsewhere, get nothing.
- Fix direction: for brands in an agency account, route the email to account
  owners and skip the client notification, or default `notify` to false. Rule
  that no billing detail goes into `plan_grant_note` on agency brands, or stop
  selecting it for non-admins.

**Md7. P2 sends pooled euro spend to a brand guest.**

- Spec: 7.4 (renames `detail` fields only), INVARIANT A.
- Evidence: `enqueue-collection.js:93-94` and `collect-prompt.js:249-250` return
  `limitCheck.message` to the caller, and `_auth.js:328` builds it as "EUR x of
  EUR y".
- Failure: under P2 the numbers are account totals, so a guest whose collection
  is blocked reads the agency's pooled consumption in the error. That is the
  account-level number INVARIANT A says a guest must never see, and euro figures
  are admin-only everywhere else.
- Fix direction: the account-level block message carries no numbers. Map it to a
  reason code the frontend phrases.

**Md8. The revoke path is not atomic as specified.**

- Spec: 4.4 ("Both writes run in ONE SQL function" refers to the grant path);
  9.1 `remove_member` (two deletes); 5.6 ("the whole grant or revoke rolls
  back").
- Failure: `agency-admin.js` deletes the `account_members` row and the `account`
  rows as two supabase-js calls, which are not a transaction. A crash or timeout
  between them leaves `user_clients` rows with no membership behind them, a
  grant nobody can see in the account UI.
- Fix direction: make `sync_account_access` the single reconciler (insert
  missing rows, delete `grant_source = 'account'` rows on the account's brands
  for users who are not members), and run `remove_member` as delete-then-sync
  inside one SQL function. Extend the 4.4 check with the inverse query (an
  `account` row with no `account_members` row behind it returns 0).

### LOW

- **L1. `oauth_grants_select` substitution is mechanical in text, not in
  meaning (5.4).** `oauth_grants` has `user_id`; it is a per-user credential.
  `has_client_access(client_id)` shows every brand member the other users'
  connected tools, redirect hosts and last use. Prefer `is_admin() or (user_id =
  auth.uid() and has_client_access(client_id))`. The same question applies,
  more mildly, to `client_api_keys_select` (any member sees and can revoke any
  key on the brand, consistent with Q4).
- **L2. Ledger rows 11 to 20 are admin-only.** Every `social-*.js` calls
  `requireAuth(event, { adminOnly: true })` (`social-accounts.js:15`,
  `social-generate.js:165`, and the rest), so the inline equality is a dead
  branch for viewers. Editing ten files to call `assertClientAccess` changes
  nothing. Mark them "admin path, unchanged" and shrink the P1 diff. Do not
  imply agency members get the social features.
- **L3. Count error.** 4.3 says "the 36 research clients". Production has 37
  (1.4 of the same spec says 37).
- **L4. V2 cannot pass as written.** V2 (P4) says `profile.client_id` appears in
  no authorization predicate. Section 12 keeps `oauth-authorize.js`,
  `oauth-token.js` and `mcp-server.js:1175`, and 9.3 keeps `invite-redeem.js`,
  on `profile.client_id` past P4. Scope V2 to brand access and exclude rows 24
  to 28.
- **L5. `grant_source = 'backfill'` means two things.** The one-time backfill
  and the permanent trigger both write it, so the step 2 rollback (`delete ...
  where grant_source='backfill'`) also deletes every later signup's row. That is
  harmless before step 8 and locks every customer out after it, because the
  first disjunct is gone. Use a distinct value (`primary`) for the trigger, and
  state that step 2's rollback is invalid once step 8 has shipped.
- **L6. Step 4's rollback is not neutral after step 5.** Reverting the P1 commit
  while agency rows exist recreates the "broken product" state the order trap
  describes. The step 4 rollback must also remove step 5's `account` rows.
- **L7. The never-delete trigger leaves a stale owner row if `client_id` ever
  moves.** No code updates `user_profiles.client_id` today (grep: only
  inserts, and deletes in `delete-client.js:90` and
  `_provision_client.js:426`), so this is latent. Any future admin "move login"
  tool must delete the old row explicitly.
- **L8. Under P2 pooling a guest can spend the agency's pool.** A guest is a full
  member (Q4) and Q2 adds no floor, so prompts added on the guest's one brand
  draw on the whole account's cap and budget. Add this to Q2's text so
  Constantin rules with it in view.
- **L9. The step order differs from D1 without saying so.** D1 17: permissive
  `_auth.js` (step 4) before RLS Group B (step 7), and account limits (step 6)
  before the write path (step 9). This spec puts RLS first (step 3) and limits
  after a live agency (P2). Safe as specified, because no rows exist before step
  5, but section 0 says D1's boundary is "adopted unchanged" and should list the
  reorder.
- **L10. PRE-EXISTING: `ticket_client_id(bigint)` is `SECURITY DEFINER` with no
  `search_path` (proconfig null) and is executable by PUBLIC and `anon`.** Group
  B will feed it into `has_client_access`. Set `search_path ''` in the same
  migration. Not blocking on its own.

### INFO

- **I1.** Citations verified accurate (section 1 row 1). D1's 22 places became
  28; the spec's re-count is right.
- **I2.** The 5.5 proof holds at deploy time. With one backfilled row per user
  on their own `client_id`, `has_client_access(x)` reduces to `x =
  get_my_client_id()` (function body read today), and the Group B substitution
  is then identity. It is a snapshot proof. Its durability depends on M1, M2,
  Md3 and L7.
- **I3.** `accounts_select` writes `m.account_id = id` with `id` unqualified. It
  resolves to `accounts.id` only because `account_members` has no `id` column.
  Qualify it (`accounts.id`) before someone adds one.
- **I4.** `has_client_access` is executable by `authenticated` and
  `service_role` only, and all 36 Group B policies are `{authenticated}`, so the
  substitution introduces no permission error for `anon`.
- **I5.** Switcher guardrails hold (section 1 row 8). `canSwitchClient = !isRealAdmin &&
  clients.length > 1` gives a view-as-user admin no customer switcher, and the
  `:1201` identity block condition stays consistent.
- **I6.** PRE-EXISTING: `user_clients` grants full DML to `anon` and
  `authenticated` and relies on RLS alone. It becomes the authorization table in
  P1; the revoke is folded into M4's fix.
- **I7.** 7.5 and the V-criteria fixture numbers re-computed from `_cost.js`
  (essentials 14.85, growth 44.85, growth_pro 67.35, managed 225) and
  `plan_prompt_caps`: 126 and 157.05, 290 and 299.25, 53 and 59.70 all match.

---

## 3. Data and claim integrity

Every production number in spec sections 1.3 and 1.4 was re-read today and
matches, except the research count in 4.3 (L3). The policy counts in 1.1 and
5.4 match `pg_policies` exactly. One claim is false: section 8's "not reached"
(M3). One claim is unsupported: 4.5's "zero edits to those files", which holds
for membership but not for the `account_id` column (B1).

## 4. Regression surface (by grep, for the build review)

`provision-account.js`, `_provision_client.js`, `stripe-webhook.js` (client
inserts, B1). `delete-client.js` (Md5). `set-client-plan.js`,
`expire-plan-grants.js` (notices, Md6). `mcp-server.js` key path, `oauth-*.js`
(Md4, M1). `enqueue-collection.js`, `collect-*.js`, `platform-activity.js` (P2
detail and message, Md7). `client-users.js`, `resend-invite.js` (admin lists
keyed by default brand: membership-only users will not appear; INFO for the
admin UI). `Account.tsx` upgrade control (M3). `clientContext.tsx`, `Layout.tsx`
(switcher). `resultsContext.tsx` and the collection context (V9).

## 5. Ledger re-measurement (grep, abridged)

```
_auth.js:116  collect-chatgpt.js:174  collect-claude.js:174  collect-prompt.js:188
enqueue-collection.js:69  generate-recommendations.js:94  seo-audit-page.js:104
seo-crawl.js:53  seo-draft.js:148  seo-opportunities.js:36  social-accounts.js:26
social-boost.js:42  social-brandkit.js:120  social-delete.js:45  social-generate.js:179
social-image.js:57  social-link.js:34  social-publish.js:108  social-queue.js:40
social-status.js:28  suggest-prompts.js:105  support-request.js:120
create-portal-session.js:37  invite-redeem.js:178-179  oauth-authorize.js:76-78
oauth-token.js:85  mcp-server.js:1175  resend-invite.js:353-354
requireAuth({clientId}): client-api-keys.js:101 client-locations.js:151
                         create-portal-session.js:30 get-subscription.js:31
```

Not in the ledger and should be: `delete-client.js:66-86` (Md5). Considered and
correctly out of scope: `stripe-webhook.js:474` (billing, section 8),
`tickets-admin.js` and `client-users.js` (admin-only).

## 6. What was not checked

- No build, `tsc`, tests or browser (instructed). Every UI claim is from source.
- Whether `Combobox`'s existing props can render a brand list with logos, which
  the spec assumes (6.2). `Combobox.tsx` was not read.
- The collection context's behaviour on a mid-run brand switch (V9). Left to the
  build review, as the spec intends.
- Whether Stripe Payment Links reuse one Customer per email across purchases,
  which decides how likely M3's two-brands-one-customer case is. The direct
  M3 failure (the wrong brand upgraded) does not depend on it.
- `client-api-keys.js` mint and revoke rules beyond the `requireAuth` line;
  `oauth-revoke.js`; `accept-terms.js` beyond its client-reference lines.
- `docs/AGENT-OS.md` was read for section 6 only.
- D1 was read in sections 6, 10 and 17 and its outline, not in full (2,053
  lines). Contradictions in the unread sections may exist.
- Supabase Auth settings, storage buckets (no storage policies exist, read
  today), and the TalentWeLove tables sharing the database (`brand_access`,
  `content_snapshot` exist with their own policies, untouched by this design).

## 7. Routing

- B1, M4, Md2, Md8, L1, L5, L6, L10: back to `bg-architect` (spec text and DDL),
  then `bg-backend` on Opus.
- M1, M2, Md3, Md4, Md5: `bg-architect`, membership lifecycle section.
- M3, Md6: `bg-architect` with a `bg-app` note for the Upgrade control. M3 also
  touches the custom offer builder.
- Md1 and Q11: `/escalate`, Constantin's ruling (product, not architecture).
- Md7: `bg-architect`, P2 section.
- L2, L3, L4, L7, L8, L9: spec edits, no ruling needed.

A re-review of the amended spec is required before any build starts.
