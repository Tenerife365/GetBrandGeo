---
id: 023
from: bg-orchestrator
to: gtm-lead (owner), with gtm-demand, gtm-analyst, gtm-cro, gtm-email, gtm-linkedin, gtm-verify, gtm-conversion, bg-backend, bg-web, bg-app, bg-verify
status: READY
created: 2026-09-08
scope_write: docs/growth/deals/**, docs/growth/sprint17/**, docs/growth/qa/**, docs/growth/outbound/**, brandgeo/web/index.html, brandgeo/web/site.js, brandgeo-dashboard/netlify/functions/_terms_gate.js, brandgeo-dashboard/netlify/functions/accept-terms.js, brandgeo-dashboard/netlify/functions/promotions-admin.js, brandgeo-dashboard/netlify/functions/stripe-webhook.js, brandgeo-dashboard/src/pages/Account.tsx, brandgeo-dashboard/tests/**, docs/qa/**, docs/arch/**
scope_read: everything, plus live Stripe in READ mode only and Supabase SELECT only
model: gtm seats Opus at medium effort; bg-web and bg-app Sonnet at medium; bg-backend Opus (billing); every verifier Opus at high
---

## How to run this packet

Paste into a fresh session, one stage at a time, two seats at a time (the
32 GB machine rule), no builds and no browsers inside agents:

```
Read .claude/handoffs/023-bg-orchestrator-to-gtm-lead-deals-and-affiliates-30-day-campaign.md and run stage A now.
```

Then `run stage B`, `run stage C1`, and so on. Each stage names its seats,
its one output file, and its verifier. A stage is not done until its
verifier has written its file. Nothing is fired by an agent, ever.

## Decision

Constantin, 2026-09-08. Organic acquisition to date is three free signups,
his own network excluded, so the product launches earlier by paying in
discount rather than in time. A 30 day campaign across the top 50 deal,
coupon, affiliate and launch venues, one discount code per venue, 50% off
the monthly plan for the first three months, first code `UNEED50` for the
Uneed deal already being submitted by hand. Agents research, rank, draft,
build and verify. Constantin alone submits, posts, pays and creates codes.

## The offer, fixed so it is not re-argued per venue

| Item | Value |
|---|---|
| Discount | 50% off, first 3 months, monthly plans only |
| Plans | Radar, Essentials, Growth, Growth PRO monthly links |
| Annual plans | excluded by design: the annual checkout links do not accept promotion codes and stay that way |
| Who | first purchase only (`restrictions.first_time_transaction`) |
| Cap | 100 redemptions per code, raise by hand if a venue earns it |
| Expiry | none on the code; the campaign ends 2026-10-08, the code is switched off by hand after the last venue's traffic tails off |
| Attribution | one Stripe promotion code per venue, all on the one coupon `UNEED50` renamed in the Dashboard to "Deals 2026-09" if Constantin prefers; redemptions per code are the venue's score |
| Affiliates | the partner program ruled 2026-08-02 (coupon `XKfymWe7`, 20% recurring for 12 months, capped at Growth) is reused as is. No new affiliate terms are invented here |

Stripe facts measured 2026-09-08 in live mode: coupons `XKfymWe7` (partner
free month) and `0I4TP6fs` (bonus months) exist, no other coupon and no
promotion code exists yet; the Radar, Essentials and Growth monthly payment
links already accept promotion codes, the Growth PRO monthly link and all
four annual links do not.

## Stage A. Venue universe, ranked to 50 (gtm-demand with gtm-analyst, then gtm-verify)

Output: `docs/growth/deals/venues-2026-09-08.md`, one file.

1. Build the long list from these families, at least 80 candidates before
   ranking: SaaS launch and deal directories (Uneed deals, SaaSHub deals,
   Product Hunt, Fazier, DevHunt, BetaList, Indie Hackers, AlternativeTo,
   G2 deals, Capterra and GetApp, SaaSworthy, Startup Stash, TinyLaunch,
   LaunchingNext, Peerlist, SideProjectors, Dealify, PitchGround, SaaS
   Mantra, StackSocial), coupon aggregators that list B2B software, affiliate
   networks a two person SaaS can list on within a week (PartnerStack,
   Rewardful, Tolt, FirstPromoter, Impact, ShareASale, PostAffiliatePro),
   marketing and SEO newsletters that run sponsored deal slots, and the GetReach
   editorial marketplace (its MCP is connected; use it in read mode to price
   placements, never to order).
2. For every candidate record from the live page, not from memory: exact
   submission URL, the form fields (the Uneed form has "deal description" and
   "discount code", record every venue's equivalent), cost, approval lag,
   whether a code or a link is required, whether they require exclusivity or
   a lifetime deal, and estimated monthly visitors with the source named.
3. Score each on fit (B2B SaaS buyers, marketing and founders), cost, traffic,
   effort in minutes for Constantin, approval lag. Rank. Cut to 50. Mark the
   free and fast ones as wave 1.
4. gtm-verify re-checks every wave 1 row live: URL resolves, form exists,
   cost is what the row says. A row that fails is dropped, not corrected.
5. Recommend OUT, with the arithmetic: lifetime deal marketplaces (AppSumo
   style, 70/30 revenue share on a one time price) unless Constantin rules
   them in. A lifetime price on a metered product with EUR 0.06 per engine
   check is a liability, not a channel.

The existing packs in `docs/growth/launch-directories/` (alternativeto,
devhunt, fazier, g2, gbp, indie-hackers, linkedin-company-page,
product-hunt, saashub, uneed) are inputs. Do not rewrite them; link to them
and add only the deal specific fields.

## Stage B. Codes, copy and fire cards (gtm-cro rules, gtm-conversion and gtm-email draft, gtm-verify gates)

Output: `docs/growth/deals/fire-cards-2026-09-xx.md`, one card per venue,
under 10 minutes each, paste ready, in the order of stage A.

Each card carries: the venue, the exact click path, the deal description in
the founder voice (what BrandGEO measures, the 50% for 3 months, no AI
tells, no em or en dash, no invented numbers), the promotion code for that
venue (`UNEED50`, `PH50`, `SAASHUB50`, `FAZIER50`, `DEVHUNT50`, and so on,
uppercase, venue plus 50), the landing URL
`https://getbrandgeo.com/?promo=<CODE>#free-audit` (built in stage C2), the
Stripe command Constantin runs to create that venue's code, and the
verification the venue gives after approval (a deal page URL).

The Stripe command per code, run by Constantin from
`C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard`, Stripe
CLI 1.44, live mode. Writes to live Stripe are blocked for agents by the
permission classifier and belong to him alone:

```bash
stripe promotion_codes create --live -d coupon=UNEED50 -d code=<CODE> -d max_redemptions=100 -d "restrictions[first_time_transaction]=true" -d "metadata[channel]=<venue>" -d "metadata[program]=deals-2026-09"
```

gtm-cro also rules the sequence for the affiliate family: who is contacted
first, what each touch carries, when to stop; gtm-email and gtm-linkedin
draft under it, in the same format as the 2026-09-03 follow-up pack, and
those drafts are git ignored because they name people. The deal cards name
no person and are committed.

## Stage C. Product, so a code entered by a visitor is honoured and attributed

### C1. Checkout accepts codes on every monthly plan (Constantin, then gtm-verify)

One command, his to run, since it changes a live checkout:

```bash
stripe payment_links update plink_1TzvvK63lspobjfOp4kSb2Ab --live -d allow_promotion_codes=true
```

gtm-verify opens each of the four monthly links unauthenticated and records
that the "Add promotion code" field renders, and that each annual link does
not. Evidence is a screenshot path or the rendered text, never a claim.

### C2. The promo deep link (bg-web for the site, bg-backend for the gate, bg-verify)

Owner bg-web: `brandgeo/web/index.html` and `brandgeo/web/site.js` read
`promo` from the query string, keep it in `sessionStorage` under one key,
and render one banner above the pricing cards: "Code <CODE> applies at
checkout: 50% off for 3 months on any monthly plan." Nothing else on the
page changes. No inline script (the CSP refuses it silently); the change
goes in `site.js`. `site.js` is dirty from another session: coordinate the
commit by pathspec and never sweep that session's hunks.

Owner bg-backend: `accept-terms.js` accepts an optional `promo` string (A to
Z and 0 to 9, 3 to 20 characters, anything else rejected with 400, never
echoed), and `_terms_gate.js` appends `?prefilled_promo_code=<CODE>` to the
payment link it returns. Stripe Payment Links read that parameter natively,
so no Stripe API call is added. The `terms_acceptances` row records the code
in a new nullable column only if bg-architect rules the column in; otherwise
it goes into the existing JSON detail the row already carries. Cost per
checkout is unchanged.

bg-verify: a wrong code is rejected before it reaches Stripe; a right code
survives the round trip; the annual links still receive no parameter.

### C3. Promotions become real (bg-backend on Opus, bg-verify, billing rules apply)

The `promotions` table and `promotions-admin.js` exist since 2026-07-26 and
price nothing, by design. Close that: the `create` action also creates the
Stripe coupon and promotion code with the same values, stores the two Stripe
ids on the row, and `toggle` deactivates the Stripe promotion code. The
`stripe-webhook.js` `checkout.session.completed` handler reads the applied
promotion code from the session's discounts and writes it into the
`client_events` row it already creates, so every deal signup is attributable
in the Revenue page without a new table. No new SECURITY DEFINER function,
no RLS change, no new schema without bg-architect. Tests for the mapping and
the validation, run from `brandgeo-dashboard/` with `node tests/<file>`.

C3 ships after C1 and C2 have been verified, in one Netlify build with them,
under `BATCH_PUSH=1`. The budget is two builds a day, platform wide.

### C4. Scoreboard (gtm-analyst, daily, one file)

`docs/growth/measurement/deals-scoreboard-2026-09.md`: per code, Stripe
`times_redeemed` (read mode), free signups from `prospect_leads` and
`clients` by day (SELECT only), visitors on `/?promo=` from GA4 if the
consent gated instrument shows them, and the venue's live status from
gtm-verify. The number that matters is paid conversions per venue; the
number that is reported honestly is "unknown" wherever the instrument
cannot see.

## Stage D. The 30 day calendar (gtm-lead, one file, fire or drop)

`docs/growth/sprint17/deals-calendar-2026-09-08.md`. Days 1 to 3: C1 and C2
live, the first five codes created, Uneed live. Days 2 to 12: wave 1, five
venues a day, all free and fast. Days 8 to 20: affiliate networks listed and
the CRO sequence firing. Days 15 to 30: paid placements only against the
ruling in the open questions. Every day has a fire list and every item on it
either fires or is dropped with a reason in the loop log. Batch 02 outbound
and the follow up waves from 2026-09-03 keep their own days; the two do not
share a send day.

## Do not

- Submit, post, create an account, pay, order a placement, message anyone,
  create or change anything in Stripe. Constantin does every last mile.
- Query Hunter, Apollo, RocketReach, Clearbit or Snov, or cite them.
- Call any LLM API or trigger a collection or an audit.
- Invent a visitor count, an approval time or a price. Unknown is written as
  unknown.
- Put a real person's name, address or profile into a committed file. Venue
  names and URLs are fine. Outreach drafts go under the git ignored
  `docs/growth/outbound/`.
- Use an em or en dash anywhere, in code or in copy.
- Touch `Revenue.tsx`, `_revenue.js`, `revenue-report.js`,
  `unlock-audit-report.js`, `db/*.sql` beyond a new file, or any other
  session's dirty hunks. Commit by pathspec.
- Run `npm run build` or open a browser inside an agent.

## Acceptance criteria

- [ ] Stage A file exists with 50 ranked venues, every row carrying a live
      submission URL that gtm-verify confirmed, and the lifetime deal
      recommendation with its arithmetic.
- [ ] Stage B fire cards exist for all wave 1 venues, each under 10 minutes,
      each with its own code, and none naming a person.
- [ ] C1: all four monthly links render the promotion code field, no annual
      link does, with evidence recorded by gtm-verify.
- [ ] C2: `getbrandgeo.com/?promo=UNEED50` shows the banner, the checkout
      link returned by `accept-terms` carries `prefilled_promo_code=UNEED50`,
      an invalid code returns 400, verified against the live site after the
      build.
- [ ] C3: creating a promotion in the admin panel creates the Stripe coupon
      and code, and a test checkout with a code writes the code into
      `client_events`; bg-verify's review file exists with a verdict.
- [ ] The scoreboard file exists and is updated daily from the day the first
      venue is live.
- [ ] Every commit is pathspec limited and dash free, proven with a positive
      control.

## Open questions for Constantin

1. Budget for paid placements in days 15 to 30 (GetReach editorial
   placements, sponsored newsletter slots). Without a number, stage D leaves
   those days as research only.
2. Lifetime deal marketplaces: the recommendation is OUT. A ruling of IN
   needs a separate price, because 50% for 3 months does not translate to a
   one time payment.
3. Whether the deal codes should expire on a date rather than be switched
   off by hand after the campaign. Expiry is safer; a dead code on a live
   deal page costs trust, which is why the default here is no expiry and a
   hand switch.
4. Whether the coupon id `UNEED50` should be created under a venue neutral
   id (`DEALS50`) before the other codes hang off it. It cannot be renamed
   once created, and the first code has to exist today for the Uneed form.
