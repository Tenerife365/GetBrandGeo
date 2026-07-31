# BILLING-IMPLEMENTATION.md — Master-Billing

> **Date:** 2026-07-09 · **Owner:** `Master-Billing` (CLAUDE.md §10)
> **Source of truth for every number:** `PRICING-SPEC.md` §1–§3, §4 row 5.
> **Scope:** Stripe / billing only. Does not touch `brandgeo/web/`
> (Master-SiteDesign) or `brandgeo-dashboard/` (Master-DashboardDesign).
> **Status:** Ready-to-run checklist for Constantin. Nothing is auto-executed —
> the Stripe MCP connector is not authorized in this session, and per the
> execution-delegation rule this is handed to you as exact steps.

---

## 0. TL;DR — what to do, in order

1. **Use Stripe as the billing system of record.** Wise cannot do recurring
   subscriptions, proration, add-ons, dunning, or a self-serve checkout — it's a
   transfer/invoicing tool. Keep Wise for what it's good at (receiving large
   Enterprise wires cheaply, treasury/payout account). See §1.
2. **Create the products/prices** in §2 (Essentials, Growth, Managed, Pro +
   Managed setup fee). ~30 min in the Stripe Dashboard.
3. **Create the add-on prices** in §3 — but **confirm the unit amounts first**
   (they're my proposal, not from the spec).
4. **Migration (§4): almost certainly a no-op today** — there are zero Stripe
   subscriptions right now (billing was never wired). The procedure + notice
   email are here for when real subs exist.
5. **Self-serve checkout (§5): assessment + recommended path.** Fastest revenue =
   Payment Links for Essentials/Growth this week; proper auto-provisioning is a
   small code fast-follow that belongs to a dashboard/functions session (not this
   scope).

---

## 1. Platform decision — Stripe, not Wise (and where Wise still fits)

You asked whether Wise (you use it, and have a Wise Link) could do this instead.
Short answer: **no, not as the billing backbone** — but it has a real
supporting role.

| Capability this pricing model needs | Stripe | Wise |
|---|:--:|:--:|
| Recurring subscriptions (monthly + annual) | ✅ | ❌ (one-off transfers/requests only) |
| Multiple tiers / plan switching | ✅ | ❌ |
| Proration on upgrade/downgrade | ✅ | ❌ |
| One-time setup fee on first invoice | ✅ | ⚠️ (separate manual request) |
| Quantity-based add-ons (prompt packs, seats…) | ✅ | ❌ |
| Failed-payment retries / dunning | ✅ | ❌ |
| Self-serve hosted checkout | ✅ | ⚠️ (static link, no subscription logic) |
| Customer billing portal (cancel/update card) | ✅ | ❌ |
| Migrate existing subs to new prices | ✅ | ❌ |
| EU VAT handling (Stripe Tax) | ✅ | ❌ |

**Recommendation:**
- **Stripe = system of record** for all six tiers and all add-ons. Everything in
  §2–§5 is Stripe.
- **Wise = keep for two things:** (a) receiving **Enterprise** payments by
  international wire, where Wise's FX/fees beat card processing on a
  €10k+/mo deal — send those clients a Wise invoice or your Wise Link instead of
  charging a card; (b) as a low-cost **payout/settlement account** if you want
  Stripe to pay out to a Wise multi-currency balance. A Wise Link is fine for a
  **one-off** (a single Enterprise setup payment, a deposit) — never for the
  recurring subscription itself.

> **Before you start:** confirm your Stripe account has **EUR** enabled as a
> presentment currency (Settings → it can charge EUR regardless of your payout
> currency). All prices below are in EUR. Decide up front whether the spec's
> numbers are **net (ex-VAT)** — for EU B2B they should be, with VAT added via
> **Stripe Tax** (reverse-charge for EU-VAT-registered buyers). Enable Stripe Tax
> (Settings → Tax) and collect VAT IDs at checkout; otherwise you're eating VAT
> out of the headline price. This is a real decision — flag it if you want me to
> spell out the Stripe Tax config.

---

## 2. Products & Prices — exact Stripe setup

Create in **Dashboard → Product catalog → + Add product**. Do this in **live
mode** once tested, or **test mode** first (toggle top-right). For each Price, set
the **lookup key** shown — that's a stable handle so the eventual checkout code
references `growth_monthly` instead of a raw `price_xxx` id (makes reprices
painless).

> **Free tier:** no Stripe object needed. €0 = no subscription; handled entirely
> in-app (signup with `plan: free`). Don't create a €0 price.

### 2.1 Recurring plan prices

| Product | Price (lookup key) | Amount | Interval |
|---|---|---|---|
| **BrandGEO Essentials** | `essentials_monthly` | €99.00 | monthly |
| | `essentials_annual` | €990.00 | yearly |
| **BrandGEO Growth** ✨ | `growth_monthly` | €299.00 | monthly |
| | `growth_annual` | €2,990.00 | yearly |
| **BrandGEO Managed** ⭐ | `managed_monthly` | €900.00 | monthly |
| | `managed_annual` | €9,000.00 | yearly |
| **BrandGEO Pro** | `pro_monthly` | €1,500.00 | monthly |
| | `pro_annual` | €15,000.00 | yearly |

Annual = exactly **10× monthly** ("2 months free"), uniform across all paid tiers
— matches PRICING-SPEC §3. Set the amount as a whole-euro figure; Stripe stores
it in cents (e.g. €299.00 = `29900`).

### 2.2 Managed setup fee (one-time)

| Product | Price (lookup key) | Amount | Type |
|---|---|---|---|
| **Managed Onboarding / Setup** | `managed_setup` | €1,250.00 | **one-time** (not recurring) |

**Applied on Managed monthly only, waived on Managed annual** (PRICING-SPEC §3).
Mechanics:
- **Self-serve / Checkout path:** when you create a Checkout Session for
  `managed_monthly`, add **two** line items — `managed_monthly` (qty 1) **and**
  `managed_setup` (qty 1). For `managed_annual`, add only the recurring line, no
  setup. (The "which lines to include" logic lives in whatever creates the
  session — see §5.)
- **Manual / invoice path (most likely for Managed, since it's done-for-you and
  sales-closed):** when you create the subscription on `managed_monthly`, add the
  €1,250 as a **one-time invoice item on the first invoice** (Subscription create
  → "Add item" → one-time → `managed_setup`; or API `add_invoice_items`). Skip it
  for annual.

### 2.3 Enterprise

**No standard price.** Enterprise is quoted per deal (from ~€10,000/mo). Handle
via **Stripe Invoicing** or **Stripe Quotes** with a custom price + a bundled
add-on stack (§3), or bill by **Wise wire** for large international deals (§1).
Don't create a fixed Enterprise price.

---

## 3. Add-ons (Pro & Enterprise scaling) — proposed, confirm before creating

PRICING-SPEC §3.1 deliberately leaves the per-unit numbers to be set here. Below
is my **proposal — please confirm or adjust before you create these.** Each is a
**recurring, quantity-based (licensed) price**, added as an extra line item on a
Pro/Enterprise subscription with a quantity. Create one Product per add-on so
invoices read clearly, each with a monthly + annual (10×) price.

| Add-on (Product) | Unit | Monthly (lookup key) | €/mo | Annual (10×) | €/yr |
|---|---|---|---|---|---|
| **Prompt Pack** | +100 prompts | `addon_prompts_monthly` | €200 | `addon_prompts_annual` | €2,000 |
| **Additional Market** | +1 country/market | `addon_market_monthly` | €150 | `addon_market_annual` | €1,500 |
| **Additional Brand** | +1 brand/domain | `addon_brand_monthly` | €250 | `addon_brand_annual` | €2,500 |
| **Additional Engine** | +1 engine (post–coming-soon) | `addon_engine_monthly` | €120 | `addon_engine_annual` | €1,200 |
| **Additional Seat** | +1 user seat | `addon_seat_monthly` | €40 | `addon_seat_annual` | €400 |

**Why these amounts:** prompt packs are the primary scaling lever (biggest lever,
so priced to matter but below the per-prompt value inside a tier); markets/brands
reflect the extra collection + management load per unit; engines are low because
they're marginal API cost once built; seats are a light per-user uplift. All
mirror how Peec/Otterly/Semrush sell volume + engine add-ons, so the buying
motion is familiar.

**Scale check — Pro €1,500 base reaches Enterprise ~€10k via add-ons:**

```
Pro base                         €1,500
+ 25 Prompt Packs (2,500 prompts) €5,000
+  8 Additional Markets           €1,200
+  5 Additional Brands            €1,250
+  5 Additional Engines           €  600
+ 10 Additional Seats             €  400
                                 ─────────
Total                            €9,950/mo  → tips past €10k with any one more unit
```

So the ladder is continuous: Pro is "base + à-la-carte," Enterprise is "a
negotiated bundle of the same add-ons," no artificial wall between them. ✅
Requirement met.

> **✅ CREATED 2026-07-09** — Constantin confirmed these amounts and they're live
> in Stripe (created via the connector). 5 add-on products, each with a monthly +
> annual (10×) EUR recurring price, `tax_behavior: exclusive`, and stable lookup
> keys: `addon_prompts_monthly`/`addon_prompts_annual`,
> `addon_market_monthly`/`_annual`, `addon_brand_monthly`/`_annual`,
> `addon_engine_monthly`/`_annual`, `addon_seat_monthly`/`_annual`. Each price
> carries `metadata.addon` (prompts/market/brand/engine/seat) + `metadata.kind:
> addon`. Reference these by lookup key when attaching them as extra subscription
> items on Pro/Enterprise.

---

## 4. Migration — existing clients move to new prices at next renewal (with notice)

### 4.1 Reality check: there is almost nothing to migrate today

Grep of the whole codebase found **zero Stripe integration** — no keys, no
checkout, no webhook, no `price_`/`prod_` references anywhere. Billing was never
wired. So the "existing clients" in Supabase (`bpr`, `brandgeo`, `lodgify`,
`paunescu-asociatii`, `workfully`) are **client records, not Stripe
subscribers** — several are internal/demo (BpR, BrandGEO-self, Workfully). **You
have no active Stripe subscriptions to migrate right now.**

**Action today:** in Stripe → Subscriptions, filter **Active** — confirm the list
is empty (or near-empty). If empty, migration is a no-op and the procedure below
is future-proofing. If any real paying sub exists on an old price, run §4.2 for it.

### 4.2 Procedure per active subscription (no grandfathering, with notice)

The rule (PRICING-SPEC §5 item 6): everyone on a plan pays the same new price;
change takes effect at **their next renewal**, **not** silently mid-cycle, **with
advance notice**.

1. **Send the notice email (§4.3) ≥30 days before** the subscription's next
   renewal date. (30 days is the safe, standard B2B price-change notice.)
2. **Schedule the price swap for the renewal boundary — use a Subscription
   Schedule** so it changes cleanly at period end with no mid-cycle proration:
   - Dashboard: open the subscription → **⋯ → "Create schedule from
     subscription"** → the current price becomes phase 1 → **add phase 2**
     starting at `current_period_end`, on the **new** price (`managed_monthly`
     etc.), `proration_behavior = none`.
   - Or Stripe CLI/API (precise, scriptable):
     ```
     # 1. create a schedule from the existing subscription
     stripe subscription_schedules create --from-subscription=sub_XXX

     # 2. update it: phase 1 = old price to period end, phase 2 = new price
     stripe subscription_schedules update sched_XXX \
       --end-behavior=release \
       -d "phases[0][items][0][price]=price_OLD" \
       -d "phases[0][items][0][quantity]=1" \
       -d "phases[0][start_date]=current_period_start" \
       -d "phases[0][end_date]=<renewal_unix_ts>" \
       -d "phases[1][items][0][price]=price_NEW" \
       -d "phases[1][items][0][quantity]=1" \
       -d "phases[1][start_date]=<renewal_unix_ts>"
     ```
3. **Do not** use "Update subscription → change price" with immediate effect —
   that reprices *now* and prorates mid-cycle, which is exactly the silent change
   the spec forbids.
4. After the renewal ticks over, the schedule **releases** back to a normal
   subscription on the new price. Done.

For **annual** subs the same applies — schedule the new annual price at the
renewal date, and remember Managed annual has **no setup fee**.

### 4.3 Customer-notice email (draft)

> **Subject:** An update to your BrandGEO pricing — effective [DATE OF THEIR NEXT RENEWAL]
>
> Hi [First name],
>
> I wanted to let you know directly about a change to BrandGEO's pricing.
>
> As the platform has grown — more AI engines monitored, deeper competitor and
> sentiment analysis, and the hands-on work we do on your account — we're updating
> our plan pricing to reflect the value you're getting. Your **[Plan name]** plan
> will move to **€[new amount]/[month|year]**, effective on your next renewal on
> **[renewal date]**.
>
> A few things I want to be clear about:
> - **Nothing changes before [renewal date].** Your current billing runs to the
>   end of this cycle at your existing price.
> - **No action is needed from you** — the new rate applies automatically at
>   renewal, and everything in your account continues uninterrupted.
> - If annual billing would suit you better, it now works out to **two months
>   free** versus paying monthly — just reply and I'll set it up.
>
> If you have any questions, or want to talk through your plan and whether it's
> still the right fit, just reply to this email or book a quick call: [link].
>
> Thank you for being one of our earliest customers — it genuinely matters.
>
> Best,
> Constantin
> BrandGEO · support@getbrandgeo.com

*(Personalize [Plan name] / [new amount] / [renewal date] per subscription. Send
from `support@getbrandgeo.com` or your own address ≥30 days before each client's
renewal.)*

---

## 5. Self-serve Checkout — assessment (proposal, not built)

**Today:** the site's Free / Essentials / Growth buttons point at signup / #contact
— so even the self-serve tiers can't actually take money without a human. That's
the gap between "self-serve tier" and "self-serve revenue."

**Which tiers should be self-serve vs. sales-assisted:**

| Tier | Button today | Recommended |
|---|---|---|
| Free | signup | Keep → signup, no payment |
| Essentials | signup / #contact | **Self-serve Stripe Checkout** |
| Growth | signup / #contact | **Self-serve Stripe Checkout** |
| Managed | #contact | Keep → #contact (done-for-you, sales-closed; setup fee + onboarding call) |
| Pro | #contact | Keep → #contact (custom scope + add-ons) |
| Enterprise | #contact | Keep → #contact / Wise invoice |

Self-serve should stop at Growth — that's the exact line PRICING-SPEC §2 draws
(self-serve at/below Growth, done-for-you at/above Managed). Don't put a
"Subscribe" button on Managed/Pro/Enterprise; those are conversations.

### 5.1 Two ways to wire Essentials/Growth checkout

**Option A — Stripe Payment Links (zero code, ship this week).**
- In Stripe → **Payment Links → + New**, create one link per self-serve
  price: Essentials monthly, Essentials annual, Growth monthly, Growth annual (4
  links). Enable "let customers adjust quantity" = off; collect VAT ID + address
  if using Stripe Tax; set the success URL to a thank-you/onboarding page.
- The site's Essentials/Growth buttons point at these links (that edit is a
  `brandgeo/web/` change → **Master-SiteDesign's** job, not mine — I'm just
  specifying the target).
- **Trade-off:** a Payment Link **doesn't know about your Supabase `clients`
  record**, so after payment you either (a) manually set the client's `plan` +
  create their login, or (b) reconcile via a webhook. Fine at low volume / launch;
  it's how you start taking self-serve money the fastest.

**Option B — Checkout Session + webhook (proper auto-provisioning, fast-follow).**
- A small Netlify function creates a Stripe **Checkout Session** for the chosen
  price (and, for Managed monthly only, adds the `managed_setup` line), tied to
  the signed-up user's email/`client_id`.
- A second **`stripe-webhook`** Netlify function listens for
  `checkout.session.completed` / `customer.subscription.updated` and sets
  `clients.plan` (+ `engines_enabled`) in Supabase, so the plan provisions
  automatically — no manual step.
- This is the piece that truly turns self-serve tiers into self-serve revenue.
- **⚠️ Cross-scope:** these are **`brandgeo-dashboard/netlify/functions/` files**
  → that's **Master-DashboardDesign / a dedicated functions session**, *not*
  Master-Billing. I'm flagging it as a handoff with the spec above, not building
  it here.

### 5.2 Recommended sequence

1. **Now (this week):** Option A Payment Links for Essentials + Growth → real
   self-serve revenue immediately, manual provisioning at first (volume is low
   pre-PMF per GTM-STRATEGY).
2. **Fast-follow:** Option B webhook auto-provisioning as a scoped
   dashboard/functions task, once self-serve signups are frequent enough that
   manual provisioning stings.
3. Add the Stripe **Customer Portal** (Settings → Billing → Customer portal, no
   code) so self-serve customers can update cards / cancel themselves — link it
   from the dashboard account page (another dashboard-session task).

---

## 6. Build order (your run-list)

1. ☐ Confirm EUR enabled + decide VAT/Stripe Tax stance (§1).
2. ☐ **Confirm the five add-on unit prices** (§3) — only numbers needing sign-off.
3. ☐ Create the 8 recurring plan prices + `managed_setup` (§2), in **test mode**
   first.
4. ☐ Create the 5 add-on products (monthly + annual each) (§3).
5. ☐ Test one full Managed-monthly checkout (verify the €1,250 setup line appears)
   and one Managed-annual (verify it does **not**).
6. ☐ Confirm Active subscriptions list is empty → migration is a no-op (§4.1). If
   not, run §4.2 + send §4.3 notice for each.
7. ☐ Flip products to **live mode**.
8. ☐ Create 4 Payment Links (Essentials/Growth × monthly/annual) (§5.1 Option A)
   → hand the URLs to Master-SiteDesign to wire the buttons.
9. ☐ (Fast-follow, dashboard session) Checkout-session + webhook auto-provisioning
   (§5.1 Option B) + Customer Portal.

---

## 7. Open decisions for Constantin

1. **Add-on unit prices** (§3) — confirm the five amounts or adjust.
2. **VAT / Stripe Tax** (§1) — are the spec's numbers net ex-VAT (recommended for
   B2B), and do you want Stripe Tax enabled with VAT-ID collection?
3. **Growth engine access (PRICING-SPEC §5 item 7 / sub-decision B)** — the spec
   defaults to Growth getting all 5 live engines. That's a `planConfig.ts` /
   **Master-DashboardDesign** concern, not billing, but it's the one pricing-model
   question still soft-defaulted. No billing impact either way.
4. **Self-serve now vs. later** (§5.2) — OK to launch with Payment Links + manual
   provisioning first, or wait for the webhook build?
