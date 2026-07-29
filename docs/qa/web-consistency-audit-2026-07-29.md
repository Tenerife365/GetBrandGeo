# Web consistency and validity audit, getbrandgeo.com

**Date:** 2026-07-29
**Scope:** `brandgeo/web/`, 79 HTML files plus `llms.txt`, `llms-full.txt`, `sitemap.xml`
**Type:** read-only audit. Nothing in `brandgeo/web/` was edited.
**Line numbers are against the WORKING TREE, not `HEAD`.** `brandgeo/web/index.html`
was already modified by another session when this audit ran (two lines at 2226 and
2233, moving AI SEO to "Growth and up" and AI Social to "Coming soon", both of which
match `planConfig.ts:293-295` and are correct). That edit replaces lines in place
and shifts nothing. Any further concurrent edit to a file listed below may shift its
line numbers, so re-grep the quoted string rather than trusting the number if the
fix pass runs later.
**Ground truth:** `brandgeo-dashboard/src/lib/planConfig.ts` and
`brandgeo-dashboard/netlify/functions/_cost.js`, both read in full this session.
Every "should be" value below cites a line in one of those two files.

---

## 0. Read this before anything else: the briefing for this audit was itself stale

The task brief given to this audit stated that Grok is the **6th** engine on
Growth PRO. That is wrong, and acting on it would have broken a correct page.

`planConfig.ts:65` gives `growth_pro` **seven** engines:

```
growth_pro: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai', 'grok', 'ai_overview'],
```

`_cost.js:312` mirrors it exactly. `ai_overview` (Google AI Overviews) went live
the same day as Grok, as a separate engine **added alongside** `google_ai`
(Google AI Mode), not replacing it. `planConfig.ts:59-64` and `_cost.js:305-311`
both explain why: AI Mode is a tab a user opts into, AI Overviews is the summary
block on an ordinary results page, and a brand can be cited in one and absent
from the other.

`index.html:2424` already publishes "**7 AI engines** + Grok and Google AI
Overviews" and `faq.html:274-284` already publishes seven. **Both are correct.**
A fix pass working from the brief would have downgraded them to six.

Live engine counts, from `planConfig.ts:53-69` and `_cost.js:296-316`:

| Plan | Live engines | Count | Prompts | Cooldown |
|---|---|---|---|---|
| free | chatgpt | 1 | 5 | 720h (monthly) |
| essentials | + gemini, claude | 3 | 20 | 168h (weekly) |
| growth | + perplexity, google_ai | 5 | 50 | 168h (weekly) |
| growth_pro | + grok, ai_overview | 7 | 75 | 168h (weekly) |
| managed | same as growth_pro | 7 | 250 | 168h (weekly) |
| enterprise | + copilot, deepseek | 9 | 100000 | 0 |

Sources: `planConfig.ts:53-69` (PLAN_ENGINES), `planConfig.ts:365-368`
(PLAN_PROMPTS), `planConfig.ts:378-381` (PLAN_COLLECTION_COOLDOWN_HOURS),
`planConfig.ts:85` (COMING_SOON_ENGINES = meta, copilot, deepseek).

Prices, from `planConfig.ts:254-262` read as 15% of price, and confirmed against
`_cost.js:397-405`: Free EUR 0, Essentials EUR 99, Growth EUR 299, Growth PRO
EUR 449, Managed from EUR 1,500, Enterprise custom.

---

## 1. Count summary

| | Count |
|---|---|
| In-scope files audited | 81 (79 HTML + `llms.txt` + `llms-full.txt`) |
| Files with at least one finding | 32 |
| Files clean | 48 |
| Excluded, noted separately | 1 (`article-builder.html`), included in the 48 clean |
| **Total findings** | **27** (F1 to F27) |

By severity: 7 CRITICAL, 8 HIGH, 7 MEDIUM, 5 LOW.

Findings by category. A single finding often spans many files, so the file
column counts distinct files, not instances.

| Category | Findings | Files affected |
|---|---|---|
| C1. Stale prompt caps | F1, F2, F3, F4, F8, F9 (6) | 12 |
| C2. Stale engine claims (meta sold live, wrong count, grok misdescribed) | F3, F5, F6, F10, F13, F14, F15, F16, F17, F18, F19, F21, F23, F24, F25, F26 (16) | 24 |
| C3. Stale prices or cadence | F2, F4, F7, F8, F12 (5) | 14 |
| C4. The index.html Grok inconsistency | F11 (1) | 1 |
| C5. JSON-LD parse failures | none in scope | 0 (1 excluded file, see below) |
| C6. Wrong prices inside JSON-LD | F7, F12 (2) | 9 |
| C7. Unsourced or misattributed competitor claims | F22, F27 (2) | 10 |

Some findings appear in more than one category, which is why the finding column
sums above 27. F3 is both a prompt-cap and an engine-count defect, F4 is both a
prompt-cap and a price defect, and so on.

`sitemap.xml` was checked and has no findings in any of the seven categories.

### JSON-LD: the non-negotiable check passed

Every `<script type="application/ld+json">` block in all 79 HTML files was
extracted and parsed with `JSON.parse`, not eyeballed. **111 blocks found, 110
parse cleanly.**

**The three previously-live FAQPage failures are fixed.** Baltimore, Charlotte
and Detroit all parse. The `"}]` that should have been `"}}]` is gone from all
three.

The single failure is `article-builder.html:410`, and **it is not a defect**.
That block is a JavaScript template literal, not JSON:

```
"publisher": {"@type": "Organization", ...}${heroImage ? `,\n "image": "${esc(heroImage)}"` : ''}
```

It is source for a generator, it is an internal tool, and it is deliberately
excluded from the cPanel upload. It is correctly excluded from the site defect
count.

**Recommendation regardless:** wire the parse check into the content workflow.
This audit's script is eight lines of Node. The three FAQPage schemas were
silently invalid for weeks on a product whose entire thesis is being parsed
correctly by machines.

---

## 2. Findings ledger, most severe first

### CRITICAL

---

**F1. `terms.html` promises Essentials customers 30 prompts. The product enforces 20.**

- **Severity:** CRITICAL
- **File:** `brandgeo/web/terms.html`
- **Line:** 266
- **Says now:** "It is a software-only, self-serve plan that includes everything in Free plus 30 commercial prompts, monitoring across ChatGPT, Gemini and Claude, weekly monitoring, competitor tracking, and dashboard access with CSV export."
- **Code says:** `planConfig.ts:366` `essentials: 20`. Enforced server-side, per the note at `planConfig.ts:318-336`.
- **Why critical:** this is the Terms and Conditions, not marketing copy. It is a written contractual promise of 30 prompts to a paying customer, and the platform blocks them at 20. Every other prompt-cap finding in this report is a marketing overstatement. This one is a contract term the product does not honour.
- **Replacement:** `everything in Free plus 20 commercial prompts, monitoring across ChatGPT, Gemini and Claude, weekly monitoring, competitor tracking, and dashboard access with CSV export.`

---

**F2. `terms.html` promises Growth customers 150 prompts, four engines, and a daily refresh. All three are wrong.**

- **Severity:** CRITICAL
- **File:** `brandgeo/web/terms.html`
- **Line:** 269
- **Says now:** "includes everything in Essentials plus up to 150 commercial prompts, monitoring across four AI engines (ChatGPT, Gemini, Claude and Perplexity), daily or weekly refresh, one onboarding call, and email support."
- **Code says:** `planConfig.ts:366` `growth: 50`. `planConfig.ts:56` gives Growth five engines including `google_ai`. `planConfig.ts:379` sets `growth: 168` hours, which is weekly only, with `planConfig.ts:373-377` recording that the old daily/48h split "was unreachable" because the EUR budget bound first.
- **Note:** the engine count here is wrong in the customer's favour. Growth gained `google_ai` on 2026-07-28 (`planConfig.ts:48-52`) and the contract was never updated, so the contract under-promises the engine set while over-promising the prompt cap by 3x.
- **Replacement:** `includes everything in Essentials plus up to 50 commercial prompts, monitoring across five AI engines (ChatGPT, Gemini, Claude, Perplexity and Google AI Mode), a weekly refresh, one onboarding call, and email support.`

---

**F3. `terms.html` describes Growth PRO as adding Google AI Mode for a fifth engine. Google AI Mode is in Growth. Growth PRO adds Grok and Google AI Overviews for a seventh.**

- **Severity:** CRITICAL
- **File:** `brandgeo/web/terms.html`
- **Line:** 272
- **Says now:** "It is a software-only, self-serve plan that includes everything in Growth plus monitoring of <strong>Google AI Mode</strong>, bringing coverage to five AI engines."
- **Code says:** `planConfig.ts:56` puts `google_ai` in Growth. `planConfig.ts:65` gives `growth_pro` seven engines, the two extra being `grok` and `ai_overview`. `planConfig.ts:366` gives Growth PRO 75 prompts, a number the contract never states at all.
- **Why critical:** the EUR 449 tier's contractual definition describes a differentiator it does not have and omits the two it does. As written, a Growth PRO customer is contractually promised strictly less than a Growth customer already receives.
- **Replacement:** `It is a software-only, self-serve plan that includes everything in Growth plus up to 75 commercial prompts and monitoring of <strong>Grok</strong> and <strong>Google AI Overviews</strong>, bringing coverage to seven AI engines.`

---

**F4. `llms-full.txt` publishes the entire superseded pricing ladder to the machines this product exists to be read by. Growth PRO does not appear in it at all.**

- **Severity:** CRITICAL
- **File:** `brandgeo/web/llms-full.txt`
- **Lines:** 46 to 51
- **Says now:**
  - L47 `- Essentials: EUR 99/month - 30 prompts, ChatGPT + Gemini + Claude, weekly monitoring, ...`
  - L48 `- Growth: EUR 299/month - 150 prompts, all 5 AI engines, daily/weekly refresh, ...`
  - L49 `- Managed: EUR 900/month or EUR 9,000/year - full managed service ...; EUR 1,250 one-time setup fee ...`
  - L50 `- Pro: from EUR 1,500/month, no setup fee - multiple countries, multiple brands, ...`
- **Code says:** Essentials 20 (`planConfig.ts:366`), Growth 50 (same line), weekly only (`planConfig.ts:379`), Managed from EUR 1,500 (`planConfig.ts:259` budget is 15% of the EUR 1,500 floor), and `pro` is explicitly legacy per `planConfig.ts:28-30`, kept only so existing pro clients do not fall back, with no new signups.
- **Why critical:** `llms.txt` and `llms-full.txt` exist for one purpose, to be ingested by AI answer engines. BrandGEO sells AI answer-engine visibility. Every wrong number here propagates into the exact surface the company charges customers to monitor. Growth PRO, the EUR 449 tier, appears **zero times** in either file (verified by grep), so the tier is invisible to every engine that reads them.
- **Replacement:**
```
- Free: EUR 0/month - 1 project, 5 prompts, ChatGPT only, monthly refresh, self-serve
- Essentials: EUR 99/month - 20 prompts, ChatGPT + Gemini + Claude, weekly refresh, competitor tracking, CSV export, self-serve, no setup fee
- Growth: EUR 299/month - 50 prompts, 5 AI engines (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode), weekly refresh, site audit up to 10 pages, 1 onboarding call, self-serve, no setup fee
- Growth PRO: EUR 449/month - 75 prompts, 7 AI engines (adds Grok and Google AI Overviews), weekly refresh, site audit up to 30 pages, self-serve, no setup fee
- Managed: from EUR 1,500/month or EUR 15,000/year - full managed service (strategy, research, monthly executive report, monthly strategy call, priority support); onboarding included in the first month, no separate setup fee
- Enterprise: custom pricing - unlimited scale across all markets, white-label, dedicated support, done-for-you managed service
```

---

**F5. `llms-full.txt` sells Meta AI as one of five live engines.**

- **Severity:** CRITICAL
- **File:** `brandgeo/web/llms-full.txt`
- **Lines:** 120, 295
- **Says now:**
  - L120 `- Five-engine monitoring: ChatGPT (...), Gemini (...), Claude (...), Perplexity (...), and Meta AI (embedded across WhatsApp, Instagram, and Facebook).`
  - L295 `- **Which AI engines does BrandGEO monitor?** ChatGPT, Gemini, Claude, Perplexity, and Meta AI, all queried with live web search enabled where available.`
- **Code says:** `planConfig.ts:85` puts `meta` in `COMING_SOON_ENGINES`, and it appears in no plan's engine set (`planConfig.ts:53-69`). `planConfig.ts:74-79` records that it is retired with "no current intention to reinstate it". `_cost.js:168` marks it "retired 2026-07-16 ... historical rows only".
- **Replacement L120:** `- Multi-engine monitoring, up to seven engines by plan: ChatGPT (OpenAI, web search enabled), Gemini (Google, web-integrated), Claude (Anthropic, reasoning-focused, selective citations), Perplexity (real-time cited web search), Google AI Mode (Google, the conversational search tab), and on Growth PRO and above Grok (xAI, the only engine that reads live X/Twitter as well as the open web) and Google AI Overviews (the AI summary shown by default on an ordinary Google results page). Queries run with live web search enabled where available.`
- **Replacement L295:** `- **Which AI engines does BrandGEO monitor?** ChatGPT, Gemini, Claude, Perplexity and Google AI Mode on Growth and above, plus Grok and Google AI Overviews on Growth PRO and above, all queried with live web search enabled where available.`

---

**F6. `llms.txt` opens by selling Meta AI as a live engine, in the summary block AI crawlers read first.**

- **Severity:** CRITICAL
- **File:** `brandgeo/web/llms.txt`
- **Lines:** 3 to 5
- **Says now:** `> BrandGEO is an AI Visibility Intelligence platform. It monitors, scores, and\n> tracks how brands are mentioned, ranked, and described across ChatGPT,\n> Gemini, Claude, Perplexity, and Meta AI, and reports a weighted 0-100 AI\n> Visibility Score ...`
- **Code says:** as F5.
- **Why critical:** this is the first prose block of the file, inside the `>` summary that the llms.txt convention marks as the canonical one-paragraph description. It is the single highest-leverage sentence on the site for machine ingestion, and it names a retired engine.
- **Replacement:** `> tracks how brands are mentioned, ranked, and described across ChatGPT,\n> Gemini, Claude, Perplexity, Google AI Mode, Grok and Google AI Overviews,\n> and reports a weighted 0-100 AI`

---

**F7. Managed is published at EUR 900/month on twelve pages while `index.html` and `terms.html` publish EUR 1,500. Nobody can buy the EUR 900 price.**

- **Severity:** CRITICAL
- **Files and lines:**

| File | Lines | Form |
|---|---|---|
| `brandgeo-vs-ahrefs-brand-radar.html` | 190 | table |
| `brandgeo-vs-athenahq.html` | 33 (JSON-LD), 190, 215, 231 | schema + table + body |
| `brandgeo-vs-conductor.html` | 32 (JSON-LD), 174, 191, 216, 228 | schema + body |
| `brandgeo-vs-goodie.html` | 32 (JSON-LD), 189, 216, 227 | schema + table + body |
| `brandgeo-vs-otterly.html` | 32 (JSON-LD), 190, 227 | schema + table + body |
| `brandgeo-vs-peec.html` | 32 (JSON-LD), 189, 225 | schema + table + body |
| `brandgeo-vs-profound.html` | 189, 214 | table + body |
| `brandgeo-vs-rankscale.html` | 189 | table |
| `brandgeo-vs-scrunch.html` | 32 (JSON-LD), 189, 227 | schema + table + body |
| `brandgeo-vs-semrush.html` | 189 | table |
| `faq.html` | 46, 47 (JSON-LD), 382, 402 | schema + body |
| `get-found-online.html` | 55 (JSON-LD), 279 | schema + body |

- **Says now (representative):** `<tr><td>Done-for-you option</td><td class="hl">Managed &euro;900/mo, a real managed service, not just software</td>...`
- **Code says:** `planConfig.ts:259` sets Managed's budget at `225.00 // 15% of EUR 1,500 floor`. `_cost.js:402` matches. `index.html:85` publishes `"name":"BrandGEO Managed","price":"1500"` in its Product JSON-LD and `index.html:2442` publishes EUR 1,500 in the pricing card. `terms.html:249` publishes "From EUR 1,500 / month".
- **Why critical:** this is a same-site price contradiction of 40% on the highest-value self-serve-adjacent tier, and it is published in structured data on six of those pages, so it feeds rich results and AI answers directly. A prospect who reads a comparison page and then reaches the pricing page sees a 67% price increase. Either number could be defended in isolation; publishing both simultaneously cannot be.
- **Replacement:** `Managed from &euro;1,500/mo, a real managed service, not just software`

---

### HIGH

---

**F8. `faq.html` publishes a six-tier ladder that no longer exists: Growth PRO is missing, legacy Pro is sold, and prompt caps are 50% to 200% over.**

- **Severity:** HIGH
- **File:** `brandgeo/web/faq.html`
- **Lines:** 46 and 47 (JSON-LD FAQPage answers), 379 to 383, 399 to 404
- **Says now (L47, JSON-LD, abbreviated):** `"BrandGEO has six tiers: Free (0 euros: 1 project, 5 prompts, ChatGPT only, monthly refresh), Essentials (99 euros/month: ... 30 prompts ...), Growth (299 euros/month: ... 150 prompts, all 5 AI engines, daily/weekly refresh ...), Managed (900 euros/month or 9,000 euros/year ...), Pro (from 1,500 euros/month ...), and Enterprise (custom pricing ...)"`
- **Says now (L380, L381, L382, L383):**
  - `<li><strong>Essentials (&#x20AC;99/mo)</strong>: 30 prompts, ...</li>`
  - `<li><strong>Growth (&#x20AC;299/mo)</strong>: 150 prompts, all 5 AI engines, daily/weekly refresh, ...</li>`
  - `<li><strong>Managed (&#x20AC;900/mo or &#x20AC;9,000/yr)</strong>: ...</li>`
  - `<li><strong>Pro (from &#x20AC;1,500/mo, no setup fee)</strong>: ...</li>`
  - L399 to L404 repeat the same six-tier list in the "What does BrandGEO cost?" answer.
- **Code says:** `planConfig.ts:264` `PLAN_ORDER = ['free','essentials','growth','growth_pro','managed','pro','enterprise']` with `pro` documented at `planConfig.ts:28-30` as legacy and closed to new signups. Prompts 5/20/50/75/250 at `planConfig.ts:366-367`. Weekly-only cadence at `planConfig.ts:379`.
- **Why HIGH not CRITICAL:** it is marketing copy rather than contract, but it is duplicated into FAQPage structured data on both answers, so it is machine-read.
- **Replacement (L380 to L383, and mirror into L46/L47 and L399 to L404):**
```
<li><strong>Essentials (&#x20AC;99/mo)</strong>: 20 prompts, ChatGPT + Gemini + Claude, weekly refresh, competitor tracking, CSV export.</li>
<li><strong>Growth (&#x20AC;299/mo)</strong>: 50 prompts, 5 AI engines, weekly refresh, site audit up to 10 pages, 1 onboarding call, email support.</li>
<li><strong>Growth PRO (&#x20AC;449/mo)</strong>: 75 prompts, 7 AI engines (adds Grok and Google AI Overviews), weekly refresh, site audit up to 30 pages.</li>
<li><strong>Managed (from &#x20AC;1,500/mo or &#x20AC;15,000/yr)</strong>: Everything in Growth PRO plus full managed service: strategy, research, monthly reports, strategy calls, priority support.</li>
<li><strong>Enterprise</strong>: Custom pricing. Unlimited scale across all markets, white-label, dedicated support.</li>
```

---

**F9. Growth is advertised as 150 prompts on all ten competitor comparison pages. It is 50.**

- **Severity:** HIGH
- **Files and lines:**

| File | Lines |
|---|---|
| `brandgeo-vs-athenahq.html` | 32 (JSON-LD), 188, 227 |
| `brandgeo-vs-conductor.html` | 189 |
| `brandgeo-vs-goodie.html` | 188 |
| `brandgeo-vs-otterly.html` | 188 |
| `brandgeo-vs-peec.html` | 188 |
| `brandgeo-vs-profound.html` | 188 |
| `brandgeo-vs-rankscale.html` | 188 |
| `brandgeo-vs-scrunch.html` | 188 |
| `brandgeo-vs-semrush.html` | 32 (JSON-LD), 188, 215, 225 |

`brandgeo-vs-ahrefs-brand-radar.html` is **not** in this list. Checked: its row 188
compares Brand Radar add-on cost and states no BrandGEO prompt figure anywhere on
the page. It is affected by F7 (the EUR 900 price) only. Nine pages, not ten.

- **Says now (representative, `brandgeo-vs-peec.html:188`):** `<tr><td>Mid tier</td><td class="hl">Growth &euro;299/mo (all 5 engines, 150 prompts)</td><td>Pro $245/mo (choose 3 models, 150 prompts, 2 projects)</td></tr>`
- **Code says:** `planConfig.ts:366` `growth: 50`.
- **Why this one bites hardest here:** on `brandgeo-vs-peec.html:188` the 150 figure is set directly against Peec Pro's real 150 prompts, so the page claims parity on prompt volume at a EUR 299 versus $245 price. At the true figure of 50, BrandGEO offers a third of the volume for more money. The same shape appears on `brandgeo-vs-scrunch.html:188` (700 prompts opposite) and `brandgeo-vs-otterly.html:188` (100 prompts opposite). These are the comparison rows a prospect reads most carefully, and they are the ones that reverse.
- **Replacement:** `Growth &euro;299/mo (5 engines, 50 prompts), Growth PRO &euro;449/mo (7 engines, 75 prompts)`
- **Note for the fix pass:** this is not a find-and-replace of 150 to 50. Each of these rows is a comparison against a competitor number, so correcting BrandGEO's figure changes what the row argues. Several rows will need rewriting around a different claim (flat pricing, engine breadth, no credit meter) rather than volume. This one needs `bg-copy`, not a mechanical edit.

---

**F10. The free-audit surfaces tell a prospect BrandGEO checks Meta AI. The free audit runs Google AI Mode instead.**

- **Severity:** HIGH
- **Files and lines:**
  - `brandgeo/web/get-found-online.html:253`
  - `brandgeo/web/glossary.html:315`
- **Says now:**
  - `get-found-online.html:253` `<p>We check how ChatGPT, Gemini, Claude, Perplexity, and Meta AI answer when someone asks for a business like yours, and whether your public information is correct. You get a clear score and a plain-language summary. No signup, no cost.</p>`
  - `glossary.html:315` `<p>We'll audit how ChatGPT, Gemini, Claude, Perplexity, and Meta AI respond to queries about your brand, free, in 48 hours.</p>`
- **Code says:** `netlify/functions/_prospect_engines.js:396` `const FULL_ENGINES = ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai']`. `meta` is in `COMING_SOON_ENGINES` (`planConfig.ts:85`) and collects for nobody.
- **Why HIGH:** these two describe a deliverable the prospect receives within minutes or hours. The engine named is one the pipeline will never query, and the engine actually queried is not named. It is the most immediately falsifiable claim on the site, and `index.html:2493` already gets the same claim right ("across all 5 engines", which matches `FULL_ENGINES`).
- **Replacement (both):** `ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode`

---

**F11. `index.html` sells Grok as a live Growth PRO engine and, 51 lines later, sells it as an unbuilt Enterprise upgrade.**

- **Severity:** HIGH
- **File:** `brandgeo/web/index.html`
- **Lines:** 2424 and 2475
- **Confirmed.** Both lines are present exactly as described in the brief, and the cards they sit in are:
  - **Line 2424** is inside the **Growth PRO** pricing card (card opens at `index.html:2408`, `<div class="plan-name">BrandGEO Growth PRO</div>` at 2411, EUR 449 at 2413). It reads: `<li><strong>7 AI engines</strong> &middot; + Grok and Google AI Overviews</li>`. **This line is correct** and matches `planConfig.ts:65`.
  - **Line 2475** is inside the **Custom Enterprise** pricing card (card opens at `index.html:2461`, `<div class="plan-name">Custom Enterprise</div>` at 2464, price "Let's talk" at 2467), in the `Everything in Managed, plus` feature list opened at 2472. It reads: `<li>More engines: Copilot, DeepSeek, Grok</li>`.
- **Code says:** `planConfig.ts:85` `COMING_SOON_ENGINES = new Set(['meta', 'copilot', 'deepseek'])`. `grok` was deliberately removed from that set on 2026-07-29 (`planConfig.ts:80-84`: "grok LEFT this set 2026-07-29, it collects for real now"). `planConfig.ts:67-68` shows the only engines `enterprise` adds over `managed` are `copilot` and `deepseek`.
- **The defect:** Grok is offered as an Enterprise differentiator when it is already included two tiers below at EUR 449. The two cards are in the same pricing section, reachable by one toggle click (`index.html:2325`), so a Growth PRO buyer can see both at once. It also weakens the Growth PRO card, which is the one page element that currently makes the EUR 449 step legible (`_cost.js:300-304` records that this was the entire point of shipping Grok).
- **Replacement (line 2475):** `<li>More engines: Copilot and DeepSeek</li>`
- **Additional note, not a separate finding:** with Grok removed, the Enterprise card's engine differentiator is two engines that `planConfig.ts:85` states have never collected and, per `planConfig.ts:81-84`, have no near-term path (every DeepSeek model on OpenRouter is retrieval-free, and Microsoft ships no public Copilot API). Selling them as an Enterprise upgrade is a strategy question for `bg-strategy`, not a copy fix.

---

**F12. Six competitor pages carry the EUR 900 Managed price inside JSON-LD, where it feeds rich results and AI answers.**

- **Severity:** HIGH
- **Files and lines:** `brandgeo-vs-athenahq.html:33`, `brandgeo-vs-conductor.html:32`, `brandgeo-vs-goodie.html:32`, `brandgeo-vs-otterly.html:32`, `brandgeo-vs-peec.html:32`, `brandgeo-vs-scrunch.html:32`, plus `faq.html:46` and `faq.html:47`, plus `get-found-online.html:55`.
- **Says now (`brandgeo-vs-peec.html:32`, abbreviated):** `"...BrandGEO Managed starts at €900/month for a fully managed service, while a comparable managed GEO engagement outside a self-serve tool like Peec typically runs $1,500-5,000+/month..."`
- **Code says:** as F7.
- **Why filed separately from F7:** these are `FAQPage` `acceptedAnswer` strings. They parse cleanly, so no validity check catches them, and they are exactly the text an AI answer engine quotes when asked what BrandGEO's managed tier costs. `index.html`'s `Product` schema simultaneously publishes 1500. Two valid schemas on the same domain giving different prices for the same named product is worse than one wrong number, because it makes the domain itself look unreliable to the retrieval systems the company sells visibility into.
- **Replacement:** `BrandGEO Managed starts at €1,500/month for a fully managed service`
- **Refuted, for the record:** `index.html`'s own Product schema (lines 25 to 90) was parsed and every `Offer` checked. All five are correct: Free 0, Essentials 99, Growth 299, Growth PRO 449, Managed 1500, all EUR, all with matching `UnitPriceSpecification`. `index.html` is the one page whose JSON-LD prices are right.

---

**F13. `brandgeo-vs-goodie.html` tells prospects Grok and Google AI are coming soon. Both are live.**

- **Severity:** HIGH
- **File:** `brandgeo/web/brandgeo-vs-goodie.html`
- **Lines:** 34 (JSON-LD), 191 (table), 235 (body)
- **Says now:** `"BrandGEO tracks 5 core engines (ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode) included as standard from the Growth tier up, with Copilot, DeepSeek, Grok, and Google AI listed as coming soon."`
- **Code says:** `google_ai` left `COMING_SOON_ENGINES` on 2026-07-16 (`planConfig.ts:72`) and `grok` left it on 2026-07-29 (`planConfig.ts:80`). The sentence lists Google AI as both a core engine and a coming-soon engine in the same breath, so it was internally contradictory even before Grok shipped.
- **Replacement:** `BrandGEO tracks 5 core engines (ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode) as standard from the Growth tier up, and 7 from Growth PRO up, adding Grok and Google AI Overviews. Copilot and DeepSeek are not yet available.`

---

**F14. `brandgeo-vs-profound.html` concedes Grok and AI Overviews to Profound. BrandGEO now has both.**

- **Severity:** HIGH
- **File:** `brandgeo/web/brandgeo-vs-profound.html`
- **Lines:** 33 (JSON-LD), 191 (table), 226 (body), 230 (body)
- **Says now (L230):** `"No. Profound tracks 10+ engines ... including Copilot, Grok, DeepSeek, Meta AI, and AI Overviews. BrandGEO tracks 5 core engines as standard from Growth up ... If you specifically need Copilot, Grok, or DeepSeek tracked today, Profound currently covers ground BrandGEO doesn't."`
- **Code says:** `planConfig.ts:65` gives Growth PRO both `grok` and `ai_overview`. Only `copilot` and `deepseek` remain genuinely uncovered (`planConfig.ts:85`).
- **Why HIGH:** this is a written concession to a named competitor on a claim that is now false and self-harming. The page voluntarily surrenders two engines BrandGEO ships, and does so on the one comparison page against the category's largest player. It is also duplicated into `FAQPage` structured data at line 33, so an engine asked "does BrandGEO track Grok" can quote BrandGEO's own site saying no.
- **Replacement (L230):** `No. Profound tracks 10+ engines, the broadest coverage in the category. BrandGEO tracks 5 core engines as standard from Growth up (ChatGPT, Gemini, Claude, Perplexity, Google AI Mode) and 7 from Growth PRO up, adding Grok and Google AI Overviews. If you specifically need Copilot or DeepSeek tracked today, Profound currently covers ground BrandGEO doesn't.`

---

**F15. `brandgeo-vs-semrush.html` frames Grok as something Semrush gates behind Enterprise, implying BrandGEO lacks it.**

- **Severity:** HIGH
- **File:** `brandgeo/web/brandgeo-vs-semrush.html`
- **Lines:** 34 (JSON-LD), 191 (table), 212, 233
- **Says now (L212):** `<li><strong>Claude included as standard</strong> from Growth up, while Semrush gates Claude, Copilot, Grok, DeepSeek, and Meta AI behind a custom-priced Enterprise tier.</li>`
- **Code says:** `planConfig.ts:65`, Grok is on Growth PRO at EUR 449.
- **Why HIGH:** the argument the line makes is that Semrush gates engines BrandGEO includes, but Grok sits in the "Semrush gates it" list without BrandGEO's own coverage being stated, so the sentence reads as a shared gap rather than a BrandGEO advantage. The correction strengthens the page.
- **Replacement:** `<li><strong>Claude included as standard</strong> from Growth up, and <strong>Grok and Google AI Overviews</strong> from Growth PRO up, while Semrush gates Claude, Copilot, Grok, DeepSeek, and Meta AI behind a custom-priced Enterprise tier.</li>`

---

### MEDIUM

---

**F16. Meta AI is sold as a live BrandGEO engine in the standing "About BrandGEO" block of six research articles.**

- **Severity:** MEDIUM
- **Files and lines:**

| File | Line | Exact claim |
|---|---|---|
| `bg-001.html` | 424 | `We run structured queries across all 5 core AI engines (ChatGPT, Gemini, Claude, Perplexity, and Meta AI)` |
| `bg-002.html` | 292 | `We run structured queries across all 5 core AI engines (ChatGPT, Gemini, Claude, Perplexity, and Meta AI)` |
| `bg-003.html` | 350 | `BrandGEO tracks all eight signal categories above across all 5 core AI engines (ChatGPT, Gemini, Claude, Perplexity, and Meta AI)` |
| `bg-004.html` | 277 | `what BrandGEO runs for every client, across all 5 core AI engines: ChatGPT, Gemini, Claude, Perplexity, and Meta AI` |
| `bg-006.html` | 316 | `We track your brand's citation and mention behavior separately across Perplexity, Gemini, ChatGPT, Claude, and Meta AI` |
| `bg-010.html` | 323 | `it tracks whether AI engines are actually citing and recommending you, across ChatGPT, Gemini, Claude, Perplexity, and Meta AI` |

- **Code says:** `planConfig.ts:85`, `meta` is in `COMING_SOON_ENGINES` and no plan includes it.
- **How these differ from the historical references (important):** every one of these six is a **present-tense claim about what the product does today**, in a marketing block appended to the article. They are not reports of what Meta AI answered in a measured run. That distinction is the whole reason the other Meta AI references in these same files are not filed. See section 4.
- **Replacement:** `ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode` in all six, with the count kept at 5 since these blocks describe the standard Growth-level offering.

---

**F17. Meta AI is sold as live in four industry landing pages, in both visible copy and FAQPage structured data.**

- **Severity:** MEDIUM
- **Files and lines:**

| File | Lines | Form |
|---|---|---|
| `ai-visibility-for-ecommerce.html` | 61 (JSON-LD), 279 | `BrandGEO runs that check across ChatGPT, Gemini, Claude, Perplexity, and Meta AI for you, on a recurring basis` |
| `ai-visibility-for-healthcare.html` | 58 (JSON-LD), 280 | `which is why BrandGEO tracks it directly across ChatGPT, Gemini, Claude, Perplexity, and Meta AI` |
| `ai-visibility-for-saas.html` | 57 (JSON-LD), 273 | `BrandGEO runs that check across ChatGPT, Gemini, Claude, Perplexity, and Meta AI on a recurring basis` |
| `ai-visibility-for-law-firms.html` | 56 (JSON-LD), 329 | `(across ChatGPT, Gemini, Claude, Perplexity, and Meta AI) ... BrandGEO runs this check automatically on a recurring basis` |

- **Code says:** as F16.
- **Replacement:** `ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode` in all eight locations.

---

**F18. `ai-visibility-for-hotels.html` states BrandGEO "tracks all five engines" with Meta AI as one of the five.**

- **Severity:** MEDIUM
- **File:** `brandgeo/web/ai-visibility-for-hotels.html`
- **Lines:** 53 (JSON-LD), 309
- **Says now (L309):** `ChatGPT, Gemini, and Perplexity are the three most commonly used for trip planning today, with Claude and Meta AI also increasingly used for itinerary and destination questions. Recommendation behavior varies meaningfully by engine: a hotel that's well-cited on one engine can be completely absent on another, which is why BrandGEO tracks all five engines rather than optimizing for a single one.`
- **Code says:** `planConfig.ts:56`, Growth's five are chatgpt, gemini, claude, perplexity, google_ai.
- **Note on why this is separated from F17:** the first half of the sentence is a claim about the travel market, which is defensible on its own. Only the closing "which is why BrandGEO tracks all five engines" turns the preceding list into a BrandGEO coverage claim. The fix should keep the market observation and correct the coverage claim, not delete the sentence.
- **Replacement:** `... with Claude also increasingly used for itinerary and destination questions. Recommendation behavior varies meaningfully by engine: a hotel that's well-cited on one engine can be completely absent on another, which is why BrandGEO tracks ChatGPT, Gemini, Claude, Perplexity and Google AI Mode rather than optimizing for a single one.`

---

**F19. The `blog.html` footer sells Meta AI as a monitored engine.**

- **Severity:** MEDIUM
- **File:** `brandgeo/web/blog.html`
- **Line:** 678
- **Says now:** `<p>AI Visibility Intelligence for brands that want to stay ahead. Monitor and measure your presence across ChatGPT, Gemini, Claude, Perplexity, and Meta AI.</p>`
- **Code says:** as F16.
- **Note:** this string was checked against every other HTML file and appears **only** in `blog.html`. It is not shared boilerplate, so fixing it here fixes it everywhere.
- **Replacement:** `Monitor and measure your presence across ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode.`

---

**F20. `terms.html` omits Growth PRO from its own definition of the self-serve plans, and still names the retired Pro tier as a managed plan.**

- **Severity:** MEDIUM
- **File:** `brandgeo/web/terms.html`
- **Lines:** 158 and 179
- **Says now:**
  - L158 `<li><strong>"Service"</strong> means ... including the Free Audit, the self-serve plans (Free, Essentials, and Growth), and the managed service plans (Managed, Pro, and Enterprise).</li>`
  - L179 `On the self-serve plans (Free, Essentials, and Growth), clients access the BrandGEO dashboard directly ...`
- **Code says:** `planConfig.ts:264` `PLAN_ORDER` includes `growth_pro` between `growth` and `managed`. `planConfig.ts:28-30` documents `pro` as legacy, merged into Managed, no new signups.
- **Why it matters:** `terms.html:242` and `terms.html:211` already list Growth PRO in the price table and count "three paid self-serve software plans". The definitions section contradicts the same document two screens down, which is the kind of internal inconsistency that undermines a contract's enforceability rather than merely being untidy.
- **Replacement L158:** `including the Free Audit, the self-serve plans (Free, Essentials, Growth, and Growth PRO), and the managed service plans (Managed and Enterprise).`
- **Replacement L179:** `On the self-serve plans (Free, Essentials, Growth, and Growth PRO), clients access the BrandGEO dashboard directly ...`

---

**F21. `terms.html` defines "AI Engines" as five and service delivery as "across five AI engines". Growth PRO and Managed get seven.**

- **Severity:** MEDIUM
- **File:** `brandgeo/web/terms.html`
- **Lines:** 159 and 170
- **Says now:**
  - L159 `<li><strong>"AI Engines"</strong> means the large language model-based search and chat platforms monitored by BrandGEO, currently: ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic), Perplexity AI, and Google AI Mode (Google). The engines available to a given client depend on their plan.</li>`
  - L170 `<li>Structured query execution across five AI engines using live web search where available</li>`
- **Code says:** `planConfig.ts:65-66` gives `growth_pro` and `managed` seven engines each.
- **Mitigating, and worth stating:** L159's closing sentence, "The engines available to a given client depend on their plan," is a genuine hedge, and L159's list is at least composed entirely of engines that do collect. This is an incomplete definition rather than a false one, which is why it is MEDIUM and F3 is CRITICAL. L170 has no such hedge.
- **Replacement L159:** `... currently: ChatGPT (OpenAI), Gemini (Google), Claude (Anthropic), Perplexity AI, Google AI Mode (Google), Grok (xAI), and Google AI Overviews (Google). The engines available to a given client depend on their plan.`
- **Replacement L170:** `<li>Structured query execution across up to seven AI engines, depending on plan, using live web search where available</li>`

---

**F22. `brandgeo-vs-otterly.html` claims its figures were "verified directly against each provider's own pricing page". BrandGEO's own research record says otterly.ai returned 403 and the figures are secondary-sourced.**

- **Severity:** MEDIUM
- **File:** `brandgeo/web/brandgeo-vs-otterly.html`
- **Line:** 165
- **Says now:** `<p class="updated-note">Pricing and features current as of July 2026, from publicly listed prices, verified directly against each provider's own pricing page.</p>`
- **Contradicted by:** `docs/research/competitive-and-conversion-2026-07-28.md:13-14`, "otterly.ai returned 403 to a plain client, so its numbers below come from secondary sources and are marked as such", and line 97 of the same file, "Otterly figures are secondary-sourced (403 on direct fetch)".
- **Why this is filed and the other nine sourcing notes are not:** this is not a missing citation, it is a **false provenance claim on a legal surface**. The page asserts a verification step that the project's own records say did not happen, about a named competitor's prices. That is materially different from an unsourced estimate, and it is the one competitor-page finding that a lawyer would care about more than a marketer would.
- **Replacement:** `Pricing and features current as of July 2026. BrandGEO's prices are verified against our own live pricing page. Otterly.AI's published pricing page blocks automated access, so its figures are drawn from secondary sources and should be treated as indicative.`
- **Follow-on, not a finding:** the same doc flags that Otterly's numbers need a first-party check before appearing in public copy. They already appear in public copy, at `brandgeo-vs-otterly.html:187-189`.

---

### LOW

---

**F23. `index.html` describes the done-for-you path as querying 5 engines. Managed gets 7.**

- **Severity:** LOW
- **File:** `brandgeo/web/index.html`
- **Line:** 2272 (heading), 2273 (body)
- **Says now:** `<h3>We query 5 AI engines</h3>` / `<p>We run 20+ tailored queries across ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode, all with live web search active.</p>`
- **Code says:** `planConfig.ts:66` `managed: ['chatgpt','gemini','claude','perplexity','google_ai','grok','ai_overview']`.
- **Why LOW:** it understates rather than overstates, and no customer is short-changed. But this section describes the EUR 1,500 tier and it now advertises fewer engines than the EUR 449 tier does 150 lines further down the same page.
- **Replacement:** `<h3>We query 7 AI engines</h3>` / `<p>We run 20+ tailored queries across ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, Grok and Google AI Overviews, all with live web search active.</p>`

---

**F24. `index.html:2149` scopes the sentiment claim to 5 engines.**

- **Severity:** LOW
- **File:** `brandgeo/web/index.html`
- **Line:** 2149
- **Says now:** `<li>Every response, across all 5 engines, is scored for sentiment, not just presence.</li>`
- **Code says:** 7 on Growth PRO and Managed (`planConfig.ts:65-66`).
- **Defensible reading, stated rather than filed as certain:** this sits in a proof section that describes the standard product, and Growth is the "Most Popular" tier at `index.html:2387`, so scoping the claim to Growth's five engines is a legitimate editorial choice rather than an error. Filed at LOW so the fix pass makes the choice deliberately instead of inheriting it.
- **Suggested replacement if the fix pass agrees it should scale:** `Every response, across every engine on your plan, is scored for sentiment, not just presence.`

---

**F25. Two industry pages name Meta AI in their indexed meta description.**

- **Severity:** LOW
- **Files and lines:**
  - `ai-visibility-for-education.html:33` `"description": "How education and EdTech brands ... get recommended by ChatGPT, Gemini, Claude, Perplexity, and Meta AI, and how to improve it."`
  - `ai-visibility-for-restaurants.html:32` `"description": "How restaurants and hospitality brands get recommended by ChatGPT, Gemini, Claude, Perplexity, and Meta AI: real 2026 data and a practical checklist."`
- **Defensible reading:** both describe how brands get recommended **by AI engines generally**, not what BrandGEO monitors. Meta AI is a real consumer AI assistant and a brand genuinely can be recommended by it. Read strictly, neither sentence is false.
- **Why filed anyway, at LOW:** these are the snippets that appear in search results and in AI answer citations for a company selling AI answer-engine visibility, and every equivalent sentence elsewhere on the site is being corrected. Leaving these two is a consistency decision, not a correctness one.
- **Replacement:** `ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode`

---

**F26. `ai-visibility-for-home-services.html:232` advises readers to check Meta AI and omits Google AI Mode.**

- **Severity:** LOW
- **File:** `brandgeo/web/ai-visibility-for-home-services.html`
- **Line:** 232
- **Says now:** `<strong>Check your actual AI citation share directly, on a recurring basis</strong> (across ChatGPT, Gemini, Claude, Perplexity, and Meta AI) rather than assuming a strong Google ranking already covers it.`
- **Defensible reading:** this is advice to the reader about which engines to check, not a claim about BrandGEO's coverage. Nothing in the sentence says BrandGEO does it.
- **Why filed anyway, at LOW:** it is checklist item 7 on a page whose CTA at line 254 offers the BrandGEO audit, so the reader will reasonably infer the list is what the audit covers. It also omits Google AI Mode, which the audit does cover (`_prospect_engines.js:396`), so the advice is worse than the product.
- **Replacement:** `(across ChatGPT, Gemini, Claude, Perplexity, and Google AI Mode)`

---

**F27. Competitor estimates are attributed by class, never by name.**

- **Severity:** LOW
- **Files:** all ten `brandgeo-vs-*.html`
- **Representative unsourced numbers:**
  - `brandgeo-vs-conductor.html:189` "industry median for mid-market deployments is roughly $48,950/yr"
  - `brandgeo-vs-conductor.html:188` "independent estimates put entry-tier annual contracts around $35,000 to 45,000/yr"
  - `brandgeo-vs-conductor.html:190` "estimates range $150,000 to 180,000+/yr, with some large deployments reported above $500,000/yr"
  - `brandgeo-vs-goodie.html:187` "independent reviews report plans starting around $495/mo"
  - `brandgeo-vs-athenahq.html:188` "extra credits ~$0.08 each"
  - `brandgeo-vs-profound.html:190` "third-party estimates put real-world enterprise deployments at roughly $2,000 to 5,000+/month"
  - `brandgeo-vs-profound.html:193` "$1B valuation (Feb 2026 Series C), 700+ enterprise customers, 10% of the Fortune 500"
- **Assessment, and this refutes the finding the brief anticipated:** the brief asked for competitor claims carrying "no date and no source". **Every one of the ten pages carries a dated provenance note at line 165**, and every estimate above except `brandgeo-vs-profound.html:193` is hedged in-line with an explicit attribution class ("independent estimates", "industry estimates", "third-party estimates", "independent reviews report"). That is materially better sourcing practice than the brief assumed, and it is worth recording so the next audit does not re-file it.
- **What is genuinely missing:** no specific publication is ever named. "Industry median is roughly $48,950/yr" is precise to the dollar and attributed to nobody, which is the weakest of the set because the precision implies a single identifiable source. `brandgeo-vs-profound.html:193` states valuation and customer counts as bare fact with a date but no source.
- **Recommendation, not a replacement string:** name the source for any figure quoted to more than two significant figures, and for `:193`. This is a `bg-copy` task with research input, not a mechanical edit. This audit did not verify any competitor claim, per its brief.

---

## 3. Grouped by file, for a file-by-file fix pass

Ordered by severity of the worst finding in each file.

| File | Findings | Lines to touch |
|---|---|---|
| `terms.html` | F1, F2, F3, F20, F21 | 158, 159, 170, 179, 266, 269, 272 |
| `llms-full.txt` | F4, F5 | 46-51, 120, 295 |
| `llms.txt` | F6 | 3-5 |
| `faq.html` | F7, F8, F12 | 46, 47, 379-383, 382, 399-404, 402 |
| `index.html` | F11, F23, F24 | 2149, 2272, 2273, 2475 |
| `get-found-online.html` | F7, F10, F12 | 55, 253, 279 |
| `glossary.html` | F10 | 315 |
| `brandgeo-vs-goodie.html` | F7, F9, F12, F13 | 32, 34, 188, 189, 190, 191, 216, 227, 235 |
| `brandgeo-vs-profound.html` | F7, F9, F14, F27 | 33, 188, 189, 190, 191, 193, 214, 226, 230 |
| `brandgeo-vs-semrush.html` | F7, F9, F15 | 32, 34, 188, 189, 190, 191, 212, 215, 225, 233 |
| `brandgeo-vs-otterly.html` | F7, F9, F12, F22 | 32, 165, 187, 188, 189, 190, 227 |
| `brandgeo-vs-athenahq.html` | F7, F9, F12 | 32, 33, 188, 190, 191, 215, 227, 231 |
| `brandgeo-vs-conductor.html` | F7, F9, F12, F27 | 32, 174, 188, 189, 190, 191, 216, 228 |
| `brandgeo-vs-peec.html` | F7, F9, F12 | 32, 188, 189, 190, 225 |
| `brandgeo-vs-scrunch.html` | F7, F9, F12 | 32, 188, 189, 190, 227 |
| `brandgeo-vs-rankscale.html` | F7, F9 | 188, 189, 191 |
| `brandgeo-vs-ahrefs-brand-radar.html` | F7 only | 190 |
| `bg-001.html` | F16 | 424 |
| `bg-002.html` | F16 | 292 |
| `bg-003.html` | F16 | 350 |
| `bg-004.html` | F16 | 277 |
| `bg-006.html` | F16 | 316 |
| `bg-010.html` | F16 | 323 |
| `ai-visibility-for-ecommerce.html` | F17 | 61, 279 |
| `ai-visibility-for-healthcare.html` | F17 | 58, 280 |
| `ai-visibility-for-saas.html` | F17 | 57, 273 |
| `ai-visibility-for-law-firms.html` | F17 | 56, 329 |
| `ai-visibility-for-hotels.html` | F18 | 53, 309 |
| `blog.html` | F19 | 678 |
| `ai-visibility-for-education.html` | F25 | 33 |
| `ai-visibility-for-restaurants.html` | F25 | 32 |
| `ai-visibility-for-home-services.html` | F26 | 232 |

**Suggested fix order.** Not the table order. Do `llms.txt` and `llms-full.txt`
first: they are two small files, they carry three CRITICAL findings, and they are
the surface that propagates into the engines this product measures. Then
`terms.html`, because it is the only contractual surface. Then `faq.html` and the
EUR 900 sweep across the twelve files in F7, which is close to mechanical. Leave
F9 (the 150-prompt comparison rows) for last and give it to `bg-copy`: correcting
that number reverses the argument several rows are making, so it is a rewrite,
not a replacement.

---

## 4. Checked and deliberately NOT filed

Two audits on this project earned their keep by refuting findings. These are the
ones this pass refused to file, with the reason. Re-filing any of them wastes a
cycle.

**4.1. Meta AI in research pages reporting measured runs. Not a defect.**
27 city pages, `ai-visibility-index-2026-07.html`, `bg-016.html` and `bg-017.html`
report what Meta AI actually answered in past collection runs. Examples:
`bg-017.html:249` ("two rows, both Meta AI, were lost to a transient collection
gap"), `bg-016.html:242`, `ai-visibility-index-2026-07.html:232` ("AI engines
tracked: ChatGPT, Gemini, Claude, Perplexity, and Meta AI"),
`ai-visibility-index-2026-07.html:266` and `:307`. These are measured data.
Rewriting them would falsify the record. The test applied throughout this audit:
**present-tense claim about what BrandGEO does today** is a defect,
**past-tense report of what an engine answered** is data.

**4.2. "Four AI engines" on Berlin, Madrid, Paris, Rome and Chicago. Not a defect.**
`ai-visibility-for-berlin.html:219`, `ai-visibility-for-madrid.html:219`,
`ai-visibility-for-paris.html:219`, `ai-visibility-for-rome.html:219` and `:249`,
`ai-visibility-for-chicago.html:58` and `:356`. Every one describes how many
engines returned a structured ranking in that specific run, for example Chicago's
"All four AI engines that returned a structured ranking (ChatGPT, Claude, Gemini,
Perplexity) named Kirkland & Ellis as the #1 corporate law firm". Measured, not a
plan claim.

**4.3. Meta AI in JSON-LD `about` blocks, keywords, and hero image alt text. Not a defect.**
`bg-001.html:14/31/43/230/268/325`, `bg-002.html:21/40/248`, `bg-003.html:21/40/260`,
`bg-006.html:221`, `bg-010.html:217`, `bg-016.html:35`, `bg-017.html:36`,
`ai-visibility-index-2026-07.html:46`, `glossary.html:41/217/241`. These describe
the AI engine landscape the article is about, or define AI Visibility in general
terms. Meta AI is a real AI assistant and belongs in a list of them. None claims
BrandGEO monitors it. `glossary.html:315` **is** filed (F10) because it says "We'll
audit how ... Meta AI respond", which is a product claim.

**4.4. `index.html:2493` "across all 5 engines". Correct.**
The free snapshot offer. `_prospect_engines.js:396` sets
`FULL_ENGINES = ['chatgpt','gemini','claude','perplexity','google_ai']`, exactly
five. This page gets it right where `get-found-online.html:253` and
`glossary.html:315` get it wrong.

**4.5. `terms.html:189` "One-time query across all five AI engines". Correct.**
Same source as 4.4. The Free Audit genuinely runs five.

**4.6. `faq.html:39` and `faq.html:272-284`. Correct and current.**
The "Which AI engines does BrandGEO monitor?" answer already publishes seven,
correctly names Grok as "the only engine we monitor that reads live X/Twitter",
correctly distinguishes Google AI Overviews from AI Mode, and correctly gates both
to Growth PRO and above. It matches `planConfig.ts:65` exactly, in both the visible
copy and the JSON-LD. **Do not touch it while fixing the rest of `faq.html`.** It is
the model the other answers on that page should be brought up to.

**4.7. `index.html:2424` and the whole Growth PRO card. Correct.**
7 engines, Grok and Google AI Overviews named, 75 prompts, weekly refresh, 30-page
site audit. Every figure matches `planConfig.ts:65`, `:366`, `:379` and `:388`. The
brief's "6 engines" would have broken this. Only line 2475 in the Enterprise card
needs the edit.

**4.8. `index.html` pricing cards and Product JSON-LD. Correct throughout.**
Free 5 prompts (`:2357`), Essentials 20 (`:2379`), Growth 50 (`:2401`), Growth PRO
75 (`:2425`), all matching `planConfig.ts:366`. Growth "5 AI engines" (`:2402`)
matches `planConfig.ts:56`. "Weekly refresh, every plan, same cadence" (`:2403`)
matches `planConfig.ts:379`. All five JSON-LD `Offer` prices correct.
`index.html` contains **zero** occurrences of "Meta AI" (verified by count).
Whoever did the 2026-07-28 and 2026-07-29 passes on `index.html` did them properly;
the drift is everywhere else.

**4.9. The three previously-invalid FAQPage schemas. Fixed.**
Baltimore, Charlotte and Detroit all parse. Verified with `JSON.parse`, not by eye.

**4.10. `article-builder.html` JSON-LD parse failure. Excluded, not a site defect.**
Line 410 is a JS template literal containing `${heroImage ? ... : ''}`. It is
generator source and is excluded from the cPanel upload.

**4.11. `news/real-time-ai-visibility-engine-launch/index.html`. Outside the 79, and defensible.**
Line 190 announces "live tracking across ChatGPT, Gemini, Perplexity, Claude, and
Meta AI". Its `datePublished` is `2026-07-10`, six days before Meta was retired on
2026-07-16. A dated press release records what was announced on that date, so
rewriting it would falsify the record on the same principle as 4.1. **One caveat
worth acting on:** line 190 links the engine list to `/faq.html` as the current
authority, so a reader following that link now lands on a page whose own engine
answer says something different. Either drop the link or add a dated editor's note.
Same file also promises "Microsoft Copilot support coming soon", which
`planConfig.ts:83-84` says has no path (Microsoft ships no public API).

**4.12. `sitemap.xml`.** Checked. No findings in any of the seven categories.

---

## 5. Two things this audit could not settle

**5.1. Growth PRO is invisible to machines.** The EUR 449 tier appears zero times
in `llms.txt` and zero times in `llms-full.txt`, and is absent from every
`brandgeo-vs-*.html` comparison table (all ten jump from Growth EUR 299 to a
"top tier" row citing the retired Pro at EUR 1,500). Fixing F4 puts it in
`llms-full.txt`. Whether it should also get its own row in all ten comparison
tables is a positioning call for `bg-strategy`, not a copy fix, and it interacts
with the open backlog item that Growth PRO still has no Stripe price or checkout
link, so nobody can buy it self-serve regardless of what the site says.

**5.2. Whether the EUR 900 Managed price was ever real.** F7 corrects twelve
pages up to EUR 1,500 on the authority of `planConfig.ts:259` and
`index.html:85`. But `faq.html:402` and `terms.html`-era copy describe EUR 900
with a EUR 1,250 setup fee waived on annual, and a EUR 9,000 annual option, which
is a coherent commercial structure rather than a typo. `terms.html:249` now says
"From EUR 1,500 / month" with "No: onboarding is included in the first month".
If any customer is currently on the EUR 900 structure, correcting the public
pages does not correct their contract, and the price-change clause at
`terms.html:299` requires 30 days written notice before an increase takes effect.
Confirm no live customer is on EUR 900 before treating F7 as purely a copy fix.

---

*Read-only audit. No file in `brandgeo/web/` was modified.*
