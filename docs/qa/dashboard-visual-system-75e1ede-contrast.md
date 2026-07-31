# Contrast review of `75e1ede` (dashboard visual system)

Reviewed 2026-07-29. **Verdict on contrast: PASS, both themes.**

`75e1ede` shipped with `NOT YET REVIEWED` in its own commit message: bg-verify
was dispatched against packet 013 and the process exited before returning a
verdict. This closes the contrast half of that gap. It does **not** close spec
section 17's V1 to V4, which are a different scope.

## What was claimed broken, and what it measures now

The 2026-07-26 audit named five defects. All five are closed.

| Boundary | Cue the design uses | Dark | Light | Floor | Audit measured |
|---|---|---|---|---|---|
| Sidebar vs canvas | border | **4.01** | **4.45** | 3.0 | 1.31 |
| Time-filter bar vs canvas | border | **4.01** | **4.45** | 3.0 | 1.39 |
| Active nav state | rail | **6.60** | **4.79** | 3.0 | 1.17 |
| Active nav label | text | **11.51** | **17.85** | 4.5 | 1.24 |
| Idle nav label | text | **12.09** | **6.37** | 4.5 | n/a |

## The thing that makes this look like a failure and is not

Measured on surface delta alone, every boundary still looks broken:

| | Dark | Light |
|---|---|---|
| sidebar vs canvas | 1.06 | 1.11 |
| active chip vs sidebar | 1.56 | 1.19 |
| bar vs canvas | 1.04 | 1.05 |

**That is not the fix that was made, and measuring it is measuring the wrong
thing.** WCAG 1.4.11 asks that the boundary of a component be perceivable, not
that two surfaces differ in luminance. The implementation carries every boundary
on a solid border and every active state on a rail plus label, and each of those
clears its floor in both themes. A reviewer who checks surface pairs will
conclude this shipped broken. It did not.

The active nav state is deliberately carried by a **different cue per theme**
(spec section 4.2): dark uses a violet-tinted chip, light uses a white chip on a
violet rail. Both resolve above 3:1 through the rail.

## An error I made during this review, recorded so it is not repeated

My first pass reported light mode failing at **1.00:1** on the active nav label,
which would have been white text on a white chip. That was wrong. I had grepped
only the `--surface-*` lines out of the `html.light` block and carried the DARK
values of `--text-nav-active`, `--text-nav-idle` and `--rail-active` into a light
calculation. All three ARE overridden in `html.light` (index.css:82-84).

**Lesson: when a theme block overrides a token set, pull the whole block. A
partial override read is worse than not checking, because it manufactures a
critical-looking failure that costs a cycle to disprove.**

## What this review could NOT establish

Everything above is computed from the token definitions in `src/index.css`. It
proves the tokens are correct. **It does not prove the components consume them.**
A token can be right and unused, and the 07-26 audit found exactly that class of
bug: two engine colour maps invisible to the spec's own harness because they key
off Tailwind class names rather than hex.

Closing that needs the running dashboard with an authenticated session, which no
agent has. Until someone runs it, treat this as "the tokens are right", not "the
UI is right".
