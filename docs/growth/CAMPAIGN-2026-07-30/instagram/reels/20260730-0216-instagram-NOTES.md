# Instagram Reel, run 20260730-0216

**Hook driver:** #5, concrete proof, "here is the exact prompt and here is the
exact answer".

Runs 1 to 4 used loss aversion, status threat, curiosity gap and contrarian. All
four argue. This one does not. It asserts nothing, concedes nothing and disputes
nothing: it puts a real buyer question on screen exactly as it was typed, then
puts back what each engine returned. The persuasion is entirely that the viewer
can go and check it, so the cut is built around the two things that make it
checkable, the **verbatim prompt** and the **collection date**, and it spends a
sixth of its running time saying so out loud.

That changes the shape of the thing. The other four drivers build to a claim; this
one builds to an artefact and then gets out of the way. Scene 3 is the only
sentence in the cut that could be called a claim, and it is a restatement of the
table directly above it rather than an inference from it.

**It deliberately does not say what the finding means.** No "you are invisible",
no "your competitor owns this", no implication drawn for the viewer at all. That
is not restraint for its own sake: the moment the cut draws a conclusion, the
viewer has to trust the conclusion, and the whole point of this driver is that
they do not have to trust anything. The CTA is a question about their own name,
not a claim about it.

---

## Files

| File | What it is |
|---|---|
| `instagram-silent.mp4` | The upload master. **No audio stream at all** (`ffprobe -select_streams a` returns zero rows; `nb_streams=1`). Add music from Instagram's in-app library. |
| `instagram-scored.mp4` | Same video stream, verified byte-identical by MD5, plus the BrandGEO-composed track. For paid, site embeds and decks. |
| `instagram-cover.png` | 1080x1920, `rgb24`. Genuine frame 0 of the master, verified byte-identical over raw RGB. |

Sizes: silent 4,362,234 bytes, scored 5,081,120 bytes, cover 267,263 bytes.

Naming follows runs 1 to 4 (`-scored`, not the brief's older `-bed`). The brief's
deliverables block still says `-bed.mp4` from when the fallback was a synthesized
`sine`/`aevalsrc` bed; since the 2026-07-29 update the fallback is a composed
track and every run so far has shipped it as `-scored`. Consistency inside the
campaign matters more here than the stale filename, since these four runs are
meant to be compared against each other.

---

## On-screen text, verbatim

Line breaks below are the real line breaks in the frame. All copy is left aligned
at x=130, except the results column at x=620. Each block is vertically centred on
y=880, the centre of the 220..1500 visible band.

**Persistent on every frame:** the BrandGEO icon (84x84 at 130,282), the wordmark
`BrandGEO` (Inter SemiBold 34 at 236,303), a violet rail at x=96, and a progress
bar at y=1438.

**0.00 to 5.40 s**, kicker Inter SemiBold 40 accent `#A78BFA`, then the prompt in
Inter **SemiBold** 68 ink `#E8E9ED`. Hard in at full opacity, no fade up, because
this frame is the cover.

The prompt is set in SemiBold rather than the Bold/ExtraBold used everywhere else
in the cut. That is a deliberate signal: this block is a quotation, not the
video's own voice, and it is the only block on screen that carries quote marks.

```
ONE REAL PROMPT

"Top-rated property
management
companies
in Chicago"
```

**5.40 to 9.00 s**, Bold 84 ink, then ExtraBold 76 accent
```
Fired at five
AI engines.

Same wording.
Same day.
```

**9.00 to 15.00 s**, kicker SemiBold 40 accent, engine labels SemiBold 54 ink at
x=130, results ExtraBold 54 accent at x=620. Held for 6.0 s, the longest scene in
the cut, because it is the only one that has to be read rather than absorbed.
```
WHAT CAME BACK

ChatGPT           #1
Claude            #1
Perplexity        #2
Gemini            #4
Google AI Mode    named
```

**15.00 to 18.80 s**, Bold 84 ink, then ExtraBold 84 accent. The sentence runs
across the weight change so the accent carries the half that is the finding.
```
All five named
the same
company.
```

**18.80 to 22.60 s**, kicker SemiBold 40 accent, Bold 72 ink, then ExtraBold 68
accent
```
PUBLISHED IN FULL

Prompt, engines,
ranks and date.

Collected
24 July 2026.
```

**22.60 to 25.40 s**, Bold 84 ink, then ExtraBold 76 accent
```
Same prompt.
Same engines.

Anyone can
check it.
```

**25.40 to 28.00 s**, Bold 74 ink, URL SemiBold 54 accent. Fades in only, no fade
out, so the CTA holds to the last frame.
```
What comes back
for your name?

getbrandgeo.com
```

---

## The prompt is byte-exact, and that was checked mechanically

The four lines of scene 1, joined with single spaces, are compared against every
`prompt-text` card published on the source page. Not read, matched:

```
on screen (lines joined) : '"Top-rated property management companies in Chicago"'

the 6 prompts published on the page:
             "Best personal injury law firms in Chicago"
             "Best real estate agents for buying a home in Chicago"
    <== USED "Top-rated property management companies in Chicago"
             "Best immigration lawyers in Chicago"
             "Best corporate law firms in Chicago"
             "Best commercial real estate brokers in Chicago"

byte-exact match against a published card : True
appears verbatim in the page source       : True
```

**Source:** `brandgeo/web/ai-visibility-for-chicago.html`, the `prompt-grid`
under the heading "What we actually asked". Live at
`getbrandgeo.com/ai-visibility-for-chicago.html`.

Nothing was shortened, re-cased or cleaned up. The hyphen in "Top-rated" is a
hyphen-minus, U+002D, and it is part of the published prompt, so it stays; the
punctuation scan below checks specifically for em, en, figure and minus dashes
and finds none. The line break after "property" is a typographic break inside an
unmodified string, not an edit to it.

### Why this prompt and not one of the other five

The brief warned this would be the run where type binds, so the shortest prompt
was the obvious pick and it is not the one used. `"Best immigration lawyers in
Chicago"` is 14 characters shorter and breaks into two clean lines. It was
rejected because its result is 4 of 5, and the 5-of-5 result is the one that
survives having its subject removed without losing anything. "Four of five named
the same firm" immediately invites "which one didn't", and the honest answer
names an engine as the one that missed, which is a claim about that engine's
performance rather than about our measurement.

The probe (below) then showed the longer prompt cleared the reserve by 107 px at
SemiBold 68, so the trade never had to be made. Type did not bind this run.

---

## Every claim and number on screen, and where it was MEASURED

The brief's provenance rule is applied to the figure, not to the page it sits in.
Every number below was measured by BrandGEO's own pipeline in the 2026-07-24
Chicago run. No third-party statistic appears anywhere in this cut.

| On screen | Where the page states it |
|---|---|
| The prompt, verbatim | `prompt-grid` card 3 |
| "Fired at five AI engines." | "each fired at ChatGPT, Claude, Gemini, Google AI Mode, and Perplexity" |
| "Same wording. Same day." | "Real customer questions tested, identical across every engine"; "data collected 2026-07-24", a single run |
| `ChatGPT #1`, `Claude #1` | "ChatGPT and Claude both rank it #1" |
| `Gemini #4` | "Gemini names it #4" |
| `Perplexity #2` | "Perplexity ranks it #2" |
| `Google AI Mode  named` | "Google AI Mode surfaces it by name at 4.8 stars" |
| "All five named the same company." | "appears in every single one of the 5 engines' responses"; findings bar "5/5"; table "5/5, full unanimous consensus" |
| "Collected 24 July 2026." | "Original research, data collected 2026-07-24" |

The five per-engine rows are the reason this driver works at all. They are the
artefact. Each one was matched against the page's callout sentence
programmatically, not transcribed:

```
ChatGPT         -> #1     | True
Claude          -> #1     | True
Perplexity      -> #2     | True
Gemini          -> #4     | True
Google AI Mode  -> named  | True
```

### `named` rather than a rank, and why the row is not padded

Google AI Mode did not return a ranked list, it surfaced the company by name with
a star rating. Writing `#5` or `yes` there would be neater and both would be
wrong. `named` is exactly what the page reports and it is also the honest shape:
one of the five engines answers in a different format from the other four, and a
video about checkable measurement should show that rather than smooth it.

The 4.8-star figure on the page was available and is **not** on screen. It is a
rating of the measured subject, not a measurement of engine behaviour, and it
would be the one number in the cut that describes the company rather than the
answer.

### The denominator was verified, not assumed

The brief warns that some city figures are x/4 because an engine failed to
collect. Chicago's is genuinely five, stated on the page in its own words: "All 5
engines returned usable data on every prompt this run, no collection errors,
matching Los Angeles and improving on New York (where ChatGPT failed on all 8
prompts)." So "all five" means five engines that answered, not five engines that
were asked.

The same paragraph closes the engine-lineup trap: "This run also used **Google AI
Mode** in place of the now-retired Meta AI engine used in earlier city pages."
That is why this page can carry an engine list on screen when `bg-004`, `bg-016`
and the first seven city pages cannot. The five named in scene 3 are today's five
and were the five on the collection date.

### Sources deliberately not used

- **`bg-016.html`** and **`bg-004.html`**: excluded by the brief, and independently
  by the lineup problem above. Neither is cited here for anything.
- **`bg-005.html`'s 48% and 93%**: both are third-party figures sitting inside a
  first-party page. Not used, not consulted for this cut.
- **"27 cities"**: never written.
- **No Grok, no AI Overviews, no rate for either.** Both went live 2026-07-29 with
  5 and 6 rows from a single day.
- **Meta AI is retired** and appears nowhere.

### Compliance check on the copy, run mechanically

`checks.py` pulls company-shaped tokens out of the source page and regexes each
against all 36 rendered strings. It is a match, not a read.

```
candidate names extracted from the source page: 33
names appearing in rendered text:
  Google AI Mode         ENGINE/PLATFORM, allowed
  Perplexity             ENGINE/PLATFORM, allowed
  BrandGEO               ENGINE/PLATFORM, allowed
  ChatGPT                ENGINE/PLATFORM, allowed
  Gemini                 ENGINE/PLATFORM, allowed
  Claude                 ENGINE/PLATFORM, allowed
forbidden measured subjects on screen: NONE
explicit subject blacklist hits: NONE
```

- **No measured subject is named.** This page names more of them than any source
  used so far in the campaign: a property manager, three law firms, two
  immigration practices, a realty and a global brokerage, plus a firm that two
  engines independently hallucinated a wrong name for. A 17-entry blacklist of
  every party in the Chicago result set was run against the rendered strings as a
  second, independent pass. Zero hits.
- **The removal test holds.** Take the subject out of "all five engines named the
  same company" and the claim is unchanged, because the claim was never about the
  company. That is the whole reason this driver survives the rule: the artefact
  being shown is the *prompt* and the *engine behaviour*, and the subject is
  incidental to both.
- **Engines on screen are instruments, not subjects.** ChatGPT, Claude,
  Perplexity, Gemini and Google AI Mode are named because the cut is unreadable
  without them. `planConfig.ts` `PLAN_ENGINES.growth` is `chatgpt, gemini, claude,
  perplexity, google_ai`, read from the file: exactly the five on screen, no more.
- **No pricing, no plan names, no currency, no percent sign.** TOFU asset, soft
  CTA, the URL is the only ask.
- **Punctuation and vocabulary**: no em, en, figure or minus dashes by codepoint;
  no non-ASCII characters at all; none of the banned vocabulary (delve, unlock,
  unleash, elevate, harness, leverage, game-changer, supercharge, revolutionize,
  seamless, robust, cutting-edge, transformative).
- **Every digit string on screen**: `1`, `2`, `4`, `24`, `2026`. Five strings,
  all of them either an engine's reported rank or the collection date. No
  percentage, no ratio, no denominator anywhere in the cut.

### A false positive in my own scan, and the fix

The first pass flagged `All` as a forbidden measured subject, because the
extractor collects capitalised tokens and the page contains sentence-initial
"All 5 engines returned usable data". Extending a hand-written stoplist until the
output is clean is how a scan stops being evidence, so the filter is mechanical
instead: a real proper noun never appears lowercase elsewhere in the same
document, and `all` does. 33 of 66 candidates dropped on that rule, including
`All`, and every genuine name survived it, which is the property that makes the
NONE result mean something.

---

## Duration

`ffprobe` on the DELIVERED files, run before this was called done. A mux can exit
0 and be unreadable.

| File | Container | Video stream | Audio stream |
|---|---|---|---|
| `instagram-silent.mp4` | **28.000000 s** | 840 frames @ 30/1, `duration_ts=430080 / 15360`, 1080x1920, `yuv420p`, H.264 High | **none, `nb_streams=1`** |
| `instagram-scored.mp4` | **28.000000 s** | 840 frames, identical stream (MD5 match) | `duration_ts=1344000 / 48000` = 28.000000 s, 1314 AAC frames, `nb_streams=2` |

Both land on exactly 28.000000 s, inside the 20 to 30 s Instagram target.

AAC drift measured rather than assumed: decoding the delivered scored audio
yields **1,344,512 samples = 28.010667 s**, 512 samples of encoder padding past
the cut. The mp4 sample table caps the track at `duration_ts=1344000`, exactly
28.000000 s, so the padding exists as packet payload and is never played.
`-shortest` is what holds that line.

Both files: H.264 High, `yuv420p`, from PNG intermediates only. No JPEG anywhere,
so no `yuvj420p` range shift.

### The timeline is frame-indexed, and nothing is concatenated

No `ffconcat` anywhere. Every timeline gate in the filtergraph is an **integer
frame index**, never a float scene time:

```
scene 1  frames   0..161     scene 5  frames 564..677
scene 2  frames 162..269     scene 6  frames 678..761
scene 3  frames 270..449     scene 7  frames 762..839
scene 4  frames 450..563
```

`enable='between(n,162,269)'`, not `between(t,5.40,9.00)`. The 56 progress-bar
steps are gated the same way. No float is compared to a frame time anywhere, and
the boundaries were then verified on the delivered file rather than trusted.

---

## Safe-zone measurement

Instagram Reels reserves: **top 220 px, bottom 420 px (y <= 1500), right 180 px
(x <= 900).**

Measured on the **delivered** `instagram-silent.mp4`, decoded frame by frame to
raw RGB24, **all 840 frames**, no seeking anywhere, reduced to a global extreme.
Two independent methods, plus declared geometry folded in explicitly.

### Justifying the ink threshold

A text-free control was rendered first: same canvas, same two glow overlays, same
noise seed (`all_seed=20260730`), no logo, no rails, no bar, no type. Measured
across all 840 control frames:

```
control peak luma, whole frame        39.7
control peak luma, copy band          37.9
delivered peak luma, x >= 940         39.7   (nothing is ever drawn there)
method B diff noise floor, x >= 960     10   (threshold set at 12)
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
so thresholds of 45, 60, 90 and 120 all sit inside it and return the same right
edge. That agreement is the evidence the gap is real rather than a lucky pick.

**The progress track at luma 44 is 4 above the background peak and is not
separable by any threshold.** That is why method B exists and why declared
geometry is folded in on top of it.

### Method B, per-pixel diff against the control (authoritative)

Same noise seed, same frame numbers, so the difference is exactly the set of
pixels that were DRAWN, at any luma, including furniture darker than the
background.

```
GLOBAL INK BOX, union of everything drawn, 840 frames:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  800    limit <=  900    margin +100 px
  left   x =   95    (no left reserve specified)
```

### The control is not optional, and this build demonstrates it again

The brief's corrected rule says never to diff against an assumed flat canvas
colour. Run again here purely to show the failure is total rather than confined
to the frame edge:

```
nominal canvas                 rgb(9,10,15)  = 0x090A0F
delivered row 0,   x=700       rgb(10,10,22)
delivered row 900, x=700       rgb( 8, 8,16)

diff vs FLAT assumed canvas  -> ink box y    0..1919   x   0..1079   (whole frame)
diff vs TEXT-FREE CONTROL    -> ink box y  282..1445   x  95.. 800
control alone vs flat canvas -> ink box y    0..1919   x   0..1079
```

The third line is the proof: the control has **nothing drawn on it at all** and
still "fails" on every edge against a flat colour. Two soft full-frame glow
overlays plus the dither pass mean essentially no pixel equals the nominal canvas
value. Only the control cancels it, because it carries the same glows, the same
dither seed and the same codec.

### Method A, absolute luma threshold (cross-check)

```
luma >  45 : y  301..1442  x   96..799   top +81  bottom +58  right +101
luma >  60 : y  301..1442  x  130..799   top +81  bottom +58  right +101
luma >  90 : y  301..1442  x  130..799   top +81  bottom +58  right +101
luma > 120 : y  302..1442  x  131..799   top +82  bottom +58  right +101
```

The two methods agree and every difference is explained rather than waved at.
**Per the brief, the method finding MORE ink is trusted, and that is B on all
three binding edges:**

- **Top, 282 vs 301.** 19 px. The logo card is drawn at y=282 and its rounded
  corners are near-black, so a luma threshold cannot see the top of it. The
  binding number is **282**.
- **Right, 800 vs 799.** 1 px of antialiased and compressed edge. Both the
  progress fill and the widest accent word end at x=799 exactly.
- **Bottom, 1445 vs 1442.** The bar is drawn at y=1438 h=5, so its last lit row
  is 1442 and method B picks up 3 rows of encoder bleed.

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
```

The declared union does not exceed the measured union on any edge, so method B
did in fact see all of it. That is a confirmation, not a substitute.

### Final result

```
EVERYTHING DRAWN, measured OR declared, whichever is worse:

  top    y =  282    limit >=  220    margin  +62 px
  bottom y = 1445    limit <= 1500    margin  +55 px
  right  x =  800    limit <=  900    margin +100 px

  SMALLEST HEADROOM ON ANY EDGE : +55 px    (failure floor is 20)
  RESULT: PASS
```

`instagram-cover.png` is frame 0 and so is covered by the same measurement.

### Which element sets each extreme

- **Top 282** is the brand icon card.
- **Bottom 1445** is the progress bar at y=1438 h=5.
- **Right 800** is a tie between the progress bar at full extension and the word
  `named`, both landing on 799 with 1 px of encoder bleed.
- **Left 95** is the accent rail, declared at 96.

### The run that was supposed to be bound by type was not, and the bar is why

The brief predicted this would be the tightest run of the cycle for layout, that
type rather than furniture would bind, and that a prompt might have to be
swapped for a shorter one. Measured over the copy band only (y 400..1400, so the
logo and bar are excluded), the type runs **y 639..1119, x 95..799**. Its right
extent is **799**, which is **101 px** clear of the reserve.

So the prediction was half right. Type did become the joint binding element on
the right edge, for the first time in the campaign, which is exactly what the
brief expected. It did not become a problem, and the reason is a pre-emptive
change made before rendering rather than a lucky break: run 4's progress bar was
680 px wide and reached x=811, which was that run's binding right edge at 89 px.
Here the bar was **shortened to 670 px** so it ends at 799, deliberately budgeted
to the widest type rather than the other way round. Right headroom went from
89 px to 100 px on the run that was supposed to lose ground on it.

### The width probe ran before the master and predicted the delivered file exactly

All 36 strings were rendered alone at their final font and size and measured
before 28 seconds of encoding. Widest was **`named`**, Inter ExtraBold 54 at
x=620, reaching **x=799**. Second was the prompt's first line, **`"Top-rated
property`**, SemiBold 68, reaching **x=793**, 107 px clear.

The delivered file's measured copy-band right edge is **799**, the same number
the probe gave, which is the cheapest available confirmation that the probe
models the master correctly.

**Nothing had to be resized and no prompt had to be swapped.** The brief's floor
of 44 px was never approached: the smallest type in the cut is the 34 px
wordmark, and the smallest *copy* is the 40 px kicker. The prompt itself is 68 px.

---

## Cover is not blank

Scene 1 hard-starts at full opacity. Its alpha expression is
`max(0,min(1,(5.40-t)/0.30))`, which evaluates to 1 at t=0 and only ramps at the
tail. There is no fade up anywhere in the first scene, and no y-settle on scene 1
either, since a settle would also move frame 0.

Verified rather than asserted, MD5 over raw RGB24:

```
frame 0 of instagram-silent.mp4 : 3e8d8e2340685e335f4ccbfc0d42834b
instagram-cover.png             : 3e8d8e2340685e335f4ccbfc0d42834b
```

Video stream MD5, identical across both cuts: `7f02061e4d143de51da7c296bd5bdfad`.

The cover carries the full quoted prompt plus its kicker, which is the strongest
argument for this driver being the cover-friendly one of the six: the thumbnail
is the artefact, and it reads as a screenshot of a question rather than as an ad.

---

## Progress bar actually animates

The brief's `drawbox` trap was respected up front: geometry is literal on every
box and the only expression anywhere in the bar is `enable`. The fill is **56
discrete static boxes**, one per 0.5 s, at literal widths, each gated on an
integer frame range.

Verified on the DELIVERED file by reading row y=1440 of every decoded frame:

```
frame   0  t= 0.000s   fill width =  24 px
frame  30  t= 1.000s   fill width =  47 px
frame 105  t= 3.500s   fill width = 106 px
frame 300  t=10.000s   fill width = 259 px
frame 600  t=20.000s   fill width = 494 px
frame 750  t=25.000s   fill width = 611 px
frame 839  t=27.967s   fill width = 670 px

monotonic non-decreasing : True
56 distinct widths, min 24, max 670  ->  ANIMATES
```

### The first version of this check was wrong and passed nothing

Worth recording because it is a new trap, adjacent to the brief's existing ones.
The bar check was first run off the same method-B control diff used for the safe
zone, and it reported **670 px at frame 0** and every frame after, with 6 distinct
widths clustered at 664 to 670: a bar that looked frozen at full extension.

Nothing was wrong with the render. The diff sees every pixel that differs from
the control, and the progress **track** is drawn full width on frame 0, so the
diff was measuring the track and the fill together. The fix is a luma threshold at
70, which sits between the track at 44 and the fill at 113 and separates them.

The general form: **a per-frame diff against a control answers "was this drawn",
never "which of two overlapping things was drawn".** It is the right tool for the
safe zone, where the union is the whole question, and the wrong tool for any
check that has to distinguish two elements sharing a rect. Both were needed here.

### Scene boundaries, counted not hashed

Frames were decoded sequentially in one pass and indexed, no `-ss` seeking
anywhere, and scene changes were found by counting ink pixels per frame rather
than hashing (identical pictures get different quantisation noise, so hashes are
useless here):

```
ink-pixel step changes at frames : 162, 270, 450, 564, 678, 762
scripted cuts            at frames : 162, 270, 450, 564, 678, 762
ink-pixel step changes at times  : 5.4, 9.0, 15.0, 18.8, 22.6, 25.4
scripted cuts            at times  : 5.4, 9.0, 15.0, 18.8, 22.6, 25.4
```

Six cuts, six detections, exact frame match on all six, none extra and none
missing.

---

## Music

**Track: `assets/audio/music/tension-minor.wav`.** Original BrandGEO composition,
2026-07-29, generated by `scripts/compose_music.py`, no third-party material,
cleared for commercial use including paid advertising, **no attribution line
required**. Nothing was downloaded.

Held CONSTANT across all five runs by instruction: the hook is the variable under
test, and changing the music in the same run that changes the driver would leave
a result with two candidate explanations and no way to separate them.
`ATTRIBUTION.md` maps `tension-minor` to loss aversion and status threat rather
than to concrete proof, and carries a note (added 2026-07-30) recording that this
campaign overrides that mapping for exactly this reason.

Source is 60.000 s. Trimmed to 28.000 s with a **0.08 s fade IN at st=0** and a
**1.5 s fade OUT starting at 26.5 s**, then two-pass `loudnorm`.

### The fade in is load-bearing and was verified

`tension-minor` opens at amplitude 0.025 and peaks at 0.206 inside its first
0.1 s, so a hard cut at sample 0 clicks. Measured on the **delivered** file, by
decoding the AAC:

```
FIRST 64 SAMPLES, abs max : 0.002845     ceiling 0.005    PASS
first 10 ms,      abs max : 0.013417
final 0.1 s,      abs max : 0.025923     (fade out landed)
overall peak              : 0.6143  (-4.23 dBFS)
```

### Loudness, measured not assumed

Pass 1 on the trimmed cut: `input_i=-16.21`, `input_tp=-4.41`, `input_lra=3.60`,
`input_thresh=-26.27`, `target_offset=-1.14`. The brief's warning is confirmed
again on this material: a single pass would have landed about 1.1 LU off.

Re-measured on the **delivered** `instagram-scored.mp4`, decoding the AAC:

| | Target | Measured |
|---|---|---|
| Integrated | -16 LUFS | **-16.02 LUFS** |
| True peak | -1.5 dBTP max | **-4.22 dBTP** |
| LRA | n/a | 3.60 |

True peak sits 2.7 dB under the ceiling. -1.5 dBTP is a maximum, not a target,
and with `linear=true` the gain is one scalar chosen to hit the integrated
target, so nothing was limited and no shape was altered.

### Honest read

Measured, not listened to.

```
RMS and spectral centroid per 2 s block
   0- 2   -21.21 dBFS   1621 Hz   <- fade in, deliberately quiet, under the prompt
   2- 4   -21.78        1530
   4- 6   -17.67        1305
   6- 8   -16.20        1546
   8-10   -16.20        1365
  10-12   -16.48        1384
  12-14   -15.77        2377      <- arrangement opens, mid results table
  14-16   -16.57        2613
  16-18   -16.48        1926
  18-20   -15.98        2316
  20-22   -15.91        2045
  22-24   -15.91        2281
  24-26   -15.14        2292      <- loudest block, under "Anyone can check it."
  26-28   -19.56        2249      <- fade out
```

```
band levels, dB relative to the full mix
    20-80    Hz   -1.71
    80-160   Hz   -6.55
   160-320   Hz  -13.34
   320-640   Hz  -13.53
   640-1280  Hz  -20.41
  1280-2560  Hz  -25.68
  2560-5120  Hz  -31.59
  5120-10240 Hz  -37.31
 10240-20000 Hz  -40.49
```

**What is good, and it fits this driver better than the last one.** RMS climbs
about 6.6 dB from the opening block to the 24 to 26 s block. The quietest stretch
is the first 4 seconds, which is the quoted prompt sitting alone on screen, and
the loudest is 24 to 26 s, which is "Anyone can check it." For a cut whose whole
argument is *look at this, then go and verify it*, having the bed nearly absent
while the artefact is being presented and peaking on the invitation to check is
the right shape. It was not arranged that way; the track is fixed and the scene
timings were set for reading speed, so this is a fortunate alignment rather than
a designed one.

**The weakness, stated plainly and unchanged across runs.** It is heavily
bottom-weighted. Full-mix RMS is -16.82 dBFS; filtering everything below 300 Hz
leaves **-28.27 dBFS**, an **11.4 dB** drop. On a phone speaker, which has almost
nothing under 200 Hz, this will play noticeably softer and thinner than -16 LUFS
suggests, and most of what carries the build sits in the quietest bands.

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

Each of the 36 strings was rendered alone at its final font and size and its ink
bounding box measured, so the right reserve was checked before 28 seconds of
encoding rather than after.

```bash
ffmpeg -v error -y -f lavfi -i "color=c=black:s=1080x400" \
  -vf "drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/a0.txt:x=130:y=60\
:fontsize=68:fontcolor=0xFFFFFF" \
  -frames:v 1 -f rawvideo -pix_fmt gray - | (numpy: nonzero(a > 40))
```

### 1. Background glows, one frame each

```bash
ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='139':g='92':b='246':a='66*exp(-1.9*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 glow-violet.png

ffmpeg -y -f lavfi -i "color=c=black:s=1400x1400" -vf \
"format=rgba,geq=r='99':g='102':b='241':a='46*exp(-2.2*(pow((X-700)/700,2)+pow((Y-700)/700,2)))'" \
-frames:v 1 glow-indigo.png
```

### 2. Master render

```bash
ffmpeg -y \
  -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=28.0" \
  -loop 1 -i glow-violet.png \
  -loop 1 -i glow-indigo.png \
  -loop 1 -i logo.png \
  -filter_complex_script filtergraph.txt \
  -map "[v]" -an -t 28.0 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 \
  out-silent.mp4
```

The filtergraph is 13,424 characters: 36 `drawtext` calls (35 copy strings plus
the wordmark) and 58 `drawbox` calls (the rail, the bar track, and 56 progress
steps). Structure, with the two special scenes shown:

```
[0:v]format=rgba[base];
[base][1:v]overlay=x='150+40*sin(t/7)':y='900+30*cos(t/9)':format=auto[b1];
[b1][2:v]overlay=x='-500+35*cos(t/8)':y='-340+28*sin(t/6)':format=auto[b2];
[3:v]scale=84:84[lg];
[b2][lg]overlay=x=130:y=282:format=auto[b3];
[b3]drawbox=x=96:y=640:w=4:h=480:color=0x3D2B6B@1:t=fill:replace=1,
  drawbox=x=130:y=1438:w=670:h=5:color=0x2A2C38@1:t=fill:replace=1,

  [progress fill, 56 static boxes, INTEGER FRAME gates, no geometry expression:]
  drawbox=x=130:y=1438:w=24:h=5:color=0x8B5CF6@1:t=fill:replace=1
    :enable='between(n\,0\,14)',
  drawbox=x=130:y=1438:w=35:h=5:...:enable='between(n\,15\,29)',
  ... 54 more ... final step w=670 at n 825..839,

  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/brand.txt
    :x=236:y=303:fontsize=34:fontcolor=0xE8E9ED@0.92,

  [scene 1, HARD IN at t=0 so frame 0 is a usable cover, and no y-settle:]
  drawtext=fontfile=fonts/Inter-SemiBold.ttf:textfile=txt/a0.txt:x=130:y='731'
    :fontsize=68:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,(5.40-t)/0.30))':enable='between(n\,0\,161)',
  ... a1 at y=827, a2 at y=923, a3 at y=1019 ...

  [scenes 2 to 6, cross-faded with an 18 px settle:]
  drawtext=fontfile=fonts/Inter-Bold.ttf:textfile=txt/b0.txt:x=130
    :y='666+18*(1-min(1\,(t-5.40)/0.45))'
    :fontsize=84:fontcolor=0xE8E9ED
    :alpha='max(0\,min(1\,min((t-5.40)/0.35\,(9.00-t)/0.30)))'
    :enable='between(n\,162\,269)',
  ...

  [scene 7, the CTA, fades IN only so it holds to the final frame:]
  drawtext=...:alpha='max(0\,min(1\,(t-25.40)/0.35))'
    :enable='between(n\,762\,839)',

  noise=alls=3:allf=t+u:all_seed=20260730,
  format=yuv420p[v]
```

The `noise` pass dithers the large soft gradient so H.264 does not band it; its
seed is pinned so the control render can be diffed against the delivered one.

### 3. Control render, for the diff measurement

Identical background and identical noise seed, with the logo, rails, bar and all
type removed. This is the reference that makes method B possible.

```bash
ffmpeg -y -f lavfi -i "color=c=0x090A0F:s=1080x1920:r=30:d=28.0" \
  -loop 1 -i glow-violet.png -loop 1 -i glow-indigo.png \
  -filter_complex_script filtergraph-control.txt \
  -map "[v]" -an -t 28.0 \
  -c:v libx264 -profile:v high -level 4.0 -preset slow -crf 18 \
  -pix_fmt yuv420p -x264-params keyint=60:min-keyint=30:scenecut=0 \
  -movflags +faststart -r 30 control.mp4
```

### 4. Audio

```bash
# trim 60.000s to 28.000s, 0.08s fade IN (the track opens at 0.025 and clicks
# on a hard cut), 1.5s fade OUT
ffmpeg -y -i tension-minor.wav \
  -af "atrim=0:28.0,asetpts=N/SR/TB,afade=t=in:st=0:d=0.08,afade=t=out:st=26.5:d=1.5" \
  -c:a pcm_s24le music-cut.wav

# pass 1, measure
ffmpeg -i music-cut.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -

# pass 2, apply the measured values
ffmpeg -y -i music-cut.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11\
:measured_I=-16.21:measured_TP=-4.41:measured_LRA=3.60:measured_thresh=-26.27\
:offset=-1.14:linear=true" -ar 48000 -ac 2 -c:a pcm_s24le music-norm.wav
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
# durations and stream tables. A mux can exit 0 and be unreadable, so this
# runs before the render is called done.
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

The safe-zone measurement, the frame-edge artefact demonstration and the
scene-boundary count are one numpy pass over two synchronised
`ffmpeg -f rawvideo -pix_fmt rgb24` pipes, the delivered file and the control,
decoded sequentially with no seeking, over all 840 frames, reduced to a global
extreme. The bar-animation check is a second pass over the delivered file alone,
for the reason given above.

---

## Every trap in the brief, and how it was handled

Applied as preconditions, not discovered:

| Trap | Handling |
|---|---|
| `drawbox` blends on RGBA | `replace=1` on all 58 boxes, with pre-blended opaque colours so nothing depends on alpha |
| `drawbox` cannot animate | 56 literal static boxes, `enable` is the only expression, and the bar was then verified to move on the delivered file |
| Single-digit headroom is a paper pass | smallest edge is **+55 px**; reported per edge, never as "passes" |
| Guess the ink threshold | background peak printed first (39.7), four thresholds inside the gap agree |
| Fade in on scene 1 | scene 1 hard-starts and has no y-settle; cover MD5-matched to frame 0 |
| Furniture counts as ink | all five furniture rects declared and folded in; the bar was shortened to 670 px specifically to stop it binding |
| Measure the intermediate | every number comes from the delivered mp4 |
| Diff against a flat canvas | diffed against a text-free control; the flat-colour method was run too, purely to demonstrate it returns the whole frame |
| Dark-on-dark furniture invisible to both pixel methods | progress track at luma 44, 4 above the background peak, folded in by declared rect |
| Fade the music IN | 0.08 s fade in, first 64 samples at 0.002845 |
| A mux can exit 0 and be unreadable | both files probed for duration and stream count |
| `ffconcat` drift | no concat; all gates are integer frame indices, boundaries verified on the delivered file |
| Frame hashing | ink-pixel counting, not hashing; six cuts detected at the exact scripted frames |
| `-ss` near a cut | no seeking anywhere in any measurement |
| `-shortest` | on the mux; 512 samples of AAC padding confirmed present in the packets and excluded by the sample table |
| `color=black@0.0` does not survive format negotiation | not applicable, and deliberately so: this build draws directly onto the composited base in one chain rather than compositing transparent text layers, so there is no RGBA layer whose alpha could be dropped |
| Provenance is on the FIGURE, not the page | every figure traced to the 2026-07-24 Chicago collection; `bg-005`'s third-party 48% and 93% not consulted |
| Engine count is a claim about the lineup on the day | the source page states its own substitution of Google AI Mode for retired Meta AI, so the five on screen are verified for the collection date |
| Never name a measured subject | mechanical regex scan of 33 candidate names plus a 17-entry explicit blacklist against all 36 rendered strings |

**Two things went wrong this run and both were caught by measurement.** The
progress-bar check reported a frozen bar that was not frozen, described above.
And the build's own `copy.py` shadowed the standard library's `copy` module,
which surfaced only when a later tool imported PIL. It changed no output (the
filtergraph regenerates byte-identical after the rename, verified by diff) but it
is the kind of latent fault that would have produced a confusing failure in a
different build, so it is recorded rather than quietly fixed.

## Scope

This task was scoped to this `instagram/` folder plus the run's `RUN.md`, which
did not exist because this is the first cut of run `20260730-0216`. Nothing else
was written. No git command was run.

## Nothing was posted or scheduled

These are files for review only.
