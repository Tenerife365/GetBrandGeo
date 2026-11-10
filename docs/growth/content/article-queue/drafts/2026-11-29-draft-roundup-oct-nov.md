# Draft: what changed in AI search, October to early November 2026

- Queue key: `draft-roundup-oct-nov`
- Publish on: 2026-11-29 (queue row `ready from 2026-11-29`)
- Type: roundup, in the shape of BG-099
- Written 2026-11-06 in a separate session. The brief asked for this to be "written last,
  from the verified items above plus anything new by then". A draft cannot see the future,
  so this one covers 1 October to 6 November 2026 and says so in its subtitle and its
  method callout. If Constantin wants the second half of November in it, a session (not
  the routine) refreshes this file before 29 November; the routine never adds items.
- Every item was read at its source on 2026-11-06; each is the same source used by the
  draft that covers it in more depth.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Item | Source | Grade |
|---|---|---|---|
| 1 | Peec Agent launch, post dated 21 Oct 2026 | https://peec.ai/blog/turn-opportunities-into-impact-with-peec-agent-and-actions | primary (vendor) |
| 2 | SafeGEO at EMNLP 2026, October 2026 | https://aclanthology.org/2026.emnlp-main.603/ | primary |
| 3 | OpenAI's one-fifth of Google claim and 1.2 billion weekly users, said 2 Nov, reported 3 Nov | https://www.bigtechnology.com/p/openai-chatgpt-search-is-about-20 | reported |
| 4 | CMA deadline of 3 Dec for AI clicks, reported 2 Nov | https://www.searchenginejournal.com/google-ai-click-reporting-uk-deadline/595663/ and https://assets.publishing.service.gov.uk/media/6a7195d7aec8358a34958bfa/Publisher_conduct_requirement_-_3_Aug_2026.pdf | reported, primary |
| 1b | Peec agent credits by plan | https://docs.peec.ai/agent | primary (vendor) |
| 1c | Search Console AI report, impressions only, one per site per feature | https://support.google.com/webmasters/answer/16984139 | primary |
| 5 | BrandGEO BG-106 to BG-113, 28 Oct to 6 Nov | brandgeo/web/bg-106.html to bg-113.html | own published research |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 to 4. All returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-29", date_label="November 29, 2026", read=6,
    tags=["Roundup", "AI Search News", "October 2026"],
    title="What Changed in AI Search, October to Early November 2026",
    h1="What Changed in AI Search, <em>October to Early November 2026</em>",
    h1_plain="What Changed in AI Search, October to Early November 2026",
    subtitle="Five weeks, four things worth knowing: OpenAI put a number on ChatGPT search, the UK set Google a deadline for AI click data, an AI visibility tool shipped an agent that acts, and a major research conference showed how far content can push an AI agent. Plus what our own eight local studies found.",
    meta_desc="AI search from 1 October to 6 November 2026: OpenAI's one-fifth of Google claim, the UK's 3 December deadline for AI click data, Peec Agent, the SafeGEO paper, and our studies.",
    og_desc="OpenAI's search claim, the UK deadline for Google's AI click data, an agent in an AI visibility tool, a paper on gaming AI agents, and eight local studies from us. Five weeks in one page.",
    ld_desc="BrandGEO roundup of developments in AI search between 1 October and 6 November 2026: OpenAI's claim about ChatGPT search volume, the UK CMA's deadline for Google AI engagement metrics, Peec AI's agent launch, the SafeGEO paper at EMNLP 2026, and BrandGEO's eight local studies.",
    keywords="ai search news november 2026, ai search october 2026 roundup, chatgpt search share google, cma google ai clicks, peec agent launch, safegeo emnlp, geo news roundup",
    about=["AI Search", "Industry Roundup", "Generative Engine Optimization", "Search Regulation"],
    findings=[("1 in 5", "ChatGPT's search-like queries against Google's, by OpenAI's own estimate, given without a method"),
              ("3 Dec 2026", "the CMA's deadline for Google to give publishers AI clicks and click-through rate"),
              ("Up to 83.2 points", "how far rewritten content raised a flawed product's chance of being recommended, in the SafeGEO study"),
              ("591", "AI answers to local buyer questions behind our eight studies published in the period")],
    faq=[("What were the biggest AI search stories of October and early November 2026?",
          "OpenAI said ChatGPT's search-like queries are roughly a fifth of Google's, the UK regulator's 3 December deadline for Google to give publishers AI click data drew attention, Peec AI launched an agent that acts on its findings, and the SafeGEO paper at EMNLP 2026 measured how content can push AI agents toward flawed products."),
         ("Did Google add AI clicks to Search Console?",
          "Not by 6 November 2026. Search Console's generative AI report shows impressions only. The UK Competition and Markets Authority requires clicks and click-through rate by 3 December, and Google's search team said it had nothing to announce yet."),
         ("Why does this roundup stop on 6 November?",
          "It was written on 6 November from sources read that day. We would rather publish a shorter period accurately than fill the rest of the month with items we have not checked."),
         ("Where is the previous roundup?",
          "BG-099 covers the third quarter of 2026.")],
    related=[("/bg-099.html", "BG-099", "What Changed in AI Search This Quarter: Q3 2026",
              "The roundup before this one."),
             ("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The first of our eight local studies in this period."),
             ("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "The last of them.")],
    cta_h="See what changed for your own brand",
    cta_p="Run the free audit on your own domain and read what each engine says about you today. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Roundup",
        lines=[[("AI Search,", "w")], [("Oct to ", "w"), ("Early Nov", "g")]],
        sub=["Five weeks of AI search news,",
             "checked at the source."],
        stats=[("1 in 5", "ChatGPT search vs Google, OpenAI's claim", "Reported 3 Nov"),
               ("3 Dec", "UK deadline for Google AI click data", "CMA"),
               ("+83.2 pts", "most a flawed product's odds rose", "SafeGEO, EMNLP 2026"),
               ("8", "local studies from BrandGEO", "591 answers, 20 cities")],
        footer="Checked at the Source",
    ),
    body="""  <p>Our last roundup, <a href="/bg-099.html">BG-099</a>, covered the third quarter of 2026. This one covers a shorter window, 1 October to 6 November, and four items from outside plus our own research. Each item links to where we read it.</p>

  <div class="callout">
    <div class="callout-label">How this was put together</div>
    <p>Every item was read at its source on 6 November 2026, and this page was written that day. It does not cover anything after 6 November. Vendor and company statements are reported as claims. Fuller pieces on several of these items are on the blog.</p>
  </div>

  <h2>OpenAI put a number on ChatGPT search</h2>

  <p>At a company dinner in New York on 2 November, the product lead for ChatGPT's consumer app said ChatGPT's search-like queries are roughly one-fifth of Google's, <a href="https://www.bigtechnology.com/p/openai-chatgpt-search-is-about-20" target="_blank" rel="noopener">as Big Technology reported the next day</a>. OpenAI also said weekly users rose from 1 billion to 1.2 billion in about 60 days.</p>

  <p><strong>Why it matters:</strong> it puts a size on ChatGPT search that is usually described only through user counts. <strong>The caveat:</strong> "search-like" was not defined in what is free to read, and no period, method or source for Google's volume was given. It is a company estimate, not a measurement.</p>

  <h2>The UK set Google a deadline for AI click data</h2>

  <p>The Competition and Markets Authority's <a href="https://assets.publishing.service.gov.uk/media/6a7195d7aec8358a34958bfa/Publisher_conduct_requirement_-_3_Aug_2026.pdf" target="_blank" rel="noopener">publisher conduct requirement</a> gives Google until 3 December 2026 to provide publishers with impressions, clicks and click-through rate for its search AI features, aggregated across features such as AI Overviews and AI Mode, plus three more months for a page-level control. <a href="https://www.searchenginejournal.com/google-ai-click-reporting-uk-deadline/595663/" target="_blank" rel="noopener">Search Engine Journal reported on 2 November</a> that Google's search team had "nothing to announce yet", and that the first compliance report is due on 3 January 2027.</p>

  <p><strong>Why it matters:</strong> Search Console's generative AI report, which reached all sites on 31 August, shows impressions only. It counts how often links to a site appeared in AI Overviews and AI Mode, with several results from one site in one feature counted as one impression. Clicks from AI features are not shown in that report today. <strong>What to watch:</strong> whether the metrics appear, and whether they appear outside the UK.</p>

  <h2>An AI visibility tool shipped an agent that acts</h2>

  <p>Peec AI announced Peec Agent in a <a href="https://peec.ai/blog/turn-opportunities-into-impact-with-peec-agent-and-actions" target="_blank" rel="noopener">post dated 21 October 2026</a>. In Peec's words, the agent sits in the app's sidebar, comes with built-in skills, connects to more than 25 outside tools, and needs approval before it makes a change. It runs on monthly credits shared across a company, from 500 to 3,000 a month depending on the plan, according to <a href="https://docs.peec.ai/agent" target="_blank" rel="noopener">its documentation</a>, and unused credits do not roll over.</p>

  <p><strong>Why it matters:</strong> AI visibility tools began as dashboards. Several now sell agents that act on what the dashboard finds. Approval settings and the evidence behind each suggestion become the things to check.</p>

  <h2>A paper measured how far content can push an AI agent</h2>

  <p><a href="https://aclanthology.org/2026.emnlp-main.603/" target="_blank" rel="noopener">SafeGEO</a>, presented at EMNLP 2026 in October, built 22 kinds of generative engine optimization attack and tested them on 600 recommendation cases. The attacks raised the chance that a flawed product entered an AI agent's recommendation set by as much as 83.2 percentage points. Simple defences on the agent's side cut harmful target promotion by as much as 39.2 points but did not restore the agent's performance without the attacks.</p>

  <p><strong>Why it matters:</strong> it puts numbers on the line between making true facts easy to find and steering an agent toward a worse choice. The study tested products, not local firms.</p>

  <h2>Our own research: eight local studies</h2>

  <p>Between 28 October and 6 November we published eight studies, BG-106 to BG-113, all built on the same 591 AI answers to local buyer questions in 20 US cities. A few of the findings:</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Study</th><th>Finding</th></tr></thead>
    <tbody>
      <tr><td><a href="/bg-106.html">BG-106</a></td><td>66% of answers named a third-party platform such as a directory or review site</td></tr>
      <tr><td><a href="/bg-107.html">BG-107</a></td><td>Perplexity named no firm in 15 of 120 answers; the other four engines always named one</td></tr>
      <tr><td><a href="/bg-108.html">BG-108</a></td><td>186 of 591 answers quoted a star rating or review count; 86% of ratings quoted were 4.5 or higher</td></tr>
      <tr><td><a href="/bg-109.html">BG-109</a></td><td>Google AI Mode gave a street address in 77 of 111 answers; Gemini in none</td></tr>
      <tr><td><a href="/bg-110.html">BG-110</a></td><td>Only 25 of 591 answers quoted a fee percentage, 20 of them about property management</td></tr>
      <tr><td><a href="/bg-111.html">BG-111</a></td><td>ChatGPT told buyers how to vet firms in 83 of 120 answers; Google AI Mode in 8 of 111</td></tr>
      <tr><td><a href="/bg-112.html">BG-112</a></td><td>269 answers said how long a firm had operated</td></tr>
      <tr><td><a href="/bg-113.html">BG-113</a></td><td>63 of 99 property management answers named a national brand next to local firms</td></tr>
    </tbody>
  </table>
  </div>

  <p><strong>Why it matters:</strong> taken together, they show each engine has its own habit when it answers a local question, which is why we track engines separately. All eight rest on one collection run, on July 24 and 25, 2026: they count what the engines wrote then, and they do not rank anyone.</p>

  <h2>What to watch next</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Date</th><th>What</th></tr></thead>
    <tbody>
      <tr><td>3 December 2026</td><td>CMA deadline for Google's AI engagement metrics</td></tr>
      <tr><td>3 January 2027</td><td>Google's first compliance report to the CMA is due, as Search Engine Journal reported</td></tr>
      <tr><td>About March 2027</td><td>Page-level control due, three months after the first deadline</td></tr>
    </tbody>
  </table>
  </div>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Before 3 December, note your current AI impressions in Search Console so you have a baseline if clicks appear. If you use an AI visibility tool with an agent, check its approval settings. And whatever the headline numbers say about AI search in general, check what the engines say about you in particular.</p>
  </div>""",
))
```
