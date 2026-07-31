# 03. X threads

Four threads, one per pillar. All TOFU. Every thread leads with its sharpest
number, per SKILL.md section 4. No pricing anywhere in this file, per the funnel
rule in the brief: the CTA is soft and points at checking your own domain.

**Character counts are stated per post and were measured on the exact text
below, newlines included.** The limit assumed is 280, the standard account
limit, so every post here is postable without a subscription. Recount after any
edit.

Visual briefs are at the bottom, numbered `X-V1` to `X-V5`, namespaced away from
the `V1` to `V4` in `docs/growth/2026-07-29-grok-sixth-engine/09-visuals.md`,
which are different assets for a different package.

**Nothing in this file is approved for posting.** Drafts for review.


---

## Thread 1 (P1). The other Google

**Pillar:** P1, retrieval over engine count  
**Funnel:** TOFU  
**Hook driver:** Loss aversion  
**Source:** `brandgeo/web/bg-021-retrieval-not-engine-count.html`  
**Visual:** X-V1 on post 1  
**Posts:** 6

New angle check: the existing P1 package at `docs/growth/2026-07-29-grok-sixth-engine/03-x-thread.md` runs on status threat and on the engine-count argument. This thread runs on the two Google surfaces and on the empty result, and reuses no line from it.

**1/6**  (171 characters)

> Google ships 2 separate AI answer surfaces.
>
> Almost every tool in this category reports 1 number for both.
>
> It is usually the number for the surface fewer people ever see.

**2/6**  (212 characters)

> Google AI Mode is a tab. A searcher has to switch to it on purpose.
>
> Google AI Overviews is the summary block above the links on an ordinary search. Nobody opts into that one.
>
> Different reach. Different answers.

**3/6**  (253 characters)

> They disagree often enough that averaging them into one score hides the surface your customers are actually looking at.
>
> A tool that measures AI Mode and reports it as "Google" is describing the opt-in version of Google and calling it the whole picture.

**4/6**  (247 characters)

> So we split them.
>
> Google AI Overviews went live on 29 July as its own engine, next to AI Mode, which we have run since 16 July.
>
> Seven engines at the top of our ladder now, every one queried with live web search on. That is the entry requirement.

**5/6**  (259 characters)

> The part nobody logs: sometimes Google renders no AI summary at all.
>
> Easy to call that a failed collection. We record it as a result.
>
> No summary above the links for your buyers' questions is a finding. The category is still being answered by ordinary links.

**6/6**  (172 characters)

> Which of the two Google surfaces does your brand actually exist in?
>
> Most dashboards cannot tell you, because they never split them.
>
> Check your own domain: getbrandgeo.com

---

## Thread 2 (P2). Half the categories agreed. Half agreed on nothing

**Pillar:** P2, when independently queried engines agree  
**Funnel:** TOFU  
**Hook driver:** Curiosity gap  
**Source:** `brandgeo/web/bg-016.html`, plus the 27 published city studies  
**Visual:** X-V2 on post 1  
**Posts:** 7

**1/7**  (202 characters)

> We ran the same 20 buyer questions past 5 AI engines in 4 cities.
>
> 10 categories: three or more engines independently named the same brand.
>
> 10 categories: no agreement at all.
>
> The split is not random.

**2/7**  (180 characters)

> The cleanest one was Paris.
>
> Which online bank for a French small business?
>
> Every engine that returned a structured answer named Qonto first. In French. In English. No exceptions.

**3/7**  (210 characters)

> Rome was the opposite.
>
> Zero categories reached even 3 engines agreeing.
>
> Instead: each engine perfectly consistent with itself, and consistent with nobody else. Separate stable worldviews that do not transfer.

**4/7**  (233 characters)

> What decides it is documentation, not the city.
>
> Small set of well reviewed, easily compared products: engines converge, because they are reading the same comparisons.
>
> Long tail of individually named professionals: engines fragment.

**5/7**  (205 characters)

> One number that should end single-engine checks:
>
> ChatGPT and Perplexity shared 11% of their cited domains for identical queries.
>
> You can own one engine's answer and be missing from the next one entirely.

**6/7**  (220 characters)

> Which side you are on changes the whole plan.
>
> Converged: someone already owns the answer and you have to out-document them.
>
> Fragmented: nobody has won it yet. That is the easier door, and it does not stay open forever.

**7/7**  (144 characters)

> 20 categories, 4 cities, 5 engines, every answer read by hand:
> getbrandgeo.com/bg-016.html
>
> Then go find out which side your own category is on.

---

## Thread 3 (P3). What our own code is forbidden from doing

**Pillar:** P3, we publish our own false positives  
**Funnel:** TOFU  
**Hook driver:** Contrarian  
**Source:** `brandgeo/web/bg-018.html`, `brandgeo/web/bg-019.html`  
**Visual:** X-V3 on post 1, X-V5 on post 3  
**Posts:** 7

**1/7**  (134 characters)

> 0.
>
> That is how many brand names the model inside our scoring pipeline is allowed to add to your competitor list.
>
> It can only delete.

**2/7**  (253 characters)

> The limit exists because we found 5 separate false positives in our own extraction in 6 weeks.
>
> Section headings scored as companies. Bolded labels like "Pricing:" scored as brands.
>
> Every fix was correct. Every time, a differently shaped one turned up.

**3/7**  (232 characters)

> The worst one moved a real client's score.
>
> A medal emoji in front of a heading landed exactly on the character budget our rank detector used.
>
> Same answer, same praise. Rank 1 under one heading level. No rank at all under the next.

**4/7**  (237 characters)

> After the fifth, a sixth rule was the wrong instinct.
>
> A small model now runs as a final pass. It can only remove candidates the rules already found, never add one, and it fails open at 8 seconds.
>
> An invented brand cannot reach a score.

**5/7**  (188 characters)

> Same discipline one layer down, on rank.
>
> Our scorer used to fall back to sentence position. Named in the third sentence, scored rank 3.
>
> We deleted that fallback instead of tightening it.

**6/7**  (251 characters)

> A rank now needs one of three things:
>
> a real numbered list, digits trusted only 1 to 50
> a bullet list with explicit ordering language, 25 phrases, any of 17 counter-phrases overriding it
> a superlative tied grammatically to the brand
>
> Otherwise, null.

**7/7**  (211 characters)

> A score that never says "I don't know" is not more precise. It has moved the guessing somewhere you cannot see it.
>
> Ask any vendor what their code is forbidden from doing.
>
> Check your own domain: getbrandgeo.com

---

## Thread 4 (P4). 222 responses, read by hand, published with a DOI

**Pillar:** P4, the published paper  
**Funnel:** TOFU  
**Hook driver:** Concrete proof  
**Source:** `brandgeo/web/bg-017.html`, DOI 10.5281/zenodo.21395598  
**Visual:** X-V4 on post 1  
**Posts:** 6

**1/6**  (192 characters)

> 222 real AI responses. 56 buyer prompts. 7 cities. 4 engines. Every one read by hand.
>
> Published open access with a permanent DOI, so anyone can check it. Including the AI systems it is about.

**2/6**  (252 characters)

> New York, real estate.
>
> Three long established brokerages each reached 3-of-4 engine agreement.
>
> In the same responses, individually named star agents never reached agreement above a single engine.
>
> The firms are the default answer. The people are not.

**3/6**  (208 characters)

> Startup incorporation, same city, same run.
>
> Two nationally recognised firms beat every New York boutique to 3-of-4 agreement.
>
> Being the local specialist did not carry into the answers. Being documented did.

**4/6**  (251 characters)

> Paris, wealth management.
>
> Asked in French: boutique French patrimoine firms.
> Asked in English: major international private banks.
>
> Not the same list reordered. A different set of competitors considered at all, decided by the language of the question.

**5/6**  (248 characters)

> The failure we published instead of hiding:
>
> 56 rows, all ChatGPT, came back as recorded API errors from a quota failure on the account we collected with.
>
> We cut it from the analysis rather than report its silence as a finding. Stated on page one.

**6/6**  (174 characters)

> CC BY 4.0, free for anyone to quote and cite:
> doi.org/10.5281/zenodo.21395598
>
> Plain summary: getbrandgeo.com/bg-017.html
>
> Then run the same kind of check on your own domain.
---

## Visual briefs

Format per SKILL.md section 5.2. All 16:9 for the X card, which crops to roughly
1.91:1 in the timeline, so keep every element inside the middle 80% of the
frame. Dark canvas only, no white backgrounds.

### X-V1, serves Thread 1, post 1

```
ENGINE: flux
SUBJECT: One search results page split into two labelled halves. Left half shows
         a summary block reached through a tab, the tab itself raised and lit.
         Right half shows a summary block sitting directly above a stack of link
         rows, with no tab at all. Same page geometry, two entry points.
COMPOSITION: Vertical split down the centre with a single violet hairline. Small
         plate under the left half reading "OPT IN", under the right half
         reading "ALWAYS THERE". Nothing else in the frame.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: One soft key from upper left. The right-hand summary block is the
         brightest object in the frame, because it is the one being missed.
MOOD: Diagrammatic, cold, evidential.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, Google branding,
          real logos, browser chrome screenshots
ASPECT: 16:9
```

### X-V2, serves Thread 2, post 1

```
ENGINE: flux
SUBJECT: Twenty horizontal tracks. In ten, five nodes converge to a single bright
         terminus. In ten, five nodes scatter and never meet. No labels on the
         tracks.
COMPOSITION: Two stacked blocks of ten tracks, split by one hairline. Numeral 10
         set small to the left of each block. Wide empty margin at the base so the
         image survives timeline cropping.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Convergence termini are the only light sources. Scattered nodes sit low
         in luminance so the split is readable at thumbnail size.
MOOD: Quiet, data-first, legible at scroll speed.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, world maps, city
          skylines, national flags
ASPECT: 16:9
```

### X-V3, serves Thread 3, post 1

```
ENGINE: flux
SUBJECT: A narrowing vertical funnel of blank name-plates. Plates exit sideways
         out of the funnel and dim as they leave. No plate enters from outside.
         A single large numeral 0 sits beside the only inbound arrow, which is
         drawn crossed out.
COMPOSITION: Funnel centred, three narrowing tiers, crossed-out inbound arrow on
         the right at mid height with the 0 beside it. Heavy negative space left
         and right.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Cool rim light on the funnel walls, exiting plates fading to base.
MOOD: Engineering diagram, austere, deliberate.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, red warning
          triangles, bug or insect iconography, trash can icons
ASPECT: 16:9
```

### X-V4, serves Thread 4, post 1

```
ENGINE: flux
SUBJECT: A dense stack of 222 fine horizontal strata, read as a single archived
         record. A narrow band within the stack is desaturated and offset by a
         few pixels, marking the excluded rows. A small identifier plate sits
         below the stack.
COMPOSITION: Stack fills the left two thirds. Identifier plate lower right reading
         "DOI 10.5281/zenodo.21395598". The offset band sits roughly a third of
         the way down, not centred, so it reads as a real gap rather than a
         design flourish.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Raking side light so individual strata separate. The excluded band is
         desaturated rather than highlighted, because it is a disclosure, not a
         feature.
MOOD: Archival, permanent, plainly factual.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, academic clip art,
          graduation caps, quill pens, university crests
ASPECT: 16:9
```

### X-V5, serves Thread 3, post 3

```
ENGINE: flux
SUBJECT: Two identical text blocks side by side, same words, same shape. The left
         one carries a small medal glyph before its heading, the right one does
         not. Under the left block, a filled badge reading "RANK 1". Under the
         right block, an empty dashed badge reading "NULL".
COMPOSITION: Symmetrical two-up. The only visible difference between the panels
         is the glyph and the badge, so the eye finds it and the point lands
         without a caption.
PALETTE: #090A0F base, #7c3aed to #6366f1 accent, violet glow
LIGHTING: Flat, even, deliberately unstyled, so nothing but the difference draws
         attention.
MOOD: Forensic. A before-and-after exhibit, not a promotion.
NEGATIVE: stock-photo people, corporate handshakes, generic AI brain imagery,
          glowing blue circuitry, lens flare, text artifacts, emoji rendered
          large or decoratively, celebration imagery, confetti
ASPECT: 16:9
```

---

## Posting notes

- One thread per week, in pillar order T1 to T4. These four are not a same-day
  batch. Threads compete with each other for the same followers.
- Post 1 carries the whole thread. If it does not stop a stranger, nothing after
  it is read.
- The only outbound links are in the final post of each thread, and in T2 post 7
  and T4 post 6, which are the closers. Nothing earlier carries a link, so reach
  is not suppressed mid-thread.
- No pricing, no plan names, no engine ladder detail beyond T1 post 4, which says
  "the top of our ladder" rather than naming a tier. TOFU rule from the brief.
- T3 post 6 is the closest to the limit at 251 characters and is the one to
  re-measure first if anyone edits wording.
- Deliberately absent: any Grok or Google AI Overviews performance rate. Both
  engines went live on 29 July and the data behind them is a single collection
  day, so a percentage would be arithmetically true and analytically worthless.
  The threads say the engines are live and collecting, and stop there.
- **Hold everything here until a human releases the batch. Nothing in this run
  is cleared for publication.**
