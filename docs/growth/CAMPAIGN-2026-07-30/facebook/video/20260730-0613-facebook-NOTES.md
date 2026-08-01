# Facebook Reel, run 20260730-0613

Built with ffmpeg 8.1.2 directly. Remotion is not installed and nothing was
installed. Nothing here has been posted or scheduled. No git command was run.

| File | What it is |
|---|---|
| `facebook-silent.mp4` | **The upload master.** Zero audio streams, not a muted one. Pair with a track from Facebook's in-app music library. |
| `facebook-scored.mp4` | Identical video bitstream plus the BrandGEO-composed track `tension-minor`. For paid, site embeds and decks. |
| `facebook-cover.png` | 1080x1920 cover. Verified byte-identical to frame 0 of the master. |

---

## Hook driver

**#3, curiosity gap. SECOND PASS, replication round.**

The driver is held constant against run `20260730-0013`. The execution is not,
and separating the two is the point of this run.

**Run 3's spine was ONE CITY, SIX CATEGORIES, TWO EXTREMES.** It asked five
engines the same six questions, then paid the loop off with a contrast pair: a
category where all five converged on the same two names, against one where no
two engines named the same person. The variable under study was the CATEGORY.

**This cut's spine is ONE QUESTION, ASKED TWICE, IN TWO LANGUAGES.** A single
prompt, one city, one collection day, put to AI once in Spanish and once in
English. The variable under study is the LANGUAGE, and the payoff is not a
contrast between two categories but a contradiction inside one question: one
engine went full in English and blank in Spanish, and a second engine did the
same thing pointing the other way. Nothing about run 3's shape is reused. There
is no category comparison, no unanimity claim, no fragmentation claim, no engine
count, and no "same X, same Y, the difference was Z" summary beat.

The loop opens on beat 1 with the setup and the single variable, is held open
through beat 2 while the scene is set, half-paid on beat 3, and turned on beat 4
by the reversal. Beat 5 states what the measurement means, and beat 6 hands the
question to the viewer.

**Facebook-native treatment.** Plain business language, short declaratives, no
category vocabulary. No "GEO", no "AI visibility", no "generative engine
optimization", no imperative stacking, no jargon of any kind. Six beats over 27
seconds. Beat 4 is deliberately only two lines and holds for four seconds, which
is the slowest beat in the cut and the one carrying the turn.

---

## On-screen text, verbatim

These are the exact contents of the `textfile=` targets ffmpeg drew from, one
`drawtext` per line. Nothing else appears on screen except the persistent bottom
lockup and the vertical accent rail.

**Beat 1, 0.000 to 5.000 s.** Fully opaque from frame 0. No fade in, no rise, no
stagger, because this frame is the cover. Fourth line accent violet, Inter
ExtraBold.

```
One question,
put to AI twice.
Once in Spanish.
Once in English.
```

**Beat 2, 5.200 to 9.400 s.** Three lines.

```
Madrid. Hotels
near the airport.
One day in July.
```

**Beat 3, 9.600 to 15.000 s.** Four lines, fourth accent.

```
One engine gave a
full answer in
English. In Spanish,
nothing usable.
```

**Beat 4, 15.200 to 19.200 s.** Two lines, second accent. The turn.

```
Another engine did
the exact reverse.
```

**Beat 5, 19.400 to 23.600 s.** Three lines.

```
One language told
us little about
the other.
```

**Beat 6, 23.800 to 27.000 s.** Three lines, third accent.

```
Have you checked
the other language?
getbrandgeo.com
```

**Persistent, whole runtime:** the icon mark at 68 px plus the wordmark
`BrandGEO` at 72% opacity, bottom left.

md5 of each drawn line file:

```
l0  9d539ff382cccec642066805bc96db73   l10 842fb07296bfab1e7a6c5b15e7bcdce5
l1  2e3a1ceec5ab3c3ca98d20d00941eb4d   l11 4110a6c9d92edc6f65ee6ef5e31423d5
l2  d466266ce5f50f7432cc714dcb60e6ed   l12 a8195ddb9aae28523829d0e6d33121bf
l3  da45f02ba74daae896ddb98034880203   l13 894d9f122cd5fdcf151fd433fa696b14
l4  f88f0b9c2d479244a56d4a087f7cdc1f   l14 fb455036f5edc21ae531fa040ff7e221
l5  63a5d22f95a87815d70450fe272b6730   l15 941d5dfa929b86a7d41a7c6fca89bb3d
l6  e4c216f9986ae60df2e67255768a50c8   l16 081a7771beee03f869156930e2f71f47
l7  86036ef9d3795889a7e1a5ffbaa1036f   l17 d10c02d41ea2ada6f5fd4981dd854e20
l8  e32ad6c5a33d3f33bc06a882a6761e38   l18 670db09066fc98a930bd25ea9f013e83
l9  10903f8a1f1cbb6515c06586333b2ba9   wordmark eeebc7afaffe162c2e6b78f56a757359
```

---

## N-gram diff against run 3

Run on the drawn bytes of both passes, not on the notes or the briefs, per the
brief's rule. Run 3's build scratch is gone, so its rendered lines were harvested
from the verbatim block in
`run-20260730-0013/facebook/NOTES.md`, which states those are the actual rendered
line breaks. **The harvest was cross-checked mechanically:** run 3's `fc.txt`,
reproduced in full in that file, references `textfile=t/l0.txt` through
`t/l18.txt`, 19 distinct line files, and the verbatim block yields exactly 19
lines. The diff asserts that equality and aborts if it fails.

Both token streams are case-folded with punctuation stripped and flattened across
line breaks, so a shared run that straddles two lines cannot hide, which is
exactly how run 8's collision escaped a read-through.

```
run 3 rendered lines : 19  (cross-checked against 19 textfile= refs in its fc.txt)
this run drawn lines : 19
tokens               : run 3 = 50, this run = 54

shared 2-grams : none
shared 3-grams : none
shared 4..9-grams : none
longest shared contiguous token run : 0

shared unigrams : ai, another, getbrandgeo.com, in, one, the
unigrams outside (URL + engine list + function words) : none
exact line collisions : getbrandgeo.com
```

Residual overlap is the URL and five function words. **No engine is named on
screen in either cut**, so even the permitted engine-list overlap is absent here.

### Negative control on the n-gram diff

A diff that reports zero is indistinguishable from one that never ran, so it was
made to fire twice.

| Injection | Result |
|---|---|
| Run 3's `l14` (`The difference was`) substituted for this cut's `l13` | FIRED, longest run 3, exit 1 |
| Run 3's `l9`+`l10` (`In another, no two` / `engines named the`) substituted for `l13`+`l14`, i.e. the exact run-8 failure mode of a seven-word run split across two rendered lines | FIRED, longest run **7**, exit 1 |
| Restored, re-run | longest run 0, exit 0 |

---

## Every figure on screen, and where it was MEASURED

Single source: **`brandgeo/web/ai-visibility-for-madrid.html`**, a published page
on getbrandgeo.com. Original research, **data collected 2026-07-10 through
BrandGEO's own collection pipeline**, the same one paying clients run. Nothing on
screen is third-party. Nothing on screen is illustrative.

| On screen | Claim | Where it was measured |
|---|---|---|
| "One question, put to AI twice." | one prompt, two askings | The page lists the pair: `"¿Qué hotel recomiendan cerca del aeropuerto de Madrid-Barajas?" / "Which hotel is recommended near Madrid-Barajas airport?"`, one asking each |
| "Once in Spanish. / Once in English." | the two askings differed only in language | "4 categories, each asked once in Spanish and once in English" |
| "Madrid. Hotels / near the airport." | city and category | The airport-hotel category, as quoted above |
| "One day in July." | one collection day | "Original research · data collected 2026-07-10" |
| "One engine gave a / full answer in / English. In Spanish, / nothing usable." | one engine, full in English, nothing usable in Spanish | "Gemini returned nothing usable in Spanish but gave a full, real answer in English" |
| "Another engine did / the exact reverse." | a different engine, opposite direction, same prompt | "Meta did the exact opposite on that same prompt: a real answer in Spanish, nothing in English. Both happened on the identical question, in opposite directions, for two different engines." |
| "One language told / us little about / the other." | coverage in one language is not predictive of the other | "your visibility in one language tells you very little about the other" |

### The denominator, checked before anything was written

The Madrid run is one of the pages the brief's warning is about. **ChatGPT's
collection failed on every Madrid prompt that run** with `status: error`, so the
page reports on four engines, not five, and its headline figure is a `4/4`
against a four-engine denominator. The page says so plainly and calls it a data
gap rather than a finding.

**This cut therefore states no engine count at all**, in either direction. "One
engine" and "another engine" are exact, need no denominator, and are unaffected
by a fifth engine having failed to collect. The `4/4` is not used. The
five-engine lineup is not claimed. The engine-lineup scanner enforces this
mechanically: it fails on any `<number> engines` phrase and on any bare `n/m`
ratio in the drawn bytes, and both were confirmed to fire.

### Three things on that page were deliberately NOT used

1. **Its superlatives.** The page asserts "the strongest consensus of any
   category, any city, in this program so far" and "the most unanimous result of
   any city tested so far". Those are claims about every other page in the
   corpus, which the page asserting them cannot confirm, and they are exactly the
   species of claim that reached two rendered cuts on run 5. Nothing superlative
   is on screen and the scanner rejects fifteen superlative patterns.
2. **The engine names.** The two engines that flipped are named on the page. One
   of them is Meta AI, which is retired and on no purchasable plan, so putting it
   on screen would advertise a lineup we do not run. Naming only the other one
   would make the sentence lopsided. Both are described by role instead, which
   costs the claim nothing.
3. **The measured subjects.** Every brand the page names sits inside a result
   set. None appears here. The finding survives without them: "one engine
   answered in English and returned nothing usable in Spanish" carries the same
   weight and cannot be objected to by a party that never agreed to appear.

### Other copy compliance

- No em dashes, no en dashes, no double hyphens.
- No banned vocabulary.
- No percentages and no rates, so the Grok and AI Overviews one-day-sample
  problem cannot arise.
- No universal quantifying over people or businesses. Beat 5 is stated as a
  property of the measurement, not of anyone's behaviour.
- TOFU, soft CTA. A question plus the domain. No pricing, no plan names, no
  trial mechanics, no urgency. The scanner rejects currency, plan names and the
  word "plan".

### One adjudicated rewrite

The first draft of beat 1 read `Only the language / changed.` The superlative
scanner hit `Only`. Per the brief's refinement this is a restrictive describing
one comparison, not a ranking claim and not a quantifier over people, so it would
have been defensible. It was rewritten anyway, to `Once in Spanish. / Once in
English.`, because rewriting cost nothing and the replacement is more concrete.
Flagging the distinction rather than silently applying it, as run 7 did.

---

## Compliance scanner and its negative controls

The scanner reads the `textfile=` targets ffmpeg drew from. It never reads this
file, the brief, or the caption. It exits non-zero on any hit.

**Baseline on the delivered drawn bytes: 0 hits, exit 0.**

Twenty-two injections were run. Each one substitutes a violation into one line
file, runs the scanner, and restores.

| Scan | Injection | Result |
|---|---|---|
| dash | `One day – July.` (U+2013) | FIRED |
| dash | `One day — July.` (U+2014) | FIRED |
| banned-word | `seamless.` | FIRED |
| banned-word | `leverage it.` | FIRED |
| superlative | `the first reverse.` | FIRED |
| superlative | `the most reverse.` | FIRED |
| universal | `nobody knows` | FIRED |
| universal | `every business` | FIRED |
| measured-subject | an airport hotel chain from the Madrid table | FIRED |
| measured-subject | the same name spelled with its umlaut | FIRED |
| measured-subject | the same name spelled without the umlaut | FIRED |
| measured-subject | the same name with `and` for `&` | FIRED |
| measured-subject | a hospital system from the Philadelphia table | FIRED |
| measured-subject | a boutique hotel from the Madrid table | FIRED |
| measured-subject | a subject embedded mid-line rather than alone | FIRED |
| engine-lineup | `Meta AI did` | FIRED |
| engine-lineup | `Five engines did` | FIRED |
| engine-lineup | `4/4 engines did` | FIRED (twice, count and ratio) |
| pricing | `from 99 EUR` | FIRED |
| pricing | `the Growth PRO plan` | FIRED (twice, tier and the word plan) |
| baseline | restored bytes | exit 0 |

### A negative control found a real bug, which is the point of running them

The measured-subject control **`Engel & Volkers` did not fire on the first pass**,
while `Engel & Völkers` did. The corpus spells that subject with an umlaut and the
scanner was matching bytes, so any name typed without its diacritic, or with `and`
for `&`, or with a curly apostrophe, would have walked straight through. The
harvester was matching 484 candidate names from `<td>` cells across every
published research page and would have missed a whole class of them.

Fixed with an NFKD fold that strips combining marks and normalises `&` and
apostrophes on both sides, and all four spelling variants now fire. Every other
control was re-run after the edit to confirm no regression. **A scan that passes
everything is indistinguishable from one that never ran**, and this one was
silently half-broken until it was made to fail on purpose.

---

## Duration, exact ffprobe output on the DELIVERED files

Probed at the final delivery path, not in the build scratch directory.

`facebook-silent.mp4`
```
nb_streams      : 1
format duration : 27.000000
video           : h264 High@4.0, 1080x1920, yuv420p, 30/1 fps, 810 frames,
                  stream duration 27.000000
audio streams   : 0
```

`facebook-scored.mp4`
```
nb_streams      : 2
format duration : 27.000000
video           : h264, 1080x1920, yuv420p, 30/1 fps, 810 frames,
                  stream duration 27.000000, 929 kbps
audio           : aac, 48000 Hz, 2 ch, 1267 frames, stream duration 27.000000,
                  199 kbps
```

**The silent master has zero audio streams**, confirmed directly rather than
inferred from the stream count: `ffprobe -select_streams a -show_entries
stream=index` returns 0 rows.

Both containers report **27.000000 s**. Facebook Reels target band is 20 to 30 s.

The AAC quantisation the brief warns about is present and contained. A raw decode
of the scored cut's audio yields 1,296,384 samples, which is **27.008 s** of
coded audio, because 1267 AAC frames of 1024 samples overshoot the cut.
`-shortest` plus the mp4 edit list trims playback back to 27.000.

Video bitstream identity between the two files, confirmed rather than assumed:

```
facebook-silent.mp4  video stream MD5 = ef75253c57eb0110c45a8b98369d7b3d
facebook-scored.mp4  video stream MD5 = ef75253c57eb0110c45a8b98369d7b3d
```

The scored cut was muxed with `-c:v copy`, so it is the same picture.

---

## Cover, verified against frame 0

Beat 1 hard-starts. `alpha` is a constant 1 until the fade-out at 4.700 s, there
is no per-line stagger, and there is no rise term in the `y` expression. The
accent rail for beat 1 likewise starts at its full 0.9 opacity rather than
stepping up through 0.3 and 0.6 the way later beats do. So frame 0 is a clean,
fully opaque still.

Verified on the delivered files, decoding both to raw RGB24 and hashing:

```
frame 0 of facebook-silent.mp4   md5 aa34fe050363cb476bedc24684ca9a1c  (6,220,800 bytes)
facebook-cover.png               md5 aa34fe050363cb476bedc24684ca9a1c  (6,220,800 bytes)
byte identical                   True
```

And it is not a blank rectangle: the cover carries **53,589 pixels above luma
84**, bounding box `x[100..750] y[676..1380]`, which is the accent rail, four
lines of type and the lockup.

---

## Safe zone verification

Facebook Reels reserves: **220 px top, 440 px bottom, 180 px right.** Usable band
is `y 220..1480` and `x <= 900`.

### The ink threshold, argued from a measured control

A text-free control was rendered through the identical background pipeline with
identical x264 settings, then decoded back **out of the encoded mp4** and
histogrammed over all 810 frames, 1.68 billion pixels:

```
control (background only, decoded from the encoded mp4)
  luma min 8   PEAK 22
  top of the distribution: 22:0.020M  21:2.830M  20:52.180M  19:148.001M
                           17:229.808M  16:298.666M  15:293.553M
```

The background peaks at **22** and dies out there. The dimmest thing deliberately
drawn is the accent violet `#A78BFA`, which the rail renders at a **measured
luma of exactly 144** where it sits at 0.9 over the plate. Body ink `#E8E9ED` is
about 232.

That leaves an empty band from 22 to 144. **Threshold 84 sits in the middle of
it**, 62 levels clear of the background peak and 60 clear of the dimmest ink. A
second pass at **28**, six levels above the measured background peak, was run to
catch antialiased glyph fringes that 84 would drop.

### Method A, absolute threshold, all 810 frames of the delivered file

```
th > 84   union x[100..826]  y[676..1380]
th > 28   union x[100..827]  y[676..1381]

worst frames: right edge 827 @ frame 721, top 676 @ frame 0, bottom 1381 @ frame 0
```

### Method B, per-frame diff against the text-free control

The brief's rule is that a control cancels artefacts it SHARES but cannot cancel
libx264's response to content it does not have, so the threshold has to be
measured, never chosen. The noise floor was taken in three regions that are empty
by design, on the DELIVERED file:

```
noise floor of |delivered - control|
  y 0..599    (above the block) : 4
  x 900..1079 (right band)      : 4
  y 1450..1919 (below)          : 4
  measured floor 4  ->  threshold set to 5
```

All three regions agree at exactly 4, and the threshold was set one level above
it. Four thresholds were swept to show the result is not threshold-dependent:

```
diff >  5   union x[100..827]  y[672..1397]   <- chosen, one above the floor
diff >  6   union x[100..827]  y[672..1390]
diff >  8   union x[100..827]  y[672..1382]
diff > 12   union x[100..827]  y[676..1381]
```

The right edge is **827 at every threshold**, identical to method A at 28 and to
the standalone per-line measurement. That is the number the layout is judged on
and it is stable.

### Method C, declared geometry of dark-on-dark furniture

Pixel methods are blind to anything within about 10 luma of the canvas, and a
control diff shares part of that blind spot. The logo mark is exactly that
element, so its declared rect is folded in explicitly rather than trusted to
measurement:

```
icon mark   overlay x=100 y=1330 at 68x68  ->  rect x[100..167] y[1330..1397]
accent rail beat 1 and 3   drawbox x=100 y=676  w=8 h=408  ->  y[676..1083]
accent rail beat 2, 5, 6   drawbox x=100 y=730  w=8 h=298  ->  y[730..1027]
accent rail beat 4         drawbox x=100 y=786  w=8 h=188  ->  y[786..973]
```

`overlay` rounds an odd `y` DOWN to even on yuv420p. The requested `y=1330` is
already even, so the effective y equals the requested y and the declared rect
needs no correction. Same for the rail: `drawbox` is not subject to that
rounding, and its measured luma confirms the geometry.

**The logo's declared bottom is 1397 and no pixel method reached it.** Method A
sees down to 1380 and method B to 1397 only at the loosest threshold, 1381 at
diff>12. Measured against the declared rect, the pixel methods fall **exactly 17
px short** at frame 0, which is the same figure run 2 hit. The declared rect is
the honest number and it is what is reported.

### Union of all three, against the three reserves

**Union of EVERYTHING drawn**, which is what the platform crops against:

| Edge | Limit | Measured / declared | Headroom | Verdict |
|---|---|---|---|---|
| Top | `y >= 220` | 672 | **452 px** | PASS |
| Bottom | `y <= 1480` | 1397 | **83 px** | PASS |
| Right | `x <= 900` | 827 | **73 px** | PASS |

**Widest TYPE extent**, which is what a copy edit moves. Measured with the rail
column `x 100..107` and the lockup band `y >= 1300` masked out of the frame:

```
beat lines  x[136..827]  y[676..1098]
wordmark    x[219..414]  y[1350..1378]
type union  x[136..827]  y[676..1378]
```

| Edge | Limit | Type extent | Headroom |
|---|---|---|---|
| Top | `y >= 220` | 676 | 456 px |
| Bottom | `y <= 1480` | 1378 | 102 px |
| Right | `x <= 900` | **827** | **73 px** |

**The two boxes differ on three of four edges**, so the layout carries real
headroom information: the union runs 36 px further left (the rail), 4 px further
up (encoder ringing at the rail's upper edge, above the measured floor of 4) and
19 px further down (the logo). **On the right edge they are identical, because
type owns that edge.** That is the intended arrangement. Furniture never binds
the right reserve here, so the safe-zone pass is testing the copy rather than the
progress bar, which is the failure run 2's TikTok build shipped.

The binding constraint on the whole build is one line of type with 73 px. No edge
is under 20 px and none is in single digits.

### Where the methods disagreed, and which was believed

Three disagreements, all resolved toward more ink.

1. **Bottom, 17 px.** A said 1380 at threshold 84 and 1381 at 28. B said 1397 at
   diff>5. The declared logo rect says 1397. The rect and the loosest diff agree
   and the reported figure is 1397, so the stated bottom headroom is 83 px rather
   than the 99 px a threshold pass alone would have claimed.
2. **Top, 4 px.** A said 676, B said 672. 672 is four rows above the rail's
   declared top, is only visible at diff thresholds 5 to 8, and disappears at 12.
   That is libx264 ringing at the edge of a hard-edged bright element, not
   layout. The larger number is reported anyway. It is not load bearing: 452 px
   of headroom either way.
3. **Right, 1 px.** A at 84 said 826, A at 28 and B at every threshold said 827.
   The larger is reported. A one pixel spread says the choice of threshold is not
   load bearing on the edge that matters.

### Line widths were measured before the layout was fixed, not after

Every line was rendered alone at `x=136` and its ink box taken, so the type size
and the line breaks were chosen from measurement rather than corrected after a
failure. Final measured right edges, worst first:

```
body   Inter-SemiBold @ 72   l17 "the other language?"    right 827   <- binding
                             l9  "English. In Spanish,"   right 808
                             l11 "Another engine did"     right 794
                             l7  "One engine gave a"      right 774
accent Inter-ExtraBold @ 78  l12 "the exact reverse."     right 824
                             l18 "getbrandgeo.com"        right 823
                             l3  "Once in English."       right 751
wordmark Inter-Bold @ 40         "BrandGEO"               right 414
```

The first draft of beat 3 read `One engine answered` on one line, which measured
**851, a headroom of 49 px**. That is a pass by the brief's 20 px floor but it is
worse than run 8's 45 px, which the brief calls out as the tightest of its run.
It was treated as a budget failure before anything was rendered and the beat was
re-broken to `One engine gave a / full answer in / English. In Spanish,`, which
moved the longest run off a single line and bought 96 px there. The binding line
is now the CTA question at 73 px.

**Any copy edit that lengthens a line needs this measurement rerun.** The binding
line is `the other language?` and it has 73 px.

### The layout put type on the right edge on purpose

The left furniture is a **vertical accent rail**, `x=100 w=8`, whose height
tracks the beat's line count. It binds the left edge, where there is no reserve,
and nothing else. Text is inset to `x=136` to clear it. That inset costs 36 px of
right headroom against a flush-left layout and it was budgeted for before the
lines were written, not discovered afterwards.

### The drawbox traps, and proof neither fired

**The alpha trap.** On a transparent RGBA source `drawbox` blends instead of
writing alpha, renders at alpha 0 and vanishes with no error. This build removes
the precondition: the plate is forced to `format=rgb24` before any drawing and
the logo overlay is pinned to `format=rgb`, so **no alpha plane exists anywhere
in the draw chain**. `replace=1` is therefore unnecessary and would be wrong,
because the rail's fade is built from stacked boxes at 0.3 / 0.6 / 0.9 / 0.55 /
0.22 that must alpha-blend against the plate.

The positive check is direct rather than inferential. Beat 4's rail is declared
`y 786..973` while its second and last text line ends at ink row 953, so rows
954 to 973 of the rail are the only thing drawn there. At frame 510, `t = 17.000
s`:

```
x 100..107, y 954..973   luma min 144  max 144      the rail, at its predicted value
x  92..99,  y 954..973   luma max  13                background
x 108..130, y 954..973   luma max  13                background
```

A flat 144 across exactly eight columns and nothing either side. The rail is
drawn, at the right width, in the right place, at the right opacity.

**The animation trap.** `drawbox` has no `eval` option on 8.1.2 and evaluates
`x/y/w/h` once at init, so any expression in those fields freezes silently at its
t=0 value. Checked mechanically on `fc.txt`: **zero of the 28 `drawbox`
geometry field groups contain the variable `t`.** Every rail is a static rect
whose only time dependence is `enable`, which is evaluated per frame and does
work. The fade is stacked static boxes on staggered `enable` windows.

### Scene boundaries, plateau centre with a threshold sweep

Frame hashing does not work on encoded H.264, so ink pixels per frame were
counted and the inter-beat plateaus located. The centre of each plateau is taken
with **floor, never round**, because an even-width plateau has no integer centre
and rounding produces a uniform +1 offset on every cut that reads exactly like
timeline drift.

Expected cut centres, from the beat table: frames 153, 285, 453, 579, 711.

```
th> 60   plateau widths [10,10,10,10,10]   centres [153,285,453,579,711]   offsets [0,0,0,0,0]
th> 84   plateau widths [12,12,12,12,12]   centres [153,285,453,579,711]   offsets [0,0,0,0,0]
th>120   plateau widths [16,16,16,16,16]   centres [153,285,453,579,711]   offsets [0,0,0,0,0]
th>150   plateau widths [18,18,18,18,18]   centres [153,285,453,579,711]   offsets [0,0,0,0,0]
```

**20 of 20 boundaries exact across four thresholds.** The plateau WIDTH changes
with the threshold, from 10 frames to 18, and the CENTRE does not move at all,
which is the confirmation the brief prescribes that the detector is measuring the
cut rather than the fade ramp. A sixth plateau appears at the tail on every
threshold; that is the closing fade-out running into the end of the runtime, not
a cut, and it is excluded by construction rather than by eye.

The timeline is a numbered frame sequence at `-framerate 30`. No `ffconcat`, so
no cumulative float drift.

---

## Music

**Track: `tension-minor`**, from `assets/audio/music/tension-minor.wav`.

Original BrandGEO composition, cleared for commercial use including paid ads, no
attribution line required. Nothing was synthesized for this cut and nothing was
downloaded. Held constant across runs on purpose: the hook is the variable under
test, so the bed must not vary with it.

Source is 60.000 s, 48 kHz, 24-bit stereo PCM. Trimmed to the first 27.000 s with
a **0.08 s fade in at t=0** and a **1.5 s fade out starting at 25.500 s**, then
two-pass normalized.

### The fade in

The brief requires it and the source justifies it. Measured directly:

```
tension-minor.wav  sample[0]        = (-0.02516, -0.00577)
                   first 64 samples   abs max 0.06171
                   first 10 ms        abs max 0.11221
```

The first sample is already at 0.025. A hard cut out of digital silence into that
is a step discontinuity and it clicks regardless of where the musical beat falls.

**Verified on the DELIVERED file**, by decoding the audio back out of
`facebook-scored.mp4` after AAC encoding:

```
first 64 samples abs max = 0.002709     (requirement: below 0.005)   PASS
first sample pair        = (0.000126, 0.000116)
first 10 ms  abs max     = 0.01374
overall peak             = 0.60405
last 64 samples abs max  = 0.0000035    (the fade out lands clean too)
```

### Loudness, two-pass

```
pass 1 (measure)   I -16.07   TP -4.41   LRA 3.40   thresh -26.18   offset -1.20
pass 2 (apply)     linear=true, Output Integrated -16.1 LUFS, TP -4.4 dBTP
```

`linear=true` engaged, which matters twice: the required gain is small so the
true peak stays well under the ceiling, and a constant gain cannot distort the
0.08 s fade-in ramp the way dynamic mode would.

Re-measured after AAC encoding, decoding the audio back out of the delivered
`facebook-scored.mp4`:

```
Integrated loudness  I:   -16.0 LUFS   (target -16)
True peak           TP:    -4.4 dBTP   (ceiling -1.5, so 2.9 dB under)
Loudness range     LRA:      3.4 LU
```

### Honest read on how it sounds

I cannot listen to it. What follows is measurement, and someone should audition
it once before it runs anywhere paid.

It is real music rather than a drone, on the two axes a synthesized bed fails on:

- **Stereo.** L and R differ on **100.00%** of samples, channel correlation 0.868.
- **Movement.** Per-second RMS of the delivered audio, dBFS:

```
-21 -21 -22 -21 -20 -16 -16 -17 -16 -17 -16 -17 -15 -16 -17 -16 -17 -16 -16 -16 -15 -16 -15 -16 -14 -15 -26
```

A quiet intro, a lift at second 5, a steady body, a small rise at second 24 and
the fade in the last second are all visible in that row. The lift at second 5
lands on the beat 1 to beat 2 cut without anything being moved to make it, which
is luck rather than design and is worth knowing if the beat timings are ever
changed.

The honest qualification: this 27 s excerpt measures **LRA 3.4 against the parent
60 s track's 6.8**, measured on both files here rather than quoted from an
earlier run. A 27 second window captures part of one section and misses the
arrangement's wider swing, so this cut is calmer than the track it came from.
Fine for a bed under text. Do not quote 6.8 as if it described this file.

**Ship the silent master for the organic post.** Facebook favours audio picked
from its own in-app library.

---

## Technical spec

- 1080x1920, 9:16, 30 fps, H.264 High@4.0, `yuv420p`, `+faststart`, CRF 18,
  preset slow. 810 frames, 27.000 s.
- Background is a generated **PNG** intermediate, never JPEG, so the pipeline
  stays limited-range `yuv420p` and does not pick up the `yuvj420p` shift.
- Background: canvas `#090A0F` with three soft radial glows (`#7C3AED` upper
  left, `#6366F1` right, `#8B5CF6` lower) under a vignette, written by a
  dependency-free node PNG encoder (zlib from node core, hand-rolled CRC32,
  colour type 2). A 4x4 ordered dither is baked in at +/- 0.8 levels because an
  8-bit gradient this size bands visibly without it. Dark only. Plate luma min
  9.3, peak 21.0; peak 22 after encode. `md5(bg.png) =
  fbaf4b399ae185f79911c75fd8e91919`.
- Motion: the plate is generated at 1188x2112 and cropped to 1080x1920 with a
  slow sinusoidal horizontal drift (16 px, 21 s period) and a slow vertical fall
  (22 px over the runtime), so the frame is never static while the type stays
  still. The 10% overscan guarantees the crop never reaches an edge.
- Text ink `#E8E9ED`, accent `#A78BFA`. `#8B5CF6` appears only in the background
  glows and never as text, per the brief's contrast note.
- Type: vendored Inter from `docs/growth/grok-launch/images/_build/fonts/`.
  SemiBold 72 px body, ExtraBold 78 px accent, Bold 40 px wordmark. Nothing
  downloaded, nothing substituted.
- Layout: text left edge `x=136`, line height 110 px, block vertically centred on
  `y=880` so a 2-line beat, a 3-line beat and a 4-line beat share an optical
  centre. Block tops 676 / 730 / 786 for 4 / 3 / 2 lines.
- Furniture: vertical accent rail `x=100 w=8`, height tracking the beat's line
  count. Logo `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`
  scaled to 68 px at `x=100 y=1330`; wordmark at `x=216 y=1350`, 72% opacity.
- Motion per line: 0.36 s fade in, 18 px rise over 0.50 s, 0.14 s stagger between
  lines within a beat, 0.30 s fade out. Beat 1 has none of these.

---

## Exact commands

Working directory is the build scratch dir, holding `bg.png`, `logo.png`,
`fonts/` (copied from the vendored Inter), `t/` (one file per rendered line),
`fc.txt` and `fc_ctrl.txt`. Relative paths throughout, deliberately, to avoid
escaping the drive-letter colon inside filtergraph options.

### 1. Background PNG

```sh
node bg.js bg.png      # dependency-free PNG writer, 1188x2112 rgb24
```

### 2. Silent master

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 27 -i bg.png \
  -loop 1 -framerate 30 -t 27 -i logo.png \
  -/filter_complex fc.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 -movflags +faststart \
  facebook-silent.mp4
```

### 3. Text-free control, for the threshold and for method B

Identical encode, background only.

```sh
ffmpeg -y \
  -loop 1 -framerate 30 -t 27 -i bg.png \
  -/filter_complex fc_ctrl.txt \
  -map "[v]" -an \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -r 30 -g 60 control.mp4
```

where `fc_ctrl.txt` is

```
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+16*sin(2*PI*t/21)':y='(in_h-out_h)/2+22*(t/27.0)',format=rgb24,format=yuv420p[v]
```

### 4. Music, trim, fade in and out, two-pass loudnorm

```sh
ffmpeg -y -t 27 -i ../../../../../assets/audio/music/tension-minor.wav \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=25.5:d=1.5" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_cut.wav

# pass 1, measure
ffmpeg -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values linearly
ffmpeg -y -i music_cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11:\
measured_I=-16.07:measured_TP=-4.41:measured_LRA=3.40:measured_thresh=-26.18:\
offset=-1.20:linear=true:print_format=summary" \
  -c:a pcm_s24le -ar 48000 -ac 2 music_norm.wav
```

### 5. Scored cut

Video is copied, not re-encoded.

```sh
ffmpeg -y -i facebook-silent.mp4 -i music_norm.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest \
  facebook-scored.mp4
```

### 6. Cover

```sh
ffmpeg -y -i facebook-silent.mp4 -vf "select=eq(n\,0)" -frames:v 1 -c:v png \
  facebook-cover.png
```

### 7. The filtergraph, `fc.txt`

48 draw operations: 28 `drawbox` (the six rails, each built from three to five
stacked static boxes on staggered `enable` windows, because `drawbox` takes no
alpha expression and cannot animate) and 20 `drawtext` (19 beat lines plus the
wordmark). Beat 1 has no fade in, no stagger and no rise, so frame 0 is a clean
fully-opaque still that doubles as the cover. Text is passed by file rather than
inline so commas inside a line need no filtergraph escaping.

`md5(fc.txt) = 0467183f52310eb61eea1aaa3ed61249`. Newlines below sit only at
filter boundaries and are cosmetic.

```
[1:v]scale=68:68[lg];
[0:v]scale=1188:2112,crop=1080:1920:x='(in_w-out_w)/2+16*sin(2*PI*t/21)':y='(in_h-out_h)/2+22*(t/27.0)',format=rgb24[bg];
[bg][lg]overlay=x=100:y=1330:format=rgb[bgl];
[bgl]drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.9:t=fill:enable='between(t\,0.000\,4.700)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.55:t=fill:enable='between(t\,4.700\,4.850)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.22:t=fill:enable='between(t\,4.850\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l0.txt:x=136:y=676:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.700)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.3\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l1.txt:x=136:y=786:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.700)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.3\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l2.txt:x=136:y=896:fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,4.700)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.3\,0))':enable='between(t\,0.000\,5.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l3.txt:x=136:y=1006:fontsize=78:fontcolor=0xA78BFA:alpha='if(lt(t\,4.700)\,1\,if(lt(t\,5.000)\,(5.000-t)/0.3\,0))':enable='between(t\,0.000\,5.000)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.3:t=fill:enable='between(t\,5.200\,5.380)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.6:t=fill:enable='between(t\,5.380\,5.560)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.9:t=fill:enable='between(t\,5.560\,9.100)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.55:t=fill:enable='between(t\,9.100\,9.250)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.22:t=fill:enable='between(t\,9.250\,9.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l4.txt:x=136:y='730+18*(1-min(1\,max(0\,(t-5.200))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.200)\,0\,if(lt(t\,5.560)\,(t-5.200)/0.36\,if(lt(t\,9.100)\,1\,if(lt(t\,9.400)\,(9.400-t)/0.3\,0))))':enable='between(t\,5.200\,9.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l5.txt:x=136:y='840+18*(1-min(1\,max(0\,(t-5.340))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.340)\,0\,if(lt(t\,5.700)\,(t-5.340)/0.36\,if(lt(t\,9.100)\,1\,if(lt(t\,9.400)\,(9.400-t)/0.3\,0))))':enable='between(t\,5.340\,9.400)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l6.txt:x=136:y='950+18*(1-min(1\,max(0\,(t-5.480))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,5.480)\,0\,if(lt(t\,5.840)\,(t-5.480)/0.36\,if(lt(t\,9.100)\,1\,if(lt(t\,9.400)\,(9.400-t)/0.3\,0))))':enable='between(t\,5.480\,9.400)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.3:t=fill:enable='between(t\,9.600\,9.780)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.6:t=fill:enable='between(t\,9.780\,9.960)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.9:t=fill:enable='between(t\,9.960\,14.700)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.55:t=fill:enable='between(t\,14.700\,14.850)',
drawbox=x=100:y=676:w=8:h=408:color=0xA78BFA@0.22:t=fill:enable='between(t\,14.850\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l7.txt:x=136:y='676+18*(1-min(1\,max(0\,(t-9.600))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,9.600)\,0\,if(lt(t\,9.960)\,(t-9.600)/0.36\,if(lt(t\,14.700)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.3\,0))))':enable='between(t\,9.600\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l8.txt:x=136:y='786+18*(1-min(1\,max(0\,(t-9.740))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,9.740)\,0\,if(lt(t\,10.100)\,(t-9.740)/0.36\,if(lt(t\,14.700)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.3\,0))))':enable='between(t\,9.740\,15.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l9.txt:x=136:y='896+18*(1-min(1\,max(0\,(t-9.880))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,9.880)\,0\,if(lt(t\,10.240)\,(t-9.880)/0.36\,if(lt(t\,14.700)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.3\,0))))':enable='between(t\,9.880\,15.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l10.txt:x=136:y='1006+18*(1-min(1\,max(0\,(t-10.020))/0.5))':fontsize=78:fontcolor=0xA78BFA:alpha='if(lt(t\,10.020)\,0\,if(lt(t\,10.380)\,(t-10.020)/0.36\,if(lt(t\,14.700)\,1\,if(lt(t\,15.000)\,(15.000-t)/0.3\,0))))':enable='between(t\,10.020\,15.000)',
drawbox=x=100:y=786:w=8:h=188:color=0xA78BFA@0.3:t=fill:enable='between(t\,15.200\,15.380)',
drawbox=x=100:y=786:w=8:h=188:color=0xA78BFA@0.6:t=fill:enable='between(t\,15.380\,15.560)',
drawbox=x=100:y=786:w=8:h=188:color=0xA78BFA@0.9:t=fill:enable='between(t\,15.560\,18.900)',
drawbox=x=100:y=786:w=8:h=188:color=0xA78BFA@0.55:t=fill:enable='between(t\,18.900\,19.050)',
drawbox=x=100:y=786:w=8:h=188:color=0xA78BFA@0.22:t=fill:enable='between(t\,19.050\,19.200)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l11.txt:x=136:y='786+18*(1-min(1\,max(0\,(t-15.200))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,15.200)\,0\,if(lt(t\,15.560)\,(t-15.200)/0.36\,if(lt(t\,18.900)\,1\,if(lt(t\,19.200)\,(19.200-t)/0.3\,0))))':enable='between(t\,15.200\,19.200)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l12.txt:x=136:y='896+18*(1-min(1\,max(0\,(t-15.340))/0.5))':fontsize=78:fontcolor=0xA78BFA:alpha='if(lt(t\,15.340)\,0\,if(lt(t\,15.700)\,(t-15.340)/0.36\,if(lt(t\,18.900)\,1\,if(lt(t\,19.200)\,(19.200-t)/0.3\,0))))':enable='between(t\,15.340\,19.200)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.3:t=fill:enable='between(t\,19.400\,19.580)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.6:t=fill:enable='between(t\,19.580\,19.760)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.9:t=fill:enable='between(t\,19.760\,23.300)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.55:t=fill:enable='between(t\,23.300\,23.450)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.22:t=fill:enable='between(t\,23.450\,23.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l13.txt:x=136:y='730+18*(1-min(1\,max(0\,(t-19.400))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,19.400)\,0\,if(lt(t\,19.760)\,(t-19.400)/0.36\,if(lt(t\,23.300)\,1\,if(lt(t\,23.600)\,(23.600-t)/0.3\,0))))':enable='between(t\,19.400\,23.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l14.txt:x=136:y='840+18*(1-min(1\,max(0\,(t-19.540))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,19.540)\,0\,if(lt(t\,19.900)\,(t-19.540)/0.36\,if(lt(t\,23.300)\,1\,if(lt(t\,23.600)\,(23.600-t)/0.3\,0))))':enable='between(t\,19.540\,23.600)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l15.txt:x=136:y='950+18*(1-min(1\,max(0\,(t-19.680))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,19.680)\,0\,if(lt(t\,20.040)\,(t-19.680)/0.36\,if(lt(t\,23.300)\,1\,if(lt(t\,23.600)\,(23.600-t)/0.3\,0))))':enable='between(t\,19.680\,23.600)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.3:t=fill:enable='between(t\,23.800\,23.980)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.6:t=fill:enable='between(t\,23.980\,24.160)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.9:t=fill:enable='between(t\,24.160\,26.700)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.55:t=fill:enable='between(t\,26.700\,26.850)',
drawbox=x=100:y=730:w=8:h=298:color=0xA78BFA@0.22:t=fill:enable='between(t\,26.850\,27.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l16.txt:x=136:y='730+18*(1-min(1\,max(0\,(t-23.800))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,23.800)\,0\,if(lt(t\,24.160)\,(t-23.800)/0.36\,if(lt(t\,26.700)\,1\,if(lt(t\,27.000)\,(27.000-t)/0.3\,0))))':enable='between(t\,23.800\,27.000)',
drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=t/l17.txt:x=136:y='840+18*(1-min(1\,max(0\,(t-23.940))/0.5))':fontsize=72:fontcolor=0xE8E9ED:alpha='if(lt(t\,23.940)\,0\,if(lt(t\,24.300)\,(t-23.940)/0.36\,if(lt(t\,26.700)\,1\,if(lt(t\,27.000)\,(27.000-t)/0.3\,0))))':enable='between(t\,23.940\,27.000)',
drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=t/l18.txt:x=136:y='950+18*(1-min(1\,max(0\,(t-24.080))/0.5))':fontsize=78:fontcolor=0xA78BFA:alpha='if(lt(t\,24.080)\,0\,if(lt(t\,24.440)\,(t-24.080)/0.36\,if(lt(t\,26.700)\,1\,if(lt(t\,27.000)\,(27.000-t)/0.3\,0))))':enable='between(t\,24.080\,27.000)',
drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=t/wordmark.txt:x=216:y=1350:fontsize=40:fontcolor=0xE8E9ED:alpha='0.72',format=yuv420p[v]
```

---

## Suggested feed caption

Not posted. Provided for review alongside the video.

> On 10 July we ran four Madrid categories through our own collection pipeline,
> the same one paying clients use. Each category was put to AI twice, once in
> Spanish and once in English, so the only thing that moved between the two runs
> was the language of the question.
>
> Take the airport hotel question. One engine returned a full, real answer in
> English and nothing usable in Spanish. A second engine did the exact opposite
> on the identical prompt: a real answer in Spanish, nothing in English.
>
> Two engines. One question. Opposite directions.
>
> So there is no rule of thumb here. Coverage is specific to the engine and to
> the exact query, which means what you can see in one language tells you very
> little about what a customer sees in the other.
>
> The full Madrid study is on our site, alongside Berlin, Paris and Rome, which
> were tested the same way.
>
> getbrandgeo.com

---

## Open items for whoever reviews this

1. **Audition `facebook-scored.mp4`.** The music has been measured, not heard.
   The first-64-sample check confirms the click is gone (0.0027 against a 0.005
   limit) but that is a number, not an ear. The 27 s excerpt measures LRA 3.4
   against the parent track's 6.8, so it is calmer than the source.
2. **`RUN.md` for run 20260730-0613 has not been written.** The brief asks each
   run to record its hook driver in `run-<stamp>/RUN.md`, which sits one level
   above this folder and outside this task's write scope. Driver **#3, curiosity
   gap, second pass**, track `tension-minor`, for this run.
3. **The Madrid source is a four-engine page and that is disclosed, not hidden.**
   ChatGPT's collection errored across every Madrid prompt on 2026-07-10, so the
   page's own `4/4` sits on a four-engine denominator. This cut states no count,
   which is what makes it safe, but a reviewer should know the underlying page is
   one of the ones the brief's denominator warning is about. If a future cut
   wants a count from Madrid, the run needs re-collecting first.
4. **A negative control found a live bug in the measured-subject scanner.** It
   was matching raw bytes, so a name typed without its diacritic would have
   passed. Fixed here with a Unicode fold. **Any other agent carrying a copy of
   that scanner has the same bug** and should apply the same fix, because the
   corpus contains several names with diacritics and ampersands.
5. **The binding safe-zone constraint is `the other language?` at 73 px of right
   clearance**, set by type rather than by furniture. Any copy edit that
   lengthens a line needs the per-line measurement rerun. The threshold
   justification, both pixel methods, the measured noise floor and the
   declared-rect method are all documented above.
6. **The 36 px inset that the vertical rail costs is a standing design decision.**
   Text sits at `x=136` rather than `x=100` so the rail has room. That is 36 px
   of right headroom spent on furniture. It was budgeted before the lines were
   written and it is worth confirming that trade is wanted, because reverting to
   a horizontal rule above the block would return the copy to 109 px.
