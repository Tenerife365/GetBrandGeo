# Draft: Outdated Prices and "In Stock" Claims: Auditing Product-Level Details in Gift Answers

- Queue key: `draft-gift-prices`
- Publish on: 2026-12-11 (queue row `ready from 2026-12-11`)
- Type: practical guide, no new data
- Written on 2026-11-14 by the laptop content session (lot 2, December), second-verified
  the same day (`CST Ops\_runs\2026-11-14_lot2_decembrie\brandgeo\VERIFICARE.md`), converted
  to this format on the desktop on 2026-11-16. Body: about 688 words.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-14

| # | URL | Used for |
|---|---|---|
| 1 | https://developers.google.com/search/docs/appearance/ai-features | Google statements on AI features (no extra requirements, content in text, structured data matching visible text, Merchant Center and Business Profile current) |
| 2 | https://getbrandgeo.com/bg-083.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |
| 3 | https://getbrandgeo.com/bg-047.html | Linked or used in the article; read 2026-11-14 (titles only for bg pages) |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features. It returned 200 on 2026-11-16.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-16.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-11", date_label="December 11, 2026", read=4,
    tags=['Accuracy', 'Gift Season', 'Prices'],
    title='Outdated Prices and "In Stock" Claims: Auditing Product-Level Details in Gift Answers',
    h1='Outdated Prices and <em>"In Stock" Claims</em> in Gift Answers',
    h1_plain='Outdated Prices and "In Stock" Claims in Gift Answers',
    subtitle='A gift buyer who is told the wrong price or that an item is available can arrive annoyed. How to check product-level price and availability statements in AI answers, product by product.',
    meta_desc='A gift buyer told the wrong price or that an item is available can arrive annoyed. How to audit product-level price and availability statements in AI answers.',
    og_desc='Pick five to ten products, ask the questions a shopper would ask, sort each statement into one of five boxes, and trace every wrong figure to a source you control.',
    ld_desc='BrandGEO guide to auditing price and availability statements in AI answers about gift products, with a disclosure of BrandGEO commercial interest.',
    keywords='ai answers wrong price, ai in stock claims, audit ai product details, gift season ai accuracy, outdated price ai assistant, merchant center ai answers',
    about=['AI Visibility', 'Accuracy', 'Gift Season'],
    findings=[('5 to 10', 'products to audit by hand, with a truth sheet of price, availability and date checked'),
              ('5', 'boxes for every statement: matches, out of date, wrong seller, hedged, not given'),
              ('Sources', 'trace each wrong figure to a page, feed or listing you can fix'),
              ('Dated prices', 'put a visible prices-checked date beside any price in a gift guide')],
    faq=[('How do I check prices and availability in AI answers?', 'Pick five to ten products, write a truth sheet with the current price and availability, ask each engine the questions a shopper would ask, and sort every statement against the sheet.'),
         ('Where do wrong prices in AI answers come from?', 'Possibly your own product page, a feed you submit, a marketplace listing, a price comparison site or a review roundup. You cannot change an answer directly, but you can change the sources you control.'),
         ('Should a gift guide include prices?', 'Prices age faster than the rest of the page. Link each item to its live product page, or show a visible prices-checked date and re-check on a schedule.')],
    related=[('/bg-083.html', 'BG-083', 'What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It', 'What to fix on a product page.'),
             ('/bg-047.html', 'BG-047', 'What Happens When an AI Overview Accuses Your Company of Something It Never Did', 'When an AI overview says something false.'),
             ('/bg-053.html', 'BG-053', "How to Read Your Own Brand's AI Answers Like an Auditor", 'Reading your answers like an auditor.')],
    cta_h='Look at my domain first',
    cta_p='If you want a first look at what engines say about your domain before you audit product by product, the free test is enough.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Accuracy",
        lines=[[('Outdated Prices', 'w')], [('and ', 'w'), ('"In Stock" Claims', 'g')]],
        sub=['A product-level audit', 'of gift answers.'],
        stats=[('5 to 10', 'products to audit by hand', 'BG-NNN'),
               ('5', 'boxes to sort each statement', 'BG-NNN'),
               ('Sources', 'trace wrong figures to a fix', 'BG-NNN'),
               ('Dated', 'prices-checked line on guides', 'BG-NNN')],
        footer='Check the Details',
    ),
    body="""  <p>Gift shoppers are on a deadline, which makes two kinds of detail matter more than usual: what an item costs and whether it can be had in time. An assistant that repeats a price you no longer charge, or says an item is available when it sold out, can send a shopper to you with the wrong expectation. This guide covers a product-level audit. It is separate from checking ended campaigns or holiday hours, which BrandGEO's earlier seasonal guide on stale facts already covers.</p>

  <div class="callout">
    <div class="callout-label">Key facts</div>
    <ul>
      <li>Price and availability change faster than almost anything else on a product page, so they are the details most likely to be out of date in a saved or summarised answer.</li>
      <li>Google's documentation on AI features tells site owners to keep Merchant Center and Business Profile information current, which are places you control where product details live.</li>
      <li>Related reading on this site: <a href="/bg-083.html">what to fix on a product page before an AI shopping agent can recommend it</a>, and <a href="/bg-047.html">what happens when an AI overview says something false about your company</a>.</li>
    </ul>
  </div>

  <h2>Pick a small number of products</h2>

  <p>You cannot audit a whole catalogue by hand. Choose five to ten products: your most gifted items, anything that sold out or changed price this season, and a couple of items that you know are hard to find. For each, write down the current price, the current availability and the date you checked. This is your truth sheet. Without it, you cannot tell a wrong answer from a different one.</p>

  <h2>Ask the questions a shopper would ask</h2>

  <p>For each product, ask in a fresh conversation: "How much is [product] at [your store]?" and "Is [product] available from [your store] before the holidays?" Then ask one brand-free version: "Where can I buy [product description]?" Save the whole answer, the engine and the date. If the engine declines to give a price and sends the shopper to your site, record that as its own outcome; it is a safer answer than a wrong figure.</p>

  <h2>Sort every statement into one of five boxes</h2>

  <ul>
    <li><strong>Matches your truth sheet.</strong> Baseline.</li>
    <li><strong>Out of date.</strong> A previous price, or a sale price after the sale ended.</li>
    <li><strong>Attributed to the wrong seller.</strong> A figure that belongs to a reseller or marketplace listing.</li>
    <li><strong>Hedged.</strong> A range, or a warning that prices vary. Not wrong, but not helpful either.</li>
    <li><strong>Not given.</strong> The engine avoids the question. Note it.</li>
  </ul>

  <h2>Trace each wrong figure to a place you can fix</h2>

  <p>For every out-of-date or misattributed statement, look for where it could have come from. Your own product page, a feed you submit, a marketplace listing, a price comparison site, a review roundup. You cannot change an answer directly, but you can change the sources you control. Update the product page, check your feed and your Merchant Center entry, and correct listings on other sites by hand. When an item is sold out, say so in text on the page, with the date, rather than quietly hiding the product.</p>

  <h2>Do not write a price into an article and forget it</h2>

  <p>If you publish a gift guide with prices in it, those figures will age faster than the rest of the page. Either link each item to the live product page and let that carry the price, or put a visible "prices checked on" date beside the list and add the date to your calendar for a re-check. A guide with unmarked prices is the page most likely to be repeated back wrongly in January.</p>

  <h2>What this cannot tell you</h2>

  <p>This audit shows what a few engines said on one day for a handful of products. It does not show how many shoppers saw a wrong figure or what they did next. Keep the language in your notes to match: "on this date, this engine stated this price".</p>

  <p>BrandGEO sells monitoring, so treat our suggestions with that in mind. If you would like the same questions repeated across engines on a regular schedule, that is the paid part of the service; for a first look at your domain, the free test is enough.</p>""",
))
```
