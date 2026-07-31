# SPRINT-100 Kickoff Pack, 2026-07-31

Goal: 100 paying subscribers in 30 days (window 2026-08-01 to 2026-08-30).
This file is the single registry for the sprint. Every workstream below is a
ready-to-paste kickoff prompt for a fresh chat, written so that a cold session
can point itself, act, verify, and record the result without this conversation
existing. Sprint task ids are S1 to S10; they are allocated HERE and nowhere
else, to avoid colliding with the numeric task ids (#1 to #108, consumed) and
the roadmap letter ids (A, B, C, D streams in `docs/ROADMAP.md`).

Verified against HEAD on 2026-07-31 before writing, because three council-level
claims turned out stale: the onboarding plan coercion is FIXED and committed
(reviews in `docs/qa/plan-coercion-fix-011.md`), Growth PRO IS purchasable
(live Stripe price, metadata.plan=growth_pro), and PLAN_PROMPTS IS enforced
server-side by `trg_enforce_prompt_cap` in Postgres. Do not re-file those.

## Binding rules for every sprint chat

1. `docs/AUTONOMY.md` governs. Day-only for billing, auth, schema, and
   customer-visible copy. Stripe is LIVE MODE: writes are real money objects.
   Never send anything to a customer. Never trigger collection runs (spends
   money, authority withheld). Never print or move a secret.
2. **The ground-truth rule.** An item is not done until its check command exits
   0. If a kickoff below names a check that does not exist yet, the chat writes
   the check FIRST, then builds.
3. **Run `git log -- <file>` before building anything.** Two full cycles have
   already been wasted in this repo building fixes that existed.
4. Git is serialized: one committer at a time across all sessions. Parallel
   chats need disjoint `Scope:` lines; check the other in-flight S-tasks here
   before starting.
5. Agents: pasting a kickoff that names an agent IS Constantin asking for that
   agent. Billing, auth and schema go `bg-backend` on Opus, then `bg-verify`.
   Agents never run git; the session orchestrating them commits.
6. No em dashes, no en dashes, no AI buzzwords in anything customer-facing.
7. Every chat ends with the RECORD step done, plus a status block for
   Constantin: Completed / Requires your action / Still pending.

## Sprint status board

Mark state here when a task starts or finishes, so parallel chats can see each
other. States: OPEN, IN PROGRESS (chat title), DONE (date, check output).

> Reconciliation 2026-07-31 10:35, before first commit of this file: three
> commits landed from parallel sessions while this pack was being written.
> `eff8d9e` ran C1 (S3 stage 1 is DONE, and its C1a finding is CRITICAL: the
> audit report works but is unreachable, the promised unlock email is never
> sent). `67a3cf4` recorded Constantin's rulings: a package sells a tier not
> prompts (S1 decision 4 is DECIDED), and the UTC offset is confirmed local =
> UTC+1 (night window 19:00-06:00 UTC). `46b92fc` shipped empty-state and
> contrast work adjacent to S4. Chats running S1, S3 or S4 read those three
> commits before acting.

| id | Task | Owner | Window | State |
|---|---|---|---|---|
| S1 | Ladder ruling: Radar tier, prompt rebalance, inversion | bg-strategy + Constantin | day | **DONE 2026-07-31.** `docs/strategy/sprint-ladder-ruling.md`, all four DECIDED by Constantin. Radar in at EUR 39 list / EUR 29 launch, **amended to Gemini + Claude** (not ChatGPT + Gemini) on cost, 7 prompts, weekly, 1 site. `PLAN_PROMPTS = 5, 7, 18, 35, 56, 200, 200`. SUM pools, MAX site allowance. Decision 1b also ruled: **`PLAN_ENGINES.free = ['gemini']`**, so the free budget stays 0.30 and the 0.60 raise is cancelled. Checks: `grep -c "^\*\*DECIDED 2026" -> 5` (decisions 1, 2, 3 and decision 4's two carried lines) plus a separately-keyed `DECIDED 1b 2026-07-31`, and `grep -c "DECIDED.*<date>" -> 0`, so no decision is left unsigned. **S2, S7, S14 unblocked, nothing owed.** |
| S2 | Build the ruled ladder end to end | bg-backend Opus, bg-verify | day | **IN PROGRESS 2026-07-31 16:5x** (orchestrator chat). Split and running in parallel: `bg-backend` on `planConfig.ts` + `_cost.js` + `_plans.js` + a `db/` migration for `plan_prompt_caps`; `bg-web` on `brandgeo/web/` pricing and JSON-LD. **Dashboard UI and the Stripe price are held for wave 2**, see S16 |
| S16 | Radar wave 2: dashboard UI, Stripe price, checkout | orchestrator + bg-backend | day | **BLOCKED on S2 wave 1.** Held back deliberately: `src/pages/` and `src/components/` have ~25 files dirty from another session, and the Stripe price must carry the final `metadata.plan` from wave 1 or it prices the wrong thing in LIVE mode |
| S17 | Client-facing notifications | bg-architect, then bg-app | day | **DESIGN IN PROGRESS 2026-07-31** (`docs/arch/client-notifications.md`). Constantin's rule: whenever we email a customer, the same message appears shortened in their own dashboard. Plus a Radar launch announcement to free tier with interest capture, so demand is measured before more is built |
| S18 | Radar worst-case unit economics | bg-strategy | day | **IN PROGRESS 2026-07-31** (`docs/strategy/radar-unit-economics.md`). Is Radar profitable when a customer uses every prompt and every refresh the plan allows? Verifies the budget cap actually binds rather than assuming it |
| S3 | Funnel accept path (roadmap C1, C2, C3) | optimizer, bg-copy, bg-app, bg-verify | day | **IN PROGRESS 2026-07-31**, 5 commits, NOT pushed. C1 (eff8d9e), C1a (`ceb3596`, live), C1b, C1c, **C2 DONE**. **C3 PARTLY DONE**: `bg-verify` returned FAIL, the Stripe Payment Links are permanent and are published in the public repo and its history, so the gate covers the route and not the destination. Webhook detection added; **rotating the links is Constantin's and is what closes C3**. Both checks exit 0, migrations applied. F1 OPEN BY DECISION. **SHIPPED AND LIVE** (7 commits, md5-verified on getbrandgeo.com, signup verified on app). Two reviews: FAIL then **PASS WITH FINDINGS**. Remaining: the authorized live audit run (needs a test address), link rotation (Constantin), and S3 should not close while the free tier cannot finish its first collection (S1/S2) |
| S4 | First-run truth: zero-data states | bg-app | day | OPEN, narrowed; read 46b92fc first |
| S5 | Research pages feed the audit funnel | bg-web | day | OPEN |
| S6 | Evidence Machine | scripts, founder-run | day | OPEN |
| S7 | LAUNCH30 coupon live end to end (roadmap A4 slice) | bg-backend Opus, bg-verify | day | OPEN |
| S8 | Outbound infra: domain, warmup, GBP | Constantin, chat instructs | day | **IN PROGRESS** (chat `S8 · Outbound infra`, 2026-07-31); instructions written to `docs/growth/outbound-infra.md`, Constantin is on STEP 1 (register the domain). Stays IN PROGRESS until mail-tester 9+ and the GBP public check both pass |
| S9 | Scoreboard and checkpoint gates | any session | night-safe | OPEN |
| S10 | Close the A1-S1 revert gate | bg-backend Opus, bg-verify | day | **NARROWED: two thirds already shipped in `3c3f003`. Only A1-S2-tier remains.** See PART D-0 |
| S11 | Outreach scripts and founder profile | bg-copy, bg-verify | day | OPEN, needs S3 stage 2 + S6 |
| S12 | Distribution loop and placement blitz | growth-media-architect, this session | day | OPEN |
| S13 | Error monitor goes live | this session + Constantin | day | OPEN, needs account |
| S14 | Founding prepay offer machinery | bg-backend Opus, bg-verify | day | OPEN, blocked by S1 and S10 |
| S15 | Referral loop operations | bg-copy + this session | day | OPEN, blocked by S7 |

---

# PART A. Criterion improvement framework

The council scored five criteria. This section is the mechanism that moves each
score to what 100-in-30 requires, with the metric that proves the move and the
sprint task that owns it. Feasibility (criterion 5) is a composite: it rises
only when the other four do, so its plan is the sprint itself.

| Criterion | Now | Target | Mechanism | Proof metric | Owner |
|---|---|---|---|---|---|
| 1. Market relevance | 9 | 9 (hold) | Wedge stays "evidence for the omitted business", downmarket of Profound and peec.ai | Cold reply rate at or above 8 percent; below 5 percent means the wedge is not landing, change segment not volume | S6, S8 |
| 2. Customer comprehension | 6 | 9 | Funnel audit with evidence (C1), an accept-and-continue path (C2), contract-gated payment (C3), honest hero claims | `docs/qa/acquisition-funnel-audit.md` exists; `check-funnel-accept-path.sh` and `check-contract-gate.sh` exit 0; a stranger states what BrandGEO does after 3 seconds on the hero | S3 |
| 3. Discoverability | 5 | 8 | Active: 75 evidence touches per day once warmup matures. Passive: audit CTA on all 37 research pages, GBP corrected, launch day | Touches per day on the scoreboard; audit runs per day; GBP shows the real 5-engine lineup | S5, S8, S9 |
| 4. MVP readiness | 7 (was 5; coercion fixed, Growth PRO buyable, caps enforced) | 9 | Zero-data states stop issuing verdicts (S4), A1-S1 revert gate closed before any package sale to a subscriber (S10), real-card dress rehearsal | All S-task checks exit 0; one end-to-end paid signup on a real card, watched from click to first-session, with entitlements matching the tier paid for | S4, S10, S2 |
| 5. 30-day feasibility | 4 as priced | 7 | The four levers together: Offer (Radar entry rung, S1+S2), Engine (Evidence Machine, S6), Volume (Path 1 cadence on warmed infra, S8), Instrumentation (scoreboard gates, S9) | Glidepath: day 5 foundation checks all green; day 15 at or above 30 paying; day 22 at or above 55; day 30 close-out. Day 15 under 20 triggers the pre-agreed fallback to Path 2 cadence | all |

The ideal framework, named once: **Offer, Engine, Volume, Instrumentation,
Delivery.** Offer is S1+S2+S7. Engine is S6. Volume is S8 plus founder hours.
Instrumentation is S9. Delivery (the product keeping promises unattended) is
S3+S4+S10. A sprint that skips any one pillar reverts to the 4/10 baseline.

---

# PART B. Kickoff prompts

Paste each block into a fresh chat exactly as written. Title the chat with the
id and slug, for example `S1 · Ladder ruling`.

---

## S1. Ladder ruling: Radar tier, prompt rebalance, inversion

Owner: bg-strategy produces the brief, Constantin rules. Day-only. Pricing.
Scope: `docs/strategy/` only. No code.
Blocks: S2, S7. Blocked by: nothing.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S1: produce the single pricing ruling the sprint needs.
Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S1 IN PROGRESS).

CONTEXT, read in this order before any output:
1. docs/AUTONOMY.md, then docs/ROADMAP.md sections NEEDS CONSTANTIN, D1-pricing,
   A1-S2-tier, and the Carried over list (three conflicting Growth prompt
   counts).
2. docs/HANDOVER-2026-07-31.md section 5: the rebalance that never landed
   (planConfig.ts:400-420 documents allowances 5, 20, 50, 75, 250 restored on
   2026-07-29; the shipped constant is 5, 15, 35, 35, 120), the pro-tier
   inversion, and why per-site monotonicity is arithmetically impossible at
   current prices.
3. docs/arch/multi-site-tenancy.md pricing sections, docs/PRICING-STRATEGY-2026-07.md,
   docs/strategy/activation-thesis-app.md if present.
4. The sprint context: the council recommends a EUR 39/month entry tier
   ("Radar", launch price EUR 29 for the first 100 customers, 2 engines
   ChatGPT + Gemini, low prompt count, weekly refresh) because 100 paying
   subscribers in 30 days is not reachable at a EUR 99 cold entry.

ACTION: spawn bg-strategy to write docs/strategy/sprint-ladder-ruling.md
containing, as SEPARATE numbered decisions each with a recommendation, the
cost math, and the exact constants to ship:
1. Does Radar enter the ladder? If yes: price, engines, prompt allowance,
   refresh cadence, website count (D1 table), and its PLAN_MONTHLY_API_BUDGET_EUR
   at the standing 15 percent-of-price ceiling. CFO check required: collection
   cost per Radar client per month at the proposed cadence, shown in euros.
2. The PLAN_PROMPTS ladder, one authoritative set of numbers resolving the
   5,15,35,35,120 vs 5,20,50,75,250 conflict AND the Growth 35/50/75 conflict
   AND the Growth PRO inversion (must beat Growth per site under shared
   limits). Include Radar if decision 1 is yes.
3. Pooling for D1 shared limits: SUM or MAX (the architect recommends SUM for
   pools, MAX for the site allowance; see HANDOVER section 5).
4. ALREADY DECIDED 2026-07-31, commit 67a3cf4: a package sells a tier, not
   prompts, and no package copy may promise a prompt count above the tier's
   own. Do not re-open it; carry the ruling into the doc as a DECIDED line
   with that commit as the source.
Then present the four decisions to Constantin in this chat as a numbered list
with one-line recommendations. His answers get written INTO the ruling doc as
DECIDED lines with the date.

DO NOT: touch any code or any live price. Do not let the ladder regress the
margin rule (budget at 15 percent of price) without saying so in euros. Do not
invent refund terms or guarantees (see the ROADMAP warning block).

VERIFY: check command is `test -f docs/strategy/sprint-ladder-ruling.md`
AND the doc contains a DECIDED line for all four decisions. A ruling doc with
open questions is not done; leave S1 IN PROGRESS and list what is undecided.

RECORD: mark S1 DONE in the sprint registry with the date. Update
docs/ROADMAP.md: strike the resolved entries from NEEDS CONSTANTIN and Carried
over, citing the ruling doc. Add one line to CLAUDE.md CURRENT STATE pointing
at the ruling. Commit docs only, message `docs(strategy): sprint ladder ruling
(S1)`. End with Completed / Requires your action / Still pending.
```

---

## S2. Build the ruled ladder end to end

Owner: bg-backend on Opus, then bg-verify. Day-only. Billing and schema.
Scope: `brandgeo-dashboard/src/lib/planConfig.ts`,
`brandgeo-dashboard/netlify/functions/_cost.js`, `db/` (new migration),
Stripe (create only), `brandgeo-dashboard/src/pages/Signup.tsx`,
`brandgeo/web/index.html` pricing section + `faq.html` (serialize with S3/S5).
Blocks: S7 display. Blocked by: S1.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S2: ship the ladder that S1 ruled, everywhere the ladder
lives. Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S2
IN PROGRESS; confirm S1 is DONE first, otherwise stop).

CONTEXT, read in this order:
1. docs/strategy/sprint-ladder-ruling.md (the constants you will ship).
2. docs/AUTONOMY.md (Stripe writes granted, LIVE MODE, day-only; migrations
   need a down path; never send anything to a customer).
3. docs/ROADMAP.md A4b: plan_prompt_caps in Postgres is a FIFTH ladder copy
   that nothing keeps in sync; the drift check is the real work. Also read the
   trap list in docs/HANDOVER-2026-07-31.md section 6.
4. git log -- brandgeo-dashboard/src/lib/planConfig.ts and
   -- brandgeo-dashboard/netlify/functions/_cost.js before touching either.
5. Known ladder copies you must keep aligned in this one change:
   planConfig.ts, _cost.js, _plans.js (derives from _cost, verify not patch),
   plan_prompt_caps (Postgres), the marketing pricing section and its JSON-LD.

ACTION, in this order, write the checks first:
1. Write scripts/check-ladder-drift.sh: exits 0 only when planConfig.ts
   PLAN_PROMPTS, _cost.js budgets, and plan_prompt_caps rows all match the
   ruling, value for value (query Postgres via the Supabase MCP or a psql
   one-liner handed to Constantin). This closes the open half of roadmap A4b.
2. Spawn bg-backend (Opus): apply the ruled constants to planConfig.ts and
   _cost.js; add the Radar plan if ruled in (PLAN_ORDER, PLAN_TIERS, engine
   set, budget); write db/supabase-plan-caps-<date>-migration.sql updating
   plan_prompt_caps WITH a down path; create the Radar Stripe price with
   metadata.plan set, using the Stripe MCP (create only, live mode, do not
   link it anywhere customer-visible yet); wire Signup.tsx to offer Radar.
3. Update the marketing pricing section and faq.html to the ruled numbers,
   including the JSON-LD product schema. Validate JSON-LD on every touched
   page. No em or en dashes, no invented guarantees.
4. Spawn bg-verify on the whole diff: billing change, mandatory review. It
   must re-run the drift check and the existing billing harness
   (node brandgeo-dashboard/tests/package_provisioning.test.js).

DO NOT: run git from inside agents (this session commits). Do not touch
stripe-webhook.js beyond plan recognition (S10 owns its revert logic). Do not
edit index.html hero or nav (S3 and S5 own other parts of that file; check the
registry board and serialize). Do not deploy the migration without its down
path written.

VERIFY, all must pass with output pasted into the chat:
- bash scripts/check-ladder-drift.sh (exit 0)
- node brandgeo-dashboard/tests/package_provisioning.test.js (exit 0)
- npm run build in brandgeo-dashboard (exit 0)
- Stripe read-back of the new price: amount, currency, metadata.plan correct
- After deploy: the live pricing page shows the ruled numbers (curl + grep)

RECORD: mark S2 DONE in the registry with check outputs. Move A4b's drift-check
remainder to Done in docs/ROADMAP.md citing scripts/check-ladder-drift.sh.
Update CLAUDE.md CURRENT STATE (ladder numbers, Radar existence, price id).
Update the ladder inversion entry as closed. Commit serially, one concern per
commit, message includes the check command and result. End with Completed /
Requires your action / Still pending.
```

---

## S3. Funnel accept path (roadmap C1, C2, C3)

Owner: landing-page-optimizer, then bg-copy, then bg-app + bg-web, then
bg-verify. Day-only from C2 onward. Scope: `brandgeo/web/` (hero, audit flow),
`brandgeo-dashboard/src/pages/Signup.tsx`, `Onboard.tsx`, `AuditReport.tsx`,
`scripts/check-funnel-accept-path.sh`, `scripts/check-contract-gate.sh`,
`docs/qa/`. Blocked by: nothing (C1 can start now). Serialize web-file edits
with S2 and S5.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S3: close roadmap items C1, C2 and C3, the real customer
journey. Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S3
IN PROGRESS).

CONTEXT, read in this order:
0. STATE CHANGE 2026-07-31: stage 1 (C1) is ALREADY DONE, commit eff8d9e,
   report docs/qa/acquisition-funnel-audit.md. Read it first. Its C1a finding
   is CRITICAL and outranks everything else in this task: the audit report is
   built, deployed and working but unreachable, because unlock-audit-report.js
   sends no email while site.js:298 promises "Check your inbox". Fix C1a
   before C2/C3, per the updated Stream C ordering in docs/ROADMAP.md.
1. docs/ROADMAP.md Stream C, verbatim, as amended by eff8d9e (findings C1a to
   C1c); C2 add accept and continue; C3 payment gated behind contract
   acceptance, enforced server-side.
2. docs/design/homepage-hook.md section 2 (the measured 3-second failure) and
   section 12 (defects F6, F7 never assigned). The optimizer must try to
   REFUTE these, not inherit them.
3. Memory files: csp-blocks-inline-scripts (the marketing site silently drops
   inline scripts; site.js is the only script path), write-tool-silent-failure.
4. The two uncited hero stats (73 percent, 4.2x) still need a source or
   removal; treat as part of C1's evidence list.
5. git log -- brandgeo/web/index.html and -- brandgeo-dashboard/src/pages/AuditReport.tsx.

ACTION, staged, each stage's artifact feeds the next:
1. Spawn landing-page-optimizer against the LIVE https://getbrandgeo.com
   funnel: landing, audit run, results, next action. Output
   docs/qa/acquisition-funnel-audit.md with evidence per finding (C1's check).
2. Spawn bg-copy against that ledger: hero and funnel copy deck in docs/copy/,
   including the accept-path microcopy and the D1-upsell nudge phrasing rules
   (recommendation, never a block). No em or en dashes. No invented terms,
   no refund language (ROADMAP warning block is binding).
3. Write the checks: scripts/check-funnel-accept-path.sh (accept control
   exists and leads to the details step) and scripts/check-contract-gate.sh
   (payment unreachable server-side until terms accepted; a disabled button
   alone must FAIL this check).
4. Spawn bg-web + bg-app to build C2 and C3 against the copy deck: accept and
   continue at the audit results step, company-details step, contract gate
   wired to the existing terms.html, server-side enforcement of the gate.
5. Spawn bg-verify on the whole path: it is customer-facing money flow.

DO NOT: touch pricing numbers (S2 owns them), the research pages (S5), or
stripe-webhook.js (S10). Do not weaken any auth check. Do not add inline
scripts. Do not soften the server-side gate to a UI state.

VERIFY, paste outputs:
- test -f docs/qa/acquisition-funnel-audit.md
- bash scripts/check-funnel-accept-path.sh (exit 0)
- bash scripts/check-contract-gate.sh (exit 0)
- One full walk of the live funnel after deploy: audit -> results -> accept ->
  details -> contract -> payment reachable only after acceptance. Screenshot
  each step.

RECORD: mark S3 DONE in the registry. Move C1, C2, C3 to Done in
docs/ROADMAP.md with their check outputs and date. Update CLAUDE.md CURRENT
STATE: the A-branch review gap is closed by this pass, say so explicitly so
the stale backlog entry dies. Commit serially. End with Completed / Requires
your action / Still pending.
```

---

## S4. First-run truth: zero-data states

Owner: bg-app, spec from the existing audits. Day-only (customer-visible).
Scope: `brandgeo-dashboard/src/pages/` zero-data branches only,
`scripts/check-first-run-states.sh`, and committing the two untracked QA docs.
Blocked by: nothing. Disjoint from S2/S3 files except Signup.tsx (S3 owns it).

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S4: a brand-new client must never see a verdict before
data exists. Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S4
IN PROGRESS).

CONTEXT, read in this order:
1. Commit 46b92fc first (git show 46b92fc): it already shipped empty-state
   and contrast work on BrandSentiment, Competitors, Prompts, Recommendations
   and Account, and committed docs/qa/dashboard-uiux-audit-2026-07-30.md and
   dashboard-fix-brief-2026-07-30.md. Read both docs. What remains for this
   task is the VERDICT problem on the pages 46b92fc did not touch: Dashboard
   and AIVisibility still render 0 percent scores and "Needs Work" with zero
   data. Do not redo what 46b92fc did.
2. CLAUDE.md CURRENT STATE, Product quality: the measured first-run census
   (zero-data tenant sees 0 percent AI VISIBILITY SCORE across six dimensions,
   AI Visibility calls an unmeasured brand "Needs Work", /sentiment renders
   0 buttons and 0 links, 24 percent of routes are dead ends).
3. git log -- brandgeo-dashboard/src/pages/Dashboard.tsx AIVisibility.tsx
   BrandSentiment.tsx, plus the working tree status: several pages are
   already modified by another workstream; if BrandSentiment.tsx or
   Competitors.tsx carry uncommitted edits, STOP and coordinate before
   touching them, git is serialized.

ACTION, checks first:
1. Write scripts/check-first-run-states.sh: greps the built pages' source for
   the zero-data branch markers you introduce (a stable data-testid per page,
   for example first-run-state) and fails if any of the six dimensions can
   render a verdict string when its row count is zero. Keep it honest: the
   check must fail against HEAD before your change and pass after.
2. Spawn bg-app: on Dashboard, AIVisibility, BrandSentiment, Competitors,
   Recommendations, add an explicit zero-data branch: "Measuring your brand
   now. First results appear after your first collection, usually within the
   hour." with one CTA appropriate to the page (add prompts, view prompts,
   run status). No score ring, no Needs Work, no 0 percent anywhere in the
   zero-data branch. Violet theme tokens only, no teal, no new palettes.
3. Keep the diff presentation-only: no query changes, no context changes, no
   collection triggers (spending money is withheld authority).

DO NOT: redesign the pages (the visual system packet 009/013 owns that), fix
contrast (frozen for the sprint), touch light mode, or edit Layout.tsx.

VERIFY, paste outputs:
- bash scripts/check-first-run-states.sh (exit 0, and show it failing on the
  pre-change tree or explain why that proof was impossible)
- npm run build (exit 0)
- After deploy: a zero-data client view (admin impersonation via view-as, or
  a screenshot from a seeded empty client) showing the new state on each of
  the six pages. No verdict language visible.

RECORD: mark S4 DONE in the registry with the check output. Update CLAUDE.md
CURRENT STATE Product quality entry: first-run verdict issue closed, contrast
items still open. Commit the QA docs and the fix as separate commits. End
with Completed / Requires your action / Still pending.
```

---

## S5. Research pages feed the audit funnel

Owner: bg-web. Day-only (public copy). Scope: `brandgeo/web/` city and
industry pages plus the shared template block, `scripts/check-research-cta.sh`.
Blocked by: S3 stage 1 (know what the audit entry URL is before pointing 37
pages at it). Serialize with S2/S3 on any shared file.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S5: every research page becomes a door into the audit
funnel. Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S5
IN PROGRESS; confirm S3 stage 1 has named the canonical audit entry point).

CONTEXT, read in this order:
1. CLAUDE.md CURRENT STATE, Content pipeline: 27 city pages, 10 industry
   pages, and the JSON-LD lesson (three FAQPage schemas were silently invalid;
   site-wide validation is 110 of 111 and must not regress).
2. Memory: csp-blocks-inline-scripts (no inline script will execute; any
   behavior goes in site.js), no-AI-tells (no em or en dashes in copy).
3. One city page end to end (pick Baltimore) to learn the shared structure
   before templating anything.
4. git log -- brandgeo/web/site.js and one city page, to see how past
   multi-page edits were batched (cPanel webhook deploys cap at 20 commits
   per push; keep this to few commits).

ACTION, checks first:
1. Write scripts/check-research-cta.sh: counts the CTA block across all city
   and industry pages, fails unless all 37 carry exactly one, and runs the
   existing JSON-LD validation across touched pages.
2. Add one consistent CTA block to each of the 37 pages, positioned after the
   first findings section, copy along the lines of: "Is your business in
   these answers? Run the free BrandGEO audit and see what ChatGPT, Gemini,
   Claude, Perplexity and Google AI Mode say about you." linking to the
   canonical audit entry from S3. Static HTML + site.js only.
3. Do NOT alter any measured research claim on those pages: historical
   results are records, rewriting them falsifies the dataset (standing rule
   in CLAUDE.md).

VERIFY, paste outputs:
- bash scripts/check-research-cta.sh (exit 0)
- JSON-LD validation still 110 of 111 or better, stated with the count
- After the cPanel webhook deploy: curl two city pages and one industry page
  and grep the CTA block live

RECORD: mark S5 DONE in the registry. One line in CLAUDE.md CURRENT STATE
Content pipeline. Commit in at most 3 commits so the webhook payload cap is
safe. End with Completed / Requires your action / Still pending.
```

---

## S6. Evidence Machine

Owner: this session builds, Constantin runs. Day-only first run (reads
production data). Scope: `scripts/evidence/` (new), `docs/growth/` usage doc.
Blocked by: nothing.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S6: build the Evidence Machine, the outbound engine's
ammunition factory. Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md
(mark S6 IN PROGRESS).

CONTEXT, read in this order:
1. The purpose: cold outreach for the sprint is evidence-led. For a prospect
   (a business that appears as a COMPETITOR or is ABSENT in our collected AI
   answers), we send a one-pager: the buyer prompt asked, the engine, the
   dated answer, who was recommended, and the prospect's absence. All from
   rows we already hold in ai_results. Nothing is fabricated, nothing is
   collected fresh (collection spends money, withheld authority).
2. CLAUDE.md section 3 schema: ai_results (prompt_id, client_id, llm,
   brand_mentioned, brand_position, competitors_mentioned as JSON string of
   {pos,name}, response_snippet, checked_at, status). Query via the Supabase
   MCP read-only first to learn real shapes; the handover says source-reading
   got several arguments wrong and SQL settled them.
3. Memory: cross-program-superlative-ledger (no unearned claims: a one-pager
   states what a specific engine answered on a specific date, never "AI never
   recommends you"), no-AI-tells (no em or en dashes in the one-pager copy).
4. docs/growth/brand-kit-2026-07-29/ for logo assets to brand the one-pager.

ACTION:
1. Build scripts/evidence/generate.py (Python, matches scripts/ house style):
   inputs a category or client_id plus optional city, reads ai_results rows
   with status ok, groups by prompt, and emits one branded HTML one-pager per
   named competitor-or-absent business into scripts/evidence/out/ (HTML is
   fine; print-to-PDF is manual). Each one-pager cites engine, prompt text,
   checked_at date, and the ranked names verbatim from competitors_mentioned.
   Service key comes from the environment (SUPABASE_SERVICE_KEY), never
   hardcoded, never committed; out/ goes into .gitignore.
2. Write scripts/evidence/README.md: exact run command, env var setup, and
   the integrity rules above, so any future session can operate it.
3. Dry-run against real data for one category and paste the summary (rows
   read, businesses found, pages generated). Spot-check three one-pagers
   against the raw rows and show the comparison.

DO NOT: trigger any collection. Print any secret. Commit anything from out/.
Invent or extrapolate a single claim beyond what a row literally says.

VERIFY:
- check: test -f scripts/evidence/generate.py && test -f scripts/evidence/README.md
- The dry run generated at least 5 one-pagers from real rows, spot-checks
  matched, and generation for a batch of 5 took under 10 minutes end to end.

RECORD: mark S6 DONE in the registry with the dry-run summary. One line in
CLAUDE.md CURRENT STATE. Commit the scripts and README (not out/). Hand
Constantin the exact run command for his first real batch. End with
Completed / Requires your action / Still pending.
```

---

## S7. LAUNCH30 goes live end to end (roadmap A4 slice)

Owner: bg-backend on Opus, then bg-verify. Day-only, LIVE Stripe. Scope:
Stripe (coupon + promotion code, create only), checkout link configuration,
pricing page display line. Blocked by: S1 (the coupon must discount the ruled
ladder, and the first-100 launch price may make a coupon redundant for Radar;
resolve against the ruling).

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S7: make LAUNCH30 real, end to end. Registry:
docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S7 IN PROGRESS; confirm
S1 is DONE and read its ruling first).

CONTEXT, read in this order:
1. docs/AUTONOMY.md authority: creating Stripe prices and coupons is granted;
   SENDING a payment link to any customer is withheld; live mode, no test net.
2. docs/ROADMAP.md A4 (promotions price nothing) and its check command. This
   task closes the sprint-relevant slice: one working coupon at checkout. The
   full promotions-table wiring stays open unless trivially reachable.
3. docs/strategy/sprint-ladder-ruling.md: which tiers the coupon applies to,
   and whether Radar's launch price already IS the discount (if so, LAUNCH30
   scopes to Essentials and up, say so explicitly).
4. git log -- brandgeo-dashboard/netlify/functions/stripe-webhook.js and
   scripts/stripe-create-catalogue.js. Note the ROADMAP warning: the
   catalogue script does NOT set customer_creation always on payment links;
   do not copy that omission.

ACTION:
1. Via the Stripe MCP: create coupon LAUNCH30, 30 percent off, duration
   repeating 3 months (or the S1 ruling's duration), then a promotion code
   LAUNCH30 restricted to first 200 redemptions, expiring 2026-08-31.
2. Ensure every customer-reachable checkout surface accepts promotion codes
   (allow_promotion_codes on Checkout Sessions or the payment link setting).
   Read the current checkout creation path before editing; if checkout is
   payment links only, update each link's setting via the API.
3. Add the one display line to the pricing page: "Launch offer: code LAUNCH30,
   30 percent off for 3 months, until August 31." No other copy changes (S2
   and S3 own that file's other regions; serialize via the registry board).
4. Spawn bg-verify: billing change. It must confirm via Stripe reads that the
   coupon, promotion code, and checkout settings are exactly as specified,
   and that the webhook provisions a discounted subscription identically to a
   full-price one.

DO NOT: send anything to anyone. Create prices (S2 owns prices). Touch the
promotions Supabase table logic beyond what the display needs.

VERIFY, paste outputs:
- Stripe read-back: coupon percent_off 30, promotion code active, max
  redemptions and expiry set.
- The roadmap A4 check now exits 0 or is explicitly noted as still open by
  design: grep -rq "coupons.create\|promotion_code" brandgeo-dashboard/netlify/functions/
- A live checkout page screenshot showing the promo code field accepting
  LAUNCH30 and the discounted total. Do NOT complete a live charge.

RECORD: mark S7 DONE in the registry. Update ROADMAP A4 with what this closed
and what remains. One line in CLAUDE.md CURRENT STATE. End with Completed /
Requires your action / Still pending.
```

---

## S8. Outbound infra: sending domain, warmup, deliverability, GBP

Owner: Constantin executes, the chat produces exact instructions and verifies.
Day-only. Scope: no repo files except docs/growth/outbound-infra.md.
Blocked by: nothing. START DAY 1: warmup needs 5 to 7 calendar days.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S8: stand up the outbound sending infrastructure and fix
the Google Business Profile. Registry:
docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S8 IN PROGRESS).

CONTEXT, read in this order:
1. docs/AUTONOMY.md section 4: no agent can log into vendor consoles; your
   job is exact, copy-pasteable instructions per the Specificity rule, then
   verification of what Constantin reports back.
2. Memory: gbp-live-assets-stale (the profile currently advertises retired
   Meta AI and a wrong engine count) and engine-lineup-seven memory vs
   planConfig.ts; the LIVE lineup to publish is what planConfig.ts says
   today, verify it there first, do not trust either memory blindly.
3. The sprint plan: from around day 7, roughly 50 cold emails per day from a
   warmed secondary domain plus 20 to 25 LinkedIn DMs by hand.

ACTION, produce docs/growth/outbound-infra.md containing numbered,
copy-pasteable steps for Constantin:
1. Register a secondary domain (recommend trygetbrandgeo.com or
   getbrandgeo-outreach.com; NEVER send cold from getbrandgeo.com), at the
   registrar he already uses.
2. Set up 2 inboxes on it, SPF, DKIM, DMARC records written out exactly as
   they must be pasted into DNS, plus a forward of the domain root to
   https://getbrandgeo.com.
3. Choose and configure one sending tool (recommend Instantly, the Growth
   plan, or Smartlead equivalent; state monthly cost; total new stack must
   stay under EUR 150 per month), enable warmup on both inboxes, daily send
   caps starting 20 rising to 50 by day 10.
4. Fix the GBP listing: exact fields to edit and the exact replacement text
   for services and description, engine lineup taken from planConfig.ts.
5. The verification loop: mail-tester.com target 9 or higher out of 10 before
   the first real send; warmup health screenshot; GBP live check.

DO NOT: create accounts, enter credentials, or purchase anything yourself;
these are Constantin's actions by rule. Do not put personal data in any URL.

VERIFY, as results come back in this chat:
- mail-tester score 9+ screenshot or pasted report
- DMARC/SPF/DKIM pass shown in the tool's own checker
- GBP: fetch the public profile and confirm the stale engine claims are gone
- check: test -f docs/growth/outbound-infra.md

RECORD: mark S8 DONE only when the mail-tester and GBP verifications pass,
not when instructions are written. Update the gbp-live-assets-stale memory to
closed with the date. One line in CLAUDE.md CURRENT STATE. End with
Completed / Requires your action / Still pending.
```

---

## S9. Sprint scoreboard and checkpoint gates

Owner: any session, tonight. Night-safe (docs only). Scope:
`docs/growth/SPRINT-100-SCOREBOARD.md`. Blocked by: nothing.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S9: create the sprint scoreboard and its gates.
Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S9 IN PROGRESS).

CONTEXT: read the registry file's Part A (the glidepath in criterion 5) and
docs/AUTONOMY.md section 6 (reports must be readable in under two minutes).

ACTION: create docs/growth/SPRINT-100-SCOREBOARD.md with:
1. A daily table: date, emails sent, DMs sent, replies, calls booked, audit
   runs, free signups, NEW PAYING, cumulative paying, MRR EUR, one-line note.
   Pre-fill the date column for 2026-08-01 through 2026-08-30.
2. The gates, verbatim: Day 5 all S-task foundation checks green or the gap
   named; Day 15 at or above 30 paying, under 20 triggers the pre-agreed
   fallback from Path 1 cadence to Path 2 (documented in the registry, Part
   A); Day 22 at or above 55 plus a CFO check on churn and upgrades; Day 30
   close-out and the Day 31 memo.
3. The capture rule, stated in the scoreboard header: rows are written by
   council chats, never by hand. Constantin says "close the day" in
   whatever chat is open; that chat pulls Stripe and Supabase numbers, asks
   him one line for sends, DMs, replies and calls, fills the row, commits
   and pushes. Full protocol: the day-side capture section of
   SPRINT-100-DAILY-COUNCIL.md. Fridays add the CFO reconciliation line;
   Mondays and Thursdays record the real-card rehearsal tick.

VERIFY: check: test -f docs/growth/SPRINT-100-SCOREBOARD.md and the table has
30 dated rows. Fill row zero (2026-07-31) with today's baseline: current
paying subscriber count (ask Constantin or query Stripe subscriptions via the
MCP, read-only) and MRR.

RECORD: mark S9 DONE in the registry. Commit. End with Completed / Requires
your action / Still pending.
```

---

## S10. Close the A1-S1 revert gate

Owner: bg-backend on Opus, then bg-verify. Day-only. Billing. Scope:
`brandgeo-dashboard/netlify/functions/stripe-webhook.js`,
`expire-plan-grants.js`, `tests/package_provisioning.test.js`.
Blocked by: nothing. MUST close before any package or offer is sold to an
existing subscriber, which the sprint will do; treat as week-1.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S10: close roadmap item A1-S1, the subscriber-revert
gate, plus the S6 assertion pin. Registry:
docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S10 IN PROGRESS).

CONTEXT, read in this order:
1. docs/ROADMAP.md A1-S1 verbatim: stripe-webhook.js:287 sets
   plan_source='package' while :288 preserves stripe_subscription_id, so
   expire-plan-grants.js:69-72 later reverts a still-paying subscriber to
   Free and emails them a lapse notice. Also A1-S6: the most contested line
   is pinned by nothing (a mutation deleting plan_source/plan_grant_until
   from :287 leaves all 43 checks green), and A1-S2-tier (lower-tier package
   must refuse onto a higher live grant; ruled by Constantin, fold it in).
2. docs/qa/package-provisioning-014.md and package-provisioning-014-round2.md:
   the exact patch is already written there. This task ships and pins it,
   not re-derives it.
3. The mutation-testing trap in docs/HANDOVER-2026-07-31.md section 6 item 3:
   source-regex assertions are defeated by commenting a line out; write the
   new assertions as behavior checks against the harness fixtures, not greps.
4. git log -- brandgeo-dashboard/netlify/functions/stripe-webhook.js first.

ACTION:
1. Spawn bg-backend (Opus): apply the 014 patch (protect the
   holds-both case in expire-plan-grants, null the subscription id on
   customer.subscription.deleted), add the A1-S2-tier refusal fixture, and
   add the S6 assertion pinning :287's writes behaviorally.
2. Spawn bg-verify: rerun the harness, rerun its own mutation set including
   the comment-out mutation class, and confirm the S1, S2-tier and S6 checks
   each fail on the pre-patch tree and pass on the post-patch tree.

DO NOT: touch provisioning amounts, grant arithmetic (A1-S2/S3 stay open
unless trivially adjacent), or any other webhook branch. No customer emails.

VERIFY, paste outputs:
- node brandgeo-dashboard/tests/package_provisioning.test.js (exit 0, count
  of assertions stated, includes the three new ones)
- The pre-patch failing run of the same three assertions, shown.

RECORD: mark S10 DONE in the registry. Move A1-S1, A1-S6 and A1-S2-tier to
Done in docs/ROADMAP.md with check outputs and date. One line in CLAUDE.md
CURRENT STATE. Commit serially. End with Completed / Requires your action /
Still pending.
```

---

## Suggested order of ignition

Day 1: S1 (decision chat, needs Constantin), S8 (warmup clock starts), S9
(tonight, night-safe), S13 (account creation is Constantin's, start it early).
Day 2: S10, S6, S3 stage 1 (C1 audit), S12 stage 1. Day 3 to 5: S2 (after
S1), S4, S3 stages 2 to 5, S5 (after S3 stage 1), S7 (after S1), S11 (after
S3 stage 2 and S6), S14 (after S1 and S10), S15 (after S7). Everything is
designed to be DONE by Day 5, which is the first scoreboard gate. Volume
starts Day 6 to 7 when warmup allows real sending.

---

# PART C. The 9/10 mandate: member-attributed directives

Added 2026-07-31 on Constantin's instruction: every evaluation criterion now
targets 9 of 10, and every gap-closing action is attributed to the council
member whose discipline owns it, written as an instruction an agent can
execute. Part C produces two kinds of output: AMENDMENTS to existing S-tasks
(the chat running that task reads its amendment here as part of CONTEXT) and
NEW kickoffs S11 to S15 below.

One distinction the council insists on recording before the votes: a 9 of 10
plan score is a statement about design quality, meaning every failure mode has
a pre-agreed response and no single channel must over-perform for the target
to survive. It is not a 90 percent outcome probability. With Part C added, the
council's honest outcome estimate under Path 1 effort rises from about 30
percent to 45 to 55 percent, expected landing 75 to 110 paying. The mechanism
that earns the 9 is overdetermination, defined under criterion 5.

## C-1. Market relevance: 9, hold and harden

- **Chief Research Officer.** Judgment: the wedge (evidence for the omitted
  business, downmarket of Profound, peec.ai, AthenaHQ) is real today and
  undefended, but the category is moving monthly and the 2026-07-28 teardown
  is the last measurement. Directive, folded into S12 as its stage 3: a
  monthly competitor re-check (pricing page, positioning line, downmarket
  motion of the named five) appended to
  docs/research/competitive-and-conversion-2026-07-28.md as dated addenda.
  Kill signal to watch: any incumbent shipping a sub EUR 50 self-serve tier
  or city-evidence outreach. If seen, escalate to a strategy session within
  48 hours.
- **CMO.** Judgment: relevance is proven by the market answering, not by the
  teardown. Directive, folded into S9: the scoreboard's reply-rate line IS
  the relevance instrument. At or above 8 percent confirms the wedge; below
  5 percent for 5 consecutive sending days triggers a segment change, never
  a volume increase.

## C-2. Customer comprehension: 6 to 9

- **Senior Copywriter.** Judgment: comprehension cannot be self-assessed; the
  team has read the hero too many times to see it. Directive, AMENDMENT to
  S3's VERIFY: add a five-second test. Show the post-fix hero to 10 people
  who have never seen the product (a testing panel or manual recruits), ask
  "what does this company do and who is it for". Pass requires 8 of 10
  answering with monitoring or visibility in AI answers for businesses. Log
  verbatim answers in docs/qa/acquisition-funnel-audit.md as an appendix.
  S3 does not close at 9 without this evidence.
- **CMO.** Judgment: one promise per surface. Directive, AMENDMENT to S3
  stage 2: the copy deck must open with a claims table, every claim on the
  hero and audit flow traced to a source (a measured stat, a shipped
  capability, or cut). The 73 percent and 4.2x entries are the first two
  rows, each resolved to sourced or deleted.
- **Head of Sales.** Judgment: comprehension includes the cold channel; if
  the email promise and the landing promise differ, the click dies on
  arrival. Directive: S11 below exists for this. Its scripts must be
  claim-traceable to the same table S3 produces.

## C-3. Discoverability: 5 to 9

- **Senior Social Media Strategist.** Judgment: one founder cannot manufacture
  reach daily by hand, but the repo already owns a distribution engine (the
  growth-media-architect skill) and a collection pipeline that produces a
  shareable artifact every day. Directive: S12 below, stages 1 and 2: the
  weekly 12-channel repurposing run and the daily 5-minute evidence post
  routine.
- **CGO.** Judgment: a 9 needs a second active surface beyond founder sends.
  Directive: S12 stage 2, the 20-placement blitz: directories, GEO and SEO
  newsletters, communities and podcasts, each with a named contact and a
  one-line pitch, sent through the S8 infrastructure. Target: 20 pitched by
  day 14, at least 5 live placements by day 25.
- **Chief Research Officer.** Judgment: a GEO product must be findable by the
  engines it monitors; that is table stakes credibility. Directive,
  AMENDMENT to S5's VERIFY: after the CTA rollout, confirm the touched pages
  are pinged (sitemap_pings rows advance via the live IndexNow path) and the
  audit entry page carries valid JSON-LD.
- **Head of Sales.** Judgment: 25 DMs a day from a thin founder profile
  converts at half rate; the profile is the landing page of the DM channel.
  Directive: S11 includes the LinkedIn profile rewrite (headline, about,
  featured section linking the audit).

## C-4. MVP functional readiness: 7 to 9

- **CTO.** Judgment: the two points between 7 and 9 are named in
  docs/ROADMAP.md already: the loop has no way to discover a bug it did not
  cause, and the A1-S1 revert gate is open. Directive: S13 below (error
  monitor, the single highest-leverage readiness item) and S10 (already
  filed) treated as week-1, not backlog.
- **Senior Infrastructure Engineer.** Judgment: the sprint's success case is
  its own risk: a surge of signups meets a 150 rows-per-hour-per-client rate
  limit and a collection queue never observed under burst. Directive,
  AMENDMENT to S4's ACTION: while in the first-run code, verify and document
  in the PR description what a brand-new client experiences if the queue is
  busy: the zero-data state must hold and nothing may error visibly. No live
  load test (collection spends money, withheld); this is a code-path review
  with the harness, plus one deliberate assertion that a queued-but-not-run
  client renders the measuring state.
- **Senior Full-Stack Developer.** Judgment: one dress rehearsal proves one
  day; a sprint needs the proof continuously. Directive, AMENDMENT to S9's
  routine: the end-of-day checklist gains a twice-weekly item, Mondays and
  Thursdays: run the full real-card path (signup, pay Radar, first session,
  upgrade path visible) and tick it in the scoreboard notes. Any failure is
  the next morning's first task, ahead of all outreach.
- **CFO.** Judgment: readiness includes the books. Directive, AMENDMENT to
  S9: a weekly reconciliation line, Stripe active subscriptions against
  clients.plan in Supabase (read-only queries both sides). Any mismatch is a
  provisioning bug found before a customer finds it.

## C-5. 30-day feasibility: 4 to 9 by design

- **CGO, the overdetermination principle.** Judgment: a plan whose channels
  sum to exactly 100 fails the moment one channel disappoints, and one
  always does. Directive, AMENDMENT to S9: the scoreboard carries this
  channel expected-value budget, reviewed at every gate. Planned EV sums to
  roughly 120 to 145 so the target survives two channels underperforming:

  | Channel | Volume assumption | EV paying subs |
  |---|---|---|
  | Cold email, warmed | 50/day from day 7, about 1,100 sends | 30 to 40 |
  | LinkedIn DMs | 20 to 25/day, about 550 | 25 to 35 |
  | Audit funnel inbound | 37 CTAs, posts, launch traffic | 15 to 25 |
  | Agency closes | 10 pitched, 2 to 3 closed | 8 to 15 |
  | Founding prepay packages | warm network, S14 | 8 to 12 |
  | Referral loop | from first customers, S15 | 5 to 10 |
  | Launch day | one coordinated moment | 5 to 10 |

- **CRO.** Judgment: the fastest subscribers are the ones who prepay; the
  packages A1 built are sitting unused, and a founding 12-for-10 offer to
  the warm network converts relationship into committed revenue without
  discount-cheapening the ladder. Directive: S14 below. Hard gates: S10
  closed first (or the first founding buyer with an existing subscription
  gets reverted by our own cron), and the Payment Link built with
  customer_creation always plus plan and months metadata, per the standing
  ROADMAP warning.
- **CGO.** Judgment: referral is the only channel whose cost is zero and
  whose volume scales with success itself. Directive: S15 below, live from
  the first 10 customers, manual fulfillment, no code.
- **COO.** Judgment: feasibility dies quietly through unmeasured days.
  Directive, AMENDMENT to S9: the gates are binding, and the day-15 fallback
  (Path 1 cadence to Path 2) is pre-agreed HERE so the decision costs zero
  willpower on a bad day. Founder calendar holds 3 acquisition blocks, 1
  delivery block, 1 supervision block; anything else is refused by default.
- **CFO.** Judgment: a EUR 29 to 39 entry rung tolerates almost no paid CAC.
  Directive, AMENDMENT to S9: weekly CAC-by-channel line (spend divided by
  paying, founder time excluded, tool costs included). Any channel above
  EUR 30 CAC at the entry rung is cut at the next gate, not debated.

---

## S11. Outreach scripts and the founder profile

Members: Head of Sales, Senior Copywriter. Owner: bg-copy, then bg-verify.
Day-only (customer-facing words). Scope: `docs/copy/outbound-scripts.md`,
LinkedIn profile copy (paste-ready, Constantin publishes). Blocked by: S3
stage 2 (claims table) and S6 (one-pager shape).

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S11: write every word the outbound channel sends.
Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S11 IN
PROGRESS; confirm S3 stage 2 and S6 are done, read their outputs first).

CONTEXT, read in this order:
1. Part C sections C-2 and C-3 of the registry (the member directives this
   task executes).
2. docs/copy/ deck from S3, especially its claims table: every promise in
   these scripts must trace to a row there. scripts/evidence/README.md from
   S6 for what a one-pager contains.
3. Memory: no-AI-tells (no em dashes, no en dashes, no buzzwords),
   cross-program-superlative-ledger (no unearned superlatives). The ROADMAP
   warning block: no refund language, no guarantees, ever.

ACTION: spawn bg-copy to write docs/copy/outbound-scripts.md containing:
1. Cold email sequence, 3 touches: touch 1 references the attached one-pager
   by the prospect's own evidence ("when buyers ask <engine> for <category>
   in <city>, it recommends <competitor>; your business does not appear in
   the answer, dated <date>"), one CTA (15-minute call or the audit link).
   Touch 2 at day 3, one new fact. Touch 3 at day 7, breakup note.
2. LinkedIn sequence: connection note (under 200 characters) and first DM.
3. Objection handling: the 5 most likely objections (already rank fine on
   Google, is this real data, too small to matter, price, do it ourselves)
   with 2-sentence answers each, claim-traceable.
4. Call close script: 10 lines maximum, ends on the entry-tier link and the
   LAUNCH30 code where the S1 ruling allows it.
5. Free-score follow-up sequence, 5 emails, matching the S3 funnel steps.
6. LinkedIn founder profile: headline, about section, featured links, all
   paste-ready with character counts checked.
Then spawn bg-verify: audit every factual claim in the file against the S3
claims table and the superlative ledger. Its finding list goes at the bottom
of the doc; unresolved findings block DONE.

DO NOT: invent statistics, promise outcomes, mention refunds or guarantees,
or use em or en dashes anywhere in the copy.

VERIFY:
- check: test -f docs/copy/outbound-scripts.md
- grep -cP "\xe2\x80\x93|\xe2\x80\x94" docs/copy/outbound-scripts.md returns 0
- bg-verify's claims audit shows zero unresolved findings, pasted.

RECORD: mark S11 DONE in the registry. One line in CLAUDE.md CURRENT STATE.
Commit. Hand Constantin the profile copy as a numbered paste-list. End with
Completed / Requires your action / Still pending.
```

## S12. Distribution loop and the placement blitz

Members: Senior Social Media Strategist, CGO, Chief Research Officer. Owner:
this session plus the growth-media-architect skill. Day-only (public
content). Scope: `docs/growth/` outputs only. Blocked by: nothing for stage
1; stage 2 sending waits on S8 infra.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S12: the passive reach engine, three stages. Registry:
docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S12 IN PROGRESS).

CONTEXT: Part C sections C-1 and C-3 of the registry. Memory: no-AI-tells.
The growth-media-architect skill exists in .claude/skills/ and its
/distribute command turns one seed into a 12-channel package; prior output
pattern is docs/growth/2026-07-29-grok-sixth-engine/.

ACTION, three stages:
1. Daily post routine: write docs/growth/daily-evidence-post.md, a 5-minute
   routine: pick one real collected answer, screenshot it, two sentences
   (what was asked, who was named), one closing line to the audit. Includes
   a 7-day starter bank of 7 posts drafted from existing ai_results data,
   claim-checked against the superlative ledger.
2. Placement blitz: research and write docs/growth/placement-blitz.md, a
   table of 20 placements (AI-tool directories, GEO and SEO newsletters,
   marketing communities, relevant podcasts) with URL, submission or contact
   path, one-line tailored pitch, and a status column. Sending is
   Constantin's via S8 infra; the table is the deliverable here.
3. Weekly repurposing: each Monday of the sprint, run /distribute on the
   week's strongest evidence finding; output lands in docs/growth/ dated.
   Run the first one now. Stage 3 also carries the Chief Research Officer's
   monthly competitor re-check: append a dated addendum to
   docs/research/competitive-and-conversion-2026-07-28.md (five named
   competitors, pricing page and positioning line, flag any sub EUR 50
   self-serve tier or evidence-outreach motion as an escalation).

DO NOT: post anything yourself, submit any form, or contact any placement;
publishing is Constantin's action by rule. No fabricated engine claims.

VERIFY:
- check: test -f docs/growth/daily-evidence-post.md && test -f docs/growth/placement-blitz.md
- The placements table has 20 rows each with a working URL and a contact path.
- The first /distribute package exists in docs/growth/, dated this week.

RECORD: mark S12 stage state in the registry (stages 1 and 2 DONE is enough
to mark S12 DONE; stage 3 recurs weekly, tracked in the scoreboard notes).
One line in CLAUDE.md CURRENT STATE. Commit. End with Completed / Requires
your action / Still pending.
```

## S13. Error monitor goes live

Member: CTO. Owner: this session prepares, Constantin creates the account.
Day-only. Scope: `brandgeo-dashboard/src/` (SDK init), `netlify/functions/`
(wrapper), Netlify env. Blocked by: Constantin's account creation.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S13: give the product an error monitor, closing the
ROADMAP NEEDS CONSTANTIN item "the loop can only find bugs it caused".
Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S13 IN
PROGRESS).

CONTEXT: docs/ROADMAP.md NEEDS CONSTANTIN (authorize an error monitor);
docs/AUTONOMY.md (agents cannot create accounts; secrets never printed or
committed). Read netlify.toml and one collect function to see the current
function shape before wrapping anything.

ACTION:
1. Hand Constantin the numbered steps to create a free-tier Sentry account
   (or GlitchTip if he prefers self-hosted; recommend Sentry free tier,
   cost EUR 0), create one project of type React and one of type Node, and
   paste the two DSN values directly into Netlify env vars
   (VITE_SENTRY_DSN, SENTRY_DSN) via the Netlify UI, never into this chat.
2. Once he confirms the vars exist: add Sentry.init to the dashboard entry
   point (respecting MotionConfig and existing App.tsx structure, sample
   rate 1.0, environment from import.meta.env.MODE) and a minimal capture
   wrapper for Netlify functions (wrap handler exports; do not convert
   CommonJS to ESM, see the scheduled-function arch ruling for why).
3. Deploy, then trigger one deliberate test error on each surface (a
   temporary dev-only route or console trigger, removed after) and confirm
   both events arrive in the monitor.

DO NOT: print, paste, or commit a DSN or any env value. Add Sentry to the
marketing site (CSP forbids external connects there; dashboard only).

VERIFY:
- check: grep -rq "Sentry.init" brandgeo-dashboard/src && grep -rlq "captureException\|Sentry" brandgeo-dashboard/netlify/functions/ 
- Screenshot or pasted event ids of the two test errors arriving.
- npm run build exit 0.

RECORD: mark S13 DONE in the registry. Move the ROADMAP NEEDS CONSTANTIN
item to Done with the check output. One line in CLAUDE.md CURRENT STATE.
Commit. End with Completed / Requires your action / Still pending.
```

## S14. Founding prepay offer machinery

Member: CRO. Owner: bg-backend on Opus, then bg-verify. Day-only, LIVE
Stripe. Scope: Stripe objects (create only), `scripts/` catalogue notes.
Blocked by: S1 (founding package contents ruled) and S10 (revert gate
closed; selling a package to an existing subscriber before S10 is
forbidden).

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S14: build the founding prepay offer, sellable by
Constantin by hand. Registry: docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md
(mark S14 IN PROGRESS; confirm S1 and S10 are DONE first, hard gate, stop
if not).

CONTEXT, read in this order:
1. docs/strategy/sprint-ladder-ruling.md decision 4 (founding package
   contents: tier, months, price; the council recommends 12 months for the
   price of 10 on the ruled core tier).
2. docs/ROADMAP.md NEEDS CONSTANTIN, verbatim and binding: the Payment Link
   MUST set customer_creation 'always' (payment mode creates no Customer
   without it and the sale cannot be linked to anyone), and the price MUST
   carry metadata.plan and metadata.months.
   scripts/stripe-create-catalogue.js does NOT pass the flag; do not copy it.
3. docs/qa/package-provisioning-014.md for how the webhook provisions
   packages, and the A1-S2/S3 findings still open (early renewal forfeits
   remainder; quantity unread): the offer copy must not promise what those
   gaps cannot deliver.
4. docs/AUTONOMY.md: creating the price and link is granted; SENDING it to
   any customer is withheld, Constantin sends personally.

ACTION:
1. Spawn bg-backend (Opus): create the founding package price and Payment
   Link via the Stripe MCP exactly per the ruling, with customer_creation
   'always', metadata.plan, metadata.months, allow_promotion_codes false
   (the package IS the discount). Update
   scripts/stripe-create-catalogue.js to pass customer_creation so the trap
   dies at its source, with a comment naming this task.
2. Spawn bg-verify: read back the link and price from Stripe and assert
   every field above; walk the webhook path for mode 'payment' with the new
   price id against the provisioning harness fixtures.
3. Write the one-paragraph offer text Constantin sends (no guarantees, no
   refund language, plain statement of months, price, and what the tier
   includes per the ruled ladder), into the scripts doc from S11 or as
   docs/copy/founding-offer.md.

DO NOT: send the link to anyone. Complete a live charge. Promise prompt
counts beyond the ruled ladder (a package sells a tier, not prompts, unless
S1 ruled otherwise).

VERIFY:
- Stripe read-back pasted: customer_creation always, metadata.plan,
  metadata.months, amount, currency.
- node brandgeo-dashboard/tests/package_provisioning.test.js exit 0.
- check: grep -q "customer_creation" scripts/stripe-create-catalogue.js

RECORD: mark S14 DONE in the registry. Close the ROADMAP NEEDS CONSTANTIN
payment-link item with the read-back as evidence. One line in CLAUDE.md
CURRENT STATE. Commit. Hand Constantin the link and the offer text as the
final numbered action. End with Completed / Requires your action / Still
pending.
```

## S15. Referral loop operations

Member: CGO. Owner: bg-copy for the words, this session for the ops doc.
Day-only. Scope: `docs/growth/referral-ops.md`, one email template into the
S11 doc. Blocked by: S7 (coupon mechanics exist) and first customers.

```text
Connect folder C:\Users\const\Constantin Daniel Goane\BrandGEO, then continue
BrandGEO, sprint task S15: a referral loop that runs on zero code. Registry:
docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md (mark S15 IN PROGRESS; confirm
S7 is DONE).

CONTEXT: Part C section C-5, CGO directive. The promotions admin panel
exists (list, create, toggle; no delete by design) and prices nothing by
itself; fulfillment is manual by Constantin through Stripe. docs/AUTONOMY.md:
applying anything to a real customer's billing is Constantin's action;
agents prepare and verify only.

ACTION:
1. Write docs/growth/referral-ops.md: the offer (referrer gets one month
   free, referred gets the standing launch offer), the recording step (one
   promotions-panel row per referral, naming both parties in the promo
   name), the fulfillment step (exact Stripe dashboard clicks to apply a
   one-month credit as a customer balance credit, written per the
   Specificity rule), and the weekly reconciliation step (panel rows vs
   credits applied).
2. Spawn bg-copy for the referral ask email (sent by Constantin to each new
   paying customer at day 3 of their subscription) and the thank-you note.
   Both go into docs/copy/outbound-scripts.md as a new section, same claim
   and dash rules as S11.
3. Dry-run the fulfillment instructions against the Stripe dashboard
   READ-ONLY (describe the exact screens; apply nothing).

DO NOT: apply any credit, email anyone, or build UI for this. Manual
fulfillment is the design until volume justifies more.

VERIFY:
- check: test -f docs/growth/referral-ops.md
- The email section exists in docs/copy/outbound-scripts.md and passes the
  same dash grep as S11.
- Constantin confirms the fulfillment steps match what his Stripe dashboard
  actually shows (screens move; his confirmation is the check).

RECORD: mark S15 DONE in the registry. One line in CLAUDE.md CURRENT STATE.
Commit. End with Completed / Requires your action / Still pending.
```

---

# PART D. Council decision queue

Opened 2026-07-31 on Constantin's instruction, routing four things to the
council. Three are motions requiring a vote. One is a correction the council
needs before it spends a sprint task on work that is already shipped.

Every item states its evidence, because two council-level claims have now
turned out stale inside four days. The fix for that is not more caution, it is
citing a command output next to every claim.

## D-0. CORRECTION. S10 is two thirds already shipped. Do not re-run it.

**Not a motion. A fact the board needs before it ignites S10.**

S10 bundles A1-S1, A1-S6 and A1-S2-tier. Verified against `HEAD` today by
reading the code and running the harness, not by trusting a commit message:

| part | state | evidence |
|---|---|---|
| A1-S1 subscriber revert gate | **CLOSED** by `3c3f003` | `expire-plan-grants.js:95` guards on `stripe_subscription_id`, not on `plan_source`; harness section 7 fixtures "package + live sub" |
| A1-S6 assertion pin | **CLOSED** by `3c3f003` | harness line 261, "S6: the existing-client update states plan_source AND plan_grant_until (kills mutation M10)" |
| A1-S2-tier lower-tier refusal | **OPEN** | `grep -q "lower-tier" tests/package_provisioning.test.js` fails |

```
node brandgeo-dashboard/tests/package_provisioning.test.js
63 checks passed.   exit 0
```

**S10 should be re-scoped to A1-S2-tier alone**, which is a fixture plus a
refusal branch, not an Opus billing pass over three findings. The saving is a
day-window Opus cycle inside a 30-day sprint.

The same pass found `docs/ROADMAP.md` carrying four entries that claimed open
work already shipped. Corrected in `67a3cf4`. **Recommended standing rule for
the sprint: no S-task ignites without first running `git log -- <its files>`.**

## D-1. REPORT. C1 is done, C1a is shipped, and criterion 2 moves.

C1 delivered `docs/qa/acquisition-funnel-audit.md` (`eff8d9e`). Its critical
finding is now closed and live as of `ceb3596`, md5-verified against the bytes
getbrandgeo.com actually serves.

**What was wrong.** The full audit report has been built, deployed, working and
unreachable. `unlock-audit-report.js` sends no email and never has: the five
files in this repo that touch a mailer and the eight that touch a prospect
audit are disjoint sets. Meanwhile the widget promised "Check your inbox, the
full report is on its way" to every person who converted.

Worse, `redirectToSignup()` was called from exactly one place, the error
handler. **A visitor whose audit failed was carried to signup with their domain
prefilled. A visitor whose audit succeeded got a dead end.** The funnel
converted failure better than success.

**The numbers the council should plan against, 22 days of production:**

| | |
|---|---|
| audits run | 58 |
| of those, our own internal prospecting | 55 |
| public runs, all time | **3** |
| leads captured | 1, and it is `getbrandgeo.com` auditing itself |
| leads reaching HubSpot | **0** |

**Consequence for the 30-day plan.** Criterion 2 (customer comprehension, 6 to
9) named C1 as its mechanism and `docs/qa/acquisition-funnel-audit.md` as its
proof metric. That artifact exists, so the criterion's first gate is met.

The council should not read that as criterion 2 being 9. The audit's own
conclusion is that **the funnel was never load-bearing**, so the sprint's
traffic assumptions were being tested against a path that dropped everyone at
the end. Three public audits in 22 days is not a conversion problem, it is a
volume problem sitting on top of a conversion problem that is now half fixed.
S5 (research pages feed the audit funnel) and S12 (distribution) own the volume
half, and both are worth more now than they were this morning, because traffic
sent into the funnel is no longer wasted at the finish.

**Still open from C1, for whoever runs S3 stage 2:** C2 accept-and-continue, C3
contract gate, and the report's terminal CTA still pointing at a marketing
anchor rather than at signup.

## D-2. MOTION. HubSpot is paused. What replaces it?

**Constantin, 2026-07-31: HubSpot is paused while we think about solutions. The
council decides whether we build lead handling into our own dashboard or adopt
something else, and votes.**

**Members owning this: CRO (revenue ops), CTO (build versus buy), CFO (cost).**

Evidence to vote on, not impressions:

- **HubSpot has never worked here.** The only `prospect_leads` row has
  `hubspot_synced = false`, no contact id, and no error text. Nobody noticed,
  because a silent `false` is indistinguishable from success at a glance. Same
  defect shape as the `job_runs.ok` finding already carried on the roadmap.
- **Most of "build it ourselves" already exists.** `prospect_leads` stores
  email, domain, `audit_id`, source and timestamp. `prospect_audits` stores the
  score, category, per-engine states, top gaps and the full result payload. So
  a lead in our own system arrives already attached to the strongest sales
  artifact we own, which is the prospect's own report. No CRM we buy has that
  linkage without integration work.
- **What we do not have** is a view, an owner field, a status, a next-action
  date, and anything resembling a pipeline. That is the honest scope of "build
  it in the dashboard".

Options as the council should frame them:

1. **Build a minimal lead view in the dashboard.** Cheapest to start, uses data
   we already capture, keeps the audit-to-lead linkage. Risk: it grows into a
   CRM nobody asked us to build, and it is admin surface, so it earns no
   subscription revenue.
2. **Adopt a lighter external CRM.** Removes the build. Reintroduces the
   integration and the silent-failure risk we just found, and costs money in a
   sprint whose entry tier is being priced at EUR 29 to 39.
3. **No CRM for the sprint.** Three public leads in 22 days does not need a
   pipeline tool. Revisit at a volume that justifies one, and spend the time on
   S5 and S12 instead.

**The CFO and CRO should note before voting:** at current volume option 3 is
defensible on the numbers alone. The counter-argument is that the sprint's
whole purpose is changing that volume, and a tool adopted at 3 leads a month is
far cheaper to adopt than the same tool at 300. Whoever votes should say which
of those two facts they are weighting, rather than voting on preference.

**Whatever wins: a lead handler that cannot report its own failure is not
acceptable.** That is the real lesson of the HubSpot row, and it binds all
three options equally.

## D-3. MOTION. D1 pricing, referred by Constantin.

> **SUPERSEDED WITHIN THE HOUR, 2026-07-31. D-3a and D-3b are both DECIDED and
> signed in `docs/strategy/sprint-ladder-ruling.md`** (S1), by a parallel
> session, while this motion was being written. **Do not vote on them. Do not
> re-open them.**
>
> - **D-3a is answered by Decision 2.** The authoritative ladder is
>   `PLAN_PROMPTS = { free: 5, radar: 7, essentials: 18, growth: 35,
>   growth_pro: 56, managed: 200, pro: 200 }`, with `free`'s budget raised
>   0.30 to 0.60. Growth PRO now buys 56 against Growth's 35, so the
>   "+0 prompts for EUR 150" inversion this motion was filed about is closed.
> - **D-3b is answered by Decision 3: SUM the pools, MAX the site allowance**,
>   enforced at account level. Same conclusion the architect reached, on the
>   arithmetic reproduced below.
> - **D-3c, enterprise's website count, is still OPEN.** The ruling puts 25 in
>   provisionally and explicitly defers it here (its OPEN QUESTION 2c).
>
> The reasoning below is kept because it is the record of why the question was
> asked, and because the arithmetic still constrains anyone who wants to reopen
> it. **Only D-3c is live.**
>
> Worth naming, since this pack has now caught the same failure three times in a
> day: this motion was stale eleven minutes after it was written. Parallel
> sessions move faster than a document can describe them. **Before acting on
> ANY item in PART D, re-read its source of truth first.** For pricing that is
> `sprint-ladder-ruling.md`, not this file.

**Members owning this: CFO (margin), CGO (ladder), Head of Sales (what can
actually be sold).**

### D-3a. The `PLAN_PROMPTS` figures under shared limits

The blocking fact: **a rebalance documented as shipped never shipped.**
`planConfig.ts:400-420`'s table states allowances were restored to
`5, 20, 50, 75, 250` on 2026-07-29 and that no allowance was reduced. The
constant twenty lines below still reads `5, 15, 35, 35, 120`. Verified today:

```
PLAN_PROMPTS = { free: 5, essentials: 15, growth: 35, growth_pro: 35,
                 managed: 120, pro: 120, enterprise: 100000 }
```

So the cost model has been reasoning about numbers customers never received,
and `growth_pro` buys **zero extra prompts** over `growth` for EUR 150 more.

Three findings that must be resolved together, because fixing one alone makes
another worse:

1. **Growth PRO is +0 prompts and +0 engines over Growth.** Adopting the
   documented ladder fixes it and also closes the long-open "three conflicting
   Growth prompt counts" item: the code is the outlier, not the docs.
2. **`pro` inverts too**, at 120 prompts over 20 sites, 6.0 per site, below
   Essentials' 7.5.
3. **Per-site monotonicity is arithmetically impossible at current prices.**
   Every budget is 15 percent of price and the restored allowances track price
   almost exactly, so per-site budget is flat at about EUR 22.4 across growth,
   growth_pro and managed.

**Three levers, and the council must pick one:** cut allowances, raise the
15 percent ceiling, or drop per-site monotonicity as a requirement. The
recommended ladder additionally needs `pro` to fall from 20 sites to 10,
because 600 prompts costs about EUR 408 against a EUR 225 budget.

**Note for S1:** this interacts directly with the proposed Radar tier at EUR 29
to 39. Do not rule on Radar's allowance without ruling on this, or a fifth
conflicting set of numbers enters the repo. `plan_prompt_caps` in Postgres is
already a fifth copy of the ladder and has to move with `planConfig.ts`, or the
`trg_enforce_prompt_cap` trigger will refuse what the page promises.

### D-3b. Pooling: SUM or MAX

The architect reversed its own earlier position and recommends **SUM for the
pools, MAX for the site allowance**. The reasoning is a sales argument, not an
engineering one, which is why it belongs here:

**Under MAX, a second Essentials site costs EUR 99 a month and adds zero
prompts and zero budget.** It competes with the first site for the same pool,
so the customer pays more and their existing site gets worse. Under SUM the
pool stays shared but every site funds it, and margin holds at exactly the
15 percent the ladder was designed around.

**This also gates the upsell copy.** At today's shipped numbers the Growth to
Growth PRO boundary adds nothing at all, so there is no true sentence to write.
The D1-upsell nudge cannot be drafted until D-3a lands.

### D-3c. Enterprise's website count

free 1, essentials 2, growth 2, growth_pro 3, managed 10, pro 20, enterprise
undecided. Lowest stakes of the three, and it should not hold up the other two.

## D-4. MOTION. A6, what a client may see about their own plan.

Referred by Constantin. **Members owning this: COO and CMO, with the CFO on the
disclosure limit.**

Today a client can see neither their limits nor their consumption. `/usage`
renders "Access restricted to admins." for a viewer (`Usage.tsx:142`).

**The constraint that makes this a council question rather than a build
ticket:** `Usage.tsx` shows BrandGEO's API cost in euros and carries an
`OVERHEAD_MULTIPLIER`. It is a margin instrument. Showing a client that their
EUR 299 plan consumed EUR 4 of API spend hands them our gross margin and
reframes the product as a metered reseller.

So consumption has to be expressed in units the client bought: prompts against
their allowance, engines active, collection runs used and remaining, time until
the next refresh. **Never in euros of cost, and never as a percentage of a cost
budget, which is the same disclosure wearing a hat.**

Two things for the council to decide, not the builder:

1. **How much of the allowance to show.** A client at 34 of 35 prompts is about
   to hit a wall they cannot see coming. The same client shown "34 of 35" may
   read the ladder as stingy. Sales and product disagree here by construction,
   which is exactly why it is a vote.
2. **Whether the number shown is the number enforced.** It must be.
   `trg_enforce_prompt_cap` refuses at the database and nothing surfaces that
   refusal as a usable message, so a client at their cap likely sees a raw
   error today. This is why D-3a lands first: publishing a limit the code does
   not apply is worse than publishing nothing.

Sequence once voted: `bg-strategy` on what may be disclosed, then `bg-design`,
then `bg-app`. Not a lone build.
`check: test -f docs/design/client-plan-usage.md`

## D-5. MOTION. Segmented customer messaging, and the free-plan conversion play.

Referred by Constantin 2026-07-31, explicitly to the council's growth seats for
confirmation and logging.

**Members owning this: CGO (the play), CMO (the copy and the list), CTO (the
machinery), CFO on nothing until a price is named.**

Two things arrived together and the council should keep them apart, because one
is ready now and the other is a build.

### D-5a. The immediate play, ready to send

Copy deck: `docs/copy/free-plan-gemini-update.md`. **Drafted, verified against
production, NOT SENT.** AUTONOMY §2 withholds customer sends from the loop.

The play: the free plan moved from ChatGPT to Gemini (`6d2196c`), so we re-ran
the free account's prompts on Gemini for free, and the email tells them the work
is already done and waiting. Engine change is the reason, the free re-run is the
gift, the gap in their results is the argument for paying.

Every claim was checked before writing. Ai Fy has **2 active prompts**, both
were collected on Gemini at 2026-07-31 14:41 for EUR 0.064, so "we re-ran all
your prompts" is literally true rather than nearly true.

**The council should note two deliberate omissions, and either ratify or
overturn them:**

1. **No price and no date for the smaller tier.** Radar is signed in
   `sprint-ladder-ruling.md` and **is not in `planConfig.ts`**. Telling a
   customer EUR 29 before the tier exists converts a live pricing decision into
   a promise, and S1's own ruling still has an open sub-decision. The email
   teases and asks them to reply if they want it, which returns a demand signal
   and commits nothing. **CGO: if you want the price named, say so explicitly
   and accept that it fixes the number.**
2. **No refund, guarantee or SLA language**, per the standing rule.

### D-5b. The build: segmented messaging, and what it actually is

Constantin's framing: an admin panel that can send one branded message to a
selected audience, with placeholders, so that at 200 free users it is one send
rather than 200. Segments named: all plans, a single plan, subscribers, and
**people who signed up but never created an account**.

**What already exists, so the council prices this correctly.** More than it
looks. `_email.js` already sends branded HTML from
`BrandGEO <noreply@mail.getbrandgeo.com>` with verified DKIM, SPF and DMARC, and
already supports `replyTo`, headings, paragraphs, bullets, a CTA and a footer
note. The audience data exists too: `clients.plan`, `clients.category`,
`user_profiles`, and `prospect_leads` for the never-signed-up segment, which is
exactly the fourth audience Constantin named and it is already populated by the
audit funnel.

**What does not exist, which is the honest scope:**

1. A composer and a send action behind `requireAuth({ adminOnly: true })`.
2. Segment definitions, and a **preview of exactly who will receive it, with a
   count, before anything sends**. A blind send to "all free plans" is an
   unrecoverable action; the surrounding rules require confirmation before
   exactly this class of thing.
3. Merge-field resolution with a **hard fail when a field cannot resolve**.
   `Hi ,` is worse than sending nothing, and at 200 recipients nobody proofreads
   200 renders.
4. A send log. Who was sent what, when, and whether the provider accepted it.
   Without it the second campaign cannot avoid re-mailing the first campaign's
   recipients, and a failed send is invisible. **This is the `job_runs.ok`
   defect and the `hubspot_synced = false` defect for the third time: we keep
   building senders that cannot report their own failure.**
5. **Unsubscribe, and this is the one that is not optional.** The free-plan
   email in D-5a is a product update to an existing user, which is defensible as
   transactional. **A newsletter to a segment is marketing**, and marketing to
   EU recipients needs a working opt-out and a record of consent. The
   `prospect_leads` segment is the sharpest case: those addresses were given to
   unlock an audit report, not to receive a newsletter. **CMO and CGO must rule
   on whether that segment may be mailed at all**, because it is the difference
   between a growth channel and a complaint.

**Recommended shape, for the council to accept or reject:** build it as an
admin-only page plus one function, reusing `_email.js` as it stands, with the
send log and the recipient preview in the FIRST version rather than deferred.
The composer without the log is the cheap half and it is the half that produces
the incident.

**Sequencing:** this is not blocked, but it is smaller value than S5 and S12
until there is an audience. **Three public audit leads and one free account is
not a list.** The machinery pays for itself at a volume the sprint has not
reached yet, so the council should decide whether it is built now or the effort
goes into filling the list first. **The CGO's own criterion applies: at today's
numbers this is infrastructure for demand we do not yet have.**

**Do not build this before the council votes.** Constantin asked for
confirmation and logging, not for a build.
