# YouTube Shorts, run 20260730-0216

Hook driver: **#5, concrete proof.** "Here is the exact prompt, here is the
exact answer."

Runs 1 to 4 used loss aversion, status threat, curiosity gap and contrarian.
All four put something at stake or argued a position. This one does neither. It
asserts nothing, argues nothing, and makes no promise. It shows the artefact and
lets the viewer check it.

Shorts has the most room of the four platforms, so this cut shows the **method**
as well as the result: the question exactly as it was typed, which engines were
asked, the date it ran, what came back per engine, and what one run does not
prove. The limits scene is not a disclaimer bolted on at the end. It is the
reason the scene beside it is worth believing, and it is placed before the CTA
rather than after it.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## A note on the run folder, read this first

This cut was built for run stamp `20260730-0213`. Partway through the render a
sibling session appeared writing the **instagram** cut of this same driver into
`run-20260730-0216/`. The campaign brief requires all four platform cuts of one
run to share a folder, because splitting them across two stamps destroys the
cross-platform comparability the campaign exists to measure.

So this cut was written into `run-20260730-0216/youtube/` rather than creating a
second folder. The empty `run-20260730-0213/` was removed. **Nothing under
`run-20260730-0216/instagram/` was read, written or touched.**

The sibling folder also independently confirms the `*-scored.mp4` filename. The
brief's deliverables list says `*-bed.mp4`, but that name belongs to the
superseded approach it describes in the same breath, "a synthesized bed built in
ffmpeg from `sine` and `aevalsrc`". That was replaced by the composed-track
library at the top of the same brief. All four prior runs shipped `-scored.mp4`
and so does this one. The brief's deliverables list is stale on the filename, not
on the requirement.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all**, `nb_streams=1`. Pick a track from YouTube's own audio library at upload. |
| `youtube-scored.mp4` | Same picture, video bitstream copied, plus the BrandGEO track. For paid, site embeds and decks. |
| `youtube-cover.png` | Frame 0, 1080x1920, byte identical to the delivered master's first frame. |

---

## On-screen text, verbatim

Ten scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule, centred on
the same axis as the type. Line breaks below are the actual rendered line breaks.
Ink is `#E8E9ED`, accent is `#A78BFA`, and accent lines are marked.

**1. 0.00 to 5.60 s** (first two lines ink Inter Bold 58; the quoted prompt is accent Inter SemiBold 52. Hard start, no fade, this is the cover)

```
The exact question
we typed:

"Top-rated property
management companies
in Chicago"
```

**2. 5.60 to 10.40 s** (all ink)

```
Fired once each at

ChatGPT
Claude
Gemini
Perplexity
Google AI Mode
```

**3. 10.40 to 14.60 s** (last two lines accent)

```
One collection run,
24 July 2026.

All five engines
returned data.
```

**4. 14.60 to 18.20 s** (last line accent)

```
All five named the
same company.
```

**5. 18.20 to 22.80 s** (last three lines accent)

```
Ranked 1st by
ChatGPT and Claude.

2nd by Perplexity.
4th by Gemini.
```

**6. 22.80 to 26.20 s** (last line accent)

```
Google AI Mode
surfaced it by name.
```

**7. 26.20 to 30.80 s** (last two lines accent)

```
One city. One
question. One day.

That is what this
proves, and no more.
```

**8. 30.80 to 34.80 s** (last line accent)

```
The full run is
published, with
every prompt and
every engine.
```

**9. 34.80 to 38.80 s** (last line accent)

```
BrandGEO runs the
same pipeline on
your questions.
```

**10. 38.80 to 43.60 s** (logo, ink, then accent `getbrandgeo.com` in SemiBold 52)

```
[BrandGEO icon, 196 px]

See what the
engines say.

getbrandgeo.com
```

---

## The prompt, and why this exact one

**Quoted exactly, not shortened, not tidied, not paraphrased:**

```
"Top-rated property management companies in Chicago"
```

**Source: `brandgeo/web/ai-visibility-for-chicago.html`**, prompt card 3 of 6,
which renders that string in its own quotation marks with the sub-label
"Landmark Property Management, 5/5, full unanimous consensus". The page states
its collection date as **2026-07-24** and describes the run as "BrandGEO's own AI
Visibility pipeline".

Every word on screen is the page's string including the hyphen in "Top-rated"
and the city. Nothing was dropped to make it fit. The line budget was set around
this string first and the rest of the copy was written to it, per the run brief.

### Why Chicago and not another city

Chicago is the one city page whose denominator is genuinely five. Its own
data-quality note: "All 5 engines returned usable data on every prompt this run,
no collection errors". And critically, its lineup on the collection date matches
today's Growth five exactly:

> "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity"
> "This run also used Google AI Mode in place of the now-retired Meta AI engine
> used in earlier city pages."

So "All five engines returned data" and "All five named the same company" carry a
verified denominator AND a verified lineup, and scene 2 names that lineup on
screen so the two cannot drift apart. This is the exact check the brief demands:
verify the lineup on the collection date, or state no count at all. Other city
pages are x/4 because an engine failed there, and the first seven city runs used
retired Meta AI, so a five-engine claim would be false for them.

---

## Every number on screen, and where it was MEASURED

The provenance check runs on the figure, not on the page it sits in. All four
figures below were measured by BrandGEO's own pipeline on 2026-07-24. None is
third-party, and none was read off a page that merely quotes someone else.

| On screen | Where it was measured | The page's own words |
|---|---|---|
| "All five engines returned data." | Chicago run, 2026-07-24 | "All 5 engines returned usable data on every prompt this run, no collection errors" |
| "All five named the same company." | same | "appears in every single one of the 5 engines' responses"; key findings "5/5 ... the first fully unanimous result measured anywhere in this research program" |
| "Ranked 1st by ChatGPT and Claude. 2nd by Perplexity. 4th by Gemini." | same | "ChatGPT and Claude both rank it #1, Gemini names it #4, Google AI Mode surfaces it by name at 4.8 stars, and Perplexity ranks it #2" |
| "Google AI Mode surfaced it by name." | same | same sentence as above |

The per-engine ranks are a transcription of one sentence, in the page's own
order of magnitude, with the ranks unchanged. Google AI Mode is stated separately
in scene 6 precisely because the page does **not** give it a numeric rank; it
says the engine "surfaces it by name at 4.8 stars". Folding it into the rank list
would have invented a rank. The 4.8 star figure was left off screen because it is
the engine's own display value about a third party, not a BrandGEO measurement.

**"24 July 2026"** is the page's stated `datePublished` and its "data collected
2026-07-24" line. Written in words rather than as `2026-07-24` so no hyphen on
screen could be mistaken for a dash in review.

### What was deliberately left on the floor

- **`bg-005.html`'s 48% and 93% figures.** Not used, not read for this cut. Both
  are third-party figures sitting inside an otherwise first-party page, which is
  the loophole the brief closed on 2026-07-30.
- **`bg-016.html`.** Not read and nothing sourced from it, per the run brief.
- **Any engine count from `bg-004.html`.** Not read for figures. It claims five
  engines while naming six across the page, including Copilot and retired Meta AI.
- **"27 cities" appears nowhere**, on screen or in the description.
- **No Grok figure and no AI Overviews figure**, and neither engine is named.
  Both went live 2026-07-29 with 5 and 6 rows from a single day.
- **Copilot and DeepSeek** are absent because they sit on no purchasable plan.
- **The 4/4 corporate-law figure from the same page.** A 4-of-4 "structured
  engines" denominator sitting next to a 5-of-5 denominator in the same video
  would read as a contradiction, and reconciling it on screen would cost more
  time than the figure is worth.

---

## No measured subject is named, and the judgement a reviewer should push on

**No company, firm or person that turned up inside a result set appears on
screen.** The Chicago page names nine: a property manager, four law firms, a
commercial brokerage, a realty firm, two more immigration practices, plus a firm
whose name two engines rendered incorrectly. None of them is on screen, in the
title, or in the description.

Verified mechanically rather than by reading. Capitalised tokens were extracted
from the 37 `.txt` files fed to `drawtext` via `textfile=`, which is the literal
byte stream ffmpeg drew, not a copy of the source list:

```
AI  All  BrandGEO  ChatGPT  Chicago  Claude  Claude.  Fired  Gemini
Gemini.  Google  July  Mode  One  Perplexity  Perplexity.  Ranked  See
That  The  Top-rated
```

Our own brand, the five Growth engines, the city and the hyphenated adjective
from inside the verbatim prompt, a month name, and sentence-start capitalisation.
Nothing else. Two scans over that byte stream:

```
explicit measured-subject hits : NONE
  (checked: Landmark Property Management, Kirkland & Ellis, Minsky,
   McCormick, Hallagan, Clifford Law Offices, CBRE, Vesta Preferred
   Realty, Cipolla Law Group, Aparicio Immigration Law, McDermott Will
   & Emery, Schulte, Big Four, and single-word forms of each)

generic sweep hits : NONE
  (30 multiword proper-noun candidates harvested from the source page)
```

### The tension, stated rather than buried

This driver puts a real prompt on screen. Anyone can type it into an engine, and
our own published page names the company that won it. So the party is more
resolvable from this cut than from any previous run in the campaign, even though
their name never appears.

Shipped anyway, and here is the reasoning a reviewer should test:

1. **The brief's own worked example is this exact construction.** "All five
   engines named the same two providers" is given as the form that survives the
   rule. Scene 4 is that sentence with a smaller number.
2. **The brief's own test passes.** "If the name were removed, would the claim
   still stand?" The claim is that cross-engine consensus exists and is
   measurable. The winner's identity is irrelevant to it. Any company would carry
   the same point, which is why removing the name costs the cut nothing.
3. **The ad makes no claim about them.** It does not rate them, recommend them,
   imply a relationship, or use their reputation as proof of anything. It reports
   that five engines converged, which is a fact about the engines.
4. **Removing the city would break the driver.** A paraphrased prompt is not an
   artefact, and this driver is worth nothing without one. The choice was a real
   prompt or a different driver.

The counter-argument, which is not nothing: a resolvable party is closer to a
named party than the rule's authors may have had in mind. If a reviewer wants the
distance back, the substitution is a one-line copy change to the fragmented
category on the same page, "Best real estate agents for buying a home in
Chicago", where the finding is that the five engines agreed on nobody and one
declined to name anyone at all. That version points at no winner. It is a weaker
hook and an equally true one.

### Compliance check against the brief

```
banned vocabulary on screen : NONE
em dash U+2014 on screen    : 0
en dash U+2013 on screen    : 0
other dash codepoints       : NONE
non-ascii characters        : NONE
Grok / AI Overviews         : NONE
Meta AI (retired)           : NONE
Copilot / DeepSeek          : NONE
pricing tokens              : NONE
```

The engine list in scene 2 is exactly the five on the Growth tier per
`brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
`perplexity`, `google_ai`. No em dashes and no en dashes anywhere, on screen or
in this file.

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Measured against the **delivered** `youtube-silent.mp4`, not the PNG
intermediates, over **all 1308 frames**, by three independent passes.

### Justifying the ink threshold

Not chosen by feel. The plate generator prints its own peak, and a text-free
control was encoded through the identical pipeline so the ceiling could be read
off an encoded file rather than inferred:

```
source plate (mkbg.js, RGB)      peak luma 16.79   mean luma 11.19
control.mp4 (encoded, stored Y)  YMAX distribution: 19 on 1244 frames,
                                 20 on 64 frames
```

**20 is the number to argue from.** 16.79 is RGB luma; the delivered file is
limited-range `yuv420p`, where `Y = 16 + 219 * luma / 255`, so 16.79 maps to 30.4
at full coverage, and the measured ceiling of 20 is lower because the vignette
darkens every edge of the crop window.

Stored Y of everything drawn, measured on the delivered file, not computed:

| Drawn element | Colour | Stored Y |
|---|---|---|
| Body and list text | `#E8E9ED` | 239 peak |
| Accent text | `#A78BFA` | 164 peak |
| Violet scene rule | `#8B5CF6` | 125 (scene 1), 123 (scene 10) |
| Logo mark | violet | 130 peak |
| Logo card field | near black, RGB min (0,0,1) | **3 to 13 measured, BELOW the background** |

Threshold for method A is **56**. It sits in the empty gap between the background
ceiling of 20 and the dimmest element method A can resolve, the violet rule at
123. The logo card sits *below* the background, which is what method C exists for.

### Method A, absolute threshold on the delivered master

```
mode=abs  threshold=56
frames decoded: 1308   frames with no ink: 27
peak sample value seen anywhere: 250
INK UNION  x 184..796   y 655..1159
  top     clearance  655 px  reserve 180  headroom +475  PASS   worst at frame 1168 (t=38.93s)
  bottom  clearance  760 px  reserve 380  headroom +380  PASS   worst at frame 1167 (t=38.90s)
  right   clearance  283 px  reserve 180  headroom +103  PASS   worst at frame    0 (t=0.00s)
  left    184 px  (Shorts specifies no left reserve)
```

### Method B, per-frame diff against a text-free control

`control.mp4` is the same background with the same drift crop, the same duration,
the same frame count and the same encoder settings, with no text composited at
all. It is diffed against, rather than against a flat assumed canvas colour,
because a flat assumption measures the codec's frame-edge chroma artefact and
reports a failure on every edge.

```
mode=diff  threshold=16
frames decoded: 1308   frames with no ink: 9
peak sample value seen anywhere: 238
INK UNION  x 183..797   y 655..1159
  top     clearance  655 px  reserve 180  headroom +475  PASS   worst at frame 1166
  bottom  clearance  760 px  reserve 380  headroom +380  PASS   worst at frame 1165
  right   clearance  282 px  reserve 180  headroom +102  PASS   worst at frame    0
  left    183 px
```

**The two methods disagree by exactly 1 px on the left and right edges**, and the
rule is to trust the one finding more ink after confirming both are measuring
ink. Both are: method B is simply resolving one more column of antialiased glyph
edge at threshold 16 than method A resolves at 56. The union takes **B's larger
box**, giving the reported right headroom of **+102**, not A's +103. Top and
bottom agree to zero pixels.

### Method C, layer alpha, the only pass that sees dark furniture

```
layer  1: x  183.. 797   y  705..1111   computedRuleTop  705   drift 0
layer  2: x  234.. 748   y  661..1153   computedRuleTop  661   drift 0
layer  3: x  224.. 752   y  733..1069   computedRuleTop  733   drift 0
layer  4: x  236.. 742   y  820.. 983   computedRuleTop  820   drift 0
layer  5: x  189.. 788   y  733..1083   computedRuleTop  733   drift 0
layer  6: x  202.. 774   y  820.. 996   computedRuleTop  820   drift 0
layer  7: x  196.. 782   y  733..1080   computedRuleTop  733   drift 0
layer  8: x  241.. 735   y  746..1070   computedRuleTop  746   drift 0
layer  9: x  224.. 757   y  783..1033   computedRuleTop  783   drift 0
layer 10: x  267.. 710   y  655..1159   computedRuleTop  655   drift 0
UNION x 183..797  y 655..1159   (declared 196 px logo rect folded in)
```

`drift 0` on all ten is the check for the `drawbox` alpha trap. The violet rule
is the topmost thing in every block, so if it had written at alpha 0 the measured
top would sit 46 px below the computed top. It does not, on any of the ten, which
is positive evidence `replace=1` worked rather than an assertion that it should
have. The rule measuring stored Y 123 to 125 on the delivered file is the second,
independent confirmation.

This pass is also what would have caught the `color=black@0.0` trap: a layer that
shipped opaque measures `x 0..1079 y 0..1919` with drift exactly `-computedRuleTop`.
The pass asserts that case explicitly and exits non-zero on it. It did not fire.

### The dark-on-dark blind spot, and it is worse on this build than run 4's

The logo asset is a card, not a bare mark: **95.6% of the 196x196 tile is opaque**
and its darkest opaque pixels are RGB `(0,0,1)`. Read off the asset's own alpha
channel, because no pixel method can see it. Probed on frame 1250 (scene 10)
across the whole declared rect, delivered against control:

```
declared logo rect x 392..587  y 701..896   (38,416 px)
  delivered Y: min   3  max 130  mean 25.7
  control   Y: min  10  max  15  mean 13.0
  |diff| max 118    pixels with diff>16: 4,993    with diff<=16: 33,423
  delivered pixels above abs threshold 56: 4,847 of 38,416

  diff>16 resolves  x 449..530  y 745..849
  abs>56  resolves  x 449..530  y 746..849

  horizontal cut at y=706, just inside the card's top edge:
    x=392  delivered 13  control 13  |diff| 0
    x=410  delivered 10  control 10  |diff| 0
    x=480  delivered 12  control 13  |diff| 1
    x=584  delivered 13  control 13  |diff| 0
```

Both methods resolve only the roughly 82x105 violet mark and **miss 87% of the
card**. Run 4's card sat at stored Y 26 against a background of 35, a difference
of 9. This one sits at 3 to 13 against 10 to 15, a difference of **0 at the
edges**: the card is darker than the canvas and at its boundary is literally
indistinguishable from it. So the union folds in the **declared** rectangle:

```
declared logo rect   x 392..587   y 701..896
```

It is fully contained by the type union on all four edges, so it changes nothing,
but it was checked rather than assumed. This is now the fifth build where
declared geometry was the only handle on that element.

### Final union and verdict

```
FINAL UNION (methods A, B, C and the declared 196 px logo rect)
  x 183..797   y 655..1159
  top    655 px   reserve 180   headroom +475
  bottom 760 px   reserve 380   headroom +380
  right  282 px   reserve 180   headroom +102
  left   183 px
```

**SAFE ZONE: PASS.** Tightest edge is the right at 282 px against a 180 px
reserve, a **102 px** margin. That is 5.1x the 20 px floor, and the right edge is
the one that failed run 1's TikTok build at 1 px.

**The binding element is the prompt line, and it was budgeted first rather than
discovered at measurement.** Frame 0, scene 1, `management companies` at Inter
SemiBold 52. This is exactly what run 4's closing note predicted would happen on
driver #5, and the note is the reason it did not cost a reshoot.

The margin went from run 4's 123 px to 102 px, spending 21 px to put a verbatim
50-character prompt on screen. How the budget was actually held:

- **The prompt was set at 52 px, not 58.** Above the 44 px floor the run brief
  set, and the size drop is doing work beyond width: at a different size and in
  the accent colour it reads as a quoted artefact rather than as more copy.
- **It was broken across three lines, not truncated.** No ellipsis, nothing
  tidied. The brief's instruction was to pick a shorter real prompt rather than
  shrink or truncate, and no shortening was needed once the line breaks fell at
  20 characters.
- **The longest line is 20 characters** (`management companies`), against run 4's
  binding 19 characters of prose and run 3's 20 characters containing a ratio.

Worth recording for whoever runs driver #6: a 20-character line at SemiBold 52
and a 19-character line at Bold 58 come out almost identically wide, 614 px
against 599 px. Layer 1 and layer 5 are within 15 px of each other. So dropping
6 px of size buys roughly one character, not three.

Cover frame measured separately from the delivered PNG at the same threshold 56:

```
cover ink bbox: x 184..796   y 705..1111
  top 705 (headroom +525)   bottom clearance 808 (+428)   right clearance 283 (+103)
  ink pixels 33888
```

The video pass counted 33,919 ink pixels at frame 0 against the PNG's 33,888. Not
a discrepancy: measuring the PNG requires an RGB to YUV conversion that the mp4
frame never underwent, so 31 pixels move across the threshold on rounding. The
md5 below is the identity check, and it is exact.

### Scene transitions verified on the delivered file, not assumed

Frame hashing does not work on encoded H.264, and `-ss` lands on the wrong side
of a cut. Ink pixels were counted per frame over a single sequential decode:

```
frames counted: 1308
frame 0 ink: 33,919 px (abs) / 36,176 px (diff)   <- the cover is not blank

diff-mode zero-ink runs (scene crossovers):
  (168,1) (312,1) (438,1) (546,1) (684,1) (786,1) (924,1) (1044,1) (1164,1)
declared boundary frames:
   168     312     438     546     684     786     924     1044     1164
match: EXACT on all nine, no drift

scene plateau ink, sampled mid-scene (abs):
  1: 33899   2: 35570   3: 30557   4: 16775   5: 33365
  6: 18387   7: 32443   8: 29873   9: 25988  10: 24469
```

Ten distinct plateaus, nine crossovers of exactly one frame each, each a clean
step. **Every crossover frame index is exactly the declared scene boundary times
30**, with no drift on any of the nine. That is the check `ffconcat` failed in
run 3, where a cut landed on frame 694 instead of 693 while total duration and
frame count still looked correct. No `ffconcat` was used here.

**One measurement artefact worth recording, because it looked like drift and was
not.** The absolute-threshold pass reported 27 blank frames in runs of 3 starting
at 167, 311, 437 and so on, one frame *earlier* than declared. That is the
threshold, not the timeline: at 56 the faint head and tail of each 0.3 s alpha
fade fall below the threshold one frame either side, widening a 1-frame crossover
to 3 and moving its start index down by one. The sensitive diff pass at threshold
16 resolves the true crossover, 9 runs of exactly 1 frame at exactly the declared
indices. A single-method boundary check here would have reported a defect that
does not exist.

---

## Duration and container

Both from `ffprobe` on the **delivered** files in this folder, probed after they
were copied here, not in the build directory:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **43.600000 s** | 1308 frames, 30/1, 1080x1920, yuv420p, h264 | **none, `nb_streams=1`, zero audio streams** |
| `youtube-scored.mp4` | **43.600000 s** | 1308 frames, identical stream, `-c:v copy` | aac 48 kHz stereo, stream duration **43.600000 s** |

`nb_streams=1` on the master is the load-bearing check. A muted audio track is
not the same thing as no audio track, and a muted track can block a platform's
in-app music picker, which is the whole reason the silent master is primary.

Exit status is not proof a mux worked. Run 2 shipped a 4.7 MB file that exited 0
and probed as `Duration: N/A` with no streams. Both files above were probed in
this folder.

The video stream is provably the same bitstream in both:

```
ffmpeg -i youtube-silent.mp4 -map 0:v -c copy -f md5 -   MD5=21b67bd71ea78526490b23e31c803e32
ffmpeg -i youtube-scored.mp4 -map 0:v -c copy -f md5 -   MD5=21b67bd71ea78526490b23e31c803e32
```

so the safe-zone measurement binds on the scored cut too rather than being
assumed to.

43.600 s is inside the 30 to 45 s target and 16.4 s under the 60 s cap.
`-shortest` held the container to the exact cut length. Decoding the scored
file's audio yields 2,093,056 samples, which is 43.6053 s, the AAC decoder's
1024-sample tail padding. The container and both stream durations are exactly
43.600000, which is what a player reads.

---

## Cover integrity

Scene 1 has **no fade in**. Frame 0 is the hook at full opacity, because frame 0
is the thumbnail the feed shows. In the build command `[1:v]` carries a
`fade=t=out` and no `fade=t=in`, which is the guarantee, not an oversight. The
command generator asserts it structurally: the fade-in clause is emitted only for
`i > 0`.

Verified with an md5 over raw RGB taken from the delivered file in this folder:

```
ffmpeg -i youtube-cover.png     -pix_fmt rgb24 -f rawvideo - | md5sum
  c86a3ae3271e7db33d170a0297710147

ffmpeg -i youtube-silent.mp4 -frames:v 1 -pix_fmt rgb24 -f rawvideo - | md5sum
  c86a3ae3271e7db33d170a0297710147
```

Identical. The cover is frame 0, not a re-render of it. The 33,919 ink pixels
counted at frame 0 are the independent confirmation that it is not a blank
rectangle.

The cover carries the prompt itself, in quotation marks. A viewer who never
presses play still sees a real question in a real format, which is the entire
proposition of this driver compressed into a thumbnail.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.
Composed by BrandGEO on 2026-07-29, recorded in `assets/audio/ATTRIBUTION.md`.
Owned outright, cleared for commercial use including paid advertising, and it
**requires no attribution line anywhere**. Nothing was downloaded and no music
service was involved.

Held **constant** across runs on purpose. The hook is the variable under test, so
the bed must not be. The library contains tracks whose names map to specific hook
drivers in `ATTRIBUTION.md`; that mapping applies when a track is chosen for a
one-off asset, or later if music itself becomes the variable. Swapping the bed on
the run whose hook is the variable would leave any result with two candidate
explanations and no way to separate them.

**There is no CC BY 4.0 line on this asset and there must not be one.** That
obligation belongs to the LibriTTS voice model, and there is no voice of any kind
in this run. Crediting a model that is not in the audio would be a false
statement about the asset, not a harmless precaution.

### Fade in, and the measurement that proves it was needed

Source is 60.000 s, trimmed to 43.600 s. The brief specifies a 0.08 s fade in and
a 1.5 s fade out, and both were applied, the fade out starting at 42.10 s.

The fade in is not cosmetic. Measured on the raw track before any processing:

```
raw track first-64-sample peak |amp| = 0.061709
raw track peak within first 0.1s     = 0.206314
```

A hard cut at sample 0 starts at 0.062 and reaches 0.206 within 100 ms, which is
an audible click, not a fade.

Verified on the **delivered** `youtube-scored.mp4` in this folder:

```
delivered first-64-sample peak |amp| = 0.002815      (requirement: < 0.005)
```

**Pass, at 56 percent of the ceiling.**

The tail was checked at the same time, because a fade out that does not reach
zero is the same defect at the other end:

```
last 0.100s   peak 0.027775   -31.1 dBFS
last 0.030s   peak 0.005764   -44.8 dBFS
last 0.010s   peak 0.000819   -61.7 dBFS
last 64 smp   peak 0.000007  -102.7 dBFS
```

It ends in real silence rather than being cut off.

### Loudness

Two-pass `loudnorm`, then re-measured independently on the **encoded** file
rather than trusting the filter's own pass-2 summary:

```
pass 1 (measured on the trimmed and faded 43.6 s cut)
  input_i      = -16.64 LUFS
  input_tp     =  -4.41 dBTP
  input_lra    =   9.00 LU
  input_thresh = -26.78
  offset       =  -0.50

ffmpeg -i youtube-scored.mp4 -map 0:a -af ebur128=peak=true
  Integrated:  -15.8 LUFS   (target -16)
  LRA:           8.6 LU     (low -22.3, high -13.7)
  True peak:    -3.8 dBFS   (ceiling -1.5 dBTP)
```

True peak lands 2.3 dB under the ceiling. The ceiling is a limit, not a target,
and the source already sat near -16 LUFS, so pass 2 applied roughly 0.8 dB of
gain in `linear` mode. There was nothing to fix.

### Honest read on the scored cut

Measured on the delivered file, not judged by ear:

| | |
|---|---|
| LRA | **8.6 LU** (a flat drone measures near 1.5) |
| Stereo | L differs from R on **100.00%** of samples, correlation **0.870** |

LRA 8.6 is the number that says it moves. 100% L/R divergence at correlation
0.870 says it images as a field with width rather than as a point in the centre
of the head.

What it is not: it was not cut to this edit. The track was composed to 60 s for
the campaign generally, and the ten scene changes here fall where reading time
puts them, so bar lines and cuts do not line up. It reads as a bed under the
video rather than as a score of it. That is the correct tradeoff for a shared
library held constant across an A/B, and it is worth knowing before anyone claims
the music hits the cuts. It does not, by design.

**Still upload the silent master for the organic post.** YouTube's in-app library
is free, cleared, and favoured by distribution. The scored cut is for paid, site
embeds and decks, where that library does not exist.

---

## Suggested Shorts title

```
We asked five AI engines the same question and all five gave the same name
```

Written to be read rather than stuffed. It states what happened in one clause and
nothing else. No keyword list, no colon-and-brackets construction, no "here is
why", no bracketed year, no all caps, no number gimmick. The word "same" carries
the surprise twice, which is the only device in it.

It also sets an expectation the video meets exactly, which matters more on this
driver than on the previous four: a concrete-proof cut that oversells in the
title destroys the one thing it is selling.

Alternates on the same driver:

- `The exact prompt, the exact answers, from five AI engines`
- `What five AI engines said when asked the same buying question`

## Suggested description

```
No argument in this one. Just the working.

On 24 July 2026 we ran a set of real buying questions through five AI engines,
the same pipeline we run for paying clients. One of the questions was typed
exactly like this:

"Top-rated property management companies in Chicago"

It went to ChatGPT, Claude, Gemini, Perplexity and Google AI Mode, once each.
All five returned usable data, so nothing here is resting on a failed collection
or a partial denominator.

All five named the same company. ChatGPT and Claude both put it first,
Perplexity second, Gemini fourth, and Google AI Mode surfaced it by name. That
is the first fully unanimous result we have measured anywhere in this research
programme, and it is worth being precise about what it means: not that the
company is the best, only that every engine independently arrived at it.

The limits matter as much as the finding. This is one city, one question, one
collection run. It does not establish a trend and we are not presenting it as
one. What it does show is that cross-engine agreement is a real, measurable
thing, and that it can be total. If a category near you has converged like this,
a competitor outside that answer is not being ranked lower. They are not in the
answer at all, and nothing in a rank tracker will tell them so.

The full run is published with all six questions, every engine, and the
data-quality notes including one anomaly we kept as reported rather than quietly
correcting:
https://getbrandgeo.com/ai-visibility-for-chicago.html

BrandGEO asks the questions your buyers actually ask, across ChatGPT, Gemini,
Claude, Perplexity and Google AI Mode, and records who gets named, where in the
answer, and how it describes them.

See what the engines say: https://getbrandgeo.com
```

No hashtag block. The description is written for a person who paused on the
video, and a trailing tag run does not serve that reader. If the channel's
convention requires tags, add them below the links rather than inside the copy.

The source link is there because a concrete-proof hook is worthless without a
place to check it. That link is the whole point of the driver, so it is placed
before the product paragraph rather than after it.

**The description names no measured subject either**, and it deliberately adds
the sentence "not that the company is the best, only that every engine
independently arrived at it". A description has room for that qualification and a
30 second video does not, which is the right division of labour between them.

No CC BY 4.0 line, for the reason given under Music above.

---

## Build

`ffmpeg 8.1.2-full_build-www.gyan.dev`, `node v24.16.0`, `numpy 2.4.6`. Remotion
is not installed and was not used. Nothing was installed. PNG intermediates
throughout, no JPEG, so nothing gets forced to `yuvj420p`.

Pipeline, all scripts in the session scratchpad:

1. `mkbg.js` writes a 1188x2112 binary PPM: base `#090A0F`, a violet `#7C3AED`
   mass top right, an indigo `#6366F1` mass bottom left, a faint `#8B5CF6` centre
   lift, an edge vignette and a light ordered dither so the gradient does not
   band after h264. Oversized so the render can drift-crop 1080x1920 out of it
   without ever reaching an edge. It prints its own peak luma, which is what
   justifies the ink threshold. Then `ffmpeg -i bg.ppm bg.png`.
2. `scenes.js` holds every drawn string, size, colour and scene duration as data,
   so the copy has exactly one source.
3. `mktext.js` renders one transparent RGBA layer per scene. Text goes through
   `textfile=` rather than `text=`, so no filtergraph escaping is involved, and
   every invocation is spawned as an argv array so the shell never sees the
   filter string. Fonts are the vendored Inter, copied next to the script so
   `fontfile=` needs no drive-letter escaping on Windows.
4. `mkcmd.js` generates the filtergraph, so fade timings and the crop
   denominator are computed rather than hand-typed.
5. `measure_layers.py`, `measure_delivered.py` and `namescan.py` do the
   measurement and compliance passes. All three exit non-zero on failure.

**The three silent-failure traps, all guarded explicitly.**

`-f lavfi -i color=black@0.0` does not survive format negotiation: the source
drops its `@alpha` and lands opaque, so a later `format=rgba` fills alpha with
255 and every text layer ships as a full-frame black rectangle over the
background, at exit 0 with no warning. The alpha is zeroed explicitly instead:

```
[0:v]format=rgba,colorchannelmixer=aa=0,drawbox=...,drawtext=...
```

and the PNG write carries `-update 1 -pix_fmt rgba`, or alpha is dropped again
one step later and produces the identical failure.

On a transparent RGBA source `drawbox` blends rather than writing alpha, so it
renders at alpha 0 and the violet rule silently does not appear. It needs
`replace=1`. Separately, `drawbox` **cannot animate** on 8.1.2: it has no `eval`
option and evaluates `x/y/w/h` once at init, so any time-dependent expression
renders frozen at its t=0 value. Nothing in this build asks it to animate. The
rule is drawn as:

```
drawbox=x=448:y=<ruleTop>:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1
```

and both the `drift 0` column on all ten layers and the measured stored Y of 123
to 125 on the delivered file are the evidence it worked.

### Exact command, silent master

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 43.6 -i bg.png \
 -loop 1 -framerate 30 -t 43.6 -i text-1.png \
 -loop 1 -framerate 30 -t 43.6 -i text-2.png \
 -loop 1 -framerate 30 -t 43.6 -i text-3.png \
 -loop 1 -framerate 30 -t 43.6 -i text-4.png \
 -loop 1 -framerate 30 -t 43.6 -i text-5.png \
 -loop 1 -framerate 30 -t 43.6 -i text-6.png \
 -loop 1 -framerate 30 -t 43.6 -i text-7.png \
 -loop 1 -framerate 30 -t 43.6 -i text-8.png \
 -loop 1 -framerate 30 -t 43.6 -i text-9.png \
 -loop 1 -framerate 30 -t 43.6 -i text-10.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1307':y='192*n/1307',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=5.30:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=5.60:d=0.3:alpha=1,fade=t=out:st=10.10:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=10.40:d=0.3:alpha=1,fade=t=out:st=14.30:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=14.60:d=0.3:alpha=1,fade=t=out:st=17.90:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=18.20:d=0.3:alpha=1,fade=t=out:st=22.50:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=22.80:d=0.3:alpha=1,fade=t=out:st=25.90:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=26.20:d=0.3:alpha=1,fade=t=out:st=30.50:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=30.80:d=0.3:alpha=1,fade=t=out:st=34.50:d=0.3:alpha=1[t8];\
[9:v]format=rgba,fade=t=in:st=34.80:d=0.3:alpha=1,fade=t=out:st=38.50:d=0.3:alpha=1[t9];\
[10:v]format=rgba,fade=t=in:st=38.80:d=0.3:alpha=1[t10];\
[bg][t1]overlay=0:0:format=auto[v1];\
[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];\
[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];\
[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];\
[v7][t8]overlay=0:0:format=auto[v8];\
[v8][t9]overlay=0:0:format=auto[v9];\
[v9][t10]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1308 youtube-silent.mp4
```

`[1:v]` carries no fade in. That is the cover guarantee, not an oversight.

This is a single continuous filtergraph over ten looped stills, so every frame
index is evaluated once by the encoder and boundary arithmetic never accumulates.
No `ffconcat` and no numbered frame sequence was needed; the frame-index table in
the transitions section is the evidence, not the claim.

### Exact command, text-free control

Same background chain, same encoder settings, same frame count, no text inputs.
A measurement instrument, not delivered.

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 43.6 -i bg.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1307':y='192*n/1307',format=rgba,setsar=1[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1308 control.mp4
```

### Exact command, scored cut

Pass 1 measured the trimmed and faded audio only:

```
ffmpeg -i assets/audio/music/tension-minor.wav \
 -af "atrim=0:43.6,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,\
afade=t=out:st=42.10:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Its output feeds pass 2:

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 \
 -i assets/audio/music/tension-minor.wav \
 -filter_complex "[1:a]atrim=0:43.6,asetpts=N/SR/TB,\
afade=t=in:st=0:d=0.08,afade=t=out:st=42.10:d=1.5,\
loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.64:measured_TP=-4.41:\
measured_LRA=9.00:measured_thresh=-26.78:offset=-0.50:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-scored.mp4
```

### Exact command, cover

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" \
 -vsync 0 -update 1 youtube-cover.png
```

---

## Notes for whoever runs driver #6

**Driver #6 is utility, "check your own domain in ten seconds".** It is the only
driver in the cycle that asks for an action inside the video rather than at the
end of it, so the CTA stops being a closing card and becomes the content. Budget
the scene count accordingly: this cut spends 4.8 s on a closing card that #6
probably cannot afford, because it needs the steps themselves on screen.

**Line width, updated with a second data point.** Run 3 ended at 72 px with 20
characters containing a ratio, run 4 at 123 px with 19 characters of prose, this
run at 102 px with a 20-character line at SemiBold 52. A 20-char line at 52 px
and a 19-char line at 58 px are within 15 px of each other, so **dropping 6 px of
type size buys about one character, not three**. If #6 needs to show a URL and a
field together on one line, the size drop alone will not do it; the line has to
break.

**The limits scene is reusable and cheap.** Scene 7 costs 4.6 s and is what
licenses the certainty of the scenes around it. On a utility driver the same move
is "this checks one thing, not everything", which pre-empts the obvious objection
to a ten-second check.

**Do not reuse this cut's source page for #6.** The Chicago page has now supplied
the campaign's strongest single measured result; running it twice in consecutive
runs would confound the hook test with a content repeat.

---

Nothing was posted, scheduled, uploaded or committed. No git command was run.
Nothing outside
`docs/growth/reel-campaign-ab/run-20260730-0216/youtube/` was written, and
nothing under `run-20260730-0216/instagram/` was read or modified.
