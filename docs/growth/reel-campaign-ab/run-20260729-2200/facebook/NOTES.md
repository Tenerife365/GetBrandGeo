# Facebook Reel, run 20260729-2200

Built with ffmpeg 8.1.2 directly (no Remotion in this repo, nothing installed).
Nothing here has been posted or scheduled.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** No audio stream at all. Pair with a track from Facebook's in-app music library. |
| `facebook-bed.mp4` | Same video, byte-identical stream, plus a synthesized licence-clean bed. Fallback for ad accounts and site embeds where the in-app library is unavailable. Read the honest assessment below before defaulting to it. |
| `facebook-cover.png` | 1080x1920 cover. Pixel-exact match of frame 0 of the master (verified, max abs diff 0). |

---

## Hook driver

**#1, loss aversion:** "you are already losing answers you cannot see."

Facebook-native treatment: the audience skews slightly older and less
jargon-tolerant than TikTok, so the copy is plainer and slower. Short declarative
sentences, no marketing vocabulary, no "GEO", no "AI visibility", no imperative
stacking. The threat is stated in ordinary business terms (a customer asked, you
were not named, you never found out) rather than as a category term. Six beats
over 28 seconds is a slower cadence than the same driver would get on TikTok.
The words are written for this platform and are not shared with any other cut in
this run.

---

## On-screen text, verbatim

Line breaks below are the actual rendered line breaks. Nothing else appears on
screen except the persistent bottom lockup and the accent rule.

**Beat 1, 0.00 to 5.20 s** (fully opaque from frame 0, so the cover is legible)
```
Someone asked an AI
for a business like
yours this morning.
```

**Beat 2, 5.40 to 10.40 s** (third line in accent violet, Inter ExtraBold)
```
It gave one answer.
Three names.
Yours was not one.
```

**Beat 3, 10.60 to 15.40 s**
```
You never see it.
No click. No visit.
Nothing in analytics.
```

**Beat 4, 15.60 to 20.20 s** (third line accent)
```
The answers you
cannot see are the
ones that cost you.
```

**Beat 5, 20.40 to 25.00 s**
```
BrandGEO shows you
what ChatGPT, Gemini,
Claude, Perplexity
and Google AI say
about your business.
```

**Beat 6, 25.20 to 28.00 s** (third line accent)
```
See what they say
about you.
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark plus the wordmark `BrandGEO`
at 72% opacity, bottom left.

### Copy compliance

- No em dashes, no en dashes anywhere.
- None of the banned words (delve, unlock, unleash, elevate, harness, leverage,
  game-changer, supercharge, revolutionize, seamless, robust, cutting-edge,
  transformative).
- **No numbers on screen at all.** No percentages, no counts, no prices. That
  sidesteps the Grok and AI Overviews one-day-sample problem entirely rather
  than working around it.
- The five engines named are exactly `PLAN_ENGINES.growth` in
  `brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
  `perplexity`, `google_ai`. Meta AI is retired and is not named. Grok,
  AI Overviews, Copilot and DeepSeek are not named, since they are not on the
  entry plan a cold TOFU viewer would land on.
- TOFU, soft CTA. The close is "see what they say about you" plus the domain.
  No pricing, no plan names, no trial mechanics.

---

## Duration, exact ffprobe output

`facebook-silent.mp4`
```
format duration : 28.000000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 840 frames, 28.000000
audio streams   : 0
```

`facebook-bed.mp4`
```
format duration : 28.000000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 840 frames, 28.000000
audio           : aac, 48000 Hz, 2 ch, 1314 frames, stream duration 28.000000
```

Both containers report **28.000000 s**. The silent master is exact because there
is no audio stream to quantise. On the bed variant the AAC stream carries 1314
frames of 1024 samples, which is 28.032 s of coded audio, and the mp4 edit list
trims playback back to 28.000; a raw decode of the audio track reports 28.01 s,
which is that quantisation showing through. Playback length is 28.000 s for both.

Target is 20 to 30 s. 28 s sits inside it.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.**
Usable band is therefore y 220 to 1480 and x up to 900.

Method: decoded **all 840 frames** of the delivered `facebook-silent.mp4` to raw
gray8 and thresholded at luma > 100. The generated background peaks at luma 69
(measured on a text-free control render of the same background pipeline), and
the dimmest drawn element is the accent violet `#A78BFA` at roughly luma 153, so
that threshold separates every drawn element from the background with margin.
Bounding box is the union across every frame, so it includes the mid-fade and
mid-rise positions, not just the settled ones.

```
frames decoded            : 840  (840 carry ink)
UNION ink bbox            : x[100..875]  y[482..1428]
highest ink (min y)       : 482 px   top reserve is 220 px   PASS  (worst frame 618)
lowest ink (max y)        : 1428 px   must be <= 1480        PASS  (worst frame 0)
rightmost ink (max x)     : 875 px   must be <= 900          PASS  (worst frame 620)
leftmost ink (min x)      : 100 px

clearance above top reserve   : 262 px
clearance above bottom reserve: 52 px  (bottom reserve free = 492 px, need >= 440)
clearance from right reserve  : 25 px  (right reserve free = 205 px, need >= 180)
```

Cross-checked with a second, independent method: diffing each frame against a
text-free control render of the identical background pipeline (threshold 14 gray
levels, 168 frames sampled at 6 fps). That returned `x[100..875] y[482..1429]`,
agreeing to within one pixel on the bottom edge. The one-pixel difference is the
antialiased last row of the wordmark falling either side of the threshold.

The binding constraint is the **right edge at 25 px of clearance**, set by the
longest line, "what ChatGPT, Gemini," at 70 px Inter SemiBold. Any copy edit that
lengthens a line needs the measurement rerun. Type was deliberately scaled up
from a first pass that measured 787 px right edge; that wasted 113 px of legible
width for no safety gain.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18.
- Background is a generated 1080x1920 **PNG** intermediate, never JPEG, so the
  pipeline stays limited-range `yuv420p` and does not pick up the `yuvj420p`
  colour shift.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED`,
  `#6366F1`, `#8B5CF6`) and a vignette, written by a small dependency-free node
  PNG encoder. A light ordered dither is baked in because an 8-bit gradient this
  large bands visibly without it. Dark only, no white anywhere.
- Motion: the background is rendered at 1188x2112 and cropped to 1080x1920 with
  a slow sinusoidal horizontal drift and a slow vertical rise, so there is
  continuous movement without the text moving. The 10% overscan guarantees the
  crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` is used only as a fill for the
  accent rule and in the background, never as text, per the brief.
- Font: the vendored Inter at
  `docs/growth/grok-launch/images/_build/fonts/` (SemiBold for body, ExtraBold
  for the accent lines, Bold for the wordmark). Nothing downloaded, nothing
  substituted.
- Logo: `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`,
  scaled to 68 px.

---

## The audio bed, honest read

**Ship the silent master. The bed is a fallback and it sounds like one.**

What it is: an A minor drone stack of pure sines (55, 110, 164.81, 220, 329.63
Hz) with a plucked tone at C5 every 2 s and E5 every 3 s, both shaped by an
exponential decay envelope. Low-passed at 2.4 kHz, high-passed at 45 Hz, with a
0.18 Hz tremolo.

The honest problems with it:

1. **It is static.** Measured momentary loudness across the steady section
   (3 s to 25 s) spans only 4.0 LU, min -17.3, median -15.5, max -13.3 LUFS.
   Integrated LRA is 1.7 LU. The two-note figure repeats on a 6 second cycle and
   there is no development at all across 28 seconds. It does not build toward
   the CTA and it does not mark any of the six beat changes, so it carries none
   of the structure the video actually has.
2. **I made it flatter to hit the spec.** The raw mix had a 16.1 dB crest factor,
   which meant two-pass `loudnorm` could not normalize linearly without
   overshooting -1.5 dBTP and would have fallen back to dynamic mode, which
   pumps audibly on a sustained drone. I added an `acompressor` and an
   `alimiter` at 0.52 to bring the crest to 14.0 dB so linear mode would engage.
   That worked, but it squashed the plucked attacks, which were the only thing
   giving the bed any life.
3. **Pure sines have no character.** There is no noise floor, no detune, no
   stereo width beyond a duplicated mono signal. It reads as a test tone with a
   melody, not as music.

What it is fine for: sitting quietly under text in an ad account or a site embed
where silence would feel broken and the in-app library is not available. At
-16 LUFS it will not fight a viewer's other audio, and it is unambiguously
licence-clean because it was authored here from `sine` and `aevalsrc`.

**I cannot listen to it.** Everything above is from measurement and from what
the synthesis chain is, not from hearing it. Someone should audition it once
before it goes anywhere public.

Loudness, verified twice, once on the intermediate wav and once decoded back out
of the finished mp4 after AAC encoding:

```
Integrated loudness  I:   -15.8 LUFS   (target -16)
Loudness range     LRA:     1.7 LU
True peak         Peak:    -2.0 dBTP   (ceiling -1.5, so 0.5 dB under)
Normalization Type:      Linear
```

Two-pass, as required. Pass 1 measured `I -16.97 / TP -3.01 / LRA 3.50 /
thresh -27.17`; pass 2 applied those with `linear=true` and `offset=-0.23`.
The result lands 0.2 LU above the -16 target, which is inside normal loudnorm
tolerance, and comfortably under the true-peak ceiling.

---

## Exact commands

All commands run with the working directory set to the build scratch dir, which
contains `bg.png`, `logo.png`, `fonts/` (copied from the vendored Inter) and
`t/` (one small text file per rendered line). Relative paths are used throughout
deliberately, to avoid escaping the drive-letter colon inside filtergraph
options.

### 1. Background PNG

Written by a dependency-free node script (zlib + a hand-rolled CRC32, PNG colour
type 2). Canvas `#090A0F`, three radial glows as listed above, vignette, ordered
dither. `node bg.js bg.png` produces a 1080x1920 rgb24 PNG.

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

### 3. Bed audio

```sh
# synthesize
ffmpeg -y -/filter_complex bed.txt -map "[aout]" -c:a pcm_s24le -ar 48000 bed_raw.wav

# loudnorm pass 1, measure
ffmpeg -i bed_raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# loudnorm pass 2, apply the measured values linearly
ffmpeg -y -i bed_raw.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.97:measured_TP=-3.01:measured_LRA=3.50:measured_thresh=-27.17:\
offset=-0.23:linear=true:print_format=summary" \
  -c:a pcm_s24le -ar 48000 bed_norm.wav
```

`bed.txt`:
```
sine=f=55:d=28:sample_rate=48000[s0];
sine=f=110:d=28:sample_rate=48000[s1];
sine=f=164.81:d=28:sample_rate=48000[s2];
sine=f=220:d=28:sample_rate=48000[s3];
sine=f=329.63:d=28:sample_rate=48000[s4];
aevalsrc='sin(2*PI*523.25*t)*exp(-5.5*mod(t\,2))':d=28:s=48000[b1];
aevalsrc='sin(2*PI*659.25*t)*exp(-6.5*mod(t\,3))':d=28:s=48000[b2];
[s0]volume=0.30[v0];
[s1]volume=0.50[v1];
[s2]volume=0.26[v2];
[s3]volume=0.15[v3];
[s4]volume=0.07[v4];
[b1]volume=0.16[w1];
[b2]volume=0.09[w2];
[v0][v1][v2][v3][v4][w1][w2]amix=inputs=7:normalize=0[mix];
[mix]tremolo=f=0.18:d=0.30,
highpass=f=45,
lowpass=f=2400,
acompressor=threshold=0.10:ratio=4:attack=15:release=350:makeup=2,
alimiter=limit=0.52:attack=5:release=60,
aformat=channel_layouts=stereo,
afade=t=in:st=0:d=2.0,
afade=t=out:st=25.6:d=2.4,
aresample=48000[aout]
```

### 4. Bed variant

The video stream is copied, not re-encoded, so the two mp4s carry an identical
video bitstream.

```sh
ffmpeg -y -i facebook-silent.mp4 -i bed_norm.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  facebook-bed.mp4
```

### 5. Cover

```sh
ffmpeg -y -i facebook-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -c:v png \
  facebook-cover.png
```

### 6. The filtergraph, `fc.txt`

Verbatim. Newlines sit only at filter boundaries and are cosmetic: rendering
from the wrapped form below produces a file with the same md5
(`bc878800ad86de510024196ce02d8ca8`) as the delivered `facebook-silent.mp4`,
so this is exactly what was run.

`drawbox` takes no alpha expression, so each accent rule fade is built from
three to five stacked boxes on staggered `enable` windows. Beat 1 has no
fade-in, no stagger and no rise, so frame 0 is a clean fully-opaque still that
doubles as the cover.

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+18*sin(2*PI*t/26)':y='(in_h-out_h)/2-26*(t/28)',format=rgba[bg];
[bg][lg]overlay=x=100:y=1378:format=auto[bgl];
[bgl]drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,0.000\,4.850)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,4.850\,5.025)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,5.025\,5.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l0.txt:x=100:y='634+0*(1-min(1\,max(0\,(t-0))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.85)\,1\,if(lt(t\,5.2)\,(5.2-t)/0.35\,0))':enable='between(t\,0\,5.2)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l1.txt:x=100:y='738+0*(1-min(1\,max(0\,(t-0))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.85)\,1\,if(lt(t\,5.2)\,(5.2-t)/0.35\,0))':enable='between(t\,0\,5.2)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l2.txt:x=100:y='842+0*(1-min(1\,max(0\,(t-0))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.85)\,1\,if(lt(t\,5.2)\,(5.2-t)/0.35\,0))':enable='between(t\,0\,5.2)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,5.400\,5.600)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,5.600\,5.800)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,5.800\,10.050)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,10.050\,10.225)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,10.225\,10.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l3.txt:x=100:y='631+22*(1-min(1\,max(0\,(t-5.4))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.4)\,0\,if(lt(t\,5.4+0.4)\,(t-5.4)/0.4\,if(lt(t\,10.05)\,1\,if(lt(t\,10.4)\,(10.4-t)/0.35\,0))))':enable='between(t\,5.4\,10.4)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l4.txt:x=100:y='735+22*(1-min(1\,max(0\,(t-5.52))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.52)\,0\,if(lt(t\,5.52+0.4)\,(t-5.52)/0.4\,if(lt(t\,10.05)\,1\,if(lt(t\,10.4)\,(10.4-t)/0.35\,0))))':enable='between(t\,5.52\,10.4)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l5.txt:x=100:y='839+22*(1-min(1\,max(0\,(t-5.64))/0.55))':fontsize=77:fontcolor=0xA78BFA:alpha='if(lt(t\,5.64)\,0\,if(lt(t\,5.64+0.4)\,(t-5.64)/0.4\,if(lt(t\,10.05)\,1\,if(lt(t\,10.4)\,(10.4-t)/0.35\,0))))':enable='between(t\,5.64\,10.4)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,10.600\,10.800)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,10.800\,11.000)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,11.000\,15.050)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,15.050\,15.225)',
drawbox=x=100:y=586:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,15.225\,15.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l6.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-10.6))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.6)\,0\,if(lt(t\,10.6+0.4)\,(t-10.6)/0.4\,if(lt(t\,15.05)\,1\,if(lt(t\,15.4)\,(15.4-t)/0.35\,0))))':enable='between(t\,10.6\,15.4)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l7.txt:x=100:y='738+22*(1-min(1\,max(0\,(t-10.72))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.72)\,0\,if(lt(t\,10.72+0.4)\,(t-10.72)/0.4\,if(lt(t\,15.05)\,1\,if(lt(t\,15.4)\,(15.4-t)/0.35\,0))))':enable='between(t\,10.72\,15.4)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l8.txt:x=100:y='842+22*(1-min(1\,max(0\,(t-10.84))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,10.84)\,0\,if(lt(t\,10.84+0.4)\,(t-10.84)/0.4\,if(lt(t\,15.05)\,1\,if(lt(t\,15.4)\,(15.4-t)/0.35\,0))))':enable='between(t\,10.84\,15.4)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,15.600\,15.800)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,15.800\,16.000)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,16.000\,19.850)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,19.850\,20.025)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,20.025\,20.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l9.txt:x=100:y='631+22*(1-min(1\,max(0\,(t-15.6))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.6)\,0\,if(lt(t\,15.6+0.4)\,(t-15.6)/0.4\,if(lt(t\,19.85)\,1\,if(lt(t\,20.2)\,(20.2-t)/0.35\,0))))':enable='between(t\,15.6\,20.2)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l10.txt:x=100:y='735+22*(1-min(1\,max(0\,(t-15.72))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.72)\,0\,if(lt(t\,15.72+0.4)\,(t-15.72)/0.4\,if(lt(t\,19.85)\,1\,if(lt(t\,20.2)\,(20.2-t)/0.35\,0))))':enable='between(t\,15.72\,20.2)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l11.txt:x=100:y='839+22*(1-min(1\,max(0\,(t-15.84))/0.55))':fontsize=77:fontcolor=0xA78BFA:alpha='if(lt(t\,15.84)\,0\,if(lt(t\,15.84+0.4)\,(t-15.84)/0.4\,if(lt(t\,19.85)\,1\,if(lt(t\,20.2)\,(20.2-t)/0.35\,0))))':enable='between(t\,15.84\,20.2)',
drawbox=x=100:y=482:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,20.400\,20.600)',
drawbox=x=100:y=482:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,20.600\,20.800)',
drawbox=x=100:y=482:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,20.800\,24.650)',
drawbox=x=100:y=482:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,24.650\,24.825)',
drawbox=x=100:y=482:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,24.825\,25.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l12.txt:x=100:y='530+22*(1-min(1\,max(0\,(t-20.4))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.4)\,0\,if(lt(t\,20.4+0.4)\,(t-20.4)/0.4\,if(lt(t\,24.65)\,1\,if(lt(t\,25)\,(25-t)/0.35\,0))))':enable='between(t\,20.4\,25)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x=100:y='634+22*(1-min(1\,max(0\,(t-20.52))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.52)\,0\,if(lt(t\,20.52+0.4)\,(t-20.52)/0.4\,if(lt(t\,24.65)\,1\,if(lt(t\,25)\,(25-t)/0.35\,0))))':enable='between(t\,20.52\,25)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x=100:y='738+22*(1-min(1\,max(0\,(t-20.64))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.64)\,0\,if(lt(t\,20.64+0.4)\,(t-20.64)/0.4\,if(lt(t\,24.65)\,1\,if(lt(t\,25)\,(25-t)/0.35\,0))))':enable='between(t\,20.64\,25)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l15.txt:x=100:y='842+22*(1-min(1\,max(0\,(t-20.76))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.76)\,0\,if(lt(t\,20.76+0.4)\,(t-20.76)/0.4\,if(lt(t\,24.65)\,1\,if(lt(t\,25)\,(25-t)/0.35\,0))))':enable='between(t\,20.76\,25)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l16.txt:x=100:y='946+22*(1-min(1\,max(0\,(t-20.88))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,20.88)\,0\,if(lt(t\,20.88+0.4)\,(t-20.88)/0.4\,if(lt(t\,24.65)\,1\,if(lt(t\,25)\,(25-t)/0.35\,0))))':enable='between(t\,20.88\,25)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.3:t=fill:enable='between(t\,25.200\,25.400)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.6:t=fill:enable='between(t\,25.400\,25.600)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.9:t=fill:enable='between(t\,25.600\,27.650)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.55:t=fill:enable='between(t\,27.650\,27.825)',
drawbox=x=100:y=583:w=104:h=6:color=0xA78BFA@0.22:t=fill:enable='between(t\,27.825\,28.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l17.txt:x=100:y='631+22*(1-min(1\,max(0\,(t-25.2))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,25.2)\,0\,if(lt(t\,25.2+0.4)\,(t-25.2)/0.4\,if(lt(t\,27.65)\,1\,if(lt(t\,28)\,(28-t)/0.35\,0))))':enable='between(t\,25.2\,28)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l18.txt:x=100:y='735+22*(1-min(1\,max(0\,(t-25.32))/0.55))':fontsize=70:fontcolor=0xE8E9ED:alpha='if(lt(t\,25.32)\,0\,if(lt(t\,25.32+0.4)\,(t-25.32)/0.4\,if(lt(t\,27.65)\,1\,if(lt(t\,28)\,(28-t)/0.35\,0))))':enable='between(t\,25.32\,28)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l19.txt:x=100:y='839+22*(1-min(1\,max(0\,(t-25.44))/0.55))':fontsize=77:fontcolor=0xA78BFA:alpha='if(lt(t\,25.44)\,0\,if(lt(t\,25.44+0.4)\,(t-25.44)/0.4\,if(lt(t\,27.65)\,1\,if(lt(t\,28)\,(28-t)/0.35\,0))))':enable='between(t\,25.44\,28)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=184:y=1392:fontsize=40:fontcolor=0xE8E9ED:alpha='0.72',format=yuv420p[v]
```

Line files `t/l0.txt` through `t/l19.txt` hold the beat lines in the order
listed under "On-screen text" above, one line of text per file, and
`t/wordmark.txt` holds `BrandGEO`. Text is passed by file rather than inline so
the commas inside "what ChatGPT, Gemini," need no filtergraph escaping.

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> Most people now ask an AI before they ask Google. The AI gives one short
> answer with two or three names in it. If your business is not one of them,
> nothing tells you. There is no click to miss and nothing shows up in your
> analytics.
>
> BrandGEO checks what ChatGPT, Gemini, Claude, Perplexity and Google AI say
> when someone asks for a business like yours, so you can see where you stand.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition the bed.** It has been measured, not heard. See the honest read
   above.
2. **`RUN.md` for this run has not been written.** The brief asks each run to
   record its hook driver in `run-<stamp>/RUN.md`, which sits one level above
   this folder and outside this task's write scope. Driver #1, loss aversion,
   for this run.
3. **The right edge has 25 px of clearance.** Any copy change that lengthens a
   line needs the safe-zone measurement rerun before upload.
