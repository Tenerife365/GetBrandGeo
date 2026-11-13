# Draft: Seven Questions to Ask Before You Fund AI Visibility Work in 2027, Whatever You Choose

- Queue key: `draft-fund-questions`
- Publish on: 2026-12-07 (queue row `ready from 2026-12-07`)
- Type: practical guide, no new data
- Written on 2026-11-13 by the laptop content session (lot 1, December), second-verified
  the same day (`CST Ops\_runs\2026-11-13_lot1_verif_brandgeo.md`), corrected and converted
  to this format on the desktop on 2026-11-13. Body: about 792 words, shorter than the
  research series by design (a How To planning series).
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-13

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-084.html | Budget case: indicators are not revenue numbers |
| 2 | https://getbrandgeo.com/bg-015.html | Direction over repeated runs |
| 3 | https://developers.google.com/search/docs/appearance/ai-features | No special optimization for Google's AI features |
| 4 | https://getbrandgeo.com/ | Free plan: 1 project, 5 buyer prompts, Gemini visibility, monthly refresh, baseline score (read 2026-11-13) |
| 5 | https://aisaasradar.com/plans.php | GEO Pack of BrandGEO-run tests sold on AI SaaS Radar (read 2026-11-13 by the verifier) |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features, https://aisaasradar.com/plans.php. All returned 200 on 2026-11-13.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-13.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-07", date_label="December 7, 2026", read=4,
    tags=['How To', 'Planning', 'Buying Guide'],
    title='Seven Questions to Ask Before You Fund AI Visibility Work in 2027, Whatever You Choose',
    h1='Seven Questions Before You Fund <em>AI Visibility</em> in 2027',
    h1_plain='Seven Questions Before You Fund AI Visibility in 2027',
    subtitle='Do it by hand, hire someone, or use a tool. These seven questions work for any of the three, and they help you see what you are really buying.',
    meta_desc='Do it by hand, hire someone or use a tool: seven questions that show what you are really buying with AI visibility work in 2027, from what is counted to what happens when results are bad.',
    og_desc='What is counted, which engines, how many runs, can you see the answers, accuracy, promises, and your own follow-through: seven questions for any AI visibility option.',
    ld_desc="BrandGEO planning guide with seven questions to ask before funding AI visibility work in 2027, whichever option is chosen, with a disclosure of BrandGEO's own commercial interest.",
    keywords='questions to ask ai visibility tool, choose ai visibility service, geo agency questions, ai brand monitoring buying guide, fund ai visibility 2027, ai visibility vendor checklist',
    about=['AI Visibility', 'Buying Guide', 'Budget Planning'],
    findings=[('7', 'questions that work for doing it by hand, hiring help or using a tool'),
              ('3 columns', 'to take into the planning meeting: by hand, hire help, use a tool'),
              ('Not stated', 'the answer to write where nobody knows yet; the gaps are the useful part'),
              ('No secret switch', 'Google says its own AI features need no special optimization beyond indexing and snippet eligibility')],
    faq=[('What should I ask before paying for AI visibility work?',
          'What exactly is counted, which engines and who chose them, how many times each question is run, whether you can see the actual answers, whether accuracy is checked, what is promised in words, and what you will do if the results come back bad.'),
         ('Can anyone guarantee a position in AI answers?',
          "Be careful with promises of position, share or revenue. For Google's own AI features, Google says no special optimization is needed beyond being indexed and eligible to show with a snippet, which is a fair reminder that no one can honestly promise a secret switch."),
         ('Does BrandGEO answer these questions about itself?',
          'Partly, on its homepage: the free plan covers one project, five buyer prompts and Gemini visibility, refreshed monthly, with a baseline score. Ask to see the answers behind any score, ours included.')],
    related=[('/bg-084.html', 'BG-084', 'A Board-Ready Case for a GEO Budget When There Is No ROI Metric to Show',
              'Making the budget case once you have chosen.'),
             ('/bg-015.html', 'BG-015', 'Beyond "Are We Mentioned?": The AI Visibility KPIs That Actually Matter',
              'The measures worth asking about.'),
             ('/bg-081.html', 'BG-081', 'A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers',
              'A check you can run by hand first.')],
    cta_h='Try it before you decide',
    cta_p='If you want to see what a first set of results looks like for your own domain before you choose, the free audit costs nothing and needs no card.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Seven Questions', 'w')], [('Before You ', 'w'), ('Fund It', 'g')]],
        sub=['For doing it by hand, hiring help,', 'or buying a tool, ours included.'],
        stats=[('7', 'questions for any option', 'BG-NNN'),
               ('3', 'columns for the planning meeting', 'BG-NNN'),
               ('Not stated', 'the honest answer where nobody knows', 'BG-NNN'),
               ('0', 'special requirements, per Google', 'Google')],
        footer='Ask Before You Sign',
    ),
    body="""  <p>Full disclosure first: we make BrandGEO, an AI visibility product, and it comes from the same team that runs AI SaaS Radar. AI SaaS Radar also sells a one-off pack of AI visibility tests that BrandGEO runs, so we have a commercial interest in your choice. So this guide is written to be useful if you decide to do the work by hand, hire a person or agency, or buy a tool, ours or someone else's. It does not mention any price, because the right amount depends on your situation and we would not guess it.</p>

  <div class="callout">
    <div class="callout-label">What this guide rests on, and what it cannot tell you</div>
    <ul>
      <li>Google's documentation says no special optimization is needed to appear in its AI features beyond being indexed and eligible to show with a snippet. For Google's own AI features, that is a useful test for any service that claims a special way in. Read on 13 November 2026.</li>
      <li>BrandGEO's earlier articles argue that AI visibility is measured as direction over repeated runs, not as a single score (<a href="/bg-015.html">BG-015</a>), and that a budget case should say plainly that the indicators are not revenue numbers (<a href="/bg-084.html">BG-084</a>).</li>
    </ul>
    <p>It is a planning guide built from public documentation and our earlier articles, with no new data of its own. It promises no position, traffic or revenue.</p>
  </div>

  <h2>1. What exactly is being counted?</h2>

  <p>Ask for the unit: a question asked, an answer collected, an engine covered, a report delivered. Two offers that look similar can count different things, and the cheaper-looking one may count something you do not need. Write the unit next to each option before you compare anything else.</p>

  <h2>2. Which engines, and who chose them?</h2>

  <p>Your buyers may use one assistant far more than another, and that can differ by market and by age. Ask which engines are covered, how the list is updated when a new one matters, and whether you can add one. If the answer is "all of them", ask which ones, by name.</p>

  <h2>3. How many times is each question run?</h2>

  <p>Answers vary from run to run. A service that runs each question once and reports a position is reporting a snapshot. Ask what is done about the variation: repeated runs, a stated range, or nothing. This matters more than any dashboard design.</p>

  <h2>4. Can you see the actual answers?</h2>

  <p>If all you get is a score, you cannot check it, and you cannot find the wrong statement that needs fixing. Ask whether the full text of each answer is available, with date and engine. If you are doing it by hand, this is the log you are keeping anyway.</p>

  <h2>5. What does it say about accuracy, not only mentions?</h2>

  <p>Being named is one thing. Being described correctly is another. Ask whether the work includes checking what is said about you against what is true, and what happens when something is wrong: who tells you, and who fixes the page.</p>

  <h2>6. What does it promise, in words?</h2>

  <p>Read the sentence about outcomes. Be careful with promises of position, share or revenue. Given how AI answers behave, a defensible promise sounds like "we will measure and report on these questions at this interval and tell you what is wrong". Google's statement covers its own features, and it is a fair reminder that no one can honestly promise a secret switch.</p>

  <h2>7. What will you do differently if the answer comes back bad?</h2>

  <p>This one is for you, not the seller. If the first set of results shows you are rarely named, or described incorrectly, do you have someone who will update the pages and re-run the questions? A report nobody acts on is the most expensive kind. If you do not have that person, the budget line should include their time before it includes any tool.</p>

  <h2>The same questions, asked of us</h2>

  <p>Our homepage answers part of them for our free plan: one project, five buyer prompts, Gemini visibility, a monthly refresh and a baseline score. That settles question 2 for that plan, and question 4 applies to us as much as to anyone: ask to see the answers behind any score, ours included.</p>

  <h2>Using the questions</h2>

  <p>Take three columns into your planning meeting: do it by hand, hire help, use a tool. Fill in the seven rows for each, with "not stated" where the answer is not known. The gaps are the useful part: they show what you would have to find out before signing anything.</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>Put three options side by side, by hand, hire help, use a tool, and answer the same seven questions for each, writing not stated where nobody knows. Fund the person who will act on bad results before you fund any tool.</p>
  </div>""",
))
```
