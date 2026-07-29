# Landing page audit: getbrandgeo.com homepage

Auditor: `landing-page-optimizer` (read-only). Date: 2026-07-29.
Target: `https://getbrandgeo.com/`, HTTP 200, `Last-Modified: Wed, 29 Jul 2026 07:28:57 GMT`.
Source of the live artifact: `brandgeo/web/index.html`, 2757 lines.

This audit changed nothing. No file except this one was written. No git command was run.
No form was submitted, no checkout was completed, no lead was sent. Every claim about the
primary call to action's behaviour was read out of `brandgeo/web/site.js` and is labelled
as inspected, not exercised.

---

## Calibration

```
SYSTEM VERIFICATION - landing-page-optimizer
1. File producing the page: brandgeo/web/index.html, 2757 lines. Supporting behaviour in
   brandgeo/web/site.js (1239 lines) and brandgeo/web/hero.js.
2. Live URL: https://getbrandgeo.com/ returns HTTP 200 (LiteSpeed, 137,152 bytes
   uncompressed, 33,618 bytes gzipped).
3. h1 as rendered, exactly:
     "Are AI models recommending your brand, or your competitors?"
   Computed font-size at 1280x800: 56px. Exactly one h1 on the page.
4. Fold line: 800 at desktop, 812 at mobile. Derived from
   document.documentElement.clientHeight read in the live page after resize, not assumed.
   Note the layout width at "1280" is 1265, not 1280: innerWidth 1280 minus a 15px
   classic scrollbar. All desktop x-coordinates below are in 1265 layout pixels.
5. Design tokens: the :root block at brandgeo/web/index.html:156 to :190.
   Example token value: --t2: #9ba1ac (declared as 7.58:1 against --bg).
6. Strategy and design artifacts exist: docs/strategy/hook-thesis-web.md and
   docs/design/homepage-hook.md. Both were read. Section 12 of the design artifact was
   treated as a set of hypotheses to disprove, not as inherited findings.
7. Commit audited: the live bytes are byte-identical (MD5 f4353d779b2ddce188a30a90419acda2)
   to brandgeo/web/index.html as it stood at repo HEAD 80bd61f0cfffe4e104395ca4ab52725b0fac5da7
   when this audit began. Today's date: 2026-07-29.
```

`CALIBRATED`

### One thing moved under the audit, and it matters

Repo HEAD advanced from `80bd61f0` to `04ce09e4` while this audit was running. Another
agent is working in this repository. The **live page did not change**: MD5 and
`Last-Modified` were identical on a re-fetch after the commit landed.

The working tree is now ahead of production in at least one place relevant to this audit:
the Growth PRO pricing card reads `6 AI engines` on the live page and `7 AI engines` in
the working tree. This audit is of what is live. Finding C4 records the divergence rather
than pretending it does not exist.

### Measurement method, and two traps that were hit and defeated

The browser pane used for measurement was **not compositing frames**
(`document.visibilityState === "hidden"`; a screenshot request returned
`the Browser pane is not displayed, so the page is not compositing frames`). Two documented
failure modes followed directly, and both produced false findings before being caught:

1. **`requestAnimationFrame` never fires.** Verified: a scheduled callback had not run
   after 1215ms. The hero sample score therefore reads `0` in this environment forever.
   That is an artifact, not a defect for a normal visitor, and it is **not** filed as one.
   It does have a genuine downstream consequence, filed as `L4-3`.
2. **CSS transitions never advance.** The first light-mode contrast sweep returned
   **147 failures**. Every one was false. `body` carries `transition: background .3s, color .3s`,
   so the page background stayed frozen at the dark value while text colours had already
   flipped to their light values, poisoning every background lookup. The instrument was then
   corrected twice:
   - a `html body *` rule does not match `body` itself, so the page background stayed frozen;
   - a `html *, body *` rule loses on specificity to `.nav-cta`'s own
     `transition: ... !important` (index.html:296 to :305), which made `.nav-cta` read
     1.14:1 in light mode. Also false.

   The instrument that finally held was **inline `!important` set per element**, which
   outranks any stylesheet rule at any specificity, followed by a forced reflow. After
   that correction `.nav-cta` resolved correctly to `#09090f` in light mode.

Two further instrument bugs were found and fixed before any number below was trusted:

3. **Gradient fills read as transparent.** Reading `backgroundColor` alone misses
   `linear-gradient` fills, which are `background-image`. Five controls looked like
   1.07:1 failures when the real backgrounds were violet gradients. The sweep now
   extracts every gradient colour stop and reports the worst one.
4. **`background-clip: text` elements were scored on the wrong colour.** Three elements
   on this page paint their glyphs with a gradient and set
   `-webkit-text-fill-color: transparent`. Their `color` property is inert. Scoring it
   produced three more false failures.

Horizontal overflow was tested by attempting a real scroll and reading `scrollX`, never
by `scrollWidth` alone. At 375 the pane reports `scrollWidth` 484 against `clientWidth` 375,
which looks like overflow and is not: `scrollX` stayed at 0.

---

## 1. Verdict

**The homepage now passes the three-second comprehension test at both widths, which the
existing design artifact says it fails, but it sells three capabilities on terms the product
does not honour, and the highest-value one is contradicted by the page's own pricing card
two blocks further down.**

| Lens | Score |
|---|---|
| 1. Hook and comprehension | **3** |
| 2. Conversion path | **4** |
| 3. Credibility and craft | **2** |
| 4. AI answer readiness | **3** |

## 2. Scorecard

| Lens | Score | The one sentence |
|---|---|---|
| Hook and comprehension | 3 | All three hook parts are carried by qualifying text at both widths, but the above-fold leaf count regressed from the build log's 30 to 43 with three items back under the 14px threshold, and at 375 the only evidence that a score exists now begins at y=811 against a fold of 812. |
| Conversion path | 4 | One primary action, nine of eleven states covered, zero dead ends, and every failure path lands the visitor on signup rather than a wall, held back only by a second accent-filled control sitting above the fold at 1280. |
| Credibility and craft | 2 | Three plan availability claims contradict `planConfig.ts`, the page contradicts itself on AI Social, eight text and background pairs fail WCAG AA including the primary call to action, and analytics plus an ad audience pixel fire with no consent gate under a footer that claims GDPR compliance. |
| AI answer readiness | 3 | The single JSON-LD block is valid against a real parser and its prices are honest, the heading tree is clean and AI crawlers are explicitly allowed, but a rendered FAQ section carries no `FAQPage` markup and the hero's sample score ships as the literal string `0` in the HTML that crawlers read. |

---

## 3. Top 5 actions, ranked by expected conversion impact over effort

No fixes are drafted here. Each names what, where, and who owns it.

| # | What | Where | Owner |
|---|---|---|---|
| 1 | The AI Social availability marker promises a capability no self-serve customer can use, and the same page calls it "coming soon" 195 lines later. Decide which is true and make the page say one thing. | `brandgeo/web/index.html:2233` against `brandgeo-dashboard/src/lib/planConfig.ts:286` to `:295`, and `index.html:2428` | `bg-copy`, with `bg-strategy` adjudicating which side is correct |
| 2 | The AI SEO marker sells the feature one tier below where the product gates it, so a paying Essentials customer meets a lock. | `index.html:2226` against `planConfig.ts:294` | `bg-copy` |
| 3 | The primary call to action's own label fails AA at the light end of its gradient, and two other accent controls fail worse. This is the one control the entire thesis depends on. | `index.html` `.search-btn`, `.btn-snapshot` at `:1466`, `.bg-asst-launcher` at `site.js:1173` | `bg-design` to rule on the gradient, then `bg-web` |
| 4 | At 375 the sample report card, the only proof on the page that a score exists, starts one pixel below the fold. Three payment chips and a two-line trust row were added above it after the hero was designed. | `index.html`, `.pay-chip` group, measured top y=688 to 742 | `bg-design`, then `bg-web` |
| 5 | A second accent-filled pill ("Ask Jamie") sits above the fold at 1280 alongside the primary button. Two equally weighted primaries is zero primaries. | `site.js:1090` to `:1091`, rendered at top y=732 against a fold of 800 | `bg-web` |

---

## 4. Lens 1: hook and comprehension

**Exclusion threshold: text rendering below 14px is excluded from the pass criteria.**
Stated here so the count is reproducible.

Hook parts, restated for this page's subject:
- **P1**: something is being measured about the visitor's own brand.
- **P2**: the thing doing the recommending is an AI assistant.
- **P3**: the next step is to check their own domain.

### 4.1 At 1280x800 (layout width 1265)

**Headline metric: 43 text leaves above the fold. 3 render below 14px and are excluded.
40 qualify. Verdict: PASS.**

| Part | Carried by | Size |
|---|---|---|
| P1 | h1 fragment `your brand`; subline `Check your domain instantly...`; sample card label `AI Visibility Score` | 56px, 16.8px, 14px |
| P2 | h1 fragment `Are AI models recommending`; badge `AI Visibility Platform`; engine names `ChatGPT` `Gemini` `Claude` `Perplexity` `Google AI` | 56px, 14px, 14px |
| P3 | button `Check my visibility →`; subline | 15.04px, 16.8px |

All three parts are carried by at least two qualifying leaves each. The redundancy rule in
the design artifact's section 2.3 is satisfied.

The three excluded leaves are all in one group at y=703 to 720:
`Stripe supported`, `Crypto payments coming soon`, `(Crypto.com Pay)`, all 12.48px.

**Above-fold interactive element count: 12.** The design artifact's standing guardrail is
nine elements or fewer. The twelve are: logo, five nav links, nav CTA, theme toggle, domain
input, a 1px honeypot input, the primary button, and the "Ask Jamie" launcher.

### 4.2 At 375x812

**Headline metric: 15 text leaves above the fold. 3 render below 14px and are excluded.
12 qualify. Verdict: PASS.**

| Element | Top | Bottom | Size |
|---|---|---|---|
| nav CTA `Get started` | 28 | 46 | 14.08px |
| badge `AI Visibility Platform` | 125 | 143 | 14px |
| h1, three lines | 164 | 321 | 35.2px |
| subline, four lines | 335 | 435 | 16.8px |
| domain input | 465 | 513 | 48px tall |
| primary button | 519 | 567 | 48px tall |
| trust row, two lines | 616 | 667 | 14px |
| payment chips, two lines | 688 | 742 | 12.48px, excluded |
| `Sample report`, first text of the evidence card | **811** | 828 | 14px |

P1, P2 and P3 are all carried by qualifying leaves. Six interactive elements above the fold.
Exactly one accent-filled control. No horizontal scroll.

**But the evidence card is effectively gone.** The design artifact's section 3.4 budgeted
the card at y=504 to 784, fully visible with its score. On the live page its first text
begins at y=811 against a fold of 812. The score numeral, the ring, the engine split and
every status badge are below the fold. A mobile visitor sees a claim and a field, and no
evidence that the thing being claimed exists.

The 54px of payment-chip content at y=688 to 742 was not in the design budget, and the trust
row takes two lines rather than one. Together those account for the displacement.

---

## 5. Lens 2: conversion path

### 5.1 Calls to action above the fold

| Control | 1280 | 375 | Fill |
|---|---|---|---|
| `Check my visibility →` (primary) | yes, top 567, 196x48 | yes, top 519, 320x48 | accent gradient `#7c3aed` to `#6366f1` |
| `Get started` (nav) | yes, top 14, 117x47 | yes, top 14, 107x47 | transparent, outlined. Correctly demoted. |
| `Ask Jamie` (launcher) | **yes, top 732, 138x48** | no, top 987 | accent gradient `var(--ac)` to `#8b7bff` |

**Two accent-filled controls are above the fold at 1280.** The design artifact's section 3.2
rules that exactly one solid accent fill may be visible above the fold at any moment, and its
build log recorded one. The second is the assistant launcher, which is injected by
`site.js:1090` at `position: fixed` and therefore was never part of the hero's element budget.
It does not appear above the fold at 375.

### 5.2 Primary action state inventory

Every row below was established by **reading `brandgeo/web/site.js` and the stylesheet**.
The endpoint was not called, no domain was submitted, and no result state was exercised.

| State | Status | Evidence |
|---|---|---|
| Idle | COVERED | `.search-btn` accent gradient fill, `index.html` |
| Hover | COVERED | `.search-btn:hover { opacity: .9; transform: scale(.98) }` at `index.html:600` |
| Focus | COVERED | global `:focus-visible` ring at `index.html:232` to `:241`, plus `.search-wrap:focus-within { outline: 2px solid var(--ac) }` at `:244`. The input's own outline is suppressed at `:248` because the ring sits on the wrapper. |
| Active | **SILENT** | no `.search-btn:active` rule exists. `:hover` scale double-serves. |
| Loading | COVERED | `showSlot('skeleton')`, button disabled, label swapped. Timeout 32000ms (`site.js:82`), raised from 12s because a real screening audit measured 26.9s. |
| Success | COVERED | `renderAuditResult` at `site.js:227`, result renders in the evidence card's slot |
| Empty input | COVERED | `site.js:315`: `Enter your domain, for example yourcompany.com`, plus `brandInput.focus()` |
| Invalid input | **PARTIAL** | the only check is `val.length < 2` (`site.js:314`). There is no domain-shape validation, so `ab` reaches the server. |
| Server error | COVERED | 400 and 429 surface a server message; any other non-200 throws, the skeleton holds, `Taking you to the full audit…` shows for 600ms, then `redirectToSignup(val)` |
| Rate limited | COVERED | 3 attempts per 10 minutes, `site.js:320`. Client-side `localStorage` only, and it **fails open** when storage is unavailable (`site.js:108`). Real enforcement is server-side in `_prospect_guard.js`. |
| Offline | COVERED | `fetchWithTimeout` rejects into the same catch, so the signup fallback applies |

**Headline metric: 9 of 11 states fully covered (82%). 1 partial, 1 silent. Dead ends: 0.**

Worth naming rather than filing as a defect: every failure path, including a dead endpoint,
resolves to the signup page rather than an error. The visitor is never stranded, and also
never learns the audit failed. That is a deliberate trade recorded in the design artifact's
section 8, and it converts better than an error message. It also means a fully broken audit
endpoint would be invisible from the front end.

### 5.3 Link reachability

Three in-page anchors (`#how`, `#pricing`, `#contact`), **all resolve to a real element.
Zero dead anchors.** 25 distinct relative links, 8 distinct external.

| Destination | Status |
|---|---|
| `app.getbrandgeo.com/signup` | 200 REACHABLE |
| `buy.stripe.com/5kQcN6...` (Essentials) | 200 REACHABLE |
| `buy.stripe.com/7sY3cw...` (Growth) | 200 REACHABLE |
| `buy.stripe.com/7sYaEY...` (Growth PRO) | 200 REACHABLE |
| `/faq.html`, `/news/`, `/support.html`, `/bg-005.html` | 200 REACHABLE |
| `doi.org/10.5281/zenodo.21395598` | 403 to a scripted client. **Unverified**, see section 8. |

At 375 the nav collapses behind `.bg-nav-toggle`, a 36x36 control. Every nav destination
remains reachable through it, so this is a hit-target finding, not a reachability one.

---

## 6. Lens 3: credibility and craft

### 6.1 Contrast

Method: every visible text node, foreground composited over its real rendered background
including alpha, gradient stops enumerated and scored at the worst stop, WCAG relative
luminance, AA thresholds 4.5:1 body and 3:1 large. **302 visible text nodes measured per
theme at 1265 layout pixels.**

The prior record of "0 contrast failures in dark, 0 real failures in light across 292 text
nodes" **did not reproduce.** The reason is specific and worth keeping: a sweep that reads
`backgroundColor` cannot see a `linear-gradient`, and every failure below except one sits on
a gradient. This is not a contradiction of that work so much as a blind spot in its
instrument, the same class of blind spot that cost this audit four false findings.

**Dark theme: 5 failures.**

| id | Element | Foreground | Background | Ratio | Required |
|---|---|---|---|---|---|
| D1 | `.step-num`, three instances, digits 1 2 3, 36x36 | `#ffffff` | `var(--ac)` to `var(--ac2)` gradient | **1.92:1** at the `#34d399` stop, **3.10:1** at the geometric midpoint | 4.5 |
| D2 | `.bg-asst-launcher` label `Ask Jamie` | `#ffffff` | hardcoded `#8b7bff` | **3.29:1** | 4.5 |
| D3 | `.btn-snapshot` `Get my free AI Visibility Snapshot →` | `#ffffff` | hardcoded `#8b5cf6` stop | **4.23:1** | 4.5 |
| D4 | `.search-btn`, the primary CTA | `#ffffff` | `#6366f1` stop | **4.47:1**, midpoint 5.15:1 | 4.5 |
| D5 | `.m-sub` `from €0` on the active pricing mode tab | `rgba(255,255,255,.8)` | `#7c3aed` | **4.21:1** | 4.5 |

**Light theme: 6 failures.** D2, D3 and D4 recur identically because their offending colour
stops are hardcoded hexes rather than tokens, so the 2026-07-28 light-mode token work could
not reach them. Three more are light-only:

| id | Element | Ratio | Required |
|---|---|---|---|
| L1 | `.pe-status.partial` badge `PARTIAL` | **4.19:1** | 4.5 |
| L2 | `.tag` `Neutral`, 9.92px | **4.40:1** | 4.5 |
| L3 | `.fix-badge.p1` `P1`, 12.8px | **4.44:1** | 4.5 |

Two hardcoded values are the root of D2 and D3:
- `site.js:1173`: `background:linear-gradient(135deg,var(--ac),#8b7bff)`. `#8b7bff` is in no
  token table. It is injected by JavaScript, so a stylesheet audit cannot see it at all.
- `index.html:1466`: `background: linear-gradient(135deg, var(--ac), #8b5cf6)`. The first stop
  is a token and flips with the theme; the second does not.

D1 is the worst by ratio and the least visible by size. `.step-num` runs from `var(--ac)` to
`var(--ac2)`, and `--ac2` is a positive-signal green. White on it is 1.92:1 in dark.

### 6.2 Hit targets

At 375, controls under 44px on either axis: **`.bg-nav-toggle` at 36x36** is the only one above
the fold that a visitor uses. The domain input and the primary button are both 48px tall at 375,
which closes the previously recorded 43px failure.

At 1280, 49 controls measure under 44px on one axis. Most are inline footer links at 18px tall,
which fall under WCAG 2.5.8 AA (24x24 minimum) rather than 2.5.5 AAA (44x44) and pass that.
The ones that matter for conversion:

| Control | Size at 1280 |
|---|---|
| domain input | 290x**39** |
| `.btn-plan` Subscribe, three instances | 200x**42** |
| `.mode-btn` pricing mode tabs | 223x**38** |
| `.pricing-toggle` monthly/yearly | 44x**24** |

The nav CTA (47px), theme toggle (44x44) and primary button (48px) all clear 44.

### 6.3 Performance

| Metric | Value | Method |
|---|---|---|
| HTML transferred | **33,618 bytes** gzipped, 137,152 decoded | `curl` with `Accept-Encoding: gzip,br` |
| `site.js` | 17,902 bytes | same |
| `hero.js` | 4,694 bytes | same |
| `logo-nav.png` | 1,982 bytes | same |
| First-party total | **58,535 bytes** | sum of the above plus two init files |
| TTFB | 226ms | `PerformanceNavigationTiming.responseStart` |
| DOMContentLoaded | 273ms | same |
| Load event | 435ms | same |
| Render-blocking in `<head>` | **2 scripts plus 1 stylesheet** | `plausible-init.js` and `ga4-init.js`, both `async=false defer=false`; plus the Google Fonts stylesheet |
| Images without `width`/`height` | **2 of 2** (`logo-nav.png`) | DOM attribute read |
| Largest Contentful Paint | **could not measure** | see section 8 |
| Cumulative Layout Shift | **could not measure** | see section 8 |

Only two images on the whole page, both the nav logo, both lazy-loading disabled, both
carrying `alt`. Neither declares intrinsic dimensions, which is a layout-shift risk on the
nav at first paint. That is read from markup, not from a CLS measurement.

### 6.4 Motion

`prefers-reduced-motion: reduce` is honoured, and thoroughly. Thirteen media blocks in
`index.html`. `.reveal` resolves to `opacity: 1; transform: none; transition: none` at
`index.html:264`. `site.js:450` to `:455` sets the sample score and ring to their final
values instantly rather than animating them. Nothing was found that animates without a
reduced-motion escape.

The sample score ring and numeral animate over 900ms, starting 900ms after the card enters
the viewport, which keeps them out of the headline's own reading window by design.

### 6.5 Proof ordering

Order as rendered: hero, engines strip, the score and its six dimensions, sentiment, the
fix-list-to-brief-to-post chain, the DOI research band, how it works, pricing, FAQ, contact,
latest research, footer. This matches the order the design artifact's section 5.1 specifies.

The first proof block after the hero is the engine strip at y=864, below the 800 fold, which
is the intended deliberate-scroll behaviour. The first piece of proof does support the
headline's claim: the headline asks whether AI models recommend you, and the first block names
which AI models are queried.

### 6.6 Claim integrity

Cross-checked against `brandgeo-dashboard/src/lib/planConfig.ts`,
`brandgeo-dashboard/netlify/functions/_prospect_engines.js`,
`brandgeo-dashboard/netlify/functions/stripe-webhook.js` and
`brandgeo-dashboard/netlify/functions/onboard-client.js`.

| id | Claim on the page | What the product does | Severity |
|---|---|---|---|
| C1 | `index.html:2233`, the AI Social step in the chain block carries the marker **`Growth and up`** | `planConfig.ts:293`: `ai_social: 'enterprise'`, with the comment `ai_social is ADMIN-ONLY while the feature is finished (2026-07-29). Customers see it as coming soon`. The real gate is `requireAuth({ adminOnly: true })` on the three `social-*.js` functions. **No self-serve customer at any price can use AI Social.** | **HIGH** |
| C2 | `index.html:2428`, the Growth PRO pricing card lists **`AI Social · coming soon`** | Correct. But it contradicts C1, 195 lines apart on the same page, and C1 is the one a visitor reads first and in a more persuasive context. | **HIGH** |
| C3 | `index.html:2226`, the AI SEO step carries the marker **`Essentials and up`** | `planConfig.ts:294`: `ai_seo: 'growth'`. `PLAN_SEO_PAGE_CAP` gives Essentials **0** pages. An Essentials customer at EUR 99 is promised AI SEO and gets a lock. | **HIGH** |
| C4 | Growth PRO card: **`6 AI engines · + Grok, with live X search`**, and the FAQ at `:2525` repeats `Growth PRO and up add a sixth, Grok` | `planConfig.ts` `PLAN_ENGINES.growth_pro` is seven engines: `chatgpt, gemini, claude, perplexity, google_ai, grok, ai_overview`. AI Overviews went live 2026-07-29. The page **understates** the tier by one engine. Already corrected in the working tree, not yet deployed. | MEDIUM |
| C5 | Enterprise card: **`More engines: Copilot, DeepSeek, Grok`** | Grok is live on Growth PRO and Managed. The page sells Grok as an Enterprise upsell in one card and as a Growth PRO inclusion in another. | MEDIUM |
| C6 | `index.html:2149`: **`Every response, across all 5 engines, is scored for sentiment, not just presence.`** Unqualified, and it sits above the pricing section. | True from Growth up only. Free gets one engine, Essentials gets three (`PLAN_ENGINES`). | MEDIUM |
| C7 | Footer at `index.html:2718`: **`🔒 GDPR Compliant`** | **No cookie consent banner exists in the markup** (zero matches for any consent, cookie-banner or gdpr-banner identifier). `ga4-init.js` loads unconditionally in `<head>` at `:1868`, and a request to `www.google.es/ads/ga-audiences` was observed firing on load. The organisation's own schema declares an address in Santa Cruz de Tenerife, Spain. An unverifiable compliance claim contradicted by the page's own network behaviour. | **HIGH** |
| C8 | The Managed card states no prompt cap at all | `PLAN_PROMPTS.managed` is 250. Not a false claim, an omission on the highest-priced self-describable tier. | LOW |

---

## 7. Lens 4: AI answer readiness

### 7.1 Structured data

**One `application/ld+json` block, at line 25, 3717 bytes. It parses cleanly with
`JSON.parse`.** Validated with a real parser, not by eye, precisely because three `FAQPage`
blocks elsewhere on this site were live and silently invalid for weeks. That failure mode is
**not** present here.

`@graph` with three nodes: `Organization`, `WebSite`, `SoftwareApplication`.

Honesty check, which is the part that matters more than validity:

- Five `Offer` nodes: Free 0, Essentials 99, Growth 299, Growth PRO 449, Managed 1500, all EUR.
  **Every one matches the price rendered to a human.** No inflated or stale price.
- **No `aggregateRating` and no `review` anywhere.** Nothing fabricated. This is a genuine
  credit: fake ratings in structured data are the most common integrity failure on pages of
  this kind and this page does not have them.
- `Organization.sameAs` lists six external profiles. `address` declares Spain.

Gaps, none of them dishonest:

| id | Finding |
|---|---|
| L4-1 | No `Offer` carries `availability` or `url`. Google treats both as expected for offer rich results. |
| L4-2 | The page renders a monthly/yearly toggle and a Managed yearly price of EUR 15,000, but the structured data carries only monthly figures and no yearly `Offer`. A machine quoting the price has no way to reach the annual figure. |
| L4-4 | **The page renders a FAQ section (`h2` "Questions, answered.") with no `FAQPage` markup at all.** The Q&A pairs a visitor reads cannot be extracted as Q&A pairs by anything parsing this page. On a product whose thesis is being parsed correctly by AI engines, this is the largest single miss in this lens. |
| L4-5 | `SoftwareApplication` is used for a graph that includes a EUR 1,500 done-for-you Managed tier and a custom Enterprise tier. Defensible for the self-serve tiers, a stretch for the managed one. Recorded, not scored as dishonest. |

Enterprise is absent from `offers`, which is correct: it has no price.

### 7.2 Heading hierarchy

**One `h1`. 25 headings. Zero skipped levels.** PASS.
`h1` states the claim rather than teasing it: `Are AI models recommending your brand, or your
competitors?` Section `h2`s are declarative sentences, not labels: `One number, six dimensions.`,
`It's not just if AI mentions you. It's how.`, `Built on peer-reviewed research.`

### 7.3 Extractability

The core claim survives without CSS: the `h1`, the subline and every proof block are real text
in the served HTML, not images, canvas or background.

Two qualifications:

| id | Finding |
|---|---|
| L4-3 | The hero sample score ships in the HTML as `<div class="num" id="scoreNum" data-target="64">0</div>` (`index.html:2023`) and only reaches 64 through a `requestAnimationFrame` count-up. **Any consumer that does not run rAF reads `AI Visibility Score 0 /100` beside the BrandGEO brand name.** That includes crawlers taking the raw HTML, which `robots.txt` explicitly invites. The card is labelled `Sample report` at 14px, which mitigates it for a human and not at all for a parser. |
| L4-6 | Ten `.reveal` blocks ship at `opacity: 0` and are revealed by `IntersectionObserver`. A renderer that applies CSS but does not run the observer sees a hero and nothing else. `prefers-reduced-motion` resolves them to `opacity: 1`, so this affects rendering crawlers only, not humans and not raw-HTML readers. |

### 7.4 Crawl permission

`robots.txt` returns 200 and **explicitly allows every major AI retrieval agent by name**:
`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`,
`YouBot`, `Google-Extended`, plus a catch-all `User-agent: * / Allow: /`. Sitemap declared.

`<link rel="canonical" href="https://getbrandgeo.com/">`, self-referential and correct.
**No `<meta name="robots">`**, so the page defaults to index and follow. The page is fully
permitted to be cited.

Response headers are strong: HSTS with preload, `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, a real CSP with
`frame-ancestors 'none'` and an explicit `connect-src` allowance for `app.getbrandgeo.com`.

---

## 8. Findings ledger

| ID | Lens | Sev | Finding | Evidence | Owner |
|---|---|---|---|---|---|
| C1 | 3 | HIGH | AI Social sold as `Growth and up` | `index.html:2233` vs `planConfig.ts:287` to `:293` (`ai_social: 'enterprise'`, admin-only) | `bg-copy` + `bg-strategy` |
| C2 | 3 | HIGH | Page contradicts itself on AI Social | `index.html:2233` `Growth and up` vs `index.html:2428` `AI Social · coming soon` | `bg-copy` |
| C3 | 3 | HIGH | AI SEO sold one tier below its gate | `index.html:2226` `Essentials and up` vs `planConfig.ts:294` `ai_seo: 'growth'`; `PLAN_SEO_PAGE_CAP.essentials` is 0 | `bg-copy` |
| C7 | 3 | HIGH | GDPR claim with no consent gate | `index.html:2718` `GDPR Compliant`; zero consent identifiers in 137KB of markup; `ga4-init.js` unconditional at `index.html:1868`; observed request to `www.google.es/ads/ga-audiences` | `bg-web` + owner decision |
| D1 | 3 | HIGH | `.step-num` white on green gradient stop | measured **1.92:1** worst stop, **3.10:1** midpoint, required 4.5. Three instances. | `bg-design` then `bg-web` |
| D2 | 3 | HIGH | `Ask Jamie` label 3.29:1, both themes | `site.js:1173`, hardcoded `#8b7bff`, not a token | `bg-web` |
| A1 | 1 | HIGH | Evidence card falls below the fold at 375 | first text `Sample report` at y=**811**, fold 812; design budget was y=504 to 784 | `bg-design` then `bg-web` |
| B1 | 2 | MED | Two accent-filled controls above the fold at 1280 | `.search-btn` top 567 and `.bg-asst-launcher` top 732, fold 800. Design rule section 3.2 permits one. | `bg-web` |
| C4 | 3 | MED | Growth PRO advertised at 6 engines, ships 7 | `index.html` Growth PRO card and `:2525` vs `planConfig.ts` `PLAN_ENGINES.growth_pro` (7, `ai_overview` added 2026-07-29). Fixed in working tree, undeployed. | `bg-web` (deploy) |
| C5 | 3 | MED | Grok sold as Enterprise upsell and Growth PRO inclusion | Enterprise card `More engines: Copilot, DeepSeek, Grok` vs Growth PRO card `+ Grok` | `bg-copy` |
| C6 | 3 | MED | Unqualified `all 5 engines` sentiment claim above pricing | `index.html:2149` vs `PLAN_ENGINES.free` (1) and `.essentials` (3) | `bg-copy` |
| D3 | 3 | MED | `.btn-snapshot` 4.23:1, both themes | `index.html:1466`, second gradient stop hardcoded `#8b5cf6` | `bg-web` |
| D4 | 3 | MED | Primary CTA label 4.47:1 at its light gradient stop | `.search-btn`, `#ffffff` on `#6366f1`. Midpoint 5.15:1. | `bg-design` |
| L4-4 | 4 | MED | Rendered FAQ section carries no `FAQPage` schema | `h2` `Questions, answered.` present; graph contains only `Organization`, `WebSite`, `SoftwareApplication` | `bg-web` |
| L4-3 | 4 | MED | Sample score ships as literal `0` in the HTML | `index.html:2023` `data-target="64">0<`; rAF-gated; `robots.txt` invites raw-HTML crawlers | `bg-web` |
| A2 | 1 | MED | Above-fold leaf count regressed 30 to 43, and 3 fell back under 14px | measured at 1265x800; build log recorded 30 leaves and 0 sub-14px. New group: `Stripe supported`, `Crypto payments coming soon`, `(Crypto.com Pay)`, all 12.48px at y=703 to 720 | `bg-design` |
| A3 | 1 | LOW | Above-fold interactive count is 12 against a guardrail of 9 | enumerated at 1265x800 | `bg-design` |
| D5 | 3 | LOW | `.m-sub` `from €0` at 4.21:1, dark | `rgba(255,255,255,.8)` on `#7c3aed` | `bg-web` |
| L1 | 3 | LOW | `PARTIAL` badge 4.19:1, light only | `.pe-status.partial` | `bg-web` |
| L2 | 3 | LOW | `Neutral` tag 4.40:1 at 9.92px, light only | `.tag` | `bg-web` |
| L3 | 3 | LOW | `P1` badge 4.44:1 at 12.8px, light only | `.fix-badge.p1` | `bg-web` |
| E1 | 3 | LOW | Two `<img>` without `width`/`height` | both `logo-nav.png`, read from DOM attributes | `bg-web` |
| E2 | 3 | LOW | Two render-blocking scripts in `<head>` | `plausible-init.js`, `ga4-init.js`, both `async=false defer=false` | `bg-web` |
| B2 | 2 | LOW | Primary CTA has no `:active` state | no `.search-btn:active` rule in 2757 lines | `bg-web` |
| B3 | 2 | LOW | Input validation is length-only | `site.js:314`, `val.length < 2`. No domain shape check. | `bg-web` |
| B4 | 2 | LOW | Client rate limit fails open | `site.js:108` returns `[]` when `localStorage` throws. Server-side `_prospect_guard.js` is the real gate, so exposure is limited. | none, recorded |
| B5 | 2 | LOW | `.bg-nav-toggle` 36x36 at 375 | measured, above the fold | `bg-web` |
| C8 | 3 | LOW | Managed prompt cap absent from the page | `PLAN_PROMPTS.managed` is 250, not stated | `bg-copy` |
| L4-1 | 4 | LOW | No `availability` or `url` on any `Offer` | parsed graph, 5 offers | `bg-web` |
| L4-2 | 4 | LOW | Yearly prices rendered but absent from schema | Managed `€15,000 /yr` on page, monthly only in graph | `bg-web` |
| L4-5 | 4 | LOW | `SoftwareApplication` covers a done-for-you service tier | graph node type vs Managed tier content | `bg-strategy` |
| L4-6 | 4 | LOW | 10 `.reveal` blocks invisible to a rendering crawler that skips `IntersectionObserver` | `index.html:251` to `:256` | none, recorded |

---

## 9. Refuted claims

These were put to me as defects, or were recorded as defects in an existing artifact. Each was
measured and each is **fine on the current live page.** Re-filing any of them burns a cycle.

| Claim | Refuting measurement |
|---|---|
| **"Two hero statistics, 73% and 4.2x, have no citation."** | **Zero occurrences of `73%` or `4.2x` in 137,152 bytes of live HTML.** They are gone. |
| `homepage-hook.md` §2.1: the page fails the three-second test at 1280x800 | 43 above-fold leaves, 40 qualifying at 14px or larger. P1 carried by three qualifying leaves, P2 by three, P3 by two. **PASS.** |
| `homepage-hook.md` §2.2: fails at 375x812 | 15 above-fold leaves, 12 qualifying. All three parts carried. **PASS on the three-part criterion.** The distinct defect at 375 is the evidence card position, filed separately as A1. |
| `homepage-hook.md` §12 F1: primary CTA has no visible focus indicator | Global `:focus-visible` ring at `index.html:232` to `:241`, plus `.search-wrap:focus-within { outline: 2px solid var(--ac); outline-offset: 3px }` at `:244`. **CLOSED.** |
| §12 F2: `.audit-email-btn` uses `--ac` and fails AA at 4.23:1 | `index.html:710` now reads `background: var(--ac-strong)`, measured **5.70:1**, with `min-height: 44px`. **CLOSED**, verified from source without exercising the result state. |
| §12 F3: `--t3` carries the trust row and every card label | The trust row is `--t2`. The only `--t3` text above the fold is `(Crypto.com Pay)` at 12.48px, measuring **5.17:1** in dark. `--t3` is now a solid `#7d838f`, not an alpha value. **Substantially closed.** |
| §12 F4: two identical solid violet CTAs above the fold, `.nav-cta` and `.search-btn` | `.nav-cta` is now `background: transparent !important` with a `--bd2` border, measured as an outline control. **That specific pair is closed.** A different second fill exists, filed as B1. |
| §12 F5: primary CTA 43px and nav CTA roughly 34px | Measured: primary button **48px** at both widths, nav CTA **47px**, theme toggle **44x44**. **CLOSED.** |
| §12 F6: no status colour tokens, raw hex inline | `--ok`, `--part`, `--bad`, `--info`, `--warn` are declared in `:root` with light counterparts. **CLOSED.** |
| §12 F7: promises 48h and instant in the same element group | Trust row reads `Free audit / Results in under a minute / No credit card required`. The 48h claim lives only in the done-for-you block `h2` `Or we run all of it for you, in 48 hours.` **CLOSED.** |
| §12 F9: Meta AI named as a monitored engine in 8 places | **Zero occurrences of `Meta AI` on the live page.** **CLOSED.** |
| "The palette rebuild reported 0 contrast failures in dark" | Partly holds. Every non-gradient text pair passes. The five dark failures found here are all gradient fills, which a `backgroundColor`-only sweep cannot see. |
| "Light mode was unaudited and failed at token level" | Not on this page. Every token-driven pair passes in light. The six light failures are three hardcoded gradient stops and three low-alpha status badges. |
| Horizontal overflow | Attempted a real scroll at both widths. `scrollX` stayed **0** both times. At 375 the pane reports `scrollWidth` 484 against `clientWidth` 375, which is the pane reporting window pixels, not overflow. **No overflow.** |
| Refresh cadence advertised faster than the product delivers | Page: `Monthly refresh` on Free, `Weekly refresh` on Essentials, Growth and Growth PRO. `PLAN_COLLECTION_COOLDOWN_HOURS`: free 720, all paid 168. **Exact match.** |
| Published prompt caps exceed enforced caps | Page: 5 / 20 / 50 / 75. `PLAN_PROMPTS`: free 5, essentials 20, growth 50, growth_pro 75. **Exact match.** |
| `CLAUDE.md`: "Growth PRO cannot be bought self-serve, it has no Stripe price or checkout link" | The Growth PRO card links to `buy.stripe.com/7sYaEY3yIcGMaQsa0qdZ609`, which returns **200**. `stripe-webhook.js` maps `price_1Ty5a7...` and `price_1Ty5a9...` to `growth_pro`, and `SELF_SERVE_PLANS` includes it. **Stale.** |
| `CLAUDE.md`: packet 008, `onboard-client.js` silently coerces Growth and Growth PRO to Essentials | `onboard-client.js:65` now derives `VALID_PLANS` from `PLAN_LIVE_ENGINES` and returns 400 on an unrecognised plan. **Closed in code.** |
| `Site audit: 30 pages · 3x Growth` on the Growth PRO card | `PLAN_SEO_PAGE_CAP`: growth 10, growth_pro 30. 30 is exactly 3x. **Accurate.** |
| `Managed €1,500 /mo, €15,000 /yr, Save €3,000` | 1500 x 12 = 18,000. 18,000 minus 15,000 = 3,000. **Arithmetic correct.** |
| `free, no-commitment snapshot ... across all 5 engines` | `_prospect_engines.js:396` `FULL_ENGINES = ['chatgpt','gemini','claude','perplexity','google_ai']`. **Five. Accurate.** |
| Invalid JSON-LD, as found on three city pages | One block, parses cleanly with `JSON.parse`. **Not present here.** |
| Fabricated ratings or testimonials in structured data | No `aggregateRating`, no `review`, no `Review` node anywhere in the graph. **Nothing fabricated.** |
| `.nav-cta` label unreadable in light mode at 1.14:1 | Instrument artifact. `.nav-cta` carries its own `!important` transition at class specificity, which beat the universal override. With inline `!important` it resolves to `#09090f`. **False.** |
| `when you're ready.` headline unreadable in light at 1.58:1 | Instrument artifact. `background-clip: text` element; its `color` is inert. Real stops are `#6d28d9` and `#047857` in light, both passing at 38.4px. **False.** |
| Logo `GEO` fails contrast | `background-clip: text` logotype, gradient `#8b5cf6` to `#6d28d9`. WCAG 1.4.3 exempts logotypes. **Not a finding.** |
| Hero sample score displays `0` instead of `64` | Environment artifact: rAF was verified as never firing in a non-compositing pane. A normal visitor sees the count-up, and a reduced-motion visitor gets 64 instantly via `site.js:450`. **Not a visitor-facing defect.** The raw-HTML consequence is real and is filed separately as L4-3. |

---

## 10. Could not verify

Silence in this section would read as a clean bill of health, so every gap is listed.

| Item | Reason |
|---|---|
| **Largest Contentful Paint element and time** | The measurement pane never composited a frame, so the `largest-contentful-paint` observer returned `null` even with `buffered: true`. LCP is paint-dependent and cannot be faked. Needs a real headed browser run. |
| **Cumulative Layout Shift** | Same cause. The observer reported `0`, which is what a page that never paints always reports. **Treat the 0 as absent data, not as a pass.** The two dimensionless `<img>` elements (E1) are a real CLS risk that this run could not quantify. |
| Total transferred bytes as a browser sees it | `PerformanceResourceTiming.transferSize` came back as 0 for nine of ten resources because the reload served from cache. The 58,535-byte figure in section 6.3 is a first-party `curl` sum and excludes Google Fonts CSS, the font files themselves, `plausible.io/js`, and `gtag.js`. **Third-party weight is unmeasured.** |
| The result, scanning, rate-limited and error states as rendered | Reaching any of them requires submitting a real domain to the live audit endpoint, which spends LLM budget and creates a prospect record. Inspected in `site.js` instead, and section 5.2 says so on every row. |
| `.audit-email-btn` as rendered | Same reason: it exists only inside the result state. Its fill and `min-height: 44px` were read from `index.html:710`. |
| The Stripe checkout pages' contents | The three links return 200 and were not opened or progressed. **Whether the Growth PRO link presents EUR 449 for the correct product was not confirmed**, only that the URL resolves and that `stripe-webhook.js` maps its price IDs to `growth_pro`. |
| `doi.org/10.5281/zenodo.21395598` | Returns **403** to a scripted client, which is normal DOI bot behaviour and not evidence the record is missing. The page's central credibility claim, `Built on peer-reviewed research.`, rests on this link. **Someone should open it in a real browser.** |
| Whether a consent banner is served conditionally by geography | The audit fetched from one location with no prior cookies. A geo-gated banner would not have appeared. C7 states what was observed, not that no banner can ever exist. |
| Real-device rendering at 375 | Measured with an emulated viewport. `innerWidth` reported 484 against `clientWidth` 375, so the pane is not a faithful mobile surface. Layout coordinates were taken from `clientWidth`/`clientHeight`, which is the correct source, but **A1's one-pixel margin (y=811 against a fold of 812) is tight enough that it should be confirmed on hardware** before anyone spends a cycle on it. |
| Sub-pixel position of glyphs across the gradient fills in D1, D3, D4 | Ratios are reported at the worst gradient stop and, for D1, also at the geometric midpoint. Which stop a given glyph actually sits on depends on the 135-degree gradient geometry and was not computed per character. D1 fails at both stop and midpoint; **D4 at 4.47:1 fails only at the far stop and passes at 5.15:1 at the midpoint**, so its severity is genuinely uncertain. |
| Whether the 10 `.reveal` blocks are reached by any specific AI crawler | L4-6 describes the mechanism. Which crawlers execute `IntersectionObserver` is not something this audit can establish. |
| Light mode as a persisted user preference | The theme was switched by setting `data-theme` directly on the document element, not by clicking the toggle, so `localStorage` was never written. The toggle's own behaviour was read at `site.js:6` to `:14` and not exercised. |
