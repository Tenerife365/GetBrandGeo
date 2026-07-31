# Competitive teardown + first-five-seconds conversion research

**Run:** 2026-07-28
**Method:** competitor pages fetched over HTTP and parsed from source; every colour
counted from the shipped markup or CSS bundle, converted to OKLCH, and contrast
computed in sRGB relative luminance. No screenshots, no impressions.
**Consumers:** `bg-strategy`, `bg-design`, `bg-copy`.

---

## 1. Who was scraped

Eleven fetched, ten parsed. `otterly.ai` returned 403 to a plain client, so its
numbers below come from secondary sources and are marked as such.

| Company | URL | HTTP | Positioning line |
|---|---|---|---|
| Profound | tryprofound.com | 200 | "Marketing agents to win in AI search" |
| Peec AI | peec.ai | 200 | "AI search analytics for marketing teams" |
| AthenaHQ | athenahq.ai | 200 | "Agents to Win on AI Search" |
| Scrunch | scrunch.com | 200 | "Humans don't visit your website anymore, AI does." |
| Evertune | evertune.ai | 200 | "Own the AI customer journey." |
| Brandlight | brandlight.ai | 200 | "AI Visibility for the World's Leading Enterprises" |
| Conductor | conductor.com | 200 | "Where Enterprises Go to Win AI Search" |
| SE Ranking | seranking.com | 200 | "Don't just track visibility. Validate it." |
| Ahrefs Brand Radar | ahrefs.com/brand-radar | 200 | "See ANY brand's AI visibility" |
| Semrush | semrush.com | 200 | "Your Unfair Advantage for Growing Brand Visibility" |
| Otterly | otterly.ai | 403 | (not parsed) |

### 1.1 The headline pattern

Not one of the ten asks a yes/no question. The verbs are **win** (Profound,
AthenaHQ, Conductor), **own** (Evertune), **validate** (SE Ranking), **see**
(Ahrefs). Scrunch leads with a flat loss statement and no product noun at all.

This is the single most consistent finding in the scrape, and BrandGEO's live
headline was the exception: *"Does AI recommend your brand across Web2 & Web3?"*
is answerable with "probably", and a reader who answers it has no reason to
continue. Changed in `7da5a67` to name the rival rather than ask about absence.

---

## 2. Palettes, counted

Hex frequency from each page's own markup/CSS. OKLCH computed, not eyeballed.

| Company | Canvas | Muted | Primary accent | Counter-accent |
|---|---|---|---|---|
| SE Ranking | `#101423` navy | `#717e95` | `#1b81f7` / `#1863fd` / `#123af8` blue | — |
| Profound | `#1b1b1b` neutral | `#505050` | `#5dabff` pale blue | — |
| Peec AI | `#171717` neutral | `#737373` | `#6b5bff` indigo | `#f96b6b` |
| AthenaHQ | light | — | `#4f39f6` indigo (59 uses) | — |
| Scrunch | `#242220` warm black | — | `#f1e8c7` cream | `#d8fc3b` acid lime |
| Evertune | `#0b2a3f` deep navy | `#69767e` | — | `#f7594e` coral |
| Brandlight | `#05041d` | — | — | — |
| Conductor | `#060606` | — | `#00796c` teal | `#c82e5b` magenta |
| Ahrefs | `#000000` | `#e5e5e5` | `#3a57fc` blue | `#ffb528` / `#f75a03` orange |
| **Linear** (craft ref) | `#08090a` | `#8a8f98` | labels only | — |
| **Cursor** (craft ref) | `#171717` | `#606060` | `#3b82f6` | — |

### 2.1 Three things this settles

**Violet is unoccupied, so BrandGEO keeps it.** Nine of ten sit in blue, indigo,
navy or neutral. The two nearest, AthenaHQ `#4f39f6` and peec.ai `#6b5bff`, are
OKLCH hue 277-281. BrandGEO's `#8b5cf6` is hue 293, clear of that cluster. The
retired `#6c63ff` that 76 pages were still rendering the wordmark in measures hue
**280** — one degree off peec.ai's brand colour. Fixed in `7da5a67`.

**Nobody uses pure black or pure white.** Linear ships `#e4e5e9` 175 times and
`#ffffff` 27. Canvases sit at OKLCH L 14-18%, never 0. BrandGEO was on `#050508`
with `#ffffff` text, a 20.9:1 pair, which is inside the halation range.

**Everyone has a warm counter-accent except BrandGEO.** Ahrefs orange, Evertune
coral, Conductor magenta, Scrunch lime, peec.ai red. BrandGEO had violet plus a
teal, both cool. Added `--warn: #fbbf24` for the loss/risk framing so `--ac2` can
mean nothing but "good".

### 2.2 Typography

IBM Plex Mono (SE Ranking, Scrunch), Fragment Mono (peec.ai), DM Sans
(Evertune), Gelica (Brandlight). **Mono for data labels is the category
convention** and BrandGEO does not currently use it anywhere. Open opportunity,
not yet applied.

---

## 3. Pricing, and the comparison the site never makes

| | Entry | Mid | Top |
|---|---|---|---|
| **Profound** | $99/mo, **ChatGPT only**, 50 prompts, 1 seat | $399/mo, **3 engines**, 100 prompts, 3 seats | Custom, up to 9 engines |
| **Otterly** * | $29/mo, 15 prompts, 4 engines | $189/mo, 100 prompts | $489/mo, 400 prompts |
| **AthenaHQ** | — | ~$300/mo | Custom |
| **Peec AI** | Starter | Pro / Advanced | Enterprise (prices JS-rendered, not captured) |
| **BrandGEO** | **€0** | **€99 / 3 engines**, €299 / **5 engines** | €449, €1,500 managed |

\* Otterly figures are secondary-sourced (403 on direct fetch) and should be
re-verified before being used in public copy.

**The finding worth acting on:** Profound charges **$99 for ChatGPT alone** and
**$399 for three engines**. BrandGEO Essentials is €99 for three engines and
Growth is €299 for five. On engines-per-euro BrandGEO is roughly 4x Profound at
the entry tier and undercuts their mid tier by $100 while shipping two more
engines.

That comparison appears nowhere on getbrandgeo.com. It is the strongest pricing
claim available and it is fully defensible from the competitor's own public page.
**Not yet built** — see actions.

Also note Otterly gates Google AI Mode and Gemini as **paid add-ons**. Growth now
includes Google AI Mode as of `9b6bbe3`, which is a real differentiator against
them specifically.

---

## 4. First impressions: what the literature actually supports

### 4.1 Timing

- **50ms** is enough to form a stable visual-appeal judgement, and 50ms
  judgements correlate highly with 500ms ones (Lindgaard et al. 2006, replicated).
- **Visual complexity and prototypicality both register within 50ms**, complexity
  measurably even at 17ms; prototypicality's effect grows with exposure time.
  **Low complexity + high prototypicality scores highest** (Tuch et al. 2012).
  This is the case *against* an ornate hero and *for* looking like what the
  category looks like. peec.ai is the purest expression of it in this set:
  neutral greys, one accent, nothing else.
- **Nielsen's limits:** 0.1s reads as instantaneous, 1s is the ceiling for
  uninterrupted thought, 10s is the attention limit.

### 4.2 Motion

- Material: **200ms** reference transition, **300ms** between screens; 150-200ms
  for small elements, up to 400ms for large.
- Entering elements want slightly longer than exiting ones. Ease-out for enter,
  ease-in for exit, ease-in-out for state change.
- **Fades are vestibular-safe; slides, rotations, scaling and parallax are not.**
  Roughly 1 in 3 people report motion sensitivity and most never set
  `prefers-reduced-motion`, so the setting under-reports the need.
- One measured case: reducing scroll animations and clarifying hierarchy produced
  a **12% lift in visit-to-lead**. Animated reveals help comprehension but hurt
  when the goal is form submission — which is exactly BrandGEO's hero goal.

Applied: the hero cascade was cut from 2.05s to **0.94s**, under Nielsen's 1s
limit. Ambient loops run 17-22s so they read as atmosphere, not events.

### 4.3 Colour and the CTA

- The CTA colour studies are really **contrast** studies. HubSpot's famous
  red-beats-green-by-21% result is von Restorff isolation, not red.
- Across 2,847 tests, button-colour changes alone average a **2.4% lift**, and
  only once the fundamentals are right.
- **If the primary CTA is under 4.5:1, fix that before testing colours.**
- **86.6%** of 90 top-performing landing pages use white text on a coloured CTA.

Applied: white on `--ac` `#8b5cf6` measured **4.23:1** and failed. Moved to
`--ac-strong` `#7c3aed` at **5.7:1**.

### 4.4 Dark UI

- Pure black plus light text causes **halation**; hardest for the ~30% of people
  with astigmatism, and it smears on OLED. Material recommends `#121212` as the
  baseline dark surface.
- Matches what the reference bundles do in practice: Linear `#08090a`, Cursor
  `#171717`, never `#000`.

### 4.5 Hero content

- For SaaS, a **real product screenshot beats an illustration**, and a *stylised*
  screenshot with the key feature highlighted beats a raw one. Motion helps when
  the product is inherently dynamic.
- **Single-CTA pages convert ~13.5% vs ~10.5% for multi-CTA.**
- A clear value proposition measures **35-40%** better than a vague one.
- B2B SaaS landing pages average **2-5%**; top performers hit **8-15%**.

### 4.6 Speed

- LCP target **2.5s**, INP **<200ms**, CLS **<0.1**.
- ~7% conversion drop per second of delay; 2s vs 4-5s LCP is worth **40-50%** on
  product-page conversion. Only 62% of mobile pages pass LCP.

---

## 5. What shipped, and what did not

**Shipped** (`7da5a67`, `9b6bbe3`, `49c5c72`): the measured palette across all 79
pages, solid text/border tokens, light-mode token fixes on 76 pages that never
had accent overrides, semantic status tokens, the AA-safe CTA fill, wordmark
unification, the motion system, and the headline change. Verified in-browser:
292 text nodes, **0 contrast failures in dark, 0 real failures in light**.

**Not shipped, and each needs a decision:**

1. The Profound price/engine comparison block. Strongest available claim, fully
   sourced, currently absent from the site.
2. Mono for data labels, per the category convention in 2.2.
3. The two uncited hero stats (73%, 4.2x) still need a source or removal.
4. No real named customer testimonial exists. Every competitor surveyed fills
   that slot; BrandGEO cannot without a real one.
5. Otterly's pricing needs a first-party re-check before public use.

---

## 6. Measurement notes for whoever runs this next

**A hidden browser tab does not advance CSS transitions or animations.** Two
separate findings in this session were artifacts of it: light mode appeared
completely broken (107 phantom failures) because `body { transition: background
.3s }` never progressed, and the nav CTA appeared to ignore the theme because its
own `transition: color .15s !important` outranked a `*` override. Disable
transitions at matching specificity, force a reflow, then read.

**A zero-width viewport reports everything as overflowing.** An early reading
claimed horizontal overflow; at a real 1280px viewport there was none. Always
assert `document.documentElement.clientWidth` before trusting layout numbers.

**`scrollWidth` alone is not evidence of overflow.** Attempt a real scroll and
check whether `scrollX` moved.
