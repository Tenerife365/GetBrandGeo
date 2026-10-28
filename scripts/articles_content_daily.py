"""Articles published by the daily routine (brandgeo-daily-article), BG-106 on.

Same dict shape as scripts/articles_content.py, plus one extra key, "og",
which scripts/publish_article.py passes to the OG image generator. The
builder ignores keys it does not know, so build_articles.py renders these
exactly like every other article.

Every number in these articles comes from read-only SQL against ai_results,
recorded with its query in docs/growth/content/article-queue/data/. No
person's name goes in this file: the repository is public.

To add the next article: append one more ARTICLES_DAILY.append(dict(...))
block at the end of this file, then run
    python scripts/publish_article.py --slug bg-1NN
"""

ARTICLES_DAILY = []

ARTICLES_DAILY.append(dict(
    slug="bg-106", bid="BG-106", date="2026-10-28", date_label="October 28, 2026", read=7,
    tags=["Original Research", "US Cities", "Local Directories"],
    title="The Directories AI Engines Name When They Recommend Local Professionals",
    h1="The <em>Directories AI Engines Name</em> When They Recommend Local Professionals",
    h1_plain="The Directories AI Engines Name When They Recommend Local Professionals",
    subtitle="We read 591 AI answers to local buyer questions across 20 US cities. Two in three named at least one third-party platform: a lawyer directory, a review site, a real estate portal. Which ones depends almost entirely on the profession.",
    meta_desc="In 591 AI answers across 20 US cities, 66% named a third-party platform such as Super Lawyers, Avvo, Zillow or Expertise.com. Which platforms, by profession and engine.",
    og_desc="Two in three AI answers to local buyer questions named a directory, review site or portal. Lawyers get Super Lawyers and Avvo, agents get Zillow, property managers get Expertise.com and the BBB.",
    ld_desc="Original BrandGEO research counting which third-party platforms ChatGPT, Claude, Gemini, Perplexity and Google AI Mode named in 591 answers to local professional-services questions across 20 US cities.",
    keywords="which directories do ai engines use, ai search local lawyer directories, super lawyers chatgpt, avvo ai search, zillow ai recommendations, expertise.com ai visibility, local seo ai engines directories",
    about=["AI Visibility Research", "Local Search", "Online Directories", "Professional Services"],
    findings=[("66%", "of 591 AI answers to local buyer questions named at least one third-party platform: a directory, review site, portal or professional body"),
              ("95%", "of immigration lawyer answers named one, the highest of any question type we asked; city-specific questions were lowest at 40%"),
              ("125", "answers named Super Lawyers, more than any other platform we counted, in all 20 cities and on all 5 engines"),
              ("48% to 79%", "the range by engine: Google AI Mode named a platform most often, Perplexity least often")],
    faq=[("Do AI engines use directories when recommending local businesses?",
          "In our data they mention them often. Across 591 answers to local buyer questions in 20 US cities, 66% named at least one third-party platform such as Super Lawyers, Avvo, Zillow, Yelp or Expertise.com. We counted names in the answer text, so this shows what engines say, not how they rank."),
         ("Which directories do AI engines name for lawyers?",
          "Super Lawyers (125 answers), Best Lawyers (101), Avvo (89) and Justia (65) led the legal questions, and every one of them appeared in all 20 cities. For immigration questions, the American Immigration Lawyers Association was named in 44 of 98 answers."),
         ("Which platforms do AI engines name for real estate and property management?",
          "For real estate agents, Zillow led with 39 of 98 answers, followed by RealTrends, FastExpert, HomeLight, Redfin and Realtor.com. For property management, the mix shifted toward review and vetting sites: Expertise.com (28 of 99 answers), the BBB (24), Google reviews (23) and Yelp (21)."),
         ("Does being listed on these directories make AI recommend my business?",
          "This study cannot show that. It counts which platforms engines named, not why a firm was picked. What it does show is which platforms the engines treat as worth mentioning in your category, which makes those profiles the first ones worth checking for accuracy and completeness.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "The same kind of city questions read the other way: which firms several engines agreed on."),
             ("/ai-visibility-for-chicago.html", "Chicago", "AI Visibility in Chicago",
              "One of the 20 city studies this dataset comes from, firm by firm."),
             ("/ai-visibility-for-law-firms.html", "Law firms", "AI Visibility for Law Firms",
              "What the legal-services pattern means for a single practice.")],
    cta_h="See which platforms the engines name in your category",
    cta_p="Run the free audit on your own domain and read the answers the engines give your buyers, sources included. No signup and no card.",
    og=dict(
        fname="og-bg-106.png",
        kicker="BG-106 · Original Research",
        lines=[[("The Directories", "w")], [("AI Engines ", "w"), ("Name", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("66%", "of answers named a third-party platform", "BrandGEO, 20 US cities"),
               ("95%", "of immigration lawyer answers named one", "98 answers, 5 engines"),
               ("125", "answers named Super Lawyers, in all 20 cities", "BrandGEO, July 2026 data"),
               ("48% to 79%", "range by engine, Perplexity to Google AI Mode", "591 answers")],
        footer="Who The Engines Point To",
    ),
    body="""  <p>When someone asks an AI engine for a personal injury lawyer in Houston or a property manager in Phoenix, the answer rarely stops at a list of firms. It tends to explain why those firms, and the explanation often leans on someone else: a lawyer rated by Super Lawyers, an agent ranked on Zillow, a manager with an A+ from the Better Business Bureau. We wanted to know how often that happens, and which platforms the engines reach for.</p>

  <p><strong>In 591 answers across 20 US cities, 390 named at least one third-party platform. That is 66%, two answers in three.</strong> Which platform depended almost entirely on the profession being asked about.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents, a property management company, an immigration lawyer, and two questions specific to that city's economy, such as entertainment lawyers in Los Angeles or craft breweries in San Diego. Five engines answered each one: ChatGPT, Claude, Gemini, Perplexity and Google AI Mode. Collection ran on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>We then searched each answer's text for 30 platform names. Where an engine's stored answer includes its source links, a link to the platform counts as a mention. A mention is not a ranking factor: it tells you what the engine said, not how it chose. We dropped U.S. News from the count because a plain text match could not tell its legal rankings apart from unrelated uses of the word "news".</p>
  </div>

  <h2>By question: lawyers get directories, everyone gets reviews</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question type</th><th>Answers</th><th>Named a platform</th><th>Share</th></tr></thead>
    <tbody>
      <tr><td>Immigration lawyer</td><td>98</td><td>93</td><td>95%</td></tr>
      <tr><td>Personal injury lawyer</td><td>98</td><td>80</td><td>82%</td></tr>
      <tr><td>Real estate agents</td><td>98</td><td>70</td><td>71%</td></tr>
      <tr><td>Property management</td><td>99</td><td>67</td><td>68%</td></tr>
      <tr><td>City-specific questions</td><td>198</td><td>80</td><td>40%</td></tr>
    </tbody>
  </table>
  </div>

  <p>Legal questions pulled the most platform names. For an immigration lawyer, 93 of 98 answers named at least one. The city-specific questions sat far lower at 40%, partly because several of them were not about professional services at all: hotels, coffee roasters and breweries do not have a Super Lawyers.</p>

  <h2>The platforms, counted</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Platform</th><th>Answers</th><th>Cities (of 20)</th><th>Engines (of 5)</th><th>Where it showed up most</th></tr></thead>
    <tbody>
      <tr><td>Super Lawyers</td><td>125</td><td>20</td><td>5</td><td>Immigration 50, personal injury 49</td></tr>
      <tr><td>Best Lawyers</td><td>101</td><td>20</td><td>5</td><td>City-specific 38, immigration 33</td></tr>
      <tr><td>Avvo</td><td>89</td><td>20</td><td>5</td><td>Immigration 53, personal injury 29</td></tr>
      <tr><td>Expertise.com</td><td>72</td><td>20</td><td>5</td><td>Property management 28, real estate 16</td></tr>
      <tr><td>Yelp</td><td>71</td><td>19</td><td>5</td><td>Property management 21, real estate 19</td></tr>
      <tr><td>Justia</td><td>65</td><td>20</td><td>5</td><td>Immigration 43, personal injury 17</td></tr>
      <tr><td>Chambers</td><td>59</td><td>18</td><td>4</td><td>City-specific 42</td></tr>
      <tr><td>Zillow</td><td>49</td><td>20</td><td>5</td><td>Real estate 39, property management 10</td></tr>
      <tr><td>AILA</td><td>44</td><td>20</td><td>4</td><td>Immigration only</td></tr>
      <tr><td>Google reviews</td><td>43</td><td>18</td><td>5</td><td>Property management 23</td></tr>
      <tr><td>Reddit</td><td>41</td><td>17</td><td>4</td><td>Spread across all five types</td></tr>
      <tr><td>BBB</td><td>35</td><td>17</td><td>5</td><td>Property management 24</td></tr>
    </tbody>
  </table>
  </div>

  <p>Below these, a long tail: Martindale (22 answers), RealTrends (20), FastExpert (19), HomeLight (18), Redfin (16), Realtor.com (13), NARPM, the property managers' association (11), Thumbtack (9) and FindLaw (5).</p>

  <h2>Three patterns worth noticing</h2>

  <p><strong>Legal directories travel as credentials.</strong> Super Lawyers appeared in more answers than any other platform we counted, and most of those mentions read as a credential attached to a named firm, in the form "recognized by Super Lawyers", rather than as advice to go and search the directory. Avvo and Justia worked more like places to look. For an immigration question, Avvo appeared in 53 of 98 answers and the American Immigration Lawyers Association in 44.</p>

  <p><strong>Property management is judged on reviews.</strong> No single directory owns it. Expertise.com, the BBB, Google reviews and Yelp each appeared in 21 to 28 of the 99 answers. Expertise.com leaned heavily on one engine: 57 of its 72 mentions came from ChatGPT.</p>

  <p><strong>Real estate agents are filtered through portals.</strong> Zillow appeared in 39 of 98 agent answers, and agent-ranking sites such as RealTrends, FastExpert and HomeLight filled most of the rest. Many of these answers recommend individual agents rather than brokerages, with the portal supplying the evidence.</p>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Named a platform</th><th>Share</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>111</td><td>88</td><td>79%</td></tr>
      <tr><td>ChatGPT</td><td>120</td><td>91</td><td>76%</td></tr>
      <tr><td>Claude</td><td>120</td><td>85</td><td>71%</td></tr>
      <tr><td>Gemini</td><td>120</td><td>68</td><td>57%</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>58</td><td>48%</td></tr>
    </tbody>
  </table>
  </div>

  <p>Every engine named platforms, but not equally. Google AI Mode and ChatGPT did so in roughly three answers out of four. Perplexity did so in under half.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Find your category in the tables above and check your profile on each platform the engines name for it. A lawyer's first stops are Super Lawyers, Best Lawyers, Avvo and Justia, plus AILA for immigration work. An agent's are Zillow and the agent-ranking sites. A property manager's are Expertise.com, the BBB, Google reviews and Yelp.</p>
    <p>Check that the facts match your own website: name, address, practice areas, years in business. This study cannot promise that a better profile gets you recommended. It does show that these are the pages engines quote when they explain a recommendation, so an outdated one is the one most likely to be repeated back to a buyer.</p>
  </div>""",
))
