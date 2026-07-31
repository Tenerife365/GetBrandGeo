# SALES-ENGINE.md — Automated Prospecting & Sales-Support Tooling

> **Date:** 2026-07-09 · **Owner:** `Master-GTM` (CLAUDE.md §10) · Strategy/spec
> only — builds are delegated to the chats named in §6.
> **Design frame:** the company is **1 human + a lot of AI**, targeting 0 → €100k
> in 90 days. Every tool here is judged on **one metric: revenue per hour of the
> founder's time.** Anything that generates work the human can't service is a
> net negative, no matter how clever.
>
> **The core insight the whole engine is built on:** BrandGEO's own product can
> *measure a prospect's AI visibility before you ever contact them.* That means
> the audit is not just the offer — it's the **prospecting weapon and the proof
> of problem**, in one. No off-the-shelf sales tool can do that. So the engine
> automates: find → auto-audit → qualify → draft → hand a ranked queue to the
> human. The human does only the trust-moments (call, proposal, relationship).

---

## 1. The engine at a glance

```
   ┌─────────────┐   ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
   │ B. PROSPECT │──▶│ A. INSTANT   │──▶│ C. AI-DRAFTED │──▶│ HubSpot +    │
   │ RADAR       │   │ AUDIT ENGINE │   │ OUTREACH      │   │ human review │
   │ (weekly     │   │ (score any   │   │ (personalised │   │ (30 min/wk)  │
   │  scrape +   │   │  domain,     │   │  from the     │   │  approve/send│
   │  score)     │   │  auto-report)│   │  audit gap)   │   │  → book call │
   └─────────────┘   └──────┬───────┘   └───────────────┘   └──────────────┘
                            │
                     ┌──────▼───────┐
                     │ D. WEBSITE   │  inbound: anonymous visitor enters
                     │ INSTANT-SCORE│  domain → teaser score → email capture
                     │ WIDGET       │
                     └──────────────┘
```

Component A is the foundation — B, C, and D all depend on being able to audit an
arbitrary domain automatically. **Build A first.**

---

## 2. Component A — Instant Audit Engine (foundation, build first)

**What it is:** turn today's manual, 48-hour, human-delivered free audit into an
automated one: a domain goes in, a branded scorecard comes out in minutes, as a
shareable public link (and/or PDF). Serves inbound (site widget) *and* outbound
(pre-audit a prospect before contacting them).

**Sub-components:**
1. **Auto prompt generation** — from a domain + detected category, generate 5–8
   commercial "buyer" prompts automatically (one LLM call: "given this
   business, list the questions a buyer would ask an AI to find companies like
   it"). Today this is manual per client — this is the one genuinely new piece.
2. **Run** — fire those prompts across a *screening* engine set (see cost cap
   §5) using the existing collection pipeline (`collect-*` Netlify functions).
3. **Score + report** — reuse the existing 6-dimension AI Visibility Score;
   render a clean, branded public scorecard page (score, per-engine KNOW/PARTIAL/
   MISSING, top-3 gaps, "a competitor was named instead of you" flags) at a
   shareable URL (e.g. `getbrandgeo.com/audit/<token>`), plus optional PDF.
4. **Lead capture** — gate the *full* report behind an email (recommended); show
   a teaser score for free. Email → straight into HubSpot as a lead.

**Owner:** Master-DashboardDesign (the pipeline + report live in
`brandgeo-dashboard` / Netlify functions); the public report route can live in
the app or as a generated page. **The homepage widget (D) is Master-SiteDesign.**

**Why first:** it removes the human from audit delivery entirely, powers the
site widget, and gives the Radar its qualifier. Highest single leverage move.

---

## 3. Component B — Prospect Radar (the weekly lead monitor)

**What it is:** a scheduled weekly job that finds companies matching **multiple
triggers at once**, auto-audits the candidates, scores them, and hands the
founder a ranked, capped shortlist with a drafted opener for each.

### 3.1 Trigger / scoring model (0–100 "Prospect Score")

Each candidate is scored across weighted signals. **The AI-visibility gap is the
heaviest weight — it's both the qualifier and the proof only BrandGEO can offer:**

| Signal | Weight | How it's detected | Scoring logic |
|---|:--:|---|---|
| **AI Visibility gap** | **40** | Cheap screening audit (Component A, reduced set — §5) | *Lower* their visibility → *higher* prospect score (they have the problem). Bonus points if a competitor is named instead of them (loss-aversion hook). Already highly visible → deprioritise (hard sell). |
| **Marketing intent** | 20 | Nimble scrape: hiring a marketing/SEO role, running ads, active blog/resources section | More signals of active marketing spend → higher (they care + have budget) |
| **Vertical fit** | 15 | Category detection | In target verticals (SaaS, e-comm, travel, professional services) → full marks |
| **Budget / timing** | 15 | Nimble/web search: recent funding, launch, rebrand, growth-stage | Recent money or change event → higher (budget + motivation) |
| **Reachability** | 10 | Can we find a founder/marketing lead + a contact path? | Named, contactable decision-maker → full marks |

**Tiering:** Hot ≥ 70 · Warm 50–69 · Watch < 50. **Only Hot + top Warm are
surfaced, hard-capped at ~10–15/week** (see §5 human-time cap).

### 3.2 Output (per surfaced prospect)
- Company, one-line why-now, the trigger signals it hit.
- Its screening audit result (score + the single most damning gap).
- A drafted, personalised opener (Component C).
- One-click actions: push to HubSpot / dismiss / "run full audit."

### 3.3 Build recommendation — start light, not as product code
Build the Radar first as a **Cowork scheduled-task automation** (a weekly
`scheduled-tasks` job using **Nimble** for scraping + a lightweight qualifier
audit + output to a live artifact and/or HubSpot), **not** as a new product
feature in the repo. Reasons: zero deploy/maintenance surface, runs in Cowork,
and it lets you *validate the trigger model on real prospects before building
anything heavy.* Graduate it to product code only if it proves out. This is the
"mindful of human resources" call — don't build robust infra for an unproven
motion.

> **Phase 0 (this week, before any automation): run the Radar by hand once.**
> In a Cowork chat, Nimble-scrape 15–20 companies in one vertical, run the
> screening audit, score them against §3.1 by hand. If the top-scored ones feel
> like real prospects → automate. If not → fix the model first. Cheap validation.

**Owner:** a new **Master-Sales-Engine** chat (new operational infra, cross-cuts
site/app). Opus for the scoring-model + architecture design, Sonnet for the build.

---

## 4. Components C & D

**C — AI-drafted, audit-personalised outreach.** The Radar has each prospect's
real audit gap → auto-draft the opener referencing it ("I asked ChatGPT for the
best [category] and it named [competitor], not you — here's your scorecard").
**Draft-and-queue only, never auto-send** (see §5 deliverability). Human edits +
sends from their own inbox. Part of the Radar output; no separate build.

**D — Website instant-score widget.** Homepage: enter your domain → live teaser
score ("You're at 34/100 — see the full breakdown → [email]"). Converts
anonymous traffic 24/7 with zero human time. Thin front-end on Component A's
engine. **Owner:** Master-SiteDesign (front-end) once Component A exposes the
endpoint.

**CRM — buy, don't build.** HubSpot (free tier; Constantin connecting). The Radar
and the audit lead-capture both push into it. Building a CRM is exactly the bloat
a solo founder must refuse.

---

## 5. Guardrails (as important as the tools)

- **Human-time cap is the design constraint, not lead supply.** If the founder can
  run ~10 calls/week, the Radar surfaces ~10–15 *great* leads, never 100 mediocre
  ones. The whole weekly loop must fit one review session: **Radar runs Sunday →
  Monday the founder spends ~30 min reviewing + approving/editing drafts → sends
  go → calls book.** Automation raises quality-per-hour; it must never create a
  backlog the human can't service.
- **Cost cap on auto-audits (real LLM API spend).** Two audit depths:
  a **screening audit** (≈3–5 prompts × 2 engines) for Radar qualification, and
  the **full audit** only for prospects the human greenlights or inbound leads
  who convert. Hard-cap weekly screening volume (e.g. 30 candidates screened → 10
  surfaced). Lean on the existing 150-row/hr limit + `Usage.tsx` cost estimator;
  add a monthly prospecting-spend ceiling.
- **Deliverability / reputation.** Young sending domain (post the #106 work) + a
  solo brand = never mass-blast. Low volume, high personalisation, human-approved
  sends only. One bad spam run damages the whole brand.
- **GDPR + platform ToS (Spain/EU entity).** B2B outreach is defensible under
  legitimate interest, but: store only what you need, honour opt-outs, and prefer
  compliant sources (Nimble, Apollo, public web, company sites) over anything
  that breaks LinkedIn ToS. Keep a lawful-basis note for the prospect data store.
- **Don't audit the whole internet.** Gate auto-audits to Radar-qualified
  candidates and email-captured visitors — not every domain that hits the site
  (bots + cost). Rate-limit the public widget.

---

## 6. Build plan & ownership (delegated — Master-GTM stays strategy-only)

| Priority | Component | Owner chat | Model | Depends on |
|:--:|---|---|---|---|
| 1 | **A — Instant Audit Engine** (auto prompt-gen, run, public scorecard, email capture) | **Master-DashboardDesign** | Sonnet 5 (Opus for the auto-prompt-gen design) | — |
| 2 | **B — Prospect Radar** (Cowork automation: Nimble + scoring + weekly digest) | **Master-Sales-Engine** (new) | Opus (design) → Sonnet (build) | A (or a standalone light qualifier to start) |
| 3 | **D — Website instant-score widget** | **Master-SiteDesign** | Sonnet 5 | A's public endpoint |
| — | **C — drafted outreach** | folded into B | — | B |
| — | **CRM** | HubSpot (Constantin connecting) | — | — |

**Sequencing:** A unblocks D and gives B its qualifier — but B can start with a
standalone lightweight qualifier so it's not hard-blocked on A. Do **Phase 0**
(manual Radar, §3.3) before committing to B's build.

### Open decisions for Constantin
1. **Gate the full audit behind email capture?** (recommended yes — every audit
   becomes a lead.)
2. **Radar as Cowork automation first vs. product feature?** (recommended: Cowork
   automation first, §3.3.)
3. **Weekly prospect cap + monthly audit-spend ceiling** — pick numbers you can
   actually service (suggested: 10–15 surfaced/week, and a €X/mo API ceiling).
4. **HubSpot confirmed as the CRM?** (you're checking now.)

---

## 9. HubSpot foundation (CRM connected 2026-07-09)

HubSpot is connected (account 148866779, `contact@getbrandgeo.com`). It's a fresh
account with the default "Sales Pipeline" + standard deal stages. The connector
can create/update **records** (companies/contacts/deals/tasks/notes) but **not
custom properties or pipeline stages** — those are a one-time HubSpot **Settings**
setup (Constantin, or documented for Master-Sales-Engine).

**A. Rename the deal pipeline stages to match the motion** (Settings → Objects →
Deals → Pipelines). Suggested mapping onto the existing 7 stages:

| Default stage | Rename to |
|---|---|
| Appointment Scheduled | **Audit Sent** |
| Qualified To Buy | **Findings Call Booked** |
| Presentation Scheduled | **Findings Call Done** |
| Decision Maker Bought-In | **Proposal Sent** |
| Contract Sent | **Verbal Yes / Contract Out** |
| Closed Won | Closed Won |
| Closed Lost | Closed Lost |

**B. Create these custom properties** (Settings → Properties — on **Company**,
since the Radar works at company level; mirror key ones to Contact/Deal as
needed) so the Radar + Instant Audit can write structured data:

| Property (internal name) | Type | Purpose |
|---|---|---|
| `ai_visibility_score` | Number (0–100) | From the audit — the core hook |
| `prospect_score` | Number (0–100) | Radar composite score (§3.1) |
| `prospect_tier` | Dropdown: Hot / Warm / Watch | Radar tier |
| `top_gap` | Single-line text | The single most damning gap |
| `trigger_signals` | Multi-line text | Which §3.1 signals fired |
| `knockout_reason` | Single-line text | If excluded and why (§8) |
| `audit_report_url` | Single-line text | Link to the shareable scorecard |
| `lead_source_detail` | Dropdown: Prospect Radar / Instant Audit / Inbound | Attribution |

**C. Lead flow:** Instant Audit email capture → Contact + Company with
`ai_visibility_score` + `audit_report_url` + `lead_source_detail`. Radar-surfaced
prospect → Company with the full prospect_* fields + a Deal created at **Audit
Sent**. Master-Sales-Engine owns wiring the writes; this section is the schema it
targets.

---

## 8. Phase 0 result — manual Radar run, 2026-07-09 (model VALIDATED)

Ran the §3.1 model by hand on 12 real companies in one vertical (B2B email/SMS
marketing SaaS) to check it surfaces sensible prospects before we automate.
**Caveat:** the AI-visibility-gap signal used web-search/listicle presence as a
proxy — the real Radar will run actual engine queries (Component A), which
sharpens this score. Directional, not exact.

| Rank | Company | Score | Tier | Why |
|:--:|---|:--:|:--:|---|
| 1 | **Maropost** | 82 | 🔥 Hot | Real & sizable ($10M raised, 377 emp) but **invisible in AI "best email tool" answers** (repositioned to "unified commerce") — has budget *and* the problem |
| 2 | **EmailOctopus** | 71 | 🔥 Hot | High gap + very reachable (small, founder-led) — but small → lower ACV |
| 3 | Sender (sender.net) | 69 | 🟡 Warm | Independent SMB challenger, under-visible, decent fit |
| 4 | Sendlane | 69 | 🟡 Warm | Good fit/gap **BUT being acquired by Privy → HOLD** (knockout, see below) |
| 5 | MailerLite | 63 | 🟡 Warm | Profitable/bootstrapped, moderately visible |
| 6 | Drip | 60 | 🟡 Warm | Ecommerce-focused, fairly visible already |
| 7 | Moosend | 58 | 🟡 Warm | Owned by Sitecore → no independent budget (knockout) |
| 8 | Omnisend | 58 | 🟡 Warm | Big/visible → **low gap, doesn't have the problem** |
| 9 | Brevo | 57 | ⚪ Watch | Large, funded, already wins AI answers |
| 10 | ActiveCampaign | 54 | ⚪ Watch | Incumbent, low gap |
| 11 | Privy | ~55 | ⚪ Watch | Owned by Attentive (knockout) |
| 12 | Klaviyo | 51 | ⚪ Watch | THE category champion in AI answers → lowest gap; won't buy from a startup |

**Verdict: the model works, and the AI-gap weighting (40) does the critical
job** — it correctly *inverts* "famous = good prospect." The biggest, best-known
names (Klaviyo, ActiveCampaign, Brevo, Omnisend) sink to the bottom because they
already win in AI answers and therefore *don't have the problem BrandGEO sells*.
The winners are real, funded-enough, but AI-invisible companies (Maropost,
EmailOctopus). That inversion is exactly the discriminator a naïve "find big
companies" list would get wrong.

**One concrete model fix Phase 0 surfaced — add a KNOCKOUT filter before scoring**
(these inflate on gap/size but should be auto-excluded, not just ranked):
- Currently being acquired / in active M&A (Sendlane, Privy).
- Owned by a parent suite with no independent budget (Moosend→Sitecore,
  Privy→Attentive).
- Too big / public / a direct competitor (won't buy from an early-stage vendor).
- Already high AI visibility (cap the score, don't surface).

**Second finding:** "vertical fit" (weight 15) is constant *within* a
pre-chosen vertical — it only differentiates *across* verticals. Fine as-is, just
noted so the automated Radar weights it only when scanning multiple verticals.

**Actionable takeaway:** even this quick pass produced 2–3 genuinely worth-a-real-
audit prospects (Maropost, EmailOctopus, Sender). A real Radar run with the
actual product audit would be sharper. **Green-light to build B.**

---

## 7. Kickoff prompts (generate after Constantin confirms the §6 open decisions)

Not written yet — these depend on the §6 answers (esp. #2, which determines
whether Master-Sales-Engine builds a Cowork automation or repo code). Once
confirmed, Master-GTM generates the three kickoff prompts (Master-DashboardDesign
for A, Master-Sales-Engine for B, Master-SiteDesign for D), same format as the
pricing-rollout prompts.
