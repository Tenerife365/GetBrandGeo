# Draft: Writing Your Own "Best Gifts" Page So It Can Be Quoted Accurately

- Queue key: `draft-gift-guide-page`
- Publish on: 2026-12-13 (queue row `ready from 2026-12-13`)
- Type: practical guide, no new data
- Written on 2026-11-14 by the laptop content session (lot 2, December), second-verified
  the same day (`CST Ops\_runs\2026-11-14_lot2_decembrie\brandgeo\VERIFICARE.md`), converted
  to this format on the desktop on 2026-11-16. Body: about 682 words.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-14

| # | URL | Used for |
|---|---|---|
| 1 | https://developers.google.com/search/docs/appearance/ai-features | Google statements on AI features (no extra requirements, content in text, structured data matching visible text, Merchant Center and Business Profile current) |
| 2 | https://getbrandgeo.com/bg-087.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 3 | https://getbrandgeo.com/bg-104.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features. It returned 200 on 2026-11-16.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-16.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-13", date_label="December 13, 2026", read=4,
    tags=['How To', 'Gift Season', 'Content'],
    title='Writing Your Own "Best Gifts" Page So It Can Be Quoted Accurately',
    h1='Writing Your Own <em>"Best Gifts" Page</em> So It Can Be Quoted Accurately',
    h1_plain='Writing Your Own "Best Gifts" Page So It Can Be Quoted Accurately',
    subtitle='If assistants answer "best gifts" questions, your own gift guide is a page they might read. How to write it plainly, date it, and avoid saying things that will be wrong by January.',
    meta_desc='If assistants answer best-gifts questions, your own gift guide is a page they might read. How to write it plainly, date it and avoid claims that will be wrong by January.',
    og_desc="Say who each item is for, group by recipient with real headings, show the date, keep claims modest, match page, feed and listing, and plan the page's end of life.",
    ld_desc='BrandGEO writing guide for a gift guide page that AI assistants might read, built on Google AI features documentation, with a disclosure of BrandGEO commercial interest.',
    keywords='write gift guide ai, best gifts page ai quoted, gift guide structure, ai assistants read gift guide, dated gift guide, merchant center gift guide',
    about=['AI Visibility', 'Content Writing', 'Gift Season'],
    findings=[('1 sentence', 'per pick: who it suits and why, in plain words'),
              ('Visible date', 'an updated-on line near the top, with prices left on the product pages'),
              ('No extra markup', 'Google says its AI features need no special markup or AI text file'),
              ('January', 'decide now what happens to the page: archive with a note, replace, or redirect')],
    faq=[('Will a gift guide make AI assistants cite my page?', 'No. Nothing in the guide will make any engine cite your page. Writing well removes avoidable errors from something you control.'),
         ('What does Google say about appearing in its AI features?', "Google's documentation says there are no additional requirements beyond being indexed and eligible to show with a snippet, and that no special markup or AI text file is needed."),
         ('Should a gift guide show prices?', 'Keep prices off the guide where they would age. Show an updated-on date and link each pick to its live product page.')],
    related=[('/bg-087.html', 'BG-087', 'A Pre-Publish Checklist for Making a New Page Citable From Day One', 'A checklist for making a new page citable.'),
             ('/bg-104.html', 'BG-104', "What 'Citation' Actually Means to an AI Model, and Why It Is Not the Same as a Link", 'What citation means to an AI model.'),
             ('/bg-083.html', 'BG-083', 'What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It', 'What to fix on a product page.')],
    cta_h='Check whether engines mention my pages',
    cta_p='If you want to see whether engines currently mention your gift page at all, the free test shows what they say about your domain.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Your Own', 'w')], [('"Best Gifts" Page, ', 'w'), ('Written Well', 'g')]],
        sub=['Plain, dated and modest,', 'so it can be quoted accurately.'],
        stats=[('1 sentence', 'per pick, who it suits', 'BG-NNN'),
               ('Visible date', 'updated-on line near the top', 'BG-NNN'),
               ('0', 'special markup needed, per Google', 'Google'),
               ('January', "plan the page's end of life", 'BG-NNN')],
        footer='Write It Plainly',
    ),
    body="""  <p>Many businesses publish a gift guide in November and forget it. If assistants are asked for gift ideas, that page may be among the things they read, so it is worth making it say clear, true and dated things. This is a writing guide, not a promise: nothing here will make any engine cite your page.</p>

  <div class="callout">
    <div class="callout-label">Key facts</div>
    <ul>
      <li>Google's documentation on AI features says there are no additional requirements to appear in its AI results beyond being indexed and eligible to show with a snippet, and that no special markup or AI text file is needed.</li>
      <li>That documentation recommends keeping important content in text, making structured data match the visible text, and keeping Merchant Center and Business Profile information current.</li>
      <li>BrandGEO has a <a href="/bg-087.html">pre-publish checklist for making a new page citable</a> and an explanation of <a href="/bg-104.html">what citation means to an AI model, and why it is not a link</a>.</li>
    </ul>
  </div>

  <h2>Say who each item is for, in a sentence</h2>

  <p>A list of product names and photos tells a reader little. Give each pick one plain sentence: who it suits, and why. "A compact travel kettle for someone who drinks tea on the road" is more useful to a human, and easier for anything that reads text, than a bare name with an image. Keep every sentence to claims you can stand behind.</p>

  <h2>Organise by recipient or occasion, with real headings</h2>

  <p>Group picks under headings that match how people ask: "For a new parent", "For a colleague", "For someone who has everything". Use proper headings rather than styled text, so the structure survives wherever the page is read. Put the key sentences in text, not only in graphics, as Google's documentation advises.</p>

  <h2>Make the date visible</h2>

  <p>Put a visible line near the top: "Updated on [date]. Availability and prices are on each product page." This does three jobs. It tells a reader how fresh the guide is, it tells you when to re-check it, and it keeps prices out of the guide where they would age. Link every pick to its live product page.</p>

  <h2>Keep claims about yourself modest and specific</h2>

  <p>Avoid "the best" and "the most trusted" unless you can point to what supports it on the same page. Describe what you do: where you ship from, what your return rule is for holiday orders, how to reach you. If the return rule is temporary, say when it ends. State shipping cutoffs only if you have checked them against your carrier, and put the date you checked beside them.</p>

  <h2>Match the page, the feed and the listing</h2>

  <p>Check that the product details in your structured data match what a visitor can read on the page, as the documentation asks, and that your Merchant Center and Business Profile entries tell the same story. A guide that says one thing while a feed says another gives a reader, human or otherwise, two answers to choose from.</p>

  <h2>Plan its end of life</h2>

  <p>Decide now what happens to the page in January. Options: keep it as a dated archive with a note at the top, replace it with a general gifts page, or redirect it. Whichever you choose, write it in your calendar. A forgotten seasonal page is the type most likely to be repeated back out of date a year later.</p>

  <h2>After publishing, test it</h2>

  <p>A week after the guide goes live, run a few of your gift questions and read what comes back. Note whether the engines mention the guide's picks, describe them as you do, or ignore the page entirely. Write down what you see with the date. If nothing changes, that is information too, and not a reason to invent a cause.</p>

  <h2>What this cannot tell you</h2>

  <p>Writing well does not guarantee that a page is read, quoted or acted on. It removes avoidable errors from something you control.</p>

  <p>BrandGEO sells monitoring, so you should weigh our enthusiasm for testing accordingly. If you want to see whether engines currently mention your gift page at all, the free test will show what they say about your domain.</p>""",
))
```
