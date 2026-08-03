# Facebook Reel, run 20260729-2318

Built with ffmpeg 8.1.2 directly. Remotion is not installed in this repo and
nothing was installed. Nothing here has been posted or scheduled. No git command
was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks, where the in-app library does not exist. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the master. |

---

## Hook driver

**#2, status threat.** "Your competitor is the default answer and you are not."

This is a different mechanism from run 1's loss aversion and the copy was written
from scratch, not edited. Loss aversion says *something is leaking away from you
and you cannot see it*. Status threat says *the position is occupied, and it is
occupied by someone you compete with*. So the video never mentions invisibility,
never mentions missed clicks, and never says anything about analytics. It puts a
rival in the answer slot in the first five seconds and leaves them there.

The turn is beat 3: "Not the biggest. Not the loudest. The one AI repeats." That
line is the whole driver. It says the slot is not awarded on merit or on spend,
which is what makes an occupied slot feel contestable rather than deserved. Beat
4 closes the status loop by pointing out the buyer stops reading at that answer.

**Facebook-native treatment.** Plain business language, short declaratives, no
category vocabulary. No "GEO", no "AI visibility", no "generative engine", no
imperative stacking. The words a viewer needs to know are "AI", "competitor",
"customer". Six beats across 28 seconds is a slower cadence than the same driver
would get on TikTok. Run 1's Facebook cut used no numbers and no jargon and that
was correct, so this cut does the same.

---

## On-screen text, verbatim

Line breaks below are the actual rendered line breaks, one drawtext per line.
Nothing else appears on screen except the persistent bottom lockup and the
accent rule.

**Beat 1, 0.000 to 5.000 s**, fully opaque from frame 0, no fade in, no rise,
no stagger, because this frame is the cover. Third line accent violet, Inter
ExtraBold.

```
Ask an AI who is
best at what you do.
It gives one name.
```

**Beat 2, 5.200 to 10.000 s**

```
Right now that name
belongs to someone
in your market.
```

**Beat 3, 10.200 to 15.000 s**, third line accent.

```
Not the biggest.
Not the loudest.
The one AI repeats.
```

**Beat 4, 15.200 to 20.000 s**

```
Buyers read that
answer and stop.
They never reach you.
```

**Beat 5, 20.200 to 25.200 s**, four lines, its own vertical grid.

```
BrandGEO shows you
who ChatGPT, Gemini,
Claude, Perplexity
and Google AI name.
```

**Beat 6, 25.400 to 28.000 s**, third line accent.

```
Find out whose name
comes up instead.
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

### Copy compliance

- No em dashes and no en dashes anywhere on screen.
- No banned vocabulary. The thirteen terms listed in the brief were each checked
  against all nineteen line files and none occurs. (Naming them here would trip a
  naive scanner, as it did on run 1's Facebook notes, so they are not repeated.)
- **No numbers on screen at all.** No percentages, no counts, no prices, no
  engine count. That sidesteps the Grok and AI Overviews one-day-sample problem
  by construction rather than by carve-out, and it means nothing on screen needs
  to trace to a `bg-*.html` page because nothing on screen is a measurement.
- The five engines named are exactly `PLAN_ENGINES.growth` in
  `brandgeo-dashboard/src/lib/planConfig.ts:56`: `chatgpt`, `gemini`, `claude`,
  `perplexity`, `google_ai`. Meta AI is retired and is not named. Grok, AI
  Overviews, Copilot and DeepSeek are not named: the first two are one day old,
  and all four sit above the entry plan a cold TOFU viewer would land on.
- TOFU, soft CTA. The close is "find out whose name comes up instead" plus the
  domain. No pricing, no plan names, no trial mechanics, no urgency.
- Beat 2 says "someone in your market", not "your competitor is winning". The
  video asserts that AI returns a short answer with a name in it, which is a
  description of how these products behave, and it does not assert a measured
  result about the viewer's own brand. That distinction is deliberate: a company
  selling measurement should not guess at the viewer's numbers in an ad.

---

## Duration, exact ffprobe output

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

Both containers report **28.000000 s** and on the scored cut the audio stream
duration matches the container exactly. Target band is 20 to 30 s, so 28 s sits
inside it with room either side.

The AAC quantisation the brief warns about is present and is contained. A raw
decode of the scored cut's audio track yields 1,344,512 samples, which is
**28.0107 s** of coded audio, because 1314 AAC frames of 1024 samples overshoot
the cut. `-shortest` plus the mp4 edit list trims playback back to 28.000. The
container number is the one that matters and it is exact.

Video bitstream identity between the two files, confirmed rather than assumed:

```
facebook-silent.mp4  video stream MD5 = 8332e276ab8085f85b6330544126cbb4
facebook-scored.mp4  video stream MD5 = 8332e276ab8085f85b6330544126cbb4
```

The scored cut was muxed with `-c:v copy`, so it is the same picture, not a
re-encode.

---

## Cover, verified against frame 0

The brief's trap is that a scene 1 fade-up renders frame 0 at alpha 0 and the
feed shows a blank thumbnail. Beat 1 therefore hard-starts: `alpha` is a constant
1 until the fade-out at 4.650 s, there is no per-line stagger, and there is no
rise term in the `y` expression. The accent rule for beat 1 likewise starts at
its full 0.9 opacity rather than stepping up.

Verified on the delivered files, decoding both to raw RGB24 and hashing:

```
frame 0 of facebook-silent.mp4   md5 54431603865c6a3d4b724b3df9a0a943  (6,220,800 bytes)
facebook-cover.png               md5 54431603865c6a3d4b724b3df9a0a943  (6,220,800 bytes)
byte identical                   True
max abs per-channel difference   0
```

And it is not a blank rectangle: the cover carries **41,563 pixels above luma
100**, bounding box `x[100..767] y[592..1394]`, which is the accent rule, three
lines of type and the bottom lockup.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.** Usable band
is therefore `y 220..1480` and `x <= 900`.

### The ink threshold, argued from a measurement

A text-free control was rendered through the identical background pipeline,
encoded with identical x264 settings, then decoded back out of the encoded mp4
and histogrammed over all 840 frames:

```
control (background only, decoded from the encoded mp4)
  luma min 9   PEAK 59   p99.999 59
  top of the distribution: 54:52.0M  55:50.1M  56:49.0M  57:47.3M  58:14.3M  59:0.15M
```

So the background peaks at **59** and dies out there, with only 153,858 pixels in
1.74 billion at that value. The dimmest thing deliberately drawn is the accent
violet `#A78BFA`, luma about 160 at full alpha and about 149 where the rule sits
at 0.9 over the plate. Body ink `#E8E9ED` is about 232.

That leaves an empty band from 59 to 149. **Threshold 100 sits in the middle of
it**, roughly 40 levels clear of the background and 49 clear of the dimmest ink.
A second pass at **65**, four levels above the measured background peak, was run
to catch antialiased glyph fringes that threshold 100 would drop. The two agree
to within one pixel on every edge, which says the choice of 100 is not load
bearing.

### Method A, absolute threshold, all 840 frames of the delivered file

```
th > 100   union x[100..831]  y[538..1394]
th >  65   union x[100..831]  y[538..1395]

worst frames: right edge 614, top edge 612, bottom edge 0
```

### Method B, per-frame diff against the text-free control

168 frames sampled at 6 fps, `|delta| > 12` gray levels, all 168 carried ink:

```
union x[100..831]  y[538..1411]
```

### Both methods, against the three reserves

The reported box is the **union of everything drawn**, type plus the accent rule
plus the icon mark plus the wordmark. Method B is the stricter one on the bottom
edge and its numbers are the ones to trust.

| Edge | Limit | Measured ink | Headroom | Verdict |
|---|---|---|---|---|
| Top | `y >= 220` | 538 | **318 px** | PASS |
| Bottom | `y <= 1480` | 1411 | **69 px** | PASS |
| Right | `x <= 900` | 831 | **69 px** | PASS |

No edge is under 20 px, and no edge is in single digits. The tightest two are
both at 69 px.

### What the two methods disagreed about, and why it mattered

Method A put the bottom edge at 1394 and method B at 1411. The 17 px gap is the
icon mark's own dark bottom rows: they differ from the plate by more than 12
levels, so the diff sees them, but their absolute luma is under 65, so the
threshold does not. Method B is right and method A was under-reporting the
furniture.

**That disagreement changed the build.** The first render put the lockup at
`y=1364` and measured 1414 / 1431 by the two methods, so the bottom headroom was
**49 px** while the right was 69 px. 49 px passes the brief's 20 px floor, but it
made furniture the binding constraint again, which is exactly run 1's Instagram
failure with the numbers moved around. The lockup was raised 20 px to `y=1344`
and the file re-rendered, which is why the delivered bottom headroom is 69 px and
matches the right edge. Cost: one 45 second re-render.

### The right edge, and the line the brief warned about

Run 1's Facebook binding constraint was 25 px on the right, set by "what ChatGPT,
Gemini," at 70 px. The equivalent line here is **"who ChatGPT, Gemini,"** and it
is still the widest thing on screen, right edge 831 at the worst frame (614,
which is `t = 20.47 s`, mid-rise in beat 5).

Every line was measured individually before the layout was fixed rather than
after, by rendering each one alone on black and taking its ink box. At 70 px the
widest body line reached 831 + 22 = **853**, leaving 47 px. Body type was set to
**68 px** and accent to **75 px**, which pulls the widest line to 831 and buys
69 px. The full table:

```
body Inter-SemiBold @ 68     widest  l13 "who ChatGPT, Gemini,"   right 831
                             next    l11 "They never reach you."  right 827 (at 70px: 849)
accent Inter-ExtraBold @ 75  widest  l8  "The one AI repeats."    right 814
wordmark Inter-Bold @ 40                 "BrandGEO"               right 382
```

Going to 68 px rather than 66 was deliberate. 66 would have given 90 px of
headroom and thrown away legible width for a margin nobody needs; run 1 made the
opposite mistake in the opposite direction and landed on 25 px. **Any copy edit
that lengthens a line needs this measurement rerun.**

### The drawbox trap, and how this build proves it did not fire

The brief's `drawbox` failure is that on a transparent RGBA source the box blends
to alpha 0 and disappears with no error. This build removes the precondition
instead of working around it: the plate is forced to `format=rgb24` before any
drawing, and the logo overlay is pinned to `format=rgb`, so **no alpha plane
exists anywhere in the draw chain**. `replace=1` is therefore unnecessary, and
would in fact be wrong here, because the rule's fade is built from stacked boxes
at 0.3 / 0.6 / 0.9 / 0.55 / 0.22 opacity that must alpha-blend against the plate.

The positive check is the same one that caught it on run 1: beat 5's accent rule
is drawn at `y=538`, and the measured minimum ink `y` across all 840 frames is
**exactly 538**, on frame 612, which is inside beat 5. If the rule had vanished
the measured top would have been 586, the first line of that beat. It did not.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.

Original BrandGEO composition, cleared for commercial use including paid ads, no
attribution line required (`assets/audio/ATTRIBUTION.md`). Nothing was
synthesized for this cut and nothing was downloaded.

Source is 60.000 s, 48 kHz, 24-bit stereo PCM, already sitting at exactly -16.00
LUFS integrated across its full length. Trimmed to the first 28.000 s with a
**1.5 s fade out starting at 26.500 s**, then re-normalized, because a 28 s
excerpt does not carry the parent file's integrated loudness.

No fade in. The track opens on a downbeat (peak 0.112 in its first 10 ms) rather
than from silence, and a hard audio start is correct here because frame 0 is
already a hard visual start.

Two useful things fell out of measuring the envelope before cutting. The first
five seconds sit around -18 to -19 dB RMS and the arrangement lifts to about
-13 dB from second 5 onward, so the lift lands on the beat 1 to beat 2 cut
without anything being moved to make it. And the 28 s point is mid-phrase, RMS
still -13.7 dB, which is why the fade is doing real work rather than decorating
an ending that was already there.

### Loudness, two-pass, verified twice

Pass 1 measured the trimmed and faded excerpt. Pass 2 applied those values with
`linear=true`, which engages because the required gain is only +0.21 dB and the
resulting true peak stays 2.7 dB under the ceiling.

```
pass 1 (measure)   I -16.21   TP -4.41   LRA 3.60   thresh -26.27   offset -1.14
pass 2 (apply)     Output Integrated -15.9 LUFS, True Peak -4.2 dBTP, LRA 3.7 LU
```

Re-measured after AAC encoding, by decoding the audio back **out of the delivered
`facebook-scored.mp4`**:

```
Integrated loudness  I:   -16.02 LUFS   (target -16)
True peak           TP:    -4.22 dBTP   (ceiling -1.5, so 2.7 dB under)
Loudness range     LRA:      3.60 LU
```

### Honest read on how it sounds

I cannot listen to it. What follows is measurement plus what the file is, and
someone should audition it once before it runs anywhere paid.

It is real music rather than a drone, and the numbers say so on the two axes run
1's rejected bed failed:

- **Stereo.** L and R differ on **100.00%** of samples, channel correlation
  0.864. The rejected bed was mono with L identical to R everywhere.
- **Movement.** The parent 60 s track measures LRA 6.80 LU. The rejected bed
  measured 1.50 LU, which is the number that says "static".

The honest qualification is that **this 28 s excerpt measures LRA 3.60, not
6.80.** A 28 second window captures roughly the first two thirds of one section
and misses the arrangement's wider dynamic swing, so this cut is calmer than the
track it came from. It is a bed under text, and for that it is appropriate, but
do not quote 6.80 as if it described what is in this file.

Per-second RMS of the delivered audio, dBFS:

```
-21 -21 -22 -21 -20 -16 -16 -17 -16 -17 -16 -17 -16 -16 -17 -16 -17 -16 -16 -16 -15 -16 -15 -16 -15 -15 -17 -24
```

The intro, the lift at second 5, a steady body, and the fade in the last two
seconds are all visible in that row.

**Ship the silent master for the organic post.** Facebook favours audio picked
from its own in-app library. The scored cut is for paid, site embeds and decks.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow.
- Background is a generated **PNG** intermediate, never JPEG, so the pipeline
  stays limited-range `yuv420p` and does not pick up the `yuvj420p` shift.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED` upper
  left, `#6366F1` right, `#8B5CF6` lower) under a vignette, written by a
  dependency-free node PNG encoder (zlib from node core, hand-rolled CRC32,
  colour type 2). A 4x4 ordered dither is baked in at +/- 0.8 levels because an
  8-bit gradient at this size bands visibly without it. Dark only, no white
  anywhere. Measured peak luma 59.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a
  slow sinusoidal horizontal drift (18 px, 26 s period) and a slow vertical rise
  (26 px over the runtime), so the frame is never static while the type stays
  still. The 10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  SemiBold 68 px body, ExtraBold 75 px accent lines, Bold 40 px wordmark. Nothing
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

### 3. Music, trim, fade, two-pass loudnorm

```sh
ffmpeg -y -t 28 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=out:st=26.5:d=1.5" \
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

### 4. Scored cut

Video is copied, not re-encoded.

```sh
ffmpeg -y -i facebook-silent.mp4 -i music_norm.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  facebook-scored.mp4
```

### 5. Cover

```sh
ffmpeg -y -i facebook-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -c:v png \
  facebook-cover.png
```

### 6. The filtergraph, `fc.txt`

48 draw operations. `drawbox` takes no alpha expression, so each accent rule fade
is built from three to five stacked boxes on staggered `enable` windows. Beat 1
has no fade in, no stagger and no rise, so frame 0 is a clean fully-opaque still
that doubles as the cover. Line files `t/l0.txt` through `t/l18.txt` hold the
beat lines in the order listed under "On-screen text" above, one line of text per
file, and `t/wordmark.txt` holds `BrandGEO`. Text is passed by file rather than
inline so the commas inside "who ChatGPT, Gemini," need no filtergraph escaping.

`md5(fc.txt) = c5a821f3831c0d5a690447a3231d34d5`. Newlines below sit only at
filter boundaries and are cosmetic.

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/28.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1344:format=rgb[bgl];
[bgl]drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,0.000\,4.650)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,4.650\,4.825)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,4.825\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l0.txt:x=100:y=640:fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l1.txt:x=100:y=742:fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l2.txt:x=100:y=844:fontsize=75:fontcolor=0xA78BFA:alpha='if(lt(t\,4.650)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.35\,0))':enable='between(t\,0.000\,5.000)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,5.200\,5.400)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,5.400\,5.600)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,5.600\,9.650)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,9.650\,9.825)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,9.825\,10.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l3.txt:x=100:y='640+22*(1-min(1\,max(0\,(t-5.200))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.200)\,0\,if(lt(t\,5.600)\,(t-5.200)/0.4\,if(lt(t\,9.650)\,1\,if(lt(t\,10.000)\,(10.000-t)/0.35\,0))))':enable='between(t\,5.200\,10.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l4.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-5.320))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.320)\,0\,if(lt(t\,5.720)\,(t-5.320)/0.4\,if(lt(t\,9.650)\,1\,if(lt(t\,10.000)\,(10.000-t)/0.35\,0))))':enable='between(t\,5.320\,10.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l5.txt:x=100:y='844+22*(1-min(1\,max(0\,(t-5.440))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.440)\,0\,if(lt(t\,5.840)\,(t-5.440)/0.4\,if(lt(t\,9.650)\,1\,if(lt(t\,10.000)\,(10.000-t)/0.35\,0))))':enable='between(t\,5.440\,10.000)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,10.200\,10.400)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,10.400\,10.600)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,10.600\,14.650)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,14.650\,14.825)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,14.825\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l6.txt:x=100:y='640+22*(1-min(1\,max(0\,(t-10.200))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.200)\,0\,if(lt(t\,10.600)\,(t-10.200)/0.4\,if(lt(t\,14.650)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.35\,0))))':enable='between(t\,10.200\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l7.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-10.320))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.320)\,0\,if(lt(t\,10.720)\,(t-10.320)/0.4\,if(lt(t\,14.650)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.35\,0))))':enable='between(t\,10.320\,15.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l8.txt:x=100:y='844+22*(1-min(1\,max(0\,(t-10.440))/0.55))':fontsize=75:fontcolor=0xA78BFA:alpha='if(lt(t\,10.440)\,0\,if(lt(t\,10.840)\,(t-10.440)/0.4\,if(lt(t\,14.650)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.35\,0))))':enable='between(t\,10.440\,15.000)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,15.200\,15.400)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,15.400\,15.600)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,15.600\,19.650)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,19.650\,19.825)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,19.825\,20.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l9.txt:x=100:y='640+22*(1-min(1\,max(0\,(t-15.200))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.200)\,0\,if(lt(t\,15.600)\,(t-15.200)/0.4\,if(lt(t\,19.650)\,1\,if(lt(t\,20.000)\,(20.000-t)/0.35\,0))))':enable='between(t\,15.200\,20.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l10.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-15.320))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.320)\,0\,if(lt(t\,15.720)\,(t-15.320)/0.4\,if(lt(t\,19.650)\,1\,if(lt(t\,20.000)\,(20.000-t)/0.35\,0))))':enable='between(t\,15.320\,20.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l11.txt:x=100:y='844+22*(1-min(1\,max(0\,(t-15.440))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.440)\,0\,if(lt(t\,15.840)\,(t-15.440)/0.4\,if(lt(t\,19.650)\,1\,if(lt(t\,20.000)\,(20.000-t)/0.35\,0))))':enable='between(t\,15.440\,20.000)',
drawbox=x=100:y=538:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,20.200\,20.400)',
drawbox=x=100:y=538:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,20.400\,20.600)',
drawbox=x=100:y=538:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,20.600\,24.850)',
drawbox=x=100:y=538:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,24.850\,25.025)',
drawbox=x=100:y=538:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,25.025\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l12.txt:x=100:y='586+22*(1-min(1\,max(0\,(t-20.200))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.200)\,0\,if(lt(t\,20.600)\,(t-20.200)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.200\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x=100:y='688+22*(1-min(1\,max(0\,(t-20.320))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.320)\,0\,if(lt(t\,20.720)\,(t-20.320)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.320\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x=100:y='790+22*(1-min(1\,max(0\,(t-20.440))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.440)\,0\,if(lt(t\,20.840)\,(t-20.440)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.440\,25.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l15.txt:x=100:y='892+22*(1-min(1\,max(0\,(t-20.560))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.560)\,0\,if(lt(t\,20.960)\,(t-20.560)/0.4\,if(lt(t\,24.850)\,1\,if(lt(t\,25.200)\,(25.200-t)/0.35\,0))))':enable='between(t\,20.560\,25.200)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,25.400\,25.600)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,25.600\,25.800)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,25.800\,27.650)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,27.650\,27.825)',
drawbox=x=100:y=592:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,27.825\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l16.txt:x=100:y='640+22*(1-min(1\,max(0\,(t-25.400))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,25.400)\,0\,if(lt(t\,25.800)\,(t-25.400)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.400\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l17.txt:x=100:y='742+22*(1-min(1\,max(0\,(t-25.520))/0.55))':fontsize=68:fontcolor=0xE8E9ED:alpha='if(lt(t\,25.520)\,0\,if(lt(t\,25.920)\,(t-25.520)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.520\,28.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l18.txt:x=100:y='844+22*(1-min(1\,max(0\,(t-25.640))/0.55))':fontsize=75:fontcolor=0xA78BFA:alpha='if(lt(t\,25.640)\,0\,if(lt(t\,26.040)\,(t-25.640)/0.4\,if(lt(t\,27.650)\,1\,if(lt(t\,28.000)\,(28.000-t)/0.35\,0))))':enable='between(t\,25.640\,28.000)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=184:y=1364:fontsize=40:fontcolor=0xE8E9ED:alpha='0.72',format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> When a customer asks an AI who is best at what you do, it does not hand back a
> page of links. It gives a short answer with one or two names in it. One of
> those names belongs to a business in your market right now.
>
> It is not always the biggest one, and it is not always the one spending the
> most. It is the one the AI keeps repeating.
>
> BrandGEO shows you who ChatGPT, Gemini, Claude, Perplexity and Google AI name
> when someone asks, so you can see whether you are in the answer or watching
> someone else be in it.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition `facebook-scored.mp4`.** The music has been measured, not heard.
   The stereo and dynamics numbers are good, but the 28 s excerpt measures LRA
   3.60 against the parent track's 6.80, so it is calmer than the source. See the
   honest read above.
2. **`RUN.md` for run 20260729-2318 has not been written.** The brief asks each
   run to record its hook driver in `run-<stamp>/RUN.md`, which sits one level
   above this folder and outside this task's write scope. Driver **#2, status
   threat**, track `tension-minor`, for this run. Next run advances to #3,
   curiosity gap.
3. **Track choice is worth a second look.** `tension-minor` was specified for
   this run and is used as instructed. Run 1's `RUN.md` recorded it as the match
   for hook driver #1, loss aversion, and it was already used on all four cuts of
   that run. It works under status threat, since the minor-key tension reads as
   pressure either way, but if the campaign wants the music to vary with the hook
   the way the copy does, this is the run where that decision surfaces.
4. **The right edge has 69 px of clearance and "who ChatGPT, Gemini," sets it.**
   Any copy edit that lengthens a line needs the safe-zone measurement rerun
   before upload. The measurement is two independent methods and both are
   documented above.
