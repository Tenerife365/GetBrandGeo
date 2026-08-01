# TikTok cut, run-20260729-2318

**Hook driver:** #2, status threat. "Your competitor is the default answer and
you are not."

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. For paid, site embeds and decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, 1080x1920, verified byte-identical. |

**Silent is the one to upload.** In-app audio is a ranking input on TikTok, not
just a licence convenience. A self-supplied track competes with that.

---

## On-screen text, verbatim

Every line below is a separate `drawtext`. Line breaks in the table are literal
line breaks on screen. Frame boundaries were verified by decoding all 960 frames
and detecting content changes, not by trusting the concat list; all 19 land
exactly where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 12 | 0.000 to 0.400 | `YOUR RIVAL` |
| 2 | 14 | 0.400 to 0.867 | `YOUR RIVAL` / `IS THE ANSWER.` |
| 3 | 20 | 0.867 to 1.533 | `YOUR RIVAL` / `IS THE ANSWER.` / `NOT YOU.` (accent) |
| 4 | 33 | 1.533 to 2.633 | `ASK ANY AI` / `WHO IS BEST.` |
| 5 | 21 | 2.633 to 3.333 | label `THE ANSWER` + `1  a competitor` (accent) |
| 6 | 21 | 3.333 to 4.033 | + `2  a competitor` |
| 7 | 30 | 4.033 to 5.033 | + `3  a competitor` |
| 8 | 66 | 5.033 to 7.233 | the three rows, plus `THREE SLOTS.` / `NONE ARE YOURS.` |
| 9 | 54 | 7.233 to 9.033 | `THAT IS NOT` / `A RANKING.` |
| 10 | 54 | 9.033 to 10.833 | `IT IS A DEFAULT.` |
| 11 | 60 | 10.833 to 12.833 | `AND A DEFAULT` / `GETS REPEATED.` |
| 12 | 60 | 12.833 to 14.833 | `EVERY TIME` / `SOMEONE ASKS.` |
| 13 | 54 | 14.833 to 16.633 | `DEFAULTS MOVE.` (accent) |
| 14 | 66 | 16.633 to 18.833 | `IF YOU KNOW` / `WHO HOLDS` / `YOURS.` |
| 15 | 42 | 18.833 to 20.233 | `SO WE ASK.` |
| 16 | 84 | 20.233 to 23.033 | label `WE ASK ALL FIVE` + `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 17 | 66 | 23.033 to 25.233 | `WITH THE` / `PROMPTS YOUR` / `BUYERS TYPE.` |
| 18 | 72 | 25.233 to 27.633 | `THEN WE NAME` / `WHO IS HOLDING` / `YOUR ANSWER.` |
| 19 | 131 | 27.633 to 32.000 | `SEE WHO THE` / `AI PREFERS.` plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` at top left, and a
violet progress bar at the bottom of the safe zone that fills across the cut.

### Why the copy is shaped this way

Status threat is not loss aversion. Run 1 argued "you are losing buyers you
cannot see"; the loss was invisible and the emotion was fear of leakage. This cut
argues the opposite shape: the loss is entirely visible, it has a name, and
somebody is standing in the position. `NONE ARE YOURS` is about occupancy.
Scenes 9 to 12 then take the escalation somewhere loss aversion cannot go: a
ranking can be re-earned, a default just repeats itself on every future ask, so
the rival's position compounds while you do nothing. Scene 13 is the turn.

TikTok gets the bluntest cut of the four. Longest line on screen is 16
characters. No setup sentence, no connective tissue, hard cuts only.

**The first 1.5 seconds carry three state changes.** Measured by ink-pixel count
on frames decoded from the delivered file, not by eye:

```
t=0.000  ink 15,613 px   type box x 102..568  y 250..757
t=0.400  ink 34,706 px   type box x 102..740  y 250..852   (+19,093)
t=0.867  ink 44,836 px   type box x 102..740  y 250..977   (+10,130)
t=1.533  ink 30,532 px   type box x 102..630  y 250..852   (-14,304)
```

A scroll-past decision made at any point in the first second meets a frame that
has just changed. Note that raw frame hashes are NOT usable for this check: H.264
gives visually identical frames different quantisation noise, so two frames
inside one scene hash differently. Ink count and bounding box do not have that
problem.

### Factual position

- No percentage, rate, or measured result appears anywhere. Nothing needs to
  trace to a `bg-*.html` page because nothing is asserted as a measurement.
- `1 / 2 / 3` are list positions in an illustrative answer card, not data. The
  rows read `a competitor` three times, which names no real company and cannot
  be mistaken for a captured answer.
- Engines named are exactly the five in the Growth set,
  `planConfig.ts:59`: ChatGPT, Gemini, Claude, Perplexity, Google AI Mode.
  Grok and AI Overviews are live but Growth PRO and up, and carry one day of
  data, so they are neither named nor rated. Meta AI is retired and absent.
- No pricing, no plan names. TOFU, soft CTA only.
- No em dashes, no en dashes, none of the banned vocabulary.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right. Usable box is `y 200..1560`,
`x ..880`. All numbers below come from frames decoded out of the **delivered**
`tiktok-silent.mp4`, one sample at the midpoint of each of the 19 scenes.

### Ink threshold, argued from measurement

Measured first, chosen second:

```
control render, no elements drawn:              min 9   max 9   (flat)
delivered file, empty region y1600..1900:       min 9   max 9   at t = 0.2, 6, 21, 30
dimmest colour deliberately drawn:              29   (progress track #1B1D2B)
next dimmest:                                   96   (violet rule #7C3AED)
brightest:                                      231  (ink #E8E9ED)
```

The background is a single flat value with zero variance, so the gap between it
and the dimmest real ink is the whole range 10 to 28, empty. **Threshold 11** was
chosen just above the background rather than in the middle of that gap, so the
antialiased skirt of every glyph is counted and the reported box can only be
larger than the design box, never smaller.

The result is not threshold-sensitive. Sweeping the whole union:

```
thr  10   x  99..819   y 248..1506
thr  11   x  99..819   y 248..1506      <- reported
thr  15   x 100..819   y 250..1505
thr  20   x 100..819   y 250..1505
thr  24   x 100..819   y 250..1505
thr  40   x 100..819   y 250..1505
thr  60   x 100..819   y 250..1505
```

### Cross-check with a second, independent method

Method A is a luma threshold on a `gray` decode. Method B decodes `rgb24` and
flags any pixel differing from the canvas colour by more than 2 in **any**
channel, which is a different colour space and a different comparison:

```
method A (gray, thr 11):        x  99..819   y 248..1506
method B (rgb24, delta > 2):    x  96..819   y 248..1511
```

**The right edge agrees exactly, 819 in both.** That is the binding constraint,
and it is the number worth trusting. B runs 3px wider on the left and 5px lower
at the bottom because single-channel fringing survives the RGB comparison and is
averaged away by the gray conversion. Neither edge is near a reserve.

### Reported box, union of BOTH methods, union of everything drawn

Furniture is included: the progress track and fill, the violet row rule, the
logo, the wordmark and the URL, not just type.

```
UNION           x  96..819     y 248..1511
headroom        top 48px       bottom 49px       right 61px
verdict         ALL FRAMES INSIDE THE TIKTOK SAFE ZONE
```

Every scene returns the same union because the progress bar spans the full text
column on every frame and therefore sets `x0`, `x1` and `y1` by itself.

### Type alone, chrome excluded, per scene

Same method with rows at or below y=1490 ignored, which drops the progress bar
and leaves type, the violet row rule and the logo. This is what says how close
the copy actually gets to the edge.

```
scene01  x 102..571  y 248.. 759     scene11  x 100..751  y 248.. 856
scene02  x 102..742  y 248.. 856     scene12  x 100..756  y 248.. 857
scene03  x 102..742  y 248.. 979     scene13  x 102..774  y 248.. 799
scene04  x 101..630  y 248.. 855     scene14  x 100..630  y 248.. 908
scene05  x 100..459  y 248.. 697     scene15  x 100..567  y 248.. 799
scene06  x 100..465  y 248.. 781     scene16  x 100..535  y 248..1033
scene07  x 100..467  y 248.. 865     scene17  x 100..731  y 248.. 907
scene08  x 100..816  y 248..1116     scene18  x  99..766  y 248.. 910
scene09  x 100..593  y 248.. 855     scene19  x 100..639  y 248..1343
```

Widest real type is scene 8, `NONE ARE YOURS.` at `x1 = 816`, **64px** clear of
the limit.

### How the 61px was designed in rather than discovered

Run 1's TikTok build passed on 1px and had to be reshot. That is a rounding
artefact, not a margin, so the column here was sized before the first render, not
after: left margin 100, column width 720, right edge 820, which reserves 60px
inside the 880 limit by construction. Headline point size is then **fitted by
measurement, not chosen**: every unique line is rendered alone at 100pt, its ink
width measured, and the largest size from the ladder 78/72/66/60/54 whose widest
line fits 720px is used. All 19 scenes cleared at 78pt, so the ladder never had to
step down. The widest line, `NONE ARE YOURS.`, measures 912px at 100pt and so
predicts 711px at 78pt against the 720px budget.

That predicted 711px is worth one caveat: the delivered file measures that same
line ending at `x1 = 816`, i.e. 716px from the x=100 pen start, 5px wider than
linear scaling predicted. Point-size scaling of a hinted TTF is not exactly
linear and the fitter is therefore an estimate, not a proof. It is used only to
pick a size; the pass/fail number is always the box measured out of the delivered
mp4, and that number is 816 against a limit of 880.

The two verticals were set the same way: eyebrow top at y=250 against a 200px
reserve, progress bar bottom at y=1506 against a 1560px limit.

---

## Duration, exact ffprobe

```
tiktok-silent.mp4   format 32.000000   nb_streams 1
                    video  32.000000   960 frames   duration_ts 491520 @ 1/15360

tiktok-scored.mp4   format 32.000000   nb_streams 2
                    video  32.000000   960 frames   duration_ts 491520 @ 1/15360
                    audio  32.000000  1501 frames   duration_ts 1536000 @ 1/48000
```

32.000000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a` returns nothing and `nb_streams=1`. That is what `-an`
buys.

**The scored cut did not drift.** The AAC stream holds 1501 frames, which is
1,537,024 samples, 32.0213s of raw payload. The container still reports
32.000000 because `duration_ts` is 1,536,000 samples exactly, so the trailing
1,024-sample tail is excluded by the stream duration rather than played.
`-shortest` is what pins it. Checked, not assumed.

Video is stream-copied into the scored variant. Both files decode to the same
picture, confirmed with a full-stream MD5:
`63880da136fb71bc6d5f5ba23d3fa5ce` on both. Any picture check on one holds for
the other.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master.
Raw `rgb24` MD5 of the cover and of frame 0 of `tiktok-silent.mp4` both read
`9031bc35308d137e6116f41474df7b9a`. Byte-identical.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build.
Frame 0 renders at full opacity carrying `YOUR RIVAL`, so the thumbnail the feed
picks up is the hook, not a blank rectangle.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, and it carries
**no attribution line**. 60.000s source, 48kHz stereo 24-bit, C minor at 100 BPM.
Per `assets/audio/ATTRIBUTION.md` it is the track scored for loss aversion and
status threat, which is this run's driver. Nothing was downloaded and nothing was
synthesized for this cut.

Trimmed to 32.000s with a 1.5s fade out starting at 30.5s, as briefed. A 0.08s
fade in was added on top of that, and it is a judgement call worth naming: the
source is already at 0.195 peak inside its first 0.1s, so playback starting at a
non-zero sample would click. 0.08s removes the click and is far too short to read
as a fade.

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.01   TP -4.41   LRA 3.50   thresh -26.08   offset -1.13
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.00   TP -4.40   LRA 3.50
```

Integrated lands on -16.00 LUFS exactly. True peak is -4.40 dBTP, under the -1.5
ceiling rather than at it: linear mode applies one flat gain, so the peak lands
wherever the integrated target puts it. -1.5 is a ceiling not to exceed, so this
is compliant with 2.9dB spare. Single-pass was not used; the brief is right that
it undershoots, and pass 1 here shows it would have landed at -14.87.

**Honest read: nobody has listened to this file.** Everything above is
measurement. What is known from the library's own measured table and from
`astats` on the delivered cut: crest factor 3.98/4.10, RMS -16.43/-16.68 dBFS,
flat factor 0, LRA 3.50 LU over the 32s window against 6.80 LU over the full 60s,
so the excerpt is less dynamic than the whole track. The mix is centre-dominant
by construction, side-to-mid -11.2 dB, so it will not read as wide on a phone.
The cuts are driven by reading time and the track runs at a fixed 100 BPM, so
they are not locked to each other and will agree at some cuts by coincidence
rather than by design.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph option
value terminates the option even when the value is quoted, so `fontfile=C:/...`
fails to parse.

**1. Scene stills**, one PNG per scene, 19 total, filtergraph written to a file:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex scenes/gNN.txt -map "[out]" -frames:v 1 -update 1 scenes/sNN.png
```

Scene 19 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1080[out]`. A representative
graph body:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=250:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=1500:w=720:h=6:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=1500:w=163:h=6:color=0xA78BFA@1:t=fill:replace=1,
drawtext=fontfile='Inter-ExtraBold.ttf':text='YOUR RIVAL':x=100:y=700:fontsize=78:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-ExtraBold.ttf':text='IS THE ANSWER.':x=100:y=795:fontsize=78:fontcolor=0xE8E9ED[out]
```

`replace=1` is on **every** `drawbox` in this build. The source here is opaque
RGB so blending would have worked, but the brief's run-1 defect (a violet rule
that rendered at alpha 0 and vanished with no error) is cheap enough to make
structurally impossible rather than to reason about per call.

**2. Silent master.** `list.txt` is an ffconcat list of the 19 PNGs with
per-scene `duration` lines. `-frames:v 960` pins the total so per-scene rounding
cannot accumulate:

```
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i list.txt \
  -vf "fps=30,format=yuv420p" -frames:v 960 \
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
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 32.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=30.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.01:measured_TP=-4.41:measured_LRA=3.50:measured_thresh=-26.08:offset=-1.13:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**5. Verification**, bounding box from real decoded frames:

```
ffmpeg -hide_banner -loglevel error -ss T -i tiktok-silent.mp4 -frames:v 1 \
  -f rawvideo -pix_fmt gray -
```

then scan for pixels above the threshold and take min/max x and y. Note that
`-ss` before `-i` seeks approximately and can return the neighbouring scene near
a cut; the scene-boundary table above was produced instead by decoding all 960
frames in one pass and detecting content changes, which is exact.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
row rule, progress track `#1B1D2B`. `#8B5CF6` is used for no text anywhere; it
measures 4.2:1 on this canvas and fails. Inter ExtraBold for headlines, SemiBold
for rows and labels, Bold for the wordmark, Medium for the URL. All vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Dark only.

## Open items

- The answer rows read `a competitor` three times so the cut works for any
  vertical. A vertical-specific variant would hit harder and needs one render per
  vertical.
- `DEFAULTS MOVE.` at scene 13 is the whole pivot of the argument and it gets
  1.8s. If this driver tests well, the next cut should give the turn more room
  and take it from scenes 11 and 12, which currently restate the same idea twice.
- Nobody has heard the scored cut. See the music section.
