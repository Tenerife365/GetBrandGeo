# BrandGEO Design System

> Phase 1 of the Master-Redesign initiative (see `CLAUDE.md` §7.4). This is the
> single source of truth for tokens Phase 2+ (sidebar/nav redesign, then the
> page-by-page pass) should use — not a new invention, mostly a **consolidation
> of what's already correctly used in most of the app**, with the handful of
> inconsistencies called out explicitly so each page pass can fix its own
> without re-litigating the standard.
>
> Grounded in an actual grep audit of `brandgeo-dashboard/src/` on 2026-07-09
> (all 12 pages + `Layout.tsx`), not guessed. Where a file breaks the pattern,
> it's named directly so a future session can fix it in passing.

---

## 1. Color

Already well-defined in `tailwind.config.js` + `src/index.css` (see CLAUDE.md
§4.2) — this section just restates it as the canonical reference.

**Brand (violet) scale** — `tailwind.config.js` `theme.extend.colors.brand`:

| Token | Hex | Typical use |
|---|---|---|
| `brand-300` | `#c4b5fd` | light accents on dark bg |
| `brand-400` | `#a78bfa` | icon accents, hover states |
| `brand-500` | `#8b5cf6` | primary actions, focus rings |
| `brand-600` | `#7c3aed` | (rarely used directly — prefer 500) |

**Surface scale** — CSS variables in `src/index.css` `:root`/`html.light`,
mapped in `tailwind.config.js` `theme.extend.colors.dark`:

| Token | Dark value | Light value | Use |
|---|---|---|---|
| `dark-900` | `rgb(10 15 30)` | `rgb(241 245 249)` | page background (`body`) |
| `dark-800` | `rgb(15 23 42)` | `rgb(255 255 255)` | card background |
| `dark-700` | `rgb(30 41 59)` | `rgb(226 232 240)` | card border, elevated surface, inputs |
| `dark-600` | `rgb(51 65 85)` | `rgb(203 213 225)` | secondary border, hover surface |

Text: `text-white` (primary), `text-slate-300`/`text-slate-400` (secondary),
`text-slate-500`/`text-slate-600` (muted/caption) — all have `html.light`
overrides already defined in `index.css`, don't add new text colors without
adding the matching light-mode override.

**Engine colors** — single source of truth is `ENGINE_META` in
`src/lib/planConfig.ts` (`color` = Tailwind text class, `bg` = Tailwind bg
class, `chartColor` = hex for recharts):

| Engine | Text class | Chart hex |
|---|---|---|
| ChatGPT | `text-emerald-400` | `#10b981` |
| Gemini | `text-blue-400` | `#3b82f6` |
| Claude | `text-purple-400` | `#a855f7` |
| Perplexity | `text-cyan-400` | `#06b6d4` |
| Meta AI | `text-amber-400` | `#f59e0b` |
| Google AI | `text-red-400` | `#ef4444` |
| Copilot | `text-sky-400` | `#38bdf8` |
| DeepSeek | `text-indigo-400` | `#818cf8` |
| Grok | `text-slate-300` | `#94a3b8` |

**⚠️ Inconsistency found:** `Dashboard.tsx` (lines 12–18) and `Competitors.tsx`
(~line 498) each **re-declare** these same 5 hex values locally in their own
`LLMS`/chart-color arrays instead of importing `ENGINE_META[engine].chartColor`
from `planConfig.ts`. Values currently match (verified), but this is
duplication waiting to drift — fix when either file is next touched (Phase 3
Overview/Competitors passes): replace the local hardcoded hex with
`ENGINE_META[id].chartColor`.

**Status colors** (not engine-specific): `emerald-400/500` = good/positive,
`amber-400/500` = warning/neutral, `red-400/500` = bad/negative/error — used
consistently for mention-rate thresholds, sentiment, and error states across
`Dashboard.tsx`, `BrandSentiment.tsx`, `AIVisibility.tsx`.

**Rule carried over from CLAUDE.md §4.2:** never use teal/green as a primary
brand color (legacy, replaced by violet). Known violation still open: teal
used for active/selected states in `AIVisibility.tsx` and `Prompts.tsx` (#72
finding) — fix in Phase 3 passes on those files.

---

## 2. Typography

**Page title (`h1`)** — the dominant pattern across 8 of 9 top-level pages:

```
text-2xl font-bold text-white
```
Used identically in `Dashboard.tsx`, `AIVisibility.tsx`, `BrandSentiment.tsx`,
`Competitors.tsx`, `Mentions.tsx`, `Onboard.tsx`, `Prompts.tsx`, `Usage.tsx`.

**⚠️ Inconsistency found:** `Recommendations.tsx` (line 586) uses
`text-xl font-bold text-slate-100` instead — one size down, off-brand text
color. Fix when Phase 3 reaches Recommendations: change to
`text-2xl font-bold text-white` to match every other page.

**Auth pages** (`Login.tsx`, `Signup.tsx`, `ResetPassword.tsx`) intentionally
use a smaller `text-lg font-semibold text-white` for their card-based headers
— this is a deliberate different context (compact centered card, not a full
page header) and should **not** be changed to match the `h1` pattern above.

**Section header (`h2`), content cards:**
```
text-sm font-semibold text-slate-300
```
Used in `Dashboard.tsx`, `BrandSentiment.tsx`, `Competitors.tsx`.

**Section header (`h2`), stat/KPI-label style** (smaller, uppercase, muted —
a deliberately distinct sub-pattern for labeling a single stat rather than a
content block):
```
text-xs font-semibold text-slate-400 uppercase tracking-wide
```
Used in `BrandSentiment.tsx`, `Competitors.tsx` KPI cards.

**Body/label text:** `text-sm` (default body/description), `text-xs`
(captions, meta text, badges) — both used heavily and consistently across
every page; no changes needed.

**Numeric/stat display:** `text-2xl font-bold` + `tabular-nums` (see
`Dashboard.tsx` `KpiCard` value slots) — use `tabular-nums` on any large
numeric display so digits don't shift width as they update.

---

## 3. Spacing

**Page wrapper** (established in `Dashboard.tsx` line 120, should be the
standard for every top-level page):
```
p-4 sm:p-6 md:p-8 max-w-6xl mx-auto
```

**Card padding — currently inconsistent, standardize to 3 tiers:**

| Tier | Padding | Use |
|---|---|---|
| Compact | `p-4` | list-row cards, inline alerts, dense/secondary cards |
| Standard | `p-5` | the default — most KPI cards, content cards |
| Feature | `p-6` | hero-style / primary content cards (Dashboard's two chart cards) |

Audit found `p-4`, `p-5`, `p-6`, and even `p-8` used on visually-equivalent
`bg-dark-800 border border-dark-700 rounded-xl` cards with no discernible
rule — this 3-tier system is the standard to converge on during Phase 3, not
a strict rewrite-everything-now task. When touching a card in a page pass,
round its padding to the nearest tier above.

**Grid gaps:** `gap-4` (KPI card rows), `gap-6` (main content grids) — already
consistent, keep as-is.

---

## 4. Elevation

**This already exists** (from #78 "theme softening") — it's just
undocumented, which is likely why the Phase 3 roadmap assumed cards were
"flat-bordered with no elevation" (§7.1 finding). In `src/index.css`:

```css
.bg-dark-800.border.border-dark-700,
.bg-dark-800.border.border-dark-700\/60 {
  box-shadow: 0 1px 4px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04);
}
.bg-dark-800.rounded-xl {
  box-shadow: 0 2px 8px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04);
}
```

**The rule:** any element combining `bg-dark-800` + `border border-dark-700`
(or `border-dark-700/60`) + `rounded-xl` gets a subtle drop shadow
**automatically** — no explicit `shadow-*` utility class needed or wanted on
standard cards. Light mode gets a softer version automatically too
(`html.light .bg-dark-800.border/.rounded-xl` override, same file).

**Don't** add `shadow-md`/`shadow-lg` etc. directly to standard cards — it'll
double up with the CSS-selector shadow above. `shadow-xl`/`shadow-2xl` are
reserved for genuinely elevated overlays (dropdowns, modals — see
`Layout.tsx` lines 179/266/300, `AIVisibility.tsx` line 106) where the
higher elevation is intentional.

**Border radius:** `rounded-xl` = cards (dominant, consistent), `rounded-lg`
= buttons/inputs/small containers, `rounded-full` = pills/badges/avatars/
toggle switches. Already consistent — no changes needed.

---

## 5. Chart Colors

Covered under §1 Color above — the rule is: **charts should read
`ENGINE_META[id].chartColor` from `planConfig.ts`, never hardcode hex.**
Non-engine chart colors (axis text, grid lines, tooltip background) already
use a consistent muted-slate palette in `Dashboard.tsx` (`#94a3b8` ticks,
`#1e293b`/`#334155` tooltip bg/border) — reuse these exact values for any
new chart rather than picking new ones.

---

## 6. CTA / Button Variants

Three variants are already in consistent use — they just aren't named
anywhere. Naming them here so Phase 2/3 don't invent a fourth.

**Primary (solid violet)** — main call-to-action, one per view max:
```
bg-brand-500 hover:bg-brand-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors
```
Reference: `ResetPassword.tsx` line 61, `Login.tsx` submit buttons.

**Secondary (soft violet / "ghost-brand")** — confirm/add actions that are
important but not the single primary CTA:
```
bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 rounded-lg text-sm font-medium transition-colors
```
Reference: `Onboard.tsx` "Add" buttons, step-continue buttons; `Prompts.tsx`
save/check buttons.

**Neutral / ghost** — cancel, dismiss, secondary navigation-adjacent actions:
```
bg-dark-700 hover:bg-dark-600 text-slate-300 border border-dark-600 rounded-lg text-sm transition-colors
```
Reference: `Dashboard.tsx` line 129 (Refresh button), `Prompts.tsx` cancel
buttons.

Icon-only buttons follow the same three variants at smaller padding
(`p-1.5`/`p-2` instead of `py-2.5 px-4`) — see `Prompts.tsx` lines 481–482,
513–514 for the check/cancel icon-button pair using Secondary + Neutral
side-by-side.

---

## 7. Empty / Loading / Error States

**Loading** — already identical across every page, verbatim:
```
<div className="p-8 text-slate-500 text-sm animate-pulse">{loading text}</div>
```
Confirmed in `Dashboard.tsx`, `AIVisibility.tsx`, `BrandSentiment.tsx`,
`Competitors.tsx`, `Mentions.tsx`, `Prompts.tsx`, `Recommendations.tsx` — this
is already the standard, just formalizing it. Use this exact class string for
any new page's top-level loading state.

**Empty state (no data)** — mostly consistent, one canonical form:
```
<p className="text-sm text-slate-500 py-8 text-center">{empty message}</p>
```
Confirmed in `Dashboard.tsx` (both chart cards). `Competitors.tsx` line 482
uses a close variant (`text-slate-500 text-sm mb-1`, no `py-8 text-center`) —
acceptable minor variant for a sub-block empty state vs. a full-card empty
state; not worth forcing identical.

**Inline error banner:**
```
bg-dark-800 border border-red-500/20 rounded-xl p-4 text-xs text-red-400
```
Confirmed in at least one page from the audit grep — use this for any new
inline error banner rather than inventing a new error style.

**Spinner icon** (inside buttons, not full-page loading): `Loader2` from
`lucide-react` with `animate-spin` — consistent everywhere it's used
(`AIVisibility.tsx`, `Login.tsx`, `Recommendations.tsx`). Use this exact icon,
not a different spinner component.

---

## 8. What Phase 2/3 should do with this file

- **Phase 2** (sidebar/nav redesign, `Layout.tsx`): use §1 color tokens and
  §4 elevation rule for the new nav sections/active-state indicator. No new
  tokens needed for this phase — everything it needs is already above.
- **Phase 3** (page-by-page pass): each page pass should, while already in
  the file for visual work, also fix that page's specific deviation listed
  above (Recommendations' `h1`, Dashboard/Competitors' duplicated chart hex,
  card padding convergence to the 3-tier system, `AIVisibility.tsx`/
  `Prompts.tsx` teal violation from #72) — bundled in, not a separate pass.
- This file should be updated (not re-created) whenever a Phase 2/3 session
  establishes a new pattern worth reusing elsewhere — treat it as living
  documentation, same spirit as `CLAUDE.md`.
