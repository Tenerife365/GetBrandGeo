VERDICT: PASS WITH FINDINGS. All seven acceptance criteria that failed in the first review now pass on code and on the after-r3 screenshots; both majors and every medium in scope are closed. What remains is low and info (four partial or open low items for bg-app, copy items for bg-copy, two pre-existing literal exceptions). No security finding, no regression found against after-r2, Phase 2 data layer byte-identical to HEAD.

# Phase 3 visual upgrade, re-review after the fix round

**Reviewer:** bg-verify (Opus), read-only. **Date:** 2026-11-09. **Subject:** the uncommitted Phase 3 working tree in `brandgeo-dashboard/` after the fix round, against `docs/design/phase3-visual/phase3-visual-spec.md` and the first review `docs/qa/phase3-visual-review-2026-11-09.md`. **Scope written:** this file only. No reviewed file was edited.

```
INTENT: re-review Phase 3 visual (fix round r3)  |  SCOPE: docs/qa/ (write), read-only elsewhere  |  MODEL: opus  |  STOP AFTER: /verify
```

Orchestrator rulings applied as given and not re-opened: M7 is satisfied by a 44 px hit area by extension with a 32 px visual; M11 goes to bg-architect; tritan in the sentiment gate is recorded only (L13); M4 and M10 are judged on fact only, final wording by bg-copy.

## 0. What I ran

| Check | Result |
|---|---|
| `npx tsc --noEmit` (brandgeo-dashboard) | `tsc exit 0` |
| All node test files, one by one | `files pass=50 fail=0`; `tokens_sync`: `115 passed, 0 failed` |
| `npm run build` | not run (orchestrator rule); orchestrator reports build ok, main chunk 569.21 kB vs 564.9 kB before the redesign (+4.31 kB, down from +4.76 at r2) |
| Phase 2 data layer vs `git show HEAD:` (CR stripped, md5) | `IDENTICAL` for `src/lib/metrics.ts`, `resultsLoader.ts`, `resultsContext.tsx`, `resultsGuards.ts`, `historyRead.ts`, `motion.ts`, `package.json`, and all six `src/lib/views/*` (`aiVisibilityView`, `competitorsView`, `dashboardView`, `mentionsView`, `recommendationsView`, `sentimentView`) |
| Supabase reads per page vs HEAD | `.from('...')` multiset `SAME` on all 7 pages (e.g. AIVisibility `ai_results, client_api_keys, collection_runs, fix_states x5, oauth_grants`; Prompts `clients, plan_prompt_caps, prompts x5`); `runSinglePrompt` 2 and 2, `Check now` 1 and 1, `downloadCsv` 2 and 2 in AIVisibility |
| Changed files vs HEAD (content compare, 84 files) | same set as r2 minus `src/pages/_dash_logic.txt` (gone); 4,811 added lines built from `diff` against `git show HEAD:` |
| Secret scan over added lines | 234 matching lines: design "token"/"Token" words and the filename `ResetPassword.tsx`; key-shaped strings (`sk-`, `pk_live`, `eyJ...`): 0. No value printed |
| Dash scan on added lines, `rg` with a class of U+2014 and U+2013, positive control | control file: 1 hit. Added lines: 2 hits, both in `netlify/functions/unlock-audit-report.js` (another session's work, I3, not Phase 3). Phase 3 files: 0 |
| Screenshots | after-r3 (32 files) compared to after-r2 pixel by pixel (PIL `ImageChops`), changed bands located, then every changed region viewed; mobile tiles viewed r2 and r3 side by side. Source mtimes: last edit 09:37 (`Meter.tsx`, `AIVisibility.tsx`), shots 09:38 to 09:40, so the shots show the reviewed code |

## 1. Acceptance criteria re-run (the rows that changed)

| AC | Result | Evidence |
|---|---|---|
| AC-7 | PASS | `rg -c "!important" src/index.css` returns `1`; the one line is `index.css:472 position: fixed !important;` (`.skip-link:focus`). The two comments were reworded ("the important flag") |
| AC-8 | PASS | `rg -n "html\.light \." src/index.css` returns nothing (exit 1); `.card-hover-lift` rules removed |
| AC-14 | PASS for this change; literal exception pre-existing | Legacy palette regex `(text\|bg\|border)-(white\|slate\|brand\|violet\|...)`: 0 in all 7 pages, 0 in `src/components/**` (was 149 in `Layout.tsx` alone, plus McpAccessSection 91, PromotionsPanel 48, SupportWidget 27, AdminBell 26, ClientBanner 12). Hex in the 7 pages: 0. Hex in components: only logo marks on unchanged lines, `BrandGeoLogo.tsx` (22 at HEAD, 22 now) and `SocialAuthButtons.tsx` (Google G and LinkedIn blue, 5 at HEAD, 5 now), plus one comment `Layout.tsx:1108`. See N3 |
| AC-19 | PASS for this change; literal exception pre-existing | No `text-[8..11px]` or sub-12 rem size in components or the 7 pages; `.mobile-nav-label` now `font-size: 12px; line-height: 16px` (`index.css:731-734`); `.time-pill` 0.75rem; chart ticks and tooltip 12. Weights: tailwind caps bold, extrabold, black at 600 (`tailwind.config.js:88-92`); the only computed 700 is the signed-off logo wordmark, inline style `BrandGeoLogo.tsx:176`, identical at HEAD. See N3 |
| AC-26 | PASS by code (runtime not measured), one pre-existing exception | Chip: `relative ... h-8 md:h-7` plus `after:absolute after:-inset-1.5 md:after:hidden` (`Chip.tsx:27-28`), 32 visual, 44 hit, per ruling. Button `max-md:min-h-[44px]` both sizes (`Button.tsx:21`); SegmentedControl `max-md:min-h-[44px]` (`SegmentedControl.tsx:56`). Row actions unchanged from r2 (visible, tabbable). Exception: the AI Visibility score info button is 12 px plus `after:-inset-[7px]`, 26 px, identical at HEAD line 1820 (N2) |
| AC-30 | PASS by code (runtime not measured), one pre-existing exception | `focus:outline-none` is gone from every input in scope (`Prompts.tsx:402`, `Competitors.tsx:288, 294`, AIVisibility admin toggle); a backstop `input:focus-visible:focus-visible, textarea..., select...` restores the 2 px accent-ink outline above any utility (`index.css:436-444`, specificity 0,2,1 beats 0,2,0). Remaining `focus:outline-none` hits all carry `focus-visible:ring-2 ring-accent-ink` (`Layout.tsx:542`, `BrandGeoLogo.tsx:210`, `McpAccessSection.tsx:788`) or are programmatic `tabIndex={-1}` targets (`Layout.tsx:1128` main, McpAccess headings). Exception: view-as-user Exit button uses `ring-warn` (`Layout.tsx:1081`, identical at HEAD, admin only) (N2) |
| AC-32 | PASS | Added lines in Phase 3 files: 0 dashes (control fired). `Typography.tsx` still has dashes at lines 7, 10, 49, all present at HEAD (lines 7, 10, 49); the line 33 dash added at r2 is now a colon |
| M8 ratio | PASS | Pressed segment is `bg-surface border-edge shadow-raised`, idle `border-transparent`, track `border-line bg-surface-2` (`SegmentedControl.tsx:43, 58`). Measured: edge on surface-2 3.30:1 dark (`#666a75` on `#16171e`), 3.34:1 light (`#85858f` on `#f4f4fb`); edge on its own surface fill 3.49 / 3.65. Was 1.14 / 1.18. Visible in `after-r3/sentiment-mobile-dark.png` (W) and the mobile time strip on every route |

Rows not listed keep their first-review result. Still NOT CHECKED (need a browser or the pre-Lane-1 snapshot): AC-9, AC-11, AC-12 (axe), AC-20, AC-21, AC-22 exact, AC-23 beyond screenshots, AC-25, AC-27, AC-28, AC-29. M2's code fix removes the one violation the first review predicted for AC-12; it is not proven by axe.

## 2. Prior findings, one by one

### Major and medium

| Id | Status | Evidence |
|---|---|---|
| M1 sentiment bar gone below 640 | CLOSED | `BrandSentiment.tsx:267` `flex h-2 w-full flex-none ... sm:w-auto sm:flex-1`; `after-r3/sentiment-mobile-dark.png` and `-light.png` show the Gemini bar under the chip (r2 showed none) |
| M2 unnamed progress bars | CLOSED (code) | `Meter.tsx:12, 38` new `ariaLabel` prop, `aria-label={ariaLabel ?? (string label)}`; `AIVisibility.tsx:1859` passes `ariaLabel={d.label}`; other Meter call sites pass a string `label` (`Dashboard.tsx:258`, `AIVisibility.tsx:2488-2494`). `null` value renders no role. Not run through axe |
| M3 input focus ring and 3:1 boundary | CLOSED | `Prompts.tsx:402` `border border-edge ... focus:border-accent-ink` with no `outline-none`; `Competitors.tsx:288, 294` `border-edge`, no `outline-none`; backstop rule `index.css:436-444` |
| M4 hero context vs KPI | CLOSED on fact | `after-r3/overview-desktop-dark.png`: "Score from the latest answer for 21 prompt and engine results, all time." beside "Total Checks 23, In the selected window": the two numbers now name different bases. Wording to bg-copy |
| M5 text below 12 px | CLOSED | AC-19 row; bottom nav labels visibly larger in every after-r3 mobile shot, "Visibility", "Sentiment", "Mentions" not truncated at 390 (English) |
| M6 legacy classes in components | CLOSED | AC-14 row: 0 across `src/components/**`. Commit B (bridge deletion) is no longer blocked by components; out-of-scope pages still use the bridge |
| M7 chip hit area | CLOSED per ruling | `Chip.tsx:27-28`. Note for the record, not a finding: in a `gap-2` ChipGroup the 6 px extensions of neighbours overlap by 4 px; the later chip takes the click |
| M8 segmented pressed state | CLOSED | M8 row above |
| M9 notYet open by default, no reset on switch | CLOSED | `AIVisibility.tsx:810-815` notYet and unchecked open only when no other section exists; Disclosures keyed `notYet-${activeClientId}`, `unchecked-...`, `legend-...`, `cats-...` (`:2338, 2410, 2424, 2461`). `after-r3/ai-visibility-desktop-dark.png` "Where you do not appear yet 11" collapsed; page height 2681 vs 3194 at r2 and 3034 before the redesign (G3 met) |
| M10 superlative on a tie | CLOSED on fact | `Competitors.tsx:267, 355-357`: tie branch "4 competitors were each named 1 time."; `after-r3/competitors-desktop-dark.png` matches the four rows of 1. Wording to bg-copy |
| M11 two denominators | ACCEPTED, routed to bg-architect | Unchanged by design ("9 of 20 prompts" hero, "10 of 21 prompts" Gemini tile, `after-r3/ai-visibility-desktop-dark.png`) |

### Low

| Id | Status | Evidence |
|---|---|---|
| L1 AC-7 comments | CLOSED | AC-7 row |
| L2 dead CSS | PARTIAL | `.card-hover-lift` and its light rule gone (AC-8 pass). Still dead with zero call sites: `.time-pill*` (5 rules from `index.css:641`), `.border-nav-40`, `.bg-surface-nav-95`, `.text-rail-active`, `.bg-sentiment-*` (5). Hygiene, can ride commit B |
| L3 Typography dash | CLOSED | AC-32 row |
| L4 chevron beside count | CLOSED | `Disclosure.tsx:40` chevron `ml-auto` always, `sm:ml-0` only when a summary shows; `after-r3/ai-visibility-mobile-dark.png` all four disclosures carry the chevron at the right edge |
| L5 Disclosure title truncates | CLOSED | `Disclosure.tsx:33` `sm:truncate`; `after-r3/overview-mobile-dark.png` "Show engine breakdown and recent activity" wraps to two lines |
| L6 "you" row tint short | CLOSED | `Competitors.tsx:461` `w-[calc(100%+2rem)]`; `after-r3/competitors-mobile-dark.png` tint reaches both edges |
| L7 Mentions one-line titles | CLOSED | `Mentions.tsx:256` `line-clamp-2 md:line-clamp-1`; `after-r3/mentions-mobile-dark.png` two-line titles |
| L8 badge glyph | PARTIAL | AI Visibility hero badge now "▲ Strong" (`AIVisibility.tsx:1543, 1796`, `HeroAnswer.tsx:16, 54` `glyph` slot). Still word only: Overview "Strong" (`Dashboard.tsx:242`), Sentiment "Mixed / Neutral" (`BrandSentiment.tsx:227`), Recommendations "1 engine below 50%" (`after-r3/recommendations-desktop-dark.png`). Not a WCAG failure (word carries meaning) |
| L9 rank in pos-ink | OPEN | `PromptResultCell.tsx:47` `mentioned: 'bg-pos-tint text-pos-ink'`, and the `#N` word span (`:132`, `font-semibold`, no colour class) inherits it; `after-r3/ai-visibility-desktop-dark.png` "#2" in green |
| L10 plural grammar | CLOSED | `AIVisibility.tsx:1408` passes `answered === 1 ? 'engine' : 'engines'` ("1 of 1 engine" in after-r3); `:2485` pluralises prompt and engine; `BrandSentiment.tsx:229` singular branch for n = 1 |
| L11 repeated numbers | PARTIAL, copy seat | Recommendations header badge removed and "Priority actions" carries no count (`after-r3/recommendations-desktop-dark.png`); Competitors context now "across 1 engine". Still repeated: Mentions "10 mentions" then "named your brand 10 times"; "Fix this 12" then "12 actions to improve your score" |
| L12 units and casing | PARTIAL | Fixed: "Category breakdown" (`AIVisibility.tsx:2484`), brand fallback "your brand" (`Competitors.tsx:64`). Open: Stat still `gap-1` between value and "%" ("48 %", `Stat.tsx:57-58`, `after-r3/overview-desktop-dark.png`); i18n Title Case "Mention Rate", "Total Checks" (`i18nContext.tsx:230, 242, 245`); `uppercase` "Included runs" (`AIVisibility.tsx:1753`) |
| L13 tritan light pos vs neu | ACCEPTED, recorded only (ruling) | unchanged |
| L14 `_dash_logic.txt` | CLOSED | file no longer exists |
| L15 empty hero floor | PARTIAL | Competitors lifts the floor below 768 only (`Competitors.tsx:350` `max-md:[&>*]:min-h-0`); `HeroAnswer.tsx:40` still applies `min-h-[280px] md:min-h-[240px]` to the populated card, so empty bottom space remains on Competitors desktop (about 70 px, `after-r3/competitors-desktop-dark.png`), Mentions phone and desktop (`after-r3/mentions-mobile-dark.png`, about 80 px), Recommendations desktop |
| L16 W/M/Q accessible names | OPEN | `SegmentedOption` has only `label` (`SegmentedControl.tsx:16-19`); `BrandSentiment.tsx:294-296`, `Competitors.tsx:522-524` still expose "W", "M", "Q" |
| L17 static EngineChip looks interactive | OPEN | `EngineChip.tsx:58-66` span variant keeps `border border-edge`; `after-r3/mentions-mobile-dark.png`, `sentiment-desktop-light.png`, `recommendations-desktop-dark.png` |

### Info

| Id | Status | Evidence |
|---|---|---|
| I1 "checked across all major LLMs" | OPEN, copy seat | unchanged (`i18nContext.tsx:294`) |
| I2 mockData changed | OPEN, info | still differs from HEAD; demo only |
| I3 `unlock-audit-report.js` modified | OPEN, info | still modified and carries 2 em dashes in added comments; keep it out of the Phase 3 commit (commit by pathspec) |
| I4 segmented slide replaced | ACCEPTED | |
| I5 active nav icon accent-ink | OPEN, harmless | unchanged |
| I6 bundle | info | +4.31 kB raw (orchestrator figure) |
| I7 wrong spec cites | OPEN | `tests/tokens_sync.test.js:1, 110` cite "section 4.9", which does not exist (4.8 is the last of section 4); `planConfig.ts:286` cites "spec 17 V1/V2", and section 17 is "Amendments to DESIGN-SYSTEM.md" |
| I8 stale comments | PARTIAL | `index.css:366-375` scrollbar comment now names `--border-nav` (closed); `Layout.tsx:1108` still cites `#0d1425` |

## 3. New findings from after-r3 and this pass

No blocker, major or medium. No regression versus after-r2: the pixel diff confined every change to the regions the fix round targeted (hero context line, sidebar market block and bottom bar labels, segmented controls, Disclosures, Competitors hero and list, Mentions titles, Recommendations header).

**N1, low. HeroAnswer's numeric `aria-label` concatenates value and unit with no space.** `HeroAnswer.tsx:47`: `` `${value}${typeof unit === 'string' ? unit : ''}` `` yields "10mentions" (Competitors, Mentions), "2actions" (Recommendations), "60/100" (fine). The label sits on a `<p>`, where ARIA 1.2 does not allow naming, so most readers ignore it (first review, section 4), but any that honour it read a run-together word. Fix: drop the `aria-label` from the `<p>` (the visible text is already read), or join with a space.

**N2, low, PRE-EXISTING. Two literal exceptions to AC-26 and AC-30, both identical at HEAD, not caused by this change, not blocking.** (a) AI Visibility score info button hit area is 26 x 26 (`AIVisibility.tsx:1820`, 12 px icon plus `after:-inset-[7px]`), below 44 on a phone; fix `after:-inset-4 md:after:-inset-[7px]`. (b) The view-as-user Exit button replaces the accent-ink outline with `focus-visible:ring-2 ring-warn` (`Layout.tsx:1081`); contrast is fine (9.00 dark, 7.79 light on warn-tint) and it is admin only, so this is a spec conformance point: drop `focus:outline-none` and the warn ring, or have bg-design record the exception.

**N3, info, PRE-EXISTING. AC-14 and AC-19 need a logo carve-out.** As written, both are failed by brand marks on unchanged lines: `BrandGeoLogo.tsx` gradient and ink hex plus the signed-off wordmark weight 700 (`:101-102, 151-165, 176`), and `SocialAuthButtons.tsx:27-30, 76` (Google G colours, LinkedIn blue, which the providers' brand rules fix). Route to bg-design to add "logo and third-party marks excepted" to AC-14 and AC-19; no code change.

**N4, low. Spinners in the shell ignore reduced motion.** `Layout.tsx:566, 990, 1099` `Loader2 className="animate-spin"` without `motion-reduce:animate-none`, while `Button.tsx:45` has it and `index.css:485-498` freezes only `animate-pulse` and `.skeleton`. With a collection or billing request in flight, AC-29 (`document.getAnimations()` empty under reduced motion) will fail. Fix: add `motion-reduce:animate-none` at the three call sites.

**N5, info, PRE-EXISTING (same in after-r2).** Locked engine columns on the AI Visibility table head show the unlock plan as the column caption ("Radar" under the Claude mark, "Essentials" under the ChatGPT mark, `AIVisibility.tsx:2382-2391`); the accessible name is correct (`lockedHeaderLabel(engine, plan)`, `:2386`), but a sighted reader sees two columns named after plans. "Essentials" also runs to the card's right edge at 1440 (`after-r3/ai-visibility-desktop-dark.png`, column capped at 3.5rem). For bg-design.

## 4. Fix routing

- **bg-app** (Sonnet, presentation only, one short round, none blocking): L9, L15, L16, L17, L8 remainder, L12 Stat gap, N1, N4, N2(a); L2 remainder and I7, I8 remainder with commit B or now.
- **bg-copy:** M4 and M10 final wording, L11 remainder, L12 casing, I1, and the 54 `copy: pending bg-copy` markers from the first review section 5.
- **bg-design:** N3 carve-out, N2(b) exception or fix, N5 column caption.
- **bg-architect:** M11 (unchanged routing).
- **Commit hygiene:** commit by pathspec; leave out `netlify/functions/unlock-audit-report.js` (I3) and keep `src/lib/mockData.ts` a deliberate choice (I2).

## 5. What was not checked

- Nothing in a browser (orchestrator rule): AC-9, AC-11, AC-12 (axe), AC-20, AC-21, AC-22 exact, AC-23 beyond the screenshots, AC-25, AC-27, AC-28, AC-29, and runtime contrast. M2, M3, AC-26 and AC-30 are closed by code reading, not by measurement.
- `npm run build` and bundle size (orchestrator figures).
- Light mode of the 18 out-of-scope routes beyond Account (Account in both themes shows only the sidebar text-size change versus r2).
- Languages other than English, including whether German or Dutch bottom nav labels fit at 12 px.
- Real tenant data, a viewer or admin session, an empty fixture; every screenshot is the demo fixture.
- The bottom of the AI Visibility page at 390 is now fully in the shot (5053 px); nothing was hidden this time.
- `unlock-audit-report.js` (not part of this change).
- Process note: no git command other than `git show HEAD:<path>` was run (plus `git cat-file -e` to test whether a path exists at HEAD, read-only); no reviewed file was touched. Scratch files live in my scratchpad only.
