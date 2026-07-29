# Prompt generation and site audit: correctness audit

Date: 2026-07-29
Scope: prompt generation (the measurement instrument) and the AI SEO site audit (the advice).
Explicitly out of scope, handled by two other agents running concurrently: the AI Visibility
score and per engine panels, competitor detection and recommendations.
Method: source read on the working tree, runnable probes executed with Node, and read only
queries against the live Supabase project `duiyifepitvugyulobqm`.

Constraint noted: I was instructed to run no git commands, so I could not check `git log`
for any file. Every claim below is against the working tree as it stands today. Where a
finding depends on file history I say so.

Nothing in the repository was edited. Probe scripts were written to the session scratchpad,
outside the repo.

---

## Verdict

**The instrument has three defects that are individually cheap to fix and jointly corrupt
what the product sells.**

1. The prompt classifier cannot see cities or non English text, so 64 percent of the live
   corpus falls into one bucket and 0 percent reaches the bucket the product advertises.
2. Nothing prevents a customer from measuring themselves against their own name, and on one
   paying account that is measurably the entire source of the score.
3. The site audit reports "JSON LD schema: yes, FAQ schema: yes" without ever parsing the
   JSON, on a product whose thesis is being parsed correctly.

Everything downstream inherits these: scores, per category recommendations, and now, since
AI SEO shipped, published content drafts.

Counting only what I could confirm: 11 findings on prompt generation, 10 on the site audit.
Five are High. Four suspicions I started with were refuted by measurement and are recorded
as such rather than filed.

---

## Part A. Prompt generation, the instrument

### Corpus measured

`public.prompts` holds 277 rows across 36 clients: 8 real customers, 27 research tenants,
one dormant. I ported `categorizePrompt` verbatim from `src/lib/promptCategories.ts:45-54`
into Node and ran it over all 277.

```
=== categorizePrompt() over the live corpus ===
[ [ 'discovery', 177 ], [ 'general', 50 ], [ 'problem', 30 ],
  [ 'brand', 17 ], [ 'comparison', 3 ] ]

=== stored p.category ===
[ [ 'geo_category', 205 ], [ 'general', 20 ], [ 'problem_based', 19 ],
  [ 'direct_brand', 16 ], [ 'tool_discovery', 5 ], [ 'discovery', 2 ],
  [ 'large', 2 ], [ 'very_large', 2 ], [ 'brand', 2 ], [ 'mid', 1 ],
  [ 'problem', 1 ], [ 'local', 1 ], [ 'large_scale', 1 ] ]

=== agreement stored vs recomputed ===
18/277
```

Note the shape: `local` is 0 of 277, and `discovery` is 177 of 277 (64 percent).

---

### A1. The `local` category is unreachable for city scoped prompts
**Severity: High. Verdict: CONFIRMED (measured).**

`promptCategories.ts:19` documents the bucket as `'Location-based, "near me", "in <place>"'`.
The regex at `:50` implements only six literal phrases and has no `in <place>` rule at all:

```js
if (/\b(near me|nearby|closest|local|in my area|around here)\b/.test(t)) return 'local'
```

Probe, using prompts taken verbatim from `public.prompts`:

```
PROBE 3 city-scoped prompts taken verbatim from public.prompts:
  "discovery"  <- Best employment law firms in London
  "discovery"  <- Best personal injury law firms in Baltimore
  "discovery"  <- Top-rated solicitors for property purchase in Dublin
  "general"    <- Mejores hoteles boutique en el centro de Madrid
  "general"    <- restaurante rumano tenerife
  "general"    <- am nevoie de un avocat pentru o cesiune in bucuresti

PROBE 5 what DOES reach the local bucket:
  "local"      <- best caterers near me
  "local"      <- local plumbers
  "discovery"  <- best law firm in Boston
```

205 of the 277 live prompts are explicitly city scoped. Zero classify as `local`. Because
`discovery` is checked last and matches on `best|top|recommend|which|good`, nearly all of
them land there instead.

**Why it matters beyond a chip label.** `src/pages/Recommendations.tsx:261-337` computes per
category mention rates and emits a "weakest category below 40 percent" recommendation.
`AIVisibility.tsx:1357-1359` groups prompt performance by the same field. A taxonomy where
one bucket holds 64 percent of prompts and a second holds 0 percent cannot support either.

**Fix.** Add a location rule before the discovery rule. A gazetteer is not needed: a
capitalised token following `in|din|en|near|around`, or a market aware check against
`clients.default_market_id` and `default_region_id`, both of which are already on the row and
already used by `buildSystemContext` in the collectors.

---

### A2. The classifier is English only, so every non English tenant collapses to `general`
**Severity: High. Verdict: CONFIRMED (measured).**

All five regexes in `categorizePrompt` are English keyword lists. Probe:

```
PROBE 4 non-English prompts against English-only keyword lists:
  "general"  <- Ce firma de catering recomanzi pentru un eveniment corporate de 500 de persoane?
  "general"  <- costurile medii pentru servicii legale in Romania
  "general"  <- restaurante comida tradicional en adeje
  "general"  <- ai talent markeplace
```

Three of the eight real customers operate in a non English market: Bucate pe Roate (RO, 6
active prompts), Paunescu and Asociatii (RO, 4), Restaurante Transilvania (ES, 2). Every one
of their prompts is uncategorisable by this function.

The contradiction is inside the product: `Prompts.tsx:26` rule 2 correctly tells the
generator to "Write in the language the business operates in", and then the function that
files the result reads only English.

**Fix.** Either localise the keyword lists per `default_market_id`, or drop the regex
approach and take the category from the generating model, which already sees the language.
See A4: the model is already being asked for a category and the answer is discarded.

---

### A3. Own brand prompts guarantee a mention, and are the sole source of one paying client's score
**Severity: High. Verdict: CONFIRMED (measured against production).**

There is no guard anywhere in the add path. `Prompts.tsx:228` calls `categorizePrompt`, which
files a self naming prompt as `brand` (`promptCategories.ts:48`) and then stores it like any
other. Nothing warns the user, nothing excludes it from scoring, nothing flags it in the UI.

Measured across `ai_results` for customer tenants, splitting on whether the prompt text
contains the client name:

| Client | Prompt names the brand | Checks | Mentioned |
|---|---|---|---|
| Edyta Andrzejczak (Growth) | no | 30 | **0.0 percent** |
| Edyta Andrzejczak (Growth) | yes | 5 | **100.0 percent** |
| Bucate pe Roate (Managed) | no | 65 | 63.1 percent |
| Paunescu and Asociatii | no | 12 | 0.0 percent |
| Alexandru Teodor | yes | 3 | 0.0 percent |
| Restaurante Transilvania | no | 8 | 0.0 percent |
| Talentwelove (Managed) | no | 2 | 0.0 percent |
| BrandGEO | no | 26 | 0.0 percent |

For Edyta Andrzejczak the split is total. One prompt of her eight, "Who is Edyta
Andrzejczak?", is mentioned in 5 of 5 engine answers. The other seven are mentioned in 0 of
30. Her AI Visibility score is produced entirely by asking the engines about her by name.

Two more accounts are exposed to the same effect, and worse in proportion:

- **Alexandru Teodor**: 1 active prompt, "Synapse working with Alexandru Teodor". That is
  100 percent of the tenant's instrument. (It currently scores 0 because `brand_aliases` is
  empty, see the out of scope note below, so the inflation is masked by a second defect.)
- **Ai Fy** (free): 1 of 2 active prompts, "how much does Ai Fy cost compared to others".

The product knows this is wrong elsewhere. `_prospect_prompts.js:104` instructs the free
audit's generator: "NEVER include the domain name or the business's own name in the prompts,
they must be the kind of question someone would ask BEFORE knowing this business exists."
That rule exists for anonymous prospects and not for paying customers.

**Fix.** Three places, in order of value. (1) Reject or hard warn on add and on edit when the
prompt text matches any `brand_aliases` entry or the `brand_website` root; the alias regex
builder in `_analysis.js` already does this matching and can be reused. (2) Add the same
"never name the brand" rule to `buildSystemPrompt` in `Prompts.tsx:24-34`. (3) Decide
explicitly whether `category = 'brand'` prompts count toward the visibility score; if they
are kept as a deliberate "branded search" measure, they must be scored in a separate panel,
not blended into the headline number.

---

### A4. `buildSystemPrompt` asks for a taxonomy that does not exist, and discards the answer
**Severity: Medium. Verdict: CONFIRMED (source).**

`Prompts.tsx:29-33` instructs the model:

```
5. Assign a category to each prompt:
   - "general"    -> discovery, recommendations, brand lookups
   - "local"      -> city/region/neighborhood-specific searches
   - "comparison" -> vs competitors, alternatives, ranking queries
   - "use_case"   -> specific scenarios, occasions, industries
```

Two problems. `use_case` is in no taxonomy in this codebase: `PROMPT_CATEGORIES`
(`promptCategories.ts:16-23`) defines discovery, comparison, local, problem, brand, general.
And `general` is described here as covering "brand lookups", which is the opposite of what
A3 says it should do.

Then the answer is thrown away. Both parse sites read only `text`:

- `Prompts.tsx:137-140` (auto generate)
- `Prompts.tsx:323-326` (chat)

`categorizePrompt` re-derives the category from the text a moment later. So the model is
being paid to produce a field that is parsed out of the JSON and dropped, using a vocabulary
that does not match the one the product stores.

**Fix.** Either honour the model's category (and fix the vocabulary to match
`PROMPT_CATEGORIES`), which also fixes A2 for free since the model reads the language, or
delete rule 5 and stop paying for the tokens.

---

### A5. The onboarding path never runs the classifier
**Severity: Medium. Verdict: CONFIRMED (source).**

`netlify/functions/onboard-client.js:175` hardcodes every seeded prompt:

```js
.map((text, idx) => ({
  client_id: client.id,
  text: text.trim(),
  category: 'general',
  is_active: true,
  position: idx + 1,
}))
```

Every client onboarded through the wizard starts with 100 percent `general`. The per category
analysis in `Recommendations.tsx` sees a single bucket for the life of the account unless
someone re-edits every prompt by hand. This is a straightforward contributor to the 6.5
percent agreement figure below.

**Fix.** `categorizePrompt` is a pure function with no React or Vite dependency. Either port
it to a CommonJS helper the function can require, or have the wizard categorise client side
before POSTing (it already imports the module).

---

### A6. Stored categories and the live classifier disagree on 259 of 277 rows
**Severity: Medium. Verdict: CONFIRMED (measured).**

Agreement is 18 of 277, 6.5 percent. Thirteen distinct slugs are stored against six defined.
The four largest stored slugs (`geo_category` 205, `problem_based` 19, `direct_brand` 16,
`tool_discovery` 5) account for 245 of 277 rows and none of them exists in
`PROMPT_CATEGORIES`.

The practical consequence is a silent reclassification on edit. `Prompts.tsx:202` recomputes
the category from the edited text. The Paunescu prompt "am nevoie de un avocat pentru o
cesiune in bucuresti" is stored `local` and, per Probe 3, recomputes to `general`. Fixing a
typo in a prompt moves it out of its bucket and changes what
`Recommendations.tsx:337` reports as the weakest category.

**Fix.** Run a one time backfill through the corrected classifier (after A1 and A2 land) and
then treat the stored value as derived, not authored. A third copy of the legacy label map
lives at `Recommendations.tsx:134` and should be deleted in the same pass.

---

### A7. `suggest-prompts.js` is an unmetered LLM proxy for any authenticated account
**Severity: Medium (High if the free tier is public). Verdict: CONFIRMED (source).**

The whole function is 46 lines. After `requireAuth(event)` and a method check it does this:

```js
body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: body.messages,
  max_tokens: body.max_tokens ?? 800
})
```

`body.messages` is forwarded verbatim, unvalidated and unbounded. `body.max_tokens` is caller
controlled with no clamp. There is no plan gate, no per user counter, and no rate limit:
`requireAuth` is called with no options, so `clientId` is null and `checkCollectionLimits`
(`_auth.js:180-215`) never runs. That function is the only rate limiter in `_auth.js` and it
is keyed on `ai_results` row counts, which this endpoint never touches.

Exploit path: sign up for the free tier, obtain a Supabase session token, POST arbitrary
`messages` to `/.netlify/functions/suggest-prompts` in a loop with a large `max_tokens`. Every
call bills BrandGEO's `OPENAI_API_KEY`. There is currently a free tier account in
`public.clients` belonging to a competitor who self service signed up to evaluate the product.

**Fix.** Clamp `max_tokens` server side. Cap message count and total input characters. Add a
per client hourly counter, or build the system prompt server side from `client_id` and accept
only the user's free text turn, which is the safer shape anyway and removes the ability to
override the system message.

---

### A8. Near duplicate suggestions are deduped on exact string equality only
**Severity: Low. Verdict: CONFIRMED (measured).**

`Prompts.tsx:139`, `:267` and `:325` all use `existing.text === p.text`. Anything short of
byte identity gets added and consumes a prompt slot and a collection run on every engine,
every cycle.

Live evidence from client 2. One pair is byte identical and stored twice, which means even
the exact check did not hold across sessions:

```
=== exact duplicates (normalized) within a client ===
2 BrandGEO | What is BrandGEO and what does it do? <<>> What is BrandGEO and what does it do?

=== near-duplicate pairs (token Jaccard >= 0.6) within a client ===
2 1.00 | What is BrandGEO and what does it do? || What is BrandGEO and what does it do?
2 0.89 | What is Generative Engine Optimization (GEO) and which tools offer it?
        || What is Generative Engine Optimization and which tools offer it?
2 0.86 | Alternatives to BrandGEO for monitoring brand mentions in AI chatbots
        || Alternatives to BrandGEO for monitoring brand mentions in AI
2 0.69 | How to measure my brand presence across ChatGPT, Gemini, Claude, Perplexity and Meta AI?
        || How to benchmark brand performance across ChatGPT, Gemini, Claude, Perplexity and Meta AI
2 0.63 | BrandGEO review, is it worth it for AI visibility monitoring?
        || BrandGEO review, is it a good tool for AI visibility monitoring?
2 0.63 | How can I improve my brand's visibility in AI-generated content?
        || How to improve brand visibility in AI-generated answers
```

All six pairs are on the BrandGEO tenant and all are currently inactive, so no live spend is
being wasted. The mechanism is live for every tenant.

**Fix.** Normalise (lowercase, strip punctuation, collapse whitespace) before the equality
check, and warn above a token Jaccard threshold rather than blocking.

---

### A9. The prospect fallback prompt set names the brand, but has never fired
**Severity: Low. Verdict: CONFIRMED in code, REFUTED in production.**

`_prospect_prompts.js:147-157`, taken when there is no OpenAI key or the call or parse fails:

```js
const base = domain.split('.')[0].replace(/[-_]/g, ' ')
prompts: [
  `best companies like ${base}`,
  `top alternatives to ${base}`,
  `recommended providers similar to ${base}`,
],
```

`buildProspectAliases:189-190` then makes that same `domainRoot` the first alias fed to
`analyseResponse`. Every prompt on this path names the entity being measured, which is the
A3 failure mode built into the code rather than entered by a user. It is worse here because
`SCREENING_PROMPT_COUNT` is 4 (`audit-domain.js:34`) and the fallback returns 3, so 100
percent of a screening audit would be self naming.

**I tried to refute this and succeeded.** Across all 58 real audits in `prospect_audits`
(348 generated prompts, 2026-07-09 to 2026-07-26):

- 4 of 348 prompts contain the domain root, and all 4 are false positives: the root
  `customer` matching the ordinary word "customer" in `customer.io`. Zero genuine brand
  naming.
- All 3 `low_confidence` audits still carry 6 LLM generated prompts, not the 3 prompt
  fallback shape. The fallback has never executed in production.

So the LLM has obeyed the "never name the brand" instruction perfectly, and the risk is
latent only. Recording it because the path is one OpenAI outage away from firing, and because
the instruction at `:104` is never verified after generation (see the fix).

**Fix.** Post filter the generated array against `buildProspectAliases(domain, brandName)`
and drop any prompt that matches, on both the LLM path and the fallback. Replace the fallback
strings with category based ones, or fail the audit rather than publishing a structurally
inflated score.

---

### A10. The free audit asks head terms a niche business cannot win, and publishes the zero
**Severity: Medium. Verdict: CONFIRMED, with a stated limit on the causal claim.**

`_prospect_prompts.js:104` asks for "generic buyer research questions". There is no rule about
matching the business's real scale or niche. The dashboard's own generator has exactly that
rule and it is the better one (`Prompts.tsx:27`): "Match the REAL scale and niche of this
business, do NOT generate queries about Fortune 500 competitors unless this is that kind of
business."

Measured over the 348 production prompts:

| Property | Count |
|---|---|
| Total generated prompts | 348 |
| Open with "best" or "top" | 142 (41 percent) |
| Contain "how to" | 64 |
| Contain any digit | 3 |

Score distribution across the 58 completed audits:

| Score band | Audits |
|---|---|
| exactly 0 | **26 (45 percent)** |
| 33 | 1 |
| 41 to 56 | 12 |
| 61 to 79 | 11 |
| 82 to 90 | 8 |

The distribution is bimodal: a brand is either well known or entirely absent, with almost
nothing between. That is the shape you get from head terms that only established brands win.

Concrete case, and the clearest one. `jetpackworkflow.com`, audit 34, `low_confidence: true`,
which means `fetchHomepageSignal` failed and the model inferred purely from the domain
string. It produced category "workflow management software" and these six prompts:

```
best workflow management tools for small businesses
top software for automating business processes
how to improve team collaboration with workflow tools
affordable project management software for startups
features to look for in workflow management solutions
user reviews of popular workflow automation tools
```

Jetpack Workflow is practice management software specifically for accounting firms. Not one
prompt says accounting. The audit asked Asana and Monday questions and published
`ai_score: 0`. Audit 31, `antidote.legal`, is the same story: "best legal services for
startups", `ai_score: 0`.

**The limit on this claim, stated plainly.** A 0 can also be a true finding, and with n = 3
low confidence audits (2 of which scored 0, against a 45 percent base rate) I cannot show
statistically that low confidence causes zeros. What I can show, and do show above, is that
when the homepage fetch fails the category is guessed from the domain string alone, the
prompt set is built on that guess, and a 0 out of 100 scorecard is still published to the
prospect.

**Fix.** Add the scale and niche rule from `Prompts.tsx:27` to
`_prospect_prompts.js`'s system prompt. Require at least two prompts to carry a
qualifier (industry, segment, or geography) drawn from the homepage signal. And when
`lowConfidence` is true and `ai_score` is 0, do not publish a number: publish "we could not
read your homepage, so we could not tell what to ask", which is both true and a better sales
motion than a false zero.

Credit where due: `low_confidence` is honestly surfaced to the prospect
(`AuditReport.tsx:172`, "We couldn't fully analyse your homepage, so this is a
lower-confidence estimate"). The gap is that the wording communicates uncertainty about the
analysis, not that the questions themselves may have been the wrong ones.

---

### A11. No quality validation on manually entered prompts
**Severity: Low. Verdict: CONFIRMED (measured).**

`addPrompt` (`Prompts.tsx:215-258`) checks only that the trimmed text is non empty. Live
example on a paying Managed account, Talentwelove, whose entire instrument is two prompts:

```
"ai talent markeplace"          (typo, 1 check, 0 mentions)
"ai talent acquisition agency"  (1 check, 0 mentions)
```

A misspelled prompt is not what a buyer types, so whatever it measures is not what the
product claims to measure. Two prompts is also below any threshold at which a percentage
score means anything, and nothing tells the customer that.

**Fix.** A minimum length check and a soft warning below N active prompts would cover both.
The `AllowanceMeter` component already exists and could show a floor as well as a ceiling.

---

### Refuted, and positives worth recording

Four things I suspected and could not sustain. Filing them here so nobody re-files them.

1. **"The category filter chips on /prompts match nothing."** False.
   `Prompts.tsx:343` derives the chips from the categories actually present on the client's
   rows, not from `PROMPT_CATEGORIES`, and `promptCategoryLabel` prettifies unknown slugs.
   Legacy categories remain filterable. The taxonomy incoherence is real (A6) but it does not
   break the filter.
2. **"The prospect generator leaks the brand name into prompts."** Refuted by measurement:
   0 genuine cases in 348 production prompts. See A9.
3. **"The prospect generator emits duplicates within one audit."** Refuted: zero audits have
   a repeated prompt text.
4. **"The prompt cap is display only."** False, and the opposite of a defect. `enforce_prompt_cap()`
   is a `SECURITY DEFINER` trigger with a pinned `search_path`, it correctly exempts
   `service_role` and `postgres` and `is_admin()`, it lets UPDATEs through so a capped
   customer can still fix a typo, and its unknown plan fallback is deliberately the FREE cap
   with a comment explaining why that is stricter than `_cost.js`'s essentials fallback. This
   is the best written piece of enforcement I read in either scope.

---

### Noted in one line, other agents' scope

- `Restaurante Transilvania` (client 24) and `Alexandru Teodor` (client 27) have empty
  `brand_aliases`, so `analyseResponse` can only match on the website domain. Instrument
  configuration, but the consequence lands in the score.
- `Recommendations.tsx:134` carries a third independent copy of the category label map.

---

## Part B. The site audit, the advice

### B0. Does the audit test the product's thesis, or is it a relabelled SEO checklist?

Asked plainly, answered plainly: **the judge is GEO shaped, the measurement is not.**

The Haiku rubric at `seo-audit-page.js:18` is genuinely about retrieval and citation, and the
criteria are the right ones: does the page answer its core question early, are there
standalone quotable claims with no dangling "it" or "the platform", is list content in real
lists, are statistics attributed to a checkable source, is the entity named next to its
claims. Those are not SEO criteria. Somebody thought about this properly.

But the only things actually **measured** and handed to that judge are, from
`_seo_crawl.js:137-144`: title, meta description present yes or no, H1 count, word count,
table present, list present, a `<script type="application/ld+json">` present, and whether the
string "faqpage" appears somewhere inside it. Every one of those is a conventional SEO
checklist item from 2010. Each GEO specific judgement in the rubric is delegated whole to one
small model reading extracted text, with no structured evidence behind it and no
determinism.

So the product does not currently test its own thesis. It asks Haiku to eyeball it. And the
single structured signal that would test the thesis directly, whether the structured data
actually parses, is the one that is faked. That is B1.

---

### B1. The audit certifies JSON LD and FAQ schema without ever parsing the JSON
**Severity: High. Verdict: CONFIRMED (executed).**

`_seo_crawl.js:165-176` is the entire structured data check:

```js
function detectSignals(html) {
  const jsonldBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]);
  const faq = jsonldBlocks.some((b) => /faqpage/i.test(b));
  return { jsonld: jsonldBlocks.length > 0, faq, ... };
}
```

`jsonld` is a tag count. `faq` is a case insensitive substring search for the word "faqpage"
in raw text. There is no `JSON.parse` in this file, and a grep for `ld+json`, `JSON-LD`,
`jsonld`, `FAQPage` and `schema.org` across the whole of `netlify/functions/` and `src/`
returns only these lines plus prompt copy. **Nothing in this product ever parses structured
data.**

I reconstructed the exact defect this repository is recorded as having shipped to production
on three city pages (the last FAQ entry closing with `"}]` instead of `"}}]`, leaving
`acceptedAnswer` unclosed) and ran the shipped function against it:

```
PROBE 1 detectSignals on INVALID FAQPage -> {"jsonld":true,"faq":true,"table":false,"list":false,"h1":1}
  JSON.parse: THROWS -> Expected ',' or '}' after property value in JSON at position 230

PROBE 2 detectSignals on JSON-LD merely MENTIONING FAQPage -> {"jsonld":true,"faq":true,...}
```

Probe 2's input is `{"note":"we plan to add FAQPage later"}`. It scores an FAQ schema.

That signals line is then embedded in `content_md` (`_seo_crawl.js:141-144`) and handed to
Haiku, which is told at `seo-audit-page.js:18` to judge "is there an FAQ and **valid**
structured data (JSON-LD)". The word "valid" is in the prompt. The evidence behind it cannot
distinguish valid from invalid, or even schema from a stray mention.

**Exploit path, non adversarial:** a customer ships a broken FAQPage exactly as this repo did.
BrandGEO crawls it, reports "FAQ schema: yes", Haiku scores the page well on structured data,
the customer sees a good `geo_score`, and the schema is silently dropped by every engine that
matters. The product's core promise fails in the one place it claims to specialise.

**Fix.** `JSON.parse` each block inside a try/catch and report three states, not two:
`jsonld: valid | invalid | absent`. Read `@type` from the parsed object rather than regexing
the raw string, and check `mainEntity` is a non empty array for FAQPage. Surface an invalid
block as a High severity issue in its own right, before Haiku is ever called, since a parse
failure is a hard fact and does not need a model to adjudicate it. This is roughly fifteen
lines and it is the highest value change in this report.

---

### B2. Nothing validates what `seo-draft.js` writes, beyond a sentence in the prompt
**Severity: High. Verdict: CONFIRMED (source).**

The question was: what stops it inventing statistics or facts about the client, and is any
JSON LD it emits validated before handover. The answers are: a prompt instruction, and no.

The instructions are there and they are well written. `seo-draft.js:48` says "use ONLY these
as the factual basis; invent nothing beyond them, no fake statistics, customers, or results",
and `:55` says "Attribute any number to a clear, checkable source; if you were not given a
source, do not state the number."

The post processing, `:198-216`, is the complete list of what is enforced:

- `deDash()`, replacing em and en dashes with commas
- `.trim()`
- `clampScore()` on the two self reported scores, `.slice(0, 500)` on notes
- `verdict` coerced to `ready` or `needs_revision`

No number extraction. No cross check of any figure against `brief.context`. No entity check.
No schema parse. The draft is written straight to `seo_briefs.draft_text` and rendered.

Worse, the grounding it is given is thin enough to make invention likely. `brief.context` is
built deterministically by `seo-opportunities.js:71-73` and is one or two sentences of
BrandGEO's own gap data, for example "AI-answer gap: for the query X, BRAND was mentioned in
0 of 5 recent AI answers." That is the entire factual basis. Meanwhile the outline at
`seo-opportunities.js:60` instructs the writer to produce "The specific, checkable facts:
services, coverage, credentials, results". The draft is being asked for facts about the
client that it was never given and has no way to obtain. The only thing standing between
that and a fabricated credential is the model choosing to obey `:48` over `:60`.

**Fix, in order.** (1) Extract every numeral and percentage from `draft_text` and flag any
that does not appear in `brief.context`; show them to the user for confirmation rather than
publishing silently. (2) If the draft contains a JSON LD block, parse it and reject the draft
if it throws, same helper as B1. (3) Reconcile the contradiction between `seo-draft.js:48`
and `seo-opportunities.js:60`: either feed real brand facts into `context` (the brand kit
built for AI Social already holds some) or stop asking for credentials and results.

---

### B3. `PLAN_SEO_AUDITS_PER_WEEK` is enforced nowhere, and re-audits are unlimited
**Severity: High (cost), Medium (entitlement). Verdict: CONFIRMED (source).**

A grep for `PLAN_SEO_AUDITS_PER_WEEK` across the repo returns exactly two hits:
`planConfig.ts:407` where it is declared, and `SEO.tsx:18` where it is discussed. No Netlify
function reads it.

`seo-audit-page.js` is where the work happens and where the money is spent. Its complete gate
is: `requireAuth`, a method check, `client_id` and `page_id` present, an ownership check at
`:85`, and an API key check. **There is no plan check, no weekly counter, and no guard against
re-auditing a page that is already `status: 'audited'`.**

The UI makes this trivially reachable rather than theoretical: `SEO.tsx:216` renders a
"Re-audit" button on every audited page, and `:443` runs an audit-all loop over the page list.
Each press is a Haiku call over up to 12000 characters of page content with `max_tokens: 1500`,
and each one overwrites the previous `geo_score` for that page.

Credit: `SEO.tsx:18-21` documents this honestly and in place, calling the constant
"aspirational until seo-crawl.js is updated to key off it". This is a known gap, not a hidden
one, which is why the severity is on the cost and not on the concealment.

The effective limit today is the 7 day crawl cooldown in `seo-crawl.js:57-70`, which is
correctly implemented and does bound how often the page list refreshes. It does not bound
auditing the existing list.

**Fix.** Count audits in a window in `seo-audit-page.js` against `PLAN_SEO_AUDITS_PER_WEEK`,
mirrored into a CommonJS constant the way `_cost.js` already mirrors `ENGINE_COST_EUR`. A
cheaper first step: skip the LLM call entirely when `status === 'audited'` and
`content_md` has not changed since `fetched_at`, and make Re-audit an explicit force flag.

---

### B4. Page cap and draft cap have drifted from `planConfig`, in the permissive direction
**Severity: Medium. Verdict: CONFIRMED (source).**

Three tables that are supposed to agree:

| Plan | `planConfig.ts:401` `PLAN_SEO_PAGE_CAP` | `seo-crawl.js:16` `CRAWL_PAGE_CAP` | `planConfig.ts:413` drafts | `seo-draft.js:28` `DRAFT_MONTHLY_CAP` |
|---|---|---|---|---|
| free | 0 | 0 | 0 | 0 |
| **essentials** | **0** | **1** | **0** | **2** |
| growth | 10 | 10 | 10 | 10 |
| growth_pro | 30 | 30 | 30 | 30 |
| managed | 100 | 100 | 60 | 60 |

Only the `essentials` row diverges, and it diverges in both function files, in the same
direction. `planConfig.ts:398-400` records the reason: the feature was moved to Growth plus on
2026-07-29 and `FEATURE_MIN_PLAN.ai_seo` is `'growth'`. Neither function file was updated,
and both carry a "Keep in sync with planConfig.ts" comment that is now false.

The UI locks correctly: `SEO.tsx:452` and `Layout.tsx:156` both use `hasFeature(plan, 'ai_seo')`.
So the lock is client side only, and the server does not agree with it.

**Exploit path.** An Essentials customer, or anyone with an Essentials session token, POSTs
`{client_id}` to `/.netlify/functions/seo-crawl`. `CRAWL_PAGE_CAP['essentials']` is 1, which
is greater than 0, so the crawl runs. They can then POST to `seo-audit-page` (no gate at all,
per B3) and to `seo-draft` for 2 drafts a month. Small in euros. Real as an entitlement leak,
and it is precisely the failure mode `planConfig.ts:304-306` warns about for `ai_social`:
"until 2026-07-29 there was NO server-side gate at all, so the UI lock was bypassable by a
direct POST."

**Fix.** Set `essentials: 0` in both function tables. Better: add a shared
`_plan_limits.js` CommonJS mirror generated from or checked against `planConfig.ts`, and have
every `seo-*` and `social-*` function read from it, so this cannot drift silently again.
`seo-opportunities.js` has no plan gate whatsoever and should get one from the same helper.

---

### B5. The draft cap counts the wrong thing, and cannot bind at the top plans
**Severity: Medium. Verdict: CONFIRMED (source).**

`seo-draft.js:172-177`:

```js
const { count } = await supabase
  .from('seo_briefs')
  .select('*', { count: 'exact', head: true })
  .eq('client_id', client_id)
  .gte('drafted_at', monthStartIso());
if ((count || 0) >= cap) { ... }
```

This counts **briefs that have been drafted this month**, not **drafts generated**. Drafting
updates the existing brief row (`:218-226` sets `draft_text` and `drafted_at` on the same
`brief.id`), so redrafting one brief fifty times leaves the count at 1. Fifty Haiku or Sonnet
calls, one against the cap.

In the other direction the cap is unreachable. `seo-opportunities.js` can produce at most
`MAX_GAP_BRIEFS` 6 plus `MAX_REC_BRIEFS` 4 plus one competitor brief, so 11 briefs total per
client. Caps of 30 (growth_pro), 60 (managed, pro) and 200 (enterprise) can never be hit.
Only the Growth cap of 10 can bind, and only at 10 of a possible 11.

**Fix.** Count generations, not briefs. Either an append only `seo_drafts` table, or a
`draft_count` column incremented on each generation with the window keyed off it. Either way
the cap should also bound repeat generations of the same brief, which is where the cost
actually is.

---

### B6. Briefs are generated off a single engine response, and "biggest gap first" is not true
**Severity: Medium. Verdict: CONFIRMED (source and measured).**

`_geo_signals.js:69`:

```js
for (const [pid, s] of stat.entries()) {
  if (s.checks < 1) continue;
  const rate = s.mentions / s.checks;
  if (rate >= 1) continue;
```

`checks < 1` admits a prompt with exactly one recorded engine answer. One data point becomes
`rate: 0.0`, which sorts to the top, which becomes the first content brief, which tells the
customer to write and publish a whole page.

Live confirmation. Querying `ai_results` for customer tenants over the same 90 day window
`_geo_signals.js` uses:

```
client_id 19 Talentwelove   prompt 271  checks 1  mentions 0
client_id 19 Talentwelove   prompt 272  checks 1  mentions 0
client_id 26 Ai Fy          prompt 280  checks 1  mentions 0
client_id 26 Ai Fy          prompt 281  checks 1  mentions 1
```

Talentwelove is on Managed. If they open AI SEO today, both their prompts qualify as maximum
severity gaps and the guidance string (`seo-opportunities.js:66`) will read "Talentwelove
appears in none of recent AI answers for 'ai talent markeplace'." One engine, one run, one
misspelled prompt, presented as a finding worth a new page.

Second, smaller defect in the same function. `_geo_signals.js:76` sorts by `rate` ascending
and the comment claims "biggest gap (lowest mention rate) first". But 0 of 1 and 0 of 15 both
give `rate === 0`, and `Array.prototype.sort` is stable in V8, so all zero mention prompts
retain Map insertion order, which is the order Supabase returned the `ai_results` rows.
**Which 6 of them become briefs is arbitrary, not worst first.**

**Fix.** Require a minimum `checks` (3 is defensible: one prompt across three engines) before
a gap is eligible, and surface prompts below it as "not enough data yet" rather than
suppressing them. Break ties on `checks` descending so a 0 of 15 outranks a 0 of 1.

---

### B7. A bad prompt becomes a published page
**Severity: Medium. Verdict: CONFIRMED (source, chain traced).**

The chain runs unbroken from Part A into Part B, with no validation at any hop:

1. `prompts.text`, entered with no quality check (A11), classified by a broken classifier
   (A1, A2).
2. `_geo_signals.js` marks it a gap on as little as one engine response (B6).
3. `seo-opportunities.js:55` builds a brief titled ``Create content that answers: "<prompt>"``
   and sets `target_prompt` to the raw prompt text.
4. `seo-draft.js:47` feeds it to the writer as: "It should be the best possible answer to this
   real buyer query: <prompt>".
5. The draft is written, self scored, and handed to the customer to publish, and per the
   `FEATURE_META` copy, handed on to AI Social.

So "ai talent markeplace" is currently one click from being the stated target query of a
generated page. Every defect in Part A now has a publishing consequence, which it did not
have before AI SEO shipped.

One accidental mercy worth noting: a brand naming prompt (A3) sits at a 100 percent mention
rate and is filtered out by `rate >= 1` at `_geo_signals.js:71`, so it never becomes a brief.
That is luck, not design.

**Fix.** Validate `target_prompt` at the brief boundary: minimum length, and skip prompts that
match the client's own aliases. Cheaper still, fix the prompts (A3, A11) and this hop
inherits the fix.

---

### B8. Which pages get audited is arbitrary, and is presented as an audit of "your site"
**Severity: Medium. Verdict: CONFIRMED (source).**

`_seo_crawl.js:41-49` takes sitemap URLs in document order, filters to same host and robots
allowed, and stops at `maxPages`:

```js
for (const u of urls) {
  ...
  picked.push(norm);
  if (picked.length >= maxPages) break;
}
```

There is no prioritisation by traffic, link depth, page type, or template. A Growth tenant
with 500 URLs gets whichever 10 their sitemap generator happened to emit first, which for most
CMS sitemaps is oldest first or alphabetical. The customer is shown a page list and a set of
per page scores with no statement that this is an arbitrary sample.

Second, smaller issue in the same file. `loadRobots` (`:61-86`) honours `Disallow` and ignores
`Allow` entirely. The common `Disallow: /` plus `Allow: /blog/` pattern causes the crawler to
skip the entire site and fall through to `picked.push(base)` at `:50`, auditing only the
homepage. That over blocks, so it is a correctness bug rather than a politeness one.

**Fix.** Prefer the homepage, then sitemap entries with the most recent `lastmod`, then
shortest path depth. State the selection rule in the UI, one line: "we audited the 10 most
recently updated pages". Add `Allow` handling with longest match wins, which is the documented
precedence rule.

---

### B9. Customer facing grammar defect in the brief guidance
**Severity: Low. Verdict: CONFIRMED (source).**

`seo-opportunities.js:66`:

```js
`${brand} appears in ${g.mentions === 0 ? 'none' : `only ${pct}%`} of recent AI answers for "${g.text}". `
```

When `mentions` is 0 this renders "BRAND appears in none of recent AI answers", which is not
English. The `only ${pct}%` branch reads correctly. Shown verbatim to the customer in the
brief guidance panel.

**Fix.** `'none of the recent AI answers'` for the zero branch, or restructure to
"was not mentioned in any of the N recent AI answers", which also surfaces the sample size
that B6 says is currently invisible.

---

### B10. The per page `geo_score` is one unrepeatable model self report, rendered as a hard number
**Severity: Low. Verdict: CONFIRMED (source).**

`seo-audit-page.js:118` takes whatever integer Haiku returns, clamps it to 0 to 100, and
stores it. There is no rubric weighting, no per criterion breakdown, no temperature setting
(so the API default applies), and no calibration beyond one sentence of prompt: "Be a harsh
grader; 90+ is rare."

`SEO.tsx:202` renders it as a bare number with a colour band, and `:371` orders the page list
by it ascending, so the score determines which pages the customer works on first. Two runs on
the same unchanged page can differ, and the second silently overwrites the first with no
history.

This is not wrong so much as overconfident. The same criticism does not apply to the rubric
itself, which is good (see B0).

**Fix.** Ask for per criterion sub scores and compute the total deterministically from fixed
weights, which makes the number reproducible, explains itself to the customer, and lets the
structured signals from B1 contribute directly instead of via prose. Keep prior scores so a
re-audit shows movement.

---

## Ranked fix list

Ordered by damage prevented per hour of work.

| # | Fix | Findings | Effort |
|---|---|---|---|
| 1 | Parse JSON LD instead of regexing it. Three states: valid, invalid, absent. Report invalid as its own High issue before the model is called. | B1, B2 | S |
| 2 | Reject or hard warn on prompts containing the client's own aliases, on add, on edit, and in `buildSystemPrompt`. Decide whether branded prompts score separately. | A3 | S |
| 3 | Add a location rule to `categorizePrompt` and make it language aware, or take the category from the generating model and delete the regex. | A1, A2, A4 | S |
| 4 | Clamp `max_tokens`, bound `messages`, and add a per client counter on `suggest-prompts.js`. | A7 | S |
| 5 | Set `essentials: 0` in `CRAWL_PAGE_CAP` and `DRAFT_MONTHLY_CAP`. Add a shared CommonJS plan limits mirror so this cannot drift again. Gate `seo-opportunities.js`. | B4 | S |
| 6 | Enforce `PLAN_SEO_AUDITS_PER_WEEK` in `seo-audit-page.js`, and skip the LLM call when the page is already audited and unchanged. | B3 | M |
| 7 | Require minimum evidence (3 checks) before a prompt becomes a gap, and break rate ties on `checks` descending. | B6 | S |
| 8 | Count draft generations, not drafted briefs. | B5 | M |
| 9 | Validate numbers in `draft_text` against `brief.context` and surface unsourced figures for confirmation. Reconcile the contradiction between "invent nothing" and "give me credentials and results". | B2 | M |
| 10 | Add the scale and niche rule to `_prospect_prompts.js`, and suppress the numeric score when `lowConfidence` and the score is 0. | A10, A9 | S |
| 11 | Run the classifier on the onboarding path instead of hardcoding `general`, then backfill the corpus. | A5, A6 | M |
| 12 | Normalise before the duplicate check, and warn on near duplicates. | A8 | S |
| 13 | Prioritise crawl page selection, state the selection rule in the UI, handle `Allow` in robots.txt. | B8 | M |
| 14 | Per criterion sub scores with fixed weights for `geo_score`, and keep history. | B10 | M |
| 15 | Minimum prompt length, and a floor warning below N active prompts. Fix "appears in none of recent AI answers". | A11, B9 | S |

---

## What was not checked

- **The AI Visibility score maths, per engine panels, competitor detection and
  recommendation generation.** Two other agents own these. Where a defect of mine lands in
  their code I noted it in one line and moved on.
- **`_analysis.js` alias matching itself.** I relied on its correctness when reasoning about
  A3 and A9. It was not audited.
- **Git history for any file.** Running git commands was prohibited. Every claim is against
  the working tree as read on 2026-07-29. If any of these files changed recently, my reading
  of "current state" could be stale, though the live database measurements are not.
- **The audit and draft output quality end to end.** I did not trigger a live crawl, audit,
  or draft, because that spends real API budget and writes rows, and the brief was read only.
  `seo_pages` and `seo_briefs` row contents were not sampled. So B2's claim about invented
  facts is reasoned from the absence of any validation code, not from an observed fabrication.
- **Whether the `_seo_crawl.js` text extraction produces faithful markdown** on real customer
  HTML. I read the regex chain and it looked reasonable; I did not run it against a live site.
- **The `seo_pages` and `seo_briefs` RLS policies.** Ownership checks in the function handlers
  were read and are present; the database layer beneath them was not verified.
- **`social-boost.js`**, which shares `_geo_signals.js` and therefore inherits B6. Out of scope,
  but it inherits the same defect.
- **The three research tenant prompt sets as research artifacts.** I classified them as data;
  I did not assess whether they are good research design.
