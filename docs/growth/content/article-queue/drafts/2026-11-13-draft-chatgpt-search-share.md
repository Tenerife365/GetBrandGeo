# Draft: ChatGPT Says Its Search Is a Fifth of Google's

- Queue key: `draft-chatgpt-search-share`
- Publish on: 2026-11-13 (queue row `ready from 2026-11-13`)
- Type: trending
- Written 2026-11-06 in a separate session, from the research brief of the same day
  (`research-suggestions-2026-11-06.md`, 13 Nov). Every figure below was read at its
  source on 2026-11-06. BrandGEO figures are quoted as published in BG-106 to BG-111.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | Big Technology, 3 Nov 2026: https://www.bigtechnology.com/p/openai-chatgpt-search-is-about-20 | reported (company statement at an OpenAI dinner, Monday 2 Nov) | "roughly one-fifth the volume of queries of Google"; weekly users 1 billion to 1.2 billion in about 60 days; "search-like" not defined in the free part; the answer to how a query is counted sits behind the paywall |
| 2 | BrightLocal, Local Consumer Review Survey 2026, 10 Mar 2026: https://www.brightlocal.com/research/lcrs-ai-trust/ | primary | 1,002 US adults; 45% used AI tools for local business recommendations (6% in 2025); ChatGPT 31%, Google AI Mode 23% |
| 3 | BrandGEO BG-106, BG-107, BG-108, BG-109, BG-111 | own published research | ChatGPT rows of the engine tables, July 24 and 25 2026 collection, 120 ChatGPT answers |

The speaker at the dinner is described by role only; no person's name goes in this file.

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 and 2. All returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-13", date_label="November 13, 2026", read=6,
    tags=["Industry News", "ChatGPT", "Local Search"],
    title="ChatGPT Says Its Search Is a Fifth of Google's. What That Means for a Local Business",
    h1="ChatGPT Says Its Search Is <em>a Fifth of Google's</em>",
    h1_plain="ChatGPT Says Its Search Is a Fifth of Google's",
    subtitle="OpenAI says ChatGPT now handles roughly one search-like query for every five on Google. The number comes with no method and no period. Here is what it does and does not tell a local business, next to what ChatGPT actually says when a buyer asks it for a local firm.",
    meta_desc="OpenAI says ChatGPT's search-like queries are roughly a fifth of Google's. What the claim leaves out, and what ChatGPT said in 120 answers to local buyer questions in our data.",
    og_desc="OpenAI's one-fifth-of-Google claim has no stated method. Next to it: a March 2026 survey of local buyers and what ChatGPT did in 120 of our local answers.",
    ld_desc="BrandGEO analysis of OpenAI's November 2026 claim that ChatGPT's search-like query volume is roughly one fifth of Google's, read next to BrightLocal's 2026 consumer survey and BrandGEO's own counts of ChatGPT answers to local buyer questions in 20 US cities.",
    keywords="chatgpt search volume vs google, chatgpt one fifth of google, chatgpt local business recommendations, chatgpt search share 2026, ai search local businesses, chatgpt weekly users 1.2 billion",
    about=["AI Search", "ChatGPT", "Local Search", "Search Market"],
    findings=[("About 1 in 5", "OpenAI's own estimate of ChatGPT's search-like queries against Google's, given with no method, period or definition"),
              ("1.2 billion", "weekly ChatGPT users OpenAI reported, up from 1 billion in about 60 days"),
              ("31%", "of US consumers used ChatGPT for a local business recommendation in the past year, in BrightLocal's March 2026 survey"),
              ("83 of 120", "ChatGPT answers in our local data told the buyer how to check the firms it named")],
    faq=[("Is ChatGPT search really a fifth the size of Google?",
          "That is OpenAI's own estimate, given at a company dinner and reported by Big Technology on 3 November 2026. The part of the report that is free to read does not define a search-like query, give a period, or say how Google's volume was measured, so it cannot be checked from outside."),
         ("How many people use ChatGPT to find local businesses?",
          "BrightLocal's Local Consumer Review Survey 2026, published in March, found that 31% of 1,002 US adults had used ChatGPT for a local business recommendation in the past 12 months. 45% had used some AI tool for it, up from 6% the year before."),
         ("What does ChatGPT say when someone asks it for a local firm?",
          "In 120 ChatGPT answers to local buyer questions in our July 2026 data, it always named at least one firm, linked out in 119 answers, told the buyer how to check the firms in 83, and gave a street address in only 2."),
         ("Should a local business change anything because of this number?",
          "Not because of the number alone. The more useful test is to ask ChatGPT the question your buyers ask, in your city, and read what it says about you and your competitors.")],
    related=[("/bg-111.html", "BG-111", "How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
              "ChatGPT gave vetting advice in 83 of its 120 answers, far more than any other engine."),
             ("/bg-109.html", "BG-109", "How Often AI Engines Give a Street Address or Phone Number for the Firms They Name",
              "Where ChatGPT sends a buyer: links almost always, addresses almost never."),
             ("/bg-101.html", "BG-101", "The AI Chat Market Is Not Just a ChatGPT Story Anymore",
              "Why one engine's size is not the whole picture.")],
    cta_h="Read what ChatGPT tells your buyers",
    cta_p="Run the free audit on your own domain and see each engine's answer to the questions your buyers ask. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Analysis",
        lines=[[("ChatGPT Search,", "w")], [("a Fifth of ", "w"), ("Google?", "g")]],
        sub=["OpenAI's claim, what it leaves out,",
             "and 120 local answers from our data."],
        stats=[("1 in 5", "search-like queries vs Google, OpenAI's estimate", "Reported 3 Nov 2026"),
               ("1.2 billion", "weekly ChatGPT users, per OpenAI", "Up from 1 billion"),
               ("31%", "of US consumers asked ChatGPT for a local business", "BrightLocal, Mar 2026"),
               ("83 of 120", "ChatGPT answers told buyers how to vet firms", "BrandGEO, 20 US cities")],
        footer="A Number Without a Method",
    ),
    body="""  <p>On 2 November 2026, at a company dinner in New York, the product lead for ChatGPT's consumer app said that ChatGPT's volume of search-like queries is now <strong>"roughly one-fifth the volume of queries of Google."</strong> The tech newsletter Big Technology reported it the next day, together with a second figure from OpenAI: weekly users rose from 1 billion to 1.2 billion in about 60 days.</p>

  <p>If you run a local business, the natural question is whether a fifth of your search traffic has quietly moved somewhere you cannot see. The number cannot answer that, and it helps to be clear about why before deciding what to do.</p>

  <div class="callout">
    <div class="callout-label">How this was put together, and what it cannot tell you</div>
    <p>The ChatGPT figures come from <a href="https://www.bigtechnology.com/p/openai-chatgpt-search-is-about-20" target="_blank" rel="noopener">Big Technology's report of 3 November 2026</a>, read on 6 November. They are OpenAI's own numbers, given in conversation and hedged with "roughly". The survey figures come from <a href="https://www.brightlocal.com/research/lcrs-ai-trust/" target="_blank" rel="noopener">BrightLocal's Local Consumer Review Survey 2026</a>, published 10 March 2026, 1,002 US adults. The ChatGPT behaviour figures are our own, from 120 ChatGPT answers to local buyer questions in 20 US cities collected on July 24 and 25, 2026, as published in BG-106 to BG-111.</p>
  </div>

  <h2>What the one-fifth claim leaves out</h2>

  <p>Three things are missing, and each one matters.</p>

  <p><strong>What counts as search-like.</strong> In the part of the report that is free to read, the description is broad: what a user would traditionally have taken to a search engine, including lookups for people, places or things that need up-to-date information, and finance and health questions. That still leaves the counting rule open. A conversation can contain one question or ten follow-ups. The reporter asked exactly that, whether each prompt in a conversation counts as a query, and the answer sits behind the paywall.</p>

  <p><strong>The period and the baseline.</strong> No time window was given for ChatGPT's volume, and no source was named for Google's. The comparison sets one company's own count against a figure for another company's traffic that it did not say where it got.</p>

  <p><strong>Any outside check.</strong> No method was published and no third party has measured it. That does not make it wrong. It makes it a company statement, and it should be read as one.</p>

  <p>The user figure is easier to place. A rise from 1 billion to 1.2 billion weekly users in about 60 days is a rise in people, not in searches. It says how many people open ChatGPT in a week, not what they ask it.</p>

  <h2>What we know about local buyers</h2>

  <p>A survey asks a different question: not how many queries, but how many people. BrightLocal's 2026 survey found:</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Finding</th><th>Share of US adults surveyed</th></tr></thead>
    <tbody>
      <tr><td>Used an AI tool for a local business recommendation in the past 12 months</td><td>45% (6% in 2025)</td></tr>
      <tr><td>Used ChatGPT for one</td><td>31%</td></tr>
      <tr><td>Used Google's AI Mode for one</td><td>23%</td></tr>
      <tr><td>Used Google reviews, as BrightLocal reports it</td><td>71% (83% in 2025)</td></tr>
    </tbody>
  </table>
  </div>

  <p>So close to one US adult in three told BrightLocal they had asked ChatGPT for a local business in the past year. That is a better guide for a dentist or a law firm than a share of total queries, most of which have nothing to do with local services.</p>

  <h2>What ChatGPT says when a buyer asks</h2>

  <p>Our own data shows what happens after the question is asked. We put six local buyer questions to five engines in 20 US cities: a personal injury lawyer, real estate agents, a property manager, an immigration lawyer and two questions about each city's economy. Here is ChatGPT's side of it, out of 120 answers.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>What ChatGPT did</th><th>ChatGPT answers (of 120)</th><th>Where we reported it</th></tr></thead>
    <tbody>
      <tr><td>Named at least one firm</td><td>120</td><td>BG-107</td></tr>
      <tr><td>Contained a link</td><td>119</td><td>BG-109</td></tr>
      <tr><td>Named a third-party platform, such as a directory or review site</td><td>91</td><td>BG-106</td></tr>
      <tr><td>Told the buyer how to vet the firms it named</td><td>83</td><td>BG-111</td></tr>
      <tr><td>Quoted a star rating or review count</td><td>28</td><td>BG-108</td></tr>
      <tr><td>Gave a street address for a firm</td><td>2</td><td>BG-109</td></tr>
    </tbody>
  </table>
  </div>

  <p>The pattern is consistent. ChatGPT names firms, points to directories, links out and tells the buyer to check before hiring. It rarely hands over contact details: in our data it gave a street address in 2 answers out of 120, and the four phone numbers it gave belonged to court, referral or legal aid lines, not to firms. A buyer who gets a ChatGPT answer still has to go somewhere else to make contact, and that somewhere is usually your website or a directory profile.</p>

  <h2>So what does the one-fifth number change?</h2>

  <p>Less than the headline suggests, and more than nothing. Even if the estimate is right, it describes all search-like use, not local service searches, and it says nothing about whether those conversations end in a call, a visit or a booking. What it does confirm is that ChatGPT is now a place people go before they choose, and the survey says local buyers are among them.</p>

  <p>For a local firm, that shifts one practical question to the front: when ChatGPT answers the question your buyers ask, are you in the answer, and is what it says about you right? That can be checked directly, which is more than can be said for the one-fifth figure.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Ask ChatGPT the question your buyers ask, in your city, the way they would phrase it. Note whether you are named, which competitors are named instead, and which directories it points to. Then open those directory profiles and your own site and check that the facts it is likely to repeat are current.</p>
    <p>Do it on more than one engine. In our data the same question got very different kinds of answer from each engine, and Google's AI Mode was used by 23% of the consumers BrightLocal surveyed.</p>
  </div>""",
))
```
