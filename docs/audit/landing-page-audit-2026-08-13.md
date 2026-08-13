# Landing page audit: getbrandgeo.com homepage

**Date:** 2026-08-13
**Auditor:** landing-page-optimizer (read-only seat)
**Target:** https://getbrandgeo.com/ (live, as deployed)
**Commit audited:** `63a005c63e68fccb6ff6b897c218e777d734b7ee` (page last changed by `4e698cf`, 2026-08-07)
**Scope of writes:** this file only. No page, doc, or config was edited. No form was submitted. No git write was run.

Every claim below is tagged **MEASURED** (with the command, URL, file:line, or pixel value) or **INFERRED**
(judgement built on measured facts). Nothing here is inherited from a prior artifact without independent re-measurement.

---

## Calibration

```
SYSTEM VERIFICATION - landing-page-optimizer
```

1. **File that produces the landing page, and its line count.**
   `brandgeo/web/index.html`, **2440 lines**, 136069 bytes. MEASURED (`wc -l`). Supporting runtime:
   `brandgeo/web/instrument.js` (391 lines) and `brandgeo/web/site.js` (1597 lines).
2. **Live URL and HTTP status.**
   `https://getbrandgeo.com/` returns **HTTP 200**, `Content-Length: 136069`, `Last-Modified: Fri, 07 Aug 2026 15:15:24 GMT`,
   `Server: LiteSpeed`. MEASURED (`curl -sI`). The live byte count is identical to the working-tree file, so the deployed
   page equals `HEAD` for this file. There is no mid-rebuild ambiguity.
3. **Current h1 as rendered, and its computed font-size at 1280x800.**
   `Are AI models recommending your brand, or your competitors?` at **56px**, weight 400, contrast 16.22:1,
   rect top 176.4px. MEASURED (headless Chrome CDP, `getBoundingClientRect` plus `getComputedStyle`).
   At 375x812 the same h1 computes to **36px** at top 139.8px. MEASURED.
4. **Fold line used at each width, and its derivation.**
   Fold = `window.innerHeight` under `Emulation.setDeviceMetricsOverride`, so **800px at 1280 wide** and **812px at 375 wide**.
   MEASURED. Note this is the generous reading: a real browser spends 60px to 120px on its own chrome, so the true
   visible fold is smaller and every above-fold finding below understates the problem rather than overstating it.
5. **File the design tokens come from, and one token value.**
   Tokens are declared in place in the `:root` block of `brandgeo/web/index.html` (there is no separate token file).
   Sample: the primary button fill resolves to `rgb(124, 58, 237)` (`--ac-strong`, `#7c3aed`) and the keyboard focus ring
   resolves to `rgb(139, 92, 246)` (`#8b5cf6`). Both MEASURED from computed style on the live page.
6. **Does a strategy or design artifact exist for this page.**
   Yes. `docs/design/landing-instrument-spec-2026-08-07.md` (design spec) and
   `docs/design/landing-rebuild-research-2026-08-07/` (research plus `shots/`) both exist and post-date the rebuild.
   `docs/design/homepage-hook.md` exists but is pre-rebuild and is treated here as a source of hypotheses to refute,
   not as fact. MEASURED (files read).
7. **Commit sha audited and today's date.**
   `63a005c`, 2026-08-13. MEASURED (`git rev-parse HEAD`, `date -u`).

**CALIBRATED.**

---

## 1. Verdict

The front door is not broken, it is **anonymous**: the page is fast, accessible, technically clean and honestly built,
but it never names who it is for and shows not one named customer, while all four competitors do both, so a qualified
stranger has no reason to believe this tool is for them.

| Lens | Score | One-sentence justification |
|---|---|---|
| 1. Hook and comprehension | **3** | The three-part hook is mechanically present and the h1 paints in 644ms, but 164 elements compete inside the fold at 1280 and the entire proof card is below the fold at 375. |
| 2. Conversion path | **4** | One field, no credit card, zero dead ends across 75 links, and a failure path that hands the visitor forward instead of stranding them, held back by two solid-violet primaries above the fold. |
| 3. Credibility and craft | **2** | Performance and contrast are strong, but there is not one product screenshot, not one named customer, not one testimonial on the page, and 13 of 18 interface components fail WCAG 1.4.11. |
| 4. AI answer readiness | **4** | Valid `@graph` structured data, one h1, no skipped levels, every AI crawler explicitly allowed, and the core claim survives a full CSS strip. |

**Is the marketing front door the problem?** Partly, and specifically. It is not a technical or usability failure:
the page loads in 86.9KB, the primary action handles eight distinct states, and nothing is broken. The failure is
positioning made visible: no ICP, no named proof, and a headline that asks a question instead of naming an outcome.
That profile converts curious visitors into readers, not into signups, which matches the reported pattern of early
interest followed by quiet. INFERRED from the measured facts in Lenses 1 and 3 and the competitor table.

---

## 2. Lens 1: Hook and comprehension

**Method.** Headless Chrome over CDP (the in-app browser pane cannot measure layout; `clientWidth` reads 0 there).
Every text leaf above the fold was collected with its `getBoundingClientRect()` and computed `font-size`, then
alpha-blended against its real rendered background. **Exclusion threshold: text rendering below 14px is excluded from
the pass criteria**, because it is not read in three seconds and counting it inflates the result. The threshold is
stated here so the count is reproducible.

### Headline metric

| Width | Text leaves above fold | Qualifying (>= 14px) | Total elements above fold | P1 | P2 | P3 | Verdict |
|---|---|---|---|---|---|---|---|
| 1280x800 | 61 | **48** | **164** | yes | yes | yes | **PASS** |
| 375x812 | 22 | **19** | **61** | yes | yes | yes | **PASS** |

All MEASURED.

**The three parts, restated for this page and located:**

- **P1 (something is being measured about the visitor's own situation):** the h1,
  `"Are AI models recommending your brand, or your competitors?"`, 56px at 1280 / 36px at 375. Carried. MEASURED.
- **P2 (what the product is, in the visitor's vocabulary):**
  `"See what the top AI engines tell your customers when they ask about your category. Type your domain and get a
  scored answer in under a minute."` at 18px / 17px (`index.html:1510`). Carried. MEASURED.
- **P3 (the next step):** `#auditBtn`, `"Check my visibility ->"`, 15px, solid violet fill. Carried. MEASURED.

The page passes the literal three-second test at both widths. That is a real result and it should be recorded as such.
The problems are what the pass conceals.

### F-L1-01 The hook competes with 47 other qualifying text leaves at 1280 (HIGH)

164 elements and 48 qualifying text leaves render inside the fold at 1280x800. MEASURED. Twenty-one of those leaves are
the engine-split table alone (seven engines times three leaves each: name, bar value, animated value). A visitor must
visually reject a seven-row data table before reaching the sentence that explains what the product is. The h1 is at
top 176, the explanatory sentence at top 373, the button at top 489, and the engine table occupies top 400 to 610,
running alongside and below the call to action. MEASURED.

### F-L1-02 At 375 the entire proof card is below the fold (CRITICAL)

This is the single most consequential measurement in the audit. At 375x812 the above-fold sequence is: brand mark,
`Get started` button, eyebrow, h1, explanatory paragraph, input, button, trust row, then the cookie panel. The first
leaf belonging to the hero data card is the label `"Mention rate"` at **top 794.9px**, which is 17px from the 812px
fold line and is the last thing in the viewport. MEASURED. The numbers themselves (70.8%, 46/65, the seven per-engine
rates) do not appear above the fold at 375 at all. MEASURED, confirmed against the rendered screenshot.

The rebuild's entire thesis is a live instrument printing real client data. On a phone that instrument is invisible
until the visitor scrolls. INFERRED: mobile visitors experience a generic AI-visibility landing page with no proof.

### F-L1-03 The consent panel occupies 22 percent of the mobile fold (HIGH)

The cookie panel measures **351x180px at top 620** at 375x812, which is **22 percent of the fold**, and **720x85 at
top 703** at 1280x800, which is 11 percent. MEASURED. It does not block any control: `document.elementFromPoint` at the
centre of `#auditBtn`, `#brandInput`, `#runYours` and `#replayBtn` returns the control itself, not the panel, at both
widths. MEASURED, so this is an occlusion and attention finding, not a blocking defect. On mobile the panel visually
overlaps the `No credit card required` trust line and covers the top edge of the data card.

### F-L1-04 The headline is a question, and the page never answers who it is for (HIGH)

The h1 is interrogative. The word "your brand" is the only audience marker on the page. There is no industry, no role,
no company size, no vertical, and no use case named anywhere above the fold. MEASURED: the full above-fold text at both
widths contains no ICP token. INFERRED: a marketing lead at a mid-market SaaS company and a local restaurant owner read
the identical page, and neither is told this was built for them.

---

## 3. Lens 2: Conversion path

### Calls to action above the fold

**Two elements carry a solid violet fill (`rgb(124, 58, 237)`) above the fold.** MEASURED.

| Control | Rect (1280) | Destination | Fill |
|---|---|---|---|
| `a.nav-cta` "Get started" | 119x48 at top 14 | `https://app.getbrandgeo.com/signup` | solid violet |
| `button#auditBtn` "Check my visibility ->" | 196x45 at top 489 | runs the in-page audit | solid violet |

These are two different offers (create an account now, versus try the free instant check) rendered in the same visual
weight. At 375 the nav button is worse: it measures 109x46 at top 14 and is, by area and position, the most prominent
element in the first paint, competing directly with the hero action 458px below it. MEASURED, confirmed on the mobile
screenshot. **Two equally weighted primaries is zero primaries.**

### Primary action state coverage

I did **not** exercise the audit form. No domain was submitted and no request was sent. Coverage below was established
by reading the handler at `brandgeo/web/site.js:376-460` and the documented contract at `site.js:31-41`, plus computed
style measurement for the focus state.

| State | Verdict | Evidence |
|---|---|---|
| idle | COVERED | Button renders with label and solid fill. MEASURED. |
| hover | NOT VERIFIED | Not measured; requires synthetic pointer state I did not exercise. |
| focus | **BROKEN** | `index.html:256` sets `.search-inner input:focus-visible { outline: none; }`. See F-L2-02. MEASURED. |
| active | NOT VERIFIED | Not measured. |
| loading | COVERED | `setButtonScanning(true)`, button disabled, label becomes `Scanning the engines...`, skeleton shown. `site.js:188-190`. |
| success | COVERED | `renderAuditResult(...)`, button becomes `Check another ->`. `site.js:249-250`. |
| empty input | COVERED | `val.length < 2` yields `Enter your domain, for example yourcompany.com` plus focus, with a source comment noting a silent focus previously "reads as a dead button". `site.js:379-383`. |
| invalid input | COVERED | HTTP 400 message passed through to the visitor verbatim. `site.js:405-410`. |
| server error | COVERED | Non-ok status falls to the catch, which announces `Taking you to the full audit...` and hands off after 600ms rather than stranding. `site.js:432-452`. |
| rate limited | COVERED twice | Client-side `AUDIT_RATE_MAX` check at `site.js:385-387`, plus server 429 pass-through at `site.js:405`. |
| offline | COVERED | Same catch path as server error; `fetchWithTimeout` guarantees it fires. `site.js:432-452`. |

**Headline metric: 8 of 11 states COVERED, 1 BROKEN, 2 not verified. Verified coverage 73 percent (8/11);
of the 9 states I could settle, 8 are covered.**

This is materially better than the category norm and deserves saying plainly: the failure path inside the primary CTA
hands the visitor forward instead of showing an error, and the source comments show the empty-input case was already
caught and fixed once.

### Link reachability

**Zero dead ends. MEASURED.** All 75 anchors were enumerated; every one of the in-page hash links resolves to an element
that exists in the document (`brokenHashes: []`). No anchor points at a missing id at either width.

### F-L2-01 Two solid-violet primaries above the fold (HIGH)

See the table above. MEASURED.

### F-L2-02 The one field the visitor must type into has no focus ring (HIGH)

`index.html:256` reads `.search-inner input:focus-visible { outline: none; }`. Under a real keyboard traversal
(CDP `Input.dispatchKeyEvent` Tab, not programmatic `.focus()`), `#brandInput` is the **only** control among the first
fourteen tab stops that renders no visible focus indicator: computed `outline-style: none`, `box-shadow: none`, while
`:focus-visible` matches true. MEASURED. Every other stop, including `#auditBtn`, `a.nav-cta`, `#themeBtn`, `#runYours`
and `#replayBtn`, renders `solid 2px rgb(139, 92, 246)` at 2px offset. MEASURED.

This matters more than a normal focus bug: `site.js` focuses `#brandInput` when a visitor arrives on `/#free-audit`,
which is the CTA target for roughly 90 pages of the site. A keyboard visitor arriving from any of them is placed,
silently, on the only unmarked control on the page. WCAG 2.4.7. INFERRED consequence, MEASURED cause.

### F-L2-03 62 of 85 controls are under 44px on at least one axis at 375 (MEDIUM)

MEASURED. Worst offenders that sit on the conversion path or in the header: `button` "Open menu" 36x36,
`#themeBtn` 40x40, `#replayBtn` 28x28, `#billingToggle` 44x24, `#runYours` 166x17, and all eight footer social links
at 32x32. The primary controls are fine: `#brandInput` is 321x48 and `#auditBtn` is 321x48 at 375. MEASURED.

---

## 4. Lens 3: Credibility and craft

### Contrast

**350 text leaves were checked across the whole page in the default dark theme, alpha-blended against their real
rendered backgrounds. One fails.** MEASURED.

| Element | Ratio | Required | Detail |
|---|---|---|---|
| `"from EUR 0"` | **4.21:1** | 4.5:1 | 12px, weight 400, `rgba(255,255,255,0.8)`, at document top 4534 (pricing) |

One failure in 350 is a good result and the prior claim that this page has a contrast problem does not survive
measurement. See Refuted claims.

**Interface component contrast (WCAG 1.4.11, 3:1) is a different story: 13 of 18 measured components fail.** MEASURED.

| Component | Measured | Required |
|---|---|---|
| `INPUT#name` / `#email` / `#company` / `SELECT#industry` / `TEXTAREA#message` fill | **1.04:1** | 3:1 |
| Same five, border | **1.50:1** | 3:1 |
| `BUTTON#themeBtn` border | 1.57:1 | 3:1 |
| `BUTTON#replayBtn` border | 1.50:1 | 3:1 |
| `BUTTON#billingToggle` fill | 1.57:1 | 3:1 |

The five contact-form fields are the material ones: at 1.04:1 fill and 1.50:1 border, the input boxes on the
"Request the deeper, done-for-you audit" form are very close to indistinguishable from the panel behind them.
That is a conversion surface, not decoration. MEASURED.

### Performance

| Metric | Desktop 1280 | Mobile 375 |
|---|---|---|
| Largest Contentful Paint | **644ms**, element is the `h1` | **604ms**, same element |
| Cumulative Layout Shift | **0.0195** | **0** |
| Total transferred | **86,928 bytes** | 86,957 bytes |
| Requests | 11 | 11 |
| DOMContentLoaded / load | 644ms / 1029ms | - |

All MEASURED. This is a genuinely fast page and the LCP element being the headline is the correct outcome.
CLS is well inside the 0.1 threshold, so the hero does not shift after load and there is no Lens 1 consequence.

**Render-blocking resources: 2.** MEASURED.
- `https://fonts.googleapis.com/css2?family=Inter...&family=Instrument+Serif&family=JetBrains+Mono...` (third-party stylesheet)
- `https://getbrandgeo.com/ga4-init.js?v=20260729d` (first-party, synchronous, no `async` or `defer`)

The second is self-inflicted: an analytics initialiser blocking first render on a page whose whole argument is speed.

### Motion

**`prefers-reduced-motion: reduce` is honoured, and honoured well.** Under emulated reduce, the animated element count
drops to **0**, `#replayBtn` is hidden, and `#repScore` still reads its final value `70.8` rather than a blank or a
stalled counter. MEASURED. That last detail is the part most implementations get wrong. No finding.

### Proof ordering

Order of evidence after the hero, MEASURED from document order (`index.html:1697-1707`):
`Citable methodology / DOI` -> `AI Visibility Index Issue 1` -> `34 research articles` -> `27 cities measured` ->
`Research led by Constantin Daniel` -> `EU based / GDPR` -> `Featured on Fazier`.

Every one of those is **academic or self-referential authority**. Not one is a customer. The first piece of proof
offered after the headline does not support the headline's claim, which is about whether AI recommends *your* brand;
it supports a claim about the vendor's research credibility. INFERRED from measured order.

### F-L3-01 Zero named customers, zero testimonials, zero logos (CRITICAL)

MEASURED: `grep -ciE "testimonial|trusted by|customers say|case study|<blockquote"` against `index.html` returns **0**.
There are **3 images on the entire page**: `logo-nav.png` twice, and an external Fazier badge SVG. MEASURED.

All four competitors carry named commercial proof above or near the fold (see table). AthenaHQ names Amazon, Delta,
Coinbase, Checkr, DeVry University and others in logo `alt` text; Otterly names Opera, Avis Budget Group, AUTO1, SQLI
and claims "Trusted by 40,000+ Marketing Pros worldwide". MEASURED via `curl` on 2026-08-13.

### F-L3-02 There is no product screenshot anywhere on the page (HIGH)

MEASURED (image inventory above). The hero instrument is DOM and CSS rendered, which is a defensible and in some ways
superior choice, but it renders *data*, not the product. A visitor never sees the dashboard they would be buying.
The one visual that would answer "what do I actually get" does not exist on the page.

### F-L3-03 The proof is real but uncalibrated, so a stranger cannot use it (HIGH)

The hero prints `70.8%` mention rate, `46/65 answers`, window `2026-07-21 to 2026-08-07`, and seven per-engine rates,
labelled `CLIENT MEASUREMENT` and disclosed as `Real collection data from a BrandGEO client. Client anonymized.`
MEASURED. The data is real and must not be relabelled.

Three measured properties undermine its persuasive work, and none of them require changing the data:

1. **The disclosure is the smallest type on the page.** It renders at **12px at 4.95:1**, at top 649, below the CTA,
   ranking it below every number it authenticates. MEASURED.
2. **There is no benchmark.** Nothing on the page tells a visitor whether 70.8 percent is good, bad, or typical.
   A number with no scale cannot persuade. MEASURED: no comparative figure appears above the fold at either width.
3. **Two engines read 100.0 percent** (Gemini and Google AI Mode). MEASURED. To a cold visitor, a perfect score from
   an anonymous source reads as either trivial or arranged, and anonymity removes the only way to check. INFERRED.

### F-L3-04 Claim integrity: the articles advertise five engines, the homepage advertises seven (MEDIUM, spans marketing and content)

MEASURED on both sides:
- `brandgeo/web/index.html:24` and `:47` and `:85`: "up to seven AI engines", and the hero card prints seven engine rows.
- `brandgeo/web/bg-019.html:350`: "We'll run your real buyer questions across **five AI engines**".
- `brandgeo/web/bg-026.html:259`: "We'll run your real buyer questions across **five AI engines**".

A visitor arriving from either article is promised less than the homepage delivers, in the sentence that carries the CTA.
Owners: `bg-web` for the article template, `bg-copy` for the wording.

### F-L3-05 Claim integrity: the same nav slot points at two different offers across articles (MEDIUM)

MEASURED:
- `bg-019.html:226` and `bg-026.html:147`: `<a href="/#contact" class="nav-cta">Get started</a>` (the 48-hour manual form).
- `bg-030.html:243`: `<a href="/#free-audit" class="nav-cta">Free test</a>` (the instant check).

Same visual slot, two labels, two destinations, two different promises. `/#contact` is the slower offer, and it is the
one the older articles send traffic to. Owner: `bg-web`.

---

## 5. Lens 4: AI answer readiness

### Structured data

**One `application/ld+json` block, parses cleanly, uses `@graph` with three nodes:** `Organization`, `WebSite`,
`SoftwareApplication`. MEASURED (`JSON.parse` on the live block). The `SoftwareApplication` carries six `Offer` nodes:
EUR 0 Free, EUR 29 Radar, EUR 99 Essentials, EUR 299 Growth, EUR 449 Growth PRO, EUR 1500 Managed. MEASURED.

**Honesty check passes on the things that usually fail:** there is no `aggregateRating` and no `review` node, so no
fabricated star rating is being fed to engines. MEASURED. The types describe what the thing is.

One flag, recorded as low severity. The Radar offer publishes `price: "29"` with no `availability` and no
`priceValidUntil`, while the page's own news blurb at `index.html:2275` describes EUR 29 as the price
"for the first 100 customers". MEASURED. A quantity-limited launch price published to engines as the standing price
will be quoted back as the standing price after the hundredth customer.

### Heading hierarchy

**One `h1`. MEASURED.** 25 headings total, and the outline runs h1 -> h2 -> h3 -> h2 -> h3 -> h2 -> h3 -> h4 with
**no skipped levels**. MEASURED. Section headings state claims rather than tease: "Seven engines, measured the same way.",
"One number, six dimensions.", "Start free. Fix your visibility when you're ready."

One structural note: the `h1` is a **question**. An engine asked "what is BrandGEO" and extracting the h1 receives an
interrogative, not a definition. The `meta description` and the `SoftwareApplication.description` both carry a proper
declarative definition, so the answer is recoverable, but not from the most heavily weighted element. INFERRED.

### Extractability without CSS

**Passes.** With every stylesheet disabled and every `<style>` removed, the first screen of body text reads:

```
BrandGEO
How it worksPricingResearchFAQ
Get started
01 - AI Visibility Platform
Are AI models recommending your brand, or your competitors?
See what the top AI engines tell your customers when they ask about your category.
Type your domain and get a scored answer in under a minute.
  Check my visibility ->
Free audit  Results in under a minute  No credit card required
Client measurement 2026-07-21 to 2026-08-07
Mention rate 70.8% 46 of 65 answers - best position #1
Engine split 7 engines - 65 answers
 ChatGPT 78.6% / Gemini 100.0% / Claude 63.2% / Perplexity 77.8% / Google AI Mode 100.0% ...
```

MEASURED. "What is this and who is it for" is answerable on what and not on who, which is the same gap Lens 1 found,
now visible to machines as well as people. The hero numbers survive as text, in order, with their labels intact.

### Crawler permission

**`https://getbrandgeo.com/robots.txt` returns 200 and explicitly allows every relevant AI retrieval agent.** MEASURED:
`OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `YouBot`, `Google-Extended`,
plus `User-agent: * / Allow: /` and a sitemap reference. The file even carries a correct comment explaining that
blocking `Google-Extended` would affect Gemini training and not live grounding. The page is permitted to be cited.

`<link rel="canonical" href="https://getbrandgeo.com/">` is present and self-referential. MEASURED.
No `meta robots` tag is present, which is correct for an indexable homepage. MEASURED.

### Primary claim as text

The headline, the sub, the score, the engine names and every per-engine percentage are live DOM text, not baked into an
image or a canvas. MEASURED (they survive the CSS strip above). This is the one place where the DOM-rendered instrument,
rather than a screenshot, is unambiguously the right call.

---

## 6. The nine founder questions

### Pillar 1: positioning as visible on the page

**Q1. Target audience clarity: specific ICP with a burning pain, or too broad?**
**VERDICT: too broad. No ICP is stated anywhere on the page.**
MEASURED: the complete above-fold text at 1280 and 375 contains no industry, role, company size, or vertical. The only
audience marker is the possessive "your brand". By contrast, three of four competitors name their audience in the
headline or meta description: Peec "for marketing teams", AthenaHQ "commercial & enterprise businesses",
Otterly "40,000+ Marketing Pros". MEASURED 2026-08-13.

**Q2. Value versus feature focus: does the headline state a tangible measurable outcome?**
**VERDICT: neither. It asks a question.**
`Are AI models recommending your brand, or your competitors?` names no outcome and no feature. MEASURED. It creates
doubt, which is a legitimate hook mechanism, but the measurable outcome the product delivers (a mention rate, a score,
a per-engine breakdown) sits in the card beside it rather than in the sentence. The sub-headline carries the closest
thing to an outcome: "get a scored answer in under a minute" (`index.html:1510`), which is an outcome about speed of
diagnosis, not about business result.

**Q3. Differentiation against the top 3 competitors: is superiority obvious for a niche?**
**VERDICT: no, and the page concedes the strongest ground.**
MEASURED comparison below. BrandGEO's genuine, defensible differentiators exist and are on the page but are ranked low:
seven engines measured the same way (more engines than any competitor advertises above the fold), a citable DOI
methodology, EU/GDPR basis, and 27 cities of published research. These sit in 12px to 14px chips below the hero
(`index.html:1697-1707`). Meanwhile the axis every competitor competes on, named customers, is absent entirely.

**Q4. Problem urgency: painkiller or vitamin?**
**VERDICT: vitamin, by a narrow margin, and it is a framing choice not a copy accident.**
The page frames a question ("are they recommending you?") and offers a measurement. It never states a consequence:
no revenue at risk, no competitor named as taking the visitor's place, no deadline, no cost of inaction. MEASURED: no
loss, risk, or urgency language appears above the fold at either width. The one place urgency exists is the
competitor half of the h1, "or your competitors?", which is left entirely unelaborated above the fold. INFERRED:
the page sells curiosity, and curiosity converts to a free check but not to a paid plan.

### Pillar 2: landing page and acquisition

**Q5. Above-the-fold clarity in 5 seconds: what it does, who it is for, what to do next?**
**VERDICT: two out of three. What it does: yes. What to do next: yes. Who it is for: no.**
MEASURED, and this is the formal Lens 1 result: P1, P2 and P3 are all carried by qualifying (>= 14px) leaves at both
widths, so the page PASSES the mechanical three-second test at 1280x800 and at 375x812. It fails the audience half,
which the standard test does not ask about but a founder should.

**Q6. Signup friction: how much is asked before the user sees value?**
**VERDICT: excellent, and the best-executed part of the entire funnel. Essentially zero.**
MEASURED: the hero asks for **one field**, `#brandInput`, a domain. No email, no password, no credit card. The trust
row states `Free audit`, `Results in under a minute`, `No credit card required` (`index.html:1521`). A hidden honeypot
`#auditHp` exists for spam and is not a real field. The downstream signup at `brandgeo-dashboard/src/pages/Signup.tsx`
asks for name and email only (`:127`, `:140`). Competitors mostly require a demo booking or a trial signup before any
value. This is a genuine competitive advantage that the page does not brag about.

**Q7. Visual proof: real screenshots, interactive previews, video, or abstract graphics?**
**VERDICT: an interactive preview of DATA, and no preview of the PRODUCT.**
MEASURED: 3 images on the page, being the nav logo twice and an external Fazier badge. Zero product screenshots, zero
video. The hero instrument is a live DOM component showing real client numbers, which is stronger than a static
screenshot for proving the measurement is real, and weaker than a screenshot for proving the product exists and is
worth EUR 99 a month. Both jobs need doing and only one is done.

**Q8. Social proof and authority adjacent to primary CTAs?**
**VERDICT: no social proof exists anywhere on the page. Authority exists but is not adjacent to the CTA.**
MEASURED: zero testimonials, zero customer logos, zero "trusted by" (grep count 0). The authority chips (DOI,
AI Visibility Index, 34 articles, 27 cities, EU/GDPR, Fazier) are at document top 1487 to 1727 at 375, which is
**more than a full viewport below** the primary CTA at top 472. MEASURED. Nothing sits beside the button except the
`Free audit / under a minute / no credit card` row, which is friction relief, not proof.

**Q9. Messaging alignment with the articles that bring visitors here?**
**VERDICT: misaligned on two measurable axes.**
1. **Engine count.** Homepage promises seven (`index.html:24, :47, :85`); `bg-019.html:350` and `bg-026.html:259`
   promise five, in the sentence carrying their CTA. MEASURED.
2. **CTA destination.** `bg-019.html:226` and `bg-026.html:147` send "Get started" to `/#contact`, the 48-hour manual
   form. `bg-030.html:243` sends "Free test" to `/#free-audit`, the instant check. MEASURED. Same slot, two offers.

The homepage itself is internally consistent on the instant-versus-48-hour distinction and states it explicitly at
`index.html:2190` and `:2217`. That is a refutation, recorded below.

---

## 7. Competitor side-by-side

All four fetched live on **2026-08-13** with a standard browser user agent. All four returned **HTTP 200**. MEASURED.

| | **BrandGEO** | **Peec AI** | **Profound** | **AthenaHQ** | **Otterly** |
|---|---|---|---|---|---|
| Headline | "Are AI models recommending your brand, or your competitors?" | "AI search analytics for marketing teams" | "Marketing agents to win in [AI search]" | h1 is JS-rendered; title "Agents to Win on AI Search" | "We otter know where..." |
| ICP named above fold | **none** | **"marketing teams"** | marketing / brands | **"commercial & enterprise businesses"** (meta) | **"40,000+ Marketing Pros"** |
| Proof above fold | anonymized client data, no names | none found in static markup | none found in static markup | **named logos: Amazon, Delta, Coinbase, Checkr, Apryse, DeVry, Coupons.com, Dutch Pets** | **named logos: Opera, Avis Budget Group, AUTO1, SQLI, Bacula** plus "Trusted by 40,000+" |
| CTA type | **self-serve, 1 field, no card** | "Start Free Trial" + "Talk to Sales" | "Get a Demo" / "Get Started" | "Book a Demo" / "Get Free Audit (10m)" / "Start for Free" | "Start Your Free 14-Day Trial" / "Book a Demo" |
| Public price signal | **full ladder, EUR 0 to 1500** | none on page | $13 seen | $25, $300/month | $29/month |
| Stated differentiator | seven engines, citable DOI method, EU/GDPR | analytics depth for marketing teams | agents that act, not just measure | enterprise-grade, agentic | breadth plus free GEO tools |

**What the table says.** BrandGEO wins on friction (one field versus a demo booking), on price transparency, and on
engine count. It loses, universally and on the one axis buyers use to shortlist, on named customers: two of four
competitors put recognisable enterprise logos above the fold and BrandGEO shows none. It also loses on audience
naming, where three of four are explicit and BrandGEO is silent. INFERRED from the MEASURED rows.

---

## 8. Top 5 actions, ranked by visitor impact divided by effort

No fix is drafted. Each names what, where, and who owns it.

| # | Action | Where | Owner |
|---|---|---|---|
| 1 | Name the ICP in the hook. The page has no audience marker at any width; decide who this is for and put it where the eyebrow currently spends its 12px on "01 - AI VISIBILITY PLATFORM". Highest impact, lowest effort, and it unblocks questions 1, 3, 4 and 5 at once. | `brandgeo/web/index.html:1500-1512` (eyebrow, h1, hero sub) | `bg-strategy` decides, then `bg-copy` |
| 2 | Get the proof above the mobile fold, or move a proof token up to meet it. At 375 the first data leaf is at top 794.9 of an 812 fold and the numbers themselves never appear. Requires a design decision on hero order at small widths, not a patch. | `brandgeo/web/index.html` hero block, mobile breakpoint | `bg-design`, then `bg-web` |
| 3 | Resolve the two solid-violet primaries. `a.nav-cta` and `#auditBtn` carry the identical fill and point at different offers; at 375 the nav button is the most prominent thing in first paint. One of them should stop being violet. | `brandgeo/web/index.html:256` region and nav markup | `bg-design`, then `bg-web` |
| 4 | Restore the focus ring on `#brandInput`. One CSS declaration removes the only focus indicator on the page, on the exact field that `site.js` auto-focuses for every arrival on `/#free-audit`, which is the CTA target for about 90 pages. | `brandgeo/web/index.html:256` | `bg-web` |
| 5 | Fix the two article-to-homepage contradictions. "Five AI engines" in the CTA sentence of `bg-019` and `bg-026` against seven on the homepage, and the `/#contact` versus `/#free-audit` split in the same nav slot. These misprice the offer for every visitor arriving from content. | `bg-019.html:350`, `bg-026.html:259`, `bg-019.html:226`, `bg-026.html:147`, `bg-030.html:243` | `bg-copy` for wording, `bg-web` for the template |

---

## 9. Findings ledger

| ID | Lens | Sev | Finding | Evidence | Owner |
|---|---|---|---|---|---|
| F-L1-01 | 1 | HIGH | Hook competes with 47 other qualifying text leaves | 164 elements, 61 leaves, 48 at >= 14px above fold at 1280x800; 21 leaves are the engine table alone. MEASURED via CDP. | `bg-design` |
| F-L1-02 | 1 | CRITICAL | Entire proof card is below the fold at 375 | First card leaf `"Mention rate"` at top **794.9px** against an 812px fold; no numeric value above fold. MEASURED, screenshot confirmed. | `bg-design` |
| F-L1-03 | 1 | HIGH | Consent panel takes 22 percent of the mobile fold | 351x180 at top 620 (375x812) = 22 percent; 720x85 at top 703 (1280x800) = 11 percent. Blocks no control (`elementFromPoint` returns the control at both widths). MEASURED. | `bg-design` |
| F-L1-04 | 1 | HIGH | No ICP anywhere on the page | Full above-fold text at both widths contains no industry, role, size, or vertical token. MEASURED. | `bg-strategy` |
| F-L2-01 | 2 | HIGH | Two solid-violet primaries above the fold | `a.nav-cta` 119x48 at top 14 and `#auditBtn` 196x45 at top 489, both `rgb(124,58,237)`, different destinations. MEASURED. | `bg-design` |
| F-L2-02 | 2 | HIGH | `#brandInput` has no focus indicator | `index.html:256` `.search-inner input:focus-visible { outline: none; }`. Real Tab traversal: only stop of 14 with `outline-style: none` and `box-shadow: none` while `:focus-visible` is true. WCAG 2.4.7. MEASURED. | `bg-web` |
| F-L2-03 | 2 | MEDIUM | 62 of 85 controls under 44px at 375 | `#replayBtn` 28x28, "Open menu" 36x36, `#themeBtn` 40x40, `#billingToggle` 44x24, 8 social links 32x32. MEASURED. | `bg-design` |
| F-L3-01 | 3 | CRITICAL | Zero named customers, testimonials or logos | grep for testimonial/trusted by/case study/blockquote returns **0**; 3 images total, all logo or badge. Competitors show named enterprise logos. MEASURED. | `bg-strategy` |
| F-L3-02 | 3 | HIGH | No product screenshot anywhere | Image inventory: `logo-nav.png` x2 plus external Fazier badge. MEASURED. | `bg-design` |
| F-L3-03 | 3 | HIGH | Proof is real but uncalibrated and its disclosure is the smallest type on the page | Disclosure 12px at 4.95:1 at top 649, below the CTA; no benchmark for 70.8 percent anywhere; two engines read 100.0 percent. MEASURED. | `bg-strategy`, `bg-copy` |
| F-L3-04 | 3 | MEDIUM | Engine count contradiction, marketing and content | `index.html:24, :47, :85` say seven; `bg-019.html:350` and `bg-026.html:259` say five in the CTA sentence. MEASURED both sides. | `bg-copy` + `bg-web` |
| F-L3-05 | 3 | MEDIUM | Same nav slot, two offers, across articles | `bg-019.html:226` and `bg-026.html:147` to `/#contact`; `bg-030.html:243` to `/#free-audit`. MEASURED. | `bg-web` |
| F-L3-06 | 3 | MEDIUM | 13 of 18 interface components fail WCAG 1.4.11 | Contact form fields fill **1.04:1**, border **1.50:1**; `#themeBtn` 1.57:1; `#replayBtn` 1.50:1; `#billingToggle` 1.57:1. Required 3:1. MEASURED. | `bg-design` |
| F-L3-07 | 3 | LOW | One text contrast failure in 350 | `"from EUR 0"` at **4.21:1**, needs 4.5:1, 12px `rgba(255,255,255,0.8)`, pricing section. MEASURED. | `bg-web` |
| F-L3-08 | 3 | LOW | First-party analytics script blocks first render | `ga4-init.js?v=20260729d` in `<head>` with no `async` or `defer`. MEASURED. | `bg-web` |
| F-L3-09 | 3 | MEDIUM | Proof ordering does not support the headline's claim | First six proof chips are DOI, Index, article count, city count, researcher name, GDPR. None is a customer. MEASURED order `index.html:1697-1707`. | `bg-strategy` |
| F-L4-01 | 4 | LOW | Limited-time price published as standing price | JSON-LD Radar `price: "29"`, no `availability`, no `priceValidUntil`, while `index.html:2275` describes EUR 29 as "for the first 100 customers". MEASURED. | `bg-web` |
| F-L4-02 | 4 | LOW | The h1 is a question, so the highest-weighted element yields no definition | h1 is interrogative; declarative definition exists only in meta description and `SoftwareApplication.description`. MEASURED. | `bg-copy` |

---

## 10. Refuted claims

Mandatory section. Each item below was asserted or implied by a prior artifact, by the project record, or by my own
earlier measurement, and did not survive re-measurement.

1. **"The primary CTA has no visible focus indicator" (pre-rebuild `docs/design/homepage-hook.md`). REFUTED.**
   Under real keyboard traversal, `#auditBtn` renders `outline: solid 2px rgb(139,92,246)` at 2px offset and matches
   `:focus-visible`. Thirteen of the first fourteen tab stops render the same ring. MEASURED via CDP
   `Input.dispatchKeyEvent`. Only `#brandInput` lacks one, which is F-L2-02 and is a narrower finding than the original.

2. **My own pass-2 result that no control has a focus ring. REFUTED by my own better measurement.**
   Programmatic `element.focus()` does not reliably satisfy Chrome's `:focus-visible` heuristic, so the first test
   returned six false negatives. Recording the method failure because the correction changed a top-5 finding: any
   focus audit on this page must dispatch real key events, not call `.focus()`.

3. **"The homepage scrolls sideways at 375" (project record, measured 123px in 2026-08-02 from `.mode-switch`). REFUTED,
   the fix holds.** Real scroll attempted: `window.scrollTo(600,0)` leaves `scrollX` at **0**, and
   `document.scrollingElement.scrollWidth` equals `innerWidth` at 375 (375 = 375) and is *below* it at 1280
   (1265 vs 1280). MEASURED at both widths. No horizontal overflow exists on the live homepage.

4. **"otterly.ai 403s plain HTTP clients" (prior research). REFUTED.**
   `https://otterly.ai` returned **HTTP 200** with 242,234 bytes to `curl` with a standard browser user agent on
   2026-08-13. MEASURED. Its data in the competitor table is first-party, not secondary-sourced.

5. **"The page has a contrast problem." REFUTED for text.**
   350 text leaves checked across the whole page with real alpha blending against real rendered backgrounds:
   **1 failure**, and it is a 12px price label at 4.21:1. MEASURED. The real contrast defect is in non-text components
   (F-L3-06), which is a different success criterion and was not what was claimed.

6. **"The hero data card duplicates its numbers in the DOM, so extraction will read 70.8 twice." REFUTED.**
   I raised this myself after seeing both `70.8` and `70.8%` as separate text leaves. A regex sweep for repeated
   adjacent numerals across `body.innerText` returns **zero** duplicate pairs, and the CSS-stripped extraction reads
   `Mention rate 70.8% 46 of 65 answers` cleanly. MEASURED. The animated counter does not pollute the accessible text.

7. **"Motion is unguarded / the instrument animates regardless of preference." REFUTED.**
   Under emulated `prefers-reduced-motion: reduce`, animated element count is **0**, `#replayBtn` is hidden, and
   `#repScore` still shows its final value `70.8`. MEASURED. This is a correct implementation, including the part
   most sites get wrong.

8. **"The homepage confuses the instant audit with the 48-hour audit." REFUTED at the homepage.**
   `index.html:2190` states "The instant check in the hero scores your domain in under a minute. The full free audit is
   deeper... and lands within 48 hours", and `:2217` repeats the distinction. MEASURED. The conflation is real but it
   lives in the articles (F-L3-05), not on the homepage.

9. **"The page is slow or heavy." REFUTED.**
   86,928 bytes across 11 requests, LCP 644ms on the h1, CLS 0.0195 at desktop and 0 at mobile. MEASURED.

---

## 11. Could not verify

Silence here would read as a clean bill of health, so every unsettled item is listed with its reason.

1. **Hover and active states of the primary CTA.** Not measured. Establishing them needs synthetic pointer events I did
   not dispatch, and CSS inspection alone would be an assertion rather than a measurement. 2 of the 11 Lens 2 states.
2. **The audit form's real behaviour end to end.** Never exercised. No domain was submitted and no request was sent to
   `audit-domain`. All state coverage in Lens 2 comes from reading `site.js:376-460` and its documented contract at
   `site.js:31-41`. The success and error rendering could differ from what the source implies.
3. **Light mode.** Not audited. The theme toggle writes a persisted preference, and exercising it mutates user state.
   All contrast figures in this report are for the default dark theme only. Light mode remains UNAUDITED, consistent
   with the standing project note.
4. **Whether 70.8 percent is a good number.** No benchmark exists in the repo or on the page, so I cannot say whether
   the hero's headline figure flatters or undersells the product. This is the missing input for F-L3-03 and it needs
   the founder, not an audit.
5. **Real-device mobile rendering.** All mobile figures come from CDP device emulation at 375x812 with a Pixel user
   agent. Emulation does not reproduce a real browser's URL bar, which would reduce the effective fold by roughly 60px
   to 100px and push the proof card further out of view. The direction of the error is known, the magnitude is not.
6. **AthenaHQ's above-fold headline.** Its `h1` is JavaScript-rendered and empty in static markup; its row in the
   competitor table uses the `title` and `meta description`, which is weaker evidence than the other three rows.
7. **Whether competitors' named logos represent paying customers.** I read logo `alt` text from their markup. I did not
   verify any commercial relationship, and neither can a visitor, which is itself the point of the comparison.
8. **Traffic, bounce, and conversion data.** No analytics were consulted. Every conversion claim in this report is a
   structural inference from measured page properties, not an observed funnel. If Plausible or GA4 data exists, it
   should be allowed to overrule my inferences about visitor behaviour.
9. **The 48-hour form and the signup flow past the first screen.** Not exercised, per the no-submission rule.
   `Signup.tsx:127-145` shows name and email; whether a later step asks for a card was not verified.

---

## 12. Method note, for reproduction

- The in-app Browser pane cannot measure layout in this environment (`clientWidth` reads 0), so every geometric number
  here came from **headless Chrome driven over CDP** from Node 24 using the global `WebSocket`, with no dependency.
  Scripts used: `cdp.mjs` (geometry, text leaves, vitals, screenshots, CSS-strip extraction), `audit2.mjs` (consent
  occlusion, full-page contrast, anchors, reduced motion), `focus.mjs` (real Tab traversal). All in the session
  scratchpad, none written into the repo.
- Contrast was computed by walking each text node's ancestors, compositing every semi-transparent background in order,
  then applying the WCAG relative-luminance formula. Verdicts are reported as ratios so they can be rechecked.
- Overflow was tested by attempting a real scroll and reading `scrollX` back, never by comparing `scrollWidth` alone.
- No page, style, script, or document in the repository was modified by this audit.
