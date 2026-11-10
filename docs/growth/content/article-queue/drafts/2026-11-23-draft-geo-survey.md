# Draft: what 45 GEO studies agree on, and where the evidence is thin

- Queue key: `draft-geo-survey`
- Publish on: 2026-11-23 (queue row `ready from 2026-11-23`)
- Type: research review
- Written 2026-11-06 in a separate session. The brief marked this "after one check": read
  the abstract and conclusion at arXiv. Result: the abstract page was read on 2026-11-06
  (title, date, 45 studies, November 2023 to July 2026, the main claims). The full text and
  its conclusion section were not read, so the article quotes only what the abstract page
  states and says so. Check passed on that basis.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | arXiv 2607.14035, "Optimizing Visibility in Generative Engines: A Critical Survey of Generative Engine Optimization (2023-2026)", submitted 15 Jul 2026, cs.IR: https://arxiv.org/abs/2607.14035 | primary (abstract page) | reviews 45 studies, November 2023 to July 2026; GEO framed as a stochastic, partially observable pipeline (search activation, crawling, retrieval, reranking, citation, user behaviour); the foundational paper's gains hold where the source is already in a fixed context and do not show discoverability or lasting traffic; topical relevance and position in context most reproducible; generic heuristics transfer poorly; competition can erode gains; citation-oriented rewrites can hurt retrieval; commercial audits show low source overlap, run-to-run variability, gaps in factual fidelity; contributes a multistage model, a "visibility vector" (discoverability, citation, absorption, economic outcomes), an evidence hierarchy and a reproducibility protocol; no reviewed technique shows a stable, long-term, cross-platform effect on organic discoverability |
| 2 | BrandGEO BG-082, BG-067, BG-016, BG-107 | own published pages | the Princeton paper and its benchmark; the GEO versus SEO debate; cross-engine agreement; Perplexity naming no firm in 15 of 120 answers |

The author is not named: names stay out of the public repository.

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for source 1. It returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-23", date_label="November 23, 2026", read=6,
    tags=["Research Review", "GEO Evidence", "Academic Research"],
    title="What 45 GEO Studies Agree On, and Where the Evidence Is Thin",
    h1="What 45 GEO Studies Agree On, and <em>Where the Evidence Is Thin</em>",
    h1_plain="What 45 GEO Studies Agree On, and Where the Evidence Is Thin",
    subtitle="A July 2026 survey on arXiv reviewed 45 studies of generative engine optimization published since November 2023. Its verdict is sober: some levers hold up inside an AI answer, almost nothing is shown to make a business easier to find over time. A reader's guide.",
    meta_desc="A July 2026 arXiv survey reviewed 45 GEO studies from 2023 to 2026. What it finds well supported, what it finds thin, and what that means for a business.",
    og_desc="45 GEO studies reviewed: relevance and position in context hold up, generic tricks transfer poorly, and no technique shows a lasting cross-platform effect on being found.",
    ld_desc="BrandGEO reader's guide to a July 2026 critical survey of generative engine optimization research on arXiv, which reviewed 45 studies published between November 2023 and July 2026, with notes on how its conclusions match BrandGEO's own measurement experience.",
    keywords="generative engine optimization research review, geo survey arxiv 2026, does geo work evidence, geo studies 2023 2026, geo visibility vector, ai search optimization evidence",
    about=["Generative Engine Optimization", "Academic Research", "AI Search", "Research Methods"],
    findings=[("45", "GEO studies reviewed, published between November 2023 and July 2026"),
              ("Relevance and position", "the levers the survey finds most reproducible once content is inside an AI answer's context"),
              ("Low overlap", "in sources, with run-to-run variability, reported by the commercial audits it reviewed"),
              ("None", "of the reviewed techniques shows a stable, long-term, cross-platform effect on being found")],
    faq=[("What does the 2026 GEO survey conclude?",
          "That generative engine optimization is not one ranking problem but a chain of steps, from whether the engine searches at all to how users act on the answer, and that the evidence is strongest for changes to content already in the engine's context and weakest for making content easier to find over time."),
         ("Does GEO work, according to the research?",
          "Partly. Content that has already been retrieved can change how it is cited or used, and topical relevance and position in context are the most reproducible levers. But the survey finds no reviewed technique with a stable, long-term, cross-platform effect on organic discoverability."),
         ("What about the Princeton GEO paper?",
          "The survey says its reported gains hold within its experimental setup, where a source is already in a fixed context, but do not show that content becomes more discoverable or drives lasting traffic. That matches the caveat we gave in BG-082."),
         ("What should a business take from this?",
          "Be sceptical of generic GEO tricks and promises of lasting gains. Focus on being relevant and accurate for the questions your buyers ask, and measure what engines actually say, repeatedly and engine by engine.")],
    related=[("/bg-082.html", "BG-082", "What the Princeton GEO Paper Actually Tested",
              "The foundational study the survey re-reads."),
             ("/bg-067.html", "BG-067", "The GEO vs SEO Debate Is Not as Settled as the Clarity Pieces Claim",
              "Why confident answers to GEO questions deserve a second look."),
             ("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "Our own data on how often engines agree.")],
    cta_h="Measure what the engines say, more than once",
    cta_p="Run the free audit on your own domain and read each engine's answer to your buyers' questions. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Research Review",
        lines=[[("45 GEO Studies,", "w")], [("One ", "w"), ("Verdict", "g")]],
        sub=["What a 2026 survey finds well supported,",
             "and what it finds thin."],
        stats=[("45", "studies reviewed, Nov 2023 to Jul 2026", "arXiv 2607.14035"),
               ("Chain", "of steps from search to user behaviour", "The survey's framing"),
               ("Low", "source overlap in commercial audits", "Reviewed by the survey"),
               ("None", "shows a lasting cross-platform effect", "On being found")],
        footer="Read the Evidence, Not the Pitch",
    ),
    body="""  <p>Generative engine optimization, GEO, has gone from one academic paper in late 2023 to a whole industry of tools, agencies and advice. The research has grown too, and in July 2026 a survey posted on arXiv read it critically. It reviews 45 studies published between November 2023 and July 2026.</p>

  <p>Its conclusion is more careful than most of what is sold under the GEO label, and worth knowing before you pay for any of it.</p>

  <div class="callout">
    <div class="callout-label">What we read, and what it cannot tell you</div>
    <p>The survey is <a href="https://arxiv.org/abs/2607.14035" target="_blank" rel="noopener">"Optimizing Visibility in Generative Engines: A Critical Survey of Generative Engine Optimization (2023-2026)"</a>, arXiv 2607.14035, submitted on 15 July 2026. arXiv is a preprint server, so posting there is not the same as passing peer review. We read the abstract page on 6 November 2026 and report only what it states. We did not read the full text, so where the survey argues something in detail, we give its conclusion, not its reasoning.</p>
  </div>

  <h2>GEO is not one problem, it is a chain</h2>

  <p>The survey's main argument is about framing. Most advice treats GEO as a ranking problem: do X and you rise in the AI answer. The survey describes it instead as a chain of uncertain steps that cannot be fully observed from outside. The table below condenses it to six steps; the abstract names a few more, including prominence, factual absorption and fidelity.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Step</th><th>The question at that step</th></tr></thead>
    <tbody>
      <tr><td>Search activation</td><td>Does the engine search the web for this question at all?</td></tr>
      <tr><td>Crawling</td><td>Has it fetched your page?</td></tr>
      <tr><td>Retrieval</td><td>Is your page among the sources pulled for this question?</td></tr>
      <tr><td>Reranking</td><td>Where does it land among those sources?</td></tr>
      <tr><td>Citation</td><td>Is it cited, or used, in the answer?</td></tr>
      <tr><td>User behaviour</td><td>Does anyone act on it?</td></tr>
    </tbody>
  </table>
  </div>

  <p>Each step can fail on its own, and a study that tests one step says little about the others. To keep the steps apart, the survey proposes what it calls a visibility vector: separate measures for discoverability, citation, absorption into the answer, and economic outcome, instead of one visibility score.</p>

  <p>For a local firm the chain is a useful map of what is and is not in your hands. Whether an engine searches the web for a question, and how it ranks what it finds, you cannot control. Whether your pages exist, can be fetched, and state the facts a buyer asks about in plain words, you can. Most honest GEO work sits in that second group.</p>

  <h2>What it finds well supported</h2>

  <p><strong>Relevance and position.</strong> Once content is in the engine's context, topical relevance and where the content sits in that context are the most reproducible levers across the studies reviewed.</p>

  <p><strong>Changing how retrieved content is used.</strong> Content that has already been retrieved can causally change how it is cited or used in the answer. That is a real effect, but it begins after the hardest step, getting retrieved.</p>

  <h2>What it finds thin</h2>

  <p><strong>Generic tricks.</strong> Heuristics that work in one setting transfer poorly to others.</p>

  <p><strong>Competition.</strong> When many sources apply the same optimization, individual gains can erode.</p>

  <p><strong>Citation-first rewriting.</strong> Rewriting content to be cited can hurt its chance of being retrieved in the first place.</p>

  <p><strong>Lasting effects.</strong> The sharpest line in the abstract: no reviewed technique shows a stable, long-term, cross-platform effect on organic discoverability or on what users do next.</p>

  <h2>A second look at the Princeton paper</h2>

  <p>The 2023 Princeton paper started the field and is still widely cited as proof that GEO works. The survey's reading is that its gains hold within its own experimental setup, where a source is already in a fixed context, and do not show that content becomes more discoverable or drives lasting traffic. We reached a similar caveat when we went through the paper's nine techniques in <a href="/bg-082.html">BG-082</a>: real effects on a benchmark built for the study, not proof of what a live engine does with your page.</p>

  <h2>What the commercial audits show</h2>

  <p>The survey also looks at audits run by companies, not only academic experiments. Its summary: low source overlap, substantial variability from one run to the next, and persistent gaps in factual fidelity, meaning answers that get facts wrong.</p>

  <p>That matches what we see in our own measurements. The same local buyer question, asked of five engines, gets very different kinds of answer. In <a href="/bg-107.html">BG-107</a>, four engines named a firm in every answer while Perplexity named none in 15 of 120. In <a href="/bg-016.html">BG-016</a> we looked at how often engines agree on the same firm. Low overlap and run-to-run variation are the normal state, not an error in the measurement.</p>

  <h2>What the survey offers instead</h2>

  <p>Besides the review, the survey proposes a formal multistage model of the chain above, an evidence hierarchy for judging GEO claims, and a protocol for making GEO studies reproducible. Those are tools for researchers more than for a business owner, but the evidence hierarchy is a useful habit: ask what kind of evidence sits behind any GEO claim you are sold. A controlled experiment on a benchmark, a vendor case study and a single screenshot are not the same thing.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Be sceptical of any GEO promise of a lasting lift across all engines. This review of 45 studies did not find one.</p>
    <p>Put your effort where the evidence is strongest: be clearly relevant to the questions your buyers actually ask, and make sure the facts about you are accurate wherever engines read them. Then measure what engines say, engine by engine and more than once, because a single answer is one draw from a variable process.</p>
  </div>""",
))
```
