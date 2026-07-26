# hook-thesis-web.md

Owner: `bg-strategy` · Packet: `.claude/handoffs/001-bg-strategy-hook-and-activation-thesis.md`
Date: 2026-07-26 · Surface: `getbrandgeo.com` (the marketing site only)

This file rules on what a first-time visitor to `getbrandgeo.com` must understand
and in what order. It does not specify layout, components, colour, type, motion,
or final wording. `bg-design` decides how it looks. `bg-copy` decides the words.

Every factual claim below names the file it came from. Claims I could not trace
to a file are labelled and are not used to support any ruling.

---

## 0. What is actually on the page today

Read directly from `brandgeo/web/index.html` and `brandgeo/web/site.js`, not from
any summary document.

**Above the fold** (`index.html:1331` to `1443`): a badge reading "AI Visibility
Platform" (`:1345`), the h1 `Be the brand AI recommends.` (`:1346`), one
paragraph naming ChatGPT, Gemini, Claude, Perplexity and Meta AI (`:1347`), a
domain input plus a button labelled "Check My AI Visibility" (`:1350` to
`:1355`), a trust row reading "5 AI engines · 50+ brands audited · Results in
48h · No credit card" (`:1360` to `:1365`), and on the right a static product
card showing a 64/100 score ring, six dimension bars, a five-engine grid and two
sample fix rows (`:1375` to `:1439`).

**Below the fold, in shipped order**: engines strip (`:1452`), research
credibility band with a DOI link (`:1462`), features grid of six cards
(`:1477`), Brand Sentiment spotlight (`:1518`), How it works (`:1562`),
testimonials (present but commented out with placeholder quotes, `:1587` to
`:1613`), pricing (`:1616`), latest research and news (`:1803`), FAQ (`:1869`),
contact (`:1904`).

**Calls to action currently competing on the page**: nav "Get started" to
`app.getbrandgeo.com/signup` (`:1325`); the hero audit button (`:1355`), which
`site.js:281` binds to `startAudit` and `site.js:73` points at
`app.getbrandgeo.com/.netlify/functions/public-audit`, with a fallback that
redirects to `/signup` carrying the domain (`site.js:87` to `:91`); "See Brand
Sentiment live" to `app.getbrandgeo.com/sentiment` (`:1530`), a route that
`brandgeo-dashboard/src/App.tsx:111` places behind `PrivateRoute`, so a logged
out visitor is sent to `/login`; five pricing buttons (`:1655`, `:1677`,
`:1699`, `:1722`, `:1750`); "Contact Sales" (`:1771`); and "Get my free AI
Visibility Snapshot" to `#contact` (`:1795`).

Seven distinct destinations are offered above and below the fold. That is the
first thing this thesis fixes.

---

## 1. The three-second comprehension target

After three seconds above the fold, a first-time visitor must be able to say
this back, in their own words:

> BrandGEO tells me whether AI assistants recommend my brand when customers ask
> them, and I can check mine right now.

This is a comprehension target, not copy. `bg-copy` writes the sentence the page
actually says. The target has three load-bearing parts, and all three must
survive: what is measured (whether the brand is recommended), whose behaviour is
measured (AI assistants that customers ask), and what the visitor does next
(check their own, immediately).

The current h1 (`index.html:1346`) carries part one and part two implicitly and
carries part three not at all. The supporting paragraph (`:1347`) carries all
three but is a second read, and a second read does not happen inside three
seconds.

---

## 2. The leading pillar

**AI Visibility leads. Brand Sentiment, AI SEO Audit and AI Social are
subordinate above the fold and must not appear as peers there.**

Reason, in one line: AI Visibility is the only one of the four a visitor can
experience before paying anything, so it is the only one that can carry a
three-second promise the product can immediately honour.

The evidence, from `brandgeo-dashboard/src/lib/planConfig.ts`:

- The `free` plan includes exactly one engine, `chatgpt` (`PLAN_ENGINES`,
  `:47`), five buyer prompts (`PLAN_PROMPTS`, `:207`) and a 720 hour collection
  cooldown (`PLAN_COLLECTION_COOLDOWN_HOURS`, `:215`). AI Visibility is
  therefore deliverable at zero price.
- `FEATURE_MIN_PLAN` (`:181` to `:184`) gates `ai_seo` at `essentials` and
  `ai_social` at `growth`. Neither is reachable on `free`.
- Brand Sentiment is not in the `FeatureId` union at all (`:175`), so it is not
  plan gated, but it has no independent entry point: it is a reading of
  collected `ai_results` rows, which is why the marketing site's own sentiment
  section (`index.html:1525`) describes it as scoring "every response, across
  all 5 engines". It cannot exist before an AI Visibility collection has run.

So the subordination is not a taste call. Sentiment is a property of the
visibility data. AI SEO is what the visibility gaps turn into
(`planConfig.ts:194`, the `ai_seo` blurb, describes turning "AI visibility gaps
into ready-to-write content briefs"). AI Social is where those drafts go
(`planConfig.ts:190`, and `planConfig.ts:194` ends with "hand them straight to
AI Social"). The product's own configuration describes a chain, not four
parallel products.

**Order of subordination below the fold**: Sentiment, then AI SEO, then AI
Social. Each answers a question the visitor only has after accepting the one
before it. "Am I there?" then "is it good?" then "what do I fix?" then "how does
it get published?".

**Counter-argument worth recording**: leading on AI Visibility makes BrandGEO
sound like the nine competitors listed in `docs/GTM-STRATEGY.md` §2.1, all of
which measure AI visibility. The answer is that the one-stop claim is earned
below the fold by showing the chain, not above it by listing four things. Four
things above the fold produces a visitor who understands none of them.

---

## 3. The primary CTA

**The primary call to action is the hero field where the visitor enters their
own domain and runs the instant audit, and its destination is the audit result
rendered on the same page.**

That is the only primary CTA. Every other control on the page is demoted to
secondary or removed by `bg-design`, and none of them may share the hero's
visual weight.

Why this one: it is the only action that delivers the leading pillar's value
without an account, a card, or a wait, and `docs/STATE-OF-PRODUCT.md` §3.3
records that no competitor in its nine-name set has an equivalent, which makes
it the page's only genuinely uncopied asset.

Two facts about it that `bg-design` and `bg-web` must know:

- `site.js:87` to `:91` defines `redirectToSignup(domain)`, which sends the
  visitor to `app.getbrandgeo.com/signup?domain=...` when the audit endpoint
  does not answer. That is a failure path inside the primary CTA, not a second
  CTA, and it must not be surfaced as a choice.
- `site.js:26` to `:65` documents the widget as written against a stub contract
  that "fails open". `docs/STATE-OF-PRODUCT.md` §3.3 states the Instant Audit
  Engine "is live and smoke-tested end-to-end on both depths, and the homepage
  widget (Component D) is wired against it". These two disagree. The
  `STATE-OF-PRODUCT.md` claim is dated 2026-07-11 and is the later verification;
  the `site.js` comment block reads as stub-era text that was never removed.
  Treat the endpoint as live and have `bg-verify` confirm it before launch,
  because the primary CTA depends on it.

---

## 4. The falsifiable three-second test

An independent reviewer can run this against the shipped page with no
instrumentation, no analytics, and no access to the codebase.

**Setup.** Capture the page as two screenshots, one at 1280x800 and one at
375x812, each cropped at the fold so nothing below it is visible. Recruit five
people who have never seen BrandGEO and do not work in SEO or AI marketing.

**Procedure.** Show one screenshot for three seconds by a clock, then remove it.
Ask the reviewer to write one sentence answering: what does this company do, for
whom, and what does the page want you to do next. No second look. No scrolling,
no hovering, no zooming. Text rendered below 14px is excluded from the pass
criteria, because it cannot be read in three seconds at either width.

**Scoring.** A sentence passes if it names all three of:

1. that something is being measured about the visitor's own brand,
2. that the thing doing the recommending is an AI assistant or chatbot, named
   generically or by name,
3. that the next step is to check or test their own brand or domain.

**Pass condition.** Four of five reviewers pass at 1280x800 and four of five at
375x812.

**Hard fail, independent of the count.** If any reviewer names social posting,
SEO auditing, or reputation monitoring as the primary subject of the page, the
above-the-fold hierarchy has failed regardless of how many others passed,
because it means a subordinate pillar has been read as the lead.

This test is falsifiable in the sense that matters: it can be run today against
the current page and produce a failing result, and it can be re-run unchanged
against whatever ships.

---

## 5. The order in which proof is presented below the fold

Each line states what the block must establish and why it sits where it sits.
Block titles here are functions, not headings.

1. **What was measured.** The engines actually queried. Establishes that the
   number above the fold came from somewhere. Must be first, because everything
   after it is a claim about a measurement the visitor has not yet accepted is
   real. Current position: `index.html:1452`, already first, and correct.
2. **What the number means.** The score and its six dimensions. Establishes that
   this is a diagnostic, not a vanity metric. `index.html:1490` already lists the
   six dimensions inside a features card; it needs to be a step, not a card.
3. **Presence is not endorsement.** Sentiment. Establishes the first reason a
   visitor who thinks "I am probably fine" is not fine. Currently at
   `index.html:1518`, after the features grid, which is one block too late: it is
   the strongest argument on the page and it sits behind six feature cards.
4. **What you do about it, and where the other three pillars enter.** The
   prioritised fix list, then AI SEO as where a gap becomes a brief, then AI
   Social as where the brief gets published. This is the single place the
   one-stop claim is made, and it is made as a chain. Currently the fix list is
   one of six feature cards (`index.html:1494`) and AI SEO and AI Social appear
   exactly once on the entire page, inside the Growth PRO pricing card
   (`index.html:1728`, verified by direct search: that is the only line in
   `index.html` containing either string). Two of the four pillars are, today,
   invisible outside a price card.
5. **Why to believe any of it.** The published methodology with a DOI and the AI
   Visibility Index (`index.html:1462` to `:1472`). This is the page's only
   third-party-checkable proof and it currently sits second, before the visitor
   knows what is being claimed. Credibility answers a doubt the visitor does not
   have yet at position two; it answers a doubt they definitely have at position
   five.
6. **Pricing.** See §6.
7. **Objections.** FAQ (`index.html:1869`).
8. **The sales-assisted path.** Contact (`index.html:1904`).

**Social proof is not in this order, deliberately.** The testimonials block
exists at `index.html:1587` to `:1613` but is commented out and contains
placeholder quotes. Until real quotes exist, the proof stack rests on the DOI
study and the Index. The trust strip's "50+ brands audited"
(`index.html:1362` and `:1786`) could not be traced to any file in this packet's
read allowlist. Per AGENT-OS §7.2 it does not enter this artifact as evidence,
no ruling here depends on it, and `bg-verify` should confirm or remove it.

---

## 6. Ruling on the pricing ladder, above versus below the fold

### 6.1 The ladder as it actually is

Read from `brandgeo/web/index.html` and `brandgeo/web/site.js`, reported as
shipped rather than as any document summarises it.

The section at `index.html:1616` presents two grids behind a mode switch
(`:1624` to `:1629`), labelled "Run it yourself from €0" and "Done for you from
€1,500", with a monthly and yearly toggle offering "Save 17%" (`:1637`).

Self-serve grid, `#grid-self` (`:1643`), visible by default:

| Card | Monthly | Yearly | Button and destination |
|---|---|---|---|
| BrandGEO Free (`:1648`) | €0 (`:1650`) | none | "Start Free" to `/signup` (`:1655`) |
| BrandGEO Essentials (`:1668`) | €99 (`:1670`) | €990 (`:1671`) | "Subscribe", `data-checkout="essentials"` (`:1677`) |
| BrandGEO Growth (`:1690`), flagged Most Popular (`:1689`) | €299 (`:1692`) | €2,990 (`:1693`) | "Subscribe", `data-checkout="growth"` (`:1699`) |
| BrandGEO Growth PRO (`:1713`) | €449 (`:1715`) | €4,490 (`:1716`) | "Subscribe", `data-checkout="growth_pro"` (`:1722`) |

Done-for-you grid, `#grid-managed` (`:1736`), hidden until the mode switch is
used:

| Card | Monthly | Yearly | Button |
|---|---|---|---|
| BrandGEO Managed (`:1741`), flagged Most Popular | €1,500 (`:1743`) | €15,000 (`:1744`) | "Book Consultation" to `#contact` (`:1750`) |
| Custom Enterprise (`:1764`) | "Let's talk" (`:1766`) | none | "Contact Sales" to `#contact` (`:1771`) |

The JSON-LD Offers block at `index.html:81` to `:85` declares the same five
numbers: 0, 99, 299, 449, 1500 EUR.

Three facts about that ladder that are not visible on the page:

- `site.js:504` to `:514` defines `STRIPE_LINKS` for `essentials` and `growth`
  only. The `growth_pro` entry is commented out at `:513`. `applyCheckoutLinks`
  (`:516` to `:525`) only overrides an href when a real URL exists, so the
  €449 "Subscribe" button falls through to the `/signup` href set in the HTML.
  Two of the four self-serve cards lead to Stripe; two lead to signup.
- `docs/PRICING-SPEC.md` §6 (`:206`) states a different ladder: "Free €0 →
  Essentials €99 → Growth €299 → Managed €900 → Pro €1,500 → Enterprise (from
  ~€10k)". It has no Growth PRO tier and prices Managed at €900. That file is
  headed "DRAFT for Constantin's approval. Nothing is implemented yet"
  (`:4`).
- `docs/PRICING-STRATEGY-2026-07.md` is headed "APPROVED for build (Constantin,
  2026-07-21). Supersedes the tier shape in PRICING-SPEC.md" (`:3` to `:4`) and
  its §2 (`:37`) states "Free €0 · Essentials €99 · Growth €299 · Growth PRO
  €449 · Managed from €1,500 · Enterprise custom", which matches the shipped
  page exactly.

**Finding, per the two-docs-disagree rule:** `PRICING-STRATEGY-2026-07.md`
matches shipped code and wins. `PRICING-SPEC.md` is stale on the tier shape and
on the Managed price and should be marked as superseded by whoever owns
`docs/`. This artifact takes its numbers from the shipped page and from
`PRICING-STRATEGY-2026-07.md` only.

Two further conflicts I am recording rather than resolving, because resolving
either would change pricing or plan gating, which this stage may not do:

- `brandgeo-dashboard/netlify/functions/_plans.js` is out of sync with
  `planConfig.ts`. Its `PLAN_ORDER` (`:9`) has no `growth_pro`, and it grants
  `growth` the `google_ai` engine (`:20`) that `planConfig.ts:49` withholds. The
  page sells Google AI Mode as the Growth PRO differentiator
  (`index.html:1720`, `:1726`), so the server mirror currently contradicts the
  page. This is a `bg-verify` item at B1, not a `bg-strategy` decision.
- `docs/PRICING-STRATEGY-2026-07.md` §7 (`:134`) recommends per-tier calls to
  action including "Start free trial". No trial primitive exists in the
  codebase. Nothing in this artifact proposes one, and no downstream stage
  should read that line as authority to build one.

### 6.2 The ruling

**No price appears above the fold. The ladder stays below the fold, at position
six in the proof order in §5, after the visitor has been shown what is measured,
what the number means, why presence is not endorsement, what gets fixed, and why
to believe it.**

Reason, in one line: a price shown before the visitor accepts that the
measurement matters turns the page into a comparison exercise against nine
cheaper-looking tools, and the product's advantage is the chain, which takes
more than three seconds to establish.

Three consequences that follow and are part of the ruling:

- The nav "Pricing" anchor at `index.html:1321` stays. A visitor who arrives
  already wanting the price gets one click to it. That is the concession, and it
  is enough.
- The mode switch keeps its current default: self-serve visible, done-for-you
  hidden behind the second tab (`index.html:1736` ships `hidden`). The free plan
  is the entry primitive and the self-serve grid is where it lives.
- The word "free" is allowed above the fold as a condition of entry, not as a
  price. "No credit card" already appears in the trust row
  (`index.html:1364`) and is consistent with the `free` plan requiring none.
  That is not a price and does not violate this ruling.

**Strongest counter-argument, recorded:** the nine comparison pages and the
research corpus bring in visitors who are mid-evaluation and want a number
immediately, and for those visitors a below-the-fold ladder adds a scroll. The
answer is that the nav anchor serves them at one click, and that optimising the
homepage hero for people who already know the category loses the larger group
who do not.

---

## 7. What the visitor is being asked to stop paying for

The visitor is being asked to stop paying, separately, for:

1. **An AI visibility monitoring subscription.** The nine direct competitors and
   their entry prices are listed in `docs/GTM-STRATEGY.md` §2.1, sourced there
   as "as of July 2026".
2. **A social publishing and scheduling tool.** `planConfig.ts:190` describes
   AI Social as writing a post once, adapting it per network, and scheduling or
   publishing "to all your social channels from one place".
   `docs/PRICING-STRATEGY-2026-07.md` §5 (`:93`) names Ayrshare as the
   underlying delivery cost, which is what makes this a real substitution rather
   than a marketing line.
3. **A content and on-page SEO tool.** `planConfig.ts:194` describes AI SEO as
   turning visibility gaps into briefs and then into scored drafts.
4. **A separate reputation or sentiment monitor.** `index.html:1523` describes
   reading every AI response for tone. Nothing in `planConfig.ts` gates this
   behind a plan, so it is included wherever visibility is.

And, for the done-for-you buyer only, an agency retainer. `docs/GTM-STRATEGY.md`
§2.2 puts the entry band for done-for-you AI visibility work at $1,500 to
$2,500 per month, sourced there as of July 2026.

**What the page may not claim.** It may not state a combined saving, a number of
tools replaced by a number of euros, or a percentage. No file in this packet's
read allowlist prices the four substituted categories together, and AGENT-OS
§7.2 forbids inventing one. The substitution is stated as a substitution and
demonstrated by the chain in proof block four, not by arithmetic.

---

## 8. What this thesis will not claim

Explicit anti-positioning. Each of these would be effective and is not
defensible from the files read.

- **"Five AI engines", stated without qualification.** `planConfig.ts:39` to
  `:42` records that Meta AI was retired on 2026-07-16 and replaced by Google AI
  Mode, and that no plan set includes `meta` (`PLAN_ENGINES`, `:46` to `:54`).
  The shipped page names Meta AI as a monitored engine in five places:
  `index.html:1347`, `:1421`, `:1458`, `:1485`, `:1879`. It names Google AI Mode
  in one place, the Growth PRO card (`:1720`, `:1726`). Today the page's engine
  claim describes a lineup the product no longer collects, and the count is only
  true if you include an engine the page never introduces. This must be fixed
  before the hook can lean on engine coverage at all, and it is a factual
  correction for `bg-web`, not a positioning choice.
- **"Results in 48 hours" alongside an instant audit.** `index.html:1363` and
  `:1564` promise 48 hours, and `:1569` makes step one a 30 minute onboarding
  call, which describes the done-for-you motion. The primary CTA in §3 promises
  a result in seconds. The page currently makes both promises to the same
  visitor. The hook may make one of them above the fold, and per §3 it is the
  instant one.
- **Any refresh cadence, stated as automatic.** `docs/STATE-OF-PRODUCT.md` §4.1
  records that there is no scheduler and that collection runs in a browser tab,
  so the monthly and weekly cadences printed on the page are, in its words, "a
  person clicking". Cadence language stays out of the hook and stays a plan
  attribute in the pricing table until that changes.
- **Customer counts, logos, or testimonials.** See §5. Nothing traceable exists
  in the read allowlist.
- **Any claim that depends on scaled content or on gaming citation.**
  `rules/content-integrity.md` binds via AGENT-OS §7.4. The research corpus is
  proof of method, and it is presented as method, never as a technique the
  customer buys to place themselves in AI answers artificially.

---

## 9. Handoff conditions

`bg-design` receives §1 through §6 as binding constraints on hierarchy and
order, and decides everything visual. `bg-copy` receives §1, §2, §7 and §8 and
writes the words, with §8 as a hard exclusion list.

Two items must be resolved by someone else before this thesis can ship intact:

1. The Meta AI and Google AI Mode contradiction in §8, item one. This is a
   correctness fix in `brandgeo/web/`, owned by `bg-web`.
2. Confirmation that the `public-audit` endpoint is live, per §3. Owned by
   `bg-verify`.

Neither is a strategy decision and neither is blocked on Constantin.
