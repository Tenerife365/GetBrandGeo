# Landing rebuild research: beating peec.ai, tryprofound.com and ahrefs.com/es

**Run:** 2026-08-07
**Owner:** Product Design Researcher (research only, no design decisions, no code)
**Consumers:** the UI/UX designer and the interactive web developer who build from this
**Founder ruling being served:** the current landing page does not stand out and must beat the three references on visual design and client trust.

**Method.** Headless Chrome 139 driven over CDP (no Puppeteer, Node 24 global WebSocket). Every site loaded at 1440x900 and 375x812, scrolled end to end so lazy content mounted, then captured fold and full page. DOM read live at both widths: computed styles per element, font faces actually loaded, color frequency across the first 5,000 elements, container max-widths, every @keyframes rule name, scroll-driven timelines, hover rule counts, canvas/video/marquee inventory. Consent layers were removed from the DOM before capture (no consent was granted, elements were deleted locally): a cookie-banner class on peec, CybotCookiebot-style container on ahrefs, and Profound's custom dialog. Our own page was captured as served, consent bar included, because that is what a visitor sees.

**Evidence on disk.**
- Screenshots: `docs/design/landing-rebuild-research-2026-08-07/shots/` (18 canonical captures: `{site}-{width}-fold.png` and `-full.png`; ahrefs full pages are split into `-part1/-part2` because the page is 16,459px tall).
- Readable section crops: `shots/crops/` (35 bands used for the close reads below).
- Raw DOM extraction JSON per site and width was kept in the session scratchpad; every number quoted below is in this file, so the JSONs are not required reading.

**Relation to prior work.** `docs/research/competitive-and-conversion-2026-07-28.md` already settled tokens: violet `#8b5cf6` stays (hue 293, unoccupied; peec is 277-281), halation and CTA contrast fixed, mono-for-data-labels flagged as an open opportunity, the Profound price comparison block flagged as unbuilt. None of that is re-litigated here. This file covers what that one did not: layout, product visualization, motion, and trust architecture.

---

## 1. Teardown: peec.ai

**Stack:** Framer (meta generator `Framer c9b3949`). Fonts: Geist and Geist Variable, with Geist Mono and Fragment Mono declared for data. Light theme: `#171717` ink on `#f7f7f7`, gray `#737373` muted. One functional accent: green `rgb(34,197,94)` for positive deltas, a red reserved for negatives. Container: 1200px. Page height 10,100px.

### 1.1 Above the fold at 1440, element by element

| # | Element | What the visitor sees | Job |
|---|---|---|---|
| 1 | Black announcement bar | "AI Shopping Analytics" feature note with arrow, dismissable | News cadence: the product ships things |
| 2 | Nav | Logo left, five links center, Log in + solid black Sign up right | Wayfinding, one dark CTA |
| 3 | "We are hiring" pill, red dot, centered | Sits alone above the H1 | Momentum signal before any claim is made |
| 4 | H1, 64px Geist w400, two tones | "AI search analytics" in near-black, "for marketing teams" in light gray | Category + audience in one read; the two-tone split does the emphasis without bold |
| 5 | Subhead with inline UI chips | The metric names Visibility, Position, Sentiment are rendered as small bordered pills with icons inside the sentence | Product vocabulary shown as product UI; the sentence literally contains the interface |
| 6 | Two CTAs | Talk to Sales (light), Start Free Trial (solid black) | Sales-led and self-serve, visually ranked |
| 7 | Full-width dashboard, DOM-rendered, roughly the bottom 45% of the viewport | Labeled "Attio's Dashboard": real sidebar (Overview, Prompts, Sources, Models, Settings), filter chips (Last 7 days, All tags, All Models, Export), insight line "Attio's Visibility trending up by 5.2% this month", a multi-line competitor chart with a frozen dark tooltip listing Monday 65%, Salesforce 62%, Attio 47%, Zero 32%, Pipedrive 21% with their real favicons, and a ranked "Attio's competitors" table with delta arrows | The product IS the hero image, it names a design-respected customer, and it borrows recognition from famous competitor logos inside the data |

Everything is monochrome except the chart series and the delta arrows. Whitespace is extreme: pill, headline, one sentence, two buttons, product. Nothing else.

### 1.2 Product visualization strategy

A DOM-built dashboard, not a screenshot: text in it is crisp at every DPI and matches the site's type system exactly. The trick repeats down the page: six feature cards each contain a cropped, rebuilt slice of real UI (Tracked Prompts table, Suggested Prompts stack with volume chips, model pickers, sources tables, a Gartner-style quadrant with brand logos as data points). A floating chat-composer bar ("Organize prompts with tags", flag chip, send arrow) hovers over the dashboard, planting the prompt-driven mental model. No video anywhere; 119 images, 103 SVGs, zero canvas.

### 1.3 Trust architecture, in scroll order

| Order | Signal | Type of proof |
|---|---|---|
| 1 | "We are hiring" pill above the H1 | Momentum |
| 2 | "Attio's Dashboard" label on the hero product | Named customer, implied permission |
| 3 | "Trusted by 3000+ brands and agencies", bold count, directly under the hero product | Volume claim |
| 4 | Logo wall split into two labeled pill groups: Brands (Zalando, Attio, Squarespace, Brevo, Hugo Boss, n8n, Omio, TUI Group, Wix, Fielmann) and Agencies (Seer Interactive, Peak Ace, Eskimoz, Omniscient, Kinesso, Mindshare, FirstPage...) | Logos, segmented by buyer type so both audiences find themselves |
| 5 | Named expert quote mid-page: Lily Ray, VP SEO Strategy, Amsive | Authority borrow from a famous industry figure |
| 6 | Six-card testimonial grid: Crystal Carter (Wix), Ethan Smith (CEO, Graphite), Thomas Smeaton (Squarespace), Jon Gitlin (Merge), Sepy Bazzazi (Glide), Artur Kosch | Specific outcomes ("5x year-over-year increase in traffic and demo requests from LLMs", "ranking within 24 hours") |
| 7 | Dark CTA band with an angled product shot full of competitor logos | Product-as-proof, restated |

No security badges, no data-scale claims, no review stars. Peec's entire trust story is "who uses it and what experts say".

### 1.4 Interaction and motion inventory

- Scroll-triggered reveals on section cards (opacity plus rise; our capture caught cards mid-fade, confirming viewport-triggered states that also re-hide upward).
- One CSS scroll-driven timeline; 3 named keyframes total (`__framer-loading-spin`, `__pricing_skeleton_pulse`, `tooltipFadeIn`). This is a LOW-motion page.
- The frozen chart tooltip in the hero reads as a hover state caught mid-interaction: motion implied, not played.
- 82 elements with backdrop-filter, 230 with gradients: the budget went to material depth, not movement.
- 9 hover rules. Buttons darken, cards lift slightly. Nothing moves unless the visitor moves.

Verdict: decorative motion near zero; explanatory "motion" is done with still frames that imply interaction (tooltip, composer bar, mid-scroll states). Comprehension load is carried by layout, not animation.

### 1.5 Typography and space

- Geist w400 for a 64px H1 with 1.0 line-height and -2% tracking. Weight 500 for H2 (39px) and nearly all UI text. Bold barely exists; hierarchy is size and tone, not weight.
- Working scale in the histogram is tight and integer: 10, 11, 12, 13, 14, 16, 24, 32, 39, 64. The 95 most frequent text nodes are 14px w500.
- Hero-to-body contrast is 64:14, a 4.6x jump with almost nothing between. That gap is what makes the page feel calm.
- One 1200px container. Section paddings are enormous (the metrics section spends ~500px of pure whitespace around a three-card rail).

### 1.6 Best thing, worst thing

- **Best:** the hero dashboard with a named customer and competitor logos inside the data. One glance answers what it is, who uses it, and what the output looks like.
- **Worst:** below the six-step section the page becomes long and same-y (quote, MCP, reports, prompt wall, testimonials, CTA, FAQ) with weak scent between blocks; scroll fatigue sets in around 60%. Their reveal-on-scroll also re-hides content when scrolling back up, which reads as flicker on fast wheels.

---

## 2. Teardown: tryprofound.com

**Stack:** Next.js (Turbopack, Vercel). Font: Inter Variable only. Dark theme: text `rgb(237,242,245)` on near-black layered surfaces (`#0a0a0a` to `#1b1b1b`). Signal green `rgb(5,223,114)` for success states, pale blue `rgb(93,171,255)` for links/info, tiny doses of orange and mint. Container: 1088px. Page height 10,363px.

### 2.1 Above the fold at 1440, element by element

| # | Element | What the visitor sees | Job |
|---|---|---|---|
| 1 | Nav | Logo, Platform/Resources/Solutions dropdowns, Customers, Pricing, Careers, Log in, white Get a Demo | Enterprise posture (demo-first) |
| 2 | Announcement strip | Blue pill "The Profound Index" + "Understand where you stand in AI Search in your industry" | A free benchmark as a lead magnet, and an authority claim (we index the industry) |
| 3 | Blueprint frame | The hero sits inside a thin 1px bordered frame with dashed corner ticks, on a faint grid | Technical-instrument aesthetic; the page presents itself as an engineering surface |
| 4 | H1 56px w500, tracking -5% | "Marketing agents to win in [engine]" where the engine name AND its real logo rotate (Grok with logo at capture time) | The category claim contains the engines themselves; logo rotation communicates multi-engine coverage without a list |
| 5 | Sub 18px | "Reach millions of consumers who are using AI to discover new products and brands" | Market-size framing |
| 6 | CTAs | Get a Demo (white solid), Get Started (dark ghost) | Demo-led ranking |
| 7 | Bottom 40%: live agent-workflow demo | "AEO-Optimized FAQ Generator" workspace: template sidebar (Generate Blogpost from YouTube, PDP FAQ Generator, Schema Markup Generator, Initiate G2 Review Campaign, with third-party logos), node canvas (Start, Web Page Scrape, Determine Core Search Query, Perplexity FAQ Research) joined by connectors with animated beams and green Succeeded chips, plus a run log rail filling in | The product working, unattended, in real time |

### 2.2 Product visualization strategy

Fake-live, data-dense, DOM-rendered demos. Every feature row is the same grammar: left rail (name, one sentence, Learn more) and a large right visual that always contains numbers with deltas: Visibility Score by Persona (Budgeter 89.2% +5%...) over a five-series chart; Agent Analytics KPI row (AI Bot Visits 32.6K +12k, AI Citations 72.3K +12k) with a tooltip listing ChatGPT 276, Anthropic 121, Perplexity 97, Google AI 63, Microsoft 29 next to their logos; a Prompt Volumes widget with a typing caret ("Credit|") and autocomplete rows (credit 46.4M, credit card 12.1M). The page teaches the product's data model through plausible synthetic data, never labeled as sample, styled exactly like the app. No video, no canvas: 17 images, 97 SVGs, everything else is HTML.

### 2.3 Trust architecture, in scroll order

| Order | Signal | Type of proof |
|---|---|---|
| 1 | "The Profound Index" bar above the H1 | We benchmark the industry (authority) |
| 2 | Logo wall directly under the hero demo: "Used by the best marketers in the world" with 18 white enterprise logos (Calendly, Whoop, Plaid, Figma, US Bank, Deel, Mercury, Docusign, MongoDB, Comcast, Indeed, Ramp, Gamma, G2, Mejuri, Monster, Ashby, Clay) | Enterprise logos, the heaviest wall of the three references |
| 3 | Scroll-revealed declaration: "Over 100 million people search with AI every day. Brands that aren't recommended get left behind." | Data claim as drama, revealed line by line while scrolling |
| 4 | Ramp case study band: tilted card art, quote "Before Profound, AI Search was a black box. Now it's a competitive advantage." George Bonaci, VP of Growth and Demand, Read case study | Named customer, named VP, outcome quote |
| 5 | Free AEO Report section at ~60% depth: URL input, "Analyze my brand", checklist of what you get, next to a rendered report (AI Visibility Ranking: Ramp 90.1%, Cash 88.1%, Mercury 87.3%, Chase 86.9%, PayPal 82.4%; AEO Content Score gauge 91%) | Try-before-buy; the report preview sells the report |
| 6 | Zero Click 26 conference section: San Francisco and New York City cards drawn in dot-matrix ASCII art | Category leadership: they run the industry conference |
| 7 | Footer: Careers with a live count badge (85), "All services are online" green status dot, Vulnerability Reporting, AI Instructions page, Profound Index and Research Hub under a Data column | Infra-grade trust details |

### 2.4 Interaction and motion inventory

The heaviest and most deliberate motion system of the three. 48 named keyframes; the names describe intent: `profoundRankingNumberReveal`, `profoundChartPatternShimmer`, `profoundTableCellPulse`, `cursor-slide-in`, `cursor-float`, `blink-caret`, `selection-grow`, `cursor-fade-out`, `workflows-horizontal-beams`, `workflows-vertical-beams`, `ramp-cards-reveal`, `zero-click-gradient`, `scroll-mask-x/y-scroll`. Five CSS scroll-driven timelines (`animation-timeline`), 94 elements with transitions, 22 animating at rest.

What that vocabulary buys, concretely:
- **Fake cursors** slide in, hover, select, and click inside demos (Figma-multiplayer style colored cursors float around agent chips in the Try-an-Agent section).
- **Typing caret** animates queries into inputs (the Prompt Volumes widget).
- **Beams** travel along workflow connectors so the pipeline reads as flowing.
- **Numbers reveal** by counting/rolling when scrolled into view; table cells pulse as if data just landed.
- **Text declaration reveals** word-groups on scroll (the 100M section).

Verdict: nearly every animation explains something (the product runs, data flows, numbers land). Decorative-only motion is limited to the gradient in the Zero Click band and shimmer accents.

### 2.5 Typography and space

- Inter Variable only, w400/500. H1 56/64 w500 tracking -2.94px (-5.25%, the tightest of the set); H2 48/56; feature titles 18-24; body 14-16; data labels 13-14. Integer scale, no visible bold.
- 1088px container, generous but tighter than peec; density lives inside the demo panels, not the copy.
- The blueprint frame (1px borders, dashed corner ticks, faint grid) is the page's signature: it turns whitespace into "instrument housing".

### 2.6 Best thing, worst thing

- **Best:** motion in service of comprehension. The hero workflow runs itself; by the time the visitor reads the CTA they have already watched the product succeed once.
- **Worst:** the H1 "Marketing agents to win in Grok" is category-fashionable but vague about what you actually get (the page needs the next 8,000px to explain it), and at 375 the giant demos compress into dark noise: several mobile sections are near-illegible dashboards in a 343px column.

---

## 3. Teardown: ahrefs.com/es

**Stack:** custom (ReScript/styled-ppx esbuild pipeline). Fonts: "Ahrefs" custom face (rounded, chunky, w400/700) for display, Inter for body. Light theme on saturated royal blue `rgb(58,87,252)` hero, black ink sections on white, orange `#ff8d00` family as counter-accent. Container: 1080px. Page height 16,459px, the longest of the set.

### 3.1 Above the fold at 1440, element by element

| # | Element | What the visitor sees | Job |
|---|---|---|---|
| 1 | Letaido house ad, ~450px tall, cream panel | A full pre-header promo for a sibling product with its own CTA pair and floating UI chips | (Anti-pattern: eats half the fold; noted in 3.6) |
| 2 | Nav on blue | ahrefs logo (orange "a"), Producto, **Nuestros datos**, Recursos, Precios, Enterprise, search, locale, Acceder, Regístrate | "Our data" as a top-level nav destination is itself a trust statement |
| 3 | H1 60px custom face, white on blue | "Haz que tu negocio sea más visible en búsquedas, IA y mucho más" with a sparkle glyph | Broad outcome claim, category-widened to include AI |
| 4 | Sub 18px | Tools-and-data framing | |
| 5 | CTA pair + live counter | Solid orange "Regístrate en Ahrefs", outline "Empieza gratis", and beside them a heart icon with "18,955 usuarios se unieron a Ahrefs en los últimos 7 días" | The counter is the fold's trust payload: recency plus volume, rendered as a live number (three small canvases on the page animate counters) |
| 6 | Below: autoplay hero video panel | A guided Brand Radar demo: tabs (Search demand, Web visibility, AI overviews, ChatGPT, Perplexity), an F1-team competitor chart (Aston Martin, McLaren, Red Bull, Ferrari, Williams, Mercedes) with a tooltip, plus a "Ver demostraciones" play overlay | Product proof via video, using universally recognizable brands so the data is instantly meaningful |

### 3.2 Product visualization strategy

Video-first, at scale: 14 mp4s on one page. One autoplay muted hero video (1080x600) walking Brand Radar; nine 622x352 loop videos, one per tool tab (brand-radar, rank-tracker, site-explorer, ai-content-helper, keyword-explorer, content-explorer, site-audit, web-analytics); a vertical 230x366 autoplay clip ("track brand visibility"); and a full-viewport `ahrefs-big-data` background video for the data section. Feature panels sit on violet-to-blue and orange gradients. Where peec rebuilds UI in DOM and Profound fakes it live, ahrefs just shows recordings of the real product.

### 3.3 Trust architecture, in scroll order

| Order | Signal | Type of proof |
|---|---|---|
| 1 | Live counter in the hero: 18,955 signups in the last 7 days | Volume + recency, machine-counted |
| 2 | Under the hero video: "marketers at 44% of Fortune 500 companies use Ahrefs" | Institutional penetration claim |
| 3 | "Nuestros datos" nav item + a dedicated big-data section with full-screen video | The moat itself (crawler, index sizes) as a product |
| 4 | Role-based accordion (PPC specialist, SEO/Link Builder, **AEO specialist**, Product Marketing, Brand Specialist, Investor) | Self-identification; note AEO is now a named ahrefs persona |
| 5 | Audience-filtered testimonials with country flags: tabs for Agencias / Content Marketers / Ecommerce / Grandes empresas / SEO / SaaS; Spanish-market quotes (Carlos Estevez, COO, Internet República; Luis M. Villanueva, CEO, Webpositer Group; Andres Kloster, CEO, Eleven) on brand-colored cards with tag chips | Locale-matched social proof: the /es page shows Spain/Argentina voices first |
| 6 | Review-platform star strip: Capterra, G2, TrustRadius, Crozdesk | Third-party verification |
| 7 | Education layer (courses, certification, community counts) further down | Category-teacher authority |

### 3.4 Interaction and motion inventory

- 14 videos (see 3.2); autoplay ones are muted and looped, the rest play on tab activation.
- 3 small canvases animating counters/mini-charts.
- 5 marquee elements (logo/testimonial tickers).
- 39 hashed keyframes, 88 transitioning elements, 50 animating at rest, 198 hover rules (the biggest hover system here: every card, tab, link and accordion has a designed hover).
- Motion verdict: the explaining is delegated to video; DOM animation is mostly tickers and hovers. Effective but heavy: this page paid for it with 16,459px of height and the slowest capture of the set.

### 3.5 Typography and space

- Custom display face at 92/64/60/54/48/32 with line-heights BELOW 1 (60px over 57px, 64 over 60): chunky, poster-like. Inter body 16-20, list text 18.
- Saturated blue canvas with white type inverts the usual SaaS scheme and owns a color at 100% commitment; orange counter-accent for every primary CTA.
- 1080px container, but sections alternate full-bleed color slabs (blue, white, black, gradient), which is what keeps a 16k-pixel page readable: color-blocking as wayfinding.

### 3.6 Best thing, worst thing

- **Best:** trust at industrial scale, layered (live counter, Fortune 500, data moat, localized testimonials, review stars, education), and full-commitment color-blocking that makes a very long page navigable.
- **Worst:** the fold is half-consumed by a house ad for another product, pushing its own H1 to y=589 and the product proof below the fold. Even a category leader is one self-inflicted banner away from a broken first impression. Do not copy anything about slot 1.

---

## 4. What all three references agree on

These are the patterns present in all three pages; treat them as the category's table stakes.

1. **The product is visible in the first viewport.** DOM-rebuilt dashboard (peec), self-running demo (Profound), guided video (ahrefs). The visitor sees output before scrolling.
2. **Engine and brand logos are data.** Real ChatGPT/Perplexity/competitor logos appear inside charts, tooltips, headlines and tabs. Recognition does comprehension work that labels cannot.
3. **Trust sits in slot 2**, immediately after the hero: logo wall (peec, Profound) or live counter plus Fortune-500 claim (ahrefs, in-hero).
4. **One type voice, integer scale, restrained weight.** Geist w400/500, Inter w400/500, custom face w400/700. Nobody uses w800. Hierarchy comes from a 4x-plus size jump between display and body.
5. **One container width.** 1200 / 1088 / 1080. Full-bleed slabs alternate with it, but the measure never wanders.
6. **Numbers everywhere, always with context.** Every visual carries plausible metrics with deltas and labels; none is labeled "sample" or "illustrative".
7. **Motion either explains or stays out of the way.** Profound animates the product working; peec barely animates; ahrefs plays recordings. Nobody spends motion on ambience alone.

---

## 5. Gap analysis: why getbrandgeo.com reads a tier below

The current page is the built output of `docs/design/homepage-hook.md` (2026-07-26): the proof ORDER is sound, claims are honest, contrast discipline is real (measured 0 dark-mode failures on 2026-07-28), and the live audit funnel now has a forward step. The tier gap is not the argument structure. It is execution in six observable areas, plus defects.

What the page already does well, so the rebuild does not destroy it: the headline names a stake (rival vs you) per the 07-28 scrape finding; the instant audit is a real, working differentiator neither GEO reference has in its hero; every claim is verifiable (no invented counts, no fake customers); the research assets (DOI, index, 34 articles) genuinely exist; CLS was engineered to ~0 with metric-matched font fallbacks.

### G1. The product is never shown. Anywhere.
Measured: 3 images and 15 SVGs on the whole page; zero screenshots, zero video, zero DOM-rebuilt dashboard. Every reference leads with the product (section 4.1). We sell a dashboard that the landing page never depicts; the closest thing is the hero "Sample report" card, which is an abstraction, and small stat cards further down. A visitor finishing the page has no idea what they would log into.

### G2. Our one live superpower is presented as a fake.
The hero evidence card is labeled "Sample report" and "Illustrative figures" while sitting next to an input that produces a REAL score in under a minute (`site.js` renders a live ring, gap count, and report unlock). The references run fake data confidently; we run real data and apologize for the sample beside it. This inversion is the single most self-defeating thing on the page. (The honesty rule is right; the fix is to show something real, not to fake harder. See move 1.)

### G3. Trust slot 2 is empty and our real proof is buried.
After our hero comes the engines strip (colored dots and names), then three copy sections. The strongest real trust assets sit at 41% depth as a one-line banner ("Built on peer-reviewed research", DOI, Index) and at 90% depth as five text-only news cards whose dates all read Jul 9-10, 2026, a month stale and visibly batch-published. The Fazier badge is footer-only. Peec puts 20 logos at 12% depth; Profound puts 18 at 13%; ahrefs puts a live counter inside the hero. We have zero customers, so the slot cannot be logos, but it is currently not ANYTHING. The DOI methodology, the 27-city dataset, the 34 published articles, and the AI Visibility Index are category-unique proof (no reference publishes citable methodology) and they are rendered as a whisper.

### G4. Engines are dots; the category speaks in logos.
Our engine strip and hero card rows show colored bullet dots next to names ("WEB2 AI ... ChatGPT, Gemini, Claude..."), plus a "WEB3, COMING SOON" group (Bittensor, Mind Network). All three references use real engine logos as load-bearing UI (Profound rotates them through the H1; peec chips them into sentences; ahrefs gives them video tabs). Dots make the seven-engine coverage, our widest claim, look homemade. Also observable: giving roadmap Web3 engines equal billing in the first proof slot spends prime real estate on something no buyer in the references' audience is asking for; both GEO references never mention Web3 at all. (Whether Web3 stays is strategy's call, not this file's; the observation is that it costs fold-adjacent space and trust-tone today.)

### G5. Type discipline: two display voices and 19+ sizes, most fractional.
Measured from computed styles: H1 is Instrument Serif 56px w400; H2s are Inter 38.4px w800 with -1.5px tracking; below them at least 19 distinct text sizes, mostly non-integer (16.8, 15.2, 14.72, 14.4, 14.08, 13.76, 13.6, 13.44, 13.12, 12.8, 12.48, 12.16, 11.52, 10.88, 9.92...), an artifact of designing in 0.02rem increments. References: one voice, integer steps, w400-500, and a 4x-plus hero-to-body jump (section 4.4). Our serif-display decision is a documented owner ruling (2026-07-29, "signals we publish original measured research") and can absolutely carry a distinctive page, but today it fights an extra-bold geometric H2 voice one screen later; the page speaks two dialects and neither gets to define it. The 07-28 finding "mono for data labels is the category convention" is still unapplied: our data cards label figures in the same Inter as body copy.

### G6. Container drift and a monotone section rhythm.
Measured: max-widths of 1060, 1280, 1300, 1220, 720, 760, 660, 640, 560, 520, 460 all live on one page (references: exactly one measure each). And every section below the hero has the same beat: violet eyebrow, big H2, paragraph, small dark card. There is no full-width product stage anywhere, and the one three-column section ("A gap becomes a brief...") renders one dense column beside two nearly empty ones, a visible imbalance at 1440. References alternate full-bleed stages with split rows; ahrefs color-blocks; we flat-line.

### G7. The accent does everything, so it emphasizes nothing.
In our first viewport, violet appears as: logo, nav CTA, eyebrow pill, two headline words, input border, button fill, score ring, bar fills, KNOW chips, dot grid, canvas mesh. Alongside it: green (Strong chip), orange (PARTIAL), red (MISSING), plus the amber moon emoji. Peec's fold is monochrome plus chart colors; Profound's is monochrome plus one green. Our status colors fire all three alarm hues before a visitor knows what good looks like. The 07-28 palette work fixed contrast and token semantics; what it could not fix is quantity of accent per viewport, which is a layout decision.

### G8. Motion budget spent on ambience nobody can see.
Our 13 keyframes are almost all atmosphere: `heroOrbDrift`, `bgSpin`, `bgShimmer`, `bgDrift`, plus reveal fades and the score count-up. The hero's signature piece, a 1,296-point perspective mesh in canvas (hero.js, carefully engineered with pre-rendered sprites), reads in a static first impression as a faint dot haze; it cost real engineering and registers as nearly nothing at 50ms (the judgment window the 07-28 research documents). Meanwhile the page has zero motion that explains the product: no typing demo, no counting KPIs on scroll (except the one ring), no flowing pipeline, no fake-cursor run. Profound's 48 keyframes are the opposite budget. We also already respect prefers-reduced-motion everywhere, which the rebuild must preserve.

### G9. Mobile defects visible in the first screen.
Captured at 375: the nav "Get started" button wraps onto two lines inside its pill; the "Ask Jamie" launcher overlaps the consent bar's Reject button (two tap targets colliding); the serif H1 takes four lines (~270px) and with the 4-line paragraph pushes the input to y~965, so the fold shows no evidence object at all. Known from CLAUDE.md measurement (2026-08-02, not re-derived here): the pricing mode-switch causes 123px of real horizontal scroll at 375 (`.mode-switch` nowrap, buttons 221px + 233px in a 320px wrapper), and `.footer-grid` never collapses at 768 (53px overflow). Both references' mobile folds are clean single columns with visible product (peec) or at least a clean stack (Profound).

### G10. Two different "free audits" on one page.
The hero promises "Free audit, results in under a minute" (instant, real). At 88% depth a full form titled "Request your free AI audit" promises "results within 48 hours" (the manual done-for-you intake). Same phrase, different products, different clocks, no explanation of the relationship. A visitor who scrolled past the hero meets the slower one and reasonably concludes the minute-claim was marketing. F7 in homepage-hook.md fixed this inside the trust row; the page-level duplication remains.

### G11. First-viewport clutter the references do not have.
Counted in the 1440 fold: nav (7 items), eyebrow, 3-line H1, subline, input+button, 3-item trust row, 2 payment chips ("Stripe supported", "Crypto payments coming soon (Crypto.com Pay)"), the sample card with 10+ data rows, the consent bar (Reject/Accept), and the Ask Jamie bubble. The crypto chip is the strangest guest: no reference shows payment rails above the fold, and "crypto coming soon" reads as a category signal our B2B marketing buyer may misread. Payment reassurance belongs at the checkout moment, not the first impression.

### G12. The strongest pricing claim is still unbuilt.
Unchanged from 07-28 research section 3: Profound charges $99/mo for ChatGPT-only entry and $399/mo for 3 engines; our Essentials is 99 EUR for 3 engines, Growth 299 EUR for 5. Roughly 4x engines-per-euro at entry against the reference the founder wants beaten, absent from our page. (Re-verify their live pricing first-party the week this ships.)

---

## 6. Top 10 highest-impact moves, ranked

Ranked by expected impact on the founder's two goals (visual tier, client trust) per unit of risk. Effort scale: S under a day, M 1-3 days, L a week-plus, for one builder within the current static-HTML constraints.

**1. Turn the hero evidence card into a live instrument, not a labeled sample.**
Replace "Sample report / Illustrative figures" with a real, dated audit result the page replays: run the audit once against a well-known domain (or our own getbrandgeo.com, which we genuinely monitor), cache the response JSON same-origin, and have the card animate those real numbers on load with a visible caption like "Live audit, getbrandgeo.com, measured 2026-08-07" and a "run yours" affordance pointing at `#brandInput`. Derives from: peec's named-customer dashboard and Profound's fake-live demos, but ours is real, which neither can say. Effort: M (site.js already animates ring/bars; needs a cached-JSON path and card re-skin). Must not break: `id="free-audit"`, `#brandInput`, the honest-claims rule (label domain and date; never present cached as live-now), CSP (JSON must be same-origin), the one-solid-CTA rule from homepage-hook.md 3.2.

**2. Build a full-width product stage directly under the hero.**
One DOM-rebuilt (not screenshot) dashboard slice at container width, populated with BrandGEO's own workspace data (we track our own brand; that is a real tenant with real collection runs) or an anonymized research cohort: engine split, competitor trend lines, sentiment rows, a fix-list panel. Caption it as our own monitoring, dated. This is the honest equivalent of "Attio's Dashboard". Derives from: peec 1.2, Profound 2.2. Effort: L (the single biggest build in this list; HTML/CSS plus one JSON). Must not break: no client's real data without permission (use our own tenant or the published city-research dataset), mobile legibility (Profound's failure mode, 2.6), LCP 2.5s budget.

**3. Rebuild trust slot 2 from the proof we actually own.**
Immediately after the hero/product stage: a research-proof band replacing the logo-wall slot. Contents, all real today: DOI-badged methodology ("published and citable", linked), the AI Visibility Index, "34 published research articles", the 27-city dataset, Featured on Fazier, GDPR/EU registration, and the founder as a named human (photo, name, "research led by"). Render like peec's labeled logo groups: two labeled clusters, "Published research" and "Platform facts", each item clickable. Kill the stale-dated news cards on the homepage or feed them the three newest by date. Derives from: peec 1.3 slot 3-4, Profound's Index bar, ahrefs' data-as-nav. Effort: M. Must not break: zero fabricated proof (no invented counts, no logos we lack rights to), the research band's existing links (Read the study, See the Index), and every claim must stay count-verifiable from the site itself.

**4. Use real engine logos wherever an engine is named.**
Hero card rows, engine strip, pricing cards, FAQ. Inline SVG, self-hosted (CSP forbids external images), monochrome-tinted to keep G7 discipline. Consider Profound's rotating-engine trick inside the H1 or the subline ("what ChatGPT [logo] tells your customers") as a cheap dynamism win. Derives from: all three (section 4.2). Effort: S-M. Must not break: retired engines never reappear (Meta), trademark nominative use (logos identify the engines we query, no endorsement implied; keep official brand marks unmodified), the 14px three-second-test floor for labels.

**5. Reset the type system to one voice and an integer scale.**
Decide ONE display voice (the serif is a standing owner ruling and can stay as that voice; the rebuild direction chooses, see section 7), drop H2s from w800 to 500-600, collapse the 19+ sizes to roughly 6 integer steps (e.g. 64/40/24/16/14/12 at 1440), and put a mono face on every data label and figure (settles the 07-28 open item; Geist Mono equivalents on Google Fonts within CSP: JetBrains Mono, IBM Plex Mono, Space Grotesk is not mono, pick in design). Effort: M (CSS only but touches everything). Must not break: the CLS font-fallback machinery in index.html (size-adjust values are solved against current strings and sizes; any face or size change requires re-measuring those fallbacks), and the three-second test's 14px exclusion rule.

**6. One container, alternating stage rhythm.**
Normalize to a single content measure (1080-1200) and rebuild the section flow as: full-width stage (product, dark), split row (copy left, visual right), full-width slab (research proof), split row, pricing, FAQ. Fix or collapse the three-column pipeline section (either give AI SEO / AI Social columns real product visuals or make it a single horizontal pipeline with animated connectors, Profound-style). Effort: M-L. Must not break: every section id the nav and 90+ inbound pages target (verify with a link sweep before renaming anything; `#free-audit` is confirmed load-bearing), the proof ORDER from hook-thesis-web.md section 5 which this file does not overturn.

**7. Re-spend the motion budget from ambience to explanation.**
Keep one ambient layer at most (orbs OR mesh, dimmed). Add, all vanilla and CSP-safe: a typing animation cycling real research prompts through the hero input placeholder (blink-caret, Profound 2.4); count-up on every KPI when scrolled into view (pattern exists in site.js, extend it); animated beams along the gap-to-brief pipeline; a slow marquee of real prompts from the published dataset (peec's prompt wall, ours can cite its source). Every added motion must name what it explains; anything that cannot is cut. Effort: M. Must not break: prefers-reduced-motion paths (already wired, keep them), the 0.94s hero-cascade ceiling and 1s Nielsen limit (07-28 research 4.2), INP under 200ms.

**8. Declutter the first viewport.**
Move both payment chips to pricing/checkout; restyle the consent bar to a compact single-line variant; delay the Ask Jamie launcher until first scroll or consent resolution (also fixes the mobile overlap defect). Target: 9 or fewer competing elements per homepage-hook.md 2.3 rule 3, which the current fold breaks once consent and Jamie mount. Effort: S. Must not break: GDPR equal-prominence of Reject/Accept (restyle both together; no dark patterns), GA4 consent gating logic in ga4-init.js, Jamie's SDK expectations.

**9. Repair the measured mobile defects.**
Nav CTA no-wrap; serif H1 mobile clamp so the input returns above the 812 fold; the mode-switch overflow (recommendation from this research: stack the two mode buttons vertically under 640px, the only fix of the three candidates that keeps both labels full-size, and both references stack controls on mobile); `.footer-grid` collapse at 768. Effort: S-M. Must not break: the mode switch's JS hooks in site.js (MONTHLY_ONLY_PLANS logic), `#brandInput` focus-on-hash behavior that 90+ pages depend on.

**10. Ship the engines-per-euro comparison block in pricing.**
The unbuilt strongest claim (07-28 section 3): entry-tier engine coverage per euro against Profound's public pricing, one compact table, sourced footnote, current-week verification before publish. Derives from: the references' own confidence with numbers (section 4.6). Effort: S. Must not break: claim accuracy (re-scrape their pricing page first-party at build time; their entry price may have changed), no em or en dashes in the copy, comparative-advertising hygiene (name figures and dates, no adjectives).

---

## 7. Three design directions

Each is a coherent identity the founder can pick; all three respect the constraints (static HTML + vanilla JS, same-origin CSP, violet `#8b5cf6` as the brand hue, real proof only, `#free-audit` and `#brandInput` intact). Moves 4, 8, 9 from section 6 apply under every direction; the directions differ in what the hero IS and which voice leads.

### Direction A: The Live Instrument
The page is a running measurement device, and the visitor is invited to point it at their own domain. The hero's right side is a real, dated, cached audit replay (move 1) that animates on load: ring sweeping, engine rows filling, a mono readout ticking. The input is the instrument's control; a typing loop cycles real buyer prompts through the placeholder. Below, a full-width stage shows our own tenant's dashboard mid-measurement (move 2), then the research-proof band, then pipeline with flowing beams. The aesthetic: Profound's instrument-housing (thin 1px frames, dashed corner ticks, faint grid) rebuilt in violet on our existing near-black, mono data labels everywhere, status colors appearing ONLY inside instrument readouts. Ambient mesh is retired; every photon of motion explains a measurement. This direction is the only one no reference can copy: their products cannot produce a stranger's score in a minute, ours does.

Above the fold at 1440: nav (outline CTA) / one-line category eyebrow / serif or sans H1 naming the stake / one-sentence sub / domain input + single solid violet CTA / 3-item cost-removal trust row / live dated audit card animating real numbers with engine logos / a hairline instrument frame around the hero carrying a "measured live" caption. Nothing else: payment chips gone, consent compact, Jamie deferred.

### Direction B: The Research House
Lean into what we alone own: citable methodology and a published index. The page reads as the public face of a measurement institution, closer to a journal masthead than a SaaS splash: Instrument Serif promoted to a full editorial voice (large serif display, generous leading), body in Inter, data in mono; paper-dark surfaces, hairline rules, numbered figures with captions ("Figure 1. Mention rate across 7 engines, n=84"). Trust leads: DOI badge, the Index, the 27-city dataset and 34 articles presented like a publications rack with real covers, the founder named as the researcher. The audit input stays the hero's action, framed as "measure your brand with the published method". Charts follow dataviz discipline (one hue plus neutrals, labeled axes) instead of status-color confetti. Ahrefs' "Nuestros datos" nav idea appears as a top-level "Research" identity. Risk to name honestly: editorial gravity can read slower and less product-y; the product stage (move 2) must still appear by 30% depth or G1 survives.

Above the fold at 1440: masthead-style nav / serif H1 (the stake) / sub citing the method ("scored with our published, citable methodology") with the DOI badge inline / domain input + solid CTA / trust row / right side: a "Figure 1" style real chart from the published dataset with source caption, engine logos as data marks. Payment chips gone; news/research strip promoted to slot 2 with real dates.

### Direction C: The Product Stage
The straightest path to parity with peec: centered hero, ruthless reduction, and the dashboard as the fold's protagonist. Two-tone sans headline (violet doing peec's gray-tone trick on the second phrase), one sentence with engine names as inline logo chips, input + one solid CTA, then a full-width DOM-rebuilt BrandGEO dashboard populated from our own tenant, occupying the bottom 45% of the viewport, with a frozen tooltip listing real competitor names from the published city research. Sections below alternate stage/split rows with UI crops per feature (peec's six-card grammar). The serif retires to research pages; the marketing site speaks one sans voice with mono data labels. This direction is the safest and fastest to evaluate against the references side by side, and the most generic: it wins craft parity but concedes distinctiveness, and it depends entirely on move 2 landing well since the dashboard becomes the first impression.

Above the fold at 1440: announcement bar (latest research release, real and dated) / nav / centered H1 two-tone / sub with engine logo chips / domain input + CTA centered / trust row / full-width dashboard stage (own-tenant data, engine logos, competitor table). Sample labels nowhere; every number real and dated.

### Recommendation
**Direction A, borrowing B's research-proof band as trust slot 2.** Reasoning from the evidence: (a) it is built on the one capability the references cannot show in a hero, a real instant result for the visitor's own domain, which converts the honesty constraint from a handicap (G2) into the differentiator; (b) it reuses the most working code (the audit flow, ring animation, count-ups already exist in site.js); (c) it gives the violet a job (instrument glow on near-black) that neither peec's monochrome nor Profound's green occupies; (d) B alone risks reading slow, C alone reads like peec in violet, A absorbs the best of both (B's proof band, C's product stage at slot 3). If the founder wants the cheapest credible step first, sequence: moves 8+9 (defects and declutter), then 1, then 3, then 2.

---

## 8. Capture inventory

`C:\Users\const\Constantin Daniel Goane\BrandGEO\docs\design\landing-rebuild-research-2026-08-07\shots\`

| File | What it is |
|---|---|
| peec-1440-fold.png / peec-1440-full.png | peec.ai first viewport / full page (10,100px) |
| peec-375-fold.png / peec-375-full.png | peec.ai mobile (dsf2) |
| profound-1440-fold.png / profound-1440-full.png | tryprofound.com, cookie dialog removed, full page (10,363px) |
| profound-375-fold.png / profound-375-full.png | Profound mobile (dsf2) |
| ahrefs-es-1440-fold.png / ahrefs-es-1440-full-part1.png / -part2.png | ahrefs.com/es first viewport / full page split at 8,230px (total 16,459px) |
| ahrefs-es-375-fold.png / ahrefs-es-375-full-part1.png / -part2.png | ahrefs mobile (fold at dsf2, full at dsf1 for size) |
| getbrandgeo-1440-fold.png / getbrandgeo-1440-full.png | our live page as served, consent bar included (8,400px) |
| getbrandgeo-375-fold.png / getbrandgeo-375-full.png | our mobile, shows the nav-wrap and Jamie/consent overlap defects |
| crops/*.png | 35 readable section bands cited throughout sections 1-5 |

Method note for whoever re-runs this: the Browser pane cannot measure layout (documented in repo memory); use headless Chrome over CDP as here. Full-page captures above ~12k device pixels can hang `Page.captureScreenshot`; capture in clip segments as done for ahrefs.
