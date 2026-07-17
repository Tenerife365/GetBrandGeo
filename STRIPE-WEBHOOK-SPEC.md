# STRIPE-WEBHOOK-SPEC.md — auto-provisioning spec (for Master-DashboardDesign)

> **Date:** 2026-07-09 · **Author:** `Master-Billing` (spec only — not built here)
> **Owner to build:** `Master-DashboardDesign` — this is a
> `brandgeo-dashboard/netlify/functions/` job, out of Master-Billing's scope.
> **Prereq shipped:** self-serve Stripe Payment Links for Essentials & Growth
> are live on the site (CLAUDE.md §10). Today a customer pays but their plan is
> **not** set in Supabase — this webhook closes that gap.

---

## 1. What this does

A Stripe webhook endpoint that listens for subscription events and provisions
the customer automatically:

- **On payment** → find or create the client's `clients` row + login, set
  `clients.plan` to the purchased tier.
- **On plan change** (upgrade/downgrade in Stripe) → update `clients.plan`.
- **On cancellation** → downgrade `clients.plan` to `free` (keep the account).

Scope is **Essentials & Growth only** — those are the only self-serve tiers with
Payment Links. Managed/Pro/Enterprise are sales-closed and provisioned by hand
via the Onboard wizard, unchanged.

---

## 2. New Netlify function — `stripe-webhook.js`

Create `brandgeo-dashboard/netlify/functions/stripe-webhook.js`.

**Critical: this function must NOT call `requireAuth(event)`.** Stripe calls it
server-to-server with no JWT and from Stripe's IPs, not the site's origin — the
existing `_auth.js` (JWT + origin whitelist, §1.6) would reject every call.
Authentication here is **Stripe signature verification** instead.

### 2.1 Signature verification (the auth model)

```js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature']
  // Netlify may base64-encode the body; constructEvent needs the RAW bytes.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.log('[stripe-webhook] bad signature:', err.message)
    return { statusCode: 400, body: `Webhook signature failed: ${err.message}` }
  }
  // ... handle stripeEvent.type (§4)
  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
```

**Do not JSON.parse the body before `constructEvent`** — it needs the exact raw
string or signature verification fails. Only parse from `stripeEvent.data` after.

### 2.2 Supabase client

Same pattern as every other function (§4.6): server-side service key, bypasses
RLS.

```js
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
```

---

## 3. Config to add

### 3.1 Netlify env vars
| Var | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` — to init the Stripe SDK + retrieve line items |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — from the Stripe webhook endpoint you create (§3.3) |

(`SUPABASE_URL` / `SUPABASE_SERVICE_KEY` already exist.)

### 3.2 `netlify.toml`
No special timeout needed (fast DB writes), but add for clarity:
```
[functions."stripe-webhook"]
  timeout = 15
```

### 3.3 Stripe Dashboard → Developers → Webhooks → + Add endpoint
- **URL:** `https://app.getbrandgeo.com/.netlify/functions/stripe-webhook`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - *(optional)* `invoice.payment_failed` — for a dunning/notify hook later
- Copy the endpoint's **Signing secret** (`whsec_...`) → set as
  `STRIPE_WEBHOOK_SECRET`.

---

## 4. Supabase schema additions (migration — run before deploy)

The `clients` table has no Stripe columns today. Add them so the webhook can map
a Stripe customer/subscription back to a client on later events (upgrade/cancel)
without relying on email each time.

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer
  ON clients(stripe_customer_id);
```

*(Optional idempotency table — dedupe retried webhooks by Stripe event id:)*
```sql
CREATE TABLE IF NOT EXISTS stripe_events (
  id          text PRIMARY KEY,          -- Stripe event.id (evt_...)
  type        text,
  received_at timestamptz DEFAULT now()
);
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;  -- deny-all; service key only
```

---

## 5. Price → plan mapping

Payment Links don't carry the plan name — the webhook must derive the tier from
the **price** on the subscription's line item. Two ways; do **(A)**, keep **(B)**
as the hardcoded fallback.

**(A) ✅ ALREADY DONE — `metadata.plan` is set on all 4 live prices (2026-07-09,
by Master-Billing via the Stripe connector).** The webhook should read
`price.metadata.plan` first and never needs a code change when prices are added
or repriced. Confirmed live values:

| Price ID | interval | `metadata.plan` |
|---|---|---|
| `price_1TrLPgKh2GaZE2B4kqgmQsiO` | €99/mo | `essentials` |
| `price_1TrLSeKh2GaZE2B48iVobXF9` | €990/yr | `essentials` |
| `price_1TrLQhKh2GaZE2B4gLPWMger` | €299/mo | `growth` |
| `price_1TrLR6Kh2GaZE2B4mYqOHBhQ` | €2,990/yr | `growth` |

**(B) Fallback — hardcoded price-ID → plan map** (the real live IDs, pulled from
the account 2026-07-09):

```js
const PRICE_TO_PLAN = {
  'price_1TrLPgKh2GaZE2B4kqgmQsiO': 'essentials', // Essentials €99/mo
  'price_1TrLSeKh2GaZE2B48iVobXF9': 'essentials', // Essentials €990/yr
  'price_1TrLQhKh2GaZE2B4gLPWMger': 'growth',     // Growth €299/mo
  'price_1TrLR6Kh2GaZE2B4mYqOHBhQ': 'growth',     // Growth €2,990/yr
}
```

Plan slugs match `planConfig.ts`'s `Plan` union (`free|essentials|growth|managed
|pro|enterprise`) exactly — reuse those, don't invent new strings.

To read the purchased price on `checkout.session.completed`:
```js
const session = stripeEvent.data.object
const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
const priceId = lineItems.data[0].price.id
const plan = lineItems.data[0].price.metadata.plan || PRICE_TO_PLAN[priceId]
```
On `customer.subscription.*` the price is at
`stripeEvent.data.object.items.data[0].price`.

---

## 6. Event handlers

### 6.1 `checkout.session.completed` — provision
```
session = event.data.object
email    = session.customer_details.email        // lowercased
custId   = session.customer                       // cus_...
subId    = session.subscription                   // sub_...
plan     = (from §5)

1. Idempotency: if stripe_events has event.id → return 200 (already handled).
   Else insert event.id.
2. Look up an existing auth user by email (auth.admin.listUsers, filter by
   email — or getUserByEmail if available in the SDK version).
   a. EXISTS → find their client via user_profiles.client_id → UPDATE that
      clients row: set plan, stripe_customer_id, stripe_subscription_id.
   b. NOT EXISTS → provision new (mirror onboard-client.js's atomic pattern):
      - INSERT clients { name: email-or-domain, slug: unique, plan,
        stripe_customer_id, stripe_subscription_id, default_market_id: 'WW' }
      - auth.admin.inviteUserByEmail(email, { redirectTo:
        'https://app.getbrandgeo.com/reset-password' })   // same path as
        onboard-client.js / signup-client.js — sends the branded set-password
        email (#106), so the customer sets their own password.
      - INSERT user_profiles { id: authUser.id, role: 'viewer', client_id }
      - Roll back the client row if any step fails (same chain as
        onboard-client.js).
3. Return 200.
```

**Reuse, don't reinvent:** the create-client + invite + user_profiles sequence
(with rollback) already exists verbatim in `onboard-client.js` — lift that logic
rather than writing fresh. The only new part is reading the plan from Stripe and
storing the two `stripe_*` ids.

### 6.2 `customer.subscription.updated` — plan change
```
sub    = event.data.object
custId = sub.customer
plan   = (from the sub's current price, §5)
→ UPDATE clients SET plan = <plan>, stripe_subscription_id = sub.id
  WHERE stripe_customer_id = custId
```
Handles a customer upgrading Essentials→Growth (or the annual/monthly swap) in
the Stripe Customer Portal.

### 6.3 `customer.subscription.deleted` — cancel
```
sub = event.data.object
→ UPDATE clients SET plan = 'free' WHERE stripe_customer_id = sub.customer
```
Downgrade to free rather than deleting — keeps their login and history; they can
re-subscribe. (Business call: confirm "cancel → free" vs "cancel → read-only".)

### 6.4 *(optional)* `invoice.payment_failed`
Log + optionally email the customer / notify Constantin. Not required for v1.

---

## 7. Idempotency, ordering, and safety

- **Idempotent:** Stripe retries on any non-2xx and can deliver duplicates.
  Dedupe on `event.id` (§4 table) OR make every write an upsert keyed on
  `stripe_customer_id`. Always return **200** once handled (even a duplicate) so
  Stripe stops retrying.
- **Return 200 for event types you don't handle** — don't 400/500, or Stripe
  will retry them forever.
- **Never trust the amount/plan from anything but the Stripe object** you
  retrieved server-side.
- **Log format** `[stripe-webhook/<evt.id>] ...` per §4.6.

---

## 8. Add the Stripe Customer Portal (self-serve card/cancel) — small add-on

Enable in **Stripe → Settings → Billing → Customer portal** (no code), then link
customers to it from the dashboard account page (a `brandgeo-dashboard` UI task).
Optionally a tiny `create-portal-session.js` function returns a portal URL for a
logged-in client. Lets customers update cards / cancel themselves — cancellations
then flow back through §6.2/§6.3 automatically.

---

## 9. Testing (before pointing real traffic at it)

1. **Stripe CLI local:** `stripe listen --forward-to
   localhost:8888/.netlify/functions/stripe-webhook` (via `netlify dev`), then
   `stripe trigger checkout.session.completed`. Confirm a client row is
   created/updated + invite fires.
2. **Test mode end-to-end:** make test-mode Payment Links, pay with `4242 4242
   4242 4242`, watch the function log + the Supabase row.
3. **Live smoke:** one real Essentials monthly purchase → confirm plan set +
   invite email received → refund/cancel to clean up.
4. Confirm the Netlify deploy **succeeded** (Deploys tab, §7.6 lesson) — a failed
   function bundle silently keeps serving old code, and this is a brand-new
   function file.

---

## 10. Kickoff prompt for the Master-DashboardDesign chat

> `Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then start a
> Master-DashboardDesign task per CLAUDE.md §10 + STRIPE-WEBHOOK-SPEC.md — build
> brandgeo-dashboard/netlify/functions/stripe-webhook.js for Stripe self-serve
> auto-provisioning (Essentials/Growth). Follow the spec exactly: Stripe
> signature auth (no _auth.js), raw-body handling, the price→plan map, the
> clients/user_profiles provisioning (reuse onboard-client.js's create+invite+
> rollback), the schema migration in §4, and idempotency. Scope:
> brandgeo-dashboard/ only. Run npm run build, then hand me the git commands +
> the Stripe/Netlify config steps.`

Route to **Opus 4.8** — it touches auth, webhooks, and DB writes (the
hybrid-routing rule's security/schema category, §0).
