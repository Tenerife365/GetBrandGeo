# Draft: an engine scorecard from our eight local studies

- Queue key: `draft-engine-scorecard`
- Publish on: 2026-11-16 (queue row `ready from 2026-11-16`)
- Type: comparison, hub page
- Written 2026-11-06 in a separate session. No new data and no web source: every figure
  is copied as published from BG-106 to BG-113 (scripts/articles_content_daily.py, read
  2026-11-06), with the article it came from named in the table.
- Basis stated in the article: July 24 and 25 2026 collection, 20 US cities, 591 ok
  answers as published; the 2026-11-06 correction (an admin refresh deleted 6 Los Angeles
  ChatGPT rows, so the reproduction queries now return 585) is stated in the method callout.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Figures used, as published

| Measure | Article | Google AI Mode | ChatGPT | Claude | Gemini | Perplexity |
|---|---|---|---|---|---|---|
| Answers | all | 111 | 120 | 120 | 120 | 120 |
| Named a third-party platform | BG-106 | 88 (79%) | 91 (76%) | 85 (71%) | 68 (57%) | 58 (48%) |
| Named no firm at all | BG-107 | 0 | 0 | 0 | 0 | 15 |
| Quoted a star rating or review count | BG-108 | 57 (51%) | 28 (23%) | 20 (17%) | 31 (26%) | 50 (42%) |
| Gave a street address | BG-109 | 77 (69%) | 2 (2%) | 14 (12%) | 0 | 10 (8%) |
| Contained a link | BG-109 | 111 | 119 | 7 | 0 | 0 |
| Any vetting advice | BG-111 | 8 (7%) | 83 (69%) | 16 (13%) | 29 (24%) | 9 (8%) |
| Any of the five firm facts counted in BG-112 | BG-112 | 87 (78%) | 48 (40%) | 96 (80%) | 89 (74%) | 9 (8%) |
| Property management: national brand named | BG-113 | 13 of 19 | 10 of 20 | 12 of 20 | 13 of 20 | 15 of 20 |
| Property management: fee percentage quoted | BG-110 | 2 of 19 | 7 of 20 | 7 of 20 | 4 of 20 | 0 of 20 |

## Check before publishing

None needed beyond the routine's own validation: all eight linked pages exist on
brandgeo/web at the time of writing.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-16", date_label="November 16, 2026", read=7,
    tags=["Original Research", "US Cities", "Engine Comparison"],
    title="What Each AI Engine Tells a Buyer About a Local Firm: A Scorecard From Our Eight Studies",
    h1="What Each AI Engine Tells a Buyer <em>About a Local Firm</em>",
    h1_plain="What Each AI Engine Tells a Buyer About a Local Firm",
    subtitle="Eight studies, one set of 591 answers to local buyer questions in 20 US cities, five engines. Put side by side, each engine has a clear habit: Google AI Mode gives addresses, ChatGPT gives vetting advice, Claude and Gemini give facts about the firm, Perplexity gives the least.",
    meta_desc="One table from eight BrandGEO studies: what ChatGPT, Claude, Gemini, Perplexity and Google AI Mode each tell a buyer about a local firm, across 591 answers in 20 US cities.",
    og_desc="Addresses, ratings, vetting advice, firm facts, directories: what each of five AI engines gives a buyer looking for a local professional, from 591 answers in 20 US cities.",
    ld_desc="BrandGEO comparison of ChatGPT, Claude, Gemini, Perplexity and Google AI Mode built from eight published studies (BG-106 to BG-113) of 591 answers to local professional-services questions across 20 US cities.",
    keywords="chatgpt vs gemini vs claude local businesses, which ai engine is best for local search, perplexity vs google ai mode, ai engines compared local professionals, ai search engine comparison 2026",
    about=["AI Visibility Research", "Engine Comparison", "Local Search", "Professional Services"],
    findings=[("77 of 111", "Google AI Mode answers gave a street address; Gemini gave one in 0 of 120"),
              ("83 of 120", "ChatGPT answers told the buyer how to vet the firms; Google AI Mode did so in 8 of 111"),
              ("96 of 120", "Claude answers stated a fact about a firm, such as years in business; Perplexity did so in 9"),
              ("15 of 120", "Perplexity answers named no firm at all; every other engine always named one")],
    faq=[("Which AI engine is best for finding a local professional?",
          "It depends on what the buyer needs next. In our 591 answers, Google AI Mode was the one that gave addresses and ratings, ChatGPT the one that explained how to check a firm, and Claude and Gemini the ones that described the firms. Perplexity gave the least of each."),
         ("Where do these numbers come from?",
          "From eight BrandGEO studies, BG-106 to BG-113, all run on the same 591 answers: six local buyer questions in 20 US cities, put to five engines on July 24 and 25, 2026. Each cell in the tables is copied from the study named next to it."),
         ("Does one engine recommend more firms than another?",
          "We did not count firms per answer, because our automatic firm lists miss bullet lists, as BG-107 explains. What we can say is that four engines named at least one firm in every answer, and Perplexity named none in 15 of 120."),
         ("Should a local firm track every engine?",
          "If buyers use them, yes, and separately. The same question got a different kind of answer from each engine, so an average across engines hides what any one of them says about you.")],
    related=[("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The first of the eight studies: which platforms engines lean on."),
             ("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "The firm facts behind the Claude and Gemini column."),
             ("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "When engines agree on the same firm, and when they do not.")],
    cta_h="See what each engine says about your firm",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Original Research",
        lines=[[("Five AI Engines,", "w")], [("One ", "w"), ("Scorecard", "g")]],
        sub=["Eight studies, 591 local answers,",
             "20 US cities."],
        stats=[("77 of 111", "Google AI Mode answers gave an address", "BG-109"),
               ("83 of 120", "ChatGPT answers gave vetting advice", "BG-111"),
               ("96 of 120", "Claude answers stated a firm fact", "BG-112"),
               ("15 of 120", "Perplexity answers named no firm", "BG-107")],
        footer="Each Engine Has a Habit",
    ),
    body="""  <p>Between 28 October and 6 November we published eight studies on how AI engines answer local buyer questions. Each one looked at a single thing: directories, empty answers, star ratings, addresses, fees, vetting advice, firm facts, national brands. Read one at a time, they each show a gap between engines. Read together, they show something more useful: each engine has a habit, and it is the same habit from study to study.</p>

  <p>This page puts the eight side by side. There is no new data in it. Every number below is copied from the study named in the table, so you can follow any cell back to its method.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>All eight studies read the same answers: six local buyer questions in each of 20 US cities (a personal injury lawyer, real estate agents, a property manager, an immigration lawyer and two questions about each city's economy), put to ChatGPT, Claude, Gemini, Perplexity and Google AI Mode on July 24 and 25, 2026. 591 answers came back usable: 120 per engine, 111 for Google AI Mode.</p>
    <p>One correction since then: on 6 November an admin refresh deleted six Los Angeles ChatGPT answers from that set, so rerunning the studies' queries today returns 585 answers. The published figures below stand as published. These are counts of what engines wrote in one collection run in July. They do not say why an engine answered as it did, and they do not rank anyone.</p>
  </div>

  <h2>The scorecard</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Named a directory or review site</th><th>Quoted a rating or review count</th><th>Gave a street address</th><th>Gave vetting advice</th><th>Stated a fact about a firm</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode (111)</td><td>88 (79%)</td><td>57 (51%)</td><td>77 (69%)</td><td>8 (7%)</td><td>87 (78%)</td></tr>
      <tr><td>ChatGPT (120)</td><td>91 (76%)</td><td>28 (23%)</td><td>2 (2%)</td><td>83 (69%)</td><td>48 (40%)</td></tr>
      <tr><td>Claude (120)</td><td>85 (71%)</td><td>20 (17%)</td><td>14 (12%)</td><td>16 (13%)</td><td>96 (80%)</td></tr>
      <tr><td>Gemini (120)</td><td>68 (57%)</td><td>31 (26%)</td><td>0</td><td>29 (24%)</td><td>89 (74%)</td></tr>
      <tr><td>Perplexity (120)</td><td>58 (48%)</td><td>50 (42%)</td><td>10 (8%)</td><td>9 (8%)</td><td>9 (8%)</td></tr>
      <tr><td>Study</td><td><a href="/bg-106.html">BG-106</a></td><td><a href="/bg-108.html">BG-108</a></td><td><a href="/bg-109.html">BG-109</a></td><td><a href="/bg-111.html">BG-111</a></td><td><a href="/bg-112.html">BG-112</a></td></tr>
    </tbody>
  </table>
  </div>

  <p>"Stated a fact about a firm" means at least one of the five kinds of fact counted in BG-112: years in business, a track record in dollars or counts, board certification, ownership, or a former judge, prosecutor or officer on the team. "Vetting advice" means telling the buyer to check a license or bar record, read reviews, interview several firms or ask set questions, as defined in BG-111.</p>

  <h2>Each engine's habit</h2>

  <p><strong>Google AI Mode hands over the details.</strong> It gave a street address in 77 of 111 answers, quoted a rating or review count in 57, and linked out in every answer. It almost never told the buyer to check anything: 8 answers. It reads like a listings page with a summary on top.</p>

  <p><strong>ChatGPT tells the buyer how to choose.</strong> Vetting advice in 83 of 120 answers, and 30 of the 39 answers in the whole set that said to check a license or bar record. It linked out in 119 answers but gave a street address in only 2. In real estate it was the only engine to tell buyers to ask how the buyer's agent is paid, in 15 of 20 answers (<a href="/bg-110.html">BG-110</a>).</p>

  <p><strong>Claude and Gemini describe the firms.</strong> Claude stated a firm fact in 96 of 120 answers and Gemini in 89, mostly years in business. Neither gave many addresses; Gemini gave none, and it contained no links in any answer. Gemini told the buyer to interview several firms in 21 answers (BG-111).</p>

  <p><strong>Perplexity gives the least of each.</strong> It was the only engine that sometimes named nobody: 15 of 120 answers had no firm in them, 10 of those about real estate agents (<a href="/bg-107.html">BG-107</a>). It stated a firm fact in 9 answers and gave vetting advice in 9. Its one strong column is ratings: 50 answers quoted a rating or review count, including 14 of its 20 immigration answers, most of those a 5.0 from a lawyer directory (<a href="/bg-108.html">BG-108</a>).</p>

  <h2>Property management, side by side</h2>

  <p>Two of the studies looked only at the 99 property management answers.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Named a national brand next to local firms</th><th>Quoted a management fee percentage</th></tr></thead>
    <tbody>
      <tr><td>Perplexity</td><td>15 of 20</td><td>0 of 20</td></tr>
      <tr><td>Gemini</td><td>13 of 20</td><td>4 of 20</td></tr>
      <tr><td>Google AI Mode</td><td>13 of 19</td><td>2 of 19</td></tr>
      <tr><td>Claude</td><td>12 of 20</td><td>7 of 20</td></tr>
      <tr><td>ChatGPT</td><td>10 of 20</td><td>7 of 20</td></tr>
      <tr><td>Study</td><td><a href="/bg-113.html">BG-113</a></td><td><a href="/bg-110.html">BG-110</a></td></tr>
    </tbody>
  </table>
  </div>

  <p>Perplexity, which gave the fewest facts overall, was the engine most likely to put a national brand next to the local firms in this category. ChatGPT and Claude were the ones that put a number on the fee.</p>

  <h2>What the scorecard does not say</h2>

  <p>It does not say which engine is right. A street address can be out of date, a 5.0 rating can come from three reviews, and vetting advice can be generic. It also does not say which engine buyers use most; that is a survey question, not something these answers can show. And it is one run in July: engines change, and we have not yet measured these 20 cities a second time on the same footing.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Check each engine for the thing it tends to repeat. On Google AI Mode, your address, phone and rating. On ChatGPT, the directories and license records it sends buyers to. On Claude and Gemini, your years in business and track record. On Perplexity, whether you are named at all.</p>
    <p>Keep the engines apart when you track them. An average across five engines would blur exactly the differences this table shows.</p>
  </div>""",
))
```
