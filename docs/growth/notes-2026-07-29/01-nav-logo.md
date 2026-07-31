# 01. Nav logo lockup: mark/wordmark alignment and wordmark typography

Date: 2026-07-29
Page: `brandgeo/web/index.html`
Element: `html > body > nav`, 1905x76 at top 0
Defect as reported: "New Logo and BrandGEO is not aligned, and font of Brand GEO doesn't follow theme guidelines"

**Line numbers in this document were correct at 15:05 on 2026-07-29 and are already
stale once.** `index.html` was edited by another session at 14:57 while this was
being written, which moved the footer block from line 1599 to 1609. Every patch
below is therefore specified as an exact-string find-and-replace, and each target
string was re-verified as occurring **exactly once** in the file after that edit.
Apply by string, not by line.

---

## Verdict up front

| Complaint | Status | Cause |
|---|---|---|
| Mark and wordmark not aligned | **Confirmed, 3.19px at nav scale** | Today's asset swap moved the mark's ink 12.15% of its own height downward inside an unchanged CSS box. Not the aspect ratio. |
| Wordmark font not on theme | **Partly confirmed** | The typeface is correct (Inter, the theme UI face). The `.geo` colour treatment is hardcoded, runs the wrong direction for the dark theme, and has no light-mode counterpart. |

Two premises in the brief turned out to be wrong and are addressed in place:
the aspect ratio is not the mechanism (§3.4), and the signed-off vector does not
rescue the alignment because it encodes the same rule that fails (§3.5).

---

## 1. Current markup and CSS

### 1.1 Nav markup, `index.html:2036` to `:2039`

```html
<nav>
  <a href="/" class="logo">
    <img src="logo-nav.png" alt="BrandGEO" style="height:32px;width:auto;display:block;">
    <div class="logo-text"><span class="brand">Brand</span><span class="geo">GEO</span></div>
  </a>
```

### 1.2 Nav CSS, `index.html:290` to `:312`

```css
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 40px;
      border-bottom: 1px solid var(--bd);
      position: sticky;
      top: 0;
      background: var(--nav);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 100;
    }
    /* Padding brings the nav controls to the same 44px hit-target floor as
       every other control on the page. */
    .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; padding: 6px 0; }
    .logo-text { font-size: 1.15rem; font-weight: 800; letter-spacing: -.4px; line-height: 1; color: var(--t); }
    .logo-text .geo {
      background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
```

Body sets `font-family: 'Inter', system-ui, sans-serif` at `:243`, inherited by
`.logo-text`. No `@media` rule on this page touches `nav`, `.logo` or
`.logo-text`, so the lockup is identical at every viewport width.

### 1.3 Footer, `index.html:1608` to `:1609` and `:2808` to `:2810`

```css
    .footer-brand .footer-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .footer-logo-text { font-size: 1.1rem; font-weight: 800; line-height: 1; color: var(--t); }
```

```html
      <div class="footer-logo">
        <img src="logo-nav.png" alt="BrandGEO" style="height:28px;width:auto;display:block;">
        <div class="footer-logo-text"><span class="brand">Brand</span><span class="geo">GEO</span></div>
      </div>
```

Note the selector: the gradient rule is `.logo-text .geo`. The footer container is
`.footer-logo-text`, a different class, so **the footer's "GEO" receives no
gradient at all on this page** and renders in flat `var(--t)`. See §5.2.

---

## 2. The asset, measured

Alpha scan of `brandgeo/web/logo-nav.png` and of its predecessor recovered from
`git show e827fa0^:brandgeo/web/logo-nav.png`.

| | Previous mark | Current mark (shipped today, `e827fa0`) |
|---|---|---|
| Frame | 96 x 140 | 225 x 288 |
| Frame aspect w/h | 0.6857 | 0.7813 |
| Ink bounding box | x 1..95, y 0..129 | x 0..224, y 0..287 |
| Transparent padding | L1 R0 **T0 B10** | **zero on all four sides** |
| Bowl starts, as % down the ink | 20.8% | 31.9% |
| Bowl height, as % of ink | 63.1% | 67.0% |
| **Ink centroid vs frame centre** | **3.07px ABOVE** (2.19% of frame height) | **28.67px BELOW** (9.96% of frame height) |

The mark is a lowercase-b letterform: a rounded ascender stem on the left, a bowl
with a counter on the lower right. Confirmed against the vector source
`docs/growth/brand-identity-2026-07-29/v3/logo-full.svg:28-31`, where the stem is
`M156 116V388` and the bowl is `circle cx=272 cy=304 r=84`, both at
`stroke-width="56"` with round caps. That gives a stroked extent of y 88..416 for
the stem and y 192..416 for the bowl, so the bowl occupies 68.3% of the height
starting 31.7% down. The PNG measures 67.0% starting 31.9%. The raster is faithful
to the vector.

---

## 3. Complaint 1: the misalignment

### 3.1 The wordmark side is not at fault

`.logo-text` has `line-height: 1` and `font-size: 1.15rem` (18.4px). For Inter, the
cap-band centre inside such a line box is:

```
capCentre = halfLeading + ascender - capHeight/2
          = (1 - 1.2100)/2  +  0.9688  -  0.7275/2      [em, Inter 4: asc 1984/2048, desc 494/2048, cap 1490/2048]
          = -0.1050 + 0.9688 - 0.3638
          =  0.5001em
```

The line box centre is 0.5000em. **The cap band of "BrandGEO" is centred in its own
box to within 0.0001em**, which is 0.002px at 18.4px. So `align-items: center` on
`.logo` puts the wordmark's cap band exactly on the flex line's centre line, and
100% of the visible error is on the mark side.

(This result depends on Inter using its hhea/win metrics, 1984/-494. Inter 4
unified typoAscender to 1984 so the two agree, which is where the well known
"Inter default line-height 1.21" comes from. If the served build instead exposes
typo metrics of 1536/-512, the cap band sits 0.114em, that is 2.09px, above the box
centre and the correction value in §4 changes from -3px to -5px. §6 gives a
two-line browser test that settles this in one run. No Inter binary exists in this
repo to read directly, so this is the one number below that is derived rather than
measured.)

### 3.2 The mechanism

**Both boxes are centred by geometry, but the mark's ink is not centred inside its
own box.** The mark's frame is exactly its ink, zero padding, and an ascender-bearing
letterform puts two thirds of its mass in the bowl at the bottom. Its ink centroid
therefore sits 9.96% of its height below its frame centre. `align-items: center`
centres the frame, so the visual mass lands low.

At the nav's `height:32px`:

```
mark frame centre     16.00px from the top of the 32px flex line
mark ink centroid     19.19px          (16.00 + 0.0996 x 32)
wordmark cap centre   16.00px          (per 3.1)
--------------------------------------------------------------
mark reads            3.19px LOW
```

3.19px against a 13.39px cap height is a 24% displacement of the mark relative to
the letterforms it sits beside. That is comfortably above the threshold at which a
lockup reads as broken.

### 3.3 Why it did not look wrong yesterday

The CSS did not change. The asset did.

| At `height:32px` | Ink centroid vs box centre |
|---|---|
| Previous mark | 0.70px **above** |
| Current mark | 3.19px **below** |
| **Swing from today's swap** | **3.89px downward** |

Two changes stacked in the same direction. First, the old frame carried 10px of
empty space below the ink, 7.1% of its height, which lifted the ink inside a
centred box. That padding is gone. Second, the ascender got proportionally longer,
so the bowl now starts 31.9% down instead of 20.8%, moving the mass further toward
the bottom. Neither is visible in the file listing; both are visible in the nav.

### 3.4 The aspect-ratio hypothesis is not the mechanism

The brief flagged the aspect change as a plausible cause. The aspect did change,
0.6857 to 0.7813, a 14% widening, and at `height:32px` the rendered width went from
21.9px to 25.0px. But `width:auto` against a fixed `height` means aspect governs
**width only**. It cannot move anything vertically. The vertical error comes
entirely from the two redistributions in §3.3. Correcting the aspect would not move
the mark up by a single pixel.

### 3.5 The signed-off vector does not settle it either

`docs/growth/brand-identity-2026-07-29/v3/logo-full.svg` is the approved horizontal
lockup. Its geometry:

- mark occupies y 22..182 in a 200-unit viewBox, so its **frame centre is 102.0**
- wordmark is `<text x="215" y="132" font-size="94">`; SVG `y` is the alphabetic
  baseline, so cap top is `132 - 0.7275 x 94 = 63.6` and the **cap centre is 97.8**
- the mark's ink centroid lands at `22 + 0.5996 x 160 = 117.9`, which is **20.1
  units, or 12.6% of the mark's height, below the cap centre**

So the vector centres the mark's *frame* on the wordmark's cap band, 4.2 units
apart on a 160-unit mark. That is the same rule the CSS implements, and it carries
the same latent error. **The vector is not an authority for fixing this**, because
it has the defect too. The fix below is an optical correction on top of the
approved lockup, not a departure from it.

---

## 4. Complaint 2: the typography

### 4.1 The typeface is correct, so if that is the complaint the premise is wrong

`.logo-text` inherits `font-family: 'Inter', system-ui, sans-serif` from `body`
(`index.html:243`). Inter is the theme's UI and body face, loaded at `:123` and
documented at `:114-117` as the deliberate choice for all 82 pages as of today.
Instrument Serif is scoped to the hero `h1` only (`:535`) and has no business in a
nav. Nothing about the family violates the theme.

The signed-off vector says `font-family="Geist, Inter, system-ui, ..."`, Geist
first. **That vector is stale, not the HTML.** The site moved off Geist to Inter
today, for the reason recorded at `index.html:114-117` (this page was the only one
of 82 loading Geist). Flagging for the brand-kit owner: `logo-full.svg` should be
updated to name Inter first. That file is outside this spec's write scope.

### 4.2 What does violate the theme: the `.geo` colour treatment

The `:root` block states the rule for accent colour in its own comment at `:186-188`:

> `--ac` is 4.65:1 and is a FILL behind white button text; `--ac-text` is 7.23:1 and
> is what accent WORDS use.

"GEO" is an accent word. Here is what it actually gets, contrast computed against
`--bg` per WCAG 2.x relative luminance, not asserted:

| | start | midpoint | end |
|---|---|---|---|
| **Current, dark** (`#8B5CF6` to `#6D28D9`) | `#8B5CF6` 4.65:1 | `#7C42E7` 3.55:1 | `#6D28D9` **2.77:1** |
| **Current, light** (same, no override) | `#8B5CF6` **3.97:1** | `#7C42E7` 5.19:1 | `#6D28D9` 6.65:1 |

Four separate faults:

1. **The gradient runs the wrong way for a dark theme.** It starts at `--ac` and
   descends into `#6D28D9`, which is the *light*-mode value of `--ac-text` and
   `--ac-strong`. On the dark canvas the final "O" lands at 2.77:1, against a
   documented accent-word target of 7.23:1.
2. **The approved lockup does the opposite.** `logo-full.svg:17-21` defines
   `geoGrad` as `#8B5CF6` to `#A78BFA`, which is exactly `--ac` to `--ac-text` in
   dark. The HTML inverted the direction of the signed-off gradient.
3. **The stops are hardcoded hexes, so light mode cannot reach them.** The
   2026-07-28 colour pass converted alpha tokens to solid values specifically so
   every colour could be contrast-checked and given a light counterpart. This rule
   was missed: there is **no `[data-theme="light"]` override of `.logo-text .geo`
   in any of the 76 files that carry it**. In light mode the gradient therefore
   begins at `#8B5CF6`, which the `:root` light comment at `:220-221` describes
   verbatim as "only 3.97:1 on #f7f7fc and fails as text". My independent
   computation returns 3.97:1, matching that comment exactly.
4. **`Brand` is correct and `GEO` is not**, which is why the complaint names the
   two halves separately. `.logo-text { color: var(--t) }` gives `Brand` 16.22:1 in
   dark and 18.59:1 in light, and matches the vector's `#E8E9ED` for that span.

**Honest scoping on WCAG:** SC 1.4.3 carries an explicit logotype exception, "text
that is part of a logo or brand name has no contrast requirement". None of the
above is a formal WCAG failure and it should not be reported as one. It is a
legibility and theme-consistency defect measured against the project's own stated
rule. Separately, at 18.4px the wordmark is 13.8pt, just under the 14pt-bold large
text threshold of 18.667px, so if the exception did not apply the bar would be
4.5:1, not 3:1.

### 4.3 The fix is a tokenized gradient that is correct in both themes

Replacing the stops with `var(--ac)` and `var(--ac-text)` reproduces the approved
vector exactly in dark and inverts correctly in light with **no `[data-theme]`
override needed**, because the tokens already invert:

| | start | midpoint | end |
|---|---|---|---|
| **Proposed, dark** (`--ac` `#8b5cf6` to `--ac-text` `#a78bfa`) | 4.65:1 | `#9973f8` 5.77:1 | **7.23:1** |
| **Proposed, light** (`--ac` `#7c3aed` to `--ac-text` `#6d28d9`) | 5.34:1 | `#7431e3` 5.98:1 | **6.65:1** |

Every point along the gradient clears 4.5:1 in both themes, the dark endpoint hits
the documented 7.23:1 accent-word target, and it is byte-equivalent to the
signed-off `geoGrad` in dark mode.

---

## 5. Patch blocks

All four apply with a literal find-and-replace. Indentation is significant and is
reproduced exactly. Each FIND string was verified to occur **exactly once** in
`brandgeo/web/index.html` and, where noted, zero or one times across the other 81
pages.

### Patch 1 of 4. Optical correction for the nav mark

Occurrences of the FIND string: 1 in `index.html`, 0 elsewhere in `brandgeo/web/`.

FIND:
```
    .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; padding: 6px 0; }
```

REPLACE:
```
    .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; padding: 6px 0; }
    /* Optical, not geometric, centring. logo-nav.png is a lowercase-b letterform
       cropped to zero padding, so its ink centroid sits 9.96% of its height below
       its frame centre (measured by alpha scan: 28.67px of 288). align-items
       centres the FRAME, which lands the visual mass 3.19px low at height:32px.
       The mark this replaced on 2026-07-29 carried 10px of empty frame below its
       ink and sat 0.70px HIGH, which is why nothing looked wrong before the swap.
       transform is layout-neutral, so the nav's height is untouched. Integer px
       rather than translateY(-10%) keeps the 25px-wide raster on the pixel grid. */
    .logo img { transform: translateY(-3px); }
```

### Patch 2 of 4. Tokenize the `.geo` gradient and reverse its direction

Occurrences of the FIND string: 1 in `index.html`, 0 elsewhere (the other 75 pages
carry the same declaration on a single line, so this multi-line form is unique).

FIND:
```
    .logo-text .geo {
      background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
```

REPLACE:
```
    /* --ac to --ac-text, which is the direction logo-full.svg's geoGrad specifies
       (#8B5CF6 to #A78BFA) and the direction :root demands: --ac is a FILL, and
       --ac-text is what accent WORDS use. The old stops were hardcoded and ran the
       other way, ending on #6D28D9, the LIGHT-mode value, at 2.77:1 on --bg. As
       tokens this needs no [data-theme="light"] counterpart: light resolves to
       #7c3aed to #6d28d9, 5.34:1 to 6.65:1. Dark is 4.65:1 to 7.23:1. Every point
       on both gradients clears 4.5:1. */
    .logo-text .geo {
      background: linear-gradient(135deg, var(--ac) 0%, var(--ac-text) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
```

### Patch 3 of 4. Same optical correction in the footer

Occurrences of the FIND string: 1 in `index.html`, 0 elsewhere.

FIND:
```
    .footer-logo-text { font-size: 1.1rem; font-weight: 800; line-height: 1; color: var(--t); }
```

REPLACE:
```
    .footer-logo-text { font-size: 1.1rem; font-weight: 800; line-height: 1; color: var(--t); }
    /* Same 9.96% centroid correction as .logo img. At height:28px the ideal is
       -2.79px; -3px, matching the nav, is 0.21px off and stays on the pixel grid. */
    .footer-logo img { transform: translateY(-3px); }
```

### Patch 4 of 4, optional and independently applicable. Give the footer wordmark its gradient

The gradient selector is `.logo-text .geo`. The footer's container is
`.footer-logo-text`, so on this page the footer "GEO" renders in flat `var(--t)`
while the nav "GEO" is a gradient, on the same page. `blog.html:136` already has
the missing rule; `index.html` does not. Apply this only if the intent is that the
two lockups match, which the signed-off vector implies. Skipping it changes
nothing that is currently broken, it only leaves the inconsistency in place.

Occurrences of the FIND string: 1 in `index.html`. Note this FIND is the **output
of Patch 3**, so apply Patch 3 first.

FIND:
```
    .footer-logo img { transform: translateY(-3px); }
```

REPLACE:
```
    .footer-logo img { transform: translateY(-3px); }
    /* .logo-text .geo does not match .footer-logo-text, so without this the footer
       wordmark's GEO renders flat while the nav's is a gradient. blog.html:136
       already carries the equivalent rule. */
    .footer-brand .footer-logo-text .geo {
      background: linear-gradient(135deg, var(--ac) 0%, var(--ac-text) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
```

### If the browser test in §6 returns typo metrics

Then the wordmark's cap band sits 2.09px above its box centre and both `-3px`
values become `-5px` (nav) and `-5px` (footer, ideal -4.79px). Change the two
numerals only; nothing else in the patches moves.

### If the owner prefers the pre-2026-07-29 feel

`-4px` in the nav reproduces the previous mark's optical position to within 0.11px.
That position was 0.70px above true optical centre. `-3px` is the principled value;
`-4px` is the nostalgic one. Recommend `-3px`.

---

## 6. Verification

Layout invariance, which should be checked first because it is the only thing that
could regress anything outside this lockup. `transform` never contributes to layout,
so the nav's 76px height cannot change. Supporting arithmetic: the nav's flex line
is set by `.nav-cta` at 46.53px (22.53px line box, 22px padding, 2px border), not by
the 44px logo lockup, so the logo had 2.5px of vertical slack even before the
transform. There is no `overflow: hidden` on `nav`, `footer`, `.footer-grid` or
`.footer-brand`, so the 3px of overhang cannot clip.

Settle the Inter metric question in one run, in the console on the built page:

```js
const c = document.createElement('canvas').getContext('2d');
c.font = '800 18.4px Inter';
const m = c.measureText('B');
console.log(m.fontBoundingBoxAscent / 18.4, m.fontBoundingBoxDescent / 18.4);
// ~0.969 / ~0.241  -> hhea metrics, -3px is correct
// ~0.750 / ~0.250  -> typo metrics, use -5px
```

Then confirm the result visually:

```js
const i = document.querySelector('nav .logo img').getBoundingClientRect();
const t = document.querySelector('nav .logo-text').getBoundingClientRect();
console.log('mark box centre', i.top + i.height / 2, 'cap centre', t.top + t.height / 2);
// after Patch 1 these should differ by about 3px, the mark being the higher number's
// complement: the mark's BOX is now 3px high so that its INK lands on the cap centre.
```

Check both themes. The theme toggle persists to storage, so reset it after.

---

## 7. Does the footer need the same treatment

**Yes for the alignment, and the value is the same.** The footer lockup is the same
construction at a different scale: `align-items: center`, `line-height: 1`, Inter,
`height:28px`. Cap centre lands at 14.00px, exactly the 28px line centre, by the
same 0.5001em identity as §3.1. Required correction is 9.96% of 28 = 2.79px, which
rounds to the same -3px. Patch 3 covers it.

**Yes for the colour too, but as a separate decision**, because the footer's "GEO"
is not currently a gradient at all on this page. Patch 4 covers it and is explicitly
optional.

Note the footer mark is the same `logo-nav.png` at `height:28px`, so nothing about
the asset differs.

---

## 8. Deliberately not changed

1. **The mark itself.** Signed off today, out of scope, and not the problem. Every
   correction above is a CSS offset applied to an unmodified asset.
2. **`font-weight: 800`.** The vector says 700. The only authority for that number
   is `logo-full.svg`, whose font stack names **Geist first** and which predates
   today's move to Inter. Geist 700 and Inter 700 are not the same weight on the
   page, so transplanting the numeral is not "following the guideline", it is
   applying a value chosen for a different face. Correct sequence is to fix the
   vector's font stack (§4.1) and re-derive the weight against Inter, which is a
   brand-kit task, not an `index.html` task.
3. **`letter-spacing: -.4px`.** Two things are true and neither justifies a change
   here. It is one of only three px-based tracking values on a page whose scale is
   otherwise em (18 of 22 declarations), so it does not scale with the root font
   size. And at 18.4px it works out to -0.0217em against the vector's -0.0319em, so
   the wordmark is 47% looser than the approved lockup. The exact-equivalent
   normalization is `-.02em`, a 0.03px visual delta, but that line is shared
   verbatim with 53 other pages and diverging it for 0.03px is a bad trade while
   several sessions are editing this file. Roll it into the site-wide `.logo-text`
   pass instead. The vector's -0.0319em has the same Geist problem as the weight.
4. **The 135deg gradient angle.** The vector's `geoGrad` vector is (170, 80), which
   is 115.2deg in CSS terms. Over three glyphs the difference is not resolvable, and
   135deg is what all 76 pages carry. Changing it buys nothing and costs
   consistency.
5. **A `forced-colors` fallback for the gradient text.** `-webkit-text-fill-color:
   transparent` plus `background-clip: text` means "GEO" disappears entirely in
   Windows High Contrast, where the background is stripped and the fill stays
   transparent. Real, but pre-existing on 76 pages and not part of either reported
   complaint. One-line fix if wanted:
   `@media (forced-colors: active) { .logo-text .geo { background: none; -webkit-text-fill-color: currentColor; } }`
6. **The other 81 pages.** Out of write scope. Values are in §9 so the rollout does
   not have to re-derive them.
7. **`logo-full.svg`.** Its Geist-first stack and its own frame-centred lockup both
   want fixing, but it is a brand-kit artifact, not a web file.

---

## 9. Blast radius

Counted, not assumed, across `brandgeo/web/**/*.html`.

**82 HTML files** (79 at the top level, 3 under `news/`). **79 carry
`logo-nav.png`**; the three that do not are `article-builder.html` (internal tool,
excluded from the cPanel upload), `privacy.html` and `thanks.html`.

**Every string this spec patches is unique to `index.html`:**

| Patch target | Occurrences in `brandgeo/web/` |
|---|---|
| `.logo { ... padding: 6px 0; }` | **1** (index.html only; the other 78 lack the padding) |
| multi-line `.logo-text .geo { ... }` block | **1** (the other 75 are single-line) |
| `.footer-logo-text { font-size: 1.1rem; ... }` | **1** |
| `.footer-brand .footer-logo-text .geo` | **1**, and it is `blog.html`, not `index.html` |

**What is shared and therefore still broken after this patch:**

- **76 pages carry the wrong-direction hardcoded `.geo` gradient**, 75 of them in a
  single-line form. **Zero pages anywhere have a `[data-theme="light"]` override for
  it.** Patch 2 fixes one page. The single-line rollout string is:
  `.logo-text .geo { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }`
- **The alignment error is on all 79 pages**, at four different mark heights. The
  correction is 9.96% of the rendered height:

  | Mark height | Pages | Ideal | Use |
  |---|---|---|---|
  | 28px | 1 (index.html footer) | -2.79px | -3px |
  | 30px | 53 | -2.99px | -3px |
  | 32px | 6 (incl. index.html nav) | -3.19px | -3px |
  | 36px | 21 | -3.58px | -4px |

  Caveat for the rollout: those pages use two different `.logo-text` sizes (1.15rem
  on 54 pages, 1.3rem on 24, 1.2rem on 1) and two different img tag forms
  (`src="logo-nav.png" alt="BrandGEO"` on 55, `src="/logo-nav.png" alt="BrandGEO icon"`
  on 26). The 0.5001em identity in §3.1 is size-independent, so the correction stays
  9.96% of the mark height regardless of the wordmark size. But a `.logo img`
  selector must be checked against pages whose `.logo` block differs.

- **After Patch 1, `index.html`'s `.logo` block no longer matches the other 78.** It
  already did not (only index.html has `padding: 6px 0`), so this adds no new
  divergence, but the site-wide `.logo` rollout string remains
  `.logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }`
  and will need the img rule appended separately.

**Nothing else on the page depends on these selectors.** No `@media` rule on
`index.html` targets `nav`, `.logo` or `.logo-text`. `.logo img` and
`.footer-logo img` each match exactly one element. `transform` is layout-neutral, so
no downstream geometry moves.
