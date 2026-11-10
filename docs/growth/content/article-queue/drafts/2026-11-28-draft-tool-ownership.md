# Draft: who owns your AI visibility tool now?

- Queue key: `draft-tool-ownership`
- Publish on: 2026-11-28 (queue row `ready from 2026-11-28`)
- Type: comparison
- Written 2026-11-06 in a separate session. The brief marked this "after one check": each
  buyer's own announcement, dropping any line that has none. Result: Sitecore's release
  (Scrunch), HubSpot's newsroom page (XFunnel) and Profound's own release (Series D) were
  read on 2026-11-06. Check passed for all three lines.
  - Scrunch: Sitecore's release does not disclose terms; the $225 million value is
    Bloomberg's report as relayed by CMSWire, and the article labels it so.
  - XFunnel: HubSpot's page (updated 31 Oct 2025) says HubSpot "has entered into an
    agreement to acquire"; it states no terms and no closing date. A $30 million figure
    seen in one aggregator is left out.
  - Profound: not an acquisition. It is in the article as a funding round that changes the
    owners' stake, read at Profound's own release.
  The 2025 HubSpot deal is older than the brief's "2026" framing, so the title says "since
  late 2025", not "2026" (changed from "the past year" in the 2026-11-10 verification).
- BrandGEO competes with all three tools; the article says so.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | Sitecore, 3 Jun 2026: https://www.sitecore.com/company/newsroom/press-releases/2026/06/sitecore-acquires-scrunch-to-help-brands-influence-discovery--and-buying-decisions | primary | Sitecore acquired Scrunch; terms not disclosed; Scrunch is "a Sitecore company"; works with SitecoreAI; recommendations to be automated within SitecoreAI Content Management, Content Marketing and Digital Asset Management; connects to Sitecore workflows; "Trusted by 500+ leading brands and agencies" (vendor claim) |
| 2 | CMSWire, 3 Jun 2026: https://www.cmswire.com/digital-experience/sitecore-acquires-scrunch-to-boost-ai-search-visibility/ | reported | "Bloomberg reported the deal valued at $225 million" |
| 3 | HubSpot newsroom, updated 31 Oct 2025: https://www.hubspot.com/company-news/hubspot-to-acquire-xfunnel | primary | agreement to acquire XFunnel; terms not stated; XFunnel to be integrated natively into HubSpot's marketing products; closing not stated |
| 4 | Profound, 15 Sep 2026: https://www.tryprofound.com/newsroom/profound-raises-usd180m-series-d-at-usd1-8b-valuation-to-build-the-ai-platform-for-marketing-teams | primary | $180 million Series D at a $1.8 billion valuation, co-led by Sequoia Capital and Kleiner Perkins, existing investors Lightspeed, Khosla, Saga Ventures, Evantic, South Park Commons; funds an applied AI lab in New York and San Francisco; customer claims "over 1,000 enterprise brands" |

No person's name: executives are not named or quoted.

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 to 4. All returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-28", date_label="November 28, 2026", read=6,
    tags=["Industry News", "Acquisitions", "AI Visibility Tools"],
    title="Who Owns Your AI Visibility Tool Now? The Deals Since Late 2025 in One Table",
    h1="Who Owns Your <em>AI Visibility Tool</em> Now?",
    h1_plain="Who Owns Your AI Visibility Tool Now?",
    subtitle="Since late 2025 a content platform bought Scrunch, HubSpot agreed to buy XFunnel, and Profound raised $180 million from two large venture firms. What each deal changed, from the companies' own announcements, and what a customer should ask a tool whose owner has changed.",
    meta_desc="Sitecore bought Scrunch, HubSpot agreed to buy XFunnel, Profound raised a $180M Series D. The deals in one table, from the companies' own announcements, and what to ask.",
    og_desc="Scrunch is now a Sitecore company, XFunnel is going into HubSpot, Profound has new investors. What changed for customers, and five questions to ask a tool that changed hands.",
    ld_desc="BrandGEO summary of ownership changes among AI visibility tools between October 2025 and September 2026: Sitecore's acquisition of Scrunch, HubSpot's agreement to acquire XFunnel and Profound's Series D, based on each company's own announcement, with questions for customers.",
    keywords="sitecore acquires scrunch, hubspot acquires xfunnel, profound series d, ai visibility tool acquisitions, geo tool consolidation, aeo platform acquisition 2026",
    about=["AI Visibility Tools", "Mergers and Acquisitions", "Marketing Software", "Generative Engine Optimization"],
    findings=[("Sitecore", "acquired Scrunch, announced 3 June 2026; terms not disclosed in the release"),
              ("HubSpot", "agreed to acquire XFunnel, to build it into its marketing products; terms not stated"),
              ("$180M", "Series D for Profound at a $1.8 billion valuation, 15 September 2026"),
              ("2 of 3", "of these tools are being folded into a larger platform's products, one by acquisition and one by agreement")],
    faq=[("Who owns Scrunch now?",
          "Sitecore, a digital experience platform company. It announced the acquisition on 3 June 2026 and describes Scrunch as a Sitecore company. Sitecore did not disclose the terms; Bloomberg reported a value of $225 million."),
         ("Did HubSpot buy XFunnel?",
          "HubSpot announced that it had entered into an agreement to acquire XFunnel, an answer engine optimization platform, and said XFunnel would be integrated natively into its marketing products. Its page, last updated 31 October 2025, does not state terms or a closing date."),
         ("Was Profound acquired?",
          "No. Profound raised a $180 million Series D at a $1.8 billion valuation in September 2026, co-led by Sequoia Capital and Kleiner Perkins. It remains an independent company with new money and a larger set of investors."),
         ("What should a customer ask a tool that changed owners?",
          "Whether it will stay available on its own, whether pricing or plans will change, what happens to your data and history, and whether the roadmap now depends on using the parent company's other products.")],
    related=[("/brandgeo-vs-scrunch.html", "Scrunch", "BrandGEO vs Scrunch",
              "How the two products compare."),
             ("/brandgeo-vs-profound.html", "Profound", "BrandGEO vs Profound",
              "How the two products compare."),
             ("/bg-090.html", "BG-090", "Six GEO Startups You Have Not Heard of Yet",
              "The smaller tools in the same market.")],
    cta_h="Your data should outlast any tool",
    cta_p="Run the free audit on your own domain and keep a record of what each engine says about you. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Industry News",
        lines=[[("Who Owns Your", "w")], [("AI Visibility ", "w"), ("Tool?", "g")]],
        sub=["Three deals since late 2025,",
             "from the companies' own words."],
        stats=[("Sitecore", "acquired Scrunch", "3 June 2026"),
               ("HubSpot", "agreed to acquire XFunnel", "Updated 31 Oct 2025"),
               ("$180M", "Series D for Profound", "15 Sept 2026"),
               ("2 of 3", "being folded into a bigger platform", "Scrunch, XFunnel")],
        footer="Ask Before You Renew",
    ),
    body="""  <p>AI visibility tools are a young market, and it has started to consolidate. Since late 2025 two of the tools that track how brands appear in AI answers have been taken, or agreed to be taken, into larger platforms, and a third raised enough money to change its investor base. If you pay for one of these tools, or are about to, it is worth knowing who now owns it and what they have said they will do with it.</p>

  <p>This is a summary of what the companies themselves announced. Where a figure comes from someone else, we say so.</p>

  <div class="callout">
    <div class="callout-label">Sources, and a disclosure</div>
    <p>We read <a href="https://www.sitecore.com/company/newsroom/press-releases/2026/06/sitecore-acquires-scrunch-to-help-brands-influence-discovery--and-buying-decisions" target="_blank" rel="noopener">Sitecore's release on Scrunch</a>, <a href="https://www.hubspot.com/company-news/hubspot-to-acquire-xfunnel" target="_blank" rel="noopener">HubSpot's page on XFunnel</a> and <a href="https://www.tryprofound.com/newsroom/profound-raises-usd180m-series-d-at-usd1-8b-valuation-to-build-the-ai-platform-for-marketing-teams" target="_blank" rel="noopener">Profound's release on its Series D</a> on 6 November 2026. Customer counts and results in those releases are the companies' own claims. BrandGEO competes with all three tools, so read this with that in mind.</p>
  </div>

  <h2>The three deals</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Tool</th><th>What happened</th><th>When</th><th>Terms</th><th>What the announcement says changes</th></tr></thead>
    <tbody>
      <tr><td>Scrunch</td><td>Acquired by Sitecore</td><td>Announced 3 June 2026</td><td>Not disclosed by Sitecore; Bloomberg reported $225 million</td><td>Scrunch is "a Sitecore company"; its recommendations to be automated inside SitecoreAI's content products</td></tr>
      <tr><td>XFunnel</td><td>HubSpot agreed to acquire it</td><td>Page last updated 31 October 2025</td><td>Not stated</td><td>To be integrated natively into HubSpot's marketing products</td></tr>
      <tr><td>Profound</td><td>Raised a Series D, not acquired</td><td>15 September 2026</td><td>$180 million at a $1.8 billion valuation</td><td>Funds an applied AI lab in New York and San Francisco</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Scrunch, now inside Sitecore</h2>

  <p>Sitecore sells a digital experience platform, the software companies use to run their websites and content. Its release says Scrunch will work with SitecoreAI and that Scrunch's recommendations will be automated within its content management, content marketing and digital asset management products. Scrunch, which Sitecore says is trusted by more than 500 brands and agencies, now describes itself as a Sitecore company.</p>

  <p>The release does not say whether Scrunch stays available to companies that do not use Sitecore, or whether its pricing changes. Sitecore did not disclose the price. CMSWire reported that Bloomberg valued the deal at $225 million.</p>

  <h2>XFunnel, going into HubSpot</h2>

  <p>HubSpot's page says it has entered into an agreement to acquire XFunnel, an answer engine optimization platform, and that XFunnel will be integrated natively into HubSpot's marketing products, so marketers can see how their brand appears in AI tools and how to improve it. The page gives no terms and no closing date. The direction is clear, though: the stated plan is a feature inside HubSpot, not a separate product.</p>

  <h2>Profound, still independent with new money</h2>

  <p>Profound was not bought. It raised a $180 million Series D at a $1.8 billion valuation, co-led by Sequoia Capital and Kleiner Perkins, with its existing investors also taking part. The release says the money goes into an applied AI lab in New York and San Francisco that studies how frontier models perform on marketing work. Profound claims more than 1,000 enterprise brands as customers. A funding round does not change who owns the product the way an acquisition does.</p>

  <h2>If you already use HubSpot or Sitecore</h2>

  <p>For a company already on one of the parent platforms, these deals may be good news: AI visibility data next to the CRM or the content system it already runs, without another login. The questions for those customers are different: whether the AI visibility features come with the plan they already pay for or as an add-on, and whether the depth of the original tool survives the move into a bigger product.</p>

  <h2>Why this matters to a customer</h2>

  <p>Two of the three tools are being folded into a larger platform's own products. That can be good for customers of the parent: the data shows up where they already work. For everyone else, it raises practical questions the announcements do not answer.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question to ask</th><th>Why it matters</th></tr></thead>
    <tbody>
      <tr><td>Will the tool stay available on its own?</td><td>A product built into a platform can stop being sold separately</td></tr>
      <tr><td>Will my plan or price change at renewal?</td><td>A tool folded into a platform can be repriced as part of it</td></tr>
      <tr><td>Can I export my history?</td><td>Months of tracked answers are the part you cannot recreate</td></tr>
      <tr><td>Is my data shared with the parent company?</td><td>Your prompts and competitors are commercially sensitive</td></tr>
      <tr><td>Does the roadmap now assume the parent's other products?</td><td>New features may only work inside that platform</td></tr>
    </tbody>
  </table>
  </div>

  <p>The export question deserves the most weight. What an AI visibility tool builds up over time is a record: which questions were asked, what each engine said, on which date. AI answers change from run to run, so that history is the only way to see a trend. If you cannot take it with you, you are tied to the tool whatever its new owner decides.</p>

  <h2>What we are not saying</h2>

  <p>None of these announcements says a product will be shut down, repriced or restricted, and we are not predicting that any will be. Being acquired can be how a small tool survives and grows. The point is narrower: when the owner changes, the answers to the questions above can change too, and the time to ask is before you renew, not after.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you use Scrunch or XFunnel, ask your account contact the five questions above and get the answers in writing. If you use any AI visibility tool, export your tracked history now and on a schedule, whoever owns it.</p>
    <p>And keep the record that matters in your own hands: the questions your buyers ask, and what each engine answered, by date.</p>
  </div>""",
))
```
