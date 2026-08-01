# TikTok cut, run-20260730-0013

**Hook driver:** #3, curiosity gap. "We asked five engines the same question in
twelve cities and one pattern held every time."

Run 1 was loss aversion, run 2 was status threat. Both threaten the viewer.
This one does not. It offers a finding and withholds the end of it. The loop
opens at 1.53s (`ONE PATTERN / HELD IN / EVERY ONE.`) and closes at 21.4s
(`IT IS THE / CATEGORY.`), which is 65% of the way in, so the payoff lands
before the drop-off tail rather than at the CTA.

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. For paid, site embeds and decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, verified byte-identical. |

**Silent is the one to upload.** In-app audio is a ranking input on TikTok, not
just a licence convenience.

---

## On-screen text, verbatim

Every line is a separate `drawtext`. Line breaks in the table are literal line
breaks on screen. Boundaries were verified by decoding all 990 frames of the
delivered file in one sequential pass; all 20 land exactly where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `SAME QUESTION.` |
| 2 | 14 | 0.400 to 0.867 | `SAME QUESTION.` / `12 CITIES.` |
| 3 | 20 | 0.867 to 1.533 | `SAME QUESTION.` / `12 CITIES.` / `5 AI ENGINES.` (accent) |
| 4 | 42 | 1.533 to 2.933 | `ONE PATTERN` / `HELD IN` / `EVERY ONE.` |
| 5 | 51 | 2.933 to 4.633 | `FIRST WE ASKED` / `FOR A PROPERTY` / `MANAGER.` |
| 6 | 18 | 4.633 to 5.233 | label `ENGINES THAT AGREED` + `CHICAGO  5/5` |
| 7 | 18 | 5.233 to 5.833 | + `LOS ANGELES  4/5` |
| 8 | 18 | 5.833 to 6.433 | + `HOUSTON  4/5` |
| 9 | 18 | 6.433 to 7.033 | + `MIAMI  4/5` |
| 10 | 30 | 7.033 to 8.033 | + `DENVER  4/5` |
| 11 | 45 | 8.033 to 9.533 | the five rows, plus `THEY AGREED.` (accent) |
| 12 | 54 | 9.533 to 11.333 | `THEN WE ASKED` / `FOR A REAL` / `ESTATE AGENT.` |
| 13 | 48 | 11.333 to 12.933 | `SAME CITIES.` / `SAME ENGINES.` |
| 14 | 70 | 12.933 to 15.267 | label `REAL ESTATE AGENTS IN DENVER` + `0` (accent, 260pt) + `NAMES ON TWO ENGINES.` |
| 15 | 60 | 15.267 to 17.267 | `THE MOST` / `FRAGMENTED` / `CATEGORY WE` / `MEASURED.` |
| 16 | 54 | 17.267 to 19.067 | `SO IT IS NOT` / `THE CITY.` |
| 17 | 70 | 19.067 to 21.400 | `IT IS THE` / `CATEGORY.` (accent) |
| 18 | 51 | 21.400 to 23.100 | `SOME ANSWERS` / `ARE ALREADY` / `SETTLED.` |
| 19 | 51 | 23.100 to 24.800 | `SOME ARE` / `WIDE OPEN.` |
| 20 | 96 | 24.800 to 28.000 | label `WE ASK ALL FIVE` + `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 21 | 150 | 28.000 to 33.000 | `FIND OUT WHICH` / `ONE YOURS IS.` plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` top left, and a violet
progress bar at the bottom of the safe zone that fills across the cut.

### Why the copy is shaped this way

Curiosity gap only works if the gap is real. The cheap version of this driver is
to tease a finding and then deliver a product pitch, which trains the viewer not
to trust the next one. So the payoff here is an actual published result, and the
turn at scene 16 to 17 is the whole asset: the viewer has been led to assume the
variable is the CITY, because scenes 6 to 11 are a list of cities, and the answer
is that the city never mattered. That reversal is what the earlier scenes are
paying for.

Structure is a deliberate A/B inside the cut: the same five engines, the same
twelve cities, two different questions, opposite outcomes. Scene 5 asks question
A and scenes 6 to 11 answer it. Scene 12 asks question B and scene 14 answers it
with a single glyph. Scene 14 is the hardest visual state change in the piece
(a 260pt accent `0` where a five-row table just was) and it is placed at 12.9s,
which is where a TikTok viewer who has not yet committed decides.

TikTok gets the bluntest of the four cuts. Longest line on screen is 14
characters. No connective tissue, hard cuts only, no fades anywhere.

**The first 1.5 seconds carry three state changes**, measured by ink-pixel count
on frames decoded from the delivered file, not by eye:

```
t=0.000  f0    ink 29,142 px
t=0.400  f12   ink 40,166 px   (+11,024)
t=0.867  f26   ink 57,676 px   (+17,510)
t=1.533  f46   ink 49,179 px   (-8,497)
```

Raw frame hashes are NOT usable for this: H.264 gives visually identical frames
different quantisation noise. Ink count does not have that problem.

---

## Factual position, and where every number comes from

Every number on screen traces to a published page. Sources:

| On screen | Claim | Source |
|---|---|---|
| `12 CITIES.` | The property-management consensus pattern is enumerated across twelve named cities | `brandgeo/web/ai-visibility-for-denver.html` |
| `CHICAGO 5/5` | Chicago (5/5) | same sentence, `ai-visibility-for-denver.html` |
| `LOS ANGELES 4/5` | Los Angeles (4/5) | same |
| `HOUSTON 4/5` | Houston (4/5 twice) | same, corroborated in `ai-visibility-for-houston.html` |
| `MIAMI 4/5` | Miami (4/5) | same |
| `DENVER 4/5` | Pioneer Property Management and Real Property Management Colorado both reached 4 of 5 engines in Denver | same |
| `0` / `NAMES ON TWO ENGINES.` | "0 Real estate agent names that repeated across any two engines, the most fragmented category in the dataset" | `ai-visibility-for-denver.html` findings bar |
| `THE MOST FRAGMENTED CATEGORY WE MEASURED.` | "Real estate agents. No overlap at all. Most fragmented category measured." | same |

The load-bearing sentence, quoted so a reviewer can check it without opening the
file: the Denver page reports the property-management result as "extending a
pattern that's now held across nearly every city researched", then lists New York
(3/4), Los Angeles (4/5), Chicago (5/5), Houston (4/5 twice), Dallas (3/5 three
times), Miami (4/5), Philadelphia (4/5 twice), Phoenix (5 firms at 3/5), San
Francisco, Seattle, and San Diego, and Denver, and concludes that no other
category type has been this consistently high-consensus across the whole
program. Twelve cities named, hence `12 CITIES.`

**Three deliberate restraints, each of which cost a stronger-looking screen:**

1. **New York's 3/4 is on the source page and is NOT on screen.** New York ran
   on four usable engines because ChatGPT failed on all eight prompts that run.
   A `3/4` sitting in a column of `/5` reads as a typo or, worse, as a rate the
   viewer silently converts to 75%. Every number shown has the same denominator.
2. **The `0` is labelled `REAL ESTATE AGENTS IN DENVER`, not left global.**
   Real estate agents are the most fragmented category in every city measured,
   which is published and is what scene 15 says. But *zero* names crossing two
   engines is Denver's specific figure; Houston, for instance, records a loose
   2/5. Showing the 0 without the city label would have been a small lie in the
   direction that flatters us.
3. **The 27 published city pages are not claimed as one dataset.** The first
   seven city runs used Meta AI, now retired, as their fifth engine; the later
   runs use Google AI Mode. Saying "27 cities, these five engines" would be
   false for the earliest pages. Twelve is the number the cited sentence
   actually supports.

Other compliance:

- Engines named are exactly the five in the Growth set, `planConfig.ts:57`:
  ChatGPT, Gemini, Claude, Perplexity, Google AI Mode. **No Grok and no AI
  Overviews**, which went live 2026-07-29 with 5 and 6 rows from a single day.
  **No Meta AI**, retired.
- No percentage or rate anywhere. `5/5` and `4/5` are counts of engines out of
  five, shown as counts, and the column header says so.
- No pricing, no plan names. TOFU, soft CTA (`FIND OUT WHICH ONE YOURS IS.`).
- No em dashes, no en dashes, none of the banned vocabulary.
- Historical research pages were not consulted for anything except reading. No
  file outside this folder was written.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right. Usable box `y 200..1560`,
`x ..880`. Everything below is measured on frames decoded out of the
**delivered** `tiktok-silent.mp4`.

### Ink threshold, argued from a measured control

Measured first, chosen second:

```
lavfi control canvas (pre-encode), gray:        min 10  max 10  (flat)
delivered file, known-empty band y1600..1900:   min  9  max  9  at f6, f200, f600, f900
dimmest colour deliberately drawn:              29   (progress track #1B1D2B)
next dimmest:                                   96   (violet rule #7C3AED)
brightest:                                      231  (ink #E8E9ED)
```

The encoded background is a single flat value with zero variance, so the range
10 to 28 is empty. **Threshold 11** was chosen just above the background rather
than mid-gap, so every glyph's antialiased skirt is counted and the reported box
can only be larger than the design box, never smaller.

The result is not threshold-sensitive. Union over all 990 frames:

```
thr  10   x 100..819   y 248..1506
thr  11   x 100..819   y 248..1506      <- reported
thr  15   x 100..819   y 250..1505
thr  20   x 100..819   y 250..1505
thr  40   x 100..819   y 250..1505
thr  60   x 100..819   y 250..1505
thr 100   x 100..819   y 250..1505
```

### Cross-check, and a false positive that had to be fixed first

Method B was first written as "decode rgb24, flag any pixel differing from the
canvas colour `09/0A/0F` by more than 2 in any channel". **It returned
`x 0..1079, y 0..1513`, which would have failed the safe zone by 199px on the
right and 200px on the top.** That was not ink.

Rows 0 and 1 of every frame decode to `rgb(7,7,15)` while the rest of the canvas
decodes to `rgb(7,8,13)`. Delta 3 on the green channel, across the full width,
in a region where the topmost drawn element is 246 rows below. Diagnosis: a
yuv420p chroma artefact at the frame edge. **Proof it is the encoder and not
something we drew: it reproduces identically in a text-free control encoded
through the same path**, where nothing at all is drawn.

So method B was rebuilt as the brief's per-frame diff against that text-free
control, encoded with byte-identical settings through the same image2 pipeline.
That cancels the artefact and leaves only drawn ink:

```
residual noise in the known-empty band y1600..1900, delivered minus control:  0
threshold 2 therefore sits above the noise floor by construction

method A (gray, thr 11):                    x 100..819   y 248..1506
method B (delivered minus control, >2):     x  96..821   y 248..1511
```

Method B finds more ink on three of four edges, which is expected: single-channel
fringing survives an RGB comparison and is averaged away by the gray conversion.
Per the brief, the wider number is the one reported.

**Worth carrying forward:** "trust the method that finds more ink" assumes both
methods are measuring ink. The first method B was measuring the codec. The rule
that actually saved this build was calibrating the threshold against a region
known to be empty *in the delivered file* before believing either number.

### Declared rects folded in

Pixel methods are blind to anything within a few luma of the canvas, and the
logo card is exactly that kind of element, so its geometry is added explicitly
rather than trusted to the measurement:

```
logo overlay      x 100..231    y 1000..1131     (declared, 132x132 at 100,1000)
progress track    x 100..819    y 1500..1505     (declared)
```

Both sit inside the measured union, so neither moves it. That is the outcome to
want, not a reason to have skipped the check.

### Reported box, union of everything drawn

```
UNION           x   96..821     y  248..1511
reserves        top 200         bottom y<=1560      right x<=880
HEADROOM        top 48px        bottom 49px         right 59px
tightest        48px            verdict PASS (floor is 20px)
```

### Type alone, chrome excluded, per scene

Rows at or below y=1490 ignored, which drops the progress bar and leaves type,
the violet rule and the logo:

```
scene01  x 100..779  y 248.. 763    scene12  x 102..751  y 248.. 950
scene02  x 100..779  y 248.. 855    scene13  x 100..715  y 248.. 895
scene03  x 100..779  y 248.. 949    scene14  x 100..819  y 248.. 991
scene04  x 100..644  y 248.. 949    scene15  x 100..679  y 248.. 995
scene05  x 102..774  y 248.. 950    scene16  x 100..582  y 248.. 895
scene06  x 100..819  y 248.. 707    scene17  x 100..550  y 248.. 895
scene07  x 100..819  y 248.. 795    scene18  x 100..751  y 248.. 947
scene08  x 100..819  y 248.. 883    scene19  x 100..566  y 248.. 895
scene09  x 100..819  y 248.. 971    scene20  x 100..819  y 248..1055
scene10  x 100..819  y 248..1059    scene21  x 100..763  y 248..1131
scene11  x 100..819  y 248..1199
```

The 819 right edge on the table scenes is the violet rule, which is furniture
spanning the full column by design. **Widest actual type is scene 1 and 3,
`SAME QUESTION.` at x1 = 779, 101px clear of the limit.**

### How the margin was designed in rather than discovered

Run 1's TikTok build passed on 1px. The column here was sized before the first
render: left margin 100, column 720, right edge 820, reserving 60px inside the
880 limit by construction. Headline size is then **fitted by measurement**: every
unique line is rendered alone at 100pt, its ink width measured, and the largest
size from the ladder 78/72/66/60/54 whose widest line fits 720px is taken.

```
widest line at 100pt:  SAME QUESTION.   871 px
                       FOR A PROPERTY   865 px
                       FIND OUT WHICH   851 px
78pt predicted:        871 * 0.78 = 679.4 px  against a 720 px budget  -> FITS
78pt measured on the delivered mp4:    679 px (x 100..779)
```

Prediction and delivered file agree to 1px here. That is better than run 2 saw
(5px, point-size scaling of a hinted TTF is not exactly linear), so the fitter is
still an estimate used only to pick a size. The pass/fail number is always the
box measured out of the delivered mp4.

---

## A real defect found and fixed: ffconcat drifted a scene boundary by one frame

The first encode used the ffconcat demuxer with per-scene `duration` lines, as
previous runs did. Measured on the delivered file, **19 of 20 boundaries landed
exactly and one did not**: scene 18 began at frame 694 instead of the designed
693. Cumulative float durations (several scenes are repeating decimals, 70/30 =
2.333333) put the boundary at 23.10000033s, a third of a microsecond past the
frame edge, and `fps=30` rounded it the other way.

The total was still exactly 990 frames and 33.000s, which is why this is easy to
miss: nothing about the container looks wrong.

Fixed by removing float durations from the pipeline entirely. Scene stills are
expanded into a 990-file numbered sequence and encoded with `-framerate 30 -i
seq/f%04d.png`, which is frame-exact by construction. After the change all 20
boundaries land where designed.

The fix also made the boundary detector honest. Before it, the largest
picture change *inside* a scene was 66,976 px, which is not quantisation noise,
it was the drifted boundary hiding inside a scene's own frame range and
poisoning the noise floor. After:

```
largest picture change strictly INSIDE any scene :    530 px
smallest picture change AT a designed boundary   :  5,716 px
threshold 3,123 sits in the empty gap between them
detected boundaries == designed boundaries, all 20
```

"Picture change" is the count of pixels whose luma moved by more than 6 between
consecutive frames. Plain ink-count differencing was tried first and is weaker:
scene 16 to 17 changes ink by only 472 px because two lines of similar length
swap in, which is close enough to the noise floor to be uncomfortable. Counting
changed pixels separates cleanly by an order of magnitude.

No `-ss` was used anywhere in this measurement. All frames are decoded
sequentially in one pass and indexed.

---

## Duration, exact ffprobe on the delivered files

```
tiktok-silent.mp4   format 33.000000   nb_streams 1
                    video  33.000000   990 frames   1080x1920  yuv420p  30/1

tiktok-scored.mp4   format 33.000000   nb_streams 2
                    video  33.000000   990 frames   duration_ts 506880 @ 1/15360
                    audio  33.000000  1548 frames   duration_ts 1584000 @ 1/48000
```

33.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string
and `nb_streams=1`. That is what `-an` buys.

**The scored cut did not drift.** The AAC stream holds 1548 frames, which is
1,585,152 samples, 33.024s of raw payload. The container still reports 33.000000
because `duration_ts` is 1,584,000 samples exactly, so the trailing quantised
tail is excluded rather than played. `-shortest` is what pins it.

Video is stream-copied into the scored variant. Both files decode to the same
picture, full-stream MD5 `9a03fae9309e12e7b6af67ca1cb25a40` on both, so any
picture check on one holds for the other.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master.
Raw `rgb24` MD5 of the cover and of frame 0 of `tiktok-silent.mp4` both read
`dbedc5961240a3a9e7ca629b074b0da0`. Byte-identical, 1080x1920.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build.
Frame 0 renders at full opacity carrying `SAME QUESTION.`, so the thumbnail the
feed picks up is the hook.

## Progress bar

`drawbox` cannot animate on 8.1.2: it has no `eval` option and evaluates
`x/y/w/h` once at init, so an expression would silently freeze at its t=0 value.
The bar is therefore 21 static boxes, one per scene, each drawn into that
scene's still. Verified on the delivered file that it actually moves, 20 distinct
steps across 20 transitions:

```
9, 19, 33, 64, 101, 114, 127, 140, 153, 175, 208, 247, 282, 333, 377, 416,
467, 504, 541, 611, 720
```

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending
would have worked, but run 1 lost a violet rule to alpha-0 blending with no
error, and making that structurally impossible is cheaper than reasoning about
it per call.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, no attribution
line. 60.000s source, 48kHz stereo. Held constant across runs on purpose: the
hook is the variable under test, so the bed must not be.

Trimmed to 33.000s, 1.5s fade out starting at 31.5s, 0.08s fade in.

**The fade in is not cosmetic.** Measured on the source: the first 64 samples
peak at 0.061709 and the first 0.1s peaks at 0.206314, so a cut at sample 0
clicks. (The brief records the opening amplitude as 0.025; the peak across the
first 64 samples measures higher than that, which strengthens rather than
weakens the case for the fade.)

Verified on the **delivered** `tiktok-scored.mp4`:

```
first  16 samples  peak |amp|  0.000536
first  64 samples  peak |amp|  0.002715   <- required below 0.005, PASS
first 512 samples  peak |amp|  0.015568
first 0.08s        peak |amp|  0.166027
first 1.0s         peak |amp|  0.299480
last   64 samples  peak |amp|  0.000003   (fade out lands at silence)
```

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.09   TP -4.41   LRA 3.50   thresh -26.16   offset -1.08
pass 1 also reports what SINGLE pass would have produced: I -14.92
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.01   TP -4.32   LRA 3.50
```

Integrated lands on -16.01 LUFS. The brief is right that single-pass undershoots:
it would have landed at -14.92, 1.08 LU high. True peak is -4.32 dBTP, under the
-1.5 ceiling rather than at it, because linear mode applies one flat gain and the
peak lands wherever the integrated target puts it. -1.5 is a ceiling not to
exceed, so this is compliant with 2.8dB spare.

**Honest read: nobody has listened to this file.** Everything above is
measurement. `astats` on the delivered cut: peak -4.40/-4.39 dBFS, RMS
-16.35/-16.61 dBFS, crest factor 3.96/4.08, flat factor 0. LRA is 3.50 LU over
this 33s window against 6.80 LU over the full 60s track, so the excerpt is less
dynamic than the whole piece. The cuts are driven by reading time and the track
runs at a fixed tempo, so they are not locked to each other and will agree at
some cuts by coincidence rather than by design.

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
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1000[out]`. A representative
graph body:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=250:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=1500:w=720:h=6:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=1500:w=19:h=6:color=0xA78BFA@1:t=fill:replace=1,
drawtext=fontfile='Inter-ExtraBold.ttf':text='SAME QUESTION.':x=100:y=700:fontsize=78:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-ExtraBold.ttf':text='12 CITIES.':x=100:y=795:fontsize=78:fontcolor=0xE8E9ED[out]
```

**2. Frame-exact sequence, then the silent master.** Each scene still is copied
`frames` times into `seq/f%04d.png`, 990 files. No ffconcat, no float durations,
see the defect section above:

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

**5. Text-free control**, for measurement method B, identical settings:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 990 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an control.mp4
```

**6. Verification** decodes the delivered file sequentially, never with `-ss`:

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt gray -
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt rgb24 -
```

piped frame by frame into numpy.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
row rule, progress track `#1B1D2B`. `#8B5CF6` is used for no text anywhere; it
measures 4.2:1 on this canvas and fails. Inter ExtraBold for headlines, SemiBold
for rows and labels, Bold for the wordmark, Medium for the URL, all vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Dark only.

## Open items

- **Scene 15 restates scene 14.** `THE MOST / FRAGMENTED / CATEGORY WE /
  MEASURED.` is four lines in 2.0s directly after a screen that already made the
  point with one glyph. If this driver tests well, cut scene 15 to two lines and
  give the reclaimed time to scene 17, which is the loop close and currently gets
  2.33s.
- **The two questions are not symmetrical and a viewer may notice.** Scene 5 asks
  for a property manager and gets five cities of evidence; scene 12 asks for an
  agent and gets one city. That is honest, because the 0 is Denver's figure, but
  a five-city fragmentation table would be a stronger screen. It needs one number
  per city pulled from each city page rather than from Denver's summary sentence.
- **`12 CITIES.` is the weakest number in the cut**, not because it is wrong but
  because it undersells: 27 city pages are published. Making that claim would
  need the earliest seven re-run on the current five-engine set, which is a
  collection job, not a copy edit.
- Nobody has heard the scored cut. See the music section.
- `RUN.md` at the run root records which hook driver the run used, per the brief.
  It is outside this task's write scope and was not created here.
