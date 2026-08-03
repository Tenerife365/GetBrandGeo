# YouTube Shorts, run 20260730-0513

Hook driver: **#2, status threat. SECOND PASS.** Run `20260729-2318` also ran
status threat. If that cut performs, nothing in the data tells us whether the
DRIVER works or whether that particular edit worked. A second, deliberately
different execution is the only thing that separates them, so this cut shares run
2's driver and shares nothing else: not its spine, not its opening, not its
device, not its CTA, and not one line.

Run 2's spine was **occupancy**: a rival already holds the position, the
occupancy is stable across repeat asks and across engines, and there is no second
slot. This cut's spine is **mis-description**: you are in the answer, and the
sentence attached to your name was written by something else. Absence is not the
threat here. Being present and narrated badly is.

That shape was chosen over the other two available because it is the only one
that is also a product fact. What an engine SAYS about you is stored separately
from WHETHER it lists you (`ai_results.response_snippet`, `.sentiment`,
`.brand_position` alongside `.brand_mentioned`), so the cut can end on a real
capability rather than on a restatement of the fear.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## How this differs from run 2, and why each difference was chosen

`docs/growth/reel-campaign-ab/run-20260729-2318/youtube/NOTES.md` was read in
full before a word of this was written.

| | Run 2 (20260729-2318) | This cut (20260730-0513) |
|---|---|---|
| Spine | **occupancy**. Someone holds the slot | **mis-description**. You hold a slot and did not write its contents |
| Opens on | a rival: `Someone is already the default answer in your category.` | an artefact: `There is a sentence about your company that you did not write.` |
| Grammatical subject of the hook | an unnamed competitor | a text object. The competitor never appears in this cut at all |
| What is at stake | the position | the wording, and the standing the wording assigns |
| Central device | repetition. `Ask again tomorrow. Same name. Ask another engine. Same name.` | contrast between two facts about the same answer: named, versus described |
| Claim about engines | they **converge**. One answer, one name, `no page two of an answer` | they **diverge**. `Each engine writes its own version. They do not have to agree.` |
| Mechanism beat | `Engines build that answer from what they can read about each company.` | cut entirely. Replaced by an asymmetry: `Your buyer reads one of them. You are not sent a copy.` |
| Product beat | `BrandGEO asks the questions your buyers ask, then records who gets named.` | `BrandGEO puts your buyers' questions to the engines and reads the answers.` then a second scene on what is recorded |
| List header | `Every run, across` | `The same questions, put to each engine:` |
| CTA | `Find out whose name comes back.` | `See what the answer says about you.` |
| Scenes / length | 9 / 41.8 s | 10 / 43.0 s |

Three of those are constraints from the run brief rather than preferences.

**The convergence claim had to go, and inverting it was the cheapest honest
move.** Run 2's strongest structural beat is that every engine returns the same
name. Reusing it would make this a re-render. Asserting the opposite is not a
rhetorical trick, it is the more defensible of the two: five independently
trained systems generating free text about the same company have no mechanism
forcing them to agree, and BrandGEO stores a separate row per engine precisely
because they do not.

**The mechanism beat was cut rather than rephrased.** "Engines build that answer
from what they can read" is run 2's scene 6. Any rewording of it is the same
beat wearing a different coat, so the slot was given to a different idea
entirely: the answer is delivered to the buyer and not to you. That is also the
sharper line, because it is the one a viewer cannot argue with.

**The product beat was rewritten after a mechanical check caught it.** The first
draft read `BrandGEO asks the questions your buyers ask about your category`,
which shares a seven-word run with run 2's scene 7. An n-gram diff of this cut's
drawn strings against run 2's rendered lines surfaced it; it was not caught by
reading. After the rewrite the only overlap left is the engine list and the URL:

```
EXACT line matches: chatgpt, claude, gemini, perplexity, google ai mode, getbrandgeo.com
shared 4-grams:     only spans inside the engine list
shared 3-grams:     only spans inside the engine list
```

That residue is fixed brand furniture and cannot be varied without lying about
the lineup.

**A shape deliberately left unused.** "A peer you consider an equal is named
while you are not" is the third status-threat shape and it is reserved for a
third pass. It sits closer to run 2's occupancy argument than mis-description
does, so spending it here would have produced a weaker separation. The
"category defined without you in it" shape was also passed over, on the grounds
that it drifts toward driver #4's territory (contrarian, "ranking first in
Google does not mean you exist in AI") and would contaminate two comparisons at
once.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all**, `nb_streams=1`. Pick a track from YouTube's own audio library at upload. |
| `youtube-scored.mp4` | Same picture, video bitstream copied byte for byte, plus the BrandGEO track. For paid, site embeds and decks. |
| `youtube-cover.png` | Frame 0, 1080x1920, byte identical to the delivered master's first frame. |

On the filename: the campaign brief's deliverables list says `*-bed.mp4`, which
belongs to the superseded synthesized-bed approach that the composed-track
library replaced. Every run since has shipped `-scored.mp4` and the run brief for
this one asks for it by that name.

---

## On-screen text, verbatim

Ten scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule, centred on
the same axis as the type (x 438 to 521, axis 480). Line breaks below are the
actual rendered line breaks. Ink is `#E8E9ED`, accent is `#A78BFA`.

**1. 0.00 to 4.10 s**, hard start, no fade. This is the cover. Inter Bold 56, all ink.

```
There is a sentence
about your company
that you did not
write.
```

**2. 4.10 to 8.20 s**, Bold 56, all ink

```
It is what an AI
engine says when
someone asks about
your category.
```

**3. 8.20 to 12.40 s**, first two lines Bold 56 ink, last two SemiBold 52 accent

```
Being named in that
answer is one thing.

What it says about
you is another.
```

**4. 12.40 to 16.60 s**, first two lines Bold 56 ink, last two SemiBold 52 accent

```
You can be named
and still be the
comparison, not
the recommendation.
```

**5. 16.60 to 20.70 s**, Bold 56, all ink

```
Each engine writes
its own version.

They do not have
to agree.
```

**6. 20.70 to 24.60 s**, first two lines Bold 56 ink, last two SemiBold 52 accent

```
Your buyer reads
one of them.

You are not sent
a copy.
```

**7. 24.60 to 28.70 s**, Bold 56, all ink

```
BrandGEO puts your
buyers' questions
to the engines and
reads the answers.
```

**8. 28.70 to 33.00 s**, first two lines Bold 56 ink, last two SemiBold 52 accent

```
It records whether
you are named, and
what the answer
says about you.
```

**9. 33.00 to 38.00 s**, header SemiBold 48 accent, list Inter Medium 50 ink

```
The same questions,
put to each engine:

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**10. 38.00 to 43.00 s**, logo 196 px, then Bold 56 ink, then SemiBold 50 accent

```
[BrandGEO icon, 196 px]

See what the answer
says about you.

getbrandgeo.com
```

### Compliance, run as a script over the DRAWN BYTES

The brief is explicit that an instruction is not evidence of what shipped, so the
checks run on the `s<scene>-l<line>.txt` files that ffmpeg's `textfile=` actually
read, not on this document and not on the run brief. `scan.py` exits non-zero on
any hit.

```
scanned 42 drawn strings, 679 chars

1. em/en/figure/minus dashes ......... none
2. banned vocabulary ................. none
3. superlatives ...................... none
4. universals over people ............ none
5. digits on screen .................. none
6. pricing or currency ............... none
7. unallowed proper nouns ............ none
8. engine list ....................... ['ChatGPT','Gemini','Claude','Perplexity','Google AI Mode']   off-lineup: none

SCAN PASSED     exit 0
```

Notes on the individual checks:

**Superlatives (3).** The scanner treats `first`, `only`, `most`, `biggest`,
`largest`, `best`, `leading`, `top`, `#1`, `number one`, `unmatched` and
`fastest` as unconditional failures rather than as prompts to judge, because a
superlative is a claim about every OTHER page in the corpus and the page
asserting it is the one source that cannot confirm it. None appears. Note this
also rules out `Not the top result`, which is run 2's scene 2 and would have
tripped the scanner today.

**Universals (4).** Run under the 2026-07-30 refinement: the test is whether a
word QUANTIFIES OVER PEOPLE, not whether it appears. Zero hits, so no
hand-classification was needed. Worth recording that the copy was written to
avoid needing the exemption at all: scene 6 says `You are not sent a copy`
rather than "nobody sends you a copy", and scene 5 says `They do not have to
agree` rather than "they never agree". `Each engine writes its own version`
quantifies over the five instruments, not over people, and is true by
construction since each engine is queried and stored separately.

**Numbers (5).** No digit appears anywhere on screen. Nothing here needs to
trace to a measurement, which is the cheapest way to satisfy the factual limit
and costs this hook nothing: mis-description is an argument about wording, not
about magnitude. Specifically, no figure was taken from `bg-005.html`, whose 48%
and 93% are third-party and trace to no BrandGEO measurement. `bg-016.html` was
not sourced. No engine count from `bg-004.html`. No city count. No Grok or AI
Overviews rate.

**Engine lineup (8).** Exactly the five on Growth per
`brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
`perplexity`, `google_ai`. Meta AI absent, retired. Copilot and DeepSeek absent,
on no purchasable plan. Grok and AI Overviews absent, and no rate for either,
both being one day old. The list is named but never counted, so the copy carries
no denominator to go stale.

**Measured subjects (7).** The allowlist is the five engines, `BrandGEO`,
`getbrandgeo.com` and `AI`, matched longest-first with non-maximal spans
discarded so `Google` and `Google AI` cannot come back as subjects by being
sub-spans of `Google AI Mode`. No company, firm or person that turned up inside
a result set is named. No competitor is named. The cut's central antagonist is a
sentence, not a party, which is the one structural advantage this spine has over
run 2's: occupancy needs a rival to point at, mis-description does not.

**One line a reviewer should push on.** Scene 4, `You can be named and still be
the comparison, not the recommendation.` It is modal on purpose. It asserts that
this outcome is possible, which follows from engines generating comparative free
text, and it does not assert that it happened to the viewer or state any rate at
which it happens. If it read "you ARE the comparison" it would be a measurement
this cut has not made.

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Measured against the **delivered** `youtube-silent.mp4`, not the PNG
intermediates, over **all 1290 frames**, by three independent methods, plus the
declared rectangle of the one element no pixel method can see.

### Justifying the ink threshold

Not chosen by feel. The plate generator prints its own peak, and a text-free
control was encoded through the identical pipeline so the ceiling could be read
off an encoded file rather than a source buffer:

```
source plate (mkbg.js, RGB)      peak luma 18.01   mean luma 11.87
control.mp4 (encoded, stored Y)  YMAX      34
```

34 is the number to argue from. 18.01 is RGB luma and the delivered file is
limited-range yuv420p where `Y = 16 + 219 * luma / 255`, so 18.01 maps to 31.5,
and the measured 34 is that plus encoder ringing.

Stored-Y of everything drawn:

| Drawn element | Colour | Stored Y |
|---|---|---|
| Body and list text | `#E8E9ED` | 216 |
| Accent text | `#A78BFA` | 147 |
| Violet scene rule | `#8B5CF6` | 113 |
| Logo mark | violet | 131 peak inside the card |
| Logo card field | approx `#0B0A0D` | **27 to 28** |

Method A's threshold is **56**, sitting in the empty gap between the background
ceiling of 34 and the dimmest element method A can resolve. Antialias fringe near
56 is ambiguous, and counting fringe as ink makes the box larger, which biases
the result against passing.

The logo card field at stored Y 27 to 28 sits **below** the background ceiling of
34, so no absolute threshold can see it. That is what methods B and C are for,
and the finding below is that B cannot see it either.

### Method A, absolute threshold on stored Y

```
mode=abs  threshold=56
frames decoded: 1290   frames with no ink: 26
peak stored-Y seen anywhere: 238
INK UNION  x 197..762   y 676..1232
  top     clearance  676 px  reserve 180  headroom  +496  PASS   worst at frame  993 (t=33.10s)
  bottom  clearance  687 px  reserve 380  headroom  +307  PASS   worst at frame  997 (t=33.23s)
  right   clearance  317 px  reserve 180  headroom  +137  PASS   worst at frame 1142 (t=38.07s)
  left    197 px  (Shorts specifies no left reserve)
```

The 26 frames with no ink are the nine scene crossovers. Expected, not a defect.

### Method B, per-frame diff against a text-free control

`control.mp4` is the same background with the same drift crop, the same duration
and the same encoder settings, with no text inputs at all. It is a measurement
instrument and is not delivered.

**The threshold was measured, not chosen.** A control cancels artefacts it
SHARES, but adding text changes libx264's rate control across the whole frame, so
the control differs from the render even where nothing is drawn. The noise floor
was measured in three regions that are empty by design, over all 1290 frames:

```
top    y    0..400            max |delivered - control| = 5
bottom y 1500..1919           max |delivered - control| = 4
right  y  600..1300, x 850..  max |delivered - control| = 4
```

Threshold set to **12**, comfortably above a floor of 5 and far below the peak
diff of 210.

```
mode=diff  threshold=12
frames decoded: 1290   frames with no ink: 9
peak |diff| anywhere: 210
INK UNION  x 197..762   y 676..1232
  top     clearance  676 px  reserve 180  headroom  +496  PASS   worst at frame  992 (t=33.07s)
  bottom  clearance  687 px  reserve 380  headroom  +307  PASS   worst at frame  993 (t=33.10s)
  right   clearance  317 px  reserve 180  headroom  +137  PASS   worst at frame 1141 (t=38.03s)
  left    197 px
```

**Methods A and B agree to zero pixels on all four edges.**

### Method C, alpha channel of every text layer

Catches fully opaque elements at any brightness, which is the only way to see
furniture drawn near the canvas value. It is also the check for the `drawbox`
alpha-blend defect: the violet rule is the topmost thing in every block, so if it
had rendered at alpha 0 the measured top would sit about 51 px below the computed
top.

```
layer  measured bbox                  computedTop  drift
   1: x 200..759  y  779..1118            779       0
   2: x 199..761  y  779..1123            779       0
   3: x 206..749  y  764..1145            764       0
   4: x 212..743  y  784..1115            784       0
   5: x 224..736  y  759..1143            759       0
   6: x 247..711  y  764..1134            764       0
   7: x 207..755  y  779..1116            779       0
   8: x 213..743  y  784..1123            784       0
   9: x 240..716  y  676..1232            676       0
  10: x 197..762  y  677..1230            677       0
LAYER-ALPHA UNION  x 197..762   y 676..1232
```

`drift 0` on all ten is positive evidence that `replace=1` worked, rather than an
assertion that it should have. Independent corroboration from the delivered file:
method A's union top of 676 is exactly scene 9's computed `blockTop`, and the
topmost element in that block is the rule, so the rule demonstrably survived
encoding too.

**All three methods return the identical union, x 197..762, y 676..1232.**

### The dark-on-dark logo, and what the pixel methods actually saw

The run 2 finding was re-tested rather than inherited, and it reproduces exactly.
Probed at frame 1230 (t=41.00 s), mid scene 10, logo fully opaque:

```
declared logo rect                 x 382..577   y 728..923   (196 x 196 = 38,416 px)
card FIELD stored-Y at its corners 28, 27, 28, 28            (background ceiling 34)
max |diff| along edge columns x=382 and x=577                4 and 4
method A (abs>=56)  sees  4,886 px, bbox x 439..520  y 772..876
method B (diff>=12) sees  5,004 px, bbox x 439..520  y 772..876
```

Both pixel methods resolve only the violet mark in the middle of the card and
**miss 87.3% of the element**. The card is not faintly visible, it is genuinely
not visible: its field sits 6 to 7 below the background ceiling, and its own edge
differs from the background by 4 of 255. Only the geometry you asked for finds
it.

**The `overlay` odd-y rounding was handled by construction, and checked.** The
logo is overlaid at y 728 and x 382, both already even, so the effective position
equals the requested one and the declared rect needs no correction. Had either
been odd, the declared rect would have had to be computed from the effective even
value. Every text layer is overlaid at 0:0.

### Final union and verdict

```
FINAL UNION (methods A, B, C, and the declared 196 px logo rect folded in)
  x 197..762   y 676..1232

  top     676 px   reserve 180   headroom +496   PASS
  bottom  687 px   reserve 380   headroom +307   PASS
  right   317 px   reserve 180   headroom +137   PASS
  left    197 px   (no left reserve on Shorts)
```

**SAFE ZONE: PASS.** The tightest edge is the right at 317 px against a 180 px
reserve, a **137 px** margin, which is nearly seven times the 20 px floor the
brief sets and is the edge that failed run 1's TikTok build at 1 px. The logo
rect is contained by the type box on every edge, so folding it in changes
nothing, but it was measured rather than assumed.

The margin was bought deliberately. Type is centred on x=480 rather than 540,
which moves the whole column clear of the right-hand action rail at no cost
because Shorts specifies no left reserve. Body type is 56 px, which keeps the
widest drawn line inside a 566 px column. That widest line is `See what the
answer` in scene 10, and the binding frame on the right is 1142 (t=38.07 s),
that scene's first frame. The logo in the same scene spans 196 px against the
line's 566, so the type is the constraint and the furniture is not.

Cover measured separately, decoded from the delivered `youtube-cover.png` at the
same threshold 56:

```
cover ink bbox: x 200..759   y 779..1118
  top 779   bottom clearance 801   right clearance 320
```

That matches layer 1's alpha bbox (`x 200..759 y 779..1118`) exactly on all four
edges, which is a stricter result than run 2 got: there the alpha pass counted
fringe one pixel wider than the luma pass. Here the two thresholds happen to land
on the same outermost pixel, so no disagreement needs reconciling.

### Scene boundaries land on frame, and the detector was validated

Boundaries were found as the CENTRE of each zero-ink plateau, not as a step edge
or a local minimum, both of which produce a uniform offset that reads like
timeline drift.

```
plateau  frames        centre f   centre t   expected t   delta
  1      122..124        123.0      4.100       4.10      +0.0
  2      245..247        246.0      8.200       8.20      +0.0
  3      371..373        372.0     12.400      12.40      +0.0
  4      497..499        498.0     16.600      16.60      -0.0
  5      620..622        621.0     20.700      20.70      +0.0
  6      737..739        738.0     24.600      24.60      +0.0
  7      861..862        861.5     28.717      28.70      +0.5
  8      989..991        990.0     33.000      33.00      +0.0
  9     1139..1141      1140.0     38.000      38.00      +0.0
```

The threshold sweep is what makes those numbers trustworthy. Plateau WIDTH
changes with threshold and the CENTRE does not:

```
threshold  40: centres 123, 246, 372, 498, 621, 738, 861,   990, 1140    widths all 1
threshold  56: centres 123, 246, 372, 498, 621, 738, 861.5, 990, 1140    widths 3,3,3,3,3,3,2,3,3
threshold  80: centres 123, 246, 372, 498, 621, 738, 861,   990, 1140.5  widths 5,5,5,5,5,5,5,5,4
threshold 120: centres 123, 246.5, 372, 498, 621, 737.5, 861, 990, 1140  widths 9,8,9,9,9,8,9,9,9
```

Widths grow 1 to 9 as the threshold triples; centres move by at most half a
frame. The timeline is frame-exact by construction, built as looped image inputs
at `-framerate 30` with `-frames:v 1290`. **No `ffconcat` anywhere**, so there
are no cumulative float durations to drift.

---

## Duration and container

Both from `ffprobe` on the **delivered** files in this folder:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **43.000000 s** | 1290 frames, 30/1, 1080x1920, yuv420p, h264 High@4.1 | **none. `nb_streams=1`, 0 audio streams** |
| `youtube-scored.mp4` | **43.000000 s** | identical bitstream, `-c:v copy`, 1290 frames | aac 48 kHz stereo, stream duration **43.000000 s** |

`nb_streams=1` on the master is the load-bearing check. A muted audio track is
not the same thing as no audio track, and a muted track can block a platform's
in-app music picker, which is the entire reason the silent master is primary.

The video is provably the same bitstream in both files, so the safe-zone
measurement binds on the scored cut rather than being assumed to:

```
ffmpeg -i youtube-silent.mp4 -map 0:v -c copy -f md5 -   MD5=d98d49eb0cb3e0130149b32cc0fa2c80
ffmpeg -i youtube-scored.mp4 -map 0:v -c copy -f md5 -   MD5=d98d49eb0cb3e0130149b32cc0fa2c80
```

43.000 s is inside the 30 to 45 s target and 17 s under the 60 s cap.

`-shortest` did its job. Container and audio stream both report exactly
43.000000. One honest footnote: decoding the AAC to PCM yields 2,064,384 samples
per channel against 2,064,000 expected, 384 samples of decoder padding, 8 ms.
That padding lives in the container's edit list and is not part of the reported
duration or of playback.

Neither file was accepted on exit status. A mux can exit 0 and be unreadable, so
both were probed after the copy into this folder, and the numbers above are from
the delivered copies.

---

## Cover integrity

Scene 1 has **no fade in**. Its layer carries only `fade=t=out`, so frame 0 is
the hook at full opacity, because frame 0 is the thumbnail the feed shows.

Verified two ways on the delivered file, not the intermediate:

```
ffmpeg -i youtube-cover.png     -pix_fmt rgb24 -f rawvideo - | md5sum
  13974304dfc14782cad7f6358a3f0559

ffmpeg -i youtube-silent.mp4 -frames:v 1 -pix_fmt rgb24 -f rawvideo - | md5sum
  13974304dfc14782cad7f6358a3f0559
```

Identical, so the cover is frame 0 and not a re-render of it. Second check, ink
pixel count: frame 0 measures 28,209 ink pixels against 28,224 at frame 60 in the
middle of the same scene, a ratio of 0.9995. A fade would have put frame 0 near
zero.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`, 60.000 s
source, 48 kHz stereo PCM. Composed by BrandGEO on 2026-07-29 by
`scripts/compose_music.py`, recorded in `assets/audio/ATTRIBUTION.md`. Owned
outright, cleared for commercial use including paid advertising, and it
**requires no attribution line anywhere**. Nothing was downloaded and no music
service was involved.

Held **constant** across every run in this campaign by design. The variable under
test is the hook. Varying the music at the same time would leave a winning run
with two candidate explanations and no way to separate them. `tension-minor` is
also the right character for this driver on its own terms: status threat needs
unresolved tension held under the copy, and a minor bed that keeps cycling
without landing matches an argument whose point is that the situation is stable
and not in your favour.

**There is no CC BY 4.0 line on this asset and there must not be one.** That
obligation belongs to the LibriTTS voice model, and there is no voice of any kind
in this run. Adding the credit for audio that is not present would be a false
statement about the asset, not a harmless precaution.

Trimmed to 43.000 s, **0.08 s fade in** at t=0 and **1.5 s fade out** starting at
41.50 s, both mandatory this run. Two-pass `loudnorm`:

```
pass 1, measured on the trimmed and faded 43.0 s cut
  input_i      = -16.61 LUFS
  input_tp     =  -4.41 dBTP
  input_lra    =   9.00 LU
  input_thresh = -26.75
  offset       =  -0.53
```

Re-measured independently on the **encoded delivered file** rather than trusting
the filter's own pass-2 summary:

```
ffmpeg -i youtube-scored.mp4 -af ebur128=peak=true
  Integrated:  -15.8 LUFS   (target -16)
  LRA:           8.6 LU
  True peak:    -3.8 dBFS   (ceiling -1.5 dBTP)
```

True peak lands 2.3 dB under the ceiling. The ceiling is a limit, not a target,
and the source already sat near -16 LUFS, so pass 2 applied about 0.5 dB in
`linear` mode. There was nothing to fix.

### Fade-in verification on the delivered file

The track does not start at zero, so a hard cut in clicks. Decoded from
`youtube-scored.mp4` to f32 PCM:

```
first 64 samples, max |amplitude| = 0.002729     (requirement: below 0.005)  PASS
first 64 samples, peak            = -51.3 dBFS
last 0.1 s, peak                  = -40.4 dBFS   so it ends in silence, not cut off
```

### Honest read on the scored cut

It is real music rather than a synthesized drone, and the difference is
measurable rather than a matter of taste. Measured on the delivered file:

| | |
|---|---|
| LRA | **8.6 LU**, so it moves |
| Stereo | **L differs from R on 100.00% of samples**, correlation 0.870, so it images as a field with width rather than as a point in the centre of the head |
| Harmony | 100 BPM, C minor, 25 bars over a five-chord cycle. Changes every bar |

What it is not: it was not cut to this edit. The track was composed to 60 s for
the campaign generally, and the nine scene changes here fall where reading time
puts them, so bar lines and cuts do not line up. It reads as a bed under the
video rather than as a score of it. That is the correct tradeoff for a shared
library and it is worth knowing before anyone claims the music hits the cuts.

**Still upload the silent master for the organic post.** YouTube's in-app library
is free, cleared, and favoured by distribution. The scored cut is for paid, site
embeds and decks, where that library does not exist.

---

## Suggested Shorts title

```
An AI wrote a sentence about your company. You have not read it.
```

Written to be read rather than stuffed. Two clauses, the second is the turn, no
keyword list, no colon-and-brackets construction, no "here is why". It also
carries the cut's actual spine, which run 2's title could not have done for this
one: the threat is a sentence, not a slot.

Alternates on the same driver, same spine:

- `Being named by an AI is not the same as being described well`
- `Each AI engine writes its own version of your company`

## Suggested description

```
When a buyer asks an AI engine about your category, the answer contains
sentences about specific companies. If one of them is about you, you did not
write it, and it was not sent to you for review.

Being named in that answer is one thing. What the sentence says is another. You
can be named and still end up as the comparison rather than the recommendation,
and there is no draft stage where you get to object.

The engines do not have to agree with each other either. Each one generates its
own version, so there is no single sentence to go and find.

BrandGEO puts your buyers' questions to ChatGPT, Gemini, Claude, Perplexity and
Google AI Mode, and records both halves of the result: whether you are named,
and what the answer says about you when you are.

See what the answer says about you: https://getbrandgeo.com
```

No hashtag block. The description is written to be read by someone who paused on
the video, and a trailing tag run does not serve that reader. If the channel's
convention requires tags, put them below the link rather than inside the copy.

No CC BY 4.0 line, for the reason given under Music above.

---

## Build

`ffmpeg 8.1.2-full_build-www.gyan.dev`, `node v24.16.0`, `numpy 2.4.6`. Remotion
is not installed and was not used. Nothing was installed. PNG intermediates
throughout, no JPEG, so nothing gets forced to `yuvj420p`.

Pipeline, all in the session scratchpad:

1. `scenes.js` is the single source of truth for copy and timeline. Nothing else
   holds a string that reaches the screen.
2. `mkbg.js` writes a 1188x2112 binary PPM: base `#090A0F`, a violet `#7C3AED`
   mass bottom right, an indigo `#6366F1` mass top left, a faint `#8B5CF6` centre
   lift, an edge vignette. Oversized so the render can drift-crop 1080x1920 out
   of it without ever reaching an edge. It prints its own peak luma, which is
   what justifies the ink threshold. Then `ffmpeg -i bg.ppm bg.png`.
   (Run 2's plate put violet top right and indigo bottom left, and drifted the
   crop the other way. Inverted here so the two cuts do not share a background
   composition or a camera move either.)
3. `mktext.js` renders one transparent RGBA layer per scene and writes
   `declared.json`.
4. `build.js` composites the silent master and the text-free control.
5. `measure_layers.js`, `measure_delivered.py`, `ink_union.py`, `logo_probe.py`
   and `scan.py` are the measurement and compliance passes.

**Traps guarded explicitly, each with its evidence:**

- **`color=black@0.0` does not survive format negotiation.** The lavfi source
  drops its `@alpha` and lands opaque, so a later `format=rgba` fills alpha with
  255 and every text layer ships as a full-frame black rectangle, exit 0 and no
  warning. Every layer here is built as
  `color=c=black,format=rgba,colorchannelmixer=aa=0` and written with
  `-update 1 -pix_fmt rgba`, because without the latter alpha is dropped again
  one step later. Evidence it worked: the layer-alpha pass returns nine distinct
  bounding boxes plus one, not ten boxes reading `x 0..1079 y 0..1919`.
- **`drawbox` on transparent RGBA blends instead of writing alpha.** It renders
  at alpha 0 and vanishes with no error. Drawn as
  `drawbox=x=438:y=<blockTop>:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1`.
  Evidence: `drift 0` on all ten layers.
- **`drawbox` cannot animate on 8.1.2.** Nothing in this cut animates a box.
- **`overlay` rounds an odd `y` down to even on yuv420p.** The logo sits at
  y 728 and x 382, both even, so effective equals requested and the declared rect
  needs no correction. Text layers overlay at 0:0.
- **No fade on scene 1 from t=0.** `[1:v]` carries only `fade=t=out`. Verified by
  md5 over raw RGB and by ink count.
- **No `ffconcat`.** Looped image inputs at `-framerate 30` with
  `-frames:v 1290`, frame-exact by construction.
- **Measure the delivered file, not the intermediate.** Every number in the
  safe-zone, duration, cover and audio sections above comes from a decode of the
  delivered mp4 or png.

### Exact command, silent master

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 43 -i bg.png \
 -loop 1 -framerate 30 -t 43 -i text-1.png \
 ... text-2.png through text-9.png, same flags ... \
 -loop 1 -framerate 30 -t 43 -i text-10.png \
 -filter_complex "\
[0:v]crop=1080:1920:x='0+108*n/1289':y='192-192*n/1289',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=3.80:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=4.10:d=0.3:alpha=1,fade=t=out:st=7.90:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=8.20:d=0.3:alpha=1,fade=t=out:st=12.10:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=12.40:d=0.3:alpha=1,fade=t=out:st=16.30:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=16.60:d=0.3:alpha=1,fade=t=out:st=20.40:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=20.70:d=0.3:alpha=1,fade=t=out:st=24.30:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=24.60:d=0.3:alpha=1,fade=t=out:st=28.40:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=28.70:d=0.3:alpha=1,fade=t=out:st=32.70:d=0.3:alpha=1[t8];\
[9:v]format=rgba,fade=t=in:st=33.00:d=0.3:alpha=1,fade=t=out:st=37.70:d=0.3:alpha=1[t9];\
[10:v]format=rgba,fade=t=in:st=38.00:d=0.3:alpha=1[t10];\
[bg][t1]overlay=0:0:format=auto[v1];[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];[v7][t8]overlay=0:0:format=auto[v8];\
[v8][t9]overlay=0:0:format=auto[v9];[v9][t10]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1290 youtube-silent.mp4
```

`[1:v]` carries no fade in. That is the cover guarantee, not an oversight.

### Exact command, one text layer

Text goes through `textfile=` rather than `text=`, so no filtergraph escaping is
involved, and every invocation is spawned as an argv array so the shell never
sees the filter string. Fonts are the vendored Inter from
`docs/growth/grok-launch/images/_build/fonts/`, copied next to the script so
`fontfile=` needs no drive-letter escaping on Windows.

```
ffmpeg -y -loglevel error -f lavfi -i color=c=black:s=1080x1920:d=1 \
 -vf "format=rgba,colorchannelmixer=aa=0,\
drawbox=x=438:y=779:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1,\
drawtext=fontfile=Inter-Bold.ttf:textfile=s1-l0.txt:fontcolor=0xE8E9ED:fontsize=56:x=(w-text_w)/2+-60:y=842,\
... one drawtext per line ..." \
 -frames:v 1 -update 1 -pix_fmt rgba text-1.png
```

Scene 10 additionally overlays the 196 px logo before the drawtext chain:

```
[0:v]format=rgba,colorchannelmixer=aa=0[bgl];
[1:v]scale=196:196:flags=lanczos,format=rgba[lg];
[bgl][lg]overlay=382:728:format=auto[wl];
[wl]<drawbox and drawtext chain>[out]
```

### Exact command, text-free control

Same background chain, same encoder settings, no text inputs. This file is a
measurement instrument and is not delivered.

```
ffmpeg -y -loglevel error -loop 1 -framerate 30 -t 43 -i bg.png \
 -filter_complex "[0:v]crop=1080:1920:x='0+108*n/1289':y='192-192*n/1289',format=rgba,setsar=1[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1290 control.mp4
```

### Exact command, scored cut

Pass 1 measures the trimmed and faded audio only:

```
ffmpeg -i assets/audio/music/tension-minor.wav \
 -af "atrim=0:43.0,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,\
afade=t=out:st=41.50:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Its output feeds pass 2:

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 \
 -i assets/audio/music/tension-minor.wav \
 -filter_complex "[1:a]atrim=0:43.0,asetpts=N/SR/TB,\
afade=t=in:st=0:d=0.08,afade=t=out:st=41.50:d=1.5,\
loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.61:measured_TP=-4.41:\
measured_LRA=9.00:measured_thresh=-26.75:offset=-0.53:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-scored.mp4
```

### Exact command, cover

```
ffmpeg -y -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" -vsync 0 youtube-cover.png
```

---

## What this run adds to the shared traps list

**An n-gram diff against the previous pass belongs in the pipeline, not in the
reviewer's memory.** This cut was written deliberately not to reuse run 2, and
it still shipped a seven-word run from run 2's product beat into a rendered
layer. Reading both files did not catch it; a mechanical comparison of the drawn
strings against the earlier run's rendered lines did, in one pass, along with the
`every run` collision in the list header. A replication round is exactly the
condition under which two cuts drift toward the same words, because both are
describing the same product, so the check is cheapest where it matters most.
Recommend every replication-round agent run it before the final build, and treat
the engine list and the URL as the only permitted overlap.

---

Nothing was posted, scheduled, uploaded or committed. No git command was run.
Nothing outside
`docs/growth/reel-campaign-ab/run-20260730-0513/youtube/` was written.
