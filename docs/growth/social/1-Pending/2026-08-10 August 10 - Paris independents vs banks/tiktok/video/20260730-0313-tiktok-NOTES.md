# TikTok cut, run-20260730-0313

**Hook driver: #6, UTILITY.** "Do this yourself, right now." This completes the
six-driver cycle. Runs 1 to 5 used loss aversion, status threat, curiosity gap,
contrarian and concrete proof.

Utility does not persuade. It hands the viewer a procedure they can run in the
next ten seconds, for free, without us, and says so on screen. The product only
appears after the viewer has been given something that works without it.

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. For paid, site embeds and decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, verified byte-identical. |

**Silent is the one to upload.** In-app audio is a ranking input on TikTok, not
just a licence convenience.

Filenames follow `-scored.mp4`, the convention every run in this campaign has
used, rather than the brief's `-bed.mp4`.

---

## On-screen text, verbatim

Every line is a separate `drawtext`. All 20 boundaries were verified by decoding
all 990 frames of the delivered file in one sequential pass and land exactly
where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 18 | 0.000 to 0.600 | label `DO THIS RIGHT NOW` + `1` `OPEN CHATGPT` |
| 2 | 18 | 0.600 to 1.200 | + `2` `ASK A QUESTION` |
| 3 | 18 | 1.200 to 1.800 | + `3` `READ THE LIST` |
| 4 | 18 | 1.800 to 2.400 | + `4` `FIND YOUR NAME` |
| 5 | 60 | 2.400 to 4.400 | same four rows, held |
| 6 | 66 | 4.400 to 6.600 | label `ASK IT LIKE A BUYER WOULD` + `best <what you sell>` / `in <your city>` |
| 7 | 54 | 6.600 to 8.400 | `THAT IS THE` / `WHOLE TEST.` (accent) |
| 8 | 54 | 8.400 to 10.200 | `IT COSTS` / `NOTHING.` (accent) |
| 9 | 60 | 10.200 to 12.200 | `YOU CAN DO` / `THIS WITHOUT` / `US.` (ink) |
| 10 | 54 | 12.200 to 14.000 | `NOW THE HARD` / `PART.` (accent) |
| 11 | 30 | 14.000 to 15.000 | label `NOW RUN THE SAME LINE ON` + `CHATGPT` |
| 12 | 30 | 15.000 to 16.000 | + `GEMINI` |
| 13 | 30 | 16.000 to 17.000 | + `CLAUDE` |
| 14 | 30 | 17.000 to 18.000 | + `PERPLEXITY` |
| 15 | 66 | 18.000 to 20.200 | + `GOOGLE AI MODE` |
| 16 | 54 | 20.200 to 22.000 | `THEN DO IT` / `ALL AGAIN.` (accent) |
| 17 | 60 | 22.000 to 24.000 | `WRITE DOWN` / `WHAT CHANGED.` (accent) |
| 18 | 60 | 24.000 to 26.000 | `ONE CHECK IS` / `A SNAPSHOT.` (ink) |
| 19 | 60 | 26.000 to 28.000 | `THE RECORD IS` / `THE WORK.` (accent) |
| 20 | 54 | 28.000 to 29.800 | `WE RUN IT ON` / `REPEAT.` (accent) |
| 21 | 96 | 29.800 to 33.000 | `START WITH` / `ONE QUESTION.` (accent) plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` top left, a violet rule
at y=700, and a violet progress bar at the bottom of the safe zone that fills
across the cut.

Full list of the 42 unique strings drawn, dumped back out of the 21 rendered
filtergraph files rather than retyped, is in the compliance section below.

### Why the copy is shaped this way

**The instruction is real and it is complete.** A viewer who pauses on scene 5
has the whole method: open ChatGPT, ask a buyer question, read the list, look
for your name. Scene 6 supplies the question shape as a template rather than a
worked example, so it transfers to any category and any city without the viewer
having to translate someone else's business into their own.

`best <what you sell>` / `in <your city>` is set in **mixed case SemiBold** while
every other line is **ExtraBold caps**. Same device as run 5's prompt card: the
query has to read as a thing you type, not as a headline the brand wrote. The
angle brackets make it unmistakably a template and not a result.

**Scenes 7 to 9 are the honesty, and they are the reason this driver works.**
`THAT IS THE WHOLE TEST.` / `IT COSTS NOTHING.` / `YOU CAN DO THIS WITHOUT US.`
Scene 9 is the only ink-white multi-line headline in the first two thirds of the
cut, deliberately, so it does not read as a slogan. The brief for this run was
explicit that the manual check must not be belittled and there must be no
bait-and-switch, and a utility asset that quietly implies the free version is
broken is exactly that switch.

**Scenes 10 to 20 are the actual argument, and it is about repetition, not
capability.** The pivot is `NOW THE HARD PART.` followed by the same line run on
five engines, then `THEN DO IT ALL AGAIN.` / `WRITE DOWN WHAT CHANGED.` The
product claim is confined to two screens at the end: `ONE CHECK IS A SNAPSHOT.` /
`THE RECORD IS THE WORK.` and `WE RUN IT ON REPEAT.` Nothing is claimed that the
viewer has not just been walked through by hand.

**The first 1.5 seconds carry three state changes**, measured by ink-pixel count
on frames decoded from the delivered file, not by eye:

```
t=0.000  f0    ink 29,099 px
t=0.600  f18   ink 47,350 px   (+18,251)
t=1.200  f36   ink 62,717 px   (+15,367)
t=1.800  f54   ink 81,548 px   (+18,831)
```

Raw frame hashes are NOT usable for this. H.264 gives visually identical frames
different quantisation noise, so hashes differ where nothing changed. Ink count
and changed-pixel count do not have that problem.

TikTok gets the bluntest of the four cuts. Longest capitalised line is 16
characters. No connective tissue, hard cuts only, no fades anywhere in the
picture.

---

## Evidence, and the fact that there is almost none to check

**This cut contains no measurement, no result, no percentage and no statistic.**
That is the correct shape for a utility asset and it was a deliberate choice, not
an omission. The only digits drawn anywhere in 990 frames are `1`, `2`, `3`, `4`,
the step ordinals, confirmed mechanically over the dumped strings.

Consequently there is nothing here that traces to a page, because there is
nothing here that needs to. The two things that are assertions of fact are:

| On screen | Claim | Source |
|---|---|---|
| `CHATGPT` `GEMINI` `CLAUDE` `PERPLEXITY` `GOOGLE AI MODE` | these five engines are the ones we run | `brandgeo-dashboard/src/lib/planConfig.ts`, `PLAN_ENGINES.growth = ['chatgpt','gemini','claude','perplexity','google_ai']`. Display strings are the `label` fields in `ENGINE_META` at lines 212 to 216, uppercased. |
| `WE RUN IT ON REPEAT.` / `THE RECORD IS THE WORK.` | the product runs the same prompts repeatedly and stores the history | the collection queue, `collection-worker-background` and the hourly `schedule-collections` cron; results persist in `ai_results` with `checked_at`. |

**No cadence is stated anywhere on screen**, and that is on purpose.
`refresh_cadence` defaults to `manual` and there is a 48h cooldown, so "daily",
"weekly" or "every month" would all have been unsupportable. `ON REPEAT` claims
frequency without claiming a number, which is the only honest version available.

`START WITH ONE QUESTION.` is the soft CTA. No pricing, no plan names, no tier
comparison. TOFU.

### Sources deliberately not used

1. **`bg-016.html` was not opened.** Excluded by the brief.
2. **No engine count was taken from `bg-004.html`.** Excluded by the brief, and
   in any case its lineup includes Microsoft Copilot, not today's Growth five.
3. **No city page, no `5/5`, no consensus figure, no city count.** The word
   "cities" does not appear and neither does any city name. Utility does not need
   a result and borrowing one would have made this a proof asset wearing a
   utility costume.
4. **No Grok and no AI Overviews.** Both went live 2026-07-29 with 5 and 6 rows
   from a single day. They are also not in the Growth five, so they would have
   been wrong here twice over.
5. **No Meta AI.** Retired 2026-07-16, in no plan set.
6. **`bg-005.html`'s 48% and 93%** are third-party statistics inside an otherwise
   first-party page. Not used, and no percentage appears in this cut at all.

### Superlatives: one word needs explaining, and it is not a claim

The mechanical scan over the drawn strings returns exactly one hit on the
superlative list: **`best`**, inside `best <what you sell>`.

That is the query the VIEWER is being told to type, in lowercase, in the one
mixed-case SemiBold block in the cut, next to a placeholder in angle brackets. It
asserts nothing about BrandGEO, about a competitor, or about anything measured.
It is the word a buyer actually uses, and a buyer-intent prompt that avoids it
would not be a buyer-intent prompt. Replacing it with `top` would be the same
word wearing a hat.

The four the brief names by name, "first", "only", "most", "never", appear
nowhere. Neither do `nobody`, `no one`, `always`, `every`, `leading`, `unmatched`
or `#1`.

**One line was rewritten to keep it that way.** The task brief's own framing was
that repeating the check across engines is something "nobody does by hand", and
an early draft read `THAT IS THE PART / NOBODY DOES / BY HAND.` "Nobody" is a
universal claim about every business on earth, which is the same species of
unverifiable assertion as "first" and is refuted by one counterexample. It was
replaced with `ONE CHECK IS / A SNAPSHOT.` and `THE RECORD IS / THE WORK.`, which
carries the identical meaning as a statement about the method rather than about
the world, and cannot be falsified by a viewer who does in fact keep a
spreadsheet. No hedge was used, because "almost nobody" is the same claim with
deniability.

### Never a measured subject on screen, verified mechanically

The harvester pulls organisation-shaped names out of the **whole research
corpus**, not just one page: 57 files, every `ai-visibility-for-*.html` and every
`bg-*.html` under `brandgeo/web/`, tags stripped, matching capitalised
multi-word sequences ending in an organisation suffix (`LLC`, `Inc`, `Group`,
`Realty`, `Properties`, `Management`, `Law`, `Health`, `Hospital`, `Medical`,
`Bank`, `Capital`, `Advisors`, `Solutions`, `Company`, `Corp` and others).
**78 names harvested, zero matches** against the strings passed to `drawtext`.

The only proper nouns on screen are `BRANDGEO`, `getbrandgeo.com`, and the five
engine names. Every capitalised token in the cut was checked against an explicit
allow list and the "not on the list" set is empty. Competitor product names
(`peec`, `profound`, `semrush`, `otterly`, `rankscale`, `scrunch`, `athena`,
`brandwatch`): zero hits.

This is the easiest driver in the cycle to keep clean on this rule, because it
describes a procedure rather than a finding, and a procedure has no subject.

### Other compliance, all checked over the dumped strings, not by reading

- **No em dashes, no en dashes**, and in fact no Unicode dash of any category and
  no hyphen-minus either. Zero non-ASCII characters anywhere.
- **No banned vocabulary**: none of delve, unlock, unleash, elevate, harness,
  leverage, game-changer, supercharge, revolutionize, seamless, robust,
  cutting-edge, transformative.
- **No `%`, no currency symbol, no rate.**
- No pricing, no plan names.
- No file outside `docs/growth/reel-campaign-ab/run-20260730-0313/tiktok/` was
  written. No git command was run. Nothing posted or scheduled. `RUN.md` and the
  sibling platform folders were not touched.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right, the tightest of the four
because of the right-hand action rail. Usable box `y 200..1559`, `x ..879`.
Everything below is measured on frames decoded out of the **delivered**
`tiktok-silent.mp4`, never an intermediate.

### The layout was fitted before the first render

Column set to **x 100..799, 700px**, same as run 5. Every unique line rendered
alone at 100pt and its ink width measured:

```
widest step row text       FIND YOUR NAME        871 px at 100pt
widest headline            WHAT CHANGED.         871 px at 100pt
widest engine row          GOOGLE AI MODE        873 px at 100pt
widest template line       best <what you sell>  997 px at 100pt
widest label (30pt)        ASK IT LIKE A BUYER WOULD  1426 px at 100pt
```

Three type sizes, each fitted against the space actually available to it:

```
headlines + engine rows   x=100, 700px usable
  72pt   873 * 0.72 = 629 px    71 px spare    taken

step rows                 x=180 (numeral in the 80px gutter at x=100), 620px usable
  72pt   871 * 0.72 = 627 px     7 px spare    REJECTED, that is a paper pass
  68pt   871 * 0.68 = 592 px    28 px spare    taken

query template            x=100, 700px usable
  72pt   997 * 0.72 = 718 px    OVER by 18 px  rejected
  66pt   997 * 0.66 = 658 px    42 px spare    taken
```

72pt was rejected for the step rows on the brief's own rule that single-digit
headroom is a rounding artefact rather than a margin. Dropping to 68pt costs
nothing a viewer will notice and is 24pt above the 44pt floor.

Prediction against the delivered file:

```
                                predicted   measured on the mp4
GOOGLE AI MODE at 72pt             629 px      628 px  (scene 15, x 99..727)
FIND YOUR NAME at 68pt (x=180)     592 px      592 px  (scene 04, x 180..771)
best <what you sell> at 66pt       658 px      656 px  (scene 06, x 104..759)
```

Agreement is 0 to 2px. The fitter is still only an estimate used to pick a rung
off the ladder; the pass/fail number is always the box measured out of the
delivered mp4.

### Ink threshold, argued from a measured control

Measured first, chosen second:

```
delivered file, known-empty band y1600..1899:  min 9  max 9  across all 990 frames
dimmest colour deliberately drawn:             Y ~= 30   (progress track #1B1D2B)
next dimmest:                                  Y ~= 98   (violet rule #7C3AED)
accent:                                        Y ~= 160  (#A78BFA)
brightest:                                     Y ~= 233  (ink #E8E9ED)
```

The encoded background is a flat 9 with zero variance across every frame in a
region where nothing is drawn, so the range 10 to 29 is empty. **Threshold 11**
sits just above the background rather than mid-gap, so every glyph's antialiased
skirt is counted and the reported box can only be larger than the design box.

That flat 9 across all 990 frames is also the direct disproof of the
`color=black@0.0` failure that hit run 4's YouTube build. It cannot happen here
by construction either: there is no transparent lavfi source anywhere, no
`format=rgba`, no `@0.0`. Each scene is one filtergraph drawn straight onto an
opaque `color=c=0x090A0F` source, so no alpha is ever negotiated. Checked
mechanically over the 21 graph files: `@0.0` appears 0 times.

The result is not threshold-sensitive. Union over all 990 frames:

```
thr  10   x  99..799   y 260..1495
thr  11   x  99..799   y 260..1495      <- method A
thr  15   x 100..799   y 260..1495
thr  20   x 100..799   y 260..1495
thr  40   x 100..799   y 260..1495
thr  60   x 100..799   y 260..1495
thr 100   x 100..799   y 260..1495
```

The one pixel of movement on the left edge between thr 11 and thr 15 is the
antialiased skirt of the x=100 column, which is the expected direction.

### Cross-check against a text-free control

Method B is the brief's per-frame diff against a **text-free control encoded
through the identical pipeline**, never against a flat assumed canvas colour. The
control is the same 990-frame `image2` sequence with nothing drawn on it, same
`-framerate 30`, same x264 settings, and it carries the yuv420p frame-edge chroma
artefact that made run 3's first attempt report `x 0..1079, y 0..1513`.

**The threshold was set from a measured noise floor, in three regions that are
empty by design**, per the correction added after run 5's Facebook false failure:

```
region                          max |delivered - control|, all 990 frames, max over RGB
y 1600..1899 (below the bar)      0
y  320.. 600 (eyebrow to label)   0
x  900..1079 (right of column)    0
noise floor = 0
```

The floor is genuinely 0 here, so the lowest rung is already above it:

```
>2    x  94..801   y 256..1497      <- method B, first rung above the floor
>4    x  96..799   y 256..1497
>8    x 100..799   y 258..1495
>12   x 100..799   y 260..1495
>16   x 100..799   y 260..1495
```

Method B at >2 finds more ink than method A on all four edges, by 2 to 5px, which
is the expected result: single-channel fringing survives an RGB comparison and is
averaged away by the gray conversion. Both methods are measuring ink (the floor
in three known-empty regions is exactly 0), so **the wider number is the one
reported**. Neither method reports ink at the literal frame edge, so there is
nothing here to blame on the codec.

Note the floor being 0 rather than run 5's 7 is not luck. This cut has less total
ink per frame and a large genuinely-black lower third, so x264's rate control
allocates the empty regions identically in both encodes. Had it not, the sweep
above would have shown it and the threshold would have moved.

### Declared rects folded in

Pixel measurement is blind to anything within a few luma of the canvas, and both
methods share that blind spot. Geometry is added explicitly rather than trusted
to either measurement:

```
progress track    x 100..799   y 1490..1495   (declared)
progress fill     x 100..799   y 1490..1495   (declared, widest state)
violet rule       x 100..799   y  700.. 703   (declared)
logo card         x 100..231   y 1030..1161   (declared, 132x132 at 100,1030)
declared union    x 100..799   y  700..1495
```

All four sit inside the measured union, so none of them moves it. That is the
outcome to want, not a reason to have skipped the check.

### Reported box, union of everything drawn

```
method A (gray, thr 11):                    x  99..799   y 260..1495
method B (delivered minus control, >2):     x  94..801   y 256..1497
declared rects:                             x 100..799   y 700..1495

UNION           x   94..801     y  256..1497
reserves        top y>=200      bottom y<=1559      right x<=879
HEADROOM        top 56px        bottom 62px         right 78px
tightest        56px            verdict PASS (floor is 20px)
```

**The binding constraint is furniture, not type.** The right edge at 801 is the
progress bar and the two rules at x=799 plus 2px of encoder fringe. The widest
body type on any frame is scene 4's `FIND YOUR NAME` at x=771, 108px clear of the
limit; the widest engine row is scene 15 at x=727, 152px clear.

Top and bottom headroom are 56 and 62px, identical to run 5's TikTok cut, because
the vertical scaffold (eyebrow y=260, progress bar y=1490) was kept unchanged so
this run's picture is comparable with the last one's. Right headroom is also 78px,
the same, for the same reason.

### Body type alone, chrome excluded, per scene

Rows outside `y 710..1449` ignored, which drops the eyebrow, the label, the
violet rule and the progress bar and leaves only body type and the logo. `hr` is
clearance to the `x<=879` limit:

```
scene01  x 103..716  hr 163     scene12  x  99..450  hr 429
scene02  x 100..763  hr 116     scene13  x  99..450  hr 429
scene03  x 100..763  hr 116     scene14  x  99..547  hr 332
scene04  x 100..771  hr 108     scene15  x  99..727  hr 152
scene05  x 100..771  hr 108     scene16  x 100..507  hr 372
scene06  x 104..759  hr 120     scene17  x 100..727  hr 152
scene07  x 100..591  hr 288     scene18  x 100..611  hr 268
scene08  x 104..459  hr 420     scene19  x 100..646  hr 233
scene09  x 101..639  hr 240     scene20  x 101..599  hr 280
scene10  x 104..669  hr 210     scene21  x 100..671  hr 208
scene11  x  99..450  hr 429
```

Tightest body-type scene is 4 and 5 at 108px. Every scene clears by more than the
20px floor five times over.

---

## Timeline construction, and the trap that was avoided

**No `ffconcat` anywhere.** On an earlier TikTok run the ffconcat demuxer drifted
a scene onto frame 694 instead of the designed 693, because cumulative float
durations put the boundary a third of a microsecond past a frame edge, while
total duration and frame count still looked exactly right. Here the 21 scene
stills are expanded into a 990-file numbered sequence and encoded with
`-framerate 30 -i seq/f%04d.png`, which is frame-exact by construction.

Verified on the delivered file by decoding all 990 frames sequentially in one
pass, with no `-ss` anywhere, and counting pixels whose luma moved between
consecutive frames.

**The threshold sweep was load-bearing again, and more so than on run 5.** The
quietest boundary in this cut is scene 4 to scene 5, where the two source PNGs
differ only by one step of the progress bar: fill 51px to 93px, a 42x6 block,
**exactly 252 pixels**. At a per-pixel delta of 6 the intra-scene quantisation
noise reaches 713 changed pixels, nearly three times that real boundary, and a
detector run at that setting reports a false result:

```
delta   max INSIDE a scene   min AT a boundary   separation
    6                  713                 252   OVERLAP
   12                  237                 252   1.1x
   20                  156                 252   1.6x
   32                  120                 252   2.1x
   48                   77                 252   3.3x
```

Delta 12 technically separates the two populations but by 15 pixels, which is not
a margin by the same reasoning the brief applies to safe-zone headroom. **Delta 32
was taken**, where the gap is 132 pixels wide and a count threshold of 186 sits in
the middle of it. At that setting **all 20 detected boundaries equal all 20
designed boundaries**, and the same is true at delta 12 with its own threshold of
244, so the result is stable across the choice rather than dependent on it.

Changed pixels at every designed boundary, delta 12:

```
S01->S02  f18    0.600s     17,253     S11->S12  f450  15.000s      9,018
S02->S03  f36    1.200s     14,786     S12->S13  f480  16.000s      8,760
S03->S04  f54    1.800s     18,194     S13->S14  f510  17.000s     12,662
S04->S05  f72    2.400s        252     S14->S15  f540  18.000s     18,926
S05->S06  f132   4.400s     90,254     S15->S16  f606  20.200s     81,602
S06->S07  f198   6.600s     41,521     S16->S17  f660  22.000s     35,194
S07->S08  f252   8.400s     27,873     S17->S18  f720  24.000s     46,892
S08->S09  f306  10.200s     47,188     S18->S19  f780  26.000s     43,117
S09->S10  f366  12.200s     49,274     S19->S20  f840  28.000s     28,079
S10->S11  f420  14.000s     37,007     S20->S21  f894  29.800s     55,539
```

The 252 at 2.400s is the hold beginning, a designed non-event in the picture, and
it is the only boundary in the cut where nothing but furniture changes. The four
values between 8,760 and 18,926 are the engine rows arriving one at a time. The
two largest, at 4.400s and 20.200s, are the wipes out of the two accumulating
lists, which is the intended shape: the biggest picture changes happen after each
list has been read, not during it.

## Progress bar

`drawbox` cannot animate on 8.1.2. It has no `eval` option and evaluates
`x/y/w/h` once at init, so an expression like `w='700*min(1,t/33)'` would
silently render frozen at its t=0 value with no warning. The bar is therefore 21
static boxes, one per scene, drawn into that scene's still. Verified on the
delivered file by reading row y=1492 at every scene start:

```
measured  13, 25, 38, 51, 93, 140, 178, 216, 259, 297, 318,
          339, 361, 382, 428, 467, 509, 552, 594, 632, 700
designed  identical
monotonic non-decreasing: yes    distinct values: 21 of 21
```

`replace=1` is on **every** `drawbox`, all 63 of them, checked mechanically over
the graph files rather than by reading. The source is opaque RGB so blending
would have worked, but run 1 lost a violet rule to alpha-0 blending with no
error, and making that structurally impossible is cheaper than reasoning about it
per call.

---

## Duration, exact ffprobe on the DELIVERED files

Probed after the copy into this folder, not on the build copies.

```
tiktok-silent.mp4   format 33.000000   nb_streams 1
                    video  33.000000   990 frames   1080x1920  yuv420p  30/1
                    duration_ts 506880 @ 1/15360

tiktok-scored.mp4   format 33.000000   nb_streams 2
                    video  33.000000   990 frames   duration_ts 506880 @ 1/15360
                    audio  33.000000  1548 frames   duration_ts 1584000 @ 1/48000
```

33.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string
and `nb_streams=1`. That is what `-an` buys.

**A mux can exit 0 and be unreadable**, so both delivered files were probed for
duration and stream count before this was called done.

**The scored cut did not drift.** The AAC stream decodes to 1,584,128 samples per
channel, 33.002667s of raw payload, but the container reports 33.000000 because
`duration_ts` is 1,584,000 samples exactly, so the trailing quantised tail is
excluded rather than played. `-shortest` is what pins it.

Video is stream-copied into the scored variant. Both files' video streams hash to
`MD5=2c533429cf6647e58b1758e5b750b7db`, so every picture measurement above holds
for both.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master,
1080x1920. Raw `rgb24` MD5 of the cover and of frame 0 of the delivered
`tiktok-silent.mp4` both read `1b096a6c26b899df5ffc5aaa81183d80`.
Byte-identical, re-checked on the copies in this folder rather than on the build
copies.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build,
confirmed by grepping all 21 graph files: 0 occurrences. Frame 0 renders at full
opacity, 29,099 ink pixels, carrying the label `DO THIS RIGHT NOW`, the violet
rule, and step 1, `OPEN CHATGPT`. The thumbnail the feed shows is a legible
instruction that already tells the viewer what to do, which is the right cover
for this driver: it works even if nobody presses play.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, no attribution
line. 60.000s source, 48kHz stereo. **Held constant across runs on purpose: the
hook is the variable under test, so the bed must not be.**

Trimmed to 33.000s, 0.08s fade in, 1.5s fade out starting at 31.5s.

**The fade in is not cosmetic.** Measured on the source: the first 16 samples
already peak at 0.053095 and the first 64 at 0.061709, so a cut at sample 0
clicks audibly.

Verified on the **delivered** `tiktok-scored.mp4`:

```
first     16 samples  peak |amp|  0.000536
first     64 samples  peak |amp|  0.002715   <- required below 0.005, PASS
first    512 samples  peak |amp|  0.015568
first 0.08 s          peak |amp|  0.166027
first 1.00 s          peak |amp|  0.299480
last      64 samples  peak |amp|  0.000003   (fade out lands at silence)
```

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.09   TP -4.41   LRA 3.50   thresh -26.16   offset -1.08
pass 1 also reports what a SINGLE pass would have produced: I -14.92
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.01   TP -4.32   LRA 3.50
```

Integrated lands on -16.01 LUFS. The brief is right that single-pass undershoots:
it would have landed at -14.92, 1.17 LU high. True peak is -4.32 dBTP, under the
-1.5 ceiling rather than at it, because linear mode applies one flat gain and the
peak lands wherever the integrated target puts it. -1.5 is a ceiling not to
exceed, so this is compliant with 2.82 dB spare.

**Honest read: nobody has listened to this file.** Everything above is
measurement. The excerpt is the first 33s of the same track the previous five
runs used, so it will sound like those, a second shorter than run 5's. LRA is
3.50 LU over this window against 6.80 LU over the full 60s track, so the excerpt
is less dynamic than the whole piece.

**One thing worth flagging for this driver specifically.** `tension-minor` is,
by name and by construction, a tension bed. It suits loss aversion and status
threat. A utility asset is instructional and slightly generous in tone, and a
minor-key tension track works against that. The bed is held constant because the
A-B design requires it, which is correct, but `clean-utility.wav` already exists
in `assets/audio/music/` and is the obviously better fit. If this driver tests
well, the natural follow-up experiment is the same picture with that bed, run as
a music variable rather than a hook variable. **It was not swapped here** because
that would have confounded the only variable this campaign is measuring.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph option
value terminates the option even when the value is quoted, so `fontfile=C:/...`
fails to parse.

**1. Scene stills**, one PNG per scene, 21 total, filtergraph written to a file:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex scenes/gNN.txt -map "[out]" -frames:v 1 -update 1 scenes/sNN.png
```

Scene 21 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1030[out]`. A representative
graph body, scene 6 (the query template), verbatim from `scenes/g05.txt`:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=260:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=1490:w=700:h=6:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=1490:w=140:h=6:color=0xA78BFA@1:t=fill:replace=1,
drawbox=x=100:y=700:w=700:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawtext=fontfile='Inter-SemiBold.ttf':text='ASK IT LIKE A BUYER WOULD':x=100:y=640:fontsize=30:fontcolor=0xA78BFA,
drawtext=fontfile='Inter-SemiBold.ttf':text='best <what you sell>':x=100:y=850:fontsize=66:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-SemiBold.ttf':text='in <your city>':x=100:y=946:fontsize=66:fontcolor=0xE8E9ED[out]
```

**2. Frame-exact sequence, then the silent master.** Each scene still is copied
`frames` times into `seq/f%04d.png`, 990 files. No ffconcat, no float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i seq/f%04d.png \
  -vf "format=yuv420p" -frames:v 990 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an tiktok-silent.mp4
```

`-an` is what makes this a true silent master rather than a silent audio track.

**3. Cover**, the literal first frame:

```
ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 \
  -frames:v 1 -update 1 tiktok-cover.png
```

**4. Scored cut:**

```
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 33.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=31.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.09:measured_TP=-4.41:measured_LRA=3.50:measured_thresh=-26.16:offset=-1.08:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**5. Text-free control**, for measurement method B, identical settings and
identical frame count, with nothing drawn:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 990 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an control.mp4
```

**6. Verification** decodes the delivered files sequentially, never with `-ss`:

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt gray  -
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i control.mp4       -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i tiktok-scored.mp4 -map 0:a:0 -f f32le -ac 2 -ar 48000 -
```

piped frame by frame into numpy. Build artifacts, the control mp4 and the frame
sequences were kept outside this folder; only the three deliverables and this
file were written here.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
rule, progress track `#1B1D2B`. `#8B5CF6` is used for no text anywhere; it
measures 4.2:1 on this canvas and fails. Inter ExtraBold for headlines, step
numerals, step text and engine rows; SemiBold for the query template, the labels
and the eyebrow; Bold for the wordmark; Medium for the URL. All vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Dark only.

The step numerals are the only accent-coloured glyphs inside the body area for
the first 4.4 seconds. That is what makes the list scan as a list at thumb speed
rather than as four sentences.

## Open items

- **This is the first cut in the campaign with zero factual claims to check**,
  which makes it the cleanest to ship and also the one whose performance says the
  most about the hook itself rather than about the finding it carries. Runs 1 to 5
  each bundled a hook with a specific result. If utility outperforms them, the
  read is about format, not evidence, and that is a more transferable answer.
- **The bed is wrong for this driver and was kept anyway.** See the music section.
  `assets/audio/music/clean-utility.wav` exists and is the obvious fit. Proposed
  follow-up: same picture, that bed, run as a music A-B once the hook cycle's
  results are in. Do not fold it into a hook test.
- **The step list is the reusable asset here, not this video.** Four rows plus a
  query template fits in one frame with 108px of right clearance and needs no
  research, no collection and no city page. It re-cuts for any platform and any
  category, and it is the only asset in the campaign that can be built without
  opening the corpus.
- **`ASK A QUESTION` in step 2 is the weakest of the four rows.** It is vague
  until scene 6 supplies the template two seconds later. `ASK A BUYER QUESTION`
  is the line that wants to be there and it does not fit on one row at any size
  above the paper-pass threshold. If a future cut drops one of the other steps,
  spend the recovered width on this one rather than on a headline.
- **Scene 5's 60-frame hold is the obvious cut if this needs to reach 30s.** It
  repeats scene 4 exactly except for the progress bar, so removing it costs no
  information at all, only reading time on the completed list.
- Nobody has heard the scored cut. See the music section.
- `RUN.md` at the run root records which hook driver the run used, per the brief.
  It is outside this task's write scope and was not read from or written to here.
  This run folder was created by this task; if a sibling platform agent has not
  yet written `RUN.md`, the driver for run `20260730-0313` is **#6, utility**, and
  it closes the cycle.
