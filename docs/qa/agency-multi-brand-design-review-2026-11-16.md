BLOCK

# Design review: agency multi-brand (`docs/arch/agency-multi-brand.md`)

Reviewer: `bg-verify` (Opus), read-only. Date 2026-11-16.
Subject: `docs/arch/agency-multi-brand.md` as written 2026-11-16 (untracked, not
built, not committed), with `docs/arch/multi-site-tenancy.md` (D1) as its base.
Nothing was edited except this file. No migration, no git command, no build.
Every SQL statement run was a read-only SELECT against production project
`duiyifepitvugyulobqm`.

```
INTENT: review agency-multi-brand design  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

## Verdict and counts

**BLOCK.** One BLOCKER: the P1 migration as ordered breaks every path that
creates a `clients` row, including the Stripe webhook, from the moment it is
applied, while the spec states release 1 does not touch billing. Four MAJOR
findings sit on member revocation, the fan-out function, account deletion side
effects, and an INVARIANT A leak in P2.

| Severity | Count |
|---|---|
| BLOCKER | 1 |
| MAJOR | 4 |
| MEDIUM | 4 |
| LOW | 8 |
| INFO | 6 |

The core of the design is sound and most measured claims reproduce exactly
(section 6). The RLS substitution in section 5.4 is behaviour-neutral at the
moment it is applied. The defects are in what happens after: provisioning,
revocation, deletion and the P2 response bodies.

---

## 1. Calibration

1. **Diff under review.** No code diff exists; the subject is one untracked
   spec file. `git diff --stat` was not run (the brief forbids git). Scope
   check: not applicable, no file outside `docs/qa/` was written by this review.
2. **Secret scan** of the spec with `rg -i "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role"`:
   15 matching lines, all design vocabulary (role names, token kinds). A second
   scan for literal key shapes (`sk-`, `pk_live`, a JWT prefix): 0. No value
   printed.
3. **Acceptance criteria.** The spec's own design-review scope (section 15,
   "attack sections 4.4, 5.1, 5.2, 5.5, 8 and 13") plus the six points of the
   brief. All are checkable by reading code and the live schema; table in
   section 2.
4. **tsc and build baseline.** Not run: a design review changes no compiled
   file. Not a criterion here.
5. **Most sensitive auth check touched.** `requireAuth` client gate,
   `brandgeo-dashboard/netlify/functions/_auth.js:115-119`, and the RLS
   function `public.has_client_access(integer)` (read live, section 6).
6. **Write access.** This review writes exactly
   `docs/qa/agency-multi-brand-design-review-2026-11-16.md` and nothing else.

CALIBRATED

---

## 2. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| C1 | No path widens an existing single-brand viewer at release (5.5) | PASS at apply time, FAIL over time | Live: `user_clients` 0 rows, 36 profiles, 0 null `client_id`; `has_client_access` = `cid = get_my_client_id() or exists(user_clients ...)`. After a one-row-per-profile backfill the predicate equals today's. Erodes afterwards through F-M1 and F-Md2 (rows never removed). |
| C2 | INVARIANT A: a brand guest never reads account data, other brands, or agency spend | FAIL (P2) | P1 tables and policies hold (section 4.3, 5.2). P2 returns account spend in the 429 body to any brand member: `enqueue-collection.js:93-94`, `collect-prompt.js:249-250`, `collect-claude.js:231-232`, `collect-chatgpt.js:236-237` return `limitCheck.message`, built at `_auth.js:328` with euro spend and budget. F-M4. |
| C3 | Group B is exactly 36 policies and each substitutes cleanly | PASS | Live `pg_policies` (section 6): 36 policies on `get_my_client_id()`/`my_client_id()`, list matches spec 1.1; `tickets_insert`, `tickets_select`, `ticket_comments_*` carry extra conjunctions, as the spec warns. `has_client_access(NULL)` is not true, so `tickets_insert`'s null guard survives. |
| C4 | Group A is exactly 15 policies already on `has_client_access` | PASS | Live: ai_results 2, client_locations 1, clients 1, competitors 4, prompts 4, recommendation_runs 1, recommendations 2. |
| C5 | Server checks number as stated and `assertClientAccess` covers every one | PARTIAL | Ledger rows 1 to 28 reproduce at the cited lines. The spec's own summary says 23 (0.2), the ledger 28, P1 changes 22. Ten of the 22 (`social-*.js`, rows 11 to 20) sit behind `requireAuth({ adminOnly: true })`, so their inline check is dead code. The MCP key path (`mcp-server.js:1107-1145`) is not membership checked at all. F-L1, F-M1. |
| C6 | Fan-out (4.4) leaves no stale rows, no races, revocation is total | FAIL | F-M1, F-M2. |
| C7 | Migration-first is safe for every phase (13) | FAIL | Step 1 sets `clients.account_id` NOT NULL with no default and no trigger; three insert sites do not set it. F-B1. |
| C8 | Release 1 leaves `stripe-webhook.js`, `_plans.js`, `PLAN_ORDER`, `_cost.js` budgets untouched | FAIL in effect | No edit to those files is planned, but F-B1 makes `stripe-webhook.js:1087` fail its insert; F-Md1 shows the unchanged webhook writes a Stripe id onto an agency brand. |
| C9 | 0.4: per-brand enforcement never exceeds the account SUM | PASS WITH CAVEAT | Holds as an inequality over the configured budgets; overstated in absolute terms because the budget is checked at enqueue time only. F-L2. |
| C10 | Guardrails: no `motion` in what `Layout` imports, no props change | PASS (design) | `grep "from 'motion"` over Layout's direct imports and `src/components/ui`, `src/lib`: only `lib/motion.ts`, which Layout does not import. `Combobox` props (`ui/Combobox.tsx:33-44`) are generic `{value,label}` options, so a brand list fits without a props change. |
| C11 | Switching hygiene | PASS (design), build check owed | Results key `${userId}:${activeClientId}` (`resultsContext.tsx:90`); location filter key `brandgeo_location_filter_v2_${userId}_${clientId}` (`lib/locations.ts:78`); sort key per client (`promptPerformance.ts:89`); collection progress carries `clientId` (`collectionContext.tsx:121`, `:259`); `setActiveClientId` refuses unknown ids (`clientContext.tsx:282-291`). V9 still needs a browser. |
| C12 | Measured claims are accurate | PASS with three slips | Section 6. |

---

## 3. Findings

### BLOCKER

**F-B1. Step 1 makes `clients.account_id` NOT NULL with nothing to fill it,
so every new client insert fails, including paid Stripe provisioning.**
- Section: 4.3, 13 step 1, 3 ("Touches billing? no").
- Evidence: the spec creates one account per EXISTING client, then sets
  `account_id` NOT NULL. No column default, no `BEFORE INSERT` trigger on
  `clients` is specified (4.5 adds a trigger on `user_profiles` only), and the
  live `clients` table has no trigger (read 2026-11-16, `pg_trigger` empty for
  `clients`). Three code paths insert `clients` rows without that column:
  `_provision_client.js:331` (Onboard wizard, lead import), 
  `provision-account.js:181` (self-serve signup), `stripe-webhook.js:1087`
  (`createClientRow`, paid checkout for a new customer).
- Exploit path: after step 1 is applied and read back, the next visitor who
  signs up, or the next customer who pays through a payment link with a new
  email, hits a NOT NULL violation. In the webhook that throws inside
  provisioning: the payment is captured and no client exists. The "migration
  first, read back, then push" rule makes this window last until step 4, and
  step 4 does not edit any of the three files either, so it never closes.
- Fix: in the same step 1, add a `BEFORE INSERT` trigger on `clients` that
  creates a `kind = 'direct'` account named after the client when
  `account_id` is null (service-role and owner contexts only), or keep the
  column nullable until every insert site sets it. Add a read-back that
  inserts and rolls back a client row through each path's exact column list.
  Re-state section 3 honestly: P1 changes what the webhook's insert must
  satisfy, even if the file is not edited.

### MAJOR

**F-M1. Removing an agency member does not revoke their access everywhere.**
- Section: 4.4 (remove rule), 9.1 `remove_member`, 12 (MCP keys and OAuth).
- Evidence, three residual channels after `remove_member`:
  1. The default-brand row is kept by design ("never the row on their default
     brand"). An agency staffer's default brand is, in practice, one of the
     agency's client brands: no path creates a login without creating a brand
     (F-Md3), and `invite-redeem.js:178-179` binds a new login to the link's
     brand. The removed staffer keeps full member (or `owner`, F-Md2) access to
     that client's brand.
  2. OAuth: `oauth-token.js:82-86` (`userStillMapped`) and
     `mcp-server.js:1175` keep a grant alive while `profile.client_id` equals
     `grant.client_id`. Removal does not touch `user_profiles`, so the
     staffer's claude.ai connection to that brand keeps working.
  3. API keys: `client-api-keys.js:101` lets any member mint a key for a
     brand (widened by 5.3), and `mcp-server.js:1107-1145` (`resolveKey`)
     checks only `key_hash`, `revoked_at`, the client id in the key and the
     client row. `created_by` is read but only for the research-client rule
     (`:1138-1143`). A key the staffer minted on any agency brand survives
     their removal. Keys carry a `scope` column (live), so a write-scoped key
     keeps writing (`mark_fix_done`).
- Exploit path: agency removes a departing employee; the employee keeps reading
  (and, with a write key, changing fix state on) the agency's client brands
  through MCP indefinitely, and keeps the dashboard on their default brand.
- Fix: `remove_member` must (a) revoke every `client_api_keys` row with
  `created_by = user` on the account's brands, or `resolveKey` must require the
  creator to still hold a `user_clients` row (the OAuth path's
  `userStillMapped` pattern, on INVARIANT M); (b) revoke `oauth_grants` of
  that user on the account's brands; (c) give agency staff a default brand
  that is not a client brand (an agency home brand), or move the default
  brand on removal. Add V-criteria for each channel.

**F-M2. The fan-out is not atomic as specified, races, and its check query
cannot see stale rows.**
- Section: 4.4, 9.1, 13 step 5.
- Evidence:
  - 4.4 says both grant writes run in one SQL function, but the 9.1 action
    table has `agency-admin.js` insert `account_members` (or set
    `clients.account_id`) and THEN call `sync_account_access`: two separate
    PostgREST calls, two transactions. A failed second call leaves a member
    with no rows, and nothing repairs it.
  - `remove_member` is not inside any function; it is a delete issued by the
    Netlify function.
  - Race: `attach_brand` (sync reads the member list, inserts U's row on the
    new brand) concurrent with `remove_member` for U (deletes U's
    `account`-sourced rows on the brands it can see). Under READ COMMITTED the
    delete does not see the uncommitted new row, so U keeps a row on the new
    brand while holding no `account_members` row.
  - The 4.4 check query detects only MISSING rows (a member lacking a row). It
    returns 0 for the stale state above, so V10 passes on a leaking database.
  - "detach" is named as a rollback in step 5 but is not an action; detaching
    by hand leaves every `account`-sourced row on the detached brand.
  - ON CONFLICT behaviour of the fan-out insert is unstated: DO NOTHING keeps
    a guest's `direct` row (owner never upgraded); DO UPDATE to `account`
    makes a later `remove_member` delete a grant that was given directly.
- Fix: one SQL function per action (`grant_member`, `revoke_member`,
  `attach_brand`, `detach_brand`), each taking `pg_advisory_xact_lock` on the
  account id (the `add_client_locations` pattern), each ending in a full
  reconcile: insert missing rows, delete `grant_source = 'account'` rows for
  non-members or for brands no longer in the account. State ON CONFLICT: never
  overwrite a `direct` or `backfill` row. Add the reverse check query and make
  both part of V10:
  `select uc.* from user_clients uc join clients c on c.id = uc.client_id where uc.grant_source = 'account' and not exists (select 1 from account_members am where am.user_id = uc.user_id and am.account_id = c.account_id)` EXPECT 0.

**F-M3. Deleting one agency brand deletes every login whose default brand it
is, which can wipe out agency staff.**
- Section: not addressed; 4.1 keeps `user_profiles.client_id` as the default
  brand; 14 does not list `delete-client.js`.
- Evidence: `delete-client.js:66-85` selects `user_profiles` where
  `client_id = target` and calls `auth.admin.deleteUser` for each; only admin
  profiles are protected (`:69-71`). `user_clients.user_id` cascades from
  `auth.users` (live FK), so every brand row of that user goes too.
- Exploit path: an agency drops one client; the admin deletes that brand; the
  staffer (or the agency owner) whose default brand it was loses their login
  and access to every other brand of the account. Not reversible.
- Fix: `delete-client.js` must, for each attached profile, delete the auth
  user only when the user holds no other `user_clients` row and no
  `account_members` row; otherwise repoint `user_profiles.client_id` to
  another held brand. Add it to the P1 change list and to section 14's
  regression notes; add a V-criterion.

**F-M4. In P2, a brand guest receives account-level spend and allowance in
error bodies (INVARIANT A).**
- Section: 5.2, 7.4.
- Evidence: every collector and the enqueue function return the limit message
  to the caller: `enqueue-collection.js:93-94`, `collect-prompt.js:249-250`,
  `collect-claude.js:231-232`, `collect-chatgpt.js:236-237`, each
  `JSON.stringify({ error: limitCheck.message, reason })`. The message is
  `Monthly API budget exceeded for this plan (EUR x of EUR y)` (`_auth.js:328`).
  P2 makes x and y account totals. Likewise the `prompt_cap_reached` exception
  text (live `enforce_prompt_cap()`) prints the cap, which P2 makes the account
  SUM, to any member inserting a prompt.
- Exploit path: a guest with one brand row on an agency account presses
  Collect after the pool is spent and reads the agency's whole-account euro
  spend and budget in the 429 body.
- Fix: in P2, build the caller-facing message from `accountAccess`: members of
  the account get the totals (euro still admin-only per the 2026-11-15
  ruling), everyone else gets a fixed sentence with no number. Keep numbers in
  the log and the admin event only. Same for the prompt cap exception text.
  Add a V-criterion under P2 and cover the `account_over_allowance` banner the
  same way (it must render only for account members).

### MEDIUM

**F-Md1. The billing guard is a read-back, not a prevention.**
- Section: 8.
- Evidence: `stripe-webhook.js:458-475` resolves an unbound checkout to the
  payer's `profile.client_id` and later writes the customer id. An agency
  staffer or brand guest who pays any public payment link with their login
  email upgrades their default brand (an agency client brand) and puts a
  `stripe_customer_id` on it. The spec's rule "no code path writes a
  `stripe_customer_id` onto a brand whose account has kind agency" is false for
  the unchanged webhook; V11 only detects it afterwards.
- Fix: in P1, hide every self-serve upgrade and billing CTA in the dashboard
  for brands whose account is `kind = 'agency'` (frontend only, webhook
  untouched), and run the V11 query in the watchdog, not once.

**F-Md2. `sync_primary_membership` grants `owner`, never deletes, and fires on
an undefined set of events.**
- Section: 4.5, 9.2.
- Evidence: the trigger inserts `role 'owner'` for every profile. A guest
  provisioned on an agency brand becomes that brand's `owner`, and P3's
  `client-members.js` lets a brand owner invite and remove members, including
  the agency's `account`-sourced rows on that brand. "When client_id is set,
  insert; never delete" also keeps the old row if a profile is ever re-pointed
  (by SQL Editor or the F-M3 fix), which is a widening the 5.5 queries catch
  only on the day they are run.
- Fix: trigger on INSERT only, role `member` when the brand's account is
  `kind = 'agency'`; a brand owner may not delete `account`-sourced rows; any
  re-point of `user_profiles.client_id` goes through a function that moves the
  backfill row. Make the 5.5 queries a standing test or watchdog check.

**F-Md3. There is no way to create an agency staff login without creating a
stray brand.**
- Section: 9.1, Q5.
- Evidence: `create_account` and `add_member` take an existing `user_id`.
  Every login-creating path also creates a client: `_provision_client.js`
  (refuses an existing email, `:370-373`), `provision-account.js`,
  `stripe-webhook.js`. `resend-invite.js` only resends. Q5 covers a brand
  without a login, not a login without a brand.
- Fix: specify a `create_login` action (invite by email, profile on a chosen
  agency home brand, `account_members` row in the same function), or rule
  that staff are created by the Onboard wizard on a placeholder brand and say
  what happens to it. This also settles F-M1's default-brand problem.

**F-Md4. Rollback of step 4 after step 5 recreates the order trap.**
- Section: 13.
- Evidence: step 4's rollback says steps 1 to 3 are "behaviour-neutral without
  rows". After step 5 there are rows; reverting the P1 code leaves Group A and
  Group B granting reads while every function answers 403 again, the broken
  state the spec itself describes for the hand-insert stopgap.
- Fix: the step 4 rollback after step 5 must first delete `account`-sourced
  rows (or detach), then revert.

### LOW

- **F-L1. Ledger count is inconsistent and overstates P1.** Section 0.2 says 23
  places; section 1.1 says 28 in 28 files (reproduced line by line); P1
  changes 22 rows. Rows 11 to 20 (`social-*.js`) call
  `requireAuth(event, { adminOnly: true })` (e.g. `social-accounts.js:15`,
  `social-status.js:17`), so their inline check never runs for a viewer and
  converting them changes nothing. Fix: correct 0.2; mark rows 11 to 20 as
  "admin only today, converted for consistency, no behaviour change" so V3 is
  not tested against them.
- **F-L2. Section 0.4 overstates the bound.** The budget is checked at enqueue
  time only (`enqueue-collection.js:92`, collectors, `schedule-collections.js`;
  `collection-worker-background.js` has no budget check), so each brand can
  already end a month one run past its budget. The SUM inequality is "no
  worse than today per brand", not "can never exceed". Fix: reword.
- **F-L3. Research count.** Section 4.3 says 36 research clients; live
  `clients` by category is active 34, free 1, research 37 (section 1.4 has 37).
- **F-L4. Policy and grant precision.** `accounts_select` uses an unqualified
  `id` inside a subquery on `account_members`; it resolves to `accounts.id`
  only because `account_members` has no `id` column. Qualify it. The P2
  `sum_cost_eur_account` RPC has no stated grant; today `sum_cost_eur` is not
  executable by `anon` or `authenticated` (live), and the new one must match,
  or any member can read any account's spend.
- **F-L5. Commercial columns on an agency brand are readable by its guest.**
  `clients_select` is row-level; the non-admin client load selects
  `plan_grant_note`, `plan_source`, `paid_until` (`CLIENT_SELECT`,
  `clientContext.tsx:83`, used at `:215`).
  Section 8 has the admin set `plan_grant_note` on agency brands, which may
  describe the agency's invoice. Fix: rule that notes on agency brands carry
  nothing commercial, or move those columns behind a column grant.
- **F-L6. The `client_events_type_check` rewrite must carry all 11 live values**
  (read 2026-11-16, last `location_change`) verbatim plus the new one; state it
  in step 4's migration notes.
- **F-L7. PRE-EXISTING.** `public.ticket_client_id(bigint)` is SECURITY
  DEFINER with no `search_path` set (live `proconfig` null) and executable by
  `anon`. Group B wraps it in `has_client_access`; set `search_path ''` in the
  same migration. Not a blocker.
- **F-L8. Portfolio budget percentage contradicts "no new server code".**
  `client_results_latest` returns no cost column and `sum_cost_eur` is not
  callable from the browser; the percentage needs either a paged
  `ai_results.cost_eur` read or a server function. State which.

### INFO

- **F-I1.** `user_clients` and `user_profiles` carry the Supabase default table
  grants to `anon` and `authenticated` (INSERT, UPDATE, DELETE, TRUNCATE, read
  live). RLS denies writes and PostgREST cannot issue TRUNCATE, so there is no
  exploit path today. As these become the authorization tables, revoke write
  grants on `user_clients`, `accounts`, `account_members` in the P1 migration.
- **F-I2.** A guest sees `clients.account_id` (an integer) on their own brand
  row. Harmless under INVARIANT A as written; note it before white-label.
- **F-I3.** `clientContext.tsx:45` says `isRealAdmin` may be read only by the
  toggle and the banner. Section 6.1 reads it inside the provider to derive
  `canSwitchClient`, which is correct (V8), but the comment must be updated in
  the same commit. `clientContext.tsx:226` mentions a "Compare" feature that
  does not exist in `src/pages`.
- **F-I4.** `platform-activity.js:209-218` and `resend-invite.js:249-287` map a
  login to its default brand only; agency staff will count under one brand.
- **F-I5.** `sortStorageKey` (`promptPerformance.ts:89`) is per client, not per
  user, so two users on one browser share a sort choice. Harmless.
- **F-I6.** `has_client_access` takes a row argument, so it is evaluated per
  row in Group B policies. Group B tables are small; no action.

---

## 4. Accessibility

Design stage only; nothing is rendered. Not measured: contrast, focus, hit
targets. Requirements for the build review: the non-admin switcher must expose
listbox semantics (the existing `Combobox` is WAI-ARIA 1.2 and is the right
base); every brand row keyboard reachable; focus returns to the trigger after a
switch; 44 px rows at phone width as the 2026-11-11 selector does; the "Your
dashboard" identity block and the new switcher must not both be in the tab
order. New text-on-surface pairs to compute at build: switcher label, brand
row, filter field placeholder, both themes.

## 5. Regression surface (grep, not intuition)

- `profile.client_id` readers in `netlify/functions`: the 28 ledger files plus
  `stripe-webhook.js:474`, `platform-activity.js`, `resend-invite.js`
  (list path), `delete-client.js`, `client-users.js` (admin only).
- `clients` insert sites affected by step 1: `_provision_client.js:331`,
  `provision-account.js:181`, `stripe-webhook.js:1087`.
- Frontend readers of the membership tables: only `lib/clientContext.tsx`
  (`:164`, `:211`). Consumers of the `clients` list: `Layout.tsx:482`,
  `AdminBell.tsx:42`, `Revenue.tsx:894`, `Tickets.tsx:466` (the last three
  admin pages).
- RLS dependents of `has_client_access`: 15 policies today, 51 after step 3,
  and `client_results_latest` (SECURITY INVOKER, executable by
  `authenticated`).
- Manual look needed at build: `delete-client.js`, `mcp-server.js` key path,
  `oauth-token.js`, `client-api-keys.js`, Account page billing CTAs.

## 6. Data and claim integrity

Read-only SQL, 2026-11-16, project `duiyifepitvugyulobqm`:

| Claim (spec section) | Result |
|---|---|
| `has_client_access` body, STABLE SECURITY DEFINER, `search_path ''` (1.1) | confirmed |
| `get_my_client_id` body (1.1) | confirmed |
| 15 Group A policies, list (1.1) | confirmed |
| 36 Group B policies, list incl. the five new (1.1) | confirmed |
| `user_clients` one policy `user_clients_own_read`, no write policy (1.1) | confirmed |
| `user_clients` 0 rows (1.4) | confirmed |
| 72 clients, 34 active, 1 free, 37 research (1.4) | confirmed; 4.3 says 36 research (F-L3) |
| 36 profiles, 1 admin, 0 null `client_id` (1.4) | confirmed |
| `accounts` absent (1.4) | confirmed (`account_members` also absent) |
| 0 clients with Stripe customer or subscription id (1.4) | confirmed |
| 142 public policies (1.4) | confirmed |
| `site_allowance` values (1.3) | confirmed: 1, 1, 2, 2, 3, 10, 10, 25 |
| `enforce_prompt_cap` behaviour (1.3) | confirmed |
| `PLAN_ORDER` at `planConfig.ts:399`; budget map `_cost.js:532` (1.3) | confirmed |
| Ledger rows 1 to 28 at the cited lines (1.1) | confirmed; summary count 23 is wrong (F-L1) |
| `Layout.tsx:1061` admin-only gate, `:1201` identity block, `Combobox` import `:22` (1.2, 6.2) | confirmed |
| `resultsContext.tsx:90` cache key (6.3) | confirmed |
| No storage-schema policy, view or other function references the client predicates | confirmed (query returned none) |

The spec contains no user-facing copy and no customer number, so no copy claim
needed tracing. Strings are marked `copy: pending bg-copy`.

## 7. What was not checked

- `docs/arch/multi-site-tenancy.md` (D1) was not read in full; sections the
  spec adopts "verbatim" (D1 4.2, 5, 6.5 to 6.8, 8.5, 18.4) were judged only as
  restated in this spec.
- No browser, no build, no tsc, no node tests: nothing is built.
- No real viewer or guest token was used against any endpoint; the exploit
  paths above are traced in code and schema, not executed.
- `client-locations.js`, `invite-redeem.js` and `resend-invite.js` were read
  only at the cited gates, not end to end.
- Concurrency in F-M2 is reasoned from READ COMMITTED semantics, not reproduced.
- Supabase Auth settings, Stripe objects, Netlify environment: not looked at.
- The Group B rewrite's query plans and performance were not measured.

## 8. Routing

- F-B1, F-M2, F-Md2, F-Md4, F-L4, F-L6, F-L7, F-I1: back to `bg-architect`
  (spec amendment), then `bg-backend` on Opus.
- F-M1, F-M3: `bg-architect` (MCP key binding, OAuth, delete semantics), then
  `bg-backend` on Opus; touches auth.
- F-M4: `bg-architect` for P2 wording rules, `bg-copy` for the guest sentence.
- F-Md1: `bg-architect` plus `bg-app` (hide CTAs); billing adjacent, Opus review.
- F-Md3: `/escalate` to Constantin as a product decision (how agency staff
  logins are created), with the `create_login` default.
- F-L1, F-L2, F-L3, F-L5, F-L8: `bg-architect` text fixes.

A re-review of the amended spec is required before any build.
