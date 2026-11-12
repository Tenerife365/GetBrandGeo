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

ARTICLES_DAILY.append(dict(
    slug="bg-111", bid="BG-111", date="2026-11-04", date_label="November 4, 2026", read=6,
    tags=["Original Research", "US Cities", "Engine Behavior"],
    title="How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
    h1="How Often AI Engines Tell Buyers <em>to Check a Firm First</em>",
    h1_plain="How Often AI Engines Tell Buyers to Check a Firm First",
    subtitle="We read 591 AI answers to local buyer questions across 20 US cities for advice on vetting the firms they name. ChatGPT gave that advice in 83 of its 120 answers. Google AI Mode gave it in 8.",
    meta_desc="In 591 AI answers across 20 US cities, ChatGPT told the buyer to verify a license, read reviews, interview several firms or ask set questions in 83 of 120 answers. Claude did in 16, Perplexity in 9, Google AI Mode in 8.",
    og_desc="AI engines differ sharply on whether they tell buyers to vet the firms they recommend. ChatGPT did in 69% of answers, Google AI Mode in 7%. ChatGPT wrote 30 of the 39 answers that said to check a license or bar record.",
    ld_desc="Original BrandGEO research counting buyer due-diligence advice (license checks, review checks, interviewing several firms, questions to ask) in 591 answers from ChatGPT, Claude, Gemini, Perplexity and Google AI Mode to local professional-services questions across 20 US cities.",
    keywords="ai engines due diligence advice, chatgpt verify lawyer license, ai recommendations check reviews, ai interview several agents, how ai engines hedge recommendations, ai answer buyer advice",
    about=["AI Visibility Research", "Engine Behavior", "Professional Services", "Local Search"],
    findings=[("83 of 120", "ChatGPT answers told the buyer how to vet the firms it named"),
              ("8 of 111", "Google AI Mode answers did the same"),
              ("30 of 39", "answers that said to check a license or bar record came from ChatGPT"),
              ("21", "Gemini answers told the buyer to interview several firms or agents")],
    faq=[("Do AI engines tell buyers to check a firm before hiring it?",
          "Some do, much more than others. Across 591 answers in 20 US cities, 145 gave the buyer at least one vetting step: check a license or bar record, read reviews, interview several firms, or ask a set of questions. ChatGPT gave one in 83 of its 120 answers, Google AI Mode in 8 of 111."),
         ("Which AI engine is most likely to tell a buyer to verify a license?",
          "ChatGPT. 39 answers told the buyer to check a license, bar status, discipline record or credential, and 30 of them were ChatGPT answers. Immigration questions drew the most of these, 18 of the 39."),
         ("What vetting advice does Gemini give?",
          "Mostly to interview more than one professional before choosing. 21 Gemini answers said so, often as interview 2 to 3 agents, and 14 told the buyer to check reviews. Gemini rarely listed questions to ask, 3 answers out of 120."),
         ("Does this advice affect which firms get recommended?",
          "This study cannot say. It counts what the engines wrote around the firms they named. It shows that a buyer reading a ChatGPT answer is often told to check your license, your reviews and your answers to set questions before calling you.")],
    related=[("/bg-110.html", "BG-110", "What Fees AI Engines Quote When They Recommend Lawyers, Agents and Property Managers",
              "The same 591 answers, read for fees and fee percentages."),
             ("/bg-108.html", "BG-108", "How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
              "The same 591 answers, read for ratings and review counts."),
             ("/bg-107.html", "BG-107", "When an AI Engine Names No One: 15 Answers With No Firm in Them",
              "The answers that gave the buyer advice instead of names.")],
    cta_h="See what AI engines say about your firm",
    cta_p="Run the free audit on your own domain and read how each engine describes you. No signup and no card.",
    og=dict(
        fname="og-bg-111.png",
        kicker="BG-111 · Original Research",
        lines=[[("Check Them", "w")], [("First", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("83 of 120", "ChatGPT answers gave vetting advice", "BrandGEO, 20 US cities"),
               ("29 of 120", "Gemini answers did", "same questions"),
               ("16 of 120", "Claude answers did", "same questions"),
               ("8 of 111", "Google AI Mode answers did", "same questions"),],
        footer="Advice Around the Names",
    ),
    body="""  <p>An AI answer to "who is the best immigration lawyer in my city" does two things. It names firms, and sometimes it tells the buyer what to do before calling any of them: check the license, read the reviews, talk to more than one. That second part is advice about you, written next to your name. We read the same 591 answers from our 20 city study for it.</p>

  <p><strong>The engines split sharply.</strong> ChatGPT gave the buyer at least one vetting step in 83 of its 120 answers (69%). Gemini did in 29, Claude in 16, Perplexity in 9 and Google AI Mode in 8 of 111. ChatGPT wrote 30 of the 39 answers that told the buyer to check a license or bar record.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents for a home buyer, a property management company, an immigration lawyer, and two questions specific to that city's economy. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered each one on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>We searched the answer text for four kinds of advice aimed at the buyer: check a license, bar record, discipline history or credential; check or read reviews or references; interview or compare two, three or several firms; and ask the firm set questions. We read samples of every kind by hand and tightened the patterns until descriptive uses ("verified reviews") and phone numbers dropped out. Some false matches remain, mostly where Google AI Mode answers include text from the pages they cite, such as a firm's own "read our reviews". Our stored copy of a Claude answer stops at about 2,500 characters, so advice at the end of a long Claude answer is missed. We report what the engines wrote, not why, and one collection run in July is not a statement about other days.</p>
  </div>

  <h2>Who tells the buyer to check</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Check a license or bar record</th><th>Check reviews</th><th>Interview several</th><th>Questions to ask</th><th>Any of these</th></tr></thead>
    <tbody>
      <tr><td>ChatGPT</td><td>120</td><td>30</td><td>16</td><td>30</td><td>66</td><td>83 (69%)</td></tr>
      <tr><td>Gemini</td><td>120</td><td>4</td><td>14</td><td>21</td><td>3</td><td>29 (24%)</td></tr>
      <tr><td>Claude</td><td>120</td><td>1</td><td>7</td><td>2</td><td>8</td><td>16 (13%)</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>2</td><td>1</td><td>2</td><td>7</td><td>9 (8%)</td></tr>
      <tr><td>Google AI Mode</td><td>111</td><td>2</td><td>3</td><td>3</td><td>3</td><td>8 (7%)</td></tr>
      <tr><td><strong>All five</strong></td><td>591</td><td>39</td><td>41</td><td>58</td><td>87</td><td>145 (25%)</td></tr>
    </tbody>
  </table>
  </div>

  <p>ChatGPT's typical answer ends with a short checklist. It tells the buyer to ask each lawyer whether they have handled this exact type of case, to ask each property manager for the management fee, leasing fee and repair markup, and to ask each agent how many buyer transactions they closed last year. In 66 of its 120 answers it gave questions like these. In 30 it told the buyer to verify a license or discipline record with the state bar or the licensing board. 14 answers across all engines combined three or more of the four kinds of advice, and 8 of those were ChatGPT.</p>

  <p>Gemini's advice is narrower. Its most common line is to interview two or three agents before choosing, which it wrote in 21 answers, most of them about real estate. It told the buyer to check reviews in 14. It almost never listed questions to ask.</p>

  <p>Claude, Perplexity and Google AI Mode mostly name firms and stop. When Claude adds advice, it is usually to check reviews on Google, Yelp or Avvo, or to book free consultations. Perplexity's advice often comes in a different setting: in 19 of its answers it said it had no search results to work from, and some of those offered questions to ask in place of names, the pattern we covered in BG-107.</p>

  <h2>By profession</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Answers</th><th>Any vetting advice</th><th>Check a license or bar record</th><th>ChatGPT answers with advice</th></tr></thead>
    <tbody>
      <tr><td>Real estate agents</td><td>98</td><td>53</td><td>3</td><td>19 of 20</td></tr>
      <tr><td>Property management</td><td>99</td><td>27</td><td>5</td><td>19 of 20</td></tr>
      <tr><td>Immigration lawyer</td><td>98</td><td>25</td><td>18</td><td>18 of 20</td></tr>
      <tr><td>Personal injury lawyer</td><td>98</td><td>24</td><td>9</td><td>14 of 20</td></tr>
      <tr><td>City-specific questions</td><td>198</td><td>16</td><td>4</td><td>13 of 40</td></tr>
    </tbody>
  </table>
  </div>

  <p>Real estate drew the most advice, because Gemini added its "interview two or three agents" line there as well as ChatGPT's checklist. Immigration drew the most license checks: 18 of the 39 answers that told the buyer to verify a license or bar record were about immigration lawyers. On the four professional questions, ChatGPT gave vetting advice in 70 of its 80 answers. On the city-specific questions, where the buyer asked about a local business sector, every engine gave less.</p>

  <h2>What the buyer reads next to your name</h2>

  <p>When ChatGPT names your firm, the same answer often tells the buyer to look up your license, read your recent reviews and put a list of questions to you before deciding. When Google AI Mode names your firm, the buyer usually gets names and descriptions and nothing more. The same firm can be presented as a finished recommendation in one engine and as a candidate to check in another.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Make the checks the answers suggest easy to pass. Keep your license or bar number and your admission details on your site where a buyer can find them. Keep recent reviews on the profiles buyers are sent to. And answer the usual checklist questions in plain words on your site: what cases you handle, how many transactions you closed last year, what you charge for leasing and repairs.</p>
    <p>This study cannot say that doing so gets you recommended. It shows what a buyer is told to check after an engine names you, and which engine tells them.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-112", bid="BG-112", date="2026-11-05", date_label="November 5, 2026", read=6,
    tags=["Original Research", "US Cities", "Engine Behavior"],
    title="The Facts AI Engines Attach to the Local Firms They Recommend",
    h1="The <em>Facts AI Engines Attach</em> to the Local Firms They Recommend",
    h1_plain="The Facts AI Engines Attach to the Local Firms They Recommend",
    subtitle="We read 591 AI answers to local buyer questions across 20 US cities for the plain facts written next to firm names. Years in business came up in 269 of them. Each profession had its own kind of proof, and Perplexity gave almost none.",
    meta_desc="In 591 AI answers across 20 US cities, 269 said how long a firm has operated. Injury firms were described in dollars recovered, agents in sales counts. Claude stated such facts in 96 of 120 answers, Perplexity in 9.",
    og_desc="AI engines back local recommendations with plain facts: years in business in 269 of 591 answers, dollars recovered for injury firms, sales counts for agents, ownership for property managers. Perplexity gave almost none.",
    ld_desc="Original BrandGEO research counting the firm facts (years in business, founding year, dollar track record, sales and unit counts, board certification, ownership) that ChatGPT, Claude, Gemini, Perplexity and Google AI Mode wrote next to the firms they named in 591 answers to local professional-services questions across 20 US cities.",
    keywords="what ai engines say about law firms, ai recommendations years of experience, chatgpt lawyer credentials, board certified lawyer ai search, ai real estate agent sales record, how ai describes local businesses, ai visibility firm facts",
    about=["AI Visibility Research", "Engine Behavior", "Professional Services", "Local Search"],
    findings=[("269 of 591", "answers said how long a firm has operated, as a number of years or a founding year"),
              ("51 of 98", "personal injury answers quoted a dollar figure for verdicts, settlements or money recovered"),
              ("46 of 98", "real estate answers quoted a count of sales, transactions or clients"),
              ("96 vs 9", "Claude answers with at least one such fact against Perplexity answers, out of 120 each")],
    faq=[("What facts do AI engines give about the firms they recommend?",
          "Mostly how long the firm has been around. Across 591 answers in 20 US cities, 329 stated at least one plain fact about a firm: 269 gave years of experience or a founding year, 145 a track record in dollars or counts, 58 who owns the firm, and 42 a board certification."),
         ("Which credentials do AI engines mention for lawyers?",
          "For personal injury lawyers, money: 51 of 98 answers quoted verdicts, settlements or a total recovered, and 29 of those included a figure in the billions. For immigration lawyers, 53 of 98 answers gave years of practice or a founding year, 24 said board certified and 6 mentioned a former judge, prosecutor or officer on the team."),
         ("What do AI engines say about real estate agents and property managers?",
          "Agents are described in counts: 46 of 98 answers quoted sales, transactions or clients helped, 32 quoted sales volume in dollars and 25 used a top 1% style claim. Property managers are described by tenure (55 of 99 answers), ownership such as family owned or locally owned (32) and the number of units or doors they manage (28)."),
         ("Does publishing these facts make AI engines recommend my firm?",
          "This study cannot say. It counts what the engines wrote next to the firms they named, not why those firms were picked, and we did not check whether the facts were true. It shows which kind of fact an engine repeats in your category, and which engines repeat one at all.")],
    related=[("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The same 591 answers, read for directory badges and review sites."),
             ("/bg-108.html", "BG-108", "How Often AI Engines Quote Star Ratings When They Recommend Local Firms",
              "The same 591 answers, read for ratings and review counts."),
             ("/bg-111.html", "BG-111", "How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
              "The advice engines give the buyer around the names.")],
    cta_h="See which facts AI engines repeat about your firm",
    cta_p="Run the free audit on your own domain and read how each engine describes you. No signup and no card.",
    og=dict(
        fname="og-bg-112.png",
        kicker="BG-112 · Original Research",
        lines=[[("The Proof", "w")], [("Engines Give", "g")]],
        sub=["591 answers to local buyer questions,",
             "20 US cities, 5 engines."],
        stats=[("269", "answers said how long a firm has operated", "of 591, BrandGEO"),
               ("51 of 98", "injury answers quoted dollars recovered", "98 answers, 5 engines"),
               ("46 of 98", "agent answers quoted sales counts", "98 answers, 5 engines"),
               ("96 vs 9", "Claude vs Perplexity answers with a fact", "120 answers each"),],
        footer="What Backs the Names",
    ),
    body="""  <p>When an AI engine recommends a personal injury firm or a property manager, it usually writes something next to the name to back the pick. Sometimes that is a directory badge, which we counted in BG-106, or a star rating, which we counted in BG-108. Often it is a plain fact about the firm: how long it has been open, how much money it has recovered, how many homes it has sold. We read the same 591 answers from our 20 city study for those facts.</p>

  <p><strong>329 of the 591 answers (56%) stated at least one.</strong> How long a firm has operated came up in 269 answers, more than any other kind of fact we counted. After that, each profession had its own kind of proof. The engines differed even more than the professions did: Claude stated a fact in 96 of its 120 answers, Perplexity in 9.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six local buyer questions in each of 20 US cities: a personal injury lawyer, real estate agents for a home buyer, a property management company, an immigration lawyer, and two questions specific to that city's economy. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered each one on July 24 and 25, 2026, and 591 answers came back usable.</p>
    <p>We searched the answer text for five kinds of fact: tenure (a number of years, or a founding year), track record (a dollar figure in millions or billions tied to verdicts, settlements or sales, or a count of sales, transactions, units, cases or clients), board certification, ownership (family, locally, veteran, woman or minority owned) and a former judge, prosecutor or officer on the team. We read about 250 matched passages by hand and tightened the patterns until award streaks ("five years in a row"), filing deadlines, home price ranges and lobbying revenue dropped out. Some false matches remain, and vaguer wording such as "decades of experience" is not counted. Our stored copy of a Claude answer is cut short, at under 3,800 characters, so facts late in a long Claude answer are missed. We count what the engines wrote. We did not check whether any of it is true, and we cannot say why an engine picked a firm.</p>
  </div>

  <h2>What gets written next to a name</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Kind of fact</th><th>Answers (of 591)</th><th>Where it showed up</th></tr></thead>
    <tbody>
      <tr><td>Tenure: years of experience or a founding year</td><td>269</td><td>All five question types, all 20 cities</td></tr>
      <tr><td>Track record in numbers: dollars or counts</td><td>145</td><td>Real estate 54, personal injury 53</td></tr>
      <tr><td>Ownership: family, locally, veteran or woman owned</td><td>58</td><td>Property management 32</td></tr>
      <tr><td>Board certification</td><td>42</td><td>Immigration 24, personal injury 14</td></tr>
      <tr><td>A former judge, prosecutor or officer on the team</td><td>11</td><td>Immigration 6</td></tr>
      <tr><td><strong>Any of these</strong></td><td>329</td><td>56% of answers</td></tr>
    </tbody>
  </table>
  </div>

  <p>Tenure came in two forms. 239 answers gave a number of years, such as "over 30 years of experience", and 110 gave a founding year, with some answers doing both. The numbers are large: the median figure quoted was 30 years, and only 9 of the 458 figures we found were under 10. 48 answers quoted combined or collective years, where a firm adds up the careers of its people. 28 answers quoted a figure of 100 years or more, and 22 of those used the word combined or collective.</p>

  <h2>Each profession has its own proof</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Answers</th><th>Tenure</th><th>Dollar figure</th><th>Count of sales, units or cases</th><th>Board certified</th><th>Ownership</th><th>Any fact</th></tr></thead>
    <tbody>
      <tr><td>Personal injury lawyer</td><td>98</td><td>58</td><td>51</td><td>14</td><td>14</td><td>4</td><td>67</td></tr>
      <tr><td>Real estate agents</td><td>98</td><td>40</td><td>32</td><td>46</td><td>1</td><td>5</td><td>63</td></tr>
      <tr><td>Property management</td><td>99</td><td>55</td><td>0</td><td>28</td><td>0</td><td>32</td><td>67</td></tr>
      <tr><td>Immigration lawyer</td><td>98</td><td>53</td><td>0</td><td>1</td><td>24</td><td>3</td><td>59</td></tr>
      <tr><td>City-specific questions</td><td>198</td><td>63</td><td>5</td><td>4</td><td>3</td><td>14</td><td>73</td></tr>
    </tbody>
  </table>
  </div>

  <p><strong>Personal injury firms are described in dollars.</strong> 51 of 98 answers quoted a verdict, a settlement or a total recovered for clients, and 29 of those included a figure in the billions. Claude did this in 18 of its 20 personal injury answers, Google AI Mode in 15 of 18 and Gemini in 13 of 20. ChatGPT did in 3 and Perplexity in 2.</p>

  <p><strong>Real estate agents are described in counts.</strong> 46 of 98 answers quoted a count of sales, transactions, homes sold or clients helped, and 32 quoted sales volume in dollars. 25 used a "top 1%" style claim, 12 of them Claude answers.</p>

  <p><strong>Property managers are described by who they are.</strong> 55 of 99 answers gave tenure, 32 gave ownership (family owned in 17, locally owned in 13, veteran owned in 5) and 28 gave the number of units, doors or properties under management. None quoted a dollar track record.</p>

  <p><strong>Immigration lawyers are described by qualification.</strong> 53 of 98 answers gave years of practice or a founding year, 24 said board certified, and 6 mentioned a former judge, prosecutor or immigration officer on the team. No answer quoted dollars and one quoted a case count.</p>

  <h2>Board certification showed up in nine cities</h2>

  <p>All 42 answers that described a lawyer or firm as board certified came from 9 of the 20 cities, and 33 of them from the five Texas and Florida cities in the study: Houston, Dallas, San Antonio, Miami and Tampa. 13 of those answers also named the Texas Board of Legal Specialization and 8 named The Florida Bar. In the other 11 cities no answer described a lawyer that way.</p>

  <h2>The award names we looked for were rare</h2>

  <p>We also searched for four award names. An AV rating from Martindale appeared in 20 answers, a "Top 100" list of some kind in 21, the Million Dollar Advocates Forum in 8 and the Inc. 5000 in 2. Together, 45 answers named at least one of the four, against 269 that stated tenure, and only 7 answers carried one of these awards with no plain fact beside it. Directory recognitions are a separate matter: Super Lawyers alone appeared in 125 answers, as we reported in BG-106.</p>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Tenure</th><th>Track record</th><th>Any fact</th><th>Two or more kinds</th></tr></thead>
    <tbody>
      <tr><td>Claude</td><td>120</td><td>80</td><td>46</td><td>96 (80%)</td><td>45</td></tr>
      <tr><td>Google AI Mode</td><td>111</td><td>73</td><td>37</td><td>87 (78%)</td><td>46</td></tr>
      <tr><td>Gemini</td><td>120</td><td>84</td><td>40</td><td>89 (74%)</td><td>53</td></tr>
      <tr><td>ChatGPT</td><td>120</td><td>26</td><td>19</td><td>48 (40%)</td><td>17</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>6</td><td>3</td><td>9 (8%)</td><td>1</td></tr>
    </tbody>
  </table>
  </div>

  <p>Claude, Google AI Mode and Gemini stated at least one fact in about three answers out of four. On the four professional questions the counts were higher: Claude in 75 of 80 answers, Gemini in 71 of 80 and Google AI Mode in 63 of 73, against 38 of 80 for ChatGPT and 9 of 80 for Perplexity.</p>

  <p>ChatGPT did in 48 of its 120 answers, although its stored answers were longer than Claude's or Gemini's (a median near 4,700 characters against about 3,100 and 3,200). In BG-111 it was the engine that most often told the buyer how to vet a firm, in 83 of 120 answers.</p>

  <p>Perplexity stated a fact in 9 answers, and in none of its 40 answers to the city-specific questions. Its answers were the shortest we stored, a median near 1,300 characters. In 19 of them it said it had no search results to work from.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>State your own facts in plain words where they are easy to find: the year you opened, the years your people have practiced, and the numbers your profession is described by. For an injury firm that is money recovered. For an agent it is homes sold, and over what period. For a property manager it is units under management and who owns the company. For an immigration lawyer it is board certification, where your state offers it.</p>
    <p>Keep the same numbers on your directory and portal profiles. In BG-106, 390 of these 591 answers named a third-party platform. This study cannot say that publishing these facts gets you recommended. It shows what kind of fact an engine writes next to a firm's name in your category, and which engines write one at all.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-113", bid="BG-113", date="2026-11-06", date_label="November 6, 2026", read=6,
    tags=["Original Research", "US Cities", "Property Management"],
    title="How Often AI Engines Put a National Brand Next to Local Property Managers",
    h1="How Often AI Engines Put a <em>National Brand</em> Next to Local Property Managers",
    h1_plain="How Often AI Engines Put a National Brand Next to Local Property Managers",
    subtitle="We read 99 AI answers to property management questions in 20 US cities. 63 of them named at least one national brand next to the local firms. One franchise name accounted for most of it.",
    meta_desc="In 99 AI answers about property managers in 20 US cities, 63 named a national brand. Real Property Management came up in 42, Mynd and Evernest in 17 each. Perplexity named one in 15 of 20 answers, ChatGPT in 10.",
    og_desc="63 of 99 AI answers about property managers named a national brand next to the local firms. Real Property Management alone came up in 42. Perplexity did it in 15 of 20 answers, ChatGPT in 10.",
    ld_desc="Original BrandGEO research counting how often ChatGPT, Claude, Gemini, Perplexity and Google AI Mode named a national property management brand (Real Property Management, Mynd, Evernest, FirstService, Greystar, Associa, Renters Warehouse) in 99 answers to a property management question across 20 US cities.",
    keywords="ai property management recommendations, chatgpt property manager national brand, local property management ai search, real property management ai visibility, mynd evernest ai answers, local vs national property manager ai",
    about=["AI Visibility Research", "Property Management", "Local Search", "Engine Behavior"],
    findings=[("63 of 99", "property management answers named at least one national brand next to the local firms"),
              ("42 of 99", "named Real Property Management, the most common brand by a wide margin"),
              ("17 of 20", "cities had at least one answer naming a national brand; 3 cities had none"),
              ("15 vs 10", "Perplexity answers against ChatGPT answers naming one, out of 20 each")],
    faq=[("Do AI engines recommend national property management brands or local ones?",
          "Both, in the same answer. Of 99 answers to a property management question across 20 US cities, 63 named at least one national brand from our list, and 36 named none. Most answers still named local firms beside the brand."),
         ("Which national property management brand do AI engines name most?",
          "Real Property Management, a franchise name that is usually followed by a city, appeared in 42 of 99 answers. Mynd and Evernest each appeared in 17, FirstService in 6, Greystar in 3, Renters Warehouse in 2 and Associa in 1."),
         ("Does every engine name national property managers equally?",
          "No. Perplexity named one in 15 of 20 answers, Gemini and Google AI Mode in 13 of 20 and 13 of 19, Claude in 12 of 20 and ChatGPT in 10 of 20. With about 20 answers per engine, treat gaps of a few answers as small."),
         ("Does this study show why an engine names a national brand?",
          "No. It counts what the engines wrote. It does not show why a brand was picked, whether it is a ranking factor, or whether the brand has a real office in that city.")],
    related=[("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The same answers, read for directory and review sites."),
             ("/bg-110.html", "BG-110", "What Fees AI Engines Quote When They Recommend Lawyers, Agents and Property Managers",
              "The fees engines quoted for property management."),
             ("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "Ownership, tenure and units managed, from the same answers.")],
    cta_h="See whether AI engines name you or a national brand",
    cta_p="Run the free audit on your own domain and read which firms each engine puts next to yours. No signup and no card.",
    og=dict(
        fname="og-bg-113.png",
        kicker="BG-113 · Original Research",
        lines=[[("National Brands", "w")], [("Beside Local Firms", "g")]],
        sub=["99 property management answers,",
             "20 US cities, 5 engines."],
        stats=[("63 of 99", "answers named a national brand", "BrandGEO, July 2026"),
               ("42", "named Real Property Management", "of 99 answers"),
               ("17 of 20", "cities had at least one such answer", "3 cities had none"),
               ("15 vs 10", "Perplexity vs ChatGPT, answers with one", "20 answers each"),],
        footer="Local Firm or National Name",
    ),
    body="""  <p>Ask an AI engine for the best property management company in your city and you get a short list. We wanted to know how many of those lists put a national brand next to the local firms. A landlord comparing the list sees one set of names. A local manager reading it learns whether the competition includes a franchise with a marketing budget.</p>

  <p><strong>63 of 99 answers (64%) named at least one national brand.</strong> 36 named none from our list. The count is dominated by one name: Real Property Management, a franchise whose offices carry a city after the brand, appeared in 42 answers. The next two brands appeared in 17 answers each.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked one property management question in each of 20 US cities, and ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered it on July 24 and 25, 2026. 99 usable answers came back (one Google AI Mode answer was not usable). We searched the answer text, with links removed, for seven national names: Real Property Management, Mynd, Evernest, FirstService, Greystar, Associa and Renters Warehouse. We also looked for Invitation Homes and Progress Residential and found neither.</p>
    <p>We read 45 matched passages by hand. Two hits were false and are removed: a truncated name that only looked like Associa, and an answer that mentioned Belong only as a site that publishes roundups. Belong is a rental management company that also publishes lists, so it is left out of every count here. The list is ours and short. Other national or regional operators exist and are not counted, so the real share is higher. Stored Claude answers are cut at under 3,800 characters and Google AI Mode answers at 10,000, so brands late in a long answer are missed. We count what the engines wrote. We did not check whether a brand has an office in the city, and we cannot say why an engine named it.</p>
  </div>

  <h2>Which brands came up</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Brand</th><th>Answers (of 99)</th></tr></thead>
    <tbody>
      <tr><td>Real Property Management</td><td>42</td></tr>
      <tr><td>Mynd</td><td>17</td></tr>
      <tr><td>Evernest</td><td>17</td></tr>
      <tr><td>FirstService</td><td>6</td></tr>
      <tr><td>Greystar</td><td>3</td></tr>
      <tr><td>Renters Warehouse</td><td>2</td></tr>
      <tr><td>Associa</td><td>1</td></tr>
      <tr><td><strong>At least one of these</strong></td><td>63</td></tr>
    </tbody>
  </table>
  </div>

  <p>Most answers that named a national brand named only one: 42 named one brand, 17 named two and 4 named three. In the 20 passages we read for the three biggest names, each one recommended the brand as a manager, not as a passing word. The wording was often a city office, such as the franchise name followed by a city or a metro area.</p>

  <p>Two of the smaller names came with a different job. Where ChatGPT named FirstService or Greystar, it described them as large operators for condo towers, associations and apartment buildings. A landlord with a single rental house was not necessarily being pointed to them.</p>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Named a national brand</th><th>Real Property Management</th><th>Mynd</th><th>Evernest</th></tr></thead>
    <tbody>
      <tr><td>Perplexity</td><td>20</td><td>15</td><td>12</td><td>1</td><td>5</td></tr>
      <tr><td>Gemini</td><td>20</td><td>13</td><td>9</td><td>7</td><td>5</td></tr>
      <tr><td>Google AI Mode</td><td>19</td><td>13</td><td>10</td><td>4</td><td>3</td></tr>
      <tr><td>Claude</td><td>20</td><td>12</td><td>4</td><td>4</td><td>2</td></tr>
      <tr><td>ChatGPT</td><td>20</td><td>10</td><td>7</td><td>1</td><td>2</td></tr>
    </tbody>
  </table>
  </div>

  <p>The spread between engines is five answers, from 10 of 20 to 15 of 20. With about 20 answers per engine that is a small gap, and we would not build a plan on it. The brand mix is clearer. Perplexity leaned on the franchise name (12 answers) and rarely named Mynd (1). Gemini spread its picks, with Mynd in 7 answers, more than any other engine. Claude named the franchise in 4 answers, fewer than the others.</p>

  <h2>The 36 answers with none of the seven</h2>

  <p>36 answers named none of our seven brands: ChatGPT 10, Claude 8, Gemini 7, Google AI Mode 6 and Perplexity 5. These are not necessarily all local lists. Our brand list is short, so an answer in this group may still name a regional or national operator we did not search for. What we can say is that in these 36 answers, none of the seven names we counted came up, and that a local firm competing for the same question did not face them.</p>

  <p>One detail on the franchise name matters for local managers. Real Property Management is a national network, but the answers usually wrote it with a city or a metro area, and often listed it as one entry among several in a numbered or bulleted list. To a reader it looks like another local company. Counting the brand, as we did, is the only way to see how common that is.</p>

  <h2>By city</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Answers in the city naming a national brand (of 5)</th><th>Cities</th></tr></thead>
    <tbody>
      <tr><td>5</td><td>4</td></tr>
      <tr><td>4</td><td>7</td></tr>
      <tr><td>3</td><td>4</td></tr>
      <tr><td>2</td><td>1</td></tr>
      <tr><td>1</td><td>1</td></tr>
      <tr><td>0</td><td>3</td></tr>
    </tbody>
  </table>
  </div>

  <p>The brands are not spread evenly. In 11 of the 20 cities, at least four of the five answers named a national brand from our list. In 3 cities none did, so no engine put one of our seven names in the answer. In one more city only one answer did. For a local manager, the practical question is which of these two kinds of city you work in.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you manage property locally, expect a national or franchise name to appear next to yours in about two answers out of three. Search your own city on the five engines and see which names sit beside you. The brand does not need to be large in your city to be listed.</p>
    <p>Then give the engines something specific that a franchise page does not carry: who owns the company, how long you have managed rentals in the city, how many homes you manage, and what you charge. BG-112 found that tenure, ownership and units under management were the facts engines most often wrote next to property managers. This study cannot say that publishing them keeps a national name off the list. It shows how often the name is there.</p>
  </div>""",
))


ARTICLES_DAILY.append(dict(
    slug="bg-114", bid="BG-114", date="2026-11-07", date_label="November 7, 2026", read=6,
    tags=["Original Research", "US Cities", "Real Estate"],
    title="Which National Brokerage Names AI Engines Put Beside Real Estate Agents",
    h1="Which <em>National Brokerage</em> Names AI Engines Put Beside Real Estate Agents",
    h1_plain="Which National Brokerage Names AI Engines Put Beside Real Estate Agents",
    subtitle="We read 97 AI answers to a home buyer question in 20 US cities. 77 of them named a national brokerage brand next to the agents. One engine almost never did.",
    meta_desc="In 97 AI answers about real estate agents in 20 US cities, 77 named a national brokerage brand. Compass came up in 38 and Keller Williams in 37. Perplexity named one in 4 of 20 answers, Gemini in 20 of 20.",
    og_desc="77 of 97 AI answers about real estate agents named a national brokerage brand. Compass appeared in 38, Keller Williams in 37. Gemini did it in 20 of 20 answers, Perplexity in 4 of 20.",
    ld_desc="Original BrandGEO research counting how often ChatGPT, Claude, Gemini, Perplexity and Google AI Mode named a national brokerage brand (Compass, Keller Williams, RE/MAX, eXp Realty, Coldwell Banker, Sotheby's International Realty, Redfin, Berkshire Hathaway HomeServices, Douglas Elliman, Century 21) in 97 answers to a real estate agent question across 20 US cities.",
    keywords="ai real estate agent recommendations, chatgpt best realtor national brokerage, compass keller williams ai answers, ai search real estate agents, brokerage brand ai visibility, real estate agent ai search",
    about=["AI Visibility Research", "Real Estate", "Local Search", "Engine Behavior"],
    findings=[("77 of 97", "real estate answers named at least one national brokerage brand next to the agents"),
              ("38 and 37", "answers named Compass and Keller Williams, the two most common brands"),
              ("20 of 20", "Gemini answers named one, against 4 of 20 for Perplexity"),
              ("28 of 97", "answers named three or more different brokerage brands")],
    faq=[("Do AI engines recommend real estate agents or brokerages?",
          "Mostly agents, with a brokerage brand attached. In the 22 passages we read by hand, the brand was the company the named agent works under. Of 97 answers across 20 US cities, 77 named at least one national brokerage brand."),
         ("Which brokerage brand do AI engines name most for real estate agents?",
          "Compass appeared in 38 of 97 answers and Keller Williams in 37. RE/MAX appeared in 19, eXp Realty in 17, Coldwell Banker and Sotheby's International Realty in 16 each, Redfin in 15, Berkshire Hathaway HomeServices in 12, Douglas Elliman in 7 and Century 21 in 2."),
         ("Do all AI engines name national brokerages equally?",
          "No. Gemini named one in all 20 of its answers, Claude in 19 of 20, ChatGPT in 18 of 19, Google AI Mode in 16 of 18 and Perplexity in 4 of 20. With about 20 answers per engine, treat gaps of a few answers as small, but the Perplexity gap is large."),
         ("Does this study show why an engine names a brokerage?",
          "No. It counts what the engines wrote. It does not show why an agent or brand was picked, whether the brand is a ranking factor, or whether the agent is any good.")],
    related=[("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "The same check for property managers instead of agents."),
             ("/bg-107.html", "BG-107", "When an AI Engine Names No One: 15 Answers With No Firm in Them",
              "The answers where an engine named no firm at all."),
             ("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "The listing and review sites engines name for the same questions.")],
    cta_h="See which brokerage names AI engines put beside yours",
    cta_p="Run the free audit on your own domain and read which firms each engine names in your market. No signup and no card.",
    og=dict(
        fname="og-bg-114.png",
        kicker="BG-114 · Original Research",
        lines=[[("National Brokerages", "w")], [("Beside the Agents", "g")]],
        sub=["97 real estate answers,",
             "20 US cities, 5 engines."],
        stats=[("77 of 97", "answers named a national brokerage", "BrandGEO, July 2026"),
               ("38", "named Compass", "37 named Keller Williams"),
               ("20 of 20", "Gemini answers named one", "Perplexity: 4 of 20"),
               ("28 of 97", "named three or more brands", "different brokerages"),],
        footer="Agent or Brokerage Name",
    ),
    body="""  <p>Ask an AI engine for the best real estate agents for a home buyer in your city and you get a list of people. Next to most of those people sits the name of the company they work under. We wanted to count how often that company is a national brokerage brand, and which brands. A local agent reading the list learns whether the engines frame the competition as individual agents or as agents carrying a large brand.</p>

  <p><strong>77 of 97 answers (79%) named at least one national brokerage brand.</strong> 20 named none from our list. Two names dominate: Compass appeared in 38 answers and Keller Williams in 37. In 28 answers, three or more different brands appeared together.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked one real estate agent question for home buyers in each of 20 US cities. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered it on July 24 and 25, 2026, and 97 usable answers came back. We searched the answer text, with links removed, for ten national brand names: Compass, Keller Williams, RE/MAX, eXp Realty, Coldwell Banker, Sotheby's International Realty, Redfin, Berkshire Hathaway HomeServices, Douglas Elliman and Century 21. We also searched for Howard Hanna and Weichert and found neither.</p>
    <p>We read 22 matched passages by hand, spread over all five engines. All 22 were real: the brand was the company the named agent works under, or, for Redfin, a brokerage the engine recommended directly. Our list is short, so other national or regional brands exist and are not counted, which means the real share is higher. Stored Claude answers are cut at about 3,800 characters and Google AI Mode answers at 10,000, so brands late in a long answer are missed. We count what the engines wrote. We did not check whether any agent or brand is good, and we cannot say why an engine named it. No agent is named in this article.</p>
  </div>

  <h2>Which brands came up</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Brand</th><th>Answers (of 97)</th></tr></thead>
    <tbody>
      <tr><td>Compass</td><td>38</td></tr>
      <tr><td>Keller Williams</td><td>37</td></tr>
      <tr><td>RE/MAX</td><td>19</td></tr>
      <tr><td>eXp Realty</td><td>17</td></tr>
      <tr><td>Coldwell Banker</td><td>16</td></tr>
      <tr><td>Sotheby's International Realty</td><td>16</td></tr>
      <tr><td>Redfin</td><td>15</td></tr>
      <tr><td>Berkshire Hathaway HomeServices</td><td>12</td></tr>
      <tr><td>Douglas Elliman</td><td>7</td></tr>
      <tr><td>Century 21</td><td>2</td></tr>
      <tr><td><strong>At least one of these</strong></td><td>77</td></tr>
    </tbody>
  </table>
  </div>

  <p>Few answers stopped at one brand. 25 named exactly one, 24 named two, 18 named three, and 10 named four to six. A buyer comparing the list is looking at agents from several competing national networks side by side, each shown with its badge.</p>

  <h2>By engine</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Named a national brokerage</th><th>Compass</th><th>Keller Williams</th><th>Redfin</th></tr></thead>
    <tbody>
      <tr><td>Gemini</td><td>20</td><td>20</td><td>9</td><td>11</td><td>4</td></tr>
      <tr><td>Claude</td><td>20</td><td>19</td><td>9</td><td>8</td><td>0</td></tr>
      <tr><td>ChatGPT</td><td>19</td><td>18</td><td>7</td><td>8</td><td>10</td></tr>
      <tr><td>Google AI Mode</td><td>18</td><td>16</td><td>11</td><td>10</td><td>1</td></tr>
      <tr><td>Perplexity</td><td>20</td><td>4</td><td>2</td><td>0</td><td>0</td></tr>
    </tbody>
  </table>
  </div>

  <p>Four engines name a brokerage in nearly every answer, from 16 of 18 to 20 of 20. Perplexity is the outlier at 4 of 20, and the gap is too large to blame on a small sample. BG-107 covers answers where an engine named no firm at all, and that is part of the reason Perplexity's count is low here. We did not recount it for this article.</p>

  <p>The engines also differ in who they put beside the agents. ChatGPT named Redfin in 10 of 19 answers, as a brokerage to consider directly. Claude named it in none. Gemini and Google AI Mode leaned on the franchise networks, with Keller Williams in 11 of 20 and 10 of 18 answers. Gemini also gave the longest brand lists: 11 of its 20 answers named three or more different brokerages.</p>

  <h2>By city</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Answers in the city naming a national brokerage (each city has 4 or 5)</th><th>Cities</th></tr></thead>
    <tbody>
      <tr><td>5</td><td>2</td></tr>
      <tr><td>4</td><td>13</td></tr>
      <tr><td>3</td><td>5</td></tr>
    </tbody>
  </table>
  </div>

  <p>Unlike property management, where 3 cities had no national brand at all, no city here escaped. In every one of the 20 cities, at least 3 of the answers carried a national brokerage name. For a local agent, the question is not whether a national brand will appear in the answer, but which ones.</p>

  <h2>What else shares the answer</h2>

  <p>36 of the 97 answers also named a property portal such as Zillow or Realtor.com. That overlaps with BG-106, which counted the directories and review sites engines name, so we only note it here. A buyer reading these answers often meets an agent, a brokerage badge and a portal in the same list.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you are an independent agent or a small brokerage, expect to be listed beside agents who carry a national badge in about four answers out of five. Run your own city on the five engines and write down which brands sit next to you, and whether your own firm name appears in the same answer.</p>
    <p>Then check what an engine can read about you. Your firm name, years in the market, the neighborhoods you work and how many homes you sold are the facts these answers quote beside a name. This study cannot say that publishing them changes the list. It shows how often the national names are there.</p>
  </div>""",
))


ARTICLES_DAILY.append(dict(
    slug="bg-115", bid="BG-115", date="2026-11-08", date_label="November 8, 2026", read=6,
    tags=["Original Research", "US Cities", "Engine Behavior"],
    title="Which Year AI Engines Say Their Local Recommendations Are For",
    h1="Which <em>Year</em> AI Engines Say Their Local Recommendations Are For",
    h1_plain="Which Year AI Engines Say Their Local Recommendations Are For",
    subtitle="We read 585 AI answers about local firms, collected in July 2026. Half carried a year. When Claude put a year on its list, it was 2025 in 19 of 20 answers. Google AI Mode said 2026.",
    meta_desc="In 585 AI answers about local professionals collected in July 2026, 293 mentioned a year. Claude framed 20 answers by year and 19 of them said 2025. Google AI Mode framed 8, and 7 said 2026. None warned the answer could be out of date.",
    og_desc="293 of 585 AI answers about local firms carried a year. Claude labelled 20 of its lists by year, 19 of them 2025, in July 2026. Google AI Mode labelled 8, 7 of them 2026.",
    ld_desc="Original BrandGEO research counting how often ChatGPT, Claude, Gemini, Perplexity and Google AI Mode mention a year or say 'as of' in 585 answers about local professionals across 20 US cities, collected on July 24 and 25, 2026, and which year each engine puts on its list.",
    keywords="ai answers out of date, chatgpt local recommendations year, claude 2025 list, how current are ai recommendations, ai search freshness local business, google ai mode as of 2026",
    about=["AI Visibility Research", "Local Search", "Engine Behavior", "Freshness"],
    findings=[("293 of 585", "answers mentioned a year somewhere in the text"),
              ("19 of 20", "Claude answers that labelled their list by year named 2025, alone or as 2025 to 2026, in July 2026"),
              ("7 of 8", "Google AI Mode answers that labelled their list by year said 2026"),
              ("0", "answers warned that the information itself might be out of date")],
    faq=[("How often do AI engines say which year their recommendations are for?",
          "Rarely in so many words. Of 585 answers about local professionals in 20 US cities, 29 opened by placing the list in a year, such as 'for 2025' or 'as of 2026'. 293 mentioned a year somewhere, mostly as the edition of an award or a ranking."),
         ("Do AI engines give out of date local recommendations?",
          "Some label them with last year. The answers were collected on July 24 and 25, 2026. When Claude put a year on its list, it said 2025 or '2025 to 2026' in 19 of 20 answers. Google AI Mode said 2026 in 7 of 8. This study does not check whether the firms named were current."),
         ("Do AI answers warn that the information may be outdated?",
          "Not in this sample. None of the 585 answers said its own information might be out of date. 'As of' appeared in 11 answers."),
         ("Does this study show why an engine picks a year?",
          "No. It counts what the engines wrote. It does not show why an engine labelled a list with a given year, or whether the year affects which firms it names.")],
    related=[("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "Award years and years in business, counted as credentials."),
             ("/bg-111.html", "BG-111", "How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
              "The other caveats engines give, and how often."),
             ("/bg-107.html", "BG-107", "When an AI Engine Names No One: 15 Answers With No Firm in Them",
              "The answers that named no firm at all.")],
    cta_h="See which year AI engines put on your market",
    cta_p="Run the free audit on your own domain and read what each engine says about your market today. No signup and no card.",
    og=dict(
        fname="og-bg-115.png",
        kicker="BG-115 · Original Research",
        lines=[[("Which Year Is", "w")], [("This List For?", "g")]],
        sub=["585 answers, July 2026,",
             "20 US cities, 5 engines."],
        stats=[("293 of 585", "answers mentioned a year", "BrandGEO, July 2026"),
               ("19 of 20", "Claude year labels named 2025", "alone or as 2025 to 2026"),
               ("7 of 8", "Google AI Mode labels said 2026", "as of, for, based on"),
               ("0", "warned it may be out of date", "of 585 answers"),],
        footer="Year Labels in AI Answers",
    ),
    body="""  <p>When a buyer asks an AI engine for the best personal injury lawyer or property manager in their city, the answer often comes with a date attached: "top firms for 2025", "as of July 2026", "the 2026 Best Law Firms list". A date tells the reader how current the list claims to be. We wanted to count how often engines attach one, and which year they pick.</p>

  <p><strong>293 of 585 answers (50%) mentioned a year somewhere.</strong> Most of those years belong to an award or a ranking edition. Far fewer answers put the list itself in a year, and here the engines split. The answers were collected on July 24 and 25, 2026. When Claude labelled its list with a year, it said 2025, alone or as "2025 to 2026", in 19 of 20 answers. When Google AI Mode did, it said 2026 in 7 of 8.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked six questions in each of 20 US cities: personal injury lawyers, real estate agents, property managers, immigration lawyers and two questions specific to the city. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered on July 24 and 25, 2026, and 585 usable answers came back. We searched the answer text, with links removed so years inside web addresses do not count, for the years 2010 to 2026 and for "as of".</p>
    <p>For the year an answer puts on itself, we looked at the first 400 characters, where the heading or lead sentence sits, and read every match by hand. A year that belongs to an award edition or a source's ranking was not counted as a label. Stored Claude answers are cut at about 3,800 characters and ChatGPT and Google AI Mode answers at 10,000, so the counts of years anywhere in the text are lower bounds for those engines. The opening counts are not affected. We count what the engines wrote. We did not check whether the firms named were still current, and we cannot say why an engine chose a year.</p>
  </div>

  <h2>A year anywhere in the answer</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Any year</th><th>2026</th><th>2025</th><th>2024 or earlier</th></tr></thead>
    <tbody>
      <tr><td>Google AI Mode</td><td>111</td><td>85</td><td>60</td><td>29</td><td>46</td></tr>
      <tr><td>Claude</td><td>120</td><td>84</td><td>33</td><td>61</td><td>45</td></tr>
      <tr><td>ChatGPT</td><td>114</td><td>65</td><td>57</td><td>14</td><td>12</td></tr>
      <tr><td>Gemini</td><td>120</td><td>30</td><td>11</td><td>10</td><td>23</td></tr>
      <tr><td>Perplexity</td><td>120</td><td>29</td><td>16</td><td>12</td><td>9</td></tr>
    </tbody>
  </table>
  </div>

  <p>An answer can carry more than one year, so the year columns do not add up to the total. Three engines carry a year in more than half their answers, and two in about a quarter. The year most often written also differs. ChatGPT and Google AI Mode lean on 2026, mostly as the edition of a list: "Best Law Firms 2026", "Chambers USA 2026". Claude names 2025 in 61 answers, nearly twice as often as 2026.</p>

  <p>Two uses of a year account for most of these. A year next to an award, a ranking or a list showed up in 166 answers, and a founding year ("since 2005", "established in") in 162. BG-112 covered both as credentials, so we only count them here.</p>

  <h2>The year an answer puts on itself</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers that label the list with a year</th><th>Said 2026</th><th>Said 2025 to 2026</th><th>Said 2025</th></tr></thead>
    <tbody>
      <tr><td>Claude</td><td>20 of 120</td><td>1</td><td>10</td><td>9</td></tr>
      <tr><td>Google AI Mode</td><td>8 of 111</td><td>7</td><td>1</td><td>0</td></tr>
      <tr><td>Gemini</td><td>1 of 120</td><td>1</td><td>0</td><td>0</td></tr>
      <tr><td>ChatGPT</td><td>0 of 114</td><td>0</td><td>0</td><td>0</td></tr>
      <tr><td>Perplexity</td><td>0 of 120</td><td>0</td><td>0</td><td>0</td></tr>
    </tbody>
  </table>
  </div>

  <p>Claude's labels look like headings: a list of property managers "for 2025", real estate agents "in 2025 to 2026", a section titled with the year in brackets. It used them most on real estate agents (8 answers) and property management (7), then personal injury (3), immigration (1) and one city question about home builders. Only one of the 20 said 2026 alone. In July 2026, a reader of 9 of those answers was handed a list labelled with the year before.</p>

  <p>Google AI Mode's labels read as a timestamp instead: "as of July 2026", "based on 2026 data", "for 2026". ChatGPT and Perplexity never labelled the list itself. They put years on the evidence instead, the edition of the ranking or the year of the award they cite. That is a different signal to a reader: it says where a claim came from, not when the list was made.</p>

  <h2>Hedges about freshness</h2>

  <p>"As of" appeared in 11 answers: Google AI Mode 5, ChatGPT 3, Claude 3, and none from Gemini or Perplexity. None of the 585 answers warned that its own information might be out of date. One Perplexity answer declined to name agents at all because it might give outdated picks, which is one of the answers BG-107 counted. BG-111 counted the other caveats engines add, such as checking reviews and asking for a consultation; a caveat about the age of the list itself did not show up.</p>

  <p>So a buyer gets a list and, at most, a year on it, and the year depends on which engine they asked. In the same two days of July, one engine labelled its lists 2025 and another labelled its lists 2026.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Ask the five engines about your own trade in your own city and note the year each one puts on its answer, and the year of every award or ranking it quotes beside your name and your competitors'. If an engine credits a competitor with this year's list and you with an edition from three years ago, that is what a buyer reads.</p>
    <p>Then make the current facts easy to find: the edition year of each award on your site, a dated "last updated" line on your service and pricing pages, and current figures in your business profiles. This study cannot say that dated pages change which year an engine picks. It shows how often the year is there, and how much it varies.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-116", bid="BG-116", date="2026-11-09", date_label="November 9, 2026", read=6,
    tags=["Original Research", "London and Dublin", "Cross-Engine Consensus"],
    title="London and Dublin, Same Questions: Which Names AI Engines Carry Across the Border",
    h1="London and Dublin, Same Questions: Which Names AI Engines <em>Carry Across</em> the Border",
    h1_plain="London and Dublin, Same Questions: Which Names AI Engines Carry Across the Border",
    subtitle="We asked four AI engines the same eight business questions in London and Dublin. Software names travelled: 14 of 17 showed up in both cities. Law firms and advisors did not: 4 shared names across five questions.",
    meta_desc="Four AI engines answered the same eight business questions for London and Dublin in July 2026. 14 of 17 software names appeared in both cities. Banking split along the border, with Revolut the only name in all 8 answers. Law and advice questions shared 4 firms in total.",
    og_desc="Same questions, London and Dublin, four AI engines. 14 of 17 software names appeared in both cities. Law and advice shared 4 firms across five questions. Revolut was the only bank in all 8 answers.",
    ld_desc="Original BrandGEO research comparing what Claude, Gemini, Meta AI and Perplexity named when asked the same eight business questions for London and Dublin on July 10, 2026: which software, banking, law and wealth management names appear in both cities' answers and which stay on one side.",
    keywords="ai recommendations london dublin, chatgpt uk vs ireland, ai visibility across countries, do ai engines recommend the same brands in different cities, international ai visibility, perplexity gemini claude london dublin",
    about=["AI Visibility Research", "Cross-Engine Consensus", "International Markets", "Professional Services"],
    findings=[("14 of 17", "software names named twice in one city also appeared in the other city's answers"),
              ("8 of 8", "business banking answers in both cities that named Revolut, the only bank in all of them"),
              ("4", "firms named in both cities across five law and advice questions"),
              ("0", "of those 4 firms named by more than one engine in either city")],
    faq=[("Do AI engines recommend the same brands in London and Dublin?",
          "For software, mostly yes. When four engines were asked about CRM and project management tools for each city, 14 of the 17 names that came up at least twice appeared in both cities' answers. For law firms, financial advisors and property solicitors, almost never: across five questions only 4 firms appeared on both sides, each in one answer per city."),
         ("Which business banking apps did AI engines name for the UK and Ireland?",
          "Revolut appeared in all 4 answers for each country. Monzo and Starling appeared in all 4 UK answers and none of the Irish ones. AIB and N26 appeared in 3 Irish answers and no UK answer. Tide and Wise appeared on both sides."),
         ("If my firm is visible in AI answers in one country, will it show up in another?",
          "This study suggests it depends on what you sell. Software and app brands crossed from one city to the other. Professional firms almost never did, even when the question was worded the same. Check each market on its own."),
         ("How many answers is this based on?",
          "64 answers: 8 questions, 2 cities, 4 engines (Claude, Gemini, Meta AI and Perplexity), collected on July 10, 2026. That is a small sample, so we report counts, not percentages, and we do not claim why an engine named a firm.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "Agreement between engines inside one city, from the same July collection."),
             ("/ai-visibility-for-london.html", "London", "AI Visibility in London",
              "The London answers, question by question."),
             ("/ai-visibility-for-dublin.html", "Dublin", "AI Visibility in Dublin",
              "The Dublin answers, question by question.")],
    cta_h="See which names AI engines give in your own market",
    cta_p="Run the free audit on your own domain and read what each engine says about your market today. No signup and no card.",
    og=dict(
        fname="og-bg-116.png",
        kicker="BG-116 · Original Research",
        lines=[[("London and Dublin,", "w")], [("Same Questions", "g")]],
        sub=["64 answers, July 2026,",
             "4 engines, 8 questions."],
        stats=[("14 of 17", "software names in both cities", "CRM and project tools"),
               ("8 of 8", "banking answers named Revolut", "4 London, 4 Dublin"),
               ("4", "firms shared in law and advice", "across 5 questions"),
               ("0", "of them named twice in a city", "1 answer per side each"),],
        footer="London and Dublin in AI Answers",
    ),
    body="""  <p>A company that sells in both the UK and Ireland usually asks one question about AI search: if the engines recommend us in London, do they recommend us in Dublin too? We had the data to check. On July 10, 2026 we asked four AI engines the same eight business questions for London and for Dublin, and compared the names in the two sets of answers.</p>

  <p><strong>The answer splits by what you sell.</strong> Software names crossed the border: 14 of the 17 CRM and project management tools named at least twice in one city also appeared in the other. Business banking split along the border, with Revolut the only name in all 8 answers. Law firms, financial advisors and property solicitors almost never crossed: across five questions, 4 firms appeared in both cities, and each of them in only one answer per city.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>Claude, Gemini, Meta AI and Perplexity each answered eight questions for London and the same eight for Dublin, 64 answers in all. Three questions were worded the same apart from the city (commercial contract disputes, wealth management for expats, property purchase solicitors), one apart from the country (business banking apps), and four were close but not identical: the London CRM question asked for UK-based software, the Dublin one for tools used by startups. ChatGPT answered in London but returned errors in Dublin that day, so it is left out of both sides. Meta AI has since been retired from our collection; its July answers stay in.</p>
    <p>For software and banking we searched the answer text for a list of brand names, with word boundaries, and read every hit in context. For the five law and advice questions we listed every firm named, by hand, and searched for each one in the other city's answers. With 4 answers per city per question, we report counts, not percentages. We count what the engines wrote. We cannot say why an engine named a firm, and we do not name law or wealth firms here, since most carry their founders' surnames.</p>
  </div>

  <h2>Software: the same names on both sides</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Names in 2 or more answers in a city</th><th>Also in the other city</th><th>Named in both, answers out of 4 (London, Dublin)</th></tr></thead>
    <tbody>
      <tr><td>CRM software</td><td>7</td><td>6</td><td>Zoho 3 and 3, HubSpot 2 and 4, Pipedrive 2 and 4, Freshsales 2 and 2, Salesforce 1 and 4, monday.com 1 and 2</td></tr>
      <tr><td>Project management</td><td>10</td><td>8</td><td>Asana 4 and 3, ClickUp 4 and 3, Trello 4 and 3, monday.com 3 and 4, Jira 3 and 3, Basecamp 3 and 3, Notion 3 and 1, Wrike 2 and 1</td></tr>
    </tbody>
  </table>
  </div>

  <p>The three names that stayed on one side are telling. Capsule appeared in all 4 London CRM answers and no Dublin one, and the London question asked for UK-based software; two of the answers described Capsule as British or London-based. Linear appeared in 2 London project management answers and Smartsheet in 2 Dublin ones. Everything else that came up more than once came up in both cities.</p>

  <h2>Banking: split along the border, with one exception</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Name</th><th>UK answers (of 4)</th><th>Ireland answers (of 4)</th></tr></thead>
    <tbody>
      <tr><td>Revolut</td><td>4</td><td>4</td></tr>
      <tr><td>Monzo</td><td>4</td><td>0</td></tr>
      <tr><td>Starling</td><td>4</td><td>0</td></tr>
      <tr><td>Tide</td><td>3</td><td>1</td></tr>
      <tr><td>Wise</td><td>2</td><td>3</td></tr>
      <tr><td>AIB</td><td>0</td><td>3</td></tr>
      <tr><td>N26</td><td>0</td><td>3</td></tr>
      <tr><td>Bank of Ireland</td><td>0</td><td>2</td></tr>
    </tbody>
  </table>
  </div>

  <p>The question was the same apart from the country. UK answers named UK challenger banks, and Irish answers named Irish banks and N26. Of the 8 names that came up at least twice, 3 appeared in both countries, and only Revolut was in every answer on both sides. Banking is a regulated product sold country by country, and the answers follow that line.</p>

  <h2>Law and advice: almost no overlap</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Firms named in both cities</th><th>Answers naming them (London, Dublin)</th></tr></thead>
    <tbody>
      <tr><td>Employment law</td><td>1</td><td>1 and 1</td></tr>
      <tr><td>Commercial contract dispute</td><td>0</td><td>none</td></tr>
      <tr><td>Financial advisors</td><td>0</td><td>none</td></tr>
      <tr><td>Wealth management for expats</td><td>3</td><td>1 and 1 each</td></tr>
      <tr><td>Property purchase solicitors</td><td>0</td><td>none</td></tr>
    </tbody>
  </table>
  </div>

  <p>The commercial dispute question was worded the same for both cities, and the four engines agreed strongly inside each city: one London firm was in all 4 London answers, and five Dublin firms were in all 4 Dublin answers. Not one name crossed. The property question, also worded the same, gave two separate lists with nothing in common.</p>

  <p>The four shared names have something in common. The one employment firm is a large UK firm, and the Dublin answer named its Dublin office. The three wealth managers are UK firms, and each Dublin answer introduced them through an Irish office or presence. None was named by a second engine in either city. So the overlap that exists sits with firms that have a presence in both countries, and even there it is one engine on each side.</p>

  <p>Two answers named no firm of their own. Gemini, asked about London contract disputes, said it could not recommend a firm, then named four as examples of what a legal directory ranks. Perplexity, asked about London financial advisors, pointed to two adviser directories and a regulator's search tool instead of any firm.</p>

  <h2>What this means for a business in two countries</h2>

  <p>For a software or app company, the result is encouraging: if the engines name you in one of these cities, they probably name you in the other, because the answer is about the product, not the place. For a bank, the country decides the list. For a law firm or an advisor, visibility in one city carried almost nothing into the other in this sample, even for firms with offices in both.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>If you sell a product across borders, check one market first and spot check the second; the names in these answers mostly travelled. If you sell a service, or anything regulated, treat each country as its own audit. Ask each engine the question a buyer in that city would type, and note whether your local office is named under its local name.</p>
    <p>If you have an office in a second country, give it its own page, its own business profile and its own local facts, so an engine answering a Dublin question has a Dublin page to read. This study cannot show that doing so changes what an engine names. It shows how little crossed the border on its own.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-117", bid="BG-117", date="2026-11-10", date_label="November 10, 2026", read=6,
    tags=["Original Research", "US Cities", "Immigration Law"],
    title="How AI Engines Use AILA When They Recommend Immigration Lawyers",
    h1="How AI Engines Use <em>AILA</em> When They Recommend Immigration Lawyers",
    h1_plain="How AI Engines Use AILA When They Recommend Immigration Lawyers",
    subtitle="We read 97 AI answers about immigration lawyers in 20 US cities. ChatGPT named the American Immigration Lawyers Association in all 19 of its answers, mostly as a way to check a lawyer. Perplexity named it in none of 20.",
    meta_desc="In 97 AI answers about immigration lawyers across 20 US cities, collected in July 2026, 43 named AILA. ChatGPT did in 19 of 19 and told buyers to check or ask about membership in all 19. Claude used it as a lawyer's credential in 13 of 20. Perplexity never named it.",
    og_desc="43 of 97 AI answers about immigration lawyers named AILA. ChatGPT: 19 of 19, as a way to check a lawyer. Claude: 13 of 20, as a credential. Perplexity: 0 of 20.",
    ld_desc="Original BrandGEO research counting how often ChatGPT, Claude, Gemini, Perplexity and Google AI Mode name the American Immigration Lawyers Association (AILA) in 97 answers about immigration lawyers across 20 US cities, collected on July 24 and 25, 2026, and whether they use it as a firm's credential or as a way for the buyer to check a lawyer.",
    keywords="aila ai answers, immigration lawyer ai visibility, chatgpt immigration lawyer recommendation, aila membership credential, ai search immigration attorney, does chatgpt check aila",
    about=["AI Visibility Research", "Local Search", "Immigration Law", "Credentials"],
    findings=[("43 of 97", "immigration lawyer answers named AILA; 0 of 488 answers to the other questions did"),
              ("19 of 19", "ChatGPT answers named AILA, and all 19 told the buyer to use it to check or find a lawyer"),
              ("13 of 20", "Claude answers named AILA, every time as a membership attached to a named lawyer or firm"),
              ("0 of 20", "Perplexity answers named AILA")],
    faq=[("Do AI engines mention AILA when recommending immigration lawyers?",
          "Often, but it depends on the engine. In 97 answers about immigration lawyers across 20 US cities, collected in July 2026, 43 named the American Immigration Lawyers Association. ChatGPT named it in 19 of 19 answers, Claude in 13 of 20, Gemini in 8 of 20, Google AI Mode in 3 of 18 and Perplexity in none of 20."),
         ("How do AI engines use AILA membership?",
          "Two ways. 33 answers attached AILA to a named lawyer or firm as a credential: a membership, a chapter role, a conference. 22 answers told the buyer to use AILA to check or find a lawyer, through its lawyer search, a local chapter, or by asking the lawyer whether they are a member. ChatGPT did the second in all 19 of its answers; the other engines did it once each."),
         ("Should an immigration lawyer mention AILA membership on their website?",
          "This study cannot say that it changes which lawyers an engine names. It shows that when Claude, Gemini and Google AI Mode named AILA, they almost always attached it to a specific lawyer, and ChatGPT told buyers in 11 of 19 answers to ask a lawyer directly whether they are a member."),
         ("Did the engines check whether the lawyers really are AILA members?",
          "We did not check, and the answers do not say they did. Some ChatGPT answers cited the firm's own site or a directory for the claim. We count what the engines wrote.")],
    related=[("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "Years in business, board certification and awards, counted across all trades."),
             ("/bg-111.html", "BG-111", "How Often AI Engines Tell Buyers to Check a Firm Before Hiring It",
              "The other checks engines tell buyers to make, and which engine makes them."),
             ("/bg-109.html", "BG-109", "How Often AI Engines Give a Street Address or Phone Number for the Firms They Name",
              "Which contact details come with the firms engines name.")],
    cta_h="See what AI engines say about your firm's credentials",
    cta_p="Run the free audit on your own domain and read what each engine says about your firm and your market today. No signup and no card.",
    og=dict(
        fname="og-bg-117.png",
        kicker="BG-117 · Original Research",
        lines=[[("AILA in AI", "w")], [("Lawyer Answers", "g")]],
        sub=["97 immigration answers,",
             "July 2026, 20 US cities."],
        stats=[("43 of 97", "answers named AILA", "BrandGEO, July 2026"),
               ("19 of 19", "ChatGPT answers named it", "all as a way to check"),
               ("13 of 20", "Claude answers named it", "all as a credential"),
               ("0 of 20", "Perplexity answers named it", "immigration question"),],
        footer="AILA in AI Answers",
    ),
    body="""  <p>Ask an AI engine for the best immigration lawyer in your city and one name comes up that is not a law firm: the American Immigration Lawyers Association, AILA, the national association of immigration attorneys. We counted how often each engine names it and, reading every answer by hand, what it uses the name for.</p>

  <p><strong>43 of 97 immigration answers named AILA.</strong> None of the 488 answers to our other questions did, so this is a signal specific to the trade. The engines split into two habits. ChatGPT named AILA in all 19 of its answers and, in every one, told the buyer to use it to check or find a lawyer. Claude named it in 13 of 20, and every time as a membership attached to a lawyer it was recommending. Perplexity never named it.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked the same immigration lawyer question in each of 20 US cities. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered on July 24 and 25, 2026, and 97 usable answers came back (ChatGPT 19, after one city's July rows were removed in a later refresh). We searched the answer text for "AILA" as a whole word and for the full name, then read all 43 matching answers and sorted each mention into one of two uses: a credential attached to a named lawyer or firm, or advice to the buyer to use AILA to check or find a lawyer. An answer can do both.</p>
    <p>Stored Claude answers are cut at about 3,800 characters and ChatGPT and Google AI Mode answers at 10,000, so the counts are lower bounds for those engines. We count what the engines wrote. We did not check whether the lawyers named are AILA members, and we cannot say why an engine named the association or whether doing so affects which lawyers it picks.</p>
  </div>

  <h2>Who names AILA</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Answers</th><th>Named AILA</th><th>As a lawyer's credential</th><th>As a way to check or find a lawyer</th></tr></thead>
    <tbody>
      <tr><td>ChatGPT</td><td>19</td><td>19</td><td>11</td><td>19</td></tr>
      <tr><td>Claude</td><td>20</td><td>13</td><td>13</td><td>1</td></tr>
      <tr><td>Gemini</td><td>20</td><td>8</td><td>7</td><td>1</td></tr>
      <tr><td>Google AI Mode</td><td>18</td><td>3</td><td>2</td><td>1</td></tr>
      <tr><td>Perplexity</td><td>20</td><td>0</td><td>0</td><td>0</td></tr>
      <tr><td>All five</td><td>97</td><td>43</td><td>33</td><td>22</td></tr>
    </tbody>
  </table>
  </div>

  <p>12 answers used AILA both ways, 11 of them from ChatGPT. So 21 answers used it only as a credential and 10 only as a check.</p>

  <h2>AILA as a credential</h2>

  <p>In 33 answers the association appears inside a lawyer's or firm's description: a member, a past chapter chair, a speaker at its conferences, a firm whose attorneys all belong. This is the use Claude, Gemini and Google AI Mode share. Claude did it in all 13 of its AILA answers, often several times in one answer, one line per recommended lawyer, next to bar admissions and languages spoken. Gemini did it in 7 of its 8. Google AI Mode did it twice, once under a heading it labelled "Credentials".</p>

  <p>AILA is one of several credentials in these answers. Board certification or a certified specialist title, which BG-112 counted across trades, appeared in 29 of the 97 immigration answers: Claude 9, ChatGPT 7, Google AI Mode 7, Gemini 6, Perplexity 0. ChatGPT often put the two side by side, telling buyers to prefer a lawyer who is an AILA member or board certified in immigration law.</p>

  <h2>AILA as a way to check a lawyer</h2>

  <p>In 22 answers AILA was addressed to the buyer, not attached to a firm. Here ChatGPT is almost alone: 19 of the 22. Its advice took three forms, often more than one per answer:</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>What ChatGPT told the buyer</th><th>ChatGPT answers (of 19)</th></tr></thead>
    <tbody>
      <tr><td>Ask the lawyer: "Are you an AILA member?"</td><td>11</td></tr>
      <tr><td>Use AILA's lawyer search, directory or a local chapter</td><td>9</td></tr>
      <tr><td>Said membership is a useful filter but not a guarantee</td><td>3</td></tr>
    </tbody>
  </table>
  </div>

  <p>The other engines did this once each. One Gemini answer called the AILA lawyer finder the most important resource and suggested finding smaller firms through it. One Claude answer, after its list, told the buyer to look for AILA members. One Google AI Mode answer carried it in its source list, through a university page that sends students to the association's site.</p>

  <p>This sits next to what BG-111 found across all trades: ChatGPT is the engine most likely to tell a buyer to verify a firm before hiring it. In immigration answers, AILA is the specific check it names.</p>

  <h2>Why Perplexity's zero needs context</h2>

  <p>Perplexity's 20 immigration answers averaged about 1,100 characters, against 3,000 to 3,900 for ChatGPT, Claude and Gemini. Two of them said Perplexity had no search results to work from. None mentioned board certification either, and one mentioned a bar association. Perplexity's short answers carried almost no credentials of any kind, so its zero for AILA is part of that pattern, not a sign it treats the association differently from other credentials.</p>

  <p>For context, the government bodies also came up: USCIS, the federal agency that decides most applications, in 22 answers (ChatGPT 12, Google AI Mode 5, Claude 3, Gemini 1, Perplexity 1), and EOIR, which runs the immigration courts, in 3, all from ChatGPT. The professional association was named about twice as often as the agency.</p>

  <h2>What this means for an immigration firm</h2>

  <p>Two different buyers see two different things. A buyer who asks Claude, Gemini or Google AI Mode sees AILA as a line in some lawyers' descriptions and not in others. A buyer who asks ChatGPT is told, in most answers, to ask every lawyer about AILA membership or to look them up through the association. Either way, membership is the one credential in this trade that four of the five engines brought up unprompted.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Ask the five engines who the best immigration lawyers in your city are, and note whether your membership, chapter role or board certification appears next to your name, and next to your competitors'. If ChatGPT tells a buyer to check AILA, make sure your listing there is current and matches your website.</p>
    <p>On your own site, state each attorney's AILA membership and any chapter role in plain text on their profile page, with the year, alongside bar admissions and certifications. This study cannot show that doing so changes which lawyers an engine names. It shows how often the engines bring the association up, and how differently they use it.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-118", bid="BG-118", date="2026-11-11", date_label="November 11, 2026", read=6,
    tags=["Original Research", "US Cities", "Personal Injury"],
    title="Which Case Types AI Engines Attach to Personal Injury Firms",
    h1="Which Case Types AI Engines Attach to <em>Personal Injury</em> Firms",
    h1_plain="Which Case Types AI Engines Attach to Personal Injury Firms",
    subtitle="We read 97 AI answers about personal injury lawyers in 20 US cities. Four engines tied case types like wrongful death and truck crashes to the firms they named. Perplexity listed the same case types, but as a filter for the buyer, almost never next to a firm.",
    meta_desc="In 97 AI answers about personal injury lawyers across 20 US cities, collected in July 2026, 81 mentioned wrongful death. ChatGPT, Claude, Gemini and Google AI Mode attached it to a named firm in 59 of 62 such answers. Perplexity mentioned it in 19 of 20 and attached it to a firm once.",
    og_desc="81 of 97 AI answers about personal injury lawyers mentioned wrongful death. Four engines tied it to a named firm in 59 of 62. Perplexity: 19 mentions, 1 tied to a firm.",
    ld_desc="Original BrandGEO research counting which personal injury case types (car, truck, wrongful death, medical malpractice and nine others) ChatGPT, Claude, Gemini, Perplexity and Google AI Mode mention in 97 answers about personal injury lawyers across 20 US cities, collected on July 24 and 25, 2026, and, read by hand, whether each mention is attached to a named firm or offered to the buyer as a filter.",
    keywords="personal injury lawyer ai visibility, chatgpt personal injury lawyer recommendation, ai search wrongful death lawyer, perplexity law firm recommendations, truck accident lawyer ai answers, practice areas ai engines",
    about=["AI Visibility Research", "Local Search", "Personal Injury Law", "Practice Areas"],
    findings=[("6.2", "case types named per personal injury answer on average, from 4.0 (Perplexity) to 8.3 (ChatGPT)"),
              ("59 of 62", "wrongful death mentions by ChatGPT, Claude, Gemini and Google AI Mode attached to a named firm"),
              ("1 of 19", "Perplexity answers mentioning wrongful death that attached it to a firm"),
              ("0 of 20", "Perplexity answers naming motorcycle, dog bite, pedestrian, nursing home or rideshare cases")],
    faq=[("Do AI engines say which cases a personal injury firm handles?",
          "Most do. In 97 answers about personal injury lawyers across 20 US cities, collected in July 2026, the engines named 6.2 case types per answer on average. When ChatGPT, Claude, Gemini and Google AI Mode mentioned a case type, they mostly attached it to a named firm: in 59 of 62 answers for wrongful death, 49 of 55 for medical malpractice and 45 of 50 for truck crashes. Perplexity did so in 1 of 19, 2 of 9 and 2 of 10."),
         ("Which personal injury case types do AI engines mention most?",
          "Car accidents (86 of 97 answers), wrongful death (81), premises liability or slip and fall (69), medical malpractice (64) and truck crashes (60). Rideshare (10), nursing home (14) and dog bite (18) came last."),
         ("Why does Perplexity rarely attach case types to firms?",
          "We cannot say why. We can say what it wrote: its personal injury answers were short (median about 1,450 characters, against 3,000 to 4,300 for ChatGPT, Claude and Gemini) and used case types as a list for the buyer to compare firms on or to narrow a later search, not as a description of a firm."),
         ("Should a personal injury firm list its case types on its website?",
          "This study cannot show that doing so changes which firms an engine names. It shows that four of the five engines described the firms they named by case type, so a buyer reading those answers sees a firm's case types next to its name.")],
    related=[("/bg-112.html", "BG-112", "The Facts AI Engines Attach to the Local Firms They Recommend",
              "Years in business, board certification and awards, counted across all trades."),
             ("/bg-110.html", "BG-110", "What Fees AI Engines Quote When They Recommend Lawyers, Agents and Property Managers",
              "Contingency percentages and other fees, counted on the same answers."),
             ("/bg-107.html", "BG-107", "When an AI Engine Names No One: 15 Answers With No Firm in Them",
              "The answers that named no firm at all, by engine.")],
    cta_h="See which case types AI engines attach to your firm",
    cta_p="Run the free audit on your own domain and read what each engine says about your firm and your market today. No signup and no card.",
    og=dict(
        fname="og-bg-118.png",
        kicker="BG-118 · Original Research",
        lines=[[("Case Types in", "w")], [("Injury Answers", "g")]],
        sub=["97 personal injury answers,",
             "July 2026, 20 US cities."],
        stats=[("6.2", "case types per answer", "BrandGEO, July 2026"),
               ("59 of 62", "wrongful death mentions", "tied to a firm, 4 engines"),
               ("1 of 19", "Perplexity mentions", "tied to a firm"),
               ("81 of 97", "answers named", "wrongful death"),],
        footer="Case Types in AI Answers",
    ),
    body="""  <p>Ask an AI engine for the best personal injury lawyer in your city and most answers do more than list names. They say what each firm handles: car crashes, truck wrecks, wrongful death, medical malpractice. We counted which case types each engine names, and, reading the answers by hand, whether a case type was attached to a firm or offered to the buyer as a way to choose.</p>

  <p><strong>The engines named 6.2 case types per answer on average, and 93 of 97 answers named at least three.</strong> The split is in how they used them. ChatGPT, Claude, Gemini and Google AI Mode described the firms they named by case type. Perplexity named nearly as many case types in its lists, but as filters for the buyer: compare firms by case type, or ask it to narrow the list to car accidents or wrongful death.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>We asked the same personal injury lawyer question in each of 20 US cities. ChatGPT, Claude, Gemini, Perplexity and Google AI Mode answered on July 24 and 25, 2026, and 97 usable answers came back (ChatGPT 19, after one city's July rows were removed in a later refresh; Google AI Mode 18). We searched the answer text for 13 case types, each with a word pattern, and counted the answers that named each one. For wrongful death, medical malpractice and truck crashes we then read every matching passage and sorted each answer: a case type attached to a named firm or lawyer, or only a general mention addressed to the buyer.</p>
    <p>Stored Claude answers are cut at about 3,800 characters and ChatGPT and Google AI Mode answers at 10,000, so the counts are lower bounds for those engines. We count what the engines wrote. We did not check whether the firms really handle the cases attached to them, and we cannot say why an engine described a firm the way it did.</p>
  </div>

  <h2>Which case types come up</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Case type</th><th>ChatGPT (19)</th><th>Claude (20)</th><th>Gemini (20)</th><th>Google AI Mode (18)</th><th>Perplexity (20)</th><th>All (97)</th></tr></thead>
    <tbody>
      <tr><td>Car accident</td><td>17</td><td>18</td><td>14</td><td>18</td><td>19</td><td>86</td></tr>
      <tr><td>Wrongful death</td><td>19</td><td>15</td><td>12</td><td>16</td><td>19</td><td>81</td></tr>
      <tr><td>Premises liability, slip and fall</td><td>18</td><td>13</td><td>9</td><td>16</td><td>13</td><td>69</td></tr>
      <tr><td>Medical malpractice</td><td>15</td><td>16</td><td>10</td><td>14</td><td>9</td><td>64</td></tr>
      <tr><td>Truck crash</td><td>17</td><td>13</td><td>7</td><td>13</td><td>10</td><td>60</td></tr>
      <tr><td>Brain, spinal or catastrophic injury</td><td>17</td><td>7</td><td>10</td><td>15</td><td>8</td><td>57</td></tr>
      <tr><td>Workplace or construction injury</td><td>10</td><td>12</td><td>8</td><td>12</td><td>1</td><td>43</td></tr>
      <tr><td>Product liability</td><td>10</td><td>10</td><td>8</td><td>11</td><td>1</td><td>40</td></tr>
      <tr><td>Motorcycle</td><td>10</td><td>6</td><td>9</td><td>9</td><td>0</td><td>34</td></tr>
      <tr><td>Pedestrian or bicycle</td><td>11</td><td>4</td><td>3</td><td>10</td><td>0</td><td>28</td></tr>
      <tr><td>Dog bite</td><td>6</td><td>5</td><td>3</td><td>4</td><td>0</td><td>18</td></tr>
      <tr><td>Nursing home</td><td>5</td><td>3</td><td>1</td><td>5</td><td>0</td><td>14</td></tr>
      <tr><td>Rideshare (Uber, Lyft)</td><td>3</td><td>2</td><td>0</td><td>5</td><td>0</td><td>10</td></tr>
      <tr><td>Average types per answer</td><td>8.3</td><td>6.2</td><td>4.7</td><td>8.2</td><td>4.0</td><td>6.2</td></tr>
    </tbody>
  </table>
  </div>

  <p>Car accidents and wrongful death were near universal. Below the top five the engines part. ChatGPT and Google AI Mode reached deep into the list: pedestrian and bicycle cases in 11 of 19 and 10 of 18 answers. Perplexity named none of motorcycle, pedestrian, dog bite, nursing home or rideshare cases in 20 answers, and workplace and product cases once each. One Gemini answer and one Perplexity answer named no case type at all.</p>

  <h2>Attached to a firm, or handed to the buyer</h2>

  <p>A case type in an answer can do two jobs. It can describe a firm ("handles car accidents, truck wrecks and wrongful death"), or it can be advice to the buyer ("the best choice depends on whether your case is a car crash or medical malpractice"). We read every passage for three case types and counted the answers where at least one mention was attached to a named firm or lawyer.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Wrongful death</th><th>Medical malpractice</th><th>Truck crash</th></tr></thead>
    <tbody>
      <tr><td>ChatGPT</td><td>16 of 19</td><td>11 of 15</td><td>14 of 17</td></tr>
      <tr><td>Claude</td><td>15 of 15</td><td>15 of 16</td><td>12 of 13</td></tr>
      <tr><td>Gemini</td><td>12 of 12</td><td>10 of 10</td><td>6 of 7</td></tr>
      <tr><td>Google AI Mode</td><td>16 of 16</td><td>13 of 14</td><td>13 of 13</td></tr>
      <tr><td>Perplexity</td><td>1 of 19</td><td>2 of 9</td><td>2 of 10</td></tr>
      <tr><td>All five</td><td>60 of 81</td><td>51 of 64</td><td>47 of 60</td></tr>
    </tbody>
  </table>
  </div>

  <p>Read the table by row. Claude, Gemini and Google AI Mode almost never mentioned these case types except to describe a firm. ChatGPT did both: it described each firm by its best fit, and many of its answers also opened by telling the buyer that the right firm depends on the case type. Perplexity is the other way round. Of its 19 answers that mentioned wrongful death, 18 did so only in a list for the buyer, typically "compare firms on case type: car accident, truck crash, wrongful death" or an offer to narrow the list to the best firms for one of them. Across the three case types, 4 of its 20 answers tied any of them to a firm, each time in a single short line.</p>

  <h2>Why Perplexity's lists look different</h2>

  <p>Perplexity's personal injury answers were short: a median of about 1,450 characters, against 3,000 to 4,300 for Claude, Gemini and ChatGPT, and close to the 10,000 character cap for Google AI Mode. A short answer has room for a few firm names and little description of each. Its case types sat in the closing advice instead. That fits what BG-112 found across all trades: Perplexity attached almost no facts of any kind, years in business, certifications or awards, to the firms it named.</p>

  <p>So the same question gets two kinds of answer. On four engines a buyer with a truck crash can see, next to a firm's name, that it handles truck crashes. On Perplexity the buyer is told that case type matters and is left to find out which firm handles what.</p>

  <h2>What this means for a personal injury firm</h2>

  <p>When an engine described a firm, it described it in the language of case types, and it used the same handful most of the time: car accidents, wrongful death, premises liability, medical malpractice, truck crashes. The narrower types, dog bites, nursing home neglect, rideshare crashes, appeared in a minority of answers. A firm that focuses on one of those cannot assume an engine will mention it.</p>

  <div class="callout teal">
    <div class="callout-label">What to do with this</div>
    <p>Ask the five engines who the best personal injury lawyers in your city are, and write down the case types each one attaches to your firm and to the firms named next to you. If an engine lists your firm with case types you do not handle, or leaves out the one you are known for, that is the gap to look at.</p>
    <p>On your own site, give each case type you take its own page in plain words, with the results you can state publicly, and use the same names buyers use: truck accident, wrongful death, medical malpractice. This study cannot show that doing so changes which firms an engine names or what it says about them. It shows that four of five engines describe firms by case type, and which case types they reach for.</p>
  </div>""",
))

ARTICLES_DAILY.append(dict(
    slug="bg-119", bid="BG-119", date="2026-11-12", date_label="November 12, 2026", read=6,
    tags=["Original Research", "US Cities", "Austin"],
    title="AI Visibility in Austin: Three Engines Agree on Home Builders, Not on Lawyers",
    h1="AI Visibility in Austin: Three Engines Agree on <em>Home Builders, Not Lawyers</em>",
    h1_plain="AI Visibility in Austin: Three Engines Agree on Home Builders, Not Lawyers",
    subtitle="We asked ChatGPT, Claude and Gemini six local buyer questions about Austin. Across the six, only 16 firms were named by all three engines, and 12 of them were home builders. No personal injury firm, real estate agent or startup law firm made all three lists.",
    meta_desc="What ChatGPT, Claude and Gemini recommend in Austin: 18 answers to six local buyer questions, and the 16 firms all three engines named, 12 of them home builders.",
    og_desc="Six Austin buyer questions, three AI engines, 18 answers: the firms all three named, and the questions where they named nobody in common.",
    ld_desc="BrandGEO study of 18 answers from ChatGPT, Claude and Gemini to six Austin buyer questions (personal injury, real estate agents, property management, immigration, startup law, home builders), collected November 6, 2026, counting the firms all three engines named.",
    keywords="ai visibility austin, chatgpt austin home builders, best home builders austin ai, austin law firms ai search, austin property management ai, local business ai recommendations austin",
    about=["AI Visibility Research", "Austin", "Local Search", "Engine Comparison"],
    findings=[("16", "firms were named by all three engines across six Austin questions"),
              ("12 of 38", "home builders named by any engine were named by all three"),
              ("0", "personal injury firms, real estate agents or startup law firms on all three lists"),
              ("2", "property managers named by all three: 1836 Property Management and Keyrenter")],
    faq=[("Which Austin businesses do AI engines agree on?",
          "In our November 6, 2026 answers, all three engines named 12 home builders, 2 property managers and 2 immigration firms. On personal injury, real estate agents and startup law, no firm appeared in all three answers."),
         ("Does being named by one engine mean the others name you?",
          "No. Of 38 home builders the three engines named, 23 were named by one engine only. Each engine has to be checked on its own."),
         ("How were the firms counted?",
          "We took every name an engine put in bold, then checked by hand whether each of the three answers to the same question named that firm anywhere, in bold or in running text. Labels such as advice headings were removed."),
         ("Is this a ranking of Austin firms?",
          "No. It counts what three engines wrote on one day. It does not say which firm is better, and it does not say why an engine named one firm and not another.")],
    related=[("/bg-016.html", "BG-016", "Cross-Engine Consensus: When AI Engines Agree, and When They Don't",
              "The wider study of when engines name the same firm."),
             ("/bg-113.html", "BG-113", "How Often AI Engines Put a National Brand Next to Local Property Managers",
              "What happens in property management answers across 20 cities."),
             ("/ai-visibility-for-losangeles.html", "Los Angeles", "AI Visibility in Los Angeles",
              "The same kind of city read, for Los Angeles.")],
    cta_h="See what each engine says about your Austin business",
    cta_p="Run the free audit on your own domain and read every engine's answer side by side. No signup and no card.",
    og=dict(
        fname="og-bg-119.png",
        kicker="BG-119 · Original Research",
        lines=[[("AI Visibility", "w")], [("in ", "w"), ("Austin", "g")]],
        sub=["Six buyer questions, three engines,",
             "18 answers, November 2026."],
        stats=[("16", "firms named by all three engines", "Austin"),
               ("12 of 38", "home builders on all three lists", "Austin"),
               ("0", "personal injury firms on all three", "Austin"),
               ("2", "property managers on all three", "Austin")],
        footer="Builders Agree, Lawyers Do Not",
    ),
    body="""  <p>Ask three AI engines the same question about Austin and you get three lists. We wanted to know how much those lists overlap, because a business that appears on only one of them is invisible to buyers who use the other two.</p>

  <p>On November 6, 2026 we put six local buyer questions about Austin to ChatGPT, Claude and Gemini: a personal injury law firm, real estate agents, a property management company, an immigration lawyer, a technology startup law firm and a home builder. Then we counted the firms that all three engines named.</p>

  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>18 answers: six questions, three engines (ChatGPT on gpt-5.5, Claude on claude-sonnet-4-6, Gemini on gemini-2.5-flash), all collected on November 6, 2026. We took every name an engine put in bold, then read each of the three answers to the same question to see whether it named that firm anywhere, in bold or in running text. Headings and advice labels were removed. Firms named after a person are reported as a count, not by name.</p>
    <p>An exact match on bold text alone finds only 6 firms on all three lists, because engines shorten names and Claude grouped several builders in one line. The hand read finds 16. This is one day of answers. It does not rank anyone and it does not say why an engine chose a firm.</p>
  </div>

  <h2>Where the three engines agree</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Question</th><th>Firms named by all three engines</th></tr></thead>
    <tbody>
      <tr><td>Best home builders in Austin</td><td>12</td></tr>
      <tr><td>Top-rated property management companies in Austin</td><td>2</td></tr>
      <tr><td>Best immigration lawyers in Austin</td><td>2</td></tr>
      <tr><td>Best personal injury law firms in Austin</td><td>0</td></tr>
      <tr><td>Best real estate agents for buying a home in Austin</td><td>0</td></tr>
      <tr><td>Best technology startup law firms in Austin</td><td>0</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>16</strong></td></tr>
    </tbody>
  </table>
  </div>

  <p>Three of the six questions produced no firm in common at all. Each engine named several personal injury firms, agents and startup lawyers; the lists did not meet. On the startup law question two firms were named by two engines each, never by the third.</p>

  <h2>Home builders: the one question where the lists overlap</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th><th>All three answers together</th></tr></thead>
    <tbody>
      <tr><td>Home builders named</td><td>20</td><td>16</td><td>29</td><td>38 different builders</td></tr>
    </tbody>
  </table>
  </div>

  <p>Of the 38 builders, 12 were named by all three engines, 3 by two and 23 by one engine only. The twelve include Coventry Homes, Highland Homes, Lennar, Meritage Homes and United Built Homes, plus seven builders that carry a founder's or family name. Gemini gave the longest list, 29 builders, and 14 of them appeared in no other engine's answer.</p>

  <p>So even here, where agreement is strongest, most builders an Austin buyer could hear about depend on which engine they ask.</p>

  <h2>Property management and immigration</h2>

  <p>All three engines named <strong>1836 Property Management</strong> and <strong>Keyrenter Property Management Austin</strong> (Gemini wrote "Keyrenter Austin"). ChatGPT and Claude shared two more property managers that Gemini did not mention.</p>

  <p>For immigration lawyers, two practices appeared in all three answers. Both carry their attorneys' names. In one case Gemini named the attorney rather than the firm, while ChatGPT and Claude named the firm, which is a small reminder that an engine may know you by a person's name and not by your brand.</p>

  <h2>Why counting bold names is not enough</h2>

  <p>Most AI visibility tools, ours included, start by reading the names an engine puts in bold. On these 18 answers that alone finds 6 firms on all three lists; reading the answers finds 16. The gap comes from how engines write names. Claude put "Lennar &amp; D.R. Horton" in a single bold line and did the same with five more builders in two other lines, so a tool reading one name per bold line misses six builders that Claude did name. Gemini wrote "Keyrenter Austin" where the other two wrote "Keyrenter Property Management Austin". And in one immigration answer the firm appears only through its attorney's name.</p>

  <p>For a business owner checking their own visibility, the lesson is simple: search the full answer for your name and its variants, not only the highlighted list.</p>

  <h2>How each engine answered</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th></th><th>ChatGPT</th><th>Claude</th><th>Gemini</th></tr></thead>
    <tbody>
      <tr><td>Average stored answer length, characters</td><td>4,394</td><td>2,826</td><td>4,295</td></tr>
      <tr><td>Bold spans across the six answers</td><td>164</td><td>105</td><td>115</td></tr>
    </tbody>
  </table>
  </div>

  <p>ChatGPT bolded the most, but not every bold span is a firm: 21 of its 164 contain a digit (a rating, a review count or a number inside a label), and others are advice labels. Claude's stored answers stop at about 3,800 characters, so its length is a lower bound. Gemini's longest answer was the home builder one, where it named 29 builders.</p>

  <h2>What does not show up</h2>

  <p>No personal injury firm made all three lists, and no real estate agent did either. Each engine named several firms or agents for both questions; the names did not repeat from one engine to the next. For a firm in those categories, being on one engine's list says little about the other two. <a href="/bg-016.html">BG-016</a> looks at when engines agree in general.</p>

  <div class="callout teal">
    <div class="callout-label">What an Austin business should do</div>
    <p>Ask each engine your own buyer question, by name of your trade and "Austin", and note which list you are on. Treat the three as separate channels: in five of six categories here, no firm was on all of them.</p>
    <p>Check how each engine writes your name. If one engine knows you by a founder's name, a shortened brand or an old firm name, make the same name appear on your site, your directory profiles and your Google Business Profile, so every engine can match it to you.</p>
  </div>""",
))
