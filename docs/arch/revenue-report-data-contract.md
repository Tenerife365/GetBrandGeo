# Revenue report data contract (S21)

RESEARCH stage of the CQO four-stage gate (registry seat C-0b), written before
any component. Everything below was verified live against the Spanish Stripe
account (`acct_1Tzui063lspobjfO`) and the `duiyifepitvugyulobqm` Supabase
project on 2026-08-02, not assumed from the kickoff text.

## 1. Money source of truth

Stripe is authoritative for every euro figure. Nothing here reads a price or
a total from `planConfig.ts` or `_cost.js` — those two are read ONLY for the
estimated API cost subtracted at the end (§5). `PLAN_LABELS` may be used to
render a plan's display name, never its price.

## 2. Objects read, and why

| Object | Used for | Notes |
|---|---|---|
| `Invoices` (list) | gross invoiced, paid revenue, per-plan/per-client breakdown, discount amounts | filtered by `created` (gross invoiced) or `status_transitions.paid_at` (paid revenue) inside the report period. `lines.data[].metadata.plan` resolves the tier (same key the webhook uses); `lines.data[].pricing.price_details.product` as fallback. |
| `Refunds` (list) | netting paid revenue | matched to a charge, then to that charge's `invoice`/`customer` for attribution. Zero live rows today — the harness fixture is the only current coverage of this path. |
| `Charges` | resolving `refund.charge -> invoice/customer` when an invoice's own refund isn't directly enumerable | only fetched for charges referenced by a refund; not listed wholesale. |
| `Coupons` + `PromotionCodes` | discount/free-month cost, affiliate attribution | `promotion_code.metadata.affiliate` is the attribution key (confirmed live: `BPRFREE` -> `promo_1U06XY63lspobjfOcXNBKaSI`, `metadata.affiliate = "bpr"`, coupon `XKfymWe7` 100% off once). |
| `Customers` | per-client join fallback (§3) | `metadata.client_id` when present. |
| `Subscriptions` | MRR | zero live subscriptions on the account today (checkout has been link/invoice-based so far); code path is built and covered by fixtures, not provable against real data yet. |

Nothing is written to Stripe. `revenue-report.js` is read-only.

## 3. The client join key — verified, not assumed

The kickoff named this as the item to verify or, if missing, migrate. Verified
live:

- **The column exists.** `clients.stripe_customer_id` (`text`, nullable) is
  already on the table, from the original webhook migration
  (`supabase-stripe-webhook-migration.sql`). **No schema migration is needed
  for this task.**
- **It is populated for exactly 1 of 38 clients** — the `ZZ E2E TEST ES`
  client (id 51), which is scheduled for deletion after 2026-08-03. Every
  other paying/comp client (BpR, BrandGEO, Paunescu & Asociatii, Talentwelove,
  Edyta Andrzejczak, Restaurante Transilvania, Alexandru Teodor, Doctor
  Mihail) has `stripe_customer_id = NULL`, because they were provisioned
  through `Onboard.tsx` (sales-assisted), not the Stripe checkout webhook.
- **A second, undocumented join key already exists on the STRIPE side.**
  BpR's real Stripe Customer (`cus_UzwgTPWQfZtXOY`, the one carrying the open
  EUR 3,500 founding-package invoice `INV-35`) carries
  `metadata.client_id = "1"` and `metadata.client_slug = "bpr"` — written when
  the founding package was hand-invoiced (2026-08-02, `custom-offers-decided`
  memory). This is the reverse of `clients.stripe_customer_id`: it lets a
  Stripe Customer name its client, but `clients.id = 1` does not point back at
  it. There is also a second, older BpR Customer
  (`cus_UzwQPxA4H5r3IA`) with no metadata at all and no paid activity — a
  stray from earlier testing, left alone (out of scope, not a task).

**Resolution built into the function, per customer, in this order:**
1. `customer.metadata.client_id` if it parses as an integer and matches a real
   `clients.id` (covers the hand-invoiced/founding-package path).
2. Else, `clients.stripe_customer_id = customer.id` (covers the self-serve
   webhook path, once real subscribers exist).
3. Else, **unattributed** — included in the global and per-plan totals (plan
   is still resolvable from the invoice line's `metadata.plan`), but shown as
   its own row in the per-client table rather than silently dropped or
   guessed onto a client. This mirrors the "visible, not silent" pattern
   `stripe-webhook.js` already uses for `checkout_without_acceptance` and
   `package_unprovisioned`.

No backfill of `clients.stripe_customer_id` for the 7 existing manually
provisioned clients is in this task's scope — most of them may never be
Stripe customers at all (paid by bank transfer, per the BpR invoice's own
payment terms). That backfill, if wanted, is a separate decision for
Constantin, not an inference this function should make.

## 4. Discounts, free months, and affiliate commission

Verified live against the account:

- Coupon `XKfymWe7` ("Partner free month"), 100% off, duration `once`,
  `metadata.affiliate_terms = "20pct-recurring-12mo"`.
- Promotion code `BPRFREE` on that coupon, `metadata.affiliate = "bpr"`,
  restricted to first-time transactions, 0 redemptions so far.
- 0 `Refunds` on the account so far.

**Discount/free-month cost** = for every invoice in the period, its
`total_discount_amounts` (or the coupon's `percent_off`/`amount_off` applied
to the pre-discount line total when `total_discount_amounts` is absent) —
what the ladder would have earned minus what it actually invoiced.

**Affiliate commission accrued** = 20% of a customer's paid invoices for 12
months FROM the date their earliest invoice carried an affiliate-tagged
promotion code (`promotion_code.metadata.affiliate` present). Because the
coupon's duration is `once`, Stripe does not re-apply or re-tag it on
invoices 2+, so attribution cannot be read off a later invoice directly — the
function has to walk a customer's invoice history once, find the earliest
occurrence of the tagged code, and then treat every later paid invoice within
the 12-month window as commissionable at 20%. (Month 1 itself is EUR 0 —
100% off — so it never contributes a commission line, matching D-7's
"free month = zero commission accrues" ruling.) This is a report-side
approximation of what PromoteKit computes on its own for payout purposes
(per the architecture note, PromoteKit is the affiliate system of record;
this page is a report, not affiliate admin) — it exists so the Revenue page
doesn't have to wait on a PromoteKit API integration to show a number.

No live redemption exists yet to prove this path against; the TEST-stage
fixture harness (task #2) is its only current coverage, and SIMULATE (task
#5) will re-check it the moment a real `BPRFREE` redemption exists.

## 5. Net revenue formula

```
net_revenue = paid_revenue
            - refunds
            - affiliate_commission_accrued
            - estimated_api_cost
```

- `paid_revenue`: sum of `invoice.amount_paid` for invoices whose
  `status_transitions.paid_at` falls in the period (subscription invoices),
  plus manually-collected `send_invoice` invoices with the same paid-at
  filter (BpR's package invoice, once paid, counts the same way — no special
  case for `collection_method`).
- `refunds`: sum of `Refunds` in the period, sign-matched to the invoice/
  customer they came from.
- `affiliate_commission_accrued`: §4.
- `estimated_api_cost`: **the same source `Usage.tsx` already reads** —
  `sum(ai_results.cost_eur)` per client for the period, with the existing
  flat-estimate fallback for legacy NULL rows (`ENGINE_COST_EUR` /
  `costForRow()` in `_cost.js`). Not re-derived; the Cost tab and the Revenue
  tab's cost line must always agree because they read the same numbers.

`gross_invoiced` (all invoices `created` in the period, any status) is shown
as a separate, explicitly-labelled top-line figure — it is what Constantin
asked for ("how much was invoiced"), and it is NOT the same number as
`paid_revenue`: BpR's EUR 3,500 founding invoice is `status: open` right now
(unpaid, due 2026-08-04), so it counts toward gross invoiced this month but
contributes EUR 0 to paid/net revenue until it clears.

Shown per plan, per client, and global, per the kickoff.

## 6. CSA scale note (rule 8)

At 10,000 subscribers this function pages every invoice on every load, which
breaks well before that count (the same failure mode the kickoff already
named). Acceptable for v1 at today's client count (38 clients, 2 invoices, 1
charge, 0 subscriptions) with in-memory computation and no caching. The load
model upgrade path is a monthly `revenue_snapshots` table written by a
scheduled job — noted now, built later, tracked as S21 Phase 2 alongside the
already-registered `operating_costs` table. Not built in this task.

## 7. What is explicitly NOT in this task

- No Stripe object is created, modified, or deleted.
- No backfill of `clients.stripe_customer_id` for existing manual clients.
- No PromoteKit API integration — commission is a Stripe-side approximation
  (§4), not a call to PromoteKit.
- No `operating_costs` table / true net margin (registered as Phase 2 in the
  kickoff, separate board entry).

## 8. Open items for Constantin (one-line OK requested on the whole contract)

1. §5's `gross_invoiced` vs `paid_revenue` split — confirm this matches what
   "how much was invoiced" meant, versus wanting invoiced to mean paid-only.
2. §4's commission approximation is the report's own estimate pending a real
   `BPRFREE` redemption to check it against; PromoteKit remains the system of
   record for actual affiliate payout.
3. The stray, metadata-less `cus_UzwQPxA4H5r3IA` BpR customer (§3) is left
   alone — flag if it should be archived/deleted in Stripe.
