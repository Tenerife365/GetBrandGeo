# PASS WITH FINDINGS

Independent review of ROADMAP A1 (package payment provisioning), 2026-07-31.
Reviewer: `bg-verify` (Opus). Subject: uncommitted working-tree changes under
`brandgeo-dashboard/`.

Spec: `docs/arch/custom-entitlements.md` §2, §3, §4.
Files reviewed:

- `brandgeo-dashboard/netlify/functions/_package_checkout.js` (new)
- `brandgeo-dashboard/netlify/functions/stripe-webhook.js` (modified)
- `brandgeo-dashboard/netlify/functions/expire-plan-grants.js` (modified)
- `brandgeo-dashboard/tests/package_provisioning.test.js` (new)

**Verdict rationale.** All five of arch §4's acceptance criteria are met. The
declared deviation is correct and should be kept. The subscription path is
unchanged. Validation is genuinely fail-closed. Against that, one HIGH finding
(S1) puts a paying subscriber on the Free plan, and it is a state that only
becomes reachable because of this change. It does not force a FAIL for one
structural reason: `MIN_PACKAGE_MONTHS = 1` (`_package_checkout.js:68`), so the
earliest possible `plan_grant_until` is one month after the first package sale,
and `expire-plan-grants` cannot fire on any package before then. There is a
guaranteed window. **Release gate: A1 may ship. S1 must be closed before the
first package grant date, and before any package is sold to a client who holds
an active Stripe subscription.**

---

## Calibration

**1. Changed files vs declared scope.** No `git` command was run (instructed).
No handoff packet `014` exists in `.claude/handoffs/` — the highest is `013` —
so there is no `scope_write` on disk to check against. I took the four files
named in the review task as the declared scope. Corroborating evidence from
mtimes, `brandgeo-dashboard/`, files newer than 2026-07-30:

```
2026-07-31 07:57  netlify/functions/_package_checkout.js
2026-07-31 07:57  netlify/functions/stripe-webhook.js
2026-07-31 07:55  tests/package_provisioning.test.js
2026-07-31 07:54  netlify/functions/expire-plan-grants.js
2026-07-31 07:51  tests/no_answer_rows.test.js
2026-07-31 07:49  src/pages/AIVisibility.tsx
2026-07-31 07:49  src/pages/Dashboard.tsx
2026-07-31 07:49  src/lib/aiVisibilityScore.ts
2026-07-31 07:37  src/pages/AuditReport.tsx
2026-07-31 06:34  src/pages/AuditRequest.tsx  (+ Welcome, ResetPassword, Signup)
```

The four A1 files cluster at 07:54–07:57 and are the four most recent. The
`src/` and `no_answer_rows` files at 06:34–07:51 belong to a different
concurrent workstream and were not reviewed here. **mtime is not proof of
content change**; without git I cannot assert that no fifth file was edited.
Recorded under "What was not checked".

**2. Secret scan.** Run over the four files by name and pattern, values never
printed:

```
$ grep -niE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role" \
    netlify/functions/_package_checkout.js netlify/functions/stripe-webhook.js \
    netlify/functions/expire-plan-grants.js tests/package_provisioning.test.js
stripe-webhook.js:31: * Requires env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
stripe-webhook.js:36:const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
stripe-webhook.js:78:const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
stripe-webhook.js:90:  stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
expire-plan-grants.js:27: * ...authenticated by the X-Cron-Key shared secret.
expire-plan-grants.js:63:  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
```

**Count: 6 hits, 0 values.** Every hit is a variable name read from
`process.env` or a prose reference. No literal key, token, or connection string
in any of the four files. The Stripe price IDs at `stripe-webhook.js:57-71` are
`price_*` identifiers, which are not secrets, and are pre-existing.

**3. Acceptance criteria, verbatim from `docs/arch/custom-entitlements.md` §4.**
All five are stated below in the table. All five are objectively checkable
except criterion 1's write half and criterion 3, which are checkable only
against a database this review cannot reach (no Stripe test mode, no DB
writes). Those two are marked in the table and repeated under "What was not
checked". No criterion is unverifiable *as written*, so no BLOCK-back to the
author of the criteria.

**4. Baseline before this change.** `npx tsc --noEmit` exits **0**. Note this is
weak evidence about A1: `tsconfig.json` sets `"include": ["src"]`, and none of
the four changed files is under `src/`, so tsc neither compiles nor reads any of
them. `node --check` is the real syntax gate and is clean on all three function
files. All six harnesses in `tests/` pass, including the four that predate this
change, so no pre-existing failure exists that A1 could be blamed for or hide
behind.

```
OK  netlify/functions/_package_checkout.js
OK  netlify/functions/stripe-webhook.js
OK  netlify/functions/expire-plan-grants.js
PASS tests/analysis.test.js
PASS tests/competitor_aggregate.test.js
PASS tests/competitor_filter.test.js
PASS tests/engine_routing.test.js
PASS tests/no_answer_rows.test.js
PASS tests/package_provisioning.test.js
```

**5. Auth check guarding the most sensitive function touched.**
`stripe-webhook.js` is the most sensitive: it holds `SUPABASE_SERVICE_KEY`
(`:78`, RLS bypassed) and writes `clients.plan`. It deliberately does **not**
call `requireAuth` — Stripe calls it server-to-server with no JWT and from no
whitelisted origin. Its authentication is Stripe signature verification at
`stripe-webhook.js:90`, `stripe.webhooks.constructEvent(rawBody, sig,
process.env.STRIPE_WEBHOOK_SECRET)`, with a `400` and no processing on failure
(`:91-94`). The raw-body handling at `:84-86` is correct and unchanged — the
body is never `JSON.parse`d before verification. **This change does not touch
the auth path at all.** `expire-plan-grants.js` is gated by
`requireCronAuth(event)` at `:60-61`; also untouched by this change.

**6. Write access.** I wrote exactly one file, `docs/qa/package-provisioning-014.md`.
I edited none of the reviewed files. Mutation testing (section 6 below) was
performed on **copies** in the session scratchpad, never on the working tree;
the copies were restored and discarded, and the working-tree harness re-run
afterwards still reports 43 checks passed.

**CALIBRATED.**

---

## 1. Acceptance criteria

| # | Criterion (verbatim, arch §4) | Result | Evidence |
|---|---|---|---|
| 1 | "A `mode: 'payment'` session with valid metadata provisions a client at the right plan with `plan_source = 'package'` and a correct `plan_grant_until`." | **PASS** (resolution + date proven; the DB write is code review only) | Resolution: `node tests/package_provisioning.test.js` → `ok - mode=payment, plan=growth, months="12" resolves to growth / 12`; `ok - plan_source constant is 'package'`; `ok - 12 months from 2026-07-31 → plan_grant_until 2027-07-31`. Routing `stripe-webhook.js:157-162`, resolution `:203-221`, write `:287` / `:309` / `:331`. See caveat under "What was not checked". |
| 2 | "The same session with missing or invalid metadata provisions nothing AND records an admin event." | **PASS** | 18 negative cases in the harness, all `ok`, covering absent/empty/whitespace plan, unknown slug, typo, non-self-serve (`managed`), `free`, absent/empty/zero/37/120/negative/fractional/unit-suffixed/word months, plus `resolvePackage never throws, on any shape of junk`. Return-before-write at `stripe-webhook.js:206-215`; admin event `reportUnprovisionedPackage` at `:372-392`. Fail-closed trace in section 5. |
| 3 | "`expire-plan-grants` reverts a `package` client whose grant has passed." | **PASS** (source only; never executed against a DB) | `expire-plan-grants.js:69` `.in('plan_source', ['trial', 'comp', 'package'])`, `:70-72` non-null + `< today` + `plan != 'free'`, revert at `:88-90`. Harness: `ok - expire-plan-grants.js filters plan_source in (trial, comp, package)` and `ok - the source the webhook writes ('package') is the source the job reverts`. Boundary semantics asserted: `ok - grant is live on 2027-07-31 and due on 2027-08-01`. **See finding S1** — the filter is correct for the case §3.3 describes and wrong for a package holder who also has a subscription. |
| 4 | "A subscription checkout behaves exactly as it does today. This is a regression risk, not a hope: the shared `createClientRow` path changes." | **PASS**, with one deliberate, correct behaviour change (the declared deviation, section 2) | Full trace in section 4. Mode routing `stripe-webhook.js:157-162` is behaviour-identical to the old guard for `subscription`, absent, and `setup`. Plan resolution `:223` is character-identical to before (harness asserts the exact expression; mutation M7 kills it). `createClientRow` params required not defaulted (`:471-472`, mutations M5 and M8 both kill). New writes are `plan_source: 'stripe'` and `plan_grant_until: null`; neither value is in the revert filter — verified at `expire-plan-grants.js:69`, not accepted on assertion. |
| 5 | "No hardcoded plan list is added. Five copies is not a fix for four." | **PASS** | `SELF_SERVE_PLANS` was **moved**, not copied: `_package_checkout.js:63` is its only declaration, and `grep -rn "SELF_SERVE_PLANS" netlify src tests` shows the two consumers at `stripe-webhook.js:224` and `:399` both use the import. Harness asserts `SELF_SERVE_PLANS must be imported, not redeclared`. Ladder validity is derived from `_plans.js`'s `isValidPlan` (`_package_checkout.js:45,106`), and the harness asserts `SELF_SERVE_PLANS` is a subset of `PLAN_ORDER` (3 of 7). Mutation M12 (adding `managed`) is killed. |

No criterion is passed without a check having been run and its output seen.

---

## 2. Priority item 1 — the declared deviation from criterion 4

**Ruling: KEEP.** `stripe-webhook.js:287`

```js
const update = { plan, stripe_customer_id: custId, plan_source: planSource, plan_grant_until: grantUntil }
```

The builder's stated reason is sound and I verified both halves of it.

**Reason 1, the leak the deviation closes.** Without writing `plan_source` in
this branch, a client provisioned with `plan_source = 'package'` who later
converts to a monthly subscription would keep `plan_source = 'package'` and the
old `plan_grant_until`. `expire-plan-grants.js:69-72` matches on
`plan_source in ('trial','comp','package')` and `plan_grant_until < today`
regardless of anything else, so that paying subscriber would be reverted to
Free and emailed a lapse notice on the old package's end date. That is arch
§2.1's leak reproduced one step later. Confirmed by reading the filter, not by
accepting the claim.

**Reason 2, the pre-existing bug it also closes.** The same branch fixes a
defect that predates packages entirely: an admin-granted trial
(`set-client-plan.js:149-152` writes `plan_source: 'trial'` and
`plan_grant_until`) followed by a self-serve subscription would previously leave
both fields intact, and the expiry job would revert a paying subscriber to Free.
The deviation makes the paid checkout authoritative over the grant.

**Why "revert and close it another way" is worse.** The alternatives are (a)
adding a subscription-liveness check to `expire-plan-grants`, which is needed
anyway for S1 but leaves a stale `plan_source` lying about how the plan was set,
or (b) a separate reconciliation job, which is a fifth moving part in a system
already bitten by hand-kept mirrors. Writing the truth at the moment of payment
is the cheapest correct option and it keeps `plan_source` meaning what
`db/supabase-admin-plan-grants-migration.sql:29-35` says it means.

**One caveat that the deviation does not cover, and that matters:** it fixes the
`package → subscription` direction only. The `subscription → package` direction
is finding **S1** below, and the deviation is what makes that direction
reachable. Keeping the deviation is still right; S1 needs its own fix.

---

## 3. Priority item 2 — the side effect (`plan_source` NULL → `'stripe'`)

**Confirmed. The claim holds, and I verified it rather than accepting it.**

`createClientRow` now writes `plan_source: planSource`
(`stripe-webhook.js:487`); for a subscription that is `'stripe'`
(`:230`), where the insert previously wrote nothing and the column defaulted to
NULL.

**Neither value is in the revert filter.** `expire-plan-grants.js:69` is
`.in('plan_source', ['trial', 'comp', 'package'])`. `'stripe'` is absent, and a
NULL never satisfies an `IN` predicate. Read directly from the file.

**Nothing else in the repo branches on `plan_source` being null.** Full census
of every `plan_source` reference outside the changed files and docs:

| Site | What it does | Affected? |
|---|---|---|
| `expire-plan-grants.js:69` | `IN ('trial','comp','package')` | No — neither NULL nor `'stripe'` matches |
| `expire-plan-grants.js:102` | `c.plan_source === 'package'` (wording) | No — only reached for rows that already matched the filter |
| `set-client-plan.js:143` | selects it for `from_plan` context | No — the value is read, never branched on |
| `set-client-plan.js:149` | overwrites with `grant_type` | No |
| `src/lib/clientContext.tsx:24,75,155,183` | type declaration and `select` list; defaults it to `null` in the demo/fallback path | No — no branch |
| `src/pages/Account.tsx:539-540` | `{activeClient?.plan_source && (...)}` truthiness, then `GRANT_TYPE_LABELS[...] ?? raw` | **Yes, display only.** See below |

`Account.tsx:539` is the only truthiness test on the field anywhere. Its
behaviour does change: a self-serve subscriber's Account page previously hid the
"Source:" row (NULL is falsy) and will now show `Source: Stripe`
(`GRANT_TYPE_LABELS` at `:29` has a `stripe` key). That is a strictly correct
improvement, and it sits inside `{isAdmin && ...}` (`:525`), so no customer sees
it. The related gap for `'package'` is finding S5.

There is also **no database CHECK constraint to trip.**
`db/supabase-admin-plan-grants-migration.sql:39` is
`alter table public.clients add column if not exists plan_source text;` — plain
text, no constraint, no enum. `'package'` inserts cleanly.

---

## 4. Priority items 3 and 4 — `stripe_subscription_id`, and the subscription regression trace

### 3. The package path deliberately does not write `stripe_subscription_id`

**Confirmed correct on all three counts.**

`stripe-webhook.js:288` `if (!isPackage) update.stripe_subscription_id = subId`.

- **`get-subscription.js` is not broken.** It selects only
  `stripe_subscription_id, plan` (`get-subscription.js:24-27`) and returns
  `{ active: false, plan }` when the id is falsy (`:30-32`). A package-only
  client hits that branch and gets a correct "no subscription" answer. A client
  holding both keeps a real id and keeps the working renewal panel — which is
  exactly what writing `null` per a literal reading of arch §3.2 would have
  destroyed.
- **`set-client-plan.js` is not broken.** Its only use is the warning at
  `:173-175`, `client.stripe_subscription_id ? '...may later overwrite...' :
  null`. Falsy for a package-only client, so no false warning; truthy and
  correct for a both-holder.
- **A package-only client does end up with `null` there.** The new-client insert
  at `stripe-webhook.js:486` writes `stripe_subscription_id: subId ?? null`, and
  `session.subscription` is `null` for a `payment`-mode session. The harness
  pins both halves; mutation M2 (making the write unconditional) is killed.

The deviation from §3.2's literal "`stripe_subscription_id: null`" is a strict
improvement and should be kept.

### 4. Subscription-path regression trace, end to end

Traced from webhook entry to database write. Differences from the previous
behaviour, and why each is inert for a subscription:

1. **Signature, idempotency, dispatch** (`:80-143`): untouched. Same
   `constructEvent`, same insert-first dedupe with the `23505` short circuit,
   same lock release on a real failure.
2. **Mode guard** (`:157-162`). Old: `if (session.mode && session.mode !==
   'subscription') return`. New: `const mode = session.mode || 'subscription'`
   then `if (mode !== 'subscription' && mode !== 'payment') return`. Truth table
   is identical for `'subscription'` (proceeds), absent (proceeds as
   subscription), and `'setup'` (skips). Only `'payment'` changes, which is the
   feature. Mutation M4 (removing the `|| 'subscription'` default) is killed.
3. **Email / customer-id guards** (`:174-192`): the subscription path still
   log-and-returns. The new `reportUnprovisionedPackage` calls are both behind
   `if (isPackage)`.
4. **Line items and plan resolution** (`:195-196`, `:223`): unchanged.
   `plan = (price?.metadata?.plan) || PRICE_TO_PLAN[priceId]`. Mutation M7
   (dropping the fallback) is killed, so the harness genuinely pins this.
5. **New locals** `planSource = 'stripe'`, `grantUntil = null` (`:230-231`).
   Mutations M1 (`= undefined`) and M9 (`= 'package'`, which would expire every
   subscriber) are both killed.
6. **New display locals** `planLabel`, `what`, `eventType`, `eventMeta`
   (`:236-241`): pure computation, no I/O. `eventType` for a subscription is
   `'subscription_new'`, which matches the documented type list in
   `db/supabase-admin-notifications-migration.sql:20`. `PLAN_LABELS` was already
   imported and already used by the two unchanged subscription handlers
   (`:421`, `:422`), so this adds no new dependency.
7. **Existing-client UPDATE** (`:287-294`): now also writes `plan_source` and
   `plan_grant_until`. This is the deviation, ruled KEEP in section 2. Behaviour
   change is confined to two columns nothing reads for gating.
8. **`createClientRow`** (`:471-502`): signature gained `planSource, grantUntil`,
   both **required** (`:472` throws on a falsy `planSource`). Both call sites
   (`:309`, `:331`) pass them; the harness counts exactly 2 and asserts each
   carries the params. Insert now includes `plan_source` and
   `plan_grant_until: grantUntil ?? null`. For a subscription that is
   `('stripe', null)`. Slug retry, rollback chain, and every other field are
   unchanged.
9. **`handleSubscriptionUpdated` / `handleSubscriptionDeleted`** (`:394-449`):
   textually untouched; they consume the moved `SELF_SERVE_PLANS` via the import
   at `:41`, and `grep` confirms no third consumer existed to break.

**Conclusion:** a subscription checkout resolves the same plan, runs the same
three provisioning branches, sends the same invite, and raises the same
`subscription_new` admin event. The only observable differences are two extra
columns whose values are inert for gating and expiry, plus one admin-only
display row on Account. Criterion 4 holds.

---

## 5. Priority item 5 — fail-closed behaviour

**Confirmed. Partial provisioning from bad metadata is structurally impossible,
because every validation happens strictly before the first write.**

Ordered trace through `handleCheckoutCompleted` for `mode === 'payment'`:

| Step | Line | On failure | Any write yet? |
|---|---|---|---|
| Mode routed to package | `:157-162` | n/a | no |
| Email present | `:174-178` | admin event, `return` | **no** |
| Customer id present | `:188-192` | admin event, `return` | **no** |
| Line items fetched | `:195-196` | a Stripe API throw propagates to the outer `catch` at `:137`, which releases the idempotency lock and returns `500` so Stripe retries | **no** |
| `resolvePackage(price)` | `:204-215` | admin event, `return` | **no** |
| Grant date computed | `:221` | cannot throw: `todayUtc()` always yields `YYYY-MM-DD` and `months` is already a validated integer in `1..36` | no |
| First write | `:287` / `:309` / `:331` | — | yes |

Every refusal path is a `return`, never a `throw`, and the harness proves
`resolvePackage` never throws on `null`, `undefined`, `{}`, `{metadata: null}`,
or `{metadata: {plan: 12, months: {}}}`. The choice of `return` over `throw` is
correct and non-obvious: a throw would delete the `stripe_events` row (`:140`)
and Stripe would redeliver the same unprovisionable session on its retry
schedule, re-alerting the admin every time. One alert, one human decision.

The three provisioning branches themselves retain their pre-existing rollback
chains (`:313-316`, `:337-340`, `:345-349`), so a failure *after* the first
write still unwinds. Those rollbacks are unchanged by A1 and are not a new risk,
though they inherit A1's new payload — noted under S4's neighbourhood but not
raised as a finding, because I cannot demonstrate a new failure they introduce.

---

## 6. Priority item 6 — mutation-testing the source-regex assertions

The harness makes ten assertions by reading source text rather than by calling
code (`package_provisioning.test.js:187`, `:189`, `:191`, `:200`, `:204`,
`:211`, `:212`, `:220`, `:222`, `:238`, `:246`, `:248`, `:258`, `:262`, `:269`,
`:272`). The builder claims all ten discriminate. I spot-checked **eleven**
mutations, not two, on copies in the session scratchpad. Working-tree files were
never modified; the working-tree harness still reports 43 passed afterwards.

| # | Mutation | Result |
|---|---|---|
| M1 | subscription path `grantUntil = null` → `= undefined` | **killed** |
| M2 | package path also writes `stripe_subscription_id` (blanks a live sub) | **killed** |
| M3 | expiry filter back to `['trial', 'comp']` | **killed** |
| M4 | `const mode = session.mode \|\| 'subscription'` → `session.mode` | **killed** |
| M5 | `createClientRow({ ..., planSource = 'stripe', ... })` default added | **killed** |
| M6 | lapse wording reverted to "complimentary" for packages | **killed** |
| M7 | `PRICE_TO_PLAN` fallback removed from subscription resolution | **killed** |
| M8 | `if (!planSource) throw` guard deleted | **killed** |
| M9 | subscription `planSource = 'stripe'` → `'package'` | **killed** |
| M11 | `MAX_PACKAGE_MONTHS` 36 → 360 | **killed** |
| M12 | `SELF_SERVE_PLANS` gains `'managed'` | **killed** |
| **M10** | **`plan_source`/`plan_grant_until` removed from the existing-client UPDATE at `:287`** | **SURVIVED** |

Eleven of twelve kill. The builder's claim about the ten source assertions is
**correct** — none of them is decorative. (An earlier pass of mine showed two
false survivors; that was my own CRLF-unaware substitution, not a weak
assertion, and both killed once corrected. Recorded so the number is not
misread.)

M10 is finding **S6**: the single most consequential and most contested line in
the change is the one line no assertion pins.

---

## 7. Assessment of the three challenges to the design doc

### (a) §3.1 omits `customer_creation: 'always'`, and that omission alone would sink the first package sale

**CONFIRMED. The builder is right, and this is the highest-value catch in the
change.** Verified from the code path and from the vendored Stripe SDK's own
type documentation, not from memory.

The mechanism, in `node_modules/stripe/types/Checkout/Sessions.d.ts:120-123`,
describing the `customer` field:

> "For Checkout Sessions in `subscription` mode **or Checkout Sessions with
> `customer_creation` set as `always` in `payment` mode**, Checkout will create
> a new customer object based on information provided during the payment flow
> unless an existing customer was provided when the Session was created."

So in `payment` mode without `customer_creation: 'always'`, no Customer is
created and `session.customer` is `null`. `stripe-webhook.js:188` is
`if (!custId) { log('no customer id on session, skipping'); ... return }` — the
package provisions nothing.

**Why it has never been hit:** `scripts/stripe-create-catalogue.js:141-166`
creates all six live prices with `recurring[interval]=...`, i.e. subscription
mode, where a Customer is always created. `grep -rn "customer_creation"` across
the repo returns nothing outside `node_modules`. The existing catalogue script
is the template someone would copy for a package link, and it does not pass the
flag.

**The fix is available where the builder says it is.** Payment Links accept the
parameter on both create and update:
`node_modules/stripe/types/PaymentLinksResource.d.ts:64` and `:1075`,
`customer_creation?: PaymentLinkCreateParams.CustomerCreation`. So this is a
one-flag link setting, not a rewrite to server-side Checkout Sessions.

The code handles the failure correctly rather than silently:
`stripe-webhook.js:190` raises `package_unprovisioned` with the session id, and
the in-code warning at `:179-187` is placed where whoever creates the link will
read it. **§3.1 of the arch doc should be amended to state the requirement.**

### (b) §3.3's "the existing notification comes free" was wrong

**CONFIRMED on both halves.**

The wording claim is right. Without a change, `expire-plan-grants.js` would have
told a customer who paid for twelve months: *"Your complimentary {plan} plan has
ended."* That is a plain falsehood about a paid relationship, delivered at the
worst possible moment. The fix at `:105-111` branches on
`wasPaid = c.plan_source === 'package'` (`:102`) and changes only the words:
`Your ${planLabel} package has ended` and a body that offers to set up the next
period. Mutation M6 confirms the harness pins it. The admin summary email at
`:137-140` was widened the same way ("trial, comp or package"), which matters
because a lapsed package is a renewal conversation.

**The literal `'trial_expired'` really is load-bearing, and keeping it is the
right call.** Two consumers:

- `src/types/index.ts:162`, `kind: 'plan_grant' | 'plan_change' | 'trial_expired'`.
  A new literal would fall outside the union.
- `src/components/ClientBanner.tsx:51`, `const warn = n.kind === 'trial_expired'`,
  which drives the amber warning treatment at `:55-57`
  (`bg-amber-500/10 border-amber-500/30`, amber icon) against the default violet
  informational treatment.

Precision matters here: the failure mode of changing the literal is
**degradation, not a crash**. `ICON[n.kind] ?? Sparkles` (`:50`) falls back
safely, so a new kind would render as a violet "good news" banner with a
Sparkles icon telling a customer their paid plan just ended. There is also no
DB constraint forcing it —
`db/supabase-admin-plan-grants-migration.sql:76` is `kind text not null` — so
nothing would fail loudly. Keeping the literal and changing only the copy is
correct.

Also verified for this path: `admin_notifications.type` is plain `text not null`
(`db/supabase-admin-notifications-migration.sql:20`) with no CHECK, so the new
`package_purchased` and `package_unprovisioned` types insert cleanly; and
`client_id integer references public.clients(id) on delete set null` (`:21`) is
nullable, so `reportUnprovisionedPackage`'s deliberate `client_id: null` is
valid. Both of the builder's implicit assumptions there hold.

### (c) A1 alone does not close the founding-client offer

**CONFIRMED.** `grep -rn "prompt_limit_override"` across every `.js`, `.ts`,
`.tsx` and `.sql` in the repo returns **nothing**. The column does not exist,
nothing reads it, and A2 §3.4 is unbuilt.

The concrete consequence: `src/lib/planConfig.ts:427-430` sets
`PLAN_PROMPTS = { free: 5, essentials: 15, growth: 35, growth_pro: 35, managed:
120, ... }`. A founding client sold "Growth PRO plus 200 prompts" and provisioned
through A1 receives the Growth PRO tier and a **35**-prompt cap. Engines are fine
— `clients.engines_enabled` already supports per-client mixing — but the prompt
half of "a hand-built plan mixing entitlements from several tiers" does not
exist.

This is not a defect in A1; A1 does what §3 asks. It is a scope statement, and it
should be recorded plainly: **A1 makes a package purchasable and provisionable,
it does not make the founding-client offer deliverable.** Selling a
prompt-augmented package before A2 §3.4 ships means promising a number the
product will not honour. That is a `bg-strategy` / Constantin decision, not a
`bg-backend` one, and it belongs in the backlog above A2's other items.

---

## 8. Security findings

Ranked by severity. Every one is reproducible from the file and line given.

### S1 — HIGH. A package sold to a client who already has an active Stripe subscription reverts that paying subscriber to Free

**Where:** `stripe-webhook.js:287` (writes `plan_source: 'package'` and
`plan_grant_until` on the existing-client update branch) together with
`stripe-webhook.js:288` (deliberately preserves the live `stripe_subscription_id`)
and `expire-plan-grants.js:69-72` (revert filter has no subscription guard).

**Exploit path, concrete:**

1. A founding client is on Growth monthly, self-serve. Their row:
   `plan='growth'`, `plan_source='stripe'`, `stripe_subscription_id='sub_X'` (live).
2. They buy a 3-month Growth PRO package as an upsell.
   `checkout.session.completed`, `mode='payment'` → existing user with a profile
   → the update branch at `:287` runs:
   `plan='growth_pro'`, `plan_source='package'`,
   `plan_grant_until = today + 3 months`.
   `stripe_subscription_id` is **not** written (`:288`), so `sub_X` remains live
   and Stripe keeps charging €299/month.
3. On day 1 after the package date, `expire-plan-grants` runs. The row satisfies
   every clause of `:69-72`: `plan_source` is `'package'`, `plan_grant_until` is
   non-null and `< today`, `plan != 'free'`.
4. `:88-90` sets `plan='free'`, `plan_source='expired'`, `plan_grant_until=null`.
   `:104-113` emails the customer that their plan has ended and they are on Free.
   `sub_X` is still active and still billing.

**Why this is not the same as the leak the deviation closes.** The deviation
(section 2) fixes `package → subscription`. This is `subscription → package`, and
the deviation is what makes the state reachable: before A1 a `payment`-mode
session provisioned nothing at all. The code's own comment at `:280-286` reasons
explicitly about "a client who holds both" as a case worth protecting — and then
that case is left unprotected in the job that reverts them.

**Recovery is partial and slow.** `handleSubscriptionUpdated` (`:394-425`) will
restore `plan` on the next `customer.subscription.updated` (Stripe emits one when
the billing period advances), but it never touches `plan_source`, so the row
stays `'expired'`. The customer sits on Free for up to a full billing cycle,
having received a lapse email, while being charged.

**Fix (recommended, fail-safe in the money direction, no Stripe call needed).**
In `expire-plan-grants.js`, select the id and never auto-revert a package holder
who still has one; alert instead.

```js
// :68 — add the column
.select('id, name, plan, plan_source, plan_grant_until, stripe_subscription_id')

// after the :79 empty check — partition rather than filtering in SQL, so the
// held rows can be reported instead of silently skipped.
const held = due.filter((c) => c.plan_source === 'package' && c.stripe_subscription_id);
const toExpire = due.filter((c) => !held.includes(c));

for (const c of held) {
  await recordAdminEvent(supabase, {
    type: 'package_expiry_held', client_id: c.id,
    title: `Package ended but client has a live subscription: ${c.name || `client ${c.id}`}`,
    body: `Not reverted to Free. Confirm which entitlement should stand, then set the plan from Account.`,
    meta: { from_plan: c.plan, ended: c.plan_grant_until, sub: c.stripe_subscription_id },
  });
}
// then iterate toExpire instead of due at :86
```

**Companion fix (needed for the guard to stay accurate).** A cancelled
subscription currently leaves a stale `stripe_subscription_id` behind, which
would exempt a later package from expiry forever — the original §2.1 leak by
another route. In `handleSubscriptionDeleted`, `stripe-webhook.js:433-435`,
change the update to `{ plan: 'free', stripe_subscription_id: null }`. Safe for
`get-subscription.js`, which already returns `{ active: false }` for a null id.

**Pin it.** Add to `package_provisioning.test.js` section 6:
`assert.match(exp, /stripe_subscription_id/)` and a partition assertion, so the
guard cannot be removed silently.

### S2 — MEDIUM. Renewing a live package early forfeits the unused remainder

**Where:** `stripe-webhook.js:221`,
`grantUntil = packageGrantUntil(months)` — always computed from *today*
(`_package_checkout.js:181-183` → `todayUtc(now)`), never from the client's
existing `plan_grant_until`. The update branch at `:287` overwrites the column,
and the branch never reads the current `clients` row (the lookup at `:252-256`
selects only `user_profiles.client_id`).

**Exploit path:** a client buys 12 months on 2026-08-01 (`plan_grant_until =
2027-08-01`). On 2027-06-01, two months early, they renew for another 12 months.
The update writes `plan_grant_until = 2028-06-01`. Two paid months are deleted.
The customer-facing lapse copy at `expire-plan-grants.js:110` explicitly invites
this ("reach out and we'll set up your next period"), so early renewal is the
expected motion, not an edge case.

**Fix:** read the current grant alongside the profile and extend from whichever
is later.

```js
// alongside the :252 user_profiles lookup, once profile.client_id is known:
const { data: cur } = await supabase
  .from('clients').select('plan_grant_until').eq('id', profile.client_id).maybeSingle()

// then, for the package path only:
const base = cur?.plan_grant_until && cur.plan_grant_until > todayUtc()
  ? cur.plan_grant_until
  : todayUtc()
grantUntil = addMonths(base, months)
```

`addMonths` and `todayUtc` are already exported from `_package_checkout.js:191-192`,
so no new arithmetic is written. Only extend when the tier is unchanged or
higher; a lower-tier package should not inherit a higher tier's remaining time.

### S3 — MEDIUM. Line-item quantity is never read, so a package bought at quantity 2 provisions half the months paid for

**Where:** `stripe-webhook.js:195-196` fetches the line item and takes only
`price`; `grep -n "quantity" netlify/functions/stripe-webhook.js` returns
nothing. `resolvePackage(price)` (`_package_checkout.js:90`) has no access to
quantity by construction.

**Exploit path:** a 6-month package link with `adjustable_quantity` enabled, or a
link created with `line_items[0][quantity]=2`. The customer pays for 12 months of
entitlement; `metadata.months` is `'6'`; the client is granted 6 months. There is
no error and no admin event — the resolution succeeds. `amount_total` lands in
the admin event meta (`:387`) but nothing compares it to anything.

**Fix, fail-closed and small.** Pass quantity in and refuse anything but 1:

```js
// stripe-webhook.js :196
const line = lineItems.data[0]
const price = line?.price
// ... in the isPackage branch, before resolvePackage:
if ((line?.quantity ?? 1) !== 1) {
  await reportUnprovisionedPackage({ session, log, reason: 'invalid_quantity',
    detail: `line item quantity is ${line.quantity}; a package must be sold at quantity 1`,
    email, priceId })
  return
}
```

Refusing is better than multiplying: multiplying would silently accept a shape
nobody designed, and refusing produces a paid-but-unprovisioned alert, which is
the outcome A1 exists to make visible. Also pass
`-d 'line_items[0][adjustable_quantity][enabled]=false'` when creating any
package Payment Link.

### S4 — LOW, PRE-EXISTING. `recordAdminEvent` cannot see a database-level insert failure

**Where:** `_admin_notify.js:28-32`.

```js
try {
  await supabase.from('admin_notifications').insert({ type, client_id, title, body, meta });
} catch (e) { console.warn('[admin-notify] insert failed:', e.message); }
```

supabase-js **returns** `{ error }` for a database-level failure and only
**throws** at the network layer, so a rejected insert is invisible here. The
codebase already knows this: `expire-plan-grants.js:44-49` documents the exact
distinction and handles both shapes for `job_runs`.

**Why it matters for A1 specifically:** arch §3.2 step 2 requires a
paid-but-unprovisioned customer to be "visible in the product rather than only
in a log". If the `admin_notifications` insert fails, that guarantee silently
degrades to log-plus-email. The email backstop is real (`recordAdminEvent`'s
`email` defaults to `true`, so `package_unprovisioned` does send), which is why
this is LOW rather than higher.

**Fix:** one line, matching the pattern already in `expire-plan-grants.js`:

```js
const { error } = await supabase.from('admin_notifications').insert({ type, client_id, title, body, meta });
if (error) console.warn('[admin-notify] insert failed:', error.message);
```

Marked `PRE-EXISTING`. It does not block A1.

### S5 — LOW. `package` has no label and no icon anywhere in the admin UI

Three concrete gaps, all admin-facing only:

- `src/pages/Account.tsx:28-29` — `GRANT_TYPE_LABELS` has
  `manual/trial/comp/stripe/signup/expired` and no `package`, so `:540` falls
  through to `?? activeClient.plan_source` and renders the raw slug
  `Source: package` next to properly-cased siblings. **Fix:** add
  `package: 'Package'` to the map.
- `src/components/AdminBell.tsx:25-31` — `ICON` has no `package_purchased` or
  `package_unprovisioned`, so `:145` `ICON[n.type] ?? Bell` gives both the
  generic bell. The single most urgent alert the system can raise, "a customer
  paid and got nothing", is visually indistinguishable from routine traffic.
  **Fix:** map `package_purchased` to `CreditCard` and `package_unprovisioned`
  to something distinct (`AlertTriangle`).
- `src/components/AdminBell.tsx:97` — `if (n.client_id) { ... navigate('/account') }`.
  `package_unprovisioned` carries `client_id: null` by design, so clicking it
  only marks it read and goes nowhere, while `:154`'s `line-clamp-2` truncates
  the remediation instruction. No crash (the guard is correct), but the alert is
  a dead end in the UI. The full text does reach the admin email.

Nothing here is a functional break and none of it is customer-facing.

### S6 — LOW. The declared deviation is the one thing the harness does not pin

Mutation **M10** — deleting `plan_source` and `plan_grant_until` from
`stripe-webhook.js:287`, reducing it to
`const update = { plan, stripe_customer_id: custId }` — **survives**: all 43
checks still pass. The most debated line in the change can be reverted by a
future edit with a green harness, silently reopening the leak analysed in
section 2.

**Fix:** add to `package_provisioning.test.js` section 4:

```js
assert.match(src, /const update = \{ plan, stripe_customer_id: custId, plan_source: planSource, plan_grant_until: grantUntil \}/,
  'every paid checkout must state plan_source and plan_grant_until explicitly, or a converted package holder is reverted to Free')
```

### S7 — INFO. `customer_creation: 'always'` has no enforcement outside a code comment

Finding (a) is handled by a warning comment at `stripe-webhook.js:179-187` and a
runtime alert at `:190`. That is the right runtime behaviour, but the failure is
only detectable *after* a customer has paid. The template someone will copy,
`scripts/stripe-create-catalogue.js:157-166`, does not pass the flag. **Fix:**
add a package branch to that script that creates the one-time price with
`metadata[plan]` + `metadata[months]` and the link with
`-d 'customer_creation=always'` and
`-d 'line_items[0][adjustable_quantity][enabled]=false'`, so the correct shape is
produced by the same tool that produced the subscription catalogue. Recommended,
not required for A1.

### S8 — INFO, PRE-EXISTING. An admin can silently destroy a paid package grant

`set-client-plan.js:149-156`: with the default `grant_type = 'manual'`, the
update sets `plan_source = 'manual'` and `plan_grant_until = null`. Applied to a
client mid-package, that deletes the remaining paid period with no confirmation.
The safety warning at `:173-175` fires only on `stripe_subscription_id`, which a
package-only client does not have, so no warning appears. **Fix (cheap):** widen
the warning condition to
`client.stripe_subscription_id || client.plan_source === 'package'` with wording
for the package case. Pre-existing shape; does not block A1.

### Checked, and NOT findings

Stated explicitly so the absence is evidence rather than an omission.

- **No injection into the admin email.** `resolvePackage` reflects operator-set
  Stripe metadata into `detail` (`_package_checkout.js:107`, `:110`, `:124`),
  which reaches `sendBrandedEmail`'s `paragraphs`. `_email.js:17-21` HTML-escapes
  `&`, `<` and `>` before rendering the shell. Separately, price metadata is only
  writable from the Stripe dashboard, so there is no external actor. No exploit
  path; not a finding.
- **No auth weakening.** Signature verification (`stripe-webhook.js:90`) and the
  cron gate (`expire-plan-grants.js:60-61`) are untouched. No new endpoint, no
  new export with a handler — `_package_checkout.js` exports pure functions only
  (`:185-194`), and its `_` prefix does not stop Netlify deploying it as an
  endpoint (see `docs/qa/deploy-pipeline-netlify.md` F2), but with no `handler`
  export the endpoint does nothing.
- **No new service-key surface.** `_package_checkout.js` performs no I/O and
  reads no environment variable.
- **No plan can be self-provisioned that could not be before.**
  `SELF_SERVE_PLANS` is unchanged in content (mutation M12 confirms the harness
  would catch a widening), and `managed`/`pro`/`enterprise` are refused twice
  over (`_package_checkout.js:106`, `:109`).

---

## 9. Accessibility findings

This change touches four files: three Netlify functions and one Node test
harness. **No new interactive element, no new text-on-surface pair, no new
heading, no new hit target, no change to focus order or keyboard reachability.**
Contrast ratios are therefore not computable for this change and none is
reported, rather than a ratio being invented.

The only rendering consequences are the two strings named in S5, both inside
existing components and existing token classes (`text-slate-300` on
`bg-dark-800` in `Account.tsx:540`, unchanged from its siblings). Their defect is
copy quality (a raw lowercase slug), not contrast.

The customer-facing copy change at `expire-plan-grants.js:105-111` is plain text
rendered by the existing `ClientBanner` at the existing amber warning treatment;
no styling changed, so no contrast pair changed. Copy was checked against
AGENT-OS §7.3: no em dash, no en dash, no banned vocabulary in either the
package or the trial variant.

---

## 10. Regression surface

Found by grep, not by intuition. Paths that need a manual look are named.

**Direct importers of changed modules**

| Consumer | Why | State |
|---|---|---|
| `stripe-webhook.js:40-45` | only importer of `_package_checkout.js` | in scope, reviewed |
| `tests/package_provisioning.test.js:38` | imports the module and reads three files as text | in scope, reviewed |
| `_package_checkout.js:45` → `_plans.js` → `_cost.js` | new transitive load chain at webhook module init | **inert.** `stripe-webhook.js:39` already required `_plans.js` directly, so `_cost.js` was already loaded. No new module-load work, no new throw surface |

**`SELF_SERVE_PLANS` after the move** — `grep -rn "SELF_SERVE_PLANS" netlify src tests`
returns consumers only at `stripe-webhook.js:224` (checkout) and `:399`
(`handleSubscriptionUpdated`), both satisfied by the import at `:41`. **No third
consumer existed.** No orphan.

**Consumers of the columns this change starts writing**

| Path | Column | Needs a manual look? |
|---|---|---|
| `netlify/functions/expire-plan-grants.js:69` | `plan_source` | **Yes — S1.** The filter is the defect surface |
| `netlify/functions/set-client-plan.js:143,149,173` | `plan_source`, `stripe_subscription_id` | **Yes — S8.** Overwrite with no warning for package clients |
| `netlify/functions/get-subscription.js:24-32` | `stripe_subscription_id` | No. Verified correct for both package-only and both-holder |
| `src/pages/Account.tsx:539-543` | `plan_source`, `plan_grant_until` | **Yes — S5.** Missing label; admin-only |
| `src/lib/clientContext.tsx:24-25,75` | both, in the `Client` type and `CLIENT_SELECT` | No. Declared and selected, never branched on |
| `src/components/AdminBell.tsx:25-31,97,145` | new `admin_notifications.type` values | **Yes — S5.** Missing icons; null `client_id` is a dead click |
| `src/components/ClientBanner.tsx:50-57` | `client_notifications.kind` | No. `kind` deliberately unchanged; verified load-bearing |
| `src/types/index.ts:162` | `ClientNotification.kind` union | No. Unchanged for the same reason |
| `db/supabase-admin-plan-grants-migration.sql:39` | `plan_source text`, no CHECK | No. `'package'` inserts cleanly |
| `db/supabase-admin-notifications-migration.sql:20-21` | `type text`, `client_id` nullable | No. Both new types and the null `client_id` are valid |

**Not affected, checked:** `onboard-client.js` and `signup-client.js` write no
`plan_source` (`grep` returns nothing), so neither is touched by the new column
semantics. `_cost.js`, `_plans.js`, and `planConfig.ts` are unmodified; the
ladder has not moved.

**Deploy surface:** three Netlify functions changed, all under
`brandgeo-dashboard/`, so `netlify.toml`'s `ignore` diff will correctly trigger a
dashboard build. No cPanel surface is involved.

---

## 11. Data and claim integrity

Every user-facing number and factual claim in new copy, traced.

| Claim / number | Where | Traced to |
|---|---|---|
| "plan + months, 1-36" in the admin alert body | `stripe-webhook.js:381` | `_package_checkout.js:68-69`, `MIN_PACKAGE_MONTHS = 1`, `MAX_PACKAGE_MONTHS = 36`. Matches arch §3.1's stated `1..36`. Mutation M11 pins the ceiling |
| "Access runs to {grantUntil}, then reverts to Free." | `stripe-webhook.js:300`, `:322`, `:356` | `packageGrantUntil` (`_package_checkout.js:181-183`) and the consuming filter at `expire-plan-grants.js:71` (`< today`). The claim is exact: the client holds the plan **through** the printed date. Harness asserts both sides of the boundary |
| Amount shown in the alert, `"{n} EUR"` | `stripe-webhook.js:373-375` | `session.amount_total / 100` and `session.currency`, both Stripe-supplied on the event. Guarded by a `typeof === 'number'` check with an `'unknown amount'` fallback. Not invented |
| "{months}-month {planLabel} package" | `stripe-webhook.js:237` | `months` from validated metadata; `planLabel` from `PLAN_LABELS` (`_plans.js:25-28`), which mirrors `planConfig.ts` |
| "Your {planLabel} package has ended" | `expire-plan-grants.js:107` | Same `PLAN_LABELS`. Replaces a claim ("complimentary") that would have been false for a paying customer. Correct — see (b) |
| "returned to the Free plan" | `expire-plan-grants.js:110` | `expire-plan-grants.js:89` writes `plan: 'free'`. The copy matches the write |
| "These clients reached the end of their trial, comp or package period" | `expire-plan-grants.js:139` | `:69`'s three-value filter. Admin-facing, and now accurate for all three sources |
| "reach out and we'll set up your next period" | `expire-plan-grants.js:110` | Deliverable: package renewal is a hand-created Payment Link (arch §3.5). No self-serve renewal is implied. Honest. **But see S2** — an early renewal currently costs the customer the remainder |

**Untraceable claims: none.** Every number resolves to a constant or a
Stripe-supplied field in the same repo. No metric, customer count, or engine
claim appears in this change.

One integrity note for the record, not a finding in this change: the doc
`docs/arch/custom-entitlements.md` §3.1 omits the `customer_creation`
requirement, and §3.3's "the existing notification comes free" is incorrect. Both
are established above with evidence. The arch doc should be amended so the next
reader is not misled; that is `bg-architect`'s file, not mine.

---

## 12. What was not checked

Explicit and complete.

1. **Any database write, on any of the three provisioning branches.** No Supabase
   client was constructed and no row was written or read. Criterion 1's write
   half and criterion 3 in full rest on code review plus source assertions.
   Concretely unproven at runtime: that `clients.plan_source = 'package'`
   persists, that `plan_grant_until` accepts the `YYYY-MM-DD` string into a
   `date` column, that `admin_notifications` accepts `client_id: null`, and that
   `expire-plan-grants`'s three-value `IN` returns package rows. The schema files
   say all four should work; production says nothing yet.
2. **Anything against Stripe.** No test mode exists, and testing on the
   `livemode: true` account was not attempted and must not be. So: no real
   `checkout.session.completed` was ever delivered to this code, in either mode.
   The `customer_creation` conclusion in (a) is from the vendored SDK's type
   documentation and the code path, not from an observed session.
3. **The git diff itself.** No `git` command was run, per instruction. I reviewed
   the working-tree files in full, but I cannot state which lines are new versus
   pre-existing, and I cannot rule out a fifth changed file. The mtime listing in
   Calibration 1 is corroboration, not proof. **If byte-level diff confirmation
   of the subscription-path admin-event strings matters, someone with git access
   should confirm `stripe-webhook.js:296-303`, `:318-325` and `:352-359` are
   unchanged for the non-package branch.** I traced them as behaviourally
   consistent, not as byte-identical.
4. **`npm run build`.** Not run. `tsc --noEmit` was, and exits 0, but
   `tsconfig.json`'s `"include": ["src"]` means neither tool reads any of the
   four changed files. A green build would have been evidence about a different
   part of the repo. `node --check` is the applicable gate and is clean.
5. **The other workstream's files.** `src/pages/AIVisibility.tsx`,
   `src/pages/Dashboard.tsx`, `src/lib/aiVisibilityScore.ts`,
   `src/pages/AuditReport.tsx` and `tests/no_answer_rows.test.js` carry today's
   mtimes but are outside A1's scope and were not reviewed. `tsc` passing covers
   their types, nothing more.
6. **Browser verification.** None. No viewport was opened; there is no UI in this
   change. S5's three gaps were found by reading source, and the raw-slug and
   generic-icon claims are not confirmed by observation.
7. **Live Supabase state.** The builder's claim at `stripe-webhook.js:276-278`
   that zero clients currently sit in the `plan_source in ('trial','comp')` +
   `stripe_subscription_id` state was **not** re-verified against production. If
   that claim is wrong, the deviation at `:287` repairs live rows rather than
   merely preventing new ones, which changes nothing about the ruling but does
   change what the first run does.
8. **Concurrency.** Two `checkout.session.completed` events for the same email
   arriving simultaneously are serialized only by the `stripe_events` unique
   insert, which does not cover two *different* sessions. Duplicate-client
   creation under a race is a pre-existing property of `createClientRow`'s slug
   retry and was not analysed.

---

## 13. Summary of required actions

| ID | Severity | Owner | Blocking? |
|---|---|---|---|
| S1 | HIGH | `bg-backend` | Before the first package grant date, and before selling a package to any client with a live subscription |
| S2 | MEDIUM | `bg-backend` | Before the first package renewal |
| S3 | MEDIUM | `bg-backend` | Before the first package Payment Link is created |
| S6 | LOW | `bg-backend` | Ship alongside S1 (same file, same harness section) |
| S4 | LOW, PRE-EXISTING | `bg-backend` | No |
| S5 | LOW | `bg-app` | No |
| S7 | INFO | `bg-backend` | No, but do it before creating the link by hand |
| S8 | INFO, PRE-EXISTING | `bg-backend` | No |
| (a) | doc amendment | `bg-architect` | No, but §3.1 is actively misleading as written |
| (b) | doc amendment | `bg-architect` | No |
| (c) | scope decision | `bg-strategy` / Constantin | Before selling a prompt-augmented package |

**Not to be changed:** the deviation at `stripe-webhook.js:287`, the omission of
`stripe_subscription_id` from the package update at `:288`, the `return`-instead-
of-`throw` refusal shape at `:206-215`, and `client_notifications.kind =
'trial_expired'` at `expire-plan-grants.js:105`. Each was challenged in this
review and each survived.
