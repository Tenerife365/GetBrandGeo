# TikTok cut, run-20260730-0831

**Hook driver: #4, CONTRARIAN. SECOND PASS.** "Ranking first in Google does not
mean you exist in an AI answer."

The first pass is `run-20260730-0113/tiktok/`. This run exists to separate "the
contrarian driver works" from "that particular cut worked", so the execution is
structurally different rather than reworded. What differs, and by how much, is in
[Difference from the first pass](#difference-from-the-first-pass) below.

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

Every line is a separate `drawtext`. Line breaks in the table are literal line
breaks on screen. Boundaries were verified by decoding all 900 frames of the
delivered file in one sequential pass; all 13 land exactly where designed.

| # | Frames | In / out | Text on screen |
|---|---|---|---|
| 1 | 60 | 0.000 to 2.000 | `TWO ENGINES` / `INVENTED A` / `LAW FIRM.` (accent) |
| 2 | 54 | 2.000 to 3.800 | `THE SAME ONE.` / `TWICE.` / `IN TWO CITIES.` (accent) |
| 3 | 54 | 3.800 to 5.600 | `AN ANSWER IS` / `WRITTEN,` / `NOT SORTED.` (accent) |
| 4 | 60 | 5.600 to 7.600 | label `SAME FIVE FOR EVERY CATEGORY` + `CHATGPT` / `GEMINI` / `CLAUDE` / `PERPLEXITY` / `GOOGLE AI MODE` |
| 5 | 54 | 7.600 to 9.400 | label `CHICAGO, 2026-07-24` + `SIX CATEGORIES.` / `ONE RUN.` (accent) |
| 6 | 120 | 9.400 to 13.400 | label `ENGINE AGREEMENT` + six rows: `PROPERTY MANAGEMENT 5/5` `CORPORATE LAW 4/5` `IMMIGRATION LAW 4/5` `PERSONAL INJURY LAW 3/5` `COMMERCIAL BROKERS 3/5` `REAL ESTATE AGENTS 2/5` (counts in accent) |
| 7 | 54 | 13.400 to 15.200 | `FROM FIVE OF FIVE` / `DOWN TO TWO.` (accent) |
| 8 | 57 | 15.200 to 17.100 | label `THE BOTTOM ROW` + `ONE ENGINE NAMED` / `NOT A SINGLE` / `BUSINESS.` (accent) |
| 9 | 51 | 17.100 to 18.800 | `THE ENGINES` / `DO NOT SHARE` / `ONE LIST.` (accent) |
| 10 | 54 | 18.800 to 20.600 | `A DIFFERENT` / `SYSTEM PICKS` / `THESE NAMES.` (accent) |
| 11 | 72 | 20.600 to 23.000 | `RANKING FIRST IS` / `NOT BEING NAMED.` (accent) |
| 12 | 48 | 23.000 to 24.600 | `SEO DID NOT` / `STOP WORKING.` |
| 13 | 54 | 24.600 to 26.400 | `THESE ANSWERS` / `NEED THEIR OWN` / `MEASUREMENT.` (accent) |
| 14 | 108 | 26.400 to 30.000 | BrandGEO lockup artwork + `SEE WHERE YOU` / `LAND IN THE FIVE.` (accent) + `getbrandgeo.com` |

Persistent on scenes 1 to 13: the BrandGEO mark and wordmark, top left, as PNG
artwork. Persistent on every frame: a **vertical left rail** at x 88, filling
downward as the cut runs.

### Why the copy is shaped this way

The contrarian driver has two failure modes and the first pass avoided them by
stating the belief and denying it immediately. That works, and it is exactly the
thing this pass is not allowed to repeat, because a second cut built the same way
tests nothing.

So this one **withholds the contrarian claim until 20.6s, 69% of the way in**,
and spends the first two thirds showing what an AI answer actually is. The
sequence is: an answer can contain a company that does not exist (0.0 to 5.6s);
here is one city's six categories and how far the five engines agreed, which
ranges from all five down to two (5.6 to 15.2s); one of those answers named no
business at all (15.2 to 17.1s); therefore the engines are not reading off one
shared list (17.1 to 20.6s). Only then: `RANKING FIRST IS / NOT BEING NAMED.`

That ordering is the point. The first pass argues from the belief down to the
evidence. This one argues from the evidence up to the belief, and the viewer
who bounces at 15s has still seen the whole proof.

`SEO DID NOT / STOP WORKING.` is the same guard the first pass carried and it is
kept deliberately. On TikTok the overreaching version of this claim earns a
comment pile-on that buries the argument. It is stated in different words and in
a different position (23.0s, after the claim rather than as a preamble).

TikTok gets the bluntest of the four cuts. Longest line on screen is 17
characters. Hard cuts only, no fades anywhere in the picture, no connective
tissue.

**The first two seconds carry one screen, not three.** The first pass built a
sentence across three scenes before its reversal at 1.5s. This one opens on a
single completed statement and holds it for a full 2.0s, which is the longest
opening hold of any TikTok cut in this campaign. Measured on frames decoded from
the delivered file:

```
t=0.000  f0    ink 47,079 px   TWO ENGINES / INVENTED A / LAW FIRM.
t=2.000  f60   ink 46,105 px   THE SAME ONE. / TWICE. / IN TWO CITIES.
t=9.400  f282  ink 64,712 px   the six-row table, the densest screen in the cut
t=15.200 f456  ink 59,538 px   the three-line bottom-row screen
```

---

## Factual position, and where every claim comes from

Every row quotes the live HTML **verbatim, including the company names the
source pages publish**. Those names are quoted here so the claim can be checked
against the page; **not one of them appears on screen**, which is the rule that
matters. See restraint 1 below.

Nothing here comes from `bg-004.html`, which is excluded from this run: that page names Microsoft Copilot in its body and
retired Meta AI in its methodology, so its engine set cannot be stated correctly
at all, in any form.

| On screen | Live source text | File |
|---|---|---|
| `TWO ENGINES` / `INVENTED A` / `LAW FIRM.` | "2 Engines (ChatGPT, Gemini) that independently rendered the same incorrect law-firm name, a real cross-engine data point, kept as reported" | `brandgeo/web/ai-visibility-for-chicago.html`, key findings bar |
| same | "2x Cities where ChatGPT and Gemini both independently invented the same fictional law firm name, a genuine cross-program anomaly" | `brandgeo/web/ai-visibility-for-boston.html`, key findings bar |
| `THE SAME ONE.` / `TWICE.` / `IN TWO CITIES.` | "The same fictional name, twice, in two different cities"; "This is the identical error already documented in Chicago's corporate-law dataset, appearing independently in the same two engines." | `ai-visibility-for-boston.html`, body |
| `AN ANSWER IS` / `WRITTEN,` / `NOT SORTED.` | comparison table row "How the system decides": SEO "Crawl to index to rank by relevance and authority signals" against GEO "Retrieve, verify entity and trust signals, synthesize an answer" | `brandgeo/web/bg-005.html`, comparison table |
| `SAME FIVE FOR EVERY CATEGORY` + the five engine names | "6 categories spanning personal injury law, real estate, property management, immigration law, corporate law, and commercial real estate, each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity." | `ai-visibility-for-chicago.html`, "What we actually asked" |
| `CHICAGO, 2026-07-24` | "Original research, data collected 2026-07-24, BrandGEO's own AI Visibility pipeline" | same page, hero |
| `SIX CATEGORIES.` / `ONE RUN.` | same sentence as above, plus "All 5 engines returned usable data on every prompt this run, no collection errors" | same page |
| `ENGINE AGREEMENT` (column header) | "'Engine agreement' counts how many of the 5 engines tested independently named the same brand." | same page, table caption |
| `PROPERTY MANAGEMENT 5/5` | "Property management . Landmark Property Management . 5/5, full unanimous consensus" | same page, consensus table |
| `CORPORATE LAW 4/5` | "Corporate law . Kirkland & Ellis . 4/5, unanimous #1" | same |
| `IMMIGRATION LAW 4/5` | "Immigration law . Minsky, McCormick & Hallagan, P.C. . 4/5" | same |
| `PERSONAL INJURY LAW 3/5` | "Personal injury law . Clifford Law Offices . 3/5, unanimous #1 where structured" | same |
| `COMMERCIAL BROKERS 3/5` | "Commercial real estate . CBRE / the 'Big Four' (loose) . 3/5" | same |
| `REAL ESTATE AGENTS 2/5` | "Real estate agents . Vesta Preferred Realty (loose) . 2/5, most fragmented" | same |
| `FROM FIVE OF FIVE` / `DOWN TO TWO.` | the range of that same column, 5/5 at the top row to 2/5 at the bottom | same |
| `ONE ENGINE NAMED` / `NOT A SINGLE` / `BUSINESS.` | "Best real estate agents for buying a home in Chicago . Most fragmented category; one engine declined to name anyone"; and "No agent name crossed 2/5 engines, and one engine declined to name anyone at all." | same page, prompt list and takeaways |
| `THE ENGINES` / `DO NOT SHARE` / `ONE LIST.` | the spread in the table above, plus "What Chicago's result does not show is agreement on rank: the engines agree Landmark belongs in the answer, and place it anywhere from #1 to #4." | same page, body |
| `A DIFFERENT` / `SYSTEM PICKS` / `THESE NAMES.` | "How the system decides" row, as above | `bg-005.html` |
| `RANKING FIRST IS` / `NOT BEING NAMED.` | "Objective: Rank as high as possible in a list of links" against "Be named (or better, recommended) inside a single generated answer"; and "SEO optimizes for a spot on a list the user still has to read. GEO optimizes for being the answer the user never has to look past." | `bg-005.html`, comparison table and body |
| `SEO DID NOT` / `STOP WORKING.` | "this isn't a clean break, and treating GEO as a total departure from SEO is its own mistake"; "Technical SEO . is table stakes for GEO exactly as it always was for classic search"; "You still need the SEO foundation." | `bg-005.html`, body |
| `THESE ANSWERS` / `NEED THEIR OWN` / `MEASUREMENT.` | "SEO and GEO need to run in parallel, measured separately, not folded into one score or one team's existing dashboard." | `bg-005.html`, body |

**The denominator is verified, not assumed.** Chicago's 2026-07-24 run used
**Google AI Mode in place of the retired Meta AI**, and the page's data-quality
note states that all five engines returned usable data on every prompt that run
with no collection errors. So every `x/5` on screen has a real five-engine
denominator, and it is the current five-engine Growth set. A measurement keeps
the denominator it was collected with, and this one was collected with the
lineup it is shown against.

### Restraints, each of which cost a stronger-looking screen

1. **No brand name appears anywhere.** Six categories are on screen and each of
   them has a named winner on the source page. Publishing a measured result on a
   dated research page and putting a company's name in an ad are different acts:
   the page is a record, the ad is commercial use of a name whose owner never
   agreed to appear. The finding survives intact as counts.
2. **The two engines that invented the firm are not named**, although the source
   pages name both. Attaching a fabrication to one company's product inside an
   ad is not the same as reporting it on a research page with a right of reply.
   `TWO ENGINES` carries it.
3. **The fabricated name itself is not shown**, and neither is the real firm it
   was derived from. The real firm is a measured subject; the invented string is
   its near-neighbour and putting it on screen would spread it further.
4. **`ENGINE AGREEMENT` is the source page's own column header, not a rewrite.**
   An earlier draft headed the column "ENGINES THAT AGREED ON ONE NAME". That is
   wrong for two of the six rows: the page marks commercial real estate and real
   estate agents "(loose)", meaning agreement on a group or a loosely identified
   name rather than one exact brand. Using the page's own header keeps the column
   honest at 40pt with no room for a footnote.
5. **No superlative, and this run had two available.** The Chicago page still
   asserts "the clearest single-rank agreement measured in this research program"
   and "the steepest gap documented in this research program", and Boston asserts
   "the most 5/5-dense city measured across this entire research program". Its
   tables are used; none of its claims are. See the open item at the end.
6. **No `5 / 5` as a hero numeral.** It sits in a table row alongside 4/5, 4/5,
   3/5, 3/5 and 2/5, which is the honest shape. Isolated at 240pt it reads as
   what usually happens, and it is not.
7. **The `bg-005` third-party statistics were not used.** They are published on
   our page but measured by outside firms, and one of them is an AI Overviews
   rate, which this campaign does not publish at all.

### Compliance, run on the drawn bytes

Every check below reads the `text='...'` values parsed back out of the
filtergraph script files that were passed to `-/filter_complex`, concatenated per
scene in draw order. Not the build definition, not the brief, not these notes.

**Negative controls: 34 of 34 injected defects were caught**, and the scan is
clean again with the injections removed. Two real bugs were found only because of
that step:

- the engine-lineup scanner reported every hit against scene 0 rather than the
  scene it found, so a per-scene assertion could never match it. It looked clean
  on the real strings and would have looked clean on `META AI` too.
- the measured-subject harvester kept candidates made entirely of allowed or
  common tokens, so `Chicago`, `AI Mode` and `Another` all reached the never-list
  and produced 8 false positives. Fixing that surfaced that the harvester's
  source paths had been **relative to a scratch directory that does not contain
  the repo**, so `harvest()` had been returning an empty corpus and the
  measured-subject scan had been passing on nothing at all. It now asserts the
  three source pages exist before it runs.

| Scanner | Result | Controls |
|---|---|---|
| dash (em, en, figure, minus, `--`) | CLEAN | 3 injected, 3 fired |
| banned vocabulary | CLEAN | 3 injected, 3 fired |
| superlative | CLEAN, 1 adjudicated | 3 injected, 3 fired |
| universal | CLEAN, 1 adjudicated | 3 injected, 3 fired |
| measured subject | CLEAN | 8 real names + 8 diacritic and transliteration variants, 16 fired |
| engine lineup | CLEAN | 4 injected (Meta AI, Grok, Copilot, AI Overviews), 4 fired |
| percentage / rate | CLEAN | 2 injected, 2 fired |

The measured-subject scan normalises **NFKD, then strips combining marks, then
case-folds, in that order**, and also generates ae/oe/ue transliterations and
eszett expansion, which normalisation alone does not produce. Controlled with
`Engel & Völkers` in the corpus against `ENGEL & VOLKERS` on screen (the run 9
failure), `Müller Bau` against `MUELLER BAU`, `L'Oréal Group` against both
`L'OREAL GROUP` and a typographic apostrophe, and `Straße Partner` against
`STRASSE PARTNER`. All fired. One further control, `Chicago Title Insurance`,
confirms the allow-list suppresses the bare token `Chicago` without blinding the
scanner to a real company whose name starts with it.

**Two adjudicated hits.** Both are deliberate and both are recorded in the
scanner itself, so an unadjudicated recurrence still fails:

- `first`, scene 11, `RANKING FIRST IS NOT BEING NAMED.` **Ordinal, not a
  ranking claim.** It names a position on a results page and asserts nothing
  about any other page in the BrandGEO corpus, which is the thing a superlative
  cannot verify from the inside. Kept because rewriting it would cost the driver
  its plainest statement.
- `not a single`, scene 8, `ONE ENGINE NAMED NOT A SINGLE BUSINESS.` Quantifies
  over the contents of **one measured answer**, not over people or businesses in
  the world. It is a count of what one engine returned, so a counterexample
  elsewhere cannot refute it. Same species as `YOU CANNOT / EDIT IT.` in the
  first pass.

Other compliance:

- Engines named are exactly the five in the Growth set: ChatGPT, Gemini, Claude,
  Perplexity, Google AI Mode. **No Grok and no Google AI Overviews**, both live
  from 2026-07-29 with single-digit row counts from one day. **No Meta AI**,
  retired and in no plan set. No Copilot, no DeepSeek.
- **No percentage or rate anywhere.** Every number on screen is a count of
  engines out of five and carries a header saying so.
- No pricing, no plan names, no engine-count claim about what BrandGEO sells.
  TOFU, soft CTA.
- No cross-city aggregate is claimed. One city, one collection run, six
  categories, plus one cross-city anomaly that both pages report identically.

---

## Difference from the first pass

Run 0113's TikTok cut is the control. Two things it did are banned this round and
neither appears here: **the opening beat is not the search-ranking-versus-AI-
answer contrast**, and **no figure from `bg-004` is used in any form**, including
`bg-005`'s restatement of the same finding, which would have been the easy way
around it.

| | run-20260730-0113 | this run |
|---|---|---|
| Where the contrarian claim lands | scene 4, **1.533s, 4.6% in** | scene 11, **20.600s, 69% in** |
| Argument direction | belief stated, then denied, then evidenced | evidence shown, then the belief named |
| Opening beat | `YOU RANK FIRST / IN GOOGLE. / SO AI NAMES YOU.` built over 3 scenes | one completed screen held 2.0s, about a fabricated firm |
| Evidence | `bg-004` presence and absence, plus Chicago 5/5 as a hero numeral | Chicago and Boston fabrication anomaly, plus Chicago's six-category agreement spread |
| Chicago used as | one `5 / 5` at 240pt with the category as a label | six rows of a table, 5/5 down to 2/5, held 4.0s |
| Biggest type | 240pt numerals, twice | none, 66pt headline is the largest thing in the cut |
| Progress furniture | horizontal bar, bottom, spanning the column | **vertical left rail**, so type owns the right edge |
| Brand | `B R A N D G E O` as drawn tracked-out type, logo only at the end | mark and wordmark as **PNG artwork** on 13 of 14 scenes, full lockup on the end card |
| Engine list | dedicated scene at the end, 27.0 to 29.5s | at 5.6s, as the denominator for the table that follows |
| Pace | 21 scenes over 33.000s, 1.57s average | 14 scenes over 30.000s, 2.14s average |
| Guard | `SEO STILL WORKS.` before the CTA | `SEO DID NOT / STOP WORKING.` after the claim |
| CTA | `SEE WHAT THEY / SAY ABOUT YOU.` | `SEE WHERE YOU / LAND IN THE FIVE.` |

The n-gram diff below is the evidence that this is a difference and not an
intention. Intent to differ is not evidence of difference.

### N-gram diff

Floor 2, closed-class exempt, **SCENE STREAMS on both sides**. Both traps the
brief records are avoided by construction: the comparison is never made inside a
single `drawtext` (a sentence drawn as three stacked layers never forms a long
n-gram inside any one of them), and the floor is 2 rather than 3 (a verbatim line
passes a 3-gram floor if the earlier pass broke it over two rendered lines).

Corpus: **every other `NOTES.md` under `docs/growth/reel-campaign-ab/`**, which
at the time of the final run was 42 files across nine previous runs, the four
bilingual cuts, and the sibling platforms of this run that had already landed.
On-screen text is carried in backticks in those files' verbatim tables, so all
backticked spans on one markdown table row are reconstructed as one scene.

```
RESULT: CLEAN. Zero unexempted n-grams of length 2 or more shared with any
previous cut in this campaign.
```

Two exemption classes, both listed in full rather than folded in silently:

- **The engine list and the URL**, which the brief names as the expected residual
  overlap. Any n-gram composed entirely of `chatgpt gemini claude perplexity
  google ai mode brandgeo getbrandgeo com` is exempt.
- **The measured category labels.** `PROPERTY MANAGEMENT`, `CORPORATE LAW` and
  `REAL ESTATE AGENTS` collide with four previous cuts that read the same source
  page. These are data, not copy: renaming a measured category to dodge a
  previous run would misreport which category was measured. 10 suppressions,
  every one of them inside scene 6's table, all printed by the checker.

**The diff was negative-controlled, 5 of 5 probes behaved as expected**, because
a diff that has not been controlled reports clean when it cannot see:

| Probe | Expected | Got |
|---|---|---|
| a verbatim 7-word run lifted from a previous cut | fires | fires |
| the first 2 content words of that same run | fires | fires |
| a closed-class only string, `IS NOT THE` | quiet | quiet |
| a string with no overlap at all | quiet | quiet |
| the engine list, the expected residual | quiet | quiet |

The check was **run last**, after the sibling Facebook, Instagram and YouTube
folders of this run had landed on disk, so it covers them too.

It also changed the cut twice. The first pass of the diff returned 22 hits and
one of them mattered: **run-20260730-0216's TikTok cut had already built the
per-engine placement ledger** for this exact Chicago category, revealing
`CHATGPT #1`, `CLAUDE #1`, `PERPLEXITY #2`, `GEMINI #4`, `GOOGLE AI MODE NAMED`
one row at a time. That was this cut's original centrepiece, arrived at
independently, and it was replaced wholesale with the six-category agreement
table. Reading run 0113 would never have caught it, because the collision was
with a different run.

---

## Safe-zone measurement

TikTok reserves 200px top, 360px bottom, 200px right. Usable box `y 200..1559`,
`x ..879`. Everything below is measured on frames decoded out of the **delivered**
`tiktok-silent.mp4`, never an intermediate, sequentially in one pass, with no
`-ss` anywhere.

### Ink threshold, argued from a measured control

Measured first, chosen second. Three regions that are empty by design, over all
900 frames of the delivered file:

```
y 1600..1899 (below the rail)   min 9   max 9
x  900..1079 (right of type)            max 9
y    0.. 239 (above the brand)          max 9

luma peaks actually present in the delivered file, f0 + f282 + f456:

Y=  9   6,006,799 px   canvas #0a0b0e
Y= 35      11,140 px   rail track #23242b, the dimmest thing deliberately drawn
Y= 95       1,448 px   violet rule #7c3aed
Y=158      22,517 px   label #9ba1ac and accent #a78bfa, which are within
                       0.4 of each other in luma by construction
Y=232      41,345 px   ink #e8e9ed
```

The encoded background is a flat 9 with **zero variance** in all three regions
where nothing is drawn, measured over all 900 frames. Values between 10 and 34 do
exist in the histogram, but only as antialiasing skirts and DCT ringing around
drawn elements, a few hundred pixels each, with no population of its own.
**Threshold 11** therefore sits one step above the background rather than
mid-gap, so every skirt is counted and the reported box can only be larger than
the design box, never smaller.

The result is not threshold-sensitive. Union over all 900 frames:

```
thr  11   x  88.. 799   y 269..1451      <- method A
thr  12   x  88.. 798   y 270..1449
thr  15   x  88.. 798   y 270..1449
thr  20   x  88.. 797   y 270..1449
thr  40   x  88.. 797   y 270..1449
thr  60   x  88.. 797   y 270..1449
thr 100   x  88.. 797   y 270..1449
```

### Cross-check against a text-free control

Method B is the per-frame RGB diff, against a **text-free control encoded through
the identical pipeline**: the same 900-frame numbered sequence with nothing drawn
on it, same `-framerate 30`, same x264 settings. The control carries the yuv420p
frame-edge chroma artefact too, so it cancels; a flat assumed canvas colour would
not.

A control cancels artefacts it SHARES. It cannot cancel the encoder's response to
content it does not have, so the threshold is set from a noise floor measured in
the delivered file's own empty-by-design regions rather than picked by eye:

```
noise floor, delivered minus control, y1600..1899 :  0
                                      x 900..1079 :  0
                                      y    0.. 239:  0
so any threshold above 0 sits above the floor

method A (gray, thr 11):                  x  88..799   y 269..1451
method B (delivered minus control, >2):   x  86..799   y 266..1455
```

Method B finds more ink on the left, top and bottom by 2 to 4px, and agrees to
the pixel on the right edge. Single-channel fringing survives an RGB comparison
and is averaged away by the gray conversion, so that is the expected direction.
Both are measuring ink here, so the wider number is the one reported.

### Declared rects folded in

Pixel measurement is blind to anything within a few luma of the canvas, so the
build's declared geometry is added explicitly rather than trusted to either
measurement. These are read from the build's own dump, not retyped:

```
rail track      x  88.. 93   y  270..1449   (all 14 scenes)
brand mark      x 128..161   y  270.. 317   (13 scenes)
brand wordmark  x 178..367   y  278.. 309   (13 scenes)
table rule      x 128..787   y  680.. 682   (scene 6)
table rule      x 128..787   y  720.. 722   (scene 4)
cta lockup      x 128..467   y  520.. 785   (scene 14)
declared union  x  88..787   y  270..1449
```

All of it sits inside the measured union, so none of it moves the box. That is
the outcome to want, not a reason to have skipped the check.

**Retyping those rects is a real trap and it fired here.** The first version of
the type-only pass had the rule's coordinates hardcoded from an earlier layout.
The rule had since moved 58px up, so the mask missed it and the pass reported
`819` as the widest TYPE, which was the rule. The check now loads the rects from
the build's own declared list.

### Reported box

```
UNION           x   86..799     y  266..1455
reserves        top y>=200      bottom y<=1559      right x<=879
HEADROOM        top 66px        bottom 104px        right 80px
tightest        66px            verdict PASS (floor is 20px)

TYPE ONLY       x  127..798     y  660..1143   (furniture rects dilated 3px)
HEADROOM        top 460px       bottom 416px        right 81px
widest type     scene 8, ONE ENGINE NAMED, x1 = 798
```

**Which of union or type binds each edge:**

| Edge | Union | Type | Binds |
|---|---|---|---|
| top 200 | 266 | 660 | **furniture**, the brand mark at y 270 |
| bottom 1559 | 1455 | 1143 | **furniture**, the rail track ending at y 1449 |
| left | 86 | 127 | **furniture**, the rail at x 88 (no left reserve on TikTok) |
| right 879 | 799 | 798 | **TYPE**, on all 14 scenes |

The right edge is the one that matters on TikTok and the one a copy edit moves,
and it is owned by type on every frame. The per-scene union right edge equals the
per-scene type right edge on all 14 scenes: 599, 646, 618, 787, 699, 787, 751,
798, 624, 626, 770, 671, 701, 727.

**Getting there took a deliberate change.** Run 2's TikTok progress bar set x0,
x1 and y1 on every frame, so its measured box described the bar. This build uses
a vertical left rail instead, which is why the right edge is free. But the first
render of this cut still had furniture binding x1 on 2 of 14 scenes, because the
table rules were drawn 692px wide and reached x 819 while the widest type reached
798. The rules were shortened to 660px, x1 = 787, deliberately **narrower than
the widest line in the cut**, and the whole file was re-encoded and re-measured.
A 21px difference is not visible and it is the difference between a number that
tests the copy and one that tests a rule.

Type size was fitted by measurement, not chosen. Every unique line was rendered
alone at 100pt, its ink width measured, and the largest size from the ladder
78/72/66/60/54 whose widest line fits the 692px column was taken:

```
widest line at 100pt:   ONE ENGINE NAMED    1015 px
                        FROM FIVE OF FIVE    944 px
                        NOT BEING NAMED.     973 px
78pt predicted:  1015 * 0.78 = 791.7 px  against a 692 px budget  -> does not fit
72pt predicted:  1015 * 0.72 = 730.8 px                           -> does not fit
66pt predicted:  1015 * 0.66 = 669.9 px                           -> FITS
66pt measured on the delivered mp4:  x 128..798  (671 px)
```

Prediction and delivered file agree to 1px. Point-size scaling of a hinted TTF is
not exactly linear, so the fitter is an estimate used only to pick a size; the
pass/fail number is always the box measured out of the delivered mp4.

The six-row table was fitted the same way and it caught a collision no visual
check at preview scale would have: `PROPERTY MANAGEMENT` at 40pt runs to x 646,
and the value column had been placed at x 620, so `5/5` was drawn on top of the
last two letters. The column moved to x 700. Measured on the built still, the
narrowest gap between a row label and its count is now 56px on that row, and the
widest table content reaches x 767.

---

## Timeline construction

**No `ffconcat` anywhere.** Cumulative float durations drift: 70/30 = 2.333333
put a scene cut a third of a microsecond past a frame edge on an earlier run and
landed a scene one frame late, while total duration and frame count stayed
exactly right, so nothing about the container looked wrong. Here the 14 scene
stills are expanded into a 900-file numbered sequence and encoded with
`-framerate 30 -i seq/f%04d.png`, which is frame-exact by construction.

Verified on the delivered file by counting pixels whose luma moved by more than
delta between consecutive frames, decoded sequentially in one pass. Boundaries
are measured by **CHANGED-pixel count, not ink count**, and the delta is swept
rather than picked:

```
delta  8: max intra-scene    461   min at-boundary  37,477   gap x81.3    13/13 exact
delta 16: max intra-scene    427   min at-boundary  36,881   gap x86.4    13/13 exact
delta 32: max intra-scene    173   min at-boundary  36,249   gap x209.5   13/13 exact
delta 48: max intra-scene     49   min at-boundary  35,356   gap x721.6   13/13 exact
```

All 13 designed boundaries detected at every delta, none spurious, and the two
populations separate by a factor of 81 even at the noisiest delta. Frame hashing
was not used: identical pictures get different quantisation noise in H.264, so
hashes differ where nothing changed.

## Left rail

`drawbox` cannot animate on ffmpeg 8.1.2. It has no `eval` option and evaluates
`x/y/w/h` once at init, so an expression like `h='1180*min(1,t/30)'` would render
frozen at its t=0 value with no warning. The rail is therefore 14 static boxes,
one per scene, drawn into that scene's still. Verified on the delivered file by
reading the rail's centre column at frame 0 and at every scene start:

```
measured  80, 149, 220, 299, 370, 528, 598, 673, 739, 810, 905, 968, 1038, 1180
designed  identical, 14 distinct values, strictly increasing
```

`replace=1` is on **every** `drawbox`. The source is opaque RGB so blending would
have worked, but making the alpha-0 failure structurally impossible is cheaper
than reasoning about it per call.

---

## Duration and streams, exact ffprobe on the DELIVERED files

```
tiktok-silent.mp4   format 30.000000   nb_streams 1
                    video  30.000000   900 frames   1080x1920  yuv420p  30/1

tiktok-scored.mp4   format 30.000000   nb_streams 2
                    video  30.000000   900 frames   duration_ts 460800 @ 1/15360
                    audio  30.000000  1408 frames   duration_ts 1440000 @ 1/48000
```

30.000s, inside the 25 to 40s TikTok target.

**The silent master has zero audio streams**, not a silent audio track.
`ffprobe -select_streams a -show_entries stream=index` returns an empty string
and `nb_streams=1`. That is what `-an` buys.

**A mux can exit 0 and be unreadable**, so both delivered files were probed for
duration and stream count before this was called done.

**The scored cut did not drift.** The AAC stream decodes to 1,440,768 samples per
channel, 30.016s of raw payload, but `duration_ts` is 1,440,000 samples exactly,
so the quantised tail is excluded rather than played. `-shortest` is what pins it.

Video is stream-copied into the scored variant. Both files' video streams hash to
`MD5=97e4a0d060bb7f4c4a0e7e7aeedef798`, so every picture measurement above holds
for both.

## Cover

`tiktok-cover.png` is the literal first frame, extracted from the encoded master,
1080x1920. Raw `rgb24` MD5 of the cover and of frame 0 of the delivered
`tiktok-silent.mp4` both read `5649a4f71310836237adb07de7cbe229`. Byte-identical.

**Scene 1 does not fade.** There is no `fade` filter anywhere in this build.
Frame 0 renders at full opacity carrying 47,079 ink pixels at threshold 11, so
the thumbnail the feed shows is the complete first statement, not a blank
rectangle.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** BrandGEO-composed by
`scripts/compose_music.py`, owned outright, cleared for commercial use including
paid advertising, no attribution line. 60.000s source, 48kHz stereo, 24-bit.

**Held constant across every run on purpose: the hook is the variable under test,
so the bed must not be.** `assets/audio/ATTRIBUTION.md` maps `contrarian-drive`
to the contrarian hook type, and that mapping is explicitly not a per-run
instruction for this campaign. Varying the music alongside the hook would leave a
winning run with two candidate explanations.

**There is no voice anywhere in this cut** and the LibriTTS attribution line does
NOT apply to it. That line belongs to the Piper voiceover assets elsewhere in
`assets/audio/`, and adding it here would be a false statement about this file.

Trimmed to 30.000s, 0.08s fade in, 1.5s fade out starting at 28.5s.

**The fade in is not cosmetic.** Measured on the source, the first 64 samples
peak at 0.061709 and the first 0.1s peaks at 0.206314, so a cut at sample 0
clicks.

Verified on the **delivered** `tiktok-scored.mp4`:

```
first  16 samples  peak |amp|  0.000679
first  64 samples  peak |amp|  0.002899   <- required below 0.005, PASS
first 512 samples  peak |amp|  0.015579
first 0.08s        peak |amp|  0.168424
first 1.0s         peak |amp|  0.291594
last   64 samples  peak |amp|  0.000001   (fade out lands at silence)
```

Loudness, two-pass `loudnorm` with `linear=true`:

```
pass 1 measured:  I -16.20   TP -4.41   LRA 3.60   thresh -26.25   offset -1.11
pass 1 also reports what a SINGLE pass would have produced: I -14.89
pass 2 applied:   linear=true, I=-16, TP=-1.5, LRA=11
verified output:  I -16.00   TP -4.21   LRA 3.60
```

Integrated lands on -16.00 LUFS. The brief is right that single-pass undershoots:
it would have landed at -14.89, 1.11 LU high. True peak is -4.21 dBTP, under the
-1.5 ceiling rather than at it, because linear mode applies one flat gain and the
peak lands wherever the integrated target puts it. -1.5 is a ceiling not to
exceed, so this is compliant with 2.7 dB spare.

**Honest read: nobody has listened to this file.** Everything above is
measurement. LRA is 3.60 LU over this 30s window against 6.80 LU over the full
60s track, so the excerpt is less dynamic than the whole piece. The cuts are
driven by reading time and the track runs at a fixed 100 BPM, so cuts and beats
are not locked to each other and will coincide by chance rather than by design.

---

## Commands

Fonts and logo artwork are referenced by bare filename with ffmpeg's cwd set to
the build folder. This is load-bearing on Windows: a drive-letter colon inside a
filtergraph option value terminates the option even when the value is quoted, so
`fontfile=C:/...` fails to parse.

**1. Scene stills**, one PNG per scene, 14 total, filtergraph written to a file:

```
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i color=c=0x0a0b0e:s=1080x1920 \
  -i brandgeo-mark-transparent-h512.png \
  -i brandgeo-wordmark-dark-transparent-w512.png \
  -/filter_complex scenes/gNN.txt -map "[out]" -frames:v 1 -update 1 \
  -pix_fmt rgb24 scenes/sNN.png
```

Scene 14 takes `brandgeo-lockup-dark-transparent-w512.png` as its only overlay
input instead. A representative graph body, scene 11:

```
[0:v]drawbox=x=88:y=270:w=6:h=1180:color=0x23242b@1:t=fill:replace=1,
drawbox=x=88:y=270:w=6:h=905:color=0xa78bfa@1:t=fill:replace=1,
drawtext=fontfile='Inter-ExtraBold.ttf':text='RANKING FIRST IS':x=128:y=780:fontsize=66:fontcolor=0xe8e9ed,
drawtext=fontfile='Inter-ExtraBold.ttf':text='NOT BEING NAMED.':x=128:y=864:fontsize=66:fontcolor=0xa78bfa[v0];
[1:v]scale=34:48[o0];[v0][o0]overlay=128:270[v1];
[2:v]scale=190:32[o1];[v1][o1]overlay=178:278[out]
```

`#` is escaped as `\#` in every `text=` value, because ffmpeg strips `#` comments
from a filtergraph read out of a script file.

**2. Frame-exact sequence, then the silent master.** Each scene still is copied
`frames` times into `seq/f%04d.png`, 900 files. No ffconcat, no float durations:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i seq/f%04d.png \
  -vf "format=yuv420p" -frames:v 900 \
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
ffmpeg -hide_banner -loglevel error -y -i music.wav -t 30.0 \
  -af "afade=t=in:st=0:d=0.08,afade=t=out:st=28.5:d=1.5" \
  -ar 48000 -c:a pcm_s24le music_cut.wav

ffmpeg -hide_banner -i music_cut.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

ffmpeg -hide_banner -loglevel error -y -i music_cut.wav \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-16.20:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.25:offset=-1.11:linear=true" \
  -ar 48000 -c:a pcm_s24le music_norm.wav

ffmpeg -hide_banner -loglevel error -y -i tiktok-silent.mp4 -i music_norm.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -shortest -movflags +faststart tiktok-scored.mp4
```

**5. Text-free control** for measurement method B, identical settings and
identical frame count, with nothing drawn:

```
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i cseq/f%04d.png \
  -vf "format=yuv420p" -frames:v 900 \
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

piped frame by frame into numpy. Build artifacts, the control mp4 and the two
frame sequences were kept outside this folder; only the four deliverables were
written here.

---

## Design tokens used

Read out of the repo, `brandgeo/web/index.html` `:root`, not from the brief:
canvas `--bg #0a0b0e`, ink `--t #e8e9ed`, label `--t2 #9ba1ac`, accent text
`--ac-text #a78bfa`, rules `--ac-strong #7c3aed`, rail track `--bd #23242b`.
**`--ac #8b5cf6` is used for no text anywhere**; white on it measures 4.23:1 and
it is a fill token only, and as an accent word on this canvas it would fail. Inter
ExtraBold for headlines and counts, SemiBold for labels and table rows, Medium
for the URL, all vendored from `docs/growth/grok-launch/images/_build/fonts/`.
Logo artwork from `docs/growth/CAMPAIGN-2026-07-30/_shared/logo/`. Dark only.

## Open items and things not verified

- **Nobody has heard the scored cut.** See the music section. Every audio claim
  above is a measurement of the delivered file, not a listening note.
- **The Chicago and Boston pages still assert program-wide superlatives about
  themselves**, which is the class of claim the brief added a rule for after two
  cuts had to be re-rendered. Chicago's "the clearest single-rank agreement
  measured in this research program" and "the steepest gap documented in this
  research program", and Boston's "the most 5/5-dense city measured across this
  entire research program", are all unverifiable from the page asserting them.
  Chicago's older "first fully unanimous result" claim, which the first pass
  quoted, **has since been corrected in the live file** to "one of ten cities in
  this program where a single brand was named by every engine tested". The
  remaining ones were not used here and are out of this task's write scope.
- **Two rows of the table carry a "(loose)" qualifier on the source page**,
  commercial real estate and real estate agents, meaning the count is agreement
  on a group or a loosely matched name rather than one exact brand. This is why
  the column is headed `ENGINE AGREEMENT`, the page's own header, rather than
  anything stronger. A 1.5s screen cannot carry the qualifier, and dropping the
  two rows would have made the spread look narrower than it is. Flagged rather
  than silently resolved.
- **The `2x cities` fabrication figure is a cross-city aggregate over the
  program**, unlike everything else in this cut, which is one city and one run.
  It is stated as "twice, in two cities" rather than as a rate, and both pages
  report it identically, but it is the one claim here that is not confined to a
  single collection.
- **The fabrication opener is a judgement call.** It leads a BrandGEO asset with
  an AI engine getting a fact wrong, which is a real risk of reading as an
  argument against the category the product sells into. It was chosen because it
  is the fastest available proof that the answer layer is not a ranked list of
  real pages, which is the contrarian claim's whole load. If this run tests
  poorly, that beat is the first thing to swap, not the verdict at 20.6s.
- `RUN.md` at the run root records which hook driver the run used, per the brief.
  It is outside this task's write scope and was not created here.
- No file outside this folder was written. No git command was run. Nothing was
  posted or scheduled.
