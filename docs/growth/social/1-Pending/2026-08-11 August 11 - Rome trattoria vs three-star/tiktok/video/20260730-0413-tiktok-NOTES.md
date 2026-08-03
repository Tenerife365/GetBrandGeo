# TikTok cut, run-20260730-0413

**Hook driver: #1, LOSS AVERSION. Second pass.** The six-driver cycle completed
at run-20260730-0313, so this begins a replication round against
run-20260729-2200, which used the same driver.

**This cut exists to separate the DRIVER from the EXECUTION.** If run 1 performs
well, run 1 alone cannot tell us whether loss aversion works or whether that
particular cut worked. This is a deliberately different execution of the same
driver. Nothing about run 1's structure, opening, device or lines is reused.

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. For paid, site embeds and decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, verified byte-identical. |

**Silent is the one to upload.** In-app audio is a ranking input on TikTok, not
just a licence convenience.

---

## On-screen text, verbatim

19 scenes, 930 frames, 31.000s. Every line is a separate `drawtext`. All 18
boundaries were verified by decoding all 930 frames of the delivered file in one
sequential pass and land exactly where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 15 | 0.000 to 0.500 | label `WHERE YOUR BUYERS CAME FROM` + rows `SEARCH` `SOCIAL`, each with a filled slot |
| 2 | 15 | 0.500 to 1.000 | + `EMAIL` + filled slot |
| 3 | 15 | 1.000 to 1.500 | + `DIRECT` + filled slot |
| 4 | 60 | 1.500 to 3.500 | + `AI ANSWERS` in accent, with an EMPTY outlined slot |
| 5 | 60 | 3.500 to 5.500 | same table, plus `ONE ROW` / `IS BLANK.` (accent) |
| 6 | 57 | 5.500 to 7.400 | `THE ANSWER` / `HAPPENED` / `OFF YOUR SITE.` |
| 7 | 57 | 7.400 to 9.300 | `A BUYER ASKED.` / `AN ENGINE` / `ANSWERED.` |
| 8 | 57 | 9.300 to 11.200 | `A SHORTLIST` / `WAS SET.` (accent) |
| 9 | 66 | 11.200 to 13.400 | `YOU WERE NOT` / `IN THE ROOM.` (ink) |
| 10 | 60 | 13.400 to 15.400 | `THE ROW STAYS` / `BLANK.` (accent) |
| 11 | 54 | 15.400 to 17.200 | `SO WE FILL IT.` (ink) |
| 12 | 30 | 17.200 to 18.200 | label `WE RUN THE BUYER PROMPTS ON` + `CHATGPT` |
| 13 | 30 | 18.200 to 19.200 | + `GEMINI` |
| 14 | 30 | 19.200 to 20.200 | + `CLAUDE` |
| 15 | 30 | 20.200 to 21.200 | + `PERPLEXITY` |
| 16 | 66 | 21.200 to 23.400 | + `GOOGLE AI MODE` |
| 17 | 60 | 23.400 to 25.400 | `WE RECORD` / `WHO GOT NAMED.` |
| 18 | 60 | 25.400 to 27.400 | `AND WHAT` / `CHANGED SINCE.` |
| 19 | 108 | 27.400 to 31.000 | `FILL THE` / `BLANK ROW.` (accent) plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` top left, a violet rule
at y=700, and a violet progress bar at the bottom of the safe zone that fills
across the cut.

The complete set of 36 unique strings, dumped back out of the 19 rendered
filtergraph files rather than retyped, is in the compliance section below.

---

## How this differs from run 1, and why

Run 1 (`run-20260729-2200`) opened on the EVENT and built a ranked answer list:
`SOMEONE JUST` / `ASKED AN AI` / `WHO TO BUY FROM`, then a prompt field, then
`THE ANSWER` numbered `1 a competitor` `2 a competitor` `3 a competitor`, then
`YOU ARE NOT` / `ON THAT LIST.`, then the triple `NO CLICK.` / `NO KEYWORD.` /
`NO ANALYTICS.`

**None of that appears here.** The differences are structural, not cosmetic:

| | Run 1 | This cut |
|---|---|---|
| Opening object | an event happening now | an artefact you already own, a channel report |
| Central device | a ranked list of three competitors | a five-row table where four slots are filled and one is empty |
| Where the loss lands | you are absent from a list | a row on your own report has no source |
| Proof of absence | a triple of missing signals | one empty slot held on screen for 4 seconds |
| Product turn | `SO WE LOOK FOR YOU.` | `SO WE FILL IT.` |
| Closing | `STOP LOSING ANSWERS YOU CANNOT SEE.` | `FILL THE BLANK ROW.` |
| Zero-word overlap | | no line, and no sentence shape, is shared |

**The shape chosen is the second of the three the run brief offered: the gap
between what your analytics show and what actually happened.** It is the one
that starts from something the viewer is already looking at most weeks, which is
a different psychological entry point from run 1's "this is happening right now".
Run 1 asks you to imagine an event. This one asks you to look at a document.

The third suggested shape, a decision made without you in the room, is not
discarded, it is the PAYOFF rather than the opening: `A SHORTLIST` / `WAS SET.`
then `YOU WERE NOT` / `IN THE ROOM.` Putting it at 9.3 to 13.4 seconds rather
than at the top is itself part of the structural difference, because run 1 spent
its opening on the same emotional beat.

**One measurable execution difference worth recording for the A-B.** The empty
slot is a graphic, not a sentence. Run 1 carried its loss entirely in words. If
this cut outperforms, the visual device is a candidate explanation independent of
the driver, and the next replication should hold the device and vary the words.

### Note on comparing the two cuts

Run 1's closing card reads `STOP LOSING` / `ANSWERS YOU` / `CANNOT SEE.` The
word **cannot** was added to the banned-universals list on 2026-07-30, after run
1 shipped. It is not a defect in run 1, which predates the rule, but the two cuts
are not held to an identical standard on that one line, and a fair read of the
A-B should know it. Nothing in this cut uses it; the mechanical scan below
returns zero universals.

### Why the copy is shaped this way

TikTok gets the bluntest of the four. Longest capitalised line is 16 characters,
hard cuts only, no fades anywhere in the picture, no connective tissue.

**Frame 0 is a readable document, not a fragment.** The first draft opened on a
single row, which measured as a legible but thin cover, and the cover is what the
feed shows whether or not anyone presses play. The opening was rebuilt so frame 0
carries the label, two named rows and two filled slots. The table then completes
across the next three cuts.

**The four filled slots are deliberately IDENTICAL in width.** Varying them would
imply a channel mix, which would be a measurement, and this cut contains none.
Identical bars say only "this row has a source and that one does not", which is
the entire argument and is the one thing the graphic is allowed to assert.

**The fifth row is the payload and it lands at 1.500s**, inside the scroll
decision window, then holds for two full seconds before any words explain it. The
graphic is meant to be understood before the caption arrives.

**The first 1.5 seconds carry three state changes**, measured by ink-pixel count
on frames decoded from the delivered file, not by eye:

```
t=0.000  f0    ink 39,708 px
t=0.500  f15   ink 50,722 px   (+11,014)
t=1.000  f30   ink 62,165 px   (+11,443)
t=1.500  f45   ink 74,549 px   (+12,384)
```

Raw frame hashes are NOT usable for this. H.264 gives visually identical frames
different quantisation noise, so hashes differ where nothing changed and can
collide where it did. Ink count and changed-pixel count do not have that problem.

---

## Evidence, and exactly what is and is not claimed

**This cut contains no percentage, no rate, no result and no statistic. There is
not a single digit in 930 frames**, confirmed mechanically over the strings
passed to `drawtext`. Nothing here needs to trace to a `bg-*.html` page because
nothing is asserted as a measurement.

The assertions of fact are these three, and nothing else:

| On screen | Claim | Where it is grounded |
|---|---|---|
| `THE ANSWER` / `HAPPENED` / `OFF YOUR SITE.` | an AI engine answering a buyer question is an event that occurs outside the viewer's own property | mechanism, not measurement. An engine renders its answer in its own product. This is why a site-side channel report has no source for it. |
| `CHATGPT` `GEMINI` `CLAUDE` `PERPLEXITY` `GOOGLE AI MODE` | these five are the engines we run | `brandgeo-dashboard/src/lib/planConfig.ts:56`, `growth: ['chatgpt','gemini','claude','perplexity','google_ai']`. Display strings are the `label` fields in `ENGINE_META` lines 212 to 216, uppercased. |
| `WE RECORD` / `WHO GOT NAMED.` and `AND WHAT` / `CHANGED SINCE.` | the product runs those prompts and stores the history | `ai_results` persists `brand_mentioned`, `brand_position` and `competitors_mentioned` per engine per prompt with `checked_at`; the collection queue, `collection-worker-background` and the hourly `schedule-collections` cron drive it. |

**`ONE ROW` / `IS BLANK.` needs stating precisely, because it is the line closest
to a claim.** It is a statement about the table drawn immediately above it on the
same screen, where four slots are filled and the fifth is outlined and empty. It
does not assert that any particular analytics product lacks such a row, it does
not quantify anything, and it is not framed as a finding. The claim it sets up,
`THE ANSWER HAPPENED OFF YOUR SITE`, is the mechanical reason and is the part
that has to be true.

`SEARCH`, `SOCIAL`, `EMAIL`, `DIRECT` are generic channel categories, not product
names, not brands, and not measured subjects.

**No cadence is stated anywhere.** `refresh_cadence` defaults to `manual` and
there is a 48h cooldown, so "daily", "weekly" or "every month" would all have been
unsupportable. `AND WHAT CHANGED SINCE.` claims a record over time without
claiming a frequency, which is the honest version available.

`FILL THE BLANK ROW.` is the soft CTA. No pricing, no plan names, no tier
comparison. TOFU.

### Sources deliberately not used

1. **`bg-016.html` was not opened.** Excluded by the run brief.
2. **No engine count was taken from `bg-004.html`.** Excluded by the run brief,
   and its lineup names Microsoft Copilot, not today's Growth five.
3. **The string "27 cities" does not appear**, nor any city count, city name, or
   consensus figure. No city page was used as a source.
4. **No Grok and no AI Overviews.** Both went live 2026-07-29 with 5 and 6 rows
   from a single day. They are also not in the Growth five, so they would have
   been wrong here twice over.
5. **No Meta AI.** Retired 2026-07-16, in no plan set.
6. **`bg-005.html`'s 48% and 93%** are third-party statistics sitting inside an
   otherwise first-party page. Not used. No percentage appears in this cut at all.
7. **`ai-visibility-for-chicago.html` and `ai-visibility-for-boston.html` were
   not quoted.** Both carry superlative claims that contradict each other, and
   per the brief the page asserting a superlative is the one source that cannot
   confirm it.

### Superlatives and universals: zero, checked over the drawn bytes

The scan runs on the strings ffmpeg actually drew, harvested back out of the 19
filtergraph files, not on the script and not on this document.

```
superlative list  first only most never biggest best largest "top " #1 leading unmatched   -> none
universal list    nobody "no one" everyone everybody always never cannot
                  "every business" anyone "all businesses"                                 -> none
banned vocab      delve unlock unleash elevate harness leverage game-changer
                  supercharge revolutionize seamless robust cutting-edge transformative    -> none
```

Unlike run 6, there is not even a defensible superlative to explain: the word
`best` does not appear, because this cut quotes no prompt.

**One line was rewritten before rendering to keep it that way.** An early draft
of scene 5 read `FOUR ROWS HAVE NUMBERS.` / `ONE ROW IS BLANK.` The first half was
cut for two reasons: it put digits-as-words on screen next to a graphic that
looks like a report, which invites reading the bars as data, and the table
already says it without words. What remains asserts nothing the picture does not
show.

### Never a measured subject on screen, verified mechanically

The harvester pulls organisation-shaped names out of the **whole research
corpus**, not one page: **57 files**, every `ai-visibility-for-*.html` and every
`bg-*.html` under `brandgeo/web/`, tags and scripts stripped, matching
capitalised multi-word sequences ending in an organisation suffix (`LLC`, `Inc`,
`Group`, `Realty`, `Properties`, `Management`, `Law`, `Health`, `Hospital`,
`Medical`, `Bank`, `Capital`, `Advisors`, `Solutions`, `Company`, `Corp`,
`Partners`, `Insurance` and 20 others).

```
corpus files scanned                     57
organisation-shaped names harvested     107
matches against the drawn strings       ZERO
competitor product names (peec, profound, semrush, otterly, rankscale,
  scrunch, athena, brandwatch, ahrefs, similarweb, conductor, brightedge)
                                        ZERO
capitalised tokens not on the allow list  NONE
```

The only proper nouns on screen are `BRANDGEO`, `getbrandgeo.com`, and the five
engine names. Per the brief's refinement, naming the ENGINE being measured is
allowed and necessary; naming a SUBJECT of a measurement is not, and there is no
subject in this cut because there is no measurement in it.

### Other compliance, checked over the dumped strings

- **No em dashes, no en dashes**, no Unicode dash of any category, no
  hyphen-minus. Zero non-ASCII characters anywhere.
- **No digits at all.**
- No `%`, no currency symbol, no rate, no pricing, no plan names.
- No file outside `docs/growth/reel-campaign-ab/run-20260730-0413/tiktok/` was
  written. No git command was run. Nothing posted or scheduled. `RUN.md` and the
  sibling platform folders were not touched.

---

## Safe-zone measurement

TikTok reserves **200px top, 360px bottom, 200px right**, the tightest of the
four because of the right-hand action rail. Usable box `y 200..1559`, `x ..879`.
Everything below is measured on frames decoded out of the **delivered**
`tiktok-silent.mp4`, never an intermediate.

### The layout was fitted before the first render

Column set to **x 100..799, 700px wide**, which leaves a deliberate 80px buffer
inside the right reserve before any measurement is taken. Every unique line was
rendered alone at 100pt and its ink width measured:

```
widest headline           WHO GOT NAMED.               920 px at 100pt
widest engine row         GOOGLE AI MODE               869 px at 100pt
widest table row          AI ANSWERS                   641 px at 100pt
widest label (30pt)       WHERE YOUR BUYERS CAME FROM 1729 px at 100pt
```

Sizes chosen against the space actually available:

```
headlines + engine rows   x=100, 700px usable
  72pt   920 * 0.72 = 662 px    38 px spare    taken
  76pt   920 * 0.76 = 699 px     1 px spare    REJECTED, that is a rounding artefact

table rows                x=100, must clear the slot column at x=560
  60pt   641 * 0.60 = 385 px   115 px to the slot edge    taken

labels                    x=100, 700px usable
  30pt  1729 * 0.30 = 519 px   181 px spare   taken
```

76pt was rejected on the brief's own rule that single-digit headroom is a
rounding artefact rather than a margin. The fitter is only an estimate used to
pick a rung off the ladder; the pass/fail number is always the box measured out
of the delivered mp4.

### Ink threshold, argued from a measured control, not chosen by feel

Measured first, chosen second:

```
delivered file, known-empty band y1600..1899:   min 9  max 9  across all 930 frames
delivered file, known-empty band y 300.. 599:   min 9  max 9  across all 930 frames
dimmest colour deliberately drawn:              Y ~= 30    (progress track #1B1D2B)
next dimmest:                                   Y ~= 98    (violet rule #7C3AED)
accent:                                         Y ~= 160   (#A78BFA)
brightest:                                      Y ~= 233   (ink #E8E9ED)
```

The encoded background is a flat 9 with zero variance in two separate regions
across every frame, so the range 10 to 29 is empty. **Threshold 11** sits just
above the background rather than mid-gap, so every glyph's antialiased skirt is
counted and the reported box can only be larger than the design box, never
smaller.

That flat 9 across all 930 frames is also the direct disproof of the
`color=black@0.0` failure that hit run 4's YouTube build. It cannot happen here by
construction either: there is no transparent lavfi source anywhere, no
`format=rgba`, no `@0.0`. Each scene is one filtergraph drawn straight onto an
opaque `color=c=0x090A0F` source, so no alpha is ever negotiated. Checked
mechanically over the 19 graph files: `@0.0` appears **0 times**.

The result is not threshold-sensitive. Union over all 930 frames:

```
thr  10   x  99..800   y 260..1495
thr  11   x  99..800   y 260..1495      <- method A
thr  15   x 100..799   y 260..1495
thr  20   x 100..799   y 260..1495
thr  40   x 100..799   y 260..1495
thr  60   x 100..799   y 260..1495
thr 100   x 100..799   y 260..1495
```

The one pixel of movement on each horizontal edge between thr 11 and thr 15 is
the antialiased skirt of the x=100 and x=799 column edges, which is the expected
direction.

### Cross-check against a text-free control

Method B is the brief's per-frame diff against a **text-free control encoded
through the identical pipeline**, never against a flat assumed canvas colour. The
control is the same 930-frame numbered sequence with nothing drawn on it at all,
same `-framerate 30`, same x264 settings, so it carries the yuv420p frame-edge
chroma artefact that made run 3's first attempt report `x 0..1079, y 0..1513`.

**The threshold was set from a measured noise floor, in three regions empty by
design**, per the correction added after run 5's Facebook false failure:

```
region                          max |delivered - control|, all 930 frames, max over RGB
y 1600..1899 (below the bar)      0
y  320.. 600 (eyebrow to label)   0
x  900..1079 (right of column)    0
noise floor = 0
```

The floor is genuinely 0 here, so the lowest rung is already above it:

```
>2    x  94..801   y 256..1497      <- method B, first rung above the floor
>3    x  94..800   y 256..1497
>7    x  98..799   y 258..1495
>11   x 100..799   y 258..1495
>15   x 100..799   y 260..1495
```

Method B at >2 finds more ink than method A on all four edges, by 2 to 5px, which
is the expected result: single-channel fringing survives an RGB comparison and is
averaged away by the gray conversion. Both methods are measuring ink, since the
floor in three known-empty regions is exactly 0, so **the wider number is the one
reported**. Neither method reports ink at the literal frame edge, so there is
nothing here to blame on the codec.

The floor being 0 is not luck and was not assumed. This cut has a large
genuinely-empty lower third and modest ink per frame, so x264 allocates the empty
regions identically in both encodes. Had it not, the sweep above would have shown
it and the threshold would have moved.

### Declared rects folded in

Pixel measurement is blind to anything within a few luma of the canvas and both
methods share that blind spot, so geometry is added explicitly rather than
trusted to either measurement:

```
progress track    x 100..799   y 1490..1495   (declared, #1B1D2B, Y ~= 30)
progress fill     x 100..799   y 1490..1495   (declared, widest state)
violet rule       x 100..799   y  700.. 703   (declared)
logo card         x 100..231   y 1080..1211   (declared, 132x132 at 100,1080)
declared union    x 100..799   y  700..1495
```

All four sit inside the measured union, so none of them moves it. That is the
outcome to want, not a reason to have skipped the check.

### Reported box, union of everything drawn

```
method A (gray, thr 11):                    x  99..800   y 260..1495
method B (delivered minus control, >2):     x  94..801   y 256..1497
declared rects:                             x 100..799   y 700..1495

UNION           x   94..801     y  256..1497
reserves        top y>=200      bottom y<=1559      right x<=879
HEADROOM        top 56px        bottom 62px         right 78px
tightest        56px            verdict PASS (floor is 20px)
```

**The binding constraint is furniture, not type.** The right edge at 801 is the
progress bar and the two rules at x=799 plus 2px of encoder fringe. The widest
body content on any frame is the filled slot column ending at x=799; the widest
actual text is scene 17's `WHO GOT NAMED.` at x=763, **116px clear** of the limit,
and the widest engine row is scene 16 at x=727, 152px clear.

Every reserve clears by more than 2.5x the 20px floor.

### Body area alone, per scene, chrome excluded

Rows outside `y 710..1449` ignored, which drops the eyebrow, the label, the
violet rule and the progress bar, and leaves body type, the row slots and the
logo. `hr` is clearance to the `x<=879` limit:

```
scene01  x 100..799  hr  80     scene11  x 100..449  hr 430
scene02  x 100..799  hr  80     scene12  x 100..449  hr 430
scene03  x 100..799  hr  80     scene13  x 100..449  hr 430
scene04  x 100..800  hr  79     scene14  x 100..547  hr 332
scene05  x 100..799  hr  80     scene15  x 100..727  hr 152
scene06  x 100..659  hr 220     scene16  x 100..763  hr 116
scene07  x  99..698  hr 181     scene17  x 100..725  hr 154
scene08  x 100..579  hr 300     scene18  x 100..559  hr 320
scene09  x 100..656  hr 223     scene19  x 100..559  hr 320
scene10  x 102..695  hr 184
```

Scenes 1 to 5 read x1 = 799 or 800 because the filled slot column is drawn to the
column edge by construction, not because any glyph reaches it.

---

## Timeline construction, and the traps that were avoided

**No `ffconcat` anywhere.** On an earlier TikTok run the ffconcat demuxer drifted
a scene onto frame 694 instead of the designed 693, because cumulative float
durations put the boundary a fraction of a microsecond past a frame edge, while
total duration and frame count still looked exactly right. Here the 19 scene
stills are expanded into a 930-file numbered sequence and encoded with
`-framerate 30 -i seq/f%04d.png`, which is frame-exact by construction.

Verified on the delivered file by decoding all 930 frames sequentially in one
pass, with **no `-ss` anywhere**, and counting pixels whose luma moved between
consecutive frames.

**The threshold was swept rather than picked.** The brief's warning is that a
detector which is wrong is wrong uniformly, which reads as timeline drift rather
than as a measurement fault:

```
delta   max INSIDE a scene   min AT a boundary   separation
    6                  285                8803   30.9x
   12                  248                8774   35.4x
   20                  182                8739   48.0x
   32                   75                8703   116.0x
   48                   49                8657   176.7x
```

**Delta 32 was taken**, count threshold 4389, sitting in the middle of a gap
8,628 pixels wide. At that setting **all 18 detected boundaries equal all 18
designed boundaries**, and the same holds at every other rung in the sweep, so
the result is stable across the choice rather than dependent on it.

Worth recording against run 6, which had the opposite problem: its quietest real
boundary was 252 changed pixels against intra-scene noise of 713 at delta 6, an
overlap. **This cut's quietest boundary is 8,703 pixels**, 34x larger, because
every scene change here moves a whole block of type and the progress bar step is
never the only thing that changes. There is no quiet boundary in this build.

Changed pixels at every designed boundary, delta 32:

```
S01->S02  f15    0.500s     10,638     S10->S11  f462  15.400s     36,049
S02->S03  f30    1.000s     11,330     S11->S12  f516  17.200s     27,507
S03->S04  f45    1.500s     11,513     S12->S13  f546  18.200s      8,976
S04->S05  f105   3.500s     20,911     S13->S14  f576  19.200s      8,703
S05->S06  f165   5.500s    122,459     S14->S15  f606  20.200s     12,560
S06->S07  f222   7.400s     45,244     S15->S16  f636  21.200s     18,726
S07->S08  f279   9.300s     63,041     S16->S17  f702  23.400s     87,846
S08->S09  f336  11.200s     40,692     S17->S18  f762  25.400s     31,593
S09->S10  f402  13.400s     41,648     S18->S19  f822  27.400s     58,853
```

The two largest, at 5.500s and 23.400s, are the wipes out of the two accumulating
lists, which is the intended shape: the biggest picture change happens after each
list has been read, not during it. The four smallest, 8,703 to 12,560, are the
engine rows arriving one at a time.

## Progress bar

`drawbox` cannot animate on 8.1.2. It has no `eval` option and evaluates
`x/y/w/h` once at init, so an expression like `w='700*min(1,t/31)'` would
silently render frozen at its t=0 value with no warning. The bar is therefore 19
static boxes, one per scene, drawn into that scene's still. Verified on the
delivered file by reading row y=1492 at every scene start:

```
measured  11, 23, 34, 79, 124, 167, 210, 253, 303, 348,
          388, 411, 434, 456, 479, 528, 574, 619, 700
designed  identical
monotonic non-decreasing: yes    distinct values: 19 of 19
```

`replace=1` is on **every** `drawbox`, all **85** of them, checked mechanically
over the graph files rather than by reading. The source is opaque RGB so blending
would have worked, but run 1 lost a violet rule to alpha-0 blending with no
error, and making that structurally impossible is cheaper than reasoning about it
per call. This matters more here than in most cuts, because 76 of those 85 boxes
ARE the content: the filled slots and the hollow slot outline.

---

## Duration, exact ffprobe on the DELIVERED files

Probed after the copy into this folder, not on the build copies.

```
tiktok-silent.mp4   format 31.000000   nb_streams 1
                    video  31.000000   930 frames   1080x1920  yuv420p  30/1
                    duration_ts 476160 @ 1/15360

tiktok-scored.mp4   format 31.000000   nb_streams 2
                    video  31.000000   930 frames   duration_ts 476160 @ 1/15360
                    audio  31.000000  1455 frames   duration_ts 1488000 @ 1/48000
```

31.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string and
`nb_streams=1`. That is what `-an` buys.

**A mux can exit 0 and be unreadable**, so both delivered files were probed for
duration and stream count before this was called done.

**The scored cut did not drift.** The AAC stream decodes to 1,488,896 samples per
channel, 31.018667s of raw payload, but the container reports 31.000000 because
`duration_ts` is 1,488,000 samples exactly, so the trailing 896 quantised samples
are excluded by the stream duration rather than played. `-shortest` is what pins
it. Checked, not assumed.

Video is stream-copied into the scored variant. Both files' video streams hash to
`MD5=6733ba3e8eac8ec9a86a319c7f435ee1`, so every picture measurement above holds
for both.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master,
1080x1920. Raw `rgb24` MD5 of the cover and of frame 0 of the delivered
`tiktok-silent.mp4` both read `0c6bbad5d8b8c8749bf7550e3d8e6af5`. Byte-identical,
re-checked on the copies in this folder rather than on the build copies.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build,
confirmed by scanning all 19 graph files: **0 occurrences**. Frame 0 renders at
full opacity, 39,708 ink pixels, carrying the eyebrow, the label
`WHERE YOUR BUYERS CAME FROM`, the violet rule and two filled rows. The thumbnail
the feed shows is a legible document that already poses the question, which is the
right cover for a loss-aversion cut: it works even if nobody presses play.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, no attribution
line. 60.000s source, 48kHz stereo, `pcm_s24le`. **Held constant across every run
in this campaign on purpose: the hook is the variable under test, so the bed must
not be.**

Trimmed to 31.000s, 0.08s fade in, 1.5s fade out starting at 29.5s.

**The fade in is not cosmetic.** Measured on the source: the first 16 samples
already peak at 0.053095 and the first 64 at 0.061709, so a cut at sample 0
clicks audibly.

Verified on the **delivered** `tiktok-scored.mp4`, re-measured on the copy in this
folder:

```
first     16 samples  peak |amp|  0.000641
first     64 samples  peak |amp|  0.002975   <- required below 0.005, PASS
first    512 samples  peak |amp|  0.015624
first 0.08 s          peak |amp|  0.161724
first 1.00 s          peak |amp|  0.282729
last      64 samples  peak |amp|  0.000000   (fade out lands at digital silence)
```

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.13   TP -4.41   LRA 3.60   thresh -26.18   offset -1.12
pass 1 also reports what a SINGLE pass would have produced: I -14.88
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.00   TP -4.28   LRA 3.60
```

Integrated lands on -16.00 LUFS exactly. The brief is right that single-pass
undershoots: it would have landed at -14.88, 1.12 LU high. True peak is -4.28
dBTP, under the -1.5 ceiling rather than at it, because linear mode applies one
flat gain and the peak lands wherever the integrated target puts it. -1.5 dBTP is
a ceiling not to exceed, so this is compliant with 2.78 dB spare.

**Honest read: nobody has listened to this file.** Everything above is
measurement. The excerpt is the first 31s of the same track every prior run used,
so it will sound like those, two seconds shorter than run 6's. LRA is 3.60 LU over
this window against 6.80 LU over the full 60s track, so the excerpt is less
dynamic than the whole piece.

**Unlike run 6, the bed and the driver agree.** `tension-minor` is a minor-key
tension bed, which fits loss aversion directly. Run 6's notes flagged that it
worked against a utility script and that `clean-utility.wav` would have suited it
better. That mismatch does not exist here, which is a small confound to keep in
mind when comparing this run to run 6, and no confound at all against run 1,
which used the same bed with the same driver.

---

## Commands

Fonts are referenced by bare filename with ffmpeg's cwd set to the build folder.
This is load-bearing on Windows: a drive-letter colon inside a filtergraph option
value terminates the option even when the value is quoted, so `fontfile=C:/...`
fails to parse. Escaping is the alternative; relative naming is cleaner.

**1. Scene stills**, one PNG per scene, 19 total, filtergraph written to a file:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x090A0F:s=1080x1920 \
  -/filter_complex scenes/gNN.txt -map "[out]" -frames:v 1 -update 1 scenes/sNN.png
```

Scene 19 additionally takes `-i logo.png` and ends
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1080[out]`. Scene 1's graph,
verbatim from `scenes/g00.txt`, showing the persistent furniture, a filled slot
and the fill state of the progress bar:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=260:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=700:w=700:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawbox=x=100:y=1490:w=700:h=6:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=1490:w=11:h=6:color=0xA78BFA@1:t=fill:replace=1,
drawtext=fontfile='Inter-SemiBold.ttf':text='WHERE YOUR BUYERS CAME FROM':x=100:y=640:fontsize=30:fontcolor=0xA78BFA,
drawtext=fontfile='Inter-ExtraBold.ttf':text='SEARCH':x=100:y=750:fontsize=60:fontcolor=0xE8E9ED,
drawbox=x=560:y=773:w=240:h=24:color=0xE8E9ED@1:t=fill:replace=1,
drawtext=fontfile='Inter-ExtraBold.ttf':text='SOCIAL':x=100:y=850:fontsize=60:fontcolor=0xE8E9ED,
drawbox=x=560:y=873:w=240:h=24:color=0xE8E9ED@1:t=fill:replace=1[out]
```

The empty slot on the `AI ANSWERS` row is four 3px `drawbox` calls forming a
hollow 240x24 rectangle at x=560, rather than a filled one:

```
drawbox=x=560:y=1173:w=240:h=3:color=0xA78BFA@1:t=fill:replace=1,
drawbox=x=560:y=1194:w=240:h=3:color=0xA78BFA@1:t=fill:replace=1,
drawbox=x=560:y=1173:w=3:h=24:color=0xA78BFA@1:t=fill:replace=1,
drawbox=x=797:y=1173:w=3:h=24:color=0xA78BFA@1:t=fill:replace=1
```

**2. Frame-exact sequence, then the silent master.** Each scene still is copied
`frames` times into `seq/f%04d.png`, 930 files. No ffconcat, no float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i seq/f%04d.png \
  -vf "format=yuv420p" -frames:v 930 \
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
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 31.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=29.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.13:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.18:offset=-1.12:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**5. Text-free control**, for measurement method B, identical settings and
identical frame count, with nothing drawn:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 930 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an control.mp4
```

**6. Verification** decodes the delivered files sequentially, never with `-ss`:

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt gray  -
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i control.mp4       -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i tiktok-scored.mp4 -map 0:a:0 -f f32le -ac 2 -ar 48000 -
```

piped frame by frame into numpy, accumulating a running maximum rather than
holding 930 frames in memory. Build artifacts, the control mp4 and the two frame
sequences were kept outside this folder; only the three deliverables and this file
were written here.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
rule, progress track `#1B1D2B`. `#8B5CF6` is used for no text anywhere; it
measures 4.2:1 on this canvas and fails. Inter ExtraBold for headlines, table rows
and engine rows; SemiBold for the labels and the eyebrow; Bold for the wordmark;
Medium for the URL. All vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Dark only, no white background.

The `AI ANSWERS` row is the only accent-coloured row in the table and the only
hollow slot. That single colour and fill change is what makes the table scan as
"four of these, and one that is not like them" at thumb speed, without a word of
explanation and before scene 5 supplies one.

## Open items

1. **The empty slot is a graphic device, and it is a confound.** If this cut beats
   run 1, the cause could be the device rather than a better execution of the
   driver. The clean follow-up is the same table device carrying a different
   driver, or these words without the table.
2. **`ONE ROW` / `IS BLANK.` is the line most worth reviewing before this runs
   paid.** It is defensible as written, because it describes the picture directly
   above it, but it is the only line in the cut that a viewer could read as a
   claim about their own analytics product rather than about the mechanism.
3. Run 1 and this cut are not scored on an identical copy standard, because the
   universals rule post-dates run 1. Recorded above rather than left to be
   discovered during analysis.
