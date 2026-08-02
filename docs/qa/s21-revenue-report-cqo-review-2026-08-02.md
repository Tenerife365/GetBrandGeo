# S21 Revenue report — blocking CQO review (stage 5)

**PASS WITH FINDINGS**

Registry seat C-0b, `docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md` binding rule
10. Scope: 8 commits, `db804bb^..HEAD` (`db804bb` .. `016af46`), all local, none
pushed. Reviewed 2026-08-02 by `bg-verify` (Opus). No file under review was
edited by this review; the two temporary mutations in §4 were restored and the
file's MD5 re-confirmed identical.

S21 is fit to ride in the next batch push. The money computation is correct and
reproduces independently to the cent. Nothing found is a security exposure, no
secret is in the diff, auth is right, and the read-only claim is real. **F1
should be fixed before the push** — it is one line of copy that makes a false
statement an admin will read on first load — but it does not touch the
arithmetic and does not block on its own.

---

## 1. Calibration

**1. Diff and scope.**

```
 brandgeo-dashboard/netlify.toml                    |    9 +
 brandgeo-dashboard/netlify/functions/_revenue.js   | 1191 ++++++++++++++++
 .../netlify/functions/revenue-report.js            |  367 ++++++
 brandgeo-dashboard/src/App.tsx                     |    4 +-
 brandgeo-dashboard/src/components/Layout.tsx       |    2 +-
 brandgeo-dashboard/src/pages/Revenue.tsx           |  873 ++++++++++++
 brandgeo-dashboard/src/pages/Usage.tsx             |  374 ------
 brandgeo-dashboard/tests/revenue_report.test.js    |  909 +++++++++++++
 docs/arch/revenue-report-data-contract.md          |  312 +++++
 docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md      |    2 +-
 docs/qa/s21-revenue-report-simulate-2026-08-02.md  |  124 ++
 11 files changed, 3789 insertions(+), 378 deletions(-)
```

Every changed file is inside a declared S21 stage's scope. `src/App.tsx` and
`src/components/Layout.tsx` are one-line route/label edits required by the
`Usage.tsx -> Revenue.tsx` rename and are legitimately part of it. No file
outside scope. **No automatic BLOCK triggered.**

**2. Secret scan.** 14 hits across the diff, **all of them variable names or
`process.env` references** (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_KEY`,
`Authorization: Bearer ${token}` built from a live session, the `redact()`
regexes themselves, and prose in the QA docs). **Zero literal secret values.**
Count only, values not reproduced.

**3. Acceptance criteria** — taken from the contract's §5, §6b and §3, plus the
kickoff's VERIFY line. All objectively checkable. One correction, already made
by the SIMULATE stage and **confirmed correct here**: the kickoff's VERIFY line
says a non-admin gets 401; the real behaviour is 401 for a missing or invalid
token and 403 for an authenticated non-admin (see row A6).

**4. Baseline.** `npx tsc --noEmit` exit 0 and `npm run build` exit 0 **on this
HEAD**. There is no pre-existing failure to attribute.

**5. Auth on the most sensitive surface.** `revenue-report.js:160-161` —
`requireAuth(event, { adminOnly: true })` is the first statement in the handler
and `auth.response` is returned immediately. Same shape as
`promotions-admin.js`. Enforced at `_auth.js:109-111`.

**6.** Write access used: `docs/qa/` only. No reviewed file edited.

**CALIBRATED.**

---

## 2. Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| A1 | Fixture harness runs green | PASS | `node brandgeo-dashboard/tests/revenue_report.test.js` -> `93 checks passed.` `EXIT=0`, reproduced by this review |
| A2 | Harness catches a wrong formula, not just a crash | PASS | Two independent mutations, both caught; see §4 |
| A3 | SIMULATE's global figures re-derive from raw Stripe/Supabase values | PASS | Independent script, §3. gross 3501.00, paid 1.00, cost 0.18, net 0.82, exact match |
| A4 | Net formula applied exactly once | PASS | `_revenue.js:684-687` `netEur()` is the only site. `grep` for `paidCents -` / `netRevenueEur =` finds no second derivation in `revenue-report.js` or `Revenue.tsx`; the UI only reads `global.netRevenueEur` (`Revenue.tsx:683-684`) |
| A5 | byPlan and byClient sum back to global | PASS with caveat | All 7 columns matched exactly on the real-data reproduction (§3). Two constructed cases break it by cents and by design; F5, F6 |
| A6 | Anonymous 401, non-admin 403 | PASS | `_auth.js:88` `err(401,'Unauthorized: missing token')`; `_auth.js:95` 401 invalid/expired; `_auth.js:110` `err(403,'Forbidden: admin access required')`. SIMULATE's correction of the kickoff is **confirmed correct** |
| A7 | Function is read-only in Stripe and Supabase | PASS | `grep -nE "\.(insert\|update\|upsert\|delete\|del\|create)\("` over both functions -> **no matches**. Stripe calls are `invoices.list`, `refunds.list`, `customers.list`, `promotionCodes.list`, `coupons.list`, `accounts.retrieve` (`revenue-report.js:221,227,234,237,240,323`). Supabase calls are `.select()` only |
| A8 | No secret can reach a log, an error or the response | PASS | `redact()` `revenue-report.js:111-115` applied at `:327`, `:358`, `:360`. Env vars are named but never interpolated into any message (`:195`, `:208`) |
| A9 | Client join cannot attribute money to the wrong client | PASS | `_revenue.js:297-314`. Strict `/^\d+$/` and a real-`clients.id` match required before `metadata` wins; falls through rather than failing. One residual data-shape case, F7 |
| A10 | Contract §6's CSA note accurately describes the code | PASS | `stripe.invoices.list()` at `:221` carries no date filter and is drained by `listAll` at `:124-134`; the whole account's invoice history is paged on every load, as §6 states. Cap is `MAX_STRIPE_OBJECTS = 5000` and reaching it warns on the page rather than truncating silently |
| A11 | `tsc --noEmit` and `npm run build` pass | PASS | Both exit 0, run in this review |
| A12 | UI filters `pipeline.clients[]` on `engaged` before summing or showing | PASS | `Revenue.tsx:822` `const engaged = revenue.pipeline.clients.filter(c => c.engaged)`; both the total at `:826` and the table at `:844` read `engaged`, never the raw array |
| A13 | `AttributionBadge` renders `attribution: null` as something other than a blank pill | PASS | `Revenue.tsx:233-240` is a `switch`, not an object lookup; `case null` returns `'No Stripe activity'`, styled neutral not amber (`:243-250`) |
| A14 | Cost tab and Revenue tab's cost line agree (contract §5, by name) | **FAIL** | Two independent causes, both demonstrated live. **F1** |

A14 is the one failing row. It is a defect in how the new Revenue tab relates to
the pre-existing Cost tab, not in the revenue arithmetic, and it is a one-line
copy fix plus one scoping decision.

---

## 3. Independent reproduction of SIMULATE

Built only from the raw values quoted in
`docs/qa/s21-revenue-report-simulate-2026-08-02.md` §"Left side" plus
`ENGINE_COST_EUR` from `_cost.js`, then fed to `aggregateRevenue()`. The QA
doc's own output table was not consulted while building it.

Hand-derived from the raw Stripe/Supabase values:

```
gross cents : 350000 + 100 = 350100  => EUR 3501.00
paid cents  :      0 + 100 =    100  => EUR    1.00
api cost    : (0.005 + 0.001) + (0.032*3 + 0.0117 + 0.02521 + 0.03993)
            = 0.006 + 0.17284 = 0.17884  => displayed 0.18
net         : 1.00 - 0 - 0 - 0.17884 = 0.82116  => displayed 0.82
```

`aggregateRevenue()` returned:

```json
{ "grossInvoicedEur": 3501, "paidRevenueEur": 1, "refundsEur": 0,
  "discountsEur": 0, "affiliateCommissionEstEur": 0,
  "estimatedApiCostEur": 0.18, "netRevenueEur": 0.82 }
```

**Zero mismatched cents, independently confirmed.** The three per-client rows
also reproduce: client 1 `attribution: "metadata"` (EUR 3,500 gross, EUR 0
paid), client 51 `attribution: "stripe_customer_id"` (EUR 1 paid), client 52
`attribution: null` (EUR 0.17 cost, no Stripe customer). The EUR 1 test invoice
lands under `"(unknown)"` with the warning the QA doc describes, verbatim.
Sum-back invariant held on all seven columns for both `byPlan` and `byClient`.

Cross-checked against production: `select count(*) from ai_results where
checked_at >= '2026-08-01' and < '2026-09-01'` returns **8**, which is exactly
the 8 rows the QA doc enumerates. The dataset it reconciled was complete.

---

## 4. Harness strength: two mutations, both caught

`_revenue.js` was backed up byte-exact (MD5 `a3ecaf2d...`), mutated, run,
restored, and the MD5 re-confirmed. `git status --porcelain brandgeo-dashboard/`
is empty. Neither mutation is the refund-subtraction one already in the
harness's history.

**M1, `_revenue.js:552`, commission window boundary.** `invoiceMs <
addMonthsMs(...)` -> `<=`. A half-open window silently becoming closed: a
thirteenth commission on a twelve-month term. Result: `AssertionError: true !==
false` at `revenue_report.test.js:405`, the check "exactly +12 months is
OUTSIDE, and so is month 14". Exit 1.

**M2, `_revenue.js:466`, discount fallback base.** `subtotal * percent_off /
100` -> `invoiceTotalCents(invoice) * percent_off / 100`, i.e. applying the
percentage to the post-discount total instead of the pre-discount subtotal.
Result: `AssertionError: 2691 !== 2990` at `revenue_report.test.js:347`. Exit 1.

Both are wrong *answers*, not crashes, and both were caught by the assertion
that names the exact rule. **The harness tests arithmetic, not liveness.**
Restored, re-run: `93 checks passed.` Exit 0.

---

## 5. Findings

### F1 — MEDIUM, correctness + false claim in copy. The Cost tab and the Revenue tab cannot agree, and the page says they do

`Revenue.tsx:697` renders the hint **"Same figure as the Cost tab"** under
`Est. API cost`. That statement is false on first load, for two independent
reasons.

**(a) Different time windows.** The Cost tab reads `ai_results` over the global
time filter (`Revenue.tsx:287-288`, `getStartDate()`), which defaults to **7
days** (`timeFilterContext.tsx:20`). The Revenue tab's `estimatedApiCostEur` is
for the **calendar month** (`revenue-report.js:277-279`). These coincide only by
accident. Measured against production right now:

| Figure | Window | Rows | EUR |
|---|---|---|---|
| Cost tab, default 7d | 2026-07-26..2026-08-02 | 48 | 2.2721 |
| Revenue tab | 2026-08-01..2026-08-31 | 8 | 0.1728 |

An admin opening `/usage` today sees **EUR 2.27** on one tab and **EUR 0.18** on
another labelled "same figure". A 12.6x disagreement, live, with no
configuration.

**(b) Different fallback price tables for legacy rows.** The Cost tab imports
`ENGINE_COST_EUR` from `src/lib/planConfig.ts` (`Revenue.tsx:27`); the report
imports it from `netlify/functions/_cost.js` (`revenue-report.js:49`). They
disagree on one engine:

```
engine      _cost.js (Revenue)   planConfig.ts (Cost)   agree?
chatgpt     0.014                0.108                  *** NO ***
(all seven others identical)
```

This bites only rows with `cost_eur IS NULL`. Production has **76 such chatgpt
rows**, all dated 2026-07-07 to 2026-07-10, so the divergence is **EUR 0.00 for
an August report** and **EUR 7.14** for a July report or any Cost-tab window
covering those four days. Latent today, real.

Contract §5 names this agreement as a requirement: "the Cost tab and the Revenue
tab's cost line must always agree because they read the same numbers." They read
the same *rows* but neither the same *window* nor the same *table*.

**Fix.** Cheapest correct change is to delete or rewrite the "Same figure as the
Cost tab" hint at `Revenue.tsx:697` to say what it actually is (`"{period.label},
metered"`), since the two tabs legitimately answer different questions. Then
reconcile `chatgpt` between `planConfig.ts:330` and `_cost.js` (one is stale;
deciding which is a `bg-backend` call, not mine). Making the windows equal is a
larger product decision and should not be smuggled into this push.

### F2 — MEDIUM, correctness. A failed or canceled refund is netted as if the money came back

`revenue-report.js:226-231` lists refunds with no status filter, and
`_revenue.js:928-951` nets every one of them. Stripe refunds carry
`status: pending | requires_action | succeeded | failed | canceled`. A refund
that **failed** (the bank rejected the return) means the customer was not repaid
— netting it understates paid revenue and net revenue by its full amount, with
no warning.

Demonstrated: a refund of 9900 cents with `status: 'failed'` produced
`paid: 99, refunds: 99, net: 0`.

**Fix.** In `revenue-report.js:227`, filter to succeeded refunds, or in
`_revenue.js:928` skip anything whose `status` is present and not `'succeeded'`,
and warn on a `pending` one so it is visible rather than silently excluded.

### F3 — MEDIUM, correctness. A refund on a commissioned invoice does not reduce the accrued commission

`computeCommissionForInvoice` (`_revenue.js:572-583`) takes 20% of
`invoice.amount_paid` and never consults refunds. If that invoice is then fully
refunded, the affiliate figure still shows a commission on money the business
gave back.

Demonstrated: invoice of 9900 cents paid, fully refunded in the same period ->
`paid: 99, refunds: 99, commission: 19.80, net: -19.80`, and the affiliate card
reads "EUR 19.80 accrued (est.)".

Net revenue is internally consistent (the loss is real, the platform is out
19.80). The wrong number is the **affiliate** one, which is the figure a partner
conversation would start from. Contract §4 is silent on refunds, so this is a
gap in the contract as much as in the code.

**Fix.** Subtract `refundedCents * rate` from the invoice's commission, or, if
the ruling is that a commission once accrued is not clawed back, say so in §4
and add a `meta.warnings` entry when a commissioned invoice is refunded. Either
is defensible; silence is not. Needs Constantin, since it is a partner-payment
policy, not a bug.

### F4 — MEDIUM, judgment call worth escalating. Draft and void invoices inflate gross invoiced, silently

`stripe.invoices.list()` (`revenue-report.js:221`) applies no status filter, and
`invoiceTotalCents` (`_revenue.js:414-419`) counts every one. Contract §5 says
gross is "all invoices `created` in the period, **any status**", so the code
follows the contract exactly — but the consequence is that a half-written draft
sitting in the Stripe Dashboard, and an invoice that was explicitly **voided**,
both land in the headline "Gross invoiced" figure with no warning.

Demonstrated: one `status: 'draft'` invoice of EUR 5,000 plus one `status:
'void'` of EUR 1,200 produced `gross: 6200`, `invoiceCount: 2`, `warnings: []`.

This is not a bug against the contract; it is a place where the contract may say
the wrong thing. Today the account has 2 invoices and neither is draft or void,
so nothing is currently wrong on screen. The first time anyone starts a draft
invoice, the top-line number moves.

**Fix / decision.** Either exclude `draft` and `void` from gross, or keep them
and add a warning naming the amount. I would exclude `void` (money explicitly
cancelled) and warn on `draft`. This one needs Constantin, because "how much was
invoiced" is his question and the answer depends on what he meant.

### F5 — LOW, correctness. Per-row rounding can break the contract's own sum-back invariant

`shapeMoney` (`_revenue.js:689-699`) rounds each row independently, so N rows
each carrying a sub-cent value can sum to more than the rounded global.

Demonstrated: three clients at EUR 0.005 of API cost each -> global
`estimatedApiCostEur: 0.02`, sum of the three rows `0.03`; global net `-0.01`,
sum of rows `0`.

Bounded by half a cent per row and invisible at any realistic invoice size. It
matters only because the harness asserts "every byClient column sums to its
global figure" against fixtures where it happens to hold, which reads as a
stronger guarantee than the code gives. Worth one sentence in the contract
rather than a code change.

### F6 — LOW, by design but undocumented. An untraceable refund breaks byClient sum-back on purpose

`_revenue.js:948-951`: a refund that resolves to no customer is added to the
plan bucket but **not** to any client bucket, and the global refund total is
summed from plan buckets (`:1006-1008`) precisely so it still lands. Correct
behaviour, deliberately chosen, warned about at `:940`. But it means `byClient`
refunds can be less than global refunds, which contradicts the contract's stated
invariant. Document the exception in §6b.

### F7 — LOW, data-shape. Two `clients` rows sharing one `stripe_customer_id` resolve silently to the last one

`_revenue.js:756-761` builds `clientsByStripeCustomerId` with `Map.set`, so a
duplicate overwrites. Verified: with rows 7 and 8 both claiming `cus_dup`, the
resolution returns `clientId: 8` with no warning — money attributed to a
specific wrong client, which is the failure mode the contract calls worse than
unattributed. Requires a data anomaly to reach (only 1 of 38 clients has the
column populated today) and there is no unique constraint on the column to
prevent it. **Fix:** warn on a duplicate rather than overwrite.

### F8 — LOW, semantics. Per-plan cost is keyed on the client's current plan, per-plan revenue on the invoice line's plan

`_revenue.js:990` adds a client's API cost to `planBucket(bucket.plan)`, where
`bucket.plan` comes from `clients.plan` in Supabase, while invoice money is
bucketed by the plan resolved from the invoice line (`:868`, `:889`). When the
two differ, one client's revenue and its cost land in **different plan rows**.

Demonstrated: a client whose Supabase plan is `growth` with an invoice line
tagged `essentials` produced `essentials: paid 99, cost 0, net 99` and `growth:
paid 0, cost 50, net -50`. Global still nets correctly (49), so nothing is lost
— but "net revenue by plan", the chart at `Revenue.tsx:711-742`, is misleading
for that client. Today's data does not exercise it (BpR is `growth_pro` in both
places). Worth a note in §6b and a `meta.warnings` entry when a client's Supabase
plan and invoice plan disagree.

### F9 — LOW, first-touch affiliate attribution silently drops a second partner

`findAffiliateAttribution` (`_revenue.js:516-535`) returns on the **earliest**
tagged invoice and stops. If a customer later redeems a different partner's
code, that partner never appears in `affiliates[]` at all and the first partner
accrues commission on the second partner's invoice.

Demonstrated: a customer attributed to `partner1`, later redeeming `partner2`'s
code on a 9900-cent invoice, produced a single row —
`partner1, 1 redemption, EUR 39.60 accrued` — with `partner2` absent entirely.

First-touch is a legitimate attribution model and contract §4 arguably specifies
it ("the earliest occurrence of the tagged code"). The defect is the **silence**:
a partner whose code was redeemed sees nothing, with no warning explaining why.
**Fix:** warn when a customer's later invoice carries a different affiliate's
code than the one attributed.

### F10 — LOW, latent. Paged Supabase reads have no `ORDER BY`

`selectAll` (`revenue-report.js:145-157`) pages with `.range(from, to)`, and
none of the three queries it drives (`:200`, `:276-279`, `:292-295`) specifies an
order. Postgres does not guarantee stable row order across `LIMIT`/`OFFSET`
without `ORDER BY`, so pages can overlap or skip rows, over- or under-counting
API cost with no error.

Not reachable today: August has 8 `ai_results` rows against a 1,000-row page.
The table holds 1,088 rows in total, so a month that ever exceeds 1,000 rows
makes this live. **Fix:** add `.order('id')` (or any unique column) to each
paged select.

### F11 — LOW, misleading comment. The Revenue tab is the default tab, so it always fires on mount

`Revenue.tsx:270` says the report is "fetched on first visit to the tab, not on
mount, so opening Usage/Cost never pays for a Stripe round trip nobody asked
for." But `:267` is `useState<Tab>('revenue')` — Revenue **is** the landing tab,
so every admin visit to `/usage` immediately pages the full Stripe invoice
history. The lazy-fetch mechanism is real; the stated benefit is not obtained.
Either default to `cost` or correct the comment.

### F12 — LOW, type drift against the shipped backend. `meta` and `byClient` types

`Revenue.tsx:209` declares `stripeAccountId: string; liveMode: boolean`, but
`revenue-report.js:321-334` returns `null` for both when the account cannot be
read or holds no object carrying `livemode`. `Revenue.tsx:174-180`'s
`RevenueByClient` is also missing the `invoiceCount` field that contract §10
item 3 says was added additively to `byClient[]` (the backend does return it).
Neither breaks a render — a null `stripeAccountId` renders as nothing at `:659`
— but SIMULATE's claim that "the TypeScript types were corrected against
`_revenue.js`'s ACTUAL output shape" is not fully true.

### F13 — LOW, PRE-EXISTING, not introduced by S21. The Cost tab's overhead claim is false

`Revenue.tsx:626` states "EUR, API costs x 1.5 overhead (Supabase, Netlify,
hosting, Plausible, domain)". No 1.5 multiplier is applied anywhere in the file;
`ENGINE_COST` (`:46`) is `ENGINE_COST_EUR` raw and every displayed figure derives
from it unmultiplied. Confirmed pre-existing: identical line at
`Usage.tsx:368` in `db804bb^`. Recorded per the pre-existing-defect rule, not
blocking this release, but it is a false number-provenance claim on a page whose
whole purpose is number provenance.

### F14 — INFORMATIONAL. `invoiceCount` is zero on a row carrying paid revenue

`_revenue.js:888` increments `invoiceCount` only inside the `createdInPeriod`
branch. An invoice created in July and paid in August therefore contributes EUR
299 of paid revenue to August with `invoiceCount: 0` (demonstrated). The
per-plan caption at `Revenue.tsx:735` renders "0 invoices - gross EUR 0.00 -
paid EUR 299.00", which reads as a contradiction. Cosmetic.

---

## 6. Contract §10 judgment calls: where I would differ

The five items §10 resolved during BUILD are all defensible. Two comments:

- **Item 1 (`attribution: null` as a fourth enum value): agree, and it is
  right.** Conflating a cost-only research row with a genuine join failure would
  fire an amber warning on 27 rows every load. The contract's enum should be
  amended to name it rather than left as a §10 note.
- **Item 4 (Radar valued at EUR 39 list, not EUR 29 launch): I would use 29.**
  Not "this is wrong" — the code follows §9 and §6b as written, and the builder
  flagged the divergence in the code itself (`_revenue.js:82-90`), which is
  exactly right. But the pipeline table's own headline is "at risk of never
  being campaigned to", and a campaign run this month sells at EUR 29 while the
  first-100 window is open. Valuing the opportunity at a price nobody is
  currently charged overstates it by 34%. This is a Constantin decision, not a
  fix: either amend §9 to say "the price it would actually be sold at today" and
  change the constant, or keep 39 and note in the UI that it is list, not
  launch. Today it changes nothing, because zero free clients are engaged.
- **Items 2, 3 and 5: agree without reservation.** Item 2 in particular (the
  `engaged` flag, precomputed server-side so the UI cannot apply a different
  bar) is the right shape, and the UI honours it (`Revenue.tsx:822`).

The §10 "not resolved" item — the Cost tab's unpaged `ai_results` select — is
**confirmed live today**: the table holds 1,088 rows against PostgREST's 1,000
default, so the Cost tab under-reports on "All time" right now. Correctly kept
out of S21's diff. It should be the next task in this area, and F1(b) and F10
belong in the same commit as it.

---

## 7. Regression surface

Found by grep, not by intuition.

- **`src/pages/Usage.tsx` is deleted.** `grep -rn "pages/Usage\|from './Usage'"`
  over `src/` returns nothing outside the removed import. `App.tsx:24` and
  `:117` are the only referents and both were updated. No dangling import.
- **The `/usage` route path is unchanged** (`App.tsx:117`), so bookmarks and any
  external link survive. `grep -rn "'/usage'"` finds `App.tsx:117` and
  `Layout.tsx:265` only. Confirmed both updated.
- **`_cost.js` gains a new consumer.** `revenue-report.js:49` imports
  `ENGINE_COST_EUR`. `_cost.js` is already required by `_auth.js`,
  `promotions-admin.js`, the three collectors and `_prospect_engines.js`; this
  import is read-only and adds no coupling. But it is now the file that F1(b)
  turns on — a change to `_cost.js`'s `chatgpt` value moves the Revenue tab and
  not the Cost tab.
- **`netlify.toml`** gains only an additive `[functions."revenue-report"]`
  block; no existing block modified (diff read in full).
- **`_revenue.js` has exactly one consumer** in `netlify/functions/`
  (`revenue-report.js`) plus the harness. Nothing else imports it.

**Paths needing a manual look after deploy:** `/usage` as an admin (the three
tabs have never been rendered with real credentials — see §8), and the Netlify
function log for `[revenue-report]` on first load, to confirm the 26s timeout is
enough against the real account.

---

## 8. What was NOT checked

- **No live HTTP call to the deployed function.** It is not deployed. Every
  claim about `requireAuth`'s status codes is from reading `_auth.js`, not from
  a curl. The curl in the SIMULATE doc should be run after the batch push.
- **The three tabs have never been seen rendered by an admin.** Demo mode forces
  `isAdmin: false` and this review has no admin credentials. `tsc`, `build` and
  a code read are all that stand behind the UI.
- **No accessibility measurement was performed.** No contrast ratio was
  computed, no keyboard walk, no viewport check. The tab strip
  (`Revenue.tsx:390-407`) uses `role="tablist"`/`role="tab"`/`aria-selected` but
  has no `role="tabpanel"`, no `aria-controls`, and no roving `tabindex`, so it
  is an incomplete ARIA tabs pattern — the buttons are natively focusable, so it
  is reachable, but a screen reader will not announce the relationship. Also
  noted without measurement: `Revenue.tsx:849` puts `flex` on a `<td>`. **These
  are unverified observations, not findings.** An a11y pass on this page is owed
  and is not in this review.
- **No Stripe object was touched, read or written by this review.** All Stripe
  values used here are the ones quoted in the SIMULATE doc.
- **The pre-existing Cost-tab paging defect was confirmed to exist but not
  characterised** beyond the row count.
- **`PRICE_TO_PLAN` was not reconciled line by line against
  `stripe-webhook.js:75-94`.** The two are hand-maintained copies by design; a
  drift check between them is its own task.
- **Multi-currency behaviour was not exercised beyond the warning path.** The
  code warns and then sums a non-EUR invoice as if it were EUR
  (`_revenue.js:899-901`). Correct for a EUR-only account; untested against a
  real foreign-currency invoice.

---

## 9. Verdict

**PASS WITH FINDINGS.** S21 may ride in the next batch push.

Before the push, one line: **F1's "Same figure as the Cost tab" at
`Revenue.tsx:697`**, which is demonstrably false on first load (EUR 2.27 vs EUR
0.18 against production today). It is admin-only copy, but it is a false claim
about number provenance on the page whose job is number provenance.

Everything else is a follow-up. F2 (failed refunds), F3 (commission on refunded
invoices) and F4 (draft/void invoices in gross) are the three that should be
scheduled next; F3 and F4 need a Constantin decision before code, because they
are partner-payment and reporting-definition policy, not defects.

Nothing here is a live security exposure. No HUMAN CHECKPOINT is raised.
