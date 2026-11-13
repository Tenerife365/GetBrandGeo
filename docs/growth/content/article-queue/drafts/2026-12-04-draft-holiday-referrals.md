# Draft: Reading Your Holiday Analytics for AI Referrals: What a Visit Shows and What It Hides

- Queue key: `draft-holiday-referrals`
- Publish on: 2026-12-04 (queue row `ready from 2026-12-04`)
- Type: practical guide, no new data
- Written on 2026-11-13 by the laptop content session (lot 1, December), second-verified
  the same day (`CST Ops\_runs\2026-11-13_lot1_verif_brandgeo.md`), corrected and converted
  to this format on the desktop on 2026-11-13. Body: about 734 words, shorter than the
  research series by design (a How To planning series).
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-13

| # | URL | Used for |
|---|---|---|
| 1 | https://getbrandgeo.com/bg-070.html | Tracking records a visit; last-click credits the last page |
| 2 | https://getbrandgeo.com/bg-015.html | Some AI visits arrive without a referrer |
| 3 | https://developers.google.com/search/docs/appearance/ai-features | AI feature traffic counted under the Web search type |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for each external source: https://developers.google.com/search/docs/appearance/ai-features. All returned 200 on 2026-11-13.
Every internal link (`/bg-NNN.html`) points to a page that exists in brandgeo/web on 2026-11-13.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-12-04", date_label="December 4, 2026", read=4,
    tags=['How To', 'Analytics', 'AI Referrals'],
    title='Reading Your Holiday Analytics for AI Referrals: What a Visit Shows and What It Hides',
    h1='Reading Holiday Analytics for <em>AI Referrals</em>',
    h1_plain='Reading Holiday Analytics for AI Referrals',
    subtitle='After the sales weekend, your analytics may show visits from AI products. Here is what those visits can support, what they cannot, and how to report them honestly.',
    meta_desc='AI referral visits in your holiday analytics show some clicks from AI products. Here is what that line can support in a year-end report, what it leaves out, and a layout that holds up.',
    og_desc='Visits from AI products in your December analytics: what the line can support, what it quietly leaves out, and how to report it next to repeated-run results.',
    ld_desc="BrandGEO guide to reading AI referral traffic in holiday analytics: what it shows, what it misses (influence without a click, visits without a referrer, Google's AI features inside ordinary search), and how to report it.",
    keywords='ai referral traffic analytics, chatgpt referral traffic, ai traffic in google analytics, holiday analytics ai, ai visits no referrer, report ai traffic year end',
    about=['AI Visibility', 'Web Analytics', 'Attribution'],
    findings=[('Some clicks', 'what an AI referral line shows: people who clicked a link inside an AI product'),
              ('No referrer', 'some products and browsers pass none, so those visits land in direct traffic'),
              ('Web search type', "where Search Console puts Google's AI feature traffic, not as a separate line"),
              ('1 question', 'on your order or enquiry form gives a customer-reported number')],
    faq=[('Does an AI referral line show all traffic from AI assistants?',
          'No. Some products and browsers pass no referrer, so those visits land in direct traffic, and people influenced by an answer who search for you afterwards are filed under search or direct.'),
         ('Does Search Console show traffic from AI Overviews separately?',
          "No. Google's documentation says traffic from its AI features is included in overall Search Console traffic under the Web search type."),
         ('How should I report AI referrals at year end?',
          'Side by side with your repeated-run results and a short plain note on what is not known: visits without a referrer, influence without a click, and the effect of the season on every source.')],
    related=[('/bg-070.html', 'BG-070', 'Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead',
              'The argument behind influence without a click.'),
             ('/bg-015.html', 'BG-015', 'Beyond "Are We Mentioned?": The AI Visibility KPIs That Actually Matter',
              'The KPIs to report next to visits.'),
             ('/bg-084.html', 'BG-084', 'A Board-Ready Case for a GEO Budget When There Is No ROI Metric to Show',
              'Putting it in a budget case.')],
    cta_h='Add the other half of the picture',
    cta_p='Your analytics shows who clicked. The free audit shows what AI engines say about your domain in the first place. No card needed.',
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[('Holiday Analytics', 'w')], [('and ', 'w'), ('AI Referrals', 'g')]],
        sub=['What the referral line can support,', 'and what it quietly leaves out.'],
        stats=[('Clicks', 'the only thing a referral line counts', 'BG-NNN'),
               ('Direct', 'where visits without a referrer land', 'BG-015'),
               ('Web', "where Search Console counts Google's AI traffic", 'Google'),
               ('1', 'form question, asked of customers', 'BG-NNN')],
        footer='Report It Side by Side',
    ),
    body="""  <p>The first week of December is when the sales weekend's analytics land on someone's desk. If you look at traffic sources, you may see visits listed as coming from an AI product. It is tempting to read that as "AI sent us customers" and to put it in the year-end deck. This guide explains what such a line can support, and what it quietly leaves out.</p>

  <div class="callout">
    <div class="callout-label">What this guide rests on, and what it cannot tell you</div>
    <ul>
      <li><a href="/bg-070.html">BrandGEO's earlier article on tracking without a pixel</a> argues that tracking scripts record a visit, so answers that persuade without a link go unseen. Read on 13 November 2026.</li>
      <li>The same article notes that when a click does happen, last-click attribution credits the last page the buyer opened, which is often not the page that persuaded them.</li>
      <li>Google's documentation says traffic from its AI features is included in overall Search Console traffic under the Web search type, so it is not shown as a separate line there.</li>
    </ul>
    <p>It is a planning guide built from public documentation and our earlier articles, with no new data of its own. It promises no position, traffic or revenue.</p>
  </div>

  <h2>What a referral line can tell you</h2>

  <p>It tells you that some people clicked a link inside an AI product and arrived at your site. That is real, and it is worth reporting as a count with the date range next to it. It also tells you which of your pages those people landed on, which is useful for a different reason: it shows what the engines are pointing at, and whether that page is ready for a first-time visitor.</p>

  <h2>What it cannot tell you</h2>

  <ul>
  <li><strong>How many people were influenced without clicking.</strong> Someone can read a shortlist in an assistant, then type your name into a search box or go to your site directly. Your analytics will file that under search or direct.</li>
  <li><strong>Whether the referral came from the page that mattered.</strong> The landing page is where they arrived, not necessarily what convinced them.</li>
  <li><strong>Whether all AI visits are in the line.</strong> Some products and browsers pass no referrer, so those visits land in direct traffic (<a href="/bg-015.html">BG-015</a> covers this). Check how your analytics tool groups sources before you trust the label, and write down the definition you used.</li>
  <li><strong>Whether Google's AI features sent anyone.</strong> They are folded into ordinary search reporting.</li>
  </ul>

  <h2>Holiday traffic needs its own caution</h2>

  <p>A sales weekend distorts everything: ads, email, price comparison sites and gift guides all send traffic at once. A small number of AI referrals inside a very large number of visits is hard to interpret, and a jump in December against a quiet October compares two different seasons. Compare like with like, such as the same weekend of the previous year, if you have it, and say in the report that the season affects every source.</p>

  <h2>A reporting layout that holds up</h2>

  <p>Put three things side by side on one slide or page:</p>

  <ol>
  <li><strong>Referral count and landing pages</strong> from AI products, with the date range and the source definition.</li>
  <li><strong>The repeated-run results</strong> for your fixed question list: were you named, was the description accurate, compared with the last run.</li>
  <li><strong>A short note on what is not known</strong>, written plainly: visits without a referrer, influence without a click, season effects.</li>
  </ol>

  <p>This avoids the two common mistakes: reporting only the clicks and concluding AI barely matters, or reporting a rise and concluding AI drove the weekend.</p>

  <h2>One extra question that costs almost nothing</h2>

  <p>If you take orders or enquiries by form or phone, add a single optional question: how did you hear about us, with "an AI assistant" as one of the options. It will undercount, since people forget or choose the more familiar answer, but it gives you a number that comes from customers rather than from a tracking guess.</p>

  <h2>What to do next</h2>

  <p>Check the pages AI visitors landed on. If they land on the home page, make sure it answers the first questions a stranger would have. If they land on an old offer page, fix or retire it. Then repeat your question list in January and compare.</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>Report AI referrals as a dated count with landing pages, next to your repeated-run results and a plain note on what the line cannot show. Do not read a December jump against a quiet October as proof that AI drove the season.</p>
  </div>""",
))
```
