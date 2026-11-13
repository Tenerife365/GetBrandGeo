# Draft: How to Keep a Before-and-After Log of AI Answers You Can Trust in January

- Queue key: `draft-answers-log`
- Publish on: 2026-12-05 (queue row `ready from 2026-12-05`)
- Type: practical guide, no new data
- Written on 2026-11-13 by the laptop content session (lot 1, December), second-verified
  the same day (`CST Ops\_runs\2026-11-13_lot1_verif_brandgeo.md`), corrected and converted
  to this format on the desktop on 2026-11-13. Body: about 666 words, shorter than the
  research series by design (a How To planning series).
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-13

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-015.html | Consistency across engines and over time as a KPI |
| 2 | https://getbrandgeo.com/bg-119.html | States date, engines, model names and limits |

## Check before publishing

None needed beyond the routine's own validation: every source is a page on getbrandgeo.com.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-13.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-05", date_label="December 5, 2026", read=3,
    tags=['How To', 'Measurement', 'AI Answers'],
    title='How to Keep a Before-and-After Log of AI Answers You Can Trust in January',
    h1='Keeping a Before-and-After Log of <em>AI Answers</em>',
    h1_plain='Keeping a Before-and-After Log of AI Answers',
    subtitle='A good comparison needs notes written on the day. This is a simple log layout for AI answers, with the fields that make a December reading comparable to a January one.',
    meta_desc='A before-and-after comparison of AI answers fails when the before was never written down. The fields to log for every answer, the rules that keep it honest, and how to read it in January.',
    og_desc='Nine fields per answer and four rules: a simple log that lets you say what an engine said in December and whether it changed by January.',
    ld_desc='BrandGEO guide to keeping a before-and-after log of AI answers: nine fields per answer, four rules for an honest comparison, and how to read December against January.',
    keywords='track ai answers over time, ai answers log template, before and after ai visibility, record chatgpt answers, ai visibility baseline spreadsheet, compare ai answers january',
    about=['AI Visibility', 'Measurement', 'Baseline'],
    findings=[('9', 'fields per answer, from date and model name to the claims made about you'),
              ('4', 'rules that keep the comparison honest'),
              ('1 row', 'per answer, with each run of the same question on its own row'),
              ('0 software', 'needed: a shared spreadsheet is a legitimate method')],
    faq=[('What should I record when I save an AI answer?',
          'The date and time, the engine and model name, the exact question, whether it was a fresh conversation, the full answer as text, whether you were named, each claim about you marked correct or not, the sources shown, and what you changed on your site before the run.'),
         ('Why run the same question more than once?',
          'Answers vary, so two or three runs on the same day are worth more than one. Record each as its own row.'),
         ('Can I quote a rate from a small log?',
          'No. A handful of questions on a handful of engines will not give a rate you can quote. It gives a documented story about specific questions, which is enough to decide what to fix next.')],
    related=[('/bg-015.html', 'BG-015', 'Beyond "Are We Mentioned?": The AI Visibility KPIs That Actually Matter',
              'Consistency over time as a measure.'),
             ('/bg-119.html', 'BG-119', 'AI Visibility in Austin: Three Engines Agree on Home Builders, Not on Lawyers',
              'How a published study states its date, engines and models.'),
             ('/bg-103.html', 'BG-103', 'How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately',
              'Marking each claim right or wrong.')],
    cta_h='Fill in your first rows',
    cta_p='Run the free audit on your own domain for a first look at what AI engines say about you, and log it as your December baseline. No card needed.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Before and After', 'w')], [('Keep the ', 'w'), ('Log', 'g')]],
        sub=['The fields to write down for every', 'AI answer, and how to read them later.'],
        stats=[('9', 'fields per answer', 'BG-NNN'),
               ('4', 'rules for an honest log', 'BG-NNN'),
               ('1', 'row per answer, per run', 'BG-NNN'),
               ('0', 'software needed', 'BG-NNN')],
        footer='Write the Before Down',
    ),
    body="""  <p>The most common reason a before-and-after comparison fails is that the "before" was not written down properly. Someone asked an assistant a few questions in December, remembered the gist, and in January cannot say whether the answer changed. A log fixes that. It does not need software. It needs the same few fields filled in every time.</p>

  <div class="callout">
    <div class="callout-label">What this guide rests on, and what it cannot tell you</div>
    <ul>
      <li><a href="/bg-015.html">BrandGEO's KPI article</a> points to consistency across engines and over time as a measure in its own right, which only works if each run is recorded the same way. Read on 13 November 2026.</li>
      <li><a href="/bg-119.html">BG-119</a> states the date, the engines and the model names used, and what the method cannot show. This log copies that habit at small scale.</li>
    </ul>
    <p>It is a planning guide built from public documentation and our earlier articles, with no new data of its own. It promises no position, traffic or revenue.</p>
  </div>

  <h2>The fields</h2>

  <p>One row per answer. Keep these columns:</p>

  <ul>
  <li><strong>Date and time.</strong> Answers change, so the day matters.</li>
  <li><strong>Engine and model name.</strong> If the product shows a model name, copy it. If it does not, write that it did not.</li>
  <li><strong>The exact question.</strong> Paste it. Do not paraphrase, because a reworded question is a different test.</li>
  <li><strong>Fresh conversation or not.</strong> Earlier turns in a chat shape later answers. Use a new conversation for each test, and note it.</li>
  <li><strong>The full answer, as text.</strong> Not a screenshot alone, because you will want to search it later. A screenshot as a backup is fine.</li>
  <li><strong>Named or not.</strong> Yes, no, or mentioned only in passing.</li>
  <li><strong>Claims about you.</strong> Each factual statement on its own line, marked correct, out of date, invented, or cannot tell.</li>
  <li><strong>Sources shown.</strong> If the engine lists links, record which, and whether any are your own pages.</li>
  <li><strong>Notes.</strong> What you changed on your site before this run, and when.</li>
  </ul>

  <h2>Rules that keep the log honest</h2>

  <p><strong>Same questions every time.</strong> Add new questions in a separate section so you do not mix them into the comparison set.</p>

  <p><strong>More than one run per question.</strong> Answers vary, so two or three runs on the same day are worth more than one. Record each as its own row.</p>

  <p><strong>Write the change log separately.</strong> Keep a second sheet listing every site change with its date: page rewritten, policy corrected, listing updated. That sheet is what lets you say "after X, the answer on date Y was Z", which is a claim you can defend, instead of "X worked", which you cannot.</p>

  <p><strong>Do not clean up the past.</strong> If a December answer was wrong and you are embarrassed, keep it. The wrong answer is the baseline.</p>

  <h2>How to read it in January</h2>

  <p>Put the December and January rows for the same question next to each other. Ask three things: did the engine name you, did it say true things, and did it point at your own pages. Where the answer changed and you changed a page, note the sequence. Where the answer changed and you changed nothing, note that too: it is a reminder that the answers move on their own.</p>

  <p>Resist the urge to count. A handful of questions on a handful of engines will not give a rate you can quote. What it gives you is a documented story about specific questions, and that is enough to decide what to fix next.</p>

  <h2>When a log is not enough</h2>

  <p>If your question list grows beyond what you can run by hand, or you need many runs to see a pattern, a tool starts to make sense. Until then, a shared spreadsheet is a legitimate method, and a good one to start from because it forces you to decide what you are measuring.</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>One row per answer, the same fields every time, the same questions every time, more than one run per question, a separate sheet of site changes with dates, and no tidying of the past. In January, put the rows side by side.</p>
  </div>""",
))
```
