# Instagram Reel, run 20260730-0313

**Hook driver:** #6, utility, "run this check on your own domain in ten seconds".
This completes the six-driver cycle.

Runs 1 to 5 used loss aversion, status threat, curiosity gap, contrarian and
concrete proof. Five of those argue and the sixth, concrete proof, presents an
artefact and invites the viewer to verify it. **This one does neither. It gives
the viewer a procedure and steps out of the way.**

The practical difference is that the value is delivered *inside the video*. A
viewer who watches this and never visits anything still leaves with a thing they
can do in the next minute, and it genuinely works. Three of the eight scenes are
literally labelled `STEP ONE`, `STEP TWO`, `STEP THREE`, and a fourth is the
example query written out so it can be copied off the screen. Nothing in the cut
requires the viewer to visit `getbrandgeo.com` to get the benefit.

**It concedes the obvious objection out loud rather than hoping nobody raises
it.** Anyone can type a buyer question into an AI engine and read the answer.
That is free, it needs no account, and it tells you something real. Scene 6 says
so in as many words: `That is the whole check. It is free.` Pretending otherwise
would be the one thing that could make this driver backfire, because the viewer
can disprove it in ten seconds using the method the video just taught them.

What the product adds is stated immediately afterwards and is deliberately
narrow: the manual check is `One engine. One day.`, and BrandGEO runs the same
question `across five engines, over and over, keeping the record.` One check is a
snapshot; the record is the work. That is the only claim in the cut, and it is a
claim about the **method**, not about people.

### The universal ban, and why nothing had to be re-rendered

Mid-run the campaign added a rule alongside the existing superlative ban: **no
universal on screen** (`nobody`, `no one`, `everyone`, `always`, `never`,
`cannot`, `every business`), and no hedged version of one either (`almost
nobody`, `few people can`), which is the same unverifiable claim with
deniability. The reasoning is identical to the superlative rule that cost run 5
two re-renders: "a person cannot do this by hand" is a claim about all people, and
one person with a spreadsheet and an alarm refutes it.

The originating phrase, "the part a person cannot do by hand", came from the
run brief and was **never written into a rendered string here.** It existed only
in the brief and in an earlier draft of this paragraph. The eight scenes were
already built to contrast a snapshot with a record rather than to contrast a
product with a person, so scene 6 says `One engine. One day.` about the
*procedure* and scene 7 says `over and over, keeping the record.` about the
*method*. Neither mentions people at all.

Confirmed mechanically rather than by re-reading. The scan was extended with a
universal and hedge pass over all 32 rendered strings:

```
UNIVERSAL hits        : NONE
hedged-universal hits : NONE
```

So the delivered files stand as rendered. Nothing was annotated in place of a
re-render, because there was nothing on screen to annotate.

Worth recording for the next run: this is the second rule in this campaign of the
form *a claim whose scope exceeds what the asserting surface can verify*. The
superlative ban covers claims about every other page in the corpus; this one
covers claims about every other person. They are the same failure and it would be
cheaper to check for the shape than to keep enumerating the words.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows; `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 4,577,475 bytes, scored 5,323,073 bytes, cover 266,410 bytes.

Naming follows runs 1 to 5 (`-scored`, not the brief's older `-bed`). The brief's
deliverables block still says `-bed.mp4` from when the fallback was a synthesized
`sine`/`aevalsrc` bed; since the 2026-07-29 update the fallback is a composed
track and every run so far has shipped it as `-scored`. Consistency inside the
campaign matters more than the stale filename, since these runs are meant to be
compared against each other.

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=130. Each block is vertically centred on y=880, the centre of the 220..1500
visible band.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282), the wordmark
`BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a progress
bar at y=1438.

**0.00 to 4.40 s**, kicker Inter SemiBold 40 accent `#A78BFA`, body Bold 84 ink
`#E8E9ED`, close ExtraBold 76 accent. Hard in at full opacity, no fade up, because
this frame is the cover.
```
TEN SECOND CHECK

Does AI name
your business?

Find out now.
```

**4.40 to 8.20 s**, kicker SemiBold 40 accent, body Bold 76 ink
```
STEP ONE

Open ChatGPT,
Gemini, Claude
or Perplexity.
```

**8.20 to 11.80 s**, kicker SemiBold 40 accent, body Bold 76 ink, close
ExtraBold 70 accent
```
STEP TWO

Type what a
buyer would ask.

Not your name.
```

**11.80 to 15.40 s**, kicker SemiBold 40 accent, then the query in Inter
**SemiBold** 60 ink. Set in SemiBold rather than the Bold/ExtraBold used
everywhere else, and the only block carrying quote marks: this is a thing to be
copied, not the video's own voice.
```
LIKE THIS

"best [what you sell]
in [your city]"
```

**15.40 to 19.00 s**, kicker SemiBold 40 accent, body Bold 76 ink, close
ExtraBold 70 accent
```
STEP THREE

Read the answer.
Count the names

above yours.
```

**19.00 to 22.60 s**, body Bold 72 ink, then ExtraBold 68 accent. The weight
change is where the cut stops teaching and starts conceding.
```
That is the whole
check. It is free.

One engine.
One day.
```

**22.60 to 26.00 s**, body Bold 68 ink, close ExtraBold 64 accent
```
We run it across
five engines,
over and over,

keeping the record.
```

**26.00 to 29.00 s**, body Bold 74 ink, URL SemiBold 54 accent. Fades in only,
no fade out, so the CTA holds to the last frame.
```
Do the check.
Then see the
whole picture.

getbrandgeo.com
```

32 strings including the wordmark.

---

## Every claim on screen, and where it comes from

This driver has an unusual property worth stating plainly: **it publishes no
measured result, so it cites no research page at all.** Scenes 1 to 5 are
instructions. Scene 6 is a concession about the method just taught. Scenes 7 and
8 describe what the product does. There is no finding, no rate, no ranking and no
result set anywhere in the cut.

That is not evasion, it is what the driver is. It also means the entire class of
provenance failure the brief warns about cannot arise here: there is no borrowed
third-party statistic to launder, and no page-level superlative to quote.

| On screen | Status | Source |
|---|---|---|
| `TEN SECOND CHECK` | Instruction, framed as the time the procedure takes | Not a measurement, not a result. See below. |
| `Open ChatGPT, Gemini, Claude or Perplexity.` | Instruction | Four of the five `PLAN_ENGINES.growth` engines, read from `planConfig.ts:57` |
| `Type what a buyer would ask. Not your name.` | Instruction | Method statement |
| `"best [what you sell] in [your city]"` | Template, with bracketed placeholders | Not a real prompt from any result set |
| `Read the answer. Count the names above yours.` | Instruction | Method statement |
| `That is the whole check. It is free.` | Concession | True: the manual check costs nothing |
| `One engine. One day.` | Concession, the limit of the manual check | Follows from the procedure above it |
| `We run it across five engines, over and over, keeping the record.` | Product claim | `planConfig.ts:57`, `PLAN_ENGINES.growth` has exactly 5 entries |

### `TEN SECOND CHECK` is the one number, and it is an instruction

The brief allows an illustrative figure provided it is not framed as a
measurement or a result. "Ten seconds" is the duration of an action the viewer is
being told to perform. It is not a finding, it describes nothing BrandGEO
measured, and it makes no claim about any engine, any brand or any market. It is
also the shape the driver was specified with.

It is spelled as a **word**, not a digit, which is why the digit scan below
returns nothing at all.

### The example query is a template, deliberately

`"best [what you sell] in [your city]"` uses bracketed placeholders rather than a
real published prompt. Run 5 used a byte-exact prompt from a research page, which
was right for concrete proof, and would be wrong here for two reasons. A real
prompt names a real category and a real city, which makes it *that* prospect's
question rather than *this* viewer's. And a real prompt is one keystroke from a
real result set, which is where measured subjects live. The template is both more
useful and structurally incapable of naming anyone.

### What `five engines` is, and what it is not

It is a count of what the product runs, read out of `planConfig.ts`, verified
mechanically:

```
planConfig.ts PLAN_ENGINES.growth : ['chatgpt','gemini','claude','perplexity','google_ai']  (n=5)
'five engines' on screen          : 1x   matches len(growth)=5 : True
```

It is **not** an engine count attached to a finding, which is the trap the brief
records against `bg-004` and `bg-016`. Those pages name the engines that were
live on a past collection date, and one of them names retired Meta AI. No
collection date appears in this cut, so there is no lineup to get wrong.

The four engines named in `STEP ONE` are a subset of that five. Google AI Mode is
the fifth and is deliberately left out of the instruction: it is a surface inside
Google Search rather than something a viewer "opens", so listing it as a step-one
option would make the instruction slightly wrong. It is covered by `five engines`
in scene 7, which is the accurate place for it.

### Sources deliberately not used

- **`bg-016.html`**: excluded by instruction. Not opened, not cited.
- **`bg-004.html`**: no engine count taken from it, per instruction. Not cited.
- **`bg-005.html`'s 48% and 93%**: third-party figures sitting inside a
  first-party page. Not used and not consulted.
- **"27 cities"**: never written.
- **No Grok, no AI Overviews, no rate for either.** Both went live 2026-07-29
  with 5 and 6 rows from a single day.
- **Meta AI is retired** and appears nowhere.
- **No superlative of any kind.** This driver needs none, and none was written.
  The scan below covers first, only, most, never, biggest, unique, fastest and
  largest.

---

## Compliance check on the copy, run mechanically

`checks.py` matches the 32 rendered strings against names extracted from the
whole published corpus. It is a match, not a read.

```
pages scanned                        : 80   (all of brandgeo/web/*.html)
capitalised candidates extracted     : 3069
survive the lowercase-elsewhere test : 1577
corpus names appearing on screen     : []
of those, MEASURED SUBJECTS          : NONE

forbidden engines on screen : NONE   (Grok, AI Overview(s), Meta AI, Copilot,
                                      DeepSeek, Bing, Llama all absent)
banned vocabulary hits      : NONE
superlative hits            : NONE
UNIVERSAL hits              : NONE   (nobody, no one, everyone, everybody,
                                      always, never, cannot, can't, every
                                      business, anyone can, impossible, no
                                      human, by hand)
hedged-universal hits       : NONE   (almost nobody, almost no one, few people,
                                      hardly anyone, virtually nobody)
pricing / plan-name hits    : NONE
dash codepoints             : NONE   (em, en, figure, minus, horizontal bar)
non-ASCII characters        : NONE
digit strings on screen     : NONE
hyphen-minus U+002D         : 0 occurrences

OVERALL : PASS
```

- **No measured subject is named**, and this cut is structurally incapable of
  naming one: it reports no result, so no result set is drawn from. The scan was
  run anyway, across all 80 published pages rather than a single source, because
  a scan restricted to the pages you happened to open proves less than one run
  over everything.
- **The removal test is trivially satisfied.** There is no name to remove.
- **Engines on screen are instruments.** ChatGPT, Gemini, Claude and Perplexity
  are named because a procedure that does not say where to type is not a
  procedure. All four are in `PLAN_ENGINES.growth`.
- **No pricing, no plan names, no currency, no percent sign.** The check
  specifically greps for `Essentials`, `Growth`, `Managed` and `Enterprise` as
  well as currency symbols, since a plan name is pricing by another route. Zero
  hits. TOFU asset, soft CTA, the URL is the only ask.
- **Zero digits on screen.** `TEN`, `ONE`, `TWO`, `THREE`, `five` and `One` are
  all words. That is not an accident of phrasing, it was a design constraint:
  every digit on screen in this campaign has needed a provenance argument, and
  this driver had no reason to spend one.

### A bug in my own scan, found and fixed mechanically

The first pass reported four measured subjects: `Do`, `Does AI`, `It`, `We`.

None is a company. The fault was in the filter, not the copy. The scan decides a
capitalised token is a real proper noun if it never appears lowercase elsewhere in
the corpus, and the lowercase sweep was written as `\b[a-z]{3,}\b`. Words of one
or two letters therefore never entered the comparison set, so sentence-initial
`Do`, `It` and `We` had nothing to be cancelled against.

The fix is the minimum length, `\b[a-z]+\b`, plus a rule that a multi-word
candidate needs at least one component that is neither a common lowercase word nor
a known category term, which clears `Does AI`. **The fix is a change to the rule,
not an addition to a stoplist.** Extending a hand-written exception list until the
output looks clean is how a scan stops being evidence; run 5's notes make the same
point about the same class of false positive. After the fix, 1577 of 3069
candidates survive and zero appear on screen.

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
so the padding exists as packet payload and is never played. `-shortest` is what
holds that line.

Both files: H.264 High, `yuv420p`, from PNG intermediates only. No JPEG anywhere,
so no `yuvj420p` range shift.

### The timeline is frame-indexed, and nothing is concatenated

No `ffconcat` anywhere. Every timeline gate in the filtergraph is an **integer
frame index**, never a float scene time:

```
s1 frames   0..131     s5 frames 462..569
s2 frames 132..245     s6 frames 570..677
s3 frames 246..353     s7 frames 678..779
s4 frames 354..461     s8 frames 780..869
```

`enable='between(n,132,245)'`, not `between(t,4.40,8.20)`. The 58 progress-bar
steps are gated the same way. No float is compared to a frame time anywhere.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 870 frames**, no seeking anywhere, reduced to a global extreme.
Two independent methods, plus declared geometry folded in explicitly.

### The type-width probe ran BEFORE the master

All 31 copy strings were rendered alone at their final font and size and measured,
so the right reserve was checked before 29 seconds of encoding rather than after.

```
widest string        : 'Read the answer.'  Inter-Bold 76
reaches x            : 761
right reserve limit  : x <= 900
HEADROOM             : 139 px          (failure floor 20)
block top (min)      : 677   (limit >= 220)
block bottom (max)   : 1083  (limit <= 1500)
```

Type is nowhere near binding this run, which is the expected consequence of a
driver built from short imperative lines. Run 5, concrete proof, was the tightest
of the cycle because a verbatim prompt cannot be re-broken; a procedure can.

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays, same
noise seed (`all_seed=20260730`), no logo, no rails, no bar, no type.

```
control peak luma, whole frame           39.7
control peak luma, copy band y400..1400  35.9
delivered peak luma, x >= 940 (empty)    37.9
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
so thresholds of 45, 60 and 90 all sit inside it. **The progress track at luma 44
is 4 above the background peak and is not separable by any threshold.** That is
why method B exists and why declared geometry is folded in on top of it.

### The diff threshold was set above a MEASURED noise floor

The brief's corrected rule: a control cancels artefacts it shares, but it cannot
cancel the encoder's response to content it does not have. Adding text changes
libx264 rate control across the whole frame. So the noise floor was measured in
three regions that are empty by design in the delivered file:

```
x>=940     max channel diff = 10
y>=1520    max channel diff = 10
y<=260     max channel diff = 10
  -> noise floor 10; threshold must sit ABOVE it
```

All three regions agree on exactly 10, which is what makes 12 defensible rather
than chosen by feel. The sweep then shows precisely where the floor bites:

```
diff >  3 : y    0..1919  x    0..1079   <-- at/below noise floor, whole frame
diff >  5 : y    0..1919  x    0..1079   <-- at/below noise floor, whole frame
diff >  8 : y   37..1918  x   23..1079   <-- at/below noise floor
diff > 10 : y  281..1445  x   95..800    <-- AT the floor, 1 px loose on 3 edges
diff > 12 : y  282..1445  x   96..799        <-- CHOSEN
diff > 14 : y  282..1445  x   96..799
diff > 18 : y  282..1445  x   96..799
diff > 24 : y  282..1443  x   96..799
```

Thresholds 12 through 18 return an identical box. That plateau, not the single
number, is the evidence. Had the threshold been picked by eye at 6, as run 5's
Facebook build did, this build would have reported a false failure on every edge.

### Method B, per-pixel diff against the control (authoritative)

```
GLOBAL INK BOX, union of everything drawn, 870 frames, diff > 12:

  top    y =  282    limit >=  220    margin  +62 px
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
luma > 120 : y  302..1442  x  130..793   top +82  bottom +58  right +107
```

The two methods agree on the right edge exactly (799) and every difference
elsewhere is explained rather than waved at. **Per the brief, the method finding
MORE ink is trusted, and that is B on both remaining edges:**

- **Top, 282 vs 301.** 19 px. The logo card is drawn at y=282 and its rounded
  corners are near-black, so a luma threshold cannot see the top of it. The
  binding number is **282**.
- **Bottom, 1445 vs 1442.** The bar is drawn at y=1438 h=5, so its last lit row
  is 1442 and method B picks up 3 rows of encoder bleed.
- **Right, 799 in both.** The progress bar at full extension. Method A at 120
  reports 793 because it has already lost the fill's antialiased right edge; the
  lower thresholds, which can still see it, agree with B.

### Declared geometry, folded in explicitly

Per the brief's blind-spot rule, every element drawn near the canvas value has its
declared rect folded into the union rather than trusted to measurement:

```
logo card       x 130..213   y  282..365
wordmark        x 236..403   y  303..347     (measured ink 238..403)
left rail       x  96.. 99   y  640..1119
progress track  x 130..799   y 1438..1442
progress fill   x 130..799   y 1438..1442
furniture union x  96..799   y  282..1442
```

The declared union does not exceed the measured union on any edge, so method B did
in fact see all of it. That is a confirmation, not a substitute.

### Final result

```
EVERYTHING DRAWN, measured OR declared, whichever is worse:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  799    limit <=  900    margin +101 px

  SMALLEST HEADROOM ON ANY EDGE : +55 px    (failure floor is 20)
  RESULT: PASS
```

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Which element sets each extreme

- **Top 282** is the brand icon card.
- **Bottom 1445** is the progress bar at y=1438 h=5, plus 3 rows of encoder bleed.
- **Right 799** is the progress bar at full extension. Type's own right extent is
  761, so the bar is 38 px wider than the widest word.
- **Left 96** is the accent rail.

**Furniture binds on all three edges, and type binds on none.** The bar was kept
at 670 px wide, ending at x=799, for consistency with run 5 rather than widened
into the 139 px of unused type headroom. Widening it would have bought nothing
and would have made the right reserve a live constraint again on the next run
that carries longer copy.

---

## Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(4.40-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene, and no y-settle on scene 1
either, since a settle would also move frame 0.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 875c4bf26bf1e63310faf836a1868df4
instagram-cover.png             : 875c4bf26bf1e63310faf836a1868df4
```

Video stream MD5, identical across both cuts: `5c6d882a5f6f5d7df545f010e6b79d3f`.

The cover carries `TEN SECOND CHECK / Does AI name your business? / Find out now.`
That is a complete offer on a still frame, which matters more for this driver than
for any other: the thumbnail has to read as something to do, not something to
believe.

---

## Progress bar actually animates

The brief's `drawbox` trap was respected up front: geometry is literal on every
box and the only expression anywhere in the bar is `enable`. The fill is **58
discrete static boxes**, one per 0.5 s, at literal widths, each gated on an
integer frame range.

Verified on the DELIVERED file by reading row y=1440 of every decoded frame, with
an **absolute luma threshold at 70**, which sits between the track (44) and the
fill (113):

```
frame   0  t= 0.000s   fill width =  24 px
frame  30  t= 1.000s   fill width =  47 px
frame 105  t= 3.500s   fill width = 103 px
frame 300  t=10.000s   fill width = 251 px
frame 600  t=20.000s   fill width = 477 px
frame 750  t=25.000s   fill width = 591 px
frame 869  t=28.967s   fill width = 670 px

monotonic non-decreasing : True
58 distinct widths, min 24, max 670  ->  ANIMATES
```

A luma threshold is used here and not the control diff, deliberately. The diff
sees the progress **track**, drawn full width on frame 0, exactly as it sees the
fill sliding across it, and would report a frozen bar. That false failure is
recorded in run 5's notes; it was avoided here by choosing the tool to match the
question rather than reusing the safe-zone method.

### Scene boundaries, and two wrong detectors before a right one

Frames were decoded sequentially in one pass and indexed, no `-ss` seeking
anywhere, and scene changes were found by counting ink pixels per frame rather
than hashing. Getting the right answer took three attempts and both failures are
worth recording, because both looked like render defects and neither was.

**Attempt 1, first frame where the ink count jumps by more than a fixed delta.**
Returned `127, 240, 349, 458, 564, 673, 774` against scripted
`132, 246, 354, 462, 570, 678, 780`: **5 to 6 frames early on all seven.** The
detector was firing on the fade-out RAMP. Scenes cross-fade, so ink starts falling
9 frames before the cut.

**Attempt 2, local minimum of the ink count.** Returned
`130, 244, 352, 460, 568, 676, 778`: **exactly 2 frames early on all seven.** The
cross-fade drives both scenes below any ink threshold for a *run* of frames, not
for one, and the detector was returning the first frame of a plateau.

**Attempt 3, the centre of that plateau.** The outgoing alpha reaches 0 exactly at
the cut and the incoming rises from 0 there, so the dark window is symmetric about
the cut. The centre is the boundary. Cross-checked by sweeping the ink threshold,
which must change the plateau's WIDTH but must not move its CENTRE:

```
ink thr   plateau widths                    centres
     45   []                                []                                     no plateau
     55   [3,3,3,3,3,3,3]                   [132,246,354,462,570,678,780]   MATCH
     70   [5,5,5,5,5,5,5]                   [132,246,354,462,570,678,780]   MATCH
     90   [6,7,6,7,6,6,6]                   [132,246,354,462,570,678,780]   MATCH
    120   [9,9,9,9,9,9,9]                   [132,246,354,462,570,678,780]   MATCH
    150   [12,12,12,12,12,12,12]            [132,246,354,462,570,678,780]   MATCH

scripted  [132,246,354,462,570,678,780]
times     [4.4, 8.2, 11.8, 15.4, 19.0, 22.6, 26.0]
```

Five thresholds, seven cuts each, exact frame match on all 35, none extra and none
missing. Threshold 45 forms no plateau at all, which is the expected result rather
than a failure: at 45 the fading text never drops below the threshold, so there is
no dark window to find. Width grows monotonically (3, 5, 6, 9, 12) while the centre
does not move, and that invariance is the evidence.

**The general form, which belongs with the brief's existing traps:** a detector
tuned on a *step* will mis-locate a *cross-fade* by roughly the fade length, and
it will do so consistently enough across every boundary to look like a systematic
render offset rather than a measurement error. A uniform 5-frame or 2-frame error
on all seven cuts is a signature of the detector, not of the encoder. Sweeping a
parameter that should change the measurement's shape but not its answer is what
separates the two.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, generated by `scripts/compose_music.py`, no third-party material,
cleared for commercial use including paid advertising, **no attribution line
required**. Nothing was downloaded.

Held CONSTANT across all six runs by instruction: the hook is the variable under
test, and changing the music in the same run that changes the driver would leave a
result with two candidate explanations and no way to separate them. This matters
more on the final run of the cycle than on any earlier one, since the six drivers
are only comparable to each other if everything except the hook held still for all
six. `ATTRIBUTION.md` maps `tension-minor` to loss aversion and status threat and
maps a separate `clean-utility` track to this driver; that mapping is deliberately
overridden here for exactly this reason, as it was on runs 3, 4 and 5.

Source is 60.000 s. Trimmed to 29.000 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 27.5 s**, then two-pass `loudnorm`.

### The fade in is load-bearing and was verified

Measured on the **delivered** file, by decoding the AAC, with the untrimmed source
alongside it to show what the fade is preventing:

```
DELIVERED, FIRST 64 SAMPLES, abs max : 0.003650    ceiling 0.005    PASS
DELIVERED, first 10 ms,      abs max : 0.016757
DELIVERED, final 0.1 s,      abs max : 0.025613    (fade out landed)
DELIVERED, overall peak              : 0.7154  (-2.91 dBFS)

SOURCE tension-minor.wav, first 64 samples : 0.067873
SOURCE peak inside its first 0.1 s         : 0.281608
```

The source is at 0.068 by sample 64 and 0.282 within 0.1 s. A hard cut at sample 0
clicks audibly. The delivered file starts at 0.0037.

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
   0- 2   -18.33 dBFS    473 Hz   <- fade in, deliberately quiet, under the hook
   2- 4   -18.85         210
   4- 6   -14.75        1202      <- STEP ONE
   6- 8   -13.28        1318
   8-10   -13.28        1426
  10-12   -13.55        1386
  12-14   -12.85        2714      <- arrangement opens, on the example query
  14-16   -13.64        2414
  16-18   -13.57        1899
  18-20   -13.06        1800
  20-22   -12.99        2118
  22-24   -12.99        2461
  24-26   -12.22        2510      <- loudest block, on "keeping the record."
  26-28   -13.42        2483
  28-29   -20.99        2929      <- fade out
```

```
band levels, dB relative to the full mix
    20-80    Hz   -1.68
    80-160   Hz   -6.68
   160-320   Hz  -13.40
   320-640   Hz  -13.33
   640-1280  Hz  -20.37
  1280-2560  Hz  -25.27
  2560-5120  Hz  -31.29
  5120-10240 Hz  -36.91
 10240-20000 Hz  -40.10
```

**What is good.** RMS climbs about 6.1 dB from the opening block to the 24 to 26 s
block. The quietest stretch is the first 4 seconds, which is the hook alone on
screen, and the loudest is 24 to 26 s, on `keeping the record.` For a cut that
spends its first two thirds teaching and its last third making a single narrow
claim, having the bed near-absent during the instructions and peaking on the claim
is the right shape. It was not arranged that way: the track is fixed and the scene
timings were set for reading speed, so this is a fortunate alignment rather than a
designed one, and the same alignment appeared on run 5 for a different script.

**The weakness, stated plainly and unchanged across runs.** It is heavily
bottom-weighted. Full-mix RMS is -13.85 dBFS; filtering everything below 300 Hz
leaves **-25.41 dBFS**, an **11.6 dB** drop. On a phone speaker, which has almost
nothing under 200 Hz, this will play noticeably softer and thinner than -16 LUFS
suggests, and most of what carries the build sits in the quietest bands.

That is not a reason to change the default. **`instagram-silent.mp4` is still the
file to upload organically**, because Instagram's in-app library is licensed for
the platform and favoured by its distribution. `instagram-scored.mp4` is for paid,
embeds and decks, where the in-app library does not exist.

---

## Exact commands

Paths are relative to a build directory holding `fonts/` (the vendored Inter files,
copied unmodified from `docs/growth/grok-launch/images/_build/fonts/`), `txt/` (one
file per on-screen line, used through `textfile=` so no filtergraph escaping is
needed), `logo.png` (copied from
`docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png`),
`tension-minor.wav` (copied from `assets/audio/music/`), and the two generated glow
PNGs.

### 0. Type-width probe, run BEFORE the master

```bash
ffmpeg -v error -y -f lavfi -i "color=c=black:s=1080x400" \
  -vf "drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/s5_1.txt:x=130:y=60\
:fontsize=76:fontcolor=0xFFFFFF" \
  -frames:v 1 -f rawvideo -pix_fmt gray - | (numpy: nonzero(a > 40))
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

The filtergraph is 12,778 characters: 92 filter calls, 32 `drawtext` (31 copy
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
  drawbox=x=130:y=1438:w=24:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(n\,0\,14)',
  drawbox=x=130:y=1438:w=35:h=5:...:enable='between(n\,15\,29)',
  ... 55 more ... final step w=670 at n 855..869,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover, and no y-settle:]
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/s1_0.txt:x=130:y='677'
    :fontsize=40:fontcolor=0xA78BFA
    :alpha='max(0\,min(1\,(4.40-t)/0.30))':enable='between(n\,0\,131)',
  ... s1_1 at y=760, s1_2 at y=862, s1_3 at y=990 ...

  [scenes 2 to 7, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/s2_1.txt:x=130
    :y='782+18*(1-min(1\,(t-4.40)/0.45))'
    :fontsize=76:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-4.40)/0.35\,(8.20-t)/0.30)))'
    :enable='between(n\,132\,245)',
  ...

  [scene 8, the CTA, fades IN only so it holds to the final frame:]
  drawtext=...:alpha='max(0\,min(1\,(t-26.00)/0.35))'
    :enable='between(n\,780\,869)',

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
# trim 60.000s to 29.000s, 0.08s fade IN (the track is at 0.068 by sample 64 and
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

The safe-zone measurement, the noise-floor probe and the frame-edge artefact
demonstration are one numpy pass over two synchronised
`ffmpeg -f rawvideo -pix_fmt rgb24` pipes, the delivered file and the control,
decoded sequentially with no seeking, over all 870 frames, reduced to a global
extreme. The bar-animation check and the scene-boundary check are separate passes
over the delivered file alone, for the reasons given above.

---

## Every trap in the brief, and how it was handled

Applied as preconditions, not discovered:

| Trap | Handling |
|---|---|
| `drawbox` blends on RGBA | `replace=1` on all 60 boxes, with pre-blended opaque colours so nothing depends on alpha |
| `drawbox` cannot animate | 58 literal static boxes, `enable` is the only expression, then verified to move on the delivered file |
| Single-digit headroom is a paper pass | smallest edge is **+55 px**; reported per edge, never as "passes" |
| Guess the ink threshold | background peak printed first (39.7), three thresholds inside the gap agree |
| Set the diff threshold above a MEASURED noise floor | floor measured at exactly 10 in three empty-by-design regions; threshold 12; sweep shows 12 to 18 return an identical box |
| Fade in on scene 1 | scene 1 hard-starts and has no y-settle; cover MD5-matched to frame 0 |
| Furniture counts as ink | all five furniture rects declared and folded in; furniture binds all three edges this run |
| Measure the intermediate | every number comes from the delivered mp4 |
| Diff against a flat canvas | diffed against a text-free control; the flat-colour method run too, purely to show it returns the whole frame on an empty control |
| Dark-on-dark furniture invisible to both pixel methods | progress track at luma 44, 4 above the background peak, folded in by declared rect |
| A control diff cannot separate overlapping elements | bar animation measured with an absolute luma threshold at 70, between track (44) and fill (113), not with the diff |
| Fade the music IN | 0.08 s fade in, first 64 samples at 0.003650 against a source that is at 0.067873 |
| A mux can exit 0 and be unreadable | both files probed for duration and stream count |
| `ffconcat` drift | no concat; all gates are integer frame indices, boundaries verified on the delivered file |
| Frame hashing | ink-pixel counting, not hashing; seven cuts detected at the exact scripted frames across five ink thresholds |
| `-ss` near a cut | no seeking anywhere in any measurement |
| `-shortest` | on the mux; 640 samples of AAC padding confirmed present in the packets and excluded by the sample table |
| `color=black@0.0` does not survive format negotiation | not applicable, and deliberately so: this build draws directly onto the composited base in one chain rather than compositing transparent text layers, so there is no RGBA layer whose alpha could be dropped. `-update 1 -pix_fmt rgba` is still used on the two glow PNGs |
| PNG intermediates, not JPEG | glows and cover are PNG; no JPEG anywhere, so no `yuvj420p` range shift |
| Provenance is on the FIGURE, not the page | no figure appears; the cut publishes no measured result at all |
| Engine count is a claim about the lineup on the day | no collection date and no finding on screen, so no lineup to date; `five engines` read from `planConfig.ts` |
| Never a superlative | none written; scan covers first, only, most, never, biggest, unique, fastest, largest |
| Never a universal (added mid-run) | none written; scan covers 13 universals plus 5 hedged forms. The originating phrase came from the brief and never reached a rendered string, so no re-render was needed |
| Never name a measured subject | mechanical scan of 3069 candidates from all 80 published pages; zero on screen. The cut cites no result set, so there is none to draw from |

**Three things went wrong this run and all three were caught by measurement.** The
scene-boundary detector was wrong twice in two different ways, both producing a
consistent offset across all seven cuts that looked like a render defect and was
not. And the compliance scan's own lowercase filter had a minimum-length bug that
produced four false measured-subject hits. All three are written up above rather
than quietly fixed, because each is a measurement fault of the class the brief
exists to catalogue.

## Scope

This task was scoped to this `instagram/` folder. Exactly the four required files
were written and nothing else, anywhere. `RUN.md` for run `20260730-0313` was
deliberately **not** created, since it sits outside the granted scope. No git
command was run.

## Nothing was posted or scheduled

These are files for review only.
