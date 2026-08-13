# -*- coding: utf-8 -*-
"""Content for BG-027 to BG-034, the bilingual AI visibility series.

EVERY NUMBER IN THIS FILE CAME OUT OF `ai_results`, NOT OUT OF A BRIEF.

  Source: clients research-berlin (11), research-madrid (12), research-paris
  (14) and research-rome (15). One collection run, 2026-07-10. Each city was
  given 8 prompts: 4 commercial categories asked twice, once in the local
  language and once in English, so language is the only variable that moves.

  The aggregate figures were computed in SQL over that table:
    486 distinct companies named, 87 in both languages, 206 local only,
    193 English only  ->  82.1% appeared in one language only
    46 comparable engine/category pairs, 15.9% Jaccard overlap,
    13 of those 46 pairs shared zero names
    Per city one-language-only: Berlin 88.5, Paris 81.1, Rome 81.2, Madrid 74.7
    Per city Jaccard: Berlin 8.9, Paris 15.3, Rome 18.0, Madrid 23.2
    Per engine Jaccard: Claude 12.1 (16 pairs), Meta 16.8 (11),
                        Gemini 16.7 (3), Perplexity 18.7 (16)

  A "comparable pair" requires BOTH sides to be non-empty. Pairs where one
  language returned no extractable names are excluded, because an extraction
  failure is not a language finding. That exclusion makes the headline
  SMALLER, not larger.

FOUR ENGINES, NOT FIVE, AND ONE OF THEM IS RETIRED

  ChatGPT returned status='error' on all 32 prompts in that run, so it is
  absent. Meta AI was retired from the product on 2026-07-16, AFTER this run.
  Its rows stay in because deleting a measurement to match a later product
  decision would falsify the record. Every article says so.

NAMES WERE HAND FILTERED

  Competitor extraction is regex over the answer text. It picks up booking
  platforms, directories, neighbourhood names and street addresses. Anything
  that is not a company was removed before a name reached this file. The list
  of what was removed is published in the articles rather than hidden.
"""

# Shared limitation block. One string, so it cannot drift between articles.
LIMITS = """  <div class="callout">
    <div class="callout-label">How this was measured, and what it cannot tell you</div>
    <p>One collection run, <strong>10 July 2026</strong>. Four cities, four commercial categories each, every category asked twice: once in the local language and once in English, with nothing else changed. Four engines answered: <strong>Claude, Gemini, Perplexity and Meta AI</strong>. ChatGPT returned an API error on all 32 prompts that day and is absent rather than reported as a zero.</p>
    <p>Meta AI was retired from BrandGEO on 16 July 2026, after this run. Its answers stay in the dataset because removing a measurement to match a later product decision would falsify the record. Gemini's answers were frequently unparseable for company names, so it appears in fewer comparisons than the other three and is never ranked on its own.</p>
    <p>This is a single snapshot, not a trend. Company names were extracted by pattern matching and then filtered by hand: booking platforms, directories, neighbourhood names and street addresses were removed. A name appearing here means an engine printed it on that day, not that the company is good.</p>
  </div>"""

CTA_H = "See which language your customers find you in"
CTA_P = "Run your own domain through the same engines this study used. You get the answer on screen, in the language you choose, with no signup and no card."

_R_FLAG = ("/bg-027.html", "BG-027", "The Two Language Study",
           "The full cross-city result: 486 companies, and 82% of them showed up in only one of the two languages.")
_R_ENGINE = ("/bg-032.html", "BG-032", "Which Engine Changes Its Answer Most",
             "Claude rewrote its list almost completely between languages. Perplexity held on to the most names.")
_R_HOWTO = ("/bg-033.html", "BG-033", "How to Check Your Own Brand in Two Languages",
            "The same test this research ran, reduced to something you can do yourself in about ten minutes.")
_R_CHECK = ("/bg-034.html", "BG-034", "The Multilingual AI Visibility Checklist",
            "Nine things on your site that decide whether an engine can answer about you in a second language.")
_R_014 = ("/bg-014.html", "BG-014", "Why Your Brand Might Be Invisible to AI Outside English",
          "The earlier piece that raised the question this study set out to measure.")
_R_016 = ("/bg-016.html", "BG-016", "Cross-Engine Consensus",
          "When engines agree and when they do not, read from the same collection pipeline.")
_R_021 = ("/bg-021-retrieval-not-engine-count.html", "BG-021", "Retrieval, Not Engine Count",
          "Why an engine that answers from memory instead of looking is not worth counting.")

ARTICLES = []

# ---------------------------------------------------------------- BG-027
ARTICLES.append(dict(
    slug="bg-027", bid="BG-027", date="2026-08-01", date_label="August 1, 2026", read=8,
    tags=["Multilingual", "Original Research", "Europe"],
    title="We Asked AI the Same Question in Two Languages. 82% of the Companies It Named Appeared in Only One",
    h1="We Asked AI the Same Question in Two Languages. <em>82%</em> of the Companies It Named Appeared in Only One",
    h1_plain="We Asked AI the Same Question in Two Languages. 82% of the Companies It Named Appeared in Only One",
    subtitle="Four European cities, four commercial categories each, every question asked once in the local language and once in English. Of 486 companies the engines named, 399 appeared in one language and never in the other. Your AI visibility is not one number. It is one number per language.",
    meta_desc="Original research across Berlin, Madrid, Paris and Rome: AI engines named 486 companies, and 82.1% appeared in only one of the two languages asked. Overlap between the local-language answer and the English answer was 15.9%.",
    og_desc="486 companies named across four European cities. 87 appeared in both languages. 399 appeared in only one. If you measure your AI visibility in English only, you are measuring a different market from the one your customers are asking in.",
    ld_desc="A paired-prompt study across Berlin, Madrid, Paris and Rome measuring how much AI engine recommendations change when the same commercial question is asked in the local language instead of English.",
    keywords="multilingual AI visibility, AI search in other languages, English vs local language AI results, generative engine optimization Europe, AI brand visibility German French Spanish Italian, GEO multilingual strategy",
    about=["Generative Engine Optimization", "Multilingual Search", "AI Visibility Measurement", "European Markets"],
    findings=[("82.1%", "of the 486 companies named appeared in only one of the two languages"),
              ("15.9%", "overlap between the local-language answer and the English answer"),
              ("13 of 46", "engine and category pairs shared not a single company name"),
              ("4", "engines answered: Claude, Gemini, Perplexity and Meta AI")],
    faq=[("Do AI engines give different answers in different languages?",
          "Yes, and the difference is large. Across four European cities, 82.1% of the 486 companies named by AI engines appeared in only one of the two languages tested. The local-language answer and the English answer shared 15.9% of their named companies. In 13 of 46 engine and category comparisons, the two answers had no company in common at all."),
         ("Should I measure my AI visibility in English or in my local language?",
          "Both, and separately. Treating them as one number hides the gap. A company that ranks well in English can be entirely absent from the local-language answer, which is the one most of its domestic customers will actually see."),
         ("Which is better to appear in, the local language or English?",
          "Neither is universally better. It depends on who buys from you. Local-language answers tended to surface domestic independents and smaller firms; English answers tended to surface international chains and global brands. If your buyers are domestic, the local-language answer is the one that matters."),
         ("How was this study run?",
          "Four cities, four commercial categories each, asked twice with only the language changed, on 10 July 2026. Four engines answered: Claude, Gemini, Perplexity and Meta AI. ChatGPT errored on every prompt that day and is excluded rather than reported as zero.")],
    related=[_R_ENGINE, _R_HOWTO, _R_014],
    cta_h=CTA_H, cta_p=CTA_P,
    body="""  <p>Most AI visibility tooling, ours included until recently, reports a single number per brand. One score, one list of the engines that mention you, one competitor set. That number quietly assumes something that turns out to be false: that the answer an engine gives is a property of your brand, rather than a property of your brand <em>and the language the question was asked in</em>.</p>

  <p>So we tested it. Four European cities. Four real commercial categories in each. Every category asked twice, once in the local language and once in English, with nothing else changed: same day, same engines, same market setting, same phrasing translated as directly as the two languages allow.</p>

  <p><strong>The engines named 486 distinct companies. 87 of them appeared in both languages. 399 appeared in one and never in the other.</strong></p>

""" + LIMITS + """

  <h2>The headline number, and the more careful one</h2>

  <p>82.1% of companies appearing in only one language is the number that gets attention, but it counts every company once no matter how marginal its mention. The stricter measure compares each engine's answer to its own answer in the other language, category by category, and asks what share of the combined list the two have in common.</p>

  <p>That gives <strong>15.9%</strong>. Across 46 comparable engine and category pairs, the local-language answer and the English answer agreed on about one company in six. <strong>Thirteen of those 46 pairs shared nothing at all.</strong> Same engine, same question, same day, two languages, zero companies in common.</p>

  <p>A pair only counts as comparable when both sides returned at least one extractable company name. Where one side came back empty, we dropped the pair rather than scoring it as total disagreement, because an extraction failure is not a language finding. That choice makes the headline smaller than it would otherwise be.</p>

  <h2>City by city</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>City</th><th>Language pair</th><th>Companies named</th><th>In one language only</th><th>Answer overlap</th></tr></thead>
    <tbody>
      <tr><td>Berlin</td><td>German and English</td><td>139</td><td>88.5%</td><td>8.9%</td></tr>
      <tr><td>Paris</td><td>French and English</td><td>127</td><td>81.1%</td><td>15.3%</td></tr>
      <tr><td>Rome</td><td>Italian and English</td><td>133</td><td>81.2%</td><td>18.0%</td></tr>
      <tr><td>Madrid</td><td>Spanish and English</td><td>87</td><td>74.7%</td><td>23.2%</td></tr>
    </tbody>
  </table>
  </div>

  <p>Berlin is the extreme case and Madrid the mildest, and the spread between them is not random. It tracks something you can act on.</p>

  <h2>The pattern underneath: who each language surfaces</h2>

  <p>Reading the actual lists rather than the totals, the same shape appears in city after city. <strong>The local language surfaces domestic independents. English surfaces international brands.</strong></p>

  <p>In Paris we asked for wealth management advisors. The French question returned <em>Cheval Blanc Patrimoine, Agora Finance, Scala Patrimoine, Auguste Patrimoine, Prosper Conseil, Noun Partners, Haussmann Patrimoine</em>: French independents, several of them small. The English question returned <em>UBS Wealth Management, J.P. Morgan Private Bank, Lombard Odier, Mirabaud, Banque de Luxembourg, Quilvest</em>: global private banks. Six names appeared in both, and every one of them was a large institution with an established English-language presence, such as Amundi, Pictet and Rothschild &amp; Co.</p>

  <p>In Berlin we asked for employment lawyers. The German question returned individual named lawyers and small practices: <em>Rechtsanwalt Andreas Martin, HENSCHE Rechtsanwälte, Bechert Rechtsanwälte, Gröning Rechtsanwälte</em>. The English question returned large commercial firms: <em>CMS Deutschland, Beiten Burkhardt, GÖRG, Pusch Wahlig Workplace Law</em>. Ask in German and you are handed a person. Ask in English and you are handed a firm.</p>

  <p>In Rome we asked for restaurants for a business dinner. Italian returned <em>Trapizzino, Supplizio, Osteria Fratelli Mori, Glass Hostaria, Alla Bottega</em>. English returned <em>La Pergola, Salumeria Roscioli, Pierluigi, Dal Bolognese, Enoteca la Torre</em>: the internationally famous ones.</p>

  <h2>Why Madrid was the mildest, and what that tells you about your own category</h2>

  <p>Madrid's four categories included one that behaved completely differently from everything else in the study: hotels near Madrid-Barajas airport. Crowne Plaza, Hilton, Barajas Plaza, Clement Barajas, Maydrit, Ibis and Meliá were named in <strong>both</strong> languages. That single category is most of why Madrid's overlap is 23.2% rather than Berlin's 8.9%.</p>

  <p>The reason is not linguistic. It is that the category is dominated by international chains whose names are identical in every language, whose websites exist in several languages, and which are described in the same terms by the same sources whichever language you read them in. There is nothing for the language to change.</p>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p><strong>Chain-dominated categories converge across languages. Independent-dominated categories diverge.</strong> The more your market is made of local operators rather than international brands, the more your AI visibility splits in two, and the more an English-only measurement misleads you.</p>
    <p>Which is exactly backwards from where the attention goes. The independent restaurant, the local law firm and the regional agency have the most to lose from this effect and are the least likely to be measuring it.</p>
  </div>

  <h2>What this means if you sell in a non-English market</h2>

  <p>Three things follow, and none of them require you to accept our numbers on faith. You can reproduce all of this against your own brand.</p>

  <ol>
    <li><strong>An English-only measurement is a measurement of a different market.</strong> If your buyers ask in German, the German answer is your answer. The English one describes a market you may not sell into.</li>
    <li><strong>Being absent from one language is not a small gap.</strong> In 13 of 46 comparisons the two answers had nothing in common, which means the set of companies competing for the recommendation was completely different. You are not ranked lower in the other language. You are in a different contest.</li>
    <li><strong>Your competitor set changes with the language too.</strong> The firms you benchmark against in English may never appear when a domestic customer asks in their own language, and the ones that do appear may not be on your radar at all.</li>
  </ol>

  <h2>What we are not claiming</h2>

  <p>This is one run on one day across four cities and sixteen category-language pairs. It is enough to establish that the effect is large and consistent in direction; it is not enough to put a number on how large the effect is for your category, in your country, this month. Engines change. A second run would give different names.</p>

  <p>It also cannot tell you <em>why</em> an engine chose what it chose. We can see that the German answer named individual lawyers and the English answer named large firms. We cannot see whether that is a property of what those firms publish, of what sources the engine reached for, or of how the model represents the question. Anyone who tells you they know which, on this evidence, is guessing.</p>

  <p>What it is enough for is a decision: <strong>measure both languages separately, starting now.</strong> The cost of finding out is a couple of minutes.</p>""",
))

# ---------------------------------------------------------------- BG-028
ARTICLES.append(dict(
    slug="bg-028", bid="BG-028", date="2026-08-01", date_label="August 1, 2026", read=6,
    tags=["Germany", "Original Research", "Multilingual"],
    title="Ask AI in German, Get a Lawyer. Ask in English, Get a Law Firm",
    h1="Ask AI in German, Get a Lawyer. Ask in English, Get a <em>Law Firm</em>",
    h1_plain="Ask AI in German, Get a Lawyer. Ask in English, Get a Law Firm",
    subtitle="Berlin had the widest language gap of the four European cities we measured. The German and English answers to the same commercial question shared 8.9% of the companies they named. In the sharpest category they shared almost nothing, and the difference was not random.",
    meta_desc="AI visibility in Germany: German-language and English-language answers to the same Berlin business question shared only 8.9% of named companies. German surfaced individual lawyers and small practices, English surfaced large commercial firms.",
    og_desc="139 companies named across four Berlin categories. 88.5% appeared in only one language. The German answer named individual Rechtsanwälte; the English answer named CMS, GÖRG and Beiten Burkhardt.",
    ld_desc="Measured results showing how AI engine recommendations for Berlin businesses change between German-language and English-language prompts, including the split between individual practitioners and large firms.",
    keywords="AI Sichtbarkeit Deutschland, AI visibility Germany, German AI search results, ChatGPT German business recommendations, GEO Deutschland, AI brand visibility Berlin, generative engine optimization German",
    about=["Generative Engine Optimization", "Germany", "Multilingual Search", "AI Visibility Measurement"],
    findings=[("8.9%", "overlap between the German answer and the English answer, the lowest of four cities"),
              ("88.5%", "of the 139 companies named appeared in only one language"),
              ("4 of 11", "engine and category pairs shared no company at all"),
              ("2", "companies named by multiple engines in one language and by none in the other")],
    faq=[("Do AI engines recommend different German companies in German than in English?",
          "Yes. Across four Berlin business categories, the German-language and English-language answers shared only 8.9% of the companies they named, and 88.5% of the 139 companies named appeared in only one of the two languages."),
         ("Why does the German answer name individual lawyers and the English answer name large firms?",
          "That is what was measured, in the employment law category: German prompts returned individually named Rechtsanwälte and small practices, English prompts returned large commercial firms such as CMS Deutschland, GÖRG and Beiten Burkhardt. The measurement shows the pattern; it cannot show the cause."),
         ("Should a German business track its AI visibility in German or English?",
          "In German, if its customers are German. An English-only measurement in this study described a substantially different set of companies, and in four of eleven comparisons the two answers had no company in common.")],
    related=[_R_FLAG, _R_HOWTO, _R_CHECK],
    cta_h=CTA_H, cta_p=CTA_P,
    body="""  <p>Of the four European cities in our bilingual study, Berlin produced the widest gap between what AI engines say in the local language and what they say in English. The two answers to the same question, asked on the same day of the same engines, shared <strong>8.9%</strong> of the companies they named. Across all four categories, <strong>88.5% of the 139 companies named appeared in only one language.</strong></p>

  <p>The interesting part is not the size of the gap. It is that the gap has a shape.</p>

""" + LIMITS + """

  <h2>Employment lawyers: two completely different kinds of answer</h2>

  <p>We asked, in German, <em>Beste Arbeitsrechtsanwälte in Berlin</em>. Then, in English, <em>Best employment lawyers in Berlin</em>.</p>

  <p>The German answers named individual practitioners and small practices. Among them: <strong>Rechtsanwalt Andreas Martin, HENSCHE Rechtsanwälte, Bechert Rechtsanwälte, Gröning Rechtsanwälte, Rechtsanwalt Benjamin Stumpp, Rechtsanwalt Philipp Kitzmann</strong>. Several answers named a specific person rather than an organisation.</p>

  <p>The English answers named large commercial firms: <strong>CMS Deutschland, Beiten Burkhardt, GÖRG Partnerschaft von Rechtsanwälten, Pusch Wahlig Workplace Law, Schlun &amp; Elseven</strong>.</p>

  <p>Two names survived the language change: <strong>Pascal Croset</strong> and <strong>Kliemt Arbeitsrecht</strong>. Everything else in one list was absent from the other.</p>

  <div class="callout">
    <div class="callout-label">What was removed before counting</div>
    <p>Both languages produced non-companies that our extractor picked up and we took out by hand: the Arbeitsgericht Berlin (the labour court), the Rechtsanwaltskammer Berlin and the Berlin Bar (professional bodies), a Best Lawyers directory listing, the neighbourhood Berlin Schöneberg, and fragments such as "Kündigungsschutzklagen", "Seit 25 Jahren", "Accessibility" and "Specialization". None of them are firms and none were counted.</p>
  </div>

  <h2>The same split in software</h2>

  <p>The pattern held in a category with no local-practice dimension at all. Asked in German for accounting software for German startups, the engines named <strong>Lexware Office</strong>, a German product, in two separate engines. Asked the identical question in English, no engine named it. Asked in English which HR software Berlin startups use, two engines named <strong>HeavenHR</strong>. Asked in German, none did.</p>

  <p>These are the two clearest single cases in the Berlin data: named by multiple independent engines in one language, and by nothing in the other.</p>

  <h2>What a German business should take from this</h2>

  <p>If your customers are German and you are checking your AI visibility in English because the tool you use only works that way, you are reading a report about a different market. In four of eleven engine and category comparisons here, the German and English answers had no company in common. Not a lower rank. A different contest, with different entrants.</p>

  <p>The direction of the asymmetry also matters for who should care most. A large firm with an English-language site, English press coverage and international directory listings appeared in the English answers and often not in the German ones. A small practice with a German-only web presence appeared in the German answers and not the English ones. <strong>Whichever of those you are, you are invisible in exactly the half you are not looking at.</strong></p>

  <h2>Honest limits</h2>

  <p>One run, one day, four categories, four engines, one city. Enough to show the effect is real and large in Berlin; not enough to tell you the size of your own gap. German is also the language in this study where our name extraction had the hardest time, because German answers name people, use titles, and compound words that a pattern matcher handles worse than it handles "Hilton". Some of the 88.5% is that. Not most of it: the two software cases above involve no personal names at all.</p>

  <p>The way to know your own number is not to trust ours. It is to ask both versions of your own question and compare the two lists yourself.</p>""",
))

# ---------------------------------------------------------------- BG-029
ARTICLES.append(dict(
    slug="bg-029", bid="BG-029", date="2026-08-01", date_label="August 1, 2026", read=6,
    tags=["Spain", "Original Research", "Multilingual"],
    title="Madrid Had the Smallest AI Language Gap in Europe, and One Category Explains Why",
    h1="Madrid Had the <em>Smallest</em> AI Language Gap in Europe, and One Category Explains Why",
    h1_plain="Madrid Had the Smallest AI Language Gap in Europe, and One Category Explains Why",
    subtitle="Spanish and English answers agreed more in Madrid than in Berlin, Paris or Rome. Almost all of that advantage came from a single category dominated by international hotel chains. Strip it out and Madrid looks like everywhere else.",
    meta_desc="AI visibility in Spain: Spanish and English answers about Madrid businesses shared 23.2% of named companies, the highest of four European cities. The gain came almost entirely from a chain-dominated hotel category.",
    og_desc="87 companies named across four Madrid categories, 74.7% in one language only. Airport hotels converged across languages because international chains dominate them. Restaurants and real estate did not.",
    ld_desc="Measured comparison of Spanish-language and English-language AI engine recommendations for Madrid businesses, showing that category structure rather than language explains most of the variation in overlap.",
    keywords="visibilidad en IA, AI visibility Spain, Spanish AI search results, ChatGPT recomendaciones empresas España, GEO España, AI brand visibility Madrid, generative engine optimization Spanish",
    about=["Generative Engine Optimization", "Spain", "Multilingual Search", "AI Visibility Measurement"],
    findings=[("23.2%", "answer overlap, the highest of the four European cities measured"),
              ("74.7%", "of the 87 companies named still appeared in only one language"),
              ("1", "category, airport hotels, carried most of Madrid's advantage"),
              ("0", "engines named Only YOU Boutique Hotel when asked in Spanish; two did in English")],
    faq=[("Do AI engines give the same answers in Spanish and English?",
          "Not usually. In Madrid, the Spanish and English answers shared 23.2% of the companies they named, the highest agreement of four European cities tested, and 74.7% of companies still appeared in only one language."),
         ("Why did Madrid have a smaller language gap than Berlin or Paris?",
          "Mostly because of one category. Hotels near Madrid-Barajas airport are dominated by international chains whose names, websites and descriptions are the same in every language, so both languages returned Crowne Plaza, Hilton, Meliá, Ibis and the rest. Categories made of independents diverged as much as anywhere else."),
         ("What does this mean for a Spanish business?",
          "If your category is dominated by international chains, your language gap is probably small. If it is made of independents, expect the Spanish and English answers to name substantially different companies, and measure the Spanish one, because that is what your Spanish customers see.")],
    related=[_R_FLAG, _R_HOWTO, _R_CHECK],
    cta_h=CTA_H, cta_p=CTA_P,
    body="""  <p>Across four European cities we asked AI engines the same commercial questions twice, once in the local language and once in English. Madrid produced the closest agreement between the two: <strong>23.2% overlap</strong>, against Berlin's 8.9%. On the face of it, Spanish-language and English-language AI visibility look more like each other than they do anywhere else we measured.</p>

  <p>They do not. One category is doing almost all of the work.</p>

""" + LIMITS + """

  <h2>The category that agreed with itself</h2>

  <p>We asked, in Spanish, <em>¿Qué hotel recomiendan cerca del aeropuerto de Madrid-Barajas?</em> and in English, <em>Which hotel is recommended near Madrid-Barajas airport?</em></p>

  <p>Both languages returned substantially the same hotels: <strong>Crowne Plaza Madrid Airport, Hilton Madrid Airport, Hotel Barajas Plaza, Hotel Clement Barajas, Hotel Maydrit Airport, Ibis Aeropuerto Barajas, Meliá Barajas</strong>. This was the highest-agreement category in the entire four-city study.</p>

  <p>There is nothing Spanish about that result. It is a category made almost entirely of international chains. Their names do not translate. Their websites already exist in both languages. The sources that describe them describe them the same way in either language. There is very little for the language of the question to change.</p>

  <h2>The categories that did not agree</h2>

  <p>Restaurants for a business dinner behaved like the rest of Europe. Asked in Spanish, the engines named <strong>Amazónico, Ramses, El Invernadero, Maison Umami, Santceloni, La Castilla</strong>. Asked in English, they named <strong>Botín, Coque, DSTAgE, Saddle, Dani Brasserie, El Pichón, La Marisquería</strong>. Four names appeared in both: DiverXo, Kabuki, El Prior and La Tasquita de Enfrente.</p>

  <p>Boutique hotels split the same way, and produced the single cleanest case in the Madrid data. <strong>Only YOU Boutique Hotel Madrid was named by two separate engines when the question was asked in English, and by no engine at all when it was asked in Spanish.</strong> It is a real, well-known Madrid hotel. Its own brand name is in English.</p>

  <p>Real estate agencies split by size rather than by fame. Spanish returned <strong>Gilmar, ÔKAM, Monago Consultores, Neinor Homes, Tecnocasa</strong>. English added the international networks: <strong>Knight Frank, Keller Williams, Remax, Lifetime Properties</strong>.</p>

  <div class="callout">
    <div class="callout-label">What was removed before counting</div>
    <p>Booking.com, Tripadvisor and Google Hotels appeared as "competitors" in the hotel answers and were removed: they are booking platforms, not hotels. The Madrid neighbourhoods Salamanca, Retiro and Malasaña were removed from the real estate and restaurant lists. Fotocasa was kept but is a listings portal rather than an agency, which is a slightly different answer to the question that was asked. A garbled fragment, "Hotel.lr", and one name we could not match to any real Madrid hotel, "The Basic's", were removed.</p>
  </div>

  <h2>The rule this gives a Spanish business</h2>

  <p>Madrid is the clearest demonstration in the study that <strong>the size of your language gap is a property of your category, not of your country.</strong> If you compete against international chains whose names are the same in every language, both languages will tend to converge on the same list, and an English-language check will roughly describe your Spanish position.</p>

  <p>If you are an independent competing against other independents, which is most Spanish businesses in most categories, the two lists diverge, and the Spanish one is the one your customers are reading. In the three non-chain categories here, three quarters of the companies named appeared in only one language.</p>

  <h2>Honest limits</h2>

  <p>Four categories in one city on one day, with four engines answering and ChatGPT absent because it errored throughout. Gemini returned parseable company names in only one of the eight Madrid prompts, so Madrid's comparison rests mainly on Claude, Perplexity and Meta AI. That makes Madrid the thinnest of the four city datasets, and its 23.2% the number in this study we would least want anyone to quote without the caveat attached.</p>

  <p>The direction of the finding is not in doubt, though, because it survives on the named cases: a hotel named twice in English and never in Spanish is not a rounding artefact.</p>""",
))

# ---------------------------------------------------------------- BG-030
ARTICLES.append(dict(
    slug="bg-030", bid="BG-030", date="2026-08-01", date_label="August 1, 2026", read=7,
    tags=["France", "Original Research", "Multilingual"],
    title="Ask in French and AI Names French Independents. Ask in English and It Names Global Banks",
    h1="Ask in French and AI Names French Independents. Ask in English and It Names <em>Global Banks</em>",
    h1_plain="Ask in French and AI Names French Independents. Ask in English and It Names Global Banks",
    subtitle="The clearest single result in our four-city study came from Paris wealth management. The French question and the English question returned two almost entirely separate industries, and the handful of firms in both had one thing in common.",
    meta_desc="AI visibility in France: French and English answers about Paris businesses shared 15.3% of named companies. French prompts surfaced independent French advisors, English prompts surfaced UBS, J.P. Morgan and Lombard Odier.",
    og_desc="127 companies named across four Paris categories, 81.1% in one language only. The French wealth-management answer named Cheval Blanc Patrimoine and Agora Finance. The English one named J.P. Morgan and UBS.",
    ld_desc="Measured comparison of French-language and English-language AI engine recommendations for Paris businesses, showing local independents surfacing in French and international institutions surfacing in English.",
    keywords="visibilite IA, AI visibility France, French AI search results, ChatGPT recommandations entreprises France, GEO France, AI brand visibility Paris, generative engine optimization French",
    about=["Generative Engine Optimization", "France", "Multilingual Search", "AI Visibility Measurement"],
    findings=[("15.3%", "overlap between the French answer and the English answer"),
              ("81.1%", "of the 127 companies named appeared in only one language"),
              ("3", "engines named Cheval Blanc Patrimoine in French, and none in English"),
              ("6", "firms appeared in both languages, all of them large institutions")],
    faq=[("Do AI engines recommend different companies in French than in English?",
          "Yes. Across four Paris business categories the French and English answers shared 15.3% of the companies they named, and 81.1% of the 127 companies named appeared in only one language."),
         ("What is the difference between the French and English AI answers?",
          "In the wealth management category, French prompts returned independent French advisory firms such as Cheval Blanc Patrimoine, Agora Finance and Scala Patrimoine. English prompts returned international private banks such as UBS, J.P. Morgan Private Bank, Lombard Odier and Mirabaud. The firms named in both were large institutions with an established presence in both languages."),
         ("Should a French company measure its AI visibility in French?",
          "Yes, if it sells to French customers. The English-language answer in this study described a different competitive set, weighted towards international institutions, and would understate the position of a French independent almost entirely.")],
    related=[_R_FLAG, _R_ENGINE, _R_CHECK],
    cta_h=CTA_H, cta_p=CTA_P,
    body="""  <p>We asked AI engines the same four commercial questions about Paris twice, once in French and once in English. Across all four categories the two answers shared <strong>15.3%</strong> of the companies they named, and <strong>81.1% of the 127 companies named appeared in only one language.</strong></p>

  <p>One category produced the sharpest result in the whole four-city study, and it is worth reading the two lists side by side.</p>

""" + LIMITS + """

  <h2>Wealth management: two different industries</h2>

  <p>The French question was <em>Meilleurs conseillers en gestion de patrimoine à Paris</em>. The English question was <em>Best wealth management advisors in Paris</em>.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Named in French only</th><th>Named in English only</th><th>Named in both</th></tr></thead>
    <tbody>
      <tr>
        <td>Cheval Blanc Patrimoine<br>Agora Finance<br>Scala Patrimoine<br>Auguste Patrimoine<br>Prosper Conseil<br>Noun Partners<br>Haussmann Patrimoine<br>Rhétorès Finance<br>Astoria Finance<br>Cabinet Mazarin</td>
        <td>UBS Wealth Management<br>J.P. Morgan Private Bank<br>Lombard Odier<br>Mirabaud<br>Banque de Luxembourg<br>Quilvest<br>Aberdeen Standard Investments<br>Crédit Agricole Private Banking<br>FIDERE Family Office Paris<br>Laplace</td>
        <td>Amundi<br>Pictet<br>Rothschild &amp; Co<br>Indosuez Wealth Management<br>BNP Paribas Wealth Management<br>Société Générale Private Banking</td>
      </tr>
    </tbody>
  </table>
  </div>

  <p>The left column is French independent advisory. The right column is international private banking. <strong>They are not competing lists of the same industry. They are two different industries answering the same question.</strong></p>

  <p>And the middle column has an obvious property: every firm in it is a large institution with a long-standing presence in both languages. Amundi, Pictet, Rothschild, Indosuez, BNP Paribas and Société Générale are the six firms big enough to exist in the English-language record and the French-language record at the same time.</p>

  <p>The strongest single case: <strong>Cheval Blanc Patrimoine was named by three separate engines in French, and by none in English.</strong> Agora Finance and Rivaria Capital were each named by two engines in French and none in English. In the other direction, J.P. Morgan Private Bank and Societe Generale Private Banking were each named by two engines in English and none in French.</p>

  <h2>The same shape in restaurants</h2>

  <p>Fine dining for a business dinner split the same way, if less dramatically. <strong>Kei</strong> was named by two engines in French and none in English. <strong>Arpège</strong> was named by two engines in English and none in French. Both are three-star Paris restaurants. Neither is obscure. The language of the question decided which one you were told about.</p>

  <div class="callout">
    <div class="callout-label">What was removed before counting</div>
    <p>The French answers produced several extraction artefacts that are not companies and were taken out by hand: "Avis Google" and "Avis Trustpilot" (review-source labels), "Frais" (fees), and a personal-finance media brand that answers a different question than "which advisor". Neighbourhood and district names were removed from all four Paris categories.</p>
  </div>

  <h2>What this means if you are a French business</h2>

  <p>If you are an independent French firm, the English-language answer is close to useless as a measure of your position, and it is the answer most international AI visibility tools will show you by default. In the wealth management category, an English-only measurement would have found essentially none of the French independents, and would have reported a competitive landscape made of Swiss and American banks.</p>

  <p>If you are the French arm of an international group, the reverse risk applies: you may be visible in English, where your group's brand carries you, and absent in French, where domestic independents own the answer. Both are one measurement away from being known.</p>

  <h2>Honest limits</h2>

  <p>Paris was the richest of the four city datasets, with 13 comparable engine and category pairs against 11 for the others, and Gemini returned usable names here where it did not elsewhere. That makes the Paris result the best-supported in the study, and it is still one day, one run, four categories.</p>

  <p>One name in the French-only column, Rivaria Capital, we could not independently confirm as an operating Paris advisory firm. We have left it in, flagged, because the finding is about what the engines printed, not about which firms exist. That distinction matters: an engine naming a firm that is hard to verify is itself worth knowing about, and quietly deleting it would hide it.</p>""",
))

# ---------------------------------------------------------------- BG-031
ARTICLES.append(dict(
    slug="bg-031", bid="BG-031", date="2026-08-01", date_label="August 1, 2026", read=6,
    tags=["Italy", "Original Research", "Multilingual"],
    title="In Italian, AI Recommends the Trattoria. In English, It Recommends the Three-Star",
    h1="In Italian, AI Recommends the Trattoria. In English, It Recommends the <em>Three-Star</em>",
    h1_plain="In Italian, AI Recommends the Trattoria. In English, It Recommends the Three-Star",
    subtitle="Rome's Italian and English answers shared 18% of the companies they named. In hotels and restaurants the divide was almost editorial: the local language returned the neighbourhood operator, English returned the internationally famous name.",
    meta_desc="AI visibility in Italy: Italian and English answers about Rome businesses shared 18% of named companies. Italian prompts returned local trattorie and independent hotels, English prompts returned La Pergola and The St. Regis.",
    og_desc="133 companies named across four Rome categories, 81.2% in one language only. Italian named Trapizzino and Hotel Raphael. English named La Pergola, Salumeria Roscioli and The St. Regis Rome.",
    ld_desc="Measured comparison of Italian-language and English-language AI engine recommendations for Rome businesses, showing local operators surfacing in Italian and internationally known names surfacing in English.",
    keywords="visibilita AI, AI visibility Italy, Italian AI search results, ChatGPT raccomandazioni aziende Italia, GEO Italia, AI brand visibility Rome, generative engine optimization Italian",
    about=["Generative Engine Optimization", "Italy", "Multilingual Search", "AI Visibility Measurement"],
    findings=[("18.0%", "overlap between the Italian answer and the English answer"),
              ("81.2%", "of the 133 companies named appeared in only one language"),
              ("9 of 10", "names shared by Perplexity in the one category where both languages nearly agreed"),
              ("3", "Rome hotels named by two engines in Italian and by none in English")],
    faq=[("Do AI engines recommend different Italian businesses in Italian than in English?",
          "Yes. Across four Rome business categories the Italian and English answers shared 18.0% of the companies they named, and 81.2% of the 133 companies named appeared in only one language."),
         ("What kind of businesses appear in the Italian answer but not the English one?",
          "Local independents. In Rome the Italian answers named neighbourhood restaurants such as Trapizzino, Supplizio and Osteria Fratelli Mori, and independent hotels such as Hotel Raphael, Nerva Boutique Hotel and Singer Palace. The English answers named internationally famous names such as La Pergola, Salumeria Roscioli, Pierluigi and The St. Regis Rome."),
         ("Which language should an Italian business be measured in?",
          "Italian, if its customers are Italian. An English-language measurement in this study described a different set of businesses, weighted towards internationally recognised names, and would miss most local independents entirely.")],
    related=[_R_FLAG, _R_ENGINE, _R_HOWTO],
    cta_h=CTA_H, cta_p=CTA_P,
    body="""  <p>Rome sat in the middle of our four-city bilingual study: <strong>18.0% overlap</strong> between the Italian and English answers, with <strong>81.2% of 133 named companies appearing in only one language.</strong> The aggregate is unremarkable next to Berlin's 8.9%. The individual categories are not.</p>

""" + LIMITS + """

  <h2>Restaurants: the neighbourhood against the guidebook</h2>

  <p>Asked in Italian for restaurants for a business dinner in Rome, the engines named <strong>Trapizzino, Supplizio, Osteria Fratelli Mori, Glass Hostaria, Alla Bottega Trattoria de Santis, Orma Roma, Ristorante Amedeo</strong>.</p>

  <p>Asked the same thing in English, they named <strong>La Pergola, Salumeria Roscioli, Pierluigi, Dal Bolognese, Enoteca la Torre, Aroma Restaurant, Il Metropolitan</strong>.</p>

  <p>Five names appeared in both: Il Convivio, Il Pagliaccio, La Campana, La Gensola and La Rosetta. Everything else split cleanly along a line that reads almost editorial. Italian returned places a Roman might book. English returned places an international visitor has read about.</p>

  <h2>Hotels: three independents that English never mentioned</h2>

  <p>Boutique hotels near the historic centre produced the sharpest named cases in the Rome data. <strong>Hotel Raphael, Nerva Boutique Hotel and Singer Palace Hotel were each named by two separate engines in Italian and by none in English.</strong> In the other direction, <strong>G-Rough</strong> was named by two engines in English and by none in Italian.</p>

  <p>The Italian-only list also included Villa Spalletti Trivelli, JK Place Roma, Hotel Vilòn, Otivm Hotel and Lifestyle Suites Rome. The English-only list included The St. Regis Rome, Portrait Roma, Casa Monti, Margutta 19 and Hotel Artemide.</p>

  <h2>The exception, and what it teaches</h2>

  <p>One comparison in Rome came close to full agreement. In real estate agencies, <strong>Perplexity named ten companies in Italian and ten in English, and nine of them were the same.</strong> It is the single highest-agreement engine and category pair in the entire four-city study.</p>

  <p>That is worth more attention than the divergences, because it shows the split is not inevitable. A category where the same firms are documented consistently in both languages, in this case a real estate market with strong national franchise networks and a heavily indexed listings ecosystem, produces one answer rather than two. <strong>Tecnocasa</strong> was named twice in Italian only and <strong>Immobiliare.it</strong> twice in English only, but the bulk of the list held steady.</p>

  <div class="callout teal">
    <div class="callout-label">The practical read</div>
    <p>The language gap is not a fixed tax on operating in Italian. It is widest where a category is made of independents that are documented mainly in their own language, and narrows to almost nothing where the same firms are described consistently in both. That is a property you can influence on your own site, which is the subject of the checklist linked below.</p>
  </div>

  <div class="callout">
    <div class="callout-label">What was removed before counting</div>
    <p>TheFork was removed from the restaurant lists as a booking platform rather than a restaurant. Roman landmarks and districts (Colosseo, Piazza di Spagna, Foro di Augusto, Monti, Prati, Centro Storico) were removed. Street addresses that the extractor picked up as names, several of them in the Italian answers, were removed. Italian navigation fragments such as "Contatti" and "Indirizzo" were removed, and two hotels appeared in the restaurant answers because the engine was recommending their dining rooms; those were kept, since a hotel restaurant is a real answer to the question.</p>
  </div>

  <h2>Honest limits</h2>

  <p>One run on 10 July 2026, four categories, four engines, ChatGPT absent because it errored on every prompt. Gemini produced parseable names in only two of eight Rome prompts, so Rome's comparison leans on Claude, Perplexity and Meta AI. Meta AI has since been retired from the product; its answers stay in because the measurement was real on the day it was taken.</p>""",
))

# ---------------------------------------------------------------- BG-032
ARTICLES.append(dict(
    slug="bg-032", bid="BG-032", date="2026-08-01", date_label="August 1, 2026", read=6,
    tags=["Engine Comparison", "Original Research", "Multilingual"],
    title="Which AI Engine Changes Its Answer Most When You Change the Language",
    h1="Which AI Engine Changes Its Answer <em>Most</em> When You Change the Language",
    h1_plain="Which AI Engine Changes Its Answer Most When You Change the Language",
    subtitle="Same question, same day, same city, two languages. Claude rewrote its list almost completely. Perplexity held on to the most names. The spread between them is smaller than anyone hoping for a safe engine would like.",
    meta_desc="Measured across four European cities: Claude shared 12.1% of its named companies between local-language and English answers, Perplexity 18.7%. No engine came close to answering the same way in both languages.",
    og_desc="Claude 12.1%, Meta AI 16.8%, Perplexity 18.7%. The engine that changes its answer least between languages still replaced more than four names in five.",
    ld_desc="An engine-level comparison of how much AI recommendations change between local-language and English prompts, measured across four European cities on a single collection run.",
    keywords="Claude vs Perplexity comparison, AI engine differences, ChatGPT Gemini Claude Perplexity multilingual, which AI engine is most accurate, AI search engine consistency, generative engine optimization engine choice",
    about=["Generative Engine Optimization", "AI Engine Comparison", "Multilingual Search", "AI Visibility Measurement"],
    findings=[("12.1%", "Claude's overlap between languages, the lowest of the engines measured"),
              ("18.7%", "Perplexity's overlap, the highest, across the same 16 comparisons"),
              ("5 of 16", "Claude comparisons in which the two languages shared no company at all"),
              ("9 of 10", "names Perplexity kept in its single most consistent category")],
    faq=[("Which AI engine gives the most consistent answers across languages?",
          "Of the engines measured, Perplexity was the most consistent, sharing 18.7% of its named companies between the local-language and English answers. Claude was the least consistent at 12.1%. Both figures are low: even the most consistent engine replaced roughly four names in five when the language changed."),
         ("Is one AI engine better to optimize for than another?",
          "Not on this evidence. The spread between the most and least consistent engine was about six percentage points, while the gap between languages within every engine was far larger. Choosing an engine does not let you avoid measuring both languages."),
         ("Why is Gemini not ranked in this comparison?",
          "Gemini returned company names that could be parsed in only three of the comparable pairs, against 16 each for Claude and Perplexity. Three pairs is not enough to rank an engine, so its figure is published but not ranked.")],
    related=[_R_FLAG, _R_021, _R_016],
    cta_h=CTA_H, cta_p=CTA_P,
    body="""  <p>If AI engines disagree with themselves across languages, the obvious next question is whether some of them disagree less. If one engine were substantially more stable, that would be worth knowing: it would be the one to trust when you can only afford to check one.</p>

  <p>We had the data to answer it. Four cities, four categories each, every question asked in the local language and in English, with each engine's answer compared only against <em>its own</em> answer in the other language.</p>

""" + LIMITS + """

  <h2>The result</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Engine</th><th>Comparable pairs</th><th>Names in local language</th><th>Names in English</th><th>Shared</th><th>Overlap</th></tr></thead>
    <tbody>
      <tr><td>Perplexity</td><td>16</td><td>102</td><td>95</td><td>31</td><td>18.7%</td></tr>
      <tr><td>Meta AI</td><td>11</td><td>59</td><td>80</td><td>20</td><td>16.8%</td></tr>
      <tr><td>Gemini</td><td>3</td><td>26</td><td>30</td><td>8</td><td>16.7%</td></tr>
      <tr><td>Claude</td><td>16</td><td>91</td><td>85</td><td>19</td><td>12.1%</td></tr>
    </tbody>
  </table>
  </div>

  <p><strong>Perplexity was the most stable and Claude the least</strong>, on identical ground: both answered all 16 comparable pairs. Claude produced <strong>five</strong> comparisons in which the two languages shared no company whatsoever; Perplexity produced six, but across a larger shared set overall.</p>

  <p>Gemini's 16.7% sits between them and should be ignored. It is computed over three pairs, because Gemini's answers were usually not in a form our extractor could pull company names from. Publishing the number without ranking it is the honest treatment: hiding it would be worse, and ranking it would be false precision.</p>

  <h2>The finding that matters is not the ranking</h2>

  <p>The spread from best to worst is about six percentage points. The gap between languages <em>within</em> every single engine is the other 80-odd. <strong>The most consistent engine we measured still replaced more than four names in five when the language of the question changed.</strong></p>

  <p>So the practical answer to "which engine should I optimise for to avoid this" is: there isn't one. Engine choice does not get you out of measuring both languages. It barely moves the number.</p>

  <div class="callout teal">
    <div class="callout-label">The one bright spot, and it is instructive</div>
    <p>Perplexity's best category was Rome real estate agencies, where it named ten companies in Italian and ten in English and <strong>nine were the same</strong>. That is the highest agreement anywhere in the study, and it happened in a market with strong national franchise networks and a heavily indexed listings ecosystem, where the same firms are described consistently in both languages.</p>
    <p>Consistency is achievable. It looks like a property of how well documented a category is in both languages, not a property of the engine.</p>
  </div>

  <h2>Why a retrieval engine might hold steadier</h2>

  <p>One reading of Perplexity leading and Claude trailing is that Perplexity is built around live retrieval and citation, so a French question and an English question can both land on overlapping source documents, while an engine leaning more on its own representation of a market has more room for the two languages to diverge internally.</p>

  <p>That is a hypothesis, and we want to be clear that this dataset cannot test it. We measured what the engines printed, not how they got there. A six-point spread across 16 comparisons in one run is also not a large enough result to carry a mechanism. We are reporting the ranking because it is what we measured, and declining to explain it because we did not measure that.</p>

  <h2>What to do with this</h2>

  <ul>
    <li><strong>Do not pick an engine to dodge the language problem.</strong> The best engine here is still wrong four times in five across languages.</li>
    <li><strong>Do check more than one engine per language.</strong> Claude's five zero-overlap comparisons mean a single-engine check in a single language can be maximally unrepresentative.</li>
    <li><strong>Treat consistency as something you influence, not something you receive.</strong> The one category that converged did so because the underlying record was consistent in both languages.</li>
  </ul>

  <h2>Honest limits</h2>

  <p>Four engines, not seven. ChatGPT errored on all 32 prompts in this run and is absent, which is a real gap given that it is the engine most people mean when they say AI search. Meta AI has since been retired from the product. Grok and Google AI Overviews were added on 29 July 2026, after this data was collected, and are not represented. A rerun including all seven is the obvious next step and would change these figures.</p>""",
))

# ---------------------------------------------------------------- BG-033
ARTICLES.append(dict(
    slug="bg-033", bid="BG-033", date="2026-08-01", date_label="August 1, 2026", read=6,
    tags=["How To", "Multilingual", "Practical"],
    title="How to Check Whether AI Recommends Your Brand in Your Customers' Language",
    h1="How to Check Whether AI Recommends Your Brand in <em>Your Customers'</em> Language",
    h1_plain="How to Check Whether AI Recommends Your Brand in Your Customers' Language",
    subtitle="The same test we ran across four European cities, reduced to something you can do yourself in about ten minutes, with no tool and no budget. Then the three mistakes that make people conclude the wrong thing from it.",
    meta_desc="A step-by-step method for testing whether ChatGPT, Gemini, Claude and Perplexity recommend your business when the question is asked in your local language rather than English, plus the three mistakes that invalidate the result.",
    og_desc="Ten minutes, no tools, no budget. Write the question a real buyer would type, ask it in both languages, and compare the two lists. Here is how to do it so the answer means something.",
    ld_desc="A practical guide to testing a brand's visibility in AI engine answers across two languages, including prompt construction, controls, and the common errors that produce misleading results.",
    keywords="how to check if ChatGPT recommends my business, test brand visibility AI, AI visibility check multilingual, does AI recommend my company, check my brand in ChatGPT, AI search visibility test",
    about=["Generative Engine Optimization", "AI Visibility Measurement", "Multilingual Search"],
    findings=[("10 min", "to run the whole test by hand, for one category in two languages"),
              ("2", "prompts per category, identical except for the language"),
              ("3", "engines minimum, because a single engine can be maximally unrepresentative"),
              ("82.1%", "of companies in our own study appeared in only one of the two languages")],
    faq=[("How do I check if ChatGPT recommends my business?",
          "Ask it the question a real buyer would ask, phrased as a category request rather than as your brand name, then read whether you appear in the list. Asking about your brand by name tests recall, not recommendation, and will nearly always produce a flattering answer that means nothing."),
         ("How do I test my AI visibility in more than one language?",
          "Write one buyer question, translate it as literally as the two languages allow, and ask both versions of the same engine on the same day. Compare the two lists of companies named. If they differ substantially, you have two separate visibility positions, not one."),
         ("Why should I not ask the AI about my brand by name?",
          "Because it changes the question. Naming your brand asks whether the engine knows you exist, which is a much lower bar than whether it recommends you unprompted. The commercial question is the one your buyer actually types, which never contains your name."),
         ("How many AI engines should I check?",
          "At least three per language. In our four-city study, one engine produced five comparisons in which the two languages shared no company at all, so a single-engine check can be maximally unrepresentative in either direction.")],
    related=[_R_FLAG, _R_CHECK, _R_ENGINE],
    cta_h="Skip the manual version",
    cta_p="Our free test runs your domain across the engines automatically and shows you the answer on screen. No signup, no card. Then do the second language by hand using the method above.",
    body="""  <p>We measured this properly across four European cities and found that <strong>82.1% of the companies AI engines named appeared in only one of the two languages asked</strong>. The obvious follow-up question is what your own number looks like. You do not need us to find that out. Here is the method, and more usefully, the ways of getting it wrong.</p>

  <h2>Step 1: write the question your buyer actually types</h2>

  <p>Not your brand name. This is the single most common mistake and it invalidates everything downstream.</p>

  <p>Asking <em>"What do you know about Acme GmbH?"</em> tests whether the engine has heard of you. Almost anything with a website clears that bar, and the answer feels great. Asking <em>"Beste Arbeitsrechtsanwälte in Berlin"</em> tests whether the engine <strong>recommends</strong> you to somebody who has never heard of you, which is the only thing worth measuring.</p>

  <p>Good buyer questions share three properties: a category, a place or qualifier, and no brand name. <em>Best boutique hotels in central Madrid.</em> <em>Which HR software do Berlin startups use?</em> <em>Meilleurs conseillers en gestion de patrimoine à Paris.</em> All three are real prompts from our study.</p>

  <h2>Step 2: translate it as literally as the languages allow</h2>

  <p>The point is to change one variable. If the English version says "best" and the German version says "most recommended", you have changed two things and you will not know which one moved the answer.</p>

  <p>Where a literal translation would be unnatural, prefer the natural phrasing a native speaker would type and note that you did. A prompt nobody would ever write tests nothing.</p>

  <h2>Step 3: ask both versions, same day, at least three engines</h2>

  <p>Same day matters, because these systems change. Three engines matters more than most people expect: in our study, one engine produced five separate comparisons in which the two languages shared <em>no</em> company at all. If that had been your only engine, you would have concluded something dramatic from what is partly one engine's behaviour.</p>

  <p>Use a fresh conversation for each. A follow-up question in an existing chat inherits everything above it, including your previous prompt's language and any brand you have already mentioned.</p>

  <h2>Step 4: write down the lists, not the impression</h2>

  <p>Two columns, one per language, every company named, in order. This is the step people skip and it is where the finding actually lives. "It mentioned us in both" is an impression. "We were fourth in German and absent in English, and the English list was four international firms we have never competed with" is a finding you can act on.</p>

  <p>Then ask three questions of the two columns:</p>

  <ul>
    <li><strong>Are you in both?</strong> If you are in one, the other is a market you are invisible in.</li>
    <li><strong>Are the two lists the same industry?</strong> In our Paris data the French list was independent advisors and the English list was global private banks. Those are not two rankings, they are two categories.</li>
    <li><strong>Who is in both?</strong> Those are the competitors who have solved this, and their sites are worth looking at.</li>
  </ul>

  <h2>The three mistakes that produce a wrong conclusion</h2>

  <div class="callout">
    <div class="callout-label">Mistake 1: reading a single run as a measurement</div>
    <p>One answer on one day is an anecdote. These systems are not deterministic, and asking the same engine the same question twice can produce different lists. A gap that appears once might be noise; a gap that appears across three engines is not. This is exactly why our own study reports 46 comparisons rather than a highlight.</p>
  </div>

  <div class="callout">
    <div class="callout-label">Mistake 2: counting a blank answer as a zero</div>
    <p>If an engine returns an error, a refusal, or a paragraph with no companies in it, that is not evidence you are invisible. It is a missing measurement. In our study, ChatGPT errored on all 32 prompts on the collection day and we excluded it entirely rather than report zeros, which would have looked like a dramatic finding and meant nothing.</p>
  </div>

  <div class="callout">
    <div class="callout-label">Mistake 3: assuming the local language is the one that matters</div>
    <p>It usually is, but check who buys. A Rome hotel selling mainly to international visitors should care more about the English answer. A Berlin employment lawyer should care almost entirely about the German one. The right question is not which language is bigger, it is which language your revenue speaks.</p>
  </div>

  <h2>What to do with a gap once you find one</h2>

  <p>The instinct is to translate the website, and that is necessary but not usually sufficient on its own. The checklist in the next piece covers what actually seems to move: language declaration and hreflang, whether your structured data exists in both languages, whether your own name is written consistently, and whether anything <em>other</em> than your site describes you in the second language, which is the part most companies have never touched.</p>""",
))

# ---------------------------------------------------------------- BG-034
ARTICLES.append(dict(
    slug="bg-034", bid="BG-034", date="2026-08-01", date_label="August 1, 2026", read=7,
    tags=["Checklist", "Multilingual", "Practical"],
    title="The Multilingual AI Visibility Checklist: Nine Things That Decide Whether an Engine Can Answer About You Twice",
    h1="The Multilingual AI Visibility Checklist: Nine Things That Decide Whether an Engine Can Answer About You <em>Twice</em>",
    h1_plain="The Multilingual AI Visibility Checklist: Nine Things That Decide Whether an Engine Can Answer About You Twice",
    subtitle="Our four-city study found one category where the two languages nearly agreed. What was different about it points at a checklist. Nine items, ordered by how much work each one is against how much of the gap it plausibly closes.",
    meta_desc="A practical checklist for multilingual generative engine optimization: hreflang, translated structured data, consistent brand naming, second-language citations, and the five other things that decide whether AI can answer about you in both languages.",
    og_desc="Translating the website is necessary and not sufficient. Nine items, ordered by effort against effect, drawn from the one category in our study where both languages returned the same companies.",
    ld_desc="A nine-item checklist for improving brand visibility in AI engine answers across multiple languages, derived from a measured four-city bilingual study.",
    keywords="multilingual SEO for AI, hreflang for AI search, GEO checklist multilingual, structured data multiple languages, international generative engine optimization, AI visibility multiple languages checklist",
    about=["Generative Engine Optimization", "Multilingual Search", "Technical SEO", "Structured Data"],
    findings=[("9", "items, ordered by effort against plausible effect"),
              ("9 of 10", "names matched in the one study category where both languages agreed"),
              ("2", "of the nine are usually already broken on sites that think they are multilingual"),
              ("0", "of them require a rebuild")],
    faq=[("How do I make AI engines recommend my business in more than one language?",
          "Make sure the second-language version of your site is genuinely indexable and declared, that your structured data exists in that language, that your brand name is written identically everywhere, and that something other than your own website describes you in that language. Translation alone is necessary but rarely sufficient."),
         ("Does hreflang matter for AI search?",
          "It is the cheapest item on this list and it removes an ambiguity rather than adding a signal. It tells a crawler that two pages are the same content in two languages rather than duplicates or unrelated pages. It is not a guarantee of anything, and no one outside the engine vendors can honestly claim to know its exact weight."),
         ("Should I translate my structured data too?",
          "Yes. A page in German with an English-language JSON-LD description is describing itself in a language its readers are not using. If you publish structured data at all, publish it in the language of the page it sits on.")],
    related=[_R_HOWTO, _R_FLAG, _R_014],
    cta_h="Find your gap before you fix it",
    cta_p="Our free test shows you what the engines say about your domain right now. Start there, so you are closing a gap you have measured rather than one you have assumed.",
    body="""  <p>Across four European cities, our bilingual study found that <strong>82.1% of the companies AI engines named appeared in only one of the two languages asked</strong>. It also found one category, Rome real estate agencies through Perplexity, where <strong>nine of ten names matched across both languages</strong>.</p>

  <p>That exception is the useful part. Whatever is different about a market where both languages produce the same answer is the thing worth copying. What was different: those firms are documented consistently in both languages, by sources other than themselves, under names that do not change.</p>

  <p>That decomposes into a checklist. It is ordered by effort against plausible effect, so if you stop a third of the way down you will have done the part that matters most.</p>

  <div class="callout">
    <div class="callout-label">A word on certainty, before the list</div>
    <p>Nobody outside the engine vendors knows the weights here, and anyone who gives you a ranked list of AI ranking factors with confident percentages is inventing them. What follows is ordered by <em>reasoning from what we measured</em> plus ordinary technical hygiene. Items 1 to 4 are things whose absence demonstrably prevents an engine from having the information at all. Items 5 to 9 are progressively more speculative and are labelled as such.</p>
  </div>

  <h2>The four that remove a blocker</h2>

  <h3>1. The second-language pages must actually be indexable pages</h3>

  <p>Not a JavaScript language switcher that rewrites the same URL. Not a cookie. Not a browser-language redirect that sends every crawler to one version. If <code>example.com/de/</code> does not exist as a fetchable URL returning German content to a plain HTTP request, then for retrieval purposes your German site does not exist. This is the most common failure and the most complete one: everything below is irrelevant until it is fixed.</p>

  <p>Test it by fetching the URL without a browser. If you get the English page, or a redirect loop, or an empty shell that needs JavaScript to populate, you have found your problem.</p>

  <h3>2. Declare the pair with hreflang</h3>

  <p>Reciprocal <code>hreflang</code> tags, each language pointing at the others and at itself, plus <code>x-default</code>. This does not add a signal so much as remove an ambiguity: it says these two pages are the same content in two languages, rather than duplicates or unrelated pages. It is an afternoon of work and there is no argument for skipping it.</p>

  <h3>3. Put the structured data in the language of the page</h3>

  <p>A German page carrying JSON-LD whose <code>description</code>, <code>name</code> and <code>areaServed</code> are in English is describing itself to machines in a language its readers do not use. If you publish <code>Organization</code>, <code>LocalBusiness</code>, <code>Product</code> or <code>FAQPage</code> data, publish it per language, alongside the page it describes.</p>

  <p>While you are in there, validate it. On our own site we found three <code>FAQPage</code> blocks that had been silently invalid for weeks because of one missing brace, which meant they were being dropped entirely rather than misread. Invalid structured data fails quietly, which is the worst way for anything to fail.</p>

  <h3>4. Write your own name the same way everywhere</h3>

  <p>One canonical spelling, in every language, on every page, in your structured data, in your directory listings. Our own study produced a clean example of what inconsistency does: "Only You Boutique Hotel" and "Only YOU Boutique Hotel Madrid" came back as two separate strings from the same run, and any automated system counting mentions counts those twice or matches neither.</p>

  <p>If your legal name, your trading name and your domain differ, pick the one customers use, lead with it consistently, and mention the others once on an about page rather than alternating between them.</p>

  <h2>The five that are more speculative, and are marked so</h2>

  <h3>5. Get described in the second language by something that is not you</h3>

  <p>This is the item that most plausibly explains our Rome exception, and it is the hardest. Every firm in that converged list was documented by third parties in both languages: national franchise networks, listings platforms, local press. Your own translated site is one source saying one thing twice. A local trade publication, a national directory, a partner's site or an industry association writing about you in the second language is a different source, and diversity of source is what a retrieval system is built to reward.</p>

  <p>We cannot prove this from our data. We can say that the one category that converged had it, and the ones that diverged mostly did not.</p>

  <h3>6. Answer the buyer question, in the buyer's words, on a page</h3>

  <p>The prompts that drove this study were category questions: best boutique hotels in central Madrid, which HR software Berlin startups use. If you have a page that answers that exact question in that exact language, an engine has something to retrieve. If your German site has a services page and your English site has a detailed guide, expect the English answer to be better informed.</p>

  <h3>7. Do not machine-translate and leave it</h3>

  <p>Translated text that no native speaker has read tends to use the wrong terms of art, and terms of art are what buyer questions are made of. A German employment law page that says "Arbeitsrecht Anwalt" where the market says "Fachanwalt für Arbeitsrecht" is answering a question nobody asks. This costs money and is worth it for the two or three pages that carry your commercial intent.</p>

  <h3>8. Keep the same facts in both languages</h3>

  <p>Different opening hours, a different address format, a stale price on the version you update less often. Any system reconciling sources now has a conflict about you, and the cheapest resolution is to trust neither. Pick a single source for facts and generate both language versions from it if you can.</p>

  <h3>9. Measure both languages separately, on a schedule</h3>

  <p>Last because it changes nothing on its own, and first in importance for everything else on this list, because without it you are guessing which items mattered. A single measurement tells you where you stand. A repeated one tells you whether anything you did worked, and that is the only way any of the eight items above stop being a matter of opinion.</p>

  <div class="callout teal">
    <div class="callout-label">If you only do three</div>
    <p>Items 1, 3 and 4. Indexable second-language URLs, structured data in the page's own language, and one consistent spelling of your own name. All three are cheap, none require a rebuild, and each one removes a way for an engine to fail to know something about you rather than merely failing to prefer you.</p>
  </div>

  <h2>What this checklist will not do</h2>

  <p>It will not make the two answers identical, and it should not. Our Madrid data showed a category converging because international chains dominate it, and our Paris data showed French independents owning the French answer while global banks owned the English one. Some of that split is a real feature of the markets, not a defect in anyone's website.</p>

  <p>The goal is not one answer in two languages. It is to be present in the answer your customers are actually reading, and to know which one that is.</p>""",
))


# ============================================================
# Batch appended 2026-08-13: BG-035, BG-036, BG-037, BG-038, BG-039
# (the 5 flagship articles from scripts/articles_content_batch1.py
# and articles_content_batch1b.py, merged in after review)
# ============================================================

CTA_H_DEFAULT = "See your own number, not someone else's case study"
CTA_P_DEFAULT = "Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card."

_R_026 = ("/bg-026.html", "BG-026", "How the 6-Dimension AI Visibility Score Is Actually Weighted",
          "The methodology disclosure this article argues every vendor in the category owes you.")
_R_017 = ("/bg-017.html", "BG-017", "Our AI Visibility Research Is Now a Published Academic Paper",
          "The peer-reviewed foundation behind treating this as a measurement problem, not a marketing one.")
_R_034 = ("/bg-034.html", "BG-034", "The Multilingual AI Visibility Checklist",
          "A checklist built the same way this piece was: measured first, published with the limits attached.")

# ---------------------------------------------------------------- BG-036
ARTICLES.append(dict(
    slug="bg-036", bid="BG-036", date="2026-08-13", date_label="August 13, 2026", read=11,
    tags=["Competitive Landscape", "Buyer Guide", "Original Research"],
    title="The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
    h1="The Real GEO Tool Buyer's Guide. <em>13 Vendors</em>, Real Pricing, and the Costs Nobody Puts in the Headline",
    h1_plain="The Real GEO Tool Buyer's Guide: 13 Vendors, Real Pricing, and the Costs Nobody Puts in the Headline",
    subtitle="We built the pricing comparison this category doesn't publish in one place: what each vendor's headline price actually includes, what turns out to be a paid add-on, and what buyers say happens after they sign.",
    meta_desc="A researched comparison of 13 AI visibility and GEO monitoring vendors: real pricing, engine coverage, funding, and what's a paid add-on versus what's included. Sourced and dated August 2026.",
    og_desc="Profound is a $1B unicorn. Otterly's $29 plan becomes $300 once you add the engines most buyers assume are included. We priced 13 GEO tools against their own pricing pages, not their marketing copy.",
    ld_desc="A sourced comparison of AI visibility and generative engine optimization monitoring vendors, covering pricing, engine coverage, funding, and buyer objections documented across public pricing pages and review sites.",
    keywords="GEO tool comparison, AI visibility monitoring pricing, best AEO tool, generative engine optimization software, AI brand monitoring tool comparison, GEO vendor pricing 2026",
    about=["Generative Engine Optimization", "AI Visibility Monitoring", "Competitive Analysis", "SaaS Buying Guide"],
    findings=[("13", "GEO monitoring vendors compared against their own pricing pages"),
              ("$300M+", "disclosed venture funding across 6 GEO-native vendors in under 2 years"),
              ("<1 in 100", "chance the same AI platform returns the same brand list twice, per SparkToro"),
              ("3", "vendors with no public pricing at all: Bluefish AI, Evertune, Goodie AI")],
    faq=[("What does a GEO or AI visibility monitoring tool actually cost?",
          "Public entry pricing ranges from $19.95/month (Waikay) to $800/month for Evertune's published Pro tier, with enterprise deals at Bluefish AI and Evertune running into six figures a year. The harder number to find is the real cost once you add the engines you actually need: Otterly.AI's $189/month Standard plan, for example, only ships with 4 core engines, and Gemini, Google AI Mode, and Claude are separately priced add-ons that can push the real monthly cost past $300."),
         ("Which AI engines should a GEO tool cover?",
          "It depends on your prompt mix, not the vendor's marketing count. Rankscale advertises 17+ engines and Evertune names 9, but AthenaHQ's pitch is that all 8 of its engines are included at every price tier with no paywalling, while Otterly.AI includes only 4 and gates the rest. A tool with fewer engines, fully included, can be more useful than a tool with a bigger number where half of it is locked behind an upsell."),
         ("Should I trust a vendor's case study showing a big visibility increase?",
          "Only if it discloses its method. Yext's published research analyzed 6.8 million citations across a stated date range and industry breakdown; Ahrefs' Brand Radar methodology discloses its keyword base size and even states that it deliberately keeps hallucinated links in its data rather than cleaning them out. Compare that to agency case studies claiming '340% in 90 days' or '46.7% in 7 days' with no client name and no stated measurement method. A number with no method behind it is not evidence, it's a headline."),
         ("Is AI visibility measurement even reliable enough to buy a tool for?",
          "Treat any single score as directional, not precise. SparkToro's study of 2,961 queries across three AI platforms found less than a 1-in-100 chance the same platform returns the same brand list twice for the same question, and roughly a 1-in-1,000 chance it returns the list in the same order. That doesn't mean measurement is worthless, it means a vendor that reports one clean score with no variance shown is hiding the noise rather than accounting for it.")],
    related=[_R_026, _R_017, _R_034],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>If you've tried to compare AI visibility monitoring tools by reading their pricing pages, you already know the problem: every vendor prices differently, several hide their real cost behind add-ons, and at least three of the names that come up in every "best GEO tools" roundup don't publish a price at all. So we built the comparison ourselves, from the vendors' own pricing pages, funding filings, and review sites, not from their marketing copy.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Pricing was fetched directly from each vendor's own pricing page where one exists; funding figures come from Crunchbase, Tracxn, and direct funding announcements; buyer complaints are drawn from G2 reviews and the vendors' own review pages. Where a source could not be independently verified, such as a third-party ARR estimate or a secondhand pricing claim, that is stated in the text rather than presented as fact.</p>
    <p>This is a snapshot of one day. Pricing in this category changes often; check the vendor's own page before you budget against any number here.</p>
  </div>

  <h2>The comparison, built from pricing pages, not sales calls</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Vendor</th><th>Engines</th><th>Entry price</th><th>Funding / founded</th><th>Best for</th></tr></thead>
    <tbody>
      <tr><td>Profound</td><td>10 engines claimed</td><td>$99/mo Starter</td><td>$155M total, $1B valuation Feb 2026</td><td>Enterprise, the category's default pick</td></tr>
      <tr><td>Peec AI</td><td>6 engines, all tiers</td><td>$95/mo Starter</td><td>$29.1M total, founded 2025</td><td>Mid-market marketing/SEO teams</td></tr>
      <tr><td>AthenaHQ</td><td>8 engines, no paywall</td><td>$295/mo ($95 intro)</td><td>$2.7M total, founded 2025</td><td>SMB wanting full coverage without upsells</td></tr>
      <tr><td>Otterly.AI</td><td>4 core, 3 paid add-ons</td><td>$29/mo Lite</td><td>Bootstrapped, founded 2024</td><td>Cheapest true entry point, unlimited seats</td></tr>
      <tr><td>Scrunch AI</td><td>7 engines</td><td>$250/mo Core</td><td>$26M total</td><td>Teams wanting a structured AI-crawler layer</td></tr>
      <tr><td>Rankscale</td><td>17+ engines claimed</td><td>$20/mo Essentials</td><td>Bootstrapped, founded 2024</td><td>Budget-conscious solo operators</td></tr>
      <tr><td>Evertune</td><td>9 engines named</td><td>$800/mo Pro (published)</td><td>$20M total</td><td>Enterprise, prices by prompt volume</td></tr>
      <tr><td>Waikay</td><td>6 engines, 47 languages</td><td>$19.95/mo</td><td>Unfunded, founded 2025</td><td>Cheapest headline price in the category</td></tr>
      <tr><td>Bluefish AI</td><td>Chat + AI shopping agents</td><td>No public pricing</td><td>~$68M total</td><td>Fortune 500 only, no self-serve path</td></tr>
      <tr><td>Goodie AI</td><td>5 engines claimed</td><td>No public pricing</td><td>Agency-backed, undisclosed</td><td>Not independently confirmed in this pass</td></tr>
    </tbody>
  </table>
  </div>

  <p>Two names came up in the brief for this piece that turned out not to fit the category on closer inspection, worth naming so you don't waste a sales call on them: <strong>Daydream</strong> is not a monitoring tool at all, it's a consumer-facing AI shopping agent that fashion brands get listed inside, the kind of surface you'd want to be visible in rather than a tool that measures your visibility elsewhere. <strong>Nozzle</strong> is a traditional Google SERP rank tracker; this research pass found no evidence it tracks AI-engine answers specifically.</p>

  <h2>What the headline price doesn't include</h2>

  <p>Otterly.AI's own pricing page is the clearest example. Its "Standard" plan is headlined at <strong>$189/month</strong>, and that number is real, but it only includes 4 core engines: ChatGPT, Google AI Overviews, Perplexity, and Copilot. Google AI Mode, Gemini, and Claude are each separate paid add-ons, ranging from $9 to $439 a month depending on your plan tier. Add the three most commonly requested ones and a $189 plan can land closer to $300 or more, before you've changed anything about how many prompts you're tracking.</p>

  <p>Peec AI's own pricing page lists 6 models at every tier, including the $95/month Starter plan. A G2 reviewer, however, described the $95 entry price as covering only 3 platforms in their actual experience, with each additional engine sold separately at roughly $35/month. We can't reconcile that with what the pricing page currently shows, and we're not going to guess which one is stale. What it tells you as a buyer: read the pricing page the week you sign, and ask directly whether the tier you're buying includes every engine listed on the page or a subset of them.</p>

  <p>Credit-based pricing carries its own version of the same problem. Across several vendors, engines are not billed at equal weight: checking ChatGPT, Gemini, Perplexity, or Google AI Mode commonly runs about 0.25 credits per check, while checking Claude can cost up to <strong>8 times</strong> that base rate on some platforms. Overage on usage-based plans commonly adds another 20 to 30 percent to the bill, and some enterprise contracts carry separate onboarding fees of $1,000 to $5,000 that don't show up on the pricing page at all.</p>

  <h2>Enterprise-only versus self-serve, mapped</h2>

  <p>The category splits cleanly into two buyer motions, and knowing which one you're shopping in saves a lot of wasted demo calls. <strong>Bluefish AI</strong> and <strong>Evertune</strong> are enterprise-only by design: Bluefish's pricing URL simply 404s, every call to action is a demo request, and independent estimates put its contracts at $100,000 to $500,000 a year, with confirmed customers including Adidas and Tishman Speyer. One review calls Evertune, whose published Pro tier prices by prompt volume at $800/month for 100,000 prompts, "the Fortune 500's best-kept secret in AI brand intelligence," though a separate independent review claims an actual price floor closer to $3,000/month on an annual contract with a $36,000 minimum. The two figures disagree and neither is independently confirmed here.</p>

  <p>At the other end, <strong>Otterly.AI, Rankscale, and Waikay</strong> are all bootstrapped, self-serve, and priced under $100/month at entry. None has taken outside venture funding, and all three lead with affordability rather than breadth of coverage. If your team is testing whether GEO monitoring is worth budgeting for at all, this is the tier to start in, not the tier with the biggest logo wall of case studies.</p>

  <h2>What buyers say happens after they sign</h2>

  <p>The most-cited independent research in this category isn't from a vendor, it's from SparkToro. Its study submitted 2,961 individual queries across 12 prompts on three major AI platforms and found <strong>less than a 1-in-100 chance</strong> that the same platform, asked the same question twice, returns the same list of brand recommendations, and roughly a 1-in-1,000 chance the list comes back in the same order. Claude repeated a list slightly more often than ChatGPT or Google's AI, but still rarely in the same order.</p>

  <p>A separate April 2026 piece from Brainlabs makes the same point from a different angle, arguing that "ranking," the foundational unit of traditional SEO reporting, "simply doesn't translate to AI search," and that every estimation method in the industry, panel-based, clickstream inference, keyword-to-prompt modeling, or API sampling, carries real weaknesses. Its recommendation to marketers evaluating this category: prioritize trend direction and competitive benchmarking over trusting any single precise score.</p>

  <div class="callout teal">
    <div class="callout-label">What this means for you as a buyer</div>
    <p>A vendor that shows you one clean visibility score with no variance disclosed is not being more accurate than one that shows you a range, it's hiding the noise. Ask any vendor you're evaluating how consistent their own measurement is run over run, on the same prompt, before you trust the number they put in front of you in a demo.</p>
  </div>

  <h2>The checklist to run before you sign</h2>

  <p>Synthesized across several independent vendor-evaluation guides, the questions that come up again and again:</p>

  <ul>
    <li>Which models are natively supported versus scraped or inferred? Some tools claim broad AI tracking but only genuinely cover Google AI Overviews.</li>
    <li>Does the tool show you the exact citation an answer drew on, not just whether your brand was mentioned, so you can tell whether the model cited your own site, a review platform, a news outlet, or a forum thread?</li>
    <li>Does the vendor disclose its collection method, API versus scraping versus a hybrid, and is that method compliant with each AI platform's terms of service?</li>
    <li>Does it integrate with the analytics or CMS stack you already run?</li>
    <li>Have you tested it with your own prompts, side by side against another shortlisted tool, rather than trusting a demo alone? A demo shows you what the vendor wants you to see in the best possible light, not what your own account will look like in month two.</li>
  </ul>

  <h2>Two case studies, and why we only trust one of them</h2>

  <p><strong>Yext</strong> published research in October 2025 analyzing 6.8 million AI citations collected from 1.6 million queries per model across ChatGPT, Gemini, and Perplexity, over a stated two-month window, broken down across 4 intent categories and 4 industries. Its finding, that 86 percent of AI citations come from sources brands already control, is the kind of result you can actually evaluate, because the sample size, the date range, and the industry mix are all disclosed. <strong>Ahrefs'</strong> Brand Radar methodology goes further still, disclosing the exact keyword base it draws from and explicitly stating that it retains hallucinated or malformed links in its data because they "reflect real model output," rather than quietly cleaning the data to look tidier.</p>

  <p>Compare that to two agency case studies surfaced in this research pass: one claims a client "increased AI citations by 340% in 90 days," the other claims AI visibility rose "from 6.8% to 46.7% in 7 days." Neither names the client. Neither discloses what tool or method produced the baseline number or the result. Both are round, large, and impossible to check. That's not proof the numbers are false, it's proof they're unfalsifiable, which is a different problem and, for a buying decision, a worse one.</p>

  <div class="callout">
    <div class="callout-label">The rule this gives you</div>
    <p>A big percentage with no client name and no disclosed method is marketing. A number with a stated sample size, date range, and a named source you can go check yourself is research. Judge every case study a GEO vendor shows you by which category it falls into before you judge the number itself.</p>
  </div>""",
))

_R_036 = ("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
          "Where the SparkToro consistency finding first showed up in this batch, as one data point among several.")
_R_035 = ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
          "Five disclosed studies, side by side, and the one myth-bust clean enough to build a rule around.")
_R_037 = ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
          "The mechanics behind the noise, and what to ask any vendor about their own run-to-run consistency.")
_R_038 = ("/bg-038.html", "BG-038", "Six AI Citation Claims the Industry Keeps Repeating",
          "A claim-by-claim scorecard against the same disclosed research this whole batch draws from.")
_R_039 = ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
          "The traffic numbers behind why any of this measurement work is worth doing at all.")

# ---------------------------------------------------------------- BG-035
ARTICLES.append(dict(
    slug="bg-035", bid="BG-035", date="2026-08-13", date_label="August 13, 2026", read=9,
    tags=["Original Research", "AI Citation", "Methodology"],
    title="The Complete Map of AI Citation Research in 2026: Every Disclosed Study We Could Verify",
    h1="The Complete Map of AI Citation Research in 2026. <em>Five Studies</em> That Actually Disclose Their Method",
    h1_plain="The Complete Map of AI Citation Research in 2026: Every Disclosed Study We Could Verify",
    subtitle="Five studies with a stated sample size, a stated date range, and a named method, laid out side by side, plus the one matched-control test clean enough to settle an argument.",
    meta_desc="A sourced map of every disclosed-methodology AI citation study verified as of August 2026: Ahrefs, SE Journal/Victorious, Muck Rack, Seer Interactive, and the founding academic paper.",
    og_desc="75,000 brands. 25 million links. 47,097 citations. Five studies actually disclose their sample size and method. We put them side by side and flagged where they disagree with each other.",
    ld_desc="A comparison of disclosed-methodology research into what correlates with AI engine citation, covering Ahrefs, Search Engine Journal, Victorious, Muck Rack, Seer Interactive, and the Princeton/Georgia Tech GEO paper.",
    keywords="AI citation research 2026, what gets you cited by AI, GEO correlation study, Ahrefs AI visibility study, Muck Rack AI citation study, does schema help AI search, AI citation methodology",
    about=["Generative Engine Optimization", "AI Citation Research", "Content Strategy", "Original Research Synthesis"],
    findings=[("84%", "of all AI citations trace to earned media, not a brand's own website, per Muck Rack's 25-million-link study"),
              ("99.99%", "of the 49,391 citations Search Engine Journal and Victorious logged across 175 brands pointed to third-party domains"),
              ("0.74", "the strongest single correlation Ahrefs found across 75,000 brands: YouTube mentions against AI Mode citation"),
              ("42%", "of pages that looked fresh by edit date were actually first published within the past year, per Seer Interactive")],
    faq=[("Which AI citation study should I actually trust?",
          "The ones that tell you their sample size and date range before they tell you their conclusion. Five studies clear that bar as of this research pass: Ahrefs' 75,000-brand correlation study, Search Engine Journal and Victorious's 175-brand study, Muck Rack's 25-million-link Generative Pulse, Seer Interactive's freshness study, and the 2023 Princeton/Georgia Tech/Allen Institute/IIT Delhi paper that founded the field. Everything else circulating under a headline like '2026 GEO statistics' is worth reading skeptically until it names its method."),
         ("Does schema markup actually help you get cited by AI?",
          "Ahrefs tested this directly: 1,885 pages that added JSON-LD schema, each matched against three control pages with similar existing citation levels that didn't add schema. The result was no statistically significant citation increase on any of the three platforms tested. Schema correlates with citation in raw data because sites that bother with it also tend to invest more broadly in content and technical SEO, not because the markup itself moves the needle."),
         ("Do backlinks matter for AI citation the way they do for Google rankings?",
          "It's genuinely unresolved, and the two studies that measured it don't agree. Ahrefs found raw backlink count correlates weakly with citation across all three engines it tested. Search Engine Journal and Victorious found a moderate 0.49 correlation between referring domains and AI mention rate. Neither study isolated whether backlinks help directly or just help a page get indexed and read in the first place, which is a different, upstream question."),
         ("Is the original Princeton GEO paper still worth reading in 2026?",
          "As the paper that founded the field, yes. As current-state evidence about how today's production ChatGPT, Gemini, or Perplexity actually retrieve, treat it carefully. It predates 2026 and its benchmark is a synthetic query set, not live production traffic. What holds up is the shape of the finding: five of nine tested content techniques produced real, measurable gains, and four, including keyword stuffing and generic simplification, did nothing or hurt.")],
    related=[_R_038, _R_037, _R_036],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Search "AI citation statistics 2026" and you get a wall of blog posts. Most are written by GEO tool vendors. Many cite each other in a loop. Almost none of them names a sample size, a date range, or a statistical method before stating a conclusion as fact. Buried inside that wall are five studies that actually disclose how they were built, and one further test clean enough to settle an argument that the rest of the category is still having in circles. This is a map of all six, side by side, with the disagreements between them left in rather than smoothed over.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Every study below discloses a sample size, a date range, and a named method: Ahrefs' Brand Radar correlation study, Search Engine Journal and Victorious's 8-platform brand study, Muck Rack's Generative Pulse link study, Seer Interactive's freshness study, and the Princeton/Georgia Tech/Allen Institute/IIT Delhi academic paper that founded the field. This piece deliberately leaves out the undisclosed-methodology claims that circulate around the same topics, most of which trace to GEO-vendor blog posts with no stated sample; those are the subject of a separate piece.</p>
    <p>Where two of these disclosed studies measured something similar and reported different numbers, such as Ahrefs' and Search Engine Journal/Victorious's separate web-mentions correlations, that disagreement is stated here rather than collapsed into one tidy figure.</p>
  </div>

  <h2>Five studies, side by side</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Study</th><th>Sample</th><th>Window</th><th>Headline finding</th></tr></thead>
    <tbody>
      <tr><td>Ahrefs correlation study</td><td>75,000 brands, 3 engines</td><td>Published Dec 2025</td><td>YouTube mentions correlate strongest with citation, 0.71 to 0.74</td></tr>
      <tr><td>SE Journal / Victorious</td><td>175 brands, 8 platforms, 49,391 citations</td><td>Published Jul 2026</td><td>96% recognized accurately, 89% never appeared in category answers</td></tr>
      <tr><td>Muck Rack Generative Pulse</td><td>25M+ links, 17 industries</td><td>3 editions, latest May 2026</td><td>84% of citations trace to earned media, not owned sites</td></tr>
      <tr><td>Seer Interactive</td><td>7,683 pages, 47,097 citations, 4 verticals</td><td>Mar to Jun 2026</td><td>Sustained citation tracks moderate freshness, not maximum freshness</td></tr>
      <tr><td>Princeton / Georgia Tech / Allen Institute / IIT Delhi</td><td>GEO-bench synthetic query set</td><td>arXiv Nov 2023, KDD 2024</td><td>5 of 9 content techniques produced real, measurable gains</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Ahrefs: 75,000 brands, and YouTube beats everything else it tested</h2>

  <p><a href="https://ahrefs.com/blog/ai-brand-visibility-correlations/">Ahrefs' correlation study</a>, published 12 December 2025 by Louise Linehan and built on Brand Radar data, ran a Spearman correlation across 75,000 brands (filtered to Domain Rating above 40 and a top keyword averaging at least 800 monthly searches) against citation in ChatGPT, Google AI Mode, and Google AI Overviews. YouTube mentions came out on top in every engine tested: 0.737 for ChatGPT, 0.740 for AI Mode, 0.712 for AI Overviews. Branded web mentions came next (0.656 to 0.709), then branded anchor text (0.511 to 0.628), then branded search volume (0.352 to 0.466), then Domain Rating itself, the weakest of the named signals tested at 0.266 to 0.326. Raw backlink count was weak across all three engines.</p>

  <p>Ahrefs is explicit that this is correlation, not causation, and states it plainly rather than letting the reader assume otherwise. The one finding worth carrying forward on its own: the three engines showed high cross-platform agreement, 0.749 to 0.821, in which brands they mentioned at all, even though their retrieval mechanics differ. Whatever makes a brand citable seems to be more a property of the brand than of the specific engine asking about it.</p>

  <h2>Search Engine Journal and Victorious: being known and being cited are different things</h2>

  <p>The <a href="https://www.searchenginejournal.com/ai-brand-mention-study-victorious-spa/582765/">Search Engine Journal and Victorious study</a>, published 29 July 2026 by Michael Transon, covered 175 brands across five verticals (legal, healthcare, SaaS, financial services, ecommerce) and eight platforms: ChatGPT, Claude, Gemini, Copilot, Perplexity, Google AI Overviews, Google AI Mode, and Meta AI. The gap it found is the sharpest number in this whole map: <strong>96% of brands were described accurately when an AI platform was asked about them directly, but 89% never appeared</strong> in answers to category-research prompts like "best X for Y." Recognition and citation are not the same skill, and most brands have one without the other.</p>

  <p>Of 49,391 logged citations, 99.99% pointed to third-party domains rather than the brand's own site. Only 4 of 150 tracked brands earned any self-citation at all in category-research answers. Brands with fewer than 2,000 indexed web pages mentioning them, from other sites, appeared in AI category answers only 3% of the time. The study's own correlation figures for referring domains (0.49) and third-party web mentions (0.45) are moderate, not strong, and notably lower than Ahrefs' branded-web-mentions figure above. Different cohort, different vertical mix, different result: worth noting as a real disagreement between two disclosed studies rather than reconciling it into one number.</p>

  <p>Platform accuracy on plain recognition also varied more than the category's marketing suggests: Google AI Mode, Gemini, ChatGPT, Google AI Overviews, and Copilot all exceeded 83% accuracy across verticals, while Perplexity recognized fewer than 55% of SaaS and ecommerce brands correctly, and Meta AI recognized just 46% of SaaS brands.</p>

  <h2>Muck Rack: earned media drives citation, and Claude cites far less often than ChatGPT</h2>

  <p><a href="https://muckrack.com/blog/what-is-ai-reading-may-2026">Muck Rack's Generative Pulse</a>, now three editions deep since July 2025 with the most recent published May 2026, is built on 25 million or more links across 17 industries pulled from ChatGPT, Claude, and Gemini answers. Its most-repeated finding: <strong>earned media accounts for 84% of all AI citations</strong>, and that figure has held stable, in a range of 82 to 89%, across all three editions. Journalism alone accounts for 25 to 27% of citations. Paid or advertorial content is essentially never cited, at 0.3%.</p>

  <p>The other number worth carrying is how often each engine bothers to cite anything at all. ChatGPT cites sources in 96% of responses. Gemini cites in 82%. Claude cites in just 55%, well behind both. If your GEO strategy leans on a citation appearing next to your name, that ceiling is lower on Claude before you've done anything else right or wrong.</p>

  <h2>Seer Interactive: the freshness signal is not what it looks like</h2>

  <p><a href="https://www.seerinteractive.com/insights/study-content-recencys-impact-on-ai-visibility-in-2026">Seer Interactive's study</a>, published 24 July 2026 by Sonny Vasquez, tracked 7,683 pages and 47,097 citations across ChatGPT, Gemini, and Perplexity in four verticals (pet retail, vacation rentals, energy, banking) between March and June 2026. On the surface, freshness matters: 75% of cited pages were updated within the last year, 88% within two years, and content older than three years barely gets cited at all. Gemini weighted freshness hardest (78% of citations updated within a year), ahead of ChatGPT (73%) and, surprisingly given its real-time reputation, Perplexity (65%).</p>

  <p>The finding underneath that one is the interesting part: <strong>72% of citations "looked fresh" by their last-modified date, but only 42% of those pages were originally published within the past year.</strong> Most of the freshness signal these engines reward is coming from edits to older pages, not genuinely new content. Pages cited consistently across all four months of the study averaged 68% freshness with a median age of six months. Pages that got a single spike citation skewed newer, 86% fresh with a median age of two months. Sustained citation tracks moderately fresh content. Maximally fresh content gets the occasional spike, not the staying power.</p>

  <h2>The paper that started the field, dated honestly</h2>

  <p>The <a href="https://arxiv.org/pdf/2311.09735">Princeton, Georgia Tech, Allen Institute, and IIT Delhi paper</a> that coined "Generative Engine Optimization" was posted to arXiv on 16 November 2023 and published at KDD 2024. As of March 2026 it has been downloaded more than 9,106 times and cited 76 or more times, which makes it the closest thing this category has to a peer-reviewed foundation. It also predates 2026 by more than two years, and its benchmark, GEO-bench, is a synthetic query set with black-box optimization, not live traffic against today's production ChatGPT, Gemini, or Perplexity. Cite it as the paper that started the field, not as current-state evidence.</p>

  <p>What it found still holds up as a shape, if not as a precise number: nine content techniques were tested, and five produced statistically distinguishable gains. Statistics Addition had the largest single lift, cited at up to 41%. Quotation Addition reached around 43% on one metric. Cite Sources landed around 28 to 30% overall, and specifically produced a 115% visibility jump for a page that started ranked fifth, meaning the technique helped weaker pages more than pages that were already doing well. Fluency Optimization added roughly 29%, and Authoritative Voice also produced a real gain. Four techniques did nothing or hurt: Keyword Stuffing, Easy-to-Understand simplification, Content Padding, and Pure Persuasive Language, which is worth naming because "just make it easier to read" and "add more keywords" remain two of the most common pieces of GEO advice still circulating despite this paper contradicting both.</p>

  <h2>The clearest myth-bust in this pass: schema markup</h2>

  <p>Ahrefs ran a second, separate study specifically to settle whether adding schema markup causes citation, rather than merely correlating with it. It tracked 1,885 pages that added JSON-LD schema between August 2025 and March 2026, matched each one against three control pages from different domains with similar existing citation levels that did not add schema, and measured citation-count change across Google AI Overviews, Google AI Mode, and ChatGPT.</p>

  <p><strong>The result was no statistically significant citation increase on any platform.</strong> AI Overviews citations actually fell 4.6%, a result significant in the wrong direction. AI Mode was up 2.4% and ChatGPT up 2.2%, neither reaching significance. Separately, in a six-million-URL pass, pages cited by AI were nearly three times more likely to already carry JSON-LD than uncited pages. Ahrefs' own conclusion is that this is confounded: sites that bother adding schema also tend to invest more broadly in technical SEO, authoritative content, and link building. Schema is a marker of a well-run site, not a cause of citation on its own.</p>

  <div class="callout teal">
    <div class="callout-label">What holds up across all five studies</div>
    <p>None of these five studies agree on exact numbers, and two of them (Ahrefs and Search Engine Journal/Victorious) directly disagree on how strong a web-mentions correlation actually is. What survives that disagreement is the shape underneath it: your own site is a weak citation source everywhere it was measured, earned coverage and third-party mentions dominate, correlation keeps getting mistaken for causation, and no single tactic tested so far, schema included, moves the number on its own. Treat any claim that skips straight past that shape to a clean single percentage as marketing until it shows you its method.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-037
ARTICLES.append(dict(
    slug="bg-037", bid="BG-037", date="2026-08-13", date_label="August 13, 2026", read=8,
    tags=["Methodology", "AI Visibility Scoring", "Original Research"],
    title="Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
    h1="Why No Two AI Visibility Scores Ever Agree. <em>A 615x Spread</em> Is Not a Bug, It Is the Category",
    h1_plain="Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
    subtitle="SparkToro found less than a 1-in-100 chance an AI platform repeats its own answer. One industry estimate puts the citation-rate spread across engines, for the same brand, at 615 times. Here is what actually causes that noise, and how to read any vendor's score, including ours, without being misled by it.",
    meta_desc="Why AI visibility scores never match between vendors, what causes run-to-run instability in AI answers, and concrete questions to ask before trusting any single score, including BrandGEO's.",
    og_desc="Less than a 1-in-100 chance an AI platform gives the same brand list twice. A cited 615x spread in citation rate across engines for one brand. Here is how to actually read a score.",
    ld_desc="An explainer on why AI visibility scores vary between runs and vendors, drawing on SparkToro's consistency study and industry commentary on cross-engine measurement variance.",
    keywords="AI visibility score accuracy, why AI visibility scores differ, GEO score methodology, AI search consistency study, how to read an AI visibility dashboard, SparkToro AI consistency",
    about=["AI Visibility Measurement", "Methodology Transparency", "Generative Engine Optimization", "Original Research Synthesis"],
    findings=[("<1 in 100", "chance the same AI platform returns the same brand list twice for the same question, per SparkToro's 2,961-query study"),
              ("~1 in 1,000", "chance that same platform returns the list in the same order twice"),
              ("615x", "citation-rate spread reported across engines for one brand and prompt set in a 2026 industry piece, Grok near 27% against Claude near zero"),
              ("49/100", "the median score three independent 2026 visibility benchmarks converge on, though their underlying definitions are not identical")],
    faq=[("Why do AI engines give different answers to the same question asked twice?",
          "Because the answer is not a fixed lookup the way a Google ranking is. SparkToro's study of 2,961 queries across three AI platforms found less than a 1-in-100 chance the same platform returns the same list of brands twice for an identical question, and roughly a 1-in-1,000 chance it returns that list in the same order. On top of that baseline instability, model updates, session or login state, and even small shifts in how a prompt is worded can move the result further."),
         ("Should I trust a vendor's AI visibility score?",
          "Trust it as a directional signal, not a precise measurement, and only after asking how it was produced. A vendor that shows a single clean score with no disclosed variance is not more accurate than one that shows a range, it is hiding the noise that every disclosed study in this category has found to be real."),
         ("What should I actually ask a GEO vendor about their scoring before I sign?",
          "Ask how many times they run the same prompt before reporting a number, whether the score you see is a single pass or an average across runs, and what their own run-to-run variance looks like on a prompt they've tracked for a month. If a vendor cannot answer that last one, they likely have not measured their own consistency, which means they cannot tell you how much to trust the number in front of you."),
         ("Is a trend more reliable than a single score?",
          "Yes, according to the one industry voice in this research that addressed the question directly. Brainlabs' April 2026 analysis recommends prioritizing trend direction and competitive benchmarking over any single precise score, arguing that the concept of a fixed 'ranking' does not translate cleanly from Google search to AI answers in the first place.")],
    related=[_R_036, _R_035, _R_026],
    cta_h="Track the trend, not one number",
    cta_p="Run your domain on a schedule and watch the direction over weeks, not a single snapshot. The method is disclosed on screen every time, so you can see exactly what changed between runs.",
    body="""  <p>Our own buyer's guide to this category mentioned, in passing, that AI platforms rarely repeat themselves when asked the same question twice. That is true, and it deserves more than a passing mention, because it is the single fact that should change how anyone reads any AI visibility score, including the ones this site produces. This piece stays on that one question: why does the number move, how much does it move, and what can you actually trust once you know it moves.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. SparkToro's consistency study is disclosed methodology, drawn directly from its own published research post: 600 volunteers, 2,961 individual queries, 12 prompts, three major AI platforms. The 615x citation-rate spread and the 49/100 convergence figure both trace to a single 2026 industry commentary piece rather than a named, independently reproducible study, and are presented here as exactly that, a cited industry observation, not an audited result. Brainlabs' analysis of AI-visibility measurement methods is a named, dated piece (20 April 2026) with a clear argument, not a data study of its own.</p>
  </div>

  <h2>The instability is not a vendor problem. It is the medium.</h2>

  <p>The most-cited independent research on this question is <a href="https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/">SparkToro's study</a>, run by Rand Fishkin's team with 600 volunteers submitting 2,961 individual queries across 12 prompts (chef's knives, headphones, cancer care hospitals, and digital marketing consultants were among the tested categories) on three major AI platforms. The finding: <strong>there is less than a 1-in-100 chance that the same AI platform, asked the identical question twice, returns the same list of brand recommendations</strong>, and roughly a 1-in-1,000 chance the list comes back in the same order. Claude repeated a list slightly more often than ChatGPT or Google's AI in the study, but still rarely in the same order.</p>

  <p>This is worth sitting with, because it means "ranking" as a concept, the entire foundation of how SEO reporting has worked for two decades, does not transfer cleanly. A Google search result for a fixed query is close to deterministic. An AI answer to the same question, asked a minute later, is closer to a fresh roll of the dice weighted by everything the model has learned, not a lookup against a stable index.</p>

  <h2>What is actually moving between two runs of the same prompt</h2>

  <p>A separate April 2026 piece from <a href="https://www.brainlabsdigital.com/ai-visibility-data-accuracy/">Brainlabs</a>, published 20 April 2026, makes the mechanical case for why. It names four estimation approaches used across the AI-visibility category, panel-based sampling, clickstream inference, keyword-to-prompt modeling, and direct API sampling, and argues each carries real weaknesses. Its sharpest line: <strong>"the concept of a 'ranking,' the foundational unit of traditional SEO reporting, simply doesn't translate to AI search."</strong> It also flags that the search-volume-to-AI-prompt-volume conversion factor most vendors quietly rely on is "largely assumed" rather than measured.</p>

  <p>Layer that baseline instability with three more things that move a result and rarely get disclosed on a vendor's dashboard: model updates change what a system has learned since the last time you checked, session or login state can shift what an engine surfaces to a signed-in versus anonymous request, and even a small shift in how a prompt is worded, "best X" versus "top X," can pull in a different answer entirely. None of these are bugs a vendor can engineer away. They are properties of asking a generative model the same question twice.</p>

  <p>It's worth being precise about what SparkToro's study did and didn't test, since the finding gets flattened a lot in how it's repeated. The 600 volunteers submitted real, individually typed queries, not a single scripted prompt run through an API in a loop, across categories spanning consumer products (chef's knives, headphones) and services with real stakes attached (cancer care hospitals, digital marketing consultants). That range matters, because it rules out the easy explanation that the instability is an artifact of one narrow, low-stakes category. It showed up everywhere the study looked.</p>

  <h2>The 615x spread, and what it actually measures</h2>

  <p>One 2026 industry commentary piece, cited here as exactly that rather than as an audited study, put the citation-rate variance across engines at up to 615 times for the same brand and prompt set: Grok reportedly citing the brand in 27.01% of responses against Claude citing it in effectively zero. That number is dramatic, and it is tempting to read it as proof one engine simply favors a brand 615 times more than another. The more honest read is that scoring definitions vary as much between engines and tools as the engines themselves do. What counts as a "citation" (a named mention, a clickable source link, a brand appearing anywhere in a numbered list) is a choice each measurement makes, not a fixed fact about the world, and a 615x spread is at least partly a spread in what was being counted.</p>

  <h2>Three benchmarks converge on 49/100, and that might be a coincidence</h2>

  <p>The same commentary notes that three independent 2026 AI-visibility benchmarks, run across more than 3,000 brands, reportedly converge on a median score close to 49/100. On its face that convergence looks like confirmation: three different tools, roughly the same middle number, so maybe there is a real ground truth underneath all the noise after all. The honest caveat attached to that finding in the source material is that the underlying scoring definitions across those three benchmarks are not identical, so the convergence may be coincidental rather than confirmatory. A shared median is not the same thing as a shared method, and this is exactly the kind of clean-looking number this whole category, BrandGEO included, should be careful not to present as more settled than it is.</p>

  <h2>What a demo can't show you, and why that matters more here than elsewhere</h2>

  <p>The instability problem gets worse, not better, in a sales context. Several independent vendor-evaluation guides converge on the same warning, synthesized in our own buyer's guide: a demo shows you what the vendor wants you to see, on a prompt and a day the vendor picked, not what your account will show a month from now on a prompt you care about. That warning matters more once you understand SparkToro's finding, because a vendor doesn't need to mislead you to show you a flattering number. They just need to run the demo once, on a good day, on a prompt where the brand happened to land well that particular time. Nothing about that is dishonest. It's simply one roll of a dice they didn't tell you was being rolled.</p>

  <p>The practical fix is the same one the checklist already recommends for a different reason: test with your own prompts, side by side against whatever else you're evaluating, before you sign anything. A single side-by-side run won't solve the consistency problem either, since it's still one roll each, but running it more than once, on your own terms, at least removes the vendor's ability to pick which day you see.</p>

  <h2>How to actually read any vendor's visibility score, including ours</h2>

  <p>None of this means AI visibility measurement is worthless. It means a single score from a single run is a snapshot of one methodology's choices on one day, not a stable fact about your brand. A few concrete rules follow from that, and none of them require taking any vendor's word for it:</p>

  <ul>
    <li><strong>A single-run score tells you where you stood on that day, under that method.</strong> It does not tell you where you'll stand tomorrow, and per SparkToro's finding, "tomorrow" can mean the very next identical question.</li>
    <li><strong>Trend direction across many runs is the more trustworthy signal.</strong> Brainlabs' explicit recommendation is to prioritize "intelligence over accounting," meaning direction and competitive comparison over a precise number treated as gospel.</li>
    <li><strong>Ask any vendor how many times they run the same prompt before reporting a result</strong>, and whether the number on your screen is a single pass or an average across repeated runs. A tool that only ever runs once per period cannot tell you anything about its own noise.</li>
    <li><strong>Ask for their own run-to-run variance</strong> on a prompt they've tracked for a month. If they cannot show you that number, they likely have not measured it, which means the confidence in their dashboard is a design choice, not a proven fact.</li>
    <li><strong>A vendor showing one clean score with no disclosed variance is choosing not to show you the noise, not eliminating it.</strong> That line applies to every tool in this category, including this one, and it is worth holding every vendor to it before you buy.</li>
  </ul>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p>Read any AI visibility score the way you'd read a compass, not a GPS coordinate. It tells you a direction worth walking in, not a precise fixed point you should defend to the decimal. The number that matters is whether this week's runs are trending up or down against last month's, not whether today's single score reads 61 or 64.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-038
ARTICLES.append(dict(
    slug="bg-038", bid="BG-038", date="2026-08-13", date_label="August 13, 2026", read=7,
    tags=["Myth-Bust", "AI Citation", "Original Research"],
    title="Six AI Citation Claims the Industry Keeps Repeating, and What the Data Actually Shows",
    h1="Six AI Citation Claims the Industry Keeps Repeating. <em>Here Is What the Data Actually Shows</em>",
    h1_plain="Six AI Citation Claims the Industry Keeps Repeating, and What the Data Actually Shows",
    subtitle="Claim by claim, checked against the disclosed studies rather than the vendor blog posts that keep repeating them: schema markup, ChatGPT's search-trigger rate, backlinks, freshness, and whether AI answers even have a ranking at all.",
    meta_desc="Six common GEO and AI-citation claims checked against disclosed research: schema markup, ChatGPT's web search trigger rate, backlinks, content freshness, and citation ranking, sourced August 2026.",
    og_desc="Schema markup gets you cited: false, per a matched-control test. ChatGPT triggers a search on X% of prompts: nobody outside OpenAI actually knows. Six repeated claims, checked against the disclosed research.",
    ld_desc="A claim-versus-evidence review of six recurring statements in AI search and generative engine optimization marketing, checked against disclosed-methodology research where it exists.",
    keywords="AI citation myths, GEO myths debunked, does schema help AI search, does ChatGPT trigger web search, backlinks AI citation, AI search ranking myth",
    about=["Generative Engine Optimization", "Myth Debunking", "AI Citation Research", "Content Strategy"],
    findings=[("0%", "statistically significant citation lift Ahrefs measured from adding schema markup, in a matched-control test of 1,885 pages"),
              ("Undisclosed", "how often ChatGPT triggers a live web search; OpenAI has never published the figure, every number in circulation is a third-party estimate"),
              ("0.49", "the strongest disclosed correlation found between backlinks and AI citation, and even that one study rates it moderate, not strong"),
              ("6 months", "the median age of content that earns sustained AI citation, versus 2 months for content that gets a single spike citation")],
    faq=[("Does adding schema markup get you cited by AI?",
          "No causal lift was found. Ahrefs matched 1,885 pages that added JSON-LD schema against control pages with similar existing citation levels and measured no statistically significant citation increase on Google AI Overviews, AI Mode, or ChatGPT. Schema correlates with citation in raw data mainly because sites that add it also tend to invest more broadly in content and technical SEO."),
         ("How often does ChatGPT actually trigger a web search?",
          "Nobody outside OpenAI knows for certain. OpenAI has never published the figure. Every specific percentage in circulation, whether 20%, 31%, or 34.5%, is a third-party estimate built on assumptions about total prompt volume, not a disclosed OpenAI number."),
         ("Do backlinks still matter for getting cited by AI engines?",
          "It's unresolved, and the two disclosed studies that measured it don't fully agree. Ahrefs found weak correlation across the three engines it tested. Search Engine Journal and Victorious found a moderate 0.49 correlation for referring domains. Neither isolated whether backlinks help citation directly or just help a page get indexed and read in the first place."),
         ("Is there such a thing as ranking third or fourth in an AI answer, the way you'd rank in Google?",
          "No. Citation in an AI answer is binary, a brand is either cited in a given response or it isn't, with no equivalent of a numbered SERP position. Any framing that talks about 'AI search rankings' the way it talks about Google rankings is describing a system these engines don't actually use.")],
    related=[_R_035, _R_036, _R_026],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Six claims about AI citation show up again and again across GEO marketing, often stated as settled fact with no source attached. Some turn out to be true in a narrower form than advertised. One has been directly tested and found false. One is a number nobody outside a single company actually has. Here is each claim, checked against the disclosed research rather than the blog post that repeated it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Each claim below is checked against either a named, disclosed-methodology study or, where no such study exists, against the explicit absence of one. Three of the six claims trace back to GEO-vendor blog posts (Darkroom, Kime.ai, Wellows, Ai Boost among them) with no stated sample size, and that absence is reported directly rather than papered over with a hedge.</p>
  </div>

  <h2>Claims about what gets you cited</h2>

  <h3>Claim: FAQ schema and inline citations get roughly 40% higher weighting</h3>

  <p>This exact figure, "40% higher weighting" for FAQ schema and inline citations in ChatGPT's source selection, recurs across multiple GEO-vendor blogs with no named study, no sample size, and no stated date range behind the number. It is repeated confidently enough, and often enough, that it has started to read as established fact. It is not. No source in this research pass could trace it to an actual measurement.</p>

  <p><strong>Verdict: unverified. No named study backs this number, and it should be treated as a made-up specific attached to a plausible-sounding general idea.</strong></p>

  <h3>Claim: schema markup gets you cited</h3>

  <p>Ahrefs tested this directly rather than inferring it from correlation. It tracked 1,885 pages that added JSON-LD schema between August 2025 and March 2026, matched each against three control pages with similar existing citation levels that did not add schema, and measured citation-count change across Google AI Overviews, AI Mode, and ChatGPT. The result: no statistically significant increase on any platform. AI Overviews citations actually fell 4.6%, significant in the wrong direction. Separately, in a six-million-URL pass, AI-cited pages were nearly three times more likely to already carry schema than uncited pages, but Ahrefs' own read is that this reflects sites that invest broadly in SEO also tending to add schema, not schema causing the citation.</p>

  <p><strong>Verdict: correlated, not causal. A matched-control test found no lift.</strong></p>

  <h2>Claims about how the engines behave</h2>

  <h3>Claim: ChatGPT triggers a web search on X% of prompts</h3>

  <p>Every specific figure attached to this claim, 20%, 31%, 34.5%, 35%, comes from a third party, not from OpenAI. A same-week review of the public data, published 4 August 2026, states plainly that "we don't know for sure" and that all of the commonly cited figures rest on modeling assumptions about total daily prompt volume rather than a disclosed OpenAI number. OpenAI has never published a search-trigger rate.</p>

  <p>This same pattern of borrowed precision shows up around two other frequently repeated claims that circulate alongside it: that "76.4% of ChatGPT's most-cited pages come from domains with strong off-page presence," and that "ChatGPT relies on RAG using the Bing Search API for 92% of queries." Both trace to SEO-tool-vendor blogs with no disclosed methodology behind either figure, and neither should be repeated as fact without independent verification. The specificity of a number, two decimal places included, is not evidence that anyone actually measured it.</p>

  <p><strong>Verdict: nobody outside OpenAI actually knows. Every percentage attached to this claim is someone's estimate, dressed up as a fact.</strong></p>

  <h3>Claim: backlinks matter for AI citation the same way they do for Google rankings</h3>

  <p>This one splits into "yes" and "no" camps depending which disclosed study you read, and neither camp has the full picture. Ahrefs found raw backlink count correlates weakly with citation across all three engines it tested. Search Engine Journal and Victorious found a moderate 0.49 correlation between referring domains and AI mention rate, a genuinely different result from a related study. General SEO commentary in 2026 keeps asserting backlinks are "still a core ranking signal" without reconciling that claim against either finding. It is possible backlinks matter indirectly, by helping a page get indexed and crawled in the first place, which is upstream of being citable at all, but no study in this research pass isolated that causal chain, and the two disclosed correlation figures that do exist are close enough in size, and different enough in what they measured, that treating either one as the final word would be reading more certainty into the data than it supports.</p>

  <p><strong>Verdict: unresolved. The two disclosed studies that measured it do not agree with each other.</strong></p>

  <h2>Claims about freshness and ranking</h2>

  <h3>Claim: freshness always wins, so publish constantly</h3>

  <p>Partly true, but not in the form usually sold. Seer Interactive's study of 47,097 citations found that pages cited consistently across a four-month window averaged 68% freshness with a median content age of six months, while pages that got a single spike citation skewed younger, 86% fresh with a median age of two months. The deeper finding: 72% of citations "looked fresh" by their last-modified date, but only 42% of those pages were originally published within the past year. Most of what these engines reward as freshness is edits to older pages, not a constant stream of brand-new content.</p>

  <p>The freshness signal also isn't consistent between engines, which undercuts any version of this claim stated as one universal rule. Seer found Gemini weighted freshness hardest, with 78% of its citations updated within a year, ahead of ChatGPT at 73%. Perplexity, the engine most commonly reputed to be the most real-time, came in lowest at 65%, the opposite of its own marketing. A separate estimate elsewhere put a much higher share of Perplexity citations under thirteen weeks old, and the two figures don't obviously reconcile, which is itself evidence that "freshness weighting" numbers move a lot depending on study design and vertical mix, not just on which engine is being measured.</p>

  <p><strong>Verdict: partly true, but sustained citation tracks moderately fresh content, not maximally fresh content. Updating consistently beats publishing constantly.</strong></p>

  <h3>Claim: you can rank third or fourth in an AI answer, the way you'd rank in a Google search result</h3>

  <p>Unlike ten blue links, there is no position 3 inside a ChatGPT or Gemini answer. Citation is binary: a brand is either named and sourced in a given response, or it isn't. Vendor-side framing that talks about "AI search rankings," borrowing the language of a SERP position, is describing a mechanism these systems don't use. It's a useful shorthand for marketing decks, and a misleading one for actually understanding what's being measured.</p>

  <p><strong>Verdict: there's no such thing. You're either cited or you're not, and nothing in between is being tracked.</strong></p>

  <h2>Why these six keep circulating anyway</h2>

  <p>None of the six claims above are malicious. Most started as a reasonable inference from a real, disclosed correlation, then hardened into a flat statement somewhere between the third and tenth blog post that repeated it. Schema correlating with citation is real and disclosed; "schema gets you cited" is the flattened, false version of it. A search-trigger rate being estimable from public data is a legitimate exercise; presenting one estimate as OpenAI's own number is not. The pattern is the same each time: a study with real limits gets summarized by someone who didn't carry the limits forward, and the summary gets repeated by people who never saw the original.</p>

  <div class="callout teal">
    <div class="callout-label">The pattern underneath all six</div>
    <p>Every claim in this piece that turned out to be false or unverifiable shares one trait: a clean, specific number with no named study behind it. Every claim that turned out to be true, or genuinely unresolved, came with a disclosed sample size and a source willing to say "we don't know" where the data ran out. That is the actual filter to apply to the next AI-citation statistic you read, not whether the number sounds impressive.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-039
ARTICLES.append(dict(
    slug="bg-039", bid="BG-039", date="2026-08-13", date_label="August 13, 2026", read=8,
    tags=["Zero-Click Search", "AI Referral Traffic", "Original Research"],
    title="The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
    h1="The Zero-Click Shift. <em>68.01%</em> of Searches Now End Without a Click",
    h1_plain="The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
    subtitle="SparkToro measured it, Adobe measured where the traffic actually went, and a wave of named publishers measured what happens when it doesn't come back. None of this is a forecast. It already happened.",
    meta_desc="The measured data behind AI search's zero-click shift: SparkToro's 68.01% figure, Adobe's 1,324% AI-referral growth, publisher traffic collapse, and the Reddit licensing tension, sourced August 2026.",
    og_desc="68.01% of Google searches now end without a click. AI-referred retail traffic is up 1,324% since October 2024. A travel blog that lost 90% of its traffic twice ceased publishing.",
    ld_desc="A data-driven look at the zero-click search shift, covering SparkToro's disclosed traffic study, Adobe's AI-referral retail data, publisher traffic collapse, and Reddit's AI licensing deal tension.",
    keywords="zero-click search 2026, AI search traffic data, AI referral traffic statistics, publisher traffic decline AI, SparkToro zero-click study, Adobe AI traffic report",
    about=["Zero-Click Search", "AI Referral Traffic", "Publisher Economics", "Original Research Synthesis"],
    findings=[("68.01%", "of Google searches ended without a click in the first four months of 2026, per SparkToro's Similarweb-panel study"),
              ("1,324%", "growth in AI-referred traffic to US retail sites since Adobe began tracking the category in October 2024"),
              ("60%", "drop in search referral traffic for small publishers over the same period, per Chartbeat-sourced reporting"),
              ("$550M/year", "Wells Fargo's estimate for what Reddit's Google and OpenAI licensing deals could be worth if renegotiated in 2026")],
    faq=[("What percentage of searches now end without a click?",
          "68.01%, per SparkToro's study of Similarweb desktop and mobile panel data covering January through April 2026 in the US. That's up from 60.45% in 2024 and 49% in 2019. The study likely undercounts slightly since it excludes Google's mobile app."),
         ("Is AI referral traffic actually replacing the search traffic publishers are losing?",
          "Not for most publishers measured so far. Adobe's data shows AI-referred retail traffic up 1,324% since October 2024, a real and growing channel, but publisher-side data tells a different story: Chartbeat-sourced reporting shows search referral traffic down 60% for small publishers and 47% for mid-sized ones over a comparable window, and named outlets including The Planet D and Stereogum have reported severe, in one case fatal, traffic and revenue losses."),
         ("Why did Reddit's stock drop over an AI licensing deal in 2026?",
          "Reddit has been paid roughly $60 million a year by Google since February 2024 and roughly $70 million a year by OpenAI since mid-2024 for data licensing, both deals up for renewal in 2026. Reddit's stock dropped in July 2026 on reporting that it may not renew the Google deal, since Google's own AI answers are simultaneously reducing the referral traffic those licensing payments were meant to offset."),
         ("Should a brand that has never checked its AI visibility be concerned about any of this?",
          "The measured data says yes, and says it now rather than as a future warning. AI Mode alone passed 1 billion monthly users by May 2026, AI-referred traffic to retail sites is already up over 1,300% since late 2024, and multiple named publishers have already lost most of their search traffic. This is describing what has already happened, not what might happen eventually.")],
    related=[_R_035, _R_038, _R_036],
    cta_h="Check whether you're part of the traffic that moved",
    cta_p="Run your domain through the engines this research covers and see whether you show up in the answers that are replacing the click. Method disclosed on screen, no signup and no card.",
    body="""  <p>The internet's traffic pattern changed enough in the past two years that it shows up clearly in disclosed, independently reproducible data, not just in anecdotes from publishers. Search increasingly ends in an answer rather than a click. Some of that traffic is being rerouted somewhere measurable. A meaningful share of it is simply gone. Here is the data behind both halves of that sentence.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. The zero-click figure comes from SparkToro's own disclosed Similarweb-panel methodology, US-only, January through April 2026, which the source itself flags as a likely undercount since it excludes Google's mobile app. Adobe's AI-referral figures are disclosed methodology drawn from more than 1 trillion tracked visits to US retail sites. Publisher figures trace to Chartbeat-sourced reporting and named, independently reported outlets. Two adjacent figures cited elsewhere in this research pass, a broader "67.1% zero-click" aggregator estimate and a "37% of consumers start with AI" claim, could not be traced to a verifiable primary source in this pass and are deliberately left out here in favor of SparkToro's disclosed number.</p>
  </div>

  <h2>The number: 68.01% of searches now end without a click</h2>

  <p><a href="https://sparktoro.com/blog/in-2026-less-than-one-third-of-google-searches-still-send-a-click/">SparkToro's study</a>, published 9 June 2026 and updated 18 June 2026, used Similarweb's desktop and mobile web panel for January through April 2026, US only, and found that 68.01% of Google searches ended without a click in that window, up from 60.45% in 2024 and 49% in 2019. Overall traffic share to websites fell roughly 22%, about 8 percentage points, between June 2025 and May 2026 alone. The study's authors note it likely undercounts the true figure since it excludes Google's mobile app entirely.</p>

  <p>What's easy to miss inside that number: AI Mode itself accounted for only 0.34% of total search volume in the same window, a small absolute share even as it drives an outsized zero-click effect. Google AI Overviews, appearing on more than 20% of all searches, is doing most of the visible work, cutting click-through by nearly 60% on queries where it shows up. A separate Similarweb-based tracker put the click-through drop on the number one organic position at 58% on AI-Overview-triggering queries, up from a measured negative 34.5% in April 2025, suggesting the effect is still growing rather than leveling off.</p>

  <h2>Where the traffic that does click actually goes</h2>

  <p><a href="https://www.digitalcommerce360.com/2026/06/17/adobe-ai-referred-traffic-to-retail-sites-doubles-in-a-year/">Adobe's analysis</a>, based on more than 1 trillion visits to US retail sites and reported in June 2026, found AI-referred traffic to those sites grew 138% year over year in May 2026 alone, and is up 1,324% since Adobe started tracking the category in October 2024. That is not a rounding error. It is a channel that barely existed twenty months earlier now sending more than thirteen times its original volume.</p>

  <p>The visitors arriving through that channel also behave differently. Adobe found AI-referred visitors spend 53% more time on site and view 23% more pages per visit than other visitors, and separately reported AI-sourced traffic converting 54% better than non-AI traffic, with shoppers 15% more engaged. Adobe's companion breakout for travel sites found AI-driven traffic up roughly 200%, a second vertical confirming this is not a retail-only pattern. The traffic that clicks through from an AI answer, in other words, is a smaller stream than what search used to send, but a higher-intent one.</p>

  <h2>Who's actually sending the traffic, and where it lands once it arrives</h2>

  <p>The referral pie is also being redivided among engines, not just shrinking overall. ChatGPT's worldwide web-traffic referral share fell from roughly 76% in June 2025 to about 53% by May 2026, even as its total visit count held roughly flat, meaning more engines are splitting a similar-sized pie rather than ChatGPT itself shrinking. A second shift inside that number is worth flagging for anyone planning what to publish: homepage-only referrals from ChatGPT, as opposed to deep links straight to the page that was actually cited, rose from roughly 26 to 29% of its referral traffic to roughly 62 to 63% over the same window. An increasing share of ChatGPT-driven visits are landing on a homepage, not the specific page the model cited, which changes what "getting a click from AI" is actually worth to a content team measuring it.</p>

  <p>The buyer side of this shift is moving just as fast as the traffic. G2's 2026 AI Search Insight Report found 51% of B2B software buyers now start their research inside an AI chatbot instead of a search engine, up from 29% in April 2025, and 71% say they rely on chatbots for software research at all, up from roughly 60% seven months earlier. This is a named vendor report and its methodology is only partially disclosed in the material available here, so it's presented as G2's finding rather than an independently audited figure, but the direction lines up with everything else in this piece.</p>

  <h2>What happens to the sites that don't capture that stream</h2>

  <p>The counterpart to Adobe's growth numbers is a documented collapse on the publisher side. Chartbeat-sourced reporting picked up across multiple outlets in 2026 puts search referral traffic down 60% for small publishers, 47% for mid-sized publishers, and 22% for large publishers. Two named cases make the abstract numbers concrete: <strong>The Planet D</strong>, a travel blog, lost half its traffic after Google's AI Overviews launched in May 2024, then lost another 90% on top of that, and ceased publication in 2026. <strong>Stereogum</strong>, a music blog, lost 70% of its ad revenue in 2026, with its founder attributing the largest share of the blame to AI Overviews directly.</p>

  <p>Neither case is being treated as an outlier by the people who study this at scale. The <a href="https://searchengineland.com/news-publishers-search-referrals-drop-report-467408">Reuters Institute (RISJ)</a> forecasts news publishers will see search referral traffic fall by more than 40% over the next three years, through 2029. Axios reported in July 2026 that some publishers are now weighing whether to opt out of Google Search crawling entirely, on the logic that if the crawl no longer reliably pays back in referral traffic, allowing it costs more than it returns.</p>

  <h2>The next stage isn't just answering, it's checking out</h2>

  <p>The rerouting doesn't stop at the answer. Google and Shopify jointly announced the Universal Commerce Protocol in January 2026, an open standard letting an AI agent complete an entire purchase, product selection, payment, and confirmation, on a shopper's behalf without a human ever navigating to the site. Walmart, Target, Visa, Mastercard, American Express, and Stripe have all endorsed it, and it's rolling out US-first with Canada and Australia following by mid-2026. Microsoft shipped a comparable capability, Copilot Checkout, on 8 January 2026, letting a purchase happen inside a chat with Copilot, Bing, MSN, or Edge, with PayPal, Shopify, Stripe, and Etsy as launch partners. Neither of these is a forecast. Both are live. If the zero-click shift already means a brand can lose the click, agentic checkout means it can lose the sale itself to an interface it was never shown on, unless it was citable enough to be the agent's pick in the first place.</p>

  <p>The scale this is heading toward is visible in a single number from Google's own May 2026 I/O keynote: AI Mode passed 1 billion monthly users roughly one year after its US debut, with query volume more than doubling every quarter. A separate EMARKETER forecast puts roughly 31.3% of the US population using generative AI search at all during 2026. Whatever the exact figure settles at, the audience an unmeasured brand is missing is not a fringe one.</p>

  <h2>The Reddit tension: getting paid to feed the thing that's cutting your traffic</h2>

  <p>Reddit's own position captures the whole shift in one contract dispute. Reddit has been paid roughly $60 million a year by Google since February 2024, and roughly $70 million a year by OpenAI since around mid-2024, for licensed access to its content to train and ground AI answers. Both deals are up for renewal in 2026. Reddit's stock dropped in <a href="https://www.cnbc.com/2026/07/22/reddit-stock-google-ai-content-deal.html">reporting from 22 July 2026</a> that it may not renew the Google deal, precisely because Google's own AI answers are simultaneously cutting into the same referral traffic those licensing payments were meant to offset. Wells Fargo estimated a renegotiated, combined value across both deals could reach roughly $550 million a year if they're renewed at all. Whether that number holds, the underlying tension is the more durable finding: content that feeds an AI answer and content that used to earn a click are increasingly the same content, and the payment for the first doesn't automatically compensate for losing the second.</p>

  <div class="callout teal">
    <div class="callout-label">Why this belongs in a decision, not a briefing document</div>
    <p>None of the numbers in this piece describe something that might happen. AI Mode passed 1 billion monthly users by May 2026. AI-referred retail traffic is already up over 1,300% since late 2024. Search referral traffic for small publishers is already down 60%. A brand that has never checked whether it shows up in an AI-generated answer is not being cautious by waiting, it is choosing not to look at a shift that has already been measured, named, and, for at least two publishers, has already ended in a shutdown.</p>
  </div>""",
))


# ============================================================
# Batch appended 2026-08-13 (second pass): BG-040 to BG-044
# (5 shorter blog posts from scripts/articles_content_batch2.py,
# merged in after review)
# ============================================================

CTA_H_DEFAULT = "See your own number, not someone else's case study"
CTA_P_DEFAULT = "Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card."

# Cross-references into the BG-035 to BG-039 batch, copied verbatim from
# articles_content.py so this file has no import dependency on it.
_R_035 = ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
          "Five disclosed studies, side by side, and the one myth-bust clean enough to build a rule around.")
_R_036 = ("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
          "Where the SparkToro consistency finding first showed up in this batch, as one data point among several.")
_R_037 = ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
          "The mechanics behind the noise, and what to ask any vendor about their own run-to-run consistency.")
_R_038 = ("/bg-038.html", "BG-038", "Six AI Citation Claims the Industry Keeps Repeating",
          "A claim-by-claim scorecard against the same disclosed research this whole batch draws from.")
_R_039 = ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
          "The traffic numbers behind why any of this measurement work is worth doing at all.")

# Cross-references within this batch.
_R_040 = ("/bg-040.html", "BG-040", "Is GEO Just SEO With a New Name?",
          "What nine legacy SEO platforms actually built on top of the keyword and rank-tracking infrastructure they already had.")
_R_041 = ("/bg-041.html", "BG-041", "How Many AI Engines Does a GEO Tool Actually Need to Cover?",
          "Why a bigger named engine count is not automatically more useful once you check which engines are actually gated.")
_R_042 = ("/bg-042.html", "BG-042", "The GEO Funding Boom, Mapped",
          "Six GEO-native startups, over $300 million raised, and one $1 billion valuation inside two years.")
_R_043 = ("/bg-043.html", "BG-043", "What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
          "The five structural changes and what they mean for where a brand should be investing attention now.")
_R_044 = ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
          "Four genuinely different retrieval architectures, and why what works for one does not automatically transfer.")

# ---------------------------------------------------------------- BG-040
ARTICLES.append(dict(
    slug="bg-040", bid="BG-040", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Competitive Landscape", "Legacy SEO Tools", "Buyer Guide"],
    title="Is GEO Just SEO With a New Name? We Checked What 8 Legacy SEO Tools Actually Built",
    h1="Is GEO Just SEO With a New Name? We Checked What <em>8 Legacy SEO Tools</em> Actually Built",
    h1_plain="Is GEO Just SEO With a New Name? We Checked What 8 Legacy SEO Tools Actually Built",
    subtitle="Semrush, Ahrefs, BrightEdge, Conductor, seoClarity, Search Atlas, Nightwatch, SE Ranking and Advanced Web Ranking have all shipped an AI-citation feature in the past year and a half. We checked what each one is actually built on, and only one of them tells you.",
    meta_desc="We audited nine legacy SEO platforms' AI-visibility features against their own product pages: what each one added, and whether it is new infrastructure or a bolt-on to an existing keyword database.",
    og_desc="Not one of the nine legacy SEO tools that added AI tracking built dedicated prompt-and-response infrastructure from scratch. Ahrefs discloses the most about its own adaptation. Here is what each one actually did.",
    ld_desc="An audit of legacy SEO platforms' AI-visibility and citation-tracking features, checking whether each was built as new infrastructure or extended from an existing keyword or rank-tracking pipeline.",
    keywords="GEO vs SEO tools, is GEO just SEO rebranded, legacy SEO AI features, Semrush AI Visibility Toolkit, Ahrefs Brand Radar methodology, AI citation tracking tools",
    about=["Generative Engine Optimization", "Competitive Analysis", "SaaS Buying Guide", "Methodology Transparency"],
    findings=[("9", "legacy SEO platforms found to have added an AI-citation-tracking feature in the last 12 to 18 months"),
              ("0", "of them built dedicated, from-scratch prompt-and-response infrastructure the way GEO-native startups did"),
              ("28.7B", "keywords Ahrefs filters from a base of 110 billion to build Brand Radar, the most disclosed methodology found in this pass"),
              ("$129/mo", "Ahrefs' entry-level Lite plan, which currently includes Brand Radar free during its beta")],
    faq=[("Is GEO just SEO with a new name?",
          "Not entirely, and not entirely something new either. Nine legacy SEO platforms checked in this pass genuinely built new AI-citation features with real engineering behind them, but every one of them extended an existing keyword database or SERP-scraping pipeline rather than building the kind of dedicated prompt-and-response infrastructure GEO-native startups built from a blank page. It is a real feature bolted onto an old foundation, not a rebrand and not a from-scratch rebuild."),
         ("Which legacy SEO tool discloses the most about how its AI tracking actually works?",
          "Ahrefs, by a wide margin. Its Brand Radar methodology page states the exact keyword base it draws from, names its query-expansion method, reports modeled monthly query volume per AI platform, and explicitly lists its own limitations, including that it deliberately keeps hallucinated links in its data rather than cleaning them out. Almost none of the other eight vendors in this pass publish anything close to that level of detail."),
         ("Should I use my existing SEO tool's AI add-on instead of a dedicated GEO tool?",
          "It depends on what you already pay for and how much coverage you need. If you already run one of these nine platforms, testing its AI module against your own prompts costs nothing and may be enough. If you need broad, disclosed, purpose-built coverage, a dedicated GEO tool remains the more thorough option, at the cost of one more subscription."),
         ("Do these legacy tools' AI features track more than just Google's AI Overviews?",
          "Some genuinely do, Semrush's toolkit covers Google AI Mode, Gemini and ChatGPT alongside AI Overviews, for instance, but several buyer-evaluation guides warn that some legacy tools advertise broad AI tracking while only functionally covering Google's AI Overviews. Check the specific engine list on the feature page itself rather than the marketing headline.")],
    related=[_R_036, _R_035, _R_041],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>"Is GEO just SEO with a new coat of paint" is one of the most common objections raised about this category, and it usually gets answered with a shrug or a slogan. We wanted an actual answer, so we checked nine of the biggest legacy SEO platforms that have shipped an AI-visibility feature in the past year and a half, against their own product pages, and asked one specific question of each: did the company build new infrastructure to track how AI engines answer, or extend something it already had?</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Every vendor below is drawn from its own current product and feature pages, cross-checked against independent review coverage where it exists. Disclosure quality varies enormously: Ahrefs publishes a dedicated methodology page for Brand Radar, and most of the other eight publish only a marketing description of the feature, with no stated sample size, query volume, or update cadence. Where a vendor's own claim could not be independently verified, that is stated rather than repeated as fact.</p>
  </div>

  <h2>Nine vendors, one shared playbook</h2>

  <p>Read all nine product pages back to back and a pattern shows up immediately: bolt an AI-citation-tracking feature onto the rank-tracking product that already exists, price it as an add-on or bundle it free during a land-grab phase, and build it on top of the keyword database or SERP-scraping pipeline the company already owns, rather than construct fresh prompt-and-response infrastructure from nothing.</p>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Vendor</th><th>What it added</th><th>What it is built on</th></tr></thead>
    <tbody>
      <tr><td>Semrush</td><td>AI Visibility Toolkit: Prompt Tracking, Brand Performance, Visibility Overview</td><td>A stated "prompt database of 289M+ AI queries," refreshed daily</td></tr>
      <tr><td>Ahrefs</td><td>Brand Radar</td><td>28.7B keywords filtered from a base of 110B, plus People Also Ask data and semantic fanout</td></tr>
      <tr><td>BrightEdge</td><td>Generative Parser, AI Catalyst, and (March 2026) AI Hyper Cube</td><td>Its existing enterprise SEO crawl and reporting infrastructure</td></tr>
      <tr><td>Conductor</td><td>AI Search Performance (relaunched April 2026) and AgentStack</td><td>Its existing enterprise SEO reporting platform</td></tr>
      <tr><td>seoClarity</td><td>Clarity ArcAI</td><td>Its existing client visibility and rank-tracking data</td></tr>
      <tr><td>Search Atlas</td><td>An LLM Visibility module, plus OTTO, an agent that edits schema and meta tags via a site pixel</td><td>Its existing site-pixel automation stack</td></tr>
      <tr><td>Nightwatch</td><td>LLM tracking, added to its multi-engine rank tracker</td><td>Its existing Google, Bing, Yahoo and DuckDuckGo SERP infrastructure</td></tr>
      <tr><td>SE Ranking</td><td>AI Results Tracker (an add-on) plus SE Visible (a separate product)</td><td>Its existing platform, split into two purchase paths</td></tr>
      <tr><td>Advanced Web Ranking</td><td>AI Overview tracking, enabled by default on its "Google Universal" engine</td><td>Its existing rank-tracking infrastructure across 170+ countries</td></tr>
    </tbody>
  </table>
  </div>

  <p>Not one of the nine built a dedicated, from-scratch system for firing prompts at AI engines and parsing what comes back. That distinction is worth taking seriously: a rank tracker's underlying asset is a crawled index and a keyword list, both of which these companies already had at scale. A prompt-and-response tracker needs something different, a live pipeline that asks AI engines real questions and reads the answers, which is closer to what the GEO-native vendors were built around from the start.</p>

  <h2>The one exception, and why it is not a clean one</h2>

  <p>Ahrefs is the honest outlier here, though not quite for the reason it first appears. Its <a href="https://ahrefs.com/blog/brand-radar-methodology/">Brand Radar methodology page</a> discloses far more than any competitor in this list: the exact keyword base (28.7 billion filtered from 110 billion discovered), the query-expansion method (People Also Ask data plus semantic fanout), modeled monthly query volume per AI platform (Google AI Overviews alone at roughly 282 million a month), and an explicit admission that coverage is "strongest in English" and that hallucinated or malformed links are deliberately kept in the data because they "reflect real model output." That level of self-disclosed limitation is close to unmatched in this category.</p>

  <p>But look at what Brand Radar is actually built from: a keyword and People Also Ask database Ahrefs already owned, expanded with a fanout technique, not a new prompt infrastructure. It is the best-documented legacy adaptation in this pass, not a departure from the pattern. It is currently free across every Ahrefs subscription tier, including the $129/month Lite plan, during its beta, with an explicit statement that it will "eventually become a paid add-on."</p>

  <h2>What "extended, not rebuilt" costs you as a buyer</h2>

  <p>The practical risk shows up in coverage depth. A recurring line in vendor-evaluation checklists warns that legacy tools "claim AI tracking" while some only cover Google AI Overviews in practice, and reading these nine feature pages bears that out unevenly. Advanced Web Ranking's feature is explicitly scoped to Google's AI surfaces. Nightwatch's own review coverage notes "specific user reviews about this feature are scarce," suggesting its newer LLM module is less battle-tested than its long-established core rank tracker. SE Ranking splits its offering across two separate purchases depending on how much AI-engine breadth you actually want.</p>

  <p>Search Atlas's OTTO is worth naming on its own, because of what it automates rather than tracks: it implements schema markup and meta-tag changes through a site pixel with no developer required, pending manual approval per change. That is a genuinely useful time-saver, but worth knowing before leaning on it that a matched-control study found adding schema markup produces no measurable citation lift by itself, per <a href="/bg-038.html">BG-038's schema myth-bust</a>. OTTO can save engineering hours; it cannot buy citation on its own.</p>

  <h2>So, is it just SEO with a new name?</h2>

  <p>The honest answer is neither of the two easy ones. It is not pure rebranding: these nine companies built real features with real engineering behind them, and Semrush's prompt database and Ahrefs' disclosed methodology are genuine assets. It is also not the same thing GEO-native vendors built: none of the nine constructed dedicated prompt-and-response infrastructure from a blank page, and only one discloses its method well enough for a buyer to judge what they are actually getting. If you already pay for one of these platforms, test its AI feature against your own prompts before assuming it matches a purpose-built tool's coverage. If disclosed methodology and breadth matter more to you than convenience, the newer vendors covered in <a href="/bg-036.html">our buyer's guide to 13 GEO-native vendors</a> remain the more thorough option, at the cost of another subscription.</p>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p>A legacy SEO tool's AI feature is an extension of what it already had, not a rebuild of what tracking AI answers actually requires. That is not automatically worse, real assets sit behind several of these launches, but it means the coverage and depth you get depends entirely on which existing pipeline the feature was attached to. Ask what a feature is built from before assuming it answers the same question a purpose-built GEO tool does.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-041
ARTICLES.append(dict(
    slug="bg-041", bid="BG-041", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Competitive Landscape", "Engine Coverage", "Buyer Guide"],
    title="How Many AI Engines Does a GEO Tool Actually Need to Cover?",
    h1="How Many AI Engines Does a GEO Tool <em>Actually Need</em> to Cover?",
    h1_plain="How Many AI Engines Does a GEO Tool Actually Need to Cover?",
    subtitle="Rankscale names 17 or more. Evertune names 9. AthenaHQ includes 8 with no upsell. A bigger number on a pricing page is not automatically more useful once you check which of those engines are actually included at the tier you would buy.",
    meta_desc="Rankscale claims 17+ AI engines, Evertune names 9, AthenaHQ includes all 8 of its engines at every tier. A comparison of named engine coverage across GEO vendors, and why the count alone is a poor buying signal.",
    og_desc="A bigger engine count is not more useful if half of it sits behind an upsell tier. Rankscale's 17+, Evertune's 9, AthenaHQ's 8-with-no-paywall, and what actually decides which of them matters for your prompts.",
    ld_desc="A comparison of named AI-engine coverage across GEO monitoring vendors, arguing that engine count should be matched to a buyer's actual prompt mix rather than treated as a standalone quality signal.",
    keywords="how many AI engines to track, GEO tool engine coverage, which AI platforms to monitor, AthenaHQ vs Rankscale, GEO vendor engine comparison, AI visibility engine count",
    about=["Generative Engine Optimization", "AI Visibility Monitoring", "SaaS Buying Guide", "Competitive Analysis"],
    findings=[("17+", "the broadest named engine count in the category, claimed by Rankscale"),
              ("8", "engines AthenaHQ includes at every price tier with no paywalling, its central pricing argument"),
              ("55%", "of responses in which Claude cites a source at all, per Muck Rack's study, versus ChatGPT's 96%"),
              ("4", "core engines actually included in Otterly.AI's headline-priced Standard plan, with 3 more sold as add-ons")],
    faq=[("Does a GEO tool with more named engines give better coverage?",
          "Not automatically. Rankscale names 17 or more engines, the broadest count found in this research pass, but engine coverage only matters for the engines your actual buyers use. A tool naming fewer engines, all genuinely included at your price tier, can be more useful in practice than a tool naming many with half of them gated behind an upsell."),
         ("Which AI engines should a small business actually prioritize tracking?",
          "The ones your buyers actually ask questions in, which is a smaller list than any vendor's full named count. Start with the two or three engines that dominate your category's search behavior, then check whether the tool you are considering includes those specific engines at the tier you can afford, rather than counting the vendor's total."),
         ("Is Claude worth tracking in a GEO tool?",
          "It depends on your goals. Claude cites a source in only 55% of its responses, well below ChatGPT's 96%, per Muck Rack's citation study covered in full in BG-035. That does not mean Claude is worthless to track, it means the ceiling on how often you can even appear cited there is structurally lower, which should factor into how much weight you put on a Claude-specific gap."),
         ("What is the difference between AthenaHQ's approach and Rankscale's to engine coverage?",
          "AthenaHQ includes all 8 of its named engines at every price tier, including its entry tier, and leads with that as its core pitch. Rankscale names a much broader 17-plus but prices per engine on a credit system, so its effective coverage at any given budget depends on how the credits are spent, not on the headline number.")],
    related=[_R_035, _R_036, _R_040],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Every GEO vendor's homepage leads with a number: how many AI engines it tracks. Rankscale says 17 or more. Evertune names 9. AthenaHQ says 8. Peec AI says 6, at every tier. Otterly.AI says 4, with three more available separately. Treated as a single ranking criterion, that number is close to useless, because it tells you nothing about whether the engines that matter to your business are actually among them, or whether they are included in the plan you would actually buy.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Engine counts and tier structures are drawn from each vendor's own current pricing and feature pages. Where a vendor's named count is a marketing claim rather than an independently verifiable figure, such as Rankscale's "17+", that is noted as the vendor's own claim rather than confirmed here directly.</p>
  </div>

  <h2>The named-engine count, compared</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Vendor</th><th>Named engines</th><th>Gating at entry tier</th></tr></thead>
    <tbody>
      <tr><td>Rankscale</td><td>17+ claimed, the broadest in this pass</td><td>Credit-based, cost per engine varies (AI Mode checks run 0.25 credits each)</td></tr>
      <tr><td>Evertune</td><td>9 named: ChatGPT, AI Overview, AI Mode, Gemini, Claude, Perplexity, Meta, DeepSeek, Copilot</td><td>Prices by prompt volume rather than by engine, enterprise-only</td></tr>
      <tr><td>AthenaHQ</td><td>8, from day one</td><td>All 8 included at every tier, including the $95/month intro rate, no engine paywalling</td></tr>
      <tr><td>Scrunch AI</td><td>7: ChatGPT, Gemini, Perplexity, Claude, Meta AI, Google AI Mode, Google AI Overviews</td><td>Core tier at $250/month includes 4; full 7 requires a higher tier</td></tr>
      <tr><td>Waikay</td><td>6, across 47 languages</td><td>Included from its $19.95/month entry price</td></tr>
      <tr><td>Peec AI</td><td>6, at every tier per its own pricing page</td><td>All 6 listed at the $95/month Starter tier</td></tr>
      <tr><td>Otterly.AI</td><td>4 core engines included; Gemini, Google AI Mode and Claude are separate paid add-ons</td><td>Add-ons range $9 to $439/month depending on plan</td></tr>
    </tbody>
  </table>
  </div>

  <h2>A bigger number can be a smaller number wearing a bigger number's clothes</h2>

  <p>The clearest contrast in this table is AthenaHQ against Rankscale. AthenaHQ names fewer engines, 8 against Rankscale's 17-plus, but leads its entire pricing argument on the fact that all 8 are included at every tier with no paywalling, down to its $95 introductory rate. Rankscale's broader count is real on paper, but its credit-based pricing means the engines you can actually afford to check depends on how your credits are spent that month, not on the number printed on the homepage. Whether that trade favors you depends entirely on whether you would rather have narrower guaranteed coverage or broader theoretical coverage you have to budget carefully to use.</p>

  <p>Otterly.AI is the sharpest version of this pattern. Its headline plans include 4 core engines: ChatGPT, Google AI Overviews, Perplexity and Microsoft Copilot. Gemini, Google AI Mode and Claude, three engines most buyers assume are simply part of "AI visibility monitoring" in 2026, are each separate paid add-ons. <a href="/bg-036.html">Our full pricing breakdown</a> covers what that does to the real monthly cost. The relevant point here is narrower: the "4" in Otterly's own coverage table is the number that actually matters when you are deciding whether a tool covers your prompt mix, not whatever total gets implied by the category.</p>

  <h2>What each vendor's pitch reveals about its own bet</h2>

  <p>The way a vendor structures its gating is itself a signal worth reading. Scrunch AI's Core tier, at $250 a month, includes 4 of its 7 named engines; the remaining 3, including its full Claude tracking, sit behind a higher tier that also unlocks its Agent Experience Platform. That is a deliberate upsell ladder, not an oversight, and it means the marketing page's "7 engines" is really "4 engines, plus 3 more if you pay for a different product entirely." Evertune takes a different approach again: it prices by prompt volume, 100,000 prompts a month on its published Pro tier, rather than by engine count at all, so its 9 named engines are effectively "however many of the 9 your prompt budget touches" rather than a fixed included set.</p>

  <p>AthenaHQ's decision to include all 8 of its engines at every tier, with no separate unlock, is the outlier in this group precisely because it removes that ladder entirely. It is also the smallest of the venture-backed names by funding, which suggests the no-paywall structure is a deliberate positioning choice against the rest of the field's gating, not simply a smaller company doing less. Whether that trade makes sense for you depends on whether you would rather pay one flat price for guaranteed access to everything, or pay less up front and add engines only as you confirm you need them.</p>

  <h2>Match the count to your actual prompt mix, not the vendor's</h2>

  <p>The engines are not interchangeable once you are inside them, either. Claude cites a source in only 55% of its responses, against ChatGPT's 96% and Gemini's 82%, per Muck Rack's 25-million-link study covered in full in <a href="/bg-035.html">our map of disclosed AI citation research</a>. That is not a reason to skip tracking Claude. It is a reason to weight what you find there differently: a low Claude citation count for your brand may simply reflect that Claude rarely cites anyone, not that you have a specific visibility gap to fix. A tool that tracks Claude without telling you this context is handing you a number without the frame you need to read it.</p>

  <p>The practical version of this advice is unglamorous but does the actual work: before comparing vendors on their named engine count, write down which two or three engines your own buyers are most likely to be asking questions in, based on what you know about your customer base and industry. Check whether each candidate vendor includes those specific engines, at the specific tier you would pay for, before the total count enters the decision at all. A tool with 6 engines that includes the 3 that matter to you beats a tool with 17 where those 3 sit behind an upsell you have not budgeted for.</p>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p>Engine count is a headline, not a spec. Check three things before it: which specific engines are included at the tier you can afford, whether any of them are metered differently than the rest (Claude checks running up to 8 times the base credit rate on some platforms), and whether the engines your actual buyers use are among them at all. A smaller, fully included set beats a bigger, partially gated one almost every time.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-042
ARTICLES.append(dict(
    slug="bg-042", bid="BG-042", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Funding", "Competitive Landscape", "Market Analysis"],
    title="The GEO Funding Boom, Mapped: $300 Million and a Billion-Dollar Valuation in Two Years",
    h1="The GEO Funding Boom, Mapped. <em>$300 Million</em> and a Billion-Dollar Valuation in Two Years",
    h1_plain="The GEO Funding Boom, Mapped: $300 Million and a Billion-Dollar Valuation in Two Years",
    subtitle="Profound went from a $3.5 million seed to a $1 billion valuation in eighteen months. Five more GEO-native startups raised alongside it. None of it settles what the category is actually worth.",
    meta_desc="A timeline of GEO and AI-visibility startup funding: Profound's path to a $1 billion valuation, Peec AI, Scrunch AI, Bluefish AI and AthenaHQ's rounds, and what over $300 million in venture funding signals about the category.",
    og_desc="Profound: seed to unicorn in 18 months. Bluefish AI: $63 million, Fortune 500 only. AthenaHQ: $2.7 million and a no-paywall pitch. Mapped against three GEO market-size estimates that do not agree with each other.",
    ld_desc="A funding timeline for GEO-native AI-visibility startups, covering individual round sizes, dates and investors, set against disagreeing market-size estimates for the category.",
    keywords="GEO startup funding 2026, Profound Series C, AI visibility startup investment, generative engine optimization funding, Peec AI funding, Bluefish AI Series B",
    about=["Generative Engine Optimization", "Startup Funding", "Competitive Analysis", "Market Sizing"],
    findings=[("$1B", "Profound's valuation at its $96 million Series C, February 2026, the category's first reported unicorn"),
              ("$300M+", "disclosed venture funding across six GEO-native vendors in under two years"),
              ("$2.7M", "AthenaHQ's total funding, the smallest of the venture-backed names, still enough to launch with 8 engines and no paywall"),
              ("$189B", "the largest single month of global startup funding ever recorded, February 2026, though driven by OpenAI, Anthropic and Waymo, not GEO")],
    faq=[("How much venture funding has gone into GEO and AI-visibility startups?",
          "At least $300 million disclosed across six GEO-native vendors in under two years: Profound ($155M), Peec AI ($29.1M), Bluefish AI ($63M), Scrunch AI ($19M), Evertune ($20M) and AthenaHQ ($2.7M). None of these companies existed as GEO-focused businesses before 2023 or 2024."),
         ("Which GEO startup was the first to reach a $1 billion valuation?",
          "Profound, at its $96 million Series C in February 2026, led by Lightspeed with participation from Sequoia, Kleiner Perkins and South Park Commons. It reached that valuation about eighteen months after an August 2024 seed round of $3.5 million."),
         ("Is the GEO funding boom justified by the size of the market?",
          "That is genuinely unresolved. Published 2026 market-size estimates for the GEO category disagree with each other by up to 36% for the same year, ranging from roughly $848 million to $1.48 billion. Investors are placing large bets on a category whose own total addressable market has not been consistently sized yet."),
         ("Who is investing in GEO startups?",
          "A mix of the same growth-stage and early-stage funds active across AI generally: Lightspeed, Sequoia, Kleiner Perkins and South Park Commons in Profound; Singular, Antler and 20VC in Peec AI; Mayfield, Decibel and Homebrew in Scrunch AI, alongside angels including TJ Parker of PillPack and Clara Shih; Threshold Ventures and NEA in Bluefish AI; and Y Combinator in AthenaHQ.")],
    related=[_R_036, _R_040, _R_041],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>A category that did not exist as a funded business type before 2023 has, in the two years since, produced one unicorn, more than $300 million in disclosed venture funding across just six named companies, and a spread in outcomes wide enough that the smallest venture-backed name in the group raised less than two percent of what the largest one did. Here is the timeline, and what it does and does not tell you about the category's actual prospects.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Round sizes, dates and investor names are drawn from funding announcements, Crunchbase and Tracxn profiles, and direct company sources. Two figures in the underlying research carry a second-hand qualifier worth repeating here: Peec AI's reported target valuation on its next round comes from Sifted's "sources say" reporting, not a confirmed close, and the February 2026 record funding month is real but driven almost entirely by three companies outside this category.</p>
  </div>

  <h2>The timeline</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Company</th><th>Total raised</th><th>Latest / largest round</th><th>Lead investors</th></tr></thead>
    <tbody>
      <tr><td>Profound</td><td>$155M</td><td>$96M Series C, Feb 2026, $1B valuation</td><td>Lightspeed, with Sequoia, Kleiner Perkins, South Park Commons</td></tr>
      <tr><td>Peec AI</td><td>$29.1M</td><td>$21M Series A, July 2025</td><td>Singular, with Antler, Combination VC, identity.vc, S20</td></tr>
      <tr><td>Bluefish AI</td><td>$63M across two rounds</td><td>$43M Series B, around April 2026</td><td>Threshold Ventures and NEA, co-led, with American Express Ventures</td></tr>
      <tr><td>Scrunch AI</td><td>$19M across seed and Series A</td><td>$15M Series A, 2024</td><td>Decibel, with Mayfield and Homebrew</td></tr>
      <tr><td>Evertune</td><td>$20M</td><td>Series A</td><td>Felicis Ventures and Eniac Ventures, with angels from OpenAI, Meta and Uber</td></tr>
      <tr><td>AthenaHQ</td><td>$2.7M across two seed rounds</td><td>$2.2M, June 2025</td><td>Y Combinator, FCVC, Red Bike Capital</td></tr>
    </tbody>
  </table>
  </div>

  <h2>Profound: seed to unicorn in eighteen months</h2>

  <p>Profound's path is the clearest single data point in the category. It raised a $3.5 million seed in August 2024, and by February 2026 had closed a $96 million Series C led by Lightspeed, with Sequoia, Kleiner Perkins and South Park Commons participating, at a $1 billion valuation. That makes it the first, and as of this research pass the only, reported unicorn built specifically around GEO. The round also lines up with a striking piece of context: February 2026 was independently reported as the largest single month of global startup funding ever recorded, at $189 billion, though that figure was driven overwhelmingly by OpenAI ($110B), Anthropic ($30B) and Waymo ($16B), not by the GEO category. Profound's raise happened inside an unusually favorable funding month for AI broadly, which is worth naming rather than treating the timing as purely a verdict on Profound itself.</p>

  <h2>The rest of the field: real money, uneven scale</h2>

  <p>Peec AI, a Berlin company founded in 2025 by three people who met in Antler's Winter 2024 cohort, closed a $21 million Series A in July 2025 led by Singular, bringing its disclosed total to $29.1 million. Sifted has reported, citing unnamed sources, that a further fundraise is in progress targeting a $200 million valuation on roughly $10 million in ARR, a figure this research pass could not independently confirm and is presenting exactly as reported rather than as a closed fact.</p>

  <p>Scrunch AI raised a $4 million seed from Mayfield followed by a $15 million Series A led by Decibel, with Mayfield and Homebrew participating, summing to $19 million across its two disclosed rounds. Its angel roster is notable on its own: TJ Parker, a co-founder of PillPack, Bryant Chou, a co-founder of Webflow, and Clara Shih, formerly of Salesforce and Meta AI, are all named investors.</p>

  <p>Bluefish AI raised $63 million across two rounds, a $20 million Series A followed by a roughly $43 million Series B around April 2026 co-led by Threshold Ventures and NEA, with American Express Ventures also participating. It is explicitly Fortune 500 only, with confirmed customers including Adidas and Tishman Speyer and no self-serve pricing page at all, which is a meaningfully different bet than the rest of this list: less capital-efficient customer acquisition per logo, offset by contract sizes independent estimates put at $100,000 to $500,000 a year.</p>

  <p>At the other end sits AthenaHQ, which raised just $2.7 million across two seed rounds, $500,000 in February 2025 and $2.2 million in June 2025, backed by Y Combinator, FCVC and Red Bike Capital. It is the smallest venture-backed name in this list by a wide margin, and it has used that capital to launch with all 8 of its named engines included at every tier rather than raising to fund a broader engine count later.</p>

  <h2>What the money says, and what it does not</h2>

  <p>Six GEO-native companies raising over $300 million combined, one of them to a $1 billion valuation, inside roughly two years is a real signal of investor conviction in the category's direction. It is not a signal that anyone has agreed on how big the category actually is. Published 2026 market-size estimates for GEO disagree with each other by up to 36% for the same year, ranging from roughly $848 million to $1.48 billion depending on which research firm's report you read, and none of the underlying methodology behind those estimates is independently verifiable from the outside. The funding is real. The market it is funding remains, by the industry's own published numbers, unsized.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Follow the money and you learn that sophisticated investors are confident enough in AI-visibility monitoring as a category to fund six separate bets on it, one all the way to a $1 billion valuation, inside two years. Follow the market-size research and you learn nobody has agreed on how large the prize actually is. Both things are true at once, and a buyer evaluating any of these vendors should weigh the first without assuming it resolves the second.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-043
ARTICLES.append(dict(
    slug="bg-043", bid="BG-043", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Google AI Overviews", "Platform Changes", "AI Search Trends"],
    title="What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
    h1="What Google's May 2026 AI Overviews Overhaul <em>Actually Changed</em> for Brands",
    h1_plain="What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
    subtitle="Five structural changes landed on May 6 and 7, 2026, then Google I/O added four more announcements two weeks later. Here is what each one means for where a brand should be investing attention, not just what it means for the user reading the answer.",
    meta_desc="Google's May 6-7, 2026 AI Overviews update moved inline citations, added an Expert Advice block and a curated links section. Plus the Google I/O follow-on and the measured CTR impact, explained for what it means for brands.",
    og_desc="Inline citations now sit next to the sentence they support, not bundled at the end. A new Expert Advice block pulls from forums and reviews. Click-through on the number one result is down 58% on AI-Overview queries. Here is what changed.",
    ld_desc="A breakdown of Google's May 2026 AI Overviews and AI Mode structural update and the subsequent Google I/O announcements, with the measured click-through impact and practical implications for brand content strategy.",
    keywords="Google AI Overviews update 2026, AI Overviews Expert Advice block, Google AI Mode changes, AI Overviews CTR impact, Google I/O 2026 search announcements, inline citations AI Overviews",
    about=["Google AI Overviews", "Google AI Mode", "AI Search Trends", "Content Strategy"],
    findings=[("5", "structural changes Google made to AI Overviews and AI Mode on May 6 to 7, 2026, one of its biggest updates since launch"),
              ("58%", "click-through drop on the #1 organic position for AI-Overview-triggering queries, up from 34.5% in April 2025"),
              ("1B", "AI Mode's monthly users as of Google I/O, May 19, 2026, about a year after its US debut"),
              ("US English", "the rollout sequencing for the May 6-7 update, with other markets following afterward")],
    faq=[("What changed in Google AI Overviews in May 2026?",
          "Five structural changes landed on May 6 and 7, 2026: inline citations now sit next to the specific sentence they support instead of being bundled at the end, hover previews show the site name on desktop, a new Expert Advice block pulls first-hand perspectives from forums, social media and review sites, and a new end-of-answer section surfaces curated links to articles and case studies. It rolled out to English-language US searches first."),
         ("What is Google's Expert Advice block and where does it pull from?",
          "It is a new section inside AI Overviews and AI Mode answers that pulls first-hand perspectives specifically from forums, social media and review sites, rather than from conventional articles or brand pages. It treats lived, first-person accounts as a distinct source type worth surfacing on its own."),
         ("How much did AI Overviews reduce organic click-through in 2026?",
          "Click-through on the number one organic position dropped 58% on queries that trigger an AI Overview, according to Similarweb-based tracking, up from a measured 34.5% drop in April 2025. The effect is growing as the feature matures rather than leveling off."),
         ("What is Google's Intelligent Search Box?",
          "A multimodal input box announced at Google I/O on May 19, 2026, accepting text, images, files, video and Chrome tabs as search input. It shipped alongside Search Agents that monitor the web and news around the clock for Google AI Pro and Ultra subscribers, and Gemini 3.5 Flash becoming the default model powering AI Mode globally.")],
    related=[_R_039, _R_044, _R_038],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Google shipped what it has described as one of its biggest updates to AI Overviews and AI Mode since either launched, across a single 48-hour window in May 2026, then followed it two weeks later with a set of I/O announcements pointing at where the product is headed next. Most of the coverage since has focused on what changed for the person reading the answer. This piece focuses on what each change means for the brand hoping to be part of it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. The May 6-7 structural changes and the May 19 Google I/O announcements are drawn directly from Google's own product coverage and independent reporting at the time. The click-through figures come from Similarweb-based third-party tracking rather than a Google-published number, which is stated here rather than presented as Google's own disclosure.</p>
  </div>

  <h2>Five changes, one 48-hour window</h2>

  <p>On <strong>May 6 and 7, 2026</strong>, Google made five structural changes to AI Overviews and AI Mode at once. Inline citations now sit next to the specific sentence they support, rather than being bundled together at the end of the answer the way they previously were. Hover previews on desktop now show the site name behind a citation before a reader clicks through. A new <strong>Expert Advice</strong> block pulls first-hand perspectives specifically from forums, social media and review sites, treating lived, first-person accounts as a distinct source type rather than folding them into general web results. A new section at the end of the answer surfaces curated links to articles and case studies. The rollout sequencing itself is a signal worth noting: it went to English-language US searches first, with other markets following afterward, so the practical effect of this update reaches different markets on different timelines.</p>

  <h2>Two weeks later, Google said where this is going</h2>

  <p>At <strong>Google I/O on May 19, 2026</strong>, four more pieces landed. Gemini 3.5 Flash became the default model powering AI Mode globally. An "Intelligent Search Box" now accepts multimodal input, text, images, files, video and Chrome tabs, as a single query. New "Search Agents" monitor the web and news around the clock and push synthesized updates to Google AI Pro and Ultra subscribers, rolling out over summer 2026. And agentic booking with direct-calling capability is coming to categories like home repair and beauty, also targeted for a summer 2026 US rollout. Google also disclosed that <a href="/bg-039.html">AI Mode passed 1 billion monthly users</a> around this same milestone, roughly a year after its US debut, with query volume more than doubling every quarter.</p>

  <h2>The rollout is not simultaneous everywhere</h2>

  <p>It is worth taking the sequencing seriously rather than treating the May 6-7 update as something that landed everywhere at once. Google shipped it to English-language US searches first, with other markets following on their own schedule afterward. A brand outside the US, or one operating primarily in a language other than English, should not assume its own AI Overviews results already reflect the new citation placement, the Expert Advice block, or the end-of-answer links section on the same timeline US brands are seeing. Checking your own market's current AI Overviews behavior directly, rather than assuming the global rollout is finished, is the only way to know which version of the product your customers are actually looking at right now.</p>

  <h2>The click is worth less than it was a year ago</h2>

  <p>Set against these product changes is a measurable cost. Click-through on the number one organic position now drops <strong>58%</strong> on queries that trigger an AI Overview, according to Similarweb-based tracking, up from a measured 34.5% drop in April 2025. That trajectory matters as much as the current number: the effect is getting stronger as the feature matures and expands, not stabilizing at some plateau. A brand ranking first organically for a query that now triggers an AI Overview is, on this data, losing well over half the clicks that position used to generate a year earlier.</p>

  <h2>What this means for where you invest attention</h2>

  <p>Two of the five May changes have a direct, practical read for content strategy, and neither is subtle. The <strong>Expert Advice block</strong> pulling specifically from forums, social platforms and review sites is Google formally treating first-hand community content as a distinct, valuable source category, separate from a brand's own published pages. If your brand has no meaningful presence in the forums and review platforms where your category gets discussed, that block is a surface you are structurally absent from no matter how good your own website is.</p>

  <p>Inline citations moving to sit next to the specific sentence they support, rather than being bundled at the end, changes what "citable content" looks like at the page level. A page whose strongest claims are scattered across dense paragraphs, with sourcing buried in a general references section, is harder for this retrieval pattern to attribute cleanly to a specific sentence than a page whose individual claims are stated plainly, each one close to whatever supports it. The practical implication is structural, not stylistic: write the specific, checkable claim and its support close together, rather than making the case broadly and footnoting it once at the end.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Every piece of this update points the same direction: Google is getting more precise about where an answer's claims come from, and more willing to pull from community and first-hand sources instead of only brand-published content. A brand that has never checked whether it appears inside an AI Overview, an Expert Advice block, or the new end-of-answer links section is not measuring a fringe feature. It is measuring the surface that already costs the top organic result more than half its clicks, and is still growing.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-044
ARTICLES.append(dict(
    slug="bg-044", bid="BG-044", date="2026-08-13", date_label="August 13, 2026", read=7,
    tags=["AI Search Mechanics", "Platform Comparison", "AI Search Trends"],
    title="How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
    h1="How ChatGPT, Gemini, Perplexity and Claude <em>Actually Pick</em> Their Sources",
    h1_plain="How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
    subtitle="Four AI engines, four genuinely different retrieval architectures underneath. One prices search by the query, one filters results with code before they ever reach the model, and one has never disclosed how often it even bothers to look.",
    meta_desc="How ChatGPT, Gemini, Perplexity and Claude actually retrieve and cite web sources: binary citation, Grounding with Google Search pricing, a 200-billion-URL claimed index, and Claude's Brave-Search-backed Server Tool, explained.",
    og_desc="Gemini bills grounding at $14 per 1,000 search queries now, and one prompt can trigger several. Claude searches through Brave, not Google. Perplexity claims a 200-billion-URL index. Four architectures, no shared playbook.",
    ld_desc="A comparison of the retrieval and source-selection mechanics behind ChatGPT, Gemini, Perplexity and Claude web search, covering architecture, pricing and disclosed limitations for each engine.",
    keywords="how does ChatGPT choose sources, Gemini grounding pricing, Perplexity retrieval architecture, Claude web search Brave, AI search engine mechanics comparison, GEO engine-specific optimization",
    about=["AI Search Trends", "Generative Engine Optimization", "Platform Mechanics", "Content Strategy"],
    findings=[("Binary", "ChatGPT's citation model: a brand is either cited in a given response or it isn't, with no numbered position"),
              ("$14", "per 1,000 search queries under Gemini's usage-based grounding billing since January 2026, replacing a flat $35 per 1,000 prompts"),
              ("200B+", "URLs in Perplexity's claimed index, per its own description of its retrieval pipeline"),
              ("Brave Search", "the search backend behind Claude's web search tool, run by Anthropic rather than a direct Google or Bing connection")],
    faq=[("Do ChatGPT, Gemini, Perplexity and Claude all retrieve web sources the same way?",
          "No. Each uses a genuinely different architecture: ChatGPT's citation model is binary with no ranked position, Gemini grounds through Google Search under a usage-based pricing model, Perplexity runs its own multi-API retrieval and three-layer reranking pipeline against a large claimed index, and Claude runs web search as a cloud-side Server Tool backed by Brave Search rather than a direct Google or Bing connection."),
         ("How does Gemini's web search grounding get billed, and why does that matter?",
          "Since January 5, 2026, Google bills Grounding with Google Search on a usage basis, $14 per 1,000 search queries, replacing a flat $35 per 1,000 prompts. The distinction matters because a single prompt can trigger more than one billable search if the model decides to issue several, so prompt volume and search volume are no longer the same number."),
         ("Does Claude search the web directly through Google?",
          "No. Claude's web search runs as a Server Tool that Anthropic operates in the cloud, and results are reported to come from Brave Search rather than a direct connection to Google or Bing. The newer web_search_20260209 tool version, available on Claude 4.6 and later, adds dynamic filtering, letting Claude write code to filter search results before they enter its context rather than reading everything retrieved."),
         ("Can I use the same GEO strategy for every AI engine?",
          "Not without adjustment. Four genuinely different retrieval architectures mean content structured for one engine's mechanics does not automatically transfer to another's. What makes a page easy for Perplexity's reranking pipeline to surface is not necessarily what makes it easy for Gemini's grounding call to retrieve, or for Claude's dynamic filtering to keep in context.")],
    related=[_R_038, _R_035, _R_043],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>"Optimize for AI search" gets used as if it described one target. It does not. The four engines a GEO tool typically tracks retrieve and select sources through four different mechanisms, built by four companies that made different architectural bets about where a search happens, who pays for it, and how much of the raw result an AI model actually gets to see. Here is what each one is actually doing underneath the answer.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. ChatGPT's citation model and Gemini's grounding pricing are drawn from OpenAI and Google's own published behavior and changelogs. Claude's architecture is drawn from Anthropic's own platform documentation. Perplexity's specific figures, its claimed index size and reranking description, trace to a GEO-vendor blog post with no stated sample or independent audit behind them, and are presented here as exactly that, a vendor's own description of its retrieval pipeline, not an independently verified fact.</p>
  </div>

  <h2>ChatGPT: citation without a position</h2>

  <p>The first thing to understand about ChatGPT's source selection is what it is not: there is no equivalent of a numbered SERP position. Unlike ten blue links, citation inside a ChatGPT answer is binary, a brand is either named and sourced in a given response or it is not, with nothing resembling "ranked third." That framing recurs consistently across independent GEO-vendor analysis and matches how the product visibly behaves.</p>

  <p>What OpenAI has never disclosed is how often ChatGPT bothers to trigger a live web search at all before answering. Every specific percentage in circulation, whether cited as 20%, 31% or 34.5%, is a third-party estimate built on assumptions about total daily prompt volume, not a number OpenAI has published. <a href="/bg-038.html">BG-038 covers this specific claim in full</a>, including the adjacent, similarly unverified figures repeated alongside it. The short version worth carrying here: nobody outside OpenAI actually has this number, and any GEO strategy that assumes a specific search-trigger rate is building on an estimate dressed up as a fact.</p>

  <h2>Gemini: grounding has a price tag now</h2>

  <p>Gemini's web retrieval runs through what Google calls Grounding with Google Search, and as of <strong>January 5, 2026</strong>, that grounding is billed differently than it used to be. Google moved from a flat $35 per 1,000 prompts to usage-based pricing at <strong>$14 per 1,000 search queries</strong>, and the distinction is not cosmetic: a single prompt can trigger more than one billable search if the model decides it needs to issue several, so a prompt count and a search count are no longer the same number the way the old flat pricing implicitly treated them.</p>

  <p>Grounding with Google Search can now also be combined with Structured Outputs, for JSON-precise extraction straight from live web results, and with Grounding with Google Maps, for the Gemini 3 model family. A new Grounding with Google Image Search mode is in preview for Gemini 3.1 Flash Image. The pattern across all of these is Google building grounding as a modular, combinable retrieval layer rather than a single fixed search step, which is a structurally different design from a model that either searches or does not.</p>

  <h2>Perplexity: breadth over almost everything else</h2>

  <p>Perplexity's own description of its retrieval pipeline claims an index of <strong>over 200 billion URLs</strong> per query, run through a three-layer reranking pipeline before inline citations are embedded tying each claim back to its source. It draws from multiple search APIs, reportedly including Google and Bing, and retrieves and reads candidate pages directly rather than relying purely on a snippet, with new content reportedly citable within hours of being indexed. None of these specific figures come with a disclosed sample or an independent audit; they are Perplexity's own account of its architecture, worth taking as a directional description of the design rather than a verified benchmark.</p>

  <p>What is worth carrying forward regardless of the exact index size is the shape of the bet: Perplexity is architected around breadth and freshness of retrieval as its primary differentiator, reading more of the live web more directly than an engine that leans on a single search partner's index.</p>

  <h2>Claude: a tool Anthropic runs for you, not with you</h2>

  <p>Claude's web search is a <strong>Server Tool that Anthropic operates in the cloud</strong>, not a direct connection Claude makes to Google or Bing's own APIs the way some competitors do. Results are reported to come from <strong>Brave Search</strong> instead. Every response that uses the tool includes citations by default. The newer <code>web_search_20260209</code> tool version, available on Claude 4.6 and later, adds what Anthropic calls dynamic filtering: Claude can write code to filter search results before they ever enter its context window, rather than the raw retrieved results being dumped in wholesale for the model to sort through on its own.</p>

  <p>That filtering step is the architectural detail worth sitting with. It means the page that gets read is not necessarily the page that gets acted on, Claude can programmatically discard results before they are considered at all, based on criteria the model itself sets at run time rather than a fixed relevance score computed once upstream.</p>

  <h2>Four architectures, no universal playbook</h2>

  <p>Lay these four side by side and the takeaway is not that one architecture is better than the others. It is that "optimize for AI search" as a single undifferentiated strategy does not hold up against how differently these systems actually work. A page structured to be easy for Perplexity's reranking pipeline to surface is not automatically well positioned for Gemini's per-query grounding call, or safe from being discarded by Claude's dynamic filtering before it is ever considered, or relevant to whatever triggers ChatGPT's undisclosed decision to search at all. What earns citability in one engine's architecture is a claim about that engine, not a claim about AI search in general.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Four engines, four retrieval mechanisms, no shared underlying playbook. A GEO strategy built entirely around one engine's mechanics, whatever engine that happens to be, will underperform on the other three for reasons specific to how each one actually works, not because the content itself is weak. Track engines separately, and read a gap on one of them as a fact about that engine's architecture before assuming it is a fact about your content.</p>
  </div>""",
))


# ============================================================
# Batch appended 2026-08-13 (third pass): BG-045 to BG-049
# (5 shorter blog posts from scripts/articles_content_batch3.py,
# merged in after review)
# ============================================================

CTA_H_DEFAULT = "See your own number, not someone else's case study"
CTA_P_DEFAULT = "Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card."

# ---------------------------------------------------------------------------
# Cross-references into earlier batches, copied verbatim so this file has no
# import dependency on articles_content.py or articles_content_batch2.py.
# ---------------------------------------------------------------------------
_R_035 = ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
          "Five disclosed studies, side by side, and the one myth-bust clean enough to build a rule around.")
_R_036 = ("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
          "The full vendor-by-vendor pricing table this piece draws its own vendor names from.")
_R_038 = ("/bg-038.html", "BG-038", "Six AI Citation Claims the Industry Keeps Repeating",
          "A claim-by-claim scorecard for exactly the kind of unverified number this piece is careful not to repeat.")
_R_039 = ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
          "The traffic numbers behind why any of this measurement work, chat or shopping, is worth doing at all.")
_R_040 = ("/bg-040.html", "BG-040", "Is GEO Just SEO With a New Name?",
          "What nine legacy SEO platforms actually built on top of the keyword and rank-tracking infrastructure they already had.")
_R_041 = ("/bg-041.html", "BG-041", "How Many AI Engines Does a GEO Tool Actually Need to Cover?",
          "Why a bigger named engine count is not automatically more useful once you check which engines are actually gated.")
_R_043 = ("/bg-043.html", "BG-043", "What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
          "The five structural changes, and the agentic-commerce context this piece on Daydream builds on.")

# Cross-references within this batch.
_R_045 = ("/bg-045.html", "BG-045", "What the People Who Actually Study This Think Is Coming Next",
          "Lily Ray, Glenn Gabe, Mike King, and the survey behind why 94% of marketing leaders say they're increasing GEO spend anyway.")
_R_046 = ("/bg-046.html", "BG-046", "The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing Three Times Out of Ten",
          "Being cited by an AI engine and being cited correctly are two different claims, measured twice on the same newsroom's own content.")
_R_047 = ("/bg-047.html", "BG-047", "What Happens When an AI Overview Accuses Your Company of Something It Never Did",
          "Two live lawsuits, on two continents, over exactly the failure mode BG-046 measured at scale.")
_R_048 = ("/bg-048.html", "BG-048", "Inside the GEO Tool Review-Site Economy",
          "How to tell an independent GEO tool review from an affiliate funnel, and why this site had to lean on the same secondary sources it's warning you about.")
_R_049 = ("/bg-049.html", "BG-049", "AI Shopping Agents Are a Different Visibility Problem Than Chat Answers",
          "Daydream, and why being cited well in ChatGPT gets a brand nothing inside an AI shopping agent.")

# ---------------------------------------------------------------- BG-045
ARTICLES.append(dict(
    slug="bg-045", bid="BG-045", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Expert Commentary", "AI Search Trends", "Industry Analysis"],
    title="What the People Who Actually Study This Think Is Coming Next",
    h1="What the People Who <em>Actually Study This</em> Think Is Coming Next",
    h1_plain="What the People Who Actually Study This Think Is Coming Next",
    subtitle="Lily Ray showed four AI engines absorb a fabricated claim within a day. Glenn Gabe refuses to predict anything he hasn't measured. Mike King says the category is bigger than copy edits. And 94% of marketing leaders say they're increasing GEO spend regardless.",
    meta_desc="What Lily Ray's gullibility experiment, Glenn Gabe's forensic method, Mike King's Relevance Engineering framework, and the Conductor/SEJ 2026 AEO survey actually say, read together rather than quoted in isolation.",
    og_desc="One AI engine absorbing a fabricated claim is a headline. Four engines absorbing the same claim within 24 hours, reported by one practitioner as one demonstration, is the finding worth reading carefully rather than inflating.",
    ld_desc="A survey of named-expert commentary and one industry-wide survey on where AEO and GEO are headed in 2026, covering Lily Ray, Glenn Gabe, Mike King, and the Conductor/Search Engine Journal State of AEO and GEO report.",
    keywords="GEO experts 2026, Lily Ray AI search, Mike King Relevance Engineering, AEO GEO predictions, GEO investment survey 2026, state of AEO GEO report",
    about=["Generative Engine Optimization", "AI Search Trends", "Industry Analysis", "Expert Commentary"],
    findings=[("24 hours", "the time it took Google AI Overviews, AI Mode, Gemini and ChatGPT to all absorb a fabricated claim, in Lily Ray's own reported demonstration"),
              ("97%", "of marketing leaders who reported a positive impact from AEO investment in 2025, per the Conductor/Search Engine Journal survey"),
              ("94%", "of marketing leaders planning to increase AEO or GEO investment in 2026"),
              ("56%", "who already described their 2025 GEO investment as high or significant")],
    faq=[("What was Lily Ray's 'gullibility experiment'?",
          "Lily Ray, VP of SEO Strategy and Research at Amsive, published a fabricated ranking claim on the open web and checked whether AI engines picked it up. By her own account, Google AI Overviews, AI Mode, Gemini and ChatGPT had all incorporated the claim into their answers within 24 hours. It is one reported demonstration by one practitioner, not a large-scale study with a disclosed sample, and should be read at that scale of confidence."),
         ("Can a GEO-first strategy actually hurt a brand's SEO?",
          "According to Lily Ray, yes, if pursued carelessly. She has written that an aggressive GEO-first approach 'might be destroying your SEO,' arguing the two disciplines are not automatically additive: optimizing content for how an AI engine parses and cites it can work against how a traditional search engine ranks the same page."),
         ("What is Mike King's 'Relevance Engineering' framework?",
          "A framework treating AEO and GEO as the intersection of information retrieval, content strategy, UX, embeddings, digital PR, and measurement, explicitly pushing back on the idea that this category reduces to a set of copy edits."),
         ("What does the Conductor/Search Engine Journal survey say about AEO investment in 2026?",
          "97% of marketing leaders reported a positive impact from AEO investment in 2025, 94% plan to increase AEO or GEO investment in 2026, and 56% already described their 2025 investment as high or significant. These are self-reported figures from marketing leaders about their own programs, not an independent audit of results.")],
    related=[_R_046, _R_038, _R_035],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Most GEO content quotes a vendor blog citing another vendor blog. The four names below are different: they are individuals with a track record of being checkable in public, not marketing copy with a byline attached to it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Sourced from the named individuals' own published work and commentary, plus one named industry survey (Conductor and Search Engine Journal's "State of AEO & GEO in 2026"), rather than from GEO-vendor blog posts repeating each other. Where a claim rests on a single reported demonstration instead of a study with a stated sample, that distinction is kept, not smoothed over.</p>
  </div>

  <h2>Lily Ray: a live demonstration of how fast a lie travels, and a warning about the strategy itself</h2>

  <p>Lily Ray, VP of SEO Strategy and Research at Amsive, who launched her own AI-search consultancy, Algorythmic, in 2026, ran what she has called a "gullibility experiment." She published a fabricated ranking claim on the open web and then checked whether AI engines picked it up. By her own account, Google AI Overviews, AI Mode, Gemini and ChatGPT had all incorporated the fabricated claim into their answers within 24 hours.</p>

  <p>Worth being precise about what this is and isn't. It is one reported demonstration by one practitioner, not a large-scale study with a disclosed sample size the way the Ahrefs correlation research or Muck Rack's citation study are. Treat it as evidence that the failure mode is real and fast, not as a statistic about how often it happens across the open web generally. It cuts both ways, too: if a fabricated claim can be absorbed by four major engines within a day, so can an accurate one that helps a brand, provided it is published somewhere those engines are already reading. That is exactly why knowing what these engines currently say about a brand matters more than assuming the record will simply reflect reality on its own.</p>

  <p>Ray has made a separate, sharper point worth carrying alongside the demonstration itself: a GEO-first strategy pursued carelessly, in her own words, "might be destroying your SEO." Her argument is that the two disciplines are not automatically additive. Optimizing content aggressively for how an AI engine parses and cites it can work against how a traditional search engine ranks and rewards the same page, and a team chasing one metric without checking the other can lose ground it never noticed it was giving up.</p>

  <h2>Glenn Gabe and Mike King: two different definitions of doing the work</h2>

  <p>Glenn Gabe has built his reputation on a narrower, harder-to-fake skill: documenting, with actual Search Console data, exactly what a new Google AI feature does to a real site's traffic after it ships. That positions him as the field's forensic record-keeper rather than its forecaster. Predictions about the next platform shift are cheap. A Search-Console-backed account of what a specific update actually did to real sites is not, and it tends to survive contact with reality better than a forward-looking hot take does.</p>

  <p>Mike King takes the opposite angle and pushes back on a common shorthand for this whole category. His framework, which he calls "Relevance Engineering," treats AEO and GEO as the intersection of several genuinely different disciplines at once: information retrieval, content strategy, UX, embeddings, digital PR, and measurement. The explicit target of that framing is the idea that GEO reduces to "a set of copy edits." If King is right, a brand treating this as a content-tweaking exercise is solving a much smaller problem than the one actually sitting in front of it.</p>

  <h2>The survey behind the optimism: 97%, 94%, 56%</h2>

  <p>Set against the individual voices above, Conductor and Search Engine Journal's "State of AEO & GEO in 2026" survey of marketing leaders found broad, self-reported enthusiasm for the category. 97% of marketing leaders reported a positive impact from AEO investment in 2025. 94% said they plan to increase AEO or GEO investment in 2026, and 56% already described their 2025 investment as "high or significant." Contributors named in the report include Aleyda Solís of Orainti and Eli Schwartz, author of Product-Led SEO.</p>

  <p>These are self-reported figures from marketing leaders about their own programs, worth naming honestly rather than presenting as an independent audit of results. What they establish reliably is intent and sentiment at scale: a large majority of the people setting budgets in this space say they got something out of it in 2025 and are betting on more of it in 2026, which is a different, weaker claim than "AEO measurably worked," but a real one on its own terms.</p>

  <h2>The recurring theme: SEO splitting in two</h2>

  <p>Across the four sources above, one framing keeps surfacing in slightly different words: SEO is splitting into two separate tracks. One track optimizes for AI-mediated answers, where being an entity an engine recognizes and can quote cleanly matters more than a keyword match. The other keeps optimizing for the shrinking pool of traditional blue-link clicks, where the older playbook still mostly applies. This is a widely repeated framing across practitioners rather than a single citable statistic, and it should be read that way: a consensus read on where the ground is moving, not a number anyone actually measured.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>The people who study this most carefully are not converging on one tidy verdict. Ray shows the risk moves fast and the two disciplines can work against each other. Gabe insists on evidence over prediction. King argues the scope is bigger than most teams treat it as. The survey says budget owners are optimistic regardless of any of that. All four readings are useful, and none of them substitute for checking what these engines say about your own brand yourself.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-046
ARTICLES.append(dict(
    slug="bg-046", bid="BG-046", date="2026-08-13", date_label="August 13, 2026", read=5,
    tags=["AI Accuracy", "News & Media", "AI Search Trends"],
    title="The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing Three Times Out of Ten",
    h1="The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing <em>Three Times Out of Ten</em>",
    h1_plain="The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing Three Times Out of Ten",
    subtitle="February 2025: 51% of AI answers to news questions had significant issues. October 2025, a bigger BBC and EBU follow-up: the rate improved to 45%, but 31% still showed sourcing deficiencies and 20% major accuracy issues. Being cited is not the same as being cited correctly.",
    meta_desc="The BBC's own AI news-accuracy studies, run twice: 51% of AI answers had significant issues in February 2025, improving to 45% in an October 2025 BBC and EBU follow-up, with 31% still showing sourcing deficiencies.",
    og_desc="19% of AI answers citing BBC content introduced factual errors. 13% of quotes attributed to BBC articles were altered or fabricated. A year later, across more languages and more outlets, the rate barely moved.",
    ld_desc="A summary of the BBC's February 2025 AI news-accuracy study and the larger October 2025 BBC and European Broadcasting Union follow-up, and what the measured error rates mean for brands relying on AI engines to represent them correctly.",
    keywords="AI news accuracy study, BBC AI assistants study, can you trust AI search answers, AI hallucination news, EBU AI accuracy report, AI citation errors",
    about=["AI Accuracy", "News and Media", "AI Search Trends", "Brand Risk"],
    findings=[("51%", "of AI answers to news questions found to have significant issues, per the BBC's February 2025 study"),
              ("19%", "of answers citing BBC content that introduced factual errors not present in the original reporting"),
              ("13%", "of quotes attributed to BBC articles that were altered or fabricated outright"),
              ("31%", "of responses in the October 2025 BBC and EBU follow-up still showing sourcing deficiencies, despite the overall issue rate improving to 45%")],
    faq=[("What did the BBC's original 2025 study find about AI news accuracy?",
          "The BBC's own February 2025 study found that 51% of AI answers to news questions had significant issues. Of the answers that specifically cited BBC content, 19% introduced factual errors not present in the original reporting, and 13% of quotes attributed to BBC articles were altered or fabricated rather than paraphrased."),
         ("Did AI news accuracy improve in the follow-up study?",
          "Somewhat. A larger October 2025 study run jointly by the BBC and the European Broadcasting Union, covering more languages and more outlets, found the 'significant issues' rate had improved to 45%, an eight-point drop. It also broke the failure down further: 31% of responses showed sourcing deficiencies (missing or incorrect attribution) and 20% showed major accuracy issues (outdated information or hallucination)."),
         ("What is the difference between a 'sourcing deficiency' and a 'major accuracy issue' in this research?",
          "A sourcing deficiency, per the BBC and EBU's own categorization, means the answer failed to accurately say where its information came from, missing or incorrect attribution. A major accuracy issue means the content itself was wrong: outdated information or outright hallucination, independent of whether the sourcing was labeled correctly."),
         ("Should a brand assume it's safe just because an AI engine mentions it?",
          "No. These two studies measured how AI engines handle well-documented, professionally reported news content from one of the most heavily resourced newsrooms in the world, and still got sourcing or facts wrong on roughly a third to half of tested answers. Being mentioned and being represented accurately are two different claims, and only one of them is measured by simply checking whether a mention exists at all.")],
    related=[_R_047, _R_045, _R_035],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>A brand doesn't need an AI engine to invent something bad about it. It only needs the engine to summarize a real story about it inaccurately. The BBC has now measured that failure mode twice, on its own content, checking the answers by hand against its own reporting, and it is still happening on close to a third of tested responses.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Both figures below trace to the BBC's own published research and the joint BBC and European Broadcasting Union follow-up, not to a third-party summary or a GEO-vendor blog restating the numbers secondhand.</p>
  </div>

  <h2>February 2025: the first measurement, and it was blunt</h2>

  <p>The BBC's own study tested AI assistants against questions about news, checking the answers against what the BBC's actual reporting said. The results were direct: 51% of AI answers to news questions had significant issues of some kind. Of the answers that specifically cited BBC content, 19% introduced factual errors that were not in the original reporting. And 13% of quotes attributed to BBC articles were altered or fabricated outright, not paraphrased loosely but changed from what the BBC actually published.</p>

  <p>Being quoted with a fabricated quote is a materially different problem from simply being ignored. A brand or publisher that never gets mentioned by an AI engine is invisible, which is its own problem, but at least a known one. A brand that gets mentioned with a quote it never said, attributed with the same flat confidence as an accurate one and with no visible hedge, is misrepresented in a way an ordinary reader has no easy way to catch. And the "51% significant issues" figure is broader than dramatic fabrication alone: it covers answers that omitted essential context, blurred the line between a source's actual reporting and the AI's own summarization of it, or otherwise distorted the story without inventing anything outright. That breadth matters, because it means the failure mode is not limited to the rare, obvious hallucination. Most of it is the quieter kind of imprecision that is easy to miss on a first read and easy to repeat without noticing.</p>

  <h2>October 2025: broader scope, and the number moved, but not by much</h2>

  <p>A larger follow-up, described by the BBC as the largest study of its kind, was run jointly with the European Broadcasting Union across more languages and more outlets, specifically to check whether the original result was an artifact of English-language content and a single newsroom's reporting style, or a general property of how these systems handle news. The rate had improved to 45%, an eight-point drop from the original study. That is real progress worth acknowledging rather than downplaying, and it suggests the underlying models did get somewhat better at this specific task in the eight months between studies.</p>

  <p>The follow-up also broke the failure down further than the first pass did. 31% of responses in the second study showed sourcing deficiencies, meaning missing or incorrect attribution: the answer did not accurately say where its information came from. 20% showed major accuracy issues, meaning outdated information or outright hallucination. And the researchers' own framing of the result was pointed: the misrepresentation rate held at roughly this level regardless of language or territory tested, meaning this is not a quirk of one market or one language's training data being thinner than another's. It is a general property of how these systems currently handle news content, which is precisely why widening the sample did not move the headline number very much.</p>

  <h2>What this means if you depend on being represented correctly</h2>

  <p>None of this is a reason for a brand to panic about AI engines specifically singling it out. These are studies of how AI engines handle established, professionally reported news content from one of the most heavily resourced newsrooms in the world, and they still got sourcing or facts wrong on roughly a third to half of tested answers. If a well-documented BBC story can be misquoted 13% of the time, a smaller brand with thinner, less consistently maintained public information about it should reasonably assume its own baseline risk is at least as high, not lower.</p>

  <p>The practical takeaway is narrower and more useful than a blanket "AI can't be trusted." Being cited by an AI engine is not the same claim as being cited correctly. A brand that only checks whether it gets mentioned, and never checks what the mention actually says, is measuring half the question. The other half, whether the specific facts and quotes an engine attaches to a brand's name are the ones it actually said or did, is the half these two BBC studies show has real, measured reason for caution, not paranoia.</p>

  <p>Three checks are worth running against a brand's own answers, mirroring exactly what the BBC checked against its own journalism. First, does an AI-generated answer that mentions the brand cite a real source, and does that source actually say what the answer claims it says. Second, are quotes attributed to the company or its people rendered exactly as said, not paraphrased into something sharper or subtly different. Third, is the underlying fact current, given that both BBC studies found accuracy issues clustering around outdated information almost as often as outright fabrication. None of these checks require special tooling. They require actually reading the answer an engine gives, rather than assuming a mention is automatically a fair one.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>The gap between "mentioned" and "mentioned correctly" is not a hypothetical. It is a measured 45 to 51% issue rate on one of the best-resourced, most carefully documented content sources an AI engine has to draw on. A brand relying on AI engines to represent it accurately has a real, sourced reason to check rather than assume, and this is the exact failure mode the next piece in this series turns into two live lawsuits.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-047
ARTICLES.append(dict(
    slug="bg-047", bid="BG-047", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Brand Risk", "AI Accuracy", "Legal"],
    title="What Happens When an AI Overview Accuses Your Company of Something It Never Did",
    h1="What Happens When an AI Overview Accuses Your Company of <em>Something It Never Did</em>",
    h1_plain="What Happens When an AI Overview Accuses Your Company of Something It Never Did",
    subtitle="A Minnesota solar installer says a false AI Overview claim cost it a $150,000 contract and up to $210 million in total damages. A Canadian musician says a false claim got his concert canceled. Two live lawsuits, and a practical answer for what a brand can actually do about it.",
    meta_desc="Wolf River Electric v. Google and Ashley MacIsaac v. Google: two 2026 lawsuits over false claims inside AI Overviews, the measured customer and revenue impact, and what a brand can do to catch a false claim before a customer does.",
    og_desc="A named customer canceled a $150,000 contract after seeing a false AI Overview claim. A Canadian musician's concert was canceled after another. Both companies allege Google's AI cited real sources that didn't actually say what it claimed.",
    ld_desc="A summary of two 2026 lawsuits, Wolf River Electric v. Google and Ashley MacIsaac v. Google, over false claims generated by Google AI Overviews, including the alleged financial and reputational damages and practical monitoring guidance for brands.",
    keywords="AI Overview false information lawsuit, Google AI defamation, Wolf River Electric Google lawsuit, AI Overview accuracy risk, monitor what AI says about my brand, AI hallucination brand damage",
    about=["Brand Risk", "AI Accuracy", "Legal Developments", "AI Visibility Monitoring"],
    findings=[("$150,000", "the contract a named customer canceled after seeing Google's false AI Overview claim about Wolf River Electric"),
              ("$24.7M", "damages Wolf River Electric alleges for 2024 alone, inside a $110 to $210 million total claim"),
              ("March 2026", "when Wolf River Electric filed suit in Minnesota after AI Overviews falsely named it a defendant in an unrelated deceptive-lending case"),
              ("May 2026", "when Canadian musician Ashley MacIsaac filed suit in Ontario after an AI Overview falsely identified him as a sex offender, leading to a canceled concert")],
    faq=[("What did Google's AI Overview get wrong about Wolf River Electric?",
          "AI Overviews stated that Wolf River Electric, a Minnesota solar installer, was a defendant in a Minnesota Attorney General lawsuit over deceptive lending practices. A real lawsuit of that description existed, but against four other companies, not Wolf River Electric. The company's complaint alleges Google's AI Overview cited real sources that did not actually contain the claim attributed to them."),
         ("How much is Wolf River Electric seeking in damages?",
          "The company alleges $24.7 million in damages for 2024 alone, tied to a named customer canceling a $150,000 contract after seeing the false claim, and is seeking $110 to $210 million in total damages. Google moved the case to federal court, and per a January 2026 ruling, missed a filing deadline in the proceeding."),
         ("What happened in the Ashley MacIsaac case?",
          "Ashley MacIsaac, a Canadian musician, filed suit in Ontario Superior Court in May 2026 alleging an AI Overview falsely identified him as a sex offender. He says a scheduled concert was canceled as a direct result."),
         ("What can a brand actually do to catch a false AI claim before it costs a customer?",
          "Check what AI engines are actually saying about the brand on an ongoing basis, rather than finding out from a lost customer or a canceled booking. In the Wolf River Electric case, the false claim appears to have reached a customer with a six-figure contract before the company had reason to check what Google's AI Overview said about it at all.")],
    related=[_R_046, _R_043, _R_035],
    cta_h="See what AI engines say about your brand, before a customer does",
    cta_p="Run your brand through the same engines this research covers and read the actual answer. Catching a false claim early costs a few minutes. Finding out from a canceled contract costs a great deal more.",
    body="""  <p>An AI Overview does not need to invent a company's name to damage it. It only needs to attach the wrong true story to the right real name. Two lawsuits filed in 2026, on two continents, are now testing in court exactly what happens when it does.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Both cases below are drawn from court filings as reported by named outlets, not from a company's own press release or a secondhand summary. Where a detail comes from one side's complaint rather than a settled finding of fact, that is the nature of an active lawsuit and is stated as an allegation, not a verdict.</p>
  </div>

  <p>Both cases are being watched beyond their own facts, because the legal question underneath them, whether an AI-generated answer can create liability the way traditional publication does, remains largely untested by courts. That is part of why the procedural details matter as much as the headline claims: Google's own response so far in the Wolf River Electric case, moving the matter to federal court and then missing a filing deadline, is the kind of detail worth tracking for what it shows about how the case is actually proceeding, rather than how either side characterizes it in public.</p>

  <h2>Wolf River Electric v. Google: a real lawsuit, the wrong defendant</h2>

  <p>Wolf River Electric, a Minnesota solar installer, filed suit against Google in March 2026 after Google's AI Overviews began telling searchers the company was a defendant in a Minnesota Attorney General lawsuit over deceptive lending practices. A lawsuit like that did exist. Wolf River Electric was not one of the companies named in it; the real defendants were four other companies entirely. According to the complaint, Google's AI Overview cited real, legitimate sources in support of the claim, sources that, on inspection, did not actually contain the claim being attributed to them.</p>

  <p>That detail is worth sitting with on its own, because it is a distinct failure mode from an AI simply inventing a source that does not exist. It means a reader checking the citation would find a legitimate, professionally published source, and could reasonably conclude the claim had been verified, when according to the complaint it had not been. A citation that resolves to a real page is not the same thing as a citation that supports the claim attached to it.</p>

  <p>The company says the damage was concrete and traceable to a specific decision, not abstract reputational drift. A named customer canceled a $150,000 contract after seeing the false claim. Wolf River Electric alleges $24.7 million in damages for 2024 alone and is seeking $110 to $210 million in total damages. Google moved the case to federal court, and per a January 2026 ruling, missed a filing deadline in the proceeding.</p>

  <h2>Ashley MacIsaac v. Google: a false claim with an immediate real-world consequence</h2>

  <p>The second case is smaller in dollar terms and just as stark in its mechanism. Ashley MacIsaac, a Canadian musician, filed suit in Ontario Superior Court in May 2026 alleging that an AI Overview falsely identified him as a sex offender. He says a scheduled concert was canceled as a direct result of the claim reaching someone in a position to cancel a booking on the strength of it.</p>

  <p>Where Wolf River Electric's alleged harm is commercial, a lost contract with a specific dollar figure attached, MacIsaac's is personal and reputational: being falsely labeled a sex offender is a categorically different kind of claim than being falsely named in a business lawsuit. Read together, the two cases show this failure mode is not confined to B2B contexts or to companies large enough to have a legal team watching for it. It reaches an individual's reputation just as directly as it reaches a company's revenue.</p>

  <p>Different underlying facts, the same structural failure in both cases: a real, checkable claim exists somewhere in the world, an AI answer attaches it to the wrong subject, and the consequence lands on the person or company that did nothing wrong, on a timeline measured in days rather than the months it would take to resolve the matter through a correction request or a court.</p>

  <h2>What a brand can actually do about it</h2>

  <p>Neither case argues that AI engines are reckless by design, and neither is a reason for blanket paranoia about being mentioned by one at all. What both demonstrate, with real financial and personal consequences attached rather than as an abstract risk, is that a false claim about a specific brand or person can appear inside an AI answer, get cited to sources that do not actually support it, and cost real money or real bookings before anyone at the company or the person affected finds out.</p>

  <p>The practical defense is unglamorous: know what these engines are actually saying about a brand on an ongoing basis, rather than finding out from a lost customer. Neither Wolf River Electric nor Ashley MacIsaac appears to have had any warning before the damage was done, and in Wolf River's case specifically, the false claim had already reached a customer with a six-figure contract before the company had reason to check what Google's AI Overview said about it. A brand that checks its own AI answers regularly, across the engines its customers actually use, catches a claim like this one while it is still just one bad answer, not yet a canceled contract or a canceled concert.</p>

  <p>Neither case is presented here as proof that AI Overviews are broken as a product. They are two concrete, checkable examples of a specific failure mode, and two live data points showing courts are now being asked to decide what recourse exists for the party actually accused of something it never did. That question will take years to settle. Knowing what an engine currently says about a brand does not require waiting for the answer.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Both lawsuits are still working through the courts, and neither is a verdict yet. What is already settled is the mechanism: a real claim, attached to the wrong subject, spreading through an answer surface most brands never check. Catching that early is a monitoring problem, not a legal one, and it is a solvable one long before it becomes the other kind.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-048
ARTICLES.append(dict(
    slug="bg-048", bid="BG-048", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Buyer Guide", "Competitive Landscape", "Methodology Transparency"],
    title="Inside the GEO Tool Review-Site Economy",
    h1="Inside the GEO Tool <em>Review-Site Economy</em>",
    h1_plain="Inside the GEO Tool Review-Site Economy",
    subtitle="Two vendors in this category publish no pricing anywhere, so anyone researching them, including this site, ends up leaning on a layer of comparison sites that often cite each other. Here is how to tell an independent review from an affiliate funnel.",
    meta_desc="Two GEO vendors publish no public pricing at all, forcing reliance on third-party review sites. What that review-site layer looks like, why this site itself drew on it, and four checks to tell independent research from an affiliate funnel.",
    og_desc="Rankability, CheckThat.ai, tooldirectory.ai, Indexly, Naridon, Surferstack. Seven secondary sources this site itself leaned on for vendor pricing that no vendor disclosed directly. Here is what that says about the category, honestly.",
    ld_desc="An examination of the secondary comparison and review sites that have grown up around the GEO and AI-visibility tool category, including this site's own reliance on them, and a practical checklist for evaluating a review's independence.",
    keywords="best GEO tools review, GEO tool comparison sites, affiliate GEO tool reviews, how to evaluate a GEO tool, AI visibility tool review methodology, GEO vendor pricing not public",
    about=["Buyer Guide", "Competitive Landscape", "Methodology Transparency", "GEO Tools"],
    findings=[("7", "secondary review or comparison sites this research itself drew on for GEO vendor pricing and details: Rankability, CheckThat.ai, tooldirectory.ai, Indexly, Naridon, Surferstack, AI Visibility Guides"),
              ("2", "vendors in this category, Bluefish AI and Goodie AI, that publish no pricing page anywhere, forcing anyone researching them to rely on a third party"),
              ("404", "the status code Bluefish AI's own pricing URL returns; every call to action on the site is a demo request instead"),
              ("4", "checks a reader can run to tell a disclosed-methodology review from a content-mill or affiliate-motivated one")],
    faq=[("Why does even a research-focused site like this one cite secondary review sites?",
          "Because at least two vendors in this category, Bluefish AI and Goodie AI, publish no pricing information anywhere on their own sites. Anyone trying to understand what these tools actually cost, including the research behind this article, has nowhere to go except a third party that claims to have gotten a number. Naming that plainly is more useful to a reader than pretending around it."),
         ("How can I tell if a GEO tool review is independent or an affiliate funnel?",
          "Check four things: does it disclose an affiliate relationship, does it describe its own testing method rather than just asserting a ranking, does it cite primary sources like the vendor's own pricing page rather than only other review sites, and is its 'best of' list suspiciously identical in order and reasoning to four or five other sites' lists."),
         ("Which GEO vendors publish no pricing at all?",
          "Bluefish AI and Goodie AI, in the research behind this piece. Bluefish AI's pricing URL returns a 404 and every call to action is a demo request; Goodie AI simply has no public pricing page that turned up in this pass. Both appear to be deliberate sales-gating choices rather than oversights."),
         ("Is there anything wrong with using a review site's ranking as a starting point?",
          "Not inherently. Pricing numbers, funding figures, and feature descriptions pulled from a review site are frequently accurate, since they were themselves pulled from the vendor's own materials somewhere upstream. The part that deserves more skepticism is the ranking and recommendation sitting on top of that information, not necessarily the raw facts underneath it.")],
    related=[_R_036, _R_040, _R_041],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Search "best GEO tool 2026" and most of what comes back is not independent journalism. It is a layer of comparison sites, several of which cite each other, republish similar rankings with minor reshuffling, and function at least partly as affiliate funnels. This site's own research into the category ran into that layer directly, and the honest thing to do is explain how, not pretend around it.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. This article is unusual for this site in that its subject is the research process itself: which sources a competitive-landscape pass on the GEO tool category actually had to draw on, and where those sources fell short of disclosed methodology, including in this site's own research.</p>
  </div>

  <h2>Why the review-site layer exists at all</h2>

  <p>Two vendors covered in this research pass, Bluefish AI and Goodie AI, publish no pricing information anywhere on their own sites. Bluefish AI's pricing page returns a 404; every call to action on the site is a demo request. Goodie AI simply has no public pricing page that turned up in this pass. That is a deliberate sales-gating choice by both companies, not an oversight, and it has a direct side effect: anyone trying to understand what these tools actually cost, including this research, has nowhere to go except a third party that claims to have gotten a number, whether from a sales call, a customer, or an estimate.</p>

  <p>That is exactly the position this research was in. Building an accurate picture of what the GEO tool category actually looks like meant drawing on secondary sources including Rankability, CheckThat.ai, tooldirectory.ai, Indexly, Naridon, Surferstack, and AI Visibility Guides for pricing detail and review context that no vendor disclosed directly. Naming that plainly is the point of this article, not an embarrassing footnote to bury.</p>

  <p>Sales-gating pricing behind a demo call is common in B2B software generally, and it lets a vendor negotiate rather than compete on a published number. It has a specific side effect in a category this new and this fast-moving, though: it hands the job of comparison shopping to whichever third party is willing to do the comparing, with no guarantee that party has the vendor's actual current pricing at all. Prices and packaging in this category change often enough that a comparison site's number can go stale within months, and a reader has no way to know how old the figure they are reading actually is.</p>

  <h2>The pattern worth watching for</h2>

  <p>Read enough of these comparison sites back to back and a shape emerges. Several "best of" lists carry near-identical rankings, in a similar order, with similar phrasing about each tool's strengths, which is consistent with sites drawing on each other rather than each running independent evaluation. Very few disclose whether they actually tested the tools themselves, on what prompts, over what period, or whether the company being reviewed is also a paying advertiser or affiliate partner on the same page. None of that makes the information on these sites worthless. Pricing numbers, funding figures, and feature descriptions pulled from a review site are frequently accurate, simply because they were themselves pulled from the vendor's own materials somewhere further upstream. It does mean the ranking and the recommendation sitting on top of that information deserves more skepticism than the raw facts underneath it.</p>

  <h2>Why the loop is not necessarily bad faith</h2>

  <p>None of this means every review site in the category is dishonest. Independent testing is expensive: it means creating accounts across a dozen or more paid tools, running the same prompts through each one, and tracking results over enough time to say something reliable about consistency, not just a single snapshot. Very few outlets, media or otherwise, can absorb that cost for a category this new, which is part of why so much of what circulates as "reviews" leans on secondhand comparison instead of original testing. That is a resourcing problem as much as an integrity one, and the two are worth separating: a site reusing another site's ranking because building its own independent evaluation is expensive is a different kind of shortcut than a site doing it because an affiliate commission depends on steering a reader toward a specific answer.</p>

  <h2>Four checks that separate a real review from a funnel</h2>

  <p>None of these require special tools, just reading past the headline. Does the page disclose an affiliate relationship, ideally near the top rather than buried in a footer link? Does it describe its own testing method, meaning what prompts it ran, on which accounts, over what window, rather than asserting a ranking with no visible process behind it? Does it cite primary sources, meaning the vendor's own pricing page or a funding announcement, rather than linking only to other review sites in the same category? And is its "best of" list suspiciously identical, in order and in reasoning, to four or five other sites' lists, which is the clearest single tell that the content was assembled from what already ranks well rather than from independent testing.</p>

  <p>A live example of why the "cite primary sources" check matters: one G2 reviewer of Peec AI reported that the advertised $95 entry price covered only three engines in their actual experience, while Peec AI's own pricing page lists six engines at every tier including its Starter plan. That is not necessarily a lie on either side, pricing pages change and individual accounts can differ, but it is exactly the kind of discrepancy a reader would never catch by reading only a comparison site's summary of a vendor's claims rather than the vendor's current page itself.</p>

  <p>A page that passes all four checks is worth trusting more than one that passes none. A page that fails all four is not necessarily lying, but it is not doing the work its confident tone implies either, and a buyer relying on it is inheriting whatever bias or gap sits upstream without knowing it is there. This site's own reliance on secondary sources for two vendors' pricing is exactly the kind of dependency this checklist is meant to surface, which is why it is disclosed above rather than left for a reader to discover on their own.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A category with vendors that gate their own pricing behind a demo call will always grow a layer of secondary sites trying to fill that gap. Some of those sites do real, disclosed work. Many recycle each other's rankings. The fix is not to avoid the layer entirely, it is often unavoidable, but to read it the way you would read any secondhand source: check what it discloses about itself before trusting what it says about anything else.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-049
ARTICLES.append(dict(
    slug="bg-049", bid="BG-049", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["AI Shopping", "Competitive Landscape", "AI Search Trends"],
    title="AI Shopping Agents Are a Different Visibility Problem Than Chat Answers",
    h1="AI Shopping Agents Are a <em>Different Visibility Problem</em> Than Chat Answers",
    h1_plain="AI Shopping Agents Are a Different Visibility Problem Than Chat Answers",
    subtitle="Daydream raised a $50 million seed, exited beta with 1.5 million shoppers and 10,000 indexed merchants, and confirmed brand partners including STAUD and Alice + Olivia. It is not a tool that measures AI visibility. It is a new surface a brand has to be visible inside.",
    meta_desc="Daydream, a $50 million-seeded AI shopping discovery agent with 1.5M+ shoppers and 10,000+ indexed merchants, illustrates why being cited well in ChatGPT and being surfaced by a shopping agent are two separate visibility problems.",
    og_desc="A brand's product being easy for an AI agent to buy once selected says nothing about whether it gets selected. Daydream sits upstream of checkout entirely, in a discovery layer with its own separate mechanics: merchant partnerships, not citations.",
    ld_desc="An explanation of how AI shopping discovery agents like Daydream present a visibility problem distinct from conversational AI answer engines, covering Daydream's scale and partner program and its relationship to agentic checkout infrastructure.",
    keywords="AI shopping visibility, Daydream AI shopping agent, AI shopping discovery platform, agentic commerce brand visibility, GEO for ecommerce brands, AI shopping agent vs chat answer",
    about=["AI Shopping", "Competitive Landscape", "AI Search Trends", "Ecommerce Strategy"],
    findings=[("$50M", "Daydream's seed funding, raised to launch its AI-powered shopping search and discovery platform"),
              ("1.5M+", "shoppers Daydream reported using the platform at beta exit"),
              ("10,000+", "merchants indexed inside Daydream at beta exit"),
              ("25+", "additional brands signed to Daydream's partner program beyond its confirmed live partners STAUD, Alice + Olivia, Couper, Cult Mia, and Hampden Clothing")],
    faq=[("What is Daydream, and is it a competitor to a GEO monitoring tool?",
          "Daydream is a consumer-facing AI shopping discovery platform for fashion and apparel, not a brand-monitoring tool. Every GEO vendor in this category sells a brand a way to check what other AI engines say about it; Daydream is a different kind of thing entirely, an AI answer surface itself that a brand needs to be visible inside, the same way it needs to be visible inside a ChatGPT or Perplexity answer."),
         ("How do brands get inside Daydream's shopping recommendations?",
          "Through a 'Powered by Daydream' partner program. Confirmed live brand partners include STAUD, Alice + Olivia, Couper, Cult Mia, and Hampden Clothing, with more than 25 additional brands signed. The program's specific terms are not public."),
         ("Is being visible in a conversational AI answer the same as being visible in an AI shopping agent?",
          "No. A conversational engine like ChatGPT or Perplexity retrieves and cites sources across the open web, weighing signals like third-party mentions and source freshness. A shopping agent like Daydream works from something closer to a merchant partnership and a product feed: what inventory is indexed, how current the feed is, and what commercial terms govern whether a brand's products get surfaced at all. Doing well in one says nothing about doing well in the other."),
         ("What is the Universal Commerce Protocol, and does it relate to Daydream?",
          "The Universal Commerce Protocol is an open standard, co-developed by Google and Shopify, letting AI agents complete checkout on a merchant's behalf. It is a checkout-layer standard, distinct from Daydream's discovery-and-recommendation layer. BG-043 and BG-039 cover the checkout mechanics in full.")],
    related=[_R_039, _R_043, _R_036],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Being cited correctly in a ChatGPT answer and being recommended by an AI shopping agent are not the same achievement, even though both get filed under "AI visibility" by most people describing the category. Daydream, a consumer-facing AI shopping discovery platform that launched out of a $50 million seed round, is the clearest live example of why the two are separate problems.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>. Daydream's funding, scale figures, and named partners are drawn from its own funding announcement and independent press coverage. Its partner-program terms are not public and are described here as undisclosed rather than assumed.</p>
  </div>

  <h2>Daydream is not a monitoring tool. It is the surface itself</h2>

  <p>Every other vendor named across this site's competitive research, Profound, Peec AI, AthenaHQ, and the rest, sells a brand a way to check what other AI engines say about it. Daydream is a different kind of thing entirely: a consumer product a shopper actually uses to discover fashion and apparel, the way someone might once have opened a search engine or a retailer's own site. It exited beta with more than 1.5 million shoppers and over 10,000 indexed merchants, and it counts confirmed live brand partners including STAUD, Alice + Olivia, Couper, Cult Mia, and Hampden Clothing, with more than 25 additional brands signed. Brands join through a "Powered by Daydream" partner program whose terms are not public.</p>

  <p>That makes Daydream an answer surface a brand needs to be visible inside, structurally the same category of problem as needing to be visible inside a ChatGPT or Perplexity answer. It is not a tool a brand buys to measure something else. It is the something else. And the scale is not a rounding error next to the wider category: 10,000 indexed merchants means Daydream has already ingested a meaningful share of the fashion and apparel market as structured inventory, in something closer to how a marketplace indexes a seller's catalog than how a search engine crawls a web page.</p>

  <h2>Two different visibility problems wearing the same name</h2>

  <p>The mechanics that decide whether a brand shows up well inside a conversational AI answer and the mechanics that decide whether it shows up well inside a shopping-specific agent are not the same mechanics, even though both get called "AI visibility" in casual conversation. A conversational engine like ChatGPT or Perplexity is retrieving and citing sources across the open web, weighing signals like third-party mentions, source freshness, and how clearly a claim is stated on a page. A shopping agent like Daydream is working from something closer to a merchant partnership and a product feed: what inventory is actually indexed, how current and complete that feed is, and what commercial terms govern whether and how a brand's products get surfaced to a shopper browsing inside the platform.</p>

  <p>A brand that has done real work to be well cited in ChatGPT answers has not automatically done anything to be surfaced inside a shopping agent, and the reverse holds too. These are two problems that happen to share a category label, not one problem with two names. A retailer serious about AI visibility now has to ask both questions separately: how do conversational engines describe us, and how do the AI shopping agents shoppers actually browse inside decide what to show them.</p>

  <h2>Two different teams, doing two different kinds of work</h2>

  <p>The practical split shows up in who inside a company actually owns each problem. Winning at chat-answer visibility looks like familiar GEO work: earning third-party mentions, keeping product and company information accurate and current across the open web, and making specific claims easy for a retrieval system to find and quote cleanly. Winning at shopping-agent visibility looks more like retail operations: applying to or negotiating a partner program in the first place, keeping a product feed accurate down to individual inventory, and meeting whatever data-quality bar the platform requires before it will surface a listing at all.</p>

  <p>A marketing team can do the first without ever touching the second. A merchandising or ecommerce-operations team can do the second without marketing being involved, or even aware it happened. That split is worth naming explicitly, because a brand that assumes one team's work automatically covers the other is likely to discover the gap only when a shopper on Daydream never sees them at all, despite strong presence everywhere a conversational engine looks.</p>

  <h2>Where this sits next to agentic checkout</h2>

  <p>Daydream is a discovery and recommendation layer, distinct from the emerging agentic checkout mechanics covered in depth elsewhere on this site: the Universal Commerce Protocol Google and Shopify co-developed, and Microsoft's Copilot Checkout, both covered fully in <a href="/bg-043.html">BG-043</a> and <a href="/bg-039.html">BG-039</a>. The short version worth carrying here is that discovery and checkout are becoming separate infrastructure layers, often built by different companies. A brand's product being easy for an agent to purchase once selected says nothing about whether it gets selected in the first place. A product that clears checkout instantly via UCP or Copilot Checkout but is never surfaced by a discovery layer like Daydream never reaches that checkout step at all. Discovery is the earlier, and arguably more foundational, half of the problem, and Daydream sits squarely inside it.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>A brand that only tracks its presence in conversational AI answers is measuring one surface out of a growing set. Daydream shows a second one already has real scale, 1.5 million shoppers and 10,000 merchants at beta exit, with its own separate mechanics for who gets surfaced. Treat "AI visibility" as a category of problems to solve one surface at a time, not a single score one tool can hand you.</p>
  </div>""",
))


# ============================================================
# Batch appended 2026-08-13 (fourth pass): BG-050 to BG-054
# (5 shorter blog posts from scripts/articles_content_batch4.py,
# merged in after review)
# ============================================================

CTA_H_DEFAULT = "See your own number, not someone else's case study"
CTA_P_DEFAULT = "Run your domain through the same engines this research covers. You get the answer on screen, with the method disclosed, in about a minute. No signup and no card."

# ---------------------------------------------------------------------------
# Cross-references into earlier batches, copied verbatim so this file has no
# import dependency on articles_content.py.
# ---------------------------------------------------------------------------
_R_035 = ("/bg-035.html", "BG-035", "The Complete Map of AI Citation Research in 2026",
          "Five disclosed studies, side by side, the source for most of the correlation and technique findings this batch cites.")
_R_036 = ("/bg-036.html", "BG-036", "The Real GEO Tool Buyer's Guide: 13 Vendors, Actual Pricing, and the Costs Nobody Puts in the Headline",
          "The full vendor-by-vendor pricing table this piece isolates one comparison from, rather than repeating.")
_R_037 = ("/bg-037.html", "BG-037", "Why No Two AI Visibility Scores Ever Agree, and How to Read One Anyway",
          "The SparkToro consistency finding behind why a single self-audit run is close to meaningless on its own.")
_R_038 = ("/bg-038.html", "BG-038", "Six AI Citation Claims the Industry Keeps Repeating",
          "The matched-control schema study and the other claim-by-claim checks this batch cites directly.")
_R_039 = ("/bg-039.html", "BG-039", "The Zero-Click Shift: Inside the Data Showing How AI Search Is Rerouting the Internet",
          "Where the G2 buyer-behavior figure this piece expands on first appeared, as one data point among several.")
_R_040 = ("/bg-040.html", "BG-040", "Is GEO Just SEO With a New Name? We Checked What 8 Legacy SEO Tools Actually Built",
          "What legacy SEO platforms' AI features are actually built on, relevant to trusting any tool's checked box.")
_R_042 = ("/bg-042.html", "BG-042", "The GEO Funding Boom, Mapped: $300 Million and a Billion-Dollar Valuation in Two Years",
          "The full round-by-round funding timeline this piece draws its vendor totals from.")
_R_043 = ("/bg-043.html", "BG-043", "What Google's May 2026 AI Overviews Overhaul Actually Changed for Brands",
          "The inline-citation placement change behind one specific checklist item.")
_R_044 = ("/bg-044.html", "BG-044", "How ChatGPT, Gemini, Perplexity and Claude Actually Pick Their Sources",
          "The four engine-specific retrieval mechanics this batch's per-engine recommendations are built on.")
_R_045 = ("/bg-045.html", "BG-045", "What the People Who Actually Study This Think Is Coming Next",
          "The self-reported survey data on marketing leaders' AEO investment plans, a different kind of buyer-behavior number than this piece's audience-adoption figures.")
_R_046 = ("/bg-046.html", "BG-046", "The BBC Tested AI News Accuracy Twice. It's Still Wrong on Sourcing Three Times Out of Ten",
          "The measured accuracy issue rate behind why a self-audit needs to check facts, not just check for a mention.")
_R_047 = ("/bg-047.html", "BG-047", "What Happens When an AI Overview Accuses Your Company of Something It Never Did",
          "Two live lawsuits showing what an uncaught false claim can actually cost.")
_R_048 = ("/bg-048.html", "BG-048", "Inside the GEO Tool Review-Site Economy",
          "The Peec AI pricing discrepancy this piece treats as one example among several, not the whole story.")

# Cross-references within this batch.
_R_050 = ("/bg-050.html", "BG-050", "Bootstrapped vs. Venture-Backed: Does the Funding Show Up in the Product?",
          "Whether more venture funding bought a GEO vendor more pricing transparency. It didn't, reliably.")
_R_052 = ("/bg-052.html", "BG-052", "A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
          "The fuller version of this checklist, with the reasoning behind each item spelled out.")

# ---------------------------------------------------------------- BG-050
ARTICLES.append(dict(
    slug="bg-050", bid="BG-050", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Funding", "Competitive Landscape", "Buyer Guide"],
    title="Bootstrapped vs. Venture-Backed: Does the Funding Show Up in the Product?",
    h1="Bootstrapped vs. Venture-Backed. <em>Does the Funding</em> Show Up in the Product?",
    h1_plain="Bootstrapped vs. Venture-Backed: Does the Funding Show Up in the Product?",
    subtitle="Six GEO-native vendors raised over $300 million between them, one to a $1 billion valuation. Three built the same category of tool with no outside money at all. We checked what the funding actually bought buyers, and the honest answer is not much pricing transparency.",
    meta_desc="Bootstrapped GEO vendors (Otterly.AI, Rankscale, Waikay) against venture-backed ones (Profound, Peec AI, Bluefish AI) on pricing transparency and buyer complaints, sourced August 2026.",
    og_desc="Bluefish AI raised $63 million and still won't publish a price. AthenaHQ raised $2.7 million and leads with no paywalling. Funding size and pricing transparency don't move together in this category.",
    ld_desc="A comparison of bootstrapped and venture-backed AI visibility vendors on pricing transparency, feature completeness, and documented buyer complaints, drawn from a competitive-landscape research pass.",
    keywords="bootstrapped vs venture-backed GEO tools, GEO startup funding comparison, does GEO tool funding matter, AthenaHQ vs Profound pricing, GEO vendor pricing transparency, best funded AI visibility tool",
    about=["Generative Engine Optimization", "Competitive Analysis", "Startup Funding", "SaaS Buying Guide"],
    findings=[("$63M", "raised by Bluefish AI, the most of any vendor here besides Profound, for a product whose own pricing page returns a 404"),
              ("$2.7M", "AthenaHQ's total funding, the smallest venture-backed name in the category, and the only one built around a stated no-paywall pricing pledge"),
              ("3 platforms", "what one G2 reviewer says Peec AI's $95/month entry price actually covered them for, against 6 listed on the vendor's own current pricing page"),
              ("0", "of the three bootstrapped vendors that publish no pricing at all; that distinction belongs to two of the venture-backed names instead")],
    faq=[("Does more venture funding buy a GEO vendor better pricing transparency?",
          "No, not reliably. The two largest funding rounds in this category, Profound's $155 million and Bluefish AI's $63 million, sit behind the two least transparent pricing pages: Profound publishes no Enterprise number at all, and Bluefish's pricing URL returns a 404. The smallest venture-backed round, AthenaHQ's $2.7 million, sits behind the most transparent pricing structure in the category."),
         ("Which bootstrapped GEO vendors are worth considering?",
          "Otterly.AI, Rankscale and Waikay are the three bootstrapped names in the category, all self-serve and priced under $100 a month at entry. Otterly's real-world cost can run well above its $189 headline once you add commonly needed engines, but that gap is at least documented on the vendor's own page, unlike two of the venture-backed names that publish no pricing at all."),
         ("Are the venture-backed GEO vendors more feature-complete than the bootstrapped ones?",
          "Not clearly. Rankscale, bootstrapped, claims the broadest named engine count in the category at 17 or more. AthenaHQ, the smallest venture-backed name, includes all 8 of its engines at every tier with no paywalling. Feature completeness in this research pass tracked the individual vendor's own pricing philosophy more than it tracked how much money that vendor had raised."),
         ("Why does Bluefish AI have no public pricing at all?",
          "It's a deliberate enterprise-only sales motion, not an oversight. Every call to action on Bluefish's site is a demo request, and independent estimates put its contracts at $100,000 to $500,000 a year. That's a legitimate go-to-market choice for a company selling to Fortune 500 buyers, but it means a smaller buyer comparison-shopping this category gets no more clarity from Bluefish's $63 million in funding than from a vendor that raised nothing at all.")],
    related=[_R_036, _R_042, _R_048],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Profound raised $155 million and became the category's first unicorn in eighteen months. Bluefish AI raised $63 million and still won't tell you what it costs. Otterly.AI raised nothing at all and will tell you exactly what it costs, provided you read past the headline number to the three add-ons most buyers assume are already included. If venture funding bought GEO vendors anything reliable, it isn't pricing honesty, and it isn't obviously feature completeness either. Here is what the same research that built this site's buyer's guide and funding timeline found when the two groups are actually placed side by side.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>, drawn directly from the competitive-landscape research document behind this site's existing vendor coverage. Nothing below restates the full pricing table or the full funding timeline; both already exist in full elsewhere on this site and are linked rather than repeated. This piece isolates one comparison neither of those pieces made explicitly: bootstrapped against venture-backed, checked against the documented buyer complaints in the same research pass.</p>
  </div>

  <h2>Three vendors built this without outside money</h2>

  <p><strong>Otterly.AI</strong> (Austria, founded 2024), <strong>Rankscale</strong> (founded 2024) and <strong>Waikay</strong> (UK, founded 2025) are the three bootstrapped names in this category's current field. None has taken outside venture funding. All three lead with affordability: Waikay's $19.95 a month is the cheapest headline price found anywhere in the category, Rankscale's $20 a month Essentials tier is close behind, and Otterly's $29 a month Lite plan undercuts every venture-backed competitor's entry price by a wide margin.</p>

  <h2>Six vendors raised outside money, most of it in the last two years</h2>

  <p>On the other side sit <strong>Profound</strong> ($155M, $1B valuation as of its February 2026 Series C), <strong>Peec AI</strong> ($29.1M), <strong>Bluefish AI</strong> ($63M), <strong>Scrunch AI</strong> ($19M), <strong>Evertune</strong> ($20M) and <strong>AthenaHQ</strong> ($2.7M). The full timeline, investors and round dates for all six are covered in <a href="/bg-042.html">our earlier mapping of the GEO funding boom</a>. What matters for this piece is not the rounds themselves but what each company chose to build with the money, and specifically whether a buyer evaluating any of these thirteen vendors gets a clearer answer about price from the well-funded half than the unfunded half.</p>

  <h2>The bootstrapped gotcha: Otterly's headline price is not the real price</h2>

  <p>Start with the bootstrapped side's own weak point, because it exists and naming it first is the honest way into this. Otterly.AI's $189 a month Standard plan includes exactly 4 core engines: ChatGPT, Google AI Overviews, Perplexity and Microsoft Copilot. Gemini, Google AI Mode and Claude, three engines most buyers in 2026 assume are simply part of what "AI visibility monitoring" means, are each separate paid add-ons, ranging from $9 to $439 a month depending on plan tier. Add the three most commonly requested ones and a $189 plan can land closer to $300 or more before a buyer has changed anything else about their usage. <a href="/bg-036.html">Our full pricing breakdown</a> covers the mechanics in detail. It is a real, documented gap between the number on the page and the number on the invoice, and it belongs to the cheapest, least-funded vendor in this comparison, not the most expensive one.</p>

  <h2>The venture-backed side's version is worse, and it is opacity rather than a gotcha</h2>

  <p>What the well-funded half does instead is not hide a real number behind a smaller one. Two of the six venture-backed names publish no number at all. <strong>Bluefish AI</strong>, $63 million raised, has a pricing URL that returns a 404; every call to action on its site is a demo request, and independent estimates put its contracts at $100,000 to $500,000 a year. <strong>Evertune</strong>, $20 million raised, publishes an $800 a month Pro tier on its own site, but a separate independent review claims an actual price floor closer to $3,000 a month on an annual contract with a $36,000 minimum, a figure this research could not reconcile against Evertune's own published number. <strong>Profound</strong>, the category's only unicorn at $155 million raised, publishes Starter and Growth tiers but no Enterprise number at all; third-party reviews estimate $2,000 to $5,000 or more a month, not a figure Profound itself has confirmed anywhere this research could find.</p>

  <p>Peec AI adds a third kind of opacity, smaller in scale but sharper as an example, because it is a direct contradiction rather than a missing page. Its own pricing page currently lists 6 models at every tier, including the $95 a month Starter plan. A G2 reviewer, however, described that same $95 entry price as covering only 3 platforms in their actual experience, with each additional engine sold separately at roughly $35 a month. Neither figure has been independently confirmed as the current one, and <a href="/bg-048.html">a separate piece on this site</a> already covers that exact discrepancy as a case study in how hard this category is to research from the outside. What matters here is narrower: a buyer reading only Peec AI's pricing page, backed by $29.1 million in venture funding, gets no more certainty about the real cost than a buyer reading Otterly's page with its openly disclosed add-on structure. Disclosed uncertainty and undisclosed uncertainty read very differently to a buyer, and the venture-backed vendor's version is the one that's harder to catch.</p>

  <h2>The exception, and it belongs to the smallest check written</h2>

  <p>If there is a genuine transparency leader in this comparison, it is not the biggest round. <strong>AthenaHQ</strong> raised $2.7 million across two seed rounds, the smallest venture-backed total in this category by a wide margin, and used that money to launch with all 8 of its named engines included at every price tier, including its $95 a month introductory rate, with no engine paywalling at all. That structure is the opposite of Otterly's add-on ladder and the opposite of Profound's undisclosed Enterprise number, and it came from the company that raised the least, not the most.</p>

  <h2>What this actually tells a buyer</h2>

  <p>Reading the two groups side by side, the honest conclusion is that funding size predicts almost nothing about how a GEO vendor prices itself. The two largest rounds in this category, Profound's and Bluefish's, sit behind the two least transparent pricing pages. The smallest venture-backed round, AthenaHQ's, sits behind the most transparent one. The cheapest bootstrapped vendor, Otterly, has a real and documented gap between its headline and its invoice, but that gap is at least visible on the vendor's own page if a buyer reads the whole thing, which is more than can be said for a pricing page that simply doesn't exist. None of this means funding is irrelevant to a vendor's roadmap or its ability to survive a slow quarter. It means a buyer choosing between a bootstrapped and a venture-backed GEO tool gains nothing by assuming the better-funded one will be the more honest one about what it costs.</p>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p>Check the pricing page before you check the funding page. A vendor's Crunchbase total is a fact about its investors' confidence, not a fact about whether you'll be able to predict your own bill. In this category, as of this research pass, the two correlate less than either group's marketing would suggest.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-051
ARTICLES.append(dict(
    slug="bg-051", bid="BG-051", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["AI Search Trends", "Buyer Behavior", "Original Research"],
    title="Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
    h1="Who's Actually Starting Their Search in AI Now? <em>The Numbers</em>, by Buyer Type",
    h1_plain="Who's Actually Starting Their Search in AI Now? The Numbers by Buyer Type",
    subtitle="31.3% of the US population is forecast to use generative AI search at all this year. 66% of 18-24 year-olds already say they use ChatGPT to find information. 51% of B2B software buyers now start their research in a chatbot instead. One trend, three very different starting lines.",
    meta_desc="Who starts their search in AI now, broken down by general population (31.3%), Gen Z (66%), and B2B software buyers (51%, up from 29%), sourced August 2026 with methodology caveats disclosed.",
    og_desc="General population: 31.3%. Gen Z: 66% use ChatGPT to find information. B2B buyers: 51%, up from 29% sixteen months earlier. One shift, moving at three different speeds depending who you ask.",
    ld_desc="A breakdown of AI search adoption by segment, general population, Gen Z, and B2B software buyers, comparing EMARKETER, Fractl/Search Engine Land, and G2 figures with methodology disclosure noted.",
    keywords="who uses AI search, AI search adoption by generation, B2B buyers AI chatbot research, Gen Z ChatGPT usage statistics, generative AI search adoption 2026, EMARKETER AI search forecast",
    about=["AI Search Trends", "Buyer Behavior", "Original Research Synthesis", "B2B Marketing"],
    findings=[("31.3%", "of the US population forecast to use generative AI search at all during 2026, per an EMARKETER forecast"),
              ("66%", "of 18-24 year-olds who say they use ChatGPT to find information, per a Fractl and Search Engine Land survey of over 2,000 consumers"),
              ("51%", "of B2B software buyers who now start their research inside an AI chatbot instead of a search engine, up from 29% in April 2025, per G2's 2026 AI Search Insight Report"),
              ("71%", "of B2B software buyers who say they rely on AI chatbots for software research at all, up from roughly 60% seven months earlier")],
    faq=[("What percentage of people are actually using AI to search right now?",
          "It depends heavily on who you ask. EMARKETER forecasts roughly 31.3% of the US population using generative AI search at all during 2026. Among 18-24 year-olds specifically, a Fractl and Search Engine Land survey found 66% say they use ChatGPT to find information. Among B2B software buyers specifically, G2's 2026 AI Search Insight Report found 51% now start research in a chatbot instead of a search engine."),
         ("Is Gen Z really more likely to search with AI than everyone else?",
          "On the available evidence, yes, and by a wide margin. The 66% figure for 18-24 year-olds is more than double the general-population estimate of 31.3%. It measures self-reported ChatGPT use for finding information broadly rather than a share of all searches, but even read narrowly it shows a cohort already past the point where AI search is a minority behavior."),
         ("Are B2B software buyers actually researching purchases in ChatGPT now?",
          "The data says this is the fastest-moving of the three segments measured here. G2's report found 51% of B2B software buyers now start research in an AI chatbot, up from 29% in April 2025, a 22-point jump in about a year, and 71% say they rely on chatbots for software research at all. This is a named vendor report with methodology only partially disclosed in the material available, so it should be read as G2's finding rather than an independently audited figure, but the direction is stark regardless."),
         ("Which businesses should treat this shift as most urgent right now?",
          "B2B software sellers, based on this data, even though their raw percentage is lower than Gen Z's. The B2B figure describes people already inside a purchase decision, and it moved 22 points in about a year. A young consumer using ChatGPT to find information is a real and growing audience, but a buyer who has already shifted their purchase research into a chatbot is a higher-stakes audience to be invisible to right now.")],
    related=[_R_039, _R_045, _R_036],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>Three surveys published in 2026 asked versions of the same question, who is actually starting their search in an AI chatbot instead of a search engine, and got three very different numbers back, because they asked three very different audiences. Read separately, each number is a data point. Read together, they show a shift moving at noticeably different speeds depending on who is doing the searching, which matters more for deciding where to worry first than any single headline figure does on its own.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>Live research pass, <strong>13 August 2026</strong>, drawn directly from an AI-search-trends research document covering platform behavior and audience adoption. Two honesty flags carried forward from that research rather than smoothed over: the EMARKETER population forecast and the Fractl and Search Engine Land generational figure are both named, dated sources, but the material available in this pass did not include a full breakdown of either study's underlying sample or method beyond what each outlet reported. G2's 2026 AI Search Insight Report is a named vendor report whose methodology is only partially disclosed in the material available here. All three are presented as exactly what they are, sourced figures with real but uneven disclosure behind them, not as one audited number.</p>
  </div>

  <h2>The general population: roughly three in ten</h2>

  <p>EMARKETER's forecast puts <strong>31.3%</strong> of the US population using generative AI search at all during 2026. That is the broadest and least segmented of the three figures here, covering everyone from someone who has tried ChatGPT once out of curiosity to someone who has fully replaced their search engine habit. As a single population-wide number, it is useful mainly as a floor: whatever the more specific numbers below show, the overall base rate this year sits somewhere close to three people in ten.</p>

  <h2>Gen Z: already past the halfway mark</h2>

  <p>A Fractl and Search Engine Land survey of more than 2,000 consumers found <strong>66%</strong> of 18-24 year-olds say they use ChatGPT specifically to find information. That is more than double the general-population figure above, and it is the sharpest generational split in this research: a cohort that has grown up with a chat interface as a default rather than an add-on is already past the point where AI search is a minority behavior for them. It is worth being precise about what this figure does and doesn't claim. It measures self-reported ChatGPT use for finding information broadly, not a share of all searches or a share of purchase research specifically, and it names one product rather than the category of AI search tools as a whole. Read narrowly, it still says something a general population figure can't: for the audience that will make up an increasing share of every consumer market's future buyers, the old assumption that a search engine is the default starting point is already false for a solid majority.</p>

  <h2>B2B software buyers: the number that moved fastest</h2>

  <p>The steepest trajectory in this research belongs to a much narrower, much more commercially consequential group. G2's 2026 AI Search Insight Report found <strong>51%</strong> of B2B software buyers now start their research inside an AI chatbot instead of a search engine, up from 29% in April 2025. That is a 22-point jump inside roughly a year. A second figure from the same report widens the picture: 71% of B2B software buyers say they rely on AI chatbots for software research at all, up from roughly 60% about seven months earlier. Both numbers describe people actively evaluating a purchase, not casually looking something up, which is the detail that separates this figure from the two population-level ones above. <a href="/bg-039.html">This site's earlier look at the broader zero-click and AI-referral traffic shift</a> flagged this same G2 finding in passing as one data point among several traffic-side numbers; it deserves the closer look this piece gives it, because a buyer already inside a purchase decision is a fundamentally higher-stakes audience to be invisible to than a browser doing general research.</p>

  <h2>Three speeds, one direction, different urgency</h2>

  <div class="compare-table-wrap">
  <table class="compare-table">
    <thead><tr><th>Audience</th><th>Figure</th><th>What it measures</th><th>Source</th></tr></thead>
    <tbody>
      <tr><td>General US population</td><td>31.3%</td><td>Any use of generative AI search during 2026</td><td>EMARKETER forecast</td></tr>
      <tr><td>18-24 year-olds</td><td>66%</td><td>Self-reported ChatGPT use to find information</td><td>Fractl / Search Engine Land, 2,000+ consumers</td></tr>
      <tr><td>B2B software buyers</td><td>51%, up from 29%</td><td>Starting purchase research in an AI chatbot instead of a search engine</td><td>G2 2026 AI Search Insight Report</td></tr>
    </tbody>
  </table>
  </div>

  <p>None of these three figures were measured the same way, on the same population, at the same moment, and they should not be averaged into one number. What they show together is more useful than any single one of them alone: the shift is real across every audience tested, but it is not arriving at the same speed everywhere. A brand selling to the general population has, on this data, a few more years of runway than the base rate alone might suggest. A brand selling to a young, digitally native consumer base is already past the point where AI search is a marginal behavior. And a B2B software company selling into a buying committee is watching its own prospects cross from a minority habit to a majority one inside about a year, in the exact moment those prospects are deciding what to purchase.</p>

  <h2>Who should treat this as most urgent right now</h2>

  <p>If forced to rank the three, the honest read of the numbers points at B2B software sellers first, not because the raw percentage is highest, Gen Z's 66% is larger, but because of what the number is measuring and how fast it moved. A young consumer using ChatGPT to find information is a real and growing audience, but "finding information" covers a lot of low-stakes behavior. A B2B buyer who has shifted their purchase research into a chatbot, at a rate that rose 22 points in a year, is doing something with direct commercial consequence for every vendor they might have found through a search engine instead. A software company that has never checked what AI chatbots say about it when a buyer asks a category question is, per this data, already missing a majority of the audience that used to find it another way.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Three audiences, three speeds, one direction. The number that should worry a given business is not the biggest one in this piece, it is the one that describes its own buyers. For a B2B software company specifically, that number went from 29% to 51% in about a year, which is not a trend to watch from a distance.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-052
ARTICLES.append(dict(
    slug="bg-052", bid="BG-052", date="2026-08-13", date_label="August 13, 2026", read=7,
    tags=["How To", "GEO Playbook", "AI Citation"],
    title="A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
    h1="A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity <em>and Claude</em>",
    h1_plain="A Practical Playbook for Getting Cited by ChatGPT, Gemini, Perplexity and Claude",
    subtitle="Nine recommendations, each one traced back to a specific finding already published and sourced on this site, plus three things not to do that keep getting recommended anyway.",
    meta_desc="An actionable GEO playbook for getting cited by ChatGPT, Gemini, Perplexity and Claude, with every recommendation traced to a disclosed study already published on this site.",
    og_desc="Every recommendation in this playbook links back to the specific study it's based on. No recommendation appears here that doesn't trace to a finding this site already published and sourced.",
    ld_desc="A synthesis playbook for generative engine optimization across ChatGPT, Gemini, Perplexity and Claude, with every recommendation cited to a disclosed-methodology study covered elsewhere on this site.",
    keywords="AI citation playbook, how to get cited by ChatGPT, GEO strategy 2026, how to rank in AI search, generative engine optimization tactics, get cited by Gemini Perplexity Claude, GEO checklist",
    about=["Generative Engine Optimization", "AI Citation Research", "Content Strategy", "Platform Mechanics"],
    findings=[("5", "content techniques with real, measured evidence behind them, out of nine tested in the field's founding academic study"),
              ("4", "techniques that same study found did nothing or hurt, including keyword stuffing"),
              ("84%", "of AI citations trace to earned media rather than a brand's own website, per the study behind recommendation one"),
              ("4", "engines this playbook covers separately, because each one retrieves and cites sources through a genuinely different mechanism")],
    faq=[("Is there one universal GEO strategy that works across ChatGPT, Gemini, Perplexity and Claude?",
          "No. The four engines retrieve and cite sources through four genuinely different mechanisms, covered in full in BG-044. Content structured for one engine's mechanics does not automatically transfer to another's, which is why this playbook splits recommendations six through nine by engine rather than treating AI search as one target."),
         ("Does keyword stuffing help get cited by AI?",
          "No. The Princeton, Georgia Tech, Allen Institute and IIT Delhi paper that founded the field tested Keyword Stuffing directly and found it produced no gain or actively hurt, alongside three other commonly recommended techniques, per BG-035."),
         ("What matters more for AI citation, my own website or third-party coverage?",
          "Third-party coverage, by a wide margin on the disclosed evidence. Muck Rack's 25-million-link study found earned media accounts for 84% of all AI citations, while paid or advertorial content sits at 0.3%, per BG-035."),
         ("Will adding schema markup get me cited by AI?",
          "Not on its own. A matched-control test of 1,885 pages found no statistically significant citation increase from adding JSON-LD schema on any platform tested, per BG-038. Schema correlates with citation because sites that add it also tend to invest more broadly in SEO, not because the markup itself causes citation.")],
    related=[_R_035, _R_038, _R_044],
    cta_h="See where you already stand before you start", cta_p="Run your domain through the same four engines this playbook covers. You'll see, on screen, which of these recommendations you already satisfy and which ones are still open.",
    body="""  <p>Most "GEO strategy" content invents its own rules. This one doesn't. Every recommendation below traces to a specific, disclosed-methodology finding this site has already published, with a link to the article that owns it. Nothing here is new research. It is nine numbered pieces from work you can already check, arranged into something you can actually act on this week.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a synthesis piece, not new research. Every recommendation below is drawn from findings already established and sourced in <a href="/bg-035.html">BG-035's map of disclosed AI citation research</a>, <a href="/bg-038.html">BG-038's claim-by-claim myth-bust</a>, and <a href="/bg-044.html">BG-044's engine-by-engine mechanics breakdown</a>. No recommendation appears here unless it traces to a specific finding already published on this site, dated <strong>13 August 2026</strong> for this synthesis pass.</p>
  </div>

  <h2>Five things to do, based on what actually moved a number</h2>

  <h3>1. Earn third-party mentions before you polish your own site</h3>
  <p>Muck Rack's 25-million-link study found earned media accounts for 84% of all AI citations, and paid or advertorial content is essentially never cited, at 0.3%, <a href="/bg-035.html">per BG-035</a>. If your GEO budget is going entirely into your own website, it is going into the smallest of the three categories that study measured.</p>

  <h3>2. Prioritize YouTube mentions specifically, then branded web mentions</h3>
  <p>Ahrefs' 75,000-brand correlation study found YouTube mentions correlate strongest with citation across ChatGPT, Google AI Mode and Google AI Overviews, ahead of branded web mentions, branded anchor text, and branded search volume, with Domain Rating and raw backlink count the weakest signals tested, <a href="/bg-035.html">also covered in BG-035</a>. It is correlation, not causation, and the study says so plainly, but of everything tested it is the strongest single signal on record.</p>

  <h3>3. State the specific claim and its source close together</h3>
  <p>The Princeton, Georgia Tech, Allen Institute and IIT Delhi paper that founded the field found Cite Sources produced a real, measurable lift, and specifically a 115% visibility jump for a page that started ranked fifth, meaning the technique helped weaker pages more than pages that were already doing well, <a href="/bg-035.html">per BG-035</a>. Write the checkable claim and the thing that supports it in the same sentence or the same short paragraph, not the claim broadly stated with a citation dumped in a references section at the end.</p>

  <h3>4. Use direct statistics and real quotations, not paraphrase</h3>
  <p>The same paper found Statistics Addition produced the largest single lift of any technique tested, up to 41%, and Quotation Addition reached around 43% on one metric, <a href="/bg-035.html">per BG-035</a>. A page making a claim in vague, unsourced prose is doing less work than the same claim stated as a specific number or a direct quote.</p>

  <h3>5. Update your best older pages instead of only publishing new ones</h3>
  <p>Seer Interactive's study of 47,097 citations found sustained citation tracks moderate freshness, not maximum freshness: pages cited consistently across a four-month window averaged a median content age of six months, while pages that got a single spike citation skewed much younger, <a href="/bg-035.html">per BG-035</a>. Most of what these engines reward as freshness comes from edits to older pages, not a constant stream of brand-new content. If you have a page that already earns citations, editing it on a schedule is a better use of time than writing a replacement.</p>

  <h2>Four things to do differently per engine</h2>

  <h3>6. Treat ChatGPT's citation as binary, and stop chasing its search-trigger rate</h3>
  <p>ChatGPT's citation model has no equivalent of a numbered position, a brand is either cited in a given response or it isn't, <a href="/bg-044.html">per BG-044</a>. OpenAI has never disclosed how often ChatGPT triggers a live web search before answering, and every specific percentage in circulation is a third-party estimate, not an OpenAI number, <a href="/bg-038.html">per BG-038</a>. The practical version of both facts together: don't build a strategy around gaming one assumed trigger rate. Build for consistent, citable presence so that whenever a search does happen, you're part of what it finds.</p>

  <h3>7. Account for Gemini's grounding as a metered, modular step</h3>
  <p>Gemini retrieves through Grounding with Google Search, now billed on a usage basis since January 2026, and a single prompt can trigger more than one billable search if the model decides it needs several, <a href="/bg-044.html">per BG-044</a>. Content aimed at Gemini benefits from being the kind of source a single, well-targeted grounding call would actually retrieve rather than requiring an engine to synthesize across many separate searches to find you.</p>

  <h3>8. Write for breadth on Perplexity, and expect it to read the whole page</h3>
  <p>Perplexity's own description of its architecture claims an index of over 200 billion URLs per query and describes retrieving and reading candidate pages directly rather than relying on a snippet alone, <a href="/bg-044.html">per BG-044</a>. That description comes from the vendor itself and isn't independently audited, but the shape of the bet is clear: breadth and freshness of retrieval are Perplexity's stated differentiator, which rewards a page that is genuinely complete on the specific question being asked, not one relying on a search engine having already indexed a thin summary.</p>

  <h3>9. Don't expect Claude to cite you as often as the others, and write for its filtering step</h3>
  <p>Claude cites a source in only 55% of its responses, against ChatGPT's 96% and Gemini's 82%, per Muck Rack's study <a href="/bg-035.html">covered in BG-035</a>. Claude's newer web search tool also adds dynamic filtering, letting Claude write code to discard search results before they ever enter its context, rather than reading everything retrieved, <a href="/bg-044.html">per BG-044</a>. A low Claude citation count doesn't automatically mean you have a Claude-specific visibility gap; it may simply reflect that Claude rarely cites anyone. Track it separately from the other three rather than averaging it into one score.</p>

  <h2>Three things not to do</h2>

  <div class="callout">
    <div class="callout-label">Do not rely on schema markup alone</div>
    <p>Ahrefs matched 1,885 pages that added JSON-LD schema against control pages with similar existing citation levels and found no statistically significant citation increase on any of the three platforms tested, with AI Overviews citations actually falling 4.6%, <a href="/bg-038.html">per BG-038's full myth-bust</a>. Schema correlates with citation because sites that add it also tend to invest more broadly in technical SEO, not because the markup itself moves the needle.</p>
  </div>

  <div class="callout">
    <div class="callout-label">Do not stuff keywords or pad content</div>
    <p>The same founding academic study that found five techniques worked also found four that didn't: Keyword Stuffing, Easy-to-Understand simplification, Content Padding, and Pure Persuasive Language all produced no gain or actively hurt, <a href="/bg-035.html">per BG-035</a>. Two of the most commonly repeated pieces of GEO advice, add more keywords and make it easier to read, are directly contradicted by the study most GEO advice claims to be built on.</p>
  </div>

  <div class="callout">
    <div class="callout-label">Do not build one strategy around one engine's mechanics</div>
    <p>Four engines, four genuinely different retrieval architectures, no shared underlying playbook, <a href="/bg-044.html">per BG-044</a>. Content structured to be easy for Perplexity's reranking pipeline to surface is not automatically well positioned for Gemini's grounding call or safe from Claude's dynamic filtering. Treat a gap on one engine as a fact about that engine's architecture before assuming it's a fact about your content.</p>
  </div>

  <div class="callout teal">
    <div class="callout-label">The order that actually matters</div>
    <p>If you can only do three of the nine: earn third-party mentions first, since it's the largest disclosed factor at 84% of citations; state your checkable claims next to their sources, since it's cheap and directly tested; and update your best existing pages on a schedule, since sustained citation tracks moderate freshness, not new publishing. Everything else on this list compounds those three. None of it replaces them.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-053
ARTICLES.append(dict(
    slug="bg-053", bid="BG-053", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["How To", "Practical", "AI Visibility Measurement"],
    title="How to Read Your Own Brand's AI Answers Like an Auditor",
    h1="How to Read Your Own Brand's AI Answers <em>Like an Auditor</em>",
    h1_plain="How to Read Your Own Brand's AI Answers Like an Auditor",
    subtitle="No tool, no budget, about twenty minutes. What prompts to run, what to check for in each answer, and why running any one of them only once tells you close to nothing.",
    meta_desc="A step-by-step method for auditing your own brand's AI visibility by hand: which prompts to run, what to check for accuracy and sentiment, and why a single run is close to meaningless.",
    og_desc="Ask the category question, not your brand name. Check whether you're cited or just named. Check whether the facts are right. Then do it again tomorrow, because one run tells you almost nothing.",
    ld_desc="A practical, tool-free methodology for manually auditing a brand's presence in AI engine answers, covering prompt construction, accuracy checking, and run-to-run consistency.",
    keywords="how to check AI visibility, audit my brand in ChatGPT, AI visibility self-check, how to check if AI mentions my brand, AI brand audit method, check brand accuracy in AI answers",
    about=["AI Visibility Measurement", "Practical Methodology", "Brand Risk", "Generative Engine Optimization"],
    findings=[("2", "prompt types every self-audit needs: a direct-brand question and a category best-X-for-Y question"),
              ("<1 in 100", "chance an AI platform returns the same brand list twice for an identical question, the reason a single run is not a measurement"),
              ("4", "things to check in every answer: whether you're mentioned, whether you're cited with a real source, the sentiment, and whether the specific facts are correct"),
              ("45-51%", "the measured issue rate on AI news answers even from one of the best-documented sources in the world, the reason accuracy is worth checking and not assuming")],
    faq=[("How many times should I run the same prompt before I trust the result?",
          "More than once, ideally spread across two or three separate days rather than run back to back. SparkToro's study found less than a 1-in-100 chance an AI platform returns the same brand list twice for an identical question, covered in full in BG-037, so a single run is closer to one roll of a die than a measurement."),
         ("Should I ask the AI about my brand by name?",
          "Yes, but not only that. Asking about your brand by name tests recognition, which almost anything with a website clears. Asking the category question a real buyer would type, with no brand name in it, tests recommendation, which is the harder and more useful bar. Run both and compare what each one actually shows you."),
         ("What if the AI mentions me but the facts are wrong?",
          "Treat that as a real finding, not a minor detail. The BBC's own testing found 45 to 51% of AI answers about its news content had significant issues, including altered or fabricated quotes, covered in BG-046. A brand mentioned with a wrong fact attached is a different and often more damaging outcome than a brand that isn't mentioned at all, and two live lawsuits covered in BG-047 show what an uncaught version of this can cost."),
         ("How often should I repeat this audit?",
          "On a regular schedule rather than once and never again. The value of this method comes from tracking direction over time, not from a single snapshot. Repeating it monthly, or whenever you publish something you'd expect to change your visibility, is enough to tell whether things are actually moving.")],
    related=[_R_037, _R_046, _R_047],
    cta_h="Skip the stopwatch", cta_p="Our free test runs the direct and category prompts across the engines automatically and shows you the answer on screen. Then use the method below to read what it gives you.",
    body="""  <p>You don't need a subscription to find out what AI engines currently say about your brand. You need about twenty minutes, a short list of prompts, and a habit of writing down what you see instead of trusting your memory of it. This is the method, reduced to something you can actually run today, built entirely on findings this site has already measured and published.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a synthesis piece, not new research. The consistency reasoning behind Step 3 is drawn from <a href="/bg-037.html">BG-037's coverage of SparkToro's consistency study</a>. The accuracy-checking reasoning behind Step 2 is drawn from <a href="/bg-046.html">BG-046's BBC and EBU news-accuracy findings</a> and <a href="/bg-047.html">BG-047's coverage of two live lawsuits over false AI claims</a>. This piece assembles those findings into a method rather than re-deriving any of them, dated <strong>13 August 2026</strong> for this synthesis pass.</p>
  </div>

  <h2>Step 1: run two kinds of prompts, not one</h2>

  <p>Ask the AI about your brand by name, and separately, ask it the category question a buyer who has never heard of you would actually type. Both are worth running, but they test different things, and conflating them is the single most common mistake in a self-audit.</p>

  <p>Asking "What do you know about Acme Consulting?" tests recognition: whether the engine has heard of you at all. Almost anything with a website clears that bar. Asking "best project management consultants for a mid-size manufacturer" tests something much harder: whether the engine recommends you to somebody who never typed your name. The gap between the two is not small. A study of 175 brands across eight platforms found 96% were described accurately when asked about directly, but 89% never appeared at all in category-research answers. Recognition and citation are different skills, and most brands have one without the other. Run both prompts and you'll know immediately which one you actually have.</p>

  <h2>Step 2: read each answer for four separate things</h2>

  <p>Once you have an answer, don't just skim it for your name. Check four things, in order.</p>

  <ul>
    <li><strong>Are you mentioned at all?</strong> The baseline question, and the only one most people check.</li>
    <li><strong>Are you cited with a real source, or just named?</strong> A brand appearing in a numbered list with a citation attached is a different result from a brand mentioned in passing prose with nothing backing it. Click through the citation if one exists and confirm the source actually says what the answer claims it says.</li>
    <li><strong>What's the sentiment?</strong> Positive, neutral, or negative, read plainly rather than assumed. A mention is not automatically a good outcome.</li>
    <li><strong>Are the specific facts correct?</strong> This is the step most self-audits skip entirely, and it shouldn't be skipped. The BBC's own testing of AI news accuracy against its own reporting found 51% of answers had significant issues, improving to 45% in a larger follow-up study, with 31% still showing sourcing deficiencies, <a href="/bg-046.html">detailed fully in BG-046</a>. That's the error rate on one of the best-documented, most heavily resourced news sources in the world. A smaller brand with thinner public information about it should reasonably assume its own baseline risk is at least as high. And the stakes are not abstract: <a href="/bg-047.html">two live lawsuits</a> exist right now over exactly this failure mode, a real claim attached to the wrong company or person, with a canceled contract and a canceled concert as the documented consequences.</li>
  </ul>

  <h2>Step 3: never trust a single run</h2>

  <p>This is the step that changes everything else on this list. SparkToro's study of 2,961 individual queries across three major AI platforms found less than a 1-in-100 chance that the same platform, asked the identical question twice, returns the same list of brand recommendations, and roughly a 1-in-1,000 chance the list comes back in the same order, <a href="/bg-037.html">covered in full in BG-037</a>. That means one answer, on one day, is closer to a single roll of a die than a measurement. A gap that appears once might be noise. A gap that appears across several runs, spread across a few days, is not.</p>

  <p>The practical version of this: run each prompt more than once, ideally across two or three separate days rather than back to back in the same sitting, using a fresh conversation each time. Write down what changes and what stays the same. You are not looking for one number. You are looking for a direction: are you showing up more consistently over the runs, less consistently, or is nothing changing at all. That direction is the actual finding. A single answer, however good or bad it looks, is not.</p>

  <h2>What to do with what you find</h2>

  <p>If you're missing from the category question but present in the brand-name one, you have a recognition-without-citation gap, and third-party coverage is the more direct lever than anything on your own site. If you're cited but the facts are wrong, the specific claim and its source are worth checking directly against whatever the citation actually points to, since a wrong fact tied to a real-looking source is harder for a casual reader to catch than an obvious fabrication. If the answer changes substantially run to run, you don't have a fixed position to defend, you have a range to track, and the range itself is the number worth revisiting on a schedule rather than any single reading of it.</p>

  <div class="callout teal">
    <div class="callout-label">The takeaway</div>
    <p>Twenty minutes, two prompt types, four things to check per answer, and never fewer than two or three runs before drawing a conclusion. None of that requires a tool. It requires treating one AI answer the way you'd treat one data point anywhere else: interesting, not yet a finding.</p>
  </div>""",
))

# ---------------------------------------------------------------- BG-054
ARTICLES.append(dict(
    slug="bg-054", bid="BG-054", date="2026-08-13", date_label="August 13, 2026", read=6,
    tags=["Checklist", "GEO Playbook", "Content Strategy"],
    title="The GEO Content Checklist: What the Disclosed Research Actually Supports",
    h1="The GEO Content Checklist. <em>What the Disclosed Research</em> Actually Supports",
    h1_plain="The GEO Content Checklist: What the Disclosed Research Actually Supports",
    subtitle="Eight items, each one carrying a citation back to the specific published finding it's based on. Nothing here is a guess dressed up as a rule.",
    meta_desc="A checklist-format GEO content guide with every item cited to a disclosed-methodology study already published on this site: earned media, freshness, inline citations, schema, per-engine differences.",
    og_desc="Every item on this checklist links to the study it's based on. What it can't promise is stated just as plainly: correlational and single-study evidence, not a guarantee.",
    ld_desc="A checklist for content strategy aimed at AI citation, with each item traced to a specific disclosed-methodology study, and an explicit statement of what the checklist cannot promise.",
    keywords="GEO checklist, generative engine optimization checklist, AI citation checklist, GEO content strategy 2026, how to get cited by AI checklist, AI visibility content checklist",
    about=["Generative Engine Optimization", "Content Strategy", "AI Citation Research", "Methodology Transparency"],
    findings=[("8", "checklist items, each carrying a citation back to the specific finding it's based on"),
              ("1", "matched-control study behind the strongest single myth-bust on this list, schema markup"),
              ("5", "earlier articles this checklist draws its citations from, including one for a single specific item"),
              ("0", "guarantees; every item here is correlational or single-study evidence, not a promise of citation")],
    faq=[("Is this checklist guaranteed to get my content cited by AI?",
          "No, and it says so explicitly in its own closing section. Most items here are correlational or single-study evidence, not a proven causal formula. The one item backed by a matched-control test designed to isolate causation, schema markup, is a negative finding: it found no effect, not a guaranteed positive one."),
         ("What's the best-supported single item on this checklist?",
          "Item 1, earning third-party mentions, rests on the largest disclosed dataset in this batch, a 25-million-link study finding earned media accounts for 84% of AI citations. Item 6, on schema markup, is the most methodologically rigorous single test, a matched-control design that looked for a causal effect directly and found none."),
         ("Should I still add schema markup even though it doesn't move citation on its own?",
          "There's no harm shown in doing so, but don't expect it to be the lever that gets you cited. The matched-control study behind item 6 found no statistically significant citation increase from adding JSON-LD schema on any platform tested, with one platform's citations actually falling."),
         ("Does this checklist apply the same way to all four major engines?",
          "No, and item 7 exists specifically to say so. ChatGPT, Gemini, Perplexity and Claude retrieve and cite sources through genuinely different mechanisms, so checking citation-worthiness per engine rather than as one combined score is itself one of the eight items.")],
    related=[_R_035, _R_038, _R_044],
    cta_h=CTA_H_DEFAULT, cta_p=CTA_P_DEFAULT,
    body="""  <p>This is the compressed version. Where <a href="/bg-052.html">our fuller playbook</a> explains the reasoning behind each recommendation, this piece strips it down to a list you could follow top to bottom in one sitting, with the citation for each item kept visible rather than buried in a paragraph. The point of keeping the citations attached is not decoration. A checklist item with no source behind it is indistinguishable from a guess, and this category already has enough of those circulating under confident headlines.</p>

  <div class="callout">
    <div class="callout-label">How this was researched</div>
    <p>This is a synthesis piece, not new research. Every item below is drawn from findings already established and sourced in <a href="/bg-035.html">BG-035</a>, <a href="/bg-038.html">BG-038</a>, <a href="/bg-040.html">BG-040</a> and <a href="/bg-044.html">BG-044</a>, with one item additionally drawing on <a href="/bg-043.html">BG-043</a> for a detail specific to that item alone. Dated <strong>13 August 2026</strong> for this synthesis pass.</p>
  </div>

  <h2>The checklist</h2>

  <ol>
    <li><strong>Earn third-party mentions before polishing your own site.</strong> Earned media accounts for 84% of all AI citations, and paid or advertorial content is essentially never cited, <a href="/bg-035.html">per BG-035</a>.</li>
    <li><strong>Keep your best older pages updated instead of only publishing new ones.</strong> Sustained citation tracks moderate freshness, not maximum freshness; pages cited consistently over a four-month window skewed older than pages that got a single spike citation, <a href="/bg-035.html">per BG-035</a>.</li>
    <li><strong>State a specific, checkable claim next to the source that supports it, not in a separate references section.</strong> Google's May 2026 update moved inline citations to sit next to the specific sentence they support rather than bundled at the end of an answer, which changes what "citable content" looks like at the page level, <a href="/bg-043.html">per BG-043</a>.</li>
    <li><strong>Use direct statistics and real quotations instead of vague, unsourced claims.</strong> Statistics Addition produced the largest single lift in the field's founding study, up to 41%, and Quotation Addition reached around 43% on one metric, <a href="/bg-035.html">per BG-035</a>.</li>
    <li><strong>Write in a clear, authoritative voice, and don't stuff keywords or pad the content.</strong> The same study found Keyword Stuffing, Easy-to-Understand simplification, Content Padding, and Pure Persuasive Language all produced no gain or actively hurt, <a href="/bg-035.html">per BG-035</a>.</li>
    <li><strong>Don't expect schema markup alone to move your citation numbers.</strong> A matched-control test of 1,885 pages that added JSON-LD schema found no statistically significant citation increase on any platform tested, with one platform's citations actually falling, <a href="/bg-038.html">per BG-038</a>.</li>
    <li><strong>Check citation-worthiness per engine, not as one combined score.</strong> ChatGPT's citation model is binary with no ranked position, Gemini grounds through a metered per-query search call, Perplexity is architected around breadth of retrieval, and Claude cites far less often than the other three and filters results dynamically before they enter its context, <a href="/bg-044.html">per BG-044</a>.</li>
    <li><strong>Know what your existing SEO tool's "AI visibility" feature is actually built on before trusting it to cover any of the above.</strong> None of the nine legacy SEO platforms checked in one research pass built dedicated prompt-and-response infrastructure from scratch; all nine extended an existing keyword database or SERP-scraping pipeline, with real variance in how much of the resulting feature is genuinely new versus repackaged, <a href="/bg-040.html">per BG-040</a>.</li>
  </ol>

  <h2>What this checklist cannot promise</h2>

  <p>Every item above traces to a real, disclosed study, and none of them is a guarantee. It's worth being explicit about that rather than letting a numbered list imply more certainty than the underlying research supports.</p>

  <p>Items 1, 2, 4 and 5 are correlational, drawn from a single academic paper (items 4 and 5) or a single large observational study (items 1 and 2). Correlational evidence can be real and still not tell you that doing the thing causes the outcome; the paper behind items 4 and 5 is explicit that it tested this directly and found a genuine lift, which is stronger than pure correlation, but it is also a synthetic benchmark that predates 2026 by more than two years, and its findings may not generalize perfectly to today's production engines. Item 6 is the one item on this list backed by a matched-control test specifically designed to separate correlation from causation, which is why it's stated as a negative finding with more confidence than the positive items above it: the study didn't just fail to find a link, it looked for one directly and still found nothing. Item 7 describes documented architecture, not a tested outcome; it tells you the mechanisms differ, not exactly how much any specific tactic moves the needle on each one. Item 8 is a market observation about what a category of tools was built from, not a finding about content strategy at all, included here because it changes how much you should trust a checked box from a legacy tool's dashboard.</p>

  <p>None of this is a reason to ignore the list. It's a reason to treat each item as the best currently available evidence, not as a settled formula. A study getting updated, a platform changing its retrieval mechanics, or a larger sample contradicting a smaller one could move any single item here, and when that happens, the honest response is to update the item, not to have oversold it in the first place.</p>

  <p>It's also worth naming what a checklist like this cannot do even in principle. It cannot tell you how much any one item is worth relative to the others, since the underlying studies used different samples, different methods, and different measures of "citation" in the first place. It cannot promise a timeline, since none of the disclosed research behind these items measured how long a change takes to show up in an answer. And it cannot substitute for checking your own results directly. A checklist tells you where the disclosed evidence currently points. Only your own repeated, dated audit tells you whether following it actually changed anything for your brand specifically.</p>

  <div class="callout teal">
    <div class="callout-label">The rule this gives you</div>
    <p>A checklist that cites its sources can be checked, argued with, and updated when the evidence changes. A checklist that just asserts eight rules cannot. Every item above is the first kind, which is also the only honest reason to trust any of them.</p>
  </div>""",
))
