# YouTube Shorts, run 20260729-2200

Hook driver: **#1, loss aversion, "you are already losing answers you cannot see."**

Copy is written for Shorts specifically. A Short is more often watched as a
lead-in to longer content than a TikTok is, and the audience tolerates a beat
of setup, so this cut spends three scenes establishing the invisibility of the
loss before it names the product. It is not the TikTok or Instagram wording.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all.** Pick a track from YouTube's own audio library at upload. |
| `youtube-bed.mp4` | Same picture, synthesized licence-clean bed. Fallback for a site embed or an ad account, not the feed upload. |
| `youtube-cover.png` | Frame 0, 1080x1920. |

---

## On-screen text, verbatim

Eight scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule.
Line breaks below are the actual rendered line breaks.

**1. 0.0 to 4.6 s** (ink `#E8E9ED`, Inter Bold 70)

```
An AI answered a
question about your
market today.
```

**2. 4.6 to 9.4 s** (first two lines ink, last two accent `#A78BFA`)

```
It named a handful
of companies.

You have no way
of knowing which.
```

**3. 9.4 to 14.0 s** (all ink)

```
No click.
No referrer.
No row in your
analytics.
```

**4. 14.0 to 19.0 s**

```
The loss leaves
no trace anywhere.

It just shows up
later.
```

**5. 19.0 to 24.4 s**

```
Search at least
told you your rank.

AI answers tell you
nothing by default.
```

**6. 24.4 to 30.4 s** (last two lines accent)

```
BrandGEO asks the
engines the questions
your buyers ask,
then records who
gets named.
```

**7. 30.4 to 35.6 s** (first line accent, list in ink)

```
Every run, across

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**8. 35.6 to 41.4 s** (logo, then ink, then accent)

```
[BrandGEO icon, 208 px]

See what the answers
say about you.

getbrandgeo.com
```

Compliance check against the brief: no em dashes, no en dashes, and none of the
banned words. The engine list is the five on Growth per `planConfig.ts`. Meta AI
is absent because it is retired. Grok, Copilot, DeepSeek and AI Overviews are
absent because they are on no purchasable plan or have no defensible data yet.
No percentage or measurement figure appears anywhere on screen, so nothing here
needs to trace to a `bg-*.html` page.

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Not eyeballed. `youtube-silent.mp4` was decoded to raw `gray` and **all 1242
frames** were scanned pixel by pixel. Ink is any pixel with luma > 60. That
threshold is defensible rather than arbitrary: the generated background peaks at
luma **30.37** (printed by the generator), and the two text colours are luma 232
(`#E8E9ED`) and 153 (`#A78BFA`), so 60 sits in an empty gap. Only antialias
fringe is ambiguous, and counting fringe as ink makes the box larger, which
biases the result against passing.

```
frames decoded: 1242  (frames with no ink: 21)

MEASURED INK CLEARANCE, worst frame of the whole video
  top      531 px  (reserve 180)  PASS +351   worst at frame 1072 (t=35.73s)
  bottom   802 px  (reserve 380)  PASS +422   worst at frame 1071 (t=35.70s)
  right    219 px  (reserve 180)  PASS +39    worst at frame 1072 (t=35.73s)
  left     159 px  (no reserve specified for Shorts)

SAFE ZONE: PASS
```

The 21 frames with no ink are the seven 0.3 s gaps between scene fades. That is
expected, not a defect.

Tightest edge is the right, at 219 px against a 180 px reserve, a 39 px margin.
Worst case on all three edges is the closing scene, which is the widest line
(`See what the answers`) plus the logo.

Cover frame measured separately:

```
cover ink bbox: x 170..850   y 669..975
  top=669  bottomClearance=944  rightClearance=229  left=170
```

Layout constants that produce this: text centred on x=510 (not 540) so the
block sits clear of the right-hand action rail, block centred on y=830.

---

## Duration and container

Both from `ffprobe -show_entries format=duration`:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **41.400000 s** | 1242 frames, 30/1, 1080x1920, yuv420p, h264 High@4.1 | **none, 0 audio streams** |
| `youtube-bed.mp4` | **41.400000 s** | identical stream, `-c:v copy` | aac 48 kHz stereo, stream duration 41.400000 s |

The bed did not drift past the video. The brief warns it usually does, because
AAC quantises to 1024-sample frames and 1942 frames at 48 kHz is 41.4187 s.
`-shortest` trimmed the container back to the video length, and both the format
and the audio stream report 41.400000 s. Inside the 30 to 45 s target and well
under the 60 s cap.

---

## Honest read on the bed

**It is a hum, not music. Ship the silent master.**

What it actually is: four pure `sine` partials per channel spelling an A minor
chord (110, 164.81, 220, 329.63 Hz), the right channel detuned a few cents
(110.31, 165.22, 220.62, 330.41) so the two sides beat slowly against each
other, each partial breathing on its own slow LFO at 7, 11, 13 and 17 second
periods so nothing lines up and repeats audibly, lowpassed at 900 Hz, plus a
band-limited `aevalsrc` noise wash between 300 and 1800 Hz sitting roughly 30 to
40 dB under the tonal content to stop it sounding completely sterile.

How that lands: a dull, low, organ-ish drone with a faint hiss over it. There is
no rhythm, no pitch movement, and no relationship to the eight scene cuts, so it
does not reinforce the edit at all. Over 41 seconds it reads as room tone or an
air-conditioning unit more than as a track. The slow detune beat is the only
thing that keeps it from sounding like a test tone, and that is a low bar. It is
inoffensive and it will not fight the on-screen text, which is the most that can
be said for it.

Where it is genuinely fine: a muted-by-default website embed, an ad account
where YouTube's library is not available, or anywhere the alternative is dead
silence. Where it is not fine: as the feed upload, where the in-app library is
both free and favoured by distribution.

Measured, two-pass `loudnorm`, and re-measured independently on the encoded
file rather than trusting the filter's own pass-2 summary:

```
ffmpeg -i youtube-bed.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json
  input_i   = -16.01 LUFS      (target -16)
  input_tp  =  -6.55 dBTP      (ceiling -1.5, 5 dB of headroom)
  input_lra =   8.10 LU

ffmpeg -i youtube-bed.mp4 -af ebur128=peak=true
  Integrated: -15.9 LUFS
  LRA:          7.4 LU
  True peak:   -6.5 dBFS
```

Crest factor 3.6 (about 11 dB) and flat factor 0.0, so nothing clips and nothing
is squashed. True peak lands well under the ceiling because the source is a
low-crest drone and the normalization ran `linear`; the ceiling is a limit, not
a target, so this is correct and not an undershoot to fix.

---

## Suggested Shorts title

```
Your buyers are asking AI. You are not in the answer.
```

Alternates, same driver:

- `The traffic you lost to AI leaves no trace`
- `AI answered a question about your market today`

## Suggested description

```
Someone asked an AI about your market today. It named a few companies. There
was no click, no referrer, and no row in your analytics, so if you were left
out you have no way of knowing.

Search at least told you your rank. AI answers tell you nothing by default.

BrandGEO runs the questions your buyers actually ask against ChatGPT, Gemini,
Claude, Perplexity and Google AI Mode, then records who gets named, where, and
how the answer describes them.

See what the answers say about you: https://getbrandgeo.com

#AISearch #GEO #BrandVisibility #ChatGPT #Perplexity #Marketing
```

No CC BY 4.0 attribution line. There is no LibriTTS voiceover in this run, and
no voice of any kind, so the attribution is not owed. Do not add it unless that
voice is actually present in the audio.

---

## Build

`ffmpeg 8.1.2-full_build-www.gyan.dev`. Remotion is not installed and was not
used. PNG intermediates throughout, no JPEG, so nothing gets forced to
`yuvj420p`.

Pipeline:

1. `mkbg.js` (node) writes a 1188x2112 binary PPM: base `#090A0F`, two soft
   radial glows (`#7C3AED` top right, `#6366F1` bottom left) plus a faint
   `#8B5CF6` centre lift, and an edge vignette. Oversized so the video can
   drift-crop 1080x1920 out of it without hitting an edge. It prints the
   background's peak luma, which is what justifies the ink threshold above.
   `ffmpeg -i bg.ppm bg.png`.
2. `mktext.js` (node) renders one transparent RGBA layer per scene with
   `drawtext`, using the vendored Inter at
   `docs/growth/grok-launch/images/_build/fonts/`. Fonts are copied next to the
   script so `fontfile=` needs no drive-letter escaping on Windows.
3. `build.js` composites, command below.
4. `bed.js` runs the two-pass loudnorm and muxes.

**Gotcha worth keeping.** `drawbox` on a transparent RGBA source blends instead
of writing alpha, so it renders alpha 0 and the violet rule silently does not
appear. It needs `replace=1`. This was caught by the measurement, not by
looking: the layer's ink bbox top was 60 px lower than the computed block top.

### Exact command, silent master

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 41.4 -i bg.png \
 -loop 1 -framerate 30 -t 41.4 -i text-1.png \
 -loop 1 -framerate 30 -t 41.4 -i text-2.png \
 -loop 1 -framerate 30 -t 41.4 -i text-3.png \
 -loop 1 -framerate 30 -t 41.4 -i text-4.png \
 -loop 1 -framerate 30 -t 41.4 -i text-5.png \
 -loop 1 -framerate 30 -t 41.4 -i text-6.png \
 -loop 1 -framerate 30 -t 41.4 -i text-7.png \
 -loop 1 -framerate 30 -t 41.4 -i text-8.png \
 -filter_complex "[0:v]crop=1080:1920:x='108*n/1241':y='192-192*n/1241',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=4.30:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=4.60:d=0.3:alpha=1,fade=t=out:st=9.10:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=9.40:d=0.3:alpha=1,fade=t=out:st=13.70:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=14.00:d=0.3:alpha=1,fade=t=out:st=18.70:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=19.00:d=0.3:alpha=1,fade=t=out:st=24.10:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=24.40:d=0.3:alpha=1,fade=t=out:st=30.10:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=30.40:d=0.3:alpha=1,fade=t=out:st=35.30:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=35.60:d=0.3:alpha=1[t8];\
[bg][t1]overlay=0:0:format=auto[v1];[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];[v7][t8]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1242 youtube-silent.mp4
```

Scene 1 has no fade-in on purpose, so frame 0 is the hook at full opacity and
the cover is genuinely the first frame rather than a black fade.

### Exact command, bed

Pass 1 is the same filtergraph into
`loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -`, which returned
`measured_I=-27.83 measured_TP=-18.38 measured_LRA=8.00 measured_thresh=-38.07
offset=-0.13`. Those are fed into pass 2:

```
ffmpeg -y -i youtube-silent.mp4 -filter_complex "\
sine=frequency=110:duration=41.4:sample_rate=48000[ls0];\
[ls0]volume='0.55+0.45*sin(2*PI*t/11+0)':eval=frame[lv0];\
sine=frequency=164.81:duration=41.4:sample_rate=48000[ls1];\
[ls1]volume='0.35+0.3*sin(2*PI*t/7+1.1)':eval=frame[lv1];\
sine=frequency=220:duration=41.4:sample_rate=48000[ls2];\
[ls2]volume='0.28+0.22*sin(2*PI*t/13+2.3)':eval=frame[lv2];\
sine=frequency=329.63:duration=41.4:sample_rate=48000[ls3];\
[ls3]volume='0.12+0.1*sin(2*PI*t/17+0.4)':eval=frame[lv3];\
[lv0][lv1][lv2][lv3]amix=inputs=4:normalize=0,lowpass=frequency=900,volume=0.45[lM];\
sine=frequency=110.31:duration=41.4:sample_rate=48000[rs0];\
[rs0]volume='0.55+0.45*sin(2*PI*t/11+0)':eval=frame[rv0];\
sine=frequency=165.22:duration=41.4:sample_rate=48000[rs1];\
[rs1]volume='0.35+0.3*sin(2*PI*t/7+1.1)':eval=frame[rv1];\
sine=frequency=220.62:duration=41.4:sample_rate=48000[rs2];\
[rs2]volume='0.28+0.22*sin(2*PI*t/13+2.3)':eval=frame[rv2];\
sine=frequency=330.41:duration=41.4:sample_rate=48000[rs3];\
[rs3]volume='0.12+0.1*sin(2*PI*t/17+0.4)':eval=frame[rv3];\
[rv0][rv1][rv2][rv3]amix=inputs=4:normalize=0,lowpass=frequency=900,volume=0.45[rM];\
aevalsrc='random(0)*2-1':duration=41.4:sample_rate=48000[nz];\
[nz]highpass=frequency=300,lowpass=frequency=1800,\
volume='0.045+0.02*sin(2*PI*t/19)':eval=frame,pan=stereo|c0=c0|c1=c0[NZ];\
[lM][rM]join=inputs=2:channel_layout=stereo[ST];\
[ST][NZ]amix=inputs=2:normalize=0[MX];\
[MX]afade=t=in:st=0:d=2.5,afade=t=out:st=38.90:d=2.5[A];\
[A]loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-27.83:measured_TP=-18.38:\
measured_LRA=8.00:measured_thresh=-38.07:offset=-0.13:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-bed.mp4
```

### Exact command, cover

```
ffmpeg -y -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" -vsync 0 youtube-cover.png
```

---

Nothing was posted, scheduled, or committed. No git command was run.
