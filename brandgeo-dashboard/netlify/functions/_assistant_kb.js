/**
 * _assistant_kb.js: grounded knowledge base for the site chat assistant
 * (ASSISTANT-SPEC.md §3 "Grounding"). This is the authoritative product/
 * pricing/engine/research fact sheet the assistant answers from, and nothing
 * else. It was a faithful, self-contained copy of the facts in
 * brandgeo/web/llms-full.txt.
 *
 * DIVERGED DELIBERATELY 2026-07-29. Every plan, price, prompt count, engine
 * and refresh cadence below was re-derived from src/lib/planConfig.ts
 * (PLAN_PROMPTS, PLAN_ENGINES, PLAN_COLLECTION_COOLDOWN_HOURS),
 * netlify/functions/_cost.js (PLAN_LIVE_ENGINES, the copy that ENFORCES
 * entitlement), and the published pricing on brandgeo/web/index.html.
 * brandgeo/web/llms-full.txt still carries the SUPERSEDED ladder and engine
 * lineup and has to be brought up to this file, not the other way round.
 * Until that happens, THIS file is the correct one.
 *
 * WHY A COPY, NOT A READ. llms-full.txt lives in the static marketing repo
 * (brandgeo/web/), which is NOT bundled with these Netlify functions, so the
 * function cannot fs.readFileSync it at request time. The spec says to inline
 * the grounding; this module is that inline copy, kept in its own file so
 * assistant.js stays legible and so this text has one obvious place to be
 * updated when pricing/engines change. If you edit product facts here, also
 * edit brandgeo/web/llms-full.txt (and vice-versa) so the two never drift.
 *
 * CONTENT-INTEGRITY (CLAUDE.md §0): the assistant must answer ONLY from this
 * text. Anything not here → say so and offer a human hand-off. Never guess a
 * price, a claim, or a testimonial.
 */

const ASSISTANT_KB = `# BrandGEO grounded facts (authoritative; answer only from this)

## Company
- Name: BrandGEO. Website: https://getbrandgeo.com. Contact: support@getbrandgeo.com.
- Founder: Constantin Daniel, Founder. Founded 2026. HQ: Santa Cruz de Tenerife, Canary Islands, Spain (EU/GDPR).
- Category: AI Visibility / Generative Engine Optimization (GEO) monitoring software, a SaaS analytics platform with both self-serve and managed-service tiers, not a marketing agency alone.
- BrandGEO (getbrandgeo.com) is independent and unrelated to any similarly-named domain such as brandgeo.co or brangeo.app.

## What BrandGEO does
BrandGEO monitors how AI engines mention, rank, and describe a brand. It runs a client's real, commercial-buyer-style prompts against up to seven AI engines on a recurring basis: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok, and Google AI Overviews. How many of those a brand is monitored on depends on its plan (see Plans below). Google AI Mode and Google AI Overviews are two different Google surfaces and are measured separately: AI Mode is the conversational tab a user switches to on purpose, AI Overviews is the AI summary shown by default on an ordinary results page. Microsoft Copilot and DeepSeek are not live and are not collected on any plan. BrandGEO also tracks named competitors per prompt, sentiment trends over time, and surfaces a prioritized "Fix This" action hub of specific recommendations.

## Plans (all prices EUR)
- Free (€0/month): 1 project, 5 buyer prompts, ChatGPT only, monthly refresh, dashboard access, self-serve, no credit card.
- Essentials (€99/month or €990/year): 15 commercial prompts, 3 AI engines (ChatGPT, Gemini, Claude), weekly refresh, competitor tracking, self-serve, no setup fee.
- Growth (€299/month or €2,990/year): 35 commercial prompts, 5 AI engines (adds Perplexity and Google AI Mode), weekly refresh, site audit up to 10 pages, 1 onboarding call, self-serve, no setup fee.
- Growth PRO (€449/month or €4,490/year): 35 commercial prompts, 7 AI engines (adds Grok and Google AI Overviews), weekly refresh on a priority queue, site audit up to 30 pages, self-serve, no setup fee.
- Managed (€1,500/month or €15,000/year): 120 prompts, all 7 AI engines, plus a fully managed service (AI visibility strategy and prompt research, competitor and website AI audit, monthly executive report, monthly strategy call, priority support). Scoped on a consultation call rather than bought at checkout.
- Custom Enterprise (custom pricing, scoped with you on a call; there is no published figure): multiple brands and markets, more engines as they become available, white-label, dedicated support, custom integrations and SLAs.

Free, Essentials, Growth, and Growth PRO are self-serve software (the client configures their own prompts and markets at app.getbrandgeo.com) and are bought through Stripe checkout at the price shown. Managed and Custom Enterprise add a fully managed, done-for-you service on top: the BrandGEO team handles setup, ongoing strategy, research, and monthly reporting and strategy calls. Every tier includes dashboard access.

## Contracts, fees, refunds
- Monthly plans have no minimum term and can be cancelled at any time. Cancellation takes effect at the end of the current billing month.
- Annual options on Essentials, Growth, Growth PRO, and Managed are paid upfront for a 12-month term, and the price is locked for that term. Annual is equivalent to two months free versus paying monthly.
- No setup fee on any plan, and no hidden fees: the published price is the full price. Managed and Custom Enterprise pricing is agreed in writing before anything starts, never added after the fact.
- Refunds: monthly plans cancel anytime, with no proration on partial months already billed. An annual plan can be cancelled within 14 calendar days of the start date for a full refund, provided no reports have been delivered and no onboarding call has taken place. After that 14-day window the annual fee is non-refundable and service continues to the end of the paid term.

## Methodology
Structured query methodology, not a single brand-name lookup. During onboarding the team identifies the real commercial-buyer questions a brand's potential customers ask AI engines (e.g. "best catering company in Madrid"), then runs them across the engines included in the client's plan on a recurring schedule (weekly on every paid plan, monthly on Free) with live web search enabled where the engine supports it. Refresh frequency is the same on every paid tier; the tiers differ on engines, prompt volume, and site-audit depth. Each run measures: mention frequency, position (#1/#2/#3 when multiple brands appear), sentiment/framing, competitor comparison (vs 3-5 named competitors), the AI Visibility Score (0-100), and week-over-week trend.

## AI Visibility Score (0-100, weighted, six dimensions)
- Recognition (25%): overall mention rate, i.e. does the engine mention the brand at all across the prompts that matter.
- Knowledge (20%): when mentioned, how good is the position (#1 scores highest; decays toward a floor as position worsens).
- Sentiment (15%): positive / neutral / negative framing when mentioned.
- Accuracy (15%): share of mentions landing in the top 3 (a mention with no clear numbered position is treated as accurate by default).
- Reach (15%): share of the engines active on the client's plan that mention the brand in at least one prompt.
- Consistency (10%): share of tracked prompts where at least 60% of checked engines mention the brand.
Recalculated on every collection run so a brand can track its trend.

Per-engine, per-query-category status labels shown on the "Fix This" hub:
- KNOW: mentioned accurately and confidently (the target state).
- PARTIAL: mentioned with uncertainty, incomplete, or mixed with incorrect details.
- MISSING: not mentioned at all, or a competitor named instead.
The "Fix This" hub prioritizes moving an engine from MISSING → PARTIAL → KNOW, and moving up in position within an engine that already knows the brand.

## Free audit
A free, one-time AI Visibility audit, available once per brand domain (refreshable after 6 months). It covers five engines: ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode. It is a snapshot delivered within 48 hours: the AI Visibility Score, per-engine KNOW/PARTIAL/MISSING status, top 3 improvement areas, and a comparison against 1-2 direct competitors. It does NOT include dashboard access or ongoing monitoring; that's what the paid plans are for. Start it at https://app.getbrandgeo.com/signup (the domain can be pre-filled).

## Weekly report (on monitored tiers)
The overall score and its direction, exact quotes of what each engine said about the brand, competitor comparison, which engines did and didn't mention the brand, what changed since last week, and specific prioritized (P0/P1/P2) recommendations.

## Comparison to other tools
Most competing AI visibility tools (Peec, Profound, Otterly, Semrush AI Toolkit, and others) are self-serve SaaS dashboards only. BrandGEO offers that same self-serve path on Free, Essentials, Growth and Growth PRO, but also adds a genuinely done-for-you managed service on Managed and Custom Enterprise (the team handles strategy, research, and reporting directly), with the monitoring platform included, against the roughly $1,500-5,000+/month a dedicated GEO agency retainer typically costs for the service alone. Honest, two-sided comparison pages exist vs Peec AI, Profound, Otterly.AI, Scrunch AI, AthenaHQ, Rankscale, Ahrefs Brand Radar, Semrush AI Toolkit, Conductor, and Goodie AI. Comparison hub: https://getbrandgeo.com/blog.html#compare

## Research
BrandGEO publishes original research (BrandGEO Research) and a peer-citable open-access data paper on Zenodo titled "Cross-Engine Consensus in AI-Generated Brand Recommendations" (Constantin Daniel, BrandGEO, July 2026), DOI 10.5281/zenodo.21395598, CC BY 4.0, analyzing 222 real API responses across seven cities and five engines (that paper is a record of a specific 2026 run, so its engine list describes that dataset, not the current plan lineup). Research index: https://getbrandgeo.com/blog.html. There are also per-city AI Visibility Studies covering 27 cities in Europe and the US (London, Berlin, Madrid, Paris, Rome, Dublin, New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, San Francisco, Seattle, Denver, Washington DC, Boston, Detroit, Miami, Atlanta, Minneapolis, Tampa, Baltimore, Charlotte) and per-industry guides (SaaS, e-commerce, law firms, hotels, financial services, healthcare, real estate, home services, restaurants, education).

## Key links
- Pricing: https://getbrandgeo.com/#pricing
- Free audit / signup: https://app.getbrandgeo.com/signup
- Dashboard login: https://app.getbrandgeo.com
- FAQ: https://getbrandgeo.com/faq.html
- Support (existing customers): https://getbrandgeo.com/support.html
- Contact / support email: support@getbrandgeo.com`

module.exports = { ASSISTANT_KB }
