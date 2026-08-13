# Positioning and pricing audit, 2026-08-13

Seat: `bg-strategy`. Scope: Pillar 1 (positioning and value proposition) and
Pillar 3 (pricing and monetization), for BrandGEO **as sold today**.
Read-only audit. No code, no copy, no Stripe, no deploy.

Every claim below is tagged **MEASURED** (with the URL, file:line, or SQL it came
from) or **INFERRED**. Prior claims in `CLAUDE.md` and in `docs/` were re-checked
against HEAD and against production rather than inherited; where a prior claim was
wrong it is named as refuted.

Evidence timestamps: live pages fetched 2026-08-13; database read 2026-08-13
(project `duiyifepitvugyulobqm`, SELECT only); competitor pages fetched
2026-08-13, first-party.

---

## 0. Calibration

1. **Plan tiers and code identifiers.** `brandgeo-dashboard/src/lib/planConfig.ts:46`
   defines `Plan = 'free' | 'radar' | 'essentials' | 'growth' | 'growth_pro' |
   'managed' | 'pro' | 'enterprise'`. **Prices are not in `planConfig.ts`**; that
   file carries entitlements and a 15 percent of price budget
   (`PLAN_MONTHLY_API_BUDGET_EUR`, `:370`). The prices are published on the
   marketing page and its JSON-LD: EUR 0, 29 (list 39), 99, 299, 449, 1,500,
   custom (`brandgeo/web/index.html:1983`, `:2002`, `:2023`, `:2050`, `:2072`,
   `:2100`, `:2122`). MEASURED.
2. **Pillar gating per that file.** AI Visibility: every tier, engine count rises
   with the rung (`PLAN_ENGINES:68-101`). Brand Sentiment: not a gated feature at
   all, it is a reading of collected rows, so it exists wherever collection does.
   AI SEO: `FEATURE_MIN_PLAN.ai_seo = 'radar'` (`:444`), with depth by
   `PLAN_SEO_PAGE_CAP` 0 / 1 / 1 / 10 / 30 (`:690`) and drafts only from Growth
   (`:706`). **AI Social: no plan grants it.** `ADMIN_ONLY_FEATURES` holds
   `ai_social` (`:426`) and `hasFeature()` short circuits on that set before the
   ladder is read, so the `growth: 1 / growth_pro: 3` channel limits at `:712` are
   unreachable by any customer. MEASURED.
3. **`docs/PRICING-SPEC.md` versus the enforced ladder. They do not match, and
   this is a finding, not a calibration failure.** That file is headed "DRAFT for
   Constantin's approval. Nothing is implemented yet" (`:4`) and its §6 ladder
   reads `Free EUR 0 -> Essentials EUR 99 -> Growth EUR 299 -> Managed EUR 900 ->
   Pro EUR 1,500 -> Enterprise (from ~EUR 10,000)` (`:206`). Differences against
   shipped: no Radar tier, no Growth PRO tier, Managed at EUR 900 rather than
   EUR 1,500, Free on ChatGPT rather than Gemini (`:20`), Essentials 30 prompts
   rather than 18 and Growth 150 rather than 35 (`:21`, `:22`). The file is stale
   on every axis. `docs/PRICING-STRATEGY-2026-07.md` and
   `docs/strategy/sprint-ladder-ruling.md` are the live ones. MEASURED.
4. **Dashboard pages a free-tier user can reach.** `brandgeo-dashboard/src/App.tsx`
   applies **no plan gate at the route level**. Every authenticated user reaches
   `/`, `/mentions`, `/competitors`, `/prompts`, `/ai-visibility`, `/sentiment`,
   `/recommendations`, `/onboard`, `/social`, `/seo`, `/usage`, `/account`,
   `/tickets` (`:107` to `:122`). Gating happens inside the page via
   `hasFeature()`, so a free user reaches `/seo` and `/social` and is shown a
   locked screen rather than being redirected. MEASURED.
5. **The single hero claim, verbatim** (`brandgeo/web/index.html:1507`, live and
   byte identical to HEAD, md5 `565fecdd8397a751945cf7cce121cafe`):
   > Are AI models recommending *your brand*, or your competitors?

**CALIBRATED.** Answer 3 disagrees with answer 1 and is recorded as finding F11.

---

## TL;DR, the three sentences

1. **The offer is not being rejected, it is not being seen: the entire lifetime
   demand on the primary CTA is 63 instant audits, 54 of them on one day
   (2026-07-16), 7 in the last three weeks, and zero in the five days to
   2026-08-13**, so nothing on this page currently has a measurable conversion
   rate and any claim that "pricing is the problem" is untestable at this volume.
2. **Where the offer itself is weak, it is weak in one specific place: the free
   experience never shows a buyer the thing that would scare them.** The public
   audit runs Gemini and Perplexity only and returns a score plus a gap *count*,
   while the competitor names and the per-engine breakdown sit behind an email
   gate that 6 of the last 7 audits did not pass, and ChatGPT, the engine every
   buyer means when they say "AI", is first sold at EUR 99.
3. **The page is selling the wrong motion to the wrong buyer at a price point the
   market already owns**: `docs/GTM-STRATEGY.md` §4.2b ruled on 2026-07-18 that
   the primary buyer is a done-for-you SMB and that self-serve is the second
   motion "not the urgent one", yet the homepage opens in "Run it yourself from
   EUR 0", the page written for the ruled primary buyer
   (`get-found-online.html`, live) is linked zero times from it, and Radar at
   EUR 29 lands on Otterly's published $29 tier while delivering 7 prompts
   against their 15, 2 engines against their 4, and weekly against their daily.

---

## Pillar 1: positioning and value proposition

### Q1. Target audience clarity

**VERDICT: FAIL. No ICP is named anywhere in the visible copy, and the one page
that does name one is orphaned.**

MEASURED, word counts over the served `index.html` (136,069 bytes, HTTP 200,
2026-08-13): `agency` 0, `agencies` 0, `marketer` 0, `marketers` 0, `SMB` 0,
`small business` 0, `in-house` 0, `CMO` 0, `B2B` 0, `local business` 0,
`ecommerce` 0. `SaaS` 1 and `e-commerce` 1, both of which are `<option>` values
inside the contact form's industry dropdown (`:2238`, `:2243`), not positioning.
`founder` 12, every one of them inside an HTML comment or the `Person` JSON-LD
`jobTitle`, none in visible copy.

The page addresses "you" and "your brand" throughout and never says who "you" is.
A visitor cannot self-identify, which means the page cannot disqualify anyone
either, which is the same defect from the other side.

MEASURED: `docs/GTM-STRATEGY.md:246-253` does define a primary ICP, and
`:271-293` refines it on 2026-07-18 to "small/local businesses that do not
understand SEO at all, often with inaccurate or outdated public information and
old or missing websites", explicitly because "only the managed model can serve
them" and "the audit hits harder here". §4.3 (`:318-326`) puts self-serve
marketing teams and agencies as the **secondary** ICP, "the *second* motion, not
the urgent one".

MEASURED: the own-funnel page that ruling commissioned,
`https://getbrandgeo.com/get-found-online.html`, is live (HTTP 200) with the h1
"If customers and AI can't find your business, we fix it: all of it, done for
you". `grep -c "get-found-online" brandgeo/web/index.html` returns **0**. The
homepage nav offers How it works, Pricing, Research, FAQ, Get started
(`:1470-1483`) and nothing else.

So the ICP is decided, written down, and given its own landing page, and the
front door does not point at it. INFERRED: a visitor arriving from any generic
channel is routed into the self-serve motion regardless of which buyer they are.

### Q2. Value versus feature focus

**VERDICT: MIXED, leaning feature. The primary message states a measurable
*metric*, not a measurable *outcome*.**

MEASURED, the hero promises measurement and speed: h1 `:1507`, sub "See what the
top AI engines tell your customers when they ask about your category. Type your
domain and get a scored answer in under a minute." (`:1509`), trust row "Free
audit / Results in under a minute / No credit card required" (`:1516-1520`).

MEASURED, the outcome vocabulary is absent from the entire page: `revenue` 0,
`leads` 0, `traffic` 0, `ROI` 0, `share of voice` 0, `market share` 0, `lost` 0,
`invisible` 0. Present: `customers` 10, `competitor` 10.

This is the honest read: BrandGEO's primary message is "we will measure a thing
about you accurately and fast". That is a **measurement** promise, which is a
category promise, not a value promise. The gap between "your mention rate is
70.8 percent" and "you will get more customers" is never closed in words on this
page, and Q8 shows it is never closed in numbers either.

**Confirmed as a strength, against my own expectation.** The four-pillars trap
that `docs/AGENT-OS.md` warns about is **not** sprung here. Section 06 frames the
pillars as a chain, "A gap becomes a brief. A brief gets published", with the
lead "One place instead of three tools" (`:1861`). One value proposition, three
supporting mechanisms, correctly subordinated per `hook-thesis-web.md` §2. The
fourth pillar, AI Social, is labelled "Coming soon" inside that chain, which
matches `ADMIN_ONLY_FEATURES` in code. The page does not oversell it.

### Q3. Differentiation

**VERDICT: FAIL at the entry tier, PASS at the EUR 299 tier, and the one
quantified comparison on the page is the only comparison BrandGEO wins.**

MEASURED, `index.html:2151-2158` carries an "Entry price per engine" block:
BrandGEO Essentials EUR 99 / 3 engines against Profound entry USD 99 / 1 engine,
checked 2026-08-07. That claim is true and first-party sourced.

It is also unrepresentative. Against the two competitors closest to BrandGEO's
own price points, the same metric inverts:

- Peec Starter is **EUR 85/mo with 50 prompts, 3 models of the buyer's choice,
  daily tracking**. BrandGEO Essentials is EUR 99 with 18 prompts, 3 fixed
  engines, weekly. Peec is cheaper, carries 2.8x the prompts, lets the buyer pick
  the models, and refreshes 7x more often.
- Otterly Lite is **$29/mo with 15 prompts and 4 engines including ChatGPT,
  daily**. BrandGEO Radar is EUR 29 with 7 prompts, 2 engines without ChatGPT,
  weekly.

INFERRED: a buyer who checks one competitor may find BrandGEO's block persuasive;
a buyer who checks two finds the opposite, and finds it on the vendor's own
chosen axis. The block is defensible as a fact and indefensible as a
representation, which is the worst of both.

**The differentiation table** (competitor rows MEASURED first-party 2026-08-13;
BrandGEO column MEASURED from `index.html` and `planConfig.ts`):

| Competitor | Headline promise | Proof at the fold | Entry price | What BrandGEO says against it |
|---|---|---|---|---|
| **Otterly** | "We otter know where your brand shows up on AI Search" | "40,000+ Marketing Pros", G2 4.8, Gartner Cool Vendor | **$29/mo Lite**, 15 prompts, 4 engines incl. ChatGPT, daily | **Nothing.** Radar is EUR 29 for 7 prompts, 2 engines without ChatGPT, weekly. The page never names Otterly and could not win the comparison if it did. |
| **Peec AI** | "AI search analytics for marketing teams" | "3000+ brands and agencies", G2 4.9 | **EUR 85/mo Starter** (EUR 70 annual), 50 prompts, 3 models of choice, daily | **Nothing.** Essentials is EUR 99 for 18 prompts, weekly, fixed engines. Peec also names its buyer in the headline; BrandGEO names none. |
| **Profound** | "Marketing agents to win in [engine]" | Demo-led, "Get a Demo" 3x above the fold | **$99/mo Starter** billed yearly, **ChatGPT only**, 50 prompts | The only comparison the page makes (`:2155`), and it is fair: 3 engines against 1 at the same nominal number. BrandGEO also has a self-serve path where Profound is demo-gated. |
| **AthenaHQ** | "Become the Brand AI Trusts" | Coinbase, SoFi, Hearst, YC / Forbes / WSJ, three G2 badges | **$295/mo Starter** ($245 annual), 9 models, and a **genuine free tier** (300 credits, 5 engines) | Nothing on price, and it does not need to: BrandGEO is 3x cheaper at Growth. But AthenaHQ runs **the same free-audit hook from a far stronger proof position**, and its free tier shows 5 engines where BrandGEO's shows 1. |

MEASURED, market shape from the same fetch: a crowded $29 to $99 self-serve band
(Otterly, Writesonic $79 annual, Peec, Profound), a thin $150 to $250 band, and a
$250 plus proof-heavy band (AthenaHQ, Scrunch $250 to $300). Ahrefs Brand Radar
from EUR 179 standalone and Semrush bundling AI visibility from about $117 annual
are the incumbents squeezing from above.

**What BrandGEO actually has that none of them do**, MEASURED: an instant public
audit with no signup that returns a score in under a minute
(`audit-domain.js`, hero `:1497-1521`), a citable DOI methodology
(`:1697`, Zenodo 10.5281/zenodo.21395598), 34 research articles and 27 measured
cities (`:1699-1700`), a done-for-you tier the US self-serve tools structurally
cannot serve (`GTM-STRATEGY.md:256-258`), and multi-language and geo-context
collection. **None of these four appear above the fold as a differentiator.** The
fold sells a score, which is the one thing every competitor also sells.

### Q4. Problem urgency, painkiller or vitamin

**VERDICT: VITAMIN as merchandised, PAINKILLER available and withheld.**

The painkiller exists in the product. `get-audit-report.js:63-79` shows the full
report carries `engine_results` (was I mentioned, engine by engine),
`competitor_flags` (who was named instead of me) and `top_gaps`.

MEASURED, `get-audit-report.js:45-61`: before an email is given, the response is
exactly `{ status, unlocked:false, domain, category, ai_score, low_confidence,
gap_count }`. Nothing else. The rendered card (`site.js:244-313`) therefore shows
a ring, "You're at N/100 AI Visibility", the domain, and a line that says how many
gaps exist without naming one: "N gaps are holding this score down. The full
report names them." (`site.js:239`).

So the free taste is a **score and a count**. A score is an abstraction a first
time visitor has no baseline for. The visceral fact, "when someone asks ChatGPT
for a company like yours it names these three and not you", is generated, stored,
and withheld.

MEASURED, what that costs, from production: of the 7 instant audits run since
2026-07-20, **1 was unlocked with an email and 6 were not**. Lifetime
`prospect_leads` is **2 rows**. Six of seven visitors who asked the product its
one question left with a number and no reason to feel anything.

Two further urgency leaks, both MEASURED:

- The page never says a deadline or a consequence. The Radar launch price is
  scoped to "our first 100 customers", and the launch announcement states the
  price "applies to the first 100 subscribers and **is not time-limited**"
  (`/news/radar-plan-launch/`). Deliberate, per `sprint-ladder-ruling.md`
  decision 1, and it removes the only scarcity mechanic on the page.
- Under the pricing table the escape hatch for an undecided visitor is "Get my
  free AI Visibility Snapshot" pointing at `#contact` (`:2160-2163`), which is
  the **48 hour** manual form. The FAQ confirms the deeper free audit "lands
  within 48 hours" (`:2171-2210`). So the strongest free experience on the site
  is form-gated and two days slow, while the instant one is the weakest. That
  inversion is the opposite of a painkiller.

### Q5. Value metric alignment

**VERDICT: ARBITRARY from the buyer's side, and correct from the cost side. The
meter is the vendor's cost driver, not the buyer's value driver.**

MEASURED: every metered dimension in `planConfig.ts` is a supply-side unit.
`PLAN_PROMPTS` (`:541`), `PLAN_ENGINES` (`:68`), `PLAN_SEO_PAGE_CAP` (`:690`),
`PLAN_SEO_DRAFTS_PER_MONTH` (`:706`), `PLAN_SOCIAL_CHANNEL_LIMIT` (`:712`), plus
site allowance. `sprint-ladder-ruling.md` is explicit that the ladder is shaped by
"per site prompts" and by a 15 percent of price cost ceiling, and it is rigorous
about it: the per site series 5.00, 7.00, 9.00, 17.50, 18.67, 20.00 is strictly
increasing with no inversion.

That rigour is real and it is not the buyer's problem. A buyer cannot answer "do
I need 18 or 35 prompts?" because they have never counted a prompt. They can
answer "do I want to be tracked in the 3 places my customers ask, or the 5?" and
they can answer "how many of my products or locations?".

Consequence, MEASURED on the cards: every tier is described in units.
"18 commercial prompts", "35 commercial prompts", "56 commercial prompts",
"Site audit: 30 pages, 3x Growth" (`:2034`, `:2061`, `:2084`, `:2086`). Not one
card states an outcome. The single line on the page that comes closest is the
Growth sub, "5 engines, incl. Google AI Mode" (`:2055`), which is still a unit.

The ruling itself named this and left it to copy: decision 4, "a package sells a
tier, not prompts". The cards have not caught up with the ruling.

### Q6. Plan clarity and self-selection

**VERDICT: FAIL. A visitor sees five priced cards, a mode switch to two more, a
billing toggle, and two separate free offers. Nine choices.**

MEASURED, default state of `#pricing`: mode switch set to "Run it yourself, from
EUR 0" (`:1961`), showing **five cards**: Free EUR 0, Radar EUR 29 with a "Launch
price" flag and a "List EUR 39/mo after launch" tag, Essentials EUR 99, Growth
EUR 299 flagged "Most Popular", Growth PRO EUR 449 flagged "Power tier"
(`:1979-2089`). Switching mode reveals Managed EUR 1,500 and Custom Enterprise
(`:2094-2136`). A monthly and yearly toggle sits above (`:1966-1972`). Beneath,
"Get my free AI Visibility Snapshot" (`:2162`).

**Radar is on the homepage pricing section, prominently, as the second card, with
its own launch-price eyebrow and a link to the announcement (`:2016`). The premise
that it lives only on the news page is REFUTED.**

**Growth PRO does have a self-serve checkout path. The `CLAUDE.md` backlog claim
that it has none is STALE and is refuted here.** `_terms_gate.js:141` lists
`SELF_SERVE_CHECKOUT_PLANS = ['essentials', 'growth', 'growth_pro', 'radar']`, the
card carries `data-checkout="growth_pro"` and the note "Secure Stripe checkout"
(`:2079-2080`), and `handoff-billing-2026-08-02.md:301` records exactly seven live
payment links, the six rotated ones plus Radar. INFERRED, from six rotated links
covering three plans at two periods: Growth PRO monthly and annual are two of the
six. Confidence high, not absolute, because the link map lives in an env var.

Three coherence problems, all MEASURED:

1. **Five self-serve rungs is more than one buyer needs and more than this book
   can justify.** Non-research clients in production number **11**, spread over
   6 different plans. Zero of them arrived through the self-serve funnel with a
   subscription (see F1). The ladder has more tiers than it has customers.
2. **Radar's step over Free is thin in the buyer's language.** 5 prompts to 7,
   1 engine to 2, monthly to weekly. `sprint-ladder-ruling.md` open question 1a
   flagged exactly this ("a real product and a thin sales line") and Constantin
   declined the optional 8th prompt. The arithmetic was right; the sales line is
   still thin, and the market now prices 15 prompts and 4 engines at the same
   number.
3. **Radar carries no yearly price while the toggle is global.** MEASURED,
   `site.js:757` `MONTHLY_ONLY_PLANS = ['radar']`. A visitor who flips to Yearly
   sees four cards change and one not, with no explanation on the card.

### Q7. Friction versus commitment

**VERDICT: PASS on the lower tiers, with one avoidable step. The demo gate is
correctly confined to Managed and Enterprise.**

MEASURED: Free goes to `/signup` (`:1988`). Radar, Essentials, Growth and Growth
PRO all carry `data-checkout` and "Secure Stripe checkout" (`:2008`, `:2030`,
`:2057`, `:2079`). Only Managed ("Book Consultation") and Enterprise ("Contact
Sales") point at `#contact` (`:2107`, `:2127`), which is legitimate for a
EUR 1,500 sales-led tier.

The avoidable step: every self-serve Subscribe click opens a terms gate modal,
"Before you subscribe" (`:2409`), which posts to `accept-terms` and only then
issues the Stripe link. MEASURED, `accept-terms.js:5-26` and
`_terms_gate.js:25-26`. This is a deliberate contract-of-record design and it is
defensible; it is also one extra modal on a EUR 29 impulse purchase. Named as a
tradeoff, not a defect.

The real friction is the one in Q4: the best free thing on the page is behind a
48 hour form, and the audit's own payoff is behind an email.

### Q8. Perceived ROI

**VERDICT: FAIL. The page never quantifies the cost of the unsolved problem, in
any unit, anywhere.**

MEASURED, over the whole served page: `revenue` 0, `leads` 0, `traffic` 0,
`ROI` 0, `lost` 0, `invisible` 0. There is no sentence of the form "X percent of
buyers now ask an AI first", no "a customer you do not appear for is a customer
your competitor gets", no worked example, no case study, no named customer.

MEASURED, what the page does quantify: a mention rate of 70.8 percent from a real
anonymized client (`:1526-1590`), six illustrative score dimensions
(`:1734-1739`), an illustrative sentiment split (`:1772-1784`), engine coverage
per tier, and one competitor price comparison. Every quantity on the page is a
measurement of the product, not a measurement of the buyer's loss.

Consequence: at EUR 29 the buyer is not comparing against the cost of staying
invisible, because that cost was never named. They are comparing EUR 29 against
EUR 0, and against Otterly's $29. Both comparisons are winnable only on
value framing, which is absent.

The 48 hour audit form does ask for industry and company size (`:2238-2243`),
which means the raw material for a per-industry cost claim exists as a shape and
has no data behind it yet. Not a claim we may invent.

### Q9. Paywall timing, and what a free user actually experiences

**VERDICT: FAIL, and this is the most fixable failure in the audit. Nobody, at
any point, sees themselves in ChatGPT without paying EUR 99.**

Verified against the current config rather than notes:

| Surface | Engines | Prompts | Refresh | Source |
|---|---|---|---|---|
| Public instant audit | **gemini, perplexity** | 4 | one shot | `_prospect_engines.js:395`, `audit-domain.js:34`, and `:74` which forces every public caller to `screening` depth |
| 48 hour full audit | chatgpt, gemini, claude, perplexity, google_ai | 6 | one shot | `_prospect_engines.js:396`, internal callers only |
| Free plan | **gemini** | 5 | monthly | `planConfig.ts:75`, `:541`, `:618` |
| Radar EUR 29 | **gemini, claude** | 7 | weekly | `planConfig.ts:86`, `:541`, `:620` |
| Essentials EUR 99 | **chatgpt**, gemini, claude | 18 | weekly | `planConfig.ts:87` |

So the ladder from free to EUR 29 to EUR 99 is: Gemini and Perplexity, then
Gemini, then Gemini and Claude, then finally ChatGPT. A visitor's mental model is
"AI means ChatGPT". The product's first three touchpoints do not contain it, and
the launch announcement says so out loud: "A free account that wants ChatGPT
specifically is looking at the EUR 99 plan, not the EUR 29 one."

Both decisions that produced this were correct on their own terms.
`sprint-ladder-ruling.md` decision 1b moved Free to Gemini to fix a live billing
defect and to stop Radar taking an engine away; the amendment to decision 1 took
ChatGPT out of Radar to save EUR 227.55 a month at 100 subscribers. Neither
decision was asked what it did to the free taste, and together they removed the
one engine a first-time visitor recognises from every surface below EUR 99.

Cost of putting ChatGPT back in the **screening audit only**, computed from
`sprint-ladder-ruling.md`'s own figure of EUR 0.108 a ChatGPT check: 4 prompts x
EUR 0.108 = **EUR 0.432 per audit**. At the current measured rate of roughly one
audit per day that is about **EUR 13 a month**. At 50 audits a day it is
EUR 648 a month, so it needs a rate limit, not a veto. This does **not** touch
decision 1b, which governs `PLAN_ENGINES.free`, a different constant.

Second half of the question: what does a free signup experience? MEASURED from
production, the free plan has produced almost nothing to experience. Of the two
free clients, one has **0 prompts and 0 results** and one has 2 prompts and 4
results. Every non-research client created before 2026-08-02 sits at
`refresh_cadence = 'manual'` (9 of 11), so the weekly refresh the paid tiers are
sold on is not running for any of them. See F4.

---

## Findings ledger, severity ranked

| # | Sev | Finding | Evidence |
|---|---|---|---|
| **F1** | **CRITICAL** | **There is no self-serve funnel to diagnose.** Lifetime `prospect_audits` = 63, of which 54 landed on 2026-07-16 across 37 distinct domains. Since 2026-07-20 there have been **7** audits, the last on 2026-08-08, and **none in the 5 days to 2026-08-13**. Lifetime `signup_attempts` = 5, last on **2026-07-30**, i.e. 14 days of zero. Lifetime `prospect_leads` = 2. All 12 `terms_acceptances` rows fall on 2026-07-31 (10, covering every plan and period, the shape of a smoke test) and 2026-08-02 (2). All 4 `stripe_events` are those two days. | SQL, 2026-08-13 |
| **F2** | **CRITICAL** | **Zero customers have been acquired self-serve.** Of 38 client rows, 27 are BrandGEO's own research studies. Of the 11 non-research rows, exactly 1 carries a `stripe_customer_id`, and that one is `plan_source = 'package'` with **0 prompts and 0 results**, consistent with the EUR 1 migration test recorded in `handoff-billing-2026-08-02.md`. The one substantial commercial relationship, client 1, is a hand-sold package (EUR 3,500 for 10 months of Growth PRO) with **no** Stripe customer id. INFERRED: revenue is founder-led and done-for-you shaped; the self-serve ladder has never closed a stranger. | SQL, 2026-08-13; `handoff-billing-2026-08-02.md:105` |
| **F3** | **HIGH** | **The painkiller is withheld from the free audit.** Competitor names, per-engine presence and the named gaps are generated and stored, and the pre-email response returns only score plus gap count. 6 of the last 7 audits never unlocked. | `get-audit-report.js:45-61`; `site.js:239`; SQL |
| **F4** | **HIGH** | **The weekly refresh that every paid tier is sold on is not being delivered to any client created before 2026-08-02.** `refresh_cadence = 'manual'` on 9 of 11 non-research clients, including client 1 (the paying package) and all three Managed rows, two of which last produced a result on **2026-07-19**. `feed1d5` shipped the cadence "for new clients only" and no backfill was run. This is a live delivery gap against a published promise on cards priced EUR 29 to EUR 1,500. | SQL; `git log` on `planConfig.ts` |
| **F5** | **HIGH** | **Radar at EUR 29 collides with Otterly Lite at $29 and loses on every published axis**: 7 prompts against 15, 2 engines against 4, no ChatGPT against ChatGPT included, weekly against daily. | Otterly pricing page, 2026-08-13; `planConfig.ts:86`, `:541`, `:560` |
| **F6** | **HIGH** | **Essentials at EUR 99 is dominated by Peec Starter at EUR 85**: 18 prompts against 50, fixed engines against 3 of the buyer's choice, weekly against daily. The homepage's only price comparison omits both Peec and Otterly and picks Profound, the one vendor BrandGEO beats on that axis. | peec.ai pricing, 2026-08-13; `index.html:2151-2158` |
| **F7** | **HIGH** | **No ICP is named in any visible copy**, and `get-found-online.html`, the page written for the ruled primary ICP, is live and linked **0** times from the homepage. | word counts over served `index.html`; HTTP 200 on `/get-found-online.html`; `GTM-STRATEGY.md:271-302` |
| **F8** | **HIGH** | **The cost of the unsolved problem is never quantified.** Zero occurrences of revenue, leads, traffic, ROI, lost, invisible. | word counts, served `index.html` |
| **F9** | **MEDIUM** | **ChatGPT is absent from every free and sub-EUR 99 surface**, including the public screening audit, which runs Gemini and Perplexity. The FAQ describes the instant check without naming its engines. | `_prospect_engines.js:395`; `audit-domain.js:74`; `index.html:2171-2210` |
| **F10** | **MEDIUM** | **Nine choices in one pricing section**: 5 self-serve cards, a mode switch to 2 more, a billing toggle, and a second free offer pointing at a 48 hour form. Radar is monthly-only against a global yearly toggle, unexplained on the card. | `index.html:1951-2163`; `site.js:757` |
| **F11** | **MEDIUM** | **`docs/PRICING-SPEC.md` is stale on every axis** and still carries "Start free trial" CTAs in the family of docs, against a product with no trial mechanism. It should be marked SUPERSEDED by `docs/strategy/sprint-ladder-ruling.md`. | `PRICING-SPEC.md:4`, `:20-25`, `:206`; `sprint-ladder-ruling.md:757` |
| **F12** | **MEDIUM** | **The launch scarcity is inert.** "For our first 100 customers" with the announcement stating it "is not time-limited", against a book of 1 Radar row that is itself a test. No counter, no deadline, no mechanic. | `index.html:2006`; `/news/radar-plan-launch/`; SQL |
| **F13** | **LOW** | **The hero is interrogative**, against a measured category pattern in which none of ten competitors asks a question. Partly mitigated: unlike the 2026-07 headline this one names the rival in the same breath. | `index.html:1507`; `competitive-and-conversion-2026-07-28.md:30-39` |
| **F14** | **LOW, REFUTED PRIOR CLAIMS** | Growth PRO **does** have a self-serve checkout path (`_terms_gate.js:141`, seven live links); Radar **is** on the homepage pricing section (`:1998-2017`); the Profound comparison block that the 2026-07-28 research listed as "not shipped" **has shipped** (`:2151`). | as cited |

---

## The five highest-leverage changes

Ordered by expected effect on the offer. Each names its tradeoff and its
strongest counter-argument, and flags whether it touches a signed ruling.

### 1. Point the front door at one buyer, and stop orphaning the page that already does

Make the homepage choose between the two motions rather than defaulting into the
one with no customers. The mechanism already exists: the pricing mode switch is a
buyer switch wearing a pricing switch's clothes. Either raise it to the fold as
the first decision a visitor makes, or route the done-for-you buyer to
`get-found-online.html` from the nav and the hero, and let the homepage be
unambiguously the self-serve product page.

**Tradeoff:** naming a buyer costs you every visitor who is not that buyer, and
at 7 audits in three weeks the sample cannot tell you which one you lost.
**Counter-argument:** `GTM-STRATEGY.md` §4.2b already made this call on
2026-07-18 and the site never executed it; running two motions through one
undifferentiated door is what produces a page that speaks to nobody.
**Sign-off:** not required. This contradicts no signed ruling; it executes one.
**Owner:** `bg-strategy` amendment, then `bg-design` and `bg-copy`.

### 2. Move the painkiller in front of the email gate

Show, unlocked, the two facts that create fear: which competitors the engines
named instead of them, and their presence engine by engine. Keep `top_gaps`,
the fix list, behind the email, because the fix is the thing worth an address.

**Tradeoff:** you give away the sharpest asset and may capture fewer emails per
audit. **Counter-argument:** the measured capture rate is 1 in 7, so the gate is
not protecting a working conversion, it is preventing one. A visitor who has seen
three competitors named where they are not has a reason to give an email; a
visitor holding a bare score does not.
**Sign-off:** not required on pricing. It changes product behaviour, so it needs
`bg-architect` to rule on the response contract before `bg-backend` touches
`get-audit-report.js`.
**Owner:** `bg-architect`, then `bg-backend`, then `bg-copy`.

### 3. Put ChatGPT into the free screening audit, or say plainly which engines it runs

MEASURED cost: 4 prompts x EUR 0.108 = **EUR 0.432 per audit**, about EUR 13 a
month at the current rate. Ship it behind a per-IP rate limit so the exposure is
bounded rather than open. If the answer is no, the honest alternative is to name
the two engines on the card, because a visitor who assumes ChatGPT and is not
told is being allowed to believe something untrue.

**Tradeoff:** unbounded spend if the audit ever gets the traffic it is built for,
which is precisely the outcome we want.
**Counter-argument:** it makes the free taste more compelling than Radar, which
carries no ChatGPT either, so the EUR 29 tier may look worse immediately after
the audit that sold it.
**Sign-off: REQUIRED.** It does not contradict decision 1b, which governs
`PLAN_ENGINES.free` and not `SCREENING_ENGINES`, but it is adjacent to a signed
ruling and it turns on new spend.
**Owner:** Constantin decides, then `bg-backend`.

### 4. Cut the visible self-serve ladder from five cards to three, and describe each in outcomes

Show Free, one recommended paid tier, and one step up. Put Radar, Growth PRO and
the rest behind a "compare all plans" link. Then rewrite each card in the buyer's
units per decision 4's own rule that a package sells a tier, not prompts.

**Tradeoff:** hiding EUR 449 removes an anchor that makes EUR 299 look
reasonable, and anchoring is real.
**Counter-argument:** anchoring only helps a buyer who has already decided to
buy something; five near-identical unit-priced cards prevent that decision from
being reached at all. And no tier below Managed has ever been bought self-serve,
so nothing measurable is at risk.
**Sign-off: REQUIRED.** It changes what a customer sees on the pricing surface,
which is a stop-and-ask condition under `AGENT-OS` §6. No ruled number moves.
**Owner:** Constantin, then `bg-design` and `bg-copy`.

### 5. Deliver the weekly refresh the paid tiers are sold on, or stop selling it

Backfill `refresh_cadence` for existing non-research clients, or remove "Weekly
refresh" from the cards until it is true for everyone who paid for it. Today the
cards say weekly and 9 of 11 non-research clients are on `manual`, with two
Managed accounts last collected on 2026-07-19.

**Tradeoff:** a backfill turns on real spend across the existing book at once,
and the research-category exclusion is load bearing. `planConfig.ts:634-652`
records that deriving cadence from plan alone would switch on EUR 6,075 a month of
budget ceiling for 27 research rows.
**Counter-argument:** the alternative is continuing to advertise a cadence that
paying customers are not receiving, on a product whose entire pitch is honest
measurement.
**Sign-off: REQUIRED.** It changes what existing paying customers receive and it
turns on spend. This is a `HUMAN CHECKPOINT` condition.
**Owner:** Constantin decides, then `bg-backend`, then `bg-verify`.

---

## What we will not claim

Recorded so no downstream stage reaches for these.

- **No customer counts, no "used by N brands", no logos.** There are 11
  non-research client rows and zero self-serve subscriptions. Every competitor
  fills this slot ("40,000+ Marketing Pros", "3000+ brands and agencies",
  Coinbase and SoFi) and BrandGEO cannot, truthfully, today.
- **No "cheapest AI visibility tool".** Otterly Lite is $29 for 15 prompts and 4
  engines including ChatGPT; Radar is EUR 29 for 7 prompts and 2 without it.
- **No "most engines per euro" as a general claim.** True against Profound,
  false against Peec at the tier a buyer actually compares.
- **No engine-count superlative.** Seven is real, and AthenaHQ publishes nine.
- **No "monitor everything in one place" while AI Social is admin-only.** The
  chain framing on the page ("One place instead of three tools", with the post
  step marked coming soon) is the honest version and should stay that way.
- **No trial language.** No trial mechanism exists in the code and none has been
  ruled. `sprint-ladder-ruling.md:757-762` already flagged the "Start free trial"
  CTAs surviving in the pricing docs as either stale or an unwritten commitment.
- **No urgency built on a deadline that does not exist.** The Radar launch price
  is explicitly not time-limited, by ruling.

---

## Handoff packet

```
id:          (assign on write)
from:        bg-strategy
to:          Constantin, then bg-design + bg-copy (changes 1 and 4),
             bg-architect + bg-backend (changes 2, 3, 5)
status:      NEEDS_HUMAN
scope_write: docs/strategy/positioning-pricing-audit-2026-08-13.md (this file only)
scope_read:  brandgeo/web/index.html, brandgeo/web/site.js,
             brandgeo-dashboard/src/lib/planConfig.ts,
             brandgeo-dashboard/netlify/functions/{audit-domain,get-audit-report,
             _prospect_engines,_terms_gate}.js,
             docs/strategy/sprint-ladder-ruling.md, docs/PRICING-SPEC.md,
             docs/GTM-STRATEGY.md,
             docs/research/competitive-and-conversion-2026-07-28.md,
             docs/strategy/hook-thesis-web.md
model:       opus
```

**Decision.** The offer's weakest link is not price, it is the free experience and
the missing buyer. Radar's price is defensible arithmetic and indefensible
positioning against a market that already sells more for the same number. No
ruled figure needs to move to fix the top three findings.

**Do not.** Do not reprice Radar as a first move; the ladder's arithmetic is sound
and repricing without fixing the free taste changes nothing measurable. Do not
add a testimonial, a logo wall, or a customer count. Do not build on
`docs/PRICING-SPEC.md`.

**Open questions for Constantin.**
1. Which motion owns the homepage: self-serve, or the done-for-you SMB wedge that
   `GTM-STRATEGY.md` §4.2b ruled primary on 2026-07-18? Every other positioning
   decision hangs off this one.
2. ChatGPT in the free screening audit at about EUR 0.43 per audit, yes or no?
3. Backfill `refresh_cadence` for the existing book, or pull the weekly claim off
   the cards until it is true?
4. Is there a business fact this audit could not see, specifically: how much
   traffic reached `getbrandgeo.com` in the last 30 days? Plausible was removed
   (`1b9bd24`, "the subscription lapsed"), so there is no analytics on the site
   and F1 measures demand only at the point where it touches the database.
```
=== HUMAN CHECKPOINT ===
NEED:      Does the homepage sell the self-serve ladder or the done-for-you wedge?
WHY:       GTM-STRATEGY.md 4.2b ruled done-for-you primary on 2026-07-18; the
           homepage defaults to self-serve and links the done-for-you page 0 times.
OPTIONS:   A) Self-serve owns the homepage -> get-found-online.html gets its own
              channel and the homepage stops carrying the EUR 1,500 mode switch.
           B) Done-for-you owns the homepage -> the fold names the SMB buyer and
              the outcome, and the self-serve ladder moves to /pricing.
DEFAULT:   Nothing changes; the page continues to address neither buyer.
TO RUN:    No command. This is a positioning ruling only Constantin can make.
TO VERIFY: Re-run the 3-second test in docs/strategy/hook-thesis-web.md section 4
           against whichever version ships.
=== END CHECKPOINT ===
```
