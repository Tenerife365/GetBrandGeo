# BrandGEO Prospect Radar — reusable run prompt

Paste this (or just say "run the Prospect Radar using this file") into any
Cowork chat with the `C:\Users\const\Constantin Daniel Goane\BrandGEO` folder
connected. It is fully self-contained — no chat memory required.

---

You are running the **BrandGEO Prospect Radar** — a prospecting scan for BrandGEO (an AI Visibility / GEO monitoring SaaS at getbrandgeo.com). This is Component B from `SALES-ENGINE.md` §3 and CLAUDE.md §10. This is a Cowork automation, NOT product/repo code — do not touch `brandgeo/web/` or `brandgeo-dashboard/`.

**Start of every run:**
1. Connect folder `C:\Users\const\Constantin Daniel Goane\BrandGEO` if not already connected.
2. Load tools via ToolSearch in one batch: `select:mcp__b0cb111c-e540-42ae-b632-5b8901ed6ff1__nimble_search,mcp__b0cb111c-e540-42ae-b632-5b8901ed6ff1__nimble_extract,mcp__80a7b216-46c5-417f-8fbd-fc28aef13b36__search_crm_objects,mcp__80a7b216-46c5-417f-8fbd-fc28aef13b36__search_properties,mcp__cowork__present_files` (Nimble = web scraping/search; HubSpot = read-only dedupe check only, see guardrails). Also confirm `mcp__workspace__bash` is available — it's what actually calls Component A's audit endpoint (a plain HTTPS POST, not an MCP tool of its own).
3. Read `sales-radar/radar-state.json` in the connected folder — this tracks the current vertical, already-screened companies (skip anything screened in the last 90 days), the vertical-rotation list, and the excluded list. If it doesn't exist, initialize it (see the shape at the bottom of this file).
4. **Note on the AI-visibility-gap signal — RESOLVED 2026-07-16, use Component A, not Nimble geo mode.** Nimble's `focus: "geo"` mode and `include_answer` return `403 — enterprise accounts only` on the current plan (confirmed 2026-07-09) — do not spend time retrying that path or proposing a Nimble plan upgrade to fix it. BrandGEO's own Instant Audit Engine (Component A) is live in production and is the real qualifier — use it directly, per Step 3 below. It requires the `INTERNAL_AUDIT_KEY` value from the `brandgeo_internal_audit_key` memory (never hardcode the raw key into this file or any committed doc — pull it from memory each run) sent as the `X-Internal-Key` header. Verified live 2026-07-16 via `mcp__workspace__bash` (`curl`):
```
curl -s -X POST "https://app.getbrandgeo.com/.netlify/functions/audit-domain" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: <INTERNAL_AUDIT_KEY from memory>" \
  -d '{"domain":"<candidate-domain>","depth":"screening"}'
```
Returns synchronously (a few seconds, `depth: "screening"` runs only 2 cheap engines): `{"token":"...","status":"ready","teaser":{"domain":"...","ai_score":0-100,"category":"..."}}`. This `ai_score` is the real, quantified version of the old manual listicle-judgment proxy.

**Cost note, real not hypothetical:** each screening call spends a small amount of actual API money (roughly €0.02-0.04 per candidate against gemini+perplexity), drawn from the same `PROSPECTING_MONTHLY_BUDGET_EUR` pool (default €200/mo) Component A already enforces server-side (`checkMonthlyBudget`/`checkGlobalHourlyLimit` in `_prospect_guard.js`, CLAUDE.md §10.4). At the 40-candidate/run cap that's ≤€1.60/run — small, and the guard is enforced on Component A's side, so a run that hits the pool limit will simply get a `429`/blocked response for that candidate rather than silently overspending. If a call 429s, errors, or times out, note it and fall back to the old `focus: "general"` listicle-proxy method for that one candidate only — do not fabricate a score and do not let one failed call block the rest of the run.

**Workflow:**

### Step 1 — Source candidates (Nimble)
Use `nimble_search` (focus "general" or "news", search_depth "lite") against the current vertical — e.g. "[vertical] companies 2026", "[vertical] startups funding", "best [vertical] tools alternatives", "[vertical] SaaS company hiring marketing". Skip any domain already in `screened` with `last_screened` less than 90 days ago, and skip anything in `excluded`. Aim for 20-40 new/eligible candidates.

### Step 2 — KNOCKOUT filter (apply BEFORE scoring — exclude entirely, don't score or surface)
Exclude if ANY hold:
- Currently being acquired / in active M&A, or already fully absorbed into a parent brand.
- Owned by a parent company/suite with no independent marketing budget.
- Public company, or too large to plausibly buy from an early-stage vendor (rough heuristic: >$500M revenue, >2000 employees, or a household-name incumbent).
- Is itself a direct GEO/AI-visibility-monitoring competitor to BrandGEO: peec.ai, Profound, Otterly.AI, Scrunch AI, AthenaHQ, Rankscale, Ahrefs Brand Radar, Semrush AI Toolkit, Conductor.
- Already in `excluded`.
Record knockouts in `screened` with `knockout_reason` set.

### Step 3 — Screen survivors, cap at 40 per run
Score 0-100 across 5 weighted signals:
- **AI-visibility gap (40, THE discriminator).** Call Component A per the note above and get `ai_score` (0-100). Convert to points: `points = round(40 * (100 - ai_score) / 100)` — never cited (ai_score near 0) → near-full 40; consistently/prominently cited already (ai_score high) → near 0, deprioritize even if other signals are strong. Still worth one quick manual glance at a "best of 2026" listicle for the category to note *which* competitor is winning the citations Component A measured — that context makes the drafted opener (Step 6) sharper, it just isn't the scoring signal anymore.
- **Marketing intent (20).** Careers page for marketing/SEO roles, active blog/content.
- **Vertical fit (15).** Full marks if genuinely in-vertical (constant within a single-vertical run, that's expected).
- **Budget/timing (15).** Recent (~6-12mo) funding, launch, rebrand, or growth signal.
- **Reachability (10).** Named founder/marketing lead + a public contact path, public info only. This has been the weakest signal in past runs — spend extra Nimble calls here (LinkedIn, "about" pages) before drafting outreach.
Sum to 0-100. Tier: Hot ≥70, Warm 50-69, Watch <50. Update `screened[domain]`.

### Step 4 — Surface, hard-capped at 15 per run
Only Hot + top Warm, capped at 15. Never pad to hit 15.

### Step 5 — Dedupe against HubSpot (read-only — never write)
`search_crm_objects` (objectType "companies") per surfaced candidate. Flag "Already in HubSpot" if found. **Never call any HubSpot write/create/update tool in this task** — it needs interactive human confirmation this can't give, and it would violate the never-auto-send guardrail this system is built on.

### Step 6 — Draft a personalised opener per surfaced prospect (draft only, never send)
3-5 sentences referencing the specific AI-visibility finding from Step 3. Label **DRAFT — NOT SENT**. No email-sending capability exists or should be attempted.

### Step 7 — Write the output report
Write `sales-radar/radar-<vertical-slug>-<YYYY-MM-DD>.md`: header (date, vertical, counts), ranked table, detailed per-prospect section (all 5 sub-scores + evidence + reachability + drafted opener), watch-list summary line. Overwrite `sales-radar/LATEST.md` with the same content. Append surfaced rows to `sales-radar/radar-log.csv`. Update `radar-state.json`'s `weekly_log`.

### Step 8 — Hand off
`mcp__cowork__present_files` on the new report. Final message: how many Hot/Warm surfaced, the single best prospect and why, reminder this is sized for a ~30-min review (approve/edit drafts → send from your own inbox → push approved ones to HubSpot yourself or ask Claude to, live).

**Guardrails — never violate:**
- Never send outreach. Draft-and-queue only.
- Never create/update/delete any HubSpot object.
- Never exceed 40 screened / 15 surfaced per run.
- Never scrape/store personal (non-business-professional) info.
- Respect `excluded` in the state file.
- If Nimble/HubSpot fail or return auth errors, stop and note it rather than fabricating data.
- Never fabricate a company, score, or citation — trace every claim to an actual search made this run.

**State file shape** (`sales-radar/radar-state.json`):
```json
{
  "current_vertical": "...",
  "vertical_rotation": ["...", "..."],
  "screened": { "<domain>": { "company": "", "last_screened": "YYYY-MM-DD", "score": 0, "tier": "", "knockout_reason": null } },
  "excluded": [],
  "weekly_log": [ { "date": "YYYY-MM-DD", "vertical": "", "screened_count": 0, "surfaced_count": 0 } ]
}
```
