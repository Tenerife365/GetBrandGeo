# Multi-site tenancy: one login, many sites (ROADMAP D1)

Written 2026-07-31 by `bg-architect`. Revised the same day to fold in
Constantin's rulings on site allowances, shared limits, cross-tier sites and the
upsell nudge. Binding on `bg-backend` and `bg-app`.

`bg-verify` reviews the authorization boundary (§4) **before any build**, per
ROADMAP D1's own sequencing and AGENT-OS §6: this is auth. It reviews §8 and §9
before any build too, because those are billing.

The ask, Constantin 2026-07-31: clients and agencies with several websites or
products need ONE login with a dashboard per site, not one login per site. Each
site carries its own plan and its own subscription.

Every claim about current behaviour carries a `path:line` or a production query.
Nothing here is from `CLAUDE.md`, which is documented as drifting.

---

## 1. Current state, verified

### 1.1 Half of D1 is already built, deployed, and has never held a row

The roadmap item says user-to-client "becomes" many-to-many. **It already is, in
the database.** What is missing is the write path and the server-side gate.

Queried against production (`duiyifepitvugyulobqm`) 2026-07-31, read-only:

| Fact | Value |
|---|---|
| `public.user_clients` exists | yes |
| its shape | `user_id uuid NOT NULL`, `client_id integer NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()` |
| primary key | `user_clients_pkey PRIMARY KEY (user_id, client_id)` |
| foreign keys | `user_id → auth.users(id) ON DELETE CASCADE`, `client_id → clients(id) ON DELETE CASCADE` |
| rows | **0** |
| RLS policies on it | exactly one: `user_clients_own_read` SELECT, `((user_id = auth.uid()) OR is_admin())` |
| INSERT / UPDATE / DELETE policies | **none** — deny-all to `authenticated`, `service_role` bypasses |

The membership predicate already exists as a database function:

```sql
CREATE OR REPLACE FUNCTION public.has_client_access(cid integer)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select cid = public.get_my_client_id()
      or exists (
        select 1 from public.user_clients uc
        where uc.user_id = auth.uid() and uc.client_id = cid
      );
$function$
```

It is referenced by **15 live RLS policies** (§5, Group A), including every
policy on `ai_results`, `prompts`, `competitors` and `clients` itself.

So the most sensitive tables in the product are **already membership-aware and
have been for some time**, and the feature has never activated because nothing
writes a row to `user_clients`. Verified: the only reference in
`brandgeo-dashboard/netlify/functions/` is a DELETE (`delete-client.js:98`,
cascade cleanup); the only reference in `src/` is a READ
(`clientContext.tsx:174`). No admin UI, no function, no migration in `db/`
inserts one. The table landed in `42b7de6` ("multi-brand switcher"), its cleanup
path in `9ec7458`.

**Consequence:** D1 is materially smaller at the access layer than the roadmap
item assumes. It is finishing a tenancy change that was started, wired into RLS,
and abandoned before the write path. What remains is not "make the database
multi-tenant"; it is the Netlify gate, the write path, the UI, and — newly, from
the rulings — the account-level limits of §8.

### 1.2 What is genuinely still single-tenant

| Layer | State | Citation |
|---|---|---|
| Netlify auth gate | single FK equality | `_auth.js:116` `if (String(profile.client_id) !== String(clientId))` |
| 19 inline ownership checks | single FK equality, copy-pasted | §4.1 ledger |
| 31 RLS policies | single FK equality via `get_my_client_id()` / `my_client_id()` | §5, Group B |
| Client switcher UI | gated on `isAdmin`, not on membership count | `Layout.tsx:372` `{isAdmin && clients.length > 0 && (` |
| Stripe checkout resolution | resolves target site via `user_profiles.client_id` | `stripe-webhook.js:273-280` |
| Stripe subscription events | fan out to **every** client sharing a customer id | `stripe-webhook.js:458` + `:469`, `:507` + `:516` |
| Prompt cap | counts per `client_id` | `enforce_prompt_cap()`, §1.4 |
| Monthly EUR budget | sums per `client_id` | `_auth.js:223-239` |

`clientContext.tsx` is **not** in that list. Its frontend half is already
multi-site: `:170-176` reads `user_clients` and unions it with
`profile.client_id`, and `:189` sets `clients` for members with the comment
"members now get their accessible brands". The comment at `:33` calling
`clients[]` "populated for admin only" is **stale** and contradicted 156 lines
below it. The roadmap item inherited that stale comment. Only `Layout.tsx:372`
still hides the switcher.

### 1.3 Production data shape

```
clients                                  36
user_profiles                            10
user_profiles where role = 'admin'        1
user_profiles where client_id is null     0
user_clients rows                         0
distinct users in user_clients            0
clients with stripe_customer_id       **0**
clients with stripe_subscription_id   **0**
```

Two numbers govern the migration.

**`user_profiles.client_id` is non-null for all 10 rows.** A backfill of
`user_clients` from `user_profiles` is total: 10 inserts, no exceptions, and it
is idempotent against the composite PK.

**Zero clients carry a Stripe customer or subscription id.** There is no live
Stripe-to-site binding to migrate. §10's billing ruling is free today and
expensive after the first subscription lands.

### 1.4 The prompt cap IS already enforced server-side, in Postgres, per site

ROADMAP A5 states `PLAN_PROMPTS` "is read at `planConfig.ts:516` for the plan
card and enforced nowhere server-side". **That is refuted.** Production carries:

```
CREATE TRIGGER trg_enforce_prompt_cap BEFORE INSERT OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION enforce_prompt_cap()
```

`enforce_prompt_cap()` is `SECURITY DEFINER`, reads `plan_prompt_caps` keyed by
`clients.plan`, counts `prompts where client_id = new.client_id and is_active`,
and raises `prompt_cap_reached` with `errcode = 'check_violation'`. It falls back
to the **free** cap on an unknown plan, deliberately stricter than `_cost.js`.

Constantin's ruling that `PLAN_PROMPTS` be both enforced and displayed is
therefore already half-satisfied on the enforcement half, by a mechanism nobody
recorded.

**But it counts per `client_id`, which is exactly what Ruling 2 forbids.** This
trigger is the single largest piece of work created by the rulings. §8.3.

Two holes recorded here, both real:

- The trigger returns early for `current_user in ('service_role','postgres')`,
  so every Netlify function that inserts prompts bypasses the cap entirely.
- It is an `is_active` count, so a customer may hold unlimited inactive prompts.
  That is deliberate ("inactive rows cost nothing") and correct.

### 1.5 The plan ladder as shipped, and a drift that changes the ladder work

`planConfig.ts:427`, the shipped constant:

```ts
export const PLAN_PROMPTS: Record<Plan, number> = {
  free: 5, essentials: 15, growth: 35, growth_pro: 35,
  managed: 120, pro: 120, enterprise: 100000,
}
```

`plan_prompt_caps` in production matches it exactly, value for value, verified
2026-07-31: `free 5, essentials 15, growth 35, growth_pro 35, managed 120,
pro 120, enterprise 100000`. Code and database agree.

**Both disagree with the cost model documented directly above the constant.**
`planConfig.ts:400-420` carries a cost table whose prompt column reads
`free 5, essentials 20, growth 50, growth_pro 75, managed 250`, and the prose at
`:404-408` states that a 2026-07-29 pass cut `growth_pro 75 → 70` and
`managed 250 → 230`, then restored both when the budget ceiling moved to 15%.
The restore described in the comment is not present in the constant beneath it.

This is the item ROADMAP already carries as "Three conflicting Growth prompt
counts: 35 shipped, 50 in a planConfig comment, 75 in the pricing doc." It is now
load-bearing for D1, because §9 has to choose a ladder and the modelled one
already exists.

Supporting constants, verified by executing `_cost.js`:

```
PLAN_LIVE_ENGINE_COUNT  free 1, essentials 3, growth 5, growth_pro 7,
                        managed 7, pro 7, enterprise 7
PLAN_MONTHLY_API_BUDGET_EUR
                        free 0.30, essentials 14.85, growth 44.85,
                        growth_pro 67.35, managed 225.00, pro 225.00,
                        enterprise 1500.00
```

Every paid budget is exactly 15% of list price. `pro` is legacy
(`planConfig.ts:28`), unsellable, and budgeted as Managed. The engine count for
growth_pro and up is **7**, not the 6 the cost table was written against — the
table predates the seventh engine.

### 1.6 The authorization surface is 22 places, not one

Only `create-portal-session.js:30` passes `clientId` into `requireAuth`. Nineteen
functions re-implement `String(profile.client_id) !== String(client_id)` inline,
and two more read `profile.client_id` as the implicit target. Full ledger in
§4.1. Nineteen copies of a security check is nineteen places to get it wrong, and
it is why §4.2 collapses them to one call rather than editing each in place.

---

## 2. Constantin's rulings, 2026-07-31

Restated as binding inputs. Everything downstream implements these; none is
re-litigated below.

| # | Ruling |
|---|---|
| R1 | **No agency tier and no multi-account pricing structure.** Websites become an allowance inside the existing ladder: free 1, essentials 2, growth 2, growth_pro 3, managed 10, pro 20, enterprise open. Each site keeps its own plan. |
| R2 | **Limits are SHARED across the allowance, not per site.** Enforced as an account-level sum, where the account is the membership group, not the client row. |
| R3 | **Cross-tier across sites is allowed.** A Growth customer may run a smaller second site on Essentials. |
| R4 | **Upsell nudge, never a gate.** Adding a site at a lower tier shows a recommendation; the lower tier stays choosable in one click. |
| R5 | **Roll-up deferred to D2. One Stripe Customer per site.** Both as recommended. |

R2 is the ruling with teeth, and §8 exists because per-site is the **default**
behaviour: `PLAN_MONTHLY_API_BUDGET_EUR` is per client in `_cost.js` and
`enforce_prompt_cap()` counts per `client_id`. Both silently become "per site"
the moment D1 ships. A builder who changes nothing gets the wrong answer.

---

## 3. The boundary decision

### 3.1 Ruling

**Keep `user_clients` as the membership table and add a role column. Keep
`user_profiles.client_id` as a denormalised default site, bound by a database
invariant. Introduce an `accounts` entity purely as a limits-and-billing
grouping, with `clients.account_id`. Move every authorization predicate from FK
equality to `has_client_access()`. `account_id` never authorizes anything.**

Reasoning, one line each:

- A new membership table would orphan a `SECURITY DEFINER` function and 15
  working RLS policies that already reference the existing one.
- Dropping `user_profiles.client_id` would touch ~30 policies and 22 call sites
  in one irreversible step, which is the shape of change this project has
  already been burned by.
- A shared limit needs a shared owner, and there is no deterministic way to
  compute one from memberships alone (§3.2), so the account must be an explicit
  row.

### 3.2 Why an `accounts` row is now unavoidable

The first version of this document refused an organisation entity, on the
grounds that two nullable columns and one existing table covered every case
described. **R2 invalidates that refusal and it is reversed here explicitly**, so
nobody reads the old reasoning as still standing.

R2 requires summing consumption across "the account". Without an account row, the
only candidate definition is *the set of sites reachable by one user*. That
definition is not usable, for a reason that is arithmetic rather than aesthetic:

> Let user U be a member of sites A and B, and user V a member of sites B and C.
> Under the membership-derived definition, B's remaining budget is one number
> when U asks and a different number when V asks. The limit is not a property of
> the sites being limited.

A shared limit must be a property of the thing sharing it. That thing is a row.

**Access and grouping stay separate mechanisms.** `user_clients` decides who may
reach a site. `clients.account_id` decides which sites pool their limits. They
are never merged, and `account_id` is never read by an authorization predicate.
If it were, adding a site to an account would silently grant every account member
access to it, creating a second access path that INVARIANT M (§4.3) does not
cover. The site-add flow writes **both** rows explicitly instead.

### 3.3 Roles

Three role axes, deliberately separate:

- `user_profiles.role` — the **platform** role, `admin | viewer`. `admin` means
  BrandGEO staff and continues to mean "any client". Never becomes per-site.
- `user_clients.role` — the **per-site** role, `owner | member`. `owner` may
  manage that site's billing and its membership list; `member` has full product
  read and write, no billing, no membership management.
- `accounts.owner_user_id` — the **account** owner, the one user who may add a
  site, change the account's plan mix, or see account-level consumption.

`user_clients.role` is **not** consulted by INVARIANT M. Membership decides
*whether*; role decides *what*. Conflating them is how a read gate becomes a
write gate by accident.

---

## 4. The authorization boundary

### 4.1 The 22 places one decision is made

| File | Line | Shape |
|---|---|---|
| `_auth.js` | 116 | the gate, used by 1 caller |
| `collect-chatgpt.js` | 39 | inline equality |
| `collect-claude.js` | 40 | inline equality |
| `collect-prompt.js` | 58 | inline equality |
| `enqueue-collection.js` | 37 | inline equality |
| `generate-recommendations.js` | 94 | inline equality |
| `seo-audit-page.js` | 85 | inline equality |
| `seo-crawl.js` | 32 | inline equality |
| `seo-draft.js` | 142 | inline equality |
| `seo-opportunities.js` | 36 | inline equality |
| `social-accounts.js` | 21 | inline equality |
| `social-boost.js` | 42 | inline equality |
| `social-brandkit.js` | 120 | inline equality |
| `social-delete.js` | 39 | inline equality |
| `social-generate.js` | 179 | inline equality |
| `social-image.js` | 51 | inline equality |
| `social-link.js` | 26 | inline equality |
| `social-publish.js` | 87 | inline equality |
| `social-queue.js` | 34 | inline equality |
| `social-status.js` | 22 | inline equality |
| `create-portal-session.js` | 37 | `clientId ?? auth.profile.client_id` fallback |
| `suggest-prompts.js` | 105 | `auth.profile.client_id` as implicit target |
| `support-request.js` | 120 | `auth.profile.client_id` as implicit target |

### 4.2 The single predicate

`_auth.js` gains one exported function. This is its contract, not its body:

```ts
/**
 * The ONLY membership predicate in the Netlify layer.
 * Returns ok:true iff the authenticated user may act on targetClientId.
 * Throws on any Supabase error — it never returns false-by-error, and it
 * never returns true-by-error.
 */
function assertClientAccess(
  auth: AuthResult,          // the object returned by requireAuth
  targetClientId: number | string,
): Promise<{ ok: true } | { ok: false; response: NetlifyResponse }>
```

All 19 inline checks collapse to one call. `requireAuth`'s existing `clientId`
option is re-implemented on top of it, so `create-portal-session.js` needs no
edit and its behaviour widens automatically.

### 4.3 The invariant a reviewer can test

> **INVARIANT M.** For any request that names a target `clientId`, access is
> granted if and only if
> **(a)** `user_profiles.role = 'admin'` for the authenticated user, **or**
> **(b)** a row exists in `user_clients` with
> `user_id = <authenticated user>` and `client_id = <target>`.
>
> No other predicate grants access. In particular `clients.account_id` grants
> nothing. After migration step 8, `user_profiles.client_id` is **never**
> consulted for an authorization decision anywhere in the product.

Testable three ways, all of which `bg-verify` must run:

1. **Static.** After step 8, `grep -rn "profile.client_id" netlify/functions/`
   returns hits only in `client-users.js` (an admin-only listing query),
   `delete-client.js`, `provision-account.js` and `stripe-webhook.js` (all
   provisioning writes). Zero hits inside a comparison against a request-supplied
   `client_id`. Separately, `grep -rn "account_id"` returns zero hits inside any
   authorization branch.
2. **Dynamic, positive.** A viewer with a membership on site B gets 200 from each
   of the 19 endpoints when passing B, with `user_profiles.client_id` pointing at
   site A.
3. **Dynamic, negative.** The same viewer gets 403 for a site C they hold no
   membership in — **including when C shares an account with B.** This is the
   test that proves grouping did not become access.

### 4.4 How it stays fail-closed

**F1. An error is a denial, never a fallback.** Today `_auth.js:99-107`
destructures `{ data: profile }` and discards the error, so a failed query yields
`profile === null` and a 403. That accident is the correct behaviour and must
become deliberate. The membership query returns 403 on error. It must never
degrade to "the membership table is unreachable, so fall back to
`profile.client_id`". Write the error branch first.

**F2. Absence of a row is a denial.** Zero rows means no access. A
`.maybeSingle()` yielding null must not be read as "unrestricted".

**F3. The permissive OR is temporary and dated.** Migration step 4 deliberately
introduces `profile.client_id === target || membership exists`. That is the
permissive step, and it is what this project's own history prescribes: apply the
permissive change while the old path still works, verify, then close the old
path. Step 8 deletes the first disjunct. Shipping step 4 and never shipping step
8 is not a leak but is a silent failure to migrate; the step-8 grep catches it.

**F4. A limit failure is a denial, not a bypass.** New for R2. If the account
lookup in §8 fails, collection is **blocked**, not allowed. A budget check that
cannot determine the budget must not conclude there is none.

---

## 5. Every RLS policy, enumerated

Queried from `pg_policies` on `duiyifepitvugyulobqm` 2026-07-31. All 77 policies
in `public` are classified. Nothing is left as "update the policies".

### Group A — already membership-aware. NO CHANGE. (15 policies)

| Table | Policy | Cmd | Predicate today |
|---|---|---|---|
| `ai_results` | `ai_results_client_read` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `ai_results` | `ai_results_select` | SELECT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `clients` | `clients_select` | SELECT | `my_role() = 'admin' OR has_client_access(id)` |
| `competitors` | `competitors_client_read` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `competitors` | `competitors_select` | SELECT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `competitors` | `competitors_insert` | INSERT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `competitors` | `competitors_delete` | DELETE | `my_role() = 'admin' OR has_client_access(client_id)` |
| `prompts` | `prompts_client_read` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `prompts` | `prompts_select` | SELECT | `my_role() = 'admin' OR has_client_access(client_id)` |
| `prompts` | `prompts_insert` | INSERT | `is_admin() OR has_client_access(client_id)` |
| `prompts` | `prompts_update` | UPDATE | `is_admin() OR has_client_access(client_id)` |
| `prompts` | `prompts_delete` | DELETE | `is_admin() OR has_client_access(client_id)` |
| `recommendation_runs` | `recommendation_runs_select` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `recommendations` | `recommendations_select` | SELECT | `is_admin() OR has_client_access(client_id)` |
| `recommendations` | `recommendations_update` | UPDATE | `is_admin() OR has_client_access(client_id)` |

**Hazard recorded, not fixed here.** `ai_results`, `competitors` and `prompts`
each carry TWO overlapping SELECT policies, one for `{authenticated}` and one for
`{public}`. Permissive policies OR together — that is the mechanism behind the
nine permissive policies of CLAUDE.md §6.4 step 7. Both members of each pair are
correctly scoped today, so there is no leak. The duplication is still a trap: a
future edit relaxing only one of a pair produces a leak that reads as fixed in
the other. Filed as a separate artifact, §19.

### Group B — equality, MUST CHANGE. (31 policies)

Mechanical substitution in every case:

- `client_id = get_my_client_id()` → `has_client_access(client_id)`
- `client_id = my_client_id()` → `has_client_access(client_id)`
- `ticket_client_id(ticket_id) = get_my_client_id()` → `has_client_access(ticket_client_id(ticket_id))`

| Table | Policy | Cmd | Function used today |
|---|---|---|---|
| `client_notifications` | `client_notifications_select` | SELECT | `get_my_client_id()` |
| `client_notifications` | `client_notifications_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `collection_jobs` | `collection_jobs_select` | SELECT | `my_client_id()` |
| `collection_runs` | `collection_runs_select` | SELECT | `my_client_id()` |
| `seo_briefs` | `seo_briefs_select` | SELECT | `get_my_client_id()` |
| `seo_briefs` | `seo_briefs_insert` | INSERT | `get_my_client_id()` |
| `seo_briefs` | `seo_briefs_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `seo_briefs` | `seo_briefs_delete` | DELETE | `get_my_client_id()` |
| `seo_crawls` | `seo_crawls_select` | SELECT | `get_my_client_id()` |
| `seo_crawls` | `seo_crawls_insert` | INSERT | `get_my_client_id()` |
| `seo_pages` | `seo_pages_select` | SELECT | `get_my_client_id()` |
| `seo_pages` | `seo_pages_insert` | INSERT | `get_my_client_id()` |
| `seo_pages` | `seo_pages_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `seo_pages` | `seo_pages_delete` | DELETE | `get_my_client_id()` |
| `social_accounts` | `social_accounts_select` | SELECT | `get_my_client_id()` |
| `social_accounts` | `social_accounts_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `social_accounts` | `social_accounts_delete` | DELETE | `get_my_client_id()` |
| `social_post_targets` | `social_targets_select` | SELECT | `get_my_client_id()` |
| `social_post_targets` | `social_targets_insert` | INSERT | `get_my_client_id()` |
| `social_post_targets` | `social_targets_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `social_post_targets` | `social_targets_delete` | DELETE | `get_my_client_id()` |
| `social_posts` | `social_posts_select` | SELECT | `get_my_client_id()` |
| `social_posts` | `social_posts_insert` | INSERT | `get_my_client_id()` |
| `social_posts` | `social_posts_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `social_posts` | `social_posts_delete` | DELETE | `get_my_client_id()` |
| `social_profiles` | `social_profiles_select` | SELECT | `get_my_client_id()` |
| `social_profiles` | `social_profiles_update` | UPDATE (qual + with_check) | `get_my_client_id()` |
| `tickets` | `tickets_select` | SELECT | `get_my_client_id()` |
| `tickets` | `tickets_insert` | INSERT | `get_my_client_id()` (inside a longer conjunction) |
| `ticket_comments` | `ticket_comments_select` | SELECT | `ticket_client_id(ticket_id) = get_my_client_id()` |
| `ticket_comments` | `ticket_comments_insert` | INSERT | `ticket_client_id(ticket_id) = get_my_client_id()` |

`tickets_insert` and both `ticket_comments` policies carry additional
conjunctions (`source = 'customer'`, `created_by = auth.uid()`,
`is_internal = false`, status/priority/assignee pinning). **Substitute the one
disjunct and change nothing else.** Rewriting these from scratch is how a
customer gains the ability to open a ticket pre-assigned and resolved.

### Group C — no client scoping to change. NO CHANGE. (21 policies)

`admin_notifications_select`, `admin_notifications_update`,
`client_events_select`, `promotions_select`, `promotions_insert`,
`promotions_update`, `recommendations_insert`, `recommendations_delete`,
`recommendation_runs_insert`, `social_accounts_insert`,
`social_profiles_insert`, `tickets_update` (all `is_admin()`);
`service_insert_ai_results` (`service_role`); `user_profiles_select_own`,
`profiles_read_own`, `user_clients_own_read` (self-scoped on `auth.uid()`);
`plan_prompt_caps_select`, `contract_templates_are_readable`,
`retention_policies_are_readable` (`true`, reference data).

`user_clients_own_read`'s predicate `((user_id = auth.uid()) OR is_admin())` is
already correct for multi-site and needs no edit. It is why
`clientContext.tsx:174` can read the table with the anon key today.

### Group D — not BrandGEO tables. OUT OF SCOPE. (10 policies)

`subscribers`, `contracts`, `contract_events`, `quotes`, `quote_roles` scope on
`subscribers.owner_user_id` and are driven by `twl_`-prefixed triggers. This is
TalentWeLove schema sharing the BrandGEO Postgres instance. D1 does not touch
them. §20 Q3.

### 5.1 New policies for `accounts`

Two, both minimal:

| Table | Policy | Cmd | Predicate |
|---|---|---|---|
| `accounts` | `accounts_select` | SELECT | `is_admin() OR id = my_account_id()` |
| `accounts` | (none for INSERT/UPDATE/DELETE) | — | deny-all; `service_role` bypasses |

`my_account_id()` is `STABLE SECURITY DEFINER`, returning the account of the
caller's `user_profiles.client_id`. It exists so the frontend can render account
consumption; it is **never** used in an access predicate on any other table.

### 5.2 Optimising `has_client_access` at step 8

After backfill is verified complete, the first disjunct becomes provably
redundant and is removed:

```sql
CREATE OR REPLACE FUNCTION public.has_client_access(cid integer)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.user_clients uc
    where uc.user_id = auth.uid() and uc.client_id = cid
  );
$function$
```

This is the single point at which `user_profiles.client_id` stops being an
authorization input for the entire database layer. One `CREATE OR REPLACE`; its
rollback is the body reproduced verbatim in §1.1.

**Do not perform this replacement before the backfill trigger of step 3 has been
live long enough to have caught every new signup.**

---

## 6. Data contracts

### 6.1 `accounts` — new

```sql
id             serial      primary key
name           text        not null              -- display only, defaults to the first site's name
owner_user_id  uuid        not null references auth.users(id)
created_at     timestamptz not null default now()
```

No plan column. The account's effective plan is **derived**, never stored (§8.2),
because storing it would be a sixth copy of the ladder's authority and would
drift the moment a site's plan changed without the account row being touched.

### 6.2 `clients.account_id` — new column

```sql
account_id  integer  not null references accounts(id) on delete restrict
```

`ON DELETE RESTRICT`, not `CASCADE`: deleting an account must never cascade into
customer data. Deleting customer data is withheld authority (AUTONOMY §2), and a
cascade here would make it a side effect.

Index required: `CREATE INDEX idx_clients_account_id ON clients(account_id)`.
§8.3's rewritten trigger and §8.4's budget check both scan by it, on every prompt
insert and every collection call.

Every site belongs to exactly one account. A site never moves between accounts in
D1; that is §19.

### 6.3 `user_clients` after migration

```sql
-- existing, unchanged
user_id     uuid        not null references auth.users(id) on delete cascade
client_id   integer     not null references clients(id)    on delete cascade
created_at  timestamptz not null default now()
primary key (user_id, client_id)

-- added by D1
role        text        not null default 'member'
                        check (role in ('owner','member'))
created_by  uuid        null references auth.users(id) on delete set null
```

Uniqueness is the composite PK, already present. No second unique constraint is
needed and none should be added: a user holds at most one row per site by
construction, which is the desired rule.

`created_by` is nullable because the 10 backfilled rows have no author. It exists
so a membership granted by an admin is distinguishable from one a site owner
granted, which is the audit question asked after an incident.

### 6.4 `plan_prompt_caps` gains the site allowance

```sql
site_allowance  integer  not null default 1
```

R1's allowance lives in the table that already backs the live cap trigger, not in
a new table. That keeps the database side of the ladder at **one** table, and the
whole ladder at **two** copies (`planConfig.ts` and `plan_prompt_caps`), which is
what it is today. A separate `plan_sites` table would be a third.

The table's name is now slightly wrong — it holds plan limits generally, not just
prompt caps. **Not renamed.** Renaming a live table backing a `SECURITY DEFINER`
trigger during a security migration buys nothing. Filed in §19.

Mirrored in TypeScript as `PLAN_SITES: Record<Plan, number>` alongside
`PLAN_PROMPTS`. Criterion 31 asserts the two agree on both columns for all seven
plans.

### 6.5 The membership invariant, enforced in the database

Trigger `AFTER INSERT OR UPDATE OF client_id ON user_profiles`, function
`sync_primary_membership()`, `SECURITY DEFINER`. Specified behaviour:

> When `NEW.client_id IS NOT NULL`, insert `(NEW.id, NEW.client_id, 'owner')`
> into `user_clients` `ON CONFLICT (user_id, client_id) DO NOTHING`.
> **Never delete.**

Role `'owner'` because a profile's primary client is the site they were
provisioned onto, and the person a site is provisioned for owns it.

Never deleting matters: an admin moving `user_profiles.client_id` from A to B
must not silently revoke access to A. Revocation is an explicit action, never a
side effect of an update.

Covers four existing call sites, none of which change: `stripe-webhook.js:363`,
`stripe-webhook.js:395`, `provision-account.js:181`, and `onboard-client.js`'s
equivalent insert.

### 6.6 `client-members.js` — new function

```ts
// POST /.netlify/functions/client-members
type Request =
  | { action: 'list';   client_id: number }
  | { action: 'invite'; client_id: number; email: string; role: 'owner' | 'member' }
  | { action: 'remove'; client_id: number; user_id: string }

type Member = {
  user_id:         string          // uuid
  email:           string | null   // null when auth.admin cannot resolve it
  role:            'owner' | 'member'
  is_primary:      boolean         // user_profiles.client_id === client_id
  created_at:      string          // ISO 8601
  last_sign_in_at: string | null
}

type Response =
  | { members: Member[] }                       // list
  | { member: Member; invited: boolean }        // invite; invited=true if a new auth user was created
  | { removed: true }                           // remove

type ErrorResponse = { error: string }          // shape already used across the function layer
```

| Code | Condition |
|---|---|
| 200 | success |
| 400 | malformed body, unknown `action`, invalid `role`, malformed email |
| 401 | missing or invalid token (from `requireAuth`) |
| 403 | caller is neither platform admin nor `owner` of `client_id` |
| 404 | `client_id` does not exist |
| 409 | `invite` for a user who already holds a membership on that site |
| 422 | `remove` targeting the last remaining `owner` of a site — refused |
| 500 | Supabase or auth-admin error |

Authorization here is **stricter than INVARIANT M**: membership alone is not
enough. `invite` and `remove` require platform admin OR `user_clients.role =
'owner'` for that exact site. `list` requires membership only.

The 422 rule is load-bearing. Without it an owner can remove themselves and
strand a paying site with no one able to manage it, recoverable only by
Constantin with a service key.

### 6.7 `create-site.js` — new function

The write path R1 and R4 require.

```ts
// POST /.netlify/functions/create-site
type Request = {
  name:          string
  brand_website: string
  plan:          Plan            // the tier chosen for THIS site
  acknowledged_downgrade?: boolean   // set true when the R4 nudge was shown and dismissed
}

type Response = {
  client_id:     number
  account_id:    number
  plan:          Plan
  checkout_url:  string | null   // Stripe Checkout for this site's own subscription
}

type AllowanceError = {
  error:             'site_allowance_reached'
  sites_used:        number
  sites_allowed:     number
  account_plan:      Plan
  upgrade_to:        Plan | null   // lowest plan in PLAN_ORDER with a larger allowance, null at enterprise
  upgrade_allowance: number | null
}
```

| Code | Condition |
|---|---|
| 200 | site created; `checkout_url` present unless `plan === 'free'` |
| 400 | malformed body, unknown plan, missing website |
| 401 | missing or invalid token |
| 403 | caller is not `accounts.owner_user_id` and not a platform admin |
| 409 | `site_allowance_reached` — the body is `AllowanceError` |
| 500 | Supabase or Stripe error |

`acknowledged_downgrade` is **telemetry, not authorization.** The server never
refuses on its absence. It exists so R4's nudge can be measured; a client that
never sends it still succeeds. Stated explicitly because a builder reading "a
flag the client sets" will otherwise reach for a gate.

On success the function writes, in order: the `clients` row with the caller's
`account_id`, then the `user_clients` row for the caller with `role = 'owner'`.
**Both, explicitly** — §3.2's separation means neither implies the other.

### 6.8 Frontend contract

`clientContext.tsx` gains three fields and loses one stale comment:

```ts
interface ClientCtx {
  // ... everything currently there, unchanged ...

  /** Per-site role for the ACTIVE client. 'admin' for platform staff.
   *  null while loading or when the user holds no membership. */
  activeMembershipRole: 'owner' | 'member' | 'admin' | null

  /** True when the user can reach more than one site. Drives the switcher. */
  canSwitchClient: boolean

  /** Account-level allowance and consumption for the ACTIVE client's account.
   *  null while loading, or when the account read failed (see the table below). */
  accountLimits: AccountLimits | null
}

type AccountLimits = {
  account_id:      number
  account_plan:    Plan      // derived: highest-ranked plan across the account's sites
  sites_used:      number
  sites_allowed:   number    // PLAN_SITES[account_plan]
  prompts_used:    number    // active prompts across ALL sites in the account
  prompts_allowed: number    // PLAN_PROMPTS[account_plan]
  budget_used_pct: number    // 0..100, a PERCENTAGE — never a euro figure (§14.2)
  next_refresh_at: string | null   // ISO 8601
}
```

`clients: Client[]` keeps its type and its population logic (`:170-193`). The
comment at `:33` reading "populated for admin only" is deleted; it has been false
since `42b7de6`.

Loading, empty and error states:

| State | Condition | Render |
|---|---|---|
| loading | `loading === true` | existing skeleton, unchanged |
| single site | `canSwitchClient === false` | no switcher, no placeholder, no disabled control |
| multi site | `canSwitchClient === true` | the switcher currently behind `Layout.tsx:372` |
| membership fetch failed | `user_clients` query threw | fall back to the primary site only, surface nothing |
| account fetch failed | `accountLimits === null` | hide the allowance and consumption UI entirely. **Never render 0 of 0** — a zero limit reads as "you have nothing" and is worse than absence |

The last two rows are the frontend mirror of F1 and F4: a failed read degrades to
*less* information, never to more and never to a misleading number.

**Who owns the fetch:** `ClientProvider` alone, in `init()`. No page component
queries `user_clients` or `accounts` directly. This is already the pattern
(`:174`) and D1 does not change it.

---

## 7. State ownership map

| State | Owner | Readers | Invalidated by |
|---|---|---|---|
| `activeClientId` | `ClientProvider` + `localStorage['brandgeo_client']` | every page | user switching sites; `init()` re-run |
| `clients[]` (accessible sites) | `ClientProvider.init()` | `Layout` switcher, every page's guard | sign-in, sign-out, token refresh (`onAuthStateChange`, `:206`) |
| membership rows | Postgres `user_clients` | `has_client_access()` in RLS; `assertClientAccess()` in functions; `ClientProvider.init()` | `client-members.js`, `create-site.js` |
| account grouping | Postgres `clients.account_id` | `account_plan()`, `enforce_prompt_cap()`, `checkCollectionLimits()` | `create-site.js` only |
| `accountLimits` | `ClientProvider`, one read per init | Account page, Prompts page, the R4 nudge | `activeClientId` change; any prompt create/delete; any collection run |
| `user_profiles.client_id` | `provision-account.js`, `stripe-webhook.js`, `onboard-client.js` | **after step 8: nothing that authorizes.** Landing-site default only | admin reassignment |
| `activeMembershipRole` | `ClientProvider`, derived | billing UI, member-management UI | `activeClientId` change |
| per-site plan | `clients.plan` | `planConfig.ts`, `_cost.js`, `account_plan()` | `set-client-plan.js`, `stripe-webhook.js`, `expire-plan-grants.js` |
| account effective plan | **derived, never stored** | §8 everywhere | any site's plan changing |

### 7.1 The same value derived twice — named, as required

1. **Accessible-site membership is derived in three places.**
   `has_client_access()` in SQL, `clientContext.tsx:170-176` in TypeScript
   (`[cid, ...links]` union), and — after D1 — `assertClientAccess()` in
   `_auth.js`. Three implementations of one rule, in three runtimes, so they
   cannot be collapsed to one. The requirement is that all three encode the SAME
   two disjuncts and change together in one commit. Step 8 removes the first
   disjunct from **all three at once, or from none.**

2. **The account's effective plan is derived in two places**, `account_plan()` in
   SQL (for the cap trigger) and in JavaScript (for `checkCollectionLimits` and
   the frontend). Both must rank by `PLAN_ORDER`, not by comparing allowance
   numbers, because `essentials` and `growth` share an allowance of 2 and a
   numeric max would pick arbitrarily between them. Criterion 26 tests exactly
   this case.

3. **Platform-admin-ness is derived twice in SQL**, by `is_admin()` and by
   `my_role() = 'admin'`, sometimes on the same table (`prompts_select` uses
   `my_role()`, `prompts_insert` uses `is_admin()`). Harmless; both are `STABLE
   SECURITY DEFINER` over the same column. **Not consolidated by D1** — a rename
   touching ~40 policies for zero behaviour change is a refactor smuggled into a
   feature. §19.

4. **The plan ladder is mirrored between `planConfig.ts` and
   `plan_prompt_caps`.** Two copies, verified identical today. D1 adds the site
   allowance to both and **adds no third copy**. Criterion 31 is the drift check.

---

## 8. Shared limits: how R2 is actually enforced

The ruling with teeth. Per-site is the default behaviour of every mechanism
below, so a builder who changes nothing produces exactly the wrong result.

### 8.1 What is shared and what is not

| Limit | Scope after D1 | Mechanism |
|---|---|---|
| Active prompts | **ACCOUNT** | `enforce_prompt_cap()` trigger, rewritten (§8.3) |
| Monthly EUR API budget | **ACCOUNT** | `checkCollectionLimits()` in `_auth.js`, widened (§8.4) |
| Site count | **ACCOUNT** | `create-site.js`, new (§6.7) |
| Hourly call ceiling | **SITE** — deliberately unchanged | `_auth.js:200-203` |
| Platform monthly EUR ceiling | GLOBAL — unchanged | `_auth.js:249` |
| Engines | **SITE** | `clients.plan` + `engines_enabled` |
| Collection cooldown | **SITE** | `PLAN_COLLECTION_COOLDOWN_HOURS` |
| AI SEO depth | **SITE** | `clients.plan` |

The hourly ceiling stays per site on purpose. It is an abuse circuit-breaker
sized as `max(150, activePrompts × liveEngineCount)` (`_auth.js:200-203`), not
something a customer bought, and the EUR budget binds long before it does
(`_cost.js` states scheduled collection runs at ~10.5% of price against a 15%
gate). Making it account-level would tighten a breaker that is not the binding
constraint, and would produce confusing 429s on a multi-site account running two
legitimate collections at once. **Stated explicitly so a builder does not
"helpfully" make it account-level for consistency.**

Engines, cooldown and SEO depth stay per site because R1 says each site keeps its
own plan. A site on Essentials gets 3 engines whether or not it sits in a Growth
account. This is what the second subscription buys (§20 Q1).

### 8.2 The account's effective plan

```
account_plan(account_id) := the plan of the account's sites that ranks
                            highest in PLAN_ORDER
```

`PLAN_ORDER` is `['free','essentials','growth','growth_pro','managed','pro','enterprise']`
(`planConfig.ts:326`). Rank by index in that array, **not** by comparing
allowance or prompt numbers — `essentials` and `growth` both allow 2 sites, and a
numeric max would pick between them arbitrarily.

Everything account-level reads from this one derived value:

```
sites_allowed    = PLAN_SITES[account_plan]
prompts_allowed  = PLAN_PROMPTS[account_plan]
budget_allowed   = PLAN_MONTHLY_API_BUDGET_EUR[account_plan]
```

**Why derived and not stored:** a stored `accounts.plan` would be a sixth
authority on the ladder and would go stale the instant a site's plan changed —
including automatically, via `expire-plan-grants.js`. Derivation costs one index
scan over a table with 36 rows.

**Why MAX and not SUM.** Under SUM, adding a site would itself increase the
allowance, so a customer could always add one more site to earn room for one more
site. The allowance would bound nothing. MAX also makes R4's nudge coherent: the
only way to get more sites is to move a plan up.

The consequence — that a second site's subscription adds no prompt pool and no
EUR budget — is real, is not an architecture question, and is put to Constantin
as §20 Q1 with the SUM alternative costed.

### 8.3 The prompt cap becomes account-level

This is the largest single piece of work R2 creates, because the existing
enforcement is correct, live, and does precisely the wrong thing.

`enforce_prompt_cap()` today counts:

```
prompts where client_id = NEW.client_id and is_active
```

compared against `plan_prompt_caps.prompt_cap` for `clients.plan` of
`NEW.client_id`.

It becomes: count active prompts across **every** client sharing
`NEW.client_id`'s `account_id`, compared against `prompt_cap` for
`account_plan(that account)`.

Specified as a predicate rather than a function body:

```
v_account := (select account_id from clients where id = NEW.client_id)

v_used    := count(*) from prompts p
             join clients c on c.id = p.client_id
             where c.account_id = v_account
               and p.is_active is true
               and (tg_op = 'INSERT' or p.id <> NEW.id)

v_plan    := plan of the account's highest-PLAN_ORDER site
v_cap     := plan_prompt_caps.prompt_cap where plan = v_plan
```

Every other behaviour of the existing function is preserved verbatim and must be
re-asserted by test, because this is a rewrite of a live guard:

- inactive rows return early and never consume allowance
- an UPDATE that neither activates a row nor moves it between clients returns
  early, so editing text or position is never blocked
- `current_user in ('service_role','postgres')` returns early
- `is_admin()` returns early
- an unknown or NULL plan falls back to the **free** cap, never to unlimited
- a NULL cap after that fallback defaults to 5
- the raised message keeps the literal token `prompt_cap_reached`, which
  `Prompts.tsx` matches on

**Schema change required:** yes. `clients.account_id` (§6.2) plus its index. The
account cannot be computed without it, and there is no membership-derived
substitute (§3.2).

**Behaviour-preserving at migration time:** with one account per existing client
(§17 step 2), `c.account_id = v_account` selects exactly one client, so the new
count equals the old count for all 36 rows. The rewrite ships with provably zero
behaviour change and only diverges once a second site exists.

### 8.4 The monthly EUR budget becomes account-level

`_auth.js:223-239` today sums `ai_results.cost_eur where client_id = clientId and
checked_at >= monthStart` against `PLAN_MONTHLY_API_BUDGET_EUR[client.plan]`.

It becomes: resolve `clientId`'s `account_id`, resolve that account's site id
list, sum `cost_eur` over `.in('client_id', siteIds)`, and compare against
`PLAN_MONTHLY_API_BUDGET_EUR[account_plan]`.

Contract change to the existing helper — signature unchanged, semantics widened:

```ts
async function checkCollectionLimits(
  supabase: SupabaseClient,
  clientId: number,           // still the target SITE
): Promise<{
  blocked: boolean
  reason?: 'hourly_ceiling' | 'monthly_budget' | 'platform_budget' | 'account_unresolved'
  message?: string
  detail?: {
    plan:          Plan     // the SITE's plan, for the hourly ceiling
    accountPlan:   Plan     // NEW — the account's plan, for the budget
    accountId:     number   // NEW
    siteCount:     number   // NEW
    hourlyCeiling: number
    hourlyCount:   number
    accountSpent:  number   // RENAMED from clientSpent — it is no longer per client
    accountBudget: number   // RENAMED from clientBudget
    platformSpent: number
  }
}>
```

`clientSpent` and `clientBudget` are **renamed**, not merely repurposed. A field
called `clientSpent` holding an account sum is the kind of quiet lie that
survives three refactors. `Usage.tsx` and any other consumer must be updated in
the same commit.

`account_unresolved` is new and is F4 in practice: if the account or its site
list cannot be read, `blocked` is **true**. A budget check that cannot determine
the budget must not conclude there is none.

**No denormalisation of `account_id` onto `ai_results`.** It would remove one
lookup and add a sync hazard on the highest-volume table in the product, where a
stale value means spending against the wrong budget. The site-id list comes from
`clients`, which has 36 rows and an index on `account_id`.

### 8.5 Over-allowance, which R1 makes reachable

A downgrade can leave an account holding more sites than its plan allows: three
sites on Growth PRO (allowance 3), then the Growth PRO site drops to Growth
(allowance 2). This happens automatically, without anyone choosing it, via
`expire-plan-grants.js` when a package or trial ends.

Specified behaviour, in full:

1. **No site is deleted, suspended, or hidden.** Deleting customer data is
   withheld authority (AUTONOMY §2) and auto-suspension is the same act wearing a
   hat. All sites stay fully readable and writable.
2. **`create-site.js` refuses** with `409 site_allowance_reached` until the
   account is back within allowance.
3. **The shared pools shrink**, because they derive from the now-lower
   `account_plan`. An account over its prompt pool cannot add prompts (the cap
   trigger refuses) but keeps every prompt it has. Existing prompts are never
   deactivated automatically.
4. **An admin event is recorded** (`account_over_allowance`) carrying the account
   id, sites held, sites allowed and the plan that dropped.
5. **The Account page surfaces it** as a factual banner with an upgrade path. Not
   an error state, not a countdown, not a threat.

Rule 3 is the one to get right: the natural implementation deactivates prompts to
fit the smaller pool, which silently destroys the customer's configuration to
satisfy a number.

---

## 9. The plan ladder under shared limits

R2 makes the ladder's shape a correctness question, not a pricing preference,
because R4's nudge will make a claim about it to a paying customer.

### 9.1 The ladder as shipped inverts, in two places

With `PLAN_PROMPTS` from `planConfig.ts:427` and R1's allowances:

| Plan | Sites | Prompts (total) | Prompts per site |
|---|---|---|---|
| free | 1 | 5 | 5.00 |
| essentials | 2 | 15 | 7.50 |
| growth | 2 | 35 | 17.50 |
| growth_pro | 3 | 35 | **11.67** ← inversion |
| managed | 10 | 120 | 12.00 |
| pro | 20 | 120 | **6.00** ← second inversion, below essentials |
| enterprise | open | 100000 | n/a |

Two defects, not one:

- **Total prompts do not increase at all** from Growth to Growth PRO (35 = 35) or
  from Managed to Pro (120 = 120). A customer paying EUR 150 more for Growth PRO
  receives **zero** additional prompts. R4's nudge, as worded, would be false.
- **Per-site falls** at both boundaries. Pro is worse per site than Essentials.

The second inversion was not in the brief and is reported here as a new finding.

### 9.2 Per-site capacity cannot rise, and the reason is arithmetic

Prompts are bounded by money. Every paid plan's budget is exactly 15% of list
price (`planConfig.ts:316-323`, mirrored in `_cost.js:478-487`). So the ceiling on
prompts *per site* is the budget *per site*:

| Plan | Budget (15% of price) | Sites (R1) | Budget per site |
|---|---|---|---|
| free | 0.30 | 1 | 0.30 |
| essentials | 14.85 | 2 | 7.43 |
| growth | 44.85 | 2 | **22.43** |
| growth_pro | 67.35 | 3 | **22.45** |
| managed | 225.00 | 10 | **22.50** |
| pro | 225.00 | 20 | 11.25 |
| enterprise | 1500.00 | open | n/a |

Per-site budget is **flat to within 0.3%** across growth, growth_pro and managed,
and **halves** at pro. The reason is that R1's allowances track price almost
exactly:

| Boundary | Price ratio | Site ratio | Per-site budget change |
|---|---|---|---|
| essentials → growth | ×3.02 | ×1.00 | **×3.02** |
| growth → growth_pro | ×1.50 | ×1.50 | ×1.00 (flat) |
| growth_pro → managed | ×3.34 | ×3.33 | ×1.00 (flat) |
| managed → pro | ×1.00 | ×2.00 | ×0.50 (halves) |

> **No choice of `PLAN_PROMPTS` can make per-site capacity increase from Growth
> upward, because the money to pay for it is not there.** The allowance absorbs
> the entire price increase at every boundary above Essentials.

This is the finding the brief asked for, and it says the requested monotonicity is
achievable on **total** but not on **per site** without changing a different
input. Three levers exist, and all three are Constantin's:

- **L1. Cut the allowances** so they grow more slowly than price. Growth PRO at 2
  sites instead of 3 gives 33.68 per-site budget, a 50% rise over Growth. Managed
  at 6 gives 37.50, a 67% rise. Cost: R4's nudge can no longer say "an extra
  website" at the Growth PRO boundary, which is its whole premise.
- **L2. Raise the ceiling above 15% of price** for the top tiers. Spends margin
  to buy the ladder.
- **L3. Drop per-site monotonicity as a requirement**, and require only total
  monotonicity. **Recommended, §9.4.**

### 9.3 Recommended `PLAN_PROMPTS`, with cost

The recommendation is **not invented numbers**. It is the ladder the cost model at
`planConfig.ts:400-420` was built for and which its own prose says was restored on
2026-07-29 but never was (§1.5). Adopting it also closes ROADMAP's open "three
conflicting Growth prompt counts" item.

Cost is derived from that table's own EUR/run figures, scaled linearly in prompts,
then raised for the seventh engine on growth_pro and up (the table was written at
6 engines; `PLAN_LIVE_ENGINE_COUNT` now reads 7).

| Plan | Prompts now | **Recommended** | Sites | Modelled EUR/mo | Budget | % of budget |
|---|---|---|---|---|---|---|
| free | 5 | **5** (unchanged) | 1 | 0.28 | 0.30 | 93% |
| essentials | 15 | **20** | 2 | 10.49 | 14.85 | 71% |
| growth | 35 | **50** | 2 | 31.41 | 44.85 | 70% |
| growth_pro | 35 | **75** | 3 | 59.5 | 67.35 | 88% |
| managed | 120 | **250** | 10 | 198.3 | 225.00 | 88% |
| pro | 120 | **250** (= managed) | **10**, not 20 | 198.3 | 225.00 | 88% |
| enterprise | 100000 | **100000** (unchanged) | open | n/a | 1500.00 | n/a |

Resulting ladder:

- **Total: 5, 20, 50, 75, 250, 250, 100000.** Strictly increasing across every
  sellable boundary. The Growth → Growth PRO tie that gave a EUR 150 upgrade zero
  extra prompts is closed: +25 prompts and +1 site.
- **Per site: 5.0, 10.0, 25.0, 25.0, 25.0, 25.0.** Non-decreasing. **No inversion
  anywhere.** Flat above Growth, which §9.2 proves is the ceiling.
- Every figure sits inside the existing 15% budget. The top two land at 88%, which
  is tight and is the honest cost of the seventh engine.

**Two changes beyond prompts, both required:**

- `pro`'s allowance must be **10, not 20.** At 20 sites and a EUR 225 budget,
  per-site capacity is 11.25 against Growth's 22.43 — an inversion no prompt
  number can fix, because 600 prompts (what 20 sites at 30 each would need) costs
  about EUR 408/month against a EUR 225 ceiling. `pro` is legacy and unsellable
  (`planConfig.ts:28`), so setting it equal to `managed` on both axes costs
  nothing commercially and removes the inversion permanently.
- Adopting this ladder means `plan_prompt_caps` must move in the same migration.
  The database currently refuses at 35 what the recommendation would publish as
  75. **A pricing page promising 75 against a trigger enforcing 35 is a customer
  hitting `prompt_cap_reached` at prompt 36 with no explanation.** Criterion 31.

### 9.4 The alternative, if the cost is unwanted

The floor that satisfies total monotonicity with the smallest possible change:
`free 5, essentials 15, growth 35, growth_pro 53, managed 177, pro 177`. Cheaper
by roughly EUR 40/month per Managed client. It is arithmetically correct and
commercially inert — the per-site figures move 17.5 → 17.67 → 17.70, an
improvement no customer perceives, and the numbers are unmarketable. Recorded so
the range is visible; **not recommended.**

**Recommended framing for R4's nudge, which is L3 in practice:** under shared
limits the customer buys a **pool** and a **site count**. "Prompts per site" is
not a product entity — the customer allocates the pool across their sites however
they like, and may put 60 of 75 on one site. Per-site is a derived statistic
nobody purchases. So the nudge should claim **more sites and a larger total
pool**, both of which are true under §9.3, and must not claim more prompts per
site, which §9.2 proves is false above Growth. That constraint is binding on
`bg-copy` and appears in §12.4.

---

## 10. Billing per site

### 10.1 One Stripe Customer per SITE (R5, confirmed)

Four reasons, in order of weight.

**B1. The alternative silently breaks cancellation today.**
`handleSubscriptionUpdated` resolves its target with `stripe-webhook.js:458`
`.eq('stripe_customer_id', custId)` and iterates **every** matching row at `:469`.
`handleSubscriptionDeleted` does the same at `:507` and `:516`. The moment one
Stripe customer maps to three clients, cancelling site B's subscription runs the
downgrade loop over A, B and C. The loop is written to handle multiple rows, so it
will not error — it will quietly do the wrong thing.

**B2. `checkout.session.completed` has no site selector.** It resolves through
`user_profiles.client_id` (`:273-280`) and updates that client's plan at
`:338-345`. One-customer-per-account removes the only remaining distinguishing
key.

**B3. A1's package machinery is already per-site and stays free.** `plan_source`,
`plan_grant_until`, `plan_grant_note` and `stripe_subscription_id` all live on the
`clients` row, which IS the site. `expire-plan-grants.js:169-173` selects on
`clients`, and its liveness guard (`:95`) reads `clients.stripe_subscription_id`.
All keep working with zero changes. Under one-customer-per-account the guard would
have to decide which of N subscriptions belongs to the site whose grant is
expiring, from a customer id that identifies all of them equally. It cannot, and
no column would let it.

**B4. It is free today.** Zero clients carry a `stripe_customer_id` or a
`stripe_subscription_id`. Nothing to migrate.

### 10.2 Column dispositions

| Column | Disposition |
|---|---|
| `clients.stripe_customer_id` | **unchanged.** Per-site. Non-unique across an account — one human is several Stripe Customers |
| `clients.stripe_subscription_id` | **unchanged.** One subscription per site, or null |
| `clients.plan`, `plan_source`, `plan_grant_until`, `plan_grant_note` | **unchanged.** Already per-site |

`create-portal-session.js` already takes `client_id` and looks up that client's
`stripe_customer_id` (`:37`, `:43-47`), so the billing portal is **already
per-site** and needs no change beyond the widened gate it inherits from §4.2.

Accepted cost, stated plainly: a customer with three sites receives three
invoices, manages three portal sessions, and enters card details up to three
times.

### 10.3 The webhook change

`handleCheckoutCompleted` must stop inferring the target site. The session carries
`metadata.client_id`; resolution becomes:

1. `metadata.client_id` present and the buyer holds a membership on it → provision
   that site.
2. `metadata.client_id` present, buyer holds no membership → **provision
   nothing**, raise `checkout_wrong_site` carrying the session id, claimed client
   id and email.
3. `metadata.client_id` absent AND the buyer holds **zero** memberships →
   unchanged: create a client, invite, insert a profile. The self-serve first
   purchase, and the majority path.
4. `metadata.client_id` absent AND the buyer holds **one or more** memberships →
   **provision nothing**, raise `checkout_ambiguous_site`. Do not guess. Do not
   fall back to `user_profiles.client_id`.

Branch 4 is the point of the change: guessing is how an agency's second purchase
silently downgrades their first site.

Branches 2 and 4 must **not** throw. `stripe-webhook.js:140-145` deletes the
idempotency row and returns 500 on a throw, so Stripe would redeliver forever and
re-alert every time. The existing package path reasons this out at `:223-227`;
follow it. Reuse `reportUnprovisionedPackage`'s shape (`:423-443`), which already
handles `client_id: null`.

A new site created by `create-site.js` sets `metadata.client_id` on its own
Checkout Session, so branch 1 is the normal path for every site after the first.

---

## 11. Cross-tier across sites, and why it does not conflict with A1-S2-tier

R3 allows a Growth customer to run a second site on Essentials. ROADMAP A1-S2-tier
records the opposite ruling for packages: "a lower-tier package must NOT stack
onto a higher-tier live grant. Refuse it."

**Both are correct and they do not overlap**, because they constrain different
axes:

| | A1-S2-tier | R3 |
|---|---|---|
| Axis | **time**, on one site | **space**, across sites |
| Resource | one `clients.plan` scalar | N independent `clients.plan` scalars |
| Failure it prevents | a paying customer is downgraded mid-grant and keeps a stacked tail | none — there is nothing to collide |

The unifying rule, and the sentence a builder should carry:

> **A site holds exactly one plan at a time. An account may hold several sites at
> several plans.** Tier mixing is legal across the site axis and illegal across
> the time axis on one site.

A1-S2-tier exists because a single site's plan is a scalar: a lower tier arriving
while a higher grant is live must overwrite it, so the customer pays and
immediately receives less. There is no such collision between two sites, because
nothing is overwritten — two rows, two plans, both intact.

Constantin's own reframing, recorded in ROADMAP A1-S2-tier, is the resolution
rather than a coincidence: "mixing tiers is not a renewal case at all, it is the
multi-site case." D1 is where that case gets a home, which is precisely why the
single-site refusal can stay strict.

**One interaction worth stating.** Under §8.2's MAX rule, a lower-tier second site
cannot reduce anything: `account_plan` is the highest-ranked site, so adding
Essentials to a Growth account leaves the pool at Growth's. It also does not raise
it. That is what makes R4's nudge honest rather than coercive — the customer
genuinely trades "another dashboard with its own engines" against "more sites and
a bigger shared pool", and both sides of that trade are real.

---

## 12. The upsell nudge (R4)

### 12.1 A nudge and a gate are different things, and only one of them blocks

| | Condition | Behaviour |
|---|---|---|
| **Gate** | `sites_used >= PLAN_SITES[account_plan]` | Hard refusal. `create-site.js` returns `409 site_allowance_reached`. Server-enforced. This is the **only** block in the add-site flow |
| **Nudge** | `PLAN_ORDER.indexOf(chosen) < PLAN_ORDER.indexOf(account_plan)` | Advisory dialog. Never disables anything. Never reaches the server as a condition |

Conflating them is the failure R4 exists to prevent. The gate is an entitlement;
the nudge is a suggestion.

### 12.2 Where in the flow

The check happens **client-side, in the add-website dialog, at plan selection,
before submit** — `Account.tsx`. It is presentation. `create-site.js` enforces the
allowance and nothing else; it never inspects the chosen tier relative to the
account's tier, and it never refuses on `acknowledged_downgrade` being absent
(§6.7).

Interaction shape: the dialog shows the recommendation inline or as a confirmation
step with two actions. The lower-tier action remains **one click**, per R4. It is
never a disabled button, never behind a second confirmation, and never the
visually recessive option to the point of being hard to find.

### 12.3 Data the check needs

All of it is already in `ClientCtx` after §6.8, so the nudge costs **zero
additional requests**:

```ts
type NudgeInput = {
  chosen_plan:   Plan       // from the dialog
  account_plan:  Plan       // accountLimits.account_plan
  sites_used:    number     // accountLimits.sites_used
  sites_allowed: number     // accountLimits.sites_allowed
}

type NudgeOutput = null | {
  suggested_plan:    Plan     // next plan up in PLAN_ORDER with a LARGER site allowance
  extra_sites:       number   // PLAN_SITES[suggested] - PLAN_SITES[account_plan]
  extra_prompts:     number   // PLAN_PROMPTS[suggested] - PLAN_PROMPTS[account_plan]
  extra_engines:     number   // PLAN_LIVE_ENGINE_COUNT[suggested] - [account_plan]
  monthly_delta_eur: number   // list price difference
}
```

`suggested_plan` is the next plan up **with a larger site allowance**, not simply
the next in `PLAN_ORDER`. Under R1, Essentials → Growth adds no site (both allow
2), so suggesting it would promise "an extra website" and deliver none.

`NudgeOutput` is `null` — the nudge does not render — when `chosen_plan` ranks at
or above `account_plan`, or when no higher plan offers more sites (at
`enterprise`).

### 12.4 Binding constraint on the copy

The words are `bg-copy`'s and are not authored here. Two constraints are
architectural, not editorial, and bind whatever copy is written:

1. **The nudge must not claim more prompts per site.** §9.2 proves per-site
   capacity is flat from Growth upward. A nudge promising "higher limits" without
   qualification is read as per-site and is false. It may truthfully claim more
   **sites**, a larger **total** pool, and more **engines**, all of which §9.3
   delivers.
2. **Every number in the nudge comes from `NudgeOutput`.** No figure is written
   into the copy deck as a literal. When the ladder changes, the words must not
   have to.

If §9.3's ladder is not adopted, constraint 1 tightens further: under today's
shipped numbers `extra_prompts` is **0** at the Growth → Growth PRO boundary, and
a nudge is not writable at all without saying something false. **The ladder
decision gates the nudge copy.**

---

## 13. Roll-up: deferred to D2 (R5, confirmed)

**D1 does not include a cross-site roll-up view.** Constantin confirmed the
recommendation 2026-07-31.

D1 ships the switcher: one login, a site picker, a full dashboard per site. That
is Constantin's stated ask verbatim.

Note that §6.8's `accountLimits` is **not** a roll-up. It reports allowance and
consumption against limits the customer is already subject to, which R2 makes
mandatory to display correctly. It shows no per-site comparison, no ranking, and
no cross-site analytics. Confusing the two would pull D2 into D1 through a side
door.

`clientContext.tsx:189` carries the comment "for the switcher + Compare", so a
Compare surface has been contemplated; there is no `Compare` page in
`src/pages/` today, confirmed.

---

## 14. Interaction with A5 and A6

### 14.1 Every entitlement is a property of the account or the site, never the user

**Binding constraint on A5.** No entitlement column may live on `user_profiles` or
on `user_clients`. Bonus prompts and prompt-limit overrides belong on `accounts`,
because R2 makes the pool account-level and an override to a shared pool must be
shared too. API-budget top-ups belong on `accounts` for the same reason.

This **amends** `custom-entitlements.md` §3.4, which specifies
`ALTER TABLE clients ADD COLUMN prompt_limit_override int`. Under R2 that column
would override a per-site cap that no longer exists. Amended target:

```sql
ALTER TABLE accounts ADD COLUMN prompt_limit_override int;   -- null = use PLAN_PROMPTS[account_plan]
ALTER TABLE accounts ADD COLUMN budget_override_eur numeric; -- null = use PLAN_MONTHLY_API_BUDGET_EUR[account_plan]
```

`custom-entitlements.md` §3.4's reasoning — two nullable override columns beat a
new `client_entitlements` table, because a table would be another place for the
ladder to drift — is unchanged and still correct. Only the host table moves.
Confirmed absent from production: `clients` has no `prompt_limit_override` today,
so nothing has to be migrated off it.

Engine mixing stays on `clients.engines_enabled`, per site, because engines are
per site (§8.1).

### 14.2 A6 renders per account for pools, per site for engines

**Binding constraint on A6.** The client-visible limits view shows:

- **Account-level, shared:** prompts used and allowed, sites used and allowed,
  budget consumed as a percentage.
- **Site-level:** engines active, collection cooldown, AI SEO depth, last refresh.

It must **never** sum a per-site value across sites, and must never divide an
account pool by site count to present a per-site allowance — §9.2 shows that
number is flat and it is not something the customer was sold.

ROADMAP A6's own constraint carries over unchanged and is reinforced by R2:
consumption is expressed in units the client bought, never in euros of API cost.
`budget_used_pct` in §6.8 is a percentage of *their allowance*, not of a cost
budget, and `Usage.tsx`'s `OVERHEAD_MULTIPLIER` never reaches a client surface.
`Usage.tsx:142` remains admin-only.

### 14.3 Two holes A6 must close, recorded not fixed

- `enforce_prompt_cap()` returns early for `service_role`, so every Netlify
  function bypasses the cap. `onboard-client.js` and `provision-account.js` can
  seed a client past their allowance, after which the customer sees a limit the
  server did not apply on the path that created their data.
- `plan_prompt_caps` and `planConfig.ts` are two hand-kept copies. Criterion 31
  adds a drift check; keeping it green is A6's problem as much as D1's, because A6
  is what displays the number.

---

## 15. File plan

Every row is a `scope_write` line. Disjoint by owner.

### 15.1 `bg-backend` — SQL, in `db/`

| File | Action | Reason |
|---|---|---|
| `db/supabase-multisite-accounts-migration.sql` | create | Steps 1-2: `accounts`, `clients.account_id` + index, one account per existing client, `accounts_select`, `my_account_id()` |
| `db/supabase-multisite-membership-migration.sql` | create | Step 3: `user_clients.role` + `created_by`, backfill, `sync_primary_membership()` |
| `db/supabase-plan-ladder-migration.sql` | create | §9.3: `plan_prompt_caps.site_allowance` + new `prompt_cap` values. **Only after Constantin rules on §20 Q2** |
| `db/supabase-account-prompt-cap-migration.sql` | create | Step 6: `account_plan()` + the rewritten `enforce_prompt_cap()` |
| `db/supabase-multisite-rls-migration.sql` | create | Step 7: the 31 Group B replacements |
| `db/supabase-multisite-close-legacy-migration.sql` | create | Step 8: `has_client_access` single-disjunct form |
| `db/supabase-multisite-rollback.sql` | create | Down path for all six, per AUTONOMY §2 |

### 15.2 `bg-backend` — Netlify functions

| File | Action | Reason |
|---|---|---|
| `netlify/functions/_auth.js` | modify | `assertClientAccess()`; account-level `checkCollectionLimits` (§8.4); step 4 permissive OR, step 8 removal |
| `netlify/functions/client-members.js` | create | The missing write path for `user_clients` (§6.6) |
| `netlify/functions/create-site.js` | create | Add a site to an existing account, allowance gate (§6.7) |
| `netlify/functions/stripe-webhook.js` | modify | §10.3 four-branch site resolution; set `account_id` on created clients |
| `netlify/functions/provision-account.js` | modify | Create an `accounts` row for a first-time self-serve user |
| `netlify/functions/onboard-client.js` | modify | Same, for the admin wizard |
| `netlify/functions/_cost.js` | modify | `PLAN_SITES` mirror; §9.3 prompt values if adopted |
| the 19 files listed in §4.1 | modify (one line each) | Replace inline equality with `assertClientAccess()` |

### 15.3 `bg-app` — dashboard

| File | Action | Reason |
|---|---|---|
| `src/lib/planConfig.ts` | modify | `PLAN_SITES`; §9.3 `PLAN_PROMPTS` values if adopted; `pro` allowance 10 |
| `src/lib/clientContext.tsx` | modify | `activeMembershipRole`, `canSwitchClient`, `accountLimits`; delete the stale `:33` comment; step 8 removes the `[cid, ...]` union at `:175` |
| `src/components/Layout.tsx` | modify | `:372` `isAdmin && clients.length > 0` → `canSwitchClient` |
| `src/pages/Account.tsx` | modify | Members panel, add-website flow, R4 nudge, over-allowance banner |
| `src/pages/Usage.tsx` | modify | `clientSpent`/`clientBudget` → `accountSpent`/`accountBudget` (§8.4). Stays admin-only |
| `src/pages/Prompts.tsx` | modify | Cap read becomes account-level; `prompt_cap_reached` message gains account context |

**`planConfig.ts` is written by `bg-app`, not `bg-backend`**, even though its
values are a billing decision, because it lives under `src/`. `_cost.js` is
`bg-backend`'s. The two must land in the **same cycle** and criterion 31 is what
proves they agree.

### 15.4 `/cheap` assessment

Only the 19-file batch in §15.2 is mechanical in shape. **It is not routed to the
local model.** AGENT-OS §2 restricts Qwen to work "where being wrong is not
immediately visible", and a wrong ownership check is invisible until it is a
cross-tenant leak. Sonnet, with a full diff reviewed by `bg-verify`.

---

## 16. Performance budget

| Metric | Budget |
|---|---|
| Bundle delta, `brandgeo-dashboard` | **≤ 8 KB gzipped.** No new dependency. Context fields, one boolean, the members panel, the add-site dialog and the nudge, all reusing existing components |
| New npm dependencies | **0.** Stack stays React 18, Vite, Tailwind, Recharts, lucide-react |
| Extra Supabase round trips on dashboard load | **≤ 1.** `clientContext.tsx:174` already queries `user_clients`; D1 adds a column to that select. The `accountLimits` read is the one new request, a single query joining `clients` on `account_id` |
| Extra round trips per gated Netlify call | **≤ 1.** `requireAuth` already fetches the profile (`:99-104`); `assertClientAccess` adds at most one `user_clients` PK lookup, and only when the caller is not admin and the target differs from the primary |
| Extra round trips per **collection** call | **≤ 2.** `checkCollectionLimits` adds one lookup for the account and one for its site-id list. Both are index scans over a 36-row table. Not denormalised onto `ai_results` (§8.4) |
| Prompt-insert cost | **≤ 1 extra index scan.** The rewritten trigger joins `prompts` to `clients` on `client_id` and filters `clients.account_id`, requiring `idx_clients_account_id` (§6.2). Without that index this is a sequential scan on every prompt insert |
| RLS per-row cost, Group A tables | **unchanged.** They already call `has_client_access` |
| RLS per-row cost, Group B tables | **≤ 1 additional index lookup per row.** `get_my_client_id()` is one PK lookup on `user_profiles`; `has_client_access()` is that plus one PK lookup on `user_clients_pkey`. After step 8 it is one lookup, i.e. **net zero** |
| New indexes required | **1.** `idx_clients_account_id`. `user_clients_pkey` already covers the membership probe |
| Time to first meaningful paint, `/` | **no regression beyond ±50 ms** |
| Sequential scans introduced | **0.** Any `EXPLAIN` showing a seq scan on `user_clients` or `clients` is a failed criterion, not a tuning note |

---

## 17. Migration sequence

Nine steps. Each independently shippable and independently revertible. The
governing lesson: **apply the permissive step while the old path still works,
verify it, and only then close the old path.**

### Step 1 — `accounts` table, unreferenced

Create `accounts`, `my_account_id()`, and the `accounts_select` policy. Nothing
reads them.

**Consistency:** none broken. **Reversible:** `DROP TABLE accounts CASCADE` (no
dependents yet).

### Step 2 — `clients.account_id`, backfilled one-to-one

Add the column nullable, create one `accounts` row per existing client (36), point
each client at its own account, add `idx_clients_account_id`, then set the column
`NOT NULL`.

**One account per site means every account-level sum equals its per-site value.**
Steps 6 and 7 therefore ship with provably zero behaviour change, and only diverge
once a second site exists. This is the property that makes R2 safe to ship.

`accounts.owner_user_id` is backfilled from the client's primary `user_profiles`
row; where no profile points at the client (26 of 36 rows, since there are 36
clients and 10 profiles) it is set to the platform admin. Those are research and
test clients with no login, and criterion 6 asserts nobody gained access from it.

**Consistency:** none broken. **Reversible:** `ALTER TABLE clients DROP COLUMN
account_id`, then `DELETE FROM accounts`.

### Step 3 — membership schema and backfill

`user_clients.role` + `created_by`; insert one `(user_id, client_id, 'owner')` per
`user_profiles` row with a non-null `client_id`, `ON CONFLICT DO NOTHING`; create
`sync_primary_membership()` and its trigger.

Expected: **10 rows inserted**, matching the 10 profiles.

The moment this lands, `has_client_access()`'s second disjunct returns true for
every existing user, making the first redundant — while the first still runs.
**This is the window in which both paths are live, and it is deliberate.** It
stays open across steps 4, 5, 6, 7 and 8.

**Consistency:** none broken; the two paths agree by construction. **Reversible:**
`DROP TRIGGER`, `DROP FUNCTION`, `DELETE FROM user_clients`.

### Step 4 — `_auth.js`, permissive

`assertClientAccess()` with **both** disjuncts (F3). Rewrite the 19 inline checks.
Widen `requireAuth`'s `clientId` branch.

Access is byte-identical for every existing user. Nobody gains or loses anything.

**Consistency:** none broken. **Reversible:** `git revert`, push, Netlify
rebuilds.

### Step 5 — the ladder, if adopted

`db/supabase-plan-ladder-migration.sql` plus `planConfig.ts` and `_cost.js` in one
commit. §9.3's values and `PLAN_SITES`.

**Gated on §20 Q2.** If Constantin does not rule, this step is skipped and steps 6
onward proceed against today's numbers — but then §12.4's constraint 1 makes R4's
nudge unwritable at the Growth → Growth PRO boundary, and A6 will display a ladder
that does not improve.

> **This step raises limits, so it can only make an existing customer's position
> better.** No client is at 35 prompts today (criterion 33 asserts it before
> applying). If any were, raising the cap is still safe; lowering one never is,
> and this migration must never lower a cap without an explicit separate ruling.

**Consistency:** the SQL and the TypeScript must land together, or the page
promises a number the trigger refuses. Apply the SQL immediately after Netlify
reports the deploy live. **Reversible:** the previous values, recorded in §1.5 and
§9.1.

### Step 6 — account-level limits

The rewritten `enforce_prompt_cap()` and `account_plan()`, plus `_auth.js`'s
account-level `checkCollectionLimits` and its renamed fields.

Behaviour-preserving by step 2's one-account-per-site property.

**Consistency:** the trigger and `_auth.js` are independent enforcement points and
may ship in either order; neither depends on the other. **Reversible:**
`CREATE OR REPLACE` with the current `enforce_prompt_cap()` body, plus a git
revert.

### Step 7 — RLS, the 31 Group B policies

One `DROP POLICY` + `CREATE POLICY` pair per policy, in a single transaction.
Still no behaviour change, same reason as step 4.

**Consistency:** the transaction is the boundary. A partial application is not
possible. **Reversible:** the rollback file recreates all 31 from §5 Group B.

### Step 8 — close the legacy path

`has_client_access()` single-disjunct form (§5.2). The same commit removes the
equality disjunct from `assertClientAccess()` and the `[cid, ...links]` union at
`clientContext.tsx:175`.

**All three, in one commit.** §7.1 finding 1: three implementations of one rule,
and a partial close means SQL and JavaScript disagree about who can see what.

> **This is the only step with a window of inconsistency, and it is between deploy
> targets, not inside one.** The SQL applies to Supabase instantly; the JavaScript
> reaches production only when Netlify finishes building. For that interval —
> typically one to three minutes — the database has closed the legacy path while
> the running bundle still assumes it is open.
>
> The interval is **fail-closed, not fail-open**: the database is the stricter of
> the two, so the worst case is a user briefly seeing fewer sites than they
> should, never more. That is why the SQL goes first rather than last.
>
> To hold it near zero, apply the SQL **immediately after** Netlify reports the
> deploy live. If the two must be separated, separate them in that order and never
> the reverse. Deploying the JavaScript first against the two-disjunct function is
> also safe and is the acceptable fallback.

**Reversible:** `CREATE OR REPLACE` with §1.1's body, plus a git revert. Both
halves restore independently and in either order, because the two-disjunct form is
a superset of the one-disjunct form.

### Step 9 — the write path, the UI, and billing

`client-members.js`, `create-site.js`, the `Account.tsx` panels, the R4 nudge,
`Layout.tsx:372`, and `stripe-webhook.js`'s §10.3 resolution.

**The first step where a second site can exist**, and therefore the first where
any of steps 2, 5, 6, 7 does anything different from before. Everything ahead of
it was groundwork verified against a one-site-per-account world.

**Consistency:** none broken. Branch 3 of §10.3 preserves today's behaviour and is
the only branch any of the 36 existing clients can reach, since zero carry a
`stripe_customer_id`.
**Reversible:** `git revert`. Sites already created remain valid and become
unreachable through the UI without becoming dangerous, because steps 4, 6 and 7
already honour them correctly.

### 17.1 Rollback summary

| Step | Undo |
|---|---|
| 1 | `DROP TABLE accounts CASCADE; DROP FUNCTION my_account_id();` |
| 2 | `ALTER TABLE clients DROP COLUMN account_id;` then `DELETE FROM accounts;` |
| 3 | `DROP TRIGGER ... ON user_profiles; DROP FUNCTION sync_primary_membership(); DELETE FROM user_clients;` — safe only before step 9 creates a non-backfill row. After step 9, delete only rows where `created_by IS NULL` |
| 4 | `git revert`, push |
| 5 | Re-apply §1.5's values to `plan_prompt_caps`, `planConfig.ts`, `_cost.js` |
| 6 | `CREATE OR REPLACE enforce_prompt_cap` with the current body; `git revert` for `_auth.js` |
| 7 | `supabase-multisite-rollback.sql`, recreating the 31 predicates verbatim from §5 |
| 8 | `CREATE OR REPLACE has_client_access` with §1.1's body; `git revert`. Either half alone restores service |
| 9 | `git revert`, push. Orphaned membership rows are inert |

Steps 4, 8 and 9 are pure `git revert` because the dashboard and functions deploy
from `main` via Netlify. Steps 1, 2, 3, 5, 6, 7 and 8 need SQL, and each has a
named down file, per AUTONOMY §2's "every migration ships a down path".

### 17.2 The fail-safe if a step goes wrong mid-way

Steps 1, 2, 3, 5, 6, 7 and 8 each run inside a single transaction, so a mid-step
failure leaves no partial state. The genuine mid-way risk is **between** steps,
and the design answer is that every intermediate state is a valid, shippable
system:

- After 1-2, one account per site: identical to today.
- After 3-4, both auth paths live and agreeing: identical to today.
- After 5, higher limits, no other change.
- After 6-7, account-level enforcement over single-site accounts: identical to
  today.
- After 8, legacy closed, single-site accounts: identical to today.
- Only step 9 changes what a user experiences.

**So the fail-safe is: stop.** At any point, halting leaves production working
exactly as it does now. There is no step that must be followed by another step to
restore correctness.

---

## 18. Acceptance criteria

Executable by `bg-verify`. In the style of `custom-entitlements.md` §4. **D1 is
done when all of these hold.**

### 18.1 Membership and accounts

1. `user_clients` has `user_id, client_id, created_at, role, created_by`; `role`
   is `NOT NULL` with `CHECK (role in ('owner','member'))`; PK is still
   `(user_id, client_id)`.
2. `select count(*) from user_clients` equals
   `select count(*) from user_profiles where client_id is not null`; every
   backfilled row has `role = 'owner'` and `created_by is null`.
3. Inserting a `user_profiles` row with a non-null `client_id` produces a matching
   `user_clients` row automatically. Verify by insert, then rollback.
4. Updating `user_profiles.client_id` from A to B produces a membership on B and
   **leaves the membership on A intact**.
5. `select count(*) from clients where account_id is null` returns **0**, and
   `clients.account_id` is `NOT NULL`.
6. Immediately after step 2, `select count(distinct account_id) from clients`
   equals `select count(*) from clients` — one account per site, nobody grouped
   with anybody. Re-run after step 9 and assert it only changed for accounts a
   test deliberately created.

### 18.2 The authorization boundary — INVARIANT M

7. `grep -rn "profile\.client_id" brandgeo-dashboard/netlify/functions/` returns
   hits **only** in `client-users.js`, `delete-client.js`, `provision-account.js`,
   `stripe-webhook.js`, and `_auth.js`'s own profile select. **Zero** hits inside
   a comparison against a request-supplied `client_id`.
8. `grep -rn "account_id" brandgeo-dashboard/netlify/functions/` returns **zero**
   hits inside any authorization branch. Grouping never grants access.
9. A non-admin with a membership on site B, whose `user_profiles.client_id` points
   at site A, receives **200** from all 19 endpoints in §4.1 when passing B.
10. The same user receives **403** for a site C they hold no membership on, from
    all 19. Not 500, not 200-with-empty-data.
11. **The same user receives 403 for a site C that shares an account with B.**
    This is the test that proves §3.2's separation held.
12. With `user_clients` made unreadable, every gated endpoint returns **403**,
    never 200. F1.
13. A user with zero memberships and a null `user_profiles.client_id` receives 403
    everywhere. F2.
14. Under an anon session, `select count(*) from ai_results` returns 0 rows and
    does not error.

### 18.3 RLS

15. `select count(*) from pg_policies where schemaname='public' and (qual like
    '%get_my_client_id%' or with_check like '%get_my_client_id%' or qual like
    '%my_client_id()%' or with_check like '%my_client_id()%')` returns **0**.
16. All 15 Group A policies are byte-identical to §5's table. A regression check:
    D1 must not have "tidied" a working policy.
17. All 21 Group C policies are unchanged.
18. `tickets_insert`'s `with_check` still contains every one of
    `source = 'customer'`, `created_by = auth.uid()`, `status = 'open'`,
    `priority = 'normal'`, `assignee IS NULL`, `resolved_at IS NULL`.
19. `ticket_comments_insert` and `ticket_comments_select` still contain
    `is_internal = false` and, for insert, `author = auth.uid()`.
20. A member of sites A and B sees rows from both, and only both, in `ai_results`,
    `prompts`, `competitors`, `seo_pages`, `social_posts`, `tickets` and
    `client_notifications`. Run with a populated site C present and assert **zero**
    C rows.

### 18.4 Shared limits — R2

21. **The prompt cap is account-level.** Account with sites A and B, both
    Essentials. Create prompts up to the cap on A. The next prompt **on site B**
    is refused with `prompt_cap_reached`. Under per-site enforcement it would
    succeed — this criterion is the whole of R2.
22. Deactivating a prompt on A immediately allows one more on B.
23. Editing a prompt's text on an account already at cap succeeds. Regression
    against the existing early-return.
24. An INSERT as `service_role` still bypasses the cap (unchanged behaviour,
    §14.3 hole, asserted so its removal is a deliberate act).
25. `is_admin()` still bypasses the cap.
26. **`account_plan` ranks by `PLAN_ORDER`, not by allowance.** Account with one
    `essentials` site and one `growth` site (both allow 2 sites) resolves to
    `growth`. §7.1 finding 2.
27. **The EUR budget is account-level.** Account with sites A and B. Spend A to
    its plan budget. A collection call for **B** is blocked with
    `reason: 'monthly_budget'`.
28. With the account lookup made to fail, `checkCollectionLimits` returns
    `blocked: true, reason: 'account_unresolved'`. **F4** — never `blocked: false`.
29. The **hourly ceiling** remains per site: two sites in one account each get
    their own ceiling. §8.1, asserted so a builder cannot quietly "fix" it.
30. `grep -rn "clientSpent\|clientBudget" brandgeo-dashboard/` returns **0** hits.
    The rename in §8.4 is complete, including `Usage.tsx`.

### 18.5 The ladder

31. **Drift check.** A test reads `PLAN_PROMPTS` and `PLAN_SITES` from
    `planConfig.ts`, `plan_prompt_caps.prompt_cap` and `.site_allowance` from
    Postgres, and asserts equality for **all seven plans on both columns**.
    Failing this means the pricing page promises what the database refuses.
32. `PLAN_PROMPTS` is strictly increasing across
    `free < essentials < growth < growth_pro < managed`, and
    `PLAN_PROMPTS[pro] === PLAN_PROMPTS[managed]`.
33. **Run before step 5:** no client currently holds more active prompts than the
    new cap for its plan. Proves the ladder change can only raise, never lower.
34. `PLAN_SITES[pro] === PLAN_SITES[managed]` (10). §9.3's second required change.
35. For every plan `p` except `enterprise`,
    `PLAN_PROMPTS[p] × per_prompt_monthly_cost(p) <= PLAN_MONTHLY_API_BUDGET_EUR[p]`.
    No tier is sold a pool it cannot afford to collect.

### 18.6 Sites, nudge and over-allowance

36. `create-site.js` returns **409 `site_allowance_reached`** when
    `sites_used >= PLAN_SITES[account_plan]`, with `upgrade_to` populated (null
    only at `enterprise`).
37. `create-site.js` **succeeds** for a lower-tier site within allowance,
    **whether or not** `acknowledged_downgrade` is sent. R4: never a gate.
38. `create-site.js` writes both the `clients` row (with the caller's
    `account_id`) and the `user_clients` row. Assert both, separately.
39. `create-site.js` returns 403 to a member who is not `accounts.owner_user_id`
    and not a platform admin.
40. The nudge renders only when
    `PLAN_ORDER.indexOf(chosen) < PLAN_ORDER.indexOf(account_plan)`, and
    `suggested_plan` always has a **strictly larger** `PLAN_SITES` than
    `account_plan`. Under R1, Essentials → Growth must never be suggested: both
    allow 2.
41. The nudge's lower-tier action is reachable in **one click** and is never a
    disabled control.
42. **Over-allowance.** Force an account to three sites, then downgrade so the
    allowance is 2. Assert: no site deleted, no site suspended, all three readable
    and writable, `create-site.js` refuses, an `account_over_allowance` admin event
    exists, and **no prompt was deactivated**. §8.5 rule 3.

### 18.7 Billing

43. A `checkout.session.completed` with `metadata.client_id` for a site the buyer
    is a member of provisions **that** site and no other.
44. The same event naming a site the buyer is not a member of provisions nothing
    AND records an admin event. Assert no `clients` row changed.
45. The same event with no `metadata.client_id`, from a buyer holding ≥1
    membership, provisions nothing AND records an admin event. The
    agency-second-purchase case.
46. The same event with no `metadata.client_id`, from a buyer with **zero**
    memberships, behaves **exactly as today**: creates a client, invites, inserts a
    profile — and now also creates an `accounts` row. Regression risk, not a hope:
    `createClientRow` is shared.
47. Neither failure branch throws. The handler returns 200 and the `stripe_events`
    idempotency row **survives**, so Stripe does not redeliver.
48. `expire-plan-grants.js` reverts exactly the site whose grant expired and
    leaves the account's other sites untouched. Fixture: one account, three sites,
    one expiring package.
49. **A subscription cancellation on site B downgrades only site B.** The §10.1 B1
    fan-out bug; a fixture must prove the loop at `stripe-webhook.js:516` touches
    one row.
50. No hardcoded plan list is added anywhere. `custom-entitlements.md` §4.5,
    inherited verbatim.

### 18.8 Performance

51. `EXPLAIN (ANALYZE, BUFFERS)` on a member's
    `select * from ai_results where client_id = $1` shows an index scan and **no
    sequential scan on `user_clients`**.
52. `EXPLAIN` on a prompt INSERT shows an index scan on `idx_clients_account_id`
    and **no sequential scan on `clients`**.
53. Production bundle grows by **≤ 8 KB gzipped** against the pre-D1 build.
    Measure both; do not estimate one.
54. `package.json` dependency count is unchanged.

### 18.9 Frontend

55. A user with one site sees **no** switcher — not a disabled one, not an empty
    one.
56. A user with two sites sees the switcher, and switching re-renders every page
    against the new site with no stale data from the previous one.
57. A platform admin's view is unchanged from today.
58. If the `user_clients` read fails, the user still reaches their primary site and
    sees no error state or blank list.
59. If the account read fails, the allowance and consumption UI is **hidden**, not
    rendered as `0 of 0`. §6.8.
60. No client-facing surface displays a euro figure of API cost. `Usage.tsx`
    remains admin-only (`Usage.tsx:142`). ROADMAP A6's constraint, re-asserted
    because §8.4 moved the numbers it guards.

---

## 19. What this spec deliberately does NOT do

Scope discipline. Each is filed rather than smuggled in.

1. **No cross-site roll-up or Compare view.** §13, R5. File as **D2**.
2. **No agency tier and no multi-account pricing.** R1 settles it: allowances ride
   the existing ladder. `PRICING-SPEC.md:24` and `:61` already list
   "multi-country, multi-brand" inside Pro, which D1 makes true for the first
   time. Reconciling that page is `bg-copy`'s, after §20 Q2.
3. **No consolidation of the duplicate SELECT policies** on `ai_results`,
   `prompts` and `competitors` (§5 Group A hazard). Both members of each pair are
   correct today; deduplicating them during a security migration doubles the
   review surface for zero behaviour change. File as **"RLS policy
   deduplication"**.
4. **No consolidation of `is_admin()` and `my_role() = 'admin'`** (§7.1 finding
   3). ~40 policies, zero behaviour change. File as **"admin predicate
   consolidation"**.
5. **No rename of `plan_prompt_caps`**, which now holds site allowances too
   (§6.4). Renaming a live table backing a `SECURITY DEFINER` trigger buys nothing
   here. File as **"plan_prompt_caps rename"**.
6. **No rename or drop of `user_profiles.client_id`.** After step 8 it is a
   landing-site default with no authorization meaning. File as low priority.
7. **No moving a site between accounts.** Every site stays in the account that
   created it. An agency acquiring another's site is a real future need and a
   genuinely hard one, because it moves consumption between pools mid-month. File
   as **"site transfer between accounts"**.
8. **No per-site or per-account seat limits.** A site may have unlimited members.
9. **No fix for the `service_role` prompt-cap bypass** (§14.3). Owner A6.
10. **No migration file for `clients.plan`.** Still the only column on `clients`
    with no migration on disk. Pre-existing hygiene.
11. **No decision on the TalentWeLove tables** sharing this Postgres instance (§5
    Group D). §20 Q3.
12. **No SSO.** `accounts` is a limits-and-billing grouping, not an identity
    provider.

---

## 20. Decisions still Constantin's

Three remain. The four from the first version are answered by §2.

**Q1. What does a second site's subscription buy, given the pool does not grow?**
§8.2 rules the shared pool is the account's **highest** plan's allocation, per the
brief's own arithmetic. Under that rule a second Essentials site at EUR 99/month
adds a dashboard, its own 3 engines, its own cooldown and its own SEO depth — but
**zero** extra prompts and **zero** extra EUR budget, so it competes with the
first site for the same pool.

The alternative is **SUM**: the pool is the sum of each site's own allocation, so a
Growth + Essentials account gets 50 + 20 = 70 prompts and EUR 44.85 + 14.85 =
EUR 59.70.

| | MAX (as specified) | SUM |
|---|---|---|
| Growth + Essentials pool | 50 prompts, EUR 44.85 | 70 prompts, EUR 59.70 |
| BrandGEO revenue | EUR 398 | EUR 398 |
| API budget committed | EUR 44.85 (11.3% of revenue) | EUR 59.70 (15.0%) |
| Customer experience | site 2 degrades site 1's data | both sites fully funded |
| R4 nudge | strongly motivated | still true, less urgent |
| Implementation | as written | `account_plan` stays MAX for the **site allowance**; the pool becomes a sum. One extra branch |

*Recommendation:* **SUM for the pools, MAX for the site allowance.** MAX must stay
for the allowance or adding a site earns room for another site (§8.2). But MAX for
the pool means a customer pays EUR 99 and their existing site gets worse, which is
a product defect dressed as a pricing rule. SUM still respects R2 — the pool is
shared across sites, it is just funded by all of them — and it holds margin at
exactly the 15% the ladder was designed around. Say the word and §8.2, §8.3, §8.4
and §9 change in one pass; the criteria in §18.4 need only their fixture numbers
updated.

**Q2. Adopt §9.3's ladder?** `PLAN_PROMPTS` becomes
`5, 20, 50, 75, 250, 250, 100000` and `pro`'s allowance drops from 20 to 10. Cost:
the modelled API spend rises to 88% of the existing 15% ceiling on Growth PRO and
Managed, and the ceiling itself does not move.
*Recommendation:* **adopt.** These are the numbers the cost table at
`planConfig.ts:400-420` was built for and which its own prose says were restored
and never were. Adopting closes ROADMAP's open "three conflicting Growth prompt
counts", removes both ladder inversions, and makes a Growth PRO upgrade deliver
something — today it delivers zero extra prompts for EUR 150. **This gates R4's
nudge copy:** at today's numbers `extra_prompts` is 0 at the Growth → Growth PRO
boundary and the nudge cannot be written without saying something false (§12.4).
If the cost is unwanted, §9.4 records the arithmetic floor, which is correct and
commercially inert.

**Q3. TalentWeLove tables in the BrandGEO database.** `subscribers`, `contracts`,
`contract_events`, `quotes`, `quote_roles` and seven `twl_*` functions live in
`public` on `duiyifepitvugyulobqm` alongside BrandGEO's schema.
*Recommendation:* out of scope for D1, but worth a deliberate decision. They are
correctly RLS-scoped on `subscribers.owner_user_id` and leak nothing today. The
risk is a future BrandGEO migration that enumerates `public` and touches them.

---

## 21. Handoff packets

Four, with disjoint `scope_write`. `bg-verify` runs **twice**: once on this
document before any build, per ROADMAP D1's sequencing, and once after.

### Packet A — `bg-architect` → `bg-verify` (pre-build)

```
to: bg-verify   model: opus   status: READY
scope_write: docs/qa/multi-site-tenancy-boundary-review.md
scope_read:  docs/arch/multi-site-tenancy.md,
             brandgeo-dashboard/netlify/functions/_auth.js,
             brandgeo-dashboard/netlify/functions/_cost.js,
             brandgeo-dashboard/src/lib/planConfig.ts,
             brandgeo-dashboard/src/lib/clientContext.tsx,
             brandgeo-dashboard/netlify/functions/stripe-webhook.js,
             live Supabase (read-only)
```
Adjudicate INVARIANT M (§4.3) and the fail-closed rules (§4.4) **before a line is
written**. Re-derive §5's 77-policy classification independently from
`pg_policies`. Re-derive §9's arithmetic independently — the ladder recommendation
is a billing decision and must not be taken on trust. Confirm `user_clients` still
holds 0 rows and no write path has appeared.

### Packet B — `bg-architect` → `bg-strategy` (the two open rulings)

```
to: bg-strategy   model: opus   status: NEEDS_HUMAN
scope_write: docs/strategy/multi-site-pricing.md
scope_read:  docs/arch/multi-site-tenancy.md §8, §9, §20,
             docs/PRICING-SPEC.md, brandgeo-dashboard/src/lib/planConfig.ts
```
§20 Q1 (MAX vs SUM pools) and Q2 (the ladder). Both are pricing, not architecture.
**Q2 blocks the R4 nudge copy and therefore blocks `bg-copy`.**

### Packet C — `bg-architect` → `bg-backend` (steps 1-8, and 9's server half)

```
to: bg-backend   model: opus   status: BLOCKED on Packet A; step 5 BLOCKED on Packet B
scope_write: db/supabase-multisite-accounts-migration.sql,
             db/supabase-multisite-membership-migration.sql,
             db/supabase-plan-ladder-migration.sql,
             db/supabase-account-prompt-cap-migration.sql,
             db/supabase-multisite-rls-migration.sql,
             db/supabase-multisite-close-legacy-migration.sql,
             db/supabase-multisite-rollback.sql,
             brandgeo-dashboard/netlify/functions/_auth.js,
             brandgeo-dashboard/netlify/functions/_cost.js,
             brandgeo-dashboard/netlify/functions/client-members.js,
             brandgeo-dashboard/netlify/functions/create-site.js,
             brandgeo-dashboard/netlify/functions/stripe-webhook.js,
             brandgeo-dashboard/netlify/functions/provision-account.js,
             brandgeo-dashboard/netlify/functions/onboard-client.js,
             + the 19 files listed in §4.1
scope_read:  docs/arch/multi-site-tenancy.md,
             docs/arch/custom-entitlements.md,
             docs/qa/multi-site-tenancy-boundary-review.md
```
Opus, not Sonnet: auth and billing, AGENT-OS §2. One commit per step, never two
steps in one commit.

### Packet D — `bg-architect` → `bg-app` (step 9's client half)

```
to: bg-app   model: sonnet   status: BLOCKED on Packet C step 7
scope_write: brandgeo-dashboard/src/lib/planConfig.ts,
             brandgeo-dashboard/src/lib/clientContext.tsx,
             brandgeo-dashboard/src/components/Layout.tsx,
             brandgeo-dashboard/src/pages/Account.tsx,
             brandgeo-dashboard/src/pages/Usage.tsx,
             brandgeo-dashboard/src/pages/Prompts.tsx
scope_read:  docs/arch/multi-site-tenancy.md §6.8, §12, §15.3, §18.6, §18.9
```

**Disjointness proof.** A writes only `docs/qa/`. B writes only `docs/strategy/`.
C writes only `db/` and `brandgeo-dashboard/netlify/functions/`. D writes only
`brandgeo-dashboard/src/`. The four sets share no path and no prefix. AGENT-OS
§1's directory rule is satisfied because each packet names exact files.

**One coupling that scopes do not express.** `planConfig.ts` (D) and `_cost.js`
(C) are the two copies of the ladder and must land in the **same cycle** —
criterion 31 fails otherwise. C ships the SQL; D ships the TypeScript; the
orchestrator commits them together.

**Ordering is not disjointness.** Run C and D serially in the §17 order despite
disjoint scopes. Git stays serialized regardless (AUTONOMY §2).

---

## 22. Answers to the `bg-architect` calibration

1. Three collection entry points in `brandgeo-dashboard/netlify/functions/`:
   `collect-prompt.js`, `collect-claude.js`, `collect-chatgpt.js`. Shared module:
   `_analysis.js` (via `_collect.js`, which the three are now thin wrappers over).
2. `buildSystemContext(cfg, marketLabel, regionLabel)` — **not re-verified this
   session.** It sits outside D1's read allowlist and no claim in this document
   depends on it. Recorded as unverified rather than asserted.
3. The dashboard authenticates by sending the Supabase JWT as
   `Authorization: Bearer <token>`; `_auth.js:85-96` extracts it and calls
   `supabase.auth.getUser(token)`, 401 on missing (`:88`) or invalid (`:95`).
   Origin is separately whitelisted at `_auth.js:80`.
4. Tables written by the collection path: `ai_results` (the
   `service_insert_ai_results` policy for `service_role` is the only INSERT policy
   on it), plus `collection_jobs` and `collection_runs` for queue state.
5. **Unknown.** The production bundle size of `brandgeo-dashboard` was not
   measured this session. To measure: `npm run build` in
   `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard`, then read
   the gzip column of Vite's `dist/assets/index-*.js` line. Criterion 53 requires
   this baseline before and after; guessing it would fail AUTONOMY §1.
6. `docs/AGENT-OS.md` §1: `bg-architect` | Opus 5 | owns `docs/arch/` | never
   writes any implementation file.

**CALIBRATED** — with answers 2 and 5 recorded as unverified and unknown
respectively, neither load-bearing for anything above.
