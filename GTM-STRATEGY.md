# GTM-STRATEGY.md — BrandGEO Go-to-Market Strategy

> **Owner initiative:** `Master-GTM` (CLAUDE.md §10)
> **Date:** 2026-07-09
> **Author model:** Opus 4.8 (strategic reasoning per §0 hybrid-routing rule)
> **Status:** First full pass. Commercial strategy only — not product/UX
> (that's `Master-Redesign` §7), not internal product logic (`Master-Reasoning`
> §8), not content execution (`Master-Writer` §9). This doc references those
> initiatives where GTM depends on them but does not re-plan them.
>
> **What this doc is:** an evaluation of BrandGEO as a *commercial offering* —
> what's sold, who it's for, how it's priced against the competitive set, and a
> phased roadmap to take it to market. It is decision-forcing: §3 and §5 each
> surface a call that is genuinely Constantin's to make, with a recommendation
> and the reasoning behind it, not a hidden default.
>
> **Sourcing:** every competitor price and market stat here comes from a live
> 2026 web search this session (see §11 Sources). Prices move fast in this
> category — treat figures as "as of July 2026," re-verify before quoting any
> in a sales context.

---

## 0. Executive Summary — the three things that matter

1. **BrandGEO is really two products wearing one brand.** Free + Essentials
   (€0–99/mo) are a *self-serve SaaS tool*; Managed + Pro + Enterprise
   (€500–1,250+/mo) are a *done-for-you managed service*. This is currently
   framed as one pricing ladder but told inconsistently — `faq.html` literally
   says "BrandGEO is a fully managed service" while the same site sells a
   self-serve dashboard. **This straddle is BrandGEO's single biggest strategic
   asset AND its biggest messaging liability.** Resolve it deliberately (§3),
   don't let it stay accidental.

2. **The Managed tier is underpriced, and the mid-market has a hole.** A
   done-for-you GEO retainer in the 2026 market runs **$1,500–5,000+/mo**
   (entry to mid). BrandGEO's fully-managed tier is **€500/mo + €1,250 setup** —
   materially below the floor of the done-for-you market. Separately, there's a
   5× cliff from Essentials (€99) to Managed (€500) with nothing in the
   €200–300 band where Peec, Otterly, and AthenaHQ all cluster. Both are
   addressable and both are upside, not problems (§3).

3. **The wedge is "done-for-you" — sold worldwide, fastest via the free-audit
   funnel.** Nearly every direct competitor (Profound, Otterly, Peec, Scrunch,
   AthenaHQ) is self-serve and hands the client a dashboard to operate
   themselves. BrandGEO's differentiator is that it *does the work for you* —
   and because it's geo-aware and multi-language capable, it can serve any
   market, including non-English ones its US-built competitors serve worst.
   Given the urgent need for revenue now, the fastest path is **not** a
   self-serve funnel (slow, marketing-spend-heavy, competing head-on with funded
   players) but the **founder-led free-audit → managed-close motion**, run
   against reachable worldwide segments in the hot verticals. The existing
   RO/SEE clients become proof / case-studies, not a geographic ceiling
   (§4, §6). **See §6.0 for the do-this-week revenue plan.**

The rest of this doc backs these up and turns them into a step-by-step plan.

---

## 1. What BrandGEO Actually Sells Today

### 1.1 The offering (confirmed from live site + planConfig, not assumed)

A managed **AI Visibility / Generative Engine Optimization (GEO)** product that
monitors how a brand appears in AI-engine answers (ChatGPT, Gemini, Claude,
Perplexity, Meta AI live today; Google AI / Copilot / DeepSeek / Grok flagged
"coming soon"). Core client deliverables:

- **AI Visibility Score (0–100)** across six dimensions (Recognition,
  Knowledge, Sentiment, Accuracy, Reach, Consistency).
- Per-engine **mention / position / sentiment** tracking, weekly.
- **Competitor radar** (3–5 competitors).
- **"Fix This" recommendations hub** — sourced, specific action items.
- **Free AI Visibility Audit** — a 48-hour one-time snapshot, once per domain,
  used as the top-of-funnel lead magnet.

### 1.2 Current pricing ladder (canonical = `index.html` + `faq.html`)

| Tier | Price | Setup | What it is | Engines | Key limits |
|---|---|---|---|---|---|
| **Free** | €0 | — | Self-serve wedge | ChatGPT only | 1 project, 5 prompts, monthly refresh |
| **Essentials** | €99/mo | none | Self-serve SaaS | ChatGPT, Gemini, Claude | 30 prompts, weekly, competitor tracking, CSV |
| **Managed** ⭐ | €500/mo or €6,000/yr | €1,250 (waived annual) | **Done-for-you** | +Perplexity (+ managed strategy) | Full service: onboarding, prompt/competitor research, website AI audit, monthly exec report + strategy call, quarterly review, priority support |
| **Pro** | from €1,250/mo | €1,250 (waived annual) | Done-for-you, scaled | + Meta / broader | Multi-country, multi-brand, larger prompt coverage |
| **Enterprise** | Custom | — | Done-for-you, bespoke | All | Unlimited projects, white-label, dedicated support |

Managed is marked "Most Popular" and is clearly the intended revenue center.

### 1.3 The pricing inconsistency — must fix first (prerequisite)

`terms.html` still describes a **stale 2-tier model** that predates the current
5-tier ladder:

- terms.html: "Monthly Plan €500/mo + €1,250 setup" and "Yearly Plan €5,000/yr
  (setup waived, ~€417/mo)".
- Reality (index/faq): 5 tiers, and the annual price of the managed tier is
  **€6,000/yr, not €5,000** — so terms.html is wrong on *both* the tier
  structure *and* the annual number.

**This is a legal-document-vs-marketing contradiction and a live prospect-facing
error.** It must be reconciled before any pricing change below is made, and
before any serious outbound (a prospect who reads Terms sees different pricing
than the pricing page). This is the one hard prerequisite in this whole doc.

> **Action (hand to Constantin or a scoped Task chat, per §0 delegation rule):**
> rewrite `terms.html` §4 "Paid Plans & Pricing" to match the 5-tier model on
> `index.html`/`faq.html`, then cPanel re-upload and live-verify per
> [[brandgeo_verify_cpanel_upload]]. Scope: `terms.html` only. This is a
> `Master-Writer`-adjacent edit — coordinate so it doesn't collide with any
> in-flight `brandgeo/web/` work (§9.3 rule).

---

## 2. Competitive Landscape — Commercial Lens

Reusing the 9-name direct-competitor list from `COMPETITIVE-BENCHMARK.md`
(§7.7), but with **fresh pricing / ICP / positioning** researched this session
(that benchmark was UI/UX only). All figures "as of July 2026."

### 2.1 Direct competitors — self-serve GEO SaaS

| Competitor | Entry | Mid | Top / Enterprise | Pricing model | Positioning / ICP |
|---|---|---|---|---|---|
| **Peec AI** (the benchmark) | $89/mo (25 prompts) | $199 (100 prompts) | $499 (300+); agencies from $245 | Prompt-volume, **unlimited seats**, engines beyond ChatGPT/Perplexity/AI-Overviews are €20–30/engine add-ons | European (DE), marketing teams + SEO agencies; strong multi-brand/agency value |
| **Profound** | $99 (Starter, ChatGPT only) | $399 (Growth, 3 engines) | $2,000–5,000+ custom | Seat + response volume tiers; increasingly enterprise/custom | "Answer Engine Optimization" category-definer, Sequoia-backed, enterprise |
| **Otterly.AI** | $29 (Lite, 15 prompts) | $189 (Standard, 100) | $489 (Premium, 400); $100 all-models | Prompt volume; Gemini/AI-Mode as add-ons | SMB-friendly entry; transparent, cheap |
| **Scrunch AI** | $250 (Core) | — | Custom Ent; **Agency $500** | Flat tiers; 9 LLMs on Enterprise | Leads on **actionability** over raw data; agency program |
| **AthenaHQ** | $270–295 (Lite/self-serve) | $545 (Growth) | $2,000+ Ent | **Credit-based** (3,600 cr/mo) | Mid-market → enterprise; "Action Center"; explicitly steep for SMB |
| **Rankscale** | €20 (Essential) | €99 (Pro) | €385–780 (Growth/Ent) | **Credit-based**, all 17+ engines included | Cheapest broad-engine coverage; European |
| **Ahrefs Brand Radar** | ~$828 all-in ($129 base + $699 bundle) | — | $1,148+ | **Module** bolted onto Ahrefs SEO suite | Existing Ahrefs SEO customers, 6 engines |
| **Semrush AI Visibility** | $99/mo add-on (1 domain, 25 prompts) | Semrush One $199 | Enterprise AIO custom | **Module** add-on to Semrush | Existing Semrush customers |
| **Conductor** | Custom only | — | $26.8k–500k/yr (median ~$49k) | Enterprise annual contract | Six-figure-SEO-budget enterprises only |

### 2.2 The other competitor set BrandGEO actually competes with: done-for-you GEO agencies

BrandGEO's Managed/Pro tiers are **not** competing with the SaaS tools above —
they're competing with **GEO service retainers**. The 2026 market for
done-for-you AI-visibility work:

| Segment | Monthly retainer | Typical deliverables |
|---|---|---|
| Entry-level | **$1,500–2,500/mo** | Monthly AI-visibility testing across ChatGPT/Gemini/Perplexity; answer-first content restructuring (2–3 pages/mo); schema; review acquisition; directory management |
| Mid-market | **$3,000–5,000/mo** | Above + secured 3rd-party mention placements, original content, competitive share-of-voice tracking |
| Enterprise | **$5,000–25,000+/mo** | Dedicated PR relationships, custom research assets |

**This is the single most important number in the whole competitive analysis:**
BrandGEO's fully-managed done-for-you tier is **€500/mo**, and the *floor* of the
done-for-you market is **~$1,500/mo (~€1,400)**. BrandGEO Managed is priced like
a mid-tier SaaS tool while delivering a service that the market pays 3× more for.

### 2.3 Market context (validates the timing)

- **89% of B2B buyers now use AI platforms (ChatGPT etc.) for research;** 73% of
  SEO pros say AI tools are becoming core to their strategy.
- **<10% of brands currently monitor AI visibility** — genuine early-mover
  window, matches BrandGEO's own marketing thesis.
- **Hot verticals:** SaaS, financial services, health & wellness, travel,
  e-commerce — where users ask AI for recommendations/comparisons.
- **Agencies are a disproportionately strong buyer** (multi-client leverage) —
  every serious competitor has an explicit agency tier. BrandGEO does not yet.

---

## 3. Pricing Assessment & Recommendation

### 3.1 Tier-by-tier verdict

- **Free (€0)** — ✅ Keep. A true free tier (not just a trial) is a genuine
  differentiator; most competitors only offer trials. It's a strong lead-gen
  wedge. **But** it overlaps the "free audit" (see §3.3).
- **Essentials (€99/mo)** — 🟡 Priced right at the market entry point (vs.
  Semrush $99, Rankscale €99, Otterly $189, Peec $199), **but under-featured for
  the price**: 30 prompts vs. Peec's 100 and Otterly's 100 at a comparable
  tier. The €99 is defensible; the *value density* is not. **Fix by raising the
  prompt cap** (e.g. 30→75) and/or clarifying the competitor-tracking value,
  rather than cutting price.
- **Managed (€500/mo + €1,250 setup)** — 🔴 **Underpriced for what it is.** As a
  fully done-for-you service (strategy, research, monthly exec report + call,
  quarterly review) it sits *below the entry floor* of the GEO-agency market
  ($1,500+). Two options: (a) raise it toward market (e.g. €900–1,200/mo) and
  keep it the flagship, or (b) hold €500 deliberately as an aggressive
  land-price for the RO/SEE SMB ICP who can't stomach agency retainers, and make
  margin on volume + Pro upsell. **Recommendation: raise to ~€750–900/mo for new
  clients, grandfather existing at €500.** It's still the value leader vs.
  $1,500 agencies, but stops leaving 40–50% on the table. Keep the €1,250 setup;
  it's reasonable and the annual-waiver is a good conversion lever.
- **Pro (from €1,250/mo)** — ✅ Reasonable; aligns with the mid-market agency
  retainer floor. Leave as-is; it's the natural home for multi-brand/agency
  clients.
- **Enterprise (Custom)** — ✅ Correct to keep custom.

### 3.2 The structural gap: add a mid-tier

There is a **5× cliff from €99 to €500** with nothing between. The entire
competitive set clusters a tier in the **€200–300** band (Peec $199, Otterly
$189, AthenaHQ $270–295, Scrunch $250). BrandGEO has no offer for the prospect
who has outgrown self-serve Essentials but isn't ready for full done-for-you.

> **Recommendation: introduce "Growth" at ~€249/mo** — self-serve+, software-led
> with light-touch support: all 5 live engines, ~150 prompts, daily/weekly
> refresh, competitor tracking, one onboarding call, email support. This (a)
> plugs the cliff, (b) matches where competitors convert their volume, and (c)
> creates a natural stepping stone Free → Essentials → **Growth** → Managed.
> Engine-gating already supports this via `planConfig.ts` — it's a config +
> marketing change, not an architecture change.

### 3.3 Rationalize the two free entry points

Today there are **two** free front doors: the **Free tier** (self-serve
dashboard, ChatGPT-only) and the **Free Audit** (done-for-you 48-hr snapshot,
5 engines, human-delivered). They serve different motions but confuse the
funnel. **Recommendation:** make the Free Audit the *sales-assisted* entry
(managed motion → upsell to Managed) and the Free tier the *product-led* entry
(self-serve → upsell to Essentials/Growth). State this split explicitly on the
site so a prospect self-selects the right path instead of bouncing between them.

### 3.4 Proposed revised ladder (for discussion, not a mandate)

| Tier | Now | Proposed | Motion |
|---|---|---|---|
| Free | €0 | €0 | Product-led funnel |
| Essentials | €99 (30 prompts) | €99 (raise to ~75 prompts) | Self-serve |
| **Growth (new)** | — | **~€249** | Self-serve+ |
| Managed | €500 + €1,250 setup | **~€750–900** + setup (grandfather existing) | Done-for-you |
| Pro | from €1,250 | from €1,250 | Done-for-you / agency |
| Enterprise | Custom | Custom | Bespoke |

**This is the central pricing decision for Constantin (§0 decision-forcing):**
does BrandGEO lead as an aggressively-priced *value* player (hold €500 Managed,
win on price vs. agencies) or reprice Managed toward the market and win on
*differentiation* (done-for-you + local-market)? This doc recommends the latter,
but it's a deliberate call, not a default.

---

## 4. Product-Market Fit & ICP

### 4.1 Who's actually buying (evidence from real client roster)

The current `clients` roster (per CLAUDE.md) is small and telling: **BpR** (Bucate
pe Roate, Bucharest catering), **Păunescu & Asociații** (Romanian law firm),
**Lodgify**, **Workfully**, and **BrandGEO itself**. Read honestly, that's:
mostly **Romania / SEE-based SMBs and professional-services firms**, plus a
couple of SaaS brands. It is *not* yet a base of self-serve US marketing teams.

### 4.2 The ICP (primary) — worldwide, defined by need not geography

**Any SMB or lower-mid-market brand in an AI-disrupted, recommendation-driven
vertical — SaaS, e-commerce, travel/hospitality, professional services
(legal / accounting / consulting), local B2B — that (a) knows AI answers are
starting to matter, (b) has no in-house SEO/GEO capacity, and (c) will pay
someone to just handle it.** Reachable worldwide; not restricted to any one
country.

Why "done-for-you" wins this buyer worldwide, not just locally:
- **The managed model fits them** — they can't/won't operate a self-serve tool;
  they'll pay for done-for-you. This is exactly the buyer a US self-serve tool
  (Profound, Peec, Otterly) serves *worst* — anywhere in the world.
- **Geo + multi-language is a capability, not a market limit.** Geo-context
  injection (§1.3) and language-aware sentiment scoring (Master-Reasoning step
  2b) let BrandGEO serve markets English-first tools score poorly or not at all
  — a differentiator to deploy opportunistically (a Spanish, German, or RO
  client a US tool mis-scores), not a reason to sell in only one region.
- **Founder-led close is the fast lever.** A €500+/mo managed deal closed by the
  founder off a free audit brings revenue in *now*; a self-serve funnel takes
  months and marketing spend to fill. For the urgent-revenue goal, the managed
  motion is the priority regardless of the client's geography.
- **EU/Spain-governed entity** (per terms.html governing law) — clean for EU
  buyers on data/GDPR, and no barrier to selling outside the EU.

### 4.2b Refinement — drop criterion (a); the audit creates the awareness (decided 2026-07-18)

Real inbound revealed that the §4.2 ICP's criterion **(a) "knows AI answers are
starting to matter" is the friction, not a requirement.** The strongest interest
is coming from the *less* sophisticated end of the band: small/local businesses
that do not understand SEO at all, often with **inaccurate or outdated public
information and old or missing websites**. These are genuine low-hanging fruit,
and pursuing them is an extension of the §4.2 done-for-you strategy, not a pivot.

**Why they are the better wedge right now:**
- **Only the managed model can serve them.** They cannot operate a self-serve
  dashboard, so Peec/Profound/Otterly structurally cannot sell to them — this is
  §4.2's differentiator at its strongest.
- **They are a testimonial/case-study factory.** A broken presence has huge,
  fast, visible wins available (fix GBP, NAP consistency, basic schema, a few
  real articles) → clean before/after score jumps → the exact proof asset the
  business lacks.
- **The audit hits harder here.** "You are invisible, and your public info is
  wrong" lands more viscerally on a genuinely broken presence than on a savvy
  marketing team. Better hook, not worse.
- **Lower price sensitivity.** Their only alternative is a €2-5k/mo agency, so
  €900 Managed reads as cheap.

**The decision:** pursue this segment as a **distinct packaged funnel, not a
rebrand.** Do NOT dilute the premium GEO positioning (research paper, comparison
pages) built for the sophisticated buyer, and do not drop into the commoditized
local-SEO-agency pool. Instead:
1. **Own funnel:** a plain-language, audit-first landing page —
   `brandgeo/web/get-found-online.html` (live 2026-07-18) — leading with the
   outcome ("customers and AI can't find you / your info is wrong, we fix it,
   done for you"), never with "GEO." The AI Visibility Score is the proof/
   reporting layer, not the pitch.
2. **Productized delivery:** the repeatable checklist + intake scoping in
   `MANAGED-SERVICE-SOP.md`, so full-service delivery for unsophisticated SMBs
   stays margin-safe and does not become an unscalable bespoke agency.
3. **Integrity gates:** Wikipedia only where genuinely notable; no scaled/spun
   content; no fake reviews (`rules/content-integrity.md`). The "we do everything"
   menu must stay legitimate.

**Named tension (unchanged from §4.4):** this leans BrandGEO further toward
*productized service* (cash-flowing, labor-bound) vs *scalable SaaS*. That is
consistent with the doc's **sequencing** resolution — managed-first for revenue
and reference logos now, self-serve scale later — *provided* delivery is kept
productized per the SOP. Run it as one ladder (§5.2): Segment B is the cash
engine + proof factory now; the SaaS/measurement product is what it wraps around
and graduates toward.

### 4.3 Secondary ICP (expansion / scale, later)

**Worldwide SaaS / e-commerce / travel marketing teams and small agencies** —
the volume/scale play. Serve them **self-serve** (Free → Essentials → Growth)
once the managed motion is repeatable and the product's mention/sentiment
accuracy is hardened by Master-Reasoning. Agencies specifically are a
high-leverage channel (multi-client) — but only once there's an agency tier and
multi-brand UX (Pro already exists as the commercial container). This is the
*second* motion, not the urgent one.

### 4.4 Honest PMF read

- **Signal for PMF:** real paying clients exist, the product works end-to-end,
  and the category is validated (<10% penetration, 89% buyer AI-usage). ✅
- **Signal against strong PMF yet:** the base is a *handful* of clients, several
  of them founder-adjacent (BrandGEO itself, likely relationship-sourced RO
  clients). This is **early PMF / pre-repeatability**, not proven scale. The
  right posture is "find the repeatable managed motion in one vertical, then
  templatize," not "pour fuel on the funnel."
- **The core tension** (must be named): the §4.1 codebase Scalability Rule
  ("scale to 1,000 clients") points at *self-serve scale*, but the money and the
  differentiation today are in *high-touch managed*. These pull in opposite
  directions. **Resolution: sequence them.** Managed-first for revenue and
  reference logos now (2026 H2); self-serve scale second (2027) once accuracy +
  onboarding speed are hardened. Don't try to be both to everyone at once.

---

## 5. Positioning

### 5.1 Recommended positioning statement

> **For brands that can't see themselves in AI answers and don't have an SEO
> team to fix it, BrandGEO is the done-for-you AI Visibility service that
> monitors every major AI engine — in any market and any language — and does the
> work to get you cited. Unlike self-serve tools that hand you a dashboard and
> leave, BrandGEO delivers the strategy, the fixes, and a person who owns the
> outcome.**

The differentiators to lead with (all real, all defensible):
1. **Done-for-you, not DIY** — the category is 90% self-serve tools; BrandGEO is
   a service. (Validated: Scrunch/AthenaHQ lead on "actionability," BrandGEO can
   own the full "we do it" position above them.)
2. **Any market, any language** — measures the client's actual market, in their
   language, where global English-first tools are weakest. A worldwide-usable
   capability, not a regional restriction.
3. **Every major engine + a real score + real fixes** — six-dimension score is
   more diagnostic than competitors' 2–3 metrics (per §7.7 — lean into depth as
   a strength for the managed buyer who wants the analysis done *for* them).

### 5.2 The straddle, resolved

Don't hide the two-model reality — **structure it as one honest ladder**:
"Start free and self-serve to see your gap; graduate to fully managed when you
want us to close it." The Free/Essentials/Growth tiers become the **top of the
funnel for the Managed business**, not a competing product. This turns the
current liability (confusing dual identity) into the acquisition engine for the
high-value motion.

---

## 6. GTM Roadmap — Step by Step

Framed in the repo's session-scoped style (§0) plus rough calendar horizons.
Each numbered item is independently actionable and most can be handed off per
the delegation rule.

### 6.0 — Fastest path to paying clients (start this week)

The urgent-revenue goal changes the *order*, not the strategy. Self-serve scale
is months away; the quickest euro comes from **founder-led, high-ACV managed
closes off the free audit**. Concretely, in parallel with the Phase A cleanup:

1. **Build a target list of 30–50 reachable brands worldwide** in ONE vertical
   you can speak to credibly (recommend professional services or boutique SaaS).
   Criteria: recommendation-driven category, no visible in-house SEO team,
   founder/marketing-lead reachable on LinkedIn or email. Tools: Apollo/Clay
   (connectors exist here) or manual.
2. **Run each one through the free audit *before* you contact them** — lead with
   the result, not a pitch. "I ran your brand across ChatGPT, Gemini, Perplexity,
   Claude and Meta AI — here's where you show up and where a competitor is named
   instead. Want the full breakdown?" This is BrandGEO's unfair advantage: the
   product *is* the outreach hook. Nobody ignores their own scorecard.
3. **Book a 20-minute findings call** off each interested audit (Cal.com/Calendly
   link). On the call: walk the gaps, then propose **Managed** (or a 3-month
   pilot). The audit already did the selling.
4. **Close 3–5 Managed clients** this way before spending a euro on marketing or
   building the self-serve funnel. That's the proof the motion is repeatable —
   and immediate MRR.
5. **Instrument the ratio** as you go: audits sent → replies → calls → closes.
   That funnel *is* the business you're building; the numbers tell you what to
   fix and whether to raise Managed pricing now or after more closes.

Everything below (Phases A–D) is what makes this repeatable and scalable; §6.0
is what gets money in the door while you do it.

### Phase A — Foundation (next ~30 days, mostly prerequisite cleanup)

1. **Fix `terms.html` pricing** to the 5-tier model (§1.3). Hard prerequisite —
   blocks credible outbound. *(Master-Writer-adjacent web edit.)*
2. **Decide the two pricing calls** in §3 (Managed reprice? add Growth tier?).
   Founder decision; everything downstream keys off it.
3. **Lock the positioning** (§5) and rewrite the homepage hero + FAQ "managed vs
   self-serve" answer so the two-model story is coherent. *(Master-Writer.)*
4. **Stand up a CRM + pipeline** (see §7 tools) — even 5 clients deserve a
   pipeline; you can't run outbound without one.
5. **Instrument the funnel:** define the 3 metrics that mean "GTM is working"
   (§8) and wire them (Plausible is already live; add signup→audit→paid events).

### Phase B — Prove the repeatable managed motion (~30–90 days)

6. **Pick ONE beachhead vertical (worldwide, not geographic)** — recommendation:
   professional services (legal/accounting/consulting) or boutique SaaS: high
   willingness to pay for reputation, low DIY appetite, and you already have a
   reference (Păunescu). Templatize the managed deliverable for it (prompt sets,
   report format, "Fix This" playbook) so each new close is faster than the last.
   Depth in one vertical beats spraying across many — the audit hook and the
   report template both compound within a category.
7. **Dogfood + case-study engine:** run BrandGEO on itself and on 2–3 consenting
   clients, publish anonymized results as case studies (ties directly to
   `Master-Writer` §9.2 dogfooding + §9.5 case-study pipeline). "We used our own
   tool on ourselves — here's what we found" is the highest-trust content you can
   make in this category.
8. **Free Audit as the primary sales motion:** systematize the 48-hr audit →
   findings call → Managed proposal. This *is* the managed sales funnel. Measure
   audit→call→close conversion; that ratio is your GTM health.
9. **Founder-led outbound** to the beachhead vertical, worldwide (LinkedIn +
   email, audit-first per §6.0). 20–30 targeted audits/month is enough to find
   the motion — this is the same activity as §6.0, sustained.

### Phase C — Scale the winning channel (~90–180 days)

10. **Content/SEO + own-GEO flywheel** (this is a channel, owned by
    `Master-Writer` §9 — do not re-plan it here, just fund it): finish BG-005–008,
    ship the glossary, and add **head-to-head comparison pages** ("BrandGEO vs
    Peec," "BrandGEO vs Profound") — a specific tactic Peec uses that BrandGEO
    lacks (§7.7 §4, `COMPETITIVE-BENCHMARK.md`). Rank for "AI visibility [vertical]"
    and "[competitor] alternative."
11. **Launch an agency/partner tier** (Pro is the container; add referral
    economics). Agencies are the highest-leverage buyer in this category and
    every competitor courts them; BrandGEO doesn't yet.
12. **Turn on self-serve scale (secondary ICP)** — only once English-market
    accuracy is hardened (gated on `Master-Reasoning` §8 accuracy fixes) and
    onboarding-to-first-value is fast (protect the speed, per §7.7 Peec finding).
    Product-led funnel: Free → Essentials → Growth.

### Phase D — Expand (~6–12 months)

13. Add adjacent RO/SEE verticals (hospitality, local e-commerce) using the
    templatized playbook from step 6.
14. Consider a second-language market (the RO-lexicon work generalizes — Spanish
    is a natural next given the Spain-governed entity).
15. Revisit pricing power with real cohort data; the Managed reprice decision
    (§3) should be re-tested against actual close rates and churn.

---

## 7. Supporting Tools / Stack

Right-sized for a founder-led, early-PMF, managed-first motion — not an
enterprise stack. Prefer free/low tiers until the motion is proven.

| Need | Recommendation | Why / notes |
|---|---|---|
| **CRM + pipeline** | HubSpot (free tier) or Attio | Track audit → call → proposal → close. Free HubSpot is plenty at this stage; Attio if you want a more modern, flexible model. A HubSpot connector exists in this workspace. |
| **Outbound / sequencing** | Instantly or Smartlead (email) + manual LinkedIn | Founder-led, low volume. Don't over-tool; 20–30 targeted touches/mo. Apollo/Clay connectors exist here for list-building if you scale. |
| **Payments / billing** | **Stripe** (add subscriptions + the €1,250 setup as an invoice item) | Currently pricing is "contact sales." Stripe Billing enables self-serve checkout for Free/Essentials/Growth and clean recurring + setup-fee handling for Managed. Prerequisite for any product-led motion. |
| **Web analytics** | Plausible (already live) | Keep. Add funnel events (signup, audit request, paid). |
| **Scheduling** | Cal.com or Calendly | For the free-audit → findings-call motion. Reduces the biggest friction point in the managed funnel. |
| **Proposals / contracts** | PandaDoc or DocuSign | Managed deals need a proposal + MSA; a DocuSign connector exists here. |
| **Product analytics** (later) | PostHog (free tier) | Only when self-serve scale turns on (Phase C/D) — track activation/time-to-first-value. |
| **Reviews / social proof** | G2 + Capterra listings | Competitors cite "4.9/5 on G2" (§7.7); a real third-party rating beats "trusted by teams." Get listed early even with few reviews. |

**Do NOT adopt** a heavy MAP (Marketo), a data warehouse, or a multi-tool
outbound stack at this stage — it's premature and burns the runway. The whole
Phase-A/B stack can be ~free-to-$100/mo.

---

## 8. Success Metrics (define "the GTM is working")

Pick a *small* set and instrument them (this also closes the §7.5 open item that
no redesign/GTM success metric was ever defined):

1. **North-star (managed motion):** Free-Audit → Managed close rate, and
   **new Managed MRR / month**. This is the business.
2. **Funnel health:** audit requests/mo → findings-calls booked → proposals →
   closes. Watch where it leaks.
3. **Product-led leading indicator (secondary ICP):** signup → first populated
   dashboard (time-to-first-value) and Free → paid conversion. Protect
   time-to-first-value — it's Peec's cited strength (§7.7).
4. **Retention:** Managed logo + net revenue retention. In a service business,
   churn kills faster than slow acquisition. Target the first repeatable-vertical
   cohort staying ≥6 months (matches the "3+ months to see trend" sales promise).

---

## 9. Key Risks & Open Questions

- 🔴 **Pricing-doc contradiction** (`terms.html`) — a live legal/marketing
  mismatch. Must fix before outbound (§1.3). Only hard blocker in this doc.
- 🟡 **Repeatability unproven** — PMF is early; the plan deliberately front-loads
  *finding* the repeatable motion (Phase B) over scaling. Don't skip to Phase C.
- 🟡 **The two-model straddle** — if left un-resolved in messaging, it confuses
  every prospect. §5.2 resolves it; execution is the risk, not the strategy.
- 🟡 **Accuracy gates the self-serve scale play** — English-market
  mention/sentiment accuracy (Master-Reasoning §8) must be hardened before
  product-led scale; a self-serve tool that scores English brands wrong churns
  instantly. Managed masks this (a human sanity-checks); self-serve doesn't.
- 🟡 **Category is heating fast** — Profound (Sequoia $35M), Peec, and SEO
  incumbents (Ahrefs/Semrush/Conductor) are all funded and moving. BrandGEO's
  defensibility is *local-market + done-for-you*, NOT feature parity with funded
  US SaaS. Don't get drawn into a feature/price race on the self-serve axis where
  those players win; win where they're absent.
- ⚪ **Coordination with Master-Reasoning §8.1 item 4** (plan-to-engine mapping)
  — that's the *internal* "is engine-gating smart" question; this doc's pricing
  is the *external* "is it competitive" question. Reconcile the two before
  finalizing any new tier's engine allocation (e.g. the proposed Growth tier's
  5-engine access should be checked against engine-value findings there).

---

## 10. The One-Paragraph Version (for a board update / investor note)

BrandGEO operates in a validated, fast-growing, under-penetrated category (AI
visibility / GEO; <10% brand adoption, 89% of B2B buyers already researching via
AI). Its edge is not competing head-on with funded US self-serve tools (Profound,
Peec, Otterly) but owning the **done-for-you** position those tools serve worst —
sold worldwide, with geo/multi-language coverage as a capability that opens
markets English-first tools handle poorly. The flagship Managed tier is currently
**underpriced** (€500/mo vs. a $1,500+/mo done-for-you market floor) and there's
a structural gap in the €200–300 self-serve band; both are near-term upside. For
the urgent-revenue goal the priority is **founder-led, high-ACV managed closes
off the free audit** (§6.0) — the product doubles as the outreach hook — before
any spend on a self-serve funnel. The broader plan is managed-first: fix the
pricing/positioning foundation, prove one repeatable vertical worldwide, build a
case-study / own-GEO content flywheel, then layer self-serve scale and an agency
channel once product accuracy and onboarding speed are hardened.

---

## 11. Sources

Competitor pricing/positioning and market stats — live web search, July 2026:

- [Profound Pricing](https://www.tryprofound.com/pricing) · [Profound review (Trakkr)](https://trakkr.ai/reviews/profound-review/pricing)
- [Peec AI Pricing](https://peec.ai/pricing) · [Peec AI Agency Pricing](https://peec.ai/pricing-agencies) · [Peec review (Discovered Labs)](https://discoveredlabs.com/blog/peec-ai-review-best-for-ai-visibility-monitoring-use-cases-limits-alternatives)
- [Otterly.AI Pricing](https://otterly.ai/pricing) · [Otterly pricing (Trakkr)](https://trakkr.ai/reviews/otterly-review/pricing)
- [Scrunch Pricing](https://scrunch.com/pricing/) · [Scrunch pricing FAQ](https://scrunch.com/faqs/what-is-the-pricing-for-scrunch-plans)
- [AthenaHQ Plans](https://athenahq.ai/plans) · [AthenaHQ pricing (Trakkr)](https://trakkr.ai/reviews/athenahq-review/pricing)
- [Rankscale Pricing](https://rankscale.ai/pricing)
- [Ahrefs Brand Radar](https://ahrefs.com/brand-radar) · [Brand Radar cost breakdown (EWR Digital)](https://www.ewrdigital.com/blog/ahrefs-brand-radar-review-alternatives-pricing-comparison)
- [Semrush AI Visibility Toolkit Pricing](https://www.semrush.com/pricing/ai/) · [Semrush AI pricing (Trakkr)](https://trakkr.ai/reviews/semrush-review/pricing)
- [Conductor Pricing](https://www.conductor.com/pricing/) · [Conductor pricing analysis (CheckThat.ai)](https://checkthat.ai/brands/conductor/pricing)
- [What AEO/GEO actually cost in 2026 (HumansWith.ai)](https://humanswith.ai/blog/what-aeo-and-geo-actually-cost-in-2026/) · [GEO agency pricing (RevvGrowth)](https://www.revvgrowth.com/geo/geo-agency-pricing) · [GEO retainer cost (GEOScout)](https://geoscout.pro/en/blog/how-much-geo-retainer-costs-for-agencies)
- [Best AI visibility platforms for marketing teams (Pixis)](https://pixis.ai/blog/best-ai-visibility-platforms-in-2026-a-detailed-comparison-for-marketing-teams/) · [AI search visibility tools 2026 (Search Influence)](https://www.searchinfluence.com/blog/ai-seo-tracking-tools-2026-analysis-platforms/)

Internal (this repo): `COMPETITIVE-BENCHMARK.md` (§7.7 UI/UX scan), `CLAUDE.md`
§1.7 / §10, `brandgeo/web/index.html` + `faq.html` + `terms.html` (pricing).
