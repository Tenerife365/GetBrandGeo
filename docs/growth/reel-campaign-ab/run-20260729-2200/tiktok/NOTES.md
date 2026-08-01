# TikTok cut, run-20260729-2200

**Hook driver:** #1, loss aversion, "you are already losing answers you cannot see".

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. No audio stream at all. Pick a track in the TikTok in-app library. |
| `tiktok-bed.mp4` | Same picture, synthesized licence-clean bed. Fallback for web embeds and ad accounts. |
| `tiktok-cover.png` | Literal first frame of the master, 1080x1920. |

**Silent is the one to upload.** This matters more on TikTok than on the other
three platforms: in-app audio is a distribution input there, not just a licence
convenience. A self-supplied track competes with that rather than helping.

---

## On-screen text, verbatim

Full text, in order. Every line is a separate `drawtext`. Line breaks below are
literal line breaks on screen.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 14 | 0.000 to 0.467 | `SOMEONE JUST` / `ASKED AN AI` |
| 2 | 14 | 0.467 to 0.933 | `SOMEONE JUST` / `ASKED AN AI` / `WHO TO BUY FROM` |
| 3 | 20 | 0.933 to 1.600 | same three lines, plus a bordered prompt field: `who should i buy this from` |
| 4 | 30 | 1.600 to 2.600 | `IT ANSWERED.` |
| 5 | 18 | 2.600 to 3.200 | `THE ANSWER` / `1  a competitor` |
| 6 | 18 | 3.200 to 3.800 | `THE ANSWER` / `1  a competitor` / `2  a competitor` |
| 7 | 36 | 3.800 to 5.000 | `THE ANSWER` / `1  a competitor` / `2  a competitor` / `3  a competitor` |
| 8 | 72 | 5.000 to 7.400 | the list above, plus `YOU ARE NOT` / `ON THAT LIST.` |
| 9 | 30 | 7.400 to 8.400 | `NO CLICK.` |
| 10 | 30 | 8.400 to 9.400 | `NO CLICK.` / `NO KEYWORD.` |
| 11 | 54 | 9.400 to 11.200 | `NO CLICK.` / `NO KEYWORD.` / `NO ANALYTICS.` |
| 12 | 78 | 11.200 to 13.800 | the three lines above, plus `YOU LOST A BUYER` / `AND NOTHING` / `TOLD YOU.` |
| 13 | 72 | 13.800 to 16.200 | `IT IS HAPPENING` / `TODAY.` / `YOU JUST CANNOT` / `SEE IT.` |
| 14 | 45 | 16.200 to 17.700 | `SO WE LOOK` / `FOR YOU.` |
| 15 | 84 | 17.700 to 20.500 | `WE ASK THE ENGINES` / `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 16 | 72 | 20.500 to 22.900 | `WE RUN THE` / `PROMPTS YOUR` / `BUYERS TYPE.` |
| 17 | 78 | 22.900 to 25.500 | `THEN WE SHOW` / `WHO GOT NAMED` / `INSTEAD OF YOU.` |
| 18 | 150 | 25.500 to 30.500 | `STOP LOSING` / `ANSWERS YOU` / `CANNOT SEE.` plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` at top left, and a
violet progress bar at the bottom of the safe zone that fills across the cut.

### Why the copy is shaped this way

TikTok gets the bluntest cut of the four. Short declaratives, hard cuts, no
setup sentence. The verbs are plain and the longest line is 16 characters, so
each card is legible in well under its hold time.

**The first 1.5 seconds carry three state changes, not one.** Line three lands
at 0.467s and the prompt field at 0.933s, so a scroll-past decision made at any
point in the first second still meets a moving frame. Confirmed by decoding
frames at 0.0 / 0.5 / 1.0 / 1.5s and hashing them: four distinct frames
(`075862fe8893`, `2797ab5f4ddc`, `1cd9268b42e6`, `d1c77d4a2980`).

### Factual position

- No percentage, rate, or measured result appears anywhere on screen. Nothing
  here needs to trace to a `bg-*.html` page because nothing is asserted as a
  measurement.
- `a competitor` x3 is deliberately generic. It reads as illustrative shape, not
  as a captured answer, and it names no real company.
- Engines named are the five on the Growth set in `planConfig.ts:56`: ChatGPT,
  Gemini, Claude, Perplexity, Google AI Mode. Grok and Google AI Overviews are
  live but Growth PRO and up, and per the brief they carry one day of data, so
  they are not named and no rate is shown for them. Meta AI is retired and does
  not appear.
- No pricing, no plan names, TOFU soft CTA only.
- No em dashes, no en dashes, none of the banned vocabulary.

---

## Safe-zone measurement

TikTok reserve: 200px top, 360px bottom, 200px right. Usable box is therefore
`y 200..1560`, `x ..880`.

Method: decode to raw 8-bit gray with ffmpeg, then scan for every pixel above a
luma threshold of 24 and take the bounding box. Canvas `#090A0F` measures luma
~10, so 24 catches antialiased glyph edges too. That is deliberately
conservative: it can only report the box **larger** than the true design box,
never smaller. Nothing here is eyeballed.

### Measured on frames decoded from the encoded `tiktok-silent.mp4`

18 samples, one inside each scene (t = 0.20, 0.70, 1.20, 2.10, 2.90, 3.50, 4.40,
6.20, 7.90, 8.90, 10.30, 12.50, 15.00, 16.90, 19.10, 21.70, 24.20, 28.00s).

```
union of all 18 frames:   x 96..847     y 240..1505
headroom:                 top 40px   bottom 55px   right 33px
verdict:                  ALL FRAMES INSIDE TIKTOK SAFE ZONE
```

Every sampled frame returns the identical box because the progress bar spans the
full text column on every frame and therefore sets `x0`, `x1` and `y1`.

### Text ink alone, per scene, chrome excluded

Same method with rows >= 1490 ignored, which drops the progress bar and leaves
only type and the prompt-field border. This is the number that says how close the
copy actually gets to the edge.

```
scene01  x  97..701   y 240..849      scene10  x  98..647   y 240..769
scene02  x  97..833   y 240..943      scene11  x  98..696   y 240..863
scene03  x  96..847   y 240..1171     scene12  x  97..829   y 240..1273
scene04  x  98..647   y 240..755      scene13  x  97..831   y 240..949
scene05  x  98..536   y 240..693      scene14  x  98..577   y 240..849
scene06  x  98..536   y 240..803      scene15  x  96..600   y 240..1078
scene07  x  98..536   y 240..913      scene16  x  97..708   y 240..903
scene08  x  97..640   y 240..1229     scene17  x  97..775   y 240..903
scene09  x  98..483   y 240..675      scene18  x  97..669   y 240..1202
```

Widest real text is scene 13 at `x1 = 831`, 49px clear of the limit. The 847 on
scenes 3 and 15 is the prompt-field border and the progress track, both drawn to
the column edge by construction.

The layout was rebuilt once after the first measurement. The original column ran
to exactly x=880 and passed with **1px** of right headroom, which is a pass on
paper and a hairline in practice. The column was narrowed to 752px wide with a
deliberate 32px buffer inside the reserve, and the headline dropped from 80px to
76px, which is why the real margin is 33px rather than 1px.

---

## Duration, exact ffprobe

Both files, `format=duration` and per-stream:

```
tiktok-silent.mp4   format 30.500000   video 30.500000  915 frames  (no audio stream)
tiktok-bed.mp4      format 30.500000   video 30.500000  915 frames
                                       audio 30.500000  duration_ts 1464000 @ 1/48000
```

30.500000s, inside the 25 to 40s TikTok target.

The bed did **not** drift. The brief warns AAC quantises to 1024-sample frames,
and it did: the stream holds 1431 AAC frames, which is 1,465,344 samples, 30.528s
of raw payload. The container still reports 30.500000 because `duration_ts` is
1,464,000 samples exactly, so the trailing 1,344 samples are excluded by the
stream duration rather than played. Checked, not assumed.

Video is a single stream in the silent master, confirmed by `nb_streams=1`. There
is no silent audio track.

---

## Honest read on the bed

**Ship the silent master. The bed is a fallback and it sounds like one.**

What it is, by construction: an A drone at 110Hz with a fifth at 165Hz and an
octave at 220Hz held flat for the entire 30.5s, a 55Hz sub thump once per second,
and a 1320Hz tick twice per second, which is 120 BPM. Band-limited 35Hz to 7kHz,
1.2s fade in, 1.5s fade out.

The honest verdict:

- **It is a metronome with a drone under it, not music.** There is no chord
  change, no melody, no fill, and no arrangement across the whole 30.5s. It sets
  a pulse and a floor of tension, which suits a loss-aversion script better than
  it would suit anything upbeat, but nobody will mistake it for a licensed track.
- **It is completely dry and completely mono.** All three sources are identical
  in both channels, so it images as a point in the centre with no width and no
  space. On phone speakers that reads as flat and slightly synthetic.
- **The tick and the cuts do not lock.** The tick runs at a fixed 2Hz while the
  cuts are driven by reading time, so they drift against each other. They agree
  by luck at some cuts and not at others. It does not sound broken, it sounds
  unsynced.
- Measured character matches that description: crest factor 4.65, RMS -16.98 dBFS,
  low zero-crossing rate. It is bass-dominant and dynamically almost static, LRA
  1.50 LU.
- I have not listened to it. The above is from construction plus `astats` and
  `loudnorm` measurement, not from playback.

**Loudness, two-pass, as specified:**

```
pass 1 measured:  I -13.79   TP -1.43   LRA 1.50   thresh -23.86   offset -0.10
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.00   TP -3.64   LRA 1.50
```

Integrated lands on -16.00 LUFS exactly. True peak is -3.64 dBTP, which is under
the -1.5 ceiling rather than at it: linear mode applies one flat gain, so with a
near-static signal the peak lands wherever the integrated target puts it. -1.5
dBTP is a ceiling not to exceed, so this is compliant, with 2.1dB spare.

Single-pass was not used. The brief is right that it undershoots.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the asset folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph option
value terminates the option even when the value is quoted, so an absolute
`fontfile=C:/...` fails to parse. Escaping is the alternative; relative naming is
cleaner.

**1. Scene stills**, one PNG per scene, 18 total. Per scene, filtergraph written
to a file and passed with `-/filter_complex`:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex graphNN.txt -map "[out]" -frames:v 1 -update 1 sceneNN.png
```

Scene 18 additionally takes `-i logo.png` and ends
`[bg][lg]overlay=96:1080[out]`. A representative graph body:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=96:y=240:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=96:y=1500:w=752:h=6:color=0x1B1D2B@1:t=fill,
drawbox=x=96:y=1500:w=NNN:h=6:color=0xA78BFA@1:t=fill,
drawtext=fontfile='Inter-ExtraBold.ttf':text='SOMEONE JUST':x=96:y=700:fontsize=76:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-ExtraBold.ttf':text='ASKED AN AI':x=96:y=794:fontsize=76:fontcolor=0xE8E9ED[out]
```

**2. Silent master.** `list.txt` is an ffconcat list of the 18 PNGs with
per-scene `duration` lines. `-frames:v 915` pins the total so per-scene rounding
cannot accumulate:

```
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i list.txt \
  -vf "fps=30,format=yuv420p" -frames:v 915 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an tiktok-silent.mp4
```

`-an` is what makes this a true silent master rather than a silent audio track.

**3. Cover**, the literal first frame:

```
ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -frames:v 1 -update 1 tiktok-cover.png
```

**4. Bed**, synthesized:

```
aevalsrc=exprs='0.18*sin(2*PI*110*t)+0.11*sin(2*PI*165*t)+0.06*sin(2*PI*220*t)':s=48000:d=30.5:c=stereo[pad];
aevalsrc=exprs='0.45*sin(2*PI*55*t)*exp(-4*mod(t\,1))':s=48000:d=30.5:c=stereo[sub];
aevalsrc=exprs='0.22*sin(2*PI*1320*t)*exp(-30*mod(t\,0.5))':s=48000:d=30.5:c=stereo[tick];
[pad][sub][tick]amix=inputs=3:normalize=0[mx];
[mx]highpass=f=35,lowpass=f=7000,afade=t=in:st=0:d=1.2,afade=t=out:st=29:d=1.5[out]
```

```
ffmpeg -hide_banner -loglevel error -y -/filter_complex bed.txt -map "[out]" -c:a pcm_s16le bed_raw.wav

ffmpeg -hide_banner -i bed_raw.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i bed_raw.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-13.79:measured_TP=-1.43:measured_LRA=1.50:measured_thresh=-23.86:offset=-0.10:linear=true" \
  -ar 48000 -c:a pcm_s16le bed_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i bed_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-bed.mp4
```

Video is stream-copied into the bed variant, so both files carry byte-identical
picture. Any picture check done on one holds for the other.

**5. Verification**, bounding box from real decoded frames:

```
ffmpeg -hide_banner -loglevel error -ss T -i tiktok-silent.mp4 -frames:v 1 -f rawvideo -pix_fmt gray -
```

then scan for pixels above luma 24 and take min/max x and y.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, gradient violet `#7C3AED`
for the prompt-field border, muted `#8B90A3` for the prompt text, progress track
`#1B1D2B`. `#8B5CF6` is not used for any text. Inter ExtraBold for headlines,
SemiBold for rows and eyebrows, Bold for the wordmark, Medium for the prompt
field and the URL. All vendored, nothing downloaded. Dark only.

## Open items

- The prompt-field text `who should i buy this from` is generic on purpose so the
  cut works for any vertical. A vertical-specific variant would hit harder and
  would need one render per vertical.
- The tick drifts against the cuts (see the bed read). Locking cut points to a
  120 BPM grid would fix it, at the cost of hold times no longer matching reading
  time. Not worth it while the silent master is the primary.
