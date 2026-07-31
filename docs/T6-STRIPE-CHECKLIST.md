# T6 — Stripe setup + migration checklist

> Run in the Stripe Dashboard. Numbers are the single source of truth from
> PRICING-STRATEGY-2026-07.md. Do NOT improvise prices. Test in a Stripe test
> environment first if unsure.

## 1. Products & recurring prices (monthly + annual)
Annual = **2 months free** (pay 10× monthly). Create one Product per tier, each
with a **monthly** and an **annual** recurring price (EUR).

| Product | Monthly | Annual (10×) | Notes |
|---|---|---|---|
| BrandGEO Essentials | €99 | €990 | no setup fee |
| BrandGEO Growth | €299 | €2,990 | no setup fee |
| BrandGEO Growth PRO | €449 | €4,490 | no setup fee |
| BrandGEO Managed | €1,500 | €15,000 | monthly may carry the €1,250 setup fee; **waived on annual** |
| BrandGEO Enterprise | — | — | **no public price** — quote per deal |

Free = no Stripe product (provisioned as plan `free` in-app).

## 2. Add-ons (metered / recurring add-on prices)
Create as separate recurring prices the customer adds to a subscription:
- **Instagram channel** (Growth PRO only) — €/mo TBD
- **TikTok channel** (Growth PRO only) — €/mo TBD
- **Extra collection allowance** (bumps the monthly € budget) — €/mo TBD
- **Extra AI SEO pages / drafts** — €/mo TBD
- **Pro/Enterprise:** extra markets / brands / engines / seats — €/unit TBD

Set the actual per-unit prices when you create them (not fixed in the spec).

## 3. Map the new price IDs → plan (code step, ~small)
`stripe-webhook.js` provisions `clients.plan` from the Stripe price/product on
`checkout.session.completed` / subscription events. **Add the new price IDs to
that mapping** so a Growth PRO checkout provisions `plan = 'growth_pro'` and
Managed provisions `plan = 'managed'`. Also make sure the annual price IDs map to
the same plan as their monthly counterpart. (This is the only code touch in T6 —
everything else is Dashboard config.)

## 4. Coupons (for the Promotions feature, T3)
- Create **Coupons** (percent or fixed) as needed; the T3 Promotions admin panel
  will create/activate these programmatically, but a couple of manual test
  coupons now confirm the flow.
- Promotion Codes ride on Coupons — the T3 `active-promo` API + site script read
  the active promo to render the banner + strikethrough price.

## 5. Migration of existing subscriptions (informed, no grandfathering)
At **each client's next renewal** (not silent, not immediate):
- **Old Managed €900 → new Managed €1,500** (or Growth PRO €449 if they only need
  self-serve — a downsell option worth offering).
- **Old Pro €1,500 → Managed €1,500** (Pro is merged into Managed).
- **Old Growth €299 →** unchanged price, but note the engine change (Growth lost
  Google AI Mode; it's Growth PRO+ now) and the new AI SEO/AI Social limits.
- Email each affected client the new plan + value framing (Managed = "your
  AI-visibility team, less than one hire") before the renewal date.
- In Stripe: update the subscription to the new Price at the renewal boundary
  (or use a scheduled subscription update), with proration off for a clean
  next-cycle switch.

## 6. Verify
- A test checkout on each new price provisions the correct `clients.plan`.
- Annual price = exactly 10× monthly.
- A test coupon applies at checkout and (once T3 lands) shows on the site.
