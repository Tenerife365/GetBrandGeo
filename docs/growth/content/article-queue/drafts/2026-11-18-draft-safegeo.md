# Draft: can a business game an AI recommendation? The SafeGEO paper

- Queue key: `draft-safegeo`
- Publish on: 2026-11-18 (queue row `ready from 2026-11-18`)
- Type: research
- Written 2026-11-06 in a separate session from the research brief of the same day.
  Every figure was read at its source on 2026-11-06. Only the paper's listing page and
  abstract were read, so the article claims nothing about the paper beyond them and
  says so.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | ACL Anthology, "SafeGEO: Understanding Generative Engine Optimization Risks in Recommendation Agents", EMNLP 2026 main conference, Budapest, October 2026: https://aclanthology.org/2026.emnlp-main.603/ | primary (abstract and listing) | 22 GEO attack variants; 600 recommendation cases; flawed target products' rate of entering the recommendation set up by as much as 83.2 percentage points; simple agent-side defences cut harmful promotion by as much as 39.2 points; defences did not restore performance without GEO |
| 2 | BrightLocal, Local Consumer Review Survey 2026, 10 Mar 2026: https://www.brightlocal.com/research/lcrs-ai-trust/ | primary | 97% of AI users sometimes double check AI recommendations against real reviews |
| 3 | Google, 17 Nov 2025: https://blog.google/products-and-platforms/products/search/agentic-plans-booking-travel-canvas-ai-mode/ | primary | AI Mode checks real-time availability across partners for restaurant reservations, event tickets, beauty and wellness appointments |
| 4 | BrandGEO BG-082, BG-108, BG-112 | own published pages | the Princeton GEO paper; ratings quoted (186 of 591, 86% at 4.5 or higher); firm facts (329 of 591 answers stated at least one) |

The paper's authors are not named here: the repository is public and names stay out.

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for sources 1 to 3. All returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-18", date_label="November 18, 2026", read=6,
    tags=["Research Review", "AI Agents", "GEO Risk"],
    title="Can a Business Game an AI Recommendation? What an EMNLP 2026 Study Measured",
    h1="Can a Business <em>Game</em> an AI Recommendation?",
    h1_plain="Can a Business Game an AI Recommendation?",
    subtitle="A paper at EMNLP 2026 tested 22 ways of rewriting web content to push AI shopping agents toward flawed products. It worked, by as much as 83 percentage points, and simple defences only partly undid it. What that means for the line between making true facts easy to find and manipulating an agent.",
    meta_desc="SafeGEO, an EMNLP 2026 paper, found GEO rewrites raised flawed products' odds of being recommended by AI agents by up to 83.2 points. What it means for local firms.",
    og_desc="22 attack types, 600 recommendation cases: rewritten content pushed flawed products into AI agents' picks by up to 83.2 points. Where honest optimization ends.",
    ld_desc="BrandGEO review of SafeGEO, an EMNLP 2026 paper measuring how generative engine optimization attacks can push AI recommendation agents toward flawed products, and what it implies for businesses that want to be recommended by AI engines.",
    keywords="safegeo emnlp 2026, can you manipulate ai recommendations, generative engine optimization risks, geo attacks recommendation agents, ai shopping agent manipulation, ethical geo",
    about=["Generative Engine Optimization", "AI Agents", "AI Safety Research", "Recommendation Systems"],
    findings=[("22", "kinds of GEO attack the SafeGEO study built, tested on 600 recommendation cases"),
              ("Up to 83.2 points", "how much the attacks raised a flawed product's chance of entering an AI agent's recommendation set"),
              ("Up to 39.2 points", "how much simple defences on the agent's side cut the harmful promotion"),
              ("Not restored", "the defences did not bring the agent back to how it chose without the attacks")],
    faq=[("What is SafeGEO?",
          "A study presented at EMNLP 2026, a major natural language processing conference, in October 2026. It measures whether rewriting web content for generative engines can push AI recommendation agents to recommend flawed products, and whether simple defences stop it."),
         ("Did the manipulation work?",
          "In the study's setting, yes. Across 22 kinds of attack and 600 recommendation cases, the chance that a flawed target product entered the agent's recommendation set rose by as much as 83.2 percentage points."),
         ("Can AI engines defend against it?",
          "Partly. Simple defences on the agent's side reduced the harmful promotion by as much as 39.2 points but did not restore the agent's choices to what they were without the attacks."),
         ("Does this apply to lawyers, agents and other local firms?",
          "Not directly. The study tested products in recommendation cases, not local service firms in live AI answers. The lesson that carries over is about the difference between stating true facts clearly and writing content to mislead an agent.")],
    related=[("/bg-082.html", "BG-082", "What the Princeton GEO Paper Actually Tested",
              "The paper that started GEO research, and what its gains did and did not show."),
             ("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "The plain facts engines repeat next to a firm's name."),
             ("/bg-083.html", "BG-083", "What to Fix on a Product Page Before an AI Shopping Agent Can Recommend It",
              "The honest version: making real product facts readable for an agent.")],
    cta_h="Check what the engines say about you, accurately",
    cta_p="Run the free audit on your own domain and read the facts engines attach to your name. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Research Review",
        lines=[[("Gaming an AI", "w")], [("Recommendation", "g")]],
        sub=["What the SafeGEO study at EMNLP 2026",
             "measured, and where the line is."],
        stats=[("22", "kinds of GEO attack tested", "600 recommendation cases"),
               ("+83.2 pts", "most a flawed product's odds rose", "SafeGEO, EMNLP 2026"),
               ("-39.2 pts", "most simple defences cut it", "Agent-side defences"),
               ("Not restored", "defences did not undo the attacks", "Per the paper's abstract")],
        footer="Where Optimization Ends",
    ),
    body="""  <p>Most of what is written about generative engine optimization, GEO, assumes the goal is fair: help an AI engine find and understand the facts about your business. A paper presented at EMNLP 2026 in October asked the uncomfortable version of the question. If content is rewritten to push an AI agent toward a product, can it push the agent toward a bad one?</p>

  <p>The answer, in the study's setting, was yes. And the defences the researchers tried only partly fixed it.</p>

  <div class="callout">
    <div class="callout-label">What we read, and what it cannot tell you</div>
    <p>The paper is <a href="https://aclanthology.org/2026.emnlp-main.603/" target="_blank" rel="noopener">"SafeGEO: Understanding Generative Engine Optimization Risks in Recommendation Agents"</a>, in the main proceedings of EMNLP 2026, held in Budapest. We read its listing and abstract on 6 November 2026 and report only what those state. We have not reproduced the experiments, and we do not describe the individual attack types, because the abstract does not. The study is about products and recommendation agents. It did not test local service firms or live answers from ChatGPT, Gemini or any other public engine.</p>
  </div>

  <h2>What the study measured</h2>

  <p>The setting is an AI recommendation agent: a system that reads sources about products and picks a set to recommend to a user. The researchers rewrote the sources using generative engine optimization, meaning content changed specifically to gain visibility in AI systems, and checked whether the agent still made choices that served the user.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>What was measured</th><th>Result, as the abstract states it</th></tr></thead>
    <tbody>
      <tr><td>Kinds of GEO attack built</td><td>22</td></tr>
      <tr><td>Recommendation cases tested</td><td>600</td></tr>
      <tr><td>Change in a flawed product's chance of entering the recommendation set</td><td>Up by as much as 83.2 percentage points</td></tr>
      <tr><td>Effect of simple defences on the agent's side</td><td>Harmful promotion down by as much as 39.2 points</td></tr>
      <tr><td>Did the defences restore the agent's choices without GEO?</td><td>No</td></tr>
    </tbody>
  </table>
  </div>

  <p>Two things in that table deserve a second look. First, "up to" means the largest effect across the attacks and cases, not the typical one. Second, the target was a flawed product, one that should not have been recommended. The study was not measuring whether optimization helps a good product get noticed. It was measuring whether it can make an agent recommend something that is worse for the user.</p>

  <h2>Two kinds of optimization</h2>

  <p>The study draws a line that anyone working on AI visibility should keep in view. On one side is making true facts easy to find: your services, prices, location, credentials, written plainly where an engine can read them. On the other is writing content whose purpose is to change the engine's choice regardless of whether you are the better choice.</p>

  <p>Our own studies of 591 AI answers to local buyer questions show what engines actually repeat about local firms. In BG-112, 329 answers stated at least one plain fact about a firm, most often how long it had been in business. In BG-108, 186 answers quoted a star rating or review count, and 86% of the ratings quoted were 4.5 or higher. Those are the facts that end up in front of a buyer. The honest work is making sure they are true and current.</p>

  <p>The SafeGEO result is a reminder of what the other side looks like at its strongest: in a test setting, content written to steer an agent moved its picks a long way.</p>

  <h2>Why manipulation is a risk to the business that does it</h2>

  <p>The study already tests the agent's side: simple defences cut harmful promotion by as much as 39.2 points. Our reading, not the paper's: research like this is published so that defences get built, and content written to game today's agent is aimed at a target that is being studied. A tactic that works now can stop working, or start counting against you, without notice.</p>

  <p>There is also the buyer. A local firm recommended on the strength of claims it cannot back up meets the buyer in person. In <a href="https://www.brightlocal.com/research/lcrs-ai-trust/" target="_blank" rel="noopener">BrightLocal's 2026 consumer survey</a>, 97% of people who used AI for local recommendations said they sometimes double check them against real reviews. A recommendation won by steering is one the buyer may check and reject.</p>

  <h2>How this fits with earlier GEO research</h2>

  <p>The paper most GEO advice still rests on is the 2023 Princeton study, which tested nine content changes on its own benchmark, GEO-bench, and found a measured gain for five of them, including adding statistics and adding quotations. We went through it technique by technique in BG-082. SafeGEO looks at the same lever from the other side: if content changes can raise visibility, they can raise it for the wrong product too. Both studies run in controlled settings, and neither tells you what a given public engine will do with your page tomorrow.</p>

  <p>The gap between a product agent and a local business is narrowing. In a <a href="https://blog.google/products-and-platforms/products/search/agentic-plans-booking-travel-canvas-ai-mode/" target="_blank" rel="noopener">post of 17 November 2025</a>, Google said AI Mode can check real-time availability across booking partners for restaurant reservations, event tickets and beauty and wellness appointments, then hand the buyer a short list. That is an agent choosing among local businesses. The questions SafeGEO asks about products will be asked about those choices too.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Put your effort into facts that are true and easy to verify: the year you opened, what you charge, where you are, what you are certified in. State them the same way on your site and your directory profiles. That is the kind of optimization nobody needs to defend against.</p>
    <p>Be wary of any service that promises to change what AI engines recommend through content written for the engine rather than the buyer. The SafeGEO result says such tactics can work in a lab. It also shows defences against them already being tested.</p>
  </div>""",
))
```
