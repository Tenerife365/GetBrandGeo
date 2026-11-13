# Draft: A Year-End AI Visibility Review: What to Gather Before You Plan 2027

- Queue key: `draft-yearend-review`
- Publish on: 2026-12-01 (queue row `ready from 2026-12-01`)
- Type: practical guide, no new data
- Written on 2026-11-13 by the laptop content session (lot 1, December), second-verified
  the same day (`CST Ops\_runs\2026-11-13_lot1_verif_brandgeo.md`), corrected and converted
  to this format on the desktop on 2026-11-13. Body: about 821 words, shorter than the
  research series by design (a How To planning series).
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-13

| # | URL | Used for |
|---|---|---|
| 1 | https://developers.google.com/search/docs/appearance/ai-features | No additional requirements for AI Overviews or AI Mode; indexed and snippet-eligible to be a supporting link; AI feature traffic counted under the Web search type |
| 2 | https://getbrandgeo.com/bg-070.html | Much AI influence produces no click |
| 3 | https://getbrandgeo.com/bg-103.html | Method for checking stated facts |
| 4 | https://getbrandgeo.com/bg-084.html | Budget case without an ROI metric |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features. All returned 200 on 2026-11-13.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-13.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-01", date_label="December 1, 2026", read=4,
    tags=['How To', 'Planning', 'AI Visibility'],
    title='A Year-End AI Visibility Review: What to Gather Before You Plan 2027',
    h1='A Year-End <em>AI Visibility</em> Review Before You Plan 2027',
    h1_plain='A Year-End AI Visibility Review Before You Plan 2027',
    subtitle='Before you set a 2027 budget line for AI visibility, collect five things from this year. Here is the list, and what each one will and will not tell you.',
    meta_desc='Before an AI visibility line goes into your 2027 plan, gather five things from this year: buyer questions, dated answers, the facts engines state, the pages behind them, and honest results.',
    og_desc='Five things to gather in the first week of December, before AI visibility gets a line in the 2027 plan, and what each one will and will not tell you.',
    ld_desc="BrandGEO planning guide: five things a business should gather before setting a 2027 AI visibility budget line, based on Google's documentation on AI features and earlier BrandGEO articles on measurement.",
    keywords='ai visibility review, year end ai visibility audit, ai visibility budget 2027, what do ai engines say about my brand, geo planning 2027, ai search baseline',
    about=['AI Visibility', 'Budget Planning', 'Generative Engine Optimization'],
    findings=[('5', 'things to gather before the 2027 plan, none of which needs a tool'),
              ('1 named day', 'the date on your saved answers is what makes January comparable'),
              ('No extra markup', 'Google says AI Overviews and AI Mode need no special requirements beyond indexing and snippet eligibility'),
              ('Web search type', "where Search Console counts traffic from Google's AI features, not as its own line")],
    faq=[('What should I gather before setting an AI visibility budget?',
          'Five things: the questions your buyers ask, what each engine said on a named day, the facts engines state about you, the pages those facts should come from, and an honest list of what changed this year and whether you know it caused anything.'),
         ('Does Google require special markup to appear in AI Overviews?',
          "No. Google's documentation says there are no additional requirements to appear in AI Overviews or AI Mode. A page needs to be indexed and eligible to show in Search with a snippet to be a supporting link."),
         ('Can a year-end review tell me revenue from AI answers?',
          'No. It can tell you what is being said about you today, how far that is from the truth, and which of your pages are responsible for the gap.')],
    related=[('/bg-070.html', 'BG-070', 'Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead',
              'Why a review has to rest on more than visits.'),
             ('/bg-084.html', 'BG-084', 'A Board-Ready Case for a GEO Budget When There Is No ROI Metric to Show',
              'How to argue the budget without an ROI figure.'),
             ('/bg-103.html', 'BG-103', 'How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately',
              'The method for checking each stated fact.')],
    cta_h='Start your December baseline',
    cta_p='Run the free audit on your own domain to see how AI engines describe it today, then save it as the first dated entry in your review. No card needed.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Year-End', 'w')], [('AI Visibility ', 'w'), ('Review', 'g')]],
        sub=['Five things to gather', 'before you plan 2027.'],
        stats=[('5', 'things to gather, no tool needed', 'BG-NNN'),
               ('1 day', 'named on every saved answer', 'BG-NNN'),
               ('0', "special requirements for Google's AI features", 'Google'),
               ('Web', 'the Search Console type that counts AI traffic', 'Google')],
        footer='Gather It Before the Budget Meeting',
    ),
    body="""  <p>December is when budgets get argued over. If AI visibility is going to have a line in the 2027 plan, the argument is easier when you walk in with what you actually know, not with a feeling that "AI is becoming important". This guide lists five things to gather in the first week of December, in the order that makes the later ones easier. None of them needs a tool. All of them need a date written next to them.</p>

  <div class="callout">
    <div class="callout-label">What this guide rests on, and what it cannot tell you</div>
    <ul>
      <li>Google's documentation on AI features says there are no additional requirements to appear in AI Overviews or AI Mode, and that a page needs to be indexed and eligible to show in Search with a snippet to be a supporting link. Read on 13 November 2026.</li>
      <li>Google also says sites shown in AI features are included in overall search traffic in Search Console, under the Web search type, so that traffic is not split out for you.</li>
      <li><a href="/bg-070.html">Our earlier piece on tracking without a pixel</a> argues that much AI influence produces no click at all, which is why a review has to rest on more than visits.</li>
    </ul>
    <p>It is a planning guide built from public documentation and our earlier articles, with no new data of its own. It promises no position, traffic or revenue.</p>
  </div>

  <h2>1. The questions your buyers ask</h2>

  <p>Write down the questions a new customer would plausibly type into an AI assistant before choosing you. Not keywords: full sentences, the way a person asks a friend. Include the comparison questions ("X or Y for a team our size?") and the doubt questions ("is X reliable?"). Keep the list short enough to run again next quarter. A list you cannot repeat is a list you cannot compare.</p>

  <h2>2. What each engine said, on a named day</h2>

  <p>Run those questions now and save the answers as text, with the date, the engine and the model name if the product shows it. AI answers change from one run to the next, so a single run is a snapshot, not a verdict. The value of December's snapshot is that it becomes the baseline you compare January against. If you only keep one thing from this guide, keep this.</p>

  <h2>3. The facts the engines state about you</h2>

  <p>Read each saved answer as an auditor would: what does it claim about your products, your locations, your hours, your policies? Mark each claim correct, out of date, or invented. This is a different question from "were we mentioned". A mention that gets your return policy wrong costs you something. Our piece on <a href="/bg-103.html">checking whether ChatGPT, Gemini and Claude describe your brand accurately</a> walks through the method.</p>

  <h2>4. The pages those facts should come from</h2>

  <p>For every wrong or missing claim, find the page on your own site that should have settled it. Often the page exists but is vague, buried, or contradicted by an older page. Google's documentation is plain that no special markup or AI-specific file is required, so the review is about whether your ordinary pages are clear, indexable and current, not about chasing a new technical trick.</p>

  <h2>5. What you can honestly say about results</h2>

  <p>List what changed this year that you can show: pages you rewrote, facts you corrected, questions where you now appear. Next to each, write whether you know it caused anything or only that it happened around the same time. Most teams will end up with a long "happened" column and a short "caused" column. That is normal, and it is the honest input for a budget conversation. The board-ready argument in <a href="/bg-084.html">our piece on making a GEO budget case without an ROI metric</a> depends on exactly this separation.</p>

  <h2>What this review cannot tell you</h2>

  <p>It cannot tell you revenue from AI answers. It cannot tell you that one engine is more important than another for your buyers unless your own customers have told you so. And because the answers vary, it cannot tell you a stable "rank". It can tell you what is being said about you today, how far that is from the truth, and which of your pages are responsible for the gap.</p>

  <h2>What to do with it</h2>

  <p>Bring the five items to the planning meeting as a one-page summary: the question list, the baseline date, the number of claims marked wrong or out of date (your own count, from your own answers), and the pages involved. Then the budget question becomes concrete: how much time or money does it take to fix those pages and re-run the same questions in a month?</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>Write down your buyers' questions, save what each engine says on a named day, mark every fact as right or wrong, find the page behind each wrong one, and keep what happened apart from what you know it caused. That is the input for an honest 2027 budget line.</p>
  </div>""",
))
```
