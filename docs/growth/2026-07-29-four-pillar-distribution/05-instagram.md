# 05. Instagram

Four carousels (MOFU) and four Reels (TOFU), one of each per pillar. Built
against `00-BRIEF.md` and `.claude/skills/growth-media-architect/SKILL.md`.

**Nothing here is scheduled or sent.** Drafts for review.

---

## Read before rendering

**Word limit is enforced, not aspirational.** Every carousel slide below is 12
words or fewer and carries its count in the right-hand column. If a slide is
rewritten, recount it. A slide that runs long is the failure mode this format
has, and it does not announce itself in a preview.

**Instagram accepts JPEG only.** PNG is rejected by the publishing API
(`docs/growth/channel-specs-2026-07-29.md` §7, first-party). BrandGEO's `#090A0F`
canvas with a violet gradient bands badly under JPEG. Export at quality 95 or
above, add 1 to 2 percent noise across any gradient field, and prefer flat fields
with hard edges on Instagram specifically. This is why the carousel briefs below
call for flat panels rather than the glow treatment used elsewhere.

**Carousel size: 1080 x 1350 (4:5).** All slides must share one aspect ratio or
Instagram centre-crops the set to slide one. Matrix target R2.

**Reel size: 1080 x 1920 (9:16).** Matrix target R1. Meta's insets are top 14
percent (269 px), bottom 35 percent (672 px), sides 6 percent (65 px). Usable
band is **y = 269 to y = 1248**, roughly half the frame. The action rail is not
cleared by the 6 percent side inset, so keep anything critical out of the right
**180 px**. Source: `channel-specs-2026-07-29.md` §8.

**Links are not clickable in Instagram captions.** Every caption ends with an
explicit pointer to the bio because there is no other path.

**Encoding:** `-movflags +faststart` on every Reel. The `moov` atom must lead the
file and most encoders write it last.

**Existing assets referenced below** (real files, not inventions):

| Path | Use |
|---|---|
| `docs/growth/brand-identity-2026-07-29/v3/png/mark-1024-on-dark.png` | End-card mark on every Reel |
| `docs/growth/brand-identity-2026-07-29/v3/logo-full.svg` | Wordmark lockup, carousel slide 1 corner |
| `docs/growth/brand-identity-2026-07-29/v3/png/icon-card-1024.png` | Alternative mark on a `#0B0C10` card |
| `docs/growth/social-kit/instagram/instagram-profile-320x320.png` | Profile avatar, already uploaded |
| `docs/growth/grok-launch/images/bg-021-hero.png` | P1 hero art, source for IG-C1 slide 1 |
| `docs/growth/data-templates-2026-07-29/out/city-comparison_complete_portrait.png` | P2 carousel, real rendered data card |
| `docs/growth/data-templates-2026-07-29/out/city-comparison_complete_story.png` | P2 Reel, same data at 1080 x 1920, already built inside Meta's safe band |
| `docs/growth/data-templates-2026-07-29/out/engine-comparison_bpr-2026-07-21_portrait.png` | P3 carousel, real per-engine card |

The two `city-comparison` renders are the only assets here carrying live product
data. Regenerate rather than hand-edit: `python city_comparison.py --all` in
`docs/growth/data-templates-2026-07-29/`. The generator reads a JSON extract and
never touches the database, so a re-render cannot trigger a collection.

**One correction to the brief.** `00-BRIEF.md` puts P2's source at "bg-016.html
plus the 37 city pages". The repository holds **27** city research pages, plus 10
industry pages and 1 index issue (`ls brandgeo/web/ai-visibility-*.html` returns
38 files total). No asset below states a city-page count. Flagged for whoever
owns the brief.

---
---

# Carousels

---

## IG-C1

**Pillar:** P1, two engines shipped and two turned down.
**Funnel:** MOFU.
**Hook driver:** Curiosity gap.
**Source:** `brandgeo/web/bg-021-retrieval-not-engine-count.html`, sections "The
second one is the one most tools are missing", the surface comparison table, and
"An absent AI Overview is a result, not an error".

**Angle, and why it is not the Grok package's angle.**
`docs/growth/2026-07-29-grok-sixth-engine/` spines every asset on retrieval:
engine count is vanity, ask which engines searched. That argument is spent. This
carousel takes the beat BG-021 files second and makes it the whole piece: there
are two separate Google products, most tools report one of them as "Google", and
it is the one fewer people ever see. BG-021 itself flags this as the vendor
question "most likely to produce a pause". Nothing below repeats a sentence from
the earlier package.

| # | On slide | Words |
|---|---|---|
| 1 | **Your tool says it monitors Google. Which Google?** | 8 |
| 2 | **There are two. They are different products and they disagree.** | 10 |
| 3 | **AI Mode is a tab. The searcher has to choose it.** | 11 |
| 4 | **AI Overviews sits above the links by default. Nobody opts in.** | 11 |
| 5 | **One surface reaches people who opted in. The other reaches everyone.** | 11 |
| 6 | **Report one as Google and you have described the smaller room.** | 11 |
| 7 | **We measure both, separately. Averaging them would hide the disagreement.** | 10 |
| 8 | **Ask your vendor which Google. Then watch the pause.** | 9 |

**Caption, 131 words:**

> Google ships two different AI answer surfaces and almost nobody in this
> category tells them apart.
>
> AI Mode is a tab. A searcher has to switch to it deliberately, which most
> never do. AI Overviews is the summary block that appears above the links on an
> ordinary results page, with no opt-in at all. Different reach. Different
> answers to the same question.
>
> A tool that measures AI Mode and labels the column "Google" is reporting the
> surface fewer people see and calling it the whole picture. We measure both,
> separately, because averaging them would hide the one thing you needed to
> know.
>
> There is a fourth question worth asking too: what is your vendor's standard
> for removing an engine, not adding one.
>
> Free audit on your own domain, link in bio.
>
> #AIsearch #GEO #AIvisibility #SEO #GoogleAI #brandvisibility

**Slide notes.** Slide 3 and slide 4 are a matched pair and must be visually
identical in layout so the only difference the eye registers is the sentence.
Slide 8 carries no logo lockup, so the question is the last thing on screen.

### Visual brief V-C1, serves IG-C1

```
ENGINE: flux
SUBJECT: Eight-slide flat panel set. Slide 1 is the only illustrative frame: a
         near-black search results page rendered as clean abstract geometry, with
         a single violet-outlined rectangle snapped around the topmost summary
         block. Slides 2 to 8 are typographic on flat fields. Slides 3 and 4 are
         a matched diptych, each showing one Google surface as a simple wireframe
         (slide 3 a tab bar with one tab lit, slide 4 a stacked results page with
         the top block lit).
COMPOSITION: 1080 x 1350, 4:5. Type set left, optically centred in the upper two
         thirds, wireframe or diagram in the lower third. 96 px margins. Wordmark
         from logo-full.svg bottom-left on slides 1 to 7 only, absent on slide 8.
         Slide numbers omitted; the swipe affordance carries it.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat, no gradient fields larger than 200 px in any direction. Accent
         appears as hard-edged outline and fill only. This is a deliberate
         departure from the house glow treatment because Instagram's JPEG-only
         constraint bands large smooth gradients on a near-black canvas.
MOOD: Cold, forensic, unhurried. A specification sheet that happens to be
         well set, not a promotion.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, Google logos or
          any Google trade dress, real screenshots of a live SERP, magnifying
          glass icons, gradient meshes over 200 px
ASPECT: 4:5
```

Slide 1 may instead be cropped from
`docs/growth/grok-launch/images/bg-021-hero.png`, which already exists and is on
palette. Prefer the existing file if the crop holds at 4:5. **Google trade dress
stays out of every frame.** The surfaces are named in type and drawn as neutral
wireframes; reproducing Google's own UI in a competitive comparison is a legal
surface, not a design choice.

---

## IG-C2

**Pillar:** P2, cross-engine consensus.
**Funnel:** MOFU.
**Hook driver:** Curiosity gap.
**Source:** `brandgeo/web/bg-016.html`, key findings block and the
converges-versus-fragments table.

| # | On slide | Words |
|---|---|---|
| 1 | **We asked five AI engines the same buyer questions. Twenty categories.** | 11 |
| 2 | **Ten of twenty had three or more engines naming one brand.** | 11 |
| 3 | **The other ten agreed on nothing. That split is not random.** | 11 |
| 4 | **Small, well documented categories converge. Long tail categories fragment. Every city.** | 11 |
| 5 | **In Paris, every engine that answered named Qonto first. Both languages.** | 11 |
| 6 | **In Rome, no category reached agreement across three engines. None.** | 10 |
| 7 | **Converged category: someone already owns it. Fragmented: nobody has yet.** | 10 |
| 8 | **Find out which one yours is before you write anything.** | 10 |

**Caption, 134 words:**

> Twenty buyer categories, four cities, five AI engines, every response read by
> hand. Half the categories produced three-engine agreement or better. Half
> produced no agreement at all.
>
> The split is not random and it repeated in every city we tested. Categories
> with a small number of well documented, frequently reviewed providers
> converge. Categories built on a long tail of small local firms and
> individually named professionals fragment.
>
> Which side you are on changes what you should do. A converged category already
> has an incumbent in AI answers and displacing them means out-documenting them
> across the same sources. A fragmented one has nobody established, which makes
> it the easier place to become the name the engines settle on.
>
> Both are measurable today. Neither is visible in Search Console.
>
> Full study and the free audit, link in bio.
>
> #AIsearch #GEO #AIvisibility #SEO #brandvisibility #contentstrategy

**Slide notes.** Slides 5 and 6 are the proof pair and should read as two halves
of one spread, same layout, opposite outcome. Slide 6's "None." wants its own
line at display weight. Qonto is named because BG-016 publishes the finding
under its own name; no other third-party brand appears anywhere in this set.

### Visual brief V-C2, serves IG-C2

```
ENGINE: flux
SUBJECT: Eight-slide set built around one repeated device: a 4-by-5 grid of 20
         cells standing for the 20 categories. Slide 1 shows it empty. Slide 2
         fills 10 cells violet. Slide 3 leaves the remaining 10 as hollow
         outlines. Slides 5 and 6 replace the grid with a four-mark engine row:
         on slide 5 all four marks resolve to one identical shape, on slide 6 all
         four resolve to four different shapes. Slide 7 is two flat doors side by
         side. Slide 8 is type only.
COMPOSITION: 1080 x 1350, 4:5. Grid device occupies the lower 40 percent, type
         sits above it. Cell size 88 px with 24 px gutters, which lands the grid
         at 536 x 536 inside 96 px margins. Slides 5 and 6 use identical
         geometry so the difference reads instantly.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat fills. Filled cells are solid #7c3aed, unfilled are 1.5 px
         #7c3aed outline at 40 percent. No inner glow, no soft shadow, per the
         Instagram JPEG banding constraint.
MOOD: Empirical and slightly unsettling. The grid should look like a result, not
         an infographic.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, world maps, flags,
          city skylines, third-party engine logos, pie charts
ASPECT: 4:5
```

**Slide 4 has a real alternative and it is better than a drawing.** Use
`docs/growth/data-templates-2026-07-29/out/city-comparison_complete_portrait.png`
directly. It is already 1080 x 1350, already on palette, and it plots BrandGEO's
own measured data rather than an illustration of it. If it is used, slide 4's
words stay as written and the card sits beneath them. Convert to JPEG at quality
95 before publishing; it ships as PNG.

---

## IG-C3

**Pillar:** P3, measurement integrity.
**Funnel:** MOFU.
**Hook driver:** Concrete proof.
**Source:** `brandgeo/web/bg-018.html`, rounds one to five and the regression
suite section. Slide 3's heading-depth example is BG-018's own worked case.

| # | On slide | Words |
|---|---|---|
| 1 | **Same answer. Same praise. Two different scores. Ours.** | 8 |
| 2 | **A medal emoji sat exactly on our rank detector's character budget.** | 11 |
| 3 | **Heading level two scored rank one. Level three scored nothing.** | 10 |
| 4 | **That was bug three of five. We published all five.** | 10 |
| 5 | **Bolded "Pricing:" was being counted as a competitor brand name.** | 10 |
| 6 | **156 assertions from real responses now block any extraction change.** | 10 |
| 7 | **A tool that never found a false positive never looked.** | 10 |
| 8 | **Ask any vendor, including us, what they found and fixed.** | 10 |

**Caption, 127 words:**

> One of our clients received an AI answer naming them the top recommendation.
> Under one heading style it scored rank 1 and positive sentiment. Under a
> heading one level deeper, the identical answer scored no rank and neutral
> sentiment.
>
> The cause was a medal emoji. It encodes as two units and it landed exactly on
> the character budget our rank detection used to decide whether a line was a
> ranked list item.
>
> That was the third of five false positives we found in our own extraction
> logic over six weeks. Section headings read as company names. Bolded field
> labels read as brands. Two more that were fine in English and broken in
> Romanian.
>
> All five are written up. 156 assertions from real production answers now stand
> behind the fix.
>
> Full methodology and the free audit, link in bio.
>
> #AIvisibility #GEO #measurement #SEO #dataquality #AIsearch

**Slide notes.** Slide 1 is the only slide that should stop a scroll on its own,
so it gets the largest type in the set. "Ours." is the word doing the work and it
belongs on its own line. Slide 5 must render the colon inside the quotation
marks; it is the entire distinguishing signal in that bug and a designer will be
tempted to drop it for balance.

### Visual brief V-C3, serves IG-C3

```
ENGINE: flux
SUBJECT: Eight-slide set. Slides 1 and 3 show two answer cards side by side,
         visually identical, each with a score chip beneath: one reading "1",
         one reading "null". Slide 2 shows a single line of monospace markdown
         with a horizontal ruler beneath it and a medal glyph sitting exactly on
         the ruler's final tick, that tick marked in red. Slide 5 shows one
         bolded fragment, "Pricing:", with the colon circled. Slide 6 is a single
         numeral, 156, at display scale. Slides 4, 7 and 8 are type only.
COMPOSITION: 1080 x 1350, 4:5. Paired cards sit side by side at 420 px wide with
         a 60 px gutter, vertically centred, type above. Monospace passages set
         in a real mono face, not letter-spaced sans. 96 px margins throughout.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat. One exception: the red failure tick on slide 2 and the red
         "null" chip on slides 1 and 3, which are the only non-violet accents in
         the entire four-carousel campaign and should stay that way.
MOOD: An engineering post-mortem. Clinical, unembarrassed, faintly severe.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, bug or insect
          iconography, red warning triangles, terminal windows with fake code,
          checkmark-and-cross comparison tables
ASPECT: 4:5
```

**Real asset option for slide 6.**
`docs/growth/data-templates-2026-07-29/out/engine-comparison_bpr-2026-07-21_portrait.png`
is a per-engine card built from real measured rows and is on palette at 1080 x
1350. It is a weaker fit than the bare numeral and should only be used if the set
needs a data beat. If it is used, note that its Claude row reads 5/7 because a
prompt was collected twice that day; that is the measured answer count, not an
error, and nothing in the caption should be written as though it were a rate.

---

## IG-C4

**Pillar:** P4, peer-archived research.
**Funnel:** MOFU.
**Hook driver:** Concrete proof, carrying authority.
**Source:** `brandgeo/web/bg-017.html`, key findings block and "Why we published
the disclosed limits along with the findings". DOI 10.5281/zenodo.21395598.

| # | On slide | Words |
|---|---|---|
| 1 | **222 real AI responses. Seven cities. Read by hand.** | 9 |
| 2 | **56 buyer questions, written like a person would actually ask.** | 10 |
| 3 | **Published to Zenodo with a permanent DOI. Open access.** | 9 |
| 4 | **CC BY 4.0. Anyone can quote it. Including AI systems.** | 10 |
| 5 | **280 responses were designed. 278 recorded. We say which two.** | 10 |
| 6 | **One engine failed on quota. We excluded it, page one.** | 10 |
| 7 | **Archived and citable, not peer reviewed. We say that too.** | 10 |
| 8 | **A paper you can check beats one that sounds authoritative.** | 10 |

**Caption, 138 words:**

> We ran 56 realistic buyer questions across seven cities and read every response
> by hand, then wrote it up as a formal empirical paper rather than another
> article.
>
> It is on Zenodo, the CERN-run repository, with a permanent DOI and a CC BY 4.0
> licence. No account, no paywall, no email. Anyone can quote it, including the
> AI systems the paper is about.
>
> The design implied 280 engine-level responses. 278 were recorded. Two were lost
> to a collection gap and we name them. A further 56 came back as API errors from
> a quota failure on one engine, so that engine is excluded from the analysis
> instead of having its absence quietly read as a finding. The analytic dataset is
> 222 responses across four engines and the paper says so on page one.
>
> To be exact about what this is: archived and citable, not peer reviewed.
>
> DOI and the free audit, link in bio.
>
> #AIsearch #GEO #openaccess #research #AIvisibility #SEO

**Slide notes.** Slide 7 is the slide a marketer will want to cut. It stays.
"Peer-archived" is doing precise work in this pillar's name and the distinction
between a DOI-backed open archive and peer review is exactly the kind of thing a
measurement brand cannot be caught blurring. Slides 5 and 6 are the credibility
spine and should be visually heavier than slides 1 to 4, inverting the usual
taper.

### Visual brief V-C4, serves IG-C4

```
ENGINE: flux
SUBJECT: Eight-slide set. Slide 1 is a dense field of 222 small uniform marks
         arranged in a rectangle, each one standing for a response, with seven
         of them enlarged into labelled city dots. Slide 3 is a flat rendering
         of a DOI string set in mono at display scale. Slide 4 is the CC BY 4.0
         glyph pair set as flat vector shapes. Slide 5 is a subtraction figure,
         280 struck through to 278 struck through to 222, stepping down the
         frame. Slide 6 is a document page with one line highlighted. Slides 2,
         7 and 8 are type only.
COMPOSITION: 1080 x 1350, 4:5. Slide 1's mark field is 18 columns by 13 rows
         with one short final row, filling the lower 55 percent. Slide 5's three
         figures step down and right, each smaller than the last. 96 px margins.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat. Excluded and lost responses render as 20 percent violet outlines
         rather than being removed from the field, so the gap is visible as a
         shape. That is the whole argument of the pillar rendered as a design
         decision.
MOOD: Archival. Quiet, permanent, slightly institutional. Closer to a
         library catalogue than a launch.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, laurel wreaths,
          academic caps, university crests, peer-review or journal iconography,
          award ribbons, Zenodo or CERN logos
ASPECT: 4:5
```

The laurel and journal-badge exclusions are not stylistic. Any visual that reads
as peer review contradicts slide 7 and would make the honest slide look like a
disclaimer bolted onto a boast.

---
---

# Reels

All four open on a visual state change inside the first 1.5 seconds, per SKILL.md
§4. All four use burned-in captions rather than platform auto-captions.

---

## IG-R1

**Pillar:** P1, two engines shipped and two turned down.
**Funnel:** TOFU.
**Hook driver:** Loss aversion.
**Length:** 30 seconds.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Hard cut, no build, no logo bumper. A near-black abstract results page already fills the frame. At 1.1s a violet rectangle snaps around the summary block at the top with an audible click. | "This block." |
| 1.5-5s | Rectangle holds. Label types on beneath it: **"AI OVERVIEWS. NOBODY OPTED IN."** Rest of the page dims to 30 percent. | "Nobody chose to see it. It sits above the links on an ordinary search, by default." |
| 5-10s | Wipe left to a second wireframe: a tab bar, one tab lit violet, page body below it. Label: **"AI MODE. YOU HAVE TO CLICK IT."** | "This is the other one. A tab a searcher has to switch to on purpose." |
| 10-16s | Split frame, both wireframes side by side, labelled **AI MODE** and **AI OVERVIEWS**. Two ranked lists populate beneath them. Three of the five names differ. Differences ring violet. | "Two separate Google products. Same question. Different answers." |
| 16-23s | Left panel greys out completely. Text lands over it: **"most tools measure this one"** | "Most tools in this category measure the tab, report the column as Google, and never mention the block." |
| 23-27s | Right panel expands to fill the frame. Text: **"this is the one your customers see"** | "The one nobody opts into is the one nearly everyone sees." |
| 27-30s | End card. `mark-1024-on-dark.png` centred in the usable band. Text beneath: **"Ask which Google."** | "So ask your tool which Google it means." |

**Caption, 88 words:**

> Google runs two different AI answer surfaces. AI Mode is a tab a searcher opts
> into. AI Overviews is the block that appears above the links whether they
> wanted it or not.
>
> They return different answers. A tool that measures one and labels the column
> "Google" is showing you the smaller room.
>
> We measure both, separately, because averaging them hides the disagreement,
> and the disagreement is the finding.
>
> Check your own domain, link in bio.
>
> #AIsearch #GEO #AIvisibility #SEO #GoogleAI

**Production notes.** The 10 to 16 second split is the whole argument and it
fails if either panel label is unreadable. Both labels sit above y = 1248 or the
composition drops to stacked rather than side by side; shrinking the labels is
not the trade to make. The 23 to 27 second text card centres in the usable band,
not the frame. No trending audio: voiceover plus a low ambient bed, because the
argument does not survive being cut to a beat.

### Visual brief V-R1, serves IG-R1

```
ENGINE: sora
SUBJECT: Motion piece built from two abstract search-surface wireframes, never a
         real screenshot. Surface A is a stacked results page with a distinct
         summary block at the top. Surface B is the same page with a tab bar
         above it and one tab lit. Ranked lists populate as plain typographic
         rows, no favicons, no thumbnails. Every transition is a hard cut or a
         directional wipe, never a dissolve.
COMPOSITION: 1080 x 1920, 9:16. All content inside y = 269 to y = 1248 and clear
         of the right 180 px. Split-frame beat runs as two 460 px columns with a
         40 px gutter, both labels set above the panels rather than below.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Violet glow permitted here, unlike the carousels, because video
         compression handles the gradient better than Instagram's JPEG pipeline.
         Keep the glow behind geometry, never behind type.
MOOD: Cold reveal. The tone of showing someone a thing that was always on their
         screen and never labelled.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, Google logos or
          trade dress, real SERP screenshots, cursor animations, browser chrome,
          countdown timers
ASPECT: 9:16
```

---

## IG-R2

**Pillar:** P2, cross-engine consensus.
**Funnel:** TOFU.
**Hook driver:** Curiosity gap.
**Length:** 33 seconds.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Hard cut onto a 4-by-5 grid of 20 empty cells already on screen. At 1.2s all 20 snap-fill in a single beat: 10 solid violet, 10 hollow. | "Twenty buyer questions." |
| 1.5-5s | Grid holds. Two labels fade up over the halves: **AGREED** and **DID NOT**. | "We ran them past five AI engines across four cities and read every answer." |
| 5-11s | Violet half scales up and fills the frame. Text: **"10 of 20: three or more engines named the same brand"** | "In half of them, three or more engines independently landed on the same brand." |
| 11-17s | Hollow half fills the frame instead. Five columns populate, each with a different set of names. No name repeats across columns. | "In the other half, five engines, five different answers, nothing shared." |
| 17-23s | Card reading **PARIS**. Four engine marks light in sequence, each resolving to the same single name plate. | "In Paris every engine that answered named the same bank first. In French and in English." |
| 23-28s | Card reading **ROME**. Four engine marks light in sequence, each resolving to a different name plate. A counter beneath reads **0**. | "In Rome not one category got three engines to agree. Not one." |
| 28-33s | Two flat doors side by side. Left: **"someone already owns it"**. Right: **"nobody has yet"**. `mark-1024-on-dark.png` beneath. | "Your category is one of those two, and it is worth knowing which before you write another word." |

**Caption, 91 words:**

> Twenty buyer categories. Four cities. Five AI engines. Every response read by
> hand.
>
> Half the categories produced three-engine agreement or better. Half produced
> none at all. The split repeated in every city, and it tracks how well
> documented the category is, not how big it is.
>
> A converged category has an incumbent in AI answers already. A fragmented one
> does not, which makes it the easier one to win.
>
> Check which yours is, link in bio.
>
> #AIsearch #GEO #AIvisibility #SEO #contentstrategy

**Production notes.** The Paris and Rome beats at 17 to 28 seconds must use
identical geometry and identical timing, so the only variable the viewer
registers is the outcome. If the two beats are cut at different lengths the
comparison stops reading. Name plates are typographic, not logos; no third-party
mark appears in this Reel except Qonto's name in plain type, which BG-016
publishes.

### Visual brief V-R2, serves IG-R2

```
ENGINE: sora
SUBJECT: Grid-driven motion piece. One 4-by-5 cell grid is the spine, entering
         filled rather than animating in, then scaling between states. Engine
         marks are four abstract glyphs, deliberately not resembling any real
         engine's logo. Name plates are flat typographic bars.
COMPOSITION: 1080 x 1920, 9:16. Grid centred in the band y = 269 to y = 1248,
         cell 132 px with 28 px gutters. Five-column beat at 11 to 17 seconds
         uses 150 px columns and must stay clear of the right 180 px, which
         means the fifth column sits at x = 750 at the widest.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Filled cells solid, hollow cells 1.5 px outline. Glow only behind the
         grid as a whole, never per cell, or the hollow cells stop reading as
         empty.
MOOD: A result being read out, not a pitch. Steady, no acceleration into the
         end card.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, world maps,
          national flags, city skylines, Eiffel Tower, Colosseum, third-party
          engine logos, animated counters spinning up from zero
ASPECT: 9:16
```

**Real asset.**
`docs/growth/data-templates-2026-07-29/out/city-comparison_complete_story.png` is
already 1080 x 1920 and already composed inside Meta's safe band. It plots
measured BrandGEO data across 17 US cities with complete coverage. It is a strong
optional insert between the 11 and 17 second beat if that beat needs weight,
because it shows fragmentation as a real chart rather than a drawn one. It is a
different dataset from BG-016's four European cities, so if it is used the
voiceover must not blur them. Do not add it silently.

---

## IG-R3

**Pillar:** P3, measurement integrity.
**Funnel:** TOFU.
**Hook driver:** Status threat.
**Length:** 31 seconds.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Hard cut. Two identical answer cards already side by side, each scored **#1**. At 1.0s the right card's score flips to **null** and turns red. Nothing else moves. | "Same answer." |
| 1.5-5s | Cards hold. Text between them: **"identical praise"**. Both cards' body text is legibly the same. | "Same brand. Same praise. Two different scores." |
| 5-11s | Push in on the two headings. Left reads `## 1. Brand` with a medal glyph, right reads `### 1. Brand` with the same glyph. The extra hash rings violet. | "The only difference is heading depth. One extra character of markdown." |
| 11-17s | A character-budget ruler animates left to right across the line. The medal glyph lands exactly on the final tick, which flashes red and holds. | "A medal emoji counts as two units, and it sat exactly on the budget our rank detection used." |
| 17-23s | Pull back. Text: **"that was bug 3 of 5"**. Four more cards stack in behind the front one. | "That was the third of five false positives we found in our own scoring pipeline." |
| 23-27s | Cards collapse into a single numeral, **156**, at display scale. Label beneath: **"assertions, from real responses"** | "All five are published, and 156 assertions built from real answers now block a repeat." |
| 27-31s | End card. `mark-1024-on-dark.png`. Text: **"never found one? never looked."** | "Ask any tool what it has caught in its own pipeline. Ours included." |

**Caption, 86 words:**

> A client of ours got named the top recommendation in an AI answer. Under one
> heading style our pipeline scored it rank 1 and positive. One heading level
> deeper, the identical answer scored no rank and neutral.
>
> The cause was a medal emoji landing exactly on a character budget.
>
> That was bug three of five. All five are written up, and 156 assertions from
> real production answers stand behind the fix now.
>
> Check your own domain, link in bio.
>
> #AIvisibility #GEO #SEO #dataquality #AIsearch

**Production notes.** The 5 to 11 second beat needs a real mono face at a size
that survives Instagram's compression; the difference between two and three hash
marks is the entire proof and it is one glyph wide. If it does not read at 1080
on a phone, set the two headings vertically stacked rather than pushing in
further. Red appears in exactly two places in this Reel and nowhere else in the
campaign; that scarcity is what makes it work.

### Visual brief V-R3, serves IG-R3

```
ENGINE: sora
SUBJECT: Two identical answer cards, scored differently, examined at increasing
         magnification until the cause is visible. Cards are abstract renderings
         of an AI response: a heading line, three body lines, a score chip. Text
         is real and legible, not lorem. The ruler at 11 to 17 seconds is a
         plain measurement device, ticks and a terminal mark, no instrumentation
         styling.
COMPOSITION: 1080 x 1920, 9:16. Paired cards at 440 px wide with a 60 px gutter,
         centred in y = 269 to y = 1248. Push-in beat crops to the heading lines
         only and fills the band. Score chips sit at card bottom, never below
         y = 1248.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat card surfaces with a 1 px violet border. Glow reserved for the
         156 numeral at 23 to 27 seconds, which is the only moment the piece
         should feel like a resolution.
MOOD: Forensic. A defect being demonstrated calmly by the people who shipped it.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, bug or insect
          iconography, red warning triangles, magnifying glass overlays,
          terminal windows, fake code scroll, error dialog boxes
ASPECT: 9:16
```

---

## IG-R4

**Pillar:** P4, peer-archived research.
**Funnel:** TOFU.
**Hook driver:** Contrarian.
**Length:** 32 seconds.

| TIME | ON SCREEN | SPOKEN |
|---|---|---|
| 0.0-1.5s | Hard cut. A paper page already fills the frame. At 1.2s a violet highlighter sweeps one line: **"56 responses excluded"**. No title card, no build. | "We led with the failure." |
| 1.5-6s | Page pulls back to reveal the title block and the DOI line beneath it. Highlight holds. | "This is our research paper. Page one says one of the five engines failed on quota." |
| 6-12s | Three figures step down the frame: **280** struck through, **278** struck through, **222** solid. Labels: designed, recorded, analysed. | "280 responses designed. 278 recorded. 222 actually analysed, and we say which ones went where." |
| 12-18s | Field of 222 uniform marks fills the band. Seven of them enlarge into labelled city dots. Text: **"56 buyer questions, read by hand"** | "Seven cities. 56 buyer questions. Every answer read by a person, not a parser." |
| 18-24s | Flat rendering of the Zenodo record: DOI string in mono, **CC BY 4.0** badge as vector shapes. | "Archived on Zenodo with a permanent DOI. Open licence. No paywall, no account, no email." |
| 24-28s | Full-frame type card: **"archived, not peer reviewed"** | "It is archived and citable. It is not peer reviewed, and we would rather say that than let you assume it." |
| 28-32s | End card. `mark-1024-on-dark.png`. Text: **"a paper you can check"** | "A paper you can check beats one that only sounds authoritative." |

**Caption, 93 words:**

> 56 buyer questions, seven cities, every response read by hand, written up as a
> formal paper and archived on Zenodo with a permanent DOI under CC BY 4.0.
>
> The design implied 280 engine-level responses. 278 were recorded, and 56 came
> back as API errors from a quota failure on one engine, so that engine is
> excluded from the analysis instead of having its silence read as a finding.
> The analytic set is 222, stated on page one.
>
> Archived and citable, not peer reviewed. DOI in bio.
>
> #AIsearch #GEO #openaccess #research #AIvisibility

**Production notes.** The 24 to 28 second card is the point of the Reel, not a
disclaimer, and it should be cut at the same weight as every other beat rather
than rushed. The paper page at 0 to 6 seconds must be the real document, not a
mock; the DOI and the excluded-responses line both appear in it and a fabricated
page would be a self-refuting asset for this specific pillar. Pull it from
`doi.org/10.5281/zenodo.21395598`.

### Visual brief V-R4, serves IG-R4

```
ENGINE: sora
SUBJECT: Motion piece over a real academic paper page, treated rather than
         restyled: the document renders at high contrast on the near-black
         canvas with violet highlight sweeps as the only intervention. Middle
         section is a data field of 222 uniform marks with seven enlarged into
         city dots. Closing section is flat type.
COMPOSITION: 1080 x 1920, 9:16. Page crops to a single readable column inside
         y = 269 to y = 1248, never the full page at unreadable scale. Mark
         field is 18 columns wide. DOI line set in mono at a size that survives
         screen recording on a phone.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Document surface inverted to near-black with light text, matching the
         canvas rather than sitting on it as a white rectangle. Highlight
         sweeps are 40 percent #7c3aed multiply, hard-edged.
MOOD: Archival and plain. The confidence should come from the document being
         legible, not from the treatment.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, laurel wreaths,
          academic caps, university crests, journal or peer-review badges,
          award ribbons, white paper backgrounds, page-turn animations,
          Zenodo or CERN logos
ASPECT: 9:16
```

---
---

## Sequencing and gates

**Do not run a pillar's carousel and Reel in the same week.** The Reel is TOFU
and does the stopping. The carousel is MOFU and only works on someone who
already believes there is something to measure. Reel first, carousel second, one
pillar per fortnight across the four.

**P1 carries a live gate.** `docs/growth/social-kit/README.md` records that
`ai_results` held zero rows for `grok` and `ai_overview` when the asset kit was
built. IG-C1 and IG-R1 are written to stay inside that: they assert that two
Google surfaces exist and are measured separately, which is true of the code and
of `bg-021.html`, and they attach no rate, no count, and no result to either new
engine. If a later edit adds a number to those two assets, the gate applies again.

**Voice attribution is a licence condition, not a courtesy.** If any Reel uses
the existing voiceover voice, this exact line goes in the description of every
published video carrying it:

```
Voice: LibriTTS (openslr.org/60), CC BY 4.0
```

See `docs/growth/social-kit/README.md` and `assets/audio/ATTRIBUTION.md`.

**Nothing in this file is scheduled, queued, or sent.**
