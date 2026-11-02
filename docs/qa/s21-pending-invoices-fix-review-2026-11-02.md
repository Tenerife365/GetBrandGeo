VERDICT: PASS WITH FINDINGS

0 blocker, 0 major, 0 medium, 4 low, 5 info. Nothing found here needs a hold before the fix batch is committed. The four LOW items can ride the same commit or the next one.

# S21 pending invoices: review of the fix round

- Reviewer: bg-verify (Opus), read-only.
- Date: 2026-11-02.
- Subject: the uncommitted working tree fixes that close `docs/qa/s21-pending-invoices-retro-review-2026-11-02.md`.
- Files reviewed (the full working tree diff of each was read):
  - `brandgeo-dashboard/netlify/functions/_revenue.js`
  - `brandgeo-dashboard/netlify/functions/revenue-report.js`
  - `brandgeo-dashboard/tests/revenue_report.test.js`
  - `brandgeo-dashboard/src/pages/Revenue.tsx`
  - `docs/arch/revenue-report-data-contract.md`
- Builders: bg-backend (M1, L2, L3 server half, L4, I3), bg-app (M2, M3 comment, L1, L3 UI half, L5) and bg-architect (L6, section 12 plus one line in 6b).
- Scope note: nothing in this diff touches auth, RLS, billing writes or plan gating. `revenue-report.js` stays behind `requireAuth` with `adminOnly` (line 161, unchanged) and only reads from Stripe.

## 1. Original findings

| Id | Status | Evidence |
|---|---|---|
| M1 `computePendingInvoices` had no test | CLOSED | Test section 15 adds 17 checks, for 114 in total. Reproduced: `node tests/revenue_report.test.js` printed "114 checks passed." and exited 0. A mutation check was also run. With the old `Math.ceil` day count restored, the suite exits 1 with "expected +0, got -0". With the old amount fallback restored, it exits 1. The unmutated copy exits 0. So section 15 detects both regressions. Two cases that contract 12.8 requires are still missing; that is N3. |
| M2 `SortableTh` was not keyboard reachable | CLOSED (keyboard) | `Revenue.tsx` `SortableTh`: the `th` keeps `aria-sort` and no longer carries `onClick` or `cursor-pointer`. A `<button type="button">` inside the cell is the control, with `w-full` and `${alignFlex}`, so right-aligned numeric headers stay right-aligned. No `th` in the file still carries `onClick` (checked with rg). Tab order follows DOM order, left to right. The ring contrast is new finding N1. |
| M3 footers sum the FILTERED rows | CLOSED as a ruling | A comment before the AudienceTable tfoot (`Revenue.tsx` about :478 to 480) records "on purpose (Constantin, 2026-11-02)". I cannot trace where the ruling came from from this seat; that is listed under Not checked. The Cost tfoot (about :740) follows the same rule and has no comment (N5, INFO). Correction to my retro report: M3 there said "Usage". The tables that have footers are Clients and Research (both rendered by AudienceTable at :1048 and :1053) and Cost. UsageSection has no tfoot. |
| L1 no `?? []` guard | CLOSED | `pendingInvoices?: PendingInvoice[]` at :233 and `revenue.pendingInvoices ?? []` at :1171. |
| L2 "Due today" for up to 24h overdue, and -0 | CLOSED | `_revenue.js` now computes `(utcDayIndex(dueMs) - utcDayIndex(nowMs)) + 0`, with `utcDayIndex = Math.floor(ms / 86400000)`. Probe results (`Object.is` checks against -0), with now = 2026-11-02T12:00Z: due 11-02 00:00Z gives 0; due 11-01 23:59Z gives -1; due 11-02 23:59Z gives 0; due 11-03 00:00Z gives 1. -0 never appeared, including when `now` was passed as an ISO string or as unix seconds. DueBadge (`< 0` reads Overdue, `=== 0` reads Due today) and `overdueCount` (`< 0`) both agree with the new rule: an invoice due yesterday by UTC date is Overdue at any hour today. |
| L3 non-EUR invoice shown with the euro sign and added to the euro total | CLOSED (both halves) | Server: `currency` is upper-cased, with a missing value read as EUR. `revenue-report.js` about :331 to 345 groups non-EUR rows by currency and calls `warn` once per currency (singular or plural sentence); `warn` de-duplicates. I replicated the loop in the probe: two USD invoices and one GBP invoice produced exactly two warnings. UI: `isEur` upper-cases before comparing, `totalDue` sums EUR rows only, `otherCurrencyCount` drives "N invoice(s) in other currencies not included", and a non-EUR amount renders with 2 decimals plus its currency code, not the euro sign. In the probe, the EUR-only UI total matched the server's rule. |
| L4 `amount_remaining` fallback ignored customer credit | CLOSED | `pendingRemainingCents`: uses `amount_remaining` when it is finite. Otherwise it takes `(amount_due if finite, else the invoice total) - amount_paid`, clamped at 0. Probe results: remaining null, undefined or NaN with amount_due 800 gives 8.00 (the credit is respected); no amount_due gives the total; overpaid (due 500, paid 700) gives +0, not -0; negative `amount_remaining` is clamped to 0. |
| L5 "n/a" contrast and unlabeled filter input | CLOSED | `FilterInput` gains a `label` prop (default "Filter rows") rendered as `aria-label`, and every call site passes "Filter by client". "n/a" is now `text-slate-400`, which is 6.96:1 on the dark card. Correction to my retro report: the 2.36:1 figure there was wrong. `index.css` :146 to 152 remaps `.text-slate-500` and `.text-slate-600` to rgb(148 163 184) `!important` in dark mode, so the old class already rendered at 6.96:1. The change is harmless but did not fix a real failure. The new focus ring is N1. |
| L6 contract had no pendingInvoices section | CLOSED, with two doc mismatches | Section 12 (12.1 to 12.11) and the 6b line were added. I checked the line references in 12.1 and 12.2 (`revenue-report.js:376`, `:226`, `:239`, `:101`, `:125`, `_revenue.js:297`) and they are correct. The selection rule (12.3, `uncollectible` excluded), the row shape and `clientName` fallback chain (12.4), the money and warning rules (12.5) and the sort rule (12.7) match the code. Mismatches: 12.6 and the UI date column (N2), 12.8 and the tests (N3), 12.9 "Usage" (N4). |
| I1 `uncollectible` status | CLOSED | Documented as excluded in 12.3. The code selects `status === 'open'` only, and the test "open only" asserts it. |
| I3 dashes in `revenue-report.js` | CLOSED | rg finds 0 em or en dashes in the file. The :130 warning now reads "Totals are INCOMPLETE. See ...". |

## 2. New findings

### N1 LOW: the focus ring on the sort buttons and the filter input is below 3:1

- Where: `Revenue.tsx`, the `SortableTh` button and `FilterInput`, both with `focus-visible:ring-2 focus-visible:ring-brand-500/60`.
- Evidence: I composited brand-500 at 60% alpha over the dark surfaces. It measures 2.29:1 on dark-800 and 2.35:1 on dark-900. WCAG 1.4.11 asks 3:1 for a focus indicator. A solid `brand-500` measures 4.22:1 and `brand-400` measures 6.56:1.
- Failure: a keyboard user tabbing through the headers gets a ring that is hard to see. This is the same people M2 was opened for.
- Fix: replace `ring-brand-500/60` with `ring-brand-400` (or a solid `ring-brand-500`) in both places.
- Owner: bg-app.

### N2 LOW: the due date column renders in local time while the badge counts UTC days

- Where: `Revenue.tsx`, the PendingInvoicesSection due date cell, `new Date(p.dueDate).toLocaleDateString(undefined, {...})` with no `timeZone`.
- Evidence: contract 12.6 says "No local time is read anywhere on this path". For a viewer west of UTC, a due date of 2026-11-02T00:00Z prints as Nov 1 while the badge beside it reads "Due today" (daysUntilDue 0 by UTC). East of UTC, a 23:59Z due date prints as the next day.
- Fix: add `timeZone: 'UTC'` to the `toLocaleDateString` options. If the local display is intended, change 12.6 instead.
- Owner: bg-app (or bg-architect, if the doc changes instead).

### N3 LOW: two cases required by contract 12.8 have no check in section 15

- Where: `tests/revenue_report.test.js` section 15, compared with the 12.8 list.
- Evidence: there is no check for an invoice with no customer at all, where `clientName` should read "Unknown customer". There is also no check that a missing `currency` reads EUR. The probe shows both behaviours work today (`null`, `undefined` and `''` all give `EUR`), so the gap is untested code, not a defect.
- Fix: add two `ok` checks to section 15, one per case.
- Owner: bg-backend.

### N4 LOW: contract 12.9 names the wrong table

- Where: `docs/arch/revenue-report-data-contract.md` 12.9, which lists "Usage" among the tables whose footers sum filtered rows.
- Evidence: UsageSection has no tfoot. The tables with footers are Clients, Research and Cost. 12.9 inherited this error from my retro M3, which made the same mistake.
- Fix: change "Usage" to "Clients, Research and Cost" in 12.9.
- Owner: bg-architect.

### N5 INFO: the M3 ruling comment is only on one of the two footers

- Where: `Revenue.tsx`, the Cost table tfoot, about :740.
- Fix: add the same one-line comment there, or point to the AudienceTable comment.
- Owner: bg-app.

### Other INFO, no action needed

1. Item 5 (bg-architect's flag on the UI default sort): the flag was not right. The UI default (`'due'` ascending, nulls mapped to `+Infinity`) reproduces the server order exactly. The probe sorted the same six rows both ways and got `in_b in_t1 in_t2 in_a in_e in_c` from each. This holds because `Array.prototype.sort` is stable and `Infinity - Infinity` is NaN, which the sort treats as 0, so null due dates keep the server's `createdAt` order. There is no client name tiebreak in either path. Neither the code nor the contract needs to change.
2. Sorting the Amount column compares figures across currencies (USD 100 next to EUR 100). The currency code is shown on every non-EUR row, so a reader can see it.
3. Returning to the Status column sorts descending first. This was already the behaviour before this diff.
4. The non-EUR warning loop in `revenue-report.js` has no unit test. I checked it by replicating the code, not by running the handler.
5. String numeric fields are coerced unevenly: `amount_paid` goes through `num()` and is coerced, while `amount_remaining` and `amount_due` as strings fall through. Stripe always sends integers, so this cannot happen with real data.
6. A null or invalid `now` gives a meaningless `daysUntilDue`. The handler always passes `new Date()`, so this cannot happen, and it predates the diff.

## 3. Other checks

- Response shape: section 15 pins 13 row keys. `module.exports` in `_revenue.js` is unchanged apart from what already exported `computePendingInvoices`; the new helpers are not exported.
- `as any`: 0 in `Revenue.tsx`.
- Tailwind classes built from template strings: only `${alignFlex}`, which picks between complete literal class names, so the JIT still sees them.
- Dash scan of added lines: I used rg on the 457 added lines across the five files. It found no em or en dash (exit 1). A positive control with each character returned a match, so the pattern does fire.
- Real name scan of added lines: the only email is `someone@nowhere.example`, an existing fixture on a reserved TLD that this diff reuses. The only URL is `https://invoice.stripe.com/i/example`. There is no profile URL. The only capitalised word pair is "Due Nov", which is UI copy. "Constantin" appears alone in the M3 ruling comment, which the brief accepts.
- Secret scan of added lines (key, secret, token, password, bearer, sk-, pk_live, service_role): 0 matches.

## 4. Reproduced versus read

Reproduced from this seat:

- `node tests/revenue_report.test.js` printed "114 checks passed." and exited 0; section 15 shows 17 "ok -" lines.
- `npx tsc --noEmit -p tsconfig.json` exited 0.
- `node --check` exited 0 for both `_revenue.js` and `revenue-report.js`.
- I wrote a scratchpad probe against the real exported `computePendingInvoices`. It covered:
  - the day boundaries and -0, using `Object.is`;
  - `now` as an ISO string and as unix seconds;
  - L4 with null, undefined, NaN and string inputs, overpayment and negative values;
  - currency normalisation;
  - the replicated warning loop;
  - the replicated UI default sort.
- Mutation check: two mutants were run against a copy of section 15. Both failed, and the unmutated copy passed.
- Contrast ratios were computed from the Tailwind token values and the `index.css` remaps.
- The dash, name and secret scans described in section 3.

Read only, not executed:

- the `revenue-report.js` handler path (auth gate, Stripe list calls, the warning loop running inside the handler);
- the rendered `Revenue.tsx` (layout, alignment, DOM tab order);
- the contract line references, which were checked against the source by eye.

## 5. Not checked

- No browser run. Keyboard tab order, the visible focus ring, the "Due today" and Overdue badges, and the other-currency sentence were not seen rendered.
- Light mode contrast of the new ring and of `text-slate-400` (light mode remaps it to rgb(71 85 105)).
- No live Stripe call and no real open invoice. In particular, no invoice with customer credit, so the L4 fallback ran only against fixtures.
- No admin or viewer token. The 401 and 403 behaviour of `revenue-report.js` was not exercised; the gate line was not changed.
- No `npm run build` (RAM cap). The Vite bundle was not built.
- The handler's warning loop was checked by replicating it, not by running it.
- Where the M3 ruling came from: the comment names Constantin and today's date. I have no record from this seat of when he ruled.
- Supabase was not touched. The client join used fixtures only.

## 6. Amendment, orchestrator, 2026-11-02, same day

The four LOW findings and N5 were closed from the orchestrator seat before the
commit, each a one-line mechanical change, then re-verified by reproduction:

- N1 CLOSED: both focus rings (`SortableTh` button, `FilterInput`) now use
  `focus-visible:ring-brand-400`, the 6.56:1 option named above.
- N2 CLOSED: the due date cell passes `timeZone: 'UTC'` to
  `toLocaleDateString`, so the date agrees with the UTC day count in the badge.
- N3 CLOSED: section 15 gained two checks, an invoice with no `customer` field
  reads `Unknown customer` and `unattributed`, and a missing `currency` reads
  `EUR` with the amount unchanged. `node tests/revenue_report.test.js` now
  prints "116 checks passed." (was 114), exit 0.
- N4 CLOSED: contract 12.9 names the Clients, Research and Cost tables.
- N5 CLOSED: the M3 ruling comment now also sits above the Cost table footer.

Re-run after the five edits: 116 checks, `node --check` on both function
files 0, `npx tsc --noEmit -p tsconfig.json` exit 0. Dash scan of all added
lines plus this report: 0, with the positive control firing. The INFO items
stand as recorded; none needs a change.
