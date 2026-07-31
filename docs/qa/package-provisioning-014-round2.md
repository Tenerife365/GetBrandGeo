# PASS WITH FINDINGS

Round-2 review of the A1 finding fixes, 2026-07-31. Reviewer: `bg-verify` (Opus).
Subject: uncommitted working-tree changes under `brandgeo-dashboard/`, closing
S1, S2, S3 and S6 from `docs/qa/package-provisioning-014.md`.

Files reviewed:

- `brandgeo-dashboard/netlify/functions/_package_checkout.js`
- `brandgeo-dashboard/netlify/functions/stripe-webhook.js`
- `brandgeo-dashboard/netlify/functions/expire-plan-grants.js`
- `brandgeo-dashboard/tests/package_provisioning.test.js` (43 → 63 checks)

**Verdict rationale.** All four targeted findings are genuinely closed, and each
is now pinned by an assertion that a mutation kills. The third fix nobody asked
for is correct, and it closes a hole strictly worse than the S1 it was found
beside. Against that, six findings, of which two matter: **V1**, cross-tier
stacking creates a new and quantifiable revenue arbitrage that did not exist
before this change and that Constantin's ruling does not settle; and **V2**, the
one line that keeps the whole S1 guard from rotting into a permanent leak is
pinned by an assertion that a mutation walks straight past.

Nothing here forces a FAIL. The subscription path is unchanged, no criterion is
reopened, and no live exposure exists. **Release gate: this may be committed.
V1 must be settled before a second package Payment Link at a different tier
exists. V2 should ship in the same commit, since it is one assertion in the file
already open.**

`BILLING`. This change decides whether a paying customer is downgraded. A
`HUMAN CHECKPOINT` is at the end of this report, per AGENT-OS §6.

---

## Calibration

**1. Changed files vs declared scope.** No `git` command was run (instructed).
There is no handoff packet for this round: `.claude/handoffs/` ends at `013`, so
no `scope_write` exists on disk. I took the four files named in the review task
as the declared scope, and the acceptance criteria as S1/S2/S3/S6 verbatim from
my own round-1 report §13. **mtime is not proof of content change and I cannot
rule out a fifth changed file.** Recorded under "What was not checked".

**2. Secret scan.** Run over the three function files by name and pattern, values
never printed:

```
$ grep -niE "api[_-]?key|secret|token|password|bearer|sk-|pk_live|service_role" \
    netlify/functions/_package_checkout.js netlify/functions/stripe-webhook.js \
    netlify/functions/expire-plan-grants.js
stripe-webhook.js:31: * Requires env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
stripe-webhook.js:36:const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
stripe-webhook.js:81:const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
stripe-webhook.js:93:  stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
expire-plan-grants.js:24: * ...authenticated by the X-Cron-Key shared secret.
expire-plan-grants.js:161:  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
```

**Count: 6 hits, 0 values.** Every hit is a variable name read from `process.env`
or prose. Unchanged from round 1. `_package_checkout.js` is clean. The new code
in `reportHeldGrant` writes `c.stripe_subscription_id` (a `sub_*` identifier, not
a secret) into an admin-only notification body at `expire-plan-grants.js:147`.

**3. Baseline, run by me, not accepted from the task.**

```
PASS tests/analysis.test.js
PASS tests/competitor_aggregate.test.js
PASS tests/competitor_filter.test.js
PASS tests/engine_routing.test.js
PASS tests/no_answer_rows.test.js
PASS tests/package_provisioning.test.js      63 checks passed, exit 0
OK  node --check netlify/functions/_package_checkout.js
OK  node --check netlify/functions/stripe-webhook.js
OK  node --check netlify/functions/expire-plan-grants.js
npx tsc --noEmit  ->  exit 0
```

`tsc` is weak evidence here for the same reason as round 1: `tsconfig.json` sets
`"include": ["src"]`, so it neither compiles nor reads any of the four files.
`node --check` is the applicable gate.

**4. Auth check on the most sensitive function touched.** Unchanged and
untouched by this round. `stripe-webhook.js` authenticates by Stripe signature at
`:93`, `stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)`,
returning `400` with no processing on failure (`:94-97`); the raw body is never
`JSON.parse`d first (`:87-89`). `expire-plan-grants.js:158-159` is gated by
`requireCronAuth(event)`, which fails closed on an unset `CRON_SECRET`
(`_cron_auth.js:55-58`, `503`). Neither gate is modified. `expire-plan-grants.js`
gained a second export at `:262`; Netlify resolves only `handler`, so the
endpoint surface is unchanged.

**5. Write access.** I wrote exactly one file, this one. I edited none of the
reviewed files. All 20 mutations ran against **copies** in the session
scratchpad, with `node_modules` reached through a directory junction that was
removed afterwards without following it. The scratchpad mirror was re-run green
after every mutation was reverted, and the working-tree harness still reports 63
checks passed.

**CALIBRATED.**

---

## 1. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | S1 (HIGH) closed: a paying subscriber is never auto-reverted to Free by `expire-plan-grants` | **PASS** | Guard at `expire-plan-grants.js:95`, applied at `:187-188`, revert loop iterates `toExpire` at `:191`. Harness calls the real function: `ok - a due grant on a client with a live subscription is held, not reverted (ids 2 and 4)`. Mutations MS1a (guard neutered) and MS1b (loop back to `due`) both **killed** |
| 2 | S1 companion: a cancelled subscription no longer leaves a stale id that exempts a grant forever | **PASS (behaviour), FAIL (pinned)** | `stripe-webhook.js:523-524` writes `stripe_subscription_id: null` on both branches. Correct. But mutation **MS1d SURVIVED** — see **V2** |
| 3 | S2 (MEDIUM) closed: early renewal stacks the remainder instead of forfeiting it | **PASS** | `stackedGrantUntil` at `_package_checkout.js:298-303`, wired at `stripe-webhook.js:303-308`. Harness: `ok - live grant to 2027-06-30 + a 12-month renewal → 2028-06-30 (11 unused months carried over)`. Mutations MS2a, MS2c, MS2d all **killed**. **But see V1** — stacking is not gated on tier |
| 4 | S3 (MEDIUM) closed: a package bought at quantity ≠ 1 provisions nothing | **PASS** | `checkPackageLineItem` at `_package_checkout.js:170-187`, wired at `stripe-webhook.js:214`, ordered before `resolvePackage` at `:221`. Harness covers `[2,3,12,0,-1,1.5,'1','2',true]` and the absent-quantity default. Mutations MS3a, MS3b, MS3c all **killed** |
| 5 | S3 addition: a multi-line package checkout provisions nothing | **PASS** | `_package_checkout.js:171-177`, called with `lineItems.has_more === true` at `stripe-webhook.js:214`. `ok - a checkout with more than one line item is refused (has_more), not half-provisioned`. Mutation MS3b **killed**. In scope and correct — see §5 |
| 6 | S6 (LOW) closed: the declared deviation at the existing-client UPDATE is pinned | **PASS** | `package_provisioning.test.js:255-260`, asserted per property against `readCode()`. Mutations MS6a (drop `plan_source`) and MS6b (drop `plan_grant_until`) both **killed**. Round-1's surviving M10 is dead |
| 7 | The unrequested `handleSubscriptionDeleted` rewrite does not break ordinary cancellation | **PASS** | Full trace in §1 below. Mutation MS1c (revert to the blind update) **killed** |
| 8 | No new hardcoded plan list; the subscription path is unchanged | **PASS** | `SELF_SERVE_PLANS` still declared once at `_package_checkout.js:63`. `stripe-webhook.js:240` resolution is unchanged. Harness §4 and §5 unchanged and green |
| 9 | No secret, no new endpoint, no auth weakening | **PASS** | Calibration 2 and 4 |
| 10 | Customer-facing copy carries no AI tell | **PASS** | Non-comment scan of all three files: every em dash outside a comment is in a `console.log` or in the pre-existing admin summary bullet at `expire-plan-grants.js:245`. The customer-facing strings at `:211-217` are clean, and carry no banned vocabulary |
| 11 | Every database write behaves as claimed | **NOT CHECKED** | No Supabase client was constructed. No row was written or read. Stated plainly rather than passed |

---

## 1. The third fix nobody asked for

**The builder's claim is correct on both halves, and the fix is right.**

### The old behaviour did have the hole

I cannot run `git`, so the strongest available evidence for the prior shape is my
own round-1 report, which recorded `handleSubscriptionDeleted` as textually
untouched by A1 and then, at `docs/qa/package-provisioning-014.md:535-539`,
proposed changing its update to `{ plan: 'free', stripe_subscription_id: null }`.
That proposal only makes sense against a prior `update({ plan: 'free' })` applied
with `.eq('stripe_customer_id', custId)`. The builder's characterisation matches
my own record.

Against that shape, a client holding a live paid package whose subscription is
cancelled lands at `plan='free'`, `plan_source='package'`, `plan_grant_until` in
the future. Traced forward:

- `expire-plan-grants.js:173` is `.neq('plan', 'free')`, so the row can never be
  selected by the expiry job again. Verified by reading the filter.
- `grep -rn "plan_grant_until"` across `netlify/` and `src/` returns no other
  writer that would restore the plan. `handleSubscriptionUpdated` (`:445-476`)
  cannot fire, because the subscription it would fire for has been deleted.
  `set-client-plan.js` is a manual admin action.
- So the customer's remaining paid months are gone, silently, with no automated
  recovery path and no row anywhere that says so.

**The builder's judgement that this is worse than S1 itself is right, and I
agree.** S1 downgrades a customer who is still being charged — visible, loud,
and recoverable on the next `subscription.updated`. This one deletes months a
customer already paid for, is invisible in every surface the product has, and
nothing ever puts it back.

### The new handler closes it without breaking ordinary cancellation

`stripe-webhook.js:501-548`. Traced:

- `:504-508` selects `id, plan, plan_source, plan_grant_until` — the columns the
  decision needs, and the select throws on error rather than proceeding blind.
- `:518-520` `holdsLivePackage` requires `plan_source === PACKAGE_PLAN_SOURCE`
  **and** a non-null `plan_grant_until` **and** `!(plan_grant_until < today)`.
  That final clause is the same boundary `expire-plan-grants.js:172`
  (`.lt('plan_grant_until', today)`) uses, so a package on its last day is live
  in both places. `today` comes from the shared `todayUtc()` (`:515`), imported
  at `:47` — one clock, not two.
- `:522-524`. Ordinary cancellation (`holdsLivePackage` false) gets
  `{ plan: 'free', stripe_subscription_id: null }`. That is the old behaviour
  plus the companion fix, so nothing about a normal cancel changes except the id
  being cleared. A live package gets `{ stripe_subscription_id: null }` only, so
  the plan and the grant date stand and `expire-plan-grants` reverts it on its
  own date, with no subscription id left to hold it back.
- `:531-546` raises a distinct admin event per branch, both `subscription_canceled`,
  which is already in `AdminBell.tsx:29`'s icon map.

**The interlock is real and both halves are needed.** Nulling the id without the
`holdsLivePackage` read would still destroy the package. The `holdsLivePackage`
read without nulling the id would exempt every future grant on that client from
expiry forever. Neither is correct alone, and the builder says so at `:478-500`.

### Was my round-1 §10 a real gap? Yes.

**Plainly: yes, and the method is what failed, not the diligence.** My §10 census
asked "who *reads* the columns this change starts writing" and answered it by
grepping `plan_source` and `plan_grant_until`. `handleSubscriptionDeleted` could
never appear in that grep, because the old code mentions neither column — it
writes `plan` blindly, and the damage comes from that blindness. A census of
readers cannot find a writer that is unaware of the invariant.

The aggravating detail: my own S1 fix instructed an edit to those exact three
lines. I was inside the function, editing the statement that causes the defect,
and did not notice the defect. The correct census question, and the one I should
carry forward, is **"who writes `plan` without reading `plan_source` and
`plan_grant_until`"**. Run now, that grep returns `set-client-plan.js` (which
does read them, `:143`) and this handler. Nothing else.

---

## 2. S1 implemented broader than proposed

**Ruling: the broader guard is right. Keep it.**

`expire-plan-grants.js:95` is `if (c && c.stripe_subscription_id) held.push(c)`.
The SQL at `:170` has already narrowed the rows to
`plan_source in ('trial','comp','package')`, so the guard applies to all three.

**Why broader is correct.** The builder's argument at `:69-75` holds up. The SQL
filter is the only thing that makes `plan_source` relevant; once a row is in
`due`, the question is no longer "how was this plan granted" but "is Stripe still
charging this card". `set-client-plan.js:149` can stamp `plan_source='trial'`
plus a grant date onto a client with a live subscription, and reverting that
client is the same customer, the same money, and the same lapse email as the
package case. **"Paying customers are never auto-downgraded" is a better
invariant than "packages are special"**, and it is strictly safer: it is a
superset of the narrow guard, so it cannot revert anything the narrow guard would
have spared.

**Can it hold back a grant that should expire? Yes, in exactly one way, and it is
now bounded.** The guard trusts `stripe_subscription_id`. A stale id reads as
"still paying" and exempts the grant forever — arch §2.1's leak by another door.
Every path that could leave a stale id:

| Path | Leaves a stale id? |
|---|---|
| Subscription cancelled, `customer.subscription.deleted` delivered | **No.** `stripe-webhook.js:523-524` nulls it |
| Same event never delivered, or Stripe retries exhausted | **Yes.** Not detectable from inside this repo |
| Row has a wrong or null `stripe_customer_id` so the handler's `.eq` matches nothing (`:507`) | **Yes**, but unreachable in practice: `createClientRow` always writes `custId` (`:583`) and `handleSubscriptionUpdated` matches on it |
| Subscription goes `past_due`/`unpaid` and is left there — no `deleted` event | **Yes**, and correctly so. Stripe still considers it live |
| Rows predating A1 | **No.** The builder reports zero of 36 client rows carry an id (`:76-79`). Production read, not re-verified by me — see "What was not checked" |

So the residual is: a subscription that ends without Stripe emitting `deleted`,
which is a real but narrow class. It fails **safe for the customer** (they keep
the plan) and **unsafe for revenue** (the leak). The builder chose that direction
deliberately and I agree with it on a `livemode: true` account with no test mode:
a wrong hold costs money, a wrong revert costs a customer.

**One residual worth stating, not a finding.** A permanently-held client is
alerted exactly once (§3), after which the only surface that names them is
`job_runs.detail.held_clients` (`:255`), written on **every** run. `grep -rn
"job_runs"` across `netlify/` and `src/` shows the table is written by three jobs
and **read by nothing in the codebase** — it is a SQL-only surface. That is the
intended design and it is adequate, provided someone actually queries it.

---

## 3. The alert dedupe

**Verified. It cannot suppress a genuine new alert, and its failure mode is
alert-anyway.** With two qualifications.

`expire-plan-grants.js:127-141`. The key is `(type='plan_expiry_held',
client_id, meta->>ended = plan_grant_until)`.

**The builder's objection to my round-1 patch is correct.** My proposed fix
called `recordAdminEvent` unconditionally for every held row. Nothing in the job
clears the held state — the client stays held until a human cancels the
subscription in Stripe or clears the grant date — so `email: true` on a daily
cron is an email to `support@` every morning indefinitely. That is how a real
alert gets buried, and it would have degraded the exact surface S1 exists to
create. The replacement is the right shape.

**Cannot suppress a genuine new alert:**

- The only situation the key represents is "this client's grant ended on date D
  and they are still being billed". While D is unchanged, the situation is
  unchanged, and re-alerting adds nothing.
- Any change that makes it new changes D. An admin extending the grant writes a
  new `plan_grant_until`; when that lapses, the key differs and a fresh alert
  fires. `plan_grant_until` is a `date` column returned as `'YYYY-MM-DD'`, and
  `meta->>ended` was written from the same value at `:151`, so the two compare
  as equal strings.
- `admin_notifications.meta` is `jsonb not null default '{}'::jsonb`
  (`db/supabase-admin-notifications-migration.sql:24`), so the `meta->>ended`
  PostgREST filter is valid against the real column type. This was worth
  confirming rather than assuming — a `text` column would have made the filter
  error every run, which (see below) degrades to alerting anyway.

**Failure mode is alert-anyway, confirmed on every branch:**

- Database-level failure returns `{ error }` → logged at `:134`, `alreadyAlerted`
  stays `false` → **alerts**.
- Network-level failure throws → caught at `:136` → `alreadyAlerted` stays
  `false` → **alerts**.
- `reportHeldGrant` cannot throw: `recordAdminEvent` wraps both its insert and
  its email in `try/catch` (`_admin_notify.js:28-45`). This matters more than it
  looks — a throw at `:188` would abort the whole job **before any expiry
  happened**, turning an alert bug into a total job outage.

**Qualification 1, and it is a real new consequence.** The dedupe reads back the
insert but `recordAdminEvent` sends the email in a *separate* `try/catch`
(`_admin_notify.js:33-45`). If the insert succeeds and the email fails, the row
exists, so every subsequent run finds it and returns at `:141` — the email is
never retried. Before the dedupe, a daily unconditional alert retried the email
every morning. **One transient Resend failure now permanently silences the email
for that grant date.** The bell row still exists, so this is degradation rather
than total silence, and it is the only silence path I could construct. Recorded
as **V4**.

**Qualification 2.** Nothing pins the dedupe key. Mutation **MS1e SURVIVED** —
see **V3**.

---

## 4. S2 stacking

`_package_checkout.js:298-303`. All four sub-claims verified, plus one the task
did not ask for and that changes the picture.

**A lapsed grant extends nothing.** `:301`, `base = existing && !(existing <
today) ? existing : today`. Harness `:445-447` pins both a long-lapsed grant and
yesterday. Mutation MS2c (`base = today` always) is **killed**.

**A grant ending exactly today is treated as live, and the boundary matches the
job.** By inspection: `!(today < today)` is `true`, so `base = existing`. The job
uses `.lt('plan_grant_until', today)` at `:172`, so a grant dated today is not
due. The two agree.

**But the harness assertion for this is vacuous, and I should say so.** Mutation
MS2b rewrote the boundary from `!(existing < today)` to `(existing > today)` and
**SURVIVED**. I checked whether that is a real gap or an equivalent mutant:

```
inputs where the two boundary readings differ: 0
```

When `existing === today`, both readings yield `base = today`, so the results are
identical. **MS2b is an equivalent mutant, not a surviving one**, and I am not
recording it as a finding. The honest statement is that the boundary is
behaviourally inert for stacking — `addMonths(today, n)` either way — so the
assertion at `:451` cannot fail under either reading and proves nothing. That is
harmless. The boundary that *does* matter is in `handleSubscriptionDeleted`
(`:520`), where it is not inert, and it is written the same way.

**Null/unparseable degrades to today+N and never throws.** `normaliseGrantDate`
(`:254-258`) returns `null` for every non-string and every string without a
leading `YYYY-MM-DD`, so `base` falls to `today`, which always matches
`addMonths`'s regex, and `months` is already a validated integer in `1..36`.
`addMonths` cannot throw on those inputs. Harness `:455-458` covers `null`,
`undefined`, `''`, `'   '`, `'not-a-date'`, `0`, `12`, `new Date()`.

**The month-end clamp survives stacking.** `addMonths` clamps by computing the
target month's last day (`:217-218`) regardless of where the base came from.
Harness `:464-466`.

### The exploitable path the ruling does not cover — V1

**Constantin ruled on months. Stacking is implemented on months. But `plan` is
written unconditionally alongside the stacked date, and nothing reconciles the
two.** `stripe-webhook.js:233` sets `plan = resolved.plan`, and `:338` writes
`{ plan, ..., plan_grant_until: grantUntil }` in one update. There is one `plan`
column, so the newly purchased tier applies to the entire stacked window.

Run against the real functions the webhook calls:

```
--- cross-tier stacking, using the real function the webhook calls ---
1. buys Essentials x36  -> plan=essentials  grant_until= 2029-08-01
2. buys Growth PRO x1   -> plan=growth_pro  grant_until= 2029-09-01
   months of growth_pro entitlement actually granted: 37

--- reverse direction: cheap package silently downgrades a live tier ---
1. buys Growth PRO x12  -> plan=growth_pro  grant_until= 2027-08-01
2. buys Essentials x1   -> plan=essentials  grant_until= 2027-09-01
   (11 paid Growth PRO months become Essentials)
```

Both directions are harmful and both are new. My round-1 S2 fix said explicitly:
*"Only extend when the tier is unchanged or higher; a lower-tier package should
not inherit a higher tier's remaining time."* The builder dropped that clause on
the grounds that Constantin ruled on months not tiers. **That reading is too
literal.** The ruling settled *forfeit vs stack* for a renewal at the same tier —
the scenario in the finding. It did not authorise converting 36 paid Essentials
months into Growth PRO months for the price of one. Full detail as **V1**.

**Everything else about the stacking is sound, including the two things most
likely to have gone wrong.** The read at `:296-301` throws rather than degrading
to today, so a blipped `SELECT` cannot silently forfeit months — the outer
`catch` at `:140` releases the idempotency lock and Stripe redelivers.
`eventMeta` is a function (`:260`) rather than an object literal, so the admin
feed reports the date actually written rather than the pre-stack one; mutation
MS2d confirms that is pinned. Both are careful, non-obvious choices.

---

## 5. S3 fail-closed, and the `has_more` addition

**Both correct. The addition is in scope.**

`checkPackageLineItem` (`_package_checkout.js:170-187`) runs at
`stripe-webhook.js:214`, before `resolvePackage` at `:221`, and both run before
any write. The harness pins the ordering at `:425` by index comparison, and pins
that months are never multiplied by quantity at `:427`.

- **Quantity.** Absent/null defaults to `1` and passes (`:178`), so a field
  Stripe happens not to send can never block a legitimate sale. Anything present
  and not strictly `1` is refused, including the string `'1'` — correct, since
  Stripe sends a number and a string would mean something unexpected is calling
  this. Fail-closed rather than multiplying is the right call for the reason
  given at `:145-154`: multiplying would double an entitlement off a field nobody
  currently sets, first exercised in anger on a live account.
- **`has_more`.** Correct, and the reasoning checks out. `stripe-webhook.js:199`
  lists with `{ limit: 1 }` and `:200` reads `data[0]`. Stripe sets `has_more` on
  that list when a second line exists, so a two-line package link is detectable
  without changing the fetch. Without the check, such a link charges for both
  lines and provisions the first — the identical "money and entitlement
  disagree" defect as S3, one level up.

**In scope?** Yes. It is the same defect class, found while fixing S3, in the
function written for S3, costing seven lines and one assertion. Refusing it on
scope grounds would have left a known, cheap hole open on a billing path. I would
not have written this as a separate packet.

**One gap, not a finding.** `has_more` detects that a second line exists, not
that `data[0]` is the right one. With `limit: 1` that is the best available
signal, and refusing on `has_more` makes the ambiguity unreachable.

---

## 6. The harness method hole

**The builder's claim is correct. My round-1 mutation testing was weaker than it
appeared, and I am stating that plainly rather than qualifying it.**

### The mechanism

`assert.match(src, /grantUntil = stacked/)` matches `// grantUntil = stacked`,
because the assertion tests the *text of a file* and a comment is text. This
matters specifically for `stripe-webhook.js`, which the harness can never
execute — it constructs a Stripe client and a Supabase service client at module
load (`:36`, `:81`), so it cannot be `require`d without live credentials. Every
claim the harness makes about that file is a claim about its source text. Source
text can be commented out, and commented-out source is still source text.

### What my round-1 testing actually established

I ran twelve mutations. Eleven were deletions or value substitutions; one was an
insertion. **Not one was a comment-out.** So what I established was that the ten
source assertions discriminate against *deletion*. What I wrote was that "none of
them is decorative", which reads as a claim that they pin the behaviour. They do
not. They pin the presence of a string. Against the mutation class I tested, that
is the same thing. Against commenting out, it is not.

### Verified against the current file

I ran six comment-out mutations on scratchpad copies:

| # | Line commented out | Assertion | Bound via | Result |
|---|---|---|---|---|
| MC1 | `const mode = session.mode \|\| 'subscription'` | `:202` | `read()` | **SURVIVED** |
| MC2 | `.in('plan_source', ['trial','comp','package'])` | `:295` | `read()` | **SURVIVED** |
| MC4 | `plan = (price?.metadata?.plan) \|\| PRICE_TO_PLAN[priceId]` | `:215` | `read()` | **SURVIVED** |
| MC5 | `if (!planSource) throw ...` | `:227` | `read()` | **SURVIVED** |
| MC3 | `grantUntil = stacked` | `:491` | `readCode()` | killed |
| MC6 | `const { held, toExpire } = partitionDueGrants(due)` | `:356` | `readCode()` | killed |

MC2 is the most alarming of the four. Commenting out `.in('plan_source', ...)`
leaves the query chain syntactically valid and removes the source filter
entirely, so **every** client with a past `plan_grant_until` and a non-free plan
is reverted — including `plan_source='stripe'` subscribers. That is a
catastrophic mutation and the harness stays green.

### The fix was applied only to the new assertions

`readCode()` (`:59`) is correct: it strips whole-line `//` comments and leaves
inline ones, so a URL inside real code survives. But the census of where it is
used shows the diagnosed hole was left open in exactly the assertions it was
diagnosed against:

```
199:  const src     = read('netlify/functions/stripe-webhook.js')       <- section 4, round-1
274:  const pkgSrc  = read('netlify/functions/_package_checkout.js')    <- section 5, round-1
282:  const hookSrc = read('netlify/functions/stripe-webhook.js')       <- section 5, round-1
294:  const exp     = read('netlify/functions/expire-plan-grants.js')   <- section 6, round-1
255:  readCode('netlify/functions/stripe-webhook.js')                   <- S6, new
353:  const exp     = readCode('netlify/functions/expire-plan-grants.js')  <- S1, new
374:  const hook    = readCode('netlify/functions/stripe-webhook.js')      <- S1, new
418:  const hook    = readCode('netlify/functions/stripe-webhook.js')      <- S3, new
486:  const hook    = readCode('netlify/functions/stripe-webhook.js')      <- S2, new
```

The builder wrote the correct conclusion into the comment at `:53-58` — "so
commenting a line out survived **every** source assertion in the file" — and then
fixed four bindings and left four. Recorded as **V5**. The fix is four
one-word edits.

`_package_checkout.js` and `expire-plan-grants.js` are partially protected by
being executed: `resolvePackage`, `checkPackageLineItem`, `addMonths`,
`stackedGrantUntil`, `normaliseGrantDate` and `partitionDueGrants` are all called,
so commenting out a line in their bodies fails a behavioural assertion regardless
of `read()` vs `readCode()`. `stripe-webhook.js` has no such backstop at all.

---

## 7. Mutation results

Twenty mutations, all on scratchpad copies. The mirror was re-run green after
every revert (`RESTORE CHECK: harness green after all mutations reverted`), and
the working-tree harness still reports 63 passed.

| # | Area | Mutation | Result |
|---|---|---|---|
| MS1a | S1 | `if (c && c.stripe_subscription_id)` → `if (false)` | killed |
| MS1b | S1 | revert loop iterates `due`, not `toExpire` | killed |
| MS1c | S1, 3rd fix | `handleSubscriptionDeleted` back to the blind `{ plan:'free', ... }` | killed |
| **MS1d** | **S1 companion** | **non-package branch back to `{ plan: 'free' }` (id not cleared)** | **SURVIVED — V2** |
| **MS1e** | **S1 dedupe** | **`.eq('meta->>ended', c.plan_grant_until)` → a constant** | **SURVIVED — V3** |
| MS2a | S2 | `grantUntil = stacked` → `grantUntil = grantUntil` | killed |
| MS2b | S2 | boundary `!(e < t)` → `(e > t)` | survived, **equivalent mutant**, not a finding (§4) |
| MS2c | S2 | `base = today` always (no stacking) | killed |
| MS2d | S2 | `eventMeta` back to an object literal | killed |
| MS3a | S3 | `if (quantity !== 1)` → `if (false)` | killed |
| MS3b | S3 | `if (hasMore === true)` → `if (false)` | killed |
| MS3c | S3 | guard unwired in the webhook | killed |
| MS6a | S6 | drop `plan_source` from the update literal | killed |
| MS6b | S6 | drop `plan_grant_until` from the update literal | killed |
| **MC1** | method | comment out the mode default | **SURVIVED — V5** |
| **MC2** | method | comment out the `plan_source` filter | **SURVIVED — V5** |
| MC3 | method | comment out `grantUntil = stacked` | killed (`readCode`) |
| **MC4** | method | comment out subscription plan resolution | **SURVIVED — V5** |
| **MC5** | method | comment out `createClientRow`'s required-param throw | **SURVIVED — V5** |
| MC6 | method | comment out the partition call | killed (`readCode`) |

**13 killed, 6 survived, 1 equivalent.** Round-1's sole survivor (M10) is now
killed twice over by MS6a/MS6b.

---

## 8. Security findings

Ranked. Every one is reproducible from the file and line given. Nothing
speculative: each has a stated path or a mutation number.

### V1 — MEDIUM. Cross-tier stacking converts cheap months into expensive ones, and a cheap package silently downgrades a live expensive one

**Where:** `_package_checkout.js:301` (base is `max(today, existing)` with no tier
input) together with `stripe-webhook.js:233` (`plan = resolved.plan`,
unconditional) and `:338` (`{ plan, ..., plan_grant_until: grantUntil }`, one
update, one `plan` column).

**Exploit path, direction A — arbitrage.** A founding client is sold a 36-month
Essentials package (`plan='essentials'`, grant `2029-08-01`). They are then sold,
or re-use, a 1-month Growth PRO package link. `stackedGrantUntil(1, '2029-08-01')`
returns `2029-09-01`, and `plan` is written as `growth_pro`. The client now holds
**37 months of Growth PRO**. At list prices that is roughly €4,013 paid for
roughly €16,613 of entitlement. Payment Links are reusable public URLs, so
possessing both links is sufficient; no Stripe access is needed.

**Exploit path, direction B — footgun.** The reverse order downgrades a live
paid tier. A client holding 12 months of Growth PRO who buys a 1-month Essentials
add-on ends at `plan='essentials'` through `2027-09-01`: eleven paid Growth PRO
months silently become Essentials, and no admin event says so, because
provisioning **succeeded**.

Both were reproduced by calling the real `stackedGrantUntil` (output in §4).

**Why this is new and why the ruling does not cover it.** Before stacking,
direction B existed in a milder form (the tier changed, but the date reset to
today+N, so no free months were created) and direction A did not exist at all —
that one is introduced by this change. Constantin's ruling settled forfeit vs
stack for a **renewal**, i.e. the same tier. It does not say that a one-month
purchase should re-price a three-year entitlement. My round-1 fix carried the
tier clause explicitly; dropping it was a decision that needed a ruling of its
own, not an extension of the existing one.

**Fix.** This needs a product decision before code — see the checkpoint. The
narrow, fail-safe code shape, if the decision is "stack months, never re-tier":

```js
// stripe-webhook.js, in the isPackage existing-client branch, after the read at :296
const curPlan = cur?.plan_source === PACKAGE_PLAN_SOURCE ? cur?.plan : null
// stack only when the new package is the same tier or the old grant is lapsed;
// otherwise refuse and alert, because the money is already captured.
if (curPlan && curPlan !== plan && stackedGrantUntil(0, cur?.plan_grant_until) > todayUtc()) {
  await reportUnprovisionedPackage({ session, log, reason: 'tier_conflict',
    detail: `client holds a live ${curPlan} package to ${cur.plan_grant_until}; a ${plan} package cannot stack onto a different tier`,
    email, priceId })
  return
}
```

Refusing beats guessing here for the same reason it does in S3: any automatic
answer picks a winner between two paid entitlements, and there is no right
default. `cur.plan` must be added to the select at `:298`.

**Pin it.** A harness case asserting that a different-tier base does not stack.

**Blocking:** not for this commit. **Blocking before a second package Payment
Link at a different tier exists**, which is the first moment it becomes
reachable.

### V2 — MEDIUM. The companion fix that keeps the S1 guard honest is not pinned, and reverting it reopens a permanent leak

**Where:** `stripe-webhook.js:524` (`: { plan: 'free', stripe_subscription_id:
null }`) and the assertion meant to pin it at
`package_provisioning.test.js:375`, `assert.match(hook, /stripe_subscription_id:
null/)`.

**Demonstration:** mutation **MS1d**. Changing `:524` to `{ plan: 'free' }`
leaves the harness at 63/63. The assertion is satisfied by the *other* branch at
`:523` (`? { stripe_subscription_id: null }`), which the mutation does not touch,
so it matches the wrong occurrence. `createClientRow`'s `stripe_subscription_id:
subId ?? null` at `:585` is a third string that would satisfy it.

**Why it matters more than a missing test.** This is the exact structural
position round-1's S6 occupied: the most load-bearing line in the change, pinned
by nothing. The consequence chain if it is reverted by a future edit with a green
harness: a cancelled subscription leaves a stale `stripe_subscription_id` →
`expire-plan-grants.js:95` reads that client as "still paying" → **every** future
`trial`, `comp` or `package` grant on that client is held forever → the client is
alerted exactly once by the §3 dedupe and then never again. A permanent revenue
leak that also silences its own alarm. The builder's own comment at `:481-488`
identifies precisely this risk and then does not pin against it.

**Fix.** Anchor the assertion to the branch, matching the style already used at
`:379`:

```js
assert.match(hook, /: \{ plan: 'free', stripe_subscription_id: null \}/,
  'an ordinary cancellation must clear the subscription id, or every future grant on that client is held forever')
```

**Blocking:** ship in the same commit. Same file, same section, one assertion.

### V3 — LOW. The alert dedupe key is not pinned

**Where:** `expire-plan-grants.js:130-132`. **Demonstration:** mutation **MS1e**
— replacing `c.plan_grant_until` with a constant leaves the harness at 63/63.

**Consequence:** with a constant key, the first held alert for a client
suppresses every later one, including a genuinely new grant date. That is exactly
the property §3 verifies as currently correct, and it is held in place by nothing
but the current text. There is no assertion on `reportHeldGrant` at all beyond
`assert.match(exp, /type: 'plan_expiry_held'/)` at `:366`.

**Fix.** `assert.match(exp, /\.eq\('meta->>ended', c\.plan_grant_until\)/, 'the
dedupe must key on the grant date, or one held alert silences every later one')`.

### V4 — LOW. A failed alert email is now never retried

**Where:** the interaction of `expire-plan-grants.js:141` (`if (alreadyAlerted)
return`) with `_admin_notify.js:28-45`, where the row insert and the email are in
separate `try/catch` blocks.

**Path:** the `admin_notifications` insert succeeds; `sendBrandedEmail` fails
(Resend outage, unset `RESEND_API_KEY`). The failure is swallowed at
`_admin_notify.js:43`. Every subsequent daily run finds the row and returns at
`:141`. The email for that grant date is never sent again. Before the dedupe, the
unconditional daily alert retried it every morning.

**Not silence, but degradation:** the bell row exists, and the client also appears
in `job_runs.detail.held_clients` on every run. This is the only path to reduced
alerting I could construct; every other failure mode alerts more, not less.

**On the S4 severity question.** The builder is right that round-1's S4
(`recordAdminEvent` cannot see a `{ error }` return, `_admin_notify.js:29`) is now
load-bearing rather than merely pre-existing, because the dedupe reads back a
write whose failure is unobservable. **But the severity change is smaller than
"load-bearing" implies, and the direction matters:** a silently failed *insert*
means no row, so the next run re-alerts. That is noise, not silence. The genuine
silence path is the email half above, which S4's proposed one-line fix does not
address. **S4 moves LOW → LOW, unchanged in rating, changed in reason.** It
should still be fixed; it is one line.

### V5 — LOW. The harness method hole was diagnosed correctly and fixed in only half the file

**Where:** `package_provisioning.test.js:199`, `:274`, `:282`, `:294` bind source
via `read()` while `:255`, `:353`, `:374`, `:418`, `:486` use `readCode()`.

**Demonstration:** mutations MC1, MC2, MC4, MC5 all **SURVIVED**; MC3 and MC6,
bound via `readCode()`, were killed. Full table in §6. MC2 is the severe one: it
removes the `plan_source` filter from the expiry job entirely, so every client
with a past grant date and a non-free plan is reverted regardless of source, and
the harness stays green.

**Fix.** Four one-word edits: `read(` → `readCode(` at `:199`, `:274`, `:282`,
`:294`. One caution — `:277` and `:283` are **negative** assertions, where
comment-stripping is required for correctness in the opposite direction (a
comment containing `const SELF_SERVE_PLANS =` would otherwise fail the test
spuriously). `:277` already strips comments inline; `:283` does not and should
move to `readCode` for that reason too.

### V6 — LOW, PRE-EXISTING. `handleSubscriptionDeleted` protects a live package but not a live trial or comp

**Where:** `stripe-webhook.js:518`, `holdsLivePackage` requires `row.plan_source
=== PACKAGE_PLAN_SOURCE`.

**Path:** a client on `plan_source='trial'` with a live `plan_grant_until` and a
subscription that is cancelled falls to the `else` branch at `:524` and is set to
`plan='free'` immediately, while `plan_source='trial'` and the future
`plan_grant_until` remain. `expire-plan-grants.js:173`'s `.neq('plan','free')`
then excludes the row forever, so the stale grant date is never cleaned either.
The comped window is destroyed on the day they cancel.

**Not a regression.** The old blind `update({ plan: 'free' })` did the same, and
A1's deviation at `:338` actually makes this state rarer by stamping
`plan_source='stripe'` on every paid checkout. Rated LOW for that reason.

**Why it is worth recording anyway:** the builder's justification for the *other*
guard, at `expire-plan-grants.js:69-75`, is explicitly that *"'packages are
special' is not"* the invariant worth having — and then this handler, in the same
change, applies exactly that rule. The two guards should agree. **Fix:** widen
`:518` to `row.plan_source !== 'stripe' && row.plan_source !== 'manual'`, or
equivalently test `!!row.plan_grant_until && !(row.plan_grant_until < today)`
alone, which is the property that actually matters.

### V7 — INFO. A comment overstates a module-load safety property

`package_provisioning.test.js:43-45` and `expire-plan-grants.js:88-90` both state
that `expire-plan-grants.js` "reads no env var at load time". It does:
`expire-plan-grants.js:40` evaluates `process.env.ADMIN_ALERT_EMAIL` at module
scope. Harmless — it is defaulted and cannot throw, which is why the harness runs
— but the claim is what a future reader will rely on when deciding whether a
second module is safe to `require` from a test. The true property is "constructs
no client and cannot throw at load time". Comment only.

### Checked, and NOT findings

Stated so the absence is evidence rather than omission.

- **No new endpoint.** `expire-plan-grants.js:262` adds `exports.partitionDueGrants`
  alongside `exports.handler`. Netlify resolves only `handler`, so the HTTP
  surface is unchanged and still behind `requireCronAuth`.
- **`reportHeldGrant` cannot abort the job.** Verified through both `try/catch`
  blocks and `recordAdminEvent`'s own. A throw at `:188` would prevent every
  expiry that run.
- **The new read on the provisioning path cannot half-provision.**
  `stripe-webhook.js:296-301` runs before the first write, and its `throw`
  releases the idempotency lock at `:143` so Stripe redelivers. The residual —
  Stripe exhausting retries leaves no `package_unprovisioned` event — is the same
  shape as the pre-existing throws at `:278` and `:345`, so it is not new in kind
  and I cannot demonstrate a new failure from it.
- **No plan can be self-provisioned that could not be before.** `SELF_SERVE_PLANS`
  is unchanged at `_package_checkout.js:63`; `isValidPlan` plus the membership
  test still refuse `managed` twice over (`:106`, `:109`).
- **No injection into admin email.** `c.stripe_subscription_id` and
  `c.plan_grant_until` reach `sendBrandedEmail` paragraphs; `_email.js:17-21`
  HTML-escapes `&`, `<`, `>`. Both values are Stripe- or database-supplied, not
  attacker-controlled.
- **`meta->>ended` is valid against the real column.** `meta` is `jsonb`
  (`db/supabase-admin-notifications-migration.sql:24`).

---

## 9. Accessibility findings

This change touches three Netlify functions and one Node harness. **No new
interactive element, no new text-on-surface pair, no new heading, no new hit
target, no change to focus order or keyboard reachability.** Contrast ratios are
not computable for this change and none is reported rather than invented.

One rendering consequence, admin-only, and it is the same defect class as
round-1's S5: `admin_notifications.type` gains `plan_expiry_held`
(`expire-plan-grants.js:144`), and `src/components/AdminBell.tsx:25-31`'s `ICON`
map has no entry for it, so `ICON[n.type] ?? Bell` renders the generic bell. The
alert that says "a customer is being charged for a plan we were about to take
away" is visually identical to routine traffic. Owner `bg-app`, non-blocking,
folds into round-1 S5.

The customer-facing copy at `expire-plan-grants.js:211-217` is unchanged in
styling and renders through the existing `ClientBanner` amber treatment. Checked
against AGENT-OS §7.3: no em dash, no en dash, no banned vocabulary.

---

## 10. Regression surface

Found by grep. Paths needing a manual look are named.

**Consumers of `stripe_subscription_id`**, the column this change starts writing
`null` into and starts gating on. Full census outside the changed files and docs:

| Path | What it does | Affected? |
|---|---|---|
| `get-subscription.js:25,30,36` | selects it; returns `{ active: false }` when falsy | **No.** Correct for a cleared id — this is the branch the round-1 review already verified |
| `set-client-plan.js:143,173` | selects it; drives the "Stripe-billed" warning | **Yes, weakens.** After a cancellation the id is now `null`, so the warning at `:173` stops firing for a client who used to trigger it. That is *correct* (they are no longer billed) but it removes the only signal that also happened to cover S8's package case. Folds into round-1 S8 |
| `expire-plan-grants.js:95,169` | the new liveness guard | in scope, reviewed |
| `stripe-webhook.js:339,457,523,524,585` | writers | in scope, reviewed |
| `db/supabase-stripe-webhook-migration.sql:21` | `text`, no constraint | **No.** `null` inserts cleanly |

**Writers of `clients.plan` that do not read `plan_source`/`plan_grant_until`** —
the census question round-1 should have asked (§1):

| Path | Reads the grant columns before writing `plan`? |
|---|---|
| `stripe-webhook.js:501-548` `handleSubscriptionDeleted` | **Now yes** (`:506`). This was the gap |
| `stripe-webhook.js:445-476` `handleSubscriptionUpdated` | **No**, at `:457`. Writes `plan` blindly on every subscription update. Benign today — it only ever *raises* the plan to what Stripe says is being paid for — but it is the same blind-write shape. **Needs a manual look before any further grant work**, not blocking now |
| `set-client-plan.js:143` | Yes |
| `expire-plan-grants.js:193` | Yes, by construction |
| `onboard-client.js`, `signup-client.js` | New rows only; no grant to destroy |

**New `admin_notifications.type` values:** `plan_expiry_held`. `grep` shows the
only consumer is `AdminBell.tsx`'s `ICON` map (§9). `type` is `text not null`
with no CHECK, so it inserts cleanly.

**`job_runs.detail` gains `held` and `held_clients`** (`expire-plan-grants.js:254-255`).
`grep -rn "job_runs" netlify src` shows three writers and **zero readers in the
codebase** — it is queried in SQL only. No consumer to break.

**New module-load edge from the harness:** `package_provisioning.test.js:46` now
`require`s `expire-plan-grants.js`, pulling in `@supabase/supabase-js`, `_plans`,
`_email`, `_admin_notify` and `_cron_auth` at test time. Verified none throws or
constructs a client at load; `_cron_auth.js` reads `CRON_SECRET` inside the
function, not at module scope. See V7 for the inaccurate comment about this.

**Deploy surface:** three functions under `brandgeo-dashboard/`, so
`netlify.toml`'s `ignore` diff correctly triggers a dashboard build. No cPanel
surface involved.

---

## 11. Data and claim integrity

Every user-facing number and factual claim in new copy, traced.

| Claim / number | Where | Traced to |
|---|---|---|
| "Their {planLabel} grant ({plan_source}) ended on {date}" | `expire-plan-grants.js:146` | `PLAN_LABELS` (`_plans.js`), and both values read from the row selected at `:169`. Admin-facing |
| "the client still has an active Stripe subscription ({id})" | `:147` | `c.stripe_subscription_id` from the same select. **The word "active" is an inference, not a fact** — the row proves an id was recorded, not that Stripe still considers it live. Accurate in every path except the stale-id case in §2, which is the case the alert exists to surface. Acceptable, admin-only |
| "They were NOT reverted to Free and were NOT emailed" | `:147-148` | True: `reportHeldGrant` is called at `:188` and `held` rows never enter the loop at `:191`, which is the only place `client_notifications` is written |
| "Your {planLabel} package has ended" / "returned to the Free plan" | `:211-215` | `PLAN_LABELS`; the write at `:194` sets `plan: 'free'`. Copy matches the write |
| "Access runs to {grantUntil}, then reverts to Free." | `stripe-webhook.js:351`, `:373`, `:407` | `grantUntil` is now the **post-stack** value, because `eventMeta` is a function (`:260`) and these strings interpolate after `:308`. The claim is exact against the row written at `:338` |
| "a client canceled their subscription but holds a paid package on {plan} until {date}" | `:534-535` | `row.plan` and `row.plan_grant_until` from the select at `:506`, and the update at `:523` leaves both untouched. Exact |
| "plan + months, 1-36" in the unprovisioned alert | `:432` | `_package_checkout.js:68-69`. Unchanged |
| quantity refusal detail | `_package_checkout.js:183` | `JSON.stringify(quantity)` of the real line item. Not invented |

**Untraceable claims: none.** Every number resolves to a constant, a database
column, or a Stripe-supplied field in the same repo.

**One claim I could not verify:** `expire-plan-grants.js:77-78`, *"Checked
read-only against production 2026-07-31: of 36 client rows, ZERO carry a
stripe_subscription_id."* This is the load-bearing evidence that the broader S1
guard holds nothing back today. I did not query production. If it is wrong, the
first run of the new job could hold live clients rather than merely guard against
a future state — which changes nothing about the ruling in §2, but does change
what the first run does. Recorded under "What was not checked".

---

## 12. What was not checked

Explicit and complete.

1. **Any database write, on any path.** No Supabase client was constructed; no
   row was written or read. Unproven at runtime: that `plan_expiry_held` inserts;
   that the `meta->>ended` PostgREST filter returns what §3 assumes; that the
   `holdsLivePackage` update at `stripe-webhook.js:523` persists a partial update
   without clearing `plan`; that `stacked` dates land correctly in a `date`
   column. **No database write in this change has ever executed.** The harness
   being green is not evidence about any of it, by construction.
2. **Anything against Stripe.** `livemode: true`, no test mode, and testing on
   live was not attempted and must not be. No real `checkout.session.completed`
   and no real `customer.subscription.deleted` has ever reached this code. The
   `has_more` semantics under `{ limit: 1 }` are from the Stripe list contract,
   not from an observed response.
3. **The git diff.** No `git` command was run, per instruction. I cannot state
   which lines are new versus pre-existing, cannot rule out a fifth changed file,
   and the pre-A1 shape of `handleSubscriptionDeleted` rests on my own round-1
   report rather than on a diff. **Someone with git access should confirm that
   `handleSubscriptionUpdated` (`:445-476`) and `createClientRow` (`:570-601`)
   are byte-unchanged this round** — I traced them as behaviourally consistent,
   not as byte-identical.
4. **Production state.** The 36-rows/zero-subscription-ids claim
   (`expire-plan-grants.js:77-78`) was not re-verified. Nor was whether any
   client currently sits in the `plan_source in ('trial','comp')` plus live
   subscription state that V6 concerns.
5. **`npm run build`.** Not run. `tsc --noEmit` exits 0 but reads none of these
   files (`"include": ["src"]`). `node --check` is the applicable gate and is
   clean on all three.
6. **Browser verification.** None. There is no UI in this change. The
   `AdminBell` icon gap in §9 was found by reading `AdminBell.tsx:25-31`, not
   observed at any viewport.
7. **Concurrency.** Two `checkout.session.completed` events for the same client
   arriving together are serialized only by the `stripe_events` unique insert,
   which does not cover two *different* sessions. **Stacking makes this newly
   interesting**: two concurrent package purchases could both read the same
   `plan_grant_until` at `:296` and each write `base + N`, granting `N` months
   instead of `2N`. Read-modify-write with no locking. I did not analyse it
   further because it needs a database to demonstrate, and the realistic arrival
   pattern for hand-created Payment Links is not concurrent. **Named here so it
   is not mistaken for something I cleared.**
8. **The other workstream's files.** `src/` changes carrying today's mtimes are
   outside scope and were not reviewed.

---

## 13. Summary of required actions

| ID | Severity | Owner | Blocking? |
|---|---|---|---|
| V1 | MEDIUM | Constantin decides, then `bg-backend` | **Before a second package Payment Link at a different tier exists** |
| V2 | MEDIUM | `bg-backend` | Ship in this commit — one assertion, same file |
| V3 | LOW | `bg-backend` | No; ship with V2 |
| V4 | LOW | `bg-backend` | No |
| V5 | LOW | `bg-backend` | No; four one-word edits, ship with V2 |
| V6 | LOW, PRE-EXISTING | `bg-backend` | No |
| V7 | INFO | `bg-backend` | No |
| S4 (round 1) | LOW, unchanged rating | `bg-backend` | No. Re-reasoned in V4 |
| S5, S7, S8 (round 1) | LOW / INFO | `bg-app`, `bg-backend` | No. Unchanged, plus `plan_expiry_held` joins S5 |
| (a), (b) (round 1) | doc amendment | `bg-architect` | No. `custom-entitlements.md` §3.1 and §3.3 still misleading |

**Not to be changed.** Each was challenged in this review and survived: the
`handleSubscriptionDeleted` rewrite (`stripe-webhook.js:501-548`); the broader
liveness guard keyed on the subscription id alone (`expire-plan-grants.js:95`);
the once-per-(client, grant date) dedupe (`:127-141`); the `has_more` refusal
(`_package_checkout.js:171-177`); `throw`-not-degrade on the new grant read
(`stripe-webhook.js:296-301`); and `eventMeta` as a function (`:260`).

---

```
=== HUMAN CHECKPOINT ===
NEED:      When a client buys a package while holding a LIVE package at a
           DIFFERENT tier, should the months stack?
WHY:       Your 2026-07-31 ruling settled forfeit-vs-stack for a renewal at the
           same tier. The build stacks on months with no tier check, so a
           1-month Growth PRO purchase re-tiers 36 stacked Essentials months to
           Growth PRO (~EUR 4,013 paid for ~EUR 16,613 of entitlement), and a
           1-month Essentials purchase downgrades 11 paid Growth PRO months.
           Both reproduced against the real function. This is a pricing call,
           not a code call, and BILLING is livemode:true with no test mode.
OPTIONS:   A) Stack only within the same tier; refuse a different-tier package
              and raise package_unprovisioned -> no free upgrades, no silent
              downgrades, one manual provision per conflict. Matches the S3
              precedent (refuse rather than guess about money).
           B) Stack across tiers, new tier wins for the whole window ->
              today's behaviour. Simple, and the arbitrage above is live the
              moment two package links at different tiers exist.
           C) Refuse to stack across tiers only when the new tier is LOWER ->
              blocks the downgrade footgun, keeps the arbitrage open.
DEFAULT:   B, i.e. nothing changes, because that is what is on the working tree.
TO RUN:    Nothing yet. This is a decision, not a command. No package Payment
           Link exists today, so nothing is exposed while you decide.
TO VERIFY: After deciding, confirm no second package Payment Link at a
           different tier has been created in the Stripe dashboard
           (livemode) before the fix ships:
           https://dashboard.stripe.com/payment-links
=== END CHECKPOINT ===
```

---

Reviewer note on my own round-1 report: §6 of `docs/qa/package-provisioning-014.md`
claims eleven of twelve mutations killed and concludes "none of them is
decorative". That conclusion is correct for the mutation class I tested
(deletion) and **overstated as written**. Four of those assertions do not
survive a comment-out, proven here by MC1, MC2, MC4 and MC5. `docs/qa/` is
append-only by convention, so §6 stands as written and this paragraph is the
correction.
