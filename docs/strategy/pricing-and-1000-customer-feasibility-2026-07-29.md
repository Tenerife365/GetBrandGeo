# Pricing, packaging and the 1,000-customer question

**Run:** 2026-07-29
**Author:** `bg-strategy`
**Question asked:** is 1,000 paying customers on the EUR 299/month Growth plan feasible, and what would have to be true to get there?
**Status:** analysis artifact. Nothing here is implemented. No code, price, or published page was changed.

**Every price in this document is dated 2026-07-29 and states its currency and
billing period.** Where a vendor quotes an annual-billed-monthly figure, both are
recorded, because that is the trap that makes competitors look cheaper than they
are. Where a number is an estimate, it says `ESTIMATE` and shows the method.
Where a number could not be verified, it is in section 11 rather than smoothed
over.

---

## 0. The answer, before the evidence

**No. Not on the current shape, and not in any horizon the owner would accept.**

1,000 customers at EUR 299 is EUR 299,000 MRR and EUR 3.59M ARR. That number is
**not absurd for the category**: Peec AI reached roughly 3x it in 16 months at
almost exactly the same average price. It is unreachable for BrandGEO today for
three reasons, in order of severity:

1. **There is no funnel.** 38 distinct domains have ever run the free audit. One
   lead was captured. Zero Stripe webhook events have ever been recorded. Seven
   clients are marked active. The target requires roughly 71 new paying Growth
   customers every month for 24 consecutive months. (Section 5, sourced.)
2. **The price is wrong for the value metric buyers actually compare.** Growth is
   EUR 8.54 per tracked prompt per month. The median of eleven directly
   comparable self-serve tools is around USD 1.30. BrandGEO is the most expensive
   product in the surveyed market on the one number that appears on every
   competitor's pricing card. (Section 3.)
3. **The only company that has done this raised USD 29M to do it.** The only
   bootstrapped comparable in the category reached roughly one fifth of the
   target after about three years with seven people. (Section 4.)

**The realistic 12-month number is 60 to 90 paying customers and EUR 15,000 to
EUR 25,000 MRR**, blended across the ladder, and even that requires the funnel
work in section 9 to start immediately. 1,000 x EUR 299 is a 48 to 60 month
objective that requires either outside capital or a distribution channel that
does not exist today. (Section 10.)

The owner's stated belief, that BrandGEO offers materially more than competitors
at the same price, is **half right and dangerous in the half that is wrong**.
On the act-and-publish layer it is true and defensible. On the measure layer,
which is what buyers compare first and what every competitor's pricing page is
built around, it is false by a factor of five to twenty. (Sections 3 and 7.)

---

## 1. What was verified in the codebase and database today

Read-only. Every claim below has a file and line or a SQL result behind it.

### 1.1 The shipped ladder

`brandgeo-dashboard/src/lib/planConfig.ts` (read 2026-07-29):

| Plan | Price EUR/mo | Engines (`PLAN_ENGINES`) | Prompts (`PLAN_PROMPTS`) | Cooldown | SEO pages | Social channels |
|---|---|---|---|---|---|---|
| free | 0 | 1 | 5 | 720h | 0 | 0 |
| essentials | 99 | 3 | 15 | 168h | 0 | 0 |
| growth | 299 | 5 | 35 | 168h | 10 | 1 |
| growth_pro | 449 | 7 | 35 | 168h | 30 | 3 |
| managed | 1,500 | 7 | 120 | 168h | 100 | 13 |
| enterprise | custom | 9 | 100,000 | 0 | 500 | 13 |

Seven engines collect: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode,
Grok, Google AI Overviews. Grok and AI Overviews both went live 2026-07-29,
Growth PRO and up. Meta AI is retired. Copilot and DeepSeek have never
collected.

### 1.2 Three documents give three different prompt counts for Growth

This is a live contradiction and it matters, because the number on the pricing
card is the number the buyer compares.

| Source | Growth prompts | Growth engines |
|---|---|---|
| `planConfig.ts` `PLAN_PROMPTS` (the constant) | **35** | 5 |
| `public.plan_prompt_caps` (the **enforced** copy, queried 2026-07-29) | **35** | n/a |
| `brandgeo/web/index.html:2739` (published, live) | **35** | 5 |
| `planConfig.ts` lines 361 to 407 (the file's own cost derivation comment) | **50** | 5 |
| `docs/PRICING-STRATEGY-2026-07.md` section 3 | **75** | 4 |

**Ruling: the shipped and published number, 35, is authoritative. The comment
block in `planConfig.ts` and section 3 of `PRICING-STRATEGY-2026-07.md` are both
stale and should be marked so.** Reason: the enforced database copy, the frontend
constant, and the live marketing page all agree at 35, and no customer has ever
been offered any other figure. This is a documentation defect, not a customer
impact, but it will cause a wrong decision the next time someone prices from the
comment rather than the constant. The `planConfig.ts` comment is the more
dangerous of the two, because it sits directly above the constant it contradicts
and reads as its justification.

Second-order consequence worth naming: the comment block derives its cost
percentages (10.5% of price for Growth) from **50** prompts. At the enforced 35,
scheduled collection costs proportionally less, so there is more headroom under
the owner's 12% ceiling than the file claims. Section 8 uses this.

### 1.3 The actual customer base

`SELECT plan, type, category, count(*) FROM clients GROUP BY 1,2,3`, run
2026-07-29 against project `duiyifepitvugyulobqm`:

| plan | category | count |
|---|---|---|
| pro | research | 27 |
| managed | active | 4 |
| essentials | active | 1 |
| growth | active | 2 |
| free | free / active | 2 |

**36 client rows. 27 are `category = 'research'`**, the city and industry study
tenants that produce the published research pages. They are not customers.

**Seven rows carry `category = 'active'`: 4 Managed, 1 Essentials, 2 Growth.**

Whether those seven pay, what they pay, and whether any has churned, is a fact
only Constantin holds. It is not derivable from the schema. See section 11.

### 1.4 The funnel, measured

One query, run 2026-07-29:

| Signal | Value |
|---|---|
| `prospect_audits` rows (free audit runs, lifetime) | **58** |
| distinct domains audited (lifetime) | **38** |
| `prospect_leads` rows | **1** |
| `signup_attempts` rows | **4** |
| `stripe_events` rows | **0** |
| `user_profiles` rows | 10 |
| last free audit | **2026-07-26** |
| distinct clients collected in last 30 days | 35 |

Weekly distribution of the free audit, by `date_trunc('week', created_at)`:

| Week beginning | Audits | Distinct domains |
|---|---|---|
| 2026-07-06 | 2 | 1 |
| 2026-07-13 | 54 | 37 |
| 2026-07-20 | 2 | 1 |

**Read this carefully, because it is the single most important table in this
document.** The free audit tool, which is the top of the entire self-serve
funnel and the prospect-facing proof asset, has been used by 38 distinct domains
in its whole life, 37 of them in one week, and has produced one lead. The one
busy week looks like a burst rather than organic demand.

`stripe_events` is empty. If that table has been in place since the webhook
shipped, **no self-serve checkout has ever completed** and all seven active
clients were provisioned by hand. I could not confirm the table's age from the
migration files present, so this is stated as strong evidence rather than proof.
See section 11.

### 1.5 Stripe

The Stripe account reachable from this session is `acct_1TxtkGQAKgm0Dugx`,
display name **Talentwelove**. Its live products are DIY Starter / DIY Pro / DIY
Scale and slot-based recruiting products at EUR 199 / 499 / 999 per month and
EUR 2,500 / 4,000 per month. **It has zero subscriptions.** This is not
BrandGEO's account and none of its numbers appear anywhere in this analysis.

BrandGEO's own Stripe objects are visible in source and sit under a different
account (price ID prefix `Kh2GaZE2B4`), in
`brandgeo-dashboard/netlify/functions/stripe-webhook.js:41-55`:

- Essentials EUR 99/mo and EUR 990/yr
- Growth EUR 299/mo and EUR 2,990/yr
- **Growth PRO EUR 449/mo and EUR 4,490/yr, both present**
- Two superseded Essentials and Growth prices retained for existing subscriptions

`brandgeo/web/site.js:627-636` carries live `buy.stripe.com` checkout links for
three plans, monthly and annual.

**Finding: the backlog item "Create the Stripe price and checkout link for
Growth PRO" in `CLAUDE.md` is stale and should be closed.** Growth PRO has both.
The live-Stripe reconciliation this analysis was asked to perform could not be
completed against the API because the wrong account is connected, but it was
completed against source, and source agrees with `planConfig.ts` and with the
published page on all four self-serve prices.

### 1.6 The live hero claim

`brandgeo/web/index.html:2227`, verbatim:

> Are AI models recommending *your brand*, or your competitors?

This is a question the visitor can answer with "probably not, and I already knew
that." The prior research (`docs/research/competitive-and-conversion-2026-07-28.md`
section 1.1) established that none of ten scraped competitors asks a question in
the hero, and that the previous BrandGEO headline was changed for exactly this
reason. It was changed into a different question. The finding did not land.

---

## 2. Market map: 28 tools

Prices captured 2026-07-29 unless noted. **M** = monthly billing, **A** =
annual, quoted per month. Where only one figure is published, the billing period
is stated. First-party means the vendor's own pricing page was fetched today.
Everything else is marked.

### 2.1 Core AI visibility and GEO platforms

| # | Tool | Entry | Mid | Top | Mid tier contents | Free shape | Motion | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | **Profound** | USD 99/mo (A) | **USD 399/mo (A)** | Custom | 100 prompts, 9,000 responses/mo, **3 engines**, 3 seats, daily, 400 agent credits | Trial on Growth, no free tier | Self-serve to Enterprise sales | First-party |
| 2 | **Peec AI** | EUR 85/mo | **EUR 205/mo** | EUR 425/mo, then custom | 150 prompts, 3 engines, 2 projects, 3 countries, daily | Trial | Self-serve to sales | Prices secondary (see 11); tier structure first-party |
| 3 | **Otterly.AI** | USD 29/mo M, USD 25 A | **USD 189/mo M, USD 160 A** | USD 489/mo M, USD 422 A | 100 prompts, **4 engines**, unlimited seats, daily, API 2,000 req/mo, 5,000 GEO URL audits | Trial, no card | Self-serve | First-party |
| 4 | **Rankscale** | USD 20/mo | **USD 99/mo** | USD 385, USD 780/mo | 1,200 credits, **4,800 AI responses/mo**, 10 dashboards, unlimited search terms, all engines, 50 page audits | Trial | Self-serve, agency tier | First-party |
| 5 | **Scrunch** | USD 300/mo M, USD 250 A | **USD 500/mo M, USD 417 A** | Custom | 700 custom + 2,500 industry prompts, 6 platforms, 5 seats, 5 personas, 10 page audits | 7-day trial, no card | Starter self-serve, Growth demo | First-party |
| 6 | **SE Visible** (SE Ranking) | USD 99/mo M, USD 79 A | **USD 189/mo** | USD 355/mo | 450 prompts, 5 engines, 5 brands | Trial | Self-serve | Secondary |
| 7 | **AthenaHQ** | n/p | **~USD 295/mo** | Custom | Credit-based | n/p | Self-serve to sales | Secondary, two sources agree at 295 |
| 8 | **Goodie AI** | USD 399/mo (Explorer) | Demo | Custom | Explorer 3 engines; Pro adds 3 more; Claude/Grok/AI Mode Enterprise only | Trial, 30-day money back | Self-serve entry, demo above | Secondary |
| 9 | **Brandlight** | n/p | n/p | Enterprise | Mentions, sentiment, citations, technical audits, multi-brand | n/p | Sales-led | Secondary |
| 10 | **Evertune** | n/p | n/p | Enterprise | Statistical brand-description tracking at scale | n/p | Sales-led | Secondary |
| 11 | **Conductor** | n/p | n/p | Enterprise | AI search inside a full SEO suite | n/p | Sales-led | Prior research |
| 12 | **Visiblie** | EUR 79/mo M, EUR 63 A | **EUR 129/mo M, EUR 103 A** | EUR 199/mo, then custom | 100 prompts/week, 4 engines, 5 users | n/p | Self-serve | Secondary |
| 13 | **ZipTie** | USD 69/mo | **USD 99/mo** | USD 159/mo | 3 engines (AI Overviews, ChatGPT, Perplexity) | n/p | Self-serve | Secondary |
| 14 | **LLMrefs** | USD 79/mo | n/p | n/p | LLM surfaces | n/p | Self-serve | Secondary |
| 15 | **Rankability** | USD 99/mo | **USD 199/mo** | n/p | Unlimited prompts claimed | n/p | Self-serve | Secondary |
| 16 | **Searchable** | USD 50/mo | **USD 125/mo** | USD 400/mo | 100 prompts, 3 engines | n/p | Self-serve | Secondary |
| 17 | **Geneo** | ~USD 39.90/mo | n/p | n/p | n/p | n/p | Self-serve | Secondary |
| 18 | **Dageno** | USD 67/mo | n/p | n/p | 8+ platforms claimed | n/p | Self-serve | Secondary |
| 19 | **Hall** | Free tier | Paid tiers n/p | n/p | n/p | Free tier | Self-serve | Secondary |
| 20 | **Knowatoa** | n/p | n/p | n/p | n/p | n/p | Self-serve | Not verified |
| 21 | **Am I On AI** | Described as higher-ticket | n/p | n/p | n/p | n/p | n/p | Not verified |

### 2.2 SEO suites that now include AI visibility (they take the same budget)

| # | Tool | Price | What the AI module includes | Trap |
|---|---|---|---|---|
| 22 | **Semrush AI Visibility Toolkit** | **USD 99/mo per domain**, add-on | 25 tracked prompts, 5 engines, 220+ countries, daily prompt refresh, AI Search Site Audit | **Requires an active Semrush plan from USD 139.95/mo**, so real entry is ~USD 239/mo. Extra prompts USD 60/mo per 50. Extra domains USD 99/mo. No free trial. |
| 23 | **Ahrefs Brand Radar** | Bundled into Lite EUR 119, Standard EUR 229, Advanced EUR 419/mo; standalone **Brand Radar AI from EUR 179/mo** | 5 / 10 / 20 tracked prompts by tier; 271M+ organic prompt database; custom prompt packs EUR 46.70 (2,500 checks), EUR 93 (7,000), EUR 234 (25,000) | Buyer is already paying for Ahrefs, so the AI module is a marginal upsell, not a new line item |
| 24 | **SEO.AI** | USD 149/mo single site, **USD 299/mo up to 3 sites**, 25% off annual, ex VAT | Agent targeting Google and ChatGPT visibility, content recommendations, publishing plan, backlinks, Google Ads | Sits at exactly BrandGEO's Growth price with a do-the-work promise |
| 25 | **Nightwatch** | USD 29 to USD 989/mo; AI add-on from USD 99/mo; combined ~USD 131/mo for 4 engines, 100 prompts | 25+ GEO factor analysis | Rank tracker first |
| 26 | **seoClarity ArcAI** | Enterprise, not published | AI search inside an enterprise SEO platform | Sales-led |
| 27 | **Frase** | From USD 39/mo billed yearly | AI visibility tracking inside a content platform | Content tool first |

### 2.3 Brand and mention monitoring (adjacent, and the budget BrandGEO's sentiment pillar competes for)

| # | Tool | Entry | Mid | AI visibility |
|---|---|---|---|---|
| 28 | **Brand24** | USD 249/mo M, USD 199 A (3 keywords, 2K mentions, 1 user) | USD 349/mo M, USD 299 A (7 keywords, 10K mentions, unlimited users); Pro USD 499/399; Business USD 699/599; Enterprise USD 1,499 | **AI Visibility is a paid add-on** on all tiers below Enterprise, included at Enterprise. AI sentiment and AI event detection on all tiers. 14-day trial, no card. |

Brand24 matters for one reason: it proves the mention-monitoring category
already charges USD 199 to USD 599 per month for something a marketing buyer
recognises, and it is bolting AI visibility on as an add-on rather than
repricing. That is the pincer BrandGEO sits inside: pure-play GEO tools are
cheaper than BrandGEO, and incumbent monitoring suites are adding GEO for a
small increment on a budget the buyer already spends.

---

## 3. Where EUR 299 sits, on the metric buyers compare

Every self-serve tool in section 2.1 prints a prompt count on its pricing card.
That is the category's value metric, whether or not it should be. Here is the
comparison a prospect makes in about forty seconds with two browser tabs.

**Price per tracked prompt per month, monthly billing, 2026-07-29:**

| Tool and tier | Price | Prompts | Per prompt | Engines |
|---|---|---|---|---|
| **BrandGEO Growth** | **EUR 299** | **35** | **EUR 8.54** | 5 |
| **BrandGEO Growth PRO** | **EUR 449** | **35** | **EUR 12.83** | 7 |
| **BrandGEO Essentials** | **EUR 99** | **15** | **EUR 6.60** | 3 |
| Semrush AI Toolkit (with required base plan) | USD 239 | 25 | USD 9.56 | 5 |
| Profound Growth | USD 399 | 100 | USD 3.99 | 3 |
| Semrush AI Toolkit (add-on only) | USD 99 | 25 | USD 3.96 | 5 |
| Otterly Lite | USD 29 | 15 | USD 1.93 | 4 |
| Profound Starter | USD 99 | 50 | USD 1.98 | 1 |
| Otterly Standard | USD 189 | 100 | USD 1.89 | 4 |
| Peec Starter | EUR 85 | 50 | EUR 1.70 | 3 |
| Peec Pro | EUR 205 | 150 | EUR 1.37 | 3 |
| Visiblie Growth | EUR 129 | 100/week | EUR 1.29 | 4 |
| Otterly Premium | USD 489 | 400 | USD 1.22 | 4 |
| Peec Scale | EUR 425 | 350 | EUR 1.21 | 4 |
| Searchable Professional | USD 125 | 100 | USD 1.25 | 3 |
| Scrunch Starter | USD 300 | 350 custom (+1,000 industry) | USD 0.86 | 6 |
| SE Visible Basic | USD 99 | 200 | USD 0.50 | 5 |
| SE Visible Plus | USD 355 | 1,000 | USD 0.36 | 5 |

**Median of the 14 non-BrandGEO rows with a published prompt count: about USD
1.60 per prompt per month. BrandGEO Growth is EUR 8.54.**

BrandGEO Growth is the most expensive tier in this table on this metric, ahead
of Semrush's fully loaded configuration, and it is roughly **five to twenty
times** the price of the tools a prospect will find in the same search session.

### 3.1 The same finding, on delivered responses

BrandGEO Growth refreshes weekly (`PLAN_COLLECTION_COOLDOWN_HOURS.growth = 168`),
so it delivers 35 prompts x 5 engines x 4.33 weeks = **758 AI responses per
month for EUR 299**, which is **EUR 394 per 1,000 responses**.

- Otterly Standard: 100 x 4 x 30 (daily) = 12,000 responses for USD 189, about
  **USD 16 per 1,000**.
- Rankscale Pro: 4,800 responses published outright for USD 99, about **USD 21
  per 1,000**.
- Profound Growth: 9,000 responses published outright for USD 399, about **USD
  44 per 1,000**.

BrandGEO is roughly **nine to twenty-five times** the market rate per response.

### 3.2 What this does to the existing competitive claim

`docs/research/competitive-and-conversion-2026-07-28.md` section 3 concluded:

> On engines-per-euro BrandGEO is roughly 4x Profound at the entry tier and
> undercuts their mid tier by USD 100 while shipping two more engines.

That is arithmetically correct and **strategically misleading, and it should not
be built into the site as recommended there.** It compares BrandGEO against
Profound alone, the single most expensive self-serve product in the category, on
the single metric where BrandGEO wins, while ignoring prompt volume, refresh
cadence, seats, and eleven cheaper competitors. A prospect who opens the
comparison block and then opens Peec or SE Visible in the next tab discovers
that BrandGEO chose its comparison. That is worse than making no comparison at
all, because it costs trust at the exact moment the buyer is checking.

**Ruling: do not ship the Profound comparison block in its current form.** If a
comparison ships, it must be against the full self-serve set and it must be won
on the act-and-publish layer, where BrandGEO genuinely wins, not on engines per
euro. Counter-argument, and it is real: Profound is the category's most
recognised name after its unicorn round, so beating it by name has borrowed
authority that beating Otterly does not. That is worth something. It is not
worth being caught.

---

## 4. Customer counts, funding and revenue

**This is the section most likely to be wrong if treated carelessly, so every
row states whether it is a hard number, a company self-report, or an estimate
with its method. Nothing here is invented.**

| Company | Funding (hard) | Customers | Revenue | Headcount | Grade |
|---|---|---|---|---|---|
| **Profound** | **USD 96M Series C at USD 1B valuation, Feb 2026**, led by Lightspeed, with Sequoia, Kleiner Perkins, Saga VC, South Park Commons, Evantic. **Total >USD 155M.** | **>700 enterprises**, "more than 10% of the Fortune 500", named: Target, Figma, Walmart, Ramp, MongoDB, Chime | **~USD 6.8M for 2025** | ~62 growing to under 120 by early 2026 | Funding and valuation: hard, multiple outlets plus the company's own post and counsel's announcement. Customer count and revenue: **company self-report via press coverage**, not audited. |
| **Peec AI** | **USD 21M Series A, Nov 2025**, led by Singular, with Antler, Combination VC, identity.vc, S20. **EUR 5.2M seed Jul 2025** led by 20VC. **Total ~USD 29M.** | **1,300+ brands and agencies at the Series A**, reported growing ~300/month. Pricing page states "**Trusted by 3000+ brands and agencies**" (fetched 2026-07-29). Named: Chanel, ElevenLabs, TUI, Axel Springer, n8n, Attio. | **EUR 650K ARR at 4 months. USD 4M ARR at 10 months. USD 10M ARR at 16 months (May 2026).** | Berlin plus a New York office opened 2026 | Funding: hard. ARR milestones: **company self-report**, repeated consistently across outlets. Customer counts: **self-report**. |
| **Otterly.AI** | **USD 0. Bootstrapped, no venture funding.** Founded 2023. | "over 20,000 users" (**self-report**, and users is not customers) | **~USD 770K estimated ARR** | **~7 people** | Funding and headcount: hard. **Revenue is a Latka third-party ESTIMATE, not disclosed by the company.** Treat as directional only. |
| **Brandlight** | **USD 30M Series A** | Not disclosed | Not disclosed | Not visible | Funding: secondary source, single. |
| **Scrunch** | **USD 19M** | Not disclosed. Named by a third party as among the four tools with the most customers in the category, alongside Otterly, Peec and Profound. | Not disclosed | Not visible | Funding: secondary. The "most customers" claim originates from a Scrunch-owned FAQ page, so it is **marketing, not evidence**. |
| **Evertune** | **USD 19M** | Not disclosed | Not disclosed | Not visible | Funding: secondary. |
| **AthenaHQ** | **USD 2.7M seed, Jun 2025** | Not disclosed | Not disclosed | Not visible | Funding: secondary. |
| **Hall** | USD 2M pre-seed reported | Not disclosed | Not disclosed | Not visible | Secondary, single source. |
| Rankscale, ZipTie, LLMrefs, Visiblie, Searchable, Geneo, Dageno, Knowatoa, Am I On AI, Rankability, Goodie | Not found | Not disclosed | Not disclosed | Not visible | **No credible customer count exists for any of these. Do not estimate one.** |

### 4.1 The two benchmarks that actually answer the question

Everything above collapses into two comparables, because only two companies in
this category sell at roughly BrandGEO's price point and have published enough
to be measured.

**Benchmark A, Peec AI: the target is achievable, and here is its price tag.**

Implied ACV from the company's own two numbers: USD 10M ARR (May 2026) divided
by the "3000+" customers claimed on the pricing page gives roughly **USD 3,333
ARR, or about USD 278 per month per customer**. That is within 7% of BrandGEO's
EUR 299. Peec is therefore near-proof that a EUR 299 average price is viable at
volume in this exact category, in Europe, right now. That is the strongest piece
of good news in this document and it should not be lost.

The cost of getting there: **USD 29M raised across two rounds inside twelve
months**, a Berlin team plus a New York office, and a peak acquisition rate of
about 300 customers per month. Peec passed 1,000 customers roughly nine months
after public launch, on venture money, with a dedicated go-to-market
organisation.

Caveat, stated plainly: the "3000+" figure is self-reported marketing copy and
the USD 10M ARR is a self-reported milestone. Dividing one self-report by
another produces an indicative ACV, not an audited one. It is used here as a
directional check that EUR 299 is not a fantasy price, and for nothing else.

**Benchmark B, Otterly.AI: the bootstrapped ceiling demonstrated so far.**

Bootstrapped, USD 0 raised, seven people, founded 2023, and at roughly **USD
770K estimated ARR**. At Otterly's own USD 189 mid tier that is on the order of
340 customer-equivalents. Otterly also has Gartner recognition and partnerships
with Semrush, Press Ranger and Storyblok, which is meaningfully more
distribution than BrandGEO has assembled.

**Otterly is the closest structural comparable to BrandGEO and it is at roughly
one fifth of the target after about three years.** The revenue figure is a
third-party estimate and could be materially wrong in either direction, which is
why it is not load-bearing on its own. It is load-bearing in combination with a
verifiable fact: seven people and zero venture funding.

**No company in this category has reached 1,000 self-serve customers at a EUR
299 price point without venture capital. Peec did it with USD 29M. Nobody has
done it without.**

---

## 5. Bottom-up feasibility on 1,000 x EUR 299

### 5.1 Is the serviceable market big enough?

Yes, comfortably, and this is not the binding constraint. The category on G2
grew over 2,000% in a year. Peec alone reports 3,000+ customers and Profound
700+ enterprises, and between them they have not saturated anything. A tool
priced at EUR 299 is aimed at companies with a marketing function and a software
budget, of which Europe and North America hold hundreds of thousands.

**Ruling: market size is not the reason this fails. Do not spend another hour
sizing it.** The constraint is entirely on the acquisition side, and section 5.2
is where the analysis actually lives. The strongest counter-argument is that the
serviceable market for a EUR 299 tool is narrower than it looks, because the
same buyer can get 80% of the monitoring value for USD 29 to USD 99, which
compresses the addressable segment to those who value the act-and-publish layer
specifically. That is a real objection and it is addressed in sections 7 and 8.

### 5.2 The arithmetic the target requires

Model: monthly gross adds `G`, monthly logo churn `c`, so
`N(t) = (G/c) x (1 - (1-c)^t)`.

Churn assumption: **5% per month**, which is a mid-range figure for self-serve
B2B SaaS at a EUR 99 to EUR 499 monthly price with no annual lock. It is an
`ASSUMPTION`. BrandGEO has no churn history, and cannot have one: seven active
clients and zero completed self-serve checkouts is not a cohort. The question
that would resolve it: *how many of the seven active clients have cancelled or
downgraded, and after how many months?*

| Horizon to 1,000 | Required gross adds per month | Steady-state adds needed to hold 1,000 |
|---|---|---|
| 24 months | **71 per month, every month** | 50 per month, forever |
| 36 months | **59 per month, every month** | 50 per month, forever |
| 48 months | **54 per month, every month** | 50 per month, forever |

Note the floor: at 5% monthly churn, holding 1,000 customers costs 50 new
customers every single month indefinitely. **The target is not a summit, it is a
treadmill.** Reaching 1,000 and then easing off means falling off it.

At 3% churn the 24-month requirement falls to about 57 per month; at 7% it rises
to about 84. The shape of the conclusion does not change.

### 5.3 The traffic that implies

Using the conversion rates in `docs/research/competitive-and-conversion-2026-07-28.md`
section 4.5 (B2B SaaS landing pages average 2 to 5%, top performers 8 to 15%) and
a standard freemium free-to-paid band of 2 to 5%:

To land **71 new paying customers per month**:

| Free-to-paid | Free signups needed / month | At 3% visit-to-signup | At 5% visit-to-signup |
|---|---|---|---|
| 3% | 2,367 | **78,900 visits/mo** | 47,340 visits/mo |
| 5% | 1,420 | **47,333 visits/mo** | 28,400 visits/mo |
| 10% (trial with card, optimistic) | 710 | 23,667 visits/mo | 14,200 visits/mo |

**Call it 30,000 to 50,000 relevant monthly visitors, sustained, as the honest
requirement.**

Against measured reality: **38 distinct domains have ever run the free audit,
and 1 lead exists.** Site traffic itself could not be read from this session
(Plausible is not reachable here, see section 11), but the audit tool is the
site's primary conversion instrument and its lifetime total is 58 runs. The gap
between where the funnel is and where it must be is roughly three orders of
magnitude.

### 5.4 Unit economics and the CAC ceiling

At EUR 299 with the owner's stated 11.4% API cost (EUR 34.14):

- Gross profit per customer per month: **EUR 264.86** (88.6%)
- At 5% monthly churn, mean customer lifetime is 20 months
- **LTV, gross-margin basis: EUR 5,297**
- CAC ceiling at a 3:1 LTV:CAC rule: **EUR 1,766**
- CAC ceiling at a 12-month payback rule: **EUR 3,178**

**On paper the CAC ceiling is generous, and this is the trap.** A EUR 1,766 CAC
allowance looks like permission to buy customers. It is not, for a bootstrapped
operator, because of working capital: 1,000 customers at even a modest EUR 800
blended CAC is **EUR 800,000 of cash spent before the last customer has paid
back**. Payback at EUR 800 CAC is three months of gross profit per customer, so
the business is cash-negative on every new customer for a quarter, at 71
customers a month, indefinitely.

**The binding constraint is not CAC efficiency. It is cash to fund CAC at all.**
This is precisely the difference between Peec, which raised USD 29M and spent
it, and Otterly, which raised nothing and is at roughly one fifth of the target.

Achievable CAC on the channels actually available:

| Channel | Realistic CAC | Realistic volume ceiling | Note |
|---|---|---|---|
| Owned content and the 79-page research estate | **Low, near zero marginal** | Unknown, potentially high | The genuine asset. 27 city pages, 10 industry, 10 comparison, 19 research articles, one published paper with a DOI. This is more owned content than most competitors at this stage. |
| Free public audit as a lead magnet | Low | High if traffic exists | Currently converting 1 lead from 38 domains. The instrument works; nothing is feeding it. |
| Paid search on GEO and AI-visibility terms | **High and rising** | Capped by budget | Profound and Peec are bidding with venture money. A bootstrapped operator loses this auction. |
| Founder-led outbound and LinkedIn | EUR 100 to 400 in time | **10 to 25 customers/month at absolute best, solo** | Hard ceiling: a single founder cannot run 71 closes a month. |
| Agency and partner reselling | Low per end-customer | Potentially high | Underused. Peec sells to "brands **and agencies**"; Rankscale ships white-label and affiliate at its Growth tier. BrandGEO has no partner motion. |

**One founder cannot manually acquire 71 customers a month. No configuration of
outbound gets there. The target requires either a self-serve funnel converting
at scale, which requires traffic that does not exist, or a partner channel,
which does not exist, or hires, which require capital that does not exist.**

---

## 6. Verdict on the 1,000-customer question

**Not feasible on the current shape.** Stated as three conditions, all of which
must hold, none of which does:

1. **30,000 to 50,000 relevant monthly visitors, sustained.** Currently: 38
   distinct domains have ever touched the free audit.
2. **A self-serve checkout that converts.** Currently: `stripe_events` is empty
   and all seven active clients appear to have been provisioned by hand.
3. **A price that survives a two-tab comparison.** Currently: EUR 8.54 per
   prompt against a market median near USD 1.60.

**What target is realistic.** Reasoning: BrandGEO starts from 2 Growth customers
and a dead funnel. Assume three months of funnel repair before any compounding,
then a ramp from roughly 2 to 3 new paying customers a month in quarter two to
roughly 10 to 15 a month by quarter four, driven by the content estate and the
free audit rather than by paid acquisition. That yields:

> **12 months: 60 to 90 paying customers, EUR 15,000 to EUR 25,000 MRR, EUR 180K
> to EUR 300K ARR**, blended across the ladder at a realistic average nearer EUR
> 250 than EUR 299.

That is 6% to 9% of the stated target and it would be a good year. It would also
put BrandGEO on a trajectory comparable to Otterly's, which is the correct peer.

**1,000 x EUR 299 is a 48 to 60 month objective at bootstrapped growth rates, or
a 24 to 30 month objective with roughly EUR 1.5M to EUR 3M of capital and two to
four go-to-market hires.** Those are the only two paths. There is no third path
where the current shape gets there.

Strongest counter-argument to this verdict, stated fairly: Peec went from zero
to EUR 650K ARR in four months, before most of its capital arrived and before it
had a sales organisation. Early category velocity in GEO is genuinely
extraordinary and a single channel breaking open (one research page becoming the
cited answer for a high-intent query, one agency partnership delivering 40
sub-accounts) can bend the curve in a way this model does not capture. That
possibility is real. It is not a plan, and it does not survive being made the
plan.

---

## 7. Packaging critique

### 7.1 Growth PRO at EUR 449 confuses more than it converts

What the buyer sees on the card: **35 prompts on Growth, 35 prompts on Growth
PRO.** The headline number, the one that anchors every competitor's pricing
page, does not move for a 50% price increase.

What actually changes, from `planConfig.ts`: engines 5 to 7 (adds Grok and
Google AI Overviews), SEO pages 10 to 30, drafts 10 to 30, social channels 1 to
3, plus Instagram and TikTok as purchasable add-ons.

That is genuinely a real step, and materially better than the brief's premise
that it differs only on engines and audit depth. **The problem is not that the
step is thin. It is that the step is invisible on the axis the buyer reads
first.** A prospect scanning three cards sees 15 / 35 / 35 and concludes the
ladder stops at Growth.

**Ruling: prompts must move at every tier boundary, or prompts must stop being
the headline number on the card. Both are acceptable. Doing neither is not.**
Reason: a value metric that is flat across a 50% price step tells the buyer the
tiers are arbitrary. Counter-argument: engines are arguably the better metric for
this product, since coverage of Google AI Overviews is worth more to most brands
than 40 more prompts, and a card led by engines would show 3 / 5 / 7, which is a
clean ladder. That is a defensible alternative and it is cheaper to execute.
It fails only because every competitor prints prompts, so a buyer will convert
BrandGEO's card into prompts whether or not BrandGEO prints them.

### 7.2 Essentials at EUR 99 for 15 prompts is the weakest tier in the ladder

Otterly Lite is USD 29 per month for **15 prompts and 4 engines**, daily, with
unlimited seats and 1,000 GEO URL audits. BrandGEO Essentials is EUR 99 for **15
prompts and 3 engines**, weekly, with **zero** SEO pages and **zero** social
channels (`PLAN_SEO_PAGE_CAP.essentials = 0`, `PLAN_SOCIAL_CHANNEL_LIMIT.essentials = 0`).

**Essentials is approximately four times the price of a strictly superior
competing product.** It also carries none of the act-and-publish capability that
is BrandGEO's actual differentiator, so it is the tier least able to justify its
price and simultaneously the tier a price-shopping prospect lands on first.

**Ruling: Essentials as configured should not exist.** It is a tier whose only
function is to lose a comparison. See the recommended ladder in 7.5.

### 7.3 The free tier is weaker than BrandGEO's own free public audit

`PLAN_ENGINES.free = ['chatgpt']`, 5 prompts, monthly refresh. The free
prospect-facing audit runs five engines
(`_prospect_engines.js` `FULL_ENGINES`, per the note at `planConfig.ts:50-52`).

**A prospect who runs the free audit sees five engines, signs up for the free
plan, and gets one.** The identical incoherence was already found and fixed once
for Google AI Mode, by moving it into Growth on 2026-07-28. The general form of
the bug survived the specific fix.

**Ruling: the free plan must be at or above the free audit in engine coverage.**
Reason: the product's first paid-adjacent experience currently reads as a
downgrade from the free one, which is the single most expensive possible moment
to lose trust. Counter-argument: free-tier engine cost is real, and the free
budget is EUR 0.30 per month, which buys exactly one 1-engine run of 5 prompts.
That is answered by raising the free budget, not by keeping the incoherence:
even at 3 engines and 10 prompts the marginal cash cost is on the order of EUR
1.50 per free account per month, and two of the three cheapest engines are not
marginal cash at all (see 8.1).

### 7.4 Is 35 prompts the right value metric at EUR 299?

**No, on two independent grounds.**

First, competitively: section 3 shows BrandGEO loses this comparison by five to
twenty times. A value metric you lose on is not a value metric, it is a
liability printed on your own pricing page.

Second, and more important, **prompts do not measure the value BrandGEO
delivers.** BrandGEO's distinctive capability is not seeing the gap, it is
closing it: site audit, recommendations, drafts, social posts. A customer who
tracks 35 prompts and publishes 10 drafts got more value than one who tracks 300
prompts and publishes nothing. Prompts measure the cheap half of the product.

**Assessed alternatives:**

| Metric | Verdict |
|---|---|
| **Per brand or domain** | **Best fit.** It is what the customer actually has one of, it scales naturally into agencies (the highest-volume ICP), it makes prompts a generous inclusion rather than a scarcity lever, and it is how Scrunch, SE Visible and Rankscale already sell (brands and dashboards). |
| Per engine | Reject. Otterly does this and it is actively disliked: gating Claude and Gemini behind USD 9 to USD 439 add-ons reads as nickel-and-diming, and it makes the product's coverage claim conditional. |
| Per seat | Reject as the primary metric. Otterly, Rankscale and Visiblie all ship unlimited or generous seats. Charging per seat against that is a losing comparison, and seats do not correlate with cost of delivery here. |
| Per market or country | Keep as an **add-on**, not the primary metric. Real cost driver, but too abstract to lead with. |
| Per action taken (drafts published, pages optimised, posts shipped) | **Directionally correct and premature.** This is the metric that matches BrandGEO's actual value, and it is what the ladder should eventually be built on. It requires activation data the product does not yet have. Revisit once there are 50 customers to observe. |

### 7.5 Recommended ladder

**Ruling: hold EUR 299 for Growth, triple what it contains, delete Essentials as
configured, and make Growth PRO a real step.** Reason: the price point is
validated by Peec's implied ACV of about USD 278, so the price is right and the
fill is wrong; and at 7 customers the binding constraint is acquisition, not
gross margin.

| Tier | Now | Recommended | Rationale |
|---|---|---|---|
| **Free** EUR 0 | 5 prompts, 1 engine, monthly | **10 prompts, 3 engines, monthly, 1 site audit** | Must not be weaker than the free public audit (7.3). Proves the gap exists, which is the only job a free tier has. |
| **Starter EUR 79** (replaces Essentials) | Essentials EUR 99, 15 prompts, 3 engines, no SEO, no social | **50 prompts, 5 engines, weekly, 5 SEO pages, no social** | Meets Otterly and Peec at the entry point instead of losing to them by 4x. EUR 79 sits just under Peec Starter (EUR 85) and under the psychological EUR 100 line. |
| **Growth EUR 299** (unchanged price) | 35 prompts, 5 engines, 10 SEO pages, 10 drafts, 1 social channel | **150 prompts tracked (35 refreshed weekly, 115 monthly), 7 engines, 20 SEO pages, 20 drafts, 1 social channel** | Matches Peec Pro's 150 prompts, adds two engines Peec does not have, and adds the entire act-and-publish layer nobody at this price has. This is the tier that must win the comparison. |
| **Growth PRO EUR 599** (was 449) | 35 prompts, 7 engines | **400 prompts (75 weekly), 7 engines, 3 brands or markets, 50 SEO pages, 60 drafts, 3 social channels, IG and TikTok included** | Makes the step visible on the headline metric and adds multi-brand, which is what agencies actually buy. |
| **Managed from EUR 1,500** | unchanged | unchanged | Not the problem. Done-for-you pricing is defensible and undercuts the agency floor. |
| **Enterprise** | custom | unchanged | Fine. |

**The split refresh cadence is the load-bearing mechanic.** Selling 150 tracked
prompts while refreshing 35 weekly and the remainder monthly makes the card
competitive without multiplying collection cost by four. Customers pick which
prompts sit in the weekly core. See section 8 for the cost arithmetic and the
constraint it breaks.

**Risks of this ladder, named:**

1. **It breaks the 12% API ceiling if implemented naively.** Section 8 quantifies
   this and rules on it. This is the most serious objection and it is not waved
   away.
2. **Growth PRO from EUR 449 to EUR 599 is a price increase on a live tier.** Per
   `PRICING-STRATEGY-2026-07.md` section 11 the policy is no grandfathering,
   migration at renewal with notice. Customer impact is small in absolute terms,
   because there appear to be zero Growth PRO customers, but it is a real
   migration and it needs Constantin's sign-off. **This triggers a human
   checkpoint. See section 12.**
3. **Deleting Essentials strands the one active Essentials client.** One row,
   `category = 'active'`, created 2026-07-23. Either migrate at renewal onto
   Starter EUR 79 (a price decrease, so easy) or hold them on a legacy price,
   the same pattern `stripe-webhook.js:52-55` already uses for two superseded
   prices.
4. **Raising Growth's prompt count raises the credibility bar on collection
   reliability.** 150 tracked prompts that fail to refresh is worse than 35 that
   work. Nothing should ship here before the collection pipeline is proven at
   the higher volume.

---

## 8. The 12% API-cost constraint, challenged

The brief calls this a hard constraint. **It is the single mechanism most
responsible for BrandGEO's uncompetitive position, and it should be
renegotiated rather than obeyed.** Here is the case.

### 8.1 Three of the five Growth engines are not marginal cash

From `planConfig.ts:243-277`, which is unusually honest about its own numbers:

- **Gemini**: list price EUR 0.032 per grounded call, but "the first 1,500
  requests per DAY are free and BrandGEO has made ~200 grounded calls in total,
  so the true marginal cost today is EUR 0."
- **Google AI Mode** (EUR 0.046) and **Google AI Overviews** (EUR 0.069) are
  both in `FIXED_FEE_ENGINES` and both draw on "the SAME SerpApi monthly plan".
  Unused searches expire at renewal. These are a fixed subscription, not a
  per-collection cost.

The file's own summary: "True cash out is lower again, 6.5 to 7.8% of price,
because gemini and google_ai sit inside the modelled figure without being
marginal spend."

**Real marginal cash per prompt-run on Growth's engine set** = ChatGPT 0.108 +
Claude 0.033 + Perplexity 0.005 = **EUR 0.146**. ChatGPT alone is 74% of it.

### 8.2 What the recommended Growth tier actually costs

| Configuration | Runs per month | Marginal cash EUR/mo | % of EUR 299 |
|---|---|---|---|
| **Today: 35 prompts weekly** | 151.6 prompt-runs | **22.14** | **7.4%** |
| Recommended: 35 weekly + 115 monthly | 266.6 prompt-runs | **38.93** | **13.0%** |
| Naive: 150 prompts all weekly | 649.5 prompt-runs | 94.83 | 31.7% |

The recommended split lands at **13.0% of price in marginal cash**, against a
current actual of 7.4% and an enforced ceiling of 15%
(`PLAN_MONTHLY_API_BUDGET_EUR.growth = 44.85`, raised from 12% to 15% on
2026-07-29). **It fits under the ceiling already in the code.** It exceeds the
12% figure quoted in the brief, which the code superseded the same day.

Note also that the owner's stated EUR 34.14 for Growth is an all-in figure
including audits, drafts, recommendations, prompt suggestions and ticket triage,
not collection alone. Those layers do not scale with prompt count, so tripling
prompts does not triple them.

### 8.3 Ruling

**The 12% ceiling should be retired and replaced with a 15% ceiling on marginal
cash, which is what `_cost.js` already enforces.** Reason: 88% gross margin on a
product with seven customers is worth EUR 0, and the ceiling is currently being
paid for with the prompt count, which is the number that loses BrandGEO the sale.

Strongest counter-argument, and it is a good one: at 1,000 customers a 21% API
line is roughly EUR 63,000 per month of real cash out, and if growth stalls that
is unrecoverable without a repricing that costs trust. **The mitigation is the
split cadence.** Because only the weekly core scales with frequency, cost grows
with proven engagement rather than with the number printed on the card, and the
long tail can be throttled per-account without touching the published offer.

Second lever, worth its own task: **ChatGPT is 74% of marginal collection cost
at EUR 0.108 per call**, measured, up from EUR 0.056 modelled. The engine cannot
be swapped, since the product exists to measure ChatGPT, but response length,
reasoning settings and retrieved-context billing are all levers on the same
call. A 30% reduction there is a 22% reduction in total collection cost. That is
an engineering task for `bg-backend`, not a pricing decision, and it is worth
more than any tier change in this document.

---

## 9. The value proposition, stated for the buyer

### 9.1 The ICP that pays EUR 299 a month at volume

**Primary: the digital marketing agency running AI visibility for 3 to 20 SMB
and mid-market clients.**

Evidence: Peec's own pricing page describes its customers as "3000+ brands **and
agencies**" (fetched 2026-07-29). Rankscale's EUR 385 Growth tier is explicitly
agency-shaped, with white-label, affiliate commissions and a directory listing.
Scrunch sells seats and personas. The agency is the only buyer in this category
for whom EUR 299 a month is a cost of goods rather than a discretionary line
item, and it is the only buyer who arrives with ten prospects behind them.

**Secondary: the in-house marketer at a 20 to 200 person B2B services or SaaS
company who already owns SEO and has just been asked by a founder why the
company does not appear in ChatGPT.**

**The moment of pain**, and it is worth being specific because it dictates every
piece of copy downstream: it is not a slow realisation. It is a single moment in
which someone senior types the company's own category question into ChatGPT in
front of them and three competitors come back and they do not. The pain is not
analytical, it is social. The buyer needs an answer to "what are we doing about
it" by the end of the week.

This is `ASSUMPTION`. It is consistent with the category's headline conventions
recorded in the prior research (win, own, validate) and with the free audit's
design, but BrandGEO has no recorded customer interview confirming it. The
question that would resolve it: *for each of the seven active clients, what
specific event caused them to look for a tool, and who inside the company
noticed first?* That is a fact only Constantin holds, and it is the highest-value
missing input in this entire document.

### 9.2 The one-sentence claim

Positioning thesis, not copy. `bg-copy` writes the words.

> **Every other AI visibility tool tells you that AI is not recommending you.
> BrandGEO is the one that then writes and publishes the pages and posts that
> change the answer.**

The proof element that earns it is not a number and not a logo. It is a live,
narrow demonstration: the free audit finds a real gap on the visitor's own
domain, and the very next screen shows the actual draft that would close it,
generated for them, not described. BrandGEO already has every component of that
sequence built. It is not currently sequenced that way.

**Why this claim and not another.** It is the only claim in the available set
that is simultaneously (a) true, (b) not made by any of the 27 other tools
surveyed, and (c) unaffected by BrandGEO losing the prompt-volume comparison.
Every competitor in section 2.1 stops at measurement or at recommendations. SEO.AI
at USD 299 is the closest thing to a competitor on this axis, and it is an SEO
agent that mentions ChatGPT visibility rather than a GEO platform that publishes.

Strongest counter-argument: "does the work" claims raise the delivery bar
enormously and are punished hard when the work is mediocre. A draft that a
marketer would not publish is worse than no draft. This claim commits BrandGEO
to output quality as its core promise, which is a much harder promise to keep
than a dashboard.

### 9.3 Where breadth is a liability

Four pillars plus ticketing plus competitor tracking plus a public audit tool is
a lot of surface for a EUR 299 product from an unknown vendor.

- **Liability 1: it makes the monitoring comparison unavoidable and losable.** A
  broad product still gets compared on the narrow axis, because that is the axis
  with a number on it. Section 3 is the cost of that.
- **Liability 2: it reads as unfinished rather than complete.** Seven capabilities
  from a company with no named customer reads as a prototype. Two capabilities
  done visibly well reads as a product. AI Social is currently gated to
  `enterprise` in `FEATURE_MIN_PLAN` while the feature is finished, which is
  correct engineering and confusing packaging: it is sold on the Growth card and
  gated above it.
- **Liability 3: it multiplies the surface that must be non-embarrassing.** The
  dashboard audit already found a zero-data tenant sees "0% AI VISIBILITY SCORE"
  across six dimensions and `/sentiment` renders as a dead end. Every additional
  pillar is another first-run experience that can fail.

**Ruling: sell two things, ship seven.** The pitch is measure and fix. Sentiment,
competitors, social and ticketing are evidence that the fix is thorough, not
separate value propositions. Per the standing guardrail, four pillars must never
become four value props, and the current pricing card is one step away from
exactly that.

---

## 10. Ranked plan

Ordered by expected effect on the only number that matters, which is new paying
customers per month. Each item states what would validate it and what would kill
it.

| # | Move | Why first | Validates if | Kills it if |
|---|---|---|---|---|
| **1** | **Fix the prompt count on Growth to 150 tracked with a split refresh cadence, and hold EUR 299.** | This is the single change that moves BrandGEO from worst-in-market to competitive on the number every prospect compares. Costs 13% of price in marginal cash, under the ceiling already enforced in code. | Comparison-page bounce rate falls; free-to-paid rate on Growth rises above 3%. | Collection reliability degrades at 150 prompts, or measured cost exceeds 15% of price in two consecutive months. |
| **2** | **Feed the free audit.** It converted 1 lead from 38 domains and has been idle since 2026-07-26. The instrument exists; the traffic does not. Route every one of the 79 published pages into it with a single prominent entry point. | Zero build cost. The content estate is already the largest owned asset BrandGEO has and it is not connected to the conversion instrument. | `prospect_audits` distinct domains per week reaches 50 and holds for four weeks. | Four weeks of routing produces under 10 domains a week, which would mean the pages have no traffic and the problem is upstream of the funnel. |
| **3** | **Instrument and prove one self-serve purchase end to end.** `stripe_events` is empty. Until one checkout completes and provisions correctly without a human, there is no self-serve business to scale. | Everything in this document assumes a working self-serve path. That assumption is currently unverified. | One real checkout completes, provisions the right plan, and the customer reaches first collection unaided. | Checkout completes but provisioning needs manual repair, which would make 1,000 customers operationally impossible regardless of demand. |
| **4** | **Replace Essentials EUR 99 with Starter EUR 79 at 50 prompts and 5 engines.** | Essentials is currently 4x a strictly better competitor and is the tier price-shoppers land on. It is actively costing sales. | Entry-tier signups rise and at least 15% upgrade within 90 days. | Starter cannibalises Growth rather than feeding it, visible as Growth's share of new paid falling below 40%. |
| **5** | **Build an agency motion: multi-brand, white-label, a partner price.** | The agency is the only ICP that arrives with ten prospects behind it, and it is the only channel that scales customer count without scaling founder hours. Peec and Rankscale both sell here; BrandGEO does not. | Three agencies sign and each brings two or more end clients within 60 days. | Agencies want done-for-you rather than tooling, which would push them into Managed and cap volume. |
| **6** | **Cut ChatGPT collection cost.** It is 74% of marginal cash at EUR 0.108 per call, measured. A 30% cut funds the entire volume increase in move 1. | Pure engineering, no customer-facing risk, and it is the only lever that makes higher volume permanently affordable. | Measured `ai_results.cost_eur` for chatgpt falls below EUR 0.075 with no loss in mention-detection accuracy. | Accuracy degrades, in which case the cost is the price of the product working. |
| **7** | **Fix the free tier to 3 engines and 10 prompts.** | A prospect currently downgrades from the free public audit by signing up. Small change, removes a trust break at the worst possible moment. | Free-plan 30-day retention rises above 40%. | Free-tier cost per account exceeds EUR 3 per month at volume. |
| **8** | **Reconcile the three contradictory prompt counts and mark the two stale sources.** | Documentation hygiene, but it will otherwise cause a wrong pricing decision within weeks. | `planConfig.ts` comment and `PRICING-STRATEGY-2026-07.md` section 3 both carry a stale marker. | Nothing. Do it. |
| **9** | **Do not ship the Profound comparison block as scoped.** | It is a chosen comparison that a prospect can disprove in one tab. Reputational downside exceeds the conversion upside. | n/a, this is a stop. | n/a. |

### 10.1 The realistic 12-month picture

| Month | New paying / mo | Cumulative paying | MRR (blended ~EUR 250) |
|---|---|---|---|
| 0 | n/a | 7 active | unknown, see 11 |
| 3 | 1 to 2 | 10 to 12 | EUR 2,500 to 3,000 |
| 6 | 4 to 6 | 25 to 35 | EUR 6,000 to 9,000 |
| 9 | 7 to 10 | 45 to 60 | EUR 11,000 to 15,000 |
| **12** | **10 to 15** | **60 to 90** | **EUR 15,000 to 25,000** |

`ASSUMPTION` throughout, and it is a model rather than a forecast. It assumes
moves 1 through 4 land, no paid acquisition, no hires, and 5% monthly churn.
Reaching the top of that band would make BrandGEO's first year comparable to
Peec's pre-funding period and ahead of Otterly's trajectory at the same age.

---

## 11. What I could not confirm

Listed rather than smoothed over. Each has the question that would resolve it.

1. **Whether the seven active clients pay, what they pay, and whether any has
   churned.** Not derivable from the schema. `client_events` holds 2 rows.
   *Question: for each of the seven `category = 'active'` clients, what is the
   monthly amount invoiced, on what plan, since when, and has anyone cancelled?*
   This is the highest-value missing input in the document. It converts the
   churn `ASSUMPTION` in section 5.2 into evidence and it is the only thing that
   would materially change the 12-month number.
2. **Whether `stripe_events` being empty means no purchase has ever completed.**
   The table may postdate the webhook. *Question: does the BrandGEO Stripe
   account show any completed subscription checkout, ever?*
3. **getbrandgeo.com traffic.** Plausible is not reachable from this session and
   no analytics export exists in the repo. Section 5.3's traffic requirement is
   therefore stated as a requirement, not as a gap measured against a known
   current figure. *Question: what are unique visitors per month for the last
   three months?*
4. **BrandGEO's live Stripe configuration.** The connected account is
   TalentWeLove. BrandGEO's prices were verified from `stripe-webhook.js` and
   `site.js` and are internally consistent with `planConfig.ts` and the published
   page, but the live account was not read. Nothing in this document depends on
   an unverified Stripe number.
5. **Peec AI's exact prices.** peec.ai/pricing renders prices in JavaScript and
   returned tier names and feature counts only. The EUR 85 / 205 / 425 figures
   are secondary-sourced and should be re-verified in a browser before appearing
   in any public comparison. The tier structure, model counts, project counts and
   the "3000+ brands and agencies" claim are first-party from that fetch.
6. **Otterly's revenue.** USD 770K is a Latka third-party estimate, not
   disclosed. Otterly's zero funding, seven-person headcount and 2023 founding
   are well attested. The section 4.1 conclusion leans on the latter, not the
   former.
7. **Customer counts for 20 of the 28 tools mapped.** No credible figure exists
   publicly. None was estimated. Review-site volumes and job postings were
   considered as proxies and rejected: they would have produced numbers that look
   like evidence and are not.
8. **AthenaHQ, Goodie, Brandlight, Evertune, Conductor and seven smaller tools'
   pricing** is secondary-sourced. Goodie in particular has two conflicting
   figures (USD 399 and USD 495) from different sources and neither was
   first-party.
9. **Whether the 27 `category = 'research'` clients consume the same collection
   budget as customers.** If they do, they are a real and unmodelled cost line.
   *Question: are the research tenants collecting on the same schedule as paying
   clients?*

---

## 12. Human checkpoint

Three of this document's rulings change what a paying customer gets or pays, so
per AGENT-OS section 6 they stop here rather than proceeding on a best guess.

```
=== HUMAN CHECKPOINT ===
NEED:      Do you accept (a) Growth staying at EUR 299 but containing 150
           tracked prompts with a split weekly/monthly refresh, (b) Growth PRO
           moving from EUR 449 to EUR 599 with 400 prompts and multi-brand, and
           (c) Essentials EUR 99 being retired in favour of Starter EUR 79?
WHY:       BrandGEO Growth is currently EUR 8.54 per tracked prompt against a
           market median near USD 1.60, which is the comparison every prospect
           makes first and the one BrandGEO loses worst.
OPTIONS:   A) Accept all three -> competitive on the headline metric; marginal
              API cost rises from 7.4% to 13.0% of price, inside the 15% ceiling
              already enforced in _cost.js; one Essentials client and zero
              Growth PRO clients need migration at renewal.
           B) Accept (a) only -> fixes the tier that matters most, leaves the
              flat 35/35 prompt count between Growth and Growth PRO, which
              continues to read as an arbitrary ladder.
           C) Reject all -> pricing unchanged; the 1,000-customer target becomes
              unreachable on any horizon, since the funnel cannot be repaired
              into a losing comparison.
DEFAULT:   Nothing changes. This is an analysis artifact only. No code, price,
           Stripe object, or published page was touched, and none will be
           without your explicit instruction.
TO RUN:    Nothing to run. Reply with A, B or C, or with the correction.
TO VERIFY: The artifact is at
           C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\strategy\pricing-and-1000-customer-feasibility-2026-07-29.md
           and is uncommitted. `git status` will show it as untracked.
=== END CHECKPOINT ===
```

**Second checkpoint, separate decision:** the single highest-value input missing
from this analysis is what the seven active clients actually pay and whether any
has churned. Supplying "we have N customers paying Y, and M have cancelled since
Z" converts the central `ASSUMPTION` in section 5.2 into evidence and would
justify re-cutting section 10.1.

---

## 13. Handoff packet

Per `.claude/handoffs/_TEMPLATE.md`. Number to be allocated by `bg-orchestrator`
at write time, not reserved here.

```markdown
---
from: bg-strategy
to: bg-orchestrator
status: NEEDS_HUMAN
scope_write: (none, pending the section 12 ruling)
scope_read: docs/strategy/pricing-and-1000-customer-feasibility-2026-07-29.md,
            docs/PRICING-STRATEGY-2026-07.md,
            brandgeo-dashboard/src/lib/planConfig.ts
model: opus
---

## Decision
1,000 customers at EUR 299 is not feasible on the current shape. Realistic
12-month target is 60 to 90 paying customers and EUR 15,000 to 25,000 MRR.
The binding constraints are, in order: no funnel (38 lifetime free-audit
domains, 1 lead, 0 stripe_events), a price that is 5 to 20x the market on
prompts, and no capital to fund CAC at the required 71 customers per month.
Growth should hold EUR 299 and triple its contents. Essentials should be
retired. The 12% API ceiling should be replaced by the 15% marginal-cash
ceiling already enforced in _cost.js.

## Do
(Blocked pending the section 12 ruling. On ruling A or B:)
1. bg-strategy amends this artifact into a packaged ladder spec.
2. bg-architect scopes the split refresh cadence (weekly core plus monthly
   tail) as a data contract, since it is a new concept in the collection
   scheduler and not a limit change.
3. bg-backend takes the ChatGPT cost-reduction task (move 6) independently;
   it is not blocked on the pricing ruling.
4. bg-web routes all 79 published pages into the free audit (move 2); not
   blocked on the pricing ruling.

## Do not
- Do not change any price, plan constant, plan_prompt_caps row, Stripe object,
  or published page on the strength of this document alone.
- Do not ship the Profound price/engine comparison block described in
  docs/research/competitive-and-conversion-2026-07-28.md section 5 item 1.
- Do not publish any customer count, logo wall, or "trusted by X" claim.
  BrandGEO has 7 active clients.
- Do not quote the 73% or 4.2x hero stats. Still uncited, still open.

## Acceptance criteria
- Every price in the artifact carries a date, a currency and a billing period.
- No customer count, revenue figure or testimonial appears without a source or
  an explicit ESTIMATE label with method.
- Section 11 lists every unverified item with the question that resolves it.
- No em dashes or en dashes anywhere in the artifact.
- The file is uncommitted and no git command was run.

## Open questions for Constantin
1. Ruling A, B or C on the ladder (section 12).
2. What do the seven active clients pay, and has any churned?
3. Has any self-serve Stripe checkout ever completed?
4. Monthly unique visitors to getbrandgeo.com for the last three months.
```

---

## Sources

Fetched or searched 2026-07-29 unless stated.

First-party pricing pages fetched: [Profound](https://tryprofound.com/pricing),
[Otterly.AI](https://otterly.ai/pricing/), [Rankscale](https://www.rankscale.ai/pricing),
[Scrunch](https://scrunch.com/pricing), [Peec AI](https://peec.ai/pricing) (tier
structure only, prices JS-rendered), [Brand24](https://brand24.com/pricing/),
[Ahrefs](https://ahrefs.com/pricing), [SEO.AI](https://seo.ai/pricing).

Funding, revenue and customer counts:
[Wilson Sonsini on Profound's USD 96M Series C](https://www.wsgr.com/en/insights/wilson-sonsini-advises-profound-on-dollar96-million-series-c-at-a-dollar1-billion-valuation.html),
[Fortune on Profound](https://fortune.com/2026/02/24/exclusive-as-ai-threatens-search-profound-raises-96-million-to-help-brands-stay-visible/),
[Profound's own announcement](https://www.tryprofound.com/blog/profound-raises-96m-series-c),
[Peec AI's Series A announcement](https://peec.ai/blog/we-raised-21m-series-a-to-help-brands-win-in-ai-search),
[EU-Startups on Peec's EUR 18M](https://www.eu-startups.com/2025/11/berlins-peec-ai-lands-e18-million-as-demand-grows-for-ai-based-brand-visibility-tools/),
[TNW on Peec at USD 10M ARR](https://thenextweb.com/news/peec-ai-berlin-10-million-arr-geo-ai-search),
[Latka's Otterly.AI estimate](https://getlatka.com/companies/otterly.ai),
[Crunchbase Otterly.AI](https://www.crunchbase.com/organization/otterly-ai),
[Crunchbase Evertune](https://www.crunchbase.com/organization/evertune-5d1a).

Secondary pricing aggregations, used only where marked secondary:
[Rankability's 22-tool comparison](https://www.rankability.com/blog/best-ai-search-visibility-tracking-tools/),
[Visiblie's tool pricing comparison](https://www.visiblie.com/blog/best-ai-visibility-tools),
[SE Ranking's ChatGPT rank tracking guide](https://visible.seranking.com/blog/chatgpt-rank-tracking-tools-2026/),
[Semrush AI Visibility Toolkit pricing](https://www.semrush.com/pricing/ai/),
[Trakkr on the Semrush add-on](https://trakkr.ai/reviews/semrush-review/pricing),
[Nick Lafferty's GEO tools list](https://nicklafferty.com/blog/best-generative-engine-optimization-tools-2025/).

Internal, read 2026-07-29: `brandgeo-dashboard/src/lib/planConfig.ts`,
`brandgeo-dashboard/netlify/functions/stripe-webhook.js`, `brandgeo/web/site.js`,
`brandgeo/web/index.html`, `docs/PRICING-SPEC.md`,
`docs/PRICING-STRATEGY-2026-07.md`,
`docs/research/competitive-and-conversion-2026-07-28.md`, `docs/AGENT-OS.md`,
and live SQL against Supabase project `duiyifepitvugyulobqm`.
