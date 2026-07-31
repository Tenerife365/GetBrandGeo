# ROADMAP.md — the queue the orchestrator loop reads

Format is load-bearing. Every item carries a `check:` command that exits 0 when
the item is genuinely done. See `docs/AUTONOMY.md` §1 for why. An item with no
check command cannot be started; write the check first.

Tags: `night-safe` (see AUTONOMY §3 for the four conditions), `day-only`,
`needs-human`. Scope lines exist so parallel agents do not collide.

---

## NEEDS CONSTANTIN

Nothing here blocks the loop. It works around these.

- ~~**Decision 1b, what the Free tier's engine is.**~~ **DECIDED 2026-07-31 by
  Constantin: `PLAN_ENGINES.free = ['gemini']`.** S1 is fully closed, nothing in
  the ladder is owed. Recorded here only because it changes a constant S2 would
  otherwise get from the wrong place: **`PLAN_MONTHLY_API_BUDGET_EUR.free` stays
  at 0.30. The raise to 0.60 drafted in decision 2 is CANCELLED**, because Free's
  5 Gemini prompts cost EUR 0.160, not EUR 0.540.

- ~~**LIVE DEFECT: a free signup cannot finish its own first collection.**~~
  **CLOSED IN THE RULING 2026-07-31, ships with S2, still live in production
  until it does.** 5 prompts at EUR 0.108 of ChatGPT is EUR 0.540 against a EUR
  0.30 budget, so `_auth.js:checkCollectionLimits` blocks after prompt 3 and the
  visitor sees a raw budget error where the product promised 5. Created when
  ChatGPT was repriced from EUR 0.056 to EUR 0.108 and the free budget was not
  moved with it. Decision 1b fixes it by moving Free to Gemini rather than by
  raising the budget, which is cheaper and also stops a Radar buyer losing an
  engine. **S2 must not ship both fixes**; the budget stays at 0.30.

- **NEW, created by decision 1b and owned by S2: ChatGPT is now first sold at
  Essentials, so "upgrade to unlock" is false on the next rung.**
  `getEngineStates()` renders an engine the plan lacks as **locked**, which reads
  as "upgrade and you get this". After 1b, ChatGPT is locked on Free and still
  locked on Radar, because Essentials at EUR 99 is the first tier carrying it. A
  generic upgrade nudge next to ChatGPT on Free now points at a tier that does
  not deliver it. Copy fix, not architecture, but it sits on the entry rung the
  whole sprint is built to sell.
  `check: the Free-plan ChatGPT nudge names Essentials, not the next tier`

- **The SerpApi pool is the ceiling on the top of the ladder, and it is a
  purchase decision, not a pricing one.** 500 credits a month supports either one
  Managed client at 200 prompts (100 percent of the pool), or three Growth PRO,
  or fourteen Growth. Ruled explicitly out of scope by S1 (open question 2b). Not
  blocking today's book; live the moment a second Managed client signs. Either
  buy a larger SerpApi plan or cap SerpApi engines to a subset of the prompt
  allowance, which is an architecture change and a copy problem.

- **When you create the package price, the Payment Link MUST set
  `customer_creation: 'always'`.** Stripe creates a Customer in `payment` mode
  only with that flag (confirmed in the vendored SDK types). Without it
  `session.customer` is null and the sale cannot be linked to anyone. Also set
  `metadata.plan` and `metadata.months` on the price.
  `scripts/stripe-create-catalogue.js` does NOT pass the flag and is the file
  someone will copy from.

- ~~**A package sells a tier, not prompts.**~~ **DECIDED 2026-07-31 by
  Constantin: skip it. Packages sell the tier as it stands, with no extra
  prompts.** So `growth_pro` delivering **35** prompts, identical to `growth`
  (`planConfig.ts:428`, verified), is the intended behaviour and not a defect to
  work around. Consequence worth stating plainly, because it will come up the
  first time anyone drafts the offer: **A2 §3.4 is not needed to sell a package**,
  and no package copy may promise a prompt count above the tier's own. The
  Growth to Growth PRO boundary still adds zero prompts, so the upsell has to be
  argued on engines, sites and AI SEO depth, never on volume.

- **Publish the askmywebsiteai config for both apps.** **Constantin 2026-07-31:
  parked, handle later.** Still failing as of 10:09 that day: the endpoint
  returns `{"error":"no published config"}`, so the vendor missed the date they
  gave. Keeps blocking the SupportWidget retirement and the `JAMIE_RETIRED` flip
  in the Carried-over section.
  `check: curl -s "https://app.askmywebsiteai.com/v1/apps/app_e9a0360bb6095088/config" -H "Origin: https://app.getbrandgeo.com" -H "x-public-key: pk_live_727b3cd724ff6e10ee345d9cb240f6f6" | grep -qv "no published config"`

- ~~**Refresh ChatGPT on prompt 6 for Bucate pe Roate.**~~ **CLOSED 2026-07-31,
  no action and no spend needed. It was already fresh.** Measured against
  production rather than assumed: all six ACTIVE BpR prompts carry a `chatgpt`
  row from 2026-07-30 11:57 to 11:58, and position 10 from 2026-07-31 06:46. The
  stale 2026-07-07/09 `chatgpt` rows that prompted this item belong to prompts
  172 and 177, both `is_active = false`, so they are not collected and not
  displayed. **The lesson is the roadmap's own: a staleness claim about
  production has to be measured against production.** Query used:
  ```sql
  select p.id, p.position, p.is_active,
         max(r.checked_at) filter (where r.llm='chatgpt') as chatgpt_last
  from prompts p join clients c on c.id = p.client_id
  left join ai_results r on r.prompt_id = p.id
  where c.slug = 'bpr' and p.is_active group by 1,2,3 order by p.position;
  ```

- **Error monitor: AUTHORIZED 2026-07-31 by Constantin.** No longer a decision,
  it is an action. The loop still has no way to discover a bug it did not itself
  cause. Blocked only on the one step no agent can take: creating the account.
  See the Sentry item in Stream B. GitHub and Netlify connectors are lower value
  but would replace polling. Supabase already works.

> **There is NO 14-day refund policy and no shortlist guarantee.** Both came
> from TalentWeLove text pasted here by accident on 2026-07-30 and were briefly,
> wrongly, carried into this roadmap. BrandGEO promises no refund trigger.
> Do not write one into any contract, terms page or piece of copy. If a refund
> policy is ever wanted it will arrive as its own decision from Constantin.

- ~~**Confirm the UTC offset.**~~ **ANSWERED 2026-07-31, and the assumption was
  wrong by two hours.** The machine is `GMT Standard Time` at `+01:00`, not
  Europe/Bucharest UTC+3. **The night window is 19:00-06:00 UTC.** `AUTONOMY.md`
  §3 is corrected. **The remaining action is on the schedules**: every entry in
  `.claude/` was written against +3 and must be re-derived before
  `brandgeo-night-cycle` is re-enabled, or two hours of each night cycle run
  while Constantin is still monitoring.
  The earlier `date +"%z"` command failed for him because it is a Unix builtin;
  neither PowerShell nor CMD has it. The Windows equivalents are
  `Get-Date -Format "yyyy-MM-dd HH:mm zzz"` and `(Get-TimeZone).Id` in
  PowerShell, or `tzutil /g` in CMD.
  `check: powershell -NoProfile -Command "(Get-TimeZone).Id"`

---

## Stream A — acquisition and billing, end to end

Scope: `brandgeo-dashboard/netlify/functions/` (stripe*, *plan*, promotions*),
`db/`, `src/lib/planConfig.ts`. Owner `bg-backend` on Opus, reviewed by
`bg-verify`. **day-only** throughout: this is billing.

> **STALE-ENTRY CORRECTION, 2026-07-31.** The four items immediately below
> (S1, S6, S2/S3) read as open and are **all closed in `HEAD` by `3c3f003`**,
> which this section was never updated to reflect. Verified by reading the code,
> not the commit message: the subscription-liveness guard is at
> [expire-plan-grants.js:95](../brandgeo-dashboard/netlify/functions/expire-plan-grants.js),
> keyed on `stripe_subscription_id` rather than on `plan_source`, and the
> harness fixtures it in section 7. `node brandgeo-dashboard/tests/package_provisioning.test.js`
> prints **63 checks passed, exit 0**.
>
> This is the exact shape of the wasted cycle on 2026-07-29: a prose backlog
> entry believed over `git log`. Left in place rather than deleted, because the
> reasoning is still the record of why the code looks the way it does. **Do not
> rebuild any of them.** Only A1-S2-tier below is genuinely unbuilt.

- **A1-S1. CLOSED by `3c3f003`.** ~~HIGH, gated. An existing subscriber who buys
  a package gets reverted while Stripe keeps charging them.~~ The mirror of the
  leak A1 closed:
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

- **D1-pricing. DECIDED 2026-07-31 by Constantin.** No agency SKU and no
  multi-account pricing structure. Multi-site is an ALLOWANCE inside the
  existing ladder, which is a better answer than a new tier: it gives Growth
  PRO the differentiator it has never had (today it is +0 prompts and +0
  engines over Growth for EUR 150 more).

  | plan | websites |
  |---|---|
  | free | 1 |
  | essentials | 2 |
  | growth | 2 |
  | growth_pro | **3** |
  | managed | 10 |
  | pro | 20 |
  | enterprise | to be decided |

  Each site keeps that plan's engine set and limits. **Cross-tier across SITES
  is explicitly allowed** and is a different thing from the cross-tier package
  stacking refused above: a Growth customer may run a second, smaller site on
  Essentials. Not a loophole, a real case.

  **DECIDED 2026-07-31: limits are SHARED across the allowance, not per site.**
  Protects the margin: per-site would have made Growth PRO 105 prompts and
  roughly triple the collection spend on the same EUR 449. Note the trap this
  avoids, because it was the default: `PLAN_MONTHLY_API_BUDGET_EUR` is per
  client in `_cost.js`, so "per client" would silently have become "per site"
  the moment D1 shipped, with nobody choosing it. Shared limits must therefore
  be enforced as an ACCOUNT-level sum, not by leaving the per-client budget in
  place, or the decision is decorative.

  **Consequence that must be resolved before this ships: the ladder inverts.**
  With shared limits and today's caps, prompts per site are essentials 7.5,
  growth 17.5, growth_pro 11.7, managed 12. **Growth PRO gives fewer prompts
  per site than Growth, for EUR 150 more**, so the upgrade makes each
  individual site worse and the D1-upsell nudge ("higher limits and more
  options") would be untrue as written. `PLAN_PROMPTS` has to rise for
  `growth_pro` at minimum, and probably for `managed`, so that both the total
  and the per-site figure improve as you climb. That is a pricing decision, not
  an implementation detail, and `plan_prompt_caps` in Postgres has to move with
  `planConfig.ts` or the trigger will refuse what the page promises.

- **D1-upsell. DECIDED 2026-07-31.** When a customer adds a site at a lower
  tier, show a nudge before they commit, of the form "Are you sure you want to
  add Essentials? Upgrading to Growth PRO gives you an extra website, higher
  limits and more included." A recommendation, never a block: the lower tier
  must remain choosable in one click, or it reads as a dark pattern rather than
  a helpful comparison. Copy belongs to `bg-copy`, not to whoever builds it.

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
  **CORRECTION 2026-07-31. The premise of this item was wrong and the ruling is
  already half-satisfied.** I wrote, and told Constantin, that the cap was
  enforced nowhere and that a Free client could create 500 prompts. False.
  Production carries `trg_enforce_prompt_cap BEFORE INSERT OR UPDATE ON
  public.prompts`, verified directly against `pg_trigger`, backed by a
  `plan_prompt_caps` table that matches `planConfig.ts:427` value for value. It
  counts per `client_id`, so it is already per-site and survives D1 unchanged.
  The error came from grepping the TypeScript for enforcement and concluding
  its absence there meant absence everywhere. **Enforcement in this product
  lives in Postgres as often as in JavaScript; grep the database too.**
  What is actually left, which is smaller and different:
  - `plan_prompt_caps` is a FIFTH copy of the plan ladder, in a place no
    TypeScript test can see. It matches today. Nothing keeps it matching.
    A drift check between it and `planConfig.ts` is the real work here.
  - The trigger refuses at the database. Nothing surfaces that refusal as a
    usable message, so a client at their cap likely sees a raw error. That is
    A6's job.
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

- **B1a. CLOSED by `14e0b26`, verified 2026-07-31.** `AuditReport.tsx:134` now
  reads `href="https://getbrandgeo.com"`, which is the landing-page answer the
  item asked for. The check passes. Listed as open here for a day longer than it
  was true; same stale-entry problem as Stream A above.
  ~~AuditReport's logo points at `/audit`~~, not at either home. Every
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

- **B4. Error monitor. AUTHORIZED 2026-07-31.** Split so the loop does the part
  it can and Constantin does only the part no agent can: wire `@sentry/react`
  into the dashboard behind `VITE_SENTRY_DSN`, inert when the var is absent, so
  the moment a DSN is pasted into Netlify it starts reporting and nothing
  changes until then. Creating the account is the human step (AUTONOMY §2:
  anything behind a login the agent does not hold). Do NOT commit a DSN; it goes
  in Netlify env only.
  Sample rate matters here: default to `tracesSampleRate: 0` and errors only, so
  this is an error monitor and not a performance bill.
  Scope: `brandgeo-dashboard/src/main.tsx`, `package.json`.
  `check: grep -q "VITE_SENTRY_DSN" brandgeo-dashboard/src/main.tsx`

- **B3. Verify the greeting clock.** The dashboard rendered "Good evening" at
  roughly 11:30 local on 2026-07-30. Either the greeting uses UTC while claiming
  local, or the observation was wrong. Confirm before fixing; do not assume.
  `check: grep -rq "getTimezoneOffset\|toLocaleTimeString" brandgeo-dashboard/src/pages/Dashboard.tsx`

---

## Stream C — the real customer journey

Scope: `brandgeo/web/`, `brandgeo-dashboard/src/pages/Signup.tsx`,
`Onboard.tsx`. Owner `landing-page-optimizer` then `bg-copy` then `bg-app`.
**day-only** from C2 onward: it is customer-facing copy and money.

- **C1. DONE 2026-07-31**, `docs/qa/acquisition-funnel-audit.md`, check passes.
  Findings C1a to C1c below are what it produced and they outrank the rest of
  this stream. Constantin's conclusion held; his label did not. The string "Book
  a call" does not exist anywhere in the repo. The results step's CTA is an email
  form. There is still no way to accept and proceed, and the real defect is worse
  than a wrong CTA, see C1a.
  `check: test -f docs/qa/acquisition-funnel-audit.md`

- **C1a. CRITICAL. The full report is built, deployed, working and unreachable,
  and the visitor is told to check an inbox that never receives anything.**
  Two defects, one fix ordering. `unlock-audit-report.js` sends no email: the
  five files that touch a mailer and the eight that touch a prospect audit are
  disjoint sets, verified. Meanwhile `site.js:298` promises "Check your inbox,
  the full AI Visibility report is on its way." The report itself is fine and
  live at `/audit/:token` (`App.tsx:106`), already unlocked at that moment, and
  the token is already in the unlock response (`unlock-audit-report.js:63`).
  **Fix the handover first, it is nearly one line, then decide about the email.**
  Sending the visitor to their report also makes honest interim copy trivial.
  Scope: `brandgeo/web/site.js`. **day-only**, customer-facing copy.
  `check: grep -q "app.getbrandgeo.com/audit/" brandgeo/web/site.js`

- **C1b. HIGH. The funnel is inverted: failing converts better than succeeding.**
  `redirectToSignup()` (`site.js:95`) is called from exactly one place,
  `site.js:387`, the **error** handler. A visitor whose audit fails is carried to
  `signup?domain=` prefilled in one hop. A visitor whose audit succeeds gets an
  email form and a dead end. Nobody chose this; it is what remains when the
  success path was never finished. Folds naturally into C2.
  Also `site.js:297` wipes the score card the visitor is looking at and replaces
  it with one sentence, so paying with an email makes their screen emptier.

- **C1c. MEDIUM. HubSpot has never received a lead, and records no reason.**
  The only `prospect_leads` row has `hubspot_synced = false`, no contact id, and
  no error text, which is indistinguishable from success at a glance. Same shape
  as the `job_runs.ok` finding already carried below. Needs someone who can read
  the Netlify env to say whether `HUBSPOT_API_KEY` is set at all; that is
  withheld from the loop.
  **Context for all three: zero real leads in 22 days.** 58 audits, 55 of them
  BrandGEO's own internal prospecting. Three members of the public have ever run
  one, and the single lead row is BrandGEO auditing its own domain.

- **C1b. DONE 2026-07-31**, shipped with C2 below. The success path now offers
  the forward step the error path always had. It sits on the RESULT card, beside
  the report CTA, and not inside the unlock-success block, because that block
  navigates to the report after 900ms and anything rendered next to it is gone
  before it can be read.

- **C1c. DONE 2026-07-31**, in the half that was code. `HUBSPOT_API_KEY` is NOT
  set on the dashboard site (Constantin confirmed, 2026-07-31), so the answer to
  "unset key or failed push" is the first. A failed push now records its reason
  on the `prospect_leads` row (`hubspot_error`), which is the part the audit
  called "itself the defect": a silent `false` was indistinguishable from
  success. `_hubspot.js` had always returned that reason and
  `unlock-audit-report.js` discarded it.
  **Still needs Constantin:** set `HUBSPOT_API_KEY` in Netlify. Until then every
  new lead records `not_configured`, which is now visible instead of silent.

- **C2. DONE 2026-07-31.** Accept-and-continue, and the domain survives the whole
  way. `?domain=` was a URL site.js had been building since the error path was
  written and that nothing read: `/signup` never looked at the query string, and
  `/welcome` prefilled the company field from the user's EMAIL domain only, so a
  gmail user who audited acme.com arrived at company setup with an empty field.
  Four hops now carry it: widget result card, full report page, `/signup`
  (which stores it through the email round trip), `/welcome` (which prefers it
  over the email heuristic and clears it once used). The company-details step
  itself already existed at `/welcome`; it was not reachable with any context.
  `check: bash scripts/check-funnel-accept-path.sh` -> exit 0
  ```
  OK: the audit success path, the full report, /signup and /welcome all carry
  the visitor forward with their domain
  ```

> **UPDATE, later on 2026-07-31: the links WERE rotated.** Constantin authorized
> it. Six new payment links now exist against the same prices (no price, amount,
> currency or metadata.plan changed), the new URLs are in `STRIPE_CHECKOUT_LINKS`
> on Netlify, and `_terms_gate.js` reads them from there with no fallback.
> **Two things are still owed and they are sequenced:** `ff7cae3` had not
> deployed 15 minutes after the push (Netlify still on `31f8dc0`), so the live
> gate still issues the OLD links, and **the old links must NOT be deactivated
> until that deploy lands** or every buyer hits a dead page. Procedure, the
> verification command, and the cleanup: `docs/qa/s3-e2e-payment-test-2026-07-31.md`.
> Until the old links are deactivated the exposure is still open, because they
> remain payable and are still in git history.

- **C3. PARTLY DONE 2026-07-31, and the remaining half is Constantin's.**
  Read the caveat at the end of this item before recording it as closed.
  **The gate works on the ROUTE, not on the DESTINATION.** `bg-verify` found this
  and it is right: these are Stripe **Payment Links**, permanent and reusable, so
  possession of the string is enough to pay. They were moved out of the docroot
  into `_terms_gate.js`, which is **in the same public repository**, and they are
  also in four committed docs and permanently in git history. So a visitor who
  reads the source can still pay without ever seeing the contract.
  **What closes it: rotate the six links, and keep the replacements out of the
  repo (env vars).** `scripts/stripe-retire-catalogue.js` exists for the rotation.
  Until then, C3 is enforcement by DETECTION: `stripe-webhook.js` matches
  `client_reference_id` against `terms_acceptances` and raises a
  `checkout_without_acceptance` admin event when a payment did not come through
  the gate. It never withholds provisioning, because the money is already
  captured and refusing a paying customer is the worse failure.
  Everything below is true and shipped; it is simply not the whole of C3.
  **The detection has NEVER FIRED.** `terms_acceptances` is empty, no Stripe
  event has arrived since it was built, and `checkout_without_acceptance` reads
  like a working alarm without ever having been one. **After the first real
  subscription, check exactly this:** one `terms_acceptances` row with
  `matched_at`, `stripe_session_id` and `matched_email` set, and NO
  `checkout_without_acceptance` beside it. That single observation validates four
  hops that have so far only been reasoned about, including whether
  `client_reference_id` survives a Payment Link on this account at all, which is
  unverified. If it does not, every legitimate purchase raises the alert and the
  alert becomes noise.
  ```sql
  select reference, plan, period, matched_at, stripe_session_id from terms_acceptances order by created_at desc limit 5;
  select type, title, created_at from admin_notifications where type = 'checkout_without_acceptance' order by created_at desc;
  ```
  Two reviews: `docs/qa/s3-acquisition-funnel-contract-gate.md` (FAIL) and
  `docs/qa/s3-acquisition-funnel-rereview.md` (PASS WITH FINDINGS).
  **S3 should not close while the free tier cannot finish its own first
  collection** (see NEEDS CONSTANTIN: 5 prompts at EUR 0.108 against a EUR 0.30
  budget, blocked after prompt 3). C2 now sends people to free signup by design,
  so that budget defect is this funnel's destination. It is S1/S2's decision to
  make, not this stream's.
  The six Stripe payment links have been REMOVED from `brandgeo/web/site.js`,
  where a `STRIPE_LINKS` map had been writing them onto every Subscribe button
  on load. That is what makes this not decorative: while the destination was in
  the page it was reachable from view-source, from a bookmark, and with
  JavaScript off, so no client-side gate in front of it could have been more
  than a suggestion.
  The links now live in `netlify/functions/_terms_gate.js` and are issued one at
  a time by `accept-terms.js`, which records a `terms_acceptances` row before it
  answers and returns no URL if it cannot. The tick box is a courtesy; the gate
  is that the browser does not know where Stripe is.
  The acceptance `reference` rides to Stripe as `client_reference_id`, so the
  contract and the money can be matched afterwards from either side.
  Migration applied to production 2026-07-31 and verified, BEFORE the deploy, per
  the sequencing lesson in `docs/arch/scheduled-function-auth.md` §8.
  **No commercial terms were invented.** The gate links the existing
  `terms.html` and records its effective date, `2026-07-13`, as the version.
  `check: bash scripts/check-contract-gate.sh` -> exit 0
  ```
  OK: no checkout URL is served to the browser, and the server refuses to issue
  one without a recorded acceptance of 2026-07-13
  ```
  **Deliberately NOT done, and worth a decision:** `stripe-webhook.js` does not
  yet read `client_reference_id`, so provisioning does not verify an acceptance
  exists. That was left alone on purpose: refusing to provision a customer whose
  money has already been captured is a worse failure than the one it prevents,
  and changing the provisioning path is its own reviewed change.

---

## Carried over, still open

Full context for each is in `CLAUDE.md`. Listed here so the loop can see them.

- ~~Growth PRO's ladder is thin: EUR 449 vs EUR 299 buys +25 prompts and a faster
  refresh, identical engines.~~ **DECIDED 2026-07-31,
  `docs/strategy/sprint-ladder-ruling.md` decision 2. Growth PRO goes 35 -> 56
  prompts**, which is 18.67 per site against Growth's 17.50, so the upgrade
  improves each individual site instead of diluting it. Ships with S2.
- ~~Three conflicting Growth prompt counts: 35 shipped, 50 in a planConfig
  comment, 75 in the pricing doc.~~ **DECIDED 2026-07-31, same doc. Growth holds
  at 35 and the DOCS are the outlier, not the code**, which reverses the
  handover's reading of this item. The documented `5, 20, 50, 75, 250` was costed
  when ChatGPT billed EUR 0.056 a check and the top tier had 6 engines; at
  today's metered prices it breaches the 15 percent ceiling by EUR 5.63 on Growth
  PRO and EUR 18.25 on Managed. Growth at 50 would additionally force Growth PRO
  to 76 prompts to keep per site monotonic, and 76 costs EUR 73.95 against a EUR
  67.35 ceiling. **S2 must delete the stale comment block at
  `planConfig.ts:400-420` in the same commit**, or a sixth conflicting ladder
  survives in the file that is meant to be the source of truth.
- `job_runs.ok` is true whenever a submitter was merely configured, even if
  every submission failed. Undercuts the observability work packet 012 built.
- Two packets share id `006`.
- Retire the dashboard SupportWidget code entirely, and flip `JAMIE_RETIRED`
  in `brandgeo/web/site.js`. Both blocked on the askmywebsiteai publish above.

---

## Done

Items land here only with a passing check command and the date it passed.

- **Dashboard UI/UX audit fixes shipped.** Passed 2026-07-31, `46b92fc`. Nine
  source files had been sitting uncommitted on disk since 2026-07-30, so
  production served none of them. **Third instance in three days of the same
  failure: work that exists and never reaches production.** Found by running
  `git status` while reporting queue state, not by any check, because no check
  covered it.
  What shipped: one value, slate-500 `rgb(100 116 139)`, was causing 55 of the
  56 light-mode contrast failures across all 11 routes; light-mode hover was
  dead by specificity on 131 measured elements including both destructive-delete
  cues; touch targets raised to WCAG 2.2 SC 2.5.8 behind a coarse-pointer query
  rather than a width breakpoint; and empty states now name what is absent
  instead of rendering a bare em dash, one of which measured 1.72:1 and was the
  last dark-mode contrast failure in the app.
  ```
  npx tsc --noEmit   exit 0
  npm run build      exit 0, 2799 modules, built in 6.86s
  ```
  Evidence committed alongside: `docs/qa/dashboard-uiux-audit-2026-07-30.md`
  and `docs/qa/dashboard-fix-brief-2026-07-30.md`.

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
