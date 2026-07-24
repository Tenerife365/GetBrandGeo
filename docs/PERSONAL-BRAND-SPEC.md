# PERSONAL-BRAND-SPEC.md — Can BrandGEO measure individual professionals?

> **Initiative:** `Master-PersonalBrand` (new, CLAUDE.md §16 candidate)
> **Date:** 2026-07-16
> **Status:** Feasibility + spec ONLY. Nothing implemented. No schema applied,
> no code written, no client created.
> **Author routing:** Opus 4.8 (feasibility/architecture judgment per §0
> hybrid-routing rule).
>
> **The question:** BrandGEO tracks *companies* — a client has a brand,
> competitors, and buyer prompts ("best catering companies in Bucharest"),
> run through 5 AI engines and scored on 6 dimensions. Can the *same engine*
> serve a different buyer — an individual professional (freelancer, consultant,
> independent expert) who wants to know how *they* show up when someone asks an
> AI "who's the best [role] in [place]" — with recommendations to improve it?
>
> **The one-line answer: yes, almost entirely as-is.** The core pipeline is
> brand-agnostic by construction — it detects a set of *aliases* in text, it
> does not know or care whether those aliases name a company or a person. This
> is genuinely additive, not a rebuild. There are exactly **three** places where
> a person behaves differently from a company, and only **one** of them is a
> code-level snag rather than a data-entry discipline. This document names all
> three precisely and specs the minimal build to prove it on **one admin-created
> test individual**.

---

## 0. Executive summary

The hypothesis holds. `analyseResponse()` in `_analysis.js` builds its brand
matchers from `cfg.brand_aliases[]` plus the `brand_website` domain
(`buildBrandMatchers`, line 407), and every downstream step — mention detection,
position, sentiment, competitor extraction, the 6-dimension score in
`aiVisibilityScore.ts` — reads only from that abstract "did the brand's aliases
appear, and where / how" signal. Nothing in the analysis or the score inspects
whether the entity is a company. A person is, mechanically, just another set of
aliases in `brand_aliases`.

The three things that are genuinely different for a person:

1. **Identity mapping (data discipline, not code).** A person's `brand_website`
   is often absent or is a LinkedIn URL — and a LinkedIn URL is actively
   harmful as a matcher and as a geo signal. Aliases for a person also carry a
   false-positive trap (bare common first names / surnames) that companies
   rarely hit. Both are solved by *how you fill the existing columns*, not by
   changing them.

2. **The competitor semantic gate (the one real code snag).**
   `_competitor_filter.js` (the §8.16 Haiku gate) is explicitly written to keep
   only "genuine companies or products" and to *reject* people-adjacent nouns.
   For an individual client whose competitors **are** other people, this gate
   will strip legitimate competitors. It fails open and can only remove, so it
   never breaks collection — it just under-reports the competitor radar. This is
   the only spot that warrants a code branch, and even that is optional for a
   pure feasibility test.

3. **Prompt templates and copy (content, not schema).** "Best [role] in
   [place]" / "recommend a [role] for [need]" are new *prompt shapes*, but
   prompts are free-text rows the admin types — no new enum, no schema. The
   recommendations engine and some UI copy are company-flavored; that affects
   polish, not whether the score computes.

Everything else — the `type` field, the 6 dimensions, the architecture — is
either purely additive or unchanged. A single admin-created test individual can
be collected, analyzed, and scored today with **zero code changes**; the
recommended minimal build (one nullable column + optional gate branch) exists
only to make the seam clean and the competitor radar honest.

---

## 1. Does `clients` need a `type` field? (Question 1)

**Not to run the pipeline. Yes, as the clean seam for everything downstream.**

Nothing in collection, analysis, or scoring reads a client type today, so a
person-as-client works without one. But a nullable
`type text default 'company'` column (CHECK `type in ('company','individual')`)
is worth adding because it is the single switch that later drives (a) which
prompt templates the admin/UI offers, (b) person-appropriate UI copy, and (c)
the competitor-gate prompt variant (§4). It is **fully backward-compatible**:
every existing row reads `'company'`, and no existing query filters on it, so
adding it changes nothing that runs today. That is the definition of additive.

### What actually needs remapping when you populate a person's record

The columns don't change; what you *put in them* does. The important cases:

| Column | Company today | Individual mapping | Watch out |
|---|---|---|---|
| `name` | Display brand name | The person's display name | No issue. (Note: the live `clients` table has **no** `brand_name` column — identity is `name` for display + `brand_aliases` for detection, per CLAUDE.md §3. There is no "brand_name → person name" remap to worry about; it doesn't exist.) |
| `brand_aliases[]` | Company + short forms | Full name + 1–2 distinctive variants ("Dr. Jane Smith", "Jane A. Smith", a distinctive handle) | 🔴 **Never seed a bare common first name or surname.** `buildAliasRegex` (line 397) is boundary-anchored but still matches any standalone occurrence, so an alias `"Jane"` fires on every "Jane" in every answer — the exact false-positive class that bit BpR's 2-char `"bpr"` acronym (§8.7). Use full-name forms only. |
| `brand_website` | The brand's domain | The person's **own** domain (janesmith.com) **or leave empty** | 🔴 **Do not put a LinkedIn/social URL here.** `buildBrandMatchers` (line 408) strips protocol/path/www to a bare domain — `linkedin.com/in/janesmith` becomes the matcher `linkedin.com`, which matches *any* LinkedIn mention in *any* answer (garbage positives), and the §1.3 TLD geo-fallback would then derive the person's "location" from `linkedin.com`. Empty is safe (name aliases carry detection); a real personal domain is ideal. |
| `known_competitors[]` | Rival companies | Rival individuals (other named professionals) | Works — but see §4, the semantic gate may strip them. |
| `default_market_id` / `default_region_id` | Client's market | The person's market/geo | Set these **explicitly** for individuals. Because `brand_website` should be empty or a `.com`, the TLD geo-fallback (§1.3) has nothing useful to derive from, so geo must come from these columns, not the fallback. |

Nothing else on `clients` needs remapping. `plan`, `engines_enabled`,
`category`, the Stripe columns, etc. are all entity-type-neutral.

---

## 2. Do the 6 score dimensions still mean the same thing? (Question 2)

**Yes — all six keep the same meaning for a person. None needs to be
redefined.** This is the strongest part of the feasibility case, and it holds
because the dimensions in `aiVisibilityScore.ts` are defined over the abstract
"mentioned / position / sentiment" triple, not over anything company-specific.

Reading each against `computeAiVisibilityScore` (lines 73–153):

- **Recognition** (mention rate across prompt × engine pairs, line 94) — "does
  the AI name this person when asked." Identical meaning. A person's Recognition
  is exactly as meaningful as a brand's.
- **Knowledge** (position quality when listed, lines 97–104) — the person's rank
  in a recommended list ("3rd of the consultants it named"). Identical.
- **Sentiment** (tone when mentioned, lines 107–115) — how the AI characterizes
  the person. Identical in *meaning*. One soft caveat, not a redefinition: the
  sentiment lexicon (`posWords`/`negWords`, EN+RO) is tuned for business/service
  praise ("recommended", "reliable", "excellent option"). Praise of a *person*
  leans on "expert", "leading", "renowned", "go-to", "authority", "thought
  leader". Most of those already read positive, but the person-specific
  vocabulary is thinner. The dimension still means the same thing; its lexicon
  coverage is a soft quality item to note, not a break — same category as the
  RO-lexicon expansions in Master-Reasoning §8.6/§8.15.
- **Accuracy** (share of mentions landing top-3, lines 118–125) — identical.
- **Reach** (how many engines name the person at all, lines 128–131) —
  identical.
- **Consistency** (≥60% of engines agree per prompt, lines 134–139) — identical.

**Verdict: zero dimension changes required.** The weights (0.25/0.20/0.15/
0.15/0.15/0.10) are equally defensible for a person. The only follow-on worth
flagging is the sentiment lexicon note above, which is optional polish and
identical in kind to work the reasoning track already does for languages.

---

## 3. What new prompt categories/templates are needed? (Question 3)

**New templates, yes. New schema, no.** `prompts.category` is a free-text label
column (values today: `mid | large | very_large | general | tool_discovery |
geo_category | problem_based | direct_brand`), and prompt `text` is free-text
the admin types. Person-ranking needs new *question shapes*, all of which are
just rows in the existing table — reuse `general` / `geo_category` /
`problem_based` / `direct_brand` as labels, or add person-oriented label strings
if you want them for filtering (no migration; the column already accepts any
string in practice). The shapes person-ranking needs that don't exist today:

- **Geo-role ranking** — "best [role] in [location]" (e.g. "best fractional CFO
  in London"). The person analog of "best catering companies in Bucharest".
- **Need-based recommendation** — "recommend a [role] for [need]" / "who should
  I hire to [do X]".
- **Niche authority** — "top [niche] experts / who are the leading voices in
  [topic]".
- **Direct-identity** — "who is [name]" (the person analog of `direct_brand`;
  tests whether the AI knows them at all and what it says).
- **Discovery / follow** — "who are the best people to follow on [topic]".
- **Competitor-adjacent** — "alternatives to [named individual]" / "consultants
  like [name]" (surfaces the individual competitive set).

For the minimal test case the admin simply types 5–8 of these into the existing
prompt-creation flow. No code, no schema.

---

## 4. Any real architecture change required? (Question 4)

**No architecture change. One optional code branch, everything else additive.**

The collection path (`_collect.js` engine callers → `analyseResponse` →
`ai_results` → `aiVisibilityScore.ts`) is entirely entity-type-neutral and runs
a person unchanged. The competitor *extraction* structural rules also already
handle people: a two-word Title-Cased proper noun like "Sarah Johnson" passes
`looksLikeBrandName` (line 152) and `isCompanyName` (line 658) cleanly — in fact
the pipeline was already extracting person names (it once caught "Pope Francis"
as a false positive, which is what the semantic gate was built to remove).

**The one real snag — the competitor semantic gate.**
`_competitor_filter.js` sends the extracted candidate list to a Haiku call whose
prompt (line 39, `buildPrompt`) asks it to return *"ONLY the names that are
genuine companies or products COMPETING with"* the brand, and to exclude
"events, awards, publications, venues, institutions". For an **individual**
client, the real competitors are other **people** — and this prompt will very
plausibly classify "Sarah Johnson" as "not a company/product" and drop her.
Because the gate can only remove and fails open (no key / timeout / non-200 →
input unchanged, lines 81/104/109/116), it never breaks collection — it just
**silently under-reports** the individual competitor radar.

Two clean ways to handle it, neither a blocker:

- **Accept it for the pure feasibility test.** Collection, scoring, mention/
  position/sentiment all still work; only the competitor list may come back
  sparse. Fine for proving the hypothesis.
- **Minimal type-aware branch (recommended if competitor fidelity matters for
  the test).** In `buildPrompt`, when `ctx.cfg?.type === 'individual'`, swap the
  "genuine companies or products" framing for "genuine competing professionals,
  companies, **or** products in the same field" and drop the person-adjacent
  exclusions. This is a ~10-line, fail-open, backward-compatible change gated
  entirely on the new `type` field — companies see the exact prompt they see
  today.

Nothing else in the stack needs touching. The recommendations engine
(`generate-recommendations.js`) will produce business-flavored advice for a
person until its prompt is made type-aware — that is polish, not a blocker, and
explicitly out of scope for a feasibility test. The Instant Audit Engine /
prospect pipeline (`_prospect_prompts.js`, Component A) is domain-driven and
company-oriented; it is **out of scope** — this is an admin-created client, not
a public domain audit.

---

## 5. GTM implication — flag only, no pricing (Question 5)

🟡 **This is a genuinely new ICP, outside everything `GTM-STRATEGY.md` scoped.**
That doc's primary ICP is *SMB / lower-mid-market brands* bought via a
founder-led, high-ACV, done-for-you managed motion (§4.2, §6.0). Individual
professionals are a different buyer on every axis: they buy for personal
reputation / career / lead-gen rather than company visibility; they have far
lower willingness-to-pay than a company (which pressures toward a self-serve,
lower-ACV, higher-volume motion); and their competitive frame is *personal-
branding / reputation tools*, not the GEO-SaaS set (Peec, Profound, Otterly) the
existing analysis is built around.

That places this ICP structurally in GTM-STRATEGY.md's **secondary, self-serve,
"later" lane** (the §4.3 / Phase C scale motion), pulling *against* the urgent
managed-revenue focus of §6.0 — not because it's a bad idea, but because it's a
different motion that competes for the same founder time. **Do not design
pricing or packaging for it here.** The right home is a dedicated future
`Master-GTM` pass that decides whether individuals are (a) a self-serve product
line, (b) an add-on for consultants already inside client companies, or (c)
parked until the managed motion is repeatable. Flagged, not designed.

---

## 6. Recommendation — minimal build for ONE admin-created test individual

Scope guardrails for the implementation chat: **admin-only, not self-serve, not
public-facing, exactly one test case.** The goal is to prove the hypothesis end
to end (person named → detected → positioned → scored), not to ship a feature.

**Strictly required to run the test: nothing.** A person can be created and
collected today with zero code. The list below is the *clean minimal* build —
one small migration plus one optional branch — that makes the seam correct and
the competitor radar honest, so the test result is trustworthy rather than
caveated.

1. **Add the `type` column (one migration, backward-compatible).**
   `ALTER TABLE clients ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT
   'company' CHECK (type in ('company','individual'));` — every existing row
   becomes `'company'`, nothing that runs today reads it, so this is safe. This
   is the only schema change, and it's the seam for the gate branch and future
   UI.

2. **Create the single test individual directly in Supabase (admin-only, no UI
   work).** Set: `type='individual'`; `name` = the person; `brand_aliases` =
   full name + 1–2 distinctive variants, **no bare first name/surname** (§1
   trap); `brand_website` = the person's own domain **or empty**, **never a
   LinkedIn URL** (§1 trap); `default_market_id` + `default_region_id` set
   explicitly (geo can't come from TLD); `known_competitors` = a few named rival
   individuals; a real `plan` so engines gate on (e.g. a 5-engine plan).

3. **Seed 5–8 person-shaped prompts** (existing `prompts` table, `is_active
   true`, category `general` or a person label): the §3 shapes — "best [role] in
   [place]", "recommend a [role] for [need]", "top [niche] experts", "who is
   [name]", "alternatives to [named competitor]".

4. **(Optional but recommended) Add the type-aware competitor-gate branch** in
   `_competitor_filter.js` `buildPrompt` (§4): when `cfg.type === 'individual'`,
   allow competing *professionals*, drop the person-adjacent exclusions. ~10
   lines, fail-open, gated on `type` so companies are untouched. Skip it and the
   test still runs — the competitor radar may just be sparse.

5. **Run one collection through the existing pipeline unchanged** (manual
   collect / Force Refresh on the test client).

6. **Verify against raw data, per the CLIENT-HEALTH discipline (§13.2):** read
   the stored `response_text` (the §8.11 column) for a few rows, not just the
   derived score, and confirm: mention detection fires on the person's name and
   *not* on false positives; `brand_position` reflects real list rank; sentiment
   is sane; competitors captured are actual named individuals. Then confirm the
   6-dimension score computes and reads plausibly.

**Explicitly NOT in this pass:** any `type` toggle in the Onboard wizard or
dashboard UI, self-serve/public exposure, the prospect/Instant-Audit path,
recommendations-engine rewording, the sentiment person-lexicon, and any pricing/
packaging. All are follow-ons the test result would inform — not prerequisites
to it.

---

## 7. Bottom line

The person-ranking hypothesis is correct: BrandGEO's core mechanic
(prompt → AI answer → mention → position → sentiment → competitor → score) is
entity-agnostic and applies to an individual essentially unchanged. The `type`
field is a clean additive seam rather than a requirement; the 6 dimensions keep
their meaning verbatim; the new work is person-shaped *prompts* (data, not
schema) and one optional, fail-open branch on the competitor gate. The only
real gotchas are two data-entry disciplines (no LinkedIn URL in `brand_website`,
no bare-name alias) that this spec makes explicit. It is a genuinely small,
low-risk feasibility build — and the GTM question it opens (a new, self-serve,
lower-ACV ICP) is the real strategic decision, deliberately left for a future
`Master-GTM` pass rather than pre-decided here.
