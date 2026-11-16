# Draft: Building a Gift-Season Question Set: Who Is the Gift For, and What Would They Ask?

- Queue key: `draft-gift-question-set`
- Publish on: 2026-12-08 (queue row `ready from 2026-12-08`)
- Type: practical guide, no new data
- Written on 2026-11-14 by the laptop content session (lot 2, December), second-verified
  the same day (`CST Ops\_runs\2026-11-14_lot2_decembrie\brandgeo\VERIFICARE.md`), converted
  to this format on the desktop on 2026-11-16. Body: about 740 words.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-14

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-081.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 2 | https://getbrandgeo.com/bg-103.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 3 | https://getbrandgeo.com/blog.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |

## Check before publishing

No external source: the only references are BrandGEO pages (`/bg-NNN.html`).
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-16.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-08", date_label="December 8, 2026", read=4,
    tags=['How To', 'Gift Season', 'Question Set'],
    title='Building a Gift-Season Question Set: Who Is the Gift For, and What Would They Ask?',
    h1='Building a Gift-Season <em>Question Set</em>: Who Is the Gift For?',
    h1_plain='Building a Gift-Season Question Set: Who Is the Gift For?',
    subtitle='Gift questions are different from ordinary buying questions. A small, fixed set built around recipient, budget and occasion gives you something to run now and repeat in January.',
    meta_desc='How to build a small, fixed set of gift questions around recipient, budget and occasion, run it now and repeat it in January without drawing conclusions about sales.',
    og_desc='Start from the recipient, add budget and occasion, keep brand-free and brand-named questions apart, and save every answer with its date and engine.',
    ld_desc='BrandGEO guide to building a fixed set of gift-season questions for testing AI answers, built around recipient, budget and occasion, with a disclosure of BrandGEO commercial interest.',
    keywords='gift season ai questions, test ai answers gift questions, gift question set, ai visibility holiday test, brand free questions, ai answers holiday shopping',
    about=['AI Visibility', 'Gift Season', 'Testing Method'],
    findings=[('6 to 8', 'recipients to start from, each turned into a question in the words a customer would type'),
              ('2', 'versions of each question: a plain one, and one with a budget phrase and an occasion phrase'),
              ('Brand-free', 'most questions leave your name out; keep two or three that name you and never compare across the two groups'),
              ('Fixed wording', 'save the full answer with date and engine, and record any word you change')],
    faq=[('How do I write gift questions to test AI answers?', "Start from the recipient, not the product. List six to eight people your customers buy for, turn each into a question in a customer's words, then add a second version with a budget phrase and an occasion phrase."),
         ('Should the gift questions include my brand name?', 'Mostly no. Brand-free questions show whether you appear when the buyer has not heard of you. Keep two or three brand-named ones, label each, and do not compare results across the two groups.'),
         ('What can a gift question set not tell me?', 'It cannot tell you how many shoppers asked the same thing or whether being named led to a sale. It shows what a few engines said on a given day to wording you chose.')],
    related=[('/bg-081.html', 'BG-081', 'A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers', 'A check you can run by hand before you build the set.'),
             ('/bg-103.html', 'BG-103', 'How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately', 'The habit this gift set borrows.'),
             ('/bg-016.html', 'BG-016', "Cross-Engine Consensus, When AI Engines Agree, and When They Don't", 'Why one run of one question proves little.')],
    cta_h='See where you stand first',
    cta_p='If you want a first look at what engines say about your domain before you build your own set, the free test shows it.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Gift Questions', 'w')], [('Built Around ', 'w'), ('the Recipient', 'g')]],
        sub=['A fixed set you can run now,', 'and repeat in January.'],
        stats=[('6 to 8', 'recipients to start from', 'BG-NNN'),
               ('2', 'versions of each question', 'BG-NNN'),
               ('Brand-free', 'most questions leave your name out', 'BG-NNN'),
               ('Same words', 'kept fixed between runs', 'BG-NNN')],
        footer='Write It Down',
    ),
    body="""  <p>Someone shopping for a gift often does not know what they want. They know who it is for, roughly what they can spend and when it has to arrive. That is why gift questions look different from ordinary product searches, and why a test built from your product names will miss most of them. This guide shows how to write a small set of gift questions that you can run this week and run again later, without drawing any conclusion about sales.</p>

  <div class="callout">
    <div class="callout-label">Key facts</div>
    <ul>
      <li>A gift question usually names a recipient, a budget or an occasion before it names a product.</li>
      <li>AI answers can change from one run to the next, so one reading of one question proves very little.</li>
      <li>The set is only useful if you keep the wording fixed and save the full text with the date.</li>
    </ul>
  </div>

  <h2>Start from the recipient, not the product</h2>

  <p>List the people your customers buy for. A bookshop might write: a teenager who does not read, a colleague in a secret exchange, a grandparent, a new parent. A kitchenware store might write: someone who just moved, a friend who bakes, a host for a dinner. Aim for six to eight recipients. Then turn each into a question in the words a customer would type: "what should I get for a friend who just started baking" or "gift for a grandfather who has everything".</p>

  <h2>Add the two constraints people always add</h2>

  <p>Most gift questions carry a limit. Take your six recipients and give each a second version with a budget phrase and an occasion phrase: "under a modest budget", "for a secret gift exchange", "that can arrive before the holidays". Write the budget in words you can defend from your own catalogue. You do not need to name a figure; you need a phrase you can later check against what you actually sell.</p>

  <h2>Keep a short set of brand-free questions</h2>

  <p>The point of this set is to find out whether you appear when the buyer has not heard of you. So most of the questions must not contain your brand name. Keep two or three that do, for example "is [your store] a good place for gifts", because those show what the engine says about you once someone asks. Label each question as either "brand-free" or "brand-named" in your sheet, and never compare results across the two groups as if they were the same thing.</p>

  <h2>Fix the wording and the method</h2>

  <p>Write the final set into a table: number, question, type, date asked, engine, and the pasted answer. Ask each question in a fresh conversation. If the engine offers follow-up options, ignore them for the first pass. If you change a word between runs, record that you did, or the comparison is worthless. Two short runs a few days apart tell you more than one long one, because they show how much the answers move on their own.</p>

  <h2>What to read for on the first pass</h2>

  <ul>
    <li>Were you named at all, and for which recipients?</li>
    <li>Which other stores or brands were named in the same answers?</li>
    <li>Did the engine describe your range correctly, or credit you with something you do not sell?</li>
    <li>Did it hedge and tell the buyer to check elsewhere?</li>
  </ul>

  <p>Do not turn these into a score yet. A count of mentions out of twenty questions looks tidy and hides the fact that the questions were chosen by you. BrandGEO has a short guide on checking what is said about a brand in <a href="/bg-081.html">a 10-minute competitor check</a> and one on <a href="/bg-103.html">checking whether engines describe your brand accurately</a>; this gift set is the seasonal version of those habits.</p>

  <h2>What this cannot tell you</h2>

  <p>A question set cannot tell you how many real shoppers asked the same thing, or whether being named led to a sale. It shows you what a handful of engines said on a given day to wording you chose. That is useful as a record and as a starting list of pages to improve, and it should be described that way to anyone who reads your notes.</p>

  <p>BrandGEO sells AI visibility monitoring, so weigh our advice with that in mind. If you would like the questions repeated for you on a schedule once your set is stable, that is what the paid monitoring is for; the free test is a quick way to see where you stand before you build the set.</p>""",
))
```
