# TikTok cut, run-20260730-0216

**Hook driver: #5, CONCRETE PROOF.** "Here is the exact prompt, here is the exact
answer."

Runs 1 to 4 used loss aversion, status threat, curiosity gap and contrarian. This
cut asserts nothing and argues nothing. It shows the artefact: a real published
prompt is typed out on screen, then the five engines' actual answers are listed
one at a time. The only interpretive line in the whole piece is `ONE NAME TOOK /
THE WHOLE / CATEGORY.`, and it restates the table directly above it.

**Deliverables**

| File | What it is |
|---|---|
| `tiktok-silent.mp4` | Upload master. Zero audio streams. Pick a track in the TikTok in-app library. |
| `tiktok-scored.mp4` | Same picture, BrandGEO-composed bed. For paid, site embeds and decks. |
| `tiktok-cover.png` | Literal frame 0 of the master, verified byte-identical. |

**Silent is the one to upload.** In-app audio is a ranking input on TikTok, not
just a licence convenience.

Filenames follow `-scored.mp4`, the convention every run in this campaign has
used, rather than the brief's `-bed.mp4`. Confirmed by the coordinator this run.

---

## On-screen text, verbatim

Line breaks in the table are literal line breaks on screen. Every line is a
separate `drawtext`. All 18 boundaries were verified by decoding all 1020 frames
of the delivered file in one sequential pass and land exactly where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 18 | 0.000 to 0.600 | label `WE TYPED THIS INTO FIVE AI ENGINES` + `Top-rated property` + caret |
| 2 | 18 | 0.600 to 1.200 | + `management` |
| 3 | 18 | 1.200 to 1.800 | + `companies` |
| 4 | 18 | 1.800 to 2.400 | + `in Chicago` |
| 5 | 66 | 2.400 to 4.600 | same four lines, caret removed |
| 6 | 54 | 4.600 to 6.400 | `FIVE ENGINES.` / `SAME QUESTION.` / `SAME DAY.` (accent) |
| 7 | 78 | 6.400 to 9.000 | label `ASKED ON` + `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 8 | 30 | 9.000 to 10.000 | label `WHERE ONE COMPANY LANDED` + `CHATGPT` `#1` |
| 9 | 30 | 10.000 to 11.000 | + `CLAUDE` `#1` |
| 10 | 30 | 11.000 to 12.000 | + `PERPLEXITY` `#2` |
| 11 | 30 | 12.000 to 13.000 | + `GEMINI` `#4` |
| 12 | 126 | 13.000 to 17.200 | + `GOOGLE AI MODE` `NAMED` |
| 13 | 96 | 17.200 to 20.400 | label `CHICAGO, 24 JULY 2026` + `5 / 5` (accent, 240pt) + `ENGINES NAMED` / `THE SAME` / `COMPANY.` (accent) |
| 14 | 54 | 20.400 to 22.200 | `ONE NAME TOOK` / `THE WHOLE` / `CATEGORY.` (accent) |
| 15 | 54 | 22.200 to 24.000 | `THE COMPANY IS` / `NAMED ON THE` / `RESEARCH PAGE.` (accent) |
| 16 | 66 | 24.000 to 26.200 | `THIS IS WHAT` / `AN AI ANSWER` / `LOOKS LIKE.` (accent) |
| 17 | 54 | 26.200 to 28.000 | `NOW ASK IT` / `ABOUT YOUR` / `CATEGORY.` (accent) |
| 18 | 66 | 28.000 to 30.200 | `THE ANSWER` / `ALREADY EXISTS.` / `YOU HAVE NOT` / `SEEN IT.` (accent) |
| 19 | 114 | 30.200 to 34.000 | `SEE WHAT THEY` / `SAY ABOUT YOU.` (accent) plus logo, `BRANDGEO`, `getbrandgeo.com` |

Persistent on every frame: the eyebrow `B R A N D G E O` top left, and a violet
progress bar at the bottom of the safe zone that fills across the cut.

### Why the copy is shaped this way

The prompt is set in **mixed case, SemiBold**, while every other line in the cut
is **ExtraBold caps**. That is the whole design idea. The prompt has to read as a
thing someone typed, not as a headline the brand wrote, or the driver collapses
back into the four assertion-led drivers that came before it. The caret block
after the last typed line does the same work in one 7px column.

The typing is not decoration either. It is the cheapest way to make the viewer
read a 49 character string on a platform where nobody reads 49 character strings:
three of the four typing stages land inside the first 1.8 seconds, so the eye is
already tracking the line before it is complete.

**Scenes 8 to 12 are the piece.** One engine per second, each with what it
actually returned, then a 4.2 second hold on all five together. Nothing is
narrated over the table and nothing is claimed while it is on screen. The `5 / 5`
card at 17.2s is a summary of a table the viewer has already read, not a number
introduced cold.

**Scene 15 is the one line that could have been left out and was not.**
`THE COMPANY IS / NAMED ON THE / RESEARCH PAGE.` A concrete-proof asset that
withholds the subject invites exactly one objection, "so who was it", and the
honest answer is that it is published, dated and sourced on a page with a right
of reply, and an ad is not that. Saying so on screen costs 1.8 seconds and turns
the withholding from something that looks evasive into the reason to click.

TikTok gets the bluntest of the four cuts. Longest capitalised line is 15
characters. No connective tissue, hard cuts only, no fades anywhere in the
picture.

**The first 1.5 seconds carry three states**, measured by ink-pixel count on
frames decoded from the delivered file, not by eye:

```
t=0.000  f0    ink 31,809 px
t=0.600  f18   ink 43,114 px   (+11,305)
t=1.200  f36   ink 52,339 px   (+9,225)
```

Raw frame hashes are NOT usable for this. H.264 gives visually identical frames
different quantisation noise, so hashes differ where nothing changed. Ink count
and changed-pixel count do not have that problem.

---

## The prompt, and where every number comes from

**Prompt used, quoted exactly:**

```
Top-rated property management companies in Chicago
```

**Source:** `brandgeo/web/ai-visibility-for-chicago.html`, line 309, in the
"What we actually asked" prompt grid. Verified mechanically, not by eye: the
string `"Top-rated property management companies in Chicago"` is present verbatim
in the page source, and the four on-screen lines joined by single spaces
reconstruct it byte for byte. The quotation marks on the page are its delimiters
and are not part of the prompt, so they are not drawn.

Nothing was shortened, tidied or reworded. The hyphen in `Top-rated` is the
page's hyphen and is a hyphen, not an en dash.

| On screen | Claim | Source |
|---|---|---|
| `CHATGPT` `#1` | "ChatGPT and Claude both rank it #1" | `ai-visibility-for-chicago.html`, the 5/5 callout |
| `CLAUDE` `#1` | same sentence | same |
| `PERPLEXITY` `#2` | "Perplexity ranks it #2" | same |
| `GEMINI` `#4` | "Gemini names it #4" | same |
| `GOOGLE AI MODE` `NAMED` | "Google AI Mode surfaces it by name at 4.8 stars" | same |
| `5 / 5` `ENGINES NAMED THE SAME COMPANY.` | "5/5 Engines that named [one company]" | same page, key findings bar |
| `ONE NAME TOOK THE WHOLE CATEGORY.` | that company "appears in every single one of the 5 engines' responses for 'top-rated property management companies in Chicago'" | same page, 5/5 callout |
| `CHICAGO, 24 JULY 2026` | "Original research, data collected 2026-07-24, BrandGEO's own AI Visibility pipeline" | same page, hero |

### A scene was cut after review, and the reason is a live defect on the site

A scene reading `THE FIRST TIME / THIS HAS / HAPPENED IN / THE PROGRAM.` sat
between the `5 / 5` card and `ONE NAME TOOK`. It was **cut, not hedged**, on the
coordinator's review. Its 54 frames went to scene 12 (the five-row hold, 96 to
126 frames) and scene 13 (the `5 / 5` card, 72 to 96 frames), so the two screens
that are the actual proof got the time instead.

The claim **is** on the Chicago page, four times, including its key findings bar
and its hero: "the first fully unanimous result measured anywhere in this
research program". So it passed a trace-to-a-published-page test. **It is still
false**, which is the thing that matters and which the trace test did not catch:

```
5/5 figures by city page, with the collection date each page states
boston        2026-07-24   x19      washingtondc  2026-07-24   x6
sanfrancisco  2026-07-24   x10      atlanta       2026-07-24   x6
philadelphia  2026-07-24   x8       sandiego      2026-07-24   x4
houston       2026-07-24   x7       minneapolis   2026-07-24   x4
baltimore     2026-07-25   x7       rome          2026-07-10   x1
chicago       2026-07-24   x6       phoenix       2026-07-24   x1
                                    denver        2026-07-24   x1
```

Thirteen pages carry a 5/5, Boston nineteen times. **Rome was collected
2026-07-10, two weeks before Chicago**, so the superlative was false on the day
it was published, not merely overtaken later. Nine further pages were collected
the same day as Chicago.

Anyone who checks refutes it in about thirty seconds, and the whole persuasion of
this driver is that the viewer can check. A checkable asset carrying an
unsourced-in-substance superlative is worse than one that never invited checking,
and it sat three scenes from a real prompt and a real result that are both solid.

No hedge was used. "One of the first" is the same claim with deniability.

**This makes `ai-visibility-for-chicago.html` itself wrong and it should be
fixed at source.** The claim appears in the hero paragraph, the findings bar,
the 5/5 callout heading and the FAQPage JSON-LD, so an AI engine reading the page
will ingest it as fact. Filed under Open items below. Out of this task's write
scope.

**The general lesson for the campaign brief**, which already says the provenance
check runs on the FIGURE and not on the page it sits in: that rule catches a
borrowed third-party statistic, but it does not catch **our own page asserting
something false about our own program**. A superlative ("first", "only", "most",
"never before") is a claim about every other page in the corpus, so it cannot be
verified by reading the page it appears on. It has to be checked against the
corpus, which took one grep here. Worth adding as its own trap.

**Google AI Mode's cell says `NAMED`, not a rank, and that is deliberate.** The
source gives a rank for four engines and reports the fifth as surfacing the
company by name. Inventing a fifth rank to square the column would have been the
single easiest lie available in this cut. `NAMED` is what the page says.

### The denominator was verified, not assumed

Every figure here is `x/5` against the **current** five-engine set, and this was
checked rather than inherited:

- The 2026-07-24 Chicago run used **Google AI Mode in place of the now-retired
  Meta AI**. The page states this directly in its data-quality note.
- "All 5 engines returned usable data on every prompt this run, no collection
  errors." So there is no hidden `x/4` inside the 5/5, which is the trap the
  brief warns about and which rules several other city pages out.
- The five named on screen are exactly the Growth set in `planConfig.ts`:
  ChatGPT, Gemini, Claude, Perplexity, Google AI Mode.

### Sources deliberately not used

1. **`bg-016.html` and any engine count from `bg-004.html`** were excluded by
   the brief and were not opened for figures.
2. **`bg-005.html`'s 48% and 93%** are third-party statistics sitting inside an
   otherwise first-party page. The provenance check runs on the figure, not the
   page it sits in, and neither figure traces to a BrandGEO measurement.
3. **Chicago's corporate-law result was left out.** The page reports it as `4/4
   structured engines` in its findings bar and `4/5` in its consensus table, both
   honestly, because one engine did not return a structured ranking. A figure
   that needs a paragraph to disambiguate does not belong on a 1.8 second screen.
4. **No cross-city aggregate and no city count.** The only geography claimed is
   one category in one city on one day, which is exactly what was measured.
5. **The 4.8 star rating** reported for the Google AI Mode result was dropped.
   It is a rating of the withheld company, not of the engine's behaviour, and it
   is the one number in the callout that starts to describe the subject rather
   than the measurement.

### Never a measured subject on screen, verified mechanically

The check harvests organisation-shaped names from the source page (159
candidates: every multi-word capitalised sequence plus every capitalised token
that is not a common word) and matches them against the exact strings passed to
`drawtext`, **dumped back out of the 20 rendered filtergraph files rather than
retyped**, so what is checked is what was drawn.

An explicit never-list covering every party named anywhere on the Chicago page
(the property manager, both law firms, the immigration firms, the brokerage, the
realty, the misrendered firm name and its real counterpart, the "Big Four"), plus
Meta AI, Copilot, Grok, DeepSeek and AI Overviews, plus every competitor product,
**returns zero hits**.

The harvester's six raw matches are all substring artefacts and were checked one
by one: `Brand` inside `BRANDGEO`, `MINI` inside `GEMINI`, `READ` inside
`ALREADY`, `Question` inside `SAME QUESTION.`, plus `AI Engines` and
`Google AI Mode`, which are the instruments being measured and are allowed by
name under the brief's engine-versus-subject rule.

The only proper nouns on screen are `BRANDGEO`, `getbrandgeo.com`, `CHICAGO`,
and the five engine names.

Other compliance:

- **No Grok, no AI Overviews, no Meta AI.** Checked against the drawn strings.
- **No percentage or rate anywhere in the cut.** The numeric strings drawn are
  `#1`, `#2`, `#4`, `5 / 5`, `24` and `2026`. No `%`, no currency symbol.
- No pricing, no plan names. TOFU, soft CTA (`SEE WHAT THEY SAY ABOUT YOU.`).
- No em dashes, no en dashes, no minus signs, none of the banned vocabulary.
  Checked programmatically against the dumped strings, not by reading.
- No file outside this folder was written. No git command was run. Nothing
  posted. `RUN.md` and the sibling platform folders were not touched.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right, the tightest of the four
because of the right-hand action rail. Usable box `y 200..1559`, `x ..879`.
Everything below is measured on frames decoded out of the **delivered**
`tiktok-silent.mp4`, never an intermediate.

### The prompt line was budgeted first, and the column was narrowed to pay for it

This is the run the brief flagged as the tightest for layout, so the geometry was
decided by measurement before the first render rather than discovered after it.

The column was set to **x 100..800, 700px**, 20px narrower than run 4's 720px,
which spends nothing but headline size and buys 20px of right margin back on
every frame. Every unique line was then rendered alone at 100pt and its ink width
measured:

```
widest capitalised line    ALREADY EXISTS.       890 px at 100pt
widest prompt line         Top-rated property    920 px at 100pt
widest engine row          GOOGLE AI MODE        863 px at 100pt
```

Fitting against the 700px column:

```
78pt   890 * 0.78 = 694 px   6 px spare    REJECTED, that is a paper pass
72pt   890 * 0.72 = 641 px  59 px spare    taken
72pt   920 * 0.72 = 662 px  38 px spare    prompt, taken
```

78pt was rejected on the brief's own rule that single-digit headroom is a
rounding artefact rather than a margin. One copy edit destroys it.

Prediction against the delivered file:

```
                              predicted   measured on the mp4
ALREADY EXISTS. at 72pt          641 px      643 px  (scene 19, x 101..743)
Top-rated property at 72pt       662 px      666 px  (scene 05, x 100..765)
```

Agreement is 2 to 4px. Point-size scaling of a hinted TTF is not exactly linear,
so the fitter is an estimate used only to pick a size from the ladder. The
pass/fail number is always the box measured out of the delivered mp4.

**The prompt did not have to be swapped.** 72pt is well above the 44pt floor, so
the shorter real prompts on the same page (`Best immigration lawyers in Chicago`,
`Best corporate law firms in Chicago`) were not needed. The break is
`Top-rated property / management / companies / in Chicago`; the obvious three
line break puts `management companies` on one line at 1053px, which forces 66pt
and then predicts 695px against a 700px column, another paper pass.

### Ink threshold, argued from a measured control

Measured first, chosen second:

```
delivered file, known-empty band y1600..1899:  min 9  max 9  across all 1020 frames
dimmest colour deliberately drawn:             Y ~= 30   (progress track #1B1D2B)
next dimmest:                                  Y ~= 98   (violet rule #7C3AED)
accent:                                        Y ~= 160  (#A78BFA)
brightest:                                     Y ~= 233  (ink #E8E9ED)
```

The encoded background is a flat 9 with zero variance across every frame in a
region where nothing is drawn, so the range 10 to 29 is empty. **Threshold 11**
sits just above the background rather than mid-gap, so every glyph's antialiased
skirt is counted and the reported box can only be larger than the design box,
never smaller.

That flat 9 across all 1020 frames is also the direct disproof of the
`color=black@0.0` failure that hit run 4's YouTube build: if any text layer had
shipped as a full-frame rectangle, this band could not read as canvas. It cannot
happen here by construction either, because there is no transparent lavfi source
anywhere in this build. Each scene is a single filtergraph drawn straight onto an
opaque `color=c=0x090A0F` source, so no alpha is ever negotiated.

The result is not threshold-sensitive. Union over all 1020 frames:

```
thr  10   x 100..799   y 260..1495
thr  11   x 100..799   y 260..1495      <- method A
thr  15   x 100..799   y 260..1495
thr  20   x 100..799   y 260..1495
thr  40   x 100..799   y 260..1495
thr  60   x 100..799   y 260..1495
thr 100   x 100..799   y 260..1495
```

Every threshold from 10 to 100 returns the identical box on the rebuilt file.

### Cross-check against a text-free control

Method B is the brief's per-frame diff, diffed against a **text-free control
encoded through the identical pipeline**, never against a flat assumed canvas
colour. The control is the same 1020-frame image2 sequence with nothing drawn on
it, same `-framerate 30`, same x264 settings. That cancels the yuv420p frame-edge
chroma artefact that made run 3's first attempt report `x 0..1079, y 0..1513`,
because the control carries the artefact too.

```
residual noise in the known-empty band y1600..1899, delivered minus control:  0
threshold 2 therefore sits above the noise floor by construction

method A (gray, thr 11):                    x 100..799   y 260..1495
method B (delivered minus control, >2):     x  96..801   y 256..1497
```

Method B finds more ink on all four edges, by 2 to 4px, which is the expected
result: single-channel fringing survives an RGB comparison and is averaged away
by the gray conversion. Both methods are measuring ink here (the noise floor in a
known-empty region of the delivered file is exactly 0), so the wider number is
the one reported. Neither method reports ink at the literal frame edge, so there
is nothing here to blame on the codec.

### Declared rects folded in

Pixel measurement is blind to anything within a few luma of the canvas. The logo
card is exactly that kind of element, so its geometry is added explicitly rather
than trusted to either measurement:

```
logo overlay      x 100..231   y 1000..1131   (declared, 132x132 at 100,1000)
progress track    x 100..799   y 1490..1495   (declared)
violet card rule  x 100..799   y  700.. 703   (declared)
declared union    x 100..799   y  700..1495
```

All three sit inside the measured union, so none of them moves it. That is the
outcome to want, not a reason to have skipped the check.

### Reported box, union of everything drawn

```
UNION           x   96..801     y  256..1497
reserves        top y>=200      bottom y<=1559      right x<=879
HEADROOM        top 56px        bottom 62px         right 78px
tightest        56px            verdict PASS (floor is 20px)
```

**Right headroom is 78px, up from run 4's 56px on the same platform**, and that
came entirely from narrowing the column by 20px and taking the 72pt rung instead
of 78pt. The binding constraint is furniture, the progress bar and card rules at
x=799, not type. The widest body type on any frame is scene 12's answer table at
x=792, 87px clear of the limit.

Top and bottom headroom are 56 and 62px against run 4's 56 and 60px, because the
vertical scaffold (eyebrow at y=260, progress bar at y=1490) was kept identical
so that this run's picture is comparable with the last one's.

These are the numbers for the **rebuilt** file, after the cut scene was removed.
The union moved by 2px on two edges (method B's right edge 799 to 801, bottom
1499 to 1497) purely because deleting a scene changes what x264 has to encode and
therefore where sub-threshold fringing lands. The design geometry did not change
and neither did the verdict.

### Body type alone, chrome excluded, per scene

Rows outside `y 710..1449` ignored, which drops the eyebrow, the label, the
violet card rule and the progress bar and leaves only the body type and the logo:

```
scene01  x 100..781  hr  98     scene11  x 100..665  hr 214
scene02  x 100..765  hr 114     scene12  x 100..792  hr  87
scene03  x 100..765  hr 114     scene13  x 100..707  hr 172
scene04  x 100..765  hr 114     scene14  x 100..719  hr 160
scene05  x 100..765  hr 114     scene15  x 102..727  hr 152
scene06  x 103..727  hr 152     scene16  x 101..643  hr 236
scene07  x 100..550  hr 329     scene17  x 100..583  hr 296
scene08  x 100..650  hr 229     scene18  x 101..742  hr 137
scene09  x 100..650  hr 229     scene19  x 100..719  hr 160
scene10  x 100..663  hr 216
```

`hr` is clearance to the x<=879 limit. Scene 1's 781 is the prompt line plus the
typing caret, the widest single element in the cut after the answer table.

---

## Timeline construction, and the trap that was avoided

**No `ffconcat` anywhere.** On an earlier TikTok run the ffconcat demuxer drifted
a scene onto frame 694 instead of the designed 693, because cumulative float
durations put the boundary a third of a microsecond past a frame edge, while
total duration and frame count still looked exactly right. Here the 19 scene
stills are expanded into a 1020-file numbered sequence and encoded with
`-framerate 30 -i seq/f%04d.png`, which is frame-exact by construction.

Verified on the delivered file by decoding all 1020 frames sequentially in one
pass, with no `-ss` anywhere, and counting pixels whose luma moved between
consecutive frames.

**The first threshold chosen was wrong and the sweep caught it.** At a per-pixel
delta of 6, the two populations overlap: 852 changed pixels inside a scene whose
source PNG is literally identical, against 726 at the quietest real boundary.
That 852 is H.264 quantisation noise, not a picture change, and a detector run at
that setting reports a false result. The delta was swept until the intra-scene
population fell clear:

```
delta   max INSIDE a scene   min AT a boundary   separation
    6                  846                 726   overlap
   12                  501                 724   1.4x
   20                  437                 724   1.7x
   32                  248                 724   2.9x
   48                  101                 724   7.2x
```

At delta 12 the populations separate, so a count threshold of 612 sits in the
empty gap between them and **all 18 detected boundaries equal all 18 designed
boundaries**. The quietest boundary is scene 4 to scene 5 at 724px, which is the
caret being removed, a 7x64 block plus one step of the progress bar. It is a real
boundary and it is genuinely almost nothing, which is why this cut needed the
sweep and run 4's did not.

Changed pixels at every designed boundary, delta 12:

```
S01->S02  f18    0.600s     11,483     S10->S11  f360  12.000s      5,172
S02->S03  f36    1.200s      9,524     S11->S12  f390  13.000s     12,206
S03->S04  f54    1.800s      9,105     S12->S13  f516  17.200s    114,531
S04->S05  f72    2.400s        724     S13->S14  f612  20.400s    114,047
S05->S06  f138   4.600s     91,318     S14->S15  f666  22.200s     56,379
S06->S07  f192   6.400s     70,714     S15->S16  f720  24.000s     51,314
S07->S08  f270   9.000s     27,330     S16->S17  f786  26.200s     41,332
S08->S09  f300  10.000s      4,768     S17->S18  f840  28.000s     62,585
S09->S10  f330  11.000s      6,677     S18->S19  f906  30.200s     75,910
```

The four smallest non-caret boundaries, 4,768 to 6,677, are the answer rows
appearing one at a time. That is the intended shape for this driver: the biggest
picture changes in the cut are the wipes at 17.2s and 20.4s, after the table has
been read, not during it.

## Progress bar

`drawbox` cannot animate on 8.1.2. It has no `eval` option and evaluates
`x/y/w/h` once at init, so an expression like `w='700*min(1,t/34)'` would
silently render frozen at its t=0 value with no warning. The bar is therefore 19
static boxes, one per scene, drawn into that scene's still. Verified on the
delivered file that it actually moves, by reading row y=1492 at every scene start:

```
measured  12, 25, 37, 49, 95, 132, 185, 206, 226, 247, 268, 354, 420,
          457, 494, 539, 576, 622, 700
designed  identical, 19 distinct values, monotonic non-decreasing
```

Recomputed for the rebuilt timeline. Cutting a scene changes every subsequent
fill width, so this is a real check rather than a copied one.

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending would
have worked, but run 1 lost a violet rule to alpha-0 blending with no error, and
making that structurally impossible is cheaper than reasoning about it per call.

---

## Duration, exact ffprobe on the DELIVERED files

Probed after the copy into this folder, not on the build copies.

```
tiktok-silent.mp4   format 34.000000   nb_streams 1
                    video  34.000000   1020 frames   1080x1920  yuv420p  30/1

tiktok-scored.mp4   format 34.000000   nb_streams 2
                    video  34.000000   1020 frames   duration_ts 522240 @ 1/15360
                    audio  34.000000   1595 frames   duration_ts 1632000 @ 1/48000
```

34.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string and
`nb_streams=1`. That is what `-an` buys.

**A mux can exit 0 and be unreadable**, so both delivered files were probed for
duration and stream count before this was called done.

**The scored cut did not drift.** The AAC stream decodes to 1,632,256 samples per
channel, 34.005333s of raw payload, but the container reports 34.000000 because
`duration_ts` is 1,632,000 samples exactly, so the trailing quantised tail is
excluded rather than played. `-shortest` is what pins it.

Video is stream-copied into the scored variant. Both files' video streams hash to
`MD5=54e04ed61afbc39efdaa403cef205d4f`, so every picture check above holds for
both.

The cut scene did not change the duration. Its 54 frames were redistributed
inside the same 1020-frame timeline, so `music_norm.wav` was still exactly right
and the audio was re-muxed rather than re-normalised. That is why the loudness
and fade figures below are unchanged and are not stale: the same audio file is
in the delivered container.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master,
1080x1920. Raw `rgb24` MD5 of the cover and of frame 0 of the delivered
`tiktok-silent.mp4` both read `10c17f91086bcd3607aed8669415157b`. Byte-identical,
re-checked on the copies in this folder rather than on the build copies.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build.
Frame 0 renders at full opacity, 31,809 ink pixels, carrying the label
`WE TYPED THIS INTO FIVE AI ENGINES`, the first line of the real prompt and the
caret. The thumbnail the feed shows is a question caught mid-typing, which is the
whole promise of this driver.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed, owned
outright, cleared for commercial use including paid advertising, no attribution
line. 60.000s source, 48kHz stereo. **Held constant across runs on purpose: the
hook is the variable under test, so the bed must not be.**

Trimmed to 34.000s, 0.08s fade in, 1.5s fade out starting at 32.5s.

**The fade in is not cosmetic.** Measured on the source: the first 64 samples
peak at 0.061709 and the first 0.1s peaks at 0.206314, so a cut at sample 0
clicks.

Verified on the **delivered** `tiktok-scored.mp4`:

```
first  16 samples  peak |amp|  0.000412
first  64 samples  peak |amp|  0.002615   <- required below 0.005, PASS
first 512 samples  peak |amp|  0.015522
first 0.08s        peak |amp|  0.158234
first 1.0s         peak |amp|  0.274392
last   64 samples  peak |amp|  0.000007   (fade out lands at silence)
```

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.06   TP -4.41   LRA 3.50   thresh -26.16   offset -1.08
pass 1 also reports what a SINGLE pass would have produced: I -14.92
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.00   TP -4.35   LRA 3.60
```

Integrated lands on -16.00 LUFS. The brief is right that single-pass undershoots:
it would have landed at -14.92, 1.08 LU high. True peak is -4.35 dBTP, under the
-1.5 ceiling rather than at it, because linear mode applies one flat gain and the
peak lands wherever the integrated target puts it. -1.5 is a ceiling not to
exceed, so this is compliant with 2.85 dB spare.

**Honest read: nobody has listened to this file.** Everything above is
measurement. The excerpt is the first 34s of the same track earlier runs used, so
it will sound like those, one second longer. LRA is 3.60 LU over this window
against 6.80 LU over the full 60s track, so the excerpt is less dynamic than the
whole piece. The cuts are driven by reading time and the track runs at a fixed
tempo, so they are not locked to each other and will agree at some cuts by
coincidence rather than design. The four one-second answer-row beats between
9.0s and 13.0s are the one place in the cut where a listener might expect them to
lock, and they do not.

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
`[bg];[1:v]scale=132:132[lg];[bg][lg]overlay=100:1000[out]`. A representative
graph body, scene 3:

```
[0:v]drawtext=fontfile='Inter-SemiBold.ttf':text='B R A N D G E O':x=100:y=260:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=1490:w=700:h=6:color=0x1B1D2B@1:t=fill:replace=1,
drawbox=x=100:y=1490:w=37:h=6:color=0xA78BFA@1:t=fill:replace=1,
drawtext=fontfile='Inter-SemiBold.ttf':text='WE TYPED THIS INTO FIVE AI ENGINES':x=100:y=640:fontsize=30:fontcolor=0xA78BFA,
drawbox=x=100:y=700:w=700:h=4:color=0x7C3AED@1:t=fill:replace=1,
drawtext=fontfile='Inter-SemiBold.ttf':text='Top-rated property':x=100:y=740:fontsize=72:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-SemiBold.ttf':text='management':x=100:y=828:fontsize=72:fontcolor=0xE8E9ED,
drawtext=fontfile='Inter-SemiBold.ttf':text='companies':x=100:y=916:fontsize=72:fontcolor=0xE8E9ED,
drawbox=x=489:y=922:w=7:h=64:color=0xA78BFA@1:t=fill:replace=1[out]
```

**2. Frame-exact sequence, then the silent master.** Each scene still is copied
`frames` times into `seq/f%04d.png`, 1020 files. No ffconcat, no float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i seq/f%04d.png \
  -vf "format=yuv420p" -frames:v 1020 \
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
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 34.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=32.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.06:measured_TP=-4.41:measured_LRA=3.50:measured_thresh=-26.16:offset=-1.08:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**5. Text-free control**, for measurement method B, identical settings and
identical frame count, with nothing drawn:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 1020 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -movflags +faststart -an control.mp4
```

**6. Verification** decodes the delivered files sequentially, never with `-ss`:

```
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt gray -
ffmpeg -hide_banner -loglevel error -i tiktok-silent.mp4 -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i control.mp4       -f rawvideo -pix_fmt rgb24 -
ffmpeg -hide_banner -loglevel error -i tiktok-scored.mp4 -map 0:a:0 -f f32le -ac 2 -ar 48000 -
```

piped frame by frame into numpy. Build artifacts, the control mp4 and the frame
sequences were kept outside this folder; only the three deliverables and this
file were written here.

---

## Design tokens used

Canvas `#090A0F`, ink `#E8E9ED`, accent text `#A78BFA`, violet `#7C3AED` for the
card rules, progress track `#1B1D2B`. `#8B5CF6` is used for no text anywhere; it
measures 4.2:1 on this canvas and fails. Inter ExtraBold for headlines and the
big numeral, SemiBold for the prompt, labels, engine rows and the eyebrow, Bold
for the wordmark, Medium for the URL, all vendored from
`docs/growth/grok-launch/images/_build/fonts/`. Dark only.

The prompt is the only mixed-case type in the cut, and the only place SemiBold
carries a headline-size line. That contrast is what makes it read as an artefact
rather than as copy.

## Open items

- **The five-row answer table is the reusable asset here, not this video.** It is
  the first cut in the campaign that shows per-engine output rather than a
  summary statistic, and it fits in one frame with 87px of right clearance. If
  this driver tests well, the same table shape works for any city page that
  records per-engine placement, and it needs no new collection.
- **Only one city page supports this cut.** Chicago is the only page in the
  program with a verified five-of-five denominator on the current engine set
  AND per-engine placement written out in prose. A second concrete-proof asset
  needs either another unanimous category or a page that records placement per
  engine as structured data rather than in a sentence.
- **`ai-visibility-for-chicago.html` publishes a false superlative and should be
  corrected at source.** "The first fully unanimous result measured anywhere in
  this research program" appears in the hero paragraph, the key findings bar, the
  5/5 callout heading and the FAQPage JSON-LD. Rome, collected two weeks earlier,
  already carried a 5/5, and nine pages collected the same day carry them too;
  Boston has nineteen. Because it is in the JSON-LD, an AI engine parsing the page
  ingests it as a fact about our program. The 5/5 itself is sound and needs no
  change. Out of this task's write scope, and it is the reason a scene was cut
  from this video.
- **Add a superlative trap to the campaign brief.** The existing rule, that
  provenance runs on the figure rather than the page it sits in, catches a
  borrowed third-party statistic. It does not catch our own page asserting
  something false about our own corpus. "First", "only", "most" and "never
  before" are claims about every other page, so they cannot be checked by reading
  the page they appear on.
- **`ONE NAME TOOK / THE WHOLE / CATEGORY.` at 20.4s is the weakest line.** It is
  the one interpretive screen and it restates the table. If a beat has to be cut
  to shorten this to 30s, cut that one and give its 54 frames to scene 12's hold.
- **The Google AI Mode cell reads `NAMED` while the other four read a rank**, and
  a viewer may read that as the engine being weaker rather than as the source
  reporting a different shape of result. It is honest and it is the source's own
  wording, but a future version could label the column `PLACEMENT` to make the
  asymmetry obviously deliberate.
- Nobody has heard the scored cut. See the music section.
- `RUN.md` at the run root records which hook driver the run used, per the brief.
  It already exists in this run folder and is outside this task's write scope; it
  was not read from or written to here.
