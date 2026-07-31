# BrandGEO dashboard, discovery audit, 2026-07-31

Discovery only. Nothing was fixed and no source file was edited. One file was
written: this one. No git command was run.

Scope was the ground nobody has measured: keyboard tab order and focus
management, empty and zero-data states, the 768 and 1024 breakpoints, and a
proper characterisation of the muted-text token ladder. Contrast, dashes,
horizontal overflow at 320/375/1440 and touch targets were treated as closed by
`dashboard-uiux-audit-2026-07-30.md` and were not re-run.

**Headline: the first Tab press on every route shoves the entire application
137px sideways, and below 768px half of the tab order is invisible.** Both are
new. Against that, tab order itself is correct on every route, and two zero-data
defects inherited from the 2026-07-26 audit are refuted: they have been fixed.

---

## How this was measured, and what it cannot cover

Demo mode via `preview_start` name `brandgeo-dashboard-demo`, auth by the
`sessionStorage` flag. No password field was touched. My own tab (`tab-1`).
Theme was restored to `dark` and every injected probe removed at the end;
verified `storedTheme: dark`, `asideLeft: 0`, no residual style node.

**Real key presses do not reach the document in this environment.** I armed a
capturing `keydown` listener, issued a real `Tab`, and recorded **0 events** with
`document.activeElement` still `BODY`. So nothing below is measured under a real
Tab keypress. Where I make a claim about sequential focus order it is computed
from live DOM order plus `getBoundingClientRect` geometry, which is what the
browser's own sequential navigation follows, and it is labelled as such. Claims
about what focus *does* are measured, because `.focus()`, `.click()` and
`document.activeElement` all work.

**Demo mode is permanently a viewer** (`clientContext.tsx:107`). `/usage`,
`/onboard`, the admin client switcher and the real `/social` never rendered. I
make no claim about them.

Every reading asserts the RESOLVED theme (`documentElement.classList`) in the
same evaluation, never the shared `localStorage` key.

### Negative controls: 5 of 5 fire

| Checker | Injected | Result |
|---|---|---|
| Off-screen focusability | `inert` on the closed `<aside>` | 17 to 0 to 17, fires |
| `<main>` overflow | 3000px child **inside `main`** | false to true to false, fires |
| Undersized target | 10x10 button | n to n+1 to n, fires |
| Tab-order inversion, column-aware | visual reorder without DOM change | 0 to 1 to 0, fires |
| Positive-tabindex detection | `tabindex="1"` at end of `main` | 0 to 1 to 0, fires |

Two further method notes, both of which cost a result:

- **My first focusability checker was broken and reported a false pass.** It
  returned 17 to **1** to 17 instead of 17 to 0 to 17. Cause: the previous
  element focused by the prior run stayed `activeElement`, so when the loop
  reached that same element `document.activeElement === el` matched trivially.
  Fixed by blurring to `body` before each attempt. The corrected checker is the
  one used above. A checker that has not been watched go fully red is not
  evidence, and this one nearly slipped through at 94 percent red.
- **My first tab-order checker produced 24 false positives on a clean page.** It
  sorted all focusables top-to-bottom across the whole viewport, which
  interleaves the sidebar column with the main column, so every sidebar nav item
  looked displaced. A two-column shell has column-major reading order. Redone
  per container; the real answer is 0. **The naive result is discarded, not
  reported.**

I also reproduced the documented `<main>` trap directly: with a 3000px child
inside `main`, `main.scrollWidth > clientWidth` went true while
`documentElement` reported `false` throughout. Measuring `documentElement` is
blind here, confirmed rather than assumed.

The throttled-tab transition trap is live in this environment. Reading the open
mobile menu's transform returned the stale closed value `matrix(1,0,0,1,-256,0)`
while the backdrop was already rendered. Killing transitions at matching
specificity and forcing a reflow returned `matrix(1,0,0,1,0,0)`. Any transform
or transition value below was read with the killer in place.

---

## Confirmed defects

### D1, HIGH. The skip link breaks the page layout the moment it is focused

The first Tab stop on every route. Measured at 1440x900 on `/ai-visibility`:

| | Sidebar left | `<main>` width | Skip link `position` | Skip link box |
|---|---|---|---|---|
| Not focused | 0 | 1184 | `fixed` | 32x16 at top `-101` |
| **Focused** | **137** | **1047** | **`static`** | **137x900 at 0,0** |
| After blur | 0 | 1184 | `fixed` | offscreen |

Focusing the skip link shifts the sidebar right by **137px** and shrinks `main`
by **137px**. The link stops being a small pill at the top left and becomes a
137px wide, full-viewport-height column that displaces the entire shell. It
recovers on blur, so the damage is transient, but it happens on the first Tab of
every page.

**Mechanism, read off the live cascade rather than inferred.** Three rules
compete:

| Selector | Specificity | Declares |
|---|---|---|
| `.skip-link` | (0,1,0) | `position: fixed`, `top: -100px` |
| `.skip-link:focus` | (0,2,0) | `top: 0.75rem` only, **no `position`** |
| `.focus\:not-sr-only:focus` | (0,2,0) | `position: static`, `width: auto`, `height: auto` |

Tailwind's `focus:not-sr-only` at (0,2,0) beats `.skip-link` at (0,1,0) for
`position`, so on focus the element leaves the fixed layer and becomes a flex
item of the root `flex h-screen` container. `.skip-link:focus` never restates
`position`, so nothing defends it.

The link still *works*: activation moves focus to `<main id="main-content">`,
verified. It is the presentation that is broken.

> **FIXED 2026-07-31 in `index.css` only; `Layout.tsx` was not touched.**
> `.skip-link:focus` now restates `position: fixed !important` (plus `width`
> and `height: auto`). `!important` rather than source order, because Tailwind's
> utility ordering is a build concern and this must not silently regress.
>
> **How it was verified, and why the obvious test was worthless.** Focusing the
> link and re-reading the geometry returned byte-identical before and focused
> snapshots, which looks like a pass and is not one: `document.hasFocus()` is
> `false` in this hidden browser pane, so `link.matches(':focus')` is `false`
> even while `document.activeElement === link`. Neither `.skip-link:focus` NOR
> Tailwind's `.focus\:not-sr-only:focus` ever applied, so the test compared two
> unfocused states and proved nothing. Recorded because it would pass review.
>
> Proven at the cascade level instead. CSSOM reports `.skip-link:focus` with
> `position: fixed` at priority `important`, and `.focus\:not-sr-only:focus`
> with `position: static` at no priority. A clone probe carrying both rule sets
> computes `static` with Tailwind's declarations alone and `fixed` once the
> important one is added. `!important` beats non-important regardless of
> specificity, so the outcome does not depend on order.
>
> **Still unverified at runtime:** that the link becomes visible at `top:
> 0.75rem` on a real Tab press. That needs a browser pane that composites
> frames and holds document focus, which this environment does not provide.

- Class list: `brandgeo-dashboard/src/components/Layout.tsx:266`
- Rules: `brandgeo-dashboard/src/index.css:633-642`
- Runtime-measured.
- Owner: `bg-app` for the class list, coordinator for `index.css`. The narrower
  fix is a `position: fixed` on `.skip-link:focus`; the cleaner one is dropping
  `sr-only focus:not-sr-only` and letting `.skip-link` own both states. Both
  touch the off-limits file, so this is a report, not a patch.

### D2, HIGH. Below 768px the closed sidebar keeps all 17 of its controls in the tab order

At 375x812 with the mobile menu closed, the `<aside>` is at `left: -256`, fully
off-canvas, but carries `visibility: visible`, **no `aria-hidden`, no `inert`**.
Focusability was proven by attempting `.focus()` on each control and reading
back `document.activeElement`, not by trusting a selector.

| Measure | 375 | 767 | 768 | 1024 |
|---|---|---|---|---|
| Sidebar left | -256 | -256 | 0 | 0 |
| Focusable and off-screen | **17** | **17** | 0 | 0 |
| Total reachable in document | 35 | varies | 51 | 21 to 85 |

At 375 on `/competitors`, **17 of 35 tab stops, 49 percent, are invisible**,
while `<main>` holds only 4. A keyboard user tabs through the entire hidden
navigation before reaching any content. The 17 count is identical on all 11
routes at both 375 and 767, so it is structural, not page-specific.

Screen-reader impact compounds it: with the off-canvas nav still exposed, 7 nav
destinations are announced twice (once in the hidden sidebar, once in the mobile
bottom bar) and `/` four times, measured from duplicate `href` counts.

At 768 and above the sidebar is genuinely on screen and the count is 0, so this
is strictly a sub-768 defect. Note the 10 "off-screen" entries my first pass
showed at 768 were `display: none` mobile-nav links, which are correctly outside
the tab order; the corrected metric excludes them.

- `brandgeo-dashboard/src/components/Layout.tsx:280-285`
- Runtime-measured, negative-controlled 17 to 0 to 17 with `inert`.
- Owner: `bg-app`.

### D3, HIGH. A route change is announced to assistive technology by nothing at all

Three independent mechanisms could tell a screen-reader user the page changed.
All three are absent, measured:

| Mechanism | State |
|---|---|
| Focus moves on navigation | **No.** Focus stays on the activated nav link. |
| `document.title` changes | **No.** `BrandGEO, Dashboard` on every route. 0 writes to `document.title` in `src/`. |
| Live region announces | **No.** 0 elements matching `[aria-live]`, `[role="status"]`, `[role="alert"]` on any route. |

**`grep -rn "\.focus()" src/` returns zero matches across the entire tree.** The
app never moves focus anywhere, for any reason. That single fact is the root of
D3, D4 and half of D1's severity.

The machinery is already in place and unused: `<main id="main-content"
tabIndex={-1}>` at `Layout.tsx:784` is exactly the programmatic focus target
this needs, and `Layout.tsx:252-253` already runs an effect on `pathname` change
that scrolls `mainRef` but never focuses it. One line in an effect that already
exists.

What is correct: `aria-current="page"` is set on the active nav link, there is
exactly one `<h1>` per route, and it names the page. Those help a user who goes
looking. Nothing tells them to look.

- `brandgeo-dashboard/src/components/Layout.tsx:252-253` and `:784`
- `brandgeo-dashboard/index.html:18` for the static title.
- Runtime-measured.
- Owner: `bg-app`.

### D4, MEDIUM. Focus is never returned to the trigger, and one path strands it off-screen

Direct consequence of the zero `.focus()` calls. Two paths measured:

**Mobile menu, closed by its own X button.** Focus stays on the X button, which
is now at `left: -57`, off-screen inside the closed drawer. It does not return
to the hamburger that opened it. The user's focus is on an invisible control.

**Any sidebar dropdown, closed by Escape.** Opened the language menu
(`aria-expanded` true, 8 options), focused an option, dispatched Escape at
`document` where `Layout.tsx:118` listens. The menu closes correctly
(`aria-expanded` false), but `document.activeElement` becomes **`BODY`**. Tab
position is lost entirely and the next Tab restarts from the top of the
document. This applies to all four dropdowns sharing that handler: clients,
market, languages, internal.

Related, and worth a decision rather than a fix: **the open mobile menu is not
modal.** With it open, all 4 of 4 `<main>` controls behind it remained
focusable, and the `<aside>` carries no `role="dialog"` and no `aria-modal`. So
there is no focus trap. Given D2, adding a trap without also making the closed
drawer inert would make things worse, so these two should be fixed together.

- `brandgeo-dashboard/src/components/Layout.tsx:102-124` (Escape handler),
  `:313` (Close menu), `:749` (Open menu).
- Runtime-measured.
- Owner: `bg-app`.

### D5, MEDIUM. `/ai-visibility` overflows `<main>` between 768 and about 810px

Nobody had measured this band. `main` at 768 is only 502px wide because the
sidebar has just appeared at `md:` while the content grid is already 2-up from
`sm:` at 640.

| Viewport | `main` width | `main` overflow |
|---|---|---|
| 767 | 767 | 0 |
| **768** | **502** | **19px** |
| 800 | 534 | 3px |
| 880 | 614 | 0 |
| 1024 | 758 | 0 |

All other 10 routes are clean at 767, 768 and 1024.

**Culprit isolated to exactly 2 elements**, after excluding everything inside an
`overflow-x` ancestor: the `62%` and `45%` dimension values in the AI Visibility
Score breakdown, overflowing by 8px and 9px. The wide prompt table
(`min-w-[640px]`) sits in its own scroller and contributes nothing, as the
earlier audit also found.

Cause is the familiar one: the label block in
`<div className="flex justify-between items-center mb-1">` has no `min-w-0`, so
it cannot shrink below its content and pushes the value past the edge.
**Diagnosis confirmed at runtime and reverted**: applying `min-width: 0` to the
6 label blocks took overflow 19 to 0, removing it returned it to 19.

This is the same `min-w-0` failure the 2026-07-30 session fixed on
`/recommendations`. Second instance, so it is a pattern worth a lint rule rather
than a third one-off.

- `brandgeo-dashboard/src/pages/AIVisibility.tsx:899-908`
- Runtime-measured.
- Owner: `bg-app`.

### D6, MEDIUM. The global time filter is inert on 8 of the 10 routes that display it

`Layout.tsx:769-782` renders the 7 days / 30 days / 90 days / All time bar on
every route except `/account`. Only **three files in the whole app import
`useTimeFilter`**: `BrandSentiment.tsx`, `Dashboard.tsx`, `Usage.tsx` (plus
`Layout.tsx`, which renders the control).

So on `/ai-visibility`, `/mentions`, `/competitors`, `/recommendations`,
`/prompts`, `/social`, `/seo` and `/tickets`, **8 routes**, no code path exists
that could respond to the control. That is source-proven, not inferred from
demo behaviour.

Runtime cross-check: toggling All time against 7 days produced byte-identical
`main.innerText` on 10 of 10 routes that show the bar.

**Read that runtime number carefully.** For `/` and `/sentiment` the identical
result is a demo artefact, not a defect: `BrandSentiment.tsx:182` returns the
mock branch before `getStartDate()` at `:215` is ever reached, so the filter is
correctly wired in production and merely bypassed under demo. Those two routes
are fine. The 8 that never import the hook are the finding.

This is the 2026-07-08 task #72 finding, still live, now with a count.

- `brandgeo-dashboard/src/components/Layout.tsx:769-782`
- Source-proven; runtime cross-check reported with the caveat above.
- Owner: product decision first (wire it up, or scope the bar to the routes that
  honour it), then `bg-app`.

### D7, MEDIUM. `text-slate-700` is unremapped in both themes and is invisible in dark

`index.css` remaps `.text-slate-500` and `.text-slate-600` for dark and
overrides 300 through 600 for light. **`.text-slate-700` has no colour override
anywhere.** Only `bg-slate-700` and `border-slate-700` have light overrides
(`index.css:511-517`).

Probed directly by injecting a `.text-slate-700` span and reading it in both
themes: `rgb(51,65,85)` in dark **and** light, identical.

| Surface | Ratio | Floor |
|---|---|---|
| `--dark-800` card, dark | **1.41:1** | 4.5 |
| `--dark-900` page, dark | **1.72:1** | 4.5 |
| `--dark-700`, light | 8.60:1 | pass |

> **CORRECTION 2026-07-31: the two dark rows above are transposed, and 1.41 is
> unexplained.** Disputed by the agent that fixed this, and adjudicated
> independently by the coordinator against WCAG relative luminance. For
> `rgb(51,65,85)`:
>
> | Surface | Correct ratio |
> |---|---|
> | `--dark-800` card `rgb(15,23,42)` | **1.72:1** |
> | `--dark-900` page `rgb(10,15,30)` | **1.84:1** |
> | `--dark-700` light `rgb(234,233,242)` | 8.60:1, as reported |
>
> `Competitors.tsx:153` independently records 1.72:1 for `--dark-800`, agreeing.
> The light value matches exactly, so the instrument was sound and only the dark
> rows are wrong. **The finding itself stands unchanged**: the class is far below
> the 4.5 floor in dark on every surface, which is what mattered.

That 1.72:1 is the exact value the 2026-07-30 audit recorded as F5 and closed by
removing the class from `Competitors.tsx`. It survives in four live call sites:

| Location | What it renders |
|---|---|
| `pages/AIVisibility.tsx:1334` | `no answer`, 9px, **real user-facing text** |
| `pages/AIVisibility.tsx:1325` | the same cell's container class |
| `pages/Tickets.tsx:740`, `:742` | `\|` separators |
| `pages/Onboard.tsx:203` | a `ChevronRight` icon, admin-only |

The 2026-07-30 sweep reported 0 dark-mode failures because demo fixtures never
paint any of these branches. This is precisely the "a string that never painted
is not a string that passed" case the brief names.

- Runtime-measured for the colour and ratios; the call sites are source-located
  and **not** runtime-verified, because demo does not render them.
- Owner: `bg-app` for the call sites; the missing remap is coordinator territory.

### D8, MEDIUM, design system. The muted-text ladder is one perceptual step, not three

This is the census requested. All values below pass contrast, so this is not an
accessibility failure. It is a design-system failure: **the class an author
picks does not predict what a user sees.**

**Source census**, `src/**/*.tsx,ts`:

| Class | Occurrences | Files |
|---|---|---|
| `text-slate-400` | 192 | 30 |
| `text-slate-500` | **302** | 27 |
| `text-slate-600` | 101 | 19 |
| `text-slate-700` | 6 | 4 |

**Rendered census**, live DOM across `/`, `/ai-visibility`, `/sentiment`,
`/mentions`, `/competitors`, `/prompts`, `sr-only` excluded, resolved theme
asserted inline:

| Class | Elements | Dark resolves to | Light resolves to |
|---|---|---|---|
| `text-slate-300` | 67 | `rgb(203,213,225)` | `rgb(51,65,85)` |
| `text-slate-400` | 192 | `rgb(148,163,184)` | `rgb(71,85,105)` |
| `text-slate-500` | 162 | `rgb(148,163,184)` | `rgb(85,100,121)` |
| `text-slate-600` | 193 | `rgb(148,163,184)` | `rgb(71,85,105)` |
| `text-slate-700` | 0 | not remapped | not remapped |

In dark, **547 elements across three class names render one single colour**, with
zero exceptions. In light, 400 and 600 collapse onto each other (385 elements)
and 500 is nominally its own value.

**Now the part that matters, and it is worse than "two values in light".**
Judged with CIE76 dE against this project's own floor of 15, which is the
instrument the 2026-07-30 session adopted precisely because luminance ratio
cannot see a hue or a small value change:

| Adjacent pair | Dark dE | Light dE | Perceptible? |
|---|---|---|---|
| 300 vs 400 | **19.19** | 8.60 | dark only |
| 400 vs 500 | 0.00 | 6.19 | neither |
| 500 vs 600 | 0.00 | 6.19 | neither |
| 400 vs 600 | 0.00 | 0.00 | neither |

**Not one adjacent step in the 400/500/600 range clears the floor in either
theme.** In light the ladder has three nominal values that no reader can tell
apart. In dark it has one. The only real distinction in the entire muted range
is `slate-300` against everything below it, and that is real in dark (19.19) and
illusory in light (8.60).

So: **four class names, 614 rendered elements, and at most two perceptual levels
in dark and one in light.**

Contrast for the record, all passing, which is why this has stayed invisible:
dark `rgb(148,163,184)` is 6.96:1 on the page and 5.71:1 on the card; light is
5.00:1 worst case for 500 and 6.29:1 for 400/600 on the binding `--dark-700`
surface.

**Recommendation, not applied.** The problem is that Tailwind's numeric slate
scale is being used as a semantic scale, and the overrides then flatten it. Two
named tokens describe everything actually rendered:

- `--text-muted`, the single muted level: today's `rgb(148,163,184)` dark,
  `rgb(71,85,105)` light.
- `--text-subtle`, one genuinely distinguishable step, which must clear dE 15
  from `--text-muted` **in both themes**, not just dark. Today's light pairing
  fails that at 8.60 and needs re-picking, not re-labelling.

Then delete the `.text-slate-4/5/600` remaps and migrate call sites, and make
`text-slate-700` unusable so D7 cannot recur. Anything that keeps three numeric
names alive will drift back, because nothing stops an author reaching for a
fourth. This needs a `bg-design` spec before any code moves; it is a large
mechanical migration (595 occurrences) behind a small decision.

- `brandgeo-dashboard/src/index.css:151-152` (dark collapse), `:159`, `:178-179`
  (light values).
- Runtime-measured in both themes; source census by grep.
- Owner: `bg-design` for the token shape, then coordinator for `index.css`, then
  `bg-app` for the migration.

### D9, LOW. `/social` is a navigational dead end for every non-admin

`/social` is in the primary sidebar for every plan, with a lock icon. It renders
"AI Social is coming soon" and, measured, **0 interactive elements in `<main>`
and 0 `href` occurrences in `main`'s HTML**. There is no forward action and no
way back except the sidebar.

Compare `/seo`, which is the same shape of gate and offers a "See plans" link.
The asymmetry is the finding, not the copy: the copy ("Nothing to buy today. We
will tell you here as soon as it is ready.") is deliberate and honest, and per
`planConfig.ts:349-355` nobody can buy it, so "See plans" would be wrong. A
"notify me" or a route back to Overview would close it.

Note this text differs from the "Unlocks on the Enterprise plan" the 2026-07-30
audit recorded, so that copy has already been rewritten since.

- `brandgeo-dashboard/src/pages/Social.tsx`
- Runtime-measured.
- Owner: `bg-copy` plus `bg-app`.

### D10, LOW. An em dash ships in the browser tab title on every route

`brandgeo-dashboard/index.html:18`:

```html
<title>BrandGEO — Dashboard</title>
```

A real U+2014, user-visible in the tab, the window title and every bookmark. It
is the only user-visible dash in that file; the three other hits at lines 20, 26
and 38 are HTML comments and correctly out of scope.

The 2026-07-30 census walked `src/` text nodes plus `title`, `aria-label`,
`placeholder` and `alt`. It never read `index.html` and never read
`document.title`, so this was outside its reach rather than missed by it. Worth
adding both to whatever the census becomes.

Confirmed no code overrides it: 0 `document.title` writes in `src/`.

- Runtime-measured (read off `document.title` on two routes) and source-located.
- Owner: `bg-app`.

---

## Checked and found correct, do not re-audit

Each was a candidate finding that measurement closed.

1. **Tab order follows visual order on every route.** Column-aware comparison of
   DOM sequential order against `getBoundingClientRect` geometry, per container:
   **0 inversions** in `aside` (16 controls), `main` (1 to 64) and chrome (4),
   across `/`, `/ai-visibility`, `/sentiment`, `/mentions`, `/competitors`,
   `/recommendations`, `/prompts`. **0 positive `tabindex` values anywhere in the
   app.** Control fires 0 to 1 to 0. This is computed from DOM order, not from a
   real Tab keypress, which is impossible here.
2. **The skip link functions.** It is the first focusable in the document, and
   activating it moves focus to `<main id="main-content">`, confirmed by
   `document.activeElement === main`. `<main tabIndex={-1}>` is present, which is
   the exact fix for the classic skip-link-does-not-move-focus bug. Only its
   presentation is broken, see D1.
3. **`/sentiment` at zero data is NOT a dead end. The 2026-07-26 finding is
   refuted, it has been fixed.** `BrandSentiment.tsx:330-340` renders a
   `SharedEmptyState` titled "Not measured yet" with an action, "Run a
   collection", routing to `/ai-visibility`, and `:297` renders "Not measured"
   instead of the old bare em dash. Source-verified only: demo fixtures always
   supply data, and the demo branch at `:182` returns before any filter could
   empty it, so I could not paint this branch. The claim it is a dead end should
   not be carried forward.
4. **No page renders a verdict it has not earned.** `AIVisibility.tsx:880-893`
   branches on `totalChecked === 0` to a neutral "Not measured yet" pill instead
   of Strong / Developing / Needs Work. Source-verified only, same reason as
   above.
5. **`/recommendations` resolves to a good zero-data state.** Sampled once a
   second for 5 seconds: settles to "Not measured yet. Recommendations are
   generated from AI check results. Run a collection to get your first set."
   with 2 actions, one being "Run a collection" to `/ai-visibility`. It does
   take several seconds to settle, which is the known demo-fixture re-fire
   artefact, not a latency number.
6. **Six pages share one empty-state component** with an action slot:
   `AIVisibility`, `BrandSentiment`, `Competitors`, `Dashboard`, `Mentions`,
   `Recommendations`, plus `Tickets`. Only `/social` renders a terminal state
   with no action, see D9.
7. **1024 is clean.** All 11 routes: no `main` overflow, no reachable off-screen
   focusables, no new undersized targets.
8. **767 is clean for layout.** All 11 routes: no `main` overflow. Its defect is
   D2, which is a focus problem, not a layout one.
9. **Target sizes at 767/768/1024 turned up nothing new.** The only sub-24px
   controls are the two the 2026-07-30 audit already recorded and left
   deliberately: the sidebar `Edit` at 35x17, which carries a pseudo-element
   target extension to 50.6x44.5, and the 11x11 AI Visibility Score info trigger
   on `/ai-visibility`.
10. **`aria-current="page"` is correct**, set on the active nav link in both the
    sidebar and the mobile bar, and there is exactly one `<h1>` per route naming
    the page.
11. **Escape closes all four sidebar dropdowns**, and outside-click dismissal
    works. Only the focus destination afterwards is wrong, see D4.

---

## Ranked

| # | Finding | Severity | Owner |
|---|---|---|---|
| D1 | Skip link shifts the shell 137px on focus | HIGH | `bg-app` + coordinator |
| D2 | 17 focusable off-screen controls below 768px | HIGH | `bg-app` |
| D3 | Route change announced by nothing | HIGH | `bg-app` |
| D4 | Focus never returns to trigger; Escape drops to `body` | MEDIUM | `bg-app` |
| D5 | `/ai-visibility` overflows `main` at 768 to 810 | MEDIUM | `bg-app` |
| D6 | Time filter inert on 8 of 10 routes showing it | MEDIUM | product, then `bg-app` |
| D7 | `text-slate-700` at 1.41:1 in dark, 4 live call sites | MEDIUM | `bg-app` + coordinator |
| D8 | Muted ladder is one perceptual step | MEDIUM | `bg-design` |
| D9 | `/social` dead end, 0 actions | LOW | `bg-copy` + `bg-app` |
| D10 | Em dash in `<title>` | LOW | `bg-app` |

D1, D2, D3 and D4 are one body of work: all four trace to the same root, that
this app has **zero `.focus()` calls**, and three of them are fixed in
`Layout.tsx`. Doing them together is much cheaper than doing them separately,
and D2 and D4 must be done together or the trap makes things worse.

D5 is a 15 minute fix with a proven before and after. D7 is small and should
ride along with whoever next opens `index.css`.

D8 is the only one needing a decision before code, and it is the largest.

## Not covered

Admin surfaces (`/usage`, `/onboard`, the client switcher, the real `/social`),
because demo mode is permanently a viewer. Real tenant data, so density and
overflow under a large account remain untested. Any behaviour requiring a real
key press or a composited frame. Chart colour semantics, unchanged and still
open from the standing note.
