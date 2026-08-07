# Landing rebuild spec: The Live Instrument

**Date:** 2026-08-07
**Author:** Senior UI/UX Designer (design decisions only, no code)
**Consumer:** the senior interactive web developer, who builds this VERBATIM. Anything not specified here is a defect in this spec, not a decision for the builder. Raise it, do not guess it.
**Brief:** `docs/design/landing-rebuild-research-2026-08-07/RESEARCH.md`, direction A ("The Live Instrument") with direction B's research-proof band as trust slot 2. Founder-approved 2026-08-07.
**Target file:** `brandgeo/web/index-new.html` (plus `site.js` additions behind feature detection). The live `/index.html` is replaced only after founder approval of the preview. All prior owner rulings referenced inline stand; nothing here re-litigates them.

**Hard constraints, restated as acceptance criteria (breaking any one fails the build):**

1. Violet `#8b5cf6` (hue 293) remains the brand accent. No new accent hue is introduced.
2. Every text token pairing meets or beats the documented ratios in `index.html`'s `:root` block, in dark AND light themes.
3. `id="free-audit"` stays on the hero section and `id="brandInput"` stays on the domain input. 90+ pages target them.
4. Static HTML plus vanilla JS. Same-origin everything. `fonts.googleapis.com` / `fonts.gstatic.com` are the only external origins (plus the already-live Fazier badge image, see §5.4). No inline `<script>`: the CSP silently kills them (repo memory `csp-blocks-inline-scripts`).
5. The head JSON-LD block ships unmodified and must validate after the rebuild.
6. No em dashes, no en dashes, no AI buzzwords in any copy. Hyphens inside dates and compound words are fine. Middots and arrows are fine.
7. Every number in visitor-facing copy is traceable to real repo or product data. Bracketed `[TOKENS]` in this spec mark values that must be stamped from a real measurement at build time; shipping a bracket, or a number that cannot be traced, fails acceptance.
8. Existing checkout, terms-gate, consent, and audit flows in `site.js` are not functionally altered. This is a presentation rebuild around a working funnel.

---

## §1. Design language ruling

### 1.1 The instrument-frame aesthetic, defined concretely

The page is a running measurement device. A section reads as "part of the instrument" when it carries at least three of these five marks. Sections that are prose (FAQ, contact) carry none and read as the paper the instrument's results are printed on.

**F1. The frame.** A 1px hairline border in `var(--bd2)`, radius `12px` (reuse `--r`), background `var(--s)`, with four corner ticks. Corner ticks are L-shaped marks, 10px per leg, 1.5px stroke, positioned 6px OUTSIDE each corner of the frame (they float off the corner, they do not touch it). Color: `rgba(139,92,246,.55)` in dark, `rgba(109,40,217,.6)` in light. Implement as one absolutely positioned `aria-hidden="true"` SVG overlay per frame (four path elements), never as border tricks. Ticks are decorative and carry no information; nothing may depend on seeing them.

**F2. The readout header.** Every frame opens with a header row, hairline-underlined (`--bd`): left, a label in Data Mono (see §1.2) 12px / 500 / uppercase / letter-spacing `.14em` / `var(--t3)`; right, a stamp in Data Mono 12px / 400 / `var(--t3)`, e.g. `getbrandgeo.com · measured 2026-08-07`. Dates are real, ISO `YYYY-MM-DD`, stamped at build from the run that produced the numbers.

**F3. The status LED.** A 6px dot plus the existing `esRing` expanding-ring keyframe. Exactly two meanings, enforced page-wide: **violet pulsing** = a measurement is running right now (replay in progress, live audit collecting); **green steady** (`var(--ok)`, no pulse) = a completed, dated measurement. LEDs appear only inside frame headers and the live-audit skeleton. Nowhere else on the page may a pulsing dot appear; delete the seven decorative engine-strip dots (§2.5).

**F4. Mono data voice.** Every figure, percentage, price, date, count, and axis label on the page is set in Data Mono (§1.2). If a number appears in Inter after this rebuild, it is a defect. Prose numbers inside body sentences (e.g. "48 hours") stay in the body face.

**F5. Tick scale.** Under any horizontal bar group, one row of five 1px x 4px marks in `var(--bd2)` at 0/25/50/75/100% of the track width, `aria-hidden="true"`, unlabeled. This is the axis of the instrument. Applied to the hero engine split and the stage dimension bars; not applied to bars narrower than 80px.

**Violet budget rule (fixes G7).** In the first viewport at 1440x900, violet may appear in exactly six places: the logo "GEO" gradient, the H1 `em` gradient words, the nav CTA fill, the hero CTA fill, the frame corner ticks plus running LED, and the replay card's data bars and ring. Nothing else in the first viewport is violet, and NOTHING in the first viewport is red, orange, or amber. Green appears exactly once (the score band pill). The eyebrow badge pill, the gradient input border, and the KNOW/PARTIAL/MISSING chips are all removed from the fold (§2.2, §3.4).

**Status-color rule.** `--ok/--part/--bad` fire only inside below-the-fold instrument readouts: the stage's sentiment rows, the stage's fix badges, and MISSING states in the stage engine table. Data bars are never status-colored: all bars on the page are one hue, flat `var(--ac)` on a `var(--bd)` track (no bar gradients). The score ring keeps its existing `--info` to `#6d28d9` gradient: it is the dial, not a bar.

### 1.2 One display voice, and the type reset

**Ruling: Instrument Serif is the single display voice for the whole page.** The Inter w800 H2 voice is retired. Rationale: the serif is a standing owner ruling (2026-07-29, "we publish original measured research"), it is the only display face in the category (research §4.4: every reference runs a sans), and its name is literally the direction. The serif is the researcher's voice; the mono is the machine's voice; Inter is the interface between them. The serif is retired NOWHERE on this page; it is the H1 and every H2. It never appears below 26px and never carries UI copy.

**New face: "Data Mono" = JetBrains Mono**, weights 400 and 500 only, from Google Fonts (CSP already permits). Chosen over IBM Plex Mono for the taller x-height at 12px and the dotted zero, which disambiguates 0/O in readouts. Update the fonts `<link>` to exactly: Inter 400;500;600 + Instrument Serif 400 + JetBrains Mono 400;500. Inter 700/800/900 are dropped from the request; nothing may reference them afterward.

**Type scale: exactly six sizes, integers only.** Every `font-size` on the page resolves to one of these. The 19+ fractional sizes are gone; the developer greps the stylesheet for `rem` values that do not resolve to this table and converts each to the nearest role.

| Role | Face / weight | 1440 | 375 | line-height | tracking | Used for |
|---|---|---|---|---|---|---|
| D1 | Instrument Serif 400 | 56px | 36px | 1.05 (375: 1.1) | -.005em | H1 only |
| D2 | Instrument Serif 400 | 32px | 26px | 1.15 | 0 | every H2; also the hero ring numeral and plan prices, which render in JetBrains Mono 500 at this same size, lh 1 |
| L | Inter 400 | 18px | 17px | 1.6 | 0 | hero subline, section lead paragraphs, FAQ summaries (those at Inter 600) |
| B | Inter 400 / 500 / 600 | 15px | 15px | 1.6 | 0 | body, nav links (500), buttons (600), feature copy, form fields |
| DA | Inter 500 (names) · JetBrains Mono 400 (values) | 14px | 14px | 1.45 | 0 | data rows, trust row, card copy, gap lines, chip labels |
| M | JetBrains Mono 400 / 500 | 12px | 12px | 1.4 | .14em when uppercase, else 0 | eyebrows, stamps, captions, footnotes, plan availability lines |

**Weight cap: 600.** No exceptions. Every current 700/800/900 maps down: `.nav-cta` 700 to 600, section H2 800 to serif 400, ring numeral 900 to mono 500, `.hero-trust b` 700 to 600, all pill labels 700 to 600 or mono 500.

**The 14px floor.** Nothing that carries scoring content in the three-second test renders below 14px (hook-thesis-web.md rule, already honored by the current card). Role M (12px) is metadata only: eyebrows, stamps, captions. It never carries a claim a visitor must read to understand the product.

**Accent-word treatment, one page-wide rule:** display accent words (`em` inside H1/H2) use the already-ruled gradient `linear-gradient(135deg, var(--ac), #6366f1)` with background-clip. No other gradient text exists.

**Eyebrows become instrument channel labels.** Replace every `.section-label` and the hero badge pill with a Role-M mono eyebrow, numbered in scroll order: `01 · AI VISIBILITY PLATFORM`, `02 · PUBLISHED PROOF`, `03 · THE WORKSPACE`, `04 · ENGINES`, `05 · FROM GAP TO POST`, `06 · DONE FOR YOU`, `07 · PRICING`, `08 · FAQ`, `09 · THE 48 HOUR AUDIT`, `10 · LATEST`. Color `var(--t3)` (5.17:1 on `--bg`, 4.69:1 on `--s2`, both pass at 12px). No pill background, no border, no leading dot.

**CLS guard (load-bearing).** The metric-matched fallback `@font-face` blocks in `index.html` were solved against the current strings AT the current sizes. The H1 string and its 56px max are unchanged, so the serif desktop fallback stands; the mobile clamp changes (new floor 36px) and JetBrains Mono is new. Before swap-to-`/`, re-run the documented measurement method (the comment block at `index.html:130-168`) for: the serif at the new mobile clamp, and a new `JetBrains Mono Fallback` face solved with `local('Courier New')` against the longest stamp string this page renders. Additionally, every mono readout row gets a fixed line-height and `min-height` so a late font swap cannot move layout even before the fallback is tuned.

### 1.3 Spacing, container, radius

- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Every margin, padding, and gap resolves to one of these. Section vertical padding: 96px at 1440, 64px at 375. Frame inner padding: 24px (20px at 375). Grid gaps: 16px (12px in the pricing grid).
- **One container: 1200px** content width, 40px side padding at 1440, 20px at 375. This replaces every one of the measured 1060/1280/1300/1220/720/760/660/640/560/520/460 max-widths. Interior columns (e.g. a 640px prose measure inside a section) are set with column widths inside the 1200 grid, never with their own container max-width. `#pricing`'s 1300px override and `#grid-self`'s 1220px collapse into 1200.
- **Radius:** frames and cards `12px` (`--r`, unchanged), inner readout boxes 8px, buttons 8px, pills 999px. The 16px card radii on `.audit-result`, `.sentiment-card`, `.research-band` conform to 12px.
- **Full-bleed rhythm:** background slabs may run viewport-wide (the product stage runs on `var(--s)` with top/bottom hairlines), but content inside every slab returns to the 1200 measure.

### 1.4 The ambient canvas mesh: retired

- **Delete** the `#aiGraph` canvas element and stop loading `hero.js` on this page. Direction A's ruling: every photon of motion explains a measurement; the mesh measured as "a faint dot haze" in the 50ms judgment window (research G8).
- **Delete** `.hero-orb-2` and both orb drift animations (`heroOrbDrift1/2`, `bgDrift`). Keep `.hero-orb` as the single ambient layer, STATIC (no animation), with its dark-theme peak alpha reduced from `.20` to `.12` and the teal stop removed: `radial-gradient(ellipse at 50% 30%, rgba(139,92,246,.12) 0%, transparent 70%)`. Light theme: `.08`.
- **Keep** the `.hero-grid` dot field as-is (it is the instrument's graph paper), including its mask.
- **Reduce** `.node-lines` from three connector paths to ONE: the middle pair (`M0,60 C40,60 52,60 100,60`, base path plus its `.nl-flow` twin). The connector now reads as one signal path from the input into the instrument, not three decorative streams. Reduced-motion behavior unchanged (dash flow stops, opacity breathe stays).

---

## §2. Section-by-section spec, in scroll order

New scroll order (ids in parentheses are load-bearing and must exist):

1. Nav
2. Hero, the live instrument (`#free-audit`, `#brandInput`)
3. Research-proof band (new, `#proof`)
4. Product stage (`#workspace`, containing panels `#score` and `#sentiment` so existing inbound anchors still land)
5. Engines (`#engines`)
6. From gap to post (`#chain`)
7. Done for you (`#how`)
8. Pricing (`#pricing`)
9. FAQ (`#faq`)
10. The 48 hour audit (`#contact`)
11. Latest (`#latest`)
12. Footer

Before renaming or removing ANY other id, run a repo-wide link sweep (`grep -r "index.html#\|/#" brandgeo/web/`) and keep every id that has an inbound link. `#score` and `#sentiment` are known inbound risks and are explicitly preserved as stage panel ids.

### 2.1 Nav

**Desktop 1440.** Unchanged structure, four text links instead of five: `How it works · Pricing · Research · FAQ`, then the CTA, then the theme toggle. **News is removed from the homepage nav** (stays in footer; /news/ is one click from /blog.html). Link size Role B Inter 500. `.nav-cta` weight 600, `white-space: nowrap`, fill stays `--ac-strong` per the 2026-07-29 owner ruling (do not re-litigate the outline demotion).

**Theme toggle:** replace the moon/sun emoji with two inline SVG icons (sun / crescent, 18px, `stroke="currentColor"`), same button, same `aria-label`.

**Mobile 375.** Logo + CTA + theme toggle + existing hamburger. Defect fix (G9): `.nav-cta { white-space: nowrap; }` at all widths, and at max-width 420px its padding drops to `10px 14px`, font stays 15px. The theme toggle drops to 40x40 at max-width 420px (still above the 24px WCAG 2.5.8 floor; the 44px floor holds everywhere else). Acceptance: at 320px wide the CTA renders on one line.

**Deleted:** the News nav item; the emoji glyphs.

### 2.2 Hero (full spec in §3)

**Desktop 1440.** `.hero-split` two-column grid stays, `1.05fr 0.95fr`, gap 48px, `align-items: start`, inside the 1200 container. Left: eyebrow `01 · AI VISIBILITY PLATFORM` (Role M), H1 unchanged verbatim (`Are AI models recommending <em>your brand</em>, or your competitors?`, D1), subline (L role, new copy §3.6), search field, status line, trust row. Right: the replay instrument (§3). One connector path between them (§1.4). Hero height rule unchanged (`min-height: calc(100vh - 76px)`, cap 900px).

**The search field loses its gradient shell.** `.search-wrap`'s violet-teal gradient border is replaced by a plain 1px `var(--bd2)` hairline on `var(--s2)`; primacy now comes from the solid `--ac-strong` button inside it, its size, and the replay card pointing at it. Focus ring rule unchanged (`:focus-within` violet outline). This deletes the last teal-adjacent gradient in the fold.

**Mobile 375.** Single column: eyebrow, H1 at 36px (measured budget: nav 64 + padding 24 + eyebrow 20 + H1 4 lines about 160 + sub 2 lines about 55 + field 110 stacked = about 530px, comfortably above the 812 fold, which restores the input to the first screen, fixing G9's worst finding), sub, field (stacked input over button per the existing max-width 560 rule), trust row, then the replay card (auto-plays when scrolled into view, §3.5). Connector hidden below 900px (existing rule).

**Deleted from the hero:** the badge pill (becomes mono eyebrow), BOTH pay chips (the Stripe fact lives at the checkout buttons already via `.plan-checkout-note`; the crypto chip leaves the homepage entirely), the phrase "with decentralized knowledge engines coming next" from the subline (Web3 moves to §2.5's footnote), the "Sample report / Illustrative figures" labels, the score-card's KNOW/PARTIAL/MISSING column, the `shimmer-edge` class on the CTA, the mouse tilt and the static `rotateX(3deg)` (the instrument sits flat), orb 2, the canvas, two of three connector paths.

### 2.3 Research-proof band (`#proof`) (full spec in §4)

Sits directly under the hero, before the stage. Trust slot 2 per research §4.3.

### 2.4 Product stage (`#workspace`)

The honest equivalent of peec's "Attio's Dashboard": our own tenant, dated, DOM-rebuilt. **Ships in Stage 3** (§8); until then the scroll order simply omits it.

**Desktop 1440.** Full-bleed slab: background `var(--s)`, 1px `var(--bd)` top and bottom borders, 96px vertical padding. Inside the 1200 container: eyebrow `03 · THE WORKSPACE`, H2 `Our own dashboard, measuring our own brand.` (D2, serif), lead (L): `This is the BrandGEO workspace for getbrandgeo.com, in the same product customers log into. Exported [STAGE-DATE].` Then one full-width frame (F1 kit, all five marks) laid out as:

- **Meta rail, left, 232px fixed:** Data Mono 12px key-value list: `WORKSPACE getbrandgeo.com` / `ENGINES [N]` / `CADENCE weekly` / `PROMPTS [N]` / `LAST RUN [STAGE-DATE]`. Every value from the export (§2.4.1). A green steady LED sits beside LAST RUN.
- **Main area, right, 2-column grid, gap 24:**
  - **Panel A (`id="score"`):** readout header `SCORE · SIX DIMENSIONS`. The 88px ring (existing SVG pattern) with the tenant's real overall score, mono numeral at D2 size, band pill; beneath it the six dimension bars (Recognition, Knowledge, Sentiment, Accuracy, Reach, Consistency) with REAL tenant values: violet bars on `--bd` tracks, F5 tick scale, values in Data Mono 14 `var(--t)`. No per-dimension status colors.
  - **Panel B (`id="sentiment"`):** readout header `ENGINE SPLIT · SENTIMENT`. Top: one row per engine the tenant actually collects (with §5 logos, name Inter 500 14, violet bar, mono %). Bottom: three sentiment distribution bars (Positive `--ok`, Neutral `--part`, Negative `--bad`, values mono) plus up to two REAL quoted snippets from `ai_results.response_snippet` for the own tenant, each attributed `[Engine] · [date]` in Role M. **If no real negative snippet exists, show the distribution only. Never write a quote.**
  - **Panel C, full width under A and B:** readout header `FIX LIST · FROM OUR OWN AUDIT`. Three rows, P0/P1/P2 badge treatment (existing `.fix-row` idiom, status colors permitted here), each row a REAL `top_gaps` entry from the getbrandgeo.com full audit (§3.2's same run or newer).
- **Caption under the frame,** Role M, `var(--t3)`: `Source: our own workspace export and audit run of [STAGE-DATE]. We publish our own numbers, including the weak ones.` (Second sentence may be cut by the founder; first is mandatory.)

**Mobile 375.** The slab keeps full bleed; the frame's inside stacks: meta rail becomes a 2-column mono grid on top, panels A, B, C stack below at full width. Bars scale to the column; nothing scrolls horizontally (Profound's mobile failure is the named anti-goal). Panel paddings 20px.

**2.4.1 Data contract.** One JSON export produced by the founder from the own tenant (per-engine mention rates, six dimension scores, sentiment distribution, snippets, prompt count, run date) plus the audit `top_gaps`. The developer bakes the values into the markup as literals with an HTML comment recording export date and method; there is NO runtime fetch. Engines rendered = engines exported; never pad to 7 if the export has fewer.

**Deleted by this section:** the old `#score` section (its dimension bars move here; its intro copy dies), the old `#sentiment` section (its grid moves here; its four bullet points move to a single lead sentence: `Every answer is scored for tone as well as presence, so you can tell a recommendation from a warning.`), both sections' invented sample figures and invented quotes, and the `#chain` section's three fix rows (§2.6 keeps one).

### 2.5 Engines (`#engines`)

**Desktop 1440.** Eyebrow `04 · ENGINES`, H2 `Seven engines, measured the same way.` (serif D2). Lead (L): `Coverage grows with the plan, and the price of each rung is on the card.` Then a 7-tile row (grid `repeat(7, 1fr)`, gap 12): each tile is a mini-frame (F1 border, no ticks, padding 16) containing the engine logo (§5, 20px, monochrome), the engine name (Inter 500 15, `var(--t)`), and a Role M availability line in `var(--t3)`: `from Free` (Gemini), `from Radar` (Claude), `from Essentials` (ChatGPT), `from Growth` (Perplexity), `from Growth` (Google AI Mode), `from Growth PRO` (Grok), `from Growth PRO` (Google AI Overviews). These labels are the live `planConfig.ts` ladder and double as pricing scent; they must match the pricing cards on the same page at all times.

**Web3 demotion (G4).** Under the tiles, one Role M line, `var(--t3)`: `Roadmap: decentralized engines (Bittensor, Mind Network) are in research and not yet measured.` No tiles, no dots, no equal billing.

**Mobile 375.** Tiles wrap to a 2-column grid (last tile spans one cell, left-aligned); the footnote stays one wrapping line.

**Deleted:** the entire `.engines-strip` (both tiers, all nine colored dots, the `esRing` usage on them, the Web2/Web3 tier labels and divider), and the engine-chips/tooltip apparatus if the dead-selector audit (§2.12) confirms it unreferenced.

### 2.6 From gap to post (`#chain`)

**Desktop 1440.** Eyebrow `05 · FROM GAP TO POST`, H2 `A gap becomes a brief. A brief gets published.` (serif). Lead unchanged from current copy minus nothing. The chain becomes a balanced pipeline: three EQUAL `1fr` frames joined by two connector cells. Each frame opens with a Role M readout header: `GAP`, `BRIEF`, `POST`. Step 1 keeps ONE fix row (the P0 schema row, current copy) instead of three; steps 2 and 3 keep their current copy and plan chips (`Growth and up`, `Coming soon`, restyled Role M). The connectors reuse the `.nl-flow` dash-flow treatment horizontally (violet, 1.5px, dash 4/4), animating only while the section is in the viewport (IntersectionObserver adds/removes a class). This resolves G6's one-dense-column imbalance by subtraction, and gives the page its second explanatory motion.

**Mobile 375.** Frames stack; connectors rotate vertical (existing pattern at max-width 900 kept, restyled to the new dash treatment).

**Deleted:** two of the three fix rows (they live in the stage now), the `&rarr;` glyph links between steps (replaced by the drawn connectors).

### 2.7 Done for you (`#how`)

**Desktop 1440.** Eyebrow `06 · DONE FOR YOU`, H2 `Or we run all of it for you, in 48 hours.` (serif). Copy unchanged. The three `.step-num` gradient circles become 32px hairline circles (`1px var(--bd2)`, transparent fill) with Data Mono 500 numerals in `var(--ac-text)`. Grid unchanged.

**Mobile 375.** Single column (existing rule).

**Deleted:** the violet gradient fills on step numbers.

### 2.8 Pricing (`#pricing`)

**Desktop 1440.** Structure, plans, prices, mode switch, billing toggle, terms gate, and checkout flow all unchanged functionally. Presentation changes only:

- H2 to serif D2: `Start free. Fix your visibility <em>when you're ready.</em>` (em keeps the ruled gradient).
- Container conforms to 1200 (`#pricing` 1300 and `#grid-self` 1220 both become 1200; card padding may drop to 18px 16px to keep five across).
- All prices in Data Mono 500 at D2 size (32px); `/mo`, `/yr` suffixes Role M `var(--t3)`. Savings tags Role M.
- Plan eyebrows lose their emoji: `Most Popular`, `Power tier`, `Launch price` as plain Role M text in `var(--ac-text)`.
- Feature list checkmarks: replace the `✓` text glyph with a 12px inline SVG check in `var(--ac2)` (semantic positive, allowed below the fold).
- The mode-switch mobile stacking fix already in the working tree (2026-08-07 comment, grid `1fr 1fr` under 560px) SHIPS AS IS. Do not redesign it.
- **New block, the engines-per-euro comparison (research move 10):** between `.trust-strip` and `.fallback`. A single mini-frame, max 640px within the grid, readout header `ENTRY PRICE PER ENGINE · CHECKED [CHECK-DATE]`. Two rows, Data Mono values: `BrandGEO Essentials · EUR 99/mo · 3 engines` and `Profound entry · USD 99/mo · 1 engine (ChatGPT only)`. Footnote Role M: `Profound public pricing as of [CHECK-DATE]. Currencies as published by each vendor, not converted.` **Build gate:** the developer re-verifies Profound's live pricing page first-party in the same week this ships; if the figures changed, update them; if their page no longer states them plainly, DROP the whole block rather than approximate. No adjectives anywhere in it.

**Mobile 375.** Existing responsive grid rules kept (2-col at 940, 1-col at 560, max 380 centered).

**Deleted:** the `⭐` and `⚡` emoji, the `hook-sub`'s second sentence (`See exactly where AI engines mention you, or hand your customers to a competitor instead.` stays; trim the rest to `Start with a free audit, upgrade once you see the gap. No credit card to start, cancel anytime.`).

### 2.9 FAQ (`#faq`)

Eyebrow `08 · FAQ`, H2 serif `Questions, answered.` Summaries at L size Inter 600; answers Role B. Content unchanged EXCEPT "How quickly do I get results?", which becomes (fixes G10 at the objection layer):

`The instant check in the hero scores your domain in under a minute. The full free audit is deeper, more prompts across more engines, and lands within 48 hours with a per-engine breakdown and a prioritised P0/P1/P2 fix list.`

**Mobile:** unchanged behavior.

### 2.10 The 48 hour audit (`#contact`)

Renamed to kill the two-free-audits confusion (G10). Eyebrow `09 · THE 48 HOUR AUDIT`. H2 serif: `Request the deeper, done-for-you audit.` Lead: `The instant check up top takes a minute. This one takes us up to 48 hours: more prompts, more engines, reviewed and delivered as a report with a fix list.` Form fields, formsubmit action, and hidden inputs unchanged. Labels and inputs conform to Role B. Submit button Inter 600.

("More prompts, more engines" is true: the full audit runs 5 engines x 6 prompts against the screening check's 2 engines x 4 prompts, per `audit-domain.js`.)

**Mobile:** existing stacking.

### 2.11 Latest (`#latest`)

Eyebrow `10 · LATEST`, H2 serif `Fresh from the research desk.` **Three cards, not five**, chosen strictly as the three newest dated items on the site at build time (candidates: the Radar launch announcement in `/news/radar-plan-launch/` and the newest of BG-027 to BG-034; the developer reads the real on-page dates and picks; a card whose date is stale by more than 60 days at swap time is replaced or the count drops). Card dates in Role M. Tags Role M. This section stays last before the footer (its links leave the conversion path).

**Deleted:** the two oldest cards, and any card date that cannot be read off the linked page itself.

### 2.12 Footer

Structure and links unchanged, plus:

- Collapse fix (G9/CLAUDE.md 53px overflow at 768): at max-width 900px the grid becomes `1fr 1fr` with `.footer-brand` spanning both columns (`grid-column: 1 / -1`), every cell `min-width: 0`; at max-width 480px one column. Acceptance: zero horizontal scroll at 768 and 375.
- `🔒 GDPR Compliant` loses the emoji (text only); the `🇪🇸` flag emoji become the text `Spain (EU)`.
- The Fazier badge stays exactly as-is (it is a live working external image; §5.4).
- Wordmark rule (logo-text/geo gradient) unchanged.

**Dead CSS audit (one pass, Stage 1):** grep the final markup for each of these selectors and delete any that no longer match anything: `.engine-chips`, `.engine-chip`, `.engine-tooltip` (and its JS block if chips are gone), `.proof-bar`, `.features-grid`, `.feature-card`, `.live-ticker`, `.ticker-dot`, `.upgrade-timeline`, `.upgrade-steps`, `.addons-note`, `.pricing-cta-block`, `.product-preview`, `.testimonials-grid` (keep the commented section skeleton and its CSS: it is an intentional parking spot), `.hero-graph`, `.shimmer-edge`, `.marquee-mask`, `.glass`, orb-2 rules, deleted keyframes (§6).

---

## §3. The live hero, fully specified

### 3.1 What the replay is

The right-hand card stops being a labeled sample and becomes a REPLAY of one real, dated, full-depth audit of **getbrandgeo.com**, run by the founder through the product's own `audit-domain` full path (5 engines x 6 prompts = 30 answers).

**Why getbrandgeo.com and not BpR:** (a) it is our own data, so no client permission, confidentiality, or competitive-posture question exists; (b) it is self-verifying: the domain in the replay is the domain in the browser bar, and a skeptical visitor can type it into the input and watch the same instrument produce a live number; (c) an imperfect own score with a visible fix list is the strongest possible honesty signal, and the product fixing its own gaps is the product working in public. BpR would put a client's competitive data on a marketing page and mean nothing to a non-Romanian visitor.

### 3.2 Data contract

The founder runs (or asks the developer to trigger via the internal path) one full-depth audit of getbrandgeo.com and reads back: `ai_score`, `category`, `top_gaps` (array), `engines_used` (5), and per-engine mention rates computed from `engine_results` (for each engine: mentions / prompts, as a 0-100 integer). The developer bakes these literals into the card markup, plus the run date as `[RUN-DATE]`. An HTML comment above the card records the audit row id and the refresh procedure. **No fetch, no JSON file:** the markup IS the completed state, which is also the no-JS fallback. Tokens to stamp: `[SCORE]`, `[BAND]` (the score band word the dashboard would print), `[MENTION-PCT]` (share of 30 answers mentioning the brand), `[PCT-CHATGPT] [PCT-GEMINI] [PCT-CLAUDE] [PCT-PERPLEXITY] [PCT-GOOGLEAI]`, `[GAP-COUNT]`, `[TOP-GAP-TITLE]`, `[RUN-DATE]`. Shipping any bracket, or any figure that disagrees with the recorded run, fails acceptance.

### 3.3 Card anatomy (desktop, right column, about 520px)

A frame with all five marks (§1.1):

1. **Header row (F2):** left label `AUDIT REPLAY`; right stamp `getbrandgeo.com · measured [RUN-DATE]` + LED (green steady at rest).
2. **Run line:** Data Mono 14, `var(--t2)`, prefixed `>` : at rest reads `> run getbrandgeo.com · 5 engines · 6 prompts`. This is the typewriter target (§3.4).
3. **Score box** (inner readout, radius 8, `var(--s2)`, hairline): the existing 88px ring SVG (`#scoreRingProgress` pattern, gradient dial unchanged) with the numeral in Data Mono 500 at 32px, `/100` in Role M below it; right of the ring: `AI Visibility Score` (Inter 600, 14), band pill `[BAND]` (`--ok` outline treatment, the fold's single green), and `Mentioned in [MENTION-PCT]% of 30 answers` (Data Mono 14).
4. **Engine split** (inner readout): label row `ENGINE SPLIT` + scope `5 engines · 6 prompts · 30 answers` (Role M). Five rows in `ALL_ENGINES` order (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode), each: engine logo 16px monochrome (§5) + name (Inter 500, 14) + violet bar on `--bd` track + `[PCT]%` (Data Mono 14, right-aligned). F5 tick scale under the group. **No status column, no status colors** (§1.1). A 0% engine renders an empty track and a printed `0%`, never a hidden row.
5. **Gap line:** hairline inset box, Role DA: `[GAP-COUNT] gaps found. Top: "[TOP-GAP-TITLE]"`.
6. **Footer row:** left, a Role M link `Run it on your domain →` which focuses `#brandInput` (scrolls into view first below 900px); right, a 28px ghost icon button (circular-arrow SVG, `aria-label="Replay the audit animation"`), Role M label `replay`.

The live-audit skeleton (`#auditSkeleton`) and live result (`#auditResult`) keep their slots and swap exactly as today; the skeleton adopts the frame header with a violet pulsing LED and label `LIVE AUDIT`, and its stage copy strings are unchanged.

### 3.4 The replay sequence, beat by beat

Auto-plays ONCE per page load, when the card is 30% visible (reuse the existing preview IntersectionObserver). Timings from t=0 at trigger:

| t | What happens | What the visitor has seen by then |
|---|---|---|
| 0.00s | Card is already fully rendered (markup = completed state). Fills and numerals fade to zero over 150ms; LED switches to violet pulse; stamp swaps to `running replay of [RUN-DATE]` | **At 0s:** a complete, dated instrument, then it visibly re-arms |
| 0.30 to 1.00s | Run line typewrites `getbrandgeo.com` (steps easing, about 45ms/char) with a blinking block caret; then ` · 5 engines · 6 prompts` appears at once | **At 1s:** the machine is being pointed at a real domain |
| 1.00 to 2.40s | Engine rows fill top to bottom, 120ms stagger, each bar 0.8s `--ease-soft`; each `%` counts up in sync (mono) | |
| 2.40 to 3.60s | Ring sweeps (existing 1.4s transition), numeral counts to `[SCORE]`, band pill fades in at 3.4s | **At 3s:** the score is landing on screen |
| 3.60 to 4.20s | Gap line fades and rises 4px; stamp swaps back to `measured [RUN-DATE]`; LED settles to green steady | |
| 4.40s | The `Run it on your domain →` link's underline pulses once (opacity 0.4 to 1 to 0.7, 600ms). Nothing on the card moves again | **At 6s:** a finished, dated result plus their own unmistakable next step |

**Loop ruling: it does not auto-loop.** A measurement that replays forever reads as a screensaver by the second pass and as fake by the third. The completed state persists; the `replay` button re-runs the sequence on demand (and is the only way it runs twice). This is the loop spec.

**Interruption rule:** if the visitor starts a LIVE audit (types and submits) mid-replay, the replay halts instantly and the card swaps to the skeleton slot. The live flow always wins.

### 3.5 Reduced motion and no-JS

- **`prefers-reduced-motion: reduce`:** no zeroing, no typewriter, no fills, no count-ups, no LED pulse. The card is the static completed state with the green LED and full figures (exactly what the markup already is). The `replay` button is not rendered (its only product is motion). The live-audit flow keeps its existing reduced-motion behavior.
- **No JS:** the markup is the completed dated card, fully populated, ring drawn at its final offset (`stroke-dashoffset` final value in the markup, not zero). The `replay` button is in the markup but does nothing; acceptable. The audit CTA cannot fetch without JS; the no-JS conversion path remains the `#contact` form, as on the current page.

### 3.6 Input relation and the three-second test

The input is the instrument's control panel; the replay is its screen, one connector joins them. Exact left-column copy:

- Eyebrow: `01 · AI VISIBILITY PLATFORM`
- H1 (unchanged, ruled 2026-07-28): `Are AI models recommending your brand, or your competitors?` with `your brand` as the gradient `em`.
- Sub (L role, replaces the current sub): `See what the top AI engines tell your customers when they ask about your category. Type your domain and get a scored answer in under a minute.` ("under a minute" is backed by the measured 26.9s screening run recorded in site.js; keep only if that path still holds at build.)
- Placeholder: static `yourcompany.com`. **No typing loop in the real input** (§9, rejected moves): a domain field that types buyer prompts into itself demonstrates the wrong action. The typewriter lives in the replay's run line, where it demonstrates the right one.
- Button: `Check my visibility →` (Inter 600, `--ac-strong`, no shimmer).
- Status line and trust row unchanged: `Free audit · Results in under a minute · No credit card required` (Role DA, middot separators, `::after` pattern kept).

Three-second read: H1 names the stake (what and who), the sub names the action and the clock, the input plus one solid CTA is the unmistakable next step, and the replay card is the proof playing four hundred pixels away. Elements competing in the fold: nav, eyebrow, H1, sub, field, trust row, replay card, compact consent (until dismissed) = 8, inside the 9-element ceiling with Jamie deferred (§7.3).

---

## §4. The research-proof band (`#proof`)

**Position:** immediately after the hero section, before the product stage. Full-width hairline band: 1px `var(--bd)` top and bottom, background `var(--bg)` (not a card), 32px vertical padding, content on the 1200 container.

**Layout (desktop 1440):** one row, two labeled clusters separated by a vertical hairline (`--bd2`, 18px min-height), modeled on peec's labeled logo groups. Each cluster: a Role M label followed by chips. Chips are text-first: 14px Inter 500 `var(--t2)`, optional 16px leading glyph, padding 8px 14px, 1px `var(--bd)` border, radius 999, background transparent. Hover: border `var(--ac)`, text `var(--t)`. Every chip is a real link. No counts other than the ones below; no logos of anyone else; no stars; no invented anything.

**Cluster 1, label `PUBLISHED RESEARCH`:**

| Chip copy (exact) | Link | Truth source |
|---|---|---|
| `Citable methodology · DOI` | `https://doi.org/10.5281/zenodo.21395598` (new tab, `rel="noopener"`) | the Zenodo record |
| `AI Visibility Index · Issue 1` | `/ai-visibility-index-2026-07.html` | live page |
| `34 research articles` | `/blog.html` | BG-001 to BG-034, countable on the blog index; if the count has grown at build time, stamp the real count |
| `27 US cities measured` | `/blog.html` | the 27 live city research pages |
| `Research led by Constantin Daniel` | the DOI record (it names the author) | JSON-LD founder + Zenodo authorship |

**Cluster 2, label `PLATFORM FACTS`:**

| Chip copy (exact) | Link | Truth source |
|---|---|---|
| `EU based · GDPR` | `/privacy.html` | footer registration facts |
| `Featured on Fazier` | `https://fazier.com/launches/getbrandgeo.com` | the live badge already in the footer |

**Copy correction carried into this band and everywhere else:** the current homepage claim `Built on peer-reviewed research` is retired. Zenodo publication is real, citable, and DOI-registered; it is not peer review, and the distinction is exactly the kind our audience checks. The band's claims use only `published` and `citable`. (The old `.research-band` block at proof position 5 is DELETED; this band replaces it, one slot higher and with the microscope emoji gone.)

**Mobile 375:** the two clusters stack with their labels; chips wrap in rows, 8px gaps. The band never scrolls horizontally.

**Fazier note:** if a visual badge is wanted in the band, reuse the exact footer `<img>` (their hosted SVG already loads on the live site, so the CSP demonstrably permits it); otherwise the text chip is enough. Never both in the band. The footer badge stays either way.

---

## §5. Engine representation

### 5.1 Assets

Real engine marks replace colored dots wherever an engine is named: the hero replay rows, the stage engine rows, the engines section tiles, and the pricing feature lines are OPTIONAL (text there stays fine; do not force 12px logos into feature bullets). All marks are **inline SVG or same-origin `<svg><use>` sprites, self-hosted** in `brandgeo/web/logos/` (CSP forbids external images; the dashboard's Google-favicon URLs in `planConfig.ts` are NOT usable here). Single-path monochrome versions sourced from the Simple Icons set (CC0 pathdata; nominative use of the marks to identify the engines we query, no endorsement implied; marks are never redrawn, recolored per-brand, distorted, or animated).

| Engine | Mark | Fallback if legal review objects |
|---|---|---|
| ChatGPT | OpenAI knot (`openai`) | lockup (§5.3) |
| Gemini | Gemini spark (`googlegemini`) | lockup |
| Claude | Claude starburst (`claude`) | lockup |
| Perplexity | Perplexity mark (`perplexity`) | lockup |
| Grok | xAI / Grok mark (`xai`) | lockup |
| Google AI Mode | **lockup by default** (the feature has no distinct mark; the Google G is not ours to use) | n/a |
| Google AI Overviews | **lockup by default**, same reason | n/a |

### 5.2 Treatment

Monochrome only: `fill="currentColor"` with color `var(--t2)` at rest, `var(--t)` on row hover. Never tinted violet, never given per-engine identity colors (this file's own 2026-07-29 ruling against a seven-hue rainbow stands). Sizes: 16px in data rows, 20px in engine tiles. Optical alignment: each SVG in a fixed square viewBox, vertically centered to the text cap height.

### 5.3 Typographic lockup fallback

A 16px (or 20px) rounded square, radius 3, 1px `var(--bd2)` border, transparent fill, containing the engine's initial(s) in JetBrains Mono 500 set at 60% of the box (`G` for both Google features, disambiguated by the adjacent full name; `AI` is never used as a glyph). This is our own typography, not anyone's logo.

### 5.4 Accessibility

Every mark is `aria-hidden="true"` and sits IMMEDIATELY beside its visible text label; no engine is ever identified by mark alone. Because the label is always present, no alt text is needed on the SVGs; if a mark ever appears without a visible label (it must not), that is a spec violation, not a case for alt text.

---

## §6. Motion budget

Complete inventory. Anything animating on the final page that is not in the KEEP table is a defect.

**KEEP / ADD:**

| # | Motion | Trigger | Duration / easing | What it explains | Reduced-motion |
|---|---|---|---|---|---|
| 1 | Replay sequence (§3.4) | hero card 30% visible, once | 4.2s scripted, `--ease-soft` segments | the product running a real audit end to end | static completed card |
| 2 | Score ring sweep | replay beat 4; stage panel A in view | 1.4s (existing transition) | score magnitude | instant final offset |
| 3 | Bar fills (engines, dimensions, sentiment) | replay beat 3; stage panels in view | 0.8s each, 120ms stagger | per-engine and per-dimension rates | instant final widths |
| 4 | Numeral count-ups | in sync with 2 and 3 | 0.9s | numbers landing | instant final values |
| 5 | Run-line typewriter + block caret | replay beat 2 only | ~45ms/char; caret 1s `steps(2)` while typing | you point the instrument at a domain | omitted entirely |
| 6 | Hero connector dash flow (`nodeFlow`) | always while hero visible | 1.1s linear infinite | the input feeds the instrument | dash flow stops, opacity breathe stays (existing rule) |
| 7 | Chain connector beams | `#chain` in viewport only | 1.1s linear infinite | gap to brief to post is one flow | static dashes at 55% opacity |
| 8 | LED pulse (`esRing`) | replay running; live audit collecting | 2.4s (existing) | a measurement is happening now | static dot |
| 9 | Scroll reveal (`.reveal`) | section 15% visible, once | 0.55s `--ease-soft` (shortened from 0.7s), rise 16px (from 24px) | scroll orientation | visible immediately (existing rule) |
| 10 | Skeleton pulse (`skPulse`) | live audit wait | 1.4s (existing) | still working | static |
| 11 | Button spinner (`bgSpin`) | async buttons | 0.7s (existing) | in flight | static (existing rule) |
| 12 | Hover micro-interactions | pointer | 150ms color/border/opacity only; card hovers may lift max 2px | affordance | keep (non-vestibular) |
| 13 | Replay-link underline pulse | 4.4s, once | 600ms | the next step | omitted |

**DELETE (with their keyframes and properties):** `heroOrbDrift1`, `heroOrbDrift2`, `bgDrift` (orb becomes static), `bgShimmer` + `.shimmer-edge`, `tickerPulse` + all `.live-ticker` rules, the `#aiGraph` canvas and `hero.js` load, the preview-card mouse-tilt JS block and the `perspective/rotateX` base transform, `translateY(-2px)` hover lifts that exceed 2px, and the engine-strip `esRing` dots (the keyframe itself survives for LEDs). All surviving motion honors `prefers-reduced-motion` exactly as tabled; the existing global reduced-motion blocks are extended, never trimmed. All motion is CSS or same-origin `site.js`; nothing external.

**Ceilings (from the 07-28 research, unchanged):** no entrance cascade may exceed 0.94s; nothing blocks interaction; INP stays under 200ms; content visibility never depends on an animation firing (the markup-is-final-state rule in §3.5 is the enforcement).

---

## §7. Mobile 375 spec

Acceptance criterion for every section: **zero real horizontal scroll at 375 and at 768** (test with an actual `window.scrollTo(600,0)` and read `scrollX` back; `scrollWidth` is not evidence; per repo memory, measure in headless Chrome, not the preview pane).

1. **Nav:** §2.1 fix. CTA `white-space: nowrap`, one line at 320px.
2. **Hero:** §2.2 stack; input above the 812 fold (H1 36px, sub 17px); replay card below, auto-plays on scroll-into-view; connector hidden.
3. **Consent bar (build item):** restyle to the compact variant: max-width 720px, centered, 12px from bottom edges, text Role DA (14px), Reject and Accept EQUAL in size, weight, and treatment (both ghost 1px `--bd2` buttons, 44px hit height; acceptance stays GDPR equal-prominence; the current accent-filled Accept is demoted to match Reject). Two rows max at 375: text row, then buttons row.
4. **Ask Jamie collision (build item, G9):** Jamie's launcher must not mount until consent is resolved (either button pressed) OR the visitor scrolls past 200px, whichever comes first; while the consent bar is visible, Jamie's bottom offset = consent bar height + 12px. Coordinate with the askmywebsiteai embed config (repo memory `askmywebsiteai-widget-setup`); if the SDK cannot defer, mount it hidden and reveal per the same rule. Acceptance: at 375, the Reject button and the Jamie launcher never overlap (screenshot proof at consent-visible state).
5. **Proof band:** clusters stack, chips wrap, no truncation.
6. **Stage:** §2.4 stack; bars compress; meta rail becomes 2-col mono grid.
7. **Engines:** 2-col tile grid.
8. **Chain:** vertical stack with vertical beams.
9. **Pricing:** existing responsive rules; the in-tree mode-switch stacking fix ships unchanged; the comparison mini-frame goes full width.
10. **Footer:** §2.12 collapse fix; acceptance includes 768.
11. **Type:** the six sizes render at their 375 values (§1.2); body never below 14px except Role M metadata at 12px.

---

## §8. Staged delivery plan

All stages build into `brandgeo/web/index-new.html` (assets referenced relatively so the final swap is a file rename plus the documented `site.js` version-param bump). The founder previews each stage at `/index-new.html`; swap to `/` happens only on his explicit approval, as one atomic replacement.

**Stage 1: declutter, type reset, proof band.**
*Ships:* §1 (tokens, six-size scale, mono face, frame kit CSS, ambient retirement), §2 all sections except the hero replay internals and the product stage, §4 proof band, §5 engine logos in the engines section, §6 deletions, §7 items 1, 3, 4, 5, 7, 9, 10, 11, the FAQ/contact renames, the Latest re-pick, the pricing comparison block, JSON-LD untouched. **Stage 1 hero rule:** the card keeps its current "Sample report / Illustrative figures" content UNCHANGED apart from type-scale conformance. The honesty labels come off only in Stage 2, at the same moment real data goes in, never before.
*Depends on:* the JetBrains Mono addition; the logo SVG set; the Profound price check.
*Acceptance:* fold element count 8 or fewer at 1440; exactly six computed font sizes on the page (measure via DOM sweep); zero weights above 600; zero horizontal scroll at 375 and 768; zero red/orange in the first viewport; contrast spot-checks pass both themes on every new pairing (band chips, mono captions, availability lines); JSON-LD validates; every proof-band claim clicks through to its evidence; CLS re-measured and still ~0.

**Stage 2: the live hero.**
*Ships:* §3 complete (replay card, beats, replay control, run line, skeleton reframe, footer link), the sample labels replaced by the dated stamp, §2.2 deletions completed.
*Depends on:* Stage 1; the founder's full audit run of getbrandgeo.com and sign-off on publishing its numbers (§10 Q1); the size-adjust re-measurement (§1.2 CLS guard).
*Acceptance:* the beat table verified against a screen recording; reduced-motion shows the static completed card; JS disabled shows the full completed card; live audit still works end to end and interrupts the replay; `#free-audit` and `#brandInput` verified present and the hash-focus behavior intact; every stamped value traces to the recorded run id; CLS ~0 at both widths; LCP under 2.5s on the PSI desktop run.

**Stage 3: the product stage.**
*Ships:* §2.4 complete (`#workspace` with panels `#score` and `#sentiment`), stage count-ups wired to the existing observer pattern.
*Depends on:* Stage 2 (visual grammar it inherits); the founder's tenant export and approval, including which competitor names, if any, may appear (§10 Q2).
*Acceptance:* stage legible at 375 with zero horizontal scroll (the named Profound failure); ids `#score` and `#sentiment` resolve; inbound-anchor sweep passes; no invented figure or quote (every snippet traces to an `ai_results` row); LCP budget still met with the stage present.

**Swap protocol:** founder approves /index-new.html; developer renames to /index.html, bumps the `site.js?v=` token, re-runs the link sweep, PSI, and the JSON-LD validator against the live URL, and archives the old file in git (no cPanel-side backups).

---

## §9. Research findings deliberately rejected, and why

1. **Move 7's typing loop in the hero input placeholder:** rejected as a category error. The input takes a DOMAIN; typing buyer prompts into it demonstrates the wrong action at the exact moment we want the right one to be obvious. The typewriter moved into the replay's run line (§3.4), where it types a domain.
2. **An auto-looping hero animation:** rejected. A measurement that replays forever reads as a screensaver, then as a fake. Plays once; manual replay control (§3.4).
3. **Profound's fake cursors and multiplayer theatrics:** rejected. Our thesis is that the data is real; simulated humans undermine the one thing we have that the references do not.
4. **peec's prompt-wall marquee (part of move 7):** rejected for Stage 1 to 3. Redundant with the stage's real prompt count and a second infinite motion for zero new information.
5. **A seven-hue engine palette or per-engine identity colors:** rejected; upholds the existing in-file ruling. Engines are identified by monochrome marks plus names; data bars are one hue.
6. **Direction C's centered hero:** rejected. The split layout is the instrument thesis: control panel beside screen, joined by a wire.
7. **ahrefs-style full-bleed color slabs:** rejected. One dark canvas with framed instruments and a single lighter stage slab; color-blocking would spend the violet budget on walls.
8. **Web3 engines keeping fold-adjacent billing:** demoted to one roadmap footnote (§2.5). The strategy call on whether Web3 stays in the narrative is not mine; its COST (prime proof real estate, research G4) is, and it stops paying it.
9. **"Peer-reviewed" as a trust claim:** retired as untraceable (§4). Published and citable is the truth and is strong enough.
10. **Keeping the payment chips anywhere above the fold:** rejected outright; the Stripe fact already exists at the point of payment, and the crypto chip leaves the homepage.

---

## §10. Open questions, founder only

1. **Publish the self-audit?** Stage 2 requires one full audit of getbrandgeo.com and consent to print its real score, mention rate, and top gap on the homepage, whatever they turn out to be. If the score embarrasses, the honest options are to publish anyway (with the fix list showing the product working on itself) or to hold Stage 2 until a re-run after fixes; faking or cherry-picking is not on the menu. Which way?
2. **Stage 3 export scope:** may the workspace panels name real competitors from our own tracking, or should competitor identities be withheld (rates only)? peec names Attio's rivals; naming ours (peec, Profound and so on inside our own data) is stronger and spicier, and it is your call, not the developer's.
3. **Founder photo** for the `Research led by` chip: optional. The band ships text-only without it; supply a photo only if you want a face in slot 2.
4. **Latest picks:** confirm the three newest dated items (the Radar launch news plus the two newest BG articles is the developer's default read).
5. **Jamie deferral:** confirm the askmywebsiteai widget config allows delayed mount; if it hard-mounts on load, approve the hide-then-reveal fallback (§7.4).
6. **"Under a minute" claim:** the 26.9s screening measurement is from 2026-07-26. If the screening path has slowed since, the sub and trust-row copy drop the clock rather than lie about it; a one-off timing check at Stage 1 build settles it.

---

## §11. Acceptance summary (the checklist the founder sees)

- [ ] Six font sizes, one serif display voice, all figures in mono, no weight above 600
- [ ] First viewport: 8 elements, six violet incidences, zero red/orange, one green
- [ ] Hero replays a real dated audit of getbrandgeo.com; no "Sample report", no "Illustrative figures", no bracket tokens anywhere
- [ ] `id="free-audit"` and `#brandInput` intact; hash focus works; live audit and checkout flows untouched
- [ ] Proof band: every chip real, clickable, and count-verifiable; "peer-reviewed" nowhere on the page
- [ ] Engine marks self-hosted monochrome SVG with visible text labels; Google features use the typographic lockup
- [ ] Motion matches §6's table exactly; reduced-motion paths verified; mesh, orbs drift, shimmer, tilt, ticker all gone
- [ ] Zero horizontal scroll at 320, 375, 768, 1440; nav CTA one line at 320; consent and Jamie never overlap
- [ ] Contrast at or above documented token ratios in dark and light; JSON-LD valid; CLS ~0; LCP under 2.5s
- [ ] One 1200px container page-wide; sections in the §2 scroll order with the numbered mono eyebrows
