# Instagram Reel, run 20260729-2318

**Hook driver:** #2, status threat, "your competitor is the default answer and
you are not".

This is deliberately not run 1's loss aversion. Run 1's thesis was *invisible
loss*: answers are happening, you never see them, you cannot count what you lost.
This one is about *occupancy*. The position exists, it is singular, and a named
rival is standing in it. The emotional load is rivalry and displacement, not
blindness. The two hooks share a product but not a sentence.

The turn is scene 3, "They did not outrank you. They became the answer." That
line is what separates status threat from an SEO complaint: the loss is of a
status position, not of a rank, so the reader cannot file it under work they
already do.

Register is Instagram-native: short second-person declaratives, one idea per
card, heavy use of the accent colour as the emotional beat rather than as
decoration. No blunt TikTok phrasing, no LinkedIn framing, no hashtags or emoji
baked into the frame, no numbers.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (verified: `ffprobe -select_streams a` returns zero rows). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, RGB24. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 3,990,471 bytes, scored 4,710,179 bytes, cover 234,886 bytes.

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left
aligned at x=130.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282) and the
wordmark `BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a
progress bar at y=1438.

**0.00 to 4.40 s**, Inter ExtraBold 84, ink `#E8E9ED`. Hard in at full opacity,
no fade up, because this frame is the cover.
```
Your category
already has a
default answer.
```

**4.40 to 8.70 s**, Bold 84 ink, then ExtraBold 88 in accent `#A78BFA`
```
It names one
brand first.

That brand
is not you.
```

**8.70 to 12.90 s**, Bold 84 ink, then ExtraBold 84 accent
```
They did not
outrank you.

They became
the answer.
```

**12.90 to 17.60 s**, SemiBold 40 accent kicker, then Medium 62 ink
```
WHO THEY NAME FIRST

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**17.60 to 21.60 s**, Bold 84 ink, last line ExtraBold 84 accent
```
Every answer
puts one brand
at the top.

Only one.
```

**21.60 to 24.80 s**, ExtraBold 78 ink
```
A default gets
harder to move
every week.
```

**24.80 to 28.00 s**, Bold 78 ink, URL SemiBold 54 accent
```
Find out who AI
names in your
category.

getbrandgeo.com
```

### Compliance check on the copy

- **No numbers on screen anywhere.** Not a percentage, not a score, not a count.
  The engine count is not even stated as a word; the list stands on its own. So
  nothing on screen needs to trace to a `bg-*.html` page, because nothing on
  screen is a figure.
- The five engines named are exactly `PLAN_ENGINES.growth` from
  `brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
  `perplexity`, `google_ai`. **Meta AI is retired and does not appear.** Grok and
  AI Overviews do not appear, and no rate for either appears, which is the point
  of the brief's rule: both went live 2026-07-29 with one day of rows.
  Copilot and DeepSeek are on no purchasable plan and do not appear.
- No pricing. TOFU asset, soft CTA, the URL is the only ask.
- No em dashes, no en dashes. None of the banned vocabulary.
- Nothing on screen is framed as a measurement, a result or a client outcome.
  "Your category already has a default answer" is a claim about how generative
  answers behave, not a reading taken from anything.

---

## Duration

`ffprobe` on the delivered files, not assumed.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **28.000000 s** | 840 frames @ 30 fps, `duration_ts=430080 / 15360` | **none, zero audio streams** |
| `instagram-scored.mp4` | **28.000000 s** | 840 frames, identical stream (MD5 match) | `duration_ts=1344000 / 48000` = 28.000000 s |

Both land on exactly 28.000000 s, inside the 20 to 30 s Instagram target.

The brief's AAC drift warning applies and was measured rather than assumed:
decoding the delivered scored audio yields **1,344,512 samples = 28.010667 s**,
512 samples of AAC encoder padding past the cut. The mp4 sample table caps the
track at `duration_ts=1344000`, exactly 28.000000 s, so the padding exists as
packet payload and is never played. `-shortest` is what holds that line.

Both files: 1080x1920, 30 fps, H.264 High profile, `yuv420p`, from PNG
intermediates only. No JPEG anywhere in the chain, so no `yuvj420p` range shift.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, all 840 frames, reduced to a global extreme. Two independent methods.

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays,
same noise seed, no logo, no rails, no bar, no type. Measured across all 840
control frames:

```
control peak luma, whole frame        39.9
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

So the gap between background (39.9) and the dimmest *bright* element is wide,
and thresholds of 45, 60 and 90 all sit inside it. They return an identical box,
which is the evidence that the gap is real rather than a lucky pick.

**The progress track at luma 44 is only 4 above the background peak and is not
reliably separable by any threshold.** That is precisely why method B exists
rather than being a nicety.

### Method B, the authoritative union

Per-pixel diff of the delivered file against the control, same noise seed and
same frame numbers, so the difference is exactly the set of pixels that were
DRAWN, at any luma, including furniture darker than the background. The diff
noise floor in the never-drawn strip `x >= 960` measured **10**, so the
threshold was set at 12.

```
GLOBAL INK BOX, union of everything drawn, 840 frames:

  top    y =  281    limit >= 220     margin  +61 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  813    limit <=  900    margin  +87 px
  left   x =   96    (no left reserve specified)

RESULT: PASS on all three, smallest margin +55 px
```

### Method A, absolute luma threshold, for cross-check

```
luma >  45 : y  301..1442  x   96..809   top +81  bottom +58  right +91
luma >  60 : y  301..1442  x  130..809   top +81  bottom +58  right +91
luma >  90 : y  301..1442  x  130..809   top +81  bottom +58  right +91
luma > 120 : y  303..1442  x  130..770   top +83  bottom +58  right +130
```

The two methods agree, and where they differ the difference is explained rather
than waved at:

- **Right, 809 vs 813.** 4 px, the antialiased and compressed edge of the
  progress fill, which is drawn to x=809 exactly.
- **Top, 301 vs 281.** 20 px. The logo card is drawn at y=282 and its rounded
  corners are near-black, so a luma threshold cannot see the top of it. Method B
  can. The binding number for the top reserve is therefore **281**, not 301.
- **Bottom, 1442 vs 1445.** The bar is drawn at y=1438 h=5, so its last lit row
  is 1442 and method B picks up 3 rows of encoder bleed.

### Which element sets each extreme

- **Top 281** is the brand icon card at y=282.
- **Bottom 1445** is the progress bar at y=1438, h=5.
- **Right 813** is the progress bar at full extension, x=130 + w=680 → 809.
- **Left 96** is the accent rail.

**Furniture is the binding constraint on all three edges, not type.** Measured
separately over the copy band only (y 400..1400, so the logo and bar are
excluded), the widest line of type reaches **x = 770**, which is 130 px of right
clearance, and the block runs y 644..1108, which is 424 px from the top reserve
and 392 px from the bottom. Type was never at risk. This is the run 1 lesson
holding: measure the union, or you measure the wrong thing.

An earlier build in this session had the logo at y=250 and the bar at y=1450
w=700. It passed method A comfortably and passed method B at **top +29**. That
is over the brief's 20 px floor but it is a thin number for an element that
exists only to sit in a corner, so the logo moved to 282, the bar to 1438, and
the bar narrowed to 680. The measurement is what surfaced it; nothing about it
was visible at preview scale.

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(4.4-t)/0.30))`, which is 1 at t=0 and only ramps at the tail. There
is no fade up anywhere in the cut's first scene, which is the run 1 Instagram
defect this avoids.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 42cef9dffc81228fb2a8f5c0fc1ddd82
instagram-cover.png             : 42cef9dffc81228fb2a8f5c0fc1ddd82
```

Video stream MD5, identical across both cuts: `12474a79b75cdec52965151b49d2f46c`.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, generated by `scripts/compose_music.py`, no third-party material,
cleared for commercial use including paid advertising, **no attribution line
required**. Nothing was downloaded and no bed was synthesized for this run.

Per `assets/audio/ATTRIBUTION.md` the track is 100 BPM, C minor, 25 bars, and is
the one nominated for loss aversion and status threat, which is this run's driver.

Source is 60.000 s. Trimmed to 28.000 s with a **1.5 s fade out starting at
26.5 s**, then two-pass `loudnorm`.

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
| Sample peak | n/a | -2.82 dBFS |

True peak sits 2.7 dB under the ceiling. -1.5 dBTP is a maximum, not a target,
and with `linear=true` the gain is one scalar chosen to hit the integrated
target, so nothing was limited and no shape was altered. Trimming the source
moved it from its library value of -16.00 / -3.60 to -16.21 / -4.41; pass two
put the integrated figure back.

Fade verified in the samples: peak 0.715 at 26.4 s, 0.033 in the final 0.1 s,
which is about 27 dB down.

### Honest read

This is a real arrangement, not a sine bed, and it is a clear improvement on run
1's fallback. Measured rather than listened to:

```
band levels, dB relative to the full mix
    20-80   Hz  -15.52 dBFS   -1.71
    80-160  Hz  -20.36        -6.55
   160-320  Hz  -27.15       -13.34
   320-640  Hz  -27.35       -13.53
   640-1280 Hz  -34.22       -20.41
  1280-2560 Hz  -39.45       -25.64
  2560-5120 Hz  -45.38       -31.57
  5120-10240Hz  -51.11       -37.30
 10240-20000Hz  -54.29       -40.48
```

```
RMS and spectral centroid per 2 s block
  0-2   -18.09 dBFS   1511 Hz
  2-4   -18.77        1531
  4-6   -14.66        1308
  6-8   -13.19        1544
  8-10  -13.19        1359
 10-12  -13.47        1381
 12-14  -12.76        2378   <- arrangement opens here
 14-16  -13.56        2614
 16-18  -13.47        1920
 18-20  -12.97        2317
 20-22  -12.90        2041
 22-24  -12.90        2286
 24-26  -12.13        2290   <- loudest block
 26-28  -16.55        2247   <- fade
```

**What is good:** it builds. RMS climbs about 6 dB from the opening two seconds
to the 24-26 s block, and the spectral centroid moves from roughly 1500 Hz to
2300-2600 Hz, so the top end genuinely opens up around 12 to 14 s, which lands
under the engine-list card. That is real movement, not a drone, and the loudest
point sits under the CTA run-up.

**The weakness, stated plainly:** it is heavily bottom-weighted. Filtering
everything below 300 Hz leaves the mix **11.4 dB quieter**, so on a phone speaker,
which has almost nothing under 200 Hz, this will play noticeably softer and
thinner than -16 LUFS suggests, and most of what carries the build is in the
quietest bands. It is a headphone and in-feed-with-good-speakers track. It also
starts on a downbeat rather than from silence: the first 10 ms peaks at 0.133, so
there is an audible attack at t=0 rather than a soft entry.

That is not a reason to change the default. **`instagram-silent.mp4` is still the
file to upload organically**, because Instagram's in-app library is licensed for
the platform and favoured by its distribution. `instagram-scored.mp4` is for
paid, embeds and decks, where the in-app library does not exist.

---

## Two defects this run's measurement caught

Both are worth carrying into the shared brief.

**1. `drawbox` cannot animate. It has no `eval` option and evaluates x/y/w/h once
at init.** The progress fill was written as
`w='680*min(1,t/28)'`, which is the obvious way to do it and renders a **frozen**
bar: measured 680 px wide at frame 0 and still 680 px wide at frame 839. `t` is
unset at config time, so `min(1,t/28)` folds to 1 and the bar is born complete.
There is no warning and no error. Confirmed on an isolated 4 s control render:
`w='max(3,300*min(1,t/4))'` returned 300 px on every frame including t=0.
Adding `:eval=frame` is not the fix either, it fails hard with
`Error applying option 'eval' to filter 'drawbox': Option not found` on
ffmpeg 8.1.2.

The fix used here: draw the fill as **56 discrete static boxes gated by
`enable='between(t,a,b)'`**, one per 0.5 s. `enable` is timeline-capable on
drawbox, unlike geometry expressions, and the result is expression-free and
therefore verifiable. Confirmed animating on the delivered file: 12 px wide at
frame 0, 97 at 3.5 s, 255 at 10 s, 498 at 20 s, 680 at 27.97 s.

This sits next to the brief's existing drawbox trap. Between them the rule is:
on drawbox, trust only literal geometry plus `enable`.

**2. A muxed deliverable can be produced with exit code 0 and be unreadable.**
The first `instagram-scored.mp4` written this session was 4.7 MB, ffmpeg returned
success, and `ffprobe` reported `Duration: N/A` with **no streams at all**, so
the faststart moov relocation had not landed. It was caught only because the
delivered file was probed rather than the command's exit status trusted. It was
remuxed and is correct now. The general point matches the brief's "measure the
delivered file": also *probe* the delivered file, and treat a zero exit code as
no evidence.

**Not a defect but worth recording:** the pre-blended-colour trick sidesteps the
brief's alpha trap entirely. Both the rail and the bar track are drawn with
`replace=1` and fully opaque colours that were computed by hand as violet at 40%
over the canvas (`#3D2B6B`) rather than passed as `@0.40` and left to blend. So
no drawn element depends on alpha blending, on any source, and there is nothing
that can silently render at alpha 0.

---

## Exact commands

Paths are relative to a build directory holding `fonts/` (the vendored Inter
files, copied unmodified from
`docs/growth/grok-launch/images/_build/fonts/`), `txt/` (one file per on-screen
line, used through `textfile=` so no filtergraph escaping is needed), `logo.png`
(copied from
`docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`),
`tension-minor.wav` (copied from `assets/audio/music/`), and the two generated
glow PNGs.

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

The filtergraph is 12,418 characters: 29 `drawtext` calls (28 copy lines plus the
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

  [progress fill, 56 static steps, no geometry expression anywhere:]
  drawbox=x=130:y=1438:w=12:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(t\,0.0000\,0.5000)',
  drawbox=x=130:y=1438:w=24:h=5:...:enable='between(t\,0.5000\,1.0000)',
  ... 54 more ... final step w=680 at 27.5000..28.0000,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover:]
  drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=txt/l00.txt:x=130:y=724
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,(4.4-t)/0.30))':enable='between(t\,0.0\,4.4)',
  ... l01 at y=828, l02 at y=932 ...

  [scenes 2 to 7, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/l03.txt:x=130
    :y='644+18*(1-min(1\,(t-4.4)/0.45))'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.4)/0.35\,(8.7-t)/0.30)))'
    :enable='between(t\,4.4\,8.7)',
  ...

  noise=alls=3:allf=t+u:all_seed=20260729,
  format=yuv420p[v]
```

Each scene's block is vertically centred on y=880, the centre of the 220..1500
visible band. The `noise` pass dithers the large soft gradient so H.264 does not
band it; its seed is pinned so the control render can be diffed against the
delivered one.

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
# trim 60.000s to 28.000s with a 1.5s fade out
ffmpeg -y -i tension-minor.wav \
  -af "atrim=0:28.0,asetpts=N/SR/TB,afade=t=out:st=26.5:d=1.5" \
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

### 6. Verification actually run

```bash
# no audio stream on the master (returns zero rows)
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 \
  instagram-silent.mp4

# video streams identical across both cuts
ffmpeg -v error -i instagram-silent.mp4 -map 0:v -c copy -f md5 -
ffmpeg -v error -i instagram-scored.mp4 -map 0:v -c copy -f md5 -

# cover == frame 0, over raw RGB
ffmpeg -v error -i instagram-silent.mp4 -frames:v 1 -f rawvideo -pix_fmt rgb24 - | md5sum
ffmpeg -v error -i instagram-cover.png -f rawvideo -pix_fmt rgb24 - | md5sum

# durations and stream tables, on the delivered files
ffprobe -v error -show_entries format=duration -show_entries \
  stream=codec_type,duration,duration_ts,time_base,nb_frames -of default=nw=1 \
  instagram-silent.mp4

# loudness of the delivered scored file, decoding the AAC
ffmpeg -i instagram-scored.mp4 -map 0:a \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -
```

The safe-zone measurement is a numpy pass over two synchronised
`ffmpeg -f rawvideo -pix_fmt rgb24` pipes, the delivered file and the control,
computing per frame both the luma-threshold bounding box and the diff bounding
box, over all 840 frames, reduced to a global extreme. Numbers are in the section
above.

---

## Scope

This task was scoped to the `instagram/` folder only, so nothing outside it was
written, including this run's `RUN.md`. That file already exists, written by a
sibling platform agent in the same run, and it records the same driver, **#2,
status threat**, and the same track, `tension-minor`. No conflict.

The two defects in the section above are cross-platform findings, not Instagram
ones. The `drawbox` init-only geometry trap will silently freeze any animated bar
or wipe on any of the four cuts, and the silent-bad-mux finding applies to every
`-movflags +faststart` remux. Both belong in `00-CAMPAIGN-BRIEF.md` under
"Measurement traps", which is outside this scope to edit.

## Nothing was posted or scheduled

These are files for review only. No git command was run.
