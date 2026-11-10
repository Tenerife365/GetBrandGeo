# Draft: 45 percent of US consumers ask AI for a local business, almost all double check

- Queue key: `draft-consumers-ask-ai`
- Publish on: 2026-11-19 (queue row `ready from 2026-11-19`)
- Type: trending, survey read next to our data
- Written 2026-11-06 in a separate session from the research brief of the same day.
  Every survey figure was read at the source on 2026-11-06. BrandGEO figures are quoted
  as published in BG-108 and BG-111. The "75 percent check Google or Maps" figure from a
  July survey, named in the brief, was NOT read at source and is left out.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Sources, read 2026-11-06

| # | Source | Grade | What was read there |
|---|---|---|---|
| 1 | BrightLocal, "Nearly Half of Consumers are Asking AI for Business Recommendations", Local Consumer Review Survey 2026, 10 Mar 2026: https://www.brightlocal.com/research/lcrs-ai-trust/ | primary | 1,002 US adults via SurveyMonkey, 455 AI users; 45% used AI for local recommendations (6% in 2025); ChatGPT 31%, Google AI Mode 23%; ages 30 to 44 64%, over 60 24%; Google reviews use 83% to 71%; AI users: 63% trust AI recommendations, 10% distrust; non-users: 53% do not trust; 88% of AI users fact check AI sources (51% check a review is legitimate, 37% check the source, 12% do not); 97% sometimes double check against real reviews; 42% always check reviews on native review platforms; review summaries: 23% rely only on the summary, 59% check review profiles, 18% skip summaries; fieldwork date not stated |
| 2 | BrandGEO BG-108, BG-109 and BG-111 | own published research | addresses: ChatGPT 2 of 120, Google AI Mode 77 of 111; ratings quoted: ChatGPT 28, Google AI Mode 57; ratings quoted in 186 of 591 answers, 86% at 4.5 or higher, 5 of 267 below 4.0; vetting advice: ChatGPT 83 of 120, Google AI Mode 8 of 111 |

## Check before publishing

`curl -s -o /dev/null -L -A 'Mozilla/5.0 BrandGEO-source-check' -w '%{http_code}' <url>`
for source 1. It returned 200 on 2026-11-06.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-19", date_label="November 19, 2026", read=6,
    tags=["Consumer Research", "Reviews", "Local Search"],
    title="45% of US Consumers Ask AI for a Local Business. Almost All of Them Double Check",
    h1="45% Ask AI for a Local Business. <em>Almost All Double Check</em>",
    h1_plain="45% Ask AI for a Local Business. Almost All Double Check",
    subtitle="BrightLocal's 2026 consumer survey found that asking AI for a local business went from 6% to 45% of US adults in a year, and that 97% of those users sometimes check the answer against real reviews. Next to our own data, it shows where the check lands: on the ratings and profiles the engines quote.",
    meta_desc="BrightLocal's 2026 survey: 45% of US adults used AI for local business recommendations, up from 6%, and 97% of them sometimes double check against reviews. What that means.",
    og_desc="AI for local recommendations jumped from 6% to 45% of US adults in a year. 97% of those users sometimes double check against reviews. Where that check lands, from our own data.",
    ld_desc="BrandGEO reading of BrightLocal's Local Consumer Review Survey 2026 on AI use for local business recommendations, set next to BrandGEO's own counts of the ratings and vetting advice AI engines give in answers to local buyer questions.",
    keywords="consumers use ai for local business recommendations, brightlocal 2026 survey ai, do people trust ai recommendations, ai recommendations double check reviews, chatgpt local business survey, local consumer review survey 2026",
    about=["Consumer Behaviour", "Online Reviews", "Local Search", "AI Search"],
    findings=[("45%", "of 1,002 US adults used an AI tool for a local business recommendation in the past year, up from 6% in 2025"),
              ("97%", "of those AI users sometimes double check the recommendation against real reviews"),
              ("42%", "always check reviews on the review platforms themselves"),
              ("86%", "of the star ratings AI engines quoted in our local answers were 4.5 or higher")],
    faq=[("How many people use AI to find local businesses?",
          "In BrightLocal's Local Consumer Review Survey 2026, published in March, 45% of 1,002 US adults said they had used an AI tool for a local business recommendation in the past 12 months, up from 6% a year earlier. ChatGPT was used by 31% and Google's AI Mode by 23%."),
         ("Do people trust AI recommendations for local businesses?",
          "Among people who used them, 63% said they trust AI tools' recommendations and 10% said they do not. Among people who had not used them, 53% said they do not trust them."),
         ("Do consumers check what AI recommends?",
          "Almost all of them, at least sometimes. 97% of AI users said they sometimes double check AI recommendations against real reviews, 42% always check reviews on the review platforms, and 88% said they fact check AI sources in some way."),
         ("What does that mean for a local business?",
          "The AI answer is often the start of the decision, not the end. The buyer then goes to the reviews and profiles, which are also what the engines quote, so those need to be complete, current and consistent.")],
    related=[("/bg-108.html", "BG-108", "How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
              "The ratings engines put in front of buyers, counted."),
             ("/bg-111.html", "BG-111", "How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
              "The engines' own advice to check, engine by engine."),
             ("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The review sites and directories a buyer is sent to.")],
    cta_h="See what the engines tell your buyers to check",
    cta_p="Run the free audit on your own domain and read the ratings, sources and advice engines give about your category. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · Consumer Research",
        lines=[[("They Ask AI.", "w")], [("Then They ", "w"), ("Check.", "g")]],
        sub=["A 2026 survey of US consumers,",
             "read next to 591 AI answers."],
        stats=[("45%", "used AI for a local recommendation", "Up from 6%, BrightLocal"),
               ("97%", "of AI users sometimes double check", "Against real reviews"),
               ("42%", "always check the review platforms", "BrightLocal, Mar 2026"),
               ("86%", "of ratings AI engines quoted were 4.5+", "BrandGEO, 20 US cities")],
        footer="The Answer Starts the Search",
    ),
    body="""  <p>In one year, asking an AI tool for a local business went from something few people did to something close to half of US adults had tried. That is the headline of <a href="https://www.brightlocal.com/research/lcrs-ai-trust/" target="_blank" rel="noopener">BrightLocal's Local Consumer Review Survey 2026</a>, published in March. The part that gets less attention is what those people did next: almost all of them went and checked.</p>

  <p>The survey is not new, but it frames what we have been measuring this month from the other side. Our studies count what AI engines say to a buyer. This survey asks the buyers what they do with it.</p>

  <div class="callout">
    <div class="callout-label">Sources, and what they cannot tell you</div>
    <p>BrightLocal surveyed 1,002 US adults through SurveyMonkey; some figures are based on the 455 who had used an AI tool for a local business recommendation in the past 12 months. The report does not state when the fieldwork ran. We read it on 6 November 2026. A survey records what people say they do, which is not always what they do. Our own figures come from 591 AI answers to local buyer questions in 20 US cities, collected on July 24 and 25, 2026, as published in BG-108, BG-109 and BG-111.</p>
  </div>

  <h2>How many ask, and which tools</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Finding</th><th>Share</th></tr></thead>
    <tbody>
      <tr><td>Used an AI tool for a local business recommendation, past 12 months</td><td>45% (6% in 2025)</td></tr>
      <tr><td>Used ChatGPT for one</td><td>31%</td></tr>
      <tr><td>Used Google's AI Mode for one</td><td>23%</td></tr>
      <tr><td>Adults aged 30 to 44 who had asked AI for a recommendation</td><td>64%</td></tr>
      <tr><td>Adults over 60 who had</td><td>24%</td></tr>
      <tr><td>Used Google reviews, as BrightLocal reports it</td><td>71% (83% in 2025)</td></tr>
    </tbody>
  </table>
  </div>

  <p>The age split matters for anyone selling to a particular group. A firm whose buyers are mostly in their thirties and forties is dealing with a majority that has already asked an AI tool. One whose buyers are mostly retired is not, yet.</p>

  <h2>Trust, and checking</h2>

  <p>The survey shows a group that uses the answers without taking them on faith.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Among people who used AI for a local recommendation</th><th>Share</th></tr></thead>
    <tbody>
      <tr><td>Trust AI tools' recommendations</td><td>63%</td></tr>
      <tr><td>Distrust them</td><td>10%</td></tr>
      <tr><td>Sometimes double check against real reviews</td><td>97%</td></tr>
      <tr><td>Fact check AI sources in some way</td><td>88%</td></tr>
      <tr><td>Check whether a review is legitimate</td><td>51%</td></tr>
      <tr><td>Check the source</td><td>37%</td></tr>
      <tr><td>Always check reviews on the review platforms themselves</td><td>42%</td></tr>
    </tbody>
  </table>
  </div>

  <p>So trust and checking go together. Most users say they trust the recommendations, and nearly all of them still look at the reviews at least some of the time. Among people who had not used AI for this, 53% said they do not trust it.</p>

  <p>The same pattern shows up with AI review summaries. 23% of users rely only on the summary, 59% go on to the review profiles for more, and 18% skip summaries altogether.</p>

  <h2>Where the check lands</h2>

  <p>Our data shows what the buyer is checking against. In BG-108 we counted every star rating and review count in our 591 answers. 186 answers quoted one. Of the 267 distinct ratings quoted, 86% were 4.5 or higher and only 5 were below 4.0. When an engine quotes a rating, it is almost always a high one.</p>

  <p>When 42% of users always go to the review platform to check, the rating the engine quoted and the rating on the platform had better match. A firm described as "4.9 stars" in an answer and showing 4.3 on its profile invites exactly the doubt the buyer went to check for.</p>

  <p>Engines also tell buyers to check, though very unevenly. In BG-111, ChatGPT gave vetting advice in 83 of its 120 answers: check a license, read reviews, interview several firms. Google AI Mode did so in 8 of 111. A buyer who starts in ChatGPT is told to verify; one who starts in AI Mode is mostly handed details and left to decide.</p>

  <h2>The two tools people named most</h2>

  <p>The survey's two most used tools, ChatGPT at 31% and Google's AI Mode at 23%, hand the buyer very different starting points, going by our own counts.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>In our 591 local answers</th><th>ChatGPT (120)</th><th>Google AI Mode (111)</th></tr></thead>
    <tbody>
      <tr><td>Quoted a star rating or review count (BG-108)</td><td>28</td><td>57</td></tr>
      <tr><td>Gave a street address (BG-109)</td><td>2</td><td>77</td></tr>
      <tr><td>Told the buyer how to vet the firms (BG-111)</td><td>83</td><td>8</td></tr>
    </tbody>
  </table>
  </div>

  <p>An AI Mode user more often gets the rating and the address in the answer itself, so the check is a comparison: does the profile say the same thing? A ChatGPT user more often gets a list of names and instructions, so the check is a search: where are this firm's reviews? Either way the buyer ends up on a review platform or a directory profile.</p>

  <h2>What this does not show</h2>

  <p>The survey does not link a specific AI answer to a specific check, and our data does not follow any buyer after the answer. Put together, they describe a likely path, not a measured one: a buyer asks, gets a short list with ratings, and goes to the reviews before calling anyone.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Treat the review platforms as part of the AI answer. Check that your rating and review count on Google and on the directories your category is sent to (BG-106 lists them) are current, and that what engines quote about you matches.</p>
    <p>Reply to reviews, keep your profile details current, and do not chase a rating number on one platform while another tells a different story. The buyer who checks will see both.</p>
  </div>""",
))
```
