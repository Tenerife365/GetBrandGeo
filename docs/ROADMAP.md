# ROADMAP.md — the queue the orchestrator loop reads

Format is load-bearing. Every item carries a `check:` command that exits 0 when
the item is genuinely done. See `docs/AUTONOMY.md` §1 for why. An item with no
check command cannot be started; write the check first.

Tags: `night-safe` (see AUTONOMY §3 for the four conditions), `day-only`,
`needs-human`. Scope lines exist so parallel agents do not collide.

---

## NEEDS CONSTANTIN

Nothing here blocks the loop. It works around these.

- **Publish the askmywebsiteai config for both apps.** Vendor said they would
  fix it 2026-07-31. Both apps are Live, scanned, domains verified, snippets
  installed and the Cortex interview is complete for all 13 pages; the console
  exposes no publish control and support has been contacted.
  `check: curl -s "https://app.askmywebsiteai.com/v1/apps/app_e9a0360bb6095088/config" -H "Origin: https://app.getbrandgeo.com" -H "x-public-key: pk_live_727b3cd724ff6e10ee345d9cb240f6f6" | grep -qv "no published config"`

- **Refresh ChatGPT on prompt 6 for Bucate pe Roate.** ~EUR 0.11, the last stale
  row. Withheld from the loop because it spends money (AUTONOMY §2).

- **Authorize an error monitor** (Sentry or similar). The loop currently has no
  way to discover a bug it did not itself cause. GitHub and Netlify connectors
  are lower value but would replace polling. Supabase already works.

> **There is NO 14-day refund policy and no shortlist guarantee.** Both came
> from TalentWeLove text pasted here by accident on 2026-07-30 and were briefly,
> wrongly, carried into this roadmap. BrandGEO promises no refund trigger.
> Do not write one into any contract, terms page or piece of copy. If a refund
> policy is ever wanted it will arrive as its own decision from Constantin.

- **Confirm the UTC offset.** Every schedule assumes Europe/Bucharest, UTC+3.

---

## Stream A — acquisition and billing, end to end

Scope: `brandgeo-dashboard/netlify/functions/` (stripe*, *plan*, promotions*),
`db/`, `src/lib/planConfig.ts`. Owner `bg-backend` on Opus, reviewed by
`bg-verify`. **day-only** throughout: this is billing.

- **A1. One-time and package payments are silently dropped.**
  `stripe-webhook.js:142` returns early on `session.mode !== 'subscription'`.
  A 12-months-for-the-price-of-10 package sold as a one-off means the customer
  pays and the product provisions nothing, with no error anywhere. This is the
  single highest-risk item on the board and it is live today.
  `check: node -e "const s=require('fs').readFileSync('brandgeo-dashboard/netlify/functions/stripe-webhook.js','utf8'); process.exit(/mode !== 'subscription'/.test(s) && !/mode === 'payment'/.test(s) ? 1 : 0)"`

- **A2. No custom-entitlement record exists.** `clients.plan` is a single enum
  string, so "these engines, this many prompts, this price, this term" cannot be
  expressed. `engines_enabled` already gives per-client engine mixing;
  `PLAN_PROMPTS` is keyed by plan only, with no per-client override. Needs a
  design from `bg-architect` before any build.
  `check: test -f docs/arch/custom-entitlements.md`

- **A3. Admin cannot generate a payable offer.** No Stripe write path exists in
  the product at all: only the billing portal, a subscription read, and the
  inbound webhook. Depends on A2 and on the Stripe connector.
  Note AUTONOMY §2 — the agent may create the price, never send it to a customer.
  `check: grep -rq "prices.create\|paymentLinks.create" brandgeo-dashboard/netlify/functions/`

- **A4. Promotions price nothing.** The table and admin CRUD exist and the
  migration is applied, but no Stripe coupon is created and nothing on the
  checkout path reads a promo code.
  `check: grep -rq "coupons.create\|promotion_code" brandgeo-dashboard/netlify/functions/`

---

## Stream B — navigation and interlinking

Scope: `brandgeo-dashboard/src/components/`, `brandgeo/web/*.html`,
`brandgeo/web/site.js`. Owner `bg-app` + `bg-web`. Mostly **night-safe**.

- **B1. Every logo returns to the right home.** Inside the dashboard the logo
  goes to the dashboard home; on the marketing site it goes to the landing page.
  Constantin found pages where the logo is not clickable at all while onboarding
  a test client. Audit all 76 marketing pages and every dashboard shell.
  `check: bash scripts/check-logo-links.sh`  (write this script as part of the item)

- **B2. Cross-surface links resolve.** No link from the dashboard lands on a
  marketing 404 or vice versa. Includes the footer, support, privacy and terms
  links that the retiring Jamie widget points at.
  `check: bash scripts/check-links.sh`

- **B3. Verify the greeting clock.** The dashboard rendered "Good evening" at
  roughly 11:30 local on 2026-07-30. Either the greeting uses UTC while claiming
  local, or the observation was wrong. Confirm before fixing; do not assume.
  `check: grep -rq "getTimezoneOffset\|toLocaleTimeString" brandgeo-dashboard/src/pages/Dashboard.tsx`

---

## Stream C — the real customer journey

Scope: `brandgeo/web/`, `brandgeo-dashboard/src/pages/Signup.tsx`,
`Onboard.tsx`. Owner `landing-page-optimizer` then `bg-copy` then `bg-app`.
**day-only** from C2 onward: it is customer-facing copy and money.

- **C1. Audit the funnel end to end and write it down.** Landing, audit run,
  results, and what the visitor can actually do next. Constantin's finding: at
  the results step the only call to action is Book a call. There is no way to
  accept and proceed. Produce evidence, not impressions.
  `check: test -f docs/qa/acquisition-funnel-audit.md`

- **C2. Add "accept and continue" alongside Book a call**, leading to a company
  details step that collects what onboarding actually needs.
  `check: bash scripts/check-funnel-accept-path.sh`

- **C3. Payment gated behind the contract.** On the final step the Stripe
  payment must be unreachable until the visitor has either opened and accepted
  the contract or ticked an explicit "I have read and accept" box. A link to the
  existing `terms.html` sits on the same page.
  The gate must be enforced server-side too, not only by a disabled button, or
  it is decorative.
  **Invent no commercial terms here.** Link the terms page that exists; do not
  author guarantees, refund windows or SLAs. See the note under NEEDS CONSTANTIN.
  `check: bash scripts/check-contract-gate.sh`

---

## Carried over, still open

Full context for each is in `CLAUDE.md`. Listed here so the loop can see them.

- Growth PRO's ladder is thin: EUR 449 vs EUR 299 buys +25 prompts and a faster
  refresh, identical engines. **day-only**, pricing decision.
- Three conflicting Growth prompt counts: 35 shipped, 50 in a planConfig
  comment, 75 in the pricing doc. `night-safe` once the true number is chosen.
- `job_runs.ok` is true whenever a submitter was merely configured, even if
  every submission failed. Undercuts the observability work packet 012 built.
- Two packets share id `006`.
- Retire the dashboard SupportWidget code entirely, and flip `JAMIE_RETIRED`
  in `brandgeo/web/site.js`. Both blocked on the askmywebsiteai publish above.

---

## Done

Items land here only with a passing check command and the date it passed.

- **Stripe connector points at BrandGEO.** Passed 2026-07-30. It had been
  authorized against TalentWeLove (`acct_1TxtkGQAKgm0Dugx`), so an agent
  creating a price would have put BrandGEO billing objects in the wrong legal
  entity and a customer would have paid the wrong company. Root cause: Stripe
  OAuth grants whichever account is active in the dashboard switcher at the
  moment of approval, so re-authorizing without switching first reproduces the
  fault silently. Three consecutive checks caught it before anything was built.
  ```
  get_stripe_account_info      -> acct_1LHjKrKh2GaZE2B4  "BrandGEO"
  GetPricesPrice price_1Ty5a7Kh2GaZE2B4vQhoTktV
                               -> EUR 449.00/month, active, metadata.plan=growth_pro
  ```
  **The connection is `livemode: true`.** Every Stripe write from here is real
  customer money in the live account. There is no test-mode safety net.
