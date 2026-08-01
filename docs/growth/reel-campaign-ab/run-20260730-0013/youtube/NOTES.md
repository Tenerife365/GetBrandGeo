# YouTube Shorts, run 20260730-0013

Hook driver: **#3, curiosity gap.** "We asked five engines the same question,
and one pattern held."

Run 1 was loss aversion, run 2 was status threat. Both of those put the viewer
on the defensive. This one does not threaten the viewer at all. It offers a
finding and withholds the end of it, which is a different mechanism and should
produce a different retention curve: the loop opens at 4.6 s ("one pattern
held") and does not close until 25.0 s ("the category decided it, not the
city"). Everything between those two points is the viewer waiting for an answer
they have been told exists.

Shorts tolerate one more beat of setup than TikTok, and this driver needs it,
because a curiosity gap only works if the setup is specific enough to be worth
resolving. So the cut spends three scenes laying out an actual measurement, one
side of it and then the other side, before it names the pattern. Ten scenes.

**This is the first cut in the campaign that carries real evidence.** Every
figure on screen traces to a published research page, and the sourcing table is
below. Status threat needed no numbers because it is an argument about position.
Curiosity gap is an argument about a finding, so it needs them.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all**, `nb_streams=1`. Pick a track from YouTube's own audio library at upload. |
| `youtube-scored.mp4` | Same picture, video stream copied, plus the BrandGEO track. For paid, site embeds and decks. |
| `youtube-cover.png` | Frame 0, 1080x1920, byte identical to the delivered master's first frame. |

---

## On-screen text, verbatim

Ten scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule, centred on
the same axis as the type. Line breaks below are the actual rendered line
breaks. Ink is `#E8E9ED`, accent is `#A78BFA`, and accent lines are marked.

**1. 0.00 to 4.60 s** (all ink, Inter Bold 58. Hard start, no fade, this is the cover)

```
We asked five AI
engines the same
six buyer questions.

City after city.
```

**2. 4.60 to 8.20 s** (line 3 accent)

```
Different cities.
Different companies.

One pattern held.
```

**3. 8.20 to 13.20 s** (last three lines accent)

```
Best property
management company?

Boston: 5 of 5.
Minneapolis: 5 of 5.
Detroit: 4 of 5.
```

**4. 13.20 to 16.80 s** (all ink)

```
Same cities.
Same engines.

Now ask for the best
real estate agent.
```

**5. 16.80 to 21.00 s** (first two lines accent)

```
Boston: 2 of 5.
Detroit: 2 of 5.

Nobody owns it.
```

**6. 21.00 to 25.00 s** (line 2 accent. This closes the loop)

```
The category decided
it. Not the city.
```

**7. 25.00 to 30.40 s** (last three lines accent)

```
Seven Detroit firms
converged on
automotive law.

The same top firms
fell to 2 of 5 on
employment law.
```

**8. 30.40 to 35.00 s** (last line accent)

```
A converged category
already has an owner.

A fragmented one
is still open.
```

**9. 35.00 to 39.60 s** (first two lines accent Inter SemiBold 52, list ink Bold 58)

```
BrandGEO asks your
buyer questions on

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**10. 39.60 to 44.40 s** (logo, ink, then accent)

```
[BrandGEO icon, 196 px]

Find out which side
your category is on.

getbrandgeo.com
```

---

## Every number on screen, and the published page it comes from

Nothing here is illustrative. Each figure was read off a live page in
`brandgeo/web/`, not recalled.

| On screen | Source page | The page's own words |
|---|---|---|
| "five AI engines" | all three city pages | "through the same AI Visibility pipeline BrandGEO runs for paying clients, across five AI engines" |
| "six buyer questions" | all three city pages | "We ran 6 real Boston categories ... each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity" (Minneapolis and Detroit state 6 categories identically) |
| Boston property management, 5 of 5 | `ai-visibility-for-boston.html` | "Green Ocean Property Management, 5/5, full unanimous presence" |
| Minneapolis property management, 5 of 5 | `ai-visibility-for-minneapolis.html` | "Kleinman Property Management, 5/5, full unanimous presence" |
| Detroit property management, 4 of 5 | `ai-visibility-for-detroit.html` | "JMZ Management, 4/5" |
| Boston real estate agents, 2 of 5 | `ai-visibility-for-boston.html` | "Robert Cohen (loose), 2/5, fragmented" |
| Detroit real estate agents, 2 of 5 | `ai-visibility-for-detroit.html` | "Match Realty LLC (loose), 2/5, most fragmented" |
| "Seven Detroit firms converged on automotive law" | `ai-visibility-for-detroit.html` | "seven separate law firms ... all independently reached 3 of 5 engines or higher for 'best automotive and manufacturing law firms in Detroit'" |
| "The same top firms fell to 2 of 5 on employment law" | `ai-visibility-for-detroit.html` | key-findings panel, "The same top automotive-law firms drop to loose 2/5 agreement for general labor and employment law" |

Two claims on screen are not numbers and are worth naming as claims:

- **"The category decided it. Not the city."** This is the Detroit page's own
  conclusion, generalised one step: "a clean demonstration that category
  specificity, not just firm prestige, drives AI consensus." The property
  management result holding across three separate cities is the second leg of
  the same argument.
- **"A converged category already has an owner. A fragmented one is still
  open."** This is the interpretive takeaway all three pages already publish
  under "What this means if your business is in X": "A competitor absent from
  those answers faces a documented gap" against "the best-documented
  opportunity ... to become the AI-recommended name."

### Two sourcing decisions a reviewer should push on

**Minneapolis is deliberately absent from scene 5.** Its real-estate figure is
2/4, not 2/5, because Google AI Mode's collection failed on 4 of that city's 6
prompts and the page scores those categories out of the engines that actually
responded. Putting "2 of 4" next to two "2 of 5"s would either need explaining
or would quietly imply a worse result than the page reports. Minneapolis stays
in scene 3, where its property-management figure genuinely is out of 5. The
denominator on screen is the denominator on the page in every case.

**`bg-016.html` was read, and NOTHING is sourced from it. Not on screen, and
not in the description either.**

The binding reason is the engine set, and it was settled across this run rather
than by me alone. `bg-016`'s sweeps are 4-of-4 across Claude, Gemini, **Meta
AI** and Perplexity. Meta AI is retired. This cut says "we asked five AI
engines" and then names the five current Growth engines in scene 9, so quoting a
`bg-016` figure anywhere in this asset would attach the wrong engine set to the
number. On a video whose entire argument is that AI answers are measurable, an
unfalsifiable figure is the worst possible defect, and it would be worse for
being invisible to a viewer.

An earlier draft of the description here cited `bg-016`'s "20 buyer categories"
as corroboration, on the reasoning that a category count carries no engine
claim. **That was wrong and has been removed.** The sentence sat inside a
paragraph that had already said "five engines", so the count would have been
read against a five-engine study that does not exist. The description now ends
on the Detroit finding, which is fully sourced to a five-engine run.

The page has a second, independent problem worth recording: its key-findings
panel says the 20 categories ran across four cities while its body names six
(Paris, London, Berlin, New York, Dublin, Rome). That contradiction is real and
unresolved on the live page. Anyone tempted to use `bg-016` in a later run needs
to clear both the engine-set mismatch and the city-count contradiction first.

The three city pages have neither problem. Each states its five engines
explicitly and each says outright that "This run used Google AI Mode in place of
the now-retired Meta AI engine used in earlier city pages", so the engines
behind every number on screen are exactly the engines named in scene 9.

### No third party is named anywhere in this asset

Every figure on screen comes from a finding about a specific named company, and
**not one of those names appears on screen or in the description.** Scene 3 says
"Best property management company?" and gives ratios. Scene 7 says "Seven
Detroit firms". The pattern is stated, the party never is.

This is not squeamishness, it is a real difference in what the two artefacts
are. A research page is a dated record of what engines said on a stated
collection date, published with a right of reply. A Short is commercial use of
someone else's name in an ad, which implies a relationship that does not exist
and which they never agreed to. The finding survives the removal intact: "5 of 5
engines in Boston" carries exactly the weight of the sentence with the company
in it, and cannot be objected to by anyone.

Verified mechanically rather than by reading. Every capitalised token rendered
to a text layer was extracted and listed:

```
A  AI  Best  Boston  BrandGEO  ChatGPT  City  Claude  Detroit  Different
Find  Gemini  Google  Minneapolis  Mode  Nobody  Not  Now  One  Perplexity
Same  Seven  The  We
```

Three US cities, our own brand, and the five Growth engines the brief requires
by name. Nothing else. A second pass scanned the rendered strings for all 35
company and individual names that appear on the three source pages and returned
`NONE`.

The company names DO appear in the provenance table above, and should stay
there. That table is an internal audit trail whose whole purpose is to let a
reviewer open the source page and confirm the number. Quoting the page verbatim
is what makes it checkable. It is not published copy and does not ship with the
video.

### Compliance check against the brief

No em dashes and no en dashes anywhere, on screen or in this file. None of the
thirteen banned terms appears in the on-screen copy.

The engine list in scene 9 is exactly the five on the Growth tier per
`brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
`perplexity`, `google_ai`. Meta AI is absent because it is retired. **No Grok
figure and no AI Overviews figure appears**, and neither engine is named,
because both went live 2026-07-29 with one day of rows. Copilot and DeepSeek are
absent because they sit on no purchasable plan.

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Measured against the **delivered** `youtube-silent.mp4`, not the PNG
intermediates, over **all 1332 frames**, by three passes.

### Justifying the ink threshold

Not chosen by feel. The plate generator prints its own peak, and a text-free
control was encoded through the identical pipeline so the ceiling could be read
off an encoded file:

```
source plate (mkbg.js, RGB)      peak luma 18.48   mean luma 12.48
control.mp4 (encoded, stored Y)  YMAX distribution: 32 on 565 frames,
                                 33 on 766 frames, 34 on 1 frame
```

34 is the number to argue from. 18.48 is RGB luma; the delivered file is
limited-range `yuv420p`, where `Y = 16 + 219 * luma / 255`, so 18.48 maps to
31.9 and the measured 32 to 34 is that plus encoder ringing.

Stored-Y of everything drawn:

| Drawn element | Colour | Stored Y |
|---|---|---|
| Body and list text | `#E8E9ED` | 216 |
| Accent text | `#A78BFA` | 153 |
| Violet scene rule | `#8B5CF6` | 122 |
| Logo mark | violet, approx `#6A4AC1` | 126 measured |
| Logo card field | approx `#0B0A0D` | 12 measured |

Threshold for method A is **56**. It sits in the empty gap between the
background ceiling of 34 and the dimmest element method A can resolve. The logo
card at stored Y 12 sits **below** the background ceiling, which is what methods
B and C exist for.

### Method A, absolute threshold on the delivered master

```
mode=abs  threshold=56
frames decoded: 1332   frames with no ink: 27
peak sample value seen anywhere: 248
INK UNION  x 152..827   y 580..1207
  top     clearance  580 px  reserve 180  headroom +400  PASS   worst at frame 1054 (t=35.13s)
  bottom  clearance  712 px  reserve 380  headroom +332  PASS   worst at frame 1052 (t=35.07s)
  right   clearance  252 px  reserve 180  headroom  +72  PASS   worst at frame  251 (t=8.37s)
  left    152 px  (Shorts specifies no left reserve)
```

The 27 blank frames are the nine scene crossovers at three frames each.
Expected, not a defect, and confirmed below.

### Method B, per-frame diff against a text-free control

`control.mp4` is the same background with the same drift crop, the same duration
and the same encoder settings, with no text composited at all.

```
mode=diff  threshold=16
frames decoded: 1332   frames with no ink: 27
peak sample value seen anywhere: 215
INK UNION  x 152..827   y 580..1207
  top     clearance  580 px  reserve 180  headroom +400  PASS
  bottom  clearance  712 px  reserve 380  headroom +332  PASS
  right   clearance  252 px  reserve 180  headroom  +72  PASS
  left    152 px
```

**The two methods agree to zero pixels on all four edges.** When they disagree
the rule is to trust the one finding more ink; there is nothing to adjudicate
here.

### Method C, layer alpha, which is the only pass that sees dark furniture

```
layer  1: x 204..772  y  691..1099   computedTop 691  drift 0
layer  2: x 196..782  y  730..1058   computedTop 730  drift 0
layer  3: x 152..827  y  652..1132   computedTop 652  drift 0
layer  4: x 203..779  y  691..1097   computedTop 691  drift 0
layer  5: x 263..715  y  730..1060   computedTop 730  drift 0
layer  6: x 181..796  y  797.. 993   computedTop 797  drift 0
layer  7: x 219..760  y  613..1175   computedTop 613  drift 0
layer  8: x 176..802  y  691..1099   computedTop 691  drift 0
layer  9: x 236..745  y  580..1207   computedTop 580  drift 0
layer 10: x 208..767  y  613..1173   computedTop 613  drift 0
UNION x 152..827  y 580..1207
```

`drift 0` on all ten is the check for the `drawbox` alpha trap. The violet rule
is the topmost thing in every block, so if it had written at alpha 0 the
measured top would sit about 51 px below the computed top. It does not, on any
of the ten, which is positive evidence `replace=1` worked rather than an
assertion that it should have.

### The dark-on-dark blind spot, re-confirmed on this build

Run 2's finding was that the logo card is invisible to both pixel methods.
Re-probed here on frame 1235 (scene 10), row y=760, delivered file against
control:

```
x     deliveredY  controlY  |diff|
380   13          13        0
392   12          13        1     <- declared left edge of the card
400   12          13        1
450   126         14        112   <- the violet mark inside it
490   24          15        9
500   48          15        33
587   12          16        4     <- declared right edge of the card
595   16          16        0

abs>56  resolves x 449..526
diff>16 resolves x 449..526
```

The card differs from the background by **1 of 255** at its own left edge. Both
methods resolve only the 78 px violet mark inside it and miss the 196 px card
entirely. So the honest union folds in the **declared** logo rectangle rather
than a measured one:

```
declared logo rect   x 392..587   y 664..859
```

It is fully contained by the type union on all four edges, so it changes
nothing, but it was checked rather than assumed. This is now the third build
where the declared geometry was the only handle on that element.

### Final union and verdict

```
FINAL UNION (methods A, B, C and the declared 196 px logo rect)
  x 152..827   y 580..1207
  top    580 px   reserve 180   headroom +400
  bottom 712 px   reserve 380   headroom +332
  right  252 px   reserve 180   headroom  +72
  left   152 px
```

**SAFE ZONE: PASS.** Tightest edge is the right at 252 px against a 180 px
reserve, a **72 px** margin. That is 3.6x the 20 px floor the brief sets, and
the right edge is the one that failed run 1's TikTok build at 1 px.

**It is tighter than run 2's YouTube build, which had 95 px, and the reason is
worth recording.** The binding frame is 251 (t=8.37 s), scene 3, whose widest
line is "Minneapolis: 5 of 5." at 20 characters. Run 2's widest was 21
characters but in a narrower glyph set. A city name plus a ratio is an
expensive line, and it is the line that buys this cut its evidence. 72 px still
absorbs a two-character copy edit on that line without approaching the reserve;
a five-character one would not be safe without re-measuring.

The margin that exists was bought the same way as run 2's: type is centred on
x=490 rather than 540, so the column sits clear of the right-hand action rail,
and body type is 58 px.

Cover frame measured separately from the delivered PNG at the same threshold 56:

```
cover ink bbox: x 205..771   y 691..1099
  top 691 (headroom +511)   bottom clearance 820 (+440)   right clearance 308 (+128)
  ink pixels 34324
```

One pixel narrower on the right than layer 1's alpha bbox (772), because the
alpha pass counts fringe down to alpha 8 while the luma pass counts down to
Y 56. A one pixel disagreement in the conservative direction is the expected
behaviour of two different thresholds, not a discrepancy.

### Scene transitions verified on the delivered file, not assumed

Frame hashing does not work on encoded H.264, and `-ss` lands on the wrong side
of a cut. Ink pixels were counted per frame over a single sequential decode:

```
frames counted: 1332
frame 0 ink: 34348 px            <- the cover is not blank
zero-ink runs (scene crossovers): 9, all exactly 3 frames
  137..139  245..247  395..397  503..505  629..631
  749..751  911..913  1049..1051  1187..1189

scene plateau ink, sampled mid-scene:
  1: 34317   2: 27306   3: 41656   4: 32479   5: 21031
  6: 18066   7: 47888   8: 36200   9: 40548  10: 30176
```

Ten distinct plateaus, nine crossovers, each a clean step. The picture is
provably changing where it is supposed to.

---

## Duration and container

Both from `ffprobe` on the **delivered** files in this folder:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **44.400000 s** | 1332 frames, 30/1, 1080x1920, yuv420p, h264 High@4.1 | **none, `nb_streams=1`, zero audio streams** |
| `youtube-scored.mp4` | **44.400000 s** | 1332 frames, identical stream, `-c:v copy` | aac 48 kHz stereo, stream duration **44.400000 s** |

`nb_streams=1` on the master is the load-bearing check. A muted audio track is
not the same thing as no audio track, and a muted track can block a platform's
in-app music picker, which is the whole reason the silent master is primary.

Exit status is not proof a mux worked. Run 2 shipped a 4.7 MB file that exited 0
and probed as `Duration: N/A` with no streams. Both files above were probed
after being copied into this folder, not in the build directory.

The video stream is provably the same bitstream in both:

```
ffmpeg -i youtube-silent.mp4 -map 0:v -c copy -f md5 -   MD5=590f72f3d1b44ccb516ceb296589e4fb
ffmpeg -i youtube-scored.mp4 -map 0:v -c copy -f md5 -   MD5=590f72f3d1b44ccb516ceb296589e4fb
```

so the safe-zone measurement binds on the scored cut too rather than being
assumed to.

44.400 s is inside the 30 to 45 s target and 15.6 s under the 60 s cap.
`-shortest` held the container to the exact cut length.

---

## Cover integrity

Scene 1 has **no fade in**. Frame 0 is the hook at full opacity, because frame 0
is the thumbnail the feed shows. Verified with an md5 over raw RGB taken from
the delivered file:

```
ffmpeg -i youtube-cover.png     -pix_fmt rgb24 -f rawvideo - | md5sum
  7a75d8d461b1f89c7c174916a6a2efd8

ffmpeg -i youtube-silent.mp4 -frames:v 1 -pix_fmt rgb24 -f rawvideo - | md5sum
  7a75d8d461b1f89c7c174916a6a2efd8
```

Identical. The cover is frame 0, not a re-render of it. The 34,348 ink pixels
counted at frame 0 in the transition check are the independent confirmation that
it is not a blank rectangle.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.
Composed by BrandGEO on 2026-07-29, recorded in `assets/audio/ATTRIBUTION.md`.
Owned outright, cleared for commercial use including paid advertising, and it
**requires no attribution line anywhere**. Nothing was downloaded and no music
service was involved.

Held **constant** across runs on purpose. The hook is the variable under test,
so the bed must not be. If this cut outperforms run 1 or run 2, the track is not
a candidate explanation. That is worth more here than picking a bed that suits
curiosity better than it suits status threat.

**There is no CC BY 4.0 line on this asset and there must not be one.** That
obligation belongs to the LibriTTS voice model, and there is no voice of any
kind in this run. Crediting a model that is not in the audio would be a false
statement about the asset, not a harmless precaution.

### Fade in, and the measurement that proves it was needed

Source is 60.000 s, trimmed to 44.400 s. The brief specifies a 0.08 s fade in
and a 1.5 s fade out, and both were applied, the fade out starting at 42.90 s.

The fade in is not cosmetic. Measured on the raw track before any processing:

```
raw track first-64-sample peak |amp| = 0.053095
raw track peak within first 0.1s     = 0.206314
```

A hard cut at sample 0 starts at 0.053 and reaches 0.206 within 100 ms, which is
an audible click, not a fade.

Verified on the **delivered** `youtube-scored.mp4`:

```
delivered first-64-sample peak |amp| = 0.001883      (requirement: < 0.005)
```

**Pass, at 38 percent of the ceiling.** The tail was checked at the same time,
because a fade out that does not reach zero is the same defect at the other end:

```
last 0.100s   peak 0.020015   -34.0 dBFS
last 0.030s   peak 0.002838   -50.9 dBFS
last 0.010s   peak 0.000010  -100.3 dBFS
last 64 smp   peak 0.000001  -125.6 dBFS
```

It ends in real silence rather than being cut off.

### Loudness

Two-pass `loudnorm`, then re-measured independently on the **encoded** file
rather than trusting the filter's own pass-2 summary:

```
pass 1 (measured on the trimmed and faded 44.4 s cut)
  input_i      = -16.74 LUFS
  input_tp     =  -4.41 dBTP
  input_lra    =   8.00 LU
  input_thresh = -26.78
  offset       =  -0.42

ffmpeg -i youtube-scored.mp4 -af ebur128=peak=true
  Integrated:  -15.8 LUFS   (target -16)
  LRA:           8.1 LU
  True peak:    -3.7 dBFS   (ceiling -1.5 dBTP)
```

True peak lands 2.2 dB under the ceiling. The ceiling is a limit, not a target,
and the source already sat near -16 LUFS, so pass 2 applied roughly 0.9 dB of
gain in `linear` mode. There was nothing to fix.

### Honest read on the scored cut

Measured on the delivered file, not judged by ear:

| | |
|---|---|
| LRA | **8.1 LU** (a flat drone measures near 1.5) |
| Stereo | L differs from R on **100.00%** of samples, correlation **0.870** |

LRA 8.1 is the number that says it moves. 100% L/R divergence at correlation
0.870 says it images as a field with width rather than as a point in the centre
of the head.

What it is not: it was not cut to this edit. The track was composed to 60 s for
the campaign generally, and the ten scene changes here fall where reading time
puts them, so bar lines and cuts do not line up. It reads as a bed under the
video rather than as a score of it. That is the correct tradeoff for a shared
library held constant across an A/B, and it is worth knowing before anyone
claims the music hits the cuts. It does not, by design.

**Still upload the silent master for the organic post.** YouTube's in-app
library is free, cleared, and favoured by distribution. The scored cut is for
paid, site embeds and decks, where that library does not exist.

---

## Suggested Shorts title

```
We asked five AI engines the same question in three cities. One pattern held.
```

Written to be read rather than stuffed. It states the setup and withholds the
finding, which is the whole mechanism of this driver, and it does it in two
plain clauses. No keyword list, no colon-and-brackets construction, no "here is
why", no bracketed year.

Alternates on the same driver:

- `Why AI agrees on your property manager and not on your realtor`
- `Same city, same engines, opposite answer. The reason is not the city.`

## Suggested description

```
We ran six real buyer questions through five AI engines, in Boston, Minneapolis
and Detroit, and compared every answer by hand.

Ask any of those engines for the best property management company and they
converge on one name: 5 of 5 engines in Boston, 5 of 5 in Minneapolis, 4 of 5 in
Detroit. Ask the same engines in the same cities for the best real estate agent
and nothing gets past 2 of 5.

Same cities. Same engines. Same run. What changed was the category, not the
city. Detroit shows it most clearly: seven law firms converge on automotive law
there, and the same top names fall to 2 of 5 the moment you ask about employment
law instead.

That matters because the two sides need opposite things from you. A converged
category already has an owner, and getting into that answer means out
documenting whoever is in it. A fragmented one has no owner yet, which is the
cheapest kind of category to become the name in.

BrandGEO asks the questions your buyers actually ask, across ChatGPT, Gemini,
Claude, Perplexity and Google AI Mode, and records who gets named, where in the
answer, and how it describes them.

Find out which side your category is on: https://getbrandgeo.com

The city research this is drawn from:
https://getbrandgeo.com/ai-visibility-for-boston.html
https://getbrandgeo.com/ai-visibility-for-minneapolis.html
https://getbrandgeo.com/ai-visibility-for-detroit.html
```

No hashtag block. The description is written for a person who paused on the
video, and a trailing tag run does not serve that reader. If the channel's
convention requires tags, add them below the links rather than inside the copy.
The three source links are there so the numbers in the video are checkable,
which is the point of using real ones.

No CC BY 4.0 line, for the reason given under Music above.

---

## Build

`ffmpeg 8.1.2-full_build-www.gyan.dev`, `node v24.16.0`, `numpy 2.4.6`. Remotion
is not installed and was not used. Nothing was installed. PNG intermediates
throughout, no JPEG, so nothing gets forced to `yuvj420p`.

Pipeline, all scripts in the session scratchpad:

1. `mkbg.js` writes a 1188x2112 binary PPM: base `#090A0F`, a violet `#7C3AED`
   mass top right, an indigo `#6366F1` mass bottom left, a faint `#8B5CF6`
   centre lift, and an edge vignette. Oversized so the render can drift-crop
   1080x1920 out of it without ever reaching an edge. It prints its own peak
   luma, which is what justifies the ink threshold. Then `ffmpeg -i bg.ppm
   bg.png`.
2. `mktext.js` renders one transparent RGBA layer per scene. Text goes through
   `textfile=` rather than `text=`, so no filtergraph escaping is involved, and
   every invocation is spawned as an argv array so the shell never sees the
   filter string. Fonts are the vendored Inter from
   `docs/growth/grok-launch/images/_build/fonts/`, copied next to the script so
   `fontfile=` needs no drive-letter escaping on Windows.
3. `build.js` composites the silent master and the text-free control.
4. `measure_layers.js`, `measure_delivered.js`, `scenecount.js` and
   `logoprobe.js` do the measurement passes.

**The `drawbox` traps, both guarded explicitly.** On a transparent RGBA source
`drawbox` blends rather than writing alpha, so it renders at alpha 0 and the
violet rule silently does not appear, with no error and nothing to see at
preview scale. It needs `replace=1`. Separately, `drawbox` **cannot animate** on
8.1.2: it has no `eval` option and evaluates `x/y/w/h` once at init, so any
time-dependent expression renders frozen at its t=0 value. Nothing in this build
asks it to animate. The rule is drawn as:

```
drawbox=x=448:y=<blockTop>:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1
```

and the `drift 0` column in the layer table is the evidence it worked.

### Exact command, silent master

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 44.4 -i bg.png \
 -loop 1 -framerate 30 -t 44.4 -i text-1.png \
 -loop 1 -framerate 30 -t 44.4 -i text-2.png \
 -loop 1 -framerate 30 -t 44.4 -i text-3.png \
 -loop 1 -framerate 30 -t 44.4 -i text-4.png \
 -loop 1 -framerate 30 -t 44.4 -i text-5.png \
 -loop 1 -framerate 30 -t 44.4 -i text-6.png \
 -loop 1 -framerate 30 -t 44.4 -i text-7.png \
 -loop 1 -framerate 30 -t 44.4 -i text-8.png \
 -loop 1 -framerate 30 -t 44.4 -i text-9.png \
 -loop 1 -framerate 30 -t 44.4 -i text-10.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1331':y='192*n/1331',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=4.30:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=4.60:d=0.3:alpha=1,fade=t=out:st=7.90:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=8.20:d=0.3:alpha=1,fade=t=out:st=12.90:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=13.20:d=0.3:alpha=1,fade=t=out:st=16.50:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=16.80:d=0.3:alpha=1,fade=t=out:st=20.70:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=21.00:d=0.3:alpha=1,fade=t=out:st=24.70:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=25.00:d=0.3:alpha=1,fade=t=out:st=30.10:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=30.40:d=0.3:alpha=1,fade=t=out:st=34.70:d=0.3:alpha=1[t8];\
[9:v]format=rgba,fade=t=in:st=35.00:d=0.3:alpha=1,fade=t=out:st=39.30:d=0.3:alpha=1[t9];\
[10:v]format=rgba,fade=t=in:st=39.60:d=0.3:alpha=1[t10];\
[bg][t1]overlay=0:0:format=auto[v1];[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];[v7][t8]overlay=0:0:format=auto[v8];\
[v8][t9]overlay=0:0:format=auto[v9];[v9][t10]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1332 youtube-silent.mp4
```

`[1:v]` carries no fade in. That is the cover guarantee, not an oversight.

### Exact command, text-free control

Same background chain, same encoder settings, no text inputs. A measurement
instrument, not delivered.

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 44.4 -i bg.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1331':y='192*n/1331',format=rgba,setsar=1[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1332 control.mp4
```

### Exact command, scored cut

Pass 1 measured the trimmed and faded audio only:

```
ffmpeg -i assets/audio/music/tension-minor.wav \
 -af "atrim=0:44.4,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,\
afade=t=out:st=42.90:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Its output feeds pass 2:

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 \
 -i assets/audio/music/tension-minor.wav \
 -filter_complex "[1:a]atrim=0:44.4,asetpts=N/SR/TB,\
afade=t=in:st=0:d=0.08,afade=t=out:st=42.90:d=1.5,\
loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.74:measured_TP=-4.41:\
measured_LRA=8.00:measured_thresh=-26.78:offset=-0.42:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-scored.mp4
```

### Exact command, cover

```
ffmpeg -y -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" -vsync 0 youtube-cover.png
```

---

## One note for whoever runs driver #4

The right-edge headroom fell from 95 px to 72 px between run 2 and this one for
a single reason: this cut carries evidence, and evidence lines are wide. A city
name plus a ratio ("Minneapolis: 5 of 5.") is the widest kind of line this
campaign produces. Driver #5 is concrete proof, "here is the exact prompt and
the exact answer", which will produce lines wider still. Budget for that at the
copy stage rather than discovering it at the measurement stage: at 58 px Inter
Bold centred on x=490, roughly 22 characters is the practical ceiling before the
right reserve stops being comfortable.

---

Nothing was posted, scheduled, uploaded or committed. No git command was run.
Nothing outside
`docs/growth/reel-campaign-ab/run-20260730-0013/youtube/` was written.
