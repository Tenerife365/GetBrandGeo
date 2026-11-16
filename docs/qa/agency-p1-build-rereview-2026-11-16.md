PASS WITH FINDINGS

# Agency multi-brand, release P1: scoped re-review of the fix round

Reviewer: bg-verify (Opus), read-only. Date 2026-11-16.
First review: `docs/qa/agency-p1-build-review-2026-11-16.md` (FAIL: F1 MAJOR,
F2 MEDIUM, F3 to F8 LOW, I1 to I7 INFO).
Spec: `docs/arch/agency-multi-brand.md` revision 4.
Scope: the fix-round files only. Unrelated edits by another session
(`src/index.css`, `AIVisibility.tsx`, `Dashboard.tsx`, `GlowScoreDial.tsx`,
`tokens_sync.test.js`, `unlock-audit-report.js`) were ignored.

**Verdict: PASS WITH FINDINGS.** F1 and F2, the two findings that held the
step 4 push, are closed in code and by test. F4, F5, F6 and F7 are closed, F3
is refuted, F8 stays a spec note. The fixes introduced three new LOW findings
(N1 to N3) and four INFO notes; none is a security exposure and none blocks
steps 1 to 4. The live halves of V12, V13 and V18 remain owed to a browser
and to production, as stated in section 6.

Nothing is live: production read 2026-11-16 holds no `accounts` table, no
`account_create_guest_profile` or `account_attach_brand` function, 0
`user_clients` rows and 0 clients with a Stripe customer or subscription id.

---

## 1. Calibration

1. `git diff --stat` on the seven modified fix-round files: 93 insertions, 39
   deletions (`create-portal-session.js` 16, `Layout.tsx` 56, `McpAccessSection.tsx`
   10, `SupportWidget.tsx` 6, `Account.tsx` 36, `Prompts.tsx` 6, `Tickets.tsx` 2).
   New or untracked: `agency-admin.js`, `BrandSwitcher.tsx`,
   `tests/agency_admin.test.js`, `tests/agency_billing_gate.test.js`, the two
   `db/supabase-agency-*` files under review. All are in the brief's list.
   Spec section 14 paths: `git status` on `stripe-webhook.js`, `_plans.js`,
   `_cost.js`, `invite-redeem.js`, `_provision_client.js`, `accept-terms.js`,
   `_terms_gate.js`, `planConfig.ts`, `BrandLogo.tsx`, `components/ui/` printed
   nothing. The `Layout.tsx` hunks sit at HEAD lines 1, 23, 133, 411, 479, 482,
   1201, 1212, 1224; none falls in the admin switcher range `Layout.tsx:1060-1194`.
   `McpAccessSection.tsx` is not on the section 14 list nor among the shared
   primitives of the brief, so its optional prop is allowed.
2. Secret scan over the new files and the added lines: hits are table and column
   names (`service_role`, `token`, `api_key`), placeholders
   (`sk_test_placeholder`, `cus_placeholder`, `cus_readbackscratch`,
   `sub_readbackscratch`) and an env var being deleted in a test. 0 live values.
   Addresses: `@example.com` fixtures and the company support address only. No
   real person, client or lead name.
3. Criteria: V12, V13, V18 and the touched V10, V19 are re-checked in section 3.
   Their browser and production halves are not checkable from this seat.
4. Baseline: the orchestrator reports `tsc` exit 0 and a production build on a
   clean HEAD export plus the P1 dashboard files (not re-run here, forbidden).
   Node tests re-run here: 74 of 74 files exit 0.
5. Most sensitive function touched: `create-portal-session.js` handler. Guard:
   `requireAuth(event, { clientId })` at `create-portal-session.js:36`, then the
   new kind gate at `:48-54` through `readBrandAccount` (`_auth.js:215-226`).
   On the admin side, every `agency-admin.js` action sits behind
   `requireAuth(event, { adminOnly: true })` at `agency-admin.js:746`.
6. Write access used: this file only. No reviewed file edited.

CALIBRATED.

---

## 2. Status of every earlier finding

| Finding | Status | Evidence |
|---|---|---|
| F1 MAJOR, Stripe-linked brand attachable, portal open to staff | **CLOSED** | (a) `account_attach_brand` reads `stripe_customer_id` or `stripe_subscription_id` under both account locks and raises `brand_has_stripe` (`db/supabase-agency-accounts-2026-11-16.sql:853-867`); read-back R3 E4 asserts both columns (`readback sql:587-596`). The preview returns `stripe_linked`, `blocked_by`, `blocked_message` and never the ids (`agency-admin.js:434-443`); HTTP 409 mapped (`:113`, `:129`). (b) Sidebar Billing row gated on `activeBrandAccountKind === 'direct'` (`Layout.tsx:1242`). (c) `create-portal-session.js:48-54` refuses a non-admin unless the kind reads exactly `direct`; an agency kind, no `account_id`, a missing account row and a read error all answer 409 `agency_billing` before Stripe (`tests/agency_billing_gate.test.js`, 7 of 7). Admin unchanged and reads no `accounts` row (test line 181-187) |
| F2 MEDIUM, failed ban not retryable | **CLOSED** | `ban_removed` action (`agency-admin.js:525-564`), named in the 500 body as `retry: { action: 'ban_removed', account_id, user_id }` (`:484-489`, `:505`). It bans only when the target is not the caller, not an admin, has a profile, holds no `account_members` row in the account, no `user_clients` row on any brand of it, and its default brand is a brand of it (`:536-555`); otherwise 409 `user_not_removed`; any read error 500 `read_failed`; the ban value is the fixed `876000h` (`:69`, `:476`). For a guest the retry carries the account id that `account_remove_guest` returns (`accounts sql:1201-1203`). Tests `agency_admin.test.js:494-559`. See N-I1, N-I2 |
| F3 LOW, read-back pass counts | **REFUTED** | Counted the assertions in the file: R2 has 32 `pg_temp.rb` calls plus two inside the a and b variant loop, 34, matching "34 pass" (`readback sql:445`); R3 has 61 `rb` lines minus the helper definition, the exception-only abort line and one arm of the E3 if/else, 58, matching "58 pass" (`:795`). The fix round added 1 (R2.8) and 6 (E4 two, E9 four), consistent with 33 and 52 before |
| F4 LOW, guest creation not one locked call | **CLOSED** | `account_create_guest_profile` (`accounts sql:1069-1105`) takes `account_lock_brand` first, re-checks kind and home under it, refuses an existing profile or account member, inserts the profile, reconciles, logs. `agency-admin.js:716-724` makes ONE rpc call; the earlier reads only spare a needless auth user. Grants: service_role only (`accounts sql:1318-1350`), probed in R2.8 (`readback sql:350-354`); refusals in R3 E9 (`:644-652`). Test `agency_admin.test.js:585` |
| F5 LOW, brand id not sent | **CLOSED** | `client_id: activeClientId` on both suggest-prompts calls (`Prompts.tsx:141`, `:429`) and on the ticket (`Tickets.tsx:306`); `SupportWidget.tsx:46-48` comment now matches the server (`support-request.js:122-135`). See N-I3 |
| F6 LOW, MCP "Upgrade to Radar" on an agency brand | **CLOSED in code** | `onUpgrade` is optional (`McpAccessSection.tsx:419`) and the button renders only when it is passed (`:731-735`); `Account.tsx:866` passes it only when `selfServeBilling`. This is the "optional prop" option of the ruling F6 asked for. No record of Constantin's ruling was found in the spec or in `docs/qa/`; the orchestrator should record it |
| F7 LOW, raw palette classes | **CLOSED** | The new line uses `text-meta text-ink-3` and `text-accent-ink` (`Account.tsx:845-848`). Older lines around it keep raw classes, untouched by this round |
| F8 LOW, `plan_grant_note` readable by a guest through PostgREST | **OPEN (spec note, no code owed)** | Unchanged; spec 9.6 still says 6.1 stops non-admins reading it (`grep` found no amendment). Owner bg-architect |
| I1 to I7 | unchanged | Still accurate. I1 stands for P3 |

---

## 3. Criteria re-checked

| V | Status | Evidence |
|---|---|---|
| V12 layout | MET on the orchestrator's measurement; static half re-checked here | Static, this seat: `BrandSwitcher` is `lazy()` (`Layout.tsx:25`) with a `Suspense` fallback of the same static identity block (`:1223-1227`, `:488-500`); no `motion` import in `Layout.tsx`, `BrandSwitcher.tsx` or `clientContext.tsx` (grep: only `motion-reduce:` class names). Orchestrator, not re-run: entry chunk 579,751 bytes at HEAD, 580,461 after (plus 710, under 1,000); headless Chrome, demo build, dark and light, 1440 by 900 and 390 by 844, 5 and 12 scratch brands, no sideways scroll of the window or `<main>`, sidebar not overflowing |
| V13 removal | PARTIAL: static MET, live NOT CHECKED | Removal deletes every row on every brand of the account (`accounts sql:1143-1148`), revokes credentials (`:1151`), ban fixed `876000h` (`agency-admin.js:69`, `:476`), a failed ban now has the `ban_removed` retry (F2). Live ban, sign-in and refresh refusal, `getUser` and `verifyOtp`, JWT expiry: not checkable here, owed after step 4 |
| V18 dashboard billing | MET (static), browser NOT CHECKED | `selfServeBilling = activeBrandAccountKind === 'direct'` (`Account.tsx:368`), so `agency`, `unknown` and `null` all hide: plan card Upgrade (`:823-830`), Billing portal button (`:749`), pricing note (`:837`), Locations Upgrade (`:856`), MCP Upgrade (`:866`). Contact line shown instead (`:844-849`). `upgradeTo` itself refuses checkout off a direct kind (`:638-641`). Beyond the Account page: sidebar Billing (`Layout.tsx:1242`), Locations "See plans" (`:414-420`), Prompts cap Upgrade (`Prompts.tsx:550`); server belt in `create-portal-session.js:48-54`. grep for `#pricing`, `create-portal-session`, `buy.stripe.com`, `accept-terms` in `src/` finds only these and the public `AuditReport.tsx:592` |
| V10 concurrency (touched by F4) | PARTIAL, improved | The guest insert now holds the brand's account lock, the same lock attach and detach take, so "a login created on a brand while it is being attached" is serialized. Not exercised concurrently |
| V19 grants (touched by F4) | MET (file), not applied | `account_create_guest_profile` revoked from PUBLIC, anon, authenticated and granted to service_role (`accounts sql:1318-1350`); R1.9 lists the expected ACL (`:197`); R2.8 probes it. The function does not exist in production yet |

---

## 4. New findings introduced by the fix round

### N1. LOW (accessibility, keyboard): Escape on the open brand list also closes the phone drawer

- Where: `src/components/BrandSwitcher.tsx:45-49` (a document `keydown`
  listener closes the list and does not stop the event), against
  `src/components/Layout.tsx:600-605` (the document Escape handler closes the
  drawer when no admin menu is open).
- Scenario: a staffer with 2 to 8 brands on a 390 px phone opens the drawer,
  opens the brand list, presses Escape. Both document listeners run: the list
  closes and the drawer closes with it, and two focus moves race (the
  switcher's button inside the closed drawer, and the hamburger). Layout's own
  rule is one layer per Escape. The 9+ brand path is not affected, because
  `Combobox` stops the event for exactly this reason (`ui/Combobox.tsx:165-168`).
- Fix: handle Escape in the listbox's and the trigger's React `onKeyDown` with
  `e.stopPropagation()` (React 17+ then keeps it from the document listener) and
  drop it from the document listener. Owner: bg-app.

### N2. LOW (resilience): a failed BrandSwitcher chunk replaces the whole shell

- Where: `src/components/Layout.tsx:1223-1227` (`Suspense` with no local error
  boundary); the nearest boundary is the app-level `RouteBoundary` that wraps
  every route including `Layout` (`src/App.tsx:277`, `:325`).
- Scenario: the switcher chunk fails to load (network drop, or a tab that turns
  multi-brand after a deploy changed the chunk hash). `React.lazy` throws from
  inside `Layout`; the outer boundary reloads once, and on a second failure
  shows its full-page card in place of the sidebar and the page. Before this
  round the sidebar could not fail this way. The design rule is that the
  sidebar survives a failed chunk (`App.tsx:165-166`).
- Fix: wrap the `Suspense` in a small local boundary whose fallback is
  `staticIdentity(activeClient)`. Owner: bg-app.

### N3. LOW (spec drift): the spec does not describe the fix-round contracts

- Where: `docs/arch/agency-multi-brand.md` 4.6 and 4.7 (no
  `account_create_guest_profile`; the grant list at `:605` lacks it), 9.1 (no
  `ban_removed`, `create_guest_login` still described without its rpc), 9.2
  and 8 (no `brand_has_stripe` refusal, no `create-portal-session.js` kind
  gate, which also edits a ledger row's file). grep for `brand_has_stripe`,
  `ban_removed`, `guest_profile` in the spec: 0 hits.
- Scenario: the next reviewer or builder reads the spec as binding and the
  read-back R1.9 expects a function the spec never names; the next fix round
  can undo a guard it cannot find. The first review already asked for the F1
  line in 4.6 and 9.2.
- Fix: one revision-5 pass adding the three contracts, the builder-question
  amendments of the first review (questions 1 and 2) and the F8 note. Owner:
  bg-architect.

### INFO

- **N-I1.** `ban_removed` refuses when the removed login's default brand left
  the account after the removal (a guest whose brand was detached before the
  retry). Disjunct (c) then still grants that login the detached brand. The
  `ban_failed` sentence already says to retry before anything else
  (`agency-admin.js:98`); the `user_not_removed` sentence ("Remove the login
  first") would mislead in that one case. Runbook line, or name the hand ban in
  that sentence.
- **N-I2.** `ban_removed` reads, then bans, without a lock. A concurrent admin
  re-add between the two would be banned. Admin-only, two admins at once;
  record only.
- **N-I3.** An admin's prompt suggestions now carry the active client id, so
  they are counted against that client's daily cap (`suggest-prompts.js:125-139`)
  instead of the shared `client:none` subject; and a staffer gets a separate
  daily cap per brand. Both follow from the ledger design; noted for the cost
  owner.
- **N-I4.** Order rule, one more consequence: a dashboard push before step 1+2
  makes `create-portal-session.js` refuse every non-admin (no `accounts`
  table, kind unreadable). Production holds 0 clients with a Stripe id, so no
  one is affected today; the existing order rule covers it. Also stale: the
  comment at `Account.tsx:636-637` says McpAccessSection "still calls this";
  it no longer does, and the mailto branch of `upgradeTo` is now unreachable.
  An admin also loses the sidebar Billing row, which spec 8 guard 1 intends.

---

## 5. Accessibility, new elements

- Brand switcher trigger (`BrandSwitcher.tsx:78-90`): native button,
  `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`; ArrowDown opens.
  Hit target 44 px below 640 px (`min-h-[44px]` overrides the 36 px
  `.side-row` height), 36 px from 640 px up.
- Listbox (`:91-123`): focusable, `aria-activedescendant`, ArrowUp, ArrowDown,
  Home, End, Enter, Space, Tab; options 44 px on a phone; active option shown by
  `bg-surface-2`, selected by `bg-accent-tint`; focus ring from the global
  `:focus-visible` rule (`index.css:432`, `:522`). Escape defect N1.
- 9+ brands: the existing `Combobox`, props unchanged.
- No new heading; the "Brand" label is `label-caps` text, as the Locations
  block above it. Colours are semantic tokens only (`text-ink`, `text-ink-2`,
  `text-ink-3`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `border-line-2`,
  `text-accent-ink`, `bg-accent-tint`, all mapped in `tailwind.config.js`).
  Contrast of these pairs was not computed here (no browser); the orchestrator
  reports 0 text boxes below AA in its measured states, which did not include
  the open list.
- Account contact line: `text-ink-3` on the card surface and a link in
  `text-accent-ink`; not measured here.

---

## 6. Commands run and results

- Node tests from `brandgeo-dashboard/`: `agency_admin` 55 passed 0 failed;
  `agency_billing_gate` 7, 0; `agency_access` 50, 0; `agency_lifecycle_server`
  25, 0; `ts_require_bundler` 5, 0; all 74 test files exit 0.
- Binding rules on changed lines: no `.ts` require under `netlify/functions`
  (bundler test green; `agency-admin.js` requires `_auth`, `_invite_link`,
  `_provision_client`); no `motion` in what `Layout.tsx` imports statically; no
  props change to `components/ui/`, `BrandLogo`, `Combobox`, `Card`,
  `SegmentedControl` (`git status` empty); no `scrollIntoView` added
  (`BrandSwitcher.tsx:28-37` uses `scrollTop`; the one in `Prompts.tsx:210` is
  pre-existing).
- Dash scan with `rg` and a class of the em and en dash: the six new files and
  the added lines of the seven modified files, 0 hits; positive control file, 1
  hit.
- Read-only production SQL, 2026-11-16: `accounts` table 0, the two functions
  0, `user_clients` 0 rows, clients with a Stripe id 0, non-admin profiles with
  a default brand 35.

---

## 7. Regression surface (by grep)

- `readBrandAccount` callers: `create-portal-session.js:49` (new),
  `set-client-plan.js:206`, `expire-plan-grants.js:226`. The portal gate is new
  behaviour for every non-admin caller of `create-portal-session`, whose only
  frontend caller is `Layout.tsx:762` (Account's `openBilling` at
  `Account.tsx:559` also posts to it).
- `activeBrandAccountKind` consumers: `Layout.tsx:135`, `:504`, `:414`,
  `:1242`; `Account.tsx:365-368`; `Prompts.tsx:59`, `:550`.
- `McpAccessSection` callers of `onUpgrade`: `Account.tsx:866` only.
- `support-request` and `suggest-prompts` now receive `client_id` from the
  pages; both run `assertClientAccess` first (`support-request.js:128`,
  `suggest-prompts.js:111`).
- Manual look owed: the sidebar on a phone with 2 to 8 brands (N1), and
  `Account.tsx` signed in as a guest of an agency brand.

---

## 8. Data and claim integrity

No user-facing number added. New strings: the `agency_billing` sentence, the
`brand_has_stripe` and `user_not_removed` admin sentences, "Brand", "Switch
brand", "Search brands", the Account contact line. None states a fact needing a
source. The customer-facing ones are marked `copy: pending bg-copy`; the
`agency_billing` sentence in `create-portal-session.js:25` is not marked and is
not shown to the user (Layout logs it, `Layout.tsx:774`).

---

## 9. Not checked

- Any browser rendering by this seat: the switcher at 390 and 1440, 5 and 12
  brands, the open list, focus return, contrast of the new pairs, light mode
  (V12 layout half is the orchestrator's alone).
- `npm run build`, entry chunk size, `tsc` (forbidden here).
- R2, R3 and R4 were not executed by anyone against production; the step 1 to 3
  files are not applied.
- Live ban behaviour and JWT expiry (V13), a real signup (V15), concurrent
  attach, remove and guest creation (V10).
- Whether Constantin ruled on F6.
- `stripe-webhook.js` paths that could set a Stripe id on an agency brand
  after attach (spec 8 names them; guard 3, the watchdog, is the control).

---

## 10. To ship step 4

Nothing blocks. Before the push, if convenient: N1 and N2 (bg-app). Before
step 5: N3 (bg-architect), the F6 ruling recorded, and the V13 live
measurements after the push.
