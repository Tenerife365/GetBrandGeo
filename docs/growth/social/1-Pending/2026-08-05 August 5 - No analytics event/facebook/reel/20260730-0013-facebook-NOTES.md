# Facebook Reel, run 20260730-0013

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the master. |

---

## Hook driver

**#3, curiosity gap.** "We asked five engines the same question, one pattern
held."

The mechanism is different from run 1 (loss aversion) and run 2 (status threat),
and the copy was written from scratch rather than edited. Neither of the earlier
drivers is present here: the video never says the viewer is losing anything and
never puts a rival in the answer slot. It does not threaten the viewer at all.
It states a study, withholds the result, and pays it off.

The loop opens on beat 1 ("we asked five AI engines the same six questions") and
is deliberately left open through beat 2. Beats 3 and 4 are the payoff, and they
are built as a contrast pair so the finding lands as a surprise rather than a
statistic: in one category all five engines converged on the same two names, in
another no two engines named the same person at all. Beat 5 closes the loop by
naming what actually varied. Beat 6 hands the open loop back to the viewer, which
is the only place the video asks for anything.

**Facebook-native treatment.** Plain business language, short declaratives, no
category vocabulary. No "GEO", no "AI visibility", no "generative engine", no
imperative stacking. Six beats over 28 seconds, which is a slower cadence than
the same driver would get on TikTok. Earlier Facebook cuts used no jargon and
that was right, so this one does the same.

**This is the first cut in the campaign carrying real evidence**, because
curiosity gap is the driver that can. The numbers come from BrandGEO's own
published Philadelphia city research, not from an illustrative shape.

---

## On-screen text, verbatim

Line breaks below are the actual rendered line breaks, one `drawtext` per line.
Nothing else appears on screen except the persistent bottom lockup and the accent
rule.

**Beat 1, 0.000 to 5.000 s.** Fully opaque from frame 0. No fade in, no rise, no
stagger, because this frame is the cover. Third line accent violet, Inter
ExtraBold.

```
We asked five AI
engines the same
six questions.
```

**Beat 2, 5.200 to 10.000 s**

```
One city.
Ordinary local
business categories.
```

**Beat 3, 10.200 to 15.000 s.** Third line accent.

```
In one category,
all five named the
same two names.
```

**Beat 4, 15.200 to 20.000 s.** Third line accent.

```
In another, no two
engines named the
same person.
```

**Beat 5, 20.200 to 25.200 s.** Four lines, its own vertical grid.

```
Same engines.
Same city.
The difference was
the category.
```

**Beat 6, 25.400 to 28.000 s.** Third line accent.

```
So which one is
your category?
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

---

## Every number on screen, and where it comes from

All numbers are spelled as words. That is a Facebook copy choice, not a hedge,
and they are still numbers so they still have to trace.

**Single source: `brandgeo/web/ai-visibility-for-philadelphia.html`**, a
published page on getbrandgeo.com. Data collected 2026-07-24 through BrandGEO's
own collection pipeline, the same one paying clients run.

| On screen | Claim | What the page states |
|---|---|---|
| "five AI engines" (beats 1, 3) | five engines were queried | "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity" |
| "six questions" (beat 1) | six prompts | "We ran 6 real Philadelphia categories ... personal injury law, real estate, property management, immigration law, hospital systems, and university admissions consulting", each listed as its own prompt |
| "One city" (beat 2) | one city | Philadelphia |
| "all five named the same two names" (beat 3) | 5 of 5 engines, two brands | "5/5 Engines naming both Penn Medicine and Jefferson Health, unanimous consensus on two brands at once, the strongest result measured in this program" |
| "no two engines named the same person" (beat 4) | zero cross-engine overlap | "0 Real estate agent names that repeated across any two engines, the most fragmented category" and "Zero cross-engine overlap, most fragmented category" |

Two deliberate restraints on that evidence:

- **The two brand names are not shown.** Penn Medicine and Jefferson Health are
  third parties who did not consent to appear in a BrandGEO ad. The finding
  survives without them, so they are described as "the same two names".
- **Beat 5 does not generalise the finding into a law.** The video says the
  difference within this study was the category. It does not say categories
  behave the same way in every city, because the same page argues the opposite:
  "Category behavior is genuinely city-specific: check your own market rather
  than assuming a pattern from elsewhere applies." Beat 6 is written to match
  that, which is why it asks the viewer about their own category rather than
  telling them what it will be.

### Other copy compliance

- No em dashes and no en dashes anywhere on screen. Checked programmatically
  across all nineteen line files, zero hits for U+2013 and U+2014.
- No banned vocabulary. The thirteen terms in the brief were checked against all
  nineteen line files by substring and none occurs. (They are not re-listed here,
  because doing so trips a naive scanner reading this file, as happened on run 1.)
- **No percentages and no rates on screen.** No Grok figure, no AI Overviews
  figure, so the one-day-sample problem cannot arise. No engine is named on
  screen at all; the five that were queried appear only in the caption below and
  are exactly `PLAN_ENGINES.growth` in
  `brandgeo-dashboard/src/lib/planConfig.ts:56`: `chatgpt`, `gemini`, `claude`,
  `perplexity`, `google_ai`. Meta AI is retired and is not named; the Philadelphia
  run itself used Google AI Mode in its place, which the page states.
- TOFU, soft CTA. The close is a question plus the domain. No pricing, no plan
  names, no trial mechanics, no urgency.

---

## Duration, exact ffprobe output on the DELIVERED files

Probed at the final delivery path, not in the build scratch directory.

`facebook-silent.mp4`
```
nb_streams      : 1
format duration : 28.000000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 840 frames, duration 28.000000
audio streams   : 0
```

`facebook-scored.mp4`
```
nb_streams      : 2
format duration : 28.000000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 840 frames, duration 28.000000
audio           : aac, 48000 Hz, 2 ch, 1314 frames, stream duration 28.000000
```

**The silent master has zero audio streams**, confirmed directly rather than
inferred from the stream count: `ffprobe -select_streams a -show_entries
stream=index` returns no rows.

Both containers report **28.000000 s**. Target band is 20 to 30 s.

The AAC quantisation the brief warns about is present and contained. A raw decode
of the scored cut's audio yields 1,344,512 samples, which is **28.0107 s** of
coded audio, because 1314 AAC frames of 1024 samples overshoot the cut.
`-shortest` plus the mp4 edit list trims playback back to 28.000. The container
number is the one that matters and it is exact.

Video bitstream identity between the two files, confirmed rather than assumed:

```
facebook-silent.mp4  video stream MD5 = d533f707ccb38faa1eb065a97080729d
facebook-scored.mp4  video stream MD5 = d533f707ccb38faa1eb065a97080729d
```

The scored cut was muxed with `-c:v copy`, so it is the same picture.

---

## Cover, verified against frame 0

Beat 1 hard-starts: `alpha` is a constant 1 until the fade-out at 4.650 s, there
is no per-line stagger, and there is no rise term in the `y` expression. The
accent rule for beat 1 likewise starts at its full 0.9 opacity rather than
stepping up through 0.3 and 0.6 the way later beats do.

Verified on the delivered files at the final path, decoding both to raw RGB24 and
hashing:

```
frame 0 of facebook-silent.mp4   md5 ec20adbd69d52b8a526358766b6be9ff  (6,220,800 bytes)
facebook-cover.png               md5 ec20adbd69d52b8a526358766b6be9ff  (6,220,800 bytes)
byte identical                   True
```

And it is not a blank rectangle: the cover carries **42,427 pixels above luma
85**, bounding box `x[100..710] y[586..1394]`, which is the accent rule, three
lines of type and the wordmark.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.** Usable band
is `y 220..1480` and `x <= 900`.

### The ink threshold, argued from a measured control

A text-free control was rendered through the identical background pipeline with
identical x264 settings, then decoded back **out of the encoded mp4** and
histogrammed over all 840 frames, 1.74 billion pixels:

```
control (background only, decoded from the encoded mp4)
  luma min 2   PEAK 30
  top of the distribution: 22:30.57M  23:24.24M  24:18.56M  26:14.25M
                           27:8.42M   28:3.25M   29:0.39M   30:0.004M
```

The background peaks at **30** and dies out there. The dimmest thing deliberately
drawn is the accent violet `#A78BFA`, luma about 153 at full alpha and about 140
where the rule sits at 0.9 over the plate. Body ink `#E8E9ED` is about 232.

That leaves an empty band from 30 to 140. **Threshold 85 sits in the middle of
it**, 55 levels clear of the background peak and 55 clear of the dimmest ink. A
second pass at **36**, six levels above the measured background peak, was run to
catch antialiased glyph fringes that 85 would drop.

### Method A, absolute threshold, all 840 frames of the delivered file

```
th > 85   union x[100..817]  y[526..1394]
th > 36   union x[100..818]  y[526..1395]

worst frames: right edge 817 @ frame 168, top edge 526 @ frame 612, bottom 1394 @ frame 0
```

### Method B, per-frame diff against the text-free control

All 840 frames decoded sequentially in one pass and compared frame-for-frame,
`|delta| > 12` gray levels:

```
union x[100..818]  y[526..1395]
```

### Method C, declared geometry of dark-on-dark furniture

The brief's blind-spot trap: pixel methods cannot see furniture that sits within
about 10 luma of the background, and a per-frame diff shares the blind spot when
the element is dark on a dark plate. The logo mark is exactly that element. Its
declared rect is folded in explicitly:

```
icon mark   overlay x=100 y=1344 at 68x68   ->  rect x[100..168] y[1344..1412]
accent rule beat 5   drawbox y=526 h=6      ->  top edge 526
```

The logo's measured luma inside that rect runs 2.3 to 124.0 and its maximum
per-pixel delta against the control is 240, so it is definitely drawn. But its
**bottom rows are dark enough that neither pixel method reached 1412**: A stopped
at 1394 and B at 1395. The declared rect is the honest number.

### Union of all three, against the three reserves

| Edge | Limit | Measured / declared ink | Headroom | Verdict |
|---|---|---|---|---|
| Top | `y >= 220` | 526 | **306 px** | PASS |
| Bottom | `y <= 1480` | 1412 | **68 px** | PASS |
| Right | `x <= 900` | 818 | **82 px** | PASS |

No edge is under 20 px and none is in single digits. The tightest is 68 px.

### Where the methods disagreed, and which one was believed

Two disagreements, both resolved toward more ink, per the brief's rule.

1. **Bottom, 17 px.** A said 1394, B said 1395, the declared logo rect says 1412.
   The rect wins and it is the reported number, so the stated bottom headroom is
   68 px rather than the 86 px the pixel methods alone would have claimed.
2. **Right, 1 px.** A at threshold 85 said 817, A at 36 and B both said 818. The
   larger number is reported. The one-pixel spread says the choice of threshold is
   not load bearing here.

### Line widths were measured before the layout was fixed, not after

Every one of the nineteen lines was rendered alone on black and its ink box taken,
so the type size was chosen from measurement rather than adjusted after a failure.

The first pass ran body 68 px / accent 75 px, matching run 2. At those sizes the
accent line **"named the same two."** measured a right edge of **886**, which is
14 px of clearance against the 900 limit. That is under the brief's 20 px floor
and would have been a paper pass, so it was treated as a failure before anything
was rendered. Two things changed:

- The line was rewritten. Beat 3 became "all five named the / same two names.",
  which moves the long word off the accent line.
- With the widest line gone, the whole block had 121 px of slack, so type was
  **raised** to body 72 px / accent 80 px rather than left small. Larger type is
  more legible in feed and the headroom is still 82 px.

Final measured right edges, worst first:

```
body   Inter-SemiBold @ 72   l5  "business categories."   right 818   <- binding
                             l10 "engines named the"      right 760
                             l14 "The difference was"     right 763
accent Inter-ExtraBold @ 80  l18 "getbrandgeo.com"        right 804
                             l8  "same two names."        right 787
wordmark Inter-Bold @ 40         "BrandGEO"               right 382
```

**Any copy edit that lengthens a line needs this measurement rerun.** The binding
line is "business categories." and it has 82 px.

### The drawbox traps, and proof neither fired

Two separate `drawbox` failures are documented in the brief and both are handled
by construction rather than by hoping.

**The alpha trap.** On a transparent RGBA source `drawbox` blends instead of
writing alpha, renders at alpha 0 and vanishes with no error. This build removes
the precondition: the plate is forced to `format=rgb24` before any drawing and the
logo overlay is pinned to `format=rgb`, so **no alpha plane exists anywhere in the
draw chain**. `replace=1` is therefore unnecessary and would be wrong here,
because the rule's fade is built from stacked boxes at 0.3 / 0.6 / 0.9 / 0.55 /
0.22 that must alpha-blend against the plate.

The positive check: beat 5's accent rule is the only thing drawn at `y=526`, and
the measured minimum ink `y` across all 840 frames is **exactly 526, on frame
612**, which is `t = 20.4 s`, inside beat 5. If the rule had vanished the measured
top would have been 574, beat 5's first line. It did not.

**The animation trap.** `drawbox` has no `eval` option on 8.1.2 and evaluates
`x/y/w/h` once at init, so any expression in those fields freezes at its t=0 value
silently. Nothing in this build animates a box: every rule is a static rect whose
only time dependence is `enable`, which is evaluated per frame and does work. The
fade is five stacked static boxes on staggered `enable` windows. No `drawbox`
geometry field contains `t`.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.

Original BrandGEO composition, cleared for commercial use including paid ads, no
attribution line required. Nothing was synthesized for this cut and nothing was
downloaded. Held constant across runs on purpose: the hook is the variable under
test, so the bed must not vary with it.

Source is 60.000 s, 48 kHz, 24-bit stereo PCM. Trimmed to the first 28.000 s with
a **0.08 s fade in at t=0** and a **1.5 s fade out starting at 26.500 s**, then
two-pass normalized.

### The fade in, and why run 2's reasoning was wrong

Run 2's Facebook build skipped the fade in on the grounds that the track "opens on
a downbeat". That was checked here directly against the source file and it is
false:

```
tension-minor.wav  sample[0]        = (-0.02516, -0.00577)
                   first 64 samples   abs max 0.06171
                   first 10 ms        abs max 0.11221
```

The first sample is already at 0.025 and the first 64 samples reach 0.062. A hard
cut out of digital silence into that is a step discontinuity and it clicks
regardless of where the musical beat falls. Whether the arrangement starts on a
downbeat is irrelevant to the question; what matters is the amplitude at sample
zero, and it is not zero.

`afade=t=in:st=0:d=0.08` applies a linear ramp over 3840 samples, so sample 63 is
attenuated to 63/3840 = 1.6% of its source value.

**Verified on the DELIVERED file**, by decoding the audio back out of
`facebook-scored.mp4` after AAC encoding:

```
first 64 samples abs max = 0.002845     (requirement: below 0.005)   PASS
first sample pair        = (0.000054, 0.000095)
first 10 ms  abs max     = 0.01342
overall peak             = 0.6143
last 64 samples abs max  = 0.000003     (the fade out lands clean too)
```

### Loudness, two-pass

Pass 1 measured the trimmed and faded excerpt. Pass 2 applied those values with
`linear=true`, which engages because the required gain is small and the resulting
true peak stays well under the ceiling. Linear mode matters here for a second
reason: it is a constant gain, so it cannot distort the 0.08 s fade-in ramp the
way dynamic mode would.

```
pass 1 (measure)   I -16.21   TP -4.41   LRA 3.60   thresh -26.27   offset -1.14
pass 2 (apply)     Output Integrated -15.9 LUFS, True Peak -4.2 dBTP, LRA 3.7 LU
```

Re-measured after AAC encoding, decoding the audio back out of the delivered
`facebook-scored.mp4`:

```
Integrated loudness  I:   -16.0 LUFS   (target -16)
True peak           TP:    -4.2 dBTP   (ceiling -1.5, so 2.7 dB under)
Loudness range     LRA:      3.6 LU
```

### Honest read on how it sounds

I cannot listen to it. What follows is measurement, and someone should audition it
once before it runs anywhere paid.

It is real music rather than a drone, on the two axes a rejected synthesized bed
failed on an earlier run:

- **Stereo.** L and R differ on **100.00%** of samples, channel correlation 0.864.
- **Movement.** Per-second RMS of the delivered audio, dBFS:

```
-20 -21 -22 -21 -20 -16 -16 -17 -15 -17 -16 -17 -15 -16 -17 -16 -17 -16 -16 -16 -15 -16 -15 -16 -14 -15 -17 -23
```

The intro, a lift at second 5, a steady body and the fade in the last two seconds
are all visible in that row. The lift at second 5 lands on the beat 1 to beat 2
cut without anything being moved to make it, which is luck rather than design and
is worth knowing if the beat timings are ever changed.

The honest qualification: this 28 s excerpt measures **LRA 3.60 against the parent
60 s track's 6.80**. A 28 second window captures part of one section and misses
the arrangement's wider swing, so this cut is calmer than the track it came from.
Fine for a bed under text. Do not quote 6.80 as if it described this file.

**Ship the silent master for the organic post.** Facebook favours audio picked
from its own in-app library.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow.
- Background is a generated **PNG** intermediate, never JPEG, so the pipeline
  stays limited-range `yuv420p` and does not pick up the `yuvj420p` shift.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED` upper left,
  `#6366F1` right, `#8B5CF6` lower) under a vignette, written by a dependency-free
  node PNG encoder (zlib from node core, hand-rolled CRC32, colour type 2). A 4x4
  ordered dither is baked in at +/- 0.8 levels because an 8-bit gradient at this
  size bands visibly without it. Dark only. Measured peak luma 30.
  `md5(bg.png) = dc1010e1d391a9b6ee3dff8ff6bf7774`.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a slow
  sinusoidal horizontal drift (18 px, 26 s period) and a slow vertical rise (26 px
  over the runtime), so the frame is never static while the type stays still. The
  10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  SemiBold 72 px body, ExtraBold 80 px accent, Bold 40 px wordmark. Nothing
  downloaded, nothing substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` scaled
  to 68 px.
- Motion per line: 0.40 s fade in, 22 px rise over 0.55 s, 0.12 s stagger between
  lines within a beat, 0.35 s fade out. Beat 1 has none of these.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.png`, `logo.png`,
`fonts/` (copied from the vendored Inter), `t/` (one file per rendered line) and
`fc.txt`. Relative paths throughout, deliberately, to avoid escaping the
drive-letter colon inside filtergraph options.

### 1. Background PNG

```sh
node bg.js bg.png      # dependency-free PNG writer, 1188x2112 rgb24
```

### 2. Silent master

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 28 -i bg.png \
  -loop 1 -framerate 30 -t 28 -i logo.png \
  -/filter_complex fc.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart \
  facebook-silent.mp4
```

### 3. Text-free control, for the threshold and for method B

Identical encode, background only.

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 28 -i bg.png \
  -/filter_complex fc_ctrl.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 control.mp4
```

### 4. Music, trim, fade in and out, two-pass loudnorm

```sh
ffmpeg -y -t 28 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=26.5:d=1.5" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_cut.wav

# pass 1, measure
ffmpeg -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values linearly
ffmpeg -y -i music_cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.21:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.27:\
offset=-1.14:linear=true:print_format=summary" \
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

48 draw operations. `drawbox` takes no alpha expression, so each accent rule fade
is built from three to five stacked static boxes on staggered `enable` windows.
Beat 1 has no fade in, no stagger and no rise, so frame 0 is a clean fully-opaque
still that doubles as the cover. Line files `t/l0.txt` through `t/l18.txt` hold
the beat lines in the order listed under "On-screen text" above, one line of text
per file, and `t/wordmark.txt` holds `BrandGEO`. Text is passed by file rather
than inline so commas inside a line need no filtergraph escaping.

`md5(fc.txt) = bdd0e40b79e1d7e1378f49d3958949d5`. Newlines below sit only at
filter boundaries and are cosmetic.

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/28.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1344:format=rgb[bgl];
[bgl]drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,0.000\,4.650)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,4.650\,4.825)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,4.825\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l0.txt:x=100:y=634:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l1.txt:x=100:y=742:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l2.txt:x=100:y=850:fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,5.200\,5.400)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,5.400\,5.600)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,5.600\,9.650)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,9.650\,9.825)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,9.825\,10.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l3.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-5.200))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.200)\,0\,if(lt(t\,5.600)\,(t-5.200)/0.4\,if(lt(t\,9.650)\,1\,if(lt(t\,10.000)\,(10.000-t)/0.35\,0))))':enable='between(t\,5.200\,10.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l4.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-5.320))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.320)\,0\,if(lt(t\,5.720)\,(t-5.320)/0.4\,if(lt(t\,9.650)\,1\,if(lt(t\,10.000)\,(10.000-t)/0.35\,0))))':enable='between(t\,5.320\,10.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l5.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-5.440))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.440)\,0\,if(lt(t\,5.840)\,(t-5.440)/0.4\,if(lt(t\,9.650)\,1\,if(lt(t\,10.000)\,(10.000-t)/0.35\,0))))':enable='between(t\,5.440\,10.000)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,10.200\,10.400)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,10.400\,10.600)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,10.600\,14.650)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,14.650\,14.825)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,14.825\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l6.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-10.200))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.200)\,0\,if(lt(t\,10.600)\,(t-10.200)/0.4\,if(lt(t\,14.650)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.35\,0))))':enable='between(t\,10.200\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l7.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-10.320))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.320)\,0\,if(lt(t\,10.720)\,(t-10.320)/0.4\,if(lt(t\,14.650)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.35\,0))))':enable='between(t\,10.320\,15.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l8.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-10.440))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,10.440)\,0\,if(lt(t\,10.840)\,(t-10.440)/0.4\,if(lt(t\,14.650)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.35\,0))))':enable='between(t\,10.440\,15.000)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,15.200\,15.400)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,15.400\,15.600)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,15.600\,19.650)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,19.650\,19.825)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,19.825\,20.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l9.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-15.200))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.200)\,0\,if(lt(t\,15.600)\,(t-15.200)/0.4\,if(lt(t\,19.650)\,1\,if(lt(t\,20.000)\,(20.000-t)/0.35\,0))))':enable='between(t\,15.200\,20.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l10.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-15.320))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.320)\,0\,if(lt(t\,15.720)\,(t-15.320)/0.4\,if(lt(t\,19.650)\,1\,if(lt(t\,20.000)\,(20.000-t)/0.35\,0))))':enable='between(t\,15.320\,20.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l11.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-15.440))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,15.440)\,0\,if(lt(t\,15.840)\,(t-15.440)/0.4\,if(lt(t\,19.650)\,1\,if(lt(t\,20.000)\,(20.000-t)/0.35\,0))))':enable='between(t\,15.440\,20.000)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,20.200\,20.400)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,20.400\,20.600)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,20.600\,24.850)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,24.850\,25.025)',
drawbox=x=100:y=526:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,25.025\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l12.txt:x=100:y='574+22*(1-min(1\,max(0\,(t-20.200))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.200)\,0\,if(lt(t\,20.600)\,(t-20.200)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.200\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x=100:y='682+22*(1-min(1\,max(0\,(t-20.320))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.320)\,0\,if(lt(t\,20.720)\,(t-20.320)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.320\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x=100:y='790+22*(1-min(1\,max(0\,(t-20.440))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.440)\,0\,if(lt(t\,20.840)\,(t-20.440)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.440\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l15.txt:x=100:y='898+22*(1-min(1\,max(0\,(t-20.560))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.560)\,0\,if(lt(t\,20.960)\,(t-20.560)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.560\,25.200)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,25.400\,25.600)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,25.600\,25.800)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,25.800\,27.650)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,27.650\,27.825)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,27.825\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l16.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-25.400))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,25.400)\,0\,if(lt(t\,25.800)\,(t-25.400)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.400\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l17.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-25.520))/0.55))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,25.520)\,0\,if(lt(t\,25.920)\,(t-25.520)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.520\,28.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l18.txt:x=100:y='850+22*(1-min(1\,max(0\,(t-25.640))/0.55))':fontsize=80:fontcolor=0xA78BFA:alpha='if(lt(t\,25.640)\,0\,if(lt(t\,26.040)\,(t-25.640)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.640\,28.000)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=184:y=1364:fontsize=40:fontcolor=0xE8E9ED:alpha='0.72',format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> We ran six ordinary Philadelphia business categories through five AI engines,
> the same way we do it for paying clients. Personal injury law, real estate,
> property management, immigration law, hospital systems, university admissions.
> One prompt each. ChatGPT, Gemini, Claude, Perplexity, Google AI Mode.
>
> In hospital systems, all five engines named the same two organisations. That is
> full agreement, and it is the strongest result we have measured anywhere.
>
> In real estate agents, not one name repeated across any two engines. Nothing to
> agree on at all.
>
> Same engines. Same city. Same week. What changed was the category.
>
> The full Philadelphia study is on our site, along with twenty six other cities.
> Worth knowing which kind of category yours is before you decide what to do
> about it.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition `facebook-scored.mp4`.** The music has been measured, not heard.
   The first-64-sample check confirms the click is gone (0.0028 against a 0.005
   limit) but that is a number, not an ear. The 28 s excerpt measures LRA 3.60
   against the parent track's 6.80, so it is calmer than the source.
2. **`RUN.md` for run 20260730-0013 has not been written.** The brief asks each
   run to record its hook driver in `run-<stamp>/RUN.md`, which sits one level
   above this folder and outside this task's write scope. Driver **#3, curiosity
   gap**, track `tension-minor`, for this run. Next run advances to #4,
   contrarian.
3. **This is the first cut using real published evidence, and it sets a
   precedent worth deciding on deliberately.** The Philadelphia numbers are
   strong and they are ours, but the page they come from is a single city on a
   single collection day. If evidence-carrying cuts become the norm, the campaign
   should decide whether a one-city one-day study is the right thing to put in
   front of cold traffic, or whether a cross-city page should be built first and
   cited instead.
4. **The two brands were withheld on purpose.** Naming Penn Medicine and
   Jefferson Health in an ad would make the video considerably more concrete and
   would put two non-consenting third parties in BrandGEO's paid media. That call
   was made here without consultation and should be confirmed or overturned by
   someone with the authority to make it.
5. **The binding safe-zone constraint is "business categories." at 82 px of right
   clearance.** Any copy edit that lengthens a line needs the measurement rerun.
   The threshold justification, both pixel methods and the declared-rect method
   are all documented above.
