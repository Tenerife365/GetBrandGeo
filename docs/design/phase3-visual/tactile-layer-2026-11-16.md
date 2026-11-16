# Tactile layer on AI Visibility (2026-11-16)

Owner's brief: "80% frosted glass, 20% tactile instrument panel". Dark should
read as anodized obsidian with smoked glass, light as matte ceramic with crisp
grooves. Data rows stay flat; keycaps, recessed tracks, the score gauge and
the #1 token carry the tactile look. Visual only. The Phase 3 to 5 guardrails
bind, and where the brief and a rule disagree the rule wins.

Owner's rulings on this brief, 2026-11-16: engines stay ONE row of cards that
scrolls sideways, never the brief's grid; the sidebar part (brief step 5,
`Layout.tsx`) waits until the agency P1 build has committed, because that
session is editing `Layout.tsx`.

The brief, verbatim, is kept outside the repo in the side session notes
(`tactile-brief-2026-11-16.md`).

## Tokens (src/index.css, both themes)

| Token | Dark | Light | Used by |
|---|---|---|---|
| `--key-top` | 131 75 241 (#834bf1) | 124 58 237 (#7c3aed) | primary keycap top stop |
| `--key-shade`, `--key-highlight` | indigo 45%, white 30% | violet 35%, white 30% | keycap lower lip, top edge; #1 jewel |
| `--keycap-top`, `--keycap-bottom` | 22 23 30, 16 17 22 | 255 255 255, 241 242 247 | secondary keycap gradient |
| `--keycap-highlight`, `--keycap-shade`, `--keycap-drop` | | | secondary keycap edges |
| `--well-fill` | 6 8 15 | 235 234 242 | every recessed surface |
| `--well-border`, `--well-shadow` | white 5%, deep inset | ink 8%, soft inset with white lip | wells |
| `--pill-top`, `--pill-bottom`, `--pill-shadow` | surface-3 to surface-2 | white | raised segment |
| `--led-highlight` | white 55% | white 70% | LED lamp glint |
| `--dial-track` | 29 30 39 | 207 207 218 | score ring track (surface-3 vanished on the light well) |
| `--pressed-shadow` | | | keycap pressed state |

`tests/tokens_sync.test.js` now checks each tactile token is declared in both
themes, that triplets are triplets, that white text clears 4.5:1 on
`--key-top`, `--accent-strong` and `--accent-strong-hover` in both themes, that
the brief's raw values (`#818cf8`, `#ebeaf2`, `#f1f2f7`, `6 8 15`,
`129 140 248`, its slate, indigo and emerald rgba literals) appear nowhere in
`src/` outside `index.css` (positive control run: a probe file with `#ebeaf2`
fails it), and that the tactile classes sit outside any `@layer` block.

## Classes (end of src/index.css, unlayered)

`.tactile-btn-primary` (backlit keycap), `.tactile-btn-secondary` (machined
keycap), `.recessed-well`, `.recessed-pill-active`, `.seg-well` (the sort
`SegmentedControl` in a well, through its existing `className` prop),
`.recessed-input`, `.recessed-channel` (groove holding `.glow-bar-fill`),
`.recessed-squircle`, `.led-dot`, `.dial-face`, and a reduced motion block.

Unlayered on purpose: `Button`'s own utilities (`bg-accent-strong`,
`active:scale-[0.98]`, `transition-colors`) live in the utilities layer, and a
keycap class in `@layer components` would lose to them. None of these classes
set size, padding or radius, so the markup's utilities still decide those.
They are plain CSS, so the sidebar may use them without pulling in `motion`.

Removed because nothing uses them any more: `.glow-bar-track`, `.glow-line`,
`.glass-squircle`, `.glass-input`, `.glass-pill`.

## Where it is used

- **Header actions (AI Visibility):** Run Collection is the backlit keycap;
  Reload, Engines and Force Refresh are machined keycaps (Force Refresh keeps
  its red text). Overview's Refresh button is a machined keycap too; that is
  the only change to `Dashboard.tsx`.
- **Score card:** `GlowScoreDial` now sits in a recessed bezel (`.dial-face`,
  with a faint accent aura) and carries a ring of 60 ticks, every fifth one
  longer. Ticks up to the score light in `--accent-ink` and sweep with the arc
  (8 ms per tick); reduced motion shows them at once. The outer box is still
  160 px, so nothing moves. Overview's shared `ui/ScoreDial` is untouched.
- **Dimension bars:** `h-2` recessed channels with the luminous gradient fill.
- **Budget pill:** a recessed module in the score card header. Same gate as
  before: admin only, never in demo.
- **Engine cards:** recessed favicon squircle (32 px), an LED lamp beside the
  percentage coloured by the badge tone, and a sunken groove across the foot
  of the card filled to the mention rate. Locked cards get the recessed
  squircle too. The row, its widths and the CSS hover lift are unchanged.
- **Prompt toolbar:** the search field is a recessed well (the `--edge`
  border stays, so the field boundary clears 3:1); the sort control is a
  recessed well with a raised pill for the chosen mode; the phone sort
  `<select>` is a machined keycap. The Fix this "Show" toggle is a keycap.
- **#1 cell:** stays on the strong accent pair, now raised (lit top edge,
  shaded lower lip, a small drop). The legend swatch reuses
  `PromptResultCell` with `position={1}` and `.cell-top`, so it matches.

## Deviations from the brief

1. Raw hex and rgba values became tokens (rule: semantic tokens only).
2. Engines stay one sideways-scrolling row, not the brief's grid (owner's
   ruling, density ruling 2026-11-10).
3. The primary keycap's top stop is not the brief's `#818cf8`: white text on
   it is about 2.9:1. `--key-top` keeps the lightest point at 4.95:1 (dark)
   and 5.7:1 (light).
4. `.glass-card` was not redefined; the 2026-11-15 class stays as it is.
5. The #1 cell keeps the accent pair instead of the brief's emerald bezel.
   The emerald text would pass (`pos-ink` on `pos-tint` is about 7.4:1 dark
   and 6.6:1 light), but every other "mentioned" cell already sits on a pos
   tint, so an emerald #1 would differ from them by a ring and a weight only.
   In a screenshot with a forged #1 next to real #2 to #4 cells the violet
   jewel stands apart and an emerald one would not.
6. The engine cards keep their CSS hover lift on the inner glass box instead
   of `motion.div whileHover`: the outer `motion.div` already writes an inline
   transform for the entrance, and the CSS lift already honours reduced
   motion. Engine cards are not links, so the lift has no accent glow.
7. The search field keeps its `--edge` border inside the recessed look; the
   brief's 5 percent white edge would fail 1.4.11 for a text field.
8. The selected sort segment keeps its `--edge` border, the state cue that
   clears 3:1 against the well.
9. The dial's "%" moved from `ink-3` to `ink-2`: on the recessed face with its
   aura, `ink-3` measured 4.38:1 in light.
10. The light LED for "Sometimes named" uses the light `--warn` (a dark amber,
    chosen for text contrast), so it glows less than in dark. Decorative, the
    badge carries the words and the glyph.
11. The sidebar shipped in a second commit, after the agency P1 commit
    `0893d1f` on `Layout.tsx`; see "Sidebar" below for its own deviations.

## Measured (headless Chrome over CDP, demo mode, prefers-reduced-motion)

Baseline is HEAD served from a detached worktree with the same script, so the
numbers compare like for like. "Your prompts" top, document coordinates
inside `<main>` (the phone figure includes the 56 px top bar):

| Width | Baseline | After | Change |
|---|---|---|---|
| 1440 | 757 | 772 | +15 |
| 1024 | 867 | 882 | +15 |
| 390 | 1,315 | 1,336 | +21 |

Same in dark and light. The score card grows 6 px (12 px on a phone, six
channels 2 px taller) and the engine row 9 px. No sideways scroll of the
window or of `<main>` at 1440, 1024 or 390 in either theme; no element of an
engine card spills past the card. Text contrast, every visible text box
sampled against the pixels behind it with text hidden (10th percentile of
the samples): 0 boxes below AA in both themes at all three widths, except the
"GEO" of the sidebar logo, which is gradient-clipped text the method cannot
read and which fails identically on the baseline.

Bundle, built in the HEAD worktree with only these five files changed (so
another session's uncommitted work is not counted): entry chunk unchanged to
the byte, stylesheet +3,722 bytes, the lazy AI Visibility chunk +1,046 bytes.
In the shared checkout the entry chunk read 602,536 bytes (602,546 recorded
after 2a5af74).

Checks: `tsc` exit 0, 73 of 73 node test files pass (`tokens_sync` 237
checks; two of the files are new from another session), build exit 0, added lines free of em and en dashes (rg with a
positive control).

## Review

Two read-only bg-verify lenses:
`docs/qa/tactile-layer-review-rules-2026-11-16.md` and
`docs/qa/tactile-layer-review-a11y-2026-11-16.md`. Both PASS WITH FINDINGS:
rules 0 blocker, 0 major, 1 medium, 4 low, 4 info; accessibility 0 blocker,
0 major, 0 medium, 2 low, 9 info. Every medium and low is closed (the
record existed by then, the move was measured, the test gained wider raw
value and palette checks, an unlayered check per class and an edge on well
3:1 pin, `outline: none` left the search field, a disabled primary keycap
goes dark, the pill rule is shared). Each report ends with an amendment
listing the fixes; they were re-checked from the builder seat, not by a
second review.

## Sidebar (brief step 5), second commit

Done after the agency P1 commit `0893d1f` landed on `Layout.tsx`. CSS classes
only; the sidebar stays opaque and `Layout.tsx` imports nothing new.

- **Active route:** `.nav-item.is-active` is a raised pill (the `--pill-*`
  gradient and shadow) with a faint accent wash, the accent ring kept, and a
  2 px bar in `--accent` with an 8 px glow. The bar carries the state: 3.9:1
  on the dark pill, 5.7:1 on the light one.
- **Console:** `.sidebar-well` (the Client block, the Locations block, the
  static brand identity and P1's `BrandSwitcher`, which uses the same class)
  is a recessed well. Text in it is ink-3 or brighter, 6.0:1 dark and 5.05:1
  light at worst.
- **Dropdown triggers inside a console** (the admin client picker,
  Internal and Research, and the BrandSwitcher trigger) are machined
  keycaps through one CSS rule keyed on `.sidebar-well .side-row[aria-haspopup]`,
  so `BrandSwitcher.tsx` is untouched. While a list is open
  (`aria-expanded="true"`) the trigger sits pressed in.
- **Keycaps in `Layout.tsx`:** the admin "Group" select, the language
  button, the theme switch, Sign out and the admin "View as user" eye.
- **Kept as they were**, because they are navigation rows, not controls:
  My Profile, Billing and the Locations filter rows. The Billing row and the
  "See plans" link keep their `activeBrandAccountKind === 'direct'` gates,
  and the `SwitcherBoundary > Suspense > lazy BrandSwitcher` structure with
  `staticIdentity` as the fallback is unchanged.
- `--glass-well` and `--glass-well-shadow` are no longer used by any class;
  they stay declared because `tokens_sync` lists them.

Measured the same way as above, HEAD (with `0893d1f`) against the working
tree, both served from the same script: every figure identical. "Your
prompts" 772, 882 and 1,336 px; no sideways scroll; the same text boxes
sampled (166, 173, 140; 162 with the phone drawer open) and no new failure in
either theme. The drawer pass flags page text under the modal scrim and the
logo, identically on HEAD; that is the method, not the change. The admin
Client block cannot render in demo, so its markup was injected into the live
sidebar (same classes) for a dark and light screenshot; its colours are the
same well and keycap pairs measured above. Bundle (HEAD worktree, only
`index.css`, `Layout.tsx` and the test changed): entry chunk 48 bytes
smaller (two transition utilities removed), stylesheet +654 bytes. The shared
checkout, which now carries P1's brand switcher, builds a 605,005 byte entry
chunk. `tsc` exit 0, 74 of 74 node test files pass, `Layout.tsx` added to the
test's palette class guard, added lines free of em and en dashes.

Not reviewed by a bg-verify lens: this second commit is CSS classes on
existing elements plus one rule keyed on existing attributes, checked from
the builder seat only.

## Not checked by anyone

A real account signed in (so the admin budget pill and engine refresh button
in their new frames), a real phone, a screen reader, Firefox, a client with
seven active engines in the engine row.
