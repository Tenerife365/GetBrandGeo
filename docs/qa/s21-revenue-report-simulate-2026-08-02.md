# S21 Revenue report — SIMULATE stage, 2026-08-02

CQO four-stage gate (registry seat C-0b), stage 4. Reconciles what
`revenue-report.js` / `_revenue.js` compute for August 2026 against the raw
Stripe API reads made directly in this session (the same underlying data the
Stripe Dashboard renders — no live deploy exists yet to hit the function
itself over HTTP, so this runs the exact same pure functions the handler
calls, fed the real objects, per the harness's own stated limit: "it cannot
prove that revenue-report.js fetches the right objects... those are code
review plus the curl in the handoff").

Script: ran `_revenue.js`'s `aggregateRevenue` / `computeEngagementPipeline`
directly against the live Stripe reads captured earlier this session (2
invoices, 0 refunds, 3 customers, the 2 real promotion codes) and the live
`clients` + August `ai_results` rows read fresh via the Supabase MCP.

## Left side: raw Stripe / Supabase reads (source of truth)

- **Invoice `in_1Tzx9q63lspobjfO3JPde2Do`** (BpR founding package): total
  **350000 cents (EUR 3,500.00)**, `status: "open"`, `amount_paid: 0`,
  `customer: cus_UzwgTPWQfZtXOY`, line `metadata.plan = "growth_pro"`.
- **Invoice `in_1TzwKk63lspobjfOYJxbTmhZ`** (E2E test): total **100 cents
  (EUR 1.00)**, `status: "paid"`, `amount_paid: 100`,
  `customer: cus_UzwDgjcv3giVq3`, line carries **no** `metadata.plan` and its
  price id is not in the fallback map.
- **Refunds**: 0 rows.
- **Customer `cus_UzwgTPWQfZtXOY`**: `metadata.client_id = "1"` (the
  hand-invoiced join key, contract §3).
- **Customer `cus_UzwDgjcv3giVq3`**: matches `clients.id = 51`
  (`stripe_customer_id = 'cus_UzwDgjcv3giVq3'`, confirmed by SQL).
- **Promotion code `BPRFREE`**: `metadata.affiliate = "bpr"`, 0 redemptions.
- **`ai_results`, August 2026** (fresh SQL read): client 1 — `perplexity`
  and `meta`, both `cost_eur IS NULL` (legacy fallback: 0.005 + 0.001 =
  **EUR 0.006**); client 52 (plan `radar`, not `free`) — 3× `gemini`
  (0.032 each) + 3× `claude` (0.0117, 0.02521, 0.03993) = **EUR 0.17284**.
  Total API cost by hand: 0.006 + 0.17284 = **EUR 0.17884**, rounds to
  **EUR 0.18**.

## Right side: `aggregateRevenue()` output for period `2026-08`

```
global: {
  grossInvoicedEur: 3501,        paidRevenueEur: 1,
  refundsEur: 0,                 discountsEur: 0,
  affiliateCommissionEstEur: 0,  estimatedApiCostEur: 0.18,
  netRevenueEur: 0.82
}
```

## Reconciliation, line by line

| Figure | Hand-calculated (left) | Function output (right) | Match |
|---|---|---|---|
| Gross invoiced | 3500.00 + 1.00 | 3501.00 | ✅ |
| Paid revenue | 0.00 (open) + 1.00 (paid) | 1.00 | ✅ — the EUR 3,500 correctly contributes EUR 0 until it clears |
| Refunds | 0.00 (0 rows) | 0.00 | ✅ |
| Discounts | 0.00 (no discount on either invoice) | 0.00 | ✅ |
| Affiliate commission | 0.00 (0 BPRFREE redemptions) | 0.00 | ✅ |
| Est. API cost | 0.006 + 0.17284 = 0.17884 → 0.18 | 0.18 | ✅ |
| Net revenue | 1.00 − 0 − 0 − 0.18 = 0.82 | 0.82 | ✅ |

**Zero mismatched cents.** Every global figure traces to a Stripe/Supabase
value read directly, not to the function's own self-report.

## Per-client / per-plan, and what the real data exercised that fixtures didn't

- **Client 1 (BpR)**: `attribution: "metadata"` — resolved via the
  Customer's own `metadata.client_id`, not `clients.stripe_customer_id`
  (which is NULL for client 1). This is the exact non-obvious join case §3
  of the contract exists to document, now confirmed against production data,
  not just a fixture.
- **Client 51 (E2E test)**: `attribution: "stripe_customer_id"` — the one
  row where that column actually is populated.
- **Client 52 (Doctor Mihail, plan `radar`)**: `attribution: null`, EUR
  0.17 of cost, no Stripe customer to speak of. This is the 4th attribution
  value added to the contract in §10 during BUILD — confirmed live, not
  hypothetical: it is the actual attribution of a real row today.
- **Invoice `in_1TzwKk63lspobjfOYJxbTmhZ`** landed under `"(unknown)"` with
  a warning (`plan could not be resolved from any of its 1 line(s)`) —
  correct: that test invoice really does carry no plan metadata and its test
  price id was never added to `PRICE_TO_PLAN`. This is a genuine finding
  from real data (a EUR 1 test invoice with no plan tag), not a defect in
  the report — flagging it is exactly what `meta.warnings` is for.
- **Pipeline**: empty. The only client with an August `ai_results` row that
  isn't already a paying/managed client is Doctor Mihail, and his plan is
  `radar` (paid), not `free` — so `PIPELINE_PLANS = ['free']` correctly
  excludes him. No free client has any activity this month, so "0 engaged
  clients" is the right answer, not a bug.

## What this stage did NOT verify (honest limits)

- **No live HTTP call to the deployed function** — it isn't deployed yet
  (ships in the batch push, rule 9). This ran the same pure functions the
  handler calls, fed the same real data, which is what the harness's own
  header says is needed beyond the fixture suite; the handler's I/O
  (Stripe SDK calls, pagination, `requireAuth`) is verified by code review
  only until a real deploy exists.
- **`requireAuth` 401/403 behavior** — verified by reading `_auth.js`
  directly rather than a live curl (no deploy to curl yet). An anonymous
  POST (no `Authorization` header) hits step 3 and returns
  **401** `"Unauthorized: missing token"` — same behavior already proven
  live for `promotions-admin.js` (CLAUDE.md, 2026-07-26). A signed-in
  non-admin viewer hits step 4 and returns **403**
  `"Forbidden: admin access required"`, not 401 — the kickoff's VERIFY line
  said "non-admin gets 401"; the actual, consistent-with-every-other-admin-
  function behavior is 401 for no/bad token and 403 for a real but
  non-admin session. Recording the correction rather than the shorthand.
  Live check for after deploy:
  ```
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    https://app.getbrandgeo.com/.netlify/functions/revenue-report \
    -H "Content-Type: application/json" -d "{}"
  # expect 401
  ```
- **Three tabs rendering for an admin** — not visually confirmed. Demo mode
  (`brandgeo-dashboard-demo` launch config) short-circuits `isAdmin` to
  `false`, so there is no way to see the admin view without real
  credentials, which this session does not have. Confirmed instead: the
  route renders without crashing, the non-admin gate matches the prior
  page's behavior, `tsc --noEmit` and `npm run build` both pass, and the
  TypeScript types were corrected against `_revenue.js`'s ACTUAL output
  shape (not just the contract's worked example) — see
  `docs/arch/revenue-report-data-contract.md` §10 for the two real bugs that
  caught (`attribution: null`, unfiltered `pipeline.clients`).
