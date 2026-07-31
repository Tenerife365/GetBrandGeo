# Landing page audit: getbrandgeo.com homepage

Auditor: `landing-page-optimizer` (read-only) · Date: 2026-07-28
Target: `https://getbrandgeo.com/` · Source: `brandgeo/web/index.html` (2508 lines)
Commit audited: `0c6e740` (2026-07-28, "fix(web): stop promising Meta AI in the free audit")
Live bytes verified identical to the working tree: `curl` of `/` and `/hero.js?v=2026-07-28a`
diffed against `brandgeo/web/index.html` and `brandgeo/web/hero.js`, zero differing lines.

This page shipped through six commits with no copy stage and no verification stage.
This is the first independent pass over it.

---

## Calibration

```
SYSTEM VERIFICATION - landing-page-optimizer
1. File producing the page:  brandgeo/web/index.html, 2508 lines.
                             Behaviour: brandgeo/web/site.js (1239), brandgeo/web/hero.js (300).
2. Live URL:                 https://getbrandgeo.com/  ->  HTTP/1.1 200 OK, LiteSpeed,
                             Content-Length 121063, Last-Modified Tue 28 Jul 2026 13:17:03 GMT.
3. Current h1, as rendered:  "Does AI recommend your brand across Web2 & Web3?"
                             (source index.html:1707). Computed font-size at 1280x800:
                             56px, weight 900, line-height 59.36px. It renders on FOUR
                             lines, occupying 237px of vertical space (getBoundingClientRect
                             height 237.4375, top 200.97, bottom 438.41).
4. Fold line:                800 at desktop, 812 at mobile. Derived from
                             document.documentElement.clientHeight after resizing the
                             viewport, NOT from window.innerHeight. In this browser pane
                             innerWidth/innerHeight are scaled by 1.288 relative to the
                             layout viewport (innerWidth 483 while clientWidth 375). Every
                             getBoundingClientRect value below is layout-viewport CSS px,
                             so clientHeight is the correct fold. At the desktop setting
                             the layout width is 1265, not 1280, because a 15px classic
                             scrollbar is present.
5. Design tokens:            brandgeo/web/index.html:98 to :131, the :root custom property
                             block. Example token, index.html:105:
                               --ac:   #8b5cf6;         /* unified with dashboard brand-500 */
6. Strategy / design artifact: BOTH exist.
                             docs/strategy/hook-thesis-web.md and docs/design/homepage-hook.md
                             (the latter dated 2026-07-26, with a build log at its §14).
                             docs/copy/ does NOT exist: the copy stage was bypassed and the
                             headline, subline, trust row and state messages are
                             builder-written (homepage-hook.md §14.2 admits this).
7. Commit sha / date:        0c6e740 / 2026-07-28.
```

`CALIBRATED`

Nothing above required a guess. One correction to the brief: the JSON-LD is at
`index.html:25` to `:89`, not `:82` to `:85`. Lines 82 to 85 are four of the five
`Offer` objects inside it.

---

## 1. Verdict

The page's mechanics are in good shape and the inherited three-second failure does not
reproduce, but the largest element on the page sells two blockchain engines the product
has never had a line of code for, and the same free audit is sold as ten seconds in the
hero and forty-eight hours in the FAQ.

| Lens | Score |
|---|---|
| 1. Hook and comprehension | **3** |
| 2. Conversion path | **4** |
| 3. Credibility and craft | **2** |
| 4. AI answer readiness | **3** |

---

## 2. Scorecard

| Lens | Score | The one sentence |
|---|---|---|
| 1. Hook and comprehension | 3 | All three hook parts are carried by qualifying text at both widths, which is category standard, but the headline spends its largest words on a capability that does not exist and names no audience anywhere above the fold. |
| 2. Conversion path | 4 | Nine of eleven primary-action states are visibly handled and every one of 27 outbound destinations resolves, which is better than category standard, held back by a chat launcher that out-saturates the primary CTA and an offline path that redirects to an unreachable host. |
| 3. Credibility and craft | 2 | Contrast, motion and layout stability are handled deliberately, but the page makes a fabricated capability claim, gives three different answers about the same free audit, and carries an untraceable customer count that a prior artifact already asked to have removed. |
| 4. AI answer readiness | 3 | Heading order, canonical, crawler permissions and CSS-free extractability are all correct, but the structured data and the rendered headline describe two different products, and six real FAQ entries carry no FAQPage markup. |

---

## 3. Top 5 actions

Ranked by visitor impact divided by effort. No fix is drafted here.

| # | What | Where | Owner |
|---|---|---|---|
| 1 | Decide whether BrandGEO monitors Bittensor and Mind Network. If it does not, the h1, the subline and the Web3 tier of the engine strip are making a claim with no implementation behind it. This is the single highest-impact item on the page because it is the largest text on it. | `index.html:1707`, `:1708`, `:1864` to `:1866` against `brandgeo-dashboard/src/lib/planConfig.ts:12` to `:20` and `:49` to `:55` | `bg-strategy` decides, then `bg-copy` and `bg-web` |
| 2 | Reconcile the free-audit timing. The hero trust chip says ten seconds, the FAQ and the contact section both say forty-eight hours, and the client code budgets thirty-two. | `index.html:1733` vs `:2284` and `:2305`, against `site.js:82` and `site.js:158` to `:160` | `bg-copy` |
| 3 | Resolve or remove "50+ brands audited". `homepage-hook.md` §14.2 explicitly deferred this to review and it is still live. | `index.html:2236` | `bg-copy` |
| 4 | Demote the Ask Jamie launcher below the primary CTA in visual weight. It is currently the brighter of the two solid violet fills above the fold. | `index.html` `.bg-asst-launcher`, measured fill `linear-gradient(135deg, rgb(139,92,246), rgb(139,123,255))` vs the CTA's `rgb(124,58,237)` | `bg-design` then `bg-web` |
| 5 | Give the domain field a mobile keyboard and autofill hints. It is `type="text"` with no `inputmode`, no `autocomplete` and no `pattern` on the single most important input on the site. | `index.html:1711` | `bg-web` |

---

## 4. Findings ledger

Severity: CRITICAL (loses or misleads visitors at scale), HIGH, MEDIUM, LOW.

### Lens 1: Hook and comprehension

**Method.** Viewport set, page scrolled to 0, then every text node in `document.body`
walked with a `TreeWalker`. For each node the parent element's
`getBoundingClientRect()` and computed `font-size` were read. Nodes were kept when the
parent was not `display:none`, not `visibility:hidden`, not `opacity:0`, had non-zero
box, and had `top < fold` and `bottom > 0`. **Exclusion threshold: text rendering below
14px is excluded from the pass criteria**, per `hook-thesis-web.md` §4. This is the
reproducible number.

**Headline metric.**

| Width (layout) | Fold | Text leaves above fold | Below 14px (excluded) | Qualifying | Total elements above fold | P1 | P2 | P3 | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1265 x 800 | 800 | 43 | 3 | 40 | **106** | yes | yes | yes | **PASS** |
| 375 x 812 | 812 | 15 | 3 | 12 | 55 | yes | yes | yes | **PASS** |

Which qualifying leaf carries which part:

| Part | Carried by | Size | Evidence |
|---|---|---|---|
| P1, something is measured about the visitor's own brand | `h1` "Does AI recommend **your brand** across Web2 & Web3?" | 56px desktop / 35.2px mobile | `index.html:1707` |
| P2, the thing recommending is an AI assistant | same `h1`, plus `p` "See what top AI models ... display when customers ask" | 56px / 16.8px | `index.html:1707`, `:1708` |
| P3, the next step is to check your own domain | `input` placeholder `yourcompany.com` plus `button` "Check my visibility →" | 15.04px | `index.html:1711`, button measured 196x48 desktop, 320x48 mobile |

The three excluded leaves are the same three at both widths: `Stripe supported`,
`Crypto payments coming soon`, `(Crypto.com Pay)`, all at 12.48px.

| ID | Sev | Finding | Evidence | Owner |
|---|---|---|---|---|
| L1-1 | HIGH | The headline's largest words describe a capability that does not exist. See L3-1. Comprehension is not just harmed, it is pointed at the wrong product. | `index.html:1707` | `bg-strategy` |
| L1-2 | MEDIUM | 106 elements render above the fold at 1265x800. `homepage-hook.md` §13.2 set an acceptance criterion of "9 or fewer" (counting its named E1 to E6 elements, so not directly comparable), and its §14.1 build log recorded 30 text leaves. The live page has 43. The hook is competing with more than the spec intended. | Element census, method above | `bg-design` |
| L1-3 | MEDIUM | The h1 wraps to **four** lines at 1265px and occupies 237px, 30 percent of the fold, for 47 characters. `homepage-hook.md` §13.1 constrained the headline to two lines at both widths. It is two lines at 375 (top 168 to 202+) and four at desktop. | `getBoundingClientRect()` height 237.4375 at 56px / 59.36px line-height, box width 552.95 | `bg-design` |
| L1-4 | MEDIUM | No audience is named anywhere above the fold at either width. A stranger learns what is measured and how to start, but not whether it is for them. The brief names founders, heads of growth and SEO leads; none of those words appear in the 10,016 characters of body text. | Text-only extraction, `document.body` clone with script/style/svg removed | `bg-copy` |
| L1-5 | LOW | Three of the leaves above the fold render at 12.48px, below the exclusion threshold. `homepage-hook.md` §14.1 recorded "0 below 14px". The three are the payment chips added after that build log was written. | `index.html:1743` to `:1750`, `.pay-chip` font-size measured 12.48px | `bg-web` |
| L1-6 | LOW | The evidence card ships its score as the literal string `0`, animated to 64 by JS. If the count-up does not run, the card reads "0 /100" under the label "AI Visibility Score" beside the line "Improving, +8 pts vs last audit". A sample report showing zero while claiming improvement contradicts itself in the degraded state. | `index.html:1783`: `<div class="num" id="scoreNum" data-target="64">0</div>` | `bg-web` |

### Lens 2: Conversion path

**No form was submitted, no audit was run, no purchase was made.** The audit handler was
read in `brandgeo/web/site.js` and its DOM bindings inspected in the live page. The
Stripe payment links were fetched with `curl` to read their HTTP status only; no
checkout was started. This is stated so the numbers below are not mistaken for an
exercised flow.

**Calls to action above the fold, 1265x800:** 10 interactive elements, of which
**2 carry a solid brand-violet fill**:

| Control | Fill measured | Size | Top |
|---|---|---|---|
| `.search-btn` "Check my visibility →" | `linear-gradient(135deg, rgb(124,58,237), rgb(99,102,241))` | 196x48 | 567 |
| `.bg-asst-launcher` "Ask Jamie" | `linear-gradient(135deg, rgb(139,92,246), rgb(139,123,255))` | 138x48 | 732 |

Every other above-fold control is transparent-filled. `.nav-cta` "Get started" is an
outline treatment, `background-color: rgba(0,0,0,0)`, so it does not compete.

**Headline metric: 9 of 11 primary-action states covered, 81.8 percent. Zero dead ends
across 27 destinations.**

| State | Status | Evidence |
|---|---|---|
| idle | COVERED | `.search-btn` rendered, label "Check my visibility →" |
| hover | COVERED | `.search-btn:hover { opacity:.9; transform: scale(.98) }` and a second rule `{ transform: translateY(-1px); box-shadow: rgba(124,58,237,.7) 0 10px 28px -10px }` |
| focus | COVERED | `.search-wrap:focus-within { outline: 2px solid var(--ac); outline-offset: 3px }` (`index.html:158`). Verified live: focusing `#brandInput` gives the wrapper computed `outline: rgb(139,92,246) solid 2px`, `:focus-within` matched true |
| active | **SILENT** | No `:active` rule exists for `.search-btn` in any stylesheet on the page. The pressed state is indistinguishable from hover |
| loading | COVERED | Button disabled, input disabled, label swaps to "Scanning the engines…", skeleton replaces the card, and three timed labels at 0s / 7s / 16s (`site.js:155` to `:165`) |
| success | COVERED | `renderAuditResult(val, score, data.token, teaser.category)` plus a second non-fatal call for the gap line (`site.js:352` to `:366`) |
| empty input | COVERED | `if (val.length < 2)` sets "Enter your domain, for example yourcompany.com" and focuses the field (`site.js:313` to `:317`). The code comment records that this was previously a silent focus |
| invalid input | COVERED, server-side only | No client-side validation. A 400 response is surfaced verbatim to the visitor (`site.js:336` to `:343`). The visitor waits for a round trip to learn a typo is a typo |
| server error | COVERED with a caveat | Any non-400/429 failure falls through to `redirectToSignup(val)` after a 600ms notice (`site.js:380` to `:387`). The visitor is moved off the page rather than shown a retry |
| rate limited | COVERED | Client-side `localStorage` cap of 3 attempts per 10 minutes (`site.js:85` to `:87`, `:319` to `:322`) plus server 429 handling |
| offline | **BROKEN** | `fetch` rejects, the error is not `handled`, so the same catch redirects to `app.getbrandgeo.com`. That host is equally unreachable offline, so the visitor is navigated from a working page to a browser error page (`site.js:380` to `:387`) |

**Link census.** 59 anchors, 37 unique `href` values, 27 resolvable destinations.

- All 24 internal HTML destinations return **200**. Swept with `curl` per URL; zero non-200.
- All 3 Stripe payment links return **200** (529254 bytes each).
- `app.getbrandgeo.com/signup` returns **200**, `app.getbrandgeo.com/` returns **200**.
- All 3 in-page anchors (`#how`, `#pricing`, `#contact`) resolve to a real element:
  `document.querySelector` returned truthy for each.
- `REACHABLE`: 27. `DETOUR`: 0. `DEAD END`: 0.
- `linkedin.com/company/79409681` returns 999, LinkedIn's standard automated-request
  refusal. Not assessed as broken. Recorded in "Could not verify".

**At 375x812.** The five nav links are `display:none` and the only route to them is the
36x36 hamburger. Clicking it (verified live) sets `aria-expanded="true"` and reveals all
five at 51 to 52px height plus "Get started" at 47px. Clicking again restores the closed
state. **No control reachable at 1265 is unreachable at 375.**

| ID | Sev | Finding | Evidence | Owner |
|---|---|---|---|---|
| L2-1 | HIGH | Two solid brand-violet fills sit above the fold, and the secondary one is brighter. The chat launcher uses `--ac` (`rgb(139,92,246)`) while the primary CTA uses `--ac-strong` (`rgb(124,58,237)`), so the support widget out-saturates the conversion button 165px below it. `homepage-hook.md` §13.2 set the criterion "exactly one solid `--ac-strong` fill is visible above the fold at any single moment"; that criterion is violated, and F4 from its §12 is re-created in a new form. | Computed `background-image` on both elements, measured live at 1265x800 | `bg-design` then `bg-web` |
| L2-2 | HIGH | The offline path navigates the visitor to a host that is also offline. A network failure on a static page that is already fully rendered ends with the visitor on a browser error page. | `site.js:380` to `:387`, the non-`handled` catch branch | `bg-web` |
| L2-3 | MEDIUM | The primary conversion input is `type="text"` with no `inputmode`, no `autocomplete` and no `pattern`. On a phone it opens an alphabetic keyboard for a value that is always a domain. Measured live: `type:"text"`, `inputMode:""`, `autocomplete:""`, `pattern:""`, `required:false`. | `index.html:1711` | `bg-web` |
| L2-4 | MEDIUM | No `:active` rule on the primary CTA. Between pointer-down and the loading state there is no visual acknowledgement, on a control whose response can take up to 32 seconds. | Enumerated every rule matching `search-btn` across all stylesheets; `:hover`, `:disabled`, `.is-secondary` and `.is-secondary:hover` exist, `:active` does not | `bg-design` |
| L2-5 | MEDIUM | Invalid input is only detectable after a network round trip of up to 32 seconds. The only client-side gate is `val.length < 2`. | `site.js:313`, `site.js:82` (`AUDIT_TIMEOUT_MS = 32000`) | `bg-web` |
| L2-6 | LOW | The hamburger's `aria-label` stays "Open menu" while the menu is open. `aria-expanded` flips correctly to `true`, so the state is announced, but the label contradicts it. | Read live while expanded: `aria-expanded:"true"`, `aria-label:"Open menu"` | `bg-web` |

### Lens 3: Credibility and craft

**Contrast method.** For every above-fold element containing a direct text child, the
computed `color` was blended over the effective background, composited up the ancestor
chain including every alpha layer, and the WCAG relative-luminance ratio computed. Large
text is `>= 24px`, or `>= 18.66px` at weight `>= 700`.

**Result at 1265x800, dark theme: 38 of 39 pass. One failure.**

| Text | Size | Foreground | Background | Ratio | Required |
|---|---|---|---|---|---|
| `(Crypto.com Pay)` | 12.48px, weight 400 | `rgba(255,255,255,0.35)` (`--t3`) | `rgb(14,14,17)` | **3.18:1** | 4.5:1 |

Interface component contrast (WCAG 1.4.11, 3:1 required), computed against the page
background `#050508`:

| Component | Boundary | Ratio |
|---|---|---|
| `.search-wrap` gradient border, 1.5px (the domain field's only outline) | `rgba(124,58,237,.55)` to `rgba(99,102,241,.45)` | **1.78:1** to **1.74:1** |
| `.search-inner` fill (the field's interior) | `--s2` `#12121c` | **1.09:1** |
| `.nav-cta` border, 1px | `rgba(255,255,255,.13)` | **1.34:1** |
| `.theme-toggle` border, 1px | `rgba(255,255,255,.13)` | **1.34:1** |
| `.preview-card` border, 1px | `rgba(255,255,255,.1)` | **1.22:1** |

**Hit targets at 375x812: 46 interactive controls measure under 44px on at least one
axis.** The ones that matter, by position:

| Control | Size | Note |
|---|---|---|
| `.bg-nav-toggle` | 36 x 36 | The sole route to five nav destinations at this width |
| `.pricing-toggle` (monthly/annual) | 44 x 24 | The control that changes every price on the page |
| `.mode-btn` x2 ("Run it yourself from €0", "Done for you from €1,500") | 221 x 37, 233 x 37 | The pricing-mode switch |
| `a.btn-plan` "Start Free" | 301 x 43.5 | 0.5px short |
| `a.btn-plan` "Subscribe" x3 | ~300 x 41.5 | Every paid conversion button |
| Footer links, 33 of them | ~16 high | Long-standing, low impact |

`homepage-hook.md` §12 F8 recorded "closed at build" for hit targets. It was closed for
the above-fold controls only; the pricing block was explicitly out of scope per its
§14.2, and that is where the paid conversion buttons live.

**Performance.** Real transfer sizes, measured with `curl` per resource:

| Resource | Status | Bytes |
|---|---|---|
| `/` (HTML) | 200 | 27,775 |
| `/site.js?v=2026-07-28a` | 200 | 17,902 |
| `/hero.js?v=2026-07-28a` | 200 | 4,798 |
| `/plausible-init.js` | 200 | 196 |
| `/ga4-init.js` | 200 | 143 |
| `/logo-nav.png` | 200 | 1,982 |
| **First-party subtotal** | | **52,796** |

Third-party on top of that: Plausible, Google Tag Manager `gtag/js`, and a
render-blocking Google Fonts stylesheet requesting six Inter weights (400 through 900).
Only two images load and both are the same 1,982-byte `logo-nav.png`; the hero graphic
is a canvas, so it costs no bytes.

Render-blocking resources in `<head>`, read from the live DOM: `plausible-init.js`,
`ga4-init.js` (neither `async` nor `defer`), and the Google Fonts stylesheet. Both
analytics files are tiny, but they are first-party scripts placed ahead of first paint.

LCP, CLS and paint timings could not be measured. See "Could not verify".

| ID | Sev | Finding | Evidence | Owner |
|---|---|---|---|---|
| **L3-1** | **CRITICAL** | **The page sells two Web3 engines the product has no implementation for.** The h1 asks about visibility "across Web2 & Web3", the subline promises "decentralized knowledge engines", and the engine strip renders a `Web3` tier listing **Bittensor** and **Mind Network** beside the five real engines, with no "coming soon" qualifier. `planConfig.ts:12` to `:20` defines the complete `EngineId` union as `chatgpt, gemini, claude, perplexity, google_ai, copilot, deepseek, grok` (plus retired `meta`). `PLAN_ENGINES` at `:49` to `:55` lists no Web3 entry for any tier including `enterprise`. A repository-wide grep of every `.js` and `.ts` file under `brandgeo-dashboard/` and `brandgeo/` for `bittensor` or `mind network` returns **zero matches**. There is no collector, no cost entry and no engine id. Note the contrast with `index.html:1741`, where a code comment states that "coming soon" on the crypto payment chip is load-bearing because no Crypto.com account exists; the page is careful about crypto payments and not careful about crypto engines. **Spans marketing and product, recorded once here per the edge-case rule.** | `index.html:1707`, `:1708`, `:1864` to `:1866` on the marketing side; `brandgeo-dashboard/src/lib/planConfig.ts:12` to `:20` and `:49` to `:55` on the product side | `bg-strategy` decides, then `bg-copy` and `bg-web`. Product owner `bg-backend` if the answer is that it should exist |
| **L3-2** | **HIGH** | **The same free audit is given three different durations.** Hero trust chip: "Results in 10s" (`index.html:1733`). FAQ, answering "How quickly do I get results?": "Your free audit lands within 48 hours" (`index.html:2284`). Contact section: "Free, no commitment, results within 48 hours" (`index.html:2305`). Meanwhile the client budgets `AUDIT_TIMEOUT_MS = 32000` (`site.js:82`) and its own progress copy says "Scoring the answers, nearly there" only at the 16-second mark (`site.js:160`). Four numbers, one product. `homepage-hook.md` §12 F7 is recorded as "closed at build: 48h removed from the trust row"; it was removed from the trust row and it survives twice below the fold describing the same thing. **F7 is not closed.** | Five line citations above | `bg-copy` |
| **L3-3** | **HIGH** | **"50+ brands audited" is still live and still untraceable.** `homepage-hook.md` §14.2 removed it from the hero as untraceable, left the pricing-block instance in place as out of scope, and wrote "`bg-verify` should confirm or remove the remaining instance". It was neither confirmed nor removed. No file in the repository substantiates the number. | `index.html:2236` | `bg-copy`, with a source from `bg-strategy` or removal |
| L3-4 | MEDIUM | **The free audit queries two engines while the hero displays five.** `_prospect_engines.js:395` sets `SCREENING_ENGINES = ['gemini', 'perplexity']`, and `audit-domain.js:81` selects that set for screening depth, which is what the homepage widget calls. The subline promises "what top AI models ... display", and the card beside the button shows ChatGPT, Gemini, Claude, Perplexity and Google AI. Three of those five are never queried for a free audit. Mitigating: the card is labelled "Sample report" (`index.html:1767`), which is honest about the card itself; the subline's plural is not. | `brandgeo-dashboard/netlify/functions/_prospect_engines.js:395`, `audit-domain.js:81`, against `index.html:1708` | `bg-copy` and `bg-backend`, both named |
| L3-5 | MEDIUM | **White text on the primary CTA fails AA at the right end of its gradient.** `index.html:1524` overrides the button fill with `background: linear-gradient(135deg, var(--ac-strong), #6366f1) !important`. White on `#7c3aed` is 5.70:1 and passes; white on `#6366f1` is **4.47:1** and fails the 4.5:1 body-text threshold. The label is 15.04px at weight 700, which is not large text (large needs 18.66px at bold). `homepage-hook.md` §12 F2 was closed by moving to `--ac-strong`; a later `!important` gradient re-opened half of it. | Computed ratios above; `index.html:478` to `:490` and `:1524` | `bg-design` then `bg-web` |
| L3-6 | MEDIUM | The domain field's only visual boundary is a 1.5px gradient at 1.74:1 to 1.78:1 against the page, and its interior fill is 1.09:1. WCAG 1.4.11 requires 3:1 for the boundary of a user interface component. Mitigating: the solid violet button sits inside the same rounded container and is unmissable, so the field is locatable even though its own edge is not. | Measured ratios above; `index.html:459` to `:466` | `bg-design` |
| L3-7 | MEDIUM | 46 interactive controls measure under 44px at 375x812, including the sole navigation affordance (36x36), the pricing period toggle (44x24) and all four plan conversion buttons (41.5 to 43.5px tall). | Full census above | `bg-design` then `bg-web` |
| L3-8 | LOW | `(Crypto.com Pay)` renders at 3.18:1, using `--t3`. `homepage-hook.md` §12 F3 removed `--t3` from above-fold text; the payment chips added afterwards reintroduced it. | Computed ratio above; `index.html:1567`, `:1750` | `bg-web` |
| L3-9 | LOW | Two first-party analytics scripts in `<head>` carry neither `async` nor `defer` and sit ahead of first paint, alongside a render-blocking third-party font stylesheet requesting six Inter weights. | `plausible-init.js` and `ga4-init.js` read from `document.head` with no `async`/`defer` attribute | `bg-web` |

**Motion.** Twelve separate `@media (prefers-reduced-motion: reduce)` blocks are present
and they cover the reveal transitions, the score ring, the dimension bars, both hero
orbs, the hero canvas transition, the CTA spinner, the audit result, the skeleton pulse,
the engine chips, the engine tooltip, the ticker, the preview card tilt, the engine-strip
dots and the assistant widget. `hero.js:36` reads the same media query in JS and paints
a single static frame instead of animating. Only **two** elements animate above the fold
in the hook's reading window: `.hero-orb` (18s) and `.hero-orb-2` (23s), both cancelled
under reduced motion. This is handled better than the category standard and no finding is
raised against it.

**Proof ordering.** DOM order below the hero: engines strip, score, sentiment, chain,
research band, how, pricing, faq, contact, latest, footer. The first piece of proof after
the hero is the engine strip, which is a capability list rather than evidence. The first
actual evidence is the score section, "One number, six dimensions." The headline's claim
is about whether AI recommends you; the first proof is about what the score is made of.
The claim and the first proof are adjacent but not the same claim. No finding raised, the
ordering is defensible.

### Lens 4: AI answer readiness

**Structured data.** One `application/ld+json` block, 3,717 characters,
`index.html:25` to `:89`. It parses without error. Types present: `Organization`,
`Person`, `PostalAddress`, `WebSite`, `SoftwareApplication`, `Offer`,
`UnitPriceSpecification`.

Honesty checks:

- The types match what the things are. `SoftwareApplication` with
  `applicationCategory: "BusinessApplication"` is correct for this product.
- **No `AggregateRating` and no `Review`.** Nothing invents social proof in markup that
  is absent from the page. This is the most common form of dishonest structured data and
  the page does not do it.
- `disambiguatingDescription` actively distinguishes BrandGEO from `brandgeo.co` and
  `brangeo.app`. Deliberate and useful for a machine answering "which BrandGEO".
- Prices in markup match prices on screen: `0`, `99`, `299`, `449`, `1500` EUR against
  rendered `€0`, `€99 /mo`, `€299 /mo`, `€449 /mo`, `€1,500 /mo`. **No mismatch.**

**Heading hierarchy.** Exactly one `h1`. Full sequence read from the live DOM:
`H1, H2, H2, H2, H3, H3, H3, H2, H2, H3, H3, H3, H2, H2, H2, H2, H3, H3, H3, H3, H3, H4, H4, H4, H4`.
**No skipped levels.** Headings state claims rather than tease: "One number, six
dimensions.", "It's not just if AI mentions you. It's how.", "A gap becomes a brief. A
brief gets published." This is above category standard.

**Extractability.** Body text with `script`, `style`, `noscript` and `svg` removed,
first 240 characters:

> BrandGEO How it worksPricingFAQResearchNews Get started 🌙 AI Visibility Platform Does
> AI recommend your brandacross Web2 & Web3? Check your domain instantly. See what top AI
> models and decentralized knowledge engines display when customers ask. Check my
> visibility →

The core claim survives CSS removal and appears in the first screen of text. 10,016
characters of extractable body text total. **PASS.**

**Primary claim is text, not image.** The h1 is a real `h1` element. The hero graphic is
a `<canvas>` carrying no text the claim depends on. The only two `<img>` elements on the
page are the 22x32 and 19x28 logo. **PASS.**

**Crawler permissions.** `robots.txt` returns 200, 351 bytes. It explicitly `Allow: /`
for `OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `ClaudeBot`, `anthropic-ai`,
`PerplexityBot`, `YouBot` and `Google-Extended`, with a comment explaining that blocking
`Google-Extended` would only affect Gemini training and not live grounding. Default
`User-agent: *` is `Allow: /`. `Sitemap:` is declared and `/sitemap.xml` returns 200 with
79 `<loc>` entries. `<link rel="canonical" href="https://getbrandgeo.com/">` present at
`index.html:15`. **The page is fully permitted to be cited.**

| ID | Sev | Finding | Evidence | Owner |
|---|---|---|---|---|
| L4-1 | HIGH | **The structured data and the rendered headline describe two different products.** The `SoftwareApplication.description` and the `Organization.description` both name exactly five engines: "ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode". The h1 a machine also reads promises "Web2 & Web3". An engine quoting this page can produce either answer, and the two contradict each other. Whichever way L3-1 is resolved, these must agree. | `index.html:36` and `:78` against `index.html:1707` | `bg-web`, blocked on the L3-1 decision |
| L4-2 | MEDIUM | Six real `<details class="faq-item">` question-and-answer pairs render on the page and there is **no `FAQPage` markup anywhere**. Verified: `/FAQPage/.test(document.documentElement.innerHTML)` returns `false`. This is the page's most quotable content and it is invisible as structured data. | Live DOM check; FAQ block at `index.html:2270` onward | `bg-web` |
| L4-3 | LOW | The five `Offer` objects carry no `availability`, no `url` and no `priceValidUntil`. A machine cannot tell whether a tier is purchasable or where to buy it. Three of the five have live Stripe links on the page that the markup does not expose. | `index.html:79` to `:85`; live links at `site.js:627` to `:637` | `bg-web` |
| L4-4 | LOW | Annual pricing renders to humans (`€990 /yr`, `€2,990 /yr`, `€4,490 /yr`, `€15,000 /yr`) and appears nowhere in the structured data, which carries `unitText: "MONTH"` only. A machine asked "what does BrandGEO cost per year" will multiply the monthly figure and overstate by roughly two months on every tier. The rendered "Save €3,000" on Managed checks out: 1500 x 12 = 18,000 against 15,000. | Rendered prices read live; `index.html:79` to `:85` | `bg-web` |
| L4-5 | LOW | `Organization.logo` points at `/logo.png`, which returns 200 at **213,532 bytes**. The page itself never loads it (it uses the 1,982-byte `logo-nav.png`), so this costs the visitor nothing, but it is what every consumer of the markup fetches. | `curl` status and size; `index.html:35` | `bg-web` |

---

## 5. Refuted claims

This section is mandatory. Each item below was measured and found to be fine. The brief
asked specifically that `homepage-hook.md`'s inherited findings be attacked rather than
carried forward, and four of them do not survive contact with the live page.

| # | The claim | The measurement that refutes it |
|---|---|---|
| R1 | **"The page fails the three-second comprehension test at 1280x800"** (`homepage-hook.md` §2.1, verdict "fails"). | **Does not reproduce.** That measurement was taken against a different page: its §2.1 table quotes an h1 reading "AI recommends." at 67.2px, and records 53 text leaves of which 44 were below 14px. The live page has a different h1 at 56px, 43 leaves of which **3** are below 14px, and all three of P1, P2 and P3 are carried by qualifying leaves at **both** widths. PASS at 1265x800 and PASS at 375x812. The finding was true when written and was closed by the rebuild it specified. |
| R2 | **"The primary CTA has no visible focus indicator"** (`homepage-hook.md` §12 F1). This looked like a live regression, because `index.html:162` reads `.search-inner input:focus-visible { outline: none; }`, which removes the site-wide ring from the single most important input. | **Refuted.** The wrapper carries it instead. `index.html:158` sets `.search-wrap:focus-within { outline: 2px solid var(--ac); outline-offset: 3px }`. Verified live by focusing `#brandInput` and reading the wrapper: `:focus-within` matched `true`, computed `outline-color rgb(139,92,246)`, `outline-style solid`, `outline-width 2px`. The ring is drawn around the whole field rather than the bare input, which is the better treatment. F1 is genuinely closed. |
| R3 | **"Growth PRO has no Stripe price or checkout link, so it cannot be bought self-serve"** (`CLAUDE.md`, Revenue backlog, citing `site.js:513`). | **Refuted, and this is a live revenue item.** `site.js:634` to `:636` defines `growth_pro` with `monthly: 'https://buy.stripe.com/7sYaEY3yIcGMaQsa0qdZ609'` and an annual link. The monthly link is rendered on the page as the €449 tier's "Subscribe" button and returns **HTTP 200** (529,254 bytes). Growth PRO is buyable self-serve today. The backlog entry is stale. |
| R4 | **"The hero canvas sits at opacity 0 with a 300x150 backing store and never paints"** (the CSP defect fixed on 2026-07-28). | **Refuted on the parts that can be measured.** After a clean load: backing store **1280x640**, class `hero-graph is-live`, and pixel sampling of the top 200 rows found **281 non-transparent samples out of 36,571 sampled** with `maxAlpha 252`. The dominant painted colours quantise to `rgb(128,64,224)` (the violet node fill, `139,92,246`) and `rgb(224,224,224)` (the white engine labels). The drawing code runs and the graph is composited into the canvas. `hero.js` loads as an external file at `https://getbrandgeo.com/hero.js?v=2026-07-28a`, so the CSP fix landed. |
| R5 | Implicit concern: **horizontal overflow at 375**. | **Refuted by a real scroll, not by `scrollWidth`.** At 375x812 the page was scrolled to x=400 and `window.scrollX` read back **0**. `document.scrollingElement.scrollWidth` equals the layout width. No horizontal overflow. |
| R6 | Implicit concern: **controls unreachable on mobile**. | **Refuted.** Five nav links are `display:none` at 375, and the hamburger was clicked live: `aria-expanded` flips to `true`, all five links become visible at 51 to 52px height, and clicking again restores the closed state. Every destination reachable at 1265 is reachable at 375. |
| R7 | Implicit concern: **`prefers-reduced-motion` not honoured**. | **Refuted.** Twelve `@media (prefers-reduced-motion: reduce)` blocks enumerated from the live stylesheets, covering every animated surface on the page including the canvas, plus a JS-side check at `hero.js:36` that paints one static frame. Only two elements animate above the fold and both are cancelled. |
| R8 | Implicit concern: **dead links**. | **Refuted.** 24 internal HTML destinations plus 3 Stripe links plus 2 app destinations were fetched individually. Every one returned 200. All 3 in-page anchors resolve to a real element. Zero dead ends. |
| R9 | Implicit concern: **`logo.png` at 213KB is bloating the page**. | **Refuted.** The page loads `logo-nav.png` at 1,982 bytes, twice, and never requests `logo.png`. Confirmed from `document.images`: two entries, both `logo-nav.png`, natural size 96x140. `logo.png` is referenced only from JSON-LD. It is a structured-data concern (L4-5), not a page-weight one. |
| R10 | Implicit concern: **the JSON-LD prices contradict the page**. | **Refuted.** All five monthly prices in the markup match the five rendered on screen exactly: 0, 99, 299, 449, 1500 EUR. The gap is the annual tier, which is rendered but not marked up (L4-4), not a contradiction. |

---

## 6. Could not verify

Silence here would read as a clean bill of health, so every unsettled item is listed.

| # | Item | Reason |
|---|---|---|
| C1 | **Whether the hero canvas is visually visible to a human.** This is the item the brief asked to be confirmed by looking at it. It could not be. The browser pane in this environment never composites: `computer{action:"screenshot"}` returns `screenshot failed: Screenshot timed out after 5s: the Browser pane is not displayed, so the page is not compositing frames`. The canvas paints (R4) but its computed `opacity` stays at `0` because the `.hero-graph` to `.hero-graph.is-live` transition never advances: `canvas.getAnimations()` returns one `CSSTransition` on `opacity` in state `running` with `currentTime: 0`. Proof this is environmental and not a page defect: `document.hidden === true` and a `requestAnimationFrame` callback registered directly in the page **did not fire within 1500ms**. In a compositing tab that transition resolves to `opacity: 1` in 1.2s. **A human still needs to look at this page.** |
| C2 | **Whether the report-card hover tilt visibly responds.** Structurally it should: `#previewCard` exists, `matchMedia('(hover: hover) and (pointer: fine)')` matches `true`, reduced motion is `false`, the parent carries `perspective: 1200px`, the card carries `transform-style: preserve-3d` and `transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)`. A synthetic `pointermove` with `pointerType: 'mouse'` was dispatched at 85 percent width / 15 percent height and `card.style.transform` remained empty, **because the handler writes the transform inside a `requestAnimationFrame` callback (`hero.js`, tilt block) and rAF does not fire in this pane** (same proof as C1). Bindings verified, behaviour not observed. |
| C3 | **LCP element and time, CLS, and first paint.** `PerformanceObserver` returned no `largest-contentful-paint` entry and `performance.getEntriesByType('paint')` returned an empty array, because the page never paints in a non-compositing pane. The `layout-shift` observer returned `cls: 0` with zero entries, which is an absence of data rather than a measurement of stability, and is not reported as a CLS score. Resource `transferSize` also read 0 on the reload, so all byte counts in Lens 3 come from `curl` instead. Needs a real browser or Lighthouse run. |
| C4 | **The live audit endpoint's actual behaviour.** `audit-domain` was read, not called. Calling it would run a real screening collection against Gemini and Perplexity and spend LLM budget, which the audit rules forbid. Every Lens 2 state verdict comes from reading `site.js` and inspecting the DOM bindings, not from exercising the flow. The `invalid input`, `server error`, `rate limited` and `offline` rows in particular are handler-derived. |
| C5 | **The contact form's end-to-end path.** `index.html:2288` posts to `https://formsubmit.co/contact@getbrandgeo.com` with `_next` set to `/thanks.html`. Not submitted. Whether the FormSubmit address is activated and whether mail is delivered cannot be checked without sending a real lead. |
| C6 | **Light theme.** The page ships a full `[data-theme="light"]` token set at `index.html:118` to `:131` and a `--t3` value of `rgba(9,9,15,.35)` which `homepage-hook.md` §9.1 computed at 2.32:1. Exercising it requires clicking the theme toggle, which writes a persisted preference. Treat light theme as **unaudited**. |
| C7 | **`linkedin.com/company/79409681`.** Returns HTTP 999, LinkedIn's automated-request refusal. Not assessable without a browser session; not counted as a dead end. |
| C8 | **Whether "50+ brands audited" is true.** No file in the repository substantiates or refutes it. It is filed as untraceable (L3-3), not as false. Only Constantin can settle it. |
| C9 | **Whether the Web3 engines are a roadmap statement.** `index.html:1847` carries a comment saying the Web3 entries "were added 2026-07-28 on an explicit owner decision to present both tiers together". That records that the addition was intentional. It does not record whether the owner intended them to read as shipped capability or as roadmap, and the markup carries no qualifier either way. This is the checkpoint below. |
| C10 | **Cross-browser and real-device behaviour.** Everything above was measured in one Chromium pane at two synthetic widths. No Safari, no Firefox, no real phone. |

---

## 7. Human checkpoint

```
=== HUMAN CHECKPOINT ===
NEED:      Does BrandGEO monitor Bittensor and Mind Network today, or is the Web3 tier a
           roadmap statement?
WHY:       The h1 is the largest text on the page and it promises Web2 AND Web3. No
           engine id, collector, cost entry or plan set for either name exists anywhere
           in the codebase, and the page's own JSON-LD names only the five Web2 engines.
OPTIONS:   A) It ships today -> then the product side is the defect: planConfig.ts,
              _prospect_engines.js and _cost.js all need the two engines, and this
              becomes a bg-backend build, not a copy fix.
           B) It is roadmap -> then the marketing side is the defect: the h1, the subline
              and the engine strip need the same "coming soon" treatment the crypto
              payment chip already has at index.html:1748, and L3-1 becomes a bg-copy fix.
           C) It was a mistake -> the Web3 framing comes out of the headline entirely and
              the page reverts to the five-engine claim its own structured data makes.
DEFAULT:   Nothing changes. Every visitor and every AI engine reading this page continues
           to be told BrandGEO measures visibility on Bittensor and Mind Network.
TO RUN:    No command. This is a decision, and it is the gate on findings L3-1 and L4-1
           and on top action #1.
TO VERIFY: After the decision, re-read C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\index.html
           lines 1707, 1708 and 1864 to 1866, and confirm they agree with
           C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard\src\lib\planConfig.ts
           lines 12 to 20.
=== END CHECKPOINT ===
```

A second checkpoint is owed on C1: the hero canvas has now been verified painting
programmatically twice, and never once by a human eye. That was the specific thing this
audit was asked to confirm visually and it is the one thing it could not do.

---

## 8. Note on scope

This audit wrote exactly one file, this one. `index.html`, `site.js`, `hero.js` and every
other file in the repository are unchanged. No fix is drafted anywhere above. No form was
submitted, no audit was run, no purchase was made, nothing was deployed or pushed.
