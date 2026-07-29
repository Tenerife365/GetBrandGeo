# Shared brief: four-pillar distribution

Every agent on this run reads this file first and treats it as authoritative.
It exists so five agents produce one coherent campaign instead of five.

Skill contract: `.claude/skills/growth-media-architect/SKILL.md`. This brief does
not replace it, it pins the parts that must not vary between agents.

---

## The four pillars

Each pillar is a real, published BrandGEO research page. Every asset you write
belongs to exactly one pillar and must be traceable to it. Read the source page
before writing about it. Do not work from the title.

| # | Pillar | Source | Angle |
|---|---|---|---|
| P1 | Two engines shipped, two turned down | `brandgeo/web/bg-021-retrieval-not-engine-count.html` | Contrarian. Engine count is a vanity metric; retrieval is what matters |
| P2 | Cross-engine consensus | `brandgeo/web/bg-016.html` plus the 27 city pages | Curiosity gap. When do independently queried engines agree |

> **CORRECTION, 2026-07-29 22:15.** An earlier version of this brief said "37
> city pages". That was wrong and is fixed above. `ai-visibility-for-*.html`
> returns 37 files, but 10 of them are INDUSTRY pages (`ai-visibility-for-saas`,
> `-for-law-firms`, and so on) and 27 are CITY pages (`ai-visibility-in-london`,
> `-in-boston`). One glob, two page types. Verified by reading every `<title>`.
> **Use 27 for cities and 10 for industries. If you already wrote 37, fix it.**
>
> Related, found by the blog agent and worth knowing before you cite BG-016:
> its key-findings panel says "four cities" while its body names six. Cite the
> page's own figure verbatim and name cities individually rather than asserting
> a count, so nothing inherits the inconsistency.
| P3 | Measurement integrity | `brandgeo/web/bg-018.html` and `bg-019.html` | Trust. We publish our own false positives and return null over a rank we cannot prove |
| P4 | Peer-archived research | `brandgeo/web/bg-017.html`, Zenodo 10.5281/zenodo.21395598 | Authority. 222 production API responses, 56 prompts, 7 cities, 4 engines |

P1 already has a full channel package at
`docs/growth/2026-07-29-grok-sixth-engine/`. **Read it before writing your P1
asset and write something different.** Same pillar, new angle. Do not restate it.

---

## Ground truth, read from `planConfig.ts` on 2026-07-29

Never quote a price or engine list from `docs/`, from `CLAUDE.md`, or from a
live page. All three have been wrong. These are the enforced values.

**Plans.** Free EUR 0, Essentials EUR 99, Growth EUR 299, Growth PRO EUR 449,
Managed from EUR 1,500, Enterprise custom and unpublished.

**Prompts per plan.** free 5, essentials 15, growth 35, growth_pro 35,
managed 120, enterprise effectively uncapped. Growth and Growth PRO carry the
same prompt count; the ladder differentiates on ENGINES, not prompts.

**Engines.** free: ChatGPT. essentials: + Gemini, Claude. growth: + Perplexity,
Google AI Mode (5). growth_pro and managed: + Grok, Google AI Overviews (7).
Copilot and DeepSeek are NOT live on any purchasable plan.

**Meta AI is retired.** Never list it as a live engine. The only legitimate
mention is a historical record of what it answered on a stated date.

**Refresh cadence is not a tier differentiator.** Every paid plan is weekly,
free is monthly. Do not sell "daily refresh" at any price.

---

## The numbers you may and may not use

`ai_results` as of 2026-07-29, status = ok, across ALL clients:

| engine | rows | mentions | first | last |
|---|---|---|---|---|
| claude | 235 | 12 | 2026-07-07 | 2026-07-29 |
| gemini | 202 | 7 | 2026-07-10 | 2026-07-29 |
| perplexity | 199 | 6 | 2026-07-09 | 2026-07-29 |
| chatgpt | 169 | 12 | 2026-07-08 | 2026-07-29 |
| google_ai | 125 | 7 | 2026-07-16 | 2026-07-25 |
| ai_overview | 6 | 2 | 2026-07-29 | 2026-07-29 |
| grok | 5 | 5 | 2026-07-29 | 2026-07-29 |

**Three hard prohibitions.**

1. **Do not publish a Grok or AI Overviews rate.** Grok is 5 rows from a single
   day and every one is a mention. "Grok mentions us 100% of the time" is
   arithmetically true and analytically worthless, and publishing it from a
   company that sells measurement would be self-refuting. You may say the
   engines are live and collecting. You may not attach a percentage.
2. **These rows are ALL clients, not BrandGEO.** They are not "our visibility"
   and not any one brand's. Never attribute them to a named brand.
3. **A single collection day is not a trend.** No client has more than one
   distinct collection day for the new engines. Do not write "up from" or
   "improving" about anything.

Where a pillar's source page already reports a measured figure, cite that page's
figure and link the page. That is the safe path and it is almost always better
copy anyway.

---

## Voice

Calibrate against what has actually been published, not against a generic idea
of a LinkedIn post. Read at least two of these before writing:

- `docs/linkedin-posts-2026-07-24.md`
- `docs/linkedin-post-bg-018-2026-07-22.md`
- `docs/linkedin-teaser-posts-published-paper-2026-07-16.md`
- `docs/linkedin-company-posts-2026-07-15.md`

**The no-AI-tells rule is the highest-priority rule in this campaign.** No em
dashes. No en dashes. A comma or a full stop instead. Banned words, non
exhaustive: delve, unlock, unleash, elevate, harness, leverage as a verb,
game-changer, supercharge, revolutionize, seamless, robust, cutting-edge,
transformative, dive in. No rhetorical-question openers. No emoji-bulleted lists
where each line is a symbol plus a bolded two-word phrase.

Reader is a founder, head of growth, or SEO lead. Do not explain what an LLM is.

**Reject any hook that survives a find-and-replace of the brand name.** If a
competitor could publish it unchanged, it is not specific enough.

---

## Funnel discipline

Never put a pricing CTA on a TOFU asset. Never end a BOFU asset without one.
TOFU CTA is soft, usually "check your own domain". MOFU CTA is the free audit on
getbrandgeo.com. BOFU CTA names a plan or the audit-to-signup path.

---

## Output rules

- Write ONLY into `docs/growth/2026-07-29-four-pillar-distribution/`. Do not
  touch `brandgeo/web/` or `brandgeo-dashboard/`. Shipping is `bg-web`'s scope.
- One file per channel, named in your own task brief. Inside it, four clearly
  separated posts, each headed with its pillar (P1 to P4), funnel stage, and
  hook driver from SKILL.md section 3.
- Every visual gets a structured block in the SKILL.md 5.2 format, numbered to
  the asset it serves. A loose sentence is not a visual brief.
- Vertical video scripts are a three-column table: TIME, ON SCREEN, SPOKEN. A
  script without on-screen direction is incomplete and will be sent back.
- Mark anything you could not source `[UNVERIFIED]` in place. Do not quietly
  drop a claim and do not quietly invent a substitute.

**Nothing here gets posted.** This run produces drafts for review. Do not call a
posting API, do not schedule a send, do not treat any prior approval as covering
publication.
