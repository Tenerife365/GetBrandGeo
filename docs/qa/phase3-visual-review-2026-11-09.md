VERDICT: FAIL (equivalent to BLOCK under AGENT-OS: seven acceptance criteria fail as written, three of them with a user-visible or accessibility consequence). Nothing needs a revert; every failing row is a bg-app fix inside files already in Lane 1 or Lane 2 scope, estimated one short round. No security finding.

# Phase 3 visual upgrade, independent frontend review

**Reviewer:** bg-verify (Opus), read-only. **Date:** 2026-11-09. **Subject:** the uncommitted Phase 3 working tree in `brandgeo-dashboard/` against `docs/design/phase3-visual/phase3-visual-spec.md` (binding, section 2 ruled "Go, all defaults"). **Scope written:** this file only. No reviewed file was edited.

```
INTENT: review Phase 3 visual (Lane 1 + Lane 2)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

## 0. What I ran (pasted results)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (brandgeo-dashboard) | `tsc exit 0` |
| All node test files, one by one | `files pass=50 fail=0`; relevant lines: `client_switch_guards: 14 passed, 0 failed`, `fix_states 28 passed`, `csv: 11 passed`, `prompts_archive: 8 passed`, `page_sequencing: 29 passed`, `results_loader: 21 passed`, `metrics: 27 passed`, `views_a: 37 passed`, `views_b: 17 passed`, `competitor_aggregate 16`, `competitor_filter 19`, `tokens_sync: 115 passed, 0 failed` |
| `npm run build` | not run (orchestrator instruction); orchestrator reports build ok, main chunk 569.66 kB vs 564.9 kB |
| Phase 2 data layer vs `git show HEAD:` (CR stripped) | `IDENTICAL` for `metrics.ts`, `resultsLoader.ts`, `resultsContext.tsx`, `resultsGuards.ts`, `historyRead.ts`, `motion.ts`, all six `src/lib/views/*`, and `package.json` |
| Supabase table reads per page vs HEAD | identical `.from('...')` multiset on all 7 pages (Dashboard `recommendation_runs`; AIVisibility `ai_results, client_api_keys, collection_runs, fix_states x5, oauth_grants`; Competitors `competitors x3`; Recommendations `recommendation_runs, recommendations`; Prompts `clients, plan_prompt_caps, prompts x5`; Sentiment and Mentions none) |
| Secret scan over every added line (4,555 lines, built from `diff` against `git show HEAD:`) | 233 matching lines, all the words "token"/"Token" (design tokens: `tokens.ts` 97, `tokens_sync.test.js` 118, `index.css` 11, `chartTheme.ts` 3, `ScoreBadge.tsx` 1, `tailwind.config.js` 1) and the filename `ResetPassword.tsx` (2). Key-shaped strings (`sk-`, `pk_live`, `eyJ...`): 0. No value printed. |
| Dash scan on added lines, `rg` with a class of U+2014 and U+2013, positive control | control file: 1 hit; added lines: 1 hit, `src/components/Typography.tsx:33` (a JSDoc comment) |
| Independent contrast and deltaE harness | `scratchpad\p3\measure.js` (my own WCAG and OKLab x100 implementation, Machado 2009 severity 1.0 matrices, the same matrices as the dataviz validator, which I read to confirm it gates on min(protan, deutan) and only reports tritan) |

Files changed versus HEAD (by content compare, not git status): 20 shared components, `Layout.tsx`, `App.tsx`, `index.css`, `chartTheme.ts`, `planConfig.ts`, `mockData.ts`, 24 page files, `tailwind.config.js`; new: `src/components/ui/*` (25 files), `src/lib/tokens.ts`, `tests/tokens_sync.test.js`. Outside the two lanes' declared scope: `src/lib/mockData.ts` (see I2), `netlify/functions/unlock-audit-report.js` (UTM attribution, another session's work, see I3), and untracked `src/pages/_dash_logic.txt` (builder scratch, see L14).

## 1. Acceptance criteria (spec section 15)

| AC | Criterion (short) | Result | Evidence |
|---|---|---|---|
| AC-1 | tokens in `:root` and `html.light` equal the spec tables | PASS | harness parsed both blocks of `src/index.css`: `AC-1 token mismatches vs spec (24 tokens x 2 themes): 0`; every hex comment equals its triplet (`comment/triplet mismatches: 0`); shadows and radii at `index.css:60-64, 227-228` match 4.7 |
| AC-2 | Tailwind exposes the 4.8 names and the 4.6 bridge | PASS | `tailwind.config.js:19-56` every token `rgb(var(--x) / <alpha-value>)`; bridge `:111-271` under `textColor`, `backgroundColor`, `borderColor`, `placeholderColor` (never `colors`); `boxShadow`, `borderRadius`, `fontWeight` 600 cap, six roles `:94-105` |
| AC-3 | ai_overview `#1c7b5a`, planConfig diff only that value and comment | PASS | diff vs HEAD: `planConfig.ts:278-287` only (comment block plus `chartColor: '#1c7b5a'`); ALL_ENGINES and PLAN_ORDER untouched |
| AC-4 | 7 live engines, adjacent normal >= 17.0, CVD >= 7.5, contrast on 4 surfaces | PASS | order chatgpt, gemini, claude, perplexity, google_ai, ai_overview, grok: adjacent normal 17.09 (`#1c7b5a` vs `#a16207`), protan 7.72, deutan 8.35; min chroma 0.10055 (ai_overview); min contrast 3.78 / 3.62 / 3.30 / 3.09 on `#0a0b0e` / `#101116` / `#ffffff` / `#f7f7fc` (all >= 3) |
| AC-5 | sentiment worst adjacent CVD >= 10.5, pos vs neg >= 10.0 | PASS under the spec's model (protan, deutan) | dark: worst 11.71 protan, pos vs neg deutan 10.26; light: worst 10.81 deutan, pos vs neg deutan 11.71. Note: tritan light pos vs neu is 4.97 (finding L13) |
| AC-6 | tokens_sync passes | PASS | `tokens_sync: 115 passed, 0 failed`. Caveat: the test proves copies equal `index.css`, not that `index.css` equals the spec; AC-1 above closes that gap |
| AC-7 | `rg -c "!important" src/index.css` returns exactly 1 | FAIL as written, PASS in substance | command returns `3`: lines 344 and 452 are comments, 463 is the one declaration (`.skip-link:focus`). HEAD had 79 declarations. Finding L1 |
| AC-8 | `rg -n "html\.light \." src/index.css` returns 0 | FAIL | one hit: `index.css:491 html.light .card-hover-lift:hover`. The class has zero call sites. Finding L2 |
| AC-9 | bridge parity snapshot on the 18 other routes | NOT CHECKED | needs the pre-Lane-1 computed-style snapshot and a browser; no snapshot exists that I could find. Visual spot check only: `after-r2/account-*` (4 files) render legibly in both themes |
| AC-10 | `text-white` on a solid fill grep returns 0; ternaries checked by hand | PASS | grep returns nothing. Hand check: `AIVisibility.tsx:273-281` (admin engine toggle: track `bg-accent`, spinner `text-white`, knob `bg-white`, white knob intended); `Prospects.tsx:1255,1261` now `bg-accent-strong text-on-accent` |
| AC-11 | throwaway element computes the light values | NOT CHECKED (no browser). By construction: `text-slate-400` reads `--br-text-slate-400` = `71 85 105` light (`index.css:234`), `bg-emerald-500/20` reads `--br-bg-emerald-500-20` = `#d1fae5` (`:256`), `border-slate-600/50` reads `rgb(203 213 225)` (`:316`) |
| AC-12 | axe 0 violations, 7 routes, both themes, 1440 and 390 | NOT CHECKED (no browser). Predicted FAIL: six unnamed `role="progressbar"` on `/ai-visibility` (finding M2) |
| AC-13 | every 13.1 and 13.2 pair within 0.05 | PASS from token values (runtime not checked) | 56 text cells: 0 deviations, worst 4.97 (ink-3 on surface-3 dark); 24 listed pairs: 0 deviations (e.g. on-accent on accent-strong 5.70 / 7.10, edge on surface-3 3.06 / 3.11, accent on track 3.91 / 4.85) |
| AC-14 | no hex or legacy palette class in the 7 pages and `src/components/**` | FAIL (components); near-PASS (pages) | pages: 0 hex literals; legacy classes 5, all in `AIVisibility.tsx:223-281` (admin engine modal: `bg-black/60`, `text-white` x3, `bg-white`). Components: `Layout.tsx` 149 legacy occurrences on ~70 lines (sidebar progress, client switcher, market picker, bottom actions, e.g. `:573, :587-588, :719, :738, :779, :799, :813, :865`), `McpAccessSection` 91, `PromotionsPanel` 48, `SupportWidget` 27, `AdminBell` 26, `ClientBanner` 12. Finding M6 |
| AC-15 | numbers are ink | PASS on code, one exception | Stat value `text-value text-ink` (`Stat.tsx:58`), HeroAnswer value `text-ink` (`HeroAnswer.tsx:48`), Mentions rank, Competitors counts `tableClasses.tdRight` ink. Exception: rank in a mentioned result cell is `text-pos-ink` (`PromptResultCell.tsx:47`), finding L9 |
| AC-16 | `COMPETITOR_SERIES_COLORS`, `buildCompetitorColors` absent | PASS | `rg` over `src`: 0 hits; field series read `chart.field` (`Competitors.tsx:500`) |
| AC-17 | no violet border on unselected content cards | PASS on code | Card is `border-line` (`Card.tsx:28`); only violet borders are selected chips, the engine toggle, and the dead `.card-hover-lift:hover` rule (`index.css:488`, no call site) |
| AC-18 | active nav rail is `--accent-ink`, >= 3:1 vs row and canvas | PASS | `index.css:650-653`; 6.09 / 7.23 dark, 6.05 / 6.65 light |
| AC-19 | no weight above 600, no font below 12 px in scope | FAIL | weights capped (`tailwind.config.js:88-92`). Sizes: bottom nav label `font-size: 10px` (`index.css:756`); `Layout.tsx` 11 occurrences of `text-[9px]`/`[10px]`/`[11px]` (e.g. `:573, :587, :588, :719, :738, :763, :779, :799, :813, :845, :865`). Finding M5 |
| AC-20 | no horizontal scroll at 390/768/1280/1440 | NOT CHECKED (no browser). No horizontal overflow visible in any `after-r2/*-mobile-*` screenshot |
| AC-21 | h1 left edge equals Page inner width | NOT CHECKED (no browser). All 7 pages render inside `<Page>` (`Page.tsx:6`, `max-w-[1200px]` with 32 px padding gives 1136 at 1440) |
| AC-22 | top-level block counts 5, 7, 5, 4, 6, 5, 4 | NOT CHECKED exactly (needs DOM). Code reading: Overview 4 in demo (What to do next is suppressed in demo, `Dashboard.tsx:137`); AI Visibility 7 plus up to 3 conditional rows (reload error, block notice, allowance) |
| AC-23 | 10-second structural test | NOT CHECKED in a browser. From screenshots: h1, hero number and sentence are in the first viewport on all 6 hero routes at 1440x900 and 390 (e.g. `after-r2/overview-mobile-dark.png`, sentence at y about 480) |
| AC-24 | 390: badge vs Refresh no overlap; 5 slots; labels not truncated; sidebar order | PASS on screenshots and code, one caveat | `after-r2/recommendations-mobile-dark.png`: "2 actions" badge on the title line, Refresh full width below. Five slots `Layout.tsx:284-285, 1157-1183`. The "AI" fourth label in after-r2 is fixed: `MOBILE_SHORT['/mentions'] = 'Mentions'` (`Layout.tsx:282`), English only. Labels carry `text-overflow: ellipsis` (`index.css:760-762`), so a long German or Dutch first word (`KI-Erwahnungen`, `AI-vermeldingen`) can truncate: not measured |
| AC-25 | no clipped y tick | NOT CHECKED (no chart rendered in demo: every trend is "Not enough data yet"). Code: percent axes use `yPercentAxis` width 48 (`chartTheme.ts:106-114`); Sentiment count axis width 40 (`BrandSentiment.tsx:318`) |
| AC-26 | row actions visible and tabbable; every control below 768 >= 44 x 44 | FAIL | row actions: PASS (`Prompts` IconButtons always visible, `after-r2/prompts-mobile-dark.png`; DataList `row-actions` ink-3). Hit area: `Chip` is `h-8` (32) below 768 with no pseudo extension (`Chip.tsx:24`), used for every filter chip on AI Visibility and Sentiment at 390. Finding M7 |
| AC-27 | empty fixture first run | NOT CHECKED (no empty fixture run). Code paths exist: `Dashboard.tsx:223-237`, `AIVisibility.tsx:1783-1793`, `BrandSentiment.tsx:209-221` |
| AC-28 | CLS < 0.05 | NOT CHECKED |
| AC-29 | reduced motion, no animations | NOT CHECKED in a browser. Code: ScoreDial, Meter, Disclosure, SegmentedControl carry `motion-reduce:transition-none`; `Layout.tsx:1099` `Loader2 animate-spin` has no reduced-motion guard (only `animate-pulse` is frozen in `index.css:515`) |
| AC-30 | every focusable element shows the 2 px accent-ink outline | FAIL | `focus:outline-none` on inputs: `Prompts.tsx:402` (add and edit fields), `Competitors.tsx:287, 293` (manual add), `Layout.tsx:779, 927`, `AIVisibility.tsx:273` (admin toggle). The utility (0,2,0) beats the base `:focus-visible` (0,1,0). Finding M3 |
| AC-31 | Phase 2 files byte-identical, tsc and build 0, no new dependency | PASS (build per orchestrator) | section 0 |
| AC-32 | no em or en dash in added lines | FAIL | `src/components/Typography.tsx:33` (comment, line rewritten in this change). Finding L3 |

Totals: 14 PASS (2 of them with a stated caveat), 1 near-PASS, 7 FAIL (AC-7, AC-8, AC-14, AC-19, AC-26, AC-30, AC-32), 10 NOT CHECKED (all need a browser or the pre-Lane-1 snapshot).

## 2. Findings, ranked

Severity scale: blocker, major, medium, low, info. No blocker.

### Major

**M1. Sentiment "By engine" bar disappears below 640 px.** `BrandSentiment.tsx:262-274`. The row is `flex flex-col sm:flex-row`; the bar is `flex h-2 flex-1`. In a column container `flex-1` sets the main-axis (height) basis to 0, which overrides `h-2`, and the auto-height row gives it nothing to grow into. Evidence: `after-r2/sentiment-mobile-dark.png` and `-light.png` show the Gemini chip and "n 10" with no bar; desktop (`sentiment-desktop-dark.png`) shows it. A phone user sees an engine row with no data. Fix: `flex-none w-full h-2 sm:flex-1` on the bar span.

**M2. Six unnamed progress bars on AI Visibility.** `AIVisibility.tsx:1859` renders `<Meter thick value=... />` with no `label`, and `Meter.tsx:30-36` then emits `role="progressbar"` with no accessible name (axe `aria-progressbar-name`, impact serious), so AC-12 cannot pass. Fix: pass `label={d.label}` (and the existing value text) or give Meter an `ariaLabel` prop and set it here.

### Medium

**M3. Inputs lose the focus ring, and the Prompts input has no 3:1 boundary.** `Prompts.tsx:402` `border border-line ... focus:outline-none focus:border-accent-ink`: the field edge is `--line` (1.22:1 on surface, below the 3:1 of WCAG 1.4.11; the spec reserves `--line` for decoration) and keyboard focus is only a 1 px border colour change. `Competitors.tsx:287, 293` keep `border-edge` but also drop the outline. Fix: remove `focus:outline-none` (the base `:focus-visible` rule then applies) and use `border-edge` on the Prompts fields.

**M4. Overview hero context contradicts the KPI beside it.** `Dashboard.tsx:248` prints "Score from 21 checks, all time." while the readout reads "Total Checks 23, In the selected window" with 7 days selected (`after-r2/overview-desktop-dark.png`). An all-time count smaller than a 7-day count reads as an error. The 21 is `view.mention.checked`, the latest answer per prompt and engine, not a count of checks. Fix (copy seat): name the basis, e.g. "Score from the latest answer for 21 prompt and engine pairs." The hero sentence also omits the window the spec template asked for (11.1), although here the rate is all-time, so the omission is accurate.

**M5. Text below 12 px in the shell (AC-19).** `index.css:755-757` bottom nav label 10 px weight 600 (spec 8: `meta`, 12); `Layout.tsx` sidebar progress, client switcher and market picker at 9 to 11 px (11 occurrences listed in AC-19). Fix: `.mobile-nav-label { font-size: 12px; line-height: 16px }` (78 px slots fit "Visibility" and "Sentiment" at 12 px) and `text-meta` for the sidebar strings.

**M6. Shared components still carry legacy palette classes (AC-14).** Counts in the AC-14 row; worst is `Layout.tsx` (149). They render correctly because the bridge covers them, so this is spec debt, not a visible defect, but commit B (deleting the bridge) cannot happen while they remain. Fix: token sweep of `Layout.tsx` sidebar blocks first, then `McpAccessSection`, `PromotionsPanel`, `AdminBell`, `ClientBanner`, `SupportWidget`.

**M7. Filter chips are 32 px hit targets on phones (AC-26).** `Chip.tsx:24` `h-8 md:h-7`, no `::after` extension, unlike `EngineChip` (`.engine-chip::after`, `index.css:712-716`) and `IconButton`. Note the spec conflicts with itself (7.4 says 32 below 768, 13.3 and AC-26 say 44); WCAG 2.5.8 (24 px) passes. Fix: `relative after:absolute after:-inset-1.5 md:after:hidden` as in IconButton, or rule the spec conflict.

**M8. SegmentedControl pressed state is 1.14:1 (dark) and 1.18:1 (light) against its track, with no border.** `SegmentedControl.tsx:41` track `bg-surface-3`, `:56` pressed `bg-surface shadow-raised`. Spec 7.4 asks for a `bg-surface-2` track with a `--line` border and a pressed segment with a 1 px `--edge` border (13.2 lists edge at 3.06 to 3.65). In dark the raised shadow is invisible on near-black, so selection rests on text weight and ink vs ink-2. Fix: add `border border-edge` to the pressed segment (and `border border-transparent` to idle ones so nothing shifts), track per spec. Radiogroup semantics themselves are correct (see section 4).

**M9. AI Visibility "Where you do not appear yet" opens by default; section toggles no longer reset on client switch.** `AIVisibility.tsx:810-815` returns `true` for every section except `unchecked`, so the 11-row list is expanded (`after-r2/ai-visibility-desktop-dark_2` crop; page height 3194 vs 3034 before, against graft G3's goal). Spec 11.2.5 says collapsed. Also: at HEAD the toggle wrote `setSectionOpen` (HEAD line 2617); now `Disclosure` owns its state, so `setSectionOpen({})` on client switch (`:606`) no longer closes a section the previous client opened. Fix: `defaultOpen={false}` for `notYet`, and key each section Disclosure by `activeClientId` so it remounts on switch.

**M10. "The most named competitor" is asserted on a four-way tie.** `Competitors.tsx:353-354`: "the most named competitor, Lantern Table Co, 1 time" while four competitors have 1 mention each (`after-r2/competitors-desktop-dark.png`, table rows). The superlative is not supported by the data shown on the same screen. Fix: when the top count is shared, say so ("4 competitors named once each") or name the tie.

**M11. AI Visibility shows two denominators one card apart (PRE-EXISTING data semantics, newly adjacent).** Hero "recommended in 9 of 20 prompts" (`AIVisibility.tsx:1548`) and the Gemini tile "48%, 10 of 21 prompts" (`after-r2/ai-visibility-desktop-dark_0`). The prompt list counts 20 active prompts; the engine tile counts 21 answered rows, including the prompt "best outdoor event caterer for 150 guests", which appears on Mentions and Prompts but not in the AI Visibility lists. Before the redesign these sat 600 px apart; now they share a viewport. Not caused by this change (data layer identical to HEAD). Route to bg-architect for one definition of the denominator; not blocking this release on its own.

### Low

- **L1** AC-7 literal: reword the two comments at `index.css:344, 452` so the command returns 1.
- **L2** AC-8: delete `.card-hover-lift` and its `html.light` hover rule (`index.css:481-494`, and the reduced-motion entry at `:504-508`): zero call sites. Also dead: `.time-pill*` (`:665-699`), `.border-nav-40`, `.bg-surface-nav-95`, `.text-rail-active`, `.bg-sentiment-*-15` (0 call sites each).
- **L3** AC-32: `Typography.tsx:33` comment contains an em dash. Replace with a colon.
- **L4** Disclosure chevron jumps beside the count below 640 when a summary exists: `Disclosure.tsx:36` hides the summary below `sm` but `:40` drops `ml-auto` whenever a summary is passed. Visible in `after-r2/ai-visibility-mobile-dark_3` ("Could not be checked 4" with the chevron next to the badge, while "What the symbols mean" has it at the edge). Fix: chevron always `ml-auto`, summary `sm:ml-auto` with the chevron `sm:ml-0`.
- **L5** Disclosure titles truncate: `Disclosure.tsx:33` `truncate`; `after-r2/overview-mobile-dark.png` reads "Show engine breakdown and recent ac...". Allow wrapping below `sm`.
- **L6** Competitors phone list: the "you" row tint stops 32 px short of the right edge (`Competitors.tsx:458` `w-full -mx-4 px-4`; `after-r2/competitors-mobile-dark_1`). Use `w-[calc(100%+2rem)]` or tint the `li`.
- **L7** Mentions prompt titles are one line with ellipsis at 390 (`Mentions.tsx:256` `truncate`; `after-r2/mentions-mobile-dark_0`); spec 11.4 says 2-line clamp at 390. Use `line-clamp-2 md:line-clamp-1`.
- **L8** Status badges have no glyph: HeroAnswer's `badge` prop has no glyph slot (`HeroAnswer.tsx:16, 52`), and `heroGlyph` in `AIVisibility.tsx:1543-1545` is computed and never used. Words carry the meaning, so not a WCAG failure; spec 7.4 asks for glyph plus word.
- **L9** Result cell rank wears `--pos-ink`, not ink (`PromptResultCell.tsx:47`), against C1 and 7.5. Contrast is fine (7.49 / 6.52).
- **L10** Grammar: "1 of 1 engines" on every appearing prompt (`AIVisibility.tsx:1408` via `formatRatio` `format.ts:35-37`, PRE-EXISTING at HEAD line 1482); "24 prompts x 1 engines" (`AIVisibility.tsx:2482`); "the 1 AI answers ... are positive" when total is 1 (`BrandSentiment.tsx:229`). Fix: pluralise the noun in `formatRatio` and the two templates.
- **L11** Repeated numbers and labels: Recommendations shows "2 actions" three times (header badge, hero value, "Priority actions 2"; `after-r2/recommendations-desktop-dark_0`); Mentions value "10 mentions" then "named your brand 10 times"; Fix this "12" badge plus "12 actions to improve your score"; Competitors subtitle and hero context both say "across 21 AI responses".
- **L12** Unit spacing and casing: Stat prints "48 %" with a 4 px gap (`Stat.tsx:57`, spec 12.1 "no space before %"); Title Case KPI labels from i18n ("Mention Rate", "Total Checks"), "Category Breakdown" (`AIVisibility.tsx:2481`) and uppercase "Included runs" (`:1753`) against G8 sentence case; brand fallback "Your brand" capitalised mid-sentence on Competitors (`Competitors.tsx:64`) vs "your brand" elsewhere (demo only).
- **L13** Light sentiment pos vs neu under tritanopia is 4.97 (`#58870f` vs `#71717a`); the spec's gate ignores tritan. SplitBar has glyph plus word, so legible; recorded for the palette owner.
- **L14** Hygiene: untracked `src/pages/_dash_logic.txt` (builder scratch, dated 2026-11-09 08:36) must not ride in the commit; commit by pathspec.
- **L15** Hero cards with no visual keep `min-h-[240px]`/`[280px]` (`HeroAnswer.tsx:40`), leaving 80 to 120 px of empty card on Mentions, Competitors and Recommendations (`after-r2/mentions-desktop-dark_0`, `competitors-desktop-dark.png`). Apply the min height only to the empty and loading states.
- **L16** W / M / Q segments expose single letters as accessible names (`BrandSentiment.tsx:293-297`, `Competitors.tsx`); add `aria-label` "Weekly", "Monthly", "Quarterly" (needs an optional per-option label in SegmentedOption).
- **L17** Static EngineChip (the `<span>` variant) has the same bordered look as the interactive filter chip (`EngineChip.tsx:58-64`), so "Gemini" in Sentiment "By engine", Mentions rows and Recommendations reads as a button.

### Info

- **I1** Visible on screen but PRE-EXISTING claim: `/prompts` subtitle "24 prompts - checked across all major LLMs" (i18n `pr_titleCount`, `i18nContext.tsx:294`) while the demo plan checks one engine; shown whenever the allowance meter is hidden (`Prompts.tsx:409`). Copy seat.
- **I2** `src/lib/mockData.ts` changed outside both lanes: mojibake fixed (spec F1) and demo sentiment now varies by rank (line 208). Consequence: before and after screenshots are not numerically comparable (Overview score 72 to 66, Sentiment dimension 100% to 60%, Sentiment page 100 to 60). Demo only (`isDemoMode`), production unaffected.
- **I3** `netlify/functions/unlock-audit-report.js` is modified in the tree (UTM and referrer fields). Not part of Phase 3 and not reviewed here; keep it out of the Phase 3 commit.
- **I4** SegmentedControl slide replaced by a CSS colour transition (`SegmentedControl.tsx:6-9, 55`): acceptable. Spec section 10's job ("confirm the new window") is met by the colour and weight change in 180 ms, reduced motion is honoured (`motion-reduce:transition-none`), and keeping `motion` out of the entry chunk is the right trade. The real gap is the pressed-state contrast, M8.
- **I5** Active nav icon is `--accent-ink` (`index.css:655`); spec 8 says ink. Harmless (it sits next to the rail, "where the user is").
- **I6** Main chunk +4.76 kB raw (orchestrator figure, not measured here); the spec sets no bundle budget for this phase.
- **I7** `tokens_sync.test.js` header cites "section 4.9", which does not exist (4.8 is the last); `planConfig.ts:286` comment cites "spec 17 V1/V2". Comment hygiene.
- **I8** Stale comments in `index.css:366-375` (scrollbar thumb "rgb(100 116 139)", now `--border-nav` = `#666a75`) and `Layout.tsx:1105-1112` (`#0d1425`).

## 3. Behaviour preserved

- Run Collection, Reload, Force Refresh, Engines: buttons present with the same handlers (`AIVisibility.tsx:1615-1662`); `runSinglePrompt` 2 references now and at HEAD; "Check now" 3 and 3; CSV export 5 and 5 (AIVisibility), 2 and 2 (Competitors); fix-state wiring 11 and 11; Prompts archive 1 and 1; client-switch guard identifiers (`isStale`, `activeClientId`) equal counts on all 7 pages. Tests: `client_switch_guards 14`, `fix_states 28`, `csv 11`, `prompts_archive 8`, `page_sequencing 29`, all green.
- Sort: segmented at >= 768, native select below (`after-r2/ai-visibility-mobile-dark_2`).
- Filters: category chips, engine chips, sentiment chips, Mentions selects with `aria-label` (`Mentions.tsx:205, 211`).
- One behaviour change found: section open state on AI Visibility (M9).
- No Phase 2 file, query, view or dependency changed (section 0).

## 4. Accessibility

- Contrast: all 56 text cells and 24 listed pairs reproduce the spec within 0.05 from the shipped token values; lowest text pair 4.97 (ink-3 on surface-3, dark). New pairs I added: bottom nav idle label ink-2 on surface 7.26 / 7.38 (the build uses ink-2, stronger than the spec's ink-3); focus ring on canvas, surface, surface-2, surface-3 = 7.23 / 6.93 / 6.56 / 6.09 dark, 6.65 / 7.10 / 6.49 / 6.05 light; chip idle border edge on surface 3.49 / 3.65. Runtime measurement not done.
- DeltaE (OKLab x100, Machado 2009, severity 1.0): 7 live engines adjacent normal 17.09, protan 7.72, deutan 8.35, tritan 8.92; all pairs normal 13.17, protan 4.03, tritan 2.72 (hence rule C8; I found no engine-coloured crossing lines in the 7 pages, only bars, chips and swatches). 10-engine adjacent deutan 6.51. You vs field 21.81 / 23.31 normal, deutan 19.87 / 20.54.
- Focus: one base `:focus-visible` rule (`index.css:337-340`, duplicated unlayered at `:427-430`); suppressed on the inputs listed in M3.
- Active nav: three cues (surface-3 fill, ink 600, accent-ink rail 6.09 / 7.23 dark); AC-18 pass.
- SegmentedControl semantics: `role="radiogroup"` with `aria-label`, `role="radio"`, `aria-checked`, roving `tabIndex`, arrow keys move and select with focus following (`SegmentedControl.tsx:30-53`). Correct per the ARIA radio pattern; Home and End are not handled (optional). Contrast of the pressed state: M8.
- Touch targets below 768: Button and SegmentedControl 44, IconButton 44 via pseudo, EngineChip 44 via pseudo, bottom nav 78 x 64, Disclosure 48; Chip 32 (M7); AIVisibility score info button about 26 (`AIVisibility.tsx:1820`, pre-existing).
- Headings: Overview h1, h2 "What to do next", sr-only h2 "Key metrics", Disclosure h2 with h3 inside; Sentiment h1 then h2 By engine, Over time, Recent signals; AI Visibility h1, sr-only h2 "AI Visibility Score", h2 Engines, Fix this, Your prompts, Disclosures as h2, h3 inside Competitors and categories. No skipped level found by reading; not verified with a DOM outline.
- HeroAnswer puts `aria-label` on a `<p>` (`HeroAnswer.tsx:47`), which ARIA 1.2 does not allow on the paragraph role and most screen readers ignore; harmless because the visible text is read. The label is "72%" style rather than the spec's "72 out of 100".

## 5. Copy marked `// copy: pending bg-copy` (for the copy seat)

54 markers: AIVisibility 17, Recommendations 10, Competitors 8, BrandSentiment 5, Layout 3, Mentions 3, Prompts 3, Dashboard 2, TrendDelta 1, ScoreDial 1, SplitBar 1. The strings:

- Overview (`Dashboard.tsx:244-248`): "Your brand is named in {pct}% of the AI answers checked." / "Your brand has not been checked yet."; "Score from {n} checks, all time." (see M4).
- AI Visibility: badge "Not measured yet" (`:1538`); empty "No prompts yet", "Add prompts" (`:1788, 1790`); "Engines" (`:1872`); engine badges "Known", "Partial", "Missing", "Not checked yet" (`:1878-1881`); "Coming soon: {list}" (`:1993`); "Locked on your plan" (`:2001`); "Fix this", "Hide"/"Show" (`:2032, 2044`); chip group label "Category" (`:2226`); "What the symbols mean" (`:2338`); "{n} prompts, no engine named your brand" (`:2408`); "Competitors and categories" and its summary "{k} competitors named, weakest category {name} at {n}%" (`:2459-2460`).
- Sentiment (`BrandSentiment.tsx`): empty "Sentiment appears once an AI answer mentions your brand." (`:215`); "{p}% of the {n} AI answers that mention your brand are positive." (`:229`, plural at n=1, L10); "Score from the latest answer per prompt and engine, across all time: {n} AI answers that mention your brand." (`:231`); "Answers that mention your brand {window}." (`:335`); "No signals {window}. The score above covers all time." (`:376`). The two scopes are now stated on screen (hero "across all time", feed "in the last 7 days" plus the widen hint), which answers the scope question in the brief. The badge text "Mixed / Neutral" (`after-r2/sentiment-desktop-dark.png`) reads as two labels; worth a look.
- Mentions (`Mentions.tsx:179-194`): empty body; "AI engines named {brand} {n} times, at an average position of #{avg}."; "{k} of them positive. Latest answer per prompt and engine."
- Competitors (`Competitors.tsx:312-356, 342, 486, 531`): subtitle "Top competitors mentioned across {n} AI responses for {brand}" / "No responses measured yet."; empty body; hero "AI engines named {brand} {n} times; the most named competitor, {top}, {k} times." (M10); context "across {n} AI responses, {engines}"; "Not enough data yet" lines.
- Recommendations (`Recommendations.tsx:704-707, 755, 776, 789-790, 824, 891, 964`): badges "{n} engines unavailable", "{n} engines below 50%", "All engines above 50%"; error explanation; "Actions are generated after your first collection."; "Start with: {title}." (double period if a title ends in one) / "No priority actions right now."; "Generated from {n} successful AI checks"; the AI analysis empty text; the "Prose only" note.
- Prompts (`Prompts.tsx:448, 455-456, 577`): cap notice titles "You have used all {cap} prompts on {plan}." / "This client is at its plan limit ({used} of {cap})."; "No prompts yet".
- Shell and components: `Layout.tsx:280-282` short labels "Visibility", "Sentiment", "Mentions"; `:1115` time strip caption; `:1180` "More"; `TrendDelta.tsx:32` "First measurement"; `ScoreDial.tsx:49` "Not measured yet"; `SplitBar.tsx:19-20` "Positive", "Neutral", "Negative".

## 6. Regression surface (found by grep)

- `src/components/ui/*` is imported by the 7 pages plus `EmptyState`, `RouteSkeleton`, `Layout`; `buttonClasses` by `EmptyState` and Dashboard links.
- `tailwind.config.js` `textColor.white` and the slate/brand bridge recolour every out-of-scope route in light mode by design; manual look owed on Prospects, Revenue (`Revenue.tsx:1195` still `bg-brand-500`), Onboard (`Onboard.tsx:466`), AffiliatesAdmin, Social, SEO, Tickets, the auth screens and OAuth in light mode (AC-9).
- `--dark-*` aliases now point at the new neutrals, so every `bg-dark-*` card on those routes changed surface; `after-r2/account-*` is the only out-of-scope route screenshotted.
- `index.css` `.nav-item`, `.mobile-nav-item`, `.engine-chip` serve the affiliate portal shell too (`Layout.tsx:1145-1156`); not screenshotted.

## 7. What was not checked

- Nothing in a browser (orchestrator rule): AC-9, AC-11, AC-12, AC-20, AC-21, AC-22 (exact), AC-23 (beyond screenshots), AC-25, AC-27, AC-28, AC-29 and runtime contrast (AC-13) are unverified. The phone screenshots of AI Visibility are capped at 6000 px, so the bottom of that page at 390 was not seen.
- `npm run build` and the bundle size (orchestrator figures taken as reported).
- Languages other than English, including whether German or Dutch bottom nav labels truncate.
- Real tenant data: every screenshot is the demo fixture, which itself changed in this tree (I2); no view as a viewer, no admin view, no empty fixture.
- Light mode of the 18 out-of-scope routes beyond Account.
- `unlock-audit-report.js` (not part of this change).
- Process note, disclosed: I ran one `git diff --stat` early, outside the "git show only" rule (read-only, no state changed); and one shell redirect briefly created `C:\Users\const\Constantin Daniel Goane\_x` (a copy of HEAD's `index.css`), which I deleted at once. No reviewed file was touched.

## 8. Fix routing

All to **bg-app** (Sonnet is enough; presentation only), one round, then re-verify the failing rows: M1, M2, M3, M5, M7, M8, M9, L1 to L9, L14 to L17 in the files named. M6 is the commit B prerequisite and can be its own pass. **bg-copy**: M4, M10, L10, L11, L12, I1 and section 5. **bg-architect**: M11 (one denominator for "prompts" vs "answered rows"). **bg-design**: the spec conflict behind M7 (7.4 vs 13.3) and whether tritan belongs in the sentiment gate (L13).
