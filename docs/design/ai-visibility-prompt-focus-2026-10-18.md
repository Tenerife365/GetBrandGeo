# AI Visibility page: prompt-first redesign brief

**Date:** 2026-10-18
**Status:** PROPOSAL, awaiting Constantin's ruling. Nothing built.
**Owner after ruling:** bg-design (spec) then bg-app (build, `src/` only), bg-verify on the result. One Netlify build.
**Source of every page fact below:** a read-only inventory of `brandgeo-dashboard/src/pages/AIVisibility.tsx` (1982 lines) plus `src/lib/aiVisibilityScore.ts`, `src/lib/collectionContext.tsx`, `src/lib/planConfig.ts`, run 2026-10-18. Line numbers refer to that file at HEAD `3d201a7`.

## 0. The ask

Constantin, 2026-10-18 (paraphrased from Romanian): when an engine returns no result for a prompt, or the brand simply does not appear, the page confuses the customer. Rethink the display so the focus lands on the prompts that work. Add an auto-sort with the best performing prompts first. Ask for other suggestions and check what peec.ai and the other tools do.

## 1. What the page does today, and why it confuses

The prompt table (lines 1563 to 1883) is a grid of prompts by engines. Every cell is one of these, and three of them look nearly the same:

| What happened | What the customer sees | Problem |
|---|---|---|
| Engine answered, brand mentioned | emerald circle with a check, optional `#pos` chip | fine |
| Engine answered, brand absent | red circle with an X, 9px red text naming one competitor | no word "Absent" in the cell; red everywhere on a new account |
| Engine call failed (quota, auth, api error) | **grey circle with a minus, tooltip "Not checked"** (error rows are skipped at load, lines 462 to 465) | an outage looks exactly like "we never ran this" |
| Engine failed now but an older ok row exists | **the older result, silently** (newest-first read, line 437, guard at 461) | stale data presented as current |
| Never collected | grey circle with a minus, tooltip "Not checked" | identical to the failure above |
| Engine returned nothing to appear in (AI Overviews) | dashed grey minus, 9px "no answer" | correct idea, only engine that has it, and hidden if an older ok row exists |
| Engine locked by plan | **no column at all** | the customer cannot see what the next plan would add |

Other facts that drive the confusion:

- **Order is the stored `position` column** (line 436), with gaps and duplicates, so ties are unordered. There is no sort control, no filter beyond category chips, no search. Winners and losers have identical row weight.
- **The only per-prompt summary is a 9px chip** "{mentioned}/{checked} engines" (lines 1642 to 1653). The denominator is engines that have a row, so "0/2" and "0/4" look alike and an engine outage shrinks the denominator without saying so.
- **Zero mentions produce a wall of red**: red chip, red X in every cell, score ring "0%" with band "Needs Work", six dimensions at "0%" with empty bars (Knowledge, Sentiment and Accuracy read as measured zeros when they are undefined without a mention), every engine card red "MISSING 0%", and one P0 "Fix This" item per engine with identical advice. For a brand that is genuinely absent this is truthful, but it is a verdict with no path, and it is the first screen a new customer sees after onboarding.
- **The engine card for an all-error engine says "Temporarily unavailable"** for every error code (line 1303), including a quota error that has lasted twelve days. The error code is shown only to admins.
- **Fix This P0 copy hardcodes "0 of N"** (line 689) while MISSING means under 25 percent, so an engine at 20 percent shows "20%" on its card and "0 of 5" in the fix.
- **Only admins can refresh a single cell** (line 1773). A customer's only retry is the header "Run Collection", which the cooldown disables.
- **The legend** names three states (Mentioned, Not mentioned, Not checked) and omits "no answer", "#N above", the red competitor name and the chip colours.

## 2. A live platform defect found while measuring (not a design issue)

**Perplexity and Grok have failed on every call since 2026-10-06.** Read from production `ai_results` on 2026-10-18: 0 ok rows and 287 (perplexity) plus 282 (grok) `quota_exceeded` rows in 14 days, last attempt 2026-10-17 01:17 UTC. Affected: every account whose plan includes either engine, including the paying ones. The newest client (id 57, onboarded 2026-10-17 on Growth) got five Perplexity errors on its first collection.

Both engines go through OpenRouter in `_collect.js` (`perplexity/sonar` and `x-ai/grok-4.5`), and the mapping at lines 262 to 272 turns HTTP 402, HTTP 429 and any message containing "credit" into `quota_exceeded`. Twelve days of zero successes points at the OpenRouter credit balance, not a rate limit. The error detail is not stored, so only the OpenRouter dashboard can confirm it.

On the page this outage renders as: grey "Not checked" cells in the Perplexity column, an engine card reading "Temporarily unavailable", and a smaller denominator on every prompt chip. That is a large part of the confusion Constantin describes, and no redesign fixes it. The ordered fix is: (1) top up or check OpenRouter, (2) confirm with one admin single-cell refresh on Perplexity, (3) then ship the page changes below, which make the next outage visible instead of silent.

## 3. Design principles for the rework

1. **Prompt first, engine second.** The unit the customer cares about is "which questions get my brand recommended". Engines are the detail under each prompt.
2. **Four honest non-results, never merged.** Absent (engine answered, brand missing), No answer (engine had nothing to appear in), Could not check (engine error, with the date it started), Not checked yet (never run). Each gets its own glyph, its own word, and its own count. Locked engines get a fifth, visibly different, treatment.
3. **Winners get the weight.** Sort, size and colour promote what works. Losses are stated in one line with a path, not repeated in every cell.
4. **Never render a zero as a measurement** (visual system section 11, F-02/F-03). Undefined stays undefined.
5. **Every empty or error state has a focusable action** that leads somewhere.
6. **Nothing new is collected and no new cron.** Every change is client-side presentation over rows that already exist. One `ai_results` read, same as today.

## 4. Ranked recommendations

### R1. Auto-sort by prompt performance, with a visible control

Default order: a per-prompt score computed client-side from the rows already loaded.

```
score     = mentioned_ok / answered_ok           (answered_ok excludes error and no-answer rows)
tiebreak1 = best brand_position (lower wins; null last)
tiebreak2 = answered_ok (more engines answered wins)
tiebreak3 = stored position (today's order), for a stable result
```

Groups in order: prompts with at least one mention, then prompts answered everywhere with zero mentions, then prompts that could not be checked anywhere, then prompts never checked. A small sort control at the table head offers "Best performing", "Needs work first", "Prompt order" (today's), "Recently checked". The choice is kept in `localStorage` per client. The sequential "#" column stays, so the number always reads 1 to N in the current order.

Why this one is first: it is the cheapest change with the largest effect on the first impression, it needs no data change, and it directly answers the ask.

### R2. Split the table into two sections with a one-line headline each

Above the table, one sentence that is the page's takeaway, computed from the same rows:

- With mentions: **"Your brand is recommended in 4 of 7 prompts, best on ChatGPT (#2)."**
- Zero mentions, engines answered: **"Not yet recommended in any of the 5 prompts checked. AI engines named 11 other brands instead."** followed by the top three names as chips (the data already exists at lines 1892 to 1931).
- Nothing checked or everything failed: **"No engine could be checked yet"** with the reason and a button.

Then two collapsible sections: **"Where you appear"** (prompts with at least one mention, open by default, full detail) and **"Where you do not appear yet"** (zero-mention prompts, open, but each row rendered as one calm line: prompt, "0 of N engines", the top competitor named, a chevron). The red X per cell disappears from the collapsed form; it is still there when a row is expanded. A third, collapsed-by-default section **"Could not be checked"** holds prompts whose engines all errored or were never run, with the date of the oldest failure.

### R3. Four distinct non-result states in the cell and in the legend

| State | Glyph | Word under the glyph (9 to 10px, always present) | Counted in the denominator |
|---|---|---|---|
| Absent | red ring, X | "absent" | yes |
| No answer | dashed grey ring, minus | "no answer" | no |
| Could not check | amber ring, alert triangle | "error" plus tooltip "Perplexity has not answered since 6 Oct" | no |
| Not checked yet | grey ring, minus | "pending" | no |

Error rows stop being skipped at load: the loader keeps the newest row per engine, and if that newest row is an error it also keeps the newest ok row as "previous result". The cell shows the error state with "last ok 11 Sep" underneath when a previous result exists, instead of silently showing the stale result as current (fixes lines 457 to 465). The legend lists all four plus "locked".

### R4. Engine card copy that tells the truth about failures

Replace "Temporarily unavailable" with a code-aware line visible to customers too: "Not answering since 6 Oct (provider limit)" for `quota_exceeded`, "Not answering since <date> (configuration)" for `auth_error`, "Last check failed on <date>" for `api_error`. Add the date on every variant; the first error row's `checked_at` is already loaded. Keep the admin tooltip with the raw code. The customer action stays "Run Collection to retry" or "Next run available <date>"; the admin action stays "Force Refresh".

Also fix the hardcoded "0 of N" in the P0 Fix This copy (line 689) to the real count, and suppress duplicate P0 items when every engine is MISSING: one item "Not yet recommended on any engine" instead of one per engine with identical text.

### R5. Locked engines appear as a column, not just a chip strip

One narrow dimmed column per locked engine, lock glyph in every cell, header reads the engine name and "Growth" (the plan that unlocks it), clicking it routes to `/account`. Capped at two locked columns to keep the grid readable; the rest stay in the chip strip. This is the only place in the product where the customer sees, per prompt, what a higher plan would measure.

### R6. Per-prompt health and a rewrite nudge

For a prompt with zero mentions across all answered engines, the expanded panel gains a block **"Who the engines recommend for this question"** (the parsed competitor list already shown as "AI Top Results") and one sentence of guidance chosen by rule, not by an LLM call: if the brand's own site has no page for the prompt's topic, "No page on your site targets this question"; if competitors are all marketplaces, "Engines answer this with retailers, not brands; consider a product-page prompt"; otherwise the existing "Add content targeting this prompt". The first two rules need facts the page does not have today, so release one ships only the competitor block and the existing sentence; the rule-based guidance is a follow-up once the audit's site crawl data is wired in.

### R7. Undefined dimensions stay undefined

In the score card, when `mentioned === 0` and `totalChecked > 0`: Recognition, Reach and Consistency show their real 0 percent; Knowledge, Sentiment and Accuracy show "n/a, needs a mention" in `--text-secondary` with no bar. The ring still reads 0 percent, which is true, but the band label changes from "Needs Work" to "Not recommended yet" so it reads as a starting point rather than a grade.

### R8. Small things, same build

- Category filter with zero matches: "No prompts in this category" instead of the add-prompts copy (line 1878).
- Legend under the table rewritten per R3.
- Admin-only "expand to refresh per engine" hint hidden below lg stays; add the same hint for customers reading "Run Collection re-checks every prompt".
- Grid columns stay `minmax(3.5rem, 5.5rem)`; the two new words per cell fit at 9px.

## 5. What is deliberately not proposed

- **No customer single-cell refresh.** Each cell is one paid engine call; the cooldown and the header button are the cost gate and stay.
- **No new collection or scheduler.** Everything above is presentation over existing rows.
- **No server-side sort or new table.** The page already loads every prompt and row for the client; sorting 200 prompts client-side is trivial.
- **No change to the score formula** in `aiVisibilityScore.ts`. R7 changes labels, not numbers, so Overview and the public audit stay consistent.
- **No LLM-generated per-prompt advice** in release one (cost and AI-tells risk).

## 6. Competitor review

Read-only pass over first-party docs and pricing pages on 2026-10-18 (peec.ai docs, Scrunch help center, Otterly help, Profound docs and blog, AthenaHQ product page, plus Semrush and Ahrefs help). "Serrucho" in the ask is read as Scrunch AI; no other tool with a similar name exists. No account was created and no demo was run, so UI facts come from documentation text, not screenshots. Prices are list prices in USD as published, unconverted.

### 6.1 What each tool does at the prompt level

| Tool | Prompt table | Brand absent | Failed or empty engine run | Sort and grouping | Prompt health |
|---|---|---|---|---|---|
| **peec.ai** | one row per prompt, grouped by Topic; columns Visibility, Share of Voice, Position, Win rate, Sentiment, Mentions, Volume (1 to 5), Web Search share, Links, Branding, Intent, Tags; columns hideable and reorderable, layout saved; Active / Suggested / Archived tabs | not described visually; per-prompt view lists the top 7 brands with yours shown at its real rank even if it is #36; guidance text says informational prompts often name no brand and suggests rewording | a chat has a "Created" flag for whether the run succeeded; no distinct failed state in the table | by Topic and Tags, Intent filter; no default sort documented | an MCP "prompt grader" that returns an A to F report on topic balance, branded share, funnel coverage, duplicates and model data gaps; a Suggested tab with accept or reject that does not count against the limit |
| **Scrunch AI** | Presence (mention rate), Position Score 0 to 100 in three buckets, Sentiment, Responses; every rate tooltip carries the sample size, "43% (37 of 86 responses)"; Home defaults to non-branded prompts only | a response without the brand stays in the denominator and is excluded from Position and Sentiment; a Signals tile "Competitive Presence" lists the exact prompts where a competitor appears and you do not, with a next step each; a help article "Why isn't my brand showing up" gives five ordered causes | "Missing" is an explicit value for position and sentiment, excluded from percentages; fully failed runs not documented | Topics (auto, many per prompt) versus Tags (manual), funnel stage, platform, persona, geography | "Topic Prompt Optimizations" flags redundant and weakly connected prompts after two weeks of data; 5 starter prompts generated at signup |
| **Otterly** | one row per prompt: Brand Coverage, Sentiment, Intent Volume, Mentions, Citations, Competitors, Tags; above it three lists, "Top prompts", "Trending Up", "Trending Down" | Responses tab shows "Brand Mentioned: No" with the competitors found in the adjacent column | an untriggered AI Overview is excluded from coverage and the docs say so | Tags; filter by engine; no default sort documented | prompt research tool with Intent Volume; no health flag |
| **Profound** | Visibility Score, Visibility Rank, Share of Voice, trend lines; tables sortable by value or by trend; "Visibility Trend" lists the biggest spikes and drops | lowers the score; no special display; note their Visibility excludes responses that name no brand at all | prompts "can get stuck incomplete"; no status values documented | Topics, Tags, platform, region, persona | prompt recommendations mined from a conversation dataset, ChatGPT only |
| **AthenaHQ** | prompts filterable by model and market; per prompt "demand and mention gap", "competitors mentioned per prompt", flags like "High-intent opportunity" and "Missing from 6 of 8 high-impact sources", "Next best action" | not described | not described | saved views, topics, locations, tags | not found; no public docs |

**Not found in any first-party material:** a documented default sort for a prompt table, or a distinct visual treatment for a failed engine run. Nobody shows an outage honestly on the prompt row. R3 and R4 above would be a differentiator, not a catch-up.

### 6.2 Patterns worth adopting, mapped to the recommendations

| Pattern (who does it) | Where it lands here |
|---|---|
| Visibility percent as the leading prompt column with the sample size in the tooltip, so 0 percent reads as measured (Scrunch, peec, Otterly, Profound) | R1 score column, R2 headline |
| A non-mention is never an empty cell: "No" plus the competitors who appeared (Otterly, peec top brands, Athena) | R3, R6 competitor block |
| "Missing" or "not determined" as a named state excluded from percentages (Scrunch); untriggered AI Overview excluded and stated (Otterly) | R3 denominators |
| A "competitive gap" list: prompts where a competitor appears and you do not, with a next step each (Scrunch Signals, Semrush "Missing" filter, Athena mention gap) | R2 section "Where you do not appear yet" |
| Top prompts / Trending Up / Trending Down above the table (Otterly, Profound sort by trend) | R1 sort options; trend needs two collection days and is a follow-up |
| Plain-language explanation of 0 percent with ordered causes (Scrunch help article, peec guidance on informational prompts) | R2 headline and R6 sentence |
| Prompt health report card: duplicates, branded share, funnel coverage, never-surfacing prompts (peec grader, Scrunch optimizations) | follow-up, see 6.3 |
| Branded versus non-branded split with headline numbers defaulting to non-branded (Scrunch, peec Branding column) | follow-up; `prompts.category` already has `direct_brand`, so the flag exists |
| Demand signal per prompt, 1 to 5 or Very low to Very high (peec, Otterly, Scrunch, Profound) | not now; needs a data source and a cost |
| Suggested prompts with accept or reject that do not count against the plan limit until accepted (peec) | belongs on the Prompts page, not this one |

### 6.3 Follow-ups this review suggests, outside this build

1. **Prompt health on the Prompts page:** a rule-based card (no LLM call) flagging duplicate prompts, prompts that have never surfaced any brand on any engine (candidates for rewording, peec's own advice), and a set that is all branded or all informational.
2. **Branded split:** headline Visibility on Overview and this page defaults to non-branded prompts, with a toggle. One line of code once R1's score exists.
3. **Trends:** once clients have two or more collection days (weekly cadence is live for paid plans), "Trending up" and "Trending down" lists are a cheap addition over the same rows.

### 6.4 Pricing position, for context only

| Tool | Entry | Mid |
|---|---|---|
| Otterly | $29 for 15 prompts | $189 for 100 |
| peec.ai (secondary sources, their page shows no numbers) | $95 for 50 | $245 for 150 |
| Scrunch | $250 to $300 for 350 custom prompts | $417 to $500 for 700 |
| Profound | 7-day trial, 50 prompts | enterprise only |
| AthenaHQ | free with credits | $295 for 3,600 responses a month |
| BrandGEO | EUR 29 Radar, 7 prompts | EUR 99 Essentials 18 prompts, EUR 299 Growth 35 prompts |

Vendors count differently (Scrunch counts prompt by platform variants, Athena counts responses, peec and Otterly count prompts), so the table is indicative. BrandGEO has the lowest entry price and the lowest prompt counts at every rung; Otterly Lite is the direct comparator for Radar. This is a pricing question for `bg-strategy`, not for this page, and it is recorded here only because the review surfaced it.

## 7. Acceptance criteria for the build

1. With the 5 engines of a Growth client and the Perplexity outage live, the Perplexity column shows amber "error" cells with the start date, never grey "pending", and the engine card names the date and the cause class.
2. A client with zero mentions sees one headline sentence, the competitors named, and a calm "Where you do not appear yet" list; no cell-level red X until a row is expanded.
3. Default order is best performing first; the sort control shows the active choice; changing it reorders without a reload and survives a page refresh.
4. The four non-result states are distinguishable without colour (glyph plus word), per visual system 13.6.
5. Locked engines appear as columns (max two) with a route to `/account`.
6. Knowledge, Sentiment and Accuracy never show "0%" when there is no mention.
7. `npm run build` exit 0, zero em or en dashes in added lines (positive control fired), no real client or person names in fixtures, one commit by pathspec on `brandgeo-dashboard/src/`.
8. Scale note: Supabase reads unchanged (one `ai_results` read per page load as today), no new writes, no new function invocations.

## 8. Open questions for Constantin (defaults apply if silent)

**RULED 2026-10-28, Constantin: "da, de acord".** All four defaults stand:
best performing first, locked engines as columns (max two), "Not recommended
yet" for zero mentions, release one is R1 to R5 plus R7 and R8 with R6's
competitor block in and its rule-based guidance deferred. The OpenRouter outage
in section 1 is closed the same day: credit topped up, Perplexity read back ok
on client 54 (3 ok rows, 0 errors in 2 days), Grok ok on 2026-10-27.

1. Default sort: best performing first (default) or needs work first.
2. Show locked engines as columns (default yes, max two) or keep the chip strip only.
3. Band label for zero mentions: "Not recommended yet" (default) or keep "Needs Work".
4. Release one scope: R1 to R5 plus R7 and R8 (default); R6's competitor block included, its rule-based guidance deferred.
