# MANAGED-SERVICE-SOP.md — Done-For-You Delivery Playbook

> **Purpose:** the repeatable, productized delivery process for BrandGEO's
> Managed tier, with a specific eye on the "low-hanging fruit" segment
> (Segment B in `GTM-STRATEGY.md §4.2b`): small and local businesses that do
> not understand SEO/GEO, often with outdated or inaccurate public information
> and old or missing websites. The landing funnel for this segment is
> `brandgeo/web/get-found-online.html`.
>
> **Why this doc exists:** the Managed model is BrandGEO's real differentiator
> (no self-serve competitor can serve this buyer), but full-service delivery for
> unsophisticated SMBs is labor-heavy and does NOT scale on its own. The only way
> it stays profitable and consistent at volume is to **productize it** into a
> fixed checklist with clear scoping and guardrails, instead of running each
> client as a bespoke agency project. That is what this playbook is.
>
> **Last updated:** 2026-07-18.

---

## 0. Operating principles

1. **Fixed package, not bespoke.** Every Managed client goes through the same
   phases and checklist below. Customization happens in the *content* of each
   step, not in inventing new steps per client. This is what makes it repeatable.
2. **The client should not have to understand any of it.** Plain-language
   updates only. No jargon in anything client-facing. We do the work; they
   approve direction and see proof.
3. **The AI Visibility Score is the proof layer, not the pitch.** For Segment B,
   never lead with "GEO." Lead with "customers and AI can't find you / your info
   is wrong, we fix it." The score is the monthly evidence it is working.
4. **Never trade the client's long-term safety for a short-term win.** Every
   tactic must survive a future Google or platform update. No scaled/spun
   content, no fake reviews, no black-hat link schemes, no Wikipedia pages for
   non-notable businesses. See §6 Guardrails. This is non-negotiable and is the
   project-wide content-integrity rule (`rules/content-integrity.md`).
5. **Protect margin at intake, not after.** The heaviness of remediation is
   scoped BEFORE the deal closes (§2), so a "we do everything" promise never
   turns into an unbounded, unprofitable rebuild.

---

## 1. Segment fit — who this is for

**Good fit (close it):** a real operating business with genuine customers, whose
online presence is missing, outdated, inconsistent, or invisible to AI, and who
would rather pay someone than learn to do it. Professional services, local B2B,
hospitality, home services, clinics, trades, single-location and small multi-
location brands.

**Poor fit (redirect, do not force):**
- Pure DIY buyers who want a dashboard and will operate it themselves → self-serve
  (Free / Essentials / Growth), not Managed.
- Businesses wanting guaranteed #1 rankings or overnight results → reset
  expectations or decline; we sell real, compounding work, not magic.
- Anything requiring tactics that violate §6 (fake reviews, spam content,
  non-notable Wikipedia). Decline the specific ask, keep the legitimate work.

---

## 2. Intake & scoping (before the deal closes)

The free audit is the hook; the intake is what protects margin. Run the audit,
then a short scoping pass to classify remediation weight.

**Always captured at intake:**
- Business name, real brand aliases, website (or "none"), primary market + region
  (set the correct submarket, e.g. Tenerife, not just Spain — see `marketContext.tsx`).
- The 3-5 real buyer questions their customers actually ask (this becomes their
  prompt set).
- Current state of: Google Business Profile, website, top directory listings,
  reviews, any existing content.
- Who owns/controls each asset (do they have GBP access, domain access, etc.).

**Remediation-weight tiers (drives scope, setup fee, and expectations):**

| Tier | Looks like | Scope implication |
|---|---|---|
| **Light** | Decent site, GBP exists, info mostly right, just AI-invisible | Standard Managed, standard setup. |
| **Medium** | Old/thin site, inconsistent listings, wrong info in a few places | Standard Managed; setup fee firmly applies; heavier onboarding month. |
| **Heavy** | No real website, or a rebuild needed; wrong info everywhere; no GBP | Scope the site build explicitly. Either raise setup, stage the rebuild as a defined add-on, or start with a lean presence and expand. Do NOT absorb an open-ended rebuild into a flat €900/mo. |

**Rule:** a website *rebuild* is a scoped deliverable with its own boundary, not
an implied part of the monthly retainer. Name it, price it, or stage it.

---

## 3. The delivery checklist (the productized package)

This mirrors the public promise on `get-found-online.html`. Every Managed client
gets the applicable items; skip only what genuinely does not apply, and note why.

### Phase A — Onboarding month (get the foundation right)
- [ ] **A1. Access & baseline.** Collect access to GBP, domain/site, analytics,
      Search Console. Run and archive the baseline AI Visibility audit (score +
      per-engine KNOW/PARTIAL/MISSING). This baseline is what every future
      monthly report is measured against.
- [ ] **A2. Fix public business information everywhere.** Correct and make
      consistent name, address, phone, hours, categories, description across
      Google Business Profile, maps, and the major relevant directories. NAP
      consistency is a real AI trust signal and often the single fastest win.
- [ ] **A3. Website: fix or modernize.** Ensure the site loads well, is mobile-
      friendly, states clearly what the business does and where, and has correct
      contact info. Heavy tier: execute the scoped rebuild per §2.
- [ ] **A4. Make the business machine-readable.** Add correct structured data
      (LocalBusiness / Organization / relevant type), clean metadata, and clear
      on-page entity signals so AI engines can confirm what the business is and
      where it operates.
- [ ] **A5. Seed the prompt set + first collection.** Load the client's real
      buyer prompts and correct market/region into the platform; run the first
      real collection so the dashboard reflects their actual market.

### Phase B — Ongoing (monthly, compounding)
- [ ] **B1. Content cadence.** Publish genuinely useful content that answers real
      customer questions (site pages and, where it fits, articles/posts). Real,
      sourced, useful only. Never scaled or spun. Cadence per capacity, quality
      over volume.
- [ ] **B2. Reputation & third-party signals.** Encourage legitimate reviews,
      keep listings current, and build genuine, earned third-party mentions.
      Never fabricate reviews or mentions.
- [ ] **B3. Search foundations upkeep.** Google Search Console health
      (indexing, errors), ongoing GBP optimization (posts, Q&A, photos),
      technical hygiene.
- [ ] **B4. AI visibility monitoring.** Re-run collection on the client's cadence;
      watch the score, position, sentiment, and competitor movement across all
      live engines. Feed gaps into next month's "Fix This" priorities.
- [ ] **B5. Selective authority work (only when legitimate).** Pursue
      higher-authority assets (e.g. a genuine industry directory, a real press
      mention, and Wikipedia ONLY where the business is genuinely notable per
      §6) when and only when they are warranted and clean.

### Phase C — Monthly reporting (the proof)
- [ ] **C1. Send the monthly report** (§4). Plain language. Score + direction,
      what changed, what we did, what is next. No jargon.

---

## 4. Monthly report template (client-facing, plain language)

Keep it short and legible. Structure:

1. **Your AI Visibility Score this month:** `NN / 100` (`↑/↓ X` vs last month).
2. **What that means in one line:** e.g. "More AI engines are now naming your
   business when customers ask, and your Google information is now correct."
3. **What we did this month:** 3-5 bullets, plain language (fixed hours on Google,
   added X page, corrected two directories, etc.).
4. **What moved:** per-engine before/after in simple terms (e.g. "ChatGPT now
   recommends you for [question]; Gemini still does not, we are working on it").
5. **What is next:** the top 1-3 priorities for next month.
6. **Anything we need from you:** usually nothing; only ask when genuinely blocked.

No score is ever inflated or invented. If a month is flat, say so and say why.

---

## 5. Cadence & expectation-setting

- **Fast wins (days):** correcting wrong GBP / listing information.
- **Medium (weeks):** structured data, site fixes, first content, initial AI
  recognition improvements.
- **Compounding (months):** durable AI visibility, position gains, competitor
  displacement. This is why it is a monthly service, not a one-off project, and
  must be sold that way.

Set this expectation explicitly at close so month one is never judged as if it
were the finish line.

---

## 6. Guardrails (hard limits — do not cross)

Directly enforce `rules/content-integrity.md`:
- **No fabricated anything:** no invented stats, quotes, reviews, testimonials,
  or case studies. Every published claim must be verifiable at publish time.
- **No scaled/spun content:** no near-duplicate city/keyword page farms, no
  auto-spun articles. Every page must earn its place by being genuinely useful.
- **Wikipedia only when genuinely notable.** Wikipedia has strict notability and
  conflict-of-interest rules. Creating a page for a non-notable local business
  violates policy, will likely be deleted, and can harm the client. Only pursue
  when the business genuinely meets notability, and disclose appropriately.
- **No fake reviews, no review gating that violates platform terms, no link
  schemes.** Reputation work is earned, not manufactured.
- **No misapplied structured data** (e.g. forcing NewsArticle onto non-news) to
  trick crawlers.
- **Brand imagery is generated programmatically** per `HERO-IMAGE-GUIDE.md`, never
  via AI image generators.

If a client asks for something that crosses these lines, decline that specific
item, explain why in plain terms (it protects them), and deliver the legitimate
alternative.

---

## 7. Scaling this without becoming an unscalable agency

- **Templatize every deliverable:** intake form, structured-data snippets per
  business type, GBP optimization checklist, the report template above, standard
  content briefs. Each new client reuses templates, not net-new thinking.
- **Track delivery hours per tier** so pricing stays honest as volume grows; if
  Heavy-tier clients routinely lose money at flat pricing, adjust the tier/setup,
  do not quietly absorb it.
- **Feed proven outcomes back into sales:** every strong before/after becomes a
  (permissioned) case study, which is the project's most-needed proof asset and
  the top of the funnel for the next Managed close.
- **Graduate the relationship:** the dashboard and score are always included, so
  a Managed client can, over time, move toward a lighter self-serve arrangement
  if they mature, keeping BrandGEO in the account either way.
