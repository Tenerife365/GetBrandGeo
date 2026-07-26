# activation-path.md

Owner: `bg-architect` · Packet: `.claude/handoffs/003-bg-strategy-to-bg-architect-activation-path.md`
Date: 2026-07-26 · Upstream: `docs/strategy/activation-thesis-app.md`

Scope of this file: it answers the four questions in packet 003 and specifies the
boundaries, state ownership and single-source-of-truth rulings that a builder
needs. It contains no implementation code, and it changes no pricing, no plan
gating, and nothing about what any tier includes.

Every claim names the file and line it came from. Where two files disagree, both
are quoted and one is named authoritative.

---

## 0. Item 1, answered first: `provision-account.js` does not seed prompts

**It does not.** The function performs exactly two writes on the first-time path:
one `clients` insert and one `user_profiles` insert. There is no `prompts`
insert, no `competitors` insert, and no collection trigger. The whole of the
first-time provisioning block, `provision-account.js:148` to `:201`:

```js
  // ── First-time provisioning: create clients row, then user_profiles ───────
  const baseSlug = slugify(accountType === 'company' ? brandWebsite.split('.')[0] : brandName)

  let clientRow = null
  let clientErr = null
  for (let attempt = 0; attempt < 5 && !clientRow; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: brandName,
        slug,
        brand_website: brandWebsite,
        brand_aliases: brandAliases,
        plan: 'free',
        default_market_id: 'WW',         // never default to a country (§4.1)
        onboarding_complete: true,
      })
      .select('id')
      .single()
    if (!error) { clientRow = data; break }
    clientErr = error
    if (error.code !== '23505') break     // not a slug collision — real failure
  }

  if (!clientRow) {
    console.error('[provision] client insert failed:', clientErr?.message)
    return fail(500, 'Account setup failed. Please try again.')
  }

  // 🔴 role MUST be 'viewer' — see security note 1.
  const { error: profileErr } = await supabase
    .from('user_profiles')
    .insert({ id: user.id, client_id: clientRow.id, role: 'viewer' })
```

The idempotent re-run branch (`:124` to `:146`) writes even less: a single
`clients` update of `name`, `brand_website`, `brand_aliases` and
`onboarding_complete`. No prompts there either.

The function's own header docstring lists its entire contract at `:31` to `:35`,
and the POST body it accepts has no prompt field:

```js
 * POST body:
 *   { account_type: 'company' | 'personal',
 *     brand_name?: string,        // required for personal; derived from domain for company
 *     brand_website?: string,     // required for company; optional link for personal
 *     brand_aliases?: string[] }  // optional extra names/handles
```

### 0.1 What this does and does not mean

The strategy artifact's §3.1 stated the consequence conditionally: "If it does
not, then the activation metric in §1 is unreachable by any self-serve account
without admin intervention." **That stronger conclusion does not hold.** The
metric is reachable without an admin. Two things the strategy packet's read
allowlist could not see make it reachable:

1. **A viewer may write their own prompts.**
   `db/supabase-prompts-own-client-writes-migration.sql` exists precisely for
   this, is recorded as applied live on 2026-07-13, and its stated problem
   (`:8` to `:13`) is the one §3.1 rediscovered: "Every self-serve account is
   provisioned as `viewer` … so a paying customer landed on a dashboard they
   could not fill." The policy is
   `WITH CHECK (is_admin() OR client_id = get_my_client_id())` at `:37` to `:39`.
   `src/pages/Prompts.tsx:182` to `:203` is an ungated add-prompt path, and
   `src/App.tsx:109` puts `/prompts` behind `PrivateRoute` only, with
   `src/components/Layout.tsx:131` listing it in the nav for every user.

2. **A viewer may start their own collection.**
   `src/pages/AIVisibility.tsx:579` to `:588` is a primary button with no
   `isAdmin` guard, and the comment above it at `:572` to `:578` states the
   intent explicitly: "Visible to VIEWERS too, not just admins: a self-serve
   client MUST be able to trigger their own collection". The same comment adds
   that without it a free signup "can add prompts but never see a single
   result", leaving the product inert for them.
   The server agrees: `enqueue-collection.js:36` to `:39` permits a
   non-admin to enqueue for their own `client_id` and 403s only on mismatch.

So the accurate finding is narrower and more actionable than "unreachable":

> **First Own Score is reachable by a self-serve account with no admin
> involvement, but only if the user independently discovers two pages that
> nothing routes them to, in the right order.** `provision-account.js` hands
> them a client with zero prompts, and `Welcome.tsx:88` drops them on `/`, which
> has neither a prompt entry point nor a collection trigger.

That is a routing and empty-state problem, not a permissions problem, and it is
cheaper to fix than §3.1 implied. §2 below specifies the path precisely.

### 0.2 A third gap, not in the packet: the new client never auto-collects

`provision-account.js` also does not set `refresh_cadence`. The column defaults
to `'manual'` (`db/supabase-collection-queue-migration.sql:85`), and that default
is deliberate: the migration's own note at `:77` to `:83` explains it was
changed from the spec's `'weekly'` so that "the scheduler does NOTHING for a
client until someone explicitly sets a real cadence on that client."

Correct as a spend guard, and it means a self-serve account will never collect on
its own. Whether a `free` client should get a cadence is a pricing question and
belongs to `bg-strategy`, not here. Flagged, not decided. See §5.3.

---

## 1. Item 2: First Own Score can be a rate. The timestamp exists.

**Confirmed. `clients` carries a creation timestamp.**
`db/supabase-multitenant-migration.sql:8` to `:15`:

```sql
CREATE TABLE IF NOT EXISTS public.clients (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  slug           TEXT UNIQUE NOT NULL,
  brand_aliases  TEXT[],     -- variants used for detection
  brand_website  TEXT,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

It is already read by the frontend: `clients.created_at` is in `CLIENT_SELECT`
at `src/lib/clientContext.tsx:63`, and `src/pages/Account.tsx:334` uses it as the
fallback for a client's start date.

So the metric can be expressed as a rate. Three things must be specified for that
rate to mean anything.

### 1.1 The two timestamps are both naive, and that is fine

`clients.created_at` is `TIMESTAMP` (no time zone), and so is
`ai_results.checked_at` (`db/supabase-full-seed.sql:90`). Both are written by
`NOW()` server-side on the same Postgres instance, so
`checked_at - created_at` is a valid interval and needs no cast.

The trap is mixing in a third table. `admin_notifications.created_at` is
`timestamptz` (`db/supabase-admin-notifications-migration.sql`), so any query
joining it to `clients.created_at` needs an explicit cast. Named because §1.2
recommends using that table.

### 1.2 The cohort must exclude non-self-serve clients

`clients` holds more than self-serve signups: two seeded internal clients
(`supabase-multitenant-migration.sql:18` to `:21`), the seven city-research
clients at ids 10 to 16 (named in `supabase-collection-queue-migration.sql:78`
to `:79`), admin-onboarded clients from `onboard-client.js`, and Stripe-created
clients from `stripe-webhook.js`. A rate over all of them measures the wrong
population.

**Ruling: the self-serve cohort is defined by `admin_notifications` rows with
`type = 'new_signup'`.** `provision-account.js:195` to `:201` writes exactly one
such row, once, on the first-time path only, carrying `client_id`:

```js
  await recordAdminEvent(supabase, {
    type: 'new_signup',
    client_id: clientRow.id,
    title: `New signup: ${brandName}`,
```

That gives a precise, already-populated cohort with its own `timestamptz` and no
new instrumentation. Do not use `plan = 'free'` as the discriminator. A client's
plan changes (`set-client-plan.js`, `stripe-webhook.js`, `expire-plan-grants.js`
all write it), so it does not record how the account arrived.

### 1.3 Definition to implement

Event, unchanged from the strategy artifact: the first `ai_results` row for the
client's `client_id` with `status <> 'error'`, timestamped `checked_at`.

Rate: over clients in the §1.2 cohort, the share whose earliest such
`checked_at` falls within N hours of the client's `created_at`. Report the
denominator alongside it, because the cohort is small enough that a percentage alone
will mislead.

Where it is computed: a read-only admin surface. `Usage.tsx` is the existing
admin-only aggregate over `ai_results` (`:112` returns `null` for non-admins) and
is the natural host. No client-side event tracking is needed or wanted for this
metric; it is derivable from rows the product already writes, which is the
property that made it the right choice.

---

## 2. Item 3: where a self-serve user starts their first collection

Two answers, because there are two questions inside this one: where the control
lives today, and where it must be reachable from.

### 2.1 The control today: `AIVisibility.tsx`, and it works for viewers

The complete path from provisioning to a first non-error row:

| # | Step | Where | Reachable by a viewer? |
|---|---|---|---|
| 1 | Provision client, zero prompts | `provision-account.js:148`-`:201` | yes, automatic |
| 2 | Land on `/` | `Welcome.tsx:88` → `Dashboard.tsx` | yes, automatic |
| 3 | **Add ≥1 prompt** | `Prompts.tsx:182`-`:203`, route `App.tsx:109` | yes, but nothing routes them here |
| 4 | **Press Run Collection** | `AIVisibility.tsx:579`-`:588` | yes, ungated |
| 5 | Enqueue run | `enqueue-collection.js`, ownership check `:36`-`:39` | yes |
| 6 | Worker collects server-side | `collection-worker-background.js` | n/a |
| 7 | Poll until done | `collectionContext.tsx:116`-`:131` | yes |

Steps 3 and 4 are the two the product does not lead them to. Step 4 is a
different page from where step 3 happens, and neither is `/`.

### 2.2 The two silent failures on that path

Both are dead ends that produce no user-visible message. Both are specification
gaps for `bg-design` and `bg-copy`, and neither requires a schema change.

**Failure A, zero prompts produces a silent no-op.**
`_enqueue.js:89` to `:90`:

```js
  if (!prompts || prompts.length === 0)
    return { runId: null, totalJobs: 0, skipped: true, reason: 'no active prompts' }
```

The browser receives that and logs it to the console.
`collectionContext.tsx:100` to `:106`:

```js
      // Nothing to collect (all done this month), blocked by budget, or an error —
      // no run to watch. Refresh once so any just-freed state shows, then stop.
      if (!resp || resp.skipped || !resp.run_id) {
        if (resp && resp.reason) console.log('[Collection] enqueue skipped/blocked:', resp.reason)
        setLastCompletedAt(Date.now())
        return
      }
```

A new user who finds the Run Collection button before finding the Prompts page
presses it, sees the spinner flash, and gets nothing. This is the single worst
moment on the activation path, because it is the one place the user does the
right thing and the product appears to break.

**Nine distinct outcomes drain through that one branch.** The 429s land there
too, because `collectionContext.tsx:89`-`:98` parses the response body without
ever checking `resp.status`, so a 429's `error` and `reason` fall into the same
`resp.skipped || !resp.run_id` test. The complete list, for `bg-design` to map to
surfaces without recounting:

| # | Outcome | Source |
|---|---|---|
| 1 | `'client not found'` | `_enqueue.js:69` |
| 2 | `'no active engines'` | `_enqueue.js:80` |
| 3 | `'no active prompts'` | `_enqueue.js:90` |
| 4 | `'nothing to collect (already up to date)'` | `_enqueue.js:177` |
| 5 | `run insert failed: <msg>` | `_enqueue.js:185` |
| 6 | `jobs insert failed: <msg>` | `_enqueue.js:204` |
| 7 | 429 cooldown, carries `retry_after_hours` and `next_available_at` | `enqueue-collection.js:47` |
| 8 | 429 budget or hourly ceiling | `enqueue-collection.js:59` |
| 9 | `!resp`, the fetch itself failed or returned unparseable JSON | `collectionContext.tsx:98`, `:102` |

They are not one message. 3 is a setup gap, 4 is success, 7 and 8 are plan
limits, and 1, 5, 6 and 9 are faults. A single generic failure string would be
wrong for at least five of the nine.

**Contract for the builder:** `runCollection` must surface a typed outcome to
its caller rather than swallowing it. The reason strings above are the
enumeration; they already exist and are stable. This is a change to
`collectionContext.tsx`'s return type, not to any function or table.

**Failure B, `/` offers neither step 3 nor step 4.**
The only button in the `Dashboard.tsx` header calls `load()`, which issues three
Supabase reads and starts nothing (`Dashboard.tsx:364`-`:366`). The empty states
link to `/ai-visibility` (`:513`, `:577`, `:591`, `:611`), which is the page with
the button but not the page with the prompts. A user arriving with zero prompts
is sent to the one page that will silently fail for them.

**Ruling on where the start control belongs:** the collection trigger stays owned
by `AIVisibility.tsx`. Do not add a second `startCollection` call site on
`Dashboard.tsx`; two independent triggers against a `runningRef`-guarded
singleton (`collectionContext.tsx:71`-`:73`) would let one page appear idle while
the other collects. What `/` needs is a *route* into the correct next step, and
for a zero-prompt account the correct next step is `/prompts`, not
`/ai-visibility`. The branch condition is already computed on the page:
`Dashboard.tsx:196` queries active prompts for the client.

### 2.3 Correction: collection is server-side, and a scheduler exists

The strategy artifact's §4.3 records, from `docs/STATE-OF-PRODUCT.md` §4.1, that
"collection runs sequentially in the user's browser tab with no queue and no
scheduler." **That is stale.** `docs/STATE-OF-PRODUCT.md` needs updating; it is
outside this file's write scope, so it is flagged here rather than fixed.

What is actually live:

- A queue. `collectionContext.tsx:5`-`:10` states the architecture: "`runCollection()` → ENQUEUES a run (enqueue-collection.js) and then POLLS `collection_jobs` for progress. The engines run SERVER-SIDE in `collection-worker-background.js`, so the user can close the tab mid-collection and the run still finishes. The browser is a watcher, not the runtime."
- A scheduler. `netlify.toml:123`-`:124` registers `schedule-collections` on `schedule = "0 * * * *"`. Its comment at `:120`-`:122` states it "enqueues a fresh run for every client whose `refresh_cadence` is due … so this is inert until cadences are set per client."

The scheduler is built and running hourly; it is inert by data, not absent by
code. That distinction matters for the backlog item "implement scheduled
background triggers" in `CLAUDE.md`: the trigger exists, the per-client cadence
does not. See §5.3.

### 2.4 State ownership for a plan-limit surface reading `getPlanLimits()`

The packet asks for this to be specified. It is partly specified already by
working code, and the existing pattern is the right one. Restated as a contract:

**`getPlanLimits()` owns the cap. The page owns the count. The component owns
nothing.**

- **Cap**: derived synchronously from `activeClient.plan` via
  `getPlanLimits(plan)`. No fetch, no state, no cache. `activeClient` comes from
  `useClient()` (`clientContext.tsx:63` selects `plan`), which is already the
  single owner of plan facts in the React tree. A limit surface must never fetch
  a plan itself.
- **Count**: page-local state, loaded by a query that mirrors the exact query
  the enforcing Netlify function uses. This is the load-bearing rule.
  `AllowanceMeter.tsx:6` to `:8` states it: the meter is a "Read-only display
  component", and callers "own the underlying counts (each page mirrors the exact
  query its enforcing Netlify function uses, so the number shown here always
  matches what the server will actually block on)."
  `AIVisibility.tsx:304`-`:309` names the specific
  server functions it mirrors.
- **Display**: `AllowanceMeter` and `CooldownCountdown` are pure props-in
  components with no data access (`AllowanceMeter.tsx:10`-`:22`).
- **Invalidation**: the count effect re-runs on
  `[activeClientId, activeClient?.plan, lastCompletedAt]`
  (`AIVisibility.tsx:351`). `lastCompletedAt` from `useCollection()` is the
  existing cross-page "data changed" signal; a new limit surface must depend on
  it rather than polling.
- **Authority**: display only. The server call at click time is the authority,
  and the client-side check exists to explain the block before it happens, not
  to be the block. `AIVisibility.tsx:308`-`:309` says this; keep it true.

**Which limits already have a surface, and which do not.** `getPlanLimits()`
returns eight values (`planConfig.ts:287`-`:296`). Current readers:

| Limit | Surfaced at | Status |
|---|---|---|
| `collectionCooldownH` | `AIVisibility.tsx:321`, `:624` | built |
| `apiBudgetEur` | `AIVisibility.tsx:321`, `:626`-`:631` | built |
| `seoPages`, `seoAuditsPerWeek`, `seoDraftsPerMonth` | `SEO.tsx:458` | built |
| `socialChannels` | `Social.tsx:1374` | built |
| `socialPostsPerChannel` | `Social.tsx:1429` | built |
| **`prompts`** | **nowhere** | **unbuilt** |

`PLAN_PROMPTS` (`planConfig.ts:207`) is read only by `getPlanLimits` itself, and
no page destructures `prompts` from it. Nothing enforces it server-side either:
`grep -rn "PLAN_PROMPTS\|limits.prompts"` over `src/` and `netlify/functions/`
returns only the declaration and the `getPlanLimits` reference. So a `free`
account can add unlimited prompts through `Prompts.tsx:182` and pay for all of
them against the €0.30 monthly budget, which is what will actually stop them,
as an opaque 429, not as "5 of 5 prompts used".

**Ruling:** the prompt allowance is the one metered dimension with no surface,
and `Prompts.tsx` is its owner. `AllowanceMeter` with
`label="Prompts"`, `used={prompts.length}`, `cap={getPlanLimits(plan).prompts}`
fits the existing contract with no new primitives. Whether the cap should also
be *enforced* server-side is a `bg-strategy` and `bg-backend` decision, not one
this file makes. Surfacing it is strictly an improvement either way.

### 2.5 Correction: State 4 is partly built, not unbuilt

The strategy artifact's §3.2 concludes "By that document's own task list, this
state is unbuilt," and §2 State 4 says the limits are "declared, and almost none
of them are shown to the user." That was a correct reading of `Dashboard.tsx` and
`planConfig.ts`, the two files the packet allowed, but it does not hold across
the app. Task T2a from `PRICING-STRATEGY-2026-07.md` §12, "cooldown countdown,
allowance meters, FeatureLocked add-on channels", has largely landed:

- `src/components/CooldownCountdown.tsx` and `src/components/AllowanceMeter.tsx`
  both exist.
- `AIVisibility.tsx:618`-`:633` renders the cooldown countdown and the monthly
  budget meter, both citing "PRICING-STRATEGY-2026-07 §12 T2a".
- `SEO.tsx` and `Social.tsx` render meters for their five dimensions.

What remains true, and is the actionable residue of §3.2: the prompt allowance
has no surface (§2.4), and `Dashboard.tsx` shows no plan name, allowance or
upgrade path anywhere in its 728 lines. The gap is `/` and prompts, not the
whole state.

---

## 3. Item 4: `_plans.js` versus `planConfig.ts`, adjudicated

### 3.1 Ruling

**`src/lib/planConfig.ts` is the single source of truth for the plan ladder:
which plans exist, their order, their labels, and which engines each includes.**

This is not a new decision. It is what all three files already claim:

- `planConfig.ts:2`-`:3`: "Single source of truth for engine/plan relationships."
- `_plans.js:2`-`:6`: "CommonJS mirror of the plan config the frontend keeps in `src/lib/planConfig.ts` … UPDATE THIS TOGETHER WITH planConfig.ts."
- `_cost.js:101`-`:103`: "Keep in sync with planConfig.ts's PLAN_ENGINES by hand."

The divergence is therefore a drift bug in one mirror, not an ambiguity needing
a ruling. `bg-strategy` was right to flag it and right about both specifics.

### 3.2 `_plans.js` is the only drifted copy

There are three server-side mirrors of plan facts. Two are current; one is not.

| | `growth_pro` present? | `growth` gets `google_ai`? | Matches `planConfig.ts`? |
|---|---|---|---|
| `planConfig.ts:46`-`:54` | yes (`:50`) | no (`:49`) | authoritative |
| `_cost.js:109`-`:117` (`PLAN_LIVE_ENGINES`) | yes (`:113`) | no (`:112`) | **yes** |
| `_cost.js:172`-`:180` (budgets) | yes (`:176`) | n/a | **yes** |
| `_plans.js:9`, `:17`-`:24` | **no** | **yes (`:20`)** | **no** |

`_cost.js` is the copy that enforces. `_enqueue.js:29` imports
`activeEnginesFor` and `PLAN_COLLECTION_COOLDOWN_HOURS` from it, and
`_auth.js`'s `checkCollectionLimits()` reads its budgets. So the good news is
that the drift has **no effect on entitlement or spend**: no over-plan engine
ever runs, and no budget is mis-enforced. The blast radius is confined to
`_plans.js`'s three consumers.

### 3.3 What the drift actually breaks

`_plans.js` is imported by three functions:

```
netlify/functions/expire-plan-grants.js:12   PLAN_LABELS
netlify/functions/set-client-plan.js:25      isValidPlan, planRank, planUnlocks, PLAN_LABELS
netlify/functions/stripe-webhook.js:29       PLAN_LABELS
```

Two real consequences, one of them on the revenue path.

**C1. Growth PRO cannot be assigned to a client. At all.**
`set-client-plan.js:116` gates on `_plans.js`'s `isValidPlan`, whose
`PLAN_ORDER` (`_plans.js:9`) has no `growth_pro`:

```js
  if (!isValidPlan(plan)) return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid plan. One of: free, essentials, growth, managed, pro, enterprise` }) };
```

`set-client-plan` is the only admin path that writes `clients.plan`. So an admin
who picks "Growth PRO" in the `Account.tsx` plan selector (which offers it, via
`PLAN_ORDER` from `planConfig.ts` at `Account.tsx:566`, and lists it as a tier at
`Account.tsx:41`) receives a 400 whose error message does not even mention the
plan they chose. Growth PRO is the €449 tier at the centre of
`PRICING-STRATEGY-2026-07.md`, and it is currently unassignable by any means.

This compounds a gap the strategy artifact already found on the marketing side:
`brandgeo/web/site.js:513` leaves `growth_pro` without a Stripe link, and
`stripe-webhook.js:37`-`:45` has no `growth_pro` price in `PRICE_TO_PLAN` and
excludes it from `SELF_SERVE_PLANS`. Growth PRO is unsellable self-serve *and*
unassignable by an admin. It exists in `planConfig.ts`, `_cost.js` and the
`Account.tsx` UI, and nowhere that can actually put a client on it.

**C2. A Growth customer is told by email that they get an engine they do not get.**
`_plans.js:20` gives `growth` five engines including `google_ai`. `planUnlocks()`
(`:57`-`:68`) filters that list by `LIVE_ENGINES`, which includes `google_ai` at
`:29`, then hands the result to `set-client-plan.js:45`, which builds the
customer-facing banner and email (`:50`-`:52`). `PLAN_BLURB.growth` at `:41`
says the same thing in prose: "Five AI engines with more prompts and markets".

So a client upgraded to Growth is emailed "5 AI engines monitored: ChatGPT,
Gemini, Claude, Perplexity, Google AI Mode." `planConfig.ts:49` gives Growth four
engines, and the comment at `:43`-`:45` states why Google AI Mode is withheld:
"Google AI Mode (SerpApi, the expensive engine) is Growth PRO and up only, to
protect SerpApi spend." `_cost.js:112` enforces the four. The customer is
promised an engine the product will never collect for them, in writing, at the
moment they pay more.

**C3. An unrecognised plan does not fail loudly. It silently becomes Free.**
This was verified by execution, not by reading; the evidence is in
`docs/qa/plans-divergence-b1.md`. `planUnlocks()` opens with
`const key = isValidPlan(plan) ? plan : 'free'` (`_plans.js:58`), so every fact it
returns for `growth_pro` is Free's: one engine, and the blurb "A single AI engine
(ChatGPT) so you can see where your brand stands." `planRank('growth_pro')`
returns `0` for the same reason (`:51`-`:54` returns `0` when the plan is not in
`PLAN_ORDER`), so `set-client-plan.js:47`-`:48` would classify a move from Growth
to Growth PRO as a **downgrade**. `PLAN_LABELS['growth_pro']` is `undefined`,
making `set-client-plan.js:150`'s `plan_grant_note` read "undefined trial".

This is more dangerous than the missing-key case, because nothing anywhere throws
or renders blank. A €449 tier would be described to its buyer as a one-engine
Free plan, in a downgrade-toned email. It is latent today only because C1 stops
the plan from being set through the one path that writes it, which means the fix
for C1 must not land before the fix for C3, or assigning Growth PRO starts
working and immediately sends that email.

### 3.4 Fix direction

Stated as a specification, not as code. For `bg-backend`, after `bg-verify`.
`bg-verify` has since run this section's checks by execution; the evidence and
the harness are in `docs/qa/plans-divergence-b1.md`.

**Land items 1 to 3 as one commit.** Do not fix `isValidPlan` on its own. C1 is
currently the thing preventing C3 from reaching a customer, so unblocking
Growth PRO assignment before the ladder and blurb are correct converts a latent
defect into a sent email describing a €449 plan as one-engine Free.

1. Regenerate `_plans.js`'s `PLAN_ORDER`, `PLAN_LABELS` and `PLAN_BLURB` from
   `planConfig.ts:159`, `:161`-`:169`, adding `growth_pro` in ladder position 3.
   Write a blurb for it that does not promise more engines than
   `planConfig.ts:50` grants.
2. **Delete `PLAN_ENGINES` from `_plans.js` entirely.** It is a duplicate of
   `_cost.js`'s `PLAN_LIVE_ENGINES`, both files are CommonJS, and `_plans.js` can
   require `_cost.js` directly. `planUnlocks()` is the only consumer, and
   `activeEnginesFor()` already does the same filtering the `LIVE_ENGINES` set at
   `_plans.js:29` was hand-maintaining. This collapses three server copies of the
   engine table to two, and leaves the remaining one as the copy that enforces.
   Prefer this to re-syncing a fourth copy by hand.
3. Correct `set-client-plan.js:116`'s hardcoded error string, which enumerates
   the plan list a second time in prose and will drift again on its own.
4. `growth_pro`'s missing Stripe price and checkout link (`site.js:513`,
   `stripe-webhook.js:37`) is a separate piece of work with a real external
   dependency: a live Stripe price must be created first. Not blocked on this
   fix and not part of it. For `bg-strategy` to sequence.

**Acceptance for `bg-verify` at B1:** with `_plans.js` fixed, `isValidPlan` must
accept every member of `planConfig.ts`'s `Plan` union, and
`planUnlocks(p).engineLabels` must equal `getActiveEngines(p, null)` for every
`p` in `PLAN_ORDER`. Both are checkable without running a collection.

---

## 4. Summary of the four answers

1. **`provision-account.js` does not seed prompts** (`:148`-`:201`, quoted in §0).
   Activation is nonetheless reachable without an admin, because viewers may
   write their own prompts (RLS migration, applied 2026-07-13) and start their
   own collection (`AIVisibility.tsx:579`). The real defect is that nothing routes
   a zero-prompt account to either, and that a zero-prompt collection attempt
   fails silently (`_enqueue.js:89`, `collectionContext.tsx:102`).
2. **`clients.created_at` exists** (`supabase-multitenant-migration.sql:14`), so
   First Own Score can be a rate. Restrict the cohort using
   `admin_notifications.type = 'new_signup'` (§1.2); do not use `plan = 'free'`.
3. **The first collection starts at `AIVisibility.tsx:579`**, viewer-usable, via
   `enqueue-collection.js` and a server-side worker. Keep that as the only
   trigger. `getPlanLimits()` surfaces follow cap-from-plan, count-from-page,
   display-only (§2.4); the prompt allowance is the one dimension with no surface
   and `Prompts.tsx` owns it.
4. **`planConfig.ts` is the single source of truth**, as all three files already
   declare. `_plans.js` is the lone drifted mirror; `_cost.js` is current and is
   what enforces. The drift makes Growth PRO unassignable
   (`set-client-plan.js:116`) and emails Growth customers a fifth engine they do
   not receive (`_plans.js:20`, `:41`).

---

## 5. Passed on, not decided here

1. **`docs/STATE-OF-PRODUCT.md` §4.1 is stale** on collection architecture. The
   queue, the server-side worker and the hourly scheduler are all live (§2.3).
   Outside this file's write scope.
2. **`CLAUDE.md` "Content Pipeline" and the §9 note** already record their own
   staleness. Unrelated to this packet, mentioned only so it is not rediscovered
   a third time.
3. **Should a `free` client have a non-manual `refresh_cadence`?** The scheduler
   is live and inert by default (§0.2, §2.3). Turning it on for `free` is a spend
   decision against a €0.30 monthly budget, not an architecture decision. For
   `bg-strategy`.
4. **Should `PLAN_PROMPTS` be enforced server-side, not just displayed?** Today
   nothing enforces it and the budget cap stops users instead, opaquely (§2.4).
   For `bg-strategy` to decide the intent, then `bg-backend`.
5. **Growth PRO's missing Stripe price.** External dependency; sequencing is
   `bg-strategy`'s (§3.4 item 4).

## 6. What this file does not decide

No pricing, no plan gating, no change to what any tier includes. No layout,
component, colour, type, motion or copy. §2.2's two failure modes and §2.4's
missing prompt meter are named as gaps with an owner, and `bg-design` and
`bg-copy` decide how they look and what they say. No implementation code.
