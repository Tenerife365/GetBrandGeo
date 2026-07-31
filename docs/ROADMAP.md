# ROADMAP.md — the queue the orchestrator loop reads

Format is load-bearing. Every item carries a `check:` command that exits 0 when
the item is genuinely done. See `docs/AUTONOMY.md` §1 for why. An item with no
check command cannot be started; write the check first.

Tags: `night-safe` (see AUTONOMY §3 for the four conditions), `day-only`,
`needs-human`. Scope lines exist so parallel agents do not collide.

---

## NEEDS CONSTANTIN

Nothing here blocks the loop. It works around these.

- **When you create the package price, the Payment Link MUST set
  `customer_creation: 'always'`.** Stripe creates a Customer in `payment` mode
  only with that flag (confirmed in the vendored SDK types). Without it
  `session.customer` is null and the sale cannot be linked to anyone. Also set
  `metadata.plan` and `metadata.months` on the price.
  `scripts/stripe-create-catalogue.js` does NOT pass the flag and is the file
  someone will copy from.

- **A package sells a tier, not prompts.** `growth_pro` is **35** prompts,
  identical to `growth` (`planConfig.ts:427`), and `prompt_limit_override` has
  zero hits repo-wide. A "Growth PRO plus 200 prompts" offer would deliver 35.
  Decide whether the founding-client offer includes extra prompts; if it does,
  A2 §3.4 has to be built before it is sold.

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

- **A1-S1. HIGH, gated. An existing subscriber who buys a package gets reverted
  while Stripe keeps charging them.** The mirror of the leak A1 closed:
  `stripe-webhook.js:287` sets `plan_source='package'` while `:288` deliberately
  preserves `stripe_subscription_id`, so `expire-plan-grants.js:69-72` later
  drops a paying customer to Free and emails them a lapse notice. The code's own
  comment reasons about "a client who holds both" and then leaves that case
  unprotected in the job that reverts them.
  **The gate: close this before the first package grant date, and before selling
  a package to anyone who already has a subscription.** `MIN_PACKAGE_MONTHS = 1`
  guarantees at least a month of runway from the first sale, which is why A1
  shipped without it. Companion fix (null the sub id on `subscription.deleted`)
  and the exact patch are in `docs/qa/package-provisioning-014.md`.
  `check: (bg-verify's S1 assertion added to tests/package_provisioning.test.js passes)`

- **A1-S6. The most contested line in A1 is pinned by nothing.** bg-verify ran
  twelve mutations; eleven were killed. The survivor deletes
  `plan_source`/`plan_grant_until` from `stripe-webhook.js:287` and all 43
  checks stay green. That is precisely the deviation the review had to
  adjudicate. Add the assertion.
  `check: node brandgeo-dashboard/tests/package_provisioning.test.js`

- **A1-S2/S3. MEDIUM.** Early renewal forfeits the unused remainder
  (`grantUntil` always computed from today, `:221`, never reads the current
  row). And line-item `quantity` is never read, so quantity 2 on a 6-month
  package still provisions 6 months.

- **A1. One-time and package payments are silently dropped. DONE 2026-07-31,
  `19449ad`, see the Done section. Findings above carried forward.**
  `stripe-webhook.js:142` returns early on `session.mode !== 'subscription'`.
  A 12-months-for-the-price-of-10 package sold as a one-off means the customer
  pays and the product provisions nothing, with no error anywhere. This is the
  single highest-risk item on the board and it is live today.
  `check: node -e "const s=require('fs').readFileSync('brandgeo-dashboard/netlify/functions/stripe-webhook.js','utf8'); process.exit(/mode !== 'subscription'/.test(s) && !/mode === 'payment'/.test(s) ? 1 : 0)"`

- **A1-S2-tier. DECIDED 2026-07-31, not yet built.** A lower-tier package must
  NOT stack onto a higher-tier live grant. Refuse it. The builder correctly
  declined to invent this, because Constantin had ruled on months and not on
  tiers; he has now ruled. Today a client with a live Growth PRO comp who buys
  a 3-month Essentials package is dropped to Essentials immediately and keeps
  the stacked tail. Unreachable until a package is sold. **Fold into the next
  builder pass on `_package_checkout.js` rather than opening a third round on
  the same file.**
  Constantin's reasoning is worth keeping, because it reframes the whole
  question: mixing tiers is not a renewal case at all, it is the multi-site
  case below. One account, several websites, each on its own plan.
  `check: node brandgeo-dashboard/tests/package_provisioning.test.js` (with a
  lower-tier-onto-higher-grant fixture asserting refusal)

- **D1. One account, many websites. Each website its own dashboard and its own
  plan.** Constantin, 2026-07-31: clients and agencies with several websites or
  products need one login and a dashboard per site, not one login per site.
  **This is not a feature gap, it is a tenancy model change.** Today the binding
  is one user to exactly one client, and it is enforced server-side, not merely
  in the UI: `user_profiles.client_id` is a single FK and `_auth.js:116`
  rejects any request whose `clientId` does not equal it. `clients[]` in
  `clientContext.tsx:33` is commented "populated for admin only". So the client
  switcher an agency needs already exists and is deliberately unreachable for
  the people who would pay for it.
  What that implies, and why this is `bg-architect` before anyone writes code:
  - user-to-client becomes many-to-many (a membership table with a role per
    membership), and `_auth.js`'s ownership check becomes a membership test.
    That is the security boundary of the entire product; getting it wrong is a
    cross-tenant data leak, and this codebase has had leaky RLS before (§6.4
    step 7, nine permissive policies that ORed away per-client isolation).
  - RLS policies keyed on `user_profiles.client_id` all have to change with it.
  - billing becomes per-site, not per-account: several subscriptions under one
    login, which touches every assumption in `stripe-webhook.js` about one
    customer mapping to one client.
  - it interacts with A5 and A6: limits, consumption and bonus grants are
    per-site, and an agency will expect a roll-up across sites.
  Sequence: `bg-architect`, then `bg-verify` on the auth boundary BEFORE any
  build, then backend, then app. Not a single cycle.
  `check: test -f docs/arch/multi-site-tenancy.md`

- **A6. A client can always see their own plan limits and consumption.**
  Constantin, 2026-07-31. Today they cannot see either: `/usage` is the admin
  cost estimator and renders "Access restricted to admins." for a viewer
  (`Usage.tsx:142`), and limits surface only incidentally on AIVisibility and
  Prompts. There is no client-facing view of what they are entitled to or how
  much of it they have used.
  **The load-bearing constraint, and the reason this is not just "unhide
  /usage": that page shows BrandGEO's API cost in euros.** Usage.tsx is a
  margin instrument, with an `OVERHEAD_MULTIPLIER` in it. Showing a client that
  their EUR 299 plan consumed EUR 4 of API spend hands them our gross margin
  and reframes the product as a metered reseller. Consumption must be expressed
  in units the client bought: prompts tracked against their allowance, engines
  active on their plan, collection runs used and remaining, time until the next
  refresh is available. Never in euros of cost, and never as a percentage of a
  cost budget, which is the same disclosure wearing a hat.
  This also raises the stakes on the open PLAN_PROMPTS decision below: a limit
  shown to a customer had better be the limit actually applied.
  Sequence: `bg-strategy` on what may be disclosed, then `bg-design`, then
  `bg-app`. Not a lone build.
  `check: test -f docs/design/client-plan-usage.md`

- **A4b. DECIDED 2026-07-31: `PLAN_PROMPTS` is enforced SERVER-SIDE and also
  displayed.** Constantin: "so we don't have issues in the future." This closes
  the long-open decision and unblocks A5's prompt half and A6.
  Today it is display-only: read at `planConfig.ts:516` for the plan card and
  enforced nowhere. So a Free client can create 500 prompts and every one of
  them collects, against a EUR 0.30 monthly budget.
  Two things this must not become:
  - **Enforcement cannot be a frontend guard.** `Prompts.tsx` hiding the Add
    button is not enforcement; the insert path is what has to refuse. Same
    lesson as `_auth.js` being the real tenancy boundary while the UI merely
    looked like one.
  - **Existing clients might have been over the new cap.** Measured against
    production 2026-07-31 rather than assumed, and **nobody is even close**:
    free holds at most 2 of 5, essentials 1 of 15, growth 8 of 35, managed 6 of
    120, pro 8 of 120. So enforcement ships with no migration, no grandfather
    clause, and no risk of cutting off a paying customer. Re-measure before
    building; this is a snapshot, not a guarantee.
  Sequence: `bg-backend` on the insert path plus the collection queue, then
  surface the number in A6. Note the caps are generous enough that enforcement
  is protection against a future runaway, not a limit anyone is feeling today,
  which is the cheapest possible moment to add it.
  `check: (a prompt insert beyond the plan cap is refused server-side, asserted in a harness)`

- **A5. Admin can grant bonus prompts and bonus collection credits per account.**
  Constantin, 2026-07-31: the founding-client package does NOT bundle prompts,
  but an admin should be able to open any account and hand out extra prompts as
  a goodwill bonus, or extra credit to run collections. Two different changes
  wearing one name, and the difference decides the work:
  - **Bonus prompts** is nearly free today and nearly meaningless today, for
    the same reason: `PLAN_PROMPTS` is **display-only**. It is read at
    `planConfig.ts:516` for the plan card and enforced nowhere server-side. So
    an override changes a number on a screen until the open decision "is
    PLAN_PROMPTS enforced server-side" is settled. Settle that first or the
    bonus is theatre.
  - **Bonus credits is real money and really enforced.** `_cost.js`'s
    `PLAN_MONTHLY_API_BUDGET_EUR` is the authoritative per-client cap and it
    does gate collection. A top-up column read there genuinely buys the client
    more runs, and genuinely spends BrandGEO's money, so it needs an audit row
    (`client_events`) and an admin-only path like `set-client-plan.js` has.
  Depends on A2 §3.4 for the override-column pattern. `bg-architect` first:
  this is entitlement shape, and the repo already has four plan-ladder copies
  that drifted.
  `check: test -f docs/arch/admin-bonus-grants.md`

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

- **B1a. AuditReport's logo points at `/audit`**, not at either home. Every
  other call site resolves to the dashboard root or to getbrandgeo.com. Decide
  which is correct: if a report is viewed by someone who has not entered the
  dashboard, the rule says landing page, but `/audit` may be the intended
  mother page of that funnel. A product call, not a bug fix.
  Scope: `brandgeo-dashboard/src/pages/AuditReport.tsx:130`.
  `check: grep -q 'BrandGeoMark[^/]*to="/audit"' brandgeo-dashboard/src/pages/AuditReport.tsx && exit 1 || exit 0`

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

- **B1. Every logo returns to the right home.** Passed 2026-07-31, `b130bf6`.
  Four pre-login pages rendered `<BrandGeoMark>` with neither `to=` nor `href=`,
  so the mark was inert. The fix already existed on disk and had never been
  committed, so production still had dead logos and the check passed only
  because it ran against the working tree. Same failure class as the
  TalentWeLove build break an hour earlier, in a different repo, the same
  morning: present locally, absent from git.
  ```
  bash scripts/check-logo-links.sh
  OK: every logo on the marketing site and in the dashboard links somewhere
  exit 0
  ```
  Checked beyond the script, because it only proves a logo links SOMEWHERE and
  the item asks for the RIGHT somewhere: all 79 marketing logos resolve to `/`,
  and every dashboard call site was read individually. That review produced B1a.

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
