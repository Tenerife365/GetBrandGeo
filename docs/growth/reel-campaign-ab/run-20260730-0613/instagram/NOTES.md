# Instagram Reel, run 20260730-0613

**Hook driver:** #3, curiosity gap. **SECOND PASS.**

Run 3 (`run-20260730-0013`) was the first pass on this driver. This is a
replication round, and the point of a replication round is to separate the
DRIVER from the EXECUTION, so nothing about run 3's execution is reused.

**What run 3 did, and what this cut deliberately does not do.** Run 3's spine was
a cross-city CATEGORY CONTRAST: one category converging in two cities, another
fragmenting in both, closing on companies converging while individuals fragment.
That is a comparison of two measured populations. It is not rebuilt here.

**The shape used instead:** *a question whose answer contained something none of
the engines were asked about.* Two of the five engines returned a firm name that
does not exist. Then the identical name came back in a second city, in a
different category, from the same two engines. The loop is opened on the
strangeness of the artefact rather than on a comparison, and it is closed by the
repeat rather than by a contrast.

That difference changes the edit as well as the copy. Run 3 withheld a *result*
and paid it off in two matched cards of figures. This cut withholds a *cause*:
scene 1 states a fact that sounds unremarkable, scene 2 turns it, scene 3 widens
it, and the evidence card (dates, engine count, collection health) arrives after
the payoff rather than before it, because in this shape the method is
reassurance and not setup.

Every claim on screen traces to a published city-research page. Sourcing table
below, with the denominator verified on each page rather than assumed.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows, `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 6,904,388 bytes, scored 7,596,654 bytes, cover 316,402 bytes.

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=132. Each block is vertically centred on y=870.

**Persistent on every frame:** the BrandGEO icon (76x76 at 132,310), the wordmark
`BrandGEO` (Inter SemiBold 32 at 226,329), and a **vertical** progress rail at
x=100, y=430 to 1399, filling downward.

There is no bottom progress bar and no separate accent rail. That is a
deliberate change from every previous Instagram cut in this campaign, and it is
the reason the safe-zone pass below is worth reading: with the bottom bar gone,
**type owns the right edge for the first time on this platform**, so the measured
right margin is a fact about the copy rather than about a piece of furniture.

**0.00 to 3.90 s**, Inter ExtraBold 84, ink `#E8E9ED`. Hard in at full opacity,
no fade up and no y-settle, because this frame is the cover.
```
Two AI engines
returned the
same firm name.
```

**3.90 to 7.10 s**, Bold 84 ink, then ExtraBold 84 accent `#A78BFA`
```
That firm
does not exist.
```

**7.10 to 10.60 s**, Bold 80 ink, then ExtraBold 72 accent
```
Then it happened
again.

Another city.
Another category.
```

**10.60 to 14.40 s**, SemiBold 38 accent kicker, then Medium 52 ink. Set as a
wrapped sentence rather than a stacked column, so it reads as a footnote to the
finding and not as a feature list.
```
ENGINES USED IN EACH RUN

ChatGPT, Claude,
Gemini, Perplexity,
Google AI Mode.
```

**14.40 to 18.00 s**, Bold 84 ink, then ExtraBold 72 accent. The payoff.
```
Two engines
wrote that name.

Both times,
the same two.
```

**18.00 to 21.30 s**, SemiBold 38 accent kicker, then Medium 56 ink. The
evidence card: date, denominator, collection health.
```
BOTH RUNS, 24 JULY 2026

Five engines fired.
Five returned
usable data.
No collection errors.
```

**21.30 to 24.20 s**, Bold 76 ink, then ExtraBold 76 accent
```
An AI answer can
sound certain

and still be
wrong about you.
```

**24.20 to 27.00 s**, Bold 72 ink, URL SemiBold 54 accent. Fades in only, no fade
out, so the CTA holds to the last frame.
```
Which version of
your name are
they using?

getbrandgeo.com
```

31 drawn strings including the wordmark.

---

## Every claim and number on screen, and where it was MEASURED

Nothing here is illustrative. Each figure was read out of the live HTML in this
repo, not recalled, and the engine denominator was checked on each page
separately.

| On screen | Source page | Exact wording on that page |
|---|---|---|
| "Two AI engines returned the same firm name." / "That firm does not exist." | `brandgeo/web/ai-visibility-for-chicago.html` | "for corporate law, both ChatGPT and Gemini independently rendered the real firm [name] as [name], a name that doesn't exist" |
| "Then it happened again." | `brandgeo/web/ai-visibility-for-boston.html` | "This is the identical error already documented in Chicago's corporate-law dataset" |
| "Another city." | both pages | Chicago and Boston are two separate city datasets |
| "Another category." | both pages | Chicago's instance was in **corporate law**, Boston's in **biotech/life sciences law** |
| "Two engines wrote that name." / "Both times, the same two." | `ai-visibility-for-boston.html` | "appearing independently in the same two engines"; Boston's stat card reads "2x Cities where [two engines] both independently invented the same fictional law firm name" |
| The five engine names | both pages, identical string | "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity." |
| "BOTH RUNS, 24 JULY 2026" | both pages | "Original research · data collected 2026-07-24" on each |
| "Five engines fired. / Five returned / usable data. / No collection errors." | both pages, identical string | "All 5 engines returned usable data on every prompt this run, no collection errors." |

### Denominator verification, which the brief requires and which is not decorative

Several city pages in this corpus report x/4 rather than x/5 because an engine
failed to collect there. Both pages used here state in their own data-quality
note that **all five engines returned usable data on every prompt**, so the
five-engine denominator on screen is the denominator that actually produced the
finding. That sentence is quoted on screen almost verbatim, which is why it is on
screen at all: it is the thing that makes "two of them" a meaningful count.

The engine LINEUP was verified too, not just the count. Both pages name
ChatGPT, Claude, Gemini, Google AI Mode and Perplexity, and both state the run
"used Google AI Mode in place of the now-retired Meta AI engine used in earlier
city pages". So the five named on screen are exactly the five that produced the
result on screen.

### Sources deliberately NOT used

- **`bg-016.html`** was not read for a figure. Its dataset ran four engines
  including retired Meta AI.
- **No engine count was taken from `bg-004.html`**, which claims five engines
  while naming six, one of them Copilot.
- **"27 cities" appears nowhere**, on screen or in the reasoning. The first seven
  city runs used retired Meta AI, so that count is not a single comparable
  population. The scanner rejects the phrase outright.
- **`bg-005.html`'s 48% and 93%** were not used. Both are third-party figures
  sitting inside an otherwise first-party page, so they pass a naive "traces to a
  bg page" test while tracing to no BrandGEO measurement.
- **`ai-visibility-for-chicago.html`'s superlative claims were not used**, and
  this page was otherwise the primary source. It asserts "the first fully
  unanimous result measured anywhere in this research program" four times,
  including inside its FAQPage JSON-LD, while `ai-visibility-for-boston.html`,
  collected the same day, calls itself "the most 5/5-dense city measured across
  this entire research program". Both were read and neither ranking claim reached
  the screen. The anomaly finding needs no ranking to work.

### Which two engines, and why they are not named on screen

The two engines are named on both published pages, and the brief explicitly
permits naming an engine that is being measured. They are still **not on
screen**, and the reason is not caution about the rule: "two engines" and "the
same two" carry the entire finding, because the point is the REPEAT, not the
identity. Naming them would swap a claim about a measurement for a claim about a
vendor, and the cut would get no stronger. The engine list card names all five
neutrally, as the instrument set.

### Compliance check, run on the DRAWN BYTES

Every check below is a script that reads the `txt/*.txt` files ffmpeg opens
through `textfile=`, resolved from the filtergraph's own `textfile=` references
rather than from the scene table, and exits non-zero on a hit. Not a reviewer's
memory, and not the brief's wording.

- **No measured subject is named.** No company, firm or person from any result
  set. Two independent detectors: a company-suffix pattern (`LLP`, `LLC`,
  `Group`, `& [A-Z]`, and so on) and a capitalised-multiword-run detector with an
  allow-list containing only engine and platform tokens.
- **No superlatives.** first, only, most, never, biggest, best, largest, fastest,
  leading, #1.
- **No universals that quantify over people.** nobody, no one, everyone,
  everybody, always, every business, anyone.
- **One flagged for adjudication rather than auto-rewritten**, per the brief's
  refinement: `No` in "No collection errors." That quantifies over *collection
  attempts in two published datasets*, it is quoted from both source pages, and
  it asserts nothing about people or businesses. It stays.
- **Engine lineup checked against code, not memory.** The scanner parses
  `growth: [...]` out of `brandgeo-dashboard/src/lib/planConfig.ts` and requires
  the on-screen set to equal it exactly. Result: `['chatgpt', 'gemini', 'claude',
  'perplexity', 'google_ai']` both sides. **Meta AI is retired and absent. Grok
  and AI Overviews are absent and no rate for either appears.** Copilot and
  DeepSeek are on no purchasable plan and are absent.
- **No pricing.** TOFU asset, soft CTA, the URL is the only ask.
- **No em dashes, no en dashes**, and none of the banned vocabulary.

### Negative control on every scanner

Twelve injections, each restored byte for byte afterwards and the scan re-run to
confirm it returns to clean. A scan that passes everything is indistinguishable
from one that never ran.

```
baseline scan: exit 0, clean

DASH                        inject 'again — twice.'        -> exit 1  label seen: YES  PASS
AI-TELL                     inject 'again, seamless.'      -> exit 1  label seen: YES  PASS
SUPERLATIVE                 inject 'the first time.'       -> exit 1  label seen: YES  PASS
UNIVERSAL                   inject 'nobody checks.'        -> exit 1  label seen: YES  PASS
PRICING                     inject 'from EUR299 a month'   -> exit 1  label seen: YES  PASS
RETIRED-ENGINE              inject 'Meta AI.'              -> exit 1  label seen: YES  PASS
GATED-ENGINE                inject 'Grok.'                 -> exit 1  label seen: YES  PASS
BANNED-COUNT                inject '27 cities.'            -> exit 1  label seen: YES  PASS
MEASURED-SUBJECT/suffix     inject a real firm name        -> exit 1  label seen: YES  PASS
MEASURED-SUBJECT/propernoun inject a real institution name -> exit 1  label seen: YES  PASS
ENGINE-LINEUP               drop one engine from the list  -> exit 1  label seen: YES  PASS
HARNESS/orphan              add an unreferenced txt file   -> exit 1  label seen: YES  PASS

restored: scan exit 0 (clean again)
negative controls passed: 12 / 12
```

The two measured-subject injections used genuine names lifted out of the city
pages themselves, not invented ones, so the detector was tested against the exact
class of string it exists to stop.

The `HARNESS/orphan` case is the one worth keeping: it proves the scan is reading
the set of files the filtergraph actually references, so a drawn string cannot
hide from it by not appearing in the scene table, and the scan cannot silently
scan zero files.

---

## N-gram diff against run 3

Intent to differ is not evidence of difference. This ran on the `textfile=` bytes
of this pass against run 3's rendered lines, before the final render.

Run 3's build directory was temporary and its `txt/` files no longer exist, so
the reference set is the verbatim on-screen block in
`run-20260730-0013/instagram/NOTES.md`, which that file states are the real line
breaks in the frame, plus the persistent `BrandGEO` wordmark. 29 lines recovered.

Both sides are lowercased, stripped of punctuation, joined in draw order and
compared as token n-grams, so a run that crosses a line break is caught.

```
--- A vs B  (run 3 rendered lines)  PRIMARY ---
  2-gram : 'ai engines'                   (allowed residue: engine list / URL / wordmark)
  2-gram : 'ai mode'                      (allowed residue)
  2-gram : 'getbrandgeo com'              (allowed residue)
  2-gram : 'google ai'                    (allowed residue)
  2-gram : 'perplexity google'            (allowed residue)
  2-gram : 'the same'                     (function words only, no authored content)
  3-gram : 'google ai mode'               (allowed residue)
  3-gram : 'perplexity google ai'         (allowed residue)
  4-gram : 'perplexity google ai mode'    (allowed residue)
  5-gram : none    6-gram : none    7-gram : none    8-gram : none

longest shared n-gram with run 3's rendered lines: 4
disallowed shared n-grams (2+, content-bearing): 0

exact rendered-line collisions with run 3: 3
   'BrandGEO'           (allowed residue, persistent wordmark)
   'Google AI Mode.'    (allowed residue, engine list)
   'getbrandgeo.com'    (allowed residue, URL)
disallowed exact line collisions: 0
```

Residual overlap is exactly what the brief allows: the engine list, the URL and
the wordmark, plus one shared bigram of pure function words (`the same`).

### The diff caught a real collision, and reading had not

The first draft's scene 5 read `The same two / engines.` followed by `The same /
invented name.` Joined in draw order that produces **`engines the same`**, which
is also in run 3 across its own line break (`AI engines the` / `same question.`).
A content-bearing 3-gram, shared, from two passes written months apart in
intent and minutes apart in fact. It was not visible in either file by reading.

Scene 5 was rewritten to `Two engines / wrote that name.` and `Both times, /
the same two.`, and the scene 4 kicker was changed from `ENGINES IN BOTH
DATASETS` to `ENGINES USED IN EACH RUN` to drop the shared `in both`. Re-run
clean, then re-rendered.

### Negative control on the n-gram diff itself

The first version of this diff had a 3-gram floor. Its negative control proved
that floor was wrong.

```
baseline n-gram diff: exit 0, clean

verbatim run 3 line       inject 'Companies converge.'       -> exit 0  *** CONTROL FAILED
run 3 cross-line 4-gram   inject 'engines the same question' -> exit 1  PASS
run 3 CTA line            inject 'your category on?'         -> exit 1  PASS
```

Injecting a **verbatim run 3 rendered line** did not fail the check, because run
3 rendered `Companies` and `converge.` on two separate lines, so no single line
matched and the shared token run was only two long. A 3-gram floor would have
waved a literal copy straight through.

The floor was lowered to 2 with an exemption for n-grams made entirely of
closed-class function words, which is what keeps `the same` from being noise.
Re-controlled:

```
verbatim run 3 line       inject 'Companies converge.'       -> exit 1  PASS
run 3 cross-line 4-gram   inject 'engines the same question' -> exit 1  PASS
run 3 CTA line            inject 'your category on?'         -> exit 1  PASS
restored: n-gram diff exit 0 (clean again)
negative controls passed: 3 / 3
```

### Secondary, deliberately over-broad check

The same diff was also run against the WHOLE of run 3's `NOTES.md`, prose
included, which is a much larger surface than the rendered lines. Four
content-bearing hits came back and every one was traced to run 3's PROSE, not to
anything it rendered:

| Hit | Where it actually is in run 3's NOTES.md |
|---|---|
| `does not exist` | line 482, "where the in-app library does not exist", about music distribution |
| `five engines` | lines 141 and 153, prose about the BG-016 rejection and `planConfig.ts` |
| `used in` | line 148, quoting the Boston page's "used in earlier city pages" |
| `not exist` | same as the first |

None is a rendered string. The primary check is the binding one.

---

## Duration

`ffprobe` on the DELIVERED files, run before this was called done, because a mux
can exit 0 and be unreadable.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **27.000000 s** | 810 frames @ 30/1, `duration_ts=414720 / 15360`, 1080x1920, `yuv420p` | **none, `nb_streams=1`** |
| `instagram-scored.mp4` | **27.000000 s** | 810 frames, identical stream (MD5 match) | `duration_ts=1296000 / 48000` = 27.000000 s, 1267 AAC frames, `nb_streams=2` |

Both land on exactly 27.000000 s, inside the 20 to 30 s Instagram target.

Video stream MD5, identical across both cuts: `ad153e85eec09ccfa1a281f52865d22c`.

The AAC drift warning was measured rather than assumed: decoding the delivered
scored audio yields **1,296,384 samples = 27.008000 s**, 384 samples of encoder
padding past the cut. The mp4 sample table caps the track at
`duration_ts=1296000`, exactly 27.000000 s, so the padding exists as packet
payload and is never played. `-shortest` is what holds that line.

Both files: H.264 High, `yuv420p`, encoded from a **numbered PNG frame sequence
at `-framerate 30`**. No `ffconcat` anywhere, no JPEG anywhere, so no `yuvj420p`
range shift.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 810 frames**, sequentially with no `-ss` seeking, reduced to a
global extreme. Two independent methods, plus declared geometry folded in.

### Justifying the ink threshold

A text-free control was rendered first through the **identical** pipeline: same
canvas, same two glow overlays, same noise seed (`all_seed=20260613`), same PNG
sequence, same encoder settings, with the logo, the rail and all type removed.

Measured across all 810 control frames, and on the delivered file in a strip
where nothing is ever drawn:

```
control peak luma, whole frame              39.2
control peak luma, 220..1500 copy band      39.1
delivered peak luma, x >= 940 (never drawn) 33.2
```

Drawn colours, Rec.709 luma:

| Element | Colour | Luma |
|---|---|---|
| Body and list type | `#E8E9ED` | 233 |
| Accent type | `#A78BFA` | 153 |
| Rail fill | `#8B5CF6` | 113 |
| Rail track, pre-blended | `#2E3048` | **49** |

The dimmest drawn element is the rail track at 49 and the background peaks at
39.2, so there is a real gap and thresholds of 45, 60 and 90 all sit inside it.
That they return the same box is the evidence the gap is real rather than a lucky
pick. The gap is only 10 luma wide, though, which is inside the blind spot the
brief warns about, so the declared rect is folded in on top rather than trusted
to it.

### Method B, per-pixel diff against the control (authoritative)

Same noise seed and same frame numbers, so the difference is exactly the set of
pixels that were DRAWN, at any luma, including furniture darker than the
background. The diff threshold was not picked by eye: the noise floor was
measured in the never-drawn strip `x >= 940` of the DELIVERED file and came back
at **11**, so the threshold was set at 12. A control cancels artefacts it shares,
it cannot cancel the encoder's response to content it does not have, and that 11
is exactly that response.

```
UNION OF EVERYTHING DRAWN, 810 frames:

  top    y =  326    limit >=  220    margin +106 px
  bottom y = 1399    limit <= 1500    margin +101 px
  right  x =  821    limit <=  900    margin  +79 px
  left   x =   98    (no left reserve specified)
```

### Method A, absolute luma threshold (cross-check)

```
luma >  45 : y  327..1399  x  100.. 821   top +107  bottom +101  right +79
luma >  60 : y  327..1399  x  100.. 821   top +107  bottom +101  right +79
luma >  90 : y  328..1399  x  100.. 820   top +108  bottom +101  right +80
luma > 120 : y  328..1103  x  100.. 820   top +108  bottom +397  right +80
```

The two methods agree to within 1 to 2 px on every edge, and each difference is
explained rather than waved at. Per the brief the method finding MORE ink is the
one trusted, and that is B on all three edges: 326 against 327 at the top and 821
against 820 on the right are antialiased and compressed glyph and box edges that
fall below a hard luma cut. The `luma > 120` row loses the bottom edge entirely
because the rail fill measures 113, which is exactly why an absolute threshold
cannot be the authority here.

### Declared geometry, folded in explicitly

```
logo card       x  132.. 207   y  310.. 385
rail track      x  100.. 103   y  430..1399
rail fill (max) x  100.. 103   y  430..1399
declared union  x  100.. 207   y  310..1399
```

The declared top (310) is 16 px ABOVE the measured top (326), so method B did NOT
see all of the logo: the icon card's rounded corners sit within 12 of the canvas
and no pixel method can find them. That is the brief's blind spot reproducing
exactly, and it is why the declared rect is folded in rather than reported as a
confirmation.

### Final result

```
EVERYTHING DRAWN, measured OR declared, whichever is worse:

  top    y =  310    limit >=  220    margin  +90 px
  bottom y = 1399    limit <= 1500    margin +101 px
  right  x =  821    limit <=  900    margin  +79 px
  left   x =   98

  SMALLEST HEADROOM ON ANY EDGE : +79 px    (failure floor is 20)
  RESULT: PASS
```

### Both numbers the brief asks for

```
UNION of everything drawn : y  326..1399   x   98.. 821
WIDEST TYPE extent        : y  660..1068   x  128.. 821
```

The type box was measured over the copy band only (y 400..1400 and x >= 110, so
the brand lock and the rail are both excluded).

**The two are identical on the right edge and differ on both others.** That is
the point of reporting them separately: the right reserve, the only edge where a
copy edit can do damage, is now owned by TYPE and not by furniture, for the first
time on this platform in this campaign. Type has 440 px of top clearance and
432 px of bottom clearance, so a longer line cannot fail silently there.

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Negative control on the safe-zone measurement

The measurement is a scanner too, so it was injected against. Four violations
were rendered through the IDENTICAL pipeline, 30 frames each, and put through the
same box logic:

```
right reserve     type at x=940    box x  100..1079   right  margin  -179   -> measurement FAILS as it should
top reserve       type at y=150    box y  150..1399   top    margin   -70   -> measurement FAILS as it should
bottom reserve    type at y=1560   box y  326..1631   bottom margin  -131   -> measurement FAILS as it should
dark-on-dark box  #0C0D13 at y=1560, 3 luma off the canvas
                                   box y  326..1599   bottom margin   -99   -> measurement FAILS as it should
clean render      (positive control)
                                   box y  310..1399 x 100..821  smallest +79  -> PASS

safe-zone negative controls passed: 5 / 5
```

The fourth case is the one that matters. A box drawn 3 luma from the canvas is
invisible to the absolute threshold AND to the control diff, and it was caught
only because its declared rect was folded in. That confirms the fold is doing
real work rather than duplicating what the pixels already show.

### Which element sets each extreme

- **Top 310** is the brand icon card, declared, not measured.
- **Bottom 1399** is the last row of the vertical rail at full extension.
- **Right 821** is the type line `same firm name.` at Inter ExtraBold 84.
- **Left 98** is encoder bleed off the rail, which is drawn at x=100.

The type-width probe run before the master had already put that line at x=821
with 79 px of clearance, and it was left there deliberately. Every earlier
Instagram cut in this campaign carried a bottom progress bar reaching x=809 or
so, which meant the right edge was always furniture and the safe-zone pass
carried no information about the copy at all. Removing the bar and moving the
rail into the left gutter hands the right edge to type. 79 px is close to four
times the failure floor, and the next-widest line, `wrote that name.` at 818,
sits 3 px behind it, so the layout has a measured tolerance rather than an
assumed one.

---

## Cover is not blank

Scene 1 hard-starts at full opacity and has no y-settle. Its alpha expression is
`max(0,min(1,(3.90-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 373c89cd9b4a938e67c09e025dc05381
instagram-cover.png             : 373c89cd9b4a938e67c09e025dc05381
```

---

## The progress rail actually animates

The rail is vertical this run and fills downward. `drawbox` cannot animate on
ffmpeg 8.1.2, so the fill is **54 discrete static boxes**, one per 0.5 s, at
literal heights, and the only expression anywhere in the rail is `enable`.

Verified on the DELIVERED file by reading column x=101 of every decoded frame:

```
frame   0  t= 0.000s   fill height =  18 px
frame  30  t= 1.000s   fill height =  54 px
frame 150  t= 5.000s   fill height = 198 px
frame 300  t=10.000s   fill height = 377 px
frame 450  t=15.000s   fill height = 557 px
frame 600  t=20.000s   fill height = 736 px
frame 750  t=25.000s   fill height = 916 px
frame 809  t=26.967s   fill height = 970 px

monotonic non-decreasing : True
54 distinct heights, min 18, max 970  ->  ANIMATES
```

The check reads column x=101 of every decoded frame at a **luma threshold of 80**,
which sits between the track (`#2E3048`, luma 49.3) and the fill (`#8B5CF6`, luma
113). That is deliberate: a control diff answers "was this drawn", not "which of
two overlapping things was drawn", and the track is drawn at full height on frame
0. Separating them needs a threshold between their two values, not a difference
from the background.

### Scene boundaries, counted not hashed

Frames were decoded sequentially in one pass and indexed. Scene changes were
found by counting ink pixels per frame, never by hashing, because identical
pictures get different quantisation noise in H.264.

Each crossfade drives type ink to zero for a few frames, producing a plateau. The
reported boundary is the **FLOOR of the plateau centre**, never the round: an
even-width plateau has no integer centre and rounding produces a uniform +1
offset on every cut, which reads exactly like timeline drift.

```
scripted cuts     t = 3.90  7.10  10.60  14.40  18.00  21.30  24.20
                  f =  117   213    318    432    540    639    726

ink> 70 : 7 plateaus, widths [4, 4, 4, 3, 4, 4, 4]
          117+0  213-1  318+0  432+0  540+0  639+0  726+0    exact 6/7
ink> 90 : 7 plateaus, widths [6, 6, 6, 6, 6, 6, 6]
          117+0  213+0  318+0  432+0  540+0  639+0  726+0    exact 7/7
ink>120 : 7 plateaus, widths [8, 8, 9, 8, 8, 8, 8]
          117+0  213+0  318+0  432+0  540+0  639+0  726-1    exact 6/7
ink>150 : 7 plateaus, widths [12, 11, 12, 11, 10, 12, 12]
          117+0  213+1  318+0  432+1  540+0  639+0  726+0    exact 5/7
```

Seven plateaus at every threshold, matching seven scripted cuts. No extras, none
missing.

**The residual off-by-ones are the detector, not the render, and the brief gives
the test for telling them apart: a detector fault is UNIFORM.** These are not.
The single -1 at ink>70 is on cut 2; at ink>120 the only -1 is on cut 7; at
ink>150 there are two +1s, on cuts 2 and 4; at ink>90 there are none at all. A
render fault cannot move from one cut to another as the measurement threshold
changes, and it cannot vanish at 90 and come back at 120. What does move is the
plateau PARITY: an even-width plateau has no integer centre, so the floor lands
half a frame early whenever the alpha ramp is not symmetric about a frame
boundary. The plateau WIDTHS change with threshold (4, 6, 8, 12) while the
CENTRES stay put to within one frame, which is the signature the brief describes.
Worst case across four thresholds and seven cuts is one frame, 33 ms.

The plateau WIDTH changes with the threshold and the CENTRE does not, which is
the evidence that the centre is the real boundary and not an artefact of the
detector.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, no third-party material, cleared for commercial use including paid
advertising, **no attribution line required**. Nothing was downloaded.

**Held CONSTANT on purpose.** This run changes the hook's execution while holding
the driver, so the music has to stay where it has been for all nine runs or the
comparison is unattributable. `ATTRIBUTION.md` nominates `build-resolve` for the
curiosity-gap driver; the experimental design outranks the nomination table, and
run 3 made the same call for the same reason. Worth revisiting once the driver
cycle stops being the variable.

Source is 60.000 s. Trimmed to 27.000 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 25.5 s**, then two-pass `loudnorm`.

### The fade in is load-bearing, and it was negative-controlled

`tension-minor` does not start at zero, so a hard cut at sample 0 clicks.
Measured on the **delivered** file by decoding the AAC:

```
FIRST 64 SAMPLES, abs max : 0.002709    ceiling 0.005    PASS
first 10 ms,      abs max : 0.013737
final 0.10 s,     abs max : 0.030856
overall peak              : 0.6040  (-4.38 dBFS)
```

A number under a ceiling proves nothing unless the check can produce a number
over it, so the same track was re-muxed with the fade in removed and re-measured
through the identical decode path:

```
control (no fade in) first 64 abs max : 0.058427   -> check FIRES
```

21x the delivered value and 11x the ceiling. The check can tell the two apart.

### Loudness, measured not assumed

Pass 1 on the trimmed cut: `input_i=-16.07`, `input_tp=-4.41`, `input_lra=3.40`,
`input_thresh=-26.18`, `target_offset=-1.20`. The brief's warning is confirmed
again on this material: single-pass would have landed about 1.2 LU off.

Re-measured on the **delivered** `instagram-scored.mp4`, decoding the AAC:

| | Target | Measured |
|---|---|---|
| Integrated | -16 LUFS | **-15.99 LUFS** |
| True peak | -1.5 dBTP max | **-4.36 dBTP** |
| LRA | n/a | 3.40 |

True peak sits 2.9 dB under the ceiling. -1.5 dBTP is a maximum, not a target,
and with `linear=true` the gain is one scalar chosen to hit the integrated
target, so nothing was limited and no shape was altered.

### Honest read

Measured, not listened to.

```
RMS and spectral centroid per 2 s block
   0- 2   -21.39 dBFS   1645 Hz   <- fade in, deliberately quiet
   2- 4   -21.91        1530
   4- 6   -17.81        1310
   6- 8   -16.34        1544
   8-10   -16.34        1362
  10-12   -16.62        1391
  12-14   -15.91        2378      <- opens up under the engine-list card
  14-16   -16.70        2616
  16-18   -16.63        1937
  18-20   -16.12        2306
  20-22   -16.06        2044
  22-24   -16.04        2278
  24-26   -15.59        2278      <- loudest block, under the CTA
  26-27   -25.87        2473      <- fade out
```

```
band levels, dB relative to the full mix
    20-80    Hz   -1.72
    80-160   Hz   -6.48
   160-320   Hz  -13.28
   320-640   Hz  -13.70
   640-1280  Hz  -20.48
  1280-2560  Hz  -25.95
  2560-5120  Hz  -31.85
  5120-10240 Hz  -37.67
 10240-20000 Hz  -40.60
```

**What works.** It builds. RMS climbs about 6.3 dB from the opening block to the
24-26 s block. The structural peak lands at 24-26 s, which is the CTA, and there
is a secondary lift at 12-14 s under the engine-list card. For this cut the
timing is slightly less lucky than it was for run 3: the emotional peak of THIS
edit is the payoff at 14.4 to 18.0 s ("Both times, the same two."), and the track
is in a shallow dip at 14-16 s (-16.70 dBFS) rather than a peak. The music is
supporting the close, not the reveal.

**The weakness, unchanged and still worth stating.** It is heavily
bottom-weighted. Full-mix RMS is -16.99 dBFS; removing everything below roughly
300 Hz leaves **-26.51 dBFS**, a **9.5 dB** drop. On a phone speaker, which has
almost nothing under 200 Hz, this plays softer and thinner than -16 LUFS
suggests, and much of what carries the build sits in the quietest bands.

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

Each of the 30 copy lines was rendered alone at its final font and size and its
ink bounding box measured, so the right reserve was checked before 27 seconds of
encoding rather than after.

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1080x400" \
  -vf "drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=txt/lNN.txt:x=132:y=60\
:fontsize=84:fontcolor=0xFFFFFF" -frames:v 1 -update 1 probeNN.png
```

### 1. Background glows, one frame each

`-update 1 -pix_fmt rgba` is not optional. Without it alpha is dropped one step
later and every subsequent layer ships as a full-frame rectangle.

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1500x1500" -vf \
"format=rgba,geq=r='139':g='92':b='246':a='70*exp(-2.0*(pow((X-750)/750,2)+pow((Y-750)/750,2)))'" \
-frames:v 1 -update 1 -pix_fmt rgba glow-violet.png

ffmpeg -y -f lavfi -i "color=c=black:s=1500x1500" -vf \
"format=rgba,geq=r='99':g='102':b='241':a='44*exp(-2.4*(pow((X-750)/750,2)+pow((Y-750)/750,2)))'" \
-frames:v 1 -update 1 -pix_fmt rgba glow-indigo.png
```

### 2. Master, rendered to a NUMBERED PNG SEQUENCE

```bash
ffmpeg -y \
  -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=27.0" \
  -loop 1 -i glow-violet.png \
  -loop 1 -i glow-indigo.png \
  -loop 1 -i logo.png \
  -filter_complex_script filtergraph.txt \
  -map "[v]" -an -t 27.0 \
  -c:v png -pix_fmt rgb24 "seq/f%05d.png"          # 810 PNG frames
```

### 3. Encode from the sequence at -framerate 30

Frame-exact by construction. No `ffconcat`, so no cumulative float drift.

```bash
ffmpeg -y -framerate 30 -start_number 1 -i "seq/f%05d.png" \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 -an out-silent.mp4
```

The filtergraph is 12,881 characters: 31 `drawtext` calls (30 copy lines plus the
wordmark) and 55 `drawbox` calls (the rail track plus 54 fill steps). Structure,
with one scene shown as the representative case:

```
[0:v]format=rgba[base];
[base][1:v]overlay=x='-120+34*cos(t/8)':y='760+26*sin(t/11)':format=auto[b1];
[b1][2:v]overlay=x='420+30*sin(t/9)':y='-420+24*cos(t/7)':format=auto[b2];
[3:v]scale=76:76[lg];
[b2][lg]overlay=x=132:y=310:format=auto[b3];
[b3]drawbox=x=100:y=430:w=4:h=970:color=0x2E3048@1:t=fill:replace=1,

  [rail fill, 54 static boxes, no geometry expression anywhere:]
  drawbox=x=100:y=430:w=4:h=18:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(t\,0.0000\,0.5000)',
  drawbox=x=100:y=430:w=4:h=36:...:enable='between(t\,0.5000\,1.0000)',
  ... 52 more ... final step h=970 at 26.5000..27.0000,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=226:y=329:fontsize=32:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover, and no y-settle:]
  drawtext=fontfile=fonts/Inter-ExtraBold.ttf:textfile=txt/l00.txt:x=132:y=714
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,(3.90-t)/0.30))':enable='between(t\,0.00\,3.90)',
  ... l01 at y=818, l02 at y=922 ...

  [scenes 2 to 7, cross-faded with a 16 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/l03.txt:x=132
    :y='766+16*(1-min(1\,(t-3.90)/0.45))'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-3.90)/0.35\,(7.10-t)/0.30)))'
    :enable='between(t\,3.90\,7.10)',
  ...

  [scene 8, the CTA, fades IN only so it holds to the final frame:]
  drawtext=...:alpha='max(0\,min(1\,(t-24.20)/0.35))'
    :enable='between(t\,24.20\,27.00)',

  noise=alls=3:allf=t+u:all_seed=20260613,
  format=yuv420p[v]
```

`replace=1` is on every `drawbox` with a pre-blended opaque colour, so nothing in
the rail depends on alpha blending against an RGBA source.

The `noise` pass dithers the large soft gradient so H.264 does not band it. Its
seed is pinned so the control render can be diffed against the delivered one.

### 4. Control render, for the diff measurement

Identical background, identical seed, identical PNG-sequence-then-encode path,
with the logo, rail and all type removed.

```bash
ffmpeg -y -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=27.0" \
  -loop 1 -i glow-violet.png -loop 1 -i glow-indigo.png \
  -filter_complex_script filtergraph-control.txt \
  -map "[v]" -an -t 27.0 -c:v png -pix_fmt rgb24 "cseq/f%05d.png"

ffmpeg -y -framerate 30 -start_number 1 -i "cseq/f%05d.png" \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 -an control.mp4
```

### 5. Audio

```bash
# trim 60.000s to 27.000s, 0.08s fade IN (the track does not open at zero and
# clicks on a hard cut), 1.5s fade OUT
ffmpeg -y -i tension-minor.wav \
  -af "atrim=0:27.0,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,afade=t=out:st=25.5:d=1.5" \
  -c:a pcm_s24le music-cut.wav

# pass 1, measure
ffmpeg -i music-cut.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values
ffmpeg -y -i music-cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11\
:measured_I=-16.07:measured_TP=-4.41:measured_LRA=3.40:measured_thresh=-26.18\
:offset=-1.20:linear=true" -ar 48000 -ac 2 -c:a pcm_s24le music-norm.wav
```

### 6. Deliverables

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

### 7. Verification actually run on the DELIVERED files

```bash
# durations and stream tables. A mux can exit 0 and be unreadable.
ffprobe -v error -show_entries format=duration,nb_streams -show_entries \
  stream=index,codec_type,codec_name,width,height,r_frame_rate,pix_fmt,duration,\
duration_ts,time_base,nb_frames -of default=nw=1 instagram-silent.mp4

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

The safe-zone measurement, the rail-animation check and the scene-boundary count
are one numpy pass over two synchronised `ffmpeg -f rawvideo -pix_fmt rgb24`
pipes, the delivered file and the control, decoded sequentially with no seeking,
over all 810 frames, reduced to a global extreme.

---

## Traps applied as preconditions, and the two live catches

Every trap in the shared brief was applied up front rather than discovered:
`replace=1` on every box with pre-blended opaque colours, literal `drawbox`
geometry with `enable` as the only expression, `-update 1 -pix_fmt rgba` on both
glow writes, no fade up on scene 1, a numbered PNG sequence instead of
`ffconcat`, sequential decode with no `-ss`, `-shortest` on the mux, `ffprobe` on
the delivered file rather than a trusted exit code, declared rects folded into
the union, a threshold measured above the noise floor of a text-free control, a
luma threshold rather than a control diff for the two overlapping rail elements,
and the floor of each plateau centre rather than the round.

**Live catch 1, the n-gram diff.** A content-bearing 3-gram shared with run 3
across a line break in both passes. Neither reading nor intent found it. See the
n-gram section.

**Live catch 2, the safe-zone measurement moving the layout.** The first render
put the brand lock at y=258, which the declared-rect fold reported as a top
margin of +38 px against the right margin's +79. That passes, but it makes
FURNITURE the binding constraint again, which is the exact failure mode the brief
calls out: a safe-zone pass that always binds on furniture is not testing the
copy. The lock was moved to y=310 and the cut re-rendered, so the binding edge is
now the type line `same firm name.` at ExtraBold 84.

## The scanners and the shipped file are tied together, not assumed to be

Every compliance check above reads `txt/*.txt`. That only means anything if the
delivered mp4 was actually rendered from those bytes, so it was checked rather
than assumed. Frame 0 was re-rendered losslessly from the CURRENT filtergraph and
compared against the shipped cover:

```
max per-pixel diff       : 58
mean per-pixel diff      : 2.612
pixels differing by > 40 : 117   (of 2,073,600)
ink box, lossless render : y 328..989  x 100..820
ink box, shipped cover   : y 328..989  x 100..820
```

The two cannot be byte-identical, because one is a lossless PNG of the filter
output and the other is decoded H.264, and an earlier version of this check
compared MD5s and produced a meaningless mismatch. The ink boxes agreeing exactly
and the residual sitting at 117 glyph-edge pixels is the real evidence: the file
that shipped carries the strings that were scanned. Source mtimes confirm the
same ordering, with every `txt/` file and the filtergraph written minutes before
the encode.

## Scope

Scoped to this `instagram/` folder only. Nothing outside it was written,
including this run's `RUN.md`, which is a sibling agent's file. No git command
was run.

## Nothing was posted or scheduled

These are files for review only.
