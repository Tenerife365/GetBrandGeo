# Draft: After Black Friday and Cyber Monday: A Test Guide for What AI Engines Say About Your Store

- Queue key: `draft-after-bfcm`
- Publish on: 2026-12-03 (queue row `ready from 2026-12-03`)
- Type: practical guide, no new data
- Written on 2026-11-13 by the laptop content session (lot 1, December), second-verified
  the same day (`CST Ops\_runs\2026-11-13_lot1_verif_brandgeo.md`), corrected and converted
  to this format on the desktop on 2026-11-13. Body: about 765 words, shorter than the
  research series by design (a How To planning series).
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-13

| # | URL | Used for |
|---|---|---|
| 1 | https://www.farmersalmanac.com/black-friday | Black Friday 2026 is Friday 27 November, the day after Thanksgiving |
| 2 | https://en.wikipedia.org/wiki/Black_Friday_(shopping) | Black Friday is the day after the fourth Thursday of November; Cyber Monday the Monday after |
| 3 | https://developers.google.com/search/docs/appearance/ai-features | No extra requirements to appear in Google's AI features |
| 4 | https://getbrandgeo.com/bg-081.html | Competitor check |
| 5 | https://getbrandgeo.com/bg-103.html | Brand fact accuracy |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://www.farmersalmanac.com/black-friday, https://en.wikipedia.org/wiki/Black_Friday_(shopping), https://developers.google.com/search/docs/appearance/ai-features. All returned 200 on 2026-11-13.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-13.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-03", date_label="December 3, 2026", read=4,
    tags=['How To', 'Ecommerce', 'AI Answers'],
    title='After Black Friday and Cyber Monday: A Test Guide for What AI Engines Say About Your Store',
    h1='After Black Friday: Test What <em>AI Answers</em> Say About Your Store',
    h1_plain='After Black Friday: Test What AI Answers Say About Your Store',
    subtitle='Black Friday was 27 November and Cyber Monday 30 November. A short, repeatable test shows what AI engines now say about your offers, policies and brand, without promising anything.',
    meta_desc='Black Friday and Cyber Monday are over. A ten-minute test of what AI engines now say about your offers, policies and delivery dates, and what to fix when an answer is out of date.',
    og_desc='Ended offers stated as live, old return rules, wrong delivery cutoffs: a short test for the first week of December, after the sales weekend.',
    ld_desc='BrandGEO guide for online stores: how to test what AI engines say about offers, policies and delivery dates after Black Friday (27 November 2026) and Cyber Monday (30 November 2026), and how to fix stale answers.',
    keywords='ai answers after black friday, chatgpt store return policy wrong, ai answers expired offer, holiday shipping cutoff ai, test what ai says about my store, cyber monday ai search',
    about=['AI Visibility', 'Ecommerce', 'Holiday Season'],
    findings=[('27 Nov 2026', 'Black Friday, the day after Thanksgiving on the fourth Thursday of November'),
              ('30 Nov 2026', 'Cyber Monday, the Monday after'),
              ('3 kinds', 'of question to ask: discovery, offer and policy, and comparison'),
              ('4 problems', 'to read for: ended offers stated as live, old policies, missing, and described wrongly')],
    faq=[("How do I check what ChatGPT says about my store's sale?",
          'Ask the questions a customer would ask, in a fresh conversation each time: whether the store has a sale now, what the holiday return policy is, and the last day to order for delivery before Christmas. Compare each answer with a written list of what you changed for the weekend and what has ended.'),
         ('What should I do if an AI answer still shows an ended offer?',
          'Name the page that should have settled it. Close out the offer clearly on the page itself, for example by saying the offer ended on 30 November, rather than deleting the page, and write the date next to each fix.'),
         ('Will fixing the page change the AI answer?',
          'We cannot promise that. Run the same questions again a few days later and treat the second run as a way to see whether answers moved, not as proof that your change worked.')],
    related=[('/bg-081.html', 'BG-081', 'A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers',
              'The general ten-minute competitor check.'),
             ('/bg-103.html', 'BG-103', 'How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately',
              'Checking every stated fact about a brand.'),
             ('/bg-070.html', 'BG-070', 'Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead',
              'Why answers can persuade without a click.')],
    cta_h='Find your stale answers faster',
    cta_p='Run the free audit on your own domain to see what AI engines say about it, then compare that with your list of what ended on 30 November. No card needed.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('After ', 'w'), ('Black Friday', 'g')], [('Test the Answers', 'w')]],
        sub=['What AI engines say about your offers,', 'policies and delivery dates now.'],
        stats=[('27 Nov', 'Black Friday 2026', 'Calendar'),
               ('30 Nov', 'Cyber Monday 2026', 'Calendar'),
               ('3', 'kinds of question to ask', 'BG-NNN'),
               ('4', 'problems to read for', 'BG-NNN')],
        footer='Ten Minutes, Twice',
    ),
    body="""  <p>The sales weekend is over. Your store ran offers, changed policies for a few days, maybe added shipping cutoffs and gift guides. This guide is for the first week of December, when the weekend's pages are still on your site and the weekend's questions are still fresh in your customers' minds. It is a test, not a forecast: it tells you what AI engines say today, and gives you a way to compare it with what they say next month. It makes no claim about sales or visibility results.</p>

  <div class="callout">
    <div class="callout-label">What this guide rests on, and what it cannot tell you</div>
    <ul>
      <li>Black Friday fell on 27 November 2026 and Cyber Monday on 30 November 2026: Thanksgiving is the fourth Thursday of November, which was 26 November this year.</li>
      <li>AI answers can differ from one run to the next, so run each question more than once and keep the text.</li>
      <li>BrandGEO has separate guides on <a href="/bg-081.html">a quick competitor check</a> and on <a href="/bg-103.html">checking whether engines describe your brand accurately</a>. This one is about the seasonal pages specifically.</li>
    </ul>
    <p>It is a planning guide built from public documentation and our earlier articles, with no new data of its own. It promises no position, traffic or revenue.</p>
  </div>

  <h2>Before you start: freeze what you changed</h2>

  <p>Make a list of everything you changed for the sales weekend: offer pages, banners, shipping and return rules, gift cards, opening hours. Write down which of those have ended and which are still live. This is the "truth sheet" you will compare the answers against. Without it, you will not know whether an engine is wrong or just reading something you forgot to update.</p>

  <h2>Ten minutes of questions, three kinds</h2>

  <p>Ask each engine you care about the same set of questions, in a fresh conversation each time.</p>

  <p><strong>Discovery questions.</strong> The ones a gift buyer would ask: "where can I buy [your product type] for [recipient]", "best [category] gifts this month". Note whether you are named and what the engine says about you.</p>

  <p><strong>Offer and policy questions.</strong> "Does [your store] have a sale right now?" "What is [your store]'s return policy for holiday orders?" "What is the last day to order from [your store] for delivery before Christmas?" These are the questions where an out-of-date answer costs you something.</p>

  <p><strong>Comparison questions.</strong> "[Your store] or [competitor] for [product type]?" Read for how you are described, not only whether you are included.</p>

  <h2>Run it twice, a few days apart</h2>

  <p>Run the set once in the first days of December and again a few days later. If the two runs disagree with each other, you have learned something real: the answers are not stable, and any single reading should be held loosely. If they agree with each other and disagree with your truth sheet, you have a page to fix.</p>

  <h2>Read for four problems</h2>

  <ul>
  <li><strong>Ended offers still stated as live.</strong> Often traceable to a page you left up, a cached page, or a third-party listing.</li>
  <li><strong>Old policies.</strong> A return window or shipping cutoff from last year, or from a temporary holiday rule you have since changed.</li>
  <li><strong>Missing completely.</strong> You were not named for a question where you sell exactly the product. Note it; do not panic over one run.</li>
  <li><strong>Named, but described wrongly.</strong> The wrong product line, the wrong location, a competitor's feature credited to you.</li>
  </ul>

  <h2>What to do with what you find</h2>

  <p>For each problem, name the page that should have settled it. Close out expired offers clearly on the page itself ("This offer ended 30 November") rather than deleting the page and leaving a gap. State your current policies in plain sentences near the top of the policy page. Then write the date next to each fix.</p>

  <p>Google's documentation on AI features states there are no extra requirements to appear in its AI results beyond being indexed and eligible to show with a snippet, so the practical work is keeping your ordinary pages clear and current.</p>

  <h2>What this test cannot tell you</h2>

  <p>It cannot tell you whether the weekend's campaigns drove any of what an engine says, or whether a fix will change an answer. Treat the second run as a way to see whether answers moved, not as proof that your changes worked. The honest sentence to write in your notes is "after we changed X, the answer on date Y was Z".</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>Write down what you changed for the weekend and what has ended, ask the engines the questions a buyer would ask, twice, a few days apart, and fix every ended offer or old policy on the page itself, with a date.</p>
  </div>""",
))
```
