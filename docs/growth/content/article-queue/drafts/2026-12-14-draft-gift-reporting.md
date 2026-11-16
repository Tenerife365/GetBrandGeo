# Draft: Reporting Gift-Season AI Tests Without Promises: A One-Page Template

- Queue key: `draft-gift-reporting`
- Publish on: 2026-12-14 (queue row `ready from 2026-12-14`)
- Type: practical guide, no new data
- Written on 2026-11-14 by the laptop content session (lot 2, December), second-verified
  the same day (`CST Ops\_runs\2026-11-14_lot2_decembrie\brandgeo\VERIFICARE.md`), converted
  to this format on the desktop on 2026-11-16. Body: about 686 words.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-14

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-015.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 2 | https://getbrandgeo.com/bg-070.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 3 | https://getbrandgeo.com/bg-037.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |

## Check before publishing

No external source: the only references are BrandGEO pages (`/bg-NNN.html`).
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-16.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-14", date_label="December 14, 2026", read=4,
    tags=['Reporting', 'Gift Season', 'Template'],
    title='Reporting Gift-Season AI Tests Without Promises: A One-Page Template',
    h1='Reporting Gift-Season AI Tests <em>Without Promises</em>',
    h1_plain='Reporting Gift-Season AI Tests Without Promises',
    subtitle='You ran the tests. Now someone wants a summary. A one-page structure that says what was asked, what was said, what you changed, and what you cannot claim.',
    meta_desc='You ran the tests and someone wants a summary. A one-page structure that says what was asked, what was said, what you changed and what you cannot claim.',
    og_desc='Six short sections: what we asked, what was said, what was wrong, what we changed, what we cannot claim, and what we will do next.',
    ld_desc='BrandGEO one-page template for reporting gift-season AI answer tests without promises, with a disclosure of BrandGEO commercial interest.',
    keywords='report ai visibility tests, ai answer test report template, ai visibility report no promises, gift season ai report, what we cannot claim ai, one page ai report',
    about=['AI Visibility', 'Reporting', 'Gift Season'],
    findings=[('6', 'short sections that fit on one page, with the evidence in an appendix'),
              ('Counts', 'results as plain counts with denominators and dates, not percentages from small sets'),
              ('4', 'things to say you cannot claim: reach, visits or sales, cause, and a limited question set'),
              ('2 or 3', 'next steps only: pages to fix, questions to add, a re-run date')],
    faq=[('What should a report on AI answer tests contain?', 'What was asked, what was said, what was wrong, what you changed, what you cannot claim, and what you will do next, with the full questions and saved answers in an appendix.'),
         ('Should I report percentages from a small set of questions?', 'No. Percentages from small sets look more precise than the data is. Give the number out of the total and name the date.'),
         ('What language should a report avoid?', 'Avoid phrases such as improved visibility or ranked first unless a saved answer on a stated date says exactly that, and avoid sentences that begin because we followed by a result.')],
    related=[('/bg-070.html', 'BG-070', 'Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead', 'Why GEO cannot be tracked with a pixel.'),
             ('/bg-037.html', 'BG-037', 'Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway', 'Why scores from different tools disagree.'),
             ('/bg-015.html', 'BG-015', 'Beyond "Are We Mentioned?": The AI Visibility KPIs That Actually Matter', 'What to measure beyond a mention.')],
    cta_h='Start my baseline',
    cta_p='If you want a baseline to start your first report from, the free test gives you a first set of answers about your domain.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Reporting",
        lines=[[('Reporting AI Tests', 'w')], [('Without ', 'w'), ('Promises', 'g')]],
        sub=['A one-page template for', 'what you can and cannot claim.'],
        stats=[('6', 'short sections, one page', 'BG-NNN'),
               ('Counts', 'with denominators and dates', 'BG-NNN'),
               ('4', 'things you cannot claim', 'BG-NNN'),
               ('2 or 3', 'concrete next steps', 'BG-NNN')],
        footer='One Page',
    ),
    body="""  <p>After a week of gift questions, category checks and price audits, you have a pile of pasted answers. Someone, a manager, a client, a partner, wants to know "how did we do". The honest reply is not a single number. This guide gives a one-page structure that is useful to the reader and does not promise anything the tests cannot support.</p>

  <div class="callout">
    <div class="callout-label">Key facts</div>
    <ul>
      <li>AI answers vary between runs and between engines, so a report should show the method and the dates, not only the findings.</li>
      <li>No pixel counts these answers; BrandGEO has explained <a href="/bg-070.html">why GEO cannot be tracked with a pixel</a>, and <a href="/bg-037.html">why visibility scores from different tools disagree</a>.</li>
      <li>For ideas on what to measure beyond a simple "were we mentioned", see <a href="/bg-015.html">the AI visibility KPIs that matter</a>.</li>
    </ul>
  </div>

  <h2>Section 1: What we asked</h2>

  <p>State the number of questions, how they were grouped (recipient, category, product, comparison), which engines were used and the dates. Add a line on method: fresh conversation for each question, wording fixed, each question run more than once. Attach the full table of questions and saved answers as an appendix, so a reader can check any claim for themselves.</p>

  <h2>Section 2: What was said</h2>

  <p>Describe results in plain counts with denominators: "in the saved answers to the brand-free recipient questions, our store was named in some and not in others". If you give numbers, give the number out of the total and name the date. Do not give percentages from small sets; they look more precise than the data is. Keep brand-free and brand-named questions apart.</p>

  <h2>Section 3: What was wrong</h2>

  <p>A short table is best: the statement, the engine, the date, the correct fact, and the page that should have settled it. This is the part of the report that leads to action, and it is the part least open to argument, because it compares the answer with a fact you can show.</p>

  <h2>Section 4: What we changed</h2>

  <p>List each change with its date: page edited, listing corrected, feed updated, guide published. Beside each, leave a blank for "answer on re-test". A reader can then see the order of events without you having to claim a link between them.</p>

  <h2>Section 5: What we cannot claim</h2>

  <p>This section is the one that protects you. Write it in full sentences:</p>

  <ul>
    <li>We cannot say how many shoppers saw these answers.</li>
    <li>We cannot say whether any answer led to a visit or a sale.</li>
    <li>We cannot say that a change to our site caused a change in an answer.</li>
    <li>Results are from a limited set of questions chosen by us, on the dates shown.</li>
  </ul>

  <h2>Section 6: What we will do next</h2>

  <p>Keep this to two or three concrete items: pages to fix, questions to add, a date to re-run the same set in January. Resist adding forecasts. If someone asks for a target, offer a plan for what will be measured and when, not a figure you cannot defend.</p>

  <h2>Language to avoid</h2>

  <p>Skip words such as "improved visibility", "won the holiday season" or "ranked first" unless a saved answer on a stated date says exactly that, and even then say it as a quote. Avoid sentences that begin "because we" followed by a result. Prefer "after we changed X on [date], the answer on [date] was Y".</p>

  <h2>Say who the report is for</h2>

  <p>Put the reader's name or role at the top and one line on what decision the report supports. A report with no stated purpose tends to be read as a scorecard.</p>

  <h2>Keep it to one page</h2>

  <p>Six short sections fit on a page. The appendix carries the evidence. A busy reader should be able to get through the page in a few minutes and know what was done, what was found and what is still unknown.</p>

  <p>BrandGEO sells monitoring that repeats questions like these on a schedule, so we have an interest in you wanting a regular record. If you would like a baseline to start your first report from, the free test gives you a first set of answers about your domain.</p>""",
))
```
