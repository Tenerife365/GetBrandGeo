# Glass layer on AI Visibility and the sidebar (2026-11-15)

Owner's brief: a premium AI SaaS look on AI Visibility (score card, engines,
Fix this, prompt matrix) and the sidebar: frosted glass cards, gradient fills,
1px highlight borders, soft glow and spring hovers. Visual only. The Phase 3
to 5 guardrails bind, and where the brief and a rule disagree the rule wins.

## Tokens (src/index.css, both themes)

| Token | Dark | Light | Used by |
|---|---|---|---|
| `--grad-start` | 99 102 241 (#6366f1) | 79 70 229 (#4f46e5) | gradient fills, dial, rails |
| `--grad-mid` | 139 92 246 (#8b5cf6) | 124 58 237 (#7c3aed) | gradient fills, aura |
| `--grad-end` | 168 85 247 (#a855f7) | 147 51 234 (#9333ea) | gradient fills |
| `--glow` | 192 132 252 (#c084fc) | 139 92 246 (#8b5cf6) | every glow |
| `--glow-strength` | 0.42 | 0.28 | glow alpha |
| `--glass-fill-top`, `--glass-fill-bottom` | translucent surface pair | translucent white pair | glass surfaces |
| `--glass-solid` | 22 23 30 | 255 255 255 | no-blur fallback |
| `--glass-border`, `--glass-border-strong` | white 8%, 14% | ink 8%, 14% | 1px edges |
| `--glass-highlight` | white 7% | white 95% | inset top highlight |
| `--glass-shadow` | deep soft shadow | violet tinted soft shadow | glass surfaces |
| `--glass-tile`, `--glass-well`, `--glass-well-shadow` | | | dimension panels, sidebar wells |
| `--glass-nav-top`, `--glass-nav-bottom` | | | sidebar gradient |
| `--aura-a`, `--aura-b` | 0.20, 0.12 | 0.16, 0.08 | aura strength |
| `--row-hover` | 26 23 40 | 247 243 254 | matrix row hover (opaque, so sticky cells match) |

Light stops sit one step darker so a gradient bar still clears 3:1 on the light
track. `grad-start`, `grad-mid`, `grad-end` and `glow` are mapped in
`tailwind.config.js`; `tests/tokens_sync.test.js` checks every glass token is
declared in both themes and that the brief's hex values appear nowhere else in
`src/` (two older, unrelated uses are allow-listed: the logo and the DeepSeek
chart colour).

## Classes (src/index.css)

`.glass-card` (blur 20px, 16px radius, inset highlight, soft shadow),
`.glass-lite` (drops the blur), `.glass-card-interactive` (lifts 2px, accent
border, soft glow, for links), `.glass-card-lift` (lifts 2px with a border
step only, for a card that is not a link), `.hero-ambient-mesh` (aura behind the score card, and the
glass surface for HeroAnswer's own Card through a descendant rule),
`.glow-bar-track` and `.glow-bar-fill`, `.glow-line`, `.glass-tile`,
`.glass-pill`, `.glass-squircle`, `.glass-callout`, `.matrix-head`,
`.matrix-row`, `.glass-input`, `.cell-top`, `.cell-soft`, `.sidebar-glass`,
`.sidebar-well`, and an unlayered override of `.nav-item.is-active`.
(2026-11-16: `.glow-bar-track`, `.glow-line`, `.glass-squircle`,
`.glass-input` and `.glass-pill` were removed when the tactile layer replaced
them with recessed equivalents; see `tactile-layer-2026-11-16.md`.) A
`@supports not (backdrop-filter)` block makes glass solid; a reduced-motion
block stops the lift and the transitions.

## Where blur is paid

Only on the sticky matrix header, the one surface content scrolls under.
`.glass-card` carries a 20px blur for future large surfaces over moving
content; every use on this page adds `.glass-lite`, and the score card has no
blur (review a11y L3: behind it is only its own static aura). The sidebar is
not blurred either. The sidebar
is opaque on purpose: as the phone drawer it covers the page, and text over a
see-through panel has no fixed contrast.

## Deviations from the brief

1. Raw hex and rgba values became tokens (rule: semantic tokens only).
2. Engines stay ONE row of cards on every viewport, scrolling sideways, not a
   grid (density ruling 2026-11-10).
3. The score ring with gradient and glow is a new `GlowScoreDial`, used only on
   AI Visibility. `ui/ScoreDial` is shared (Overview) and its spec says no
   gradient or glow; it is unchanged.
4. The sidebar is CSS only and has no backdrop blur (opaque, see above). No
   `motion` anywhere `Layout.tsx` imports.
5. The #1 badge fill is the strong accent pair, not the brief's lighter violet:
   white text on #6366f1 or #8b5cf6 is under 4.5:1. The lighter violet is the
   glow.
6. The refresh button on an engine card shows on hover or keyboard focus, and
   always on touch screens (no hover there) and while it runs. It stays admin
   only. Status cards lift without the accent glow, since they are not links.
7. The euro budget pill is admin only and never shown in demo, the same gate as
   before. For a client with no prompts (no score card header) it keeps its old
   row.
8. The dimension bars no longer print "n/a" under an unmeasured row; the value
   column already says "Not measured yet" or "Not applicable".

## Measured (headless Chrome over CDP, demo mode)

"Your prompts" start, baseline then after: 682 to 757 px at 1440 (+75), 1,158
to 1,241 px at 390 (+83). With Fix this open: 1,129 to 1,200 px at 1440 (+71),
2,229 to 2,308 px at 390 (+79). No horizontal scroll of the window or of `<main>` at 1024, 1180, 1280, 1366,
1440 or 390 in either theme, also with a simulated "Split by location" button
(the toolbar wraps and the search field shrinks). Text contrast, every visible text box sampled against the pixels
behind it with text hidden: 0 below AA at 1440 and 390, dark and light, Fix
this closed and open. Entry chunk 602,542 bytes (602,628 before).
Screenshots: `docs/design/phase3-visual/after-glass/` (untracked on purpose).

## Review

Two read-only bg-verify lenses, both PASS WITH FINDINGS:
`docs/qa/glass-layer-review-rules-2026-11-15.md` and
`docs/qa/glass-layer-review-a11y-2026-11-15.md`. Every MAJOR, MEDIUM and LOW
is closed; the amendments at the end of each report list what changed and the
re-measurement. Open: a legend row for the #1 cell (bg-design or bg-copy).
