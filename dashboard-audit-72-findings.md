# Task #72 — Dashboard Bug/UX Audit: Findings

**Date:** 2026-07-08
**Scope:** `brandgeo-dashboard/src` — all 11 pages, shared `Layout.tsx`/`App.tsx`, and the lib/context layer. Read-only audit — no fixes applied (task #83 is running in parallel and touches `Layout.tsx`/`App.tsx`).
**Files reviewed:** `Dashboard.tsx`, `AIVisibility.tsx`, `Competitors.tsx`, `Prompts.tsx`, `Recommendations.tsx`, `Mentions.tsx`, `Onboard.tsx`, `Usage.tsx`, `Login.tsx`, `Signup.tsx`, `ResetPassword.tsx`, `Layout.tsx`, `App.tsx`, `ScoreBadge.tsx`, `clientContext.tsx`, `marketContext.tsx`, `collectionContext.tsx`, `planConfig.ts`, `supabase.ts`, `themeContext.tsx`, `timeFilterContext.tsx`, `types/index.ts`.

**Note on #83 overlap:** `git status` shows `App.tsx`, `Layout.tsx`, and `i18nContext.tsx` as currently modified (uncommitted) plus a new untracked `pages/BrandSentiment.tsx` — task #83's in-progress work. This audit read the live files as they stand right now, so findings against those three files reflect #83's current WIP state, not the last-committed version. Re-check items #1 and #5 (both touch `Layout.tsx`) after #83 merges, in case its changes already address or shift them.

---

## Critical — functional bugs, real user impact

### 1. Global time filter (7d/30d/90d/All) does nothing on 6 of 7 pages it appears on
`Layout.tsx` (lines 341–356) renders a time-range filter bar on **every** authenticated page. Confirmed by grep that `useTimeFilter`/`timeRange` is only consumed in `Usage.tsx` — no other page (`Dashboard`, `AIVisibility`, `Competitors`, `Prompts`, `Recommendations`, `Mentions`) reads `timeRange` or `getStartDate()` at all. Clicking "7 days" anywhere except Usage & Costs has zero effect on the data shown — it's a fully non-functional, always-visible control.

### 2. New-client onboarding silently skips Claude and ChatGPT collection
`Onboard.tsx`'s own `runCollection` (lines 94–149) hand-rolls a collection loop that calls **only** `/.netlify/functions/collect-prompt` (Gemini/Perplexity/Meta). It never calls `collect-claude` or `collect-chatgpt`, unlike the shared `collectionContext.tsx` (`runCollection`/`runSinglePrompt`, used by `AIVisibility.tsx`) which correctly fires all three functions per the documented 3-function architecture. The completion screen (line 356) tells the admin "{total} prompts × 5 engines collected" — which is false; only up to 3 engines actually ran, regardless of the new client's plan. Every client onboarded through this wizard starts with incomplete initial data.

### 3. New/default market context is hardcoded to Romania
`marketContext.tsx` `loadSaved()` (line 202): `const mkt = MARKETS.find(m => m.id === oldId) ?? MARKETS[1] // default RO`. Any session with no saved market selection — i.e. every brand-new client, including ones onboarded via the public `/signup` flow for a non-Romanian brand — defaults to Romania as the geo context fed into collection. This is exactly the kind of hardcoded single-client assumption the Scalability Rule (CLAUDE.md §4.1) prohibits, left over from BpR.

### 4. Inconsistent sentinel-value handling skews the brand's own avg. position
`Competitors.tsx`: competitor `avgPos` filters out sentinel position `99` (line 122: `positions.filter(p => p !== 99)`), but `brandAvgPos` (line 134) averages `es.positions` with no such filter. If position `99` is ever written for the brand itself (used elsewhere as an "unranked" placeholder — see `Mentions.tsx` demo sort `?? 99`), the brand's displayed average position would be wrongly inflated while competitors' are correctly cleaned.

---

## Medium — design-system / coding-guardrail violations

### 5. Teal used for interactive "active" states — violates the documented brand rule
CLAUDE.md §4.2: "Never revert to teal/green as a primary brand color." Found live in code:
- `AIVisibility.tsx:54` — `location` category color `bg-teal-500/20 text-teal-300`
- `AIVisibility.tsx:880, 901` — the *selected* category-filter button uses `bg-teal-500 text-white border-teal-600`
- `Prompts.tsx:12` — `local` category color `bg-teal-500/20 text-teal-300`

### 6. `as any` casts — violates the documented TypeScript guardrail
CLAUDE.md §4.4: "Never cast `as any`." Found:
- `Dashboard.tsx:71–72` (demo-mode mock data mapping)
- `Mentions.tsx:197` — `setFilterCat(cat as any)`
- `Mentions.tsx:236` — `<SentimentDot value={m.sentiment as any} />`

### 7. `PromptCategory` shared type is out of sync with what the app actually uses
`types/index.ts` defines `PromptCategory` with 8 values. But `Prompts.tsx`, `AIVisibility.tsx`, `Mentions.tsx`, and `Recommendations.tsx` each maintain their **own**, mutually-inconsistent `CATEGORY_LABEL`/`CATEGORY_META` dictionaries with extra keys not in the shared type at all (`local`, `comparison`, `use_case` in Prompts; `wedding`, `galas`, `quality`, `location`, `competitive`, `portfolio`, `corporate`, `large_scale` in AIVisibility/Recommendations). `Prompts.tsx` then force-casts free-form strings to `PromptCategory` (`e.target.value as PromptCategory`), defeating the type. Violates §4.4 ("shared types in `types/index.ts`, not inline") and creates real category-label drift between pages (see #17 below).

### 8. i18n coverage is inconsistent — most of the app ignores the language switcher
Only 4 of 11 pages import `useI18n()`: `Dashboard.tsx`, `AIVisibility.tsx`, `Prompts.tsx`, `Mentions.tsx`. **`Competitors.tsx`, `Recommendations.tsx`, `Onboard.tsx`, `Usage.tsx`, `Login.tsx`, `Signup.tsx`, `ResetPassword.tsx` are 100% hardcoded English** — every string, despite the sidebar language switcher (task #42) advertising EN/ES/DE/FR/NL/RO+ support. A non-English viewer switching languages will see roughly two-thirds of the app not translate.

### 9. Competitor-name filter logic (`GENERIC_TOKENS`) duplicated a 2nd/3rd time on the frontend
CLAUDE.md §2.1 already tracks `analyseResponse` duplication across 3 backend functions as a known limitation. The same pattern exists un-tracked on the frontend: the `GENERIC_TOKENS` array + `isLikelyCompanyName`/`isCompanyName` logic is copy-pasted verbatim in both `Competitors.tsx` and `Recommendations.tsx` (and must stay in sync with the backend's `NOT_A_COMPANY`).

### 10. Dead/orphaned code from the pre-multi-tenant single-client architecture
CLAUDE.md's pending item #102 already tracks dead **database** tables (`search_queries`, `page_analysis`, etc.). The same legacy layer exists in the frontend and isn't tracked: `ScoreBadge.tsx`'s `ClassificationBadge` and `GeoScoreRing` components, and `types/index.ts`'s `Classification`, `SearchResult`, `PageAnalysis`, `Mention`, `DashboardStats` types, are not imported or used anywhere in any of the 11 current pages (confirmed via repo-wide grep).

---

## Low — polish / consistency

11. **No confirmation on destructive actions** — `deletePrompt` (`Prompts.tsx`) and `deleteManual` (`Competitors.tsx`) delete immediately on click, no "are you sure" / undo.
12. **Inconsistent date formatting** — `Dashboard.tsx` hardcodes `.toLocaleDateString('en-GB')`; `AIVisibility.tsx` and `Mentions.tsx` call `.toLocaleDateString()` with no locale (browser default). Same data can render two different date formats depending on which page you're on.
13. **Hardcoded copyright year "2026"** in `Login.tsx` and `ResetPassword.tsx` footers instead of `new Date().getFullYear()` — will silently go stale.
14. **Demo mode gap in "Forgot password"** — `Login.tsx`'s `handleLogin` explicitly short-circuits for `isDemoMode`, but `handleForgot` does not, so in demo mode it calls the real Supabase `resetPasswordForEmail` against the placeholder client instead of being stubbed like the rest of the page.
15. **Engine logos depend on a live third-party favicon endpoint** — every `ENGINE_META.logoUrl` in `planConfig.ts` points at `google.com/s2/favicons?...`. No hosted fallback; low-resolution/inaccurate brand marks; breaks if Google's favicon service is blocked or down (plausible in some corporate networks).
16. **Garbled character in a console warning** — `supabase.ts:7` — `'Supabase env vars not set â running in demo mode...'` — encoding artifact (should likely be an em dash), worth checking other files for the same corruption.
17. **`Mentions.tsx` category filter is a fixed, non-dynamic list** — hardcoded to 8 categories (`CATEGORY_LABEL`), unlike `AIVisibility.tsx` which derives filter categories from the client's actual prompts. Any client using categories like "wedding," "portfolio," "corporate" (already seen in other pages' maps) gets no filter button for them on the Mentions page, even though matching mentions appear in the list.
18. **Dead field reference** — `Mentions.tsx:106`: `llm: r.engine ?? r.llm` — `ai_results` has no `engine` column per the documented schema (only `llm`); harmless due to `??` but confusing leftover.
19. **Inconsistent timeout handling in AI Discover chat** (`Prompts.tsx`) — `sendMessage` wraps its fetch in a 30s `AbortController` timeout; the auto-triggered `autoGeneratePrompts` (fired right after onboarding) has no timeout at all, so a stalled `suggest-prompts` function call there just hangs with no recovery.
20. **No pagination anywhere** — `Dashboard.tsx` caps at `.limit(1000)` ai_results rows silently; Prompts list and Usage per-client table render every row with no paging/search. Fine today, will degrade as the client base grows toward the stated 1,000-client target.

---

## Suggested triage order (not a fix plan — just priority for a future session)

1. Time filter being fully decorative (#1) — highest visibility, affects nearly every page.
2. Onboarding collection gap (#2) — silently corrupts new-client data from day one.
3. Hardcoded Romania default market (#3) — actively wrong for any non-Romanian client.
4. Teal/brand-color violations (#5) and `as any` casts (#6) — quick, mechanical fixes once a session isn't blocked by #83's shared-file changes.
5. i18n coverage gap (#8) and category-type drift (#7) — larger, cross-page refactors; probably their own scoped session(s).
6. Everything in "Low" — batch into a cleanup pass.
