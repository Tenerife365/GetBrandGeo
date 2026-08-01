# Instagram Reel, run 20260730-0513

**Hook driver:** #2, status threat. **Second pass.** Run `20260729-2318` was the
first status-threat build; this is the same driver executed a deliberately
different way, so that if the driver performs we can tell whether it was the
DRIVER or that particular CUT.

**Spine: MISDESCRIPTION.** You are named. The sentence attached to your name was
written by something that never asked you. The status loss is authorship of your
own positioning, not occupancy of a slot.

---

## How this differs from run 2, and why

Run 2's spine, on all four platforms, was **OCCUPANCY**: a rival stands in a
singular position and a default repeats itself. Instagram's version ran
`Your category already has a default answer.` into `It names one brand first.` /
`That brand is not you.` and turned on `They did not outrank you. They became the
answer.`, closing on `A default gets harder to move every week.`

None of that is reused. Seven differences, each deliberate:

1. **The loss is a different loss.** Run 2's loss is *absence from a position*.
   This one's loss is *presence in the wrong words*. The two are separable in the
   product as well as in the writing: `ai_results` stores `brand_mentioned`
   independently of `response_snippet` and `sentiment`, so being listed and being
   described are literally different columns. The brief offered this shape and it
   is the one taken.
2. **No rival appears anywhere.** Run 2's cut is built on a third party: `They`,
   `That brand`, `one brand at the top`. There is no rival in this cut at all.
   The antagonist is the wording itself. That removes the comparative frame
   entirely, which is what made run 2 legible as an SEO complaint's cousin.
3. **The rhetorical device is not the same.** Run 2 turned on a negation of the
   expected loss followed by a reframe (`did not outrank` → `became the answer`).
   That device is banned here. This cut turns by **relocation**: scene 4 moves the
   sentence physically in front of the homepage (`That line sits / in front of /
   your homepage.`) rather than contrasting it with an expectation.
4. **Grammatical subjects.** Run 2's subjects are `Your category`, `It`, `They`,
   `That brand`, `Every answer`, `A default`. Here the recurring subject is a
   piece of text: `An AI answer`, `It` (the line), `That line`, `the wording`,
   `They` (the engines, only once they have been named). The viewer is never the
   grammatical subject except in the CTA.
5. **No ranking vocabulary.** Run 2 leaned on `first`, `at the top`, `Only one`.
   This cut contains no ordinal, no rank, no `top`, and nothing that could be
   read as a claim about position. The compliance scan enforces it.
6. **The engine block is a different object.** Run 2 set five engines as a
   five-line vertical roll call at Medium 62 under `WHO THEY NAME FIRST`, i.e. as
   a *scoreboard*. Here they run on as **two lines** at Medium 50 under `WHO IS
   WRITING IT`, i.e. as a *list of authors*. The kicker changes the list from
   something that judges you into something that writes about you.
7. **Shape and cadence.** Run 2: 7 scenes over 28.000 s, no kicker on the cover.
   This: **8 scenes over 28.500 s**, the cover carries a kicker, and there is a
   product scene naming its own narrow claim (`Not just whether / you appear.`)
   before the CTA, which run 2 had no equivalent of.

Held constant on purpose, because they are not the variable: the music, the
1080x1920 canvas, the violet rail, the logo card at (130,282), the progress bar
at y=1438 w=670, the 18 px settle, and the block centre at y=880. Changing
furniture between runs would make the cross-run ink boxes incomparable for no
experimental gain.

**Honest limit on what this run can prove.** It separates driver from execution
only if run 2 and run 7 are both measured on the same surface with the same
audience. It does not separate driver from *shape of loss*: "occupancy" and
"misdescription" are two different arguments, not two phrasings of one, so a
divergence between the two cuts is attributable to either the execution or to
which sub-thesis of status threat was chosen. That is the price of making them
genuinely different, and it is worth paying, because two near-identical cuts
would have tested nothing at all.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows; `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 4,633,713 bytes, scored 5,364,142 bytes, cover 293,652 bytes.

Naming follows runs 1 to 7 (`-scored`, not the brief's older `-bed.mp4`, which
dates from when the fallback was a synthesized `sine` bed).

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=130. Each block is vertically centred on y=880, the centre of the 220..1500
visible band.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282), the wordmark
`BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a progress
bar at y=1438.

**0.00 to 4.30 s**, kicker Inter SemiBold 38 accent `#A78BFA`, body Bold 74 ink
`#E8E9ED`, close ExtraBold 70 accent. Hard in at full opacity, no fade up and no
y-settle, because this frame is the cover.
```
THE SENTENCE ON YOUR NAME

Getting named
is the easy part.

The wording
is the risk.
```

**4.30 to 7.90 s**, body Bold 72 ink, close ExtraBold 68 accent
```
An AI answer
carries one line
about your brand.

You did not
write it.
```

**7.90 to 11.50 s**, body Bold 72 ink, close ExtraBold 68 accent
```
It was assembled
from what other
pages say.

Your own site
is one source
in that.
```

**11.50 to 15.10 s**, body Bold 72 ink, close ExtraBold 68 accent. This is the turn.
```
That line sits
in front of
your homepage.

A buyer meets it
before they
meet you.
```

**15.10 to 19.10 s**, kicker SemiBold 38 accent, list Medium 50 ink, close
ExtraBold 64 accent
```
WHO IS WRITING IT

ChatGPT. Gemini. Claude.
Perplexity. Google AI Mode.

Each writes
its own.
```

**19.10 to 22.50 s**, body Bold 72 ink, close ExtraBold 68 accent
```
They do not check
the wording
with you.

It is already
in circulation.
```

**22.50 to 25.60 s**, body Bold 70 ink, close ExtraBold 64 accent
```
BrandGEO reads
what they say
about you.

Not just whether
you appear.
```

**25.60 to 28.50 s**, body Bold 72 ink, URL SemiBold 54 accent. Fades in only, so
it holds to the final frame.
```
See how AI
describes your
brand.

getbrandgeo.com
```

---

## Every claim on screen, and where it comes from

No figure appears anywhere in this cut, so no number needs provenance. What is
left is a set of structural claims about how generative answers work, and each
one is checkable without a measurement.

| Line | What kind of claim | Basis |
|---|---|---|
| `Getting named is the easy part. / The wording is the risk.` | An assertion about which of two things carries more exposure. Not a measurement, not a comparison of parties. | The product distinguishes them: `ai_results.brand_mentioned` is a separate column from `response_snippet` and `sentiment`. |
| `An AI answer carries one line about your brand.` | Structural. Generative answers emit prose, not only a list. | `collect-*.js` store a ~300 char `response_snippet` around the first brand mention precisely because the surrounding prose exists. |
| `It was assembled from what other pages say. / Your own site is one source in that.` | Structural, and deliberately hedged in the true direction. It does NOT claim your site is excluded. | Web-grounded engines cite third-party pages alongside first-party ones. Saying "one source in that" concedes the site is an input, which is the accurate version. |
| `That line sits in front of your homepage.` | Spatial, about where the text is rendered. Not a behavioural claim about readers, and not a claim that anyone is stopped. | An answer is displayed; the site is a click away from it. |
| `A buyer meets it before they meet you.` | Singular and illustrative, deliberately not `buyers` or `everyone`. | Follows from the line above. Stated about one reader so it quantifies over nobody. |
| `ChatGPT. Gemini. Claude. Perplexity. Google AI Mode.` | An engine lineup, not a finding. | Exactly `PLAN_ENGINES.growth` in `brandgeo-dashboard/src/lib/planConfig.ts`: `chatgpt`, `gemini`, `claude`, `perplexity`, `google_ai`. Read from the code, not from a research page. |
| `Each writes its own.` | Independence, not difference. It does not assert that the five disagree, which would need evidence. | Five separate systems produce five separate outputs. |
| `They do not check the wording with you. / It is already in circulation.` | Structural. | No engine solicits approval from a named brand before answering. |
| `BrandGEO reads what they say about you. / Not just whether you appear.` | Product claim, narrow and true. | `analyseResponse` returns `sentiment`, `response_snippet` and `competitors_mentioned` alongside `brand_mentioned`. |

### Sources deliberately not used

- **`bg-005.html`'s 48% and 93%.** Third-party figures sitting inside a page that
  is otherwise ours. They pass a naive "traces to a bg page" test and trace to no
  BrandGEO measurement. Not used, and the cut carries no percentage at all.
- **`bg-016.html`.** Excluded by instruction.
- **Any engine count from `bg-004.html`, and the phrase "27 cities".** Excluded by
  instruction. `bg-004`'s lineup names Microsoft Copilot, which is not today's
  Growth five, so a count skimmed from it would be wrong anyway.
- **`ai-visibility-for-chicago.html`.** Its "first fully unanimous result measured
  anywhere in this research program" is a superlative, it contradicts
  `ai-visibility-for-boston.html` collected the same day, and that page is filed
  as a defect. Nothing from it appears.
- **City x/4 denominators.** Some city figures are out of four rather than five
  because an engine failed to collect. Since no figure appears at all, the trap
  does not arise, but it is the reason the misdescription shape was chosen with
  **no number attached to it**, per the instruction.
- **Grok and AI Overviews rates.** Five and six rows from one day. Nothing on
  screen, in any form.

---

## Compliance check, run mechanically on the DRAWN BYTES

`scan.py` parses `filtergraph.txt`, extracts every path named by a `textfile=`
option, reads those files, and exits non-zero on any hit. It never reads the
brief, the copy source, or this document. An instruction is not evidence of what
shipped, so the check runs on what ffmpeg actually opened.

```
strings drawn: 42   characters: 603

1. em/en dash and non-ascii                                   ok
2. banned vocabulary (16 forms)                               ok
3. superlatives / ranking claims (19 forms)                    ok
4. universals quantifying over people (28 forms)              ok
5. digits / figures / prices                                  ok
6. measured subjects   pages 80   raw 3548   name-shaped 1728 ok

RESULT: PASS   (exit 0)
```

### One rewrite the scanner forced, and one note it raised

**`Not only whether you appear.` was rewritten to `Not just whether you
appear.`** The scanner hit `only`. It is the adverb in a `not only` construction,
not a ranking claim, so this is the same class of hit that run 7's Facebook agent
flagged on `first`. The rule is kept strict rather than taught to distinguish
them, and the copy was changed because changing it cost nothing. The brief's
safest default holds: do not put a superlative on screen at all.

**Two `NOTE` lines on the word `one`**, in `carries one line` and `is one
source`. Left in deliberately. Both are determiners meaning "a single", describing
the structure of an answer; neither is a count of anything measured, neither has
a denominator, and neither is framed as a result. The scanner reports them rather
than failing on them, which is the correct behaviour for a word whose reading
depends on grammar.

### The measured-subject scan needed two real fixes, not two exceptions

The scan harvests capitalised spans from all 80 published pages under
`brandgeo/web/` and looks for any of them inside the drawn strings. Its first run
returned **34 hits**, every one of them a false positive: `That`, `Your`, `Each`,
`Buyer`, `Answer`. Ordinary words that happen to start a sentence somewhere in the
corpus.

Both fixes are mechanical filters, and **nothing is exempted by hand**:

1. **A token that also occurs lowercase somewhere in the corpus is an ordinary
   word, not a name.** `cleveland` essentially never appears lowercase; `answer`
   always does. This alone removed 32 of the 34.
2. **`An AI` and `WITH` survived that filter for two separate reasons and both
   were bugs.** The lowercase-token harvester required a minimum length of three
   characters, so `an` and `ai` were never collected as lowercase words and
   therefore looked name-like; and the "internal capital" test treated ALL-CAPS
   `WITH` as camel-case. Fixing the minimum length to one character and requiring
   an internal capital to co-occur with a lowercase letter closed both.

**A negative control was then run, because a scanner that passes everything is
indistinguishable from a scanner that works.** A real measured subject harvested
from `ai-visibility-for-chicago.html` was substituted into one drawn string:

```
FAIL [measured-subject] 'Landmark Property Management' in (drawn blob):
  'e how ai\ndescribes your\nlandmark property management\ngetbrandgeo.com'
```

It fires. The string was restored and the scan re-run to exit 0.

### The removal test

Five third-party names appear: ChatGPT, Gemini, Claude, Perplexity, Google AI
Mode. All five are the **instrument being measured**, which the brief allows. The
test is whether the claim survives their removal. `Each writes its own.` does not
survive: without the list there is nothing for `each` to refer to, so the product
becomes undescribable. No measured subject appears: no company, firm, person or
client that turned up inside a result set is named anywhere.

---

## Duration

`ffprobe` on the delivered files, not assumed. A mux can exit 0 and be
unreadable, so both were probed before the render was called done.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **28.500000 s** | 855 frames @ 30/1, `duration_ts=437760 / 15360`, H.264 High, `yuv420p`, 1080x1920 | **none. `nb_streams=1`** |
| `instagram-scored.mp4` | **28.500000 s** | 855 frames, identical stream (MD5 match) | AAC LC, `duration_ts=1368000 / 48000` = 28.500000 s |

28.500 s sits inside the 20 to 30 s Instagram band.

The AAC drift warning was measured rather than assumed: decoding the delivered
scored audio yields **1,368,064 samples = 28.501333 s**, so 64 samples of encoder
padding exist as packet payload past the cut. The mp4 sample table caps the track
at `duration_ts=1368000`, exactly 28.500000 s, so the padding is never played.
`-shortest` is what holds that line.

PNG intermediates only. No JPEG anywhere in the chain, so no `yuvj420p` range
shift.

### The timeline is frame-indexed, and nothing is concatenated

No `ffconcat`. Every scene gate is `enable='between(n,a,b)'` on integer frame
indices computed once from the scripted times, and the whole clip is one 855
frame render at `-r 30`. There is no cumulative float duration anywhere that
could drift a cut past a frame edge.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 855 frames**, sequentially, no `-ss` and no seeking anywhere,
reduced to a global extreme. Two independent methods, plus declared geometry
folded in explicitly.

### The type-width probe ran BEFORE the master

All 41 strings were rendered alone at their final font and size and measured, so
the right reserve was checked before 35 seconds of encoding rather than after.

The first pass failed the spirit of the reserve rather than its letter:

```
FIRST PASS
  widest string : 'Perplexity. Google AI Mode.'  Inter-Medium 56  ->  x = 868
  limit x <= 900                                  HEADROOM = 32 px
```

32 px clears the brief's 20 px floor and is still a bad idea, for the same reason
run 1's 1 px TikTok pass was: one copy edit destroys it, and the engine list is
the line most likely to change when the lineup changes. The engine list was re-set
from Medium 56 to **Medium 50** and re-probed:

```
SECOND PASS
  widest string : 'Perplexity. Google AI Mode.'  Inter-Medium 50  ->  x = 789
  next widest   : 'They do not check'            Inter-Bold 72    ->  x = 776
  limit x <= 900                                  HEADROOM = 111 px   (floor 20)
```

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays, same
noise seed (`all_seed=20260730`), no logo, no rails, no bar, no type.

```
control peak luma, whole frame            39.7
control peak luma, copy band y400..1400   35.9
delivered peak luma, x >= 940 (empty)     37.9
```

Drawn colours, Rec.709 luma:

| Element | Colour | Luma |
|---|---|---|
| Body and list type | `#E8E9ED` | 232 |
| Accent type | `#A78BFA` | 157 |
| Progress fill | `#8B5CF6` | 113 |
| Left rail, pre-blended | `#3D2B6B` | 51 |
| Progress track, pre-blended | `#2A2C38` | **44** |

The gap between the background peak (39.7) and the dimmest *bright* element is
wide, so thresholds of 45, 60, 90 and 120 all sit inside it. **The progress track
at luma 44 is 4 above the background peak and is not separable by any threshold.**
That is why method B exists and why declared geometry is folded in on top of it.

### The diff threshold was set above a MEASURED noise floor

A control cancels artefacts it shares; it cannot cancel the encoder's response to
content it does not have. So the floor was measured in three regions that are
empty by design in the delivered file:

```
x>=940     max channel diff = 10
y>=1520    max channel diff = 11
y<=260     max channel diff = 10
  -> noise floor 11; the threshold must sit ABOVE it
```

The sweep then shows exactly where the floor bites:

```
diff >  3 : y    0..1919  x    0..1079    <-- below the floor, whole frame
diff >  5 : y    0..1919  x    0..1079    <-- below the floor, whole frame
diff >  8 : y   37..1919  x    7..1079    <-- below the floor
diff > 10 : y  281..1697  x   94.. 800    <-- BELOW the floor (11); y=1697 is noise
diff > 12 : y  282..1445  x   96.. 800        <-- CHOSEN, lowest above the floor
diff > 14 : y  282..1445  x   96.. 799
diff > 18 : y  282..1444  x   96.. 799
diff > 24 : y  282..1443  x   96.. 799
```

Thresholds 12 through 24 differ by at most 2 px on any edge. That plateau, not the
single number, is the evidence. Note the row at 10: it sits one below the measured
floor and immediately invents 252 px of phantom ink at the bottom (`y=1697`, where
nothing is drawn). Picking a diff threshold by eye is exactly how run 5's Facebook
build produced a false failure on every edge.

### Method B, per-pixel diff against the control (authoritative)

```
GLOBAL INK BOX, union of everything drawn, 855 frames, diff > 12:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  800    limit <=  900    margin +100 px
  left   x =   96    (no left reserve specified)
```

### The control is not optional, demonstrated again

Run purely to show that the failure of a flat-canvas diff is total rather than
confined to the frame edge:

```
control (NOTHING IS DRAWN ON IT) diffed vs the FLAT nominal canvas rgb(9,10,15)
  -> ink box  y 0..1919   x 0..1079      the whole frame
```

Two soft full-frame glows plus the dither pass mean essentially no pixel equals
the nominal canvas value. Only a control cancels that, because it carries the same
glows, the same dither seed and the same codec.

### Method A, absolute luma threshold (cross-check)

```
luma >  45 : y  301..1442  x   96..799   top +81  bottom +58  right +101
luma >  60 : y  301..1442  x  130..799   top +81  bottom +58  right +101
luma >  90 : y  301..1442  x  130..799   top +81  bottom +58  right +101
luma > 120 : y  302..1442  x  130..788   top +82  bottom +58  right +112
```

Per the brief, the method finding MORE ink is trusted, and that is B on all three
edges. Every difference is explained rather than waved at:

- **Top, 282 vs 301.** 19 px. The logo card is drawn at y=282 and its rounded
  corners are near-black, so a luma threshold cannot see the top of it. B can. The
  binding number is **282**.
- **Bottom, 1445 vs 1442.** The bar is drawn at y=1438 h=5, so its last lit row is
  1442; B picks up 3 rows of encoder bleed. The binding number is **1445**.
- **Right, 800 vs 799.** The progress fill is drawn to x=799 exactly; B picks up
  1 px of its antialiased and compressed edge. Method A at 120 reports 788 because
  it has already lost that edge; the lower thresholds, which can still see it,
  agree with the drawn geometry.

### Declared geometry, folded in explicitly

Per the brief's blind-spot rule, every element drawn near the canvas value has its
declared rect folded into the union rather than trusted to measurement. All were
measured from the assets themselves, not assumed:

```
logo card       x 130..213   y  282..365     (84x84 overlay, alpha extends to all 4 edges)
wordmark        x 238..403   y  303..327     (probed ink box, not the requested y)
left rail       x  96.. 99   y  640..1119
progress track  x 130..799   y 1438..1442
progress fill   x 130..799   y 1438..1442
furniture union x  96..799   y  282..1442
copy blocks     x 130..789   y  612..1167    (+18 px settle on scenes 2 to 8)
```

`overlay` rounds an odd `y` DOWN to even on yuv420p, so the logo rect is computed
from the EFFECTIVE y. The requested y is **282, already even**, so the effective y
equals it and the rect is exact. The same is true of the bar (1438) and the rail
(640). Nothing in this build was requested on an odd row, so the rounding trap has
nothing to bite.

The declared union does not exceed the measured union on any edge, so method B did
in fact see all of it. That is a confirmation, not a substitute.

### Final result

```
EVERYTHING DRAWN, measured OR declared, whichever is worse:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  800    limit <=  900    margin +100 px
  left   x =   96

  SMALLEST HEADROOM ON ANY EDGE : +55 px    (failure floor is 20)
  RESULT: PASS on all three reserves
```

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Which element sets each extreme

- **Top 282** is the brand icon card at y=282.
- **Bottom 1445** is the progress bar at y=1438 h=5, plus 3 rows of encoder bleed.
- **Right 800** is the progress bar at full extension (x=130 + w=670 → 799), plus
  1 px of bleed. Type's own right extent is **789**, so type has 111 px of
  clearance and was never the binding constraint.
- **Left 96** is the accent rail.

**Furniture binds on all three reserves, not type.** That is the run 1 lesson
holding: measure the union or you measure the wrong thing.

---

## Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(4.30-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene, and **no y-settle on scene
1 either**, since a settle would also move frame 0. Scenes 2 to 8 carry both.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : cd590baf2b6ec0d4e3a9735a71624c6f
instagram-cover.png             : cd590baf2b6ec0d4e3a9735a71624c6f
```

Video stream MD5, identical across both cuts: `10f351223cec2e9e5c5c1e27fef16798`.

---

## Progress bar actually animates

The brief's `drawbox` trap was respected as a precondition: geometry is literal on
every box and the only expression anywhere in the bar is `enable`. The fill is
**57 discrete static boxes**, one per half second, at literal widths, each gated
on an integer frame range. `replace=1` on all 59 boxes, with pre-blended opaque
colours, so nothing in this build depends on alpha blending at all.

Verified on the DELIVERED file by reading row y=1440 of every decoded frame with
an **absolute luma threshold at 70**, which sits between the track (44) and the
fill (113):

```
frame   0  t= 0.000s  fill width =  12 px
frame  30  t= 1.000s  fill width =  35 px
frame 105  t= 3.500s  fill width =  94 px
frame 300  t=10.000s  fill width = 247 px
frame 450  t=15.000s  fill width = 364 px
frame 600  t=20.000s  fill width = 482 px
frame 750  t=25.000s  fill width = 599 px
frame 854  t=28.467s  fill width = 670 px

monotonic non-decreasing : True
57 distinct widths, min 12, max 670  ->  ANIMATES
```

A luma threshold is used here and not the control diff, deliberately. The diff
sees the progress **track**, drawn full width on frame 0, exactly as it sees the
fill sliding across it, and would report a frozen bar. A control diff answers "was
this drawn", never "which of two overlapping things was drawn."

---

## Scene boundaries, and a detector defect this run caught

Frames were decoded sequentially in one pass and indexed. Scene changes were found
by counting ink pixels per frame in the band y400..1400 (never by hashing, which
does not survive H.264 quantisation noise). A frame counts as dark when its ink
count falls below 2% of the clip's global maximum; the boundary is the CENTRE of
each dark plateau, and the sweep must change each plateau's WIDTH without moving
its CENTRE.

The first run of this detector reported **a uniform +1 frame offset on every
boundary at thresholds 90 and 150, and exact centres at 70 and 120.** The brief
says a uniform offset means suspect the detector. It was the detector, and the
cause is precise:

```
thr  70  plateaus (127,131,w5) (235,239,w5) (344,347,w4) (451,455,w5) ...
thr  90  plateaus (127,132,w6) (235,240,w6) (343,348,w6) (451,456,w6) ...
thr 120  plateaus (125,133,w9) (233,241,w9) (341,349,w9) (449,457,w9) ...
thr 150  plateaus (124,135,w12)(232,243,w12)(340,351,w12)(448,459,w12)...
```

**An EVEN-width plateau has no integer centre.** `round((a+b)/2)` on width 6 and
width 12 rounds the half up and lands one frame late; odd widths 5 and 9 have an
exact centre and land on the scripted frame. Taking the lower of the two equally
valid middle frames resolves it everywhere:

```
thr   plateau widths          centre, round()                      centre, floor()
 70   5,5,4,5,5,5,5           129,237,346,453,573,675,768          129,237,345,453,573,675,768
 90   6,6,6,6,6,6,6           130,238,346,454,574,676,768          129,237,345,453,573,675,768
120   9,9,9,9,9,9,9           129,237,345,453,573,675,768          129,237,345,453,573,675,768
150   12,12,12,12,12,12,12    130,238,346,454,574,676,768          129,237,345,453,573,675,768

scripted                      129,237,345,453,573,675,768
times                         4.30, 7.90, 11.50, 15.10, 19.10, 22.50, 25.60
```

**35 of 35 exact**, across four thresholds, once the parity is handled. Plateau
widths grow 5, 6, 9, 12 while the centres hold, and that invariance is the
evidence. The decisive argument that this was never a render fault: the apparent
offset **disappears at threshold 120 and reappears at 150**. A real timeline drift
cannot be threshold-dependent.

This is a fresh instance of a trap already in the brief, with a new cause. Earlier
runs hit uniform offsets from a step detector firing on the fade ramp and from a
local-minimum detector returning a plateau's first frame. This one comes from
rounding a half-integer centre, and it only appears at thresholds that happen to
produce even-width plateaus. Worth carrying: **take the floor of a plateau centre,
never the round.**

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, generated by `scripts/compose_music.py`, no third-party material,
cleared for commercial use including paid advertising, **no attribution line
required**. Nothing was downloaded and no bed was synthesized.

Held CONSTANT by instruction, as on all seven earlier runs. The hook is the
variable under test. Note that `assets/audio/ATTRIBUTION.md` maps `tension-minor`
to "loss aversion, status threat", which happens to agree with this run's driver;
that agreement is a coincidence and not the reason, since the track is held fixed
regardless of driver.

Source is 60.000 s. Trimmed to 28.500 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 27.0 s**, then two-pass `loudnorm`.

### The fade in is load-bearing and was verified on the DELIVERED file

```
DELIVERED, FIRST 64 SAMPLES, abs max : 0.002626    ceiling 0.005    PASS
DELIVERED, first 10 ms,      abs max : 0.013540
DELIVERED, final 0.1 s,      abs max : 0.016701    (fade out landed)
DELIVERED, overall peak              : 0.614439    (-4.23 dBFS)

SOURCE tension-minor.wav, first 64 samples : 0.061709
SOURCE peak inside its first 0.1 s         : 0.206314
```

The source is at 0.062 by sample 64 and 0.206 within 0.1 s, so a hard cut at
sample 0 clicks audibly. The delivered file starts at 0.0026, a factor of 23 down.

### Loudness, measured not assumed

Pass 1 on the trimmed cut: `input_i=-16.19`, `input_tp=-4.41`, `input_lra=3.60`,
`input_thresh=-26.25`, `target_offset=-1.15`. The brief's warning is confirmed
again on this material: a single pass would have landed about 1.2 LU off.

Re-measured on the **delivered** `instagram-scored.mp4`, decoding the AAC:

| | Target | Measured |
|---|---|---|
| Integrated | -16 LUFS | **-16.02 LUFS** |
| True peak | -1.5 dBTP max | **-4.23 dBTP** |
| LRA | n/a | 3.60 |

True peak sits 2.7 dB under the ceiling. -1.5 dBTP is a maximum, not a target, and
with `linear=true` the gain is one scalar chosen to hit the integrated target, so
nothing was limited and no shape was altered.

### Honest read

Measured, not listened to.

```
RMS and spectral centroid per 2 s block
   0.0- 2.0   -21.26 dBFS    477 Hz   <- fade in, near-silent under the cover card
   2.0- 4.0   -21.80         216
   4.0- 6.0   -17.69        1203      <- 'You did not write it.'
   6.0- 8.0   -16.22        1316
   8.0-10.0   -16.22        1440
  10.0-12.0   -16.49        1357
  12.0-14.0   -15.79        2702      <- arrangement opens, on the turn scene
  14.0-16.0   -16.58        2423
  16.0-18.0   -16.50        1898
  18.0-20.0   -16.00        1801
  20.0-22.0   -15.94        2118
  22.0-24.0   -15.93        2466
  24.0-26.0   -15.16        2494      <- loudest block, across the product claim
  26.0-28.0   -17.48        2347
  28.0-28.5   -29.36        1534      <- fade out
```

```
band levels, dB relative to the full mix
    20-80    Hz   -1.69
    80-160   Hz   -6.63
   160-320   Hz  -13.36
   320-640   Hz  -13.39
   640-1280  Hz  -20.38
  1280-2560  Hz  -25.45
  2560-5120  Hz  -31.44
  5120-10240 Hz  -37.11
 10240-20000 Hz  -40.33
```

**What is good.** RMS climbs about 6.1 dB from the opening block to the 24 to 26 s
block. The quietest four seconds are the cover card alone on screen, and the
loudest block lands across `BrandGEO reads what they say about you.` The top end
opens up at 12 to 14 s, which sits under `That line sits in front of your
homepage.`, the scene where the cut turns. None of that was arranged: the track is
fixed and the scene timings were set for reading speed, so it is a fortunate
alignment rather than a designed one, and the same alignment has now appeared on
four consecutive runs with four different scripts.

**The weakness, stated plainly and unchanged across runs.** It is heavily
bottom-weighted. Full-mix RMS is -16.81 dBFS; filtering everything below 300 Hz
leaves **-28.13 dBFS**, an **11.3 dB** drop. On a phone speaker, which has almost
nothing under 200 Hz, this plays noticeably softer and thinner than -16 LUFS
suggests, and most of what carries the build sits in the quietest bands.

That is not a reason to change the default. **`instagram-silent.mp4` is still the
file to upload organically**, because Instagram's in-app library is licensed for
the platform and favoured by its distribution. `instagram-scored.mp4` is for paid,
embeds and decks, where the in-app library does not exist.

---

## Exact commands

Paths are relative to a build directory holding `fonts/` (the vendored Inter
files, copied unmodified from `docs/growth/grok-launch/images/_build/fonts/`),
`txt/` (one file per on-screen line, used through `textfile=` so no filtergraph
escaping is needed), `logo.png` (copied from
`docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`),
`tension-minor.wav` (copied from `assets/audio/music/`), and the two generated
glow PNGs.

### 0. Type-width probe, run BEFORE the master

```bash
ffmpeg -v error -y -f lavfi -i "color=c=black:s=1080x400" \
  -vf "drawtext=fontfile=fonts/Inter-Medium.ttf:textfile=txt/_probe.txt:x=130:y=120\
:fontsize=50:fontcolor=0xFFFFFF" \
  -frames:v 1 -f rawvideo -pix_fmt gray -        # then numpy: nonzero(a > 40)
```

### 1. Background glows, one frame each

`-update 1 -pix_fmt rgba` is on both writes. Without it alpha is dropped one step
later and the overlays land opaque. Both outputs were probed and report `rgba`.

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='139':g='92':b='246':a='66*exp(-1.9*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 -update 1 -pix_fmt rgba glow-violet.png

ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='99':g='102':b='241':a='46*exp(-2.2*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 -update 1 -pix_fmt rgba glow-indigo.png
```

### 2. Master render

```bash
ffmpeg -y \
  -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=28.5" \
  -loop 1 -i glow-violet.png \
  -loop 1 -i glow-indigo.png \
  -loop 1 -i logo.png \
  -filter_complex_script filtergraph.txt \
  -map "[v]" -an -t 28.5 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 \
  out-silent.mp4
```

The filtergraph is 15,019 characters: 101 filter calls, **42 `drawtext`** (41 copy
strings plus the wordmark) and **59 `drawbox`** (the rail, the bar track, and 57
progress steps). Structure, with the three special cases shown verbatim:

```
[0:v]format=rgba[base];
[base][1:v]overlay=x='150+40*sin(t/7)':y='900+30*cos(t/9)':format=auto[b1];
[b1][2:v]overlay=x='-500+35*cos(t/8)':y='-340+28*sin(t/6)':format=auto[b2];
[3:v]scale=84:84[lg];
[b2][lg]overlay=x=130:y=282:format=auto[b3];
[b3]drawbox=x=96:y=640:w=4:h=480:color=0x3D2B6B@1:t=fill:replace=1,
  drawbox=x=130:y=1438:w=670:h=5:color=0x2A2C38@1:t=fill:replace=1,

  [progress fill, 57 static boxes, INTEGER FRAME gates, no geometry expression:]
  drawbox=x=130:y=1438:w=12:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(n\,0\,14)',
  ... 55 more ... final step w=670 at n 840..854,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover, and no y-settle:]
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/s1_0.txt:x=130:y=654
    :fontsize=38:fontcolor=0xA78BFA
    :alpha='max(0\,min(1\,(4.30-t)/0.30))':enable='between(n\,0\,128)',

  [scenes 2 to 7, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/s2_0.txt:x=130
    :y='652+18*(1-min(1\,(t-4.30)/0.45))'
    :fontsize=72:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.30)/0.35\,(7.90-t)/0.30)))'
    :enable='between(n\,129\,236)',

  [scene 8, the CTA, fades IN only so it holds to the final frame:]
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/s8_3.txt:x=130
    :y='997+18*(1-min(1\,(t-25.60)/0.45))'
    :fontsize=54:fontcolor=0xA78BFA
    :alpha='max(0\,min(1\,(t-25.60)/0.35))':enable='between(n\,768\,854)',

  noise=alls=3:allf=t+u:all_seed=20260730,
  format=yuv420p[v]
```

The `noise` pass dithers the large soft gradient so H.264 does not band it; its
seed is pinned so the control render can be diffed against the delivered one.

### 3. Control render, for the diff measurement

Identical background and identical noise seed, with the logo, rails, bar and all
type removed.

```bash
ffmpeg -y -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=28.5" \
  -loop 1 -i glow-violet.png -loop 1 -i glow-indigo.png \
  -filter_complex_script filtergraph-control.txt \
  -map "[v]" -an -t 28.5 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 control.mp4
```

### 4. Audio

```bash
# trim 60.000s to 28.500s, 0.08s fade IN (the source is at 0.062 by sample 64 and
# clicks on a hard cut), 1.5s fade OUT
ffmpeg -y -i tension-minor.wav \
  -af "atrim=0:28.5,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,afade=t=out:st=27.0:d=1.5" \
  -c:a pcm_s24le music-cut.wav

# pass 1, measure
ffmpeg -i music-cut.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values
ffmpeg -y -i music-cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11\
:measured_I=-16.19:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.25\
:offset=-1.15:linear=true" -ar 48000 -ac 2 -c:a pcm_s24le music-norm.wav
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
# durations and stream tables. A mux can exit 0 and be unreadable, so this runs
# before the render is called done.
ffprobe -v error -show_entries format=duration,nb_streams,size -show_entries \
  stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,profile,\
duration,duration_ts,time_base,nb_frames -of default=nw=1 instagram-silent.mp4

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

The safe-zone measurement, the noise-floor probe and the flat-canvas demonstration
are one numpy pass over two synchronised `ffmpeg -f rawvideo -pix_fmt rgb24`
pipes, the delivered file and the control, decoded sequentially with no seeking,
over all 855 frames, reduced to a global extreme. The bar-animation check and the
scene-boundary check are separate passes over the delivered file alone, for the
reasons given above. The compliance scan is a separate pass over the `textfile=`
bytes ffmpeg opened.

---

## Every trap in the brief, and how it was handled

Applied as preconditions, not discovered:

| Trap | Handling |
|---|---|
| `drawbox` blends on RGBA | `replace=1` on all 59 boxes, with pre-blended opaque colours, so nothing in the build depends on alpha |
| `drawbox` cannot animate | 57 literal static boxes, `enable` is the only expression, then verified to move on the delivered file (12 → 670 px, 57 distinct widths) |
| Single-digit headroom is a paper pass | smallest edge is **+55 px**; reported per edge, never as "passes". The first type-width probe's 32 px was rejected as a paper pass and the engine list was re-set |
| Guess the ink threshold | background peak printed first (39.7), four thresholds inside the gap agree |
| Set the diff threshold above a MEASURED noise floor | floor measured at 10, 11, 10 in three empty-by-design regions; threshold 12; the row at 10 invents 252 px of phantom bottom ink, which is the demonstration |
| Fade in on scene 1 | scene 1 hard-starts and has no y-settle; cover MD5-matched to frame 0 |
| Furniture counts as ink | all five furniture rects declared and folded in; furniture binds all three reserves |
| Measure the intermediate | every number comes from the delivered mp4 |
| Diff against a flat canvas | diffed against a text-free control; the flat-colour method run too, purely to show it returns the whole frame on an empty control |
| Dark-on-dark furniture invisible to both pixel methods | progress track at luma 44, 4 above the background peak, folded in by declared rect |
| A control diff cannot separate overlapping elements | bar animation measured with an absolute luma threshold at 70, between track (44) and fill (113), not with the diff |
| `overlay` rounds an odd y DOWN to even | logo 282, bar 1438, rail 640, all already even, so effective y equals requested y and the declared rects are exact |
| Fade the music IN | 0.08 s fade in; first 64 samples at 0.002626 against a source at 0.061709 |
| A mux can exit 0 and be unreadable | both files probed for duration and stream count before delivery |
| `ffconcat` drift | no concat; all gates are integer frame indices, boundaries verified on the delivered file |
| Frame hashing | ink-pixel counting, not hashing |
| A uniform offset means the detector is wrong | **this fired.** A uniform +1 at two of four thresholds, caused by rounding an even-width plateau's half-integer centre. Taking the floor gives 35 of 35 exact |
| `-ss` near a cut | no seeking anywhere in any measurement |
| `-shortest` | on the mux; 64 samples of AAC padding confirmed present in the packets and excluded by the sample table |
| `color=black@0.0` does not survive format negotiation | not applicable, deliberately: this build draws onto the composited base in one chain rather than compositing transparent text layers, so there is no RGBA layer whose alpha could be dropped. `-update 1 -pix_fmt rgba` is still used on the two glow PNGs, and both probed as `rgba` |
| PNG intermediates, not JPEG | glows and cover are PNG; no JPEG anywhere, so no `yuvj420p` range shift |
| Provenance is on the FIGURE, not the page | no figure appears; the cut publishes no measured result at all |
| Engine count is a claim about the lineup on the day | no collection date, no finding, and **no count on screen in any form**. The five names come from `planConfig.ts`, not from a research page |
| Never a superlative | one rewrite forced by the scanner (`only` → `just`); 19 forms checked |
| Never a universal | none written; 28 forms checked, including hedged variants |
| Never name a measured subject | mechanical scan over 3,548 candidates from all 80 published pages, reduced to 1,728 name-shaped. Five names on screen, all five engines. **Two harvester bugs found and fixed, then a negative control run to prove the scan still fires** |
| The brief is itself a vector for bad claims | every check reads the `textfile=` bytes ffmpeg opened, parsed out of the filtergraph, and exits non-zero. Nothing is checked against the brief's wording or against the copy source |

---

## Scope

This task was scoped to this `instagram/` folder. Exactly the four required files
were written and nothing else, anywhere. `RUN.md` for run `20260730-0513` was
deliberately **not** created, since it sits outside the granted scope. No git
command was run.

Two findings here are cross-platform and belong in `00-CAMPAIGN-BRIEF.md`, which
is outside this scope to edit:

1. **Take the FLOOR of a plateau centre, never the round.** An even-width plateau
   has no integer centre and `round()` produces a uniform +1 offset that reads
   exactly like timeline drift. It is distinguishable because it appears and
   disappears with the ink threshold, which a render fault cannot do.
2. **A measured-subject scanner needs a negative control.** Two harvester bugs in
   this run made it pass on strings it should have caught. Injecting a real
   measured subject and confirming it fires is the only thing that separates a
   working scan from a permissive one.

## Nothing was posted or scheduled

These are files for review only.
