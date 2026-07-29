# BrandGEO brand kit, 2026-07-29

Built from the two usable source rasters in this repo. 108 PNG/ICO files, 5 SVG
files, 10 extracted master PNGs, and 4 reproducible build scripts.

---

## Read this first: the source raster is too small to build a full brand system from

**The mark exists at exactly one usable resolution: 397 x 563 pixels.** Every
other copy in the repo is that same art, either identical or smaller. There is
no larger original anywhere, and no design file.

That number sets a hard ceiling on everything:

| asset | native size | largest honest export | what is out of reach |
|---|---|---|---|
| mark | 401 x 567 | 512px square icon, 567px tall free-standing | 1024px square (needs 840px of art, a 1.48x upscale), any print use above about 48mm at 300dpi |
| wordmark | 1033 x 172 | 1033px wide | 2048px wide (1.98x upscale) |
| lockup, mark + wordmark | 1033 x 808 | 1033px wide | anything above 1033px |
| lockup with tagline | 1033 x 890 | 1033px wide | anything above 1033px |

23 requested exports were refused by the build because they would have upscaled.
They are listed in full at the end of this file. Nothing in this kit is
upscaled, and the build script enforces that with an assertion rather than a
convention, so it cannot drift.

Practical consequences the owner should plan around:

- **Anything printed larger than a business card is not covered.** A trade show
  banner, a pull-up stand, a vehicle wrap or a conference backdrop all need real
  vector artwork this kit cannot honestly supply for the wordmark.
- **The 1024px app-store icon slot cannot be filled.** iOS App Store and several
  Android listings require 1024x1024. The largest honest square here is 512.
- **A partner or press "high resolution logo pack" request cannot be met** with
  the lockup, which tops out at 1033px wide.

---

## 1. What the source files actually are

Measured, not assumed. My brief's labels were partly wrong and the corrections
matter.

| file | measured | what it really is |
|---|---|---|
| `marketing/logo.png` | 1254x1254, RGB, no alpha | **Full lockup on a white page**: mark, "BrandGEO" wordmark, and the tagline "BE THE ANSWER. BE EVERYWHERE." Ink occupies only 1021x881 of the 1254 square. 86% of the image is background. |
| `brandgeo/web/logo.png` | 424x618, RGBA | Mark only. Trimmed content is 397x563. |
| `marketing/logo only symbol.png` | 424x618, RGBA | **Byte identical** to the file above, MD5 `f3bd7db92fbcf753c9f12375721c5e74`. One file, stored twice. |
| `marketing/google-business-profile-2026-07-15/gbp-logo-720-transparent.png` | 720x720, RGBA | The same mark, **downscaled** to 335x475 content. Lower resolution than the 424x618 source, so it is a derivative, not an original. |
| `brandgeo/web/logo-nav.png` | 96x140, palette, 50 colours | Heavily quantised nav thumbnail. Not a source. |
| `brandgeo/web/favicon.ico` | 16x16 only | Single resolution. Replaced by this kit's multi-resolution `favicon.ico`. |

### Correction to the brief: SVGs do exist, but not of the logo

`brandgeo/web/favicon.svg` and `brandgeo-dashboard/public/favicon.svg` are real
SVG files. They are **not** the logo. Each is a rounded square containing the
letter `B` set in `'Segoe UI', system-ui, Arial, sans-serif`, filled with a
gradient from `#6c63ff` to `#00d4aa`.

Two things are wrong with them and both are live:

1. **Neither colour is in the brand palette.** `#00d4aa` is teal. `CLAUDE.md`
   §4.2 forbids teal as a brand colour, and the light-theme token block in
   `index.html` explicitly records replacing `#00d4aa` because it measured
   1.79:1. This favicon is the last place that retired teal still ships.
2. **It is a letter `B` in a system font, not the mark.** The actual logo is a
   lowercase `b` built as a location pin with an eye in it. The favicon shares
   no geometry with it.

This kit's `favicon/` directory replaces both.

### The mark, described from measurement

A lowercase `b` drawn as a map pin. The bowl is a large rounded mass that tapers
to a point at the bottom. A stem rises on the left. Set into the bowl is an eye:

- **eye ring**: an axis-aligned **ellipse**, 231 x 241 pixels, centre (200.5,
  310.5), rx 115.5, ry 120.5. It is measurably not a circle. A least-squares
  circle fit leaves a 26px residual; the ellipse is exact to the region extent.
- **pupil**: a **true circle**, r 64.42, centre (195.88, 310.20), fill `#061133`.
  Circle-fit residual 0.38px mean, 1.67px max.
- The pupil sits about **4px left of the ring centre**, which is what makes the
  ring read visibly thicker on its right side. This is deliberate and is
  preserved in every asset here.

### The mark's colours are not the brand's colours

| where | measured | brand token |
|---|---|---|
| mark, dominant blue | `#1a5af7`, `#0a52fd` | none |
| mark, violet band | `#5f27fc` | closest is `--ac` `#8b5cf6` |
| mark, darkest navy | `#032578` | none |
| `--ac` (site) | | `#8b5cf6` |
| `--ac-strong` (site) | | `#7c3aed` |

The logo sits at roughly hue 250 to 265 (blue-violet). The site's `--ac` is at
hue 293. **They are not the same family and the difference is visible when the
logo is placed next to a violet button.** This is a brand decision, not a bug,
and it is not mine to make. Flagging it because the site's own research doc
argues the violet at hue 293 is a deliberate competitive position, and the logo
is not participating in it.

### The typeface is unknown

The site body font is declared as `Geist` in `brandgeo/web/index.html`. I have
**not** claimed the wordmark is set in Geist, because I cannot verify it: there
is no font file in the repo, and the wordmark exists only as pixels. It is a
heavy geometric sans with a double-storey `a` and a straight-legged `R`, but
naming a specific typeface from a 172px-tall raster would be a guess. Do not let
anyone put a font name in a brand guideline on the strength of this kit.

---

## 2. Was an SVG master achieved? Partly, and the honest split matters

### The outline: yes, and it is genuinely clean

**48 nodes. 2.1 KB. Measured IoU 0.9935 against the source alpha, mean boundary
deviation 0.757px, max 8.5px, 946 mismatched pixels out of 144,693.**

No tracer was available. `potrace`, `inkscape`, `autotrace` and ImageMagick are
all absent from this machine. `pip install vtracer` succeeds but the wheel
segfaults on this Python 3.14 build with Windows access violation `0xC0000005`,
under both bash and PowerShell. So `build/vectorise.py` implements the trace:
Moore-neighbour boundary trace, Chaikin corner cutting to kill the pixel
staircase, Ramer-Douglas-Peucker, then Schneider's least-squares cubic Bezier
fit with Newton-Raphson reparameterisation and corner-aware segmentation.

Two things in that pipeline were bugs worth recording, because both produced
results that looked plausible and were not:

- Schneider's published algorithm only guards against **negative** tangent
  magnitudes. Unbounded positive ones put control points far outside the convex
  hull, which renders as a self-intersecting loop, which then fills under
  even-odd rules and punches a hole. The symptom was that **IoU got worse as
  node count went up**, which is the opposite of how a fit should behave.
  Clamping alpha to 1.5 chord lengths fixed it: 0.9799 to 0.9955 at the same
  tolerance.
- The pin's inner notch, where the stem meets the bowl, is a cusp. A smooth
  cubic cannot follow it and it cost 9.6px. Breaking the contour at detected
  corners before fitting took it to 7.2px. It is now the single worst point on
  the outline and it is a sliver a few pixels wide.

The eye is **not** traced. The ellipse and circle are fitted algebraically and
emitted as `<ellipse>` and `<circle>`. Tracing a circle is how you get a 400
node blob nobody can edit.

### The colour fill: no, and no amount of effort would fix it from this source

**The mark's fill cannot be reproduced by any linear or radial gradient, and I
can show that rather than assert it.**

I swept all 180 axis angles, fitting a 24-bin median colour profile at each and
measuring reconstruction error. The best linear model lands at 144 degrees with
**mean RGB error 33.6 out of a possible 441**, p95 82.5. A radial model is far
worse at 65.5. The reason is visible in the data: at a fixed position along the
best axis the colour is **bimodal**. Bin 14 has a 10th percentile of `#091af1`
(blue) and a 90th percentile of `#7753fd` (violet) at the same projection. Two
colour populations occupy the same coordinate, and a gradient is a function, so
it cannot represent both.

I then tested whether the violet is a separable second shape that could be
emitted as its own path. It is not. Thresholding the purple hue yields a
diagonal band with ragged, dithered edges, which is the signature of a
continuous ramp crossing a threshold rather than a hard shape boundary.

The conclusion is that the artwork is a **mesh gradient or a stack of
overlapping gradient-filled shapes**, most likely a blue letterform and a violet
pin composited together. That structure lives in a design file. It is not
recoverable from a flattened raster.

`brandgeo-mark.svg` therefore ships with the approximation labelled in an XML
comment inside the file itself, with the measured error, so nobody downstream
mistakes it for a faithful master. **The violet band is visibly lost in it.**

### What the owner must do to close the gap

In order of how much it buys:

1. **Find the original design file.** The lockup is a rendered composition and
   something produced it: an Illustrator `.ai`, a Figma frame, a Canva design,
   or an AI image-generator output. If it is Figma or Illustrator, exporting SVG
   takes one menu item and makes this entire section obsolete. Check the Canva
   account first, since `marketing/` already contains Canva-shaped exports.
2. **If there is no design file, commission a redraw.** A designer redraws the
   mark as vector shapes with the real gradient structure, and sets the wordmark
   in its actual typeface. This is a few hours of work, not a project. Give them
   `source-art/lockup-full-light.png` from this kit, which is the cleanest
   extraction of the original that exists.
3. **If you want to try tracing yourself first**, the exact commands, on a
   machine where these install cleanly:

   ```
   # Option A, potrace. Best quality outlines, single colour only.
   #   Windows: download potrace from https://potrace.sourceforge.net/#downloading
   magick docs/growth/brand-kit-2026-07-29/source-art/mark-eye.png -alpha extract -threshold 50% mark.pbm
   potrace mark.pbm --svg --alphamax 1.0 --opttolerance 0.2 -o mark-traced.svg

   # Option B, vtracer CLI. Handles colour, but see the caveat below.
   cargo install vtracer
   vtracer --input source-art/mark-eye.png --output mark-colour.svg --mode spline --color_precision 6

   # Option C, Inkscape GUI. Path > Trace Bitmap, Multicolour, 8 scans.
   ```

   **Do not expect option B or C to solve the gradient.** They will posterise it
   into 6 to 12 flat colour layers stacked on top of each other. That is a
   different artefact, not a fix. My own 6-colour k-means test on this artwork
   reaches mean error 16.0, better than the gradient's 33.6 but at the cost of
   visible banding and a dozen stacked paths. If flat posterisation is
   acceptable to you, say so and it can be generated; I did not ship it because
   it is worse as a master than the honest 48-node outline.

---

## 3. Light backgrounds, and one real problem on dark

Everything in this kit was checked against `#ffffff`, `#f7f7fc` (the site's
`--bg` in light theme) and `#0a0b0e` (`--bg` in dark theme).

| colour | role | vs `#ffffff` | vs `#f7f7fc` | vs `#0a0b0e` |
|---|---|---|---|---|
| `#1a5af7` | mark blue, dominant | 5.46:1 | 5.11:1 | **3.61:1** |
| `#0a52fd` | mark blue, bright | 5.77:1 | 5.41:1 | **3.41:1** |
| `#5f27fc` | mark violet | 6.60:1 | 6.18:1 | **2.98:1** |
| `#032578` | mark navy, darkest | 13.64:1 | 12.77:1 | **1.44:1** |
| `#ffffff` | eye ring | 1.00:1 | 1.07:1 | 19.68:1 |
| `#061133` | eye pupil | 18.49:1 | 17.31:1 | 1.06:1 |
| `#050e25` | wordmark "Brand", light theme | 19.16:1 | 17.94:1 | 1.03:1 |
| `#e8e9ed` | wordmark "Brand", dark theme (`--t`) | 1.21:1 | 1.14:1 | 16.22:1 |
| area-weighted mark mean `#2543d9` | | **7.23:1** | | **2.72:1** |

### Does the mark hold on white? Yes.

Area-weighted contrast is 7.23:1 and every structural colour clears 4.5:1. The
white eye ring measures 1.00:1 against white and therefore disappears, but that
is the design as drawn: the ring is fully enclosed by the blue bowl and the
pupil sits at 18.49:1, so the eye still reads as a dark disc inside a blue
annulus. This is how the original lockup was composed, on a white page. **The
mark is a light-background design.**

### Does it hold on the dark canvas? Not entirely, and this is a finding.

- Area-weighted contrast on `#0a0b0e` is **2.72:1**, under the 3:1 that WCAG
  1.4.11 asks of non-text graphics.
- The darkest navy region, `#032578`, measures **1.44:1**. On the dark canvas
  the lower-left mass of the mark visibly merges into the background. The
  silhouette loses its bottom-left weight.
- `#5f27fc`, the violet, is **2.98:1**, fractionally under the line.

Two mitigations ship in this kit:

- `svg/brandgeo-mark-mono-light.svg` fills the whole silhouette with `--t`
  `#e8e9ed`, measuring 16.22:1 on the canvas. Use it wherever the mark must
  survive on dark: small UI chrome, footers, dark email headers.
- The `png/mark/*-canvas-*` and `png/mark-square/*-canvas-*` families composite
  onto `#0a0b0e` so the result is at least predictable, but they cannot raise
  contrast the artwork does not have.

### The as-authored transparent mark is a light-background asset, not a universal one

`brandgeo/web/logo.png` has the eye **knocked out**: the ring is transparent, not
white. Placed on white that reproduces the original design exactly. Placed on
the dark canvas, the ring goes black and the `#061133` pupil sits at 1.06:1
against `#0a0b0e`, so **the entire eye vanishes and the mark reads as a plain
blue blob with a hole in it.**

This kit therefore ships two mark treatments and the distinction is the single
most useful thing in it:

| master | eye | use |
|---|---|---|
| `source-art/mark-eye.png` | ring filled white, pupil `#061133` | **default.** Reads correctly on light and dark. Everything in `png/mark*`, `favicon/` and `png/social/` is built from this. |
| `source-art/mark-knockout.png` | ring transparent | only where you want the background to show through the eye, and only on light backgrounds. |

The filled-eye master was recovered from `marketing/logo.png` by flood-filling
the background from the image border, so the enclosed white ring survives as art
instead of being deleted by a global white key.

---

## 4. Extraction method, in case it needs to be redone

`build/extract_art.py` uses two different keying strategies on the same image
and the reason is worth keeping:

- **The mark's eye is intentional white art on a white page.** A global white key
  would delete it. It is fully enclosed by the blue bowl, so a flood fill seeded
  from the image border cannot reach it. Flood fill is used for the mark band.
- **The wordmark's letter counters are holes** that must become transparent, and
  they are also enclosed. Flood fill would keep them opaque and white, which is
  wrong. A global white key is used for the text bands, which is safe because
  the wordmark contains no intentional white.

Edge alpha is derived from the white-over-ink coverage model
`a = (255 - Pmin) / (255 - Cmin)` and then colour-unpremultiplied, so there is no
white halo on the extracted art.

The dark-theme lockups recolour **only the two text bands**, never the whole
composite. Recolouring the whole thing also catches the mark's `#061133` pupil,
which is neutral and dark and therefore matches the selector, turning the eye
into a light grey disc. That bug was built and caught here; do not reintroduce it.

Band boundaries in `marketing/logo.png`, found from blank-row runs:

| band | rows | cols | size |
|---|---|---|---|
| mark | 155 to 716 | 441 to 836 | 396 x 562 |
| wordmark | 794 to 953 | 136 to 1156 | 1021 x 160 |
| tagline | 1007 to 1035 | 201 to 1104 | 904 x 29 |

---

## 5. Files produced

### `build/` (4 scripts, reproducible)

| file | stage |
|---|---|
| `extract_art.py` | keys the masters out of the two source rasters |
| `vectorise.py` | contour trace, Bezier fit, conic fits, gradient analysis |
| `emit_svg.py` | writes the 5 SVGs, prints the fidelity measurements |
| `render_rasters.py` | writes the 108 rasters, enforces the no-upscale rule |

Run in that order from the repo root. They read from `marketing/` and
`brandgeo/web/` and write only inside this directory.

### `svg/` (5 files)

| file | bytes | fill | honest? |
|---|---|---|---|
| `brandgeo-mark.svg` | 3271 | 7-stop linear gradient at 144 deg | **outline yes, fill approximate.** Mean RGB error 33.6/441. Violet band lost. Carries a warning comment in the file. |
| `brandgeo-mark-knockout.svg` | 2627 | same gradient, eye as an evenodd hole | same caveat |
| `brandgeo-mark-mono-light.svg` | 2127 | `#e8e9ed` (`--t` dark theme) | **yes, fully.** For dark backgrounds. 16.22:1 on `#0a0b0e`. |
| `brandgeo-mark-mono-dark.svg` | 2127 | `#09090f` (`--t` light theme) | **yes, fully.** For light backgrounds. 18.59:1 on `#f7f7fc`. |
| `brandgeo-mark-mono-accent.svg` | 2127 | `#8b5cf6` (`--ac`) | **yes, fully.** Single-colour brand violet. |

All five share the same 48-node outline path, viewBox `0 0 401 567`, and carry a
`<title>` for accessibility.

### `source-art/` (10 masters)

Alpha-keyed, trimmed, native resolution. These are the inputs to everything else
and the right thing to hand a designer.

| file | px | notes |
|---|---|---|
| `mark-eye.png` | 401x567 | mark, eye filled. **The default master.** |
| `mark-knockout.png` | 397x563 | mark, eye as a hole. Light backgrounds only. |
| `wordmark-light.png` | 1033x172 | "BrandGEO", "Brand" in `#050e25` |
| `wordmark-dark.png` | 1033x172 | "Brand" recoloured to `--t` `#e8e9ed` |
| `tagline-light.png` | 916x41 | "BE THE ANSWER. BE EVERYWHERE." |
| `tagline-dark.png` | 916x41 | dark-theme polarity |
| `lockup-light.png` | 1033x808 | mark + wordmark |
| `lockup-dark.png` | 1033x808 | mark + wordmark, dark theme |
| `lockup-full-light.png` | 1033x890 | mark + wordmark + tagline |
| `lockup-full-dark.png` | 1033x890 | mark + wordmark + tagline, dark theme |

### Rasters (108 files)

### `favicon/`  (14 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `favicon.ico` | 256x256 | yes | transparent | multi-resolution icon, contains 16x16, 32x32, 48x48, 64x64, 256x256 |
| `favicon-16.png` | 16x16 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-32.png` | 32x32 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-48.png` | 48x48 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-64.png` | 64x64 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-96.png` | 96x96 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-128.png` | 128x128 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-192.png` | 192x192 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-256.png` | 256x256 | yes | transparent | browser tab / PWA icon, transparent |
| `favicon-512.png` | 512x512 | yes | transparent | browser tab / PWA icon, transparent |
| `maskable-512.png` | 512x512 | no | #0a0b0e | Android maskable icon, 60% safe zone |
| `android-chrome-192.png` | 192x192 | no | #0a0b0e | Android / PWA manifest icon, opaque |
| `android-chrome-512.png` | 512x512 | no | #0a0b0e | Android / PWA manifest icon, opaque |
| `apple-touch-icon-180.png` | 180x180 | no | #0a0b0e | iOS home screen, must be opaque |

### `png/lockup/`  (20 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `brandgeo-lockup-dark-canvas-w256.png` | 256x200 | no | #0a0b0e | lockup (light text) on canvas |
| `brandgeo-lockup-dark-canvas-w512.png` | 512x400 | no | #0a0b0e | lockup (light text) on canvas |
| `brandgeo-lockup-light-light-w256.png` | 256x200 | no | #f7f7fc | lockup (dark text) on light |
| `brandgeo-lockup-light-light-w512.png` | 512x400 | no | #f7f7fc | lockup (dark text) on light |
| `brandgeo-lockup-light-white-w256.png` | 256x200 | no | #ffffff | lockup (dark text) on white |
| `brandgeo-lockup-light-white-w512.png` | 512x400 | no | #ffffff | lockup (dark text) on white |
| `brandgeo-lockup-dark-canvas-w1024.png` | 1024x801 | no | #0a0b0e | lockup (light text) on canvas |
| `brandgeo-lockup-dark-canvas-w1033.png` | 1033x808 | no | #0a0b0e | lockup (light text) on canvas, native resolution |
| `brandgeo-lockup-light-light-w1024.png` | 1024x801 | no | #f7f7fc | lockup (dark text) on light |
| `brandgeo-lockup-light-light-w1033.png` | 1033x808 | no | #f7f7fc | lockup (dark text) on light, native resolution |
| `brandgeo-lockup-light-white-w1024.png` | 1024x801 | no | #ffffff | lockup (dark text) on white |
| `brandgeo-lockup-light-white-w1033.png` | 1033x808 | no | #ffffff | lockup (dark text) on white, native resolution |
| `brandgeo-lockup-dark-transparent-w256.png` | 256x200 | yes | transparent | lockup (light text) on transparent |
| `brandgeo-lockup-dark-transparent-w512.png` | 512x400 | yes | transparent | lockup (light text) on transparent |
| `brandgeo-lockup-dark-transparent-w1024.png` | 1024x801 | yes | transparent | lockup (light text) on transparent |
| `brandgeo-lockup-dark-transparent-w1033.png` | 1033x808 | yes | transparent | lockup (light text) on transparent, native resolution |
| `brandgeo-lockup-light-transparent-w256.png` | 256x200 | yes | transparent | lockup (dark text) on transparent |
| `brandgeo-lockup-light-transparent-w512.png` | 512x400 | yes | transparent | lockup (dark text) on transparent |
| `brandgeo-lockup-light-transparent-w1024.png` | 1024x801 | yes | transparent | lockup (dark text) on transparent |
| `brandgeo-lockup-light-transparent-w1033.png` | 1033x808 | yes | transparent | lockup (dark text) on transparent, native resolution |

### `png/lockup-full/`  (20 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `brandgeo-lockup-full-dark-canvas-w256.png` | 256x221 | no | #0a0b0e | lockup-full (light text) on canvas |
| `brandgeo-lockup-full-dark-canvas-w512.png` | 512x441 | no | #0a0b0e | lockup-full (light text) on canvas |
| `brandgeo-lockup-full-light-light-w256.png` | 256x221 | no | #f7f7fc | lockup-full (dark text) on light |
| `brandgeo-lockup-full-light-light-w512.png` | 512x441 | no | #f7f7fc | lockup-full (dark text) on light |
| `brandgeo-lockup-full-light-white-w256.png` | 256x221 | no | #ffffff | lockup-full (dark text) on white |
| `brandgeo-lockup-full-light-white-w512.png` | 512x441 | no | #ffffff | lockup-full (dark text) on white |
| `brandgeo-lockup-full-dark-canvas-w1024.png` | 1024x882 | no | #0a0b0e | lockup-full (light text) on canvas |
| `brandgeo-lockup-full-dark-canvas-w1033.png` | 1033x890 | no | #0a0b0e | lockup-full (light text) on canvas, native resolution |
| `brandgeo-lockup-full-light-light-w1024.png` | 1024x882 | no | #f7f7fc | lockup-full (dark text) on light |
| `brandgeo-lockup-full-light-light-w1033.png` | 1033x890 | no | #f7f7fc | lockup-full (dark text) on light, native resolution |
| `brandgeo-lockup-full-light-white-w1024.png` | 1024x882 | no | #ffffff | lockup-full (dark text) on white |
| `brandgeo-lockup-full-light-white-w1033.png` | 1033x890 | no | #ffffff | lockup-full (dark text) on white, native resolution |
| `brandgeo-lockup-full-dark-transparent-w256.png` | 256x221 | yes | transparent | lockup-full (light text) on transparent |
| `brandgeo-lockup-full-dark-transparent-w512.png` | 512x441 | yes | transparent | lockup-full (light text) on transparent |
| `brandgeo-lockup-full-dark-transparent-w1024.png` | 1024x882 | yes | transparent | lockup-full (light text) on transparent |
| `brandgeo-lockup-full-dark-transparent-w1033.png` | 1033x890 | yes | transparent | lockup-full (light text) on transparent, native resolution |
| `brandgeo-lockup-full-light-transparent-w256.png` | 256x221 | yes | transparent | lockup-full (dark text) on transparent |
| `brandgeo-lockup-full-light-transparent-w512.png` | 512x441 | yes | transparent | lockup-full (dark text) on transparent |
| `brandgeo-lockup-full-light-transparent-w1024.png` | 1024x882 | yes | transparent | lockup-full (dark text) on transparent |
| `brandgeo-lockup-full-light-transparent-w1033.png` | 1033x890 | yes | transparent | lockup-full (dark text) on transparent, native resolution |

### `png/mark/`  (16 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `brandgeo-mark-light-h128.png` | 91x128 | no | #f7f7fc | mark at natural 401:567 aspect on light |
| `brandgeo-mark-light-h256.png` | 181x256 | no | #f7f7fc | mark at natural 401:567 aspect on light |
| `brandgeo-mark-light-h512.png` | 362x512 | no | #f7f7fc | mark at natural 401:567 aspect on light |
| `brandgeo-mark-light-h567.png` | 401x567 | no | #f7f7fc | mark at natural 401:567 aspect on light, native resolution |
| `brandgeo-mark-white-h128.png` | 91x128 | no | #ffffff | mark at natural 401:567 aspect on white |
| `brandgeo-mark-white-h256.png` | 181x256 | no | #ffffff | mark at natural 401:567 aspect on white |
| `brandgeo-mark-white-h512.png` | 362x512 | no | #ffffff | mark at natural 401:567 aspect on white |
| `brandgeo-mark-white-h567.png` | 401x567 | no | #ffffff | mark at natural 401:567 aspect on white, native resolution |
| `brandgeo-mark-canvas-h128.png` | 91x128 | no | #0a0b0e | mark at natural 401:567 aspect on canvas |
| `brandgeo-mark-canvas-h256.png` | 181x256 | no | #0a0b0e | mark at natural 401:567 aspect on canvas |
| `brandgeo-mark-canvas-h512.png` | 362x512 | no | #0a0b0e | mark at natural 401:567 aspect on canvas |
| `brandgeo-mark-canvas-h567.png` | 401x567 | no | #0a0b0e | mark at natural 401:567 aspect on canvas, native resolution |
| `brandgeo-mark-transparent-h128.png` | 91x128 | yes | transparent | mark at natural 401:567 aspect on transparent |
| `brandgeo-mark-transparent-h256.png` | 181x256 | yes | transparent | mark at natural 401:567 aspect on transparent |
| `brandgeo-mark-transparent-h512.png` | 362x512 | yes | transparent | mark at natural 401:567 aspect on transparent |
| `brandgeo-mark-transparent-h567.png` | 401x567 | yes | transparent | mark at natural 401:567 aspect on transparent, native resolution |

### `png/mark-knockout/`  (2 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `brandgeo-mark-knockout-transparent-h256.png` | 181x256 | yes | transparent | mark with the eye as a HOLE, background shows through |
| `brandgeo-mark-knockout-transparent-h563.png` | 397x563 | yes | transparent | mark with the eye as a HOLE, background shows through |

### `png/mark-square/`  (12 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `brandgeo-mark-light-128.png` | 128x128 | no | #f7f7fc | square mark on light |
| `brandgeo-mark-light-256.png` | 256x256 | no | #f7f7fc | square mark on light |
| `brandgeo-mark-light-512.png` | 512x512 | no | #f7f7fc | square mark on light |
| `brandgeo-mark-white-128.png` | 128x128 | no | #ffffff | square mark on white |
| `brandgeo-mark-white-256.png` | 256x256 | no | #ffffff | square mark on white |
| `brandgeo-mark-white-512.png` | 512x512 | no | #ffffff | square mark on white |
| `brandgeo-mark-canvas-128.png` | 128x128 | no | #0a0b0e | square mark on canvas |
| `brandgeo-mark-canvas-256.png` | 256x256 | no | #0a0b0e | square mark on canvas |
| `brandgeo-mark-canvas-512.png` | 512x512 | no | #0a0b0e | square mark on canvas |
| `brandgeo-mark-transparent-128.png` | 128x128 | yes | transparent | square mark on transparent |
| `brandgeo-mark-transparent-256.png` | 256x256 | yes | transparent | square mark on transparent |
| `brandgeo-mark-transparent-512.png` | 512x512 | yes | transparent | square mark on transparent |

### `png/social/`  (4 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `gbp-logo-720-white.png` | 720x720 | no | #ffffff | Google Business Profile logo, white background |
| `linkedin-logo-400-white.png` | 400x400 | no | #ffffff | LinkedIn company logo, renders on light |
| `gbp-logo-720-transparent.png` | 720x720 | yes | transparent | Google Business Profile logo, transparent |
| `linkedin-logo-400-canvas.png` | 400x400 | no | #0a0b0e | LinkedIn company logo, dark alternative |

### `png/wordmark/`  (20 files)

| file | px | alpha | background | intended use |
|---|---|---|---|---|
| `brandgeo-wordmark-dark-canvas-w256.png` | 256x43 | no | #0a0b0e | wordmark (light text) on canvas |
| `brandgeo-wordmark-dark-canvas-w512.png` | 512x85 | no | #0b0b0e | wordmark (light text) on canvas |
| `brandgeo-wordmark-light-light-w256.png` | 256x43 | no | #f6f6fb | wordmark (dark text) on light |
| `brandgeo-wordmark-light-light-w512.png` | 512x85 | no | #f6f6fb | wordmark (dark text) on light |
| `brandgeo-wordmark-light-white-w256.png` | 256x43 | no | #fefefe | wordmark (dark text) on white |
| `brandgeo-wordmark-light-white-w512.png` | 512x85 | no | #fefefe | wordmark (dark text) on white |
| `brandgeo-wordmark-dark-canvas-w1024.png` | 1024x171 | no | #0a0c0f | wordmark (light text) on canvas |
| `brandgeo-wordmark-dark-canvas-w1033.png` | 1033x172 | no | #0a0c0f | wordmark (light text) on canvas, native resolution |
| `brandgeo-wordmark-light-light-w1024.png` | 1024x171 | no | #f6f7fc | wordmark (dark text) on light |
| `brandgeo-wordmark-light-light-w1033.png` | 1033x172 | no | #f6f7fc | wordmark (dark text) on light, native resolution |
| `brandgeo-wordmark-light-white-w1024.png` | 1024x171 | no | #feffff | wordmark (dark text) on white |
| `brandgeo-wordmark-light-white-w1033.png` | 1033x172 | no | #feffff | wordmark (dark text) on white, native resolution |
| `brandgeo-wordmark-dark-transparent-w256.png` | 256x43 | yes | transparent | wordmark (light text) on transparent |
| `brandgeo-wordmark-dark-transparent-w512.png` | 512x85 | yes | transparent | wordmark (light text) on transparent |
| `brandgeo-wordmark-dark-transparent-w1024.png` | 1024x171 | yes | transparent | wordmark (light text) on transparent |
| `brandgeo-wordmark-dark-transparent-w1033.png` | 1033x172 | yes | transparent | wordmark (light text) on transparent, native resolution |
| `brandgeo-wordmark-light-transparent-w256.png` | 256x43 | yes | transparent | wordmark (dark text) on transparent |
| `brandgeo-wordmark-light-transparent-w512.png` | 512x85 | yes | transparent | wordmark (dark text) on transparent |
| `brandgeo-wordmark-light-transparent-w1024.png` | 1024x171 | yes | transparent | wordmark (dark text) on transparent |
| `brandgeo-wordmark-light-transparent-w1033.png` | 1033x172 | yes | transparent | wordmark (dark text) on transparent, native resolution |

---

## 6. What I could not produce, and why

1. **A faithful colour SVG master.** Measured and explained in section 2. The
   fill is a mesh or multi-shape gradient; a raster cannot give it back. The
   outline is genuinely clean at 48 nodes and IoU 0.9935; the fill is not.

2. **Any SVG of the wordmark.** The typeface is unidentifiable from a 172px-tall
   raster and no font file exists in the repo. Tracing nine glyphs with counters
   would produce a heavy path blob that could never be re-set, re-kerned or
   re-weighted, which defeats the purpose of a wordmark vector. **The owner needs
   either the typeface name plus a licence, or the original design file.** This
   is the largest single gap in the kit.

3. **Anything above the resolution ceiling.** 23 exports were refused. See the
   table at the top and the full list below.

4. **A print or Pantone specification.** No CMYK or spot values can be derived
   from an sRGB raster with any authority. The blue-to-violet ramp is outside
   CMYK gamut anyway and will shift noticeably in print. A designer must make
   that call against physical proofs.

5. **A verified brand guideline.** Clear-space rules, minimum sizes, misuse
   examples and typography pairings are all design decisions, not measurements.
   I have deliberately not invented any. The only guidance in this file is
   derived from something I measured.

6. **Confirmation that the mark should be blue at all.** Section 1 records that
   the logo sits at hue 250 to 265 while `--ac` is at 293. Reconciling them is a
   brand decision and needs a human.

### The 23 refused exports, in full

| would-be file | reason |
|---|---|
| `png/mark-square/brandgeo-mark-{transparent,canvas,white,light}-1024.png` | would upscale mark 1.48x, needs 840px of a 567px master |
| `png/mark/brandgeo-mark-{transparent,canvas,white,light}-h1024.png` | would upscale 1.81x, needs 1024px of a 567px master |
| `png/wordmark/brandgeo-wordmark-{light,dark}-*-w2048.png` (5) | would upscale 1.983x, native 1033px, exported at w1033 instead |
| `png/lockup/brandgeo-lockup-{light,dark}-*-w2048.png` (5) | would upscale 1.983x, native 1033px, exported at w1033 instead |
| `png/lockup-full/brandgeo-lockup-full-{light,dark}-*-w2048.png` (5) | would upscale 1.983x, native 1033px, exported at w1033 instead |

The machine-readable list is `build/_skipped.csv`.

---

## 7. Suggested next actions for the owner

1. **Look for the original design file** before doing anything else. It makes
   items 1, 2 and 3 above disappear at once. Check Canva, Figma, and whatever
   generated `marketing/logo.png`.
2. **Replace the two live favicons.** `brandgeo/web/favicon.svg` and
   `brandgeo-dashboard/public/favicon.svg` are a system-font `B` in retired
   teal. `favicon/` here has drop-in replacements. This is the fastest visible
   win in the kit and it removes the last teal on the property.
3. **Decide the hue question.** Logo at hue 250 to 265, site accent at 293.
4. **Pick a mark treatment per surface** using section 3. Filled eye by default,
   knockout only on light, mono-light on dark chrome.
5. **Delete or symlink one of the two identical mark files.** `marketing/logo
   only symbol.png` and `brandgeo/web/logo.png` are byte identical.
