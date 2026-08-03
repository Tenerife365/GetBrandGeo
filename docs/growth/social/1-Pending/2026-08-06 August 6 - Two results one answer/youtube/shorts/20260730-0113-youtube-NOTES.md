# YouTube Shorts, run 20260730-0113

Hook driver: **#4, contrarian.** "Ranking first in Google does not mean you
exist in an AI answer."

Runs 1 to 3 used loss aversion, status threat and curiosity gap. Those three put
something at stake for the viewer. Contrarian does something structurally
different: it attacks a belief the viewer already holds, which only works if the
belief is stated plainly and fairly first. A viewer who feels their position has
been caricatured stops listening before the disagreement arrives.

So the cut spends its first scene agreeing. "You rank first in Google. That is
real, and it still matters." No hedge, no setup for a trap. The disagreement
starts at 5.00 s and is narrow on purpose: rank does not tell you whether you
exist in an AI answer. Shorts tolerate one extra beat over TikTok, and this
driver spends it on the concession rather than on more evidence.

**It deliberately stops short of "SEO is dead".** That claim is false, trivially
refuted, and would cost this campaign the one thing it is built on, which is
being checkable. Scene 7 says the opposite out loud: "SEO is not dead. It
measures a real thing. It just does not measure this one." The honest position
is two measurements that do not predict each other, and that is also the harder,
more interesting claim.

TOFU. Soft CTA. No pricing on screen. No voice, no narration, no TTS.

---

## Files

| File | What it is |
|---|---|
| `youtube-silent.mp4` | The upload master. **No audio stream at all**, `nb_streams=1`. Pick a track from YouTube's own audio library at upload. |
| `youtube-scored.mp4` | Same picture, video bitstream copied, plus the BrandGEO track. For paid, site embeds and decks. |
| `youtube-cover.png` | Frame 0, 1080x1920, byte identical to the delivered master's first frame. |

---

## On-screen text, verbatim

Ten scenes. Every scene is preceded by an 84x5 violet `#8B5CF6` rule, centred on
the same axis as the type. Line breaks below are the actual rendered line
breaks. Ink is `#E8E9ED`, accent is `#A78BFA`, and accent lines are marked.

**1. 0.00 to 5.00 s** (all ink, Inter Bold 58. Hard start, no fade, this is the cover)

```
You rank first in
Google.

That is real, and
it still matters.
```

**2. 5.00 to 9.20 s** (last line accent)

```
It also does not
tell you whether
you exist inside
an AI answer.
```

**3. 9.20 to 14.20 s** (last three lines accent)

```
Rank is a position
in a list of links.

AI visibility is
whether you get
named at all.
```

**4. 14.20 to 18.00 s** (all ink)

```
We audited a brand
that sits on page
one of Google.
```

**5. 18.00 to 22.40 s** (last two lines accent)

```
Twenty real
customer questions.

Zero appearances in
Gemini's answers.
```

**6. 22.40 to 25.80 s** (last line accent)

```
No penalty.
No downgrade.

Just never named.
```

**7. 25.80 to 30.60 s** (last two lines accent)

```
SEO is not dead.
It measures a real
thing.

It just does not
measure this one.
```

**8. 30.60 to 34.20 s** (last two lines accent)

```
Two measurements.

One does not
predict the other.
```

**9. 34.20 to 39.20 s** (first two lines accent Inter SemiBold 52, list ink Bold 58)

```
BrandGEO asks your
buyer questions on

ChatGPT
Gemini
Claude
Perplexity
Google AI Mode
```

**10. 39.20 to 43.60 s** (logo, ink, then accent)

```
[BrandGEO icon, 196 px]

See whether AI
names you at all.

getbrandgeo.com
```

---

## Every number on screen, and the published page it comes from

Two figures, one source page, and both are read off its own key-findings panel.

| On screen | Source page | The page's own words |
|---|---|---|
| "that sits on page one of Google" | `brandgeo/web/bg-004.html` | "a market-leading catering company, the kind of brand that shows up on page one of Google without trying very hard" |
| "Twenty real customer questions." | `brandgeo/web/bg-004.html` | key findings, "20 / Real customer questions tested, identical across every engine" |
| "Zero appearances in Gemini's answers." | `brandgeo/web/bg-004.html` | key findings, "0 / Times the brand appeared anywhere in Gemini's answers"; body, "On Gemini, the same brand, answering the same 20 questions, appeared zero times" |

Three claims on screen are not numbers and are worth naming as claims:

- **"Rank is a position in a list of links. AI visibility is whether you get
  named at all."** This is `bg-001.html`'s definition restated: "The AI
  Visibility Gap is the difference between a brand's ranking in traditional
  search (Google, Bing) and its presence in AI-generated recommendations. A
  brand can be ranking on page one of Google for competitive keywords and still
  be completely absent from every AI engine's output."
- **"No penalty. No downgrade. Just never named."** Interpretive, and grounded
  in `bg-004.html`: "a brand can rank #1 organically and still not exist in the
  generated answer at all." The page describes an absence, not a demotion, which
  is the distinction this scene exists to make.
- **"Two measurements. One does not predict the other."** `bg-004.html`'s own
  closing: "You cannot infer your AI Visibility on one engine from your
  performance on another, not even from Google itself."

### The sourcing decision a reviewer should push on hardest

**`bg-004.html` reports a five-engine audit, and this cut quotes only its Gemini
leg. That is deliberate and it costs the cut its best-sounding number.**

The page's headline is "Ranked #1 on Three AI Engines. Completely Absent on
Gemini." Three-of-five is the more dramatic figure and it was left on the floor,
because the three engines the page names are ChatGPT, Perplexity and **Microsoft
Copilot**, and the page's own boilerplate separately lists its five core engines
as ChatGPT, Gemini, Claude, Perplexity and **Meta AI**. Copilot is live on no
purchasable plan. Meta AI is retired. The page contradicts itself about its own
fifth engine, so its engine set cannot be stated correctly at all.

This is the same defect that got `bg-016.html` rejected in run 3, and the same
rule applies: scene 9 names the five current Growth engines, so any figure on
screen carrying an engine-set claim would be read against that list and would be
wrong. So the cut takes only the leg that carries no engine-set claim. "Zero
appearances in Gemini's answers" is scoped to exactly one engine, that engine is
named on screen, and it is one of the five in `planConfig.ts`. Twenty questions
is a question count, not an engine count, and scene 5 binds it to Gemini in the
same breath rather than leaving it floating next to a five-engine list.

**`bg-016.html` was not read for this cut and nothing is sourced from it**, per
the run brief and run 3's finding about its retired-engine dataset.

**"27 cities" appears nowhere**, on screen or in the description. The first seven
city runs used retired Meta AI, so a five-engine claim would be false for them.

**No x-of-4 figure appears beside an x-of-5 figure**, because this cut carries no
ratio at all. The only denominator on screen is 20 questions, and the numerator
that goes with it is zero.

### No third party is named anywhere in this asset

`bg-004.html` never names its client, so there was no company name to withhold
here. The industry was still dropped: the page says "catering company", and the
cut says "a brand". Naming a market-leading catering company in a stated city
would narrow the field enough to be identifying, and the finding does not need
it. The claim is about rank versus AI presence, which is not a catering fact.

Verified mechanically rather than by reading. Every capitalised token was
extracted from the `.txt` files that were fed to `drawtext` via `textfile=`,
which is the literal byte stream ffmpeg drew, not a copy of the source list:

```
AI  BrandGEO  ChatGPT  Claude  Gemini  Gemini's  Google  Google.  It
Just  Mode  No  One  Perplexity  Rank  SEO  See  That  Twenty  Two  We
You  Zero
```

Our own brand, the five Growth engines, `Google` as the search engine in the
belief being argued with, and `SEO`. Nothing else.

A second pass harvested 169 proper-noun candidates from `bg-004.html` and
`bg-001.html` and scanned the rendered strings against them, plus an explicit
list of every third-party entity those pages name (Microsoft, Copilot, Meta AI,
Meta, OpenAI, Anthropic, xAI, Grok, Bing, Instagram, WhatsApp, Facebook,
DeepSeek, Twitter, X):

```
explicit third-party entity hits: NONE
```

The generic pass returned `Gemini's`, `Just`, `That`, `This`, `Real`,
`Visibility`, `On ChatGPT`. Every one is sentence-start capitalisation harvested
out of prose or an engine name that is required on screen. No organisation.

### Compliance check against the brief

```
banned vocabulary on screen : NONE
em dash U+2014 on screen    : 0
en dash U+2013 on screen    : 0
Grok / AI Overviews         : NONE
pricing tokens              : NONE
```

The engine list in scene 9 is exactly the five on the Growth tier per
`brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`,
`perplexity`, `google_ai`. Meta AI is absent because it is retired. **No Grok
figure and no AI Overviews figure appears**, and neither engine is named,
because both went live 2026-07-29 with one day of rows. Copilot and DeepSeek are
absent because they sit on no purchasable plan.

No em dashes and no en dashes anywhere, on screen or in this file.

---

## Safe-zone measurement

YouTube Shorts reserves: top **180**, bottom **380**, right **180**.

Measured against the **delivered** `youtube-silent.mp4`, not the PNG
intermediates, over **all 1308 frames**, by three passes.

### Justifying the ink threshold

Not chosen by feel. The plate generator prints its own peak, and a text-free
control was encoded through the identical pipeline so the ceiling could be read
off an encoded file rather than inferred:

```
source plate (mkbg.js, RGB)      peak luma 23.09   mean luma 18.47
control.mp4 (encoded, stored Y)  YMAX distribution: 37 on 36 frames,
                                 38 on 1262 frames, 39 on 10 frames
```

**39 is the number to argue from.** 23.09 is RGB luma; the delivered file is
limited-range `yuv420p`, where `Y = 16 + 219 * luma / 255`, so 23.09 maps to
35.8 and the measured 37 to 39 is that plus encoder ringing.

Stored Y of everything drawn, measured on the delivered file, not computed:

| Drawn element | Colour | Stored Y |
|---|---|---|
| Body and list text | `#E8E9ED` | 221 to 223 peak |
| Accent text | `#A78BFA` | 158 peak |
| Violet scene rule | `#8B5CF6` | **122, identical in all ten scenes** |
| Logo mark | violet, approx `#6A4AC1` | 124 measured |
| Logo card field | approx `#0B0A0D` | **26 measured** |

Threshold for method A is **56**. It sits in the empty gap between the
background ceiling of 39 and the dimmest element method A can resolve, the
violet rule at 122. The logo card at stored Y 26 sits **below** the background
ceiling, which is what method C exists for.

### Method A, absolute threshold on the delivered master

```
mode=abs  threshold=56
frames decoded: 1308   frames with no ink: 9
peak sample value seen anywhere: 231
INK UNION  x 199..776   y 582..1177
  top     clearance  582 px  reserve 180  headroom +402  PASS   worst at frame 1029 (t=34.30s)
  bottom  clearance  742 px  reserve 380  headroom +362  PASS   worst at frame 1032 (t=34.40s)
  right   clearance  303 px  reserve 180  headroom +123  PASS   worst at frame  542 (t=18.07s)
  left    199 px  (Shorts specifies no left reserve)
```

The 9 blank frames are the nine scene crossovers at one frame each. Expected,
and confirmed against the declared scene boundaries below.

### Method B, per-frame diff against a text-free control

`control.mp4` is the same background with the same drift crop, the same
duration, the same frame count and the same encoder settings, with no text
composited at all. It is diffed against, rather than against a flat assumed
canvas colour, because a flat assumption measures the codec's frame-edge chroma
artefact and reports a failure on every edge.

```
mode=diff  threshold=16
frames decoded: 1308   frames with no ink: 9
peak sample value seen anywhere: 195
INK UNION  x 199..776   y 582..1177
  top     clearance  582 px  reserve 180  headroom +402  PASS   worst at frame 1028
  bottom  clearance  742 px  reserve 380  headroom +362  PASS   worst at frame 1031
  right   clearance  303 px  reserve 180  headroom +123  PASS   worst at frame  541
  left    199 px
```

**The two methods agree to zero pixels on all four edges.** The worst-case frame
indices differ by one, which is the two thresholds crossing at different points
inside a 0.3 s alpha fade, not a disagreement about geometry. When the methods
disagree the rule is to trust the one finding more ink; there is nothing to
adjudicate here.

### Method C, layer alpha, the only pass that sees dark furniture

```
layer  1: x  267.. 710  y  690..1058   computedTop 690  drift 0
layer  2: x  262.. 716  y  710..1037   computedTop 710  drift 0
layer  3: x  247.. 732  y  652..1095   computedTop 652  drift 0
layer  4: x  218.. 758  y  748..1010   computedTop 748  drift 0
layer  5: x  199.. 776  y  690..1058   computedTop 690  drift 0
layer  6: x  229.. 748  y  730..1017   computedTop 730  drift 0
layer  7: x  241.. 738  y  652..1098   computedTop 652  drift 0
layer  8: x  203.. 773  y  730..1031   computedTop 730  drift 0
layer  9: x  236.. 745  y  582..1177   computedTop 582  drift 0
layer 10: x  238.. 739  y  598..1160   computedTop 598  drift 0
UNION x 199..776  y 582..1177   (declared 196 px logo rect folded in)
```

`drift 0` on all ten is the check for the `drawbox` alpha trap. The violet rule
is the topmost thing in every block, so if it had written at alpha 0 the
measured top would sit about 51 px below the computed top. It does not, on any
of the ten, which is positive evidence `replace=1` worked rather than an
assertion that it should have. The rule measuring stored Y **122 in all ten
scenes** on the delivered file is the second, independent confirmation.

### The dark-on-dark blind spot, re-confirmed on this build

Re-probed on frame 1250 (scene 10), row y=740, delivered file against control:

```
x     deliveredY  controlY  |diff|
380   35          35        0
392   26          35        9     <- declared left edge of the card
400   26          36        10
450   124         36        88    <- the violet mark inside it
490   121         37        84
560   26          37        11
587   26          37        11    <- declared right edge of the card
595   37          37        0

abs>56  resolves x 449..522
diff>16 resolves x 449..524
```

The card differs from the background by **9 of 255** and sits **below** it, at
stored Y 26 against 35. Method A cannot see it because 26 is under the threshold
of 56, and method B cannot see it because 9 is under the diff threshold of 16.
Both methods resolve only the roughly 75 px violet mark inside it and miss the
196 px card entirely. So the union folds in the **declared** logo rectangle
rather than a measured one:

```
declared logo rect   x 392..587   y 649..844
```

It is fully contained by the type union on all four edges, so it changes
nothing, but it was checked rather than assumed. This is now the fourth build
where the declared geometry was the only handle on that element.

### Final union and verdict

```
FINAL UNION (methods A, B, C and the declared 196 px logo rect)
  x 199..776   y 582..1177
  top    582 px   reserve 180   headroom +402
  bottom 742 px   reserve 380   headroom +362
  right  303 px   reserve 180   headroom +123
  left   199 px
```

**SAFE ZONE: PASS.** Tightest edge is the right at 303 px against a 180 px
reserve, a **123 px** margin. That is 6.2x the 20 px floor, and the right edge is
the one that failed run 1's TikTok build at 1 px.

**123 px is up from run 3's 72 px, and the reason is the driver, not the
layout.** Nothing about the typography changed: still Inter Bold 58, still
centred on x=490 rather than 540 so the column sits clear of the right-hand
action rail. What changed is that contrarian copy is argument, not evidence. The
binding line here is "Zero appearances in Gemini's answers." at 19 characters
(frame 542, scene 5). Run 3's binding line was "Minneapolis: 5 of 5." at 20
characters, and a city name plus a ratio is a more expensive 20 characters than
a sentence, because digits and colons are wide and the glyph mix is unfriendly.

Run 3's note put the practical ceiling at roughly 22 characters. This build
confirms it from the other side: at 19 characters of ordinary prose there are
123 px in hand, so the ceiling is nearer 24 characters for prose and stays near
22 for anything containing a ratio. **That margin was not spent.** Driver #5,
concrete proof, will produce the widest lines this campaign has attempted, and
it should budget at the copy stage rather than discover it at measurement.

Cover frame measured separately from the delivered PNG at the same threshold 56:

```
cover ink bbox: x 267..710   y 690..1058
  top 690 (headroom +510)   bottom clearance 861 (+481)   right clearance 369 (+189)
  ink pixels 26584
```

The video pass counted 26664 ink pixels at frame 0 against the PNG's 26584. Not
a discrepancy: measuring the PNG requires an RGB to YUV conversion that the mp4
frame never underwent, so 80 pixels move across the threshold on rounding. The
md5 below is the identity check, and it is exact.

### Scene transitions verified on the delivered file, not assumed

Frame hashing does not work on encoded H.264, and `-ss` lands on the wrong side
of a cut. Ink pixels were counted per frame over a single sequential decode:

```
frames counted: 1308
frame 0 ink: 26664 px            <- the cover is not blank
zero-ink runs (scene crossovers): 9, all exactly 1 frame
  150  276  426  540  672  774  918  1026  1176

scene plateau ink, sampled mid-scene:
  1: 26613   2: 29899   3: 37500   4: 26153   5: 35019
  6: 22851   7: 35419   8: 25097   9: 41888  10: 30405
```

Ten distinct plateaus, nine crossovers, each a clean step. **Every crossover
frame index is exactly the declared scene boundary times 30**: 5.00, 9.20,
14.20, 18.00, 22.40, 25.80, 30.60, 34.20, 39.20 s map to frames 150, 276, 426,
540, 672, 774, 918, 1026, 1176 with no drift on any of the nine. That is the
check `ffconcat` failed in run 3, where a cut landed on frame 694 instead of 693
while the total duration and frame count still looked correct.

The timeline was not built with `ffconcat` and needed no numbered frame
sequence: it is a single continuous filtergraph over ten looped stills with
alpha fades, so every frame index is evaluated once by the encoder and boundary
arithmetic never accumulates. The frame-index table above is the evidence, not
the claim.

---

## Duration and container

Both from `ffprobe` on the **delivered** files in this folder, probed after they
were copied here, not in the build directory:

| File | `format.duration` | Video | Audio |
|---|---|---|---|
| `youtube-silent.mp4` | **43.600000 s** | 1308 frames, 30/1, 1080x1920, yuv420p, h264 High@4.1 | **none, `nb_streams=1`, zero audio streams** |
| `youtube-scored.mp4` | **43.600000 s** | 1308 frames, identical stream, `-c:v copy` | aac 48 kHz stereo, stream duration **43.600000 s** |

`nb_streams=1` on the master is the load-bearing check. A muted audio track is
not the same thing as no audio track, and a muted track can block a platform's
in-app music picker, which is the whole reason the silent master is primary.

Exit status is not proof a mux worked. Run 2 shipped a 4.7 MB file that exited 0
and probed as `Duration: N/A` with no streams. Both files above were probed in
this folder.

The video stream is provably the same bitstream in both:

```
ffmpeg -i youtube-silent.mp4 -map 0:v -c copy -f md5 -   MD5=f3bc6500d852699160fd5eecc20d8823
ffmpeg -i youtube-scored.mp4 -map 0:v -c copy -f md5 -   MD5=f3bc6500d852699160fd5eecc20d8823
```

so the safe-zone measurement binds on the scored cut too rather than being
assumed to.

43.600 s is inside the 30 to 45 s target and 16.4 s under the 60 s cap.
`-shortest` held the container to the exact cut length. Decoding the scored
file's audio yields 2,093,056 samples, which is 43.6053 s, the AAC decoder's
1024-sample tail padding. The container and both stream durations are exactly
43.600000, which is what a player reads.

---

## Cover integrity

Scene 1 has **no fade in**. Frame 0 is the hook at full opacity, because frame 0
is the thumbnail the feed shows. In the build command `[1:v]` carries a
`fade=t=out` and no `fade=t=in`, which is the guarantee, not an oversight.

Verified with an md5 over raw RGB taken from the delivered file in this folder:

```
ffmpeg -i youtube-cover.png     -pix_fmt rgb24 -f rawvideo - | md5sum
  b56afc5f3ee2a123306eea4042556b97

ffmpeg -i youtube-silent.mp4 -frames:v 1 -pix_fmt rgb24 -f rawvideo - | md5sum
  b56afc5f3ee2a123306eea4042556b97
```

Identical. The cover is frame 0, not a re-render of it. The 26,664 ink pixels
counted at frame 0 in the transition check are the independent confirmation that
it is not a blank rectangle. The cover reads "You rank first in Google.", which
is the belief this cut argues with, so a viewer who never presses play still
gets the premise.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.
Composed by BrandGEO on 2026-07-29 by `scripts/compose_music.py`, recorded in
`assets/audio/ATTRIBUTION.md`. Owned outright, cleared for commercial use
including paid advertising, and it **requires no attribution line anywhere**.
Nothing was downloaded and no music service was involved.

Held **constant** across runs on purpose. The hook is the variable under test,
so the bed must not be.

**There is a track in the library literally named `contrarian-drive`, and
`ATTRIBUTION.md` maps it to contrarian hooks. It was not used, and using it
would have been a mistake.** That mapping table applies when a track is chosen
for a one-off asset, or later, if music itself becomes the variable under test.
Swapping the bed on the run whose hook is the variable would leave any result
with two candidate explanations and no way to separate them. The attribution
file flags this exact trap, having already caught one run reaching for
`build-resolve` on a curiosity-gap cut.

**There is no CC BY 4.0 line on this asset and there must not be one.** That
obligation belongs to the LibriTTS voice model, and there is no voice of any
kind in this run. Crediting a model that is not in the audio would be a false
statement about the asset, not a harmless precaution.

### Fade in, and the measurement that proves it was needed

Source is 60.000 s, trimmed to 43.600 s. The brief specifies a 0.08 s fade in
and a 1.5 s fade out, and both were applied, the fade out starting at 42.10 s.

The fade in is not cosmetic. Measured on the raw track before any processing:

```
raw track first-64-sample peak |amp| = 0.061709
raw track peak within first 0.1s     = 0.206314
```

A hard cut at sample 0 starts at 0.062 and reaches 0.206 within 100 ms, which is
an audible click, not a fade.

Verified on the **delivered** `youtube-scored.mp4` in this folder:

```
delivered first-64-sample peak |amp| = 0.002815      (requirement: < 0.005)
```

**Pass, at 56 percent of the ceiling.** Higher than run 3's 0.0019 because the
raw track's first 64 samples are louder at this trim than run 3 measured
(0.0617 against 0.0531, the same source read at a different sample alignment
after `atrim` and `asetpts`), and the 0.08 s fade is the same length either way.
Still comfortably inside the limit.

The tail was checked at the same time, because a fade out that does not reach
zero is the same defect at the other end:

```
last 0.100s   peak 0.027775   -31.1 dBFS
last 0.030s   peak 0.005764   -44.8 dBFS
last 0.010s   peak 0.000819   -61.7 dBFS
last 64 smp   peak 0.000007  -102.7 dBFS
```

It ends in real silence rather than being cut off.

### Loudness

Two-pass `loudnorm`, then re-measured independently on the **encoded** file
rather than trusting the filter's own pass-2 summary:

```
pass 1 (measured on the trimmed and faded 43.6 s cut)
  input_i      = -16.64 LUFS
  input_tp     =  -4.41 dBTP
  input_lra    =   9.00 LU
  input_thresh = -26.78
  offset       =  -0.50

ffmpeg -i youtube-scored.mp4 -af ebur128=peak=true
  Integrated:  -15.8 LUFS   (target -16)
  LRA:           8.6 LU     (low -22.3, high -13.7)
  True peak:    -3.8 dBFS   (ceiling -1.5 dBTP)
```

True peak lands 2.3 dB under the ceiling. The ceiling is a limit, not a target,
and the source already sat near -16 LUFS, so pass 2 applied roughly 0.8 dB of
gain in `linear` mode. There was nothing to fix.

### Honest read on the scored cut

Measured on the delivered file, not judged by ear:

| | |
|---|---|
| LRA | **8.6 LU** (a flat drone measures near 1.5) |
| Stereo | L differs from R on **100.00%** of samples, correlation **0.870** |

LRA 8.6 is the number that says it moves. 100% L/R divergence at correlation
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
Ranking first in Google does not mean you exist in an AI answer
```

Written to be read rather than stuffed. It is the whole argument in one clause,
it names the belief before disagreeing with it, and someone scrolling past knows
immediately whether they disagree, which is the click. No keyword list, no
colon-and-brackets construction, no "here is why", no bracketed year, no all
caps.

Alternates on the same driver:

- `Page one of Google. Zero mentions in Gemini. Both were true at once.`
- `SEO is not dead. It just answers a different question than this one.`

## Suggested description

```
This is not an argument that SEO stopped working. It works, it is measurable,
and a page one position is still worth having. The claim is narrower: a search
rank tells you where you sit in a list of links, and it tells you nothing about
whether an AI engine names you when someone asks it a buying question. Those are
two measurements, and one does not predict the other.

We ran an AI Visibility audit for a brand that sits on page one of Google
without working very hard at it. Twenty real customer questions, the kind a
prospect actually types. On Gemini, the engine most closely tied to Google's own
index and structured data, that brand appeared zero times across all twenty.

Not penalised. Not downranked. Never named. AI engines do not echo organic
rankings back as recommendations; they build an answer from the entity and
citation signals they can verify, and a brand that has not been described
consistently across the wider web can be missing from that answer while ranking
first in the search results on the same query.

The uncomfortable part is that a gap like this is invisible until someone
checks. Nothing in a rank tracker will show it, because the event happens
outside anything built to track rankings.

BrandGEO asks the questions your buyers actually ask, across ChatGPT, Gemini,
Claude, Perplexity and Google AI Mode, and records who gets named, where in the
answer, and how it describes them.

See whether AI names you at all: https://getbrandgeo.com

The research this is drawn from:
https://getbrandgeo.com/bg-004.html
https://getbrandgeo.com/bg-001.html
```

No hashtag block. The description is written for a person who paused on the
video, and a trailing tag run does not serve that reader. If the channel's
convention requires tags, add them below the links rather than inside the copy.
The two source links are there so the claim in the video is checkable, which is
the point of a contrarian hook: the belief it argues with is common enough that
a viewer will want to see the working.

The description names Gemini, and only Gemini, for the same reason the video
does. It does not repeat `bg-004`'s "three engines" figure, because that page's
engine set includes Copilot in its body and Meta AI in its boilerplate and
cannot be stated correctly. See the sourcing section above.

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
3. `build.sh` composites the silent master and the text-free control, then cuts
   the cover out of the delivered master.
4. `measure_layers.py`, `measure_delivered.py` and `namescan.py` do the
   measurement and compliance passes.

**A new trap, worth adding to the shared list.** The first render of every text
layer came out as a full-frame opaque black rectangle, and it exited 0 with no
warning. `-f lavfi -i color=black@0.0:s=1080x1920` does not survive format
negotiation: the `color` source drops its `@alpha` and lands opaque, so
`format=rgba` then fills alpha with 255 and the layer covers the entire
background when it is overlaid. Method C caught it instantly, because every
layer measured `x 0..1079 y 0..1919` with a drift of exactly `-blockTop`. At
preview scale it would have looked like a black video with no background.

The fix is to zero the alpha explicitly after the format conversion:

```
[0:v]format=rgba,colorchannelmixer=aa=0,drawbox=...,drawtext=...
```

The PNG output also needs `-update 1 -pix_fmt rgba`, or ffmpeg warns about the
image-sequence pattern and can write the layer without an alpha channel at all,
which produces the identical failure one step later.

**The `drawbox` traps, both guarded explicitly.** On a transparent RGBA source
`drawbox` blends rather than writing alpha, so it renders at alpha 0 and the
violet rule silently does not appear. It needs `replace=1`. Separately,
`drawbox` **cannot animate** on 8.1.2: it has no `eval` option and evaluates
`x/y/w/h` once at init, so any time-dependent expression renders frozen at its
t=0 value. Nothing in this build asks it to animate. The rule is drawn as:

```
drawbox=x=448:y=<blockTop>:w=84:h=5:color=0x8B5CF6@1.0:t=fill:replace=1
```

and both the `drift 0` column and the measured stored Y of 122 in all ten scenes
are the evidence it worked.

### Exact command, silent master

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 43.6 -i bg.png \
 -loop 1 -framerate 30 -t 43.6 -i text-1.png \
 -loop 1 -framerate 30 -t 43.6 -i text-2.png \
 -loop 1 -framerate 30 -t 43.6 -i text-3.png \
 -loop 1 -framerate 30 -t 43.6 -i text-4.png \
 -loop 1 -framerate 30 -t 43.6 -i text-5.png \
 -loop 1 -framerate 30 -t 43.6 -i text-6.png \
 -loop 1 -framerate 30 -t 43.6 -i text-7.png \
 -loop 1 -framerate 30 -t 43.6 -i text-8.png \
 -loop 1 -framerate 30 -t 43.6 -i text-9.png \
 -loop 1 -framerate 30 -t 43.6 -i text-10.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1307':y='192*n/1307',format=rgba,setsar=1[bg];\
[1:v]format=rgba,fade=t=out:st=4.70:d=0.3:alpha=1[t1];\
[2:v]format=rgba,fade=t=in:st=5.00:d=0.3:alpha=1,fade=t=out:st=8.90:d=0.3:alpha=1[t2];\
[3:v]format=rgba,fade=t=in:st=9.20:d=0.3:alpha=1,fade=t=out:st=13.90:d=0.3:alpha=1[t3];\
[4:v]format=rgba,fade=t=in:st=14.20:d=0.3:alpha=1,fade=t=out:st=17.70:d=0.3:alpha=1[t4];\
[5:v]format=rgba,fade=t=in:st=18.00:d=0.3:alpha=1,fade=t=out:st=22.10:d=0.3:alpha=1[t5];\
[6:v]format=rgba,fade=t=in:st=22.40:d=0.3:alpha=1,fade=t=out:st=25.50:d=0.3:alpha=1[t6];\
[7:v]format=rgba,fade=t=in:st=25.80:d=0.3:alpha=1,fade=t=out:st=30.30:d=0.3:alpha=1[t7];\
[8:v]format=rgba,fade=t=in:st=30.60:d=0.3:alpha=1,fade=t=out:st=33.90:d=0.3:alpha=1[t8];\
[9:v]format=rgba,fade=t=in:st=34.20:d=0.3:alpha=1,fade=t=out:st=38.90:d=0.3:alpha=1[t9];\
[10:v]format=rgba,fade=t=in:st=39.20:d=0.3:alpha=1[t10];\
[bg][t1]overlay=0:0:format=auto[v1];[v1][t2]overlay=0:0:format=auto[v2];\
[v2][t3]overlay=0:0:format=auto[v3];[v3][t4]overlay=0:0:format=auto[v4];\
[v4][t5]overlay=0:0:format=auto[v5];[v5][t6]overlay=0:0:format=auto[v6];\
[v6][t7]overlay=0:0:format=auto[v7];[v7][t8]overlay=0:0:format=auto[v8];\
[v8][t9]overlay=0:0:format=auto[v9];[v9][t10]overlay=0:0:format=auto[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1308 youtube-silent.mp4
```

`[1:v]` carries no fade in. That is the cover guarantee, not an oversight.

### Exact command, text-free control

Same background chain, same encoder settings, same frame count, no text inputs.
A measurement instrument, not delivered.

```
ffmpeg -y -loglevel error \
 -loop 1 -framerate 30 -t 43.6 -i bg.png \
 -filter_complex "[0:v]crop=1080:1920:x='108-108*n/1307':y='192*n/1307',format=rgba,setsar=1[vout]" \
 -map "[vout]" -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
 -profile:v high -level 4.1 -r 30 -g 60 -movflags +faststart \
 -frames:v 1308 control.mp4
```

### Exact command, scored cut

Pass 1 measured the trimmed and faded audio only:

```
ffmpeg -i assets/audio/music/tension-minor.wav \
 -af "atrim=0:43.6,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,\
afade=t=out:st=42.10:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null -
```

Its output feeds pass 2:

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 \
 -i assets/audio/music/tension-minor.wav \
 -filter_complex "[1:a]atrim=0:43.6,asetpts=N/SR/TB,\
afade=t=in:st=0:d=0.08,afade=t=out:st=42.10:d=1.5,\
loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.64:measured_TP=-4.41:\
measured_LRA=9.00:measured_thresh=-26.78:offset=-0.50:linear=true,\
aresample=48000[aout]" \
 -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
 -movflags +faststart -shortest youtube-scored.mp4
```

### Exact command, cover

```
ffmpeg -y -loglevel error -i youtube-silent.mp4 -frames:v 1 -vf "select=eq(n\,0)" \
 -vsync 0 -update 1 youtube-cover.png
```

---

## Two notes for whoever runs driver #5

**Line width.** Driver #5 is concrete proof, "here is the exact prompt and the
exact answer", and a verbatim prompt is the widest thing this campaign will ever
try to set. This build ended with 123 px in hand at 19 characters of prose; run
3 ended with 72 px at 20 characters containing a ratio. Neither is enough
headroom to absorb a full prompt string on one line at Inter Bold 58. Either
drop that scene to 46 or 48 px, or break the prompt across three lines and
accept the extra beat, and decide it at the copy stage rather than at
measurement.

**The concession is reusable.** Scene 7 of this cut gives the opposing view a
real point before disagreeing, and it costs 4.8 s. Driver #5 does not need that
structurally, but the same move works there as a limits statement: naming what
one prompt on one day does not prove is what makes the answer beside it worth
believing.

---

Nothing was posted, scheduled, uploaded or committed. No git command was run.
Nothing outside
`docs/growth/reel-campaign-ab/run-20260730-0113/youtube/` was written.
