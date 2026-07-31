# Shared brief: dashboard UI/UX fixes, 2026-07-30

Binding on every agent working these fixes. Read all of it before editing.
Findings and measured numbers are in
`docs/qa/dashboard-uiux-audit-2026-07-30.md`. Read your findings there too.

---

## How to see the app

It is behind a login and you have no credentials. Use the app's own demo mode.

```
preview_start with name "brandgeo-dashboard-demo"
```

That entry is already in `.claude/launch.json`. It runs `vite --mode demo`,
which picks up the gitignored `brandgeo-dashboard/.env.demo.local`, whose
placeholder Supabase URL flips `isDemoMode` on so every page renders mock data.

Demo auth is a sessionStorage flag, not a password. In the page:

```js
sessionStorage.setItem('demo_logged_in','true'); location.href='/';
```

**Never type into a password field.** You do not need to.

The theme toggle is the `[role="switch"]` in the sidebar. It writes
`localStorage['brandgeo-theme']`. Put it back to `dark` when you finish, that is
the shipped default.

---

## Rules of engagement

- **Edit only the files your task names.** Three sibling agents are working in
  this repo at the same time with disjoint file scopes. Do not tidy anything
  outside your scope, and do not "fix while you are in there".
- **`src/index.css` is off limits to everyone.** It is shared and the
  coordinator owns it. If your fix needs a token or a global rule, say so in
  your report with the measured numbers and leave the code alone.
- **Do not run any git command.** Not add, not commit, not stash.
- Do not touch `brandgeo/web/`, `netlify/functions/`, or `db/`.
- Do not change plan gating, pricing, or entitlement logic. If a fix appears to
  need one, that is a product decision and belongs in your report.

## Verify by measuring, not by looking

Every claim in your report must come from a number you read off the running app.

**Negative-control anything you use as a check.** Inject the defect, confirm the
check fires, restore, confirm it goes quiet, and report "N of N". A check nobody
has watched go red is not evidence. Five checkers were caught broken on this
project this week, including the coordinator's own, one of which had been
scanning zero files while reporting clean.

Traps already paid for here, do not rediscover them:

- **A hidden or throttled tab does not advance CSS transitions**, so
  `getComputedStyle` returns the pre-transition value forever. This produced 107
  phantom contrast failures once. Kill transitions at matching specificity, a
  bare `*` rule loses to a class rule carrying its own `!important` transition,
  then force a reflow. If a value looks wrong, re-read it three times with the
  killer removed before believing it.
- **A zero-width viewport reports every element as overflowing.** Assert
  `document.documentElement.clientWidth` before trusting any layout number.
- **`element.focus()` does not satisfy `:focus-visible`.** Testing focus rings
  programmatically reports every element as having none. It is a false positive;
  this app's focus rings are fine, measured at 6.6:1 under a real Tab keypress.
- **Luminance ratio cannot see a hue change.** Grey to red scores 1.07 and is
  obvious to the eye. For "does this read as a different colour", use CIE76 dE
  with a floor of 15, not contrast ratio.
- **Surface-pair delta is the wrong measure for a component boundary.** WCAG
  1.4.11 asks that the boundary be perceivable, which a border or rail satisfies
  while the two surfaces sit at 1.05:1.

## Contrast floors

4.5:1 normal text, 3:1 for large text (24px, or 18.66px at weight 700) and for
non-text indicators. Measure against the surface the text actually sits on,
compositing any translucent layers, not against the page background.

The binding light surface is `--dark-700` `rgb(234 233 242)`, not the white
card. A value chosen against white passes there and fails on the nav and chips.

`#8b5cf6` is a FILL only. White on it is 4.23:1 and fails AA. Accent words use
`#a78bfa`.

## Content rules

No em dashes, no en dashes, anywhere a user can read them. This is the rule the
whole content programme runs on and it was never applied to the product UI,
which is why several of these fixes exist. Do not introduce one, and do not
"fix" one by swapping in an en dash.

No banned vocabulary: delve, unlock, unleash, elevate, harness, leverage as a
verb, seamless, robust, cutting-edge, transformative, supercharge, revolutionize.

## What "done" means

1. The change is in the working tree, uncommitted.
2. You re-measured the thing you fixed on the running app and it now passes.
3. You re-measured the routes you touched for **regressions**, in both themes.
   A fix that breaks dark mode to fix light mode is not a fix.
4. `npx tsc --noEmit` is clean for the files you changed, or you say why not.
5. Your report gives before and after numbers, the negative-control counts, and
   anything you could not verify stated as unverified.
