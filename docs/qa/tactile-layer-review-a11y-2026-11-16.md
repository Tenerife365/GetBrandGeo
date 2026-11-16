PASS WITH FINDINGS

# Tactile layer, accessibility lens review, 2026-11-16

INTENT: review tactile layer (uncommitted)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify

Reviewer: bg-verify, read-only, accessibility lens only. No browser, no server,
no build was run from this seat. Every ratio below was computed by hand from
the token triplets in `brandgeo-dashboard/src/index.css` (`:root` lines 9 to
130, `html.light` lines 229 to 325) with the WCAG 2.2 relative luminance
formula, in a scratch Node script.

Totals: 0 BLOCKER, 0 MAJOR, 0 MEDIUM, 2 LOW, 9 INFO.

## 1. What was reviewed

`git diff` (working tree against HEAD) of exactly four files:

| File | Change |
|---|---|
| `brandgeo-dashboard/src/index.css` | tactile tokens in both themes (lines 108 to 130, 305 to 325); new unlayered classes lines 1012 to 1137; `.cell-top` shadow; `.glow-bar-track`, `.glow-line`, `.glass-pill`, `.glass-squircle`, `.glass-input` removed |
| `brandgeo-dashboard/src/components/GlowScoreDial.tsx` | `.dial-face` bezel (line 50), 60 tick ring (lines 59 to 81), track token, "%" from ink-3 to ink-2 (line 107) |
| `brandgeo-dashboard/src/pages/AIVisibility.tsx` | keycap classes (1820, 1835, 1847, 1860, 2332), budget frame (2050), dimension channel (2086), LED (2197), engine groove (2247), search field (2582), `seg-well` (2590), phone sort select (2603) |
| `brandgeo-dashboard/src/pages/Dashboard.tsx` | keycap class on Refresh (189) |

Context read: `ui/Button.tsx`, `ui/SegmentedControl.tsx`, `ui/Badge.tsx`,
`AllowanceMeter.tsx`, `PromptResultCell.tsx` usage of `.cell-top`, the global
focus rules at `index.css:432` and `index.css:522` to `539`,
`tailwind.config.js` (`plugins: []`, `neu` colour mapped at line 48),
`package.json` (`tailwindcss ^3.4.4`, so no native cascade layers: the
unlayered tactile rules sit after the utilities and win ties by source order).

Layout.tsx, Account.tsx and clientContext.tsx were excluded as instructed.

## 2. Acceptance table (accessibility checks requested)

Text pairs need 4.5:1 (all are body or meta size). Non-text pairs need 3:1.

| # | Check | Result | Evidence |
|---|---|---|---|
| A1 | White on primary keycap, lightest stop | PASS | `--key-top` dark (131,75,241) 4.95:1, light (124,58,237) 5.70:1 (`index.css:114`, `:307`). At rest the glyph band (25 to 45 percent of the 36 px height) sits at 5.35 to 5.70 dark, 6.43 to 7.10 light. Hover see I1. |
| A2 | ink and ink-2 on secondary keycap | PASS | Dark: ink 14.73 (top) / 15.54 (bottom); ink-2 6.88 / 7.26. Light: ink 19.86 / 17.76; ink-2 7.38 / 6.60. Danger variant (Force Refresh, `AIVisibility.tsx:1835`) text-neg: dark 6.64 / 7.01, light 8.02 / 7.17. |
| A3 | Search field text and placeholder | PASS | ink on `--well-fill`: 16.50 dark, 16.63 light. Placeholder ink-3: 6.00 dark, 5.05 light. Search icon ink-3 same values, above 3:1. |
| A4 | Sort well, inactive and active segment text | PASS | Inactive ink-2 on well: 7.71 dark, 6.18 light. Active ink on pill: 13.66 to 14.73 dark, 19.86 light. |
| A5 | Budget pill text (AllowanceMeter) | PASS | Label ink-3 on well 6.00 / 5.05; value ink-2 7.71 / 6.18; warn 11.99 / 7.26; neg 7.44 / 6.71. Track see I6. |
| A6 | Dial digits and "%" on the face with the aura | PASS | Aura centre = well + accent at 0.16: dark (27,21,52), light (217,206,241). Digits ink 14.38 dark, 13.28 light. "%" ink-2 6.72 dark, 4.93 light (ink-3 would be 5.24 dark, 4.03 light, so the switch at `GlowScoreDial.tsx:107` was needed and is correct). "Not measured yet" ink-2 same 6.72 / 4.93. The aura is strongest at the centre, so these are worst case. |
| A7 | Badge text unchanged | PASS | `Badge.tsx` not in the diff; the badge sits on the same glass card as before. |
| A8 | Search field boundary (1.4.11) | PASS | `--edge` border vs well inside 3.70 dark, 3.06 light; vs surface-2 outside 3.30 dark, 3.34 light (white outside: 3.65). |
| A9 | Keycap borders (1.4.11) | PASS | Secondary `--edge` vs canvas 3.64 dark, 3.42 light; vs surface 3.49 / 3.65. Primary: the filled body identifies the control; see I2 for the lower half. |
| A10 | Selected segment vs well (1.4.11) | PASS, thin margin | Fill vs well only 1.12 dark, 1.19 light; the state is carried by the 1 px `--edge` border, 3.70 dark, 3.06 light, plus `font-semibold` (non-colour cue). See I5. |
| A11 | Focus indication, buttons | PASS | Global `:focus-visible` 2 px `--accent-ink` outline, offset 2 (`index.css:522`), untouched by the tactile classes (none sets `outline`). Outline vs canvas 7.23 dark, 6.65 light. Over the primary keycap glow, worst case accent at 0.45 over canvas: 4.03 dark, 3.29 light; realistic falloff (0.2 to 0.3) 5.15 to 5.95 dark, 4.21 to 4.94 light. Outline paints above box-shadow. |
| A12 | Focus indication, search field | PASS | `.recessed-input:focus` sets `outline: none` (`index.css:1091`, specificity 0,2,0), but `input:focus-visible:focus-visible` (`index.css:534`, specificity 0,2,1) outranks it, so the 2 px accent-ink outline is still drawn: 6.56 vs surface-2 dark, 7.10 vs white light. See L1. |
| A13 | Focus on a segment inside the well | PASS | Outline vs well 7.35 dark, 5.95 light; the well's 3 px padding plus 1 px border leaves room for the 2 px outline at offset 2. |
| A14 | Dimension progress fill vs groove | PASS | Gradient stops vs well: dark 4.48 / 4.73 / 5.06, light 5.26 / 4.77 / 4.51. Role, valuemin/max/now and `aria-label` unchanged (`AIVisibility.tsx:2086` to `2093`). The value is also printed as text. See I7. |
| A15 | Engine groove fill | PASS (decorative) | `aria-hidden="true"` at `AIVisibility.tsx:2247`, the percentage above is the reading. Same gradient values as A14. |
| A16 | LED dot decorative, colour not the only cue | PASS | `aria-hidden="true"` at `AIVisibility.tsx:2197`, no text, not focusable; the Badge beside it carries the word and a `StatusGlyph` for pos/warn/neg, the word alone for "Not checked yet". `text-neu` exists (`tailwind.config.js:48`). |
| A17 | Dial role and label unchanged; face and ticks decorative | PASS | Outer div keeps `role="img"` and `aria-label` (`GlowScoreDial.tsx:49`); `.dial-face` div `aria-hidden` (line 50); ticks live inside the existing `aria-hidden` svg. |
| A18 | Reduced motion | PASS | `index.css:1133` to `1137` sets `transform: none; transition: none` on both keycaps incl. `:hover` and `:active` (same specificity, later in source, so it wins; it also neutralises Button's `active:scale`). `.recessed-input` transition off. Ticks carry `motion-reduce:transition-none` (`GlowScoreDial.tsx:75`), so the inline `transitionDelay` has nothing to delay. Arc keeps `motion-reduce:transition-none` (line 95). `.glow-bar-fill` already in the block at `index.css:1006`. Remaining hover effects (filter, background-image swap) are not motion. |
| A19 | Target size | PASS | No tactile class sets size or padding. Buttons keep `h-9` / `h-7` and `max-md:min-h-[44px]`; segments keep `h-7` (28 px, above 24 px for 2.5.8) and 44 px below 768; phone select keeps `min-h-[44px]`. `.recessed-squircle` is not interactive. |
| A20 | Focus order and heading order | PASS | No interactive element added, removed or reordered. The LED is an `aria-hidden` span; the timestamp moved into a wrapper with the groove, same order. No heading touched. |
| A21 | Disabled keycaps still read as disabled | PASS with a note | Button's `disabled:opacity-50 disabled:pointer-events-none` (`Button.tsx:20`) is not overridden by any tactile rule, so disabled keycaps dim and cannot hover-lift. See L2. |

## 3. Findings

### L1, LOW. Dead `outline: none` on the search field states the wrong intent

`brandgeo-dashboard/src/index.css:1091`

The rule reads `.recessed-input:focus { ...; outline: none; }`. Today it has no
effect on keyboard users, because `input:focus-visible:focus-visible` at
`index.css:534` has specificity (0,2,1) against this rule's (0,2,0), so the
global 2 px accent-ink ring still draws (6.56:1 dark, 7.10:1 light). Without
that ring, the remaining focus cue would be a border change from `--edge` to
`--accent-ink`, a change of only 1.99:1 dark and 1.95:1 light, plus a 3 px
halo at alpha 0.22: not a 3:1 change and not a reliable 2.4.7 indicator. One
harmless looking edit (for example `input.recessed-input:focus`, specificity
0,2,1 and later in source) would silently remove the ring. Spec 4.7 says the
ring is kept on every input.

Fix: delete `outline: none;` from `index.css:1091`. Nothing visible changes,
because the ring already shows.

### L2, LOW. A disabled primary keycap keeps its backlight and glow

`brandgeo-dashboard/src/index.css:1025` to `1032`, used at `AIVisibility.tsx:1860`

The Run collection button is disabled during a run, while loading, and for a
viewer in cooldown. Disabled, it keeps the lit top stop, both outer accent
glows and the top highlight, all at 50 percent opacity. Text contrast is
exempt for inactive controls (1.4.3), and opacity is the same cue as before,
so this is not a failure. But the glow is the strongest "live, press me"
signal on the page, and it stays on while the control cannot be pressed; a
low vision user comparing it with the enabled state sees a dimmer glowing
key, not an off key. Not verified in a browser.

Fix: add `.tactile-btn-primary:disabled { box-shadow: none; filter: none; }`
(and optionally `background-image: none` so it falls back to the flat
`bg-accent-strong` at half opacity). Same for `.tactile-btn-secondary:disabled
{ box-shadow: none; }` if the drop shadow reads as raised.

### I1, INFO. Primary keycap hover brightens the fill under white text (dark)

`brandgeo-dashboard/src/index.css:1033`

`filter: brightness(1.07)` on hover lightens the fill. Computed in sRGB (how
Chrome applies filter shorthands) the glyph band drops to 4.78 at 25 percent
height, 4.91 at 33, 5.10 at 45 (dark); light stays above 5.81. In linearRGB
it would be 5.09 to 5.43. At the very top stop, where no glyph sits, it is
4.46. All glyph positions pass. The token comment at `index.css:114` ("white
text 4.95:1") is the rest value only. If a future size puts text higher in
the key, or the filter grows, dark hover is the first pair to fail.
Suggested: drop the filter and let the `translateY(-1px)` lift carry hover, or
cap it at `brightness(1.04)`.

### I2, INFO. Primary keycap lower half is darker than the old flat fill (dark)

`brandgeo-dashboard/src/index.css:1026` to `1027`

The bottom stop `--accent-strong-hover` (109,40,217) is 2.77:1 against the dark
canvas, and the new 1 px border is the same colour; the old flat
`bg-accent-strong` was 3.45:1. 1.4.11 does not require a button boundary when
the label identifies the control, and the top two thirds stay at 3.45 to
3.97, so this is recorded, not a finding.

### I3, INFO. Focus ring over the primary glow, light theme

Worst case (glow alpha 0.45 directly under the ring) the ring is 3.29:1 in
light. The two outer glows are blurred (10 px and 20 px, negative spread), so
under the ring at 2 to 4 px out the real alpha is lower and the ratio sits
around 4.2 to 4.9. Passes 2.4.7; not measured in a browser.

### I4, INFO. Phone sort select now has a real boundary

`AIVisibility.tsx:2603`. The border moved from `border-line` (1.27:1 dark,
1.21:1 light against canvas) to `--edge` (3.64 / 3.42): an improvement for
1.4.11. `tailwind.config.js` has `plugins: []`, so no `@tailwindcss/forms`
chevron is overwritten by the new `background-image`; the native arrow is the
UA's. Whether iOS Safari and Android Chrome still draw the arrow on a select
that carries a gradient `background-image` and a box-shadow was not
verified.

### I5, INFO. Selected segment relies on a single 1 px border in light

`index.css:1076` to `1081`. Fill vs well is 1.19:1, so the 3:1 state cue is the
`--edge` border at 3.06:1 in light. It passes, with 0.06 of margin. A darker
`--well-fill` or a lighter `--edge` breaks it silently. Suggest pinning the
pair in `tests/tokens_sync.test.js` (edge vs well-fill at least 3.0 in both
themes), the same way the glass tokens are pinned. The semibold weight is a
second, non-colour cue, so a failure would not be total.

### I6, INFO. Budget meter track disappears into the well (light)

`AIVisibility.tsx:2050`, `AllowanceMeter.tsx:45`. The meter track
`bg-surface-3` on `--well-fill` is 1.02:1 light, 1.21:1 dark (before, on the
glass pill, it was about 1.09 light, so this was already faint). The fill vs
track stays 3.91 dark, 4.85 light, and the value is printed as "n of m", so
1.4.11 is met by the text. Admin only, never in demo. If wanted: frame the
meter on a raised pill (`.recessed-pill-active` fill) instead of a well.

### I7, INFO. Bars got thinner

`.recessed-channel` (`index.css:1095`) adds 1 px border and 1 px padding on a
border-box element: the dimension bar fill is now 4 px tall (was 6 px), the
engine groove fill 2 px (was a 1 px line). The fill and the printed
percentage both remain; no criterion fails. Noted for low vision readability.

### I8, INFO. `.cell-top` jewel edges

`index.css` `.cell-top` box-shadow. The new 1 px top highlight (white 0.28 over
`--accent-strong`) gives white text 3.41:1 on that one row in dark, and the
2 px bottom shade darkens the lower lip. In a 20 px cell the glyph sits
between those rows, so the text pair is unchanged at 5.70 to 7.10 dark and
7.10 to 8.98 light. Not a finding.

### I9, INFO. LED colour for an unavailable engine is the same amber as "Sometimes named"

`AIVisibility.tsx:2123` to `2128`. Both map to tone `warn`. The lamp is
decorative and the badge words differ (`AIV_COPY.engineNotAnswering` vs
"Sometimes named"), so nothing is conveyed by colour alone. Recorded only because a
sighted user scanning lamps cannot tell an outage from a partial result; a
design call, not an accessibility failure.

## 4. Regression surface (grep, accessibility relevant only)

- `.glass-input`, `.glass-pill`, `.glass-squircle`, `.glow-line`,
  `.glow-bar-track` were deleted from `index.css`. `rg -c
  "glass-input|glass-pill|glass-squircle|glow-line|glow-bar-track"
  brandgeo-dashboard/src brandgeo-dashboard/tests` returned no match (exit
  1), so no consumer is left without its focus or boundary styling.
- `.cell-top` is shared by `PromptResultCell.tsx:84` and `:134` and the legend
  at `AIVisibility.tsx:2770`, so the shadow change shows in both the matrix
  and its key.
- `SegmentedControl` is rendered by `Layout` on every route; the new styling
  only applies where `className="seg-well"` is passed (`AIVisibility.tsx:2590`),
  so the time filter and other instances are unchanged.

## 5. Not checked

- Nothing was rendered. No browser, no screenshot, no CDP measurement at any
  viewport, either theme. Every ratio is token arithmetic.
- The real backdrop behind each control (header buttons assumed on canvas,
  search field and segments assumed on a glass card approximated by
  surface-2 or white). Glass translucency can shift these by a few hundredths.
- Glow falloff under the focus ring (I3) and whether Chrome applies
  `brightness()` in sRGB or linearRGB (I1); both ranges are given.
- Forced colors (Windows High Contrast): wells, keycap shading, the LED and
  the gradient-only progress fills are drawn with box-shadow and
  background-image, which forced colors may drop. Borders survive. The
  gradient fill has no forced-colors fallback (pre-existing for
  `.glow-bar-fill`).
- Screen reader output, Firefox, a real phone, native select rendering on iOS
  and Android (I4).
- `npx tsc --noEmit`, `npm run build`, the node tests and the dash scan were
  not run from this seat; this lens covers accessibility only.
- Security, data integrity and copy lenses are out of scope for this report.

## Amendment (orchestrator seat, 2026-11-16, not a second review)

- L1 closed: `outline: none` removed from `.recessed-input:focus`; the global
  focus-visible outline was already winning and now does not depend on that.
- L2 closed: `.tactile-btn-primary:disabled` drops the backlight, glow,
  filter and lift.
- Selected segment margin (info): `tests/tokens_sync.test.js` now pins
  `--edge` on `--well-fill` at 3:1 or more in both themes (3.70 dark, 3.06
  light).
- Measured in headless Chrome over CDP (demo mode, 1440, 1024 and 390, both
  themes): every visible text box sampled against the pixels behind it with
  text hidden, 0 below AA apart from the gradient-clipped sidebar logo, which
  fails the same way on HEAD. The dial "%" measured 4.38:1 in light with
  `ink-3` before it moved to `ink-2`.
- Not changed: forced-colors mode, a screen reader, Firefox and native select
  rendering remain unverified.
