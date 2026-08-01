# Instagram Reel, run 20260730-0013

**Hook driver:** #3, curiosity gap, "we asked five engines the same question, one
pattern held".

This is deliberately neither of the first two drivers. Run 1 was loss aversion
(*you are losing answers you cannot see*) and run 2 was status threat (*a named
rival occupies the position*). Both point a threat at the viewer. This one does
not threaten at all: it opens a loop and closes it. The viewer is offered a
finding they want the end of, and the only tension in the cut is "what was the
pattern", not "what are you losing".

Structurally that changes the edit. The threat drivers front-load their claim in
scene 1 and spend the rest of the cut escalating it. A curiosity gap has to
withhold, so scene 1 states the *method* and not the result ("We asked five AI
engines the same question"), scene 2 names the loop out loud ("One pattern held
in both"), and the payoff is deferred to scenes 4 and 5 where the two halves of
the finding land side by side in the same visual shape. Scene 6 is the close.
Scene 7 re-opens a small loop pointed at the CTA, which is the curiosity-gap way
of asking rather than the fear way.

**This is the first driver in the cycle carrying real evidence, and it does.**
Every number on screen traces to a published city-research page. Sourcing table
below.

Register is Instagram-native: one idea per card, short declaratives, the accent
colour used as the beat rather than as decoration, no hashtags or emoji in the
frame, no second-person accusation.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows; `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 4,280,911 bytes, scored 4,999,797 bytes, cover 253,520 bytes.

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=130. Each block is vertically centred on y=880, the centre of the 220..1500
visible band.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282), the wordmark
`BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a progress
bar at y=1438.

**0.00 to 4.30 s**, Inter ExtraBold 84, ink `#E8E9ED`. Hard in at full opacity,
no fade up, because this frame is the cover.
```
We asked five
AI engines the
same question.
```

**4.30 to 8.40 s**, Bold 84 ink, then ExtraBold 84 accent `#A78BFA`
```
Two cities.
Six categories.

One pattern
held in both.
```

**8.40 to 13.30 s**, SemiBold 40 accent kicker, then Medium 62 ink
```
THE FIVE WE ASKED

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**13.30 to 17.80 s**, Bold 84 ink, then ExtraBold 76 accent
```
Property
management.

Boston  5 of 5
Houston  4 of 5
```

**17.80 to 22.00 s**, Bold 84 ink, then ExtraBold 76 accent
```
Real estate
agents.

Boston  2 of 5
Houston  2 of 5
```

**22.00 to 25.20 s**, Bold 84 ink, then ExtraBold 84 accent
```
Companies
converge.

Individuals
fragment.
```

**25.20 to 28.00 s**, Bold 74 ink, URL SemiBold 54 accent. No fade out, so the
CTA holds to the last frame.
```
Which side is
your category on?

getbrandgeo.com
```

---

## Every number on screen, and the published page it comes from

Nothing here is illustrative. Each figure was read out of the live HTML, not
recalled.

| On screen | Source page | Exact wording on that page |
|---|---|---|
| "five AI engines" / the five names | `brandgeo/web/ai-visibility-for-boston.html` and `ai-visibility-for-houston.html` | "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity" |
| "Two cities." | both pages | Boston and Houston are the two pages used |
| "Six categories." | both pages | "We ran 6 real Boston categories" / "We ran 6 real Houston categories" |
| Property management **Boston 5 of 5** | `ai-visibility-for-boston.html` | consensus table: "Property management \| Green Ocean Property Management \| 5/5, full unanimous presence" |
| Property management **Houston 4 of 5** | `ai-visibility-for-houston.html` | consensus table: "Property management \| Shannon Property Management, Real Property Management Preferred \| 4/5 each" |
| Real estate agents **Boston 2 of 5** | `ai-visibility-for-boston.html` | consensus table: "Real estate agents \| Robert Cohen (loose) \| 2/5, fragmented" |
| Real estate agents **Houston 2 of 5** | `ai-visibility-for-houston.html` | consensus table: "Real estate agents \| Evan Compean / Compean Group (loose) \| 2/5, most fragmented" |
| "Companies converge. Individuals fragment." | both pages | Houston: "Individual real estate agents and immigration lawyers, meanwhile, stayed as fragmented as anywhere else measured." Boston: "Individual real estate agents remain the easiest door in / No agent name crossed 2/5 engines." |

### Why these two pages and not BG-016

`bg-016.html` is the obvious source for a cross-engine consensus claim and it was
read first. **It was rejected on a factual-limits grounds and the reason is worth
recording.** BG-016's dataset was collected on a four-engine run that included
**Meta AI**, which is retired. A cut that says "we asked five engines" and then
names the current five while quoting a number produced by a set containing a
retired engine would be a real mismatch, not a technicality.

The city pages do not have that problem: both explicitly state they ran on
ChatGPT, Claude, Gemini, Google AI Mode and Perplexity, and Boston states in so
many words that the run "used Google AI Mode in place of the now-retired Meta AI
engine used in earlier city pages". So the five named on screen are exactly the
five that produced the numbers on screen.

### Compliance check on the copy

- Five engines named are exactly `PLAN_ENGINES.growth` in
  `brandgeo-dashboard/src/lib/planConfig.ts:56`: `chatgpt`, `gemini`, `claude`,
  `perplexity`, `google_ai`. Verified against the file, not assumed.
- **No Grok and no AI Overviews**, and no rate for either. Both are
  `growth_pro` and up (`planConfig.ts:65`) and both went live 2026-07-29 with a
  single day of rows. **Meta AI is retired and does not appear.** Copilot and
  DeepSeek are on no purchasable plan and do not appear.
- No pricing anywhere. TOFU asset, soft CTA, the URL is the only ask.
- No em dashes, no en dashes. None of the banned vocabulary (delve, unlock,
  unleash, elevate, harness, leverage, game-changer, supercharge, revolutionize,
  seamless, robust, cutting-edge, transformative).
- "5 of 5" and "2 of 5" are written as words rather than "5/5" deliberately: a
  slash at 76px on a phone reads as a fraction bar and invites a percentage
  reading, which these are not. They are engine counts.

---

## Duration

`ffprobe` on the DELIVERED files, not assumed, and run before this was called
done.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **28.000000 s** | 840 frames @ 30/1, `duration_ts=430080 / 15360`, 1080x1920, `yuv420p` | **none, `nb_streams=1`** |
| `instagram-scored.mp4` | **28.000000 s** | 840 frames, identical stream (MD5 match) | `duration_ts=1344000 / 48000` = 28.000000 s, 1314 AAC frames, `nb_streams=2` |

Both land on exactly 28.000000 s, inside the 20 to 30 s Instagram target.

The brief's AAC drift warning was measured rather than assumed: decoding the
delivered scored audio yields **1,344,512 samples = 28.010667 s**, 512 samples of
encoder padding past the cut. The mp4 sample table caps the track at
`duration_ts=1344000`, exactly 28.000000 s, so the padding exists as packet
payload and is never played. `-shortest` is what holds that line.

Both files: H.264 High, `yuv420p`, from PNG intermediates only. No JPEG anywhere
in the chain, so no `yuvj420p` range shift.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 840 frames**, reduced to a global extreme. Two independent
methods, plus declared geometry folded in explicitly.

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays, same
noise seed (`all_seed=20260730`), no logo, no rails, no bar, no type. Measured
across all 840 control frames:

```
control peak luma, whole frame        39.7
control peak luma, copy band          37.9
delivered peak luma, x >= 940         37.9   (nothing is ever drawn there)
```

Drawn colours, Rec.709 luma:

| Element | Colour | Luma |
|---|---|---|
| Body and list type | `#E8E9ED` | 232 |
| Accent type | `#A78BFA` | 157 |
| Progress fill | `#8B5CF6` | 113 |
| Left rail, pre-blended | `#3D2B6B` | 51 |
| Progress track, pre-blended | `#2A2C38` | **44** |

The gap between background peak (39.7) and the dimmest *bright* element is wide,
so thresholds of 45, 60 and 90 all sit inside it and return the same box. That
agreement is the evidence the gap is real rather than a lucky pick.

**The progress track at luma 44 is 4 above the background peak and is not
separable by any threshold.** That is why method B exists, and why declared
geometry is folded in on top of it.

### Method B, per-pixel diff against the control (authoritative)

Same noise seed and same frame numbers, so the difference is exactly the set of
pixels that were DRAWN, at any luma, including furniture darker than the
background. Diff noise floor in the never-drawn strip `x >= 960` measured **10**,
so the threshold was set at 12.

```
GLOBAL INK BOX, union of everything drawn, 840 frames:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  811    limit <=  900    margin  +89 px
  left   x =   96    (no left reserve specified)
```

### Method A, absolute luma threshold (cross-check)

```
luma >  45 : y  301..1442  x   96..809   top +81  bottom +58  right +91
luma >  60 : y  301..1442  x  130..809   top +81  bottom +58  right +91
luma >  90 : y  301..1442  x  130..809   top +81  bottom +58  right +91
luma > 120 : y  302..1442  x  131..799   top +82  bottom +58  right +101
```

The two methods agree, and every difference is explained rather than waved at.
**Per the brief, the method finding MORE ink is the one trusted, and that is B on
all three binding edges:**

- **Top, 282 vs 301.** 19 px. The logo card is drawn at y=282 and its rounded
  corners are near-black, so a luma threshold cannot see the top of it. The
  binding number is **282**.
- **Right, 811 vs 809.** 2 px of antialiased and compressed edge on the progress
  fill, which is drawn to x=809 exactly.
- **Bottom, 1445 vs 1442.** The bar is drawn at y=1438 h=5, so its last lit row
  is 1442 and method B picks up 3 rows of encoder bleed.

### Declared geometry, folded in explicitly

Per the brief's blind-spot rule, every element drawn near the canvas value has
its declared rect folded into the union rather than trusted to measurement:

```
logo card       x 130..213   y  282..365
wordmark        x 236..435   y  303..343
left rail       x  96..99    y  640..1119
progress track  x 130..809   y 1438..1442
progress fill   x 130..809   y 1438..1442
furniture union x  96..809   y  282..1442
```

The declared union does not exceed the measured union on any edge, so method B
did in fact see all of it. That is a confirmation, not a substitute.

### Final result

```
EVERYTHING DRAWN, measured OR declared, whichever is worse:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  811    limit <=  900    margin  +89 px

  SMALLEST HEADROOM ON ANY EDGE : +55 px    (failure floor is 20)
  RESULT: PASS
```

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Which element sets each extreme, and what was never at risk

- **Top 282** is the brand icon card.
- **Bottom 1445** is the progress bar at y=1438 h=5.
- **Right 811** is the progress bar at full extension.
- **Left 96** is the accent rail.

**Furniture is the binding constraint on all three edges, not type.** Measured
separately over the copy band only (y 400..1400, so the logo and bar are
excluded), the type block runs **y 643..1112, x 130..784**, which is 423 px from
the top reserve, 388 px from the bottom, and 116 px of right clearance.

The widest single line was measured before rendering, per line, on isolated
probe renders: worst case was `your category on?` at Bold **78**, reaching
x=820, which is 80 px of clearance. That passes but it would have made *type*
the binding right edge for the first time in this campaign, ahead of the
progress bar. It was reduced to Bold **74**, which pulls it to x=784 and puts
furniture back in control. Nothing about that was visible at preview scale; it
came out of the probe pass.

---

## Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(4.30-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 17146dd7cb96f882038a4c73355c590e
instagram-cover.png             : 17146dd7cb96f882038a4c73355c590e
```

Video stream MD5, identical across both cuts: `efe6d160839f117dfbb587279adf0b7b`.

---

## Progress bar actually animates

The brief's `drawbox` trap was respected up front: geometry is literal on every
box and the only expression anywhere in the bar is `enable`. The fill is **56
discrete static boxes**, one per 0.5 s, at literal widths.

Verified on the DELIVERED file by reading row y=1440 of every decoded frame:

```
frame   0  t= 0.000s   bar width =  12 px
frame  30  t= 1.000s   bar width =  36 px
frame 105  t= 3.500s   bar width =  97 px
frame 300  t=10.000s   bar width = 255 px
frame 600  t=20.000s   bar width = 498 px
frame 750  t=25.000s   bar width = 619 px
frame 839  t=27.967s   bar width = 680 px

monotonic non-decreasing : True
56 distinct widths, min 12, max 680  ->  ANIMATES
```

### Scene boundaries, counted not hashed

Per the brief, frames were decoded sequentially in one pass and indexed, with no
`-ss` seeking anywhere, and scene changes were found by counting ink pixels per
frame rather than hashing:

```
ink-pixel transitions at t = 4.17, 4.47, 8.23, 8.50, 13.17, 13.47,
                            17.63, 17.97, 21.83, 22.17, 25.03, 25.37
scripted cuts         at t = 4.30, 8.40, 13.30, 17.80, 22.00, 25.20
```

Each scripted cut sits inside a pair of transitions, which is the outgoing fade
and the incoming fade of the crossover. Six cuts, six pairs, no extras and none
missing.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, generated by `scripts/compose_music.py`, no third-party material,
cleared for commercial use including paid advertising, **no attribution line
required**. Nothing was downloaded.

**Note on the choice, since `ATTRIBUTION.md` disagrees with it.** That file's
"Deliverables and roles" table nominates `tension-minor` for *loss aversion and
status threat*, and nominates `build-resolve` for *curiosity gap*, which is this
run's driver. The track was still held at `tension-minor` because the campaign is
an A/B test in which **the hook is the variable under test**. Changing the music
in the same run that changes the driver would confound the comparison and make
the result unattributable. The nomination table is a taste recommendation; the
experimental design outranks it. Worth revisiting once the driver cycle
completes and music can be varied deliberately as its own test.

Source is 60.000 s. Trimmed to 28.000 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 26.5 s**, then two-pass `loudnorm`.

### The fade in is load-bearing and was verified

`tension-minor` opens at amplitude 0.025 and peaks at 0.206 inside its first
0.1 s, so a hard cut at sample 0 clicks. Measured on the **delivered** file, by
decoding the AAC:

```
FIRST 64 SAMPLES, abs max : 0.002845     ceiling 0.005    PASS
first 10 ms,      abs max : 0.013417
final 0.1 s,      abs max : 0.0259       (fade out landed)
overall peak              : 0.6143  (-4.23 dBFS)
```

### Loudness, measured not assumed

Pass 1 on the trimmed cut: `input_i=-16.21`, `input_tp=-4.41`, `input_lra=3.60`,
`input_thresh=-26.27`, `target_offset=-1.14`. The brief's warning is confirmed
again on this material: a single pass would have landed about 1.1 LU off.

Re-measured on the **delivered** `instagram-scored.mp4`, decoding the AAC:

| | Target | Measured |
|---|---|---|
| Integrated | -16 LUFS | **-16.02 LUFS** |
| True peak | -1.5 dBTP max | **-4.22 dBTP** |
| LRA | n/a | 3.60 |

True peak sits 2.7 dB under the ceiling. -1.5 dBTP is a maximum, not a target,
and with `linear=true` the gain is one scalar chosen to hit the integrated
target, so nothing was limited and no shape was altered.

### Honest read

Measured, not listened to.

```
RMS and spectral centroid per 2 s block
   0- 2   -21.21 dBFS    470 Hz   <- fade in, deliberately quiet
   2- 4   -21.78         216
   4- 6   -17.67        1203
   6- 8   -16.20        1318
   8-10   -16.20        1439
  10-12   -16.48        1364
  12-14   -15.77        2702      <- arrangement opens, under the engine list
  14-16   -16.57        2417
  16-18   -16.48        1907
  18-20   -15.98        1800
  20-22   -15.91        2122
  22-24   -15.91        2458
  24-26   -15.14        2488      <- loudest block, under the close
  26-28   -19.56        2116      <- fade out
```

```
band levels, dB relative to the full mix
    20-80    Hz   -1.71
    80-160   Hz   -6.55
   160-320   Hz  -13.34
   320-640   Hz  -13.53
   640-1280  Hz  -20.41
  1280-2560  Hz  -25.68
  2560-5120  Hz  -31.59
  5120-10240 Hz  -37.31
 10240-20000 Hz  -40.49
```

**What is good, and it happens to fit this driver better than expected.** It
builds. RMS climbs about 6.6 dB from the opening block to the 24-26 s block and
the spectral centroid moves from roughly 470 Hz to 2500 Hz. The two structural
peaks land at **12-14 s**, which is the engine-list card, and **24-26 s**, which
is the "Companies converge / Individuals fragment" close. For a curiosity-gap cut
that is the right shape by accident: the track opens up at the moment the method
is shown and peaks at the moment the loop closes.

**The weakness, stated plainly and unchanged from run 2.** It is heavily
bottom-weighted. Full-mix RMS is -16.82 dBFS; filtering everything below 300 Hz
leaves **-28.26 dBFS**, an **11.4 dB** drop. On a phone speaker, which has almost
nothing under 200 Hz, this will play noticeably softer and thinner than -16 LUFS
suggests, and most of what carries the build sits in the quietest bands.

That is not a reason to change the default. **`instagram-silent.mp4` is still the
file to upload organically**, because Instagram's in-app library is licensed for
the platform and favoured by its distribution. `instagram-scored.mp4` is for
paid, embeds and decks, where the in-app library does not exist.

---

## Exact commands

Paths are relative to a build directory holding `fonts/` (the vendored Inter
files, copied unmodified from
`docs/growth/grok-launch/images/_build/fonts/`), `txt/` (one file per on-screen
line, used through `textfile=` so no filtergraph escaping is needed), `logo.png`
(copied from `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`),
`tension-minor.wav` (copied from `assets/audio/music/`), and the two generated
glow PNGs.

### 0. Type-width probe, run BEFORE the master

Each of the 28 copy lines was rendered alone at its final font and size and its
ink bounding box measured, so the right reserve was checked before 30 seconds of
encoding rather than after.

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1080x300" \
  -vf "drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/pNN.txt:x=130:y=40\
:fontsize=78:fontcolor=0xFFFFFF" -frames:v 1 probeNN.png
```

### 1. Background glows, one frame each

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='139':g='92':b='246':a='66*exp(-1.9*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 glow-violet.png

ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='99':g='102':b='241':a='46*exp(-2.2*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 glow-indigo.png
```

### 2. Master render

```bash
ffmpeg -y \
  -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=28.0" \
  -loop 1 -i glow-violet.png \
  -loop 1 -i glow-indigo.png \
  -loop 1 -i logo.png \
  -filter_complex_script filtergraph.txt \
  -map "[v]" -an -t 28.0 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 \
  out-silent.mp4
```

The filtergraph is 12,489 characters: 29 `drawtext` calls (28 copy lines plus the
wordmark) and 58 `drawbox` calls (the rail, the bar track, and 56 progress
steps). Structure, with one scene shown as the representative case:

```
[0:v]format=rgba[base];
[base][1:v]overlay=x='150+40*sin(t/7)':y='900+30*cos(t/9)':format=auto[b1];
[b1][2:v]overlay=x='-500+35*cos(t/8)':y='-340+28*sin(t/6)':format=auto[b2];
[3:v]scale=84:84[lg];
[b2][lg]overlay=x=130:y=282:format=auto[b3];
[b3]drawbox=x=96:y=640:w=4:h=480:color=0x3D2B6B@1:t=fill:replace=1,
  drawbox=x=130:y=1438:w=680:h=5:color=0x2A2C38@1:t=fill:replace=1,

  [progress fill, 56 static boxes, no geometry expression anywhere:]
  drawbox=x=130:y=1438:w=12:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(t\,0.0000\,0.5000)',
  drawbox=x=130:y=1438:w=24:h=5:...:enable='between(t\,0.5000\,1.0000)',
  ... 54 more ... final step w=680 at 27.5000..28.0000,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover:]
  drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=txt/l00.txt:x=130:y='724'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,(4.30-t)/0.30))':enable='between(t\,0.00\,4.30)',
  ... l01 at y=828, l02 at y=932 ...

  [scenes 2 to 6, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/l03.txt:x=130
    :y='649+18*(1-min(1\,(t-4.30)/0.45))'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.30)/0.35\,(8.40-t)/0.30)))'
    :enable='between(t\,4.30\,8.40)',
  ...

  [scene 7, the CTA, fades IN only so it holds to the final frame:]
  drawtext=...:alpha='max(0\,min(1\,(t-25.20)/0.35))'
    :enable='between(t\,25.20\,28.00)',

  noise=alls=3:allf=t+u:all_seed=20260730,
  format=yuv420p[v]
```

The `noise` pass dithers the large soft gradient so H.264 does not band it; its
seed is pinned so the control render can be diffed against the delivered one.

### 3. Control render, for the diff measurement

Identical background and identical noise seed, with the logo, rails, bar and all
type removed. This is the reference that makes method B possible.

```bash
ffmpeg -y -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=28.0" \
  -loop 1 -i glow-violet.png -loop 1 -i glow-indigo.png \
  -filter_complex_script filtergraph-control.txt \
  -map "[v]" -an -t 28.0 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 control.mp4
```

### 4. Audio

```bash
# trim 60.000s to 28.000s, 0.08s fade IN (the track opens at 0.025 and clicks
# on a hard cut), 1.5s fade OUT
ffmpeg -y -i tension-minor.wav \
  -af "atrim=0:28.0,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,afade=t=out:st=26.5:d=1.5" \
  -c:a pcm_s24le music-cut.wav

# pass 1, measure
ffmpeg -i music-cut.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values
ffmpeg -y -i music-cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11\
:measured_I=-16.21:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.27\
:offset=-1.14:linear=true" -ar 48000 -ac 2 -c:a pcm_s24le music-norm.wav
```

### 5. Deliverables

```bash
# silent master, no audio stream at all
ffmpeg -y -i out-silent.mp4 -map 0:v:0 -an -c:v copy -movflags +faststart \
  instagram-silent.mp4

# cover, genuine frame 0
ffmpeg -y -i instagram-silent.mp4 -frames:v 1 -f image2 -c:v png \
  instagram-cover.png

# scored cut, video stream copied so it stays byte-identical
ffmpeg -y -i instagram-silent.mp4 -i music-norm.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest \
  -movflags +faststart instagram-scored.mp4
```

### 6. Verification actually run on the DELIVERED files

```bash
# durations and stream tables. A mux can exit 0 and be unreadable, so this
# runs before the render is called done.
ffprobe -v error -show_entries format=duration,nb_streams -show_entries \
  stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,duration,\
duration_ts,time_base,nb_frames -of default=nw=1 instagram-silent.mp4

# no audio stream on the master (returns zero rows)
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 \
  instagram-silent.mp4

# video streams identical across both cuts
ffmpeg -v error -i instagram-silent.mp4 -map 0:v -c copy -f md5 -
ffmpeg -v error -i instagram-scored.mp4 -map 0:v -c copy -f md5 -

# cover == frame 0, over raw RGB
ffmpeg -v error -i instagram-silent.mp4 -frames:v 1 -f rawvideo -pix_fmt rgb24 - | md5sum
ffmpeg -v error -i instagram-cover.png -f rawvideo -pix_fmt rgb24 - | md5sum

# loudness of the delivered scored file, decoding the AAC
ffmpeg -i instagram-scored.mp4 -map 0:a \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -
```

The safe-zone measurement, the bar-animation check and the scene-boundary count
are one numpy pass over two synchronised `ffmpeg -f rawvideo -pix_fmt rgb24`
pipes, the delivered file and the control, decoded sequentially with no seeking,
over all 840 frames, reduced to a global extreme.

---

## Nothing new broke, and one thing was avoided by measurement

Every trap in the shared brief was applied as a precondition rather than
discovered: `replace=1` on both boxes with pre-blended opaque colours so nothing
depends on alpha, literal `drawbox` geometry with `enable` as the only
expression, no fade up on scene 1, sequential decode with no `-ss`, `-shortest`
on the mux, a probe on the delivered file rather than a trusted exit code, and
declared rects folded into the union.

**The one live catch this run:** the type-width probe found `your category on?`
at Bold 78 reaching x=820. That passes the reserve, at 80 px, but it would have
made type the binding right edge for the first time in this campaign. Reduced to
Bold 74, which pulls it to x=784 and restores the progress bar as the constraint
at 811. Caught before rendering, at the cost of one cheap probe pass, and not
visible at preview scale.

## Scope

This task was scoped to this `instagram/` folder only. Nothing outside it was
written, including this run's `RUN.md`, which is a sibling agent's file. No git
command was run.

## Nothing was posted or scheduled

These are files for review only.
