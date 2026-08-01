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
