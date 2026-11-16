# Agency multi-brand: one login, several client brands

Written 2026-11-16 by `bg-architect`. **Revision 4, same day**: folds in the
third review, `docs/qa/agency-multi-brand-rereview-3-2026-11-16.md` (PASS WITH
FINDINGS: 2 medium, 3 low, 6 info; no fourth design review needed, the build
review checks these closures). Revision 4 changed sections 1.1, 4.3, 4.6, 4.7,
8, 9.1, 9.2, 9.3, 9.6, 13, 14, 15, 19 and 20. **Revision 3**: Revision 2 was
amended against two independent `bg-verify` design reviews, both of which
blocked revision 1; revision 3 is amended against the re-review of revision 2,
`docs/qa/agency-multi-brand-rereview-2026-11-16.md` (BLOCK: 1 blocker, 5
medium, 6 low, 7 info; 10 earlier findings PARTIAL). The reviews of revision 1:

- Review A: `docs/qa/agency-multi-brand-design-review-2026-11-16.md` (BLOCK:
  1 blocker, 4 major, 4 medium, 8 low, 6 info)
- Review B: `docs/qa/agency-multi-brand-design-review-b-2026-11-16.md` (FAIL:
  1 blocker, 4 major, 8 medium, 10 low, 7 info)

Section 20, the changelog at the end, maps every finding of all three reviews
to the change that closes it. Revision 3 changed this header and sections 1.6,
4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.3, 5.5, 6.1, 8, 9.1, 9.3, 9.5, 9.6, 13, 15, 19 and 20.
Spec only: no code, no migration, no git. Status: design reviews complete; Q11 and
Q12 RULED 2026-11-16 (defaults, section 16); READY for the build. Auth, RLS and billing
adjacent, so per AGENT-OS section 6 the review gates the build.

The ask: an agency lead evaluating BrandGEO signed in and wanted to review
several of its own clients' AI visibility, prompts and keywords, and found no
way to do it. Today a customer login sees exactly one brand. The lead is covered
for now by a manual first month (BrandGEO sets up the brands and delivers the
reports). Agencies are part of the ICP, so the gap will recur.

Every claim about current behaviour carries a `path:line` or a production query
read on 2026-11-16 (read-only, project `duiyifepitvugyulobqm`). `CLAUDE.md` is
not used as evidence.

---

## 0. Summary

1. **This finishes D1, it is not a new design.** `docs/arch/multi-site-tenancy.md`
   (2026-07-31, never built) designed "one login, many sites". Its boundary is
   adopted: `user_clients` is the membership table, `user_profiles.client_id`
   stays as a default brand, an `accounts` row groups brands for limits, and
   neither `account_id` nor any account table ever authorizes brand access.
   Where this spec departs from D1 it says so in section 18.
2. **The database is already half multi-brand.** `has_client_access()` already
   ORs in `user_clients` and 15 live RLS policies call it; `clientContext.tsx`
   already loads a non-admin's linked brands. Nothing ever writes a
   `user_clients` row (0 rows today). The Netlify layer checks single-FK
   equality or on the default brand in 30 places, 10 of which sit behind an
   admin-only gate, and
   `Layout.tsx` hides the switcher from non-admins.
3. **Agency additions over D1:** `account_members` holds account roles
   explicitly; an account has a HOME brand (the agency's own website), which is
   the default brand of every agency staff login, so removing a staff member can
   revoke everything; staff reach client brands through ordinary `user_clients`
   rows written by one reconcile function; and an agency's end customer can be
   given a guest login on their own brand that sees nothing else.
4. **Limits.** Per-brand enforcement (today's code) is never looser than the
   ruled account-level SUM per brand, but it is a different product from the
   one the ruling chose, so shipping P1 before P2 needs Constantin's ruling
   (Q11). Default: P2 ships before the first real agency brand is attached.
5. **Billing.** The Stripe webhook is not edited in P1 to P3, but it CAN be
   reached from inside the dashboard (the Upgrade control). P1 therefore hides
   self-serve billing on agency brands and alerts on any Stripe id that lands
   on one (section 8).

---

## 1. Measured state, 2026-11-16

### 1.1 How a customer login is scoped today

**Netlify layer.** `requireAuth()` (`brandgeo-dashboard/netlify/functions/_auth.js:67`)
verifies the JWT, then reads `user_profiles.role, client_id` with the service
key (`_auth.js:99-103`). With no profile it answers 403 (`:105-107`). The client
check is single-FK equality:

```js
// _auth.js:115-119
if (clientId !== null && profile.role !== 'admin') {
  if (String(profile.client_id) !== String(clientId)) {
    return { response: err(403, 'Forbidden: client mismatch', origin) }
  }
}
```

Only four functions pass `clientId` into `requireAuth`:
`client-api-keys.js:101`, `client-locations.js:151`,
`create-portal-session.js:30`, `get-subscription.js:31`. Everyone else repeats
the equality inline or reads the default brand. Ledger, re-measured (D1
counted 22 places on 2026-07-31; it is 30 now, because MCP, OAuth, invite links
shipped since, and revision 1 missed `delete-client.js` and the MCP key path):

| # | File:line | Shape | Disposition |
|---|---|---|---|
| 1 | `_auth.js:116` | the gate | P1: re-implement on the membership predicate (5.3) |
| 2 | `collect-chatgpt.js:174` | inline equality | P1 |
| 3 | `collect-claude.js:174` | inline equality | P1 |
| 4 | `collect-prompt.js:188` | inline equality | P1 |
| 5 | `enqueue-collection.js:69` | inline equality | P1 |
| 6 | `generate-recommendations.js:94` | inline equality | P1 |
| 7 | `seo-audit-page.js:104` | inline equality | P1 |
| 8 | `seo-crawl.js:53` | inline equality | P1 |
| 9 | `seo-draft.js:148` | inline equality | P1 |
| 10 | `seo-opportunities.js:36` | inline equality | P1 |
| 11 to 20 | `social-accounts.js:26`, `social-boost.js:42`, `social-brandkit.js:120`, `social-delete.js:45`, `social-generate.js:179`, `social-image.js:57`, `social-link.js:34`, `social-publish.js:108`, `social-queue.js:40`, `social-status.js:28` | inline equality, **dead for viewers**: each file calls `requireAuth(event, { adminOnly: true })` first (`social-accounts.js:15`, `social-boost.js:31`, `social-brandkit.js:109`, `social-delete.js:34`, `social-generate.js:165`, `social-image.js:44`, `social-link.js:23`, `social-publish.js:97`, `social-queue.js:29`, `social-status.js:17`; `social-profile.js:36` likewise) | **unchanged.** Admin path. AI Social is not a customer feature today, so agency members do not get it either |
| 21 | `suggest-prompts.js:105` | `auth.profile.client_id` as the implicit target | P1: take `client_id` from the body, check it |
| 22 | `support-request.js:120` | `auth.profile.client_id` as the implicit target | P1: same |
| 23 | `create-portal-session.js:37` | `clientId ?? auth.profile.client_id` | unchanged; widens with row 1 |
| 24 | `invite-redeem.js:178-179` | viewer AND `profile.client_id === row.client_id` | unchanged (9.4) |
| 25 | `oauth-authorize.js:76-78` | consent bound to `profile.client_id` | unchanged in P1 (12) |
| 26 | `oauth-token.js:85` | grant valid iff `profile.client_id === grant.client_id` | unchanged in P1 (12) |
| 27 | `mcp-server.js:1175` | same rule on every OAuth MCP call | unchanged in P1 (12) |
| 28 | `resend-invite.js:353-354` | admin only; finds the brand by `profile.client_id` | unchanged, admin path |
| 29 | `delete-client.js:66-86` | deletes every auth user whose `profile.client_id` is the brand; refuses only for an admin profile (`:69-71`) | **P1: must change** (9.5) |

| 30 | `mcp-server.js:1107-1145` (`resolveKey`) | key accepted on hash, not revoked, client id matching the key text; `created_by` read only for the research-client admin rule (`:1138-1143`), so a key outlives its creator's access | **P1: re-check the creator** (9.3) |
| 31 | `provision-account.js:84` | verifies the JWT itself, not through `requireAuth`, and for a user with a profile rewrites `name`, `brand_website`, `brand_aliases` of the default brand (`:130-145`) | **P1: refuse a banned user** (4.6, re-review 3 N3-L3) |

So P1 changes rows 1 to 10, 21, 22, 29, 30 and 31: 15 files. Not in the ledger
because they check the PROMPT's or the KEY's client against the requested
client, not the user: `collect-*.js:87`/`:102` and `mcp-server.js:1121`.

**Database layer, read 2026-11-16:**

```sql
-- public.has_client_access(cid integer), STABLE SECURITY DEFINER, search_path ''
-- EXECUTE: postgres, authenticated, service_role (not anon)
select cid = public.get_my_client_id()
    or exists (select 1 from public.user_clients uc
               where uc.user_id = auth.uid() and uc.client_id = cid);

-- public.get_my_client_id(), STABLE SECURITY DEFINER
SELECT client_id FROM public.user_profiles WHERE id = auth.uid()
```

| Policy group | Count | Predicate |
|---|---|---|
| A: already membership-aware | **15** | `is_admin()`/`my_role()='admin'` OR `has_client_access(...)` |
| B: single-FK equality | **36** (D1 counted 31) | `get_my_client_id()` or `my_client_id()` |

Group A: `ai_results` (2 SELECT), `clients_select`, `client_locations_read`,
`competitors` (2 SELECT, INSERT, DELETE), `prompts` (2 SELECT, INSERT, UPDATE),
`recommendation_runs_select`, `recommendations` (SELECT, UPDATE).
`prompts_delete` left Group A on 2026-11-09 (now `is_admin()` only).

Group B: D1's 31 (`client_notifications` x2, `collection_jobs_select`,
`collection_runs_select`, `seo_briefs` x4, `seo_crawls` x2, `seo_pages` x4,
`social_accounts` x3, `social_post_targets` x4, `social_posts` x4,
`social_profiles` x2, `tickets` x2, `ticket_comments` x2) plus five new since:
`client_api_keys_select`, `fix_states_select`, `fix_states_insert`,
`fix_states_update`, `oauth_grants_select`.

`user_clients`: RLS on; one policy, `user_clients_own_read` SELECT
`((user_id = auth.uid()) OR is_admin())`; **table grants give `anon` and
`authenticated` full DML** (INSERT, UPDATE, DELETE, TRUNCATE), so only RLS
stops a write today.

**Project defaults that every new object inherits** (`pg_default_acl`, schema
public): tables grant `arwdDxtm` to `anon`, `authenticated`, `service_role`;
functions grant EXECUTE to `anon`, `authenticated`, `service_role`, and
`CREATE FUNCTION` additionally grants PUBLIC. RLS is NOT enabled by creating a
policy. Section 4.7 therefore writes the grants and RLS statements out.

`ticket_client_id(bigint)` is SECURITY DEFINER with no `search_path`
(`proconfig` empty) and executable by PUBLIC and `anon`. Pre-existing; fixed in
step 3 because Group B feeds it into `has_client_access`.

### 1.2 The client switcher

- `clientContext.tsx:37` comments `clients` as "populated for admin only".
  **Stale.** The non-admin branch (`:205-227`) reads `user_clients` (`:211`),
  unions it with `profile.client_id`, loads those rows and calls
  `setClients(list)` (`:226`).
- `setActiveClientId` (`clientContext.tsx:282-291`) refuses an id not in the
  loaded list.
- `Layout.tsx:1061` is the only gate: `{!affiliateMode && isAdmin && clients.length > 0 && (`.
  Non-admins get the static identity block at `Layout.tsx:1201`.
- The admin switcher buckets clients by `category` (`Layout.tsx:86-110`); those
  buckets are admin vocabulary.
- `Layout.tsx` imports nothing from `motion` (only Tailwind `motion-reduce:`
  classes at `:376`, `:464`, `:942`, `:1230`).
- `isAdmin` is the EFFECTIVE flag; it reads false while a real admin uses "View
  as user" (`clientContext.tsx:356-360`), and `clients` still holds every client
  then. The comment at `clientContext.tsx:45` restricts `isRealAdmin` to the
  toggle and the banner; section 6.1 adds the provider's own derivation and
  updates that comment.
- `Combobox` (`src/components/ui/Combobox.tsx:33-44`) takes generic
  `{ value, label }` options, so a brand list fits without a props change
  (review A, C10).

### 1.3 Sites per plan, prompts and budgets

- **The site allowance exists in the database and nowhere in code.**
  `plan_prompt_caps.site_allowance` (free 1, radar 1, essentials 2, growth 2,
  growth_pro 3, managed 10, pro 10, enterprise 25), from
  `db/supabase-plan-caps-2026-07-31-migration.sql:52-97`. In
  `src/lib/planConfig.ts` it is only the `sites` column of the comment table at
  `planConfig.ts:518-526`. No `PLAN_SITES` constant, no reader.
- **The prompt cap is live, per brand.** `enforce_prompt_cap()` counts
  `prompts where client_id = new.client_id and is_active` against
  `plan_prompt_caps.prompt_cap` for the brand's plan, falls back to the free
  cap, bypasses the `service_role` claim and `is_admin()`, and raises the literal
  `prompt_cap_reached`, with the plan and cap in the text. `PLAN_PROMPTS`
  (`planConfig.ts:562-565`) matches the table.
- **The monthly EUR budget is live, per brand, at enqueue time.**
  `checkCollectionLimits()` (`_auth.js:235`) is called by
  `enqueue-collection.js:92` and `schedule-collections.js:168`, and by the
  collectors; `collection-worker-background.js` does not call it. It sums
  `sum_cost_eur` for the brand (`:278`) against
  `PLAN_MONTHLY_API_BUDGET_EUR[plan]` (`:321`, map at `_cost.js:532`). Its
  block message prints euro spend and budget (`_auth.js:328`), and
  `enqueue-collection.js:93-94` and the collectors return it to the caller.
  `sum_cost_eur` is executable by `postgres` and `service_role` only.
- **The pooling rule is decided.** `docs/strategy/sprint-ladder-ruling.md`
  Decision 3, "DECIDED 2026-07-31 by Constantin. Adopted, as briefed. SUM the
  pools, MAX the site allowance", enforced at ACCOUNT level, fail closed, and
  "Enforcing the sum is part of D1's build" (ruling lines 676-731).
- `PLAN_ORDER` is at `planConfig.ts:399`, mirrored at `_plans.js:30`.

### 1.4 Production shape

```
clients                                   72   (34 active, 1 free, 37 research)
user_profiles                             36
user_profiles where role = 'admin'         1
user_profiles where client_id is null      0
user_clients rows                          0
accounts, account_members             absent
clients with stripe_customer_id            0
clients with stripe_subscription_id        0
public RLS policies                      142
user triggers on clients                   0
client_events_type_check                  11 values, last 'location_change'
```

### 1.5 Paths that create a client row

Three, and none sets anything but its own columns (revision 1 missed this; it is
the blocker both reviews found):

| Path | Insert | Who |
|---|---|---|
| self-serve signup | `provision-account.js:180-182` | a new user after auth |
| Onboard wizard and lead import | `_provision_client.js:331` | admin |
| Stripe checkout with no existing login | `stripe-webhook.js:1085-1088` | the webhook |

Any NOT NULL column on `clients` must therefore be filled by the database, not
by these files. Section 4.3 does that with a trigger.

### 1.6 Other single-brand assumptions

| Path | Assumption | Where |
|---|---|---|
| Onboarding an email that already has a login | refused, the new client rolled back | `_provision_client.js:370-373` |
| Invite link redemption | invitee's `profile.client_id` equals the link's brand | `invite-redeem.js:178-179` |
| OAuth consent, token, MCP calls | bound to `profile.client_id` | `oauth-authorize.js:76-78`, `oauth-token.js:85`, `mcp-server.js:1175` |
| Stripe checkout target, unbound price | the payer's `profile.client_id` | `stripe-webhook.js:465-475`, written at `:556` |
| Stripe bound package | writes the payer's customer id onto the bound brand when it has none | `stripe-webhook.js:556`, `:573` |
| Stripe subscription update and delete | apply to every client sharing the customer id | `stripe-webhook.js:873`, `:883`, `:976` |
| Upgrade control on the Account page | opens public pricing for self-serve tiers | `src/pages/Account.tsx:626-635` |
| Plan change notices | email every login whose default brand is the brand, and write a `client_notifications` row | `set-client-plan.js:196-218` |
| Grant lapse notice | writes a `client_notifications` row on every lapsed trial, comp or package | `expire-plan-grants.js:219-228` |
| Brand deletion | deletes every login whose default brand is the brand | `delete-client.js:66-86` |

No function in `netlify/functions` writes `price.metadata.client_id` (grep): bound
packages are created by hand in Stripe today.

---

## 2. What an agency needs that D1 did not plan for

1. **The brands belong to other companies.** An agency may give its own client
   a login on that client's brand only. That person must never see the agency's
   other brands, account name, member list, plan mix, spend or pool.
2. **More brands.** The site allowance (growth 2, growth_pro 3, managed 10) was
   sized for own websites (Q1).
3. **Several staff, who leave.** Removing a staff member must revoke every
   channel: dashboard, RLS, API keys, OAuth. Revision 1 could not revoke the
   default brand (both reviews, M1).
4. **One payer, by invoice.** The agency pays for every brand; release 1 is
   invoiced by hand (section 8).
5. **A cross-brand view.** Optional in P3 (section 10).

---

## 3. Phases

| Phase | What ships | Touches billing? | Limits |
|---|---|---|---|
| **P1 access** | accounts and membership schema, Group B RLS, `assertClientAccess`, admin tooling, the non-admin switcher, agency billing guards | webhook not edited; dashboard billing hidden on agency brands | per brand, as today |
| **P2 limits** | account-level SUM pools, MAX brand allowance, `PLAN_SITES`, overrides, account usage | no | account |
| **P3 self-serve** | agency owner adds brands, staff and guests; optional portfolio page | no | reads P2 |
| **P4 close** | remove the default-brand disjunct from `has_client_access` and `assertClientAccess` | no | |
| **Later** | agency checkout, OAuth brand picker, white-label | yes | |

**Default order (Q11): P2 ships before step 5, the first real agency brand.**
If Constantin rules that a hand-sold agency may start on per-brand limits, step
5 may precede P2 (section 7.3 says what that sells).

---

## 4. Data model

### 4.1 `user_profiles`: unchanged; `client_id` STAYS as the default brand

`user_profiles.client_id` stays and is the **default brand**: where the user
lands, the brand a provisioning path creates the user for, and (until P4) a
brand the user can always reach. The default brand is fixed by rule, by kind of
login:

| Login | Default brand |
|---|---|
| direct customer | their own brand (as today) |
| agency staff (owner or manager) | the account's HOME brand, `accounts.home_client_id` |
| agency brand guest | the one client brand they were invited to |

This rule is what makes revocation complete (section 9.3). `user_profiles.role`
stays `admin | viewer`; agency staff and guests are `viewer`.

Re-pointing `client_id` is done only by `repoint_default_brand()` (4.6), which
moves the matching `primary` membership row in the same transaction. No code
updates `user_profiles.client_id` today (review B, L7).

### 4.2 `user_clients`: the membership table

```sql
-- existing, unchanged
user_id    uuid        not null references auth.users(id) on delete cascade
client_id  integer     not null references clients(id)    on delete cascade
created_at timestamptz not null default now()
primary key (user_id, client_id)
-- added in step 2
role         text not null default 'member' check (role in ('owner','member'))
created_by   uuid null references auth.users(id) on delete set null
grant_source text not null default 'direct'
             check (grant_source in ('backfill','primary','account','direct'))
```

| `grant_source` | Written by | Removed by |
|---|---|---|
| `backfill` | the one-time backfill (13, step 2), one row per existing profile | rewritten to `primary` by `convert_to_agency` (home brand) and `account_attach_brand` (attached brand), so no `backfill` row ever sits on an agency brand; deleted by the remove functions; step 2 rollback before P4 |
| `primary` | the `user_profiles` INSERT trigger (4.5), the default-brand row of every new login; the two rewrites above | `repoint_default_brand()`; the remove functions |
| `account` | `account_reconcile()` only | `account_reconcile()`; the remove functions |
| `direct` | a per-brand grant in P3 (`client-members.js`) | `client-members.js`; the remove functions |

Insert rule for `account_reconcile()`: `ON CONFLICT (user_id, client_id) DO
NOTHING`. It never overwrites a `backfill`, `primary` or `direct` row, and the
reconcile itself only ever deletes rows whose `grant_source = 'account'`
(review A, F-M2). **The remove functions are the exception and delete every
row the removed user holds on the affected brands, whatever its source**
(re-review N-Md1, N-L5): a removed person keeps nothing on the agency's brands.

Per-brand `role`: `owner` may manage that brand's `direct` grants in P3;
`member` has full product read and write on the brand. No read-only role
(Q4). A brand `owner` may never delete an `account` or `primary` row (review B,
M2).

### 4.3 `accounts`, `account_members`, `clients.account_id`

```sql
create table public.accounts (
  id             serial      primary key,
  name           text        not null,                -- display only
  kind           text        not null default 'direct' check (kind in ('direct','agency')),
  home_client_id integer     null references public.clients(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint agency_has_home check (kind = 'direct' or home_client_id is not null)
);
create unique index accounts_home_client_unique on public.accounts(home_client_id)
  where home_client_id is not null;

create table public.account_members (
  account_id integer     not null references public.accounts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)      on delete cascade,
  role       text        not null check (role in ('owner','manager')),
  created_by uuid        null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);
create unique index account_members_one_account_per_user
  on public.account_members(user_id);                  -- Q3

alter table public.clients add column account_id integer
  references public.accounts(id) on delete restrict;   -- NOT NULL at the end of step 1
create index idx_clients_account_id on public.clients(account_id);
```

- **`home_client_id`** is the account's own brand: for a direct account, its
  first brand; for an agency, the agency's own website. Agency staff default to
  it (4.1). It is nullable so the insert trigger can create the account before
  the brand row exists; the AFTER trigger fills it and the `agency_has_home`
  check holds it for agencies.
- **`on delete set null`, never `restrict`** (re-review N-B1). Today no foreign
  key into `clients` is RESTRICT, and five code paths delete a `clients` row:
  the provisioning rollbacks at `provision-account.js:212`,
  `_provision_client.js:341` (called by every rollback in that file) and
  `stripe-webhook.js:658`, `:683`, `:692`, and the admin delete at
  `delete-client.js:102`. With `set null`:
  - deleting a direct account's brand succeeds; the account is then cleaned up
    by `cleanup_empty_account()` below;
  - deleting an agency's HOME brand is refused by the database: setting
    `home_client_id` to null violates `agency_has_home`, so the whole DELETE
    fails (23514). `delete-client.js` refuses this case itself BEFORE any
    destructive step (9.5); the constraint is the backstop, never the first
    line, because `delete-client.js` deletes logins and history before it
    deletes the client row (`:76-98`, then `:102`).
- **`kind`** distinguishes an agency account. It drives the billing guards
  (section 8), notice routing (9.6), copy and the portfolio page. It never
  authorizes brand access and never changes a limit.
- **No plan column, no override columns in P1.** `prompt_limit_override` and
  `budget_override_eur` (custom-entitlements, as amended by D1 14.1) are added
  in P2 with the code that reads them, so an admin cannot set an inert override
  in P1 (review B, Md1).
- **Research brands** get a direct account each at backfill, like every client
  (37 of them), and can never be attached to another account (9.2).

**`ensure_client_account()`**, `BEFORE INSERT ON clients`, and
**`set_account_home()`**, `AFTER INSERT ON clients` (closes both reviews' B1):

> BEFORE: when `NEW.account_id IS NULL`, insert
> `accounts(name = NEW.name, kind = 'direct')` and set `NEW.account_id` to its
> id. **When `NEW.account_id` is given, raise** `account_id_on_insert`: a new
> client always starts in its own direct account, and joins another account
> only through `account_attach_brand` and its guards (re-review N-I1). P3's
> `create-site.js` inserts, then attaches.
> AFTER: `update accounts set home_client_id = NEW.id where id = NEW.account_id
> and home_client_id is null`.

**`cleanup_empty_account()`**, `AFTER DELETE ON clients` (re-review N-B1):

> Lock the deleted row's account (`OLD.account_id`, the advisory lock of 4.4).
> If the account is `kind = 'direct'` and no `clients` row references it any
> more, delete it (its `account_members` rows cascade). If it is direct and
> still holds brands, set `home_client_id` to its lowest remaining brand id when
> it is null **or equals `OLD.id`**, so the result does not depend on whether
> this trigger fires before or after the foreign key's set-null action (both are
> AFTER row triggers, ordered by name; re-review 3 N3-I1). An agency account never reaches this branch with a null home,
> because the delete was refused.

So a provisioning rollback in any of the three unedited insert paths
(insert, then delete on a later failure) leaves no `clients` row and no
`accounts` row behind, exactly as today leaves no `clients` row.

All three trigger functions are `SECURITY DEFINER`, `search_path ''`,
schema-qualified, EXECUTE revoked from PUBLIC, `anon`, `authenticated` (trigger
functions run as the definer regardless). With them, the three insert paths of
1.5 and the five delete paths above keep working with zero edits, before and
after the NOT NULL.

### 4.4 The fan-out: how agency staff reach brands

**`account_members` never authorizes brand access.** Access to brand X is
exactly INVARIANT M (5.1): a `user_clients` row for X. Agency staff reach every
brand of their account because ONE function writes those rows:

> **`account_reconcile(p_account_id)`**, run at the end of every account write,
> inside the same transaction:
> 1. insert `(member, brand, member_role = 'owner' ? 'owner' : 'member',
>    'account')` for every `account_members` row times every brand of the
>    account, ON CONFLICT DO NOTHING;
> 2. delete every `grant_source = 'account'` row on a brand of this account
>    whose user is not a member of the account;
> 3. delete every `grant_source = 'account'` row whose user is a member of this
>    account but whose brand is no longer in it.

Every account write is a SQL function (4.6), takes
`pg_advisory_xact_lock(hashtext('account:' || p_account_id))` first (the
`add_client_locations` pattern, which already exists, `SECURITY DEFINER`,
`service_role` only), does its change, then calls `account_reconcile`. One
statement from the Netlify function, one transaction, no partial state, no
race between `attach` and `remove` on the same account (review A, F-M2; review
B, Md8).

**Lock order** (re-review N-L1): a function touching two accounts
(`account_attach_brand`, `account_detach_brand`) takes both advisory locks in
ascending account id order; the 4.5 trigger takes the lock of the brand's
account before it reads `kind` and writes. So a login created on a brand while
an admin attaches it either commits first (and is then caught by the
unconfirmed-users refusal) or waits and sees the brand already attached (and is
written as an agency `member`).

Three standing check queries, all EXPECT 0, all in tests, the read-backs, V10
and the daily watchdog check:

```sql
-- missing: a member without a row on a brand of their account
select am.account_id, am.user_id, c.id from account_members am
join clients c on c.account_id = am.account_id
left join user_clients uc on uc.user_id = am.user_id and uc.client_id = c.id
where uc.user_id is null;

-- stale: an 'account' row with no membership behind it
select uc.* from user_clients uc join clients c on c.id = uc.client_id
where uc.grant_source = 'account'
  and not exists (select 1 from account_members am
                  where am.user_id = uc.user_id and am.account_id = c.account_id);

-- stray: any row on an agency brand held by someone who is neither a member of
-- that account nor a login whose default brand is that brand (re-review N-Md1)
select uc.* from user_clients uc
join clients c on c.id = uc.client_id
join accounts a on a.id = c.account_id and a.kind = 'agency'
where not exists (select 1 from account_members am
                  where am.user_id = uc.user_id and am.account_id = a.id)
  and not exists (select 1 from user_profiles p
                  where p.id = uc.user_id and p.client_id = uc.client_id)
  and uc.grant_source <> 'direct';
```

`direct` rows (P3 per-brand grants to a guest on a second brand) are excluded
from the third check by design; P3's `client-members.js` owns them.

Why explicit rows and not `has_client_access()` reading `account_members`: a
guest on one agency brand must not inherit the other brands, and "account
membership implies brand access" would make that one predicate edit away.

### 4.5 The membership trigger

`sync_primary_membership()`, **`AFTER INSERT ON user_profiles` only** (not on
UPDATE; re-pointing goes through 4.6). `SECURITY DEFINER`, `search_path ''`.

> When `NEW.client_id IS NOT NULL`:
> 1. read the brand's account id, take its advisory lock (4.4), re-read the
>    brand's account `a` under the lock;
> 2. insert `user_clients(NEW.id, NEW.client_id, role, 'primary')` ON CONFLICT
>    DO NOTHING, where role is **`'member'` when `a.kind = 'agency'`**, else
>    `'owner'` (review B, M2; review A, F-Md2);
> 3. when `a.kind = 'direct'`, insert `account_members(a.id, NEW.id, 'owner')`
>    ON CONFLICT DO NOTHING (a second login on the same direct brand also owns
>    the account; a login already in another account is left out by the unique
>    index).

So: a self-serve signup or an onboarded direct customer is the owner of their
brand and their account, exactly as D1 intended. An agency guest is a plain
member of the one brand and of no account. Agency staff never come through this
path's step 3: their profile is inserted on the home brand (kind agency) by
`account_create_staff_profile` (4.6), which writes their `account_members`
row in the same transaction.

### 4.6 Account write functions

All `LANGUAGE plpgsql`, `SECURITY DEFINER`, `search_path ''`, EXECUTE granted to
`service_role` only (4.7), each taking the advisory lock and ending in
`account_reconcile`. They are the only writers of `accounts`, `account_members`,
`clients.account_id` and `account`/`primary` membership rows, apart from the
triggers of 4.3 and 4.5. Each writes one `client_events` row of the new type
`account_change` on the account's home brand, with actor, account, brand and
user ids and no email.

| Function | Refuses (raises a coded error) | Does |
|---|---|---|
| `convert_to_agency(p_account_id, p_confirm_user_ids uuid[], p_actor)` | account already agency; account holds more than one brand; any login with a profile or row on the brand not named in `p_confirm_user_ids` (re-review N-L6; live, one brand already has two logins) | sets `kind = 'agency'`; its only brand is the home brand; existing members keep their account roles; every `backfill` row on the home brand becomes `primary`, role `member` (account owners manage the account through `account_members`, not through a brand role) |
| `account_attach_brand(p_account_id, p_client_id, p_confirm_user_ids uuid[], p_actor)` | target not `kind='agency'`; brand `category in ('research','archived','test')`; brand already in an account with more than one brand; **brand is the home brand of an agency account** (every direct brand is its own account's home, so the plain wording would refuse every attach; re-review 3 N3-L1); any `user_profiles` or `user_clients` row on the brand whose user is not in `p_confirm_user_ids` | locks source and target accounts (4.4); moves the brand into the account; **sets every confirmed user's row on the brand to role `member`, and a `backfill` row to `primary`** (the former customer becomes a guest, re-review N-Md3); deletes the confirmed users' `account_members` rows on the brand's old direct account and the now empty direct account; reconciles. Returns the brand name for the admin UI to echo (review B, Md3) |
| `account_detach_brand(p_account_id, p_client_id, p_actor)` | brand is the home brand | locks both accounts; creates a direct account for the brand (home = it); moves it; makes every login whose default brand is this brand an `owner` of the new account and of the brand again (the reverse of attach); reconciles (removes every `account` row on it) |
| `account_create_staff_profile(p_account_id, p_user_id, p_role, p_actor)` | the auth user already has a profile; user already in an account | inserts `user_profiles(p_user_id, client_id = home_client_id, 'viewer')` (the 4.5 trigger writes the `primary` row as `member`) and `account_members(p_role)` in one transaction, reconciles (re-review N-L3) |
| `account_add_staff(p_account_id, p_user_id, p_role, p_actor)` | the user's `user_profiles.client_id` is not this account's home brand; user already in an account | inserts `account_members`, reconciles |
| `account_remove_member(p_account_id, p_user_id, p_actor)` | it would remove the last owner (422) | deletes the `account_members` row; **deletes every `user_clients` row the user holds on every brand of the account, whatever its `grant_source`** (re-review N-Md1, N-L5); reconciles; sets `revoked_at` on every `client_api_keys` row with `created_by = p_user_id` on those brands; revokes every `oauth_grants` row of the user on those brands; sets `used_at = now()` on every unused `oauth_codes` row of the user (all of them, not only these brands), so a code issued before the removal cannot mint a fresh grant at `oauth-token.js:97-100` afterwards (re-review 3 N3-Md1); sets `revoked_at = now(), revoked_reason = 'revoked'` on every open `client_invite_links` row of the user, so a pending invite cannot be redeemed (N3-L3; `'revoked'` is an existing allowed value). Returns `ban_login: true` |
| `account_remove_guest(p_client_id, p_user_id, p_actor)` | the user is an account member; the brand is not in an agency account | deletes every row the user holds on the brand, whatever its source; revokes their keys and grants on it; marks every unused `oauth_codes` row of the user used and revokes their open `client_invite_links`, as `account_remove_member` does. Returns `ban_login: true` |
| `revert_agency_to_direct(p_account_id, p_actor)` | account not `kind = 'agency'`; account holds any brand besides its home brand | sets `kind = 'direct'`; sets the home brand's `primary` rows of account owners to role `owner`; keeps every `account_members` row (managers of a direct account are harmless: they gate nothing but account-level reads); reconciles. Used by the step 4 rollback (13), so that after a rollback the former agency's brand deletes like any direct brand (re-review 3 N3-Md2) |
| `repoint_default_brand(p_user_id, p_client_id, p_actor)` | the user holds no row on the new brand | updates `user_profiles.client_id`, deletes the old `primary` row, sets the new one to `primary` |

**Banning, not deleting, a removed login.** Until P4, `has_client_access` still
grants the default brand through `get_my_client_id()`, so a removed staff
member keeps the home brand and a removed guest keeps their brand for as long as
their JWT lives. `agency-admin.js` therefore bans the login right after the SQL
function returns `ban_login: true`:

- **The value is fixed: `auth.admin.updateUserById(id, { ban_duration: '876000h' })`**
  (100 years; `'none'` lifts it). No admin input sets the duration, so a ban
  cannot lapse by accident (re-review N-Md1). Lifting a ban is a separate admin
  action that first restores rows.
- **`requireAuth` refuses a banned user**, and so does `provision-account.js`,
  the one customer-facing function that verifies the JWT itself (`:84`; ledger
  row 31, re-review 3 N3-L3). After `auth.getUser(token)` (`_auth.js:93`), a
  user whose `banned_until` is in the future gets 401. This closes every
  authenticated Netlify path at once, whether or not Supabase itself rejects a
  banned user's still-valid token there (unverified, see V13). Only RLS reads
  with the old token remain, for at most the JWT expiry, which `bg-backend`
  reads from the Supabase Auth settings and records in the read-back.
- Banning is reversible and keeps the audit trail; deleting the login is a
  separate, explicit admin action (Q12). If the ban call fails the function
  answers 500 with `access_removed: true, ban_failed: true` and the admin
  retries; every other channel is already closed by then.

### 4.7 Grants and RLS, written out (closes review B, M4; review A, F-I1, F-L4)

In step 1 and step 2, verbatim intent:

```sql
alter table public.accounts        enable row level security;
alter table public.account_members enable row level security;
revoke all on public.accounts, public.account_members from anon, authenticated;
grant select on public.accounts, public.account_members to authenticated;
revoke all on sequence public.accounts_id_seq from anon, authenticated;   -- re-review N-I2

-- user_clients becomes THE authorization table
revoke insert, update, delete, truncate on public.user_clients from anon, authenticated;

revoke execute on function
  public.ensure_client_account(), public.set_account_home(), public.cleanup_empty_account(),
  public.sync_primary_membership(), public.account_reconcile(integer),
  public.convert_to_agency(integer, uuid[], uuid), public.account_attach_brand(integer, integer, uuid[], uuid),
  public.account_detach_brand(integer, integer, uuid), public.account_add_staff(integer, uuid, text, uuid),
  public.account_create_staff_profile(integer, uuid, text, uuid),
  public.revert_agency_to_direct(integer, uuid),
  public.account_remove_member(integer, uuid, uuid), public.account_remove_guest(integer, uuid, uuid),
  public.repoint_default_brand(uuid, integer, uuid)
  from public, anon, authenticated;
grant execute on function <the same list> to service_role;

revoke execute on function public.is_account_member(integer), public.brand_account_kind(integer)
  from public, anon;
grant execute on function public.is_account_member(integer), public.brand_account_kind(integer)
  to authenticated, service_role;
```

P2's `sum_cost_eur_account(p_since, p_account_id)` matches `sum_cost_eur`:
EXECUTE for `postgres` and `service_role` only. P2's rewrite of
`enforce_prompt_cap()` also moves it from `search_path = public, pg_temp` to
`''` (schema-qualified) and revokes EXECUTE from PUBLIC, `anon`,
`authenticated` (pre-existing, re-review N-I3).

Read-backs print and compare against an expected string: `relrowsecurity` for
both tables; `relacl` for `accounts`, `account_members`, `user_clients` and
`accounts_id_seq`;
`proacl` and `proconfig` for every function above. "Policies listed" is not a
read-back.

### 4.8 What is NOT added

- No `agency_clients` table: the brand IS a `clients` row and the grouping IS
  `clients.account_id`.
- No entitlement column on `user_profiles`, `user_clients` or
  `account_members` (D1 14.1).
- No `account_id` on `ai_results` (D1 8.4).

---

## 5. Authorization

### 5.1 INVARIANT M (brand access), unchanged from D1

> For any request naming a target brand, access is granted if and only if
> (a) `user_profiles.role = 'admin'` for the caller, or
> (b) a `user_clients` row exists with the caller's `user_id` and the target
> `client_id`, or
> (c) until P4 only, the target is the caller's `user_profiles.client_id`.
> `clients.account_id`, `accounts` and `account_members` grant nothing.

Disjunct (c) is the one D1 calls permissive and dated. It is safe in P1 only
because every default brand is fixed by 4.1 and every removal bans the login
(4.6).

### 5.2 INVARIANT A (account data), new

> Account-level data (the account row, its member list, the set of its brands
> as an account, pooled consumption and allowance) is readable if and only if
> the caller is a platform admin or holds an `account_members` row for that
> account.

Policies, the only ones on these tables:

| Table | Policy | Cmd | Predicate |
|---|---|---|---|
| `accounts` | `accounts_select` | SELECT | `is_admin() or public.is_account_member(accounts.id)` |
| `account_members` | `account_members_select` | SELECT | `is_admin() or user_id = auth.uid() or public.is_account_member(account_members.account_id)` |

`is_account_member(aid)` is `STABLE SECURITY DEFINER`, `search_path ''`, so the
second policy does not recurse. Columns are qualified with the table name
(review B, I3). No INSERT, UPDATE or DELETE policy; writes go through 4.6.

**What a guest can learn, and it is deliberate:** `clients.account_id` of their
own brand (an integer, review A, F-I2) and `brand_account_kind(cid)`, a `STABLE
SECURITY DEFINER` function returning `accounts.kind` for a brand only when
`is_admin() or has_client_access(cid)`, else null. The frontend needs `kind` to
hide billing on agency brands (section 8) without widening `accounts` RLS
(review B, M3 fix direction).

### 5.3 `assertClientAccess` in `_auth.js`

Adopts D1 4.2 as the contract:

```ts
function assertClientAccess(auth: AuthResult, targetClientId: number | string):
  Promise<{ ok: true } | { ok: false; response: NetlifyResponse }>
```

- Parses the target as a positive int4 (400 otherwise).
- Admin: ok. Otherwise disjunct (c) (P1 to P3), else one service-key read of
  `user_clients` for `(user, target)` with `.maybeSingle()`.
- A query error is a 403, never a fallback; no row is a 403 (D1 F1, F2).
- `requireAuth`'s `clientId` option (`_auth.js:115-119`) is re-implemented on
  it, so ledger row 23 and the four `requireAuth({ clientId })` callers widen
  with no edit.
- Ledger rows 1 to 10, 21, 22 change in P1. Rows 11 to 20 stay (admin path).
- `requireAuth` additionally answers 401 for a user whose `banned_until` is in
  the future (4.6), so a removed login loses the Netlify layer at once.

`checkCollectionLimits` is not an authorization function and is untouched in
P1.

### 5.4 RLS: Group B, 36 policies

35 are mechanical substitutions, nothing else in the predicate changes:

- `client_id = get_my_client_id()` to `has_client_access(client_id)`
- `client_id = my_client_id()` to `has_client_access(client_id)`
- `ticket_client_id(ticket_id) = get_my_client_id()` to
  `has_client_access(ticket_client_id(ticket_id))`

`tickets_insert`, `tickets_select` and `ticket_comments_*` carry extra
conjunctions that survive byte for byte; `has_client_access(NULL)` is not true,
so `tickets_insert`'s null guard survives (review A, C3).

**One deliberate exception, `oauth_grants_select`** (review B, L1): an OAuth
grant is a per-user credential, so it becomes
`is_admin() or (user_id = auth.uid() and has_client_access(client_id))`, not a
plain substitution. `client_api_keys_select` substitutes mechanically: every
member of a brand sees and may revoke that brand's keys, consistent with Q4.

In the same step: `alter function public.ticket_client_id(bigint) set
search_path = ''` after reading its body and schema-qualifying every reference
(review A, F-L7; review B, L10).

`has_client_access`'s name and signature never change: 15 policies, 51 after
step 3, and `client_results_latest` (SECURITY INVOKER) depend on it.

### 5.5 No widening for existing viewers, provable at apply time

After step 2 every existing user holds exactly one `user_clients` row, on their
own `profile.client_id`, and no `account` or `direct` row exists. So
`has_client_access(x)` equals `x = get_my_client_id()` for every user and every
`x`, and Group B's substitution is the identity. Read-backs, all EXPECT 0,
before the P1 push:

```sql
select count(*) from user_clients uc join user_profiles p on p.id = uc.user_id
where uc.client_id <> p.client_id;                                    -- 1
select count(*) from user_profiles p
left join user_clients uc on uc.user_id = p.id and uc.client_id = p.client_id
where p.client_id is not null and uc.user_id is null;                 -- 2
select count(*) from clients where account_id is null;                -- 3
select count(*) from user_clients where grant_source in ('account','direct');  -- 4
```

This is a snapshot proof (review B, I2). Its durability rests on 4.1 (default
brands fixed by kind), 4.5 (INSERT-only trigger, agency guests as members),
4.6 (all writes in locked functions) and the three 4.4 checks, which run as tests
and as a daily watchdog check (13, step 4).

### 5.6 Fail-closed rules

- Membership read error: 403 (Netlify), empty (RLS); never "fall back to the
  default brand" as an error path.
- Account read error in the frontend: hide account UI; never render 0 of 0.
- Account read error in a limit check (P2): block with `account_unresolved`.
- Account write: one SQL function, one transaction; any error rolls back the
  whole change. The login ban is the one step outside it and fails loudly.

---

## 6. The switcher for non-admins

Guardrails: no props change to any shared component; nothing imported from
`motion` by anything `Layout` imports; tokens only.

### 6.1 `clientContext.tsx`

- Delete the stale comment at `:37`; update `:45` to say the provider also
  reads `isRealAdmin` to derive `canSwitchClient`.
- Add `canSwitchClient: boolean = !isRealAdmin && clients.length > 1`. A real
  admin in "View as user" gets no customer switcher.
- Add `activeMembershipRole: 'owner' | 'member' | 'admin' | null`.
- Add `accountAccess: { account_id; role: 'owner' | 'manager'; kind } | null`,
  from `account_members` joined to `accounts` under 5.2 (null for guests and on
  error).
- Add `activeBrandAccountKind: 'direct' | 'agency' | 'unknown' | null`, from
  `brand_account_kind(activeClientId)`, re-read on switch: `'unknown'` while
  loading and on a read error (re-review N-L4), `null` for an admin.
- Non-admin client select drops `plan_grant_note` (review B, Md6; review A,
  F-L5). The admin select is unchanged.
- The `user_clients` read at `:210-213` gets an explicit error branch: on error,
  default brand only, nothing surfaced.
- No page reads `user_clients`, `account_members` or `accounts` directly.

### 6.2 `Layout.tsx`

- The admin switcher (`:1060-1194`) is unchanged.
- New block when `!affiliateMode && canSwitchClient`: same `sidebar-well`
  container and `side-row` trigger as `:1062-1085`, same `BrandLogo` props as
  `:1081`, a listbox of `clients` by name, no category tabs, no Internal
  control, calling `setActiveClientId`.
- Above 8 brands a type-to-filter field using the existing `Combobox` with its
  existing props.
- The identity block at `:1201` renders only when the new block does not.
- Accessibility at build (review A, section 4): listbox semantics, every row
  keyboard reachable, focus back on the trigger after a switch, 44 px rows at
  phone width, identity block and switcher never both in the tab order.
- Strings marked `copy: pending bg-copy`.

### 6.3 Switching hygiene, verified by design, browser check owed (V9)

Keyed per brand already: results cache `${userId}:${activeClientId}`
(`resultsContext.tsx:90`), location filter
`brandgeo_location_filter_v2_${userId}_${clientId}` (`lib/locations.ts:78`),
prompt sort per client (`promptPerformance.ts:89`), collection progress carries
`clientId` (`collectionContext.tsx:121`, `:259`), unknown ids refused
(`clientContext.tsx:282-291`), stale stored id falls back at
`clientContext.tsx:227`.

---

## 7. Plans and budgets

### 7.1 The rule (ruled)

Sprint ladder Decision 3: SUM the pools, MAX the brand allowance, enforce at
account level, fail closed. For an account with brands b1..bn:

```
prompts_allowed = sum(plan_prompt_caps.prompt_cap[plan(bi)])   or accounts.prompt_limit_override (P2)
budget_allowed  = sum(PLAN_MONTHLY_API_BUDGET_EUR[plan(bi)])   or accounts.budget_override_eur  (P2)
brands_allowed  = plan_prompt_caps.site_allowance[top(plans)], top ranked by PLAN_ORDER index
prompts_used    = active prompts across all bi
budget_used     = sum_cost_eur_account(month_start, account)
```

### 7.2 What stays per brand

Engines, cooldown and cadence, locations (`PLAN_LOCATION_LIMIT`), the hourly
abuse ceiling (D1 8.1), the platform ceiling (global).

### 7.3 Before P2: per brand, and what that sells (needs Q11)

Untouched code caps each brand at its own plan. Per brand that is no looser
than today, and since the budget is checked at enqueue time only (1.3), each
brand can still end a month one run past its budget, exactly as today (review
A, F-L2). Summed over the account, configured budgets equal the ruled SUM. What
differs is the product: under the ruling a Growth plus Essentials account may
spend EUR 59.70 on either brand; per brand, the Growth brand stops at 44.85 and
the Essentials brand at 14.85. The ruling says enforcing the sum "is part of
D1's build", so a release that attaches agency brands before P2 needs
Constantin's yes (Q11, review B, Md1). Default: no; P2 ships before step 5.

### 7.4 P2: account-level enforcement

- `enforce_prompt_cap()`: same function, every early return kept verbatim
  (inactive rows, non-activating updates, `service_role` claim, no-request
  session, `is_admin()`, free fallback, the literal `prompt_cap_reached`
  token). Only the count and cap change: active prompts across the account
  against the SUM (or override). With one brand per account the result equals
  today's for all 72 brands. **Message:** the plan and cap numbers are included
  only when `is_account_member(account)` or the account is direct; otherwise
  the text is `prompt_cap_reached: this workspace has reached its prompt limit.`
  (review A, F-M4; review B, Md7). `Prompts.tsx` matches the token, not the
  numbers.
- `checkCollectionLimits()`: resolve the account, one call to the new
  `sum_cost_eur_account(p_since, p_account_id)` (service role only), compare
  against the summed budget read from `_cost.js`'s exported map. `_cost.js` is
  not edited. `detail` fields renamed `accountSpent`/`accountBudget` (D1 8.4),
  readers (`platform-activity.js`) updated in the same commit. New reason
  `account_unresolved`, blocked. **The caller-facing `message` carries no
  numbers for anyone**; numbers go to the log and the admin event only. The
  frontend already phrases by `reason`.
- `PLAN_SITES` added to `planConfig.ts` beside `PLAN_PROMPTS`, mirroring
  `site_allowance`, with a node test asserting equality for all eight plans.
- The override columns are added to `accounts` here, read here.
- Account usage for the Account page: new `account-usage.js`, `requireAuth`,
  refuses unless the caller is an account member or admin, returns brands
  used and allowed, prompts used and allowed, and budget used as a PERCENTAGE
  only (euro figures stay admin-only).
- Over-allowance: D1 8.5 unchanged (nothing deleted or deactivated, adding a
  brand refused, `account_over_allowance` admin event, banner rendered only for
  account members).
- SUM lets one brand drain the pool (ruling 3a); in an agency account a guest's
  prompts draw on the whole pool too (review B, L8). Both in Q2.

### 7.5 The agency fit problem

| Agency holds | brands_allowed | prompts (SUM) | EUR budget (SUM) | list price |
|---|---|---|---|---|
| 3 x Growth | 2 | refused at brand 3 | | |
| 1 x Growth PRO + 2 x Growth | 3 | 126 | 157.05 | EUR 1,047 |
| 1 x Managed + 5 x Essentials | 10 | 290 | 299.25 | EUR 1,995 |

Both reviews re-computed these. A 4 to 10 brand agency must hold one Managed or
Enterprise brand (Q1). The home brand counts as a brand. SerpApi's 500 credits a
month are platform-wide (`_cost.js:186-196`); several agency brands on Growth
PRO or above spend them faster. Recorded, not solved.

---

## 8. Billing

**P1 to P3: agency brands are invoiced by hand.** Plans are set with
`set-client-plan.js`, `plan_source = 'package'` or `'manual'` with
`plan_grant_until`; `stripe_customer_id` stays NULL on agency brands. The
webhook is **not edited**. It is **reachable** (review B, M3; review A,
F-Md1), so P1 ships three guards:

1. **Dashboard.** Unless `activeBrandAccountKind === 'direct'` (so also while
   it is `'agency'` or `'unknown'`, re-review N-L4), `Account.tsx`
   shows no self-serve Upgrade (the path at `Account.tsx:626-635`), no Billing
   portal button and no plan purchase CTA anywhere; it shows a "contact us"
   line instead (`copy: pending bg-copy`). Frontend only.
   An admin reads `activeBrandAccountKind` as `null`, so an admin sees no
   Upgrade or Billing portal on any brand. Intended: admins change plans with
   `set-client-plan.js`, never through the customer checkout (re-review 3
   N3-I6).
2. **Bound packages.** No tool creates them today (1.6); runbook rule and a
   check in any future offer builder: never bind a package to a brand whose
   account is an agency.
3. **Alert.** A daily check, added by `bg-backend` to the watchdog
   (`docs/ops/alerting-runbook.md`, `ops.watchdog_findings()`), raises a
   finding when this returns non-zero:
   `select count(*) from clients c join accounts a on a.id = c.account_id where a.kind = 'agency' and (c.stripe_customer_id is not null or c.stripe_subscription_id is not null)`.

What can still happen, stated: an agency staffer or guest who pays a public
payment link with their login email upgrades their default brand (the home
brand for staff, the client brand for a guest) through `stripe-webhook.js:465-475`
and `:556`. Guard 1 removes the in-product route to that; guard 3 reports it
the same day. Preventing it in the webhook is the later agency-checkout work.

**Later, self-serve agency checkout** (own spec, Opus billing review): one Stripe
Customer per ACCOUNT, one subscription per brand, resolution by
`stripe_subscription_id` and `subscription.metadata.client_id`, D1 10.3's four
checkout branches. Reverses D1 R5 for agencies (Q7).

---

## 9. Write paths and the membership lifecycle

### 9.1 P1, admin only: `agency-admin.js` (new)

`POST`, `requireAuth(event, { adminOnly: true })` first, service key inside,
timeout 26 in `netlify.toml`. Every write action is ONE `rpc()` call to a 4.6
function, then (for removals) the ban.

| Action | Calls |
|---|---|
| `convert` | `convert_to_agency` on the lead's own direct account; like attach, a preview call lists every login on the brand and a second call confirms them |
| `attach_brand` / `detach_brand` | `account_attach_brand` / `account_detach_brand`; `attach_brand` first returns a preview (brand name, users that would need confirming) and needs a second call with `confirm: true` |
| `create_staff_login` | creates an auth user by invite (the BrandGEO invite channel already used by `resend-invite.js`), then ONE call to `account_create_staff_profile` (profile on the home brand and `account_members` in one transaction). If that call fails, the function deletes the auth user it just created, only when it passes the ownership test `_provision_client.js` already applies (id not seen before the call, fresh `created_at`, no profile), so an existing login is never deleted; the invite email is sent only after the SQL call commits (re-review 3 N3-I3). Invite links it issues need a new `client_invite_links.source` value, `agency-admin` (step 3) |
| `add_staff` | `account_add_staff` for an existing login whose default is already the home brand |
| `create_guest_login` | invite and profile on one client brand of the account; no account row |
| `remove_member` / `remove_guest` | the SQL function, then the ban |
| `list` | account, members (email via auth admin), brands with plan and prompt count, rows by `grant_source`, the three 4.4 checks |

**How the first agency is built** (closes review A, F-Md3): the lead's login and
own brand already exist (self-serve signup, or the Onboard wizard with the
agency's own website). `convert`, after confirming every login already on that
brand, turns that direct account into an agency with
that brand as home. Client brands are onboarded with the wizard without a login
(Q5), then `attach_brand`. Staff are created with `create_staff_login`. Nothing
creates a stray brand.

### 9.2 Attaching a brand safely

`account_attach_brand` refuses research, archived and test brands, a brand in a
multi-brand account, the home brand of an agency account, and any brand with
users not named in the
confirmation (4.6). The admin UI echoes the brand name and users before the
confirm call.

### 9.3 Removal revokes every channel (closes both reviews' M1, review B Md4)

| Channel | Closed by |
|---|---|
| every row on every brand of the account, any `grant_source` (`account`, `primary`, `backfill`, `direct`) | `account_remove_member` |
| default-brand disjunct (RLS and `assertClientAccess`), until P4 | the permanent login ban and `requireAuth`'s `banned_until` refusal (4.6); RLS with an old token for at most the JWT expiry; gone for good at P4 |
| API keys the user minted on the account's brands | `revoked_at` set in the same function |
| OAuth grants on those brands | revoked in the same function |
| OAuth codes issued before the removal and not yet exchanged | marked used in the same function, so the exchange at `oauth-token.js:97-100` finds no row (re-review 3 N3-Md1) |
| open invite links (`client_invite_links`) | revoked in the same function, so `invite-redeem.js` refuses them (re-review 3 N3-L3) |
| `provision-account.js` rewriting the default brand | its `banned_until` refusal (ledger row 31) |
| keys an ADMIN minted for the brand | not touched; admin keys are admin business |
| any key whose creator has lost access by another route | `resolveKey` re-check, below |

**P1 change to `resolveKey`** (`mcp-server.js:1107-1145`, ledger row 30): after
the existing checks, when `row.created_by` is not null, the key is dead unless
the creator is not banned and is a platform admin or passes INVARIANT M for
`row.client_id` (one auth admin read and one service-key read of
`user_profiles` and `user_clients`, the same shape as the
OAuth path's `userStillMapped`, `oauth-token.js:82-86`). A read error is a dead
key, never a live one. Keys with `created_by` null keep today's behaviour, so no
existing key breaks on deploy day; the build review lists how many such keys
exist. The revocation at removal stays: it makes the key visibly revoked in the
brand's key list instead of silently dead.

### 9.4 Invitations

`invite-redeem.js:178-179` stays: every invite is for a login whose default
brand is the link's brand, which holds for staff (home brand) and guests (their
brand). Adding an existing login to more brands is a membership write, never an
invite.

### 9.5 `delete-client.js` (ledger row 29, closes review A F-M3, review B Md5, re-review N-Md2)

P1 change. **Every refusal runs before the first destructive step** (today the
function deletes auth users at `:76-84`, profiles at `:90` and child rows at
`:95-98` before the client row at `:102`, so a late refusal would leave a
half-deleted brand). Refuse with 409, naming the logins, when:

1. the brand is the home brand of an agency account (the database refuses too,
   through `agency_has_home`, but only as a backstop; deleting an agency
   account is out of scope, section 17);
2. a login whose default brand is this brand is a member of an agency account,
   or of a direct account that holds other brands;
3. a login whose default brand is this brand holds a `user_clients` row on any
   other brand.

An ordinary direct customer (one brand, its logins owners of that brand's own
direct account and nothing else) passes all three, so deleting a customer
works as today (re-review N-Md2). An agency client brand with only guests on it
passes too: its guests are deleted with it, which is the intended end of a
guest. No account cleanup code is added here: deleting the client row fires
`cleanup_empty_account()` (4.3), which removes a direct account left empty.
Same 409 shape as `:69-71`.

### 9.6 Notices on agency brands (closes review B Md6, review A F-L5)

`set-client-plan.js` (`:196-218`): when the brand's account is an agency,
skip the `client_notifications` row and send the plan email to the account's
owners instead of the brand's logins.

`expire-plan-grants.js` (`:219-228`, re-review N-Md5): when a lapsed grant's
brand is in an agency account, skip the `client_notifications` insert ("Your
{plan} package has ended ... returned to the Free plan"). The admin bell row
(`:233-238`) and the admin summary email stay, so the agency's lapse is still
seen by BrandGEO. **If the brand's account kind cannot be read, the customer
notice is skipped and the admin bell row is still written** (fail toward less
disclosure; re-review 3 N3-I4). The plan itself still reverts to Free, as for every lapsed
grant; renewing an agency's brands is a renewal conversation with the agency.

Runbook rule: `plan_grant_note` on an agency brand carries no commercial text
(and 6.1 stops non-admins reading it).

### 9.7 P3, agency self-serve

- `client-members.js` (D1 6.6) for `direct` grants: `invite`/`remove` need an
  admin, the brand's `owner`, or an account `owner`; it may never delete an
  `account` or `primary` row.
- `account-members.js`: account owner only; wraps the same 4.6 functions.
- `create-site.js` (D1 6.7): gated by `brands_allowed`; new brands start on
  Free until the admin sets the sold plan (Q6).

---

## 10. Optional: the cross-brand summary page (P3)

Route `/portfolio`, lazy, nav entry only when `canSwitchClient`. `motion` only
in the page chunk. For each brand, the existing `client_results_latest(p_client_id)`
(SECURITY INVOKER, RLS through `has_client_access`), computed with
`src/lib/metrics.ts`, at most 3 calls in flight, a failed brand shows "Could
not load" in its row. Columns: name, plan, mention rate, average position,
sentiment score, active prompts, last collected. **No budget column on this
page** (review A, F-L8: the RPC carries no cost, and `sum_cost_eur` is not
callable from the browser); budget lives on the Account page through
`account-usage.js` (7.4). Row click switches brand. CSV export. Above 15 brands
a server aggregate is needed; recorded, not designed.

---

## 11. White-label (later)

| Item | What it takes |
|---|---|
| Agency logo and name in the sidebar | `accounts.logo_url`, `display_name`; re-rule INVARIANT A, since a guest would then see the agency's name |
| Branded reports | print stylesheet or server PDF of portfolio and brand pages |
| Custom domain | Netlify alias and TLS per agency, an allowed origin per domain in `_auth.js:21-25`, Supabase redirect URLs per domain |
| Emails from the agency | a verified Resend domain per agency |
| No BrandGEO name anywhere | Supabase templates are global; every template email replaced by a BrandGEO-issued one |

---

## 12. MCP and OAuth

- API keys work per brand from P1 (`client-api-keys.js:101` widens with 5.3)
  and are revoked on removal (9.3).
- OAuth stays bound to the default brand in P1 (`oauth-authorize.js:76-78`,
  `oauth-token.js:85`, `mcp-server.js:1175`). Staff connect to the home brand,
  guests to their brand. A brand picker on consent is later, its own review.

---

## 13. Migration and release order

Rule: **migration first, read back, then push.** Every push on Constantin's go,
`BATCH_PUSH=1`, one Netlify build per release.

| Step | Kind | Content | Read back | Rollback |
|---|---|---|---|---|
| 1 | SQL | `accounts`, `account_members` with RLS and grants (4.7); `clients.account_id` nullable and index; `ensure_client_account`, `set_account_home` and `cleanup_empty_account` triggers; backfill one direct account per client (72, home = the client); backfill `account_members` owners from `user_profiles` for every account (Md2); then `account_id` NOT NULL | 5.5 #3 = 0; 72 accounts, each with a home; members = one per profile; `relrowsecurity`, `relacl` (tables and `accounts_id_seq`), `proacl` against expected strings; **run AFTER the migration commits** (re-review 3 N3-I5), **inside `begin; ... rollback;` as `service_role`, for each of the three 1.5 paths: insert a client with that path's exact column list and assert it gets an account, then `delete` it and assert no `clients` and no `accounts` row is left for it** (re-review N-B1); one more variant inserts a client, a scratch `auth.users` row and its profile, deletes them in the code's own rollback order (`_provision_client.js:426-429`, `stripe-webhook.js:690-692`) and asserts zero `clients`, `accounts`, `account_members`, `user_clients` rows left (N3-I2); **every expected failure runs in its own `DO` block with `EXCEPTION WHEN ...` that asserts the SQLSTATE, so later assertions still run** (N3-L2): set the account of a client the block itself just inserted (no child rows) to `agency` and assert deleting it raises `check_violation` (23514); assert an insert naming `account_id` raises `account_id_on_insert` | drop NOT NULL, drop triggers, drop column, drop tables |
| 2 | SQL | `user_clients` columns; revoke its DML from `anon`, `authenticated`; backfill one row per profile (`'owner'`, `'backfill'`; 36 today), written as `insert ... select ... on conflict do nothing` over ALL profiles, and the step 1 `account_members` backfill re-run the same way; `sync_primary_membership` (INSERT only); `is_account_member`, `brand_account_kind`, `account_reconcile` and every 4.6 function; grants | 5.5 #1, #2, #4 = 0; all three 4.4 checks = 0; `proacl` of every function | drop functions and trigger; `delete from user_clients where grant_source = 'backfill'`. **Invalid after step 8** (it would lock every pre-existing customer out) |
| 3 | SQL | Group B (35 mechanical + `oauth_grants_select` as in 5.4); `ticket_client_id` search_path; `client_events_type_check` rewritten with all 11 current values verbatim plus `account_change`; `client_invite_links_source_check` rewritten with its 3 current values (`onboard-client`, `explee-import`, `resend-invite`) verbatim plus `agency-admin` | `pg_policies`: 0 mention `get_my_client_id`/`my_client_id`; 51 mention `has_client_access`; constraint text compared | re-create the 36 from the old text saved in the migration file; restore the constraint |
| 4 | push P1 | `assertClientAccess`, the `banned_until` refusal in `requireAuth`, and ledger rows 1 to 10, 21, 22, 29, 30, 31; `agency-admin.js`; `set-client-plan.js` and `expire-plan-grants.js` notice routing; `ClientCtx` fields; switcher; agency billing guards in `Account.tsx`; watchdog checks (8, guard 3; the three 4.4 checks) | health `commit`; new function 401 unauthenticated; V1 to V23 | revert the commit. **After step 5: first `detach_brand` every attached brand, then `revert_agency_to_direct` on every agency account, then revert.** The second call is why the rollback is safe: the reverted `delete-client.js` has no 9.5 refusal, so an agency account left behind would make deleting its home brand fail at `agency_has_home` only after logins and history were already deleted (re-review 3 N3-Md2). Returning the account to direct leaves data in the shape the reverted code was written for, for every later admin action and not only deletes, and asks no one to keep part of a reverted release alive; keeping the 9.5 refusal as an unreverted commit was the alternative and was not chosen for that reason. Do not run `remove_member` in a rollback: it refuses the last owner and bans logins for no reason, and detaching returns every login to rows on its own default brand only, which the reverted equality code serves consistently (re-review N-Md4) |
| 5 | data | the first agency: `convert`, staff, `attach_brand` | all three 4.4 checks = 0; V11 query = 0 | `detach_brand` per brand; `remove_member` only for a person who should lose access |
| 6 | SQL then push P2 | override columns; `enforce_prompt_cap` rewrite; `sum_cost_eur_account`; then `_auth.js` limits, `PLAN_SITES` and mirror test, `account-usage.js` | prompt cap fixtures; one-brand accounts unchanged; Growth plus Essentials fixture 53 prompts and EUR 59.70 | `create or replace` with the saved bodies |
| 7 | push P3 | `client-members.js`, `account-members.js`, `create-site.js`, optional `/portfolio` | | revert |
| 8 | SQL then push P4 | drop disjunct (c) from `has_client_access` and `assertClientAccess` in one release | V2 | restore the old body (1.1) |

**Steps 1 and 2 ship as ONE migration file, applied in one transaction and read
back in order** (re-review N-L2), so no signup can land between the account
backfill and the membership trigger. Both backfills are idempotent, and the file
uses `create table if not exists`, `add column if not exists`, `create or
replace function` and `drop trigger if exists` before each `create trigger`,
so a re-run is harmless (re-review 3 N3-I5).

**Default ordering with Q11 unanswered: step 6 runs before step 5.**

**Order trap:** step 5 must not precede step 3. With agency rows present and
Group B on equality, a member sees brand B's AI results (Group A) but empty SEO,
fix, notification and collection-job data (Group B).

**Do not hand-insert `user_clients` rows** at any point. Before step 4 the
brand would display while every function answers 403; after it, a hand row is
invisible to `account_reconcile` and to the account UI.

---

## 14. Paths that must not change

| Path | Why |
|---|---|
| `netlify/functions/stripe-webhook.js` (every handler) | billing; agency brands stay off Stripe (8) |
| `netlify/functions/_plans.js`, `PLAN_ORDER` at `_plans.js:30` | drift-prone mirror; no plan added |
| `PLAN_ORDER` at `planConfig.ts:399` | rank is load bearing; read, never edited |
| `netlify/functions/_cost.js` | the enforcing copy of the ladder; read only |
| Existing `PLAN_PROMPTS`, `PLAN_LOCATION_LIMIT`, `PLAN_COLLECTION_COOLDOWN_HOURS` values | no ladder change; `PLAN_SITES` is added beside them |
| `has_client_access(integer)` name and signature | 15 policies (51 after step 3) and `client_results_latest` |
| `user_profiles.role` values | every admin gate |
| `invite-redeem.js`, Supabase email templates, `INVITE_*` kill switches | 9.4 |
| `enforce_prompt_location()`, `client_locations` | locations stay per brand |
| `client_results_latest` | read as is |
| `_provision_client.js` | the 4.3 trigger fills `account_id`; no edit needed |
| `provision-account.js` beyond one check | the 4.3 trigger fills `account_id`; the ONLY edit is the `banned_until` refusal after `auth.getUser` (ledger row 31). Amended in revision 4 (re-review 3 N3-L3) |
| Admin switcher, `Layout.tsx:1060-1194` | admins keep categories |
| Shared component props (`BrandLogo`, `Combobox`, `Card`, `SegmentedControl`) | Phase 3 to 5 guardrail |
| `social-*.js` | admin path, unchanged (1.1) |

---

## 15. Acceptance criteria for `bg-verify`

Re-review now; build review per phase.

- **V1 static.** Rows 1 to 10, 21, 22 call `assertClientAccess` or
  `requireAuth({ clientId })`; no request-supplied id is compared to
  `profile.client_id` outside rows 11 to 20 and 23 to 28.
- **V2 static, P4.** For BRAND access (`assertClientAccess`, `has_client_access`,
  every Group A and B policy), neither `profile.client_id` nor
  `get_my_client_id` appears; rows 24 to 28 are excluded by design (review B,
  L4). `account_id` and `account_members` appear in no brand access branch.
- **V3 positive.** A staff member with rows on brands A and B gets 200 from each
  P1 endpoint for B.
- **V4 grouping.** The same user gets 403 and empty RLS reads for brand C in
  the same account without a row on C.
- **V5 guest isolation.** A guest on one agency brand: no switcher, 0 rows from
  `accounts` and `account_members`, no `/portfolio`, `plan_grant_note` absent
  from their client read, role `member`.
- **V6 no widening.** 5.5 #1 to #4 = 0 after step 2; an existing single-brand
  viewer's responses for their own brand are unchanged and other brands answer
  403.
- **V7 fail closed.** Membership read forced to error: 403, default brand only.
- **V8 view as user.** A real admin in "View as user" sees no customer switcher.
- **V9 switch hygiene.** No brand A data under brand B after a switch,
  including mid-collection and with a location filter on A (browser).
- **V10 fan-out.** All three 4.4 checks = 0 after every `agency-admin` action and
  after a forced failure mid-action; concurrent `attach_brand` and
  `remove_member` on one account, and a login created on a brand while it is
  being attached, leave all three checks at 0.
- **V11 billing guard.** The section 8 query = 0, and the watchdog raises a
  finding when a test row violates it (inside a rolled-back transaction).
- **V12 layout.** Entry chunk grows under 1,000 bytes; no `motion` in what
  `Layout` imports; no sideways scroll at 390 and 1440 with 12 brands.
- **V13 removal.** After `remove_member`, including for a login that predates
  step 2 and was confirmed into the account by `convert`, the user holds no
  `user_clients` row on any brand of the account, the ban reads 876000h, every
  Netlify function answers 401 at once (`banned_until`), sign-in and refresh
  fail, and once the JWT expiry has passed RLS is empty on every brand of the
  account, including the home brand. "Every Netlify function" means every
  function that calls `requireAuth`, plus `provision-account.js` (ledger row
  31); public functions take no session. A pending invite link of the removed
  user is refused by `invite-redeem.js`. Measure at build whether Supabase
  itself rejects the banned user's live token in `auth.getUser` and a banned
  user's `verifyOtp`, and record both; the spec does not depend on either.
- **V14 credentials.** Keys the removed user minted on the account's brands
  answer as revoked at the MCP endpoint; their OAuth grants are dead; a key
  whose creator's `user_clients` row was deleted by any other route is
  refused by `resolveKey`; a key with `created_by` null still works; an OAuth
  code issued before `remove_member` cannot be exchanged after it.
- **V15 inserts.** After step 1, self-serve signup, Onboard and the webhook's
  no-login checkout branch each create a client with an account, and each of
  their rollbacks (insert then delete) leaves no `clients` and no `accounts`
  row (the rolled-back read-back plus one real signup on a test address after
  the push).
- **V16 delete.** `delete-client.js` deletes an ordinary direct customer's
  brand as today and leaves no `accounts` row behind; answers 409, before any
  destructive step, for an agency home brand, for a brand whose logins belong
  to an agency account or a multi-brand direct account, and for a brand whose
  logins hold rows on another brand; deletes an agency client brand with its
  guests. After a step 4 rollback (detach, `revert_agency_to_direct`,
  revert), deleting the former agency's home brand with the reverted
  `delete-client.js` succeeds completely.
- **V17 notices.** A plan change on an agency brand writes no
  `client_notifications` row and emails only account owners; a lapsed grant on
  an agency brand writes no `client_notifications` row and still writes the
  admin bell row.
- **V18 dashboard billing.** On an agency brand, and while the brand's kind is
  unknown or failed to load, the Account page shows no Upgrade, no Billing
  portal, no checkout link.
- **V19 grants.** `relrowsecurity` true on both new tables; `anon` and
  `authenticated` hold no write grant on `accounts`, `account_members`,
  `user_clients`; every 4.6 function is executable by `service_role` only.
- **V20 attach safety.** `attach_brand` refuses a research brand and a brand
  with unconfirmed users.
- **V21 P2 messages.** A guest blocked by the account budget or prompt cap
  receives no number in the response body or the exception text.
- **V22 attach roles.** After `attach_brand`, the brand's former customer
  holds role `member` and source `primary` on it, is in no account, and a P3
  `client-members.js` call from them is refused; `detach_brand` makes them
  owner again.
- **V23 convert.** `convert` refuses while any login on the brand is
  unconfirmed; after it, no `backfill` row remains on the home brand.

---

## 16. Open questions for Constantin, each with a default

| # | Question | Default if silent |
|---|---|---|
| Q1 | Agencies need more brands than the allowance gives (growth 2, growth_pro 3, managed 10; the home brand counts). Keep the ladder, or add an agency allowance? | Keep the ladder; agencies above 3 brands are sold Managed or Enterprise by hand. No new tier (R1). |
| Q2 | The SUM pool lets one brand, or a guest on one brand, drain the agency's whole budget. Per-brand floor for agency accounts? | No floor in P2 (ruling 3a); account usage shows per-brand use; revisit on the first complaint. |
| Q3 | May one login belong to two accounts? | No. One account per user; a second account means a second login. |
| Q4 | Read-only role for an agency's end customer? | Not in P1 to P3; a guest is a full member of their one brand. |
| Q5 | How does the admin create a client brand without a login? | A "no login yet" option on the Onboard wizard, then `attach_brand`. |
| Q6 | Billing for brands an agency adds itself in P3? | Free until the admin sets the sold plan; invoiced monthly. |
| Q7 | Later self-serve agency billing: one Stripe Customer per account (reverses D1 R5)? | Yes when built, own spec and Opus billing review, after three hand-invoiced agencies. |
| Q8 | Portfolio page in P3? | Yes; no server code needed. |
| Q9 | Staff seat limit? | None in P1 to P3. |
| Q10 | White-label for the first agency? | None. |
| **Q11** | May agency brands be attached (step 5) before account-level limits (P2) ship, selling per-brand limits for now? The ruling makes account-level SUM part of this build. | **No: P2 ships before step 5.** |
| **Q12** | A removed staff member or guest: ban the login (reversible, keeps the audit trail) or delete it? | **Ban.** Deletion stays a separate admin action. |

Q11 is a product decision on a ruled matter, so it goes to Constantin through
`/escalate`, not to an agent.

**RULED 2026-11-16, Constantin: "Yes, defaults and commit".** Q11: No, P2
(account-level limits) ships before step 5 (attaching agency brands). Q12:
Ban the removed login; deletion stays a separate admin action. Do not
re-argue. Q1 to Q10 are ruled in the paragraph below.

**RULED 2026-11-16, Constantin, in the spec session: "Q11 no, Q12 ban, go with
the defaults".** This confirms Q11 and Q12 as above and adopts the default of
every other question, Q1 to Q10, as the ruling. Every row of the table above
is now decided as its right-hand column states.

---

## 17. Not in this spec

Moving a brand between two agency accounts (detach then attach is the path);
deleting an account; read-only roles; consolidating `is_admin()` and
`my_role()`; the duplicate SELECT policy pairs on `ai_results`, `competitors`,
`prompts`; the SerpApi pool; renaming `plan_prompt_caps`; the TalentWeLove
tables sharing the database. Pre-existing and noted only: two users on one
browser share a prompt sort choice (`promptPerformance.ts:89`);
`platform-activity.js:209-218` and `resend-invite.js:249-287` count a login
under its default brand only, so agency staff appear under the home brand.

---

## 18. Departures from D1, stated

| D1 | This spec | Why |
|---|---|---|
| `accounts.owner_user_id`, `my_account_id()` from the default brand | `account_members` with roles, `is_account_member()` | INVARIANT A; staff |
| MAX pool (8.2 to 8.4) | SUM pool, MAX brand allowance | Decision 3, ruled |
| One Stripe Customer per site, webhook change (10.3) | hand invoicing, webhook untouched, dashboard guards and an alert | no billing edit in release 1 |
| `sync_primary_membership` on INSERT and UPDATE, always `owner` | INSERT only, `member` on agency brands | guests must not own brands |
| Step order: permissive `_auth.js` (4) before RLS Group B (7), limits (6) before the write path (9) | RLS first (3), limits before the first agency (6 before 5 by default) | no rows exist before step 5, so RLS first is neutral; review B, L9 |
| D1 step 2 sets `account_id` NOT NULL with no creation path | insert triggers fill it | the blocker both reviews found also sits in D1 |

---

## 19. Handoff

- `bg-verify` (Opus): design reviews done (three). At the build review, check
  the revision 4 closures in section 20.2 against the code.
- Constantin: Q11 and Q12 (and the rest if he wants other than the defaults).
- Then `bg-backend` (Opus, auth and RLS): steps 1 to 3 as migration files in
  `db/`, applied by Constantin and read back; then the P1 function half.
- `bg-app` (Sonnet): `clientContext.tsx`, the switcher, `Account.tsx` guards,
  after `bg-design` places the admin panel and the switcher list.
- `bg-copy`: switcher, admin panel, "contact us" line, guest-facing limit
  sentences.

---

## 20. Changelog: every finding of both reviews

| Finding | Severity | Closed by |
|---|---|---|
| A F-B1 / B B1: NOT NULL `account_id` breaks inserts | BLOCKER | 1.5, 4.3 triggers, step 1 rolled-back insert read-back, V15 |
| A F-M1 / B M1: default brand and credentials survive removal | MAJOR | 4.1 default brand by kind, home brand, 4.6 remove functions (default-brand row, keys, OAuth grants) and ban, `resolveKey` creator re-check in P1 (ledger row 30), 9.3, V13, V14, Q12 |
| A F-M2 / B Md8: fan-out not atomic, races, stale rows invisible | MAJOR / MEDIUM | 4.4 single reconcile, 4.6 locked functions, reverse check query, ON CONFLICT rule, V10 |
| A F-M3 / B Md5: `delete-client.js` deletes staff | MAJOR / MEDIUM | ledger row 29, 9.5, V16 |
| A F-M4 / B Md7: P2 messages leak pooled numbers | MAJOR / MEDIUM | 7.4 message rules, V21 |
| B M2 / A F-Md2: guests become owners; trigger fires on update | MAJOR / MEDIUM | 4.5 INSERT only, `member` on agency brands, 4.2 owner limits, `repoint_default_brand` |
| B M3 / A F-Md1: release 1 reaches the webhook | MAJOR / MEDIUM | section 8 guards 1 to 3, `brand_account_kind`, V11, V18 |
| B M4 / A F-I1, F-L4: no RLS or grants on new objects | MAJOR | 4.7 written out, V19 |
| B Md1: per-brand P1 is not the ruled product; inert overrides | MEDIUM | 7.3, Q11 (default P2 first), overrides moved to P2 |
| B Md2: `account_members` backfill unspecified | MEDIUM | step 1 backfills owners; `convert_to_agency` converts the lead's own account |
| B Md3: `attach_brand` guard guards nothing | MEDIUM | 4.6 refusals, 9.2, two-call confirm, V20 |
| B Md4: keys and grants survive removal | MEDIUM | 9.3, V14 |
| B Md6 / A F-L5: plan notices and grant note reach the guest | MEDIUM / LOW | 9.6, 6.1 select, V17 |
| A F-Md3: no way to create staff without a stray brand | MEDIUM | 9.1 `create_staff_login`, `convert` |
| A F-Md4 / B L6: step 4 rollback after step 5 | MEDIUM / LOW | step 4 rollback text |
| B L1: `oauth_grants_select` is per user | LOW | 5.4 exception |
| A F-L1 / B L2: rows 11 to 20 admin only; summary count | LOW | 1.1 dispositions, section 0 count |
| A F-L2: budget checked at enqueue only | LOW | 1.3, 7.3 wording |
| A F-L3 / B L3: 36 vs 37 research | LOW | 4.3 |
| B L4: V2 unsatisfiable | LOW | V2 scoped to brand access |
| B L5: `backfill` meant two things | LOW | 4.2 `primary` value; step 2 rollback note |
| B L7: stale owner on re-point | LOW | 4.5 INSERT only, `repoint_default_brand` |
| B L8: guest drains the pool | LOW | 7.4, Q2 |
| B L9: step order vs D1 unstated | LOW | section 18 |
| A F-L6: `client_events` constraint values | LOW | step 3 |
| A F-L7 / B L10: `ticket_client_id` search_path | LOW | 5.4, step 3 |
| A F-L8: portfolio budget needs a server read | LOW | section 10 drops it; 7.4 `account-usage.js` |
| B I3 / A F-L4: unqualified `id` in policy | INFO / LOW | 5.2 qualified |
| A F-I2: guest sees `account_id` | INFO | 5.2, stated deliberate |
| A F-I3: `isRealAdmin` comment, stale "Compare" comment | INFO | 6.1 |
| A F-I4, F-I5: default-brand counting, shared sort key | INFO | section 17 |
| B I6: `user_clients` DML grants | INFO | 4.7 revoke |
| A F-I6, B I1, I2, I4, I5, I7, A section 4 | INFO | no change needed; accessibility items in 6.2 |

### 20.1 Re-review of revision 2

| Finding | Severity | Closed by |
|---|---|---|
| N-B1: `home_client_id ... on delete restrict` makes every client undeletable; rollbacks in three insert paths fail, the webhook multiplies orphan paid clients, `delete-client.js` half-deletes | BLOCKER | 4.3 `on delete set null` (an agency home brand is still refused by `agency_has_home`), `cleanup_empty_account()` AFTER DELETE trigger, step 1 insert-then-delete read-back for all three paths, V15, V16. `stripe-webhook.js` unedited |
| N-Md1: a pre-existing login keeps its `backfill` row on the home brand; ban duration unstated | MEDIUM | 4.2 remove functions delete every source; `convert_to_agency` and `account_attach_brand` rewrite `backfill` to `primary`; third 4.4 check (stray rows); ban fixed at 876000h; `requireAuth` refuses `banned_until`; V13 |
| N-Md2: 9.5 refusal blocks every customer delete | MEDIUM | 9.5 three narrowed conditions, all before any destructive step; V16 |
| N-Md3: an attached brand's former customer stays `owner` | MEDIUM | 4.6 `account_attach_brand` sets confirmed users to `member`/`primary` and removes them from the old direct account; detach reverses it; V22 |
| N-Md4: step 4 rollback runbook cannot complete | MEDIUM | 13 step 4: detach every attached brand, then revert; no `remove_member` |
| N-Md5: grant lapse notice reaches the end customer | MEDIUM | 9.6 `expire-plan-grants.js` skips the notification on agency brands; 1.6; step 4 file list; V17 |
| N-L1: attach and the profile trigger race | LOW | 4.4 lock order (both accounts, ascending), 4.5 trigger takes the brand's account lock; V10 |
| N-L2: window between steps 1 and 2 | LOW | 13: steps 1 and 2 are one migration file in one transaction; idempotent backfills over all profiles |
| N-L3: staff creation not atomic | LOW | 4.6 `account_create_staff_profile`; 9.1 deletes the auth user if the SQL call fails |
| N-L4: billing shows on a kind read error | LOW | 6.1 `'unknown'` state; 8 guard 1 hides billing unless kind is `direct`; V18 |
| N-L5: `direct` rows outlive staff removal | LOW | 4.6 `account_remove_member` deletes every source |
| N-L6: `convert` promotes logins unconfirmed | LOW | 4.6 `p_confirm_user_ids`, 9.1 preview and confirm; V23 |
| N-I1: insert with a caller-supplied `account_id` bypasses attach guards | INFO | 4.3 BEFORE trigger refuses it |
| N-I2: `accounts_id_seq` default grants | INFO | 4.7 revoke and `relacl` read-back |
| N-I3: `enforce_prompt_cap` search_path and EXECUTE (pre-existing) | INFO | 4.7, fixed in P2's rewrite |
| N-I4, N-I6, N-I7 | INFO | confirmations, no change |
| N-I5: `archived` and `test` categories do not exist live | INFO | kept in the refusal list; harmless |

PARTIAL items of the earlier reviews, now:

| Earlier finding | Re-review status | Revision 3 |
|---|---|---|
| A F-B1 / B B1 | PARTIAL (delete half) | closed by N-B1's fix |
| A F-M1 / B M1 | PARTIAL (`backfill` row, ban duration) | closed by N-Md1's fix |
| A F-M3 / B Md5 | PARTIAL (refusal too wide; delete could not succeed) | closed by N-Md2's and N-B1's fixes |
| A F-Md2 / B M2 | PARTIAL (attached customer stays owner) | closed by N-Md3's fix |
| A F-Md4 / B L6 | PARTIAL (runbook) | closed by N-Md4's fix |
| B Md6 / A F-L5 | PARTIAL (`expire-plan-grants.js`) | closed by N-Md5's fix |

### 20.2 Third review (of revision 3)

| Finding | Severity | Closed by |
|---|---|---|
| N3-Md1: an OAuth code issued before removal mints a fresh grant after it | MEDIUM | 4.6 remove functions mark every unused `oauth_codes` row of the user used; 9.3 row; V14. Re-closes A F-M1 and B M1 |
| N3-Md2: after the step 4 rollback an agency account remains and the reverted `delete-client.js` half-deletes its home brand | MEDIUM | chose option (a): new 4.6 `revert_agency_to_direct`, run in the step 4 rollback after detaching; reason stated in 13; V16 |
| N3-L1: "brand is a home brand" refuses every attach | LOW | 4.6 and 9.2 read "the home brand of an agency account" |
| N3-L2: fragile 23514 read-back | LOW | 13 step 1: uses the client the block inserted; each expected failure in its own `DO` block asserting the SQLSTATE |
| N3-L3: `provision-account.js` and `invite-redeem.js` outside the ban | LOW | remove functions revoke open `client_invite_links` (reason `'revoked'`); chose to ADD the `banned_until` refusal to `provision-account.js` (ledger row 31, section 14 amended) rather than narrow V13; V13 scoped to `requireAuth` callers plus row 31, with `getUser` and `verifyOtp` behaviour measured at build |
| N3-I1: cleanup branch order sensitivity | INFO | 4.3: reassign when home is null or equals `OLD.id` |
| N3-I2: read-back misses a rollback after a profile insert | INFO | 13 step 1 variant with a scratch auth user and profile |
| N3-I3: `create_staff_login` auth user deletion | INFO | 9.1 ownership test; email after commit; new invite link source `agency-admin` in step 3 |
| N3-I4: notice fail direction | INFO | 9.6 skip the customer notice on a kind read error, keep the admin bell |
| N3-I5: read-back placement; re-run safety of DDL | INFO | 13: read-back after commit; `if not exists`, `create or replace`, `drop trigger if exists` |
| N3-I6: admins see no Upgrade | INFO | 8 guard 1: stated as intended |
