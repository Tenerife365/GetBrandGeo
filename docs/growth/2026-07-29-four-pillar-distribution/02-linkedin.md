# 02. LinkedIn

Four posts, one per pillar. All MOFU. Personal profile voice, first person,
calibrated against `docs/linkedin-posts-2026-07-24.md`,
`docs/linkedin-post-bg-018-2026-07-22.md`,
`docs/linkedin-teaser-posts-published-paper-2026-07-16.md` and
`docs/linkedin-company-posts-2026-07-15.md`.

Every post opens on a first-person observation, never a statistic, per SKILL.md
§4. Every post carries the free audit as its MOFU CTA, then the research link,
then an italic source line naming the dataset and its date, matching the
published convention.

The **Words** figure on each post is the body only, measured on the exact text
inside the blockquote, excluding the link lines and the italic source line. All four land
inside the 180 to 260 band. Recount after any edit.

Visual briefs for these four posts are at the bottom of this file, numbered
`LI-V1` to `LI-V4`. They are deliberately namespaced away from `V1` to `V4` in
`docs/growth/2026-07-29-grok-sixth-engine/09-visuals.md`, which are different
assets for a different package.

**Nothing in this file is approved for posting.** Drafts for review.

---

## Post 1 (P1). Two engines shipped, two turned down

**Pillar:** P1, retrieval over engine count
**Funnel:** MOFU
**Hook driver:** Contrarian
**Source:** `brandgeo/web/bg-021-retrieval-not-engine-count.html`
**Visual:** LI-V1
**Words:** 245

New angle check: the existing P1 package at
`docs/growth/2026-07-29-grok-sixth-engine/` runs on the retired engine and the
engine-count argument. This one does not repeat that. It runs on the Google
split and on the empty result, which that package only touches in passing.

> I spent part of last week arguing with my own team about whether an empty
> result counts as data.
>
> The argument came out of a decision we shipped on 29 July. We added Google AI
> Overviews to BrandGEO as its own engine, sitting beside Google AI Mode, which
> we have monitored since 16 July. Two entries. Two separate columns. One
> company.
>
> That distinction gets collapsed constantly and it is not academic. AI Mode is
> a tab. A searcher has to switch to it on purpose. AI Overviews is the summary
> block above the links on an ordinary results page, and nobody opts into that
> one. Far more people see it. The two surfaces disagree often enough that
> averaging them into a single "Google" score buries the one your customers are
> actually looking at.
>
> Here is where the argument started. Sometimes Google renders no AI summary at
> all. The easy call is to log that as a failed collection and move on.
>
> We record it as a result instead. If your buyers' questions do not trigger an
> AI summary above the links, that is a finding, and usually a more useful one
> than your position inside a summary that did appear. It means the category is
> still being answered by ordinary links. That is a completely different problem
> to solve than being named fourth in a summary.
>
> The free audit on getbrandgeo.com runs both Google surfaces separately, so you
> can see which one you exist in.
>
> Full write-up: https://getbrandgeo.com/bg-021-retrieval-not-engine-count.html
>
> *Source: BrandGEO engine coverage standard and the two engines added on 29
> July 2026, published as BG-021.*

**First comment, 20 minutes after:**
> The four questions worth asking any vendor in this category are at the bottom
> of that page. The one that produces the longest pause is the second one: when
> you say you monitor Google, which Google.

---

## Post 2 (P2). Cross-engine consensus

**Pillar:** P2, when independently queried engines agree
**Funnel:** MOFU
**Hook driver:** Curiosity gap
**Source:** `brandgeo/web/bg-016.html`, plus the 27 published city studies
**Visual:** LI-V2
**Words:** 259

> We fed the same twenty commercial buyer questions to five AI engines across
> four cities, then read every answer by hand.
>
> Ten of the twenty categories converged. Three or more engines, queried
> separately with no knowledge of each other, named the same brand. The other
> ten produced no agreement at all. Not weak agreement. None.
>
> The cleanest result came from Paris. Asked which online bank to recommend for
> a French small business, every engine that returned a structured answer named
> Qonto first, in French and in English, no exceptions.
>
> Rome was the mirror image. Not one of its categories reached even three
> engines agreeing. Rome had engines that were perfectly consistent with
> themselves and with nobody else.
>
> What decides which side a category lands on is not the city and not the
> language. It is documentation. Categories with a small set of well covered,
> easily compared products converge, because every engine is reading the same
> reviews and comparisons. Categories built on a long tail of individually named
> professionals fragment, because each engine leans on whatever narrow slice it
> retrieved.
>
> One number worth keeping: ChatGPT and Perplexity shared 11% of their cited
> domains for identical queries. Checking one engine and calling it your AI
> visibility is a coin flip you do not know you are taking.
>
> Which side your category sits on changes the entire strategy. A converged
> category means displacing an incumbent who already owns the answer. A
> fragmented one means nobody has won it yet.
>
> The free audit on getbrandgeo.com will tell you which one you are in.
>
> Full research: https://getbrandgeo.com/bg-016.html
>
> *Source: BrandGEO City Research Program, 20 buyer categories across 4 cities
> and 5 AI engines, published as BG-016, 14 July 2026.*

---

## Post 3 (P3). Measurement integrity

**Pillar:** P3, we publish our own false positives
**Funnel:** MOFU
**Hook driver:** Concrete proof
**Source:** `brandgeo/web/bg-018.html`, `brandgeo/web/bg-019.html`
**Visual:** LI-V3
**Words:** 259

New angle check: the already published posts on these two pages
(`docs/linkedin-post-bg-018-2026-07-22.md`, `docs/linkedin-posts-2026-07-24.md`)
tell the story as a list of bugs found. This one tells it as two things we
forbade our own code from doing. No sentence is reused.

> The most useful decision we made this month was about what our own model is
> not allowed to do.
>
> We found five separate false positives in our competitor extraction in six
> weeks. Section headings read as company names. Bolded field labels like
> "Pricing:" read as brands. A medal emoji that landed on a character budget, so
> the same answer scored rank 1 under one heading level and no rank under the
> next.
>
> After the fifth, a sixth rule stopped feeling like the right instinct. So we
> added a small model as a final pass, with two limits that matter more. It can
> only delete names from the list the structural rules already produced, never
> add one. If it times out at eight seconds or returns anything we cannot parse,
> the original list ships unchanged.
>
> So an invented brand name cannot reach a customer's score, whatever the model
> says.
>
> We did the same one layer down, on rank. The scorer used to fall back to
> sentence position: a brand named third scored rank 3. We deleted that fallback
> rather than tightening it. A rank now needs a real numbered list, a bullet list
> with explicit ordering language, or a superlative tied grammatically to the
> brand. Everything else returns null.
>
> 156 assertions, all from real production answers, pass before any of it ships.
>
> If you are evaluating tools in this category, ours included, ask what the
> code is forbidden from doing. It is more revealing than what it can do. The
> free audit on getbrandgeo.com shows how each reading was reached.
>
> BG-018: https://getbrandgeo.com/bg-018.html
> BG-019: https://getbrandgeo.com/bg-019.html
>
> *Source: BrandGEO engineering log, five extraction fixes and the rank
> correction, shipped and regression tested July 2026.*

---

## Post 4 (P4). Peer-archived research

**Pillar:** P4, the published paper
**Funnel:** MOFU
**Hook driver:** Status threat
**Source:** `brandgeo/web/bg-017.html`, DOI 10.5281/zenodo.21395598
**Visual:** LI-V4
**Words:** 244

> When we turned our city dataset into a published paper, I expected the
> methodology to be the hard part. It was not. The hard part is telling a brand
> what the results say about them.
>
> The paper is 222 real production AI responses, from 56 commercial buyer
> prompts, across 7 cities and 4 engines, every one read by hand. It has a
> permanent DOI and a CC BY 4.0 licence, so anyone, including the AI systems it
> is about, can quote and cite it freely.
>
> The New York result is the one brands should sit with. Three long established
> brokerages each reached three-of-four engine agreement for real estate. In the
> same responses, individually named star agents never got agreement above a
> single engine. Same city, same questions, same run. The firms are already the
> default answer. The individuals are not, and no amount of local reputation
> changed that.
>
> Startup incorporation repeated the shape. Two nationally recognised firms beat
> every New York boutique to three-of-four agreement.
>
> We also published what went wrong. 56 rows came back as recorded API errors
> from a quota failure on the account we collected with, so we excluded that
> engine from the analysis rather than report its absence as a finding about it.
> That is stated on page one, not in a footnote.
>
> If your category already has a default answer, the useful question is whether
> it is you. The free audit on getbrandgeo.com answers that for your own domain.
>
> Plain summary: https://getbrandgeo.com/bg-017.html
> Full paper: https://doi.org/10.5281/zenodo.21395598
>
> *Source: Constantin Daniel (2026), Cross-Engine Consensus in AI-Generated
> Brand Recommendations, Zenodo, DOI 10.5281/zenodo.21395598. Collected 9 to 10
> July 2026.*

---

## Visual briefs

Format per SKILL.md §5.2. All 1200x627 for the LinkedIn feed card, which is why
every aspect below is 16:9 rather than the platform's exact ratio; crop to
1200x627 on export. Dark canvas only, no white backgrounds.

### LI-V1, serves Post 1 (P1)

```
ENGINE: flux
SUBJECT: A single search results page rendered as two stacked strata. The upper
         stratum is a solid summary block, lit and dense. The lower stratum is a
         column of ordinary link rows, dimmer. A third state sits to the right:
         the same page with the upper stratum absent, an empty band where the
         summary would be, outlined rather than filled.
COMPOSITION: Three vertical panels, equal width, left to right. Panel 1 labelled
         plate reading "AI MODE". Panel 2 "AI OVERVIEWS". Panel 3 "NO OVERVIEW".
         Thin violet rule separating panels. Wide margins, no clutter.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Single soft top-left key, strong falloff into the base. The empty band
         in panel 3 is the only element with an outline and no fill.
MOOD: Clinical, evidential, restrained. A measurement instrument, not an ad.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, Google branding,
          real logos, magnifying glass icons
ASPECT: 16:9
```

### LI-V2, serves Post 2 (P2)

```
ENGINE: flux
SUBJECT: Twenty short horizontal tracks stacked vertically. In ten of them, five
         small nodes converge into one bright point at the right edge. In the
         other ten, the five nodes scatter and never meet. No text on the tracks
         themselves.
COMPOSITION: Full-bleed grid of the twenty tracks, converged ten on top, scattered
         ten below, separated by a single hairline. Small numeral "10" set left of
         each group. Generous negative space at the base of the frame.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: The convergence points are the only bright sources. Scattered nodes sit
         at low luminance so the split reads instantly at thumbnail size.
MOOD: Data-first, quiet, legible on a phone at scroll speed.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, world maps, city
          skylines, national flags
ASPECT: 16:9
```

### LI-V3, serves Post 3 (P3)

```
ENGINE: flux
SUBJECT: A vertical funnel of candidate name-plates. At the top, a wide row of
         plates. Below, fewer. At the bottom, fewer still. Every removed plate
         fades out sideways and away from the funnel. Nothing enters the funnel
         from the sides. One plate at the bottom is replaced by an empty slot
         rather than a value.
COMPOSITION: Centred vertical flow, top to bottom, three narrowing tiers. Removal
         arrows point outward only, never inward. The empty slot at the base is
         framed by a dashed violet outline.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Cool rim light along the funnel edges. Removed plates dim as they exit.
         The empty slot is unlit and deliberately reads as absence, not error.
MOOD: Engineering diagram, disciplined, slightly austere.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, red warning
          triangles, bug or insect iconography, trash can icons
ASPECT: 16:9
```

### LI-V4, serves Post 4 (P4)

```
ENGINE: flux
SUBJECT: A paper record shown as a stack of thin horizontal strata, 222 fine
         lines total, with a small band of them tinted and pulled slightly out of
         the stack to represent the excluded rows. A permanent identifier plate
         sits beneath the stack.
COMPOSITION: Stack occupies the left two thirds, identifier plate lower right
         reading "DOI 10.5281/zenodo.21395598". Excluded band offset by a few
         pixels so the exclusion is visible without being dramatised.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Raking side light so the individual strata separate. The excluded band
         is desaturated rather than highlighted.
MOOD: Archival, permanent, plainly factual.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, academic clip art,
          graduation caps, quill pens, university crests
ASPECT: 16:9
```

---

## Posting notes

- One post every second day, in pillar order P1 to P4. P1 first because it is
  the only one tied to something that shipped today.
- LinkedIn suppresses reach on outbound links in the post body. For P1 and P4,
  move the link line into the first comment and leave the CTA sentence in the
  body. P2 and P3 carry two links each and are the weaker candidates for that
  treatment, so run them as written and accept the reach cost, or split each into
  a body CTA plus a first comment carrying both links.
- No hashtags. None of the four published reference files use them.
- Company page variants are not in this file. If they are wanted, they need
  distinct copy, never a reshare, per the convention recorded in the reference
  files.
- **Hold everything here until a human releases the batch. Nothing in this run
  is cleared for publication.**
