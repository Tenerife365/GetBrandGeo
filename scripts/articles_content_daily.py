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

ARTICLES_DAILY.append(dict(
    slug="bg-107", bid="BG-107", date="2026-10-31", date_label="October 31, 2026", read=6,
    tags=["Original Research", "US Cities", "Perplexity"],
    title="When an AI Engine Names No One: 15 Answers With No Firm in Them",
    h1="When an AI Engine <em>Names No One</em>",
    h1_plain="When an AI Engine Names No One",
    subtitle="We asked five AI engines for the best local professionals in 20 US cities and read every answer that looked empty. Four engines named at least one firm every time. Perplexity named none in 15 of 120 answers, and in half the cities it named no real estate agent at all.",
    meta_desc="In 591 AI answers to local buyer questions across 20 US cities, Perplexity named no firm in 15 of 120. ChatGPT, Claude, Gemini and Google AI Mode always named one.",
    og_desc="Four engines named a firm in every answer. Perplexity named none in 15 of 120, including no real estate agent in 10 of 20 cities. What a no-name answer looks like and what it means for local firms.",
    ld_desc="Original BrandGEO research counting the answers in which ChatGPT, Claude, Gemini, Perplexity and Google AI Mode named no firm at all, across 591 answers to local professional-services questions in 20 US cities.",
    keywords="perplexity no results local businesses, ai engine refuses to recommend, perplexity real estate agents, ai search no recommendation, local ai visibility perplexity, chatgpt vs perplexity local recommendations",
    about=["AI Visibility Research", "Local Search", "Perplexity", "Professional Services"],
    findings=[("15 of 120", "Perplexity answers named no firm, brokerage or individual professional at all"),
              ("0", "such answers from ChatGPT, Claude, Gemini or Google AI Mode across their 471 answers"),
              ("10 of 20", "cities where Perplexity named no real estate agent for a home buyer"),
              ("12", "Perplexity answers said in plain words that its search results were missing or too thin to verify a recommendation")],
    faq=[("Do AI engines always recommend a business when asked for the best one?",
          "Not always. In our 591 answers across 20 US cities, ChatGPT, Claude, Gemini and Google AI Mode named at least one firm every time. Perplexity named none in 15 of its 120 answers and gave advice on how to choose instead."),
         ("Why did Perplexity not name any real estate agents?",
          "We can only report what it said, not why. In several answers it wrote that it had no search results to verify which agents were best, then offered a checklist or pointed to a ranking list. It did this for real estate agents in 10 of the 20 cities."),
         ("Which questions were most likely to get no names?",
          "Real estate agents, by a wide margin: 10 of 20 Perplexity answers named no agent or brokerage. Immigration lawyers and city-specific questions had 2 each, personal injury 1, and property management none."),
         ("What should a local firm do about answers that name no one?",
          "Check the same question on more than one engine. An empty answer on one engine is not the same as being absent everywhere: in these cities every other engine that answered named firms for the same questions. Track each engine separately rather than averaging them.")],
    related=[("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The same 591 answers, read for the platforms engines lean on."),
             ("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "How often several engines agree on the same firm in a city."),
             ("/ai-visibility-for-real-estate.html", "Real estate", "AI Visibility for Real Estate",
              "What these answers mean for an agent or brokerage.")],
    cta_h="See which engines name you, and which name no one",
    cta_p="Run the free audit on your own domain and read each engine's answer separately. No signup and no card.",
    og=dict(
        fname="og-bg-107.png",
        kicker="BG-107 · Original Research",
        lines=[[("When an AI Engine", "w")], [("Names ", "w"), ("No One", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("15 of 120", "Perplexity answers named no firm at all", "BrandGEO, 20 US cities"),
               ("0", "such answers from the other four engines", "471 answers"),
               ("10 of 20", "cities with no real estate agent named", "Perplexity, buyer question"),
               ("12", "answers said its results were too thin", "Perplexity, 120 answers")],
        footer="The Empty Answer",
    ),
    body="""  <p>Most of what we publish counts which firms AI engines recommend. This one counts the answers where an engine recommended nobody. You ask for the best real estate agent in Seattle and the reply is a checklist: interview three agents, read reviews, ask about local experience. Useful advice, and not a single name in it.</p>

  <p><strong>Across 591 answers in 20 US cities, four engines named at least one firm every time. Perplexity named none in 15 of its 120 answers.</strong> Ten of those fifteen were about real estate agents.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents for a home buyer, a property management company, an immigration lawyer, and two questions specific to that city's economy. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered each one on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>Our automatic firm extractor came back empty on 162 of those answers, but it misses bullet lists, so we did not trust it. We read all 162 by hand. An answer counts as "named no firm" only if it gives no firm, brokerage or individual professional at all. Pointing to a ranking list or a directory without naming anyone in it still counts as no firm. We report what the engines wrote. We cannot tell you why they wrote it, and one collection run in July is not a statement about how these engines behave on other days.</p>
  </div>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Named no firm</th><th>Said its results were missing or too thin</th></tr></thead>
    <tbody>
      <tr><td>ChatGPT</td><td>120</td><td>0</td><td>0</td></tr>
      <tr><td>Claude</td><td>120</td><td>0</td><td>0</td></tr>
      <tr><td>Gemini</td><td>120</td><td>0</td><td>0</td></tr>
      <tr><td>Google AI Mode</td><td>111</td><td>0</td><td>0</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>15</td><td>12</td></tr>
    </tbody>
  </table>
  </div>

  <p>The other four engines sometimes hedged. One Gemini answer opened by calling a single best list impossible and subjective, then named five firms anyway. That counts as naming a firm. Only Perplexity left answers with nobody in them.</p>

  <p>Perplexity's answers were also short. They averaged 1,341 characters, against 3,111 for Claude and 8,823 for Google AI Mode. Its fifteen no-name answers averaged 1,149.</p>

  <h2>By question: real estate agents stand out</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question type (Perplexity)</th><th>Answers</th><th>Named no firm</th></tr></thead>
    <tbody>
      <tr><td>Real estate agents</td><td>20</td><td>10</td></tr>
      <tr><td>Immigration lawyer</td><td>20</td><td>2</td></tr>
      <tr><td>City-specific questions</td><td>40</td><td>2</td></tr>
      <tr><td>Personal injury lawyer</td><td>20</td><td>1</td></tr>
      <tr><td>Property management</td><td>20</td><td>0</td></tr>
    </tbody>
  </table>
  </div>

  <p>For a home buyer looking for an agent, Perplexity named no agent and no brokerage in Chicago, Philadelphia, Atlanta, Washington DC, Boston, Seattle, San Diego, Denver, Minneapolis and Baltimore. In the other ten cities it named agents or teams. For property managers it always named companies. The fifteen empty answers fall in 12 of the 20 cities, so this is not one city's quirk.</p>

  <h2>What an empty answer looks like</h2>

  <p>Twelve Perplexity answers said in plain words that its search results were missing or too thin to recommend anyone, along the lines of not having search results to verify which agents are currently best. Nine of those twelve then named no one. The other three named one or two firms while warning that the results were thin.</p>

  <p>The remaining six empty answers declined without saying so. One pointed to a published ranking of law firms without naming a firm from it. One pointed to a city magazine's list of top agents. One listed agent directories. The others gave criteria and questions to ask in an interview.</p>

  <h2>The near misses</h2>

  <p>Three more Perplexity answers came close. Asked for law firms that handle medical device work in Minneapolis, automotive and manufacturing work in Detroit, and home services in Phoenix, it said the results were too limited and then named one or two firms. In the Detroit answer it added that the one firm it found was a poor match for the question. We counted all three as answers that named a firm, so the 15 is the strict number. A looser reading, counting any answer that warned it could not really recommend anyone, would put Perplexity at 18 of 120.</p>

  <p>The contrast with property management is worth noting. Perplexity named companies in all 20 of those answers, and its property management answers were its longest, averaging 1,947 characters. In the same run, the same engine had no trouble naming companies for that question.</p>

  <p>None of these answers is wrong, exactly. The advice is sensible. But for a local firm the result is the same as not being mentioned, and for a buyer it means a second search somewhere else.</p>

  <h2>Why this matters for how you measure</h2>

  <p>If you average visibility across engines, an empty answer looks like a firm that lost. Here it is an engine that did not pick anyone. In all ten cities where Perplexity named no agent, every other engine that answered named agents or brokerages for the same question. That is 38 answers, because Google AI Mode returned no usable answer in two of those cities. A firm checking only Perplexity would conclude it is invisible in its market. A firm checking only ChatGPT would never see the gap.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Read each engine's answer to your buyers' question separately, and record "named no one" as its own result, not as a miss. If you are a real estate agent or brokerage, check Perplexity in particular, because that is where we saw empty answers most often.</p>
    <p>An empty answer is not a verdict on your firm. It tells you that, on that day, the engine did not find enough it trusted to name anyone. This study cannot say what would change that. It can say that four other engines answered the same question with names, so the question itself is not unanswerable.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-108", bid="BG-108", date="2026-11-01", date_label="November 1, 2026", read=6,
    tags=["Original Research", "US Cities", "Reviews"],
    title="How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
    h1="How Often AI Engines <em>Quote Star Ratings</em>",
    h1_plain="How Often AI Engines Quote Star Ratings",
    subtitle="We read 591 AI answers to local buyer questions across 20 US cities and counted every star rating and review count. One answer in three quoted one. For property managers it was two in three, and the ratings quoted were almost all 4.5 or higher.",
    meta_desc="In 591 AI answers across 20 US cities, 186 quoted a star rating or review count. Property management answers did so 66% of the time. 86% of quoted ratings were 4.5 or higher.",
    og_desc="One AI answer in three quoted a star rating or a review count for the firms it named. Property managers two in three, city-specific questions one in eleven. Google AI Mode and Perplexity quoted them most.",
    ld_desc="Original BrandGEO research counting how often ChatGPT, Claude, Gemini, Perplexity and Google AI Mode quoted star ratings and review counts in 591 answers to local professional-services questions across 20 US cities.",
    keywords="do ai engines use google reviews, ai search star ratings, chatgpt google reviews local business, perplexity avvo rating, ai recommendations review count, property management ai search reviews",
    about=["AI Visibility Research", "Local Search", "Online Reviews", "Professional Services"],
    findings=[("186 of 591", "answers quoted a star rating or a review count for a firm they named"),
              ("65 of 99", "property management answers quoted one, against 18 of 198 city-specific answers"),
              ("86%", "of the ratings quoted were 4.5 or higher; 5 of 267 were below 4.0"),
              ("14 of 20", "Perplexity immigration answers quoted a rating, most of them a 5.0 from a lawyer directory")],
    faq=[("Do AI engines mention Google reviews when they recommend a business?",
          "Often, though not always. In 591 answers across 20 US cities, 186 quoted a star rating or a review count. Google was the platform engines tied those numbers to most often, followed by lawyer directories, Zillow and Yelp."),
         ("Which engine quotes ratings most?",
          "Google AI Mode quoted a rating or review count in 57 of its 111 answers and Perplexity in 50 of 120. Gemini did so in 31, ChatGPT in 28 and Claude in 20, each out of 120."),
         ("What ratings do the firms in AI answers have?",
          "Almost all of the ratings engines quoted were high. Of 267 distinct ratings, 229 were 4.5 or higher, 169 were 4.8 or higher and 74 were a perfect 5.0. Only five were below 4.0. We cannot say whether lower-rated firms were left out or simply described without a number."),
         ("Does a better rating get a firm recommended by AI?",
          "This study cannot say. It counts what the engines wrote, not why they picked a firm. It does show that when an engine backs a recommendation with a number, the number is almost always high, and it is usually a Google rating or a directory rating.")],
    related=[("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The same 591 answers, read for the platforms engines name."),
             ("/bg-107.html", "BG-107", "When an AI Engine Names No One: 15 Answers With No Firm in Them",
              "The answers where an engine recommended nobody at all."),
             ("/ai-visibility-for-real-estate.html", "Real estate", "AI Visibility for Real Estate",
              "What these answers mean for an agent, brokerage or property manager.")],
    cta_h="See what AI engines say about your firm",
    cta_p="Run the free audit on your own domain and read how each engine describes you. No signup and no card.",
    og=dict(
        fname="og-bg-108.png",
        kicker="BG-108 · Original Research",
        lines=[[("AI Engines Quote", "w")], [("Star Ratings", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("186 of 591", "answers quoted a rating or review count", "BrandGEO, 20 US cities"),
               ("65 of 99", "property management answers did", "all 5 engines"),
               ("86%", "of quoted ratings were 4.5 or higher", "267 ratings"),
               ("5 of 267", "quoted ratings were below 4.0", "all 5 engines")],
        footer="The Rating in the Answer",
    ),
    body="""  <p>When an AI engine recommends a local firm, it usually says why: years in practice, a specialty, an award. Sometimes the reason is a number. A 4.9 rating from 600 reviews. A perfect 5.0 on a lawyer directory. We wanted to know how often that happens, on which engines, and for which kinds of firms.</p>

  <p><strong>Across 591 answers in 20 US cities, 186 quoted a star rating or a review count for a firm they named.</strong> For property managers the share was two in three. For questions about a city's own economy it was about one in eleven. And the ratings that did appear were almost all high.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents for a home buyer, a property management company, an immigration lawyer, and two questions specific to that city's economy. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered each one on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>We searched the answer text for a star rating (such as 4.8 stars, 4.9/5, 5 out of 5, or a 4.7 Google rating) and for a review count (such as 600 reviews or 1,200+ Google reviews), and read the matches by hand to check the patterns. One Google AI Mode answer was removed because its only match was a hotel class filter in a link title. Our stored copy of a Claude answer stops at about 2,500 characters and of a Google AI Mode answer at 10,000, so a rating quoted late in a long answer can be missed. We did not check whether any quoted rating was correct. We report what the engines wrote, not why they wrote it, and one collection run in July is not a statement about other days.</p>
  </div>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Quoted a star rating</th><th>Quoted a review count</th><th>Either</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>111</td><td>44</td><td>38</td><td>57 (51%)</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>47</td><td>22</td><td>50 (42%)</td></tr>
      <tr><td>Gemini</td><td>120</td><td>25</td><td>17</td><td>31 (26%)</td></tr>
      <tr><td>ChatGPT</td><td>120</td><td>22</td><td>24</td><td>28 (23%)</td></tr>
      <tr><td>Claude</td><td>120</td><td>19</td><td>10</td><td>20 (17%)</td></tr>
      <tr><td><strong>All five</strong></td><td>591</td><td>157</td><td>111</td><td>186 (31%)</td></tr>
    </tbody>
  </table>
  </div>

  <p>Google AI Mode often set the rating out as its own line under each firm, a score followed by a review count. Perplexity quoted a rating more often than a review count, and many of its ratings were a flat 5.0 next to an individual lawyer's listing. Claude, which answered from its own knowledge rather than a live search, quoted numbers least.</p>

  <h2>By question: property managers get rated, city questions do not</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question type</th><th>Answers</th><th>Quoted a rating or review count</th></tr></thead>
    <tbody>
      <tr><td>Property management</td><td>99</td><td>65 (66%)</td></tr>
      <tr><td>Real estate agents</td><td>98</td><td>37 (38%)</td></tr>
      <tr><td>Personal injury lawyer</td><td>98</td><td>33 (34%)</td></tr>
      <tr><td>Immigration lawyer</td><td>98</td><td>33 (34%)</td></tr>
      <tr><td>City-specific questions</td><td>198</td><td>18 (9%)</td></tr>
    </tbody>
  </table>
  </div>

  <p>Property management stands out on every engine. Google AI Mode quoted a rating or review count in 17 of its 19 property management answers, Perplexity in 17 of 20 and ChatGPT in 14 of 20. Even Claude did so in 7 of 20. A landlord choosing a manager gets a score far more often than a buyer choosing a lawyer.</p>

  <p>Immigration lawyers show the biggest gap between engines. Perplexity quoted a rating or review count in 15 of its 20 immigration answers, usually a 5.0 from a lawyer directory listing. ChatGPT did so in 1 of 20. The same question, asked on the same days, came back with a score on one engine and almost never on the other.</p>

  <p>The city-specific questions, about the industries a city is known for, rarely came with ratings at all: 18 of 198 answers. Those answers named firms by what they do, not by what their customers said.</p>

  <h2>The ratings that appear are high</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Rating quoted</th><th>Count</th><th>Share</th></tr></thead>
    <tbody>
      <tr><td>Exactly 5.0</td><td>74</td><td>28%</td></tr>
      <tr><td>4.8 or higher (including 5.0)</td><td>169</td><td>63%</td></tr>
      <tr><td>4.5 or higher (including the above)</td><td>229</td><td>86%</td></tr>
      <tr><td>Below 4.0</td><td>5</td><td>2%</td></tr>
    </tbody>
  </table>
  </div>

  <p>We pulled every distinct rating out of the 145 answers that quoted a numeric score: 267 in all, with a median of 4.8. Only five were below 4.0, and engines did quote them, such as a 3.5 out of 5 from more than 2,500 reviews.</p>

  <p>That does not prove engines leave out lower-rated firms. A firm with a 4.1 may be named without its score. What it does show is that when an engine reaches for a number to back up a recommendation, that number is almost always 4.5 or above.</p>

  <h2>Where the numbers come from</h2>

  <p>Google was the platform engines tied a rating or review count to most often. Lawyer directories came next for legal questions: twelve Perplexity answers tied a rating to Avvo. Real estate answers leaned on Zillow, and property management answers on Google and Yelp. This overlaps with the platforms we counted in <a href="/bg-106.html">BG-106</a>, but here the platform is not just named, it is quoted as a score.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Look up the rating and review count an engine would find for you on Google and, if you are a lawyer, on the main lawyer directories; if you are an agent, on Zillow. If you manage property, treat this as a priority: two in three answers in your category quoted a number.</p>
    <p>This study cannot promise that more reviews get you recommended. It does show that a score is one of the facts engines repeat to buyers when they explain a choice, and that the scores they repeat are high. If yours is out of date or thin, that is the number a buyer may read first.</p>
  </div>""",
))


ARTICLES_DAILY.append(dict(
    slug="bg-109", bid="BG-109", date="2026-11-02", date_label="November 2, 2026", read=6,
    tags=["Original Research", "US Cities", "Local Search"],
    title="How Often AI Engines Give a Street Address or Phone Number for the Firms They Name",
    h1="How Often AI Engines Give <em>an Address or a Phone Number</em>",
    h1_plain="How Often AI Engines Give an Address or a Phone Number",
    subtitle="We read 591 AI answers to local buyer questions across 20 US cities and counted every street address and phone number. Google AI Mode printed an address in 77 of its 111 answers. Gemini printed none. The other three engines rarely did.",
    meta_desc="In 591 AI answers across 20 US cities, 103 gave a street address for a firm. 77 of them came from Google AI Mode. Gemini gave none, ChatGPT gave two, and phone numbers were rare outside Google AI Mode.",
    og_desc="Google AI Mode gave a street address in 69% of its answers to local buyer questions. ChatGPT did in 2 of 120 and Gemini in none. Whether a buyer gets your address from an AI answer depends on the engine they ask.",
    ld_desc="Original BrandGEO research counting street addresses, phone numbers and links in 591 answers from ChatGPT, Claude, Gemini, Perplexity and Google AI Mode to local professional-services questions across 20 US cities.",
    keywords="does ai give business address, ai search phone number local business, google ai mode business address, chatgpt local business contact details, ai recommendations nap, local seo ai engines address",
    about=["AI Visibility Research", "Local Search", "Business Listings", "Professional Services"],
    findings=[("77 of 111", "Google AI Mode answers gave a street address for at least one firm they named"),
              ("0 of 120", "Gemini answers gave a street address; ChatGPT gave one in 2 of 120"),
              ("4 of 4", "phone numbers ChatGPT gave belonged to court, referral or legal aid lines, not to firms"),
              ("35 of 98", "immigration lawyer answers carried an address or a phone number, the highest share of any question")],
    faq=[("Do AI engines give the address of the businesses they recommend?",
          "It depends almost entirely on the engine. In 591 answers across 20 US cities, Google AI Mode gave a street address in 77 of 111 answers. Perplexity did in 10 of 120, Claude in 14, ChatGPT in 2 and Gemini in none."),
         ("Do AI engines give phone numbers for local firms?",
          "Rarely in the answer itself. Claude gave a phone number in 9 of its 120 answers, usually for a named firm, from its own knowledge. ChatGPT gave 4, all for public referral or legal aid lines. Google AI Mode showed numbers in 37 answers, many of them inside the page text it quoted from its sources. Gemini and Perplexity gave none."),
         ("Do AI answers link to the firm's website?",
          "ChatGPT and Google AI Mode put links in almost every answer: 119 of 120 and 111 of 111. Claude did in 7 answers, and Gemini and Perplexity in none of the stored text. Many of the web addresses that did appear belonged to directories, not to the firms."),
         ("Does having a correct address online get a firm recommended by AI?",
          "This study cannot say. It counts what the engines wrote, not why they picked a firm. It does show that on Google AI Mode the address is part of how a firm is presented, so an out of date address is the one a buyer may read.")],
    related=[("/bg-108.html", "BG-108", "How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
              "The same 591 answers, read for ratings and review counts."),
             ("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The platforms engines name when they recommend a firm."),
             ("/ai-visibility-for-real-estate.html", "Real estate", "AI Visibility for Real Estate",
              "What these answers mean for an agent, brokerage or property manager.")],
    cta_h="See what AI engines say about your firm",
    cta_p="Run the free audit on your own domain and read how each engine describes you. No signup and no card.",
    og=dict(
        fname="og-bg-109.png",
        kicker="BG-109 · Original Research",
        lines=[[("Address in the", "w")], [("AI Answer", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("77 of 111", "Google AI Mode answers gave an address", "BrandGEO, 20 US cities"),
               ("0 of 120", "Gemini answers gave one", "same questions"),
               ("2 of 120", "ChatGPT answers gave one", "same questions"),
               ("103 of 591", "answers gave an address overall", "all 5 engines")],
        footer="Where the Buyer Finds You",
    ),
    body="""  <p>A buyer who asks an AI engine for an immigration lawyer or a property manager gets names. Sometimes they also get what they need to act on a name: a street address, a phone number, a link. We wanted to know how often each engine hands over those details, and for which kinds of firms.</p>

  <p><strong>Across 591 answers in 20 US cities, 103 gave a street address for at least one firm they named, and 77 of those 103 came from one engine, Google AI Mode.</strong> Gemini gave no address at all. ChatGPT gave two. Phone numbers were rarer still in the answer text, and the ones ChatGPT gave were public help lines, not firms.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents for a home buyer, a property management company, an immigration lawyer, and two questions specific to that city's economy. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered each one on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>We searched the answer text for a US street address (a house number followed by a street name and a word such as Street, Avenue, Boulevard, Road or Suite) and for a US phone number, and read about a hundred matches by hand. One Gemini match was a newspaper name, not an address, and was removed. Google AI Mode answers often include the page text of the sources they cite, so some of its addresses and many of its phone numbers sit inside that quoted text rather than in the engine's own sentences. Our stored copy of a Claude answer stops at about 2,500 characters and of a Google AI Mode answer at 10,000. We did not check whether any address or number was correct, and we print none of them here. We report what the engines wrote, not why they wrote it, and one collection run in July is not a statement about other days.</p>
  </div>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Gave a street address</th><th>Gave a phone number</th><th>Contained a link</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>111</td><td>77 (69%)</td><td>37</td><td>111</td></tr>
      <tr><td>Claude</td><td>120</td><td>14 (12%)</td><td>9</td><td>7</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>10 (8%)</td><td>0</td><td>0</td></tr>
      <tr><td>ChatGPT</td><td>120</td><td>2 (2%)</td><td>4</td><td>119</td></tr>
      <tr><td>Gemini</td><td>120</td><td>0</td><td>0</td><td>0</td></tr>
      <tr><td><strong>All five</strong></td><td>591</td><td>103 (17%)</td><td>50</td><td>237</td></tr>
    </tbody>
  </table>
  </div>

  <p>Google AI Mode often set out each firm with its own line for the address, sometimes as a map link, and it rarely stopped at one. Its 77 answers with an address held 313 distinct address strings between them, about four per answer. The other four engines together held 35.</p>

  <p>The gap is not about whether an engine searched the web. ChatGPT searched and linked a source in 119 of its 120 answers, yet gave an address in only two. Claude, which answered from its own knowledge with no live search, gave an address in 14 answers and a phone number in 9, usually for a named firm and often on a line of its own under the firm's name. Nobody checked those numbers against the firms, and a phone number recalled from training data can be out of date.</p>

  <h2>The phone numbers ChatGPT gave were not firms</h2>

  <p>ChatGPT gave a phone number in four answers. All four were public lines: a county lawyer referral service listed by a state court guide, a court resource's referral number, a bar association pro bono intake line, and a nonprofit immigration help line listed by a state legal aid office. In those answers ChatGPT pointed the buyer to a service that hands out names, not to a firm.</p>

  <p>Google AI Mode showed a number in 37 answers, but much of that came with the source text it quoted: a firm's office page, an agent's profile, a listing title, and in a few cases a fax line. Gemini and Perplexity gave no phone number in any of their 240 answers.</p>

  <h2>By question: immigration answers carry the most contact details</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question type</th><th>Answers</th><th>Gave an address or phone number</th><th>Google AI Mode answers with an address</th></tr></thead>
    <tbody>
      <tr><td>Immigration lawyer</td><td>98</td><td>35 (36%)</td><td>15 of 18</td></tr>
      <tr><td>Property management</td><td>99</td><td>25 (25%)</td><td>18 of 19</td></tr>
      <tr><td>Personal injury lawyer</td><td>98</td><td>18 (18%)</td><td>13 of 18</td></tr>
      <tr><td>City-specific questions</td><td>198</td><td>29 (15%)</td><td>20 of 38</td></tr>
      <tr><td>Real estate agents</td><td>98</td><td>12 (12%)</td><td>11 of 18</td></tr>
    </tbody>
  </table>
  </div>

  <p>Immigration answers carried an address or phone number most often, on every engine that gave any. Claude gave contact details in 8 of its 20 immigration answers and Perplexity an address in 5. On Google AI Mode, property management came closest to every answer: 18 of 19 gave an address.</p>

  <p>Real estate agents came last. An agent is often presented by brokerage and by profile page rather than by office, and 12 of 98 answers gave an address or a phone number.</p>

  <h2>Websites: the link is usually a directory</h2>

  <p>Links split the engines in two. ChatGPT and Google AI Mode linked in nearly every answer; Gemini and Perplexity linked in none of our stored text. Where Claude, Gemini or Perplexity did write out a web address, it was usually a directory or a listing site rather than the firm's own site. So a buyer reading those three engines often gets a firm's name and the name of a directory, and has to search again to reach the firm.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Check the address and phone number Google shows for your firm, because on Google AI Mode those details are part of how a firm is presented, often in the answer itself. If you have moved office, the old address may be the one a buyer reads first.</p>
    <p>Do not count on the other engines to carry your contact details. On ChatGPT, Gemini and Perplexity the buyer mostly gets your name, and has to find you from there. That makes your name and your directory listings the parts that have to be easy to find. This study cannot promise that a correct address gets you recommended; it shows where the address appears when you are.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-110", bid="BG-110", date="2026-11-03", date_label="November 3, 2026", read=6,
    tags=["Original Research", "US Cities", "Pricing"],
    title="What Fees AI Engines Quote When They Recommend Lawyers, Agents and Property Managers",
    h1="What Fees AI Engines Quote <em>When They Recommend a Firm</em>",
    h1_plain="What Fees AI Engines Quote When They Recommend a Firm",
    subtitle="We read 591 AI answers to local buyer questions across 20 US cities for fees. Engines explain how firms charge far more often than they put a number on it. Property management is the one profession where a percentage shows up regularly.",
    meta_desc="In 591 AI answers across 20 US cities, 64 of 98 personal injury answers mentioned contingency fees but only 3 quoted a percentage. Property management answers quoted a fee in 20 of 99, usually 8 to 12% of rent.",
    og_desc="AI engines tell buyers how lawyers and agents charge, but rarely how much. A fee percentage appeared in 25 of 591 answers, 20 of them about property management. Perplexity quoted none.",
    ld_desc="Original BrandGEO research counting fee mentions and quoted fee percentages in 591 answers from ChatGPT, Claude, Gemini, Perplexity and Google AI Mode to local professional-services questions across 20 US cities.",
    keywords="ai engines quote fees, chatgpt property management fee, ai contingency fee lawyer, ai real estate commission answer, how ai describes pricing, ai recommendations pricing professional services",
    about=["AI Visibility Research", "Pricing", "Professional Services", "Local Search"],
    findings=[("25 of 591", "answers quoted a fee percentage at all, 20 of them about property management"),
              ("64 vs 3", "personal injury answers that mentioned contingency fees, against those that gave a percentage"),
              ("15 of 20", "ChatGPT real estate answers told the buyer to ask how the buyer's agent is paid; no other engine did"),
              ("0", "fee percentages quoted by Perplexity across all 120 of its answers")],
    faq=[("Do AI engines tell buyers what a lawyer or agent charges?",
          "They usually describe how a firm charges, not how much. In 98 personal injury answers across 20 US cities, 64 mentioned contingency fees and 63 a free consultation, but only 3 gave a percentage. Real estate answers mentioned commission in 24 of 98 and gave a rate in 2."),
         ("Which profession do AI engines quote fees for most often?",
          "Property management. 20 of 99 answers quoted a management fee as a percentage of rent, mostly from ChatGPT and Claude. The general ranges quoted were most often 8 to 10% or 8 to 12% of monthly rent."),
         ("Which AI engine quotes fees most often?",
          "ChatGPT and Claude, mainly on property management, with 7 answers each. Gemini quoted a property management fee in 4 answers and Google AI Mode in 2. Perplexity quoted no fee percentage in any of its 120 answers."),
         ("Are the fees AI engines quote correct?",
          "This study did not check. It counts what the engines wrote. Several figures were one company's own rate set against a typical range, so a buyer may read your competitor's price next to your name, or a range that does not match yours.")],
    related=[("/bg-109.html", "BG-109", "How Often AI Engines Give a Street Address or Phone Number for the Firms They Name",
              "The same 591 answers, read for addresses, phone numbers and links."),
             ("/bg-108.html", "BG-108", "How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
              "The same 591 answers, read for ratings and review counts."),
             ("/ai-visibility-for-law-firms.html", "Law firms", "AI Visibility for Law Firms",
              "What these answers mean for a personal injury or immigration practice.")],
    cta_h="See what AI engines say about your firm",
    cta_p="Run the free audit on your own domain and read how each engine describes you. No signup and no card.",
    og=dict(
        fname="og-bg-110.png",
        kicker="BG-110 · Original Research",
        lines=[[("Fees in the", "w")], [("AI Answer", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("25 of 591", "answers quoted a fee percentage", "BrandGEO, 20 US cities"),
               ("20 of 99", "property management answers did", "same questions"),
               ("3 of 98", "personal injury answers did", "same questions"),
               ("0 of 120", "Perplexity answers did", "all 5 question types"),],
        footer="How Much, or Only How",
    ),
    body="""  <p>Price is one of the first things a buyer wants to know, and one of the last things a firm puts on its website. So when a buyer asks an AI engine for a personal injury lawyer or a property manager, what does the answer say about money? We read the same 591 answers from our 20 city study for fees.</p>

  <p><strong>The engines explain how firms charge far more often than they say how much.</strong> 64 of 98 personal injury answers mentioned contingency fees, and 3 gave a percentage. Across all 591 answers, 25 quoted a fee percentage, and 20 of those were about property management, the one profession where a number shows up regularly. Perplexity quoted none.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents for a home buyer, a property management company, an immigration lawyer, and two questions specific to that city's economy. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered each one on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>We searched the answer text for fee words (contingency, commission, management fee, leasing fee, flat fee, free consultation) and for percentages near them, then read every percentage match by hand and dropped the ones that were not fees, such as a rent collection rate or a share of happy clients. We did not check whether any fee was correct, and we name no firm. Google AI Mode answers include page text from the sources they cite, and our stored copy of a Claude answer stops at about 2,500 characters. We report what the engines wrote, not why, and one collection run in July is not a statement about other days.</p>
  </div>

  <h2>Personal injury: the model, almost never the rate</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Mentioned contingency</th><th>Free consultation</th><th>No win, no fee wording</th><th>Gave a percentage</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>18</td><td>16</td><td>14</td><td>11</td><td>0</td></tr>
      <tr><td>Claude</td><td>20</td><td>14</td><td>16</td><td>7</td><td>2</td></tr>
      <tr><td>Gemini</td><td>20</td><td>13</td><td>20</td><td>6</td><td>0</td></tr>
      <tr><td>ChatGPT</td><td>20</td><td>13</td><td>9</td><td>0</td><td>1</td></tr>
      <tr><td>Perplexity</td><td>20</td><td>8</td><td>4</td><td>0</td><td>0</td></tr>
      <tr><td><strong>All five</strong></td><td>98</td><td>64 (65%)</td><td>63 (64%)</td><td>24</td><td>3</td></tr>
    </tbody>
  </table>
  </div>

  <p>Two thirds of the answers told the buyer that an injury lawyer is paid out of the settlement, and Gemini mentioned a free consultation in all 20. The rate itself came up three times. ChatGPT gave a general range of about a third to 40%. Claude, twice, set one firm's discounted rate against a standard of about a third. What the answers did quote, often and in dollars, was what firms had won for clients: settlement and verdict totals in the millions and billions.</p>

  <h2>Property management: the one place numbers appear</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Quoted a management fee percentage</th><th>Mentioned a leasing or placement fee</th><th>Mentioned a flat fee</th></tr></thead>
    <tbody>
      <tr><td>ChatGPT</td><td>20</td><td>7</td><td>19</td><td>6</td></tr>
      <tr><td>Claude</td><td>20</td><td>7</td><td>1</td><td>6</td></tr>
      <tr><td>Gemini</td><td>20</td><td>4</td><td>5</td><td>8</td></tr>
      <tr><td>Google AI Mode</td><td>19</td><td>2</td><td>3</td><td>8</td></tr>
      <tr><td>Perplexity</td><td>20</td><td>0</td><td>0</td><td>2</td></tr>
      <tr><td><strong>All five</strong></td><td>99</td><td>20 (20%)</td><td>28</td><td>30</td></tr>
    </tbody>
  </table>
  </div>

  <p>The general ranges were close to each other: 8 to 10% of monthly rent in several ChatGPT answers, 8 to 12% in ChatGPT and Claude, 7 to 12% and 4 to 10% in Gemini, 6 to 12% or a flat monthly amount in Google AI Mode. Single company rates ran from 5% to 12.9%. ChatGPT also built a fee checklist into almost every answer: in 19 of 20 it warned about a leasing or placement fee, often put at half to a full month's rent, and in several it asked about a markup on repairs.</p>

  <p>So a landlord asking for a property manager often gets a price frame before any company name, and sometimes a named company's rate beside a typical range. If your rate is in that answer, the buyer compares it there.</p>

  <h2>Real estate: a question to ask, not a rate</h2>

  <p>Real estate answers mentioned commission in 24 of 98, and only 2 gave a percentage. What stood out was ChatGPT: in 15 of its 20 answers it told the buyer to ask how the buyer's agent is paid, or what compensation agreement the agent uses, and several of those answers said the rules on buyer agent pay had changed nationally. No other engine raised the question. Claude used the word commission to say that agents work on commission, so time in the business tells you something.</p>

  <h2>Immigration: flat fee or hourly</h2>

  <p>No immigration answer quoted a percentage, which fits how that work is billed. 23 of 98 answers raised flat fee or hourly billing, 15 of them from ChatGPT, nearly always as a question for the buyer to put to the lawyer. 13 mentioned a free consultation and 4 a paid one; Google AI Mode gave a consultation price in dollars in 2. The city-specific questions brought no fee percentage at all.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you manage property, assume the buyer reads a fee range in the AI answer before reading your name, and make your own fee easy to find and easy to compare. If you are a lawyer or an agent, the answers mostly hand the buyer questions to ask about money. Answer those questions on your site in plain words: how you are paid, whether the first meeting is free, what a flat fee covers.</p>
    <p>This study cannot say that publishing a price gets you recommended. It shows what the buyer is told about money when you are, and which engine says it.</p>
  </div>""",
))
