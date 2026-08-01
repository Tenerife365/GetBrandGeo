# YouTube Shorts, run 20260729-2318

Hook driver: **#2, status threat.** "Your competitor is the default answer and
you are not."

This is deliberately not run 1's driver. Run 1 (loss aversion) argued that the
loss is invisible: no click, no referrer, no row in analytics. Status threat
argues something different and more uncomfortable, that the position is not
empty. A rival already occupies it, the occupancy is stable across repeat asks
and across engines, and there is no second slot to come in at. Nothing in this
cut says "you are losing traffic you cannot see." The word "invisible" does not
appear.

Shorts tolerate a beat more setup than TikTok, so this cut spends four scenes
establishing that the default answer exists, is stable, and is held by someone
else, before it explains where that answer came from or names the product. Nine
scenes against run 1's eight.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all**, `nb_streams=1`. Pick a track from YouTube's own audio library at upload. |
| `youtube-scored.mp4` | Same picture, stream copied, plus the BrandGEO track. For paid, site embeds and decks. |
| `youtube-cover.png` | Frame 0, 1080x1920, byte identical to the delivered master's first frame. |

---

## On-screen text, verbatim

Nine scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule, centred
on the same axis as the type. Line breaks below are the actual rendered line
breaks. Ink is `#E8E9ED`, accent is `#A78BFA`.

**1. 0.00 to 4.20 s** (all ink, Inter Bold 58)

```
Someone is already
the default answer
in your category.
```

**2. 4.20 to 7.80 s** (line 1 ink, line 3 accent)

```
Not the top result.

The answer.
```

**3. 7.80 to 12.80 s** (all ink)

```
Ask again tomorrow.
Same name.

Ask another engine.
Same name.
```

**4. 12.80 to 17.40 s** (first two lines ink, last two accent)

```
That is not a ranking
you can climb past.

It is a position
someone else holds.
```

**5. 17.40 to 22.00 s** (all ink)

```
Your buyer sees one
answer and one name.

There is no page two
of an answer.
```

**6. 22.00 to 26.60 s** (all ink)

```
Engines build that
answer from what
they can read about
each company.
```

**7. 26.60 to 31.40 s** (first three lines ink, last accent)

```
BrandGEO asks the
questions your buyers
ask, then records
who gets named.
```

**8. 31.40 to 36.40 s** (first line accent Inter SemiBold 52, list ink Bold 58)

```
Every run, across

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**9. 36.40 to 41.80 s** (logo, ink, then accent)

```
[BrandGEO icon, 196 px]

Find out whose name
comes back.

getbrandgeo.com
```

### Compliance check against the brief

No em dashes and no en dashes anywhere, on screen or in this file. None of the
thirteen banned terms appears in the on-screen copy.

**No numbers appear on screen at all**, so nothing here needs to trace back to a
published `brandgeo/web/bg-*.html` page. That is the cheapest way to satisfy the
factual limit and it costs this particular hook nothing, because status threat
is an argument about position rather than about magnitude.

The engine list is exactly the five on the Growth tier per
`brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
`perplexity`, `google_ai`. Meta AI is absent because it is retired. Grok and AI
Overviews are absent, and no rate for either appears, because both went live
2026-07-29 with one day of rows. Copilot and DeepSeek are absent because they
sit on no purchasable plan.

Scene 6 is worth flagging as the one line a reviewer should push on. "Engines
build that answer from what they can read about each company" is a mechanism
claim, not a measurement, and it is stated without a figure attached to it
deliberately.

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Measured against the **delivered** `youtube-silent.mp4`, not the PNG
intermediates, over **all 1254 frames**, by two independent methods.

### Justifying the ink threshold

Not chosen by feel. The plate generator prints its own peak, and a text-free
control render was encoded through the identical pipeline so the ceiling could
be read off an encoded file rather than a source buffer:

```
source plate (mkbg.js, RGB)      peak luma 18.48   mean luma 12.48
control.mp4 (encoded, stored Y)  YMAX      33
```

33 is the correct number to argue from, because 18.48 is RGB luma and the
delivered file is limited-range yuv420p, where `Y = 16 + 219 * luma / 255`.
18.48 maps to 31.9, and the measured 33 is that plus encoder ringing.

Stored-Y values of everything drawn:

| Drawn element | Colour | Stored Y |
|---|---|---|
| Body and list text | `#E8E9ED` | 216 |
| Accent text | `#A78BFA` | 153 |
| Violet scene rule | `#8B5CF6` | 122 |
| Logo mark | violet, approx `#6A4AC1` | 99 |
| Logo card field | approx `#0B0A0D` | 25 |

Threshold for method A is **56**. It sits in the empty gap between the
background ceiling of 33 and the dimmest element method A can resolve, the logo
mark at 99. Antialias fringe near 56 is ambiguous, and counting fringe as ink
makes the box larger, which biases the result against passing.

The logo card at stored Y 25 sits **below** the background ceiling, so no
absolute threshold can see it. That is what method B is for.

### Method A, absolute threshold

```
mode=abs  threshold=56
frames decoded: 1254   frames with no ink: 24
peak sample value seen anywhere: 247
INK UNION  x 172..804   y 613..1172
  top     clearance  613 px  reserve 180  headroom +433  PASS   worst at frame 1096 (t=36.53s)
  bottom  clearance  747 px  reserve 380  headroom +367  PASS   worst at frame 1095 (t=36.50s)
  right   clearance  275 px  reserve 180  headroom  +95  PASS   worst at frame  524 (t=17.47s)
  left    172 px  (Shorts specifies no left reserve)
```

The 24 frames with no ink are the eight 0.3 s scene crossovers at three frames
each. Expected, not a defect.

### Method B, per-frame diff against a text-free control

`control.mp4` is the same background with the same drift crop, the same
duration and the same encoder settings, with no text layers composited at all.
Method B thresholds `blend=all_mode=difference` between the two, so it sees
anything that differs from the background regardless of brightness.

```
mode=diff  threshold=16
frames decoded: 1254   frames with no ink: 24
peak sample value seen anywhere: 215
INK UNION  x 172..804   y 613..1172
  top     clearance  613 px  reserve 180  headroom +433  PASS
  bottom  clearance  747 px  reserve 380  headroom +367  PASS
  right   clearance  275 px  reserve 180  headroom  +95  PASS
  left    172 px
```

**The two methods agree to zero pixels on all four edges.**

### Furniture, and what method B actually found

Everything drawn was measured, not just the type. A third pass measured the
alpha channel of all nine text layers directly, which catches fully opaque
elements at any brightness:

```
layer 1: x 214..766  y  758..1032   computedTop 758  drift 0
layer 2: x 239..739  y  769..1013   computedTop 769  drift 0
layer 3: x 199..776  y  691..1092   computedTop 691  drift 0
layer 4: x 200..776  y  691..1091   computedTop 691  drift 0
layer 5: x 172..804  y  691..1092   computedTop 691  drift 0
layer 6: x 209..769  y  719..1069   computedTop 719  drift 0
layer 7: x 174..804  y  719..1069   computedTop 719  drift 0
layer 8: x 268..712  y  619..1168   computedTop 619  drift 0
layer 9: x 193..788  y  613..1173   computedTop 613  drift 0
UNION x 172..804  y 613..1173
```

`drift 0` on every layer is the check for run 1's `drawbox` defect. The rule is
the topmost thing in every block, so if it had rendered at alpha 0 the measured
top would sit about 51 px below the computed top. It does not, on any of the
nine, which is positive evidence the `replace=1` worked rather than an assertion
that it should have.

**A finding worth carrying into the next run.** Method B was probed at the logo
to confirm it was doing its job, and it turned out **not** to see the logo card
either:

```
logo-card region diff: first col >16 at abs x = 449   last at abs x = 530
declared logo rect:                x 392..587   y 664..859
max diff at abs x 392, 400, 450, 500, 587 = 4, 4, 114, 115, 5
```

The card differs from the background by 4/255 in Y at its own edge. It is not
faintly visible, it is genuinely not visible, and neither an absolute threshold
nor a difference threshold can find it. Only the layer alpha pass can. So the
honest union is the union of all three passes plus the **declared** logo
rectangle:

```
FINAL UNION (methods A, B, layer alpha, and the declared 196 px logo rect)
  x 172..804   y 613..1173
  top    613 px   reserve 180   headroom +433
  bottom 746 px   reserve 380   headroom +366
  right  275 px   reserve 180   headroom  +95
```

The logo rect is fully contained by the type box on every edge, so it changes
nothing, but it was checked rather than assumed. The generalisable point is that
a dark-on-dark asset is invisible to both pixel methods, and the only reliable
handle on it is the geometry you asked for.

### Verdict

**SAFE ZONE: PASS.** Tightest edge is the right, at 275 px against a 180 px
reserve, a **95 px** margin. That is five times the 20 px floor the brief sets,
and it is the edge that failed run 1's TikTok build at 1 px.

The margin was bought deliberately: type is centred on x=490 rather than 540, so
the column sits clear of the right-hand action rail, and body type is 58 px
rather than run 1's 70 px, which keeps the widest line ("questions your buyers",
21 characters) inside a 696 px column. The binding frame on the right is 524
(t=17.47 s), scene 5, whose two longest lines are 20 characters each.

Cover frame measured separately, decoded from the delivered `youtube-cover.png`
at the same threshold 56:

```
cover ink bbox: x 214..765   y 758..1032
  top 758   bottom clearance 887   right clearance 314
```

That is one pixel narrower on the right than layer 1's alpha bbox (766), because
the alpha pass counts fringe down to alpha 8 while the luma pass counts it down
to Y 56. A one pixel disagreement in the conservative direction is the expected
behaviour of the two thresholds, not a discrepancy to resolve.

---

## Duration and container

Both from `ffprobe -show_entries format=duration,nb_streams`:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **41.800000 s** | 1254 frames, 30/1, 1080x1920, yuv420p, h264 High@4.1 | **none, `nb_streams=1`, 0 audio streams** |
| `youtube-scored.mp4` | **41.800000 s** | identical stream, `-c:v copy` | aac 48 kHz stereo, stream duration **41.800000 s** |

`nb_streams=1` on the master is the load-bearing check. A muted audio track is
not the same thing as no audio track, and a muted track can block a platform's
in-app music picker, which is the entire reason the silent master is primary.

The video stream is provably the same bitstream in both files:

```
ffmpeg -i youtube-silent.mp4 -map 0:v -c copy -f md5 -   MD5=cd05679b0c0dbf6faa1633b0f8f8bf7d
ffmpeg -i youtube-scored.mp4 -map 0:v -c copy -f md5 -   MD5=cd05679b0c0dbf6faa1633b0f8f8bf7d
```

so the safe-zone measurement above binds on the scored cut too, rather than
being assumed to.

41.800 s is inside the 30 to 45 s target and well under the 60 s cap.

`-shortest` did its job. The container and the audio stream both report exactly
41.800000. One honest footnote: decoding the AAC to PCM yields 2,007,040 samples
against 2,006,400 expected, 640 samples of decoder padding, 13 ms. That padding
is inside the container's edit list and is not part of the reported duration or
of playback.

---

## Cover integrity

Scene 1 has **no fade in**. Frame 0 is the hook at full opacity, because frame 0
is the thumbnail the feed shows. Verified with an md5 over raw RGB, taken from
the delivered file rather than the intermediate:

```
ffmpeg -i youtube-cover.png     -pix_fmt rgb24 -f rawvideo - | md5sum
  f6c34cde0ec8ebd295bcab0ccc10c64a

ffmpeg -i youtube-silent.mp4 -frames:v 1 -pix_fmt rgb24 -f rawvideo - | md5sum
  f6c34cde0ec8ebd295bcab0ccc10c64a
```

Identical. The cover is frame 0, not a re-render of it.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.
Composed by BrandGEO on 2026-07-29 by `scripts/compose_music.py`, recorded in
`assets/audio/ATTRIBUTION.md`. Owned outright, cleared for commercial use
including paid advertising, and it **requires no attribution line anywhere**.
Nothing was downloaded and no music service was involved.

`tension-minor` is the right pick for this driver on its own terms rather than
by default. Status threat needs unresolved tension held under the copy, not
resolution, and a minor bed that keeps cycling without landing matches an
argument whose whole point is that the situation is stable and not in your
favour. `build-resolve` would have undercut it by resolving.

**There is no CC BY 4.0 line on this asset and there must not be one.** That
obligation belongs to the LibriTTS voice model, and there is no voice of any
kind in this run. Adding the credit for audio that is not present would be a
false statement about the asset, not a harmless precaution.

Source is 60.000 s. Trimmed to 41.800 s to match the video, with a 0.35 s fade
in (the track's first sample is at -24.6 dBFS, so a hard cut in clicks) and the
specified **1.5 s fade out** starting at 40.30 s. Tail measured at -41.9 dBFS
over the last 0.1 s, so it ends in silence rather than being cut off.

Two-pass `loudnorm`, then re-measured independently on the **encoded** file
rather than trusting the filter's own pass-2 summary:

```
pass 1 (measured on the trimmed and faded 41.8 s cut)
  input_i      = -16.46 LUFS
  input_tp     =  -4.41 dBTP
  input_lra    =   9.00 LU
  input_thresh = -26.68
  offset       =  -0.65

ffmpeg -i youtube-scored.mp4 -af ebur128=peak=true
  Integrated:  -15.8 LUFS   (target -16)
  LRA:           7.2 LU
  True peak:    -4.0 dBFS   (ceiling -1.5 dBTP)
```

True peak lands 2.5 dB under the ceiling. The ceiling is a limit and not a
target, and the source track already sat near -16 LUFS, so pass 2 applied about
0.5 dB of gain in `linear` mode. There was nothing to fix.

### Honest read on the scored cut

This is real music, not run 1's rejected drone, and the difference is
measurable rather than a matter of taste:

| | run 1's rejected bed | `tension-minor` here |
|---|---|---|
| LRA | 1.50 LU | **7.2 LU** |
| Stereo | mono, L equals R everywhere | **L differs from R on 99.91% of samples**, correlation 0.869 |
| Harmony | one root held for the whole cut | changes every bar |

LRA 7.2 is the number that says it moves. 99.91% L/R divergence at correlation
0.869 is the number that says it images as a field with width rather than as a
point in the centre of the head.

What it is not: it was not cut to this edit. The track was composed to 60 s for
the campaign generally, and the nine scene changes here fall where reading time
puts them, so bar lines and cuts do not line up. It reads as a bed under the
video rather than as a score of it. That is the correct tradeoff for a shared
library, and it is worth knowing before anyone claims the music hits the cuts.

**Still upload the silent master for the organic post.** YouTube's in-app
library is free, cleared, and favoured by distribution. The scored cut is for
paid, site embeds and decks, where that library does not exist.

---

## Suggested Shorts title

```
Your category already has a default answer in AI. It is not you.
```

Written to be read rather than stuffed. It states the whole argument in two
clauses and the second one is the turn. No keyword list, no colon-and-brackets
construction, no "here is why".

Alternates on the same driver:

- `Ask any AI who is best in your category. Same name every time.`
- `There is no page two of an AI answer`

## Suggested description

```
There is already a default answer in your category, and a competitor is holding
it. Ask again tomorrow and the same name comes back. Ask a different engine and
the same name comes back.

That is not a ranking you can climb past one position at a time. Your buyer sees
one answer with one name in it, and there is no page two of an answer to be
found on.

The engines built that answer out of what they could read about each company.
BrandGEO asks the questions your buyers actually ask, across ChatGPT, Gemini,
Claude, Perplexity and Google AI Mode, and records who gets named, where in the
answer, and how it describes them.

Find out whose name comes back: https://getbrandgeo.com
```

No hashtag block. The description is written to be read by a person who paused
on the video, and a trailing hashtag run does not serve that reader. If the
channel's convention requires tags, add them below the link rather than inside
the copy.

No CC BY 4.0 line, for the reason given under Music above.

---

## Build

`ffmpeg 8.1.2-full_build-www.gyan.dev`, `node v24.16.0`. Remotion is not
installed and was not used. Nothing was installed. PNG intermediates throughout,
no JPEG, so nothing gets forced to `yuvj420p`.

Pipeline, all four scripts in the session scratchpad:

1. `mkbg.js` writes a 1188x2112 binary PPM: base `#090A0F`, a violet `#7C3AED`
   mass top right, an indigo `#6366F1` mass bottom left, a faint `#8B5CF6`
   centre lift, and an edge vignette. Oversized so the render can drift-crop
   1080x1920 out of it without ever reaching an edge. It prints its own peak
   luma, which is what justifies the ink threshold. Then
   `ffmpeg -i bg.ppm bg.png`.
2. `mktext.js` renders one transparent RGBA layer per scene. Text goes through
   `textfile=` rather than `text=`, so no filtergraph escaping is involved, and
   every invocation is spawned as an argv array so the shell never sees the
   filter string. Fonts are the vendored Inter from
   `docs/growth/grok-launch/images/_build/fonts/`, copied next to the script so
   `fontfile=` needs no drive-letter escaping on Windows.
3. `build.js` composites the silent master and the text-free control.
4. `measure_layers.js` and `measure_delivered.js` do the three measurement
   passes.

**The `drawbox` trap, guarded explicitly.** On a transparent RGBA source
`drawbox` blends rather than writing alpha, so it renders at alpha 0 and the
violet rule silently does not appear, with no error and nothing to see at
preview scale. It needs `replace=1`. The rule here is drawn as:

```
drawbox=x=448:y=<blockTop>:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1
```

and the `drift 0` column in the layer table above is the evidence it worked.

### Exact command, silent master

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 41.8 -i bg.png \
 -loop 1 -framerate 30 -t 41.8 -i text-1.png \
 -loop 1 -framerate 30 -t 41.8 -i text-2.png \
 -loop 1 -framerate 30 -t 41.8 -i text-3.png \
 -loop 1 -framerate 30 -t 41.8 -i text-4.png \
 -loop 1 -framerate 30 -t 41.8 -i text-5.png \
 -loop 1 -framerate 30 -t 41.8 -i text-6.png \
 -loop 1 -framerate 30 -t 41.8 -i text-7.png \
 -loop 1 -framerate 30 -t 41.8 -i text-8.png \
 -loop 1 -framerate 30 -t 41.8 -i text-9.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1253':y='192*n/1253',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=3.90:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=4.20:d=0.3:alpha=1,fade=t=out:st=7.50:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=7.80:d=0.3:alpha=1,fade=t=out:st=12.50:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=12.80:d=0.3:alpha=1,fade=t=out:st=17.10:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=17.40:d=0.3:alpha=1,fade=t=out:st=21.70:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=22.00:d=0.3:alpha=1,fade=t=out:st=26.30:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=26.60:d=0.3:alpha=1,fade=t=out:st=31.10:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=31.40:d=0.3:alpha=1,fade=t=out:st=36.10:d=0.3:alpha=1[t8];\
[9:v]format=rgba,fade=t=in:st=36.40:d=0.3:alpha=1[t9];\
[bg][t1]overlay=0:0:format=auto[v1];[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];[v7][t8]overlay=0:0:format=auto[v8];\
[v8][t9]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1254 youtube-silent.mp4
```

Note `[1:v]` carries no fade in. That is the cover guarantee, not an oversight.

### Exact command, text-free control

Same background chain, same encoder settings, no text inputs. This file is a
measurement instrument and is not delivered.

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 41.8 -i bg.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1253':y='192*n/1253',format=rgba,setsar=1[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1254 control.mp4
```

### Exact command, scored cut

Pass 1 measured the trimmed and faded audio only:

```
ffmpeg -i assets/audio/music/tension-minor.wav \
 -af "atrim=0:41.8,asetpts=N/SR/TB,afade=t=in:st=0:d=0.35,\
afade=t=out:st=40.30:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Its output is fed into pass 2:

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 \
 -i assets/audio/music/tension-minor.wav \
 -filter_complex "[1:a]atrim=0:41.8,asetpts=N/SR/TB,\
afade=t=in:st=0:d=0.35,afade=t=out:st=40.30:d=1.5,\
loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.46:measured_TP=-4.41:\
measured_LRA=9.00:measured_thresh=-26.68:offset=-0.65:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-scored.mp4
```

### Exact command, cover

```
ffmpeg -y -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" -vsync 0 youtube-cover.png
```

---

Nothing was posted, scheduled, uploaded or committed. No git command was run.
Nothing outside
`docs/growth/reel-campaign-ab/run-20260729-2318/youtube/` was written.
