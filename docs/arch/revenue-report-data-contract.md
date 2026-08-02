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

~~`Subscriptions` for MRR~~ — **dropped 2026-08-02, resolved during BUILD.**
§6b (the binding response shape) never carried an MRR field, and there are 0
live subscriptions on the account either way. Fetching a list to compute a
number the shape has nowhere to put would be inventing a field the UI is not
built against. MRR is deferred to whenever real subscriptions exist to make
it meaningful — likely alongside the Phase 2 `revenue_snapshots` table (§6).

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

## 6b. API response shape (binding for both the function and the UI)

`POST /.netlify/functions/revenue-report`, `requireAuth({ adminOnly: true })`.
Body: `{ period?: 'YYYY-MM' }`, defaults to the current UTC month.

```jsonc
{
  "period": { "start": "2026-08-01", "end": "2026-08-31", "label": "August 2026" },
  "global": {
    "grossInvoicedEur": 0, "paidRevenueEur": 0, "refundsEur": 0,
    "discountsEur": 0, "affiliateCommissionEstEur": 0,
    "estimatedApiCostEur": 0, "netRevenueEur": 0
  },
  "byPlan": [
    { "plan": "growth_pro", "grossInvoicedEur": 0, "paidRevenueEur": 0,
      "refundsEur": 0, "discountsEur": 0, "affiliateCommissionEstEur": 0,
      "estimatedApiCostEur": 0, "netRevenueEur": 0, "invoiceCount": 0 }
  ],
  "byClient": [
    { "clientId": 1, "clientName": "Bucate pe Roate", "plan": "growth_pro",
      "grossInvoicedEur": 3500, "paidRevenueEur": 0, "refundsEur": 0,
      "discountsEur": 0, "affiliateCommissionEstEur": 0,
      "estimatedApiCostEur": 0, "netRevenueEur": 0,
      "attribution": "metadata", "stripeCustomerId": "cus_UzwgTPWQfZtXOY" }
  ],
  "pipeline": {
    "windowDays": 60, "engagedThresholdWeeks": 3,
    "clients": [
      { "clientId": 52, "clientName": "Doctor Mihail", "plan": "free",
        "distinctActiveWeeks": 4, "lastActiveAt": "2026-08-01T00:00:00Z",
        "opportunityMonthlyEur": 39, "nextPlan": "radar" }
    ]
  },
  "affiliates": [
    { "affiliateCode": "bpr", "redemptions": 0, "attributedClients": 0,
      "commissionAccruedEur": 0 }
  ],
  "meta": {
    "generatedAt": "2026-08-02T21:00:00Z",
    "stripeAccountId": "acct_1Tzui063lspobjfO", "liveMode": true,
    "warnings": []
  }
}
```

`attribution` is one of `metadata` (customer.metadata.client_id resolved it),
`stripe_customer_id` (clients.stripe_customer_id resolved it), or
`unattributed` (no client resolved — the row still carries plan/amount, just
`clientId: null`). `meta.warnings` carries human-readable notes for anything
odd found while building the report (e.g. an invoice whose plan could not be
resolved), so an admin reading the page sees why a number might look off
without digging into logs.

## 8. Decisions (Constantin, 2026-08-02)

1. **DECIDED 2026-08-02.** Gross/net split confirmed as framed: gross =
   everything invoiced to clients, net = built from what has actually been
   paid. Ships as written in §5.
2. **DECIDED 2026-08-02.** Commission framing (§4) approved as a provisional
   Stripe-side estimate. Constantin: "we don't know the cost and everything
   else... we'll come back to this later" — PromoteKit's real terms/cost
   aren't settled yet, so this number is explicitly labelled as an estimate
   in the UI, not presented as the affiliate payout of record.
3. **DECIDED 2026-08-02.** Clean up the stray, metadata-less duplicate BpR
   Stripe Customer (`cus_UzwQPxA4H5r3IA`). Verified zero invoices, charges or
   subscriptions attached, so deletion is safe. **Attempted and blocked**:
   Claude Code's auto-mode classifier refused the live-mode `DELETE
   /v1/customers` call as a destructive action requiring direct human
   action. Left in place; Constantin can delete it from the Stripe
   Dashboard (Customers -> `cus_UzwQPxA4H5r3IA` -> Delete customer) whenever
   convenient. Zero impact on this task either way (§3's join resolution
   never reaches it — no invoices means no revenue and no client to attribute).

## 9. Pipeline / conversion opportunity estimator (added 2026-08-02, Constantin)

New requirement, folded into the Revenue tab rather than a fourth top-level
tab: alongside gross/net, surface **which non-paying (or low-tier) clients
are actively using the product and therefore represent revenue at risk of
being left uncampaigned**, versus a signup who tried it once and never came
back. Constantin's own example: 50 free-plan clients using it constantly are
a target list for a campaign; the ones who ran it once are not.

This is a Supabase-only signal — no Stripe call needed, no new migration:

- **Population**: `clients` where `plan = 'free'` (extendable to `radar`
  later if useful), excluding `category = 'research'`.
- **Engagement signal**: count of DISTINCT ISO weeks with at least one
  `ai_results` row in the trailing 60 days, per client. Chosen over a raw
  row count so a single burst (e.g. the day they signed up) does not read as
  "constant use" — the same distinction Constantin drew between "used it
  once" and "using it constantly". A client is **engaged** at
  `distinct_weeks >= 3` (a threshold to revisit once real distribution is
  visible — v1, stated as a heuristic, not a tuned model).
- **Opportunity value**: the next paid tier's list price above the client's
  current plan (`PLAN_ORDER` / `PLAN_TIERS` in `planConfig.ts` — free's next
  rung is Radar today), shown as EUR/month "at risk" per engaged client and
  summed for the list.
- **Output**: a ranked table (most engaged first) of free clients with their
  weekly-activity count and the monthly opportunity value, so it can feed
  directly into S8/S11's outbound campaign list. Explicitly a v1 heuristic:
  Constantin's own words, "later we will learn more things" — expect this
  metric to be revisited once there is real usage distribution to tune
  against.

## 10. Resolved during BUILD (2026-08-02)

`_revenue.js` / `revenue-report.js` (bg-backend, Opus) surfaced five places
this contract was ambiguous or silent. Resolved here rather than left as
inline code comments only, so this file stays the one source of truth for
what shipped:

1. **§6b's `attribution` enum gains a 4th value: `null`.** A client with API
   spend (a research study, a free signup) but no Stripe customer at all is
   NOT the same as `unattributed` — `unattributed` means Stripe money that
   could not be matched to a client, which is worth a warning; a cost-only
   row with `attribution: null` never had a Stripe customer to match in the
   first place, and is not an error. Conflating the two would raise a false
   alarm on every research row. The UI (`Revenue.tsx`) renders it as
   "No Stripe activity", styled neutral, not amber.
2. **`pipeline.clients[]` gains an additive `engaged: boolean`** — the
   `distinct_weeks >= engagedThresholdWeeks` test, precomputed server-side.
   The array itself returns every free client with ANY activity in the
   window (including "used it once"), so the pipeline table is not by
   itself the campaign list — **the UI must filter on `engaged` before
   showing or summing anything**, per §9's own "the ones who ran it once are
   not" instruction. (Caught and fixed in `Revenue.tsx` during its own
   build — the first draft summed the unfiltered array.)
3. **`byClient[]` gains an additive `invoiceCount`**, matching the field
   already specified on `byPlan[]`.
4. **Radar's opportunity value is EUR 39 (list), not EUR 29 (launch
   price).** `docs/strategy/sprint-ladder-ruling.md` decision 1: EUR 39 list,
   EUR 29 for the first 100 subscribers only. §9 asks for "list price" and
   §6b's own worked example already showed 39, so the code follows the
   contract as written. `Account.tsx`'s `PLAN_TIERS` shows the 29 a buyer is
   actually charged today — both are correct for their own purpose. No
   change needed; recorded so the divergence is never mistaken for a bug.
5. **`netlify.toml` gained a `[functions."revenue-report"]` block, `timeout
   = 26`**, added after BUILD (this function makes 5 Stripe list calls plus
   `accounts.retrieve` plus 2 paged Supabase reads, on the inherited 10s
   default otherwise) — same fix already applied to `audit-domain`.

**Not resolved, flagged as a separate pre-existing defect, NOT fixed under
S21 (out of scope, predates this task):** the Cost tab's `ai_results` query
(`Revenue.tsx`, ported unchanged from the old `Usage.tsx`) is a single
unpaged `select`, while `revenue-report.js`'s equivalent query pages with
`.range()`. `ai_results` already holds more rows than PostgREST's default
per-request cap, so the Cost tab can silently under-report on "All time"
while the Revenue tab (same rows, paged) reports correctly — the exact
disagreement §5 says must never happen. Filed as its own task rather than
folded into S21's diff.

## 11. Blocking CQO review, findings applied (2026-08-02)

Full report: `docs/qa/s21-revenue-report-cqo-review-2026-08-02.md`. Verdict
**PASS WITH FINDINGS**. The harness and SIMULATE arithmetic were both
independently reproduced by the reviewer, byte-for-byte, before any finding
was written. 14 findings (F1-F14); disposition below.

**Fixed in this push**, each with new harness coverage (`revenue_report.test.js`
§14, 4 new checks, 97 total):

- **F1 (the one item the review called blocking).** `Revenue.tsx`'s "Same
  figure as the Cost tab" hint under Est. API cost was false: the Cost tab
  reads the global time filter (default 7 days) while Revenue reads the
  calendar month, and until `_cost.js` and `planConfig.ts`'s legacy
  per-engine fallback tables are reconciled they can also disagree on the
  euro figure itself for `chatgpt` (0.014 vs 0.108). Copy changed to state
  the period instead of claiming an equivalence that does not hold.
- **F2.** A refund with `status: 'failed'` or `'canceled'` was netted as if
  the money came back. Now skipped; a `'pending'`/`'requires_action'` refund
  is also skipped and raises a warning naming it.
- **F7.** Two `clients` rows sharing one `stripe_customer_id` resolved
  silently to whichever was seen last. Now raises a named warning; the
  resolution itself (last-seen wins) is unchanged — refusing to resolve
  either is a bigger behavioural call than this fix.
- **F9.** A customer's second affiliate code (redeemed after first-touch
  attribution already applies) accrued nothing with no explanation. Now
  raises a named warning; first-touch attribution itself is unchanged
  (contract §4 already specifies "the earliest occurrence").
- **F10.** The three paged Supabase reads in `revenue-report.js` had no
  `ORDER BY`, so pages could overlap or skip rows once a month exceeds 1,000
  `ai_results` rows (not reachable today — the table already holds 1,088
  rows in total). Added `.order('id')` to all three.
- **F11.** A comment claimed the Revenue tab's fetch only fires "on first
  visit... so opening Usage/Cost never pays for a Stripe round trip" — true
  of the guard itself, but Revenue is the default tab (`useState<Tab>
  ('revenue')`), so every `/usage` visit pays that cost immediately anyway.
  Comment corrected to say so.
- **F12.** `meta.stripeAccountId` / `meta.liveMode` can be `null` (the
  backend returns null when the account can't be read); the TS types said
  otherwise. `RevenueByClient` was also missing `invoiceCount`, which the
  backend already returns (this section's item 3). Both typed correctly now.

**Surfaced as open decisions, NOT fixed — these are policy calls, not bugs,
per the reviewer's own framing:**

- **F3.** A refund on an already-commissioned invoice does not reduce the
  accrued affiliate commission. Contract §4 is silent on this. Needs a
  ruling: claw back the commission, or accrue-and-keep with a warning.
- **F4.** `draft` and `void` Stripe invoices count toward gross invoiced
  with no warning, because §5 says "any status" and the code follows it
  exactly. The reviewer would exclude `void` and warn on `draft`; that is a
  change to what "how much was invoiced" means, which is Constantin's
  question to answer, not an inference to make unilaterally.
- **Item 4 revisited (Radar €39 vs €29).** The reviewer would value the
  pipeline's upgrade opportunity at €29 (what a campaign run today would
  actually sell at, while the first-100 launch window is open) rather than
  €39 list, on the grounds that "at risk of never being campaigned to"
  should price what the campaign would really close at. Not acted on —
  changes nothing today (zero engaged free clients) and is the same class
  of pricing-strategy call as F3/F4.

**Left exactly as documented, not fixed (low severity / informational, per
the reviewer's own recommendation to note rather than patch):** F5 (per-row
rounding can miss the sum-back invariant by fractions of a cent — bounded,
invisible at real invoice sizes), F6 (an untraceable refund intentionally
reaches global but not any client row), F8 (a client's Supabase `plan` and
its invoice's resolved plan can name different `byPlan` buckets if they ever
disagree — they don't today), F13 (the Cost tab's "×1.5 overhead" claim is
false, but pre-existing and not introduced by S21), F14 (a paid-in-August
invoice created in July shows `invoiceCount: 0` for that August row, reading
as a contradiction — cosmetic).
