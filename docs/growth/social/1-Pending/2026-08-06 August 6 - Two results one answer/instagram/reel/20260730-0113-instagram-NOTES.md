# Instagram Reel, run 20260730-0113

**Hook driver:** #4, contrarian, "ranking first in Google does not mean you exist
in AI answers".

Runs 1 to 3 used loss aversion, status threat and curiosity gap. Contrarian is
structurally different from all three. Loss aversion and status threat point a
threat at the viewer. Curiosity gap opens a loop and withholds the end of it.
Contrarian does neither: it attacks a belief the viewer already holds, which
means it has to **name that belief plainly before disagreeing with it**, or the
disagreement reads as a non sequitur about nothing.

So scene 1 is the belief, stated in the viewer's own terms and stated
sympathetically: *Page one on Google feels like proof.* Nothing is disputed yet.
Scene 2 concedes the belief is true and narrows what it is true *of*: it proves
where you sit on a list. Scene 3 is the actual disagreement, and it is a
disagreement about **measurement**, not about SEO: an AI answer is not a list, so
a list position is not the thing being measured. Scenes 4 and 5 put a published
audit behind it. Scene 6 is the thesis in one sentence. Scene 7 is a soft CTA
shaped as a question rather than an instruction.

**It deliberately does not say "SEO is dead".** That claim is false, it is easy to
refute in a comment, and refuting it in public would cost more than the reach it
buys. The cut concedes that page-one ranking is real and proves something. It
disputes only the inference from it. `bg-005.html` takes the same line in longer
form ("You still need the SEO foundation... that foundation is necessary, not
sufficient"), so the video is consistent with the published position rather than
a punchier version of it.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows; `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 4,187,194 bytes, scored 4,906,108 bytes, cover 239,648 bytes.

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=130. Each block is vertically centred on y=880, the centre of the 220..1500
visible band.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282), the wordmark
`BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a progress
bar at y=1438.

**0.00 to 4.40 s**, Inter ExtraBold 84, ink `#E8E9ED`. Hard in at full opacity,
no fade up, because this frame is the cover.
```
Page one
on Google
feels like
proof.
```

**4.40 to 8.60 s**, Bold 84 ink, then ExtraBold 76 accent `#A78BFA`
```
It proves
one thing.

Where you sit
on a list.
```

**8.60 to 12.80 s**, Bold 84 ink, then ExtraBold 76 accent
```
An AI answer
is not a list.

It names
very few.
```

**12.80 to 17.00 s**, SemiBold 40 accent kicker, then Bold 84 ink
```
ONE AUDIT

20 real
customer
questions.
```

**17.00 to 21.60 s**, Bold 84 ink, then ExtraBold 76 accent
```
The top answer
on several
engines.

Zero mentions
on another.
```

**21.60 to 25.20 s**, Bold 84 ink, then ExtraBold 84 accent. The sentence runs
across the weight change on purpose, so the accent lands on the half that is the
argument.
```
First on the
page is not
the same as
named in
the answer.
```

**25.20 to 28.00 s**, Bold 74 ink, URL SemiBold 54 accent. Fades in only, no fade
out, so the CTA holds to the last frame.
```
Which one are
you measuring?

getbrandgeo.com
```

---

## Every claim and number on screen, and the published page it comes from

Nothing here is illustrative. Each figure was read out of the live HTML in
`brandgeo/web/`, not recalled.

| On screen | Source page | Exact wording on that page |
|---|---|---|
| "Page one on Google" | `bg-004.html` | "a market-leading catering company, the kind of brand that **shows up on page one of Google** without trying very hard" |
| "It proves one thing. / Where you sit on a list." | `bg-005.html` | GEO/SEO table, *Unit of success*: SEO = "Position on a results page (#1 to #10)"; GEO = "Presence, framing, and sentiment inside one response" |
| "An AI answer is not a list." | `bg-005.html` | *What the user sees*: SEO = "Ten ranked links they still have to evaluate themselves"; GEO = "One synthesized answer, often citing zero to three sources" |
| "It names very few." | `bg-005.html` | *Does "close enough" still win?* GEO = "Rarely, **most answers name very few brands**, sometimes exactly one" |
| **"20 real customer questions."** | `bg-004.html` | key finding: "**20**, Real customer questions tested, identical across every engine". Body: "20 real questions a prospective customer might actually ask, run identically" |
| "The top answer on several engines." | `bg-004.html` | key finding: "**3**, Platforms where the brand was the #1 recommendation". Body: "the brand came back as the top recommendation, consistently, across the majority of the 20 questions" |
| **"Zero mentions on another."** | `bg-004.html` | key finding: "**0**, Times the brand appeared anywhere in Gemini's answers". Body: "the same brand, answering the same 20 questions, **appeared zero times**" |
| "First on the page is not the same as named in the answer." | `bg-005.html`, `bg-004.html` | bg-005: "SEO optimizes for a spot on a list the user still has to read. GEO optimizes for being the answer the user never has to look past." bg-004: "a brand can rank #1 organically and still not exist in the generated answer at all" |

Only one digit string appears anywhere in the cut: **`20`**. Verified
mechanically, not by reading (`checks.py` regexes every rendered string).

### Why the engine COUNT was dropped, and it cost the cut something

BG-004's headline figures are "#1 on **three** AI engines" out of "**5** major AI
engines". Both are published, both are traceable, and **both were deliberately
left off screen.** The cut says "several engines" and "another" instead.

The reason is the same one that made run 3 reject BG-016, applied to a different
page. BG-004's five is **not our five**. Its body names ChatGPT, Perplexity and
**Microsoft Copilot** as the three that returned the brand first, Claude as the
one that mentioned it, and Gemini as the one that returned nothing. Copilot is
live on **no purchasable plan** (`planConfig.ts`: it appears only in `pro` and
`enterprise`, and sits in `COMING_SOON_ENGINES`). So "first on three engines"
published today, next to a current BrandGEO CTA, invites the reader to assume
those three are three of the five we sell, and one of them is not.

"Several" is weaker copy. It is also the version that cannot be misread, and the
finding does not depend on the count: the argument is that a brand can be the top
answer in some engines and absent in another, which is exactly as true at three
as at any number.

### A real defect found on `bg-004.html` while sourcing this, worth fixing

The page contradicts itself about its own engine list. The body names **six**
distinct engines across an audit it describes as five (ChatGPT, Perplexity,
Microsoft Copilot, Claude, Gemini), while the closing methodology paragraph says
"all 5 core AI engines: ChatGPT, Gemini, Claude, Perplexity, and **Meta AI**".
Copilot appears in the finding and not in the method; Meta AI appears in the
method and not in the finding. Meta AI is also retired. This is pre-existing and
outside this task's scope; it is recorded here because it is the reason the count
could not be used, and because a page that argues for careful measurement should
not disagree with itself about what it measured.

### Compliance check on the copy, run mechanically

`checks.py` extracts every company-shaped token from `bg-004.html` and
`bg-005.html` (51 candidates after stopwords) and regexes each one against the 30
rendered strings. It is a match, not a read.

- **Third-party brands on screen: none.** The only two matches are `BrandGEO`
  (ours) and `Google`. No engine is named anywhere in the cut: not ChatGPT,
  Gemini, Claude, Perplexity, Google AI Mode, Copilot, Meta AI. No measurement
  firm is named either, though `bg-005.html` cites three by name. The catering
  brand at the centre of BG-004 is unnamed **on the source page itself**, so
  there was nothing to withhold there.
- **On `Google`, which is the one deliberate exception.** The shared brief
  defines this driver, verbatim, as *"Contrarian, 'ranking first in Google does
  not mean you exist in AI'"*, so the word is the belief-object the driver is
  built on and the hook does not exist without it. It is also not being used the
  way the no-naming rule guards against: nobody's measured performance is
  attributed to a named party, no relationship is implied, and Google is named as
  the place the viewer ranks, not as a party under audit. Gemini is Google's
  product and BG-004's zero belongs to it, and **Gemini is not on screen** for
  exactly that reason.
- **No engine is named, so the growth-five constraint is satisfied vacuously.**
  For the record, `planConfig.ts` `PLAN_ENGINES.growth` is `chatgpt`, `gemini`,
  `claude`, `perplexity`, `google_ai`, read from the file.
- **No Grok, no AI Overviews, no rate for either.** Neither is mentioned. The 48%
  AI Overviews prevalence figure published on `bg-005.html` was available and was
  **not used**, because "AI Overviews" plus a percentage on a BrandGEO asset
  reads as our measured rate for that engine, which is 6 rows from one day.
- **Meta AI is retired and does not appear.**
- No pricing anywhere. TOFU asset, soft CTA, the URL is the only ask.
- No em dashes, no en dashes, checked by codepoint. None of the banned vocabulary
  (delve, unlock, unleash, elevate, harness, leverage, game-changer, supercharge,
  revolutionize, seamless, robust, cutting-edge, transformative).

---

## Duration

`ffprobe` on the DELIVERED files, not assumed, and run before this was called
done. A mux can exit 0 and be unreadable.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **28.000000 s** | 840 frames @ 30/1, `duration_ts=430080 / 15360`, 1080x1920, `yuv420p`, H.264 High | **none, `nb_streams=1`** |
| `instagram-scored.mp4` | **28.000000 s** | 840 frames, identical stream (MD5 match) | `duration_ts=1344000 / 48000` = 28.000000 s, 1314 AAC frames, `nb_streams=2` |

Both land on exactly 28.000000 s, inside the 20 to 30 s Instagram target.

The AAC drift warning was measured rather than assumed: decoding the delivered
scored audio yields **1,344,512 samples = 28.010667 s**, 512 samples of encoder
padding past the cut. The mp4 sample table caps the track at
`duration_ts=1344000`, exactly 28.000000 s, so the padding exists as packet
payload and is never played. `-shortest` is what holds that line.

Both files: H.264 High, `yuv420p`, from PNG intermediates only. No JPEG anywhere
in the chain, so no `yuvj420p` range shift.

### The timeline is frame-indexed, and nothing is concatenated

Per the brief, `ffconcat` is not used anywhere. It is not replaced by a directory
of 840 PNGs either, because the drift that rule guards against comes from
**summing float scene durations**, and this build never sums one. Every timeline
gate in the filtergraph is an **integer frame index**:

```
scene 0  frames   0..131    scene 4  frames 510..647
scene 1  frames 132..257    scene 5  frames 648..755
scene 2  frames 258..383    scene 6  frames 756..839
scene 3  frames 384..509
```

`enable='between(n,132,257)'`, not `between(t,4.40,8.60)`. The 56 progress-bar
steps are gated the same way. No float is compared to a frame time anywhere, so
no boundary can land a frame late, and the boundaries were then **verified on the
delivered file** rather than trusted (below).

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 840 frames**, no seeking anywhere, reduced to a global extreme.
Two independent methods, plus declared geometry folded in explicitly.

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays, same
noise seed (`all_seed=20260730`), no logo, no rails, no bar, no type. Measured
across all 840 control frames:

```
control peak luma, whole frame        39.7
control peak luma, copy band          35.9
delivered peak luma, x >= 940         37.9   (nothing is ever drawn there)
method B diff noise floor, x >= 960     10   (threshold set at 12)
```

Drawn colours, Rec.709 luma:

| Element | Colour | Luma |
|---|---|---|
| Body type | `#E8E9ED` | 232 |
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
background.

```
GLOBAL INK BOX, union of everything drawn, 840 frames:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  811    limit <=  900    margin  +89 px
  left   x =   96    (no left reserve specified)
```

### The control is not optional, and this build proves why harder than run 3 did

The brief's corrected rule says never to diff against an assumed flat canvas
colour, because the `yuv420p` frame-edge chroma artefact then reads as ink. On
this build the failure is not confined to rows 0 and 1, it is total:

```
nominal canvas                 rgb(9,10,15)  = 0x090A0F
delivered row 0,   x=700       rgb(10,10,22)
delivered row 900, x=700       rgb( 9, 9,19)

diff vs FLAT assumed canvas  -> ink box y    0..1919   x   0..1079   (the whole frame)
diff vs TEXT-FREE CONTROL    -> ink box y  282..1443   x  96.. 809
control alone vs flat canvas -> ink box y    0..1919   x   0..1079
```

The third line is the proof: the control has **nothing drawn on it at all** and
still "fails" on every edge against a flat colour. Two soft full-frame glow
overlays plus the dither pass mean essentially no pixel equals the nominal canvas
value. A flat-colour diff on this design would report a failure on every edge of
every run, forever. Only the control cancels it, because it carries the same
glows, the same dither seed and the same codec.

### Method A, absolute luma threshold (cross-check)

```
luma >  45 : y  301..1442  x   96..809   top +81  bottom +58  right +91
luma >  60 : y  301..1442  x  130..809   top +81  bottom +58  right +91
luma >  90 : y  301..1442  x  130..809   top +81  bottom +58  right +91
luma > 120 : y  302..1442  x  130..799   top +82  bottom +58  right +101
```

The two methods agree, and every difference is explained rather than waved at.
**Per the brief, the method finding MORE ink is trusted, and that is B on all
three binding edges:**

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
excluded), that band runs **y 604..1130, x 96..763**. Its right extent, 763, is
**137 px** clear of the reserve and 48 px inside the progress bar, so type is not
close to binding on any edge this run.

### The width probe ran before the master, and predicted the delivered file exactly

All 29 copy lines were rendered alone at their final font and size and measured
before 28 seconds of encoding. Widest was **`The top answer`**, Inter Bold 84,
reaching **x=763**. The delivered file's measured copy-band right edge is
**763**, the same number, which is the cheapest available confirmation that the
probe models the master correctly.

Nothing had to be resized this run. Run 3 caught a line at Bold 78 reaching
x=820 and had to reduce it; the longest line here had 137 px of margin, so the
probe pass cost one minute and changed nothing. That is the correct outcome for a
probe, not a wasted step.

---

## Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(4.40-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene, and no y-settle on scene 1
either, since a settle would also move frame 0.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 52086a307415c0e05b359caeef637e18
instagram-cover.png             : 52086a307415c0e05b359caeef637e18
```

Video stream MD5, identical across both cuts: `ba801384862494c677e4a0f442b64a32`.

---

## Progress bar actually animates

The brief's `drawbox` trap was respected up front: geometry is literal on every
box and the only expression anywhere in the bar is `enable`. The fill is **56
discrete static boxes**, one per 0.5 s, at literal widths, each gated on an
integer frame range.

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
frame rather than hashing (identical pictures get different quantisation noise,
so hashes are useless here):

```
ink-pixel transitions at t = 4.33, 4.50, 8.50, 8.70, 12.70, 12.90,
                            16.93, 17.10, 21.50, 21.70, 25.10, 25.30
scripted cuts         at t = 4.40, 8.60, 12.80, 17.00, 21.60, 25.20
scripted cuts         at frames 132, 258, 384, 510, 648, 756
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

**On the choice, since `ATTRIBUTION.md` nominates a different track for this
driver.** That file's "Deliverables and roles" table maps `contrarian-drive` to
contrarian hooks, which is this run's driver. The track was still held at
`tension-minor`, and that table now says so itself: it carries a note, added
2026-07-30, recording that this campaign holds music CONSTANT because **the hook
is the variable under test**, and that the mapping applies to one-off assets or
to a later run where music is itself the variable. Changing the music in the same
run that changes the driver would leave a winning run with two candidate
explanations and no way to separate them. Worth revisiting once the six-driver
cycle completes.

Source is 60.000 s. Trimmed to 28.000 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 26.5 s**, then two-pass `loudnorm`.

### The fade in is load-bearing and was verified

`tension-minor` opens at amplitude 0.025 and peaks at 0.206 inside its first
0.1 s, so a hard cut at sample 0 clicks. Measured on the **delivered** file, by
decoding the AAC:

```
FIRST 64 SAMPLES, abs max : 0.002845     ceiling 0.005    PASS
first 10 ms,      abs max : 0.013417
final 0.1 s,      abs max : 0.025923     (fade out landed)
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
  12-14   -15.77        2702      <- arrangement opens, under "20 real customer questions"
  14-16   -16.57        2417
  16-18   -16.48        1907
  18-20   -15.98        1800
  20-22   -15.91        2122
  22-24   -15.91        2458
  24-26   -15.14        2488      <- loudest block, under the thesis line
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

**What is good.** It builds. RMS climbs about 6.6 dB from the opening block to
the 24-26 s block and the spectral centroid moves from roughly 470 Hz to 2500 Hz.
The two structural peaks land at **12-14 s**, which is the evidence card, and
**24-26 s**, which is the thesis line. For a contrarian cut that is a better fit
than it was for the curiosity gap: the track is quietest while the belief is
being stated sympathetically, and loudest at the moment the belief is
contradicted.

**The weakness, stated plainly and unchanged across runs.** It is heavily
bottom-weighted. Full-mix RMS is -16.82 dBFS; filtering everything below 300 Hz
leaves **-26.57 dBFS**, a **9.7 dB** drop. On a phone speaker, which has almost
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

Each of the 29 copy lines was rendered alone at its final font and size and its
ink bounding box measured, so the right reserve was checked before 28 seconds of
encoding rather than after.

```bash
ffmpeg -v error -y -f lavfi -i "color=c=black:s=1080x400" \
  -vf "drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/lNN.txt:x=130:y=60\
:fontsize=84:fontcolor=0xFFFFFF" \
  -frames:v 1 -f rawvideo -pix_fmt gray - | (numpy: nonzero(a > 40))
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

The filtergraph is 12,137 characters: 30 `drawtext` calls (29 copy lines plus the
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

  [progress fill, 56 static boxes, INTEGER FRAME gates, no geometry expression:]
  drawbox=x=130:y=1438:w=12:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(n\,0\,14)',
  drawbox=x=130:y=1438:w=24:h=5:...:enable='between(n\,15\,29)',
  ... 54 more ... final step w=680 at n 825..839,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover, and no y-settle:]
  drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=txt/l00.txt:x=130:y='672'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,(4.40-t)/0.30))':enable='between(n\,0\,131)',
  ... l01 at y=776, l02 at y=880, l03 at y=984 ...

  [scenes 2 to 6, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/l04.txt:x=130
    :y='657+18*(1-min(1\,(t-4.40)/0.45))'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.40)/0.35\,(8.60-t)/0.30)))'
    :enable='between(n\,132\,257)',
  ...

  [scene 7, the CTA, fades IN only so it holds to the final frame:]
  drawtext=...:alpha='max(0\,min(1\,(t-25.20)/0.35))'
    :enable='between(n\,756\,839)',

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
duration_ts,time_base,nb_frames,profile -of default=nw=1 instagram-silent.mp4

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

The safe-zone measurement, the frame-edge artefact demonstration, the
bar-animation check and the scene-boundary count are one numpy pass over two
synchronised `ffmpeg -f rawvideo -pix_fmt rgb24` pipes, the delivered file and
the control, decoded sequentially with no seeking, over all 840 frames, reduced
to a global extreme.

---

## Every trap in the brief, and how it was handled

Applied as preconditions, not discovered:

| Trap | Handling |
|---|---|
| `drawbox` blends on RGBA | `replace=1` on all 58 boxes, with pre-blended opaque colours so nothing depends on alpha |
| `drawbox` cannot animate | 56 literal static boxes, `enable` is the only expression, and the bar was then verified to move on the delivered file |
| Single-digit headroom is a paper pass | smallest edge is **+55 px**; reported per edge, never as "passes" |
| Guess the ink threshold | background peak printed first (39.7), three thresholds inside the gap agree |
| Fade in on scene 1 | scene 1 hard-starts and has no y-settle; cover MD5-matched to frame 0 |
| Furniture counts as ink | all five furniture rects declared and folded in; furniture is the binding edge on all three sides |
| Measure the intermediate | every number comes from the delivered mp4 |
| Diff against a flat canvas | diffed against a text-free control; the flat-colour method was run too, purely to demonstrate it returns the whole frame |
| Fade the music IN | 0.08 s fade in, first 64 samples at 0.002845 |
| A mux can exit 0 and be unreadable | both files probed for duration and stream count |
| `ffconcat` drift | no concat; all gates are integer frame indices, boundaries verified on the delivered file |
| Frame hashing | ink-pixel counting, not hashing |
| `-ss` near a cut | no seeking anywhere in any measurement |
| `-shortest` | on the mux; 512 samples of AAC padding confirmed present in the packets and excluded by the sample table |
| Never name a third party | mechanical regex scan of 51 candidate names from the source pages against all 30 rendered strings |

**Nothing broke this run and nothing had to be reshot.** The two judgements that
cost the cut something were both editorial rather than technical: dropping BG-004's
engine counts, and declining the 48% figure from bg-005. Both are argued above.

## Scope

This task was scoped to this `instagram/` folder only. Nothing outside it was
written, including this run's `RUN.md`, which is a sibling agent's file. No git
command was run.

## Nothing was posted or scheduled

These are files for review only.
