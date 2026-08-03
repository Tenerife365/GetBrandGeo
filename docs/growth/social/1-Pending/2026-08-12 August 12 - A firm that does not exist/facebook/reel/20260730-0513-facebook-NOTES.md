# Facebook Reel, run 20260730-0513

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the delivered master. |

---

## Hook driver

**#2, status threat. SECOND PASS, replication round.**

Run 2 (`run-20260729-2318`) already ran this driver on Facebook. The point of
this cut is to separate the DRIVER from the EXECUTION, so nothing about run 2's
cut is reused: not a line, not a beat shape, not the layout, not the motion, not
the runtime.

### The mechanism, and how it differs from run 2's

Run 2's spine was **OCCUPANCY**: a rival holds the answer slot, a default gets
repeated, you are absent from it. Its turn was "Not the biggest. Not the
loudest. The one AI repeats." Absence was the injury.

This cut's spine is **MISDESCRIPTION**. You are *in* the answer. You are named.
The injury is that the sentence attached to your name was written by something
else, you never saw it, you never approved it, and it is what reaches the buyer.
Nobody is holding your slot; the slot is yours and the contents are wrong.

That is a different status mechanism and a different product truth. What an
engine *says* about you is separate from whether it *lists* you, and BrandGEO
reads both. It is also the shape that makes the driver falsifiable as a driver:
if run 2 and this cut both perform, status threat is doing the work. If only one
does, the execution was.

Beats 3 and 4 carry the turn: authorship is denied ("You did not write it. / You
do not get a copy.") and then consequence ("It reaches your buyer / with your
name on it."). No line mentions a competitor, a slot, a default, being first,
being beaten, or being missed. The word "competitor" does not appear.

Per the run brief, **no number is attached to this claim**, because there is no
BrandGEO measurement of description accuracy to cite. The video carries no
digits at all.

**Facebook-native treatment.** Plain business language, short declaratives,
slower beats, no category vocabulary. No "GEO", no "AI visibility", no
"generative engine", no imperative stacking. The nouns are "AI", "description",
"buyer", "business".

---

## On-screen text, verbatim

Line breaks below are the actual rendered line breaks, one `drawtext` per line.
Nothing else appears on screen except the persistent bottom lockup and the
vertical accent rule.

**Beat 1, 0.000 to 4.400 s**, fully opaque from frame 0. No fade in, no slide,
no stagger, because this frame is the cover. Third line accent violet, Inter
ExtraBold.

```
An AI can name your
company and still
describe it wrong.
```

**Beat 2, 4.600 to 8.600 s**

```
That description
tells your buyer
how good you are.
```

**Beat 3, 8.800 to 12.200 s**, two lines, **accent on line 1**.

```
You did not write it.
You do not get a copy.
```

**Beat 4, 12.400 to 15.800 s**, two lines, **accent on line 2**.

```
It reaches your buyer
with your name on it.
```

**Beat 5, 16.000 to 21.400 s**, five lines, its own vertical grid.

```
BrandGEO reads how
ChatGPT, Gemini,
Claude, Perplexity
and Google AI Mode
describe your business.
```

**Beat 6, 21.600 to 24.400 s**

```
Read the description
before your buyer does.
```

**Beat 7, 24.600 to 26.400 s**, one line, accent, Inter ExtraBold 80 px.

```
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

### Copy compliance, run as a script on the drawn bytes

`scan.py` parses `fc.txt` for every `textfile=` reference, reads those exact
files, and exits non-zero on a hit. It is not a reviewer's memory and it does
not read this document or the brief. Output on the delivered build:

```
drawn text files, in draw order:
  t/l00.txt  'An AI can name your'      t/l09.txt  'with your name on it.'
  t/l01.txt  'company and still'        t/l10.txt  'BrandGEO reads how'
  t/l02.txt  'describe it wrong.'       t/l11.txt  'ChatGPT, Gemini,'
  t/l03.txt  'That description'         t/l12.txt  'Claude, Perplexity'
  t/l04.txt  'tells your buyer'         t/l13.txt  'and Google AI Mode'
  t/l05.txt  'how good you are.'        t/l14.txt  'describe your business.'
  t/l06.txt  'You did not write it.'    t/l15.txt  'Read the description'
  t/l07.txt  'You do not get a copy.'   t/l16.txt  'before your buyer does.'
  t/l08.txt  'It reaches your buyer'    t/l17.txt  'getbrandgeo.com'
                                        t/wordmark.txt 'BrandGEO'

ENGINE NAMES DRAWN (allowed, instruments of measurement):
  ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Google AI Mode']
WARN, absolute words needing a situational-vs-universal ruling: none

PASS: no dash, banned word, superlative, people-quantifying universal,
      digit or pricing token in the drawn bytes.
exit=0
```

What it checks, and why each check exists:

- **Dashes and non-ASCII.** Every codepoint is scanned; anything in Unicode
  category `Pd` other than ASCII hyphen fails, as does any codepoint above 126.
  No hyphen occurs either.
- **Banned vocabulary.** The fifteen forms of the brief's thirteen terms. None
  occurs. (They are not repeated in prose here, because on run 1 the notes file
  itself tripped a naive scanner.)
- **Superlatives.** `first, only, most, biggest, largest, best, fastest,
  leading, number one, #1, top`. None occurs. This matters more than usual on
  this run: the brief records a false superlative from
  `ai-visibility-for-chicago.html` reaching two rendered cuts in run 5. Nothing
  here was sourced from a city page at all.
- **Universals that quantify over people.** `nobody, no one, everyone,
  everybody, every business, anyone, all businesses, always`. None occurs. The
  scanner also reports absolutes needing a human ruling (`never, cannot,
  nothing, none`) rather than auto-rewriting them, per the brief's 2026-07-30
  refinement. **It reported none**, so no ruling was needed on this build.
- **Digits.** This cut carries no number of any kind, so any digit is a
  failure. Zero digits found. That sidesteps the Grok and AI Overviews
  one-day-sample problem by construction, and it means nothing on screen needs
  to trace to a `bg-*.html` page because nothing on screen is a measurement.
  **Nothing was sourced from `bg-005.html` (48% / 93%, both third party),
  `bg-016.html`, `bg-004.html`, or any city page. No engine count is stated and
  no "27 cities" claim appears.**
- **Pricing tokens.** TOFU asset, checked mechanically. None occurs.

**No measured subject is named.** The only third-party names drawn are ChatGPT,
Gemini, Claude, Perplexity and Google AI Mode, which are the instruments being
measured, allowed by name under the brief's 2026-07-30 refinement. No company,
firm or person that appeared inside a result set is named. Applying the brief's
own test: remove the engine names and "BrandGEO reads how ... describe your
business" stops being a description of the product, so they survive.

The five engines drawn are exactly `PLAN_ENGINES.growth` in
`brandgeo-dashboard/src/lib/planConfig.ts:56`, `chatgpt, gemini, claude,
perplexity, google_ai`, verified against the file this run, not remembered.
They are **named, never counted**, so the claim carries no denominator that can
age. Grok and AI Overviews went live 2026-07-29 on Growth PRO and up and are not
named. Meta AI is retired and is not named. Copilot and DeepSeek are on no
purchasable plan and are not named. `google_ai` is drawn as its product name
"Google AI Mode", not shortened.

### Two claims worth a reviewer's eye

Neither is a measurement, and both are properties of how these products behave:

1. *"That description tells your buyer how good you are."* Asserts that an AI
   answer carries a qualitative judgement, not just a listing. That is a
   description of the output format, not a result about the viewer.
2. *"You did not write it. You do not get a copy."* Situational facts about one
   viewer's position, in the sense the brief's refinement protects: AI answers
   about a business are not reported to that business. Neither sentence
   quantifies over people, so neither is a universal.

The video never asserts anything about the viewer's own brand. A company selling
measurement should not guess at the viewer's numbers in an ad.

---

## How this execution differs from run 2's, item by item

Copy is covered above. Everything else:

| | run 20260729-2318 | this build |
|---|---|---|
| Runtime | 28.000 s, 840 frames | **26.400 s, 792 frames** |
| Beats | 6, near-uniform ~5 s | **7, deliberately uneven: 4.4 / 4.0 / 3.4 / 3.4 / 5.4 / 2.8 / 1.8 s** |
| Lines per beat | 3,3,3,3,4,3 | **3,3,2,2,5,2,1** |
| Accent position | line 3, every time | **line 3, none, line 1, line 2, none, none, line 1** |
| Accent furniture | horizontal rule 104x6 above the block | **vertical rule 8 px wide running the block's full height, left of the type** |
| Close | 2 lines plus the domain as line 3 | **domain gets its own beat, alone, 80 px** |
| Line motion | 22 px vertical rise over 0.55 s | **18 px horizontal slide from the left over 0.50 s, no rise** |
| Fade in / stagger / out | 0.40 / 0.12 / 0.35 s | **0.45 / 0.10 / 0.30 s** |
| Type | SemiBold 68, ExtraBold 75 | **SemiBold 64, ExtraBold 70, domain ExtraBold 80** |
| Text x | 100 | **120, with the rule at 84** |
| Grid | fixed 102 px pitch, top-anchored at 640 | **96 px pitch, every block optically centred on y=800** |
| Background drift | `18*sin(2πt/26)` x, linear 26 px rise | **`20*sin(2πt/31)` x, `16*cos(2πt/23)` y, two incommensurate periods so the path does not repeat inside the runtime** |
| Background glows | violet upper left, indigo right, violet lower | **indigo upper right, violet lower left, violet mid right** |
| Lockup y | 1344 | **1320** |
| Ink threshold | 100, background peak 59 | **100, background peak 36** |
| Diff threshold | 12, not floor-tested | **8, set above a measured noise floor of 5** |

The seven-beat, uneven-length structure is the substantive change. Run 2's
uniform five-second cadence is a metronome; this one accelerates into the turn
(3.4 s beats at 3 and 4) and then holds the product beat long (5.4 s for five
lines) before two short closes. If the two cuts perform differently, cadence is
one of the few things separating them, and it is recorded here so that can be
read afterwards.

---

## Duration, exact ffprobe output on the DELIVERED files

`facebook-silent.mp4`
```
nb_streams      : 1
format duration : 26.400000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 792 frames, duration 26.400000
audio streams   : 0
```

`facebook-scored.mp4`
```
nb_streams      : 2
format duration : 26.400000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 792 frames, duration 26.400000
audio           : aac, 48000 Hz, 2 ch, 1239 frames, stream duration 26.400000
```

**The silent master has zero audio streams.** `ffprobe -select_streams a` returns
nothing at all, which is the check that distinguishes "no track" from "a silent
track".

Both containers report **26.400000 s**, inside the 20 to 30 s band. 792 frames at
30 fps is exactly 26.4 s, so the video duration is exact by construction.

AAC quantisation is present and contained: a raw decode of the scored cut's
audio yields 1,267,712 samples per channel, **26.4107 s** of coded audio, because
1239 AAC frames of 1024 samples overshoot the cut. `-shortest` plus the mp4 edit
list trims playback back to 26.400.

Video bitstream identity, confirmed rather than assumed:

```
facebook-silent.mp4  video stream MD5 = 47667aa62850cd4505db842aec626811
facebook-scored.mp4  video stream MD5 = 47667aa62850cd4505db842aec626811
```

The scored cut was muxed with `-c:v copy`. Same picture, not a re-encode.

Delivered file hashes:

```
f4305624367baa830c535f2c44437766  facebook-silent.mp4
abcef58392b986b0ef923740e5457e8f  facebook-scored.mp4
366ba7ab0e2c35b4044bca16cbcd1235  facebook-cover.png
```

---

## Cover, verified against frame 0 of the delivered file

Beat 1 hard-starts: `alpha` is the constant 1 until the fade-out begins at
4.100 s, there is no stagger, and there is **no slide term in the `x`
expression** (beat 1's `x` is the literal `120`, not the expression the other
six beats use). The accent rule for beat 1 likewise starts at its full 0.9
opacity with no step-up.

Decoding both to raw RGB24 and hashing, on the copies in this folder:

```
frame 0 of facebook-silent.mp4   md5 cb5c1b63ac2686beaceb105dd0003852  (6,220,800 bytes)
facebook-cover.png               md5 cb5c1b63ac2686beaceb105dd0003852  (6,220,800 bytes)
byte identical                   True
max abs per-channel difference   0
```

And it is not a blank rectangle: the cover carries **39,596 pixels above luma
100**, bounding box `x[84..757] y[698..1370]`, which is the vertical accent rule,
three lines of type and the bottom lockup.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.** Usable band
is `y 220..1480` and `x <= 900`.

### The ink threshold, argued from a measured control

A text-free control was rendered through the **identical** background pipeline
(same PNG, same scale, same crop expressions, same `format` chain) and encoded
with **identical** x264 settings, then decoded back out of the encoded mp4 and
histogrammed over all 792 frames, 1.64 billion pixels:

```
control (background only, decoded from the encoded mp4)
  luma min 8   PEAK 36
  top of the distribution: 33:18,149,742  34:10,881,654  35:729,802  36:2,296
```

The background peaks at **36** and dies out there, 2,296 pixels in 1.64 billion.
The dimmest thing deliberately drawn is the accent violet `#A78BFA`, luma about
160 at full alpha and about 149 where the rule sits at 0.9 over the plate. Body
ink `#E8E9ED` is about 232.

That leaves an empty band from 36 to 149. **Threshold 100 sits inside it**, 64
levels clear of the background and 49 clear of the dimmest ink. A second pass at
**45**, nine levels above the measured peak, was run to catch antialiased glyph
fringes that 100 would drop. The two agree to within one pixel on every edge, so
the choice of 100 is not load bearing.

### Method A, absolute threshold, all 792 frames of the delivered file

```
th > 100   union x[84..855]  y[602..1370]
th >  45   union x[84..855]  y[602..1371]

worst frames: left 0, right 507, top 480/489, bottom 0
```

### Method B, per-frame diff against the text-free control

**The threshold was measured, not chosen.** Adding text changes libx264's rate
control across the whole frame, so a control differs from the render even where
nothing is drawn. Three regions empty by design in BOTH files were sampled at
10 fps across the runtime:

```
frames sampled 264
  max |delta| in top band    y 0..380      : 5
  max |delta| in right band  x 950..1079   : 5
  max |delta| in bottom band y 1500..1919  : 5
```

Noise floor is exactly **5** in all three. The diff threshold was set to **8**,
above it with margin. All 264 sampled frames carried ink.

```
diff > 8    union x[84..855]  y[602..1387]
diff > 12   union x[84..855]  y[602..1386]     (sanity check, one pixel apart)
```

No method reports ink at the literal frame edge, so the yuv420p frame-edge chroma
artefact the brief warns about did not fire here.

### Declared rects, folded in explicitly

Pixel measurement is blind to anything near the canvas value, so the geometry is
asserted from the filtergraph independently of what was seen:

```
logo overlay      x 84..151    y 1320..1387   (y even, so overlay's odd-y round-down
                                               cannot move it; EFFECTIVE y = requested y)
wordmark          x 168..366   y 1340..1368
accent rules      x 84..91     y 602..1057    (widest span, beat 5)
type, widest line x up to 855                 (l14 and l16, both measured alone first)
UNION (declared)  x 84..855    y 602..1387
```

The declared union and Method B agree exactly.

### The three reserves

The reported box is the union of **everything drawn**: type, the vertical accent
rule, the icon mark and the wordmark.

| Edge | Limit | Measured ink | Headroom | Verdict |
|---|---|---|---|---|
| Top | `y >= 220` | 602 | **382 px** | PASS |
| Bottom | `y <= 1480` | 1387 | **93 px** | PASS |
| Right | `x <= 900` | 855 | **45 px** | PASS |

No edge is under 20 px and none is in single digits.

### The 17 px disagreement, which reproduced exactly as the brief predicts

Method A put the bottom edge at 1370. Method B and the declared rect both put it
at **1387**. That is a **17 px** gap, and the brief warns of exactly this number:
both pixel methods stopping 17 px short of the logo's real bottom. The icon
mark's own dark bottom rows differ from the plate by more than 8 levels, so the
diff sees them, but their absolute luma is under 45, so no absolute threshold
can. Method B is right; Method A under-reports the furniture.

**Taking 1387 rather than 1370 is what the reported 93 px means.** The larger
number was taken only after confirming both methods were measuring real ink and
after the control diff was floor-tested, per the brief's correction. The lockup
was placed at `y=1320` from the start of this build precisely so that a 17 px
correction would not turn a comfortable pass into a marginal one, which is what
happened on run 2 (69 px, after a re-render from 49 px). No re-render was needed
here.

### The right edge, and the line that sets it

The binding constraint is **45 px on the right**, set by two lines that tie at
855: `describe your business.` (l14) and `before your buyer does.` (l16).

Every line was measured individually **before** the layout was fixed, by
rendering each one alone on black at 1400 px wide and taking its ink box, so the
type size was chosen from the measurement rather than checked after it:

```
body Inter-SemiBold @ 64    widest  l14 "describe your business."  right 855
                            tie     l16 "before your buyer does."  right 855
                            next    l07 "You do not get a copy."   right 807
accent Inter-ExtraBold @ 70 widest  l09 "with your name on it."    right 837
domain Inter-ExtraBold @ 80         l17 "getbrandgeo.com"          right 832
wordmark Inter-Bold @ 40            "BrandGEO"                     right 366
```

Body at 66 px would have put l14 at 883 and left 17 px, a fail. Body at 62 with
the type at x=128 was the first layout tried and gave 37 px, which is a pass but
a thin one. Moving the type to x=120 with the rule at x=84 bought the extra 8 px
and let the type stay at 64. **Any copy edit that lengthens a line needs this
measurement rerun.**

The horizontal slide moves type *toward* the constraint, from x=102 to x=120, so
the settled position is the worst case and is the one measured. Confirmed on the
delivered file: leftmost text ink (the accent rule excluded by measuring only
`x >= 100`) reads 113, 114, 116 during beat 5's slide and settles at 122. The
`x` expression is being evaluated per frame, not frozen.

### The drawbox and alpha traps, and how this build proves they did not fire

- **`drawbox` on transparent RGBA blends to alpha 0 and vanishes silently.** This
  build removes the precondition rather than working around it: the plate is
  forced to `format=rgb24` before any drawing and the logo overlay is pinned to
  `format=rgb`, so **no alpha plane exists anywhere in the draw chain**.
  `replace=1` is therefore unnecessary and would be wrong here, because each
  rule's fade is stacked boxes at 0.3 / 0.6 / 0.9 / 0.55 / 0.22 opacity that must
  alpha-blend against the plate.
- **The positive check.** Beat 5's accent rule is drawn at `y=602`, and the
  measured minimum ink `y` across all 792 frames is **exactly 602**, on frame 480,
  which is inside beat 5. If the rule had vanished the measured top would have
  been 608, the first line of that beat. Left edge is **exactly 84**, the rule's
  x, and no type is drawn left of 120. Both furniture edges are load bearing in
  the union, which is the only way to know the rules rendered.
- **`color=black@0.0` does not survive format negotiation.** Not applicable: this
  build draws directly onto the opaque plate and creates no transparent layer, so
  there is no `lavfi` alpha source and no PNG round-trip to lose alpha in.
- **`drawbox` cannot animate on 8.1.2.** No `w`, `h`, `x` or `y` on any
  `drawbox` in `fc.txt` is an expression. Every one is a literal, and each fade
  is N static boxes gated by `enable`.

### Timeline, built as a frame sequence not ffconcat

No `ffconcat` anywhere. The whole video is one filtergraph over a single looped
PNG at `-framerate 30`, which is frame-exact by construction: 26.4 s x 30 =
**792 frames**, and `ffprobe` reports exactly 792.

Scene boundaries were checked by counting ink pixels per frame on the delivered
file and taking **plateau centres**, not step edges or local minima. The
persistent lockup means the ink count never reaches zero (floor 3,230 px, peak
64,082), so the plateau threshold was swept in absolute pixels rather than as a
fraction:

```
lim= 4000  plateau widths [15,17,15,15,15,17]  centres_s [4.533, 8.767, 12.333, 15.933, 21.533, 24.567]
lim= 5500  plateau widths [15,18,15,15,15,17]  centres_s [4.533, 8.783, 12.333, 15.933, 21.533, 24.567]
lim= 7000  plateau widths [15,18,15,15,15,17]  centres_s [4.533, 8.783, 12.333, 15.933, 21.533, 24.567]
lim= 9000  plateau widths [15,18,15,15,15,18]  centres_s [4.533, 8.783, 12.333, 15.933, 21.533, 24.583]
```

The **widths change with threshold and the centres do not**, which is the test
the brief prescribes. Intended gap midpoints are 4.500, 8.700, 12.300, 15.900,
21.500, 24.500. Measured centres sit **+0.033 to +0.083 s** late, that is 1 to
2.5 frames, and the offset is near-uniform across all six cuts. Per the brief's
own rule, a uniform offset is the signature of detector bias, not render drift:
the sub-threshold plateau is asymmetric here because the fade-out is 0.30 s and
the fade-in is 0.45 s plus stagger, so its centre sits later than the true gap
centre by design. The direct check on drift is the frame count and container
duration, and both are exact.

Frames were decoded sequentially in one pass and indexed. `-ss` was not used to
sample near a cut.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.

Original BrandGEO composition, cleared for commercial use including paid ads, no
attribution line required. Held **constant** across this campaign by instruction.
Nothing was synthesized for this cut and nothing was downloaded.

Source is 60.000 s, 48 kHz, 24-bit stereo PCM. Trimmed to the first 26.400 s
with a **0.08 s fade IN at t=0** and a **1.5 s fade OUT starting at 24.900 s**,
both mandatory, then two-pass normalized because a 26.4 s excerpt does not carry
the parent file's integrated loudness.

### The fade in is not cosmetic, and it is verified on the delivered file

`tension-minor` does not start at zero; it opens on a downbeat. Cutting it in at
sample 0 clicks. Measured on the audio decoded back **out of
`facebook-scored.mp4`**:

```
first 64 samples, max |amplitude| = 0.0026255
  L first 8:  -0.000206 -0.000184 -0.000184 -0.000169 -0.000103 -0.000077 -0.000070 -0.000024
  R first 8:  -0.000131 -0.000091 -0.000076 -0.000039  0.000002  0.000058  0.000121  0.000157
below 0.005 = True
last 64 samples, max |amplitude| = 0.00000066   (the 1.5 s fade out lands on silence)
overall peak = 0.6132
```

**0.00263, under the 0.005 requirement**, on the delivered file rather than the
intermediate.

### Loudness, two-pass, verified on the delivered file

Pass 1 measured the trimmed and faded excerpt. Pass 2 applied those values with
`linear=true`, which engaged.

```
pass 1 (measure)   I -16.19   TP -4.41   LRA 3.10   thresh -26.28   offset -1.17
pass 2 (apply)     Output Integrated -16.0 LUFS, True Peak -4.2 dBTP,
                   Normalization Type: Linear, Target Offset +0.0 LU
```

Re-measured after AAC encoding, by decoding the audio back out of
`facebook-scored.mp4`:

```
Integrated loudness  I:   -16.0 LUFS   (target -16)
True peak           TP:    -4.2 dBTP   (ceiling -1.5, so 2.7 dB under)
Loudness range     LRA:     3.1 LU
```

### Honest read on how it sounds

I cannot listen to it. What follows is measurement plus what the file is, and
someone should audition it once before it runs anywhere paid.

It is real music rather than a drone, on the two axes run 1's rejected
synthesized bed failed:

- **Stereo.** L and R differ on **100.00%** of samples, channel correlation
  **0.870**. The rejected bed was mono, L identical to R everywhere.
- **Movement.** The parent 60 s track measures LRA 6.80 LU. The rejected bed
  measured 1.50 LU, the number that says "static".

The honest qualification, and it is slightly worse than run 2's: this **26.4 s**
excerpt measures **LRA 3.10**, against run 2's 28 s excerpt at 3.60 and the
parent track's 6.80. A shorter window captures less of the arrangement's swing,
so this cut is calmer still. It is a bed under text and appropriate for that, but
do not quote 6.80 as if it described what is in this file.

Per-second RMS of the delivered audio, dBFS:

```
-21 -21 -22 -21 -20 -16 -16 -17 -16 -17 -16 -17 -16 -16 -17 -16 -17 -16 -16 -16 -15 -16 -15 -16 -15 -19
```

The quiet intro, the arrangement lifting at second 5, a steady body, and the fade
in the last second and a half are all visible in that row. The lift at second 5
lands almost exactly on the beat 1 to beat 2 cut at 4.500 s without anything
being moved to make it, which is a coincidence of this runtime rather than an
edit.

**Ship the silent master for the organic post.** Facebook favours audio picked
from its own in-app library. The scored cut is for paid, site embeds and decks.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow.
- Background is a generated **PNG** intermediate, never JPEG, so the pipeline
  stays limited-range `yuv420p` and does not pick up the `yuvj420p` shift.
- Background: canvas `#090A0F` with three soft radial glows (`#6366F1` upper
  right, `#7C3AED` lower left, `#8B5CF6` mid right) under a vignette, written by
  a dependency-free node PNG encoder (zlib from node core, hand-rolled CRC32,
  colour type 2). A 4x4 ordered dither is baked in at +/- 0.8 levels because an
  8-bit gradient at this size bands visibly without it. Dark only, no white
  anywhere. Measured peak luma 36.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 on two
  incommensurate sinusoids, `20*sin(2πt/31)` horizontally and `16*cos(2πt/23)`
  vertically, so the drift path does not repeat inside the runtime and the frame
  is never static while the type stays still. The 10% overscan guarantees the
  crop never reaches an edge (±54 px x, ±96 px y available against ±20 and ±16
  used).
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  SemiBold 64 px body, ExtraBold 70 px accent, ExtraBold 80 px domain, Bold 40 px
  wordmark. Nothing downloaded, nothing substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` scaled
  to 68 px, overlaid at an **even** `y` so `overlay`'s odd-y round-down on
  yuv420p cannot shift it away from the declared rect.
- Motion per line: 0.45 s fade in, 18 px horizontal slide from the left over
  0.50 s, 0.10 s stagger between lines within a beat, 0.30 s fade out. Beat 1 has
  none of these.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.png`, `logo.png`,
`fonts/`, `t/` (one file per rendered line) and `fc.txt`. Relative paths
throughout, deliberately, to avoid escaping the drive-letter colon inside
filtergraph options.

### 1. Background PNG

```sh
node bg.js bg.png      # dependency-free PNG writer, 1188x2112 rgb24
```

### 2. Silent master

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 26.4 -i bg.png \
  -loop 1 -framerate 30 -t 26.4 -i logo.png \
  -/filter_complex fc.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart \
  facebook-silent.mp4
```

### 3. Text-free control, for the diff method

Identical background pipeline and identical encoder settings, nothing drawn.

```sh
# fc_ctrl.txt:
# [0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+20*sin(2*PI*t/31)':\
# y='(in_h-out_h)/2+16*cos(2*PI*t/23)',format=rgb24,format=yuv420p[v]

ffmpeg -y -loop 1 -framerate 30 -t 26.4 -i bg.png \
  -/filter_complex fc_ctrl.txt -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart control.mp4
```

### 4. Music, trim, both fades, two-pass loudnorm

```sh
ffmpeg -y -t 26.4 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=24.9:d=1.5" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_cut.wav

# pass 1, measure
ffmpeg -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values linearly
ffmpeg -y -i music_cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.19:measured_TP=-4.41:measured_LRA=3.10:measured_thresh=-26.28:\
offset=-1.17:linear=true:print_format=summary" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_norm.wav
```

### 5. Scored cut

Video is copied, not re-encoded.

```sh
ffmpeg -y -i facebook-silent.mp4 -i music_norm.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  facebook-scored.mp4
```

### 6. Cover

```sh
ffmpeg -y -i facebook-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -c:v png \
  facebook-cover.png
```

### 7. The filtergraph, `fc.txt`

54 draw operations. `drawbox` takes no alpha expression and cannot animate, so
each accent rule fade is stacked static boxes on staggered `enable` windows.
Beat 1 has no fade in, no stagger and no slide, so frame 0 is a clean
fully-opaque still that doubles as the cover. Line files `t/l00.txt` through
`t/l17.txt` hold the beat lines in the order listed under "On-screen text" above,
one line of text per file, and `t/wordmark.txt` holds `BrandGEO`. Text is passed
by file rather than inline so the commas inside "ChatGPT, Gemini," need no
filtergraph escaping.

`md5(fc.txt) = 5b9b21d1ff046cb3371a61ec683f91a4`. Newlines below sit only at
filter boundaries and are cosmetic.

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+20*sin(2*PI*t/31)':y='(in_h-out_h)/2+16*cos(2*PI*t/23)',format=rgb24[bg];
[bg][lg]overlay=x=84:y=1320:format=rgb[bgl];
[bgl]drawbox=x=84:y=698:w=8:h=268:color=0xA78BFA@0.9:t=fill:enable='between(t\,0.000\,4.100)',
drawbox=x=84:y=698:w=8:h=268:color=0xA78BFA@0.55:t=fill:enable='between(t\,4.100\,4.250)',
drawbox=x=84:y=698:w=8:h=268:color=0xA78BFA@0.22:t=fill:enable='between(t\,4.250\,4.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l00.txt:x=120:y=704:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.100)\,1\,(4.400-t)/0.3)':enable='between(t\,0.000\,4.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l01.txt:x=120:y=800:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.100)\,1\,(4.400-t)/0.3)':enable='between(t\,0.000\,4.400)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l02.txt:x=120:y=896:fontsize=70:fontcolor=0xA78BFA:alpha='if(lt(t\,4.100)\,1\,(4.400-t)/0.3)':enable='between(t\,0.000\,4.400)',
drawbox=x=84:y=698:w=8:h=261:color=0xA78BFA@0.3:t=fill:enable='between(t\,4.600\,4.750)',
drawbox=x=84:y=698:w=8:h=261:color=0xA78BFA@0.6:t=fill:enable='between(t\,4.750\,4.900)',
drawbox=x=84:y=698:w=8:h=261:color=0xA78BFA@0.9:t=fill:enable='between(t\,4.900\,8.300)',
drawbox=x=84:y=698:w=8:h=261:color=0xA78BFA@0.55:t=fill:enable='between(t\,8.300\,8.450)',
drawbox=x=84:y=698:w=8:h=261:color=0xA78BFA@0.22:t=fill:enable='between(t\,8.450\,8.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l03.txt:x='120-18.0*(1-min(1\,max(0\,(t-4.600))/0.5))':y=704:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.600)\,0\,if(lt(t\,5.050)\,(t-4.600)/0.45\,if(lt(t\,8.300)\,1\,(8.600-t)/0.3)))':enable='between(t\,4.600\,8.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l04.txt:x='120-18.0*(1-min(1\,max(0\,(t-4.700))/0.5))':y=800:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.700)\,0\,if(lt(t\,5.150)\,(t-4.700)/0.45\,if(lt(t\,8.300)\,1\,(8.600-t)/0.3)))':enable='between(t\,4.700\,8.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l05.txt:x='120-18.0*(1-min(1\,max(0\,(t-4.800))/0.5))':y=896:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.800)\,0\,if(lt(t\,5.250)\,(t-4.800)/0.45\,if(lt(t\,8.300)\,1\,(8.600-t)/0.3)))':enable='between(t\,4.800\,8.600)',
drawbox=x=84:y=746:w=8:h=163:color=0xA78BFA@0.3:t=fill:enable='between(t\,8.800\,8.950)',
drawbox=x=84:y=746:w=8:h=163:color=0xA78BFA@0.6:t=fill:enable='between(t\,8.950\,9.100)',
drawbox=x=84:y=746:w=8:h=163:color=0xA78BFA@0.9:t=fill:enable='between(t\,9.100\,11.900)',
drawbox=x=84:y=746:w=8:h=163:color=0xA78BFA@0.55:t=fill:enable='between(t\,11.900\,12.050)',
drawbox=x=84:y=746:w=8:h=163:color=0xA78BFA@0.22:t=fill:enable='between(t\,12.050\,12.200)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l06.txt:x='120-18.0*(1-min(1\,max(0\,(t-8.800))/0.5))':y=752:fontsize=70:fontcolor=0xA78BFA:alpha='if(lt(t\,8.800)\,0\,if(lt(t\,9.250)\,(t-8.800)/0.45\,if(lt(t\,11.900)\,1\,(12.200-t)/0.3)))':enable='between(t\,8.800\,12.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l07.txt:x='120-18.0*(1-min(1\,max(0\,(t-8.900))/0.5))':y=848:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,8.900)\,0\,if(lt(t\,9.350)\,(t-8.900)/0.45\,if(lt(t\,11.900)\,1\,(12.200-t)/0.3)))':enable='between(t\,8.900\,12.200)',
drawbox=x=84:y=746:w=8:h=171:color=0xA78BFA@0.3:t=fill:enable='between(t\,12.400\,12.550)',
drawbox=x=84:y=746:w=8:h=171:color=0xA78BFA@0.6:t=fill:enable='between(t\,12.550\,12.700)',
drawbox=x=84:y=746:w=8:h=171:color=0xA78BFA@0.9:t=fill:enable='between(t\,12.700\,15.500)',
drawbox=x=84:y=746:w=8:h=171:color=0xA78BFA@0.55:t=fill:enable='between(t\,15.500\,15.650)',
drawbox=x=84:y=746:w=8:h=171:color=0xA78BFA@0.22:t=fill:enable='between(t\,15.650\,15.800)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l08.txt:x='120-18.0*(1-min(1\,max(0\,(t-12.400))/0.5))':y=752:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,12.400)\,0\,if(lt(t\,12.850)\,(t-12.400)/0.45\,if(lt(t\,15.500)\,1\,(15.800-t)/0.3)))':enable='between(t\,12.400\,15.800)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l09.txt:x='120-18.0*(1-min(1\,max(0\,(t-12.500))/0.5))':y=848:fontsize=70:fontcolor=0xA78BFA:alpha='if(lt(t\,12.500)\,0\,if(lt(t\,12.950)\,(t-12.500)/0.45\,if(lt(t\,15.500)\,1\,(15.800-t)/0.3)))':enable='between(t\,12.500\,15.800)',
drawbox=x=84:y=602:w=8:h=453:color=0xA78BFA@0.3:t=fill:enable='between(t\,16.000\,16.150)',
drawbox=x=84:y=602:w=8:h=453:color=0xA78BFA@0.6:t=fill:enable='between(t\,16.150\,16.300)',
drawbox=x=84:y=602:w=8:h=453:color=0xA78BFA@0.9:t=fill:enable='between(t\,16.300\,21.100)',
drawbox=x=84:y=602:w=8:h=453:color=0xA78BFA@0.55:t=fill:enable='between(t\,21.100\,21.250)',
drawbox=x=84:y=602:w=8:h=453:color=0xA78BFA@0.22:t=fill:enable='between(t\,21.250\,21.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l10.txt:x='120-18.0*(1-min(1\,max(0\,(t-16.000))/0.5))':y=608:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,16.000)\,0\,if(lt(t\,16.450)\,(t-16.000)/0.45\,if(lt(t\,21.100)\,1\,(21.400-t)/0.3)))':enable='between(t\,16.000\,21.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l11.txt:x='120-18.0*(1-min(1\,max(0\,(t-16.100))/0.5))':y=704:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,16.100)\,0\,if(lt(t\,16.550)\,(t-16.100)/0.45\,if(lt(t\,21.100)\,1\,(21.400-t)/0.3)))':enable='between(t\,16.100\,21.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l12.txt:x='120-18.0*(1-min(1\,max(0\,(t-16.200))/0.5))':y=800:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,16.200)\,0\,if(lt(t\,16.650)\,(t-16.200)/0.45\,if(lt(t\,21.100)\,1\,(21.400-t)/0.3)))':enable='between(t\,16.200\,21.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x='120-18.0*(1-min(1\,max(0\,(t-16.300))/0.5))':y=896:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,16.300)\,0\,if(lt(t\,16.750)\,(t-16.300)/0.45\,if(lt(t\,21.100)\,1\,(21.400-t)/0.3)))':enable='between(t\,16.300\,21.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x='120-18.0*(1-min(1\,max(0\,(t-16.400))/0.5))':y=992:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,16.400)\,0\,if(lt(t\,16.850)\,(t-16.400)/0.45\,if(lt(t\,21.100)\,1\,(21.400-t)/0.3)))':enable='between(t\,16.400\,21.400)',
drawbox=x=84:y=746:w=8:h=165:color=0xA78BFA@0.3:t=fill:enable='between(t\,21.600\,21.750)',
drawbox=x=84:y=746:w=8:h=165:color=0xA78BFA@0.6:t=fill:enable='between(t\,21.750\,21.900)',
drawbox=x=84:y=746:w=8:h=165:color=0xA78BFA@0.9:t=fill:enable='between(t\,21.900\,24.100)',
drawbox=x=84:y=746:w=8:h=165:color=0xA78BFA@0.55:t=fill:enable='between(t\,24.100\,24.250)',
drawbox=x=84:y=746:w=8:h=165:color=0xA78BFA@0.22:t=fill:enable='between(t\,24.250\,24.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l15.txt:x='120-18.0*(1-min(1\,max(0\,(t-21.600))/0.5))':y=752:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,21.600)\,0\,if(lt(t\,22.050)\,(t-21.600)/0.45\,if(lt(t\,24.100)\,1\,(24.400-t)/0.3)))':enable='between(t\,21.600\,24.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l16.txt:x='120-18.0*(1-min(1\,max(0\,(t-21.700))/0.5))':y=848:fontsize=64:fontcolor=0xE8E9ED:alpha='if(lt(t\,21.700)\,0\,if(lt(t\,22.150)\,(t-21.700)/0.45\,if(lt(t\,24.100)\,1\,(24.400-t)/0.3)))':enable='between(t\,21.700\,24.400)',
drawbox=x=84:y=788:w=8:h=81:color=0xA78BFA@0.3:t=fill:enable='between(t\,24.600\,24.750)',
drawbox=x=84:y=788:w=8:h=81:color=0xA78BFA@0.6:t=fill:enable='between(t\,24.750\,24.900)',
drawbox=x=84:y=788:w=8:h=81:color=0xA78BFA@0.9:t=fill:enable='between(t\,24.900\,26.100)',
drawbox=x=84:y=788:w=8:h=81:color=0xA78BFA@0.55:t=fill:enable='between(t\,26.100\,26.250)',
drawbox=x=84:y=788:w=8:h=81:color=0xA78BFA@0.22:t=fill:enable='between(t\,26.250\,26.400)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l17.txt:x='120-18.0*(1-min(1\,max(0\,(t-24.600))/0.5))':y=794:fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,24.600)\,0\,if(lt(t\,25.050)\,(t-24.600)/0.45\,if(lt(t\,26.100)\,1\,(26.400-t)/0.3)))':enable='between(t\,24.600\,26.400)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=168:y=1340:fontsize=40:fontcolor=0xE8E9ED:alpha='0.72',format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> When someone asks an AI about your line of work, it does not just hand back a
> list of names. It hands back a sentence or two about each one. What it says
> about you is a separate thing from whether it lists you at all.
>
> You did not write that sentence. You were not asked to check it. It can be out
> of date, it can be describing the business you were three years ago, and it
> still arrives in front of a buyer with your name on it.
>
> BrandGEO reads how ChatGPT, Gemini, Claude, Perplexity and Google AI Mode
> describe your business, so you can read it before your buyer does.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition `facebook-scored.mp4`.** The music has been measured, not heard.
   Stereo and level are good, but this 26.4 s excerpt measures LRA 3.10, below
   run 2's 3.60 and well below the parent track's 6.80, because the window is
   shorter. See the honest read above.
2. **`RUN.md` for run 20260730-0513 has not been written.** The brief asks each
   run to record its hook driver in `run-<stamp>/RUN.md`, one level above this
   folder and outside this task's write scope. Driver **#2, status threat,
   second pass**, track `tension-minor`, for this run.
3. **The A/B this run exists to enable.** Run 2 and this cut share a driver and
   share nothing else. Compare them against each other before comparing either
   against a different driver. The single largest execution variable between
   them is cadence: 6 uniform beats over 28.0 s versus 7 uneven beats over
   26.4 s. Second largest is that run 2's copy is about a rival and this one's
   is about a description, which means they may attract different audiences even
   though the psychological driver is the same. If they diverge, that is the
   first hypothesis to test, not the driver.
4. **The right edge has 45 px of clearance** and two lines tie for it,
   `describe your business.` and `before your buyer does.` Any copy edit that
   lengthens either needs the per-line measurement rerun before upload.
5. **Nothing in this cut is sourced to a research page**, deliberately. If a
   later run wants to put a number behind the misdescription claim, note that
   BrandGEO has no published measurement of description accuracy, only of
   mention and position. That number would have to be collected first, not
   found.
