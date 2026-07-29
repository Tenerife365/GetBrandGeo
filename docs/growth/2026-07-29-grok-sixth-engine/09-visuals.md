# 09. Visual briefs

Numbered to the asset each one serves. Palette is fixed across every brief:
canvas `#0a0b0e`, primary violet `#8b5cf6`, CTA fill `#7c3aed`, accent text
`#a78bfa`, gradient `#7c3aed` to `#6366f1`, warm counter-accent `#fbbf24` for the
loss and risk framing. Never a white background.

**Canvas corrected 2026-07-29.** This file originally specified `#090A0F`. The
live `:root` in `brandgeo/web/index.html:158` is **`#0a0b0e`**, with its OKLCH
value documented inline as part of the measured palette. `#090A0F` is a stale
value carried in the growth skill file. Every brief below uses `#0a0b0e`. The
skill file should be corrected separately so this does not recur.

**Production notes before anything renders:**

1. **V2, V5 and V6 are programmatic, not generated.** They carry real product
   labels and a wordmark, and diffusion models produce unusable text. Build them
   with the existing generators in `scripts/` (`og_image_generator.py`,
   `hero_image_generator_win.py`) rather than prompting for them. V1, V3 and V4
   are the generated ones.
2. **Dimensions reconcile against `docs/growth/channel-specs-2026-07-29.md`**,
   which is now written. Use its render matrix rather than the indicative numbers
   in the individual briefs below, and read the four constraints in the next
   section before building anything.

---

## Hard constraints that change what gets built

From `channel-specs-2026-07-29.md`. These are not preferences, they break assets.

**Meta's vertical safe area is far larger than it looks.** On a 1080x1920 master:
14% top, **35% bottom**, 6% each side. That is a **672 px bottom inset**, leaving
a usable band of roughly y=269 to y=1248, about half the frame. Text placed at a
comfortable-looking 200 px from the bottom sits underneath the caption block,
audio attribution and CTA. **This directly affects the Reel (05b), TikTok (06)
and Shorts (07a).** Their full-frame text cards must live inside that band.

**Instagram's API accepts JPEG only.** PNG is rejected outright. Against a near
black canvas with violet gradients, JPEG will band visibly. For IG specifically:
quality 95 or higher, 1 to 2% dither, and prefer flat fields over long smooth
gradients. This is a real reason to design the carousel (V5) with flat blocks
rather than a gradient wash.

**`moov` atom must be at the front of the file** for Reels, Facebook Reels and
Threads. Most encoders write it last. Set `-movflags +faststart` globally on every
video export, not per asset.

**Google Business Profile enforces a 10 KB minimum file size.** V6 is specified as
a 720x720 mostly-black card with one line of text, which is exactly the shape that
compresses under 10 KB and gets rejected. Check the byte size after export and pad
with texture or dither if it lands short.

**Threads caps images at 1440 px wide** and counts characters as UTF-8 bytes, so
the 500 character limit is a byte limit. TikTok counts UTF-16 runes. Neither
matches a naive `.length`, which matters if any of this is ever posted through a
scheduler rather than by hand.

---

## The logo constraints, which affect every brief below

From `docs/growth/brand-kit-2026-07-29/MANIFEST.md`.

**The mark exists at exactly one usable resolution, 397x563 px.** There is no
design file and no larger original. Every other copy in the repo is that same art,
byte-identical or downscaled. **Nothing in this package may specify a wordmark
larger than the kit can produce without upscaling.** The kit refuses those exports
rather than silently interpolating, so a missing size is a real ceiling, not an
oversight.

**The mark is a light-background design and it degrades on our canvas.**
Area-weighted contrast is 7.23:1 on white but **2.72:1 on `#0a0b0e`**, under WCAG
1.4.11's 3:1 floor. Its darkest navy `#032578` measures **1.44:1**, so the
lower-left mass merges into the canvas.

**Worse, the eye is knocked out rather than white.** On the dark canvas the ring
goes black and the pupil sits at 1.06:1, so the entire eye disappears. **Use the
filled-eye master from the brand kit for every asset in this package.** Do not use
`brandgeo/web/logo.png` directly on any dark surface.

Consequences for the briefs below:
- **V2, V5 and V6 all place a wordmark on `#0a0b0e`.** Each needs either the
  filled-eye master with a lightened treatment, or a contained light chip behind
  the mark. Decide once and apply to all three, do not solve it per asset.
- **V6 is the worst case.** GBP crops hard and downscales, so a mark already at
  2.72:1 will not survive. The light-background variant already required for GBP
  solves this as a side effect, which is a reason to make light the primary GBP
  render rather than the fallback.

**The mark is not in the brand's own hue.** It sits at OKLCH hue 250 to 265
(`#1a5af7`, `#5f27fc`, `#032578`); `--ac` is hue 293. Flagged, not decided, and
not something a content package should resolve.

**Wordmark typeface is unknown.** The site declares `Geist` and there is no font
file in the repo. The brand kit deliberately refused to name one rather than guess
from a 172px raster. **Do not set new wordmark text in any asset here.** Use the
supplied lockup rasters only.

---

## V1. Serves 04a (X single) and 04b (Threads)

```
ENGINE: flux
SUBJECT: Seven abstract monolithic forms standing in a row on a dark plane, six
         of them lit from within by a violet core, the seventh inert and unlit.
         No faces, no screens, no logos, no text.
COMPOSITION: Wide, low camera, forms receding slightly to the right. The unlit
         form sits third from left, not at an end, so the eye has to find it.
         Generous negative space above.
PALETTE: #0a0b0e base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Internal emission from the lit forms only. No key light. Soft falloff
         onto the plane beneath. The unlit form catches only spill.
MOOD: Cold, quiet, forensic. Closer to a measurement lab than a product ad.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
         glowing blue circuitry, lens flare, text artifacts, robot faces,
         neural network diagrams, holographic UI
ASPECT: 16:9
```

---

## V2. Serves 02a and 02b (LinkedIn) and 04c (Facebook)

**Programmatic.** Branded stat card, built with `og_image_generator.py`.

- Canvas `#0a0b0e`, 1200x627.
- Seven engine rows as horizontal bars, each with a violet check glyph in
  `#a78bfa` and the label `web search on`. An eighth row below the rule is struck
  through in `#fbbf24` and labelled `Meta AI, retired 16 July`.
- Headline, set in the site's existing display face, two lines maximum:
  **"Seven engines. All seven retrieve."**
- Subline in muted token colour: `Meta AI removed 16.07.2026. DeepSeek and Copilot excluded.`
- Wordmark bottom-left at 24px cap height. No URL, the link carries it.
- **Consider mono for the seven engine labels.** The competitive teardown found mono
  for data labels is the category convention across SE Ranking, Scrunch and
  peec.ai, and BrandGEO uses it nowhere. This is a cheap place to test it.

---

## V3. Serves 03, post 1 (X thread hero)

```
ENGINE: flux
SUBJECT: A single large numeral 9 rendered as a solid dark monolith, with a
         hairline violet fracture running through it. Behind and out of focus,
         a sparse field of small unlit forms.
COMPOSITION: Centred, tight, the numeral filling most of the frame and cropped
         at top and bottom. Shallow depth of field.
PALETTE: #0a0b0e base, #7c3aed to #6366f1 accent, violet glow along the fracture
         only
LIGHTING: Rim light from behind and left. The fracture is the only emissive
         element in the frame.
MOOD: Something solid turning out to be hollow.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
         glowing blue circuitry, lens flare, text artifacts, cracked glass
         cliche, shattering debris
ASPECT: 16:9
```

**Note:** the numeral 9 is the one piece of text in a generated image in this
package. Diffusion models render single digits acceptably and words badly. If the
9 comes back malformed after three attempts, composite it in rather than
re-prompting.

---

## V4. Serves 03, post 5 (the filter)

```
ENGINE: flux
SUBJECT: Four abstract forms approaching a narrow illuminated aperture in a dark
         wall. Two pass through and are lit violet on the far side. Two are
         stopped at the threshold and remain dark.
COMPOSITION: Side elevation, the aperture at the golden third. The two rejected
         forms in the near foreground, slightly out of focus. The two that passed
         are smaller and further off, already through.
PALETTE: #0a0b0e base, #7c3aed to #6366f1 accent, violet glow through the aperture
LIGHTING: All light originates from the aperture. Hard-edged shaft, dust in the
         beam, everything else in near-black.
MOOD: A gate that is doing its job.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
         glowing blue circuitry, lens flare, text artifacts, doorways with
         figures walking through, bouncer imagery
ASPECT: 16:9
```

---

## V5. Serves 05a (Instagram carousel)

**Programmatic.** A 7-slide system, not seven separate images.

- 1:1, canvas `#0a0b0e`, consistent 96px safe margin on all sides.
- Type scale fixed across the set. Slide copy is capped at 12 words in
  `05-instagram.md`, so one size holds for all seven.
- Slides 1 to 4 and 6 to 7: violet accent, `#a78bfa` on canvas.
- **Slide 5 inverts.** It is the credibility beat ("We removed Meta AI from our
  own product on 16 July"), so it uses the warm counter-accent `#fbbf24` and a
  reversed field. It should be visibly the odd slide in the set.
- Progress rail across the bottom, 7 segments, current segment in `#7c3aed`.
- **Slide 6 now reads "Seven engines".** Its mark row must show seven, not six.
- Wordmark on slide 1 and slide 6 only. **Slide 7 carries no wordmark**, so the
  question is the last thing on screen.

---

## V6. Serves 08 (Google Business Profile)

**Programmatic.** GBP renders posts small and crops hard, so this is a different
render, not a resize of V2.

- 1:1 minimum 720x720, matching the existing
  `marketing/google-business-profile-2026-07-15/` assets.
- Seven engine marks in a 4+3 grid. Grok and Google AI Overviews highlighted in
  `#7c3aed`, the rest in the muted token. All seven carry the check.
- One line of text only: **"Now monitoring 7 AI engines"**. Nothing else. GBP
  crops and downscales aggressively and multi-line cards become unreadable.
- Wordmark bottom-centre.
- **Build the light-background variant too.** GBP surfaces render on white in
  several placements, and the dark canvas will not always survive.

---

## Motion, held

No Remotion component in this package. The obvious candidate is an engine count
ticking 6 to 5 to 6 with real dates, and it is a good one, but per §5.3 a
Remotion component should animate a real number from the product. The only real
numbers available here are the engine count and two dates, which a static card
carries at a fraction of the cost.

**The Remotion piece worth building is the follow-up**, once Grok has collected:
a visibility score moving across six engine columns with the sixth populating
last. That needs rows in `ai_results` that do not exist yet. Component spec will
be written against real data, not invented props.

---

## Render checklist before anything ships

- [ ] Reconcile every dimension against `channel-specs-2026-07-29.md`
- [ ] Confirm the wordmark asset used is the current one, from the brand-kit
      agent's output, not a stale copy out of `marketing/`
- [ ] Light-background variant exists for V2 and V6
- [ ] No generated image contains rendered words, V3's numeral excepted
- [ ] Contrast check every text-on-canvas pair at 4.5:1 minimum
