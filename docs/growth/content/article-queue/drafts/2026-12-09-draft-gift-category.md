# Draft: Which Category Do AI Answers Put You In? Testing Gift Questions by Product Type

- Queue key: `draft-gift-category`
- Publish on: 2026-12-09 (queue row `ready from 2026-12-09`)
- Type: practical guide, no new data
- Written on 2026-11-14 by the laptop content session (lot 2, December), second-verified
  the same day (`CST Ops\_runs\2026-11-14_lot2_decembrie\brandgeo\VERIFICARE.md`), converted
  to this format on the desktop on 2026-11-16. Body: about 693 words.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-14

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-083.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 2 | https://getbrandgeo.com/bg-049.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 3 | https://developers.google.com/search/docs/appearance/ai-features | Google statements on AI features (no extra requirements, content in text, structured data matching visible text, Merchant Center and Business Profile current) |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features. It returned 200 on 2026-11-16.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-16.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-09", date_label="December 9, 2026", read=4,
    tags=['How To', 'Gift Season', 'Categories'],
    title='Which Category Do AI Answers Put You In? Testing Gift Questions by Product Type',
    h1='Which Category Do AI Answers <em>Put You In</em>?',
    h1_plain='Which Category Do AI Answers Put You In?',
    subtitle='An engine may know your brand and still file it under the wrong category when someone asks for gift ideas. Here is how to test the category label, not just the brand name.',
    meta_desc='An engine may know your brand and still file it under the wrong category when asked for gift ideas. A five-step test of the category label, not just the brand name.',
    og_desc='Write your category words, ask with them without your name, ask what the engine thinks you are, check the page that should settle it, and change one thing at a time.',
    ld_desc='BrandGEO guide to testing the product category an AI assistant attaches to a brand when asked for gift ideas, with a disclosure of BrandGEO commercial interest.',
    keywords='ai category label, ai answers product category, gift ideas ai assistant, test ai brand category, ai visibility gift products, category words ai',
    about=['AI Visibility', 'Product Categories', 'Gift Season'],
    findings=[('3 or 4', "category phrases per product line: your name for it, your supplier's, and a customer's"),
              ('5', 'steps, from your own category words to one logged change'),
              ('3', 'common outcomes: right category, right brand in the wrong category, category missing'),
              ('No special markup', 'Google says its AI features need none, so category clarity comes from readable pages')],
    faq=[('Why test the category an AI answer gives my product?', 'An engine may know your brand yet file a gift product under a neighbouring category, so you can be missing from the list even when the shopper would have wanted you.'),
         ('How do I check which category an engine puts me in?', "Ask gift questions using each category phrase without your name, then ask what your store sells, and compare the engine's description with your own category words."),
         ('Does Google require special markup for its AI features?', "Google's documentation says there is no special markup or extra requirement for its AI results. That statement covers Google's own features only.")],
    related=[('/bg-083.html', 'BG-083', 'What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It', 'What to fix on the page itself.'),
             ('/bg-049.html', 'BG-049', 'AI Shopping Agents Are a Different Visibility Problem Than Chat Answers', 'Why shopping agents differ from chat answers.'),
             ('/bg-103.html', 'BG-103', 'How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately', 'Checking how engines describe your brand.')],
    cta_h='See how engines describe your site',
    cta_p='If you want to see how engines describe your domain before you build your own category list, start with the free test.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Which Category', 'w')], [('Do AI Answers ', 'w'), ('Pick for You', 'g')]],
        sub=['Test the label,', 'not just the brand name.'],
        stats=[('3 or 4', 'category phrases per product line', 'BG-NNN'),
               ('5', 'steps, one change logged', 'BG-NNN'),
               ('3', 'common outcomes to sort answers into', 'BG-NNN'),
               ('0', 'special markup needed, per Google', 'Google')],
        footer='Test the Label',
    ),
    body="""  <p>When a shopper asks an assistant for gift ideas, the first thing the engine decides is which category the request belongs to. If it files your product under a neighbouring category, you can be absent from the list even though the shopper would have wanted you. This guide is about testing that label directly, with a method you can run in an hour and repeat later.</p>

  <div class="callout">
    <div class="callout-label">Key facts</div>
    <ul>
      <li>The same product can be described in several category words, and an engine may favour a different one than your own site does.</li>
      <li>Google's documentation on AI features says there is no special markup or extra requirement for its AI results, so category clarity comes from ordinary, readable pages.</li>
      <li>Two BrandGEO pieces cover related ground: <a href="/bg-083.html">what to fix on a product page before an AI shopping agent can recommend it</a> and <a href="/bg-049.html">why shopping agents are a different visibility problem from chat answers</a>.</li>
    </ul>
  </div>

  <h2>Step 1: write down your own category words</h2>

  <p>For each product line, write the name you use on your site, the name your suppliers use, and the name a customer would use. A shop selling hand-poured candles might use "scented candles", "home fragrance" and "a candle for a gift". Three or four phrases per line is enough. These become the category vocabulary for your questions.</p>

  <h2>Step 2: ask with the category word, never with your name</h2>

  <p>For each phrase, write a gift question: "best [category phrase] as a gift", "[category phrase] gift for someone who is hard to buy for". Ask in a fresh conversation on each engine you care about and paste the answer into your sheet with the date. Because your name is not in the question, the answer shows whether the engine connects your brand to that category by itself.</p>

  <h2>Step 3: ask what the engine thinks you are</h2>

  <p>Now run a short brand-named question for each line: "What does [your store] sell?" and "Is [your store] a good place for [category phrase]?" Compare the engine's description with your category vocabulary. Three outcomes are common, and each calls for a different response.</p>

  <ul>
    <li><strong>Right category, right words.</strong> Record it as a baseline and move on.</li>
    <li><strong>Right brand, wrong category.</strong> The engine knows you, but files you somewhere else. Look at how your own site describes the line in its headings and opening sentences.</li>
    <li><strong>Category missing entirely.</strong> The engine does not connect you with that line at all. This is the first place to look for a thin or hard-to-find page.</li>
  </ul>

  <h2>Step 4: check the page that should settle it</h2>

  <p>For each mismatch, open the page that ought to explain the product. Does the first screen of text say plainly what the product is and who it suits? Is the category word in the title and in a heading, in text form rather than only in an image? Google's documentation asks for important content in text form and for structured data that matches the visible text, so those are fair things to check. Where your pages say it clearly, you have nothing to fix on the page itself and should record the mismatch as an open observation, not an error of yours.</p>

  <h2>Step 5: change one thing and write it down</h2>

  <p>If you change a heading or an opening sentence, log the page, the old wording, the new wording and the date. Then wait before judging. An engine may not reflect a change quickly or at all, and your log is the only way to tell later whether the change happened before or after a different answer appeared.</p>

  <h2>What this cannot tell you</h2>

  <p>It cannot tell you how many shoppers used a category phrase, or whether a different label would have brought you a sale. It can show you whether the words you use and the words engines use have drifted apart, which is a cheap thing to learn in the middle of a busy month.</p>

  <p>BrandGEO sells monitoring for this kind of check, which is a reason to read our advice with care. If you want to see how engines describe your domain before you build your own list, start with the free test.</p>""",
))
```
