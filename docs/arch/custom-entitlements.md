# Custom entitlements and package payments (ROADMAP A2)

Written 2026-07-31. Binding on A1, A3 and A4. `bg-backend` on Opus implements;
`bg-verify` reviews before anything reaches production, per AGENT-OS §2 —
this is billing.

The goal is the founding-client offer: a hand-built plan mixing entitlements
from several tiers, sold as a multi-month package at a negotiated price, paid
by card, provisioning automatically.

---

## 1. What already exists, and what genuinely does not

Worth stating precisely, because two of these were assumed missing and are not.

| Capability | State |
|---|---|
| Assign any tier to a client | **Exists.** `set-client-plan.js`, admin-only |
| Time-boxed grant with auto-revert | **Exists.** `plan_grant_until` + `expire-plan-grants.js` |
| Per-client engine mixing | **Exists.** `clients.engines_enabled`, sparse JSONB override |
| Per-client prompt limit | **Missing.** `PLAN_PROMPTS` is keyed by plan only |
| Custom price for a client | **Missing.** No pricing object of any kind |
| Any Stripe write from the product | **Missing.** Portal, one read, and the inbound webhook. Nothing else |
| One-off / package payment provisioning | **Missing, and silently so.** See §2 |

So the entitlement half is most of the way there. The money half does not exist.

---

## 2. The live defect this design has to fix first (A1)

`stripe-webhook.js:142`:

```js
if (session.mode && session.mode !== 'subscription') {
  log('non-subscription checkout, skipping:', session.mode)
  return
}
```

A package is naturally sold as a one-time payment. Today that customer pays,
the webhook logs one line to a console nobody reads, and **nothing is
provisioned**. No error, no admin event, no email. The money arrives and the
product does not react.

### 2.1 The trap underneath it

`expire-plan-grants.js:56` reverts only:

```js
.in('plan_source', ['trial', 'comp'])
```

So the obvious implementation — provision the package with `plan_source:
'stripe'` — produces a client who **keeps the plan forever** after paying for
twelve months. The revenue leak is silent and permanent, and it would not
surface until someone audited plans against subscriptions by hand.

Any fix to §2 that does not also touch `expire-plan-grants` is wrong.

---

## 3. Design

### 3.1 A package is a Stripe one-time price carrying two metadata keys

```
metadata.plan   = 'growth' | 'growth_pro' | ...   (must match planConfig.ts)
metadata.months = '12'                            (integer, 1..36)
```

`metadata.plan` is already the primary resolution mechanism for subscriptions
(`stripe-webhook.js` prefers it over the `PRICE_TO_PLAN` fallback), so packages
reuse a path that is proven rather than inventing one.

### 3.2 Provisioning

On `checkout.session.completed` with `mode === 'payment'`:

1. Resolve `plan` and `months` from the line item's price metadata.
2. **If either is missing or invalid, do not provision.** Log, and record an
   admin event so a paid-but-unprovisioned customer is visible in the product
   rather than only in a log. This is the current behaviour made loud.
3. Otherwise provision through the same three branches as a subscription, with:
   - `plan_source: 'package'`
   - `plan_grant_until: today + months`
   - `stripe_subscription_id: null` (there is no subscription; do not invent one)

`createClientRow()` gains `planSource` and `grantUntil` parameters. All three
call sites pass them. The subscription path passes `plan_source: 'stripe'` and
`grantUntil: null`, which is its behaviour today, stated explicitly.

### 3.3 Expiry

Add `'package'` to `expire-plan-grants.js`'s filter. A package reverts to Free
on the day after it ends, exactly like a trial, and the existing notification
and `client_events` row come free.

### 3.4 Custom entitlement beyond the tier

Engines already work via `engines_enabled`. Prompts need the equivalent:

```sql
ALTER TABLE clients ADD COLUMN prompt_limit_override int;  -- null = use plan default
```

Read it wherever `PLAN_PROMPTS[plan]` is read today. **`planConfig.ts` is the
single source of truth and `_cost.js` mirrors it by hand** — this repo already
carries four hand-kept copies of the plan ladder and has been bitten by their
drift, so this change must land in both, with a test asserting they agree.

Deliberately NOT introducing a `client_entitlements` table yet. Two nullable
override columns cover every case the founding-client offer needs, and a new
table would be a fifth place for the ladder to drift.

### 3.5 What stays manual, permanently

Creating the price is an agent action. **Sending it to a customer is not.**
`AUTONOMY.md` §2: no agent sends an offer, invoice or payment link to a real
customer. The connection is `livemode: true`; a wrong price that nobody was
sent is a deleted object, a wrong price that was sent is a refund and an
apology.

---

## 4. Acceptance

A1 is done when all of these hold:

1. A `mode: 'payment'` session with valid metadata provisions a client at the
   right plan with `plan_source = 'package'` and a correct `plan_grant_until`.
2. The same session with missing or invalid metadata provisions nothing AND
   records an admin event.
3. `expire-plan-grants` reverts a `package` client whose grant has passed.
4. A subscription checkout behaves exactly as it does today. This is a
   regression risk, not a hope: the shared `createClientRow` path changes.
5. No hardcoded plan list is added. Five copies is not a fix for four.

Verify against Stripe **test mode**, not the live account. If test mode is not
connected, that is a blocker to raise, not a reason to test on live.
