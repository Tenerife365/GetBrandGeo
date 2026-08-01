# Instagram Reel, run 20260730-0413

**Hook driver:** #1, loss aversion. **Second pass.** The six-driver cycle
completed at run `20260730-0313`; this begins the replication round.

**The point of this cut is to separate the DRIVER from the EXECUTION.** Run
`20260729-2200` was the first loss-aversion build. If it performs, we cannot
currently tell whether loss aversion works or whether that particular cut worked.
So this is the same driver built a deliberately different way, and nothing about
run 1's lines, images or structure is reused.

---

## How this differs from run 1, and why

Run 1's four cuts all opened on the **event**: `Someone just asked / AI for the
best / in your category.` A moment happening now, in the present continuous,
closing on `right now`. Its spine was second-person accusation (`You never see
it.`, `It was not you.`) and its payoff was a maxim about the viewer's capability.

Loss aversion has other shapes. This one takes **the gap between what your
analytics show and what happened**, resolved into **a decision already made
without you in the room**. Six differences, each deliberate:

1. **Tense.** Run 1 is present and ongoing. This one is **entirely
   retrospective**: the report already exists, the answer was already read, the
   decision was already taken. There is no "right now" anywhere in the cut. The
   only future-facing line is the CTA.
2. **Opening object.** Run 1 opens on an event outside the viewer's world. This
   opens on **an artefact the viewer already owns and already trusts**, their own
   traffic report, and points at what is missing from it. The loss is framed as
   an absence in a record, not as an incident.
3. **Grammatical spine.** Run 1's subjects are `Someone`, `You`, `The answer`,
   `It`. Here the subjects are the artefacts: `Your report`, `Sessions. Sources.
   Referrers.`, `An AI answer`, `That answer`, `A missing row`. The viewer is the
   **owner** of the record rather than the victim of the event. The only line
   where `you` is the grammatical subject is the CTA.
4. **The payoff.** Run 1 landed on `You cannot fix / what you cannot see.` That
   line would not pass today: `cannot` is a banned universal under the rule added
   after run 5, and it is a claim about the viewer's capability. This cut lands on
   `A missing row / is not a / missing decision.`, an epistemic distinction that
   asserts nothing about any person and is refutable by nobody because it makes no
   claim about anybody.
5. **The engine block.** Run 1 set the five engines as a five-line vertical roll
   call under `FIVE ENGINES ANSWER`, with the count stated next to the list. Here
   they run on as three lines under `WHERE THE ANSWER COMES FROM`, and the count
   is stated four seconds later in a different scene, attached to what the product
   does rather than to the list itself.
6. **Shape.** Run 1: 7 scenes over 27.4 s, ending on a maxim then a CTA. This: 8
   scenes over 29.0 s, with the turn at scene 3 rather than scene 3-and-4, and a
   product scene that names its own narrow claim before the CTA.

The register is still Instagram-native and still quiet rather than blunt: short
declaratives, one idea per card, no hashtags or emoji baked into the frame. What
changed is the argument's shape, not the platform voice.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows; `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 4,631,889 bytes, scored 5,377,487 bytes, cover 288,539 bytes.

Naming follows runs 1 to 6 (`-scored`, not the brief's older `-bed.mp4`, which
dates from when the fallback was a synthesized `sine` bed).

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=130. Each block is vertically centred on y=880, the centre of the 220..1500
visible band.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282), the wordmark
`BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a progress
bar at y=1438.

**0.00 to 4.40 s**, kicker Inter SemiBold 38 accent `#A78BFA`, body Bold 72 ink
`#E8E9ED`, close ExtraBold 70 accent. Hard in at full opacity, no fade up and no
y-settle, because this frame is the cover.
```
WHAT THE REPORT LEAVES OUT

Your report shows
what arrived.

Not what
was decided.
```

**4.40 to 8.00 s**, body Bold 72 ink, close ExtraBold 68 accent
```
Sessions. Sources.
Referrers.

Those are arrivals.
```

**8.00 to 11.60 s**, body Bold 74 ink, close ExtraBold 68 accent
```
An AI answer is
read where it
is written.

Off your site.
```

**11.60 to 15.20 s**, body Bold 70 ink, close ExtraBold 68 accent
```
That answer names
a few options.

It is not sent
to you.
```

**15.20 to 18.80 s**, kicker SemiBold 36 accent, list SemiBold 58 ink. Set in
SemiBold rather than the Bold/ExtraBold used elsewhere: this is a list of
instruments, not the video's own voice.
```
WHERE THE ANSWER COMES FROM

ChatGPT, Gemini,
Claude, Perplexity,
Google AI Mode.
```

**18.80 to 22.20 s**, ExtraBold 76, last line accent. The payoff.
```
A missing row
is not a
missing decision.
```

**22.20 to 25.90 s**, body Bold 68 ink, close ExtraBold 58 accent
```
We ask those five
the same buyer
questions, on a
schedule,

and keep the answers.
```

**25.90 to 29.00 s**, body Bold 70 ink, URL SemiBold 54 accent. Fades in only,
no fade out, so the CTA holds to the last frame.
```
See what gets said
when you are not
in the room.

getbrandgeo.com
```

33 strings including the wordmark.

---

## Every claim on screen, and where it comes from

| On screen | Status | Source |
|---|---|---|
| `Your report shows what arrived.` | Description of what a visit-based analytics report contains | Definitional. A sessions/sources/referrers report is a table of arrivals. |
| `Not what was decided.` | The gap this cut is about | Follows from the line above: an arrivals table records arrivals. |
| `Sessions. Sources. Referrers.` | Three standard analytics dimensions | Named as dimensions, not as anyone's product. |
| `Those are arrivals.` | Restatement | Definitional. |
| `An AI answer is read where it is written. Off your site.` | Mechanism | An engine renders its answer on its own surface. Reading it produces no visit to a third-party site, so no session exists to be recorded. |
| `That answer names a few options.` | Mechanism | What a recommendation-shaped answer does. No count, no rate, no named party. |
| `It is not sent to you.` | Mechanism | No engine notifies a brand that it was named or not named. |
| `ChatGPT, Gemini, Claude, Perplexity, Google AI Mode.` | The instruments | `planConfig.ts` `PLAN_ENGINES.growth`, read mechanically, exactly 5 entries. |
| `A missing row is not a missing decision.` | The payoff | A statement about inference from an incomplete record. Asserts nothing about any person or company. |
| `We ask those five the same buyer questions, on a schedule, and keep the answers.` | Product claim, the only one in the cut | `planConfig.ts:56` has exactly five growth engines. The rest describes what the collection pipeline does. |

**There is no measured result anywhere in this cut.** No percentage, no score, no
ranking, no rate, no count of anything measured. The only number-word on screen is
`five`, and it is a count of what the product runs, read out of `planConfig.ts`,
not a count attached to a finding.

That matters for the trap the brief records against `bg-004` and `bg-016`: an
engine count taken from a research page is a claim about the lineup on the day of
collection, and both of those pages name a retired engine. No collection date
appears here, so there is no lineup to get wrong. `five` is read from today's
config, not from any page.

### Sources deliberately not used

- **`bg-016.html`**: excluded by instruction. Not opened, not cited.
- **`bg-004.html`**: no engine count taken from it. Not cited.
- **`bg-005.html`'s 48% and 93%**: third-party figures sitting inside an
  otherwise first-party page. Not used and not consulted. A campaign built on
  being checkable cannot borrow someone else's statistic to make its own point.
- **"27 cities"**: never written.
- **No Grok, no AI Overviews, no rate for either.** Both went live 2026-07-29 with
  5 and 6 rows from a single day.
- **Meta AI is retired** and appears nowhere. Copilot and DeepSeek are on no
  purchasable plan and appear nowhere.
- **No superlative of any kind**, and none was needed. The brief's own note is
  that the underlying point is almost always strong enough without one.

---

## Compliance check, run mechanically on the DRAWN BYTES

`checks.py` does not read the copy source and does not read the brief. It parses
`filtergraph.txt` for every `textfile=` path ffmpeg actually opened, reads those
files off disk, and checks those bytes. It exits non-zero on any hit.

```
textfile= references in filtergraph.txt : 33
distinct files read off disk            : 33

banned vocabulary hits          : NONE
superlative hits                : NONE   (first, only, most, never, biggest,
                                          largest, best, unique, fastest,
                                          greatest, leading, ultimate, #1)
UNIVERSAL hits                  : NONE   (nobody, no one, everyone, everybody,
                                          always, never, cannot, can't, every
                                          business, every company, anyone, no
                                          human, impossible, by hand, all
                                          businesses, everything, nothing)
hedged-universal hits           : NONE   (almost nobody, few people, hardly
                                          anyone, virtually nobody, most people)
forbidden engines on screen     : NONE   (Grok, AI Overview(s), Meta AI, Copilot,
                                          DeepSeek, Bing, Llama all absent)
pricing / plan-name hits        : NONE   (Essentials, Growth, Managed,
                                          Enterprise, EUR, USD, price, plan)
currency / percent symbols      : NONE
digit characters on screen      : NONE
dash codepoints                 : NONE   (em, en, figure, minus, horizontal bar)
non-ASCII characters            : NONE
hyphen-minus U+002D             : 0 occurrences

pages scanned                   : 80   (all of brandgeo/web/*.html)
capitalised candidates extracted: 3088
survive the lowercase test      : 1612
sub-span matches discarded      : ['Google', 'Google AI']
corpus names appearing on screen: ['ChatGPT', 'Claude', 'Gemini',
                                   'Google AI Mode', 'Perplexity']
of those, MEASURED SUBJECTS     : NONE

planConfig.ts PLAN_ENGINES.growth : ['chatgpt','gemini','claude','perplexity',
                                     'google_ai']  (n=5)
engine labels drawn on screen     : all five, exactly
'five' on screen                  : 1x   matches len(growth)=5 : True

OVERALL : PASS   (exit 0)
```

**Run 1's payoff line would fail this scan.** `You cannot fix what you cannot
see.` contains `cannot`, twice. The universal ban was added after run 1 shipped.
Worth recording because it is direct evidence that the checks belong in a script
over the rendered strings rather than in a reviewer's memory: the line reads as
obviously fine and is obviously banned.

### The scan flagged two names and both were its own fault

First pass reported `Google` and `Google AI` as measured subjects. Neither is a
subject of anything. Both are sub-spans of `Google AI Mode.`, which is an engine
name and is explicitly allowed as the instrument being measured.

The fix is a **change to the rule, not an addition to a stoplist**. Every match is
now recorded as a character SPAN, and a candidate whose every on-screen occurrence
lies strictly inside the span of a longer candidate is discarded as a sub-span
rather than counted as an independent act of naming. Extending a hand-written
exception list until the output looks clean is how a scan stops being evidence;
run 6's notes make the same point about a different false positive in the same
filter.

After the fix, five names appear on screen and all five are engines.

### The removal test

The brief's test is: if the name were removed, would the claim still stand?
`ChatGPT, Gemini, Claude, Perplexity, Google AI Mode.` does not survive removal , 
it *is* the list, and a product that cannot say which engines it reads is
undescribable. Those are instruments, which the brief allows. Nothing else on
screen is a name at all.

---

## Duration

`ffprobe` on the DELIVERED files, run before this was called done. A mux can exit
0 and be unreadable.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **29.000000 s** | 870 frames @ 30/1, `duration_ts=445440 / 15360`, 1080x1920, `yuv420p`, H.264 High | **none, `nb_streams=1`** |
| `instagram-scored.mp4` | **29.000000 s** | 870 frames, identical stream (MD5 match) | `duration_ts=1392000 / 48000` = 29.000000 s, 1361 AAC frames, `nb_streams=2` |

Both land on exactly 29.000000 s, inside the 20 to 30 s Instagram target.

AAC drift measured rather than assumed: decoding the delivered scored audio yields
**1,392,640 samples = 29.013333 s**, 640 samples of encoder padding past the cut.
The mp4 sample table caps the track at `duration_ts=1392000`, exactly 29.000000 s,
so the padding exists as packet payload and is never played. `-shortest` holds
that line.

Both files: H.264 High, `yuv420p`, from PNG intermediates only. No JPEG anywhere,
so no `yuvj420p` range shift.

### The timeline is frame-indexed, and nothing is concatenated

No `ffconcat` anywhere. Every timeline gate in the filtergraph is an **integer
frame index**, never a float scene time:

```
s1 frames   0..131     s5 frames 456..563
s2 frames 132..239     s6 frames 564..665
s3 frames 240..347     s7 frames 666..776
s4 frames 348..455     s8 frames 777..869
```

`enable='between(n,132,239)'`, not `between(t,4.40,8.00)`. The 58 progress-bar
steps are gated the same way. No float is compared to a frame time anywhere.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 870 frames**, no seeking anywhere, reduced to a global extreme.
Two independent methods, plus declared geometry folded in explicitly.

### The type-width probe ran BEFORE the master

All 33 strings were rendered alone at their final font and size and measured, so
the right reserve was checked before 29 seconds of encoding rather than after.

```
widest string        : 'That answer names'   Inter-Bold 70
reaches x            : 798
right reserve limit  : x <= 900
HEADROOM             : 102 px          (failure floor 20)
```

The first probe pass, at the sizes originally drafted, put the widest string at
**x = 855, only 45 px of headroom**. That is a pass and a bad idea: one copy edit
destroys it. Nine strings were re-set two to six points smaller and the probe
re-run, which is a five-second loop compared with a 20-second encode plus a
90-second measurement pass. Recording it because it is the cheapest possible place
to catch a right-reserve problem.

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays, same
noise seed (`all_seed=20260730`), no logo, no rails, no bar, no type.

```
control peak luma, whole frame           39.7
control peak luma, copy band y400..1400  35.9
delivered peak luma, x >= 940 (empty)    39.7
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
so thresholds of 45, 60, 90 and 120 all sit inside it. **The progress track at
luma 44 is 4 above the background peak and is not separable by any threshold.**
That is why method B exists and why declared geometry is folded in on top of it.

### The diff threshold was set above a MEASURED noise floor

A control cancels artefacts it shares; it cannot cancel the encoder's response to
content it does not have. So the noise floor was measured in three regions that
are empty by design in the delivered file:

```
x>=940     max channel diff =  9
y>=1520    max channel diff = 10
y<=260     max channel diff = 10
  -> noise floor 10; the threshold must sit ABOVE it
```

The sweep then shows exactly where the floor bites:

```
diff >  3 : y    0..1919  x    0..1079   <-- at/below noise floor, whole frame
diff >  5 : y    0..1919  x    0..1079   <-- at/below noise floor, whole frame
diff >  8 : y    6..1897  x   23..1079   <-- at/below noise floor
diff > 10 : y  281..1445  x   95.. 799   <-- AT the floor, 1 px loose on the left
diff > 12 : y  281..1445  x   96.. 799       <-- CHOSEN
diff > 14 : y  282..1445  x   96.. 799
diff > 18 : y  282..1444  x   96.. 799
diff > 24 : y  282..1443  x   96.. 799
```

Thresholds 12 through 24 differ by at most 2 px on any edge and agree exactly on
the right edge, which is the one that matters here. That plateau, not the single
number, is the evidence. Picking 6 by eye, as run 5's Facebook build did, would
have returned a false failure on every edge.

### Method B, per-pixel diff against the control (authoritative)

```
GLOBAL INK BOX, union of everything drawn, 870 frames, diff > 12:

  top    y =  281    limit >=  220    margin  +61 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  799    limit <=  900    margin +101 px
  left   x =   96    (no left reserve specified)
```

### The control is not optional, demonstrated again

Run purely to show the failure is total rather than confined to the frame edge:

```
nominal canvas                  rgb(9,10,15) = 0x090A0F
control row 0,    x=700         rgb(10,10,22)
control row 900,  x=700         rgb( 8, 8,18)
control row 1900, x=700         rgb(28,20,53)

control (NOTHING DRAWN) diffed vs FLAT assumed canvas
  -> ink box y 0..1919   x 0..1079      (the whole frame)
```

The control has nothing drawn on it at all and still "fails" every edge against a
flat colour. Two soft full-frame glows plus the dither pass mean essentially no
pixel equals the nominal canvas value. Only the control cancels that, because it
carries the same glows, the same dither seed and the same codec.

### Method A, absolute luma threshold (cross-check)

```
luma >  45 : y  301..1442  x   96..799   top +81  bottom +58  right +101
luma >  60 : y  301..1442  x  130..799   top +81  bottom +58  right +101
luma >  90 : y  301..1442  x  130..799   top +81  bottom +58  right +101
luma > 120 : y  303..1442  x  130..798   top +83  bottom +58  right +102
```

The two methods agree on the right edge exactly (799) and every difference
elsewhere is explained rather than waved at. **Per the brief, the method finding
MORE ink is trusted, and that is B on both remaining edges:**

- **Top, 281 vs 301.** 20 px. The logo card is drawn at y=282 and its rounded
  corners are near-black, so a luma threshold cannot see the top of it. B picks it
  up plus 1 row of encoder bleed. The binding number is **281**.
- **Bottom, 1445 vs 1442.** The bar is drawn at y=1438 h=5, so its last lit row is
  1442 and B picks up 3 rows of bleed. The binding number is **1445**.
- **Right, 799 in both.** The progress bar at full extension. Method A at 120
  reports 798 because it has already lost the fill's antialiased right edge; the
  lower thresholds, which can still see it, agree with B.

### Declared geometry, folded in explicitly

Per the brief's blind-spot rule, every element drawn near the canvas value has its
declared rect folded into the union rather than trusted to measurement:

```
logo card       x 130..213   y  282..365
wordmark        x 236..403   y  303..347
left rail       x  96.. 99   y  640..1119
progress track  x 130..799   y 1438..1442
progress fill   x 130..799   y 1438..1442
furniture union x  96..799   y  282..1442
copy blocks     x 130..798   y  648..1112   (+18 px settle on scenes 2 to 8)
```

The declared union does not exceed the measured union on any edge, so method B did
in fact see all of it. That is a confirmation, not a substitute.

### Final result

```
EVERYTHING DRAWN, measured OR declared, whichever is worse:

  top    y =  281    limit >=  220    margin  +61 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  799    limit <=  900    margin +101 px
  left   x =   96

  SMALLEST HEADROOM ON ANY EDGE : +55 px    (failure floor is 20)
  RESULT: PASS
```

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Which element sets each extreme

- **Top 281** is the brand icon card at y=282, plus 1 row of encoder bleed.
- **Bottom 1445** is the progress bar at y=1438 h=5, plus 3 rows of bleed.
- **Right 799** is the progress bar at full extension. Type's own right extent is
  798, so the two are within a pixel of each other for the first time in this
  campaign, and both clear the reserve by about 100 px.
- **Left 96** is the accent rail.

**Furniture binds on top and bottom; the right edge is a tie.** The bar was kept
at 670 px wide, ending at x=799, for consistency with runs 5 and 6 rather than
resized to this run's copy. Changing it would make cross-run ink boxes
incomparable for no gain.

---

## Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(4.40-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene, and no y-settle on scene 1
either, since a settle would also move frame 0.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 38b3a981b449394280d8cedb247e6d64
instagram-cover.png             : 38b3a981b449394280d8cedb247e6d64
```

Video stream MD5, identical across both cuts: `85500975fa4860036fa7a77f53625683`.

The cover carries `WHAT THE REPORT LEAVES OUT / Your report shows what arrived. /
Not what was decided.` That is a complete argument on a still frame, which is what
a loss-aversion thumbnail has to be: the whole tension is legible without playing
anything.

---

## Progress bar actually animates

The brief's `drawbox` trap was respected up front: geometry is literal on every
box and the only expression anywhere in the bar is `enable`. The fill is **58
discrete static boxes**, one per half second, at literal widths, each gated on an
integer frame range. `replace=1` on all 60 boxes, with pre-blended opaque colours,
so nothing depends on alpha.

Verified on the DELIVERED file by reading row y=1440 of every decoded frame, with
an **absolute luma threshold at 70**, which sits between the track (44) and the
fill (113):

```
frame   0  t= 0.000s   fill width =  12 px
frame  30  t= 1.000s   fill width =  35 px
frame 105  t= 3.500s   fill width =  92 px
frame 300  t=10.000s   fill width = 243 px
frame 600  t=20.000s   fill width = 474 px
frame 750  t=25.000s   fill width = 589 px
frame 869  t=28.967s   fill width = 670 px

monotonic non-decreasing : True
58 distinct widths, min 12, max 670  ->  ANIMATES
```

A luma threshold is used here and not the control diff, deliberately. The diff
sees the progress **track**, drawn full width on frame 0, exactly as it sees the
fill sliding across it, and would report a frozen bar. A control diff answers "was
this drawn", never "which of two overlapping things was drawn."

### Scene boundaries, by plateau centre with a threshold sweep

Frames were decoded sequentially in one pass and indexed, no `-ss` seeking
anywhere, and scene changes were found by counting ink pixels per frame rather
than hashing. A frame counts as dark when its ink count in the band y400..1400
falls below 2% of the clip's global maximum; the boundary is the CENTRE of each
dark plateau, and the sweep must change the plateau's WIDTH without moving its
CENTRE.

```
ink thr   plateau widths                     centres
     45   []                                 []                                    no plateau
     55   [3,3,3,3,3,3,3]                    [132,240,348,456,564,666,777]   MATCH
     70   [5,5,5,5,5,5,5]                    [132,240,348,456,564,666,777]   MATCH
     90   [6,6,6,6,7,7,7]                    [132,240,348,456,564,666,777]   MATCH
    120   [9,9,9,9,9,9,9]                    [132,240,348,456,564,666,777]   MATCH
    150   [12,12,12,12,12,12,12]             [132,240,348,456,564,666,778]

scripted  [132,240,348,456,564,666,777]
times     [4.40, 8.00, 11.60, 15.20, 18.80, 22.20, 25.90]
```

**34 of 35 exact.** Threshold 45 forms no plateau at all, which is the expected
result rather than a failure: at 45 the fading text never drops below the
threshold, so there is no dark window to find. Widths grow monotonically
(3, 5, 6, 9, 12) while the centres hold, and that invariance is the evidence.

**The single miss is understood and is a property of the detector, not the
render.** At threshold 150 the last boundary reports 778 against a scripted 777.
The plateau test calls a frame dark relative to the clip's GLOBAL peak ink, so a
scene with less ink of its own crosses back over 2% later on the way up. Scene 8
is three Bold-70 lines plus a small URL against scene 7's five lines, so its
plateau is the one whose right edge stretches furthest at the most aggressive
threshold, pushing the rounded centre one frame late. It moves on exactly one
boundary at exactly one threshold, which is the signature of a measurement edge
case. A real render drift would move every cut by the same amount, as it did twice
on run 6.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, no third-party material, cleared for commercial use including paid
advertising, **no attribution line required**. Nothing was downloaded.

Held CONSTANT by instruction, as on all six earlier runs. The hook is the variable
under test, and this run's entire purpose is to vary the EXECUTION of one driver
while everything else holds still. Changing the music here would defeat the
replication before it started.

Source is 60.000 s. Trimmed to 29.000 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 27.5 s**, then two-pass `loudnorm`.

### The fade in is load-bearing and was verified on the DELIVERED file

```
DELIVERED, FIRST 64 SAMPLES, abs max : 0.002953    ceiling 0.005    PASS
DELIVERED, first 10 ms,      abs max : 0.013499
DELIVERED, final 0.1 s,      abs max : 0.019433    (fade out landed)
DELIVERED, overall peak              : 0.6096  (-4.30 dBFS)

SOURCE tension-minor.wav, first 64 samples : 0.061709
SOURCE peak inside its first 0.1 s         : 0.206314
```

The source is at 0.062 by sample 64 and 0.206 within 0.1 s. A hard cut at sample 0
clicks audibly. The delivered file starts at 0.0030.

### Loudness, measured not assumed

Pass 1 on the trimmed cut: `input_i=-16.12`, `input_tp=-4.41`, `input_lra=3.60`,
`input_thresh=-26.23`, `target_offset=-1.18`. The brief's warning is confirmed
again on this material: a single pass would have landed about 1.2 LU off.

Re-measured on the **delivered** `instagram-scored.mp4`, decoding the AAC:

| | Target | Measured |
|---|---|---|
| Integrated | -16 LUFS | **-16.01 LUFS** |
| True peak | -1.5 dBTP max | **-4.28 dBTP** |
| LRA | n/a | 3.60 |

True peak sits 2.8 dB under the ceiling. -1.5 dBTP is a maximum, not a target, and
with `linear=true` the gain is one scalar chosen to hit the integrated target, so
nothing was limited and no shape was altered.

### Honest read

Measured, not listened to.

```
RMS and spectral centroid per 2 s block
   0- 2   -21.34 dBFS    473 Hz   <- fade in, near-silent under the cover card
   2- 4   -21.86         210
   4- 6   -17.76        1202      <- 'Sessions. Sources. Referrers.'
   6- 8   -16.29        1318
   8-10   -16.29        1426
  10-12   -16.56        1386
  12-14   -15.86        2714      <- arrangement opens, on 'It is not sent to you.'
  14-16   -16.65        2414
  16-18   -16.58        1899
  18-20   -16.07        1800
  20-22   -16.00        2118
  22-24   -16.00        2461
  24-26   -15.23        2510      <- loudest block, across the product claim
  26-28   -16.43        2483
  28-29   -24.00        2929      <- fade out
```

```
band levels, dB relative to the full mix
    20-80    Hz   -1.53
    80-160   Hz   -6.60
   160-320   Hz  -14.25
   320-640   Hz  -15.51
   640-1280  Hz  -20.86
  1280-2560  Hz  -26.07
  2560-5120  Hz  -31.80
  5120-10240 Hz  -37.64
 10240-20000 Hz  -40.11
```

**What is good.** RMS climbs about 6.6 dB from the opening block to the 24 to 26 s
block. The quietest four seconds are the cover card alone on screen and the
loudest block lands across the product claim. The bed also opens up at 12 to 14 s,
which happens to sit under `It is not sent to you.`, the scene where this cut turns
from describing a record to describing a loss. None of that was arranged: the
track is fixed and the scene timings were set for reading speed, so it is a
fortunate alignment rather than a designed one, and the same alignment has now
appeared on three consecutive runs with three different scripts.

**The weakness, stated plainly and unchanged across runs.** It is heavily
bottom-weighted. Full-mix RMS is -16.86 dBFS; filtering everything below 300 Hz
leaves **-28.12 dBFS**, an **11.3 dB** drop. On a phone speaker, which has almost
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
  -vf "drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/_probe.txt:x=130:y=120\
:fontsize=70:fontcolor=0xFFFFFF" \
  -frames:v 1 -f rawvideo -pix_fmt gray -        # then numpy: nonzero(a > 40)
```

### 1. Background glows, one frame each

`-update 1 -pix_fmt rgba` is on both writes. Without it alpha is dropped one step
later and the overlays land opaque.

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
  -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=29.0" \
  -loop 1 -i glow-violet.png \
  -loop 1 -i glow-indigo.png \
  -loop 1 -i logo.png \
  -filter_complex_script filtergraph.txt \
  -map "[v]" -an -t 29.0 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 \
  out-silent.mp4
```

The filtergraph is 12,956 characters: 98 filter calls, 33 `drawtext` (32 copy
strings plus the wordmark) and 60 `drawbox` (the rail, the bar track, and 58
progress steps). Structure, with the two special scenes shown:

```
[0:v]format=rgba[base];
[base][1:v]overlay=x='150+40*sin(t/7)':y='900+30*cos(t/9)':format=auto[b1];
[b1][2:v]overlay=x='-500+35*cos(t/8)':y='-340+28*sin(t/6)':format=auto[b2];
[3:v]scale=84:84[lg];
[b2][lg]overlay=x=130:y=282:format=auto[b3];
[b3]drawbox=x=96:y=640:w=4:h=480:color=0x3D2B6B@1:t=fill:replace=1,
  drawbox=x=130:y=1438:w=670:h=5:color=0x2A2C38@1:t=fill:replace=1,

  [progress fill, 58 static boxes, INTEGER FRAME gates, no geometry expression:]
  drawbox=x=130:y=1438:w=12:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(n\,0\,14)',
  drawbox=x=130:y=1438:w=23:h=5:...:enable='between(n\,15\,29)',
  ... 55 more ... final step w=670 at n 855..869,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover, and no y-settle:]
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/s1_0.txt:x=130:y=648
    :fontsize=38:fontcolor=0xA78BFA
    :alpha='max(0\,min(1\,(4.40-t)/0.30))':enable='between(n\,0\,131)',
  ... s1_1 at y=738, s1_2 at y=822, s1_3 at y=950, s1_4 at y=1031 ...

  [scenes 2 to 7, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/s2_0.txt:x=130
    :y='732+18*(1-min(1\,(t-4.40)/0.45))'
    :fontsize=72:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.40)/0.35\,(8.00-t)/0.30)))'
    :enable='between(n\,132\,239)',
  ...

  [scene 8, the CTA, fades IN only so it holds to the final frame:]
  drawtext=...:alpha='max(0\,min(1\,(t-25.90)/0.35))'
    :enable='between(n\,777\,869)',

  noise=alls=3:allf=t+u:all_seed=20260730,
  format=yuv420p[v]
```

The `noise` pass dithers the large soft gradient so H.264 does not band it; its
seed is pinned so the control render can be diffed against the delivered one.

### 3. Control render, for the diff measurement

Identical background and identical noise seed, with the logo, rails, bar and all
type removed.

```bash
ffmpeg -y -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=29.0" \
  -loop 1 -i glow-violet.png -loop 1 -i glow-indigo.png \
  -filter_complex_script filtergraph-control.txt \
  -map "[v]" -an -t 29.0 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 control.mp4
```

### 4. Audio

```bash
# trim 60.000s to 29.000s, 0.08s fade IN (the track is at 0.062 by sample 64 and
# clicks on a hard cut), 1.5s fade OUT
ffmpeg -y -i tension-minor.wav \
  -af "atrim=0:29.0,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,afade=t=out:st=27.5:d=1.5" \
  -c:a pcm_s24le music-cut.wav

# pass 1, measure
ffmpeg -i music-cut.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values
ffmpeg -y -i music-cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11\
:measured_I=-16.12:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.23\
:offset=-1.18:linear=true" -ar 48000 -ac 2 -c:a pcm_s24le music-norm.wav
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

The safe-zone measurement, the noise-floor probe and the frame-edge artefact
demonstration are one numpy pass over two synchronised
`ffmpeg -f rawvideo -pix_fmt rgb24` pipes, the delivered file and the control,
decoded sequentially with no seeking, over all 870 frames, reduced to a global
extreme. The bar-animation check and the scene-boundary check are separate passes
over the delivered file alone, for the reasons given above. The compliance scan is
a separate pass over the `textfile=` bytes ffmpeg opened.

---

## Every trap in the brief, and how it was handled

Applied as preconditions, not discovered:

| Trap | Handling |
|---|---|
| `drawbox` blends on RGBA | `replace=1` on all 60 boxes, with pre-blended opaque colours so nothing depends on alpha |
| `drawbox` cannot animate | 58 literal static boxes, `enable` is the only expression, then verified to move on the delivered file |
| Single-digit headroom is a paper pass | smallest edge is **+55 px**; reported per edge, never as "passes" |
| Guess the ink threshold | background peak printed first (39.7), four thresholds inside the gap agree |
| Set the diff threshold above a MEASURED noise floor | floor measured at 9, 10, 10 in three empty-by-design regions; threshold 12; sweep shows 12 to 24 within 2 px on any edge and exact on the right |
| Fade in on scene 1 | scene 1 hard-starts and has no y-settle; cover MD5-matched to frame 0 |
| Furniture counts as ink | all five furniture rects declared and folded in; furniture binds top and bottom |
| Measure the intermediate | every number comes from the delivered mp4 |
| Diff against a flat canvas | diffed against a text-free control; the flat-colour method run too, purely to show it returns the whole frame on an empty control |
| Dark-on-dark furniture invisible to both pixel methods | progress track at luma 44, 4 above the background peak, folded in by declared rect |
| A control diff cannot separate overlapping elements | bar animation measured with an absolute luma threshold at 70, between track (44) and fill (113), not with the diff |
| Fade the music IN | 0.08 s fade in, first 64 samples at 0.002953 against a source that is at 0.061709 |
| A mux can exit 0 and be unreadable | both files probed for duration and stream count |
| `ffconcat` drift | no concat; all gates are integer frame indices, boundaries verified on the delivered file |
| Frame hashing | ink-pixel counting, not hashing; 34 of 35 boundary detections exact across five thresholds, the one miss explained above |
| A uniform offset means the detector is wrong | checked for explicitly: the single mismatch moves one boundary at one threshold, not every boundary by the same amount |
| `-ss` near a cut | no seeking anywhere in any measurement |
| `-shortest` | on the mux; 640 samples of AAC padding confirmed present in the packets and excluded by the sample table |
| `color=black@0.0` does not survive format negotiation | not applicable, and deliberately so: this build draws directly onto the composited base in one chain rather than compositing transparent text layers, so there is no RGBA layer whose alpha could be dropped. `-update 1 -pix_fmt rgba` is still used on the two glow PNGs, and both were probed as `rgba` |
| PNG intermediates, not JPEG | glows and cover are PNG; no JPEG anywhere, so no `yuvj420p` range shift |
| Provenance is on the FIGURE, not the page | no figure appears; the cut publishes no measured result at all |
| Engine count is a claim about the lineup on the day | no collection date and no finding on screen; `five` read from `planConfig.ts`, not from a research page |
| Never a superlative | none written; scan covers 17 forms |
| Never a universal | none written; scan covers 20 universals plus 8 hedged forms. Run 1's own payoff line would fail this scan, which is the argument for having it |
| Never name a measured subject | mechanical scan of 3088 candidates from all 80 published pages; five names on screen, all five engines. Two sub-span false positives fixed by a rule change, not a stoplist |
| The brief is itself a vector for bad claims | every check reads the `textfile=` bytes ffmpeg opened, parsed out of the filtergraph, and exits non-zero. Nothing is checked against the brief's wording or the copy source |

**Two things went wrong this run and both were caught before delivery.** The first
type-width pass left 45 px of right headroom, which the brief classes as a paper
pass; nine strings were re-set smaller and re-probed before any encoding happened.
And the compliance scan reported two measured subjects that were sub-spans of an
allowed engine name, fixed by making the matcher span-aware rather than by adding
two exceptions.

## Scope

This task was scoped to this `instagram/` folder. Exactly the four required files
were written and nothing else, anywhere. `RUN.md` for run `20260730-0413` was
deliberately **not** created, since it sits outside the granted scope. No git
command was run.

## Nothing was posted or scheduled

These are files for review only.
