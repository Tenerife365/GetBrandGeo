# CLAUDE.md — BrandGEO Platform Memory

> **Last updated:** 2026-07-08 (task #83 shipped + pushed; git index corruption resolved; #100/#102 closed)  
> **App:** [app.getbrandgeo.com](https://app.getbrandgeo.com)  
> **Website:** [getbrandgeo.com](https://getbrandgeo.com) (static HTML, cPanel hosted)  
> **Project root:** `C:\Users\const\Constantin Daniel Goane\BrandGEO` (canonical — the old `C:\Users\const\Desktop\BpR` no longer exists, archived, see §6.4 step 8)  
> **Dashboard repo:** `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard` (Netlify)  
> **Website files:** `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\` + `brandgeo-signup\`  
> **Admin email:** `constantin@talentwelove.com` (Supabase admin, NOT workfully.com)

---

## 0. Working Agreement — Read This First

**Session workflow:** one chat session builds exactly one scoped feature or
fix. When it's done and saved, the session ends and the next task starts in
a **fresh chat**. This file is the only thing carried between sessions — a
new chat has no memory of prior chats — so every session must update this
file (task list, architecture, limitations, schema — whichever sections the
change touched) before ending. Reason: long threads force re-reading and
compressing the entire history on every message, which is what burns through
usage limits fastest, not the actual work. Full rule: `rules/session-workflow.md`
(also copied to `.claude/rules/session-workflow.md`).

**Model routing:** within a session, route by task type — Opus 4.8 for deep
reasoning, architecture (e.g. Geo-Agent design), complex/nested debugging,
and security/schema review; Sonnet 5 for the high-volume implementation work
(dashboard UI, response normalization, standard scripting). This governs how
Claude approaches work in this codebase — it is separate from whatever model
the product's own Netlify functions call via the Anthropic API, which is
already configured independently. Full rule: `.claude/rules/hybrid-routing.md`.

**Specificity in hand-offs:** any manual step handed to Constantin (a
command to run, a file to move, a UI to click through) must include the
exact full path, the exact copy-pasteable command, and the exact app/panel —
never "the new folder" or "run npm install" without saying where. Full rule:
`rules/specificity.md`.

**Execution delegation (cost efficiency):** for shell/PowerShell commands,
Supabase SQL, Netlify actions, cPanel uploads, git operations — default to
handing Constantin the exact command/instructions and letting him run it,
rather than Claude spending tool calls to execute it directly. He's offered
to run these himself specifically to reduce token/cost usage. Still fine to
execute directly for cheap read-only checks or genuinely large/repetitive
operations impractical to hand-run. Full rule: `rules/execution-delegation.md`.

**Completion status — never bury a pending action inside "done":** if
finishing a task still requires Constantin to act (upload, deploy, run a
command, approve, connect something), Claude must say so explicitly and
give that action as a numbered, copy-pasteable step-by-step list (per the
Specificity rule above) — never just say "done" and let the action get lost
in the summary. Structure end-of-task status as: Completed / Requires your
action / Still pending. Full rule: `rules/completion-status.md`.

**Parallel task scoping (added 2026-07-08, after a real collision):** when
multiple BrandGEO chats run at once (see the parallel-work window below),
each task must be assigned a non-overlapping `Scope:` (files/folders it
touches) before it starts — check the `Scope:` tags on other in-flight
entries in §5 before picking a task. File-level non-overlap is necessary
but **not sufficient** on its own: `git commit`/`push`/`stash` touch
repo-wide state (`.git/index`) that isn't partitionable by path, so git
commands must also be serialized (one session at a time), independent of
which files each session edited. Full rule: `rules/parallel-task-scoping.md`.

**Temporary parallel-work window (2026-07-08 → 2026-08-12):** Constantin
has extra credits during this window, so multiple BrandGEO chats may run
at the same time instead of strictly one-at-a-time (the usage-limit
reasoning behind the normal one-session rule doesn't apply the same way
while credits are cheap). This does not relax anything above — it's the
condition that makes the parallel-task-scoping rule necessary in the first
place. After 2026-08-12 this window closes; go back to strict
one-chat-at-a-time unless Constantin explicitly extends it.

**Chat naming & kickoff convention** (agreed 2026-07-08 — makes it easy to
find and click into the right conversation in the Cowork "BrandGEO" project
sidebar):

- **Title every new chat:** `#<task-id> · <3–6 word description>` — no
  "BrandGEO" prefix needed since every chat already lives inside the Cowork
  "BrandGEO" project sidebar, so the project name would be redundant.
  - Numbered task → `#99 · Git commit web merge`
  - Ad-hoc/unnumbered work → `<topic> · <YYYY-MM-DD>`, e.g.
    `Restructuring step 2 · 2026-07-10`
  - Set the title by renaming the conversation in the Cowork sidebar (right-click
    the chat → Rename, or the pencil icon next to the title at the top of the
    chat) right after starting it.
- **First message in every new chat** — folder connections do **not**
  automatically carry over to a new chat, even within the same Cowork
  project (confirmed 2026-07-08 — only the folder originally selected for
  the project itself persists; any folder connected mid-session via a tool
  call does not). So every kickoff message must start by having the new
  chat connect the folder itself, then name the task:
  `Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then
  continue BrandGEO — task #<id>: <one-line description, copy from §5 below>.`
  Once connected, this file auto-loads as context, so the rest of the
  message only needs to name the task, not restate the rules.
- **Picking up an old task_id from §5/§6:** open a fresh chat (don't resume a
  finished one), use the kickoff line above, and Claude will read the matching
  entry in §5/§6 for full context before starting.
- **Closing convention (unchanged from Session workflow above):** before the
  chat ends, update §5 (mark the task done or add its follow-ups) and §6 if
  the restructuring plan moved — same as every other session.

---

## 1. Current Architecture

### 1.1 Overview

BrandGEO is a managed AI Visibility & Brand Perception (GEO — Generative Engine Optimization) SaaS. It monitors how well a client's brand appears in answers from multiple AI search engines. The product:

1. Stores **commercial buyer prompts** per client (e.g. "Best catering companies in Bucharest")
2. **Fires those prompts** against real LLM APIs on a schedule or on demand
3. **Analyses responses** for brand mention, position, sentiment, and competitor presence
4. **Displays results** in a React dashboard with engine-level breakdown, mention history, competitor radar, and recommendations

### 1.2 Backend — Three Parallel Netlify Functions per Prompt

Each prompt fires three Netlify functions in parallel. All functions share auth via `_auth.js`.

| Function | Engines | Timeout | Notes |
|---|---|---|---|
| `collect-prompt.js` | Gemini + Perplexity + Meta | 26s | Gemini uses Google Search grounding; Perplexity + Meta via OpenRouter |
| `collect-claude.js` | Claude (claude-sonnet-4-6) | 26s | Streams SSE, aborts after 2500 chars; training-data mode (no web search) |
| `collect-chatgpt.js` | ChatGPT (gpt-5.5) | 26s | Responses API + `web_search_preview` + `user_location` for geo |

**Next model migration:** Moving from `claude-sonnet-4-6` to a hybrid of **Claude Sonnet 5** (high-volume) + **Claude Opus 4.8** (deep analysis) — not yet implemented.

### 1.3 Geo Context Injection

Every function calls `buildSystemContext(cfg, marketLabel, regionLabel)` which:
- Sets a system prompt: `"You are a user based in ${location}. Answer as if you are that local user..."`
- Derives location from: selected market + region (explicit) OR TLD of `brand_website` (fallback)
- ChatGPT additionally passes `user_location: { type: 'approximate', country: marketId, city?: regionLabel }` to the `web_search_preview` tool for native geo routing

Markets are stored as `market_id` (ISO country codes, `WW` for worldwide) and `region_label`.

### 1.4 Response Analysis — `analyseResponse(text, cfg)`

All three collect functions contain a **copy** of the same `analyseResponse` function (see §2 — this duplication is a known limitation). It returns:

```js
{
  brand_mentioned:       boolean,
  brand_position:        number | null,   // 1-based list rank, or null
  sentiment:             'positive' | 'neutral' | 'negative',
  response_snippet:      string | null,   // ~300 chars around first brand mention
  competitors_mentioned: string | null,   // JSON array of { pos, name }
}
```

**Mention detection:**
- Checks `brand_aliases[]` (lowercased) and stripped aliases (no spaces/dashes) against response text
- Checks `brand_website` domain (stripped of protocol/www)
- `matchesAlias(segment, aliases, aliasesStripped, website)` is the core fn

**Competitor extraction:**
- Regex: `/(?:^|\n)[^\d\n]{0,6}(\d+)[.)](?:\*{0,2})\s+([^\n]{2,120})/gm` — captures numbered list entries
- `NOT_A_COMPANY` filter rejects Romanian + English descriptive phrases (not brand names)
- Secondary pass: `scanForKnownCompetitors()` catches known competitors mentioned in prose

**Position detection:**
- Numbered list rank if brand appears in list → `brandInList.pos`
- Else sentence index via `detectListPosition()`

### 1.5 Frontend — React (Vite + Tailwind)

**State management via React Context:**

| Context | File | Provides |
|---|---|---|
| `ClientProvider` | `src/lib/clientContext.tsx` | `activeClientId`, `activeClient`, `clients[]`, `isAdmin`, `engineStates`, `activeEngines`, `setClientEngineOverride` |
| `CollectionProvider` | `src/lib/collectionContext.tsx` | `collecting`, `progress`, `lastCompletedAt`, `runCollection`, `runSinglePrompt`, `stopCollection` |
| `MarketContext` | `src/lib/marketContext.tsx` | `selectedMarkets`, `setSelectedMarkets` |
| `TimeFilterContext` | `src/lib/timeFilterContext.tsx` | `timeFilter` (7d/30d/90d/all) |
| `I18nContext` | `src/lib/i18nContext.tsx` | `lang`, `t()` translation function |

**Key pages:**

| Route | Component | Purpose |
|---|---|---|
| `/` | `Dashboard.tsx` | Overview stats + recent activity |
| `/ai-visibility` | `AIVisibility.tsx` | Engine cards, prompt table, Fix This hub |
| `/sentiment` | `BrandSentiment.tsx` | Sentiment score (0-100), positive/neutral/negative breakdown, per-engine chart, trend over time, filterable response feed — driven from `ai_results` where `brand_mentioned = true` |
| `/competitors` | `Competitors.tsx` | Competitor radar + trend chart |
| `/prompts` | `Prompts.tsx` | CRUD for commercial buyer prompts |
| `/recommendations` | `Recommendations.tsx` | AI-generated action items |
| `/usage` | `Usage.tsx` | Admin cost estimator (OVERHEAD_MULTIPLIER = 1.5) |
| `/onboard` | `Onboard.tsx` | Multi-step client onboarding wizard |
| `/signup` | `Signup.tsx` | Self-serve signup page |

### 1.6 Auth & Security

- **Frontend auth:** Supabase anon key + RLS; JWT stored by Supabase client
- **Netlify functions:** All protected by `_auth.js` — verifies JWT, origin whitelist, role, client ownership, rate limit (150 rows/hr/client)
- **Origin whitelist:** `https://app.getbrandgeo.com`, `http://localhost:5173`, `http://localhost:3000`
- **User roles:** `admin` (full access, all clients) / `viewer` (own client only)
- **Rate limit:** 150 `ai_results` rows per client per hour — protects against runaway collection

### 1.7 Plan-Based Engine Gating

Defined in `src/lib/planConfig.ts`:

| Plan | Engines |
|---|---|
| `free` | ChatGPT |
| `essentials` | ChatGPT, Gemini, Claude |
| `managed` | + Perplexity, Google AI |
| `pro` / `enterprise` | + Meta, Copilot, DeepSeek, Grok |

`COMING_SOON_ENGINES = ['google_ai', 'copilot', 'deepseek', 'grok']` — never collected, always show as coming soon.

Admin can override per-engine via `clients.engines_enabled` JSONB (sparse map, `false` = disable even if plan allows).

`getEngineStates(plan, enginesEnabled)` → `Record<EngineId, 'active' | 'coming_soon' | 'locked'>`

### 1.8 Error State Architecture (implemented in #95–#97)

When an API call fails (quota, auth, network), collect functions store an error row instead of silently skipping:

```js
// On error:
{ status: 'error', error_code: 'quota_exceeded' | 'api_error' | 'auth_error', brand_mentioned: false }

// On success:
{ status: 'ok', brand_mentioned: ..., sentiment: ..., ... }
```

Skip check for non-force runs: `.neq('status', 'error')` — so error rows don't block retries.

Dashboard `AIVisibility.tsx` derives engine state:
- **UNAVAILABLE**: `errorEngines.has(id) && checked === 0` — grey card, "Temporarily unavailable", AlertTriangle icon
- **Mixed** (some ok, some errors): shows normal stats from ok rows; error rows ignored for %

Force Refresh deletes ALL rows (including error rows) before re-collecting.

---

## 2. Current Limitations

### 2.1 `analyseResponse` Duplication
The full analysis function is **copy-pasted** into all three collect functions (`collect-chatgpt.js`, `collect-claude.js`, `collect-prompt.js`). Changes must be made in three places. **Fix:** extract to a shared `_analysis.js` helper (not yet done).

### 2.2 Netlify Hard Timeout (26s)
All collect functions run at the 26s Netlify limit. gpt-5.5 with web search can take 20–25s. If the response arrives at 25.9s, the function times out and nothing is saved — no error row is stored either (timeout kills the process). This is a structural limitation of the serverless model.

### 2.3 Claude Streaming Early Abort
`collect-claude.js` reads the SSE stream and aborts after **2500 characters** of accumulated text. This is sufficient for brand mention detection but means competitors mentioned later in a long Claude response are missed.

### 2.4 Regex-Based Mention Extraction
`analyseResponse` uses regex on raw text. It works well for numbered lists but can miss:
- Brand mentions inside tables or markdown blocks
- Mentions buried 3000+ chars into a response (Claude early abort)
- Multi-word brands with unusual spacing or diacritics

### 2.5 No Caching Layer
Every collection run hits LLM APIs directly. No semantic deduplication — if the same prompt fires for two markets, two separate API calls are made. At 1000 clients this will be expensive.

### 2.6 `analyseResponse` Sentiment is Keyword-Based
Sentiment is detected by simple word lists (`posWords`, `negWords`). No LLM-based sentiment analysis on the response text.

### 2.7 OpenRouter as Single Point of Failure for Perplexity + Meta
Both Perplexity and Meta AI are routed through OpenRouter. If OpenRouter credits run out, both engines fail simultaneously.

### 2.8 No Scheduled Collection
Collection is manual (dashboard "Run Collection" button) or triggered post-onboarding. There is a `purge-old-results` scheduled function (3am daily) but no scheduled collect.

### 2.9 `collect-prompt.js` Gemini Fallback Chain
Gemini tries `gemini-2.5-flash-preview-05-14` → `gemini-2.0-flash` → without Google Search grounding. Fallback is silent — logs exist but the dashboard can't tell which model actually ran.

---

## 3. Database Schema

### Table: `clients`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial PK` | |
| `name` | `text` | Display name |
| `slug` | `text UNIQUE` | URL-safe identifier |
| `plan` | `text` | `free \| essentials \| managed \| pro \| enterprise` |
| `engines_enabled` | `jsonb` | Sparse override map `{ "meta": false }` |
| `brand_name` | `text` | Primary brand name |
| `brand_aliases` | `text[]` | All names to detect (incl. short forms) |
| `brand_website` | `text` | Used for domain matching + TLD-based geo fallback |
| `known_competitors` | `text[]` | Pre-seeded competitor list for prose scanning |
| `default_market_id` | `text` | ISO country code or `WW` |
| `created_at` | `timestamptz` | |

### Table: `user_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | References `auth.users.id` |
| `role` | `text` | `admin \| viewer` |
| `client_id` | `int FK` | References `clients.id`; null for admin |
| `created_at` | `timestamptz` | |

### Table: `prompts`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial PK` | |
| `client_id` | `int FK` | Multi-tenant FK |
| `text` | `text` | The full prompt text |
| `category` | `text` | `mid \| large \| very_large \| general \| tool_discovery \| geo_category \| problem_based \| direct_brand` |
| `is_active` | `boolean` | Whether to include in collection runs |
| `position` | `int` | Display sort order |
| `created_at` | `timestamptz` | |

### Table: `ai_results`

| Column | Type | Notes |
|---|---|---|
| `id` | `serial PK` | |
| `prompt_id` | `int FK` | References `prompts.id` |
| `client_id` | `int FK` | Denormalized for fast filtering |
| `llm` | `text` | `chatgpt \| gemini \| claude \| perplexity \| meta \| google_ai \| copilot \| deepseek \| grok` |
| `brand_mentioned` | `boolean` | |
| `brand_position` | `int` | Rank in numbered list (1-based), or null |
| `sentiment` | `text` | `positive \| neutral \| negative \| none` |
| `response_snippet` | `text` | ~300 chars around first brand mention |
| `competitors_mentioned` | `text` | JSON string: `[{ pos, name }]` |
| `checked_at` | `timestamptz` | When the API call completed |
| `status` | `text DEFAULT 'ok'` | `ok \| error` — added in migration #95 |
| `error_code` | `text DEFAULT NULL` | `quota_exceeded \| api_error \| auth_error` — added in migration #95 |

**Index:** `idx_ai_results_status ON ai_results(status)`

**Migration SQL (#95):**
```sql
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS error_code TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_results_status ON ai_results(status);
```

### RLS Policy Pattern
All tables use Row Level Security. Service key (in Netlify functions) bypasses RLS. Anon key (frontend) is governed by policies that check `auth.uid()` via `user_profiles.client_id`.

---

## 4. Coding Guardrails

### 4.1 Scalability Rule
**Every solution must scale to 1,000 clients with diverse needs.** No hardcoded client names, no per-client branching in shared code, no "quick patches" that assume a single tenant. Always use `client_id` FK, `client_config` objects, and plan-based gating.

### 4.2 Violet Brand Theme
The dashboard uses a **violet theme** throughout (replaced the old teal). Never revert to teal/green as a primary brand color.

Key color tokens:
- Primary: `violet-500` / `#8b5cf6`
- Accent: `violet-400`, `violet-600`
- Backgrounds: `bg-slate-900` (page), `bg-slate-800` (card), `bg-slate-700` (elevated)
- Text: `text-white` (primary), `text-slate-300` (secondary), `text-slate-500` (muted)
- Error/unavailable: `bg-slate-700/60 text-slate-400 border-slate-600/40`

Engine logo colors (from `ENGINE_META` in `planConfig.ts`):
- ChatGPT: `text-emerald-400`
- Gemini: `text-blue-400`
- Claude: `text-purple-400`
- Perplexity: `text-cyan-400`
- Meta AI: `text-amber-400`

### 4.3 Tailwind Usage
- Tailwind CSS only — no custom CSS classes unless in `index.css` for global resets
- Use Tailwind's `bg-{color}/{opacity}` pattern for translucent cards (e.g. `bg-violet-500/10`)
- Dark-mode only — no light mode exists; never add `dark:` prefixes
- Responsive classes: `md:`, `lg:` for layout breakpoints; mobile-first

### 4.4 TypeScript Patterns
- All shared types in `src/types/index.ts` — add new fields there, not inline
- `LLMName` union type must match the exact strings stored in `ai_results.llm`
- Optional fields on interfaces: `field?: Type` — don't use `| undefined` explicitly
- Never cast `as any` — use proper type guards or optional chaining

### 4.5 React Context Rules
- App-level state lives in Context providers (see §1.5)
- Never fetch Supabase directly in a page component if a context already provides that data
- Use `useCallback` for functions passed down as props or stored in context
- `lastCompletedAt` in `CollectionContext` is the signal to reload data — watch it with `useEffect`

### 4.6 Netlify Functions
- All functions must call `requireAuth(event)` first and return `auth.response` if present
- Never expose `SUPABASE_SERVICE_KEY` to the frontend — server-side only
- Use `createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)` inside functions, not the anon client
- Shared utilities: prefix with `_` (e.g. `_auth.js`) so Netlify doesn't expose them as endpoints
- Log format: `[FunctionName/invId] message` for traceability

### 4.7 No Mock Data in Production
`isDemoMode` (from `src/lib/supabase.ts`) gates mock data — it's only active when `VITE_SUPABASE_URL` is missing or placeholder. Never add mock data to code paths that run in production.

### 4.8 Supabase Queries
- Filter by `client_id` on every query — never fetch all rows across tenants
- Use `.neq('status', 'error')` on `ai_results` queries that should exclude API-failure rows
- Use service key in functions, anon key + RLS in frontend
- `user_profiles` is the source of truth for role and client_id

### 4.9 Collection Architecture Rules
- `collectionContext.tsx` fires 3 parallel fetches per prompt (`collect-prompt`, `collect-claude`, `collect-chatgpt`)
- `active_engines` array in the POST body tells `collect-prompt` which engines to run (Gemini/Perplexity/Meta only — Claude and ChatGPT have dedicated functions)
- Force collect: caller first deletes all existing rows for the prompt, then fires all 3 functions with `force: true`
- Non-force: each function checks for existing ok rows this month and skips if present
- `setLastCompletedAt` fires at: immediately after each prompt + 15s + 40s (catches late gpt-5.5 saves)

### 4.10 Git Workflow
- Single repo root: `C:\Users\const\Constantin Daniel Goane\BrandGEO` — always `git commit` from here (moved from `C:\Users\const\Desktop\BpR` in step 8, see §6.4)
- Dashboard code: `brandgeo-dashboard/`
- Website files: `brandgeo/web/` + `brandgeo-signup/`
- Dashboard deploys automatically to Netlify on push to main
- If Netlify skips ("no content change"), use Force Deploy from the Netlify UI

---

## 5. Full Task List (#1–#97)

### Completed

- **#1** Fix Gemini (google-genai) and Perplexity (model name)
- **#2** Add competitor extraction to collect_llm_responses.py
- **#3** Enhance AIVisibility dashboard page for demo
- **#4** Build and deploy updated dashboard to Netlify
- **#5** Build Prompt Discovery chat feature in dashboard
- **#6** Fix footer on getbrandgeo.com
- **#7** Add logo + day/night theme toggle to dashboard
- **#9** Fix TypeScript errors in Prompts.tsx and AIVisibility.tsx
- **#10** Build dashboard and deploy to Netlify
- **#11** Git commit and push all changes
- **#12** Replace Grok with Meta (Llama) in all engine lists
- **#13** Fix Competitors tab — make auto-discover actually populate
- **#14** Fix Mentions tab to show actionable value
- **#15** Update Overview competitor seed list to Bucharest catering brands
- **#16** Make Overview classification columns clickable with detail drawer
- **#17** Replace Grok with Meta in types, mockData, AIVisibility, collector
- **#18** Update mockCompetitors to real Bucharest catering brands
- **#19** Fix Competitors auto-discover to also read from ai_results
- **#20** Redesign Mentions tab to show AI engine mention events
- **#21** Make classification breakdown bars clickable with slide-over drawer
- **#22** Build and deploy to Netlify
- **#23** Create blog.html — BrandGEO Research™ index page
- **#24** Create bg-001.html — first research article
- **#25** Create faq.html — FAQ page
- **#26** Update index.html nav + footer + engine strip
- **#27** Create BG-001 LinkedIn asset kit
- **#28** Upload index.html to cPanel
- **#29** Build and deploy dashboard to Netlify
- **#30** Fix Netlify build: commit src/lib/ files that .gitignore is hiding
- **#31** Fix Market selector: flag encoding + add city/region sub-selector
- **#32** Multi-tenant migration: add client_id to Supabase + BrandGEO setup
- **#33** Build client switcher in dashboard for admin users
- **#34** Refactor Dashboard.tsx Overview to use ai_results with client_id filter
- **#35** Replace Bot icon with LLM logos in AIVisibility top cards
- **#36** Make collector multi-client: loop BpR + BrandGEO with per-client config
- **#37** Add sitemap.xml and robots.txt to getbrandgeo.com
- **#38** Fix dashboard login — set password for mobile access
- **#39** Make dashboard fully responsive for mobile
- **#40** Import Meta × BpR (50 responses)
- **#41** Import all Claude batches — BpR + BrandGEO (autonomous run)
- **#42** Add i18n language toggle to dashboard (EN/ES/DE/FR/NL/RO + others)
- **#43** Add regions to Markets selector (Europe, North America, APAC, Oceania, etc.)
- **#45** Extend clients table with brand config columns + seed BpR & BrandGEO
- **#46** Build netlify/functions/collect-prompt.js — on-demand LLM collection
- **#47** Build netlify/functions/onboard-client.js — create client + auth user
- **#48** Build Onboard.tsx — multi-step client onboarding wizard
- **#49** Gap 3: Viewer role restrictions in Prompts.tsx + sidebar
- **#50** Wire up collection runner in AIVisibility + auto-trigger on onboard
- **#51** Save scalability memory rule
- **#52** Multi-market architecture: all 5 files
- **#53** Website homepage redesign — implement in code
- **#54** Dashboard results view — implement AI Visibility Score card + engine grid + Fix This hub
- **#56** Update faq.html — fix engine count, add free audit Q&A, update pricing
- **#57** Create terms.html — Terms & Conditions with pricing and service terms
- **#58** Fix ChatGPT geo: add user_location to web_search_preview
- **#59** Fix Claude: clear error when ANTHROPIC_API_KEY missing + verify beta header
- **#60** Fix Meta: diagnose 0/0 — add logging, verify model ID
- **#61** Add response preview logging for all 5 engines
- **#62** Fix Claude timeout: reduce max_uses to 1, clean up function structure
- **#63** Remove web search from Claude — use training data mode
- **#64** Add per-prompt refresh button to AIVisibility prompt table
- **#65** Create collect-chatgpt.js dedicated function
- **#66** Remove ChatGPT from collect-prompt.js
- **#67** Update collectionContext.tsx to fire 3 parallel functions
- **#68** Add collect-chatgpt timeout to netlify.toml
- **#69** Rewrite Competitors.tsx — ai_results driven, fixed radar
- **#70** Build generate-recommendations.js Netlify function
- **#71** Add AI insights section to Recommendations.tsx
- **#74** Create timeFilterContext.tsx
- **#75** Create Usage.tsx — admin cost estimator
- **#76** Update App.tsx — TimeFilterProvider + Usage route
- **#77** Update Layout.tsx — nav reorder, time filter bar, mobile bottom nav, Usage link
- **#78** Update index.css — theme softening
- **#79** Update Competitors.tsx — trend line chart
- **#80** Git commit and push all changes
- **#81** Rewrite pricing section in index.html
- **#82** Update faq.html pricing references
- **#85** Secure all Netlify functions — JWT auth + origin lock + rate limiting
- **#86** Create signup-client.js Netlify function
- **#87** Create Signup.tsx page
- **#88** Wire signup into App.tsx + Login.tsx + index.html
- **#89** Verify Supabase config requirements
- **#90** Create planConfig.ts — engine/plan/coming-soon map
- **#91** Update clientContext.tsx — add plan/engines_enabled/activeEngines
- **#92** Update AIVisibility.tsx — engine gating UI + admin toggle panel
- **#93** Update collectionContext.tsx + collect-prompt.js — gate collection to active engines
- **#94** Provide SQL + git commands for plan gating feature
- **#95** DB migration: add status + error_code to ai_results
- **#96** Update collect functions to write error states
- **#97** Dashboard: show ⚠ Temporarily unavailable per engine
- **#98** Merge standalone `brandgeo\web\` into `BpR\brandgeo\web\` — one
  canonical website source. Backed up both originals to
  `BpR\legacy\web-snapshots\2026-07-08-standalone\` and
  `...\2026-07-08-bpr-copy\` first. Additive files (`bg-002.html`,
  `bg-003.html`, `bg-004.html`, `cookies.html`, `images\`) copied straight
  in — no conflict. `blog.html` and `bg-001.html` needed real reconciliation
  (BpR-copy had newer dates/branding/pricing but had dropped content found
  only in standalone) — staged both, reviewed with Constantin, confirmed,
  then copied into the live folder. `blog.html` = standalone's full 4-post
  layout + BpR-copy's `<head>` (favicon, Plausible). `bg-001.html` =
  BpR-copy's branding/dates + standalone's "six disciplines" section, plus
  three judgment calls Constantin confirmed: restored hero image +
  og:image/twitter/keywords meta (had been silently dropped), fixed the
  next-post link to `/bg-002.html`, kept the theme-toggle nav for
  consistency with `blog.html`. Live folder now has one reconciled copy —
  see file list in §1.5 note below. **Not yet done:** git commit this into
  the BpR repo (was previously untracked per `.gitignore`'s `!brandgeo/web/`
  exception — verify tracking now that the folder has real content).

- **#72** ✅ **DONE 2026-07-08** — Audited all 11 dashboard pages for bugs/UX
  issues (read-only pass, scoped to findings-only since #83 was running in
  parallel on `Layout.tsx`/`App.tsx`). Full writeup:
  `dashboard-audit-72-findings.md` (repo root). Headline findings: (1) the
  global 7d/30d/90d/All time filter shown on every page is fully decorative
  everywhere except `Usage.tsx` — no other page reads `timeRange`; (2)
  `Onboard.tsx` has its own hand-rolled collection loop that only calls
  `collect-prompt` (Gemini/Perplexity/Meta), silently skipping Claude and
  ChatGPT for every newly onboarded client despite the UI claiming "5
  engines collected"; (3) `marketContext.tsx` defaults any session with no
  saved market to Romania (`MARKETS[1]`, leftover BpR assumption) — violates
  the Scalability Rule for every non-Romanian client; (4) teal is used for
  active/selected states in `AIVisibility.tsx` and `Prompts.tsx`, violating
  the violet-only brand rule (§4.2); (5) `as any` casts in `Dashboard.tsx`
  and `Mentions.tsx`, violating §4.4; (6) i18n coverage is inconsistent —
  only 4 of 11 pages (`Dashboard`, `AIVisibility`, `Prompts`, `Mentions`) use
  `useI18n()`, the other 7 are 100% hardcoded English; (7) `PromptCategory`
  type drift across pages; (8) dead frontend code mirroring the
  already-tracked dead DB tables in #102 (`ScoreBadge.tsx`'s
  `ClassificationBadge`/`GeoScoreRing`, several unused `types/index.ts`
  types). Plus ~10 lower-severity polish items (no confirm-on-delete,
  inconsistent date locales, hardcoded "2026" copyright year, etc.) — see
  the findings file for the full list and a suggested triage order.
  **Not fixed yet** — next session should pick a slice (the findings file
  suggests: time filter first, then onboarding collection gap, then the
  Romania default) rather than fixing everything at once, and should wait
  for #83 to land first since it touches `Layout.tsx`/`App.tsx`.
- **#83** ✅ **DONE 2026-07-08** — Built `src/pages/BrandSentiment.tsx`
  (new file, ~360 lines) at route `/sentiment`. Query: `ai_results` filtered
  to `client_id` + `brand_mentioned = true` (sentiment is only meaningful
  once the brand is actually mentioned — `collect-prompt.js` leaves
  `sentiment: 'neutral'` by default and only scores positive/negative when
  `mentioned` is true, see §1.4/§2.6), respecting the global time filter
  (`getStartDate()`) and `activeEngines` plan gating, same pattern as
  `Usage.tsx`/`Competitors.tsx`. Shows: a 0-100 weighted sentiment score
  card (positive=100/neutral=50/negative=0, averaged) with a label band
  (Mostly Positive/Mixed/Needs Attention/Mostly Negative), positive/neutral/
  negative count+% cards, an overall stacked breakdown bar, a per-engine
  stacked % bar chart (`ENGINE_META` from `planConfig.ts`), a
  weekly/monthly/quarterly trend line chart (3 series, same
  `computeTrend`-style bucketing as `Competitors.tsx`), and a filterable
  "Recent Sentiment Signals" feed (sentiment + engine chips, expandable rows
  with response snippet) reusing `SentimentDot` from `ScoreBadge.tsx` and
  the `Mentions.tsx` expand/collapse pattern. Demo mode derives varied demo
  sentiment (positive/neutral/negative) from `brand_position` since
  `mockAIResults` only ever stores `'positive'`/`'neutral'` — done locally
  in the component, `mockData.ts` itself was not touched. Wired: `/sentiment`
  route in `App.tsx`, nav entry in `Layout.tsx` (desktop sidebar + mobile
  bottom nav, `Smile` icon, placed right after AI Visibility), and
  `nav_sentiment` translation key added to all 8 languages in
  `i18nContext.tsx` (interface + EN/ES/DE/FR/NL/RO/PT/IT blocks).
  **Build verification caveat:** this session's sandboxed Linux shell has a
  proven platform mismatch (`node_modules` was installed on Windows —
  confirmed via an `esbuild` native-binary crash: `@esbuild/win32-x64`
  present, `@esbuild/linux-x64` needed). `npx tsc --noEmit` in that sandbox
  reports 14 cascading JSX "no corresponding closing tag" errors in
  `App.tsx`/`Layout.tsx` — but this **reproduces identically with the new
  `/sentiment` route line removed** (isolated by temporarily reverting just
  that one line and re-running tsc), and also appears in the untouched
  mobile-nav section of `Layout.tsx`, so it's a **pre-existing sandbox/tsc
  quirk, not a real defect** — this exact file structure is already live in
  production at app.getbrandgeo.com. `BrandSentiment.tsx` itself reports
  **zero** tsc errors on its own. Still, **run a real build once from
  Windows before pushing**, since that's the only environment that matches
  the installed `node_modules`: open PowerShell in
  `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-dashboard` and
  run `npm run build` — should exit 0 with a `dist\` folder produced. If it
  reports real errors there (unlikely given the isolation test above),
  paste them into the next session before committing.
- **⚠️ Git index corruption found 2026-07-08 — ✅ RESOLVED same day.**
  Mid-session, a `git status` in `brandgeo-dashboard\` returned
  `error: bad signature 0x00000000` / `fatal: index file corrupt`, with a
  leftover `.git/index.lock` — consistent with another session's git
  process touching this repo concurrently (see §6.5 Collision risk; #72's
  audit and #84's website edit were both confirmed running in parallel
  this same session). Constantin fixed it (removed the lock + corrupt
  index, `git reset` to rebuild from `HEAD`) and committed everything in
  one go: **`7f439da` — "Add Brand Sentiment page (#83), site spotlight
  section (#84), audit findings (#72), restructuring rules"** — pushed to
  `origin/main` (0 ahead/behind, confirmed). Verified `BrandSentiment.tsx`
  content in that commit is byte-identical (MD5 match) to what's on disk,
  so nothing was lost or mangled in the recovery. `brandgeo-dashboard/dist/`
  also exists with compiled assets, confirming `npm run build` passed on
  Constantin's machine. No further action needed on this incident — the
  standing prevention rule is `rules/parallel-task-scoping.md` (§0).

### Pending

Each entry below is tagged `Scope:` per the parallel-task-scoping rule
(§0, `rules/parallel-task-scoping.md`) — only launch two of these in
parallel if their `Scope:` lines don't intersect, and never run git
commands from two sessions at once regardless of scope.

- **#44 / #55** Clean up folder structure — consolidate all project locations. **Expanded scope agreed 2026-07-08, see §6 below. All 8 steps are now done — the restructuring is complete.** Old `C:\Users\const\Desktop\BpR` and standalone `brandgeo` were archived (not deleted) to `C:\Users\const\Constantin Daniel Goane\BrandGEO-archives\` in step 8. `C:\Users\const\Constantin Daniel Goane\BrandGEO` is now the one and only canonical project root. Remaining independent cleanup decisions (#100, #101, #102) are tracked separately below and were deliberately left open.
  Scope: none — closed out, no further files touched.
- **#102** ✅ **DONE 2026-07-08** — Legacy single-tenant tables
  (`search_queries`, `search_results`, `page_analysis`, `mentions` — 430
  rows total, includes a `mentions_bpr` column, predates the multi-tenant
  migration) moved from `public` to a new `archive` schema in the
  `brandgeo-dashboard` Supabase project (`duiyifepitvugyulobqm`) —
  archived, not dropped. Confirmed via `list_tables`: data intact, RLS
  still enabled, tables off the exposed `public`/API surface. Chose
  archive over drop (irreversible, no storage benefit gained) or leaving
  in `public` (clutters schema). **Not cleaned up, left as an open
  non-blocking follow-up if raised again:** legacy code that still
  references the old `public.*` path — `app/collect_searxng_results.py`,
  `app/generate_queries.py`, `app/analyze_search_results.py`,
  `collectors/searxng_search.py`, `dashboard/streamlit_app.py`, the
  `searxng` service in `bpr-geo-monitor/docker-compose.yml` — is already
  orphaned from production (not wired into `run_monthly_collection.bat` or
  `geo_monitor_service.py`, which only write `ai_results`/`prompts`/`clients`).
  Scope: Supabase only, no local files.
- **#99** ✅ **DONE 2026-07-08** — Git commit the merged `web/` folder into
  the BpR repo. Verified via `git ls-files` (both `blog.html` and
  `bg-001.html` tracked), `git check-ignore -v` (prints nothing — the
  `.gitignore`'s `!brandgeo/web/` exception works correctly, nothing silently
  ignored), and `git log` (commit `4122a03`, message "Merge web/ folder:
  reconcile blog.html and bg-001.html, add bg-002/003/004, cookies, images",
  already at `HEAD -> main, origin/main, origin/HEAD` — pushed to GitHub).
  **cPanel upload deliberately NOT done** — per §6.4 sequencing, cPanel
  re-upload is step 6, which comes after backup (step 2), GitHub rename
  (step 3), and the move to the new root folder (step 4), not immediately
  after the merge/commit. Caught mid-session (2026-07-08) after Claude
  jumped ahead and asked Constantin to upload to cPanel too early — corrected,
  no upload happened. Live getbrandgeo.com currently still runs the
  pre-six-disciplines version of bg-001.html; that's expected until step 6.
- **#100** ✅ **DONE 2026-07-08** — Fate of the abandoned standalone
  `github.com/Tenerife365/brandgeo` repo decided: Constantin archived it
  via GitHub's own "Archive this repository" feature (Settings → Danger
  Zone) rather than deleting it. Chose archive over delete since it's free,
  reversible, and preserves anything GitHub-native (issues/PRs/history)
  that the local file archive (`BrandGEO-archives\brandgeo-standalone\`,
  see §6.4 step 8) wouldn't have captured. It's now a read-only archived
  repo, not an active or deletable concern — only #101 remains open from
  the original #100/#101/#102 cleanup trio (and #101 is itself mostly done,
  see its entry above).
  Scope: GitHub repo settings only, no local files.
- **#101** ✅ **MOSTLY DONE 2026-07-08** — Investigated and resolved both parts:
  **Signup:** confirmed `brandgeo-signup/` was a drop-in install kit (its own
  `INSTALL.md` says "copy these files into your repo") whose content was
  already merged into `brandgeo-dashboard/src/pages/Signup.tsx` +
  `netlify/functions/signup-client.js` (styled version, ~1hr newer). Copied
  `brandgeo-signup/` to `BrandGEO-archives/brandgeo-signup/` (content-diff
  verified identical). **Not yet done:** could not delete the original
  `brandgeo-signup/` at the canonical root — this session's connected-folder
  mount blocks file deletion (`Operation not permitted` on `mv`/`rm`, same as
  the `.claude/` write restriction, just for deletes). Constantin needs to
  delete `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo-signup\`
  himself (File Explorer delete, or `git rm -r brandgeo-signup` — it was
  untracked anyway).
  **Backend:** confirmed `BrandGEO-archives/brandgeo-standalone/backend/` is
  a stale snapshot of the canonical `brandgeo/backend/` — single one-line
  diff in `app/engine_runner.py` (older Perplexity model name + missing
  headers), canonical is newer (2026-07-06) and authoritative. No unique code
  in the archived copy — nothing to reconcile, already correctly archived,
  no action needed.
  **Also surfaced (unrelated, found while investigating):** the git index at
  the canonical root is badly out of sync with HEAD — `git status` shows all
  ~222 tracked files staged as deleted while the same files show up as
  untracked, meaning a `git commit` right now would strip most of the repo's
  tracked history. Likely a leftover `git rm -r --cached .` from the
  restructuring that never got a follow-up `git add -A`. Constantin is
  handling the fix himself (`git add -A`, review `git status`, then commit)
  — not yet confirmed done as of this note.
  Scope: `brandgeo-signup/`, `brandgeo/backend/`, `BrandGEO-archives/brandgeo-standalone/backend/`.
- *(no other pending items — #73 and #84 finalized below, see Completed)*

---

## 6. Restructuring — New Root Folder & GitHub Rename (agreed 2026-07-08, ✅ COMPLETE)

**All 8 steps below are done as of 2026-07-08.** `C:\Users\const\Constantin
Daniel Goane\BrandGEO` is the canonical project root; the old
`C:\Users\const\Desktop\BpR` and standalone `brandgeo` folders were archived
(not deleted) to `C:\Users\const\Constantin Daniel Goane\BrandGEO-archives\`.
Three independent, low-priority cleanup decisions remain open — #100
(abandoned GitHub repo fate), #101 (signup/backend dedupe), #102 (legacy
Supabase tables) — none of them block anything or require re-confirming
before future sessions do normal feature work in the canonical root. Only
re-open this section's sequencing if actually touching #100/#101/#102 or if
something about the new structure turns out to be broken.

### 6.1 Why

The current structure grew without an initial plan: `BpR` (short for "Bucate
pe Roate," the first client the dashboard was built for as a demo) ended up
as the root folder/repo name for the entire BrandGEO product. That's
backwards — BpR is just one client and should only exist as a row in the
`clients` table, with no special status in folder structure, code, or naming.
This also directly serves the existing Scalability Rule (§4.1): no
hardcoded/special-cased client should ever leak into structure.

### 6.2 Target structure

- New root: `C:\Users\const\Constantin Daniel Goane\` — the personal/company
  root, containing every project as a subfolder.
- BrandGEO becomes one project folder under that root (exact target path TBD
  at execution time, e.g. `...\Constantin Daniel Goane\BrandGEO\`), containing
  what's currently split across `C:\Users\const\Desktop\BpR` (dashboard,
  signup, rules, CLAUDE.md, loose utility scripts) and
  `C:\Users\const\Desktop\brandgeo` (website source, once merged).
- Loose personal-utility files currently at BpR root (`credentials.json`,
  `gpt_agents_benchmark.csv`, `run_benchmarker.bat`, `test_apis.py`,
  `benchmarker_log.txt`, `token.json`, `rotation_state.json`,
  `name_intelligence.py`, `run_name_intelligence.bat`, `name_results.json`,
  `geo-visibility-report-2026-06-30.md`) **stay inside the BrandGEO project
  folder** (decided 2026-07-08 — they support BrandGEO, e.g. the GPT agent
  benchmarker) rather than getting split into a separate tools folder.
- The Cowork-connected folder `C:\Users\const\Claude\Projects\BrandGEO`
  (holds `CLAUDE-MEMORY.md` + a stray `bg-001.html`/hero image/2 PDFs) is a
  separate concern from this local-disk restructuring — not yet folded in,
  needs its own review.

### 6.3 GitHub

- ✅ **DONE 2026-07-08** — Live repo `github.com/Tenerife365/BpR` renamed to
  **`github.com/Tenerife365/GetBrandGeo`** (not `brandgeo` as originally
  planned — see below for why). Constantin did this manually via GitHub
  Desktop + the repo's GitHub.com settings tab. Verified live via web fetch:
  111 commits, all expected content present (`brandgeo-dashboard`,
  `brandgeo/web`, `brandgeo-signup`, etc.).
  **Naming collision sidestepped, not resolved:** the separate abandoned
  standalone repo (2 commits) still occupies `github.com/Tenerife365/brandgeo`
  — see below. Renaming to `GetBrandGeo` instead of `brandgeo` avoided needing
  to touch that repo at all. #100 (deciding that repo's fate) is now a
  fully independent, non-blocking cleanup task.
  **Not yet done:** the local clone's git remote at `C:\Users\const\Desktop\BpR`
  still points to the old URL (`https://github.com/Tenerife365/BpR.git`).
  GitHub redirects it, so it likely still works, but Constantin should run
  `git remote set-url origin https://github.com/Tenerife365/GetBrandGeo.git`
  to point it at the real URL directly (Claude can't edit `.git/config` —
  blocked as a protected path).
- The separate abandoned repo `github.com/Tenerife365/brandgeo` (2 commits,
  the standalone scaffold whose `web/` folder was merged into the real repo
  back in #98) — its fate (delete vs. leave dormant) is still an open,
  low-priority decision (#100), but no longer blocks anything since the
  rename went to a different name.

### 6.4 Sequencing (do not skip steps or parallelize with another session)

1. ✅ **DONE 2026-07-08** — `web/` merge (standalone `brandgeo\web` +
   `BpR\brandgeo\web` → one reconciled version). See #98 in §5. Both
   originals backed up to `BpR\legacy\web-snapshots\` before merging.
2. ✅ **DONE 2026-07-08** — Fresh snapshot backup of the confirmed-correct,
   merged `web/` folder (distinct from the step-1 backups, which are of the
   pre-merge *originals*). Live folder `BpR\brandgeo\web\` copied to
   `BpR\legacy\web-snapshots\2026-07-08-merged\`. Verified: 25/25 files match
   (19 text files + `images\` subfolder with 6 binaries: `bg-001/002/003-hero.jpg`,
   `bg-004-hero.png`, `bg-004-hero-old-pil.png.bak`, `logo.png`), directory
   structure matches source exactly, spot-checked `robots.txt` (byte-identical)
   and `images\bg-001-hero.jpg` (renders identically).
   **Note for future sessions:** this session's sandboxed Linux shell
   (`mcp__workspace__bash`) was down (`HYPERVISOR_VIRT_DISABLED`) — Read/Write
   tools can't do byte-exact copies of binary files, and hand-transcribing
   text files through chat is slow and risks transcription errors. Constantin
   ran the copy himself instead. First attempt used
   `Copy-Item -Path "...\web\*" -Destination "..." -Recurse -Force`, which
   silently **flattened the `images\` subfolder** (a known PowerShell
   `Copy-Item` + wildcard-source + `-Recurse` bug) — caught on verification,
   fixed with `robocopy "...\web" "..." /E` instead, which preserves directory
   structure correctly. **Prefer `robocopy /E` over `Copy-Item -Recurse` for
   any future folder snapshots in this project** (relevant again at §6.4 step 4,
   the local-disk move).
3. ✅ **DONE 2026-07-08** — GitHub rename. See §6.3 — renamed to
   `github.com/Tenerife365/GetBrandGeo` (not `brandgeo`), which sidestepped
   the naming collision rather than resolving it. Local git remote still
   needs `git remote set-url` (not yet done — see §6.3).
4. ✅ **DONE 2026-07-08** — New root created at
   `C:\Users\const\Constantin Daniel Goane\BrandGEO\` and populated via
   `robocopy` (real Windows desktop access this session, not the sandboxed
   shell — that stayed down the whole session, `HYPERVISOR_VIRT_DISABLED`).
   This was a **copy, not a move** — both source folders
   (`C:\Users\const\Desktop\BpR` and the standalone
   `C:\Users\const\Desktop\brandgeo`) are left untouched on disk; deletion of
   old locations is step 8, only after steps 5–7 verify everything works from
   the new structure.
   - Copied `C:\Users\const\Desktop\BpR\*` → new root, excluding
     `node_modules`, `dist`, `__pycache__` (regenerable build artifacts —
     **run `npm install` inside the new `brandgeo-dashboard\` before building
     or dev-serving from the new location**). Verified 1296/1296 files copied,
     git repo intact at the new path (`git status` clean branch, remote
     already `https://github.com/Tenerife365/GetBrandGeo.git`).
   - **Scope discovery not in the original §6.2 plan:** the standalone
     `C:\Users\const\Desktop\brandgeo\marketing\` folder (LinkedIn banners,
     article post images, `BrandGEO_Posts_5_to_14.pdf` — 19 files) had never
     been accounted for anywhere in this restructuring plan. Constantin
     confirmed it should move in too — copied to
     `...\BrandGEO\marketing\`. Verified 19/19 files. The rest of the
     standalone `brandgeo` folder (its own `backend\`, `rules\`, `web\`,
     `.git\`) was **not** copied — that's the abandoned repo covered by #100/
     #101, left in place until those are separately resolved.
   - **Not yet done:** Cowork's connected-folder setting still points at
     `C:\Users\const\Desktop\BpR` — future sessions should connect to
     `C:\Users\const\Constantin Daniel Goane\BrandGEO\` instead once this is
     confirmed as the canonical copy. Until step 8 deletes the old `BpR`
     folder, **the two copies will drift out of sync** — treat
     `C:\Users\const\Constantin Daniel Goane\BrandGEO\` as canonical going
     forward and avoid editing `C:\Users\const\Desktop\BpR` directly.
5. Verify Netlify still builds/deploys correctly from the renamed repo.
   Constantin confirmed build status is correct (checked 2026-07-08, before
   the local disk move above — worth a quick re-check now that a second local
   copy exists, though Netlify builds from GitHub, not local disk, so this
   move shouldn't affect it).
6. ✅ **DONE 2026-07-08** — Merged `web/` re-uploaded to cPanel by
   Constantin from `C:\Users\const\Constantin Daniel Goane\BrandGEO\brandgeo\web\`.
   `images\bg-004-hero-old-pil.png.bak` and `article-builder.html` were
   deliberately left out of the upload (backup artifact / internal tool,
   not meant to be public).
7. ✅ **DONE 2026-07-08** — Supabase audit (project `brandgeo-dashboard`,
   `duiyifepitvugyulobqm`). Findings:
   - BpR itself is **not** special-cased — it's `clients` row `id=1,
     slug='bpr'`, no different from any other client. No policy, function,
     or trigger hardcodes its id or slug.
   - Found (and left in place, low priority): a legacy single-tenant table
     set — `search_queries` → `search_results` → `page_analysis` → `mentions`
     — predating the multi-tenant migration (#32). `page_analysis` has a
     column literally named `mentions_bpr`. None of these tables have a
     `client_id` column at all; they're unreferenced by the current
     architecture (§1). Dead schema clutter, not an active bug — candidate
     for a future cleanup, not urgent.
   - Found and **fixed**: several tables had leftover permissive RLS
     policies (`qual: true`, role `authenticated`) sitting *alongside* the
     correct per-client policies — `ai_results` ("Auth read/write
     ai_results"), `prompts` ("Auth read/write prompts"), `clients`
     ("clients_read"), `competitors` ("Auth read"), plus "Auth read" on the
     legacy `search_results`/`page_analysis`/`mentions` tables. Since
     Postgres OR's multiple permissive RLS policies together, these
     **completely bypassed per-client isolation** — any authenticated user
     (any client's viewer) could read every other client's `ai_results` and
     `prompts`, and write/delete any client's `prompts`. Not BpR-specific —
     affected every tenant. Constantin ran the fix directly in the Supabase
     SQL Editor (`DROP POLICY` on all 9 leaky policies); re-verified via
     `pg_policies` afterward — all leaky policies gone, every remaining
     policy correctly scoped to admin-or-own-client, and the legacy tables
     now correctly deny-all (no policies = locked down, only service_role
     bypasses).
8. ✅ **DONE 2026-07-08 (partial — archived, not deleted)** — Constantin
   chose to **archive rather than delete**: `C:\Users\const\Desktop\BpR` and
   the standalone `C:\Users\const\Desktop\brandgeo` were moved (not copied)
   to `C:\Users\const\Constantin Daniel Goane\BrandGEO-archives\BpR` and
   `...\BrandGEO-archives\brandgeo-standalone` respectively. Verified: both
   old Desktop paths now return false on `Test-Path`; both archive paths
   exist; the canonical `C:\Users\const\Constantin Daniel Goane\BrandGEO`
   folder is untouched and correct (top-level structure unchanged, and
   `brandgeo-dashboard\node_modules` now present — `npm install` was run
   there at some point after step 4, as instructed).
   **Still open, not part of this pass** (each is independent, none were
   confirmed in scope when this ran):
   - #100 — fate of the abandoned GitHub repo `Tenerife365/brandgeo` (2
     commits) — delete vs. leave dormant. The local clone of it now lives
     at `...\BrandGEO-archives\brandgeo-standalone\` (still has its own
     `.git\` pointing at that GitHub repo).
   - #101 — retiring `brandgeo-signup/` and reconciling the duplicate
     `backend/` copies (one now in the canonical root's `brandgeo\backend`,
     one in the archived `brandgeo-standalone\backend`).
   - #102 — the legacy `search_queries`/`search_results`/`page_analysis`/
     `mentions` Supabase tables (already RLS-locked, ~430 rows of old test
     data) — drop vs. archive vs. leave as-is.

### 6.5 Collision risk

Constantin sometimes runs a second "old chat" session in parallel. Two
sessions already collided once (2026-07-08) writing to `BpR\brandgeo\web`
at the same time. Before doing any write under this restructuring, confirm
with Constantin that no other session is active on the same paths.

**Second collision, different failure mode (2026-07-08):** during task
#83, file-level scoping worked correctly (#72 and #84 both deliberately
avoided `Layout.tsx`/`App.tsx` while #83 was using them), but a `git
stash`/`git status` from one session still collided with another session's
git operation and corrupted `.git/index` (see #83's entry in §5 for the
full incident and recovery command). Lesson: non-overlapping file scope
does not by itself prevent git-level collisions — `git commit`/`push`/
`stash` are repo-wide and must be serialized separately. This is now a
standing rule, not a one-off fix — see the "Parallel task scoping" bullet
in §0 and `rules/parallel-task-scoping.md`. Going forward, pending tasks in
§5 should carry a `Scope:` tag so overlapping work is visible before two
sessions start in parallel.

### Planned (not yet numbered)

- Extract `analyseResponse` into `_analysis.js` shared helper (resolves §2.1)
- Model migration: `collect-claude.js` → hybrid Sonnet 5 + Opus 4.8
- OpenRouter fallback for same-model continuity when primary quota runs out (medium-term)
- Scheduled automatic collection (cron-triggered Netlify function)
- Caching layer to deduplicate identical prompt+market combinations across clients

---

## 7. Redesign Initiative — Website + Dashboard Modernization (opened 2026-07-08)

**Status: kicked off, not yet built.** Constantin wants both `getbrandgeo.com`
and `app.getbrandgeo.com` to compete visually with modern AI-visibility SaaS
tools (named benchmark: **peec.ai**) — describes current state as "25% of
100%" vs. a slick, intuitive, modern competitor bar. This should live in its
own **`Master-Redesign`** chat going forward (see §0 chat-naming convention —
ongoing/occasional-update area, not a single scoped task), not be folded into
unrelated task chats.

### 7.1 Audit findings (design-critique pass, 2026-07-08, live site + dashboard)

Checked live via browser: `getbrandgeo.com` (hero + "what you get" section)
and `app.getbrandgeo.com` (Overview page), plus source-code check of
`Dashboard.tsx` and `tailwind.config.js`.

- 🔴 **Critical bug, not a design problem:** the dashboard **Overview** page
  (`Dashboard.tsx`) renders in a plain light/white theme live, even though
  its own source code uses `bg-dark-700`, `text-white`, `border-dark-600`
  throughout, and `tailwind.config.js` does define those tokens via CSS
  variables (`--dark-700`, `--dark-600`, etc.). The rest of the app
  (`Layout.tsx`, `AIVisibility.tsx`, `Recommendations.tsx`, `Prompts.tsx`,
  `Mentions.tsx`) correctly renders the violet/dark theme — **Overview is the
  outlier**, both in the live screenshot and in that it's the one page that
  doesn't grep-match the dark theme classes as heavily. Root cause not fully
  confirmed — leading hypothesis is either a stale Netlify deploy vs. latest
  commit, or the `--dark-700`/`--dark-600` CSS custom properties not being
  defined/loaded correctly for that route. **This needs to be fixed BEFORE
  any visual redesign work on Overview**, since new components would render
  on top of the same broken variables otherwise.
- 🔴 Marketing site's own "what you get" section shows a polished dark
  dashboard-preview mockup (big AI Visibility Score ring, clean card
  layout) that **does not match the real dashboard** — a real trust/first-
  impression gap between what's promised and what's delivered.
- 🟡 Overview's `Brand Visibility by AI Engine` chart overflows/cuts off at
  the right edge of its container — responsive/overflow bug in the chart
  container, separate from the theme issue.
- 🟡 Sidebar nav is a flat icon+label list with no grouping and a weak
  active-state indicator, compared to grouped/sectioned nav patterns in
  modern competitors.
- 🟢 Cards are flat-bordered with no elevation/depth — reads as less premium
  than competitor dashboards.
- ✅ What's already working: the website hero/copy/preview-mockup section is
  close to competitive already; the underlying violet dark-theme design
  system already exists and is correctly used on 5 of 6 dashboard pages —
  this is a fix-and-polish effort, not a from-scratch rebuild.

Full critique (first-impression/usability/hierarchy/consistency/accessibility
breakdown) was delivered in chat on 2026-07-08 — not fully duplicated here;
this section captures the decisions and findings that need to survive into
the next session.

### 7.2 Constantin's priority call (2026-07-08)

Given three recommended priorities (1. fix the Overview theme bug, 2. unify
chart styling to brand palette, 3. redesign sidebar nav + Overview layout for
stronger visual hierarchy — bigger score treatment, grouped nav, card
elevation), **Constantin confirmed priority 3 (the actual visual redesign) is
the most relevant one to him.**

**Sequencing dependency flagged and accepted:** priority 3 depends on
priority 1 being fixed first — a redesigned Overview layout would still
render with the same broken/light theme until the CSS variable / stale-
deploy issue is resolved. So the `Master-Redesign` work should treat the
theme-bug fix as **step zero** (quick, mechanical, not a design decision)
before building the new sidebar/Overview layout on top of it, rather than
skipping straight to the redesign and having it render broken too.

### 7.3 Next steps for the `Master-Redesign` chat (short version — see §7.4 for the full roadmap)

1. Diagnose and fix the Overview theme bug (check latest Netlify deploy
   timestamp vs. latest commit; check `index.css` for `--dark-700`/
   `--dark-600` variable definitions and confirm they ship in the production
   build).
2. Fix the Overview chart overflow bug.
3. Redesign sidebar nav (grouping, stronger active state) and Overview card
   layout (lead with a large AI Visibility Score treatment matching the
   marketing site's own preview mockup, add card elevation) — this is the
   actual "modern SaaS" polish pass Constantin asked for.
4. Unify chart color palette to brand violet/teal tokens across all pages
   (lower priority than 1–3 per Constantin, but still open).
5. Revisit whether the marketing site's dashboard-preview mockup should be
   swapped for a real screenshot once the redesigned Overview exists (ties
   into #84's still-open "real screenshot vs. mockup" question).

### 7.4 Full Phased Roadmap (requested 2026-07-08 — "plan even further")

Constantin asked for a fuller phased plan beyond the 5-bullet list above:
design-system definition, page-by-page order, and milestones. This
supersedes §7.3 as the actual working plan — §7.3 stays as the quick-glance
summary of Phase 0.

**Phase 0 — Unblock (bug fixes, not design decisions)**
- 0.1 Diagnose + fix the Overview theme bug (§7.1).
- 0.2 Fix the Overview chart overflow/responsive bug.
- *Exit criteria:* Overview renders in the same dark/violet theme as every
  other page; no chart clipping.

**Phase 1 — Design System Consolidation**
Formalize what's partially already there (§4.2 violet tokens,
`ENGINE_META` colors) plus what's missing:
- Color: primary/accent violet, slate backgrounds, engine colors — mostly
  defined already, needs to be the single source of truth (this file §4.2,
  or a new `DESIGN-SYSTEM.md`).
- Typography scale — currently ad hoc per page, needs a defined
  heading/body/label scale.
- Spacing scale — for consistent card padding/gaps across pages.
- Elevation/shadow tokens — new; cards are currently flat-bordered (§7.1
  finding), need a subtle shadow/gradient-border system for "premium" feel.
- Chart color palette — unify whatever charting lib is in use to brand
  violet/teal tokens instead of default library colors.
- CTA/button variants — primary/secondary/ghost, directly serves
  Constantin's "smooth call-to-action" ask.
- Empty/loading/error state patterns — for consistency across pages.
- *Exit criteria:* every token Phase 2+ needs is named and defined once,
  not invented per-page.

**Phase 2 — Shell Redesign (`Layout.tsx`)**
- Group sidebar nav into logical sections (e.g. Insights: Overview/AI
  Visibility/Sentiment; Strategy: Competitors/Recommendations; Manage:
  Prompts/Usage/Onboard — illustrative, adjust to taste) instead of one flat
  list.
- Stronger active-state indicator (e.g. left accent bar + background tint,
  not just a bg tint).
- Highest-leverage single change — `Layout.tsx` wraps every page, so fixing
  it once benefits all of them.
- *Exit criteria:* current page is obvious at a glance; nav reads as
  organized, not a flat icon dump.

**Phase 3 — Page-by-Page Redesign (priority order)**
1. **Overview** (`Dashboard.tsx`) — highest-traffic page, first thing seen
   after login, currently the most broken. Lead with a large AI Visibility
   Score treatment (ring/gauge) matching the marketing site's own preview
   mockup; add card elevation from Phase 1; fix chart styling.
2. **AI Visibility** (`AIVisibility.tsx`) — core feature page (engine cards,
   prompt table, Fix This hub); apply Phase 1–2 conventions.
3. **Brand Sentiment** (`BrandSentiment.tsx`) — newest page (#83), least
   legacy-encumbered, good candidate to set the "target look" other pages
   get matched to.
4. **Competitors, Recommendations, Mentions** — same treatment, lower
   individual traffic than 1–3.
5. **Prompts, Usage, Onboard, Signup** — functional/utility pages, lowest
   visual priority but still worth bringing onto the token system, to avoid
   repeating the "5 of 11 pages" inconsistency pattern already documented in
   #72 (i18n coverage drift).
- *Exit criteria per page:* passes a quick self-check against Phase 1
  tokens — hierarchy, consistency, no `as any` casts or hardcoded one-off
  colors (§4.4).

**Phase 4 — Marketing Site Alignment**
- Swap the "what you get" dashboard-preview mockup on `getbrandgeo.com` for
  a real screenshot/embed of the redesigned Overview — resolves the open
  question already flagged in #84.
- Lower-priority pass on `blog.html`/`bg-00X.html`/`faq.html`/`terms.html`
  for the same visual consistency (these already scored better in the §7.1
  audit, so this is polish, not a fix).

**Phase 5 — Polish & Accessibility Pass**
- Run `design:accessibility-review` (contrast, touch targets) across every
  redesigned page.
- Dedicated `design:ux-copy` pass on CTAs/microcopy — this is Constantin's
  explicit "smooth call-to-action" ask, worth its own pass rather than
  folding into Phase 3.
- Motion/transition polish (hover states, subtle transitions) for the
  "pleasant to open" feel Constantin described.

**Timeline framing**
This codebase's workflow is session-scoped, not calendar-scoped (§0: one
Task chat = one scoped step). Rough session budget, not calendar time:

| Phase | Est. sessions |
|---|---|
| 0 — Unblock | 1 |
| 1 — Design system | 1 |
| 2 — Shell/nav | 1 |
| 3 — Page-by-page (6 pages/groups) | 5–6 |
| 4 — Marketing site alignment | 1–2 |
| 5 — Polish/accessibility | 1–2 |
| **Total** | **~10–13 sessions** |

The temporary parallel-work window (§0, through 2026-08-12) makes this a
good time to push through Phases 0–3 (the structural, highest-leverage
work) since multiple Task chats can run at once on non-overlapping pages —
e.g. one session on Phase 3.1 (Overview) while another does Phase 3.3
(Sentiment), as long as neither touches `Layout.tsx` at the same time as
Phase 2. Phases 4–5 are lower-risk and can spill past the window if needed.
