PASS WITH FINDINGS

# S21 addendum, pending invoices: retroactive review of 7190918

Reviewer: bg-verify (Opus), 2026-11-02. Commit `7190918`, live since 2026-11-02 08:22Z
(bundle `index-BdWWu1El.js`). It shipped without the pre-push review that
AGENT-OS asks for on a billing-adjacent change, so this review comes after deploy.
Scope: `brandgeo-dashboard/netlify/functions/_revenue.js`,
`brandgeo-dashboard/netlify/functions/revenue-report.js` and
`brandgeo-dashboard/src/pages/Revenue.tsx`.

**Verdict: PASS WITH FINDINGS.** Nothing found needs a revert or a hotfix. The
function is read only, admin gated, makes no new Stripe call, and gave the right
answer on every case I probed. The gaps:
- it has no test;
- the new sort headers cannot be used with a keyboard;
- the commit also changes the totals on three existing tables without saying so.

Counts: BLOCKER 0, MAJOR 0, MEDIUM 3, LOW 6, INFO 3.

## 1. Claims under review

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | No extra Stripe call | PASS | `revenue-report.js:329` calls `computePendingInvoices({ invoices, customers, clients, now })` on the `invoices` and `customers` arrays the report already fetches (`:225` invoices list, no status filter, capped at `MAX_STRIPE_OBJECTS`; `:238` customers). No new `stripe.*` call, no new endpoint, same gate `requireAuth(event, { adminOnly: true })` at `:161-162`. |
| 2a | Not period scoped | PASS | `_revenue.js:1216-1275` never reads the report window. Reproduced: an open invoice created 48 days before `now` is returned. |
| 2b | Status handling | PASS, see I1 | `_revenue.js:1234`: only `status === 'open'` passes. Reproduced: draft, void, paid and uncollectible are all excluded. |
| 2c | `due_date` null | PASS | `daysUntilDue: null` at `:1261`. Reproduced: such a row sorts last and the UI shows "No due date" (`Revenue.tsx:785-788`). |
| 2d | Overdue in UTC | PASS, see L2 | Plain epoch milliseconds, no local-time call, so it is timezone free. The boundary rounding is L2. |
| 3 | Integer cents, `amount_remaining`, partial payment | PASS, see L4 | `:1244-1246` takes `Math.round(amount_remaining)` and converts it once through `round2(centsToEur(...))`. Reproduced: an invoice of 99.00 with 49.50 paid gives 49.5. The fallback when the field is absent is L4. |
| 4 | Attribution order, research, no customer | PASS | Uses the same `resolveClientForCustomer` (`:297`) as `aggregateRevenue`, so the order is `metadata.client_id` (strict digits), then `clients.stripe_customer_id`, then `unattributed`. Reproduced: `"1 BpR"` in the metadata is rejected rather than parsed. A customer that is missing from the list is returned with its id and `unattributed`, and the email is used as the name when there is no client. |
| 5a | UI handles undefined or empty | PARTIAL, see L1 | Empty: `Revenue.tsx:815` returns null after the hooks run, so hook order is preserved. Undefined: there is no guard at `:1153`. |
| 5b | Demo mode | PASS | The fetch at `:942-958` only runs when `isAdmin` is true, and `isAdmin` is never set in demo mode, so a demo session never reaches the section. |
| 5c | No `as any` | PASS | `rg 'as any' src/pages/Revenue.tsx` returns nothing. The one cast, `(a as number)` in `compareValues`, is narrow. |
| 5d | No colour outside the tokens | PASS | The new `rose-500/10 text-rose-400 border-rose-500/30` is the status palette already used in EmptyState, Prospects, Recommendations, PromotionsPanel, SEO, Social and Tickets. |
| 6 | The dash replacement broke nothing that depends on a string | PASS, see I2 | All 30 removed lines in `_revenue.js` are comments. In `Revenue.tsx`, every changed string is display text. `rg` over `tests/` and the i18n files finds none of them, and no CSS class or data attribute changed. 97 of 97 tests pass. |
| 7 | No em or en dashes in added lines | PASS | The added lines of `git show 7190918 -U0`, scanned with `rg` for U+2014 and U+2013, give 0. The positive control (the same pattern on a file known to contain dashes) gave 2, so the pattern does fire. |
| 8 | No real person in added lines | PASS | Added lines carry no email, no profile URL and no full personal name. The only name is "Constantin" in comments, which the brief accepts. |

## 2. Findings

### MEDIUM

**M1. `computePendingInvoices` has no test.**
- Evidence: `rg -n 'computePendingInvoices|pendingInvoices|amount_remaining' brandgeo-dashboard/tests/` returns nothing. `tests/revenue_report.test.js` (97 checks, all green) predates the function.
- Why it matters: this figure is the money owed to the company, on the page the founder uses for receivables, and nothing would catch a regression in it. The S21 parent work set the bar here: a 97-check harness and a SIMULATE pass with zero mismatched cents. The addendum has neither.
- Fix (bg-backend): add a section to `tests/revenue_report.test.js` covering exactly the cases in section 3 below. That list is a ready fixture.

**M2. The new sort headers cannot be used with a keyboard (WCAG 2.1.1).**
- Evidence: `Revenue.tsx:360-375`. `SortableTh` renders `<th onClick=...>` with no `tabIndex`, no `role="button"` and no key handler. It is used on five tables: Usage, Cost, Clients, Research and Pending invoices. A keyboard or screen reader user can read `aria-sort` but cannot change it.
- Fix (bg-app): put a `<button type="button">` inside the `<th>` that carries the label and the click handler, keep `aria-sort` on the `th`, and give the button a visible `focus-visible` ring.

**M3. Undeclared behaviour change on three existing admin tables.**
- Evidence: the commit also refactors Usage, Cost and Research into sortable, filterable sections. Their footer totals now sum the filtered rows instead of the grand totals (`Revenue.tsx:476-487` and `:736-747`, `sorted.reduce(...)`).
- The behaviour is honest: the label reads "(N of M shown)" when a filter is active. But a footer total that used to be the platform cost is now a filter-dependent sum.
- The commit message describes pending invoices and a dash sweep only, so no one reviewed this change to existing numbers.
- Regression surface, found by `rg -n 'UsageSection|CostSection|AudienceTable|useSortableRows' src`: everything is local to `Revenue.tsx` and nothing else imports it. Paths that need a manual look: the Usage tab footer, the Cost tab footer, and the Clients and Research tables, each with a filter typed in and then cleared.
- Fix (bg-app): no code change is required if the filtered total is the intended behaviour. The decision should be recorded. If the owner wants the platform total kept visible, show both, for example "Shown: X, all: Y".

### LOW

**L1. No guard on `revenue.pendingInvoices`.**
- Evidence: `Revenue.tsx:1153` passes it straight in, and `:813-818` call `.reduce` and `.filter` on it. If a response lacks the key, the page throws during render.
- Reachability is low: the function and the bundle ship in one atomic Netlify deploy, and the report is fetched fresh on every mount.
- Fix (bg-app): `pendingInvoices={revenue.pendingInvoices ?? []}`, and mark the field optional in the `RevenueReport` type at `:233`.

**L2. An invoice that is overdue by less than 24 hours is shown as "Due today".**
- Evidence: `_revenue.js:1261` uses `Math.ceil((dueMs - nowMs) / 86400000)`. Reproduced: due 2026-11-02T00:00Z with now at 12:00Z gives `-0`. `-0 === 0`, so `DueBadge` (`Revenue.tsx:793-794`) shows the amber "Due today", and `overdueCount` (`:818`, which checks `< 0`) leaves the invoice out. An invoice due at 00:00 is therefore never counted as overdue on its due day.
- Fix (bg-backend): compare whole UTC days, `Math.floor(dueMs / 864e5) - Math.floor(nowMs / 864e5)`, or treat `dueMs < nowMs` as overdue. Add a test case for it under M1.

**L3. A non-EUR open invoice is shown in euros and added to the euro total.**
- Evidence: `_revenue.js:1259` returns `currency`, but `Revenue.tsx` formats every amount with `eur()` and sums them all into `totalDue` (`:817`). Reproduced: an open USD invoice for 10.00 renders as €10.
- The existing currency warning (`_revenue.js:913-914`) fires only for invoices counted in the period, so an open invoice from outside the period gives no warning at all.
- Latent today: the Spanish account's catalogue is EUR only.
- Fix: bg-backend should push a warning when `currency !== 'EUR'`. bg-app should show the currency code and leave non-EUR amounts out of `totalDue`.

**L4. When `amount_remaining` is absent, the fallback ignores customer credit.**
- Evidence: `_revenue.js:1246` falls back to `invoiceTotalCents - invoicePaidCents`, and `invoiceTotalCents` (`:414`) prefers `total`. Stripe's own formula is `amount_remaining = amount_due - amount_paid`, and `amount_due` already has the credit balance applied. Reproduced: total 1000, `amount_due` 800, nothing paid, no `amount_remaining` field gives 10.00 instead of 8.00.
- Unreachable on the current API version (`2026-07-29.dahlia`), where `amount_remaining` is always present.
- Fix (bg-backend): fall back to `(amount_due ?? total) - amount_paid`.

**L5. Contrast and labelling on the new controls.**
- Computed, sRGB relative luminance, on the card surface `bg-dark-800` rgb(15 23 42) (confirmed at `Revenue.tsx:821`):
  - `text-slate-600` "n/a" in the invoice column (`:862`): **2.36:1**, which fails the 4.5:1 minimum.
  - `text-rose-400` on `rose-500/10`: 6.09:1, pass.
  - `text-slate-500` headers: 3.75:1, which fails 4.5:1 at 12px (pre-existing pattern).
- `FilterInput` (`:343-357`) has a placeholder only: no `<label>` and no `aria-label`. Its focus state removes the outline and changes the border to `brand-500/50` only.
- Fix (bg-app):
  - "n/a" to `text-slate-500` or lighter;
  - `aria-label="Filter by client"` on the input;
  - a `focus-visible:ring-2` ring on the input.

**L6. The data contract was not extended.**
- Evidence: `docs/arch/revenue-report-data-contract.md` has no `pendingInvoices` field, while `Revenue.tsx:154` claims its types match contract section 6b. The field's semantics are undocumented: open status only, not scoped to the period, remaining amount, sort order.
- Fix: bg-architect adds an addendum. This is a docs change only.

### INFO

- **I1.** Excluding `uncollectible` is defensible, since that money has been written off, but the choice is recorded nowhere. Put it in the L6 addendum.
- **I2.** The commit message says the dash sweep changed one admin-facing sentence. The diff changes about nine visible strings in `Revenue.tsx`, including:
  - the page subtitle;
  - "Real clients only, research excluded";
  - "Internal research only, our own city studies, not a customer";
  - the AttributionBadge tooltip;
  - "Provisional, PromoteKit is system of record";
  - "Pipeline: engaged free clients worth a campaign";
  - a dash placeholder replaced by "n/a".

  All of them are harmless (claim 6 passes), but the message understated what changed.
- **I3. PRE-EXISTING.** `revenue-report.js` was not part of the sweep and still carries dashes. Line 130 is in an admin-visible warning string ("INCOMPLETE" followed by a dash and "see"). The rest are comments, at lines 2, 23, 24, 37, 38, 98, 181, 229, 247, 248 and 261. Not a blocker. bg-backend should clear them when next in this file.

### Security

No finding.
- The function is reachable only behind `requireAuth({ adminOnly: true })` (`revenue-report.js:161-162`) and is read only.
- `hostedInvoiceUrl` comes from Stripe's API, not from user input. It renders with `target="_blank" rel="noreferrer"`, and `noreferrer` implies `noopener`.
- `customerEmail` reaches the admin only.
- The secret scan of the diff for key, secret, token and similar patterns found no values. The only hits are identifier names in comments.

## 3. Reproduced versus read

**Reproduced:**
- `node tests/revenue_report.test.js`: 97 of 97, exit 0.
- `npx tsc --noEmit -p tsconfig.json` in `brandgeo-dashboard/`: exit 0.
- A synthetic probe (scratchpad `probe.js`, not committed) calling the exported `computePendingInvoices` with `now = 2026-11-02T12:00Z`. Cases:
  - an open invoice 48 days old;
  - due at 00:00 the same day (gives `-0`);
  - partially paid, 99.00 with 49.50 paid;
  - an open USD invoice;
  - no `due_date`;
  - a customer missing from the list;
  - no `amount_remaining` with total 1000 and `amount_due` 800;
  - draft, void, paid and uncollectible;
  - empty and null inputs (return `[]`).
- The dash scan with a positive control.
- The contrast ratios in L5.

**Read only:** the UI behaviour in `Revenue.tsx`, the keyboard path (M2), demo gating (5b), and the footer total change (M3).

## 4. What to fix and who

| Who | What | Severity |
|---|---|---|
| bg-backend | Test section for `computePendingInvoices` with the section 3 cases | M1 |
| bg-backend | Whole-day UTC overdue comparison | L2 |
| bg-backend | Warn on non-EUR open invoices | L3 |
| bg-backend | Fallback `(amount_due ?? total) - amount_paid` | L4 |
| bg-backend | Dashes in `revenue-report.js:130` and comments | I3 |
| bg-app | Sort headers become buttons with a focus ring | M2 |
| bg-app | Footer total decision recorded, or both totals shown | M3 |
| bg-app | `?? []` guard, optional type field | L1 |
| bg-app | Show the currency code, exclude non-EUR from `totalDue` | L3 |
| bg-app | "n/a" contrast, filter `aria-label`, focus ring | L5 |
| bg-architect | Contract addendum for `pendingInvoices`, including I1 | L6 |

One bg-backend pass and one bg-app pass can carry everything above. It can ride the next batch push, since no item is urgent.

## 5. What was not checked

- Live Stripe data. No Stripe call was made, so the real open-invoice set (for example BpR's EUR 3,500 founding invoice, recorded as `open` in the contract doc) was not compared against the live page.
- The deployed page in a browser at any viewport, the mobile layout of the new table, and keyboard focus order in practice.
- Light mode: the contrast in L5 is for dark mode only.
- Truncation behaviour when Stripe has more than `MAX_STRIPE_OBJECTS` invoices. It is inherited from the parent report and was not re-tested here.
- Auth with a real viewer token. Auth was confirmed from source only, as the brief required.
- No Supabase query was run.
