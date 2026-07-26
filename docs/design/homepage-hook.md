# homepage-hook.md

Owner: `bg-design` · Packet: `.claude/handoffs/002-bg-strategy-to-bg-design.md`
Date: 2026-07-26 · Surface: `getbrandgeo.com/index.html` (the marketing homepage only)

Binding upstream: `docs/strategy/hook-thesis-web.md`. Its §1 through §6 are
constraints on hierarchy and order, not suggestions. This file decides how it
looks. `bg-copy` decides the words. Where this spec needs words it writes an
intent placeholder in brackets.

Binding prior ruling: `docs/DESIGN-SYSTEM.md`. No token is added by this spec.
The marketing site's palette is the CSS custom property block at
`brandgeo/web/index.html:98` to `:131`, which was already unified with the
dashboard violet in commit `6c7deff` (`--ac` is `#8b5cf6`, dashboard
`brand-500`; `--ac-strong` is `#7c3aed`, dashboard `brand-600`).

---

## 0. How the current page was measured

Every number in §2 and §9 came from the shipped page rendered in a browser at
the two widths the thesis §4 test names, not from reading CSS. Method: load
`brandgeo/web/index.html`, set the viewport, read `getBoundingClientRect()` plus
computed `font-size` for every text leaf inside `.hero`, and compare each `top`
against the fold line (800 at desktop, 812 at mobile).

Contrast ratios in §9 were computed from the token hex values in
`index.html:98` to `:131` using the WCAG relative luminance formula, including
the alpha blend for `--t2` and `--t3` against `--bg`. They are stated so
`bg-verify` can check them rather than trust them.

---

## 1. The one thing

**A visitor must see, first and largest, that a specific brand is being scored
on whether AI assistants recommend it, and that the field directly under that
claim will score theirs right now.**

Everything else above the fold yields to the headline, the domain field, and one
piece of evidence that a score exists. There is no fourth thing.

---

## 2. The three-second test, run against the page as shipped

The test is `hook-thesis-web.md` §4, unchanged. Its three scoring parts are
referenced throughout this spec as:

- **P1**: something is being measured about the visitor's own brand.
- **P2**: the thing doing the recommending is an AI assistant or chatbot.
- **P3**: the next step is to check or test their own brand or domain.

§4 excludes text rendered below 14px from the pass criteria. That exclusion is
what the current page fails on, and it is measurable without recruiting anyone.

### 2.1 Result at 1280x800

53 text leaves render above the fold inside `.hero`. 44 of them are below 14px
and are therefore excluded from scoring. Of the 9 that qualify, 6 are bare
numerals whose labels are excluded:

| Qualifying leaf | Size | Carries |
|---|---|---|
| `AI recommends.` (part of the h1) | 67.2px | P2 |
| The supporting paragraph, `index.html:1347` | 16.8px | P1, P2, P3, but as a second read |
| `Check My AI Visibility` button label | 14.08px | P3 |
| `64` in the score ring, `index.html:1392` | 21.6px | nothing on its own |
| `#2` `#1` `#4` and two dashes, `index.html:1417` to `:1421` | 17.6px | nothing on their own |

The score ring's label, `AI Visibility Score` (`index.html:1397`), renders at
11.2px. The engine names next to those ranks (`ChatGPT`, `Gemini`, `Claude`)
render at 10.4px. So the two elements that would carry P1 and P2 from the
evidence card are both excluded, and what survives is a context-free `64` and
five context-free rankings.

**Verdict at 1280x800: fails.** P1 is carried only by the h1's implicature and
by a paragraph that is a second read. P3 is carried by one 14.08px button label,
which is 0.08px above the exclusion threshold.

### 2.2 Result at 375x812

Measured stack, page coordinates, fold at 812:

| Element | Top | Bottom | Size |
|---|---|---|---|
| `nav` | 0 | 68 | |
| `.hero-badge` | 108 | 140 | 11.52px, excluded |
| `.hero-copy h1` (3 lines) | 162 | 304 | 45.6px |
| `.hero-copy p` (4 lines) | 324 | 438 | 16.8px |
| `.search-wrap` | 466 | 522 | button 14.08px, 43px tall |
| `.hero-trust` (2 lines) | 568 | 620 | 13.6px, excluded |
| `.preview-score-box` | 710 | 805 | numeral 21.6px, label 11.2px, excluded |
| `.preview-dims-box` | 818 | 948 | below the fold |

**Verdict at 375x812: fails, and for a second reason.** The h1 hits its clamp
floor of 2.85rem (45.6px, `index.html:338`) and takes three lines and 142px. The
paragraph takes four lines and 114px. Those two elements consume 256px of the
744px available below the nav, which pushes the only evidence of a score to
y=710 and leaves it 102px of visible height with its label excluded at 11.2px.

**Hard-fail check** (§4: a reviewer naming social posting, SEO auditing, or
reputation monitoring as the primary subject). Not triggered today, because AI
SEO and AI Social do not appear above the fold. They do not appear anywhere on
the page except the Growth PRO pricing card at `index.html:1728`. §5 of this
spec fixes that below the fold without putting them above it.

### 2.3 The pass rule this spec designs against

1. Every above-fold element either carries a named §4 part at 14px or larger, or
   it is support and is explicitly marked as carrying none.
2. Each of P1, P2 and P3 is carried by at least two separate elements, so a
   reviewer who misses one still passes.
3. The above-fold element count is 9 or fewer, per the standing bg-design
   guardrail on competing elements.
4. No number that scores a brand appears without its label at 14px or larger,
   within the same visual group.

---

## 3. Above the fold

### 3.1 Element inventory, with the §4 part each element carries

This table is the acceptance artifact for packet 002 criterion 1. Nine elements,
no more. "Part carried" is what the element must contribute to the §4 score, not
a description.

| # | Element | Parts carried | Min rendered size | Role |
|---|---|---|---|---|
| E1 | Eyebrow badge (`.hero-badge`) | **P2** | 0.875rem (14px) | Sets the category before the headline lands |
| E2 | Headline (`.hero-copy h1`) | **P1, P2** | 2.35rem mobile, 4.2rem desktop | The claim |
| E3 | Subline (`.hero-copy p`) | **P1, P3** | 1.05rem (16.8px) | Second read that repeats all three parts |
| E4 | Domain field and run control (`.search-wrap`) | **P3** | input 1rem, button 0.94rem (15px) | **PRIMARY CTA** |
| E5 | Trust row (`.hero-trust`) | **none** | 0.875rem (14px) | Removes cost from E4. Scores nothing. |
| E6 | Evidence card (`.preview-card`) | **P1, P2** | score numeral 2.75rem, all labels 14px | Shows that a score with engines behind it exists |
| E7 | Nav (`nav`) | **none** | unchanged | Wayfinding. Demoted, see §3.5. |
| E8 | Theme toggle (`.theme-toggle`) | **none** | unchanged | Utility |
| E9 | Assistant launcher (`.bg-asst-launcher`, built at `site.js:966`) | **none** | unchanged | Support. Demoted, see §3.5. |

Redundancy check against §2.3 rule 2: P1 is carried by E2, E3 and E6. P2 by E1,
E2 and E6. P3 by E3 and E4. All three are carried twice or more.

Price check against packet 002 criterion 3: no element above carries a price, a
currency symbol, or a tier name. E5 may carry the words "no credit card", which
`hook-thesis-web.md` §6.2 rules is a condition of entry and not a price.

### 3.2 Exactly one primary CTA

**E4 is the primary CTA.** It is the domain input plus its run control, treated
as one object. Its destination is the audit result rendered in place, per
`hook-thesis-web.md` §3. Nothing else on the page above the pricing section may
use a solid `--ac-strong` fill.

That rule is checkable and it currently fails in three places:

- `.nav-cta` (`index.html:184`) uses `background: var(--ac-strong) !important`,
  the identical fill to `.search-btn` (`index.html:423`). Two identical solid
  violet controls sit above the fold today.
- `.research-band .rb-links a.rb-pri` (`index.html:388`) uses the same fill.
- `.audit-email-btn` (`index.html:510`) uses `var(--ac)`, which is a different
  violet and also fails contrast, see §9.

Rulings: `.nav-cta` becomes an outline control (1px `--bd2` border, `--t` label,
transparent background, `--ac` border on hover). `.rb-pri` becomes the same
outline treatment as its sibling link. `.audit-email-btn` takes the solid
`--ac-strong` fill, and it is allowed to, because it only exists after E4 has
resolved and E4's own button is gone from the layout at that moment. At no
single moment is more than one solid violet fill visible above the fold.

> **Corrected at build, 2026-07-26.** "E4's own button is gone from the layout at
> that moment" was wrong. `setButtonScanning(false)` restores it before the
> result renders, so the built page briefly showed two solid violet fills, which
> the automated check caught. What shipped: when a result renders, E4's button
> takes a `.search-btn.is-secondary` outline treatment and its label becomes
> "check another", because at that moment the email row inside the result is the
> next step and E4 is not. It returns to the solid fill on the next submit.
> Verified in the result state: one solid fill above the fold, the email button.

### 3.3 Layout, 1280

Two columns, the existing `.hero-split` grid at `index.html:355`. Ratio changes
from `1.03fr .97fr` to `1.08fr .92fr`, because E6 loses two of its four groups
in §3.4 and no longer needs the width.

Left column reading order and vertical budget, measured from the nav at 68:

| Element | Height | Gap below |
|---|---|---|
| E1 | 34 | 16 |
| E2, 2 lines at 4.2rem, line-height 1.04 | 140 | 16 |
| E3, 2 lines at 1.05rem, line-height 1.7 | 57 | 20 |
| E4, single row | 60 | 14 |
| E5, single line | 22 | |

Left column total 379px. Right column, E6, is vertically centered against it.

**The fold at 800 must fall inside the hero.** Before this change the engines
strip (`index.html:1452`) rendered at y=675 to y=740, above the fold, where it
duplicated the engine names E6 already shows and added a tenth element. The first
proof block must require a deliberate scroll, which is what makes the proof order
in §5 an order rather than a pile.

> **Amended at build, 2026-07-26.** A fixed bottom padding was tried first and is
> brittle: it has to be re-tuned every time the headline changes length. Shipped
> instead, at 901px and up, is `min-height: calc(100vh - 76px)` on `.hero` with
> `max-height: 900px`, centering its content. The fold now lands on the hero's
> bottom edge at any window height. Measured at 1280x800: hero bottom exactly
> 800, engines strip top 864.

> **Amended at build, 2026-07-26.** E2's desktop clamp maximum is **3.5rem**, not
> 4.2rem. Measured in the 553px column, the shipped headline wrapped to three
> lines at both 4.2rem and 3.9rem. At 3.5rem it is two lines, which is the
> constraint that matters. The clamp is `clamp(2.2rem, 6.4vw, 3.5rem)`.

### 3.4 Layout, 375

Single column, the existing 900px breakpoint at `index.html:367`. The fold is at
812 and the nav takes 68, leaving 744. Reserve 28 at the bottom so the fold never
cuts through a line of text, giving 716 of working height ending at y=784.

| Element | Top | Bottom | Change from shipped |
|---|---|---|---|
| E1 | 108 | 142 | size up from 0.72rem to 0.875rem |
| E2, 2 lines at 2.35rem, line-height 1.06 | 158 | 238 | clamp floor drops from 2.85rem; saves 62px |
| E3, 2 lines at 1.05rem, line-height 1.55 | 252 | 304 | 4 lines to 2; saves 62px |
| E4, stacked | 322 | 424 | input row 48, gap 6, button row 48 |
| E5, up to 2 lines | 438 | 482 | size up from 0.85rem to 0.875rem |
| E6, compact variant | 504 | 784 | 280px of above-fold height |

Two rulings this table encodes:

**E2's clamp floor drops to 2.35rem.** The shipped floor of 2.85rem
(`index.html:338`) was set to fix a flat first screen, and at 1280 it is right.
At 375 it costs a third line and 62px, and it pushes the only evidence of a score
below the fold. The desktop end of the clamp does not change.

**E4 stacks below 560px.** At 375 the current single row leaves roughly 110px of
input next to a 203px button, so the visitor types their domain into a slot too
narrow to read it back. Input full width on row one, button full width on row
two, 6px gap. The button gains 5px of height on the way, which fixes the hit
target failure in §9.

E6's compact variant fits its 280px as: 16 padding, 66 for the score row, 14 gap,
116 for the engine grid at three columns by two rows (the existing 640px rule at
`index.html:1304`), 16 padding, leaving 52px of slack. Let the dimension strip
that follows begin inside that slack so the fold cuts through it. A partially
visible block is the scroll affordance, and it costs nothing.

### 3.5 What is removed from above the fold, and why

| Removed | Where it is now | Reason |
|---|---|---|
| Six dimension bars | `index.html:1402` to `:1412` | 12 leaves at 10.4px and 0.65rem labels. Moves to proof block 2, which `hook-thesis-web.md` §5.2 says must be a step, not a card. |
| Two fix rows | `index.html:1425` to `:1438` | 6 leaves. Moves to proof block 4, step 4a. |
| Live ticker | `index.html:1371` to `:1374` | Claims an event ("ChatGPT mentioned your brand, 2 min ago") that did not happen to this visitor. Cut, not moved. |
| Engines strip above the fold | `index.html:1452` | Stays as proof block 1, pushed below y=800. See §3.3. |
| Assistant launcher pulse | `site.js:974`, `bg-asst-pulse` | An animated control competing with E4 in the first three seconds. The launcher stays, the pulse class is applied only after the hero has left the viewport. |

Removing the dimension bars and the fix rows takes E6 from 493px to roughly
240px at 1280 and removes 18 excluded-size leaves. The space bought goes into
type size inside E6, not into more rows.

### 3.6 E6, the evidence card, respecified

Two groups. Nothing else.

**Group 1, the score.** Numeral at 2.75rem, weight 900, `tabular-nums`, `--t`.
The unit `/100` at 1rem on the same baseline, `--t2`. The label at 0.875rem,
`--t2`, directly under the numeral, never beside it. The existing progress ring
stays at its shipped geometry (`index.html:1380`).

> **Amended at build, 2026-07-26.** As written, this paragraph contradicts
> itself: a 2.75rem numeral does not fit inside the shipped 72px ring, and
> pulling the numeral out of the ring leaves an empty gauge. What shipped: the
> ring grows to 88px (r=34, circumference 213.63, offset 77 for the sample's
> 64), the numeral sits inside it at **2.1rem** with `/100` under it at
> 0.875rem, and the label and trend sit beside the ring at 0.875rem. The rule
> the paragraph existed to enforce still holds, and it is the one to check: no
> number that scores a brand appears without a label at 14px or larger in the
> same group. The same 88px geometry is used by the result renderer in
> `site.js`, so the sample and the real answer are the same object.

**Group 2, the engine split.** Five cells. Engine name at 0.875rem in `--t`, the
state word at 0.875rem, the rank at 1.1rem. Today this is inverted: the rank
renders at 17.6px and the engine name at 10.4px, so the largest thing in the cell
is the number a visitor cannot interpret and the smallest is the word that makes
it mean something.

**The card must be labeled as an example.** It shows 64/100 for no named brand.
A marker at 0.875rem in `--t2`, top right of the card, reading
`[label: this is a sample, not a live customer]`. Words are `bg-copy`'s. Without
it the card reads either as the visitor's own result or as a real customer's, and
neither is true. This is the content-integrity rule at AGENT-OS §7.4 applied to a
UI sample.

**The card is the same component at every width.** Two groups at 375, two groups
at 1280. The extra desktop height goes to padding and type, not to a third group.

---

## 4. Where AI SEO and AI Social live

`hook-thesis-web.md` §5.4 requires the one-stop claim to be made once, below the
fold, as a chain. Today AI SEO and AI Social appear on the homepage exactly once
each, inside the Growth PRO pricing card at `index.html:1728`. Two of the four
pillars are visible only in a price card.

Proof block 4 is one block containing three steps on a single connected track.

| Step | Pillar | Weight | Content |
|---|---|---|---|
| 4a | AI Visibility output | 1.4fr | The prioritised fix list. P0, P1, P2 rows, moved from `index.html:1425` and from the feature card at `index.html:1494`. |
| 4b | AI SEO | 1fr | A gap from 4a becomes a brief. |
| 4c | AI Social | 1fr | The brief from 4b gets published. |

Rules that make this a chain rather than three products:

- One shared card shell for all three steps: `--s` surface, 1px `--bd` border,
  radius `--r`, identical padding. Identical grammar is the one-stop thesis
  rendered visually.
- A 1px connector in `--bd2` running through all three, with the direction
  carried by a single arrow glyph between steps, not by three separate arrows
  inside three separate cards.
- Size encodes subordination. 4a is 1.4fr because it is the pillar the visitor
  just accepted. 4b and 4c are equal and smaller because they are consequences.
- At widths below 900 the track becomes vertical and the connector becomes a
  vertical rule on the left. The order never changes.
- 4b and 4c each carry a plan marker whose source of truth is `FEATURE_MIN_PLAN`
  in `planConfig.ts:181`. The marker names availability. It never carries a price
  or a number.
- No step carries its own CTA. The only action between the hero and the pricing
  section is scrolling.

---

## 5. Below-fold sequence

### 5.1 Target order

Positions 1 through 8 are `hook-thesis-web.md` §5, unchanged. Two blocks on the
shipped page are not named there, and each is placed where it cannot displace a
named one. The placement and the reason are stated so a later reader does not
have to guess whether §5 was violated.

| Pos | Function | Source on the shipped page | Move |
|---|---|---|---|
| 1 | What was measured | engines strip, `index.html:1452` | Stays first. Pushed below y=800, see §3.3. |
| 2 | What the number means | new block, built from the dimension bars at `index.html:1402` and the feature card at `index.html:1487` | New. Competitor tracking (`index.html:1502`) folds in here as a subordinate line, sized below the dimension content. |
| 3 | Presence is not endorsement | sentiment, `index.html:1518` | Moves up, ahead of where the features grid was. Its CTA at `index.html:1530` is removed, see §5.3. |
| 4 | What you do about it, and the other three pillars | new block, see §4 | New. |
| 5 | Why to believe any of it | research band, `index.html:1462` | Moves down from second. |
| 5.5 | The done-for-you path | how it works, `index.html:1562` | Not named in §5. Placed after belief and before price because it describes what a buyer receives. Absorbs the "fully managed" card at `index.html:1509`. |
| 6 | Pricing | `index.html:1616` | Unchanged in position, content and default mode. This spec changes nothing inside it. |
| 7 | Objections | FAQ, `index.html:1869` | Unchanged. |
| 8 | The sales-assisted path | contact, `index.html:1904` | Unchanged. |
| 9 | Latest research and news | `index.html:1803` | Not named in §5. Moves from between pricing and FAQ to last, before the footer, because it is the only block whose links leave the conversion path. |

Resulting top-level DOM order for `bg-web`: hero, engines strip, block 2,
sentiment, block 4, research band, how it works, pricing, FAQ, contact, latest,
footer.

### 5.2 The features grid is dissolved

The six-card grid at `index.html:1477` to `:1513` stops existing as a section.
Every card gets a stated home, so nothing is silently dropped:

| Card | Line | Home |
|---|---|---|
| 5-engine coverage | `:1482` | Position 1, absorbed by the engines strip |
| 100-point visibility score | `:1487` | Position 2, as the block's main content |
| Prioritised fix list | `:1492` | Position 4, step 4a |
| Weekly intelligence report | `:1497` | Cut from the proof stack. `hook-thesis-web.md` §8 forbids stating a refresh cadence as automatic. Cadence stays a plan attribute inside the pricing table. |
| Competitor tracking | `:1502` | Position 2, as a subordinate line |
| Fully managed | `:1507` | Position 5.5 |

A grid of six equal cards gives six things equal weight. The thesis is a chain.
Six equal cards is the visual opposite of a chain, which is why the grid goes
rather than being reordered.

### 5.3 Destinations removed

`hook-thesis-web.md` §0 counts seven competing destinations. This spec removes
two of them and demotes one:

- `See Brand Sentiment live` (`index.html:1530`) is removed. It points at a route
  that `brandgeo-dashboard/src/App.tsx:111` places behind `PrivateRoute`, so a
  logged out visitor is sent to a login screen. Position 3 carries no CTA.
- The two research band links stay, because they are proof, but `.rb-pri` loses
  its solid fill per §3.2, so neither reads as a CTA.
- `.nav-cta` is demoted per §3.2. It keeps its destination.

The pricing buttons and the contact controls are untouched. They sit at positions
6 and 8, after the visitor has been given a reason to look.

### 5.4 Testimonials

The block at `index.html:1587` to `:1613` stays commented out. This spec does not
design it. `hook-thesis-web.md` §5 places no social proof in the order until real
quotes exist.

---

## 6. Token application

Every value below already exists in `index.html:98` to `:131` or in
`docs/DESIGN-SYSTEM.md`. No token is added by this spec.

| Use | Token | Dark | Light |
|---|---|---|---|
| Page background | `--bg` | `#050508` | `#f7f7fc` |
| Card surface, E6 and block 4 shells | `--s` | `#0e0e17` | `#ffffff` |
| Input surface, E4 | `--s2` | `#12121c` | `#f4f4fb` |
| Hairline, card borders and the block 4 connector | `--bd` | white 7% | black 8% |
| Border on interactive rest state | `--bd2` | white 13% | black 14% |
| Primary text, headline, score numeral, engine names | `--t` | `#ffffff` | `#09090f` |
| Secondary text, subline, labels, units, trust row | `--t2` | white 60% | black 58% |
| Primary CTA fill and the email step fill | `--ac-strong` | `#7c3aed` | same |
| Focus ring, hover borders, badge accent | `--ac` | `#8b5cf6` | same |
| Positive trend text only | `--ac2` | `#00d4aa` | same |
| Eyebrow badge trio | `--badge-text`, `--badge-bg`, `--badge-bd` | as declared | as declared |
| Corner radius, cards | `--r` | 12px | same |

**`--t3` is banned for any text above the fold.** It measures 3.05:1 against
`--bg` in dark and 2.32:1 in light, see §9. Everywhere it currently carries
above-fold text (the trust row, every card label, both input placeholders) it is
replaced by `--t2`. `--t3` remains available for non-text hairlines and for
decorative separators.

**Status colours.** The dimension bars and the engine states use the green, amber
and red values written inline at `index.html:1405` to `:1410` (`#34d399`,
`#fb923c`, `#f87171`). Those are raw hex in the markup today, not tokens, and
this spec is not permitted to add a token, so it reuses them exactly and adds
none. Recorded as finding F6 in §12: the marketing site has no status token trio
to match the dashboard's emerald, amber, red pairing documented in
`DESIGN-SYSTEM.md` §1. That is a future amendment, not this packet's work.

---

## 7. Motion

Every entry states its job. Anything without a job is cut. All existing
`prefers-reduced-motion` blocks (`index.html:155`, `:292`, `:307`, `:462`,
`:474`) stay and are extended to cover the new entries.

| Element | Trigger | Property | Duration | Easing | Reduced motion |
|---|---|---|---|---|---|
| Proof blocks 1 to 9 | enters viewport, `.reveal` at `index.html:143` | opacity, translateY 24px | 700ms | `cubic-bezier(.16,.8,.3,1)` | no transition, visible immediately |
| E6 score ring, sample | page load, delayed 900ms | `stroke-dashoffset` | 900ms | same | jumps to final offset |
| E6 score numeral, sample | with the ring | count from 0 | 900ms | linear | final value immediately |
| Block 2 dimension bars | block enters viewport | width | 1100ms | same | final width immediately |
| Block 4 connector | block enters viewport | opacity, scaleX from origin left | 500ms, staggered 120ms per step | same | opacity 1, no scale |
| E4 button | hover | opacity to .9, scale to .98 | 150ms, 100ms | default | opacity only |
| E4 to scanning | submit | skeleton cross-fade | 220ms | same | instant swap |
| Scanning to result | response | cross-fade E6 to the result | 220ms | same | instant swap |
| Assistant launcher pulse | hero leaves viewport | existing `bg-asst-pulse` | unchanged | unchanged | not applied at all |
| Hero canvas graph | page load | existing, `index.html:297` | unchanged | unchanged | unchanged |

Two rulings inside that table.

**The sample score ring is delayed to 900ms.** Its job is to move the eye to the
evidence *after* the claim has landed, not to compete with the headline in the
first second. It currently begins as soon as the reveal observer fires.

**The hero canvas graph keeps its job and its constraint.** It renders the five
engines routing citation pulses into a brand node, which carries P2 without
words, so it is not decorative and it is not cut. It already honours reduced
motion, pauses off-screen, and falls back silently (`index.html:1336`). Its one
new constraint: it must not run during the scanning state, because attention
belongs to the skeleton, and its opacity must never reduce the E2 or E3 contrast
below the §9 floor.

---

## 8. State inventory for the primary CTA

E4 is the only component this spec owns end to end. Nine states. Loading is a
skeleton that matches the final layout, never a spinner that reflows.

| State | Trigger | What the visitor sees |
|---|---|---|
| Idle | load | Input with placeholder in `--t2`, button in `--ac-strong` |
| Focus | keyboard or click | 2px `--ac` ring, 2px offset, on the field wrapper, see §9 |
| Invalid | submit with fewer than 2 characters (`site.js:245`) | Inline message under the field in `--t2` at 0.875rem, field keeps focus. Today the code focuses the input and says nothing. |
| Scanning | request in flight, up to 12s (`site.js:75`) | E6 cross-fades to a skeleton of the result layout: ring outline, headline bar, gap bar. Button disabled, label changes. The button spinner glyph at `index.html:450` is cut, the skeleton replaces it. |
| Result | 200 with a valid shape (`site.js:266`) | The result takes E6's position, at E6's size. Score, domain, top gap, then the email step as the single next control. |
| Rate limited | 4th attempt in 10 minutes (`site.js:249`) | Existing message, restyled to `--t2` at 0.875rem, field re-enabled |
| Email step sending | submit (`site.js:217`) | Button disabled, label changes, no layout shift |
| Email step success | 200 | Result region replaced by the confirmation at `site.js:229` |
| Endpoint unavailable | any non-200, timeout, or malformed response (`site.js:272`) | Skeleton holds, one line of handoff text appears for 600ms, then the redirect at `site.js:87` runs. Never a choice, never a button. |

`locked-by-plan` does not apply on this surface. There is no plan state on the
marketing site.

**Why the result takes E6's position.** The sample card is a preview of the
result's exact layout, so the result replacing it in place is the strongest
possible confirmation that the number is now theirs. Rendering the result under
the field instead, as `index.html:1359` does today, pushes the trust row and E6
down the page at the exact moment the visitor is reading a number, and on mobile
it moves content under the thumb.

---

## 9. Accessibility floor

Non-negotiable. `bg-verify` checks each line.

### 9.1 Contrast, computed from the tokens

| Pair | Dark | Light | Verdict |
|---|---|---|---|
| `--t` on `--bg` | 20.6:1 | 19.6:1 | passes |
| `--t2` on `--bg` | 7.33:1 | 4.82:1 | passes AA for body text |
| `--t3` on `--bg` | **3.05:1** | **2.32:1** | **fails.** Banned for text above the fold, see §6 |
| `#ffffff` on `--ac-strong` | 5.40:1 | 5.40:1 | passes AA |
| `#ffffff` on `--ac` | **4.23:1** | **4.23:1** | **fails AA.** `.audit-email-btn` (`index.html:510`) uses this pair today |
| `--ac2` on `--bg` | 10.66:1 | check in light | passes dark |

Two required changes fall out of that table: `.audit-email-btn` moves from
`--ac` to `--ac-strong`, and every above-fold use of `--t3` for text moves to
`--t2`. The token comment at `index.html:105` already says `--ac-strong` is the
AA-safe fill for white text, so the fix is applying a rule the file already
states.

### 9.2 Focus

One pattern, and it already exists in the file at `index.html:568` for
`.engine-chip`: 2px solid `--ac`, 2px offset. Extend it to the domain input
wrapper, the run button, the email input, the email button, every nav link, the
nav CTA, and the pricing buttons.

The primary CTA currently has no visible focus indicator at all. Its input sets
`outline: none` at `index.html:415` with nothing replacing it. The email input
does the same at `index.html:506` and offers only a border colour change, which
is not sufficient on its own. This is the single worst accessibility defect on
the page, because it is on the one control the whole thesis depends on.

### 9.3 Hit targets

44 by 44 CSS pixels minimum for anything clickable.

- `.search-btn` measures 43px tall at both widths. The §3.4 stacked layout raises
  it to 48. At desktop, padding goes from `12px 20px` to `14px 22px`.
- `.nav-cta` measures roughly 34px tall. Padding goes from `8px 18px` to
  `11px 18px`.
- Engine cells in E6 are display only, not interactive, so they are exempt. If
  they gain the hover tooltip behaviour at `index.html:1449`, they stop being
  exempt.

### 9.4 Heading order

One `h1`, in the hero. Exactly one `h2` per proof block, in DOM order. The
research band currently opens with an `h3` at `index.html:1465` and has no `h2`
above it in its own block, which becomes a skipped level once it moves to
position 5. It takes an `h2`.

### 9.5 Announcement

`#auditStatus` already carries `aria-live="polite"` (`index.html:1358`). The
result region must announce once when it renders, and the scanning skeleton must
not announce on every frame. The sample card and the hero canvas stay
`aria-hidden`, as shipped.

---

## 10. Reference frames

Each names one comparable and the one attribute borrowed. Not a mood board.

- **E2 and E6 together: Linear.** Borrowed: the ratio between the largest and
  smallest type on the screen is wide, and the number of distinct sizes is small.
  Not borrowed: monochrome restraint. The violet stays.
- **E6: Vercel analytics cards.** Borrowed: one number at display size with its
  unit attached, and every supporting label at the same body size as each other.
- **Block 4: Stripe's stepped product diagrams.** Borrowed: a single connector
  through three steps so they read as one system. This is the whole reason the
  block exists.
- **Position 5, the research band: Mercury.** Borrowed: credibility is presented
  quietly, in a dense low-contrast band, not in a gradient panel with a button.
  The band's current gradient fill (`index.html:381`) is retained but its primary
  button is not, see §3.2.
- **Register overall:** dark surface, luminous violet accent, real product data
  over abstraction. Marketing and dashboard may differ in density. They never
  differ in brand token.

---

## 11. What this spec does not decide

- **Words.** Every headline, label, marker and message above is an intent, not
  copy. `bg-copy` writes them against `hook-thesis-web.md` §1, §2, §7 and §8.
- **The engine lineup.** `hook-thesis-web.md` §8 records that the page names Meta
  AI in five places while `planConfig.ts:39` records it as retired on 2026-07-16
  and replaced by Google AI Mode. E6 shows five engine cells. This spec does not
  decide which five. It requires that E6 shows exactly the engines the product
  collects and that the count in E5 matches E6. The correction is `bg-web`'s.
- **Whether the audit endpoint is live.** `hook-thesis-web.md` §3 leaves this with
  `bg-verify`. The state inventory in §8 covers both outcomes, so the design does
  not block on the answer.
- **Anything inside the pricing section.** Position, default mode and content are
  as shipped.

---

## 12. Findings recorded while measuring

Each is a real defect found in the shipped page. F1 through F5 are fixed by this
spec. F6 and F7 are not, and are recorded for their owners.

| ID | Finding | Evidence | Owner |
|---|---|---|---|
| F1 | The primary CTA has no visible focus indicator | `index.html:415` sets `outline: none` with no replacement | fixed here, §9.2 |
| F2 | White on `--ac` fails AA at 4.23:1 and is used on the email step button | `index.html:510` | fixed here, §9.1 |
| F3 | `--t3` text fails AA at 3.05:1 dark and 2.32:1 light, and carries the trust row and every card label | `index.html:109`, `:362`, `:750` | fixed here, §6 |
| F4 | Two identical solid violet CTAs sit above the fold | `index.html:184` and `:423` | fixed here, §3.2 |
| F5 | Primary and nav CTAs are below the 44px hit target at 43px and roughly 34px | measured | fixed here, §9.3 |
| F6 | The marketing site has no status colour tokens. Green, amber and red are raw hex repeated inline | `index.html:1405` to `:1410` | future `DESIGN-SYSTEM.md` amendment, still open |
| F7 | The page promises a result in 48h in the trust row and an instant audit in the same element group | `index.html:1363`, `:1564`, against `hook-thesis-web.md` §8 | closed at build: 48h removed from the trust row, kept in the done-for-you block at position 5.5 where it belongs |
| F8 | Theme toggle 34px, nav links 23px, logo 32px, research band links 42px, all below the 44px hit target | measured at build | closed at build |
| F9 | The page named Meta AI as a monitored engine in 8 places, including three JSON-LD blocks, while `planConfig.ts:39` records it retired on 2026-07-16 and replaced by Google AI Mode | `index.html:36`, `:69`, `:79`, `:1347`, `:1421`, `:1458`, `:1485`, `:1575`, `:1875`, `:1879` | closed at build, see §14 |

---

## 13. Handoff packets

`bg-design` cannot write into `.claude/handoffs/`. These are drafted here for
`bg-orchestrator` to materialise as packets 003 and 004. 003 runs first, because
004 cannot build a hero without words.

### 13.1 Draft packet 003, to `bg-copy`

```
scope_write: docs/copy/homepage-hook.md
scope_read:  docs/design/homepage-hook.md, docs/strategy/hook-thesis-web.md,
             brandgeo/web/index.html
```

Write E1, E2, E3, E5, the E6 sample marker, the block 4 step labels, the block 2
and block 3 headings, and all nine E4 state messages from §8.

Hard constraints from this spec: E2 fits two lines at 375 (30 characters per line
maximum) and two lines at 1280, and carries P1 and P2. E3 fits two lines at 375
(roughly 90 characters total) and carries P1 and P3. E5 is at most three items and
carries none of the three parts. No price, no currency symbol and no tier name in
E1 through E6. `hook-thesis-web.md` §8 is the exclusion list, and it rules out
"results in 48h" anywhere above the fold.

### 13.2 Draft packet 004, to `bg-web`

```
scope_write: brandgeo/web/index.html, brandgeo/web/site.js
scope_read:  docs/design/homepage-hook.md, docs/copy/homepage-hook.md,
             docs/strategy/hook-thesis-web.md
```

Two files. Nothing else. Suggested order, because §5's re-sequence touches the
same regions as §3's hero work: F1 through F5 first, since they are local and
independently verifiable, then the hero, then the re-sequence, then block 2 and
block 4.

Acceptance criteria that `/verify` can check with evidence:

- [ ] At 1280x800 and at 375x812, every text leaf above the fold either renders
      at 14px or larger, or appears in the §3.1 table marked as carrying no part.
- [ ] Above-fold element count is 9 or fewer at both widths.
- [ ] Exactly one solid `--ac-strong` fill is visible above the fold at any single
      moment.
- [ ] No price, currency symbol or tier name renders above the fold at either
      width.
- [ ] The engines strip begins at y=800 or lower at 1280x800.
- [ ] Top-level DOM order matches §5.1.
- [ ] AI SEO and AI Social each appear in block 4 with a step label.
- [ ] The features grid section no longer exists and each of its six cards
      appears at the position given in §5.2.
- [ ] `index.html:1530` no longer links to `app.getbrandgeo.com/sentiment`.
- [ ] The testimonials block at `index.html:1587` is still commented out.
- [ ] F1 through F5 are closed, each verified by the check named in §9.
- [ ] Nothing inside the pricing section at `index.html:1616` changed.

---

## 14. Build log, 2026-07-26

Built in the same session as the spec, in `brandgeo/web/index.html` and
`brandgeo/web/site.js`. No other file changed. Nothing was committed, pushed, or
deployed. The amendments in §3.2, §3.3 and §3.6 record where the spec was wrong
and what shipped instead.

### 14.1 Verification, measured in a browser against the built page

Idle state, 1280x800:

| Check | Result |
|---|---|
| Text leaves above the fold | 30, down from 53 |
| Leaves below 14px above the fold | 0, down from 44 |
| Solid `--ac-strong` fills above the fold | 1, the domain field's button |
| Hero bottom edge | y=800, exactly the fold |
| Engines strip top | y=864, below the fold |
| Prices, currency symbols or tier names above the fold | 0 |
| `--t3` carrying text above the fold | none |
| Controls below the 44px hit target | none |
| `h1` count | 1 |
| "Meta AI" anywhere in the document | 0 occurrences |

Idle state, 375x812: 18 leaves above the fold, 0 below 14px, headline 2 lines
(y=168 to 243), subline 2 lines, field stacked with 48px input and 48px button,
score group fully above the fold at y=631 to 748 with its 14px label. The engine
grid starts at y=795 and the fold cuts through it, which is the intended scroll
cue. No horizontal scroll (verified by scrolling, not by `scrollWidth`, which the
preview pane reports in window pixels rather than layout pixels).

Light theme, 1280x800: 30 leaves, 0 below 14px, hero bottom still 800.

Result state (endpoint stubbed locally, no network call): the skeleton renders in
the card's slot at 214px, then the result replaces it with the score, the domain,
the gap line and the email row. One solid fill above the fold, 0 leaves below
14px, E4's button demoted to the outline treatment.

DOM order, read from the built page: hero, engines strip, score, sentiment,
chain, research band, how, pricing, faq, contact, latest, footer. Matches §5.1.

### 14.2 Left undone, deliberately

- **F6**, status colour tokens for the marketing site, is unchanged. Adding one
  is a `DESIGN-SYSTEM.md` amendment and packet 002 forbade it.
- **The pricing section is untouched**, including the "50+ brands audited" line
  at what is now `index.html:1938`. That claim was removed from the hero trust
  row as untraceable, but the copy inside the pricing block was out of scope.
  `bg-verify` should confirm or remove the remaining instance.
- **Other pages still name Meta AI.** Only `index.html` was in scope. The
  comparison pages, city pages and research pages under `brandgeo/web/` were not
  swept and almost certainly carry the same retired engine.
- **The `public-audit` endpoint is still unverified.** The result path was
  exercised against a local stub only. `hook-thesis-web.md` §3 leaves the live
  check with `bg-verify`, and the failure path is built either way.
- **Copy is builder-written, not `bg-copy`-written.** The headline, subline,
  trust row, block headings and state messages were written against the §13.1
  constraints during the build rather than in a separate copy stage. They are
  fit for review, not final.
