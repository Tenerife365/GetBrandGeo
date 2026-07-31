# Website Theme & Features Audit — getbrandgeo.com (2026-07-17)

Scope: the static marketing site under `brandgeo/web/` (59 `.html` pages).
Two axes, per Constantin's kickoff: **Theme** (polish + rebrand + cross-page
consistency) and **Features** (interactive elements + new landing sections,
audit-first). This doc is the audit artifact; the palette decision is
Constantin's to make (options at the end).

---

## 1. Theme — cohesion findings

### 1.1 The accent is inconsistent, even on `index.html` alone
Four different accent treatments coexist on the homepage:
| Where | Value | Notes |
|---|---|---|
| `--ac` (buttons, links, labels) | violet `#6c63ff` | primary |
| `--ac2` (checkmarks, "improving", highlights) | teal `#00d4aa` | secondary |
| Logo wordmark `.geo` gradient | `#3B82F6 → #6D28D9 → #8B5CF6` | blue→violet, a *third* scheme |
| Preview score-ring gradient | `#c4b5fd → #6d28d9` | a *fourth* violet ramp |

### 1.2 The site and the app don't look like the same brand
The **dashboard is violet-only** (`#8b5cf6`, per `DESIGN-SYSTEM.md` §4.2, with a
standing rule to never use teal/green as a primary brand color). The marketing
site adds **teal `--ac2`** as a prominent secondary. This product↔site mismatch
is the single biggest theme issue — a prospect who audits on the site and then
logs into the app sees two different colour identities.

---

## 2. Theme — cross-page consistency (all 59 pages surveyed)

| Bucket | Count | Pages | Fix effort |
|---|---|---|---|
| **Canonical** (`--ac`/`--ac2`, `#050508` bg, light mode, `site.js`) | 35 | index, 17 `ai-visibility-for-*`, 10 `brandgeo-vs-*`, ai-visibility-index, faq, support, terms, 3 `news/*` | none |
| **Drift — token naming** | 19 | `bg-001`…`bg-017`, `blog.html`, `glossary.html` | rename `--accent`→`--ac`, `--accent2`→`--ac2`; bg `#0a0a0f`→`#050508`. Same colours, so **visually near-identical** — but a global `--ac` restyle would silently skip these 19. |
| **Drift — older navy scheme** | 2 | `privacy.html`, `cookies.html` | `--bg:#0b0f1a` navy, **no teal accent**; privacy has **no light mode + no `site.js`** (dark-only). Highest visual divergence. |
| **Dead toggle** | 1 | `welcome.html` | canonical tokens but **missing `site.js`** → ships light-mode vars that can never activate. ~1-line fix. |
| **Standalone / by-design** | 2 | `thanks.html` (tiny hardcoded dark), `article-builder.html` (internal tool, hardcoded light) | low priority / exclude |

**Verdict:** 35/59 pixel-canonical. 24 drift, but only **privacy + cookies**
diverge in a way a visitor would actually notice; the 19 `bg-*`/blog/glossary
drifts are token-naming only. `welcome.html`'s dead toggle is a real (small) bug.

---

## 3. Features — inventory & gaps

### 3.1 Already live on the landing page (strong)
Hero + live "Check My AI Visibility" audit widget (with honeypot), engine chips
with hover tooltips, live activity ticker, animated score ring + dimension bars,
scroll reveals, drifting hero orbs, mouse-tilt preview card, pricing billing
toggle. **Sections:** hero → proof bar → product-preview mockup → 6 feature cards
→ "Beyond mentions" sentiment → how-it-works → pricing (self-serve + managed) →
"Latest from BrandGEO" → free-audit form. This is already richer than most
competitors in the benchmark.

### 3.2 Gaps vs. `COMPETITIVE-BENCHMARK.md`
1. **No testimonials / customer logos** — the #1 trust gap; every benchmarked
   competitor leads with social proof. (Was blocked on real quotes.)
2. **Comparison pages not surfaced** — 10 `brandgeo-vs-*` pages exist but nothing
   on the landing page links to them (peec.ai footer-links all its vs-pages).
3. **No FAQ on the landing** — only the standalone `faq.html`.
4. **No "as featured in" / methodology-credibility strip** tying to the arXiv
   paper + AI Visibility Index (real owned assets that build authority).

---

## 4. Recommended execution order (after palette decision)
1. **Palette decision** (§5) — blocks all theme work.
2. **Rebrand pass on `index.html`** — unify the 4 accent treatments to the chosen
   system; this becomes the reference.
3. **Fix privacy + cookies** (highest-visible drift) + `welcome.html` dead toggle.
4. **Token-uniformity pass** on the 19 `bg-*`/blog/glossary pages (so future
   global restyles reach them). Per project rule: **`Edit` per file, never a bulk
   script** (§0 / §9.22 incident).
5. **Features:** surface comparison links + add a testimonials/social-proof
   section (pending real quotes) + optional landing FAQ.

Every page change is static HTML → needs a **manual cPanel upload**; verify live
per `[[brandgeo_verify_cpanel_upload]]` (cache-bust before concluding stale).

---

## 5. Palette decision (Constantin picks)
- **Option A — Unify on violet (match the app).** Drop teal `--ac2`; violet is the
  single accent everywhere; retune logo + ring to the violet family. One brand
  across site + dashboard. *Recommended* — resolves §1.2, honours the design-system
  rule, cleanest story.
- **Option B — Formalise violet + teal.** Keep both, but define teal strictly as a
  secondary/success accent and apply it consistently; align logo + ring. Keeps the
  current character; still differs from the violet-only app.
- **Option C — Violet + a new secondary.** Replace teal with a fresh complement
  (amber/coral) for a more distinct look. Bigger, higher-risk rebrand.

---

## 6. Executed 2026-07-17 (decision: Option B — disciplined violet + teal)
Constantin chose Option B. Shipped (code-complete, **NOT yet uploaded to cPanel**):

**Theme**
- **Logo blue-drop, site-wide (56 files, 57 occurrences).** `.logo-text .geo` /
  footer variant gradient `#3B82F6 → #6D28D9 → #8B5CF6` → `#8B5CF6 → #6D28D9`
  (violet only, blue removed). Done as individual `Edit`s (4 parallel subagents +
  index.html by hand), **no scripts** per §9.22. Verified: OLD gradient = 0 files,
  NEW = 57 occ / 56 files; every touched file keeps exactly one `</html>`/`</body>`.
- **privacy.html + cookies.html** navy scheme (`#0b0f1a`) → canonical near-black
  (`#050508` + `--s`/`--bd`/`--t`/`--muted` canonical values), light-mode block
  added to privacy (was dark-only), logo violet-ised on cookies. Also fixed a real
  light-mode readability bug: body copy was hardcoded `#c0cae0` (near-invisible on
  the light background) → `var(--text)`.
- **welcome.html** dead toggle → added a tiny `<head>` script honouring the saved
  `bgTheme` preference (site.js's theme code is gated on a `#themeBtn` this page
  doesn't have, so loading site.js alone wouldn't have worked). Logo violet-ised.
- **Skipped** (per Constantin): the 19 `bg-*`/blog/glossary `--accent` token-name
  drifts (identical colours, cosmetic-code only). `thanks.html`/`article-builder.html`
  left as-is by design.

**Features (index.html)**
- **Comparison pages surfaced** — new 5th footer column "Compare" linking all 10
  `brandgeo-vs-*` pages (footer grid `2fr 1fr 1fr 1fr` → `…1fr 1fr`).
- **Landing FAQ** — new `#faq` section before Contact: 6-question native
  `<details>` accordion (accessible, no JS), styled with existing tokens, "See all
  FAQs →" to `faq.html`. Content drawn only from the page's own established facts.
- **Not done** (still blocked / deferred): testimonials/social proof (needs real
  customer quotes); optional FAQPage JSON-LD on the landing (faq.html already
  carries the schema).

**Files changed:** 57 `.html` (all of `web/*.html` + `web/news/**` EXCEPT
`article-builder.html` and `thanks.html`). No JS/CSS/image files changed.
**Upload + live-verify** required (cache-bust per `[[brandgeo_verify_cpanel_upload]]`).

---

## 7. Landing-page elevation 2026-07-17 (visible-impact pass, `index.html` only)
Follow-up after Constantin noted §6 was too subtle. Ran a landing-page
conversion/UX "laws" audit; the theme/consistency work in §6 is confirmed
**live** on getbrandgeo.com. Design direction was approved via a clickable
artifact preview before touching the live file. All `index.html`, verified
structurally (no duplicate IDs, `site.js` bindings intact, sections balanced).

- **Split hero — product above the fold (SHIPPED + LIVE, Constantin confirmed
  "great").** Hero restructured from centered text into a 2-column
  `.hero-split`: copy + audit widget left, the live `.preview-card` (score
  ring / 6 dims / engine split / Fix This) folded UP into the right column so
  the product is visible above the fold. The old standalone `product-preview`
  section and `proof-bar` were removed (card physically moved, not duplicated —
  `scoreRingProgress`/`scoreNum`/`tickerText`/`preview-card`/`preview-wrap` all
  verified exactly 1 each so `site.js`'s IntersectionObserver animation + tilt
  still bind). Engine chips replaced by the strip below. Audit widget IDs
  (`brandInput`/`auditBtn`/`auditHp`/`auditStatus`/`auditResult`) preserved.
- **`hero-trust` line** under the CTA: 5 engines · 50+ brands · 48h · no card.
- **`engines-strip`** ("Monitoring" + the 5 engine dots) — above-the-fold trust.
- **`research-band`** — real peer-reviewed study (Zenodo DOI) + AI Visibility
  Index links. Both LIVE, confirmed via WebFetch.
- **Section polish (targeted, NOT a blind restyle):** added a hover-lift to
  `.pricing-box` (it had none; now matches `.feature-card`). Page was already
  well-polished, so the rest was left alone.
- **Testimonials skeleton** — 3-card `#testimonials` section before pricing,
  **wrapped in an HTML comment** so it can't go live with placeholder quotes.
  CSS (`.testimonials-grid`/`.testimonial-card`) is already in the stylesheet.
  Activate by replacing the 3 quotes/names and removing the comment markers.
- **Deferred:** real dashboard screenshot (needs Constantin's login);
  optional FAQPage JSON-LD on the landing.

Dead CSS left in place (harmless): `.product-preview`, `.proof-bar`,
`.engine-chip(s)` rules whose markup was removed.

**Second upload (hero) already confirmed LIVE.** The polish + testimonials
skeleton is a further `index.html`-only change needing one more upload.

---

## 8. Session 2026-07-17 (round 2) — mobile nav + footer link-row + small-screen nav fit

Constantin picked all four candidates (mobile nav, unified footer, inline audit
widget on landers, index mobile-polish). After investigation, two were rescoped
with his sign-off (AskUserQuestion), because the review changed the picture:

- **Subpages did NOT need the split product hero** — the 17 industry/city + 10
  comparison pages already use canonical tokens + their own content-appropriate
  heroes (findings bars, verdict cards, compare tables, mini-FAQs). Applying the
  homepage's product hero to them would be wrong.
- **Homepage was already mobile-polished** — hero collapses at 900px,
  `.preview-top`/dims restack at 640px, ticker hidden <640px, sections padded.
  The one genuinely broken mobile thing was the nav (below).

**SHIPPED this session (code-complete, NOT yet uploaded to cPanel):**

1. **🔴 Mobile nav menu — site-wide, ONE file (`site.js`).** Every page hid all
   nav links except the CTA below 640px and shipped no hamburger, so How it
   works / Pricing / FAQ / Research / News were unreachable on phones across all
   ~59 pages. Rather than edit 59 inline `<nav>` blocks, added a progressive-
   enhancement module at the end of `site.js`: wraps the text links in a
   `.bg-nav-drawer` (`display:contents` on desktop → zero layout change), injects
   a hamburger `.bg-nav-toggle` + scoped CSS (uses existing `--nav`/`--bd`/`--bd2`
   /`--t2` vars), and reveals the drawer as a dropdown on mobile. Wired: toggle,
   click-a-link-closes, click-outside-closes, Escape, resize-resets, hamburger→X
   animation, aria-expanded. Covers every page that loads `site.js` (privacy/
   welcome/thanks/article-builder don't load it — acceptable, minimal pages).
   Verified locally in Chrome: DOM manipulation correct (drawer w/ all links,
   toggle, CTA preserved), drawer anchors below the nav (sticky establishes the
   containing block), renders cleanly; also confirmed active on a subpage
   (law-firms). `node --check` clean.
2. **Small-screen nav fit — same `site.js` injected CSS.** Measured the mobile
   bar's intrinsic width at ~381px (logo + CTA + theme + hamburger), so it would
   overflow into a horizontal scroll on ≤380px phones (iPhone SE 375, 360px
   Androids). Added a `@media(max-width:380px)` block tightening nav padding, CTA
   padding, and button margins so it never overflows down to ~320px.
3. **🟡 Footer link-row enhancement — 49 files (NOT the full 5-col port).** The
   full 5-column homepage footer would be ~106 edits across 53 non-uniform files
   (industry/comparison share one footer; each bg article differs; faq/support/
   glossary/terms each distinct) — same scale/risk as the §9.22 corruption
   incident. Per Constantin's choice, did the safe high-value version instead:
   added **Compare (`/blog.html#compare`), Newsroom (`/news/`), Support
   (`/support.html`)** to the existing thin-footer link row, surfacing them
   beyond the homepage (the actual nav/SEO goal). Executed as exact-match `Edit`
   per file (NO scripts, §9.22): 28 Type-A (17 industry/city + 10 comparison +
   ai-visibility-index) + 17 bg-* via two subagents; 4 utility pages (faq/support/
   glossary/terms) by hand with per-page dedup (no self-links, no duplicate
   Support/FAQ). **Skipped** privacy/cookies/welcome (single-line `<p>` legal/
   internal footers, by design). Verified: all 49 carry exactly one Compare link;
   structural Grep check clean (each edited file has exactly one `</html>`/
   `</body>` — the only file showing 2 is `article-builder.html`, NOT touched,
   pre-existing); `#compare` anchor confirmed present in `blog.html`; live
   render confirmed on law-firms.

**DEFERRED to their own chats (Constantin's call):**
- **Full 5-column footer port** on all 53 subpages — dedicated multi-batch pass.
- **Inline audit widget on the 27 landers** — needs the ~120-line audit-widget
  CSS block (`.search-wrap`/`.search-inner`/`.audit-result`/`.audit-*`, currently
  inline only in `index.html`) ported per page + markup; its own focused session.
- **Testimonials** — still blocked on real customer quotes (skeleton ready in
  `index.html`, wrapped in an HTML comment).

**REQUIRES UPLOAD (50 files, cPanel; live-verify per `[[brandgeo_verify_cpanel_upload]]`
with a cache-buster):** `site.js` + the 49 footer HTML files (17 `ai-visibility-for-*`,
10 `brandgeo-vs-*`, `ai-visibility-index-2026-07.html`, `bg-001`…`bg-017`, `faq.html`,
`support.html`, `glossary.html`, `terms.html`). Mobile-nav + small-screen fit live
the moment `site.js` lands; footer links live per HTML file uploaded.
**✅ All 50 uploaded + live-verified 2026-07-17** (cache-busted WebFetch): `site.js`
carries the nav module + `@media(max-width:380px)`; Compare/Newsroom/Support confirmed
on law-firms (Type A), bg-001 (Type B), terms (Type C).

---

## 9. Session 2026-07-17 (round 3) — pricing section redesign (conversion)

Constantin: the pricing area is "very big / not user friendly" — wants a better hook
that glues visitors and converts. Reviewed the live section: **6 full cards** (Free/
Essentials/Growth + Managed/Pro/Enterprise) with long "everything in X plus" lists +
a 5-step upgrade timeline + add-ons note + snapshot CTA = a wall to scroll and too many
decisions. Weak hook ("Simple, transparent pricing").

Built a clickable **Artifact preview** first (project convention for visual changes),
approved via AskUserQuestion: **keep the path toggle** (default *Run it yourself*),
hook = **"Start free. Fix your visibility when you're ready."**

**SHIPPED (code-complete, `index.html` + `site.js`; NOT yet uploaded):**
- **Hook header** — gradient headline + risk-reversal subline (free audit first, no
  card, cancel anytime) replacing the generic tagline.
- **Path segmented toggle** (`.mode-switch`, `data-mode="self"|"managed"`) — shows only
  **3 cards at a time** (self-serve vs done-for-you), roughly halving the height and
  turning 6 choices into a binary → 3 tiers. JS lives in `site.js` (guarded on
  `#grid-self`/`#grid-managed`, index-only).
- **Reused the existing billing toggle + Stripe wiring** — cards keep `billing-monthly`/
  `billing-yearly` + `data-checkout`; the billing toggle sets display globally so the
  newly-shown grid already reflects monthly/yearly. **Verified in-browser:** prices
  switch in both grids, `data-checkout` hrefs swap to the annual Stripe URLs, state
  carries across path switches.
- **Featured plan per path** — Growth (self-serve) + Managed (done-for-you), each "⭐
  Most Popular". Condensed feature lists to 3–4 differentiators. Free/Pro/Enterprise
  CTAs are ghost buttons; primary CTAs filled.
- **Conversion glue** — trust strip (50+ brands · no card · cancel anytime · free audit
  first) + "Free AI Visibility Snapshot" fallback for the undecided.
- **Cut** — the 5-step upgrade timeline + separate add-ons note (folded into Pro/
  Enterprise). Old CSS for `.upgrade-timeline`/`.addons-note`/`.pricing-cta-block`/
  `.pricing-group` left in place (unused, harmless — matches prior dead-CSS precedent).
- **Verified:** `node --check site.js` clean; index.html structural check clean (one
  each `</html>`/`</body>`/`</head>`); toggle + billing + Stripe + both views confirmed
  via live browser test + screenshots.

**REQUIRES UPLOAD (2 files):** `index.html` + `site.js`. Live-verify per
`[[brandgeo_verify_cpanel_upload]]` with a cache-buster (toggle the path switch + the
monthly/yearly toggle on the live pricing section).
