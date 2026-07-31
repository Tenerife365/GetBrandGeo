---
id: 013
from: bg-app
to: bg-verify
status: READY
created: 2026-07-27
scope_write: docs/qa/dashboard-visual-system-013-review.md
scope_read: docs/design/dashboard-visual-system.md, docs/qa/dashboard-audit-2026-07-26.md, .claude/handoffs/009-bg-design-to-bg-app-dashboard-visual-system.md, brandgeo-dashboard/src/
model: opus
---

## Decision

`bg-app` has implemented packet `009` against `docs/design/dashboard-visual-system.md`.
All five build steps are complete. The changes are **uncommitted** on the working
tree. Review before Constantin commits.

Spec section 17 is the harness and it is the acceptance test. Re-run it
independently rather than reading `bg-app`'s report of it.

## Already verified by the coordinator, reproduce rather than trust

These were checked independently and held. Re-derive them; do not take them on
faith, but do not spend the review rediscovering them either.

- `npm run build` exits 0; `npx tsc --noEmit` clean.
- Every change is confined to `brandgeo-dashboard/src/`. Nothing touches
  `netlify/functions/`, `db/`, `brandgeo/web/`, or `tailwind.config.js`.
- V5 reproduces: zero hits for `groupColors`/`trendColors`, zero for
  `ENGINE_META[...].color`/`.bg`, zero for `yAxisId`, `strokeDasharray` exactly 4
  and only in the two score-ring files, no `width`/`border-radius` in the
  scrollbar block.

**Not verified by anyone yet, and squarely yours:** V1, V2 and V3 (the palette
validator runs, from the `dataviz` skill's own base directory — the path cited in
the audit does not exist in this repo), and V4 (the seven shell contrast ratios in
spec section 4.6, computed from the section 3 token values as actually written
into `index.css`). V4 is the one that decides whether the owner's original
complaint is actually fixed.

## Six hand-picked engine palettes, and the hole in the harness

The audit named four independent engine-colour maps. `bg-app` found a fifth
(`Recommendations.tsx`). The coordinator found a sixth (`Dashboard.tsx:664`,
still live on the highest-traffic route, still carrying the Claude-orange against
Meta-amber pair the audit measured at dE 9.6). Both were invisible to V5 because
they key off Tailwind class names, so neither the hex check nor the
`ENGINE_META[...]` check can see them.

`bg-app` proposed a seventh check. The coordinator validated it empirically: it
returns 0 against the current tree and 19 hits across `Dashboard.tsx`,
`Recommendations.tsx` and `Mentions.tsx` at `HEAD`, so it catches the class rather
than passing vacuously.

```
grep -rnE "(chatgpt|gemini|claude|perplexity|meta|google_ai|copilot|deepseek|grok)\s*:.*(text-(emerald|orange|amber|cyan|blue|indigo|sky|slate|red|violet|purple|rose|fuchsia|green)-[0-9]{3}|bg-(emerald|orange|amber|cyan|blue|indigo|sky|slate|red|violet|purple|rose|fuchsia|green)-[0-9]{3})" src/
```

Confirm it independently, then say whether it should become V7 in spec section 17.
If yes it goes to `bg-design` as a spec amendment. Neither you nor `bg-app` edits
the spec. Also say whether a seventh instance exists that this pattern still
misses — six were found by three different parties, which is evidence the search
has not converged.

## Judgement calls to adjudicate, not defects

`bg-app` flagged each of these rather than burying them. Each is a decision the
spec did not make. Rule on them; do not treat them as findings by default.

1. **`Dashboard.tsx` per-engine bar chart recoloured** from one brand violet to
   per-engine `Cell` fills, reversing that file's own comment about a single calm
   hue. `bg-app`'s reasoning is spec 8.6 rule 3, which reserves brand violet for
   chrome and not data series. The spec never names this chart. This is the one
   most worth a real ruling.
2. **Several `SectionHeading`s are `sr-only`** (AIVisibility hero, Mentions KPI and
   filter rows, Prompts list, Usage summary) rather than visible, to satisfy the
   heading outline without doing section 5 layout work that this build excludes.
3. **Sentiment tokens extended to two places the spec does not name:**
   `Recommendations.tsx`'s Strong/Partial/Low badges and `AIVisibility.tsx`'s
   mentioned/not-mentioned card tinting.
4. **Currency left as `EUR` unresolved.** Spec 12's worked example reads `EUR 11.88`;
   the app ships `EUR` as the symbol across Usage, Account billing, Onboard and the
   live pricing pages and Stripe checkout. `bg-app` built `formatCurrency()` to the
   spec rule but declined to retrofit existing displays, on the grounds that the
   symbol is a copy and branding decision outside this packet. Say who owns it.
5. **Ordinals applied selectively.** One position display converted to prose
   ordinal; roughly twelve left as `#N` where a bare ordinal reads worse.
6. **`TrendDelta` built to spec 12.2 but wired to nothing.** No page computes a
   period-over-period comparison, and no client has more than one distinct
   collection day, so wiring it would mean inventing the data. Confirm this is the
   right stopping point rather than an omission.
7. **Padding sweep scoped to true outliers.** Icon and avatar tiles keep
   `rounded-2xl` as a distinct sub-pattern; roughly 150 already-compliant Tailwind
   literals were left unrenamed since they compute to the same values. Confirm F-20
   is actually closed or say plainly that it is not.

## Specifically check

- **First-run states, spec section 11.** This is where the product previously
  issued a verdict before it had data: 0% across six dimensions, an unmeasured
  brand labelled "Needs Work", and `/sentiment` rendering 0 buttons and 0 links.
  Confirm a zero-data tenant now reaches a live action on every route, and that no
  route still states a score or a verdict it has no data for.
- **Light mode.** Previously unaudited entirely, roughly 60 `!important` overrides
  in `index.css`. Both themes were built together in this pass. Check both.
- **The `sr-only` headings do not break the visible hierarchy** and that per route
  there is exactly one `h1`, at least one `h2`, and no skipped level.
- **24px minimum targets at 375px.** `bg-app` verified this from source only and
  said so; it has no authenticated Supabase session. Close it however you can, or
  record plainly that it remains unverified rather than passing it silently.
- **The `ENGINE_META` and `ALL_ENGINES` edits touched nothing else in
  `planConfig.ts`.** That file also carries the plan ladder, which is billing.

## Do not

- Do not edit any file you review. Your only write is your report.
- Do not run any git command that mutates state. There is uncommitted work here
  from more than one session and git state is shared.
- Do not edit `docs/design/dashboard-visual-system.md`. Amendments go to
  `bg-design`.

## Acceptance criteria

- [ ] Verdict is the first line of the report.
- [ ] V1 through V5 each re-run independently, with verbatim output and exit codes.
- [ ] V4's seven shell ratios computed from the tokens as written in `index.css`,
      not as written in the spec, and the difference stated if there is one.
- [ ] Each of the seven judgement calls above explicitly ruled on.
- [ ] A yes or no on the proposed V7, and on whether the search for hand-picked
      palettes has converged.
- [ ] Every finding ranked, with the ones that block a commit separated from the
      ones that do not.
