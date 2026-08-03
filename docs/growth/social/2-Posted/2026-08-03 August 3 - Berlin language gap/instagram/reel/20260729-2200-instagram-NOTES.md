# Instagram Reel, run 20260729-2200

**Hook driver:** #1, loss aversion, "you are already losing answers you cannot see".

Copy is written for Instagram specifically. The register here is a quiet,
declarative gut-punch: short second-person statements, one idea per card, the
turn landing on "It was not you." No blunt TikTok phrasing, no LinkedIn framing,
no hashtags or emoji baked into the frame.

**Files**

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all.** Add music from Instagram's in-app library. |
| `instagram-bed.mp4` | Same video stream (byte-identical, verified by MD5), with a synthesized licence-clean bed. Fallback for web embeds and ad accounts. |
| `instagram-cover.png` | 1080x1920 cover. Genuine first frame of the silent master, verified byte-identical to it. |

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is
left-aligned at x=130.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,250) and the
wordmark `BrandGEO`.

**0.00 to 4.20s** (Inter ExtraBold 70)
```
Someone just asked
AI for the best
in your category.
```

**4.20 to 8.30s** (Bold 70, then Medium 56 in accent violet)
```
You never see it.

No click.
No referrer.
No analytics row.
```

**8.30 to 12.20s** (Bold 70, payoff line ExtraBold 76 in accent violet)
```
The answer named
someone.

It was not you.
```

**12.20 to 16.90s** (SemiBold 38 accent kicker, then Medium 56)
```
FIVE ENGINES ANSWER

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**16.90 to 20.90s** (Bold 70, last line accent violet)
```
Each one is
answering questions
about your market
right now.
```

**20.90 to 24.20s** (ExtraBold 68)
```
You cannot fix
what you cannot see.
```

**24.20 to 27.40s** (Bold 66, URL SemiBold 48 accent)
```
See what AI says
about your brand.

getbrandgeo.com
```

### Compliance notes on the copy

- **No numbers on screen.** No percentage, no score, no count of anything
  measured. The only figure is the word "five" describing the engine list, which
  is the Growth plan's engine count from `planConfig.ts`, not a result.
- The five engines named are the five Growth-plan engines. Meta AI is retired
  and is not shown. Copilot and DeepSeek are on no purchasable plan and are not
  shown. No Grok or AI Overviews rate appears anywhere.
- No pricing on screen. TOFU asset, soft CTA only.
- No em dashes, no en dashes. No banned AI-tell vocabulary.
- Nothing on screen is framed as a measurement or a client result.

---

## Duration

`ffprobe` on the delivered files, not assumed:

| File | Container duration | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **27.400000 s** | 822 frames @ 30fps, `duration_ts=420864 / 15360` | none |
| `instagram-bed.mp4` | **27.400000 s** | 822 frames @ 30fps, identical | `duration_ts=1315200 / 48000` = 27.400000 s |

Both land at exactly 27.400000 s, inside the 20 to 30 s target.

The brief warns that AAC quantising to 1024-sample frames drifts the container
past the cut length. It did not drift here, and the reason is worth recording:
the encoder emitted 1286 AAC frames (1,316,864 samples, 27.4347 s of packets),
but the mp4 sample table caps the track at `duration_ts=1315200`, exactly
27.400000 s, so players stop on time. The extra 1,664 samples exist in the file
as packet payload and are never played. Reported here as measured, not assumed.

Both files: 1080x1920, 30fps, H.264 High profile, `yuv420p`.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (so y <= 1500), right
180 px (so x <= 900).**

Measured, not eyeballed. Every one of the 822 frames was decoded to raw RGB24
and the ink bounding box computed per frame, then reduced to a global extreme.
Ink is any pixel with Rec.709 luma > 90.

That threshold is defensible rather than arbitrary: the background (base
`#090A0F` plus both violet glows plus the film-grain pass) peaks at **luma 39.7**
in the x >= 940 strip where no element is ever drawn. Text ink `#E8E9ED` is luma
232 and accent `#A78BFA` is luma 157. The threshold sits in a wide empty gap.

**Global ink bounding box across all 822 frames, shipped `instagram-silent.mp4`:**

```
top    y =  269    limit >= 220     margin  +49 px
bottom y = 1454    limit <= 1500    margin  +46 px
left   x =  130    (no left reserve specified)
right  x =  849    limit <=  900    margin  +51 px

RESULT: PASS
```

`instagram-bed.mp4` measures identically (same video stream). `instagram-cover.png`
measures identically (x 130..849, y 269..1454).

Which element sets each extreme:
- **Top 269** is the brand icon at y=250; its rounded-card corners are dark, so
  the first lit row is 19 px into it.
- **Bottom 1454** is the progress bar at y=1450, h=5.
- **Right 849** is the progress bar, which ends at x=850.

**Text-only extent**, measured separately over the copy band (y 340..1440, so
the logo and progress bar are excluded): the widest line reaches **x = 800** at
frame 511, leaving 100 px of right-safe margin. So the copy itself is nowhere
near the edge; the binding constraint is furniture, not type.

One earlier build had the progress bar at 770 px wide, which ended at x=899 and
passed with **+1 px** of margin. That is a pass on paper and a bad idea in
practice, so the bar was cut to 720 px. Recording it because the measurement is
what caught it.

Also caught by measurement: the first build's hook faded in from t=0, so frame 0
rendered at alpha 0 and the cover was a blank canvas. Scene 1 now starts hard at
full opacity, which is why the cover works and why the cut opens on a hard-in
rather than a fade.

---

## Audio bed, honest read

**It is thin. Ship the silent master.**

The bed is three sine tones (110 Hz, 164.81 Hz, 220 Hz, an A / E / A stack)
lowpassed at 820 Hz with a slow 0.17 Hz tremolo, a soft 329.63 Hz decaying blip
every 2 seconds with a short echo, and a 329.63 Hz swell that comes in at 20.9 s
under the "You cannot fix what you cannot see" card.

Spectral analysis of the normalized bed, whole-file FFT:

```
  100- 250 Hz : 44.51 % of energy
  250- 500 Hz : 55.32 % of energy
  500-1000 Hz :  0.10 %
 1000-2000 Hz :  0.02 %
 above 2000 Hz:  0.00 %
```

**99.8% of the energy is inside a single octave and a half, and there is
literally nothing above 1 kHz.** Six discrete partials, no noise component, no
percussion, no transient detail, no stereo width (the source is mono, dual-mono
in the file). That is what a sine bed is, and no amount of arrangement inside
`sine` and `aevalsrc` fixes it.

How it actually reads: a low hum with a soft ping every two seconds. It sounds
like an on-hold tone or a test signal, not like music. It sits under the video
without fighting it and it is unambiguously licence-clean, which is the entire
job it was given. It will not make anyone stop scrolling and it would sound
cheap as the default on a feed post.

So: correct as the fallback, wrong as the default. Instagram's in-app library is
both licensed for the platform and favoured by its distribution, so
`instagram-silent.mp4` is the file to upload.

**Loudness**, two-pass `loudnorm`, verified by re-measuring the output:

| | Target | Measured on `bed-norm.wav` |
|---|---|---|
| Integrated | -16 LUFS | **-15.97 LUFS** |
| True peak | -1.5 dBTP | **-1.50 dBTP** |
| LRA | n/a | 3.10 |

Pass 1 measured `input_i=-27.77`, `input_tp=-12.59`, `input_lra=4.90`,
`input_thresh=-38.02`, `target_offset=-0.98`. That offset is the brief's warning
confirmed on this material: a single pass would have landed about 1 LU low.

LRA 3.10 is flat, which is expected for a tremolo'd drone and is another way of
saying the bed has no dynamic shape.

---

## Exact commands

All paths below are relative to a working directory holding `fonts/` (the
vendored Inter files), `txt/` (one file per on-screen line, used via `textfile=`
so no filtergraph escaping is needed), `logo.png` (copied from
`docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`), and the two
generated glow PNGs.

### 1. Background glows (single frame each)

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='139':g='92':b='246':a='66*exp(-1.9*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 glow-violet.png

ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='99':g='102':b='241':a='46*exp(-2.2*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 glow-indigo.png
```

### 2. Silent master

```bash
ffmpeg -y \
  -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=27.4" \
  -loop 1 -i glow-violet.png \
  -loop 1 -i glow-indigo.png \
  -loop 1 -i logo.png \
  -filter_complex_script filtergraph.txt \
  -map "[v]" -an -t 27.4 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 \
  out-silent.mp4
```

The filtergraph is 6,032 characters (25 `drawtext` calls, one per line of copy,
plus the glow overlays, the logo, the left rail and the progress bar). Structure,
with one scene's text shown as the representative case:

```
[0:v]format=rgba[base];
[base][1:v]overlay=x='160+40*sin(t/7)':y='920+30*cos(t/9)':format=auto[b1];
[b1][2:v]overlay=x='-520+35*cos(t/8)':y='-320+28*sin(t/6)':format=auto[b2];
[3:v]scale=84:84[lg];
[b2][lg]overlay=x=130:y=250:format=auto[b3];
[b3]drawbox=x=96:y=660:w=4:h=440:color=0x8B5CF6@0.40:t=fill,
  drawbox=x=130:y=1450:w=720:h=5:color=0x23252F@1:t=fill,
  drawbox=x=130:y=1450:w='720*min(1\,t/27.4)':h=5:color=0x8B5CF6@1:t=fill,
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt:x=236:y=271
    :fontsize=34:fontcolor=0xE8E9ED:alpha=0.92,

  [scene 1, hard in at t=0 so frame 0 is a usable cover:]
  drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=txt/l00.txt:x=130:y='748'
    :fontsize=70:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,(4.2-t)/0.3))':enable='between(t\,0.0\,4.2)',
  ... l01 at y=836, l02 at y=924 ...

  [scenes 2 to 7, cross-faded with an 18px settle:]
  drawtext=...:textfile=txt/l03.txt:x=130
    :y='716+18*(1-min(1\,(t-4.2)/0.45))'
    :fontsize=70:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.2)/0.35\,(8.3-t)/0.3)))'
    :enable='between(t\,4.2\,8.3)',
  ...

  noise=alls=3:allf=t+u,
  format=yuv420p[v]
```

Each scene's block is vertically centred on y=880, the centre of the 220..1500
visible band. The light `noise` pass is deliberate: it dithers the large soft
gradient so H.264 does not band it.

### 3. Audio bed

`bed.txt`, used with `-filter_complex_script`:

```
sine=frequency=110:duration=27.4:sample_rate=48000,volume=0.34[d1];
sine=frequency=164.81:duration=27.4:sample_rate=48000,volume=0.17[d2];
sine=frequency=220:duration=27.4:sample_rate=48000,volume=0.11[d3];
[d1][d2][d3]amix=inputs=3:normalize=0[dmix];
[dmix]tremolo=f=0.17:d=0.32,lowpass=f=820[drone];
aevalsrc=exprs='0.55*sin(2*PI*329.63*t)*exp(-7.0*mod(t\,2.0))':s=48000:d=27.4:c=mono,
  volume='if(gte(t\,4.2)\,1\,0)':eval=frame,
  lowpass=f=2200,aecho=0.8:0.55:60|150:0.30|0.15[pulse];
sine=frequency=329.63:duration=27.4:sample_rate=48000,
  volume='0.085*min(1\,max(0\,(t-20.9)/1.4))':eval=frame,lowpass=f=1400[lift];
[drone][pulse][lift]amix=inputs=3:normalize=0[mixed];
[mixed]afade=t=in:st=0:d=1.6,afade=t=out:st=25.9:d=1.5,alimiter=limit=0.92,
  aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo[a]
```

```bash
ffmpeg -y -filter_complex_script bed.txt -map "[a]" -t 27.4 -c:a pcm_s16le bed-raw.wav

# pass 1, measure
ffmpeg -i bed-raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values
ffmpeg -y -i bed-raw.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11\
:measured_I=-27.77:measured_TP=-12.59:measured_LRA=4.90:measured_thresh=-38.02\
:offset=-0.98:linear=true" -ar 48000 -c:a pcm_s16le bed-norm.wav
```

### 4. Deliverables

```bash
# silent master, no audio stream at all
ffmpeg -y -i out-silent.mp4 -map 0:v:0 -an -c:v copy -movflags +faststart \
  instagram-silent.mp4

# bed variant, video stream copied so it stays byte-identical
ffmpeg -y -i out-silent.mp4 -i bed-norm.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest \
  -movflags +faststart instagram-bed.mp4

# cover, genuine first frame
ffmpeg -y -i instagram-silent.mp4 -frames:v 1 -f image2 -c:v png \
  instagram-cover.png
```

### 5. Verification actually run

```bash
# no audio stream on the master (returns nothing)
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 instagram-silent.mp4

# video streams identical across the two variants (both MD5=3560f9349cf1156e024388e91d2f0145)
ffmpeg -v error -i instagram-silent.mp4 -map 0:v -c copy -f md5 -
ffmpeg -v error -i instagram-bed.mp4    -map 0:v -c copy -f md5 -

# cover == frame 0 (both md5 c7357e35631fe58999f0430275d2cf71 over raw RGB)
ffmpeg -v error -i instagram-silent.mp4 -frames:v 1 -f rawvideo -pix_fmt rgb24 - | md5sum
```

Safe-zone measurement was a Python pass over `ffmpeg -f rawvideo -pix_fmt rgb24`
piped frame by frame, computing the luma>90 bounding box on all 822 frames and
reducing to the global extreme. Numbers in the section above.

---

## Nothing was posted or scheduled

These are files for review only.
