# 027: orchestrator to a fresh session, the BrandGEO sales presentation (PDF)

Written 2026-09-22. Status: READY. Kickoff line for the new session:

```
Read .claude/handoffs/027-bg-orchestrator-to-deck-session-brandgeo-sales-presentation.md and build the deck.
```

## 1. Why this exists

Several people have asked Constantin for a PDF presentation of BrandGEO and
there is none. Every prospect conversation so far has run on the website, the
free audit and a founder email. This packet commissions the first shareable
deck: a PDF that a prospect can read alone in five minutes, that a partner or
affiliate can forward, and that Constantin can present live in fifteen.

## 2. The deliverable

One PDF, 16:9, sent by Constantin to whoever asks. Two variants of the same
source:

| File | Purpose | Length |
|---|---|---|
| `BrandGEO-Presentation-2026-09.pdf` | The reading deck. Self-explanatory without a presenter. | 14 to 18 slides |
| `BrandGEO-Presentation-2026-09-appendix.pdf` | Industry proof pages, one per vertical, appended only when the prospect's industry is known. | 1 slide per vertical, from the industry pages that exist |

Plus the editable source (pptx or the HTML slide set) so the next revision is
a diff, not a rebuild.

**Where it goes.** Source and the two PDFs under
`docs/sales/presentation-2026-09/`. Commit the source only. The PDFs are
binary sales collateral; Constantin copies them to the GetBrandGEO Drive
folder under `6-Demos/` (memory `social-output-not-in-git`). Nothing in this
packet touches `brandgeo/web/`, `brandgeo-dashboard/` or the database, so no
Netlify build and no cPanel upload result from it.

## 3. Who it is for and what it must do

**Reader.** A founder, marketing lead or agency owner at a small or mid-size
B2B or local-service company, in any industry, who has heard "AI search" and
suspects it matters but cannot say how it affects them. Zero GEO vocabulary.
Their mental model is "I searched my own brand in ChatGPT and I was there"
(`docs/copy/audit-score-presentation-2026-08-14.md` section 1). The deck must
meet that model, not lecture past it.

**Job of the deck, in order:**
1. In the first three slides the reader can say back, in their own words, what
   BrandGEO measures and why their buyers' AI answers matter to their revenue.
2. By the middle they have seen real, sourced evidence that brands like theirs
   are missing from AI answers and that the gap is measurable and fixable.
3. By the end they know exactly what they get on each plan, what it costs, and
   the single next step (the free instant audit at `getbrandgeo.com/#free-audit`,
   then a call or a self-serve signup).

**Tone.** Measurement instrument that shows its work, not a salesperson
(`docs/strategy/hook-thesis-web.md` section 1). Plain sentences. Every number
carries its source on the slide in small type. No hype vocabulary.

## 4. The expert panel: how to run it

Constantin asked for the best experts in SaaS marketing, SaaS SEO and SaaS
GEO presentations to be brought in. Do that as a judge panel inside one
`Workflow`, concurrency 2, no builds or browsers inside agents (32 GB RAM, no
GPU, memory `pc-ram-32gb-no-gpu`), builders on Sonnet, judges and the
skeptic on Opus (memory `model-routing-cost-advice`).

**Stage 0, fact ledger (one agent, Sonnet, read-only).** Before any expert
writes a word, one agent builds `docs/sales/presentation-2026-09/fact-ledger.md`:
every claim the deck may use, with the file or live URL it comes from. Sources
to read, in this order:

- `brandgeo-dashboard/src/lib/planConfig.ts` for the plan ladder, engines per
  plan, prompt counts and refresh cadence. This file is the only source of
  truth for entitlements. Do not take numbers from `CLAUDE.md`, which is
  partly stale on this.
- `brandgeo/web/index.html` (the live homepage) for the pricing cards as
  currently published, the hero instrument card, and the `:root` colour tokens.
- `docs/strategy/hook-thesis-web.md`, `docs/strategy/positioning-pricing-audit-2026-08-13.md`,
  `docs/strategy/sprint-ladder-ruling.md` for positioning and the ladder ruling.
- `docs/copy/audit-score-presentation-2026-08-14.md` for the honest framing of
  the audit score.
- `brandgeo/web/blog.html`, `brandgeo/web/bg-105.html` and the
  `ai-visibility-for-*.html` pages for the research library: 105 research
  articles (BG-001 to BG-105), 27 city studies, 10 industry pages, 10
  comparison pages, and the two Zenodo records (protocol
  10.5281/zenodo.22279050, and 10.5281/zenodo.21395598) under ORCID
  0009-0008-4924-1987. Pull two or three headline findings per industry page
  for the appendix, each with its page URL.
- `docs/growth/brand-kit-2026-07-29/` and `docs/growth/brand-identity-2026-07-29/`
  for logos (svg and png) and the identity rules.

**Stage 1, three independent outlines (parallel, Sonnet, effort high).** Each
expert gets the fact ledger and the reader profile and returns a full slide
outline (slide title, the one sentence the reader must take from it, the
evidence used, the visual). Three distinct lenses, prompted so they disagree:

1. **SaaS positioning strategist.** Frames the category shift (search to
   answers), the cost of absence, and why a measurement product is the entry
   point. Optimises for the reader understanding the problem in three slides.
2. **GEO and SEO practitioner.** Treats the reader as someone who already buys
   SEO. Shows what GEO adds, what BrandGEO measures that an SEO tool does not
   (engine by engine mention, position, sentiment, competitor share), and the
   research library as proof of method. Optimises for credibility.
3. **Closer.** Builds the deck backwards from the last slide. Every slide
   earns the next step. Handles the three objections a prospect voices ("I'm
   already there when I search", "my customers don't use AI", "what do I do
   with the report"). Optimises for a signed plan or a booked call.

**Stage 2, judge panel (parallel, Opus).** Three judges score all three
outlines on four criteria, 1 to 5 each, with one sentence of reasoning per
score: comprehension in three slides, evidence density, multi-industry fit
without rewriting, and closing power. The orchestrator synthesises the
winning outline and grafts the best slides from the other two; it records
what was taken from where in `docs/sales/presentation-2026-09/outline.md`.

**Stage 3, build (one agent, Sonnet).** Build the deck from the synthesised
outline. Path: if a `pptx` skill is listed, use it and export to PDF. If not,
build HTML slides (one section per slide, 1920 by 1080, print stylesheet with
page breaks) and render to PDF with headless Chrome over CDP, the path this
project already uses for screenshots (memory `preview-pane-cannot-measure-layout`).
Render happens in the main session, never inside an agent.

**Stage 4, skeptic and QA (two agents, Opus, parallel).**
- The **claim skeptic** reads every slide against the fact ledger and tries to
  refute each number, quote and capability. Anything not traceable to a file
  or live URL is cut, not softened. It also checks the deck never names a
  client, never uses the two uncited homepage stats (73 percent and 4.2x, see
  `CLAUDE.md` 2026-07-28 open decisions), and never presents MCP access or
  anything unshipped as available today.
- The **design and copy QA** checks the rendered PDF page by page: one idea per
  slide, the take-away sentence readable at thumbnail size, contrast on the
  violet palette, no orphan words, no slide over 40 words of body text, and
  the industry appendix pages laid out identically.
Every finding is fixed and re-rendered before the deck is called done.

## 5. Content the deck must contain

Not an outline, the experts write that. These are the load-bearing facts and
rules the outline must honour.

- **What BrandGEO does, in one sentence the reader can repeat:** it asks the
  AI engines the questions your buyers ask, and shows whether you are named,
  where, in what tone, and who was named instead.
- **Engines, exactly as `planConfig.ts` lists them today:** ChatGPT, Gemini,
  Claude, Perplexity, Google AI Mode. Meta AI is retired; never name it as
  monitored. Engine count per plan comes from the file, not from memory.
- **Plans and prices, exactly as the live homepage publishes them** on the day
  the deck is built, in EUR, with the Radar launch price shown as the launch
  price. If the homepage shows three cards, the deck shows three cards and a
  line for the rest.
- **Proof of method:** the research library counts above, the pre-registered
  protocol DOI, and the homepage hero instrument (a real client's live data,
  anonymised; the client is never named and its domain never shown, per the
  2026-08-07 ruling in `CLAUDE.md`).
- **Multi-industry:** the core deck uses examples from at least three verticals
  drawn from the industry pages; the appendix carries one page per vertical.
  Never a real prospect, never a real person.
- **The next step, on the last slide and on no other:** free instant audit at
  `getbrandgeo.com/#free-audit`, then either self-serve signup at
  `app.getbrandgeo.com/signup` or a call with Constantin. The affiliate
  programme (10 percent, `getbrandgeo.com/affiliates.html`) gets one line for
  partners, not a slide.
- **Contact:** `constantin@getbrandgeo.com` only. No personal address.

## 6. Hard rules, binding

- No em or en dashes anywhere: slides, notes, source, filenames, commit
  message. Scan with `rg -n '\x{2014}|\x{2013}'` and prove the pattern fires
  with a positive control first. Never `grep -P` on Git Bash.
- No AI-tell vocabulary (memory `feedback-no-ai-tells`): no "unlock",
  "seamless", "leverage", "game-changing", "in today's landscape" or their
  relatives.
- No invented numbers, testimonials, logos or quotes. The homepage's own
  testimonials block is commented out because none exist; the deck has none
  either.
- No real person's name and no client name in any committed file. The repo is
  public. Name-scan the staged files before the commit.
- Agents never send, post or share anything. The last mile is Constantin.
- Commit by pathspec only (`docs/sales/presentation-2026-09/` and this packet's
  status line), never sweep the other sessions' dirty files. Check
  `.git/index.lock` first; git commands stay serialised. Docs only, so the
  push spends no Netlify build.
- Commands handed to Constantin are PowerShell 5.1 with Windows paths, one per
  fenced block (memory `commands-for-constantin-are-powershell`).

## 7. Done means

1. Both PDFs render, open in a stock viewer, and every page was looked at.
2. `fact-ledger.md` traces every claim on every slide.
3. The skeptic returned zero open findings; the QA returned zero open findings.
4. Dash scan clean on every file in `docs/sales/presentation-2026-09/`.
5. Source committed by pathspec with the message
   `docs(sales): first BrandGEO presentation deck, source and fact ledger`;
   PDFs left uncommitted for Constantin to copy to Drive.
6. Closing message to Constantin, structured Completed / Requires your action /
   Still pending, with the two PDF paths in full and the Drive copy step as a
   numbered item.

## 8. Not in scope

A video, a one-pager, translations (the deck is English; a Romanian or Spanish
version is a follow-up packet), pricing changes, any edit to the website or
the app, and any outreach.
