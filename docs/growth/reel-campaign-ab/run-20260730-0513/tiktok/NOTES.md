# TikTok cut, run-20260730-0513

**Hook driver:** #2, status threat. **Second pass.** Run `20260729-2318` argued
status threat as OCCUPANCY: somebody else is standing in your slot. This cut
argues it as MISDESCRIPTION: you are in the answer, and the answer is wrong
about you. Nothing in the shape or the wording is carried over.

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. Paid, site embeds, decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, verified byte-identical. |

---

## On-screen text, verbatim

Every line is a separate `drawtext`. Line breaks in the table are literal line
breaks on screen. Boundaries below were recovered by decoding all 930 frames of
the delivered master and detecting ink-count step changes; all 16 cuts land on
the designed frame (`identical: True`), so this table is measured, not asserted.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `AN AI JUST` |
| 2 | 14 | 0.400 to 0.867 | `AN AI JUST` / `DESCRIBED YOU.` |
| 3 | 20 | 0.867 to 1.533 | `AN AI JUST` / `DESCRIBED YOU.` / `TO A BUYER.` (accent) |
| 4 | 48 | 1.533 to 3.133 | `YOU WERE NOT` / `IN THE ROOM.` |
| 5 | 21 | 3.133 to 3.833 | label `FOR EXAMPLE` + row `wrong category` |
| 6 | 21 | 3.833 to 4.533 | + row `old pricing` |
| 7 | 30 | 4.533 to 5.533 | + row `a dropped service` |
| 8 | 78 | 5.533 to 8.133 | the three rows, plus `YOU ARE LISTED.` / `AND MISREAD.` |
| 9 | 60 | 8.133 to 10.133 | `BEING ABSENT` / `IS QUIET.` |
| 10 | 63 | 10.133 to 12.233 | `BEING WRONG` / `SOUNDS RIGHT.` |
| 11 | 72 | 12.233 to 14.633 | `AND IT ANSWERS` / `BEFORE YOU DO.` |
| 12 | 54 | 14.633 to 16.433 | `YOU CANNOT` / `EDIT IT.` |
| 13 | 60 | 16.433 to 18.433 | `BUT YOU CAN` / `READ IT.` (accent) |
| 14 | 84 | 18.433 to 21.233 | label `WE READ FIVE` + `ChatGPT` / `Gemini` / `Claude` / `Perplexity` / `Google AI Mode` |
| 15 | 66 | 21.233 to 23.433 | the five engines, plus `WORD FOR WORD.` (accent) |
| 16 | 78 | 23.433 to 26.033 | `THEN YOU FIX` / `WHAT THEY READ.` |
| 17 | 149 | 26.033 to 31.000 | `SEE HOW THE` / `AI DESCRIBES` / `YOU.` (accent) plus logo and `getbrandgeo.com` |

Persistent on every frame: `BRANDGEO` at the BOTTOM of the safe zone, and a
vertical violet rail down the left margin that fills as the cut runs.

### Why this copy, and how it avoids run 2's spine

Run 2's argument was occupancy: `YOUR RIVAL / IS THE ANSWER. / NOT YOU.`, then
three slots none of which are yours, then `THAT IS NOT A RANKING. / IT IS A
DEFAULT. / AND A DEFAULT GETS REPEATED.` The threat was that somebody else
holds the position.

This cut takes the shape the coordinator flagged as available and TikTok-shaped:
**named but described wrongly.** The reveal is a twist, not a build. Scenes 1 to
3 hand you a reassurance (an AI is talking about you, to a buyer) and scene 4
takes it back in five words. What an engine SAYS about you is a separate fact
from whether it LISTS you, and the second one is the one every visibility pitch
already talks about.

The escalation then goes somewhere occupancy cannot: scenes 9 and 10 contrast
the two losses directly. `BEING ABSENT / IS QUIET.` against `BEING WRONG /
SOUNDS RIGHT.` Absence at least leaves a gap you can guess at. A wrong
description is fluent, confident and gets taken at face value, which is why it
is the worse of the two and why it needs an instrument rather than an instinct.
Scene 11 is the mechanism (it reaches the buyer before you do), scene 12 is the
trap (you have no edit button on someone else's model), scene 13 is the turn,
and it is a small one on purpose: reading is the only move available, and it is
enough.

No line, no ordering and no device is reused from run 2. Specifically **not**
reused: the three-row answer card that names competitor slots, `THAT IS NOT`,
the ranking/default distinction, the repetition-over-time beat, `SO WE ASK`, the
`WE ASK ALL FIVE` label, the buyer-prompts line, and `SEE WHO THE AI PREFERS`.
The engine roster survives because it is the product, but its ROLE is different:
in run 2 it answered "who do we ask", here it answers "how many descriptions of
you already exist".

**The first 1.5 seconds carry three state changes.** Ink-pixel counts, measured
on frames decoded out of the delivered master:

```
t=0.000  frame   0   ink 20,623 px
t=0.400  frame  12   ink 39,312 px   (+18,689)
t=0.867  frame  26   ink 51,775 px   (+12,463)
t=1.533  frame  46   ink 40,986 px   (-10,789)   full replace, new block
```

Frame 46 is the twist landing, and it is a subtraction rather than an addition,
which is a different visual event from the three preceding additions.

### Factual position

- **No percentage, rate, count of cities, or measured result appears anywhere.**
  Nothing needs a `bg-*.html` source because nothing is asserted as a
  measurement. `bg-016.html` and `bg-004.html` are not used. No "27 cities".
- The card in scenes 5 to 8 is labelled `FOR EXAMPLE` on screen, in the reader's
  eyeline, before the first row appears. That label is the whole reason the card
  is safe: `wrong category`, `old pricing` and `a dropped service` are shapes a
  wrong description takes, not a captured answer, and the framing says so rather
  than relying on the viewer to infer it.
- The only number on screen is `FIVE`, and it is a lineup count for TODAY, not a
  property of any finding. Verified against `planConfig.ts` `PLAN_ENGINES.growth`
  = `['chatgpt','gemini','claude','perplexity','google_ai']`, which is exactly
  the five drawn. Grok and AI Overviews are live but Growth PRO and up and carry
  one day of data, so they are neither named nor rated. Meta AI is retired and
  absent.
- **No measured subject is named.** Every proper noun drawn is an engine
  (`ChatGPT`, `Gemini`, `Claude`, `Perplexity`, `Google AI Mode`) or our own
  brand. No company, client or research subject appears.
- No superlative. No universal. No pricing, no plan names. TOFU, soft CTA.

### The banned-token scan ran on the drawn bytes

A scanner parsed `text='...'` back out of the 17 filtergraph files that were
actually handed to ffmpeg, not out of the copy module and not out of the brief.
69 drawn strings, 35 unique, exit 0.

```
PASS: no dashes, no banned style words, no superlatives, no universals
FLAGS needing a judgement call: ['cannot']
number-like tokens on screen: ['five']
```

**The `cannot` flag was adjudicated, not auto-rewritten**, per the brief's
2026-07-30 refinement. `YOU CANNOT / EDIT IT.` describes ONE viewer's position
with respect to a model they do not own. It quantifies over nothing and no
counterexample about other people can refute it. It stays. Had it read "nobody
can edit it", that would be a claim about every person and would have been
rewritten.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right, the tightest of the four.
Usable box is `y 200..1559`, `x ..879`. Every number below comes from frames
decoded out of the **delivered** `tiktok-silent.mp4`.

### Ink threshold, argued from a measured control

```
text-free control, identical pipeline:   gray min 9  max 9   (only value present: 9)
dimmest colour deliberately drawn:       29    rail track   #1B1D2B
next dimmest:                            96    rule         #7C3AED
rail fill:                              122    #8B5CF6
accent text peak:                       159    #A78BFA
brightest:                              231    ink          #E8E9ED
```

The background is one flat value with zero variance, so 10 to 28 is empty.
**Threshold 11** sits just above the canvas rather than in the middle of the
gap, so every antialiased glyph skirt is counted and the reported box can only
be larger than the design box, never smaller.

The result is not threshold-sensitive. Full sweep, union over all 930 frames:

```
thr  10   x 100..814   y 260..1472
thr  11   x 100..814   y 260..1472      <- reported
thr  15   x 100..814   y 260..1471
thr  20   x 100..814   y 260..1471
thr  24   x 100..814   y 260..1471
thr  40   x 100..814   y 260..1471
thr  60   x 100..814   y 260..1471
thr  96   x 100..814   y 260..1471
```

One pixel of vertical movement between threshold 11 and 15, none anywhere else,
including at 96 where the rail track (luma 29) drops out entirely and the box
does not change. Nothing in the layout depends on where the threshold sits.

### Method B: diff against a text-free control, with a measured noise floor

The control is a flat canvas pushed through the **identical** encode
(`-framerate 30` numbered sequence, `libx264 -preset slow -crf 18`,
`-profile:v high -level 4.0`, `yuv420p`, same frame count), so it carries the
same codec artefacts. The noise floor was measured in three regions that are
empty by design, on all 17 scene midpoints, before any threshold was picked:

```
y1600..1900  (below every drawn element)     max |delta| = 0
x900..1079   (right of the text column)      max |delta| = 0
y0..230      (above the rail)                max |delta| = 0
-> diff threshold 1, i.e. one above the measured floor
```

The floor really is zero here, which is worth stating because run 5's Facebook
build measured 7 in the same test. The difference is content density: this
canvas is flat and the ink is sparse, so x264 at crf 18 reproduces the empty
regions bit-exactly and the encoder's response to content does not leak into
them. The floor was still measured rather than assumed, because it is not
predictable in advance.

```
method A (gray, thr 11, all 930 frames):    x 100..814   y 260..1472
method B (rgb24 vs control, delta > 1):     x  94..815   y 256..1479
```

B runs 6px wider on the left, 1px wider right and 7px lower, because
single-channel fringing survives an RGB max-channel comparison and is averaged
away by the gray conversion. **B is taken wherever it is larger**, per the
brief's rule, and it is confirmed to be measuring ink rather than a codec
artefact: it does not touch the frame edge on any side, which is the signature
of the yuv420p row-0 artefact that produced a false failure on run 3.

### Method C: declared rects, for what no pixel method can see

41 rects were recorded at draw time (the rail track, 17 rail fills, 17
wordmarks... every `drawbox`, plus the logo overlay). Their union is
`x 100..339  y 260..1399`, inside both measured boxes. The overlay `y` is 940,
already even, so the `overlay`-rounds-odd-`y`-down trap cannot bite; the
declared rect and the effective rect are the same.

This build has no dark-on-dark element: the dimmest thing drawn is the rail
track at luma 29 against a canvas of 9, a 20-step separation that both pixel
methods resolve. The declared union is therefore a redundancy here rather than
the only witness, which is the desired state.

### Reported box, union of all three methods

```
UNION           x  94..815     y 256..1479
limits          x    ..879     y 200..1559
headroom        top 56px       bottom 80px       right 64px
verdict         ALL 930 FRAMES INSIDE THE TIKTOK SAFE ZONE
```

Every edge clears the 20px minimum by at least a factor of two and a half.
`verify.py` exits non-zero if any edge falls under 20.

### Type alone, per scene

Same threshold with the left rail (`x < 140`) and the bottom wordmark
(`y >= 1440`) excluded, so this is what the copy itself does:

```
scene01  x 140..547  y  604.. 659      scene10  x 140..707  y  699.. 851
scene02  x 140..739  y  604.. 755      scene11  x 141..775  y  697.. 851
scene03  x 140..739  y  604.. 851      scene12  x 140..631  y  699.. 848
scene04  x 141..698  y  698.. 851      scene13  x 144..639  y  700.. 848
scene05  x 140..475  y  520.. 651      scene14  x 140..479  y  520.. 971
scene06  x 140..475  y  520.. 731      scene15  x 140..791  y  520..1116
scene07  x 140..523  y  520.. 811      scene16  x 141..814  y  700.. 848
scene08  x 140..746  y  520..1052      scene17  x 140..635  y  619..1071
scene09  x 144..672  y  700.. 852
```

Widest real type is scene 16, `WHAT THEY READ.` ending at `x1 = 814`, **65px**
clear of the limit.

### How the headroom was designed in, then confirmed

Column geometry was fixed before the first render: pen `x = 140`, budget 680px,
so the design right edge is 820 and 59px sits inside the 879 limit by
construction. The headline size is then **fitted by measurement, not chosen**:
every one of the 23 unique headline lines is rendered alone at 100pt, its real
ink width read off a decoded frame, and the largest size on the ladder
78/72/66/60/54 whose widest line fits 680px is taken.

```
widest at 100pt   937px   WHAT THEY READ.
78pt -> predicted 730.9px   over budget
72pt -> predicted 674.6px   FITS      <- chosen
```

Run 2 cleared at 78pt with a 720px column; this build's longest line is two
characters longer and its column is 40px narrower, so the ladder stepped down
once. That is the fitter working, not a compromise.

Because point-size scaling of a hinted TTF is not exactly linear, the 23 lines
were then **re-rendered at 72pt and re-measured**, not trusted to the scaling:
widest real 675px against the 680px budget, one line coming within 5px of it.
The pass/fail number is always the box measured out of the delivered mp4, and
that number is 815.

---

## Duration, exact ffprobe of the delivered files

```
tiktok-silent.mp4   format 31.000000   nb_streams 1
                    video  31.000000   930 frames   duration_ts 476160 @ 1/15360
                    1080x1920  30/1  yuv420p  h264

tiktok-scored.mp4   format 31.000000   nb_streams 2
                    video  31.000000   930 frames   duration_ts 476160 @ 1/15360
                    audio  31.000000  1455 frames   duration_ts 1488000 @ 1/48000
```

31.000000s, inside the 25 to 40s TikTok target. 930 frames at 30fps is exactly
31.000s with no rounding anywhere, because the timeline is a numbered frame
sequence rather than a duration list.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns nothing and
`nb_streams=1`. That is what `-an` buys.

**The scored cut did not drift.** Decoding its AAC yields 1,488,896 samples
(31.0187s of raw payload) while `duration_ts` is 1,488,000 samples exactly, so
the trailing 1,024-sample quantisation tail is excluded by the stream duration
rather than played. `-shortest` pins it. Checked, not assumed.

Video is stream-copied into the scored variant. Full video-stream MD5 is
`eec0a9cb0d269e7796d4480ed603c2f1` on **both** files, so every picture
measurement above holds for the scored cut too.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded
master, 1080x1920 rgb24. Raw rgb24 MD5 of the cover and of frame 0 of
`tiktok-silent.mp4` both read `b8df5a230d9c4e64b995dc7092ce4c4c`.
Byte-identical.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build.
Frame 0 measures 20,623 ink pixels; a faded frame 0 would measure 0. The
thumbnail the feed picks up is `AN AI JUST` at full opacity.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed via
`scripts/compose_music.py`, owned outright, no third-party material, cleared for
commercial use including paid advertising, and it carries **no attribution
line** (`assets/audio/ATTRIBUTION.md` line 65). 60.000s source, 48kHz stereo
24-bit, C minor at 100 BPM. Held CONSTANT across this campaign by design: the
hook is the variable under test, so varying the bed would leave a winning run
with two explanations. Nothing was downloaded and nothing was synthesized for
this cut.

Trimmed to 31.000s, 1.5s fade out starting at 29.5s, 0.08s fade in. The fade in
is mandatory rather than cosmetic: the source is already at 0.195 peak inside
its first 0.1s, so starting playback at sample 0 would click.

**Verified on the DELIVERED file, not on the intermediate wav.** Decoding
`tiktok-scored.mp4`'s audio to f32:

```
first 64 samples, peak |amplitude|   0.002975     required < 0.005   OK
samples 0..7 (L)   0.000153  0.000179  0.000214  0.000250
                   0.000293  0.000307  0.000282  0.000300
last 64 samples, peak                0.000000     fade out lands on silence
whole-file peak                      0.608876
```

Loudness, two-pass `loudnorm` with `linear=true`, re-measured on the delivered
mp4:

```
pass 1 measured:   I -16.13   TP -4.41   LRA 3.60   thresh -26.18   offset -1.12
pass 2 applied:    linear=true, I=-16, TP=-1.5, LRA=11
delivered file:    I -16.02   TP -4.28   LRA 3.60
```

Integrated lands at -16.02 LUFS, 0.02 LU off target after AAC encoding. True
peak is -4.28 dBTP, well under the -1.5 ceiling rather than at it: linear mode
applies one flat gain, so the peak falls wherever the integrated target puts it.
-1.5 is a ceiling not to exceed, so this is compliant with 2.8dB spare.
Single-pass was not used; pass 1 shows it would have landed at -14.88.

**Honest read: nobody has listened to this file.** Everything above is
measurement. `astats` on the delivered cut: peak -4.31 dBFS, RMS -16.48 dBFS,
crest factor 3.98 / 4.12, flat factor 0 (no clipped runs). LRA is 3.60 LU over
this 31s window against 6.80 LU over the full 60s track, so the excerpt is
noticeably less dynamic than the whole piece. The mix is centre-dominant by
construction, side-to-mid -11.2 dB, so it will not read as wide on a phone
speaker. The cuts are driven by reading time and the track runs at a fixed 100
BPM, so picture and music are not locked; where they agree it is coincidence.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph
option value terminates the option even when the value is quoted, so
`fontfile=C:/...` fails to parse.

**1. Type fitter**, run before any scene is drawn. Each unique line alone on a
2600x400 canvas, ink width read off a decoded frame:

```
ffmpeg -hide_banner -loglevel error -y -f lavfi -i color=c=0x090A0F:s=2600x400 \
  -filter_complex "[0:v]drawtext=fontfile='fonts/Inter-ExtraBold.ttf':\
text='WHAT THEY READ.':x=0:y=100:fontsize=100:fontcolor=0xE8E9ED[out]" \
  -map "[out]" -frames:v 1 -f rawvideo -pix_fmt gray -
```

**2. Scene stills**, one PNG per scene, 17 total, filtergraph written to a file:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex scenes/gNN.txt -map "[out]" \
  -frames:v 1 -update 1 -pix_fmt rgb24 scenes/sNN.png
```

Scene 17 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=140:940[out]`. A representative
graph body, scene 8:

```
[0:v]drawbox=x=100:y=260:w=6:h=1140:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=260:w=6:h=337:color=0x8B5CF6@1:t=fill:replace=1,
drawtext=fontfile='fonts/Inter-Bold.ttf':text='BRANDGEO':x=140:y=1450:fontsize=30:fontcolor=0xA78BFA,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':text='FOR EXAMPLE':x=140:y=520:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=140:y=574:w=200:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':text='wrong category':x=140:y=610:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':text='old pricing':x=140:y=690:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-SemiBold.ttf':text='a dropped service':x=140:y=770:fontsize=44:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-ExtraBold.ttf':text='YOU ARE LISTED.':x=140:y=900:fontsize=72:fontcolor=0xE8E9ED,
drawtext=fontfile='fonts/Inter-ExtraBold.ttf':text='AND MISREAD.':x=140:y=995:fontsize=72:fontcolor=0xE8E9ED[out]
```

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending
would have worked, but run 1's vanished-at-alpha-0 violet rule is cheap enough
to make structurally impossible rather than to reason about per call.

The rail is drawn as 17 static boxes, one per scene still, each with its own
height. `drawbox` cannot animate on 8.1.2 (no `eval` option, `x/y/w/h`
evaluated once at init), so an expression like `h='1140*t/31'` would have
silently frozen at its t=0 value. It moving was confirmed by measuring the rail
fill's bottom row on the delivered file, at every scene midpoint, against the
designed heights:

```
scene    01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16   17
designed 40  40  56 115 141 167 203 299 373 450 538 604 678 781 862 957 1140
measured 40  40  56 115 141 167 203 299 373 450 538 604 678 781 862 957 1140
max |designed - measured| = 0
```

Scenes 1 and 2 read the same because the fill clamps to a 40px minimum so the
rail is visible on frame 0; it is strictly increasing from scene 2 onward.

**3. Silent master.** No ffconcat anywhere. Each scene PNG is copied into a
numbered frame sequence, `f` copies for an `f`-frame scene, so the timeline is
frame-exact by construction rather than by cumulative float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames/f%05d.png \
  -vf "format=yuv420p" -frames:v 930 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an tiktok-silent.mp4
```

`-an` is what makes this a true silent master rather than a silent audio track.

**4. Text-free control**, the same command over 930 copies of a blank canvas
PNG, so it shares every codec artefact and differs only in content.

**5. Cover**, the literal first frame:

```
ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 \
  -frames:v 1 -update 1 tiktok-cover.png
```

**6. Scored cut:**

```
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 31.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=29.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.13:measured_TP=-4.41:\
measured_LRA=3.60:measured_thresh=-26.18:offset=-1.12:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**7. Verification.** All 930 frames are decoded sequentially in ONE pass and
indexed. `-ss` is not used to sample near a cut: seeking lands on the
neighbouring scene often enough to make a boundary check meaningless.

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 \
  -f rawvideo -pix_fmt gray -
```

Scene boundaries come from ink-count step changes, never from frame hashing:
H.264 gives visually identical frames different quantisation noise, so hashes
differ inside a scene and can collide across one. 16 cuts detected, 16 designed,
`identical: True`.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, `#7C3AED` for the label
rule, `#8B5CF6` for the rail fill, `#1B1D2B` for the rail track. **`#8B5CF6` is
used for no text anywhere**; it measures 4.2:1 on this canvas and fails. Inter
ExtraBold 72 for headlines, SemiBold 44 for rows, SemiBold 30 for labels, Bold
30 for the wordmark, Medium 34 for the URL. All vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Logo is
`docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` scaled to 132.
Dark only.

## How the EXECUTION differs from run 2, deliberately

Same driver, so the execution had to move or the A-B would be testing nothing:

| | run 2 (`20260729-2318`) | this run |
|---|---|---|
| Timeline | ffconcat list with per-scene `duration` | numbered frame sequence at `-framerate 30` |
| Persistent furniture | horizontal progress bar at the bottom of the safe zone, `B R A N D G E O` eyebrow at top left | vertical rail down the left margin, `BRANDGEO` at the bottom |
| What sets the ink box | the progress bar, on every frame and every edge | the type itself, on the right edge |
| Text pen x | 100 | 140 |
| Column budget | 720 | 680 |
| Headline size | 78pt (ladder never stepped) | 72pt (ladder stepped once, measured) |
| Scenes / frames | 19 / 960 / 32.000s | 17 / 930 / 31.000s |
| Diff threshold | fixed delta > 2 vs assumed canvas colour | measured noise floor (0), threshold set at 1 |
| Banned-token check | prose argument in NOTES | `scan.py` over the drawn `text='...'` strings, exit non-zero |

The furniture change is the load-bearing one. Run 2's progress bar spanned the
full text column on every frame and therefore set `x0`, `x1` and `y1` by itself,
which means its safe-zone number told you almost nothing about the copy. Moving
the same progress signal to a 6px vertical rail hands the right edge back to the
type, so the measured box is now a fact about the words.

## Open items

- The card rows are generic on purpose so the cut works for any vertical, and
  they are labelled `FOR EXAMPLE` so nothing reads as captured. A version built
  on a real anonymised misdescription would hit considerably harder and would
  need a sourced finding that survives the never-name-a-subject rule.
- `BEING ABSENT / IS QUIET.` and `BEING WRONG / SOUNDS RIGHT.` are the two lines
  carrying the whole differentiation and they get 2.0s and 2.1s. If this driver
  reads well, take time from scene 4 and give it to those two.
- Nobody has heard the scored cut. See the music section.
