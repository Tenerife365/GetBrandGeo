# Draft: A or B as a Gift?" How to Test Comparison Questions Without Fooling Yourself

- Queue key: `draft-gift-comparisons`
- Publish on: 2026-12-12 (queue row `ready from 2026-12-12`)
- Type: practical guide, no new data
- Written on 2026-11-14 by the laptop content session (lot 2, December), second-verified
  the same day (`CST Ops\_runs\2026-11-14_lot2_decembrie\brandgeo\VERIFICARE.md`), converted
  to this format on the desktop on 2026-11-16. Body: about 665 words.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-14

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-016.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 2 | https://getbrandgeo.com/bg-081.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 3 | https://getbrandgeo.com/bg-037.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |

## Check before publishing

No external source: the only references are BrandGEO pages (`/bg-NNN.html`).
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-16.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-12", date_label="December 12, 2026", read=4,
    tags=['How To', 'Gift Season', 'Comparisons'],
    title='A or B as a Gift?" How to Test Comparison Questions Without Fooling Yourself',
    h1='"A or B as a Gift?" Testing <em>Comparison Questions</em> Fairly',
    h1_plain='"A or B as a Gift?" Testing Comparison Questions Fairly',
    subtitle='Gift buyers love a head-to-head question. Comparison answers are easy to misread, because the wording of the question often decides the winner. A fair test design.',
    meta_desc='Comparison answers are easy to misread because the wording of the question often decides the winner. A fair test design for gift head-to-head questions.',
    og_desc='Separate product and seller comparisons, swap the order every time, use neutral wording first, sort every sentence about you, and pick three pairs, not thirty.',
    ld_desc='BrandGEO guide to testing head-to-head gift comparison questions in AI answers without flattering yourself, with a disclosure of BrandGEO commercial interest.',
    keywords='ai comparison questions, a or b ai answer, test ai comparison answers, gift comparison ai, ai verdict order effect, brand versus competitor ai answer',
    about=['AI Visibility', 'Comparison Questions', 'Gift Season'],
    findings=[('2', 'kinds of comparison to test separately: product and seller'),
              ('Both orders', 'ask each pair as A or B and as B or A; a verdict that follows the order is unsettled'),
              ('4', 'kinds of sentence about you: accurate and specific, accurate but generic, wrong, borrowed'),
              ('3 pairs', 'run each in both orders, on each engine, on two different days')],
    faq=[('Why can the wording of a comparison question change the answer?', 'Small changes, such as which option is named first or which adjectives are used, can tilt the verdict, and the same pair can get a different verdict on a second run.'),
         ('How do I test a comparison fairly?', 'Ask each pair in both orders, start with a neutral frame such as what the differences are, then add a decision frame and treat the two sets of answers as different evidence.'),
         ("Can I publish an engine's criticism of a rival?", "Only describe a rival's flaws in your notes if the engine said them, and quote it. A screenshot shows what was said on one day, nothing more.")],
    related=[('/bg-016.html', 'BG-016', "Cross-Engine Consensus, When AI Engines Agree, and When They Don't", 'When engines agree and when they do not.'),
             ('/bg-081.html', 'BG-081', 'A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers', 'A quick way to check how you compare.'),
             ('/bg-037.html', 'BG-037', 'Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway', 'Why scores rarely agree.')],
    cta_h='Get a first read on my domain',
    cta_p='If you want an outside read of how engines describe your domain before you choose which pairs to test, the free test is available.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('"A or B as a Gift?"', 'w')], [('Test It Fairly', 'g')]],
        sub=['Swap the order, keep the', 'wording neutral.'],
        stats=[('2', 'kinds of comparison', 'BG-NNN'),
               ('Both orders', 'ask A or B, then B or A', 'BG-NNN'),
               ('4', 'kinds of sentence about you', 'BG-NNN'),
               ('3 pairs', 'not thirty', 'BG-NNN')],
        footer='Fair Comparison',
    ),
    body="""  <p>"Should I get her the leather wallet or the silk scarf?" "Is [store A] or [store B] better for a present?" A buyer who is torn between options often asks an assistant to choose. For a business, a head-to-head answer is high-stakes and easy to misread, because small changes in wording can tilt it. This guide is about asking comparison questions in a way that does not flatter you by accident.</p>

  <div class="callout">
    <div class="callout-label">Key facts</div>
    <ul>
      <li>A comparison answer depends heavily on how the question is phrased: which option is named first, and which adjectives are used.</li>
      <li>The same pair can get a different verdict on a second run.</li>
      <li>BrandGEO has related pieces on <a href="/bg-016.html">when AI engines agree and when they do not</a>, <a href="/bg-081.html">a 10-minute way to check how you compare</a> and <a href="/bg-037.html">why AI visibility scores rarely agree</a>.</li>
    </ul>
  </div>

  <h2>Two kinds of comparison</h2>

  <p>There are product comparisons ("leather wallet or silk scarf") and seller comparisons ("[your store] or [competitor] for gifts"). Test them separately. In a product comparison you want to know whether the engine understands what you sell and who it suits. In a seller comparison you want to know how you are described next to a named rival.</p>

  <h2>Swap the order every time</h2>

  <p>Ask each pair twice: "[A] or [B]?" and "[B] or [A]?". If the verdict follows the order rather than the content, you have learned that the engine is not strongly committed to either, and a single run would have misled you. Record both answers and note whether they agree. If they disagree, treat the pair as unsettled, not as a win or a loss.</p>

  <h2>Use neutral wording</h2>

  <p>Words like "better", "best" and "cheaper" invite a verdict. For a first pass, use a plain frame: "What are the differences between [A] and [B] as gifts?" This usually returns descriptions of both, which is what you want to read. Then add a second question with a decision frame, such as "which should I choose for a friend who likes hiking", and treat the two sets of answers as different kinds of evidence.</p>

  <h2>Read the description, not just the verdict</h2>

  <p>For your own entry, copy every sentence about you and sort it:</p>

  <ul>
    <li><strong>Accurate and specific.</strong> Matches what you sell and who you serve.</li>
    <li><strong>Accurate but generic.</strong> True of any store, so it does not set you apart.</li>
    <li><strong>Wrong.</strong> A feature you do not have, a policy that differs, a location that is not yours.</li>
    <li><strong>Borrowed.</strong> Something that belongs to the rival, credited to you or the reverse.</li>
  </ul>

  <p>The wrong and borrowed rows are your to-do list. For each, name the page on your site that states the right fact, and read it as a stranger would.</p>

  <h2>Be careful with named rivals</h2>

  <p>Only describe a competitor's flaws in your notes if the engine said them, and quote it. Do not infer. Do not publish a screenshot of an engine disparaging a rival as if it proved something; it shows what was said on one day, nothing more. For public pages of your own, state your strengths on their merits and avoid claims you cannot support.</p>

  <h2>Pick three pairs, not thirty</h2>

  <p>Choose the two or three comparisons your customers most plausibly make in December. Run each in both orders, on each engine you track, on two different days. That is a manageable number to read properly, and it gives you enough to see whether answers are stable.</p>

  <h2>What this cannot tell you</h2>

  <p>A comparison test cannot tell you whether shoppers who saw a verdict followed it, or whether a change to your site shifted it. It can show how you are described beside a named alternative and where the description is wrong. Write that and no more.</p>

  <p>BrandGEO sells AI visibility monitoring, which may colour how we see the value of repeating tests like this one. If you want an outside read of how engines describe your domain before you choose which pairs to test, the free test is available.</p>""",
))
```
