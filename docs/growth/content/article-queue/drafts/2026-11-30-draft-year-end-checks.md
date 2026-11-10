# Draft: five things a local firm should check in AI answers before the new year

- Queue key: `draft-year-end-checks`
- Publish on: 2026-11-30 (queue row `ready from 2026-11-30`)
- Type: practical
- Written 2026-11-06 in a separate session. No new data and no web source: every figure
  is copied as published from BG-106, BG-108, BG-109, BG-110 and BG-112
  (scripts/articles_content_daily.py, read 2026-11-06). Checked against BG-081 (a spot
  check of competitors) and BG-103 (brand fact accuracy for a brand) so it does not repeat
  them: this is the local professional version, one check per finding.
- Slug and date: the routine replaces every `bg-NNN` and `BG-NNN` with the next slug and
  sets `date` and `date_label` to the publish day. Nothing else is to be rewritten.

## Figures used, as published

| Check | Figure | Article |
|---|---|---|
| Directories | 66% of 591 answers named a platform; Super Lawyers 125, Best Lawyers 101, Avvo 89, Justia 65, AILA 44; Zillow 39 of 98 agent answers; RealTrends 20, FastExpert 19, HomeLight 18; Expertise.com 28, BBB 24, Google reviews 23, Yelp 21 of 99 property management answers | BG-106 |
| Ratings | 186 of 591 answers quoted a rating or review count; 86% of ratings quoted were 4.5 or higher; 5 of 267 below 4.0; property management 65 of 99 | BG-108 |
| Address and phone | Google AI Mode gave a street address in 77 of 111; Gemini 0 of 120; ChatGPT's 4 phone numbers were court, referral or legal aid lines; immigration 35 of 98 carried an address or phone | BG-109 |
| Fees | 25 of 591 quoted a fee percentage, 20 of them property management; 64 personal injury answers mentioned contingency fees, 3 gave a percentage | BG-110 |
| Cities | 17 of 20 cities had a property management answer naming a national brand, 3 had none | BG-113 |
| Firm facts | tenure in 269 of 591; median figure quoted 30 years; 48 quoted combined years; personal injury dollar figures 51 of 98; real estate counts 46 of 98; property management ownership 32 of 99 | BG-112 |

## Check before publishing

None needed beyond the routine's own validation: all linked pages exist on brandgeo/web
at the time of writing.

## Entry

```python
ARTICLES_DAILY.append(dict(
    slug="bg-NNN", bid="BG-NNN", date="2026-11-30", date_label="November 30, 2026", read=6,
    tags=["How To", "Local Professionals", "AI Answers"],
    title="Five Things a Local Firm Should Check in AI Answers Before the New Year",
    h1="Five Things to Check in <em>AI Answers</em> Before the New Year",
    h1_plain="Five Things to Check in AI Answers Before the New Year",
    subtitle="Our eight studies of 591 AI answers to local buyer questions each found one thing engines repeat about local firms: the directories they point to, the ratings they quote, addresses, fees and plain facts. Here is each one turned into a check you can run in about ten minutes.",
    meta_desc="Five checks for law firms, agents and property managers: directories, ratings, address, fees and firm facts that AI engines repeat, from 591 answers in 20 US cities.",
    og_desc="Directories, ratings, addresses, fees and firm facts: what AI engines repeat about local firms, from 591 answers, turned into five checks for the end of the year.",
    ld_desc="BrandGEO checklist for local professional firms, built from published BrandGEO studies of 591 AI answers to local buyer questions across 20 US cities, covering directories, star ratings, contact details, fees and firm facts.",
    keywords="check ai answers local business, ai visibility checklist law firm, what does chatgpt say about my business, ai search checklist property manager, local firm ai answers audit, year end ai visibility check",
    about=["AI Visibility", "Local Search", "Professional Services", "Checklist"],
    findings=[("66%", "of 591 AI answers named a directory, review site or professional body: check your profile on the ones named in your category"),
              ("86%", "of the star ratings engines quoted were 4.5 or higher: check the one quoted for you matches today's"),
              ("77 of 111", "Google AI Mode answers printed a street address: check yours is current"),
              ("269 of 591", "answers stated how long a firm had operated: check your founding year is the same everywhere")],
    faq=[("How do I check what AI engines say about my firm?",
          "Ask two or three engines the question your buyers ask, in your city, the way they would phrase it. Then read each answer for five things: the directories it names, any rating it quotes, any address or phone number, any fee, and any fact about how long a firm has operated or what it has achieved."),
         ("Which engines should I check?",
          "At least ChatGPT and Google AI Mode, because they behave most differently in our data. Google AI Mode gave a street address in 77 of 111 answers and ChatGPT in 2 of 120, while ChatGPT gave vetting advice in 83 of 120 answers and Google AI Mode in 8 of 111."),
         ("What if an engine quotes something wrong about my firm?",
          "Fix it at the source the engine is likely reading: your own website first, then the directory and review profiles named for your category. We cannot promise an engine will update on a given date, but an error left in place is the one most likely to be repeated."),
         ("Is this the same as checking whether competitors outrank me?",
          "No. BG-081 covers that spot check. This one is about whether the facts written next to your name, or next to firms like yours, are right.")],
    related=[("/bg-081.html", "BG-081", "A 10-Minute Way to Check If Your Competitors Outrank You in AI Answers",
              "The companion check: who shows up instead of you."),
             ("/bg-103.html", "BG-103", "How to Check Whether ChatGPT, Gemini and Claude Describe Your Brand Accurately",
              "The same idea for a brand's key facts."),
             ("/bg-106.html", "BG-106", "The Directories AI Engines Name When They Recommend Local Professionals",
              "Check one in full: the platforms by profession.")],
    cta_h="Run all five checks at once",
    cta_p="Run the free audit on your own domain and read every engine's answer to your buyers' questions in one place. No signup and no card.",
    og=dict(
        fname="og-bg-NNN.png",
        kicker="BG-NNN · How To",
        lines=[[("Five Checks", "w")], [("Before the ", "w"), ("New Year", "g")]],
        sub=["What AI engines repeat about local firms,",
             "from 591 answers in 20 US cities."],
        stats=[("66%", "of answers named a directory or review site", "BG-106"),
               ("86%", "of quoted ratings were 4.5 or higher", "BG-108"),
               ("77 of 111", "AI Mode answers printed an address", "BG-109"),
               ("269", "answers said how long a firm had operated", "BG-112")],
        footer="Ten Minutes, Five Checks",
    ),
    body="""  <p>Over the past weeks we published eight studies on what AI engines say when someone asks for a local lawyer, agent or property manager. Each one found something the engines repeat about firms. Five of those findings turn directly into a check you can run on your own firm before the year ends.</p>

  <p>You need about ten minutes, somewhere to save the answers, two or three AI engines, and the question your buyers actually ask, in your city.</p>

  <div class="callout">
    <div class="callout-label">Where these checks come from, and what they cannot tell you</div>
    <p>Each check rests on one of our studies of the same 591 answers: six local buyer questions in each of 20 US cities, answered by ChatGPT, Claude, Gemini, Perplexity and Google AI Mode on July 24 and 25, 2026. The numbers below are as published in those studies. They describe what engines wrote, not how they choose firms, so none of these checks promises that you will be recommended. They make sure that what engines say about you, when they do, is right.</p>
  </div>

  <h2>Before you start</h2>

  <p>Write the question the way a buyer would: "best personal injury lawyer in Tampa", "property management company in Denver for a single family home". Ask it in ChatGPT and in Google's AI Mode at least, because in our data they behave most differently. Save each answer. Then go through the five checks.</p>

  <h2>1. The directories named for your category</h2>

  <p>In <a href="/bg-106.html">BG-106</a>, 66% of answers named a third-party platform. Which one depended on the profession.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>If you are</th><th>Platforms the engines named most</th></tr></thead>
    <tbody>
      <tr><td>A lawyer</td><td>Super Lawyers (125 answers), Best Lawyers (101), Avvo (89), Justia (65); AILA for immigration (44)</td></tr>
      <tr><td>A real estate agent</td><td>Zillow (39 of 98 agent answers), plus agent ranking sites such as RealTrends (20 answers), FastExpert (19) and HomeLight (18)</td></tr>
      <tr><td>A property manager</td><td>Expertise.com (28 of 99), the BBB (24), Google reviews (23), Yelp (21)</td></tr>
    </tbody>
  </table>
  </div>

  <p><strong>Check:</strong> open your profile on each platform named in the answers you saved. Is it there, complete, and saying the same thing as your website?</p>

  <h2>2. The rating quoted next to your name</h2>

  <p>In <a href="/bg-108.html">BG-108</a>, 186 of 591 answers quoted a star rating or review count, and for property management it was 65 of 99. Of the ratings quoted, 86% were 4.5 or higher and only 5 of 267 were below 4.0.</p>

  <p><strong>Check:</strong> if an answer quotes a rating for you, compare it with your current rating on that platform. If an answer quotes ratings for competitors and not for you, look at where those ratings come from and whether your profile there has enough recent reviews to be quoted.</p>

  <h2>3. The address and phone number</h2>

  <p>In <a href="/bg-109.html">BG-109</a>, Google AI Mode printed a street address for a named firm in 77 of 111 answers. Gemini printed none. When ChatGPT gave phone numbers, all four belonged to courts, referral services or legal aid lines, not firms. Immigration answers were the most likely to carry contact details, 35 of 98.</p>

  <p><strong>Check:</strong> in the AI Mode answer especially, is your address the current one? If you moved or added an office this year, check that your Google Business Profile, your site and the directories above all show it.</p>

  <h2>4. What engines say about fees</h2>

  <p>In <a href="/bg-110.html">BG-110</a>, only 25 of 591 answers quoted a fee percentage, and 20 of those were about property management. Engines explained how firms charge far more often than they put a number on it: 64 personal injury answers mentioned contingency fees, and 3 gave a percentage.</p>

  <p><strong>Check:</strong> if you are a property manager, look for the management fee quoted in the answers and compare it with yours. Whatever your profession, make sure your own site states how you charge in plain words, so the engine's general explanation is not the only one a buyer reads.</p>

  <h2>5. The plain facts about your firm</h2>

  <p>In <a href="/bg-112.html">BG-112</a>, 269 answers said how long a firm had been operating, and the median figure quoted was 30 years. Each profession had its own proof: dollar amounts recovered for injury firms (51 of 98 answers), sales counts for agents (46 of 98), ownership for property managers (32 of 99).</p>

  <p><strong>Check:</strong> is your founding year the same on your site, your Google profile and your directory listings? Are the numbers your profession is described by, such as money recovered or homes sold, stated somewhere an engine can read them, with a date?</p>

  <h2>What to do with what you find</h2>

  <p>Fix errors at the source: your website first, then the profiles in check 1. Write down what each engine said and the date, and run the same checks again in a few months. AI answers vary from run to run, so a single answer is a sample, not a verdict, and a second sample tells you more than a perfect first one.</p>

  <p>If you have offices in more than one city, run the checks for each. Answers differ by place as well as by engine: in <a href="/bg-113.html">BG-113</a>, 17 of our 20 cities had at least one property management answer naming a national brand, and 3 had none.</p>

  <div class="callout teal">
    <div class="callout-label">The short version</div>
    <p>Ask two engines your buyers' question. Then check five things: the directories they name, the rating they quote, your address, what they say about fees, and the facts they attach to firms like yours. Correct anything wrong where the engine is likely to read it, and check again in the new year.</p>
  </div>""",
))
```
