---
id: 009
from: bg-design
to: bg-app
status: READY
created: 2026-07-27
scope_write: brandgeo-dashboard/src/index.css, brandgeo-dashboard/src/components/, brandgeo-dashboard/src/lib/, brandgeo-dashboard/src/pages/
scope_read: docs/design/dashboard-visual-system.md, docs/qa/dashboard-audit-2026-07-26.md, docs/DESIGN-SYSTEM.md, docs/DASHBOARD-UX-2026.md, brandgeo-dashboard/tailwind.config.js
model: sonnet
---

## Decision

`docs/design/dashboard-visual-system.md` is the approved visual spec for the
dashboard shell, card system, colour system and every chart. It is READY and it is
the single source of truth for this build. Implement it verbatim.

The complaint on record, in the owner's own words: the sidebar does not read as a
separate object from the canvas, in light mode and dark mode both, and the selected
nav item does not pop. The measured cause is in the audit: sidebar against canvas
**1.07:1**, active nav **1.24:1** text and **1.17:1** background with the entire
active state resting on one 3px rail, time-filter bar **1.39:1**. WCAG 1.4.11 wants
3:1. The spec fixes all of it with named tokens rather than per-component patches.

The owner also asked that the same pass cover every chart and visualisation. Spec
section 9 is the Recharts pass and section 8 is the colour system that it depends
on. Do not ship the shell and skip the charts.

Two owner rulings are already baked into the spec and are not open:

1. **Engine brand colours stay.** ChatGPT keeps green, Claude keeps orange.
   Sentiment moves onto a dedicated status ramp instead. This is why spec J2 lands
   on lime for positive, and lime is not negotiable downstream of that ruling.
2. **Design spec first, then build.** That is this packet. You implement, you do
   not redesign.

## Do

Follow the build order in spec section 18. Each of the five steps is independently
shippable, so land them in order and keep the tree working between them.

1. **Amendments A1 to A7 plus section 4.** The shell. Declare every token in
   `src/index.css` under `:root` and `html.light` exactly as the section 3 tables
   write them, then consume them in `Layout.tsx`. Highest value, smallest blast
   radius, and it is the complaint on record.
2. **A8 plus sections 6 and 7.** Typography components and card tokens. Mechanical.
3. **A10 plus section 8.** The palette, `ENGINE_META`, the chip rewrite, and the two
   `!important` deletions.
4. **Section 9.** The Recharts pass. Depends on step 3.
5. **Sections 10 to 12.** Motion audit, state inventory, number formatting.

Rules that apply throughout:

- **No component may restate a token value inline** (spec section 3 preamble). Every
  new colour is a CSS variable in `index.css`. If you find yourself typing a hex in a
  `.tsx` file, the token is missing, not the hex.
- **`--border-nav` must be solid.** Applying alpha drops it below 3:1 and
  reintroduces audit finding F-09 (spec A2).
- **`--surface-nav-active` must be solid, not an alpha wash.** An alpha wash cannot
  be measured without knowing what is behind it, which is exactly how the current
  1.17:1 went unnoticed (spec A3).
- **Do not dim inactive nav items.** The comment at `Layout.tsx:198-204` records that
  they were brightened deliberately so they stay distinct from group headers. The
  spec moves the active state and re-treats the headers instead (A5).
- **`ALL_ENGINES` display order is a design artefact, not a list** (spec J5). The
  adjacent-pair colour-vision check in section 17 is computed on that order. Change
  the order only as the spec writes it.
- Light mode is in scope and is currently unaudited. Both themes ship together.

## Do not

- Do not edit `tailwind.config.js`. Every new token is a CSS variable in
  `index.css`; no new Tailwind colour is required (spec section 18).
- Do not touch `netlify/functions/`, `db/`, or `brandgeo/web/`. Packet `012` is live
  in `netlify/functions/` right now and two sessions writing there will collide.
- Do not touch anything in `planConfig.ts` other than `ENGINE_META` and
  `ALL_ENGINES`. The plan ladder in that file is authoritative for entitlement and
  billing and is out of scope.
- **Run no git commands.** Builder and reviewer are separate per AGENT-OS. Leave
  every change uncommitted; Constantin commits after `bg-verify` passes.
- Do not re-raise these four claims from `CLAUDE.md` §7.1. All four were measured and
  refuted on 2026-07-26 and re-filing any of them burns a cycle: Overview renders
  light-themed (false, `documentElement.className` is `""` on all 12 routes); the
  Overview chart overflows (false, `scrollX` never moves); cards are flat (false, 163
  of 164 carry a computed box-shadow at `index.css:269-286`); teal is used for active
  states (false, zero `teal-` occurrences in `AIVisibility.tsx` or `Prompts.tsx`).
- Do not invent a new packet id. `bg-verify` receives `013`, allocated when that
  packet is written, and ids are never reserved inside an artifact.

## Acceptance criteria

Spec section 17 is the harness and it is the test. `bg-verify` re-runs it; you should
run V5 yourself before declaring done, because it is pure `grep`.

- [ ] Every token in section 3 (A1 to A10) is declared once in `index.css`, in both
      `:root` and `html.light`, with the exact values in the section 3 tables.
- [ ] Section 4.6's seven shell ratios hold as computed. In particular the nav
      divider clears 3:1 against all four of its pairings, and the active nav item
      clears the section 4.2 criterion in both themes.
- [ ] V5 source checks all pass: no engine or sentiment hex outside `planConfig.ts`
      and the chart-theme module; zero hits for `groupColors` / `trendColors`; zero
      hits for `ENGINE_META[...].color` / `.bg`; zero hits for `yAxisId`.
- [ ] `Competitors.tsx:258`'s index-keyed fourth palette is gone, replaced by the
      shared chart-theme module.
- [ ] Every route renders exactly one `h1`, at least one `h2`, and skips no heading
      level.
- [ ] At 375px, no interactive element measures under 24px in either dimension
      (WCAG 2.5.8).
- [ ] `npm run build` exits 0 from `brandgeo-dashboard/`.
- [ ] No file outside `scope_write` is modified.

## Notes for the receiver

The spec's own section 15 records six judgement calls and four residual risks. Read
them before you start. They are there so you implement the decision rather than
rediscover the constraint and quietly deviate. R4 is the one most likely to look like
a bug: `--surface-nav` differs from the canvas by only 1.06:1 dark, and that is
arithmetic, not an oversight. Two dark surfaces cannot reach 3:1 without one becoming
a mid grey. The divider carries the requirement instead. Do not "fix" it by
lightening the rail.

Section 16 lists documentation corrections. Those are `bg-design`'s to make after this
build lands, not yours.
