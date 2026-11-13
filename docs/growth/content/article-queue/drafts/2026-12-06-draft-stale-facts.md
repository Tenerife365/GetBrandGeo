# Draft: Seasonal Facts That Go Stale: Checking What AI Still Says About Your Ended Offers and Holiday Hours

- Queue key: `draft-stale-facts`
- Publish on: 2026-12-06 (queue row `ready from 2026-12-06`)
- Type: practical guide, no new data
- Written on 2026-11-13 by the laptop content session (lot 1, December), second-verified
  the same day (`CST Ops\_runs\2026-11-13_lot1_verif_brandgeo.md`), corrected and converted
  to this format on the desktop on 2026-11-13. Body: about 701 words, shorter than the
  research series by design (a How To planning series).
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-13

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-115.html | Which year engines say recommendations are for |
| 2 | https://getbrandgeo.com/bg-105.html | Method for correct, stale or invented brand facts |
| 3 | https://developers.google.com/search/docs/appearance/ai-features | No special requirements to appear in Google's AI features |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features. All returned 200 on 2026-11-13.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-13.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-06", date_label="December 6, 2026", read=4,
    tags=['How To', 'Brand Facts', 'AI Answers'],
    title='Seasonal Facts That Go Stale: Checking What AI Still Says About Your Ended Offers and Holiday Hours',
    h1='Seasonal Facts That Go Stale in <em>AI Answers</em>',
    h1_plain='Seasonal Facts That Go Stale in AI Answers',
    subtitle='Offers end, cutoffs pass and hours change in December. A short audit shows which seasonal facts AI answers may still repeat, and which of your pages to update.',
    meta_desc='Ended sales, holiday hours, shipping cutoffs: a five-step December audit of what AI answers still say about facts that are no longer true, and how to fix the source pages.',
    og_desc='A small audit for the first week of December: what AI answers still say about offers, hours and cutoffs that have expired, and how to close them out at the source.',
    ld_desc='BrandGEO five-step audit of seasonal facts in AI answers: list expiring facts, ask customer questions, sort the answers, fix the source pages and listings, and set reminders before each expiry date.',
    keywords='ai answers outdated information, chatgpt wrong opening hours, stale facts ai search, expired offer ai answer, holiday hours ai assistant, fix outdated ai answers',
    about=['AI Visibility', 'Brand Accuracy', 'Holiday Season'],
    findings=[('5', 'steps: list, ask, sort, fix the source, set reminders'),
              ('5', 'ways to sort an answer: correct, stated as live but ended, vague, invented, silent'),
              ('Ended but live', 'the costly case: a customer arrives expecting something you no longer offer'),
              ('No extra markup', 'Google says no special requirements apply, so the fix starts with an ordinary page')],
    faq=[('Why does ChatGPT still show my old holiday hours?',
          'The answer may have learned the fact from a page or listing that still states it. Find every place the fact is published, including partner listings and directory entries, and update them, then re-ask the question a few days later.'),
         ('Should I delete an expired offer page?',
          'No. Keep the page and add a plain sentence at the top saying what the offer was and the date it ended.'),
         ('Can I make an AI engine forget an old fact?',
          'No. You cannot edit an answer. You can make the true statement easy to find and the old one clearly closed, and record the date of each change.')],
    related=[('/bg-115.html', 'BG-115', 'Which Year AI Engines Say Their Local Recommendations Are For',
              'Which year engines say their recommendations are for.'),
             ('/bg-105.html', 'BG-105', 'The Brand Fact Error Rate, We Published the Method Before the Data',
              'Scoring facts as correct, stale or invented.'),
             ('/bg-103.html', 'BG-103', 'How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately',
              "Checking a brand's key facts.")],
    cta_h='Find your first stale facts',
    cta_p='Run the free audit on your own domain to see what AI engines say about it right now, and start your list of facts to close out. No card needed.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Seasonal Facts', 'w')], [('That Go ', 'w'), ('Stale', 'g')]],
        sub=['What AI answers still say about offers,', 'hours and cutoffs that have ended.'],
        stats=[('5', 'steps in the audit', 'BG-NNN'),
               ('5', 'ways to sort an answer', 'BG-NNN'),
               ('1', 'sentence to close an ended offer', 'BG-NNN'),
               ('0', 'special requirements, per Google', 'Google')],
        footer='Fix the Source, Not the Symptom',
    ),
    body="""  <p>Every business has facts with an expiry date: a sale that ended on 30 November, a shipping cutoff for the holidays, opening hours that change for a week, a bundle sold only this season. The page you wrote is easy to update. The places an answer might have learned the fact from are harder to see. This guide is a small audit for the first week of December on one question: what do AI answers still say about things that are no longer true?</p>

  <div class="callout">
    <div class="callout-label">What this guide rests on, and what it cannot tell you</div>
    <ul>
      <li>BrandGEO has published on <a href="/bg-115.html">the year engines say their local recommendations are for</a>, and on <a href="/bg-105.html">a method for scoring how correct, stale or invented the facts about a brand are</a>.</li>
      <li>Google's documentation says there are no special requirements to appear in its AI features beyond being indexed and eligible to show with a snippet, so the fix for a stale fact usually starts with an ordinary page.</li>
    </ul>
    <p>It is a planning guide built from public documentation and our earlier articles, with no new data of its own. It promises no position, traffic or revenue.</p>
  </div>

  <h2>Step 1: list your expiring facts</h2>

  <p>Make a table with four columns: the fact, the page that states it, the date it stops being true, and where else it is published. Typical rows: a percentage-off campaign, a free-shipping threshold, a last-order date, holiday opening hours, a gift bundle, a price valid "until". Include partner listings and directory entries in the last column. Those are often the copies nobody updates.</p>

  <h2>Step 2: ask the questions a customer would ask</h2>

  <p>For each row, write one question that a customer would put to an assistant, using the words a customer would use. "Is [your business] open on 24 December?" "Is the [campaign name] still on at [your business]?" "How late can I order from [your business] for Christmas delivery?" Ask each in a fresh conversation, on the engines your customers are likely to use, and save the full text with the date.</p>

  <h2>Step 3: sort what you read</h2>

  <ul>
  <li><strong>Correct and current.</strong> Nothing to do. Record it as your baseline.</li>
  <li><strong>Stated as live, but ended.</strong> The costly case. A customer may arrive expecting something you no longer offer.</li>
  <li><strong>Vague.</strong> The engine hedges, says to check the website, or gives general advice. That is not an error, but it is a sign no clear page was found.</li>
  <li><strong>Invented.</strong> Hours you never had, an offer you never made. Note the exact wording.</li>
  <li><strong>Silent.</strong> The engine does not mention you for the question. Not a stale fact, but worth noting.</li>
  </ul>

  <h2>Step 4: fix the source, not the symptom</h2>

  <p>You cannot edit an answer. You can make the true statement easy to find and the old one clearly closed. For ended offers, keep the page and add a plain sentence at the top: what it was, and the date it ended. For hours and cutoffs, put the current rule in a sentence near the top of the relevant page, not only in a banner or an image. Update partner and directory listings by hand. Then write the date of each change in your log.</p>

  <h2>Step 5: set the reminder before the season ends, not after</h2>

  <p>The audit is easiest on the day an offer expires. Put each expiry date in a shared calendar with a short task: update the page, check the listings, re-ask the question in a few days. For next year, build the "ended" sentence into the offer page when you create it.</p>

  <h2>What this audit cannot do</h2>

  <p>It cannot make an engine forget something, and it cannot tell you how many customers saw an old answer. It can show you which stale facts are visible when you ask, and give you a list of pages to fix with dates beside them. Re-run the same questions in a few days and in January and write down whether the answers changed.</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>List every fact with an expiry date and everywhere it is published, ask the questions a customer would ask, sort what you read, and close ended offers on the page itself with the date. Put next year's expiry dates in a calendar now.</p>
  </div>""",
))
```
