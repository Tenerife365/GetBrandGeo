# Draft: Search Console's AI report today, and the UK deadline of 3 December

- Queue key: `draft-search-console-ai`
- Publish on: 2026-11-15 (queue row `ready from 2026-11-15`), not after 2026-12-02:
  the article is written for readers before the 3 December deadline. If it has not gone
  out by 2 December, hold it and report; a session rewrites it as a post-deadline piece.
- Type: trending, how to
- Written 2026-11-06 in a separate session from the research brief of the same day.
  Every figure below was read at its source on 2026-11-06.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | Google Search Central blog, 3 Jun 2026: https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports | primary | metrics impressions, pages, countries, devices, dates; surfaces AI Overviews, AI Mode, generative AI in Discover; rolled out to all sites worldwide as of 31 Aug 2026; device data for Search only; separate view, data also included in the overall Performance report; clicks not mentioned |
| 2 | Search Console Help, generative AI report: https://support.google.com/webmasters/answer/16984139 | primary | impressions only; one impression per site per feature; Search Labs not included; may not appear with too few impressions or if the site is excluded; 1,000 row limit; preliminary data dotted; "~" and "-" export as zeros; Discover has its own report; clicks not mentioned |
| 3 | CMA, "The publisher conduct requirement" (summary PDF): https://assets.publishing.service.gov.uk/media/6a7195d7aec8358a34958bfa/Publisher_conduct_requirement_-_3_Aug_2026.pdf | primary | transparency metrics for search AI features including impressions, clicks and click-through rate, aggregated across features such as AI Overviews and AI Mode; referral data; comply by 3 December 2026; 3 more months for a page-level control |
| 4 | Search Engine Journal, 2 Nov 2026: https://www.searchenginejournal.com/google-ai-click-reporting-uk-deadline/595663/ | reported | first compliance report covers 3 June to 3 December, due 3 January 2027; Google's search team: "we don't have anything to announce yet" |

No person's name: the Google statement is attributed to Google's search team.

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 to 4. All returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-15", date_label="November 15, 2026", read=6,
    tags=["How To", "Google Search Console", "AI Overviews"],
    title="Google Must Show AI Clicks to UK Publishers by December 3. What Search Console Shows You Today",
    h1="What Search Console Shows You About <em>AI Search</em> Today",
    h1_plain="What Search Console Shows You About AI Search Today",
    subtitle="Search Console's generative AI report counts impressions in AI Overviews and AI Mode, and nothing else. The UK competition regulator has told Google to give publishers clicks and click-through rate for its AI features by 3 December. How to read the report now, and what to look for after the deadline.",
    meta_desc="Search Console's AI report shows impressions in AI Overviews and AI Mode, not clicks. The UK CMA wants clicks and CTR by 3 December 2026. How to read it now.",
    og_desc="Today Search Console counts AI impressions only. The UK regulator has given Google until 3 December to add clicks and click-through rate. A short guide to the report as it stands.",
    ld_desc="BrandGEO guide to Google Search Console's generative AI performance report as of November 2026, and to the UK Competition and Markets Authority requirement that Google provide publishers with impressions, clicks and click-through rate for its search AI features by 3 December 2026.",
    keywords="search console ai overviews report, search console ai mode impressions, generative ai performance report, cma google ai clicks december 3, ai overviews clicks search console, google publisher conduct requirement",
    about=["Google Search Console", "AI Overviews", "AI Mode", "Search Regulation"],
    findings=[("Impressions only", "what Search Console's generative AI report counts today, for AI Overviews and AI Mode"),
              ("31 Aug 2026", "the date Google says the report reached all websites worldwide"),
              ("3 Dec 2026", "the CMA's deadline for Google to give publishers impressions, clicks and click-through rate for its AI features"),
              ("3 Jan 2027", "when Google's first compliance report to the CMA is due, covering June to December")],
    faq=[("Does Search Console show clicks from AI Overviews or AI Mode?",
          "Not as their own number today. Google's generative AI report shows impressions, pages, countries, devices and dates. Neither Google's announcement nor its help page describes a click count for AI features."),
         ("What did the UK regulator require?",
          "The Competition and Markets Authority's publisher conduct requirement says Google must give publishers transparency metrics for its search AI features, including impressions, clicks and click-through rate, aggregated across features such as AI Overviews and AI Mode, by 3 December 2026. A page-level control follows within three more months."),
         ("Will the new metrics appear outside the UK?",
          "Nobody outside Google can say yet. The requirement comes from a UK regulator, and as of 2 November Google's search team said it had nothing to announce."),
         ("Why does an impression in an AI answer not tell me enough?",
          "An impression means a link to your site was shown in the AI feature. It does not say what the answer said about you, whether it named a competitor first, or whether anyone clicked. Reading the answers themselves fills the first two gaps.")],
    related=[("/bg-070.html", "BG-070", "Why GEO Cannot Be Tracked With a Pixel, and What to Show Instead",
              "What to report on AI visibility while the clicks are missing."),
             ("/bg-099.html", "BG-099", "What Changed in AI Search This Quarter: Q3 2026",
              "The Q3 changes to AI Overviews and AI Mode that came before this deadline."),
             ("/bg-104.html", "BG-104", "What 'Citation' Actually Means to an AI Model",
              "Why being shown as a link and being used in the answer are different things.")],
    cta_h="See what the AI answers say, not just that you appeared",
    cta_p="Run the free audit on your own domain and read the answers engines give to your buyers' questions. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[("Search Console", "w")], [("and ", "w"), ("AI Clicks", "g")]],
        sub=["What the AI report shows today,",
             "and what changes after 3 December."],
        stats=[("Impressions", "the only AI metric Search Console shows today", "Google, Jun 2026"),
               ("31 Aug", "report live for all websites worldwide", "Google Search Central"),
               ("3 Dec", "CMA deadline for AI clicks and CTR", "UK publisher rules"),
               ("3 Jan 2027", "first compliance report due", "Covers June to December")],
        footer="Before the Deadline",
    ),
    body="""  <p>If you have opened Search Console in the past few months, you may have seen a separate report for generative AI. It tells you how often links to your site appeared in Google's AI Overviews and AI Mode. It does not tell you how often anyone clicked them.</p>

  <p>That may change soon, at least in the UK. The Competition and Markets Authority has told Google to give publishers impressions, clicks and click-through rate for its search AI features, and it set <strong>3 December 2026</strong> as the date. Here is what the report shows today, how to read it, and what to check once the deadline passes.</p>

  <div class="callout">
    <div class="callout-label">Sources, and what they cannot tell you</div>
    <p>We read <a href="https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports" target="_blank" rel="noopener">Google's announcement of the report</a> (3 June 2026), <a href="https://support.google.com/webmasters/answer/16984139" target="_blank" rel="noopener">the Search Console help page for it</a>, <a href="https://assets.publishing.service.gov.uk/media/6a7195d7aec8358a34958bfa/Publisher_conduct_requirement_-_3_Aug_2026.pdf" target="_blank" rel="noopener">the CMA's summary of the publisher conduct requirement</a>, and <a href="https://www.searchenginejournal.com/google-ai-click-reporting-uk-deadline/595663/" target="_blank" rel="noopener">Search Engine Journal's report of 2 November 2026</a>, all on 6 November 2026. Nobody outside Google knows yet what the new metrics will look like, where they will appear, or whether they will reach accounts outside the UK.</p>
  </div>

  <h2>What the report shows today</h2>

  <p>Google announced the generative AI performance report on 3 June 2026, first for a test group of sites. By its own note, it reached all websites worldwide on 31 August 2026.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>What Google's pages say</th></tr></thead>
    <tbody>
      <tr><td>Which features</td><td>AI Overviews and AI Mode in Search; generative AI features in Discover have their own report</td></tr>
      <tr><td>Which metric</td><td>Impressions: how often links to your site were shown in a generative AI feature</td></tr>
      <tr><td>Broken down by</td><td>Pages, countries, devices (Search only) and dates</td></tr>
      <tr><td>Clicks</td><td>Not described on either page</td></tr>
      <tr><td>Counting rule</td><td>Several results from your site inside one AI feature count as one impression</td></tr>
      <tr><td>Left out</td><td>Search Labs experiments</td></tr>
    </tbody>
  </table>
  </div>

  <p>Google also says the same data is still included in the overall Performance report. So an AI impression is not new traffic on top of your normal numbers. It is part of them, shown again in its own view.</p>

  <h2>How to read it without fooling yourself</h2>

  <p><strong>Start with pages, not totals.</strong> The page breakdown tells you which of your URLs Google shows inside AI answers. Check whether they are the pages you would want a buyer to land on. A page you would never send a buyer to, such as an old blog post or an outdated price list, showing up there is worth noticing.</p>

  <p><strong>Compare with the same pages' clicks.</strong> Open the normal Performance report for the same pages and period. If a page has many AI impressions and the same clicks as before, the report alone cannot tell you whether the AI answer replaced the click or simply added a mention.</p>

  <p><strong>Mind the small print.</strong> The help page lists limits worth knowing before you put a number in a client report: the newest days are preliminary and shown as a dotted line; chart and table totals can differ; values shown as "~" or "-" download as zeros in an export; tables stop at 1,000 rows; and the report may not appear at all for a site with too few AI impressions or one that has excluded itself from these features.</p>

  <h2>What the UK regulator asked for</h2>

  <p>The CMA's publisher conduct requirement says Google must give publishers transparency metrics for search AI features, including <strong>impressions, clicks and click-through rate</strong>, aggregated across features such as AI Overviews and AI Mode, along with referral data so publishers can judge the traffic those features send. The deadline is 3 December 2026. Google then has three more months to build a page-level control, and the CMA says it expects changes to start sooner.</p>

  <p>According to Search Engine Journal, Google's first compliance report covers 3 June to 3 December and is due on 3 January 2027. Asked about adding AI click data to Search Console, Google's search team said it had "nothing to announce yet".</p>

  <h2>What to look for after 3 December</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Check</th><th>Why it matters</th></tr></thead>
    <tbody>
      <tr><td>Does a clicks column appear in the generative AI report?</td><td>It is the number the requirement names and the one missing today</td></tr>
      <tr><td>Is it visible on a site outside the UK?</td><td>The requirement is British; a worldwide rollout is Google's choice</td></tr>
      <tr><td>Is AI Mode reported apart from AI Overviews?</td><td>The requirement allows figures aggregated across features</td></tr>
      <tr><td>Does the page-level control appear by early March 2027?</td><td>It is the second step of the same requirement</td></tr>
    </tbody>
  </table>
  </div>

  <p>Write down your current AI impression numbers for your main pages before the deadline. If clicks arrive, you will want a before and after, measured the same way.</p>

  <h2>What neither version will tell you</h2>

  <p>Even with clicks, the report measures links. It will not show what the AI answer said about you, which competitors it named next to you, or whether it got your hours, fees or address right. For a local business those are often the parts that decide the call. Our own studies of 591 AI answers to local buyer questions found engines quoting star ratings, years in business and fees for the firms they named, and in some cases naming no firm at all. None of that shows up as an impression.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>This week: open the generative AI report, note the pages that collect AI impressions and their numbers, and keep a copy. After 3 December: check whether clicks and click-through rate appear, and whether they appear for your country.</p>
    <p>Alongside it: ask the engines the questions your buyers ask and read the answers. Search Console tells you that you were shown. Only the answer tells you how you were described.</p>
  </div>""",
))
```
