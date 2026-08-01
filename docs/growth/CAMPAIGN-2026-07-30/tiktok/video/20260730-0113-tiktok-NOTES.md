# TikTok cut, run-20260730-0113

**Hook driver: #4, CONTRARIAN.** "Ranking first does not mean you are the answer."

Runs 1 to 3 used loss aversion, status threat and curiosity gap. This one attacks
a belief the viewer holds, so the belief is **named plainly on screen before it is
contradicted**. Frames 0 to 45 build the sentence `YOU RANK FIRST / IN GOOGLE. /
SO AI NAMES YOU.` and frame 46 replies `IT DOES NOT.` at 96pt in accent violet.
Without the first three lines the fourth is a non sequitur.

**It deliberately does not say "SEO is dead."** That claim is false, and on TikTok
it invites a comment pile-on that buries the actual point. The asset argues
something narrower and defensible: rank and AI visibility are two different
measurements. That guard is stated twice, once at 2.9s (`RANK AND AI /
VISIBILITY ARE / TWO DIFFERENT / MEASUREMENTS.`) and once at 25.4s
(`SEO STILL WORKS. ... IT MEASURES / A DIFFERENT / THING.`).

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
| 1 | 12 | 0.000 to 0.400 | `YOU RANK FIRST` |
| 2 | 16 | 0.400 to 0.933 | `YOU RANK FIRST` / `IN GOOGLE.` |
| 3 | 18 | 0.933 to 1.533 | `YOU RANK FIRST` / `IN GOOGLE.` / `SO AI NAMES YOU.` (accent) |
| 4 | 42 | 1.533 to 2.933 | `IT DOES NOT.` (accent, 96pt) |
| 5 | 54 | 2.933 to 4.733 | `RANK AND AI` / `VISIBILITY ARE` / `TWO DIFFERENT` / `MEASUREMENTS.` (accent) |
| 6 | 45 | 4.733 to 6.233 | `WE RAN 20 REAL` / `CUSTOMER` / `QUESTIONS.` |
| 7 | 45 | 6.233 to 7.733 | `FOR A BRAND` / `ALREADY ON` / `PAGE ONE.` (accent) |
| 8 | 48 | 7.733 to 9.333 | label `TOP AI RECOMMENDATION ON` + `3` (accent, 240pt) + `ENGINES.` |
| 9 | 60 | 9.333 to 11.333 | label `TIMES NAMED ON A FOURTH ENGINE` + `0` (accent, 240pt) + `SAME AUDIT.` |
| 10 | 48 | 11.333 to 12.933 | `SAME BRAND.` / `SAME QUESTIONS.` |
| 11 | 45 | 12.933 to 14.433 | `A RANKING IS` / `TEN LINKS YOU` / `STILL CLICK.` |
| 12 | 45 | 14.433 to 15.933 | `AN ANSWER` / `NAMES A FEW.` / `SOMETIMES ONE.` (accent) |
| 13 | 48 | 15.933 to 17.533 | `THERE IS NO` / `PAGE TWO.` (accent) |
| 14 | 54 | 17.533 to 19.333 | label `PROPERTY MANAGEMENT IN CHICAGO` + `5 / 5` (accent, 240pt) + `ENGINES NAMED` / `ONE COMPANY.` |
| 15 | 45 | 19.333 to 20.833 | `ONE NAME OWNED` / `THE WHOLE` / `CATEGORY.` |
| 16 | 36 | 20.833 to 22.033 | `THAT IS NOT` / `A RANK.` |
| 17 | 54 | 22.033 to 23.833 | `THAT IS THE` / `ANSWER.` (accent) |
| 18 | 48 | 23.833 to 25.433 | `SEO STILL WORKS.` |
| 19 | 48 | 25.433 to 27.033 | `IT MEASURES` / `A DIFFERENT` / `THING.` |
| 20 | 75 | 27.033 to 29.533 | label `WE ASK THESE FIVE` + `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 21 | 104 | 29.533 to 33.000 | `SEE WHAT THEY` / `SAY ABOUT YOU.` (accent) plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` top left, and a violet
progress bar at the bottom of the safe zone that fills across the cut.

### Why the copy is shaped this way

The contrarian driver fails in two directions and this cut is built to miss both.

It fails if the belief is never stated, because then the contradiction has nothing
to land on. So scenes 1 to 3 say the belief in the viewer's own words and scene 4
denies it flatly. The whole exchange is over by 2.9s.

It fails if the contradiction overreaches. "SEO is dead" is the version that gets
engagement and deserves the comments it gets. The claim here is that a ranking and
an AI answer are two different measurements, which is the argument the source pages
actually support, and it is stated before any evidence appears rather than walked
back at the end.

The evidence then runs in two halves. Scenes 6 to 10 are the negative case: a brand
already on page one of Google, top recommendation on three engines, named zero times
on a fourth, in the same audit. Scenes 11 to 13 explain the mechanism in three
screens, ending on `THERE IS NO / PAGE TWO.`, which is the single line most likely
to be quoted back. Scene 14 is the positive case, what winning actually looks like:
one category in one city where all five engines named the same company. Scene 17,
`THAT IS THE / ANSWER.`, closes the loop opened at 1.5s and lands at 22.0s, 67% in,
before the drop-off tail rather than at the CTA.

TikTok gets the bluntest of the four cuts. Longest line on screen is 16 characters.
No connective tissue, hard cuts only, no fades anywhere in the picture.

**The first 1.5 seconds carry three states**, measured by ink-pixel count on frames
decoded from the delivered file, not by eye:

```
t=0.000  f0    ink 24,787 px
t=0.400  f12   ink 37,123 px   (+12,336)
t=0.933  f28   ink 56,921 px   (+19,798)
t=1.533  f46   ink 29,393 px   (-27,528)   the contradiction wipes the belief
```

The largest single picture change in the whole cut is that one, at f46, which is
the intended shape for this driver: the screen the viewer was reading is removed
and replaced with a denial.

Raw frame hashes are NOT usable for this. H.264 gives visually identical frames
different quantisation noise, so hashes differ where nothing changed. Ink count and
changed-pixel count do not have that problem.

---

## Factual position, and where every number comes from

| On screen | Claim | Source |
|---|---|---|
| `WE RAN 20 REAL CUSTOMER QUESTIONS.` | "20 Real customer questions tested, identical across every engine" | `brandgeo/web/bg-004.html`, key findings bar |
| `FOR A BRAND ALREADY ON PAGE ONE.` | "a market-leading catering company, the kind of brand that shows up on page one of Google without trying very hard" | `bg-004.html`, body |
| `3` / `ENGINES.` under `TOP AI RECOMMENDATION ON` | "3 Platforms where the brand was the #1 recommendation" | `bg-004.html`, key findings bar |
| `0` / `SAME AUDIT.` under `TIMES NAMED ON A FOURTH ENGINE` | "0 Times the brand appeared anywhere in [one engine]'s answers", same audit, same 20 questions | `bg-004.html`, key findings bar |
| `A RANKING IS TEN LINKS YOU STILL CLICK.` | SEO's unit of success is "Position on a results page (#1 to #10)"; "a spot among ten blue links that a person still has to read, compare, and click through" | `bg-005.html`, comparison table and body |
| `AN ANSWER NAMES A FEW. SOMETIMES ONE.` | "most answers name very few brands, sometimes exactly one" | `bg-005.html`, comparison table |
| `THERE IS NO PAGE TWO.` | "There's no page two to be found on" | `bg-005.html`, body |
| `5 / 5` / `ENGINES NAMED ONE COMPANY.` under `PROPERTY MANAGEMENT IN CHICAGO` | "5/5 Engines that named [one company]: the first fully unanimous result measured anywhere in this research program" | `brandgeo/web/ai-visibility-for-chicago.html`, key findings bar |
| `ONE NAME OWNED THE WHOLE CATEGORY.` | that company "appears in every single one of the 5 engines' responses for 'top-rated property management companies in Chicago'" | same page, body |
| `SEO STILL WORKS. IT MEASURES A DIFFERENT THING.` | "SEO and GEO need to run in parallel, measured separately"; "that's the one signal no SEO tool you already own was built to show you" | `bg-005.html`, body |

Chicago's `5/5` is from the 2026-07-24 collection run, which used **Google AI Mode
in place of the retired Meta AI**, so it is the current five-engine set and the
denominator is genuinely five. The page states this directly in its data-quality
note. All five engines returned usable data on every Chicago prompt that run, no
collection errors, so there is no hidden `x/4` in that figure.

### Five deliberate restraints, each of which cost a stronger-looking screen

1. **No engine count is shown anywhere in the `bg-004` act, and this is the
   important one.** `bg-004` is a five-engine audit, but its fifth engine is not
   today's fifth engine: the page's methodology paragraph lists ChatGPT, Gemini,
   Claude, Perplexity and **Meta AI**, which is retired, while its body names
   **Microsoft Copilot** as one of the three engines where the brand ranked first,
   and Copilot is live on no purchasable plan. Putting "3 of 5" on screen next to a
   scene that lists today's five engines would attach the wrong engine set to a real
   result, which is exactly the reason `bg-016.html` was ruled out of this campaign.
   So the counts are shown as counts of engines with no denominator: `TOP AI
   RECOMMENDATION ON 3 ENGINES`, `TIMES NAMED ON A FOURTH ENGINE 0`. Both are true
   under either reading of that page.
2. **The engine that returned zero is not named**, even though it is named on the
   source page and is in the current five. Attaching a zero to one company's product
   inside an ad is a different act from publishing it on a dated research page with
   a right of reply. `A FOURTH ENGINE` carries the finding without it.
3. **`5 / 5` is labelled `PROPERTY MANAGEMENT IN CHICAGO`, not left global.** It is
   the first and so far only fully unanimous result in the whole program. Shown
   without its category and city it would read as a typical outcome, which would be
   a lie in the direction that flatters us.
4. **Chicago's corporate-law result was left out.** The page reports it as `4/4
   structured engines` in one place and `4/5` in another, both honestly, because one
   engine did not return a structured ranking. A figure that needs a paragraph to
   disambiguate does not belong on a 1.5 second screen.
5. **The `bg-005` third-party statistics were not used**, although they are
   published and would have been the easiest big numbers in the piece. They are
   sourced to outside firms on that page, and on screen, unattributed and with no
   room for a citation line, they would read as BrandGEO measurements. One of them
   is an AI Overviews rate, which this campaign does not publish at all.

**Never a real third-party brand on screen, verified mechanically.** The check
harvests organisation-shaped names from the three source pages (61 multi-word
candidates plus every non-common capitalised token) and matches them against the
exact strings passed to `drawtext`, dumped from the build definition rather than
retyped. Zero hits. The only proper nouns on screen are `BRANDGEO`,
`getbrandgeo.com`, `GOOGLE`, `CHICAGO`, and the five engine names. An explicit
never-list covering every company named on the three source pages, plus the three
statistics vendors, plus Copilot, Meta AI and Grok, returns clean.

**Naming Google is deliberate and is not an exception being smuggled through.** The
driver is a belief about Google rankings; the belief cannot be stated without it.
That is a reference to the search surface the viewer uses, not the commercial use
of a measured party's name in a finding. `GOOGLE AI MODE` appears for the same
reason every run names its engines: it is one of the five we collect from.

Other compliance:

- Engines named are exactly the five in the Growth set, `planConfig.ts`: ChatGPT,
  Gemini, Claude, Perplexity, Google AI Mode. **No Grok and no AI Overviews**, both
  of which went live 2026-07-29 with single-digit row counts from one day. **No Meta
  AI**, retired.
- **No percentage or rate anywhere in the cut.** `3`, `0` and `5 / 5` are counts of
  engines and each carries a label saying so.
- No pricing, no plan names. TOFU, soft CTA (`SEE WHAT THEY SAY ABOUT YOU.`).
- No em dashes, no en dashes, none of the banned vocabulary. Checked
  programmatically against the dumped strings, not by reading.
- "27 cities" is not claimed, and no cross-city aggregate is claimed at all. The
  only city figure is one category in one city.
- No file outside this folder was written. No git command was run. Nothing posted.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right, the tightest of the four
because of the right-hand action rail. Usable box `y 200..1559`, `x ..879`.
Everything below is measured on frames decoded out of the **delivered**
`tiktok-silent.mp4`, never an intermediate.

### Ink threshold, argued from a measured control

Measured first, chosen second:

```
delivered file, known-empty band y1600..1899:   min 9  max 9  at f6, f200, f600, f900, f989
dimmest colour deliberately drawn:              Y ~= 30    (progress track #1B1D2B)
next dimmest:                                   Y ~= 98    (violet rule #7C3AED)
accent:                                         Y ~= 160   (#A78BFA)
brightest:                                      Y ~= 233   (ink #E8E9ED)
```

The encoded background is a flat 9 with zero variance in a region where nothing is
drawn, so the range 10 to 29 is empty. **Threshold 11** sits just above the
background rather than mid-gap, so every glyph's antialiased skirt is counted and
the reported box can only be larger than the design box, never smaller.

The result is not threshold-sensitive. Union over all 990 frames:

```
thr  10   x  99..819   y 260..1495
thr  11   x  99..819   y 260..1495      <- method A
thr  15   x 100..819   y 260..1495
thr  20   x 100..819   y 260..1495
thr  40   x 100..819   y 260..1495
thr  60   x 100..819   y 260..1495
thr 100   x 100..819   y 260..1495
```

### Cross-check against a text-free control

Method B is the brief's per-frame diff, and per the correction added 2026-07-30 it
is diffed against a **text-free control encoded through the identical pipeline**,
never against a flat assumed canvas colour. The control is the same 990-frame
image2 sequence with nothing drawn on it, same `-framerate 30`, same x264 settings.
That cancels the yuv420p frame-edge chroma artefact that made run 3's first attempt
report `x 0..1079, y 0..1513`, because the control carries the artefact too.

```
residual noise in the known-empty band y1600..1899, delivered minus control:  0
threshold 2 therefore sits above the noise floor by construction

method A (gray, thr 11):                    x  99..819   y 260..1495
method B (delivered minus control, >2):     x  96..823   y 256..1499
```

Method B finds more ink on all four edges, by 3 to 4px, which is the expected
result: single-channel fringing survives an RGB comparison and is averaged away by
the gray conversion. Both methods are measuring ink here (the noise floor in a
known-empty region of the delivered file is exactly 0), so the wider number is the
one reported.

### Declared rects folded in

Pixel measurement is blind to anything within a few luma of the canvas. The logo
card is exactly that kind of element, so its geometry is added explicitly rather
than trusted to either measurement:

```
logo overlay      x 100..231   y 1000..1131   (declared, 132x132 at 100,1000)
progress track    x 100..819   y 1490..1495   (declared)
violet card rule  x 100..819   y  700.. 703   (declared)
```

All three sit inside the measured union, so none of them moves it. That is the
outcome to want, not a reason to have skipped the check.

### Reported box, union of everything drawn

```
UNION           x   96..823     y  256..1499
reserves        top y>=200      bottom y<=1559      right x<=879
HEADROOM        top 56px        bottom 60px         right 56px
tightest        56px            verdict PASS (floor is 20px)
```

Run 1's TikTok build cleared the right reserve by 1px. This one clears every edge
by more than 50px, and that was designed rather than discovered: the column was
fixed at x 100 to 820 before the first render, reserving 60px inside the 880 limit,
and the type size was then **fitted by measurement**. Every unique line was rendered
alone at 100pt, its ink width measured, and the largest size from the ladder
78/72/66/60/54 whose widest line fits the 720px column was taken.

```
widest line at 100pt:   ONE NAME OWNED     949 px
                        SAME QUESTIONS.    933 px
                        SEO STILL WORKS.   930 px
                        SO AI NAMES YOU.   929 px
78pt predicted:  949 * 0.78 = 740.2 px  against a 720 px budget  -> does not fit
72pt predicted:  949 * 0.72 = 683.3 px                           -> FITS
72pt measured on the delivered mp4:  x 100..787  (688 px)
```

Prediction and delivered file agree to 5px. Point-size scaling of a hinted TTF is
not exactly linear, so the fitter is an estimate used only to pick a size. The
pass/fail number is always the box measured out of the delivered mp4.

One line, `AN ANSWER NAMES`, measured 1020px at 100pt and was the only string that
would have forced the whole cut down to 66pt. It was re-broken as `AN ANSWER /
NAMES A FEW.` rather than shrinking twenty other screens to accommodate it.

### Type alone, chrome excluded, per scene

Rows below y=1450 ignored, which drops the progress bar and leaves type, the violet
card rules and the logo:

```
scene01  x 101..706  y 260.. 755    scene12  x 100..735  y 260.. 931
scene02  x 101..707  y 260.. 844    scene13  x  99..548  y 260.. 844
scene03  x 101..771  y 260.. 932    scene14  x 100..819  y 260..1143
scene04  x 102..731  y 260.. 773    scene15  x 100..787  y 260.. 932
scene05  x 100..739  y 260..1019    scene16  x 100..555  y 260.. 843
scene06  x 100..706  y 260.. 934    scene17  x 100..544  y 260.. 843
scene07  x 100..588  y 260.. 931    scene18  x 102..773  y 260.. 755
scene08  x 100..819  y 260..1055    scene19  x 100..588  y 260.. 931
scene09  x 100..819  y 260..1055    scene20  x 100..819  y 260..1071
scene10  x 102..775  y 260.. 847    scene21  x 100..719  y 260..1131
```

The 819 right edge on scenes 8, 9, 14 and 20 is the violet card rule, furniture
spanning the full column by design. **Widest actual type is scene 15,
`ONE NAME OWNED`, at x1 = 787, 92px clear of the limit.**

---

## Timeline construction, and the trap that was avoided

**No `ffconcat` anywhere.** On the previous TikTok run the ffconcat demuxer drifted
scene 18 onto frame 694 instead of the designed 693, because cumulative float
durations (70/30 = 2.333333) put the boundary a third of a microsecond past a frame
edge. Total duration and frame count were still exactly right, so nothing about the
container looked wrong. Here the 21 scene stills are expanded into a 990-file
numbered sequence and encoded with `-framerate 30 -i seq/f%04d.png`, which is
frame-exact by construction.

Verified on the delivered file by counting pixels whose luma moved by more than 6
between consecutive frames, decoded sequentially in one pass with no `-ss` anywhere:

```
largest picture change strictly INSIDE any scene :     645 px
smallest picture change AT a designed boundary   :  11,971 px
threshold 6,308 sits in the empty gap between them
detected boundaries == designed boundaries, all 20
```

The two populations separate by a factor of 18, which is what a frame-exact
timeline looks like. Frame hashing was not used: identical pictures get different
quantisation noise in H.264, so hashes differ where nothing changed.

## Progress bar

`drawbox` cannot animate on 8.1.2. It has no `eval` option and evaluates `x/y/w/h`
once at init, so an expression like `w='720*min(1,t/33)'` would silently render
frozen at its t=0 value with no warning. The bar is therefore 21 static boxes, one
per scene, drawn into that scene's still. Verified on the delivered file that it
actually moves, by reading row y=1492 at every scene start:

```
measured  9, 20, 33, 64, 103, 136, 169, 204, 247, 282, 315, 348, 383, 422, 455,
          481, 520, 555, 590, 644, 720
designed  identical, 21 distinct values
```

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending would
have worked, but run 1 lost a violet rule to alpha-0 blending with no error, and
making that structurally impossible is cheaper than reasoning about it per call.

---

## Duration, exact ffprobe on the DELIVERED files

Probed after the copy into this folder, not on the build copies.

```
tiktok-silent.mp4   format 33.000000   nb_streams 1
                    video  33.000000   990 frames   1080x1920  yuv420p  30/1

tiktok-scored.mp4   format 33.000000   nb_streams 2
                    video  33.000000   990 frames   duration_ts 506880 @ 1/15360
                    audio  33.000000  1548 frames   duration_ts 1584000 @ 1/48000
```

33.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string and
`nb_streams=1`. That is what `-an` buys.

**A mux can exit 0 and be unreadable**, so both delivered files were probed for
duration and stream count before this was called done.

**The scored cut did not drift.** The AAC stream decodes to 1,584,128 samples per
channel, 33.002667s of raw payload, but the container reports 33.000000 because
`duration_ts` is 1,584,000 samples exactly, so the trailing quantised tail is
excluded rather than played. `-shortest` is what pins it.

Video is stream-copied into the scored variant. Both files' video streams hash to
`MD5=ce12ba2d9d10528d896608bab72f2562`, so every picture check above holds for both.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master,
1080x1920. Raw `rgb24` MD5 of the cover and of frame 0 of the delivered
`tiktok-silent.mp4` both read `2d36979511301df52bfd01356cd999c5`. Byte-identical.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build. Frame 0
renders at full opacity carrying `YOU RANK FIRST`, so the thumbnail the feed shows
is the first half of the belief the video exists to contradict.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, no attribution
line. 60.000s source, 48kHz stereo. **Held constant across runs on purpose: the hook
is the variable under test, so the bed must not be.**

Trimmed to 33.000s, 0.08s fade in, 1.5s fade out starting at 31.5s.

**The fade in is not cosmetic.** Measured on the source: the first 64 samples peak
at 0.061709 and the first 0.1s peaks at 0.206314, so a cut at sample 0 clicks.

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
pass 1 also reports what a SINGLE pass would have produced: I -14.92
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.01   TP -4.32   LRA 3.50
```

Integrated lands on -16.01 LUFS. The brief is right that single-pass undershoots: it
would have landed at -14.92, 1.08 LU high. True peak is -4.32 dBTP, under the -1.5
ceiling rather than at it, because linear mode applies one flat gain and the peak
lands wherever the integrated target puts it. -1.5 is a ceiling not to exceed, so
this is compliant with 2.8 dB spare.

**Honest read: nobody has listened to this file.** Everything above is measurement.
The excerpt is the same 33s window of the same track used by run 3's TikTok cut, so
it will sound identical to that one. LRA is 3.50 LU over this window against 6.80 LU
over the full 60s track, so the excerpt is less dynamic than the whole piece. The
cuts are driven by reading time and the track runs at a fixed tempo, so they are not
locked to each other and will agree at some cuts by coincidence rather than design.

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
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1000[out]`. A representative graph
body, scene 3:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=260:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=1490:w=720:h=6:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=1490:w=33:h=6:color=0xA78BFA@1:t=fill:replace=1,
drawtext=fontfile='Inter-ExtraBold.ttf':text='YOU RANK FIRST':x=100:y=700:fontsize=72:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-ExtraBold.ttf':text='IN GOOGLE.':x=100:y=788:fontsize=72:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-ExtraBold.ttf':text='SO AI NAMES YOU.':x=100:y=876:fontsize=72:fontcolor=0xA78BFA[out]
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

**5. Text-free control**, for measurement method B, identical settings and identical
frame count, with nothing drawn:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 990 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an control.mp4
```

**6. Verification** decodes the delivered files sequentially, never with `-ss`:

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt gray -
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i control.mp4       -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i tiktok-scored.mp4 -map 0:a:0 -f f32le -ac 2 -ar 48000 -
```

piped frame by frame into numpy. Build artifacts, the control mp4 and the frame
sequences were kept outside this folder; only the four deliverables were written
here.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
card rules, progress track `#1B1D2B`. `#8B5CF6` is used for no text anywhere; it
measures 4.2:1 on this canvas and fails. Inter ExtraBold for headlines and numerals,
SemiBold for labels, engine rows and the eyebrow, Bold for the wordmark, Medium for
the URL, all vendored from `docs/growth/grok-launch/images/_build/fonts/`. Dark only.

## Open items

- **`bg-004.html` contradicts itself about its own engine set and should be fixed.**
  Its methodology paragraph lists the five engines as ChatGPT, Gemini, Claude,
  Perplexity and Meta AI, while its body names Microsoft Copilot as one of the three
  engines where the brand ranked first. One of those is wrong. Meta AI is retired and
  Copilot is on no purchasable plan, so either way the page's engine list is stale.
  This is the reason no denominator appears on screen in scenes 8 and 9, and it will
  block any future asset that wants to use `bg-004` more directly. Out of this
  task's write scope.
- **The positive and negative cases come from different collection eras.** Scenes 6
  to 10 are a July 2 audit on the older engine set; scene 14 is a July 24 city run on
  the current five. Both are true, neither is aggregated with the other, and no
  screen claims they are the same dataset. A cleaner version of this cut would source
  both halves from the current five-engine city program, which needs a city page that
  records a rank-versus-answer comparison. None does today, because the city pipeline
  does not collect Google rankings at all.
- **`THERE IS NO / PAGE TWO.` is the strongest line in the cut and gets 1.6s.** If
  this driver tests well, take 12 frames from scene 15, which restates scene 14, and
  give them to scene 13.
- Nobody has heard the scored cut. See the music section.
- `RUN.md` at the run root records which hook driver the run used, per the brief. It
  is outside this task's write scope and was not created here.
