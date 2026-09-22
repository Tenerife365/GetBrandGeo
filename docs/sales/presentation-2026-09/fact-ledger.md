# Fact ledger, BrandGEO sales presentation, 2026-09

Stage 0 output for `.claude/handoffs/027-bg-orchestrator-to-deck-session-brandgeo-sales-presentation.md`.
Read only pass. Every claim below is tagged with an ID (F01, F02, ...) and the
exact file path or live URL it came from, so later stages can cite it and the
skeptic pass can check it. Grouped by section, per the task brief.

Two names are deliberately withheld from this file, per the task rules: the
anonymised hero client shown in the homepage instrument card (never named,
never its domain), and any real person's name beyond the contact email.

---

## 0. How to read "committed" versus "working tree"

`brandgeo-dashboard/src/lib/planConfig.ts` is the single source of truth for
entitlements, but the working tree has one uncommitted change to it. Everything
in section 1 below is the HEAD (committed, deployed) state, read with
`git show HEAD:brandgeo-dashboard/src/lib/planConfig.ts`. The one difference
between HEAD and the working tree is isolated in section 1.9, "Uncommitted
differences." The deck must use HEAD only.

---

## 1. Plan ladder and entitlements (planConfig.ts, HEAD, committed)

### 1.1 The plan order

**F01.** Plan identifiers, in ladder order: `free`, `radar`, `essentials`,
`growth`, `growth_pro`, `managed`, `pro`, `enterprise`. `pro` is legacy, kept
only so existing clients do not fall back until they migrate; no new signups
use it. Source: `brandgeo-dashboard/src/lib/planConfig.ts:46`, `PLAN_ORDER` at
line 398.

**F02.** Display labels: Free, Radar, Essentials, Growth, Growth PRO, Managed,
Pro, Enterprise. Source: `planConfig.ts:400-409`, `PLAN_LABELS`.

**Note: prices are not in this file.** `planConfig.ts` carries entitlements
only. Prices come from the live homepage, see section 2.

### 1.2 Engines per plan

**F03.** `PLAN_ENGINES`, `planConfig.ts:68-101`:

| Plan | Engines |
|---|---|
| free | gemini |
| radar | gemini, claude |
| essentials | chatgpt, gemini, claude |
| growth | chatgpt, gemini, claude, perplexity, google_ai |
| growth_pro | chatgpt, gemini, claude, perplexity, google_ai, grok, ai_overview |
| managed | chatgpt, gemini, claude, perplexity, google_ai, grok, ai_overview |
| pro | chatgpt, gemini, claude, perplexity, google_ai, grok, ai_overview, copilot, deepseek |
| enterprise | chatgpt, gemini, claude, perplexity, google_ai, grok, ai_overview, copilot, deepseek |

**F04. Engine display names, exactly as the product names them**, from
`ENGINE_META`, `planConfig.ts:268-291`: ChatGPT, Gemini, Claude, Perplexity,
Google AI Mode, Google AI Overviews, Grok, Copilot. (Meta AI also has a row,
see F05, it must never be used as a current claim.)

**F05. Meta AI is retired. Never name it as a monitored engine.**
`planConfig.ts:59-62` and `:106-124`: Google AI Mode replaced Meta AI as the
5th live engine on 2026-07-16. `meta` is in `COMING_SOON_ENGINES` and in the
separate `RETIRED_ENGINES` set (`:117`, `:124`) specifically so it renders
neither as "coming soon" nor as "unlock on X plan": no plan sells it and no
worker collects it. It is kept in `ENGINE_META` only so historical rows still
render. The deck must not list Meta AI among current or comparison engines.

**F06. The deck's five headline engines, per the task brief, are exactly the
five `LIVE` and commercially load-bearing ones through Growth: ChatGPT,
Gemini, Claude, Perplexity, Google AI Mode.** Grok and Google AI Overviews are
real but gated at Growth PRO and up (F03); Copilot and DeepSeek are
`COMING_SOON_ENGINES` (`planConfig.ts:117`) and must be described as not yet
built, never as monitored today.

**F07. Minimum plan that includes each engine**, `ENGINE_UNLOCK_PLAN`,
`planConfig.ts:233-244`: gemini from Free, claude from Radar, chatgpt from
Essentials, perplexity from Growth, google_ai from Growth, grok from Growth
PRO, ai_overview from Growth PRO, copilot from Pro, deepseek from Pro.

### 1.3 Prompt counts per plan

**F08.** `PLAN_PROMPTS`, `planConfig.ts:548-551`: free 5, radar 7, essentials
18, growth 35, growth_pro 56, managed 200, pro 200, enterprise 100000
(explicitly a sentinel, not a real cap; the real ceiling is the monthly euro
budget, see the comment at `:531-533`). Ruled 2026-07-31 by Constantin in
`docs/strategy/sprint-ladder-ruling.md` decision 2.

### 1.4 Refresh cadence

**F09.** `PLAN_REFRESH_CADENCE`, `planConfig.ts:625-634`: free is monthly,
every paid plan (radar through enterprise) is weekly.

**F10.** `PLAN_COLLECTION_COOLDOWN_HOURS`, `planConfig.ts:567-570`: free 720
hours (monthly), every paid plan 168 hours (weekly), enterprise 0 (no
cooldown).

### 1.5 AI SEO entitlement (site audit)

**F11.** `FEATURE_MIN_PLAN.ai_seo = 'radar'`, `planConfig.ts:451`. Site audit
page caps, `PLAN_SEO_PAGE_CAP`, `planConfig.ts:697-700`: free 0, radar 1,
essentials 1, growth 10, growth_pro 30, managed 100, pro 100, enterprise 500.
Radar and Essentials get the single landing page only, by ruling
("I want Radar to have the one page crawl, but only one page, the landing
page, no other page," quoted in the comment at `planConfig.ts:676-679`).

**F12.** Audits per week, `PLAN_SEO_AUDITS_PER_WEEK`, `planConfig.ts:707-710`:
free 0, radar 1, essentials 1, growth 1, growth_pro 1, managed 3, pro 3,
enterprise 7. Drafts per month, `PLAN_SEO_DRAFTS_PER_MONTH`,
`planConfig.ts:713-716`: free 0, radar 0, essentials 0, growth 10, growth_pro
30, managed 60, pro 60, enterprise 200.

### 1.6 AI Social: not sellable today

**F13. AI Social is admin only. No plan grants it, at any price.**
`ADMIN_ONLY_FEATURES` holds `ai_social`, `planConfig.ts:433`, and `hasFeature()`
(`:821-824`) short circuits on that set before reading the plan ladder. The
`growth: 1 / growth_pro: 3` channel numbers in `PLAN_SOCIAL_CHANNEL_LIMIT`
(`:719-722`) are therefore unreachable by any customer today. The deck must
describe AI Social as "coming soon," never as a purchasable feature, and never
show a channel count as something a plan currently includes.

### 1.7 MCP access: NOT AVAILABLE TODAY, do not claim

**F14. MCP (Model Context Protocol) access does not exist in the committed
(HEAD) codebase at all.** `git show HEAD:brandgeo-dashboard/src/lib/planConfig.ts`
has no `mcp_access` feature, no `FeatureId` entry for it, nothing. It exists
only as an uncommitted, in progress change in the working tree (see section
1.9). Whatever the eventual gate, this is unshipped. The deck must not mention
MCP access, remote MCP, or "connect Claude Code / Cursor to your data" in any
form.

### 1.8 Research studies excluded from cadence

**F15.** `RESEARCH_CATEGORY = 'research'` clients never get an automatic
refresh cadence, on any plan (`planConfig.ts:592-599`, `:641-673`). Per the
comment at `:646-654`, 27 of the platform's client rows are BrandGEO's own
city research studies, all on plan `pro`, deliberately excluded from
auto-refresh so they do not silently switch on roughly EUR 6,075 a month of
budget ceiling. This is an internal delivery detail, not a customer claim, but
it corroborates the 27 city studies count in section 5.

### 1.9 Uncommitted differences (working tree vs HEAD)

**F16. Working tree only, not deployed, not a source for the deck.**
`git diff -- brandgeo-dashboard/src/lib/planConfig.ts` shows one change: a new
`FeatureId` value `mcp_access` is added, gated at `radar` in
`FEATURE_MIN_PLAN` (`mcp_access: 'radar'`), with a blurb in `FEATURE_META`
calling it "Connect your own AI tools, such as Claude Code and Cursor, to read
your BrandGEO visibility data over MCP," explicitly marked in the file's own
comment as "Placeholder wording only, not customer-approved copy." The
in-file comment also cites `docs/arch/mcp-access.md` ruling 1 and a quoted
Constantin decision, "mcp connection incepand cu radar, da" (Romanian, "MCP
connection starting with Radar, yes"). This confirms MCP access is planned for
Radar and up once shipped, but it is not shipped, not committed, and the copy
is explicitly not approved. Do not use in the deck under any circumstance
(see F14).

---

## 2. Homepage as published (brandgeo/web/index.html, live)

### 2.1 Pricing cards, exactly as shipped

Source: `brandgeo/web/index.html:1965-2153`, self-serve grid `#grid-self`
(`:1991`) and done-for-you grid `#grid-managed` (`:2108`), plus the JSON-LD
Offers block at `index.html:96-103`.

**F17.** BrandGEO Free: EUR 0 (`:1997`). No credit card. "1 project, 5 buyer
prompts, Gemini visibility, Monthly refresh + dashboard" (`:2006-2008`).
Button: "Start Free" to `https://app.getbrandgeo.com/signup` (`:2002`).

**F18. BrandGEO Radar, launch price, labelled as a launch price on the
card.** Card eyebrow reads "Launch price" (`:2013`). Price EUR 29 per month
(`:2016`), with a savings tag reading "List EUR 39/mo after launch"
(`:2017`), and the sub line "For our first 100 customers. Monthly billing
only." (`:2020`). "Everything in Free, plus: 1 project, 7 buyer prompts,
Gemini & Claude, Weekly refresh + dashboard" (`:2026-2028`). Button:
"Subscribe" (`:2022`), plus a link "Read the launch announcement" to
`/news/radar-plan-launch/` (`:2030`).

**F19.** BrandGEO Essentials: EUR 99 per month, EUR 990 per year (`:2037-2038`,
saves EUR 198, `:2039`). "Software only, no setup fee." "Everything in Radar,
plus: 18 commercial prompts, ChatGPT, Gemini & Claude, Weekly refresh +
competitor tracking" (`:2047-2051`).

**F20.** BrandGEO Growth, flagged "Most Popular" (`:2061`), the section's only
solid CTA (per CLAUDE.md 2026-08-07 entry, section 8 below): EUR 299 per
month, EUR 2,990 per year (`:2064-2065`, saves EUR 598, `:2066`). "5 engines,
incl. Google AI Mode." "Everything in Essentials, plus: 35 commercial
prompts, 5 AI engines (+ Perplexity & Google AI Mode), Weekly refresh (every
plan, same cadence), Site audit, 10 pages, unlocks here" (`:2074-2079`).

**F21.** BrandGEO Growth PRO, flagged "Power tier" (`:2083`): EUR 449 per
month, EUR 4,490 per year (`:2086-2087`, saves EUR 898, `:2088`). "7 engines,
deeper site audit." "Everything in Growth, plus: 7 AI engines (+ Grok and
Google AI Overviews), 56 commercial prompts, Weekly refresh, priority queue,
Site audit: 30 pages (3x Growth), AI Social, coming soon" (`:2097-2102`). The
card itself labels AI Social "coming soon," consistent with F13.

**F22.** BrandGEO Managed (done for you grid, hidden behind a mode switch by
default, `:2108`, flagged "Most Popular"): EUR 1,500 per month, EUR 15,000 per
year (`:2114-2115`, saves EUR 3,000, `:2116`). "Done for you, we run your AI
visibility." "Everything in Growth PRO, plus: AI visibility strategy + prompt
research, Competitor + website AI audit, Monthly executive report + strategy
call, Priority support, all channels managed" (`:2125-2129`). Button: "Book
Consultation" to `#contact`.

**F23.** Custom Enterprise: "Let's talk" (`:2137`). "Tailored to your
organisation, custom scope." "Everything in Managed, plus: Multiple brands &
markets, More engines: Copilot and DeepSeek (coming soon), White-label +
dedicated support, Custom integrations & SLAs" (`:2146-2150`). Button:
"Contact Sales" to `#contact`.

**F24.** Billing toggle offers "Save 17%" for yearly (`:1985`). The mode
switch defaults to "Run it yourself from EUR 0" (self-serve, visible) versus
"Done for you from EUR 1,500" (hidden until clicked) (`:1975-1976`).

**F25.** Trust strip under the pricing grids: "Published methodology (DOI),
No credit card to start, Cancel anytime, Free audit first" (`:2155-2160`).

**F26. Engine per euro comparison, the one competitor citation on the
pricing section:** BrandGEO Essentials, EUR 99/mo, 3 engines, versus Profound
entry, USD 99/mo, 1 engine (ChatGPT only), sourced to "Profound's public
pricing page re-verified first-party on 2026-08-07" (`index.html:2163-2172`).
This is the only competitor comparison shipped on the pricing section; it is
not the strongest available comparison (see F44, Peec and Otterly beat
BrandGEO on price per engine at the tiers a buyer actually compares).

### 2.2 Engine strip (matches planConfig.ts exactly, verified)

**F27.** `index.html:1813-1866`, section id `engines`: "Seven engines, measured
the same way." Tiles, each marked "Live" with an availability line: Gemini
"from Free," Claude "from Radar," ChatGPT "from Essentials," Perplexity "from
Growth," Google AI Mode "from Growth," Grok "from Growth PRO," Google AI
Overviews "from Growth PRO" (`:1819-1860`). This matches `ENGINE_UNLOCK_PLAN`
in planConfig.ts (F07) exactly, so this part of the live page and the
committed entitlements file agree with no drift, as of this read. A footnote
under the tiles reads: "Roadmap: decentralized engines (Bittensor, Mind
Network) are in research and not yet measured" (`:1864`), confirming these are
explicitly not claimed as live.

### 2.3 Hero instrument card (the anonymised hero client)

**F28.** `index.html:1572-1696`, `id="previewCard"`. Labelled "Client
measurement" with the window "2026-07-21 to 2026-08-07" (`:1581-1582`). Run
line: "7 engines, 65 answers" (`:1584`). Score: 46 of 65 answers, mention rate
70.8 percent, "best position #1" (`:1599-1606`). Per-engine split
(`:1614-1657`): ChatGPT 78.6 percent, Gemini 100.0 percent, Claude 63.2
percent, Perplexity 77.8 percent, Google AI Mode 100.0 percent, Google AI
Overviews 33.3 percent, Grok 40.0 percent. Caption: "Real collection data from
a BrandGEO client. Client anonymized." (`:1664`). **The deck may use these
numbers but must never name the client or show its domain, per the
2026-08-07 ruling (section 8).** Refer to it only as "the anonymised hero
client."

### 2.4 Research proof band

**F29.** `index.html:1699-1725`, section id `proof`. Chips: "Citable
methodology, DOI" linking to `https://doi.org/10.5281/zenodo.21395598`
(`:1711`), "AI Visibility Index, Issue 1" to `/ai-visibility-index-2026-07.html`
(`:1712`), "Pre-registered protocol, DOI" to `/bg-105.html` (`:1713`), "34
research articles" to `/blog.html` (`:1714`), "27 cities measured" to
`/blog.html` (`:1715`), "Research led by Constantin Daniel, ORCID" to
`https://orcid.org/0009-0008-4924-1987` (`:1716`).

**F30. Discrepancy to flag:** the live chip text says "34 research articles"
(`:1714`), but the actual article count on disk is 105 (BG-001 through
BG-105, see section 5.1). The chip is stale. The deck should use the verified
count of 105, not the homepage's own "34" chip, and this stale chip is worth
naming as a fix item for whoever owns the homepage next, separate from the
deck itself.

### 2.5 Colour tokens (`:root`, both themes)

**F31. Dark theme (default `:root`), `index.html:174-211`:**

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0a0b0e` | page background |
| `--s` | `#101116` | surface |
| `--s2` | `#16171e` | surface, secondary |
| `--bd` | `#23242b` | border |
| `--bd2` | `#32333c` | border, secondary |
| `--ac` | `#8b5cf6` | accent (brand violet) |
| `--ac-text` | `#a78bfa` | accent, text usage |
| `--ac-strong` | `#7c3aed` | accent, strong |
| `--ac2` | `#34d399` | accent 2 (green) |
| `--warn` | `#fbbf24` | warning (amber) |
| `--ok` | `#34d399` | positive status |
| `--part` | `#fb923c` | partial status (orange) |
| `--bad` | `#f87171` | negative status (red) |
| `--info` | `#c4b5fd` | info (light violet) |
| `--t` | `#e8e9ed` | primary text |
| `--t2` | `#9ba1ac` | secondary text |
| `--t3` | `#7d838f` | tertiary text |

**F32. Light theme, `[data-theme="light"]`, `index.html:212-233`:**

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#f7f7fc` | page background |
| `--s` | `#ffffff` | surface |
| `--s2` | `#f4f4fb` | surface, secondary |
| `--bd` | `#e2e2ea` | border |
| `--bd2` | `#cfcfda` | border, secondary |
| `--ac` | `#7c3aed` | accent (brand violet) |
| `--ac-text` | `#6d28d9` | accent, text usage |
| `--ac-strong` | `#6d28d9` | accent, strong |
| `--ac2` | `#047857` | accent 2 (green) |
| `--warn` | `#b45309` | warning (amber) |
| `--ok` | `#047857` | positive status |
| `--part` | `#b45309` | partial status |
| `--bad` | `#b91c1c` | negative status |
| `--info` | `#6d28d9` | info |
| `--t` | `#09090f` | primary text |
| `--t2` | `#55555e` | secondary text |
| `--t3` | `#6b6b75` | tertiary text |

**F33.** The brand violet on the deck should be `#8b5cf6` (`--ac`, dark theme)
or `#7c3aed` (`--ac-strong` dark, also `--ac` light theme). Both appear as the
gradient stops on the hero mark and CTAs: `linear-gradient(135deg, var(--ac),
#6366f1)` (`index.html:300`).

### 2.6 Fonts

**F34.** Google Fonts link: `Inter:wght@400;500;600`, `Instrument+Serif`,
`JetBrains+Mono:wght@400;500` (`index.html:115`). Body font family: `'Inter',
'Inter Fallback', system-ui, sans-serif` (`:241`). Display/serif accents use
`--serif: 'Instrument Serif', 'Instrument Serif Fallback Georgia',
'Instrument Serif Fallback Times', Georgia, 'Times New Roman', serif`
(`:209`). Mono (stamps, data labels) uses `--mono: 'JetBrains Mono',
'JetBrains Mono Fallback', ui-monospace, Consolas, monospace` (`:210`). Local
`@font-face` fallbacks with `size-adjust` / `ascent-override` /
`descent-override` are defined for all three so layout does not shift before
the web fonts load (`:133-168`).

**F35.** Type scale is exactly six sizes, enforced by comment
(`index.html:201-208`): `--d1: 56px` (36px under 640px), `--d2: 32px` (26px
under 640px), `--l: 18px` (17px under 640px), `--b: 15px`, `--da: 14px`,
`--m: 12px`.

### 2.7 Testimonials block

**F36.** No HTML-commented-out testimonials block exists in the current live
`index.html` as read on this pass (checked for `<!--...testimonial...-->`
patterns and for a `testimonials` section id; none found). This differs from
an earlier CLAUDE.md description of a "testimonials (present but commented
out with placeholder quotes)" section, which describes a pre-2026-08-07
version of the page (see `docs/strategy/hook-thesis-web.md` section 0, dated
2026-07-26, itself citing `index.html:1587-1613` of that earlier build). The
current page (rebuilt 2026-08-07, see section 8) appears to have removed that
block entirely rather than leaving it commented out. Net effect for the deck
is the same either way: **no real testimonial exists anywhere in this repo
and the deck must not invent or imply one**, consistent with
`docs/strategy/positioning-pricing-audit-2026-08-13.md`'s "What we will not
claim" list (section 6 below, F47).

### 2.8 Banned homepage stats

**F37. BANNED FROM THE DECK: the two uncited hero statistics, "73 percent"
and "4.2x."** Both are explicitly flagged as uncited across multiple internal
docs: `docs/research/competitive-and-conversion-2026-07-28.md:197` ("The two
uncited hero stats (73%, 4.2x) still need a source or removal"),
`docs/growth/SPRINT-100-KICKOFFS-2026-07-31.md:298`, and
`docs/strategy/pricing-and-1000-customer-feasibility-2026-07-29.md:1006`
("Do not quote the 73% or 4.2x hero stats. Still uncited, still open.").
**Verified on this pass: neither "73%" nor "4.2x" appears anywhere in the
current `brandgeo/web/index.html`.** They were removed from the live page at
some point (`docs/audit/homepage-live-2026-07-29.md:495` records "Zero
occurrences of 73% or 4.2x in 137,152 bytes of live HTML. They are gone.").
The ban stands regardless: never source a "73 percent" or "4.2x" claim from
memory or from any competitor's unrelated 73 percent statistic that happens to
appear in the research library (several BG-articles use "73%" in an unrelated,
fully sourced context, for example Reddit citation growth in BG-011 and
Seer Interactive freshness data in BG-035/BG-038/BG-069; those are real,
sourced, and unrelated to the banned homepage pair, but should not be
confused with it).

---

## 3. CLAUDE.md: the 2026-07-28 open decisions and the 2026-08-07 ruling

**F38. The 2026-07-28 open decisions**, from
`docs/research/competitive-and-conversion-2026-07-28.md` section 5, "What
shipped, and what did not": five items were not shipped as of that date and
each needed a decision. In order: (1) the Profound price/engine comparison
block, (2) mono type for data labels, (3) the two uncited hero stats, 73
percent and 4.2x, still needing a source or removal, (4) no real named
customer testimonial exists, every competitor surveyed has one and BrandGEO
did not, (5) Otterly's pricing needed a first-party re-check before public
use. Per `docs/strategy/positioning-pricing-audit-2026-08-13.md` F14, item 1
(the Profound comparison block) has since shipped (matches F26 above).

**F39. The 2026-08-07 ruling on the anonymised hero client**, from
`CLAUDE.md`, the "2026-08-07: the homepage IS the Live Instrument page now"
entry: "The hero prints REAL client data (anonymized, per Constantin's
ruling): 70.8% mention rate, 46/65 answers, window 2026-07-21 to 2026-08-07,
per-engine rates pulled from `ai_results` by the orchestrator and recomputed
at build... **NEVER relabel it as sample, never name the client, never show
the client domain.**" This matches the numbers on the live page exactly (F28).
The deck must follow the same rule: real numbers, anonymised client, no name,
no domain.

**F40.** The same CLAUDE.md entry records that the product-stage real
workspace showcase is deliberately deferred until there is enough traction for
SaaS-grade data, and that anonymised competitors will only be shown once that
exists. The deck should not imply a live competitor-tracking demo exists
beyond the single hero instrument card.

---

## 4. Positioning and pricing strategy

### 4.1 `docs/strategy/hook-thesis-web.md` (dated 2026-07-26, positioning
framing is current; entitlement specifics in it are stale, see note below)

**F41. The three-second comprehension target** (section 1): after three
seconds above the fold, a first-time visitor must be able to say back: "
BrandGEO tells me whether AI assistants recommend my brand when customers ask
them, and I can check mine right now." This is the comprehension bar the deck's
opening slides should hit too.

**F42. The leading pillar rule** (section 2): AI Visibility leads; Brand
Sentiment, AI SEO and AI Social are subordinate and must not appear as peers
above the fold. Reason given: AI Visibility is the only one of the four a
visitor can experience before paying, so it is the only one able to carry an
immediate three-second promise. Order of subordination: Sentiment, then AI
SEO, then AI Social, "Am I there?" then "is it good?" then "what do I fix?"
then "how does it get published?"

**F43. Anti-positioning list, what this thesis will not claim** (section 8):
"Five AI engines" stated without qualification is flagged as false while Meta
AI was still named on the page (corroborates F05); "Results in 48 hours"
alongside an instant audit is flagged as two incompatible promises to the same
visitor; any refresh cadence stated as fully automatic was flagged as
unverified at the time of that document; customer counts, logos or
testimonials are flagged as having nothing traceable in the read allowlist;
any claim that depends on scaled content or gaming citation is explicitly
out of bounds, referencing `rules/content-integrity.md`.

**Note on staleness:** this document is dated 2026-07-26, before the
2026-07-31 Radar tier was added and before Free moved from ChatGPT to Gemini.
Its entitlement specifics (for example, describing Free as running ChatGPT)
are superseded by planConfig.ts HEAD (section 1). Its positioning rulings
(leading pillar, three-second target, anti-positioning list) are not
entitlement-dependent and remain the load-bearing strategy framing.

### 4.2 `docs/strategy/positioning-pricing-audit-2026-08-13.md`

**F44. Competitive collisions on price** (finding F5, F6 in that document):
Radar at EUR 29 collides with Otterly Lite at $29 and loses on every published
axis at the time of the audit: 7 prompts against Otterly's 15, 2 engines
against 4, no ChatGPT against ChatGPT included, weekly against daily.
Essentials at EUR 99 is dominated by Peec Starter at EUR 85: 18 prompts
against 50, fixed engines against 3 of the buyer's choice, weekly against
daily. The homepage's only price comparison (F26) omits both Peec and Otterly
and picks Profound, the one vendor BrandGEO beats on that axis. **The deck
should not claim "cheapest" or "most engines per euro" as a general claim**;
per that document's "What we will not claim" list, it is true against
Profound and false against Peec at the tier a buyer would actually compare.

**F45.** Zero customers have been acquired self-serve as of that audit's SQL
read (2026-08-13): of 38 client rows, 27 are BrandGEO's own research studies
(corroborates F15); of the 11 non-research rows, exactly 1 carries a Stripe
customer id, with 0 prompts and 0 results. The one substantial commercial
relationship is a hand-sold package. This is an internal fact for planning,
not a deck claim: **the deck must not state any self-serve customer count.**

**F46. No ICP is named anywhere in visible copy** as of that audit, and
`get-found-online.html`, the page written for the ruled primary buyer, was
linked zero times from the homepage at that time.

**F47. What that audit rules out for any customer-facing material:** no
customer counts, no "used by N brands," no logos (11 non-research client rows,
zero self-serve subscriptions); no "cheapest AI visibility tool" claim; no
"most engines per euro" as a general claim; no engine-count superlative
(AthenaHQ publishes nine engines); no "monitor everything in one place" claim
while AI Social remains admin only; no trial language (no trial mechanism
exists in the code); no urgency built on a deadline that does not exist (the
Radar launch price is explicitly not time-limited).

### 4.3 `docs/strategy/sprint-ladder-ruling.md` (2026-07-31, signed by
Constantin, S1)

**F48. Decision 1, Radar added:** EUR 39 list price, EUR 29 launch price for
the first 100 customers, engines amended by Constantin from ChatGPT+Gemini to
**Gemini and Claude** on cost grounds, 7 prompts, weekly refresh, 1 website.
This matches planConfig.ts HEAD exactly (F03, F08, F09, F18).

**F49. Decision 2, the authoritative prompt ladder is 5, 7, 18, 35, 56, 200,
200, sentinel.** This matches `PLAN_PROMPTS` in planConfig.ts HEAD exactly
(F08). The ruling explicitly states two prior ladders were wrong: the shipped
one (at the time) inverted twice, and a previously documented "5, 20, 50, 75,
250" ladder was costed against stale, lower per-check prices and would have
breached the 15 percent cost ceiling by EUR 5.63 on Growth PRO and EUR 18.25
on Managed had it been adopted.

**F50. Decision 4, carried forward from an earlier ruling (`67a3cf4`):** a
package sells a tier, not a raw prompt count. Relevant for how the deck should
describe plans: outcome and tier language, not a shopping list of numbers
alone.

---

## 5. Audit score presentation and reader mental model

Source: `docs/copy/audit-score-presentation-2026-08-14.md`.

**F51. The reader's mental model, quoted directly** (section 1): "their
working mental model of 'AI visibility' is 'I searched my own name and I was
there.' They are not wrong. They are answering a different question than the
one this page asked." This is the exact objection the deck's opening framing
must defuse, per the orchestrator handoff (section 3 of that handoff quotes
the same line).

**F52. The shared "pre-empt" copy block** (section 2.4), the single
highest-impact string in that deck brief, meant to land before the visitor
forms the objection: "Search your own name and you already show up. That's
not what we tested here. We asked {engine_count} AI engines the kind of
question a buyer types before they've ever heard of you, not your name, and
checked who got named back." This is reusable framing for the sales deck's
own objection-handling slide.

**F53. Honest score framing** (section 3): the document recommends keeping
the term "AI Visibility Score" but permanently qualifying it as "(screening
sample)," because the reachable score range below 33 is empty on a 4-question,
2-engine screening sample, so a bare 0 to 100 number implies more precision
than an 8-cell sample supports. Recommendation: lead with the fraction
("{engines_named} of {engine_count} engines named you, across {N} buyer
questions"), and treat the /100 score as a secondary summary, not the primary
claim. The deck should follow the same discipline: lead with fractions and
named engines, not a bare score out of 100, if it shows the audit score at
all.

**F54. Objection handling built into that copy brief** (sections 2 and 4):
the fraction and the per-engine plain-language states ("names you," "names
you sometimes," "did not name you," "could not be reached") are the model for
how to state coverage honestly, including that "could not be reached" is
attributed to BrandGEO's own collection, never counted against the brand's
score.

---

## 6. Research library: counts, DOIs, and industry page findings

### 6.1 Counts, verified by direct enumeration on this pass

**F55. Research articles: 105 files, `bg-001.html` through `bg-105.html`.**
Verified by `ls brandgeo/web/bg-*.html | wc -l` = 105, and the first and last
files sorted numerically are `bg-001.html` and `bg-105.html`. This is the
correct count to use in the deck; the homepage's own "34 research articles"
chip is stale (F30).

**F56. City study pages: 27.** Verified by enumerating
`ai-visibility-for-*.html` (37 files total) and subtracting the 10 industry
pages (F57): 37 minus 10 = 27. Cities covered: Atlanta, Baltimore, Berlin,
Boston, Charlotte, Chicago, Dallas, Denver, Detroit, Dublin, Houston, London,
Los Angeles, Madrid, Miami, Minneapolis, New York, Paris, Philadelphia,
Phoenix, Rome, San Antonio, San Diego, San Francisco, Seattle, Tampa,
Washington DC. Six of the 27 are European (Berlin, Dublin, London, Madrid,
Paris, Rome), which is why the homepage chip says "cities" rather than "US
cities" (matches the comment at `index.html:1699-1704`).

**F57. Industry pages: 10.** The 10 non-city `ai-visibility-for-*.html`
files: e-commerce, education, financial services, healthcare, home services,
hotels, law firms, real estate, restaurants, SaaS. Full list with URLs and
headline findings in section 6.3.

**F58. Comparison pages: 10.** `brandgeo-vs-*.html`, verified by directory
listing: brandgeo-vs-ahrefs-brand-radar, brandgeo-vs-athenahq,
brandgeo-vs-conductor, brandgeo-vs-goodie, brandgeo-vs-otterly,
brandgeo-vs-peec, brandgeo-vs-profound, brandgeo-vs-rankscale,
brandgeo-vs-scrunch, brandgeo-vs-semrush.

### 6.2 Zenodo DOIs and ORCID

**F59. DOI 10.5281/zenodo.22279050: the pre-registered protocol, not yet
carrying results.** Title (from `brandgeo/web/bg-105.html`): "The Brand Fact
Error Rate: Study Protocol, First Edition," Constantin Daniel, 2026, Zenodo,
CC BY 4.0. Published 2026-09-03 per that page's structured data. The record
"contains the protocol only. It contains no results, and it says so"
(`bg-105.html:296`). It measures whether AI engines state true things about a
brand, checked against the brand's own published pages as ground truth, not
whether the brand is merely mentioned. Data collection is described as
running afterward, with results to be published as a second, linked Zenodo
record. This is the correct DOI to cite for "pre-registered methodology."

**F60. DOI 10.5281/zenodo.21395598: the completed empirical paper.** Title
(from `brandgeo/web/bg-017.html`): "Cross-Engine Consensus in AI-Generated
Brand Recommendations: An Empirical Study Across Seven Cities and Five Large
Language Models," Constantin Daniel, 2026, Zenodo, CC BY 4.0, published via a
CERN-run open-access repository. This is the DOI shown on the homepage's
"Citable methodology" chip (F29) and is the correct citation for "published,
peer-citable research," as distinct from F59's still-open protocol.

**F61. ORCID 0009-0008-4924-1987: Constantin Daniel**, the author identifier
attached to both Zenodo records and cited on the homepage proof band (F29)
and on `bg-017.html` and `bg-105.html`. Safe to use as "Research led by
Constantin Daniel, ORCID [id]," matching the homepage's own phrasing exactly.

### 6.3 Industry pages: name, URL, and 2 to 3 headline findings each

All findings quoted with their exact figure and stated basis, from each live
page's own stats block.

**F62. E-commerce.** `https://getbrandgeo.com/ai-visibility-for-ecommerce.html`.
"693% year-over-year surge in AI-driven traffic to US retail sites during the
2025 holiday season, per Adobe Analytics, converting 31% better than non-AI
traffic." "4.4x better conversion rate for shoppers arriving via AI search
platforms vs. traditional organic search, per a 2025 Semrush study." "~40% of
Amazon shopping sessions on Black Friday 2025 involved Rufus, the retailer's
own AI assistant, converting at 3.5x the rate of non-Rufus sessions, per
Sensor Tower's 100,000-session holiday analysis."

**F63. Education & online learning.**
`https://getbrandgeo.com/ai-visibility-for-education.html`. "79% of
prospective students read Google's AI Overviews when they appear during
program research, and 56% say they trust a school or course more when it's
cited inside one, per Search Influence, 2026 Higher Education Marketing
Stats." "45% of prospective students now use AI tools like ChatGPT and
Perplexity during their college search, but only 13% go back and fact-check
what they were told, per Everspring, 2026 AI enrollment research." "Only 30%
of institutions report having a formal AI search strategy in place at all,
per Search Influence, 2026."

**F64. Financial services & fintech.**
`https://getbrandgeo.com/ai-visibility-for-financial-services.html`. "55% of
Americans have asked an AI chatbot for financial advice in 2026, up from just
10% in 2025." "49% of AI chatbot users say AI has already influenced at least
one real financial decision they made." "Only 18% feel comfortable letting AI
make a major financial decision on its own." Sources cited on the page: TD
Bank 2026 consumer survey (2,500 respondents), via American Banker, and
LendingTree 2026 AI chatbot user survey.

**F65. Healthcare providers.**
`https://getbrandgeo.com/ai-visibility-for-healthcare.html`. "40 million
people ask ChatGPT a health-related question every single day, per OpenAI's
own January 2026 'AI as a Healthcare Ally' report." "55% of adults who've used
AI for health advice did so to check or explore symptoms, the exact query
that can end in 'which provider should I see,' per the same OpenAI report."
"Healthcare's AI-citation overlap with organic rankings is 24%, the highest of
any industry in Siftly's 2026 AI Citation Rate Benchmarks."

**F66. Home services & contractors.**
`https://getbrandgeo.com/ai-visibility-for-home-services.html`. "45% of
consumers now use AI tools to find local businesses, up from just 6% a year
earlier, a sevenfold jump, per BrightLocal, 2026 Local Consumer Review
Survey." "22% of homeowners now go to an AI tool like ChatGPT first, before
Google, when they need a contractor, per Scorpion, 2026 State of Home
Services Marketing Report." "87% of independent HVAC and plumbing contractors
have effectively zero AI citation share in their own metro and category, per
5WPR's HVAC & Plumbing AI Visibility Index 2026."

**F67. Hotels & travel brands.**
`https://getbrandgeo.com/ai-visibility-for-hotels.html`. "58% of travelers
now turn to AI tools like ChatGPT, Gemini and Claude for trip planning, ahead
of the 55% who still rely on traditional travel websites." "63% of travelers
who've used AI to plan a trip now rely on it for most or every trip they
take." "A 31.6 percentage point increase in a hotel's AI recommendation
probability from having a top guest rating, per a June 2026 algorithm-audit
study." Sources cited on the page: Qlik Travel Planning Survey (July 2026),
TakeUp AI-Planned Travel Report (2026), and the June 2026 algorithm-audit
study of AI hotel recommendations, cited via Hospitality Net.

**F68. Law firms.**
`https://getbrandgeo.com/ai-visibility-for-law-firms.html`. "77 to 78% of
legal search queries now trigger a Google AI Overview, the highest rate of
any industry vertical in Semrush's 10-million-keyword analysis; SE Ranking
measures 77.67% for legal YMYL queries specifically." "About 7 legal
directories (Chambers, Legal 500, Super Lawyers, Best Lawyers, Martindale,
Avvo and peers) own the AI citation layer for virtually every legal query
category tested, per 5WPR and Haute Lawyer Network, 2026." "98.8% of local
business locations are invisible to ChatGPT recommendations, per SOCi's 2026
Local Visibility Index."

**F69. Real estate agencies.**
`https://getbrandgeo.com/ai-visibility-for-real-estate.html`. "67% of
homebuyers now use an AI tool (ChatGPT, Gemini, Perplexity or Claude) as their
primary research step before contacting an agent, up from just 17% eighteen
months earlier, per FlyDragon, 2026." "91% of U.S. real estate agents are
effectively invisible in AI-generated responses to buyer questions in their
own market, per FlyDragon's 2026 State of AI Search in Real Estate." "A 4x
higher 90-day close rate for AI-sourced buyer leads (9.6%) versus Zillow
Premier Agent leads (2.4%), per the same FlyDragon benchmark."

**F70. Restaurants & hospitality.**
`https://getbrandgeo.com/ai-visibility-for-restaurants.html`. "83% of
restaurant locations never appear in AI-generated recommendations at all,
despite 86% maintaining a normal Google presence, per Uberall's 2026 GEO
Benchmark." "45% of consumers now use AI tools like ChatGPT for local
business recommendations, up from just 6% a year earlier." "Just the top
three restaurant brands per category capture 53.4% of total AI share of
voice." Sources cited on the page: Uberall 2026 GEO Benchmark, Bloom
Intelligence "AI Restaurant Discovery 2026," and 5WPR "US Restaurants & Chains
AI Visibility Index 2026."

**F71. SaaS companies.**
`https://getbrandgeo.com/ai-visibility-for-saas.html`. "51% of B2B software
buyers now start their research in an AI chatbot instead of a search engine,
up from 29% a year earlier, per G2, 'The Answer Economy,' April 2026." "A 5.1x
higher conversion rate for AI-search-referred traffic (14.2%) versus Google
organic (2.8%) across a 680-million-citation analysis, per Averi, March
2026." "Brands are roughly 3x more likely to be mentioned in a ChatGPT answer
if they have active profiles on two or more review platforms like G2,
Capterra or TrustRadius, per Quoleady LLMO research, 2026."

**Cross-industry figure that repeats across several pages, safe to use once as
a category-wide stat rather than per-industry: "98.8% of local business
locations overall are invisible to AI recommendations," per SOCi's 2026 Local
Visibility Index, cited on the home services, law firms, real estate and
restaurants pages alike, and analysed further in `bg-008.html`.**

---

## 7. Brand kit and identity assets

### 7.1 Usable logo files, dark background and light background

Source: `docs/growth/brand-kit-2026-07-29/MANIFEST.md`. This is the kit built
from the only usable source raster in the repo (native art tops out at 401 by
567 pixels for the mark, 1033 pixels wide for the wordmark; nothing here is
upscaled beyond that, by the build's own assertion, section "Read this first"
of the manifest).

**F72. For a DARK background** (deck slides with a dark theme), use:

- `docs/growth/brand-kit-2026-07-29/svg/brandgeo-mark-mono-light.svg`, single
  colour `#e8e9ed`, measured 16.22:1 contrast on `#0a0b0e`. This is the
  manifest's own recommendation for "small UI chrome, footers, dark email
  headers," i.e. anywhere the mark must survive on dark.
- `docs/growth/brand-kit-2026-07-29/png/mark/brandgeo-mark-canvas-h512.png`
  (and the h128/h256/h567 siblings in the same folder), pre-composited onto
  `#0a0b0e`.
- `docs/growth/brand-kit-2026-07-29/png/lockup/brandgeo-lockup-dark-canvas-w1033.png`
  (native resolution) for the full mark-plus-wordmark lockup on dark, light
  coloured text.
- Avoid the as-authored transparent mark
  (`brandgeo/web/logo.png` or `source-art/mark-knockout.png`) on dark: per the
  manifest's own contrast finding, the full colour mark's area-weighted
  contrast on `#0a0b0e` is only 2.72:1 (under the 3:1 WCAG 1.4.11 floor for
  non-text graphics), the darkest navy region measures 1.44:1 and the eye
  disappears entirely because the knockout version's ring alpha goes
  transparent, not white.

**F73. For a LIGHT background** (deck slides with a light theme), use:

- `docs/growth/brand-kit-2026-07-29/svg/brandgeo-mark-mono-dark.svg`, single
  colour `#09090f`, measured 18.59:1 on `#f7f7fc`, or the full colour master
  `docs/growth/brand-kit-2026-07-29/source-art/mark-eye.png` (401x567, eye
  filled, the manifest's designated default master, "reads correctly on light
  and dark").
- `docs/growth/brand-kit-2026-07-29/png/lockup/brandgeo-lockup-light-white-w1033.png`
  for the full lockup on white, dark text, native resolution.
- Full colour mark on white measures 7.23:1 area-weighted contrast (F, per
  the manifest's own table), well clear of 4.5:1.

**F74. A brand-violet monochrome variant also exists** for either background
context where a single accent colour (rather than full colour or greyscale)
is wanted:
`docs/growth/brand-kit-2026-07-29/svg/brandgeo-mark-mono-accent.svg`, filled
`#8b5cf6` (matches `--ac`, F31).

**F75. Wordmark-only and full lockup-with-tagline files** also exist per
background and per resolution in `docs/growth/brand-kit-2026-07-29/png/wordmark/`
(20 files) and `docs/growth/brand-kit-2026-07-29/png/lockup-full/` (20 files,
includes the tagline "BE THE ANSWER. BE EVERYWHERE."). Largest honest export
for the wordmark and any lockup is 1033px wide; nothing larger is available
from the source art (see F76).

**F76. Hard size ceiling, load-bearing for slide design:** the wordmark and
any lockup containing it cannot honestly go past 1033px wide, and the square
mark cannot honestly go past 512px (skipping the never-shipped 1024px app
icon size), because the source raster itself is only 397 by 563 pixels at
native resolution and the build refuses to upscale (23 requested exports were
refused for exactly this reason, per the manifest). If a slide needs a very
large logo mark (for example, a title slide at 1920x1080), use the SVG
versions (`svg/brandgeo-mark.svg` or the mono variants), which scale cleanly
as vector, rather than upscaling any PNG past its native size.

**F77. A separate, newer icon system exists** at
`docs/growth/brand-identity-2026-07-29/v3/` (SVGs: `icon.svg`, `icon-mark.svg`,
`icon-tile.svg`, `icon-16.svg`, `logo-full.svg`; PNGs up to 1024px in
`v3/png/`). This is a distinct, redesigned icon (built via
`v3/build/render_v3.py`) using a violet gradient
`#6366F1 -> #8B5CF6 -> #7C3AED` (matches the site's `--ac` family, F31, F33)
on canvas colours `#0a0b0e` (dark) and `#f7f7fc` (light), plus dedicated
monochrome light/dark/accent PNG variants
(`mark-1024-mono-light.png`, `mark-1024-mono-dark.png`,
`mark-1024-mono-accent.png`). No separate written identity-rules document
(README, style guide) was found in this directory; the only rules available
are the constants inside `render_v3.py` itself. **This kit reaches 1024px
honestly** where the 2026-07-29 kit in F72 to F76 cannot, so prefer v3 assets
if a slide needs a large, sharp icon and the brandgeo-kit SVGs are not
suitable for some reason. Flag to the design stage that it is unclear which
of the two mark systems (F72 to F76 vs this one) is the currently endorsed
brand mark; both exist in the repo and neither manifest states the other is
superseded.

### 7.2 Identity rules (colour, type, clear space, do and don't)

**F78. Colour rule, from the manifest's own finding:** the logo mark's native
colours (`#1a5af7` mark blue, `#5f27fc` mark violet, `#032578` mark navy) are
NOT the same as the site's brand tokens (`--ac` `#8b5cf6`, `--ac-strong`
`#7c3aed`). The logo sits at roughly hue 250 to 265 (blue-violet); the site's
accent sits at hue 293. The manifest flags this as a visible mismatch when the
logo is placed next to a violet button, and explicitly states this is a brand
decision for the owner, not something the kit corrects on its own. The deck
should be aware the logo and the deck's own UI-matched violet CTAs will not be
colour-identical, and should not be redesigned to force a match without
sign-off.

**F79. Typeface rule:** the wordmark's typeface is explicitly UNKNOWN and
UNVERIFIED. The manifest states: "there is no font file in the repo, and the
wordmark exists only as pixels... naming a specific typeface from a 172px-tall
raster would be a guess. Do not let anyone put a font name in a brand
guideline on the strength of this kit." The deck must not claim a specific
typeface for the wordmark; use the wordmark as a fixed raster or vector
asset, and use Inter (F34) for all deck body and heading text, since that is
the verified, sourced site font.

**F80. Do: use the filled-eye master (`mark-eye.png` / the default SVGs) for
anything meant to read cleanly on both light and dark.** Do not use the
knockout (transparent-eye) version on dark backgrounds; per the manifest,
"the entire eye vanishes and the mark reads as a plain blue blob with a hole
in it" on `#0a0b0e`. The knockout version is light-background only.

**F81. Do not upscale.** The build enforces this with an assertion, not a
convention (F76). Any deck need for a mark larger than the native PNG sizes
must use the SVG.

**F82. Clear space and minimum size:** no explicit clear-space multiple (for
example, "1x the height of the mark on all sides") or a stated minimum
reproduction size in points/pixels was found written down anywhere in either
the 2026-07-29 kit manifest or the v3 identity directory. This is a gap, not a
rule to invent; the deck's designer should apply a conservative, generous
clear space by default (for example, at least the width of the mark's own
stem on every side) rather than citing a rule that does not exist in the
source material.

---

## 8. URLs, affiliate terms, and contact

**F83. Free audit URL:** `getbrandgeo.com/#free-audit`. Confirmed: the hero
section carrying the domain-check widget has `id="free-audit"`
(`brandgeo/web/index.html:1501`), and a comment at `:1498` states this anchor
is "the site-wide CTA target (90+ inbound pages)."

**F84. Self-serve signup URL:** `app.getbrandgeo.com/signup`. Confirmed as the
destination of every self-serve pricing card button (Free, Radar, Essentials,
Growth, Growth PRO) and the nav "Get started" link
(`brandgeo/web/index.html:1487`, `:2002`, `:2022`, `:2044`, `:2071`, `:2093`).

**F85. Affiliates page:** `getbrandgeo.com/affiliates.html`. File confirmed
present at `brandgeo/web/affiliates.html`. **10 percent commission
confirmed in that file**, specifically on renewals: "BrandGEO pays 10% of
each renewal for 12 months from the first payment. Programs with a fixed
amount per sale or per lead pay once." (`affiliates.html:277`). The page also
describes payout mechanics (Wise, Revolut, PayPal or bank transfer, monthly,
once a minimum balance clears) and states commission is calculated
server-side "from the amount the customer actually paid," with refunds and
cancellations reversing the commission (`:181`, `:211-212`).

**F86. Contact email, discrepancy to flag.** The task and the orchestrator
handoff both specify `constantin@getbrandgeo.com` as the deck's only contact
address. **On this pass, `constantin@getbrandgeo.com` does not appear
anywhere in `brandgeo/web/` (checked every `.html` file, zero matches).** The
live site instead shows `contact@getbrandgeo.com` in the footer and the
contact form action (`index.html:2233`, `:2388`, `:2421`), and
`support@getbrandgeo.com` in the page's own schema.org structured data
(`index.html:59`). The deck should still use `constantin@getbrandgeo.com` per
the explicit task instruction and the handoff packet, since that instruction
overrides what happens to be on the page today, but this is worth a one-line
flag back to whoever owns the homepage: the site's own published contact
address does not match the address the sales collateral is being told to use.

---

## 9. Summary of conflicts and surprises for the next stage

**F87.** Several strategy documents in `docs/strategy/` and `docs/growth/`
predate the 2026-07-31 Radar tier and the Free-to-Gemini move, and therefore
describe a ladder that no longer matches planConfig.ts HEAD (for example,
`hook-thesis-web.md`'s section 0 describes Free running ChatGPT). Always
prefer planConfig.ts HEAD and the live homepage over any dated strategy
document's own numbers; use the documents for their positioning rulings and
reasoning, not their entitlement tables.

**F88.** `docs/PRICING-SPEC.md` is stale on every axis (no Radar tier, no
Growth PRO tier, Managed priced at EUR 900 instead of EUR 1,500, different
prompt counts) and is explicitly marked in its own header as a draft that was
never implemented. Do not read it for any number; `docs/PRICING-STRATEGY-2026-07.md`
and `docs/strategy/sprint-ladder-ruling.md` are the live ones, and the live
homepage (section 2) is the final, published word.

**F89.** `brandgeo-dashboard/netlify/functions/_plans.js` was flagged (as of
`hook-thesis-web.md`, 2026-07-26) as out of sync with planConfig.ts, missing
`growth_pro` in its own plan order and granting `growth` an engine
inconsistently with planConfig.ts. This is a server-side mirror-file drift
risk, not something the deck states, but worth knowing this is a copy that
periodically drifts from the source of truth.

**F90.** The homepage's own "34 research articles" proof chip (F29, F30) is
stale against the actual 105-article count; the deck should use 105 and this
should be flagged back to whoever owns the homepage next.

**F91.** MCP access (F14, F16) is the clearest "must not claim" item in this
entire ledger: it exists only as an uncommitted working-tree diff with its own
comment stating the copy is "not customer-approved." It must not appear
anywhere in the deck, in any form, including as a roadmap teaser, unless
Constantin explicitly says otherwise in a future session.

**F92.** The contact email instructed for the deck
(`constantin@getbrandgeo.com`) does not match either address actually
published on the live site (`contact@getbrandgeo.com`,
`support@getbrandgeo.com`). Flagged in F86; follow the explicit task
instruction for the deck itself, but raise the mismatch separately.

---

## 10. Addenda written at build (Stage 3), and the slide trace

**F93. Tone is a shipped reading.** `brandgeo/web/index.html:1772-1773`: "Every
answer is scored for tone as well as presence" and "Sentiment is scored on every
engine your plan tracks, and engine by engine." Supports "in what tone" on
slides 1, 3 and 7, together with the packet 027 section 5 product sentence.

**F94. Position inside the answer is a shipped reading.** The hero card reports
"best position #1" (F28). Supports "where in the answer" on slides 3 and 7.

**F95. Illustrations are labelled, not claimed.** The example questions on
slides 2, 3 and 11, the "3 of 5" fraction on slide 10, the placeholder
competitors on slide 11, and the buyer question on every appendix page are
method illustrations. Each carries an on-slide label saying so. None is a
measurement.

**F96. Site audit wording conflict, escalated, not resolved by the deck.** The
homepage Growth card says "Site audit, 10 pages, unlocks here" (F20), while
`planConfig.ts` grants Radar and Essentials a one-page landing page audit (F11).
The deck states only what both sources agree on: Growth 10 pages and 10 drafts a
month, Growth PRO 30 pages and 30 drafts a month (F11, F12, F20, F21), audited
once a week (F12).

### 10.1 Slide trace, core deck (`deck.html`)

| Slide | Claims | Ledger |
|---|---|---|
| 1 | Product sentence; five engines | packet 027 s5, F06, F93, F94 |
| 2 | Name search versus buyer question | F51, F52, F95 |
| 3 | Question without brand name; five engines; four readings; Gemini from Free, five from Growth | F06, F07, F19, F52, F93, F94, F95 |
| 4 | 51% (29%), 67% (17%, eighteen months), 45% (6%) | F71, F69, F66 |
| 5 | 87%, 91%, 83% | F66, F69, F70 |
| 6 | 5.1x (14.2% against 2.8%), 4x (9.6% against 2.4%), 4.4x | F71, F69, F62 |
| 7 | Readings list; 24% healthcare overlap | F19, F65, F93, F94 |
| 8 | Minimum plan per engine; monthly Free, weekly paid; Growth PRO adds Grok and AI Overviews | F03, F07, F09, F27 |
| 9 | 46 of 65, 70.8%, #1, window, seven per-engine rates; seven engines is Growth PRO | F28, F39, F03 |
| 10 | Fraction first; four reporting states; unreachable not counted against the brand | F53, F54, F95 |
| 11 | Competitor named instead; tracking from Essentials | F19, F95 |
| 12 | Growth 10 pages, 10 drafts; Growth PRO 30 and 30; weekly audit | F11, F12, F20, F21, F96 |
| 13 | 40 million; 45% and 13%; 77 to 78% | F65, F63, F68 |
| 14 | 105 articles; 27 city studies; two DOIs; protocol without results; ORCID | F55, F56, F59, F60, F61 |
| 15 | Five cards, prices, yearly prices, badges, inclusions; Managed and Enterprise line; trust line | F17 to F25, F03, F08, F09, F11 |
| 16 | Free audit URL, signup URL, contact, affiliate terms | F83, F84, F85, F86 |

### 10.2 Slide trace, appendix (`appendix.html`)

Pages 1 to 10 map one to one to F62 to F71, in the same order (e-commerce,
education, financial services, healthcare, home services, hotels, law firms,
real estate, restaurants, SaaS). Sources lines are copied from each page's own
"Sources" block where the page groups them, which is why hotels, financial
services and restaurants list sources per page rather than per figure.

### 10.3 Wording changed after the Stage 4 claim skeptic (2026-09-22)

| Slide | Was | Now | Why |
|---|---|---|---|
| 4 | "Your buyers already ask AI before they search." | "Many of your buyers now ask AI first." | The sources cover 22 to 67 percent of buyers, not all of them. |
| 10 | "We lead with a fraction, not a bare score out of 100." | "Every score comes with the fraction behind it." | The shipped audit shows the score first, then the fraction (AuditReport.tsx). |
| 11 | Footer "Competitor tracking is included from Essentials." | "The audit names who was named instead. Competitor tracking over time: from Essentials." | Keeps the free audit's competitor list and the paid tracking apart. |
| 12 | "Checked weekly." | "Up to one audit a week." | Site audits are started by the user, capped by PLAN_SEO_AUDITS_PER_WEEK; no schedule exists. |
| 13, appendix 02 | "only 13% fact-check it" | "only 13% check it on the official school site" | The education page scopes the Everspring figure that way. |
| 13 | "the highest of any industry" | "the highest of any industry in the study" | The law page scopes it to Semrush's analysis; other pages show higher figures from other sources. |
| 16 | "10% of each renewal for 12 months" | "10% of every sale and of renewals for 12 months" | affiliates.html and the programme record pay on the first sale too (F85). |
