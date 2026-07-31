# BrandGEO dashboard, UI and UX audit, 2026-07-30

Measured in a real browser against the running app, 11 routes, both themes, at
1440x900 and 375x812. Every number below was read off the rendered DOM, not
inferred from source.

**Verdict: dark mode is in good shape and light mode is not shippable.** Light
mode fails WCAG AA on all 11 routes, and 55 of its 56 failures come from a
single colour value. Separately, 131 hover cues do not fire in light mode at
all, including the two that signal a destructive action.

---

## How this was measured, and why you can trust the numbers

The app is behind a login. It has a built-in demo mode (`isDemoMode` in
`src/lib/supabase.ts`) that renders mock data when `VITE_SUPABASE_URL` contains
`placeholder`. Auditing used that: `.env.demo.local` (gitignored) plus a
`brandgeo-dashboard-demo` entry in `.claude/launch.json`. Neither touches the
normal dev server. Demo auth is a `sessionStorage` flag, so no credentials were
entered anywhere.

**The harness was negative-controlled before any result was believed.** Five
defects were injected into a live page, one per check, and each fired:
contrast 1, invisible border 1, undersized target 2, unlabelled control 1,
missing pointer cursor 1. Removing them returned every count to baseline
exactly. A checker nobody has watched go red is not evidence, and this project
has already lost a cycle to one.

Three known traps were handled explicitly:

- **Transitions.** A hidden or throttled tab does not advance CSS transitions,
  so `getComputedStyle` returns the pre-transition value forever. That once
  produced 107 phantom contrast failures here. Transitions are killed at
  matching specificity and a reflow is forced. The headline light-mode failure
  was then re-verified with the killer **removed**, reading the same element
  three times 700ms apart: identical every time, so it is real.
- **Collapsed viewport.** A zero-width viewport reports everything as
  overflowing. `clientWidth` is asserted before any layout number is used.
- **Surface pairs are the wrong measure for a boundary.** WCAG 1.4.11 asks that
  a component boundary be perceivable, which a border or rail satisfies while
  the two surfaces sit at 1.05:1. Borders are measured against what sits either
  side of them, not surface against surface. This is the trap that made the
  2026-07-26 audit report a 1.07:1 sidebar that was never the mechanism.

---

## Findings

### F1, HIGH. Light mode fails AA on every route, and one colour causes 55 of 56

| Route | Failures |
|---|---|
| /ai-visibility | 29 |
| /competitors | 5 |
| /sentiment | 4 |
| /recommendations, /tickets | 3 each |
| /, /mentions, /prompts, /social, /seo, /account | 2 each |
| **Total** | **56** |

Twelve distinct root causes, but **every failure except one is the same colour**,
`rgb(100,116,139)`, on a light surface, landing between **3.95:1 and 4.48:1**
against a 4.5 floor. The single exception is `rgb(77,124,15)` on a pale green
chip at 4.10:1.

Cause is two lines, `src/index.css:138-139`:

```css
html.light .text-slate-500 { color: rgb(100 116 139) !important; }
html.light .text-slate-600 { color: rgb(100 116 139) !important; }
```

Both classes collapse to the same value, so a design distinction that exists in
dark mode disappears in light. The comment on line 139 records that this was
raised from slate-400 because that measured about 2.9:1. **The raise was correct
in direction and stopped just short of the floor, and was never re-measured.**

Worst-hit strings: the rank badges `1` `2` `3` `4` on `/ai-visibility` (22
instances at 3.95:1), the `MARKET` label and `Edit` control in the sidebar on all
11 routes (4.00:1), and the `M` / `Q` trend chips on `/competitors` and
`/sentiment` (3.95:1).

**Fix.** One change closes 55 of 56: give the two classes different, darker
values in light. `rgb(71 85 105)` measures about 6.4:1 on the light canvas.
Note `html.light .text-slate-400` already uses `rgb(71 85 105)`, so give 500 and
600 distinct darker values rather than collapsing a third class onto it.

### F2, HIGH. 131 hover cues are inert in light mode, including both destructive ones

Thirty-two `html.light .text-*` rules carry `!important`. There are 15 Tailwind
hover colour rules and only **one** is marked important. `!important` beats a
non-important hover rule regardless of specificity, so a resting colour with a
light override permanently wins over its own hover state.

Counted on the live DOM, elements carrying both a hover colour class and an
overridden resting class:

| Route | Dead hovers | | Route | Dead hovers |
|---|---|---|---|---|
| /prompts | 51 | | /sentiment | 9 |
| /ai-visibility | 12 | | /, others | 7 to 8 each |
| /competitors | 9 | | **Total** | **131** |

Seven distinct pairs. Two of them are the destructive cue:
`text-slate-400 -> hover:text-red-400` (Sign out) and
`text-slate-500 -> hover:text-red-400` (Delete prompt). **In light mode a
delete control gives no colour feedback on hover at all.**

This is already known in the codebase. `index.css:332-339` documents the exact
mechanism and fixes it for one control, noting "the other ~70 are inert for the
same reason". The live count is 131 instances across 7 pairs. Fixing them is the
deliberate pass that comment defers.

### F3, MEDIUM. Delete is 26x26px, 4px from Edit, and below the touch floor

On `/prompts`, each row carries `Edit prompt` and `Delete prompt` at **26x26px**
with a **4px gap**. The floor is 44x44. The destructive control is undersized,
the same size as its non-destructive neighbour, and close enough to mis-tap.

`/prompts` has 47 undersized controls at 1440px and 59 at 375px. Others: trend
chips at 24.5x20.5 on `/sentiment`, 29x24 on `/competitors`, the theme switch at
36x36, `Close menu` at 34x34, and the sidebar `Edit` at 34.6x16.5.

Not every one of these needs to be 44px on desktop. The row-level destructive
action does, on both.

### F4, MEDIUM. Fifteen em dashes ship inside the product UI

The no-em-dash rule has been enforced hard on marketing content and was never
applied to the app. Two different problems wearing the same character:

**Prose em dashes**, which read as the AI tell the rule exists to prevent:
- `/competitors`: `Your brand — AI mentions`
- `/sentiment`: `How AI engines talk about Your brand — sentiment across 14 responses`
- `/recommendations`: `Generated from 0 successful AI checks — API failures excluded`
  and `Recommendations are generated from AI check results — run a collection`

**Placeholder em dashes** standing in for missing values: 6 on `/account`,
several on `/competitors`. These carry meaning, "no data", so they are not
decorative.

Census: `/competitors` 8, `/account` 6, `/sentiment` 1. Zero en dashes.

### F5, MEDIUM. Dark mode's only contrast failures are those placeholders

Dark mode is clean on 10 of 11 routes, zero failures. `/competitors` has 5, all
the same thing: `text-slate-700` on `rgb(15,23,42)` at **1.72:1** against a 4.5
floor, rendering the em-dash placeholder. A value that means "nothing was
measured here" is information, and at 1.72:1 it is effectively invisible.

### F6, LOW. "AI Social is a Enterprise feature"

Article agreement. The gate page builds the sentence from the plan name without
handling a vowel-initial one.

### F7, LOW, but a product decision. AI Social is in the nav for everyone and reachable by nobody

`/social` renders "Unlocks on the Enterprise plan and above". Reading the source
alongside this: `FEATURE_MIN_PLAN.ai_social` is `enterprise` while the
`social-*.js` functions are `adminOnly`, so no customer on any tier can reach
it. The sidebar advertises it to every plan regardless. `/seo` is gated at
Growth, which is reachable.

> **RESOLVED 2026-07-30, and the framing above was wrong.** I later escalated
> this to "four sources disagree on AI Social's tier". They do not. The owner
> confirmed the intended rule, and `planConfig.ts:349-355` already states it,
> dated 2026-07-29: **AI Social is admin-only while the feature is finished.
> No customer on any plan gets it. An admin may drive it on any account,
> because the owner is testing it on real accounts.** `ai_social: 'enterprise'`
> is a SENTINEL meaning "nobody", not a tier claim, and `Social.tsx:793` and
> `Layout.tsx:149` both already read `!isAdmin && !hasFeature(...)`. Nothing
> about the gate needed a decision. I read a deliberate sentinel as a conflict.
>
> Two real defects survive underneath it, both narrower and one of them worse:
>
> 1. `planConfig.ts:344-347` still reads "AI Social — from Growth (1 channel;
>    3 on Growth PRO)", eleven lines above the line that contradicts it, and
>    `FEATURE_META.ai_social.blurb` pitches "publish to all your social
>    channels" to a customer who can never buy it.
> 2. **The comment claims "the real gate is `requireAuth({ adminOnly: true })`
>    on the three `social-*.js` functions". Four are gated. Seven are not**:
>    `social-accounts`, `social-delete`, `social-image`, `social-link`,
>    `social-publish`, `social-queue`, `social-status`. `social-publish.js`
>    enforces a plan rank rather than an admin check, so it is gated on a
>    ladder position that the product decision says nobody occupies. That is a
>    live server-side authorization gap on a function that posts to real
>    external channels, not a copy problem.

### F8, LOW. /recommendations shows a bare loading string for over 8 seconds

> **CORRECTION, 2026-07-30. The 8 seconds is a demo-fixture artefact and is not
> a production number.** `Recommendations.tsx` has no `isDemoMode` branch, so
> under demo it issues real HTTP against the placeholder host. Measured: 132
> requests to that host, **median 41ms, max 124ms**, so every individual request
> fails fast. The wall clock comes from the page re-firing `load()` as
> `clientContext` keeps re-resolving against the same dead host, each re-fire
> setting `loading` back to true. The missing skeleton was still worth fixing,
> because it is what a slow real query would show, but nobody should quote 8
> seconds as the latency. My audit measured the symptom and inferred a cause it
> had not checked.

It does resolve, to a good empty state: "Not measured yet. Recommendations are
generated from AI check results, run a collection to get your first set." Before
that it shows `Loading recommendations…` as plain text with no skeleton, and
during that window the page has zero interactive elements in `main`.

---

## Checked and found correct, do not re-file

Each of these was a candidate finding that measurement refuted.

1. **Focus indicators are fine.** 2px solid `#a78bfa`, 2px offset, **6.6:1**
   against the surface. My first pass reported 31 of 31 focusables with no
   visible focus, and **that result was an artefact of my own method**:
   `element.focus()` does not satisfy `:focus-visible`, which is what the app
   uses. Confirmed by `matches(':focus-visible')` returning false under
   programmatic focus and true under a real Tab keypress. Discarded.
2. **No horizontal overflow** at 375px or 1440px on any route.
   `scrollWidth === clientWidth` everywhere.
3. **Every interactive control is labelled.** Zero unlabelled links or buttons
   on any route at either width. Icon-only controls all carry `aria-label`.
4. **Cursor and pointer affordances** are correct almost everywhere: 0 to 2
   elements per route lack `cursor:pointer`.
5. **Dark mode contrast** passes on 10 of 11 routes with zero failures across
   59 to 346 text nodes per route.

---

## FIXED 2026-07-30, same session, verified against the running app

F1 and F2 are closed. All four edits are in `brandgeo-dashboard/src/index.css`.
`npm run build` passes, 2799 modules, 7.16s.

| | Before | After |
|---|---|---|
| Light-mode contrast failures, 11 routes | **56** | **0** |
| Dark-mode contrast failures | 5 | 5, unchanged, no regression |
| Dead hover cues in light mode | **131** | **0** |

**What changed**

1. `html.light .text-slate-500` → `rgb(85 100 121)`, 5.00:1 worst surface.
   `html.light .text-slate-600` → `rgb(71 85 105)`, 6.29:1. They no longer
   collapse onto one value, so the muted step survives light mode.
2. `html.light .text-red-400` → `rgb(185 28 28)`, red-700. Was red-600 at
   4.01:1, a failure the route sweep never saw because no red-400 text renders
   under demo fixtures. Fixed because a dead override holding a failing value is
   a landmine for its first real call site.
3. `--sentiment-positive` in light → `rgb(63 98 18)`, lime-800, 5.80:1 on the
   lime tint the "Strong" chip draws it on. Was lime-700 at 4.09:1 and was the
   last text failure standing after edit 1.
4. Light hover overrides for `hover:text-white`, `-slate-200`, `-slate-300`,
   `-red-400` and `-brand-300`. Specificity (0,3,1) against the resting rules'
   (0,2,1), both `!important`, so hover wins.

**Two things the fix work turned up that reading would not have**

- **`hover:text-brand-300` was dead at dE 0.0 even after the specificity fix**,
  because `text-brand-400` and `text-brand-300` already resolve to the same
  `#6d28d9` in light. The hover resolved to the colour it started on. Mapped to
  violet-900, dE 29.5.
- **Luminance ratio cannot judge a hover that changes hue.** Grey to red scores
  1.07 and is obvious to the eye. Legibility was decided on CIE76 dE against the
  resting colour, floor 15. That instrument then flagged
  `slate-400 -> hover:text-slate-300` at dE 8.6, a hover nobody could see, which
  is why three hover levels deliberately collapse to one value in light.

**How the fix was verified.** Not by re-reading the CSS. The contrast sweep was
re-run over all 11 routes in both themes. For hover, a real cursor was
unavailable, so a cascade resolver ranks every matching rule by importance, then
specificity, then source order, and reports the winner. **It was negative-
controlled**: a synthetic element using an emitted hover class with no light
override returns `false`, so the resolver can see a dead hover. The first
attempt at that control returned `null` because it used a class Tailwind never
emitted, which proved nothing and was redone.

Still open from this audit: F3 touch targets, F4 and F5 em dashes, F6 article
bug, F7 the AI Social gate, F8 the loading state.

## Ranked fix list

1. **F1**, two lines in `index.css`. Closes 55 of 56 light-mode failures.
2. **F2**, the deferred hover pass. 131 instances, 7 pairs. Start with the two
   `hover:text-red-400` pairs, since a destructive control with no feedback is
   the one that costs a user data.
3. **F3**, raise the row-level Edit and Delete to 44px and widen the gap.
4. **F4 and F5** together: replace the placeholder em dash with a real empty
   state token at a legible colour, and strip the four prose em dashes.
5. **F6**, one string.
6. **F7**, NOT the product call I described. The gate is correct and
   deliberate. Fix the stale prose and the blurb, and close the seven ungated
   `social-*.js` endpoints, `social-publish` first.
7. **F8**, add a skeleton.

## Consolidated verification, 2026-07-30, after all four fix agents landed

One measurement harness, injected once, run identically across 11 routes x 2
themes x 2 widths. Every checker was negative-controlled in the same session
before any number below was read: contrast (inject `#6b7280` on `#5b6472`,
fails 0 to 1 to 0), touch targets (inject a 10x10 button, 20/2 to 21/3 to 20/2,
**plus a true-negative: an injected 44x44 button is correctly not flagged**),
dash census (0 to 1 to 0), overflow (false to true to false). 5 of 5 fire.

### Closing state

> **SUPERSEDED. The table immediately below was the first-pass result and two of
> its rows were produced by broken checkers.** The authoritative numbers are in
> "Final consolidated pass" at the end of this section. Kept here because the
> corrections underneath it are the useful part.

| Check | 1440 dark | 1440 light | 375 dark | 375 light |
|---|---|---|---|---|
| Text nodes measured | 1309 | 1311 | 1410 | 1410 |
| Contrast failures | **0** | **0** | **0** | **0** |
| Horizontal overflow | none | none | none | none |
| Rendered dashes | 0 | 0 | 0 | 0 |

`npx tsc --noEmit` exit 0. `npm run build` exit 0, 2799 modules, 7.10s.

**F1, F2 CLOSED.** 56 light-mode failures to 0, 131 dead hovers to 0, and dark
mode did not regress: it was 5 failures before (the placeholder em dashes) and
is 0 now that those placeholders are gone.

**F3 CLOSED.** Full-page target census, scrolling each control into view rather
than only measuring above the fold. At 1440: 395 reachable controls. At 375: 317.
Row Edit and Delete are 44x44 at both widths, gap 4px to 20px, and the target
boxes went from a 14px overlap to 2px of clearance.

**F4, F5, F6, F8 CLOSED** in the files the agents owned. `Account.tsx`,
`Recommendations.tsx`, `Competitors.tsx`, `BrandSentiment.tsx` and
`FeatureLocked.tsx` now contain zero user-visible dashes.

**F7 did not need a decision and my framing of it was wrong.** See the resolution
block under the finding. The gate is admin-only by design and already
implemented; what remains is stale prose, a customer-facing blurb for a product
nobody can buy, and seven ungated `social-*.js` endpoints including
`social-publish`.

### Two corrections to this audit, from the verification itself

**1. The "over 8 seconds" in F8 is a demo-fixture artefact and was never a
production number.** `Recommendations.tsx` has no `isDemoMode` branch, so under
demo it issues real HTTP at the placeholder Supabase host: 132 requests, median
**41ms**, max 124ms, all failing fast. The wall clock came from the page
re-firing `load()` as `clientContext` re-resolved against the dead host. The
skeleton was still the right fix, because it is what a genuinely slow real query
would show, but nobody should quote 8 seconds as a latency figure.

**2. The "Horizontal overflow: none" row above is measured on the wrong element
and does not prove what it claims.** My checker read
`documentElement.scrollWidth > clientWidth`. The scroll container in this app is
`<main>`, which carries `overflow-x: auto` — a fact already recorded in
`CLAUDE.md` from an earlier session, which I did not apply. Content overflowing
*inside* `main` never reaches `documentElement`, so the check could only ever
have caught overflow of the page body itself. My negative control injected a
3000px child into `body`, which the checker did catch, so it went red and green
on cue while still being blind to the case that matters. **A negative control
only proves a checker detects the defect you thought to inject.** Overflow must
be re-measured on `<main>` in the final pass; treat that row as unproven, not as
a pass.

**3. My rendered-DOM dash census undercounts, and the "0" row above must be read
with that caveat.** It walks text nodes, so `title` and `aria-label` are never
inspected, and demo fixtures do not render every branch (admin panels, the
locked-engine chip strip, several empty states). A source-level census with
comments stripped is the authoritative check. That census, negative-controlled
5 of 5, finds **74 user-visible dash lines still in `src/`**, none of them in a
file any agent owned:

| File | Lines | Note |
|---|---|---|
| `lib/i18nContext.tsx` | 24 | 3 unique strings x 8 languages |
| `pages/AIVisibility.tsx` | 9 | incl. 4 in `title` / `aria-label` |
| `pages/Onboard.tsx` | 9 | |
| `pages/AuditReport.tsx`, `pages/Social.tsx` | 6 each | |
| `pages/Prompts.tsx` | 6 | 4 are LLM prompt text, not UI copy |
| 9 further files | 1 to 2 each | |

Split by kind: 51 string literals, 16 JSX text, 7 attributes.

**The systemic one is `lib/format.ts:73`, `export const NO_DATA = '—'`.** It has
**no callers**, so it is dead today, but its own docstring reads "so callers
don't each retype the character" — it actively invites the next author to seed
an em dash into the UI. Delete it or change the character.

### Three target-size items nobody owned, reported without overclaiming

- `AIVisibility.tsx`: the AI Visibility Score info trigger is an **11x11
  `<span tabindex="0">` with an `aria-label` but no `role`, and `cursor: auto`**.
  Smallest control in the product at both widths. Whether WCAG 2.2 SC 2.5.8
  strictly applies is arguable, since a hover tooltip is not obviously an
  "action" and the span sits inline beside heading text. The missing `role` and
  the non-interactive cursor are the clearer problems.
- Three trend-range buttons on `/sentiment` and three on `/competitors` are
  32x32. Above SC 2.5.8's 24x24 AA minimum, below the 44px best practice.
- The sidebar theme switch and sign out are 36x36 above 768px, 44x44 below it.
  Deliberate, per Agent A: `matchMedia('(pointer: coarse)')` returns `false` in
  this harness even at 375, so a coarse-pointer rule would have been
  unverifiable, and `index.css` already keys its three existing tap-area blocks
  to `max-width: 767px`. Consequence: a touch tablet at 768px or wider keeps the
  desktop sizes.

### Final consolidated pass, all nine agents landed

Checkers rebuilt with the two defects above fixed: overflow measured on `<main>`,
and `sr-only` text excluded from the contrast census. 11 routes x 2 themes x
**3** widths, 320 added because an agent proved it is where narrow-width defects
actually appear rather than merely approach.

| Width | Theme | Text nodes | Contrast fails | Rendered dashes | `main` overflow | `documentElement` overflow |
|---|---|---|---|---|---|---|
| 1440 | dark | 1302 | **0** | **0** | **0 routes** | 0 |
| 1440 | light | 1302 | **0** | **0** | **0 routes** | 0 |
| 375 | dark | 1406 | **0** | **0** | **0 routes** | 0 |
| 375 | light | 1401 | **0** | **0** | **0 routes** | 0 |
| 320 | dark | 1401 | **0** | **0** | **2 routes** | 0 |
| 320 | light | 1401 | **0** | **0** | **2 routes** | 0 |

The dash census now reads `title`, `aria-label`, `placeholder` and `alt` as well
as text nodes. Negative controls, 3 of 3, re-run against the final build: a real
contrast failure is caught, an injected `sr-only` element is correctly ignored,
an em dash in a text node and an en dash in a `title` are both caught, and a
child injected **inside `main`** is caught while `documentElement` reports
`false` throughout.

`npx tsc --noEmit` exit 0. `npm run build` exit 0, 7.19s.

**The two overflowing routes at 320 are PRE-EXISTING and were not caused by this
work.** Proven by forcing the old gap values back on the running app:
`/prompts` measures 358 either way, unchanged; `/competitors` measures 330 with
the old gap and 338 with the new, so today's change added 8px to a page that
already overflowed. The culprits are the `Add prompt` and `Add manually` header
buttons in flex rows that do not wrap at 320. The wide table cells that also
appear in the scan sit inside their own scroll container and contribute nothing.
Nobody had tested 320 before; the earlier passes used 375 and 1440 only.

**A fourth correction, and the third defect found in my own checkers today.**
The contrast census initially reported a real-looking failure at 1.03:1 on
`/recommendations` in light mode, "Loading recommendations" in `#f1f5f9` on
`#f7f7fb`. It is `sr-only`: clipped to `rect(0,0,0,0)`, 1x1, `margin: -1px`,
never painted. My visibility test rejected anything under 1px, and `1 < 1` is
false, so screen-reader-only text passed straight through it. A contrast ratio
for text that is never painted is meaningless. Fixed by walking the ancestor
chain for the clip-and-shrink pattern, and re-controlled to prove it still
catches a genuine failure.

**A regression this session introduced, found and fixed.**
`/recommendations` overflowed `<main>` at 375 for the entire loading state,
`scrollWidth` 531 against `clientWidth` 375: the new 416px skeleton bar plus the
99px Refresh button in a flex row whose column had no `min-w-0`, so it could not
shrink below its content and the skeleton's own `max-w-full` resolved against an
already-overwide parent. The document itself never overflowed, which is exactly
why the original checker passed it. Fixed with `min-w-0`; re-measured across 54
samples of the loading state at worst `scrollWidth` 375, and confirmed by
reinstating `min-width: auto` to reproduce 531 on demand.

### One false positive I raised and withdrew

`/usage` "Back to Dashboard" first measured as a 1x1 target inside a 242x37 box.
It is a two-line **inline** link: the union rect is meaningless, the real line
boxes are 50x17 and 73x17, and both hit-test true at their own centres. The
union centre simply lands in the whitespace past the end of line two. Inline
links in a text block are exempt from SC 2.5.8 regardless. Not a defect.

## Not audited

Chart colour semantics were not re-examined here; the standing note that one hue
carries three meanings (ChatGPT, Positive, and a categorical series) is unchanged
and is a token-semantics problem rather than a recolour. No page was audited
against real tenant data, only demo fixtures, so density and overflow behaviour
under a large real account is untested. No screenshots were captured: the browser
pane was not displayed, so the page never composited frames.
